import {useEffect,useState,type CSSProperties} from 'react';
import {flushSync} from 'react-dom';
import {AbsoluteFill,useCurrentFrame,useVideoConfig,useDelayRender} from 'remotion';
import type {BirthdayInput} from '../shared/config';
import {useRenderLayer} from './RenderLayer';
import {HeldForeground,useClientRendering,useClientRasterScale} from './ClientRendering';
import {Fonts} from './Fonts';
import {FestivePalette,useFestivePalette} from './FestivePalette';
import {HandwrittenText} from './HandwrittenText';
import {TypingText} from './TypingText';
import {APPEARANCE,cycle,reveal,smooth} from './timing';
import {fadeUp} from './textMotion';

export type FestiveKind='fireworks'|'hearts';
export const festiveSeed=(n:number)=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
export const HEART_PATH='M0 90C-20 69-100 12-100-45C-100-105-25-120 0-65C25-120 100-105 100-45C100 12 20 69 0 90Z';
// Closed, irregular contours give each wash its own watercolour edge.
const washes=Array.from({length:22},(_,i)=>{
 const points=Array.from({length:96},(_,j)=>{
  const angle=j/96*Math.PI*2,r=1+.12*Math.sin(angle*5+i)+.07*Math.cos(angle*9-i*.7)+.035*Math.sin(angle*19+i);
  return [Math.cos(angle)*r*180,Math.sin(angle)*r*145];
 });
 const midpoint=(a:number[],b:number[])=>`${((a[0]+b[0])/2).toFixed(1)} ${((a[1]+b[1])/2).toFixed(1)}`;
 return `M${midpoint(points[95],points[0])}`+points.map((p,j)=>`Q${p[0].toFixed(1)} ${p[1].toFixed(1)} ${midpoint(p,points[(j+1)%96])}`).join('')+'Z';
});

type WashPalette={colors:readonly string[];paper:string;background:string;grain:string};
export function FestiveWash({kind,phase=0,palette,idPrefix=kind}:{kind:FestiveKind;phase?:number;palette?:WashPalette;idPrefix?:string}){
 const dark=kind==='fireworks',colors=palette?.colors??(dark?['#294e7a','#06142b','#365b81','#102442']:['#f38eae','#ffcedc','#ef9eb6','#ffc1d2']);
 return <>
  <defs>{colors.map((color,i)=><radialGradient key={i} id={`festive-wash-${idPrefix}-${i}`}><stop stopColor={color} stopOpacity=".85"/><stop offset=".72" stopColor={color} stopOpacity=".65"/><stop offset=".95" stopColor={color} stopOpacity=".3"/><stop offset="1" stopColor={color} stopOpacity=".12"/></radialGradient>)}<radialGradient id={`festive-paper-${idPrefix}`}><stop stopColor={palette?.paper??(dark?'#172f54':'#fff8f5')}/><stop offset="1" stopColor={palette?.background??(dark?'#050e21':'#ffe1eb')}/></radialGradient></defs>
  <rect width="1920" height="1080" fill={`url(#festive-paper-${idPrefix})`}/>
  {washes.map((d,i)=>{
   const x=(i%6)*390-60+festiveSeed(i+30)*120,y=Math.floor(i/6)*360-50+festiveSeed(i+80)*160;
   return <path key={i} d={d} transform={`translate(${x+Math.sin(phase+i)*7} ${y+Math.cos(phase+i)*5}) scale(${1.1+festiveSeed(i+10)*.7}) rotate(${i*31})`} fill={`url(#festive-wash-${idPrefix}-${i%colors.length})`} opacity={dark?.34:.24}/>;
  })}
  {Array.from({length:140},(_,i)=><circle key={i} cx={festiveSeed(i+401)*1920} cy={festiveSeed(i+701)*1080} r={.5+festiveSeed(i+901)*1.3} fill={palette?.grain??(dark?'#e6c68d':'#b9597a')} opacity={dark?.1:.055}/>)}
 </>;
}

export function Firework({x,y,radius,progress,seed=0,compact=false}:{x:number;y:number;radius:number;progress:number;seed?:number;compact?:boolean}){
 const palette=useFestivePalette();
 const growth=smooth(progress/.46),visibility=smooth(progress/.025)*(1-smooth((progress-.32)/.46));
 const count=compact?28:74,weight=compact?.17:1;
 const rays=Array.from({length:count},(_,i)=>{
  const angle=i/count*Math.PI*2+festiveSeed(i+seed)*.028,length=radius*(.62+festiveSeed(i+seed+200)*.38)*growth;
  const fall=radius*.12*progress*progress;
  const x2=Math.cos(angle)*length,y2=Math.sin(angle)*length+fall;
  return <g key={i} opacity={.42+festiveSeed(i+seed+400)*.58}>
   <path d={`M0 0Q${x2/2} ${Math.sin(angle)*length/2} ${x2} ${y2}`} fill="none" stroke={i%3===0?palette.light:palette.accent} strokeWidth={(i%4===0?3.1:1.4)*weight} strokeLinecap="round"/>
   <circle cx={x2} cy={y2} r={(i%4===0?3.4:1.6)*weight} fill={palette.bright}/>
  </g>;
 });
 return <g transform={`translate(${x} ${y})`} opacity={visibility}>
  {rays}<circle r={(2+2*(1-growth))*weight} fill={palette.light} opacity={1-smooth(progress/.13)}/>
  <path d={compact?"M-1.5 0H1.5M0-1.5V1.5":"M-9 0H9M0-9V9"} stroke={palette.light} strokeWidth={1.2*weight} opacity={1-smooth(progress/.18)}/>
 </g>;
}

export function WatercolorHeart({x,y,scale,angle=0,opacity=1,index=0}:{x:number;y:number;scale:number;angle?:number;opacity?:number;index?:number}){
 const palette=useFestivePalette(),id=`festive-heart-${index}`;
 return <g transform={`translate(${x} ${y}) rotate(${angle}) scale(${scale})`} opacity={opacity}>
  <defs>
   <radialGradient id={`${id}-fill`} cx="30%" cy="22%" r="95%"><stop stopColor={palette.light}/><stop offset=".5" stopColor={index%2?palette.face:palette.accent}/><stop offset="1" stopColor={palette.accent}/></radialGradient>
   <clipPath id={`${id}-clip`}><path d={HEART_PATH}/></clipPath>
  </defs>
  <path d={HEART_PATH} fill={`url(#${id}-fill)`} stroke={palette.bright} strokeWidth="1.8"/>
  <g clipPath={`url(#${id}-clip)`}>
   {Array.from({length:14},(_,i)=><path key={i} d={washes[(i+index)%washes.length]} transform={`translate(${-100+festiveSeed(i+index*40)*200} ${-120+festiveSeed(i+index*40+200)*230}) scale(.19 .21) rotate(${i*47})`} fill={i%3?palette.light:palette.shade} opacity={i%3?.15:.12}/>)}
   <path d="M48-76Q77-67 76-42" stroke={palette.bright} strokeWidth="4.5" strokeLinecap="round" fill="none" opacity=".66"/>
   <ellipse cx="77" cy="-27" rx="2.2" ry="4" fill={palette.bright} opacity=".8"/>
  </g>
  <path d={HEART_PATH} fill="none" stroke={palette.shade} strokeWidth=".65" opacity=".55"/>
 </g>;
}

export function festiveBurstProgress(frame:number,total:number,offset:number){
 const turns=Math.max(1,Math.round((total-1)/30/6));
 return ((frame/Math.max(1,total-1)*turns+offset)%1+1)%1;
}
export function FestiveBackdrop({kind,frame,total}:{kind:FestiveKind;frame:number;total:number}){
 const palette=useFestivePalette();
 const client=useClientRendering(),scale=useClientRasterScale(),phase=cycle(frame,total),visibility=reveal(frame,total,0,2);
 const pulseTurns=Math.max(1,Math.round((total-1)/30/8));
 const heartPulse=(i:number)=>1+.065*Math.pow(Math.max(0,Math.sin(phase*pulseTurns+i*1.7)),18);
 const heartEntry=(i:number)=>reveal(frame,total,.12*(i%8),2.8);
 const hearts=[{x:180,y:405,s:2.05,a:-15},{x:1720,y:500,s:1.8,a:14},{x:1585,y:115,s:.72,a:16},{x:435,y:930,s:.76,a:-12},{x:1470,y:955,s:.63,a:12},{x:540,y:115,s:.42,a:8},{x:1270,y:100,s:.34,a:-8},{x:80,y:850,s:.47,a:15}];
 return <svg data-client-raster={client?kind:undefined} width={1920*scale} height={1080*scale} viewBox="0 0 1920 1080" style={{position:'absolute',inset:0,transform:scale===1?undefined:`scale(${1/scale})`,transformOrigin:'top left'}} aria-hidden="true">
  <FestiveWash kind={kind} phase={phase} palette={{...palette,colors:palette.washes}}/>
  <g opacity={visibility}>
   {kind==='fireworks'?<>
    {[{x:200,y:440,r:345,o:.15},{x:1730,y:510,r:345,o:.62},{x:510,y:100,r:110,o:.4},{x:1430,y:175,r:125,o:.85},{x:1380,y:920,r:100,o:.25}].map((burst,i)=><Firework key={i} x={burst.x} y={burst.y} radius={burst.r} progress={festiveBurstProgress(frame,total,burst.o)} seed={i*113}/>)}
    {Array.from({length:48},(_,i)=>{const x=festiveSeed(i+1240)*1920,y=festiveSeed(i+1430)*1080,glow=Math.pow(.5+.5*Math.sin(phase*3+i*2.4),8);return <g key={i} transform={`translate(${x} ${y})`} opacity={.1+glow*.65} fill={palette.face}><circle r={1.2+glow*1.8}/>{i%7===0&&<path d="M0-8 1.2-1.2 8 0 1.2 1.2 0 8-1.2 1.2-8 0-1.2-1.2Z"/>}</g>;})}
   </>:<>
    {hearts.map((heart,i)=>{const entry=heartEntry(i);return <WatercolorHeart key={i} index={i} x={heart.x+Math.sin(phase+i)*10} y={heart.y+Math.cos(phase*2+i)*14+(1-entry)*(1250-heart.y+heart.s*110)} scale={heart.s*(1+Math.sin(phase*2+i)*.01)*heartPulse(i)} angle={heart.a+Math.sin(phase+i)*3} opacity={(i<2?.84:.4)*entry} />;})}
    {Array.from({length:16},(_,i)=>{const x=70+festiveSeed(i+800)*1780,y=100+festiveSeed(i+1000)*880;return <g key={i} transform={`translate(${x+Math.sin(phase+i)*9} ${y+Math.cos(phase+i)*14+(1-heartEntry(i+8))*(1300-y)}) scale(${(.09+festiveSeed(i+500)*.1)*heartPulse(i+8)})`} opacity={.15+festiveSeed(i+99)*.16}><path d={HEART_PATH} fill={palette.face}/></g>;})}
   </>}
  </g>
 </svg>;
}

function FestiveAge({age,kind}:{age:number;kind:FestiveKind}){
 const {delayRender,continueRender,cancelRender}=useDelayRender(),size=age>99?310:365;
 const [width,setWidth]=useState(420);
 useEffect(()=>{const handle=delayRender('Mesure de l’âge');let disposed=false;document.fonts.load(`700 ${size}px Portrait`).then(()=>{
  if(disposed)return;const ctx=document.createElement('canvas').getContext('2d');if(!ctx)throw Error('Mesure indisponible.');ctx.font=`700 ${size}px Portrait`;const measured=ctx.measureText(String(age)).width;flushSync(()=>setWidth(measured));continueRender(handle);
 }).catch(cancelRender);return()=>{disposed=true;continueRender(handle);};},[age,size]);
 const palette=useFestivePalette(),face=palette.face,shadow=palette.shadow,id=`festive-age-${kind}`;
 const glyph={x:960,y:350,textAnchor:'middle' as const,fontFamily:'Portrait, Georgia, serif',fontWeight:700,fontSize:size};
 return <svg width="1920" height="400" viewBox="0 0 1920 400" aria-label={`${age} ans`} style={{overflow:'visible'}}>
  <defs><linearGradient id={id} x1="0" y1="0" x2=".8" y2="1"><stop stopColor={palette.light}/><stop offset=".42" stopColor={face}/><stop offset=".68" stopColor={palette.light}/><stop offset="1" stopColor={palette.shade}/></linearGradient><pattern id={`${id}-grain`} width="80" height="80" patternUnits="userSpaceOnUse">{Array.from({length:150},(_,i)=><circle key={i} cx={festiveSeed(i+80)*80} cy={festiveSeed(i+400)*80} r={.25+festiveSeed(i+620)*.55} fill={palette.bright} opacity={.15+festiveSeed(i+830)*.45}/>)}</pattern></defs>
  {[4,3,2,1].map(n=><text key={n} {...glyph} transform={`translate(${n*.5} ${n})`} fill={shadow}>{age}</text>)}
  <text {...glyph} fill={`url(#${id})`} stroke={palette.light} strokeWidth="1.2">{age}</text><text {...glyph} fill={`url(#${id}-grain)`}>{age}</text>
  <text x={960+width/2+22} y="333" fontFamily="Celebration" fontSize="112" fill={palette.ink}>ans</text>
 </svg>;
}

export function Festive(props:BirthdayInput){
 return <FestivePalette kind={props.templateId==='feux-artifice'?'fireworks':'hearts'} fireworks={props.fireworksPalette} hearts={props.heartsPalette}><FestiveScene {...props}/></FestivePalette>;
}
function FestiveScene(props:BirthdayInput){
 const palette=useFestivePalette();
 const kind:FestiveKind=props.templateId==='feux-artifice'?'fireworks':'hearts';
 const frame=useCurrentFrame(),{durationInFrames:total}=useVideoConfig(),layer=useRenderLayer();
 const {delayRender,continueRender,cancelRender}=useDelayRender();
 const [handle]=useState(()=>delayRender('Chargement des polices du modèle'));
 useEffect(()=>{Promise.all([document.fonts.load('700 365px Portrait'),document.fonts.load('175px Celebration')]).then(()=>continueRender(handle)).catch(cancelRender);return()=>continueRender(handle);},[handle]);
 const line1=props.messageLine1.trim(),line2=props.messageLine2.trim(),ink=palette.ink;
 const motion=(start:number,length:number):CSSProperties=>fadeUp(frame,total,start,length,length,12);
 return <AbsoluteFill style={{background:layer==='foreground'?'transparent':palette.background,color:ink,overflow:'hidden'}}>
  <Fonts/>{layer!=='foreground'&&<FestiveBackdrop kind={kind} frame={frame} total={total}/>}
  {layer!=='background'&&<HeldForeground>
   {line1&&<div style={{position:'absolute',top:line2?123:190,left:250,right:250,textAlign:'center',...motion(APPEARANCE.line1.start,APPEARANCE.line1.fade)}}><TypingText text={line1.toLocaleUpperCase('fr-FR')} fontSize={64} fontFamily="Arial, Helvetica, sans-serif" fontWeight={400} letterSpacing={10} singleLine maxWidth={1300} frame={frame} total={total} start={APPEARANCE.line1.start} length={APPEARANCE.line1.writing}/></div>}
   {line2&&<div style={{position:'absolute',top:line1?188:145,left:240,right:240,textAlign:'center'}}><HandwrittenText text={line2} fontFamily="Celebration" fill={ink} fontSize={175} maxWidth={1370} frame={frame} total={total} start={APPEARANCE.line2.start} length={APPEARANCE.line2.writing}/></div>}
   <div style={{position:'absolute',top:369,left:0,right:0,...motion(APPEARANCE.age.start,APPEARANCE.age.fade)}}><FestiveAge age={props.age} kind={kind}/></div>
   <div style={{position:'absolute',top:800,left:220,right:220,textAlign:'center'}}><HandwrittenText text={props.firstName} fontFamily="Celebration" fill={ink} textStrokeWidth={.45} fontSize={Math.min(180,2400/Math.max(10,Array.from(props.firstName).length))} maxWidth={1400} frame={frame} total={total} start={APPEARANCE.firstName.start} length={APPEARANCE.firstName.writing}/></div>
  </HeldForeground>}
 </AbsoluteFill>;
}
