(() => {
  function build(annotations, { tagsOf, siteOf, pageKey, dateValue, now = Date.now() }) {
    const pageKeys = new Set(), tagCounts = new Map(), sitePages = new Map(), dailyCounts = new Map();
    let needLearnCount = 0;
    for (const item of annotations) {
      pageKeys.add(pageKey(item));
      for (const tag of tagsOf(item)) tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      const site = siteOf(item);
      if (!sitePages.has(site)) sitePages.set(site, new Set());
      sitePages.get(site).add(pageKey(item));
      const created = dateValue(item, "createdAt");
      if (created) { const date = new Date(created); date.setHours(0, 0, 0, 0); const key = date.toISOString().slice(0, 10); dailyCounts.set(key, (dailyCounts.get(key) || 0) + 1); }
      const dueAt = Number(item.review?.dueAt) || 0;
      if (!dueAt || dueAt <= now) needLearnCount++;
    }
    const siteCounts = new Map([...sitePages].map(([site, pages]) => [site, pages.size]));
    return { source:annotations, pageCount:pageKeys.size, noteCount:annotations.length, tagCounts, siteCounts, dailyCounts, needLearnCount };
  }
  globalThis.LHN_PROFILE_STATS = Object.freeze({ build });
})();
