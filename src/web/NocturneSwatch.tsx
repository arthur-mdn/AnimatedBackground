import {useEffect,useState} from 'react';
import {useNocturneColor} from '../video/NocturnePalette';
import {NocturneBackdrop} from '../video/Nocturne';

export function NocturneSwatch(){
 const color=useNocturneColor(),fill=color('#adbfed');
 const [sprite,setSprite]=useState<{href:string;width:number;height:number}|null>(null);
 useEffect(()=>{
  let mounted=true;
  void document.fonts.load('460px Celebration').then(()=>{
   if(!mounted)return;
   const canvas=document.createElement('canvas'),context=canvas.getContext('2d');
   if(!context)return;
   const fontSize=460,stroke=11,pad=28;
   context.font=`${fontSize}px Celebration`;
   const metrics=context.measureText('50');
   const origin=pad+Math.ceil(metrics.actualBoundingBoxLeft+stroke/2);
   const baseline=pad+Math.ceil(metrics.actualBoundingBoxAscent+stroke/2);
   canvas.width=Math.ceil(metrics.actualBoundingBoxLeft+metrics.actualBoundingBoxRight)+pad*2+stroke;
   canvas.height=Math.ceil(metrics.actualBoundingBoxAscent+metrics.actualBoundingBoxDescent)+pad*2+stroke;
   context.font=`${fontSize}px Celebration`;
   context.lineJoin='round';context.lineWidth=stroke;context.strokeStyle=fill;context.fillStyle=fill;
   context.strokeText('50',origin,baseline);context.fillText('50',origin,baseline);
   setSprite({href:canvas.toDataURL('image/png'),width:canvas.width,height:canvas.height});
  });
  return()=>{mounted=false;};
 },[fill]);
 const fit=520,scale=sprite?Math.min(1,fit/sprite.width,fit/sprite.height):1;
 return <span className="swatch night-swatch" aria-hidden="true"><NocturneBackdrop cover/>
  <svg className="night-swatch-age" viewBox="0 0 600 600" width="56" height="56">
   {sprite&&<image href={sprite.href} width={sprite.width*scale} height={sprite.height*scale} x={(600-sprite.width*scale)/2} y={(600-sprite.height*scale)/2} opacity=".72"/>}
  </svg>
 </span>;
}
