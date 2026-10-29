const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const dashboardHtml = fs.readFileSync(path.join(root, "pages/dashboard.html"), "utf8");
const dashboardJs = fs.readFileSync(path.join(root, "js/dashboard/dashboard.js"), "utf8");
const overviewCss = fs.readFileSync(path.join(root, "css/dashboard/overview.css"), "utf8");
const dashboardCss = fs.readFileSync(path.join(root, "css/dashboard/dashboard.css"), "utf8");
const listeningCss = fs.readFileSync(path.join(root, "css/dashboard/listening-demo.css"), "utf8");
const notesHtml = fs.readFileSync(path.join(root, "pages/lr-practice-demo.html"), "utf8");
const notesJs = fs.readFileSync(path.join(root, "js/dashboard/lr-practice-demo.js"), "utf8");
const themeSyncJs = fs.readFileSync(path.join(root, "js/dashboard/lr-practice-theme-sync.js"), "utf8");

test("All three routes share the single Overview topbar node and change its label", () => {
  assert.equal((dashboardHtml.match(/id="dashboardSharedTopbar"/g) || []).length, 1);
  assert.match(dashboardHtml, /id="dashboardSharedTopbar" class="ov-topbar"/);
  assert.match(dashboardHtml, /id="dashboardSharedTopbarLabel"/);
  assert.doesNotMatch(dashboardHtml, /class="topbar ov-topbar"/);
  assert.doesNotMatch(notesHtml, /class="[^"]*(?:^|\s)(?:ov-topbar|demo-topbar)(?:\s|")/);
  assert.match(dashboardJs, /host\.prepend\(dashboardSharedTopbar\)/);
  assert.match(dashboardJs, /home\.prepend\(dashboardSharedTopbar\)/);
  for (const key of ["ovNavOverview", "ovMenuDictation", "ovMenuHighlightsNotes"]) assert.ok(dashboardJs.includes(key));
  assert.match(dashboardJs, /sidebarItem\?\.querySelector\("\[data-i18n\]"\)\?\.dataset\.i18n/);
  assert.match(dashboardHtml, /data-i18n-aria-label="ovMenuDictation"/);
  assert.match(dashboardJs, /dashboardSharedTopbarLabel\.textContent\s*=\s*t\(labelKey\)/);
  assert.match(dashboardJs, /const next = dashboardSharedTopbar\.getBoundingClientRect\(\)\.top <= 1/);
  assert.match(notesJs, /getBoundingClientRect\(\)\.top<=1/);
  assert.doesNotMatch(dashboardJs, /classList\.toggle\("demo-topbar"/);
  assert.match(dashboardJs, /findSharedTopbarScrollTarget\(dashboardSharedTopbar\)/);
  assert.match(dashboardJs, /view === "listening" \? dashboardListeningView : dashboardOverviewView\?\.querySelector\("\.ov-content"\)/);
  assert.match(dashboardJs, /activeDashboardView === "listening"\s*\? dashboardListeningView\s*:\s*findSharedTopbarScrollTarget\(dashboardSharedTopbar\)/);
  assert.match(overviewCss, /#dashboardListeningView>\.ov-topbar\{width:100%;max-width:1320px;margin-left:auto;margin-right:auto\}/);
  assert.match(notesJs, /bindSharedTopbarScrollTarget\(\)/);
});

test("Highlights & Notes root scrollbar uses the synced dark thumb and a transparent track", () => {
  assert.match(notesHtml, /html\.lr-demo-embedded\.dark\s*\{\s*--lr-scrollbar-thumb:#475569;\s*\}/);
  assert.match(notesHtml, /html\.lr-demo-embedded::-webkit-scrollbar-track,[\s\S]*?html\.lr-demo-embedded body \*::-webkit-scrollbar-track \{ background:transparent!important; \}/);
  assert.match(notesHtml, /html\.lr-demo-embedded::-webkit-scrollbar-thumb,[\s\S]*?html\.lr-demo-embedded body \*::-webkit-scrollbar-thumb \{ border-radius:999px!important; background:var\(--lr-scrollbar-thumb\)!important; \}/);
  assert.match(themeSyncJs, /document\.documentElement\.classList\.toggle\("dark", isDark\)/);
  assert.match(dashboardCss, /#dashboardHighlightsNotesFrame \{[^}]*background:#f5f7fb/);
  assert.match(dashboardCss, /html\.dark #dashboardHighlightsNotesFrame \{ background:var\(--lhn-ui-page,#0b1120\); \}/);
});

test("The shared topbar sticks at the viewport edge, shrinks by height, and retains iframe export controls", () => {
  assert.match(overviewCss, /#dashboardOverviewView \.ov-topbar[\s\S]*?position:\s*sticky[\s\S]*?top:\s*0/);
  assert.match(overviewCss, /body\.dashboard-overview-active>main#dashboardOverviewView\{[^}]*padding:0 clamp\(/);
  assert.match(overviewCss, /#dashboardOverviewView \.ov-content\{padding-top:22px\}/);
  assert.match(overviewCss, /#dashboardListeningView\{[^}]*min-height:0!important[^}]*overflow-x:hidden!important;overflow-y:auto!important[^}]*padding:0 24px 24px!important/);
  assert.match(overviewCss, /#dashboardListeningView::before\{content:"";display:block;height:24px\}/);
  assert.ok(dashboardHtml.indexOf("../css/dashboard/overview.css") < dashboardHtml.indexOf("../css/dashboard/listening-demo.css"));
  assert.match(listeningCss, /#dashboardListeningView\.dashboard-listening-view\{padding:0 clamp\(/);
  assert.doesNotMatch(listeningCss, /#dashboardListeningView\.dashboard-listening-view\{padding:(?:21|16|12)px/);
  assert.match(listeningCss, /@media\(max-width:850px\)\{#dashboardListeningView\.dashboard-listening-view\{padding:0 18px 28px!important\}\}/);
  assert.match(listeningCss, /@media\(max-width:620px\)\{#dashboardListeningView\.dashboard-listening-view\{padding:0 11px 25px!important\}\}/);
  assert.match(overviewCss, /body\.dashboard-overview-active>main#dashboardOverviewView\{padding:0 14px 30px!important\}/);
  assert.match(overviewCss, /@media\(max-width:620px\)\{#dashboardListeningView\{padding:0 15px 15px!important\}/);
  assert.match(overviewCss, /\.ov-topbar\.is-compact[\s\S]*?height:\s*46px/);
  assert.match(overviewCss, /\.ov-topbar\.is-compact[\s\S]*?margin-bottom:\s*30px/);
  assert.doesNotMatch(overviewCss, /\.ov-topbar\.is-compact[^}]*transform\s*:/);
  assert.match(notesHtml, /#dashboardSharedTopbar\.ov-topbar\{position:sticky;top:0/);
  assert.match(notesHtml, /#dashboardSharedTopbar\.is-compact\{height:46px[^}]*margin-bottom:10px/);
  assert.doesNotMatch(notesHtml, /#dashboardSharedTopbar\.demo-topbar\{/);
  assert.match(notesHtml, /html\.lr-demo-embedded\s*\{[^}]*overflow-y:auto!important/);
  assert.match(notesHtml, /html\.lr-demo-embedded body\s*\{[^}]*overflow:visible!important/);
  assert.match(notesHtml, /#dashboardHomeView>#dashboardSharedTopbar\{grid-column:1!important;grid-row:1!important\}/);
  assert.match(notesHtml, /id="dashboardSharedTopbarActionsSource" hidden/);
  assert.match(notesHtml, /id="exportAllDemoBtn"/);
  assert.match(notesHtml, /id="exportAllDemoMenu"/);
  assert.match(dashboardJs, /KEEPIT_SHARED_TOPBAR_MOUNTED/);
  assert.match(notesJs, /KEEPIT_SHARED_TOPBAR_MOUNTED/);
  assert.match(notesJs, /document\.addEventListener\('scroll',updateSharedTopbarCompact,\{passive:true,capture:true\}\)/);
});
