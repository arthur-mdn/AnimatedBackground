import {test} from 'node:test';
import assert from 'node:assert/strict';
import {foregroundTimeline,INTRO_FRAMES,compositeFilter} from '../src/server/composite';
test('Entrée, maintien et sortie miroir gardent exactement la durée et les raccords',()=>{
 for(const seconds of [30,45,180]){
  const {entry,hold,exit}=foregroundTimeline(seconds*30);
  const frames=[...Array.from({length:entry},(_,i)=>i),...Array(hold).fill(INTRO_FRAMES),...Array.from({length:exit},(_,i)=>INTRO_FRAMES-1-i)];
  assert.equal(frames.length,seconds*30);
  for(let i=0;i<frames.length;i++)assert.equal(frames[i],Math.min(i,frames.length-1-i,INTRO_FRAMES));
 }
 assert.throws(()=>foregroundTimeline(100));
});
test('Le mélange écran nocturne conserve un fond noir hors de l’âge transparent',()=>{
 assert.match(compositeFilter(1350,true),/premultiply=inplace=1/);
 assert.match(compositeFilter(1350,true),/blend=all_mode=screen/);
 assert.doesNotMatch(compositeFilter(1350),/blend=/);
});

import {execFile,spawnSync} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {compositeVideo} from '../src/server/composite';
const exec=promisify(execFile);
test('FFmpeg : 900 images réelles, maintien et sortie sans image perdue', {skip:spawnSync('ffmpeg',['-version']).status!==0},async()=>{
 const dir=await mkdtemp(join(tmpdir(),'animated-composite-'));
 try{
  const bg=join(dir,'bg.mov'),fore=join(dir,'fore.mov'),output=join(dir,'out.mp4');
  await exec('ffmpeg',['-v','error','-f','lavfi','-i','color=black:s=16x16:r=30:d=30','-c:v','png',bg]);
  await exec('ffmpeg',['-v','error','-f','lavfi','-i',"nullsrc=s=16x16:r=30,format=rgba,geq=r='N/2':g='N/2':b='N/2':a=255",'-frames:v','271','-c:v','png',fore]);
  await compositeVideo({background:bg,foreground:fore,output,totalFrames:900,signal:new AbortController().signal,onProgress:()=>{}});
  const {stdout}=await exec('ffprobe',['-v','error','-show_streams','-show_format','-of','json',output]);
  const probe=JSON.parse(stdout);assert.equal(Number(probe.streams[0].nb_frames),900);assert.equal(Number(probe.format.duration),30);
  const {stdout:raw}=await exec('ffmpeg',['-v','error','-i',output,'-f','rawvideo','-pix_fmt','rgb24','-'],{encoding:'buffer'});
  for(const frame of [0,1,268,269,270,271,450,628,629,630,631,898,899]){
   const expected=Math.floor(Math.min(frame,899-frame,270)/2),value=raw[frame*16*16*3];
   assert.ok(Math.abs(value-expected)<=3,`image ${frame} : ${value} au lieu de ${expected}`);
  }
 }finally{await rm(dir,{force:true,recursive:true});}
});
