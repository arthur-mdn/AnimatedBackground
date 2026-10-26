import {createContext,useContext,useMemo,type ReactNode} from 'react';
import {hexHsl} from '../shared/color';
import {nocturnePalettes,type NocturnePaletteId} from '../shared/nocturne';
export function nocturneTone(hex:string,id:NocturnePaletteId){
 if(id==='bleu-nuit')return hex;
 const palette=nocturnePalettes.find(p=>p.id===id)!;
 const original=hexHsl(hex.slice(0,7));
 if(original.s<.025)return hex;
 // Deep skies stay dark; bright beams and highlights lean toward the horizon color.
 const blend=Math.min(1,Math.max(0,(original.l-.12)/.55));
 const gap=((palette.lightHue-palette.hue+540)%360)-180;
 const hue=(palette.hue+gap*blend+360)%360;
 const saturation=Math.min(.85,original.s*(original.l<.3?.88:.78));
 const alpha=hex.length===9?` / ${(parseInt(hex.slice(7),16)/255).toFixed(4)}`:'';
 return `hsl(${hue.toFixed(2)} ${(saturation*100).toFixed(2)}% ${(original.l*100).toFixed(2)}%${alpha})`;
}
const Context=createContext<NocturnePaletteId>('bleu-nuit');
export function NocturnePalette({palette,children}:{palette:NocturnePaletteId;children:ReactNode}){return <Context.Provider value={palette}>{children}</Context.Provider>;}
export const useNocturnePalette=()=>useContext(Context);
export function useNocturneColor(){const palette=useNocturnePalette();return useMemo(()=>(hex:string)=>nocturneTone(hex,palette),[palette]);}
