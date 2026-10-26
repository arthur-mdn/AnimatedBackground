import {useEffect,useState,type CSSProperties} from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig,delayRender,continueRender} from 'remotion';
import type {BirthdayInput} from '../shared/config';
import {APPEARANCE,reveal} from './timing';
import {Fonts} from './Fonts';
import {RoseInk} from './RoseInk';
import {TypingText} from './TypingText';
import {GlitterAge} from './GlitterAge';
import {Nocturne} from './Nocturne';
import {HeartOrnament} from './HeartOrnament';
const ink='#CF7E7F',gold='#c19a5b';
export function Birthday(props:BirthdayInput){return props.templateId==='bleu-minuit'?<Nocturne {...props}/>:<RoseBirthday {...props}/>;}
function RoseBirthday(props:BirthdayInput){
 const frame=useCurrentFrame(),{durationInFrames:total}=useVideoConfig();
 const [handle]=useState(()=>delayRender('Chargement des polices locales'));
 useEffect(()=>{Promise.all([document.fonts.load('210px Celebration'),document.fonts.load('700 370px Portrait')]).then(()=>continueRender(handle)).catch(()=>continueRender(handle));},[handle]);
 const style=(start:number,length:number):CSSProperties=>{
  const p=reveal(frame,total,start,length);
  const t=Math.min(1,Math.max(0,(Math.min(frame,total-1-frame)/30-start)/length));
  const movement=t*t*t*(10+t*(-15+6*t));
  return {opacity:p,transform:`translate3d(0,${(1-movement)*14}px,0)`,willChange:'transform, opacity',backfaceVisibility:'hidden'};
 };
 const nameSize=Math.min(230,2600/Math.max(10,Array.from(props.firstName).length));
 const line1=props.messageLine1.trim(),line2=props.messageLine2.trim();
 return <AbsoluteFill style={{background:'#fff1e9',color:ink,fontFamily:'Portrait, Georgia, serif',overflow:'hidden'}}>
 <Fonts/>
 <AbsoluteFill style={{background:'radial-gradient(ellipse at 50% 45%, #fff5ed 0%, #fae7df 100%)'}}/>
 <RoseInk showGoldNuggets={props.showGoldNuggets}/>
 <div style={{position:'absolute',inset:36,border:`2px solid ${gold}`,opacity:.85}}/>
 {line1&&<div style={{position:'absolute',top:line2?131:205,left:100,right:100,textAlign:'center',color:'#302c29',...style(APPEARANCE.line1.start,APPEARANCE.line1.fade)}}>
 <TypingText text={line1.toLocaleUpperCase('fr-FR')} fontSize={76} fontFamily="Arial, Helvetica, sans-serif" fontWeight={300} letterSpacing={15} singleLine maxWidth={1500} frame={frame} total={total} start={APPEARANCE.line1.start} length={APPEARANCE.line1.writing}/>
 </div>}
 {line2&&<div style={{position:'absolute',top:line1?175:151,left:100,right:100,textAlign:'center',...style(APPEARANCE.line2.start,APPEARANCE.line2.fade)}}>
 <TypingText text={line2} fontSize={210} singleLine maxWidth={1500} frame={frame} total={total} start={APPEARANCE.line2.start} length={APPEARANCE.line2.writing}/>
 </div>}
 <div style={{position:'absolute',top:315,left:0,right:0,...style(APPEARANCE.age.start,APPEARANCE.age.fade)}}><GlitterAge age={props.age}/></div>
 <div style={{position:'absolute',top:730,left:0,right:0,textAlign:'center',...style(APPEARANCE.heart.start,APPEARANCE.heart.fade)}}><HeartOrnament/></div>
 <div style={{position:'absolute',top:775,left:100,right:100,textAlign:'center',color:ink,WebkitTextStroke:'0.65px currentColor',paintOrder:'stroke fill',...style(APPEARANCE.firstName.start,APPEARANCE.firstName.fade)}}>
 <TypingText text={props.firstName} fontSize={nameSize} maxWidth={1500} frame={frame} total={total} start={APPEARANCE.firstName.start} length={APPEARANCE.firstName.writing}/>
 </div>
 </AbsoluteFill>;
}
