export const fireworksPaletteIds=['or','emeraude','prune','argent'] as const;
export const heartsPaletteIds=['rose','peche','lilas','sauge'] as const;
export type FireworksPaletteId=typeof fireworksPaletteIds[number];
export type HeartsPaletteId=typeof heartsPaletteIds[number];
export type FestiveColors={paper:string;background:string;washes:readonly string[];grain:string;ink:string;light:string;face:string;shade:string;shadow:string;accent:string;bright:string};
export const fireworksPalettes=[
 {id:'or',name:'Nuit & or',paper:'#172f54',background:'#050e21',washes:['#294e7a','#06142b','#365b81','#102442'],grain:'#e6c68d',ink:'#f4d89d',light:'#fff0bf',face:'#ecc36f',shade:'#cc943d',shadow:'#8f622c',accent:'#edae40',bright:'#ffe8a1'},
 {id:'emeraude',name:'Émeraude & champagne',paper:'#173f39',background:'#061b19',washes:['#36675b','#082b27','#52776a','#133b32'],grain:'#dfd2a4',ink:'#eaddb0',light:'#fff3d2',face:'#dccc99',shade:'#b29963',shadow:'#746643',accent:'#d5ba7c',bright:'#fff0c5'},
 {id:'prune',name:'Prune & or rose',paper:'#422b48',background:'#1a0c23',washes:['#6a4265','#26132e','#805c7a','#432442'],grain:'#edc2b8',ink:'#f3ceca',light:'#ffe8df',face:'#e4ad9c',shade:'#bc7e78',shadow:'#86545b',accent:'#d99985',bright:'#ffe4d4'},
 {id:'argent',name:'Anthracite & argent',paper:'#343d4b',background:'#0b111c',washes:['#526172','#151f2e','#667587','#293544'],grain:'#cdd8e5',ink:'#e4eaf2',light:'#ffffff',face:'#c5d0df',shade:'#8e9fb5',shadow:'#58677c',accent:'#b6c8df',bright:'#f0f6ff'},
] as const satisfies readonly (FestiveColors&{id:FireworksPaletteId;name:string})[];
export const heartsPalettes=[
 {id:'rose',name:'Rose tendre',paper:'#fff8f5',background:'#ffe1eb',washes:['#f38eae','#ffcedc','#ef9eb6','#ffc1d2'],grain:'#b9597a',ink:'#b5527d',light:'#ffe0ec',face:'#d77599',shade:'#c35d88',shadow:'#a7466e',accent:'#e65c8e',bright:'#fff5f1'},
 {id:'peche',name:'Pêche & abricot',paper:'#fffaf4',background:'#ffe8da',washes:['#efad8e','#ffdbc3','#eebba3','#ffd3b6'],grain:'#bc795a',ink:'#ac6a50',light:'#ffe8d6',face:'#d99b7d',shade:'#be7c60',shadow:'#995e47',accent:'#dd946e',bright:'#fff8ec'},
 {id:'lilas',name:'Lilas doux',paper:'#fcf8ff',background:'#eae1fa',washes:['#baa0dc','#e0d0f2','#c3acdF','#dac5ed'],grain:'#9270b4',ink:'#8460a5',light:'#f1e4ff',face:'#ad88cc',shade:'#926bb4',shadow:'#745293',accent:'#aa7cca',bright:'#fff8ff'},
 {id:'sauge',name:'Sauge pastel',paper:'#fbfbf4',background:'#e5eddf',washes:['#a7bf9a','#d9e5ca','#b6c9a7','#cddfc1'],grain:'#769365',ink:'#668258',light:'#eaf3dd',face:'#9bb88a',shade:'#7c9d6a',shadow:'#5c784f',accent:'#94b37f',bright:'#fffff1'},
] as const satisfies readonly (FestiveColors&{id:HeartsPaletteId;name:string})[];
export const fireworksPalette=(id:FireworksPaletteId)=>fireworksPalettes.find(p=>p.id===id)!;
export const heartsPalette=(id:HeartsPaletteId)=>heartsPalettes.find(p=>p.id===id)!;
