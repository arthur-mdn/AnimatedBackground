import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readExportAttempt,rememberExportAttempt,clearExportAttempt} from '../src/web/exportAttempt';

test('an unfinished browser export survives a page reload and a handled end clears it',()=>{
 const previous=Object.getOwnPropertyDescriptor(globalThis,'sessionStorage');
 const values=new Map<string,string>();
 Object.defineProperty(globalThis,'sessionStorage',{configurable:true,value:{getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>values.set(key,value),removeItem:(key:string)=>values.delete(key)}});
 try{
  assert.equal(readExportAttempt(),null);rememberExportAttempt('configuration');assert.equal(readExportAttempt(),'configuration');
  clearExportAttempt();assert.equal(readExportAttempt(),null);
  rememberExportAttempt('a'.repeat(17000));assert.equal(readExportAttempt(),null);
 }finally{if(previous)Object.defineProperty(globalThis,'sessionStorage',previous);else Reflect.deleteProperty(globalThis,'sessionStorage');}
});
test('private browsing storage errors do not prevent client export',()=>{
 assert.doesNotThrow(()=>rememberExportAttempt('a'));assert.doesNotThrow(clearExportAttempt);assert.equal(readExportAttempt(),null);
});
