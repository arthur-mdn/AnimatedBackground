import {test} from 'node:test';
import assert from 'node:assert/strict';
import {defaults,inputSchema,filename,templates} from '../src/shared/config';
import {backgroundSettings,exportSettings} from '../src/server/renderCache';
import {festiveBurstProgress} from '../src/video/Festive';

for(const templateId of ['feux-artifice','coeurs-aquarelle'] as const){
 test(`${templateId}: birthday validation, filename and independent backdrop cache`,()=>{
  const input={...defaults,templateId};assert.equal(inputSchema.safeParse(input).success,true);
  assert.equal(inputSchema.safeParse({...input,firstName:''}).success,false);
  assert.equal(inputSchema.safeParse({...input,age:0}).success,false);
  assert.equal(templates.find(t=>t.id===templateId)?.category,'birthday');
  assert.match(filename(input),new RegExp(templateId==='feux-artifice'?'eclats':'tendresse'));
  assert.deepEqual(backgroundSettings(input),backgroundSettings({...input,firstName:'Camille',age:28,nocturneColor:'#ff0000',ornament:'none'}));
  assert.notDeepEqual(exportSettings(input),exportSettings({...input,firstName:'Camille'}));
  assert.notDeepEqual(backgroundSettings(input),backgroundSettings({...input,durationSeconds:60}));
 });
}
test('firework cycles close at the last encoded frame for every supported duration',()=>{
 for(const seconds of [30,45,61,180])for(const offset of [.15,.4,.62,.85]){
  const total=seconds*30;assert.ok(Math.abs(festiveBurstProgress(0,total,offset)-festiveBurstProgress(total-1,total,offset))<1e-10);
  for(const frame of [0,1,200,total-1]){const progress=festiveBurstProgress(frame,total,offset);assert.ok(progress>=0&&progress<1);}
 }
});

test('festive palettes are validated and keep background and export caches distinct',()=>{
 for(const [templateId,key,ids] of [
  ['feux-artifice','fireworksPalette',['or','emeraude','prune','argent']],
  ['coeurs-aquarelle','heartsPalette',['rose','peche','lilas','sauge']],
 ] as const){
  const backgrounds=new Set<string>(),exports=new Set<string>();
  for(const id of ids){
   const input={...defaults,templateId,[key]:id};
   assert.equal(inputSchema.safeParse(input).success,true);
   backgrounds.add(JSON.stringify(backgroundSettings(input)));
   exports.add(JSON.stringify(exportSettings(input)));
   const other=key==='fireworksPalette'?{heartsPalette:'sauge' as const}:{fireworksPalette:'argent' as const};
   assert.deepEqual(backgroundSettings(input),backgroundSettings({...input,...other}));
  }
  assert.equal(backgrounds.size,4);assert.equal(exports.size,4);
  assert.equal(inputSchema.safeParse({...defaults,templateId,[key]:'invalid'}).success,false);
 }
});
