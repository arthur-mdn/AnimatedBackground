import {CheckIcon} from './Icons';
export function CustomColorSwatch({value,onChange,selected,label}:{value:string;onChange:(value:string)=>void;selected:boolean;label:string}){
 return <label className={`palette-option custom-color-swatch ${selected?'is-selected':''}`} title="Couleur personnalisée">
  <input type="color" aria-label={label} value={value} onInput={e=>onChange(e.currentTarget.value)} onChange={e=>onChange(e.target.value)}/>
  {selected&&<CheckIcon/>}
 </label>;
}
