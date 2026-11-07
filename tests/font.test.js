// Arabic tafsir text uses Kitab (same files as tafsir.mushafuk.online); Quran/mushaf fonts unchanged.
const fs=require('fs'),path=require('path'),assert=require('assert'),crypto=require('crypto');const R=path.join(__dirname,'..');
const css=fs.readFileSync(path.join(R,'index.html'),'utf8');let n=0;const ok=(c,m)=>{assert(c,m);n++;console.log('PASS',m)};
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(path.join(R,'yazi-fonts',f))).digest('hex').slice(0,16);
ok(sha('Kitab-Regular.ttf')==='ae3b6f7e450f9f38'&&sha('Kitab-Bold.ttf')==='09fa5452c67a0d79','bundled Kitab files identical to tafsir.mushafuk.online');
ok(/SIL Open Font License/.test(fs.readFileSync(path.join(R,'yazi-fonts','OFL-Kitab.txt'),'utf8')),'OFL license bundled');
ok(/@font-face \{ font-family: Kitab; src: url\(\.\/yazi-fonts\/Kitab-Regular\.ttf\)[^}]*font-weight: 400/.test(css)&&/Kitab-Bold\.ttf\)[^}]*font-weight: 700/.test(css),'font-face regular 400 + bold 700, local paths');
for(const sel of ['.qm-body[lang="ar"]','.qm-tx2[lang="ar"]','.qm-cmp-tx[lang="ar"]'])ok(new RegExp(sel.replace(/[.[\]"]/g,'\\$&')+' \\{ font-family: Kitab, "Noto Naskh Arabic"').test(css),sel+' uses Kitab');
ok((css.match(/font-family: QMHafs/g)||[]).length>=6&&/\.qm-ar \{[^}]*font-family: QMHafs/.test(css),'Quran text selectors still QMHafs');
ok(!/\.qm-body \{[^}]*Kitab/.test(css)&&!/\.qm-tx2 \{[^}]*Kitab/.test(css),'non-Arabic tafsir/translation text unchanged');
console.log('font tests:',n,'passed');
