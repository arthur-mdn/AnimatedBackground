import {createHash} from 'node:crypto';
import {readFile,readdir} from 'node:fs/promises';
import {join,relative} from 'node:path';

// Portable across the preparation machine and the VPS. Generated videos are excluded.
export async function clientBackgroundVersion(root=process.cwd()){
 const hash=createHash('sha256').update('client-backgrounds-v1/remotion-4.0.538');
 async function walk(dir:string){
  for(const entry of (await readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){
   const path=join(dir,entry.name);
   if(entry.isDirectory())await walk(path);
   else if(entry.isFile()){hash.update(relative(root,path));hash.update(await readFile(path));}
  }
 }
 for(const dir of ['src/video','src/shared','public/fonts','public/textures'])await walk(join(root,dir));
 return hash.digest('hex').slice(0,20);
}
