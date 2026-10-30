import {createContext,useContext,type ReactNode} from 'react';
import {fireworksPalette,heartsPalette,type FestiveColors,type FireworksPaletteId,type HeartsPaletteId} from '../shared/festive';
const Context=createContext<FestiveColors>(fireworksPalette('or'));
export function FestivePalette({kind,fireworks='or',hearts='rose',children}:{kind:'fireworks'|'hearts';fireworks?:FireworksPaletteId;hearts?:HeartsPaletteId;children:ReactNode}){
 return <Context.Provider value={kind==='fireworks'?fireworksPalette(fireworks):heartsPalette(hearts)}>{children}</Context.Provider>;
}
export const useFestivePalette=()=>useContext(Context);
