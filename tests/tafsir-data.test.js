// New tafsirs: catalog metadata, per-surah files, ayah counts, coverage, app range semantics, samples.
const fs=require('fs'),path=require('path'),assert=require('assert');const R=path.join(__dirname,'..');
const L=JSON.parse(fs.readFileSync(path.join(R,'lib-list.json'),'utf8'));let n=0;const ok=(c,m)=>{assert(c,m);n++;console.log('PASS',m)};
const cnt={};for(const l of fs.readFileSync(path.join(R,'quran-uthmani.txt'),'utf8').split('\n')){const p=l.split('|');if(p.length>=3&&/^\d+$/.test(p[0]))cnt[p[0]]=(cnt[p[0]]||0)+1}
ok(new Set(L.map(r=>r.id)).size===L.length,'no duplicate ids');
const OLD=['saadi','muyassar','mukhtasar','ibnkathir','baghawi','samani','aysar','tabari'];ok(OLD.every(id=>L.find(r=>r.id===id&&r.k==='tf')),'eight existing tafsirs kept');
ok(['irab_muyassar','irab_nahhas','irab_darwish','jadwal','seraj','ibnqutaybah'].every(id=>L.find(r=>r.id===id)),'erab and gharib entries kept');
const NEW={shawkani:['فتح القدير','الشوكاني',false,6236],qasimi:['محاسن التأويل','جمال الدين القاسمي',false,6236],uthaymeen:['تفسير ابن عثيمين','ابن عثيمين',true,3456],shinqiti:['أضواء البيان','الشنقيطي',true,2320],qayyim:['تفسير ابن القيم','ابن قيم الجوزية',true,2064]};
// app logic (lib.js entry): ex → own ayah only; otherwise an empty ayah shows the passage before it as a range
const entry=(v,a,ex)=>{if(ex)return v[a-1]||'';let f=a;while(f>1&&!v[f-1])f--;return v[f-1]||''};
for(const [id,[name,by,ex,filled]] of Object.entries(NEW)){
  const r=L.find(x=>x.id===id);ok(r&&r.k==='tf'&&r.name===name&&r.by===by&&r.per===true&&r.lang==='ar'&&!!r.ex===ex&&r.mb>0&&r.credit,id+' metadata');
  let f=0,bytes=0;for(let s=1;s<=114;s++){const p=path.join(R,'tf',id,s+'.json');bytes+=fs.statSync(p).size;const v=JSON.parse(fs.readFileSync(p,'utf8'));
    assert(Array.isArray(v)&&v.length===cnt[s]&&v.every(x=>typeof x==='string'),id+' surah '+s+' shape');
    for(let a=1;a<=v.length;a++)if(entry(v,a,ex))f++;}
  ok(true,id+' 114 files, ayah counts match Tanzil');
  ok(ex?f===filled:f===6236,id+' coverage '+f+'/6236');
  ok(Math.abs(r.mb-bytes/2**20)<1,id+' mb matches '+(bytes/2**20).toFixed(1));
  const v1=JSON.parse(fs.readFileSync(path.join(R,'tf',id,'1.json'),'utf8')),v114=JSON.parse(fs.readFileSync(path.join(R,'tf',id,'114.json'),'utf8')),v18=JSON.parse(fs.readFileSync(path.join(R,'tf',id,'18.json'),'utf8'));
  ok([v1,v18,v114].some(v=>v.some(x=>x.length>20)),id+' first/middle/last surahs have real text');
}
ok(!fs.readFileSync(path.join(R,'tf','shinqiti','2.json'),'utf8').includes('لا يوجد نص لهذه الآية'),'site placeholder text not imported');
console.log('tafsir data tests:',n,'passed');
