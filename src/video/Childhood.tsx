import {useEffect,useState,type CSSProperties} from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig,useDelayRender} from 'remotion';
import type {BirthdayInput} from '../shared/config';
import {APPEARANCE,smooth} from './timing';
import {fadeUp} from './textMotion';
import {useRenderLayer} from './RenderLayer';
import {HeldForeground,useClientRendering} from './ClientRendering';
import {Fonts} from './Fonts';
import {FestiveWash} from './Festive';
import {HandwrittenText} from './HandwrittenText';
import {TypingText} from './TypingText';
import {ChildhoodPalette,useChildhoodPalette} from './ChildhoodPalette';
import {useLightweightPreview} from './PreviewPerformance';

const garlandY=(x:number)=>88+Math.sin(((x+80)/2080)*Math.PI*2.15)*32+Math.sin(((x+80)/2080)*Math.PI)*10;

function Balloon({x,y,color,scale,sway,stringLength}:{x:number;y:number;color:string;scale:number;sway:number;stringLength:number}){
 const knot=52;
 return <g transform={`translate(${x} ${y}) rotate(${sway}) scale(${scale})`}>
  <path d={`M0 ${knot} Q${sway*1.2} ${knot+stringLength*.45} ${sway*.6} ${knot+stringLength}`} fill="none" stroke="#9a8c84" strokeWidth="1.5" strokeLinecap="round" opacity=".45"/>
  <ellipse cx="0" cy="0" rx="42" ry="52" fill={color} opacity=".88"/>
  <ellipse cx="-12" cy="-16" rx="12" ry="18" fill="#fff" opacity=".16"/>
  <path d="M-7 48 Q0 58 7 48 Z" fill={color} opacity=".88"/>
 </g>;
}

function Garland({palette}:{palette:ReturnType<typeof useChildhoodPalette>}){
 const count=16,points=Array.from({length:count},(_,i)=>{
  const x=-90+i*((1920+180)/(count-1));
  return {x,y:garlandY(x),color:palette.balloon[i%palette.balloon.length]};
 });
 const d=points.map((p,i)=>`${i?'L':'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
 return <g>
  {points.slice(1,-1).map((p,i)=><g key={i} transform={`translate(${p.x} ${p.y})`}>
   <path d="M-14 0 L14 0 L0 46 Z" fill={p.color} opacity=".82"/>
   <path d="M-14 0 L14 0 L0 46 Z" fill="#fff" opacity=".1"/>
  </g>)}
  <path d={d} fill="none" stroke="#c4b4a4" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
 </g>;
}

type BalloonMotion={restX:number;restY:number;scale:number;color:string;string:number;delay:number;floatHz:number;floatAmp:number;swayHz:number;swayAmp:number;driftHz:number;driftAmp:number;phase:number};

function balloonY(frame:number,total:number,b:BalloonMotion){
 const seconds=(total-1)/30,intro=9,exit=9,time=frame/30;
 const enter=smooth(Math.min(1,Math.max(0,(time-b.delay)/intro)));
 const leave=smooth(Math.min(1,Math.max(0,(time-(seconds-exit-b.delay*.35))/exit)));
 const float=Math.sin(phaseClock(frame,total)*b.floatHz+b.phase)*b.floatAmp;
 if(time<intro+b.delay+0.05)return 1180+(b.restY-1180)*enter+float*enter;
 if(leave>0)return b.restY+(-220-b.restY)*leave+float*(1-leave);
 return b.restY+float;
}
function phaseClock(frame:number,total:number){return (frame/(total-1))*Math.PI*2;}

function ChildhoodBackdrop({frame,total}:{frame:number;total:number}){
 const palette=useChildhoodPalette(),lightweight=useLightweightPreview(),clientRendering=useClientRendering();
 const left:BalloonMotion[]=[
  {restX:210,restY:420,scale:1.05,color:palette.balloon[0],string:95,delay:0,floatHz:1.05,floatAmp:16,swayHz:.9,swayAmp:4.2,driftHz:.7,driftAmp:9,phase:.2},
  {restX:340,restY:510,scale:.88,color:palette.balloon[1],string:78,delay:.55,floatHz:.82,floatAmp:12,swayHz:1.15,swayAmp:3.4,driftHz:1.05,driftAmp:7,phase:2.4},
 ];
 const right:BalloonMotion[]=lightweight?[
  {restX:1480,restY:600,scale:.92,color:palette.balloon[2],string:88,delay:.25,floatHz:.95,floatAmp:14,swayHz:1.05,swayAmp:3.8,driftHz:.85,driftAmp:8,phase:1.1},
  {restX:1620,restY:690,scale:.8,color:palette.balloon[0],string:72,delay:.85,floatHz:1.2,floatAmp:11,swayHz:.75,swayAmp:4.5,driftHz:1.1,driftAmp:6,phase:3.2},
  {restX:1750,restY:760,scale:.7,color:palette.balloon[1],string:64,delay:.4,floatHz:.7,floatAmp:15,swayHz:1.3,swayAmp:3.1,driftHz:.65,driftAmp:10,phase:4.6},
 ]:[
  {restX:1450,restY:580,scale:.95,color:palette.balloon[2],string:90,delay:.2,floatHz:.95,floatAmp:15,swayHz:1.05,swayAmp:3.8,driftHz:.85,driftAmp:8,phase:1.1},
  {restX:1575,restY:655,scale:.84,color:palette.balloon[0],string:76,delay:.75,floatHz:1.18,floatAmp:11,swayHz:.78,swayAmp:4.6,driftHz:1.12,driftAmp:6,phase:3.0},
  {restX:1685,restY:720,scale:.76,color:palette.balloon[1],string:68,delay:.35,floatHz:.72,floatAmp:16,swayHz:1.28,swayAmp:3.2,driftHz:.62,driftAmp:10,phase:4.5},
  {restX:1785,restY:790,scale:.68,color:palette.balloon[2],string:60,delay:1.05,floatHz:1.08,floatAmp:10,swayHz:.95,swayAmp:4.0,driftHz:.95,driftAmp:7,phase:5.7},
  {restX:1710,restY:840,scale:.62,color:palette.balloon[0],string:54,delay:.55,floatHz:.88,floatAmp:13,swayHz:1.22,swayAmp:3.5,driftHz:1.18,driftAmp:5,phase:2.1},
 ];
 const balloons=[...left,...right];
 return <svg data-client-raster={clientRendering?'childhood':undefined} viewBox="0 0 1920 1080" width="100%" height="100%" style={{position:'absolute',inset:0,overflow:'visible'}} aria-hidden="true">
  <FestiveWash kind="hearts" idPrefix="childhood" phase={phaseClock(frame,total)} palette={{colors:[palette.soft,...palette.balloon],paper:palette.background,background:palette.paper,grain:palette.ink}}/>
  <Garland palette={palette}/>
  {balloons.map((b,i)=>{
   const clock=phaseClock(frame,total);
   return <Balloon key={i} x={b.restX+Math.sin(clock*b.driftHz+b.phase)*b.driftAmp} y={balloonY(frame,total,b)} color={b.color} scale={b.scale} sway={Math.sin(clock*b.swayHz+b.phase*1.3)*b.swayAmp} stringLength={b.string}/>;
  })}
 </svg>;
}

function ChildhoodAge({age}:{age:number}){
 const palette=useChildhoodPalette();
 const size=String(age).length===3?280:320;
 const step=palette.soft;
 return <div style={{textAlign:'center',fontFamily:'Portrait, Georgia, serif',fontWeight:700,fontSize:size,lineHeight:1,color:palette.ink,letterSpacing:'-0.04em'}}>
  <span style={{textShadow:`0 1px 0 ${step}, 0 2px 0 ${step}, 0 3px 0 ${step}, 0 4px 0 ${palette.paper}`}}>{age}</span>
  <span style={{display:'inline-block',marginLeft:16,fontSize:size*.4,fontWeight:400,color:palette.ink,opacity:.78,transform:'translateY(2px)',fontFamily:'Celebration, cursive',letterSpacing:0}}>ans</span>
 </div>;
}

export function Childhood(props:BirthdayInput){
 return <ChildhoodPalette palette={props.childhoodPalette}><ChildhoodScene {...props}/></ChildhoodPalette>;
}

function ChildhoodScene(props:BirthdayInput){
 const {delayRender,continueRender}=useDelayRender();
 const layer=useRenderLayer(),palette=useChildhoodPalette();
 const frame=useCurrentFrame(),{durationInFrames:total}=useVideoConfig();
 const [handle]=useState(()=>delayRender('Chargement des polices Enfance'));
 useEffect(()=>{Promise.all([document.fonts.load('210px Celebration'),document.fonts.load('126px Celebration'),document.fonts.load('700 320px Portrait')]).then(()=>continueRender(handle)).catch(()=>continueRender(handle));},[handle]);
 const style=(start:number,length:number):CSSProperties=>fadeUp(frame,total,start,length,length,12);
 const nameSize=Math.min(210,2400/Math.max(8,Array.from(props.firstName).length));
 const line1=props.messageLine1.trim(),line2=props.messageLine2.trim();
 const messageBottom=line1&&line2?330:line1||line2?290:210,nameTop=800,ageTop=(messageBottom+nameTop-340)/2+55;
 return <AbsoluteFill style={{background:layer==='foreground'?'transparent':palette.background,color:palette.ink,overflow:'hidden'}}>
  <Fonts/>
  {layer!=='foreground'&&<ChildhoodBackdrop frame={frame} total={total}/>}
  {layer!=='background'&&<HeldForeground>
   {line1&&<div style={{position:'absolute',top:line2?140:200,left:120,right:120,textAlign:'center',color:palette.ink,...style(APPEARANCE.line1.start,APPEARANCE.line1.fade)}}>
    <TypingText text={line1.toLocaleUpperCase('fr-FR')} fontSize={68} fontFamily="Arial, Helvetica, sans-serif" fontWeight={500} letterSpacing={10} singleLine maxWidth={1500} frame={frame} total={total} start={APPEARANCE.line1.start} length={APPEARANCE.line1.writing}/>
   </div>}
   {line2&&<div style={{position:'absolute',top:line1?200:170,left:120,right:120,textAlign:'center'}}>
    <HandwrittenText text={line2} fontFamily="Celebration" fill={palette.ink} fontSize={190} maxWidth={1500} frame={frame} total={total} start={APPEARANCE.line2.start} length={APPEARANCE.line2.writing}/>
   </div>}
   <div style={{position:'absolute',top:ageTop,left:0,right:0,...style(APPEARANCE.age.start,APPEARANCE.age.fade)}}><ChildhoodAge age={props.age}/></div>
   <div style={{position:'absolute',top:nameTop,left:120,right:120,textAlign:'center'}}>
    <HandwrittenText text={props.firstName} fontFamily="Celebration" fill={palette.ink} textStrokeWidth={.5} fontSize={nameSize} maxWidth={1500} frame={frame} total={total} start={APPEARANCE.firstName.start} length={APPEARANCE.firstName.writing}/>
   </div>
  </HeldForeground>}
 </AbsoluteFill>;
}
