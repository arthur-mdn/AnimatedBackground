import {bundle} from '@remotion/bundler';
import {makeCancelSignal,renderMedia,selectComposition} from '@remotion/renderer';
import {resolve,dirname,join,basename} from 'node:path';
import {access,mkdir,rm} from 'node:fs/promises';
import {inputSchema,type Job} from '../shared/config';
import {RenderEstimate} from './renderEstimate';
import {verifyMedia,verifyBackground} from './media';
import {RenderCache,renderCacheKey,publishFile} from './renderCache';
import {renderVersion} from './renderVersion';
import {losslessBackgroundArgs} from './lossless';
import {compositeVideo,INTRO_FRAMES} from './composite';
const {cancelSignal,cancel}=makeCancelSignal();
const controller=new AbortController();
let cancelled=false;
process.on('message',m=>{if(m==='cancel'){cancelled=true;cancel();controller.abort();}});
const send=(data:Partial<Job>)=>process.send?.(data);
const output=process.env.RENDER_OUTPUT!,outDir=dirname(output),workDir=join(outDir,'.render-work',basename(output,'.mp4'));
const checkCancelled=()=>{if(cancelled)throw new Error('Annulé');};
try{
 const input=inputSchema.parse(JSON.parse(process.env.RENDER_INPUT!));
 const limitMB=Number(process.env.RENDER_CACHE_MAX_MB||8192);
 if(!Number.isFinite(limitMB)||limitMB<=0)throw new Error('La limite du cache doit être un nombre positif.');
 const cache=new RenderCache(outDir,limitMB*1024**2);
 const version=await renderVersion(process.env.RENDER_BUNDLE_DIR);
 const backgroundKey=renderCacheKey('backgrounds',version,input),exportKey=renderCacheKey('exports',version,input);
 const protectedKeys=[`exports:${exportKey}`];
 await mkdir(workDir,{recursive:true});
 let reusedExport=false;
 const cachedExport=await cache.get('exports',exportKey);
 if(cachedExport){
  try{await verifyMedia(cachedExport.path,input.durationSeconds);checkCancelled();await publishFile(cachedExport.path,output);checkCancelled();await cache.prune(protectedKeys);send({status:'done',progress:1,finishedAt:Date.now(),cachedExport:true,cachedBackground:true,estimatedRemainingSeconds:0});reusedExport=true;}
  catch(error){checkCancelled();await cache.remove('exports',exportKey);}
 }
 if(!reusedExport){
  await Promise.all(['alex-brush-latin-400-normal.woff2','alex-brush-latin-ext-400-normal.woff2','bodoni-moda-latin-700-normal.woff2','bodoni-moda-latin-ext-700-normal.woff2'].map(f=>access(resolve('public/fonts',f))));
  if(input.templateId==='jardin-mariage')await Promise.all([access(resolve('public/media/wedding-bird-loop.mp4')),access(resolve('public/fonts/apple-chancery.ttf'))]);
  const browserExecutable=process.env.CHROME_PATH||undefined;
  const serveUrl=process.env.RENDER_BUNDLE_DIR||await bundle({entryPoint:resolve('src/video/Root.tsx'),publicDir:resolve('public')});
  checkCancelled();
  let background=await cache.get('backgrounds',backgroundKey);
  if(background){try{await verifyBackground(background.path,input.durationSeconds);}catch{await cache.remove('backgrounds',backgroundKey);background=null;}}
  const cachedBackground=!!background,estimate=new RenderEstimate();let lastUpdate=0;
  const progressFor=(stage:'background'|'personalization'|'assembly',from:number,range:number,frameCount=input.durationSeconds*30)=>({progress,renderedFrames,renderEstimatedTime}:{progress:number;renderedFrames:number;renderEstimatedTime:number})=>{
   const time=Date.now();if(time-lastUpdate<250&&progress<1)return;lastUpdate=time;
   const globalProgress=from+progress*range;
   send({status:'rendering',renderStage:stage,progress:globalProgress,renderedFrames,totalFrames:frameCount,updatedAt:time,cachedBackground,estimatedRemainingSeconds:estimate.update(time,globalProgress/.97,renderedFrames<frameCount?renderEstimatedTime:0)});
  };
  if(!background){
   send({status:'rendering',renderStage:'background',progress:0,renderedFrames:0,totalFrames:input.durationSeconds*30,cachedBackground:false});
   const composition=await selectComposition({serveUrl,id:'Background',inputProps:input,browserExecutable});checkCancelled();
   const candidate=join(workDir,'background.mov');
   await renderMedia({composition,serveUrl,inputProps:input,outputLocation:candidate,browserExecutable,codec:'h264',imageFormat:'png',pixelFormat:'yuv420p',concurrency:2,muted:true,ffmpegOverride:losslessBackgroundArgs,cancelSignal,onProgress:progressFor('background',0,.7)});
   checkCancelled();await verifyBackground(candidate,input.durationSeconds);checkCancelled();
   background=await cache.put('backgrounds',backgroundKey,candidate,input.durationSeconds);
  }
  checkCancelled();
  const base=cachedBackground?0:.7,remaining=cachedBackground?.97:.27;
  const screenKey=renderCacheKey('screens',version,input);
  let screen=input.templateId==='bleu-minuit'?await cache.get('screens',screenKey):null;
  if(screen){try{await verifyBackground(screen.path,input.durationSeconds);}catch{await cache.remove('screens',screenKey);screen=null;}}
  const needsScreen=input.templateId==='bleu-minuit'&&!screen;
  const introShare=needsScreen?.25:.45,screenShare=needsScreen?.35:0;
  const foreground=join(workDir,'foreground.mov');
  const composition=await selectComposition({serveUrl,id:'Foreground',inputProps:input,browserExecutable});checkCancelled();
  send({status:'rendering',renderStage:'personalization',progress:base,renderedFrames:0,totalFrames:input.durationSeconds*30,cachedBackground});
  await renderMedia({composition,serveUrl,inputProps:input,outputLocation:foreground,browserExecutable,codec:'h264',imageFormat:'png',pixelFormat:'yuv420p',frameRange:[0,INTRO_FRAMES],concurrency:2,muted:true,ffmpegOverride:losslessBackgroundArgs,cancelSignal,onProgress:progressFor('personalization',base,remaining*introShare,INTRO_FRAMES+1)});
  checkCancelled();
  if(needsScreen){
   const composition=await selectComposition({serveUrl,id:'ScreenLayer',inputProps:input,browserExecutable});checkCancelled();
   const candidate=join(workDir,'screen.mov');
   await renderMedia({composition,serveUrl,inputProps:input,outputLocation:candidate,browserExecutable,codec:'h264',imageFormat:'png',pixelFormat:'yuv420p',concurrency:2,muted:true,ffmpegOverride:losslessBackgroundArgs,cancelSignal,onProgress:progressFor('personalization',base+remaining*introShare,remaining*screenShare)});
   checkCancelled();await verifyBackground(candidate,input.durationSeconds);screen=await cache.put('screens',screenKey,candidate,input.durationSeconds);
  }
  const onComposite=progressFor('assembly',base+remaining*(introShare+screenShare),remaining*(1-introShare-screenShare));
  await compositeVideo({background:background.path,foreground,screen:screen?.path,output,totalFrames:input.durationSeconds*30,signal:controller.signal,onProgress:frames=>onComposite({progress:frames/(input.durationSeconds*30),renderedFrames:frames,renderEstimatedTime:0})});
  checkCancelled();send({status:'verifying',progress:.99,estimatedRemainingSeconds:null,updatedAt:Date.now()});
  await verifyMedia(output,input.durationSeconds);checkCancelled();
  await cache.put('exports',exportKey,output,input.durationSeconds);await cache.prune(protectedKeys);checkCancelled();
  send({status:'done',progress:1,finishedAt:Date.now(),cachedBackground,cachedExport:false,estimatedRemainingSeconds:0});
 }
}catch(e){send({status:cancelled?'cancelled':'error',error:e instanceof Error?e.message:'Erreur de rendu'});process.exitCode=1;}
finally{await rm(workDir,{force:true,recursive:true});process.disconnect?.();}
