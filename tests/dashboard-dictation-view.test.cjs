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
  assert.match(js, /sourceType === "youtube" && globalThis\.LHN_THUMBNAILS\?\.youtubeVideoId\(videoId\)/);
  assert.match(js, /LHN_THUMBNAILS\?\.loadYouTube\(image, image\.dataset\.videoId/);
  assert.match(js, /onError:\(\) => image\.remove\(\)/);
  assert.match(css, /\.thumb\.habits\{background:linear-gradient\(/);
  assert.match(css, /\.dictation-thumb-image\{position:absolute;z-index:0;[\s\S]*?object-fit:cover/);
});

test("Continue art uses the selected YouTube session thumbnail and restores its default scene on failure", () => {
  assert.ok(html.includes('class="continue-art"'));
  assert.ok(html.includes('class="dictation-continue-thumb" hidden'));
  assert.ok(js.includes('const art = document.querySelector("#dashboardDictationView .continue-art")'));
  assert.match(js, /thumbnails\.loadYouTube\(image, videoId, \{/);
  assert.match(js, /onLoad:\(\) => art\.classList\.add\("has-thumbnail"\)/);
  assert.match(js, /onError:\(\) => \{ image\.hidden = true; art\.classList\.remove\("has-thumbnail"\); \}/);
  assert.match(js, /thumbnails\?\.clear\(image\)/);
  assert.match(css, /\.continue-art\.has-thumbnail:before,[\s\S]*?\.continue-art\.has-thumbnail \.mountain\{display:none\}/);
  assert.match(css, /\.dictation-root \.continue-art\{[^}]*background:linear-gradient\(145deg,#d8eff5,#b5d3e0 47%,#7aa3b0\)/);
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

test("Dictation statistics count up with Overview timing and respect reduced motion", () => {
  assert.match(js, /function setDictationCounter\(node, value, formatter = overviewFormatCount/);
  assert.match(js, /const totalFrames = Math\.round\(2000 \/ \(1000 \/ 60\)\)/);
  assert.match(js, /1 - Math\.pow\(2, -10 \* progress\)/);
  assert.match(js, /overviewPrefersReducedMotion\(\)/);
  assert.match(html, /id="dictationVisibleCount"[\s\S]*?id="dictationFilterAllCount"[\s\S]*?id="dictationWrongWordsCount"[\s\S]*?id="dictationRecoveryRate"/);
  assert.match(js, /setDictationCounter\(count, visible[\s\S]*?filterCounts\[source\]/);
  assert.match(js, /setDictationCounter\(wordCount, words\.length\)/);
  assert.match(js, /setDictationCounter\(recoveryRate, Math\.round\(totalFixes \/ totalErrors \* 100\)\)/);
  assert.match(js, /resetDictationCounterEntranceEffects\(\);[\s\S]*?resetDictationSessionCardEntranceEffects\(\)/);
});

test("Dictation session cards reveal in DOM reading order and remain static for reduced motion", () => {
  assert.match(js, /const cards = \[\.\.\.dashboardDictationView\.querySelectorAll\("\.session-grid \.session-card"\)\]/);
  assert.match(js, /const targetOrder = new Map\(pending\.map\(\(\{ card, index \}\) => \[card, index\]\)\)/);
  assert.match(js, /\.sort\(\(a, b\) => targetOrder\.get\(a\) - targetOrder\.get\(b\)\)/);
  assert.match(js, /dictationSessionCardRevealSequenceEnd \+ 80/);
  assert.match(js, /root:dashboardDictationView, threshold:0\.12/);
  assert.match(css, /\.session-card\.dictation-session-reveal\{opacity:0;transform:translateY\(24px\) scale\(\.98\)/);
  assert.match(css, /\.dictation-session-revealed\{opacity:1;transform:translateY\(0\) scale\(1\)\}/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)[\s\S]*?dictation-session-reveal[\s\S]*?transition:none!important/);
});
