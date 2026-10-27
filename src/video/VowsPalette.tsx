import {createContext,useContext,type ReactNode} from 'react';
import {vowsPalette,type VowsPaletteId} from '../shared/vows';
const Context=createContext(vowsPalette('or'));
export function VowsPaletteProvider({palette,children}:{palette:VowsPaletteId;children:ReactNode}){
 return <Context.Provider value={vowsPalette(palette)}>{children}</Context.Provider>;
}
export const useVowsPalette=()=>useContext(Context);
