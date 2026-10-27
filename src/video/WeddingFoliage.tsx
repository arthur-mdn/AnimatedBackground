import {useGardenColor} from './GardenPalette';
import {smooth} from './timing';
import {useLightweightPreview} from './PreviewPerformance';
const random=(n:number)=>{const v=Math.sin(n*127.1+31.7)*43758.5453;return v-Math.floor(v);};
// Sample the same Bézier curve used by the stem, including its local direction.
function stemPoint(t:number,bend:number){
 const u=1-t,ys=[5,-10+bend*.5,11+bend,-8+bend];
 const x=u*u*u*-25+3*u*u*t*65+3*u*t*t*173+t*t*t*325;
 const y=u*u*u*ys[0]+3*u*u*t*ys[1]+3*u*t*t*ys[2]+t*t*t*ys[3];
 const dx=3*u*u*90+6*u*t*108+3*t*t*152;
 const dy=3*u*u*(ys[1]-ys[0])+6*u*t*(ys[2]-ys[1])+3*t*t*(ys[3]-ys[2]);
 return {x,y,angle:Math.atan2(dy,dx)*180/Math.PI};
}
function Leaf({tone}:{tone:number}){
 const color=useGardenColor();
 return <>
  <path d="M0 0C-4-16 1-42 18-62C30-37 23-10 0 0Z" fill={`url(#wedding-leaf-${tone})`} stroke={color("#819a76")} strokeWidth=".4"/>
  <path d="M0 0Q11-29 18-59 M7-23 2-33 M11-36 23-40" fill="none" stroke={color("#eef1d9")} strokeWidth=".75" opacity=".55"/>
 </>;
}
function Twig({phase,time,index,angle,x,y,scale=1}:{phase:number;time:number;index:number;angle:number;x:number;y:number;scale?:number}){
 const color=useGardenColor();
 const entrance=smooth((time-index*.16)/2.8);
 const visibility=smooth((time-index*.16)/.9);
 const wind=Math.sin(phase+index*.8)*3.2+Math.sin(phase*2+index)*.8;
 const bend=Math.sin(phase+index*.9)*10+(1-entrance)*24;
 const tip=stemPoint(1,bend),tipReveal=smooth((time-index*.16-.45)/1.8);
 const foldedAngle=[-30,18,32,-22][index];
 return <g opacity={visibility} transform={`translate(${x} ${y}) rotate(${angle+wind+(1-entrance)*foldedAngle}) scale(${scale*(.8+.2*entrance)})`}>
  <path d={`M-25 5C65 ${-10+bend*.5} 173 ${11+bend} 325 ${-8+bend}`} fill="none" stroke={color("#7d9772")} strokeWidth="2.1" opacity=".55"/>
  {Array.from({length:9},(_,i)=>{const point=stemPoint(.14+i*.095,bend);return [-1,1].map(side=>{
   const size=(.65+random(index*30+i*2+side)*.4)*(1-i*.035);
   const sway=Math.sin(phase+i*.45+index+side*.3)*4+Math.sin(phase*2+i)*1.2;
   const unfurl=smooth((time-index*.16-i*.055)/2.1);
   return <g key={`${i}-${side}`} transform={`translate(${point.x} ${point.y}) rotate(${point.angle+side*(22+i*2)+sway+(1-unfurl)*side*42}) scale(${size} ${side*size})`} opacity={(.58+random(i*8+index)*.26)*smooth(unfurl*3)}>
    <Leaf tone={(i+index)%3}/>
   </g>;
  });})}
  <g transform={`translate(${tip.x} ${tip.y}) rotate(${tip.angle+74+Math.sin(phase+index)*2+(1-tipReveal)*24}) scale(${.7*(.7+.3*tipReveal)})`} opacity={.78*smooth(tipReveal*3)}>
   <Leaf tone={(index+1)%3}/>
  </g>
 </g>;
}
// Without a timeline the model card shows the fully opened foliage.
export function WeddingFoliage({phase=0,time=Infinity,compact=false}:{phase?:number;time?:number;compact?:boolean}){
 const color=useGardenColor(),lightweight=useLightweightPreview();
 return <svg viewBox={`0 0 ${compact?1080:1920} 1080`} width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style={{position:'absolute',inset:0}} aria-hidden="true">
 <defs>
 {[['#bbc9a8','#6e916a'],['#d0d9bc','#819e78'],['#a6bd91','#587b57']].map(([light,dark],i)=><linearGradient key={i} id={`wedding-leaf-${i}`} x1="0" y1="0" x2="1" y2=".8"><stop stopColor={color(light)}/><stop offset=".52" stopColor={color(dark)}/><stop offset="1" stopColor={color("#d8dfc6")}/></linearGradient>)}
 <filter id="wedding-leaf-soft" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".045" numOctaves="2" seed="18" result="leaf-grain"/><feDisplacementMap in="SourceGraphic" in2="leaf-grain" scale="2.5" xChannelSelector="R" yChannelSelector="G"/><feGaussianBlur stdDeviation=".35"/></filter>
 </defs>
 {[false,true].map((bottom)=><g key={String(bottom)} transform={bottom?`translate(${compact?1080:1920} 1080) rotate(180)`:undefined} opacity=".9" filter={lightweight?undefined:"url(#wedding-leaf-soft)"}>
  <g transform={`translate(${-42-(1-smooth(time/3))*185} ${-20-(1-smooth(time/3))*135}) scale(${compact?1.1:1.5})`}>
   <Twig x={0} y={8} angle={15} index={0} phase={phase+(bottom?1.1:0)} time={time} scale={1.15}/>
   <Twig x={18} y={17} angle={48} index={1} phase={phase+(bottom?1.1:0)} time={time} scale={.98}/>
   <Twig x={2} y={42} angle={78} index={2} phase={phase+(bottom?1.1:0)} time={time} scale={.73}/>
   <Twig x={132} y={-36} angle={-4} index={3} phase={phase+(bottom?1.1:0)} time={time} scale={.9}/>
  </g>
 </g>)}
 </svg>;
}
