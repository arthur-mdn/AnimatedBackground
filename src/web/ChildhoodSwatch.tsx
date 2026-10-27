import {ChildhoodPalette,useChildhoodPalette} from '../video/ChildhoodPalette';
import type {ChildhoodPaletteId} from '../shared/childhood';

function SwatchArt(){
 const palette=useChildhoodPalette();
 return <svg viewBox="0 0 56 56" width="56" height="56" aria-hidden="true">
  <rect width="56" height="56" fill={palette.background}/>
  <path d="M10 12 l5 0 -2.5 7 Z" fill={palette.balloon[0]} opacity=".85"/><path d="M22 10 l5 0 -2.5 7 Z" fill={palette.balloon[1]} opacity=".85"/><path d="M34 13 l5 0 -2.5 7 Z" fill={palette.balloon[2]} opacity=".85"/>
  <path d="M-2 11 C14 17 24 7 38 13 C48 17 54 10 58 12" fill="none" stroke="#c4b4a4" strokeWidth="1.5" strokeLinecap="round"/>
  <ellipse cx="16" cy="32" rx="7" ry="9" fill={palette.balloon[0]} opacity=".88"/>
  <ellipse cx="28" cy="28" rx="6.5" ry="8.5" fill={palette.balloon[1]} opacity=".88"/>
  <path d="M16 41 v9 M28 36.5 v11" stroke="#9a8c84" strokeWidth=".8" opacity=".45"/>
  <path d="M14.5 40.5 Q16 43 17.5 40.5 Z" fill={palette.balloon[0]} opacity=".88"/>
  <path d="M26.5 36 Q28 38.5 29.5 36 Z" fill={palette.balloon[1]} opacity=".88"/>
 </svg>;
}

export function ChildhoodSwatch({palette='ciel'}:{palette?:ChildhoodPaletteId}){
 return <ChildhoodPalette palette={palette}><span className="swatch childhood-swatch" aria-hidden="true"><SwatchArt/></span></ChildhoodPalette>;
}
