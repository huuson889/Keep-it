const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "pages/dashboard.html"), "utf8");
const dashboard = fs.readFileSync(path.join(root, "js/dashboard/dashboard.js"), "utf8");
const css = fs.readFileSync(path.join(root, "css/dashboard/dashboard.css"), "utf8");
const iframe = fs.readFileSync(path.join(root, "js/dashboard/lr-practice-demo.js"), "utf8");

test("Dashboard exposes Highlights & Notes under its descriptive route key", () => {
  const routes = [...html.matchAll(/data-dashboard-view="([^"]+)"/g)].map(match => match[1]);
  assert.deepEqual(routes.sort(), ["highlights-notes", "listening", "overview"]);
  assert.match(html, /id="dashboardHighlightsNotesView"/);
  assert.match(html, /id="dashboardHighlightsNotesFrame"/);
  const iframeSource = html.match(/<iframe id="dashboardHighlightsNotesFrame"[^>]*src="([^"]+)"/)?.[1];
  assert.ok(iframeSource);
  assert.ok(fs.existsSync(path.join(root, "pages", iframeSource)), `missing iframe page ${iframeSource}`);
  assert.match(css, /#dashboardHighlightsNotesView/);
  assert.match(dashboard, /"highlights-notes"/);
  assert.doesNotMatch(html, /data-dashboard-view="lr-practice"/);
  assert.doesNotMatch(dashboard, /"lr-practice"/);
});

test("Highlights & Notes parent and iframe retain a matching message contract", () => {
  for (const type of ["HIGHLIGHTS_NOTES_READY", "HIGHLIGHTS_NOTES_ACTION", "KEEPIT_HIGHLIGHTS_NOTES_DATA", "KEEPIT_HIGHLIGHTS_NOTES_RESULT"]) {
    assert.ok(dashboard.includes(type), `parent is missing ${type}`);
    assert.ok(iframe.includes(type), `iframe is missing ${type}`);
  }
});
