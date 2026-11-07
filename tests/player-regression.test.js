const {JSDOM}=require('jsdom');const fs=require('fs');const assert=require('assert');
const dom=new JSDOM('<!doctype html><html><head></head><body><div id="gate" hidden></div><div class="qm-back" hidden></div><div class="qm-hz" hidden></div><div class="qm-selbar" hidden></div><button id="listen-btn"></button><button id="listen-fab"></button></body></html>',{runScripts:'outside-only',url:'http://localhost/',pretendToBeVisual:true});
const w=dom.window;let plays=[];const els=[];let failNext=null;
class FA{constructor(){this.paused=true;this.currentTime=0;this.duration=NaN;this.playbackRate=1;this.defaultPlaybackRate=1;this.l={};this.src='';els.push(this)}
 addEventListener(e,f){(this.l[e]=this.l[e]||[]).push(f)} fire(e){(this.l[e]||[]).forEach(f=>f())}
 play(){plays.push(this.src);if(failNext){const e=failNext;failNext=null;return Promise.reject(e)}this.paused=false;this.fire('play');return Promise.resolve()} pause(){this.paused=true} load(){this.playbackRate=this.defaultPlaybackRate} removeAttribute(){}}
w.Audio=FA;w.QM_AYAHS=Array(114).fill(7);w.caches={open:async()=>({match:async()=>null,put:async()=>{}})};
let page={n:2,keys:['2:1','2:2']};const hl=[],toasts=[];w.QM_HL=k=>hl.push(k);w.QM_PAGE=()=>page;w.QM_GOTO=()=>{};w.QM_TOAST=t=>toasts.push(t);
w.QM={t:k=>({Yavaş:'Slower','Sürətli':'Faster',Qari:'Reciter','Dinlə':'Listen'})[k]||k};
w.eval(fs.readFileSync(''+require('path').join(__dirname,'..')+'/audio.js','utf8'));
const tick=(n=40)=>new Promise(r=>setTimeout(r,n));const $=s=>w.document.querySelector(s);let pass=0;const ok=(c,m)=>{assert(c,m);pass++;console.log('PASS',m)};
(async()=>{await tick();const lb=$('.qlb');
w.QA.toggle();await tick();ok(!lb.hidden&&plays.length===0,'open: visible, no autoplay');
$('.qlb-pause').click();await tick();w.QA.toggle();await tick();ok(lb.hidden,'1 headphones hides player while playing');
ok($('#listen-btn').classList.contains('on')&&$('#listen-fab').classList.contains('on'),'1 buttons show active while audio plays hidden');
w.QA.toggle();await tick();ok(!lb.hidden,'1 reopen shows player');
$('.qlb-pause').click();const n0=plays.length;const pk=$('.qlb-pick');pk.value='husary';pk.dispatchEvent(new w.Event('change'));await tick();
ok(plays.length===n0&&$('.qlb-pause').classList.contains('paused'),'2 qari change while paused stays paused');
$('.qlb-pause').click();await tick();ok(plays.length===n0+1&&/Husary/.test(plays.at(-1)),'2 resume after qari change loads new qari');
const cur=els.find(e=>!e.paused);cur.fire('ended');await tick();
page={n:50,keys:['50:1']};$('.qlb-pause').click();await tick();ok(hl.at(-1)==='50:1','3 after natural end, play follows new page first ayah');
$('.qlb-stop').click();await tick();
ok($('.qlb-rep button').getAttribute('aria-label')==='Slower'&&$('.qlb-pick').title==='Reciter'&&$('#listen-fab').getAttribute('aria-label')==='Listen','4 labels/tooltips translated');
$('.qm-back').hidden=false;await tick();ok(lb.hidden,'5 hidden while ayah/settings sheet open');
$('.qm-back').hidden=true;await tick();ok(!lb.hidden,'5 returns after sheet closes');
$('.qm-hz').hidden=false;await tick();ok(lb.hidden,'5 hidden under Hifz');$('.qm-hz').hidden=true;
$('.qm-selbar').hidden=false;await tick();ok(lb.hidden,'5 hidden with multi-select bar');$('.qm-selbar').hidden=true;await tick();
$('#gate').hidden=false;await tick();ok(lb.hidden,'6 hidden on home');$('#gate').hidden=true;await tick();ok(lb.hidden,'6 stays closed after returning to reader');
w.QA.toggle();await tick();failNext=Object.assign(new Error('x'),{name:'AbortError'});$('.qlb-pause').click();await tick();
ok(toasts.length===0,'loading interrupted (AbortError) shows no false error');
failNext=Object.assign(new Error('x'),{name:'NotSupportedError'});$('.qlb-stop').click();$('.qlb-pause').click();await tick();ok(toasts.length===1,'real failure still reported');
const css=[...w.document.querySelectorAll('style')].map(s=>s.textContent).join('');
ok(/body\.qlb-on \.page\{margin-bottom/.test(css)&&!/\.num\{padding-top/.test(css),'7 text padding independent of .num');
const ix=fs.readFileSync(''+require('path').join(__dirname,'..')+'/index.html','utf8');ok(/id="listen-fab"/.test(ix)&&/max-height: 520px\) \{ \.listen-fab \{ display: grid/.test(ix)&&/min-height: 521px\) \{ \.listen-fab \{ display: grid/.test(ix),'7 landscape listen button in both landscape modes');
ok(/qlb-n\{[^}]*min-width:40px;min-height:40px/.test(css)&&/qlb-stop\{[^}]*width:36px/.test(css),'touch targets >=36-40px');
console.log('regression tests:',pass,'passed');})().catch(e=>{console.error('FAIL',e.message);process.exit(1)});
