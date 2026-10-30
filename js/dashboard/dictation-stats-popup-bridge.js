(() => {
  const trigger = document.getElementById("listenDetailedStatsBtn");
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

  function safeCount(value) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(0, Math.floor(number)) : 0;
  }
  function safeWord(value) {
    const word = String(value || "").trim();
    return word && (word.match(/\p{L}/gu) || []).length >= 4 ? word : "";
  }
  function normalizeSessionWords(stats) {
    if (!stats || stats.version !== 2 || !stats.words || typeof stats.words !== "object") return [];
    return Object.values(stats.words).flatMap(item => {
      if (!item || typeof item !== "object") return [];
      const word = safeWord(item.word);
      const errors = safeCount(item.errors);
      if (!word || !errors) return [];
      const variants = Object.values(item.variants && typeof item.variants === "object" ? item.variants : {})
        .map(variant => ({ text:String(variant?.text || "").trim(), count:safeCount(variant?.count) }))
        .filter(variant => variant.text && variant.count);
      return [{
        word,
        errors,
        fixes:safeCount(item.corrections),
        variants,
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
        global = { word:item.word, errors:0, fixes:0, variants:new Map(), sources:new Set(), lastAt:0, status:"correct" };
        grouped.set(key, global);
      }
      global.errors += item.errors;
      global.fixes += item.fixes;
      global.sources.add(session.title);
      if (item.lastAt >= global.lastAt) {
        global.lastAt = item.lastAt;
        global.status = item.status;
      }
      for (const variant of item.variants) {
        const variantKey = variant.text.toLocaleLowerCase();
        const previous = global.variants.get(variantKey);
        if (previous) previous.count += variant.count;
        else global.variants.set(variantKey, { ...variant });
      }
    }
    return [...grouped.values()].map(item => ({
      ...item,
      sources:[...item.sources],
      variants:[...item.variants.values()].sort((a, b) => b.count - a.count || a.text.localeCompare(b.text)),
    }));
  }
  async function loadStatsSnapshot() {
    if (!storage?.get) return { sessions:[], globalWords:[] };
    try {
      const indexResult = await storage.get(INDEX_KEY);
      const index = indexResult?.[INDEX_KEY];
      const sourceSessions = Array.isArray(index?.sessions) ? index.sessions : [];
      const sessions = sourceSessions.filter(session => session?.sourceType === "youtube"
        && /^[A-Za-z0-9_-]{6,}$/.test(String(session.sourceId || "")));
      const keys = [...new Set(sessions.map(session => `dictation:${session.sourceId}`))];
      if (!keys.length) return { sessions:[], globalWords:[] };
      const records = await storage.get(keys);
      const normalizedSessions = sessions.flatMap(session => {
        const words = normalizeSessionWords(records?.[`dictation:${session.sourceId}`]?.wrongWordStats);
        if (!words.length) return [];
        return [{
          id:`youtube:${session.sourceId}`,
          sourceId:session.sourceId,
          title:String(session.title || session.sourceId),
          url:String(session.url || ""),
          words,
        }];
      });
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
    frame.contentWindow?.postMessage({
      type,
      ...(type === "KEEPIT_DICTATION_STATS_OPEN" ? { lang:document.documentElement.lang || "vi" } : {}),
      stats,
    }, location.origin);
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
    const relevant = Object.keys(changes || {}).some(key => key === INDEX_KEY || /^dictation:[A-Za-z0-9_-]{6,}$/.test(key));
    if (relevant) scheduleStatsRefresh();
  });
})();
