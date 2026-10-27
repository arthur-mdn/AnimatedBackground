import {createContext,useContext,type ReactNode} from 'react';
import {childhoodPalette,type ChildhoodPaletteId} from '../shared/childhood';
const Context=createContext(childhoodPalette('rose'));
export function ChildhoodPalette({palette,children}:{palette:ChildhoodPaletteId;children:ReactNode}){
 return <Context.Provider value={childhoodPalette(palette)}>{children}</Context.Provider>;
}
export const useChildhoodPalette=()=>useContext(Context);
