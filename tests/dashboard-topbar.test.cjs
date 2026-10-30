const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const dashboardHtml = fs.readFileSync(path.join(root, "pages/dashboard.html"), "utf8");
const dashboardJs = fs.readFileSync(path.join(root, "js/dashboard/dashboard.js"), "utf8");
const overviewCss = fs.readFileSync(path.join(root, "css/dashboard/overview.css"), "utf8");
const dashboardCss = fs.readFileSync(path.join(root, "css/dashboard/dashboard.css"), "utf8");
const notesCss = fs.readFileSync(path.join(root, "css/dashboard/highlights-notes-embedded.css"), "utf8");
const notesJs = fs.readFileSync(path.join(root, "js/dashboard/lr-practice-demo.js"), "utf8");

test("All three Dashboard views share one topbar and preserve independent scroll roots", () => {
  assert.equal((dashboardHtml.match(/id="dashboardSharedTopbar"/g) || []).length, 1);
  assert.match(dashboardHtml, /id="dashboardScroller" class="dashboard-scroller"/);
  assert.match(dashboardHtml, /id="dashboardSharedTopbarPortal" class="dashboard-shared-topbar-host"/);
  assert.match(dashboardHtml, /id="dashboardSharedTopbar" class="ov-topbar ov-reveal"/);
  const scrollerStart = dashboardHtml.indexOf('id="dashboardScroller"');
  const topbarIndex = dashboardHtml.indexOf('id="dashboardSharedTopbar"');
  const overviewIndex = dashboardHtml.indexOf('id="dashboardOverviewView"');
  const listeningIndex = dashboardHtml.indexOf('id="dashboardListeningView"');
  const notesIndex = dashboardHtml.indexOf('id="dashboardHighlightsNotesView"');
  const scrollerEnd = dashboardHtml.indexOf('</div>\n<iframe id="dictationStatsPopupFrame"', notesIndex);
  assert.ok(scrollerStart < topbarIndex && topbarIndex < overviewIndex);
  assert.ok(overviewIndex < listeningIndex && listeningIndex < notesIndex && notesIndex < scrollerEnd);
  assert.doesNotMatch(dashboardHtml, /dashboardHighlightsNotesFrame/);
  assert.match(dashboardJs, /dashboardScroller\.addEventListener\("scroll"/);
  assert.match(dashboardJs, /parentTopbarScrollTarget = \["overview", "listening"\]\.includes\(activeDashboardView\) \? dashboardScrollTargetForView\(activeDashboardView\) : dashboardScroller/);
  assert.match(dashboardJs, /dashboardSharedTopbarLabel\.textContent\s*=\s*t\(labelKey\)/);
  for (const key of ["ovNavOverview", "ovMenuDictation", "ovMenuHighlightsNotes"]) assert.ok(dashboardJs.includes(key));
  assert.match(dashboardCss, /#dashboardScroller/);
  assert.match(overviewCss, /#dashboardScroller \{[\s\S]*?overflow-y:auto!important[\s\S]*?background:#f5f5ff/);
  assert.match(overviewCss, /html\.dark #dashboardScroller \{ background:var\(--lhn-ui-page,#0b1120\)/);
  assert.match(overviewCss, /html\.dark #dashboardScroller > #dashboardSharedTopbarPortal > #dashboardSharedTopbar \{[^}]*background:var\(--lhn-ui-surface,#111a2b\)/);
});

test("The shared topbar sticks, compacts, and receives the Highlights & Notes export actions", () => {
  assert.match(overviewCss, /#dashboardSharedTopbarPortal\s*\{[^}]*position:sticky;top:-22px/);
  assert.match(overviewCss, /#dashboardSharedTopbar\.is-compact\s*\{[^}]*height:46px/);
  assert.match(overviewCss, /#dashboardSharedTopbar\.is-compact\s*\{[^}]*margin-bottom:30px/);
  assert.match(overviewCss, /#dashboardSharedTopbarActionsSlot:not\(\[hidden\]\)/);
  assert.match(overviewCss, /#dashboardSharedTopbarActionsSlot \.demo-export-all/);
  assert.match(dashboardJs, /dashboardSharedTopbarActionsSlot\.append\(actions\)/);
  assert.match(dashboardJs, /parentTopbarScrollTarget = \["overview", "listening"\]\.includes\(activeDashboardView\) \? dashboardScrollTargetForView\(activeDashboardView\) : dashboardScroller/);
  assert.doesNotMatch(dashboardJs, /mountSharedTopbarInIframe|KEEPIT_SHARED_TOPBAR_MOUNTED/);
  assert.match(dashboardHtml, /id="dashboardSharedTopbarActionsSource" hidden/);
  assert.match(dashboardHtml, /id="exportAllDemoBtn"/);
  assert.match(dashboardHtml, /id="exportAllDemoMenu"/);
  assert.match(notesJs, /keepit:highlights-notes-action/);
  assert.doesNotMatch(notesJs, /window\.parent|postMessage/);
});

test("Highlights & Notes styles are scoped locally while inheriting the shared theme", () => {
  assert.match(notesCss, /html\.dark #dashboardHighlightsNotesView \{ --lhn-ui-page:#0b1120/);
  assert.match(notesCss, /html\.dark #dashboardHighlightsNotesView \.demo-hero/);
  assert.match(notesCss, /#dashboardHighlightsNotesView \.workspace/);
  assert.match(notesCss, /#dashboardHighlightsNotesView \.source-list/);
  assert.doesNotMatch(notesCss, /(^|[,\s])body\s*\{/m);
  assert.doesNotMatch(dashboardCss, /#dashboardHighlightsNotesFrame/);
  assert.doesNotMatch(dashboardHtml, /src="lr-practice-demo\.html"/);
});
