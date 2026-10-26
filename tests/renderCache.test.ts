import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,writeFile,readFile,stat,utimes,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {defaults} from '../src/shared/config';
import {RenderCache,renderCacheKey,publishFile} from '../src/server/renderCache';
import {losslessBackgroundArgs} from '../src/server/lossless';
import {computeRenderVersion} from '../src/server/renderVersion';
test('Clés : fond indépendant des textes, exports sensibles aux personnalisations et version',()=>{
 for(const templateId of ['rose-poudre','bleu-minuit','jardin-mariage'] as const){
  const input={...defaults,templateId};
  const changed={...input,firstName:'Autre',age:18,messageLine1:'Bravo',brideName:'Laura',groomName:'Maxime',weddingDate:'2026-10-26'};
  assert.equal(renderCacheKey('backgrounds','a',input),renderCacheKey('backgrounds','a',changed));
  assert.notEqual(renderCacheKey('exports','a',input),renderCacheKey('exports','a',changed));
  assert.notEqual(renderCacheKey('backgrounds','a',input),renderCacheKey('backgrounds','b',input));
  assert.notEqual(renderCacheKey('backgrounds','a',input),renderCacheKey('backgrounds','a',{...input,durationSeconds:60}));
 }
 assert.notEqual(renderCacheKey('backgrounds','a',defaults),renderCacheKey('backgrounds','a',{...defaults,showGoldNuggets:false}));
 assert.notEqual(renderCacheKey('backgrounds','a',defaults),renderCacheKey('backgrounds','a',{...defaults,watercolorColor:'#648DB5'}));
 assert.equal(renderCacheKey('exports','a',defaults),renderCacheKey('exports','a',{...defaults,brideName:'Champ masqué'}));
 assert.equal(renderCacheKey('backgrounds','a',{...defaults,watercolorColor:'#cf7e7f'}),renderCacheKey('backgrounds','a',defaults));
});
test('Cache persistant : publication complète, restauration et refus des entrées incomplètes',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'animated-cache-'));
 try{
  const key=renderCacheKey('exports','v',defaults),source=join(dir,'source.mp4');await writeFile(source,Buffer.alloc(2048,42));
  const cache=new RenderCache(dir);assert.equal(await cache.get('exports',key),null);
  await cache.put('exports',key,source,45);
  const entry=await new RenderCache(dir).get('exports',key);assert.ok(entry);
  const target=join(dir,'job.mp4');await publishFile(entry.path,target);assert.deepEqual(await readFile(target),await readFile(source));
  await writeFile(entry.path,Buffer.alloc(64));assert.equal(await cache.get('exports',key),null);
  await assert.rejects(()=>cache.get('exports','../outside'));
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('Cache borné : suppression LRU et conservation des fichiers utilisés / téléchargements',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'animated-cache-lru-'));
 try{
  const cache=new RenderCache(dir,3000),a='a'.repeat(64),b='b'.repeat(64),source=join(dir,'source.mp4');await writeFile(source,Buffer.alloc(2048));
  await cache.put('exports',a,source,45);await cache.put('exports',b,source,45);
  await utimes(join(cache.root,'exports',a+'.json'),new Date(0),new Date(0));
  await cache.prune([`exports:${b}`]);
  assert.equal(await cache.get('exports',a),null);assert.ok(await cache.get('exports',b));assert.equal((await stat(source)).size,2048);
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('Fond sans perte : entrée PNG préservée, paquets PNG remuxés sans conversion ni réencodage',()=>{
 const args=['-vcodec','png','-i','-','-c:v','libx264','-pix_fmt','yuv420p','-crf','18','-y','file.mov'];
 const result=losslessBackgroundArgs({type:'pre-stitcher',args});
 assert.deepEqual(result,['-vcodec','png','-i','-','-c:v','copy','-y','-f','mov','file.mov']);
 assert.ok(losslessBackgroundArgs({type:'stitcher',args:['-i','input.mov','-c:v','copy','out.mov']}).includes('copy'));
});
test('Version : les sources et les ressources invalident les fonds, les dates de fichiers ne comptent pas',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'animated-version-'));
 try{
  for(const folder of ['src/video','src/shared','src/server','public'])await mkdir(join(dir,folder),{recursive:true});
  await writeFile(join(dir,'src/server/worker.ts'),'worker');await writeFile(join(dir,'src/server/lossless.ts'),'lossless');await writeFile(join(dir,'src/server/composite.ts'),'composite');await writeFile(join(dir,'package-lock.json'),'{}');const path=join(dir,'src/video/scene.tsx');await writeFile(path,'original');
  const first=await computeRenderVersion(dir);await utimes(path,new Date(0),new Date(0));assert.equal(await computeRenderVersion(dir),first);
  for(const icon of ['favicon.svg','favicon.ico','apple-touch-icon.png'])await writeFile(join(dir,'public',icon),'browser icon');
  assert.equal(await computeRenderVersion(dir),first);
  await writeFile(join(dir,'public','video-texture.png'),'video asset');assert.notEqual(await computeRenderVersion(dir),first);
  await rm(join(dir,'public','video-texture.png'));
  await writeFile(path,'modified');assert.notEqual(await computeRenderVersion(dir),first);
 }finally{await rm(dir,{recursive:true,force:true});}
});

test('Couche âge nocturne réutilisée entre prénoms mais invalidée par âge / palette',()=>{
 const p={...defaults,templateId:'bleu-minuit' as const};
 assert.equal(renderCacheKey('screens','v',p),renderCacheKey('screens','v',{...p,firstName:'Laura',messageLine1:'Bravo'}));
 assert.notEqual(renderCacheKey('screens','v',p),renderCacheKey('screens','v',{...p,age:18}));
 assert.notEqual(renderCacheKey('screens','v',p),renderCacheKey('screens','v',{...p,nocturnePalette:'custom',nocturneColor:'#AE4937'}));
});
