import {test} from 'node:test';
import assert from 'node:assert/strict';
import {RenderEstimate} from '../src/server/renderEstimate';
test('Estimation : attend des mesures puis suit la vitesse réelle du rendu',()=>{
 const estimate=new RenderEstimate();
 assert.equal(estimate.update(0,0,0),null);
 assert.equal(estimate.update(1000,.1,0),null);
 assert.equal(estimate.update(4000,.4,0),8);
 assert.equal(estimate.update(10000,.5,0),12);
});
test('Estimation : inclut le calcul des images et évite les chiffres invalides',()=>{
 const estimate=new RenderEstimate();estimate.update(0,0,0);
 assert.equal(estimate.update(4000,.4,20000),22);
 assert.equal(estimate.update(5000,.5,Infinity),7);
 assert.equal(estimate.update(6000,1,0),2);
});
test('Estimation : se réinitialise si la progression reste bloquée',()=>{
 const estimate=new RenderEstimate();estimate.update(0,0,0);estimate.update(4000,.4,0);
 for(let time=5000;time<=20000;time+=1000)estimate.update(time,.4,0);
 assert.equal(estimate.update(21000,.4,0),null);
});
