import {Firework,WatercolorHeart,type FestiveKind} from '../video/Festive';
import {FestivePalette,useFestivePalette} from '../video/FestivePalette';
import type {FireworksPaletteId,HeartsPaletteId} from '../shared/festive';
export function FestiveSwatch({kind,fireworks,hearts}:{kind:FestiveKind;fireworks?:FireworksPaletteId;hearts?:HeartsPaletteId}){
 return <FestivePalette kind={kind} fireworks={fireworks} hearts={hearts}><SwatchArt kind={kind}/></FestivePalette>;
}
function SwatchArt({kind}:{kind:FestiveKind}){
 const palette=useFestivePalette();
 const dark=kind==='fireworks';
 return <span className="swatch festive-swatch" aria-hidden="true"><svg viewBox="0 0 100 100" width="56" height="56">
  <rect width="100" height="100" fill={palette.background}/>
  {dark?<><Firework x={10} y={22} radius={32} progress={.43} compact/><Firework x={93} y={81} radius={30} progress={.4} seed={59} compact/><circle cx="75" cy="15" r="1.1" fill={palette.light}/></>:<><WatercolorHeart x={18} y={29} scale={.32} angle={-17} index={70}/><WatercolorHeart x={87} y={80} scale={.4} angle={15} index={71}/><WatercolorHeart x={84} y={15} scale={.13} opacity={.4} index={72}/></>}
  <text x="50" y="64" textAnchor="middle" fontFamily="Portrait, Georgia, serif" fontWeight="700" fontSize="43" fill={palette.ink}>50</text>
 </svg></span>;
}
