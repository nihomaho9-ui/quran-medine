// Recitation (EveryAyah): stream an ayah, play on through the surah, download an ayah or a whole surah to the device.
(function () {
  const AYAHS = window.QM_AYAHS;
  const T = (k) => (window.QM && window.QM.t ? window.QM.t(k) : k);
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
  let pendingRec = false; // qari changed while paused: reload on resume
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
    if (!(st.cont && st.a < AYAHS[st.s - 1])) { finish(); return; }
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
    const r = rec(); const gen = ++st.gen; pendingRec = false;
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
    if (st.paused) { window.QM_HL && window.QM_HL(s + ":" + a); return; } // paused while loading: keep the source ready, stay silent
    try { await el.play(); } catch (e) {
      if (gen !== st.gen) return;
      if (st.paused || (e && e.name === "AbortError")) return; // user paused while loading — not a failure
      st.playing = false; st.paused = false; notify();
      window.QM_TOAST && window.QM_TOAST(T(navigator.onLine ? "Səs açılmadı" : "İnternet yoxdur — surəni əvvəlcə endirin"));
    }
    if (gen === st.gen) window.QM_HL && window.QM_HL(s + ":" + a);
  }
  function pause() {
    if (!st.playing || st.paused) return;
    audio().pause(); st.paused = true; notify();
  }
  function resume() {
    if (!st.playing || !st.paused) return;
    if (pendingRec) { pendingRec = false; play(st.s, st.a, true); return; }
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
    finish();
    window.QM_TOAST && window.QM_TOAST(T(navigator.onLine ? "Səs açılmadı" : "İnternet yoxdur — surəni əvvəlcə endirin"));
  }
  // playback is over: forget the ayah so the next ▶ follows the open page (or the last long-pressed ayah there)
  function finish() { if (st.s) window.QM_CTX = st.s + ":" + st.a; st.s = 0; st.a = 0; st.playing = false; st.paused = false; pendingRec = false; notify(); }
  A.forEach((x) => {
    x.addEventListener("ended", () => { if (x === audio()) onEnded(); });
    x.addEventListener("error", () => { if (x === audio()) onErr(); });
    x.addEventListener("canplaythrough", () => {
      if (nextReady && nextReady.el === x) nextReady.can = true;
    });
  });


  // Compact listen player: opened from the small headphones button at the top right of the reader.
  // Opening never starts audio. Thin progress line, elapsed time, qari, ⏮ ▶/⏸ ⏹ ⏭, continuous, speed − 1× +,
  // and a "⋯" row with repeat count and offline downloads.
  const RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];
  const rate = () => { const v = +localStorage.getItem("qm.audio.rate"); return RATES.includes(v) ? v : 1; };
  const applyRate = () => A.forEach((x) => { try { x.defaultPlaybackRate = rate(); x.playbackRate = rate(); } catch (e) {} });
  applyRate();
  A.forEach((x) => x.addEventListener("play", () => { if (x.playbackRate !== rate()) x.playbackRate = rate(); }));
  let open = false, lastShow = false, lastH = 0;
  const btn = (c, label, txt) => { const b = el("button", c, txt); b.type = "button"; b.title = label; b.setAttribute("aria-label", label); return b; };
  const lb = el("div", "qlb"); lb.hidden = true; lb.setAttribute("role", "region");
  const lbLine = el("div", "qlb-line"), lbFill = el("i"); lbLine.append(lbFill); lbLine.setAttribute("aria-hidden", "true");
  const lbT = el("span", "qlb-t", "0:00"); lbT.setAttribute("aria-live", "off");
  const lbPick = el("select", "qlb-pick"); for (const r of RECITERS) { const o = el("option", "", r.name); o.value = r.id; lbPick.append(o); }
  const lbPrev = btn("qlb-n", "Əvvəlki ayə", "⏮"), lbPause = btn("qlb-pause", "Dinlə"), lbStop = btn("qlb-stop", "Dayandır"), lbNext = btn("qlb-n", "Növbəti ayə", "⏭");
  lbPause.append(el("i")); lbStop.append(el("i"));
  lbPause.classList.add("paused");
  const lbCont = btn("qlb-cont", "Davamlı — ayələri ard-arda oxu", "»"); lbCont.setAttribute("aria-pressed", "false");
  const lbSpd = el("div", "qlb-rep"), lbM = btn("", "Yavaş", "−"), lbN = el("b", "", "1×"), lbP = btn("", "Sürətli", "+");
  lbSpd.append(lbM, lbN, lbP);
  const lbMore = btn("qlb-more", "Daha çox", "⋯"); lbMore.setAttribute("aria-expanded", "false");
  const lbMid = el("div", "qlb-mid"); lbMid.append(lbPrev, lbPause, lbStop, lbNext);
  const lbRow = el("div", "qlb-row"); lbRow.append(lbT, lbPick, lbMid, lbCont, lbSpd, lbMore);
  const lbAdv = el("div", "qlb-adv"); lbAdv.hidden = true;
  const rp = el("select", "qlb-pick qlb-repsel"); for (let i = 1; i <= 9; i++) { const o = el("option", "", "×" + i); o.value = i; rp.append(o); }
  const da = btn("qlb-b", "Bu ayəni endir", "⬇ Bu ayə"), ds = btn("qlb-b", "Tam surəni endir"), msg = el("span", "qlb-msg"); msg.setAttribute("aria-live", "polite");
  lbAdv.append(rp, da, ds, msg);
  lb.append(lbLine, lbRow, lbAdv);
  st.cont = localStorage.getItem("qm.audio.cont") === "1";
  // ayah the player acts on: what is playing, else the last long-pressed ayah on this page, else the page's first ayah
  function ctx() {
    if (st.s) return [st.s, st.a];
    const pg = window.QM_PAGE ? window.QM_PAGE() : null;
    const last = window.QM_CTX;
    if (last && (!pg || pg.keys.includes(last))) return last.split(":").map(Number);
    if (pg && pg.keys.length) return pg.keys[0].split(":").map(Number);
    return [1, 1];
  }
  const setCont = (on) => {
    st.cont = !!on;
    localStorage.setItem("qm.audio.cont", st.cont ? "1" : "");
    if (st.cont && st.playing) { const r = rec(); pullSurah(r, st.s); armStandby(r, st.s, st.a); }
    notify();
  };
  lbCont.onclick = () => setCont(!st.cont);
  const go = (d) => {
    const [s0, a0] = ctx(); const a = a0 + d, s = s0;
    if (!s || a < 1 || a > AYAHS[s - 1]) return;
    if (!st.playing) { // stopped: move the selection; turn the page when it leaves the visible one
      const k = s + ":" + a, pg = window.QM_PAGE ? window.QM_PAGE() : null;
      window.QM_CTX = k;
      if (pg && !pg.keys.includes(k) && window.QM_GOTO) window.QM_GOTO(k); else window.QM_HL && window.QM_HL(k);
      paintBar(); return;
    }
    play(s, a); setTimeout(() => { if (st.playing && st.s === s && st.a === a) window.QM_GOTO && window.QM_GOTO(s + ":" + a); }, 150);
  };
  lbPrev.onclick = () => go(-1); lbNext.onclick = () => go(1);
  lbStop.onclick = () => { stop(); finish(); };
  lbPause.onclick = () => {
    if (st.playing) { if (st.paused) resume(); else pause(); return; }
    const [s, a] = ctx(); window.QM_CLOSEAYAH && window.QM_CLOSEAYAH(); play(s, a);
  };
  lbPick.onchange = () => { localStorage.setItem("qm.reciter", lbPick.value); if (st.playing && st.paused) pendingRec = true; else if (st.playing) play(st.s, st.a, true); paintBar(); };
  const setRate = (d) => { const i = Math.min(RATES.length - 1, Math.max(0, RATES.indexOf(rate()) + d)); localStorage.setItem("qm.audio.rate", RATES[i]); applyRate(); paintBar(); };
  lbM.onclick = () => setRate(-1); lbP.onclick = () => setRate(1);
  lbMore.onclick = () => { lbAdv.hidden = !lbAdv.hidden; lbMore.setAttribute("aria-expanded", String(!lbAdv.hidden)); msg.textContent = ""; paintBar(); };
  rp.onchange = () => { localStorage.setItem("qm.audio.rep", rp.value); st.left = Math.min(st.left, rp.value - 1); };
  da.onclick = async () => { const [s, a] = ctx(); msg.textContent = T("Endirilir…") ; try { await saveAyah(rec(), s, a); msg.textContent = "✓ " + s + ":" + a; } catch (e) { msg.textContent = navigator.onLine ? T("Alınmadı") : T("İnternet yoxdur"); } };
  ds.onclick = async () => {
    const r = rec(), [s] = ctx();
    if (localStorage.getItem(doneKey(r, s))) return;
    ds.disabled = true;
    try { await saveSurah(r, s, (d, n) => (msg.textContent = d + "/" + n)); msg.textContent = "✓ " + T("Surə cihazda"); hydrateSurah(r, s); }
    catch (e) { msg.textContent = navigator.onLine ? T("Alınmadı") + ": " + e.message : T("İnternet yoxdur"); }
    ds.disabled = false; paintBar();
  };
  const fmt = (x) => { x = Math.max(0, Math.floor(x || 0)); return Math.floor(x / 60) + ":" + String(x % 60).padStart(2, "0"); };
  const lab = (b, k) => { const t = T(k); b.title = t; b.setAttribute("aria-label", t); };
  function paintBar() {
    if (open && !inReader()) open = false; // left the reader: close the panel (audio may continue; reopen from the reader)
    const show = open && !covered();
    if (lb.hidden === show) lb.hidden = !show;
    document.body.classList.toggle("qlb-on", show);
    for (const tb of document.querySelectorAll("#listen-btn, #listen-fab")) {
      tb.classList.toggle("on", open || st.playing); tb.setAttribute("aria-expanded", String(open));
      const t = T("Dinlə"); tb.title = t; tb.setAttribute("aria-label", t);
    }
    lb.dir = document.documentElement.dir || (localStorage.getItem("qm.lang") === "ar" ? "rtl" : "ltr");
    lb.setAttribute("aria-label", T("Dinlə"));
    lbN.textContent = rate() + "×"; lbM.disabled = rate() <= RATES[0]; lbP.disabled = rate() >= RATES[RATES.length - 1];
    if (lbPick.value !== rec().id) lbPick.value = rec().id;
    lab(lbPick, "Qari"); rp.value = reps(); lab(rp, "Təkrar"); lab(lbM, "Yavaş"); lab(lbP, "Sürətli");
    lab(lbCont, "Davamlı — ayələri ard-arda oxu"); lab(da, "Bu ayəni endir"); lab(ds, "Tam surəni endir"); da.textContent = "⬇ " + T("Bu ayə");
    lbCont.classList.toggle("on", !!st.cont);
    lbCont.setAttribute("aria-pressed", st.cont ? "true" : "false");
    const idle = !st.playing || st.paused;
    lbPause.classList.toggle("paused", idle);
    lab(lbPause, !st.playing ? "Dinlə" : st.paused ? "Davam et" : "Pauza");
    lab(lbStop, "Dayandır"); lab(lbPrev, "Əvvəlki"); lab(lbNext, "Növbəti"); lab(lbMore, "Daha çox");
    lbStop.disabled = !st.playing;
    const e = audio(), d = st.playing ? e.duration : NaN, c = st.playing ? e.currentTime : 0;
    lbT.textContent = fmt(c);
    lbFill.style.width = isFinite(d) && d ? (c / d * 100) + "%" : "0";
    const [s, a] = ctx();
    lbPrev.disabled = a <= 1; lbNext.disabled = !s || a >= AYAHS[s - 1];
    const done = !!localStorage.getItem(doneKey(rec(), s));
    ds.textContent = done ? "✓ " + T("Surə cihazda") : "⬇ " + T("Tam surə"); if (!ds.disabled || done) ds.disabled = done;
    const h = show ? lb.offsetHeight : 0;
    if (show) document.documentElement.style.setProperty("--qlb-h", h + "px");
    // the mushaf page is sized by the reader's resize handler: re-fit when the space under it changes
    if (show !== lastShow || h !== lastH) { lastShow = show; lastH = h; requestAnimationFrame(() => dispatchEvent(new Event("resize"))); }
    if (st.cont && st.playing && !st.paused && isFinite(d) && d - c < 2.5) armStandby(rec(), st.s, st.a);
  }
  // full-screen layers that the bottom player must never sit on top of
  const LAYERS = ".qm-back, .qm-hz, .qm-full, .qm-cmp, .qm-selbar, .qj, .qm-wps, .qm-menu, .qm-wpop, .qm-pop";
  function covered() { for (const x of document.querySelectorAll(LAYERS)) if (!x.hidden && !x.closest("[hidden]")) return true; return false; }
  function inReader() { const g = document.getElementById("gate"); return !g || g.hidden; }
  function toggle(on) { open = on == null ? !open : !!on; if (!open) { lbAdv.hidden = true; lbMore.setAttribute("aria-expanded", "false"); } paintBar(); if (open) setTimeout(() => lbPause.focus({ preventScroll: true }), 0); }
  A.forEach((x) => { x.addEventListener("timeupdate", () => { if (x === audio()) paintBar(); }); x.addEventListener("loadedmetadata", () => { if (x === audio()) paintBar(); }); });
  addEventListener("resize", () => { if (!lb.hidden) paintBar(); });
  addEventListener("qm-ui", () => paintBar());
  let rafQ = 0;
  const watch = new MutationObserver((recs) => { if (rafQ || recs.every((r) => lb.contains(r.target))) return; rafQ = requestAnimationFrame(() => { rafQ = 0; paintBar(); }); });
  (document.body ? Promise.resolve() : new Promise((r) => addEventListener("DOMContentLoaded", r))).then(() => { document.body.append(lb); watch.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["hidden"] }); paintBar(); });

  const css = el("style"); css.textContent = [
    ".qlb[hidden],.qlb-adv[hidden]{display:none}",
    ".qlb{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(1.05rem + env(safe-area-inset-bottom));width:min(100vw,640px);box-sizing:border-box;z-index:60;padding:.4rem .55rem .3rem;background:#fbf6ec;color:#1a3330;font-size:.8rem;box-shadow:0 -1px 0 rgba(196,165,110,.25)}",
    "body.qlb-on .page{margin-bottom:var(--qlb-h,3.2rem)}",
    "@media (orientation:landscape){.qlb{bottom:env(safe-area-inset-bottom)}}",
    ".qlb-line{position:absolute;left:0;right:0;top:0;height:2px;background:rgba(196,165,110,.4)}.qlb-line i{display:block;height:100%;width:0;background:#c4a56e}",
    "[dir=rtl] .qlb-line i{margin-inline-start:auto}",
    ".qlb-row{display:flex;align-items:center;justify-content:space-between;gap:.35rem}",
    ".qlb-t{min-width:2.4rem;color:#a8893f;font-weight:600;font-variant-numeric:tabular-nums}",
    ".qlb-pick{min-width:0;flex:0 1 7.5rem;font:inherit;font-size:.74rem;padding:.2rem .3rem;border:1px solid rgba(196,165,110,.55);border-radius:999px;background:transparent;color:inherit}",
    ".qlb-mid{display:flex;align-items:center;gap:.5rem}",
    ".qlb button{cursor:pointer;font:inherit;color:inherit}.qlb button:disabled{opacity:.35;cursor:default}",
    ".qlb button:focus-visible,.qlb select:focus-visible{outline:2px solid #c4a56e;outline-offset:2px}",
    ".qlb-n{border:0;background:none;font-size:1.05rem;padding:.25rem;min-width:40px;min-height:40px}",
    ".qlb-stop,.qlb-pause{width:36px;height:36px;border-radius:50%;border:0;display:grid;place-items:center;flex:0 0 auto}",
    ".qlb-stop{background:#5f6b2f;width:36px;height:36px}.qlb-pause{background:#1a3330}",
    ".qlb-stop i{width:10px;height:10px;border-radius:2px;background:#fbf6ec}",
    ".qlb-pause i{width:10px;height:12px;background:transparent;box-shadow:inset 3px 0 0 #fbf6ec,inset -3px 0 0 #fbf6ec}",
    ".qlb-pause.paused i{width:0;height:0;box-shadow:none;border-style:solid;border-width:7px 0 7px 11px;border-color:transparent transparent transparent #fbf6ec;margin-left:3px}",
    ".qlb-rep{display:flex;align-items:center;gap:.3rem;border:1px solid #c4a56e;border-radius:999px;padding:.08rem .4rem;flex:0 0 auto}",
    ".qlb-rep button{border:0;background:none;font-size:.95rem;padding:0 .3rem;min-width:32px;min-height:36px}.qlb-rep b{min-width:2.1rem;text-align:center;font-variant-numeric:tabular-nums}",
    ".qlb-cont,.qlb-more{border:1px solid #c4a56e;border-radius:999px;background:transparent;font-size:1rem;font-weight:700;padding:.12rem .45rem;line-height:1.2;flex:0 0 auto;min-width:40px;min-height:36px}",
    ".qlb-cont.on{background:#1a3330;color:#fbf6ec;border-color:#1a3330}",
    ".qlb-adv{display:flex;flex-wrap:wrap;align-items:center;gap:.35rem;margin-top:.35rem;padding-top:.35rem;border-top:1px solid rgba(196,165,110,.25)}",
    ".qlb-repsel{flex:0 0 auto}.qlb-b{border:1px solid rgba(196,165,110,.55);background:transparent;border-radius:999px;padding:.2rem .6rem;font-size:.74rem}",
    ".qlb-msg{font-size:.7rem;opacity:.7}.qlb-msg:empty{display:none}",
    "@media (max-width:480px){.qlb{font-size:.74rem;padding:.38rem .4rem .28rem}.qlb-row{flex-wrap:wrap;row-gap:.2rem;gap:.3rem}.qlb-mid{order:9;flex:1 0 100%;justify-content:center;gap:.6rem}.qlb-pick{flex:1 1 4rem}.qlb-t{min-width:2rem}}",
  ].join("");
  document.head.append(css);
  // kept for compatibility; the ayah sheet no longer embeds a player
  function panel() { return null; }
  window.QA = { panel, play, stop, toggle, RECITERS, isOpen: () => open || st.playing };
})();
