const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "pages/dashboard.html"), "utf8");
const js = fs.readFileSync(path.join(root, "js/dashboard/dashboard.js"), "utf8");
const dashboardCss = fs.readFileSync(path.join(root, "css/dashboard/dashboard.css"), "utf8");
const overviewCss = fs.readFileSync(path.join(root, "css/dashboard/overview.css"), "utf8");

test("Dashboard sidebar starts expanded and pin toggles the in-flow width smoothly", () => {
  assert.match(html, /<body class="dashboard-overview-active dashboard-sidebar-pinned">/);
  assert.match(html, /id="dashboardSidebar" class="dashboard-reference-sidebar sidebar-pinned"/);
  assert.match(html, /id="dashboardSidebarPin"[^>]*aria-pressed="true" aria-expanded="true"/);
  assert.match(js, /dashboardSidebar\.classList\.toggle\("sidebar-pinned", pinned\)/);
  assert.match(js, /document\.body\.classList\.toggle\("dashboard-sidebar-pinned", pinned\)/);
  assert.match(js, /dashboardSidebarPin\.setAttribute\("aria-pressed", String\(pinned\)\)/);
  assert.match(dashboardCss, /body > main \{[^}]*margin:0!important/);
  assert.match(dashboardCss, /#dashboardSidebar\.dashboard-reference-sidebar \{[^}]*flex:0 0 56px[^}]*transition:[^}]*flex-basis/);
  assert.match(dashboardCss, /#dashboardSidebar\.dashboard-reference-sidebar\.sidebar-pinned \{ width:220px; flex:0 0 220px; \}/);
  assert.match(dashboardCss, /#dashboardSidebar\.dashboard-reference-sidebar:not\(\.sidebar-pinned\) \{[^}]*width:56px; flex:0 0 56px; \}/);
  assert.doesNotMatch(dashboardCss, /#dashboardSidebar\.dashboard-reference-sidebar:not\(\.sidebar-pinned\):hover \{ width:220px; \}/);
  assert.match(dashboardCss, /#dashboardHighlightsNotesView \{[\s\S]*?margin:0!important/);
  assert.match(overviewCss, /body\.dashboard-overview-active>main#dashboardOverviewView\{[^}]*margin:0!important/);
  assert.match(overviewCss, /#dashboardListeningView\{[^}]*margin:0!important/);
  assert.match(html, /id="dashboardSidebarTooltip" class="dashboard-sidebar-tooltip" aria-hidden="true"/);
  assert.match(html, /data-i18n-aria-label="ovNavOverview"/);
  assert.match(js, /function scheduleDashboardSidebarTooltip\(item, delay = 140\)/);
  assert.match(js, /dashboardSidebar\.classList\.contains\("sidebar-pinned"\)/);
  assert.match(js, /addEventListener\("pointerover"/);
  assert.match(js, /addEventListener\("focusin"/);
  assert.match(dashboardCss, /#dashboardSidebar \.dashboard-sidebar-tooltip::before/);
  assert.match(dashboardCss, /html\.dark #dashboardSidebar \.dashboard-sidebar-tooltip/);
  assert.match(dashboardCss, /prefers-reduced-motion:reduce/);
});
