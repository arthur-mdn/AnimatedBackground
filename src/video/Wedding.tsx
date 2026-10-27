import {gardenPalette} from '../shared/garden';
import {ClientBird} from './ClientBird';
import {GardenPalette} from './GardenPalette';
import {useEffect,useState} from 'react';
import {AbsoluteFill,Loop,OffthreadVideo,staticFile,useCurrentFrame,useVideoConfig,useDelayRender} from 'remotion';
import type {BirthdayInput} from '../shared/config';
import {weddingNames,formatWeddingDate} from '../shared/wedding';
import {HeldForeground,useClientRendering} from './ClientRendering';
import {Fonts} from './Fonts';
import {TypingText} from './TypingText';
import {HandwrittenText} from './HandwrittenText';
import {WEDDING_WRITING} from './handwriting';
import {WeddingFoliage} from './WeddingFoliage';
import {cycle,reveal,smooth} from './timing';
import {useRenderLayer} from './RenderLayer';
import {fadeUp} from './textMotion';
import {useLightweightPreview} from './PreviewPerformance';
export function Wedding(props:BirthdayInput){
 const {delayRender,continueRender}=useDelayRender();
 const layer=useRenderLayer(),lightweight=useLightweightPreview();
 const frame=useCurrentFrame(),{durationInFrames:total}=useVideoConfig(),phase=cycle(frame,total);
 const [handle]=useState(()=>delayRender('Chargement des polices du mariage'));
 useEffect(()=>{Promise.all([document.fonts.load('230px GardenNames'),document.fonts.load('82px Celebration')]).then(()=>continueRender(handle)).catch(()=>continueRender(handle));},[handle]);
 const names=weddingNames(props).map(name=>name.trim()||'Prénom'),time=Math.min(frame,total-1-frame)/30;
 const clientRendering=useClientRendering();
 const palette=gardenPalette(props.gardenPalette);
 const arrival=smooth((time-.5)/3.5);
 const appear=(start:number)=>fadeUp(frame,total,start,2.8,3.2);
 return <GardenPalette palette={props.gardenPalette}><AbsoluteFill style={{background:layer==='foreground'?'transparent':palette.background,color:palette.text,overflow:'hidden',isolation:'isolate'}}>
  <Fonts/>{layer!=='foreground'&&<><WeddingFoliage phase={phase*Math.max(1,Math.round(total/30/7.5))} time={time}/>
  {clientRendering?<ClientBird arrival={arrival} phase={phase} opacity={reveal(frame,total,.5,2.4)*.88}/>:<><svg width="0" height="0" aria-hidden="true" style={{position:'absolute'}}><defs>
   <filter id="wedding-bird-contrast" colorInterpolationFilters="sRGB">
    {/* Keep the near-white backdrop neutral, then lift shadows and mute the bird to match the pastel foliage. */}
    <feComponentTransfer>
     <feFuncR type="gamma" amplitude="1.04" exponent="3" offset="0"/>
     <feFuncG type="gamma" amplitude="1.04" exponent="3" offset="0"/>
     <feFuncB type="gamma" amplitude="1.04" exponent="3" offset="0"/>
    </feComponentTransfer>
    <feColorMatrix type="saturate" values=".35"/>
    <feComponentTransfer>
     <feFuncR type="linear" slope=".58" intercept=".42"/>
     <feFuncG type="linear" slope=".58" intercept=".42"/>
     <feFuncB type="linear" slope=".58" intercept=".42"/>
    </feComponentTransfer>
   </filter>
  </defs></svg>
  <div style={{position:'absolute',left:1305,top:5,width:590,height:590,opacity:reveal(frame,total,.5,2.4)*.88,mixBlendMode:'multiply',maskImage:'linear-gradient(90deg,transparent,#000 10%,#000 90%,transparent),linear-gradient(0deg,transparent,#000 10%,#000 90%,transparent)',maskComposite:'intersect',transform:`translate3d(${(1-arrival)*650+Math.sin(phase)*7}px,${Math.cos(phase)*6}px,0) rotate(${Math.sin(phase)*1.2}deg)`}}>
   <Loop durationInFrames={196} layout="none"><OffthreadVideo src={staticFile(lightweight?'media/wedding-bird-preview.mp4':'media/wedding-bird-loop.mp4')} muted style={{width:'100%',height:'100%',objectFit:'contain',filter:lightweight?undefined:'url(#wedding-bird-contrast)'}}/></Loop>
  </div></>}
  </>}{layer!=='background'&&<HeldForeground>{props.weddingMessage&&<div style={{position:'absolute',left:330,right:330,top:205,textAlign:'center',color:palette.muted,...appear(0)}}>
   <TypingText text={props.weddingMessage} fontSize={82} singleLine maxWidth={1260} frame={frame} total={total} start={0} length={1.2}/>
  </div>}
  <div style={{position:'absolute',left:270,right:270,top:props.weddingMessage?310:270,textAlign:'center'}}>
   <HandwrittenText text={names[0]} trailing={{text:' &',...WEDDING_WRITING.ampersand}} fill={palette.text} fontSize={230} maxWidth={1280} frame={frame} total={total} {...WEDDING_WRITING.firstName}/>
  </div>
  <div style={{position:'absolute',left:270,right:270,top:props.weddingMessage?505:470,textAlign:'center'}}>
   <HandwrittenText text={names[1]} fill={palette.text} fontSize={230} maxWidth={1280} frame={frame} total={total} {...WEDDING_WRITING.secondName}/>
  </div>
  <div style={{position:'absolute',left:350,right:350,top:795,textAlign:'center',color:palette.secondary,...appear(WEDDING_WRITING.date.start)}}>
   <TypingText text={formatWeddingDate(props.weddingDate)} fontSize={78} singleLine maxWidth={1220} frame={frame} total={total} start={WEDDING_WRITING.date.start} length={1}/>
  </div>
 </HeldForeground>}</AbsoluteFill></GardenPalette>;
}
