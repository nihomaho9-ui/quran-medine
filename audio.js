// Recitation (EveryAyah): stream an ayah, play on through the surah, download an ayah or a whole surah to the device.
(function () {
  const AYAHS = window.QM_AYAHS;
  const RECITERS = [
    { id: "maher", name: "Maher Al Muaiqly", ea: "MaherAlMuaiqly128kbps", rel: "maher-128kbps-v1" },
    { id: "husary", name: "Husary", ea: "Husary_128kbps", rel: "husary-128kbps-v1" },
    { id: "qatami", name: "Nasser Al Qatami", ea: "Nasser_Alqatami_128kbps", rel: "qatami-128kbps-v1" },
    { id: "dosari", name: "Yasser Al Dosari", ea: "Yasser_Ad-Dussary_128kbps", rel: "dosari-128kbps-v1" },
    { id: "ayyub", name: "Muhammad Ayyub", ea: "Muhammad_Ayyoub_128kbps", rel: "ayyub-128kbps-v1" },
    { id: "jibreel", name: "Muhammad Jibreel", ea: "Muhammad_Jibreel_128kbps", rel: "jibreel-128kbps-v1" },
    { id: "shuraim", name: "Saud Ash-Shuraim", ea: "Saood_ash-Shuraym_128kbps", rel: "shuraym-128kbps-v1" },
  ];
  const CACHE = "qm-audio-v1";
  const p3 = (n) => String(n).padStart(3, "0");
  const rec = () => RECITERS.find((r) => r.id === localStorage.getItem("qm.reciter")) || RECITERS[0];
  const url = (r, s, a) => "https://everyayah.com/data/" + r.ea + "/" + p3(s) + p3(a) + ".mp3";
  const zipUrl = (r, s) => "https://github.com/nihomaho9-ui/quran-medine-audio/releases/download/" + r.rel + "/" + p3(s) + ".zip";
  const doneKey = (r, s) => "qm.audio." + r.id + "." + s;
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };

  const memo = new Map(); // "rec:s:a" → blob: URL kept for the session so Cache API is not hit between ayahs
  const mkey = (r, s, a) => r.id + ":" + s + ":" + a;
  function memoPut(r, s, a, buf) {
    const k = mkey(r, s, a);
    const prev = memo.get(k); if (prev) { try { URL.revokeObjectURL(prev); } catch (e) {} }
    const u = URL.createObjectURL(new Blob([buf], { type: "audio/mpeg" }));
    memo.set(k, u); return u;
  }
  async function cached(r, s, a) {
    const k = mkey(r, s, a); if (memo.has(k)) return memo.get(k);
    try {
      const c = await caches.open(CACHE); const h = await c.match(url(r, s, a));
      if (!h) return null;
      const buf = await h.arrayBuffer();
      return memoPut(r, s, a, buf);
    } catch (e) { return null; }
  }
  async function putMp3(c, r, s, a, buf) {
    await c.put(url(r, s, a), new Response(buf, { headers: { "Content-Type": "audio/mpeg" } }));
    memoPut(r, s, a, buf);
  }

  // the release zips are "stored" (no compression): read entries straight from the local headers
  function unzipStored(buf) {
    const v = new DataView(buf), out = {}; let o = 0;
    while (o + 30 < buf.byteLength && v.getUint32(o, true) === 0x04034b50) {
      const m = v.getUint16(o + 8, true), sz = v.getUint32(o + 18, true), nl = v.getUint16(o + 26, true), xl = v.getUint16(o + 28, true);
      const name = new TextDecoder().decode(new Uint8Array(buf, o + 30, nl)); const start = o + 30 + nl + xl;
      if (m === 0) out[name] = buf.slice(start, start + sz);
      o = start + sz;
    }
    return out;
  }

  async function saveAyah(r, s, a) {
    if (memo.has(mkey(r, s, a))) return;
    const c = await caches.open(CACHE);
    const hit = await c.match(url(r, s, a));
    if (hit) { memoPut(r, s, a, await hit.arrayBuffer()); return; }
    const res = await fetch(url(r, s, a)); if (!res.ok) throw new Error("HTTP " + res.status);
    await putMp3(c, r, s, a, await res.arrayBuffer());
  }
  async function saveSurah(r, s, prog) {
    const c = await caches.open(CACHE), n = AYAHS[s - 1];
    try { // one zip from the GitHub release (works in the app; browsers may block it — then ayah by ayah)
      prog(0, 1);
      if (!r.rel) throw new Error("no zip");
      const res = await fetch(zipUrl(r, s)); if (!res.ok) throw new Error("HTTP " + res.status);
      const files = unzipStored(await res.arrayBuffer());
      let k = 0; for (let a = 1; a <= n; a++) { const f = files[p3(s) + p3(a) + ".mp3"]; if (!f) throw new Error("zip"); await putMp3(c, r, s, a, f); prog(++k, n); }
    } catch (e) {
      if (!navigator.onLine) throw e;
      let done = 0, next = 1, failed = 0;
      async function worker() { while (next <= n) { const a = next++; let ok = false; for (let t = 0; t < 3 && !ok; t++) { try { await saveAyah(r, s, a); ok = true; } catch (er) {} } if (!ok) failed++; prog(++done, n); } }
      await Promise.all(Array.from({ length: 6 }, worker));
      if (failed) throw new Error(failed + " ayə");
    }
    localStorage.setItem(doneKey(r, s), "1");
  }

  const A = [new Audio(), new Audio()];
  A.forEach((x) => { x.preload = "auto"; });
  let curA = 0;
  const audio = () => A[curA];
  let st = { s: 0, a: 0, cont: false, playing: false, paused: false, left: 0, gen: 0 }, ui = null;
  let nextReady = null, surahPull = null, hydrateJob = null;
  const listeners = new Set();
  const notify = () => { listeners.forEach((f) => f()); paintBar && paintBar(); };
  const reps = () => Math.min(9, Math.max(1, +localStorage.getItem("qm.audio.rep") || 1));
  const kick = (el) => { const p = el.play(); if (p && p.catch) p.catch(() => {}); };

  function markSurahIfFull(r, s) {
    if (st.playing) return; // never scan Cache during playback
    (async () => {
      try {
        if (localStorage.getItem(doneKey(r, s))) return;
        const c = await caches.open(CACHE), n = AYAHS[s - 1];
        for (let a = 1; a <= n; a++) if (!(await c.match(url(r, s, a)))) return;
        localStorage.setItem(doneKey(r, s), "1");
        notify();
      } catch (e) {}
    })();
  }
  function warm(r, s, a) {
    if (a < 1 || a > AYAHS[s - 1]) return;
    if (memo.has(mkey(r, s, a))) return;
    saveAyah(r, s, a).then(() => markSurahIfFull(r, s)).catch(() => {});
  }
  function pullSurah(r, s) {
    if (!navigator.onLine || localStorage.getItem(doneKey(r, s))) return;
    const key = r.id + ":" + s;
    if (surahPull && surahPull.key === key) return;
    const job = { key };
    surahPull = job;
    saveSurah(r, s, () => {}).then(() => {
      if (surahPull === job) surahPull = null;
      hydrateSurah(r, s);
      notify();
    }).catch(() => { if (surahPull === job) surahPull = null; });
  }
  // Load every ayah of this surah into RAM blob URLs once — then ayah switches are sync
  async function hydrateSurah(r, s) {
    const key = r.id + ":" + s, n = AYAHS[s - 1], prefix = key + ":";
    hydrateJob = key;
    for (const k of [...memo.keys()]) {
      if (k.startsWith(prefix)) continue;
      const u = memo.get(k);
      try { URL.revokeObjectURL(u); } catch (e) {}
      memo.delete(k);
    }
    try {
      const c = await caches.open(CACHE);
      for (let a = 1; a <= n; a++) {
        if (hydrateJob !== key) return;
        if (memo.has(mkey(r, s, a))) continue;
        const h = await c.match(url(r, s, a));
        if (h) memoPut(r, s, a, await h.arrayBuffer());
        if (a % 10 === 0) await new Promise((res) => setTimeout(res, 0));
      }
    } catch (e) {}
    if (hydrateJob === key && st.playing && st.s === s) armStandby(r, s, st.a);
  }
  async function resolveSrc(r, s, a) {
    const k = mkey(r, s, a);
    if (memo.has(k)) return memo.get(k);
    const hit = await cached(r, s, a);
    if (hit) return hit;
    if (localStorage.getItem(doneKey(r, s))) localStorage.removeItem(doneKey(r, s));
    return url(r, s, a);
  }
  function armStandby(r, s, a) {
    const n = a + 1;
    if (!st.cont || n > AYAHS[s - 1]) { nextReady = null; return; }
    const stand = A[1 - curA];
    const token = { r: r.id, s, a: n, el: stand };
    nextReady = token;
    const apply = (src) => {
      if (nextReady !== token) return;
      token.src = src;
      if (stand.src !== src) {
        try { stand.pause(); stand.src = src; stand.load(); } catch (e) {}
      }
    };
    const k = mkey(r, s, n);
    if (memo.has(k)) apply(memo.get(k));
    else resolveSrc(r, s, n).then(apply).catch(() => {});
    // also prefetch n+1 into memo only (no second element)
    if (n + 1 <= AYAHS[s - 1] && !memo.has(mkey(r, s, n + 1))) warm(r, s, n + 1);
  }
  // Instant handoff when next blob is already on the standby element
  function advance() {
    if (st.left > 0) { st.left--; play(st.s, st.a, true); return; }
    if (!(st.cont && st.a < AYAHS[st.s - 1])) { st.playing = false; st.paused = false; notify(); return; }
    const s = st.s, a = st.a + 1, r = rec();
    const ready = nextReady && nextReady.r === r.id && nextReady.s === s && nextReady.a === a && nextReady.src;
    if (ready) {
      const gen = ++st.gen;
      A[curA].pause();
      curA = 1 - curA;
      nextReady = null;
      st.s = s; st.a = a; st.playing = true; st.paused = false;
      kick(audio());
      armStandby(r, s, a);
      notify();
      queueMicrotask(() => { if (st.gen === gen) window.QM_HL && window.QM_HL(s + ":" + a); });
      setTimeout(() => { if (st.gen === gen && st.playing) window.QM_GOTO && window.QM_GOTO(s + ":" + a); }, 150);
      return;
    }
    // memo hit without standby — still sync-ish
    const src = memo.get(mkey(r, s, a));
    if (src) {
      const gen = ++st.gen;
      A[1 - curA].pause();
      st.s = s; st.a = a; st.playing = true; st.paused = false;
      try { audio().src = src; } catch (e) {}
      kick(audio());
      armStandby(r, s, a);
      notify();
      queueMicrotask(() => { if (st.gen === gen) window.QM_HL && window.QM_HL(s + ":" + a); });
      setTimeout(() => { if (st.gen === gen && st.playing) window.QM_GOTO && window.QM_GOTO(s + ":" + a); }, 150);
      return;
    }
    play(s, a).then(() => setTimeout(() => { if (st.playing && st.s === s && st.a === a) window.QM_GOTO && window.QM_GOTO(s + ":" + a); }, 150));
  }
  async function play(s, a, rep) {
    const r = rec(); const gen = ++st.gen;
    if (st.s !== s || st.a !== a || !rep) st.left = reps() - 1;
    st.s = s; st.a = a; st.playing = true; st.paused = false; notify();
    hydrateSurah(r, s);
    let src = null, useStandby = false;
    if (nextReady && nextReady.r === r.id && nextReady.s === s && nextReady.a === a && nextReady.src) {
      src = nextReady.src; useStandby = true;
    }
    nextReady = null;
    if (!src) {
      const k = mkey(r, s, a);
      src = memo.has(k) ? memo.get(k) : await resolveSrc(r, s, a);
    }
    if (gen !== st.gen) return;
    if (useStandby) {
      A[curA].pause();
      curA = 1 - curA;
    } else {
      A[1 - curA].pause();
      try { audio().src = src; } catch (e) {}
    }
    const el = audio();
    if (!String(src).startsWith("blob:") && navigator.onLine) warm(r, s, a);
    if (st.cont) {
      if (!localStorage.getItem(doneKey(r, s))) pullSurah(r, s);
      armStandby(r, s, a);
    } else if (navigator.onLine) warm(r, s, a + 1);
    try { await el.play(); } catch (e) {
      if (gen !== st.gen) return;
      st.playing = false; st.paused = false; notify();
      window.QM_TOAST && window.QM_TOAST(navigator.onLine ? "Səs açılmadı" : "İnternet yoxdur — surəni əvvəlcə endirin");
    }
    if (gen === st.gen) window.QM_HL && window.QM_HL(s + ":" + a);
  }
  function pause() {
    if (!st.playing || st.paused) return;
    audio().pause(); st.paused = true; notify();
  }
  function resume() {
    if (!st.playing || !st.paused) return;
    audio().play().then(() => { st.paused = false; notify(); }).catch(() => {
      st.playing = false; st.paused = false; notify();
    });
  }
  function stop() {
    st.gen++; hydrateJob = null;
    A.forEach((x) => { x.pause(); try { x.removeAttribute("src"); x.load(); } catch (e) {} });
    st.playing = false; st.paused = false; nextReady = null; notify();
  }
  function onEnded() { advance(); }
  function onErr() {
    if (!st.playing) return;
    // if continuous and next exists, skip the broken ayah instead of dying
    if (st.cont && st.a < AYAHS[st.s - 1]) { advance(); return; }
    st.playing = false; st.paused = false; notify();
    window.QM_TOAST && window.QM_TOAST(navigator.onLine ? "Səs açılmadı" : "İnternet yoxdur — surəni əvvəlcə endirin");
  }
  A.forEach((x) => {
    x.addEventListener("ended", () => { if (x === audio()) onEnded(); });
    x.addEventListener("error", () => { if (x === audio()) onErr(); });
    x.addEventListener("canplaythrough", () => {
      if (nextReady && nextReady.el === x) nextReady.can = true;
    });
  });

  // listen mini-bar (style C): shows while an ayah plays
  const lb = el("div", "qlb"); lb.hidden = true;
  const lbLine = el("div", "qlb-line"), lbFill = el("i"); lbLine.append(lbFill);
  const lbT = el("span", "qlb-t", "0:00");
  const lbPrev = el("button", "qlb-n", "⏮"), lbPause = el("button", "qlb-pause"), lbStop = el("button", "qlb-stop"), lbNext = el("button", "qlb-n", "⏭");
  lbPause.append(el("i")); lbStop.append(el("i"));
  lbStop.title = "Dayandır"; lbPause.title = "Pauza"; lbPrev.title = "Əvvəlki ayə"; lbNext.title = "Növbəti ayə";
  lbPause.setAttribute("aria-label", "Pauza");
  const lbCont = el("button", "qlb-cont", "»"); lbCont.title = "Davam et — ayələri ard-arda oxu";
  lbCont.setAttribute("aria-label", "Davam et"); lbCont.setAttribute("aria-pressed", "false");
  const lbRep = el("div", "qlb-rep"), lbM = el("button", "", "−"), lbN = el("b", "", "1×"), lbP = el("button", "", "+");
  lbRep.append(lbM, lbN, lbP);
  const lbMid = el("div", "qlb-mid"); lbMid.append(lbPrev, lbPause, lbStop, lbNext);
  lb.append(lbLine, lbT, lbMid, lbCont, lbRep);
  st.cont = localStorage.getItem("qm.audio.cont") === "1";
  const setCont = (on) => {
    st.cont = !!on;
    localStorage.setItem("qm.audio.cont", st.cont ? "1" : "");
    lbCont.classList.toggle("on", st.cont);
    lbCont.setAttribute("aria-pressed", st.cont ? "true" : "false");
    if (st.cont && st.playing) {
      const r = rec();
      pullSurah(r, st.s);
      armStandby(r, st.s, st.a);
    }
    notify();
  };
  lbCont.onclick = () => setCont(!st.cont);
  const go = (d) => { const a = st.a + d, s = st.s; if (!s || a < 1 || a > AYAHS[s - 1]) return; play(s, a); setTimeout(() => { if (st.playing && st.s === s && st.a === a) window.QM_GOTO && window.QM_GOTO(s + ":" + a); }, 150); };
  lbPrev.onclick = () => go(-1); lbNext.onclick = () => go(1); lbStop.onclick = stop;
  lbPause.onclick = () => { if (st.paused) resume(); else pause(); };
  const setRep = (d) => { const n = Math.min(9, Math.max(1, reps() + d)); localStorage.setItem("qm.audio.rep", n); st.left = Math.max(0, Math.min(st.left + d, n - 1)); paintBar(); };
  lbM.onclick = () => setRep(-1); lbP.onclick = () => setRep(1);
  const fmt = (x) => { x = Math.max(0, Math.floor(x || 0)); return Math.floor(x / 60) + ":" + String(x % 60).padStart(2, "0"); };
  function paintBar() {
    lb.hidden = !st.playing; document.body.classList.toggle("qlb-on", st.playing);
    lbN.textContent = reps() + "×";
    lbCont.classList.toggle("on", !!st.cont);
    lbCont.setAttribute("aria-pressed", st.cont ? "true" : "false");
    lbPause.classList.toggle("paused", !!st.paused);
    lbPause.title = st.paused ? "Davam et" : "Pauza";
    lbPause.setAttribute("aria-label", st.paused ? "Davam et" : "Pauza");
    const el = audio();
    const d = el.duration, c = el.currentTime;
    lbT.textContent = fmt(isFinite(d) ? d - c : 0);
    lbFill.style.width = isFinite(d) && d ? (c / d * 100) + "%" : "0";
    lbPrev.disabled = st.a <= 1; lbNext.disabled = !st.s || st.a >= AYAHS[st.s - 1];
    if (st.cont && st.playing && !st.paused && isFinite(d) && d - c < 2.5) armStandby(rec(), st.s, st.a);
  }
  A.forEach((x) => { x.addEventListener("timeupdate", () => { if (x === audio()) paintBar(); }); x.addEventListener("loadedmetadata", () => { if (x === audio()) paintBar(); }); });
  (document.body ? Promise.resolve() : new Promise((r) => addEventListener("DOMContentLoaded", r))).then(() => document.body.append(lb));

  // panel for the ayah sheet
  function panel(s, a) {
    const box = el("div", "qa-box");
    const row = el("div", "qa-row");
    const pick = el("select", "qa-pick"); for (const r of RECITERS) { const o = el("option", "", r.name); o.value = r.id; pick.append(o); }
    pick.value = rec().id; pick.onchange = () => { localStorage.setItem("qm.reciter", pick.value); if (st.playing) play(st.s, st.a); paint(); };
    const pb = el("button", "qa-b main"); const cont = el("label", "qa-cont"); const cb = el("input"); cb.type = "checkbox"; cb.checked = !!st.cont; cont.append(cb, el("span", "", " Davamlı"));
    cb.onchange = () => setCont(cb.checked);
    pb.onclick = () => { if (st.playing && st.s === s) { if (st.paused) resume(); else pause(); return; } window.QM_CLOSEAYAH && window.QM_CLOSEAYAH(); play(s, a); };
    const rp = el("select", "qa-pick qa-rep"); for (let i = 1; i <= 9; i++) { const o = el("option", "", "×" + i); o.value = i; rp.append(o); }
    rp.title = "Təkrar"; rp.value = reps(); rp.onchange = () => { localStorage.setItem("qm.audio.rep", rp.value); };
    row.append(pb, pick, rp, cont);
    const row2 = el("div", "qa-row");
    const da = el("button", "qa-b", "⬇ Bu ayə"), ds = el("button", "qa-b"), msg = el("span", "qa-msg");
    da.onclick = async () => { msg.textContent = "Endirilir…"; try { await saveAyah(rec(), s, a); msg.textContent = "✓ Ayə cihazda"; } catch (e) { msg.textContent = navigator.onLine ? "Alınmadı" : "İnternet yoxdur"; } };
    ds.onclick = async () => {
      const r = rec();
      if (localStorage.getItem(doneKey(r, s))) return;
      ds.disabled = true;
      try { await saveSurah(r, s, (d, n) => (msg.textContent = "Endirilir " + d + "/" + n)); msg.textContent = "✓ Surə cihazda (internetsiz)"; hydrateSurah(r, s); }
      catch (e) { msg.textContent = navigator.onLine ? "Alınmadı: " + e.message : "İnternet yoxdur"; }
      ds.disabled = false; paint();
    };
    row2.append(da, ds, msg);
    box.append(row, row2);
    function paint() { pb.textContent = st.playing && st.s === s ? (st.paused ? "▶ Davam" : "⏸ Pauza") : "▶ Dinlə"; pb.onclick = () => { if (st.playing && st.s === s) { if (st.paused) resume(); else pause(); return; } window.QM_CLOSEAYAH && window.QM_CLOSEAYAH(); play(s, a); }; const done = !!localStorage.getItem(doneKey(rec(), s)); ds.textContent = done ? "✓ Surə cihazda" : "⬇ Tam surə"; ds.disabled = done; }
    paint(); listeners.clear(); listeners.add(paint);
    box.hidden = true;
    return box;
  }
  const css = el("style"); css.textContent = ".qa-box[hidden]{display:none}.qa-box{margin:0 0 .5rem;padding:.55rem .6rem;border:1px solid rgba(196,165,110,.35);border-radius:12px;background:#fdfaf3;display:flex;flex-direction:column;gap:.4rem;font-size:.82rem;color:#1a3330}.qa-row{display:flex;flex-wrap:wrap;gap:.35rem;align-items:center}.qa-row+.qa-row{padding-top:.4rem;border-top:1px solid rgba(196,165,110,.22)}.qa-b{border:1px solid rgba(196,165,110,.5);background:transparent;color:#1a3330;border-radius:999px;padding:.28rem .7rem;font:inherit;font-size:.78rem;letter-spacing:.01em;cursor:pointer}.qa-b:disabled{opacity:.5}.qa-b.main{background:#1a3330;color:#fbf6ec;border-color:#1a3330;font-weight:600;padding:.32rem .85rem}.qa-pick{flex:1;min-width:7rem;font:inherit;font-size:.8rem;padding:.28rem .5rem;border:1px solid rgba(196,165,110,.5);border-radius:999px;background:#fff;color:#1a3330}.qa-rep{flex:0 0 auto;min-width:3.4rem}.qa-cont{display:flex;align-items:center;gap:.2rem;font-size:.78rem;opacity:.85}.qa-cont input{accent-color:#1a3330;margin:0}.qa-msg{flex-basis:100%;font-size:.72rem;opacity:.65}.qa-msg:empty{display:none}.qlb[hidden]{display:none}.qlb{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(1.6rem + env(safe-area-inset-bottom));width:min(94vw,640px);z-index:60;display:flex;align-items:center;justify-content:space-between;gap:.5rem;padding:.45rem .7rem .35rem;background:#fbf6ec;color:#1a3330;font-size:.8rem}.qlb-line{position:absolute;left:0;right:0;top:0;height:1.5px;background:rgba(196,165,110,.45)}.qlb-line i{display:block;height:100%;width:0;background:#c4a56e}.qlb-t{min-width:2.8rem;color:#a8893f;font-weight:600;font-variant-numeric:tabular-nums}.qlb-mid{display:flex;align-items:center;gap:1.4rem}.qlb-n{border:0;background:none;font-size:1.25rem;color:#2c3a2a;cursor:pointer;padding:.2rem}.qlb-n:disabled{opacity:.3}.qlb-stop,.qlb-pause{width:40px;height:40px;border-radius:50%;border:0;display:grid;place-items:center;cursor:pointer}.qlb-stop{background:#5f6b2f}.qlb-pause{background:#1a3330}.qlb-stop i{width:12px;height:12px;border-radius:2px;background:#fbf6ec}.qlb-pause i{width:0;height:0;border-style:solid;border-width:7px 0 7px 12px;border-color:transparent transparent transparent #fbf6ec;background:none;border-radius:0}.qlb-pause:not(.paused) i{width:10px;height:12px;border:0;background:transparent;box-shadow:inset 3px 0 0 #fbf6ec, inset -3px 0 0 #fbf6ec;border-radius:0}.qlb-rep{display:flex;align-items:center;gap:.55rem;border:1px solid #c4a56e;border-radius:999px;padding:.12rem .55rem}.qlb-rep button{border:0;background:none;color:#1a3330;font-size:.95rem;cursor:pointer;padding:0 .1rem}.qlb-rep b{min-width:1.6rem;text-align:center}.qlb-cont{border:1px solid #c4a56e;border-radius:999px;background:transparent;color:#1a3330;font:inherit;font-size:1.05rem;font-weight:700;letter-spacing:-.05em;padding:.18rem .55rem;cursor:pointer;line-height:1}.qlb-cont.on{background:#1a3330;color:#fbf6ec;border-color:#1a3330}";
  document.head.append(css);
  window.QA = { panel, play, stop, RECITERS };
})();
