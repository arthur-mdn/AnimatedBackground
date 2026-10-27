import {apiClient} from './api-client.mjs';
import {defaults,inputSchema} from '../src/shared/config.ts';
import {watercolorColors} from '../src/video/WatercolorPalette.tsx';
import {nocturnePalettes} from '../src/shared/nocturne.ts';
import {gardenPalettes} from '../src/shared/garden.ts';
const args=process.argv.slice(2),all=args.includes('--all-palettes');
const value=name=>args.find(a=>a.startsWith(`--${name}=`))?.split('=')[1];
const durationSeconds=Number(value('duration')||45),model=value('model');
if(!Number.isInteger(durationSeconds)||durationSeconds<30||durationSeconds>180||model&&!['aquarelle','nocturne','jardin'].includes(model))throw Error('Utiliser --duration=30..180 et --model=aquarelle|nocturne|jardin.');
const base={...defaults,durationSeconds,weddingDate:'2026-01-01'};
const jobs=[];
if(!model||model==='aquarelle')for(const palette of all?watercolorColors:[watercolorColors[0]])jobs.push({...base,templateId:'rose-poudre',watercolorColor:palette.value});
if(!model||model==='nocturne')for(const palette of all?nocturnePalettes:[nocturnePalettes[0]])jobs.push({...base,templateId:'bleu-minuit',nocturnePalette:palette.id});
if(!model||model==='jardin')for(const palette of all?gardenPalettes:[gardenPalettes[0]])jobs.push({...base,templateId:'jardin-mariage',gardenPalette:palette.id});
const url=process.env.WARM_CACHE_URL||`http://127.0.0.1:${process.env.PORT||3001}`;
const client=apiClient(url);await client.connect();
const sleep=()=>new Promise(resolve=>setTimeout(resolve,1000));
for(const [index,input] of jobs.entries()){
 console.log(`${index+1}/${jobs.length} — ${input.templateId} — ${durationSeconds} s`);
 let response;
 do{response=await client.request('/api/jobs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(inputSchema.parse(input))});if(response.status===409)await sleep();if(response.status===429){console.log('Limite de génération atteinte, attente avant la suite…');await new Promise(resolve=>setTimeout(resolve,Math.min(3600,Number(response.headers.get('retry-after'))||60)*1000));await client.connect();}}while([409,429].includes(response.status));
 let job=await response.json();if(!response.ok)throw Error(job.error);
 while(['preparing','rendering','verifying','cancelling'].includes(job.status)){await sleep();job=await client.request(`/api/jobs/${job.id}`).then(r=>r.json());}
 if(job.status!=='done')throw Error(job.error||`Préparation interrompue : ${job.status}`);
 console.log(`Prêt — ${((job.finishedAt-job.startedAt)/1000).toFixed(1)} s${job.cachedExport?' (export déjà disponible)':job.cachedBackground?' (fond réutilisé)':''}`);
}
