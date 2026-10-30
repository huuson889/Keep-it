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
  assert.match(js, /overviewSessionEntries = mergeOverviewSessions\(sessions\)/);
  assert.match(html, /<div class="session-grid" id="dictationSessionGrid"[^>]*><\/div>/);
  assert.doesNotMatch(html, /<article class="session-card"/);
  assert.match(js, /escapeHtml\(title\)/);
  assert.match(js, /browser\.tabs\.create\(\{ url \}\)/);
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
