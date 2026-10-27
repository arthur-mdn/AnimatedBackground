import express from 'express';
import {fork,type ChildProcess} from 'node:child_process';
import {randomUUID,randomBytes} from 'node:crypto';
import {tmpdir} from 'node:os';
import {mkdir,rm,access,stat,symlink} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {inputSchema,filename,isActive,type Job} from '../shared/config';
import {createRequestOriginPolicy} from './requestOrigin';
import {securityConfig,VisitorSessions,WindowLimiter,type SecurityConfig} from './security';
import {cleanStorage,storageAvailable} from './storage';

type StoredJob={job:Job;owner:string;expiresAt:number;failure?:string};
type Options={out?:string;publicUrl?:string;config?:SecurityConfig;startWorker?:(env:NodeJS.ProcessEnv)=>ChildProcess;monitorMs?:number};
export async function createApplication(options:Options={}){
 const app=express(),out=resolve(options.out||process.env.OUTPUT_DIR||'output'),config=options.config||securityConfig();
 await mkdir(out,{recursive:true});
 const sessions=new VisitorSessions(config.sessionSecret,options.publicUrl?new URL(options.publicUrl).protocol==='https:':false,config.sessionSeconds);
 const requests=new WindowLimiter(60000),generations=new WindowLimiter(config.generationWindowMs);
 const jobs=new Map<string,StoredJob>(),downloads=new Map<string,number>();
 let active:StoredJob|undefined,child:ChildProcess|undefined,preparing=false,maintaining=false,closing=false;
 let watchdog:NodeJS.Timeout|undefined,killTimer:NodeJS.Timeout|undefined;
 let workerFinished:Promise<void>=Promise.resolve();
 const protectedFiles={has:(name:string)=>downloads.has(name)||!!(active&&child&&name===`${active.job.id}.mp4`)};
 await cleanStorage(out,config,protectedFiles);
 function stopWorker(reason?:string){
  if(!child||!active)return;
  if(reason)active.failure=reason;
  active.job.status='cancelling';
  const worker=child;
  if(worker.pid){try{process.kill(-worker.pid,'SIGTERM');}catch{/* Worker already exited. */}}
  if(!killTimer){killTimer=setTimeout(()=>{if(worker.pid){try{process.kill(-worker.pid,'SIGKILL');}catch{/* Already stopped. */}}},3000);killTimer.unref();}
 }
 async function maintain(){
  if(maintaining||preparing||closing)return;
  maintaining=true;
  try{
   if(child){if(!(await storageAvailable(out,config)).ok)stopWorker('Le rendu a été arrêté pour préserver l’espace disque du serveur.');}
   else await cleanStorage(out,config,protectedFiles);
   for(const [id,record]of jobs)if((record!==active||!child)&&record.expiresAt<=Date.now()){jobs.delete(id);if(record===active)active=undefined;}
  }catch{if(child)stopWorker('Le stockage du serveur est indisponible.');console.error('Contrôle du stockage impossible.');}
  finally{maintaining=false;}
 }
 const monitor=setInterval(()=>void maintain(),options.monitorMs??5000);monitor.unref();
 app.disable('x-powered-by');
 if(config.trustedProxies.length)app.set('trust proxy',config.trustedProxies);
 app.use((_req,res,next)=>{res.set({'X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'no-referrer','Permissions-Policy':'camera=(), microphone=(), geolocation=()','Content-Security-Policy':"frame-ancestors 'none'; object-src 'none'; base-uri 'self'"});next();});
 const acceptsRequest=createRequestOriginPolicy(options.publicUrl);
 app.use('/api',(req,res,next)=>{
  res.set('Cache-Control','no-store');
  if(!acceptsRequest({hostname:req.hostname,host:req.get('host')||'',protocol:req.protocol,origin:req.get('origin')})||req.get('sec-fetch-site')==='cross-site'){
   res.status(403).json({error:'Hôte ou origine non autorisé.'});return;
  }
  const rate=requests.consume(sessions.networkKey(req.ip||req.socket.remoteAddress||'unknown'),120);
  if(!rate.allowed){res.set('Retry-After',String(rate.retryAfter)).status(429).json({error:'Trop de requêtes. Réessayez dans un instant.'});return;}
  const owner=sessions.read(req);
  if(req.path==='/health'&&req.method==='GET')res.locals.owner=sessions.issue(res,Date.now(),owner||undefined);
  else if(!owner){res.status(401).json({error:'Rechargez la page pour démarrer une session sécurisée.'});return;}
  else res.locals.owner=owner;
  next();
 });
 app.use('/api',express.json({limit:'8kb',strict:true}));
 app.get('/api/health',async(_req,res)=>{
  try{await access(out);res.json({ok:true,busy:!!child||preparing,activeJob:active&&active.owner===res.locals.owner&&isActive(active.job)?active.job:null});}
  catch{res.status(503).json({error:'Service temporairement indisponible.'});}
 });
 app.post('/api/jobs',async(req,res)=>{
  if(!req.is('application/json')){res.status(415).json({error:'Le formulaire doit être envoyé en JSON.'});return;}
  const parsed=inputSchema.safeParse(req.body);
  if(!parsed.success){res.status(400).json({error:parsed.error.issues.map(i=>i.message).join(' ')});return;}
  if(closing||maintaining){res.status(503).json({error:'Maintenance du stockage en cours. Réessayez dans un instant.'});return;}
  if(child||preparing){res.status(409).json({error:'Un rendu est déjà en cours. Réessayez après sa fin.'});return;}
  const limits:[string,number][]=[['session:'+res.locals.owner,config.sessionGenerations],['ip:'+sessions.networkKey(req.ip||'unknown'),config.ipGenerations],['global',config.globalGenerations]];
  for(const [key,limit]of limits){const rate=generations.check(key,limit);if(!rate.allowed){res.set('Retry-After',String(rate.retryAfter)).status(429).json({error:'La limite de générations est atteinte. Réessayez plus tard.'});return;}}
  // Reserve before asynchronous disk checks, otherwise two simultaneous requests can fork.
  preparing=true;
  try{
   if(!(await cleanStorage(out,config,protectedFiles)).ok){res.status(503).json({error:'Espace disque insuffisant. Réessayez plus tard.'});return;}
   for(const [key,limit]of limits)generations.consume(key,limit);
   if(jobs.size>=1000){const oldest=[...jobs].find(([,r])=>r!==active);if(oldest)jobs.delete(oldest[0]);}
   const job:Job={id:randomUUID(),status:'preparing',progress:0,startedAt:Date.now(),filename:filename(parsed.data)};
   const record:StoredJob={job,owner:res.locals.owner,expiresAt:Date.now()+config.retentionMs};
   const path=join(out,`${job.id}.mp4`),work=join(out,'.render-work',job.id),temp=join(work,'tmp');
   await mkdir(temp,{recursive:true,mode:0o700});
   // Chromium's Unix socket path is limited to ~108 bytes. Keep a short alias
   // while the actual frame files remain inside the monitored output volume.
   const tempAlias=join(process.platform==='win32'?tmpdir():'/tmp','abr-'+randomBytes(8).toString('hex'));
   try{await symlink(temp,tempAlias,process.platform==='win32'?'junction':'dir');}
   catch{await rm(work,{recursive:true,force:true});throw new Error('Stockage temporaire indisponible.');}
   if(closing){await rm(tempAlias,{force:true});await rm(work,{recursive:true,force:true});res.status(503).json({error:'Le serveur redémarre.'});return;}
   const env={...process.env,SESSION_SECRET:undefined,RENDER_INPUT:JSON.stringify(parsed.data),RENDER_OUTPUT:path,TMPDIR:tempAlias,TMP:tempAlias,TEMP:tempAlias};
   let worker:ChildProcess;
   try{worker=options.startWorker?options.startWorker(env):fork(resolve('src/server/worker.ts'),[],{execArgv:['--import','tsx'],detached:true,env,stdio:['ignore','pipe','pipe','ipc']});}
   catch{await rm(tempAlias,{force:true});await rm(work,{recursive:true,force:true});throw new Error('Worker indisponible.');}
   jobs.set(job.id,record);active=record;child=worker;
   watchdog=setTimeout(()=>stopWorker('Le rendu a dépassé sa durée maximale autorisée.'),config.renderTimeoutMs);watchdog.unref();
   worker.stdout?.resume();worker.stderr?.resume();
   worker.on('message',(m:Partial<Job>)=>{
    if(record.failure||job.status==='cancelling')return;
    // Only accept the finite list of progress fields; never forward paths or worker errors.
    if(m.status&&['preparing','rendering','verifying','done','error','cancelled'].includes(m.status))job.status=m.status;
    if(m.renderStage&&['background','personalization','assembly'].includes(m.renderStage))job.renderStage=m.renderStage;
    for(const key of ['cachedBackground','cachedExport']as const)if(typeof m[key]==='boolean')job[key]=m[key];
    for(const key of ['renderedFrames','totalFrames','updatedAt','finishedAt']as const)if(typeof m[key]==='number'&&Number.isFinite(m[key]))job[key]=m[key];
    if(typeof m.progress==='number'&&Number.isFinite(m.progress))job.progress=Math.max(job.progress,Math.min(1,m.progress));
    if(m.estimatedRemainingSeconds===null||typeof m.estimatedRemainingSeconds==='number'&&Number.isFinite(m.estimatedRemainingSeconds))job.estimatedRemainingSeconds=m.estimatedRemainingSeconds;
    if(m.error)job.error='La génération a échoué. Réessayez avec une durée plus courte.';
   });
   worker.on('error',()=>{record.failure='Le moteur de rendu est indisponible.';});
   workerFinished=new Promise<void>(finished=>worker.once('close',()=>{void(async()=>{
    if(watchdog)clearTimeout(watchdog);if(killTimer)clearTimeout(killTimer);watchdog=undefined;killTimer=undefined;
    if(record.failure){job.status='error';job.error=record.failure;}
    else if(job.status==='cancelling')job.status='cancelled';
    else if(isActive(job)){job.status='error';job.error='Le processus de rendu s’est arrêté.';}
    try{await rm(tempAlias,{force:true});if(job.status!=='done')await rm(path,{force:true});await rm(work,{force:true,recursive:true});}
    catch{console.error('Nettoyage du rendu impossible.');}
    finally{if(child===worker)child=undefined;}
    await maintain();
   })().finally(finished);}));
   res.status(202).json(job);
  }catch{res.status(503).json({error:'Le rendu ne peut pas démarrer. Réessayez plus tard.'});}
  finally{preparing=false;}
 });
 function owned(id:string,owner:string){const record=jobs.get(id);return record&&record.owner===owner&&record.expiresAt>Date.now()?record:undefined;}
 app.get('/api/jobs/:id',(req,res)=>{const record=owned(req.params.id,res.locals.owner);if(!record){res.status(404).json({error:'Rendu introuvable ou expiré.'});return;}res.json(record.job);});
 app.delete('/api/jobs/:id',(req,res)=>{
  const record=owned(req.params.id,res.locals.owner);
  if(!record){res.status(404).json({error:'Rendu introuvable ou expiré.'});return;}
  if(active===record&&child&&isActive(record.job))stopWorker();
  res.json(record.job);
 });
 app.get('/api/jobs/:id/download',async(req,res)=>{
  const record=owned(req.params.id,res.locals.owner);
  if(!record||record.job.status!=='done'){res.status(404).json({error:'Le fichier n’est pas disponible ou a expiré.'});return;}
  const name=`${record.job.id}.mp4`,path=join(out,name);
  downloads.set(name,(downloads.get(name)||0)+1);
  const release=()=>{const count=(downloads.get(name)||1)-1;if(count)downloads.set(name,count);else downloads.delete(name);};
  try{
   const info=await stat(path);
   if(Date.now()-info.mtimeMs>=config.retentionMs)throw new Error('Expired.');
   res.download(path,record.job.filename,error=>{release();if(error){if(res.headersSent)res.destroy();else res.status(404).json({error:'Le fichier n’est plus disponible.'});}});
  }catch{release();res.status(404).json({error:'Le fichier n’est plus disponible.'});}
 });
 // Only generic, administrator-prepared scenery is public; personal exports stay owned.
 app.use('/client-backgrounds',express.static(join(out,'client-backgrounds'),{index:false,dotfiles:'deny',fallthrough:true,setHeaders:(res,path)=>{res.setHeader('Cache-Control',path.endsWith('manifest.json')?'no-cache':'public, max-age=31536000, immutable');}}));
 app.use('/client-backgrounds',(_req,res)=>{res.sendStatus(404);});
 app.use(express.static(resolve('dist/web')));
 app.get('/{*path}',(_req,res)=>res.sendFile(resolve('dist/web/index.html')));
 app.use((err:Error&{type?:string;status?:number},_req:express.Request,res:express.Response,_next:express.NextFunction)=>{
  if(res.headersSent){res.destroy();return;}
  const status=err.type==='entity.too.large'?413:err.type==='entity.parse.failed'?400:500;
  res.status(status).json({error:status===413?'Le formulaire est trop volumineux.':status===400?'Le formulaire JSON est invalide.':'Erreur interne du serveur.'});
 });
 return {app,async close(){closing=true;clearInterval(monitor);if(child)stopWorker('Le serveur redémarre.');await workerFinished;}};
}
