import {staticFile} from 'remotion';
import {needsLightweightPreview} from '../video/PreviewPerformance';
import {installWebkitSvgCache} from './webkitSvgCache';
import {installRealtimeEncoder} from './webkitEncoder';
import {filename,VIDEO,type BirthdayInput} from '../shared/config';
import {findClientBackground,type ClientBackgroundManifest} from '../shared/clientExport';
import type {RenderMediaOnWebProgress} from '@remotion/web-renderer';

// Initialise before importing either encoder module: Safari lacks these symbols and
// their bundled disposal helpers otherwise capture a different fallback identity.
for(const name of ['dispose','asyncDispose'] as const){
 if(!(name in Symbol))Object.defineProperty(Symbol,name,{value:Symbol.for(`Symbol.${name}`)});
}
declare const __CLIENT_BACKGROUND_VERSION__:string;
export const clientBackgroundVersion=__CLIENT_BACKGROUND_VERSION__;
export type LocalExport={url:string;filename:string;seconds:number;bytes:number};
export async function availableClientBackground(input:BirthdayInput,signal?:AbortSignal){
 if(input.templateId!=='rose-poudre')return null;
 const response=await fetch('/client-backgrounds/manifest.json',{cache:'no-cache',signal});
 if(!response.ok)return null;
 const manifest:ClientBackgroundManifest=await response.json();
 return findClientBackground(manifest,clientBackgroundVersion,input);
}
export async function supportsClientExport(){
 if(!window.isSecureContext||!('VideoEncoder' in window))return false;
 const {canRenderMediaOnWeb}=await import('@remotion/web-renderer');
 return (await canRenderMediaOnWeb({...VIDEO,container:'mp4',videoCodec:'h264',muted:true,videoBitrate:12_000_000,outputTarget:'arraybuffer'})).canRender;
}
let fonts:Promise<void>|undefined;
async function loadFonts(){
 const {loadFont}=await import('@remotion/fonts');
 await Promise.all([
  loadFont({family:'Celebration',url:staticFile('fonts/alex-brush-latin-400-normal.woff2'),weight:'400'}),
  loadFont({family:'Celebration',url:staticFile('fonts/alex-brush-latin-ext-400-normal.woff2'),weight:'400',unicodeRange:'U+0100-02FF,U+1E00-1EFF'}),
  loadFont({family:'Portrait',url:staticFile('fonts/bodoni-moda-latin-700-normal.woff2'),weight:'700'}),
  loadFont({family:'Portrait',url:staticFile('fonts/bodoni-moda-latin-ext-700-normal.woff2'),weight:'700',unicodeRange:'U+0100-02FF,U+1E00-1EFF'}),
  loadFont({family:'GardenNames',url:staticFile('fonts/apple-chancery.ttf'),weight:'400'}),
  loadFont({family:'Invitation',url:staticFile('fonts/cormorant-garamond-latin-400-normal.woff2'),weight:'400'}),
  loadFont({family:'Invitation',url:staticFile('fonts/cormorant-garamond-latin-ext-400-normal.woff2'),weight:'400',unicodeRange:'U+0100-02FF,U+1E00-1EFF'}),
  loadFont({family:'NocturneDisplay',url:staticFile('fonts/outfit-latin-700-normal.woff2'),weight:'700'}),
  loadFont({family:'NocturneDisplay',url:staticFile('fonts/outfit-latin-ext-700-normal.woff2'),weight:'700',unicodeRange:'U+0100-02FF,U+1E00-1EFF'})
 ]);
}
function prepareFonts(){return fonts??=loadFonts().catch(error=>{fonts=undefined;throw error;});}
async function inlineTexture(path:string,signal:AbortSignal){
 const response=await fetch(staticFile(path.replace('.png','-client.webp')),{signal});if(!response.ok)throw Error('Texture indisponible.');
 const blob=await response.blob();
 return new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(Error('Texture illisible.'));reader.readAsDataURL(blob);});
}
export async function exportOnClient(input:BirthdayInput,signal:AbortSignal,onProgress:(progress:RenderMediaOnWebProgress)=>void):Promise<LocalExport>{
 const started=performance.now(),webkit=needsLightweightPreview(navigator.userAgent),rasterScale=webkit?.5:1;
 const [{renderMediaOnWeb,renderStillOnWeb},{ClientComposition},{Foreground}]=await Promise.all([import('@remotion/web-renderer'),import('./ClientComposition'),import('../video/Layers'),prepareFonts()]);
 signal.throwIfAborted();
 const background=await availableClientBackground(input,signal).catch(error=>{if(signal.aborted)throw error;return null;});
 const backgroundSrc=background?.src;
 const images:Record<string,string>={};
 if(!backgroundSrc&&input.templateId==='rose-poudre')await Promise.all([23,47,11,31].map(async seed=>{const path=`textures/ink-noise-${seed}.png`;images[path]=await inlineTexture(path,signal);}));
 signal.throwIfAborted();
 // The centre of the loop has a static foreground: rasterise it once, at full resolution.
 const hold=await renderStillOnWeb({composition:{id:'ForegroundHold',component:Foreground,defaultProps:input,...VIDEO,durationInFrames:input.durationSeconds*VIDEO.fps},inputProps:input,frame:270,signal,licenseKey:'free-license'});
 const holdSrc=await hold.url();
 const restoreEncoder=installRealtimeEncoder(webkit);
 const svgCache=installWebkitSvgCache(webkit);
 try{
 const result=await renderMediaOnWeb({composition:{id:'EventClient',component:ClientComposition,defaultProps:{...input,backgroundSrc,holdSrc,images,rasterScale},...VIDEO,durationInFrames:input.durationSeconds*VIDEO.fps},
  inputProps:{...input,backgroundSrc,holdSrc,images,rasterScale},container:'mp4',videoCodec:'h264',muted:true,videoBitrate:12_000_000,
  hardwareAcceleration:'no-preference',outputTarget:'arraybuffer',mediaCacheSizeInBytes:64*1024**2,pageResponsiveness:'medium',
  signal,onProgress,onFrame:async frame=>{await svgCache.nextFrame();return frame;},licenseKey:'free-license'});
 const blob=await result.getBlob();signal.throwIfAborted();
 return {url:URL.createObjectURL(blob),filename:filename(input),seconds:(performance.now()-started)/1000,bytes:blob.size};
 }finally{svgCache.restore();restoreEncoder();URL.revokeObjectURL(holdSrc);}
}
