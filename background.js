if (typeof importScripts === "function") {
  importScripts("browser-polyfill.js", "messaging.js", "error-logger.js", "config.js", "settings.js", "cache.js", "translate.js", "usage-limits.js");
}
const CONFIG = globalThis.LHN_CONFIG;
const USAGE_LIMITS = globalThis.LHN_USAGE_LIMITS.create({ browser });
browser.runtime.onInstalled.addListener(() => USAGE_LIMITS.initialize().catch(error => console.warn("Could not initialize local usage trial", error)));
const KEY = CONFIG.STORAGE_KEYS.ANNOTATIONS;
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
async function openDashboard(openSettings = false, openAccount = false, settingsTab = "account") {
  const dashboardUrl = browser.runtime.getURL("dashboard.html");
  const settingsUrl = `${dashboardUrl}?openSettings=1${openAccount ? "&openAccount=1" : ""}${settingsTab !== "account" ? `&openSettingsTab=${encodeURIComponent(settingsTab)}` : ""}`;
  const [tabs, activeTabs] = await Promise.all([
    browser.tabs.query({}),
    browser.tabs.query({ active: true, currentWindow: true })
  ]);
  const existing = tabs.find(tab => tab.url?.split(/[?#]/, 1)[0] === dashboardUrl);
  if (!existing) return browser.tabs.create({ url: openSettings ? settingsUrl : dashboardUrl });
  const activeTab = activeTabs[0];
  if (activeTab?.id !== existing.id) {
    await browser.tabs.update(existing.id, { active: true });
  }
  if (activeTab?.windowId !== existing.windowId) {
    await browser.windows.update(existing.windowId, { focused: true });
  }
  if (openSettings) {
    try { await browser.tabs.sendMessage(existing.id, { type: settingsTab === "bilingualReader" ? "OPEN_DASHBOARD_BILINGUAL_SETTINGS" : openAccount ? "OPEN_DASHBOARD_ACCOUNT" : "OPEN_DASHBOARD_SETTINGS" }); }
    catch { return browser.tabs.update(existing.id, { url: settingsUrl, active: true }); }
  }
  return existing;
}
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function openHighlight(url, id) {
  if (typeof url !== "string" || !/^https?:\/\//i.test(url) || typeof id !== "string" || !id) return { found: false };
  const tabs = await browser.tabs.query({});
  let tab = tabs.find(candidate => candidate.url === url);
  if (tab) {
    await browser.windows.update(tab.windowId, { focused: true });
    tab = await browser.tabs.update(tab.id, { active: true });
  } else tab = await browser.tabs.create({ url, active: true });
  if (!tab?.id) return { found: false };
  for (let attempt = 0; attempt < 48; attempt++) {
    try {
      const result = await browser.tabs.sendMessage(tab.id, { type: "JUMP_TO_HIGHLIGHT", id });
      if (result?.found) return result;
    } catch { /* wait until the tab's content script is ready */ }
    await delay(250);
  }
  return { found: false };
}
LHN_MESSAGING.onMessage.addListener(async (message, sender) => {
  if (!message || !message.type) return;
  if (message.type === "LHN_ERROR_LOG") return globalThis.LHN_ERROR_LOGGER?.append(message.entry);
  if (message.type === "DETECT_READ_LANGUAGE") return LHN_TRANSLATE.detectReadLanguageRemote(message.text);
  if (message.type === "BILINGUAL_TRANSLATE") { const targetLang = String(message.targetLang || "").trim(); return LHN_TRANSLATE.translateBilingual(String(message.text || ""), /^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i.test(targetLang) ? targetLang : "en"); }
  if (message.type === "BILINGUAL_CLEAR_CACHE") return LHN_CACHE.clearBilingualTranslationCache();
  if (message.type === "USAGE_STATUS") return USAGE_LIMITS.status();
  if (message.type === "USAGE_ACTIVATE_KEY") return USAGE_LIMITS.activate(message.key);
  if (message.type === "USAGE_CONSUME") return USAGE_LIMITS.consume(message.service);
  if (message.type === "FETCH_TTS_AUDIO") return fetchTtsAudio(message);
  if (message.type === "OPEN_DASHBOARD") return openDashboard();
  if (message.type === "OPEN_DASHBOARD_SETTINGS") return openDashboard(true);
  if (message.type === "OPEN_DASHBOARD_ACCOUNT") return openDashboard(true, true);
 if (message.type === "OPEN_DASHBOARD_BILINGUAL_SETTINGS") return openDashboard(true, false, "bilingualReader");
  if (message.type === "OPEN_HIGHLIGHT") return openHighlight(message.url, message.id);
  if (message.type === "GET_ALL") return getAll();
  if (message.type === "GET_BATCH") return getBatch(message);
  if (message.type === "GET_PAGE") return getPage(message.url);
  if (message.type === "GET_ONE") return getOne(message.id);
  if (message.type === "ADD") { const saved = await addOne(message.item || {}); notifyAnnotationsChanged({ type: "upsert", item: saved }, message.origin); return saved; }
  if (message.type === "UPDATE") { const saved = await updateOne(message.item); notifyAnnotationsChanged({ type: "upsert", item: saved }, message.origin); return saved; }
  if (message.type === "REVIEW_ANNOTATION") {
    if (typeof message.id !== "string" || !message.review || typeof message.review !== "object") return { updated: false };
    const item = await updateReview(message.id, message.review);
    if (item) notifyAnnotationsChanged({ type:"upsert", item }, message.origin);
    return { updated: Boolean(item), item };
  }
  if (message.type === "RESET_STUDY_PROGRESS") {
    const ids = new Set(Array.isArray(message.ids) ? message.ids.filter(id => typeof id === "string") : []);
    if (!ids.size) return { updated: true, resetCount: 0 };
    const resetCount = await resetReviews(ids);
    if (resetCount) notifyAnnotationsChanged({ type:"refresh" }, message.origin);
    return { updated: true, resetCount };
  }
  if (message.type === "DELETE") { const result = await deleteOne(message.id); notifyAnnotationsChanged({ type: "delete", id: message.id }, message.origin); return result; }
  if (message.type === "DELETE_PAGE") { const result = await deletePage(message.url); if (result.deletedCount) notifyAnnotationsChanged({ type: "deletePage", url: message.url }, message.origin); return result; }
  if (message.type === "IMPORT") {
    if (!Array.isArray(message.items)) throw new Error("Invalid import file");
    const db = await ensureDatabaseReady();
    let imported = 0;
    for (let offset = 0; offset < message.items.length; offset += CONFIG.LIMITS.DATABASE_BATCH_SIZE) {
      const end = Math.min(message.items.length, offset + CONFIG.LIMITS.DATABASE_BATCH_SIZE), batch = [];
      for (let index = offset; index < end; index++) {
        const item = message.items[index];
        if (item && typeof item.quote === "string" && typeof item.url === "string") batch.push(item);
      }
      if (!batch.length) continue;
      const tx = db.transaction(STORE_NAME, "readwrite"), store = tx.objectStore(STORE_NAME);
      const known = new Set(); let pending = batch.length;
      await new Promise((resolve, reject) => {
        tx.oncomplete = resolve; tx.onabort = tx.onerror = () => reject(tx.error || new Error("Import transaction failed"));
        batch.forEach(source => {
          let id = typeof source.id === "string" && source.id ? source.id : crypto.randomUUID();
          while (known.has(id)) id = crypto.randomUUID();
          known.add(id);
          const existing = store.get(id);
          existing.onsuccess = () => {
            if (existing.result) id = crypto.randomUUID();
            store.put({ ...source, id, importedAt: Date.now() }); imported++; pending--;
          };
        });
      });
    }
    if (imported) notifyAnnotationsChanged({ type: "refresh" }, message.origin);
    return { imported };
  }
  if (message.type === "SYNC_PAGE_ORDER") return syncPageOrder(message.url, message.ids);
  if (message.type === "EXPORT") return getAll();
});

// Chrome only: request Google TTS từ extension bị 404 nếu thiếu Referer.
// Thêm Referer giống trang Google, chỉ áp dụng cho translate_tts. Firefox không dùng rule này.
(() => {
  const isChrome = typeof chrome !== "undefined" && chrome.declarativeNetRequest && !/Firefox\//.test(navigator.userAgent);
  if (!isChrome) return;
  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [9001],
    addRules: [{
      id: 9001,
      priority: 1,
      action: { type: "modifyHeaders", requestHeaders: [{ header: "Referer", operation: "set", value: "https://translate.google.com/" }] },
      condition: { urlFilter: "||translate.google.com/translate_tts", resourceTypes: ["xmlhttprequest", "media", "other"] }
    }]
  }).catch(err => console.warn("TTS referer rule failed", err));
})();

// Chrome gửi message qua JSON nên ArrayBuffer bị mất; trả audio dạng base64 để dùng được trên cả hai trình duyệt.
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}
