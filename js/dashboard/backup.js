(() => {
  function parseImportPayload(parsed) {
    const items = Array.isArray(parsed) ? parsed : parsed?.annotations;
    if (!Array.isArray(items)) return null;
    return {
      items,
      favorites: Array.isArray(parsed?.favorites) ? parsed.favorites : null,
      favoriteNoteIds: Array.isArray(parsed?.favoriteNoteIds) ? parsed.favoriteNoteIds : null,
      isLegacyArray: Array.isArray(parsed)
    };
  }
  function createJsonHeader(exportedAt) {
    return `{"format":"local-highlight-notes","version":1,"exportedAt":${JSON.stringify(exportedAt)},"annotations":[`;
  }
  function createJsonFooter(favorites, favoriteNoteIds) {
    return `],"favorites":${JSON.stringify(favorites)},"favoriteNoteIds":${JSON.stringify(favoriteNoteIds)}}`;
  }
  globalThis.LHN_BACKUP = Object.freeze({ parseImportPayload, createJsonHeader, createJsonFooter });
})();