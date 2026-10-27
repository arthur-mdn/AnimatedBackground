import {flushSync} from 'react-dom';
import {useEffect,useId,useState} from 'react';
import {useDelayRender} from 'remotion';
import {traceGlyph,writingProgress} from './handwriting';
import {graphemes} from './timing';

type Segment={d:string;length:number;offset:number;width:number};
type Glyph={segments:Segment[];length:number;href:string;width:number;height:number;origin:number;baseline:number;maskPad:number};
type Layout={glyphs:Array<{char:string;x:number;glyph:Glyph;offset:number;part:number}>;width:number;scale:number;baseline:number;lengths:number[]};
const SIZE=128,cache=new Map<string,Glyph>();
function glyphBrush(char:string,context:CanvasRenderingContext2D,font:string,strokeWidth=0,rasterScale=1):Glyph{
 const key=`${font}\0${strokeWidth}\0${rasterScale.toFixed(3)}\0${char}`;
 const cached=cache.get(key);if(cached)return cached;
 context.setTransform(1,0,0,1,0,0);context.font=font;
 const metrics=context.measureText(char),pad=16+Math.ceil(strokeWidth);
 const origin=pad+Math.ceil(metrics.actualBoundingBoxLeft),baseline=pad+Math.ceil(metrics.actualBoundingBoxAscent);
 const width=Math.max(32,Math.ceil(metrics.actualBoundingBoxLeft+metrics.actualBoundingBoxRight)+pad*2),height=Math.max(32,Math.ceil(metrics.actualBoundingBoxAscent+metrics.actualBoundingBoxDescent)+pad*2);
 context.canvas.width=width;context.canvas.height=height;context.font=font;
 if(strokeWidth>0){context.strokeStyle='#fff';context.lineJoin='round';context.lineWidth=strokeWidth;context.strokeText(char,origin,baseline);}
 context.fillStyle='#fff';context.fillText(char,origin,baseline);
 const rgba=context.getImageData(0,0,width,height).data,binary=new Uint8Array(width*height),distance=new Float32Array(width*height);
 for(let i=0;i<binary.length;i++){binary[i]=rgba[i*4+3]>96?1:0;distance[i]=binary[i]?1000:0;}
 for(let y=1;y<height-1;y++)for(let x=1;x<width-1;x++){const i=y*width+x;if(binary[i])distance[i]=Math.min(distance[i],distance[i-1]+1,distance[i-width]+1,distance[i-width-1]+Math.SQRT2,distance[i-width+1]+Math.SQRT2);}
 for(let y=height-2;y>0;y--)for(let x=width-2;x>0;x--){const i=y*width+x;if(binary[i])distance[i]=Math.min(distance[i],distance[i+1]+1,distance[i+width]+1,distance[i+width+1]+Math.SQRT2,distance[i+width-1]+Math.SQRT2);}
 const segments:Segment[]=[];let offset=0,maxBrush=0;
 for(const stroke of traceGlyph(binary,width,height)){
  let points=[stroke.points[0]],length=0;
  const flush=()=>{
   if(points.length<2)return;
   const radius=Math.max(...points.map(([x,y])=>distance[Math.round(y)*width+Math.round(x)]||1));
   // Cover the full ink disc; a tight brush leaves Safari-looking crops until the mask drops.
   const brush=radius*4+10;maxBrush=Math.max(maxBrush,brush);
   segments.push({d:points.map(([x,y],i)=>`${i?'L':'M'}${(x-origin).toFixed(1)} ${(y-baseline).toFixed(1)}`).join(' '),width:brush,length,offset});offset+=length;points=[points[points.length-1]];length=0;
  };
  for(let i=1;i<stroke.points.length;i++){const point=stroke.points[i],previous=stroke.points[i-1];length+=Math.hypot(point[0]-previous[0],point[1]-previous[1]);points.push(point);if(length>=7)flush();}
  flush();offset+=5; // brief pen lift between disconnected strokes / accents
 }
 context.canvas.width=Math.ceil(width*rasterScale);context.canvas.height=Math.ceil(height*rasterScale);
 context.setTransform(rasterScale,0,0,rasterScale,0,0);context.font=font;
 if(strokeWidth>0){context.strokeStyle='#fff';context.lineJoin='round';context.lineWidth=strokeWidth;context.strokeText(char,origin,baseline);}
 context.fillStyle='#fff';context.fillText(char,origin,baseline);
 const href=context.canvas.toDataURL('image/png'),maskPad=Math.ceil(maxBrush/2)+24;
 const glyph={segments,length:Math.max(offset,12),href,width,height,origin,baseline,maskPad};cache.set(key,glyph);return glyph;
}
// The brush reveals a supersampled glyph image. Mask bounds follow the brush
// radius so stroke caps are never clipped mid-draw.
export function HandwrittenText({text,trailing,fontSize,maxWidth,frame,total,start,length,fontFamily='GardenNames',fontWeight=400,letterSpacing=0,textStrokeWidth=0}:{text:string;trailing?:{text:string;start:number;length:number};fontSize:number;maxWidth:number;frame:number;total:number;start:number;length:number;fontFamily?:string;fontWeight?:number;letterSpacing?:number;textStrokeWidth?:number}){
 const {delayRender,continueRender,cancelRender}=useDelayRender();
 const font=`${fontWeight} ${SIZE}px ${fontFamily}`;
 const trailingText=trailing?.text||'';
 const [layout,setLayout]=useState<Layout|null>(null),id=useId().replace(/:/g,'');
 useEffect(()=>{
  const handle=delayRender('Préparation du tracé du texte');let disposed=false;
  document.fonts.load(font).then(()=>{
   if(disposed)return;
   const context=document.createElement('canvas').getContext('2d',{willReadFrequently:true});if(!context)throw Error('Tracé du texte indisponible.');
   context.font=font;const parts=[text.normalize('NFC'),trailingText.normalize('NFC')],value=parts.join(''),metrics=context.measureText(value),spacing=letterSpacing*SIZE/fontSize;
   const width=metrics.width+Math.max(0,graphemes(value).length-1)*spacing,scale=Math.min(fontSize/SIZE,maxWidth/Math.max(width,1));
   const baseline=fontSize*1.25/2+(metrics.fontBoundingBoxAscent-metrics.fontBoundingBoxDescent)*scale/2;
   const strokeWidth=textStrokeWidth*SIZE/fontSize,rasterScale=Math.max(2,scale*2);
   const glyphs:Layout['glyphs']=[],lengths=[0,0];let prefix='',index=0;
   for(const [part,value] of parts.entries())for(const char of graphemes(value)){
    context.font=font;const x=context.measureText(prefix+char).width-context.measureText(char).width+index*spacing;
    const glyph=glyphBrush(char,context,font,strokeWidth,rasterScale);glyphs.push({char,x,glyph,part,offset:lengths[part]});lengths[part]+=glyph.length+10;prefix+=char;index++;
   }
   flushSync(()=>setLayout({glyphs,width:width*scale,scale,baseline,lengths}));continueRender(handle);
  }).catch(error=>{if(!disposed)cancelRender(error);});
  return()=>{disposed=true;continueRender(handle);};
 },[text,trailingText,fontSize,maxWidth,font,letterSpacing,textStrokeWidth]);
 const progresses=[writingProgress(frame,total,start,length),trailing?writingProgress(frame,total,trailing.start,trailing.length):0];
 if(!layout)return <div style={{height:fontSize*1.25}}/>;
 const pens=layout.lengths.map((length,i)=>progresses[i]*length),tint=`${id}-tint`;
 return <svg role="img" aria-label={text+trailingText} width={layout.width+128} height={fontSize*1.25} viewBox={`-64 0 ${layout.width+128} ${fontSize*1.25}`} style={{overflow:'visible',verticalAlign:'top'}}>
  <defs><filter id={tint} x="-50%" y="-50%" width="200%" height="200%" filterUnits="objectBoundingBox" colorInterpolationFilters="sRGB"><feFlood floodColor="currentColor" result="fill"/><feComposite in="fill" in2="SourceAlpha" operator="in"/></filter></defs>
  {layout.glyphs.map(({x,glyph,offset,part},i)=>{
   const advance=pens[part]-offset,complete=progresses[part]===1||advance>=glyph.length;
   if(advance<=0)return null;
   const mask=`${id}-letter-${i}`,pad=glyph.maskPad;
   return <g key={i} transform={`translate(${x*layout.scale} ${layout.baseline}) scale(${layout.scale})`}>
    {!complete&&<defs><mask id={mask} maskUnits="userSpaceOnUse" x={-glyph.origin-pad} y={-glyph.baseline-pad} width={glyph.width+pad*2} height={glyph.height+pad*2}><g fill="none" stroke="#fff" strokeLinecap="round" strokeLinejoin="round">{glyph.segments.map((segment,j)=>{
     const visible=Math.min(segment.length,Math.max(0,advance-segment.offset));
     return visible>0?<path key={j} d={segment.d} strokeWidth={segment.width} strokeDasharray={`${segment.length} ${segment.length+1}`} strokeDashoffset={segment.length-visible}/>:null;
    })}</g></mask></defs>}
    <image href={glyph.href} x={-glyph.origin} y={-glyph.baseline} width={glyph.width} height={glyph.height} filter={`url(#${tint})`} mask={complete?undefined:`url(#${mask})`}/>
   </g>;
  })}
 </svg>;
}
