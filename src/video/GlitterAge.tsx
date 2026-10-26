import {useWatercolorColor} from './WatercolorPalette';
import {memo,useEffect,useState} from 'react';
import {cancelRender,continueRender,delayRender,useCurrentFrame,useVideoConfig} from 'remotion';
import {APPEARANCE,reveal} from './timing';

function grain(index:number,salt:number){
 let value=Math.imul(index+salt,0x45d9f3b);
 value=Math.imul(value^(value>>>16),0x45d9f3b);
 return ((value^(value>>>16))>>>0)/4294967296;
}

function YearsLabel({x}:{x:number}){
 const color=useWatercolorColor();
 const frame=useCurrentFrame(),{durationInFrames}=useVideoConfig();
 const opacity=reveal(frame,durationInFrames,APPEARANCE.years.start,APPEARANCE.years.fade);
 return <text x={x} y="339" fontFamily="Celebration, cursive" fontSize="126" fill={color('#c49a59')} opacity={opacity} transform={`translate(0 ${(1-opacity)*6})`}>ans</text>;
}

// Native SVG text stays editable. The patterned face is clipped by the glyphs;
// offset copies, a bevel and a soft shadow create shallow rose-gold extrusion.
export const GlitterAge=memo(function GlitterAge({age}:{age:number}){
 const color=useWatercolorColor();
 const size=String(age).length===3?340:370;
 const [width,setWidth]=useState(String(age).length*220);
 useEffect(()=>{
  const handle=delayRender('Mesure des chiffres');
  let disposed=false;
  document.fonts.load(`700 ${size}px Portrait`).then(()=>{
   if(disposed)return;
   const context=document.createElement('canvas').getContext('2d');
   if(!context)throw Error('Mesure des chiffres indisponible.');
   context.font=`700 ${size}px Portrait`;
   setWidth(context.measureText(String(age)).width);
   continueRender(handle);
  }).catch(cancelRender);
  return()=>{disposed=true;continueRender(handle);};
 },[age,size]);
 const glyph={x:960,y:365,textAnchor:'middle' as const,fontFamily:'Portrait, Georgia, serif',fontSize:size,fontWeight:700,fontVariantNumeric:'lining-nums'};
 return <svg viewBox="0 0 1920 450" width="1920" height="450" style={{overflow:'visible'}} aria-label={`${age} ans`}>
  <defs>
   <linearGradient id="age-face" x1="0" y1="0" x2=".9" y2="1">
    <stop stopColor={color('#e9ada4')}/><stop offset=".3" stopColor={color('#d4938c')}/>
    <stop offset=".58" stopColor={color('#e3a198')}/><stop offset="1" stopColor={color('#c77e7a')}/>
   </linearGradient>
   <linearGradient id="age-bevel" x1="0" y1="0" x2=".35" y2="1">
    <stop stopColor={color('#ffe0ca')}/><stop offset=".45" stopColor={color('#e9b6a7')}/><stop offset="1" stopColor={color('#a76a61')}/>
   </linearGradient>
   <pattern id="age-glitter" width="64" height="64" patternUnits="userSpaceOnUse">
    {Array.from({length:650},(_,i)=>{
     const x=grain(i,73)*64,y=grain(i,437)*64;
     return <circle key={i} cx={x} cy={y} r={i%23===0?.85:.18+grain(i,178)*.4}
      fill={[color('#fff5e6'),color('#bc7770'),color('#ffe4d2'),color('#f8cbb8'),color('#ca8b82')][i%5]} opacity={.25+grain(i,961)*.6}/>;
    })}
   </pattern>
   <filter id="age-shadow" x="-20%" y="-20%" width="140%" height="150%">
    <feDropShadow dx="4" dy="7" stdDeviation="3" floodColor={color('#694335')} floodOpacity=".28"/>
   </filter>
  </defs>
  <g filter="url(#age-shadow)">
   {[5,4,3,2,1].map(depth=><text key={depth} {...glyph} transform={`translate(${depth*.65} ${depth})`} fill={color('#b77c72')} stroke={color('#b77c72')} strokeWidth=".8">{age}</text>)}
   <text {...glyph} fill="url(#age-face)" stroke="url(#age-bevel)" strokeWidth="2.2" paintOrder="stroke fill">{age}</text>
   <text {...glyph} fill="url(#age-glitter)">{age}</text>
  </g>
  <YearsLabel x={960+width/2+25}/>
 </svg>;
});
