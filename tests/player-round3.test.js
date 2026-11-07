// Player fixes round 3: paused-while-loading, stale qari marker, stopped ⏭ across pages, word pop-ups, error i18n, 401–480px wrap.
const {JSDOM}=require('jsdom');const fs=require('fs');const path=require('path');const assert=require('assert');
const ROOT=path.join(__dirname,'..');
const dom=new JSDOM('<!doctype html><html><head></head><body><div id="gate" hidden></div><div class="qm-wpop" hidden></div><div class="qm-pop" hidden></div><button id="listen-btn"></button></body></html>',{runScripts:'outside-only',url:'http://localhost/',pretendToBeVisual:true});
const w=dom.window;const els=[];let gate=null,failNext=null;
class FA{constructor(){this.paused=true;this.currentTime=0;this.duration=NaN;this.playbackRate=1;this.defaultPlaybackRate=1;this.l={};this.src='';els.push(this)}
 addEventListener(e,f){(this.l[e]=this.l[e]||[]).push(f)} fire(e){(this.l[e]||[]).forEach(f=>f())}
 play(){if(failNext){const e=failNext;failNext=null;return Promise.reject(e)}this.paused=false;this.fire('play');return Promise.resolve()} pause(){this.paused=true} load(){} removeAttribute(){}}
w.Audio=FA;w.QM_AYAHS=Array(114).fill(7);
w.caches={open:async()=>({match:async()=>{if(gate)await gate;return null},put:async()=>{}})};
let page={n:2,keys:['2:1','2:2','2:3']};const hl=[],toasts=[],gotos=[];
w.QM_HL=k=>hl.push(k);w.QM_PAGE=()=>page;w.QM_GOTO=k=>{gotos.push(k);page={n:3,keys:['2:4','2:5']};hl.push(k)};w.QM_TOAST=t=>toasts.push(t);
w.QM={t:k=>k==='Səs açılmadı'?'Audio could not play':k};
w.eval(fs.readFileSync(path.join(ROOT,'audio.js'),'utf8'));
const tick=(n=40)=>new Promise(r=>setTimeout(r,n));const $=s=>w.document.querySelector(s);let n=0;const ok=(c,m)=>{assert(c,m);n++;console.log('PASS',m)};
const playing=()=>els.filter(e=>!e.paused).length;
(async()=>{await tick();const lb=$('.qlb');w.QA.toggle();await tick();
let rel;gate=new Promise(r=>rel=r);$('.qlb-pause').click();await tick(5);$('.qlb-pause').click();rel();gate=null;await tick();
ok(playing()===0&&$('.qlb-pause').classList.contains('paused'),'pause during loading stays silent');
$('.qlb-pause').click();await tick();ok(playing()===1,'resume after paused load plays');
$('.qlb-stop').click();await tick();
const pk=$('.qlb-pick');$('.qlb-pause').click();await tick();$('.qlb-pause').click();pk.value='husary';pk.dispatchEvent(new w.Event('change'));
$('.qlb-n:last-child').click();await tick();const a1=hl.at(-1),c1=hl.filter(k=>k===a1).length;$('.qlb-pause').click();await tick();$('.qlb-pause').click();await tick();
ok(hl.filter(k=>k===a1).length===c1,'qari marker cleared by next play (resume does not restart)');
$('.qlb-stop').click();await tick();
page={n:2,keys:['2:1','2:2','2:3']};w.QM_CTX='2:3';$('.qlb-n:last-child').click();await tick();
ok(gotos.at(-1)==='2:4','stopped ⏭ past page end turns the page');
$('.qlb-pause').click();await tick();ok(hl.at(-1)==='2:4','▶ then plays the selected ayah 2:4');
$('.qlb-stop').click();await tick();
$('.qm-wpop').hidden=false;await tick();ok(lb.hidden,'hidden under word balloon');$('.qm-wpop').hidden=true;await tick();
$('.qm-pop').hidden=false;await tick();ok(lb.hidden,'hidden under pop-up');$('.qm-pop').hidden=true;await tick();ok(!lb.hidden,'back after pop-ups close');
failNext=Object.assign(new Error('x'),{name:'NotSupportedError'});$('.qlb-pause').click();await tick();ok(toasts.at(-1)==='Audio could not play','engine error translated');
const css=[...w.document.querySelectorAll('style')].map(s=>s.textContent).join('');const m480=css.match(/@media \(max-width:480px\)\{.*?\}\}/);ok(m480&&!/flex-wrap/.test(m480[0])&&/\.qlb-t\{display:none/.test(m480[0]),'phones up to 480px: single compact row (no wrap)');
const D=eval('('+fs.readFileSync(path.join(ROOT,'lib.js'),'utf8').match(/const DICT = (\{.*?\});\n/s)[1]+')');
ok(['Səs açılmadı','İnternet yoxdur — surəni əvvəlcə endirin'].every(k=>D[k]&&D[k].length===4),'both engine errors in 5 languages');
console.log('round3 tests:',n,'passed');})().catch(e=>{console.error('FAIL',e.message);process.exit(1)});
