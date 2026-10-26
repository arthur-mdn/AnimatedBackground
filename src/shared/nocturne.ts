export const nocturnePaletteIds=['bleu-nuit','rouge-couchant','orange-crepuscule','violet-astral','vert-boreal','rose-aurore'] as const;
export type NocturnePaletteId=typeof nocturnePaletteIds[number];
export const nocturnePalettes=[
 {id:'bleu-nuit',name:'Bleu nuit',swatch:'#20366F',hue:225,lightHue:215,horizon:'#31569c'},
 {id:'rouge-couchant',name:'Rouge couchant',swatch:'#A43E4D',hue:350,lightHue:22,horizon:'#d96635'},
 {id:'orange-crepuscule',name:'Orange crépuscule',swatch:'#CF803B',hue:21,lightHue:42,horizon:'#e6a451'},
 {id:'violet-astral',name:'Violet astral',swatch:'#7851A7',hue:265,lightHue:287,horizon:'#8b579c'},
 {id:'vert-boreal',name:'Vert boréal',swatch:'#317C76',hue:172,lightHue:151,horizon:'#48a395'},
 {id:'rose-aurore',name:'Rose aurore',swatch:'#AA5F88',hue:325,lightHue:351,horizon:'#cc7d8f'},
] as const;
