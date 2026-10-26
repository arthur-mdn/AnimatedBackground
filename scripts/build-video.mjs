import {bundle} from '@remotion/bundler';
import {resolve} from 'node:path';
await bundle({entryPoint:resolve('src/video/Root.tsx'),publicDir:resolve('public'),outDir:resolve('dist/video')});
console.log('Moteur vidéo prêt dans dist/video.');
