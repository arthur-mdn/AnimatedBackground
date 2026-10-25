export function RoseSwatch(){
 return <span className="swatch" aria-hidden="true"><svg viewBox="0 0 600 600" width="56" height="56">
  <defs>
   <radialGradient id="swatch-paper"><stop stopColor="#fff4eb"/><stop offset="1" stopColor="#efd0ce"/></radialGradient>
   <linearGradient id="swatch-age" x2=".9" y2="1"><stop stopColor="#e9ada4"/><stop offset=".55" stopColor="#e3a198"/><stop offset="1" stopColor="#c77e7a"/></linearGradient>
   <pattern id="swatch-grain" width="30" height="30" patternUnits="userSpaceOnUse">{Array.from({length:28},(_,i)=><circle key={i} cx={(i*13.7)%30} cy={(i*19.3)%30} r={.35+(i%3)*.2} fill={i%3?'#ffe4d2':'#bc7770'} opacity=".65"/>)}</pattern>
  </defs>
  <rect width="600" height="600" fill="url(#swatch-paper)"/>
  <g fontFamily="Portrait, Georgia, serif" fontWeight="700" fontSize="450" textAnchor="middle" style={{fontVariantNumeric:'lining-nums'}}>
   <text x="303" y="471" fill="#b77c72" opacity=".6">50</text>
   <text x="300" y="465" fill="url(#swatch-age)" stroke="#edbca8" strokeWidth="1.5">50</text>
   <text x="300" y="465" fill="url(#swatch-grain)">50</text>
  </g>
 </svg></span>;
}
