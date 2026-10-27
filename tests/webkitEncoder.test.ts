import {test} from 'node:test';
import assert from 'node:assert/strict';
import {installRealtimeEncoder} from '../src/web/webkitEncoder';

test('WebKit workaround preserves H.264 settings, changes latency and restores the native encoder',async()=>{
 const previous=Object.getOwnPropertyDescriptor(globalThis,'VideoEncoder');
 let actual:VideoEncoderConfig|undefined;
 class Encoder{
  static async isConfigSupported(config:VideoEncoderConfig){actual=config;return {supported:true,config};}
  configure(config:VideoEncoderConfig){actual=config;}
 }
 Object.defineProperty(globalThis,'VideoEncoder',{value:Encoder,writable:true,configurable:true});
 try{
  const original=globalThis.VideoEncoder;
  const disabled=installRealtimeEncoder(false);assert.equal(globalThis.VideoEncoder,original);disabled();
  const restore=installRealtimeEncoder(true);
  const config={codec:'avc1.640028',width:1920,height:1080,bitrate:12_000_000,latencyMode:'quality'} as VideoEncoderConfig;
  try{
   await VideoEncoder.isConfigSupported(config);assert.deepEqual(actual,{...config,latencyMode:'realtime'});
   new VideoEncoder({output:()=>{},error:()=>{}}).configure(config);assert.deepEqual(actual,{...config,latencyMode:'realtime'});
  }finally{restore();}
  assert.equal(globalThis.VideoEncoder,original);
 }finally{if(previous)Object.defineProperty(globalThis,'VideoEncoder',previous);else Reflect.deleteProperty(globalThis,'VideoEncoder');}
});
