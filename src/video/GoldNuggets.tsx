import {useWatercolorColor} from './WatercolorPalette';
import {memo,useMemo} from 'react';
import {useCurrentFrame,useVideoConfig} from 'remotion';

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

// One slow, sparse reflection per eligible fragment; dark at both loop endpoints.
export function nuggetSparkle(frame:number,total:number,index:number,seed:number){
 if(index%11!==0)return 0;
 const time=frame/30;
 const center=(.15+.7*random(index,seed+3001))*(total-1)/30;
 const width=.8+random(index,seed+3019)*.45;
 const distance=Math.abs(time-center)/width;
 return distance>=1?0:Math.pow((1+Math.cos(Math.PI*distance))/2,2);
}

export const GoldNuggets=memo(function GoldNuggets({id,seed,opposite=false}:{id:string;seed:number;opposite?:boolean}){
 const color=useWatercolorColor();
 const frame=useCurrentFrame(),{durationInFrames}=useVideoConfig();
 // Keep the faceted artwork stable; only lightweight transforms change per frame.
 const fragments=useMemo(()=>Array.from({length:64},(_,i)=>{
  const x=35+random(i,seed+3)*540;
  const y=25+random(i,seed+97)*490;
  const r=i%13===0?6.4:1.6+random(i,seed+827)*3.7;
  const points=`${-r} ${-r*.25},${-r*.5} ${-r*.9},${r*.42} ${-r*.72},${r} ${r*.13},${r*.28} ${r*.84},${-r*.72} ${r*.65}`;
  return {x,y,r,angle:random(i,seed+149)*360,opacity:.62+random(i,seed+677)*.36,art:<>
   <polygon points={points} fill={color('#a67e3a')} opacity=".25" transform="translate(.7 1)"/>
   <polygon points={points} fill={`url(#${id}-gold-leaf)`}/>
   <path d={`M${-r*.5} ${-r*.9} L${r*.42} ${-r*.72} L${-r*.12} ${r*.25}Z`} fill={color('#fff9dc')} opacity=".9"/>
   <path d={`M${r*.42} ${-r*.72} L${r} ${r*.13} L${r*.28} ${r*.84} L${-r*.12} ${r*.25}Z`} fill={color('#b48430')} opacity=".4"/>
  </>};
 }),[id,seed,color]);
 const dust=useMemo(()=>Array.from({length:28},(_,i)=><circle key={i} cx={20+random(i,seed+1049)*560} cy={20+random(i,seed+1277)*520}
  r={.55+random(i,seed+1709)*1.15} fill={i%3?color('#d7ad5a'):color('#fff9d9')} opacity=".72"/>),[seed,color]);
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
  </defs>
  {fragments.map((fragment,i)=>{
   const motion=nuggetMotion(frame,durationInFrames,i,seed);
   const sparkle=nuggetSparkle(frame,durationInFrames,i,seed);
   return <g key={i} transform={`translate(${fragment.x+motion.x} ${fragment.y+gravityDirection*motion.y}) rotate(${fragment.angle+motion.rotation})`} opacity={Math.min(1,fragment.opacity+sparkle*.1)}>{fragment.art}
    {sparkle>0&&<g opacity={sparkle*.55}>
     <circle r={fragment.r*.85} fill={color('#fff2ba')} opacity=".3"/>
     <path d={`M0 ${-fragment.r*1.5} Q.55 -.55 ${fragment.r*1.5} 0 Q.55 .55 0 ${fragment.r*1.5} Q-.55 .55 ${-fragment.r*1.5} 0 Q-.55 -.55 0 ${-fragment.r*1.5}Z`} fill={color('#fff9e6')}/>
    </g>}
   </g>;
  })}
  <g transform={`translate(${dustMotion.x*.5} ${gravityDirection*dustMotion.y*.6})`}>{dust}</g>
 </g>;
});
