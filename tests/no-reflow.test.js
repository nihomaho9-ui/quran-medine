// The listen player must never change the mushaf layout: no resize events, no style/class changes on the reader,
// no CSS that targets the page, page number or body state. jsdom has no layout engine, so this checks the inputs
// the reader's fit() depends on (window resize events, #page/.num styles), not rendered pixels.
const {JSDOM}=require('jsdom');const fs=require('fs');const path=require('path');const assert=require('assert');const R=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(R,'index.html'),'utf8');
const dom=new JSDOM('<!doctype html><html><head></head><body><div id="gate" hidden></div><header></header><main class="page" id="page" style="--rows:15"><div class="line">x</div></main><div class="num" id="pos">9</div><div class="qm-back" hidden></div><div class="qm-hz" hidden></div><button id="listen-btn"></button></body></html>',{runScripts:'outside-only',url:'http://localhost/',pretendToBeVisual:true});
const w=dom.window;const els=[];
class FA{constructor(){this.paused=true;this.currentTime=0;this.duration=10;this.playbackRate=1;this.l={};this.src='';els.push(this)}addEventListener(e,f){(this.l[e]=this.l[e]||[]).push(f)}fire(e){(this.l[e]||[]).forEach(f=>f())}play(){this.paused=false;this.fire('play');return Promise.resolve()}pause(){this.paused=true}load(){}removeAttribute(){}}
w.Audio=FA;w.QM_AYAHS=Array(114).fill(7);w.caches={open:async()=>({match:async()=>null,put:async()=>{}})};w.QM_PAGE=()=>({n:9,keys:['2:58','2:59']});w.QM_HL=()=>{};w.QM_GOTO=()=>{};w.QM_TOAST=()=>{};
let resizes=0;w.addEventListener('resize',()=>resizes++);
w.eval(fs.readFileSync(path.join(R,'audio.js'),'utf8'));
const tick=(n=40)=>new Promise(r=>setTimeout(r,n));const $=s=>w.document.querySelector(s);let n=0;const ok=(c,m)=>{assert(c,m);n++;console.log('PASS',m)};
const snap=()=>JSON.stringify(['#page','#pos','header','body','html'].map(s=>{const e=$(s);return[e.getAttribute('style'),e.className.replace(/\bqlb-on\b/,'').trim()]}));
(async()=>{await tick();const base=snap();const lb=$('.qlb');
 for(let i=0;i<3;i++){w.QA.toggle();await tick();w.QA.toggle();await tick()}
 ok(resizes===0,'toggle ×3: no resize events (reader fit() not re-run)');ok(snap()===base,'toggle ×3: page, page number, header, body styles unchanged');
 w.QA.toggle();await tick();$('.qlb-pause').click();await tick();els.forEach(e=>e.fire('timeupdate'));$('.qlb-pause').click();await tick();$('.qlb-stop').click();await tick();
 ok(resizes===0&&snap()===base,'play / progress / pause / stop: no resize, no layout style change');
 $('.qm-back').hidden=false;await tick();$('.qm-back').hidden=true;await tick();$('.qm-hz').hidden=false;await tick();$('.qm-hz').hidden=true;await tick();
 ok(resizes===0&&snap()===base,'overlay show/hide: no resize, no layout style change');
 const css=[...w.document.querySelectorAll('style')].map(s=>s.textContent).join('');
 ok(!/qlb-on/.test(css)&&!/\.page\b|#page|\.num\b|--qlb-h|\bbody\b|\bhtml\b/.test(css),'player stylesheet has no rules for the reader, page number, body or html');
 ok(/\.qlb\{position:fixed/.test(css),'player is position:fixed (out of reader flow)');
 ok(!fs.readFileSync(path.join(R,'audio.js'),'utf8').includes('dispatchEvent(new Event("resize"))'),'no synthetic resize in audio.js');
 ok(!/qlb-on/.test(html),'index.html has no CSS reacting to the player state');
 console.log('no-reflow tests:',n,'passed');process.exit(0)})().catch(e=>{console.error('FAIL',e.message);process.exit(1)});
