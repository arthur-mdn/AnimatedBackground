import {test} from 'node:test';
import assert from 'node:assert/strict';
import {defaults} from '../src/shared/config';
import {clientBackgroundKey,findClientBackground} from '../src/shared/clientExport';

test('client scenery identity excludes personal fields and includes all visual background settings',()=>{
 const key=clientBackgroundKey(defaults);
 assert.equal(key,clientBackgroundKey({...defaults,firstName:'Élodie',age:28,messageLine1:'Pour toi',ornament:'champagne'}));
 for(const change of [{watercolorColor:'#506050'},{durationSeconds:60},{showGoldNuggets:false}])assert.notEqual(key,clientBackgroundKey({...defaults,...change}));
 assert.equal(clientBackgroundKey({...defaults,templateId:'jardin-mariage'}),null);
});
test('only matching, versioned, same-origin generated scenery can be selected',()=>{
 const version='0123456789abcdef0123',key=clientBackgroundKey(defaults)!;
 const asset={key,bytes:1000,src:`/client-backgrounds/${version}/${key}-0123456789abcdef.mp4`};
 assert.equal(findClientBackground({version,assets:[asset]},version,defaults),asset);
 assert.equal(findClientBackground({version:'old',assets:[asset]},version,defaults),null);
 for(const src of ['https://example.com/video.mp4','/api/jobs/private/download',`/client-backgrounds/${version}/../private.mp4`])assert.equal(findClientBackground({version,assets:[{...asset,src}]},version,defaults),null);
 assert.equal(findClientBackground(null,version,defaults),null);
});
