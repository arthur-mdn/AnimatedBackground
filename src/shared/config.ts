import {z} from 'zod';
const oneLine=(maximum:number,label:string)=>z.string().trim().max(maximum,`${label} est limitée à ${maximum} caractères.`).refine(s=>!/[\r\n]/.test(s),`${label} doit tenir sur une seule ligne.`);
export const inputSchema = z.object({
  templateId:z.literal('rose-poudre'),
  firstName:z.string().trim().min(1,'Saisissez un prénom.').max(30,'Le prénom est limité à 30 caractères.').refine(s=>!/[\p{Cc}\p{Cf}]/u.test(s),'Le prénom contient un caractère invisible non pris en charge.'),
  age:z.number().int().min(1).max(120),
  showGoldNuggets:z.boolean(),
  messageLine1:oneLine(40,'La ligne 1'),
  messageLine2:oneLine(60,'La ligne 2'),
  durationSeconds:z.number().int().min(30).max(180)
});
export type BirthdayInput=z.infer<typeof inputSchema>;
export const defaults:BirthdayInput={templateId:'rose-poudre',firstName:'Caroline',age:50,showGoldNuggets:true,messageLine1:'Joyeux',messageLine2:'Anniversaire',durationSeconds:30};
export const VIDEO={width:1920,height:1080,fps:30} as const;
export const templates=[{id:'rose-poudre',name:'Rose poudré',description:'Aquarelle, ivoire & or rose'}] as const;
export function filename(p:BirthdayInput){const name=p.firstName.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'invite';return `anniversaire_${name}_${p.age}ans_${p.templateId}_${p.durationSeconds}s.mp4`;}
export type Job={id:string;status:'preparing'|'rendering'|'verifying'|'done'|'cancelling'|'cancelled'|'error';progress:number;startedAt:number;filename:string;error?:string};
export const isActive=(job:Job)=>['preparing','rendering','verifying','cancelling'].includes(job.status);
