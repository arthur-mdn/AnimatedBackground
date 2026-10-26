import {Composition,registerRoot} from 'remotion';
import {Birthday} from './Birthday';
import {Background,Foreground,ScreenLayer} from './Layers';
import {defaults,VIDEO} from '../shared/config';
function Root(){return <>
 <Composition id="Birthday" component={Birthday} {...VIDEO} durationInFrames={defaults.durationSeconds*VIDEO.fps} defaultProps={defaults} calculateMetadata={({props})=>({durationInFrames:props.durationSeconds*VIDEO.fps})}/>
 <Composition id="Background" component={Background} {...VIDEO} durationInFrames={defaults.durationSeconds*VIDEO.fps} defaultProps={defaults} calculateMetadata={({props})=>({durationInFrames:props.durationSeconds*VIDEO.fps})}/>
 <Composition id="Foreground" component={Foreground} {...VIDEO} durationInFrames={defaults.durationSeconds*VIDEO.fps} defaultProps={defaults} calculateMetadata={({props})=>({durationInFrames:props.durationSeconds*VIDEO.fps})}/>
 <Composition id="ScreenLayer" component={ScreenLayer} {...VIDEO} durationInFrames={defaults.durationSeconds*VIDEO.fps} defaultProps={defaults} calculateMetadata={({props})=>({durationInFrames:props.durationSeconds*VIDEO.fps})}/>
 </>;}
registerRoot(Root);
