import type {OrnamentId} from '../shared/ornaments';

// Shared vector artwork: the selector and the exported video show the same icon.
export function CelebrationIconPaths({kind}:{kind:OrnamentId}){
 switch(kind){
 case 'heart':return <path d="M32 54C22 45 10 35 10 23C10 10 26 7 32 21C38 7 54 10 54 23C54 35 42 45 32 54Z"/>;
 case 'champagne':return <>
  <g transform="rotate(16 23 35)"><path d="M13 8H29L28 27C27 39 15 39 14 27Z M21 36V55 M14 57H28 M15 22H27"/></g>
  <g transform="rotate(-16 41 35)"><path d="M35 8H51L50 27C49 39 37 39 36 27Z M43 36V55 M36 57H50 M37 22H49"/></g>
  <path d="M32 3V7 M26 2 28 6 M38 2 36 6"/>
 </>;
 case 'beer':return <>
  <g transform="rotate(12 19 35)"><path d="M8 24V49Q8 54 13 54H26Q30 54 30 49V24 M9 24H29 M8 28H5Q1 28 1 34V39Q1 44 8 44 M15 32V46 M23 32V46"/><path d="M8 24C3 20 7 13 12 15C12 8 22 8 24 15C30 12 35 20 29 24"/></g>
  <g transform="rotate(-12 45 35)"><path d="M34 24V49Q34 54 39 54H52Q56 54 56 49V24 M35 24H55 M56 28H59Q63 28 63 34V39Q63 44 56 44 M41 32V46 M49 32V46"/><path d="M34 24C29 20 33 13 38 15C38 8 48 8 50 15C56 12 61 20 55 24"/></g>
  <path d="M32 3V7 M27 4 29 8 M37 4 35 8"/>
 </>;
 case 'cake':return <>
  <path d="M9 57H55 M13 55V29Q13 25 17 25H47Q51 25 51 29V55 M13 35Q19 43 25 35Q32 43 39 35Q45 43 51 35 M23 25V17 M32 25V15 M41 25V17"/>
  <path d="M23 13C17 10 23 5 23 5C23 5 29 10 23 13Z M32 11C26 8 32 3 32 3C32 3 38 8 32 11Z M41 13C35 10 41 5 41 5C41 5 47 10 41 13Z"/>
 </>;
 case 'stars':return <><path d="m28 12 5 14 15 1-12 9 4 15-12-9-13 9 5-15-12-9 15-1Z M49 4 51 10 57 12 51 14 49 20 47 14 41 12 47 10Z"/></>;
 case 'none':return <><circle cx="32" cy="32" r="21"/><path d="m17 17 30 30"/></>;
 }
}
export function CelebrationIcon({kind}:{kind:OrnamentId}){return <svg width="28" height="28" viewBox="-4 -4 72 72" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><CelebrationIconPaths kind={kind}/></svg>;}
