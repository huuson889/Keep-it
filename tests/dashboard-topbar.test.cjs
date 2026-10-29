const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const dashboardHtml = fs.readFileSync(path.join(root, "pages/dashboard.html"), "utf8");
const dashboardJs = fs.readFileSync(path.join(root, "js/dashboard/dashboard.js"), "utf8");
const overviewCss = fs.readFileSync(path.join(root, "css/dashboard/overview.css"), "utf8");
const notesHtml = fs.readFileSync(path.join(root, "pages/lr-practice-demo.html"), "utf8");
const notesJs = fs.readFileSync(path.join(root, "js/dashboard/lr-practice-demo.js"), "utf8");

test("All three routes share the single Overview topbar node and change its label", () => {
  assert.equal((dashboardHtml.match(/id="dashboardSharedTopbar"/g) || []).length, 1);
  assert.match(dashboardHtml, /id="dashboardSharedTopbar" class="ov-topbar"/);
  assert.match(dashboardHtml, /id="dashboardSharedTopbarLabel"/);
  assert.doesNotMatch(dashboardHtml, /class="topbar ov-topbar"/);
  assert.doesNotMatch(notesHtml, /class="[^"]*(?:^|\s)(?:ov-topbar|demo-topbar)(?:\s|")/);
  assert.match(dashboardJs, /host\.prepend\(dashboardSharedTopbar\)/);
  assert.match(dashboardJs, /home\.prepend\(dashboardSharedTopbar\)/);
  for (const key of ["ovNavOverview", "ovNavListening", "ovMenuHighlightsNotes"]) assert.ok(dashboardJs.includes(key));
  assert.match(dashboardJs, /dashboardSharedTopbarLabel\.textContent\s*=\s*t\(labelKey\)/);
  assert.match(dashboardJs, /const next = dashboardSharedTopbar\.getBoundingClientRect\(\)\.top <= 1/);
  assert.match(notesJs, /getBoundingClientRect\(\)\.top<=1/);
  assert.doesNotMatch(dashboardJs, /classList\.toggle\("demo-topbar"/);
  assert.match(dashboardJs, /findSharedTopbarScrollTarget\(dashboardSharedTopbar\)/);
  assert.match(dashboardJs, /view === "listening" \? dashboardListeningView : dashboardOverviewView\?\.querySelector\("\.ov-content"\)/);
  assert.match(notesJs, /bindSharedTopbarScrollTarget\(\)/);
});

test("The shared topbar sticks at the viewport edge, shrinks by height, and retains iframe export controls", () => {
  assert.match(overviewCss, /#dashboardOverviewView \.ov-topbar[\s\S]*?position:\s*sticky[\s\S]*?top:\s*0/);
  assert.match(overviewCss, /body\.dashboard-overview-active>main#dashboardOverviewView\{[^}]*padding:0 clamp\(/);
  assert.match(overviewCss, /#dashboardOverviewView \.ov-content\{padding-top:22px\}/);
  assert.match(overviewCss, /#dashboardListeningView\{[^}]*padding:0 24px 24px!important/);
  assert.match(overviewCss, /#dashboardListeningView::before\{content:"";display:block;height:24px\}/);
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
