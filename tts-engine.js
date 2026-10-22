// Bộ phát TTS dùng chung cho content.js và dashboard.js.
// Chia đoạn dài, phát Google TTS nối tiếp, lỗi đoạn nào thì đọc đoạn đó bằng giọng trình duyệt.
(() => {
  const api = typeof browser !== "undefined" ? browser : chrome;
  const MAX_CHUNK = 180;

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

  async function preferBrowserVoice() {
    const settingsKey = globalThis.LHN_CONFIG?.STORAGE_KEYS?.SETTINGS || "lhnSettings";
    try {
      const data = await api.storage.local.get(settingsKey);
      return data[settingsKey]?.speechVoice === "browser";
    } catch { return false; }
  }

  async function playWithBrowserVoice(opts) {
    for (const chunk of splitChunks(opts.text)) {
      if (!opts.isActive()) return;
      await new Promise(resolve => {
        let finished = false;
        const done = () => { if (finished) return; finished = true; resolve(); };
        try { opts.systemSpeak(chunk, opts.lang, done); } catch { done(); }
      });
    }
    if (opts.isActive()) opts.onEnd?.();
  }

  // opts: text, lang, googleLanguage, voice, rate, isActive(), setCurrent(audio, url),
  //       clearCurrent(), systemSpeak(text, lang, done), onEnd()
  async function play(opts) {
    if (await preferBrowserVoice()) {
      await playWithBrowserVoice(opts);
      return;
    }
    for (const chunk of splitChunks(opts.text)) {
      if (!opts.isActive()) return;
      let played = false;
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
        console.warn("Google TTS chunk failed; using browser speech for this chunk", error);
      } finally {
        if (url) URL.revokeObjectURL(url);
        opts.clearCurrent();
      }
      if (!played) {
        if (!opts.isActive()) return;
        await new Promise(resolve => opts.systemSpeak(chunk, opts.lang, resolve));
      }
    }
    if (opts.isActive()) opts.onEnd?.();
  }

  globalThis.LHN_TTS = Object.freeze({ splitChunks, play });
})();
