import {Composition,registerRoot} from 'remotion';
function Noise({seed,texture}:{seed:number;texture:boolean}){
 return <svg width="1600" height="1600" viewBox="-350 -350 1600 1600"><defs><filter id="noise" filterUnits="userSpaceOnUse" x="-350" y="-350" width="1600" height="1600" colorInterpolationFilters="sRGB"><feTurbulence type="fractalNoise" baseFrequency={texture?'.035':'.018 .022'} numOctaves={texture?4:3} seed={seed}/></filter></defs><rect x="-350" y="-350" width="1600" height="1600" filter="url(#noise)"/></svg>;
}
registerRoot(()=> <Composition id="InkNoise" component={Noise} width={1600} height={1600} fps={30} durationInFrames={1} defaultProps={{seed:23,texture:false}}/>);
