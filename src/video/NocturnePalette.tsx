import {createContext,useContext,useMemo,type ReactNode} from 'react';
import {hexHsl} from '../shared/color';
import {resolveNocturnePalette,type NocturnePaletteId} from '../shared/nocturne';
export function nocturneTone(hex:string,id:NocturnePaletteId,customColor='#20366F'){
 if(id==='bleu-nuit')return hex;
 const palette=resolveNocturnePalette(id,customColor);
 const original=hexHsl(hex.slice(0,7));
 if(original.s<.025)return hex;
 // Deep skies stay dark; bright beams and highlights lean toward the horizon color.
 const blend=Math.min(1,Math.max(0,(original.l-.12)/.55));
 const gap=((palette.lightHue-palette.hue+540)%360)-180;
 const hue=(palette.hue+gap*blend+360)%360;
 const customSaturation=id==='custom'?hexHsl(customColor).s:1;
 const saturation=Math.min(.85,original.s*(original.l<.3?.88:.78)*customSaturation);
 const alpha=hex.length===9?` / ${(parseInt(hex.slice(7),16)/255).toFixed(4)}`:'';
 return `hsl(${hue.toFixed(2)} ${(saturation*100).toFixed(2)}% ${(original.l*100).toFixed(2)}%${alpha})`;
}
const Context=createContext<{id:NocturnePaletteId;customColor:string}>({id:'bleu-nuit',customColor:'#20366F'});
export function NocturnePalette({palette,customColor='#20366F',children}:{palette:NocturnePaletteId;customColor?:string;children:ReactNode}){
 const value=useMemo(()=>({id:palette,customColor}),[palette,customColor]);
 return <Context.Provider value={value}>{children}</Context.Provider>;
}
export const useNocturnePalette=()=>useContext(Context).id;
export function useNocturneSettings(){const {id,customColor}=useContext(Context);return useMemo(()=>resolveNocturnePalette(id,customColor),[id,customColor]);}
export function useNocturneColor(){const {id,customColor}=useContext(Context);return useMemo(()=>(hex:string)=>nocturneTone(hex,id,customColor),[id,customColor]);}
