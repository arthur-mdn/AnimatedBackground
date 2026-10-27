export type BrushStroke={points:Array<[number,number]>;length:number};
// Thin the actual filled glyph to a pen trajectory (Zhang–Suen). This operates
// once per distinct glyph; it never runs on individual animation frames.
export function thinGlyph(source:Uint8Array,width:number,height:number){
 const pixels=source.slice(),remove:number[]=[];
 let changed=true;
 while(changed){
  changed=false;
  for(let pass=0;pass<2;pass++){
   remove.length=0;
   for(let y=1;y<height-1;y++)for(let x=1;x<width-1;x++){
    const i=y*width+x;if(!pixels[i])continue;
    const p=[pixels[i-width],pixels[i-width+1],pixels[i+1],pixels[i+width+1],pixels[i+width],pixels[i+width-1],pixels[i-1],pixels[i-width-1]];
    const count=p.reduce((a,b)=>a+b,0);if(count<2||count>6)continue;
    let transitions=0;for(let j=0;j<8;j++)if(!p[j]&&p[(j+1)%8])transitions++;
    if(transitions!==1)continue;
    if(pass===0?(p[0]*p[2]*p[4]||p[2]*p[4]*p[6]):(p[0]*p[2]*p[6]||p[0]*p[4]*p[6]))continue;
    remove.push(i);
   }
   if(remove.length)changed=true;
   for(const i of remove)pixels[i]=0;
  }
 }
 return pixels;
}
export function traceGlyph(source:Uint8Array,width:number,height:number):BrushStroke[]{
 const pixels=thinGlyph(source,width,height),nodes=new Map<number,number[]>();
 for(let y=1;y<height-1;y++)for(let x=1;x<width-1;x++){
  const i=y*width+x;if(!pixels[i])continue;
  const adjacent:number[]=[];
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
   if(!dx&&!dy)continue;const n=i+dy*width+dx;if(!pixels[n])continue;
   // Avoid the triangular shortcuts created by 8-connectivity at corners.
   if(dx&&dy&&(pixels[i+dx]||pixels[i+dy*width]))continue;
   adjacent.push(n);
  }
  nodes.set(i,adjacent);
 }
 const components:number[][]=[],seen=new Set<number>();
 for(const root of nodes.keys()){
  if(seen.has(root))continue;const stack=[root],component:number[]=[];seen.add(root);
  while(stack.length){const i=stack.pop()!;component.push(i);for(const n of nodes.get(i)!)if(!seen.has(n)){seen.add(n);stack.push(n);}}
  components.push(component);
 }
 // Main letter first, detached accents and dots after it.
 components.sort((a,b)=>b.length-a.length);
 const strokes:BrushStroke[]=[],edges=new Set<string>(),key=(a:number,b:number)=>a<b?`${a}:${b}`:`${b}:${a}`;
 for(const component of components){
  let previous:number|undefined;
  while(true){
   const available=component.filter(i=>nodes.get(i)!.some(n=>!edges.has(key(i,n))));
   if(!available.length){if(component.length===1){const i=component[0];strokes.push({points:[[i%width,Math.floor(i/width)],[i%width+.1,Math.floor(i/width)]],length:.1});}break;}
   const endpoints=available.filter(i=>nodes.get(i)!.filter(n=>!edges.has(key(i,n))).length===1);
   const top=Math.min(...available.map(i=>Math.floor(i/width))),bottom=Math.max(...available.map(i=>Math.floor(i/width)));
   // A Q-like loop should start on its bowl, rather than at the lower tail.
   const tailOnly=previous===undefined&&endpoints.length>0&&endpoints.every(i=>Math.floor(i/width)>top+(bottom-top)*.35);
   const candidates=endpoints.length&&!tailOnly?endpoints:available;
   // Open strokes start at the leftmost tip (then highest) so cursive draws left-to-right.
   candidates.sort((a,b)=>previous===undefined?(a%width-b%width)||(Math.floor(a/width)-Math.floor(b/width)):Math.hypot(a%width-previous%width,Math.floor(a/width)-Math.floor(previous/width))-Math.hypot(b%width-previous%width,Math.floor(b/width)-Math.floor(previous/width)));
   let current=candidates[0],last:number|undefined,length=0;const points:Array<[number,number]>=[[current%width,Math.floor(current/width)]];
   while(true){
    const next=nodes.get(current)!.filter(n=>!edges.has(key(current,n)));
    if(!next.length)break;
    // Continue in the current pen direction through intersections.
    const before=last;
    if(before!==undefined)next.sort((a,b)=>{
     const dx=current%width-before%width,dy=Math.floor(current/width)-Math.floor(before/width);
     return ((b%width-current%width)*dx+(Math.floor(b/width)-Math.floor(current/width))*dy)-((a%width-current%width)*dx+(Math.floor(a/width)-Math.floor(current/width))*dy);
    });
    const n=next[0];edges.add(key(current,n));length+=Math.hypot(n%width-current%width,Math.floor(n/width)-Math.floor(current/width));last=current;current=n;points.push([current%width,Math.floor(current/width)]);
   }
   if(previous===undefined&&endpoints.length>0&&!tailOnly&&points.length>1&&points[0][0]>points[points.length-1][0]){
    points.reverse();current=Math.round(points[points.length-1][1])*width+Math.round(points[points.length-1][0]);
   }
   previous=current;if(points.length>1)strokes.push({points,length});
  }
 }
 return strokes;
}
export function writingProgress(frame:number,total:number,start:number,seconds:number){return Math.min(1,Math.max(0,(Math.min(frame,total-1-frame)/30-start)/seconds));}

// Separate slots keep the ampersand complete before the second name starts.
export const WEDDING_WRITING={
 firstName:{start:21/30,length:36/30},
 ampersand:{start:57/30,length:12/30},
 secondName:{start:75/30,length:45/30},
 date:{start:126/30},
} as const;
