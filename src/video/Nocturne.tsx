import {cssRGB} from '../shared/color';
import {NocturnePalette,useNocturneColor,useNocturnePalette,useNocturneSettings} from './NocturnePalette';
import {useEffect,useState} from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig,delayRender,continueRender} from 'remotion';
import type {BirthdayInput} from '../shared/config';
import {Fonts} from './Fonts';
import {TypingText} from './TypingText';
import {cycle,reveal} from './timing';
import {fadeUp} from './textMotion';

const seed=(i:number)=>{const n=Math.sin(i*127.1+311.7)*43758.5453;return n-Math.floor(n);};
export function NocturneBackdrop({phase=0,cover=false}:{phase?:number;cover?:boolean}){
 const color=useNocturneColor(),paletteId=useNocturnePalette();
 const palette=useNocturneSettings();
 const [red,green,blue]=paletteId==='bleu-nuit'?[.42,.52,.72]:cssRGB(color('#6b85b8'));
 return <svg viewBox="0 0 1920 1080" preserveAspectRatio={cover?'xMidYMid slice':'xMidYMid meet'} width="100%" height="100%" style={{position:'absolute',inset:0}} aria-hidden="true">
 <defs>
 <radialGradient id="night-sky"><stop stopColor={color('#182d69')}/><stop offset=".55" stopColor={color('#0b153b')}/><stop offset="1" stopColor={color('#030717')}/></radialGradient>
 <linearGradient id="night-beam" x1="0" y1="0" x2="1" y2="0"><stop stopColor={color('#81b8ff')} stopOpacity="0"/><stop offset=".2" stopColor={color('#81b8ff')} stopOpacity=".08"/><stop offset=".5" stopColor={color('#a0cfff')} stopOpacity=".36"/><stop offset=".8" stopColor={color('#81b8ff')} stopOpacity=".08"/><stop offset="1" stopColor={color('#81b8ff')} stopOpacity="0"/></linearGradient>
 <linearGradient id="night-beam-length" x1="0" y1="0" x2="0" y2="1"><stop stopColor="white" stopOpacity="0"/><stop offset=".3" stopColor="white" stopOpacity=".35"/><stop offset=".8" stopColor="white" stopOpacity=".8"/><stop offset="1" stopColor="white" stopOpacity=".2"/></linearGradient>
 <mask id="night-beam-mask" maskUnits="userSpaceOnUse" x="-300" y="-150" width="2520" height="1450"><rect x="-300" y="-150" width="2520" height="1450" fill="url(#night-beam-length)"/></mask>
 <filter id="night-beam-soft" x="-50%" y="-30%" width="200%" height="160%"><feGaussianBlur stdDeviation="11"/></filter>
 <linearGradient id="night-ridge-far" x1="0" y1="0" x2="0" y2="1"><stop stopColor={color('#101b38')}/><stop offset="1" stopColor={color('#070e21')}/></linearGradient>
 <linearGradient id="night-ridge-mid" x1="0" y1="0" x2="0" y2="1"><stop stopColor={color('#080e20')}/><stop offset="1" stopColor={color('#030713')}/></linearGradient>
 <radialGradient id="night-horizon"><stop stopColor={palette.horizon} stopOpacity=".32"/><stop offset=".5" stopColor={palette.horizon} stopOpacity=".12"/><stop offset="1" stopColor={palette.horizon} stopOpacity="0"/></radialGradient>
 <radialGradient id="night-halo"><stop stopColor={color('#7396f6')} stopOpacity=".23"/><stop offset="1" stopColor={color('#213b84')} stopOpacity="0"/></radialGradient>
 <radialGradient id="night-cloud-feather"><stop stopColor={color('#9baed4')} stopOpacity=".55"/><stop offset=".45" stopColor={color('#7b91bb')} stopOpacity=".32"/><stop offset="1" stopColor={color('#526b9b')} stopOpacity="0"/></radialGradient>
 <filter id="night-cloud-texture" x="-15%" y="-50%" width="130%" height="200%" colorInterpolationFilters="sRGB">
 <feTurbulence type="fractalNoise" baseFrequency=".0035 .009" numOctaves="4" seed="17" result="cloud-noise"/>
 <feColorMatrix in="cloud-noise" type="matrix" values={`0 0 0 0 ${red}  0 0 0 0 ${green}  0 0 0 0 ${blue}  2.6 0 0 0 -.92`} result="cloud-density"/>
 <feGaussianBlur in="cloud-density" stdDeviation="4" result="cloud-soft"/>
 <feComposite in="cloud-soft" in2="SourceGraphic" operator="in"/>
 </filter>
 <filter id="night-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="5"/></filter>
 <g id="night-note"><ellipse cx="0" cy="0" rx="12" ry="8" transform="rotate(-22)"/><ellipse cx="34" cy="-8" rx="12" ry="8" transform="rotate(-22 34 -8)"/><path d="M7-1v-52l34-8v52" fill="none" stroke="currentColor" strokeWidth="6" strokeLinejoin="round"/><path d="m7-53 34-8v10L7-43Z"/></g>
 </defs>
 <rect width="1920" height="1080" fill="url(#night-sky)"/>
 {paletteId!=='bleu-nuit'&&<ellipse cx="960" cy="880" rx="1400" ry="440" fill="url(#night-horizon)"/>}
 <ellipse cx="960" cy="790" rx="1100" ry="380" fill="url(#night-halo)"/>
 {Array.from({length:210},(_,i)=>{const x=seed(i+1)*1920,y=seed(i+401)*1020;const glow=.25+.35*(.5+.5*Math.sin(phase*(i%3+1)+seed(i+800)*Math.PI*2));return <circle key={i} cx={x+Math.sin(phase+ i)*5} cy={y+Math.cos(phase+i)*4} r={.7+seed(i+200)*1.6} fill={color('#c2d7ff')} opacity={glow}/>;})}
 {[330,650,1270,1610].map((x,i)=>{const angle=[-13,18,-17,14][i]+Math.sin(phase+i*1.8)*7;return <g key={x} transform={`rotate(${angle} ${x} 1120)`}>
 <g mask="url(#night-beam-mask)" filter="url(#night-beam-soft)"><path d={`M${x-12} 1150 ${x-285} -130 ${x+230} -130 ${x+12} 1150Z`} fill="url(#night-beam)" opacity=".75"/>
 <path d={`M${x-8} 1150 ${x-135} -130 ${x+65} -130 ${x+8} 1150Z`} fill="url(#night-beam)" opacity=".4"/></g>
 </g>;})}
 {[0,1].map(layer=><g key={layer} transform={`translate(${Math.sin(phase+layer*2)*40} ${Math.cos(phase+layer)*7})`} opacity={layer ? 0.65 : 0.8} filter="url(#night-cloud-texture)">
 {Array.from({length:9},(_,i)=><ellipse key={i} cx={-100+i*265+seed(i+1900+layer*20)*100} cy={760+layer*65+seed(i+2000+layer*20)*95} rx={190+seed(i+2100)*180} ry={65+seed(i+2200+layer*20)*75} fill="url(#night-cloud-feather)"/>)}
 </g>)}
 <g transform={`translate(${Math.sin(phase)*3} 0)`}>
 <path d="M-60 950C20 944 67 925 112 923C161 921 188 902 224 885C259 870 288 874 318 864C349 854 364 839 397 843C441 848 463 883 514 896C562 908 582 899 626 908C680 919 700 939 757 940C815 941 842 929 890 935C943 941 961 949 1010 943C1069 936 1098 915 1142 907C1178 900 1204 906 1234 893C1287 869 1305 841 1350 845C1392 849 1404 863 1439 859C1485 853 1509 870 1549 889C1597 911 1630 901 1675 909C1738 920 1782 942 1838 945C1907 949 1934 930 1980 937V1120H-60Z" fill="url(#night-ridge-far)"/>
 </g>
 <g transform={`translate(${Math.sin(phase+.4)*6} 0)`}>
 <path d="M-60 1008C48 992 102 956 174 952C231 949 270 966 324 963C376 960 405 944 452 950C511 957 529 977 596 980C683 984 711 965 776 970C843 976 876 998 941 1002C1013 1006 1057 985 1102 973C1151 960 1196 969 1233 958C1288 942 1308 921 1362 925C1410 929 1458 951 1511 950C1576 948 1609 931 1653 940C1708 952 1719 970 1778 978C1849 988 1919 981 1980 990V1120H-60Z" fill="url(#night-ridge-mid)"/>
 </g>
 <g transform={`translate(${Math.sin(phase+.8)*10} 0)`}>
 <path d="M-60 1064C75 1049 117 1024 205 1021C286 1018 324 1036 401 1031C478 1026 496 1007 567 1014C649 1022 701 1054 799 1056C906 1058 939 1039 1020 1042C1100 1045 1141 1033 1215 1029C1312 1024 1350 1046 1437 1040C1517 1034 1553 1009 1633 1014C1737 1021 1839 1060 1980 1049V1120H-60Z" fill={color('#020510')}/>
 </g>
 <path d="M257 42a48 48 0 1 0 46 63 42 42 0 0 1-46-63" fill={color('#8fbaff')} opacity=".25"/>
 {[1,3,4,5].map(i=>{const x=90+seed(i+50)*1740,y=210+seed(i+70)*600;return <g key={i} transform={`translate(${x+Math.sin(phase+i)*14} ${y+Math.cos(phase+i*.7)*18}) rotate(${Math.sin(phase+i)*9-12}) scale(${.48+seed(i+90)*.65})`} opacity={.14+seed(i+110)*.35} fill={color('#b9d8ff')} color={color('#b9d8ff')}><use href="#night-note"/></g>;})}
 {Array.from({length:36},(_,i)=>{const x=seed(i+950)*1920,y=620+seed(i+1200)*460;return <circle key={i} cx={x+Math.sin(phase+i)*12} cy={y+Math.cos(phase+i)*15} r={2+seed(i+990)*8} fill={color('#a9c7ff')} opacity={.025+seed(i+1300)*.07}/>;})}
 {Array.from({length:8},(_,i)=>{const x=100+seed(i+1400)*1720,y=100+seed(i+1500)*850,a=.15+.45*Math.pow(.5+.5*Math.sin(phase*2+i*2),6);return <g key={i} transform={`translate(${x} ${y})`} opacity={a} fill={color('#e0edff')}><path d="M0-12 2-2 12 0 2 2 0 12-2 2-12 0-2-2Z"/><circle r="8" opacity=".35" filter="url(#night-glow)"/></g>;})}
 </svg>;
}
export function Nocturne(props:BirthdayInput){return <NocturnePalette palette={props.nocturnePalette} customColor={props.nocturneColor}><NocturneScene {...props}/></NocturnePalette>;}
function NocturneScene(props:BirthdayInput){
 const color=useNocturneColor();
 const frame=useCurrentFrame(),{durationInFrames:total}=useVideoConfig(),phase=cycle(frame,total);
 const [fontHandle]=useState(()=>delayRender('Chargement de la typographie nocturne'));
 useEffect(()=>{Promise.all([document.fonts.load('790px Celebration'),document.fonts.load('700 150px NocturneDisplay')]).then(()=>continueRender(fontHandle)).catch(()=>continueRender(fontHandle));},[fontHandle]);
 const visible=(start:number)=>fadeUp(frame,total,start,2.3,2.7);
 const line1=props.messageLine1.trim(),line2=props.messageLine2.trim();
 return <AbsoluteFill style={{background:color('#030717'),color:color('#eef3ff'),overflow:'hidden',fontFamily:'Arial, Helvetica, sans-serif'}}>
 <Fonts/><NocturneBackdrop phase={phase*2}/>
 <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',opacity:reveal(frame,total,1.5,4)*.22,mixBlendMode:'screen',maskImage:'linear-gradient(transparent 12%,#000 36%,#000 64%,transparent 91%)',color:color('#91a5e8'),fontFamily:'Celebration, cursive',WebkitTextStroke:'18px currentColor',paintOrder:'stroke fill',whiteSpace:'nowrap',fontSize:props.age>99?650:790,lineHeight:1,transform:`translateY(25px) scale(${1+Math.sin(phase)*.008})`}}><span>{props.age}</span><span style={{fontSize:400,WebkitTextStroke:'12px currentColor',marginLeft:15,marginTop:155}}>ans</span></div>
 <div style={{position:'absolute',top:line2?285:365,left:120,right:120,textAlign:'center',textShadow:`0 1px 0 ${color('#b6c8e8')}, 0 2px 0 ${color('#8297bf')}, 0 3px 0 ${color('#536d9e')}, 0 5px 0 ${color('#263d69')}, 0 9px 12px ${color('#010615aa')}, 0 0 30px ${color('#6898ec44')}`,...visible(0)}}>{line1&&<TypingText text={line1} fontSize={134} fontFamily="NocturneDisplay, Arial, sans-serif" fontWeight={700} singleLine maxWidth={1600} frame={frame} total={total} start={0} length={.65}/>}</div>
 <div style={{position:'absolute',top:line1?405:340,left:120,right:120,textAlign:'center',textShadow:`0 1px 0 ${color('#b6c8e8')}, 0 2px 0 ${color('#8297bf')}, 0 3px 0 ${color('#536d9e')}, 0 5px 0 ${color('#263d69')}, 0 9px 12px ${color('#010615aa')}, 0 0 30px ${color('#6898ec44')}`,...visible(.8)}}>{line2&&<TypingText text={line2} fontSize={134} fontFamily="NocturneDisplay, Arial, sans-serif" fontWeight={700} singleLine maxWidth={1600} frame={frame} total={total} start={.8} length={.8}/>}</div>
 <div style={{position:'absolute',left:120,right:120,top:630,textAlign:'center',color:'#fff',textShadow:`0 1px 0 ${color('#c3d1ec')}, 0 2px 0 ${color('#91a6cc')}, 0 4px 0 ${color('#5671a1')}, 0 6px 0 ${color('#293e68')}, 0 10px 16px ${color('#010615bb')}, 0 0 32px ${color('#4e77d855')}`,...visible(2.4)}}><TypingText text={props.firstName} fontSize={158} fontFamily="NocturneDisplay, Arial, sans-serif" fontWeight={700} singleLine maxWidth={1560} frame={frame} total={total} start={2.4} length={1}/></div>
 <div style={{position:'absolute',width:160,height:1,left:880,top:850,background:`linear-gradient(90deg,transparent,${color('#9fb8f2')},transparent)`,...visible(4)}}/>
 </AbsoluteFill>;
}
