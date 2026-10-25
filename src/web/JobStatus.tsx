import {isActive,type Job} from '../shared/config';
const labels:Record<Job['status'],string>={preparing:'Préparation du moteur…',rendering:'Création de votre vidéo…',verifying:'Vérification du MP4…',done:'Votre vidéo est prête',cancelling:'Arrêt du rendu…',cancelled:'Rendu annulé',error:'Le rendu a échoué'};
export function JobStatus({job,pending,now,onCancel}:{job:Job|null;pending:boolean;now:number;onCancel:()=>void}){
 if(pending)return <div className="job" role="status" aria-live="polite">Démarrage de la génération…</div>;
 if(!job)return null;
 return <div className="job" role="status" aria-live="polite">
  <div className="job-heading"><strong>{labels[job.status]}</strong>{isActive(job)&&<span>{Math.round(job.progress*100)} % · {Math.max(0,Math.floor((now-job.startedAt)/1000))} s écoulées</span>}</div>
  <progress aria-label="Progression du rendu" max={1} value={job.progress}/>
  {isActive(job)&&<button className="cancel" disabled={job.status==='cancelling'} onClick={onCancel}>Annuler le rendu</button>}
  {job.status==='done'&&<a className="download" href={`/api/jobs/${job.id}/download`}>Télécharger le MP4 ↓</a>}
  {job.error&&<p className="error">{job.error}</p>}
 </div>;
}
