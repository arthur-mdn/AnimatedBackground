type RequestOrigin={hostname:string;host:string;protocol:string;origin?:string};
const localHosts=new Set(['localhost','127.0.0.1','::1','[::1]']);
export function createRequestOriginPolicy(publicUrl?:string){
 let publicOrigin:URL|undefined;
 if(publicUrl?.trim()){
  publicOrigin=new URL(publicUrl.trim());
  if(!['http:','https:'].includes(publicOrigin.protocol)||publicOrigin.username||publicOrigin.password||publicOrigin.pathname!=='/'||publicOrigin.search||publicOrigin.hash)throw new Error('PUBLIC_URL doit être une origine HTTP(S) sans chemin ni identifiants.');
 }
 return ({hostname,host,protocol,origin}:RequestOrigin)=>{
  let expected:string;
  if(localHosts.has(hostname.toLowerCase()))expected=`${protocol}://${host}`;
  else if(publicOrigin&&hostname.toLowerCase()===publicOrigin.hostname)expected=publicOrigin.origin;
  else return false;
  // TLS may terminate at Traefik: compare the browser Origin to the configured
  // public URL, not the HTTP transport between the proxy and this container.
  return origin===undefined||origin===expected;
 };
}
