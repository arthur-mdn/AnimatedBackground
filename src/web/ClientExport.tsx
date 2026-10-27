import {useEffect,useRef,useState} from 'react';
import type {BirthdayInput} from '../shared/config';
import {exportPolicy,type ExportCapability} from '../shared/exportPolicy';

import {readExportAttempt,rememberExportAttempt,clearExportAttempt} from './exportAttempt';
import {exportOnClient,supportsClientExport,type LocalExport} from './clientRenderer';
import {CheckIcon,DownloadIcon,SpinnerIcon} from './Icons';

type Progress={fraction:number;frames:number;elapsed:number;remaining:number|null};
export function useClientExport(input:BirthdayInput){
 const [capability,setCapability]=useState<ExportCapability>('checking'),[mode,setMode]=useState<'client'|'server'>('client');
 const inputKey=JSON.stringify(input);
 const [interrupted]=useState(readExportAttempt);
 const [failedInput,setFailedInput]=useState<string|null>(interrupted);
 const [active,setActive]=useState(false),[result,setResult]=useState<LocalExport|null>(null),[progress,setProgress]=useState<Progress|null>(null),[error,setError]=useState(interrupted===inputKey?'Le précédent export sur cet appareil a été interrompu. Vous pouvez réessayer ou choisir le serveur.':'');
 const controller=useRef<AbortController|null>(null),url=useRef<string|null>(null);
 useEffect(()=>{let alive=true;supportsClientExport().then(ok=>{if(alive)setCapability(ok?'ready':'unsupported');}).catch(()=>{if(alive)setCapability('unsupported');});return()=>{alive=false;};},[]);
 const previousInput=useRef(inputKey);
 useEffect(()=>{if(previousInput.current!==inputKey){setMode('client');setError('');setFailedInput(null);previousInput.current=inputKey;}},[inputKey]);
 useEffect(()=>()=>{controller.current?.abort();if(url.current)URL.revokeObjectURL(url.current);},[]);
 const ready=capability==='ready';
 const {serverAvailable,canGenerate,selected}=exportPolicy(capability,mode,failedInput,inputKey);
 async function generate(){
  if(!ready||controller.current)return;
  const abort=new AbortController();controller.current=abort;setActive(true);setError('');setResult(null);setProgress(null);
  if(url.current){URL.revokeObjectURL(url.current);url.current=null;}
  rememberExportAttempt(inputKey);
 const started=performance.now();let updated=0;
  try{
   const video=await exportOnClient(input,abort.signal,p=>{
    const now=performance.now();if(now-updated<200&&p.progress<1)return;updated=now;
    setProgress({fraction:p.progress,frames:p.encodedFrames,elapsed:(now-started)/1000,remaining:Number.isFinite(p.renderEstimatedTime)&&p.renderEstimatedTime>0?p.renderEstimatedTime/1000:null});
   });
   url.current=video.url;setResult(video);setFailedInput(null);
  }catch(e){if(!abort.signal.aborted){console.error('Export navigateur :',e);setFailedInput(inputKey);setError('L’export sur cet appareil a échoué. Vous pouvez réessayer ou choisir le serveur.');}}
  finally{clearExportAttempt();controller.current=null;setActive(false);}
 }
 return {ready,capability,serverAvailable,mode,setMode,canGenerate,selected,active,result,progress,error,generate,reset:()=>{clearExportAttempt();setResult(null);setError('');if(url.current){URL.revokeObjectURL(url.current);url.current=null;}},cancel:()=>controller.current?.abort()};
}
export type ClientExportState=ReturnType<typeof useClientExport>;

function time(seconds:number){return seconds<60?`${Math.round(seconds)} s`:`${Math.floor(seconds/60)} min ${Math.round(seconds%60)} s`;}
export function ClientExportStatus({state}:{state:ClientExportState}){
 const {active,result,progress,error}=state;
 if(!active&&!result&&!error)return null;
 const percent=Math.min(99.9,(progress?.fraction??0)*100);
 return <div className={`job ${result?'job-done':''}`}>
  <div className="job-heading"><span className="job-status-icon">{result?<CheckIcon/>:active?<SpinnerIcon/>:'—'}</span><strong role="status" aria-live="polite">{result?'Votre vidéo est prête':active?'Génération sur cet appareil':'Export interrompu'}</strong>{active&&<span className="job-percent">{percent.toFixed(1)}<small> %</small></span>}</div>
  {active&&<><div className="render-progress" role="progressbar" aria-label="Progression de l’export sur cet appareil" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}><span style={{width:`${percent}%`}}/></div><div className="job-timing"><strong>{progress?.remaining?`Environ ${time(Math.max(1,progress.remaining))} restantes`:'Préparation et estimation…'}</strong><span>{time(progress?.elapsed??0)} écoulées</span></div><p className="job-detail">MP4 · Full HD · 30 images/s · Calcul sur cet appareil</p><button className="cancel" onClick={state.cancel}>Annuler la génération</button></>}
  {result&&<><p className="job-ready-detail">MP4 · Générée ici en {time(result.seconds)} · {(result.bytes/1024**2).toFixed(1)} Mo</p><a className="download" href={result.url} download={result.filename}><DownloadIcon/><span>Télécharger la vidéo<small>Format MP4</small></span></a></>}
  {error&&<p className="error" role="alert">{error}</p>}
 </div>;
}
