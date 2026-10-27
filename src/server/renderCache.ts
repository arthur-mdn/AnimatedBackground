import {createHash,randomUUID} from 'node:crypto';
import {mkdir,readFile,writeFile,stat,readdir,rename,link,copyFile,rm,utimes} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import type {BirthdayInput} from '../shared/config';
export type CacheKind='backgrounds'|'screens'|'exports';
const KEY=/^[a-f0-9]{64}$/;
const suffix=(kind:CacheKind)=>kind==='exports'?'.mp4':'.mov';
function canonical(value:unknown):string{
 if(Array.isArray(value))return `[${value.map(canonical).join(',')}]`;
 if(value!==null&&typeof value==='object')return `{${Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([key,item])=>`${JSON.stringify(key)}:${canonical(item)}`).join(',')}}`;
 return JSON.stringify(value);
}
export function backgroundSettings(p:BirthdayInput){
 const common={templateId:p.templateId,durationSeconds:p.durationSeconds};
 if(p.templateId==='rose-poudre')return {...common,watercolorColor:p.watercolorColor.toUpperCase(),showGoldNuggets:p.showGoldNuggets};
 if(p.templateId==='jardin-mariage')return {...common,gardenPalette:p.gardenPalette};
 if(p.templateId==='sceau-voeux')return {...common,vowsPalette:p.vowsPalette};
 if(p.templateId==='ballon-enfance')return {...common,childhoodPalette:p.childhoodPalette};
 return {...common,nocturnePalette:p.nocturnePalette,...(p.nocturnePalette==='custom'?{nocturneColor:p.nocturneColor.toUpperCase()}:{})};
}
export function exportSettings(p:BirthdayInput){
 const background=backgroundSettings(p);
 if(p.templateId==='jardin-mariage'||p.templateId==='sceau-voeux')return {...background,brideName:p.brideName,groomName:p.groomName,reverseNames:p.reverseNames,weddingDate:p.weddingDate,weddingMessage:p.weddingMessage};
 return {...background,firstName:p.firstName,age:p.age,messageLine1:p.messageLine1,messageLine2:p.messageLine2,...(p.templateId==='rose-poudre'?{ornament:p.ornament}:{})};
}
export function renderCacheKey(kind:CacheKind,version:string,input:BirthdayInput){
 return createHash('sha256').update(canonical({format:'lossless-layers-v1',kind,version,settings:kind==='backgrounds'?backgroundSettings(input):kind==='screens'?{...backgroundSettings(input),age:input.age}:exportSettings(input)})).digest('hex');
}
export async function publishFile(source:string,target:string){
 await mkdir(dirname(target),{recursive:true});
 const temp=`${target}.${randomUUID()}.tmp`;
 try{try{await link(source,temp);}catch(error){if((error as NodeJS.ErrnoException).code!=='EXDEV')throw error;await copyFile(source,temp);}await rename(temp,target);}finally{await rm(temp,{force:true});}
}
type Manifest={key:string;kind:CacheKind;bytes:number;durationSeconds:number;createdAt:number};
export class RenderCache{
 readonly root:string;
 constructor(outputDir:string,readonly limitBytes=8*1024**3){this.root=join(outputDir,'.cache','layers-v1');}
 private paths(kind:CacheKind,key:string){
  if(!KEY.test(key))throw new Error('Clé de cache invalide.');
  const dir=join(this.root,kind);return {dir,file:join(dir,key+suffix(kind)),manifest:join(dir,key+'.json')};
 }
 async get(kind:CacheKind,key:string){
  const paths=this.paths(kind,key);
  try{
   const manifest=JSON.parse(await readFile(paths.manifest,'utf8')) as Manifest;
   const info=await stat(paths.file);
   if(manifest.key!==key||manifest.kind!==kind||!Number.isFinite(manifest.durationSeconds)||manifest.durationSeconds<1||!Number.isFinite(manifest.bytes)||manifest.bytes<1000||!info.isFile()||info.size!==manifest.bytes)return null;
   await utimes(paths.manifest,new Date(),new Date());
   return {path:paths.file,...manifest};
  }catch{return null;}
 }
 async put(kind:CacheKind,key:string,source:string,durationSeconds:number){
  const paths=this.paths(kind,key);await mkdir(paths.dir,{recursive:true});
  const info=await stat(source);if(info.size<1000)throw new Error('Fichier incomplet, cache ignoré.');
  await publishFile(source,paths.file);
  const manifest:Manifest={key,kind,bytes:info.size,durationSeconds,createdAt:Date.now()};
  const temp=paths.manifest+'.'+randomUUID()+'.tmp';
  try{await writeFile(temp,JSON.stringify(manifest));await rename(temp,paths.manifest);}finally{await rm(temp,{force:true});}
  return {path:paths.file,...manifest};
 }
 async remove(kind:CacheKind,key:string){const paths=this.paths(kind,key);await Promise.all([rm(paths.manifest,{force:true}),rm(paths.file,{force:true})]);}
 async prune(protectedKeys:string[]=[]){
  const entries:Array<{kind:CacheKind;key:string;bytes:number;used:number}>=[];
  for(const kind of ['backgrounds','screens','exports'] as const){
   const dir=join(this.root,kind);let names:string[];try{names=await readdir(dir);}catch{continue;}
   for(const name of names){
    if(/^[a-f0-9]{64}\..+\.tmp$/.test(name)){const path=join(dir,name);try{if(Date.now()-(await stat(path)).mtimeMs>3600000)await rm(path,{force:true});}catch{}continue;}
    if(!/^[a-f0-9]{64}\.(mov|mp4)$/.test(name))continue;
    const key=name.slice(0,64),paths=this.paths(kind,key);
    try{const file=await stat(paths.file);let used=file.mtimeMs;try{used=(await stat(paths.manifest)).mtimeMs;}catch{/* Orphaned files are evicted first. */used=0;}entries.push({kind,key,bytes:file.size,used});}catch{/* Entry was removed. */}
   }
  }
  let bytes=entries.reduce((sum,entry)=>sum+entry.bytes,0);
  for(const entry of entries.sort((a,b)=>a.used-b.used)){
   if(bytes<=this.limitBytes)break;
   if(protectedKeys.includes(`${entry.kind}:${entry.key}`))continue;
   await this.remove(entry.kind,entry.key);bytes-=entry.bytes;
  }
  return bytes;
 }
}
