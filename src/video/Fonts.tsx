import {staticFile} from 'remotion';
export function Fonts(){return <style>{`
@font-face{font-family:Celebration;src:url("${staticFile('fonts/alex-brush-latin-400-normal.woff2')}") format('woff2');font-weight:400;font-display:block}
@font-face{font-family:Celebration;src:url("${staticFile('fonts/alex-brush-latin-ext-400-normal.woff2')}") format('woff2');font-weight:400;font-display:block;unicode-range:U+0100-02FF,U+1E00-1EFF}
@font-face{font-family:GardenNames;src:url("${staticFile('fonts/apple-chancery.ttf')}") format('truetype');font-weight:400;font-display:block}
@font-face{font-family:Portrait;src:url("${staticFile('fonts/bodoni-moda-latin-700-normal.woff2')}") format('woff2');font-weight:700;font-display:block}
@font-face{font-family:Portrait;src:url("${staticFile('fonts/bodoni-moda-latin-ext-700-normal.woff2')}") format('woff2');font-weight:700;font-display:block;unicode-range:U+0100-02FF,U+1E00-1EFF}
@font-face{font-family:Invitation;src:url("${staticFile('fonts/cormorant-garamond-latin-400-normal.woff2')}") format('woff2');font-weight:400;font-display:block}
@font-face{font-family:Invitation;src:url("${staticFile('fonts/cormorant-garamond-latin-ext-400-normal.woff2')}") format('woff2');font-weight:400;font-display:block;unicode-range:U+0100-02FF,U+1E00-1EFF}
@font-face{font-family:NocturneDisplay;src:url("${staticFile('fonts/outfit-latin-700-normal.woff2')}") format('woff2');font-weight:700;font-display:block}
@font-face{font-family:NocturneDisplay;src:url("${staticFile('fonts/outfit-latin-ext-700-normal.woff2')}") format('woff2');font-weight:700;font-display:block;unicode-range:U+0100-02FF,U+1E00-1EFF}
`}</style>;}
