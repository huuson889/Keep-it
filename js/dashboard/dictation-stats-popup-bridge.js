(() => {
  const trigger = document.getElementById("dictationDetailedStatsBtn");
  const frame = document.getElementById("dictationStatsPopupFrame");
  if (!trigger || !frame) return;

  const storage = globalThis.browser?.storage?.local;
  const INDEX_KEY = "dictation:session-index:v1";
  let openSequence = 0;
  let snapshotRequest = 0;
  let popupReadySequence = 0;
  let refreshPending = false;
  let refreshTimer = 0;
  let returnFocus = null;
  let lastReportedDark = document.documentElement.classList.contains("dark");

  function safeCount(value) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(0, Math.floor(number)) : 0;
  }
  function safeWord(value) {
    const word = String(value || "").trim();
    return word && (word.match(/\p{L}/gu) || []).length >= 4 ? word : "";
  }
  function sessionTitle(record, metadata, sourceId) {
    const usableTitle = value => {
      const title = String(value || "").trim();
      return title && title !== sourceId && !/^(youtube|keepit|dictation)$/i.test(title) ? title : "";
    };
    const recordTitle = usableTitle(record?.title);
    const indexTitle = usableTitle(metadata?.title);
    const recordTitleAt = safeCount(record?.titleUpdatedAt);
    const indexTitleAt = safeCount(metadata?.updatedAt);
    if (recordTitle && recordTitleAt > indexTitleAt) return recordTitle;
    return indexTitle || recordTitle || sourceId;
  }
  async function openYouTubeTitles(sourceIds) {
    const titles = new Map();
    const wanted = new Set(sourceIds);
    if (!wanted.size || !globalThis.browser?.tabs?.query) return titles;
    try {
      const tabs = await globalThis.browser.tabs.query({ url:["*://*.youtube.com/*", "*://youtube.com/*", "*://youtu.be/*"] });
      for (const tab of Array.isArray(tabs) ? tabs : []) {
        try {
          const url = new URL(String(tab?.url || ""));
          const host = url.hostname.toLocaleLowerCase();
          if (!(host === "youtu.be" || host === "youtube.com" || host.endsWith(".youtube.com"))) continue;
          const sourceId = host === "youtu.be" ? url.pathname.split("/").filter(Boolean)[0] : url.searchParams.get("v");
          if (!wanted.has(sourceId)) continue;
          const title = String(tab?.title || "").replace(/^\s*Keepit\s*-\s*/i, "").replace(/\s*[-|]\s*YouTube\s*$/i, "").trim().slice(0, 240);
          if (title && title !== sourceId && !/^(youtube|keepit|dictation)$/i.test(title)) titles.set(sourceId, title);
        } catch {}
      }
    } catch {}
    return titles;
  }
  function normalizeSessionWords(stats) {
    if (!stats || stats.version !== 3 || !stats.words || typeof stats.words !== "object") return [];
    return Object.values(stats.words).flatMap(item => {
      if (!item || typeof item !== "object") return [];
      const word = safeWord(item.word);
      const errors = safeCount(item.errors);
      if (!word || !errors) return [];
      const variants = Object.values(item.variants && typeof item.variants === "object" ? item.variants : {})
        .map(variant => ({
          text:String(variant?.text || "").trim(), count:safeCount(variant?.count),
          typeCounts:Object.fromEntries(["phonetic", "rule", "typo"].map(type => [type, safeCount(variant?.typeCounts?.[type])])),
        })).filter(variant => variant.text && variant.count);
      const typeCounts = {}, typeFixes = {}, errorExamples = {};
      for (const type of ["phonetic", "rule", "typo"]) {
        typeCounts[type] = safeCount(item.typeCounts?.[type]);
        typeFixes[type] = safeCount(item.typeFixes?.[type]);
        const example = item.errorExamples?.[type];
        if (example && typeof example === "object" && typeof example.typed === "string") errorExamples[type] = {
          before:String(example.before || ""), typed:example.typed, after:String(example.after || ""), lastAt:safeCount(example.lastAt),
        };
      }
      const errorContext = item.errorContext && typeof item.errorContext === "object" ? {
        before:String(item.errorContext.before || ""), typed:String(item.errorContext.typed || ""), after:String(item.errorContext.after || ""),
      } : null;
      return [{
        word,
        errors,
        fixes:safeCount(item.corrections),
        variants,
        typeCounts,
        typeFixes,
        errorExamples,
        lastErrorType:["phonetic", "rule", "typo"].includes(item.lastErrorType) ? item.lastErrorType : "rule",
        errorContext,
        lastAt:safeCount(item.lastAt),
        status:item.lastResult === "wrong" ? "wrong" : "correct",
      }];
    });
  }
  function buildGlobalWords(sessions) {
    const grouped = new Map();
    for (const session of sessions) for (const item of session.words) {
      const key = item.word.toLocaleLowerCase();
      let global = grouped.get(key);
      if (!global) {
        global = { word:item.word, errors:0, fixes:0, variants:new Map(), sources:new Set(), sourceUrls:new Set(), typeCounts:{ phonetic:0, rule:0, typo:0 }, typeFixes:{ phonetic:0, rule:0, typo:0 }, errorExamples:{}, errorContext:null, lastAt:0, status:"correct" };
        grouped.set(key, global);
      }
      global.errors += item.errors;
      global.fixes += item.fixes;
      global.sources.add(session.title);
      if (session.url) global.sourceUrls.add(session.url);
      for (const type of ["phonetic", "rule", "typo"]) {
        global.typeCounts[type] += safeCount(item.typeCounts?.[type]);
        global.typeFixes[type] += safeCount(item.typeFixes?.[type]);
        const example = item.errorExamples?.[type];
        if (example && (!global.errorExamples[type] || safeCount(example.lastAt) > safeCount(global.errorExamples[type].lastAt))) global.errorExamples[type] = { ...example, source:session.title, url:session.url };
      }
      if (item.lastAt >= global.lastAt) {
        global.lastAt = item.lastAt;
        global.status = item.status;
        global.errorContext = item.errorContext ? { ...item.errorContext, source:session.title, url:session.url } : null;
      }
      for (const variant of item.variants) {
        const variantKey = variant.text.toLocaleLowerCase();
        const previous = global.variants.get(variantKey);
        if (previous) {
          previous.count += variant.count;
          for (const type of ["phonetic", "rule", "typo"]) previous.typeCounts[type] += safeCount(variant.typeCounts?.[type]);
        } else global.variants.set(variantKey, { ...variant, typeCounts:{ ...variant.typeCounts } });
      }
    }
    return [...grouped.values()].map(item => ({
      ...item,
      sources:[...item.sources],
      sourceUrls:[...item.sourceUrls],
      variants:[...item.variants.values()].sort((a, b) => b.count - a.count || a.text.localeCompare(b.text)),
    }));
  }
  async function loadStatsSnapshot() {
    if (!storage?.get) return { sessions:[], globalWords:[] };
    try {
      const localData = await storage.get(null);
      const index = localData?.[INDEX_KEY];
      const indexedSessions = Array.isArray(index?.sessions) ? index.sessions : [];
      const metadataBySourceId = new Map(indexedSessions
        .filter(session => session?.sourceType === "youtube" && /^[A-Za-z0-9_-]{6,}$/.test(String(session.sourceId || "")))
        .map(session => [String(session.sourceId), session]));
      const normalizedSessions = Object.entries(localData || {}).flatMap(([key, record]) => {
        const match = key.match(/^dictation:([A-Za-z0-9_-]{6,})$/);
        if (!match) return [];
        const sourceId = match[1];
        const metadata = metadataBySourceId.get(sourceId);
        const words = normalizeSessionWords(record?.wrongWordStats);
        if (!words.length) return [];
        return [{
          id:`youtube:${sourceId}`,
          sourceId,
          title:sessionTitle(record, metadata, sourceId),
          url:String(metadata?.url || `https://www.youtube.com/watch?v=${encodeURIComponent(sourceId)}`),
          words,
        }];
      });
      const unresolvedIds = normalizedSessions.filter(session => session.title === session.sourceId).map(session => session.sourceId);
      const liveTitles = await openYouTubeTitles(unresolvedIds);
      for (const session of normalizedSessions) {
        const liveTitle = liveTitles.get(session.sourceId);
        if (liveTitle) session.title = liveTitle;
      }
      return { sessions:normalizedSessions, globalWords:buildGlobalWords(normalizedSessions) };
    } catch (error) {
      console.warn("Could not load local Dictation error statistics", error);
      return { sessions:[], globalWords:[] };
    }
  }
  async function postSnapshot(sequence, type) {
    if (frame.hidden || sequence !== openSequence) return;
    const request = ++snapshotRequest;
    const stats = await loadStatsSnapshot();
    if (frame.hidden || sequence !== openSequence || request !== snapshotRequest) return;
    const dark = document.documentElement.classList.contains("dark");
    frame.contentWindow?.postMessage({
      type,
      ...(type === "KEEPIT_DICTATION_STATS_OPEN" ? { lang:document.documentElement.lang || "vi" } : {}),
      dark,
      stats,
    }, location.origin);
    lastReportedDark = dark;
    if (type === "KEEPIT_DICTATION_STATS_OPEN") {
      popupReadySequence = sequence;
      if (refreshPending) {
        refreshPending = false;
        scheduleStatsRefresh();
      }
    }
  }
  function scheduleStatsRefresh() {
    if (frame.hidden) return;
    if (popupReadySequence !== openSequence) { refreshPending = true; return; }
    const sequence = openSequence;
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => {
      refreshTimer = 0;
      void postSnapshot(sequence, "KEEPIT_DICTATION_STATS_UPDATE");
    }, 40);
  }
  function openPopup() {
    returnFocus = document.activeElement;
    const sequence = ++openSequence;
    popupReadySequence = 0;
    refreshPending = false;
    try { frame.contentDocument?.documentElement?.classList.toggle("dark", document.documentElement.classList.contains("dark")); } catch {}
    frame.hidden = false;
    frame.setAttribute("aria-hidden", "false");
    const send = () => requestAnimationFrame(() => { void postSnapshot(sequence, "KEEPIT_DICTATION_STATS_OPEN"); });
    try {
      if (frame.contentDocument?.readyState === "complete") send();
      else frame.addEventListener("load", send, { once:true });
    } catch { frame.addEventListener("load", send, { once:true }); }
  }
  trigger.addEventListener("click", openPopup);
  window.addEventListener("message", event => {
    if (event.source !== frame.contentWindow || event.origin !== location.origin || event.data?.type !== "KEEPIT_DICTATION_STATS_CLOSE") return;
    openSequence++;
    snapshotRequest++;
    popupReadySequence = 0;
    refreshPending = false;
    clearTimeout(refreshTimer);
    refreshTimer = 0;
    frame.hidden = true;
    frame.setAttribute("aria-hidden", "true");
    returnFocus?.focus?.();
    returnFocus = null;
  });
  frame.addEventListener("load", () => {
    if (!frame.hidden) void postSnapshot(openSequence, "KEEPIT_DICTATION_STATS_OPEN");
  });
  globalThis.browser?.storage?.onChanged?.addListener((changes, areaName) => {
    if (areaName !== "local" || frame.hidden) return;
    const changedKeys = Object.keys(changes || {});
    const settingsKey = globalThis.LHN_CONFIG?.STORAGE_KEYS?.SETTINGS;
    const statsChanged = changedKeys.some(key => key === INDEX_KEY || /^dictation:[A-Za-z0-9_-]{6,}$/.test(key));
    const themeChanged = Boolean(settingsKey && changes?.[settingsKey]) && document.documentElement.classList.contains("dark") !== lastReportedDark;
    if (statsChanged || themeChanged) scheduleStatsRefresh();
  });
  const systemTheme = window.matchMedia?.("(prefers-color-scheme: dark)");
  systemTheme?.addEventListener?.("change", () => {
    if (!frame.hidden && document.documentElement.classList.contains("dark") !== lastReportedDark) scheduleStatsRefresh();
  });
})();
