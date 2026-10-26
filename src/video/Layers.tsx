import type {BirthdayInput} from '../shared/config';
import {Birthday} from './Birthday';
import {RenderLayer} from './RenderLayer';
export function Background(props:BirthdayInput){return <RenderLayer layer="background"><Birthday {...props}/></RenderLayer>;}
export function Foreground(props:BirthdayInput){return <RenderLayer layer="foreground"><Birthday {...props}/></RenderLayer>;}
export function ScreenLayer(props:BirthdayInput){return <RenderLayer layer="screen"><Birthday {...props}/></RenderLayer>;}
