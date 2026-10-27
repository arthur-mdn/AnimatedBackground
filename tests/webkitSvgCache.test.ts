import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSvgFrameCache} from '../src/web/webkitSvgCache';

test('only superseded background images are released; an unchanged drawable stays usable',()=>{
 const cache=createSvgFrameCache(),ink={src:'ink-1'},same=ink,next={src:'ink-2'},other={src:'sky-1'};
 cache.use('ink',ink);cache.use('ink',same);assert.equal(ink.src,'ink-1');
 cache.use('night',other);cache.use('ink',next);assert.equal(ink.src,'');assert.equal(next.src,'ink-2');assert.equal(other.src,'sky-1');
 cache.clear();assert.equal(next.src,'');assert.equal(other.src,'');
});
