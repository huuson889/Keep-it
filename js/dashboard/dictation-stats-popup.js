(() => {
  const $ = selector => document.querySelector(selector);
  const modal = $(".modal"), backdrop = $("#backdrop"), content = $("#contentContainer");
  const closeX = $("#closeX"), closeDone = $("#closeDone"), reopen = $("#reopen");
  if (!modal || !backdrop || !content) return;

  const TYPES = ["phonetic", "rule", "typo"];
  let globalWords = [];
  let sessions = [];
  let currentView = "global", currentType = "all", currentSort = "errors";
  const fallback = {
    dictationStatsErrorSummary:"Wrong: {errors} · error rate: {rate}%",
    dictationStatsTypeNamePhonetic:"🎧 Phonetic / misheard",
    dictationStatsTypeNameRule:"📜 Spelling rule",
    dictationStatsTypeNameTypo:"⚡ Typing typo",
    dictationStatsContextLabel:"Context:",
    dictationStatsSourceLabel:"📺 {source}",
    dictationStatsVariantsLabel:"Typed variants:",
    dictationStatsNoVariants:"No wrong variants recorded.",
    dictationStatsEmpty:"No eligible saved error attempts yet.",
    dictationStatsAudioLabel:"Play pronunciation of {word}",
  };
  function tr(key, vars = {}) {
    const lang = document.documentElement.lang || "vi";
    let value = fallback[key] || key;
    try { value = window.parent?.LHN_LANGUAGES?.t?.(key, vars, lang) || value; } catch {}
    return String(value).replace(/\{(\w+)\}/g, (_, name) => vars[name] == null ? `{${name}}` : String(vars[name]));
  }
  function applyTranslations(lang) {
    if (["en", "vi", "ko"].includes(lang)) document.documentElement.lang = lang;
    const activeLang = document.documentElement.lang || "vi";
    document.querySelectorAll("[data-dstats-i18n]").forEach(node => {
      const key = node.dataset.dstatsI18n;
      try { node.textContent = window.parent?.LHN_LANGUAGES?.t?.(key, {}, activeLang) || node.textContent; } catch {}
    });
    document.querySelectorAll("[data-dstats-aria]").forEach(node => {
      const value = tr(node.dataset.dstatsAria);
      node.setAttribute("aria-label", value);
      if (node.id === "closeX") node.title = value;
    });
  }
  function el(tag, className = "", text = "") {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== "") node.textContent = text;
    return node;
  }
  function safeCount(value) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(0, Math.floor(number)) : 0;
  }
  function safeVideoUrl(value) {
    try {
      const url = new URL(String(value || ""));
      const host = url.hostname.toLocaleLowerCase();
      if (url.protocol !== "https:" || !(host === "youtu.be" || host === "youtube.com" || host.endsWith(".youtube.com"))) return "";
      return url.href;
    } catch { return ""; }
  }
  function countLetters(word) { return (String(word || "").match(/\p{L}/gu) || []).length; }
  function normalizeContext(value) {
    if (!value || typeof value !== "object") return null;
    const typed = String(value.typed || "");
    if (!typed) return null;
    return { before:String(value.before || ""), typed, after:String(value.after || ""), source:String(value.source || ""), url:safeVideoUrl(value.url) };
  }
  function normalizeItem(value) {
    const word = String(value?.word || "").trim();
    const errors = safeCount(value?.errors), fixes = safeCount(value?.fixes);
    if (!word || countLetters(word) < 4 || errors < 1) return null;
    const variants = (Array.isArray(value.variants) ? value.variants : []).map(variant => ({
      text:String(variant?.text || "").trim(), count:safeCount(variant?.count),
      typeCounts:Object.fromEntries(TYPES.map(type => [type, safeCount(variant?.typeCounts?.[type])])),
    })).filter(variant => variant.text && variant.count);
    const typeCounts = Object.fromEntries(TYPES.map(type => [type, safeCount(value?.typeCounts?.[type])]));
    const typeFixes = Object.fromEntries(TYPES.map(type => [type, safeCount(value?.typeFixes?.[type])]));
    const errorExamples = Object.fromEntries(TYPES.map(type => [type, normalizeContext(value?.errorExamples?.[type]) ? {
      ...normalizeContext(value.errorExamples[type]), lastAt:safeCount(value.errorExamples[type].lastAt),
    } : null]).filter(([, example]) => example));
    return {
      word, errors, fixes, variants, typeCounts, typeFixes, errorExamples, lastErrorType:TYPES.includes(value?.lastErrorType) ? value.lastErrorType : "rule",
      errorContext:normalizeContext(value?.errorContext), lastAt:safeCount(value?.lastAt),
      status:value?.status === "wrong" ? "wrong" : "correct",
      sources:Array.isArray(value?.sources) ? value.sources.map(String).filter(Boolean) : [],
      sourceUrls:Array.isArray(value?.sourceUrls) ? value.sourceUrls.map(safeVideoUrl).filter(Boolean) : [],
    };
  }
  function setStatsSnapshot(snapshot) {
    globalWords = (Array.isArray(snapshot?.globalWords) ? snapshot.globalWords : []).map(normalizeItem).filter(Boolean);
    sessions = (Array.isArray(snapshot?.sessions) ? snapshot.sessions : []).map(session => ({
      id:String(session?.id || ""), title:String(session?.title || session?.sourceId || ""),
      url:safeVideoUrl(session?.url), words:(Array.isArray(session?.words) ? session.words : []).map(normalizeItem).filter(Boolean),
    })).filter(session => session.words.length);
    render();
  }
  function calculateErrorRate(errors, fixes) {
    const wrongCount = safeCount(errors), fixedCount = safeCount(fixes);
    const total = wrongCount + fixedCount;
    return total ? wrongCount / total * 100 : 0;
  }
  function calculateRecoveryRate(errors, fixes) {
    const wrongCount = safeCount(errors), fixedCount = safeCount(fixes);
    return wrongCount ? fixedCount / wrongCount * 100 : 0;
  }
  function isCritical(item) {
    return safeCount(item.errors) >= 3 && calculateErrorRate(item.errors, item.fixes) >= 70;
  }
  function displayedErrorRate(item) { return Math.round(calculateErrorRate(item.errors, item.fixes)); }
  function primaryType(item) {
    let chosen = item.lastErrorType || "rule", maximum = 0;
    for (const type of TYPES) {
      const count = safeCount(item.typeCounts?.[type]);
      if (count > maximum) { maximum = count; chosen = type; }
    }
    return chosen;
  }
  function hasType(item, type) { return safeCount(item.typeCounts?.[type]) > 0 || primaryType(item) === type; }
  function viewForType(item, type) {
    if (type === "all") return item;
    if (!hasType(item, type)) return null;
    const errors = safeCount(item.typeCounts?.[type]) || (item.lastErrorType === type ? item.errors : 0);
    const fixes = safeCount(item.typeFixes?.[type]);
    const variants = item.variants.map(variant => ({
      ...variant,
      count:safeCount(variant.typeCounts?.[type]) || (item.lastErrorType === type ? variant.count : 0),
    })).filter(variant => variant.count);
    const errorContext = item.errorExamples?.[type] || (primaryType(item) === type ? item.errorContext : null);
    return {
      ...item, errors, fixes, variants, lastAt:safeCount(item.errorExamples?.[type]?.lastAt) || item.lastAt,
      typeCounts:Object.fromEntries(TYPES.map(candidate => [candidate, candidate === type ? errors : 0])),
      typeFixes:Object.fromEntries(TYPES.map(candidate => [candidate, candidate === type ? fixes : 0])),
      lastErrorType:type, errorContext,
    };
  }
  function renderMetrics() {
    const errors = globalWords.reduce((sum, item) => sum + safeCount(item.errors), 0);
    const fixes = globalWords.reduce((sum, item) => sum + safeCount(item.fixes), 0);
    $("#statsWordCount").textContent = String(globalWords.length);
    $("#statsErrorCount").textContent = String(errors);
    $("#statsFixCount").textContent = String(fixes);
    $("#statsRecoveryRate").textContent = `${Math.round(calculateRecoveryRate(errors, fixes))}%`;
  }
  function typeLabel(type) { return tr(`dictationStatsTypeName${type[0].toLocaleUpperCase()}${type.slice(1)}`); }
  function createTypeTag(item) {
    const type = primaryType(item);
    return el("span", `error-type-tag ${type}`, typeLabel(type));
  }
  function appendContext(sentence, context) {
    sentence.append(document.createTextNode(`“${context.before}`));
    sentence.append(el("span", "wrong-token", context.typed));
    sentence.append(document.createTextNode(`${context.after}”`));
  }
  function createVariants(item) {
    const box = el("div", "variants-tag-box");
    box.append(el("div", "variants-label", tr("dictationStatsVariantsLabel")));
    const variants = el("div", "bad-variants");
    if (!item.variants.length) variants.append(el("span", "variant-empty", tr("dictationStatsNoVariants")));
    item.variants.forEach(variant => variants.append(el("span", "bad-chip", `${variant.text} (×${variant.count})`)));
    box.append(variants);
    return box;
  }
  function createAudioButton(word) {
    const audio = el("button", "audio-btn", "🔊");
    audio.type = "button";
    audio.setAttribute("aria-label", tr("dictationStatsAudioLabel", { word }));
    audio.title = audio.getAttribute("aria-label");
    audio.addEventListener("click", () => {
      if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) return;
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = "en-US";
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    });
    return audio;
  }
  function createSourceLink(source, url, className = "context-source") {
    const label = tr("dictationStatsSourceLabel", { source });
    const href = safeVideoUrl(url);
    if (!href) return el("div", className, label);
    const link = el("a", className, label);
    link.href = href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.title = `Open YouTube video: ${source}`;
    link.setAttribute("aria-label", link.title);
    return link;
  }
  function createGlobalCard(item) {
    const card = el("article", "smart-card");
    const targetBox = el("div", "word-target-box");
    const target = el("div", "word-target");
    target.append(document.createTextNode(item.word), createAudioButton(item.word));
    targetBox.append(target, createTypeTag(item));
    const errorSummary = el("div", "word-error-summary", tr("dictationStatsErrorSummary", { errors:item.errors, fixes:item.fixes, rate:displayedErrorRate(item) }));

    const contextBox = el("div", "context-box");
    contextBox.append(el("div", "context-label", tr("dictationStatsContextLabel")));
    const sentence = el("div", "context-sentence");
    if (item.errorContext) appendContext(sentence, item.errorContext);
    else sentence.textContent = "—";
    contextBox.append(sentence);
    const source = item.errorContext?.source || item.sources[0] || "—";
    const sourceUrl = item.errorContext?.url || item.errorExamples?.[primaryType(item)]?.url || item.sourceUrls?.[0] || "";
    contextBox.append(createSourceLink(source, sourceUrl));
    card.append(targetBox, contextBox, createVariants(item), errorSummary);
    return card;
  }
  function renderSessionView() {
    sessions.forEach(session => {
      const group = el("section", "session-group");
      const head = el("div", "session-head");
      const titleLink = createSourceLink(session.title, session.url, "session-source");
      const toggle = el("button", "session-toggle");
      toggle.type = "button";
      toggle.setAttribute("aria-label", `Toggle statistics for ${session.title}`);
      const caret = el("span", "session-caret", "▼");
      caret.setAttribute("aria-hidden", "true");
      toggle.append(caret);
      head.append(titleLink, toggle);
      const body = el("div", "session-body");
      const words = [...session.words].sort((a, b) => b.errors - a.errors || a.word.localeCompare(b.word));
      words.forEach(item => {
        const row = el("article", "session-word-row");
        const info = el("div", "session-word-info");
        info.append(el("strong", "session-word-label", item.word), createTypeTag(item));
        const detail = el("div", "session-word-summary", tr("dictationStatsErrorSummary", { errors:item.errors, fixes:item.fixes, rate:displayedErrorRate(item) }));
        row.append(info, detail, createVariants(item));
        if (item.errorContext) {
          const context = el("div", "context-sentence");
          appendContext(context, item.errorContext);
          row.append(context);
        }
        body.append(row);
      });
      toggle.setAttribute("aria-expanded", "true");
      toggle.addEventListener("click", () => {
        const collapsed = body.classList.toggle("collapsed");
        toggle.setAttribute("aria-expanded", String(!collapsed));
      });
      group.append(head, body);
      content.append(group);
    });
  }
  function render() {
    renderMetrics();
    content.replaceChildren();
    const toolbar = $("#toolbarCard");
    if (toolbar) toolbar.style.display = currentView === "sessions" ? "none" : "flex";
    if (currentView === "sessions") {
      if (!sessions.length) { content.append(el("div", "empty-state", `🌸 ${tr("dictationStatsEmpty")}`)); return; }
      renderSessionView();
      return;
    }
    let list = globalWords.map(item => viewForType(item, currentType)).filter(Boolean);
    if (currentView === "critical") list = list.filter(isCritical);
    if (currentSort === "errors") list.sort((a, b) => b.errors - a.errors || a.word.localeCompare(b.word));
    else list.sort((a, b) => b.lastAt - a.lastAt || a.word.localeCompare(b.word));
    if (!list.length) { content.append(el("div", "empty-state", `🌸 ${tr("dictationStatsEmpty")}`)); return; }
    list.forEach(item => content.append(createGlobalCard(item)));
  }
  document.querySelectorAll(".view-tab").forEach(button => button.addEventListener("click", () => {
    document.querySelectorAll(".view-tab").forEach(tab => {
      const active = tab === button;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-pressed", String(active));
    });
    currentView = button.dataset.view || "global";
    render();
  }));
  document.querySelectorAll(".pill").forEach(button => button.addEventListener("click", () => {
    document.querySelectorAll(".pill").forEach(pill => {
      const active = pill === button;
      pill.classList.toggle("active", active);
      pill.setAttribute("aria-pressed", String(active));
    });
    currentType = button.dataset.type || "all";
    render();
  }));
  const sortSelect = $("#sortSelect");
  sortSelect?.addEventListener("change", () => { currentSort = sortSelect.value || "errors"; render(); });

  function closeModal() {
    backdrop.classList.add("closed");
    reopen?.classList.add("visible");
    window.parent?.postMessage({ type:"KEEPIT_DICTATION_STATS_CLOSE" }, location.origin);
  }
  function openModal(lang, snapshot) {
    applyTranslations(lang);
    if (snapshot) setStatsSnapshot(snapshot);
    document.body.classList.add("embedded");
    backdrop.classList.remove("closed");
    reopen?.classList.remove("visible");
    closeX?.focus();
  }
  closeX?.addEventListener("click", closeModal);
  closeDone?.addEventListener("click", closeModal);
  reopen?.addEventListener("click", () => openModal(document.documentElement.lang));
  backdrop.addEventListener("click", event => { if (event.target === backdrop) closeModal(); });
  window.addEventListener("message", event => {
    if (event.source !== window.parent || event.origin !== location.origin) return;
    if (event.data?.type === "KEEPIT_DICTATION_STATS_OPEN") {
      openModal(event.data.lang, event.data.stats);
      return;
    }
    if (event.data?.type === "KEEPIT_DICTATION_STATS_UPDATE") setStatsSnapshot(event.data.stats);
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !backdrop.classList.contains("closed")) { event.preventDefault(); closeModal(); }
    if (event.key === "Tab" && !backdrop.classList.contains("closed")) {
      const focusable = [...modal.querySelectorAll("button:not(:disabled),select,[href],input")].filter(node => node.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  applyTranslations();
  render();
})();
