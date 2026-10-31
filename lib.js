// Settings (tafsir / translation downloads, text size) and the ayah sheet. Data is stored on the device (IndexedDB) and works offline.
(function () {
  const AYAHS = window.QM_AYAHS;
  const NAMES = window.QM_NAMES;
  let LIST = [];
  const prefs = () => { try { return Object.assign({ tf: "", tr: "", fs: 1, tab: "tf" }, JSON.parse(localStorage.getItem("qm.prefs") || "{}")); } catch (e) { return { tf: "", tr: "", fs: 1, tab: "tf" }; } };
  const setPrefs = (p) => localStorage.setItem("qm.prefs", JSON.stringify(Object.assign(prefs(), p)));
  let dbp = null;
  const db = () => (dbp ||= new Promise((ok, no) => { const r = indexedDB.open("qm-lib", 1); r.onupgradeneeded = () => r.result.createObjectStore("kv"); r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); }));
  async function tx(mode, f) { const d = await db(); return new Promise((ok, no) => { const t = d.transaction("kv", mode); const r = f(t.objectStore("kv")); t.oncomplete = () => ok(r ? r.result : undefined); t.onerror = () => no(t.error); }); }
  const get = (k) => tx("readonly", (s) => s.get(k));
  const put = (k, v) => tx("readwrite", (s) => { s.put(v, k); });
  const status = async (id) => (await get(id + ":n")) || 0;
  const running = {};
  async function download(r, prog) {
    const ctl = (running[r.id] = { stop: false });
    try {
      if (r.k === "tr" && !r.per) {
        const res = await fetch("./tr/" + r.id + ".json"); if (!res.ok) throw new Error("http");
        const j = await res.json();
        for (let s = 1; s <= 114; s++) { await put(r.id + ":" + s, j.v[s - 1]); prog(s); }
        await put(r.id + ":n", 114); return;
      }
      for (let s = (await status(r.id)) + 1; s <= 114; s++) {
        if (ctl.stop) throw new Error("stopped");
        const res = await fetch("./" + r.k + "/" + r.id + "/" + s + ".json"); if (!res.ok) throw new Error("http");
        const j = await res.json();
        const out = r.k === "tr" ? j.t : j;
        if (!Array.isArray(out) || out.length !== AYAHS[s - 1]) throw new Error("bad file");
        if (r.k === "tr" && Array.isArray(j.f)) await put(r.id + ":f:" + s, j.f);
        await put(r.id + ":" + s, out); await put(r.id + ":n", s); prog(s);
      }
    } finally { delete running[r.id]; }
  }
  const remove = (id) => tx("readwrite", (s) => { s.delete(IDBKeyRange.bound(id + ":", id + ":\uffff")); });
  async function entry(id, s, a) {
    const v = await get(id + ":" + s); if (!v) return null;
    let from = a; while (from > 1 && !v[from - 1]) from--;
    if (!v[from - 1]) return { text: "", from: a, to: a };
    let to = from; while (to < v.length && !v[to]) to++;
    return { text: v[from - 1], from, to };
  }
  const plain = (h) => String(h).replace(/<\s*br\s*\/?>/gi, "\n").replace(/<\/(p|div|h\d|li)>/gi, "\n\n").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/\n{3,}/g, "\n\n").trim();
  const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };

  /* ---------- Settings ---------- */
  const back = el("div", "qm-back"); back.hidden = true;
  const sheet = el("div", "qm-sheet qm-set"); back.appendChild(sheet);
  back.addEventListener("click", (e) => { if (e.target === back) closeAll(); });
  document.body.appendChild(back);
  function closeAll() { back.hidden = true; cur = null; window.QM_HL && window.QM_HL(null); sheet.replaceChildren(); }
  async function openSettings(focus) {
    if (!LIST.length) LIST = await (await fetch("./lib-list.json")).json();
    sheet.className = "qm-sheet qm-set"; sheet.replaceChildren();
    const head = el("div", "qm-head"); head.append(el("h2", "", "Ayarlar")); const x = el("button", "qm-close", "Bağla"); x.onclick = closeAll; head.append(x); sheet.append(head);
    const body = el("div", "qm-scroll"); sheet.append(body);
    const sz = el("section", "qm-sec"); sz.append(el("h3", "", "Mətn ölçüsü"));
    const row = el("div", "qm-size"); const minus = el("button", "qm-chip", "A−"), val = el("b", "", ""), plus = el("button", "qm-chip", "A+");
    const upd = () => { const f = prefs().fs; val.textContent = Math.round(f * 100) + "%"; minus.disabled = f <= 0.8; plus.disabled = f >= 1.6; };
    minus.onclick = () => { setPrefs({ fs: Math.round((prefs().fs - 0.1) * 10) / 10 }); upd(); };
    plus.onclick = () => { setPrefs({ fs: Math.round((prefs().fs + 0.1) * 10) / 10 }); upd(); };
    upd(); row.append(minus, val, plus); sz.append(row); body.append(sz);
    body.append(el("p", "qm-note", "Endirilənlər cihazda qalır, internetsiz işləyir."));
    for (const k of ["tf", "tr"]) {
      const sec = el("section", "qm-sec"); sec.id = "qm-" + k; sec.append(el("h3", "", k === "tf" ? "Təfsirlər" : "Tərcümələr"));
      const ul = el("ul", "qm-list"); for (const r of LIST.filter((r) => r.k === k)) ul.append(resRow(r)); sec.append(ul); body.append(sec);
    }
    back.hidden = false;
    if (focus) document.getElementById("qm-" + focus).scrollIntoView();
  }
  function resRow(r) {
    const li = el("li", "qm-res"); li.dataset.id = r.id;
    const tx = el("div", "qm-tx"); const nm = el("b", "", r.name); nm.dir = "auto"; const sm = el("small", "", r.by + " · " + r.mb + " MB"); sm.dir = "auto";
    const bar = el("span", "qm-bar"); const fill = el("i"); bar.append(fill); bar.hidden = true; const err = el("small", "qm-err", ""); tx.append(nm, sm, bar, err);
    const act = el("div", "qm-act"); li.append(tx, act);
    let n = 0, busy = false, ask = false;
    const draw = () => {
      const done = n >= 114, chosen = prefs()[r.k] === r.id;
      li.classList.toggle("on", done && chosen);
      bar.hidden = !(busy || (n > 0 && !done)); fill.style.width = (n / 114) * 100 + "%";
      act.replaceChildren();
      const b = (t, c, f) => { const x = el("button", "qm-rb " + c, t); x.onclick = f; act.append(x); };
      if (busy) b("Dayandır", "", () => { running[r.id] && (running[r.id].stop = true); });
      else if (!done) b("Endir", "main", go);
      else if (ask) { b("Sil", "danger", del); b("✕", "", () => { ask = false; draw(); }); }
      else { b(chosen ? "✓ Seçilib" : "Seç", chosen ? "sel" : "", () => { setPrefs({ [r.k]: r.id }); sheet.querySelectorAll(".qm-res").forEach((x) => x._draw && x._draw()); }); b("🗑", "ghost", () => { ask = true; draw(); }); }
    };
    li._draw = draw;
    const go = async () => { busy = true; err.textContent = ""; draw(); try { await download(r, (k) => { n = k; draw(); }); if (!prefs()[r.k] || prefs()[r.k] !== r.id) setPrefs({ [r.k]: r.id }); } catch (e) { if (e.message !== "stopped") err.textContent = "Alınmadı. İnterneti yoxlayın."; } busy = false; n = await status(r.id); sheet.querySelectorAll(".qm-res").forEach((x) => x._draw && x._draw()); };
    const del = async () => { await remove(r.id); n = 0; ask = false; if (prefs()[r.k] === r.id) setPrefs({ [r.k]: "" }); draw(); };
    status(r.id).then((v) => { n = v; draw(); });
    draw();
    return li;
  }

  /* ---------- Ayah sheet ---------- */
  let cur = null;
  async function openAyah(s, a) {
    if (!LIST.length) LIST = await (await fetch("./lib-list.json")).json();
    cur = { s, a }; window.QM_HL && window.QM_HL(s + ":" + a);
    const p = prefs(); const kind = p.tab;
    const have = []; for (const r of LIST) if (r.k === kind && (await status(r.id)) >= 114) have.push(r);
    const r = have.find((x) => x.id === p[kind]) || have[0];
    const e = r ? await entry(r.id, s, a) : null;
    const fn = r && r.k === "tr" ? ((await get(r.id + ":f:" + s)) || [])[a - 1] : "";
    if (!cur || cur.s !== s || cur.a !== a) return;
    sheet.className = "qm-sheet qm-ayah"; sheet.replaceChildren();
    const head = el("div", "qm-head");
    head.append(el("h2", "", NAMES[s - 1] + " · " + (e && e.from !== e.to ? e.from + "–" + e.to : a)));
    const nav = el("span", "qm-nav");
    const max = AYAHS[s - 1];
    const pv = el("button", "qm-rb", "‹"), nx = el("button", "qm-rb", "›");
    pv.disabled = s === 1 && a === 1; nx.disabled = s === 114 && a === max;
    pv.onclick = () => { const f = e ? e.from : a; f > 1 ? openAyah(s, f - 1) : openAyah(s - 1, AYAHS[s - 2]); };
    nx.onclick = () => { const t = e ? e.to : a; t < max ? openAyah(s, t + 1) : openAyah(s + 1, 1); };
    nav.append(pv, nx); head.append(nav);
    const x = el("button", "qm-close", "Bağla"); x.onclick = () => { cur = null; window.QM_HL && window.QM_HL(null); closeAll(); }; head.append(x);
    sheet.append(head);
    const tabs = el("div", "qm-tabs");
    for (const k of ["tf", "tr"]) { const t = el("button", "qm-tab" + (k === kind ? " on" : ""), k === "tf" ? "Təfsirlər" : "Tərcümələr"); t.onclick = () => { setPrefs({ tab: k }); openAyah(s, a); }; tabs.append(t); }
    sheet.append(tabs);
    if (have.length > 1) {
      const sel = el("select", "qm-pick");
      for (const h of have) { const o = el("option", "", (h.k === "tr" ? h.by + " · " : "") + h.name); o.value = h.id; sel.append(o); }
      sel.value = r.id; sel.onchange = () => { setPrefs({ [kind]: sel.value }); openAyah(s, a); }; sheet.append(sel);
    }
    const body = el("div", "qm-body"); sheet.append(body);
    if (!r) {
      const box = el("div", "qm-empty"); box.append(el("p", "", "Hələ endirilməyib."));
      const b = el("button", "qm-rb main", "Ayarlarda endir"); b.onclick = () => openSettings(kind); box.append(b); body.append(box);
    } else {
      body.dir = r.dir; body.lang = r.lang; body.style.fontSize = p.fs * (r.lang === "ar" ? 1.15 : 1) + "rem";
      if (have.length === 1) { const src = el("b", "qm-src", (r.k === "tr" ? r.by + " · " : "") + r.name); src.dir = "auto"; body.append(src); }
      const txt = e && e.text ? plain(e.text) : "—";
      for (const para of txt.split(/\n{2,}/)) body.append(el("p", "", para));
      if (fn) body.append(el("p", "qm-fn", plain(fn)));
    }
    back.hidden = false;
  }
  window.QM = { openSettings, openAyah };
})();
