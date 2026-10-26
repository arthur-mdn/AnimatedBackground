import {z} from 'zod';
import {isWeddingDate,weddingNames} from './wedding';
import {ornamentIds} from './ornaments';
import {nocturnePaletteIds} from './nocturne';
const oneLine=(maximum:number,label:string)=>z.string().trim().max(maximum,`${label} est limitée à ${maximum} caractères.`).refine(s=>!/[\r\n]/.test(s),`${label} doit tenir sur une seule ligne.`);
export const inputSchema = z.object({
  templateId:z.enum(['rose-poudre','bleu-minuit','jardin-mariage']),
  firstName:z.string().trim().max(30,'Le prénom est limité à 30 caractères.').refine(s=>!/[\p{Cc}\p{Cf}]/u.test(s),'Le prénom contient un caractère invisible non pris en charge.'),
  age:z.number().or(z.nan()),
  brideName:oneLine(30,'Le prénom de la mariée'),
  groomName:oneLine(30,'Le prénom du marié'),
  reverseNames:z.boolean(),
  weddingDate:z.string().max(10),
  weddingMessage:oneLine(100,'La phrase du mariage'),
  showGoldNuggets:z.boolean(),
  ornament:z.enum(ornamentIds),
  nocturneColor:z.string().regex(/^#[0-9a-fA-F]{6}$/,'Choisissez une couleur valide.'),
  nocturnePalette:z.enum(nocturnePaletteIds),
  watercolorColor:z.string().regex(/^#[0-9a-fA-F]{6}$/,'Choisissez une couleur valide.'),
  messageLine1:oneLine(40,'La ligne 1'),
  messageLine2:oneLine(60,'La ligne 2'),
  durationSeconds:z.number().int().min(30).max(180)
}).superRefine((input,ctx)=>{
 if(input.templateId==='jardin-mariage'){
  if(!input.brideName)ctx.addIssue({code:'custom',path:['brideName'],message:'Saisissez le prénom de la mariée.'});
  if(!input.groomName)ctx.addIssue({code:'custom',path:['groomName'],message:'Saisissez le prénom du marié.'});
  if(!isWeddingDate(input.weddingDate))ctx.addIssue({code:'custom',path:['weddingDate'],message:'Renseignez la date du mariage.'});
 }else{
  if(!input.firstName)ctx.addIssue({code:'custom',path:['firstName'],message:'Saisissez un prénom.'});
  if(!Number.isInteger(input.age)||input.age<1||input.age>120)ctx.addIssue({code:'custom',path:['age'],message:'L’âge doit être compris entre 1 et 120 ans.'});
 }
}).transform(input=>({...input,age:Number.isFinite(input.age)?input.age:50}));
export type BirthdayInput=z.infer<typeof inputSchema>;
export const defaults:BirthdayInput={templateId:'rose-poudre',firstName:'Prénom',age:50,brideName:'Prénom',groomName:'Prénom',reverseNames:false,weddingDate:'',weddingMessage:'',showGoldNuggets:true,ornament:'heart',watercolorColor:'#CF7E7F',nocturnePalette:'bleu-nuit',nocturneColor:'#20366F',messageLine1:'Joyeux',messageLine2:'Anniversaire',durationSeconds:45};
export const VIDEO={width:1920,height:1080,fps:30} as const;
export const templates=[{id:'rose-poudre',category:'birthday',name:'Aquarelle',description:'Encre, éclats & couleurs au choix'},{id:'bleu-minuit',category:'birthday',name:'Nocturne',description:'Étoiles, lumières & notes de musique'},{id:'jardin-mariage',category:'wedding',name:'Jardin',description:'Feuillage animé & colombe'}] as const;
function safeName(value:string){return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'invite';}
export function filename(p:BirthdayInput){
 if(p.templateId==='jardin-mariage')return `mariage_${weddingNames(p).map(safeName).join('-')}_${p.weddingDate}_${p.durationSeconds}s.mp4`;
 return `anniversaire_${safeName(p.firstName)}_${p.age}ans_${p.templateId==='rose-poudre'?'aquarelle':'nocturne'}_${p.durationSeconds}s.mp4`;
}

export type Job={id:string;status:'preparing'|'rendering'|'verifying'|'done'|'cancelling'|'cancelled'|'error';progress:number;startedAt:number;filename:string;error?:string};
export const isActive=(job:Job)=>['preparing','rendering','verifying','cancelling'].includes(job.status);
