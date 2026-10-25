import {Composition,registerRoot} from 'remotion';
import {Birthday} from './Birthday';
import {defaults,VIDEO} from '../shared/config';
function Root(){return <Composition id="Birthday" component={Birthday} {...VIDEO} durationInFrames={defaults.durationSeconds*VIDEO.fps} defaultProps={defaults} calculateMetadata={({props})=>({durationInFrames:props.durationSeconds*VIDEO.fps})}/>;}
registerRoot(Root);
