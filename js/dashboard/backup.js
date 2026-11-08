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
  function favoritePageUrl(value) {
    try {
      const url = new URL(String(value || ""));
      if (!/^https?:$/.test(url.protocol)) return "";
      url.hash = "";
      return url.href.slice(0, 2048);
    } catch { return ""; }
  }
  function sanitizeFavoriteVideos(value) {
    const seen = new Set(), out = [];
    for (const entry of Array.isArray(value) ? value : []) {
      // A video is kept by its canonical id; a web page by its http(s) URL without #hash.
      const videoId = globalThis.LHN_THUMBNAILS?.youtubeVideoId(String(entry?.videoId || "")) || "";
      const url = videoId ? "" : favoritePageUrl(entry?.url);
      const key = videoId || url;
      if (!key || seen.has(key)) continue;
      seen.add(key);
      const meta = { title: String(entry.title || "").slice(0, 300), channel: String(entry.channel || "").slice(0, 200), addedAt: Number.isFinite(Number(entry.addedAt)) ? Number(entry.addedAt) : Date.now() };
      out.push(videoId ? { videoId, ...meta } : { url, ...meta });
    }
    return out;
  }
  globalThis.LHN_BACKUP = Object.freeze({ parseImportPayload, createJsonHeader, createJsonFooter, sanitizeFavoriteVideos, favoritePageUrl });
})();