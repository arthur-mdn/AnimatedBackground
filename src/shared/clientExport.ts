import type {BirthdayInput} from './config';

export type ClientBackground={key:string;src:string;bytes:number};
export type ClientBackgroundManifest={version:string;assets:ClientBackground[]};
// Personal fields never participate in the background asset identity.
export function clientBackgroundKey(input:BirthdayInput){
 if(input.templateId!=='rose-poudre')return null;
 return `aquarelle-${input.watercolorColor.slice(1).toLowerCase()}-${input.showGoldNuggets?'gold':'plain'}-${input.durationSeconds}s`;
}
export function findClientBackground(manifest:unknown,version:string,input:BirthdayInput):ClientBackground|null{
 if(!manifest||typeof manifest!=='object')return null;
 const data=manifest as ClientBackgroundManifest,key=clientBackgroundKey(input);
 if(data.version!==version||!key||!Array.isArray(data.assets))return null;
 return data.assets.find(asset=>asset.key===key&&Number.isFinite(asset.bytes)&&asset.bytes>0&&
  new RegExp(`^/client-backgrounds/${version}/${key}-[a-f0-9]{16}\\.mp4$`).test(asset.src))??null;
}
