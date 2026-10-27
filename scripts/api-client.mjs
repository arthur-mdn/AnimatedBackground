// Node CLI clients use the same anonymous-session API as the browser.
export function apiClient(base){
 let cookie='';
 async function request(path,options={}){
  const response=await fetch(base+path,{...options,headers:{...options.headers,...(cookie?{Cookie:cookie}:{})}});
  const received=response.headers.get('set-cookie');if(received)cookie=received.split(';')[0];
  return response;
 }
 return {request,async connect(){const response=await request('/api/health');if(!response.ok)throw Error('API indisponible.');return response;}};
}
