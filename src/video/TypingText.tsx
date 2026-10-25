import {useEffect, useState} from 'react';
import {cancelRender, continueRender, delayRender} from 'remotion';
import {graphemes, typedCharacters} from './timing';

type Line = {text: string; width: number; edges: number[]};

// Preserve shaping and ligatures: reveal one complete string with a mask.
// Message rows stay on one line and shrink typographically rather than wrap.
export function TypingText({text, fontSize, maxWidth, frame, total, start, length,
  singleLine=false, fontFamily='Celebration, cursive', fontWeight=400, letterSpacing=0}: {
  text: string; fontSize: number; maxWidth: number; frame: number;
  total: number; start: number; length: number; singleLine?:boolean;
  fontFamily?:string; fontWeight?:number; letterSpacing?:number;
}) {
  const [layout, setLayout] = useState<{lines:Line[];size:number;spacing:number}>({lines:[],size:fontSize,spacing:letterSpacing});
  useEffect(() => {
    const handle = delayRender('Composition du texte');
    let disposed = false;
    document.fonts.load(`${fontWeight} ${fontSize}px ${fontFamily}`).then(() => {
      if (disposed) return;
      const context = document.createElement('canvas').getContext('2d');
      if (!context) throw new Error('Mesure du texte indisponible.');
      context.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
      const rawWidth=context.measureText(text).width+Math.max(0,graphemes(text).length-1)*letterSpacing;
      const ratio=singleLine&&rawWidth>0?Math.min(1,maxWidth/rawWidth):1;
      const size=fontSize*ratio,spacing=letterSpacing*ratio;
      context.font=`${fontWeight} ${size}px ${fontFamily}`;
      const measure=(value:string)=>context.measureText(value).width+Math.max(0,graphemes(value).length-1)*spacing;
      const wrapped: string[] = [];
      if(singleLine)wrapped.push(text);
      else for (const paragraph of text.split('\n')) {
        let line = '';
        for (const word of paragraph.split(/\s+/)) {
          const candidate = line ? `${line} ${word}` : word;
          if (line && measure(candidate) > maxWidth) {
            wrapped.push(line);
            line = word;
          } else line = candidate;
        }
        wrapped.push(line);
      }
      setLayout({size,spacing,lines:wrapped.map(line => {
        const letters = graphemes(line);
        return {text: line, width: measure(line),
          edges: letters.map((_, i) => measure(letters.slice(0, i + 1).join('')))};
      })});
      continueRender(handle);
    }).catch(error => {if(!disposed)cancelRender(error);});
    return () => {disposed = true; continueRender(handle);};
  }, [text, fontSize, maxWidth, singleLine, fontFamily, fontWeight, letterSpacing]);
  const count = layout.lines.reduce((sum, line) => sum + line.edges.length, 0);
  let remaining = typedCharacters(frame, total, start, length, count);
  return <div style={{fontFamily,fontWeight,fontSize:layout.size,letterSpacing:layout.spacing,lineHeight:1.25}}>
    {layout.lines.map((line, i) => {
      const visible = Math.min(line.edges.length, remaining);
      remaining = Math.max(0, remaining - line.edges.length);
      const right = visible === line.edges.length ? 0 : 64 + line.width - (line.edges[visible - 1] || 0);
      return <div key={i} style={{height:layout.size*1.25}}><span style={{display:'inline-block',
        padding:'0 64px',whiteSpace:'pre',opacity:visible?1:0,
        clipPath:`inset(-40px ${right}px -40px 0)`}}>{line.text}</span></div>;
    })}
  </div>;
}
