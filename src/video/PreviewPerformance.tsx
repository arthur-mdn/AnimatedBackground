import {createContext,useContext,type ReactNode} from 'react';
import {getRemotionEnvironment} from 'remotion';

// Safari on macOS and all iOS browsers use WebKit. Other desktop engines keep
// the full live composition; server exports always ignore this preview setting.
export function needsLightweightPreview(userAgent:string){
 return /AppleWebKit\//.test(userAgent)&&(!/(?:Chrome|Chromium|Edg|OPR|SamsungBrowser)\//.test(userAgent)||/iP(?:hone|ad|od)/.test(userAgent));
}
const Context=createContext(false);
export function PreviewPerformance({enabled,children}:{enabled:boolean;children:ReactNode}){return <Context.Provider value={enabled}>{children}</Context.Provider>;}
export function useLightweightPreview(){const enabled=useContext(Context);return enabled&&!getRemotionEnvironment().isRendering;}
