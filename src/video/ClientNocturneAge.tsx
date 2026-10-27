import {useEffect,useState} from 'react';
import {flushSync} from 'react-dom';
import {useCurrentFrame,useVideoConfig,useDelayRender} from 'remotion';
import {useNocturneColor} from './NocturnePalette';
import {cycle,reveal} from './timing';

export function ClientNocturneAge({age}:{age:number}){
 const frame=useCurrentFrame(),{durationInFrames:total}=useVideoConfig(),color=useNocturneColor();
 const {delayRender,continueRender,cancelRender}=useDelayRender(),size=age>99?650:790;
 const [metrics,setMetrics]=useState<{width:number;numberWidth:number;baseline:number;yearsBaseline:number}|null>(null);
 useEffect(()=>{
  const handle=delayRender('Composition de l’âge nocturne');let disposed=false;
  document.fonts.load(`${size}px Celebration`).then(()=>{
   if(disposed)return;
   const context=document.createElement('canvas').getContext('2d');if(!context)throw Error('Mesure indisponible.');
   context.font=`${size}px Celebration`;const number=context.measureText(String(age));
   context.font='400px Celebration';const years=context.measureText('ans');
   flushSync(()=>setMetrics({width:number.width+15+years.width,numberWidth:number.width,baseline:540+(number.fontBoundingBoxAscent-number.fontBoundingBoxDescent)/2,yearsBaseline:617.5+(years.fontBoundingBoxAscent-years.fontBoundingBoxDescent)/2}));
   continueRender(handle);
  }).catch(cancelRender);
  return()=>{disposed=true;continueRender(handle);};
 },[age,size]);
 if(!metrics)return null;
 const scale=1+Math.sin(cycle(frame,total))*.008,x=(1920-metrics.width)/2;
 return <g opacity={reveal(frame,total,1.5,4)*.22} style={{mixBlendMode:'screen'}}>
  <defs><linearGradient id="client-night-age-fade" x1="0" y1="0" x2="0" y2="1080" gradientUnits="userSpaceOnUse"><stop offset=".12" stopColor="white" stopOpacity="0"/><stop offset=".36" stopColor="white"/><stop offset=".64" stopColor="white"/><stop offset=".91" stopColor="white" stopOpacity="0"/></linearGradient><mask id="client-night-age-mask"><rect width="1920" height="1080" fill="url(#client-night-age-fade)"/></mask></defs>
  <g mask="url(#client-night-age-mask)" transform={`translate(960 565) scale(${scale}) translate(-960 -540)`} fill={color('#91a5e8')} stroke={color('#91a5e8')} fontFamily="Celebration" paintOrder="stroke fill">
   <text x={x} y={metrics.baseline} fontSize={size} strokeWidth="18">{age}</text><text x={x+metrics.numberWidth+15} y={metrics.yearsBaseline} fontSize="400" strokeWidth="12">ans</text>
  </g>
 </g>;
}
