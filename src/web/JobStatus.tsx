import {isActive,type Job} from '../shared/config';
import {CheckIcon,DownloadIcon,SpinnerIcon} from './Icons';
const labels:Record<Job['status'],string>={preparing:'Préparation du moteur',rendering:'Calcul des images',verifying:'Vérification du MP4',done:'Votre vidéo est prête',cancelling:'Arrêt de la génération',cancelled:'Génération annulée',error:'La génération a échoué'};
function duration(seconds:number){const n=Math.max(0,Math.round(seconds));return n<60?`${n} s`:`${Math.floor(n/60)} min${n%60?` ${n%60} s`:''}`;}
export function JobStatus({job,pending,now,onCancel}:{job:Job|null;pending:boolean;now:number;onCancel:()=>void}){
 if(pending)return <div className="job job-pending" role="status"><SpinnerIcon/><span>Démarrage de la génération…</span></div>;
 if(!job)return null;
 const active=isActive(job),done=job.status==='done',rendering=job.status==='rendering';
 const encoding=rendering&&!!job.totalFrames&&job.renderedFrames===job.totalFrames;
 const percent=Math.min(done?100:99.9,Math.floor(job.progress*1000)/10);
 const elapsed=Math.max(0,((job.finishedAt??now)-job.startedAt)/1000);
 const age=job.updatedAt?(now-job.updatedAt)/1000:0;
 const remaining=job.estimatedRemainingSeconds==null||age>15?null:Math.max(1,job.estimatedRemainingSeconds-age);
 const label=encoding?'Assemblage du MP4':labels[job.status];
 const step=job.status==='preparing'?0:rendering&&!encoding?1:2;
 return <div className={`job ${done?'job-done':''}`}>
  <div className="job-heading"><span className="job-status-icon">{done?<CheckIcon/>:active?<SpinnerIcon/>:<VideoState/>}</span><strong role="status" aria-live="polite">{label}</strong>{active&&<span className="job-percent">{percent.toLocaleString('fr-FR',{minimumFractionDigits:1,maximumFractionDigits:1})}<small> %</small></span>}</div>
  {active&&<>
   <div className={`render-progress ${job.status==='preparing'?'is-preparing':''}`} role="progressbar" aria-label="Progression de la génération" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-valuetext={`${percent.toLocaleString('fr-FR')} % — ${label}`}><span style={{width:`${percent}%`}}/></div>
   <div className="job-timing"><strong>{job.status==='cancelling'?'Arrêt en cours…':job.status==='verifying'||encoding?'Finalisation du fichier…':remaining===null?'Estimation en cours…':`Environ ${duration(Math.ceil(remaining/5)*5)} restantes`}</strong><span>{duration(elapsed)} écoulées</span></div>
   <ol className="job-steps" aria-label="Étapes de génération">{['Préparation','Images','Finalisation'].map((name,i)=><li key={name} className={i<step?'complete':i===step?'current':''} aria-current={i===step?'step':undefined}><span>{i<step?<CheckIcon/>:i+1}</span>{name}</li>)}</ol>
   {rendering&&!encoding&&job.totalFrames&&<p className="job-detail">{(job.renderedFrames??0).toLocaleString('fr-FR')} / {job.totalFrames.toLocaleString('fr-FR')} images calculées</p>}
   <button className="cancel" disabled={job.status==='cancelling'} onClick={onCancel}>Annuler la génération</button>
  </>}
  {done&&<><p className="job-ready-detail">MP4 · Générée en {duration(elapsed)}</p><a className="download" href={`/api/jobs/${job.id}/download`}><DownloadIcon/><span>Télécharger la vidéo<small>Format MP4</small></span></a></>}
  {job.error&&<p className="error">{job.error}</p>}
 </div>;
}
function VideoState(){return <span aria-hidden="true">—</span>;}
