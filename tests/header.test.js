// Reader header: only fullscreen + headphones; settings stays reachable from home.
const fs=require('fs'),path=require('path'),assert=require('assert');const {JSDOM}=require('jsdom');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const d=new JSDOM(html).window.document;const acts=[...d.querySelectorAll('header .hdr-acts button')];
assert.deepStrictEqual(acts.map(b=>b.id),['full-btn','listen-btn'],'header buttons: '+acts.map(b=>b.id||b.getAttribute('aria-label')));
assert(!d.querySelector('header [onclick*="openSettings"]'),'no settings shortcut in reader header');
assert(!d.querySelector('#hifz-btn'),'no hifz button');
assert(d.querySelector('#menu-btn[onclick*="openSettings"]'),'home settings button kept');
assert(d.querySelector('#listen-fab'),'landscape listen button kept');
console.log('header tests: PASS');
