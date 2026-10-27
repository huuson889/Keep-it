// Dictation trong overlay video: mở bằng nút "AI keepit" trên te-control-bar.
// Dùng API overlay do dual-subtitles.js phát qua sự kiện "lhn-overlay-ready".
(() => {
  const api = typeof browser !== "undefined" ? browser : chrome;
  const T = {
    en: { title: "Dictation", placeholder: "Type the sentence you hear…", nolang: "This video has no English subtitles.", ok: "Correct!", bad: "Not quite — keep trying.", listen: "Listen", speak: "Speak", type: "Type", accuracy: "Accuracy", speakHint: "Speak the sentence, then press Enter to check.", speakNoSupport: "Speech check needs Chrome. Recording only: listen to yourself." },
    vi: { title: "Dictation", placeholder: "Gõ câu bạn nghe được…", nolang: "Video này không có phụ đề tiếng Anh.", ok: "Chính xác!", bad: "Chưa đúng — thử lại.", listen: "Nghe", speak: "Nói", type: "Đánh máy", accuracy: "Độ chính xác", speakHint: "Nói câu đó rồi nhấn Enter để chấm.", speakNoSupport: "Chấm bằng nhận dạng giọng nói cần Chrome. Trình duyệt này chỉ ghi âm để bạn nghe lại." },
    ko: { title: "받아쓰기", placeholder: "들리는 문장을 입력하세요…", nolang: "이 영상에는 영어 자막이 없습니다.", ok: "정답!", bad: "아직 다릅니다 — 다시 해 보세요.", listen: "듣기", speak: "말하기", type: "타이핑", accuracy: "정확도", speakHint: "문장을 말한 뒤 Enter를 눌러 확인하세요.", speakNoSupport: "음성 채점은 Chrome에서 가능합니다. 이 브라우저는 녹음 후 다시 듣기만 가능합니다." },
  };

  let A = null;                 // API overlay
  let panel = null, input = null, list = null, counter = null, feedback = null, ringText = null, ringArc = null;
  let open = false, current = 0, listEnd = 0, stopAt = -1, solved = new Set(), videoId = "", mode = "type";
  let recognition = null, recorder = null, recordedUrl = "", ctrlAlone = false;
  const lang = () => (T[A?.lang?.()] ? A.lang() : "en");
  const tr = (key) => T[lang()][key] || T.en[key];
  const cues = () => (A?.state?.captions || []).filter((c) => c && c.en);
  const storage = () => api.storage.local;
  const storageKey = () => `dictation:${videoId}`;

  function videoOf() { return A?.state?.videoEl || null; }

  async function load() {
    try {
      const data = (await storage().get(storageKey()))[storageKey()] || {};
      solved = new Set(data.solved || []);
    } catch { solved = new Set(); }
  }
  function save() {
    storage().set({ [storageKey()]: { count: cues().length, solved: [...solved] } }).catch(() => {});
  }

  function css() {
    const root = A.overlayEl();
    if (!root || root.querySelector("#te-dictation-style")) return;
    const style = document.createElement("style");
    style.id = "te-dictation-style";
    style.textContent = globalThis.LHN_DICTATION_CSS || "";
    root.appendChild(style);
  }

  function build() {
    if (panel) return;
    css();
    const root = A.overlayEl();
    panel = document.createElement("div");
    panel.id = "te-dictation";
    panel.className = "hidden";
    panel.innerHTML = `
      <div class="te-dict-body">
        <div class="te-dict-stage"></div>
        <div class="te-dict-side">
          <div class="te-dict-top">
            <span class="te-dict-counter" id="sentence-counter"></span>
            <button class="te-dict-close" type="button" id="te-dict-x" aria-label="Close">×</button>
          </div>
          <div class="te-dict-list" id="te-dict-list"></div>
        </div>
      </div>
      <div class="te-dict-foot">
        <input class="te-dict-input" id="te-dict-input" type="text" autocomplete="off" spellcheck="false">
        <div class="te-dict-feedback" id="te-dict-feedback"></div>
      </div>`;
    const sidebar = root.querySelector(".te-right-sidebar");
    if (sidebar) { panel.classList.add("in-sidebar"); sidebar.appendChild(panel); } else { root.appendChild(panel); }
    input = panel.querySelector("#te-dict-input");
    list = panel.querySelector("#te-dict-list");
    counter = panel.querySelector("#sentence-counter");
    feedback = panel.querySelector("#te-dict-feedback");
    panel.querySelector("#te-dict-x").addEventListener("click", close);
    list.addEventListener("scroll", () => { if (list.scrollTop + list.clientHeight > list.scrollHeight - 80) renderMore(); });
    input.addEventListener("keydown", (e) => {
      e.stopPropagation();
      if (e.key === "Enter") { e.preventDefault(); submit(); }
      else if (e.key === "Escape") { e.preventDefault(); input.value = ""; feedback.textContent = ""; }
    });
    input.addEventListener("keyup", (e) => e.stopPropagation());
    input.addEventListener("keypress", (e) => e.stopPropagation());
  }

  function renderMore() {
    const all = cues();
    const end = Math.min(all.length, listEnd + 40);
    for (let i = listEnd; i < end; i++) {
      const row = document.createElement("div");
      row.className = "te-dict-row" + (solved.has(i) ? " solved" : "");
      row.dataset.index = String(i);
      const cue = all[i];
      row.innerHTML = `<div><span class="te-dict-num">${i + 1}</span><span class="te-dict-text"></span></div><div class="te-dict-vi"></div>`;
      row.querySelector(".te-dict-text").textContent = cue.en;
      row.querySelector(".te-dict-vi").textContent = solved.has(i) ? (cue.vi && cue.vi !== cue.en ? cue.vi : "") : "";
      row.addEventListener("click", () => { if (solved.has(i)) playSentence(i); });
      list.appendChild(row);
    }
    listEnd = end;
    markCurrent();
  }

  function markCurrent() {
    list.querySelectorAll(".te-dict-row.current").forEach((r) => r.classList.remove("current"));
    const row = list.querySelector(`.te-dict-row[data-index="${current}"]`);
    if (row) { row.classList.add("current"); row.scrollIntoView({ block: "nearest" }); }
    counter.textContent = `${current + 1}/${cues().length}`;
    updateRing();
  }

  function updateRing() {
    const total = cues().length || 1;
    const pct = Math.round((solved.size / total) * 100);
    const el = A.overlayEl()?.querySelector("#te-dict-ring-text");
    if (el) el.textContent = `${pct}%`;
  }

  function updateRows() {
    list.querySelectorAll(".te-dict-row").forEach((row) => {
      const i = Number(row.dataset.index);
      const isSolved = solved.has(i);
      row.classList.toggle("solved", isSolved);
      row.querySelector(".te-dict-vi").textContent = isSolved ? (cues()[i].vi && cues()[i].vi !== cues()[i].en ? cues()[i].vi : "") : "";
    });
  }

  function playSentence(i) {
    const cue = cues()[i], v = videoOf();
    if (!cue || !v) return;
    current = i;
    v.currentTime = cue.start;
    stopAt = cue.end;
    v.play().catch(() => {});
    markCurrent();
  }

  function onTimeUpdate() {
    const v = videoOf();
    if (open && stopAt >= 0 && v && v.currentTime >= stopAt) { v.pause(); stopAt = -1; }
  }

  function submit() {
    const cue = cues()[current];
    if (!cue) return;
    const res = LHN_DICTATION_SCORE.score(cue.en, input.value);
    if (res.perfect) {
      solved.add(current); save();
      feedback.className = "te-dict-feedback good"; feedback.textContent = `${tr("ok")} ${res.percent}%`;
      updateRows(); updateRing();
      if (current < cues().length - 1) { current++; input.value = ""; playSentence(current); }
    } else {
      feedback.className = "te-dict-feedback bad";
      feedback.textContent = `${tr("bad")} ${res.percent}%`;
    }
    markCurrent();
  }

  // Nói: Chrome chấm bằng nhận dạng giọng nói; Firefox chỉ ghi âm để nghe lại
  function toggleSpeak() {
    mode = mode === "speak" ? "type" : "speak";
    input.placeholder = mode === "speak" ? tr("speakHint") : tr("placeholder");
    if (mode !== "speak") { stopSpeak(); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      recognition = new SR(); recognition.lang = "en-US"; recognition.interimResults = false;
      recognition.onresult = (e) => { input.value = e.results[0][0].transcript; submit(); };
      recognition.onerror = () => {};
      try { recognition.start(); } catch {}
    } else {
      feedback.className = "te-dict-feedback"; feedback.textContent = tr("speakNoSupport");
      navigator.mediaDevices?.getUserMedia({ audio: true }).then((stream) => {
        const chunks = [];
        recorder = new MediaRecorder(stream);
        recorder.ondataavailable = (e) => chunks.push(e.data);
        recorder.onstop = () => {
          stream.getTracks().forEach((t) => t.stop());
          if (recordedUrl) URL.revokeObjectURL(recordedUrl);
          recordedUrl = URL.createObjectURL(new Blob(chunks, { type: "audio/webm" }));
          new Audio(recordedUrl).play().catch(() => {});
        };
        recorder.start();
      }).catch(() => {});
    }
  }
  function stopSpeak() {
    try { recognition?.stop(); } catch {}
    try { if (recorder && recorder.state !== "inactive") recorder.stop(); } catch {}
    recognition = null; recorder = null;
  }

  function hideLeftControls(hidden) {
    ["Thêm vào từ vựng", "Mở bộ sưu tập", "Lặp lại câu"].forEach((t) => {
      const b = A.ctrl(t); if (b) b.style.display = hidden ? "none" : "";
    });
  }

  function openPanel() {
    if (open) return;
    build();
    videoId = new URL(location.href).searchParams.get("v") || location.pathname;
    open = true;
    panel.classList.remove("hidden");
    hideLeftControls(true);
    const all = cues();
    if (!all.length) { feedback.className = "te-dict-feedback bad"; feedback.textContent = tr("nolang"); }
    load().then(() => {
      list.replaceChildren(); listEnd = 0;
      current = Math.min(current, Math.max(0, all.length - 1));
      renderMore(); updateRing(); input.placeholder = tr("placeholder"); input.focus();
    });
    const v = videoOf(); if (v) v.addEventListener("timeupdate", onTimeUpdate);
  }

  function close() {
    if (!open) return;
    open = false;
    stopSpeak();
    panel.classList.add("hidden");
    hideLeftControls(false);
    const v = videoOf(); if (v) v.removeEventListener("timeupdate", onTimeUpdate);
    stopAt = -1;
  }

  function toggle() { open ? close() : openPanel(); }

  // Khi dictation mở, các nút điều khiển chuyển câu/phát được chuyển hướng sang dictation
  function routeControls(e) {
    if (!open) return;
    const btn = e.target.closest?.("button[title]");
    if (!btn) return;
    const t = btn.getAttribute("title");
    if (t === "Câu trước") { e.preventDefault(); e.stopImmediatePropagation(); playSentence(Math.max(0, current - 1)); }
    else if (t === "Câu tiếp theo") { e.preventDefault(); e.stopImmediatePropagation(); playSentence(Math.min(cues().length - 1, current + 1)); }
    else if (t === "Phát/Tạm dừng") {
      e.preventDefault(); e.stopImmediatePropagation();
      const v = videoOf(); if (v) (v.paused ? v.play() : v.pause());
    }
    else if (t === "Lặp lại câu") { e.preventDefault(); e.stopImmediatePropagation(); playSentence(current); }
  }

  // Ctrl một mình: nghe lại câu hiện tại
  function onKeyDown(e) {
    if (!open) return;
    if (e.key === "Control") { ctrlAlone = true; return; }
    ctrlAlone = false;
  }
  function onKeyUp(e) {
    if (!open || e.key !== "Control") return;
    if (ctrlAlone) playSentence(current);
    ctrlAlone = false;
  }

  function attachControls() {
    const aiBtn = A.ctrl("AI keepit");
    if (aiBtn) aiBtn.addEventListener("click", (e) => { e.stopPropagation(); toggle(); });
    const speakBtn = document.createElement("button");
    speakBtn.type = "button"; speakBtn.className = "te-icon-btn"; speakBtn.title = "Nói";
    speakBtn.textContent = "🎤"; speakBtn.addEventListener("click", (e) => { e.stopPropagation(); toggleSpeak(); });
    const typeBtn = document.createElement("button");
    typeBtn.type = "button"; typeBtn.className = "te-icon-btn"; typeBtn.title = "Đánh máy";
    typeBtn.textContent = "⌨"; typeBtn.addEventListener("click", (e) => { e.stopPropagation(); if (mode === "speak") toggleSpeak(); input?.focus(); });
    const accBtn = document.createElement("span");
    accBtn.className = "te-dict-accuracy"; accBtn.title = "Độ chính xác"; accBtn.id = "te-dict-ring-text"; accBtn.textContent = "0%";
    const ctrlBar = A.overlayEl()?.querySelector(".te-control-bar .te-ctrl-group");
    if (ctrlBar) { ctrlBar.prepend(accBtn); ctrlBar.prepend(typeBtn); ctrlBar.prepend(speakBtn); }
    document.addEventListener("click", routeControls, true);
    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("keyup", onKeyUp, true);
  }

  document.addEventListener("lhn-overlay-ready", (ev) => {
    A = ev.detail || globalThis.LHN_OVERLAY_API;
    if (!A || A.__dictationReady) return;
    A.__dictationReady = true;
    attachControls();
  });
  globalThis.LHN_DICTATION = Object.freeze({ toggle, open: openPanel, close });
})();
