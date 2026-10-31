(() => {
  const CACHE_KEY = "lhnBilingualReaderTranslationCache";
  const CACHE_PREFIX = `${CACHE_KEY}:v2:item:`;
  const READY_KEY = `${CACHE_KEY}:v2:ready`;
  const CLEANUP_KEY = `${CACHE_KEY}:v2:lastCleanup`;
  const COUNT_KEY = `${CACHE_KEY}:v2:count`;
  const TTL = 7 * 24 * 60 * 60 * 1000;
  const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000;
  const MAX_ENTRIES = 500;
  const VIDEO_TRANSCRIPT_CACHE_PREFIX = "lhnYouTubeTranscriptCache:v1:item:";
  const VIDEO_TRANSCRIPT_MAX_VIDEOS = 20;
  const TRIM_TRIGGER = 50;
  const TOUCH_INTERVAL = 6 * 60 * 60 * 1000;
  let preparation, entryCount = 0;
  let writeQueue = Promise.resolve();

  function hashCacheKey(cacheKey) {
    let hash = 14695981039346656037n;
    for (let index = 0; index < cacheKey.length; index++) {
      hash ^= BigInt(cacheKey.charCodeAt(index));
      hash = BigInt.asUintN(64, hash * 1099511628211n);
    }
    return hash.toString(16).padStart(16, "0");
  }

  function storageKey(cacheKey) {
    return `${CACHE_PREFIX}${hashCacheKey(cacheKey)}`;
  }

  function videoTranscriptStorageKey(videoId) {
    return `${VIDEO_TRANSCRIPT_CACHE_PREFIX}${hashCacheKey(videoId)}`;
  }

  function lastUsedAt(entry) {
    return Number(entry?.lastUsedAt) || Number(entry?.createdAt) || (Number(entry?.expires) - TTL) || 0;
  }

  function enqueueWrite(operation) {
    const queued = writeQueue.then(operation, operation);
    writeQueue = queued.catch(() => {});
    return queued;
  }

  async function prune(now = Date.now()) {
    const stored = await browser.storage.local.get(null);
    const entries = Object.keys(stored).filter(key => key.startsWith(CACHE_PREFIX)).map(key => ({ key, entry:stored[key] }));
    const expired = entries.filter(({ entry }) => !Number.isFinite(entry?.expires) || entry.expires <= now);
    if (expired.length) await browser.storage.local.remove(expired.map(({ key }) => key));
    const active = entries.filter(({ entry }) => Number.isFinite(entry?.expires) && entry.expires > now);
    active.sort((a, b) => lastUsedAt(a.entry) - lastUsedAt(b.entry));
    const evicted = active.slice(0, Math.max(0, active.length - MAX_ENTRIES));
    if (evicted.length) await browser.storage.local.remove(evicted.map(({ key }) => key));
    entryCount = active.length - evicted.length;
    await browser.storage.local.set({ [COUNT_KEY]:entryCount });
    return entryCount;
  }

  async function saveEntry(key, entry) {
    return enqueueWrite(async () => {
      const stored = await browser.storage.local.get([key, COUNT_KEY]);
      const previous = stored[key];
      const savedCount = Number(stored[COUNT_KEY]);
      const count = (Number.isFinite(savedCount) ? savedCount : entryCount) + (previous ? 0 : 1);
      await browser.storage.local.set({ [key]:entry, [COUNT_KEY]:count });
      entryCount = count;
      if (count > MAX_ENTRIES + TRIM_TRIGGER) await prune(Date.now());
    });
  }

  async function prepare(now = Date.now()) {
    if (!preparation) {
      preparation = (async () => {
        const metadata = await browser.storage.local.get([READY_KEY, CLEANUP_KEY, COUNT_KEY]);
        const ready = metadata[READY_KEY] === true;
        if (!ready) await browser.storage.local.remove(CACHE_KEY);
        const lastCleanup = Number(metadata[CLEANUP_KEY]) || 0;
        const savedCount = Number(metadata[COUNT_KEY]);
        const valuesToSet = {};
        if (!ready || now - lastCleanup >= CLEANUP_INTERVAL || !Number.isFinite(savedCount)) {
          await prune(now);
          await pruneVideoTranscriptCache(now);
          valuesToSet[CLEANUP_KEY] = now;
        } else entryCount = savedCount;
        if (!ready) valuesToSet[READY_KEY] = true;
        if (Object.keys(valuesToSet).length) await browser.storage.local.set(valuesToSet);
      })();
    }
    try { await preparation; }
    catch (error) { preparation = null; throw error; }
  }

  async function getBilingualTranslation(key, options = {}) {
    if (!options.prepared) await prepare();
    const storageKeyValue = storageKey(key);
    const stored = await browser.storage.local.get(storageKeyValue), cached = stored[storageKeyValue];
    const now = Date.now();
    if (cached?.cacheKey !== key || !Number.isFinite(cached.expires) || cached.expires <= now || cached.value?.fallback) return null;
    if (now - lastUsedAt(cached) >= TOUCH_INTERVAL) {
      await saveEntry(storageKeyValue, { ...cached, lastUsedAt:now, expires:now + TTL });
    }
    return cached.value;
  }

  async function saveBilingualTranslation(key, value) {
    const now = Date.now();
    return saveEntry(storageKey(key), { cacheKey:key, value, createdAt:now, lastUsedAt:now, expires:now + TTL });
  }

  async function pruneVideoTranscriptCache(now = Date.now()) {
    const stored = await browser.storage.local.get(null);
    const entries = Object.keys(stored)
      .filter(key => key.startsWith(VIDEO_TRANSCRIPT_CACHE_PREFIX))
      .map(key => ({ key, entry:stored[key] }));
    const active = entries.filter(({ entry }) =>
      typeof entry?.cacheKey === "string" && Number.isFinite(entry.expires) && entry.expires > now &&
      entry.value?.variants && typeof entry.value.variants === "object");
    const activeKeys = new Set(active.map(({ key }) => key));
    const invalid = entries.filter(({ key }) => !activeKeys.has(key));
    if (invalid.length) await browser.storage.local.remove(invalid.map(({ key }) => key));
    active.sort((a, b) => lastUsedAt(a.entry) - lastUsedAt(b.entry));
    const evicted = active.slice(0, Math.max(0, active.length - VIDEO_TRANSCRIPT_MAX_VIDEOS));
    if (evicted.length) await browser.storage.local.remove(evicted.map(({ key }) => key));
    return active.length - evicted.length;
  }

  function validVideoTranscriptEntry(entry, videoId, now = Date.now()) {
    return entry?.cacheKey === videoId && Number.isFinite(entry.expires) && entry.expires > now &&
      entry.value?.variants && typeof entry.value.variants === "object";
  }

  async function getVideoTranscript(videoId, variantKey) {
    if (typeof videoId !== "string" || !videoId || typeof variantKey !== "string" || !variantKey) return null;
    await prepare();
    const key = videoTranscriptStorageKey(videoId);
    return enqueueWrite(async () => {
      const now = Date.now();
      await pruneVideoTranscriptCache(now);
      const stored = await browser.storage.local.get(key), entry = stored[key];
      if (!validVideoTranscriptEntry(entry, videoId, now)) {
        if (entry) await browser.storage.local.remove(key);
        return null;
      }
      const variant = entry.value.variants[variantKey];
      if (!Array.isArray(variant?.cues) || !variant.cues.length) return null;
      await browser.storage.local.set({ [key]:{ ...entry, lastUsedAt:now, expires:now + TTL } });
      return variant;
    });
  }

  async function touchVideoTranscript(videoId, variantKey) {
    if (typeof videoId !== "string" || !videoId || typeof variantKey !== "string" || !variantKey) return false;
    await prepare();
    const key = videoTranscriptStorageKey(videoId);
    return enqueueWrite(async () => {
      const now = Date.now();
      await pruneVideoTranscriptCache(now);
      const stored = await browser.storage.local.get(key), entry = stored[key];
      if (!validVideoTranscriptEntry(entry, videoId, now) || !Array.isArray(entry.value.variants[variantKey]?.cues)) return false;
      await browser.storage.local.set({ [key]:{ ...entry, lastUsedAt:now, expires:now + TTL } });
      return true;
    });
  }

  async function saveVideoTranscript(videoId, variantKey, transcript) {
    if (typeof videoId !== "string" || !videoId || typeof variantKey !== "string" || !variantKey ||
        !Array.isArray(transcript?.cues) || !transcript.cues.length) return false;
    await prepare();
    const key = videoTranscriptStorageKey(videoId);
    return enqueueWrite(async () => {
      const stored = await browser.storage.local.get(key), previous = stored[key], now = Date.now();
      const variants = validVideoTranscriptEntry(previous, videoId, now)
        ? { ...previous.value.variants }
        : {};
      variants[variantKey] = {
        cues:transcript.cues,
        captionTrackLanguage:typeof transcript.captionTrackLanguage === "string" ? transcript.captionTrackLanguage : "",
      };
      await browser.storage.local.set({
        [key]:{
          cacheKey:videoId,
          value:{ variants },
          createdAt:validVideoTranscriptEntry(previous, videoId, now) ? previous.createdAt : now,
          lastUsedAt:now,
          expires:now + TTL,
        },
      });
      await pruneVideoTranscriptCache(now);
      return true;
    });
  }

  async function clearBilingualTranslationCache() {
    return enqueueWrite(async () => {
      const stored = await browser.storage.local.get(null);
      const keys = Object.keys(stored).filter(key => key === CACHE_KEY || key.startsWith(CACHE_PREFIX));
      if (keys.length) await browser.storage.local.remove(keys);
      entryCount = 0;
      await browser.storage.local.set({ [COUNT_KEY]:0 });
      return { cleared:true };
    });
  }

  const TTS_DB_NAME = 'lhn-tts-audio-cache';
  const TTS_STORE_NAME = 'audio';
  const TTS_CACHE_MAX_ENTRIES = 200;
  const TTS_CACHE_TRIM_TRIGGER = 50;
  const TTS_CACHE_TOUCH_INTERVAL = 6 * 60 * 60 * 1000;
  let ttsDbPromise, ttsCacheBudgetPromise;
  const requestResult = request => new Promise((resolve, reject) => { request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
  const transactionDone = tx => new Promise((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onabort = tx.onerror = () => reject(tx.error || new Error('IndexedDB transaction failed')); });
function openTtsDatabase() {
  if (ttsDbPromise) return ttsDbPromise;
  ttsDbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(TTS_DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(TTS_STORE_NAME)) request.result.createObjectStore(TTS_STORE_NAME, { keyPath: "key" });
    };
    request.onsuccess = () => { request.result.onversionchange = () => request.result.close(); resolve(request.result); };
    request.onerror = () => { ttsDbPromise = null; reject(request.error); };
  });
  return ttsDbPromise;
}
async function trimTtsAudioCache() {
  const db = await openTtsDatabase();
  const tx = db.transaction(TTS_STORE_NAME, "readwrite"), store = tx.objectStore(TTS_STORE_NAME);
  const allEntries = await requestResult(store.getAll());
  const entries = [];
  for (const entry of allEntries) {
    if (!entry || typeof entry.key !== "string" || !(entry.audio instanceof Blob)) { if (entry?.key) store.delete(entry.key); continue; }
    entries.push(entry);
  }
  entries.sort((a, b) => (Number(a.lastUsedAt) || Number(a.cachedAt) || 0) - (Number(b.lastUsedAt) || Number(b.cachedAt) || 0));
  for (const entry of entries.slice(0, Math.max(0, entries.length - TTS_CACHE_MAX_ENTRIES))) store.delete(entry.key);
  await transactionDone(tx);
}
async function trimTtsAudioCacheIfNeeded() {
  const db = await openTtsDatabase();
  const count = await requestResult(db.transaction(TTS_STORE_NAME, "readonly").objectStore(TTS_STORE_NAME).count());
  if (count > TTS_CACHE_MAX_ENTRIES + TTS_CACHE_TRIM_TRIGGER) await trimTtsAudioCache();
}
async function ensureTtsAudioCacheBudget() {
  if (!ttsCacheBudgetPromise) {
    ttsCacheBudgetPromise = trimTtsAudioCacheIfNeeded().catch(error => { ttsCacheBudgetPromise = null; throw error; });
  }
  return ttsCacheBudgetPromise;
}
async function getCachedTtsAudio(key) {
  const db = await openTtsDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TTS_STORE_NAME, "readwrite"), store = tx.objectStore(TTS_STORE_NAME);
    let audio = null;
    const request = store.get(key);
    request.onsuccess = () => {
      const entry = request.result, now = Date.now();
      if (entry?.audio instanceof Blob) {
        audio = entry.audio;
        const lastUsedAt = Number(entry.lastUsedAt) || Number(entry.cachedAt) || 0;
        if (now - lastUsedAt >= TTS_CACHE_TOUCH_INTERVAL) store.put({ ...entry, lastUsedAt:now });
      }
    };
    tx.oncomplete = () => resolve(audio);
    tx.onabort = tx.onerror = () => reject(tx.error || request.error || new Error("Could not read TTS cache"));
  });
}
async function cacheTtsAudio(key, audio) {
  const db = await openTtsDatabase(), cachedAt = Date.now();
  const tx = db.transaction(TTS_STORE_NAME, "readwrite");
  tx.objectStore(TTS_STORE_NAME).put({ key, audio, cachedAt, lastUsedAt:cachedAt });
  await transactionDone(tx);
  try { await trimTtsAudioCacheIfNeeded(); }
  catch (error) { console.warn("TTS audio cache LRU cleanup failed", error); }
}

  globalThis.LHN_CACHE = Object.freeze({ prepareBilingualCache:prepare, getBilingualTranslation, saveBilingualTranslation, clearBilingualTranslationCache, getVideoTranscript, saveVideoTranscript, touchVideoTranscript, ensureTtsAudioCacheBudget, getCachedTtsAudio, cacheTtsAudio });
})();