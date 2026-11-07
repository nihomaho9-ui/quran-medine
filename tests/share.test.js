// Share routes: native Capacitor (Filesystem cache + Share files), cancel, error, no-plugin; Web Share; download fallback.
const {JSDOM}=require('jsdom');const fs=require('fs');const path=require('path');const assert=require('assert');
const SRC=fs.readFileSync(path.join(__dirname,'..','lib.js'),'utf8');
function load(setup){const dom=new JSDOM('<!doctype html><html><head></head><body></body></html>',{runScripts:'outside-only',url:'http://localhost/',pretendToBeVisual:true});
 const w=dom.window;w.QM_AYAHS=Array(114).fill(7);w.fetch=async()=>({ok:false,json:async()=>({}),text:async()=>''});setup(w);w.eval(SRC);return w;}
const native=(w,share,fsx)=>{w.Capacitor={isNativePlatform:()=>true,Plugins:{Share:share,Filesystem:fsx}}};
let n=0;const ok=(c,m)=>{assert(c,m);n++;console.log('PASS',m)};
(async()=>{
 const calls=[];let w=load(w=>native(w,{share:async o=>{calls.push(o)}},{writeFile:async o=>{calls.push(o);return{uri:'file:///cache/share/'+o.path.split('/')[1]}}}));
 const file=new w.File([new Uint8Array([137,80,78,71])],'quran-2-255.png',{type:'image/png'});
 ok(await w.QM_SHARE.shareFile(file,'Bəqərə 2:255')==='ok','native share returns ok');
 ok(calls[0].directory==='CACHE'&&calls[0].path==='share/quran-2-255.png'&&calls[0].data==='iVBORw=='&&calls[0].recursive,'PNG written to cache as base64');
 ok(calls[1].files[0]==='file:///cache/share/quran-2-255.png'&&calls[1].title==='Bəqərə 2:255','Share called with cached file URI');
 w=load(w=>native(w,{share:async()=>{throw new Error('Share canceled')}},{writeFile:async()=>({uri:'file:///x'})}));
 ok(await w.QM_SHARE.shareFile(file,'t')==='cancel','native cancel is not an error');
 w=load(w=>native(w,{share:async()=>{throw new Error('boom')}},{writeFile:async()=>({uri:'file:///x'})}));
 ok(await w.QM_SHARE.shareFile(file,'t')==='err','native failure reported as error');
 w=load(w=>native(w,undefined,undefined));ok(await w.QM_SHARE.shareFile(file,'t')==='none','native without plugins → none (no blob download attempted)');
 const tcalls=[];w=load(w=>native(w,{share:async o=>{tcalls.push(o)}},{}));ok(await w.QM_SHARE.shareTextVia('t','abc')==='ok'&&tcalls[0].text==='abc','native text share');
 let got=null;w=load(w=>{w.navigator.canShare=()=>true;w.navigator.share=async o=>{got=o}});ok(await w.QM_SHARE.shareFile(file,'t')==='ok'&&got.files.length===1,'browser Web Share with file');
 w=load(w=>{w.navigator.canShare=()=>true;w.navigator.share=async()=>{const e=new Error('x');e.name='AbortError';throw e}});ok(await w.QM_SHARE.shareFile(file,'t')==='cancel','browser cancel');
 w=load(()=>{});ok(await w.QM_SHARE.shareFile(file,'t')==='none'&&await w.QM_SHARE.shareTextVia('t','x')==='none','browser without Web Share → none (caller downloads / copies)');
 ok(/if \(r === "err"\) toast\(T\("Paylaşmaq alınmadı"\)\);\s*save\(\);/.test(SRC),'web fallback downloads PNG after none/err');
 const D=eval('('+SRC.match(/const DICT = (\{.*?\});\n/s)[1]+')');ok(['Paylaşmaq alınmadı','Paylaşma bu cihazda mümkün deyil'].every(k=>D[k]&&D[k].length===4),'share errors translated');
 console.log('share tests:',n,'passed');})().catch(e=>{console.error('FAIL',e.stack);process.exit(1)});
