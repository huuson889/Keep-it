const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "pages/dashboard.html"), "utf8");
const dashboard = fs.readFileSync(path.join(root, "js/dashboard/dashboard.js"), "utf8");
const notes = fs.readFileSync(path.join(root, "js/dashboard/lr-practice-demo.js"), "utf8");
const css = fs.readFileSync(path.join(root, "css/dashboard/highlights-notes-embedded.css"), "utf8");

test("Highlights & Notes is integrated into the Dashboard document and shared scroll root", () => {
  const routes = [...html.matchAll(/data-dashboard-view="([^"]+)"/g)].map(match => match[1]);
  assert.deepEqual(routes.sort(), ["highlights-notes", "listening", "overview"]);
  assert.match(html, /id="dashboardScroller"/);
  assert.match(html, /id="dashboardHighlightsNotesView"/);
  assert.match(html, /id="dashboardHighlightsNotesView"[\s\S]*class="demo-hero dashboard-reveal"/);
  assert.match(html, /class="sources-panel dashboard-reveal"/);
  assert.match(html, /class="notes-panel dashboard-reveal"/);
  assert.match(dashboard, /function dashboardPanelRevealTargets\(view\)/);
  assert.match(dashboard, /"\.listen-hero-row", "\.search-panel", "\.library-section", "\.layout > \.aside"/);
  assert.match(dashboard, /\{ root:dashboardScroller, threshold:0\.12, rootMargin:/);
  assert.doesNotMatch(html, /dashboardHighlightsNotesFrame|src="lr-practice-demo\.html"/);
  assert.doesNotMatch(html, /<iframe[^>]+lr-practice-demo\.html/);
  assert.match(html, /href="\.\.\/css\/dashboard\/highlights-notes-embedded\.css"/);
  assert.match(html, /src="\.\.\/js\/dashboard\/lr-practice-demo\.js"/);
  assert.match(css, /#dashboardHighlightsNotesView \.workspace/);
  assert.match(css, /#dashboardHighlightsNotesView \.source-list[^}]*overflow:visible!important/);
  assert.match(css, /html\.dark #dashboardHighlightsNotesView \.demo-hero/);
  assert.doesNotMatch(html, /class="[^"]*source-item[^\"]*dashboard-reveal/);
  assert.doesNotMatch(html, /class="[^"]*lhn-sidebar-card[^\"]*dashboard-reveal/);
});

test("Highlights & Notes keeps its data/action API through a same-document event bus", () => {
  for (const eventName of [
    "keepit:highlights-notes-ready",
    "keepit:highlights-notes-data",
    "keepit:highlights-notes-action",
    "keepit:highlights-notes-result"
  ]) {
    assert.ok(dashboard.includes(eventName), `Dashboard is missing ${eventName}`);
    assert.ok(notes.includes(eventName), `Highlights & Notes is missing ${eventName}`);
  }
  for (const type of ["HIGHLIGHTS_NOTES_ACTION", "KEEPIT_HIGHLIGHTS_NOTES_DATA", "KEEPIT_HIGHLIGHTS_NOTES_RESULT"]) {
    assert.ok(dashboard.includes(type), `Dashboard is missing ${type}`);
    assert.ok(notes.includes(type), `Highlights & Notes is missing ${type}`);
  }
  for (const action of ["edit-note", "delete-note", "toggle-note-favorite", "toggle-page-favorite", "delete-page", "export", "study", "jump-to-highlight", "speak-highlight"]) {
    assert.ok(dashboard.includes(`"${action}"`), `Dashboard is missing action ${action}`);
    assert.ok(notes.includes(`'${action}'`) || notes.includes(`"${action}"`), `Highlights & Notes is missing action ${action}`);
  }
  assert.doesNotMatch(notes, /window\.parent|postMessage|addEventListener\(['"]message/);
});
