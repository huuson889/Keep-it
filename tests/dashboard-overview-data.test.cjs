const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync(new URL("../js/dashboard/overview-data.js", `file://${__filename}`), "utf8");
vm.runInThisContext(source, { filename: "overview-data.js" });
const overview = globalThis.LHN_DASHBOARD_OVERVIEW_DATA;
const sessionContractSource = fs.readFileSync(new URL("../js/dictation/session-index.js", `file://${__filename}`), "utf8");
vm.runInThisContext(sessionContractSource, { filename: "dictation-session-index.js" });
const sessionIndex = globalThis.LHN_DICTATION_SESSION_INDEX;

const dateAt = (year, month, day, hour = 12) => new Date(year, month - 1, day, hour).getTime();

test("builds counts and activity only from the supplied local annotations", () => {
  const now = dateAt(2026, 10, 29, 12);
  const annotations = [
    {
      id:"a", url:"https://example.com/a", title:"Page A", hostname:"example.com", quote:"hello",
      note:"remember this", tags:["vocab", "daily"], createdAt:dateAt(2026, 10, 29, 8),
      review:{ dueAt:dateAt(2026, 10, 28), reviewedAt:dateAt(2026, 10, 29, 9) }
    },
    {
      id:"b", url:"https://example.com/b", title:"Page B", hostname:"example.com", quote:"another highlight",
      note:"", contextNote:"surrounding sentence only", tags:["vocab"], createdAt:dateAt(2026, 10, 28, 8),
      review:{ dueAt:dateAt(2026, 11, 1), reviewedAt:dateAt(2026, 10, 28, 10) }
    },
    {
      id:"c", url:"https://news.test/story", title:"Story", hostname:"news.test", quote:"third",
      tags:[], createdAt:dateAt(2025, 1, 1), review:{}
    }
  ];
  const model = overview.build(annotations, {
    now,
    pageKey:item => item.url.split("?")[0],
    siteOf:item => item.hostname,
    tagsOf:item => item.tags
  });

  assert.equal(model.sourcePageCount, 3);
  assert.equal(model.highlightCount, 3);
  assert.equal(model.notesCount, 1, "context sentences alone are not counted as notes");
  assert.equal(model.dueCount, 2, "missing due metadata and past-due cards are due");
  assert.equal(model.reviewedToday, 1, "reviewed-today count is per card, not review events");
  assert.equal(model.reviewedCardCount, 2);
  assert.equal(model.dailyCounts.get("2026-10-29"), 1);
  assert.equal(model.dailyCounts.get("2026-10-28"), 1);
  assert.deepEqual(model.topTags, [["vocab", 2], ["daily", 1]]);
  assert.deepEqual(model.topSites, [["example.com", 2], ["news.test", 1]]);
  assert.equal(model.recentItems[0].item.id, "a");
  assert.equal(model.recentItems.at(-1).item.id, "c");
});

test("accepts the app’s existing derived review timestamp without inventing history", () => {
  const reviewedAt = dateAt(2026, 10, 29, 9);
  const model = overview.build([{ id:"legacy", review:{ dueAt:reviewedAt + 86400000, intervalDays:1 } }], {
    now:dateAt(2026, 10, 29, 12),
    reviewTimestamp:item => item.review.dueAt - item.review.intervalDays * 86400000
  });
  assert.equal(model.reviewedToday, 1);
  assert.equal(model.reviewedCardCount, 1);
  assert.equal(model.dailyCounts.size, 0, "review timestamp is not treated as historical heatmap activity");
});

test("empty annotations produce real zero/empty summary values", () => {
  const model = overview.build(null, { now:dateAt(2026, 10, 29) });
  assert.equal(model.sourcePageCount, 0);
  assert.equal(model.highlightCount, 0);
  assert.equal(model.notesCount, 0);
  assert.equal(model.dueCount, 0);
  assert.equal(model.reviewedToday, 0);
  assert.equal(model.recentItems.length, 0);
});

test("normalizes and merges provider-neutral Dictation sessions", () => {
  const old = sessionIndex.normalizeSession({
    sourceType:"YouTube", sourceId:"video_1", title:"Old title", currentIndex:-4,
    totalCount:20, solvedCount:3, updatedAt:"2026-10-28T08:00:00Z"
  });
  assert.equal(old.sessionId, "youtube:video_1");
  assert.equal(old.currentIndex, 0);
  const bounded = sessionIndex.normalizeSession({ sourceType:"web", sourceId:"lesson", currentIndex:100, totalCount:12, solvedCount:18 });
  assert.equal(bounded.currentIndex, 11);
  assert.equal(bounded.solvedCount, 12);
  assert.equal(old.status, "in_progress");
  assert.equal(old.legacy, false);

  const newer = sessionIndex.normalizeSession({
    sourceType:"web", sourceId:"/lessons/42", title:"Web session", currentIndex:7,
    totalCount:12, solvedCount:6, updatedAt:dateAt(2026, 10, 29)
  });
  const latest = sessionIndex.normalizeSession({
    sourceType:"youtube", sourceId:"video_1", title:"Updated title", currentIndex:8,
    totalCount:20, solvedCount:8, updatedAt:dateAt(2026, 10, 29, 13)
  });
  const merged = sessionIndex.mergeSessions([old, newer], [latest]);
  assert.equal(merged.length, 2);
  assert.equal(merged[0].title, "Updated title");
  assert.equal(merged[0].currentIndex, 8);
  assert.ok(merged.some(item => item.sourceType === "web"), "web sessions use the same contract");
  assert.equal(sessionIndex.normalizeIndex({ sessions:[null, {}, newer] }).sessions.length, 1);
  const migrated = sessionIndex.fromLegacyYouTubeRecord("video_legacy", {
    current:4, solved:[1, "2", "2", "bad"], notes:{4:{note:"kept in legacy record"}}
  }, { title:"Legacy title" });
  assert.equal(migrated.sessionId, "youtube:video_legacy");
  assert.equal(migrated.currentIndex, 4);
  assert.equal(migrated.totalCount, 0, "legacy record has no saved cue total");
  assert.equal(migrated.solvedCount, 2);
  assert.equal(migrated.title, "Legacy title");
  assert.equal(migrated.legacy, true);
  assert.equal(sessionIndex.fromLegacyYouTubeRecord("layout:v1", {}), null);
});

test("reconciles saved YouTube Dictation records with missing or stale index summaries", () => {
  const videoId = "video_repair_1";
  const record = {
    current:5,
    solved:[1, "2", "2", "bad"],
    title:"Fresh saved title",
    titleUpdatedAt:dateAt(2026, 10, 29, 14),
    wrongWordStats:{ version:3, words:{ question:{ word:"question", errors:2 } } }
  };
  const staleIndexEntry = sessionIndex.normalizeSession({
    sourceType:"youtube", sourceId:videoId, title:"Old title",
    url:`https://www.youtube.com/watch?v=${videoId}`,
    currentIndex:2, totalCount:12, solvedCount:1,
    updatedAt:dateAt(2026, 10, 29, 10), status:"in_progress"
  });
  const repaired = sessionIndex.reconcileYouTubeRecord(videoId, record, staleIndexEntry);
  assert.equal(repaired.sessionId, `youtube:${videoId}`);
  assert.equal(repaired.title, "Fresh saved title");
  assert.equal(repaired.currentIndex, 5);
  assert.equal(repaired.totalCount, 12, "keep session metadata unavailable in the raw progress record");
  assert.equal(repaired.solvedCount, 2);
  assert.equal(repaired.url, `https://www.youtube.com/watch?v=${videoId}`);
  assert.equal(repaired.updatedAt, record.titleUpdatedAt);

  const recovered = sessionIndex.reconcileYouTubeRecord(videoId, record);
  assert.equal(recovered.title, "Fresh saved title");
  assert.equal(recovered.currentIndex, 5);
  assert.equal(recovered.totalCount, 0, "do not invent unavailable cue totals");
  assert.equal(recovered.legacy, true);
});

test("extracts supported YouTube URL forms without matching unrelated hosts", () => {
  assert.equal(overview.youtubeVideoId("https://www.youtube.com/watch?v=abc_123-xyZ"), "abc_123-xyZ");
  assert.equal(overview.youtubeVideoId("https://youtu.be/short_id"), "short_id");
  assert.equal(overview.youtubeVideoId("https://m.youtube.com/shorts/shorts_id"), "shorts_id");
  assert.equal(overview.youtubeVideoId("https://youtube.com/embed/embed_id"), "embed_id");
  assert.equal(overview.youtubeVideoId("https://youtube.com.evil.test/watch?v=bad"), "");
  assert.equal(overview.youtubeVideoId("not a URL"), "");
});
