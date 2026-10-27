import {createContext,useContext,type ReactNode} from 'react';
import {Img,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';

type ClientAssets={images:Record<string,string>;holdSrc?:string;rasterScale?:number};
const Context=createContext<ClientAssets|null>(null);
export function ClientRendering({assets,children}:{assets:ClientAssets;children:ReactNode}){return <Context.Provider value={assets}>{children}</Context.Provider>;}
export const useClientRasterScale=()=>useContext(Context)?.rasterScale??1;
export const useClientRendering=()=>useContext(Context)!==null;
export function useVideoAsset(path:string){return useContext(Context)?.images[path]??staticFile(path);}
export function HeldForeground({children}:{children:ReactNode}){
 const assets=useContext(Context),frame=useCurrentFrame(),{durationInFrames}=useVideoConfig();
 return assets?.holdSrc&&frame>=270&&frame<=durationInFrames-1-270?<Img src={assets.holdSrc} style={{position:'absolute',inset:0,width:'100%',height:'100%'}}/>:<>{children}</>;
}
