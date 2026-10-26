import {createHash} from 'node:crypto';
import {readFile,readdir} from 'node:fs/promises';
import {resolve,join,relative} from 'node:path';
import {spawnSync} from 'node:child_process';
export async function computeRenderVersion(root=process.cwd()){
 const hash=createHash('sha256');
 async function walk(folder:string){
  const entries=await readdir(folder,{withFileTypes:true});
  for(const entry of entries.sort((a,b)=>a.name.localeCompare(b.name))){
   const path=join(folder,entry.name);
   if(entry.isDirectory())await walk(path);
   else if(entry.isFile()){hash.update(relative(root,path));hash.update(await readFile(path));}
  }
 }
 for(const folder of ['src/video','src/shared','public'])await walk(resolve(root,folder));
 for(const file of ['src/server/worker.ts','src/server/lossless.ts','src/server/composite.ts']){hash.update(file);hash.update(await readFile(resolve(root,file)));}
 hash.update(await readFile(resolve(root,'package-lock.json')));
 const browser=spawnSync(process.env.CHROME_PATH||'chromium',['--version'],{encoding:'utf8'});
 hash.update(`${process.platform}/${process.arch}/${browser.stdout||'unknown-browser'}`);
 return hash.digest('hex');
}
export async function renderVersion(bundleDir?:string){
 if(bundleDir){const version=(await readFile(join(bundleDir,'version.txt'),'utf8')).trim();if(!/^[a-f0-9]{64}$/.test(version))throw new Error('Version du moteur invalide.');return version;}
 return computeRenderVersion();
}
