// Dictation v1 uses the live YouTube video and Dual Sub's English caption track.
// It transforms the existing overlay in place; it does not create a second overlay.
(() => {
  const ext = globalThis.browser || globalThis.chrome;
  let A = null;
  let ui = null;
  let active = false;
  let current = 0;
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
        <h2 class="te-dict-heading" data-dict-label="dictationTitle"></h2>
        <span class="te-dict-score" id="te-dict-score">—</span>
      </div>
      <div class="te-dict-center-body">
        <label class="te-dict-heading" for="te-dict-input" data-dict-label="dictationAnswer"></label>
        <textarea class="te-dict-input" id="te-dict-input" rows="3" autocomplete="off" autocapitalize="off" spellcheck="false"></textarea>
        <div class="te-dict-hint" id="te-dict-hint"></div>
        <div class="te-dict-feedback" id="te-dict-feedback" aria-live="polite"></div>
        <div class="te-dict-word-feedback" id="te-dict-word-feedback" aria-label=""></div>
        <button class="te-dict-check" id="te-dict-check" type="button"></button>
        <div class="te-dict-translation" id="te-dict-translation" hidden></div>
      </div>`;

    const notesPanel = document.createElement("section");
    notesPanel.id = "te-dictation-notes";
    notesPanel.innerHTML = `
      <div class="te-dict-panel-head">
        <h2 class="te-dict-heading" data-dict-label="dictationLessonNotes"></h2>
        <button class="yt-dual-close-btn te-dict-close" id="te-dict-close" type="button"><span aria-hidden="true">×</span></button>
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
      <div class="te-dict-panel-head te-dict-note-footer">
        <span class="te-dict-saved" id="te-dict-saved" aria-live="polite"></span>
        <button class="te-dict-save" id="te-dict-save" type="button"></button>
      </div>`;

    root.append(center, notesPanel);

    const tools = document.createElement("div");
    tools.className = "te-dict-toolbar-tools";
    tools.innerHTML = `
      <button class="te-dict-type-control" id="te-dict-type-control" type="button">
        ${makeSvg('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h10M7 12h10M7 16h6"/>')}
        <span data-dict-label="dictationType"></span>
      </button>
      <span class="te-dict-toolbar-accuracy"><span data-dict-label="dictationAccuracy"></span><strong id="te-dict-toolbar-score">—</strong></span>`;
    primaryGroup.prepend(tools);
    primaryGroup.classList.add("te-dict-primary-group");

    ui = {
      root, left, bar, barParent: bar.parentNode, barNextSibling: bar.nextSibling,
      primaryGroup, tools, sentenceArea, center, notesPanel,
      sentences: sentenceArea.querySelector("#te-dict-sentences"),
      counter: sentenceArea.querySelector("#te-dict-counter"),
      input: center.querySelector("#te-dict-input"),
      score: center.querySelector("#te-dict-score"),
      feedback: center.querySelector("#te-dict-feedback"),
      wordFeedback: center.querySelector("#te-dict-word-feedback"),
      translation: center.querySelector("#te-dict-translation"),
      check: center.querySelector("#te-dict-check"),
      typeControl: tools.querySelector("#te-dict-type-control"),
      toolbarScore: tools.querySelector("#te-dict-toolbar-score"),
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
    ui.check.textContent = tr("dictationCheck");
    ui.save.textContent = tr("dictationSaveNote");
    ui.hint = center.querySelector("#te-dict-hint");
    ui.hint.textContent = `${tr("dictationEnterHint")} · ${tr("dictationShortcutHint")}`;
    ui.labels = [...root.querySelectorAll("[data-dict-label]")];
    ui.labels.forEach((node) => { node.textContent = tr(node.dataset.dictLabel); });

    ui.close.addEventListener("click", close);
    ui.check.addEventListener("click", submit);
    ui.typeControl.addEventListener("click", () => ui?.input.focus());
    ui.save.addEventListener("click", () => saveNotesNow(true));
    ui.input.addEventListener("keydown", onAnswerKeyDown);
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

  function showToastBeforeOpen() {
    const currentId = A?.state?.videoId;
    const loading = !!currentId && A?.state?.loadingFor === currentId;
    showToast(tr(loading ? "dictationCaptionsLoading" : "dictationEnglishOnly"));
  }

  function cueAtVideoTime() {
    const time = Number(A?.state?.videoEl?.currentTime) || 0;
    const containing = sentenceCues.findIndex((cue) => time >= cue.start && time < cue.end);
    if (containing >= 0) return containing;
    const next = sentenceCues.findIndex((cue) => cue.start >= time);
    return next >= 0 ? next : Math.max(0, sentenceCues.length - 1);
  }

  async function loadProgress(requestVideoId, generation) {
    const key = `dictation:${requestVideoId}`;
    let record = {};
    try {
      record = (await ext.storage.local.get(key))[key] || {};
    } catch {}
    if (!active || videoId !== requestVideoId || panelGeneration !== generation) return false;
    solved = new Set(Array.isArray(record.solved) ? record.solved.map(Number).filter(Number.isInteger) : []);
    notes = record.notes && typeof record.notes === "object" ? record.notes : {};
    translations = record.translations && typeof record.translations === "object" ? record.translations : {};
    return true;
  }

  function saveRecord() {
    if (!videoId || !ext?.storage?.local) return Promise.resolve();
    return ext.storage.local.set({
      [storageKey()]: { version: 1, solved: [...solved], notes, translations },
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
    if (ui.previous) {
      ui.previous.disabled = current <= 0;
      ui.previous.setAttribute("aria-disabled", String(ui.previous.disabled));
    }
    if (ui.next) {
      ui.next.disabled = current >= sentenceCues.length - 1 || !solved.has(current);
      ui.next.setAttribute("aria-disabled", String(ui.next.disabled));
    }
  }

  function setScore(text) {
    if (!ui) return;
    ui.score.textContent = text;
    ui.toolbarScore.textContent = text;
  }

  function updateRows(scrollCurrent = true) {
    if (!ui) return;
    ui.sentences.querySelectorAll(".te-dict-row").forEach((row) => {
      const index = Number(row.dataset.index);
      const isSolved = solved.has(index);
      row.disabled = !isSolved;
      row.classList.toggle("solved", isSolved);
      row.classList.toggle("current", index === current);
      row.setAttribute("aria-label", `${tr("dictationSentenceNumber")} ${index + 1}${isSolved ? `, ${tr("dictationSolved")}` : `, ${tr("dictationLocked")}`}`);
      const translation = row.querySelector(".te-dict-vi");
      translation.textContent = isSolved ? (translations[String(index)] || "") : "";
      translation.hidden = !isSolved || !translation.textContent;
    });
    if (scrollCurrent) {
      const currentRow = ui.sentences.querySelector(`.te-dict-row[data-index="${current}"]`);
      currentRow?.scrollIntoView({ block: "nearest" });
    }
  }

  function createSentenceRow(index) {
    const cue = sentenceCues[index];
    const row = document.createElement("button");
    row.type = "button";
    row.className = "te-dict-row";
    row.dataset.index = String(index);
    row.disabled = !solved.has(index);
    row.setAttribute("role", "listitem");
    row.innerHTML = '<span class="te-dict-num"></span><span class="te-dict-text"></span><span class="te-dict-vi" hidden></span>';
    row.querySelector(".te-dict-num").textContent = String(index + 1);
    row.querySelector(".te-dict-text").textContent = cue.en;
    const translation = row.querySelector(".te-dict-vi");
    translation.textContent = translations[String(index)] || "";
    translation.hidden = !solved.has(index) || !translation.textContent;
    row.addEventListener("click", () => {
      if (!solved.has(index)) return;
      selectSentence(index, true);
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
    ui.lock.hidden = !locked;
    ui.vocab.disabled = locked;
    ui.note.disabled = locked;
    ui.save.disabled = locked;
  }

  function renderCurrent() {
    if (!ui || !active) return;
    while (current < listStart && listStart > 0) renderPrevious();
    while (current >= listEnd && listEnd < sentenceCues.length) renderMore();
    updateCounter();
    updateRows();
    updateProgressControls();
    const wasSolved = solved.has(current);
    setNotesLocked(!wasSolved);
    const saved = notes[String(current)] || {};
    ui.vocab.value = typeof saved.vocab === "string" ? saved.vocab : "";
    ui.note.value = typeof saved.note === "string" ? saved.note : "";
    ui.saved.textContent = "";
    ui.input.value = "";
    ui.input.classList.remove("correct");
    ui.feedback.textContent = "";
    ui.feedback.className = "te-dict-feedback";
    ui.wordFeedback.replaceChildren();
    ui.translation.hidden = !wasSolved;
    ui.translation.textContent = "";
    setScore(wasSolved ? "100%" : "—");
    if (wasSolved) void ensureVietnamese(current);
  }

  function selectSentence(index, replay) {
    if (!sentenceCues[index]) return;
    flushNotes();
    current = index;
    renderCurrent();
    if (replay) playSentence(index);
    ui?.input.focus({ preventScroll: true });
  }

  function updateTranslationViews(index) {
    if (!ui || !solved.has(index)) return;
    const translated = translations[String(index)] || "";
    const row = ui.sentences.querySelector(`.te-dict-row[data-index="${index}"] .te-dict-vi`);
    if (row) {
      row.textContent = translated;
      row.hidden = !translated;
    }
    if (current === index) {
      ui.translation.textContent = translated || tr("dictationTranslationLoading");
      ui.translation.hidden = false;
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

  function renderWordFeedback(result) {
    ui.wordFeedback.replaceChildren();
    for (const token of result.words || []) {
      const word = document.createElement("span");
      word.className = `te-dict-word${token.ok ? " correct" : ""}`;
      word.textContent = token.w;
      ui.wordFeedback.appendChild(word);
    }
  }

  function localConfetti() {
    if (!ui?.center) return;
    const colors = ["#22c55e", "#ef4444", "#f59e0b"];
    for (let i = 0; i < 28; i++) {
      const bit = document.createElement("span");
      bit.className = "te-dict-confetti";
      bit.style.backgroundColor = colors[i % colors.length];
      bit.style.setProperty("--dx", `${Math.round((Math.random() - 0.5) * 340)}px`);
      bit.style.setProperty("--dy", `${Math.round(120 + Math.random() * 210)}px`);
      bit.style.setProperty("--rot", `${Math.round(Math.random() * 540 - 270)}deg`);
      bit.style.left = `${38 + Math.random() * 24}%`;
      ui.center.appendChild(bit);
      setTimeout(() => bit.remove(), 900);
    }
  }

  function submit() {
    const cue = sentenceCues[current];
    if (!cue || !ui) return;
    const result = globalThis.LHN_DICTATION_SCORE.score(cue.en, ui.input.value);
    setScore(`${result.percent}%`);
    renderWordFeedback(result);
    if (result.perfect) {
      solved.add(current);
      ui.input.classList.add("correct");
      ui.feedback.className = "te-dict-feedback good";
      ui.feedback.textContent = `${tr("dictationCorrect")} 100%`;
      setNotesLocked(false);
      updateRows();
      updateProgressControls();
      ui.translation.hidden = false;
      ui.translation.textContent = translations[String(current)] || tr("dictationTranslationLoading");
      void saveRecord();
      void ensureVietnamese(current);
      localConfetti();
      return;
    }
    ui.input.classList.remove("correct");
    ui.feedback.className = "te-dict-feedback bad";
    ui.feedback.textContent = `${tr("dictationTryAgain")} ${result.percent}%`;
    setNotesLocked(!solved.has(current));
  }

  function playSentence(index) {
    const cue = sentenceCues[index];
    const video = A?.state?.videoEl;
    if (!cue || !video || !active) return;
    if (index !== current) {
      flushNotes();
      current = index;
      renderCurrent();
    }
    stopAt = Number(cue.end) || -1;
    try { video.currentTime = Math.max(0, Number(cue.start) || 0); } catch {}
    const playing = video.play();
    if (playing?.catch) playing.catch(() => {});
  }

  function onVideoTimeUpdate() {
    if (!active || stopAt < 0 || !attachedVideo) return;
    if (attachedVideo.currentTime >= stopAt) {
      attachedVideo.pause();
      stopAt = -1;
    }
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
      if (current > 0) selectSentence(current - 1, true);
    } else if (title === "Câu tiếp theo") {
      if (solved.has(current) && current < sentenceCues.length - 1) selectSentence(current + 1, true);
    } else if (title === "Lặp lại câu") {
      playSentence(current);
    } else {
      const video = A?.state?.videoEl;
      const cue = sentenceCues[current];
      if (!video || !cue) return;
      if (!video.paused) video.pause();
      else if (video.currentTime < cue.start || video.currentTime >= cue.end) playSentence(current);
      else {
        stopAt = cue.end;
        const playing = video.play();
        if (playing?.catch) playing.catch(() => {});
      }
    }
  }

  function stopFieldKeyEvent(event) {
    if (event.key !== "Escape") event.stopPropagation();
  }

  function onAnswerKeyDown(event) {
    if (event.key === "Escape") return; // Let the existing overlay Esc handler close the whole overlay.
    event.stopPropagation();
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
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
    ui.input.value = "";
    ui.input.classList.remove("correct");
    ui.feedback.textContent = "";
    ui.feedback.className = "te-dict-feedback";
    ui.wordFeedback.replaceChildren();
    setScore(solved.has(current) ? "100%" : "—");
    ui.input.focus({ preventScroll: true });
  }

  function onGlobalKeyDown(event) {
    if (!active) return;
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
  }

  function detachVideoEvents() {
    attachedVideo?.removeEventListener("timeupdate", onVideoTimeUpdate);
    attachedVideo = null;
    stopAt = -1;
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
    const generation = ++panelGeneration;
    current = cueAtVideoTime();
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
    attachVideoEvents();
    renderInitialRows();
    setNotesLocked(true);
    setScore("—");
    await loadProgress(videoId, generation);
    if (!active || panelGeneration !== generation || currentVideoId() !== videoId) return;
    renderCurrent();
    ui.input.focus({ preventScroll: true });
  }

  function close() {
    if (!active || !ui) return;
    flushNotes();
    active = false;
    panelGeneration++;
    document.removeEventListener("keydown", onGlobalKeyDown, true);
    document.removeEventListener("keyup", onGlobalKeyUp, true);
    detachVideoEvents();
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
