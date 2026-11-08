(() => {
  function parseImportPayload(parsed) {
    const items = Array.isArray(parsed) ? parsed : parsed?.annotations;
    if (!Array.isArray(items)) return null;
    return {
      items,
      favorites: Array.isArray(parsed?.favorites) ? parsed.favorites : null,
      favoriteNoteIds: Array.isArray(parsed?.favoriteNoteIds) ? parsed.favoriteNoteIds : null,
      favoriteVideos: Array.isArray(parsed?.favoriteVideos) ? parsed.favoriteVideos : null,
      isLegacyArray: Array.isArray(parsed)
    };
  }
  function createJsonHeader(exportedAt) {
    return `{"format":"local-highlight-notes","version":1,"exportedAt":${JSON.stringify(exportedAt)},"annotations":[`;
  }
  function createJsonFooter(favorites, favoriteNoteIds, favoriteVideos = []) {
    return `],"favorites":${JSON.stringify(favorites)},"favoriteNoteIds":${JSON.stringify(favoriteNoteIds)},"favoriteVideos":${JSON.stringify(favoriteVideos)}}`;
  }
  // Favourite videos (♥ in the touch overlay): one entry per canonical YouTube video id, newest first.
  function sanitizeFavoriteVideos(value) {
    const seen = new Set(), out = [];
    for (const entry of Array.isArray(value) ? value : []) {
      const videoId = globalThis.LHN_THUMBNAILS?.youtubeVideoId(String(entry?.videoId || "")) || "";
      if (!videoId || seen.has(videoId)) continue;
      seen.add(videoId);
      out.push({ videoId, title: String(entry.title || "").slice(0, 300), channel: String(entry.channel || "").slice(0, 200), addedAt: Number.isFinite(Number(entry.addedAt)) ? Number(entry.addedAt) : Date.now() });
    }
    return out;
  }
  globalThis.LHN_BACKUP = Object.freeze({ parseImportPayload, createJsonHeader, createJsonFooter, sanitizeFavoriteVideos });
})();