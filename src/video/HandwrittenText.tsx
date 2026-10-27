import {flushSync} from 'react-dom';
import {useEffect,useId,useState} from 'react';
import {useDelayRender} from 'remotion';
import {traceGlyph,writingProgress} from './handwriting';
import {graphemes} from './timing';

type Segment={d:string;length:number;offset:number;width:number};
type Glyph={segments:Segment[];length:number};
type Layout={glyphs:Array<{char:string;x:number;glyph:Glyph;offset:number;part:number}>;width:number;scale:number;baseline:number;lengths:number[]};
const SIZE=128,cache=new Map<string,Glyph>();
function glyphBrush(char:string,context:CanvasRenderingContext2D,font:string):Glyph{
 const key=`${font}\0${char}`;
 const cached=cache.get(key);if(cached)return cached;
 context.font=font;
 const metrics=context.measureText(char),origin=16+Math.ceil(metrics.actualBoundingBoxLeft),baseline=16+Math.ceil(metrics.actualBoundingBoxAscent);
 const width=Math.max(32,Math.ceil(metrics.actualBoundingBoxLeft+metrics.actualBoundingBoxRight)+32),height=Math.max(32,Math.ceil(metrics.actualBoundingBoxAscent+metrics.actualBoundingBoxDescent)+32);
 context.canvas.width=width;context.canvas.height=height;context.font=font;context.fillStyle='#fff';context.fillText(char,origin,baseline);
 const rgba=context.getImageData(0,0,width,height).data,binary=new Uint8Array(width*height),distance=new Float32Array(width*height);
 for(let i=0;i<binary.length;i++){binary[i]=rgba[i*4+3]>96?1:0;distance[i]=binary[i]?1000:0;}
 for(let y=1;y<height-1;y++)for(let x=1;x<width-1;x++){const i=y*width+x;if(binary[i])distance[i]=Math.min(distance[i],distance[i-1]+1,distance[i-width]+1,distance[i-width-1]+Math.SQRT2,distance[i-width+1]+Math.SQRT2);}
 for(let y=height-2;y>0;y--)for(let x=width-2;x>0;x--){const i=y*width+x;if(binary[i])distance[i]=Math.min(distance[i],distance[i+1]+1,distance[i+width]+1,distance[i+width+1]+Math.SQRT2,distance[i+width-1]+Math.SQRT2);}
 const segments:Segment[]=[];let offset=0;
 for(const stroke of traceGlyph(binary,width,height)){
  let points=[stroke.points[0]],length=0;
  const flush=()=>{
   if(points.length<2)return;
   const radius=Math.max(...points.map(([x,y])=>distance[Math.round(y)*width+Math.round(x)]||1));
   segments.push({d:points.map(([x,y],i)=>`${i?'L':'M'}${(x-origin).toFixed(1)} ${(y-baseline).toFixed(1)}`).join(' '),width:radius*2.8+2,length,offset});offset+=length;points=[points[points.length-1]];length=0;
  };
  for(let i=1;i<stroke.points.length;i++){const point=stroke.points[i],previous=stroke.points[i-1];length+=Math.hypot(point[0]-previous[0],point[1]-previous[1]);points.push(point);if(length>=7)flush();}
  flush();offset+=5; // brief pen lift between disconnected strokes / accents
 }
 const glyph={segments,length:Math.max(offset,12)};cache.set(key,glyph);return glyph;
}
// The brush reveals the filled font, rather than outlining its contours or
// switching complete letters on. Each glyph has an isolated, variable-width mask.
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
   const glyphs:Layout['glyphs']=[],lengths=[0,0];let prefix='',index=0;
   for(const [part,value] of parts.entries())for(const char of graphemes(value)){
    context.font=font;const x=context.measureText(prefix+char).width-context.measureText(char).width+index*spacing;
    const glyph=glyphBrush(char,context,font);glyphs.push({char,x,glyph,part,offset:lengths[part]});lengths[part]+=glyph.length+10;prefix+=char;index++;
   }
   flushSync(()=>setLayout({glyphs,width:width*scale,scale,baseline,lengths}));continueRender(handle);
  }).catch(error=>{if(!disposed)cancelRender(error);});
  return()=>{disposed=true;continueRender(handle);};
 },[text,trailingText,fontSize,maxWidth,font,letterSpacing]);
 const progresses=[writingProgress(frame,total,start,length),trailing?writingProgress(frame,total,trailing.start,trailing.length):0];
 if(!layout)return <div style={{height:fontSize*1.25}}/>;
 const pens=layout.lengths.map((length,i)=>progresses[i]*length);
 return <svg role="img" aria-label={text+trailingText} width={layout.width+128} height={fontSize*1.25} viewBox={`-64 0 ${layout.width+128} ${fontSize*1.25}`} style={{overflow:'visible',verticalAlign:'top'}}>
  {layout.glyphs.map(({char,x,glyph,offset,part},i)=>{
   const advance=pens[part]-offset,complete=progresses[part]===1||advance>=glyph.length;
   if(advance<=0)return null;
   const mask=`${id}-letter-${i}`;
   return <g key={i} transform={`translate(${x*layout.scale} ${layout.baseline}) scale(${layout.scale})`}>
    {!complete&&<defs><mask id={mask} maskUnits="userSpaceOnUse" x="-128" y="-256" width="512" height="512"><g fill="none" stroke="#fff" strokeLinecap="round" strokeLinejoin="round">{glyph.segments.map((segment,j)=>{
     const visible=Math.min(segment.length,Math.max(0,advance-segment.offset));
     return visible>0?<path key={j} d={segment.d} strokeWidth={segment.width} strokeDasharray={`${segment.length} ${segment.length+1}`} strokeDashoffset={segment.length-visible}/>:null;
    })}</g></mask></defs>}
    <text fontFamily={fontFamily} fontWeight={fontWeight} fontSize={SIZE} fill="currentColor" stroke={textStrokeWidth?'currentColor':undefined} strokeWidth={textStrokeWidth/layout.scale} paintOrder="stroke fill" style={{fontVariantLigatures:'none',WebkitTextStroke:0}} mask={complete?undefined:`url(#${mask})`}>{char}</text>
   </g>;
  })}
 </svg>;
}
