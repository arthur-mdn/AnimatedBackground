import {test} from 'node:test';
import assert from 'node:assert/strict';
import {renderToStaticMarkup} from 'react-dom/server';
import {createElement,Fragment} from 'react';
import {PreviewPerformance,needsLightweightPreview} from '../src/video/PreviewPerformance';
import {NocturneBackdrop} from '../src/video/Nocturne';
import {WeddingFoliage} from '../src/video/WeddingFoliage';

const safari='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15';
const chrome='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';
test('Aperçu : Safari et les navigateurs iOS utilisent le chemin léger, Chromium/Firefox restent complets',()=>{
 assert.equal(needsLightweightPreview(safari),true);assert.equal(needsLightweightPreview(chrome),false);
 assert.equal(needsLightweightPreview(chrome.replace('Macintosh; Intel Mac OS X 10_15_7','iPad; CPU OS 18_0 like Mac OS X').replace('Chrome/141.0.0.0','CriOS/141.0.0.0')),true);
 assert.equal(needsLightweightPreview('Mozilla/5.0 Gecko/20100101 Firefox/144.0'),false);
 assert.equal(needsLightweightPreview('Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/141.0.0.0 Mobile Safari/537.36'),false);
 assert.equal(needsLightweightPreview(chrome+' Edg/141.0.0.0'),false);
});
function scene(enabled:boolean){return renderToStaticMarkup(createElement(PreviewPerformance,{enabled,children:createElement(Fragment,null,createElement(NocturneBackdrop,{phase:1}),createElement(WeddingFoliage,{phase:1}))}));}
test('Aperçu léger : aucun filtre animé sur les nuages, lumières et feuillage ; le masque de nuages est précalculé',()=>{
 const full=scene(false),preview=scene(true);
 assert.match(full,/filter="url\(#night-cloud-texture\)"/);assert.match(full,/filter="url\(#wedding-leaf-soft\)"/);
 assert.doesNotMatch(preview,/filter="url\(#(?:night-cloud-texture|night-beam-soft|night-glow|wedding-leaf-soft)\)"/);
 assert.match(preview,/nocturne-cloud-mask\.png/);assert.match(preview,/mask-type:alpha/);
 assert.ok(preview.length<full.length);
});
test('Export : même si le mode léger est demandé, le moteur force la scène complète',()=>{
 const full=scene(false),previous=(globalThis as any).window;
 try{
  (globalThis as any).window={process:{env:{NODE_ENV:'production'}},remotion_puppeteerTimeout:30000};
  assert.equal(scene(true),full);
 }finally{if(previous===undefined)delete (globalThis as any).window;else (globalThis as any).window=previous;}
});
