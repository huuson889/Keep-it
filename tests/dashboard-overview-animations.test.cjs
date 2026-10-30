const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const dashboardJs = fs.readFileSync(new URL("../js/dashboard/dashboard.js", `file://${__filename}`), "utf8");
const overviewCss = fs.readFileSync(new URL("../css/dashboard/overview.css", `file://${__filename}`), "utf8");

test("Overview reveals its existing regions from the Overview scrollport and resets on re-entry", () => {
  assert.match(dashboardJs, /new IntersectionObserver\(entries =>[\s\S]*?if \(!entry\.isIntersecting\) continue;[\s\S]*?overviewRevealTarget\(entry\.target\)/);
  assert.match(dashboardJs, /\{ root:dashboardOverviewView, threshold:0\.12, rootMargin:/);
  assert.match(dashboardJs, /if \(showOverview\) resetOverviewEntranceEffects\(\)/);
  assert.match(dashboardJs, /"\.ov-intro-row > \.ov-welcome"[\s\S]*?"\.ov-stats > \.ov-stat"[\s\S]*?"\.ov-resume-progress > \.ov-progress"[\s\S]*?"\.ov-lower > \.ov-panel"/);
  assert.match(overviewCss, /#dashboardOverviewView \.ov-reveal\s*\{[^}]*opacity:0;[^}]*translate:0 18px/s);
  assert.match(overviewCss, /#dashboardOverviewView \.ov-reveal\.ov-revealed\s*\{\s*opacity:1;\s*translate:0 0;/);
});

test("Overview counter targets remain sourced from the current local summary and animate when revealed", () => {
  assert.match(dashboardJs, /overview\.build\(annotations,/);
  assert.match(dashboardJs, /function overviewSetCounterNode\(node, value, formatter = overviewFormatCount\)/);
  assert.match(dashboardJs, /node\.dataset\.ovCounterTarget = targetString/);
  assert.match(dashboardJs, /function overviewAnimateCountersWithin\(element\)/);
  assert.match(dashboardJs, /overviewSetCounter\("overviewSourcePageCount", model\.sourcePageCount\)/);
  assert.match(dashboardJs, /overviewSetCounter\("overviewDueCount", model\.dueCount\)/);
  assert.match(dashboardJs, /overviewSetCounter\("overviewTodayReviewCount", model\.reviewedToday/);
  assert.match(dashboardJs, /if \(overviewPrefersReducedMotion\(\) \|\| !window\.requestAnimationFrame\)/);
});

test("heatmap, progress meters, and tag bars activate only with their revealed section", () => {
  assert.match(dashboardJs, /target\.querySelector\("\.ov-heatmap, \.ov-meter span, \.ov-today-meter span, \.ov-dist-track span"\)\) target\.classList\.add\("ov-chart-running"\)/);
  assert.match(dashboardJs, /cell\.style\.setProperty\("--ov-cell-delay"/);
  assert.match(dashboardJs, /fill\.style\.width = `\$\{Math\.max\(3, Math\.round\(count \/ maxCount \* 100\)\)\}%`/);
  assert.match(overviewCss, /\.ov-chart-running \.ov-heat-cell\s*\{\s*animation:ov-heat-reveal/);
  assert.match(overviewCss, /\.ov-chart-running \.ov-meter span/);
  assert.match(overviewCss, /\.ov-chart-running \.ov-dist-track span/);
  assert.match(overviewCss, /@media\(prefers-reduced-motion:reduce\)[\s\S]*?\.ov-chart-running \.ov-heat-cell,[\s\S]*?animation:none/);
});
