// Dictation v1 uses the live YouTube video and Dual Sub's English caption track.
// It transforms the existing overlay in place; it does not create a second overlay.
(() => {
  const ext = globalThis.browser || globalThis.chrome;
  let A = null;
  let ui = null;
  let active = false;
  let openingPanel = false;
  let current = 0;
  let checkedCurrent = false;
  let savedPageScrollStyles = null;
  let listStart = 0;
  let listEnd = 0;
  let sentenceCues = [];
  let videoId = "";
  let solved = new Set();
  let notes = {};
  let translations = {};
  let wrongWordStats = { version: 1, words: {} };
  let stopAt = -1;
  let attachedVideo = null;
  let ctrlAlone = false;
  let escapeFilledAnswer = false;
  let panelGeneration = 0;
  let saveTimer = 0;
  let toastTimer = 0;
  let rafId = 0;
  let repeatLeft = 0;
  let repeatCount = 3;
  let hintResult = null;
  let savedRate = null;
  let savedLoop = null;
  let audioCtx = null;
  const translating = new Map();

  const language = () => {
    const candidate = A?.lang?.();
    return ["en", "vi", "ko"].includes(candidate) ? candidate : (globalThis.LHN_LANGUAGES?.detectLanguage?.() || "en");
  };
  const tr = (key) => globalThis.LHN_LANGUAGES?.t?.(key, {}, language()) || key;
  const currentVideoId = () => String(A?.state?.videoId || "");
  const storageKey = () => `dictation:${videoId}`;
  const getCues = () => {
    const list = A?.getDictationCues?.();
    return Array.isArray(list) ? list.filter((cue) => cue && typeof cue.en === "string" && cue.en.trim()) : [];
  };
  const isEnglishReady = () => A?.state?.captionTrackLanguage === "en" && getCues().length > 0;
  const dictationLayoutStorageKey = "dictation:layout:v1";
  const dictationLayoutPrefs = { leftScale: 1, rightScale: 1, leftHidden: false, rightHidden: false };
  let dictationLayoutLoadPromise = null;

  function clampDictationColumn(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  async function loadDictationLayoutPrefs() {
    if (!dictationLayoutLoadPromise) {
      dictationLayoutLoadPromise = (async () => {
        try {
          const result = await ext.storage.local.get(dictationLayoutStorageKey);
          const stored = result?.[dictationLayoutStorageKey];
          if (!stored || typeof stored !== "object") return;
          const leftScale = Number(stored.leftScale);
          const rightScale = Number(stored.rightScale);
          if (Number.isFinite(leftScale)) dictationLayoutPrefs.leftScale = clampDictationColumn(leftScale, 2 / 3, 1);
          if (Number.isFinite(rightScale)) dictationLayoutPrefs.rightScale = clampDictationColumn(rightScale, 1, 1.5);
          dictationLayoutPrefs.leftHidden = stored.leftHidden === true;
          dictationLayoutPrefs.rightHidden = stored.rightHidden === true;
        } catch (error) {
          console.warn("Could not load Dictation column layout", error);
        }
      })();
    }
    await dictationLayoutLoadPromise;
  }

  function persistDictationLayoutPrefs() {
    try {
      const result = ext.storage.local.set({
        [dictationLayoutStorageKey]: { version: 1, ...dictationLayoutPrefs },
      });
      result?.catch?.((error) => console.warn("Could not save Dictation column layout", error));
    } catch (error) {
      console.warn("Could not save Dictation column layout", error);
    }
  }

  function getDictationColumnMetrics() {
    const width = Math.max(0, ui?.root?.clientWidth || ui?.root?.getBoundingClientRect?.().width || 0);
    const available = Math.max(0, width - 16);
    const scale = Math.min(1, available / 880);
    const minLeft = 220 * scale;
    const minCenter = 380 * scale;
    const minRight = 280 * scale;
    let baseLeft = Math.max(minLeft, available * .32);
    let baseRight = Math.max(minRight, available * .23);
    const sideBudget = Math.max(0, available - minCenter);
    const excess = Math.max(0, baseLeft + baseRight - sideBudget);
    if (excess > 0) {
      const leftRoom = Math.max(0, baseLeft - minLeft);
      const rightRoom = Math.max(0, baseRight - minRight);
      const totalRoom = leftRoom + rightRoom;
      if (totalRoom > 0) {
        baseLeft -= Math.min(leftRoom, excess * leftRoom / totalRoom);
        baseRight -= Math.min(rightRoom, excess * rightRoom / totalRoom);
      }
    }
    return { width, minLeft, minCenter, minRight, baseLeft, baseRight };
  }

  function getDictationColumnState() {
    const metrics = getDictationColumnMetrics();
    const leftSplitterWidth = dictationLayoutPrefs.leftHidden ? 0 : 8;
    const rightSplitterWidth = dictationLayoutPrefs.rightHidden ? 0 : 8;
    const leftRailWidth = dictationLayoutPrefs.leftHidden ? 24 : 0;
    const rightRailWidth = dictationLayoutPrefs.rightHidden ? 24 : 0;
    const panelBudget = Math.max(0, metrics.width - leftSplitterWidth - rightSplitterWidth - leftRailWidth - rightRailWidth);
    const leftWidth = dictationLayoutPrefs.leftHidden ? 0 : clampDictationColumn(
      metrics.baseLeft * dictationLayoutPrefs.leftScale, Math.max(metrics.minLeft, metrics.baseLeft * 2 / 3), metrics.baseLeft
    );
    const rightMaximum = Math.max(metrics.baseRight, Math.min(
      metrics.baseRight * 1.5, panelBudget - leftWidth - metrics.minCenter
    ));
    const rightWidth = dictationLayoutPrefs.rightHidden ? 0 : clampDictationColumn(
      metrics.baseRight * dictationLayoutPrefs.rightScale, metrics.baseRight, rightMaximum
    );
    return {
      ...metrics,
      leftWidth,
      rightWidth,
      leftTrackWidth: dictationLayoutPrefs.leftHidden ? 24 : leftWidth,
      rightTrackWidth: dictationLayoutPrefs.rightHidden ? 24 : rightWidth,
      leftSplitterWidth,
      rightSplitterWidth,
      leftHidden: dictationLayoutPrefs.leftHidden,
      rightHidden: dictationLayoutPrefs.rightHidden,
    };
  }

  function getDictationColumnBounds(side, state = getDictationColumnState()) {
    if (side === "left") {
      const minimum = Math.max(state.minLeft, state.baseLeft * 2 / 3);
      const maximum = Math.min(state.baseLeft,
        state.width - state.leftSplitterWidth - state.rightSplitterWidth - state.rightTrackWidth - state.minCenter);
      return { minimum, maximum: Math.max(minimum, maximum) };
    }
    const minimum = state.baseRight;
    const maximum = Math.min(state.baseRight * 1.5,
      state.width - state.leftTrackWidth - state.leftSplitterWidth - state.rightSplitterWidth - state.minCenter);
    return { minimum, maximum: Math.max(minimum, maximum) };
  }

  function updateDictationSplitterAccessibility(splitter, side, state) {
    if (!splitter) return;
    const bounds = getDictationColumnBounds(side, state);
    const value = side === "left" ? state.leftWidth : state.rightWidth;
    splitter.setAttribute("aria-valuemin", String(Math.round(bounds.minimum)));
    splitter.setAttribute("aria-valuemax", String(Math.round(bounds.maximum)));
    splitter.setAttribute("aria-valuenow", String(Math.round(value)));
    splitter.setAttribute("aria-valuetext", `${Math.round(value)} px`);
  }

  function applyDictationColumnLayout() {
    if (!ui?.root) return;
    const state = getDictationColumnState();
    const root = ui.root;
    root.style.setProperty("--te-dict-left-track", `${state.leftTrackWidth}px`);
    root.style.setProperty("--te-dict-right-track", `${state.rightTrackWidth}px`);
    root.style.setProperty("--te-dict-left-splitter", `${state.leftSplitterWidth}px`);
    root.style.setProperty("--te-dict-right-splitter", `${state.rightSplitterWidth}px`);
    root.style.setProperty("--te-dict-center-min", `${state.minCenter}px`);
    root.classList.toggle("te-dict-column-left-hidden", state.leftHidden);
    root.classList.toggle("te-dict-column-right-hidden", state.rightHidden);
    ui.left.setAttribute("aria-hidden", String(state.leftHidden));
    ui.notesPanel.setAttribute("aria-hidden", String(state.rightHidden));
    const labels = [
      [ui.hideLeftColumn, "dictationHideSentencesColumn"],
      [ui.showLeftColumn, "dictationShowSentencesColumn"],
      [ui.hideRightColumn, "dictationHideNotesColumn"],
      [ui.showRightColumn, "dictationShowNotesColumn"],
    ];
    for (const [button, key] of labels) {
      if (!button) continue;
      button.setAttribute("aria-label", tr(key));
      button.title = tr(key);
    }
    ui.hideLeftColumn.setAttribute("aria-controls", "te-dict-sentence-area");
    ui.hideRightColumn.setAttribute("aria-controls", "te-dictation-notes");
    ui.showLeftColumn.setAttribute("aria-controls", "te-dict-sentence-area");
    ui.showRightColumn.setAttribute("aria-controls", "te-dictation-notes");
    ui.hideLeftColumn.setAttribute("aria-expanded", String(!state.leftHidden));
    ui.hideRightColumn.setAttribute("aria-expanded", String(!state.rightHidden));
    ui.showLeftColumn.setAttribute("aria-expanded", String(!state.leftHidden));
    ui.showRightColumn.setAttribute("aria-expanded", String(!state.rightHidden));
    updateDictationSplitterAccessibility(ui.leftColumnSplitter, "left", state);
    updateDictationSplitterAccessibility(ui.rightColumnSplitter, "right", state);
  }

  function setDictationColumnWidth(side, requestedWidth, persist = false) {
    const state = getDictationColumnState();
    const bounds = getDictationColumnBounds(side, state);
    const width = clampDictationColumn(requestedWidth, bounds.minimum, bounds.maximum);
    if (side === "left" && state.baseLeft > 0) dictationLayoutPrefs.leftScale = clampDictationColumn(width / state.baseLeft, 2 / 3, 1);
    if (side === "right" && state.baseRight > 0) dictationLayoutPrefs.rightScale = clampDictationColumn(width / state.baseRight, 1, 1.5);
    applyDictationColumnLayout();
    if (persist) persistDictationLayoutPrefs();
  }

  function setDictationColumnHidden(side, hidden) {
    if (side === "left") dictationLayoutPrefs.leftHidden = hidden;
    else dictationLayoutPrefs.rightHidden = hidden;
    applyDictationColumnLayout();
    const focusTarget = side === "left"
      ? (hidden ? ui.showLeftColumn : ui.hideLeftColumn)
      : (hidden ? ui.showRightColumn : ui.hideRightColumn);
    focusTarget?.focus?.({ preventScroll: true });
    persistDictationLayoutPrefs();
  }

  function resetDictationColumnWidth(side) {
    if (side === "left") dictationLayoutPrefs.leftScale = 1;
    else dictationLayoutPrefs.rightScale = 1;
    applyDictationColumnLayout();
    persistDictationLayoutPrefs();
  }

  function beginDictationColumnDrag(event, side, splitter) {
    if (event.button !== 0) return;
    event.preventDefault();
    const state = getDictationColumnState();
    const startX = event.clientX;
    const startWidth = side === "left" ? state.leftWidth : state.rightWidth;
    const pointerId = event.pointerId;
    splitter.focus?.({ preventScroll: true });
    splitter.classList.add("is-dragging");
    splitter.setPointerCapture?.(pointerId);
    const onMove = (moveEvent) => {
      if (moveEvent.pointerId !== pointerId) return;
      const delta = moveEvent.clientX - startX;
      setDictationColumnWidth(side, startWidth + (side === "left" ? delta : -delta));
    };
    const finish = (finishEvent) => {
      if (finishEvent.pointerId !== pointerId) return;
      splitter.removeEventListener("pointermove", onMove);
      splitter.removeEventListener("pointerup", finish);
      splitter.removeEventListener("pointercancel", finish);
      splitter.classList.remove("is-dragging");
      if (splitter.hasPointerCapture?.(pointerId)) splitter.releasePointerCapture(pointerId);
      persistDictationLayoutPrefs();
    };
    splitter.addEventListener("pointermove", onMove);
    splitter.addEventListener("pointerup", finish);
    splitter.addEventListener("pointercancel", finish);
  }

  function onDictationSplitterKeyDown(event, side) {
    const bounds = getDictationColumnBounds(side);
    const state = getDictationColumnState();
    const currentWidth = side === "left" ? state.leftWidth : state.rightWidth;
    let target = null;
    if (event.key === "Home") target = bounds.minimum;
    else if (event.key === "End") target = bounds.maximum;
    else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      const direction = event.key === "ArrowRight" ? 1 : -1;
      const step = event.shiftKey ? 48 : 16;
      target = currentWidth + direction * step * (side === "left" ? 1 : -1);
    } else return;
    event.preventDefault();
    setDictationColumnWidth(side, target, true);
  }

  function installDictationColumnControls() {
    if (!ui) return;
    for (const [splitter, side] of [[ui.leftColumnSplitter, "left"], [ui.rightColumnSplitter, "right"]]) {
      splitter.addEventListener("pointerdown", (event) => beginDictationColumnDrag(event, side, splitter));
      splitter.addEventListener("dblclick", (event) => { event.preventDefault(); resetDictationColumnWidth(side); });
      splitter.addEventListener("keydown", (event) => onDictationSplitterKeyDown(event, side));
    }
    ui.hideLeftColumn.addEventListener("click", () => setDictationColumnHidden("left", true));
    ui.hideRightColumn.addEventListener("click", () => setDictationColumnHidden("right", true));
    ui.showLeftColumn.addEventListener("click", () => setDictationColumnHidden("left", false));
    ui.showRightColumn.addEventListener("click", () => setDictationColumnHidden("right", false));
  }

  function ensureStyle(root = A?.overlayEl?.()) {
    if (!root || root.querySelector("#te-dictation-style")) return;
    const style = document.createElement("style");
    style.id = "te-dictation-style";
    style.textContent = globalThis.LHN_DICTATION_CSS || "";
    root.prepend(style);
  }

  function hideYouTubeScrollbar() {
    if (savedPageScrollStyles) return;
    const html = document.documentElement;
    const body = document.body;
    const snapshot = (element) => element ? {
      value: element.style.getPropertyValue("overflow-y"),
      priority: element.style.getPropertyPriority("overflow-y"),
    } : null;
    savedPageScrollStyles = { html, body, htmlStyle: snapshot(html), bodyStyle: snapshot(body) };
    html?.style.setProperty("overflow-y", "hidden", "important");
    body?.style.setProperty("overflow-y", "hidden", "important");
  }

  function restoreYouTubeScrollbar() {
    if (!savedPageScrollStyles) return;
    const restore = (element, style) => {
      if (!element || !style) return;
      if (style.value) element.style.setProperty("overflow-y", style.value, style.priority);
      else element.style.removeProperty("overflow-y");
    };
    restore(savedPageScrollStyles.html, savedPageScrollStyles.htmlStyle);
    restore(savedPageScrollStyles.body, savedPageScrollStyles.bodyStyle);
    savedPageScrollStyles = null;
  }

  function showToast(message) {
    const root = A?.overlayEl?.();
    if (!root) return;
    ensureStyle(root);
    let toast = root.querySelector("#te-dict-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "te-dict-toast";
      toast.className = "te-dict-toast";
      toast.setAttribute("role", "status");
      root.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("visible"), 3200);
  }

  function makeSvg(path) {
    return `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
  }

  function build() {
    if (ui) return;
    const root = A?.overlayEl?.();
    const left = root?.querySelector(".te-left-section");
    const bar = root?.querySelector(".te-control-bar");
    const groups = bar?.querySelectorAll(".te-ctrl-group");
    const primaryGroup = groups?.[0];
    const videoSlot = left?.querySelector(".te-video-slot");
    if (!root || !left || !bar || !primaryGroup || !videoSlot) return;
    ensureStyle(root);

    const compactAudio = document.createElement("div");
    compactAudio.className = "te-dict-mini-audio";
    compactAudio.setAttribute("role", "group");
    compactAudio.setAttribute("aria-label", tr("dictationAudioTitle"));
    compactAudio.innerHTML = `
      <div class="te-dict-mini-art"><img class="te-dict-mini-thumb" alt=""></div>
      <div class="te-dict-mini-info"><div class="te-dict-mini-title"></div><div class="te-dict-mini-source"></div></div>
      <div class="te-dict-spectrum" aria-hidden="true">${Array.from({ length: 5 }, () => '<span></span>').join("")}</div>
      <button class="te-dict-mini-play" type="button"><span class="te-dict-mini-play-icon">${makeSvg('<path d="M8 5v14l11-7z"/>')}</span></button>`;
    videoSlot.appendChild(compactAudio);

    const brand = document.createElement("div");
    brand.className = "te-dict-brand";
    brand.setAttribute("role", "img");
    brand.setAttribute("aria-label", "Keepit");
    const brandIcon = document.createElement("img");
    brandIcon.src = ext.runtime.getURL("assets/icons/icon.svg");
    brandIcon.alt = "";
    brandIcon.setAttribute("aria-hidden", "true");
    const brandSeparator = document.createElement("span");
    brandSeparator.className = "te-dict-brand-separator";
    brandSeparator.textContent = "-";
    const brandName = document.createElement("span");
    brandName.className = "te-dict-brand-name";
    brandName.textContent = "Keepit";
    brand.append(brandIcon, brandSeparator, brandName);
    videoSlot.appendChild(brand);

    const sentenceArea = document.createElement("section");
    sentenceArea.id = "te-dict-sentence-area";
    sentenceArea.setAttribute("aria-label", tr("dictationSentences"));
    sentenceArea.innerHTML = `
      <div id="te-dict-sentence-head">
        <h2 class="te-dict-heading" data-dict-label="dictationSentences"></h2>
        <button class="te-dict-column-toggle" id="te-dict-hide-sentences" type="button">${makeSvg('<path d="m14 7-5 5 5 5"/>')}</button>
        <span class="te-dict-counter" id="te-dict-counter" aria-live="polite">0/0</span>
      </div>
      <div id="te-dict-sentences" role="list"></div>`;
    const subtitleBox = left.querySelector(".te-sub-container");
    left.insertBefore(sentenceArea, subtitleBox || null);

    const center = document.createElement("section");
    center.id = "te-dictation-center";
    center.innerHTML = `
      <div class="te-dict-panel-head">
        <h2 class="te-dict-heading">${makeSvg('<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h.01M11 10h.01M15 10h.01M8 14h8"/>')}<span data-dict-label="dictationTitle"></span></h2>
        <span class="te-dict-acc"><span class="te-dict-acc-label" data-dict-label="dictationAccuracy"></span><span class="te-dict-score" id="te-dict-score">---</span></span>
      </div>
      <div class="te-dict-center-body">
        <div class="te-dict-audio-card">
          <button class="te-dict-audio-btn" id="te-dict-audio-btn" type="button">${makeSvg('<path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>')}</button>
          <div class="te-dict-audio-text">
            <div class="te-dict-audio-title"><span data-dict-label="dictationAudioTitle"></span><span class="te-dict-chip" data-dict-label="dictationAudioSource"></span></div>
            <p data-dict-label="dictationAudioHelp"></p>
          </div>
          <button class="te-dict-video-toggle" id="te-dict-video-toggle" type="button" aria-pressed="false"></button>
          <button class="te-dict-hints-toggle active" id="te-dict-show-hints" type="button" aria-pressed="true" aria-label="" title="">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-lightbulb preview-icon" aria-hidden="true"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
          </button>
        </div>
        <div class="te-dict-work">
          <div class="te-dict-success" id="te-dict-success" role="status" hidden>${makeSvg('<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>')}<span data-dict-label="dictationSuccess"></span></div>
          <div class="te-dict-answer-stack">
            <div class="te-dict-input-wrap">
              <textarea class="te-dict-input" id="te-dict-input" rows="3" autocomplete="off" autocapitalize="off" spellcheck="false"></textarea>
              <div class="te-dict-input-markup" id="te-dict-input-markup" aria-hidden="true" hidden><div class="te-dict-input-markup-content" id="te-dict-input-markup-content"></div></div>
            </div>
            <div class="te-dict-hint" id="te-dict-hint"></div>
            <div class="te-dict-error" id="te-dict-error" hidden>
              <div class="te-dict-error-title">${makeSvg('<circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/>')}<span data-dict-label="dictationErrorTitle"></span></div>
              <div class="te-dict-error-words" id="te-dict-error-words"></div>
            </div>
          </div>
          <div class="te-dict-translation" id="te-dict-translation" hidden></div>
        </div>
      </div>
      <div class="te-dict-footer">
        <div class="te-dict-repeat">
          <span class="te-dict-repeat-label" data-dict-label="dictationRepeat"></span>
          ${[0, 1, 2, 3].map((n) => `<button type="button" class="te-dict-repeat-btn${n === repeatCount ? " active" : ""}" data-count="${n}">${n}x</button>`).join("")}
        </div>
        <div class="te-dict-actions">
          <button type="button" class="te-dict-act" id="te-dict-btn-prev">${makeSvg('<path d="m15 6-6 6 6 6"/>')}<span data-dict-label="dictationPrev"></span></button>
          <button type="button" class="te-dict-act" id="te-dict-btn-replay">${makeSvg('<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/>')}<span data-dict-label="dictationReplay"></span></button>
          <button type="button" class="te-dict-act te-dict-act-primary" id="te-dict-check">${makeSvg('<path d="m5 12 5 5 9-10"/>')}<span data-dict-label="dictationCheck"></span></button>
          <button type="button" class="te-dict-act" id="te-dict-btn-slow">${makeSvg('<path d="M12 14l4-4"/><path d="M3.3 16a9 9 0 1 1 17.4 0"/>')}<span data-dict-label="dictationSlow"></span></button>
          <button type="button" class="te-dict-act" id="te-dict-btn-next"><span data-dict-label="dictationNext"></span>${makeSvg('<path d="m9 6 6 6-6 6"/>')}</button>
        </div>
      </div>`;

    const notesPanel = document.createElement("section");
    notesPanel.id = "te-dictation-notes";
    notesPanel.innerHTML = `
      <div class="te-dict-panel-head">
        <h2 class="te-dict-heading">${makeSvg('<path d="M5 4h14v11l-5 5H5z"/><path d="M14 20v-5h5"/>')}<span data-dict-label="dictationLessonNotes"></span></h2>
        <div class="te-dict-head-actions">
          <button class="te-dict-column-toggle" id="te-dict-hide-notes" type="button">${makeSvg('<path d="m10 7 5 5-5 5"/>')}</button>
          <button class="te-dict-save" id="te-dict-save" type="button"></button>
          <button class="yt-dual-close-btn te-dict-close" id="te-dict-close" type="button"><span aria-hidden="true">×</span></button>
        </div>
      </div>
      <div class="te-dict-note-body">
        <div class="te-dict-stats-host">
          <section class="te-dict-stats-card" aria-label="${tr("dictationWrongStatsTitle")}">
            <header class="te-dict-stats-head">
              <div class="te-dict-stats-title-group">
                <span class="te-dict-stats-icon" aria-hidden="true">${makeSvg('<path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>')}</span>
                <div class="te-dict-stats-title-copy">
                  <h3 data-dict-label="dictationWrongStatsTitle"></h3>
                  <p data-dict-label="dictationWrongStatsSummary"></p>
                </div>
              </div>
              <span class="te-dict-stats-count" id="te-dict-stats-count" aria-live="polite"></span>
            </header>
            <div class="te-dict-stats-filter-bar" aria-label="${tr("dictationWrongStatsTitle")}">
              <label class="te-dict-stats-search">
                ${makeSvg('<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>')}
                <input id="te-dict-stats-search" type="search" autocomplete="off">
              </label>
              <button class="te-dict-stats-filter active" type="button" data-stats-filter="all" aria-pressed="true"><span data-dict-label="dictationWrongStatsAll"></span></button>
              <button class="te-dict-stats-filter" type="button" data-stats-filter="needs-fix" aria-pressed="false"><span data-dict-label="dictationWrongStatsNeedsFix"></span></button>
            </div>
            <div class="te-dict-stats-scroll" tabindex="0" aria-label="${tr("dictationWrongStatsTitle")}">
            </div>
          </section>
        </div>
        <div class="te-dict-note-text-wrap">
          <label class="te-dict-note-label" for="te-dict-note" data-dict-label="dictationGrammarNotes"></label>
          <textarea class="te-dict-note-input" id="te-dict-note"></textarea>
        </div>
        <div class="te-dict-lock" id="te-dict-lock" role="status">
          <span class="te-dict-lock-icon" aria-hidden="true">${makeSvg('<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><path d="M12 14v3"/>')}</span>
          <strong data-dict-label="dictationNotesLocked"></strong>
          <span data-dict-label="dictationNotesLockHelp"></span>
        </div>
      </div>
      <div class="te-dict-note-footer">
        <span class="te-dict-saved" id="te-dict-saved" aria-live="polite"></span>
        <span class="te-dict-autosave" data-dict-label="dictationAutosave"></span>
      </div>`;

    const leftColumnSplitter = document.createElement("div");
    leftColumnSplitter.className = "te-dict-column-splitter te-dict-splitter-left";
    leftColumnSplitter.setAttribute("role", "separator");
    leftColumnSplitter.setAttribute("aria-orientation", "vertical");
    leftColumnSplitter.setAttribute("aria-label", tr("dictationResizeSentencesColumn"));
    leftColumnSplitter.title = tr("dictationResizeColumnHelp");
    leftColumnSplitter.setAttribute("aria-description", tr("dictationResizeColumnHelp"));
    leftColumnSplitter.setAttribute("aria-controls", "te-dict-sentence-area");
    leftColumnSplitter.tabIndex = 0;
    const rightColumnSplitter = document.createElement("div");
    rightColumnSplitter.className = "te-dict-column-splitter te-dict-splitter-right";
    rightColumnSplitter.setAttribute("role", "separator");
    rightColumnSplitter.setAttribute("aria-orientation", "vertical");
    rightColumnSplitter.setAttribute("aria-label", tr("dictationResizeNotesColumn"));
    rightColumnSplitter.title = tr("dictationResizeColumnHelp");
    rightColumnSplitter.setAttribute("aria-description", tr("dictationResizeColumnHelp"));
    rightColumnSplitter.setAttribute("aria-controls", "te-dictation-notes");
    rightColumnSplitter.tabIndex = 0;

    const showLeftColumn = document.createElement("button");
    showLeftColumn.className = "te-dict-column-restore te-dict-restore-left";
    showLeftColumn.type = "button";
    showLeftColumn.innerHTML = makeSvg('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 4v16m5-11 3 3-3 3"/>');
    const showRightColumn = document.createElement("button");
    showRightColumn.className = "te-dict-column-restore te-dict-restore-right";
    showRightColumn.type = "button";
    showRightColumn.innerHTML = makeSvg('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M16 4v16m-5-11-3 3 3 3"/>');
    const videoMask = document.createElement("div");
    videoMask.className = "te-dict-video-mask";
    videoMask.setAttribute("aria-hidden", "true");

    root.append(center, notesPanel, leftColumnSplitter, rightColumnSplitter, showLeftColumn, showRightColumn, videoMask);

    const tools = document.createElement("div");
    tools.className = "te-dict-toolbar-tools";
    tools.innerHTML = `
      <button class="te-dict-type-control" id="te-dict-type-control" type="button">
        ${makeSvg('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h10M7 12h10M7 16h6"/>')}
        <span data-dict-label="dictationType"></span>
      </button>
      <span class="te-dict-toolbar-accuracy">
        <svg class="te-dict-ring" viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><circle class="te-dict-ring-bg" cx="12" cy="12" r="9"/><circle class="te-dict-ring-fg" id="te-dict-ring-fg" cx="12" cy="12" r="9" transform="rotate(-90 12 12)"/></svg>
        <span class="te-dict-acc-col"><span data-dict-label="dictationAccuracy"></span><strong id="te-dict-toolbar-score">0%</strong></span>
      </span>`;
    primaryGroup.prepend(tools);
    primaryGroup.classList.add("te-dict-primary-group");

    ui = {
      root, left, videoSlot, compactAudio, brand, bar, barParent: bar.parentNode, barNextSibling: bar.nextSibling,
      videoCompactToggle: center.querySelector("#te-dict-video-toggle"),
      miniThumb: compactAudio.querySelector(".te-dict-mini-thumb"),
      miniTitle: compactAudio.querySelector(".te-dict-mini-title"),
      miniSource: compactAudio.querySelector(".te-dict-mini-source"),
      miniPlay: compactAudio.querySelector(".te-dict-mini-play"),
      miniPlayIcon: compactAudio.querySelector(".te-dict-mini-play-icon"),
      videoExpandedHeight: 0, videoExpandedHeightSaved: false, videoTransitionToken: 0, videoResizeObserver: null,
      columnLayoutResizeObserver: null,
      originalLeftAriaHidden: left.getAttribute("aria-hidden"),
      originalVideoSlotHeight: { value: videoSlot.style.getPropertyValue("height"), priority: videoSlot.style.getPropertyPriority("height") },
      primaryGroup, tools, sentenceArea, center, notesPanel,
      leftColumnSplitter, rightColumnSplitter, showLeftColumn, showRightColumn, videoMask,
      hideLeftColumn: sentenceArea.querySelector("#te-dict-hide-sentences"),
      hideRightColumn: notesPanel.querySelector("#te-dict-hide-notes"),
      sentences: sentenceArea.querySelector("#te-dict-sentences"),
      counter: sentenceArea.querySelector("#te-dict-counter"),
      input: center.querySelector("#te-dict-input"),
      inputMarkup: center.querySelector("#te-dict-input-markup"),
      inputMarkupContent: center.querySelector("#te-dict-input-markup-content"),
      work: center.querySelector(".te-dict-work"),
      score: center.querySelector("#te-dict-score"),
      hint: center.querySelector("#te-dict-hint"),
      error: center.querySelector("#te-dict-error"),
      errorTitleText: center.querySelector(".te-dict-error-title span"),
      errorTitleIcon: center.querySelector(".te-dict-error-title svg"),
      errorWords: center.querySelector("#te-dict-error-words"),
      success: center.querySelector("#te-dict-success"),
      translation: center.querySelector("#te-dict-translation"),
      check: center.querySelector("#te-dict-check"),
      audioBtn: center.querySelector("#te-dict-audio-btn"),
      showHints: center.querySelector("#te-dict-show-hints"),
      repeatBtns: [...center.querySelectorAll(".te-dict-repeat-btn")],
      btnPrev: center.querySelector("#te-dict-btn-prev"),
      btnReplay: center.querySelector("#te-dict-btn-replay"),
      btnSlow: center.querySelector("#te-dict-btn-slow"),
      btnNext: center.querySelector("#te-dict-btn-next"),
      typeControl: tools.querySelector("#te-dict-type-control"),
      toolbarScore: tools.querySelector("#te-dict-toolbar-score"),
      ring: tools.querySelector("#te-dict-ring-fg"),
      close: notesPanel.querySelector("#te-dict-close"),
      statsSearch: notesPanel.querySelector("#te-dict-stats-search"),
      statsCount: notesPanel.querySelector("#te-dict-stats-count"),
      statsScroll: notesPanel.querySelector(".te-dict-stats-scroll"),
      statsFilters: [...notesPanel.querySelectorAll(".te-dict-stats-filter")],
      note: notesPanel.querySelector("#te-dict-note"),
      lock: notesPanel.querySelector("#te-dict-lock"),
      save: notesPanel.querySelector("#te-dict-save"),
      saved: notesPanel.querySelector("#te-dict-saved"),
      previous: bar.querySelector('button[title="Câu trước"]'),
      next: bar.querySelector('button[title="Câu tiếp theo"]'),
      replay: bar.querySelector('button[title="Lặp lại câu"]'),
      playPause: bar.querySelector('button[title="Phát/Tạm dừng"]'),
      originalButtonState: new Map(),
    };
    for (const button of [ui.previous, ui.next]) {
      if (button) ui.originalButtonState.set(button, { disabled: button.disabled, aria: button.getAttribute("aria-disabled") });
    }
    ui.close.setAttribute("aria-label", tr("dictationClose"));
    ui.close.title = tr("dictationClose");
    ui.input.placeholder = tr("dictationPlaceholder");
    ui.input.setAttribute("aria-label", tr("dictationAnswer"));
    ui.statsSearch.placeholder = tr("dictationWrongStatsSearch");
    ui.note.placeholder = tr("dictationNotesPlaceholder");
    ui.save.textContent = tr("dictationSaveNote");
    ui.showHints.setAttribute("aria-label", tr("dictationShowHints"));
    ui.showHints.title = tr("dictationShowHints");
    const hintTexts = [tr("dictationEnterHint"), ...tr("dictationShortcutHint").split(/\s*·\s*/)].slice(0, 4);
    ui.hint.replaceChildren(...hintTexts.map((text) => {
      const item = document.createElement("span");
      item.textContent = text;
      return item;
    }));
    ui.labels = [...root.querySelectorAll("[data-dict-label]")];
    ui.labels.forEach((node) => { node.textContent = tr(node.dataset.dictLabel); });
    installDictationColumnControls();
    ui.miniSource.textContent = tr("dictationAudioSource");
    updateCompactAudioInfo();
    updateCompactAudioPlaybackState();
    ui.videoCompactToggle.addEventListener("click", toggleCompactVideo);
    ui.miniPlay.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleVideoPlayback();
    });
    ui.videoSlot.addEventListener("transitionend", onVideoSlotTransitionEnd);
    if (typeof ResizeObserver === "function") {
      ui.videoResizeObserver = new ResizeObserver(onDictationVideoResize);
      ui.videoResizeObserver.observe(ui.left);
    }

    ui.close.addEventListener("click", close);
    ui.check.addEventListener("click", () => { submit(); refocus(); });
    ui.btnPrev.addEventListener("click", () => { if (current > 0) selectSentence(current - 1); });
    ui.btnNext.addEventListener("click", () => { if (solved.has(current) && current < sentenceCues.length - 1) selectSentence(current + 1); });
    ui.btnReplay.addEventListener("click", () => { playSentence(current); refocus(); });
    ui.audioBtn.addEventListener("click", () => { playSentence(current); refocus(); });
    ui.showHints.addEventListener("click", onShowHintsToggle);
    ui.btnSlow.addEventListener("click", () => { playSentence(current, { rate: 0.6 }); refocus(); });
    ui.repeatBtns.forEach((button) => button.addEventListener("click", () => { setRepeat(Number(button.dataset.count)); refocus(); }));
    ui.typeControl.addEventListener("click", () => ui?.input.focus());
    ui.save.addEventListener("click", () => saveNotesNow(true));
    ui.input.addEventListener("keydown", onAnswerKeyDown);
    ui.input.addEventListener("input", onAnswerInput);
    ui.input.addEventListener("scroll", syncInputMarkupScroll, { passive: true });
    ui.input.addEventListener("keyup", stopFieldKeyEvent);
    ui.input.addEventListener("keypress", stopFieldKeyEvent);
    ui.note.addEventListener("input", scheduleSaveNotes);
    ui.statsSearch.addEventListener("input", renderWrongWordStats);
    for (const eventName of ["keydown", "keyup", "keypress"]) ui.statsSearch.addEventListener(eventName, stopFieldKeyEvent);
    ui.statsFilters.forEach((button) => button.addEventListener("click", () => {
      ui.statsFilters.forEach((item) => {
        const selected = item === button;
        item.classList.toggle("active", selected);
        item.setAttribute("aria-pressed", String(selected));
      });
      renderWrongWordStats();
    }));
    for (const field of [ui.note]) {
      field.addEventListener("keydown", onNoteKeyDown);
      field.addEventListener("keyup", stopFieldKeyEvent);
      field.addEventListener("keypress", stopFieldKeyEvent);
    }
    ui.sentences.addEventListener("scroll", onSentenceScroll, { passive: true });
    ui.bar.addEventListener("click", onControlClick, true);
  }

  function refocus() { ui?.input.focus({ preventScroll: true }); }

  function setRepeat(count) {
    repeatCount = Math.max(0, Math.min(3, count | 0));
    ui?.repeatBtns.forEach((button) => button.classList.toggle("active", Number(button.dataset.count) === repeatCount));
  }

  function updateCompactAudioInfo() {
    if (!ui) return;
    const title = (document.title || "").replace(/\s*-\s*YouTube$/i, "").trim();
    ui.miniTitle.textContent = `Keepit - ${title || tr("dictationTitle")}`;
    ui.miniSource.textContent = tr("dictationAudioSource");
    const id = String(A?.state?.videoId || "");
    if (/^[A-Za-z0-9_-]+$/.test(id)) {
      ui.miniThumb.hidden = false;
      ui.miniThumb.src = `https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg`;
    } else {
      ui.miniThumb.hidden = true;
      ui.miniThumb.removeAttribute("src");
    }
    const thumbnail = ui.miniThumb;
    thumbnail.onerror = () => { thumbnail.hidden = true; };
    const compact = ui.root.classList.contains("te-dict-video-compact");
    const label = tr(compact ? "dictationExpandVideo" : "dictationCompactVideo");
    ui.videoCompactToggle.title = label;
    ui.videoCompactToggle.setAttribute("aria-label", label);
    ui.videoCompactToggle.setAttribute("aria-pressed", String(compact));
    ui.videoCompactToggle.innerHTML = makeSvg(compact
      ? '<path d="M12 19v3"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><rect x="9" y="2" width="6" height="13" rx="3"/>'
      : '<path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/>');
  }

  function updateCompactAudioPlaybackState() {
    if (!ui) return;
    const video = attachedVideo || A?.state?.videoEl;
    const playing = !!video && !video.paused;
    ui.compactAudio.classList.toggle("playing", playing);
    const label = tr(playing ? "dictationMiniPause" : "dictationMiniPlay");
    ui.miniPlay.title = label;
    ui.miniPlay.setAttribute("aria-label", label);
    ui.miniPlayIcon.innerHTML = makeSvg(playing
      ? '<path d="M6 5h4v14H6zM14 5h4v14h-4z"/>'
      : '<path d="M8 5v14l11-7z"/>');
  }

  function toggleCompactVideo() {
    if (!ui?.videoSlot) return;
    const compact = ui.root.classList.contains("te-dict-video-compact");
    const slot = ui.videoSlot;
    const currentHeight = slot.getBoundingClientRect().height;
    if (!currentHeight) return;
    if (!compact && !ui.videoExpandedHeightSaved) {
      ui.videoExpandedHeight = currentHeight;
      ui.videoExpandedHeightSaved = true;
    }
    const targetHeight = compact ? ui.videoExpandedHeight : ui.videoExpandedHeight / 3;
    if (!targetHeight) return;
    const token = ++ui.videoTransitionToken;
    slot.style.height = `${currentHeight}px`;
    void slot.offsetHeight;
    ui.root.classList.toggle("te-dict-video-compact", !compact);
    updateCompactAudioInfo();
    requestAnimationFrame(() => {
      if (!ui || ui.videoTransitionToken !== token) return;
      slot.style.height = `${targetHeight}px`;
    });
  }

  function onVideoSlotTransitionEnd(event) {
    if (!ui || event.target !== ui.videoSlot || event.propertyName !== "height") return;
    if (ui.root.classList.contains("te-dict-video-compact")) return;
    if (ui.videoExpandedHeightSaved) {
      ui.videoExpandedHeight = ui.videoSlot.getBoundingClientRect().height;
      ui.videoExpandedHeightSaved = false;
    }
    const original = ui.originalVideoSlotHeight;
    if (original.value) ui.videoSlot.style.setProperty("height", original.value, original.priority);
    else ui.videoSlot.style.removeProperty("height");
  }

  function onDictationVideoResize() {
    if (!ui?.root.classList.contains("te-dict-video-compact") || !ui.videoExpandedHeightSaved) return;
    const slotWidth = ui.videoSlot.getBoundingClientRect().width;
    const leftHeight = ui.left.getBoundingClientRect().height;
    const video = attachedVideo || A?.state?.videoEl;
    const aspect = video?.videoWidth && video?.videoHeight ? video.videoWidth / video.videoHeight : 16 / 9;
    if (!slotWidth || !leftHeight || !aspect) return;
    ui.videoExpandedHeight = Math.min(slotWidth / aspect, leftHeight * .42);
    if (ui.videoExpandedHeight > 0) ui.videoSlot.style.height = `${ui.videoExpandedHeight / 3}px`;
  }


  function showToastBeforeOpen() {
    const currentId = A?.state?.videoId;
    const loading = !!currentId && A?.state?.loadingFor === currentId;
    showToast(tr(loading ? "dictationCaptionsLoading" : "dictationEnglishOnly"));
  }

  async function loadProgress(requestVideoId, generation) {
    const key = `dictation:${requestVideoId}`;
    let record = {};
    try {
      record = (await ext.storage.local.get(key))[key] || {};
    } catch {}
    if (!active || videoId !== requestVideoId || panelGeneration !== generation) return null;
    solved = new Set(Array.isArray(record.solved) ? record.solved.map(Number).filter(Number.isInteger) : []);
    notes = record.notes && typeof record.notes === "object" ? record.notes : {};
    translations = record.translations && typeof record.translations === "object" ? record.translations : {};
    wrongWordStats = normalizeWrongWordStats(record.wrongWordStats);
    return record;
  }

  function saveRecord() {
    if (!videoId || !ext?.storage?.local) return Promise.resolve();
    return ext.storage.local.set({
      [storageKey()]: { version: 1, current, solved: [...solved], notes, translations, wrongWordStats },
    }).catch(() => {});
  }

  function scheduleSaveNotes() {
    if (!active || !solved.has(current)) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => saveNotesNow(false), 250);
  }

  function saveNotesNow(showSaved) {
    clearTimeout(saveTimer);
    if (!active || !solved.has(current) || !ui) return Promise.resolve(false);
    notes[String(current)] = { ...(notes[String(current)] || {}), note: ui.note.value };
    return saveRecord().then(() => {
      if (showSaved && ui?.saved) {
        ui.saved.textContent = tr("dictationSaved");
        setTimeout(() => { if (ui?.saved) ui.saved.textContent = ""; }, 1600);
      }
      return true;
    });
  }

  function flushNotes() {
    if (!active || !ui || !solved.has(current)) return;
    clearTimeout(saveTimer);
    notes[String(current)] = { ...(notes[String(current)] || {}), note: ui.note.value };
    void saveRecord();
  }

  function normalizeWrongWordStats(value) {
    const normalized = { version: 1, words: {} };
    const source = value && typeof value === "object" && value.words && typeof value.words === "object"
      ? value.words : {};
    const safeCount = (candidate) => {
      const number = Number(candidate);
      return Number.isFinite(number) ? Math.max(0, Math.floor(number)) : 0;
    };
    for (const [storageKey, item] of Object.entries(source)) {
      if (!storageKey.startsWith("w:") || !item || typeof item !== "object") continue;
      const variants = {};
      const sourceVariants = item.variants && typeof item.variants === "object" ? item.variants : {};
      for (const [key, variant] of Object.entries(sourceVariants)) {
        if (!key.startsWith("v:") || !variant || typeof variant !== "object") continue;
        variants[key] = { text: typeof variant.text === "string" ? variant.text : "", count: safeCount(variant.count) };
      }
      const occurrences = {};
      const sourceOccurrences = item.occurrences && typeof item.occurrences === "object" ? item.occurrences : {};
      for (const [key, occurrence] of Object.entries(sourceOccurrences)) {
        if (!key.startsWith("o:") || !occurrence || typeof occurrence !== "object") continue;
        occurrences[key] = { pending: !!occurrence.pending, wrongStreak: safeCount(occurrence.wrongStreak) };
      }
      const word = typeof item.word === "string" ? item.word : storageKey.slice(2);
      const errors = safeCount(item.errors);
      if (!word || errors < 1) continue;
      normalized.words[storageKey] = {
        word,
        errors,
        corrections: safeCount(item.corrections),
        variants,
        occurrences,
        lastResult: item.lastResult === "wrong" ? "wrong" : "correct",
        lastAt: safeCount(item.lastAt),
      };
    }
    return normalized;
  }

  function recordWrongWordSubmission(stats, cueIndex, result, timestamp = Date.now()) {
    if (!stats || !stats.words || !Array.isArray(result?.ops)) return false;
    const tokenFor = (value) => globalThis.LHN_DICTATION_SCORE.tokenize(value)[0] || "";
    const byWord = new Map();
    let expectedIndex = 0;
    for (const operation of result.ops) {
      if (!operation || operation.type === "extra") continue;
      const tokenIndex = expectedIndex++;
      const target = String(operation.expected || "");
      const normalizedTarget = tokenFor(target);
      if (!normalizedTarget) continue;
      if (!byWord.has(normalizedTarget)) byWord.set(normalizedTarget, []);
      byWord.get(normalizedTarget).push({ operation, tokenIndex, target });
    }

    let changed = false;
    for (const [normalizedTarget, events] of byWord) {
      const storageKey = `w:${normalizedTarget}`;
      const hasError = events.some(({ operation }) => operation.type === "wrong" || operation.type === "missing");
      let item = stats.words[storageKey];
      if (!item && !hasError) continue; // first-try-correct words do not enter wrong-word stats
      if (!item) {
        item = { word: events[0].target, errors: 0, corrections: 0, variants: {}, occurrences: {}, lastResult: "wrong", lastAt: 0 };
        stats.words[storageKey] = item;
      }
      item.variants ||= {};
      item.occurrences ||= {};
      for (const { operation, tokenIndex, target } of events) {
        const occurrenceKey = `o:${cueIndex}:${tokenIndex}:${normalizedTarget}`;
        const isError = operation.type === "wrong" || operation.type === "missing";
        let occurrence = item.occurrences[occurrenceKey];
        if (isError) {
          occurrence ||= { pending: false, wrongStreak: 0 };
          item.errors++;
          occurrence.pending = true;
          occurrence.wrongStreak++;
          const typed = operation.type === "missing" ? "" : String(operation.typed || "");
          const normalizedVariant = tokenFor(typed) || "__missing__";
          const variantKey = `v:${normalizedVariant}`;
          const variant = item.variants[variantKey] || (item.variants[variantKey] = { text: typed, count: 0 });
          variant.count++;
          item.occurrences[occurrenceKey] = occurrence;
        } else if (operation.type === "ok" && occurrence?.pending) {
          item.corrections++;
          occurrence.pending = false;
          occurrence.wrongStreak = 0;
        }
      }
      item.lastResult = hasError ? "wrong" : "correct";
      item.lastAt = timestamp;
      changed = true;
    }
    return changed;
  }

  function wrongWordStreak(item) {
    let streak = 0;
    for (const occurrence of Object.values(item.occurrences || {})) {
      if (occurrence?.pending) streak = Math.max(streak, Number(occurrence.wrongStreak) || 0);
    }
    return streak;
  }

  function statsChevronIcon(pointsUp) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("width", "12");
    svg.setAttribute("height", "12");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2.5");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", pointsUp ? "m6 15 6-6 6 6" : "m6 9 6 6 6-6");
    svg.appendChild(path);
    return svg;
  }

  function renderWrongWordStats() {
    if (!ui?.statsScroll) return;
    const stats = normalizeWrongWordStats(wrongWordStats);
    const allItems = Object.entries(stats.words).map(([key, item]) => ({ key, ...item, streak: wrongWordStreak(item) }));
    if (ui.statsCount) {
      const spacing = language() === "ko" ? "" : " ";
      ui.statsCount.textContent = `${allItems.length}${spacing}${tr("dictationWrongStatsWord")}`;
    }
    allItems.sort((a, b) => {
      const aWrong = a.lastResult === "wrong", bWrong = b.lastResult === "wrong";
      if (aWrong !== bWrong) return aWrong ? -1 : 1;
      if (aWrong && a.streak !== b.streak) return b.streak - a.streak;
      if (a.errors !== b.errors) return b.errors - a.errors;
      if (a.lastAt !== b.lastAt) return b.lastAt - a.lastAt;
      return a.word.localeCompare(b.word);
    });
    const ranks = new Map(allItems.map((item, index) => [item.key, index + 1]));
    const query = String(ui.statsSearch?.value || "").trim().toLowerCase();
    const filter = ui.statsFilters.find((button) => button.classList.contains("active"))?.dataset.statsFilter || "all";
    const visibleItems = allItems.filter((item) => {
      if (filter === "needs-fix" && item.lastResult !== "wrong") return false;
      if (!query) return true;
      const variants = Object.values(item.variants || {}).map((variant) => variant.text || tr("dictationWrongStatsOmitted"));
      return [item.word, ...variants].some((text) => text.toLowerCase().includes(query));
    });

    ui.statsScroll.replaceChildren();
    if (!allItems.length || !visibleItems.length) {
      const empty = document.createElement("p");
      empty.className = "te-dict-stats-empty";
      empty.setAttribute("role", "status");
      empty.textContent = allItems.length ? tr("dictationWrongStatsNoResults") : tr("dictationWrongStatsEmpty");
      ui.statsScroll.appendChild(empty);
      return;
    }

    const label = (key) => {
      const node = document.createElement("span");
      node.textContent = tr(key);
      return node;
    };
    const countMetric = (key, value, className = "") => {
      const metric = document.createElement("span");
      if (className) metric.className = className;
      metric.append(label(key));
      const number = document.createElement("strong");
      number.append(document.createTextNode(`${value} `), label("dictationWrongStatsTimes"));
      metric.appendChild(number);
      return metric;
    };
    const variantChip = (variant, extra = false) => {
      const chip = document.createElement("span");
      chip.className = `te-dict-stats-variant${extra ? " extra" : ""}`;
      chip.append(document.createTextNode(variant.text || tr("dictationWrongStatsOmitted")));
      const count = document.createElement("b");
      count.textContent = `×${variant.count}`;
      chip.appendChild(count);
      return chip;
    };

    visibleItems.forEach((item) => {
      const rank = ranks.get(item.key) || 0;
      const isWrong = item.lastResult === "wrong";
      const denominator = item.errors + item.corrections;
      const rate = denominator ? Math.round((item.corrections / denominator) * 100) : 0;
      const article = document.createElement("article");
      article.className = "te-dict-stats-word";

      const head = document.createElement("div");
      head.className = "te-dict-stats-word-head";
      const title = document.createElement("div");
      title.className = "te-dict-stats-word-title";
      const rankNode = document.createElement("span");
      rankNode.className = `te-dict-stats-rank${rank <= 3 ? " top3" : ""}`;
      rankNode.textContent = `#${rank}`;
      const word = document.createElement("strong");
      word.textContent = item.word;
      title.append(rankNode, word);
      const status = document.createElement("span");
      status.className = `te-dict-stats-status ${isWrong ? "wrong" : "correct"}`;
      const statusDot = document.createElement("i");
      statusDot.setAttribute("aria-hidden", "true");
      status.append(statusDot, label(isWrong ? "dictationWrongStatsLastWrong" : "dictationWrongStatsLastCorrect"));
      head.append(title, status);

      const metrics = document.createElement("div");
      metrics.className = "te-dict-stats-metrics";
      metrics.append(countMetric("dictationWrongStatsErrors", item.errors, "wrong"));
      metrics.append(countMetric("dictationWrongStatsCorrect", item.corrections, "correct"));
      const rateMetric = document.createElement("span");
      rateMetric.append(label("dictationWrongStatsAccuracy"));
      const rateValue = document.createElement("strong");
      rateValue.textContent = `${rate}%`;
      rateMetric.appendChild(rateValue);
      metrics.appendChild(rateMetric);

      const bar = document.createElement("div");
      bar.className = "te-dict-stats-accuracy";
      bar.setAttribute("aria-hidden", "true");
      const fill = document.createElement("span");
      fill.style.width = `${rate}%`;
      bar.appendChild(fill);

      const variantsWrap = document.createElement("div");
      variantsWrap.className = "te-dict-stats-variants";
      const variantsLabel = label("dictationWrongStatsVariants");
      variantsLabel.className = "te-dict-stats-variants-label";
      const variantList = document.createElement("div");
      variantList.className = "te-dict-stats-variant-list";
      const variants = Object.values(item.variants || {}).sort((a, b) => b.count - a.count || a.text.localeCompare(b.text));
      variants.forEach((variant, index) => variantList.appendChild(variantChip(variant, index >= 2)));
      const extras = variants.slice(2);
      let details = null;
      if (extras.length) {
        details = document.createElement("details");
        details.className = "te-dict-stats-more";
        const summary = document.createElement("summary");
        const more = document.createElement("span");
        more.className = "more-label";
        more.append(document.createTextNode(`+${extras.length}`), statsChevronIcon(false));
        const less = document.createElement("span");
        less.className = "less-label";
        less.appendChild(statsChevronIcon(true));
        summary.append(more, less);
        const updateToggleState = () => {
          variantsWrap.classList.toggle("expanded", details.open);
          summary.setAttribute("aria-label", details.open ? tr("dictationWrongStatsCollapse") : `${extras.length} ${tr("dictationWrongStatsMore")}`);
        };
        updateToggleState();
        details.addEventListener("toggle", updateToggleState);
        details.appendChild(summary);
      }
      variantsWrap.append(variantsLabel, variantList);
      if (details) variantsWrap.appendChild(details);
      article.append(head, metrics, bar, variantsWrap);
      ui.statsScroll.appendChild(article);
    });
  }

  function updateCounter() {
    if (!ui) return;
    ui.counter.textContent = sentenceCues.length ? `${current + 1}/${sentenceCues.length}` : "0/0";
  }

  function updateProgressControls() {
    if (!ui) return;
    const prevOff = current <= 0;
    const nextOff = current >= sentenceCues.length - 1 || !solved.has(current);
    for (const [button, off] of [[ui.previous, prevOff], [ui.next, nextOff], [ui.btnPrev, prevOff], [ui.btnNext, nextOff]]) {
      if (!button) continue;
      button.disabled = off;
      button.setAttribute("aria-disabled", String(off));
    }
  }

  function setScore(percent) {
    if (!ui) return;
    const has = Number.isFinite(percent);
    ui.score.textContent = has ? `${percent}%` : "---";
    ui.toolbarScore.textContent = `${has ? percent : 0}%`;
    ui.ring.style.strokeDashoffset = String(56.55 - (56.55 * (has ? percent : 0)) / 100);
  }

  function updateCheckButtonStyle(perfect) {
    if (!ui?.check) return;
    ui.check.classList.toggle("te-dict-act-primary", !perfect);
    ui.check.classList.toggle("te-dict-done", perfect);
  }

  function syncInputMarkupScroll() {
    if (!ui?.inputMarkupContent || !ui?.input) return;
    ui.inputMarkupContent.style.transform = `translate(${-ui.input.scrollLeft}px, ${-ui.input.scrollTop}px)`;
  }

  function clearInputWrongMarks() {
    if (!ui?.inputMarkup) return;
    ui.inputMarkup.hidden = true;
    ui.inputMarkupContent?.replaceChildren();
    ui.inputMarkupContent?.style.removeProperty("transform");
  }

  function renderInputWrongMarks(operations) {
    if (!ui?.inputMarkup || !ui.inputMarkupContent) return;
    const value = ui.input.value;
    const typedWords = [...value.matchAll(/[\p{L}\p{N}’‘`´']+/gu)];
    const ranges = [];
    let typedIndex = 0;
    for (const operation of operations) {
      if (operation.type === "missing") continue;
      const match = typedWords[typedIndex++];
      if (match && (operation.type === "wrong" || operation.type === "extra")) {
        ranges.push({ start: match.index, end: match.index + match[0].length });
      }
    }
    if (!ranges.length) { clearInputWrongMarks(); return; }
    const fragment = document.createDocumentFragment();
    let offset = 0;
    for (const range of ranges) {
      if (range.start > offset) fragment.append(document.createTextNode(value.slice(offset, range.start)));
      const word = document.createElement("span");
      word.className = "te-dict-input-wrong-word";
      word.textContent = value.slice(range.start, range.end);
      fragment.append(word);
      offset = range.end;
    }
    if (offset < value.length) fragment.append(document.createTextNode(value.slice(offset)));
    ui.inputMarkupContent.replaceChildren(fragment);
    ui.inputMarkup.hidden = false;
    syncInputMarkupScroll();
  }

  function onAnswerInput() {
    if (!ui) return;
    escapeFilledAnswer = false;
    hintResult = null;
    clearInputWrongMarks();
    const wasChecked = checkedCurrent;
    checkedCurrent = false;
    ui.input.classList.remove("correct");
    ui.check.classList.add("te-dict-act-primary");
    ui.check.classList.remove("te-dict-done");
    ui.btnNext?.classList.remove("te-dict-ready");
    setScore(null);
    ui.error.hidden = true;
    ui.work?.classList.remove("te-dict-has-error");
    ui.success.hidden = true;
    ui.translation.hidden = true;
    ui.translation.textContent = "";
    if (wasChecked) updateRows(false);
  }

  function updateRows(scrollCurrent = true) {
    if (!ui) return;
    ui.sentences.querySelectorAll(".te-dict-row").forEach((row) => {
      const index = Number(row.dataset.index);
      const isSolved = solved.has(index);
      const isLocked = index > current || (index === current && !checkedCurrent);
      const isPast = index < current;
      row.disabled = isLocked;
      row.classList.toggle("solved", isSolved);
      row.classList.toggle("current", index === current);
      row.classList.toggle("locked", isLocked);
      row.classList.toggle("past", isPast);
      const stateLabel = isSolved ? `, ${tr("dictationSolved")}` : isLocked ? `, ${tr("dictationLocked")}` : "";
      row.setAttribute("aria-label", `${tr("dictationSentenceNumber")} ${index + 1}${stateLabel}`);
      const translation = row.querySelector(".te-dict-vi");
      const showTranslation = !isLocked;
      translation.textContent = showTranslation ? (translations[String(index)] || tr("dictationTranslationLoading")) : "";
      translation.hidden = !showTranslation;
      if (showTranslation && !translations[String(index)]) void ensureVietnamese(index);
    });
    if (scrollCurrent) {
      const currentRow = ui.sentences.querySelector(`.te-dict-row[data-index="${current}"]`);
      currentRow?.scrollIntoView({ block: "center" });
    }
  }

  function createSentenceRow(index) {
    const cue = sentenceCues[index];
    const row = document.createElement("button");
    row.type = "button";
    row.className = "te-dict-row";
    row.dataset.index = String(index);
    row.disabled = index > current || (index === current && !checkedCurrent);
    row.classList.toggle("past", index < current);
    row.setAttribute("role", "listitem");
    row.innerHTML = `<span class="te-dict-num"></span><span class="te-dict-text"></span><span class="te-dict-icon" aria-hidden="true"><svg class="play" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg><svg class="vol" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/></svg></span><span class="te-dict-vi" hidden></span>`;
    row.querySelector(".te-dict-num").textContent = String(index + 1);
    row.querySelector(".te-dict-text").textContent = cue.en;
    const translation = row.querySelector(".te-dict-vi");
    const showTranslation = index < current || (index === current && checkedCurrent);
    translation.textContent = showTranslation ? (translations[String(index)] || tr("dictationTranslationLoading")) : "";
    translation.hidden = !showTranslation;
    row.addEventListener("click", () => {
      if (index >= current && !checkedCurrent) return;
      selectSentence(index);
    });
    return row;
  }

  function renderMore() {
    if (!ui) return;
    let batches = 0;
    do {
      if (listEnd >= sentenceCues.length) return;
      const end = Math.min(sentenceCues.length, listEnd + 32);
      const fragment = document.createDocumentFragment();
      for (let index = listEnd; index < end; index++) fragment.appendChild(createSentenceRow(index));
      ui.sentences.appendChild(fragment);
      listEnd = end;
      updateRows(false);
      batches++;
    } while (listEnd < sentenceCues.length && ui.sentences.scrollHeight <= ui.sentences.clientHeight && batches < 8);
  }

  function renderPrevious() {
    if (!ui || listStart <= 0) return;
    const start = Math.max(0, listStart - 32);
    const fragment = document.createDocumentFragment();
    for (let index = start; index < listStart; index++) fragment.appendChild(createSentenceRow(index));
    const previousHeight = ui.sentences.scrollHeight;
    ui.sentences.insertBefore(fragment, ui.sentences.firstChild);
    listStart = start;
    ui.sentences.scrollTop += ui.sentences.scrollHeight - previousHeight;
    updateRows(false);
  }

  function renderInitialRows() {
    if (!ui) return;
    listStart = Math.max(0, Math.min(current - 16, sentenceCues.length - 32));
    listEnd = listStart;
    ui.sentences.replaceChildren();
    renderMore();
  }

  function onSentenceScroll() {
    if (!ui) return;
    if (ui.sentences.scrollTop < 60 && listStart > 0) renderPrevious();
    if (ui.sentences.scrollTop + ui.sentences.clientHeight >= ui.sentences.scrollHeight - 90) renderMore();
  }

  function setNotesLocked(locked) {
    if (!ui) return;
    ui.notesPanel.classList.toggle("te-dict-notes-locked", locked);
    ui.lock.hidden = !locked;
    ui.note.disabled = locked;
    ui.save.disabled = locked;
  }

  function renderCurrent() {
    if (!ui || !active) return;
    checkedCurrent = false;
    hintResult = null;
    while (current < listStart && listStart > 0) renderPrevious();
    while (current >= listEnd && listEnd < sentenceCues.length) renderMore();
    updateCounter();
    updateRows();
    updateProgressControls();
    const wasSolved = solved.has(current);
    setNotesLocked(true);
    ui.btnNext?.classList.remove("te-dict-ready");
    ui.check?.classList.add("te-dict-act-primary");
    ui.check?.classList.remove("te-dict-done");
    const saved = notes[String(current)] || {};
    ui.note.value = typeof saved.note === "string" ? saved.note : "";
    ui.saved.textContent = "";
    escapeFilledAnswer = false;
    ui.input.value = "";
    clearInputWrongMarks();
    ui.input.classList.remove("correct");
    ui.error.hidden = true;
    ui.work?.classList.remove("te-dict-has-error");
    ui.errorWords.replaceChildren();
    ui.success.hidden = true;
    ui.translation.hidden = true;
    ui.translation.textContent = "";
    setScore(wasSolved ? 100 : null);
  }

  function selectSentence(index) {
    if (!sentenceCues[index]) return;
    flushNotes();
    current = index;
    renderCurrent();
    void saveRecord();
    prepareCue();
    playSentence(index, { count: repeatCount + 1 });
    ui?.input.focus({ preventScroll: true });
  }

  function updateTranslationViews(index) {
    if (!ui) return;
    const translated = translations[String(index)] || "";
    const canShowTranslation = index < current || (index === current && checkedCurrent);
    const row = ui.sentences.querySelector(`.te-dict-row[data-index="${index}"] .te-dict-vi`);
    if (row) {
      row.textContent = canShowTranslation ? (translated || tr("dictationTranslationLoading")) : "";
      row.hidden = !canShowTranslation;
    }
    if (current === index) {
      ui.translation.textContent = translated || tr("dictationTranslationLoading");
      ui.translation.hidden = !checkedCurrent;
    }
  }

  async function ensureVietnamese(index) {
    if (translations[String(index)]) {
      updateTranslationViews(index);
      return translations[String(index)];
    }
    const cue = sentenceCues[index];
    if (!cue || typeof A?.translateToVietnamese !== "function") return "";
    const requestVideoId = videoId;
    const requestKey = `${requestVideoId}:${index}:${cue.en}`;
    if (translating.has(requestKey)) return translating.get(requestKey);
    const request = Promise.resolve(A.translateToVietnamese(cue.en)).then((translated) => {
      if (videoId !== requestVideoId || sentenceCues[index]?.en !== cue.en) return "";
      const value = String(translated || "").trim();
      if (!value || value === "(không dịch được)") {
        if (ui && active && current === index) ui.translation.textContent = tr("dictationTranslationFailed");
        return "";
      }
      translations[String(index)] = value;
      void saveRecord();
      updateTranslationViews(index);
      return value;
    }).catch(() => {
      if (videoId === requestVideoId && sentenceCues[index]?.en === cue.en && ui && active && current === index) {
        ui.translation.textContent = tr("dictationTranslationFailed");
      }
      return "";
    }).finally(() => translating.delete(requestKey));
    translating.set(requestKey, request);
    return request;
  }

  // So theo vị trí: từng từ gõ so với từ cùng vị trí của câu gốc. Dừng ở lỗi (sai/thiếu) đầu tiên.
  function positionalOps(refText, typedText) {
    const toWords = (text) => (String(text ?? "").match(/[\p{L}\p{N}’‘`´']+/gu) || [])
      .map((raw) => ({ raw: raw.replace(/^[’‘`´']+|[’‘`´']+$/g, ""), norm: globalThis.LHN_DICTATION_SCORE.tokenize(raw)[0] || "" }))
      .filter((w) => w.norm);
    const ref = toWords(refText), typed = toWords(typedText);
    const ops = [];
    const n = Math.max(ref.length, typed.length);
    for (let k = 0; k < n; k++) {
      const r = ref[k], t = typed[k];
      if (r && t && r.norm === t.norm) { ops.push({ type: "ok", typed: t.raw }); continue; }
      if (r && t) { ops.push({ type: "wrong", typed: t.raw, expected: r.raw }); break; }
      if (r && !t) { ops.push({ type: "missing", expected: r.raw }); break; }
      ops.push({ type: "extra", typed: t.raw });
    }
    return ops;
  }

  function setErrorPanelSuccess(success) {
    if (!ui?.error) return;
    ui.error.classList.toggle("te-dict-error-success", success);
    ui.errorTitleText.textContent = tr(success ? "dictationCorrectSentence" : "dictationErrorTitle");
    ui.errorTitleIcon.innerHTML = success
      ? '<path d="m5 12 4 4L19 6"/>'
      : '<circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/>';
  }

  function renderCorrectWords() {
    if (!ui?.errorWords) return;
    ui.errorWords.replaceChildren();
    for (const word of sentenceCues[current]?.en?.trim().split(/\s+/).filter(Boolean) || []) {
      const group = document.createElement("span");
      group.className = "te-dict-wg";
      const token = document.createElement("span");
      token.className = "te-dict-w ok";
      token.textContent = word;
      group.appendChild(token);
      ui.errorWords.appendChild(group);
    }
  }

  function appendMissingMasks(words) {
    for (const word of words) {
      const mask = document.createElement("span");
      mask.className = "te-dict-missing-hints";
      mask.textContent = "_".repeat([...word.norm].length);
      ui.errorWords.appendChild(mask);
    }
  }

  function renderPrefixSuggestion(reference, answer) {
    setErrorPanelSuccess(false);
    const words = getTranscriptWordTokens(reference);
    const enteredCount = globalThis.LHN_DICTATION_SCORE.tokenize(answer).length;
    const showHint = shouldShowHints("prefix", answer);
    const visibleCount = Math.min(words.length, enteredCount + (showHint ? 1 : 0));
    ui.errorWords.replaceChildren();
    for (let index = 0; index < visibleCount; index++) {
      const group = document.createElement("span");
      group.className = "te-dict-wg";
      const token = document.createElement("span");
      token.className = index < enteredCount ? "te-dict-w ok" : "te-dict-w fix";
      token.textContent = words[index].display;
      group.appendChild(token);
      ui.errorWords.appendChild(group);
    }
    appendMissingMasks(words.slice(visibleCount));
    clearInputWrongMarks();
    ui.work?.classList.add("te-dict-has-error");
    ui.error.hidden = false;
  }

  function renderError() {
    setErrorPanelSuccess(false);
    const cue = sentenceCues[current];
    const answer = ui.input.value;
    const showHints = shouldShowHints("error", answer);
    const words = getTranscriptWordTokens(cue?.en || "");
    const operations = globalThis.LHN_DICTATION_SCORE.diff(cue?.en || "", answer);
    const displayOperations = positionalOps(cue?.en, answer);
    ui.errorWords.replaceChildren();
    const chip = (className, text) => {
      const node = document.createElement("span");
      node.className = className;
      node.textContent = text;
      return node;
    };
    if (!answer.trim()) {
      ui.errorWords.appendChild(chip("te-dict-empty", tr("dictationEmptyAnswer")));
    } else {
      let expectedIndex = 0;
      for (const operation of displayOperations) {
        if (operation.type === "ok") {
          const group = document.createElement("span");
          group.className = "te-dict-wg";
          group.appendChild(chip("te-dict-w ok", words[expectedIndex]?.display || operation.typed));
          ui.errorWords.appendChild(group);
          expectedIndex++;
          continue;
        }
        if (operation.type === "wrong") {
          const group = document.createElement("span");
          group.className = "te-dict-wg";
          group.appendChild(chip("te-dict-w bad", operation.typed));
          if (showHints) {
            group.appendChild(chip("te-dict-w fix", `→ ${words[expectedIndex]?.display || operation.expected}`));
          }
          ui.errorWords.appendChild(group);
          if (!showHints) {
            const expected = words[expectedIndex] || { norm: globalThis.LHN_DICTATION_SCORE.tokenize(operation.expected)[0] || "" };
            appendMissingMasks([expected]);
          }
          expectedIndex++;
          appendMissingMasks(words.slice(expectedIndex));
          break;
        }
        if (operation.type === "missing") {
          appendMissingMasks(words.slice(expectedIndex));
          break;
        }
        if (operation.type === "extra") {
          const group = document.createElement("span");
          group.className = "te-dict-wg";
          group.appendChild(chip("te-dict-w bad", operation.typed));
          group.appendChild(chip("te-dict-w fix", `→ ${tr("dictationExtra")}`));
          ui.errorWords.appendChild(group);
        }
      }
    }
    renderInputWrongMarks(operations);
    ui.work?.classList.add("te-dict-has-error");
    ui.error.hidden = false;
  }

  function localConfetti() {
    if (!ui?.root) return;
    const layer = document.createElement("div");
    layer.className = "te-dict-confetti-layer";
    layer.setAttribute("aria-hidden", "true");
    const colors = ["#22c55e", "#ef4444", "#f59e0b"];
    for (let i = 0; i < 90; i++) {
      const bit = document.createElement("span");
      bit.className = "te-dict-confetti";
      const angle = (Math.random() - 0.5) * (80 * Math.PI / 180) * 2; // lệch ±80° so với phương thẳng đứng
      const speed = 180 + Math.random() * 260;
      bit.style.backgroundColor = colors[i % colors.length];
      bit.style.setProperty("--ux", `${Math.round(Math.sin(angle) * speed)}px`);
      bit.style.setProperty("--uy", `${Math.round(-Math.cos(angle) * speed)}px`);
      bit.style.setProperty("--dx", `${Math.round(Math.sin(angle) * speed * 1.25)}px`);
      bit.style.setProperty("--dy", `${Math.round(160 + Math.random() * 260)}px`);
      bit.style.setProperty("--rot", `${Math.round(Math.random() * 720 - 360)}deg`);
      layer.appendChild(bit);
    }
    ui.root.appendChild(layer);
    setTimeout(() => layer.remove(), 1500);
  }

  function audioContext() {
    try {
      audioCtx = audioCtx || new (globalThis.AudioContext || globalThis.webkitAudioContext)();
      if (audioCtx.state === "suspended") void audioCtx.resume();
      return audioCtx;
    } catch {
      return null;
    }
  }

  function playSuccessSound() {
    const ac = audioContext();
    if (!ac) return;
    const now = ac.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.15, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.3);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.3);
    });
  }

  function playErrorSound() {
    const ac = audioContext();
    if (!ac) return;
    const now = ac.currentTime;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.linearRampToValueAtTime(100, now + 0.2);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  function addMissingPunctuation(reference, answer) {
    const wordPattern = /[\p{L}\p{N}’‘`´']+/gu;
    const referenceWords = [...String(reference).matchAll(wordPattern)];
    const answerWords = [...String(answer).matchAll(wordPattern)];
    if (referenceWords.length !== answerWords.length) return answer;

    const isApostrophe = (char) => "’‘`´'".includes(char);
    const restoreWordApostrophes = (expected, typed) => {
      const expectedLetters = [...expected].filter((char) => !isApostrophe(char));
      const typedLetters = [...typed].filter((char) => !isApostrophe(char));
      if (expectedLetters.length !== typedLetters.length
        || expectedLetters.map((char) => char.toLowerCase()).join("") !== typedLetters.map((char) => char.toLowerCase()).join("")) return typed;
      let letterIndex = 0;
      return [...expected].map((char) => isApostrophe(char) ? char : typedLetters[letterIndex++]).join("");
    };
    const punctuation = (text) => [...text.matchAll(/\p{P}/gu)].map((match) => match[0]);
    let output = "";
    let referenceOffset = 0;
    let answerOffset = 0;

    for (let index = 0; index <= referenceWords.length; index++) {
      const referenceEnd = index < referenceWords.length ? referenceWords[index].index : String(reference).length;
      const answerEnd = index < answerWords.length ? answerWords[index].index : String(answer).length;
      const expectedGap = String(reference).slice(referenceOffset, referenceEnd);
      const typedGap = String(answer).slice(answerOffset, answerEnd);
      const expectedMarks = punctuation(expectedGap);
      const typedMarks = punctuation(typedGap);
      const remainingMarks = [...expectedMarks];
      let unexpectedMark = false;
      for (const mark of typedMarks) {
        const position = remainingMarks.indexOf(mark);
        if (position < 0) { unexpectedMark = true; break; }
        remainingMarks.splice(position, 1);
      }
      output += remainingMarks.length && !unexpectedMark ? expectedGap : typedGap;

      if (index < referenceWords.length) {
        const expectedWord = referenceWords[index][0];
        const typedWord = answerWords[index][0];
        output += restoreWordApostrophes(expectedWord, typedWord);
        referenceOffset = referenceWords[index].index + expectedWord.length;
        answerOffset = answerWords[index].index + typedWord.length;
      }
    }
    return output;
  }

  function getTranscriptWordTokens(text) {
    const source = String(text ?? "");
    const matches = [...source.matchAll(/[\p{L}\p{N}’‘`´']+/gu)];
    return matches.map((match, index) => {
      const nextStart = index + 1 < matches.length ? matches[index + 1].index : source.length;
      const end = match.index + match[0].length;
      const before = index === 0
        ? [...source.slice(0, match.index).matchAll(/\p{P}/gu)].map((item) => item[0]).join("")
        : "";
      const after = [...source.slice(end, nextStart).matchAll(/\p{P}/gu)].map((item) => item[0]).join("");
      return {
        raw: match[0],
        norm: globalThis.LHN_DICTATION_SCORE.tokenize(match[0])[0] || "",
        display: `${before}${match[0]}${after}`,
        start: match.index,
        end,
      };
    }).filter((word) => word.norm);
  }

  function canonicalizeCorrectWords(reference, answer) {
    const expectedWords = getTranscriptWordTokens(reference);
    const typedWords = getTranscriptWordTokens(answer);
    const operations = globalThis.LHN_DICTATION_SCORE.diff(reference, answer);
    const replacements = [];
    let expectedIndex = 0;
    let typedIndex = 0;
    for (const operation of operations) {
      if (operation.type === "missing") { expectedIndex++; continue; }
      if (operation.type === "extra") { typedIndex++; continue; }
      const expected = expectedWords[expectedIndex];
      const typed = typedWords[typedIndex];
      if (operation.type === "ok" && expected && typed && expected.raw !== typed.raw) {
        replacements.push({ start: typed.start, end: typed.end, text: expected.raw });
      }
      expectedIndex++;
      typedIndex++;
    }
    let result = String(answer);
    for (const replacement of replacements.reverse()) {
      result = result.slice(0, replacement.start) + replacement.text + result.slice(replacement.end);
    }
    return result;
  }

  function restoreAlignedPunctuation(reference, answer) {
    const expectedWords = getTranscriptWordTokens(reference);
    const typedWords = getTranscriptWordTokens(answer);
    const operations = globalThis.LHN_DICTATION_SCORE.diff(reference, answer);
    const expectedToTyped = new Array(expectedWords.length).fill(-1);
    const expectedStatus = new Array(expectedWords.length).fill("missing");
    let expectedIndex = 0;
    let typedIndex = 0;
    for (const operation of operations) {
      if (operation.type === "missing") { expectedIndex++; continue; }
      if (operation.type === "extra") { typedIndex++; continue; }
      expectedToTyped[expectedIndex] = typedIndex++;
      expectedStatus[expectedIndex++] = operation.type;
    }

    const source = String(reference);
    const answerText = String(answer);
    const punctuation = (text) => [...String(text).matchAll(/\p{P}/gu)].map((match) => match[0]);
    const replacements = [];
    const insertions = [];
    for (let boundary = 0; boundary <= expectedWords.length; boundary++) {
      const expectedStart = boundary === 0 ? 0 : expectedWords[boundary - 1].end;
      const expectedEnd = boundary === expectedWords.length ? source.length : expectedWords[boundary].start;
      const expectedGap = source.slice(expectedStart, expectedEnd);
      const expectedMarks = punctuation(expectedGap);
      if (!expectedMarks.length) continue;

      let typedGapStart;
      let typedGapEnd;
      let insertionPosition;
      let canReplaceGap = false;
      if (boundary === 0) {
        const firstTyped = expectedToTyped[0];
        if (firstTyped < 0 || expectedStatus[0] !== "ok") continue;
        typedGapStart = 0;
        typedGapEnd = typedWords[firstTyped].start;
        insertionPosition = typedGapEnd;
        canReplaceGap = firstTyped === 0;
      } else {
        const previousTyped = expectedToTyped[boundary - 1];
        if (previousTyped < 0 || expectedStatus[boundary - 1] !== "ok") continue;
        typedGapStart = typedWords[previousTyped].end;
        insertionPosition = typedGapStart;
        const nextTyped = boundary < expectedWords.length ? expectedToTyped[boundary] : -1;
        if (boundary < expectedWords.length && nextTyped >= 0) {
          typedGapEnd = typedWords[nextTyped].start;
          canReplaceGap = nextTyped === previousTyped + 1;
        } else if (boundary === expectedWords.length) {
          typedGapEnd = answerText.length;
          canReplaceGap = previousTyped === typedWords.length - 1;
        } else {
          let nextExpected = boundary + 1;
          while (nextExpected < expectedWords.length && expectedToTyped[nextExpected] < 0) nextExpected++;
          typedGapEnd = nextExpected < expectedWords.length
            ? typedWords[expectedToTyped[nextExpected]].start
            : answerText.length;
        }
      }
      if (typedGapEnd < typedGapStart) continue;

      const remainingMarks = [...expectedMarks];
      let unexpectedMark = false;
      for (const mark of punctuation(answerText.slice(typedGapStart, typedGapEnd))) {
        const markIndex = remainingMarks.indexOf(mark);
        if (markIndex < 0) { unexpectedMark = true; break; }
        remainingMarks.splice(markIndex, 1);
      }
      if (!remainingMarks.length || unexpectedMark) continue;

      if (canReplaceGap) replacements.push({ start: typedGapStart, end: typedGapEnd, text: expectedGap });
      else insertions.push({ position: insertionPosition, text: remainingMarks.join("") });
    }

    let result = answerText;
    const edits = [
      ...replacements.map((item) => ({ start: item.start, end: item.end, text: item.text })),
      ...insertions.map((item) => ({ start: item.position, end: item.position, text: item.text })),
    ].sort((a, b) => b.start - a.start);
    for (const edit of edits) result = result.slice(0, edit.start) + edit.text + result.slice(edit.end);
    return result;
  }

  function normalizeAnswerToTranscript(reference, answer) {
    const canonicalAnswer = canonicalizeCorrectWords(reference, answer);
    return restoreAlignedPunctuation(reference, canonicalAnswer);
  }

  function submit() {
    escapeFilledAnswer = false;
    const cue = sentenceCues[current];
    if (!cue || !ui) return;
    const result = globalThis.LHN_DICTATION_SCORE.score(cue.en, ui.input.value);
    const statsUpdated = recordWrongWordSubmission(wrongWordStats, current, result);
    if (statsUpdated) renderWrongWordStats();
    setScore(result.percent);
    updateCheckButtonStyle(result.perfect);
    if (result.perfect) {
      const punctuatedAnswer = addMissingPunctuation(cue.en, ui.input.value);
      if (punctuatedAnswer !== ui.input.value) ui.input.value = punctuatedAnswer;
      clearInputWrongMarks();
      ui.work?.classList.remove("te-dict-has-error");
      checkedCurrent = true;
      solved.add(current);
      ui.input.classList.add("correct");
      setErrorPanelSuccess(true);
      renderCorrectWords();
      ui.error.hidden = false;
      ui.success.hidden = false;
      setNotesLocked(false);
      ui.btnNext?.classList.add("te-dict-ready");
      updateRows();
      updateProgressControls();
      ui.translation.hidden = false;
      ui.translation.textContent = translations[String(current)] || tr("dictationTranslationLoading");
      void saveRecord();
      void ensureVietnamese(current);
      playSuccessSound();
      localConfetti();
      return;
    }
    checkedCurrent = false;
    ui.input.classList.remove("correct");
    ui.success.hidden = true;
    ui.translation.hidden = true;
    ui.translation.textContent = "";
    updateRows(false);
    renderError();
    if (statsUpdated) void saveRecord();
    playErrorSound();
    setNotesLocked(!solved.has(current));
  }

  // Phát đúng một câu rồi dừng: rAF canh điểm kết thúc (timeupdate chỉ ~4 lần/giây nên dễ trôi sang câu sau).
  function stopWatch() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
  }

  function restoreRate() {
    if (savedRate !== null && attachedVideo) {
      try { attachedVideo.playbackRate = savedRate; } catch {}
    }
    savedRate = null;
  }

  function endPlayback() {
    stopWatch();
    stopAt = -1;
    repeatLeft = 0;
    restoreRate();
  }

  function finishCue() {
    const video = attachedVideo;
    const cue = sentenceCues[current];
    if (repeatLeft > 0 && video && cue) {
      repeatLeft--;
      try { video.currentTime = Math.max(0, Number(cue.start) || 0); } catch {}
      watchPlayback();
      return;
    }
    video?.pause();
    endPlayback();
  }

  function watchPlayback() {
    stopWatch();
    const step = () => {
      rafId = 0;
      const video = attachedVideo;
      if (!active || stopAt < 0 || !video) return;
      if (video.paused) return; // tiếp tục khi sự kiện "play" kích hoạt lại
      if (video.currentTime >= stopAt - 0.03 || video.ended) { finishCue(); return; }
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
  }

  function prepareCue() {
    const video = A?.state?.videoEl;
    const cue = sentenceCues[current];
    endPlayback();
    if (!video || !cue) return;
    video.pause();
    try { video.currentTime = Math.max(0, Number(cue.start) || 0); } catch {}
  }

  function playSentence(index, options = {}) {
    const cue = sentenceCues[index];
    const video = A?.state?.videoEl;
    if (!cue || !video || !active) return;
    if (index !== current) {
      flushNotes();
      current = index;
      renderCurrent();
      void saveRecord();
    }
    const count = options.count ?? (repeatCount + 1);
    if (count < 1) return;
    endPlayback();
    if (options.rate) {
      savedRate = video.playbackRate;
      try { video.playbackRate = options.rate; } catch {}
    }
    repeatLeft = count - 1;
    stopAt = Number(cue.end) || -1;
    try { video.currentTime = Math.max(0, Number(cue.start) || 0); } catch {}
    watchPlayback();
    const playing = video.play();
    if (playing?.catch) playing.catch(() => {});
  }

  // Mọi lần phát (bấm video, Space, nút play) đều bị giới hạn trong câu hiện tại.
  function onVideoPlay() {
    updateCompactAudioPlaybackState();
    if (!active || !attachedVideo) return;
    const cue = sentenceCues[current];
    if (!cue) return;
    if (stopAt >= 0) { if (!rafId) watchPlayback(); return; }
    const time = attachedVideo.currentTime;
    if (time < cue.start - 0.05 || time >= cue.end - 0.03) {
      try { attachedVideo.currentTime = Math.max(0, Number(cue.start) || 0); } catch {}
    }
    stopAt = Number(cue.end) || -1;
    repeatLeft = 0;
    watchPlayback();
  }

  function onVideoPause() {
    updateCompactAudioPlaybackState();
  }

  function onVideoTimeUpdate() {
    if (!active || stopAt < 0 || !attachedVideo || attachedVideo.paused) return;
    if (attachedVideo.currentTime >= stopAt - 0.03) finishCue();
  }

  function toggleVideoPlayback() {
    const video = A?.state?.videoEl;
    if (!video) return;
    if (video.paused) {
      const playing = video.play();
      if (playing?.catch) playing.catch(() => {});
    } else video.pause();
  }

  function onControlClick(event) {
    if (!active || !ui) return;
    const button = event.target.closest?.("button[title]");
    if (!button) return;
    const title = button.getAttribute("title");
    if (!["Câu trước", "Câu tiếp theo", "Lặp lại câu", "Phát/Tạm dừng"].includes(title)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (title === "Câu trước") {
      if (current > 0) selectSentence(current - 1);
    } else if (title === "Câu tiếp theo") {
      if (solved.has(current) && current < sentenceCues.length - 1) selectSentence(current + 1);
    } else if (title === "Lặp lại câu") {
      playSentence(current);
    } else {
      toggleVideoPlayback();
    }
  }

  function stopFieldKeyEvent(event) {
    if (event.key !== "Escape") event.stopPropagation();
  }

  function isCorrectIncompletePrefix(reference, answer) {
    const expected = globalThis.LHN_DICTATION_SCORE.tokenize(reference);
    const entered = globalThis.LHN_DICTATION_SCORE.tokenize(answer);
    return entered.length > 0 && entered.length < expected.length
      && entered.every((word, index) => word === expected[index]);
  }

  function handleAnswerEscape() {
    const cue = sentenceCues[current];
    if (!ui || !cue) return;
    if (escapeFilledAnswer) {
      resetAnswer();
      return;
    }
    ui.input.value = cue.en;
    ui.input.setSelectionRange(cue.en.length, cue.en.length);
    onAnswerInput();
    escapeFilledAnswer = true;
  }

  function onAnswerKeyDown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      handleAnswerEscape();
      return;
    }
    if (event.key === "Enter" && !event.shiftKey && !event.isComposing && event.keyCode !== 229 && revealPendingHint()) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (ui?.error) ui.error.hidden = true;
    if (event.key === "ArrowUp" || event.key === "ArrowDown") return;
    event.stopPropagation();
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      const cue = sentenceCues[current];
      if (cue && isCorrectIncompletePrefix(cue.en, ui.input.value)) {
        const normalizedPrefix = normalizeAnswerToTranscript(cue.en, ui.input.value);
        const spacedValue = `${normalizedPrefix.trimEnd()} `;
        ui.input.value = spacedValue;
        ui.input.setSelectionRange(spacedValue.length, spacedValue.length);
        onAnswerInput();
        renderPrefixSuggestion(cue.en, spacedValue);
        return;
      }
      if (cue) {
        const normalizedAnswer = normalizeAnswerToTranscript(cue.en, ui.input.value);
        if (normalizedAnswer !== ui.input.value) {
          ui.input.value = normalizedAnswer;
          ui.input.setSelectionRange(normalizedAnswer.length, normalizedAnswer.length);
          onAnswerInput();
        }
      }
      const isPerfect = !!cue && globalThis.LHN_DICTATION_SCORE.score(cue.en, ui.input.value).perfect;
      if (isPerfect && solved.has(current) && checkedCurrent) { ui?.btnNext?.click(); return; }
      ui.check.click();
    }
  }

  function shouldShowHints(kind, answer) {
    if (!hintResult || hintResult.current !== current || hintResult.kind !== kind || hintResult.answer !== answer) {
      hintResult = { current, kind, answer, revealed: hintsEnabled() };
    }
    return hintsEnabled() || hintResult.revealed;
  }

  function renderHintResult(result) {
    if (!ui || !result || result.current !== current || result.answer !== ui.input.value) return;
    if (result.kind === "prefix") renderPrefixSuggestion(sentenceCues[current]?.en || "", result.answer);
    else if (result.kind === "error") renderError();
  }

  function revealPendingHint() {
    if (!ui || hintsEnabled() || !hintResult || hintResult.revealed
      || hintResult.current !== current || hintResult.answer !== ui.input.value) return false;
    hintResult.revealed = true;
    renderHintResult(hintResult);
    return true;
  }

  function hintsEnabled() {
    return ui?.showHints?.getAttribute("aria-pressed") === "true";
  }

  function onShowHintsToggle(event) {
    event.preventDefault();
    event.stopPropagation();
    if (!ui) return;
    const enabled = !hintsEnabled();
    ui.showHints.setAttribute("aria-pressed", String(enabled));
    ui.showHints.classList.toggle("active", enabled);
    if (!hintResult || hintResult.current !== current || hintResult.answer !== ui.input.value) return;
    hintResult.revealed = enabled;
    if (!ui.error.hidden) renderHintResult(hintResult);
  }

  function onNoteKeyDown(event) {
    if (event.key === "Escape") return;
    event.stopPropagation();
    if (event.key === "Enter" && !event.shiftKey && !event.isComposing && event.keyCode !== 229) {
      event.preventDefault();
      const noteField = event.currentTarget || ui?.note;
      void saveNotesNow(true).then((saved) => { if (saved) noteField?.blur(); });
    }
  }

  function resetAnswer() {
    if (!ui) return;
    hintResult = null;
    escapeFilledAnswer = false;
    checkedCurrent = false;
    ui.input.value = "";
    clearInputWrongMarks();
    ui.input.classList.remove("correct");
    ui.check.classList.add("te-dict-act-primary");
    ui.check.classList.remove("te-dict-done");
    ui.btnNext?.classList.remove("te-dict-ready");
    ui.error.hidden = true;
    ui.work?.classList.remove("te-dict-has-error");
    ui.errorWords.replaceChildren();
    ui.success.hidden = true;
    ui.translation.hidden = true;
    ui.translation.textContent = "";
    updateRows(false);
    setScore(solved.has(current) ? 100 : null);
    ui.input.focus({ preventScroll: true });
  }

  function onGlobalKeyDown(event) {
    if (!active) return;
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      // Trong ô nhập/ô ghi chú: để trình duyệt tự xử lý ↑/↓ (di chuyển con trỏ như văn bản thường)
      const path = event.composedPath?.() || [];
      const real = path[0] || event.target;
      const editable = path.includes(ui?.input) || path.includes(ui?.note)
        || real?.closest?.("input, textarea, select, [contenteditable='true']") || real?.isContentEditable;
      if (!editable) { event.preventDefault(); event.stopImmediatePropagation(); }
      return;
    }
    if (event.key === "Escape") {
      ctrlAlone = false;
      const path = event.composedPath?.() || [];
      if (path.includes(ui?.input) || event.target === ui?.input) {
        event.preventDefault();
        event.stopImmediatePropagation();
        handleAnswerEscape();
      }
      return;
    }
    const isBacktick = event.key === "`" || (event.code === "Backquote" && !event.shiftKey);
    if (isBacktick && !event.ctrlKey && !event.altKey && !event.metaKey) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (!event.repeat) toggleVideoPlayback();
      return;
    }
    if (event.key === "Control") { ctrlAlone = true; return; }
    ctrlAlone = false;
  }

  function onGlobalKeyUp(event) {
    if (!active || event.key !== "Control") return;
    if (ctrlAlone) {
      event.preventDefault();
      event.stopImmediatePropagation();
      playSentence(current);
    }
    ctrlAlone = false;
  }

  function attachVideoEvents() {
    attachedVideo = A?.state?.videoEl || null;
    attachedVideo?.addEventListener("timeupdate", onVideoTimeUpdate);
    attachedVideo?.addEventListener("play", onVideoPlay);
    attachedVideo?.addEventListener("pause", onVideoPause);
    updateCompactAudioPlaybackState();
  }

  function detachVideoEvents() {
    endPlayback();
    attachedVideo?.removeEventListener("timeupdate", onVideoTimeUpdate);
    attachedVideo?.removeEventListener("play", onVideoPlay);
    attachedVideo?.removeEventListener("pause", onVideoPause);
    attachedVideo = null;
  }

  async function openPanel() {
    if (active || openingPanel) return;
    if (!isEnglishReady()) { showToastBeforeOpen(); return; }
    openingPanel = true;
    build();
    if (!ui) { openingPanel = false; return; }
    await loadDictationLayoutPrefs();
    if (!ui || !isEnglishReady()) { openingPanel = false; return; }
    videoId = currentVideoId();
    sentenceCues = getCues();
    if (!sentenceCues.length) { openingPanel = false; showToastBeforeOpen(); return; }
    active = true;
    openingPanel = false;
    checkedCurrent = false;
    hideYouTubeScrollbar();
    const generation = ++panelGeneration;
    current = 0;
    listStart = 0;
    listEnd = 0;
    solved = new Set();
    notes = {};
    translations = {};
    wrongWordStats = { version: 1, words: {} };
    ui.root.classList.add("te-dictation-active");
    applyDictationColumnLayout();
    if (typeof ResizeObserver === "function") {
      ui.columnLayoutResizeObserver = new ResizeObserver(applyDictationColumnLayout);
      ui.columnLayoutResizeObserver.observe(ui.root);
    }
    ui.root.insertBefore(ui.bar, ui.center);
    ui.sentences.setAttribute("aria-label", tr("dictationSentences"));
    document.addEventListener("keydown", onGlobalKeyDown, true);
    document.addEventListener("keyup", onGlobalKeyUp, true);
    savedLoop = typeof A?.state?.loop === "boolean" ? A.state.loop : null;
    if (savedLoop !== null) A.state.loop = false; // vòng lặp câu của Dual Sub sẽ làm video chạy lệch câu
    attachVideoEvents();
    renderInitialRows();
    setNotesLocked(true);
    setScore(null);
    const record = await loadProgress(videoId, generation);
    if (!active || panelGeneration !== generation || currentVideoId() !== videoId || !record) return;
    renderWrongWordStats();
    if (solved.size) {
      const savedCurrent = Number(record.current);
      if (Number.isInteger(savedCurrent) && savedCurrent >= 0 && savedCurrent < sentenceCues.length) {
        current = savedCurrent;
      } else {
        let nextUnsolved = 0;
        while (nextUnsolved < sentenceCues.length && solved.has(nextUnsolved)) nextUnsolved++;
        current = Math.min(nextUnsolved, sentenceCues.length - 1);
      }
    } else {
      current = 0;
    }
    listStart = 0;
    listEnd = 0;
    renderInitialRows();
    renderCurrent();
    playSentence(current, { count: repeatCount + 1 });
    void saveRecord();
    ui.input.focus({ preventScroll: true });
  }

  function close() {
    if (!active || !ui) return;
    restoreYouTubeScrollbar();
    flushNotes();
    active = false;
    hintResult = null;
    panelGeneration++;
    document.removeEventListener("keydown", onGlobalKeyDown, true);
    document.removeEventListener("keyup", onGlobalKeyUp, true);
    detachVideoEvents();
    if (savedLoop !== null && A?.state) A.state.loop = savedLoop;
    savedLoop = null;
    void audioCtx?.close?.();
    audioCtx = null;
    ui.bar.removeEventListener("click", onControlClick, true);
    ui.videoTransitionToken++;
    ui.videoResizeObserver?.disconnect();
    ui.videoSlot.removeEventListener("transitionend", onVideoSlotTransitionEnd);
    ui.columnLayoutResizeObserver?.disconnect();
    persistDictationLayoutPrefs();
    const originalVideoHeight = ui.originalVideoSlotHeight;
    if (originalVideoHeight.value) ui.videoSlot.style.setProperty("height", originalVideoHeight.value, originalVideoHeight.priority);
    else ui.videoSlot.style.removeProperty("height");
    ui.compactAudio.remove();
    ui.brand.remove();
    for (const [button, original] of ui.originalButtonState) {
      button.disabled = original.disabled;
      if (original.aria === null) button.removeAttribute("aria-disabled");
      else button.setAttribute("aria-disabled", original.aria);
    }
    ui.root.classList.remove("te-dictation-active", "te-dict-video-compact", "te-dict-column-left-hidden", "te-dict-column-right-hidden");
    for (const property of ["--te-dict-left-track", "--te-dict-right-track", "--te-dict-left-splitter", "--te-dict-right-splitter", "--te-dict-center-min"]) {
      ui.root.style.removeProperty(property);
    }
    if (ui.originalLeftAriaHidden === null) ui.left.removeAttribute("aria-hidden");
    else ui.left.setAttribute("aria-hidden", ui.originalLeftAriaHidden);
    if (ui.barParent?.isConnected) {
      if (ui.barNextSibling?.parentNode === ui.barParent) ui.barParent.insertBefore(ui.bar, ui.barNextSibling);
      else ui.barParent.appendChild(ui.bar);
    }
    ui.sentenceArea.remove();
    ui.center.remove();
    ui.notesPanel.remove();
    ui.leftColumnSplitter.remove();
    ui.rightColumnSplitter.remove();
    ui.showLeftColumn.remove();
    ui.showRightColumn.remove();
    ui.videoMask.remove();
    ui.tools.remove();
    ui.primaryGroup.classList.remove("te-dict-primary-group");
    ui = null;
    ctrlAlone = false;
  }

  function toggle() { active ? close() : void openPanel(); }

  function onCaptionsUpdated() {
    if (!active) return;
    if (currentVideoId() !== videoId) { close(); return; }
    const updated = getCues();
    if (A?.state?.captionTrackLanguage !== "en" || !updated.length) {
      if (A?.state?.loadingFor === A?.state?.videoId) return;
      close();
      showToast(tr("dictationEnglishOnly"));
      return;
    }
    const unchanged = updated.length === sentenceCues.length && updated.every((cue, index) =>
      cue.en === sentenceCues[index]?.en && cue.start === sentenceCues[index]?.start && cue.end === sentenceCues[index]?.end
    );
    if (unchanged) return;
    flushNotes();
    const oldStart = sentenceCues[current]?.start;
    sentenceCues = updated;
    const matchingIndex = sentenceCues.findIndex((cue) => Math.abs(cue.start - oldStart) < 0.5);
    current = matchingIndex >= 0 ? matchingIndex : 0;
    renderInitialRows();
    renderCurrent();
    void saveRecord();
  }

  function onToggleClick(event) {
    event.preventDefault();
    event.stopPropagation();
    toggle();
  }

  function attachControls() {
    const button = A?.ctrl?.("AI keepit");
    if (button && button !== attachControls.button) {
      if (attachControls.button) attachControls.button.removeEventListener("click", onToggleClick);
      button.addEventListener("click", onToggleClick);
      attachControls.button = button;
    }
  }

  document.addEventListener("lhn-overlay-ready", (event) => {
    A = event.detail || globalThis.LHN_OVERLAY_API;
    if (!A) return;
    attachControls();
  });
  document.addEventListener("lhn-dual-captions-updated", onCaptionsUpdated);
  globalThis.LHN_DICTATION = Object.freeze({ toggle, open: openPanel, close, isOpen: () => active });
})();
