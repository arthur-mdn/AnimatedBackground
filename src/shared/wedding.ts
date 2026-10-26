export function weddingNames(input:{brideName:string;groomName:string;reverseNames:boolean}){
 return input.reverseNames?[input.groomName,input.brideName]:[input.brideName,input.groomName];
}
export function isWeddingDate(value:string){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
 const date=new Date(`${value}T12:00:00Z`);
 return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===value;
}
export function formatWeddingDate(value:string){
 return isWeddingDate(value)?new Intl.DateTimeFormat('fr-FR',{day:'2-digit',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(`${value}T12:00:00Z`)):'Votre date';
}
