import express from 'express';
import {fork,type ChildProcess} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {mkdir,rm,access} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {inputSchema,filename,isActive,type Job} from '../shared/config';
const app=express(),out=resolve(process.env.OUTPUT_DIR||'output');
await mkdir(out,{recursive:true});
const jobs=new Map<string,Job>();
let active:Job|undefined,child:ChildProcess|undefined;
app.disable('x-powered-by');
app.use(express.json({limit:'8kb'}));
// Local UI only: reject cross-origin mutations, including DNS rebinding requests.
app.use('/api',(req,res,next)=>{
 const host=req.hostname;
 if(!['localhost','127.0.0.1','::1'].includes(host)){res.status(403).json({error:'Accès local uniquement.'});return;}
 const origin=req.get('origin');
 if(origin&&origin!==`${req.protocol}://${req.get('host')}`){res.status(403).json({error:'Origine non autorisée.'});return;}
 next();
});
app.get('/api/health',async(_req,res)=>{try{await access(out);res.json({ok:true,activeJob:active&&isActive(active)?active:null});}catch{res.status(503).json({error:'Dossier de sortie indisponible.'});}});
app.post('/api/jobs',async(req,res)=>{
 const parsed=inputSchema.safeParse(req.body);
 if(!parsed.success){res.status(400).json({error:parsed.error.issues.map(i=>i.message).join(' ')});return;}
 if(active&&isActive(active)){res.status(409).json({error:'Un rendu est déjà en cours.'});return;}
 // Keep bounded in-memory history; completed exports remain in the volume.
 if(jobs.size>=100){const oldest=jobs.keys().next().value;if(oldest)jobs.delete(oldest);}
 const job:Job={id:randomUUID(),status:'preparing',progress:0,startedAt:Date.now(),filename:filename(parsed.data)};
 const path=join(out,`${job.id}.mp4`);
 jobs.set(job.id,job);active=job;
 const worker=fork(resolve('src/server/worker.ts'),[],{execArgv:['--import','tsx'],detached:true,env:{...process.env,RENDER_INPUT:JSON.stringify(parsed.data),RENDER_OUTPUT:path},stdio:['ignore','pipe','pipe','ipc']});
 child=worker;
 let lastError='';worker.stderr?.on('data',b=>{lastError=(lastError+String(b)).slice(-2000);});
 worker.on('message',(m:Partial<Job>)=>{if(job.status==='cancelling')return;if(m.status)job.status=m.status;if(m.renderStage)job.renderStage=m.renderStage;if(typeof m.cachedBackground==='boolean')job.cachedBackground=m.cachedBackground;if(typeof m.cachedExport==='boolean')job.cachedExport=m.cachedExport;if(typeof m.progress==='number')job.progress=Math.max(job.progress,m.progress);if(typeof m.renderedFrames==='number')job.renderedFrames=m.renderedFrames;if(typeof m.totalFrames==='number')job.totalFrames=m.totalFrames;if(m.estimatedRemainingSeconds!==undefined)job.estimatedRemainingSeconds=m.estimatedRemainingSeconds;if(typeof m.updatedAt==='number')job.updatedAt=m.updatedAt;if(typeof m.finishedAt==='number')job.finishedAt=m.finishedAt;if(m.error)job.error=m.error;});
 worker.on('error',e=>{job.status='error';job.error=e.message;});
 worker.on('exit',async()=>{
  if(job.status==='cancelling')job.status='cancelled';
  else if(isActive(job)){job.status='error';job.error=lastError||'Le processus de rendu s’est arrêté.';}
  if(job.status!=='done')await rm(path,{force:true});
  await rm(join(out,'.render-work',job.id),{force:true,recursive:true});
  if(child===worker)child=undefined;
 });
 res.status(202).json(job);
});
app.get('/api/jobs/:id',(req,res)=>{const job=jobs.get(req.params.id);if(!job){res.status(404).json({error:'Rendu introuvable.'});return;}res.json(job);});
app.delete('/api/jobs/:id',(req,res)=>{
 const job=jobs.get(req.params.id);
 if(!job){res.status(404).json({error:'Rendu introuvable.'});return;}
 if(active===job&&child&&isActive(job)){
  job.status='cancelling';const worker=child;worker.send('cancel');
  const timer=setTimeout(()=>{if(worker.pid&&worker.exitCode===null){try{process.kill(-worker.pid,'SIGKILL');}catch{/* Already stopped */}}},5000);timer.unref();
 }
 res.json(job);
});
app.get('/api/jobs/:id/download',(req,res)=>{const job=jobs.get(req.params.id);if(!job||job.status!=='done'){res.status(404).json({error:'Le fichier n’est pas prêt.'});return;}res.download(join(out,`${job.id}.mp4`),job.filename);});
app.use(express.static(resolve('dist/web')));
app.get('/{*path}',(_req,res)=>res.sendFile(resolve('dist/web/index.html')));
app.use((err:Error,_req:express.Request,res:express.Response,_next:express.NextFunction)=>{res.status(500).json({error:err.message||'Erreur du serveur local.'});});
const server=app.listen(Number(process.env.PORT||3001),process.env.HOST||'127.0.0.1',()=>console.log('Atelier prêt sur le port '+(process.env.PORT||3001)));
function shutdown(){if(child?.pid){try{process.kill(-child.pid,'SIGTERM');}catch{/* Already stopped */}}server.close(()=>process.exit());}
process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
