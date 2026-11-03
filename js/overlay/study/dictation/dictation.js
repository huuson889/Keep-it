// Dictation uses YouTube English caption cues or Reader web sentence cues.
// It transforms the existing overlay in place; it does not create a second overlay.
(() => {
  const ext = globalThis.browser || globalThis.chrome;
  const thumbnails = globalThis.LHN_THUMBNAILS;
  let A = null;
  let ui = null;
  let active = false;
  let openingPanel = false;
  let openingGeneration = 0;
  let studyMode = "typing";
  let current = 0;
  let checkedCurrent = false;
  let savedPageScrollStyles = null;
  let listStart = 0;
  let listEnd = 0;
  let sentenceCues = [];
  let sourceId = "";
  let progressReady = false;
  let pendingCaptionStart = false;
  let captionStatusKey = "";
  let captionControlsDisabled = false;
  let pendingResumeIndex = 0;
  let solved = new Set();
  let progressSyncEnabled = true;
  let progressByMode = { typing: { current: 0, solved: [] }, speaking: { current: 0, solved: [] } };
  let notes = {};
  let translations = {};
  let translationVisibilityEnabled = true;
  let translationVisibilityPreferenceWrite = Promise.resolve();
  let wrongWordStats = { version: 3, words: {} };
  let speakingWrongWordStats = { version: 3, words: {} };
  let stopAt = -1;
  let attachedMedia = null;
  let ctrlAlone = false;
  let escapeFilledAnswer = false;
  let panelGeneration = 0;
  let sourceTitleObserver = null;
  let sourceTitleSaveTimer = 0;
  let indexedSourceTitle = "";
  let saveTimer = 0;
  let toastTimer = 0;
  let rafId = 0;
  let repeatLeft = 0;
  let repeatCount = 3;
  let speakingRepeatCount = 0;
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
  const currentSourceId = () => String(A?.state?.sourceId || "");
  const storageKey = () => `dictation:${sourceId}`;
  const studySessionIndex = globalThis.LHN_STUDY_SESSION_INDEX;
  const studySessionIndexKey = studySessionIndex.STORAGE_KEY;
  const getCues = () => {
    const list = A?.getStudyCues?.();
    return Array.isArray(list) ? list.filter((cue) => cue && typeof cue.en === "string" && cue.en.trim()) : [];
  };
  const isStudySourceReady = () => (A?.state?.sourceType === 'web' || A?.state?.sourceLanguage === "en") && getCues().length > 0;
  const studyLayoutStorageKey = "dictation:layout:v1";
  const progressSyncStorageKey = "dictation:progress-sync:v1";
  const translationVisibilityStorageKey = "dictation:translation-visibility:v1";

  const shadowingActivity = globalThis.LHN_SHADOWING_ACTIVITY_FACTORY.create({
    get A() { return A; }, get ui() { return ui; }, get active() { return active; },
    get studyMode() { return studyMode; }, get current() { return current; },
    get sentenceCues() { return sentenceCues; },
    get attachedMedia() { return attachedMedia; }, get stopAt() { return stopAt; },
    get captionControlsDisabled() { return captionControlsDisabled; },
    tr, language, getScoreColorTier, getTranscriptWordTokens,
    get toastTimer() { return toastTimer; }, set toastTimer(value) { toastTimer = value; },
    setStudyMode, onAnswerInput, playSentence, endPlayback, submit, setScore, renderProperNounHint,
    syncCurrentTranslationDisplay, updateRows, resetAnswer, prepareCue, showToast,
  });
  let progressSyncPreferenceWrite = Promise.resolve();

  function progressModeKey(mode = studyMode) {
    return mode === "speaking" ? "speaking" : "typing";
  }

  function normalizeProgressSnapshot(value, fallback = { current: 0, solved: [] }) {
    const candidate = Number(value?.current);
    const fallbackCurrent = Number(fallback?.current);
    const saved = Array.isArray(value?.solved) ? value.solved : fallback?.solved;
    return {
      current: Number.isInteger(candidate) && candidate >= 0
        ? candidate
        : Number.isInteger(fallbackCurrent) && fallbackCurrent >= 0 ? fallbackCurrent : 0,
      solved: [...new Set((Array.isArray(saved) ? saved : []).map(Number).filter((index) => Number.isInteger(index) && index >= 0))].sort((a, b) => a - b),
    };
  }

  function currentProgressSnapshot() {
    return normalizeProgressSnapshot({ current, solved: [...solved] });
  }

  function cloneProgressSnapshot(snapshot) {
    return { current: snapshot.current, solved: [...snapshot.solved] };
  }

  function storeActiveModeProgress(mode = studyMode) {
    progressByMode[progressModeKey(mode)] = currentProgressSnapshot();
  }

  function applyModeProgress(mode = studyMode) {
    const snapshot = normalizeProgressSnapshot(progressByMode[progressModeKey(mode)]);
    current = snapshot.current;
    solved = new Set(snapshot.solved);
  }

  function findNextUnsolvedIndex(solvedSet, preferredIndex = current) {
    const total = sentenceCues.length;
    if (!total) return Math.max(0, Number(preferredIndex) || 0);
    const preferred = Math.max(0, Math.min(total - 1, Number(preferredIndex) || 0));
    for (let index = preferred; index < total; index++) if (!solvedSet.has(index)) return index;
    for (let index = 0; index < preferred; index++) if (!solvedSet.has(index)) return index;
    return preferred;
  }

  async function loadProgressSyncPreference() {
    try {
      await progressSyncPreferenceWrite;
      const stored = await ext.storage.local.get(progressSyncStorageKey);
      if (typeof stored?.[progressSyncStorageKey] === "boolean") progressSyncEnabled = stored[progressSyncStorageKey];
    } catch {}
    updateProgressSyncControl();
    return progressSyncEnabled;
  }

  async function loadTranslationVisibilityPreference() {
    try {
      await translationVisibilityPreferenceWrite;
      const stored = await ext.storage.local.get(translationVisibilityStorageKey);
      if (typeof stored?.[translationVisibilityStorageKey] === "boolean") {
        translationVisibilityEnabled = stored[translationVisibilityStorageKey];
      }
    } catch {}
    setTranslationToggleState(translationVisibilityEnabled);
    return translationVisibilityEnabled;
  }

  function persistTranslationVisibilityPreference() {
    if (!ext?.storage?.local) return Promise.resolve();
    const enabled = translationVisibilityEnabled;
    translationVisibilityPreferenceWrite = translationVisibilityPreferenceWrite
      .catch(() => {})
      .then(() => ext.storage.local.set({ [translationVisibilityStorageKey]: enabled }))
      .catch(() => {});
    return translationVisibilityPreferenceWrite;
  }

  function updateProgressSyncControl() {
    const button = ui?.syncProgressControl;
    if (!button) return;
    const label = tr(progressSyncEnabled ? "dictationProgressSyncOn" : "dictationProgressSyncOff");
    button.classList.toggle("te-active", progressSyncEnabled);
    button.setAttribute("aria-pressed", String(progressSyncEnabled));
    button.setAttribute("aria-label", label);
    button.title = label;
    button.disabled = !progressReady;
    button.setAttribute("aria-disabled", String(!progressReady));
  }

  function persistProgressSyncPreference() {
    if (!ext?.storage?.local) return Promise.resolve();
    const preference = progressSyncEnabled;
    progressSyncPreferenceWrite = progressSyncPreferenceWrite
      .catch(() => {})
      .then(() => ext.storage.local.set({ [progressSyncStorageKey]: preference }))
      .catch(() => {});
    return progressSyncPreferenceWrite;
  }

  function toggleProgressSync() {
    if (!active || !progressReady || !ui) return;
    captureNoteDraft();
    const wasEnabled = progressSyncEnabled;
    const previousCurrent = current;
    const previousSolved = new Set(solved);
    storeActiveModeProgress();

    if (wasEnabled) {
      const shared = currentProgressSnapshot();
      progressByMode = { typing: cloneProgressSnapshot(shared), speaking: cloneProgressSnapshot(shared) };
      progressSyncEnabled = false;
    } else {
      const typing = normalizeProgressSnapshot(progressByMode.typing, currentProgressSnapshot());
      const speaking = normalizeProgressSnapshot(progressByMode.speaking, currentProgressSnapshot());
      const mergedSolved = new Set([...typing.solved, ...speaking.solved]);
      const activeTrackHadCurrentSolved = previousSolved.has(previousCurrent);
      current = !activeTrackHadCurrentSolved && mergedSolved.has(previousCurrent)
        ? findNextUnsolvedIndex(mergedSolved, previousCurrent)
        : previousCurrent;
      solved = mergedSolved;
      const shared = currentProgressSnapshot();
      progressByMode = { typing: cloneProgressSnapshot(shared), speaking: cloneProgressSnapshot(shared) };
      progressSyncEnabled = true;
    }

    pendingResumeIndex = current;
    persistProgressSyncPreference();
    updateProgressSyncControl();

    if (!wasEnabled) {
      const currentBecameSolved = !previousSolved.has(previousCurrent) && solved.has(current);
      if (current !== previousCurrent || currentBecameSolved) {
        listStart = 0;
        listEnd = 0;
        renderInitialRows();
        renderCurrent();
        if (sentenceCues[current]) playSentence(current, { count: getRepeatCount() + 1 });
      } else {
        updateCounter();
        updateRows();
        updateProgressControls();
        setScore(solved.has(current) ? 100 : null);
      }
    }
    void saveRecord();
  }

  function cleanSourceTitle(value) {
    return String(value || "").replace(/^\s*Keepit\s*-\s*/i, "").replace(/\s*[-|]\s*YouTube\s*$/i, "").trim().slice(0, 240);
  }

  function getCurrentSourceTitle() {
    try {
      const visibleOverlayTitle = cleanSourceTitle(ui?.miniTitle?.textContent);
      const genericTitle = String(tr("dictationTitle") || "").trim().toLocaleLowerCase();
      if (visibleOverlayTitle && !/^(youtube|keepit|dictation)$/i.test(visibleOverlayTitle)
        && visibleOverlayTitle.toLocaleLowerCase() !== genericTitle) return visibleOverlayTitle;
      const heading = cleanSourceTitle(document.querySelector("h1.ytd-watch-metadata")?.textContent);
      if (heading && !/^(youtube|keepit|dictation)$/i.test(heading)) return heading;
      const pageTitle = cleanSourceTitle(document.title);
      if (pageTitle && !/^(youtube|keepit|dictation)$/i.test(pageTitle)
        && pageTitle.toLocaleLowerCase() !== genericTitle) return pageTitle;
      return "";
    } catch { return ""; }
  }

  function queueSourceTitleIndexUpdate() {
    if (!active || !sourceId) return;
    updateCompactAudioInfo();
    const title = getCurrentSourceTitle();
    if (!title || title === indexedSourceTitle) return;
    indexedSourceTitle = title;
    clearTimeout(sourceTitleSaveTimer);
    sourceTitleSaveTimer = setTimeout(() => {
      sourceTitleSaveTimer = 0;
      if (active && sourceId) void saveRecord();
    }, 80);
  }

  function observeSourceTitle() {
    sourceTitleObserver?.disconnect();
    sourceTitleObserver = null;
    indexedSourceTitle = getCurrentSourceTitle();
    if (typeof MutationObserver !== "function") return;
    const observer = new MutationObserver(queueSourceTitleIndexUpdate);
    const titleNodes = [document.querySelector("h1.ytd-watch-metadata"), document.querySelector("head title")].filter(Boolean);
    for (const node of titleNodes) observer.observe(node, { childList:true, characterData:true, subtree:true });
    sourceTitleObserver = observer;
  }

  function stopObservingSourceTitle() {
    sourceTitleObserver?.disconnect();
    sourceTitleObserver = null;
    clearTimeout(sourceTitleSaveTimer);
    sourceTitleSaveTimer = 0;
    indexedSourceTitle = "";
  }

  async function saveStudySessionIndex(session) {
    try {
      const stored = await ext.storage.local.get(studySessionIndexKey);
      const previous = studySessionIndex.normalizeIndex(stored?.[studySessionIndexKey]);
      const previousSession = previous.sessions.find(item => item.sessionId === session.sessionId);
      const sessionWithTitle = { ...session, title:session.title || previousSession?.title || "" };
      const sessions = studySessionIndex.mergeSessions(previous.sessions, sessionWithTitle);
      await ext.storage.local.set({
        [studySessionIndexKey]: {
          version: studySessionIndex.VERSION,
          updatedAt: Date.now(),
          legacyMigrationComplete: previous.legacyMigrationComplete,
          sessions,
        },
      });
    } catch (error) {
      // Overview indexing is additive: failure must never affect the existing Study progress record.
      console.warn("Could not update Study session summary", error);
    }
  }
  const STUDY_COLUMN_LAYOUT_PREFS_VERSION = 2;
  const PREVIOUS_RIGHT_COLUMN_DEFAULT = 0.30;
  const STUDY_COLUMN_RATIOS = Object.freeze({
    leftMin: 0.15,
    leftDefault: 0.25,
    leftMax: 0.30,
    centerMin: 0.35,
    rightMin: 0.20,
    rightDefault: 0.25,
    rightMax: 0.35,
  });
  const studyLayoutPrefs = { leftScale: 1, rightScale: 1, leftHidden: false, rightHidden: false };
  let studyLayoutLoadPromise = null;

  function clampStudyColumn(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  async function loadStudyLayoutPrefs() {
    if (!studyLayoutLoadPromise) {
      studyLayoutLoadPromise = (async () => {
        try {
          const result = await ext.storage.local.get(studyLayoutStorageKey);
          const stored = result?.[studyLayoutStorageKey];
          if (!stored || typeof stored !== "object") return;
          const leftScale = Number(stored.leftScale);
          let rightScale = Number(stored.rightScale);
          if (Number.isFinite(leftScale)) studyLayoutPrefs.leftScale = clampStudyColumn(leftScale, STUDY_COLUMN_RATIOS.leftMin / STUDY_COLUMN_RATIOS.leftDefault, STUDY_COLUMN_RATIOS.leftMax / STUDY_COLUMN_RATIOS.leftDefault);
          if (Number.isFinite(rightScale)) {
            const storedVersion = Number(stored.version) || 1;
            if (storedVersion < STUDY_COLUMN_LAYOUT_PREFS_VERSION && rightScale !== 1) {
              rightScale *= PREVIOUS_RIGHT_COLUMN_DEFAULT / STUDY_COLUMN_RATIOS.rightDefault;
            }
            studyLayoutPrefs.rightScale = clampStudyColumn(rightScale, STUDY_COLUMN_RATIOS.rightMin / STUDY_COLUMN_RATIOS.rightDefault, STUDY_COLUMN_RATIOS.rightMax / STUDY_COLUMN_RATIOS.rightDefault);
          }
          studyLayoutPrefs.leftHidden = stored.leftHidden === true;
          studyLayoutPrefs.rightHidden = stored.rightHidden === true;
        } catch (error) {
          console.warn("Could not load Study column layout", error);
        }
      })();
    }
    await studyLayoutLoadPromise;
  }

  function persistStudyLayoutPrefs() {
    try {
      const result = ext.storage.local.set({
        [studyLayoutStorageKey]: { version: STUDY_COLUMN_LAYOUT_PREFS_VERSION, ...studyLayoutPrefs },
      });
      result?.catch?.((error) => console.warn("Could not save Study column layout", error));
    } catch (error) {
      console.warn("Could not save Study column layout", error);
    }
  }

  function getStudyColumnVisibilityForViewSize(size) {
    const normalized = String(size || "S").toUpperCase();
    return {
      leftHidden: normalized !== "S",
      rightHidden: normalized === "L",
    };
  }

  function applyStudyViewSizeColumnPreset() {
    if (!active || !ui?.root?.classList.contains("te-study-active")) return false;
    const root = ui.root;
    const size = root.classList.contains("size-l") ? "L" : root.classList.contains("size-m") ? "M" : "S";
    const visibility = getStudyColumnVisibilityForViewSize(size);
    studyLayoutPrefs.leftHidden = visibility.leftHidden;
    studyLayoutPrefs.rightHidden = visibility.rightHidden;
    applyStudyColumnLayout();
    return true;
  }

  function getStudyColumnMetrics() {
    const width = Math.max(0, ui?.root?.clientWidth || ui?.root?.getBoundingClientRect?.().width || 0);
    const available = Math.max(0, width - 16);
    const minLeft = available * STUDY_COLUMN_RATIOS.leftMin;
    const baseLeft = available * STUDY_COLUMN_RATIOS.leftDefault;
    const maxLeft = available * STUDY_COLUMN_RATIOS.leftMax;
    const minCenter = available * STUDY_COLUMN_RATIOS.centerMin;
    const minRight = available * STUDY_COLUMN_RATIOS.rightMin;
    const baseRight = available * STUDY_COLUMN_RATIOS.rightDefault;
    const maxRight = available * STUDY_COLUMN_RATIOS.rightMax;
    return { width, available, minLeft, baseLeft, maxLeft, minCenter, minRight, baseRight, maxRight };
  }

  function getStudyColumnState() {
    const metrics = getStudyColumnMetrics();
    const leftSplitterWidth = studyLayoutPrefs.leftHidden ? 0 : 8;
    const rightSplitterWidth = studyLayoutPrefs.rightHidden ? 0 : 8;
    const leftRailWidth = studyLayoutPrefs.leftHidden ? 24 : 0;
    const rightRailWidth = studyLayoutPrefs.rightHidden ? 24 : 0;
    const panelBudget = Math.max(0, metrics.width - leftSplitterWidth - rightSplitterWidth - leftRailWidth - rightRailWidth);
    const leftWidth = studyLayoutPrefs.leftHidden ? 0 : clampStudyColumn(
      metrics.baseLeft * studyLayoutPrefs.leftScale, metrics.minLeft, metrics.maxLeft
    );
    const rightMaximum = Math.max(metrics.minRight, Math.min(
      metrics.maxRight, panelBudget - leftWidth - metrics.minCenter
    ));
    const rightWidth = studyLayoutPrefs.rightHidden ? 0 : clampStudyColumn(
      metrics.baseRight * studyLayoutPrefs.rightScale, metrics.minRight, rightMaximum
    );
    return {
      ...metrics,
      leftWidth,
      rightWidth,
      leftTrackWidth: studyLayoutPrefs.leftHidden ? 24 : leftWidth,
      rightTrackWidth: studyLayoutPrefs.rightHidden ? 24 : rightWidth,
      leftSplitterWidth,
      rightSplitterWidth,
      leftHidden: studyLayoutPrefs.leftHidden,
      rightHidden: studyLayoutPrefs.rightHidden,
    };
  }

  function getStudyColumnBounds(side, state = getStudyColumnState()) {
    const panelBudget = state.width - state.leftSplitterWidth - state.rightSplitterWidth -
      (state.leftHidden ? 24 : 0) - (state.rightHidden ? 24 : 0);
    if (side === "left") {
      const minimum = state.minLeft;
      const maximum = Math.min(state.maxLeft, panelBudget - state.rightTrackWidth - state.minCenter);
      return { minimum, maximum: Math.max(minimum, maximum) };
    }
    const minimum = state.minRight;
    const maximum = Math.min(state.maxRight, panelBudget - state.leftTrackWidth - state.minCenter);
    return { minimum, maximum: Math.max(minimum, maximum) };
  }

  function updateStudySplitterAccessibility(splitter, side, state) {
    if (!splitter) return;
    const bounds = getStudyColumnBounds(side, state);
    const value = side === "left" ? state.leftWidth : state.rightWidth;
    splitter.setAttribute("aria-valuemin", String(Math.round(bounds.minimum)));
    splitter.setAttribute("aria-valuemax", String(Math.round(bounds.maximum)));
    splitter.setAttribute("aria-valuenow", String(Math.round(value)));
    splitter.setAttribute("aria-valuetext", `${Math.round(value)} px`);
  }

  function applyStudyColumnLayout() {
    if (!ui?.root) return;
    const state = getStudyColumnState();
    const root = ui.root;
    root.style.setProperty("--te-study-left-track", `${state.leftTrackWidth}px`);
    root.style.setProperty("--te-study-right-track", `${state.rightTrackWidth}px`);
    root.style.setProperty("--te-study-left-splitter", `${state.leftSplitterWidth}px`);
    root.style.setProperty("--te-study-right-splitter", `${state.rightSplitterWidth}px`);
    root.style.setProperty("--te-study-center-min", `${state.minCenter}px`);
    root.classList.toggle("te-study-column-left-hidden", state.leftHidden);
    root.classList.toggle("te-study-column-right-hidden", state.rightHidden);
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
    ui.hideLeftColumn.setAttribute("aria-controls", "te-study-sentence-area");
    ui.hideRightColumn.setAttribute("aria-controls", "te-study-notes");
    ui.showLeftColumn.setAttribute("aria-controls", "te-study-sentence-area");
    ui.showRightColumn.setAttribute("aria-controls", "te-study-notes");
    ui.hideLeftColumn.setAttribute("aria-expanded", String(!state.leftHidden));
    ui.hideRightColumn.setAttribute("aria-expanded", String(!state.rightHidden));
    ui.showLeftColumn.setAttribute("aria-expanded", String(!state.leftHidden));
    ui.showRightColumn.setAttribute("aria-expanded", String(!state.rightHidden));
    updateStudySplitterAccessibility(ui.leftColumnSplitter, "left", state);
    updateStudySplitterAccessibility(ui.rightColumnSplitter, "right", state);
  }

  function setStudyColumnWidth(side, requestedWidth, persist = false) {
    const state = getStudyColumnState();
    const bounds = getStudyColumnBounds(side, state);
    const width = clampStudyColumn(requestedWidth, bounds.minimum, bounds.maximum);
    if (side === "left" && state.baseLeft > 0) studyLayoutPrefs.leftScale = clampStudyColumn(width / state.baseLeft, STUDY_COLUMN_RATIOS.leftMin / STUDY_COLUMN_RATIOS.leftDefault, STUDY_COLUMN_RATIOS.leftMax / STUDY_COLUMN_RATIOS.leftDefault);
    if (side === "right" && state.baseRight > 0) studyLayoutPrefs.rightScale = clampStudyColumn(width / state.baseRight, STUDY_COLUMN_RATIOS.rightMin / STUDY_COLUMN_RATIOS.rightDefault, STUDY_COLUMN_RATIOS.rightMax / STUDY_COLUMN_RATIOS.rightDefault);
    applyStudyColumnLayout();
    if (persist) persistStudyLayoutPrefs();
  }

  function setStudyColumnHidden(side, hidden) {
    if (side === "left") studyLayoutPrefs.leftHidden = hidden;
    else studyLayoutPrefs.rightHidden = hidden;
    applyStudyColumnLayout();
    const focusTarget = side === "left"
      ? (hidden ? ui.showLeftColumn : ui.hideLeftColumn)
      : (hidden ? ui.showRightColumn : ui.hideRightColumn);
    focusTarget?.focus?.({ preventScroll: true });
    persistStudyLayoutPrefs();
  }

  function resetStudyColumnWidth(side) {
    if (side === "left") studyLayoutPrefs.leftScale = 1;
    else studyLayoutPrefs.rightScale = 1;
    applyStudyColumnLayout();
    persistStudyLayoutPrefs();
  }

  function beginStudyColumnDrag(event, side, splitter) {
    if (event.button !== 0) return;
    event.preventDefault();
    const state = getStudyColumnState();
    const startX = event.clientX;
    const startWidth = side === "left" ? state.leftWidth : state.rightWidth;
    const pointerId = event.pointerId;
    let didDrag = false;
    splitter.focus?.({ preventScroll: true });
    splitter.classList.add("is-dragging");
    splitter.setPointerCapture?.(pointerId);
    const onMove = (moveEvent) => {
      if (moveEvent.pointerId !== pointerId) return;
      const delta = moveEvent.clientX - startX;
      if (!didDrag && Math.abs(delta) < 4) return;
      didDrag = true;
      setStudyColumnWidth(side, startWidth + (side === "left" ? delta : -delta));
    };
    const finish = (finishEvent) => {
      if (finishEvent.pointerId !== pointerId) return;
      splitter.removeEventListener("pointermove", onMove);
      splitter.removeEventListener("pointerup", finish);
      splitter.removeEventListener("pointercancel", finish);
      splitter.classList.remove("is-dragging");
      if (splitter.hasPointerCapture?.(pointerId)) splitter.releasePointerCapture(pointerId);
      if (didDrag && finishEvent.type === "pointerup") {
        splitter.dataset.suppressCollapseClick = "true";
        window.setTimeout(() => { delete splitter.dataset.suppressCollapseClick; }, 100);
      }
      persistStudyLayoutPrefs();
    };
    splitter.addEventListener("pointermove", onMove);
    splitter.addEventListener("pointerup", finish);
    splitter.addEventListener("pointercancel", finish);
  }

  function onStudySplitterKeyDown(event, side) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setStudyColumnHidden(side, true);
      return;
    }
    const bounds = getStudyColumnBounds(side);
    const state = getStudyColumnState();
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
    setStudyColumnWidth(side, target, true);
  }

  function installStudyColumnControls() {
    if (!ui) return;
    for (const [splitter, side] of [[ui.leftColumnSplitter, "left"], [ui.rightColumnSplitter, "right"]]) {
      let collapseTimer = null;
      splitter.addEventListener("pointerdown", (event) => beginStudyColumnDrag(event, side, splitter));
      splitter.addEventListener("click", (event) => {
        if (splitter.dataset.suppressCollapseClick === "true") {
          delete splitter.dataset.suppressCollapseClick;
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        if (event.detail === 0) return;
        if (collapseTimer) window.clearTimeout(collapseTimer);
        if (event.detail > 1) return;
        collapseTimer = window.setTimeout(() => {
          collapseTimer = null;
          if (ui?.root?.contains(splitter)) setStudyColumnHidden(side, true);
        }, 350);
      });
      splitter.addEventListener("dblclick", (event) => {
        event.preventDefault();
        if (collapseTimer) window.clearTimeout(collapseTimer);
        collapseTimer = null;
        resetStudyColumnWidth(side);
      });
      splitter.addEventListener("keydown", (event) => onStudySplitterKeyDown(event, side));
    }
    ui.hideLeftColumn.addEventListener("click", () => setStudyColumnHidden("left", true));
    ui.hideRightColumn.addEventListener("click", () => setStudyColumnHidden("right", true));
    ui.showLeftColumn.addEventListener("click", () => setStudyColumnHidden("left", false));
    ui.showRightColumn.addEventListener("click", () => setStudyColumnHidden("right", false));
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

  function showToast(message, duration = 3200, kind = "") {
    const root = A?.overlayEl?.();
    if (!root) return;
    ensureStyle(root);
    let toast = root.querySelector("#te-study-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "te-study-toast";
      toast.className = "te-study-toast";
      toast.setAttribute("role", "status");
      root.appendChild(toast);
    }
    toast.textContent = message;
    toast.dataset.dictToastKind = kind;
    toast.classList.add("visible");
    clearTimeout(toastTimer);
    toastTimer = 0;
    shadowingActivity.speechRecordingToastVisible = kind === "speech-recording";
    if (duration > 0) {
      toastTimer = setTimeout(() => {
        if (toast.dataset.dictToastKind === kind) {
          toast.classList.remove("visible");
          toast.dataset.dictToastKind = "";
        }
        toastTimer = 0;
      }, duration);
    }
  }

  function makeSvg(path) {
    return `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
  }

  function refreshLanguageLabels() {
    if (!ui) return false;
    ui.close.setAttribute("aria-label", tr("dictationClose"));
    ui.close.title = tr("dictationClose");
    ui.compactAudio.setAttribute("aria-label", tr("dictationAudioTitle"));
    ui.sentences.setAttribute("aria-label", tr("dictationSentences"));
    ui.tools.querySelector(".te-study-mode-switch")?.setAttribute("aria-label", tr("dictationModeGroup"));
    for (const selector of [".te-study-stats-card", ".te-study-stats-filter-bar", ".te-study-stats-scroll"]) {
      ui.notesPanel.querySelector(selector)?.setAttribute("aria-label", tr("dictationWrongStatsTitle"));
    }
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
    ui.labels = [...ui.root.querySelectorAll("[data-study-label]")];
    ui.labels.forEach((node) => { node.textContent = tr(node.dataset.studyLabel); });
    setTranslationToggleState(translationAlwaysVisible());
    const speechShortcutTexts = tr("dictationSpeechShortcutHint").split(/\s*·\s*/).slice(0, 4);
    ui.speechShortcuts.replaceChildren(...speechShortcutTexts.map((text) => {
      const item = document.createElement("span");
      item.textContent = text;
      return item;
    }));
    ui.miniSource.textContent = tr("dictationAudioSource");
    ui.heading.textContent = tr(studyMode === "speaking" ? "dictationSpeakTitle" : "dictationTitle");
    const compactMedia = ui.root.classList.contains("te-study-media-compact");
    const mediaToggleLabel = tr(compactMedia ? "dictationExpandVideo" : "dictationCompactVideo");
    ui.mediaCompactToggle.title = mediaToggleLabel;
    ui.mediaCompactToggle.setAttribute("aria-label", mediaToggleLabel);
    const media = attachedMedia || A?.state?.activeMedia;
    const miniPlayLabel = tr(media && !media.paused ? "dictationMiniPause" : "dictationMiniPlay");
    ui.miniPlay.title = miniPlayLabel;
    ui.miniPlay.setAttribute("aria-label", miniPlayLabel);
    shadowingActivity.updateSpeechMicState(ui.speechMic.classList.contains("listening"));
    shadowingActivity.updateSpeechAutoRecordControl();
    if (captionStatusKey) ui.loadingStatus.textContent = tr(captionStatusKey);
    if (ui.properNounHint && !ui.properNounHint.hidden) renderProperNounHint(sentenceCues[current]?.en || "");
    updateProgressSyncControl();
    applyStudyColumnLayout();
    if (shadowingActivity.lastSpeechFeedback && !ui.success.hidden) {
      const feedback = shadowingActivity.lastSpeechFeedback;
      shadowingActivity.setSpeechFeedback(feedback.tier, feedback.percent, feedback.sentence, feedback.perfect);
    }
    return true;
  }

  function build() {
    if (ui) return;
    const root = A?.overlayEl?.();
    if (!root) return;
    ui = globalThis.LHN_OVERLAY_TEMPLATE?.createStudyUi?.({ root, tr, makeSvg, repeatCount }) || null;
    if (!ui) return;
    ui.success.addEventListener("animationend", (event) => {
      if (event.animationName === "teDictSpeechToastSpringPop") ui.success.classList.remove("te-shadowing-toast-spring");
    });
    for (const button of [ui.previous, ui.next, ui.replay]) {
      if (button) ui.originalButtonState.set(button, { disabled: button.disabled, aria: button.getAttribute("aria-disabled") });
    }
    refreshLanguageLabels();
    installStudyColumnControls();
    updateCompactAudioInfo();
    updateCompactAudioPlaybackState();
    ui.mediaCompactToggle.addEventListener("click", toggleCompactMedia);
    ui.translationToggle.addEventListener("click", onTranslationToggle);
    ui.miniPlay.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleMediaPlayback();
    });
    ui.playerSlot.addEventListener("transitionend", onPlayerSlotTransitionEnd);
    if (typeof ResizeObserver === "function") {
      ui.playerResizeObserver = new ResizeObserver(onStudyPlayerResize);
      ui.playerResizeObserver.observe(ui.left);
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
    ui.speakControl.addEventListener("click", () => setStudyMode("speaking"));
    ui.typeControl.addEventListener("click", () => { setStudyMode("typing"); focusInputIfTyping(); });
    ui.syncProgressControl.addEventListener("click", toggleProgressSync);
    ui.speechAutoToggle.addEventListener("click", shadowingActivity.toggleSpeechAutoRecord);
    ui.speechMic.addEventListener("click", () => { void shadowingActivity.toggleSpeechRecognition(); });
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

  function syncStudyModeButtons() {
    const typingButton = A?.ctrl?.("Chép chính tả") || A?.overlayEl?.()?.querySelector?.("#te-dictation-mode-btn");
    const speakingButton = A?.overlayEl?.()?.querySelector?.("#te-shadowing-mode-btn");
    const typingActive = active && studyMode === "typing";
    const speakingActive = active && studyMode === "speaking";
    typingButton?.classList.toggle("te-active", typingActive);
    typingButton?.setAttribute("aria-pressed", String(typingActive));
    speakingButton?.classList.toggle("te-active", speakingActive);
    speakingButton?.setAttribute("aria-pressed", String(speakingActive));
  }

  function focusInputIfTyping() {
    if (studyMode === "typing") ui?.input.focus({ preventScroll: true });
  }

  function setStudyMode(mode) {
    if (mode !== "typing" && mode !== "speaking") return;
    const changed = mode !== studyMode;
    const swapProgress = changed && active && progressReady && !progressSyncEnabled;
    if (swapProgress) {
      captureNoteDraft();
      storeActiveModeProgress(studyMode);
    }
    if (changed && mode !== "speaking") shadowingActivity.stopSpeechRecognition(true);
    if (changed && mode === "speaking") {
      shadowingActivity.speechAnswerRevealed = false;
      shadowingActivity.clearRecordedSpeech();
    }
    studyMode = mode;
    if (active) globalThis.LHN_OVERLAY_SET_STUDY_ACTIVITY?.(mode === "speaking" ? "shadowing" : "dictation");
    syncRepeatButtons();
    shadowingActivity.updateSpeechCheckDisabled();
    A?.setPreferredLearningMode?.(mode);
    if (swapProgress) applyModeProgress(mode);
    if (ui) {
      if (changed) {
        onAnswerInput();
        shadowingActivity.resetSpeechFeedback();
      }
      const speaking = mode === "speaking";
      ui.root.classList.toggle("te-shadowing-active", speaking);
      ui.speechPractice.hidden = !speaking;
      if (speaking) ui.speechPractice.insertBefore(ui.translation, ui.speechShortcuts.nextSibling);
      else ui.translationSlot.appendChild(ui.translation);
      ui.speakControl.classList.toggle("active", speaking);
      ui.typeControl.classList.toggle("active", !speaking);
      ui.speakControl.setAttribute("aria-pressed", String(speaking));
      ui.typeControl.setAttribute("aria-pressed", String(!speaking));
      ui.heading.textContent = tr(speaking ? "dictationSpeakTitle" : "dictationTitle");
      ui.speechTarget.textContent = sentenceCues[current]?.en || "";
      shadowingActivity.setSpeechTargetState("practice");
      ui.speechMic.disabled = !sentenceCues[current];
      if (changed && speaking) {
        shadowingActivity.setSpeechStatus("");
        ui.speechResult.replaceChildren();
        ui.speechResultWrap.hidden = true;
      }
    }
    if (changed && ui) renderWrongWordStats();
    syncStudyModeButtons();
    if (swapProgress) {
      pendingResumeIndex = current;
      listStart = 0;
      listEnd = 0;
      renderInitialRows();
      renderCurrent();
      if (sentenceCues[current]) playSentence(current, { count: getRepeatCount() + 1 });
      void saveRecord();
    }
  }

  function getScoreColorTier(percent) {
    if (!Number.isFinite(percent)) return null;
    if (percent >= 70) return "green";
    return percent >= 40 ? "yellow" : "red";
  }

  function updateScoreTierColors(percent) {
    if (!ui?.root) return;
    const colorTier = getScoreColorTier(percent);
    for (const name of ["green", "yellow", "red"]) ui.root.classList.toggle(`te-dict-score-${name}`, colorTier === name);
    const speechTier = studyMode === "speaking" ? shadowingActivity.getSpeechScoreTier(percent) : null;
    if (ui.speechResultWrap) {
      ui.speechResultWrap.classList.toggle("state-warn", speechTier === "warn");
      ui.speechResultWrap.classList.toggle("state-fail", speechTier === "fail");
    }
  }

  function refocus() { focusInputIfTyping(); }

  function getRepeatCount() {
    return studyMode === "speaking" ? speakingRepeatCount : repeatCount;
  }

  function syncRepeatButtons() {
    const count = getRepeatCount();
    ui?.repeatBtns.forEach((button) => button.classList.toggle("active", Number(button.dataset.count) === count));
  }

  function setRepeat(count) {
    const value = Math.max(0, Math.min(3, count | 0));
    if (studyMode === "speaking") speakingRepeatCount = value;
    else repeatCount = value;
    syncRepeatButtons();
  }

  function updateCompactAudioInfo() {
    if (!ui) return;
    const title = cleanSourceTitle(document.querySelector("h1.ytd-watch-metadata")?.textContent) || cleanSourceTitle(document.title);
    ui.miniTitle.textContent = `Keepit - ${title || tr("dictationTitle")}`;
    ui.miniSource.textContent = tr("dictationAudioSource");
    const isWebSource = A?.state?.sourceType === 'web';
    const sourceUrl = String(isWebSource ? A?.state?.webSourceUrl || globalThis.location?.href || "" : globalThis.location?.href || "");
    const thumbnailUrl = isWebSource ? thumbnails?.fromPageMetadata?.(document, sourceUrl) || "" : "";
    if (thumbnails?.loadSource) {
      ui.miniThumb.hidden = false;
      thumbnails.loadSource(ui.miniThumb, { url:sourceUrl, thumbnailUrl, onError:() => { ui.miniThumb.hidden = true; } });
    } else {
      ui.miniThumb.hidden = true;
      thumbnails?.clear(ui.miniThumb);
    }
    const compact = ui.root.classList.contains("te-study-media-compact");
    const label = tr(compact ? "dictationExpandVideo" : "dictationCompactVideo");
    ui.mediaCompactToggle.title = label;
    ui.mediaCompactToggle.setAttribute("aria-label", label);
    ui.mediaCompactToggle.setAttribute("aria-pressed", String(compact));
    ui.mediaCompactToggle.innerHTML = makeSvg(compact
      ? '<path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/>'
      : '<path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/>');
  }

  function updateCompactAudioPlaybackState() {
    if (!ui) return;
    const media = attachedMedia || A?.state?.activeMedia;
    const playing = !!media && !media.paused;
    ui.compactAudio.classList.toggle("playing", playing);
    const label = tr(playing ? "dictationMiniPause" : "dictationMiniPlay");
    ui.miniPlay.title = label;
    ui.miniPlay.setAttribute("aria-label", label);
    ui.miniPlayIcon.innerHTML = makeSvg(playing
      ? '<path d="M6 5h4v14H6zM14 5h4v14h-4z"/>'
      : '<path d="M8 5v14l11-7z"/>');
  }

  function toggleCompactMedia() {
    if (!ui?.playerSlot) return;
    const compact = ui.root.classList.contains("te-study-media-compact");
    const slot = ui.playerSlot;
    const currentHeight = slot.getBoundingClientRect().height;
    if (!currentHeight) return;
    if (!compact && !ui.playerExpandedHeightSaved) {
      ui.playerExpandedHeight = currentHeight;
      ui.playerExpandedHeightSaved = true;
    }
    const targetHeight = compact ? ui.playerExpandedHeight : ui.playerExpandedHeight / 3;
    if (!targetHeight) return;
    const token = ++ui.playerTransitionToken;
    slot.style.height = `${currentHeight}px`;
    void slot.offsetHeight;
    ui.root.classList.toggle("te-study-media-compact", !compact);
    updateCompactAudioInfo();
    requestAnimationFrame(() => {
      if (!ui || ui.playerTransitionToken !== token) return;
      slot.style.height = `${targetHeight}px`;
    });
  }

  function onPlayerSlotTransitionEnd(event) {
    if (!ui || event.target !== ui.playerSlot || event.propertyName !== "height") return;
    if (ui.root.classList.contains("te-study-media-compact")) return;
    if (ui.playerExpandedHeightSaved) {
      ui.playerExpandedHeight = ui.playerSlot.getBoundingClientRect().height;
      ui.playerExpandedHeightSaved = false;
    }
    const original = ui.originalPlayerSlotHeight;
    if (original.value) ui.playerSlot.style.setProperty("height", original.value, original.priority);
    else ui.playerSlot.style.removeProperty("height");
  }

  function onStudyPlayerResize() {
    if (!ui?.root.classList.contains("te-study-media-compact") || !ui.playerExpandedHeightSaved) return;
    const slotWidth = ui.playerSlot.getBoundingClientRect().width;
    const leftHeight = ui.left.getBoundingClientRect().height;
    const media = attachedMedia || A?.state?.activeMedia;
    const aspect = media?.videoWidth && media?.videoHeight ? media.videoWidth / media.videoHeight : 16 / 9;
    if (!slotWidth || !leftHeight || !aspect) return;
    ui.playerExpandedHeight = Math.min(slotWidth / aspect, leftHeight * .42);
    if (ui.playerExpandedHeight > 0) ui.playerSlot.style.height = `${ui.playerExpandedHeight / 3}px`;
  }


  function showToastBeforeOpen() {
    const currentId = A?.state?.sourceId;
    const loading = !!currentId && A?.state?.loadingFor === currentId;
    const unavailableKey = A?.state?.sourceType === 'web' ? "dictationWebTextUnavailable" : "dictationEnglishOnly";
    showToast(tr(loading ? "dictationCaptionsLoading" : unavailableKey));
  }

  async function loadProgress(requestSourceId, generation) {
    const key = `dictation:${requestSourceId}`;
    let record = {};
    try {
      record = (await ext.storage.local.get(key))[key] || {};
    } catch {}
    if (!active || sourceId !== requestSourceId || panelGeneration !== generation) return null;
    const storedTitle = cleanSourceTitle(record.title);
    if (storedTitle && !getCurrentSourceTitle()) indexedSourceTitle = storedTitle;
    const sharedProgress = normalizeProgressSnapshot({ current: record.current, solved: record.solved });
    const storedByMode = record.progressByMode && typeof record.progressByMode === "object" ? record.progressByMode : {};
    progressByMode = {
      typing: normalizeProgressSnapshot(storedByMode.typing, sharedProgress),
      speaking: normalizeProgressSnapshot(storedByMode.speaking, sharedProgress),
    };
    if (progressSyncEnabled) {
      const mergedSolved = new Set([...progressByMode.typing.solved, ...progressByMode.speaking.solved]);
      const currentWasSolvedInSharedRecord = sharedProgress.solved.includes(sharedProgress.current);
      const currentSolvedInOtherTrack = !currentWasSolvedInSharedRecord && mergedSolved.has(sharedProgress.current);
      current = currentSolvedInOtherTrack
        ? findNextUnsolvedIndex(mergedSolved, sharedProgress.current)
        : sharedProgress.current;
      solved = mergedSolved;
      const synchronized = currentProgressSnapshot();
      progressByMode = { typing: cloneProgressSnapshot(synchronized), speaking: cloneProgressSnapshot(synchronized) };
    } else {
      applyModeProgress(studyMode);
    }
    notes = record.notes && typeof record.notes === "object" ? record.notes : {};
    translations = record.translations && typeof record.translations === "object" ? record.translations : {};
    wrongWordStats = normalizeWrongWordStats(record.wrongWordStats);
    speakingWrongWordStats = normalizeWrongWordStats(record.speakingWrongWordStats);
    return record;
  }

  function saveRecord() {
    if (!sourceId || !ext?.storage?.local || !progressReady) return Promise.resolve();
    const isWebSource = A?.state?.sourceType === 'web';
    const sessionSourceType = isWebSource ? "web" : "youtube";
    const sessionSourceId = isWebSource ? String(A?.state?.sourceId || sourceId) : sourceId;
    const sessionUrl = isWebSource ? String(A?.state?.webSourceUrl || globalThis.location?.href || "")
      : `https://www.youtube.com/watch?v=${encodeURIComponent(sourceId)}`;
    const sessionId = `${sessionSourceType}:${sessionSourceId}`;
    const totalCount = sentenceCues.length;
    const solvedCount = solved.size;
    const title = getCurrentSourceTitle() || indexedSourceTitle;
    const titleUpdatedAt = title ? Date.now() : 0;
    if (title) indexedSourceTitle = title;
    const activeProgress = currentProgressSnapshot();
    if (progressSyncEnabled) {
      progressByMode = { typing: cloneProgressSnapshot(activeProgress), speaking: cloneProgressSnapshot(activeProgress) };
    } else {
      progressByMode[progressModeKey()] = cloneProgressSnapshot(activeProgress);
    }
    const record = {
      version:1, current, solved:[...solved], progressByMode,
      notes, translations, wrongWordStats, speakingWrongWordStats, title, titleUpdatedAt,
    };
    const session = {
      version: 1,
      sessionId,
      sourceType: sessionSourceType,
      sourceId: sessionSourceId,
      title,
      url: sessionUrl,
      currentIndex: Math.max(0, Math.floor(Number(current) || 0)),
      totalCount: Math.max(0, Math.floor(Number(totalCount) || 0)),
      solvedCount: Math.max(0, Math.floor(Number(solvedCount) || 0)),
      updatedAt: titleUpdatedAt || Date.now(),
      status: totalCount > 0 && solvedCount >= totalCount ? "complete" : "in_progress",
    };
    return ext.storage.local.set({ [storageKey()]: record })
      .then(() => { void saveStudySessionIndex(session); })
      .catch(() => {});
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

  function captureNoteDraft() {
    if (!active || !ui || !solved.has(current)) return false;
    clearTimeout(saveTimer);
    notes[String(current)] = { ...(notes[String(current)] || {}), note: ui.note.value };
    return true;
  }

  function flushNotes() {
    if (captureNoteDraft()) void saveRecord();
  }

  function normalizeWrongWordStats(value) {
    const normalized = { version: 3, words: {} };
    if (!value || value.version !== 3 || !value.words || typeof value.words !== "object") return normalized;
    const safeCount = (candidate) => {
      const number = Number(candidate);
      return Number.isFinite(number) ? Math.max(0, Math.floor(number)) : 0;
    };
    for (const [storageKey, item] of Object.entries(value.words)) {
      if (!storageKey.startsWith("w:") || !item || typeof item !== "object") continue;
      const word = typeof item.word === "string" ? item.word : storageKey.slice(2);
      if (!word || globalThis.LHN_STUDY_RULES.countLetters(word) < 4) continue;
      const errors = safeCount(item.errors);
      if (errors < 1) continue;
      const variants = {};
      const sourceVariants = item.variants && typeof item.variants === "object" ? item.variants : {};
      for (const [key, variant] of Object.entries(sourceVariants)) {
        if (!key.startsWith("v:") || key === "v:__missing__" || !variant || typeof variant !== "object") continue;
        const typeCounts = {};
        for (const type of ["phonetic", "rule", "typo"]) typeCounts[type] = safeCount(variant.typeCounts?.[type]);
        variants[key] = { text: typeof variant.text === "string" ? variant.text : "", count: safeCount(variant.count), typeCounts };
      }
      const occurrences = {};
      const sourceOccurrences = item.occurrences && typeof item.occurrences === "object" ? item.occurrences : {};
      for (const [key, occurrence] of Object.entries(sourceOccurrences)) {
        if (!key.startsWith("o:") || !occurrence || typeof occurrence !== "object") continue;
        occurrences[key] = {
          pending:!!occurrence.pending, wrongStreak:safeCount(occurrence.wrongStreak),
          errorType:["phonetic", "rule", "typo"].includes(occurrence.errorType) ? occurrence.errorType : "rule",
        };
      }
      const typeCounts = {}, typeFixes = {}, errorExamples = {};
      for (const type of ["phonetic", "rule", "typo"]) {
        typeCounts[type] = safeCount(item.typeCounts?.[type]);
        typeFixes[type] = safeCount(item.typeFixes?.[type]);
        const example = item.errorExamples?.[type];
        if (example && typeof example === "object" && typeof example.typed === "string") {
          errorExamples[type] = {
            before:String(example.before || ""), typed:example.typed, after:String(example.after || ""), lastAt:safeCount(example.lastAt),
          };
        }
      }
      const errorContext = item.errorContext && typeof item.errorContext === "object"
        ? { before:String(item.errorContext.before || ""), typed:String(item.errorContext.typed || ""), after:String(item.errorContext.after || "") }
        : null;
      normalized.words[storageKey] = {
        word,
        errors,
        corrections: safeCount(item.corrections),
        variants,
        occurrences,
        typeCounts,
        typeFixes,
        errorExamples,
        lastErrorType: ["phonetic", "rule", "typo"].includes(item.lastErrorType) ? item.lastErrorType : "rule",
        errorContext,
        lastResult: item.lastResult === "wrong" ? "wrong" : "correct",
        lastAt: safeCount(item.lastAt),
      };
    }
    return normalized;
  }

  function recordWrongWordSubmission(stats, cueIndex, result, referenceSentence, timestamp = Date.now()) {
    return globalThis.LHN_STUDY_RULES.recordWrongWordSubmission(stats, cueIndex, result, referenceSentence, timestamp);
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
    const speaking = studyMode === "speaking";
    const stats = normalizeWrongWordStats(speaking ? speakingWrongWordStats : wrongWordStats);
    const summaryKey = speaking ? "dictationWrongStatsSpeakingSummary" : "dictationWrongStatsSummary";
    if (ui.statsSummary) {
      ui.statsSummary.dataset.studyLabel = summaryKey;
      ui.statsSummary.textContent = tr(summaryKey);
    }
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
      empty.className = "te-study-stats-empty";
      empty.setAttribute("role", "status");
      empty.textContent = allItems.length ? tr("dictationWrongStatsNoResults") : tr("dictationWrongStatsEmpty");
      ui.statsScroll.appendChild(empty);
      return;
    }

    const label = (key) => {
      const node = document.createElement("span");
      node.dataset.studyLabel = key;
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
      chip.className = `te-study-stats-variant${extra ? " extra" : ""}`;
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
      article.className = "te-study-stats-word";

      const head = document.createElement("div");
      head.className = "te-study-stats-word-head";
      const title = document.createElement("div");
      title.className = "te-study-stats-word-title";
      const rankNode = document.createElement("span");
      rankNode.className = `te-study-stats-rank${rank <= 3 ? " top3" : ""}`;
      rankNode.textContent = `#${rank}`;
      const word = document.createElement("strong");
      word.textContent = item.word;
      title.append(rankNode, word);
      const status = document.createElement("span");
      status.className = `te-study-stats-status ${isWrong ? "wrong" : "correct"}`;
      const statusDot = document.createElement("i");
      statusDot.setAttribute("aria-hidden", "true");
      status.append(statusDot, label(isWrong ? "dictationWrongStatsLastWrong" : "dictationWrongStatsLastCorrect"));
      head.append(title, status);

      const metrics = document.createElement("div");
      metrics.className = "te-study-stats-metrics";
      metrics.append(countMetric("dictationWrongStatsErrors", item.errors, "wrong"));
      metrics.append(countMetric("dictationWrongStatsCorrect", item.corrections, "correct"));
      const rateMetric = document.createElement("span");
      rateMetric.append(label("dictationWrongStatsAccuracy"));
      const rateValue = document.createElement("strong");
      rateValue.textContent = `${rate}%`;
      rateMetric.appendChild(rateValue);
      metrics.appendChild(rateMetric);

      const bar = document.createElement("div");
      bar.className = "te-study-stats-accuracy";
      bar.setAttribute("aria-hidden", "true");
      const fill = document.createElement("span");
      fill.style.width = `${rate}%`;
      bar.appendChild(fill);

      const variantsWrap = document.createElement("div");
      variantsWrap.className = "te-study-stats-variants";
      const variantsLabel = label("dictationWrongStatsVariants");
      variantsLabel.className = "te-study-stats-variants-label";
      const variantList = document.createElement("div");
      variantList.className = "te-study-stats-variant-list";
      const variants = Object.values(item.variants || {}).sort((a, b) => b.count - a.count || a.text.localeCompare(b.text));
      variants.forEach((variant, index) => variantList.appendChild(variantChip(variant, index >= 2)));
      const extras = variants.slice(2);
      let details = null;
      if (extras.length) {
        details = document.createElement("details");
        details.className = "te-study-stats-more";
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

  function updateAnswerStackOffset() {
    if (!ui?.root) return;
    ui.root.classList.toggle("te-dict-answer-stack-pending", !checkedCurrent);
  }

  function setScore(percent) {
    if (!ui) return;
    const has = Number.isFinite(percent);
    updateAnswerStackOffset();
    ui.score.textContent = has ? `${percent}%` : "---";
    ui.toolbarScore.textContent = `${has ? percent : 0}%`;
    ui.ring.style.strokeDashoffset = String(56.55 - (56.55 * (has ? percent : 0)) / 100);
    updateScoreTierColors(percent);
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

  let activeMissingInputSlots = [];

  function clearInputWrongMarks() {
    activeMissingInputSlots = [];
    if (!ui?.inputMarkup) return;
    ui.inputMarkup.hidden = true;
    ui.inputMarkupContent?.replaceChildren();
    ui.inputMarkupContent?.style.removeProperty("transform");
  }

  function findMissingBeforeCorrect(operations) {
    const matches = [];
    for (let index = 0; index < operations.length;) {
      if (operations[index].type !== "missing") { index++; continue; }
      const startIndex = index;
      const missingOperations = [];
      let lastExpectedIndex = null;
      let isContiguous = true;
      while (operations[index]?.type === "missing") {
        const missing = operations[index];
        const expectedIndices = missing.expectedIndices || [];
        if (!expectedIndices.length) isContiguous = false;
        for (const expectedIndex of expectedIndices) {
          if (lastExpectedIndex !== null && expectedIndex !== lastExpectedIndex + 1) isContiguous = false;
          lastExpectedIndex = expectedIndex;
        }
        missingOperations.push(missing);
        index++;
      }
      const following = operations[index];
      const followingExpectedIndices = following?.expectedIndices || [];
      const followingTypedIndices = following?.typedIndices || [];
      if (isContiguous && missingOperations.length && following?.type === "ok"
        && followingExpectedIndices.length === 1 && followingTypedIndices.length === 1
        && followingExpectedIndices[0] === lastExpectedIndex + 1) {
        matches.push({
          index: startIndex,
          missingOperations,
          expectedIndices: missingOperations.flatMap((operation) => operation.expectedIndices || []),
          following,
          nextTypedIndex: followingTypedIndices[0],
        });
      }
    }
    return matches;
  }

  function renderInputWrongMarks(operations, missingPatterns = findMissingBeforeCorrect(operations)) {
    if (!ui?.inputMarkup || !ui.inputMarkupContent) return;
    const originalValue = ui.input.value;
    const originalTypedWords = [...originalValue.matchAll(/[\p{L}\p{N}’‘`´']+/gu)];
    const referenceWords = getTranscriptWordTokens(sentenceCues[current]?.en || "");
    const edits = [];
    for (const pattern of missingPatterns) {
      const nextWord = originalTypedWords[pattern.nextTypedIndex];
      if (!nextWord) continue;
      const previousWord = originalTypedWords[pattern.nextTypedIndex - 1];
      const gapStart = previousWord ? previousWord.index + previousWord[0].length : 0;
      const gapEnd = nextWord.index;
      const gap = originalValue.slice(gapStart, gapEnd);
      const trailingSpaces = gap.match(/[ \t]*$/u)?.[0] || "";
      const editStart = gapEnd - trailingSpaces.length;
      const missingWords = pattern.expectedIndices.map((wordIndex) => referenceWords[wordIndex]?.display || "").filter(Boolean);
      if (!missingWords.length) continue;
      const slotLengths = missingWords.map((word) => Math.max(2, [...word].length * 2));
      let replacement = " ";
      for (let index = 0; index < slotLengths.length; index++) {
        replacement += " ".repeat(slotLengths[index]);
        replacement += index < slotLengths.length - 1 ? "  " : " ";
      }
      edits.push({ start: editStart, end: gapEnd, replacement, slotLengths });
    }
    edits.sort((left, right) => left.start - right.start || left.end - right.end);

    const missingRanges = [];
    let value = originalValue;
    if (edits.length) {
      let cursor = 0;
      let normalizedValue = "";
      for (const edit of edits) {
        if (edit.start < cursor) continue;
        normalizedValue += originalValue.slice(cursor, edit.start);
        let slotStart = normalizedValue.length + 1;
        for (const slotLength of edit.slotLengths) {
          missingRanges.push({ start: slotStart, end: slotStart + slotLength, missing: true });
          slotStart += slotLength + 2;
        }
        normalizedValue += edit.replacement;
        cursor = edit.end;
      }
      normalizedValue += originalValue.slice(cursor);
      if (normalizedValue !== originalValue) {
        const selectionStart = Number.isInteger(ui.input.selectionStart) ? ui.input.selectionStart : null;
        const selectionEnd = Number.isInteger(ui.input.selectionEnd) ? ui.input.selectionEnd : null;
        const selectionDirection = ui.input.selectionDirection;
        ui.input.value = normalizedValue;
        const adjustSelection = (position) => {
          let shift = 0;
          for (const edit of edits) {
            if (position < edit.start) break;
            const delta = edit.replacement.length - (edit.end - edit.start);
            if (position >= edit.end) { shift += delta; continue; }
            return edit.start + shift + edit.replacement.length;
          }
          return position + shift;
        };
        if (selectionStart !== null && selectionEnd !== null) {
          try { ui.input.setSelectionRange(adjustSelection(selectionStart), adjustSelection(selectionEnd), selectionDirection || "none"); } catch { /* input type may not expose a text selection */ }
        }
        value = normalizedValue;
      }
    }

    const typedWords = [...value.matchAll(/[\p{L}\p{N}’‘`´']+/gu)];
    const ranges = [...missingRanges];
    activeMissingInputSlots = missingRanges.map(({ start, end }) => ({ start, end }));
    let typedIndex = 0;
    for (const operation of operations) {
      if (operation.type === "missing") continue;
      const indices = operation.typedIndices || [];
      const startIndex = indices.length ? indices[0] : typedIndex;
      const match = typedWords[startIndex];
      if (match && (operation.type === "wrong" || operation.type === "extra")) {
        ranges.push({ start: match.index, end: match.index + match[0].length, missing: false });
      }
      typedIndex = indices.length ? Math.max(typedIndex, ...indices) + 1 : typedIndex + 1;
    }
    ranges.sort((left, right) => left.start - right.start || Number(right.missing) - Number(left.missing));
    if (!ranges.length) { clearInputWrongMarks(); return; }
    const fragment = document.createDocumentFragment();
    let offset = 0;
    for (const range of ranges) {
      if (range.start < offset) continue;
      if (range.start > offset) fragment.append(document.createTextNode(value.slice(offset, range.start)));
      const mark = document.createElement("span");
      mark.className = range.missing ? "te-dict-input-missing-gap" : "te-dict-input-wrong-word";
      mark.textContent = value.slice(range.start, range.end);
      if (range.missing) mark.setAttribute("aria-hidden", "true");
      fragment.append(mark);
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
    const wasSuccessVisible = !ui.success.hidden;
    const keepSpeechToast = shadowingActivity.shouldKeepVietnameseSpeechToast();
    checkedCurrent = false;
    ui.input.classList.remove("correct");
    ui.check.classList.add("te-dict-act-primary");
    ui.check.classList.remove("te-dict-done");
    ui.btnNext?.classList.remove("te-dict-ready");
    setScore(null);
    ui.error.hidden = true;
    ui.work?.classList.remove("te-dict-has-error");
    ui.success.hidden = !keepSpeechToast;
    if (wasSuccessVisible) renderProperNounHint(sentenceCues[current]?.en || "");
    syncCurrentTranslationDisplay();
    if (wasChecked) updateRows(false);
  }

  function updateRows(scrollCurrent = true) {
    if (!ui) return;
    ui.sentences.querySelectorAll(".te-study-row").forEach((row) => {
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
      const translation = row.querySelector(".te-study-vi");
      const showTranslation = !isLocked;
      translation.textContent = showTranslation ? (translations[String(index)] || tr("dictationTranslationLoading")) : "";
      translation.hidden = !showTranslation;
      if (showTranslation && !translations[String(index)]) void ensureVietnamese(index);
    });
    if (scrollCurrent) {
      const currentRow = ui.sentences.querySelector(`.te-study-row[data-index="${current}"]`);
      currentRow?.scrollIntoView({ block: "center" });
    }
  }

  function createSentenceRow(index) {
    const cue = sentenceCues[index];
    const row = document.createElement("button");
    row.type = "button";
    row.className = "te-study-row";
    row.dataset.index = String(index);
    row.disabled = index > current || (index === current && !checkedCurrent);
    row.classList.toggle("past", index < current);
    row.setAttribute("role", "listitem");
    row.innerHTML = `<span class="te-study-num"></span><span class="te-study-text"></span><span class="te-study-icon" aria-hidden="true"><svg class="play" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg><svg class="vol" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/></svg></span><span class="te-study-vi" hidden></span>`;
    row.querySelector(".te-study-num").textContent = String(index + 1);
    row.querySelector(".te-study-text").textContent = cue.en;
    const translation = row.querySelector(".te-study-vi");
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
    ui.notesPanel.classList.toggle("te-study-notes-locked", locked);
    ui.lock.hidden = !locked;
    ui.note.disabled = locked;
    ui.save.disabled = locked;
  }

  function setCaptionStatus(message = "", keepControlsDisabled = false, languageKey = "") {
    captionStatusKey = languageKey;
    if (!ui) return;
    ui.loadingStatus.textContent = message;
    ui.loadingStatus.hidden = !message;
    const disabled = keepControlsDisabled || !sentenceCues.length;
    captionControlsDisabled = disabled;
    ui.input.disabled = disabled;
    shadowingActivity.updateSpeechCheckDisabled();
    for (const button of [ui.btnPrev, ui.btnReplay, ui.btnSlow, ui.btnNext, ui.previous, ui.next, ui.replay]) {
      if (button) button.disabled = disabled;
    }
  }

  function setCaptionStatusForKey(key, keepControlsDisabled = false) {
    setCaptionStatus(key ? tr(key) : "", keepControlsDisabled, key);
  }

  function renderProperNounHint(sentence) {
    if (!ui?.properNounHint) return;
    const names = globalThis.LHN_STUDY_RULES.getProperNounHints(sentence);
    ui.properNounHint.replaceChildren();
    ui.properNounHint.hidden = names.length === 0;
    if (!names.length) return;
    const label = document.createElement("strong");
    label.textContent = `${tr("dictationProperNounHint")}:`;
    const values = document.createElement("span");
    values.textContent = names.join(", ");
    ui.properNounHint.append(label, values);
  }

  function renderCurrent() {
    if (!ui || !active) return;
    const keepSpeechToast = shadowingActivity.shouldKeepVietnameseSpeechToast();
    shadowingActivity.stopSpeechRecognition(true);
    shadowingActivity.speechAnswerRevealed = false;
    checkedCurrent = false;
    hintResult = null;
    while (current < listStart && listStart > 0) renderPrevious();
    while (current >= listEnd && listEnd < sentenceCues.length) renderMore();
    updateCounter();
    updateRows();
    updateProgressControls();
    const wasSolved = sentenceCues.length > 0 && solved.has(current);
    setNotesLocked(true);
    ui.btnNext?.classList.remove("te-dict-ready");
    ui.check?.classList.add("te-dict-act-primary");
    ui.check?.classList.remove("te-dict-done");
    const saved = notes[String(current)] || {};
    ui.note.value = typeof saved.note === "string" ? saved.note : "";
    ui.saved.textContent = "";
    escapeFilledAnswer = false;
    ui.input.value = "";
    ui.speechTarget.textContent = sentenceCues[current]?.en || "";
    shadowingActivity.setSpeechTargetState("practice");
    ui.speechMic.disabled = !sentenceCues[current];
    ui.speechResult.replaceChildren();
    ui.speechResultWrap.hidden = true;
    shadowingActivity.setSpeechStatus("");
    renderProperNounHint(sentenceCues[current]?.en || "");
    clearInputWrongMarks();
    ui.input.classList.remove("correct");
    ui.error.hidden = true;
    ui.work?.classList.remove("te-dict-has-error");
    ui.errorWords.replaceChildren();
    ui.success.hidden = !keepSpeechToast;
    if (!keepSpeechToast) shadowingActivity.resetSpeechFeedback();
    ui.translation.textContent = "";
    syncCurrentTranslationDisplay(translationAlwaysVisible());
    setScore(wasSolved ? 100 : null);
  }

  function selectSentence(index) {
    if (!sentenceCues[index]) return;
    flushNotes();
    current = index;
    renderCurrent();
    void saveRecord();
    prepareCue();
    playSentence(index, { count: getRepeatCount() + 1 });
    focusInputIfTyping();
  }

  function syncCurrentTranslationDisplay(requestIfMissing = false) {
    if (!ui) return;
    const shouldShow = Boolean(sentenceCues[current]) && (checkedCurrent || translationAlwaysVisible());
    ui.translation.hidden = !shouldShow;
    if (!shouldShow) {
      ui.translation.textContent = "";
      return;
    }
    const translated = translations[String(current)] || "";
    if (translated) ui.translation.textContent = translated;
    else if (!ui.translation.textContent) ui.translation.textContent = tr("dictationTranslationLoading");
    if (requestIfMissing && !translated) void ensureVietnamese(current);
  }

  function updateTranslationViews(index) {
    if (!ui) return;
    const translated = translations[String(index)] || "";
    const canShowTranslation = index < current || (index === current && checkedCurrent);
    const row = ui.sentences.querySelector(`.te-study-row[data-index="${index}"] .te-study-vi`);
    if (row) {
      row.textContent = canShowTranslation ? (translated || tr("dictationTranslationLoading")) : "";
      row.hidden = !canShowTranslation;
    }
    if (current === index) {
      const showCurrentTranslation = checkedCurrent || translationAlwaysVisible();
      ui.translation.textContent = showCurrentTranslation ? (translated || tr("dictationTranslationLoading")) : "";
      ui.translation.hidden = !showCurrentTranslation;
    }
  }

  async function ensureVietnamese(index) {
    if (translations[String(index)]) {
      updateTranslationViews(index);
      return translations[String(index)];
    }
    const cue = sentenceCues[index];
    if (!cue || typeof A?.translateToVietnamese !== "function") return "";
    const requestSourceId = sourceId;
    const requestKey = `${requestSourceId}:${index}:${cue.en}`;
    if (translating.has(requestKey)) return translating.get(requestKey);
    const request = Promise.resolve(A.translateToVietnamese(cue.en)).then((translated) => {
      if (sourceId !== requestSourceId || sentenceCues[index]?.en !== cue.en) return "";
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
      if (sourceId === requestSourceId && sentenceCues[index]?.en === cue.en && ui && active && current === index) {
        ui.translation.textContent = tr("dictationTranslationFailed");
      }
      return "";
    }).finally(() => translating.delete(requestKey));
    translating.set(requestKey, request);
    return request;
  }

  // So theo vị trí: từng từ gõ so với từ cùng vị trí của câu gốc. Dừng ở lỗi (sai/thiếu) đầu tiên.
  function positionalOps(refText, typedText) {
    return globalThis.LHN_STUDY_SCORE.positionalDiff(refText, typedText);
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
    const progress = globalThis.LHN_STUDY_SCORE.getPrefixProgress(reference, answer);
    const words = progress.expectedUnits.map((unit) => ({
      display: unit.display,
      norm: globalThis.LHN_STUDY_SCORE.tokenize(unit.display).join("") || unit.norm,
    }));
    const enteredCount = progress.matchedUnits;
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
    const operations = globalThis.LHN_STUDY_SCORE.diff(cue?.en || "", answer);
    const missingPatterns = findMissingBeforeCorrect(operations);
    const missingPattern = missingPatterns[0] || null;
    const displayOperations = missingPattern
      ? operations.slice(0, missingPattern.index + missingPattern.missingOperations.length + 1)
      : positionalOps(cue?.en || "", answer);
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
      const expectedStart = (operation) => operation.expectedIndices?.length ? operation.expectedIndices[0]
        : Number.isInteger(operation.expectedIndex) ? operation.expectedIndex : expectedIndex;
      const advanceExpected = (operation) => {
        const indices = operation.expectedIndices || [];
        expectedIndex = indices.length ? Math.max(expectedIndex, ...indices) + 1 : expectedIndex + 1;
      };
      const expectedDisplay = (operation) => {
        const indices = operation.expectedIndices || [];
        if (indices.length > 1) {
          const first = words[indices[0]], last = words[indices[indices.length - 1]];
          if (first && last) return cue.en.slice(first.start, last.end);
        }
        return words[expectedStart(operation)]?.display || operation.expected || "";
      };
      for (const operation of displayOperations) {
        if (operation.type === "ok") {
          const group = document.createElement("span");
          group.className = "te-dict-wg";
          group.appendChild(chip("te-dict-w ok", expectedDisplay(operation) || operation.typed));
          ui.errorWords.appendChild(group);
          advanceExpected(operation);
          continue;
        }
        if (operation.type === "wrong") {
          const group = document.createElement("span");
          group.className = "te-dict-wg";
          group.appendChild(chip("te-dict-w bad", operation.typed));
          if (showHints) group.appendChild(chip("te-dict-w fix", `→ ${expectedDisplay(operation)}`));
          ui.errorWords.appendChild(group);
          if (!showHints) {
            const expected = words[expectedStart(operation)] || { norm: globalThis.LHN_STUDY_SCORE.tokenize(operation.expected)[0] || "" };
            appendMissingMasks([expected]);
          }
          advanceExpected(operation);
          appendMissingMasks(words.slice(expectedIndex));
          break;
        }
        if (operation.type === "missing") {
          if (missingPattern?.missingOperations[0] === operation) {
            for (const expectedIndex of missingPattern.expectedIndices) {
              const expected = words[expectedIndex] || {
                display: "",
                norm: globalThis.LHN_STUDY_SCORE.tokenize(operation.expected)[0] || "",
              };
              if (showHints) {
                const group = document.createElement("span");
                group.className = "te-dict-wg";
                group.appendChild(chip("te-dict-w fix", `→ ${expected.display}`));
                ui.errorWords.appendChild(group);
              } else {
                appendMissingMasks([expected]);
              }
            }
            expectedIndex = Math.max(expectedIndex, ...missingPattern.expectedIndices) + 1;
            const matchedGroup = document.createElement("span");
            matchedGroup.className = "te-dict-wg";
            matchedGroup.appendChild(chip("te-dict-w ok", expectedDisplay(missingPattern.following) || missingPattern.following.typed));
            ui.errorWords.appendChild(matchedGroup);
            advanceExpected(missingPattern.following);
            appendMissingMasks(words.slice(expectedIndex));
            break;
          }
          appendMissingMasks(words.slice(expectedStart(operation)));
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
    renderInputWrongMarks(operations, missingPatterns);
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
        norm: globalThis.LHN_STUDY_SCORE.tokenize(match[0])[0] || "",
        display: `${before}${match[0]}${after}`,
        start: match.index,
        end,
      };
    }).filter((word) => word.norm);
  }

  function canonicalizeCorrectWords(reference, answer) {
    const expectedWords = getTranscriptWordTokens(reference);
    const typedWords = getTranscriptWordTokens(answer);
    const operations = globalThis.LHN_STUDY_SCORE.diff(reference, answer);
    const replacements = [];
    for (const operation of operations) {
      const expectedIndices = operation.expectedIndices || [];
      const typedIndices = operation.typedIndices || [];
      if (operation.type !== "ok" || expectedIndices.length !== 1 || typedIndices.length !== 1) continue;
      const expected = expectedWords[expectedIndices[0]];
      const typed = typedWords[typedIndices[0]];
      if (expected && typed && expected.raw !== typed.raw) replacements.push({ start: typed.start, end: typed.end, text: expected.raw });
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
    const operations = globalThis.LHN_STUDY_SCORE.diff(reference, answer);
    const expectedToTyped = new Array(expectedWords.length).fill(-1);
    const expectedStatus = new Array(expectedWords.length).fill("missing");
    for (const operation of operations) {
      if (operation.type === "missing" || operation.type === "extra") continue;
      const expectedIndices = operation.expectedIndices || [];
      const typedIndices = operation.typedIndices || [];
      // A contraction may align one target phrase to a different number of typed tokens.
      // In that case keep the learner's text unchanged rather than misplacing punctuation.
      if (expectedIndices.length !== typedIndices.length) return answer;
      for (let index = 0; index < expectedIndices.length; index++) {
        expectedToTyped[expectedIndices[index]] = typedIndices[index];
        expectedStatus[expectedIndices[index]] = operation.type;
      }
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
    const wasSuccessVisible = !ui.success.hidden;
    const result = globalThis.LHN_STUDY_SCORE.score(cue.en, ui.input.value);
    const isSpeaking = studyMode === "speaking";
    const tier = isSpeaking ? shadowingActivity.getSpeechScoreTier(result.percent) : null;
    const passed = isSpeaking ? tier === "pass" : result.perfect;
    const modeStats = isSpeaking ? speakingWrongWordStats : wrongWordStats;
    const statsUpdated = recordWrongWordSubmission(modeStats, current, result, cue.en);
    if (statsUpdated) renderWrongWordStats();
    if (isSpeaking) {
      shadowingActivity.setSpeechTargetState(tier === "pass" ? "correct" : tier === "warn" ? "warn" : "wrong");
      shadowingActivity.renderSpeechResult(ui.input.value);
      shadowingActivity.setSpeechStatus(tier === "pass" ? "" : "dictationSpeakRetry");
    }
    const successMessage = isSpeaking
      ? (result.perfect ? "dictationSpeakSuccess" : "dictationSpeakPassed")
      : "dictationSuccess";
    if (ui.successMessage) {
      ui.successMessage.dataset.studyLabel = successMessage;
      ui.successMessage.textContent = tr(successMessage);
    }
    setScore(result.percent);
    updateCheckButtonStyle(passed);
    if (isSpeaking) shadowingActivity.setSpeechFeedback(tier, result.percent, cue.en, result.perfect);
    if (passed) {
      if (result.perfect) {
        const punctuatedAnswer = addMissingPunctuation(cue.en, ui.input.value);
        if (punctuatedAnswer !== ui.input.value) ui.input.value = punctuatedAnswer;
      }
      if (isSpeaking && result.perfect) shadowingActivity.renderSpeechResult(ui.input.value);
      clearInputWrongMarks();
      ui.work?.classList.remove("te-dict-has-error");
      checkedCurrent = true;
      updateAnswerStackOffset();
      solved.add(current);
      ui.input.classList.add("correct");
      setErrorPanelSuccess(true);
      renderCorrectWords();
      ui.error.hidden = false;
      ui.success.hidden = false;
      if (ui.properNounHint) ui.properNounHint.hidden = true;
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
    updateAnswerStackOffset();
    ui.input.classList.remove("correct");
    ui.success.hidden = !isSpeaking;
    if (wasSuccessVisible) renderProperNounHint(cue.en);
    syncCurrentTranslationDisplay();
    updateRows(false);
    renderError();
    if (statsUpdated) void saveRecord();
    playErrorSound();
    setNotesLocked(!solved.has(current));
    if (isSpeaking && shadowingActivity.speechAutoRecordEnabled) playSentence(current, { count: 1 });
  }

  // Phát đúng một câu rồi dừng: rAF canh điểm kết thúc (timeupdate chỉ ~4 lần/giây nên dễ trôi sang câu sau).
  function stopWatch() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
  }

  function restoreRate() {
    if (savedRate !== null && attachedMedia) {
      try { attachedMedia.playbackRate = savedRate; } catch {}
    }
    savedRate = null;
  }

  function endPlayback() {
    stopWatch();
    stopAt = -1;
    repeatLeft = 0;
    restoreRate();
    shadowingActivity.updateSpeechCheckDisabled();
  }

  function finishCue() {
    const media = attachedMedia;
    const cue = sentenceCues[current];
    if (repeatLeft > 0 && media && cue) {
      repeatLeft--;
      try { media.currentTime = Math.max(0, Number(cue.start) || 0); } catch {}
      watchPlayback();
      return;
    }
    media?.pause();
    endPlayback();
    shadowingActivity.speechCueAutoStartPending = active && studyMode === "speaking" && !shadowingActivity.speechAnswerRevealed;
    shadowingActivity.scheduleSpeechAutoRecord();
  }

  function watchPlayback() {
    stopWatch();
    const step = () => {
      rafId = 0;
      const media = attachedMedia;
      if (!active || stopAt < 0 || !media) return;
      if (media.paused) return; // tiếp tục khi sự kiện "play" kích hoạt lại
      if (media.currentTime >= stopAt - 0.03 || media.ended) { finishCue(); return; }
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
  }

  function prepareCue() {
    const media = A?.state?.activeMedia;
    const cue = sentenceCues[current];
    endPlayback();
    if (!media || !cue) return;
    media.pause();
    try { media.currentTime = Math.max(0, Number(cue.start) || 0); } catch {}
  }

  function playSentence(index, options = {}) {
    shadowingActivity.speechCueAutoStartPending = false;
    shadowingActivity.clearSpeechAutoStartTimer();
    const cue = sentenceCues[index];
    const media = A?.state?.activeMedia;
    if (!cue || !media || !active) return;
    if (index !== current) {
      flushNotes();
      current = index;
      renderCurrent();
      void saveRecord();
    }
    const count = options.count ?? (getRepeatCount() + 1);
    if (count < 1) return;
    endPlayback();
    if (options.rate) {
      savedRate = media.playbackRate;
      try { media.playbackRate = options.rate; } catch {}
    }
    repeatLeft = count - 1;
    stopAt = Number(cue.end) || -1;
    shadowingActivity.updateSpeechCheckDisabled();
    try { media.currentTime = Math.max(0, Number(cue.start) || 0); } catch {}
    watchPlayback();
    const playing = media.play();
    if (playing?.catch) playing.catch(() => {});
  }

  // Mọi lần phát (bấm media, Space, nút play) đều bị giới hạn trong câu hiện tại.
  function onMediaPlay() {
    if (active && studyMode === "speaking") {
      shadowingActivity.speechCueAutoStartPending = false;
      shadowingActivity.clearSpeechAutoStartTimer();
    }
    updateCompactAudioPlaybackState();
    if (active && studyMode === "speaking" && (shadowingActivity.speechStartPending || shadowingActivity.speechRecognition || shadowingActivity.speechStopRequested || shadowingActivity.speechPlaybackAudio)) {
      endPlayback();
      attachedMedia?.pause();
      updateCompactAudioPlaybackState();
      return;
    }
    if (!active || !attachedMedia) return;
    const cue = sentenceCues[current];
    if (!cue) return;
    if (stopAt >= 0) { if (!rafId) watchPlayback(); shadowingActivity.updateSpeechCheckDisabled(); return; }
    const time = attachedMedia.currentTime;
    if (time < cue.start - 0.05 || time >= cue.end - 0.03) {
      try { attachedMedia.currentTime = Math.max(0, Number(cue.start) || 0); } catch {}
    }
    stopAt = Number(cue.end) || -1;
    repeatLeft = 0;
    watchPlayback();
    shadowingActivity.updateSpeechCheckDisabled();
  }

  function onMediaPause() {
    updateCompactAudioPlaybackState();
    shadowingActivity.updateSpeechCheckDisabled();
  }

  function onMediaTimeUpdate() {
    if (!active || stopAt < 0 || !attachedMedia || attachedMedia.paused) return;
    if (attachedMedia.currentTime >= stopAt - 0.03) finishCue();
  }

  function toggleMediaPlayback() {
    const media = A?.state?.activeMedia;
    if (!media) return;
    if (media.paused) {
      const playing = media.play();
      if (playing?.catch) playing.catch(() => {});
    } else media.pause();
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
      toggleMediaPlayback();
    }
  }

  function stopFieldKeyEvent(event) {
    if (event.key !== "Escape") event.stopPropagation();
  }

  function isCorrectIncompletePrefix(reference, answer) {
    return globalThis.LHN_STUDY_SCORE.isCorrectIncompletePrefix(reference, answer);
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

  function removeMissingInputUnderline(event) {
    const input = ui?.input;
    if (!input || !activeMissingInputSlots.length || (event.key !== "Backspace" && event.key !== "Delete")) return false;
    const selectionStart = input.selectionStart;
    const selectionEnd = input.selectionEnd;
    const selected = selectionStart !== selectionEnd;
    const slot = activeMissingInputSlots.find(({ start, end }) => selected
      ? selectionStart <= end && selectionEnd > start
      : (selectionStart >= start && selectionStart <= end)
        || (event.key === "Backspace" && selectionStart === end + 1));
    if (!slot) return false;
    event.preventDefault();
    event.stopPropagation();
    const removeStart = selected ? Math.min(selectionStart, slot.start) : slot.start;
    const removeEnd = selected ? Math.max(selectionEnd, slot.end) : slot.end;
    input.value = `${input.value.slice(0, removeStart)}${input.value.slice(removeEnd)}`;
    input.setSelectionRange(removeStart, removeStart);
    onAnswerInput();
    return true;
  }

  function onAnswerKeyDown(event) {
    if ((event.key === "Backspace" || event.key === "Delete") && removeMissingInputUnderline(event)) return;
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
      const isPerfect = !!cue && globalThis.LHN_STUDY_SCORE.score(cue.en, ui.input.value).perfect;
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

  function translationAlwaysVisible() {
    return translationVisibilityEnabled;
  }

  function setTranslationToggleState(enabled) {
    if (!ui?.translationToggle) return;
    const label = tr(enabled ? "dictationHideTranslation" : "dictationShowTranslation");
    ui.translationToggle.setAttribute("aria-pressed", String(enabled));
    ui.translationToggle.setAttribute("aria-label", label);
    ui.translationToggle.title = label;
    ui.translationToggle.classList.toggle("active", enabled);
  }

  function onTranslationToggle(event) {
    event.preventDefault();
    event.stopPropagation();
    if (!ui) return;
    const enabled = !translationAlwaysVisible();
    translationVisibilityEnabled = enabled;
    setTranslationToggleState(enabled);
    void persistTranslationVisibilityPreference();
    if (enabled) ui.translation.textContent = translations[String(current)] || "";
    syncCurrentTranslationDisplay(enabled);
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
    const wasSuccessVisible = !ui.success.hidden;
    const keepSpeechToast = shadowingActivity.shouldKeepVietnameseSpeechToast();
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
    ui.success.hidden = !keepSpeechToast;
    if (wasSuccessVisible) renderProperNounHint(sentenceCues[current]?.en || "");
    syncCurrentTranslationDisplay();
    updateRows(false);
    setScore(solved.has(current) ? 100 : null);
    focusInputIfTyping();
  }

  function onGlobalKeyDown(event) {
    if (!active) return;
    const path = event.composedPath?.() || [];
    const real = path[0] || event.target;
    const panelEditable = path.includes(ui?.input) || path.includes(ui?.note);
    const editableTarget = real?.closest?.("input, textarea, select, [contenteditable='true']") || real?.isContentEditable;
    const noteFocused = path.includes(ui?.note) || (!panelEditable && editableTarget);
    if (studyMode === "typing" && path.includes(ui?.input) && checkedCurrent && solved.has(current)) {
      // After a perfect check, preserve the four Dictation shortcuts; ordinary typing unlocks editing.
      if (event.key === "Enter" && !event.shiftKey && !event.isComposing && event.keyCode !== 229) return;
      const isBacktickShortcut = (event.key === "`" || (event.code === "Backquote" && !event.shiftKey))
        && !event.ctrlKey && !event.altKey && !event.metaKey;
      const isPreservedShortcut = event.key === "Escape" || isBacktickShortcut || event.key === "Control";
      if (!isPreservedShortcut) {
        onAnswerInput();
        ctrlAlone = false;
        if (event.key === "Enter" || event.key === "Escape" || event.key === "`" || event.code === "Backquote") event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
    }
    if (event.key === "Enter" && !event.repeat && !event.shiftKey && !event.ctrlKey && !event.altKey
      && !event.metaKey && !event.isComposing && event.keyCode !== 229 && shadowingActivity.shouldKeepVietnameseSpeechToast()) {
      dismissVietnameseSpeechToast();
    }
    if (studyMode === "speaking" && event.key === "Enter" && !event.shiftKey
      && !event.ctrlKey && !event.altKey && !event.metaKey && !event.isComposing && event.keyCode !== 229 && !noteFocused) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (event.repeat || shadowingActivity.speechStopRequested || shadowingActivity.speechPlaybackAudio) return;
      if (shadowingActivity.speechStartPending) {
        void shadowingActivity.toggleSpeechRecognition();
        return;
      }
      if (checkedCurrent && solved.has(current)) {
        if (ui?.btnNext && !ui.btnNext.disabled) ui.btnNext.click();
        return;
      }
      if (shadowingActivity.speechAnswerRevealed) {
        submit();
        return;
      }
      void shadowingActivity.toggleSpeechRecognition();
      return;
    }
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
      if (studyMode === "speaking" && !noteFocused) {
        event.preventDefault();
        event.stopImmediatePropagation();
        shadowingActivity.handleSpeakingEscape();
        return;
      }
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
      if (!event.repeat) toggleMediaPlayback();
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

  function attachMediaEvents() {
    attachedMedia = A?.state?.activeMedia || null;
    attachedMedia?.addEventListener("timeupdate", onMediaTimeUpdate);
    attachedMedia?.addEventListener("play", onMediaPlay);
    attachedMedia?.addEventListener("pause", onMediaPause);
    updateCompactAudioPlaybackState();
  }

  function detachMediaEvents() {
    endPlayback();
    attachedMedia?.removeEventListener("timeupdate", onMediaTimeUpdate);
    attachedMedia?.removeEventListener("play", onMediaPlay);
    attachedMedia?.removeEventListener("pause", onMediaPause);
    attachedMedia = null;
  }

  async function openPanel({ waitForCaptions = false, mode = "typing", fromEntry = false } = {}) {
    if (active || openingPanel) {
      setStudyMode(mode);
      return;
    }
    if (!isStudySourceReady() && !waitForCaptions) { showToastBeforeOpen(); return; }
    openingPanel = true;
    const requestGeneration = ++openingGeneration;
    if (A?.state?.sourceType === 'web' && A.state.webSourceLanguageReady) {
      try { await A.state.webSourceLanguageReady; } catch {}
      if (requestGeneration !== openingGeneration) { openingPanel = false; return; }
    }
    build();
    if (!ui) { openingPanel = false; A?.revealLearningEntry?.(); return; }
    setStudyMode(mode);
    // Vào từ phím tắt (Alt+F) khi overlay đang đóng: không chuyển qua chế độ xem video trước
    if (!fromEntry) A?.setReadingMode?.(false);
    const layoutPrefsPromise = loadStudyLayoutPrefs();
    if (waitForCaptions) {
      void layoutPrefsPromise.then(() => { if (active && ui) applyStudyViewSizeColumnPreset(); });
    } else {
      await layoutPrefsPromise;
    }
    if (requestGeneration !== openingGeneration) return;
    await loadProgressSyncPreference();
    await loadTranslationVisibilityPreference();
    if (requestGeneration !== openingGeneration) return;
    if (!ui || (!isStudySourceReady() && !waitForCaptions)) { openingPanel = false; return; }
    sourceId = currentSourceId();
    if (!sourceId) { openingPanel = false; A?.revealLearningEntry?.(); showToastBeforeOpen(); return; }
    sentenceCues = getCues();
    if (!sentenceCues.length && !waitForCaptions) { openingPanel = false; showToastBeforeOpen(); return; }
    active = true;
    syncStudyModeButtons();
    progressReady = false;
    updateProgressSyncControl();
    pendingCaptionStart = waitForCaptions && !sentenceCues.length;
    pendingResumeIndex = 0;
    observeSourceTitle();
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
    wrongWordStats = { version: 3, words: {} };
    speakingWrongWordStats = { version: 3, words: {} };
    ui.root.classList.add("te-study-active");
    globalThis.LHN_OVERLAY_SET_STUDY_ACTIVITY?.(studyMode === "speaking" ? "shadowing" : "dictation");
    A?.syncViewSize?.();
    A?.revealLearningEntry?.();
    applyStudyViewSizeColumnPreset();
    if (typeof ResizeObserver === "function") {
      ui.columnLayoutResizeObserver = new ResizeObserver(applyStudyColumnLayout);
      ui.columnLayoutResizeObserver.observe(ui.root);
    }
    ui.root.insertBefore(ui.bar, ui.center);
    ui.sentences.setAttribute("aria-label", tr("dictationSentences"));
    document.addEventListener("keydown", onGlobalKeyDown, true);
    document.addEventListener("keyup", onGlobalKeyUp, true);
    savedLoop = typeof A?.state?.loop === "boolean" ? A.state.loop : null;
    if (savedLoop !== null) A.state.loop = false; // vòng lặp câu của Dual Sub sẽ làm video chạy lệch câu
    attachMediaEvents();
    renderInitialRows();
    setNotesLocked(true);
    setCaptionStatusForKey(sentenceCues.length ? "" : "dictationWaitingForCaptions");
    setScore(null);
    const record = await loadProgress(sourceId, generation);
    if (!active || panelGeneration !== generation || currentSourceId() !== sourceId || !record) return;
    progressReady = true;
    updateProgressSyncControl();
    renderWrongWordStats();
    if (!sentenceCues.length) {
      pendingResumeIndex = Math.max(0, Number(current) || 0);
      current = 0;
      listStart = 0;
      listEnd = 0;
      renderInitialRows();
      renderCurrent();
      const captionsStillLoading = A?.state?.loadingFor === sourceId;
      const unavailableKey = A?.state?.sourceType === 'web' ? "dictationWebTextUnavailable" : "dictationEnglishOnly";
      setCaptionStatusForKey(captionsStillLoading ? "dictationWaitingForCaptions" : unavailableKey, true);
      return;
    }
    pendingCaptionStart = false;
    const savedCurrent = Number(current);
    if (Number.isInteger(savedCurrent) && savedCurrent >= 0 && savedCurrent < sentenceCues.length) {
      current = savedCurrent;
    } else if (solved.size) {
      let nextUnsolved = 0;
      while (nextUnsolved < sentenceCues.length && solved.has(nextUnsolved)) nextUnsolved++;
      current = Math.min(nextUnsolved, sentenceCues.length - 1);
    } else {
      current = 0;
    }
    listStart = 0;
    listEnd = 0;
    renderInitialRows();
    renderCurrent();
    setCaptionStatus("");
    playSentence(current, { count: getRepeatCount() + 1 });
    void saveRecord();
    focusInputIfTyping();
  }

  function setDictationButtonActive(enabled) {
    if (enabled) syncStudyModeButtons();
    else {
      const typingButton = A?.ctrl?.("Chép chính tả") || A?.overlayEl?.()?.querySelector?.("#te-dictation-mode-btn");
      const speakingButton = A?.overlayEl?.()?.querySelector?.("#te-shadowing-mode-btn");
      for (const button of [typingButton, speakingButton]) {
        button?.classList.remove("te-active");
        button?.setAttribute("aria-pressed", "false");
      }
    }
  }

  function close({ restoreView = true } = {}) {
    if (openingPanel) {
      openingPanel = false;
      openingGeneration++;
    }
    shadowingActivity.stopSpeechRecognition(true);
    if (!active || !ui) {
      setDictationButtonActive(false);
      ui?.root.classList.remove("te-shadowing-active");
      if (ui?.speechPractice) ui.speechPractice.hidden = true;
      studyMode = "typing";
      globalThis.LHN_OVERLAY_SET_STUDY_ACTIVITY?.(null);
      if (restoreView) A?.restorePreferredReadingMode?.();
      return;
    }
    restoreYouTubeScrollbar();
    flushNotes();
    active = false;
    setDictationButtonActive(false);
    studyMode = "typing";
    progressReady = false;
    pendingCaptionStart = false;
    pendingResumeIndex = 0;
    stopObservingSourceTitle();
    hintResult = null;
    panelGeneration++;
    document.removeEventListener("keydown", onGlobalKeyDown, true);
    document.removeEventListener("keyup", onGlobalKeyUp, true);
    detachMediaEvents();
    if (savedLoop !== null && A?.state) A.state.loop = savedLoop;
    savedLoop = null;
    void audioCtx?.close?.();
    audioCtx = null;
    ui.bar.removeEventListener("click", onControlClick, true);
    ui.playerTransitionToken++;
    ui.playerResizeObserver?.disconnect();
    ui.playerSlot.removeEventListener("transitionend", onPlayerSlotTransitionEnd);
    ui.columnLayoutResizeObserver?.disconnect();
    persistStudyLayoutPrefs();
    const originalPlayerHeight = ui.originalPlayerSlotHeight;
    if (originalPlayerHeight.value) ui.playerSlot.style.setProperty("height", originalPlayerHeight.value, originalPlayerHeight.priority);
    else ui.playerSlot.style.removeProperty("height");
    ui.compactAudio.remove();
    for (const [button, original] of ui.originalButtonState) {
      button.disabled = original.disabled;
      if (original.aria === null) button.removeAttribute("aria-disabled");
      else button.setAttribute("aria-disabled", original.aria);
    }
    ui.root.classList.remove("te-study-active", "te-shadowing-active", "te-study-media-compact", "te-study-column-left-hidden", "te-study-column-right-hidden");
    globalThis.LHN_OVERLAY_SET_STUDY_ACTIVITY?.(null);
    A?.syncViewSize?.();
    for (const property of ["--te-study-left-track", "--te-study-right-track", "--te-study-left-splitter", "--te-study-right-splitter", "--te-study-center-min"]) {
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
    ui.playerMask.remove();
    ui.tools.remove();
    ui.primaryGroup.classList.remove("te-study-primary-group");
    ui = null;
    ctrlAlone = false;
    if (restoreView) A?.restorePreferredReadingMode?.();
  }

  function toggle() { (active || openingPanel) ? close() : void openPanel(); }

  function onCaptionsUpdated() {
    if (!active) return;
    if (currentSourceId() !== sourceId) { close(); return; }
    const updated = getCues();
    if ((A?.state?.sourceType !== 'web' && A?.state?.sourceLanguage !== "en") || !updated.length) {
      if (A?.state?.loadingFor === A?.state?.sourceId) {
        if (pendingCaptionStart) setCaptionStatusForKey("dictationWaitingForCaptions", true);
        return;
      }
      if (pendingCaptionStart) {
        setCaptionStatusForKey(A?.state?.sourceType === 'web' ? "dictationWebTextUnavailable" : "dictationEnglishOnly", true);
        return;
      }
      close();
      showToast(tr(A?.state?.sourceType === 'web' ? "dictationWebTextUnavailable" : "dictationEnglishOnly"));
      return;
    }
    const unchanged = updated.length === sentenceCues.length && updated.every((cue, index) =>
      cue.en === sentenceCues[index]?.en && cue.start === sentenceCues[index]?.start && cue.end === sentenceCues[index]?.end
    );
    if (unchanged) return;
    flushNotes();
    const oldStart = sentenceCues[current]?.start;
    sentenceCues = updated;
    if (!progressReady) {
      current = 0;
      listStart = 0;
      listEnd = 0;
      renderInitialRows();
      renderCurrent();
      setCaptionStatusForKey("dictationWaitingForCaptions", true);
      return;
    }
    if (pendingCaptionStart) {
      current = Math.min(pendingResumeIndex, sentenceCues.length - 1);
      pendingCaptionStart = false;
      listStart = 0;
      listEnd = 0;
      renderInitialRows();
      renderCurrent();
      setCaptionStatus("");
      playSentence(current, { count:getRepeatCount() + 1 });
      void saveRecord();
      focusInputIfTyping();
      return;
    }
    const matchingIndex = sentenceCues.findIndex(cue => Math.abs(cue.start - oldStart) < 0.5);
    current = matchingIndex >= 0 ? matchingIndex : 0;
    listStart = 0;
    listEnd = 0;
    renderInitialRows();
    renderCurrent();
    setCaptionStatus("");
    void saveRecord();
  }

  function onToggleClick(event) {
    event.preventDefault();
    event.stopPropagation();
    document.dispatchEvent(new CustomEvent("lhn-youtube-dictation-toggle", { detail: { source: "typing-control" } }));
  }

  function attachControls() {
    const dictationButton = A?.overlayEl?.()?.querySelector?.("#te-dictation-mode-btn") || A?.ctrl?.("Chép chính tả");
    if (dictationButton && dictationButton !== attachControls.dictationButton) {
      if (attachControls.dictationButton) attachControls.dictationButton.removeEventListener("click", onToggleClick);
      dictationButton.addEventListener("click", onToggleClick);
      attachControls.dictationButton = dictationButton;
    }
  }

  document.addEventListener("lhn-overlay-ready", (event) => {
    A = event.detail || globalThis.LHN_OVERLAY_API;
    if (!A) return;
    attachControls();
  });
  document.addEventListener("lhn-dual-captions-updated", onCaptionsUpdated);
  const studyApi = Object.freeze({
    toggle, open: openPanel, close, refreshLanguage: refreshLanguageLabels,
    syncStudyViewSizeColumns: applyStudyViewSizeColumnPreset,
    syncVideoViewSizeColumns: applyStudyViewSizeColumnPreset, // Compatibility alias for the former Dictation API.
    isOpen: () => active || openingPanel,
    getMode: () => (active || openingPanel) ? studyMode : null,
    getActivity: () => active ? (studyMode === "speaking" ? "shadowing" : "dictation") : null,
  });
  globalThis.LHN_STUDY = studyApi;
  globalThis.LHN_DICTATION = studyApi; // Compatibility alias for the existing Dictation shortcut integration.
})();
