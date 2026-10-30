(() => {
  const $ = selector => document.querySelector(selector);
  const modal = $(".modal"), backdrop = $("#backdrop"), content = $("#contentContainer");
  const expandButton = $("#expandPopup"), closeX = $("#closeX"), closeDone = $("#closeDone"), reopen = $("#reopen");
  if (!modal || !backdrop || !content) return;

  // Static sample content matches the supplied UI prototype. This popup is UI-only for this release.
  const errorDatabase = [
    { word:"environment", type:"rule", errors:6, rate:75, context:"protect our natural enviroment.", wrong:"enviroment", source:"How to Build Better Habits", variants:["enviroment (×4)"], recent:5 },
    { word:"receive", type:"phonetic", errors:4, rate:80, context:"You will recieve an email.", wrong:"recieve", source:"The Science of Sleep", variants:["recieve (×3)"], recent:4 },
    { word:"necessary", type:"rule", errors:3, rate:60, context:"Sleep is neccessary for memory.", wrong:"neccessary", source:"The Science of Sleep", variants:["neccessary (×2)"], recent:3 },
    { word:"definitely", type:"typo", errors:3, rate:45, context:"I will definatly join.", wrong:"definatly", source:"Everyday Habits", variants:["definatly (×3)"], recent:2 },
    { word:"successful", type:"phonetic", errors:2, rate:30, context:"A sucessful transition.", wrong:"sucessful", source:"How to Build Better Habits", variants:["sucessful (×2)"], recent:1 }
  ];
  const typeKeys = { phonetic:"dictationStatsTypePhonetic", rule:"dictationStatsTypeRule", typo:"dictationStatsTypeTypo" };
  let currentView = "global", currentType = "all", currentSort = "errors";
  let lastFocus = null;
  const fallback = {
    dictationStatsContextLabel:"Ngữ cảnh:", dictationStatsSourceLabel:"📺 Nguồn:", dictationStatsVariantsLabel:"Biến thể gõ:",
    dictationStatsErrorSummary:"Sai: {errors} lần (Tỷ lệ: {rate}%)", dictationStatsSessionSource:"📺 Nguồn: {source}",
    dictationStatsSessionWord:"• Từ: {word}", dictationStatsAudioLabel:"Phát âm từ {word}"
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
  function typeLabel(type) { return tr(typeKeys[type] || "dictationStatsFilterAll"); }
  function appendHighlightedContext(node, sentence, wrong) {
    const lower = sentence.toLocaleLowerCase();
    const index = lower.indexOf(wrong.toLocaleLowerCase());
    if (index < 0) { node.textContent = `“${sentence}”`; return; }
    node.append(document.createTextNode(`“${sentence.slice(0, index)}`));
    const mark = el("span", "", sentence.slice(index, index + wrong.length));
    node.append(mark, document.createTextNode(`${sentence.slice(index + wrong.length)}”`));
  }
  function createGlobalCard(item) {
    const card = el("article", "smart-card");
    const targetBox = el("div", "word-target-box"), target = el("div", "word-target");
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
    const type = el("span", `error-type-tag ${item.type}`, typeLabel(item.type));
    const counts = el("div", "sample-error-summary", tr("dictationStatsErrorSummary", { errors:item.errors, rate:item.rate }));
    targetBox.append(target, type, counts);

    const sourceBox = el("div", "source-box"), contextLabel = el("div", "source-label", tr("dictationStatsContextLabel"));
    const context = el("div", "context-sentence");
    appendHighlightedContext(context, item.context, item.wrong);
    const source = el("div", "sample-source", tr("dictationStatsSourceLabel") + " " + item.source);
    sourceBox.append(contextLabel, context, source);

    const variantBox = el("div", "variants-tag-box"), variantLabel = el("div", "variants-label", tr("dictationStatsVariantsLabel")), variants = el("div", "bad-variants");
    item.variants.forEach(variant => variants.append(el("span", "bad-chip", variant)));
    variantBox.append(variantLabel, variants);
    card.append(targetBox, sourceBox, variantBox);
    return card;
  }
  function renderSessionView() {
    const sessions = new Map();
    errorDatabase.forEach(item => {
      if (!sessions.has(item.source)) sessions.set(item.source, []);
      sessions.get(item.source).push(item);
    });
    for (const [source, words] of sessions) {
      const group = el("section", "session-group"), head = el("button", "session-head"), label = el("span", "session-source");
      head.type = "button";
      label.textContent = tr("dictationStatsSessionSource", { source });
      const caret = el("span", "session-caret", "▼");
      head.append(label, caret);
      const body = el("div", "session-body");
      words.forEach(item => {
        const row = el("div", "session-word-row", tr("dictationStatsSessionWord", { word:item.word }));
        const badge = el("span", `error-type-tag ${item.type}`, typeLabel(item.type));
        row.append(badge);
        body.append(row);
      });
      head.setAttribute("aria-expanded", "true");
      head.addEventListener("click", () => {
        const collapsed = body.classList.toggle("collapsed");
        head.setAttribute("aria-expanded", String(!collapsed));
      });
      group.append(head, body);
      content.append(group);
    }
  }
  function render() {
    content.replaceChildren();
    const toolbar = $("#toolbarCard");
    if (toolbar) toolbar.style.display = currentView === "sessions" ? "none" : "flex";
    if (currentView === "sessions") { renderSessionView(); return; }
    let list = errorDatabase.filter(item => {
      if (currentView === "critical" && !(item.rate >= 70 && item.errors >= 3)) return false;
      return currentType === "all" || item.type === currentType;
    });
    if (currentSort === "errors") list = [...list].sort((a, b) => b.errors - a.errors || a.word.localeCompare(b.word));
    else if (currentSort === "recent") list = [...list].sort((a, b) => b.recent - a.recent);
    else list = [...list].sort((a, b) => a.word.localeCompare(b.word));
    if (!list.length) { content.append(el("div", "empty-state", "🌸 " + tr("dictationStatsEmpty"))); return; }
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
  function openModal(lang) {
    applyTranslations(lang);
    document.body.classList.add("embedded");
    backdrop.classList.remove("closed");
    reopen?.classList.remove("visible");
    lastFocus = document.activeElement;
    closeX?.focus();
  }
  closeX?.addEventListener("click", closeModal);
  closeDone?.addEventListener("click", closeModal);
  reopen?.addEventListener("click", () => openModal());
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
    if (event.source !== window.parent || event.origin !== location.origin || event.data?.type !== "KEEPIT_DICTATION_STATS_OPEN") return;
    openModal(event.data.lang);
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
