import type {OrnamentId} from '../shared/ornaments';
import {useWatercolorColor} from './WatercolorPalette';
import {CelebrationIconPaths} from './CelebrationIcon';
export function CelebrationOrnament({kind}:{kind:OrnamentId}){
 const color=useWatercolorColor();
 if(kind==='none')return null;
 return <svg width="500" height="64" viewBox="0 0 500 64" fill="none" stroke={color('#CF7E7F')} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
  <path d="M25 32H198 M302 32H475"/>
  <g transform="translate(218 0)"><CelebrationIconPaths kind={kind}/></g>
 </svg>;
}
