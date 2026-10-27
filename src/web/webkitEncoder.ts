// Safari's H.264 quality-mode encoder can stop dequeuing without an error.
// https://github.com/remotion-dev/remotion/issues/11964
// Limit the workaround to our one active export and always restore the native API.
export function installRealtimeEncoder(enabled:boolean){
 if(!enabled||typeof VideoEncoder==='undefined')return ()=>{};
 const Original=globalThis.VideoEncoder;
 const configFor=(config:VideoEncoderConfig):VideoEncoderConfig=>({...config,latencyMode:'realtime'});
 class RealtimeEncoder extends Original{
  static override isConfigSupported(config:VideoEncoderConfig){return Original.isConfigSupported(configFor(config));}
  override configure(config:VideoEncoderConfig){super.configure(configFor(config));}
 }
 globalThis.VideoEncoder=RealtimeEncoder;
 return ()=>{if(globalThis.VideoEncoder===RealtimeEncoder)globalThis.VideoEncoder=Original;};
}
