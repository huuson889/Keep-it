(() => {
  const CACHE_KEY = "lhnBilingualReaderTranslationCache";
  const CACHE_PREFIX = `${CACHE_KEY}:v2:item:`;
  const READY_KEY = `${CACHE_KEY}:v2:ready`;
  const CLEANUP_KEY = `${CACHE_KEY}:v2:lastCleanup`;
  const COUNT_KEY = `${CACHE_KEY}:v2:count`;
  const TTL = 7 * 24 * 60 * 60 * 1000;
  const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000;
  const MAX_ENTRIES = 500;
  const TRIM_TRIGGER = 50;
  const TOUCH_INTERVAL = 6 * 60 * 60 * 1000;
  let preparation, entryCount = 0;
  let writeQueue = Promise.resolve();

  function storageKey(cacheKey) {
    let hash = 14695981039346656037n;
    for (let index = 0; index < cacheKey.length; index++) {
      hash ^= BigInt(cacheKey.charCodeAt(index));
      hash = BigInt.asUintN(64, hash * 1099511628211n);
    }
    return `${CACHE_PREFIX}${hash.toString(16).padStart(16, "0")}`;
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
  globalThis.LHN_CACHE = Object.freeze({ prepareBilingualCache:prepare, getBilingualTranslation, saveBilingualTranslation, clearBilingualTranslationCache, ensureTtsAudioCacheBudget, getCachedTtsAudio, cacheTtsAudio });
})();