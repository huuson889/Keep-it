const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "pages/dashboard.html"), "utf8");
const dashboard = fs.readFileSync(path.join(root, "js/dashboard/dashboard.js"), "utf8");
const notes = fs.readFileSync(path.join(root, "js/dashboard/lr-practice-demo.js"), "utf8");
const css = fs.readFileSync(path.join(root, "css/dashboard/highlights-notes-embedded.css"), "utf8");
const shellCss = fs.readFileSync(path.join(root, "css/dashboard/overview.css"), "utf8");

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

test("Highlights & Notes restores the padded two-panel layout and opens the first source notes by default", () => {
  assert.match(css, /#dashboardScroller > #dashboardHighlightsNotesView\s*\{[^}]*display:grid!important;[^}]*grid-template-rows:auto auto auto auto!important;[^}]*row-gap:10px!important;[^}]*height:auto!important;[^}]*min-height:calc\(100vh - 98px\)!important;[^}]*max-height:none!important;[^}]*overflow:visible!important;[^}]*padding:16px clamp\(18px,2\.2vw,34px\) 20px!important/);
  assert.match(css, /#dashboardScroller > #dashboardHighlightsNotesView > \.workspace\s*\{[^}]*grid-template-columns:minmax\(440px,530px\) minmax\(0,1fr\)!important;[^}]*align-items:stretch!important;[^}]*height:\s*max\(650px,\s*calc\(100vh - 472px\)\)\s*!important;[^}]*min-height:300px!important/);
  assert.match(css, /#dashboardScroller > #dashboardHighlightsNotesView > \.workspace > \.notes-panel\s*\{[^}]*height:100%!important;[^}]*overflow:hidden!important/);
  assert.match(css, /#dashboardScroller > #dashboardHighlightsNotesView #sourceList,[\s\S]*?#dashboardScroller > #dashboardHighlightsNotesView #notesList\s*\{[^}]*flex:1 1 auto!important;[^}]*overflow-x:hidden!important;\s*overflow-y:auto!important/);
  assert.match(shellCss, /#dashboardScroller\s*\{[^}]*overflow-y:auto!important/);
  assert.match(css, /@media\(max-width:680px\)[\s\S]*?#dashboardScroller > #dashboardHighlightsNotesView > \.workspace\s*\{[^}]*grid-template-columns:minmax\(0,1fr\)!important/);
  assert.match(css, /@media\(max-width:680px\)[\s\S]*?#dashboardScroller > #dashboardHighlightsNotesView > \.workspace > \.notes-panel\s*\{[^}]*height:clamp\(300px,65vh,420px\)!important;[^}]*min-height:300px!important;[^}]*max-height:420px!important/);
  assert.match(dashboard, /function setDashboardView\(view\)[\s\S]*?if \(showHighlightsNotes\) syncHighlightsNotesView\(\)/);
  assert.match(dashboard, /const alwaysRevealTargets = view === "highlights-notes"[\s\S]*?routeTargets\.filter\(target => target\.matches\("\.sources-panel, \.notes-panel"\)\)/);
  assert.match(dashboard, /alwaysRevealTargets\.forEach\(\(target, index\) => reveal\(target, 100 \+ index \* 80\)\)/);
  assert.match(dashboard, /observedTargets\.forEach\(target => dashboardPanelRevealObserver\.observe\(target\)\)/);
  assert.match(dashboard, /const active = link\.dataset\.dashboardView === view;[\s\S]*?link\.classList\.toggle\("is-active", active\)[\s\S]*?if \(active\) link\.setAttribute\("aria-current", "page"\)/);
  assert.match(notes, /function applyData\(data\)[\s\S]*?selected=pages\.find\(page=>page\.key===previousKey\)\|\|null;\s*if\(!selected\)selected=allFiltered\(\)\[0\]\|\|pages\[0\]\|\|null;\s*refresh\(\);/);
  assert.match(notes, /function renderSources\(\)[\s\S]*?selected=visible\.find\(page=>page\.key===previousKey\)\|\|visible\[0\]\|\|null/);
  assert.match(notes, /function refresh\(\)\{renderSources\(\);renderSelected\(\);/);
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
