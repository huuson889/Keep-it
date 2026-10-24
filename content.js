(() => {
  if (window.__localHighlightNotesLoaded) return;
  window.__localHighlightNotesLoaded = true;
  const CONFIG = globalThis.LHN_CONFIG;
  CONFIG.applyHighlightColors();
  const COLORS = CONFIG.COLORS;
  const COLOR_MAP = CONFIG.HIGHLIGHT_COLORS;
  const noteTranslator = globalThis.LHN_STUDY_TRANSLATION?.create({ browser });
  const STUDY_TRANSLATION_SETTINGS_KEY = "lhnStudyTranslationSettings";
  let translationSourceLanguage = "auto";
  let panel = null, activeRange = null, selectedRange = null, selectedColor = CONFIG.DEFAULT_COLOR, activeAnnotationId = null;
  let settings = { ...CONFIG.DEFAULT_SETTINGS, language: (globalThis.LHN_LANGUAGES?.detectLanguage() || "en") };
  const t = (key, vars = {}) => globalThis.LHN_LANGUAGES.t(key, vars, globalThis.LHN_LANGUAGES.languageFor(settings));
  const getSpeechRate = spokenLanguage => {
    const displayLanguage = globalThis.LHN_LANGUAGES?.languageFor(settings) || "en";
    const speechLanguage = String(spokenLanguage || "").trim().replace(/_/g, "-").split("-")[0].toLowerCase();
    const customRate = settings.useLanguageSpeechRate === true && speechLanguage === displayLanguage
      ? settings.hasCustomSpeechRateByLanguage?.[displayLanguage] === true ? settings.speechRateByLanguage?.[displayLanguage] : settings.inheritedSpeechRateByLanguage?.[displayLanguage]
      : undefined;
    const rate = Number(customRate ?? settings.speechRate);
    return Number.isFinite(rate) ? Math.min(2, Math.max(.5, rate)) : 1;
  };
  let hoverTimer = null, tooltip = null, hoveredMark = null, dismissTimer = null, tooltipActionRow = null, actionPopup = null;
  let translateIcon = null, translationPopup = null, translationRequestId = 0, dictionaryPopup = null, dictionaryRequestId = 0;
  let currentSpeakAudio = null, currentSpeakObjectUrl = null, currentSpeakFinish = null, speakRequestId = 0, speechPauseActive = false, shortcutPausedMedia = [];
  let outsideMouseDown = null, suppressMouseUp = false, composerSave = null, colorChosen = false, composerOriginalColor = null, tooltipColorUndo = null;
  let sidebar = null, sidebarOpen = false, pageLayoutSnapshot = null, sidebarFilter = "all", sidebarSearchQuery = "", sidebarItemsCache = null, pageAnnotationCache = new Map(), pageAnnotationCacheUrl = "", sidebarEdgeToggle = null, sidebarHeaderActions = null, sidebarToastTimer = 0, sidebarToastRender = null, sidebarRenderToken = 0, sidebarSearchTimer = 0;
  const sidebarSearchMetadata = new WeakMap();
  let websiteDisabled = false, websiteSettingsReady = false;
  const pageUrl = () => location.href;
  const displayWebsiteName = host => { const value = String(host || ""); return value ? value[0].toLocaleUpperCase() + value.slice(1) : value; };
  const pageTitle = () => document.title || displayWebsiteName(location.hostname);
  const websiteKey = () => location.hostname.toLowerCase().replace(/^www\./, "").replace(/\.$/, "");
  const isWebsiteDisabledIn = value => Array.isArray(value?.disabledWebsites) && value.disabledWebsites.includes(websiteKey());
  const pageThumbnailUrl = () => {
    const meta = document.querySelector('meta[property="og:image"], meta[name="twitter:image"], meta[property="twitter:image"], meta[itemprop="image"]');
    const raw = meta?.content?.trim();
    if (!raw) return "";
    try { const resolved = new URL(raw, location.href); return /^https?:$/.test(resolved.protocol) ? resolved.href : ""; } catch { return ""; }
  };
  const cleanText = s => (s || "").replace(/\s+/g, " ").trim();
  const MAP = {
    'o͝o': 'ʊ', 'o͞o': 'u', 'T͟H': 'ð', 'âr': 'ɛr', 'ûr': 'ɜr', 'îr': 'ɪr',
    'oi': 'ɔɪ', 'ou': 'aʊ', 'NG': 'ŋ', 'TH': 'θ', 'CH': 'tʃ', 'SH': 'ʃ', 'ZH': 'ʒ',
    'ā': 'eɪ', 'ē': 'i', 'ī': 'aɪ', 'ō': 'oʊ', 'ô': 'ɔ', 'ä': 'ɑ',
    'a': 'æ', 'e': 'ɛ', 'i': 'ɪ', 'o': 'ɑ', 'u': 'ʌ', 'j': 'dʒ', 'y': 'j'
  };
  const IPA_ESC = k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const IPA_RE = new RegExp(Object.keys(MAP).sort((a, b) => b.length - a.length).map(IPA_ESC).join('|'), 'g');
  // Đổi ký âm Google (NOAD) sang IPA, một lượt regex, ưu tiên chuỗi dài trước. Dùng lại được ở nơi khác.
  function convertGoogleToIPA(raw) {
    return '/' + String(raw || '').normalize('NFC').replace(IPA_RE, m => MAP[m]) + '/';
  }
  globalThis.LHN_IPA_UTILS = Object.freeze({ convertGoogleToIPA });
  const clearTimer = name => { if (name === "hover" && hoverTimer) clearTimeout(hoverTimer); if (name === "dismiss" && dismissTimer) clearTimeout(dismissTimer); };

  function animateRemove(el) {
    if (!el) return;
    el.classList.add("lhn-closing");
    setTimeout(() => el.remove(), CONFIG.TIMINGS.REMOVE_ANIMATION_MS);
  }
  async function loadSettings() {
    try {
      const data = await browser.storage.local.get([CONFIG.STORAGE_KEYS.SETTINGS, STUDY_TRANSLATION_SETTINGS_KEY]);
      settings = { ...settings, ...(data[CONFIG.STORAGE_KEYS.SETTINGS] || {}) };
      const sourceLanguage = data[STUDY_TRANSLATION_SETTINGS_KEY]?.sourceLanguage;
      translationSourceLanguage = ["auto", "en", "vi", "ko"].includes(sourceLanguage) ? sourceLanguage : "auto";
    }
    catch { /* use defaults */ }
    websiteDisabled = isWebsiteDisabledIn(settings);
    websiteSettingsReady = true;
    document.dispatchEvent(new CustomEvent("lhn-website-disabled-change", { detail:websiteDisabled }));
    syncSidebarTheme();
    if (sidebarEdgeToggle) syncSidebarEdgeToggle();
    return settings;
  }
  async function setDefaultHighlightColor(color) {
    const normalizedColor = CONFIG.normalizeColor(color);
    const previousSettings = settings;
    const updatedSettings = { ...settings, defaultHighlightColor: normalizedColor };
    settings = updatedSettings;
    updateDefaultColorIndicators();
    try {
      await browser.storage.local.set({ [CONFIG.STORAGE_KEYS.SETTINGS]: updatedSettings });
      showSidebarToast(() => t("defaultColorSetToast", { color: t(CONFIG.colorLabelKey(normalizedColor)) }));
    } catch (error) { settings = previousSettings; updateDefaultColorIndicators(); console.warn("Could not save default highlight color", error); }
  }
  function updateDefaultColorIndicators() {
    document.querySelectorAll(".lhn-color-option").forEach(option => {
      option.classList.toggle("is-default", option.dataset.color === CONFIG.normalizeColor(settings.defaultHighlightColor));
    });
  }
  function shortcutForEvent(e) {
    const parts = [];
    if (e.ctrlKey) parts.push("Ctrl");
    if (e.altKey) parts.push("Alt");
    if (e.shiftKey) parts.push("Shift");
    if (e.metaKey) parts.push("Meta");
    const key = e.code === "Space" ? "Space" : e.key === "ArrowLeft" ? "Left" : e.key === "ArrowRight" ? "Right" : e.key === "ArrowUp" ? "Up" : e.key === "ArrowDown" ? "Down" : e.key.length === 1 ? e.key.toUpperCase() : e.key;
    if (!["Control", "Alt", "Shift", "Meta"].includes(e.key)) parts.push(key);
    return parts.join("+");
  }
  browser.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes[STUDY_TRANSLATION_SETTINGS_KEY]) {
      const sourceLanguage = changes[STUDY_TRANSLATION_SETTINGS_KEY].newValue?.sourceLanguage;
      translationSourceLanguage = ["auto", "en", "vi", "ko"].includes(sourceLanguage) ? sourceLanguage : "auto";
    }
    if (area === "local" && changes[CONFIG.STORAGE_KEYS.SETTINGS]) {
      const previousLanguage = globalThis.LHN_LANGUAGES.languageFor(settings);
      settings = { ...CONFIG.DEFAULT_SETTINGS, language: (globalThis.LHN_LANGUAGES?.detectLanguage() || "en"), ...(changes[CONFIG.STORAGE_KEYS.SETTINGS].newValue || {}) };
      updateDefaultColorIndicators();
      const nextDisabled = isWebsiteDisabledIn(settings);
      const websiteStateChanged = nextDisabled !== websiteDisabled;
      if (websiteStateChanged) applyWebsiteDisabledState(nextDisabled);
      syncSidebarTheme();
      if (sidebarEdgeToggle) syncSidebarEdgeToggle();
      if (settings.translationPopupEnabled === false && translationPopup) { translationRequestId++; translationPopup.remove(); translationPopup = null; }
      if (settings.translationPopupEnabled === false && dictionaryPopup && !dictionaryPopup._lhnHideForNote) { dictionaryRequestId++; dictionaryPopup.remove(); dictionaryPopup = null; }
      if (settings.showFullEnglishDictionary === false && dictionaryPopup) { dictionaryRequestId++; dictionaryPopup.remove(); dictionaryPopup = null; }
      syncTranslateIconAvailability();
      if (previousLanguage !== globalThis.LHN_LANGUAGES.languageFor(settings)) refreshLocalizedUI(!websiteStateChanged);
    }
    if (area === "local" && changes[CONFIG.STORAGE_KEYS.SETTINGS] && sidebarOpen) {
      syncSidebarSettingsButtons();
      syncSidebarFooter();
    }
    if (area === "local" && changes[CONFIG.STORAGE_KEYS.ANNOTATIONS] && sidebarOpen) renderSidebar();
  });
  const sidebarThemeObserver = new MutationObserver(() => syncSidebarTheme());
  sidebarThemeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme", "data-color-scheme"] });
  window.matchMedia?.("(prefers-color-scheme: dark)").addEventListener?.("change", () => {
    if (settings.sidebarTheme !== "dark" && settings.sidebarTheme !== "light") syncSidebarTheme();
  });
  function removeComposer() {
    if (colorChosen && activeAnnotationId && composerOriginalColor) webHighlighter.setMarkColor(activeAnnotationId, composerOriginalColor);
    if (dictionaryPopup?._lhnHideForNote) { dictionaryRequestId++; dictionaryPopup = null; }
    composerSave = null; colorChosen = false; composerOriginalColor = null;
    if (panel) { const old = panel; panel = null; animateRemove(old); }
    webHighlighter.clearPreview(); activeRange = null; activeAnnotationId = null;
  }
  function removeTooltip(cancelColorPreview = false) {
    clearTimer("dismiss");
    if (tooltipColorUndo) {
      const pending = tooltipColorUndo; tooltipColorUndo = null;
      if (cancelColorPreview) {
        pending.item.color = pending.color;
        webHighlighter.setMarkColor(pending.id, pending.color);
        LHN_MESSAGING.sendMessage({ type: "UPDATE", item: { ...pending.item, color: pending.color } }).then(updated => {
          if (updated?.id) pageAnnotationCache.set(updated.id, updated);
        }).catch(error => console.error("Highlight Notes color cancel failed", error));
      }
    }
    if (tooltip) { const old = tooltip; tooltip = null; hoveredMark = null; animateRemove(old); }
    if (actionPopup) { actionPopup.remove(); actionPopup = null; }
    tooltipActionRow = null;
  }
  function position(el, x, y) {
    const margin = 10;
    const left = Math.max(margin, Math.min(x, innerWidth - el.offsetWidth - margin));
    const top = Math.max(margin, Math.min(y, innerHeight - el.offsetHeight - margin));
    el.style.left = left + "px"; el.style.top = top + "px";
  }
  function positionPopupAtAnchor(popup, anchor) {
    const anchorNode = anchor?.startContainer || anchor;
    if (!popup?.isConnected || !anchorNode?.isConnected || !anchor?.getBoundingClientRect) return;
    const rect = anchor.getBoundingClientRect();
    popup.classList.toggle("lhn-popup-anchor-wide", rect.width > 400);
    popup.style.setProperty("--lhn-popup-anchor-width", `${Math.max(1, rect.width)}px`, "important");
    position(popup, rect.left + rect.width / 2 - popup.offsetWidth / 2, rect.bottom + 8);
    popup.style.setProperty("left", popup.style.left, "important");
    popup.style.setProperty("top", popup.style.top, "important");
  }
  function positionTranslateIcon(range = selectedRange) {
    if (!translateIcon?.isConnected || !range?.startContainer?.isConnected) return;
    const rect = range.getBoundingClientRect();
    if (!rect.width && !rect.height) return;
    position(translateIcon, rect.right, rect.bottom);
    translateIcon.style.setProperty("left", translateIcon.style.left, "important");
    translateIcon.style.setProperty("top", translateIcon.style.top, "important");
  }
  function removeTranslationUI() {
    translationRequestId++;
    translateIcon?.remove(); translateIcon = null;
    translationPopup?.remove(); translationPopup = null;
    dictionaryRequestId++; dictionaryPopup?.remove(); dictionaryPopup = null;
  }
  const isEnglishDictionaryWord = text => /^[A-Za-z]+(?:['’][A-Za-z]+)?$/.test(cleanText(text));
  const dictionaryCachePrefix = "lhnFullDictionary:v2:", dictionaryTranslationCachePrefix = "lhnFullDictionaryTranslation:v1:", DICTIONARY_CACHE_TTL = 7 * 24 * 60 * 60 * 1000;
  const dictionaryTranslationRequests = new Map(), dictionaryTranslationRequestsBySignal = new WeakMap();
  async function getDictionaryCache(key, legacyKey) {
    try {
      const entry = (await browser.storage.local.get(key))[key];
      if (entry && Date.now() - entry.timestamp < DICTIONARY_CACHE_TTL) return entry.data;
      if (entry) await browser.storage.local.remove(key);
    } catch (error) { console.warn("Could not read full dictionary cache", error); }
    // Migrate a still-valid entry from the previous website-scoped cache.
    try {
      const oldKey = `__lhn_full_english_dictionary_v1__${legacyKey}`;
      const oldEntry = JSON.parse(localStorage.getItem(oldKey) || "null");
      if (oldEntry && Date.now() - oldEntry.timestamp < DICTIONARY_CACHE_TTL) {
        await browser.storage.local.set({ [key]:oldEntry });
        localStorage.removeItem(oldKey);
        return oldEntry.data;
      }
      if (oldEntry) localStorage.removeItem(oldKey);
    } catch {}
    return null;
  }
  async function setDictionaryCache(key, data) {
    try { await browser.storage.local.set({ [key]:{ timestamp:Date.now(), data } }); }
    catch (error) { console.warn("Could not save full dictionary cache", error); }
  }
  function dictionaryTranslationCacheKey(text, targetLanguage) {
    return `${dictionaryTranslationCachePrefix}${targetLanguage}:${cleanText(text).toLocaleLowerCase()}`;
  }
  function dictionaryPopupAt(popup, range) {
    positionPopupAtAnchor(popup, range);
  }
  function makeDictionaryPopup(range) {
    dictionaryPopup?.remove();
    const popup = document.createElement("div"); popup.id = "lhn-full-english-dictionary";
    popup.classList.toggle("lhn-dict-dark", isDictionaryDark());
    popup.setAttribute("role", "dialog"); popup.setAttribute("aria-label", t("showFullEnglishDictionary"));
    popup.innerHTML = '<div class="lhn-dict-loading"><span></span><span></span><span></span></div>';
    popup.addEventListener("mousedown", event => event.stopPropagation()); popup.addEventListener("click", event => event.stopPropagation());
    popup.addEventListener("click", event => {
      const action = event.target.closest("[data-dict-action]"); if (!action) return;
      const word = action.dataset.word || "";
      if (action.dataset.dictAction === "speak") speakHighlightedText(word, "en-US", null, null, true);
      else if (action.dataset.dictAction === "back") {
        const previous = popup._lhnHistory?.pop();
        if (previous) lookupEnglishDictionary(previous, popup._lhnAnchorRange, popup, { recordHistory:false, autoSpeak:true });
      } else if (word && action.classList.contains("lhn-dict-colloc")) {
        const anchorRange = popup._lhnAnchorRange;
        dictionaryRequestId++; popup.remove(); if (dictionaryPopup === popup) dictionaryPopup = null;
        translateSelectedRange(anchorRange, { forcePopup:true, textOverride:word, sourceLanguage:"en" });
      } else if (word) lookupEnglishDictionary(word, popup._lhnAnchorRange, popup, { autoSpeak:true });
    });
    document.documentElement.appendChild(popup); dictionaryPopup = popup;
    dictionaryPopupAt(popup, range);
    requestAnimationFrame(() => popup.isConnected && popup.classList.add("lhn-dict-visible"));
    return popup;
  }
  async function dictionaryTranslate(text, targetLanguage, signal) {
    const cacheKey = dictionaryTranslationCacheKey(text, targetLanguage);
    let requests = dictionaryTranslationRequests;
    if (signal && typeof signal === "object") {
      requests = dictionaryTranslationRequestsBySignal.get(signal);
      if (!requests) { requests = new Map(); dictionaryTranslationRequestsBySignal.set(signal, requests); }
    }
    const pending = requests.get(cacheKey);
    if (pending) return pending;
    const request = (async () => {
      try {
        const cached = (await browser.storage.local.get(cacheKey))[cacheKey];
        if (cached && Date.now() - cached.timestamp < DICTIONARY_CACHE_TTL && cached.data?.translatedText) return cached.data;
        if (cached) await browser.storage.local.remove(cacheKey);
      } catch (error) { console.warn("Could not read related-word translation cache", error); }
      let result;
      try {
        const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${encodeURIComponent(targetLanguage)}&dt=t&dt=bd&q=${encodeURIComponent(text)}`, { signal });
        if (!response.ok) throw new Error("Google Translate unavailable");
        const data = await response.json();
        result = { translatedText:(data[0] || []).map(part => String(part[0] || "").normalize("NFC")).join("").normalize("NFC"), posDict:(data[1] || []).map(item => ({ pos:String(item[0] || "").normalize("NFC"), words:(item[1] || []).map(word => String(word).normalize("NFC")) })), engine:"Google Translate" };
      } catch (error) {
        if (signal?.aborted) throw error;
        const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${encodeURIComponent(targetLanguage)}`, { signal });
        if (!response.ok) throw new Error("Dictionary translation unavailable");
        const data = await response.json();
        if (data.responseStatus !== 200) throw new Error("Dictionary translation unavailable");
        result = { translatedText:String(data.responseData?.translatedText || text).normalize("NFC"), posDict:[], engine:"MyMemory" };
      }
      try { await browser.storage.local.set({ [cacheKey]:{ timestamp:Date.now(), data:result } }); }
      catch (error) { console.warn("Could not save related-word translation cache", error); }
      return result;
    })();
    requests.set(cacheKey, request);
    try { return await request; }
    finally { if (requests.get(cacheKey) === request) requests.delete(cacheKey); }
  }
  const IPA_TIMEOUT_MS = 3000;
  async function fetchIpaSource(url, signal, read) {
    const controller = new AbortController();
    const onAbort = () => controller.abort();
    if (signal?.aborted) return null;
    signal?.addEventListener("abort", onAbort, { once:true });
    const timer = setTimeout(onAbort, IPA_TIMEOUT_MS);
    try {
      const response = await fetch(url, { signal:controller.signal });
      if (!response.ok) return null;
      return await read(await response.json());
    } catch { return null; }
    finally { clearTimeout(timer); signal?.removeEventListener("abort", onAbort); }
  }
  // IPA độc lập: 2 nguồn chạy song song, mỗi nguồn timeout 3s. Ưu tiên nguồn 1; nếu không có thì nguồn 2 (approx:true).
  async function fetchIpa(word, lang = "en", signal) {
    const query = encodeURIComponent(String(word || "").toLowerCase());
    const strip = value => String(value || "").trim().replace(/^\/+|\/+$/g, "").trim();
    const dictSource = fetchIpaSource(`https://api.dictionaryapi.dev/api/v2/entries/${encodeURIComponent(lang)}/${query}`, signal, data => {
      for (const entry of Array.isArray(data) ? data : []) for (const item of entry.phonetics || []) { const text = strip(item.text); if (text) return text; }
      for (const entry of Array.isArray(data) ? data : []) { const text = strip(entry.phonetic); if (text) return text; }
      return null;
    });
    const googleSource = fetchIpaSource(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(lang)}&tl=${lang === "en" ? "vi" : "en"}&dt=t&dt=rm&q=${query}`, signal, data => {
      const parts = data?.[0] || [];
      let raw = "";
      for (let i = parts.length - 1; i >= 0; i--) if (typeof parts[i]?.[3] === "string") { raw = parts[i][3]; break; }
      return raw ? strip(globalThis.LHN_IPA_UTILS.convertGoogleToIPA(raw)) : null;
    });
    const primary = await dictSource;
    if (primary) return { text:primary, approx:false };
    const secondary = await googleSource;
    return secondary ? { text:secondary, approx:true } : null;
  }
  async function dictionaryRelatedWords(word, targetLanguage, signal) {
    const escaped = encodeURIComponent(word.toLowerCase());
    const [synonyms, antonyms] = await Promise.all([
      fetch(`https://api.datamuse.com/words?rel_syn=${escaped}&max=3`, { signal }).then(response => response.ok ? response.json() : []),
      fetch(`https://api.datamuse.com/words?rel_ant=${escaped}&max=3`, { signal }).then(response => response.ok ? response.json() : [])
    ]);
    const all = [...synonyms.map(item => ({ ...item, kind:"Syn" })), ...antonyms.map(item => ({ ...item, kind:"Ant" }))];
    const translated = await Promise.all(all.map(async item => {
      try { return { ...item, meaning:(await dictionaryTranslate(item.word, targetLanguage, signal)).translatedText }; }
      catch { return { ...item, meaning:item.word }; }
    }));
    return translated;
  }
  async function dictionaryWordForms(word, targetLanguage, signal) {
    let root = word.toLowerCase();
    if (root.endsWith("ments")) root = root.slice(0, -5); else if (root.endsWith("ment")) root = root.slice(0, -4);
    else if (["ers", "ing", "ies"].some(suffix => root.endsWith(suffix))) root = root.slice(0, -3);
    else if (["ed", "er", "ly"].some(suffix => root.endsWith(suffix))) root = root.slice(0, -2); else if (root.endsWith("s")) root = root.slice(0, -1);
    try {
      const response = await fetch(`https://api.datamuse.com/words?sp=${encodeURIComponent(root)}*&md=p&max=15`, { signal });
      if (!response.ok) return [];
      const items = await response.json(), seen = new Set([word.toLowerCase()]), results = [];
      for (const item of items) {
        const form = String(item.word || "").toLowerCase(); if (!form || form.includes(" ") || form.length > root.length + 8 || seen.has(form)) continue;
        seen.add(form); const tag = item.tags?.includes("v") ? "(V)" : item.tags?.includes("adv") ? "(Adv)" : item.tags?.includes("adj") ? "(Adj)" : "(N)";
        results.push({ word:form, tag }); if (results.length >= 4) break;
      }
      return Promise.all(results.map(async item => { try { return { ...item, meaning:(await dictionaryTranslate(item.word, targetLanguage, signal)).translatedText }; } catch { return { ...item, meaning:item.word }; } }));
    } catch { return []; }
  }
  async function dictionaryCollocations(word, targetLanguage, signal) {
    try {
      const escaped = encodeURIComponent(word.toLowerCase());
      const [before, after] = await Promise.all([
        fetch(`https://api.datamuse.com/words?rel_jja=${escaped}&max=2`, { signal }).then(response => response.ok ? response.json() : []),
        fetch(`https://api.datamuse.com/words?rel_jjb=${escaped}&max=2`, { signal }).then(response => response.ok ? response.json() : [])
      ]);
      const phrases = [...before.map(item => `${item.word} ${word}`), ...after.map(item => `${word} ${item.word}`)].slice(0, 3);
      return Promise.all(phrases.map(async phrase => { try { return { word:phrase, meaning:(await dictionaryTranslate(phrase, targetLanguage, signal)).translatedText }; } catch { return { word:phrase, meaning:phrase }; } }));
    } catch { return []; }
  }
  function renderEnglishDictionary(popup, data, fromCache) {
    const hiddenForOpenNote = popup?._lhnHideForNote && popup === dictionaryPopup && panel?.dataset.lhnDictionaryWord === popup.dataset.word;
    if (!popup || (!popup.isConnected && !hiddenForOpenNote)) return;
    const posNames = { noun:"noun", n:"noun", verb:"verb", v:"verb", adjective:"adjective", adj:"adjective", adverb:"adverb", adv:"adverb", };
    const esc = value => String(value ?? "").normalize("NFC").replace(/[&<>"']/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[char]));
    const relatedByKind = kind => (data.related || []).filter(item => item.kind === kind).map(item => `<button class="lhn-dict-chip lhn-dict-${kind.toLowerCase()}" data-dict-action="lookup" data-word="${esc(item.word)}"><b>${esc(item.word)}</b><span>(${esc(item.meaning || item.word)})</span></button>`).join("");
    const related = ["Syn", "Ant"].map(kind => relatedByKind(kind) ? `<section class="lhn-dict-related lhn-dict-${kind.toLowerCase()}" data-kind="${kind}" data-label="${kind}:">${relatedByKind(kind)}</section>` : "").join("");
    const forms = (data.forms || []).length ? `<section class="lhn-dict-related lhn-dict-forms" data-kind="Forms" data-label="Forms:">${data.forms.map(item => `<button class="lhn-dict-chip lhn-dict-form" data-dict-action="lookup" data-word="${esc(item.word)}"><b>${esc(item.word)}</b><span>${esc(item.tag)}</span><span>(${esc(item.meaning || item.word)})</span></button>`).join("")}</section>` : "";
    const collocations = (data.collocations || []).length ? `<section class="lhn-dict-related lhn-dict-collocations" data-kind="Colloc" data-label="Colloc:">${data.collocations.map(item => `<button class="lhn-dict-chip lhn-dict-colloc" data-dict-action="lookup" data-word="${esc(item.word)}"><b>${esc(item.word)}</b><span>(${esc(item.meaning || item.word)})</span></button>`).join("")}</section>` : "";
    const pos = (data.translation.posDict || []).map(item => `<div class="lhn-dict-pos"><span>${esc(posNames[item.pos.toLowerCase()] || item.pos)}</span><b>${esc((item.words || []).join(", "))}</b></div>`).join("");
    const ipaText = String(data.ipa || "").replace(/^\/+|\/+$/g, "");
    const ipa = ipaText && ipaText.toLowerCase() !== String(data.word || "").toLowerCase() ? ipaText : "";
    popup.innerHTML = `<div class="lhn-dict-body"><header><div><strong>${esc(data.word)}</strong>${ipa ? `<span class="lhn-dict-ipa"${data.ipaApprox ? ' data-approx="true"' : ""}>/${esc(ipa)}/</span>` : ""}<span class="lhn-dict-engine">${fromCache ? "⚡ Cached" : esc(data.translation.engine)}</span></div><button class="lhn-dict-back" data-dict-action="back" aria-label="Back" title="Back" ${popup._lhnHistory?.length ? "" : "hidden"}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 14-5-5 5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11"/></svg></button><button class="lhn-dict-speak" data-dict-action="speak" data-word="${esc(data.word)}" aria-label="${esc(t("readTranslation"))}" title="${esc(t("readTranslation"))}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/></svg></button></header><div class="lhn-dict-translation">${esc(data.translation.translatedText || "")}</div>${pos ? `<section class="lhn-dict-pos-list">${pos}</section>` : ""}${related}${forms}${collocations}</div>`;
    fillNoteFromDictionary(popup);
    if (popup._lhnHideForNote) {
      popup.remove(); if (dictionaryPopup === popup) dictionaryPopup = null;
      return;
    }
    dictionaryPopupAt(popup, popup._lhnAnchorRange);
  }
  function fillNoteFromDictionary(popup = dictionaryPopup) {
    const popupWord = popup?.dataset.word?.toLowerCase();
    const selectedWord = panel?.dataset.lhnDictionaryWord;
    if (popupWord && selectedWord && popupWord !== selectedWord) return;
    const dictionaryTranslation = popup?.querySelector(".lhn-dict-translation")?.textContent?.trim().normalize("NFC") || popup?._lhnMainTranslation?.translatedText?.trim().normalize("NFC");
    const noteTextarea = panel && !panel._lhnNoteEdited ? panel.querySelector("textarea") : null;
    if (!noteTextarea || !dictionaryTranslation || noteTextarea.value.trim()) return;
    noteTextarea.value = dictionaryTranslation;
    noteTextarea.dispatchEvent(new Event("input", { bubbles:true }));
  }
  function hideDictionaryPopupForNote(popup = dictionaryPopup) {
    if (!popup || popup.dataset.word !== panel?.dataset.lhnDictionaryWord) return;
    popup._lhnHideForNote = true;
    popup._lhnRelatedController?.abort();
    fillNoteFromDictionary(popup);
    const hasTranslation = !!popup.querySelector(".lhn-dict-translation")?.textContent?.trim() || !!popup._lhnMainTranslation?.translatedText;
    popup.remove();
    if (hasTranslation && dictionaryPopup === popup) dictionaryPopup = null;
  }
  async function lookupEnglishDictionary(word, range, existingPopup = null, { recordHistory = true, autoSpeak = false } = {}) {
    word = cleanText(word); if (!settings.showFullEnglishDictionary || !isEnglishDictionaryWord(word)) return;
    if (autoSpeak && (settings.autoSpeakSelectedText === true || settings.autoSpeakOnTranslate === true)) speakHighlightedText(word, "en-US", null, null, true);
    const popup = existingPopup?.isConnected ? existingPopup : makeDictionaryPopup(range), requestId = ++dictionaryRequestId;
    popup._lhnMainController?.abort(); popup._lhnRelatedController?.abort();
    popup._lhnMainController = new AbortController(); popup._lhnRelatedController = new AbortController();
    if (!popup._lhnHistory) popup._lhnHistory = [];
    if (recordHistory && popup.dataset.word && popup.dataset.word !== word.toLowerCase()) popup._lhnHistory.push(popup.dataset.word);
    popup.dataset.word = word.toLowerCase();
    if (panel?.dataset.lhnDictionaryWord === popup.dataset.word) hideDictionaryPopupForNote(popup);
    popup._lhnAnchorRange = range;
    let targetLanguage = globalThis.LHN_LANGUAGES?.languageFor(settings) || "en";
    try { const data = await browser.storage.local.get([STUDY_TRANSLATION_SETTINGS_KEY, CONFIG.STORAGE_KEYS.SETTINGS]); targetLanguage = translationOptionsFrom(data).targetLanguage || targetLanguage; } catch {}
    if (requestId !== dictionaryRequestId) return;
    const cacheKey = `${dictionaryCachePrefix}${targetLanguage}:${word.toLowerCase()}`;
    const cached = await getDictionaryCache(cacheKey, `${word.toLowerCase()}_${targetLanguage}`);
    const hiddenForOpenNote = () => popup._lhnHideForNote && panel?.dataset.lhnDictionaryWord === word.toLowerCase();
    if (requestId !== dictionaryRequestId || (popup !== dictionaryPopup && !hiddenForOpenNote())) return;
    if (cached) {
      popup._lhnMainTranslation = cached.translation;
      if (cached.translation?.translatedText) browser.storage.local.set({ [dictionaryTranslationCacheKey(word, targetLanguage)]:{ timestamp:Date.now(), data:cached.translation } }).catch(() => {});
      if (hiddenForOpenNote()) { fillNoteFromDictionary(popup); popup.remove(); if (dictionaryPopup === popup) dictionaryPopup = null; }
      else renderEnglishDictionary(popup, cached, true);
      return;
    }
    try {
      const translationPromise = dictionaryTranslate(word, targetLanguage, popup._lhnMainController.signal);
      translationPromise.then(translation => { popup._lhnMainTranslation = translation; fillNoteFromDictionary(popup); }).catch(() => {});
      const noRelated = popup._lhnHideForNote || panel?.dataset.lhnDictionaryWord === word.toLowerCase();
      const relatedTasks = noRelated ? [Promise.resolve([]), Promise.resolve([]), Promise.resolve([])] : [
        dictionaryRelatedWords(word, targetLanguage, popup._lhnRelatedController.signal),
        dictionaryWordForms(word, targetLanguage, popup._lhnRelatedController.signal),
        dictionaryCollocations(word, targetLanguage, popup._lhnRelatedController.signal)
      ];
      const ipaPromise = noRelated ? Promise.resolve(null) : fetchIpa(word, "en", popup._lhnMainController.signal);
      const [translation, related, forms, collocations, ipaResult] = await Promise.allSettled([translationPromise, ...relatedTasks, ipaPromise]);
      if (requestId !== dictionaryRequestId || (popup !== dictionaryPopup && !hiddenForOpenNote())) return;
      let fallbackRelated = [];
      if (related.status !== "fulfilled" && !hiddenForOpenNote() && !popup._lhnRelatedController.signal.aborted) {
        try {
          const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase())}`);
          if (response.ok) {
            const entry = (await response.json())[0];
            const synonyms = [...new Set((entry?.meanings || []).flatMap(meaning => meaning.synonyms || []))].slice(0, 3);
            fallbackRelated = await Promise.all(synonyms.map(async synonym => { try { return { word:synonym, kind:"Syn", meaning:(await dictionaryTranslate(synonym, targetLanguage)).translatedText }; } catch { return { word:synonym, kind:"Syn", meaning:synonym }; } }));
          }
        } catch {}
      }
      const ipaValue = ipaResult.status === "fulfilled" ? ipaResult.value : null;
      const result = { word, ipa:ipaValue?.text || "", ipaApprox:ipaValue?.approx === true, translation:translation.status === "fulfilled" ? translation.value : { translatedText:word, posDict:[], engine:"Dictionary" }, related:related.status === "fulfilled" ? related.value : fallbackRelated, forms:forms.status === "fulfilled" ? forms.value : [], collocations:collocations.status === "fulfilled" ? collocations.value : [] };
      popup._lhnMainTranslation = result.translation;
      if (!popup._lhnHideForNote && !popup._lhnRelatedController.signal.aborted) await setDictionaryCache(cacheKey, result);
      if (hiddenForOpenNote()) { fillNoteFromDictionary(popup); popup.remove(); if (dictionaryPopup === popup) dictionaryPopup = null; }
      else renderEnglishDictionary(popup, result, false);
    } catch (error) {
      if (popup.isConnected) popup.textContent = t("translationUnavailable");
      if (popup._lhnHideForNote) { popup.remove(); if (dictionaryPopup === popup) dictionaryPopup = null; }
    }
  }
  function translationOptionsFrom(data = {}) {
    const saved = data[STUDY_TRANSLATION_SETTINGS_KEY] || {};
    const displaySettings = { ...settings, ...(data[CONFIG.STORAGE_KEYS.SETTINGS] || {}) };
    const displayLanguage = globalThis.LHN_LANGUAGES?.languageFor(displaySettings) || "en";
    const sourceLanguage = ["auto", "en", "vi", "ko"].includes(saved.sourceLanguage) ? saved.sourceLanguage : "auto";
    translationSourceLanguage = sourceLanguage;
    const savedTarget = saved.targetLanguage || "auto";
    const targetLanguage = ["auto", "same"].includes(savedTarget) ? displayLanguage : ["en", "vi", "ko"].includes(savedTarget) ? savedTarget : displayLanguage;
    return { sourceLanguage, targetLanguage };
  }
  async function translateUsingExistingCache(text, sourceLanguage = null) {
    if (!noteTranslator) return { translation:null, targetLanguage:"en" };
    const data = await browser.storage.local.get([STUDY_TRANSLATION_SETTINGS_KEY, CONFIG.STORAGE_KEYS.SETTINGS]);
    const options = translationOptionsFrom(data);
    if (sourceLanguage) options.sourceLanguage = sourceLanguage;
    const translation = await noteTranslator.translate(text, options);
    return { translation, targetLanguage:options.targetLanguage };
  }
  function showTranslateIcon(range) {
    if (!range || range.collapsed || !range.startContainer.isConnected || panel || websiteDisabled || settings.translateIconEnabled === false || settings.translationPopupEnabled !== false || settings.showOnSelect !== false) return;
    translateIcon?.remove();
    const button = document.createElement("button");
    button.id = "lhn-translate-icon"; button.type = "button"; button.setAttribute("aria-label", t("translateSelectedText")); button.title = t("translateSelectedText");
    button.innerHTML = '<img alt="" src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIHN0cm9rZS13aWR0aD0iNCI+DQogIDxwYXRoIGQ9Im05IDExLTYgNnYzaDlsMy0zIi8+DQogIDxwYXRoIGQ9Im0yMiAxMi00LjYgNC42YTIgMiAwIDAgMS0yLjggMGwtNS4yLTUuMmEyIDIgMCAwIDEgMC0yLjhMMTQgNCIvPg0KPC9zdmc+DQo=" />';
    button.addEventListener("mousedown", event => { event.preventDefault(); event.stopPropagation(); });
    button.addEventListener("click", event => { event.preventDefault(); event.stopPropagation(); translateSelectedRange(range, { forcePopup:true }); });
    document.documentElement.appendChild(button); translateIcon = button;
    // Keep host-page button rules from hiding the translate control.
    for (const [property, value] of Object.entries({ position:"fixed", display:"grid", visibility:"visible", opacity:"1", transform:"none", pointerEvents:"auto", zIndex:"2147483646", width:"20px", height:"20px" })) button.style.setProperty(property.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`), value, "important");
    positionTranslateIcon(range);
    requestAnimationFrame(() => button.isConnected && button.classList.add("lhn-visible"));
  }
  function syncTranslateIconAvailability() {
    if (!websiteSettingsReady || websiteDisabled || panel || settings.showOnSelect !== false || settings.translateIconEnabled === false || settings.translationPopupEnabled !== false || !selectedRange?.startContainer?.isConnected || selectedRange.collapsed) {
      translateIcon?.remove(); translateIcon = null; return;
    }
    showTranslateIcon(selectedRange);
  }
  function createTranslationPopup(range) {
    const popup = document.createElement("div"); popup.id = "lhn-direct-translation"; popup.setAttribute("role", "status"); popup.setAttribute("aria-live", "polite");
    popup.classList.toggle("lhn-ui-dark", isSidebarDark()); popup.classList.toggle("lhn-ui-light", !isSidebarDark());
    const text = document.createElement("span"); text.className = "lhn-direct-translation-text"; text.setAttribute("aria-label", t("translationLoading"));
    const loading = document.createElement("span"); loading.className = "lhn-direct-translation-loading"; loading.setAttribute("aria-hidden", "true");
    for (let index = 0; index < 3; index++) { const dot = document.createElement("span"); dot.className = "lhn-direct-translation-dot"; loading.appendChild(dot); }
    text.appendChild(loading);
    const speak = document.createElement("button"); speak.type = "button"; speak.className = "lhn-direct-translation-speak"; speak.title = t("readTranslation"); speak.setAttribute("aria-label", t("readTranslation"));
    speak.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/></svg>';
    const selectedText = cleanText(range.toString());
    const anchor = range.startContainer.nodeType === Node.ELEMENT_NODE ? range.startContainer : range.startContainer.parentElement;
    speak.addEventListener("click", event => { event.preventDefault(); event.stopPropagation(); if (selectedText) speakHighlightedText(selectedText, speechLanguageForText(selectedText, anchor), null, anchor); });
    popup.addEventListener("mousedown", event => event.stopPropagation()); popup.addEventListener("click", event => event.stopPropagation());
    popup.append(speak, text); popup._lhnAnchorRange = range; document.documentElement.appendChild(popup); translationPopup = popup;
    // Keep host-page rules from hiding or restyling this extension-owned popup.
    for (const [property, value] of Object.entries({ position:"fixed", display:"flex", visibility:"visible", opacity:"1", transform:"none", pointerEvents:"auto", zIndex:"2147483647", padding:"var(--lhn-popup-padding)", boxShadow:"var(--lhn-popup-shadow)" })) popup.style.setProperty(property.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`), value, "important");
    positionPopupAtAnchor(popup, range);
    requestAnimationFrame(() => popup.isConnected && popup.classList.add("lhn-visible"));
    return { popup, text, speak, setResult(value) { text.textContent = value || t("translationUnavailable"); text.removeAttribute("aria-label"); positionPopupAtAnchor(popup, range); } };
  }
  async function translateSelectedRange(range, { keepIcon = false, forcePopup = false, forceSpeak = false, textOverride = null, sourceLanguage = null } = {}) {
    if (!websiteSettingsReady || websiteDisabled || panel || !range || range.collapsed || !range.startContainer.isConnected) return;
    const selectedText = cleanText(textOverride ?? range.toString());
    if (!selectedText) return;
    if (settings.showFullEnglishDictionary !== false && isEnglishDictionaryWord(selectedText)) {
      translationRequestId++; translateIcon?.remove(); translateIcon = null; translationPopup?.remove(); translationPopup = null;
      lookupEnglishDictionary(selectedText, range);
      if ((settings.autoSpeakSelectedText === true || settings.autoSpeakOnTranslate === true || forceSpeak) && !panel) speakHighlightedText(selectedText, "en-US", null, null, true);
      return;
    }
    if (!noteTranslator) return;
    translationRequestId++;
    if (!keepIcon || !translateIcon?.isConnected) { translateIcon?.remove(); translateIcon = null; }
    translationPopup?.remove(); translationPopup = null;
    const requestId = translationRequestId;
    const ui = forcePopup || settings.translationPopupEnabled !== false ? createTranslationPopup(range) : null;
    if (settings.autoSpeakSelectedText === true || settings.autoSpeakOnTranslate === true || forceSpeak) {
      const anchor = range.startContainer.nodeType === Node.ELEMENT_NODE ? range.startContainer : range.startContainer.parentElement;
      speakHighlightedText(selectedText, sourceLanguage ? "en-US" : speechLanguageForText(selectedText, anchor), null, anchor, !!sourceLanguage);
    }
    try {
      const result = await translateUsingExistingCache(selectedText, sourceLanguage);
      if (requestId !== translationRequestId || !ui || translationPopup !== ui.popup) return;
      ui.setResult(result.translation, result.targetLanguage);
    } catch (error) { console.warn("Could not translate selected text", error); if (requestId === translationRequestId && ui && translationPopup === ui.popup) ui.setResult(null); }
  }
  function makeButton(label, cls, fn) {
    const b = document.createElement("button"); b.className = "lhn-btn " + (cls || ""); b.textContent = label; b.type = "button"; b.addEventListener("click", fn); return b;
  }
  function makeTagEditor(initialTags = [], className = "") {
    const element = document.createElement("div"); element.className = `lhn-tag-editor ${className}`.trim();
    const input = document.createElement("input"); input.type = "text"; input.placeholder = t("tagsPlaceholder"); input.setAttribute("aria-label", t("tagsLabel"));
    let tags = [], draft = "";
    const normalize = values => { const seen = new Set(); return values.map(value => String(value || "").trim()).filter(value => { const key = value.toLocaleLowerCase(); if (!key || seen.has(key)) return false; seen.add(key); return true; }); };
    const render = () => {
      element.replaceChildren();
      tags.forEach((tag, index) => { const chip = document.createElement("span"); chip.className = "lhn-tag-chip"; chip.append(document.createTextNode(tag)); chip.addEventListener("click", event => { if (event.target.closest("button")) return; tags.splice(index, 1); draft = tag; input.value = tag; render(); input.focus({ preventScroll: true }); input.setSelectionRange(0, input.value.length); }); const remove = document.createElement("button"); remove.type = "button"; remove.textContent = "×"; remove.setAttribute("aria-label", `${t("delete")}: ${tag}`); remove.addEventListener("click", event => { event.preventDefault(); event.stopPropagation(); tags.splice(index, 1); render(); input.focus({ preventScroll: true }); }); chip.appendChild(remove); element.appendChild(chip); });
      element.appendChild(input);
    };
    const commit = value => { const parts = String(value || "").split(","); tags = normalize([...tags, ...parts.slice(0, -1), parts.at(-1)]); input.value = ""; draft = ""; render(); input.focus({ preventScroll: true }); };
    tags = normalize(Array.isArray(initialTags) ? initialTags : String(initialTags || "").split(","));
    input.addEventListener("keydown", event => {
      if (event.key === "," || event.key === "Enter") { event.preventDefault(); event.stopPropagation(); commit(input.value); }
      else if (event.key === "Backspace" && !input.value && tags.length) { event.preventDefault(); tags.pop(); render(); input.focus({ preventScroll: true }); }
      else if (event.key === "Escape") event.stopPropagation();
    });
    input.addEventListener("input", () => { if (input.value.includes(",")) commit(input.value); else draft = input.value; });
    element.addEventListener("click", () => input.focus({ preventScroll: true })); render();
    return { element, getTags: () => normalize([...tags, draft]) };
  }
  function getContext(range) {
    if (!range) return { prefix: "", suffix: "" };
    const text = range.startContainer.nodeType === Node.TEXT_NODE ? range.startContainer.textContent : range.startContainer.textContent || "";
    const start = range.startOffset;
    const end = range.endContainer === range.startContainer ? range.endOffset : start;
    return { prefix: text.slice(Math.max(0, start - 40), start), suffix: text.slice(end, end + 40) };
  }
  function getSentenceContext(range, quote) {
    if (!range) return "";
    const node = range.startContainer.nodeType === Node.ELEMENT_NODE ? range.startContainer : range.startContainer.parentElement;
    const block = node?.closest("p,li,blockquote,figcaption,dd,dt,h1,h2,h3,h4,h5,h6,article,section,div") || node;
    if (!block) return "";
    const isImmersiveTranslation = element => element?.nodeType === Node.ELEMENT_NODE &&
      Array.from(element.classList || []).some(className => className.startsWith("immersive-translate-target-translation-"));
    let text = block.textContent || "", start, end;
    if (isImmersiveTranslation(block) || block.querySelector?.('[class*="immersive-translate-target-translation-"]')) {
      let filteredText = "";
      const offsets = [[range.startContainer, "start", range.startOffset], [range.endContainer, "end", range.endOffset]];
      const marks = new Set();
      const visit = current => {
        if (isImmersiveTranslation(current)) return;
        if (current.nodeType === Node.TEXT_NODE) {
          for (const [container, key, offset] of offsets) if (container === current && !marks.has(key)) {
            if (key === "start") start = filteredText.length + Math.min(offset, current.textContent.length);
            else end = filteredText.length + Math.min(offset, current.textContent.length);
            marks.add(key);
          }
          filteredText += current.textContent || "";
          return;
        }
        const children = current.childNodes || [];
        for (let index = 0; index <= children.length; index++) {
          for (const [container, key, offset] of offsets) if (container === current && offset === index && !marks.has(key)) {
            if (key === "start") start = filteredText.length;
            else end = filteredText.length;
            marks.add(key);
          }
          if (index < children.length) visit(children[index]);
        }
      };
      visit(block);
      if (!marks.has("start") || !marks.has("end")) return "";
      text = filteredText;
    } else {
      const before = document.createRange(), after = document.createRange();
      try {
        before.selectNodeContents(block); before.setEnd(range.startContainer, range.startOffset); start = before.toString().length;
        after.selectNodeContents(block); after.setStart(range.endContainer, range.endOffset); end = text.length - after.toString().length;
      } catch { return ""; }
    }
    const isTerminal = index => {
      if (!".!?。？！؟".includes(text[index])) return false;
      let next = index + 1;
      while (next < text.length && /[\"'”’»）)\]}]/.test(text[next])) next++;
      if (text[next] === "\\") next++;
      return next === text.length || /\s/.test(text[next]) || "([{（「『".includes(text[next] || " ");
    };
    let sentenceStart = 0;
    for (let i = 0; i < start; i++) if (isTerminal(i)) sentenceStart = i + 1;
    let sentenceEnd = text.length;
    for (let i = Math.max(start, end - 1); i < text.length; i++) if (isTerminal(i)) { sentenceEnd = i + 1; break; }
    return cleanText(text.slice(sentenceStart, sentenceEnd));
  }
  function sameAnnotationContent(existing, next) {
    if (!existing || !next) return false;
    const persistedFields = ["quote", "note", "contextNote", "url", "title", "hostname", "thumbnailUrl", "prefix", "suffix", "createdAt", "color", "tags"];
    return persistedFields.every(key => JSON.stringify(existing[key]) === JSON.stringify(next[key]));
  }
  function showComposer(range, existing = null, { skipAutoTranslate = false, dictionaryWord = "" } = {}) {
    if (!websiteSettingsReady || websiteDisabled) return;
    const selectedBeforeComposer = cleanText(range?.toString());
    const useEnglishDictionary = !existing && settings.showFullEnglishDictionary !== false && isEnglishDictionaryWord(selectedBeforeComposer);
    if (useEnglishDictionary) {
      skipAutoTranslate = true;
      dictionaryWord ||= selectedBeforeComposer;
      translationRequestId++;
      translateIcon?.remove(); translateIcon = null;
      translationPopup?.remove(); translationPopup = null;
      if (dictionaryPopup && dictionaryPopup.dataset.word !== selectedBeforeComposer.toLowerCase()) {
        dictionaryRequestId++; dictionaryPopup.remove(); dictionaryPopup = null;
      }
    } else removeTranslationUI();
    removeTooltip();
    if (panel) removeComposer(); else webHighlighter.clearPreview();
    activeRange = range ? range.cloneRange() : null;
    const selectedQuote = cleanText(activeRange?.toString());
    const selectedContext = getContext(activeRange);
    const selectedSentence = settings.sentenceNoteEnabled !== false ? getSentenceContext(activeRange, selectedQuote) : "";
    selectedColor = existing ? CONFIG.normalizeColor(existing.color) : CONFIG.normalizeColor(settings.defaultHighlightColor); activeAnnotationId = existing?.id || null; colorChosen = false; composerOriginalColor = selectedColor;
    panel = document.createElement("div"); panel.id = "lhn-panel"; panel.dataset.lhnDictionaryWord = dictionaryWord.toLowerCase(); panel._lhnNoteEdited = !!existing; const composerPanel = panel; syncSidebarTheme();
    const paletteWidth = Math.max(230, 66 + 34 * COLORS.length);
    panel.style.width = `${Math.min(paletteWidth, 330, Math.max(200, innerWidth - 20))}px`;
    const arrow = document.createElement("div"); arrow.className = "lhn-popup-arrow"; arrow.setAttribute("aria-hidden", "true");
    const colors = document.createElement("div"); colors.className = "lhn-colors";
    COLORS.forEach(c => {
      const option = document.createElement("span"); option.className = "lhn-color-option lhn-compose-color-option"; option.dataset.color = c;
      const b = document.createElement("button"); b.className = "lhn-color"; b.dataset.color = c; b.title = t(CONFIG.colorLabelKey(c)); b.setAttribute("aria-label", b.title); b.setAttribute("aria-pressed", String(c === selectedColor)); b.style.background = COLOR_MAP[c];
      b.addEventListener("click", e => {
        e.preventDefault(); e.stopPropagation(); selectedColor = c; colorChosen = true;
        if (activeAnnotationId) webHighlighter.setMarkColor(activeAnnotationId, c);
        if (activeRange) webHighlighter.updatePreviewColor(selectedColor);
        colors.querySelectorAll(".lhn-color").forEach(n => n.setAttribute("aria-pressed", String(n.dataset.color === c)));
        requestAnimationFrame(() => { if (textarea.isConnected) textarea.focus({ preventScroll: true }); });
      });
      const star = makeButton("", "lhn-color-default-star", e => {
        e.preventDefault(); e.stopPropagation();
        selectedColor = c; colorChosen = true;
        if (activeAnnotationId) webHighlighter.setMarkColor(activeAnnotationId, c);
        if (activeRange) webHighlighter.updatePreviewColor(selectedColor);
        colors.querySelectorAll(".lhn-color").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.color === c)));
        setDefaultHighlightColor(c);
        requestAnimationFrame(() => { if (textarea.isConnected) textarea.focus({ preventScroll: true }); });
      });
      star.title = `${t("setDefaultColor")}: ${t(CONFIG.colorLabelKey(c))}`; star.setAttribute("aria-label", star.title); star.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z"/></svg>`;
      const check = document.createElement("span"); check.className = "lhn-color-default-check"; check.textContent = "✓"; check.setAttribute("aria-hidden", "true");
      option.append(b, star, check); colors.appendChild(option);
    });
    const toolbar = document.createElement("div"); toolbar.className = "lhn-composer-toolbar";
    const closeButton = makeButton("×", "lhn-close-btn", removeComposer); closeButton.setAttribute("aria-label", t("cancel")); closeButton.title = t("cancel");
    toolbar.append(colors, closeButton);
    const inputWrap = document.createElement("div"); inputWrap.className = "lhn-input-wrap";
    const noteIcon = document.createElement("span"); noteIcon.className = "lhn-note-icon"; noteIcon.setAttribute("aria-hidden", "true"); noteIcon.innerHTML = `<svg viewBox="0 0 24 24"><path d="M8 3h7l5 5v13H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M15 3v5h5M10 13h6M10 17h6"/></svg>`;
    const textarea = document.createElement("textarea"); textarea.rows = 2; textarea.placeholder = t("notePlaceholder"); textarea.value = existing?.note || ""; textarea.setAttribute("aria-label", t("noteAria"));
    let noteEdited = !!existing;
    textarea.addEventListener("input", () => { noteEdited = true; composerPanel._lhnNoteEdited = true; });
    const tagField = document.createElement("label"); tagField.className = "lhn-composer-tags-field";
    const tagCaption = document.createElement("span"); tagCaption.dataset.lhnI18n = "tagsLabel"; tagCaption.textContent = t("tagsLabel");
    const tagEditor = makeTagEditor(existing?.tags || [], "lhn-composer-tags"); tagField.append(tagCaption, tagEditor.element);
    const resizeNote = () => { textarea.style.height = "54px"; textarea.style.height = Math.max(54, textarea.scrollHeight) + "px"; };
    textarea.addEventListener("input", resizeNote);
    inputWrap.append(noteIcon, textarea);
    panel.append(arrow, toolbar, inputWrap, tagField);
    hideDictionaryPopupForNote();
    textarea.addEventListener("keydown", e => {
      if (e.key !== "Enter") return;
      e.preventDefault(); e.stopPropagation();
      if (e.ctrlKey || e.metaKey) {
        textarea.setRangeText("\n", textarea.selectionStart, textarea.selectionEnd, "end");
        textarea.dispatchEvent(new Event("input", { bubbles: true }));
      } else save();
    });
    panel.addEventListener("mousedown", e => e.stopPropagation());
    panel.addEventListener("click", e => e.stopPropagation());
    document.documentElement.appendChild(panel);
    updateDefaultColorIndicators();
    resizeNote();
    if (settings.autoSpeakSelectedText && selectedQuote) {
      const anchor = range?.startContainer?.nodeType === Node.ELEMENT_NODE ? range.startContainer : range?.startContainer?.parentElement;
      speakHighlightedText(selectedQuote, speechLanguageForText(selectedQuote, anchor), null, anchor);
    }
    if (!skipAutoTranslate && !existing && settings.autoTranslate !== false && selectedQuote && noteTranslator) {
      const composer = panel;
      translateUsingExistingCache(selectedQuote).then(({ translation }) => {
        if (!panel || panel !== composer || noteEdited || textarea.value.trim()) return;
        if (!translation || !panel || panel !== composer || noteEdited || textarea.value.trim()) return;
        textarea.value = translation;
        resizeNote();
      }).catch(error => console.warn("Could not auto-translate selected text", error));
    }
    const rect = range?.getBoundingClientRect();
    if (activeRange) webHighlighter.drawPreview(activeRange, selectedColor);
    requestAnimationFrame(() => { if (panel) { panel.classList.add("lhn-visible"); position(panel, rect ? rect.left : innerWidth / 2 - 140, rect ? rect.bottom + 8 : innerHeight / 2); } });
    // The temporary inline wrappers keep the selected text visible after focus moves to the note field.
    requestAnimationFrame(() => { if (panel && textarea.isConnected) textarea.focus({ preventScroll: true }); }) ;
    let saveInFlight = false;
    async function save() {
      if (!panel || saveInFlight) return;
      const q = existing?.quote || selectedQuote;
      if (!q) { removeComposer(); return; }
      const context = selectedContext;
      const item = { quote: q, note: textarea.value.trim(), contextNote: selectedSentence || existing?.contextNote || "", tags: tagEditor.getTags(), color: selectedColor, url: existing?.url || pageUrl(), title: existing?.title || pageTitle(), hostname: existing?.hostname || location.hostname, thumbnailUrl: existing?.thumbnailUrl || pageThumbnailUrl(), prefix: context.prefix || existing?.prefix || "", suffix: context.suffix || existing?.suffix || "", createdAt: existing?.createdAt };
      if (sameAnnotationContent(existing, item)) { removeComposer(); return; }
      saveInFlight = true;
      let persisted = false;
      try {
        if (existing) {
          webHighlighter.clearPreview();
          const saved = await LHN_MESSAGING.sendMessage({ type: "UPDATE", item: { ...item, id: existing.id } });
          if (saved?.id) pageAnnotationCache.set(saved.id, saved);
          webHighlighter.setMarkColor(existing.id, selectedColor);
        } else {
          const saved = await LHN_MESSAGING.sendMessage({ type: "ADD", item }); item.id = saved.id;
          if (saved?.id) pageAnnotationCache.set(saved.id, saved);
          if (webHighlighter.hasPreview()) webHighlighter.commitPreview(item);
          else if (activeRange && activeRange.startContainer.isConnected) webHighlighter.wrapRange(activeRange, item);
          else await restoreAnnotations();
        }
        persisted = true;
      } catch (e) { console.error("Highlight Notes save failed", e); }
      if (existing && persisted) colorChosen = false;
      removeComposer();
      if (sidebarOpen) renderSidebar();
    }
    composerSave = save;
  }
  async function getItem(id) {
    const cached = pageAnnotationCacheUrl === pageUrl() ? pageAnnotationCache.get(id) : null;
    if (cached) return cached;
    try {
      const item = await LHN_MESSAGING.sendMessage({ type: "GET_ONE", id });
      if (item?.id && item.url === pageUrl()) { pageAnnotationCacheUrl = item.url; pageAnnotationCache.set(item.id, item); }
      return item;
    } catch { return null; }
  }
  function cachePageAnnotations(url, items) {
    if (pageAnnotationCacheUrl !== url) pageAnnotationCache.clear();
    pageAnnotationCacheUrl = url;
    pageAnnotationCache = new Map((Array.isArray(items) ? items : []).filter(item => item?.id).map(item => [item.id, item]));
  }
  function attachMarkEvents(mark, id) {
    if (mark.dataset.lhnEvents) return; mark.dataset.lhnEvents = "1";
    mark.addEventListener("mouseenter", async () => {
      if (!websiteSettingsReady || websiteDisabled) return;
      clearTimer("dismiss"); clearTimer("hover");
      hoverTimer = setTimeout(async () => { const item = await getItem(id); if (item && mark.isConnected) showNote(mark, item); }, 100);
    });
    mark.addEventListener("mouseleave", scheduleTooltipClose);
    mark.addEventListener("click", async e => { if (!websiteSettingsReady || websiteDisabled) return; e.preventDefault(); e.stopPropagation(); const clickX = e.clientX; clearTimer("hover"); clearTimer("dismiss"); const item = await getItem(id); if (item) showHighlightActions(mark, item, clickX); });
  }
  function scheduleTooltipClose() {
    clearTimer("dismiss"); dismissTimer = setTimeout(() => { if (!tooltip?.matches(":hover") && !actionPopup?.matches(":hover") && !hoveredMark?.matches(":hover")) removeTooltip(); }, 180);
  }
  function detectQuoteLanguage(text, anchor) {
    const sample = String(text || "").trim();
    if (!sample) return window.navigator?.language || "en-US";

    // Script-based detection is reliable for languages with distinct writing systems.
    if (/[\uAC00-\uD7AF]/.test(sample)) return "ko-KR";
    if (/[\u3040-\u30FF]/.test(sample)) return "ja-JP";
    if (/[\u4E00-\u9FFF]/.test(sample)) return "zh-CN";
    if (/[\u0400-\u04FF]/.test(sample)) return /[ґєіїҐЄІЇ]/.test(sample) ? "uk-UA" : "ru-RU";
    if (/[\u0E00-\u0E7F]/.test(sample)) return "th-TH";
    if (/[\u0600-\u06FF]/.test(sample)) return /[پچژگکی]/.test(sample) ? "fa-IR" : "ar-SA";
    if (/[\u0900-\u097F]/.test(sample)) return "hi-IN";
    if (/[\u0370-\u03FF]/.test(sample)) return "el-GR";
    if (/[\u0590-\u05FF]/.test(sample)) return "he-IL";
    if (/[\u0980-\u09FF]/.test(sample)) return "bn-BD";
    if (/[\u0A00-\u0A7F]/.test(sample)) return "pa-IN";
    if (/[\u0A80-\u0AFF]/.test(sample)) return "gu-IN";
    if (/[\u0B80-\u0BFF]/.test(sample)) return "ta-IN";
    if (/[\u0C00-\u0C7F]/.test(sample)) return "te-IN";
    if (/[\u0C80-\u0CFF]/.test(sample)) return "kn-IN";
    if (/[\u0D00-\u0D7F]/.test(sample)) return "ml-IN";

    if (/[ñ¿¡]/i.test(sample)) return "es-ES";
    if (/[ãõ]/i.test(sample)) return "pt-PT";
    if (/[äöüß]/i.test(sample)) return "de-DE";
    if (/[æçœëïÿ]/i.test(sample)) return "fr-FR";

    // Vietnamese has a distinctive set of letters/diacritics.
    if (/[ăâđêôơưĂÂĐÊÔƠƯáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i.test(sample)) return "vi-VN";

    // For Latin-script languages, compare common words and characteristic spellings.
    // This is intentionally heuristic: the Web Speech API has no built-in language detector.
    const lower = sample.toLowerCase();
    // Match Flashcard's English-word check before isolated tokens (for example,
    // the "e" in "e.g.") can add noise to other language scores.
    if (/\b(?:the|and|with|this|that|from|which|have|will)\b/i.test(lower)) return "en-US";
    const shortLanguageWords = [
      ["es-ES", /\b(?:hola|gracias|adiós|buenos|buenas|por favor)\b/i],
      ["fr-FR", /\b(?:bonjour|merci|salut|au revoir|oui|non)\b/i],
      ["de-DE", /\b(?:hallo|danke|guten|guten tag|tschüss|auf wiedersehen)\b/i],
      ["it-IT", /\b(?:ciao|grazie|buongiorno|arrivederci|prego)\b/i],
      ["pt-PT", /\b(?:olá|obrigado|obrigada|bom dia|tchau)\b/i],
      ["nl-NL", /\b(?:hallo|dank je|bedankt|goedemorgen|tot ziens)\b/i]
    ];
    for (const [language, pattern] of shortLanguageWords) if (pattern.test(lower)) return language;
    const wordCount = (words) => words.reduce((n, word) => n + ((lower.match(new RegExp(`\\b${word}\\b`, "g")) || []).length), 0);
    const candidates = [
      ["es-ES", ["el","la","los","las","de","que","y","en","un","una","por","para","con","es","del","como","pero","más"]],
      ["fr-FR", ["le","la","les","des","une","un","et","est","dans","pour","avec","que","qui","pas","sur","ce","cette","aux"]],
      ["de-DE", ["der","die","das","und","ist","nicht","ein","eine","mit","für","auf","den","von","zu","im","werden","auch"]],
      ["it-IT", ["il","lo","la","gli","le","di","che","e","è","un","una","per","con","non","sono","della","del"]],
      ["pt-PT", ["o","a","os","as","de","que","e","é","um","uma","para","com","não","por","mais","dos","das","você"]],
      ["nl-NL", ["de","het","een","en","van","is","dat","niet","op","met","voor","zijn","wordt","maar"]],
      ["vi-VN", ["và","của","là","các","những","được","trong","không","với","một","này","đó","cho","khi","từ","người","thì","sẽ","đã","tại","theo","về","có","nếu","vì","như","để","nên","rất","họ","chúng","tôi","bạn"]]
    ];
    let best = { lang: "", score: 0 };
    for (const [lang, words] of candidates) {
      const score = wordCount(words);
      if (score > best.score) best = { lang, score };
    }
    if (best.score >= 2) return best.lang;

    // The demo treats unrecognized Latin text as English; do not inherit a different page language.
    if (/[A-Za-z]/.test(sample)) return "en-US";

    // Prefer explicit language metadata on the highlighted node, then the page.
    const declared = (anchor?.closest?.("[lang]")?.getAttribute("lang") || document.documentElement.lang || "").trim();
    return declared || window.navigator?.language || "en-US";
  }
  function speechLanguageForText(text, anchor) {
    return ({ en:"en-US", vi:"vi-VN", ko:"ko-KR" })[translationSourceLanguage] || detectQuoteLanguage(text, anchor);
  }
  function speakWithSystemSpeech(text, lang, onEnd, browserVoiceURI = "") {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) { onEnd?.(); return; }
    const synth = window.speechSynthesis;
    const normalizeLanguage = value => String(value || "").trim().replace(/_/g, "-").toLowerCase();
    const findMatchingVoice = voices => {
      const selected = browserVoiceURI && voices.find(voice => voice.voiceURI === browserVoiceURI);
      if (selected) return selected;
      const target = normalizeLanguage(lang);
      const base = target.split("-")[0];
      return voices.find(voice => normalizeLanguage(voice.lang) === target)
        || voices.find(voice => normalizeLanguage(voice.lang).split("-")[0] === base);
    };
    const playWithVoices = voices => {
      const utterance = new SpeechSynthesisUtterance(text);
      const voice = findMatchingVoice(voices);
      if (!voice) {
        console.warn(`No system speech voice matches ${lang}; skipping speech rather than reading in the wrong language.`);
        showSidebarToast("Trình duyệt bạn không hỗ trợ ngôn ngữ này");
        onEnd?.({ unsupported:true });
        return;
      }
      utterance.voice = voice;
      utterance.lang = voice.lang || lang;
      utterance.rate = getSpeechRate(lang);
      if (typeof onEnd === "function") { utterance.onend = onEnd; utterance.onerror = onEnd; }
      synth.speak(utterance);
    };
    synth.cancel();
    const voices = synth.getVoices();
    if (findMatchingVoice(voices) || !synth.addEventListener) { playWithVoices(voices); return; }
    // Firefox may initially expose only its default voice; wait briefly for the requested language.
    let done = false;
    let timeoutId;
    const finish = () => {
      if (done) return;
      done = true;
      window.clearTimeout(timeoutId);
      synth.removeEventListener?.("voiceschanged", onVoicesChanged);
      playWithVoices(synth.getVoices());
    };
    const onVoicesChanged = () => { if (findMatchingVoice(synth.getVoices())) finish(); };
    synth.addEventListener("voiceschanged", onVoicesChanged);
    timeoutId = window.setTimeout(finish, 900);
  }
  function stopCurrentSpeakAudio() {
    const audio = currentSpeakAudio;
    const objectUrl = currentSpeakObjectUrl;
    currentSpeakAudio = null; currentSpeakObjectUrl = null;
    if (audio) { audio.onended = null; audio.onerror = null; audio.pause(); audio.removeAttribute("src"); audio.load(); }
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    const finish = currentSpeakFinish; currentSpeakFinish = null; finish?.();
  }
  function toggleSpeechPause() {
    const synth = window.speechSynthesis;
    const shouldPause = !speechPauseActive;
    const readerPause = new CustomEvent("lhn-bilingual-reader-pause", { detail:shouldPause, cancelable:true });
    document.dispatchEvent(readerPause);
    if (shouldPause) {
      speechPauseActive = true;
      if (!readerPause.defaultPrevented && synth?.speaking) synth.pause();
      const media = new Set(document.querySelectorAll("audio,video"));
      if (currentSpeakAudio) media.add(currentSpeakAudio);
      shortcutPausedMedia = [];
      media.forEach(item => { if (!item.paused && !item.ended) { item.pause(); shortcutPausedMedia.push(item); } });
    } else {
      speechPauseActive = false;
      if (!readerPause.defaultPrevented && synth?.paused) synth.resume();
      shortcutPausedMedia.forEach(item => { if (item.paused && !item.ended) item.play().catch(error => console.warn("Could not resume media", error)); });
      shortcutPausedMedia = [];
    }
    return true;
  }
  document.addEventListener("lhn-bilingual-reader-pause-state", event => {
    speechPauseActive = Boolean(event.detail);
    if (!speechPauseActive) shortcutPausedMedia = [];
  });
  document.addEventListener("keydown", e => {
    if (!websiteSettingsReady || websiteDisabled || isEditable(e.target)) return;
    const pressed = shortcutForEvent(e).toLowerCase();
    const pauseShortcut = String(settings.speechPauseShortcut ?? "Space").toLowerCase();
    if (pauseShortcut && pressed === pauseShortcut) {
      const pageMediaPlaying = Array.from(document.querySelectorAll("audio,video")).some(item => !item.paused && !item.ended);
      const speaking = Boolean(speechPauseActive || document.querySelector(".lhn-bilingual-reading") || window.speechSynthesis?.speaking || window.speechSynthesis?.paused || (currentSpeakAudio && !currentSpeakAudio.ended) || pageMediaPlaying);
      if (speaking) {
        e.preventDefault(); e.stopImmediatePropagation();
        if (!e.repeat) toggleSpeechPause();
        return;
      }
    }
    const selectVoiceShortcut = String(settings.selectVoiceShortcut ?? "Alt+L").toLowerCase();
    if (selectVoiceShortcut && pressed === selectVoiceShortcut) {
      const handled = !document.dispatchEvent(new CustomEvent("lhn-bilingual-reader-command", { detail:"open-voice-select", cancelable:true }));
      if (handled) { e.preventDefault(); e.stopImmediatePropagation(); }
      return;
    }
    const readingShortcuts = { [String(settings.previousReadingShortcut ?? "Left").toLowerCase()] : "previous-reading-block", [String(settings.nextReadingShortcut ?? "Right").toLowerCase()] : "next-reading-block", [String(settings.increaseReadingSpeedShortcut ?? "Up").toLowerCase()] : "increase-reading-speed", [String(settings.decreaseReadingSpeedShortcut ?? "Down").toLowerCase()] : "decrease-reading-speed" };
    const readingAction = readingShortcuts[pressed];
    if (readingAction) {
      const accepted = document.dispatchEvent(new CustomEvent("lhn-bilingual-reader-command", { detail:readingAction, cancelable:true }));
      if (!accepted) { speechPauseActive = false; shortcutPausedMedia = []; e.preventDefault(); e.stopImmediatePropagation(); }
    }
  }, true);
  document.addEventListener("lhn-bilingual-reader-started", () => { speechPauseActive = false; shortcutPausedMedia = []; });
  async function speakHighlightedText(text, lang, onEnd, anchor = null, forceLang = false) {
    const requestId = ++speakRequestId;
    speechPauseActive = false; shortcutPausedMedia = [];
    window.speechSynthesis?.cancel();
    stopCurrentSpeakAudio();
    let finished = false;
    const finish = () => { if (finished) return; finished = true; if (currentSpeakFinish === finish) currentSpeakFinish = null; onEnd?.(); };
    currentSpeakFinish = finish;
    const voiceSettings = await LHN_TTS.getVoiceSettings().catch(() => ({ voiceMode:settings.voiceMode || settings.speechVoice || "google", browserVoiceURI:settings.browserVoiceURI || "" }));
    if (requestId !== speakRequestId) return;
    const sourceLanguage = forceLang ? lang : ({ en:"en-US", vi:"vi-VN", ko:"ko-KR" })[translationSourceLanguage];
    const declaredLanguage = anchor?.closest?.("[lang]")?.getAttribute("lang") || document.documentElement.lang || window.navigator?.language || lang || "en-US";
    if (voiceSettings.voiceMode === "google") lang = sourceLanguage || await LHN_TTS.detectLanguage(text, declaredLanguage);
    lang = LHN_TTS.normalizeLanguage(lang) || "en-US";
    if (requestId !== speakRequestId) return;
    const sample = LHN_PREPROCESS_SPEECH(String(text || "").trim(), lang, settings);
    if (!sample) { finish(); return; }
    if (voiceSettings.voiceMode === "browser") {
      speakWithSystemSpeech(sample, lang, finish, voiceSettings.browserVoiceURI);
      return;
    }
    const googleLanguage = String(lang || "en-US").trim().replace(/_/g, "-").split("-")[0].toLowerCase() || "en";
    LHN_TTS.play({
      text: sample, lang, googleLanguage, voice: `google-translate-default:${googleLanguage}`, rate: getSpeechRate(lang),
      isActive: () => requestId === speakRequestId,
      setCurrent: (audio, url) => { currentSpeakAudio = audio; currentSpeakObjectUrl = url; },
      clearCurrent: () => { currentSpeakAudio = null; currentSpeakObjectUrl = null; },
      browserVoiceURI:voiceSettings.browserVoiceURI,
      systemSpeak: (t, l, done, uri) => speakWithSystemSpeech(t, l, done, uri),
      onGoogleAudioSlow: () => showSidebarToast(() => t("googleAudioSlowToast")),
      onEnd: finish
    });
  }
  function showNote(anchor, item) {
    if (!websiteSettingsReady || websiteDisabled) return;
    removeTranslationUI();
    if (panel && activeAnnotationId === item.id) { clearTimer("dismiss"); removeTooltip(); return; }
    clearTimer("dismiss");
    if (tooltip && hoveredMark === anchor && tooltip.dataset.itemId === item.id) return;
    removeTooltip(); hoveredMark = anchor;
    tooltip = document.createElement("div"); tooltip.id = "lhn-note-pop"; tooltip.dataset.itemId = item.id; tooltip._lhnAnchor = anchor; syncSidebarTheme();
    tooltipColorUndo = null;
    const note = document.createElement("div"); note.className = "lhn-tooltip-note"; note.dataset.emptyNote = String(!item.note); note.textContent = item.note || t("noNote");
    const heading = document.createElement("div"); heading.className = "lhn-tooltip-heading";
    const speakHighlight = () => {
      const text = String(item.quote || "").trim();
      if (!text || !("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) return;
      try { speakHighlightedText(text, speechLanguageForText(text, anchor), null, anchor); }
      catch (error) { console.warn("Highlight speech playback failed", error); }
    };
    const hoverSpeakButton = makeButton("", "secondary lhn-icon-btn lhn-tooltip-speak-trigger", speakHighlight);
    hoverSpeakButton.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${CONFIG.ACTION_ICON_PATHS.volume}</svg>`;
    hoverSpeakButton.setAttribute("aria-label", t("speakHighlightTooltip")); hoverSpeakButton.title = t("speakHighlightTooltip");
    const row = document.createElement("div"); row.className = "lhn-row lhn-actions lhn-tooltip-actions";
    const colorGroup = document.createElement("div"); colorGroup.className = "lhn-tooltip-colors";
    for (const color of COLORS) {
      const option = document.createElement("span"); option.className = "lhn-color-option lhn-tooltip-color-option"; option.dataset.color = color;
      const colorButton = document.createElement("button");
      colorButton.type = "button"; colorButton.className = `lhn-tooltip-color lhn-${color}`; colorButton.dataset.color = color;
      colorButton.style.backgroundColor = COLOR_MAP[color];
      colorButton.title = t(CONFIG.colorLabelKey(color));
      colorButton.setAttribute("aria-label", colorButton.title);
      colorButton.setAttribute("aria-pressed", String((item.color || CONFIG.DEFAULT_COLOR) === color));
      colorButton.addEventListener("click", async e => {
        e.preventDefault(); e.stopPropagation();
        const previousColor = CONFIG.normalizeColor(item.color);
        if (previousColor === color) return;
        if (!tooltipColorUndo || tooltipColorUndo.id !== item.id) tooltipColorUndo = { id: item.id, color: previousColor, item: { ...item } };
        item.color = color;
        webHighlighter.setMarkColor(item.id, color);
        colorGroup.querySelectorAll(".lhn-tooltip-color").forEach(button => button.setAttribute("aria-pressed", String(button === colorButton)));
        try {
          const updated = await LHN_MESSAGING.sendMessage({ type: "UPDATE", item: { ...item, color } });
          if (updated?.id) pageAnnotationCache.set(updated.id, updated);
          item.color = CONFIG.normalizeColor(updated?.color || color);
          webHighlighter.setMarkColor(item.id, item.color);
        } catch (error) {
          console.error("Highlight Notes color update failed", error);
          item.color = previousColor;
          webHighlighter.setMarkColor(item.id, previousColor);
          colorGroup.querySelectorAll(".lhn-tooltip-color").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.color === previousColor)));
        }
      });
      const star = makeButton("", "lhn-color-default-star", e => { e.preventDefault(); e.stopPropagation(); setDefaultHighlightColor(color); });
      star.title = `${t("setDefaultColor")}: ${t(CONFIG.colorLabelKey(color))}`; star.setAttribute("aria-label", star.title); star.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z"/></svg>`;
      const check = document.createElement("span"); check.className = "lhn-color-default-check"; check.textContent = "✓"; check.setAttribute("aria-hidden", "true");
      option.append(colorButton, star, check); colorGroup.appendChild(option);
    }
    const actionGroup = document.createElement("div"); actionGroup.className = "lhn-tooltip-icon-actions";
    const editButton = makeButton("✎", "lhn-icon-btn", () => {
      const range = document.createRange();
      range.selectNodeContents(anchor);
      showComposer(range, item);
    });
    editButton.setAttribute("aria-label", t("editNote")); editButton.title = t("editNote");
    const deleteButton = makeButton("▤", "secondary lhn-icon-btn lhn-trash-btn", async () => {
      await LHN_MESSAGING.sendMessage({ type: "DELETE", id: item.id });
      pageAnnotationCache.delete(item.id);
      document.querySelectorAll(`[data-lhn-id="${CSS.escape(item.id)}"]`).forEach(n => n.replaceWith(...n.childNodes));
      removeTooltip();
    });
    deleteButton.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${CONFIG.ACTION_ICON_PATHS.trash}</svg>`;
    deleteButton.setAttribute("aria-label", t("deleteNote")); deleteButton.title = t("deleteNote");
    editButton.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${CONFIG.ACTION_ICON_PATHS.edit}</svg>`;
    const speakButton = makeButton("", "secondary lhn-icon-btn lhn-speak-btn", speakHighlight);
    speakButton.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${CONFIG.ACTION_ICON_PATHS.volume}</svg>`;
    speakButton.setAttribute("aria-label", t("speakHighlightTooltip")); speakButton.title = t("speakHighlightTooltip");
    actionGroup.append(editButton, deleteButton, speakButton);
    row.append(colorGroup, actionGroup);
    heading.append(note, hoverSpeakButton);
    tooltip.append(heading);
    tooltipActionRow = row;
    tooltip.addEventListener("mouseenter", () => clearTimer("dismiss")); tooltip.addEventListener("mouseleave", scheduleTooltipClose);
    tooltip.addEventListener("mousedown", e => e.stopPropagation()); tooltip.addEventListener("click", e => e.stopPropagation());
    document.documentElement.appendChild(tooltip);
    for (const [property, value] of Object.entries({ position:"fixed", display:"flex", visibility:"visible", opacity:"1", transform:"none", pointerEvents:"auto", zIndex:"2147483647", padding:"var(--lhn-popup-padding)", boxShadow:"var(--lhn-popup-shadow)" })) tooltip.style.setProperty(property.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`), value, "important");
    updateDefaultColorIndicators();
    requestAnimationFrame(() => { if (tooltip) { tooltip.classList.add("lhn-visible"); positionPopupAtAnchor(tooltip, anchor); } });
  }
  function showHighlightActions(anchor, item, clickX) {
    if (!websiteSettingsReady || websiteDisabled) return;
    if (actionPopup?.dataset.itemId === item.id) { actionPopup.remove(); actionPopup = null; return; }
    if (!tooltip || hoveredMark !== anchor || tooltip.dataset.itemId !== item.id) showNote(anchor, item);
    if (!tooltipActionRow) return;
    actionPopup?.remove();
    actionPopup = document.createElement("div"); actionPopup.id = "lhn-highlight-actions"; actionPopup.dataset.itemId = item.id;
    actionPopup.classList.toggle("lhn-ui-dark", isSidebarDark()); actionPopup.classList.toggle("lhn-ui-light", !isSidebarDark());
    actionPopup.appendChild(tooltipActionRow);
    actionPopup.addEventListener("mouseenter", () => clearTimer("dismiss"));
    actionPopup.addEventListener("mouseleave", scheduleTooltipClose);
    actionPopup.addEventListener("mousedown", e => e.stopPropagation()); actionPopup.addEventListener("click", e => e.stopPropagation());
    document.documentElement.appendChild(actionPopup);
    updateDefaultColorIndicators();
    const r = anchor.getBoundingClientRect();
    requestAnimationFrame(() => { if (actionPopup) position(actionPopup, Number.isFinite(clickX) ? clickX - actionPopup.offsetWidth / 2 : r.left, r.top - actionPopup.offsetHeight - 7); });
  }
  function getInlineStyle(el, prop) {
    return { value: el.style.getPropertyValue(prop), priority: el.style.getPropertyPriority(prop) };
  }
  function restoreInlineStyle(el, prop, saved) {
    if (!saved || !el) return;
    if (saved.value) el.style.setProperty(prop, saved.value, saved.priority);
    else el.style.removeProperty(prop);
  }
  function applyPageShrink(width) {
    const root = document.documentElement, body = document.body;
    if (!pageLayoutSnapshot) pageLayoutSnapshot = {
      rootWidth: getInlineStyle(root, "width"), rootMaxWidth: getInlineStyle(root, "max-width"), rootBoxSizing: getInlineStyle(root, "box-sizing"),
      rootMarginLeft: getInlineStyle(root, "margin-left"), rootMarginRight: getInlineStyle(root, "margin-right"), rootOverflowX: getInlineStyle(root, "overflow-x"),
      bodyWidth: body ? getInlineStyle(body, "width") : null, bodyMinWidth: body ? getInlineStyle(body, "min-width") : null,
      bodyMarginLeft: body ? getInlineStyle(body, "margin-left") : null, bodyMaxWidth: body ? getInlineStyle(body, "max-width") : null, bodyMarginRight: body ? getInlineStyle(body, "margin-right") : null,
      bodyOverflowX: body ? getInlineStyle(body, "overflow-x") : null
    };
    // Reduce the actual layout viewport, rather than merely adding a margin.
    // This leaves a dedicated strip for the fixed sidebar and prevents it from
    // covering the page's main content on responsive layouts.
    root.style.setProperty("box-sizing", "border-box", "important");
    // Keep the root viewport full-size so the fixed sidebar itself is never
    // clipped. Narrow the body (the page layout container) instead.
    root.style.setProperty("width", "100%", "important");
    root.style.setProperty("max-width", "100%", "important");
    root.style.setProperty("margin-left", "0", "important");
    root.style.setProperty("margin-right", "0", "important");
    root.style.setProperty("overflow-x", "visible", "important");
    if (body) {
      body.style.setProperty("box-sizing", "border-box", "important");
      body.style.setProperty("width", `calc(100vw - ${width}px)`, "important");
      body.style.setProperty("min-width", "0", "important");
      body.style.setProperty("margin-left", "0", "important");
      body.style.setProperty("margin-right", "0", "important");
      body.style.setProperty("max-width", `calc(100vw - ${width}px)`, "important");
      body.style.setProperty("overflow-x", "hidden", "important");
    }
  }
  function restorePageWidth() {
    if (!pageLayoutSnapshot) return;
    const snap = pageLayoutSnapshot; pageLayoutSnapshot = null;
    restoreInlineStyle(document.documentElement, "width", snap.rootWidth);
    restoreInlineStyle(document.documentElement, "max-width", snap.rootMaxWidth);
    restoreInlineStyle(document.documentElement, "box-sizing", snap.rootBoxSizing);
    restoreInlineStyle(document.documentElement, "margin-left", snap.rootMarginLeft);
    restoreInlineStyle(document.documentElement, "margin-right", snap.rootMarginRight);
    restoreInlineStyle(document.documentElement, "overflow-x", snap.rootOverflowX);
    if (document.body) {
      restoreInlineStyle(document.body, "width", snap.bodyWidth);
      restoreInlineStyle(document.body, "min-width", snap.bodyMinWidth);
      restoreInlineStyle(document.body, "margin-left", snap.bodyMarginLeft);
      restoreInlineStyle(document.body, "max-width", snap.bodyMaxWidth);
      restoreInlineStyle(document.body, "margin-right", snap.bodyMarginRight);
      restoreInlineStyle(document.body, "overflow-x", snap.bodyOverflowX);
    }
  }
  function sidebarButton(label, cls, handler) {
    const b = document.createElement("button"); b.className = "lhn-side-btn" + (cls ? " " + cls : ""); b.textContent = label; b.type = "button"; b.addEventListener("click", handler); return b;
  }
  function renderContextSentence(host, sentence, quote) {
    host.replaceChildren();
    if (!sentence) return;
    const text = String(sentence), selected = String(quote || "");
    let match = null;
    if (selected) { const pattern = selected.trim().split(/\s+/).map(part => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("\\s+"); try { match = new RegExp(pattern).exec(text); } catch { /* render plain text */ } }
    const at = match?.index ?? -1, length = match?.[0].length ?? 0;
    if (at < 0) { host.textContent = text; return; }
    host.append(document.createTextNode(text.slice(0, at)));
    const strong = document.createElement("strong"); strong.textContent = match[0]; host.append(strong);
    host.append(document.createTextNode(text.slice(at + length)));
  }
  function highlightSidebarSearchMatches(root, query) {
    const needle = String(query || "").trim();
    if (!needle) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.parentElement?.closest(".lhn-sidebar-actions, .lhn-search-match")) continue;
      if (node.nodeValue.toLocaleLowerCase().includes(needle.toLocaleLowerCase())) nodes.push(node);
    }
    for (const node of nodes) {
      const text = node.nodeValue, lower = text.toLocaleLowerCase(), search = needle.toLocaleLowerCase();
      const fragment = document.createDocumentFragment(); let from = 0, at;
      while ((at = lower.indexOf(search, from)) !== -1) {
        if (at > from) fragment.appendChild(document.createTextNode(text.slice(from, at)));
        const match = document.createElement("mark"); match.className = "lhn-search-match"; match.textContent = text.slice(at, at + needle.length); fragment.appendChild(match);
        from = at + needle.length;
      }
      if (from === 0) continue;
      if (from < text.length) fragment.appendChild(document.createTextNode(text.slice(from)));
      node.replaceWith(fragment);
    }
  }
  function openSidebarEdit(item) {
    const pageScrollX = window.scrollX, pageScrollY = window.scrollY;
    document.getElementById("lhn-sidebar-edit-dialog")?.remove();
    const dialog = document.createElement("dialog"); dialog.id = "lhn-sidebar-edit-dialog"; syncSidebarTheme();
    const form = document.createElement("form");
    const heading = document.createElement("h2"); heading.dataset.lhnI18n = "composerEdit"; heading.textContent = t("composerEdit");
    const quote = document.createElement("div"); quote.className = "lhn-edit-quote"; quote.textContent = item.quote || "";
    const colors = document.createElement("div"); colors.className = "lhn-edit-colors";
    const toolbar = document.createElement("div"); toolbar.className = "lhn-edit-toolbar";
    let selectedColor = CONFIG.normalizeColor(item.color);
    COLORS.forEach(color => {
      const button = document.createElement("button"); button.type = "button"; button.className = `lhn-edit-color lhn-${color}`; button.style.backgroundColor = COLOR_MAP[color]; button.dataset.color = color; button.setAttribute("aria-label", t(CONFIG.colorLabelKey(color))); button.setAttribute("aria-pressed", String(color === selectedColor));
      button.addEventListener("click", () => { selectedColor = color; colors.querySelectorAll("button").forEach(el => el.setAttribute("aria-pressed", String(el === button))); }); colors.append(button);
    });
    const makeField = (labelText, labelKey, value) => {
      const label = document.createElement("label"); label.className = "lhn-edit-field";
      const caption = document.createElement("span"); caption.dataset.lhnI18n = labelKey; caption.textContent = labelText;
      const wrap = document.createElement("div"); wrap.className = "lhn-edit-input-wrap";
      const icon = document.createElement("span"); icon.className = "lhn-edit-note-icon"; icon.setAttribute("aria-hidden", "true"); icon.innerHTML = `<svg viewBox="0 0 24 24"><path d="M8 3h7l5 5v13H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M15 3v5h5M10 13h6M10 17h6"/></svg>`;
      const textarea = document.createElement("textarea"); textarea.value = value || ""; textarea.rows = 4; wrap.append(icon, textarea); label.append(caption, wrap); return { label, textarea };
    };
    const note1 = makeField(t("noteLabel"), "noteLabel", item.note); note1.textarea.classList.add("lhn-edit-note-primary"); const note2 = makeField(t("sentenceNote"), "sentenceNote", item.contextNote); note2.textarea.classList.add("lhn-edit-note-sentence");
    const tagField = document.createElement("label"); tagField.className = "lhn-edit-field lhn-edit-tags-field";
    const tagCaption = document.createElement("span"); tagCaption.dataset.lhnI18n = "tagsLabel"; tagCaption.textContent = t("tagsLabel");
    const tagEditor = makeTagEditor(item.tags || [], "lhn-edit-tags"); tagField.append(tagCaption, tagEditor.element);
    const parseTags = value => { const seen = new Set(); return String(value || "").split(",").map(tag => tag.trim()).filter(tag => { const key = tag.toLocaleLowerCase(); if (!key || seen.has(key)) return false; seen.add(key); return true; }); };
    const sameTags = (a, b) => {
      const normalize = value => parseTags(Array.isArray(value) ? value.join(",") : value);
      return JSON.stringify(normalize(a)) === JSON.stringify(normalize(b));
    };
    const autoGrow = (field, minHeight) => { field.style.height = `${minHeight}px`; field.style.height = Math.max(minHeight, field.scrollHeight) + "px"; };
    const resizeNote1 = () => autoGrow(note1.textarea, 46); const resizeNote2 = () => autoGrow(note2.textarea, 70);
    note1.textarea.addEventListener("input", resizeNote1); note2.textarea.addEventListener("input", resizeNote2);
    let saving = false;
    const saveEdit = async () => {
      if (saving) return;
      const note = note1.textarea.value.trim(), contextNote = note2.textarea.value.trim(), tags = tagEditor.getTags();
      if (note === String(item.note || "").trim() && contextNote === String(item.contextNote || "").trim() && selectedColor === CONFIG.normalizeColor(item.color) && sameTags(tags, item.tags)) { dialog.close(); return; }
      saving = true;
      try {
        const saved = await LHN_MESSAGING.sendMessage({ type: "UPDATE", item: { ...item, note, contextNote, color: selectedColor, tags } });
        if (saved?.id) pageAnnotationCache.set(saved.id, saved);
        dialog.close(); await renderSidebar(); showSidebarToast(() => t("savedChanges"));
      } finally { saving = false; }
    };
    [note1.textarea, note2.textarea].forEach(textarea => textarea.addEventListener("keydown", event => {
      if (event.key !== "Enter") return;
      event.preventDefault(); event.stopPropagation();
      if (event.ctrlKey || event.metaKey) {
        textarea.setRangeText("\n", textarea.selectionStart, textarea.selectionEnd, "end");
        textarea.dispatchEvent(new Event("input", { bubbles: true }));
      } else saveEdit();
    }));
    const close = document.createElement("button"); close.type = "button"; close.className = "lhn-edit-close"; close.textContent = "×"; close.setAttribute("aria-label", t("cancel")); close.title = t("cancel"); close.addEventListener("click", () => dialog.close());
    toolbar.append(colors, close); form.append(heading, quote, toolbar, note1.label, note2.label, tagField); dialog.append(form);
    form.addEventListener("submit", event => { event.preventDefault(); saveEdit(); });
    dialog.addEventListener("click", event => { if (event.target === dialog) saveEdit(); });
    dialog.addEventListener("cancel", event => { event.preventDefault(); dialog.close(); });
    dialog.addEventListener("close", () => dialog.remove()); document.documentElement.append(dialog); syncSidebarTheme(); dialog.showModal(); resizeNote1(); resizeNote2(); note1.textarea.focus({ preventScroll: true });
    const restorePageScroll = () => window.scrollTo(pageScrollX, pageScrollY);
    restorePageScroll(); requestAnimationFrame(() => { restorePageScroll(); requestAnimationFrame(restorePageScroll); });
  }
  function syncSidebarSettingsButtons() {
    sidebarHeaderActions?.querySelectorAll("button[data-setting]").forEach(button => {
      const key = button.dataset.setting;
      const enabled = settings[key] !== false;
      button.classList.toggle("is-on", enabled); button.setAttribute("aria-pressed", String(enabled));
      button.dataset.tooltip = t(button.dataset.labelKey); button.removeAttribute("title"); button.setAttribute("aria-label", button.dataset.tooltip);
    });
    const siteButton = sidebarHeaderActions?.querySelector("button[data-site-toggle]");
    if (siteButton) {
      const labelKey = websiteDisabled ? "enableWebsite" : "disableWebsite";
      siteButton.dataset.tooltip = t(labelKey); siteButton.removeAttribute("title"); siteButton.setAttribute("aria-label", siteButton.dataset.tooltip);
      siteButton.classList.toggle("is-on", !websiteDisabled); siteButton.setAttribute("aria-pressed", String(!websiteDisabled));
    }
  }
  function isSidebarDark() {
    if (settings.sidebarTheme === "dark") return true;
    if (settings.sidebarTheme === "light") return false;
    const root = document.documentElement;
    if (root.classList.contains("dark") || root.dataset.theme === "dark" || root.dataset.colorScheme === "dark") return true;
    if (root.classList.contains("light")) return false;
    return !!window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  }
  function isDictionaryDark() {
    if (settings.sidebarTheme === "dark") return true;
    if (settings.sidebarTheme === "light") return false;
    return !!window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  }
  function syncSidebarTheme() {
    const dark = isSidebarDark();
    dictionaryPopup?.classList.toggle("lhn-dict-dark", isDictionaryDark());
    [panel, tooltip, actionPopup, translationPopup, document.getElementById("lhn-sidebar-edit-dialog")].forEach(surface => {
      if (!surface) return;
      surface.classList.toggle("lhn-ui-dark", dark);
      surface.classList.toggle("lhn-ui-light", !dark);
    });
    if (!sidebar) return;
    sidebar.classList.toggle("lhn-theme-dark", dark);
    sidebar.classList.toggle("lhn-theme-light", !dark);
    const button = sidebarHeaderActions?.querySelector("button[data-theme-toggle]");
    if (!button) return;
    const label = t(dark ? "sidebarSwitchToLight" : "sidebarSwitchToDark");
    const icon = dark
      ? '<path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.804a6.5 6.5 0 0 0 8.268 8.268c.344-.215.826-.003.803.4"/>'
      : '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/>';
    button.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${icon}</svg>`;
    button.dataset.tooltip = label;
    button.setAttribute("aria-label", label);
    button.setAttribute("aria-pressed", String(dark));
    button.classList.toggle("is-on", dark);
  }
  async function toggleSidebarTheme() {
    const previous = settings;
    settings = { ...settings, sidebarTheme: isSidebarDark() ? "light" : "dark" };
    syncSidebarTheme();
    try { await browser.storage.local.set({ [CONFIG.STORAGE_KEYS.SETTINGS]: settings }); }
    catch (error) { settings = previous; syncSidebarTheme(); console.warn("Could not save sidebar theme", error); }
  }
  function syncSidebarFooter() {
    const button = sidebar?.querySelector(".lhn-sidebar-footer-toggle");
    if (!button) return;
    const enabled = !websiteDisabled;
    const actionLabel = t(websiteDisabled ? "enableWebsite" : "disableWebsite");
    const icon = websiteDisabled
      ? '<circle cx="12" cy="12" r="9"/><path d="m4.9 4.9 14.2 14.2"/>'
      : '<circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/>';
    button.classList.toggle("is-enabled", enabled);
    button.classList.toggle("is-disabled", websiteDisabled);
    button.setAttribute("aria-pressed", String(enabled));
    button.setAttribute("aria-label", `${actionLabel}: ${displayWebsiteName(websiteKey())}`);
    button.title = actionLabel;
    button.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${icon}</svg>`;
    const name = document.createElement("span");
    name.textContent = displayWebsiteName(websiteKey());
    button.append(name);
  }
  function refreshTagEditorTranslations(root) {
    root?.querySelectorAll(".lhn-tag-editor input").forEach(input => { input.placeholder = t("tagsPlaceholder"); input.setAttribute("aria-label", t("tagsLabel")); });
    root?.querySelectorAll(".lhn-tag-chip").forEach(chip => { const remove = chip.querySelector("button"); if (remove) remove.setAttribute("aria-label", `${t("delete")}: ${chip.firstChild?.textContent || ""}`); });
  }
  function refreshColorTranslations(root) {
    root?.querySelectorAll(".lhn-color, .lhn-tooltip-color, .lhn-edit-color").forEach(button => { const color = button.dataset.color; if (!color) return; const label = t(CONFIG.colorLabelKey(color)); button.title = label; button.setAttribute("aria-label", label); });
    root?.querySelectorAll(".lhn-color-default-star").forEach(button => { const color = button.closest(".lhn-color-option")?.dataset.color; if (!color) return; const label = `${t("setDefaultColor")}: ${t(CONFIG.colorLabelKey(color))}`; button.title = label; button.setAttribute("aria-label", label); });
  }
  function refreshLocalizedUI(refreshSidebar = true) {
    if (panel) {
      const textarea = panel.querySelector("textarea");
      if (textarea) { textarea.placeholder = t("notePlaceholder"); textarea.setAttribute("aria-label", t("noteAria")); }
      const caption = panel.querySelector(".lhn-composer-tags-field > span"); if (caption) caption.textContent = t("tagsLabel");
      const close = panel.querySelector(".lhn-close-btn"); if (close) { close.title = t("cancel"); close.setAttribute("aria-label", t("cancel")); }
      refreshTagEditorTranslations(panel); refreshColorTranslations(panel);
    }
    if (tooltip) {
      const emptyNote = tooltip.querySelector(".lhn-tooltip-note[data-empty-note=\"true\"]"); if (emptyNote) emptyNote.textContent = t("noNote");
      const edit = tooltip.querySelector(".lhn-tooltip-icon-actions .lhn-icon-btn:not(.lhn-trash-btn):not(.lhn-speak-btn)"); if (edit) { edit.title = t("editNote"); edit.setAttribute("aria-label", t("editNote")); }
      const remove = tooltip.querySelector(".lhn-trash-btn"); if (remove) { remove.title = t("deleteNote"); remove.setAttribute("aria-label", t("deleteNote")); }
      const speak = tooltip.querySelector(".lhn-speak-btn"); if (speak) { speak.title = t("speakHighlightTooltip"); speak.setAttribute("aria-label", t("speakHighlightTooltip")); }
      refreshColorTranslations(tooltip);
    }
    const editDialog = document.getElementById("lhn-sidebar-edit-dialog");
    if (editDialog) {
      editDialog.querySelectorAll("[data-lhn-i18n]").forEach(node => { node.textContent = t(node.dataset.lhnI18n); });
      const close = editDialog.querySelector(".lhn-edit-close"); if (close) { close.title = t("cancel"); close.setAttribute("aria-label", t("cancel")); }
      refreshTagEditorTranslations(editDialog); refreshColorTranslations(editDialog);
    }
    const toast = document.getElementById("lhn-sidebar-toast");
    if (toast?.classList.contains("is-visible") && sidebarToastRender) toast.textContent = sidebarToastRender();
    syncSidebarEdgeToggle();
    syncSidebarFooter();
    if (refreshSidebar && sidebarOpen) openSidebar(true);
  }
  async function applyWebsiteDisabledState(disabled) {
    if (websiteDisabled === disabled) return;
    websiteDisabled = disabled;
    syncSidebarEdgeToggle();
    syncSidebarFooter();
    if (disabled) {
      document.dispatchEvent(new CustomEvent("lhn-website-disabled-change", { detail:true }));
      removeComposer(); removeTooltip(); selectedRange = null; document.getElementById("lhn-sidebar-edit-dialog")?.remove();
      if (restoreDebounce) { clearTimeout(restoreDebounce); restoreDebounce = 0; }
      restoreObserver?.disconnect(); restoreObserver = null;
      document.querySelectorAll(".lhn-mark").forEach(mark => mark.replaceWith(...mark.childNodes));
      if (sidebarOpen) closeSidebar();
    } else {
      document.dispatchEvent(new CustomEvent("lhn-website-disabled-change", { detail:false }));
      startRestoreObserver(); scheduleRestore(150);
      if (sidebarOpen) openSidebar(true);
    }
    syncSidebarSettingsButtons();
  }
  async function toggleWebsiteDisabled() {
    const disabledWebsites = new Set(Array.isArray(settings.disabledWebsites) ? settings.disabledWebsites : []);
    const host = websiteKey(), disable = !disabledWebsites.has(host);
    if (disable) disabledWebsites.add(host); else disabledWebsites.delete(host);
    const updated = { ...settings, disabledWebsites: [...disabledWebsites] };
    try {
      await browser.storage.local.set({ [CONFIG.STORAGE_KEYS.SETTINGS]: updated });
      settings = updated;
      await applyWebsiteDisabledState(disable);
      showSidebarToast(() => t(disable ? "websiteDisabledToast" : "websiteEnabledToast"));
    } catch (error) { console.warn("Could not update website setting", error); }
  }
  async function toggleSidebarSetting(key) {
    const previous = settings; settings = { ...settings, [key]: settings[key] === false };
    syncSidebarSettingsButtons();
    try {
      await browser.storage.local.set({ [CONFIG.STORAGE_KEYS.SETTINGS]: settings });
      const labelKey = { showOnSelect: "autoPopup", sentenceNoteEnabled: "autoSentenceNote" }[key];
      showSidebarToast(() => `${t(labelKey)}: ${t(settings[key] ? "settingEnabled" : "settingDisabled")}`);
    }
    catch (error) { settings = previous; syncSidebarSettingsButtons(); console.warn("Could not save sidebar setting", error); }
  }
  function showSidebarToast(message) {
    let toast = document.getElementById("lhn-sidebar-toast");
    if (!toast) { toast = document.createElement("div"); toast.id = "lhn-sidebar-toast"; toast.setAttribute("role", "status"); document.documentElement.appendChild(toast); }
    sidebarToastRender = typeof message === "function" ? message : () => message;
    const renderToast = sidebarToastRender;
    toast.textContent = renderToast();
    toast.classList.add("is-visible");
    clearTimeout(sidebarToastTimer);
    sidebarToastTimer = setTimeout(() => { toast.classList.remove("is-visible"); sidebarToastTimer = setTimeout(() => { if (sidebarToastRender === renderToast) sidebarToastRender = null; toast.remove(); }, 220); }, 1800);
  }
  document.addEventListener("lhn-browser-voice-unavailable", () => showSidebarToast("Trình duyệt bạn không hỗ trợ ngôn ngữ này"));
  function syncSidebarEdgeToggle() {
    if (!sidebarEdgeToggle) {
      sidebarEdgeToggle = document.createElement("button"); sidebarEdgeToggle.id = "lhn-sidebar-edge-toggle"; sidebarEdgeToggle.type = "button";
      sidebarEdgeToggle.addEventListener("mousedown", event => { event.preventDefault(); event.stopPropagation(); });
      sidebarEdgeToggle.addEventListener("click", event => { event.preventDefault(); event.stopPropagation(); toggleSidebar(); });
      document.documentElement.appendChild(sidebarEdgeToggle);
    }
    const shortcut = settings.sidebarShortcut ?? "Alt+Q";
    const label = shortcut ? `${t("toggleSidebar")} (${shortcut})` : t("toggleSidebar");
    sidebarEdgeToggle.removeAttribute("title"); sidebarEdgeToggle.setAttribute("aria-label", label); sidebarEdgeToggle.setAttribute("aria-expanded", String(sidebarOpen));
    sidebarEdgeToggle.dataset.tooltip = label;
    sidebarEdgeToggle.classList.toggle("is-open", sidebarOpen);
    sidebarEdgeToggle.classList.toggle("is-site-disabled", websiteDisabled);
    sidebarEdgeToggle.classList.toggle("lhn-hidden-by-setting", settings.sidebarIndicatorEnabled === false || (websiteDisabled && settings.sidebarIndicatorOnDisabledSites === false));
    const width = sidebarOpen ? (Number.parseFloat(sidebar?.style.width) || 0) : 0;
    sidebarEdgeToggle.style.right = `${width}px`;
    const path = sidebarOpen ? "M9 18l6-6-6-6" : "M15 18l-6-6 6-6";
    sidebarEdgeToggle.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"/></svg>`;
  }
  function toggleSidebar() { if (sidebarOpen) closeSidebar(); else openSidebar(); }
  function closeSidebar() {
    clearTimeout(sidebarSearchTimer); sidebarSearchTimer = 0;
    sidebarOpen = false;
    if (sidebar) { const old = sidebar; sidebar = null; animateRemove(old); }
    restorePageWidth();
    syncSidebarEdgeToggle();
  }
  async function openSidebar(rebuild = false) {
    clearTimeout(sidebarSearchTimer); sidebarSearchTimer = 0;
    await loadSettings();
    if (sidebarOpen && !rebuild) { await renderSidebar(); return; }
    const previousSidebar = sidebarOpen && rebuild ? sidebar : null;
    if (!sidebarOpen) sidebarOpen = true;
    const width = previousSidebar ? (Number.parseFloat(previousSidebar.style.width) || Math.min(400, Math.max(280, Math.floor(innerWidth * 0.32)))) : Math.min(400, Math.max(280, Math.floor(innerWidth * 0.32)));
    // Reserve space for the sidebar by narrowing the page content area.
    applyPageShrink(width);
    sidebar = document.createElement("aside"); sidebar.id = "lhn-sidebar"; sidebar.style.width = width + "px";
    const top = document.createElement("div"); top.className = "lhn-sidebar-top";
    const brand = document.createElement("div"); brand.className = "lhn-sidebar-brand";
    const logo = document.createElement("img"); logo.src = browser.runtime.getURL("icons/icon.svg"); logo.alt = "";
    const brandCopy = document.createElement("div"); brandCopy.className = "lhn-sidebar-brandcopy";
    const brandName = document.createElement("span"); brandName.className = "lhn-sidebar-brandname"; brandName.textContent = "Keepit - Highlight Notes";
    const freeLabel = document.createElement("span"); freeLabel.className = "lhn-sidebar-plan menu-item item-free"; freeLabel.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3zm0 2.18l6 2.25v4.57c0 4.54-3.2 8.91-6 10.08-2.8-1.17-6-5.54-6-10.08V6.43l6-2.25z" fill="currentColor"/></svg>';
    const freeText = document.createElement("span"); freeText.textContent = t("freePlan"); freeLabel.append(freeText); freeLabel.setAttribute("aria-label", t("freePlan"));
    brandCopy.append(brandName, freeLabel); brand.append(logo, brandCopy);
    const brandRow = document.createElement("div"); brandRow.className = "lhn-sidebar-brandrow";
    const headerActions = document.createElement("div"); headerActions.className = "lhn-sidebar-header-actions"; sidebarHeaderActions = headerActions;
    const addHeaderIcon = (labelKey, icon, setting = "", handler = null) => {
      const button = document.createElement("button"); button.type = "button"; button.className = "lhn-header-icon"; button.dataset.labelKey = labelKey; button.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${icon}</svg>`;
      if (setting) { button.dataset.setting = setting; button.addEventListener("click", () => toggleSidebarSetting(setting)); }
      else if (handler) { button.dataset.siteToggle = "true"; button.addEventListener("click", handler); }
      else button.addEventListener("click", () => LHN_MESSAGING.sendMessage({ type: "OPEN_DASHBOARD" }).catch(error => console.warn("Could not open dashboard", error)));
      button.dataset.tooltip = t(labelKey); button.setAttribute("aria-label", t(labelKey)); headerActions.append(button);
      return button;
    };
    const themeButton = document.createElement("button"); themeButton.type = "button"; themeButton.className = "lhn-header-icon lhn-theme-toggle"; themeButton.dataset.themeToggle = "true"; themeButton.addEventListener("click", toggleSidebarTheme); headerActions.append(themeButton);
    if (websiteDisabled) {
      addHeaderIcon("enableWebsite", `<circle cx="12" cy="12" r="9"/><path d="m4.9 4.9 14.2 14.2"/>`, "", toggleWebsiteDisabled);
    } else {
      addHeaderIcon("openDashboard", `<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>`);
      addHeaderIcon("autoPopup", `<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>`, "showOnSelect");
      addHeaderIcon("autoSentenceNote", `<path d="M2 11.5V5a2 2 0 0 1 2-2h3.9c.7 0 1.3.3 1.7.9l.8 1.2c.4.6 1 .9 1.7.9H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-9.5"/><path d="M11.378 13.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"/>`, "sentenceNoteEnabled");
      addHeaderIcon("disableWebsite", `<circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/>`, "", toggleWebsiteDisabled);
    }
    brandRow.append(brand, headerActions); syncSidebarSettingsButtons(); syncSidebarTheme();
    const title = document.createElement("div"); title.className = "lhn-sidebar-title"; title.textContent = pageTitle();
    const url = document.createElement("a"); url.className = "lhn-sidebar-url"; url.href = pageUrl(); url.target = "_blank"; url.rel = "noopener noreferrer"; url.textContent = pageUrl(); url.title = pageUrl();
   const headerCard = document.createElement("div"); headerCard.className = "lhn-sidebar-header-card";
    headerCard.append(brandRow, title, url);
    const searchWrap = document.createElement("label"); searchWrap.className = "lhn-sidebar-search-wrap";
    const searchIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg"); searchIcon.setAttribute("viewBox", "0 0 24 24"); searchIcon.setAttribute("aria-hidden", "true"); searchIcon.classList.add("lhn-sidebar-search-icon");
    const searchCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle"); searchCircle.setAttribute("cx", "11"); searchCircle.setAttribute("cy", "11"); searchCircle.setAttribute("r", "7");
    const searchHandle = document.createElementNS("http://www.w3.org/2000/svg", "path"); searchHandle.setAttribute("d", "m20 20-4-4"); searchIcon.append(searchCircle, searchHandle);
    const search = document.createElement("input"); search.type = "search"; search.className = "lhn-sidebar-search"; search.placeholder = t("sidebarSearchPlaceholder"); search.setAttribute("aria-label", t("sidebarSearchPlaceholder")); search.value = sidebarSearchQuery;
    searchWrap.append(searchIcon, search);
    search.addEventListener("input", () => {
      sidebarSearchQuery = search.value;
      clearTimeout(sidebarSearchTimer);
      sidebarSearchTimer = setTimeout(() => { sidebarSearchTimer = 0; renderSidebar(true); }, CONFIG.TIMINGS.DASHBOARD_SEARCH_DEBOUNCE_MS);
    });
    const filters = document.createElement("div"); filters.className = "lhn-sidebar-filters"; filters.setAttribute("aria-label", t("filterColor"));
    const filterOptions = [{ id: "all", label: t("all") }, ...COLORS.map(color => ({ id: color, label: t(CONFIG.colorLabelKey(color)) }))];
    filterOptions.forEach(option => {
      const btn = sidebarButton("0", "lhn-side-filter" + (sidebarFilter === option.id ? " is-active" : ""), () => {
        sidebarFilter = option.id;
        filters.querySelectorAll(".lhn-side-filter").forEach(el => el.classList.toggle("is-active", el.dataset.filter === sidebarFilter));
        renderSidebar(true);
      });
      btn.dataset.filter = option.id;
      btn.dataset.filterLabel = option.label;
      if (option.id !== "all") { const swatch = document.createElement("span"); swatch.className = `lhn-filter-swatch lhn-swatch-${option.id}`; btn.prepend(swatch); }
      filters.appendChild(btn);
    });
    headerCard.append(searchWrap, filters);
    if (websiteDisabled) {
      const disabledMessage = document.createElement("div"); disabledMessage.className = "lhn-site-disabled-message"; disabledMessage.textContent = t("websiteDisabledMessage");
      headerCard.replaceChildren(brandRow, disabledMessage);
      top.append(headerCard);
    } else top.append(headerCard);
    const list = document.createElement("div"); list.className = "lhn-sidebar-list"; list.id = "lhn-sidebar-list";
    const footer = document.createElement("div"); footer.className = "lhn-sidebar-footer"; const footerToggle = document.createElement("button"); footerToggle.type = "button"; footerToggle.className = "lhn-sidebar-footer-toggle"; footerToggle.addEventListener("click", event => { event.preventDefault(); event.stopPropagation(); toggleWebsiteDisabled(); }); const footerVersion = document.createElement("span"); footerVersion.className = "lhn-sidebar-footer-version"; footerVersion.textContent = `v${browser.runtime.getManifest().version}`; footer.append(footerToggle, footerVersion);
    sidebar.append(top, list, footer);
    sidebar.addEventListener("mousedown", e => e.stopPropagation());
    sidebar.addEventListener("click", e => e.stopPropagation());
    // Keep the fixed sidebar outside the narrowed body so body overflow rules on
    // sites such as GitHub cannot clip the extension UI.
    if (previousSidebar) {
      previousSidebar.replaceWith(sidebar);
      sidebar.classList.add("lhn-side-visible");
    } else {
      document.documentElement.appendChild(sidebar);
      requestAnimationFrame(() => sidebar?.classList.add("lhn-side-visible"));
    }
    syncSidebarFooter();
    syncSidebarEdgeToggle();
    await renderSidebar();
  }
  function sidebarSearchFields(item) {
    let fields = sidebarSearchMetadata.get(item);
    if (fields) return fields;
    const tags = Array.isArray(item.tags) ? item.tags.join(" ") : String(item.tags || "");
    fields = {
      quote: String(item.quote || "").toLocaleLowerCase(),
      note: String(item.note || "").toLocaleLowerCase(),
      contextNote: String(item.contextNote || "").toLocaleLowerCase(),
      tags: tags.toLocaleLowerCase()
    };
    sidebarSearchMetadata.set(item, fields);
    return fields;
  }
  async function renderSidebar(useCachedItems = false) {
    if (!sidebarOpen || !sidebar || websiteDisabled) return;
    const renderToken = ++sidebarRenderToken;
    let items = [];
    if (useCachedItems && Array.isArray(sidebarItemsCache)) items = sidebarItemsCache.slice();
    else {
      try { items = await LHN_MESSAGING.sendMessage({ type: "GET_PAGE", url: pageUrl() }); } catch { /* extension context may be reloading */ }
    }
    if (!sidebarOpen || !sidebar || renderToken !== sidebarRenderToken) return;
    const current = items.filter(item => item.url === pageUrl());
    cachePageAnnotations(pageUrl(), current);
    if (!(useCachedItems && Array.isArray(sidebarItemsCache))) {
      // Measure each rendered mark once; layout reads inside a sort comparator
      // would force repeated style calculations for large pages.
      const markPositions = new Map();
      document.querySelectorAll("[data-lhn-id]").forEach((mark, domIndex) => {
        const id = mark.dataset.lhnId;
        if (id && !markPositions.has(id)) markPositions.set(id, { top: mark.getBoundingClientRect().top, domIndex });
      });
      current.sort((a, b) => {
        const posA = markPositions.get(a.id), posB = markPositions.get(b.id);
        if (posA && posB) return Math.abs(posA.top - posB.top) > 1 ? posA.top - posB.top : posA.domIndex - posB.domIndex;
        if (posA) return -1;
        if (posB) return 1;
        return (a.createdAt || 0) - (b.createdAt || 0);
      });
      sidebarItemsCache = current.slice();
      // Page order is persisted for later restoration, but it must not delay the
      // first paint of sidebar cards.
      LHN_MESSAGING.sendMessage({ type: "SYNC_PAGE_ORDER", url: pageUrl(), ids: current.map(item => item.id) }).catch(() => {});
    }
    if (!sidebarOpen || !sidebar || renderToken !== sidebarRenderToken) return;
    const counts = Object.fromEntries(COLORS.map(color => [color, 0]));
    current.forEach(item => { const color = CONFIG.normalizeColor(item.color); if (Object.hasOwn(counts, color)) counts[color]++; });
    sidebar.querySelectorAll(".lhn-side-filter").forEach(button => {
      const id = button.dataset.filter, count = id === "all" ? current.length : (counts[id] || 0);
      const label = button.dataset.filterLabel || t(CONFIG.colorLabelKey(id));
      button.title = t("colorFilterTooltip", { color: label, count });
      button.setAttribute("aria-label", button.title);
      const swatch = button.querySelector(".lhn-filter-swatch");
      const buttonText = id === "all" ? `${label}: ${count}` : String(count);
      button.replaceChildren(...(swatch ? [swatch, document.createTextNode(buttonText)] : [document.createTextNode(buttonText)]));
    });
    const query = sidebarSearchQuery.trim().toLocaleLowerCase();
    const visible = current.filter(item => {
      if (sidebarFilter !== "all" && CONFIG.normalizeColor(item.color) !== sidebarFilter) return false;
      if (!query) return true;
      const fields = sidebarSearchFields(item);
      return [fields.quote, fields.note, fields.contextNote, fields.tags].some(value => value.includes(query));
    });
    if (query) {
      const rank = item => {
        const fields = sidebarSearchFields(item);
        if (fields.quote.includes(query)) return 0;
        if (fields.note.includes(query)) return 1;
        if (fields.contextNote.includes(query)) return 2;
        return 3;
      };
      visible.sort((a, b) => rank(a) - rank(b));
    }
   const list = sidebar.querySelector("#lhn-sidebar-list");
    if (!list) return;
   list.replaceChildren();
    if (!visible.length) {
      const empty = document.createElement("div"); empty.className = "lhn-sidebar-empty";
      empty.textContent = query ? t("noSidebarSearchResults") : current.length ? t("noColorHighlights") : t("noHighlights");
      list.appendChild(empty); return;
    }
    let cardBatch = document.createDocumentFragment();
    for (let itemIndex = 0; itemIndex < visible.length; itemIndex++) {
      if (itemIndex && itemIndex % CONFIG.LIMITS.SIDEBAR_RENDER_CHUNK_SIZE === 0) {
        list.appendChild(cardBatch);
        cardBatch = document.createDocumentFragment();
        await new Promise(resolve => requestAnimationFrame(resolve));
        if (!sidebarOpen || !sidebar || renderToken !== sidebarRenderToken) return;
      }
      const item = visible[itemIndex];
      const color = CONFIG.normalizeColor(item.color);
      const card = document.createElement("article"); card.className = "lhn-sidebar-card";
      const quoteRow = document.createElement("div"); quoteRow.className = "lhn-sidebar-quote-row";
      const swatch = document.createElement("span"); swatch.className = `lhn-sidebar-swatch lhn-swatch-${color}`; swatch.title = t("colorHighlight", { color: t(CONFIG.colorLabelKey(color)) }); swatch.setAttribute("aria-label", swatch.title);
      const quote = document.createElement("div"); quote.className = "lhn-sidebar-quote"; quote.textContent = item.quote;
      quote.tabIndex = 0; quote.setAttribute("role", "button"); quote.title = t("jumpHighlight");
      const locate = async () => {
        let mark = document.querySelector(`[data-lhn-id="${CSS.escape(item.id)}"]`);
        if (!mark) { await restoreAnnotations(); mark = document.querySelector(`[data-lhn-id="${CSS.escape(item.id)}"]`); }
        if (mark) { mark.scrollIntoView({ behavior: "smooth", block: "center" }); mark.classList.add("lhn-sidebar-target"); setTimeout(() => mark?.classList.remove("lhn-sidebar-target"), 1400); }
      };
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.title = t("jumpHighlight");
      card.addEventListener("click", locate);
      card.addEventListener("keydown", e => {
        if ((e.key === "Enter" || e.key === " ") && e.target === card) { e.preventDefault(); locate(); }
      });
      quoteRow.append(swatch, quote);
      const note = document.createElement("div"); note.className = "lhn-sidebar-note"; note.textContent = item.note || t("noNote");
      const contextNote = document.createElement("div"); contextNote.className = "lhn-sidebar-context-note";
      renderContextSentence(contextNote, item.contextNote, item.quote);
      const actions = document.createElement("div"); actions.className = "lhn-sidebar-actions";
      actions.addEventListener("click", e => e.stopPropagation());
      const editBtn = sidebarButton("", "lhn-side-secondary", () => openSidebarEdit(item));
      editBtn.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${CONFIG.ACTION_ICON_PATHS.edit}</svg>`;
      editBtn.title = t("editNote"); editBtn.setAttribute("aria-label", t("editNote"));
      const deleteBtn = sidebarButton("", "lhn-side-secondary", async () => {
        await LHN_MESSAGING.sendMessage({ type: "DELETE", id: item.id });
        pageAnnotationCache.delete(item.id);
        document.querySelectorAll(`[data-lhn-id="${CSS.escape(item.id)}"]`).forEach(mark => mark.replaceWith(...mark.childNodes));
        await renderSidebar();
      });
      deleteBtn.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${CONFIG.ACTION_ICON_PATHS.trash}</svg>`;
      deleteBtn.title = t("deleteNote"); deleteBtn.setAttribute("aria-label", t("deleteNote"));
      const speakBtn = sidebarButton("", "lhn-side-secondary lhn-speak-btn", () => { try { const text = String(item.quote || "").trim(); if (!text) return; card.classList.add("lhn-reading-text"); speakHighlightedText(text, speechLanguageForText(text, null), () => card.classList.remove("lhn-reading-text")); } catch (error) { card.classList.remove("lhn-reading-text"); console.warn("Highlight speech playback failed", error); } });
      speakBtn.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${CONFIG.ACTION_ICON_PATHS.volume}</svg>`;
      speakBtn.title = t("speakHighlightTooltip"); speakBtn.setAttribute("aria-label", speakBtn.title);
      actions.append(editBtn, deleteBtn, speakBtn);
      if (item.contextNote) card.append(quoteRow, note, contextNote, actions);
      else card.append(quoteRow, note, actions);
      highlightSidebarSearchMatches(card, sidebarSearchQuery);
      cardBatch.appendChild(card);
    }
    list.appendChild(cardBatch);
  }

  function isEditable(node) { const el = node?.nodeType === 1 ? node : node?.parentElement; return !!el?.closest("input,textarea,select,[contenteditable]:not([contenteditable='false']),[role='textbox']"); }

  document.addEventListener("mouseup", e => {
    if (!websiteSettingsReady || websiteDisabled) return;
    if (suppressMouseUp) { suppressMouseUp = false; return; }
    if (outsideMouseDown?.dismissTranslateIcon && Math.abs(e.clientX - outsideMouseDown.x) < 5 && Math.abs(e.clientY - outsideMouseDown.y) < 5) return;
    const selection = getSelection(), selectionAnchor = selection?.anchorNode?.nodeType === Node.ELEMENT_NODE ? selection.anchorNode : selection?.anchorNode?.parentElement;
    if (e.button !== 0 || e.target.closest?.("#lhn-panel, #lhn-note-pop, #lhn-direct-translation, #lhn-full-english-dictionary, #lhn-translate-icon, #lhn-sidebar, #lhn-sidebar-edit-dialog, .lhn-mark") || selectionAnchor?.closest?.("#lhn-sidebar, #lhn-sidebar-edit-dialog")) return;
    setTimeout(() => {
      const sel = getSelection(), text = cleanText(sel?.toString());
      if (!text || !sel.rangeCount || isEditable(sel.anchorNode)) return;
      const range = sel.getRangeAt(0); if (!range.commonAncestorContainer.isConnected) return;
      selectedRange = range.cloneRange();
      removeTranslationUI();
      loadSettings().then(cfg => {
        if (cfg.showOnSelect) {
          if (cfg.showFullEnglishDictionary !== false && isEnglishDictionaryWord(text)) {
            showComposer(range, null, { skipAutoTranslate:true, dictionaryWord:text });
            lookupEnglishDictionary(text, selectedRange);
          } else showComposer(range);
        }
        else {
          removeTooltip();
          if (cfg.translateIconEnabled !== false) showTranslateIcon(selectedRange);
          if (cfg.translationPopupEnabled !== false) translateSelectedRange(selectedRange, { keepIcon:cfg.translateIconEnabled !== false });
        }
      });
    }, 20);
  });
  document.addEventListener("mousedown", e => {
    outsideMouseDown = { x: e.clientX, y: e.clientY, wasOpen: !!panel, dismissTranslateIcon:!!translateIcon && !e.target.closest?.("#lhn-translate-icon") };
    if (outsideMouseDown.dismissTranslateIcon) { translateIcon.remove(); translateIcon = null; }
    if (panel && !e.target.closest?.("#lhn-panel")) {
      if (settings.showOnSelect || settings.autoHighlight === false) removeComposer();
      else if (composerSave) composerSave();
      else removeComposer();
    }
    if (tooltip && !e.target.closest?.("#lhn-note-pop, #lhn-highlight-actions, .lhn-mark")) removeTooltip();
    if (translationPopup && !e.target.closest?.("#lhn-direct-translation, #lhn-translate-icon")) removeTranslationUI();
    else if (dictionaryPopup && !dictionaryPopup._lhnHideForNote && !e.target.closest?.("#lhn-full-english-dictionary")) { dictionaryRequestId++; dictionaryPopup.remove(); dictionaryPopup = null; }
  }, true);
  document.addEventListener("mouseup", e => {
    if (outsideMouseDown?.wasOpen && Math.abs(e.clientX - outsideMouseDown.x) < 5 && Math.abs(e.clientY - outsideMouseDown.y) < 5) suppressMouseUp = true;
    outsideMouseDown = null;
  }, true);
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") { removeComposer(); removeTooltip(true); removeTranslationUI(); return; }
    const pressed = shortcutForEvent(e).toLowerCase();
    const sidebarShortcut = String(settings.sidebarShortcut ?? "Alt+Q").toLowerCase();
    if (sidebarShortcut && pressed === sidebarShortcut) {
      e.preventDefault(); e.stopPropagation(); toggleSidebar(); return;
    }
    if (!websiteSettingsReady) return;
    const toggleWebsiteShortcut = String(settings.toggleWebsiteShortcut ?? "Alt+D").toLowerCase();
    if (toggleWebsiteShortcut && pressed === toggleWebsiteShortcut) {
      e.preventDefault(); e.stopPropagation(); toggleWebsiteDisabled(); return;
    }
    if (websiteDisabled) return;
    const bilingualShortcuts = { "alt+a":"toggle-lazy", "alt+d":"toggle-near-pointer", "alt+r":"toggle-reading" };
    const bilingualAction = bilingualShortcuts[pressed];
    if (bilingualAction) {
      e.preventDefault(); e.stopPropagation();
      if (bilingualAction === "toggle-reading") { speechPauseActive = false; shortcutPausedMedia = []; }
      document.dispatchEvent(new CustomEvent("lhn-bilingual-reader-command", { detail:bilingualAction }));
      return;
    }
    const translateShortcut = String(settings.translateSelectedShortcut ?? "Alt+W").toLowerCase();
    const notePopupShortcut = String(settings.shortcut ?? "Alt+S").toLowerCase();
    if (translateShortcut && pressed === translateShortcut && notePopupShortcut !== translateShortcut) {
      if (panel || e.target.closest?.("#lhn-panel, #lhn-sidebar, #lhn-sidebar-edit-dialog")) return;
      const visibleTranslationPopup = translationPopup?.isConnected && translationPopup.classList.contains("lhn-visible") ? translationPopup : null;
      const visibleDictionaryPopup = dictionaryPopup?.isConnected && dictionaryPopup.classList.contains("lhn-dict-visible") ? dictionaryPopup : null;
      const visiblePopup = visibleTranslationPopup || visibleDictionaryPopup;
      if (settings.autoSpeakSelectedText !== false && visiblePopup) {
        e.preventDefault(); e.stopPropagation();
        if (e.repeat) return;
        const popupRange = visiblePopup._lhnAnchorRange;
        const selection = getSelection();
        const range = selection?.rangeCount && !selection.isCollapsed && cleanText(selection.toString()) && !isEditable(selection.anchorNode)
          ? selection.getRangeAt(0).cloneRange()
          : popupRange?.startContainer?.isConnected ? popupRange.cloneRange() : null;
        const text = cleanText(range?.toString());
        if (text) {
          const anchor = range.startContainer.nodeType === Node.ELEMENT_NODE ? range.startContainer : range.startContainer.parentElement;
          speakHighlightedText(text, visibleDictionaryPopup ? "en-US" : speechLanguageForText(text, anchor), null, anchor, !!visibleDictionaryPopup);
        }
        return;
      }
      if (!e.repeat && !isEditable(e.target) && hoveredMark?.matches(":hover") && tooltip?.dataset.itemId === hoveredMark.dataset.lhnId) {
        const speakButton = tooltip.querySelector(".lhn-tooltip-speak-trigger");
        if (speakButton) { e.preventDefault(); e.stopPropagation(); speakButton.click(); return; }
      }
      const selection = getSelection();
      const range = selection?.rangeCount && !selection.isCollapsed && cleanText(selection.toString()) && !isEditable(selection.anchorNode) ? selection.getRangeAt(0).cloneRange() : null;
      if (!e.repeat && range && cleanText(range.toString()) && !isEditable(e.target)) { e.preventDefault(); e.stopPropagation(); selectedRange = range.cloneRange(); translateSelectedRange(range, { forcePopup:true, forceSpeak:true }); }
      return;
    }
    if (notePopupShortcut && pressed === notePopupShortcut) {
      if (e.target.closest?.("#lhn-sidebar, #lhn-sidebar-edit-dialog")) return;
      if (panel) { e.preventDefault(); e.stopPropagation(); removeComposer(); return; }
      const sel = getSelection();
      let range = selectedRange && selectedRange.startContainer.isConnected ? selectedRange.cloneRange() : null;
      if ((!range || range.collapsed) && sel?.rangeCount && cleanText(sel.toString())) range = sel.getRangeAt(0).cloneRange();
      if (range && !range.collapsed && cleanText(range.toString())) { e.preventDefault(); e.stopPropagation(); showComposer(range); }
    }
  }, true);
  window.addEventListener("scroll", () => {
    if (translateIcon) positionTranslateIcon();
    if (translationPopup?._lhnAnchorRange) positionPopupAtAnchor(translationPopup, translationPopup._lhnAnchorRange);
    if (dictionaryPopup?._lhnAnchorRange) positionPopupAtAnchor(dictionaryPopup, dictionaryPopup._lhnAnchorRange);
    if (tooltip?._lhnAnchor) positionPopupAtAnchor(tooltip, tooltip._lhnAnchor);
    if (activeRange && panel) webHighlighter.drawPreview(activeRange, selectedColor);
  }, true);
  window.addEventListener("resize", () => {
    if (translateIcon) positionTranslateIcon();
    if (translationPopup?._lhnAnchorRange) positionPopupAtAnchor(translationPopup, translationPopup._lhnAnchorRange);
    if (dictionaryPopup?._lhnAnchorRange) positionPopupAtAnchor(dictionaryPopup, dictionaryPopup._lhnAnchorRange);
    if (tooltip?._lhnAnchor) positionPopupAtAnchor(tooltip, tooltip._lhnAnchor);
    if (activeRange && panel) webHighlighter.drawPreview(activeRange, selectedColor);
  });

  const RESTORE_EXCLUDED = "script,style,noscript,textarea,input,select,option,button,[contenteditable='true'],[contenteditable=''],mark,#lhn-panel,#lhn-note-pop,#lhn-direct-translation,#lhn-translate-icon,#lhn-sidebar,.lhn-selection-preview-mark,#lhn-selection-overlay,#lhn-sidebar-edge-toggle,#lhn-sidebar-toast";
  const webHighlighter = globalThis.LHNWebHighlighter.create({ config: CONFIG, attachMarkEvents, restoreExcludedSelector: RESTORE_EXCLUDED });
  let restorePromise = null;
  let restoreRequestedWhileRunning = false;
  let restoreObserver = null;
  let restoreDebounce = 0;
  let restorePendingWhileEditing = false;
  let restoreRetryCount = 0;
  let lastRestoreUrl = pageUrl();

  function isRestorableTextNode(node) {
    return !!node?.nodeValue && !!node.nodeValue.trim() && !node.parentElement?.closest(RESTORE_EXCLUDED);
  }
  function normalizeWithMap(value) {
    const source = String(value || "");
    let text = "";
    const startMap = [];
    const endMap = [];
    let i = 0;
    while (i < source.length) {
      if (/\s/.test(source[i])) {
        const runStart = i;
        while (i < source.length && /\s/.test(source[i])) i++;
        // Normalize a whitespace run to one space, retaining the full source span.
        if (text.length && i < source.length) {
          text += " ";
          startMap.push(runStart);
          endMap.push(i);
        }
        continue;
      }
      text += source[i];
      startMap.push(i);
      endMap.push(i + 1);
      i++;
    }
    return { text, startMap, endMap };
  }

  function findQuoteRange(item) {
    if (!document.body || !item?.quote) return null;
    const quote = normalizeWithMap(item.quote).text;
    if (!quote) return null;
    const prefix = normalizeWithMap(item.prefix || "").text;
    const suffix = normalizeWithMap(item.suffix || "").text;
    let best = null;
    let bestScore = -1;

    function scanRun(raw, nodes) {
      if (!raw || !nodes.length) return;
      const normalized = normalizeWithMap(raw);
      let from = 0, idx;
      while ((idx = normalized.text.indexOf(quote, from)) !== -1) {
        const before = normalized.text.slice(Math.max(0, idx - prefix.length), idx);
        const after = normalized.text.slice(idx + quote.length, idx + quote.length + suffix.length);
        // Context is a ranking hint, not a hard requirement: web apps often change
        // surrounding whitespace or render the selected text inside different wrappers.
        let score = 0;
        if (prefix && before.endsWith(prefix)) score += 2;
        if (suffix && after.startsWith(suffix)) score += 2;
        const rawStart = normalized.startMap[idx];
        const rawEnd = normalized.endMap[idx + quote.length - 1];
        const first = nodes.find(x => rawStart >= x.start && rawStart < x.end);
        const last = nodes.find(x => rawEnd > x.start && rawEnd <= x.end);
        if (first && last) {
          const range = document.createRange();
          range.setStart(first.node, rawStart - first.start);
          range.setEnd(last.node, rawEnd - last.start);
          if (score > bestScore) { best = range; bestScore = score; }
        }
        from = idx + 1;
      }
    }

    // Fast path: search individual text nodes first, while considering every occurrence
    // so that saved context can disambiguate repeated phrases.
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: node => isRestorableTextNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
    });
    let node;
    while ((node = walker.nextNode())) {
      const normalized = normalizeWithMap(node.nodeValue);
      if (!normalized.text.includes(quote)) continue;
      scanRun(node.nodeValue, [{ node, start: 0, end: node.nodeValue.length }]);
    }

    // Search across adjacent inline elements (e.g. text split by <strong>/<span>).
    // Only semantic/block containers form boundaries; span is deliberately not one.
    const blockSelector = "p,li,dd,dt,blockquote,figcaption,h1,h2,h3,h4,h5,h6,td,th,article,section,div";
    const blockTags = new Set(["P","LI","DD","DT","BLOCKQUOTE","FIGCAPTION","H1","H2","H3","H4","H5","H6","TD","TH","ARTICLE","SECTION","DIV"]);
    const blocks = document.body.querySelectorAll(blockSelector);
    for (const block of blocks) {
      if (block.closest(RESTORE_EXCLUDED)) continue;
      // Keep runs small and avoid rescanning every ancestor of the same paragraph.
      if (block.querySelector(blockSelector)) continue;
      let runNodes = [], raw = "";
      const runs = [];
      const flush = () => {
        if (raw && runNodes.length) runs.push({ raw, nodes: runNodes });
        runNodes = []; raw = "";
      };
      const walkInline = current => {
        if (current.nodeType === Node.TEXT_NODE) {
          // Keep whitespace-only text nodes inside an inline run: they often contain
          // the only space between adjacent <span>/<strong> elements in web apps.
          if (!current.nodeValue || current.parentElement?.closest(RESTORE_EXCLUDED)) { flush(); return; }
          const value = current.nodeValue;
          runNodes.push({ node: current, start: raw.length, end: raw.length + value.length });
          raw += value;
          return;
        }
        if (current.nodeType !== Node.ELEMENT_NODE && current.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return;
        if (current.nodeType === Node.ELEMENT_NODE && current.matches(RESTORE_EXCLUDED)) { flush(); return; }
        const isNestedBlock = current !== block && current.nodeType === Node.ELEMENT_NODE && blockTags.has(current.tagName);
        if (isNestedBlock) flush();
        for (const child of current.childNodes) walkInline(child);
        if (isNestedBlock) flush();
      };
      walkInline(block);
      flush();
      for (const run of runs) {
        if (normalizeWithMap(run.raw).text.includes(quote)) scanRun(run.raw, run.nodes);
      }
    }
    // Search across block boundaries in two representations. Range.toString() can
    // concatenate text from adjacent block elements without inserting a newline,
    // while Selection.toString() and some DOMs include a line break. A single
    // representation therefore fails to restore highlights spanning paragraphs.
    // Excluded extension UI and existing marks remain hard boundaries.
    {
      const nodes = [];
      let raw = "", previousBlock = null;
      const blockSelectorForStream = "p,li,dd,dt,blockquote,figcaption,h1,h2,h3,h4,h5,h6,td,th,article,section,div,pre";
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
        acceptNode: node => node.parentElement?.closest(RESTORE_EXCLUDED) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
      });
      let node;
      while ((node = walker.nextNode())) {
        if (!node.nodeValue) continue;
        const block = node.parentElement?.closest(blockSelectorForStream) || document.body;
        if (previousBlock && block !== previousBlock && raw && !/\s$/.test(raw)) raw += "\n";
        const start = raw.length;
        raw += node.nodeValue;
        nodes.push({ node, start, end: raw.length });
        previousBlock = block;
      }
      if (normalizeWithMap(raw).text.includes(quote)) scanRun(raw, nodes);
    }
    // Important fallback: Range.toString() often returns the literal concatenation
    // of text nodes across <p>/<div> boundaries (no generated whitespace). Search
    // that exact DOM-text stream too, using its own offsets so the resulting Range
    // maps correctly back to the original text nodes.
    {
      const nodes = [];
      let raw = "";
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
        acceptNode: node => node.parentElement?.closest(RESTORE_EXCLUDED) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
      });
      let node;
      while ((node = walker.nextNode())) {
        if (!node.nodeValue) continue;
        const start = raw.length;
        raw += node.nodeValue;
        nodes.push({ node, start, end: raw.length });
      }
      if (normalizeWithMap(raw).text.includes(quote)) scanRun(raw, nodes);
    }
    return best;
  }
  async function restoreAnnotations() {
    if (!websiteSettingsReady || websiteDisabled) return;
    if (isEditable(document.activeElement)) { restorePendingWhileEditing = true; return; }
    if (restorePromise) {
      restoreRequestedWhileRunning = true;
      return restorePromise;
    }
    restorePromise = (async () => {
      let items;
      try { items = await LHN_MESSAGING.sendMessage({ type: "GET_PAGE", url: pageUrl() }); }
      catch (error) { console.warn("Highlight Notes: could not load saved highlights", error); return; }
      if (!Array.isArray(items) || !document.body) return;
      const currentUrl = pageUrl();
      const current = items.filter(x => x && x.url === currentUrl && x.quote && x.id);
      cachePageAnnotations(currentUrl, current);
      if (!current.length) { restoreRetryCount = 0; return; }
      // Snapshot existing marks once. Querying the whole page for every note made
      // restoration scale as notes × DOM nodes on pages with many highlights.
      const existingMarksById = new Map();
      document.querySelectorAll(".lhn-mark[data-lhn-id]").forEach(mark => {
        webHighlighter.ensureTextReadable(mark);
        const id = mark.dataset.lhnId;
        if (!id) return;
        const marks = existingMarksById.get(id);
        if (marks) marks.push(mark);
        else existingMarksById.set(id, [mark]);
      });
      let missing = 0;
      for (let itemIndex = 0; itemIndex < current.length; itemIndex++) {
        if (isEditable(document.activeElement)) { restorePendingWhileEditing = true; return; }
        // Search and wrap one quote at a time during idle periods so large pages
        // with many saved highlights do not monopolize the site's main thread.
        if (itemIndex && itemIndex % CONFIG.LIMITS.RESTORE_IDLE_BATCH_SIZE === 0) await new Promise(resolve => {
          if (typeof requestIdleCallback === "function") requestIdleCallback(() => resolve(), { timeout: 80 });
          else setTimeout(resolve, 0);
        });
        const item = current[itemIndex];
        if (websiteDisabled || pageUrl() !== currentUrl) break;
        // A multi-paragraph annotation is represented by several <mark> elements
        // sharing one ID. Only consider it restored when every fragment recorded
        // by the first mark is present; remove incomplete fragments and retry cleanly.
        const marks = existingMarksById.get(item.id) || [];
        if (marks.length) {
          const expected = Math.max(1, ...marks.map(mark => Number(mark.dataset.lhnParts) || 1));
          if (marks.length >= expected) continue;
          for (const mark of marks) mark.replaceWith(...mark.childNodes);
        }
        // Resolve every range immediately before wrapping because earlier items
        // may have changed the DOM.
        const range = findQuoteRange(item);
        if (range) {
          if (!webHighlighter.wrapRange(range, item)) missing++;
        } else missing++;
      }
      if (missing === 0) restoreRetryCount = 0;
      else if (restoreRetryCount < 10) {
        // Some apps render text in several asynchronous batches without changing the URL.
        // Retry a bounded number of times even if their DOM changes are unusually sparse.
        restoreRetryCount++;
        scheduleRestore(500);
      }
    })().finally(() => {
      restorePromise = null;
      if (restoreRequestedWhileRunning) {
        restoreRequestedWhileRunning = false;
        scheduleRestore(120);
      }
    });
    return restorePromise;
  }
  function scheduleRestore(delay = 350) {
    if (!websiteSettingsReady || websiteDisabled) return;
    if (restoreDebounce) clearTimeout(restoreDebounce);
    restoreDebounce = setTimeout(() => {
      restoreDebounce = 0;
      if (isEditable(document.activeElement)) { restorePendingWhileEditing = true; return; }
      restorePendingWhileEditing = false;
      restoreAnnotations();
    }, delay);
  }
  function isExtensionMutationNode(node) {
    const el = node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement;
    return !!el?.closest?.(".lhn-mark,.lhn-selection-preview-mark,#lhn-panel,#lhn-note-pop,#lhn-direct-translation,#lhn-translate-icon,#lhn-sidebar,#lhn-selection-overlay,#lhn-sidebar-edge-toggle,#lhn-sidebar-toast");
  }
  function startRestoreObserver() {
    if (restoreObserver || !document.documentElement) return;
    restoreObserver = new MutationObserver(records => {
      const relevant = records.some(record => {
        if (isExtensionMutationNode(record.target)) return false;
        const added = [...record.addedNodes];
        const removed = [...record.removedNodes];
        const changed = [...added, ...removed];
        if (changed.length && changed.every(isExtensionMutationNode)) return false;
        // Wrapping a saved quote replaces text nodes with our own <mark>. Ignore that
        // specific mutation signature to prevent observer-triggered restoration loops.
        if (added.length && added.every(n => n.nodeType === Node.ELEMENT_NODE && n.matches?.(".lhn-mark")) &&
            removed.every(n => n.nodeType === Node.TEXT_NODE)) return false;
        if (record.type === "characterData" && !isRestorableTextNode(record.target)) return false;
        return true;
      });
      if (relevant) {
        restoreRetryCount = 0;
        if (isEditable(document.activeElement)) { restorePendingWhileEditing = true; return; }
        scheduleRestore(300);
      }
    });
    restoreObserver.observe(document.documentElement, { subtree: true, childList: true, characterData: true });
  }
  document.addEventListener("focusout", event => {
    if (!restorePendingWhileEditing || isEditable(event.relatedTarget)) return;
    scheduleRestore(120);
  }, true);
  function handlePossibleNavigation() {
    const nextUrl = pageUrl();
    if (nextUrl !== lastRestoreUrl) lastRestoreUrl = nextUrl;
    restoreRetryCount = 0;
    scheduleRestore(200);
  }
  async function jumpToHighlight(id) {
    if (typeof id !== "string" || !id) return { found: false };
    await loadSettings();
    if (websiteDisabled) return { found: false };
    await restoreAnnotations();
    for (let attempt = 0; attempt < 40; attempt++) {
      const mark = document.querySelector(`[data-lhn-id="${CSS.escape(id)}"]`);
      if (mark) {
        mark.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
        mark.classList.add("lhn-jump-target");
        setTimeout(() => mark.classList.remove("lhn-jump-target"), 2200);
        return { found: true };
      }
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    return { found: false };
  }
  window.addEventListener("pagehide", restorePageWidth);
  window.addEventListener("pageshow", () => scheduleRestore(150));
  window.addEventListener("popstate", handlePossibleNavigation);
  window.addEventListener("hashchange", handlePossibleNavigation);
  // Works when history APIs are visible in this content-script world; MutationObserver remains
  // the primary mechanism for SPAs whose URL never changes or whose history is isolated.
  for (const method of ["pushState", "replaceState"]) {
    try {
      const original = history[method];
      history[method] = function (...args) {
        const result = original.apply(this, args);
        queueMicrotask(handlePossibleNavigation);
        return result;
      };
    } catch { /* restricted history implementation */ }
  }
  syncSidebarEdgeToggle();
  loadSettings().then(() => {
    if (websiteDisabled) {
      removeComposer(); removeTooltip(); document.querySelectorAll(".lhn-mark").forEach(mark => mark.replaceWith(...mark.childNodes));
    } else {
      startRestoreObserver(); setTimeout(restoreAnnotations, 600);
    }
  });
  LHN_MESSAGING.onMessage.addListener(message => {
    if (message?.type === "ANNOTATIONS_CHANGED") {
      const change = message.change;
      if (!change) return;
      const currentUrl = pageUrl();
      if (change.type === "upsert" && change.item?.id) {
        if (change.item.url !== currentUrl) return;
        pageAnnotationCache.set(change.item.id, change.item);
        if (Array.isArray(sidebarItemsCache)) {
          const index = sidebarItemsCache.findIndex(item => item.id === change.item.id);
          if (index < 0) sidebarItemsCache.push(change.item); else sidebarItemsCache[index] = change.item;
        }
      } else if (change.type === "delete" && typeof change.id === "string") {
        if (!pageAnnotationCache.has(change.id) && !sidebarItemsCache?.some(item => item.id === change.id)) return;
        pageAnnotationCache.delete(change.id);
        if (Array.isArray(sidebarItemsCache)) sidebarItemsCache = sidebarItemsCache.filter(item => item.id !== change.id);
      } else if (change.type === "deletePage" && change.url === currentUrl) {
        pageAnnotationCache.clear(); sidebarItemsCache = [];
      } else if (change.type === "refresh") { if (sidebarOpen) renderSidebar(); return; }
      else return;
      if (sidebarOpen) renderSidebar(true);
      return;
    }
    if (message?.type === "RESTORE_HIGHLIGHTS") return websiteDisabled ? undefined : restoreAnnotations();
    if (message?.type === "OPEN_SIDEBAR") return openSidebar();
    if (message?.type === "TOGGLE_SIDEBAR") return toggleSidebar();
    if (message?.type === "JUMP_TO_HIGHLIGHT") return jumpToHighlight(message.id);
    if (message?.type === "REMOVE_HIGHLIGHT_PAGE" && message.url === pageUrl()) {
      document.querySelectorAll(".lhn-mark").forEach(mark => mark.replaceWith(...mark.childNodes));
      pageAnnotationCache.clear(); sidebarItemsCache = [];
      if (sidebarOpen) renderSidebar(true);
      return;
    }
    if (message?.type === "REMOVE_HIGHLIGHT_IDS" && Array.isArray(message.ids)) {
      for (const id of message.ids) {
        if (typeof id !== "string") continue;
        document.querySelectorAll(`[data-lhn-id="${CSS.escape(id)}"]`).forEach(mark => mark.replaceWith(...mark.childNodes));
      }
      if (sidebarOpen) renderSidebar();
    }
  });
})();
