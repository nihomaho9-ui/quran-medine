const RB = location.hostname.endsWith("github.io") ? "./" : "https://nihomaho9-ui.github.io/quran-medine/";
// Settings (tafsir / translation downloads, text size) and the ayah sheet. Data is stored on the device (IndexedDB) and works offline.
(function () {
  const AYAHS = window.QM_AYAHS;
  const NAMES = window.QM_NAMES;
  let LIST = [];
  const kindOf = (id) => (LIST.find((x) => x.id === id) || {}).k;
  const LANGS = [["az", "Azərbaycan"], ["tr", "Türkçe"], ["en", "English"], ["ar", "العربية"], ["ru", "Русский"]];
  const DICT = {"Tam ekran": ["Tam ekran", "Full screen", "ملء الشاشة", "Во весь экран"], "Səhifə": ["Sayfa", "Page", "صفحة", "Стр."], "Təfsir": ["Tefsir", "Tafsir", "تفسير", "Тафсир"], "Tərcümə": ["Meal", "Translation", "ترجمة", "Перевод"], "Əvvəlki səhifə": ["Önceki sayfa", "Previous page", "الصفحة السابقة", "Пред. стр."], "Növbəti səhifə": ["Sonraki sayfa", "Next page", "الصفحة التالية", "След. стр."], "Mətn": ["Metin", "Text", "نص", "Текст"], "Şəkil": ["Görsel", "Image", "صورة", "Картинка"], "Ləğv": ["İptal", "Cancel", "إلغاء", "Отмена"], "Yadda saxla": ["Kaydet", "Save", "حفظ", "Сохранить"], "Hazırlanır…": ["Hazırlanıyor…", "Preparing…", "جارٍ التحضير…", "Готовлю…"], "N ayə seçilib": ["N ayet seçildi", "N ayahs selected", "N آيات محددة", "Выбрано аятов: N"], "Başqa ayələrə toxunun": ["Diğer ayetlere dokunun", "Tap other ayahs to add", "انقر آيات أخرى لإضافتها", "Нажмите другие аяты"], "Bir neçə ayə seç": ["Birden çok ayet seç", "Select several ayahs", "تحديد عدة آيات", "Выбрать несколько аятов"], "Əvvəlki": ["Önceki", "Previous", "السابقة", "Пред."], "Növbəti": ["Sonraki", "Next", "التالية", "След."], "Alınmadı": ["Olmadı", "Failed", "تعذّر", "Не удалось"], "Alınmadı. İnterneti yoxlayın.": ["Olmadı. İnterneti kontrol edin.", "Failed. Check the connection.", "تعذّر التنزيل. تحقّق من الاتصال.", "Не удалось. Проверьте интернет."], "Ayarlar": ["Ayarlar", "Settings", "الإعدادات", "Настройки"], "Bağla": ["Kapat", "Close", "إغلاق", "Закрыть"], "Dayandır": ["Durdur", "Stop", "إيقاف", "Стоп"], "Endir": ["İndir", "Download", "تنزيل", "Скачать"], "Endirilənlər cihazda qalır, internetsiz işləyir.": ["İndirilenler cihazda kalır, internetsiz çalışır.", "Downloads stay on this device and work offline.", "تبقى التنزيلات على الجهاز وتعمل دون إنترنت.", "Загрузки хранятся на устройстве и работают офлайн."], "Hələ endirilməyib.": ["Henüz indirilmedi.", "Nothing downloaded yet.", "لم يُنزَّل شيء بعد.", "Пока ничего не скачано."], "Ayarlarda endir": ["Ayarlardan indir", "Download in Settings", "نزّل من الإعدادات", "Скачать в настройках"], "Kopyalandı": ["Kopyalandı", "Copied", "تم النسخ", "Скопировано"], "Kopyala": ["Kopyala", "Copy", "نسخ", "Копировать"], "Mətn ölçüsü": ["Yazı boyutu", "Text size", "حجم النص", "Размер текста"], "Paylaş": ["Paylaş", "Share", "مشاركة", "Поделиться"], "Seç": ["Seç", "Use", "اختيار", "Выбрать"], "Sil": ["Sil", "Delete", "حذف", "Удалить"], "Təfsirlər": ["Tefsirler", "Tafsirs", "التفاسير", "Тафсиры"], "Tərcümələr": ["Mealler", "Translations", "الترجمات", "Переводы"], "Əlfəcin": ["Yer imi", "Bookmark", "علامة", "Закладка"], "Əlfəcindən silindi": ["Yer iminden silindi", "Bookmark removed", "أُزيلت العلامة", "Закладка удалена"], "Əlfəcinə əlavə olundu": ["Yer imine eklendi", "Bookmarked", "أُضيفت علامة", "Добавлено в закладки"], "✓ Seçilib": ["✓ Seçili", "✓ In use", "✓ مختار", "✓ Выбрано"], "Dil": ["Dil", "Language", "اللغة", "Язык"], "Seçilməyib": ["Seçilmedi", "None", "غير محدد", "Не выбрано"], "Axtarış": ["Ara", "Search", "بحث", "Поиск"], "Surə və ya ərəbcə söz…": ["Sure veya Arapça söz…", "Surah or an Arabic word…", "سورة أو كلمة…", "Сура или арабское слово…"], "Cüz": ["Cüz", "Juz", "الجزء", "Джуз"], "Mədinə": ["Medine", "Medinan", "مدنية", "Мединская"], "Məkkə": ["Mekke", "Meccan", "مكية", "Мекканская"], "ayə": ["ayet", "ayahs", "آية", "аятов"], "Tapılmadı": ["Bulunamadı", "No matches", "لا نتائج", "Ничего не найдено"], "Oxuma": ["Okuma", "Reading", "القراءة", "Чтение"], "Tətbiq": ["Uygulama", "App", "التطبيق", "Приложение"], "Məxfilik siyasəti": ["Gizlilik politikası", "Privacy policy", "سياسة الخصوصية", "Политика конфиденциальности"], "İstifadə şərtləri": ["Kullanım şartları", "Terms of use", "شروط الاستخدام", "Условия использования"], "Məlumat təhlükəsizliyi": ["Veri güvenliği", "Data safety", "أمان البيانات", "Безопасность данных"], "İcazələr": ["İzinler", "Permissions", "الأذونات", "Разрешения"], "Tətbiq haqqında": ["Uygulama hakkında", "About", "حول التطبيق", "О приложении"], "Əlaqə": ["İletişim", "Contact", "التواصل", "Контакт"], "Mənbələr": ["Kaynaklar", "Sources", "المصادر", "Источники"], "Məlumat toplanmır": ["Veri toplanmaz", "No data collected", "لا نجمع بيانات", "Данные не собираются"], "Oxuma qaydaları": ["Okuma kuralları", "How you may use it", "قواعد الاستخدام", "Правила чтения"], "Reklam və izləmə yoxdur": ["Reklam ve izleme yok", "No ads or tracking", "بلا إعلانات ولا تتبّع", "Без рекламы и слежки"], "Yalnız endirmə üçün internet": ["Yalnızca indirme için internet", "Internet only for downloads", "الإنترنت للتنزيل فقط", "Интернет только для загрузок"], "Söz mənaları": ["Kelime anlamları", "Word meanings", "معاني الكلمات", "Значения слов"], "Müqayisə": ["Karşılaştır", "Compare", "مقارنة", "Сравнить"], "Mənbələri seç": ["Kaynakları seç", "Choose sources", "اختر المصادر", "Выбрать источники"], "Bu ayədə çətin söz izahı yoxdur": ["Bu ayette açıklanan garip kelime yok", "No difficult words explained in this ayah", "لا غريب في هذه الآية", "В этом аяте нет трудных слов"], "Müqayisə üçün Ayarlardan daha bir mənbə endirin": ["Karşılaştırmak için Ayarlardan bir kaynak daha indirin", "Download another source in Settings to compare", "نزّل مصدرًا آخر من الإعدادات للمقارنة", "Скачайте ещё источник в настройках для сравнения"], "Hazır": ["Tamam", "Done", "تم", "Готово"], "Bu söz üçün izah yoxdur": ["Bu kelime için açıklama yok", "No note for this word", "لا بيان لهذه الكلمة", "Нет пояснения к этому слову"], "Bu söz üçün Sirac izahı yoxdur": ["Bu kelime için Sirac açıklaması yok", "No Sirac note for this word", "لا بيان في السراج لهذه الكلمة", "В Сирадже нет пояснения к этому слову"], "Mədinə məshəfi": ["Medine mushafı", "Madinah mushaf", "مصحف المدينة", "Мусхаф Медины"]};
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
    ayahText(1, 1); quranFont();
    const ctl = (running[r.id] = { stop: false });
    try {
      if (r.k === "tr" && !r.per) {
        const res = await fetch(RB + "tr/" + r.id + ".json"); if (!res.ok) throw new Error("http");
        const j = await res.json();
        for (let s = 1; s <= 114; s++) { await put(r.id + ":" + s, j.v[s - 1]); prog(s); }
        await put(r.id + ":n", 114); return;
      }
      for (let s = (await status(r.id)) + 1; s <= 114; s++) {
        if (ctl.stop) throw new Error("stopped");
        const res = await fetch(RB + r.k + "/" + r.id + "/" + s + ".json"); if (!res.ok) throw new Error("http");
        const j = await res.json();
        const out = r.k === "tr" ? j.t : j;
        if (!Array.isArray(out) || out.length !== AYAHS[s - 1]) throw new Error("bad file");
        if (r.k === "tr" && Array.isArray(j.f)) await put(r.id + ":f:" + s, j.f);
        if (r.k === "wb" && !(await get("wbw:" + s))) { const wr = await fetch(RB + "wb/seraj/w" + s + ".json"); if (!wr.ok) throw new Error("http"); await put("wbw:" + s, await wr.json()); } // the ayah's words (Arabic only) for the double-tap word balloon, shared by the word-meaning books
        await put(r.id + ":" + s, out); await put(r.id + ":n", s); prog(s);
      }
    } finally { delete running[r.id]; }
  }
  const remove = (id) => tx("readwrite", (s) => { s.delete(IDBKeyRange.bound(id + ":", id + ":\uffff")); });
  async function entry(id, s, a) {
    const v = await get(id + ":" + s); if (!v) return null;
    if (kindOf(id) === "wb") return { text: v[a - 1] || "", from: a, to: a, exact: true }; // word meanings belong to their own ayah only
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
  back.addEventListener("click", (e) => { if (e.target === back && !back.classList.contains("qm-page")) closeAll(); });
  document.body.appendChild(back);
  let setView = "menu";
  let setHist = false;
  function closeSettingsPage() {
    setHist = false;
    setView = "menu";
    back.classList.remove("qm-page");
    back.hidden = true;
    closePop();
    sheet.replaceChildren();
  }
  function closeAll() {
    if (back.classList.contains("qm-page")) {
      if (setView !== "menu") { setView = "menu"; paintSettings(); return; }
      if (setHist && history.state && history.state.qmSet) { history.back(); return; }
      closeSettingsPage();
      return;
    }
    back.hidden = true; cur = null; closePop(); window.QM_HL && window.QM_HL(sel ? sel.slice() : null); sheet.replaceChildren();
  }
  window.addEventListener("popstate", () => { if (back.classList.contains("qm-page")) closeSettingsPage(); });
  const ICON = {
    lang: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.6 2.6 2.6 14.4 0 17M12 3.5c-2.6 2.6-2.6 14.4 0 17"/>',
    size: '<path d="M4 18 8.5 6 13 18M5.6 14h5.8M15 18l3-7.5 3 7.5M15.9 16h4.2"/>',
    tf: '<path d="M4 5.5C6.5 4.5 9.5 4.5 12 6c2.5-1.5 5.5-1.5 8-.5v13c-2.5-1-5.5-1-8 .5-2.5-1.5-5.5-1.5-8-.5zM12 6v13.5"/>',
    tr: '<path d="M4 6h9M8.5 4v2M6 6c.5 3 2.5 5.5 5 6.5M11 6c-.5 3-2.5 5.5-5 6.5M13 20l3.5-8 3.5 8M14.2 17.3h4.6"/>',
  };
  const pop = el("div", "qm-pop"); pop.hidden = true; document.body.appendChild(pop);
  let popAnchor = null;
  function closePop() { pop.hidden = true; popAnchor = null; pop.replaceChildren(); }
  document.addEventListener("pointerdown", (ev) => {
    if (pop.hidden) return;
    const t = ev.target;
    if (t instanceof Element && t.closest(".qm-pop, .set-line")) return;
    closePop();
  });
  function placePop(anchor) {
    pop.hidden = false;
    pop.style.left = "0.7rem";
    pop.style.right = "0.7rem";
    const r = anchor.getBoundingClientRect();
    const below = window.innerHeight - r.bottom;
    const cap = Math.min(340, Math.round(window.innerHeight * 0.52));
    if (below >= 150 || below >= r.top) {
      pop.style.top = Math.round(r.bottom + 6) + "px";
      pop.style.bottom = "auto";
      pop.style.maxHeight = Math.max(120, Math.min(cap, below - 12)) + "px";
    } else {
      pop.style.top = "auto";
      pop.style.bottom = Math.round(window.innerHeight - r.top + 6) + "px";
      pop.style.maxHeight = Math.max(120, Math.min(cap, r.top - 12)) + "px";
    }
  }
  function togglePop(anchor, fill) {
    if (!pop.hidden && popAnchor === anchor) { closePop(); return; }
    popAnchor = anchor;
    pop.replaceChildren();
    fill();
    placePop(anchor);
  }
  function langName() { return (LANGS.find((l) => l[0] === uiLang()) || LANGS[0])[1]; }
  function resLabel(k) {
    const id = prefs()[k];
    const r = LIST.find((x) => x.id === id);
    return r ? r.name : T("Seçilməyib");
  }
  function setLine(key, label, value, onClick) {
    const b = el("button", "set-line");
    b.type = "button";
    b.dataset.k = key;
    const v = el("span", "v", value); v.dir = "auto";
    b.append(el("span", "k", label), v, el("span", "chev", "›"));
    b.onclick = () => onClick(b);
    return b;
  }
  function openLangPop(anchor) {
    togglePop(anchor, () => {
      for (const [id, nm] of LANGS) {
        const b = el("button", "lang-opt" + (id === uiLang() ? " on" : ""), nm);
        b.type = "button";
        b.onclick = () => { localStorage.setItem("qm.lang", id); closePop(); refreshUi(); };
        pop.append(b);
      }
    });
  }
  function openResPop(kind, anchor) {
    togglePop(anchor, () => {
      const items = LIST.filter((r) => r.k === kind);
      const sorted = kind === "tr" ? [...items].sort((a, b) => a.by.localeCompare(b.by) || a.name.localeCompare(b.name)) : items;
      const ul = el("ul", "qm-list");
      let grp = null;
      for (const r of sorted) {
        if (kind === "tr" && r.by !== grp) { grp = r.by; const g = el("li", "qm-grp", grp); g.dir = "auto"; ul.append(g); }
        ul.append(resRow(r));
      }
      pop.append(ul);
    });
  }
  function renderHome() {
    const head = document.querySelector(".idx-head");
    if (head) head.dir = uiLang() === "ar" ? "rtl" : "ltr";
  }
  function refreshUi() {
    renderHome();
    if (!back.hidden && sheet.classList.contains("qm-set")) openSettings();
    window.dispatchEvent(new CustomEvent("qm-ui"));
  }

  const LI = { az: 0, tr: 1, en: 2, ar: 3, ru: 4 };
  const L = (row) => row[LI[uiLang()]] ?? row[0];
  const IC = {
    lang: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.2 2.6 3.4 5.6 3.4 9s-1.2 6.4-3.4 9c-2.2-2.6-3.4-5.6-3.4-9s1.2-6.4 3.4-9z"/>',
    book: '<path d="M5 4.5A2.5 2.5 0 0 1 7.5 2.5H20v16H7.5A2.5 2.5 0 0 0 5 21z"/><path d="M5 4.5A2.5 2.5 0 0 1 7.5 7H20"/>',
    tr: '<path d="M4 5h7M7.5 5c.2 3.2-1.2 5.6-3.5 7.2M5.2 9.2c1 .8 2.2 1.4 3.6 1.6"/><path d="M13 20.5 16.2 11h1.6L21 20.5M14.3 17h5.4"/>',
    size: '<path d="M4 19 8.6 6h1.5L15 19M6.2 14.2h6.2M16.5 19V9.5M16.5 9.5H19M16.5 9.5h-2"/>',
    shield: '<path d="M12 3 5 6v6c0 4 2.7 6.9 7 8.5 4.3-1.6 7-4.5 7-8.5V6z"/><path d="m8.5 12 2.2 2.2 4.3-4.4"/>',
    doc: '<path d="M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v5h5M8.5 13h7M8.5 16.5h5"/>',
    lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    key: '<circle cx="8" cy="15" r="3"/><path d="M11 15h9M17 15v2.4M14.2 15v2"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.6h.01"/>',
    mail: '<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="m4 7 8 6 8-6"/>',
    src: '<path d="m12 3 9 5-9 5L3 8z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/>',
  };
  const icEl = (name) => { const s = el("span", "ic"); s.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + IC[name] + "</svg>"; return s; };
  function card(icon, title, hint, onClick) {
    const b = el(onClick ? "button" : "div", "set-card" + (onClick ? "" : " static"));
    if (onClick) b.type = "button";
    const tx = el("span", "tx");
    tx.append(el("b", "", title));
    b.append(icEl(icon), tx);
    if (hint) { const sm = el("span", "v", hint); sm.dir = "auto"; b.append(sm); }
    if (onClick) { b.append(el("span", "chev", "›")); b.onclick = onClick; }
    return b;
  }
  const openDoc = (id) => { setView = id; paintSettings(); };
  const P5 = (...rows) => rows;
  const DOCS = {
    privacy: { title: P5("Məxfilik siyasəti", "Gizlilik politikası", "Privacy policy", "سياسة الخصوصية", "Политика конфиденциальности"), blocks: [
      { p: P5("Son yenilənmə: 2 noyabr 2026. Bu mətn Play Market forması üçün də keçərlidir.", "Son güncelleme: 2 Kasım 2026. Bu metin Play Store formu için de geçerlidir.", "Last updated: 2 November 2026. This text is also what you enter in the Play Console.", "آخر تحديث: 2 نوفمبر 2026. هذا النص صالح أيضاً لنموذج بلاي.", "Обновлено: 2 ноября 2026. Этот текст подходит и для формы Play Console.") },
      { h: P5("Kimik", "Kimiz", "Who we are", "من نحن", "Кто мы"), p: P5("Mushafuk Qurani-Kərimin Mədinə məshəfini oxumaq üçündür. Tətbiqi Nibras Code (nibrascode.com) dərc edir.", "Mushafuk, Kur’an-ı Kerim’in Medine mushafını okumak içindir. Uygulamayı Nibras Code (nibrascode.com) yayımlar.", "Mushafuk is a reader for the Madinah mushaf of the Quran. It is published by Nibras Code (nibrascode.com).", "مصحفك لقراءة مصحف المدينة من القرآن الكريم. ينشره Nibras Code (nibrascode.com).", "Mushafuk — чтение Медины-мусхафа Корана. Публикует Nibras Code (nibrascode.com).") },
      { h: P5("Nə toplamırıq", "Neyi toplamayız", "What we do not collect", "ما لا نجمعه", "Что мы не собираем"), p: P5("Hesab yoxdur. Ad, e-poçt, telefon, yer, kontakt, foto və cihaz identifikatoru alınmır. Reklam, analitik və izləmə yoxdur. Məlumat satılmır və heç bir şirkətlə paylaşılmır.", "Hesap yoktur. Ad, e-posta, telefon, konum, kişiler, fotoğraf ve cihaz kimliği alınmaz. Reklam, analitik ve izleme yoktur. Veri satılmaz ve kimseyle paylaşılmaz.", "There is no account. We do not take your name, email, phone, location, contacts, photos, or device id. There are no ads, analytics, or trackers. Data is not sold or shared.", "لا يوجد حساب. لا نأخذ الاسم ولا البريد ولا الهاتف ولا الموقع ولا جهات الاتصال ولا الصور ولا معرّف الجهاز. لا إعلانات ولا تحليلات ولا تتبّع. لا نبيع البيانات ولا نشاركها.", "Аккаунта нет. Имя, почта, телефон, геолокация, контакты, фото и id устройства не собираются. Нет рекламы, аналитики и трекеров. Данные не продаются и не передаются.") },
      { h: P5("Cihazda qalanlar", "Cihazda kalanlar", "What stays on the device", "ما يبقى على الجهاز", "Что остаётся на устройстве"), p: P5("Dil, mətn ölçüsü, seçilmiş təfsir və tərcümə, əlfəcinlər və endirdiyiniz fayllar yalnız bu cihazda saxlanır. Serverə göndərilmir.", "Dil, yazı boyutu, seçilen tefsir ve meal, yer imleri ve indirdiğiniz dosyalar yalnız bu cihazda durur. Sunucuya gitmez.", "Language, text size, the tafsir and translation you pick, bookmarks, and downloaded files stay on this device only. They are not sent to a server.", "اللغة وحجم النص والتفسير والترجمة المختاران والعلامات والملفات التي تنزّلها تبقى على هذا الجهاز فقط ولا تُرسل إلى خادم.", "Язык, размер текста, выбранные тафсир и перевод, закладки и скачанные файлы хранятся только на устройстве и не уходят на сервер.") },
      { h: P5("İnternet", "İnternet", "Internet", "الإنترنت", "Интернет"), p: P5("İnternet yalnız siz təfsir və ya tərcümə endirəndə işlənir. Yükləmə HTTPS ilə gedir. Faylı ayarlardan silə bilərsiniz.", "İnternet yalnızca siz tefsir veya meal indirince kullanılır. İndirme HTTPS iledir. Dosyayı ayarlardan silebilirsiniz.", "Internet is used only when you download a tafsir or a translation, over HTTPS. You can delete that file in Settings.", "يُستخدم الإنترنت فقط حين تنزّل تفسيراً أو ترجمة عبر HTTPS. يمكنك حذف الملف من الإعدادات.", "Интернет нужен только когда вы скачиваете тафсир или перевод, по HTTPS. Файл можно удалить в настройках.") },
      { h: P5("Uşaqlar", "Çocuklar", "Children", "الأطفال", "Дети"), p: P5("Tətbiq 13 yaşdan kiçiklərə yönəlmir və onlardan bilərəkdən məlumat alınmır. Məzmun Qurani-Kərimdir, reklam yoxdur, hər yaşa uyğundur.", "Uygulama 13 yaşından küçüklere yönelik değildir ve onlardan bilerek veri alınmaz. İçerik Kur’an’dır, reklam yoktur, her yaşa uygundur.", "The app is not directed at children under 13 and does not knowingly collect their data. The content is the Quran, there are no ads, and it is suitable for all ages.", "التطبيق غير موجّه لمن هم دون 13 ولا نجمع بياناتهم عن قصد. المحتوى قرآن بلا إعلانات ومناسب لكل الأعمار.", "Приложение не предназначено для детей младше 13 лет и сознательно не собирает их данные. Содержание — Коран, без рекламы, для любого возраста.") },
      { p: P5("Ünvan: https://nibrascode.com/privacy/mushafuk", "Adres: https://nibrascode.com/privacy/mushafuk", "URL: https://nibrascode.com/privacy/mushafuk", "الرابط: https://nibrascode.com/privacy/mushafuk", "Адрес: https://nibrascode.com/privacy/mushafuk") },
    ]},
    terms: { title: P5("İstifadə şərtləri", "Kullanım şartları", "Terms of use", "شروط الاستخدام", "Условия использования"), blocks: [
      { p: P5("Mushafuk-u açmaqla bu şərtləri qəbul edirsiniz. Tətbiq pulsuzdur. İçində alış və reklam yoxdur.", "Mushafuk’u açarak bu şartları kabul edersiniz. Uygulama ücretsizdir. İçinde satın alma ve reklam yoktur.", "Opening Mushafuk means you accept these terms. The app is free. There are no purchases and no ads.", "بفتح مصحفك فإنك تقبل هذه الشروط. التطبيق مجاني بلا مشتريات ولا إعلانات.", "Открывая Mushafuk, вы принимаете эти условия. Приложение бесплатное, без покупок и рекламы.") },
      { h: P5("Mətn", "Metin", "The text", "النص", "Текст"), p: P5("Ərəbcə mətn Mədinə məshəfinin rəsmidir. Biz onu dəyişmirik. Tərcümə və təfsir müəlliflərinə məxsusdur və seçdiyiniz nüsxə olduğu kimi göstərilir.", "Arapça metin Medine mushafının resmidir. Onu değiştirmeyiz. Meal ve tefsir müelliflerine aittir ve seçtiğiniz nüsha olduğu gibi gösterilir.", "The Arabic text is the Madinah mushaf. We do not change it. Translations and tafsirs belong to their authors and are shown as you downloaded them.", "النص العربي رسم مصحف المدينة ولا نغيّره. الترجمة والتفسير لمؤلّفيهما ويُعرضان كما نزّلتهما.", "Арабский текст — мединский мусхаф, мы его не меняем. Переводы и тафсиры принадлежат авторам и показываются как скачаны.") },
      { h: P5("İstifadə", "Kullanım", "Use", "الاستخدام", "Использование"), p: P5("Şəxsi oxumaq üçündür. Tətbiqin özünü satmaq, içindəki mətnin müəllif hüququnu pozmaq və ya zərərli məqsədlə dəyişdirmək olmaz.", "Kişisel okuma içindir. Uygulamanın kendisini satmak, metnin telifini çiğnemek veya zararlı amaçla değiştirmek olmaz.", "It is for personal reading. You may not sell the app, infringe the authors’ rights, or modify it for a harmful purpose.", "هو للقراءة الشخصية. لا يجوز بيع التطبيق ولا انتهاك حقوق المؤلفين ولا تعديله لغرض ضار.", "Только для личного чтения. Нельзя продавать приложение, нарушать права авторов или менять его во вред.") },
      { p: P5("Tətbiq olduğu kimi verilir. Tərcümənin mənası barədə son söz mətnin öz müəllifindədir.", "Uygulama olduğu gibi sunulur. Mealın anlamında son söz müellifindir.", "The app is provided as is. The author of a translation has the last word on its meaning.", "يُقدَّم التطبيق كما هو. القول الفصل في معنى الترجمة لمؤلّفها.", "Приложение даётся как есть. Последнее слово о смысле перевода — за его автором.") },
    ]},
    data: { title: P5("Məlumat təhlükəsizliyi", "Veri güvenliği", "Data safety", "أمان البيانات", "Безопасность данных"), blocks: [
      { p: P5("Play Market-in məlumat forması üçün cavablar belədir.", "Play Store veri formu için cevaplar şöyledir.", "These are the answers for the Play Data safety form.", "هذه إجابات نموذج أمان البيانات في بلاي.", "Так отвечайте в форме Data safety в Play.") },
      { p: P5("Məlumat toplanır: Xeyr. Məlumat paylaşılır: Xeyr. Məlumat satılır: Xeyr.", "Veri toplanır: Hayır. Veri paylaşılır: Hayır. Veri satılır: Hayır.", "Data collected: No. Data shared: No. Data sold: No.", "هل تُجمع بيانات: لا. هل تُشارك: لا. هل تُباع: لا.", "Данные собираются: нет. Передаются: нет. Продаются: нет.") },
      { p: P5("Reklam yoxdur. Analitika yoxdur. Hesab yoxdur, ona görə hesab silmə də yoxdur.", "Reklam yok. Analitik yok. Hesap yok, bu yüzden hesap silme de yok.", "No ads. No analytics. No account, so there is no account deletion.", "لا إعلانات ولا تحليلات ولا حساب، لذلك لا حذف حساب.", "Нет рекламы, нет аналитики, нет аккаунта — удалять аккаунт нечего.") },
      { p: P5("Endirmə yolda şifrələnir (HTTPS). Endirdiyiniz təfsir və tərcüməni ayarlardan silə bilərsiniz.", "İndirme yolda şifrelenir (HTTPS). İndirdiğiniz tefsir ve meali ayarlardan silebilirsiniz.", "Downloads are encrypted in transit (HTTPS). You can delete a tafsir or translation in Settings.", "التنزيل مشفّر أثناء النقل (HTTPS). يمكنك حذف التفسير أو الترجمة من الإعدادات.", "Загрузка шифруется в пути (HTTPS). Тафсир и перевод удаляются в настройках.") },
    ]},
    perm: { title: P5("İcazələr", "İzinler", "Permissions", "الأذونات", "Разрешения"), blocks: [
      { p: P5("Tətbiq kamera, mikrofon, yer, kontakt, SMS, təqvim və fayl sistemindən icazə istəmir.", "Uygulama kamera, mikrofon, konum, kişiler, SMS, takvim ve dosya sistemi izni istemez.", "The app does not ask for camera, microphone, location, contacts, SMS, calendar, or file access.", "لا يطلب التطبيق الكاميرا ولا الميكروفون ولا الموقع ولا جهات الاتصال ولا الرسائل ولا التقويم ولا ملفات الجهاز.", "Приложение не просит камеру, микрофон, геолокацию, контакты, SMS, календарь и доступ к файлам.") },
      { p: P5("İnternet yalnız sizin seçdiyiniz təfsir və ya tərcüməni endirmək üçündür. Endirməsəniz oxuma internetsiz də işləyir.", "İnternet yalnızca seçtiğiniz tefsir veya meali indirmek içindir. İndirmezseniz okuma internetsiz de çalışır.", "Internet is only for downloading the tafsir or translation you choose. Reading works offline if you do not download.", "الإنترنت فقط لتنزيل التفسير أو الترجمة التي تختارها. القراءة تعمل بلا إنترنت إن لم تنزّل.", "Интернет только чтобы скачать выбранный тафсир или перевод. Чтение работает и без сети, если ничего не качать.") },
    ]},
    about: { title: P5("Tətbiq haqqında", "Uygulama hakkında", "About", "حول التطبيق", "О приложении"), blocks: [
      { p: P5("Mushafuk. Versiya 1.0.0. Mədinə məshəfi.", "Mushafuk. Sürüm 1.0.0. Medine mushafı.", "Mushafuk. Version 1.0.0. Madinah mushaf.", "مصحفك. الإصدار 1.0.0. مصحف المدينة.", "Mushafuk. Версия 1.0.0. Мусхаф Медины.") },
      { p: P5("Səhifə səhifə ərəbcə mətn, surə siyahısı, ərəbcə söz axtarışı, təfsir və tərcümə. Dil: azərbaycan, türk, ingilis, ərəb, rus.", "Sayfa sayfa Arapça metin, sure listesi, Arapça kelime arama, tefsir ve meal. Dil: Azerbaycan, Türkçe, İngilizce, Arapça, Rusça.", "Page by page Arabic text, a surah index, Arabic word search, tafsir and translation. Languages: Azerbaijani, Turkish, English, Arabic, Russian.", "نص عربي صفحةً بصفحة، وفهرس سور، وبحث عن كلمة عربية، وتفسير وترجمة. اللغات: الأذربيجانية والتركية والإنجليزية والعربية والروسية.", "Текст по страницам, список сур, поиск арабского слова, тафсир и перевод. Языки: азербайджанский, турецкий, английский, арабский, русский.") },
      { p: P5("Yaş: hər kəs. Kateqoriya: kitab və məlumat. Reklam yoxdur. Ödəniş yoxdur.", "Yaş: herkes. Kategori: kitaplar ve referans. Reklam yok. Ödeme yok.", "Age: everyone. Category: books and reference. No ads. No payments.", "العمر: للجميع. الفئة: كتب ومراجع. بلا إعلانات وبلا دفع.", "Возраст: для всех. Категория: книги и справочники. Без рекламы и платежей.") },
      { p: P5("Nibras Code · https://nibrascode.com", "Nibras Code · https://nibrascode.com", "Nibras Code · https://nibrascode.com", "Nibras Code · https://nibrascode.com", "Nibras Code · https://nibrascode.com") },
    ]},
    contact: { title: P5("Əlaqə", "İletişim", "Contact", "التواصل", "Контакт"), blocks: [
      { p: P5("Dəstək və rəy üçün: nibrascode@gmail.com", "Destek ve görüş için: nibrascode@gmail.com", "Support and feedback: nibrascode@gmail.com", "للدعم والملاحظات: nibrascode@gmail.com", "Поддержка и отзывы: nibrascode@gmail.com") },
      { p: P5("Sayt: https://nibrascode.com", "Site: https://nibrascode.com", "Website: https://nibrascode.com", "الموقع: https://nibrascode.com", "Сайт: https://nibrascode.com") },
      { p: P5("https://github.com/nihomaho9-ui/quran-medine", "https://github.com/nihomaho9-ui/quran-medine", "https://github.com/nihomaho9-ui/quran-medine", "https://github.com/nihomaho9-ui/quran-medine", "https://github.com/nihomaho9-ui/quran-medine") },
      { p: P5("Məxfilik ünvanı: https://nibrascode.com/privacy/mushafuk", "Gizlilik adresi: https://nibrascode.com/privacy/mushafuk", "Privacy URL: https://nibrascode.com/privacy/mushafuk", "رابط الخصوصية: https://nibrascode.com/privacy/mushafuk", "Адрес политики: https://nibrascode.com/privacy/mushafuk") },
    ]},
    sources: { title: P5("Mənbələr", "Kaynaklar", "Sources", "المصادر", "Источники"), blocks: [
      { p: P5("Ərəbcə mətn Tanzil Uthmani mətnidir. Səhifə düzümü və xətt Mədinə məshəfinə uyğundur.", "Arapça metin Tanzil Uthmani metnidir. Sayfa düzeni ve hat Medine mushafına uygundur.", "The Arabic text is the Tanzil Uthmani text. The page layout and script follow the Madinah mushaf.", "النص العربي نص تنزيل العثماني. تخطيط الصفحة والخط وفق مصحف المدينة.", "Арабский текст — Uthmani с Tanzil. Вёрстка и почерк — по мединскому мусхафу.") },
      { p: P5("Tərcümə və təfsirlər öz müəlliflərinə məxsusdur. Siyahıdakı ad həmin nüsxənin adıdır və mətn dəyişdirilmir.", "Meal ve tefsirler müelliflerine aittir. Listedeki ad o nüshanın adıdır ve metin değiştirilmez.", "Translations and tafsirs belong to their authors. The name in the list is the name of that copy, and the text is not altered.", "الترجمات والتفاسير لمؤلّفيها. الاسم في القائمة اسم تلك النسخة ولا يُغيَّر النص.", "Переводы и тафсиры принадлежат авторам. Имя в списке — имя этой копии, текст не меняется.") },
    ]},
  };

  function paintSettings() {
    sheet.replaceChildren();
    sheet.dir = uiLang() === "ar" ? "rtl" : "ltr";
    const titles = { menu: T("Ayarlar"), lang: T("Dil"), tf: T("Təfsir"), tr: T("Tərcümə"), wb: T("Söz mənaları") };
    const bar = el("div", "qm-page-bar");
    const bk = el("button", "qm-page-back", "‹");
    bk.type = "button";
    bk.setAttribute("aria-label", T("Əvvəlki"));
    bk.onclick = () => { if (setView !== "menu") { setView = "menu"; paintSettings(); } else closeAll(); };
    bar.append(bk, el("h2", "", (DOCS[setView] && L(DOCS[setView].title)) || titles[setView] || T("Ayarlar")), el("span", "qm-page-sp"));
    const body = el("div", "qm-scroll");
    sheet.append(bar, body);
    if (DOCS[setView]) {
      const box = el("div", "qm-legal");
      for (const block of DOCS[setView].blocks) {
        const sec = el("section", "");
        if (block.h) sec.append(el("h3", "", L(block.h)));
        const p = el("p", "");
        const text = L(block.p);
        const m = text.match(/https:\/\/\S+/);
        if (m) {
          const i = text.indexOf(m[0]);
          if (text.slice(0, i).trim()) p.append(text.slice(0, i).replace(/:\s*$/, ""));
          const a = el("a", "", m[0]); a.href = m[0]; a.target = "_blank"; a.rel = "noopener";
          p.append(a);
          if (text.slice(i + m[0].length).trim()) p.append(text.slice(i + m[0].length));
        } else p.textContent = text;
        sec.append(p);
        box.append(sec);
      }
      body.append(box);
      return;
    }
    if (setView === "lang") {
      const list = el("div", "qm-page-list");
      for (const [id, nm] of LANGS) {
        const b = el("button", "lang-opt" + (id === uiLang() ? " on" : ""), nm);
        b.type = "button";
        b.onclick = () => { localStorage.setItem("qm.lang", id); setView = "menu"; refreshUi(); };
        list.append(b);
      }
      body.append(list);
      return;
    }
    if (setView === "tf" || setView === "tr" || setView === "wb") {
      const items = LIST.filter((r) => r.k === setView);
      const sorted = setView === "tr" ? [...items].sort((a, b) => a.by.localeCompare(b.by) || a.name.localeCompare(b.name)) : items;
      const ul = el("ul", "qm-list");
      let grp = null;
      for (const r of sorted) {
        if (setView === "tr" && r.by !== grp) { grp = r.by; const g = el("li", "qm-grp", grp); g.dir = "auto"; ul.append(g); }
        ul.append(resRow(r));
      }
      body.append(ul);
      return;
    }
    body.append(el("p", "set-sec", T("Oxuma")));
    const stack = el("div", "home-set");
    stack.append(
      card("lang", T("Dil"), langName(), () => { setView = "lang"; paintSettings(); }),
      card("book", T("Təfsir"), resLabel("tf"), () => { setView = "tf"; paintSettings(); }),
      card("tr", T("Tərcümə"), resLabel("tr"), () => { setView = "tr"; paintSettings(); }),
      card("book", T("Söz mənaları"), resLabel("wb") === T("Seçilməyib") ? "Sirac" : resLabel("wb"), () => { setView = "wb"; paintSettings(); }),
    );
    const sc = card("size", T("Mətn ölçüsü"), "");
    const row = el("div", "qm-size"); const minus = el("button", "qm-chip", "A−"), val = el("b", "", ""), plus = el("button", "qm-chip", "A+");
    const upd = () => { const f = prefs().fs; val.textContent = Math.round(f * 100) + "%"; minus.disabled = f <= 0.8; plus.disabled = f >= 1.6; };
    minus.onclick = () => { setPrefs({ fs: Math.round((prefs().fs - 0.1) * 10) / 10 }); upd(); };
    plus.onclick = () => { setPrefs({ fs: Math.round((prefs().fs + 0.1) * 10) / 10 }); upd(); };
    upd(); row.append(minus, val, plus); sc.append(row); stack.append(sc);
    body.append(stack);
    body.append(el("p", "set-sec", T("Tətbiq")));
    const play = el("div", "home-set");
    play.append(
      card("shield", T("Məxfilik siyasəti"), "", () => openDoc("privacy")),
      card("doc", T("İstifadə şərtləri"), "", () => openDoc("terms")),
      card("lock", T("Məlumat təhlükəsizliyi"), "", () => openDoc("data")),
      card("key", T("İcazələr"), "", () => openDoc("perm")),
      card("info", T("Tətbiq haqqında"), "1.0.0", () => openDoc("about")),
      card("mail", T("Əlaqə"), "", () => openDoc("contact")),
      card("src", T("Mənbələr"), "", () => openDoc("sources")),
    );
    body.append(play);
  }
  async function openSettings(focus) {
    if (!LIST.length) LIST = await (await fetch("./lib-list.json")).json();
    closePop();
    const already = back.classList.contains("qm-page") && !back.hidden;
    sheet.onpointerdown = sheet.onpointerup = null;
    sheet.className = "qm-sheet qm-set";
    back.classList.add("qm-page");
    if (focus === "tf" || focus === "tr" || focus === "wb") setView = focus;
    else if (!already || setView === "lang") setView = "menu";
    paintSettings();
    back.hidden = false;
    if (!already) { history.pushState({ qmSet: 1 }, ""); setHist = true; }
  }
  function resRow(r) {
    const li = el("li", "qm-res"); li.dataset.id = r.id;
    const tx = el("div", "qm-tx"); const nm = el("b", "", r.name); nm.dir = "auto"; const sm = el("small", "", (r.k === "tr" ? "" : r.by + " · ") + r.mb + " MB"); sm.dir = "auto";
    const bar = el("span", "qm-bar"); const fill = el("i"); bar.append(fill); bar.hidden = true; const err = el("small", "qm-err", ""); tx.append(nm, sm, bar, err);
    if (r.credit) { const cr = el("small", "qm-credit", r.credit); cr.dir = "ltr"; tx.insertBefore(cr, bar); }
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
      else { b(chosen ? T("✓ Seçilib") : T("Seç"), chosen ? "sel" : "", () => { setPrefs({ [r.k]: r.id }); document.querySelectorAll(".qm-res").forEach((x) => x._draw && x._draw()); renderHome(); }); b("🗑", "ghost", () => { ask = true; draw(); }); }
    };
    li._draw = draw;
    const go = async () => { busy = true; err.textContent = ""; draw(); try { await download(r, (k) => { n = k; draw(); }); if (!prefs()[r.k] || prefs()[r.k] !== r.id) setPrefs({ [r.k]: r.id }); } catch (e) { if (e.message !== "stopped") err.textContent = T("Alınmadı. İnterneti yoxlayın."); } busy = false; n = await status(r.id); document.querySelectorAll(".qm-res").forEach((x) => x._draw && x._draw()); renderHome(); };
    const del = async () => { await remove(r.id); n = 0; ask = false; if (prefs()[r.k] === r.id) setPrefs({ [r.k]: "" }); draw(); renderHome(); };
    status(r.id).then((v) => { n = v; draw(); });
    draw();
    return li;
  }

  /* ---------- ayah text, bookmarks, toast ---------- */
  let textP = null;
  // Arabic text: kept in IndexedDB after the first load so share / copy / full screen work offline
  // Tanzil puts the 4-word basmala before ayah 1 of every surah except 1 and 9: it is not part of the ayah
  const forFont = (t) => t.replace(/\u06DF/g, "\u06E0"); // the Hafs font has no glyph for U+06DF (small high rounded zero)
  const parseText = (t) => { const m = {}; for (const l of t.split("\n")) { const [x, y, z] = l.split("|"); if (z) m[x + ":" + y] = (y === "1" && x !== "1" && x !== "9" ? z.trim().split(/\s+/).slice(4).join(" ") : z).trim(); } return m; };
  const loadText = async () => {
    const saved = await get("quran:txt").catch(() => null);
    if (saved) return parseText(saved);
    const t = await (await fetch("./quran-uthmani.txt")).text();
    put("quran:txt", t).catch(() => {});
    return parseText(t);
  };
  const ayahText = (s, a) => (textP ||= loadText().catch((e) => { textP = null; return {}; })).then((m) => m[s + ":" + a] || "");
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
    full: '<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/>',
    cmp: '<rect x="3.5" y="5" width="7.5" height="14" rx="1.6"/><rect x="13" y="5" width="7.5" height="14" rx="1.6"/>',
    plus: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M12 8.5v7M8.5 12h7"/>',
  };
  const icon = (name, label, filled) => { const b = el("button", "qm-ic" + (filled ? " on" : "")); b.type = "button"; b.setAttribute("aria-label", label); b.title = label; b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + SVG[name] + "</svg>"; return b; };

  /* ---------- Ayah sheet ---------- */
  let cur = null;
  async function openAyah(s, a) {
    if (!LIST.length) LIST = await (await fetch("./lib-list.json")).json();
    cur = { s, a }; window.QM_GOTO ? window.QM_GOTO(s + ":" + a) : window.QM_HL && window.QM_HL(s + ":" + a);
    const p = prefs(); const kind = ["tf", "tr", "wb"].includes(p.tab) ? p.tab : "tf";
    const have = []; for (const r of LIST) if (r.k === kind && (await status(r.id)) >= 114) have.push(r);
    const r = have.find((x) => x.id === p[kind]) || have[0];
    const e = r ? await entry(r.id, s, a) : null;
    const fn = r && r.k === "tr" ? ((await get(r.id + ":f:" + s)) || [])[a - 1] : "";
    if (!cur || cur.s !== s || cur.a !== a) return;
    sheet.onpointerdown = sheet.onpointerup = null;
    sheet.className = "qm-sheet qm-ayah"; sheet.replaceChildren(); sheet.dir = uiLang() === "ar" ? "rtl" : "ltr";
    const ref = NAMES[s - 1] + " " + s + ":" + a;
    const bar = el("div", "qm-icons");
    const shareB = icon("share", T("Paylaş")), copyB = icon("copy", T("Kopyala")), markB = icon("mark", T("Əlfəcin"), marks().includes(s + ":" + a)), closeB = icon("close", T("Bağla"));
    shareB.onclick = () => shareMenu([s + ":" + a]);
    copyB.onclick = async () => toast((await copyText(await buildText([s + ":" + a], false))) ? T("Kopyalandı") : T("Alınmadı"));
    const selB = icon("plus", T("Bir neçə ayə seç"));
    selB.onclick = () => { startSelect(s + ":" + a); };
    markB.onclick = () => { const on = toggleMark(s + ":" + a); markB.classList.toggle("on", on); toast(on ? T("Əlfəcinə əlavə olundu") : T("Əlfəcindən silindi")); };
    closeB.onclick = () => { cur = null; window.QM_HL && window.QM_HL(null); closeAll(); };
    closeB.classList.add("end");
    const fullB = icon("full", T("Tam ekran"));
    fullB.onclick = () => openFull(kind, s + ":" + a);
    const cmpB = icon("cmp", T("Müqayisə"));
    cmpB.onclick = () => openCompare(s, a);
    bar.append(shareB, copyB, markB, selB, cmpB, fullB, closeB);
    sheet.append(bar);
    const head = el("div", "qm-head");
    head.append(el("h2", "", NAMES[s - 1] + " · " + (e && e.from !== e.to ? e.from + "–" + e.to : a)));
    const nav = el("span", "qm-nav");
    const max = AYAHS[s - 1];
    const pv = el("button", "qm-step", "‹ " + T("Əvvəlki")), nx = el("button", "qm-step", T("Növbəti") + " ›");
    pv.disabled = s === 1 && a === 1; nx.disabled = s === 114 && a === max;
    const goPrev = () => { if (pv.disabled) return; const f = e ? e.from : a; f > 1 ? openAyah(s, f - 1) : openAyah(s - 1, AYAHS[s - 2]); };
    const goNext = () => { if (nx.disabled) return; const t = e ? e.to : a; t < max ? openAyah(s, t + 1) : openAyah(s + 1, 1); };
    pv.onclick = goPrev; nx.onclick = goNext;
    let sx = null, sy = 0;
    sheet.onpointerdown = (ev) => { if (ev.target.closest("button, select")) return; sx = ev.clientX; sy = ev.clientY; };
    sheet.onpointerup = (ev) => { if (sx == null) return; const dx = ev.clientX - sx, dy = ev.clientY - sy; sx = null; if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) (dx > 0 ? goNext : goPrev)(); };
    nav.append(pv, nx); head.append(nav);
    sheet.append(head);
    const tabs = el("div", "qm-tabs");
    for (const k of ["tf", "tr", "wb"]) { const t = el("button", "qm-tab" + (k === kind ? " on" : ""), k === "tf" ? T("Təfsirlər") : k === "tr" ? T("Tərcümələr") : T("Söz mənaları")); t.onclick = () => { setPrefs({ tab: k }); openAyah(s, a); }; tabs.append(t); }
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
      if (r.k === "wb") renderWb(body, e ? e.text : "", r.id);
      else {
        const txt = e && e.text ? plain(e.text) : "—";
        for (const para of txt.split(/\n{2,}/)) body.append(el("p", "", para));
        if (fn) body.append(el("p", "qm-fn", plain(fn)));
      }
    }
    back.hidden = false;
  }

  /* ---------- several ayahs: text, image, selection ---------- */
  const sortKeys = (keys) => [...new Set(keys)].map((k) => k.split(":").map(Number)).sort((x, y) => x[0] - y[0] || x[1] - y[1]);
  function refOf(keys) {
    const ks = sortKeys(keys);
    const [s0, a0] = ks[0], [s1, a1] = ks[ks.length - 1];
    const contiguous = ks.every((k, i) => i === 0 || (k[0] === ks[i - 1][0] && k[1] === ks[i - 1][1] + 1));
    if (ks.length === 1) return NAMES[s0 - 1] + " " + s0 + ":" + a0;
    if (s0 === s1 && contiguous) return NAMES[s0 - 1] + " " + s0 + ":" + a0 + "–" + a1;
    return ks.map((k) => k[0] + ":" + k[1]).join(", ");
  }
  const AR_DIG = (n) => String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[d]);
  async function trFor(keys) {
    const p = prefs(); if (!p.tr || (await status(p.tr)) < 114) return null;
    const r = (LIST.length ? LIST : (LIST = await (await fetch("./lib-list.json")).json())).find((x) => x.id === p.tr);
    const out = []; for (const [s, a] of sortKeys(keys)) { const e = await entry(p.tr, s, a); if (e && e.text) out.push(plain(e.text).replace(/\[\d+\]/g, "")); }
    return r && out.length ? { name: r.by + " · " + r.name, text: [...new Set(out)].join(" ") } : null;
  }
  async function buildText(keys, withTr) {
    const ks = sortKeys(keys); const parts = [];
    for (const [s, a] of ks) parts.push((await ayahText(s, a)) + (ks.length > 1 ? " ﴿" + AR_DIG(a) + "﴾" : ""));
    let t = parts.join(" ") + "\n— " + refOf(keys);
    if (withTr) { const tr = await trFor(keys); if (tr) t += "\n\n" + tr.name + ":\n" + (tr.text.length > 900 ? tr.text.slice(0, 900).trim() + "…" : tr.text); }
    return t;
  }
  async function shareText(keys) {
    const text = await buildText(keys, true);
    if (navigator.share) { try { await navigator.share({ title: refOf(keys), text }); return; } catch (err) { if (err && err.name === "AbortError") return; } }
    toast((await copyText(text)) ? T("Kopyalandı") : T("Alınmadı"));
  }
  const menu = el("div", "qm-menu"); menu.hidden = true; document.body.appendChild(menu);
  menu.addEventListener("click", (ev) => { if (ev.target === menu) menu.hidden = true; });
  function shareMenu(keys) {
    menu.replaceChildren(); const box = el("div", "qm-menu-box");
    box.append(el("b", "", T("Paylaş") + " · " + refOf(keys)));
    const tb = el("button", "qm-opt", "📝  " + T("Mətn")), ib = el("button", "qm-opt", "🖼  " + T("Şəkil")), cb = el("button", "qm-opt ghost", T("Ləğv"));
    tb.onclick = () => { menu.hidden = true; shareText(keys); };
    ib.onclick = () => { menu.hidden = true; imagePreview(keys); };
    cb.onclick = () => (menu.hidden = true);
    box.append(tb, ib, cb); menu.append(box); menu.hidden = false;
  }
  let fontP = null;
  const quranFont = () => (fontP ||= new FontFace("QMHafs", "url(./yazi-fonts/uthmanic-hafs.woff2)").load().then((f) => (document.fonts.add(f), f)).catch(() => null));
  function wrap(ctx, text, max) {
    const words = text.split(/\s+/).filter(Boolean); const lines = []; let line = "";
    for (const w of words) { const t = line ? line + " " + w : w; if (ctx.measureText(t).width > max && line) { lines.push(line); line = w; } else line = t; }
    if (line) lines.push(line); return lines;
  }
  async function makeImage(keys) {
    await quranFont();
    const W = 1080, P = 90, inner = W - P * 2 - 40;
    const ks = sortKeys(keys); const parts = [];
    for (const [s, a] of ks) parts.push(forFont(await ayahText(s, a)) + " " + AR_DIG(a)); // this font draws the digits as the ayah-end circle
    const tr = await trFor(keys);
    const c = document.createElement("canvas"); const ctx = c.getContext("2d");
    let arSize = 58; ctx.font = arSize + "px QMHafs, serif"; ctx.direction = "rtl";
    let arLines = wrap(ctx, parts.join(" "), inner);
    while (arLines.length > 16 && arSize > 34) { arSize -= 4; ctx.font = arSize + "px QMHafs, serif"; arLines = wrap(ctx, parts.join(" "), inner); }
    const arLH = arSize * 1.95;
    ctx.font = "32px 'Segoe UI', sans-serif"; ctx.direction = "ltr";
    let trText = tr ? tr.text : ""; if (trText.length > 700) trText = trText.slice(0, 700).trim() + "…";
    const trLines = tr ? wrap(ctx, trText, inner) : [];
    const content = 180 + 110 + arLines.length * arLH + (tr ? 70 + trLines.length * 46 + 40 : 0) + 160;
    const H = Math.max(1080, content), off = (H - content) / 2; // short ayahs sit in the middle of a square card
    c.width = W; c.height = H;
    ctx.fillStyle = "#fffaf0"; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "#c4a56e"; ctx.lineWidth = 6; ctx.strokeRect(34, 34, W - 68, H - 68);
    ctx.lineWidth = 2; ctx.strokeRect(50, 50, W - 100, H - 100);
    for (const [x, y] of [[50, 50], [W - 50, 50], [50, H - 50], [W - 50, H - 50]]) { ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI / 4); ctx.fillStyle = "#c4a56e"; ctx.fillRect(-11, -11, 22, 22); ctx.fillStyle = "#1a3330"; ctx.fillRect(-5, -5, 10, 10); ctx.restore(); }
    // header pill
    const ref = refOf(keys);
    ctx.font = "600 36px 'Segoe UI', sans-serif"; ctx.direction = "ltr"; ctx.textAlign = "center";
    const tw = ctx.measureText(ref).width + 80;
    ctx.fillStyle = "#1a3330"; ctx.beginPath(); ctx.roundRect(W / 2 - tw / 2, 110 + off, tw, 70, 35); ctx.fill();
    ctx.strokeStyle = "#c4a56e"; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = "#e4c98a"; ctx.fillText(ref, W / 2, 157 + off);
    let y = 290 + off;
    ctx.fillStyle = "#1a1612"; ctx.font = arSize + "px QMHafs, serif"; ctx.direction = "rtl";
    for (const l of arLines) { ctx.fillText(l, W / 2, y); y += arLH; }
    if (tr) {
      y += 10; ctx.strokeStyle = "#c4a56e"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(W / 2 - 120, y); ctx.lineTo(W / 2 + 120, y); ctx.stroke(); y += 70;
      ctx.direction = "ltr"; ctx.fillStyle = "#3d4a44"; ctx.font = "32px 'Segoe UI', sans-serif";
      for (const l of trLines) { ctx.fillText(l, W / 2, y); y += 46; }
      ctx.fillStyle = "#8a7d68"; ctx.font = "italic 24px 'Segoe UI', sans-serif"; ctx.fillText(tr.name, W / 2, y + 10);
    }
    ctx.direction = "ltr"; ctx.fillStyle = "#8a7d68"; ctx.font = "600 26px 'Segoe UI', sans-serif"; ctx.fillText("Qurani-Kərim · Mədinə məshəfi", W / 2, H - 92);
    return new Promise((ok) => c.toBlob((b) => ok(b), "image/png"));
  }
  async function imagePreview(keys) {
    toast(T("Hazırlanır…"));
    const blob = await makeImage(keys); const url = URL.createObjectURL(blob);
    const name = "quran-" + sortKeys(keys).map((k) => k.join("-")).filter((_, i, l) => i === 0 || i === l.length - 1).join("_") + ".png";
    const file = new File([blob], name, { type: "image/png" });
    toastEl.hidden = true;
    menu.replaceChildren(); const box = el("div", "qm-menu-box qm-prev");
    const img = el("img"); img.src = url; img.alt = refOf(keys); box.append(img);
    const row = el("div", "qm-prev-row");
    const sb = el("button", "qm-rb main", T("Paylaş")), db = el("button", "qm-rb", T("Yadda saxla")), xb = el("button", "qm-rb ghost", T("Bağla"));
    const save = () => { const a = el("a"); a.href = url; a.download = name; document.body.append(a); a.click(); a.remove(); };
    sb.onclick = async () => { if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: refOf(keys) }); return; } catch (err) { if (err && err.name === "AbortError") return; } } save(); };
    db.onclick = save; xb.onclick = () => { menu.hidden = true; URL.revokeObjectURL(url); };
    row.append(sb, db, xb); box.append(row); menu.append(box); menu.hidden = false;
  }
  // selection mode: tap (or hold) ayahs on the page to add / remove them
  let sel = null;
  const selBar = el("div", "qm-selbar"); selBar.hidden = true; document.body.appendChild(selBar);
  function drawSel() {
    if (!sel) { selBar.hidden = true; window.QM_HL && window.QM_HL(null); return; }
    window.QM_HL && window.QM_HL(sel.slice());
    selBar.replaceChildren();
    const chip = el("span", "qm-count", T("N ayə seçilib").replace("N", sel.length)); chip.title = sel.length ? refOf(sel) : "";
    const sb = el("button", "qm-rb main", T("Paylaş")), cb = el("button", "qm-rb", T("Kopyala")), xb = el("button", "qm-rb ghost", T("Ləğv"));
    sb.disabled = cb.disabled = !sel.length;
    sb.onclick = () => shareMenu(sel.slice());
    cb.onclick = async () => toast((await copyText(await buildText(sel, false))) ? T("Kopyalandı") : T("Alınmadı"));
    xb.onclick = () => { sel = null; drawSel(); };
    selBar.append(chip, sb, cb, xb); selBar.hidden = false;
  }
  function startSelect(k) { sel = [k]; closeAll(); drawSel(); toast(T("Başqa ayələrə toxunun")); }
  function tapAyah(k) { if (!sel) return; const i = sel.indexOf(k); i >= 0 ? sel.splice(i, 1) : sel.push(k); drawSel(); }

  /* ---------- fullscreen reader: every ayah of the current mushaf page + tafsir / translation ---------- */
  const fsEl = el("div", "qm-full"); fsEl.hidden = true; document.body.appendChild(fsEl);
  let fsState = null;
  async function openFull(kind, focusKey, pageN, enterFrom) {
    if (!LIST.length) LIST = await (await fetch("./lib-list.json")).json();
    const pg = window.QM_PAGE(pageN); if (!pg) return;
    fsState = { kind, n: pg.n }; quranFont();
    const p = prefs();
    const have = []; for (const r of LIST) if (r.k === kind && (await status(r.id)) >= 114) have.push(r);
    const r = have.find((x) => x.id === p[kind]) || have[0];
    if (!fsState || fsState.n !== pg.n || fsState.kind !== kind) return;
    fsEl.replaceChildren(); fsEl.dir = uiLang() === "ar" ? "rtl" : "ltr";
    const head = el("div", "qm-full-h");
    const [s0] = pg.keys[0].split(":").map(Number);
    const ttl = el("div", "qm-full-t"); ttl.append(el("b", "", NAMES[s0 - 1]), el("small", "", T("Səhifə") + " " + pg.n));
    const sw = el("div", "qm-switch");
    for (const k of ["tr", "tf"]) { const b = el("button", k === kind ? "on" : "", k === "tf" ? T("Təfsir") : T("Tərcümə")); b.onclick = () => { setPrefs({ tab: k }); openFull(k, null, pg.n); }; sw.append(b); }
    const x = icon("close", T("Bağla")); x.onclick = () => { fsEl.hidden = true; fsState = null; };
    head.append(ttl, sw, x); fsEl.append(head);
    const body = el("div", "qm-full-b"); fsEl.append(body);
    if (!r) {
      const box = el("div", "qm-empty"); box.append(el("p", "", T("Hələ endirilməyib.")));
      const b = el("button", "qm-rb main", T("Ayarlarda endir")); b.onclick = () => { fsEl.hidden = true; openSettings(kind); }; box.append(b); body.append(box);
    } else {
      body.append(el("p", "qm-full-src", (r.k === "tr" ? r.by + " · " : "") + r.name));
      let last = "";
      for (const key of pg.keys) {
        const [s, a] = key.split(":").map(Number);
        const blk = el("article", "qm-blk"); blk.dataset.k = key;
        if (a === 1) blk.append(el("h4", "qm-blk-s", NAMES[s - 1]));
        const ar = el("p", "qm-ar", forFont(await ayahText(s, a)) + " " + AR_DIG(a)); ar.dir = "rtl"; ar.lang = "ar"; ar.style.fontSize = 1.45 * p.fs + "rem"; blk.append(ar);
        const e = await entry(r.id, s, a);
        if (e && e.text && last !== s + ":" + e.from) { // a shared tafsir entry is shown once
          const t = el("div", "qm-tx2"); t.dir = r.dir; t.lang = r.lang; t.style.fontSize = (r.lang === "ar" ? 1.12 : 1) * p.fs + "rem";
          if (e.from !== e.to) t.append(el("small", "qm-range", s + ":" + e.from + "–" + e.to));
          for (const para of plain(e.text).split(/\n{2,}/)) t.append(el("p", "", para));
          blk.append(t); last = s + ":" + e.from;
        }
        body.append(blk);
      }

    }
    // page change by finger swipe only (same direction as the mushaf: swipe right = next page); the page follows the finger
    let d = null;
    const W = () => body.clientWidth || 360;
    const slideTo = (x, ms) => { body.style.transition = ms ? "transform " + ms + "ms cubic-bezier(.22,1,.36,1)" : "none"; body.style.transform = x ? "translate3d(" + x + "px,0,0)" : ""; };
    body.onpointerdown = (ev) => { if (ev.target.closest("button")) return; d = { x: ev.clientX, y: ev.clientY, t: performance.now(), mode: null, dx: 0 }; };
    body.onpointermove = (ev) => {
      if (!d) return; const dx = ev.clientX - d.x, dy = ev.clientY - d.y;
      if (!d.mode) { if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return; d.mode = Math.abs(dx) > Math.abs(dy) * 1.2 ? "x" : "y"; if (d.mode === "x") try { body.setPointerCapture(ev.pointerId); } catch (e) {} }
      if (d.mode !== "x") return;
      const n = pg.n + (dx > 0 ? 1 : -1); d.dx = n < 1 || n > 604 ? dx * 0.25 : dx; slideTo(d.dx, 0);
    };
    const end = () => {
      const g = d; d = null; if (!g || g.mode !== "x") return;
      const v = g.dx / Math.max(1, performance.now() - g.t), n = pg.n + (g.dx > 0 ? 1 : -1);
      if ((Math.abs(g.dx) > W() * 0.25 || Math.abs(v) > 0.6) && n >= 1 && n <= 604) {
        const dir = g.dx > 0 ? 1 : -1; slideTo(dir * W(), 220);
        setTimeout(() => openFull(kind, null, n, -dir), 220);
      } else slideTo(0, 220);
    };
    body.onpointerup = end; body.onpointercancel = () => { if (d && d.mode === "x") slideTo(0, 220); d = null; };
    if (enterFrom) { slideTo(enterFrom * W(), 0); requestAnimationFrame(() => requestAnimationFrame(() => slideTo(0, 260))); }
    fsEl.hidden = false;
    const target = focusKey && body.querySelector('[data-k="' + focusKey + '"]');
    if (target) { target.classList.add("cur"); target.scrollIntoView({ block: "start" }); } else body.scrollTop = 0;
  }
  /* ---------- word meanings (as-Sirac): "word: meaning" lines ---------- */
  // Ibn Qutaybah: paragraphs; Qur'an words in ﴿…﴾ / (…) stand out, the editor's notes [[…]] go to numbered footnotes
  function renderGharib(box, t) {
    const notes = [];
    const wrap = el("div", "qm-gh"); wrap.dir = "rtl"; wrap.lang = "ar";
    for (const para of t.split(/\n+/)) {
      const p = el("p", "");
      for (const part of para.split(/(\[\[[\s\S]*?\]\]|﴿[^﴾]*﴾|\((?:[^()\d٠-٩]){2,}\))/)) {
        if (!part) continue;
        if (part.startsWith("[[")) { notes.push(part.slice(2, -2).trim()); p.append(el("sup", "qm-gh-n", AR_DIG(notes.length))); }
        else if (part.startsWith("﴿") || part.startsWith("(")) p.append(el("b", "qm-gh-q", part));
        else p.append(part);
      }
      wrap.append(p);
    }
    if (notes.length) { const ol = el("ol", "qm-gh-notes"); for (const n of notes) ol.append(el("li", "", n)); wrap.append(ol); }
    box.append(wrap);
  }
  function renderWb(box, text, id) {
    const t = String(text || "").trim();
    if (!t) { box.append(el("p", "qm-wb-none", T("Bu ayədə çətin söz izahı yoxdur"))); return; }
    if (id === "ibnqutaybah") return renderGharib(box, t);
    const ul = el("dl", "qm-wb"); ul.dir = "rtl"; ul.lang = "ar";
    for (const line of t.split(/\n+/)) {
      const i = line.indexOf(":");
      const row = el("div", "qm-wb-r");
      if (i > 0) row.append(el("dt", "", line.slice(0, i).trim()), el("dd", "", line.slice(i + 1).trim()));
      else row.append(el("dd", "", line.trim()));
      ul.append(row);
    }
    box.append(ul);
  }

  /* ---------- words of an ayah: Arabic word, root (Quranic Arabic Corpus), as-Sirac note ---------- */
  const bare = (t) => String(t || "").replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, "").replace(/[ٱأإآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/\s+/g, " ").trim();
  async function siracLines(s, a) {
    if ((await status("seraj")) < 114) return null;
    const v = await get("seraj:" + s); const t = v ? v[a - 1] || "" : "";
    return t.split(/\n+/).map((l) => { const i = l.indexOf(":"); return i > 0 ? { w: l.slice(0, i).trim(), m: l.slice(i + 1).trim(), b: bare(l.slice(0, i)) } : null; }).filter(Boolean);
  }
  // a Sirac entry belongs to a word when the diacritic-free forms are equal or the entry is a phrase starting with it
  const siracFor = (lines, word) => { if (!lines) return null; const b = bare(word); return lines.find((x) => x.b === b) || lines.find((x) => x.b.split(" ")[0] === b && x.b.includes(" ")) || null; };
  async function wordsOf(s, a) {
    const have = []; for (const id of ["seraj", "ibnqutaybah"]) if ((await status(id)) >= 114) have.push(id);
    if (!have.length) return null;
    const v = (await get("wbw:" + s)) || (await get("seraj:w:" + s)); return v ? v[a - 1] || [] : null;
  }
  // Ibn Qutaybah: the line of the ayah's entry whose quoted Qur'an words (﴿…﴾ or (…)) contain the word
  async function qutaybahFor(s, a, word) {
    if ((await status("ibnqutaybah")) < 114) return undefined;
    const v = await get("ibnqutaybah:" + s); const t = v ? v[a - 1] || "" : "";
    const b = bare(word).replace(/^و/, "");
    for (const line of t.split(/\n+/)) {
      const qs = [...line.matchAll(/﴿([^﴾]*)﴾|\(([^()]{2,})\)/g)].map((m) => bare(m[1] || m[2]));
      if (qs.some((q) => q.split(" ").some((x) => x === b || x.replace(/^و/, "") === b))) return line.replace(/\s*\[\[[\s\S]*?\]\]\s*/g, " ").replace(/^و(?=[﴿(])/, "").trim();
    }
    return null;
  }
  const noteEl = (sx, w) => { const n = el("p", "qm-w-sirac"); n.append(el("small", "", "Sirac"), el("span", "", (sx.b !== bare(w) ? sx.w + ": " : "") + sx.m)); return n; };
  // double-tap on a mushaf word: a small balloon next to it
  const wpop = el("div", "qm-wpop"); wpop.hidden = true; document.body.appendChild(wpop);
  const closeWpop = () => { if (wpop.hidden) return; wpop.hidden = true; wpop.replaceChildren(); document.querySelectorAll(".w.wsel").forEach((x) => x.classList.remove("wsel")); };
  document.addEventListener("pointerdown", (ev) => { if (!wpop.hidden && !wpop.contains(ev.target)) closeWpop(); }, true);
  async function wordPop(key, pos, elw) {
    closeWpop();
    const [s, a] = key.split(":").map(Number);
    const list = await wordsOf(s, a); await quranFont();
    const item = list && list[pos - 1];
    elw.classList.add("wsel");
    wpop.dir = "rtl";
    if (!list) {
      wpop.dir = uiLang() === "ar" ? "rtl" : "ltr";
      wpop.append(el("p", "qm-wp-none", T("Söz mənaları") + ": " + T("Hələ endirilməyib.")));
      const b = el("button", "qm-rb main", T("Ayarlarda endir")); b.onclick = () => { closeWpop(); openSettings("wb"); }; wpop.append(b);
    } else if (item) {
      const w = item;
      wpop.append(el("b", "qm-w-ar", forFont(w)));
      const sl = await siracLines(s, a), sx = siracFor(sl, w), iq = await qutaybahFor(s, a, w);
      if (sx) wpop.append(noteEl(sx, w));
      if (iq) { const n = el("p", "qm-w-sirac qm-w-iq"); n.append(el("small", "", "İbn Qutaybah"), el("span", "", iq)); wpop.append(n); }
      if (!sx && !iq) wpop.append(el("p", "qm-w-none", sl && iq === undefined ? T("Bu söz üçün Sirac izahı yoxdur") : T("Bu söz üçün izah yoxdur")));
      wpop.append(el("small", "qm-wp-ref", NAMES[s - 1] + " " + s + ":" + a + " · " + pos));
    } else { elw.classList.remove("wsel"); return; }
    wpop.hidden = false;
    const r = elw.getBoundingClientRect(), pw = wpop.offsetWidth, ph = wpop.offsetHeight;
    const x = Math.max(8, Math.min(innerWidth - pw - 8, r.left + r.width / 2 - pw / 2));
    const y = r.top - ph - 10 >= 8 ? r.top - ph - 10 : Math.min(innerHeight - ph - 8, r.bottom + 10);
    wpop.style.left = x + "px"; wpop.style.top = y + "px";
    wpop.style.setProperty("--ax", r.left + r.width / 2 - x + "px");
    wpop.classList.toggle("below", y > r.top);
  }

  /* ---------- compare sources on one ayah (swipe columns) ---------- */
  const cmpEl = el("div", "qm-cmp"); cmpEl.hidden = true; document.body.appendChild(cmpEl);
  let cmpCur = null;
  async function downloaded() { const out = []; for (const r of LIST) if ((await status(r.id)) >= 114) out.push(r); return out; }
  // the user's sources in the user's order; default: every downloaded source in Settings order
  const cmpSources = (have) => { const p = prefs(); if (!Array.isArray(p.cmp)) return have; const by = new Map(have.map((r) => [r.id, r])); return p.cmp.map((id) => by.get(id)).filter(Boolean); };
  const srcLabel = (r) => (r.k === "tr" ? r.by + " · " + r.name : r.k === "wb" ? T("Söz mənaları") + " · " + wbShort(r) : r.name);
  const wbShort = (r) => (r.id === "seraj" ? "Sirac" : r.id === "ibnqutaybah" ? "İbn Qutaybah" : r.name);
  async function openCompare(s, a) {
    if (!LIST.length) LIST = await (await fetch("./lib-list.json")).json();
    cmpCur = { s, a }; quranFont();
    const have = await downloaded(); const list = cmpSources(have); const p = prefs();
    const ar = await ayahText(s, a);
    const es = await Promise.all(list.map((r) => entry(r.id, s, a)));
    const fns = await Promise.all(list.map(async (r) => (r.k === "tr" ? ((await get(r.id + ":f:" + s)) || [])[a - 1] : "")));
    if (!cmpCur || cmpCur.s !== s || cmpCur.a !== a) return;
    window.QM_GOTO ? window.QM_GOTO(s + ":" + a) : window.QM_HL && window.QM_HL(s + ":" + a);
    cmpEl.replaceChildren(); cmpEl.dir = uiLang() === "ar" ? "rtl" : "ltr";
    const head = el("div", "qm-cmp-h");
    const x = icon("close", T("Bağla")); x.onclick = () => { cmpEl.hidden = true; cmpCur = null; };
    const ttl = el("div", "qm-full-t"); ttl.append(el("small", "", T("Müqayisə")), el("b", "", NAMES[s - 1] + " · " + a));
    const max = AYAHS[s - 1];
    const pv = el("button", "qm-step", "‹"), nx = el("button", "qm-step", "›");
    pv.setAttribute("aria-label", T("Əvvəlki")); nx.setAttribute("aria-label", T("Növbəti"));
    pv.disabled = s === 1 && a === 1; nx.disabled = s === 114 && a === max;
    pv.onclick = () => (a > 1 ? openCompare(s, a - 1) : openCompare(s - 1, AYAHS[s - 2]));
    nx.onclick = () => (a < max ? openCompare(s, a + 1) : openCompare(s + 1, 1));
    const ed = el("button", "qm-cmp-ed", "✎ " + T("Mənbələr")); ed.onclick = () => pickSources(have, s, a);
    head.append(x, ttl, pv, nx, ed); cmpEl.append(head);
    const ay = el("div", "qm-cmp-ar", forFont(ar) + " " + AR_DIG(a)); ay.dir = "rtl"; ay.lang = "ar"; ay.style.fontSize = 1.3 * p.fs + "rem"; cmpEl.append(ay);
    if (!list.length) {
      const box = el("div", "qm-empty"); box.append(el("p", "", T("Hələ endirilməyib.")));
      const b = el("button", "qm-rb main", T("Ayarlarda endir")); b.onclick = () => { cmpEl.hidden = true; openSettings(); }; box.append(b);
      if (have.length) { const c = el("button", "qm-rb", "✎ " + T("Mənbələri seç")); c.onclick = () => pickSources(have, s, a); box.append(c); }
      cmpEl.append(box); cmpEl.hidden = false; return;
    }
    const tabs = el("div", "qm-cmp-tabs"), rail = el("div", "qm-cmp-rail"), dots = el("div", "qm-cmp-dots");
    const cards = list.map((r, i) => {
      const t = el("button", "qm-cmp-tab", r.k === "wb" ? wbShort(r) : r.k === "tr" ? r.by : r.name); t.dir = "auto"; t.onclick = () => go(i, true); tabs.append(t);
      dots.append(el("i"));
      const c = el("article", "qm-cmp-card"); c.dataset.id = r.id;
      const h = el("h4", ""); const nm = el("span", "", srcLabel(r)); nm.dir = "auto"; h.append(nm, el("small", "", i + 1 + "/" + list.length)); c.append(h);
      const body = el("div", "qm-cmp-tx"); body.dir = r.dir; body.lang = r.lang; body.style.fontSize = p.fs * (r.lang === "ar" ? 1.12 : 1) + "rem";
      const e = es[i];
      if (r.k === "wb") renderWb(body, e ? e.text : "", r.id);
      else {
        if (e && e.from !== e.to) body.append(el("small", "qm-range", s + ":" + e.from + "–" + e.to));
        for (const para of (e && e.text ? plain(e.text) : "—").split(/\n{2,}/)) body.append(el("p", "", para));
        if (fns[i]) body.append(el("p", "qm-fn", plain(fns[i])));
      }
      c.append(body); rail.append(c); return c;
    });
    cmpEl.append(tabs, rail);
    if (list.length < 2) { const h = el("button", "qm-cmp-hint", T("Müqayisə üçün Ayarlardan daha bir mənbə endirin") + " ›"); h.onclick = () => { cmpEl.hidden = true; openSettings(); }; cmpEl.append(h); }
    cmpEl.append(dots);
    let at = -1;
    const mark = (i) => { if (i === at) return; at = i; [...tabs.children].forEach((t, j) => t.classList.toggle("on", j === i)); [...dots.children].forEach((d, j) => d.classList.toggle("on", j === i)); tabs.children[i] && tabs.children[i].scrollIntoView({ block: "nearest", inline: "nearest" }); setPrefs({ cmpCur: list[i].id }); };
    const go = (i, smooth) => { const c = cards[i]; if (!c) return; rail.scrollTo({ left: c.offsetLeft - cards[0].offsetLeft, behavior: smooth ? "smooth" : "auto" }); mark(i); };
    rail.onscroll = () => { let best = 0, bd = Infinity; cards.forEach((c, j) => { const d = Math.abs(c.offsetLeft - cards[0].offsetLeft - rail.scrollLeft); if (d < bd) { bd = d; best = j; } }); mark(best); };
    cmpEl.hidden = false;
    const keep = Math.max(0, list.findIndex((r) => r.id === p.cmpCur));
    requestAnimationFrame(() => go(keep, false));
  }
  function pickSources(have, s, a) {
    const cur = cmpSources(have).map((r) => r.id);
    const order = [...cur, ...have.map((r) => r.id).filter((id) => !cur.includes(id))];
    const on = new Set(cur);
    menu.replaceChildren(); menu.hidden = false;
    const box = el("div", "qm-menu-box qm-pick-src"); box.dir = uiLang() === "ar" ? "rtl" : "ltr";
    box.append(el("h3", "", T("Mənbələri seç")));
    const ul = el("ul", "qm-src-list"); box.append(ul);
    const draw = () => {
      ul.replaceChildren();
      order.forEach((id, i) => {
        const r = have.find((x) => x.id === id); const li = el("li", on.has(id) ? "on" : "");
        const ck = el("button", "qm-ck", on.has(id) ? "✓" : ""); ck.setAttribute("aria-label", srcLabel(r));
        const nm = el("span", "", srcLabel(r)); nm.dir = "auto";
        const up = el("button", "qm-mv", "↑"), dn = el("button", "qm-mv", "↓"); up.disabled = i === 0; dn.disabled = i === order.length - 1;
        const tog = () => { on.has(id) ? on.delete(id) : on.add(id); draw(); };
        ck.onclick = tog; nm.onclick = tog;
        up.onclick = () => { [order[i - 1], order[i]] = [order[i], order[i - 1]]; draw(); };
        dn.onclick = () => { [order[i + 1], order[i]] = [order[i], order[i + 1]]; draw(); };
        li.append(ck, nm, up, dn); ul.append(li);
      });
    };
    draw();
    const row = el("div", "qm-prev-row");
    const no = el("button", "qm-rb", T("Ləğv")); no.onclick = () => { menu.hidden = true; };
    const ok = el("button", "qm-rb main", T("Hazır")); ok.onclick = () => { setPrefs({ cmp: order.filter((id) => on.has(id)) }); menu.hidden = true; openCompare(s, a); };
    row.append(no, ok); box.append(row); menu.append(box);
    menu.onclick = (ev) => { if (ev.target === menu) menu.hidden = true; };
  }
  window.QM = { openSettings, openFull, openAyah, openCompare, wordPop, closeWordPop: closeWpop, selecting: () => !!sel, tapAyah, t: T };
  (async () => {
    try { if (!LIST.length) LIST = await (await fetch("./lib-list.json")).json(); } catch (e) {}
    refreshUi();
  })();
})();
