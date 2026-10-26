import type {CSSProperties} from 'react';
import {reveal} from './timing';

export function fadeUp(frame:number,total:number,start:number,fade:number,movement=fade,distance=12):CSSProperties{
 const t=Math.min(1,Math.max(0,(Math.min(frame,total-1-frame)/30-start)/movement));
 // Zero velocity and acceleration at both ends; never round subpixel positions.
 const progress=t*t*t*(10+t*(-15+6*t));
 return {
  opacity:reveal(frame,total,start,fade),
  transform:`translate3d(0,${(1-progress)*distance}px,0)`,
  willChange:'transform, opacity',
  backfaceVisibility:'hidden',
 };
}
