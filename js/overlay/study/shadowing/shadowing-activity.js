// Speaking-specific recognition, recording, playback, and feedback behavior.
globalThis.LHN_SHADOWING_ACTIVITY_FACTORY = Object.freeze({
  create(ctx) {
    const SPEECH_ENDPOINT_GRACE_MS = 1500;
    const state = {
      speechRecognition: null,
      speechRecognitionError: "",
      speechStartPending: false,
      speechStartGeneration: 0,
      speechStopRequested: false,
      speechAutoRecordEnabled: true,
      speechCueAutoStartPending: false,
      speechAutoStartTimer: 0,
      speechEndpointGraceTimer: 0,
      speechRecordingToastVisible: false,
      speechAnswerRevealed: false,
      speechRecorder: null,
      speechRecordingStream: null,
      speechRecordingChunks: [],
      speechRecordingUrl: "",
      speechRecordingDiscard: false,
      speechRecordingStopPromise: null,
      resolveSpeechRecordingStop: null,
      speechPlaybackAudio: null,
      speechToastTimer: 0,
      lastSpeechFeedback: null,
    };
  function getSpeechScoreTier(percent) {
    const colorTier = ctx.getScoreColorTier(percent);
    if (colorTier === "green") return "pass";
    if (colorTier === "yellow") return "warn";
    return colorTier === "red" ? "fail" : null;
  }

  function setSpeechTargetState(state = "practice") {
    if (!ctx.ui?.speechTarget) return;
    for (const name of ["practice", "wrong", "correct", "warn"]) {
      ctx.ui.speechTarget.classList.toggle(`state-${name}`, state === name);
    }
  }

  function showSpeechRecordingToast() {
    ctx.showToast(ctx.tr("dictationSpeakListening"), 0, "speech-recording");
  }

  function hideSpeechRecordingToast() {
    if (!state.speechRecordingToastVisible) return;
    const toast = ctx.A?.overlayEl?.()?.querySelector?.("#te-dict-toast");
    if (toast?.dataset.dictToastKind === "speech-recording") {
      toast.classList.remove("visible");
      toast.dataset.dictToastKind = "";
    }
    clearTimeout(ctx.toastTimer);
    ctx.toastTimer = 0;
    state.speechRecordingToastVisible = false;
  }

  function setSpeechStatus(messageKey = "") {
    if (!ctx.ui?.speechStatus) return;
    if (messageKey) {
      ctx.ui.speechStatus.removeAttribute("data-dict-label");
      ctx.ui.speechStatus.textContent = ctx.tr(messageKey);
      return;
    }
    ctx.ui.speechStatus.dataset.dictLabel = "dictationSpeakReady";
    ctx.ui.speechStatus.textContent = ctx.tr("dictationSpeakReady");
  }

  function updateSpeechCheckDisabled() {
    if (!ctx.ui?.check) return;
    const video = ctx.attachedVideo || ctx.A?.state?.videoEl;
    const videoCuePlaying = ctx.stopAt >= 0 && !!video && !video.paused;
    const speakingBusy = ctx.dictationMode === "speaking" && (
      state.speechStartPending || !!state.speechRecognition || !!state.speechRecorder || !!state.speechRecordingStream
      || state.speechStopRequested || !!state.speechPlaybackAudio || videoCuePlaying
    );
    const speechMicWaiting = ctx.dictationMode === "speaking" && !!ctx.ui.speechMic && !ctx.ui.speechMic.disabled
      && !ctx.ui.speechMic.classList.contains("listening") && !speakingBusy;
    ctx.ui.check.disabled = ctx.captionControlsDisabled || speakingBusy || speechMicWaiting;
  }

  function resetSpeechFeedback() {
    if (!ctx.ui?.success) return;
    clearTimeout(state.speechToastTimer);
    state.speechToastTimer = 0;
    if (ctx.ui.work && ctx.ui.success.parentNode !== ctx.ui.work) ctx.ui.work.insertBefore(ctx.ui.success, ctx.ui.work.firstChild);
    state.lastSpeechFeedback = null;
    ctx.ui.success.classList.remove("te-dict-speech-feedback", "te-dict-speech-toast", "te-dict-speech-toast-spring", "te-dict-speech-toast-exit", "state-pass", "state-warn", "state-fail");
    if (ctx.ui.successIcon) ctx.ui.successIcon.innerHTML = '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>';
    if (ctx.ui.successMessage) {
      ctx.ui.successMessage.dataset.dictLabel = "dictationSuccess";
      ctx.ui.successMessage.textContent = ctx.tr("dictationSuccess");
    }
    if (ctx.ui.speechToastRing) ctx.ui.speechToastRing.hidden = true;
    if (ctx.ui.speechToastRingFill) ctx.ui.speechToastRingFill.style.strokeDashoffset = "132";
    if (ctx.ui.speechToastScore) ctx.ui.speechToastScore.textContent = "0%";
    if (ctx.ui.speechToastDescription) { ctx.ui.speechToastDescription.hidden = true; ctx.ui.speechToastDescription.textContent = ""; }
    if (ctx.ui.speechFeedbackSentence) ctx.ui.speechFeedbackSentence.hidden = true;
    if (ctx.ui.speechFeedbackSentenceText) ctx.ui.speechFeedbackSentenceText.textContent = "";
    if (ctx.ui.speechFeedbackAccuracy) ctx.ui.speechFeedbackAccuracy.hidden = true;
    if (ctx.ui.speechFeedbackAccuracyValue) ctx.ui.speechFeedbackAccuracyValue.textContent = "";
  }

  function getVietnameseSpeechCopy(percent) {
    const score = Math.max(0, Math.min(100, Math.round(Number(percent) || 0)));
    if (score <= 9) return { title: "Khởi động lại nào!", description: "Chưa sao cả, cứ mạnh dạn nói tiếp. Mỗi lần thử là một bước gần hơn đến phát âm chuẩn!" };
    if (score <= 19) return { title: "Đã bắt đầu rồi!", description: "Bạn đã có những âm thanh đầu tiên. Chậm lại một chút, nghe kỹ và thử lại nhé!" };
    if (score <= 29) return { title: "Có tín hiệu rồi đấy!", description: "Một vài từ đã bắt đầu đúng hướng. Cứ kiên trì, miệng bạn đang dần quen với tiếng Anh!" };
    if (score <= 39) return { title: "Sắp bắt nhịp rồi!", description: "Bạn đã tiến gần hơn đến mục tiêu. Chỉnh thêm một chút phát âm và ngữ điệu nhé!" };
    if (score <= 49) return { title: "Khởi sắc rồi!", description: "Bạn đã nói được kha khá đấy. Tiếp tục luyện từng âm để câu nói rõ ràng hơn nhé!" };
    if (score <= 59) return { title: "Đang vào guồng!", description: "Một nửa chặng đường đã nằm trong tay bạn. Cố thêm chút nữa để lời nói tự nhiên hơn!" };
    if (score <= 64) return { title: "Tiến bộ đáng kể!", description: "Bạn đã nắm được phần lớn cách phát âm. Chú ý thêm những âm còn thiếu để bứt phá nhé!" };
    if (score <= 69) return { title: "Chỉ còn một bước nữa!", description: "Bạn đang rất gần mức tốt rồi. Thêm một chút tập trung là có thể chạm đích!" };
    if (score <= 74) return { title: "Đạt yêu cầu, tiếp tục phát huy!", description: "Bạn đã đạt ngưỡng luyện nói. Luyện thêm để phát âm tự nhiên hơn nhé!" };
    if (score <= 79) return { title: "Nói khá chuẩn rồi!", description: "Bạn đang làm rất tốt. Chỉnh thêm vài chi tiết nhỏ để câu nói mượt mà hơn nhé!" };
    if (score <= 84) return { title: "Rất tốt, cứ thế nhé!", description: "Phát âm của bạn đã khá vững vàng. Tiếp tục duy trì phong độ và chinh phục những câu khó hơn!" };
    if (score <= 89) return { title: "Gần như hoàn hảo!", description: "Bạn đã nói rất rõ ràng và chính xác. Giờ hãy thêm chút ngữ điệu để nghe thật cuốn hút!" };
    if (score <= 94) return { title: "Xuất sắc!", description: "Bạn đang làm chủ cách phát âm rất tốt. Nghe thôi đã thấy trình độ lên một tầm mới!" };
    if (score <= 99) return { title: "Đỉnh cao phát âm!", description: "Gần như không có gì để bắt bẻ! Bạn đang tiến sát đến sự hoàn hảo rồi!" };
    return { title: "Perfect! Quá đỉnh!", description: "Không thể tin được, bạn đã chinh phục câu nói này! Giữ vững phong độ và tiếp tục tỏa sáng!" };
  }

  function setSpeechFeedback(tier, percent, sentence, perfect) {
    if (!ctx.ui?.success) return;
    clearTimeout(state.speechToastTimer);
    state.speechToastTimer = 0;
    ctx.ui.success.classList.remove("te-dict-speech-toast-exit");
    const state = ["pass", "warn", "fail"].includes(tier) ? tier : "fail";
    state.lastSpeechFeedback = { tier: state, percent, sentence, perfect: Boolean(perfect) };
    const iconPaths = {
      pass: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
      warn: '<path d="m10.29 3.86-8.47 14.14A2 2 0 0 0 3.54 21h16.92a2 2 0 0 0 1.72-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
      fail: '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>'
    };
    ctx.ui.success.classList.add("te-dict-speech-feedback");
    for (const name of ["pass", "warn", "fail"]) ctx.ui.success.classList.toggle(`state-${name}`, name === state);
    if (ctx.ui.successIcon) ctx.ui.successIcon.innerHTML = iconPaths[state];
    if (ctx.language() === "vi") {
      if (ctx.ui.center && ctx.ui.success.parentNode !== ctx.ui.center) ctx.ui.center.appendChild(ctx.ui.success);
      const copy = getVietnameseSpeechCopy(percent);
      ctx.ui.success.classList.add("te-dict-speech-toast");
      if (ctx.ui.successMessage) {
        ctx.ui.successMessage.removeAttribute("data-dict-label");
        ctx.ui.successMessage.textContent = copy.title;
      }
      if (ctx.ui.speechToastDescription) { ctx.ui.speechToastDescription.textContent = copy.description; ctx.ui.speechToastDescription.hidden = false; }
      if (ctx.ui.speechToastRing) ctx.ui.speechToastRing.hidden = false;
      if (ctx.ui.speechToastScore) ctx.ui.speechToastScore.textContent = `${percent}%`;
      if (ctx.ui.speechToastRingFill) ctx.ui.speechToastRingFill.style.strokeDashoffset = String(132 - (132 * Math.max(0, Math.min(100, percent))) / 100);
      if (ctx.ui.speechFeedbackSentence) ctx.ui.speechFeedbackSentence.hidden = true;
      if (ctx.ui.speechFeedbackAccuracy) ctx.ui.speechFeedbackAccuracy.hidden = true;
    } else {
      if (ctx.ui.work && ctx.ui.success.parentNode !== ctx.ui.work) ctx.ui.work.insertBefore(ctx.ui.success, ctx.ui.work.firstChild);
      ctx.ui.success.classList.remove("te-dict-speech-toast", "te-dict-speech-toast-spring");
      if (ctx.ui.speechToastRing) ctx.ui.speechToastRing.hidden = true;
      if (ctx.ui.speechToastDescription) ctx.ui.speechToastDescription.hidden = true;
      const messageKey = state === "pass"
        ? perfect ? "dictationSpeakSuccess" : "dictationSpeakPassed"
        : "dictationSpeakRetry";
      if (ctx.ui.successMessage) {
        ctx.ui.successMessage.dataset.dictLabel = messageKey;
        ctx.ui.successMessage.textContent = ctx.tr(messageKey);
      }
      if (ctx.ui.speechFeedbackSentence) ctx.ui.speechFeedbackSentence.hidden = false;
      if (ctx.ui.speechFeedbackSentenceText) ctx.ui.speechFeedbackSentenceText.textContent = String(sentence || "");
      if (ctx.ui.speechFeedbackAccuracy) ctx.ui.speechFeedbackAccuracy.hidden = false;
      if (ctx.ui.speechFeedbackAccuracyValue) ctx.ui.speechFeedbackAccuracyValue.textContent = `${percent}%`;
    }
    ctx.ui.success.hidden = false;
    if (ctx.language() === "vi") {
      ctx.ui.success.classList.remove("te-dict-speech-toast-spring");
      void ctx.ui.success.offsetWidth;
      ctx.ui.success.classList.add("te-dict-speech-toast-spring");
      state.speechToastTimer = setTimeout(dismissVietnameseSpeechToast, 6000);
    }
  }

  function shouldKeepVietnameseSpeechToast() {
    return Boolean(ctx.ui?.success && !ctx.ui.success.hidden && ctx.dictationMode === "speaking" && ctx.language() === "vi" && ctx.ui.success.classList.contains("te-dict-speech-toast"));
  }

  function dismissVietnameseSpeechToast() {
    if (!shouldKeepVietnameseSpeechToast() || ctx.ui.success.classList.contains("te-dict-speech-toast-exit")) return;
    clearTimeout(state.speechToastTimer);
    ctx.ui.success.classList.remove("te-dict-speech-toast-spring");
    ctx.ui.success.classList.add("te-dict-speech-toast-exit");
    state.speechToastTimer = setTimeout(() => {
      if (!ctx.ui?.success?.classList.contains("te-dict-speech-toast-exit")) return;
      ctx.ui.success.hidden = true;
      resetSpeechFeedback();
    }, 300);
  }

  function updateSpeechMicState(listening) {
    if (!ctx.ui?.speechMic) return;
    ctx.ui.speechMic.classList.toggle("listening", listening);
    ctx.ui.speechMic.setAttribute("aria-pressed", String(listening));
    const labelKey = ctx.ui.speechMic.classList.contains("playing-recording")
      ? "dictationSpeakPlayback" : listening ? "dictationSpeakStop" : "dictationSpeakStart";
    ctx.ui.speechMic.setAttribute("aria-label", ctx.tr(labelKey));
    ctx.ui.speechMic.title = ctx.tr(labelKey);
    updateSpeechCheckDisabled();
  }

  function updateSpeechAutoRecordControl() {
    if (!ctx.ui?.speechAutoToggle) return;
    const label = ctx.tr("dictationAutoRecord");
    ctx.ui.speechAutoToggle.classList.toggle("active", state.speechAutoRecordEnabled);
    ctx.ui.speechAutoToggle.setAttribute("aria-pressed", String(state.speechAutoRecordEnabled));
    ctx.ui.speechAutoToggle.setAttribute("aria-label", label);
    ctx.ui.speechAutoToggle.title = label;
    ctx.ui.speechMic?.classList.toggle("auto-record-enabled", state.speechAutoRecordEnabled);
  }

  function updateSpeechMicPlaybackState(playing) {
    if (!ctx.ui?.speechMic) return;
    const button = ctx.ui.speechMic;
    button.classList.toggle("playing-recording", playing);
    button.innerHTML = playing
      ? '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-mic-audio-lines preview-icon" aria-hidden="true"><path d="M10 3v2.341"/><path d="M12 17v4"/><path d="M14 5v.341"/><path d="M18 5v13"/><path d="M2 10v3"/><path d="M22 10v3"/><path d="M6 6v11"/><path d="M9 21h6"/><rect width="4" height="8" x="10" y="9" rx="2"/></svg>'
      : makeSvg('<path d="M12 19v3"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><rect x="9" y="2" width="6" height="13" rx="3"/>');
    const labelKey = playing ? "dictationSpeakPlayback"
      : button.classList.contains("listening") ? "dictationSpeakStop" : "dictationSpeakStart";
    button.setAttribute("aria-label", ctx.tr(labelKey));
    button.title = ctx.tr(labelKey);
    updateSpeechCheckDisabled();
  }

  function clearSpeechAutoStartTimer() {
    if (state.speechAutoStartTimer) clearTimeout(state.speechAutoStartTimer);
    state.speechAutoStartTimer = 0;
  }

  function clearSpeechEndpointGraceTimer() {
    if (state.speechEndpointGraceTimer) clearTimeout(state.speechEndpointGraceTimer);
    state.speechEndpointGraceTimer = 0;
  }

  function setSpeechAutoRecordEnabled(enabled) {
    state.speechAutoRecordEnabled = Boolean(enabled);
    if (!state.speechAutoRecordEnabled) {
      clearSpeechAutoStartTimer();
      clearSpeechEndpointGraceTimer();
    }
    updateSpeechAutoRecordControl();
    if (state.speechAutoRecordEnabled && state.speechCueAutoStartPending) scheduleSpeechAutoRecord();
  }

  function toggleSpeechAutoRecord() {
    setSpeechAutoRecordEnabled(!state.speechAutoRecordEnabled);
  }

  function scheduleSpeechAutoRecord() {
    clearSpeechAutoStartTimer();
    if (!state.speechAutoRecordEnabled || !state.speechCueAutoStartPending || !ctx.active || ctx.dictationMode !== "speaking" || state.speechAnswerRevealed
      || !ctx.sentenceCues[ctx.current]?.en || state.speechStartPending || state.speechRecognition || state.speechStopRequested
      || state.speechPlaybackAudio || state.speechRecorder || state.speechRecordingStream) return;
    state.speechAutoStartTimer = setTimeout(() => {
      state.speechAutoStartTimer = 0;
      if (!state.speechAutoRecordEnabled || !state.speechCueAutoStartPending || !ctx.active || ctx.dictationMode !== "speaking" || state.speechAnswerRevealed
        || !ctx.sentenceCues[ctx.current]?.en || state.speechStartPending || state.speechRecognition || state.speechStopRequested
        || state.speechPlaybackAudio || state.speechRecorder || state.speechRecordingStream) {
        state.speechCueAutoStartPending = false;
        return;
      }
      state.speechCueAutoStartPending = false;
      void toggleSpeechRecognition({ automatic: true });
    }, 1000);
  }

  function clearRecordedSpeech() {
    if (state.speechPlaybackAudio) {
      const player = state.speechPlaybackAudio;
      state.speechPlaybackAudio = null;
      try { player.pause(); } catch {}
      updateSpeechMicPlaybackState(false);
    }
    if (state.speechRecordingUrl) {
      try { globalThis.URL?.revokeObjectURL?.(state.speechRecordingUrl); } catch {}
      state.speechRecordingUrl = "";
    }
  }

  function stopSpeechRecording(discard = false) {
    if (discard) {
      state.speechRecordingDiscard = true;
      clearRecordedSpeech();
    }
    const recorder = state.speechRecorder;
    if (!recorder) {
      try { state.speechRecordingStream?.getTracks?.().forEach((track) => track.stop()); } catch {}
      state.speechRecordingStream = null;
      return Promise.resolve(discard ? "" : state.speechRecordingUrl);
    }
    const stopped = state.speechRecordingStopPromise || Promise.resolve(state.speechRecordingUrl);
    if (recorder.state !== "inactive") {
      try { recorder.stop(); }
      catch {
        try { state.speechRecordingStream?.getTracks?.().forEach((track) => track.stop()); } catch {}
        state.speechRecorder = null;
        state.speechRecordingStream = null;
        state.speechRecordingChunks = [];
        state.speechRecordingStopPromise = null;
        state.resolveSpeechRecordingStop = null;
        updateSpeechCheckDisabled();
        return Promise.resolve("");
      }
    }
    return stopped.then((url) => discard ? "" : url);
  }

  function startSpeechRecording(stream) {
    const Recorder = globalThis.MediaRecorder || globalThis.window?.MediaRecorder;
    if (typeof Recorder !== "function") {
      try { stream?.getTracks?.().forEach((track) => track.stop()); } catch {}
      return false;
    }
    let recorder;
    try { recorder = new Recorder(stream); }
    catch {
      try { stream?.getTracks?.().forEach((track) => track.stop()); } catch {}
      return false;
    }
    state.speechRecordingDiscard = false;
    state.speechRecordingStream = stream;
    state.speechRecordingChunks = [];
    state.speechRecordingStopPromise = new Promise((resolve) => { state.resolveSpeechRecordingStop = resolve; });
    state.speechRecorder = recorder;
    recorder.ondataavailable = (event) => {
      if (event.data?.size) state.speechRecordingChunks.push(event.data);
    };
    recorder.onstop = () => {
      if (!state.speechRecordingDiscard && state.speechRecordingChunks.length) {
        try {
          clearRecordedSpeech();
          const type = recorder.mimeType || state.speechRecordingChunks[0]?.type || "audio/webm";
          state.speechRecordingUrl = globalThis.URL?.createObjectURL?.(new Blob(state.speechRecordingChunks, { type })) || "";
        } catch { state.speechRecordingUrl = ""; }
      }
      try { state.speechRecordingStream?.getTracks?.().forEach((track) => track.stop()); } catch {}
      state.speechRecordingStream = null;
      if (state.speechRecorder === recorder) state.speechRecorder = null;
      state.speechRecordingChunks = [];
      const resolve = state.resolveSpeechRecordingStop;
      const url = state.speechRecordingUrl;
      state.speechRecordingStopPromise = null;
      state.resolveSpeechRecordingStop = null;
      resolve?.(url);
      updateSpeechCheckDisabled();
    };
    try { recorder.start(); }
    catch {
      state.speechRecorder = null;
      try { stream?.getTracks?.().forEach((track) => track.stop()); } catch {}
      state.speechRecordingStream = null;
      state.speechRecordingChunks = [];
      const resolve = state.resolveSpeechRecordingStop;
      state.speechRecordingStopPromise = null;
      state.resolveSpeechRecordingStop = null;
      resolve?.("");
      return false;
    }
    return true;
  }

  function pauseVideoForSpeech() {
    ctx.endPlayback();
    const video = ctx.attachedVideo || ctx.A?.state?.videoEl;
    video?.pause();
  }

  function playRecordedSpeech(url, trimFinalGraceSilence = false) {
    if (!url || typeof globalThis.Audio !== "function") return Promise.resolve(false);
    pauseVideoForSpeech();
    return new Promise((resolve) => {
      let settled = false;
      let player;
      const finish = (played) => {
        if (settled) return;
        settled = true;
        if (player && state.speechPlaybackAudio === player) {
          state.speechPlaybackAudio = null;
          updateSpeechMicPlaybackState(false);
        }
        resolve(played);
      };
      const stopBeforeGraceTail = () => {
        if (settled || !trimFinalGraceSilence || !Number.isFinite(player?.duration)) return;
        const cutoff = Math.max(0, player.duration - SPEECH_ENDPOINT_GRACE_MS / 1000);
        if (player.currentTime < cutoff) return;
        finish(true);
        try { player.pause(); } catch {}
      };
      try {
        player = new Audio(url);
        state.speechPlaybackAudio = player;
        updateSpeechMicPlaybackState(true);
        player.addEventListener("ended", () => finish(true), { once: true });
        player.addEventListener("error", () => finish(false), { once: true });
        player.addEventListener("pause", () => { if (!player.ended) finish(false); }, { once: true });
        if (trimFinalGraceSilence) {
          player.addEventListener("loadedmetadata", stopBeforeGraceTail);
          player.addEventListener("timeupdate", stopBeforeGraceTail);
        }
        Promise.resolve(player.play()).then(stopBeforeGraceTail, () => finish(false));
      } catch { finish(false); }
    });
  }

  function stopSpeechRecognition(abort = true) {
    state.speechCueAutoStartPending = false;
    clearSpeechAutoStartTimer();
    clearSpeechEndpointGraceTimer();
    hideSpeechRecordingToast();
    state.speechStartGeneration++;
    state.speechStartPending = false;
    state.speechStopRequested = false;
    const recognition = state.speechRecognition;
    state.speechRecognition = null;
    if (recognition) {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      try { abort ? recognition.abort() : recognition.stop(); } catch {}
    }
    updateSpeechMicState(false);
    void stopSpeechRecording(true);
  }

  function showSpeechResultPanel() {
    if (ctx.ui?.speechResultWrap) ctx.ui.speechResultWrap.hidden = false;
  }

  function renderSpeechResult(text) {
    if (!ctx.ui?.speechResult) return;
    const transcript = String(text || "").trim();
    ctx.ui.speechResult.replaceChildren();
    ctx.ui.speechResultWrap.hidden = !transcript;
    if (!transcript) return;
    const reference = ctx.sentenceCues[ctx.current]?.en || "";
    const operations = globalThis.LHN_DICTATION_SCORE.score(reference, transcript).ops;
    const typedTokens = ctx.getTranscriptWordTokens(transcript);
    const expectedTokens = ctx.getTranscriptWordTokens(reference);
    const displayTokens = (tokens, indices, fallback) => {
      if (!indices?.length) return fallback || "";
      return tokens.slice(indices[0], indices[indices.length - 1] + 1).map((item) => item.display).join(" ");
    };
    for (const operation of operations) {
      const typedDisplay = displayTokens(typedTokens, operation.typedIndices, operation.typed);
      const expectedDisplay = displayTokens(expectedTokens, operation.expectedIndices, operation.expected);
      if (operation.type === "wrong") {
        const token = document.createElement("span");
        token.className = "te-dict-speech-word wrong";
        token.textContent = typedDisplay;
        ctx.ui.speechResult.appendChild(token);
        const correction = document.createElement("span");
        correction.className = "te-dict-speech-word fix";
        correction.textContent = `→ ${expectedDisplay}`;
        ctx.ui.speechResult.appendChild(correction);
      } else {
        const token = document.createElement("span");
        token.className = `te-dict-speech-word ${operation.type}`;
        token.textContent = operation.type === "missing" ? expectedDisplay : typedDisplay;
        ctx.ui.speechResult.appendChild(token);
      }
    }
  }

  async function toggleSpeechRecognition({ automatic = false } = {}) {
    if (!automatic) {
      state.speechCueAutoStartPending = false;
      clearSpeechAutoStartTimer();
      clearSpeechEndpointGraceTimer();
    }
    if (ctx.dictationMode !== "speaking") ctx.setDictationMode("speaking");
    if (state.speechStopRequested || state.speechPlaybackAudio) return;
    if (state.speechStartPending) {
      state.speechStartGeneration++;
      state.speechStartPending = false;
      updateSpeechMicState(false);
      setSpeechStatus("");
      return;
    }
    if (state.speechRecognition) {
      state.speechStopRequested = true;
      setSpeechStatus("dictationSpeakProcessing");
      try { state.speechRecognition.stop(); }
      catch {
        state.speechStopRequested = false;
        stopSpeechRecognition(true);
        setSpeechStatus("dictationSpeakError");
      }
      return;
    }
    const Recognition = globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition
      || globalThis.window?.SpeechRecognition || globalThis.window?.webkitSpeechRecognition;
    if (typeof Recognition !== "function") {
      setSpeechStatus("dictationSpeakUnsupported");
      return;
    }
    const cue = ctx.sentenceCues[ctx.current];
    if (!cue?.en) {
      setSpeechStatus("dictationWaitingForCaptions");
      return;
    }
    let recognition;
    try { recognition = new Recognition(); }
    catch { setSpeechStatus("dictationSpeakError"); return; }

    const attemptCurrent = ctx.current;
    const trimFinalGraceSilence = state.speechAutoRecordEnabled;
    const generation = ++state.speechStartGeneration;
    state.speechStartPending = true;
    state.speechStopRequested = false;
    state.speechAnswerRevealed = false;
    clearRecordedSpeech();
    state.speechRecordingDiscard = false;
    pauseVideoForSpeech();
    state.speechRecognitionError = "";
    ctx.ui.input.value = "";
    setSpeechTargetState("practice");
    ctx.onAnswerInput();
    ctx.ui.speechResult.replaceChildren();
    ctx.ui.speechResultWrap.hidden = true;
    setSpeechStatus("dictationSpeakListening");
    updateSpeechMicState(true);

    let recordingAvailable = false;
    const mediaDevices = globalThis.navigator?.mediaDevices || globalThis.window?.navigator?.mediaDevices;
    if (typeof mediaDevices?.getUserMedia === "function"
      && typeof (globalThis.MediaRecorder || globalThis.window?.MediaRecorder) === "function") {
      try {
        const stream = await mediaDevices.getUserMedia({ audio: true });
        if (generation !== state.speechStartGeneration || !ctx.active || ctx.dictationMode !== "speaking" || attemptCurrent !== ctx.current) {
          try { stream.getTracks?.().forEach((track) => track.stop()); } catch {}
          return;
        }
        recordingAvailable = startSpeechRecording(stream);
      } catch {
        recordingAvailable = false;
      }
    }
    if (generation !== state.speechStartGeneration || !ctx.active || ctx.dictationMode !== "speaking" || attemptCurrent !== ctx.current) {
      state.speechStartPending = false;
      updateSpeechMicState(false);
      return;
    }

    const completedSpeechSegments = [];
    let speechAttemptFinalized = false;

    const getCompletedSpeechTranscript = () => completedSpeechSegments.join(" ").replace(/\s+/g, " ").trim();

    async function finalizeSpeechAttempt(transcript) {
      if (speechAttemptFinalized) return;
      speechAttemptFinalized = true;
      hideSpeechRecordingToast();
      clearSpeechEndpointGraceTimer();
      state.speechRecognition = null;
      updateSpeechMicState(false);
      const completedTranscript = String(transcript || "").trim();
      if (!ctx.active || ctx.dictationMode !== "speaking" || attemptCurrent !== ctx.current) {
        await stopSpeechRecording(true);
        state.speechStopRequested = false;
        updateSpeechCheckDisabled();
        return;
      }
      if (!completedTranscript) {
        renderSpeechResult("");
        const recordingUrl = await stopSpeechRecording(false);
        if (generation === state.speechStartGeneration && ctx.active && ctx.dictationMode === "speaking" && attemptCurrent === ctx.current && recordingUrl) {
          await playRecordedSpeech(recordingUrl, trimFinalGraceSilence);
        }
        if (generation !== state.speechStartGeneration || !ctx.active || ctx.dictationMode !== "speaking" || attemptCurrent !== ctx.current) {
          state.speechStopRequested = false;
          updateSpeechCheckDisabled();
          return;
        }
        if (!state.speechRecognitionError) setSpeechStatus("dictationSpeakNoSpeech");
        state.speechStopRequested = false;
        updateSpeechCheckDisabled();
        return;
      }
      const recordingUrl = await stopSpeechRecording(false);
      if (generation !== state.speechStartGeneration || !ctx.active || ctx.dictationMode !== "speaking" || attemptCurrent !== ctx.current) {
        clearRecordedSpeech();
        state.speechStopRequested = false;
        updateSpeechCheckDisabled();
        return;
      }
      ctx.ui.input.value = completedTranscript;
      renderSpeechResult(completedTranscript);
      const recordingPlayed = recordingUrl ? await playRecordedSpeech(recordingUrl, trimFinalGraceSilence) : false;
      if (generation !== state.speechStartGeneration || !ctx.active || ctx.dictationMode !== "speaking" || attemptCurrent !== ctx.current) {
        state.speechStopRequested = false;
        updateSpeechCheckDisabled();
        return;
      }
      const recordingFailed = !recordingUrl || !recordingAvailable || !recordingPlayed;
      state.speechStopRequested = false;
      updateSpeechCheckDisabled();
      setSpeechStatus("");
      ctx.submit();
      if (recordingFailed) setSpeechStatus("dictationSpeakRecordingUnavailable");
    }

    function scheduleSpeechEndpointGraceStop(resetTimer) {
      if (state.speechEndpointGraceTimer && !resetTimer) return;
      clearSpeechEndpointGraceTimer();
      state.speechEndpointGraceTimer = setTimeout(() => {
        state.speechEndpointGraceTimer = 0;
        if (speechAttemptFinalized || generation !== state.speechStartGeneration || !ctx.active
          || ctx.dictationMode !== "speaking" || attemptCurrent !== ctx.current) return;
        state.speechStopRequested = true;
        setSpeechStatus("dictationSpeakProcessing");
        const currentRecognition = state.speechRecognition;
        if (currentRecognition) {
          try { currentRecognition.stop(); return; }
          catch {
            if (state.speechRecognition === currentRecognition) state.speechRecognition = null;
          }
        }
        void finalizeSpeechAttempt(getCompletedSpeechTranscript());
      }, SPEECH_ENDPOINT_GRACE_MS);
    }

    function startRecognitionSession(existingRecognition = null) {
      const session = existingRecognition || new Recognition();
      let finalText = "";
      let interimText = "";
      state.speechRecognition = session;
      if (ctx.A?.state?.webStudy) {
        const sourceLanguage = ctx.A.state.webDetectedLanguage || ctx.A.state.webLanguageHint || globalThis.navigator?.language || "en-US";
        session.lang = globalThis.LHN_TTS?.normalizeLanguage?.(sourceLanguage) || sourceLanguage;
      } else {
        session.lang = /^en(?:-|$)/i.test(ctx.A?.state?.captionTrackLanguage || "")
          ? ctx.A.state.captionTrackLanguage : "en-US";
      }
      session.continuous = !(automatic || state.speechAutoRecordEnabled);
      session.interimResults = true;
      session.maxAlternatives = 1;
      state.speechStartPending = false;
      setSpeechStatus(recordingAvailable ? "dictationSpeakListening" : "dictationSpeakRecordingUnavailable");
      updateSpeechMicState(true);
      session.onresult = (event) => {
        const finals = [];
        const interims = [];
        for (let index = 0; index < event.results.length; index++) {
          const result = event.results[index];
          const text = String(result?.[0]?.transcript || "").trim();
          if (!text) continue;
          (result.isFinal ? finals : interims).push(text);
        }
        finalText = finals.join(" ").trim();
        interimText = interims.join(" ").trim();
        const segmentPreview = [finalText, interimText].filter(Boolean).join(" ");
        if (segmentPreview) {
          state.speechRecognitionError = "";
          if (state.speechAutoRecordEnabled) scheduleSpeechEndpointGraceStop(true);
        }
        const livePreview = [...completedSpeechSegments, finalText, interimText].filter(Boolean).join(" ");
        if (livePreview) renderSpeechResult(livePreview);
      };
      session.onerror = (event) => {
        const code = String(event?.error || "");
        state.speechRecognitionError = code === "not-allowed" || code === "service-not-allowed" || code === "audio-capture"
          ? "dictationSpeakDenied"
          : code === "network" ? "dictationSpeakNetwork"
            : code === "no-speech" ? "dictationSpeakNoSpeech"
              : code === "aborted" ? "" : "dictationSpeakError";
        if (["dictationSpeakDenied", "dictationSpeakNetwork", "dictationSpeakError"].includes(state.speechRecognitionError)) {
          state.speechStopRequested = true;
        }
        if (state.speechRecognitionError && ctx.ui) setSpeechStatus(state.speechRecognitionError);
      };
      session.onend = async () => {
        if (state.speechRecognition !== session) return;
        const segment = [finalText, interimText].filter(Boolean).join(" ").trim();
        const fatalError = ["dictationSpeakDenied", "dictationSpeakNetwork", "dictationSpeakError"].includes(state.speechRecognitionError);
        const canContinue = ctx.active && ctx.dictationMode === "speaking" && attemptCurrent === ctx.current;

        if (!automatic && !state.speechAutoRecordEnabled && !state.speechStopRequested && !fatalError && canContinue) {
          try {
            session.start();
            showSpeechResultPanel();
            showSpeechRecordingToast();
            setSpeechStatus(recordingAvailable ? "dictationSpeakListening" : "dictationSpeakRecordingUnavailable");
            updateSpeechMicState(true);
            return;
          } catch { state.speechRecognitionError = "dictationSpeakError"; }
        }

        if (state.speechAutoRecordEnabled && !state.speechStopRequested && !fatalError && canContinue) {
          if (segment) {
            completedSpeechSegments.push(segment);
            state.speechRecognitionError = "";
            scheduleSpeechEndpointGraceStop(true);
          } else {
            scheduleSpeechEndpointGraceStop(false);
          }
          state.speechRecognition = null;
          try {
            startRecognitionSession();
            return;
          } catch {
            state.speechRecognitionError = "dictationSpeakError";
            clearSpeechEndpointGraceTimer();
            state.speechStopRequested = false;
            await finalizeSpeechAttempt(getCompletedSpeechTranscript());
            return;
          }
        }

        if (segment) completedSpeechSegments.push(segment);
        const transcript = getCompletedSpeechTranscript();
        if (automatic && transcript && !state.speechStopRequested) {
          state.speechStopRequested = true;
          setSpeechStatus("dictationSpeakProcessing");
        }
        await finalizeSpeechAttempt(transcript);
      };
      try {
        session.start();
        showSpeechResultPanel();
        showSpeechRecordingToast();
      } catch (error) {
        if (state.speechRecognition === session) state.speechRecognition = null;
        throw error;
      }
    }

    try { startRecognitionSession(recognition); }
    catch {
      state.speechRecognition = null;
      state.speechStartPending = false;
      state.speechStopRequested = false;
      updateSpeechMicState(false);
      void stopSpeechRecording(true);
      setSpeechStatus("dictationSpeakError");
    }
  }

  function handleSpeakingEscape() {
    const cue = ctx.sentenceCues[ctx.current];
    if (!ctx.ui || !cue) return;
    stopSpeechRecognition(true);
    if (!state.speechAnswerRevealed) {
      state.speechAnswerRevealed = true;
      ctx.ui.input.value = cue.en;
      renderSpeechResult(cue.en);
      setSpeechTargetState("correct");
      setSpeechStatus("dictationSpeakAnswerRevealed");
      ctx.playSentence(ctx.current, { count: 1 });
      return;
    }
    state.speechAnswerRevealed = false;
    ctx.resetAnswer();
    clearRecordedSpeech();
    ctx.ui.speechTarget.textContent = cue.en;
    setSpeechTargetState("practice");
    ctx.ui.speechResult.replaceChildren();
    ctx.ui.speechResultWrap.hidden = true;
    setSpeechStatus("");
    ctx.prepareCue();
  }

    return Object.freeze({
      getSpeechScoreTier, setSpeechTargetState, setSpeechStatus, updateSpeechCheckDisabled,
      resetSpeechFeedback, getVietnameseSpeechCopy, setSpeechFeedback, shouldKeepVietnameseSpeechToast,
      dismissVietnameseSpeechToast, updateSpeechMicState, updateSpeechAutoRecordControl,
      updateSpeechMicPlaybackState, clearSpeechAutoStartTimer, clearSpeechEndpointGraceTimer,
      setSpeechAutoRecordEnabled, toggleSpeechAutoRecord, scheduleSpeechAutoRecord, clearRecordedSpeech,
      stopSpeechRecording, startSpeechRecording, pauseVideoForSpeech, playRecordedSpeech, stopSpeechRecognition,
      showSpeechResultPanel, renderSpeechResult, toggleSpeechRecognition, handleSpeakingEscape,
      get speechAutoRecordEnabled() { return state.speechAutoRecordEnabled; },
      get speechCueAutoStartPending() { return state.speechCueAutoStartPending; },
      set speechCueAutoStartPending(value) { state.speechCueAutoStartPending = value; },
      get speechAnswerRevealed() { return state.speechAnswerRevealed; },
      set speechAnswerRevealed(value) { state.speechAnswerRevealed = value; },
      get speechStartPending() { return state.speechStartPending; },
      get speechRecognition() { return state.speechRecognition; },
      get speechStopRequested() { return state.speechStopRequested; },
      get speechPlaybackAudio() { return state.speechPlaybackAudio; },
      get speechRecordingToastVisible() { return state.speechRecordingToastVisible; },
      set speechRecordingToastVisible(value) { state.speechRecordingToastVisible = value; },
      get lastSpeechFeedback() { return state.lastSpeechFeedback; },
    });
  },
});
