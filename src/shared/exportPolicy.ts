export type ExportCapability='checking'|'ready'|'unsupported';
export function exportPolicy(capability:ExportCapability,mode:'client'|'server',failedInput:string|null,inputKey:string){
 const serverAvailable=capability==='unsupported'||failedInput===inputKey;
 return {serverAvailable,canGenerate:mode==='client'?capability==='ready':serverAvailable,selected:mode==='client'};
}
