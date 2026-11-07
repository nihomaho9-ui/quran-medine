// Measured placement with mocked geometry (jsdom has no layout): the card must never intersect verse lines,
// header, page number or fab; it picks full/mini/col/dot by the real gap and hides (headphones = pause) at zero gap.
const {JSDOM}=require('jsdom');const fs=require('fs');const path=require('path');const assert=require('assert');const R=path.join(__dirname,'..');
let n=0;const ok=(c,m)=>{assert(c,m);n++;console.log('PASS',m)};const tick=(t=30)=>new Promise(r=>setTimeout(r,t));
async function make(W,H,geo){
 const dom=new JSDOM('<!doctype html><body><div id="gate" hidden></div><header></header><main class="page" id="page"></main><div class="num" id="pos">9</div><button id="listen-btn"></button><button id="listen-fab"></button></body>',{runScripts:'outside-only',url:'http://localhost/',pretendToBeVisual:true});
 const w=dom.window,d=w.document;Object.defineProperty(w,'innerWidth',{value:W,configurable:true});Object.defineProperty(w,'innerHeight',{value:H,configurable:true});
 const set=(e,[l,t,r,b])=>{e.getBoundingClientRect=()=>({left:l,top:t,right:r,bottom:b,width:r-l,height:b-t})};
 const pg=d.getElementById('page');(geo.lines||[]).forEach(g=>{const x=d.createElement('div');x.className='line';pg.append(x);set(x,g)});
 if(geo.header)set(d.querySelector('header'),geo.header);if(geo.num)set(d.getElementById('pos'),geo.num);if(geo.fab)set(d.getElementById('listen-fab'),geo.fab);
 class FA{constructor(){this.paused=true;this.currentTime=0;this.duration=10;this.l={}}addEventListener(e,f){(this.l[e]=this.l[e]||[]).push(f)}play(){this.paused=false;(this.l.play||[]).forEach(f=>f());return Promise.resolve()}pause(){this.paused=true}load(){}removeAttribute(){}}
 const toasts=[];let rs=0;w.addEventListener('resize',()=>rs++);
 Object.assign(w,{Audio:FA,QM_AYAHS:Array(114).fill(7),caches:{open:async()=>({match:async()=>null,put:async()=>{}})},QM_PAGE:()=>({n:9,keys:['2:58']}),QM_HL:()=>{},QM_GOTO:()=>{},QM_TOAST:t=>toasts.push(t)});
 w.eval(fs.readFileSync(path.join(R,'audio.js'),'utf8'));await tick();
 const snap=()=>JSON.stringify([pg.getAttribute('style'),[...pg.children].map(x=>x.getAttribute('style'))]);
 return {w,d,lb:d.querySelector('.qlb'),toasts,rs:()=>rs,snap,geo};
}
const box=lb=>{const s=lb.style;return {l:parseFloat(s.left),t:parseFloat(s.top),r:parseFloat(s.left)+parseFloat(s.width),b:parseFloat(s.top)+parseFloat(s.height)}};
const hit=(a,[l,t,r,b])=>a.l<r&&a.r>l&&a.t<b&&a.b>t;
const clear=(c,geo)=>[...(geo.lines||[]),geo.header,geo.num,geo.fab].filter(Boolean).every(g=>!hit(c,g));
const lines=(l,t,r,b,k=15)=>Array.from({length:k},(_,i)=>[l,t+(b-t)*i/k,r,t+(b-t)*(i+1)/k]);
(async()=>{
 // 1 portrait phone, sufficient gap (as in the user's screenshot: verses end ~78%, page number at the bottom)
 let g={header:[0,0,390,56],lines:lines(10,70,380,660),num:[180,720,210,744]};let E=await make(390,780,g);const s0=E.snap();
 E.w.QA.toggle();await tick();let c=box(E.lb);
 ok(!E.lb.hidden&&E.lb.dataset.mode==='full','sufficient gap: full slim row shown');
 ok(c.b-c.t===34&&c.t>=664&&c.b<=716,'sufficient gap: 34px card sits between last verse and page number ('+c.t+'..'+c.b+')');
 ok(clear(c,g),'sufficient gap: no intersection with verses/header/page number');
 E.d.querySelector('.qlb-more').click();await tick();
 ok(E.d.querySelector('.qlb-adv .qlb-cont')&&E.d.querySelector('.qlb-adv .qlb-rep'),'continuous + speed reachable from ⋯');
 E.w.QA.toggle();await tick();ok(E.snap()===s0&&E.rs()===0,'reader geometry invariant, no resize, open/close');
 // 2 small gap: room only for the mini row (172px) → qari moves to ⋯
 g={header:[0,0,390,56],lines:lines(10,70,380,700),num:[110,742,280,770]};E=await make(390,780,g);
 E.w.QA.toggle();await tick();c=box(E.lb);
 ok(E.lb.dataset.mode==='full'||E.lb.dataset.mode==='mini','small gap: still a row');ok(clear(c,g),'small gap: no overlap');
 g={header:[0,0,390,56],lines:lines(10,70,380,736),num:[100,746,290,776]};E=await make(390,780,g);
 E.w.QA.toggle();await tick();
 ok(E.lb.hidden||clear(box(E.lb),g),'tiny 6px gap: never overlaps (mode '+E.lb.dataset.mode+')');
 // 3 landscape: verses fill height, blank sides → vertical column in side margin
 g={lines:lines(200,4,640,386),fab:[796,6,836,46]};E=await make(844,390,g);
 E.w.QA.toggle();await tick();c=box(E.lb);
 ok(E.lb.dataset.mode!=='none'&&clear(c,g),'landscape: placed in side blank area, mode '+E.lb.dataset.mode);
 // 4 zero gap: verses cover the whole viewport → card hidden, headphones toggles pause, toast shown
 g={lines:lines(0,0,390,780)};E=await make(390,780,g);const s4=E.snap();
 E.w.QA.toggle();await tick();
 ok(E.lb.hidden&&E.lb.dataset.mode==='none'&&E.toasts.length===1,'zero gap: no card, user told there is no room');
 E.w.QA.play(2,58);await tick();E.w.QA.toggle();await tick();
 ok(E.lb.hidden&&E.d.querySelector('.qlb-pause').classList.contains('paused'),'zero gap: headphones button pauses instead of showing over verses');
 ok(E.snap()===s4&&E.rs()===0,'zero gap: reader untouched');
 // 5 collision guard follows changes: page re-render moves verses down → card re-placed, still clear
 g={header:[0,0,390,56],lines:lines(10,70,380,600),num:[180,720,210,744]};E=await make(390,780,g);E.w.QA.toggle();await tick();
 const c1=box(E.lb);g.lines=lines(10,70,380,670);[...E.d.querySelectorAll('.line')].forEach((x,i)=>{const[l,t,r,b]=g.lines[i];x.getBoundingClientRect=()=>({left:l,top:t,right:r,bottom:b,width:r-l,height:b-t})});
 E.w.dispatchEvent(new E.w.Event('resize'));await tick(60);const c2=box(E.lb);
 ok(c2.t!==c1.t&&clear(c2,g),'re-measured after layout change, still clear');
 console.log('placement tests:',n,'passed');process.exit(0)})().catch(e=>{console.error('FAIL',e.message);process.exit(1)});
