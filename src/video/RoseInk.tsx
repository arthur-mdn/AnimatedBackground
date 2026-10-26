import {watercolorRGB,useWatercolorBase,useWatercolorColor} from './WatercolorPalette';
import {useCurrentFrame,useVideoConfig} from 'remotion';
import {smooth} from './timing';
import {GoldNuggets} from './GoldNuggets';

/** An organic capillary front: fixed harmonics keep the texture deterministic. */
export function inkOutline(radius:number,seed:number,stretch=1,motion=0){
 const points=Array.from({length:241},(_,i)=>{
  const a=i/240*Math.PI*2;
  const wave=1+.065*Math.sin(a*7+seed+motion)+.035*Math.sin(a*17+seed*2-motion*.7)+.018*Math.sin(a*41+seed+motion*.4)+.008*Math.sin(a*83);
  return `${(Math.cos(a)*radius*wave*stretch).toFixed(2)},${(Math.sin(a)*radius*wave).toFixed(2)}`;
 });
 return `M${points.join(' L')}Z`;
}

export function inkSpread(frame:number,total:number){
 const distance=Math.min(frame,total-1-frame)/30;
 // Keep the spread radius fixed for seven seconds at either end of the loop.
 // On short loops, shorten the travel slightly so it reaches full spread.
 const travelSeconds=Math.min(9,Math.floor((total-1)/2)/30-7);
 return smooth((distance-7)/Math.max(1/30,travelSeconds));
}

// Mirrored frame time gives identical liquid states at both encoded endpoints.
// Flow settles gradually from 7 to 9 seconds, while the spreading takes over.
export function inkWaterMotion(frame:number,total:number){
 const time=Math.min(frame,total-1-frame)/30;
 const strength=smooth(time/1.2)*(1-smooth((time-7)/2));
 return {x:10*Math.sin(time*.8)*strength,y:8*Math.sin(time*.63)*strength,phase:.45*Math.sin(time*.9)*strength};
}

function InkCorner({id,spread,water,showGoldNuggets,opposite=false}:{id:string;spread:number;water:ReturnType<typeof inkWaterMotion>;showGoldNuggets:boolean;opposite?:boolean}){
 const color=useWatercolorColor(),base=useWatercolorBase();
 const [red,green,blue]=base.toUpperCase()==='#CF7E7F'?[.76,.38,.4]:watercolorRGB('#c26166',base);
 const radius=250+spread*450;
 return <g opacity={0.84} transform={opposite?'translate(1920 1080) rotate(180)':'translate(0 0)'}>
 <defs>
  <radialGradient id={`${id}-opacity`} gradientUnits="userSpaceOnUse" cx="0" cy="0" r="760">
   <stop offset="0" stopColor="white" stopOpacity="1"/>
   <stop offset=".24" stopColor="white" stopOpacity="1"/>
   <stop offset=".48" stopColor="white" stopOpacity=".78"/>
   <stop offset=".72" stopColor="white" stopOpacity=".35"/>
   <stop offset=".9" stopColor="white" stopOpacity=".1"/>
   <stop offset="1" stopColor="white" stopOpacity="0"/>
  </radialGradient>
  <mask id={`${id}-fade`} maskUnits="userSpaceOnUse" x="-70" y="-70" width="1000" height="1000">
   <rect x="-70" y="-70" width="1000" height="1000" fill={`url(#${id}-opacity)`}/>
  </mask>
  <radialGradient id={`${id}-pigment`} cx="28%" cy="25%" r="78%">
   <stop stopColor={color('#eda4a7')} stopOpacity=".62"/><stop offset=".52" stopColor={color('#f3bcb8')} stopOpacity=".56"/>
   <stop offset=".85" stopColor={color('#de929a')} stopOpacity=".42"/><stop offset="1" stopColor={color('#f1b8b9')} stopOpacity=".12"/>
  </radialGradient>
  <filter id={`${id}-bleed`} x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
   <feTurbulence type="fractalNoise" baseFrequency=".018 .022" numOctaves={3} seed={opposite?47:23} result="grain"/>
   <feOffset in="grain" dx={water.x} dy={water.y} result="flow"/>
   <feDisplacementMap in="SourceGraphic" in2="flow" scale={42} xChannelSelector="R" yChannelSelector="G"/>
   <feGaussianBlur stdDeviation=".55"/>
  </filter>
  <filter id={`${id}-texture`} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
   <feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves={4} seed={opposite?11:31} result="pigment-grain"/>
   <feOffset in="pigment-grain" dx={water.x} dy={water.y}/>
   <feColorMatrix type="matrix" values={`0 0 0 0 ${red}  0 0 0 0 ${green}  0 0 0 0 ${blue}  0 0 0 .48 -.13`}/>
  </filter>
  <mask id={`${id}-spread`} maskUnits="userSpaceOnUse" x="-70" y="-70" width="1000" height="1000">
   <path d={inkOutline(radius,opposite?8:3,.98,water.phase)} fill="white" filter={`url(#${id}-bleed)`}/>
  </mask>
 </defs>
 <g mask={`url(#${id}-fade)`}>
 <g mask={`url(#${id}-spread)`}>
  <path d={inkOutline(800,3,.98)} fill={`url(#${id}-pigment)`}/>
  <g filter={`url(#${id}-bleed)`}>
  {Array.from({length:12},(_,i)=><path key={i} d={inkOutline(350+i*40,i+1,.94,water.phase)}
    fill={i%3===0?color('#f7d5d0'):color('#d58b9a')} fillOpacity={i%3===0?.09:.032}
    stroke={color('#c78594')} strokeOpacity=".09" strokeWidth={1.2}
    transform={`translate(${Math.sin(i*3)*40} ${Math.cos(i*2)*45})`}
    />)}
  </g>
  <rect x="-20" y="-20" width="900" height="900" filter={`url(#${id}-texture)`} opacity=".65"/>
  {showGoldNuggets&&<GoldNuggets id={id} seed={opposite?47:13} opposite={opposite}/>}
 </g>
 <path d={inkOutline(radius,opposite?8:3,.98,water.phase)} fill="none" stroke={color('#bc7585')} strokeWidth="2" strokeOpacity=".15" filter={`url(#${id}-bleed)`}/>
 </g>
 </g>;
}

export function RoseInk({showGoldNuggets}:{showGoldNuggets:boolean}){
 const frame=useCurrentFrame(),{durationInFrames}=useVideoConfig();
 const spread=inkSpread(frame,durationInFrames);
 const water=inkWaterMotion(frame,durationInFrames);
 return <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{position:'absolute',inset:0}} aria-hidden="true">
  <InkCorner id="ink-top" spread={spread} water={water} showGoldNuggets={showGoldNuggets}/>
  <InkCorner id="ink-bottom" spread={spread} water={water} showGoldNuggets={showGoldNuggets} opposite/>
 </svg>;
}
