import {bundle} from '@remotion/bundler';
import {computeRenderVersion} from '../src/server/renderVersion.ts';
import {writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
await bundle({entryPoint:resolve('src/video/Root.tsx'),publicDir:resolve('public'),outDir:resolve('dist/video')});
await writeFile(resolve('dist/video/version.txt'),await computeRenderVersion());
console.log('Moteur vidéo prêt dans dist/video.');
