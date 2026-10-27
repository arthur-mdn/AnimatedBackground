import {test} from 'node:test';
import assert from 'node:assert/strict';
import {exportPolicy} from '../src/shared/exportPolicy';

test('local export is the only available choice until incompatibility or a failed attempt',()=>{
 assert.deepEqual(exportPolicy('checking','client',null,'a'),{serverAvailable:false,canGenerate:false,selected:true});
 assert.deepEqual(exportPolicy('ready','client',null,'a'),{serverAvailable:false,canGenerate:true,selected:true});
 assert.equal(exportPolicy('ready','server',null,'a').canGenerate,false);
 assert.deepEqual(exportPolicy('unsupported','client',null,'a'),{serverAvailable:true,canGenerate:false,selected:true});
 assert.deepEqual(exportPolicy('unsupported','server',null,'a'),{serverAvailable:true,canGenerate:true,selected:false});
 assert.equal(exportPolicy('ready','client','a','a').serverAvailable,true);
 assert.equal(exportPolicy('ready','server','a','a').canGenerate,true);
 assert.equal(exportPolicy('ready','server','a','b').serverAvailable,false);
});
