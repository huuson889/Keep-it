// Dictation v1 uses the live YouTube video and Dual Sub's English caption track.
// It transforms the existing overlay in place; it does not create a second overlay.
(() => {
  const ext = globalThis.browser || globalThis.chrome;
  let A = null;
  let ui = null;
  let active = false;
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
  let stopAt = -1;
  let attachedVideo = null;
  let ctrlAlone = false;
  let panelGeneration = 0;
  let saveTimer = 0;
  let toastTimer = 0;
  let rafId = 0;
  let repeatLeft = 0;
  let repeatCount = 3;
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

    const sentenceArea = document.createElement("section");
    sentenceArea.id = "te-dict-sentence-area";
    sentenceArea.setAttribute("aria-label", tr("dictationSentences"));
    sentenceArea.innerHTML = `
      <div id="te-dict-sentence-head">
        <h2 class="te-dict-heading" data-dict-label="dictationSentences"></h2>
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
          <label class="te-dict-auto"><input type="checkbox" id="te-dict-auto" checked><span data-dict-label="dictationAutoPlay"></span></label>
        </div>
        <div class="te-dict-work">
          <div class="te-dict-success" id="te-dict-success" role="status" hidden>${makeSvg('<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>')}<span data-dict-label="dictationSuccess"></span></div>
          <div class="te-dict-answer-stack">
            <textarea class="te-dict-input" id="te-dict-input" rows="3" autocomplete="off" autocapitalize="off" spellcheck="false"></textarea>
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
          <button class="te-dict-save" id="te-dict-save" type="button"></button>
          <button class="yt-dual-close-btn te-dict-close" id="te-dict-close" type="button"><span aria-hidden="true">×</span></button>
        </div>
      </div>
      <div class="te-dict-note-body">
        <div>
          <label class="te-dict-note-label" for="te-dict-vocab" data-dict-label="dictationVocabulary"></label>
          <input class="te-dict-note-input" id="te-dict-vocab" type="text" autocomplete="off">
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

    root.append(center, notesPanel);

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
      root, left, bar, barParent: bar.parentNode, barNextSibling: bar.nextSibling,
      primaryGroup, tools, sentenceArea, center, notesPanel,
      sentences: sentenceArea.querySelector("#te-dict-sentences"),
      counter: sentenceArea.querySelector("#te-dict-counter"),
      input: center.querySelector("#te-dict-input"),
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
      auto: center.querySelector("#te-dict-auto"),
      repeatBtns: [...center.querySelectorAll(".te-dict-repeat-btn")],
      btnPrev: center.querySelector("#te-dict-btn-prev"),
      btnReplay: center.querySelector("#te-dict-btn-replay"),
      btnSlow: center.querySelector("#te-dict-btn-slow"),
      btnNext: center.querySelector("#te-dict-btn-next"),
      typeControl: tools.querySelector("#te-dict-type-control"),
      toolbarScore: tools.querySelector("#te-dict-toolbar-score"),
      ring: tools.querySelector("#te-dict-ring-fg"),
      close: notesPanel.querySelector("#te-dict-close"),
      vocab: notesPanel.querySelector("#te-dict-vocab"),
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
    ui.vocab.placeholder = tr("dictationVocabularyPlaceholder");
    ui.note.placeholder = tr("dictationNotesPlaceholder");
    ui.save.textContent = tr("dictationSaveNote");
    const hintTexts = [tr("dictationEnterHint"), ...tr("dictationShortcutHint").split(/\s*·\s*/)].slice(0, 3);
    ui.hint.replaceChildren(...hintTexts.map((text) => {
      const item = document.createElement("span");
      item.textContent = text;
      return item;
    }));
    ui.labels = [...root.querySelectorAll("[data-dict-label]")];
    ui.labels.forEach((node) => { node.textContent = tr(node.dataset.dictLabel); });

    ui.close.addEventListener("click", close);
    ui.check.addEventListener("click", () => { submit(); refocus(); });
    ui.btnPrev.addEventListener("click", () => { if (current > 0) selectSentence(current - 1); });
    ui.btnNext.addEventListener("click", () => { if (solved.has(current) && current < sentenceCues.length - 1) selectSentence(current + 1); });
    ui.btnReplay.addEventListener("click", () => { playSentence(current); refocus(); });
    ui.audioBtn.addEventListener("click", () => { playSentence(current); refocus(); });
    ui.btnSlow.addEventListener("click", () => { playSentence(current, { rate: 0.6 }); refocus(); });
    ui.repeatBtns.forEach((button) => button.addEventListener("click", () => { setRepeat(Number(button.dataset.count)); refocus(); }));
    ui.typeControl.addEventListener("click", () => ui?.input.focus());
    ui.save.addEventListener("click", () => saveNotesNow(true));
    ui.input.addEventListener("keydown", onAnswerKeyDown);
    ui.input.addEventListener("input", onAnswerInput);
    ui.input.addEventListener("keyup", stopFieldKeyEvent);
    ui.input.addEventListener("keypress", stopFieldKeyEvent);
    ui.vocab.addEventListener("input", scheduleSaveNotes);
    ui.note.addEventListener("input", scheduleSaveNotes);
    for (const field of [ui.vocab, ui.note]) {
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
    return record;
  }

  function saveRecord() {
    if (!videoId || !ext?.storage?.local) return Promise.resolve();
    return ext.storage.local.set({
      [storageKey()]: { version: 1, current, solved: [...solved], notes, translations },
    }).catch(() => {});
  }

  function scheduleSaveNotes() {
    if (!active || !solved.has(current)) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => saveNotesNow(false), 250);
  }

  function saveNotesNow(showSaved) {
    clearTimeout(saveTimer);
    if (!active || !solved.has(current) || !ui) return;
    notes[String(current)] = { vocab: ui.vocab.value, note: ui.note.value };
    void saveRecord().then(() => {
      if (showSaved && ui?.saved) {
        ui.saved.textContent = tr("dictationSaved");
        setTimeout(() => { if (ui?.saved) ui.saved.textContent = ""; }, 1600);
      }
    });
  }

  function flushNotes() {
    if (!active || !ui || !solved.has(current)) return;
    clearTimeout(saveTimer);
    notes[String(current)] = { vocab: ui.vocab.value, note: ui.note.value };
    void saveRecord();
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

  function onAnswerInput() {
    if (!ui) return;
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
    ui.vocab.disabled = locked;
    ui.note.disabled = locked;
    ui.save.disabled = locked;
  }

  function renderCurrent() {
    if (!ui || !active) return;
    checkedCurrent = false;
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
    ui.vocab.value = typeof saved.vocab === "string" ? saved.vocab : "";
    ui.note.value = typeof saved.note === "string" ? saved.note : "";
    ui.saved.textContent = "";
    ui.input.value = "";
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

  function renderError() {
    setErrorPanelSuccess(false);
    const cue = sentenceCues[current];
    ui.errorWords.replaceChildren();
    const chip = (className, text) => {
      const node = document.createElement("span");
      node.className = className;
      node.textContent = text;
      return node;
    };
    if (!ui.input.value.trim()) {
      ui.errorWords.appendChild(chip("te-dict-empty", tr("dictationEmptyAnswer")));
    } else {
      for (const op of positionalOps(cue?.en, ui.input.value)) {
        const group = document.createElement("span");
        group.className = "te-dict-wg";
        if (op.type === "ok") group.appendChild(chip("te-dict-w ok", op.typed));
        else if (op.type === "wrong") {
          group.appendChild(chip("te-dict-w bad", op.typed));
          group.appendChild(chip("te-dict-w fix", `→ ${op.expected}`));
        } else if (op.type === "missing") {
          group.appendChild(chip("te-dict-w fix", op.expected));
        } else if (op.type === "extra") {
          group.appendChild(chip("te-dict-w bad", op.typed));
          group.appendChild(chip("te-dict-w fix", `→ ${tr("dictationExtra")}`));
        }
        ui.errorWords.appendChild(group);
      }
    }
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

  function submit() {
    const cue = sentenceCues[current];
    if (!cue || !ui) return;
    const result = globalThis.LHN_DICTATION_SCORE.score(cue.en, ui.input.value);
    setScore(result.percent);
    updateCheckButtonStyle(result.perfect);
    if (result.perfect) {
      const punctuatedAnswer = addMissingPunctuation(cue.en, ui.input.value);
      if (punctuatedAnswer !== ui.input.value) ui.input.value = punctuatedAnswer;
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

  function onVideoTimeUpdate() {
    if (!active || stopAt < 0 || !attachedVideo || attachedVideo.paused) return;
    if (attachedVideo.currentTime >= stopAt - 0.03) finishCue();
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
      const video = A?.state?.videoEl;
      if (!video) return;
      if (video.paused) {
        const playing = video.play();
        if (playing?.catch) playing.catch(() => {});
      } else video.pause();
    }
  }

  function stopFieldKeyEvent(event) {
    if (event.key !== "Escape") event.stopPropagation();
  }

  function onAnswerKeyDown(event) {
    if (event.key === "Escape") return; // Let the existing overlay Esc handler close the whole overlay.
    if (ui?.error) ui.error.hidden = true;
    if (event.key === "ArrowUp" || event.key === "ArrowDown") return;
    event.stopPropagation();
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      const cue = sentenceCues[current];
      const isPerfect = !!cue && globalThis.LHN_DICTATION_SCORE.score(cue.en, ui.input.value).perfect;
      if (isPerfect && solved.has(current) && checkedCurrent) { ui?.btnNext?.click(); return; }
      ui.check.click();
    }
  }

  function onNoteKeyDown(event) {
    if (event.key === "Escape") return;
    event.stopPropagation();
    if (event.currentTarget === ui?.vocab && event.key === "Enter") {
      event.preventDefault();
      saveNotesNow(true);
    }
  }

  function resetAnswer() {
    if (!ui) return;
    checkedCurrent = false;
    ui.input.value = "";
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
      const editable = path.includes(ui?.input) || path.includes(ui?.vocab) || path.includes(ui?.note)
        || real?.closest?.("input, textarea, select, [contenteditable='true']") || real?.isContentEditable;
      if (!editable) { event.preventDefault(); event.stopImmediatePropagation(); }
      return;
    }
    if (event.key === "Escape") { ctrlAlone = false; return; }
    if (event.altKey && event.key.toLowerCase() === "x") {
      event.preventDefault();
      event.stopImmediatePropagation();
      resetAnswer();
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
  }

  function detachVideoEvents() {
    endPlayback();
    attachedVideo?.removeEventListener("timeupdate", onVideoTimeUpdate);
    attachedVideo?.removeEventListener("play", onVideoPlay);
    attachedVideo = null;
  }

  async function openPanel() {
    if (active) return;
    if (!isEnglishReady()) { showToastBeforeOpen(); return; }
    build();
    if (!ui) return;
    videoId = currentVideoId();
    sentenceCues = getCues();
    if (!sentenceCues.length) { showToastBeforeOpen(); return; }
    active = true;
    checkedCurrent = false;
    hideYouTubeScrollbar();
    const generation = ++panelGeneration;
    current = 0;
    listStart = 0;
    listEnd = 0;
    solved = new Set();
    notes = {};
    translations = {};
    ui.root.classList.add("te-dictation-active");
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
    panelGeneration++;
    document.removeEventListener("keydown", onGlobalKeyDown, true);
    document.removeEventListener("keyup", onGlobalKeyUp, true);
    detachVideoEvents();
    if (savedLoop !== null && A?.state) A.state.loop = savedLoop;
    savedLoop = null;
    void audioCtx?.close?.();
    audioCtx = null;
    ui.bar.removeEventListener("click", onControlClick, true);
    for (const [button, original] of ui.originalButtonState) {
      button.disabled = original.disabled;
      if (original.aria === null) button.removeAttribute("aria-disabled");
      else button.setAttribute("aria-disabled", original.aria);
    }
    ui.root.classList.remove("te-dictation-active");
    if (ui.barParent?.isConnected) {
      if (ui.barNextSibling?.parentNode === ui.barParent) ui.barParent.insertBefore(ui.bar, ui.barNextSibling);
      else ui.barParent.appendChild(ui.bar);
    }
    ui.sentenceArea.remove();
    ui.center.remove();
    ui.notesPanel.remove();
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
  globalThis.LHN_DICTATION = Object.freeze({ toggle, open: openPanel, close });
})();
