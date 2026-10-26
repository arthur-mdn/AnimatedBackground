import type {FfmpegOverrideFn} from '@remotion/renderer';
// Preserve the Chromium RGB pixels; H.264 is only applied to the final export.
export const losslessBackgroundArgs:FfmpegOverrideFn=({args})=>{
 const result:string[]=[];let inputSeen=false;
 for(let i=0;i<args.length;i++){
  const arg=args[i];
  if(arg==='-i'){result.push(arg,args[++i]);inputSeen=true;continue;}
  if(['-crf','-preset','-profile:v','-movflags'].includes(arg)){i++;continue;}
  if(inputSeen&&(arg==='-c:v'||arg==='-vcodec')){result.push(arg,'copy');i++;continue;}
  if(inputSeen&&arg==='-pix_fmt'){i++;continue;}
  result.push(arg);
 }
 result.splice(result.length-1,0,'-f','mov');
 return result;
};
