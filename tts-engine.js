// Bộ phát TTS dùng chung cho content.js và dashboard.js.
// Chia đoạn dài, phát Google TTS nối tiếp, lỗi đoạn nào thì đọc đoạn đó bằng giọng trình duyệt.
(() => {
  const api = typeof browser !== "undefined" ? browser : chrome;
  const MAX_CHUNK = 180;
  const SETTINGS_KEY = globalThis.LHN_CONFIG?.STORAGE_KEYS?.SETTINGS || "lhnSettings";
  const READER_SETTINGS_KEY = "lhnBilingualReaderSettings";
  const VI_WORDS = new Set(["và","của","là","các","trong","được","cho","với","này","đã","ngày","khi","một","từ","không","người","tại","bằng","sẽ","những","để","có","theo","về","đang","con","mèo","chạy","nhanh"]);
  const EN_WORDS = new Set(["the","and","to","of","in","is","that","for","with","on","as","by","from","was","are","has","have","this","which","be","it","he","she","they","an","a","but","or","will"]);
  const LATIN_MARKS = [
    ["tr-TR", /[ğışĞŞİı]/g], ["ro-RO", /[șțȘȚ]/g], ["pl-PL", /[łąęśźżćń]/gi],
    ["es-ES", /[ñ¿¡]/gi], ["de-DE", /[ßäöü]/gi], ["pt-BR", /[ãõ]/gi],
    ["vi-VN", /[ạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹđơưă]/gi]
  ];
  const LANGUAGE_TAGS = Object.freeze({ en:"en-US", ja:"ja-JP", ko:"ko-KR", zh:"zh-CN", es:"es-ES", pt:"pt-BR", fr:"fr-FR", vi:"vi-VN", id:"id-ID", th:"th-TH", hi:"hi-IN", it:"it-IT", pl:"pl-PL", uk:"uk-UA", ru:"ru-RU", tr:"tr-TR", de:"de-DE", fa:"fa-IR", bn:"bn-BD", tl:"tl-PH", ro:"ro-RO" });
  const detectionCache = new Map(), detectionRequests = new Map();

  function detectReadLanguage(text) {
    const str = String(text || "");
    if (!str.trim()) return null;
    if (/[\uAC00-\uD7AF]/.test(str)) return "ko-KR";
    if (/[\u3040-\u30FF]/.test(str)) return "ja-JP";
    if (/[\u4E00-\u9FFF]/.test(str)) return "zh-CN";
    if (/[\u0E00-\u0E7F]/.test(str)) return "th-TH";
    if (/[\u0985-\u09B9]/.test(str)) return "bn-BD"; // chữ cái Bengali
    if (/[\u0905-\u0939]/.test(str)) return "hi-IN"; // chữ cái Devanagari (Hindi)
    if (/[іїєґ]/i.test(str)) return "uk-UA";
    if (/[\u0400-\u04FF]/.test(str)) return "ru-RU";
    if (/[پچژگ]/.test(str)) return "fa-IR";
    let best = null, bestCount = 0;
    for (const [lang, pattern] of LATIN_MARKS) {
      const count = (str.match(pattern) || []).length;
      if (count > bestCount) { best = lang; bestCount = count; }
    }
    if (best) return best;
    let vi = 0, en = 0;
    for (const token of str.toLowerCase().match(/[\p{L}]+/gu) || []) {
      if (VI_WORDS.has(token)) vi++;
      if (EN_WORDS.has(token)) en++;
    }
    if (vi >= 2 && vi > en) return "vi-VN";
    if (en >= 2 && en > vi) return "en-US";
    return null;
  }

  function normalizeLanguage(value) {
    const declared = String(value || "").trim().replace(/_/g, "-");
    if (!declared) return "";
    return LANGUAGE_TAGS[declared.split("-")[0].toLowerCase()] || declared;
  }

  function fallbackLanguage(value) {
    return normalizeLanguage(value) || normalizeLanguage(globalThis.navigator?.language) || "en-US";
  }

  function hashText(text) {
    let hash = 2166136261;
    for (let index = 0; index < text.length; index++) hash = Math.imul(hash ^ text.charCodeAt(index), 16777619);
    return `${text.length}-${(hash >>> 0).toString(16)}`;
  }

  async function detectLanguage(text, fallbackLang) {
    const direct = detectReadLanguage(text);
    if (direct) return direct;
    const fallback = fallbackLanguage(fallbackLang);
    const sample = String(text || "").trim().slice(0, 200);
    if (!sample || !/\p{Script=Latin}/u.test(sample) || !/^[\p{Script=Latin}\p{M}\p{N}\p{P}\p{Z}\p{S}]*$/u.test(sample)) return fallback;
    const key = hashText(sample);
    let detected = detectionCache.get(key);
    if (detected === undefined) {
      let pending = detectionRequests.get(key);
      if (!pending) {
        pending = Promise.resolve().then(() => api.runtime.sendMessage({ type:"DETECT_READ_LANGUAGE", text:sample }))
          .then(result => String(result?.detectedLang || "").trim().toLowerCase().split(/[-_]/)[0])
          .catch(() => "")
          .then(value => {
            detectionCache.set(key, value);
            if (detectionCache.size > 500) detectionCache.delete(detectionCache.keys().next().value);
            return value;
          }).finally(() => detectionRequests.delete(key));
        detectionRequests.set(key, pending);
      }
      detected = await pending;
    }
    return LANGUAGE_TAGS[detected] || fallback;
  }

  async function getVoiceSettings() {
    const data = await api.storage.local.get([SETTINGS_KEY, READER_SETTINGS_KEY]);
    const shared = data[SETTINGS_KEY] || {}, reader = data[READER_SETTINGS_KEY] || {};
    let voiceMode = shared.voiceMode;
    let browserVoiceURI = String(shared.browserVoiceURI || "");
    if (voiceMode !== "google" && voiceMode !== "browser") {
      browserVoiceURI = String(reader.speechVoiceURI || "");
      voiceMode = browserVoiceURI || shared.speechVoice === "browser" ? "browser" : "google";
      await api.storage.local.set({ [SETTINGS_KEY]:{ ...shared, voiceMode, browserVoiceURI, speechVoice:voiceMode } }).catch(() => {});
    }
    if (voiceMode === "browser" && !browserVoiceURI && reader.speechVoiceURI) {
      browserVoiceURI = String(reader.speechVoiceURI);
      await api.storage.local.set({ [SETTINGS_KEY]:{ ...shared, voiceMode, browserVoiceURI, speechVoice:voiceMode } }).catch(() => {});
    }
    return { voiceMode, browserVoiceURI, readLanguage:voiceMode === "google" ? cleanReadLanguage(shared.readLanguage) : "" };
  }

  function cleanReadLanguage(value) {
    const code = String(value || "").trim().replace(/_/g, "-").split("-")[0].toLowerCase();
    return LANGUAGE_TAGS[code] ? code : "";
  }

  async function setVoiceSettings(voiceMode, browserVoiceURI = "", readLanguage = "") {
    const mode = voiceMode === "browser" ? "browser" : "google";
    const data = await api.storage.local.get(SETTINGS_KEY);
    const shared = data[SETTINGS_KEY] || {};
    const next = { ...shared, voiceMode:mode, browserVoiceURI:mode === "browser" ? String(browserVoiceURI || "") : "", readLanguage:mode === "google" ? cleanReadLanguage(readLanguage) : "", speechVoice:mode };
    await api.storage.local.set({ [SETTINGS_KEY]:next });
    return { voiceMode:mode, browserVoiceURI:next.browserVoiceURI, readLanguage:next.readLanguage };
  }

  function splitChunks(text, max = MAX_CHUNK) {
    const out = [];
    let rest = String(text || "").trim();
    while (rest.length > max) {
      const w = rest.slice(0, max);
      const punct = Math.max(w.lastIndexOf(". "), w.lastIndexOf("? "), w.lastIndexOf("! "), w.lastIndexOf("; "), w.lastIndexOf(", "));
      const space = w.lastIndexOf(" ");
      const cut = punct > max * 0.4 ? punct + 1 : (space > max * 0.4 ? space : max);
      out.push(rest.slice(0, cut).trim());
      rest = rest.slice(cut).trim();
    }
    if (rest) out.push(rest);
    return out.filter(Boolean);
  }

  async function playWithBrowserVoice(opts) {
    for (const chunk of splitChunks(opts.text)) {
      if (!opts.isActive()) return;
      const result = await new Promise(resolve => {
        let finished = false;
        const done = status => { if (finished) return; finished = true; resolve(status); };
        try { opts.systemSpeak(chunk, opts.lang, done, opts.browserVoiceURI); } catch { done(); }
      });
      if (result?.unsupported) {
        opts.onBrowserVoiceUnavailable?.(opts.lang);
        if (opts.isActive()) opts.onEnd?.();
        return;
      }
    }
    if (opts.isActive()) opts.onEnd?.();
  }

  // opts: text, lang, googleLanguage, voice, rate, isActive(), setCurrent(audio, url),
  //       clearCurrent(), systemSpeak(text, lang, done), onEnd(),
  //       strictVoice (thử lại Google 3 lần, chỉ chuyển giọng trình duyệt khi hết lượt), onGoogleVoiceFailed(error), onGoogleLimitReached(),
  //       onGoogleAudioSlow(error) (mỗi lần tải/phát âm thanh Google lỗi, trừ lỗi hết lượt)
  async function play(opts) {
    let voiceSettings = { voiceMode:"google", browserVoiceURI:"" };
    try { voiceSettings = await getVoiceSettings(); } catch {}
    if (voiceSettings.voiceMode === "browser") {
      await playWithBrowserVoice({ ...opts, browserVoiceURI:voiceSettings.browserVoiceURI });
      return;
    }
    let limitNotified = false;
    for (const chunk of splitChunks(opts.text)) {
      if (!opts.isActive()) return;
      let played = false, limitReached = false, lastError = null;
      const maxAttempts = opts.strictVoice ? 3 : 1;
      for (let attempt = 0; attempt < maxAttempts && !played && !limitReached; attempt++) {
        if (attempt) { await new Promise(resolve => setTimeout(resolve, attempt * 500)); if (!opts.isActive()) return; }
        let url = null;
        try {
          const result = await api.runtime.sendMessage({ type: "FETCH_TTS_AUDIO", text: chunk, language: opts.googleLanguage, voice: opts.voice });
          if (!opts.isActive()) return;
          if (!result?.audioBase64) throw new Error("Google TTS returned empty audio");
          const bin = atob(result.audioBase64);
          const bytes = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
          url = URL.createObjectURL(new Blob([bytes], { type: "audio/mpeg" }));
          const audio = new Audio(url);
          audio.playbackRate = typeof opts.rate === "function" ? opts.rate() : (opts.rate || 1);
          opts.setCurrent(audio, url);
          if (opts.waitIfPaused) { const wait = opts.waitIfPaused(); if (wait) await wait; if (!opts.isActive()) return; }
          await new Promise((resolve, reject) => {
            audio.onended = resolve;
            audio.onerror = () => reject(new Error("Audio chunk could not be played"));
            audio.play().catch(reject);
          });
          played = true;
        } catch (error) {
          lastError = error;
          limitReached = /usage limit/i.test(String(error?.message || error));
          if (!limitReached && opts.isActive()) opts.onGoogleAudioSlow?.(error);
          console.warn(opts.strictVoice && !limitReached ? "Google TTS chunk failed" : "Google TTS chunk failed; using browser speech for this chunk", error);
        } finally {
          if (url) URL.revokeObjectURL(url);
          opts.clearCurrent();
        }
      }
      // strictVoice: giọng Google đã chọn thì không tự đổi sang giọng trình duyệt, trừ khi hết lượt (key).
      if (!played && limitReached && opts.strictVoice && !limitNotified) { limitNotified = true; opts.onGoogleLimitReached?.(); }
      if (!played && opts.strictVoice && !limitReached) {
        if (!opts.isActive()) return;
        opts.onGoogleVoiceFailed?.(lastError);
        if (opts.isActive()) opts.onEnd?.();
        return;
      }
      if (!played) {
        if (!opts.isActive()) return;
        const result = await new Promise(resolve => opts.systemSpeak(chunk, opts.lang, resolve));
        if (result?.unsupported) {
          opts.onBrowserVoiceUnavailable?.(opts.lang);
          if (opts.isActive()) opts.onEnd?.();
          return;
        }
      }
    }
    if (opts.isActive()) opts.onEnd?.();
  }

  globalThis.LHN_TTS = Object.freeze({ splitChunks, play, detectReadLanguage, detectLanguage, getVoiceSettings, setVoiceSettings, normalizeLanguage });
})();
