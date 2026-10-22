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

  // opts: text, lang, googleLanguage, voice, rate, isActive(), setCurrent(audio, url),
  //       clearCurrent(), systemSpeak(text, lang, done), onEnd()
  async function play(opts) {
    for (const chunk of splitChunks(opts.text)) {
      if (!opts.isActive()) return;
      let played = false;
      let url = null;
      try {
        const result = await api.runtime.sendMessage({ type: "FETCH_TTS_AUDIO", text: chunk, language: opts.googleLanguage, voice: opts.voice });
        if (!opts.isActive()) return;
        if (!(result?.audio instanceof ArrayBuffer) || result.audio.byteLength === 0) throw new Error("Google TTS returned empty audio");
        url = URL.createObjectURL(new Blob([result.audio], { type: "audio/mpeg" }));
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
