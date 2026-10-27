import {test} from 'node:test';
import assert from 'node:assert/strict';
import {thinGlyph,traceGlyph,writingProgress,WEDDING_WRITING} from '../src/video/handwriting';
test('Le tracé suit le centre du trait rempli, sans effacer le fût',()=>{
 const width=24,height=28,pixels=new Uint8Array(width*height);
 for(let y=4;y<24;y++)for(let x=8;x<15;x++)pixels[y*width+x]=1;
 const skeleton=thinGlyph(pixels,width,height),ink=pixels.reduce((a,b)=>a+b,0),center=skeleton.reduce((a,b)=>a+b,0);
 assert.ok(center>8&&center<ink/3);
 const strokes=traceGlyph(pixels,width,height);assert.ok(strokes.length>0);
 for(const stroke of strokes)for(let i=1;i<stroke.points.length;i++)assert.ok(Math.hypot(stroke.points[i][0]-stroke.points[i-1][0],stroke.points[i][1]-stroke.points[i-1][1])<=Math.SQRT2+.001);
 for(const stroke of strokes)for(const [x,y] of stroke.points)assert.equal(pixels[Math.floor(y)*width+Math.floor(x)],1);
});
test('Les éléments détachés du glyphe sont tracés après son corps',()=>{
 const width=24,height=28,pixels=new Uint8Array(width*height);
 for(let y=10;y<24;y++)for(let x=9;x<14;x++)pixels[y*width+x]=1;
 for(let y=3;y<6;y++)for(let x=10;x<13;x++)pixels[y*width+x]=1;
 const strokes=traceGlyph(pixels,width,height);assert.ok(strokes.length>=2);
 assert.ok(strokes[0].points.every(([,y])=>y>=10));assert.ok(strokes.at(-1)!.points.every(([,y])=>y<6));
});
test('Un trait ouvert se dessine de gauche à droite',()=>{
 const width=40,height=16,pixels=new Uint8Array(width*height);
 for(let x=4;x<36;x++)for(let y=6;y<10;y++)pixels[y*width+x]=1;
 const strokes=traceGlyph(pixels,width,height);assert.equal(strokes.length,1);
 assert.ok(strokes[0].points[0][0]<strokes[0].points.at(-1)![0]);
});
test('Un contour fermé et une lettre absente terminent leur tracé',()=>{
 const width=24,height=24,pixels=new Uint8Array(width*height);
 for(let y=4;y<20;y++)for(let x=4;x<20;x++)if(x<8||x>15||y<8||y>15)pixels[y*width+x]=1;
 const skeleton=thinGlyph(pixels,width,height),strokes=traceGlyph(pixels,width,height),visited=new Set(strokes.flatMap(s=>s.points.map(([x,y])=>Math.floor(y)*width+Math.floor(x))));
 for(let i=0;i<skeleton.length;i++)if(skeleton[i])assert.ok(visited.has(i));
 assert.deepEqual(traceGlyph(new Uint8Array(100),10,10),[]);
});
test('Écriture continue, maintien complet avant 9 s et sortie miroir à toutes les durées',()=>{
 for(const total of [900,1350,5400])for(const {start,length} of [WEDDING_WRITING.firstName,WEDDING_WRITING.ampersand,WEDDING_WRITING.secondName]){
  assert.equal(writingProgress(0,total,start,length),0);assert.equal(writingProgress(270,total,start,length),1);
  for(let frame=0;frame<total;frame++)assert.equal(writingProgress(frame,total,start,length),writingProgress(total-1-frame,total,start,length));
 }
 assert.ok(writingProgress(40,1350,.7,2.3)>writingProgress(39,1350,.7,2.3));
});

test('Le & a son créneau après le premier prénom, terminé avant le second prénom',()=>{
 const {firstName,ampersand,secondName,date}=WEDDING_WRITING;
 assert.ok(firstName.length<2.3&&secondName.length<2.45);
 assert.ok(firstName.start+firstName.length<=ampersand.start);
 assert.ok(ampersand.start+ampersand.length<secondName.start);
 assert.ok(secondName.start+secondName.length<date.start);
 for(const total of [900,1350,5400]){
  const start=Math.round(secondName.start*30);
  assert.equal(writingProgress(start,total,firstName.start,firstName.length),1);
  assert.equal(writingProgress(start,total,ampersand.start,ampersand.length),1);
  assert.equal(writingProgress(start,total,secondName.start,secondName.length),0);
 }
});
