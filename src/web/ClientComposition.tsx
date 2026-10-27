import {AbsoluteFill} from 'remotion';
import {Video} from '@remotion/media';
import type {BirthdayInput} from '../shared/config';
import {Foreground} from '../video/Layers';
import {Birthday} from '../video/Birthday';
import {ClientRendering} from '../video/ClientRendering';

export type ClientCompositionProps=BirthdayInput&{backgroundSrc?:string;holdSrc?:string;images:Record<string,string>;rasterScale?:number};
export function ClientComposition({backgroundSrc,holdSrc,images,rasterScale,...input}:ClientCompositionProps){
 return <ClientRendering assets={{images,holdSrc,rasterScale}}>{backgroundSrc?<AbsoluteFill><Video src={backgroundSrc} muted style={{width:'100%',height:'100%'}}/><Foreground {...input}/></AbsoluteFill>:<Birthday {...input}/>}</ClientRendering>;
}
