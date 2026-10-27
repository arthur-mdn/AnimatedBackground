const KEY='ab-client-export-attempt';
export function readExportAttempt(){try{const value=sessionStorage.getItem(KEY);return value&&value.length<16000?value:null;}catch{return null;}}
export function rememberExportAttempt(key:string){try{sessionStorage.setItem(KEY,key);}catch{/* Private browsing may disallow storage. */}}
export function clearExportAttempt(){try{sessionStorage.removeItem(KEY);}catch{/* No storage available. */}}
