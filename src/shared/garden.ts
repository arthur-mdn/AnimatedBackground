import {hexHsl} from './color';
export const gardenPaletteIds=['ivoire','sauge','rose','bleu','lavande','champagne'] as const;
export type GardenPaletteId=typeof gardenPaletteIds[number];
export const gardenPalettes=[
 {id:'ivoire',name:'Ivoire',background:'#fffef3',text:'#414a38',secondary:'#69775c',muted:'#929b83',swatch:'#a6bd91',hue:100,saturation:.2},
 {id:'sauge',name:'Sauge',background:'#f3f7ef',text:'#405346',secondary:'#6a8371',muted:'#91a28d',swatch:'#8caa94',hue:135,saturation:.17},
 {id:'rose',name:'Rose',background:'#fff5f4',text:'#694a52',secondary:'#99727b',muted:'#b6999d',swatch:'#c79aa5',hue:345,saturation:.24},
 {id:'bleu',name:'Bleu',background:'#f3f8fc',text:'#43596b',secondary:'#708ca0',muted:'#98aabb',swatch:'#91aec5',hue:207,saturation:.24},
 {id:'lavande',name:'Lavande',background:'#f8f5fc',text:'#594e6c',secondary:'#8b7b9e',muted:'#aaa0bc',swatch:'#b3a1c7',hue:269,saturation:.22},
 {id:'champagne',name:'Champagne',background:'#fcf6ec',text:'#65543e',secondary:'#958267',muted:'#b3a48b',swatch:'#c3ad83',hue:39,saturation:.27},
] as const;
export const gardenPalette=(id:GardenPaletteId)=>gardenPalettes.find(p=>p.id===id)!;
export function gardenTone(hex:string,id:GardenPaletteId){
 if(id==='ivoire')return hex;
 const palette=gardenPalette(id),source=hexHsl(hex);
 return `hsl(${palette.hue} ${palette.saturation*100}% ${source.l*100}%)`;
}
