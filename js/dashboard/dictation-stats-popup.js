(() => {
  const $ = selector => document.querySelector(selector);
  const modal = $(".modal"), backdrop = $("#backdrop");
  const closeX = $("#closeX"), reopen = $("#reopen"), expandBtn = $("#expandBtn");
  const searchInput = $("#searchInput");
  if (!modal || !backdrop) return;

  const TYPES = ["phonetic", "rule", "typo"];
  const CHEVRON_RIGHT_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-right"><path d="m9 18 6-6-6-6"/></svg>';
  const CHEVRON_DOWN_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down"><path d="m6 9 6 6 6-6"/></svg>';
  const EXPAND_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>';
  const SHRINK_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3v4a2 2 0 0 1-2 2H3M21 9h-4a2 2 0 0 1-2-2V3M15 21v-4a2 2 0 0 1 2-2h4M3 15h4a2 2 0 0 1 2 2v4"/></svg>';
  let globalWords = [];
  let sessions = [];
  let currentView = "global";
  let globalType = "all", criticalType = "all";
  let globalSort = "rate", criticalSort = "rate";
  let searchTerm = "";
  const fallback = {
    dictationStatsSearchPlaceholder:"Search saved Dictation errors…",
    dictationStatsSearchLabel:"Search saved Dictation errors",
    dictationStatsMetricWords:"Misspelled words",
    dictationStatsMetricErrors:"Wrong attempts",
    dictationStatsMetricFixes:"Corrected",
    dictationStatsMetricRecovery:"Recovery",
    dictationStatsErrorCountLine:"Wrong {errors} times",
    dictationStatsErrorFixesLine:"Fixed {fixes}",
    dictationStatsErrorRateLine:"Rate {rate}%",
    dictationStatsWordColumn:"Misspelled word",
    dictationStatsContextColumn:"Context",
    dictationStatsVariantsColumn:"Typed variants",
    dictationStatsTypeColumn:"Error type",
    dictationStatsSummaryColumn:"Error overview",
    dictationStatsErrorSummary:"Wrong: {errors} · error rate: {rate}%",
    dictationStatsTypeNamePhonetic:"🎧 Phonetic / misheard",
    dictationStatsTypeNameRule:"📜 Spelling rule",
    dictationStatsTypeNameTypo:"⚡ Typing typo",
    dictationStatsContextLabel:"Context",
    dictationStatsSourceLabel:"📺 {source}",
    dictationStatsVariantsLabel:"Typed variants",
    dictationStatsNoVariants:"No wrong variants recorded.",
    dictationStatsEmpty:"No eligible saved error attempts yet.",
    dictationStatsAudioLabel:"Play pronunciation of {word}",
    dictationStatsSortRate:"Highest error rate",
    dictationStatsSortErrors:"Most errors",
    dictationStatsSortRecent:"Most recent",
    dictationStatsPopupExpand:"Expand popup",
    dictationStatsPopupRestore:"Restore popup",
    dictationStatsCollapseVideo:"Collapse {title}",
    dictationStatsExpandVideo:"Expand {title}",
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
      if (node.id === "closeX" || node.id === "expandBtn") node.title = value;
    });
    if (searchInput) searchInput.placeholder = tr("dictationStatsSearchPlaceholder");
    document.querySelectorAll(".view-pane[data-pane]").forEach(pane => {
      const labels = { global:"dictationStatsViewGlobal", critical:"dictationStatsViewCritical", sessions:"dictationStatsViewSessions" };
      pane.setAttribute("aria-label", tr(labels[pane.dataset.pane] || "dictationStatsViewGlobal"));
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
  function renderMetrics(items = currentMetricItems()) {
    const errors = items.reduce((sum, item) => sum + safeCount(item.errors), 0);
    const fixes = items.reduce((sum, item) => sum + safeCount(item.fixes), 0);
    $("#statsWordCount").textContent = String(items.length);
    $("#statsErrorCount").textContent = String(errors);
    $("#statsFixCount").textContent = String(fixes);
    $("#statsRecoveryRate").textContent = `${Math.round(calculateRecoveryRate(errors, fixes))}%`;
  }
  function normalizeSearch(value) {
    return String(value || "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase();
  }
  function matchesSearch(item, ...sourceDetails) {
    const query = normalizeSearch(searchTerm);
    if (!query) return true;
    const context = item.errorContext || {};
    const variants = (Array.isArray(item.variants) ? item.variants : []).map(variant => variant.text);
    const haystack = normalizeSearch([
      item.word, typeLabel(primaryType(item)), context.before, context.typed, context.after, context.source,
      ...(Array.isArray(item.sources) ? item.sources : []), ...(Array.isArray(item.sourceUrls) ? item.sourceUrls : []),
      ...variants, ...sourceDetails,
    ].join(" "));
    return haystack.includes(query);
  }
  function currentMetricItems() {
    if (currentView === "critical") {
      return globalWords.map(item => viewForType(item, criticalType)).filter(Boolean).filter(isCritical).filter(item => matchesSearch(item));
    }
    if (currentView === "sessions") {
      return sessions.flatMap(session => session.words
        .map(item => viewForType(item, globalType)).filter(Boolean)
        .filter(item => matchesSearch(item, session.title, session.url)));
    }
    return globalWords.map(item => viewForType(item, globalType)).filter(Boolean).filter(item => matchesSearch(item));
  }
  function typeLabel(type) { return tr(`dictationStatsTypeName${type[0].toLocaleUpperCase()}${type.slice(1)}`); }
  function createTypeTag(item) {
    const type = primaryType(item);
    return el("span", `type-tag ${type}`, typeLabel(type));
  }
  function appendContext(sentence, context) {
    sentence.append(document.createTextNode(`“${context.before}`));
    sentence.append(el("span", "wrong-token", context.typed));
    sentence.append(document.createTextNode(`${context.after}”`));
  }
  function createSmartCardLabels() {
    const row = el("div", "smart-card-labels");
    ["dictationStatsWordColumn", "dictationStatsContextColumn", "dictationStatsVariantsColumn", "dictationStatsTypeColumn", "dictationStatsSummaryColumn"]
      .forEach(key => row.append(el("div", "context-label", tr(key))));
    return row;
  }
  function createVariants(item) {
    const box = el("div", "variants-box");
    const variants = el("div", "variant-list");
    if (!item.variants.length) variants.append(el("span", "no-variants", tr("dictationStatsNoVariants")));
    item.variants.forEach(variant => variants.append(el("span", "variant", `${variant.text} ×${variant.count}`)));
    box.append(variants);
    return box;
  }
  function createAudioButton(word) {
    const audio = el("button", "audio-btn");
    audio.type = "button";
    audio.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/></svg>';
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
  function createSourceLink(source, url, className = "source-link") {
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
  function createSmartCard(item, { sourceOverride = "", sourceUrlOverride = "", className = "smart-card" } = {}) {
    const card = el("article", className);
    const wordBox = el("div", "word-box");
    const wordTitle = el("div", "word-title");
    wordTitle.append(el("span", "word-label", item.word), createAudioButton(item.word));
    wordBox.append(wordTitle);

    const contextBox = el("div", "context-box");
    const sentence = el("div", "context-sentence");
    if (item.errorContext) appendContext(sentence, item.errorContext);
    else sentence.textContent = "—";
    contextBox.append(sentence);
    const source = sourceOverride || item.errorContext?.source || item.sources[0] || "—";
    const sourceUrl = sourceUrlOverride || item.errorContext?.url || item.errorExamples?.[primaryType(item)]?.url || item.sourceUrls?.[0] || "";
    contextBox.append(createSourceLink(source, sourceUrl));

    const summary = el("div", "error-summary");
    summary.append(
      el("strong", "", tr("dictationStatsErrorCountLine", { errors:item.errors })),
      el("span", "error-fix", tr("dictationStatsErrorFixesLine", { fixes:item.fixes })),
      el("span", "error-rate", tr("dictationStatsErrorRateLine", { rate:displayedErrorRate(item) })),
    );
    const typeBox = el("div", "error-type-box");
    typeBox.append(createTypeTag(item));
    card.append(wordBox, contextBox, createVariants(item), typeBox, summary);
    return card;
  }
  function makeCard(item, options) {
    const card = createSmartCard(item, options);
    const type = primaryType(item);
    card.dataset.type = type;
    card.dataset.errors = String(item.errors);
    card.dataset.recent = String(item.lastAt);
    card.dataset.rate = String(displayedErrorRate(item));
    return card;
  }
  function createVideoFavicon(session) {
    const host = el("span", "video-favicon");
    host.setAttribute("aria-hidden", "true");
    const image = document.createElement("img");
    image.alt = "";
    image.hidden = true;
    image.referrerPolicy = "no-referrer";
    const fallbackIcon = el("span", "video-favicon-fallback", "?");
    let hostname = "";
    try { hostname = new URL(session.url).hostname; } catch {}
    const isYoutube = /(^|\.)youtube\.com$|(^|\.)youtu\.be$/i.test(hostname);
    fallbackIcon.textContent = isYoutube ? "▶" : "?";
    if (isYoutube) host.classList.add("is-youtube");
    host.append(image, fallbackIcon);
    if (window.LHN_SITE_ICONS) void window.LHN_SITE_ICONS.load(image, session.url, { fallbackElement:fallbackIcon });
    return host;
  }
  function renderGlobalList(items, listNode) {
    listNode.replaceChildren(createSmartCardLabels());
    if (!items.length) {
      listNode.append(el("div", "empty", `🌸 ${tr("dictationStatsEmpty")}`));
      return;
    }
    items.forEach(item => listNode.append(makeCard(item)));
  }
  function sortedItems(items, order) {
    const list = [...items];
    if (order === "errors") list.sort((a, b) => b.errors - a.errors || b.lastAt - a.lastAt || a.word.localeCompare(b.word));
    else if (order === "recent") list.sort((a, b) => b.lastAt - a.lastAt || b.errors - a.errors || a.word.localeCompare(b.word));
    else list.sort((a, b) => calculateErrorRate(b.errors, b.fixes) - calculateErrorRate(a.errors, a.fixes) || b.errors - a.errors || b.lastAt - a.lastAt || a.word.localeCompare(b.word));
    return list;
  }
  function renderGlobal() {
    const items = globalWords.map(item => viewForType(item, globalType)).filter(Boolean).filter(item => matchesSearch(item));
    renderGlobalList(sortedItems(items, globalSort), $("#globalList"));
  }
  function renderCritical() {
    const items = globalWords.map(item => viewForType(item, criticalType)).filter(Boolean).filter(isCritical).filter(item => matchesSearch(item));
    renderGlobalList(sortedItems(items, criticalSort), $("#criticalList"));
  }
  function updateAccordion(body, toggle, title) {
    const collapsed = body.classList.toggle("collapsed");
    toggle.setAttribute("aria-expanded", String(!collapsed));
    toggle.setAttribute("aria-label", tr(collapsed ? "dictationStatsExpandVideo" : "dictationStatsCollapseVideo", { title }));
    body.setAttribute("aria-hidden", String(collapsed));
    body.inert = collapsed;
    const chevron = toggle.querySelector(".chevron");
    if (chevron) chevron.innerHTML = collapsed ? CHEVRON_RIGHT_SVG : CHEVRON_DOWN_SVG;
  }
  function renderSessions() {
    const list = $("#sessionList");
    list.replaceChildren();
    const visibleSessions = sessions.map(session => ({
      session,
      words:session.words.map(item => viewForType(item, globalType)).filter(Boolean)
        .filter(item => matchesSearch(item, session.title, session.url)),
    })).filter(entry => entry.words.length);
    if (!visibleSessions.length) {
      list.append(el("div", "empty", `🌸 ${tr("dictationStatsEmpty")}`));
      return;
    }
    visibleSessions.forEach(({ session, words }, index) => {
      const group = el("section", "video-group");
      const head = el("div", "web-head");
      const titleGroup = el("div", "web-title-group");
      titleGroup.append(createVideoFavicon(session));
      const href = safeVideoUrl(session.url);
      if (href) {
        const title = el("a", "video-title", session.title);
        title.href = href;
        title.target = "_blank";
        title.rel = "noopener noreferrer";
        title.title = session.title;
        titleGroup.append(title);
      } else {
        titleGroup.append(el("span", "video-title video-title-text", session.title));
      }
      const toggle = el("button", "video-toggle");
      toggle.type = "button";
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", tr("dictationStatsCollapseVideo", { title:session.title }));
      const chevron = el("span", "chevron");
      chevron.innerHTML = CHEVRON_DOWN_SVG;
      chevron.setAttribute("aria-hidden", "true");
      toggle.append(chevron);
      head.append(titleGroup, toggle);

      const body = el("div", "video-body");
      const bodyId = `video-body-${(session.id || `session-${index}`).replace(/[^A-Za-z0-9_-]/g, "-")}`;
      body.id = bodyId;
      toggle.setAttribute("aria-controls", bodyId);
      const inner = el("div", "video-body-inner");
      inner.append(createSmartCardLabels());
      sortedItems(words, "errors").forEach(item => inner.append(makeCard(item, {
        sourceOverride:session.title,
        sourceUrlOverride:session.url,
      })));
      body.append(inner);
      toggle.addEventListener("click", event => { event.stopPropagation(); updateAccordion(body, toggle, session.title); });
      head.addEventListener("click", event => { if (event.target.closest(".video-title")) return; updateAccordion(body, toggle, session.title); });
      group.append(head, body);
      list.append(group);
    });
  }
  function syncToolbar() {
    const critical = currentView === "critical";
    $("#globalFilterPills").hidden = critical;
    $("#criticalFilterPills").hidden = !critical;
    $("#sortSelect").hidden = critical;
    $("#criticalSortSelect").hidden = !critical;
    $("#criticalThreshold").hidden = !critical;
  }
  function render() {
    renderGlobal();
    renderCritical();
    renderSessions();
    document.querySelectorAll(".view-pane[data-pane]").forEach(pane => { pane.hidden = pane.dataset.pane !== currentView; });
    document.querySelectorAll(".view-tab").forEach(tab => {
      const active = tab.dataset.view === currentView;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-pressed", String(active));
    });
    syncToolbar();
    renderMetrics();
  }
  document.querySelectorAll(".view-tab").forEach(button => button.addEventListener("click", () => {
    currentView = ["global", "critical", "sessions"].includes(button.dataset.view) ? button.dataset.view : "global";
    render();
  }));
  document.querySelectorAll("#globalFilterPills .filter").forEach(button => button.addEventListener("click", () => {
    globalType = button.dataset.type || "all";
    document.querySelectorAll("#globalFilterPills .filter").forEach(filter => {
      const active = filter === button;
      filter.classList.toggle("active", active);
      filter.setAttribute("aria-pressed", String(active));
    });
    render();
  }));
  document.querySelectorAll("#criticalFilterPills .filter").forEach(button => button.addEventListener("click", () => {
    criticalType = button.dataset.criticalType || "all";
    document.querySelectorAll("#criticalFilterPills .filter").forEach(filter => {
      const active = filter === button;
      filter.classList.toggle("active", active);
      filter.setAttribute("aria-pressed", String(active));
    });
    render();
  }));
  const globalSortSelect = $("#sortSelect"), criticalSortSelect = $("#criticalSortSelect");
  globalSortSelect?.addEventListener("change", () => { globalSort = globalSortSelect.value || "rate"; renderGlobal(); });
  criticalSortSelect?.addEventListener("change", () => { criticalSort = criticalSortSelect.value || "rate"; renderCritical(); });
  searchInput?.addEventListener("input", () => { searchTerm = searchInput.value; render(); });

  function closeModal() {
    backdrop.classList.add("closed");
    reopen?.classList.add("visible");
    window.parent?.postMessage({ type:"KEEPIT_DICTATION_STATS_CLOSE" }, location.origin);
  }
  function updateExpandButton(expanded) {
    if (!expandBtn) return;
    const label = tr(expanded ? "dictationStatsPopupRestore" : "dictationStatsPopupExpand");
    expandBtn.setAttribute("aria-pressed", String(expanded));
    expandBtn.setAttribute("aria-label", label);
    expandBtn.title = label;
    expandBtn.innerHTML = expanded ? SHRINK_ICON : EXPAND_ICON;
  }
  function applyPopupTheme(dark) {
    if (typeof dark === "boolean") document.documentElement.classList.toggle("dark", dark);
  }
  function openModal(lang, snapshot, dark) {
    applyPopupTheme(dark);
    applyTranslations(lang);
    if (snapshot) setStatsSnapshot(snapshot);
    document.body.classList.add("embedded");
    backdrop.classList.remove("closed");
    reopen?.classList.remove("visible");
    closeX?.focus();
  }
  closeX?.addEventListener("click", closeModal);
  reopen?.addEventListener("click", () => openModal(document.documentElement.lang));
  expandBtn?.addEventListener("click", () => {
    const expanded = modal.classList.toggle("is-expanded");
    updateExpandButton(expanded);
  });
  backdrop.addEventListener("click", event => { if (event.target === backdrop) closeModal(); });
  window.addEventListener("message", event => {
    if (event.source !== window.parent || event.origin !== location.origin) return;
    if (event.data?.type === "KEEPIT_DICTATION_STATS_OPEN") {
      openModal(event.data.lang, event.data.stats, event.data.dark);
      return;
    }
    if (event.data?.type === "KEEPIT_DICTATION_STATS_UPDATE") {
      applyPopupTheme(event.data.dark);
      setStatsSnapshot(event.data.stats);
    }
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
  updateExpandButton(false);
  render();
})();
