import {hexHsl,cssRGB} from '../shared/color';
import {createContext,useContext,useMemo,type ReactNode} from 'react';

export const WATERCOLOR_DEFAULT='#CF7E7F';
export const watercolorColors=[{name:'Rose',value:WATERCOLOR_DEFAULT},{name:'Vert sauge',value:'#6F9B83'},{name:'Bleu',value:'#648DB5'},{name:'Lavande',value:'#9980B8'},{name:'Pêche',value:'#CF9974'},{name:'Turquoise',value:'#549F9C'},{name:'Argenté',value:'#A7ABB2'},{name:'Rouge',value:'#B94545'}] as const;
export function watercolorTone(hex:string,base:string){
 if(base.toUpperCase()===WATERCOLOR_DEFAULT)return hex;
 const original=hexHsl(hex),target=hexHsl(base);
 if(original.s<.025)return hex;
 const offset=original.h>25&&original.h<80?-18:Math.max(-10,Math.min(10,((original.h+180)%360)-180));
 const hue=(target.h+offset+360)%360;
 const saturation=Math.min(1,target.s*(.65+original.s*.75));
 return `hsl(${hue.toFixed(2)} ${(saturation*100).toFixed(2)}% ${(original.l*100).toFixed(2)}%)`;
}
export function watercolorRGB(hex:string,base:string){
 return cssRGB(watercolorTone(hex,base));
}
const BaseContext=createContext(WATERCOLOR_DEFAULT);
export const useWatercolorBase=()=>useContext(BaseContext);
const Context=createContext<(hex:string)=>string>(hex=>hex);
export function WatercolorPalette({base,children}:{base:string;children:ReactNode}){
 const color=useMemo(()=>(hex:string)=>watercolorTone(hex,base),[base]);
 return <BaseContext.Provider value={base}><Context.Provider value={color}>{children}</Context.Provider></BaseContext.Provider>;
}
export const useWatercolorColor=()=>useContext(Context);
