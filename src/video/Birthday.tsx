import {useEffect,useState,type CSSProperties} from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig,useDelayRender} from 'remotion';
import type {BirthdayInput} from '../shared/config';
import {APPEARANCE,reveal} from './timing';
import {fadeUp} from './textMotion';
import {useRenderLayer} from './RenderLayer';
import {HeldForeground,useClientRendering} from './ClientRendering';
import {Fonts} from './Fonts';
import {RoseInk} from './RoseInk';
import {HandwrittenText} from './HandwrittenText';
import {TypingText} from './TypingText';
import {GlitterAge} from './GlitterAge';
import {Nocturne} from './Nocturne';
import {Wedding} from './Wedding';
import {CelebrationOrnament} from './CelebrationOrnament';
import {WatercolorPalette,useWatercolorColor} from './WatercolorPalette';
export function Birthday(props:BirthdayInput){return props.templateId==='jardin-mariage'?<Wedding {...props}/>:props.templateId==='bleu-minuit'?<Nocturne {...props}/>:<WatercolorPalette base={props.watercolorColor}><RoseBirthday {...props}/></WatercolorPalette>;}
function RoseBirthday(props:BirthdayInput){
 const {delayRender,continueRender}=useDelayRender();
 const layer=useRenderLayer(),clientRendering=useClientRendering();
 const color=useWatercolorColor(),ink=color('#CF7E7F'),gold=color('#c19a5b');
 const frame=useCurrentFrame(),{durationInFrames:total}=useVideoConfig();
 const [handle]=useState(()=>delayRender('Chargement des polices locales'));
 useEffect(()=>{Promise.all([document.fonts.load('210px Celebration'),document.fonts.load('700 370px Portrait')]).then(()=>continueRender(handle)).catch(()=>continueRender(handle));},[handle]);
 const style=(start:number,length:number):CSSProperties=>fadeUp(frame,total,start,length,length,14);
 const nameSize=Math.min(230,2600/Math.max(10,Array.from(props.firstName).length));
 const line1=props.messageLine1.trim(),line2=props.messageLine2.trim();
 return <AbsoluteFill style={{background:layer==='foreground'?'transparent':color('#fff1e9'),color:ink,fontFamily:'Portrait, Georgia, serif',overflow:'hidden'}}>
 <Fonts/>
 {layer!=='foreground'&&<>{!clientRendering?<AbsoluteFill style={{background:`radial-gradient(ellipse at 50% 45%, ${color('#fff5ed')} 0%, ${color('#fae7df')} 100%)`}}/>:<svg width="1920" height="1080" style={{position:'absolute',inset:0}}><defs><radialGradient id="watercolor-paper" cx="50%" cy="45%" r="71%"><stop stopColor={color('#fff5ed')}/><stop offset="1" stopColor={color('#fae7df')}/></radialGradient></defs><rect width="1920" height="1080" fill="url(#watercolor-paper)"/></svg>}
 <RoseInk showGoldNuggets={props.showGoldNuggets}/>
 <div style={{position:'absolute',inset:36,border:`2px solid ${gold}`,opacity:.85}}/></>}
 {layer!=='background'&&<HeldForeground>{line1&&<div style={{position:'absolute',top:line2?131:205,left:100,right:100,textAlign:'center',color:color('#987C7E'),...style(APPEARANCE.line1.start,APPEARANCE.line1.fade)}}>
 <TypingText text={line1.toLocaleUpperCase('fr-FR')} fontSize={76} fontFamily="Arial, Helvetica, sans-serif" fontWeight={300} letterSpacing={15} singleLine maxWidth={1500} frame={frame} total={total} start={APPEARANCE.line1.start} length={APPEARANCE.line1.writing}/>
 </div>}
 {line2&&<div style={{position:'absolute',top:line1?175:151,left:100,right:100,textAlign:'center'}}>
 <HandwrittenText text={line2} fontFamily="Celebration" fill={ink} fontSize={210} maxWidth={1500} frame={frame} total={total} start={APPEARANCE.line2.start} length={APPEARANCE.line2.writing}/>
 </div>}
 <div style={{position:'absolute',top:props.ornament==='none'?343:315,left:0,right:0,...style(APPEARANCE.age.start,APPEARANCE.age.fade)}}><GlitterAge age={props.age}/></div>
 <div style={{position:'absolute',top:730,left:0,right:0,textAlign:'center',...style(APPEARANCE.heart.start,APPEARANCE.heart.fade)}}><CelebrationOrnament kind={props.ornament}/></div>
 <div style={{position:'absolute',top:775,left:100,right:100,textAlign:'center',color:ink}}>
 <HandwrittenText text={props.firstName} fontFamily="Celebration" fill={ink} textStrokeWidth={.65} fontSize={nameSize} maxWidth={1500} frame={frame} total={total} start={APPEARANCE.firstName.start} length={APPEARANCE.firstName.writing}/>
 </div>
 </HeldForeground>}</AbsoluteFill>;
}
