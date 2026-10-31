const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");

const html = read("pages/dashboard.html");
const js = read("js/dashboard/dashboard.js");
const css = read("css/dashboard/dictation.css");
const languages = read("js/core/languages.js");

test("Dictation route uses its visible name and displays sessions from the local index", () => {
  assert.match(html, /data-dashboard-view="dictation"/);
  assert.match(html, /id="dashboardDictationView"/);
  assert.match(html, /href="\.\.\/css\/dashboard\/dictation\.css"/);
  assert.match(js, /function renderDictationSessionCards\(\)/);
  assert.match(js, /const sessions = sortedDictationSessions\(\)/);
  assert.match(js, /overviewSessionEntries \|\| \[\]/);
  assert.match(js, /function loadOverviewDictationSessions\(\)/);
  assert.match(js, /overviewSessionEntries = mergeOverviewSessions\(overviewSessionEntries, sessions\)/);
  assert.match(html, /<div class="session-grid" id="dictationSessionGrid"[^>]*><\/div>/);
  assert.doesNotMatch(html, /<article class="session-card"/);
  assert.match(js, /escapeHtml\(title\)/);
  assert.match(js, /browser\.tabs\.create\(\{ url \}\)/);
  assert.match(js, /function applyTranslations\(\)[\s\S]*?refreshDictationView\(\)/);
  assert.doesNotMatch(js, /refreshListeningPreview|initListeningPreview/);
});

test("Dictation session list recovers and live-syncs real per-video records when the index is stale", () => {
  assert.match(js, /const allData = await browser\.storage\.local\.get\(null\);[\s\S]*?migrateLegacyDictationRecords\(allData, index\.sessions\)/);
  assert.ok(js.includes("const match = key.match(/^dictation:([A-Za-z0-9_-]{6,})$/);"));
  assert.match(js, /DICTATION_SESSION_INDEX\.reconcileYouTubeRecord\(/);
  assert.match(js, /overviewSessionsNeedReconciliation\(index\.sessions, reconciledSessions\)/);
  assert.match(js, /const changedDictationRecords = Object\.entries\(changes\)\.filter/);
  assert.match(js, /overviewSessionEntries = mergeOverviewSessions\(overviewSessionEntries, reconciled\)/);
  assert.doesNotMatch(js, /if \(!index\.legacyMigrationComplete\) \{\s*const allData/);
});

test("YouTube session cards reuse the Dictation audio thumbnail and retain the default art on failure", () => {
  assert.ok(js.includes('sourceType === "youtube" && /^[A-Za-z0-9_-]{6,}$/.test(videoId)'));
  assert.ok(js.includes('src="https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg"'));
  assert.match(js, /image\.addEventListener\("error", \(\) => image\.remove\(\)/);
  assert.match(css, /\.thumb\.habits\{background:linear-gradient\(/);
  assert.match(css, /\.dictation-thumb-image\{position:absolute;z-index:0;[\s\S]*?object-fit:cover/);
});

test("Empty Dictation and error-stat states are truthful and contain no fabricated records", () => {
  assert.match(html, /id="dictationEmptyState" data-i18n="dictationSessionsLoading"/);
  assert.match(js, /empty\.textContent = t\("dictationEmptyState"\)/);
  assert.match(js, /if \(!hasSessions\) empty\.textContent/);
  assert.match(js, /record\?\.wrongWordStats\?\.version !== 3/);
  assert.match(js, /function renderDictationErrorSummary\(\)/);
  assert.match(js, /dictationSafeCount\(item\?\.errors\)/);
  assert.match(html, /id="dictationMistakeList"/);
  assert.doesNotMatch(html.slice(html.indexOf('id="dashboardDictationView"'), html.indexOf('id="dashboardHighlightsNotesView"')), /How to Build Better Habits|enviroment|recieve|81%|6 sample sessions|bài mẫu|DỮ LIỆU DEMO|SAMPLE DATA/i);
  assert.doesNotMatch(languages, /dictationDemoBadge|dictationDemoCount|dictationStatsDemo|dictationExternalToast|dictationPreviewActionToast/);
});

test("Saved listening route and scroll positions migrate without losing per-tab restore", () => {
  assert.match(js, /Object\.hasOwn\(value, "listening"\)\) value\.dictation = value\.listening/);
  assert.match(js, /legacy\?\.dictation \?\? legacy\?\.listening/);
  assert.match(js, /saved === "listening" \? "dictation" : saved/);
  assert.match(js, /dashboardScrollTargetForView\(view\)[\s\S]*?view === "dictation" \? dashboardDictationView/);
  assert.match(js, /positions\[view\] = Math\.max\(0, dashboardScrollTargetForView\(view\)\.scrollTop\)/);
  assert.match(css, /#dashboardDictationView\.dashboard-dictation-view/);
  assert.match(css, /\.dictation-root \[hidden\]\{display:none!important\}/);
});
