if (typeof importScripts === "function") {
  importScripts("browser-polyfill.js", "error-logger.js", "config.js", "usage-limits.js");
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
let ttsDbPromise;
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
async function getCachedTtsAudio(key) {
  const db = await openTtsDatabase();
  const tx = db.transaction(TTS_STORE_NAME, "readonly");
  const result = await requestResult(tx.objectStore(TTS_STORE_NAME).get(key));
  return result?.audio instanceof Blob ? result.audio : null;
}
async function cacheTtsAudio(key, audio) {
  const db = await openTtsDatabase();
  const tx = db.transaction(TTS_STORE_NAME, "readwrite");
  tx.objectStore(TTS_STORE_NAME).put({ key, audio, cachedAt: Date.now() });
  await transactionDone(tx);
}
async function fetchTtsAudio(message) {
  const text = typeof message.text === "string" ? message.text.trim() : "";
  const language = typeof message.language === "string" ? message.language.trim().toLowerCase() : "";
  const voice = typeof message.voice === "string" ? message.voice.trim() : "";
  if (!text || !language || !voice || text.length > 500) throw new Error("Invalid or unsupported TTS request");
  const key = `${language}\n${voice}\n${text}`;
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
  const source = typeof url === "string" && url ? store.index("url") : store;
  const range = typeof url === "string" && url ? IDBKeyRange.only(url) : undefined;
  return new Promise((resolve, reject) => {
    const items = [];
    const request = source.openCursor(range);
    request.onerror = () => reject(request.error || new Error("Could not read annotation batch"));
    request.onsuccess = event => {
      const cursor = event.target.result;
      if (!cursor) { resolve({ items, nextAfter: items.at(-1)?.id || after, done: true }); return; }
      const id = String(cursor.primaryKey);
      if (after !== null && id <= String(after)) { cursor.continue(); return; }
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
  browser.runtime.sendMessage({ type: "ANNOTATIONS_CHANGED", change: change ? { ...change, origin } : null }).catch(() => {});
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
const BILINGUAL_CACHE_KEY = "lhnBilingualReaderTranslationCache";
const BILINGUAL_CACHE_TTL = 7 * 24 * 60 * 60 * 1000;
async function bilingualFetch(url) {
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 2500);
  try { return await fetch(url, { signal:controller.signal }); } finally { clearTimeout(timer); }
}
async function translateBilingual(text, targetLang) {
  const cacheData = await browser.storage.local.get(BILINGUAL_CACHE_KEY), cache = cacheData[BILINGUAL_CACHE_KEY] || {};
  const key = `${targetLang}:${text}`;
  if (cache[key]?.expires > Date.now()) return cache[key].value;
  const engines = [
    async () => { const r = await bilingualFetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`); if (!r.ok) throw Error(); const d = await r.json(); const value = Array.isArray(d?.[0]) ? d[0].map(row => row?.[0] || "").join("") : ""; if (!value) throw Error(); return { translated:value, detectedLang:d?.[2] || "" }; },
    async () => { const r = await bilingualFetch(`https://translate.googleapis.com/translate_a/t?client=dict-chrome-ex&sl=auto&tl=${targetLang}&q=${encodeURIComponent(text)}`); if (!r.ok) throw Error(); const d = await r.json(); const value = Array.isArray(d) ? (typeof d[0] === "string" ? d[0] : Array.isArray(d[0]) ? d[0].map(row => Array.isArray(row) ? row[0] || "" : "").join("") : "") : d?.sentences?.map(s => s.trans).join(""); if (!value) throw Error(); return { translated:value }; },
    async () => { const r = await bilingualFetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=autodetect%7C${targetLang}`); if (!r.ok) throw Error(); const d = await r.json(); if (!d?.responseData?.translatedText) throw Error(); return { translated:d.responseData.translatedText, detectedLang:d.responseData.detectedLanguage || "" }; },
    async () => { let error; for (const base of ["https://lingva.ml", "https://lingva.thedaviddelta.com"]) { try { const r = await bilingualFetch(`${base}/api/v1/auto/${targetLang}/${encodeURIComponent(text)}`); if (!r.ok) throw Error(); const d = await r.json(); if (!d?.translation) throw Error(); return { translated:d.translation, detectedLang:d.info?.detectedSource || "" }; } catch (e) { error=e; } } throw error || Error(); }
  ];
  let entry;
  for (const engine of engines) { try { entry = await engine(); if (entry?.translated) break; } catch {} }
  if (!entry) entry = { translated:`[Translation (${targetLang.toUpperCase()})]: ${text}`, fallback:true };
  cache[key] = { value:entry, expires:Date.now() + BILINGUAL_CACHE_TTL };
  for (const cachedKey of Object.keys(cache)) if (cache[cachedKey]?.expires <= Date.now()) delete cache[cachedKey];
  await browser.storage.local.set({ [BILINGUAL_CACHE_KEY]:cache });
  return entry;
}
async function detectReadLanguageRemote(text) {
  try {
    const sample = String(text || "").slice(0, 200);
    if (!/[\p{Script=Latin}]/u.test(sample)) return { detectedLang:"" };
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(sample)}`;
    const response = await bilingualFetch(url);
    if (!response.ok) return { detectedLang:"" };
    const data = await response.json();
    return { detectedLang:String(data?.[2] || "") };
  } catch { return { detectedLang:"" }; }
}
browser.runtime.onMessage.addListener(async (message, sender) => {
  if (!message || !message.type) return;
  if (message.type === "LHN_ERROR_LOG") return globalThis.LHN_ERROR_LOGGER?.append(message.entry);
  if (message.type === "DETECT_READ_LANGUAGE") return detectReadLanguageRemote(message.text);
  if (message.type === "BILINGUAL_TRANSLATE") { const targetLang = String(message.targetLang || "").trim(); return translateBilingual(String(message.text || ""), /^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i.test(targetLang) ? targetLang : "en"); }
  if (message.type === "BILINGUAL_CLEAR_CACHE") { await browser.storage.local.remove(BILINGUAL_CACHE_KEY); return { cleared:true }; }
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
    const incoming = message.items.filter(x => x && typeof x.quote === "string" && typeof x.url === "string");
    let imported = 0;
    for (let offset = 0; offset < incoming.length; offset += CONFIG.LIMITS.DATABASE_BATCH_SIZE) {
      const tx = db.transaction(STORE_NAME, "readwrite"), store = tx.objectStore(STORE_NAME), batch = incoming.slice(offset, offset + CONFIG.LIMITS.DATABASE_BATCH_SIZE);
      const known = new Set(); let pending = batch.length;
      if (!pending) { await transactionDone(tx); continue; }
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
