export const vowsPaletteIds=['or','cire','bordeaux','sauge','encre'] as const;
export type VowsPaletteId=typeof vowsPaletteIds[number];
export const vowsPalettes=[
 {id:'or',name:'Or & olive',paper:'#f3ece0',fold:'#e9e0d0',text:'#3a4131',accent:'#b38a45',muted:'#6f6c5a',seal:'#b8914d',sealDark:'#755521',sealLight:'#e6cb8a',twine:'#b59a6c',shadow:'#5b5440',swatch:'#b8914d'},
 {id:'cire',name:'Cire rouge',paper:'#f5eee5',fold:'#e7dacb',text:'#3e302a',accent:'#a9804e',muted:'#7d6a5d',seal:'#9a2e33',sealDark:'#5e181d',sealLight:'#cf6365',twine:'#b49a73',shadow:'#5a4a40',swatch:'#9a2e33'},
 {id:'bordeaux',name:'Bordeaux',paper:'#f5eeea',fold:'#e8dbd5',text:'#3d2a31',accent:'#a8826b',muted:'#806870',seal:'#6c2238',sealDark:'#401221',sealLight:'#a14e67',twine:'#b29a80',shadow:'#55434a',swatch:'#6c2238'},
 {id:'sauge',name:'Sauge',paper:'#f2f2e9',fold:'#e1e2d4',text:'#33402f',accent:'#949766',muted:'#6c7866',seal:'#5f7655',sealDark:'#384a32',sealLight:'#93aa88',twine:'#ac9f7c',shadow:'#46503f',swatch:'#5f7655'},
 {id:'encre',name:'Encre',paper:'#f2f1ed',fold:'#e1dfd9',text:'#28303b',accent:'#8c95a5',muted:'#6a717d',seal:'#2e3c56',sealDark:'#19223a',sealLight:'#62759b',twine:'#a9a08c',shadow:'#3e434d',swatch:'#2e3c56'},
] as const;
export const vowsPalette=(id:VowsPaletteId)=>vowsPalettes.find(p=>p.id===id)!;
