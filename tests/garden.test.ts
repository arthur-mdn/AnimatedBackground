import {test} from 'node:test';
import assert from 'node:assert/strict';
import {defaults,inputSchema} from '../src/shared/config';
import {gardenPalettes,gardenTone} from '../src/shared/garden';
import {hexHsl,cssRGB} from '../src/shared/color';
test('Jardin : palettes imposées claires et teintes du feuillage',()=>{
 for(const palette of gardenPalettes){
  assert.equal(inputSchema.parse({...defaults,gardenPalette:palette.id}).gardenPalette,palette.id);
  assert.ok(hexHsl(palette.background).l>.94);
  for(const hex of ['#819a76','#eef1d9','#7d9772','#bbc9a8','#587b57']){
   const tone=gardenTone(hex,palette.id);
   assert.ok(cssRGB(tone).every(channel=>Number.isFinite(channel)&&channel>=0&&channel<=1));
   if(palette.id==='ivoire')assert.equal(tone,hex);
  }
 }
 for(const gardenPalette of ['custom','#123456','inconnue'])assert.equal(inputSchema.safeParse({...defaults,gardenPalette}).success,false);
});
