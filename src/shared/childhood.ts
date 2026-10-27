export const childhoodPaletteIds=['rose','ciel','menthe','soleil','lilas'] as const;
export type ChildhoodPaletteId=typeof childhoodPaletteIds[number];
export const childhoodPalettes=[
 {id:'rose',name:'Rose bonbon',background:'#fff4f6',paper:'#ffe8ee',ink:'#c45d7a',soft:'#f2b4c4',accent:'#7eb7e0',balloon:['#efb6c4','#a8cae4','#e8d498'],swatch:'#efb6c4'},
 {id:'ciel',name:'Ciel',background:'#f3f8ff',paper:'#e7f1ff',ink:'#4a6f9a',soft:'#a8c6e8',accent:'#f0a07a',balloon:['#a8cae4','#efb6c4','#b6d9c4'],swatch:'#a8cae4'},
 {id:'menthe',name:'Menthe',background:'#f3faf5',paper:'#e5f5ea',ink:'#3f7a5c',soft:'#9fd4b0',accent:'#e8b86a',balloon:['#b6d9c4','#efb6c4','#a8cae4'],swatch:'#b6d9c4'},
 {id:'soleil',name:'Soleil',background:'#fff8ee',paper:'#ffefd6',ink:'#9a6a2e',soft:'#f0d07a',accent:'#e089a0',balloon:['#e8d498','#a8cae4','#efb6c4'],swatch:'#e8d498'},
 {id:'lilas',name:'Lilas',background:'#f7f4fb',paper:'#eee6f8',ink:'#6a5a8a',soft:'#c4b0e0',accent:'#e8a070',balloon:['#cdbfe0','#efb6c4','#b6d9c4'],swatch:'#cdbfe0'},
] as const;
export const childhoodPalette=(id:ChildhoodPaletteId)=>childhoodPalettes.find(p=>p.id===id)!;
