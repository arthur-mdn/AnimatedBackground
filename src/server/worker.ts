import {bundle} from '@remotion/bundler';
import {makeCancelSignal,renderMedia,selectComposition} from '@remotion/renderer';
import {resolve} from 'node:path';
import {access} from 'node:fs/promises';
import {inputSchema} from '../shared/config';
import {verifyMedia} from './media';
const {cancelSignal,cancel}=makeCancelSignal();
let cancelled=false;
process.on('message',m=>{if(m==='cancel'){cancelled=true;cancel();}});
const send=(data:unknown)=>process.send?.(data);
try{
 const input=inputSchema.parse(JSON.parse(process.env.RENDER_INPUT!));
 await Promise.all(['alex-brush-latin-400-normal.woff2','alex-brush-latin-ext-400-normal.woff2','bodoni-moda-latin-700-normal.woff2','bodoni-moda-latin-ext-700-normal.woff2'].map(f=>access(resolve('public/fonts',f))));
 const browserExecutable=process.env.CHROME_PATH||undefined;
 const serveUrl=await bundle({entryPoint:resolve('src/video/Root.tsx'),publicDir:resolve('public')});
 if(cancelled)throw new Error('Annulé');
 const composition=await selectComposition({serveUrl,id:'Birthday',inputProps:input,browserExecutable});
 if(cancelled)throw new Error('Annulé');
 send({status:'rendering',progress:0});
 await renderMedia({composition,serveUrl,codec:'h264',inputProps:input,outputLocation:process.env.RENDER_OUTPUT!,browserExecutable,concurrency:2,crf:18,pixelFormat:'yuv420p',muted:true,colorSpace:'bt709',cancelSignal,onProgress:({progress})=>send({status:'rendering',progress:Math.min(.97,progress*.97)})});
 if(cancelled)throw new Error('Annulé');
 send({status:'verifying',progress:.98});
 await verifyMedia(process.env.RENDER_OUTPUT!,input.durationSeconds);
 send({status:'done',progress:1});
}catch(e){send({status:cancelled?'cancelled':'error',error:e instanceof Error?e.message:'Erreur de rendu'});process.exitCode=1;}
finally{process.disconnect?.();}
