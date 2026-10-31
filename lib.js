// Settings (tafsir / translation downloads, text size) and the ayah sheet. Data is stored on the device (IndexedDB) and works offline.
(function () {
  const AYAHS = window.QM_AYAHS;
  const NAMES = window.QM_NAMES;
  let LIST = [];
  const LANGS = [["az", "Azərbaycan"], ["tr", "Türkçe"], ["en", "English"], ["ar", "العربية"], ["ru", "Русский"]];
  const DICT = {"Alınmadı": ["Olmadı", "Failed", "تعذّر", "Не удалось"], "Alınmadı. İnterneti yoxlayın.": ["Olmadı. İnterneti kontrol edin.", "Failed. Check the connection.", "تعذّر التنزيل. تحقّق من الاتصال.", "Не удалось. Проверьте интернет."], "Ayarlar": ["Ayarlar", "Settings", "الإعدادات", "Настройки"], "Bağla": ["Kapat", "Close", "إغلاق", "Закрыть"], "Dayandır": ["Durdur", "Stop", "إيقاف", "Стоп"], "Endir": ["İndir", "Download", "تنزيل", "Скачать"], "Endirilənlər cihazda qalır, internetsiz işləyir.": ["İndirilenler cihazda kalır, internetsiz çalışır.", "Downloads stay on this device and work offline.", "تبقى التنزيلات على الجهاز وتعمل دون إنترنت.", "Загрузки хранятся на устройстве и работают офлайн."], "Hələ endirilməyib.": ["Henüz indirilmedi.", "Nothing downloaded yet.", "لم يُنزَّل شيء بعد.", "Пока ничего не скачано."], "Ayarlarda endir": ["Ayarlardan indir", "Download in Settings", "نزّل من الإعدادات", "Скачать в настройках"], "Kopyalandı": ["Kopyalandı", "Copied", "تم النسخ", "Скопировано"], "Kopyala": ["Kopyala", "Copy", "نسخ", "Копировать"], "Mətn ölçüsü": ["Yazı boyutu", "Text size", "حجم النص", "Размер текста"], "Paylaş": ["Paylaş", "Share", "مشاركة", "Поделиться"], "Seç": ["Seç", "Use", "اختيار", "Выбрать"], "Sil": ["Sil", "Delete", "حذف", "Удалить"], "Təfsirlər": ["Tefsirler", "Tafsirs", "التفاسير", "Тафсиры"], "Tərcümələr": ["Mealler", "Translations", "الترجمات", "Переводы"], "Əlfəcin": ["Yer imi", "Bookmark", "علامة", "Закладка"], "Əlfəcindən silindi": ["Yer iminden silindi", "Bookmark removed", "أُزيلت العلامة", "Закладка удалена"], "Əlfəcinə əlavə olundu": ["Yer imine eklendi", "Bookmarked", "أُضيفت علامة", "Добавлено в закладки"], "✓ Seçilib": ["✓ Seçili", "✓ In use", "✓ مختار", "✓ Выбрано"], "Dil": ["Dil", "Language", "اللغة", "Язык"]};
  const uiLang = () => localStorage.getItem("qm.lang") || "az";
  const T = (k) => { const i = ["tr", "en", "ar", "ru"].indexOf(uiLang()); return i < 0 || !DICT[k] ? k : DICT[k][i]; };

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
  const ICON = {
    lang: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.6 2.6 2.6 14.4 0 17M12 3.5c-2.6 2.6-2.6 14.4 0 17"/>',
    size: '<path d="M4 18 8.5 6 13 18M5.6 14h5.8M15 18l3-7.5 3 7.5M15.9 16h4.2"/>',
    tf: '<path d="M4 5.5C6.5 4.5 9.5 4.5 12 6c2.5-1.5 5.5-1.5 8-.5v13c-2.5-1-5.5-1-8 .5-2.5-1.5-5.5-1.5-8-.5zM12 6v13.5"/>',
    tr: '<path d="M4 6h9M8.5 4v2M6 6c.5 3 2.5 5.5 5 6.5M11 6c-.5 3-2.5 5.5-5 6.5M13 20l3.5-8 3.5 8M14.2 17.3h4.6"/>',
  };
  function card(key, title, extra) {
    const c = el("section", "qm-card"); c.id = "qm-" + key;
    const h = el("div", "qm-card-h");
    const ic = el("span", "qm-card-ic"); ic.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICON[key] + "</svg>";
    h.append(ic, el("h3", "", title)); if (extra) h.append(el("small", "", extra));
    c.append(h); return c;
  }
  async function openSettings(focus) {
    if (!LIST.length) LIST = await (await fetch("./lib-list.json")).json();
    sheet.className = "qm-sheet qm-set"; sheet.replaceChildren();
    sheet.dir = uiLang() === "ar" ? "rtl" : "ltr";
    const head = el("div", "qm-head"); head.append(el("h2", "", T("Ayarlar"))); const x = el("button", "qm-close", T("Bağla")); x.onclick = closeAll; head.append(x); sheet.append(head);
    const body = el("div", "qm-scroll"); sheet.append(body);
    // 1. language
    const lc = card("lang", T("Dil")); const chips = el("div", "qm-chips");
    for (const [id, nm] of LANGS) { const b = el("button", "qm-chip" + (id === uiLang() ? " on" : ""), nm); b.onclick = () => { localStorage.setItem("qm.lang", id); openSettings(); }; chips.append(b); }
    lc.append(chips); body.append(lc);
    // 2. text size
    const sc = card("size", T("Mətn ölçüsü"));
    const row = el("div", "qm-size"); const minus = el("button", "qm-chip", "A−"), val = el("b", "", ""), plus = el("button", "qm-chip", "A+");
    const upd = () => { const f = prefs().fs; val.textContent = Math.round(f * 100) + "%"; minus.disabled = f <= 0.8; plus.disabled = f >= 1.6; };
    minus.onclick = () => { setPrefs({ fs: Math.round((prefs().fs - 0.1) * 10) / 10 }); upd(); };
    plus.onclick = () => { setPrefs({ fs: Math.round((prefs().fs + 0.1) * 10) / 10 }); upd(); };
    upd(); row.append(minus, val, plus); sc.append(row); body.append(sc);
    // 3. tafsirs, 4. translations (grouped by language)
    for (const k of ["tf", "tr"]) {
      const items = LIST.filter((r) => r.k === k);
      const c = card(k, k === "tf" ? T("Təfsirlər") : T("Tərcümələr"), String(items.length));
      const ul = el("ul", "qm-list"); let grp = null;
      const sorted = k === "tr" ? [...items].sort((a, b) => a.by.localeCompare(b.by)) : items;
      for (const r of sorted) {
        if (k === "tr" && r.by !== grp) { grp = r.by; const g = el("li", "qm-grp", grp); g.dir = "auto"; ul.append(g); }
        ul.append(resRow(r));
      }
      c.append(ul); body.append(c);
    }
    body.append(el("p", "qm-note", T("Endirilənlər cihazda qalır, internetsiz işləyir.")));
    back.hidden = false;
    if (focus) document.getElementById("qm-" + focus).scrollIntoView();
  }
  function resRow(r) {
    const li = el("li", "qm-res"); li.dataset.id = r.id;
    const tx = el("div", "qm-tx"); const nm = el("b", "", r.name); nm.dir = "auto"; const sm = el("small", "", (r.k === "tr" ? "" : r.by + " · ") + r.mb + " MB"); sm.dir = "auto";
    const bar = el("span", "qm-bar"); const fill = el("i"); bar.append(fill); bar.hidden = true; const err = el("small", "qm-err", ""); tx.append(nm, sm, bar, err);
    const act = el("div", "qm-act"); li.append(tx, act);
    let n = 0, busy = false, ask = false;
    const draw = () => {
      const done = n >= 114, chosen = prefs()[r.k] === r.id;
      li.classList.toggle("on", done && chosen);
      bar.hidden = !(busy || (n > 0 && !done)); fill.style.width = (n / 114) * 100 + "%";
      act.replaceChildren();
      const b = (t, c, f) => { const x = el("button", "qm-rb " + c, t); x.onclick = f; act.append(x); };
      if (busy) b(T("Dayandır"), "", () => { running[r.id] && (running[r.id].stop = true); });
      else if (!done) b(T("Endir"), "main", go);
      else if (ask) { b(T("Sil"), "danger", del); b("✕", "", () => { ask = false; draw(); }); }
      else { b(chosen ? T("✓ Seçilib") : T("Seç"), chosen ? "sel" : "", () => { setPrefs({ [r.k]: r.id }); sheet.querySelectorAll(".qm-res").forEach((x) => x._draw && x._draw()); }); b("🗑", "ghost", () => { ask = true; draw(); }); }
    };
    li._draw = draw;
    const go = async () => { busy = true; err.textContent = ""; draw(); try { await download(r, (k) => { n = k; draw(); }); if (!prefs()[r.k] || prefs()[r.k] !== r.id) setPrefs({ [r.k]: r.id }); } catch (e) { if (e.message !== "stopped") err.textContent = T("Alınmadı. İnterneti yoxlayın."); } busy = false; n = await status(r.id); sheet.querySelectorAll(".qm-res").forEach((x) => x._draw && x._draw()); };
    const del = async () => { await remove(r.id); n = 0; ask = false; if (prefs()[r.k] === r.id) setPrefs({ [r.k]: "" }); draw(); };
    status(r.id).then((v) => { n = v; draw(); });
    draw();
    return li;
  }

  /* ---------- ayah text, bookmarks, toast ---------- */
  let textP = null;
  const ayahText = (s, a) => (textP ||= fetch("./quran-uthmani.txt").then((r) => r.text()).then((t) => { const m = {}; for (const l of t.split("\n")) { const [x, y, z] = l.split("|"); if (z) m[x + ":" + y] = z.trim(); } return m; })).then((m) => m[s + ":" + a] || "");
  const marks = () => { try { return JSON.parse(localStorage.getItem("qm.bookmarks") || "[]"); } catch (e) { return []; } };
  const toggleMark = (k) => { const m = marks(); const i = m.indexOf(k); i >= 0 ? m.splice(i, 1) : m.push(k); localStorage.setItem("qm.bookmarks", JSON.stringify(m)); return i < 0; };
  const toastEl = el("div", "qm-toast"); toastEl.hidden = true; document.body.appendChild(toastEl);
  let toastT = 0;
  const toast = (t) => { toastEl.textContent = t; toastEl.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => (toastEl.hidden = true), 1800); };
  async function copyText(t) { try { await navigator.clipboard.writeText(t); return true; } catch (e) { const ta = el("textarea"); ta.value = t; document.body.append(ta); ta.select(); const ok = document.execCommand("copy"); ta.remove(); return ok; } }
  const SVG = {
    share: '<path d="M12 3v12M7.5 7.5 12 3l4.5 4.5M5 12v7.5h14V12"/>',
    copy: '<rect x="8" y="8" width="11.5" height="11.5" rx="2"/><path d="M15.5 8V5.5A1.5 1.5 0 0 0 14 4H5.5A1.5 1.5 0 0 0 4 5.5V14a1.5 1.5 0 0 0 1.5 1.5H8"/>',
    mark: '<path d="M6.5 3.5h11v17L12 16.5l-5.5 4z"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
  };
  const icon = (name, label, filled) => { const b = el("button", "qm-ic" + (filled ? " on" : "")); b.type = "button"; b.setAttribute("aria-label", label); b.title = label; b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + SVG[name] + "</svg>"; return b; };

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
    sheet.className = "qm-sheet qm-ayah"; sheet.replaceChildren(); sheet.dir = uiLang() === "ar" ? "rtl" : "ltr";
    const ref = NAMES[s - 1] + " " + s + ":" + a;
    const bar = el("div", "qm-icons");
    const shareB = icon("share", T("Paylaş")), copyB = icon("copy", T("Kopyala")), markB = icon("mark", T("Əlfəcin"), marks().includes(s + ":" + a)), closeB = icon("close", T("Bağla"));
    shareB.onclick = async () => {
      const ar = await ayahText(s, a);
      let ex = e && e.text ? plain(e.text) : ""; if (ex.length > 600) ex = ex.slice(0, 600).trim() + "…";
      const text = ar + "\n— " + ref + (ex ? "\n\n" + (r ? (r.k === "tr" ? r.by : r.name) + ":\n" : "") + ex : "");
      if (navigator.share) { try { await navigator.share({ title: ref, text }); return; } catch (err) { if (err && err.name === "AbortError") return; } }
      toast((await copyText(text)) ? T("Kopyalandı") : T("Alınmadı"));
    };
    copyB.onclick = async () => toast((await copyText((await ayahText(s, a)) + "\n— " + ref)) ? T("Kopyalandı") : T("Alınmadı"));
    markB.onclick = () => { const on = toggleMark(s + ":" + a); markB.classList.toggle("on", on); toast(on ? T("Əlfəcinə əlavə olundu") : T("Əlfəcindən silindi")); };
    closeB.onclick = () => { cur = null; window.QM_HL && window.QM_HL(null); closeAll(); };
    closeB.classList.add("end");
    bar.append(shareB, copyB, markB, closeB);
    sheet.append(bar);
    const head = el("div", "qm-head");
    head.append(el("h2", "", NAMES[s - 1] + " · " + (e && e.from !== e.to ? e.from + "–" + e.to : a)));
    const nav = el("span", "qm-nav");
    const max = AYAHS[s - 1];
    const pv = el("button", "qm-rb", "‹"), nx = el("button", "qm-rb", "›");
    pv.disabled = s === 1 && a === 1; nx.disabled = s === 114 && a === max;
    pv.onclick = () => { const f = e ? e.from : a; f > 1 ? openAyah(s, f - 1) : openAyah(s - 1, AYAHS[s - 2]); };
    nx.onclick = () => { const t = e ? e.to : a; t < max ? openAyah(s, t + 1) : openAyah(s + 1, 1); };
    nav.append(pv, nx); head.append(nav);
    sheet.append(head);
    const tabs = el("div", "qm-tabs");
    for (const k of ["tf", "tr"]) { const t = el("button", "qm-tab" + (k === kind ? " on" : ""), k === "tf" ? T("Təfsirlər") : T("Tərcümələr")); t.onclick = () => { setPrefs({ tab: k }); openAyah(s, a); }; tabs.append(t); }
    sheet.append(tabs);
    if (have.length > 1) {
      const sel = el("select", "qm-pick");
      for (const h of have) { const o = el("option", "", (h.k === "tr" ? h.by + " · " : "") + h.name); o.value = h.id; sel.append(o); }
      sel.value = r.id; sel.onchange = () => { setPrefs({ [kind]: sel.value }); openAyah(s, a); }; sheet.append(sel);
    }
    const body = el("div", "qm-body"); sheet.append(body);
    if (!r) {
      const box = el("div", "qm-empty"); box.append(el("p", "", T("Hələ endirilməyib.")));
      const b = el("button", "qm-rb main", T("Ayarlarda endir")); b.onclick = () => openSettings(kind); box.append(b); body.append(box);
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
