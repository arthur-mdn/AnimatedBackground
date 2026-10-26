import {test} from 'node:test';
import assert from 'node:assert/strict';
import {nuggetFlow,nuggetSparkle} from '../src/video/GoldNuggets';
import {inkSpread,inkWaterMotion} from '../src/video/RoseInk';
import {mixColors} from '../src/shared/color';
test('Pépites : transport par le front liquide et retour avec le fluide',()=>{
 const still={x:0,y:0,phase:0};
 assert.deepEqual(nuggetFlow(120,80,0,still),{x:120,y:80});
 const end=nuggetFlow(120,80,1,still);
 assert.ok(Math.abs(end.x-306)<1e-9&&Math.abs(end.y-204)<1e-9);
 for(const total of [900,1350,5400])for(let frame=0;frame<total;frame+=13){
  const mirrored=total-1-frame;
  const a=nuggetFlow(120,80,inkSpread(frame,total),inkWaterMotion(frame,total));
  const b=nuggetFlow(120,80,inkSpread(mirrored,total),inkWaterMotion(mirrored,total));
  assert.deepEqual(a,b);
  assert.ok(Math.hypot(a.x,a.y)<250+450*inkSpread(frame,total));
 }
});
test('Pépites : trois reflets progressifs par fragment éligible',()=>{
 let pulses=0,lit=false;
 for(let frame=0;frame<1350;frame++){
  const value=nuggetSparkle(frame,1350,0,13);
  if(value>0&&!lit)pulses++;
  lit=value>0;
 }
 assert.equal(pulses,3);
});
test('Dilution : mélange de couleur vers le papier, borné aux deux extrémités',()=>{
 assert.equal(mixColors('#804040','#fff0e0',0),'rgb(128 64 64)');
 assert.equal(mixColors('#804040','#fff0e0',1),'rgb(255 240 224)');
 assert.equal(mixColors('#804040','#fff0e0',.5),'rgb(192 152 144)');
 assert.equal(mixColors('#804040','#fff0e0',2),mixColors('#804040','#fff0e0',1));
});

test('Contour : mouvement continu pendant le palier, rayon constant et raccord identique',async()=>{
 const {inkEdgeMotion}=await import('../src/video/RoseInk');
 const total=1350;
 assert.deepEqual(inkEdgeMotion(0,total),inkEdgeMotion(total-1,total));
 assert.equal(inkSpread(510,total),1);assert.equal(inkSpread(570,total),1);
 assert.notDeepEqual(inkEdgeMotion(510,total),inkEdgeMotion(570,total));
 for(const duration of [900,1350,5400])for(let frame=1;frame<duration;frame++){
  const a=inkEdgeMotion(frame-1,duration),b=inkEdgeMotion(frame,duration);
  assert.ok(Math.abs(b.x)<=5&&Math.abs(b.y)<=4&&Math.abs(b.phase)<=.12);
  assert.ok(Math.abs(a.x-b.x)<.15&&Math.abs(a.y-b.y)<.2&&Math.abs(a.phase-b.phase)<.004);
 }
});

test('Déversement : six pépites au départ, nouvelles entrées depuis le hors-champ',async()=>{
 const {nuggetPour,NUGGET_COUNT,NUGGET_RESIDENT_COUNT}=await import('../src/video/GoldNuggets');
 const water={x:0,y:0,phase:0};
 for(const seed of [13,47]){
  const visible=(spread:number)=>Array.from({length:NUGGET_COUNT},(_,i)=>nuggetPour(i,seed,spread,water)).filter(p=>p.x>=0&&p.y>=0&&Math.hypot(p.x,p.y)<250+450*spread).length;
  assert.equal(visible(0),NUGGET_RESIDENT_COUNT);
  assert.ok(visible(.6)>visible(0));
  assert.equal(visible(1),NUGGET_COUNT);
  for(let i=NUGGET_RESIDENT_COUNT;i<NUGGET_COUNT;i++){
   const start=nuggetPour(i,seed,0,water),end=nuggetPour(i,seed,1,water);
   assert.ok(start.x<=-90&&start.y<=-90);
   assert.ok(end.x>0&&end.y>0&&Math.hypot(end.x,end.y)<=580.000001);
   for(const spread of [.2,.4,.6,.8,1]){
    const p=nuggetPour(i,seed,spread,water);
    assert.ok(Math.abs((p.x-start.x)-(p.y-start.y))<1e-9,'Le déplacement doit suivre la diagonale du déversement.');
   }
  }
 }
 for(let frame=0;frame<1350;frame+=13){
  const reverse=1349-frame;
  for(const i of [0,6,15,31])assert.deepEqual(nuggetPour(i,13,inkSpread(frame,1350),inkWaterMotion(frame,1350)),nuggetPour(i,13,inkSpread(reverse,1350),inkWaterMotion(reverse,1350)));
 }
});
