import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,writeFile,mkdir,utimes,readFile,access,lstat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {fork} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {once} from 'node:events';
import {createApplication} from '../src/server/app';
import {securityConfig,VisitorSessions,WindowLimiter} from '../src/server/security';
import {cleanStorage,storageAvailable} from '../src/server/storage';
import {defaults} from '../src/shared/config';
const pause=()=>new Promise(r=>setTimeout(r,25));
async function eventually(check:()=>Promise<boolean>){for(let i=0;i<160;i++){if(await check())return;await pause();}assert.fail('État attendu non atteint.');}
async function setup(t:any,overrides:Partial<ReturnType<typeof securityConfig>>={},monitorMs=10000){
 const out=await mkdtemp(join(tmpdir(),'ab-security-'));
 const config={...securityConfig({}),minFreeBytes:1,storageBytes:1024**2*50,...overrides};
 const application=await createApplication({out,config,monitorMs,startWorker:env=>fork(resolve('tests/fixtures/security-worker.mjs'),[],{execArgv:[],env,detached:true,stdio:['ignore','pipe','pipe','ipc']})});
 const server=application.app.listen(0,'127.0.0.1');await once(server,'listening');const address=server.address()as{port:number};const base=`http://127.0.0.1:${address.port}`;
 t.after(async()=>{await application.close();server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));await new Promise(r=>setTimeout(r,100));await rm(out,{recursive:true,force:true});});
 async function request(path:string,cookie='',method='GET',body?:unknown,headers:Record<string,string>={}){
  return fetch(base+path,{method,headers:{...(cookie?{Cookie:cookie}:{}),...(body!==undefined?{'Content-Type':'application/json'}:{}),...headers},body:body===undefined?undefined:JSON.stringify(body)});
 }
 async function visitor(){const r=await request('/api/health');assert.equal(r.status,200);return r.headers.get('set-cookie')!.split(';')[0];}
 return {out,request,visitor,config};
}
test('Isolation : aucun identifiant public, lecture/annulation/téléchargement réservés au visiteur',async t=>{
 const {request,visitor,out}=await setup(t);const a=await visitor(),b=await visitor();
 const noSession=await request('/api/jobs','','POST',defaults);assert.equal(noSession.status,401);
 const started=await request('/api/jobs',a,'POST',{...defaults,firstName:'HANG'});assert.equal(started.status,202);const job=await started.json();
 assert.equal('owner'in job,false);assert.equal('expiresAt'in job,false);
 const health=await request('/api/health',b);const publicHealth=await health.json();assert.equal(publicHealth.busy,true);assert.equal(publicHealth.activeJob,null);assert.ok(!JSON.stringify(publicHealth).includes(job.id));
 assert.equal((await(await request('/api/health',a)).json()).activeJob.id,job.id);
 for(const [path,method]of [[`/api/jobs/${job.id}`,'GET'],[`/api/jobs/${job.id}`,'DELETE'],[`/api/jobs/${job.id}/download`,'GET']])assert.equal((await request(path,b,method)).status,404);
 assert.equal((await request(`/api/jobs/${job.id}`,a)).status,200);
 await eventually(async()=>{try{await access(join(out,job.id+'.mp4.pid'));return true;}catch{return false;}});
 const descendant=Number(await readFile(join(out,job.id+'.mp4.pid'),'utf8'));
 const alias=await readFile(join(out,job.id+'.mp4.temp'),'utf8');assert.ok((alias+'/org.chromium.Chromium.XXXXXX/SingletonSocket').length<108);
 await access(join(out,'.render-work',job.id,'tmp','probe'));
 assert.equal((await request(`/api/jobs/${job.id}`,a,'DELETE')).status,200);
 await eventually(async()=>(await(await request(`/api/jobs/${job.id}`,a)).json()).status==='cancelled');
 await eventually(async()=>{try{process.kill(descendant,0);return false;}catch{return true;}});
 await eventually(async()=>{try{await lstat(alias);return false;}catch{return true;}});
 const done=await(await request('/api/jobs',a,'POST',defaults)).json();
 await eventually(async()=>(await(await request(`/api/jobs/${done.id}`,a)).json()).status==='done');
 assert.equal((await request(`/api/jobs/${done.id}/download`,a)).status,200);assert.equal((await request(`/api/jobs/${done.id}/download`,b)).status,404);
});
test('Limites : par session et IP, sans contournement avec une nouvelle session ou X-Forwarded-For',async t=>{
 const {request,visitor}=await setup(t,{sessionGenerations:1,ipGenerations:1});const a=await visitor();
 const job=await(await request('/api/jobs',a,'POST',defaults)).json();
 await eventually(async()=>(await(await request(`/api/jobs/${job.id}`,a)).json()).status==='done');await pause();
 const rate=await request('/api/jobs',a,'POST',defaults);assert.equal(rate.status,429);assert.ok(Number(rate.headers.get('retry-after'))>0);
 const b=await visitor();assert.equal((await request('/api/jobs',b,'POST',defaults,{'X-Forwarded-For':'8.8.8.8'})).status,429);
});
test('Timeout et consommation disque : arrêt des rendus et nettoyage des fichiers de travail',async t=>{
 const {request,visitor,out}=await setup(t,{renderTimeoutMs:300},30);const a=await visitor();
 const job=await(await request('/api/jobs',a,'POST',{...defaults,firstName:'HANG'})).json();
 await eventually(async()=>(await(await request(`/api/jobs/${job.id}`,a)).json()).status==='error');
 assert.match((await(await request(`/api/jobs/${job.id}`,a)).json()).error,/durée maximale/);
 await eventually(async()=>{try{await access(join(out,'.render-work',job.id));return false;}catch{return true;}});
});
test('Stockage : un dépassement pendant le rendu interrompt le worker',async t=>{
 const {request,visitor}=await setup(t,{storageBytes:32768},25);const a=await visitor();
 const r=await request('/api/jobs',a,'POST',{...defaults,firstName:'DISK'});assert.equal(r.status,202);const job=await r.json();
 await eventually(async()=>(await(await request(`/api/jobs/${job.id}`,a)).json()).status==='error');assert.match((await(await request(`/api/jobs/${job.id}`,a)).json()).error,/espace disque/);
});
test('Stockage : refus avant démarrage si réserve disque insuffisante',async t=>{
 const {request,visitor}=await setup(t,{minFreeBytes:Number.MAX_SAFE_INTEGER});const a=await visitor();assert.equal((await request('/api/jobs',a,'POST',defaults)).status,503);
});
test('Entrées : origine externe, JSON malformé, corps surdimensionné et fuite des erreurs internes',async t=>{
 const {request,visitor}=await setup(t);const a=await visitor();
 assert.equal((await request('/api/jobs',a,'POST',defaults,{Origin:'https://evil.example'})).status,403);
 assert.equal((await request('/api/jobs',a,'POST',defaults,{'Sec-Fetch-Site':'cross-site'})).status,403);
 assert.equal((await request('/api/jobs',a,'POST',{...defaults,firstName:'x'.repeat(9000)})).status,413);
 assert.equal((await request('/api/jobs',a,'POST','invalid-json-object')).status,400);
 const malformed=await request('/api/jobs',a,'POST',defaults,{'Content-Type':'text/plain'});assert.equal(malformed.status,415);
 const r=await request('/api/jobs',a,'POST',{...defaults,firstName:'FAIL'});const job=await r.json();
 await eventually(async()=>(await(await request(`/api/jobs/${job.id}`,a)).json()).status==='error');
 const error=JSON.stringify(await(await request(`/api/jobs/${job.id}`,a)).json());assert.ok(!error.includes('sensitive'));assert.ok(!error.includes('/internal/path'));
});
test('Cookies signés : HttpOnly/SameSite/Secure, altération et expiration rejetées',()=>{
 const sessions=new VisitorSessions('s'.repeat(32),true,60);let cookie='';const res={append(_name:string,value:string){cookie=value;}};
 const id=sessions.issue(res as any,1000000000000);assert.match(cookie,/^__Host-ab_session=/);assert.match(cookie,/HttpOnly/);assert.match(cookie,/SameSite=Strict/);assert.match(cookie,/; Secure/);assert.ok(!cookie.includes('Domain='));
 assert.equal(sessions.read({headers:{cookie}},1000000000001),id);assert.equal(sessions.read({headers:{cookie}},1000000060000),null);
 assert.equal(sessions.read({headers:{cookie:cookie.replace(id,'0'.repeat(64))}},1000000000001),null);
 const other=new VisitorSessions('t'.repeat(32),true);assert.equal(other.read({headers:{cookie}},1000000000001),null);
});
test('Limiteur borné : refus plutôt qu’éviction, renouvellement après expiration',()=>{
 const limiter=new WindowLimiter(1000,1);assert.equal(limiter.consume('a',1,0).allowed,true);assert.equal(limiter.consume('a',1,1).allowed,false);assert.equal(limiter.consume('b',1,1).allowed,false);assert.equal(limiter.consume('b',1,1000).allowed,true);
});
test('Configuration : proxys explicites, limites et secret valides',()=>{
 for(const env of [{TRUST_PROXY_CIDRS:'true'},{TRUST_PROXY_CIDRS:'1'},{TRUST_PROXY_CIDRS:'10.0.0.0/33'},{OUTPUT_MAX_MB:'-1'},{SESSION_SECRET:'short'}])assert.throws(()=>securityConfig(env));
 assert.deepEqual(securityConfig({TRUST_PROXY_CIDRS:'172.20.0.2/32,::1/128'}).trustedProxies,['172.20.0.2/32','::1/128']);
});
test('Rétention : suppression exports et caches personnels expirés, protection des téléchargements',async()=>{
 const out=await mkdtemp(join(tmpdir(),'ab-retention-'));try{
 const config={...securityConfig({}),storageBytes:1024**2,minFreeBytes:1,retentionMs:1000};const id=randomUUID(),protectedId=randomUUID(),old=new Date(Date.now()-5000);
 for(const name of [id+'.mp4',protectedId+'.mp4','unrelated.txt']){await writeFile(join(out,name),'saved');await utimes(join(out,name),old,old);}
 for(const kind of ['exports','screens','backgrounds']){const dir=join(out,'.cache','layers-v1',kind);await mkdir(dir,{recursive:true});const suffix=kind==='exports'?'.mp4':'.mov';const path=join(dir,'a'.repeat(64)+suffix);await writeFile(path,'cache');await utimes(path,old,old);await writeFile(join(dir,'a'.repeat(64)+'.json'),'{}');}
 await cleanStorage(out,config,new Set([protectedId+'.mp4']));await assert.rejects(access(join(out,id+'.mp4')));await access(join(out,protectedId+'.mp4'));await access(join(out,'unrelated.txt'));
 await assert.rejects(access(join(out,'.cache','layers-v1','exports','a'.repeat(64)+'.mp4')));await assert.rejects(access(join(out,'.cache','layers-v1','screens','a'.repeat(64)+'.mov')));await access(join(out,'.cache','layers-v1','backgrounds','a'.repeat(64)+'.mov'));
 assert.equal((await storageAvailable(out,{...config,storageBytes:1})).ok,false);
 }finally{await rm(out,{recursive:true,force:true});}
});

test('Admission atomique : deux requêtes simultanées ne lancent pas deux workers',async t=>{
 const {request,visitor}=await setup(t);const a=await visitor(),b=await visitor();
 const responses=await Promise.all([request('/api/jobs',a,'POST',{...defaults,firstName:'HANG'}),request('/api/jobs',b,'POST',{...defaults,firstName:'HANG'})]);
 assert.deepEqual(responses.map(r=>r.status).sort(),[202,409]);
});
test('Limite globale : nouvelles sessions et autres adresses ne contournent pas le budget',async t=>{
 const {request,visitor}=await setup(t,{globalGenerations:1,sessionGenerations:10,ipGenerations:10,trustedProxies:['127.0.0.1/32']});const a=await visitor();
 const job=await(await request('/api/jobs',a,'POST',defaults,{'X-Forwarded-For':'192.0.2.10'})).json();
 await eventually(async()=>(await(await request(`/api/jobs/${job.id}`,a)).json()).status==='done');await pause();
 const b=await visitor();assert.equal((await request('/api/jobs',b,'POST',defaults,{'X-Forwarded-For':'192.0.2.11'})).status,429);
});
test('Budget disque : éviction des plus anciens exports avant les plus récents',async()=>{
 const out=await mkdtemp(join(tmpdir(),'ab-budget-'));try{
 const config={...securityConfig({}),storageBytes:15,minFreeBytes:1};const oldest=join(out,randomUUID()+'.mp4'),recent=join(out,randomUUID()+'.mp4');
 await writeFile(oldest,Buffer.alloc(10));await utimes(oldest,new Date(Date.now()-1000),new Date(Date.now()-1000));await writeFile(recent,Buffer.alloc(10));
 await cleanStorage(out,config);await assert.rejects(access(oldest));await access(recent);
 }finally{await rm(out,{recursive:true,force:true});}
});

test('Expiration : les endpoints refusent une tâche expirée même avec la bonne session',async t=>{
 const {request,visitor}=await setup(t,{retentionMs:250});const a=await visitor();
 const started=await request('/api/jobs',a,'POST',defaults);assert.equal(started.status,202);const job=await started.json();
 await new Promise(r=>setTimeout(r,300));
 for(const [path,method]of [[`/api/jobs/${job.id}`,'GET'],[`/api/jobs/${job.id}`,'DELETE'],[`/api/jobs/${job.id}/download`,'GET']])assert.equal((await request(path,a,method)).status,404);
});

test('Décors publics : aucun accès aux exports personnels et prise en charge des requêtes vidéo partielles',async t=>{
 const {request,out,config}=await setup(t);
 const folder=join(out,'client-backgrounds','version');await mkdir(folder,{recursive:true});
 await writeFile(join(out,'client-backgrounds','manifest.json'),JSON.stringify({version:'version',assets:[]}));
 await writeFile(join(folder,'background.mp4'),Buffer.alloc(2048,1));
 const manifest=await request('/client-backgrounds/manifest.json');assert.equal(manifest.status,200);assert.equal(manifest.headers.get('cache-control'),'no-cache');
 const video=await request('/client-backgrounds/version/background.mp4','','GET',undefined,{Range:'bytes=0-99'});
 assert.equal(video.status,206);assert.equal((await video.arrayBuffer()).byteLength,100);assert.match(video.headers.get('cache-control')!,/immutable/);
 assert.equal((await request('/client-backgrounds/missing.mp4')).status,404);
 assert.equal((await request('/client-backgrounds/.secret')).status,404);
 assert.equal((await request('/client-backgrounds/manifest.json')).headers.get('set-cookie'),null);
 const old=new Date(Date.now()-7*86400000);await utimes(join(folder,'background.mp4'),old,old);await cleanStorage(out,config);
 assert.equal((await request('/client-backgrounds/version/background.mp4')).status,200);
});
