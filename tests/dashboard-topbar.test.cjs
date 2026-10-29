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

test("Overview and Listening topbars use their own sticky scroll roots and compact without scaling", () => {
  assert.match(dashboardHtml, /class="ov-topbar"/);
  assert.match(dashboardHtml, /class="topbar ov-topbar"/);
  assert.match(dashboardJs, /bindCompactTopbar\(dashboardOverviewView\)/);
  assert.match(dashboardJs, /bindCompactTopbar\(dashboardListeningView\)/);
  assert.match(dashboardJs, /scrollRoot\.scrollTop\s*>\s*24/);
  assert.match(overviewCss, /#dashboardOverviewView \.ov-topbar[\s\S]*?position:\s*sticky/);
  assert.match(overviewCss, /\.ov-topbar\.is-compact[\s\S]*?height:\s*46px/);
  assert.doesNotMatch(overviewCss, /\.ov-topbar\.is-compact[^}]*transform\s*:/);
});

test("Highlights & Notes iframe topbar sticks in its own document and keeps export controls", () => {
  assert.match(notesHtml, /class="demo-topbar ov-topbar"/);
  assert.match(notesHtml, /id="exportAllDemoBtn"/);
  assert.match(notesHtml, /id="exportAllDemoMenu"/);
  assert.match(notesHtml, /\.demo-topbar\.ov-topbar\{position:sticky/);
  assert.match(notesHtml, /\.demo-topbar\.ov-topbar\.is-compact\{height:46px/);
  assert.match(notesJs, /window\.addEventListener\('scroll',update,\{passive:true\}\)/);
  assert.match(notesJs, /window\.scrollY>24/);
});
