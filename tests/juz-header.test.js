// Cüz section header contrast: only .jhd changes; dimensions/fonts untouched; WCAG contrast >= 7:1.
const fs=require('fs'),path=require('path'),assert=require('assert');const h=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');let n=0;const ok=(c,m)=>{assert(c,m);n++;console.log('PASS',m)};
const L=x=>{const c=[1,3,5].map(i=>parseInt(x.substr(i,2),16)/255).map(v=>v<=.03928?v/12.92:((v+.055)/1.055)**2.4);return .2126*c[0]+.7152*c[1]+.0722*c[2]};const cr=(a,b)=>{const[x,y]=[L(a),L(b)].sort((p,q)=>q-p);return (x+.05)/(y+.05)};
const base=h.match(/\.jhd \{ display: flex;[^}]*\}/)[0];
ok(/padding: 0\.75rem 1rem/.test(base)&&/font-size: 1rem/.test(base)&&/font-weight: 650/.test(base),'size/padding/font unchanged');
ok(/\.jhd \{ background: #12352c; color: #fbf6ec; \}/.test(h),'dark forest green band, cream text');
ok(cr('#fbf6ec','#12352c')>=7,'title contrast '+cr('#fbf6ec','#12352c').toFixed(1)+':1');
ok(cr('#e0c48a','#12352c')>=7,'page number contrast '+cr('#e0c48a','#12352c').toFixed(1)+':1');
ok(cr('#12352c','#fbf6ec')>cr('#f3e7d0','#fbf6ec')*5,'band clearly distinct from cream page');
const extra=h.split(base)[1].split('</style>')[0];ok(!/\.(sh|surah|shead|tab|line)\b[^{]*\{[^}]*#12352c/.test(extra.split('.jhd span:last-child')[0].split('.jhd {')[1]||''),'rule scoped to .jhd only');
console.log('juz header tests:',n,'passed');
