// Runs the real lib.js (catalog, download, IndexedDB, ayah sheet) in jsdom; data served from this checkout.
// Needs jsdom + fake-indexeddb on NODE_PATH.
const {JSDOM}=require('jsdom');const fs=require('fs');const path=require('path');const assert=require('assert');
const R=path.join(__dirname,'..')+'/';const RB='https://nihomaho9-ui.github.io/quran-medine/';
const cnt={};for(const l of fs.readFileSync(R+'quran-uthmani.txt','utf8').split('\n')){const p=l.split('|');if(p.length>=3&&/^\d+$/.test(p[0]))cnt[p[0]]=(cnt[p[0]]||0)+1}
const BUNDLED=JSON.parse(fs.readFileSync(R+'lib-list.json','utf8'));
function boot({remote,storage,offline}={}){
 const dom=new JSDOM('<!doctype html><html><head></head><body></body></html>',{runScripts:'outside-only',url:'https://localhost/',pretendToBeVisual:true});
 const w=dom.window;const {IDBFactory,IDBKeyRange}=require('fake-indexeddb');w.indexedDB=new IDBFactory();w.IDBKeyRange=IDBKeyRange;
 if(storage)for(const[k,v]of Object.entries(storage))w.localStorage.setItem(k,v);
 w.QM_AYAHS=Array.from({length:114},(_,i)=>cnt[i+1]);w.QM_NAMES=Array.from({length:114},(_,i)=>'S'+(i+1));
 w.FontFace=class{load(){return Promise.resolve(this)}};w.document.fonts={add(){}};
 const log=[];
 w.fetch=async(u)=>{u=String(u);log.push(u);
  if(u===RB+'lib-list.json'){if(offline||remote===undefined)throw new TypeError('offline');if(remote===404)return{ok:false,status:404};return{ok:true,json:async()=>JSON.parse(JSON.stringify(remote))}}
  if(offline&&u.startsWith('http'))throw new TypeError('offline');
  const p=u.startsWith(RB)?R+u.slice(RB.length):u.startsWith('./')?R+u.slice(2):null;
  if(!p||!fs.existsSync(p))return{ok:false,status:404,json:async()=>{throw 0}};const t=fs.readFileSync(p,'utf8');return{ok:true,json:async()=>JSON.parse(t),text:async()=>t}};
 w.eval(fs.readFileSync(R+'lib.js','utf8'));return{w,log,dom};
}
const tick=n=>new Promise(r=>setTimeout(r,n));let n=0;const ok=(c,m)=>{assert(c,m);n++;console.log('PASS',m)};
async function settingsIds(w){await w.QM.openSettings('tf');await tick(100);return[...w.document.querySelectorAll('.qm-res')].map(li=>li.dataset.id)}
async function downloadAll(w){for(const li of w.document.querySelectorAll('.qm-res')){const b=li.querySelector('.qm-rb.main');b&&b.click()}
 for(let i=0;i<600;i++){await tick(200);if(![...w.document.querySelectorAll('.qm-res')].some(li=>li.querySelector('.qm-rb.main')||li.querySelector('.qm-bar:not([hidden])')))break}
 return[...w.document.querySelectorAll('.qm-res')].map(li=>li.querySelector('.qm-err').textContent).filter(Boolean)}
async function show(w,id,s,a){w.localStorage.setItem('qm.prefs',JSON.stringify({tf:id,tab:'tf'}));await w.QM.openAyah(s,a);await tick(5);
 const b=w.document.querySelector('.qm-body');return{text:b.textContent,warn:(b.querySelector('.qm-warn')||{}).textContent||'',head:w.document.querySelector('.qm-head h2').textContent}}
(async()=>{
 const tf=BUNDLED.filter(r=>r.k==='tf').map(r=>r.id);
 let {w}=boot({remote:404});
 ok(JSON.stringify(await settingsIds(w))===JSON.stringify(tf),'Settings lists all 13 tafsirs (remote 404 → bundled)');
 const errs=await downloadAll(w);ok(errs.length===0,'all 13 download through real loader without error');
 for(const id of tf){for(const[s,a]of[[1,1],[2,255],[114,6]]){const r=await show(w,id,s,a);assert(r.text.length>0,id)}}
 ok(true,'every tafsir renders 1:1, 2:255, 114:6');
 let r=await show(w,'shawkani',114,6);ok(/114 · 1–6/.test(r.head)&&r.text.length>200,'range compression: Shawkani 114:6 shows 1–6 passage');
 r=await show(w,'shinqiti',1,1);ok(/—/.test(r.text)&&/1 · 1$/.test(r.head),'sparse: Shinqiti 1:1 empty, no borrowed passage');
 r=await show(w,'qayyim',114,6);ok(r.text.length>50,'sparse with text: Qayyim 114:6');
 for(const a of[7,8,9,10]){r=await show(w,'uthaymeen',31,a);assert(!r.text.includes('3470')&&/mənbə mətni yoxlanılır/.test(r.warn),'31:'+a)}
 ok(true,'Uthaymin 31:7–10: no "3470", shows under-verification notice');
 r=await show(w,'uthaymeen',36,1);ok(/Diqqət/.test(r.warn)&&r.text.includes('يس'),'Uthaymin 36:1: text kept with boundary warning');
 r=await show(w,'uthaymeen',31,11);ok(!r.warn&&r.text.length>100,'Uthaymin 31:11 unaffected');
 w.localStorage.setItem('qm.lang','en');w.dispatchEvent(new w.Event('qm-ui'));r=await show(w,'uthaymeen',31,7);ok(/under verification/.test(r.warn),'notice translated (en)');
 w.localStorage.setItem('qm.lang','az');
 await w.QM.openSettings('tf');await tick(50);const row=t=>w.document.querySelector('.qm-res[data-id="'+t+'"] small').textContent;
 ok(/Natamam: 3452\/6236/.test(row('uthaymeen'))&&/qısaldılmış/.test(row('uthaymeen'))&&!/Natamam/.test(row('saadi')),'Settings shows partial/abridged metadata');
 // catalog refresh
 const extra=BUNDLED.concat([{id:'zz_test',k:'tf',name:'TEST',by:'x',lang:'ar',dir:'rtl',per:true,mb:1}]);
 ({w}=boot({remote:extra}));await settingsIds(w);await tick(150);let ids=await settingsIds(w);
 ok(ids.includes('zz_test')&&JSON.parse(w.localStorage.getItem('qm.catalog.v1')).length===extra.length,'valid remote catalog adopted and persisted');
 const store=JSON.stringify({'qm.catalog.v1':JSON.stringify(extra),'qm.prefs':JSON.stringify({tf:'saadi'})});
 ({w}=boot({offline:true,storage:JSON.parse(store)}));ids=await settingsIds(w);ok(ids.includes('zz_test')&&JSON.parse(w.localStorage.getItem('qm.prefs')).tf==='saadi','offline: last good catalog used, selection kept');
 ({w}=boot({remote:BUNDLED.filter(x=>x.id!=='saadi')}));await settingsIds(w);await tick(150);ids=await settingsIds(w);ok(ids.includes('saadi')&&!w.localStorage.getItem('qm.catalog.v1'),'remote missing a bundled id rejected');
 ({w}=boot({remote:BUNDLED.concat([{id:'../x',k:'tf',name:'x',mb:1}])}));await settingsIds(w);await tick(150);ok(!w.localStorage.getItem('qm.catalog.v1'),'remote with unsafe id rejected');
 ({w}=boot({remote:{not:'array'}}));await settingsIds(w);await tick(150);ok(!w.localStorage.getItem('qm.catalog.v1')&&(await settingsIds(w)).length===13,'malformed remote rejected, bundled kept');
 ({w}=boot({storage:{'qm.catalog.v1':'{broken'}}));ok((await settingsIds(w)).length===13,'corrupt stored catalog ignored');
 console.log('tafsir loader tests:',n,'passed');process.exit(0);
})().catch(e=>{console.error('FAIL',e.stack);process.exit(1)});
