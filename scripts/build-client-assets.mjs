import {spawn} from 'node:child_process';
import {mkdir} from 'node:fs/promises';

function ffmpeg(args){return new Promise((resolve,reject)=>{const process=spawn('ffmpeg',['-hide_banner','-loglevel','error','-y',...args],{stdio:'inherit'});process.on('error',reject);process.on('exit',code=>code===0?resolve():reject(Error('Préparation des médias impossible.')));});}
await mkdir('public/media/bird-frames',{recursive:true});
const grade="format=rgb24,lutrgb=r='min(255,1.04*pow(val/255,3)*255)':g='min(255,1.04*pow(val/255,3)*255)':b='min(255,1.04*pow(val/255,3)*255)',colorchannelmixer=rr=.48819:rg=.46488:rb=.04693:gr=.13819:gg=.81488:gb=.04693:br=.13819:bg=.46488:bb=.39693,lutrgb=r='val*.58+255*.42':g='val*.58+255*.42':b='val*.58+255*.42',format=rgba,colorkey=0xFEFEFE:0.003:0.08";
await ffmpeg(['-i','public/media/wedding-bird-loop.mp4','-vf',grade,'-frames:v','196','-c:v','libwebp','-lossless','1','-compression_level','6','-start_number','0','public/media/bird-frames/%03d.webp']);
for(const seed of [11,23,31,47]){await ffmpeg(['-i',`public/textures/ink-noise-${seed}.png`,'-vf','scale=512:512','-c:v','libwebp','-quality','95',`public/textures/ink-noise-${seed}-client.webp`]);}
console.log('Oiseau transparent et textures pour l’export navigateur prêts.');
