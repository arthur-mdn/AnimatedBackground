import {createContext,useContext,useMemo,type ReactNode} from 'react';
import {gardenTone,type GardenPaletteId} from '../shared/garden';
const Context=createContext<GardenPaletteId>('ivoire');
export function GardenPalette({palette,children}:{palette:GardenPaletteId;children:ReactNode}){
 return <Context.Provider value={palette}>{children}</Context.Provider>;
}
export function useGardenColor(){const palette=useContext(Context);return useMemo(()=>(hex:string)=>gardenTone(hex,palette),[palette]);}
