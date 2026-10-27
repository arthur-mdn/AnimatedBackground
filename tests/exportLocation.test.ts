import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {ExportLocation} from '../src/web/ExportLocation';
import type {ClientExportState} from '../src/web/ClientExport';
const base={capability:'ready',serverAvailable:false,ready:true,mode:'client',setMode:()=>{}} as const;
function markup(change:Partial<ClientExportState>={}){return renderToStaticMarkup(createElement(ExportLocation,{state:{...base,...change},disabled:false}));}
test('a compatible browser sees no server selector before a failed attempt',()=>{
 assert.doesNotMatch(markup(),/Sur le serveur|Lieu de génération/);
 assert.doesNotMatch(markup({capability:'checking',ready:false}),/Sur le serveur/);
});
test('incompatibility and export failure reveal an explicit server choice',()=>{
 const incompatible=markup({capability:'unsupported',ready:false,serverAvailable:true});
 assert.match(incompatible,/incompatible/);assert.match(incompatible,/disabled=""/);assert.match(incompatible,/Sur le serveur/);
 const failed=markup({serverAvailable:true});assert.match(failed,/Sur le serveur/);assert.match(failed,/aria-pressed="true"[^>]*>Sur cet appareil/);
});
