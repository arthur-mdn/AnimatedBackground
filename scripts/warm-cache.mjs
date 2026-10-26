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
const sleep=()=>new Promise(resolve=>setTimeout(resolve,1000));
for(const [index,input] of jobs.entries()){
 console.log(`${index+1}/${jobs.length} — ${input.templateId} — ${durationSeconds} s`);
 let response;
 do{response=await fetch(url+'/api/jobs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(inputSchema.parse(input))});if(response.status===409)await sleep();}while(response.status===409);
 let job=await response.json();if(!response.ok)throw Error(job.error);
 while(['preparing','rendering','verifying','cancelling'].includes(job.status)){await sleep();job=await fetch(`${url}/api/jobs/${job.id}`).then(r=>r.json());}
 if(job.status!=='done')throw Error(job.error||`Préparation interrompue : ${job.status}`);
 console.log(`Prêt — ${((job.finishedAt-job.startedAt)/1000).toFixed(1)} s${job.cachedExport?' (export déjà disponible)':job.cachedBackground?' (fond réutilisé)':''}`);
}
