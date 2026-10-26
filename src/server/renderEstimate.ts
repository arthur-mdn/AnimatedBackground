// Estimate from recent measured progress, excluding engine preparation.
export class RenderEstimate {
 private samples:Array<{time:number;progress:number}>=[];
 update(time:number,progress:number,frameEstimateMs:number):number|null{
  this.samples.push({time,progress});
  while(this.samples.length>2&&this.samples[1].time<time-12000)this.samples.shift();
  const first=this.samples[0],elapsed=time-first.time,advance=progress-first.progress;
  if(elapsed<3000||progress<.03||advance<=0)return null;
  const recent=(1-progress)*elapsed/advance;
  const frames=Number.isFinite(frameEstimateMs)?Math.max(0,frameEstimateMs):0;
  return Math.max(1,Math.ceil((Math.max(recent,frames)+2000)/1000));
 }
}
