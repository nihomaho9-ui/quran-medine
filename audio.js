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

  async function cached(r, s, a) { try { const c = await caches.open(CACHE); const h = await c.match(url(r, s, a)); return h ? URL.createObjectURL(await h.blob()) : null; } catch (e) { return null; } }
  async function putMp3(c, r, s, a, buf) { await c.put(url(r, s, a), new Response(buf, { headers: { "Content-Type": "audio/mpeg" } })); }

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
    const c = await caches.open(CACHE);
    if (await c.match(url(r, s, a))) return;
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
  async function delSurah(r, s) { const c = await caches.open(CACHE); for (let a = 1; a <= AYAHS[s - 1]; a++) await c.delete(url(r, s, a)); localStorage.removeItem(doneKey(r, s)); }

  const audio = new Audio(); audio.preload = "auto";
  let st = { s: 0, a: 0, cont: false, playing: false, left: 0 }, ui = null;
  const listeners = new Set();
  const notify = () => listeners.forEach((f) => f());
  const reps = () => Math.min(9, Math.max(1, +localStorage.getItem("qm.audio.rep") || 1));
  function markSurahIfFull(r, s) {
    (async () => {
      try {
        const c = await caches.open(CACHE), n = AYAHS[s - 1];
        for (let a = 1; a <= n; a++) if (!(await c.match(url(r, s, a)))) return;
        localStorage.setItem(doneKey(r, s), "1");
        notify();
      } catch (e) {}
    })();
  }
  function warm(r, s, a) {
    if (a < 1 || a > AYAHS[s - 1]) return;
    saveAyah(r, s, a).then(() => markSurahIfFull(r, s)).catch(() => {});
  }
  async function play(s, a, rep) {
    const r = rec(); if (st.s !== s || st.a !== a || !rep) st.left = reps() - 1; st.s = s; st.a = a; st.playing = true; notify();
    const hit = await cached(r, s, a);
    audio.src = hit || url(r, s, a);
    if (!hit && navigator.onLine) warm(r, s, a); // listen once → keep for offline
    if (st.cont && navigator.onLine) warm(r, s, a + 1); // prefetch next ayah while this one plays
    try { await audio.play(); } catch (e) { st.playing = false; notify(); window.QM_TOAST && window.QM_TOAST(navigator.onLine ? "Səs açılmadı" : "İnternet yoxdur — surəni əvvəlcə endirin"); }
    window.QM_HL && window.QM_HL(s + ":" + a);
  }
  function stop() { audio.pause(); st.playing = false; notify(); }
  audio.onended = () => {
    if (st.left > 0) { st.left--; play(st.s, st.a, true); return; }
    if (st.cont && st.a < AYAHS[st.s - 1]) { const a = st.a + 1; window.QM_GOTO ? window.QM_GOTO(st.s + ":" + a) : 0; play(st.s, a); }
    else { st.playing = false; notify(); }
  };
  audio.onerror = () => { if (!st.playing) return; st.playing = false; notify(); window.QM_TOAST && window.QM_TOAST(navigator.onLine ? "Səs açılmadı" : "İnternet yoxdur — surəni əvvəlcə endirin"); };

  // panel for the ayah sheet
  function panel(s, a) {
    const box = el("div", "qa-box");
    const row = el("div", "qa-row");
    const pick = el("select", "qa-pick"); for (const r of RECITERS) { const o = el("option", "", r.name); o.value = r.id; pick.append(o); }
    pick.value = rec().id; pick.onchange = () => { localStorage.setItem("qm.reciter", pick.value); if (st.playing) play(st.s, st.a); paint(); };
    const pb = el("button", "qa-b main"); const cont = el("label", "qa-cont"); const cb = el("input"); cb.type = "checkbox"; cb.checked = localStorage.getItem("qm.audio.cont") === "1"; cont.append(cb, el("span", "", " Davamlı"));
    cb.onchange = () => { st.cont = cb.checked; localStorage.setItem("qm.audio.cont", cb.checked ? "1" : ""); };
    st.cont = cb.checked;
    pb.onclick = () => { if (st.playing && st.s === s) return stop(); window.QM_CLOSEAYAH && window.QM_CLOSEAYAH(); play(s, a); };
    const rp = el("select", "qa-pick qa-rep"); for (let i = 1; i <= 9; i++) { const o = el("option", "", "×" + i); o.value = i; rp.append(o); }
    rp.title = "Təkrar"; rp.value = reps(); rp.onchange = () => { localStorage.setItem("qm.audio.rep", rp.value); };
    row.append(pb, pick, rp, cont);
    const row2 = el("div", "qa-row");
    const da = el("button", "qa-b", "⬇ Bu ayə"), ds = el("button", "qa-b"), msg = el("span", "qa-msg");
    da.onclick = async () => { msg.textContent = "Endirilir…"; try { await saveAyah(rec(), s, a); msg.textContent = "✓ Ayə cihazda"; } catch (e) { msg.textContent = navigator.onLine ? "Alınmadı" : "İnternet yoxdur"; } };
    ds.onclick = async () => {
      const r = rec();
      if (localStorage.getItem(doneKey(r, s))) { await delSurah(r, s); msg.textContent = "Silindi"; paint(); return; }
      ds.disabled = true;
      try { await saveSurah(r, s, (d, n) => (msg.textContent = "Endirilir " + d + "/" + n)); msg.textContent = "✓ Surə cihazda (internetsiz)"; }
      catch (e) { msg.textContent = navigator.onLine ? "Alınmadı: " + e.message : "İnternet yoxdur"; }
      ds.disabled = false; paint();
    };
    row2.append(da, ds, msg);
    box.append(row, row2);
    function paint() { pb.textContent = st.playing && st.s === s ? "⏸ Dayandır" : "▶ Dinlə"; ds.textContent = localStorage.getItem(doneKey(rec(), s)) ? "🗑 Surəni sil" : "⬇ Tam surə"; }
    paint(); listeners.clear(); listeners.add(paint);
    box.hidden = true;
    return box;
  }
  const css = el("style"); css.textContent = ".qa-box[hidden]{display:none}.qa-box{margin:0 0 .5rem;padding:.55rem .6rem;border:1px solid rgba(196,165,110,.35);border-radius:12px;background:#fdfaf3;display:flex;flex-direction:column;gap:.4rem;font-size:.82rem;color:#1a3330}.qa-row{display:flex;flex-wrap:wrap;gap:.35rem;align-items:center}.qa-row+.qa-row{padding-top:.4rem;border-top:1px solid rgba(196,165,110,.22)}.qa-b{border:1px solid rgba(196,165,110,.5);background:transparent;color:#1a3330;border-radius:999px;padding:.28rem .7rem;font:inherit;font-size:.78rem;letter-spacing:.01em;cursor:pointer}.qa-b:disabled{opacity:.5}.qa-b.main{background:#1a3330;color:#fbf6ec;border-color:#1a3330;font-weight:600;padding:.32rem .85rem}.qa-pick{flex:1;min-width:7rem;font:inherit;font-size:.8rem;padding:.28rem .5rem;border:1px solid rgba(196,165,110,.5);border-radius:999px;background:#fff;color:#1a3330}.qa-rep{flex:0 0 auto;min-width:3.4rem}.qa-cont{display:flex;align-items:center;gap:.2rem;font-size:.78rem;opacity:.85}.qa-cont input{accent-color:#1a3330;margin:0}.qa-msg{flex-basis:100%;font-size:.72rem;opacity:.65}.qa-msg:empty{display:none}";
  document.head.append(css);
  window.QA = { panel, play, stop, RECITERS };
})();
