import {VowsPaletteProvider,useVowsPalette} from '../video/VowsPalette';
import type {VowsPaletteId} from '../shared/vows';

function SwatchArt(){
 const palette=useVowsPalette();
 return <svg viewBox="0 0 56 56" width="56" height="56" aria-hidden="true">
  <rect width="56" height="56" fill={palette.fold}/>
  <path d="M12 56 L28 43 L44 56 Z" fill={palette.paper}/>
  <path d="M0 0 H56 V27 L30 44 Q28 45 26 44 L0 29 Z" fill={palette.text} opacity=".08" transform="translate(0 1.5)"/>
  <path d="M0 0 H56 V27 L30 44 Q28 45 26 44 L0 29 Z" fill={palette.paper}/>
  <path d="M17 15 C20 12 24 12 27 14 C30 16 34 16 37 13" fill="none" stroke={palette.text} strokeOpacity=".6" strokeWidth="1.2" strokeLinecap="round"/>
  <path d="M21 22 C24 19 28 19 31 21 C33 22 35 22 38 20" fill="none" stroke={palette.text} strokeOpacity=".6" strokeWidth="1.2" strokeLinecap="round"/>
  <path d="M23 28.5 H33" stroke={palette.accent} strokeWidth=".7"/>
  <path d="M27 44 L26 56 M29 44 L30.5 56" stroke={palette.twine} strokeWidth="1"/>
  <circle cx="28" cy="43" r="6.5" fill={palette.seal}/>
  <circle cx="28" cy="43" r="4.3" fill="none" stroke={palette.sealDark} strokeOpacity=".6" strokeWidth=".8"/>
  <circle cx="26" cy="41" r="1.4" fill="#fff" opacity=".3"/>
  <path d="M44 0 Q50 8 56 10 V0 Z" fill={palette.shadow} opacity=".14"/>
  <path d="M-2 4 Q6 2 13 6" fill="none" stroke="#6d5f45" strokeWidth=".7"/>
  <path d="M3 3.6 Q5 0 9 .4 Q7 3.4 3 3.6Z M7 4.6 Q10 7.6 13.5 7 Q11 4 7 4.6Z M1 4.4 Q2 8 5.5 9 Q5 5.4 1 4.4Z" fill="#5b6a45"/>
  <path d="M56 50 Q49 50 44 55" fill="none" stroke="#6d5f45" strokeWidth=".7"/>
  <path d="M51 50.6 Q49 47 45 47.6 Q47 50.4 51 50.6Z M47 52.4 Q44 50 41 51.6 Q44 54 47 52.4Z" fill="#5b6a45"/>
 </svg>;
}

export function VowsSwatch({palette='or'}:{palette?:VowsPaletteId}){
 return <VowsPaletteProvider palette={palette}><span className="swatch vows-swatch" aria-hidden="true"><SwatchArt/></span></VowsPaletteProvider>;
}
