import {gardenPalette} from '../shared/garden';
import {GardenPalette} from './GardenPalette';
import {useEffect,useState} from 'react';
import {AbsoluteFill,Loop,OffthreadVideo,staticFile,useCurrentFrame,useVideoConfig,delayRender,continueRender} from 'remotion';
import type {BirthdayInput} from '../shared/config';
import {weddingNames,formatWeddingDate} from '../shared/wedding';
import {Fonts} from './Fonts';
import {TypingText} from './TypingText';
import {WeddingFoliage} from './WeddingFoliage';
import {cycle,reveal,smooth} from './timing';
export function Wedding(props:BirthdayInput){
 const frame=useCurrentFrame(),{durationInFrames:total}=useVideoConfig(),phase=cycle(frame,total);
 const [handle]=useState(()=>delayRender('Chargement des polices du mariage'));
 useEffect(()=>{document.fonts.load('230px Celebration').then(()=>continueRender(handle)).catch(()=>continueRender(handle));},[handle]);
 const names=weddingNames(props).map(name=>name.trim()||'Prénom'),time=Math.min(frame,total-1-frame)/30;
 const palette=gardenPalette(props.gardenPalette);
 const arrival=smooth((time-.5)/3.5);
 const appear=(start:number)=>({opacity:reveal(frame,total,start,2.8),transform:`translate3d(0,${(1-reveal(frame,total,start,3.2))*12}px,0)`});
 return <GardenPalette palette={props.gardenPalette}><AbsoluteFill style={{background:palette.background,color:palette.text,overflow:'hidden',isolation:'isolate'}}>
  <Fonts/><WeddingFoliage phase={phase*Math.max(1,Math.round(total/30/7.5))} time={time}/>
  <svg width="0" height="0" aria-hidden="true" style={{position:'absolute'}}><defs>
   <filter id="wedding-bird-contrast" colorInterpolationFilters="sRGB">
    <feComponentTransfer>
     <feFuncR type="linear" slope="1.9" intercept="-.88"/>
     <feFuncG type="linear" slope="1.9" intercept="-.88"/>
     <feFuncB type="linear" slope="1.9" intercept="-.88"/>
    </feComponentTransfer>
   </filter>
  </defs></svg>
  <div style={{position:'absolute',left:1305,top:5,width:590,height:590,opacity:reveal(frame,total,.5,2.4),mixBlendMode:'multiply',maskImage:'linear-gradient(90deg,transparent,#000 10%,#000 90%,transparent),linear-gradient(0deg,transparent,#000 10%,#000 90%,transparent)',maskComposite:'intersect',transform:`translate3d(${(1-arrival)*650+Math.sin(phase)*7}px,${Math.cos(phase)*6}px,0) rotate(${Math.sin(phase)*1.2}deg)`}}>
   <Loop durationInFrames={196} layout="none"><OffthreadVideo src={staticFile('media/wedding-bird-loop.mp4')} muted style={{width:'100%',height:'100%',objectFit:'contain',filter:'url(#wedding-bird-contrast)'}}/></Loop>
  </div>
  {props.weddingMessage&&<div style={{position:'absolute',left:330,right:330,top:205,textAlign:'center',color:palette.muted,...appear(0)}}>
   <TypingText text={props.weddingMessage} fontSize={82} singleLine maxWidth={1260} frame={frame} total={total} start={0} length={1.2}/>
  </div>}
  <div style={{position:'absolute',left:270,right:270,top:props.weddingMessage?310:270,textAlign:'center',...appear(.7)}}>
   <TypingText text={`${names[0]} &`} fontSize={230} singleLine maxWidth={1280} frame={frame} total={total} start={.7} length={1.4}/>
  </div>
  <div style={{position:'absolute',left:270,right:270,top:props.weddingMessage?505:470,textAlign:'center',...appear(2.6)}}>
   <TypingText text={names[1]} fontSize={230} singleLine maxWidth={1280} frame={frame} total={total} start={2.6} length={1.4}/>
  </div>
  <div style={{position:'absolute',left:350,right:350,top:795,textAlign:'center',color:palette.secondary,...appear(5)}}>
   <TypingText text={formatWeddingDate(props.weddingDate)} fontSize={78} singleLine maxWidth={1220} frame={frame} total={total} start={5} length={1}/>
  </div>
 </AbsoluteFill></GardenPalette>;
}
