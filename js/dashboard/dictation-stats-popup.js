(() => {
  const $ = selector => document.querySelector(selector);
  const modal = $(".modal"), backdrop = $("#backdrop"), content = $("#contentContainer");
  const expandButton = $("#expandPopup"), closeX = $("#closeX"), closeDone = $("#closeDone"), reopen = $("#reopen");
  if (!modal || !backdrop || !content) return;

  let globalWords = [];
  let sessions = [];
  let currentView = "global", currentSort = "errors";
  const fallback = {
    dictationStatsErrorSummary:"Wrong: {errors} · fixed: {fixes} · error rate: {rate}%",
    dictationStatsCriticalAlert:"🚨 Critical",
    dictationStatsSessionSource:"📺 Source: {source}",
    dictationStatsSessionWord:"• Word: {word}",
    dictationStatsAudioLabel:"Play pronunciation of {word}",
    dictationStatsSourcesLabel:"Videos:",
    dictationStatsVariantsLabel:"Typed variants:",
    dictationStatsNoVariants:"No wrong variants recorded.",
    dictationStatsStatusNeedsPractice:"Needs practice",
    dictationStatsStatusCorrected:"Last tracked attempt corrected",
    dictationStatsEligibleOnly:"Only eligible word errors are shown.",
    dictationStatsEmpty:"No eligible saved error attempts yet.",
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
      if (node.id === "expandPopup") node.title = value;
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
  function countLetters(word) { return (String(word || "").match(/\p{L}/gu) || []).length; }
  function normalizeItem(value) {
    const word = String(value?.word || "").trim();
    const errors = safeCount(value?.errors), fixes = safeCount(value?.fixes);
    if (!word || countLetters(word) < 4 || errors < 1) return null;
    const variants = (Array.isArray(value.variants) ? value.variants : []).map(variant => ({
      text:String(variant?.text || "").trim(), count:safeCount(variant?.count),
    })).filter(variant => variant.text && variant.count);
    return {
      word, errors, fixes, variants, lastAt:safeCount(value?.lastAt),
      status:value?.status === "wrong" ? "wrong" : "correct",
      sources:Array.isArray(value?.sources) ? value.sources.map(String).filter(Boolean) : [],
    };
  }
  function setStatsSnapshot(snapshot) {
    const rawGlobals = Array.isArray(snapshot?.globalWords) ? snapshot.globalWords : [];
    globalWords = rawGlobals.map(normalizeItem).filter(Boolean);
    sessions = (Array.isArray(snapshot?.sessions) ? snapshot.sessions : []).map(session => ({
      id:String(session?.id || ""), title:String(session?.title || session?.sourceId || ""),
      url:String(session?.url || ""), words:(Array.isArray(session?.words) ? session.words : []).map(normalizeItem).filter(Boolean),
    })).filter(session => session.words.length);
    render();
  }
  function calculateErrorRate(errors, fixes) {
    const wrongCount = safeCount(errors), fixedCount = safeCount(fixes);
    const total = wrongCount + fixedCount;
    return total ? wrongCount / total * 100 : 0;
  }
  function isCritical(item) {
    return safeCount(item.errors) >= 3 && calculateErrorRate(item.errors, item.fixes) >= 70;
  }
  function displayedErrorRate(item) { return Math.round(calculateErrorRate(item.errors, item.fixes)); }
  function renderMetrics() {
    const errors = globalWords.reduce((sum, item) => sum + safeCount(item.errors), 0);
    const fixes = globalWords.reduce((sum, item) => sum + safeCount(item.fixes), 0);
    $("#statsWordCount").textContent = String(globalWords.length);
    $("#statsErrorCount").textContent = String(errors);
    $("#statsFixCount").textContent = String(fixes);
    $("#statsErrorRate").textContent = `${Math.round(calculateErrorRate(errors, fixes))}%`;
  }
  function createVariants(item) {
    const box = el("div", "variants-tag-box");
    const label = el("div", "variants-label", tr("dictationStatsVariantsLabel"));
    const variants = el("div", "bad-variants");
    if (!item.variants.length) variants.append(el("span", "variant-empty", tr("dictationStatsNoVariants")));
    item.variants.forEach(variant => variants.append(el("span", "bad-chip", `${variant.text} ×${variant.count}`)));
    box.append(label, variants);
    return box;
  }
  function createStatus(item) {
    return el("span", `error-status ${item.status === "wrong" ? "needs-practice" : "corrected"}`,
      tr(item.status === "wrong" ? "dictationStatsStatusNeedsPractice" : "dictationStatsStatusCorrected"));
  }
  function createGlobalCard(item) {
    const card = el("article", "smart-card");
    const targetBox = el("div", "word-target-box");
    const target = el("div", "word-target");
    target.append(document.createTextNode(item.word));
    const audio = el("button", "audio-btn", "🔊");
    audio.type = "button";
    audio.setAttribute("aria-label", tr("dictationStatsAudioLabel", { word:item.word }));
    audio.title = audio.getAttribute("aria-label");
    audio.addEventListener("click", () => {
      if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) return;
      const utterance = new SpeechSynthesisUtterance(item.word);
      utterance.lang = "en-US";
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    });
    target.append(audio);
    const critical = isCritical(item);
    targetBox.append(target, createStatus(item));
    if (critical) targetBox.append(el("span", "critical-alert", tr("dictationStatsCriticalAlert")));
    targetBox.append(el("div", `sample-error-summary${critical ? " is-critical" : ""}`,
      tr("dictationStatsErrorSummary", { errors:item.errors, fixes:item.fixes, rate:displayedErrorRate(item) })));

    const sourceBox = el("div", "source-box");
    sourceBox.append(el("div", "source-label", tr("dictationStatsSourcesLabel")));
    const sources = el("div", "sample-source", item.sources.join(" · ") || "—");
    sourceBox.append(sources);
    card.append(targetBox, sourceBox, createVariants(item));
    return card;
  }
  function createSessionWordRow(item) {
    const row = el("article", `session-word-row${isCritical(item) ? " is-critical" : ""}`);
    const info = el("div", "session-word-info");
    info.append(el("strong", "session-word-label", tr("dictationStatsSessionWord", { word:item.word })), createStatus(item));
    const variants = el("div", "session-word-variants");
    if (item.variants.length) {
      item.variants.forEach(variant => variants.append(el("span", "bad-chip", `${variant.text} ×${variant.count}`)));
    } else variants.append(el("span", "variant-empty", tr("dictationStatsNoVariants")));
    const summary = el("div", "session-word-summary", tr("dictationStatsErrorSummary", {
      errors:item.errors, fixes:item.fixes, rate:displayedErrorRate(item),
    }));
    row.append(info, summary, variants);
    if (isCritical(item)) row.append(el("span", "critical-alert", tr("dictationStatsCriticalAlert")));
    return row;
  }
  function renderSessionView() {
    sessions.forEach(session => {
      const group = el("section", "session-group");
      const head = el("button", "session-head");
      head.type = "button";
      head.append(el("span", "session-source", tr("dictationStatsSessionSource", { source:session.title })), el("span", "session-caret", "▼"));
      const body = el("div", "session-body");
      const words = [...session.words].sort((a, b) => b.errors - a.errors || a.word.localeCompare(b.word));
      words.forEach(item => body.append(createSessionWordRow(item)));
      head.setAttribute("aria-expanded", "true");
      head.addEventListener("click", () => {
        const collapsed = body.classList.toggle("collapsed");
        head.setAttribute("aria-expanded", String(!collapsed));
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
    let list = [...globalWords];
    if (currentView === "critical") list = list.filter(isCritical);
    if (currentSort === "errors") list.sort((a, b) => b.errors - a.errors || a.word.localeCompare(b.word));
    else if (currentSort === "recent") list.sort((a, b) => b.lastAt - a.lastAt || a.word.localeCompare(b.word));
    else list.sort((a, b) => a.word.localeCompare(b.word));
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
  expandButton?.addEventListener("click", () => {
    const expanded = modal.classList.toggle("is-expanded");
    expandButton.setAttribute("aria-pressed", String(expanded));
    const key = expanded ? "dictationStatsPopupRestore" : "dictationStatsPopupExpand";
    const label = tr(key);
    const iconPath = expandButton.querySelector("svg path");
    if (iconPath) iconPath.setAttribute("d", expanded ? "M9 3v6H3M15 3v6h6M9 21v-6H3M15 21v-6h6" : "M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M3 16v3a2 2 0 0 0 2 2h3M21 16v3a2 2 0 0 1-2 2h-3");
    expandButton.setAttribute("aria-label", label);
    expandButton.title = label;
  });
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
