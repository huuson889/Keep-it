// On-demand, rate-limited Google Translate cache for flashcard sentence notes.
(() => {
  const ENDPOINT = "https://clients5.google.com/translate_a/t";
  const CACHE_PREFIX = "lhnSentenceTranslation:";
  const MAX_SOURCE_LENGTH = 5000;
  const REQUEST_TIMEOUT_MS = 10000;
  const MIN_REQUEST_INTERVAL_MS = 900;
  const FAILURE_RETRY_MS = 60000;

  function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

  async function cacheKey(source, sourceLanguage, targetLanguage) {
    const bytes = new TextEncoder().encode(source);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    const hash = Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, "0")).join("");
    // Keep the original Vietnamese key so existing saved translations remain usable.
    return sourceLanguage === "auto" && targetLanguage === "vi"
      ? `${CACHE_PREFIX}vi:${hash}`
      : `${CACHE_PREFIX}${targetLanguage}:${sourceLanguage}:${hash}`;
  }

  function translatedText(payload) {
    if (!Array.isArray(payload)) return "";
    if (payload.every(segment => typeof segment === "string")) return payload.join("").trim().normalize("NFC");
    const segments = Array.isArray(payload[0]?.[0]) ? payload[0] : payload;
    return segments.map(segment => typeof segment === "string" ? segment : Array.isArray(segment) && typeof segment[0] === "string" ? segment[0] : "").join("").trim().normalize("NFC");
  }

  function myMemoryText(payload) {
    if (payload?.responseStatus !== 200) return "";
    return String(payload.responseData?.translatedText || "").trim().normalize("NFC");
  }

  function myMemoryChunks(text, maxBytes = 450) {
    const encoder = new TextEncoder(), chunks = [];
    let chunk = "";
    for (const token of String(text).match(/\s+|\S+/gu) || []) {
      if (encoder.encode(token).length <= maxBytes && encoder.encode(chunk + token).length <= maxBytes) { chunk += token; continue; }
      if (chunk.trim()) chunks.push(chunk.trim());
      chunk = "";
      for (const character of token) {
        if (encoder.encode(chunk + character).length > maxBytes && chunk) { chunks.push(chunk); chunk = ""; }
        chunk += character;
      }
    }
    if (chunk.trim()) chunks.push(chunk.trim());
    return chunks;
  }

  function create({ browser, fetchImpl = fetch } = {}) {
    const memoryCache = new Map();
    const inFlight = new Map();
    const failedUntil = new Map();
    let activeJob = null, pendingJob = null, lastRequestAt = 0, cooldownUntil = 0;

    async function requestTranslation(source, sourceLanguage, targetLanguage) {
      const url = new URL(ENDPOINT);
      url.searchParams.set("client", "dict-chrome-ex");
      url.searchParams.set("sl", sourceLanguage);
      url.searchParams.set("tl", targetLanguage);
      url.searchParams.set("q", source);
      const googleController = new AbortController();
      let googleTimeout, fallbackTimeout;
      try {
        const usage = await browser.runtime.sendMessage({ type: "USAGE_CONSUME", service: "translate" });
        if (!usage?.allowed) throw new Error("Translate daily usage limit reached");
        googleTimeout = setTimeout(() => googleController.abort(), REQUEST_TIMEOUT_MS);
        try {
          const response = await fetchImpl(url.href, { method: "GET", signal: googleController.signal, headers: { Accept: "application/json" } });
          if (response.status === 429) {
            const retryAfter = Number(response.headers?.get?.("Retry-After")) || 0;
            cooldownUntil = Date.now() + Math.max(FAILURE_RETRY_MS, retryAfter * 1000);
          }
          if (!response.ok) {
            const error = new Error(`Google Translate returned HTTP ${response.status}`);
            error.status = response.status;
            throw error;
          }
          const result = translatedText(await response.json());
          if (!result) throw new Error("Google Translate returned an empty translation");
          return result;
        } catch (error) {
          console.warn("Google Translate failed; trying MyMemory fallback", error);
        }
        const fallbackSource = sourceLanguage === "auto" ? "autodetect" : sourceLanguage;
        const fallbackController = new AbortController();
        fallbackTimeout = setTimeout(() => fallbackController.abort(), REQUEST_TIMEOUT_MS);
        const fallbackParts = myMemoryChunks(source);
        const fallbackResults = await Promise.all(fallbackParts.map(async part => {
          const fallbackUrl = new URL("https://api.mymemory.translated.net/get");
          fallbackUrl.searchParams.set("q", part);
          fallbackUrl.searchParams.set("langpair", `${fallbackSource}|${targetLanguage}`);
          const response = await fetchImpl(fallbackUrl.href, { method: "GET", signal: fallbackController.signal, headers: { Accept: "application/json" } });
          if (!response.ok) throw new Error(`MyMemory returned HTTP ${response.status}`);
          const result = myMemoryText(await response.json());
          if (!result) throw new Error("MyMemory returned an empty translation");
          return result;
        }));
        return fallbackResults.join(" ").trim().normalize("NFC");
      } finally {
        clearTimeout(googleTimeout);
        clearTimeout(fallbackTimeout);
      }
    }

    function runPendingJob() {
      if (activeJob || !pendingJob) return;
      activeJob = pendingJob;
      pendingJob = null;
      const job = activeJob;
      (async () => {
        let result = null;
        try {
          if (Date.now() < cooldownUntil) return;
          const wait = MIN_REQUEST_INTERVAL_MS - (Date.now() - lastRequestAt);
          if (wait > 0) await sleep(wait);
          if (Date.now() < cooldownUntil) return;
          lastRequestAt = Date.now();
          result = await requestTranslation(job.source, job.sourceLanguage, job.targetLanguage);
          memoryCache.set(job.key, result);
          try { await browser.storage.local.set({ [job.key]: { source: job.source, translation: result, sourceLanguage: job.sourceLanguage, target: job.targetLanguage, savedAt: Date.now() } }); }
          catch (error) { console.warn("Could not persist sentence translation", error); }
        } catch (error) {
          failedUntil.set(job.key, Date.now() + FAILURE_RETRY_MS);
          console.warn("Could not translate flashcard sentence note", error);
        } finally {
          job.resolve(result);
          inFlight.delete(job.key);
          activeJob = null;
          runPendingJob();
        }
      })();
    }

    async function enqueue(sourceText, options = {}, prefetch = false) {
      const source = String(sourceText || "").trim();
      if (!source || source.length > MAX_SOURCE_LENGTH) return null;
      const sourceLanguage = ["auto", "en", "vi", "ko"].includes(options.sourceLanguage) ? options.sourceLanguage : "auto";
      const targetLanguage = ["en", "vi", "ko"].includes(options.targetLanguage) ? options.targetLanguage : "vi";
      const key = await cacheKey(source, sourceLanguage, targetLanguage);
      if (memoryCache.has(key)) return memoryCache.get(key);
      if (inFlight.has(key)) return inFlight.get(key);
      try {
        const stored = (await browser.storage.local.get(key))[key];
        if (stored?.source === source && stored?.target === targetLanguage && (!stored.sourceLanguage || stored.sourceLanguage === sourceLanguage) && typeof stored.translation === "string" && stored.translation.trim()) {
          memoryCache.set(key, stored.translation);
          return stored.translation;
        }
      } catch (error) { console.warn("Could not read sentence translation cache", error); }
      if ((failedUntil.get(key) || 0) > Date.now() || Date.now() < cooldownUntil) return null;

      let resolveJob;
      const promise = new Promise(resolve => { resolveJob = resolve; });
      const job = { key, source, sourceLanguage, targetLanguage, prefetch, resolve: resolveJob };
      inFlight.set(key, promise);
      if (pendingJob) {
        if (prefetch && !pendingJob.prefetch) { inFlight.delete(key); resolveJob(null); return null; }
        inFlight.delete(pendingJob.key);
        pendingJob.resolve(null);
      }
      pendingJob = job;
      runPendingJob();
      return promise;
    }

    function translate(source, options) { return enqueue(source, options, false); }
    function prefetch(source, options) { return enqueue(source, options, true); }
    return Object.freeze({ translate, prefetch });
  }

  globalThis.LHN_STUDY_TRANSLATION = Object.freeze({ create });
})();
