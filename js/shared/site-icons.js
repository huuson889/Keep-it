(() => {
  const CACHE_KEY = "keepit:site-icon-cache:v1";
  const CACHE_TTL = 30 * 24 * 60 * 60 * 1000;
  const NEGATIVE_CACHE_TTL = 6 * 60 * 60 * 1000;
  const MAX_CACHE_ENTRIES = 256;
  const cache = new Map();
  const pendingOrigins = new Map();
  const tabIcons = new Map();
  const activeImages = new WeakMap();
  let cacheReady = null;
  let writeTimer = 0;
  let storageListenerAttached = false;

  function browserApi() {
    const scopes = [];
    try { scopes.push(globalThis); } catch {}
    try { if (window.parent && window.parent !== window) scopes.push(window.parent); } catch {}
    for (const scope of scopes) {
      try {
        if (scope.browser?.storage?.local) return { api:scope.browser, promise:true };
        if (scope.chrome?.storage?.local) return { api:scope.chrome, promise:false };
      } catch {}
    }
    return null;
  }
  function originFrom(value) {
    try {
      const url = new URL(String(value || ""));
      return ["http:", "https:"].includes(url.protocol) ? url.origin : "";
    } catch { return ""; }
  }
  function candidatesForOrigin(origin) {
    const safeOrigin = originFrom(origin);
    if (!safeOrigin) return [];
    return [
      `${safeOrigin}/favicon.svg`,
      `${safeOrigin}/apple-touch-icon.png`,
      `${safeOrigin}/apple-touch-icon-precomposed.png`,
      `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(safeOrigin)}&sz=128`,
      `${safeOrigin}/favicon.ico`,
      `${safeOrigin}/favicon.png`,
    ];
  }
  function safeCachedUrl(value, origin) {
    const url = String(value || "");
    if (candidatesForOrigin(origin).includes(url)) return url;
    try {
      const parsed = new URL(url);
      return ["http:", "https:"].includes(parsed.protocol) && parsed.origin === origin && !parsed.username && !parsed.password ? parsed.href : "";
    } catch { return ""; }
  }
  async function openTabIconForOrigin(origin) {
    const cached = tabIcons.get(origin);
    if (cached && cached.expiresAt > Date.now()) return cached.url;
    const current = browserApi();
    if (!current?.api?.tabs?.query) return "";
    let iconUrl = "";
    try {
      const tabs = await storageCall(current.api.tabs.query.bind(current.api.tabs), { url:`${origin}/*` }, current.promise);
      const tab = (Array.isArray(tabs) ? tabs : []).find(item => originFrom(item?.url) === origin && item?.favIconUrl);
      if (tab) iconUrl = safeCachedUrl(tab.favIconUrl, origin);
    } catch {}
    tabIcons.set(origin, { url:iconUrl, expiresAt:Date.now() + 30_000 });
    return iconUrl;
  }
  async function candidateListForOrigin(origin) {
    const tabIcon = await openTabIconForOrigin(origin);
    return [...new Set([tabIcon, ...candidatesForOrigin(origin)].filter(Boolean))];
  }
  function parseEntries(value) {
    const now = Date.now();
    const entries = value && typeof value === "object" && !Array.isArray(value) ? value : {};
    for (const [origin, entry] of Object.entries(entries)) {
      const expiresAt = Number(entry?.expiresAt);
      if (originFrom(origin) !== origin || !entry || typeof entry !== "object" || !Number.isFinite(expiresAt) || expiresAt <= now) continue;
      const url = entry.url ? safeCachedUrl(entry.url, origin) : "";
      if (entry.url && !url) continue;
      cache.set(origin, { url, expiresAt, usedAt:Number(entry.usedAt) || now });
    }
    pruneCache();
  }
  function attachStorageListener(api) {
    if (storageListenerAttached || !api?.storage?.onChanged?.addListener) return;
    storageListenerAttached = true;
    api.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== "local" || !Object.prototype.hasOwnProperty.call(changes || {}, CACHE_KEY)) return;
      cache.clear();
      parseEntries(changes[CACHE_KEY]?.newValue);
      cacheReady = Promise.resolve();
    });
  }
  function storageCall(method, argument, promiseApi) {
    if (promiseApi) {
      try { return Promise.resolve(method(argument)); }
      catch { return Promise.resolve(null); }
    }
    return new Promise(resolve => {
      try { method(argument, value => resolve(value || null)); }
      catch { resolve(null); }
    });
  }
  async function ensureCache() {
    if (cacheReady) return cacheReady;
    cacheReady = (async () => {
      const current = browserApi();
      if (!current) return;
      attachStorageListener(current.api);
      const result = await storageCall(current.api.storage.local.get.bind(current.api.storage.local), CACHE_KEY, current.promise);
      parseEntries(result?.[CACHE_KEY]);
    })().catch(() => {});
    return cacheReady;
  }
  function pruneCache() {
    const now = Date.now();
    for (const [origin, entry] of cache) if (entry.expiresAt <= now) cache.delete(origin);
    while (cache.size > MAX_CACHE_ENTRIES) cache.delete(cache.keys().next().value);
  }
  async function persistCache() {
    const current = browserApi();
    if (!current) return;
    pruneCache();
    const area = current.api.storage.local;
    const stored = await storageCall(area.get.bind(area), CACHE_KEY, current.promise);
    const merged = new Map();
    const now = Date.now();
    const remoteEntries = stored?.[CACHE_KEY];
    if (remoteEntries && typeof remoteEntries === "object" && !Array.isArray(remoteEntries)) {
      for (const [origin, entry] of Object.entries(remoteEntries)) {
        if (!entry || typeof entry !== "object") continue;
        const expiresAt = Number(entry.expiresAt);
        const url = entry.url ? safeCachedUrl(entry.url, origin) : "";
        if (originFrom(origin) === origin && Number.isFinite(expiresAt) && expiresAt > now && (!entry.url || url)) {
          merged.set(origin, { url, expiresAt, usedAt:Number(entry.usedAt) || now });
        }
      }
    }
    for (const [origin, entry] of cache) merged.set(origin, entry);
    const bounded = [...merged.entries()].sort((a, b) => a[1].usedAt - b[1].usedAt).slice(-MAX_CACHE_ENTRIES);
    const updates = Object.fromEntries(bounded);
    await storageCall(area.set.bind(area), { [CACHE_KEY]:updates }, current.promise);
  }
  function schedulePersist() {
    clearTimeout(writeTimer);
    writeTimer = setTimeout(() => {
      writeTimer = 0;
      void persistCache().catch(() => {});
    }, 100);
  }
  function writeEntry(origin, url) {
    cache.delete(origin);
    cache.set(origin, {
      url,
      expiresAt:Date.now() + (url ? CACHE_TTL : NEGATIVE_CACHE_TTL),
      usedAt:Date.now(),
    });
    pruneCache();
    schedulePersist();
  }
  function removeEntry(origin) {
    cache.delete(origin);
    schedulePersist();
  }
  function probe(url) {
    return new Promise(resolve => {
      let settled = false;
      const image = new Image();
      image.referrerPolicy = "no-referrer";
      const finish = loaded => {
        if (settled) return;
        settled = true;
        image.onload = null;
        image.onerror = null;
        resolve(Boolean(loaded));
      };
      image.onload = () => finish(image.naturalWidth > 0);
      image.onerror = () => finish(false);
      image.src = url;
      if (image.complete) queueMicrotask(() => finish(image.naturalWidth > 0));
    });
  }
  async function resolveIcon(origin, excluded = new Set()) {
    await ensureCache();
    const cached = cache.get(origin);
    if (cached && cached.expiresAt > Date.now()) {
      if (!cached.url) return "";
      const cachedUrl = safeCachedUrl(cached.url, origin);
      if (cachedUrl && !excluded.has(cachedUrl)) {
        cache.delete(origin);
        cache.set(origin, { ...cached, usedAt:Date.now() });
        return cachedUrl;
      }
      if (!cachedUrl || excluded.has(cachedUrl)) removeEntry(origin);
    }
    if (!excluded.size && pendingOrigins.has(origin)) return pendingOrigins.get(origin);
    const work = (async () => {
      for (const candidate of await candidateListForOrigin(origin)) {
        if (excluded.has(candidate)) continue;
        if (await probe(candidate)) {
          writeEntry(origin, candidate);
          return candidate;
        }
      }
      writeEntry(origin, "");
      return "";
    })();
    if (excluded.size) return work;
    pendingOrigins.set(origin, work);
    try { return await work; }
    finally { if (pendingOrigins.get(origin) === work) pendingOrigins.delete(origin); }
  }
  function loadInto(image, url, state) {
    return new Promise(resolve => {
      let settled = false;
      const finish = loaded => {
        if (settled) return;
        settled = true;
        image.removeEventListener("load", onLoad);
        image.removeEventListener("error", onError);
        if (activeImages.get(image) === state) state.cancel = null;
        resolve(Boolean(loaded));
      };
      const onLoad = () => finish(image.naturalWidth > 0);
      const onError = () => finish(false);
      state.cancel = () => finish(false);
      image.referrerPolicy = "no-referrer";
      image.addEventListener("load", onLoad);
      image.addEventListener("error", onError);
      image.src = url;
      if (image.complete && image.naturalWidth > 0) queueMicrotask(onLoad);
    });
  }
  function showFallback(image, fallbackElement, onError) {
    image.hidden = true;
    if (fallbackElement) fallbackElement.hidden = false;
    if (typeof onError === "function") onError();
  }
  async function load(image, pageUrl, { fallbackElement = null, onError = null } = {}) {
    if (!image || typeof image.addEventListener !== "function") return "";
    activeImages.get(image)?.cancel?.();
    const state = { token:Symbol("site-icon"), cancel:null };
    activeImages.set(image, state);
    image.hidden = true;
    if (fallbackElement) fallbackElement.hidden = false;
    const origin = originFrom(pageUrl);
    if (!origin) {
      showFallback(image, fallbackElement, onError);
      return "";
    }
    const excluded = new Set();
    while (activeImages.get(image) === state) {
      const url = await resolveIcon(origin, excluded);
      if (!url || !safeCachedUrl(url, origin)) break;
      const loaded = await loadInto(image, url, state);
      if (activeImages.get(image) !== state) return "";
      if (loaded) {
        image.hidden = false;
        if (fallbackElement) fallbackElement.hidden = true;
        return url;
      }
      excluded.add(url);
      removeEntry(origin);
    }
    if (activeImages.get(image) === state) showFallback(image, fallbackElement, onError);
    return "";
  }

  window.LHN_SITE_ICONS = Object.freeze({ load, cacheKey:CACHE_KEY });
})();
