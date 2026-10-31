// Shared, provider-neutral Dictation session summary contract used by content and Dashboard contexts.
(() => {
  const STORAGE_KEY = "dictation:session-index:v1";
  const VERSION = 1;
  const MAX_SESSIONS = 500;

  const safeCount = value => Number.isFinite(Number(value)) ? Math.max(0, Math.floor(Number(value))) : 0;
  const safeTimestamp = value => {
    if (typeof value === "string" && value.trim() && !/^\d+(?:\.\d+)?$/.test(value.trim())) return Date.parse(value) || 0;
    return safeCount(value);
  };
  function normalizeSession(value) {
    if (!value || typeof value !== "object") return null;
    const sourceType = String(value.sourceType || "").trim().toLowerCase().slice(0, 32);
    const sourceId = String(value.sourceId || "").trim().slice(0, 256);
    if (!sourceType || !sourceId) return null;
    const totalCount = safeCount(value.totalCount);
    const currentIndex = safeCount(value.currentIndex);
    const solvedCount = safeCount(value.solvedCount);
    return {
      version:VERSION,
      sessionId:`${sourceType}:${sourceId}`,
      sourceType,
      sourceId,
      title:typeof value.title === "string" ? value.title.slice(0, 240) : "",
      url:typeof value.url === "string" ? value.url.slice(0, 2048) : "",
      currentIndex:totalCount > 0 ? Math.min(currentIndex, totalCount - 1) : currentIndex,
      totalCount,
      solvedCount:totalCount > 0 ? Math.min(solvedCount, totalCount) : solvedCount,
      updatedAt:safeTimestamp(value.updatedAt),
      status:value.status === "complete" ? "complete" : "in_progress",
      legacy:value.legacy === true
    };
  }
  function normalizeIndex(value) {
    if (!value || typeof value !== "object" || !Array.isArray(value.sessions)) {
      return { version:VERSION, updatedAt:0, legacyMigrationComplete:false, sessions:[] };
    }
    return {
      version:VERSION,
      updatedAt:safeTimestamp(value.updatedAt),
      legacyMigrationComplete:value.legacyMigrationComplete === true,
      sessions:value.sessions.map(normalizeSession).filter(Boolean)
    };
  }
  function fromLegacyYouTubeRecord(sourceId, record, { title = "", url = "" } = {}) {
    const id = String(sourceId || "").trim();
    if (!/^[A-Za-z0-9_-]{6,}$/.test(id) || !record || typeof record !== "object") return null;
    const solvedCount = Array.isArray(record.solved) ? new Set(record.solved.map(Number).filter(Number.isInteger)).size : 0;
    return normalizeSession({
      sourceType:"youtube",
      sourceId:id,
      title,
      url:url || `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`,
      currentIndex:record.current,
      totalCount:0,
      solvedCount,
      updatedAt:0,
      status:"in_progress",
      legacy:true
    });
  }
  function reconcileYouTubeRecord(sourceId, record, indexed = null, { title = "" } = {}) {
    const legacy = fromLegacyYouTubeRecord(sourceId, record, { title });
    if (!legacy) return null;
    const previous = normalizeSession(indexed);
    const id = legacy.sourceId;
    const usableTitle = value => {
      const candidate = String(value || "").trim();
      return candidate && candidate !== id && !/^(youtube|keepit|dictation)$/i.test(candidate) ? candidate : "";
    };
    const recordTitle = usableTitle(record.title);
    const indexedTitle = usableTitle(previous?.title);
    const recordTitleAt = safeTimestamp(record.titleUpdatedAt);
    const indexedUpdatedAt = safeTimestamp(previous?.updatedAt);
    const sessionTitle = recordTitle && recordTitleAt > indexedUpdatedAt
      ? recordTitle
      : indexedTitle || recordTitle || usableTitle(title) || "";
    const solvedCount = Array.isArray(record.solved)
      ? new Set(record.solved.map(Number).filter(Number.isInteger)).size
      : safeCount(previous?.solvedCount);
    const currentIndex = Number.isFinite(Number(record.current)) ? safeCount(record.current) : safeCount(previous?.currentIndex);
    const totalCount = safeCount(previous?.totalCount);
    return normalizeSession({
      ...legacy,
      ...(previous || {}),
      sourceType:"youtube", sourceId:id, sessionId:`youtube:${id}`,
      title:sessionTitle,
      url:previous?.url || record.url || legacy.url,
      currentIndex, totalCount, solvedCount,
      status:previous?.status === "complete" || (totalCount > 0 && solvedCount >= totalCount) ? "complete" : "in_progress",
      updatedAt:Math.max(indexedUpdatedAt, recordTitleAt, safeTimestamp(record.updatedAt)),
      legacy:previous?.legacy === true || !previous,
    });
  }
  function mergeSessions(...groups) {
    const merged = new Map();
    for (const group of groups) for (const value of group || []) {
      const session = normalizeSession(value);
      if (!session) continue;
      const previous = merged.get(session.sessionId);
      if (!previous || session.updatedAt >= previous.updatedAt) merged.set(session.sessionId, { ...previous, ...session });
    }
    return [...merged.values()]
      .sort((a, b) => b.updatedAt - a.updatedAt || a.sessionId.localeCompare(b.sessionId))
      .slice(0, MAX_SESSIONS);
  }

  globalThis.LHN_DICTATION_SESSION_INDEX = Object.freeze({ STORAGE_KEY, VERSION, MAX_SESSIONS, normalizeSession, normalizeIndex, mergeSessions, fromLegacyYouTubeRecord, reconcileYouTubeRecord });
})();
