import {readdir,stat,lstat,rm,statfs,readlink} from 'node:fs/promises';
import {join,sep} from 'node:path';
import {tmpdir} from 'node:os';
import {RenderCache} from './renderCache';
import type {SecurityConfig} from './security';
const uuid='[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}';
const exportName=new RegExp(`^${uuid}\\.mp4$`),workName=new RegExp(`^${uuid}$`);
const cacheName=/^[a-f0-9]{64}\.(mp4|mov)$/;
async function entries(dir:string){try{return await readdir(dir,{withFileTypes:true});}catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT')return [];throw error;}}
export async function storageUsage(dir:string):Promise<number>{
 let bytes=0;
 for(const entry of await entries(dir)){
  const path=join(dir,entry.name);
  try{if(entry.isDirectory())bytes+=await storageUsage(path);else if(entry.isFile())bytes+=(await stat(path)).size;}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}
 }
 return bytes;
}
export async function storageAvailable(dir:string,config:Pick<SecurityConfig,'storageBytes'|'minFreeBytes'>){
 const [bytes,space]=await Promise.all([storageUsage(dir),statfs(dir)]);
 return {ok:bytes<config.storageBytes&&space.bavail*space.bsize>=config.minFreeBytes,bytes};
}
export async function cleanStorage(dir:string,config:SecurityConfig,protectedFiles:Pick<ReadonlySet<string>,'has'>=new Set(),now=Date.now()){
 for(const entry of await entries(dir)){
  if(!entry.isFile()||!exportName.test(entry.name)||protectedFiles.has(entry.name))continue;
  const path=join(dir,entry.name);if(now-(await stat(path)).mtimeMs>=config.retentionMs&&!protectedFiles.has(entry.name))await rm(path,{force:true});
 }
 // Screen layers include ages; both they and complete exports contain personalisation.
 for(const kind of ['exports','screens']){
  const folder=join(dir,'.cache','layers-v1',kind);
  for(const entry of await entries(folder)){
   if(!entry.isFile()||!cacheName.test(entry.name))continue;
   const path=join(folder,entry.name);if(now-(await stat(path)).mtimeMs>=config.retentionMs){await rm(path,{force:true});await rm(join(folder,entry.name.slice(0,64)+'.json'),{force:true});}
  }
 }
 // Called only when no worker is running; recover leftovers after a crash/restart.
 for(const entry of await entries(join(dir,'.render-work')))if(entry.isDirectory()&&workName.test(entry.name))await rm(join(dir,'.render-work',entry.name),{recursive:true,force:true});
 // Remove short temporary aliases left by a crashed worker, only for this output root.
 const aliasRoot=process.platform==='win32'?tmpdir():'/tmp';
 for(const entry of await entries(aliasRoot))if(entry.isSymbolicLink()&&/^abr-[a-f0-9]{16}$/.test(entry.name)){const path=join(aliasRoot,entry.name);try{if((await readlink(path)).startsWith(join(dir,'.render-work')+sep))await rm(path,{force:true});}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}}
 await new RenderCache(dir,config.cacheBytes).prune();
 // Retention alone does not bound storage during a busy day. Evict oldest completed exports.
 const candidates=[];
 for(const entry of await entries(dir))if(entry.isFile()&&exportName.test(entry.name)&&!protectedFiles.has(entry.name)){const path=join(dir,entry.name);candidates.push({path,...await lstat(path)});}
 let usage=await storageUsage(dir);
 for(const file of candidates.sort((a,b)=>a.mtimeMs-b.mtimeMs)){
  if(usage<config.storageBytes*.9)break;
  if(protectedFiles.has(file.path.slice(dir.length+1)))continue;
  await rm(file.path,{force:true});usage-=file.size;
 }
 return storageAvailable(dir,config);
}
