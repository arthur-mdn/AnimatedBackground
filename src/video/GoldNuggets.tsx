import {useWatercolorColor} from './WatercolorPalette';
import {memo,useMemo} from 'react';
import {useCurrentFrame,useVideoConfig} from 'remotion';
import {smooth} from './timing';

function random(index:number,salt:number){
 let value=Math.imul(index+salt,0x45d9f3b);
 value=Math.imul(value^(value>>>16),0x45d9f3b);
 return ((value^(value>>>16))>>>0)/4294967296;
}

// Gentle settling followed by a return current: zero speed at the loop seam.
export function nuggetMotion(frame:number,total:number,index:number,seed:number){
 const phase=2*Math.PI*frame/Math.max(1,total-1);
 const envelope=(1-Math.cos(phase))/2;
 if(envelope<1e-12)return {x:0,y:0,rotation:0};
 const offset=random(index,seed+2017)*Math.PI*2;
 return {
  x:(3+random(index,seed+2111)*5)*Math.sin(phase+offset)*envelope,
  y:(16+random(index,seed+2237)*16+2*Math.sin(2*phase+offset))*envelope,
  rotation:6*Math.sin(phase+offset)*envelope,
 };
}

// Several staggered reflections, with no flash at either loop endpoint.
export function nuggetSparkle(frame:number,total:number,index:number,seed:number){
 if(index%3!==0)return 0;
 const time=frame/30;
 let reflection=0;
 for(let pulse=0;pulse<3;pulse++){
  const center=(.12+pulse*.28+.09*random(index,seed+3001+pulse*61))*(total-1)/30;
  const width=.5+random(index,seed+3019+pulse*37)*.35;
  const distance=Math.abs(time-center)/width;
  if(distance<1)reflection=Math.max(reflection,Math.pow((1+Math.cos(Math.PI*distance))/2,1.5));
 }
 return reflection;
}

type Water={x:number;y:number;phase:number};
// Advect points in the same corner coordinate system as the liquid front.
export function nuggetFlow(x:number,y:number,spread:number,water:Water){
 const scale=1+1.55*spread,angle=water.phase*.065+Math.sin(spread*Math.PI)*.025;
 return {x:(x*Math.cos(angle)-y*Math.sin(angle))*scale+water.x*.8,y:(x*Math.sin(angle)+y*Math.cos(angle))*scale+water.y*.8};
}
export const NUGGET_COUNT=32;
export const NUGGET_RESIDENT_COUNT=6;
// Incoming fragments share the diagonal pour direction from the offscreen corner.
export function nuggetPour(index:number,seed:number,spread:number,water:Water){
 const angle=.08+random(index,seed+97)*(Math.PI/2-.16);
 if(index<NUGGET_RESIDENT_COUNT){
  const radius=35+Math.sqrt(random(index,seed+3))*175;
  return nuggetFlow(Math.cos(angle)*radius,Math.sin(angle)*radius,spread,water);
 }
 const radius=160+Math.sqrt(random(index,seed+3))*420;
 const end={x:Math.cos(angle)*radius,y:Math.sin(angle)*radius};
 const travel=Math.max(end.x,end.y)+90+random(index,seed+401)*180;
 const start={x:end.x-travel,y:end.y-travel};
 const delay=.03+random(index,seed+431)*.58;
 const p=smooth((spread-delay)/(1-delay));
 const distance=travel*p;
 return {
  x:start.x+distance+water.x*.8,
  y:start.y+distance+water.y*.8,
 };
}
export const GoldNuggets=memo(function GoldNuggets({id,seed,opposite=false,spread,water}:{id:string;seed:number;opposite?:boolean;spread:number;water:Water}){
 const color=useWatercolorColor();
 const frame=useCurrentFrame(),{durationInFrames}=useVideoConfig();
 // Keep the faceted artwork stable; only lightweight transforms change per frame.
 const fragments=useMemo(()=>Array.from({length:NUGGET_COUNT},(_,i)=>{
  const r=i%13===0?6.4:1.6+random(i,seed+827)*3.7;
  const points=`${-r} ${-r*.25},${-r*.5} ${-r*.9},${r*.42} ${-r*.72},${r} ${r*.13},${r*.28} ${r*.84},${-r*.72} ${r*.65}`;
  return {r,angle:random(i,seed+149)*360,opacity:.62+random(i,seed+677)*.36,art:<>
   <polygon points={points} fill={color('#a67e3a')} opacity=".25" transform="translate(.7 1)"/>
   <polygon points={points} fill={`url(#${id}-gold-leaf)`}/>
   <path d={`M${-r*.5} ${-r*.9} L${r*.42} ${-r*.72} L${-r*.12} ${r*.25}Z`} fill={color('#fff9dc')} opacity=".9"/>
   <path d={`M${r*.42} ${-r*.72} L${r} ${r*.13} L${r*.28} ${r*.84} L${-r*.12} ${r*.25}Z`} fill={color('#b48430')} opacity=".4"/>
  </>};
 }),[id,seed,color]);
 const dust=useMemo(()=>Array.from({length:16},(_,i)=>({r:.55+random(i,seed+1709)*1.15,fill:i%3?color('#d7ad5a'):color('#fff9d9')})),[seed,color]);
 const dustMotion=nuggetMotion(frame,durationInFrames,999,seed);
 // The lower ink corner is rotated 180°: compensate so gravity points down
 // on the screen in both corners.
 const gravityDirection=opposite?-1:1;
 return <g>
  <defs>
   <linearGradient id={`${id}-gold-leaf`} x1="0" y1="0" x2="1" y2="1">
    <stop stopColor={color('#fff8d5')}/><stop offset=".3" stopColor={color('#f4dc91')}/>
    <stop offset=".57" stopColor={color('#bd8f32')}/><stop offset=".8" stopColor={color('#f9e8b0')}/><stop offset="1" stopColor={color('#9d7029')}/>
   </linearGradient>
   <radialGradient id={`${id}-gold-glow`}><stop stopColor={color('#fffce9')} stopOpacity=".7"/><stop offset=".35" stopColor={color('#ffe9a7')} stopOpacity=".25"/><stop offset="1" stopColor={color('#ffe9a7')} stopOpacity="0"/></radialGradient>
  </defs>
  {fragments.map((fragment,i)=>{
   const motion=nuggetMotion(frame,durationInFrames,i,seed);
   const flow=nuggetPour(i,seed,spread,water);
   const sparkle=nuggetSparkle(frame,durationInFrames,i,seed);
   return <g key={i} transform={`translate(${flow.x+motion.x} ${flow.y+gravityDirection*motion.y}) rotate(${fragment.angle+motion.rotation+water.phase*7+spread*8})`} opacity={Math.min(1,fragment.opacity+sparkle*.3)}>{fragment.art}
    {sparkle>0&&<g opacity={sparkle*.95}>
     <circle r={fragment.r*3.5} fill={`url(#${id}-gold-glow)`}/>
     <path d={`M0 ${-fragment.r*2.4} Q.7 -.7 ${fragment.r*2.4} 0 Q.7 .7 0 ${fragment.r*2.4} Q-.7 .7 ${-fragment.r*2.4} 0 Q-.7 -.7 0 ${-fragment.r*2.4}Z`} fill={color('#fff9e6')}/>
     <circle r={fragment.r*.35} fill={color('#fffdf3')}/>
    </g>}
   </g>;
  })}
  <g transform={`translate(${dustMotion.x*.5} ${gravityDirection*dustMotion.y*.6})`}>{dust.map((particle,i)=>{
   const flow=nuggetPour(i+3,seed+1049,spread,water);
   return <circle key={i} cx={flow.x} cy={flow.y} r={particle.r} fill={particle.fill} opacity=".72"/>;
  })}</g>
 </g>;
});
