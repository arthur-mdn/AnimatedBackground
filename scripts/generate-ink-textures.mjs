import {bundle} from '@remotion/bundler';
import {selectComposition,renderStill} from '@remotion/renderer';
import {resolve} from 'node:path';
import {mkdir} from 'node:fs/promises';
const browserExecutable=process.env.CHROME_PATH;
const serveUrl=await bundle({entryPoint:resolve('scripts/InkNoiseRoot.tsx')});
await mkdir('public/textures',{recursive:true});
for(const [seed,texture] of [[23,false],[47,false],[11,true],[31,true]]){
 const inputProps={seed,texture};
 const composition=await selectComposition({serveUrl,id:'InkNoise',inputProps,browserExecutable});
 await renderStill({serveUrl,composition,inputProps,browserExecutable,frame:0,imageFormat:'png',output:resolve(`public/textures/ink-noise-${seed}.png`)});
 console.log('Texture',seed);
}
