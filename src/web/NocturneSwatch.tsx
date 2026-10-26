import {useEffect,useState} from 'react';
import {useNocturneColor} from '../video/NocturnePalette';
import {NocturneBackdrop} from '../video/Nocturne';

export function NocturneSwatch(){
 const color=useNocturneColor();
 const [offset,setOffset]=useState<{x:number;y:number;scale:number}|null>(null);
 useEffect(()=>{
  let mounted=true;
  void document.fonts.load('460px Celebration').then(()=>{
   if(!mounted)return;
   const context=document.createElement('canvas').getContext('2d');
   if(!context)return;
   context.font='460px Celebration';
   const metrics=context.measureText('50');
   const width=metrics.actualBoundingBoxLeft+metrics.actualBoundingBoxRight;
   const height=metrics.actualBoundingBoxAscent+metrics.actualBoundingBoxDescent;
   setOffset({x:(metrics.actualBoundingBoxLeft-metrics.actualBoundingBoxRight)/2,y:(metrics.actualBoundingBoxAscent-metrics.actualBoundingBoxDescent)/2,scale:Math.min(1,480/(width+11),480/(height+11))});
  });
  return()=>{mounted=false;};
 },[]);
 return <span className="swatch night-swatch" aria-hidden="true"><NocturneBackdrop cover/>
  <svg className="night-swatch-age" viewBox="0 0 600 600" width="56" height="56">
   <text x="0" y="0" transform={offset?`translate(300 318) scale(${offset.scale}) translate(${offset.x} ${offset.y})`:undefined} fontFamily="Celebration, cursive" fontSize="460" fill={color('#adbfed')} stroke={color('#adbfed')} strokeWidth="11" paintOrder="stroke fill" opacity={offset ? 0.72 : 0}>50</text>
  </svg>
 </span>;
}
