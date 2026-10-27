import {bundle} from '@remotion/bundler';
import {renderMedia,selectComposition} from '@remotion/renderer';
import {mkdir,readFile,writeFile,rename,rm,stat} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {spawn} from 'node:child_process';
import {defaults,inputSchema,VIDEO} from '../src/shared/config.ts';
import {clientBackgroundKey} from '../src/shared/clientExport.ts';
import {clientBackgroundVersion} from '../src/server/clientBackgroundVersion.ts';
import {RenderCache,renderCacheKey} from '../src/server/renderCache.ts';
import {renderVersion} from '../src/server/renderVersion.ts';
import {verifyMedia} from '../src/server/media.ts';

const args=Object.fromEntries(process.argv.slice(2).map(arg=>arg.replace(/^--/,'').split('=')));
const input=inputSchema.parse({...defaults,watercolorColor:args.color||defaults.watercolorColor,durationSeconds:Number(args.duration||45),showGoldNuggets:args.gold!=='false'});
const version=await clientBackgroundVersion(),key=clientBackgroundKey(input);
const out=resolve(process.env.OUTPUT_DIR||'output'),assets=join(out,'client-backgrounds'),dir=join(assets,version);
const work=join(out,'.client-background-build');
await mkdir(assets,{recursive:true});
// Exclusive preparation lock; a second administrator command must not overwrite the manifest.
await mkdir(work);
try{
 await mkdir(dir,{recursive:true});
 let manifest={version,assets:[]};
 try{const previous=JSON.parse(await readFile(join(assets,'manifest.json'),'utf8'));if(previous.version===version&&Array.isArray(previous.assets))manifest=previous;}catch{}
 const existing=manifest.assets.find(asset=>asset.key===key);
 if(existing){try{await verifyMedia(join(out,existing.src),input.durationSeconds);console.log('Fond déjà préparé : '+key);process.exitCode=0;}catch{manifest.assets=manifest.assets.filter(asset=>asset.key!==key);}}
 if(!manifest.assets.some(asset=>asset.key===key)){
  // Reuse the lossless cache when the exact server engine version matches.
  let cached=null;
  const serveUrl=process.env.RENDER_BUNDLE_DIR||await bundle({entryPoint:resolve('src/video/Root.tsx'),publicDir:resolve('public')});
  try{cached=await new RenderCache(out).get('backgrounds',renderCacheKey('backgrounds',await renderVersion(process.env.RENDER_BUNDLE_DIR),input));}catch{}
  const candidate=join(work,'background.mp4');
  if(cached){
   console.log('Compression du fond sans perte déjà disponible…');
   await new Promise((done,fail)=>{
    const child=spawn('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',cached.path,'-an','-c:v','libx264','-crf','16','-preset','medium','-pix_fmt','yuv420p','-movflags','+faststart',candidate],{stdio:'inherit'});
    child.on('error',fail);child.on('exit',code=>code===0?done():fail(new Error('Compression impossible.')));
   });
  }else{
   console.log('Calcul du décor générique '+key+' (une seule fois)…');
   const composition=await selectComposition({serveUrl,id:'Background',inputProps:input,browserExecutable:process.env.CHROME_PATH});
   let last=-1;
   await renderMedia({serveUrl,composition,inputProps:input,browserExecutable:process.env.CHROME_PATH,outputLocation:candidate,codec:'h264',crf:16,x264Preset:'medium',pixelFormat:'yuv420p',imageFormat:'png',concurrency:2,muted:true,
    onProgress:({progress})=>{const percent=Math.floor(progress*100/5)*5;if(percent!==last){last=percent;console.log(percent+' %');}}});
  }
  await verifyMedia(candidate,input.durationSeconds);
  const hash=createHash('sha256').update(await readFile(candidate)).digest('hex').slice(0,16),name=`${key}-${hash}.mp4`;
  await rename(candidate,join(dir,name));
  manifest.assets.push({key,src:`/client-backgrounds/${version}/${name}`,bytes:(await stat(join(dir,name))).size});
  const temp=join(work,randomUUID()+'.json');await writeFile(temp,JSON.stringify(manifest,null,2));await rename(temp,join(assets,'manifest.json'));
  console.log('Prêt : '+manifest.assets.at(-1).src);
 }
}finally{await rm(work,{recursive:true,force:true});}
