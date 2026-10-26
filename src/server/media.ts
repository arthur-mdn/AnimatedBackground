import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const exec=promisify(execFile);
export async function verifyMedia(file:string,seconds:number){
 const {stdout}=await exec('ffprobe',['-v','error','-show_streams','-show_format','-of','json',file]);
 const data=JSON.parse(stdout);const streams=data.streams as Array<Record<string,string|number>>;
 const video=streams.find(s=>s.codec_type==='video');
 if(!video||streams.length!==1||video.codec_name!=='h264'||video.width!==1920||video.height!==1080||video.pix_fmt!=='yuv420p'||video.avg_frame_rate!=='30/1'||video.r_frame_rate!=='30/1'||Number(video.nb_frames)!==seconds*30||Math.abs(Number(data.format.duration)-seconds)>1/300||Number(data.format.size)<1000){throw new Error('Le MP4 ne respecte pas les caractéristiques attendues (Full HD, H.264, 30 fps, durée exacte, sans audio).');}
 return data;
}
export async function verifyBackground(file:string,seconds:number){
 const {stdout}=await exec('ffprobe',['-v','error','-show_streams','-show_format','-of','json',file]);
 const data=JSON.parse(stdout),streams=data.streams as Array<Record<string,string|number>>;
 const video=streams.find(s=>s.codec_type==='video');
 if(!video||streams.length!==1||video.codec_name!=='png'||video.width!==1920||video.height!==1080||!['rgba','rgb24'].includes(String(video.pix_fmt))||video.avg_frame_rate!=='30/1'||video.r_frame_rate!=='30/1'||Number(video.nb_frames)!==seconds*30||Math.abs(Number(data.format.duration)-seconds)>1/300||Number(data.format.size)<1000)throw new Error('Fond intermédiaire invalide (RGB sans perte attendu).');
}
