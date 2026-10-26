import {spawn} from 'node:child_process';
// Texts are fully settled at 9 s. The exit is the exact frame mirror of the entry.
export const INTRO_FRAMES=270;
export function foregroundTimeline(totalFrames:number){
 if(totalFrames<INTRO_FRAMES*2+1)throw new Error('Durée insuffisante pour les transitions.');
 return {entry:INTRO_FRAMES,hold:totalFrames-INTRO_FRAMES*2,exit:INTRO_FRAMES};
}
export function compositeFilter(totalFrames:number,screen=false){
 const {entry,hold}=foregroundTimeline(totalFrames);
 const timeline=`[1:v]split=3[e][h][r];[e]trim=end_frame=${entry},setpts=PTS-STARTPTS[enter];[h]trim=start_frame=${entry}:end_frame=${entry+1},loop=loop=-1:size=1:start=0,trim=end_frame=${hold},setpts=N/(30*TB)[hold];[r]trim=end_frame=${entry},reverse,setpts=PTS-STARTPTS[exit];[enter][hold][exit]concat=n=3:v=1:a=0[foreground];`;
 const background=screen?'[2:v]format=gbrap,premultiply=inplace=1,format=gbrp[screen];[0:v]format=gbrp[bg];[bg][screen]blend=all_mode=screen[base];':'[0:v]format=gbrp[base];';
 return timeline+background+'[base][foreground]overlay=format=rgb:alpha=straight:eof_action=repeat,scale=in_range=full:out_range=tv:out_color_matrix=bt709,format=yuv420p[out]';
}
export async function compositeVideo(options:{background:string;foreground:string;screen?:string;output:string;totalFrames:number;signal:AbortSignal;onProgress:(frames:number)=>void}){
 const args=['-hide_banner','-loglevel','error','-threads','2','-i',options.background,'-threads','2','-i',options.foreground];
 if(options.screen)args.push('-threads','2','-i',options.screen);
 args.push('-filter_complex_threads','2','-filter_complex',compositeFilter(options.totalFrames,!!options.screen),'-map','[out]','-an','-c:v','libx264','-crf','18','-preset','medium','-pix_fmt','yuv420p','-r','30','-frames:v',String(options.totalFrames),'-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709','-movflags','+faststart','-progress','pipe:1','-nostats','-y',options.output);
 await new Promise<void>((resolve,reject)=>{
  const child=spawn('ffmpeg',args,{signal:options.signal,stdio:['ignore','pipe','pipe']});let error='',pending='';
  child.stderr.on('data',chunk=>{error=(error+chunk).slice(-8000);});
  child.stdout.on('data',chunk=>{pending+=chunk;const lines=pending.split('\n');pending=lines.pop()!;for(const line of lines){const match=/^frame=(\d+)/.exec(line);if(match)options.onProgress(Number(match[1]));}});
  child.once('error',reject);child.once('close',code=>code===0?resolve():reject(new Error(`Assemblage vidéo impossible : ${error||code}`)));
 });
}
