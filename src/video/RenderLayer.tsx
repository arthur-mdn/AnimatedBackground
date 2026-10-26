import {createContext,useContext,type ReactNode} from 'react';
const Context=createContext<'full'|'background'|'foreground'|'screen'>('full');
export function RenderLayer({layer,children}:{layer:'background'|'foreground'|'screen';children:ReactNode}){return <Context.Provider value={layer}>{children}</Context.Provider>;}
export const useRenderLayer=()=>useContext(Context);
