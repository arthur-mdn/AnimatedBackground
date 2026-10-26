import {useEffect,useState} from 'react';
import {WeddingFoliage} from '../video/WeddingFoliage';
import {GardenPalette} from '../video/GardenPalette';
import {gardenPalette,type GardenPaletteId} from '../shared/garden';
export function WeddingSwatch({palette='ivoire'}:{palette?:GardenPaletteId}){
 const colors=gardenPalette(palette),[position,setPosition]=useState<{x:number;y:number}|null>(null);
 useEffect(()=>{
  let mounted=true;
  void document.fonts.load('200px GardenNames').then(()=>{
   if(!mounted)return;
   const canvas=document.createElement('canvas'),context=canvas.getContext('2d');if(!context)return;
   context.font='200px GardenNames';const metrics=context.measureText('&');
   const origin=16+Math.ceil(metrics.actualBoundingBoxLeft),baseline=16+Math.ceil(metrics.actualBoundingBoxAscent);
   canvas.width=Math.ceil(metrics.actualBoundingBoxLeft+metrics.actualBoundingBoxRight)+32;
   canvas.height=Math.ceil(metrics.actualBoundingBoxAscent+metrics.actualBoundingBoxDescent)+32;
   context.font='200px GardenNames';context.fillText('&',origin,baseline);
   const data=context.getImageData(0,0,canvas.width,canvas.height).data;
   let weight=0,x=0,y=0;
   // Center the ink's visual weight, including Chancery's asymmetric flourish.
   for(let i=0;i<data.length;i+=4){const alpha=data[i+3];weight+=alpha;x+=(i/4%canvas.width)*alpha;y+=Math.floor(i/4/canvas.width)*alpha;}
   if(weight)setPosition({x:28+(origin-x/weight)/5,y:28+(baseline-y/weight)/5});
  });
  return()=>{mounted=false;};
 },[]);
 return <GardenPalette palette={palette}><span className="swatch wedding-swatch" style={{background:colors.background}} aria-hidden="true"><WeddingFoliage compact/><svg className="wedding-swatch-symbol" viewBox="0 0 56 56" width="56" height="56"><text x={position?.x} y={position?.y} fontFamily="GardenNames, cursive" fontSize="40" fill={colors.secondary} opacity={position?1:0}>&amp;</text></svg></span></GardenPalette>;
}
