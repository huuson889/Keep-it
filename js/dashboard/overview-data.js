// Pure summaries for the Dashboard Overview; reads only the already-loaded annotation model.
(() => {
  const timestamp = value => {
    const result = Number(value);
    return Number.isFinite(result) && result > 0 ? result : 0;
  };
  const localDayKey = value => {
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return "";
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${date.getFullYear()}-${month}-${day}`;
  };
  const localWeekKey = value => {
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return "";
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
    return localDayKey(date.getTime());
  };
  function build(annotations, { pageKey, siteOf, tagsOf, reviewTimestamp, now = Date.now() } = {}) {
    const items = Array.isArray(annotations) ? annotations : [];
    const pages = new Set(), tagCounts = new Map(), sitePages = new Map();
    const dailyCounts = new Map(), activeWeeks = new Set(), recentItems = [];
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();
    let notesCount = 0, dueCount = 0, reviewedToday = 0, reviewedCardCount = 0;

    for (const item of items) {
      const key = typeof pageKey === "function" ? pageKey(item) : String(item?.url || item?.hostname || item?.title || "unknown");
      pages.add(key);
      const site = typeof siteOf === "function" ? siteOf(item) : "";
      if (!sitePages.has(site)) sitePages.set(site, new Set());
      sitePages.get(site).add(key);
      const tags = typeof tagsOf === "function" ? tagsOf(item) : (Array.isArray(item?.tags) ? item.tags : []);
      for (const tagValue of tags) {
        const tag = String(tagValue || "").trim();
        if (tag) tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      }

      if (String(item?.note || "").trim()) notesCount++;
      const dueAt = timestamp(item?.review?.dueAt);
      if (!dueAt || dueAt <= now) dueCount++;
      const reviewedAt = timestamp(typeof reviewTimestamp === "function" ? reviewTimestamp(item) : item?.review?.reviewedAt);
      if (reviewedAt) {
        reviewedCardCount++;
        if (reviewedAt >= todayStart && reviewedAt <= now) reviewedToday++;
      }

      const createdAt = timestamp(item?.createdAt);
      if (createdAt) {
        const day = localDayKey(createdAt), week = localWeekKey(createdAt);
        if (day) dailyCounts.set(day, (dailyCounts.get(day) || 0) + 1);
        if (week) activeWeeks.add(week);
      }
      const updatedAt = timestamp(item?.updatedAt);
      const activityAt = Math.max(createdAt, updatedAt);
      if (activityAt) recentItems.push({ item, timestamp: activityAt });
    }

    recentItems.sort((a, b) => b.timestamp - a.timestamp);
    const topTags = [...tagCounts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    const topSites = [...sitePages].map(([site, sitePageKeys]) => [site, sitePageKeys.size])
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    return {
      sourcePageCount: pages.size,
      highlightCount: items.length,
      notesCount,
      dueCount,
      reviewedToday,
      reviewedCardCount,
      dailyCounts,
      activeDays: dailyCounts.size,
      activeWeeks: activeWeeks.size,
      topTags,
      topSites,
      recentItems
    };
  }

  function youtubeVideoId(value) {
    try {
      const url = new URL(String(value || ""));
      const host = url.hostname.replace(/^www\./i, "").toLowerCase();
      if (host === "youtu.be") return url.pathname.split("/").filter(Boolean)[0] || "";
      if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
        return url.searchParams.get("v") || url.pathname.match(/^\/(?:embed|shorts|live)\/([^/?]+)/)?.[1] || "";
      }
    } catch {}
    return "";
  }

  globalThis.LHN_DASHBOARD_OVERVIEW_DATA = Object.freeze({ build, localDayKey, localWeekKey, youtubeVideoId });
})();
