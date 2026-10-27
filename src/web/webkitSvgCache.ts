// WebKit can retain decoded SVG images after their blob URL is revoked. Dynamic
// backgrounds create a new SVG each frame: release the superseded image explicitly.
// Only marked, continuously rendered backgrounds participate; static glyph images
// remain untouched because Remotion may reuse their cached drawable later.
export function createSvgFrameCache(){
 const latest=new Map<string,{src:string}>();
 return {
  use(layer:string,image:{src:string}){const previous=latest.get(layer);if(previous&&previous!==image)previous.src='';latest.set(layer,image);},
  clear(){for(const image of latest.values())image.src='';latest.clear();}
 };
}
export function installWebkitSvgCache(enabled:boolean){
 const cache=createSvgFrameCache();
 if(!enabled)return {async nextFrame(){},restore(){}};
 const nativeURL=URL.createObjectURL,metadata=new Map<string,string>(),pending:Promise<void>[]=[],drawn=new Set<HTMLImageElement>();
 const createURL:typeof URL.createObjectURL=function(blob){
  const url=nativeURL.call(URL,blob);
  if(blob instanceof Blob&&blob.type.startsWith('image/svg+xml'))pending.push(blob.text().then(source=>{
   const layer=source.match(/data-client-raster="(ink|night|foliage)"/)?.[1];if(layer)metadata.set(url,layer);
  }));
  return url;
 };
 URL.createObjectURL=createURL;
 const restores:Array<()=>void>=[];
 const prototypes=new Set([CanvasRenderingContext2D.prototype,OffscreenCanvasRenderingContext2D.prototype]);
 for(const prototype of prototypes){
  const original=prototype.drawImage;
  const drawImage=function(this:CanvasRenderingContext2D,...args:Parameters<CanvasRenderingContext2D['drawImage']>){
   Reflect.apply(original,this,args);
   const image=args[0];if(image instanceof HTMLImageElement&&image.src.startsWith('blob:'))drawn.add(image);
  } as typeof original;
  prototype.drawImage=drawImage;
  restores.push(()=>{if(prototype.drawImage===drawImage)prototype.drawImage=original;});
 }
 return {
  async nextFrame(){
   await Promise.all(pending.splice(0));
   for(const image of drawn){const layer=metadata.get(image.src);if(layer){metadata.delete(image.src);cache.use(layer,image);}}
   drawn.clear();
  },
  restore(){for(const restore of restores)restore();if(URL.createObjectURL===createURL)URL.createObjectURL=nativeURL;cache.clear();drawn.clear();metadata.clear();}
 };
}
