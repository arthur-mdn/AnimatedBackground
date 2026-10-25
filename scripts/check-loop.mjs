import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const exec=promisify(execFile),file=process.argv[2];
if(!file)throw Error('Usage : node scripts/check-loop.mjs chemin/vers/video.mp4');
const probe=await exec('ffprobe',['-v','error','-show_streams','-of','json',file]);
const video=JSON.parse(probe.stdout).streams.find(s=>s.codec_type==='video');
const last=Number(video.nb_frames)-1;
if(!Number.isInteger(last)||last<1)throw Error('Nombre d’images indisponible');
const {stdout}=await exec('ffmpeg',['-v','error','-i',file,'-vf',`select=eq(n\\,0)+eq(n\\,${last}),scale=320:180,format=rgb24`,'-fps_mode','passthrough','-f','rawvideo','pipe:1'],{encoding:'buffer',maxBuffer:4*1024*1024});
const size=320*180*3;if(stdout.length!==size*2)throw Error('Extraction des images de raccord impossible');
let sum=0,max=0;for(let i=0;i<size;i++){const d=Math.abs(stdout[i]-stdout[size+i]);sum+=d;max=Math.max(max,d);}
console.log(JSON.stringify({frames:video.nb_frames,firstFrame:0,lastFrame:last,meanAbsoluteDifference:sum/size,maxChannelDifference:max,scale:'320x180 RGB',note:'Mesure indicative, ne remplace pas une validation visuelle de plusieurs cycles.'},null,2));
