import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequestOriginPolicy} from '../src/server/requestOrigin';
const domain='animatedbackground.privateevents.fr',publicUrl=`https://${domain}`;
const local={hostname:'localhost',host:'localhost:3000',protocol:'http'};
const proxy={hostname:domain,host:domain,protocol:'http'};
test('Local : conservation du contrôle Host et Origin sans domaine public',()=>{
 const accepts=createRequestOriginPolicy();
 assert.equal(accepts(local),true);assert.equal(accepts({...local,origin:'http://localhost:3000'}),true);
 assert.equal(accepts({...local,origin:'https://evil.example'}),false);
 assert.equal(accepts({...local,origin:'http://localhost:3001'}),false);
 assert.equal(accepts(proxy),false);
 assert.equal(accepts({hostname:'127.0.0.1',host:'127.0.0.1:3001',protocol:'http'}),true);
 assert.equal(accepts({hostname:'[::1]',host:'[::1]:3001',protocol:'http',origin:'http://[::1]:3001'}),true);
});
test('Production : origine HTTPS acceptée derrière un proxy HTTP, sans faire confiance aux en-têtes forwardés',()=>{
 const accepts=createRequestOriginPolicy(publicUrl);
 assert.equal(accepts({...proxy,origin:publicUrl}),true);assert.equal(accepts(proxy),true);
 assert.equal(accepts({...proxy,origin:`http://${domain}`}),false);
 assert.equal(accepts({...proxy,origin:'https://evil.example'}),false);
 assert.equal(accepts({...proxy,origin:'null'}),false);
 assert.equal(accepts({...proxy,hostname:'evil.example',origin:publicUrl}),false);
 assert.equal(accepts({...proxy,hostname:`${domain}.evil.example`,origin:publicUrl}),false);
 assert.equal(accepts({...proxy,hostname:`www.${domain}`,origin:publicUrl}),false);
 assert.equal(accepts({...proxy,hostname:domain.toUpperCase(),origin:publicUrl}),true);
});
test('Production : accès local conservé pour healthcheck et préchauffage du cache',()=>{
 const accepts=createRequestOriginPolicy(publicUrl);
 assert.equal(accepts(local),true);
 assert.equal(accepts({...local,origin:publicUrl}),false);
 assert.equal(accepts({...local,origin:'http://localhost:3000'}),true);
});
test('PUBLIC_URL refuse les valeurs ambiguës et normalise le slash final et le port HTTPS standard',()=>{
 for(const value of ['not-a-url','ftp://example.com','https://user:pass@example.com','https://example.com/app','https://example.com/?a=1','https://example.com/#fragment'])assert.throws(()=>createRequestOriginPolicy(value));
 const accepts=createRequestOriginPolicy(`https://${domain}:443/`);
 assert.equal(accepts({...proxy,origin:publicUrl}),true);
});
