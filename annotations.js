(() => {
  const CONFIG = globalThis.LHN_CONFIG;
  const KEY = CONFIG.STORAGE_KEYS.ANNOTATIONS;
  const DB_NAME = CONFIG.DATABASE.NAME;
  const DB_VERSION = CONFIG.DATABASE.VERSION;
  const STORE_NAME = CONFIG.DATABASE.ANNOTATIONS_STORE;
  const MIGRATION_KEY = CONFIG.DATABASE.LEGACY_MIGRATION_KEY;
  let dbPromise, readyPromise;
  const requestResult = request => new Promise((resolve, reject) => { request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
  const transactionDone = tx => new Promise((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onabort = tx.onerror = () => reject(tx.error || new Error("IndexedDB transaction failed")); });const KEY = CONFIG.STORAGE_KEYS.ANNOTATIONS;
const DB_NAME = CONFIG.DATABASE.NAME;
const DB_VERSION = CONFIG.DATABASE.VERSION;
const STORE_NAME = CONFIG.DATABASE.ANNOTATIONS_STORE;
const MIGRATION_KEY = CONFIG.DATABASE.LEGACY_MIGRATION_KEY;
let dbPromise, readyPromise;
const requestResult = request => new Promise((resolve, reject) => { request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
const transactionDone = tx => new Promise((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onabort = tx.onerror = () => reject(tx.error || new Error("IndexedDB transaction failed")); });
const TTS_DB_NAME = "lhn-tts-audio-cache";
const TTS_STORE_NAME = "audio";
const TTS_CACHE_MAX_ENTRIES = 200;
const TTS_CACHE_TRIM_TRIGGER = 50;
const TTS_CACHE_TOUCH_INTERVAL = 6 * 60 * 60 * 1000;
let ttsDbPromise, ttsCacheBudgetPromise;
const ttsAudioRequests = new Map();
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
async function fetchTtsAudio(message) {
  const text = typeof message.text === "string" ? message.text.trim() : "";
  const language = typeof message.language === "string" ? message.language.trim().toLowerCase() : "";
  const voice = typeof message.voice === "string" ? message.voice.trim() : "";
  if (!text || !language || !voice || text.length > 500) throw new Error("Invalid or unsupported TTS request");
  const key = `${language}\n${voice}\n${text}`;
  const pending = ttsAudioRequests.get(key);
  if (pending) return pending;
  const request = (async () => {
    try { await ensureTtsAudioCacheBudget(); }
    catch (error) { console.warn("TTS audio cache budget check failed", error); }
    try {
      const cached = await getCachedTtsAudio(key);
      if (cached?.size) return { audioBase64: arrayBufferToBase64(await cached.arrayBuffer()), cached: true };
    } catch (error) { console.warn("TTS cache read failed; requesting fresh audio", error); }

    const usage = await USAGE_LIMITS.consume("googleTts");
    if (!usage.allowed) throw new Error("Google TTS daily usage limit reached");

    const params = new URLSearchParams({ ie: "UTF-8", q: text, tl: language, client: "tw-ob" });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    let blob;
    try {
      const response = await fetch(`https://translate.google.com/translate_tts?${params}`, { signal: controller.signal, credentials: "omit" });
      if (!response.ok) throw new Error(`Google TTS returned HTTP ${response.status}`);
      blob = await response.blob();
      if (!blob.size || (blob.type && !/^audio\//i.test(blob.type))) throw new Error("Google TTS returned no playable audio");
    } finally { clearTimeout(timeout); }
    try { await cacheTtsAudio(key, blob); } catch (error) { console.warn("TTS audio cache write failed", error); }
    return { audioBase64: arrayBufferToBase64(await blob.arrayBuffer()), cached: false };
  })();
  ttsAudioRequests.set(key, request);
  try { return await request; }
  finally { if (ttsAudioRequests.get(key) === request) ttsAudioRequests.delete(key); }
}
function openDatabase() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("url", "url", { unique: false });
        store.createIndex("createdAt", "createdAt", { unique: false });
        store.createIndex("updatedAt", "updatedAt", { unique: false });
      }
    };
    request.onsuccess = () => { request.result.onversionchange = () => request.result.close(); resolve(request.result); };
    request.onerror = () => { dbPromise = null; reject(request.error); };
    request.onblocked = () => { dbPromise = null; reject(new Error("Close other Highlight Notes windows to finish the database upgrade.")); };
  });
  return dbPromise;
}
async function ensureDatabaseReady() {
  if (readyPromise) return readyPromise;
  readyPromise = (async () => {
    const db = await openDatabase();
    const state = await browser.storage.local.get([KEY, MIGRATION_KEY]);
    if (state[MIGRATION_KEY]) { if (Array.isArray(state[KEY])) await browser.storage.local.remove(KEY); return db; }
    const legacy = Array.isArray(state[KEY]) ? state[KEY] : [];
    for (let offset = 0; offset < legacy.length; offset += CONFIG.LIMITS.DATABASE_BATCH_SIZE) {
      const tx = db.transaction(STORE_NAME, "readwrite"), store = tx.objectStore(STORE_NAME);
      for (const item of legacy.slice(offset, offset + CONFIG.LIMITS.DATABASE_BATCH_SIZE)) {
        if (!item || typeof item !== "object") continue;
        const migrated = { ...item, id: typeof item.id === "string" && item.id ? item.id : crypto.randomUUID() };
        store.put(migrated);
      }
      await transactionDone(tx);
      if (offset && offset % (CONFIG.LIMITS.DATABASE_BATCH_SIZE * 10) === 0) await new Promise(resolve => setTimeout(resolve, 0));
    }
    await browser.storage.local.set({ [MIGRATION_KEY]: true });
    if (Array.isArray(state[KEY])) await browser.storage.local.remove(KEY);
    return db;
  })().catch(error => { readyPromise = null; throw error; });
  return readyPromise;
}
async function getAll() {
  const db = await ensureDatabaseReady();
  return requestResult(db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).getAll());
}
async function getBatch({ after = null, limit = 500, url = null } = {}) {
  const db = await ensureDatabaseReady();
  const size = Math.max(1, Math.min(1000, Number(limit) || 500));
  const tx = db.transaction(STORE_NAME, "readonly"), store = tx.objectStore(STORE_NAME);
  const hasUrl = typeof url === "string" && !!url;
  const source = hasUrl ? store.index("url") : store;
  const range = hasUrl ? IDBKeyRange.only(url) : after !== null ? IDBKeyRange.lowerBound(String(after), true) : undefined;
  return new Promise((resolve, reject) => {
    const items = [];
    const request = source.openCursor(range);
    request.onerror = () => reject(request.error || new Error("Could not read annotation batch"));
    request.onsuccess = event => {
      const cursor = event.target.result;
      if (!cursor) { resolve({ items, nextAfter: items.at(-1)?.id || after, done: true }); return; }
      const id = String(cursor.primaryKey);
      if (hasUrl && after !== null && id <= String(after)) { cursor.continue(); return; }
      items.push(cursor.value);
      if (items.length >= size) { resolve({ items, nextAfter: id, done: false }); return; }
      cursor.continue();
    };
  });
}
async function getPage(url) {
  if (typeof url !== "string" || !url) return [];
  const db = await ensureDatabaseReady();
  const items = await requestResult(db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).index("url").getAll(url));
  return items.sort((a, b) => (Number(a.pageOrder) || Number(a.createdAt) || 0) - (Number(b.pageOrder) || Number(b.createdAt) || 0));
}
async function getOne(id) {
  if (typeof id !== "string" || !id) return null;
  const db = await ensureDatabaseReady();
  return requestResult(db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(id));
}
function notifyAnnotationsChanged(change = null, origin = null) {
  LHN_MESSAGING.sendMessage({ type: "ANNOTATIONS_CHANGED", change: change ? { ...change, origin } : null }).catch(() => {});
}
async function addOne(item) {
  const db = await ensureDatabaseReady(), now = Date.now();
  const saved = { ...item, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
  const tx = db.transaction(STORE_NAME, "readwrite"); tx.objectStore(STORE_NAME).add(saved); await transactionDone(tx); return saved;
}
async function updateOne(item) {
  if (!item || typeof item.id !== "string") throw new Error("Invalid annotation");
  const db = await ensureDatabaseReady();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite"), store = tx.objectStore(STORE_NAME);
    let updated = null;
    const request = store.get(item.id);
    request.onsuccess = () => { if (!request.result) return; updated = { ...request.result, ...item, updatedAt: Date.now() }; store.put(updated); };
    tx.oncomplete = () => updated ? resolve(updated) : reject(new Error("Annotation not found"));
    tx.onabort = tx.onerror = () => reject(tx.error || request.error || new Error("Could not update annotation"));
  });
}
async function updateReview(id, review) {
  const db = await ensureDatabaseReady();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite"), store = tx.objectStore(STORE_NAME);
    let updated = null;
    const request = store.get(id);
    request.onsuccess = () => { if (request.result) { updated = { ...request.result, review, updatedAt:Date.now() }; store.put(updated); } };
    tx.oncomplete = () => resolve(updated);
    tx.onabort = tx.onerror = () => reject(tx.error || request.error || new Error("Could not save review"));
  });
}
async function resetReviews(ids) {
  if (!ids.size) return 0;
  const db = await ensureDatabaseReady();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite"), store = tx.objectStore(STORE_NAME);
    let resetCount = 0;
    const updatedAt = Date.now();
    tx.oncomplete = () => resolve(resetCount);
    tx.onabort = tx.onerror = () => reject(tx.error || new Error("Could not reset study progress"));
    for (const id of ids) {
      const request = store.get(id);
      request.onsuccess = () => { const item = request.result; if (item?.review) { delete item.review; item.updatedAt = updatedAt; store.put(item); resetCount++; } };
    }
  });
}
async function deleteOne(id) {
  const db = await ensureDatabaseReady(), tx = db.transaction(STORE_NAME, "readwrite");
  tx.objectStore(STORE_NAME).delete(id); await transactionDone(tx); return { deleted: true };
}
async function deletePage(url) {
  if (typeof url !== "string" || !url) return { deletedCount: 0 };
  const db = await ensureDatabaseReady();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite"), index = tx.objectStore(STORE_NAME).index("url"); let deletedCount = 0;
    index.openCursor(IDBKeyRange.only(url)).onsuccess = event => {
      const cursor = event.target.result;
      if (!cursor) return;
      deletedCount++;
      cursor.delete(); cursor.continue();
    };
    tx.oncomplete = () => resolve({ deletedCount });
    tx.onabort = tx.onerror = () => reject(tx.error || new Error("Could not delete page annotations"));
  });
}
async function syncPageOrder(url, ids) {
  if (typeof url !== "string" || !Array.isArray(ids)) return { updated: 0 };
  const orderById = new Map(ids.filter(id => typeof id === "string").map((id, index) => [id, index]));
  if (!orderById.size) return { updated: 0 };
  const updatedAt = Date.now();
  const db = await ensureDatabaseReady();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite"), index = tx.objectStore(STORE_NAME).index("url"); let updated = 0;
    index.openCursor(IDBKeyRange.only(url)).onsuccess = event => {
      const cursor = event.target.result;
      if (!cursor) return;
      const pageOrder = orderById.get(cursor.value.id);
      if (pageOrder !== undefined && cursor.value.pageOrder !== pageOrder) { cursor.update({ ...cursor.value, pageOrder, updatedAt }); updated++; }
      cursor.continue();
    };
    tx.oncomplete = () => resolve({ updated });
    tx.onabort = tx.onerror = () => reject(tx.error || new Error("Could not save page order"));
  });
}
  async function importItems(items, origin = null) {
    if (!Array.isArray(items)) throw new Error("Invalid import file");
    const db = await ensureDatabaseReady(); let imported = 0;
    for (let offset = 0; offset < items.length; offset += CONFIG.LIMITS.DATABASE_BATCH_SIZE) {
      const end = Math.min(items.length, offset + CONFIG.LIMITS.DATABASE_BATCH_SIZE), batch = [];
      for (let index = offset; index < end; index++) { const item = items[index]; if (item && typeof item.quote === "string" && typeof item.url === "string") batch.push(item); }
      if (!batch.length) continue;
      const tx = db.transaction(STORE_NAME, "readwrite"), store = tx.objectStore(STORE_NAME), known = new Set();
      await new Promise((resolve, reject) => {
        tx.oncomplete = resolve; tx.onabort = tx.onerror = () => reject(tx.error || new Error("Import transaction failed"));
        batch.forEach(source => {
          let id = typeof source.id === "string" && source.id ? source.id : crypto.randomUUID();
          while (known.has(id)) id = crypto.randomUUID(); known.add(id);
          const existing = store.get(id);
          existing.onsuccess = () => { if (existing.result) id = crypto.randomUUID(); store.put({ ...source, id, importedAt: Date.now() }); imported++; };
        });
      });
    }
    if (imported) notifyAnnotationsChanged({ type: "refresh" }, origin);
    return { imported };
  }
  globalThis.LHN_ANNOTATIONS = Object.freeze({ getAll, getBatch, getPage, getOne, addOne, updateOne, updateReview, resetReviews, deleteOne, deletePage, syncPageOrder, importItems, notifyAnnotationsChanged });
})();