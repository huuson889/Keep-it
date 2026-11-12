(() => {
  function create({ unknownSite }) {
    const metadataCache = new WeakMap();
    const displayWebsiteName = host => { const value = String(host || ''); return value ? value[0].toLocaleUpperCase() + value.slice(1) : value; };
    function metadata(item) {
      if (!item || typeof item !== 'object') return { site:unknownSite(), tags:[], searchFields:[] };
      const cached = metadataCache.get(item); if (cached) return cached;
      let host;
      try { host = new URL(item.url).hostname; } catch { host = item.hostname || item.url || unknownSite(); }
      const raw = Array.isArray(item.tags) ? item.tags : typeof item.tags === 'string' ? item.tags.split(',') : [];
      const seen = new Set();
      const tags = raw.map(tag => String(tag || '').trim()).filter(tag => { const key = tag.toLocaleLowerCase(); if (!key || seen.has(key)) return false; seen.add(key); return true; });
      const site = displayWebsiteName(host);
      const searchFields = [item.quote, item.note, item.contextNote, tags.join(' '), item.title, item.url, site].map(value => String(value || '').toLocaleLowerCase());
      const result = { site, tags, searchFields }; metadataCache.set(item, result); return result;
    }
    return Object.freeze({ metadata, siteOf:item => metadata(item).site, tagsOf:item => metadata(item).tags, searchFields:item => metadata(item).searchFields });
  }
  function pageKey(item) { return String(item.url || item.hostname || item.title || "unknown"); }
  function groupPages(items, { pageKey = globalThis.LHN_LIBRARY.pageKey, siteOf, searchRank, searchQuery, normalizeColor, favorites, showFavorites, sort }) {
    const groups = new Map();
    for (const item of items) {
      const key = pageKey(item);
      if (!groups.has(key)) groups.set(key, { key, url:item.url || '', title:item.title || siteOf(item), site:siteOf(item), thumbnailUrl:item.thumbnailUrl || '', items:[] });
      const group = groups.get(key); group.items.push(item);
      group.searchRank = Math.min(group.searchRank ?? Number.MAX_SAFE_INTEGER, searchRank(item, searchQuery));
      if ((!group.title || group.title === group.site) && item.title) group.title = item.title;
      if (!group.thumbnailUrl && item.thumbnailUrl) group.thumbnailUrl = item.thumbnailUrl;
    }
    const pages = [...groups.values()].map(group => {
      group.createdAt = group.items.reduce((earliest, item) => { const createdAt = Number(item?.createdAt || 0); return Number.isFinite(createdAt) && createdAt > 0 && createdAt < earliest ? createdAt : earliest; }, Infinity);
      if (!Number.isFinite(group.createdAt)) group.createdAt = 0;
      group.updatedAt = group.items.reduce((latest, item) => { const updated = Number(item?.updatedAt || 0), created = Number(item?.createdAt || 0); return Math.max(latest, Number.isFinite(updated) ? updated : 0, Number.isFinite(created) ? created : 0); }, 0);
      group.colors = [...new Set(group.items.map(item => normalizeColor(item.color)))];
      group.favorite = favorites.includes(group.key); return group;
    });
    pages.sort((a, b) => {
      const relevance = searchQuery.trim() ? a.searchRank - b.searchRank : 0;
      return relevance || (sort === 'count' ? b.items.length - a.items.length || b.updatedAt - a.updatedAt : sort === 'edited' ? b.updatedAt - a.updatedAt || b.createdAt - a.createdAt : b.createdAt - a.createdAt || b.updatedAt - a.updatedAt);
    });
    return pages.filter(page => !showFavorites || page.favorite);
  }
  globalThis.LHN_LIBRARY = Object.freeze({ create, groupPages, pageKey });
})();