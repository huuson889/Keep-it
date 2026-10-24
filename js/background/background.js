if (typeof importScripts === "function") {
  importScripts("browser-polyfill.js", "messaging.js", "error-logger.js", "config.js", "settings.js", "cache.js", "translate.js", "usage-limits.js", "annotations.js");
}
const CONFIG = globalThis.LHN_CONFIG;
const USAGE_LIMITS = globalThis.LHN_USAGE_LIMITS.create({ browser });
browser.runtime.onInstalled.addListener(() => USAGE_LIMITS.initialize().catch(error => console.warn("Could not initialize local usage trial", error)));
const ANNOTATIONS = globalThis.LHN_ANNOTATIONS;
const ttsAudioRequests = new Map();
async function fetchTtsAudio(message) {
  const text = typeof message.text === "string" ? message.text.trim() : "";
  const language = typeof message.language === "string" ? message.language.trim().toLowerCase() : "";
  const voice = typeof message.voice === "string" ? message.voice.trim() : "";
  if (!text || !language || !voice || text.length > 500) throw new Error("Invalid or unsupported TTS request");
  const key = `${language}\n${voice}\n${text}`;
  const pending = ttsAudioRequests.get(key);
  if (pending) return pending;
  const request = (async () => {
    try { await LHN_CACHE.ensureTtsAudioCacheBudget(); }
    catch (error) { console.warn("TTS audio cache budget check failed", error); }
    try {
      const cached = await LHN_CACHE.getCachedTtsAudio(key);
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
    try { await LHN_CACHE.cacheTtsAudio(key, blob); } catch (error) { console.warn("TTS audio cache write failed", error); }
    return { audioBase64: arrayBufferToBase64(await blob.arrayBuffer()), cached: false };
  })();
  ttsAudioRequests.set(key, request);
  try { return await request; }
  finally { if (ttsAudioRequests.get(key) === request) ttsAudioRequests.delete(key); }
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
  if (message.type === "GET_ALL") return ANNOTATIONS.getAll();
  if (message.type === "GET_BATCH") return ANNOTATIONS.getBatch(message);
  if (message.type === "GET_PAGE") return ANNOTATIONS.getPage(message.url);
  if (message.type === "GET_ONE") return ANNOTATIONS.getOne(message.id);
  if (message.type === "ADD") { const saved = await ANNOTATIONS.addOne(message.item || {}); ANNOTATIONS.notifyAnnotationsChanged({ type: "upsert", item: saved }, message.origin); return saved; }
  if (message.type === "UPDATE") { const saved = await ANNOTATIONS.updateOne(message.item); ANNOTATIONS.notifyAnnotationsChanged({ type: "upsert", item: saved }, message.origin); return saved; }
  if (message.type === "REVIEW_ANNOTATION") {
    if (typeof message.id !== "string" || !message.review || typeof message.review !== "object") return { updated: false };
    const item = await ANNOTATIONS.updateReview(message.id, message.review);
    if (item) ANNOTATIONS.notifyAnnotationsChanged({ type:"upsert", item }, message.origin);
    return { updated: Boolean(item), item };
  }
  if (message.type === "RESET_STUDY_PROGRESS") {
    const ids = new Set(Array.isArray(message.ids) ? message.ids.filter(id => typeof id === "string") : []);
    if (!ids.size) return { updated: true, resetCount: 0 };
    const resetCount = await ANNOTATIONS.resetReviews(ids);
    if (resetCount) ANNOTATIONS.notifyAnnotationsChanged({ type:"refresh" }, message.origin);
    return { updated: true, resetCount };
  }
  if (message.type === "DELETE") { const result = await ANNOTATIONS.deleteOne(message.id); ANNOTATIONS.notifyAnnotationsChanged({ type: "delete", id: message.id }, message.origin); return result; }
  if (message.type === "DELETE_PAGE") { const result = await ANNOTATIONS.deletePage(message.url); if (result.deletedCount) ANNOTATIONS.notifyAnnotationsChanged({ type: "deletePage", url: message.url }, message.origin); return result; }
  if (message.type === "IMPORT") return ANNOTATIONS.importItems(message.items, message.origin);
  if (message.type === "SYNC_PAGE_ORDER") return ANNOTATIONS.syncPageOrder(message.url, message.ids);
  if (message.type === "EXPORT") return ANNOTATIONS.getAll();
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