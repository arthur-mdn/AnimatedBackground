export function hexHsl(hex:string){
 const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255),max=Math.max(...rgb),min=Math.min(...rgb),d=max-min,l=(max+min)/2;
 const h=d===0?0:max===rgb[0]?((rgb[1]-rgb[2])/d+6)%6:max===rgb[1]?(rgb[2]-rgb[0])/d+2:(rgb[0]-rgb[1])/d+4;
 return {h:h*60,s:d===0?0:d/(1-Math.abs(2*l-1)),l};
}
export function cssRGB(tone:string){
 if(tone.startsWith('#'))return [1,3,5].map(i=>parseInt(tone.slice(i,i+2),16)/255);
 const [h,s,l]=tone.match(/[\d.]+/g)!.map(Number),sat=s/100,light=l/100,a=sat*Math.min(light,1-light);
 return [0,8,4].map(n=>{const k=(n+h/30)%12;return light-a*Math.max(-1,Math.min(k-3,9-k,1));});
}
export function mixColors(from:string,to:string,amount:number){
 const a=cssRGB(from),b=cssRGB(to),t=Math.min(1,Math.max(0,amount));
 return `rgb(${a.map((value,i)=>Math.round((value+(b[i]-value)*t)*255)).join(' ')})`;
}
