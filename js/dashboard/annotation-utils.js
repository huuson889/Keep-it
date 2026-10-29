(() => {
  function create({ unknownSite }) {
    const metadataCache = new WeakMap();
    const displayWebsiteName = host => {
      const value = String(host || "");
      return value ? value[0].toLocaleUpperCase() + value.slice(1) : value;
    };
    function metadata(item) {
      if (!item || typeof item !== "object") return { site:unknownSite(), tags:[] };
      const cached = metadataCache.get(item);
      if (cached) return cached;
      let host;
      try { host = new URL(item.url).hostname; }
      catch { host = item.hostname || item.url || unknownSite(); }
      const rawTags = Array.isArray(item.tags) ? item.tags : typeof item.tags === "string" ? item.tags.split(",") : [];
      const seen = new Set();
      const tags = rawTags.map(tag => String(tag || "").trim()).filter(tag => {
        const key = tag.toLocaleLowerCase();
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      const result = { site:displayWebsiteName(host), tags };
      metadataCache.set(item, result);
      return result;
    }
    return Object.freeze({
      metadata,
      siteOf:item => metadata(item).site,
      tagsOf:item => metadata(item).tags
    });
  }
  function pageKey(item) {
    return String(item?.url || item?.hostname || item?.title || "unknown");
  }
  globalThis.LHN_ANNOTATION_UTILS = Object.freeze({ create, pageKey });
})();
