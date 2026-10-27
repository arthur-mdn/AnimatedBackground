import {Img,staticFile,useCurrentFrame} from 'remotion';

// Lossless transparent frames preserve the graded bird without CSS video filters,
// multiply blending or intersected masks, which the browser exporter cannot capture.
export function ClientBird({arrival,phase,opacity}:{arrival:number;phase:number;opacity:number}){
 const frame=useCurrentFrame()%196;
 return <div style={{position:'absolute',left:1305,top:5,width:590,height:590,opacity,transform:`translate3d(${(1-arrival)*650+Math.sin(phase)*7}px,${Math.cos(phase)*6}px,0) rotate(${Math.sin(phase)*1.2}deg)`}}>
  <Img src={staticFile(`media/bird-frames/${String(frame).padStart(3,'0')}.webp`)} style={{width:'100%',height:'100%'}}/>
 </div>;
}
