import {useVowsPalette} from './VowsPalette';

const f=(value:number)=>value.toFixed(1);
type Point=[number,number];
type Leaf={x:number;y:number;angle:number;length:number;width:number;tone:number;petiole:number};
type Stem={from:Point;ctrl:Point;to:Point;width:number};
type Bloom={x:number;y:number;r:number};
type Cluster={pivot:Point;sway:number;offset:number;stems:Stem[];leaves:Leaf[];blooms:Bloom[];twigs:Stem[]};

function random(seed:number){let s=seed;return ()=>{s=(s*16807)%2147483647;return (s-1)/2147483646;};}

function quad(t:number,{from,ctrl,to}:Stem){
 const u=1-t;
 return {x:u*u*from[0]+2*u*t*ctrl[0]+t*t*to[0],y:u*u*from[1]+2*u*t*ctrl[1]+t*t*to[1],angle:Math.atan2(2*u*(ctrl[1]-from[1])+2*t*(to[1]-ctrl[1]),2*u*(ctrl[0]-from[0])+2*t*(to[0]-ctrl[0]))};
}

function attached(x:number,y:number,angle:number,length:number,width:number,tone:number):Leaf{
 const petiole=Math.max(8,length*.09);
 return {x:x+Math.cos(angle)*petiole,y:y+Math.sin(angle)*petiole,angle,length,width,tone,petiole};
}

function eucalyptus(stem:Stem,count:number,size:number,seed:number):Leaf[]{
 const next=random(seed),leaves:Leaf[]=[];
 for(let i=0;i<count;i++){
  const t=.14+i/count*.8,p=quad(t,stem),side=i%2?1:-1,scale=size*(1-t*.3)*(.88+next()*.24);
  leaves.push(attached(p.x,p.y,p.angle+side*(.5+next()*.4),scale,scale*.3,next()));
 }
 const tip=quad(1,stem);
 leaves.push(attached(tip.x,tip.y,tip.angle+(next()-.5)*.2,size*.78,size*.22,next()));
 return leaves;
}

function gypsophila(origin:Point,targets:Point[],seed:number){
 const next=random(seed),twigs:Stem[]=[],blooms:Bloom[]=[];
 for(const [x,y] of targets){
  twigs.push({from:origin,ctrl:[(origin[0]+x)/2+(next()-.5)*40,(origin[1]+y)/2+(next()-.5)*40],to:[x,y],width:1.6});
  const count=6+Math.floor(next()*5);
  for(let i=0;i<count;i++){
   const a=next()*Math.PI*2,d=8+next()*30,bx=x+Math.cos(a)*d,by=y+Math.sin(a)*d;
   twigs.push({from:[x,y],ctrl:[(x+bx)/2,(y+by)/2],to:[bx,by],width:1});
   blooms.push({x:bx,y:by,r:7+next()*5});
  }
 }
 return {twigs,blooms};
}

function cluster(pivot:Point,sway:number,offset:number,branches:[Stem,number,number,number][],sprays:[Point,Point[],number][]):Cluster{
 const sprayParts=sprays.map(([origin,targets,seed])=>gypsophila(origin,targets,seed));
 return {pivot,sway,offset,stems:branches.map(b=>b[0]),leaves:branches.flatMap(([stem,count,size,seed])=>eucalyptus(stem,count,size,seed)),twigs:sprayParts.flatMap(p=>p.twigs),blooms:sprayParts.flatMap(p=>p.blooms)};
}

const CLUSTERS=[
 cluster([-40,40],1.4,0,[
  [{from:[-60,60],ctrl:[250,-10],to:[570,60],width:5.5},10,190,3],
  [{from:[-50,130],ctrl:[150,240],to:[180,520],width:5},8,175,7],
  [{from:[-40,20],ctrl:[120,70],to:[300,210],width:4},5,150,5],
 ],[[[-30,200],[[50,140],[110,200],[40,270],[150,290],[80,350],[20,410],[160,380],[100,440]],11]]),
 cluster([1980,1100],1.5,2.4,[
  [{from:[1990,970],ctrl:[1730,920],to:[1470,965],width:5.5},9,185,13],
  [{from:[1960,1110],ctrl:[1840,860],to:[1890,640],width:5},7,165,17],
  [{from:[1990,1060],ctrl:[1800,1020],to:[1660,1100],width:4},5,150,23],
 ],[[[1960,1060],[[1740,770],[1810,720],[1880,790],[1690,870],[1790,890],[1860,950],[1720,985],[1640,940]],19]]),
];

function leafPath(length:number,width:number){
 return `M0 0 C${f(length*.22)} ${f(-width*1.05)} ${f(length*.74)} ${f(-width*.72)} ${f(length)} ${f(width*.16)} C${f(length*.7)} ${f(width*.95)} ${f(length*.24)} ${f(width*.88)} 0 0Z`;
}
const stemPath=({from,ctrl,to}:Stem)=>`M${f(from[0])} ${f(from[1])} Q${f(ctrl[0])} ${f(ctrl[1])} ${f(to[0])} ${f(to[1])}`;

function LeafShape({leaf,shadow}:{leaf:Leaf;shadow:boolean}){
 const d=leafPath(leaf.length,leaf.width);
 return <g transform={`translate(${f(leaf.x)} ${f(leaf.y)}) rotate(${f(leaf.angle*180/Math.PI)})`}>
  <path d={`M${f(-leaf.petiole-1)} 0 L3 0`} fill="none" stroke={shadow?undefined:'#6d5f45'} strokeWidth={2.6} strokeLinecap="round"/>
  <path d={d} fill={shadow?undefined:`url(#vows-leaf-${leaf.tone>.5?'a':'b'})`}/>
  {!shadow&&<>
   <path d={`M4 0 Q${f(leaf.length*.55)} ${f(leaf.width*.02)} ${f(leaf.length*.96)} ${f(leaf.width*.15)}`} fill="none" stroke="#c9d1b4" strokeOpacity=".4" strokeWidth={1.4}/>
   <path d={d} fill="none" stroke="#fff" strokeOpacity=".12" strokeWidth={1}/>
  </>}
 </g>;
}

function Plants({phase,shadow}:{phase:number;shadow:boolean}){
 return <>
  {CLUSTERS.map((c,i)=><g key={i} transform={`rotate(${f(Math.sin(phase+c.offset)*c.sway)} ${c.pivot[0]} ${c.pivot[1]})`}>
   <g fill="none" stroke={shadow?undefined:'#b3ab92'} strokeLinecap="round">{c.twigs.map((t,j)=><path key={j} d={stemPath(t)} strokeWidth={t.width}/>)}</g>
   <g fill="none" stroke={shadow?undefined:'#6d5f45'} strokeLinecap="round">{c.stems.map((s,j)=><path key={j} d={stemPath(s)} strokeWidth={s.width}/>)}</g>
   {c.leaves.map((leaf,j)=><LeafShape key={j} leaf={leaf} shadow={shadow}/>)}
   {c.blooms.map((b,j)=><g key={j} fill={shadow?undefined:'url(#vows-bloom)'}>
    {[0,1.6,3.2,4.8].map(a=><circle key={a} cx={f(b.x+Math.cos(a+j)*b.r*.42)} cy={f(b.y+Math.sin(a+j)*b.r*.42)} r={f(b.r*.62)}/>)}
    <circle cx={f(b.x)} cy={f(b.y)} r={f(b.r*.5)}/>
   </g>)}
  </g>)}
 </>;
}

export function Foliage({phase,lightweight}:{phase:number;lightweight:boolean}){
 const palette=useVowsPalette();
 return <g>
  <defs>
   <linearGradient id="vows-leaf-a" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#7f8e63"/><stop offset=".5" stopColor="#5b6a45"/><stop offset="1" stopColor="#3f4b2f"/></linearGradient>
   <linearGradient id="vows-leaf-b" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#6c7b55"/><stop offset=".5" stopColor="#4d5c3b"/><stop offset="1" stopColor="#334027"/></linearGradient>
   <radialGradient id="vows-bloom" cx="40%" cy="38%" r="65%"><stop stopColor="#ffffff"/><stop offset=".6" stopColor="#f6f2e8"/><stop offset="1" stopColor="#d8d0bd"/></radialGradient>
   <filter id="vows-plant-shadow" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="6"/></filter>
  </defs>
  <g fill={palette.shadow} stroke={palette.shadow} opacity={lightweight?.16:.3} transform="translate(18 26)" filter={lightweight?undefined:'url(#vows-plant-shadow)'}>
   <Plants phase={phase-.25} shadow/>
  </g>
  <Plants phase={phase} shadow={false}/>
 </g>;
}
