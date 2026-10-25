export const smooth=(x:number)=>{const t=Math.min(1,Math.max(0,x));return t*t*(3-2*t);};
// Use the last encoded frame as the endpoint, not the unencoded frame at T.
export function reveal(frame:number,total:number,start:number,length:number){const t=Math.min(frame,total-1-frame)/30;return smooth((t-start)/length);}
export function cycle(frame:number,total:number){return 2*Math.PI*frame/(total-1);}
export function graphemes(text:string){return Array.from(new Intl.Segmenter('fr',{granularity:'grapheme'}).segment(text),part=>part.segment);}
export function typedCharacters(frame:number,total:number,start:number,length:number,count:number){
 const time=Math.min(frame,total-1-frame)/30;
 return Math.min(count,Math.max(0,Math.floor((time-start)/length*(count+1))));
}

export const APPEARANCE = {
 line1:{start:0,fade:1.4,writing:.45},
 line2:{start:1,fade:2.2,writing:1},
 firstName:{start:2.7,fade:2.5,writing:1.2},
 age:{start:4.4,fade:2.5},
 years:{start:4.9,fade:2.2},
 heart:{start:6.4,fade:2.6},
} as const;
