import {mixColors} from '../shared/color';
import {useVowsPalette} from './VowsPalette';

const f=(value:number)=>value.toFixed(1);

function closedCurve(points:number[][]){
 const mid=(p:number[],q:number[])=>[(p[0]+q[0])/2,(p[1]+q[1])/2],start=mid(points[points.length-1],points[0]);
 return `M${f(start[0])} ${f(start[1])}`+points.map((p,i)=>{const m=mid(p,points[(i+1)%points.length]);return ` Q${f(p[0])} ${f(p[1])} ${f(m[0])} ${f(m[1])}`;}).join('')+'Z';
}

function outline(radius:number,shift=0){
 const count=120;
 return closedCurve(Array.from({length:count},(_,i)=>{
  const a=i/count*Math.PI*2,k=1+.045*Math.sin(11*a+.3+shift)+.022*Math.sin(17*a+1.1+shift*2)+.018*Math.sin(5*a+2)+.012*Math.sin(29*a+shift*3);
  return [Math.cos(a)*radius*k,Math.sin(a)*radius*k];
 }));
}

function quad(t:number,[x0,y0]:number[],[cx,cy]:number[],[x1,y1]:number[]){
 const u=1-t;
 return {x:u*u*x0+2*u*t*cx+t*t*x1,y:u*u*y0+2*u*t*cy+t*t*y1,angle:Math.atan2(2*u*(cy-y0)+2*t*(y1-cy),2*u*(cx-x0)+2*t*(x1-cx))};
}

function leafPath(length:number,width:number){
 return `M0 0 C${f(length*.22)} ${f(-width)} ${f(length*.72)} ${f(-width*.85)} ${f(length)} 0 C${f(length*.72)} ${f(width*.75)} ${f(length*.22)} ${f(width)} 0 0Z`;
}

function Sprig({scale}:{scale:number}){
 const from=[-38*scale,50*scale],ctrl=[-6*scale,8*scale],to=[30*scale,-50*scale];
 const leaves=[.16,.3,.44,.58,.72,.84].map((t,i)=>({...quad(t,from,ctrl,to),side:i%2?1:-1,size:1-t*.35}));
 const tip=quad(1,from,ctrl,to);
 return <g fill="#d2d2d2" stroke="#d2d2d2">
  <path d={`M${f(from[0])} ${f(from[1])} Q${f(ctrl[0])} ${f(ctrl[1])} ${f(to[0])} ${f(to[1])}`} fill="none" strokeWidth={3.6*scale} strokeLinecap="round"/>
  {leaves.map((leaf,i)=><path key={i} stroke="none" transform={`translate(${f(leaf.x)} ${f(leaf.y)}) rotate(${f((leaf.angle+leaf.side*.9)*180/Math.PI)})`} d={leafPath(34*scale*leaf.size,10.5*scale*leaf.size)}/>)}
  <path stroke="none" transform={`translate(${f(tip.x)} ${f(tip.y)}) rotate(${f(tip.angle*180/Math.PI)})`} d={leafPath(24*scale,7*scale)}/>
 </g>;
}

export function WaxSeal({x,y,radius,progress}:{x:number;y:number;radius:number;progress:number}){
 const palette=useVowsPalette(),r=radius,rest=1-progress,disc=r*.63,body=outline(r);
 return <g transform={`translate(${x} ${y}) rotate(${-12*rest}) scale(${1+.45*rest*rest})`} opacity={Math.min(1,progress*3)}>
  <defs>
   <filter id="vows-seal-soft-shadow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="10"/></filter>
   <filter id="vows-seal-contact" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>
   <filter id="vows-wax" x={-r*1.3} y={-r*1.3} width={r*2.6} height={r*2.6} filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
    <feGaussianBlur in="SourceGraphic" stdDeviation={r*.024} result="soft"/>
    <feTurbulence type="fractalNoise" baseFrequency=".55" numOctaves="2" seed="4" result="noise"/>
    <feComposite in="soft" in2="noise" operator="arithmetic" k2="1" k3=".014" result="bumpy"/>
    <feColorMatrix in="bumpy" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1 0 0 0 0" result="height"/>
    <feDiffuseLighting in="height" surfaceScale={r*.11} diffuseConstant="1" lightingColor={mixColors(palette.seal,palette.sealLight,.15)} result="diffuse"><feDistantLight azimuth="225" elevation="46"/></feDiffuseLighting>
    <feSpecularLighting in="height" surfaceScale={r*.11} specularConstant=".5" specularExponent="42" lightingColor="#fff7e2" result="specular"><feDistantLight azimuth="225" elevation="50"/></feSpecularLighting>
    <feFlood floodColor={palette.sealDark} result="ambient"/>
    <feComposite in="diffuse" in2="ambient" operator="arithmetic" k2="1" k3=".14" result="lit"/>
    <feComposite in="lit" in2="specular" operator="arithmetic" k2="1" k3=".45"/>
   </filter>
   <clipPath id="vows-seal-clip"><path d={body}/></clipPath>
  </defs>
  <path d={body} fill={palette.shadow} opacity={.42*progress} transform="translate(12 18)" filter="url(#vows-seal-soft-shadow)"/>
  <path d={body} fill={palette.shadow} opacity={.5*progress} transform="translate(3 5)" filter="url(#vows-seal-contact)"/>
  <g clipPath="url(#vows-seal-clip)">
   <g filter="url(#vows-wax)">
    <rect x={-r*1.3} y={-r*1.3} width={r*2.6} height={r*2.6} fill="#000"/>
    <path d={body} fill="#686868"/>
    <path d={outline(r*.95,.7)} fill="#a4a4a4"/>
    <path d={outline(r*.9,1.4)} fill="#d6d6d6"/>
    <path d={outline(r*.84,2.1)} fill="#f0f0f0"/>
    <circle r={disc+5} fill="#d8d8d8"/>
    <circle r={disc} fill="#9c9c9c"/>
    <circle r={disc-5} fill="none" stroke="#b2b2b2" strokeWidth={2.2}/>
    <Sprig scale={r/116}/>
   </g>
  </g>
 </g>;
}
