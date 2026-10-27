import {useEffect,useState} from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig,useDelayRender} from 'remotion';
import type {BirthdayInput} from '../shared/config';
import {weddingNames,formatWeddingDate} from '../shared/wedding';
import {mixColors} from '../shared/color';
import {HeldForeground,useClientRendering} from './ClientRendering';
import {Fonts} from './Fonts';
import {TypingText} from './TypingText';
import {HandwrittenText} from './HandwrittenText';
import {WEDDING_WRITING} from './handwriting';
import {cycle,reveal} from './timing';
import {useRenderLayer} from './RenderLayer';
import {fadeUp} from './textMotion';
import {VowsPaletteProvider,useVowsPalette} from './VowsPalette';
import {useLightweightPreview} from './PreviewPerformance';
import {WaxSeal} from './VowsSeal';
import {Foliage} from './VowsFoliage';

const TIP={x:960,y:872};
const SEAL={x:960,y:852,radius:126,start:4.6,length:1.1};
const LAYOUT={
 plain:{message:0,first:150,second:318,date:592},
 message:{message:84,first:168,second:334,date:606},
};
const f=(value:number)=>value.toFixed(1);

function random(seed:number){let s=seed;return ()=>{s=(s*16807)%2147483647;return (s-1)/2147483646;};}

function leaf(x:number,y:number,angle:number,length:number,width:number){
 const c=Math.cos(angle),s=Math.sin(angle),p=(u:number,v:number)=>`${f(x+u*c-v*s)} ${f(y+u*s+v*c)}`;
 return `M${p(0,0)} C${p(length*.2,-width)} ${p(length*.7,-width*.9)} ${p(length,0)} C${p(length*.7,width*.8)} ${p(length*.2,width)} ${p(0,0)}Z`;
}

function branch(seed:number,length:number,count:number,size:number){
 const next=random(seed),bend=(next()-.5)*length*.5,ctrl=[length/2,bend];
 const at=(t:number)=>{const u=1-t;return {x:2*u*t*ctrl[0]+t*t*length,y:2*u*t*ctrl[1],angle:Math.atan2(2*u*ctrl[1]-2*t*ctrl[1],2*u*ctrl[0]+2*t*(length-ctrl[0]))};};
 let leaves='',stem=`M0 0 Q${f(ctrl[0])} ${f(ctrl[1])} ${f(length)} 0`;
 const add=(x:number,y:number,angle:number,length:number,width:number)=>{
  const bx=x+Math.cos(angle)*length*.12,by=y+Math.sin(angle)*length*.12;
  stem+=` M${f(x)} ${f(y)} L${f(bx)} ${f(by)}`;
  leaves+=leaf(bx,by,angle,length,width);
 };
 for(let i=0;i<count;i++){
  const t=.12+i/count*.82,p=at(t),side=i%2?1:-1,scale=size*(1-.3*t)*(.85+next()*.3);
  add(p.x,p.y,p.angle+side*(.6+next()*.35),scale*1.9,scale*.5);
 }
 const tip=at(1);
 add(tip.x,tip.y,tip.angle,size*1.4,size*.4);
 return {stem,leaves};
}

const SHADOW_BRANCHES=[
 {x:2080,y:-120,angle:150,scale:1.9,sway:2,offset:0,branches:[[11,560,8,58,0],[23,420,6,52,-26],[37,380,6,48,24]]},
 {x:-160,y:1220,angle:-38,scale:1.5,sway:1.6,offset:2.1,branches:[[53,520,7,56,0],[61,380,6,50,28]]},
].map(group=>({...group,branches:group.branches.map(([seed,length,count,size,rotate])=>({...branch(seed,length,count,size),rotate}))}));

function LeafShadows({phase,lightweight}:{phase:number;lightweight:boolean}){
 const palette=useVowsPalette();
 return <g fill={palette.shadow} opacity={lightweight?.12:.2} filter={lightweight?undefined:'url(#vows-leaf-blur)'}>
  {SHADOW_BRANCHES.map((group,i)=>{
   const sway=Math.sin(phase+group.offset)*group.sway+Math.sin(phase*2+group.offset)*group.sway*.35;
   return <g key={i} transform={`translate(${group.x} ${group.y}) rotate(${group.angle+sway}) scale(${group.scale})`}>
    {group.branches.map((b,j)=><g key={j} transform={`rotate(${b.rotate+sway*(j+1)*.35})`}>
     <path d={b.stem} fill="none" stroke={palette.shadow} strokeWidth={7} strokeLinecap="round"/>
     <path d={b.leaves}/>
    </g>)}
   </g>;
  })}
 </g>;
}

function Envelope({phase}:{phase:number}){
 const palette=useVowsPalette(),lightweight=useLightweightPreview(),clientRendering=useClientRendering();
 const flap=`M-40 -40 H1960 V500 L${TIP.x} ${TIP.y} L-40 562 Z`;
 const edge=`M-40 562 L${TIP.x} ${TIP.y} L1960 500`;
 const pocket=`M380 1100 L${TIP.x} ${TIP.y+18} L1480 1100`;
 const shade=mixColors(palette.fold,palette.text,.035),twine=palette.twine,twineDark=mixColors(twine,palette.text,.35);
 const grain=random(7),specks=Array.from({length:90},()=>[grain()*240,grain()*240,.4+grain()*.9,grain()<.5]);
 return <svg data-client-raster={clientRendering?'vows':undefined} viewBox="0 0 1920 1080" width="100%" height="100%" style={{position:'absolute',inset:0}} aria-hidden="true">
  <defs>
   <linearGradient id="vows-body" x1="0" y1="0" x2="0" y2="1"><stop stopColor={shade}/><stop offset="1" stopColor={palette.fold}/></linearGradient>
   <linearGradient id="vows-pocket" x1="0" y1="0" x2="0" y2="1"><stop stopColor={mixColors(palette.fold,palette.paper,.55)}/><stop offset="1" stopColor={palette.paper}/></linearGradient>
   <linearGradient id="vows-flap" x1="0" y1="0" x2="0" y2="1"><stop stopColor={palette.paper}/><stop offset="1" stopColor={mixColors(palette.paper,'#ffffff',.35)}/></linearGradient>
   <radialGradient id="vows-sun" cx="78%" cy="8%" r="80%"><stop stopColor="#fff8e8" stopOpacity=".5"/><stop offset=".6" stopColor="#fff8e8" stopOpacity="0"/></radialGradient>
   <radialGradient id="vows-vignette" cx="50%" cy="45%" r="75%"><stop offset=".6" stopColor="#000" stopOpacity="0"/><stop offset="1" stopColor="#000" stopOpacity=".12"/></radialGradient>
   <pattern id="vows-grain" width="240" height="240" patternUnits="userSpaceOnUse">{specks.map(([x,y,r,dark],i)=><circle key={i} cx={x as number} cy={y as number} r={r as number} fill={dark?palette.text:'#fff'} opacity={dark?.07:.35}/>)}</pattern>
   <filter id="vows-leaf-blur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5"/></filter>
  </defs>
  <rect width="1920" height="1080" fill="url(#vows-body)"/>
  <path d={`M380 1100 L${TIP.x} ${TIP.y+18} L1480 1100 Z`} fill="url(#vows-pocket)"/>
  {[10,6,3].map((w,i)=><path key={i} d={pocket} fill="none" stroke={palette.text} strokeOpacity={.03+i*.025} strokeWidth={w} transform="translate(0 -3)"/>)}
  <path d={pocket} fill="none" stroke="#fff" strokeOpacity=".6" strokeWidth={1.4} transform="translate(0 1.5)"/>
  {[38,33,28,24,20,16.5,13,10,7.5,5,3,1.5].map((dy,i)=><path key={i} d={flap} fill={palette.text} opacity={.008+i*.0025} transform={`translate(${dy*.15} ${dy*.55})`}/>)}
  <path d={flap} fill="url(#vows-flap)"/>
  <path d={edge} fill="none" stroke="#fff" strokeOpacity=".75" strokeWidth={2}/>
  <path d={edge} fill="none" stroke={palette.text} strokeOpacity=".1" strokeWidth={1.2} transform="translate(0 2)"/>
  <rect width="1920" height="1080" fill="url(#vows-grain)"/>
  <g fill="none" strokeLinecap="round">
   {[[-14,-26,0],[14,30,1.9]].map(([x,lean,offset],i)=>{
    const swing=Math.sin(phase+offset)*16+Math.sin(phase*2+offset*1.7)*5,start=TIP.x+x;
    const d=`M${start} ${TIP.y} C${f(start+lean*.15)} ${TIP.y+70} ${f(start+lean*.6+swing*.45)} ${TIP.y+150} ${f(start+lean+swing)} 1110`;
    return <g key={i}>
     <path d={d} stroke={palette.text} strokeOpacity=".12" strokeWidth={10} transform="translate(7 6)"/>
     <path d={d} stroke={twine} strokeWidth={8}/>
     <path d={d} stroke={twineDark} strokeWidth={8} strokeDasharray="2.5 5" strokeDashoffset={f(swing*.3)} strokeOpacity=".7"/>
     <path d={d} stroke="#fff" strokeWidth={2} strokeOpacity=".25" transform="translate(-2 -1)"/>
    </g>;
   })}
  </g>
  <LeafShadows phase={phase} lightweight={lightweight}/>
  <Foliage phase={phase} lightweight={lightweight}/>
  <rect width="1920" height="1080" fill="url(#vows-sun)"/>
  <rect width="1920" height="1080" fill="url(#vows-vignette)"/>
 </svg>;
}

export function Vows(props:BirthdayInput){
 return <VowsPaletteProvider palette={props.vowsPalette}><VowsScene {...props}/></VowsPaletteProvider>;
}

function VowsScene(props:BirthdayInput){
 const {delayRender,continueRender}=useDelayRender();
 const layer=useRenderLayer(),palette=useVowsPalette();
 const frame=useCurrentFrame(),{durationInFrames:total,fps}=useVideoConfig();
 const swayCycles=Math.max(1,Math.round(total/fps/6)),phase=cycle(frame,total)*swayCycles;
 const [handle]=useState(()=>delayRender('Chargement des polices Vœux'));
 useEffect(()=>{Promise.all([document.fonts.load('170px GardenNames'),document.fonts.load('260px Celebration'),document.fonts.load('40px Invitation')]).then(()=>continueRender(handle)).catch(()=>continueRender(handle));},[handle]);
 const names=weddingNames(props).map(name=>name.trim()||'Prénom');
 const appear=(start:number)=>fadeUp(frame,total,start,2.4,2.8);
 const message=props.weddingMessage.trim(),layout=message?LAYOUT.message:LAYOUT.plain;
 return <AbsoluteFill style={{background:layer==='foreground'?'transparent':palette.paper,color:palette.text,overflow:'hidden'}}>
  <Fonts/>
  {layer!=='foreground'&&<Envelope phase={phase}/>}
  {layer!=='background'&&<HeldForeground>
   {message&&<div style={{position:'absolute',left:360,right:360,top:layout.message,textAlign:'center',color:palette.muted,...appear(0)}}>
    <TypingText text={message} fontSize={42} fontFamily="Invitation, Georgia, serif" singleLine maxWidth={1100} frame={frame} total={total} start={0} length={1.1}/>
   </div>}
   <div style={{position:'absolute',left:200,right:200,top:layout.first,display:'flex',justifyContent:'center',alignItems:'flex-start'}}>
    <HandwrittenText text={names[0]} fill={palette.text} fontSize={170} maxWidth={820} frame={frame} total={total} {...WEDDING_WRITING.firstName}/>
    <div style={{marginLeft:-80,marginTop:-58}}>
     <HandwrittenText text="&" fontFamily="Celebration" fill={palette.accent} fontSize={260} maxWidth={320} frame={frame} total={total} {...WEDDING_WRITING.ampersand}/>
    </div>
   </div>
   <div style={{position:'absolute',left:200,right:200,top:layout.second,display:'flex',justifyContent:'center',paddingLeft:110}}>
    <HandwrittenText text={names[1]} fill={palette.text} fontSize={170} maxWidth={820} frame={frame} total={total} {...WEDDING_WRITING.secondName}/>
   </div>
   <div style={{position:'absolute',left:400,right:400,top:layout.date,textAlign:'center',color:palette.text,...appear(WEDDING_WRITING.date.start)}}>
    <TypingText text={formatWeddingDate(props.weddingDate).toLocaleUpperCase('fr-FR')} fontSize={38} fontFamily="Invitation, Georgia, serif" letterSpacing={10} singleLine maxWidth={1000} frame={frame} total={total} start={WEDDING_WRITING.date.start} length={1}/>
   </div>
   <svg viewBox="0 0 1920 1080" width="1920" height="1080" style={{position:'absolute',inset:0,overflow:'visible'}} aria-hidden="true">
    <WaxSeal x={SEAL.x} y={SEAL.y} radius={SEAL.radius} progress={reveal(frame,total,SEAL.start,SEAL.length)}/>
   </svg>
  </HeldForeground>}
 </AbsoluteFill>;
}
