import {apiClient} from './api-client.mjs';
import {defaults} from '../src/shared/config.ts';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.APP_URL||'http://localhost:3000';
const durationSeconds=Number(process.env.DURATION_SECONDS||30);
const outputFile=`output/poc-rose-${durationSeconds}s.mp4`;
const client=apiClient(base);await client.connect();
const input={...defaults,templateId:'rose-poudre',firstName:'Éléonore',age:50,showGoldNuggets:true,messageLine1:'Joyeux',messageLine2:'Anniversaire',durationSeconds};
async function request(path,method='GET',body){const r=await client.request(path,{method,headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json()};}
async function wait(id){for(let n=0;n<900;n++){const {data}=await request(`/api/jobs/${id}`);if(n%10===0)console.log(data.status,Math.round(data.progress*100)+'%');if(['done','error','cancelled'].includes(data.status))return data;await new Promise(r=>setTimeout(r,2000));}throw Error('Délai maximal dépassé');}
assert.equal((await request('/api/health')).status,200);
assert.equal((await request('/api/jobs','POST',{...input,age:0})).status,400);
const first=await request('/api/jobs','POST',input);assert.equal(first.status,202);
assert.equal((await request('/api/jobs','POST',input)).status,409);
assert.equal((await request(`/api/jobs/${first.data.id}/download`)).status,404);
for(let n=0;n<120;n++){const {data}=await request(`/api/jobs/${first.data.id}`);if(data.status==='rendering')break;if(data.status==='error')throw Error(data.error);if(n===119)throw Error('Le moteur n’a pas démarré');await new Promise(r=>setTimeout(r,1000));}
await new Promise(r=>setTimeout(r,2000));
await request(`/api/jobs/${first.data.id}`,'DELETE');
assert.equal((await wait(first.data.id)).status,'cancelled');
console.log('Validation API, exclusion et annulation : OK');
const second=await request('/api/jobs','POST',input);assert.equal(second.status,202);
const result=await wait(second.data.id);assert.equal(result.status,'done',result.error);
const download=await client.request(`/api/jobs/${result.id}/download`);assert.equal(download.status,200);
await mkdir('output',{recursive:true});
await writeFile(outputFile,Buffer.from(await download.arrayBuffer()));
await writeFile('output/smoke-result.json',JSON.stringify(result,null,2));
console.log('Export réel téléchargé : '+outputFile);
