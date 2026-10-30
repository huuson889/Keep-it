const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const dashboardJs = fs.readFileSync(new URL("../js/dashboard/dashboard.js", `file://${__filename}`), "utf8");
const overviewCss = fs.readFileSync(new URL("../css/dashboard/overview.css", `file://${__filename}`), "utf8");

test("Overview uses reference reveal timing and the user-requested per-scroll replay", () => {
  assert.match(dashboardJs, /new IntersectionObserver\(entries =>[\s\S]*?if \(!entry\.isIntersecting\) continue;[\s\S]*?overviewRevealTarget\(entry\.target\)/);
  assert.match(dashboardJs, /\{ root:dashboardOverviewView, threshold:0\.12, rootMargin:/);
  assert.match(dashboardJs, /if \(showOverview\) \{ if \(overviewInitialDataReady\) resetOverviewEntranceEffects\(\); \}/);
  assert.match(dashboardJs, /"\.ov-intro-row"[\s\S]*?"\.ov-stats"[\s\S]*?"\.ov-resume-progress"[\s\S]*?"\.ov-lower"/);
  assert.match(dashboardJs, /target\.style\.setProperty\("--ov-reveal-delay", "100ms"\)/);
  assert.doesNotMatch(dashboardJs, /index \* 80/);
  assert.match(overviewCss, /transform:translateY\(24px\) scale\(\.98\)/);
  assert.match(overviewCss, /transition:opacity \.8s cubic-bezier\(\.16,1,\.3,1\),transform \.8s cubic-bezier\(\.16,1,\.3,1\)/);
  assert.match(overviewCss, /transform:translateY\(0\) scale\(1\)/);
  assert.match(overviewCss, /transition:all \.4s cubic-bezier\(\.16,1,\.3,1\)/);
  assert.match(overviewCss, /transform:translateY\(-4px\)/);
});

test("Overview count-ups match the sample's 2-second 60-FPS easeOutExpo while retaining local data", () => {
  assert.match(dashboardJs, /overview\.build\(annotations,/);
  assert.match(dashboardJs, /const frameDuration = 1000 \/ 60/);
  assert.match(dashboardJs, /Math\.round\(2000 \/ frameDuration\)/);
  assert.match(dashboardJs, /}, 300\)\)/);
  assert.match(dashboardJs, /1 - Math\.pow\(2, -10 \* progress\)/);
  assert.match(dashboardJs, /overviewSetCounter\("overviewSourcePageCount", model\.sourcePageCount\)/);
  assert.match(dashboardJs, /overviewSetCounter\("overviewDueCount", model\.dueCount\)/);
  assert.match(dashboardJs, /overviewSetCounter\("overviewTodayReviewCount", model\.reviewedToday/);
  assert.match(dashboardJs, /if \(overviewPrefersReducedMotion\(\) \|\| !window\.requestAnimationFrame\)/);
});

test("existing heatmap and bars use the reference chart durations and easeOutQuart on reveal", () => {
  assert.match(dashboardJs, /function animateOverviewChartFill\(node\)[\s\S]*?\(now - startedAt\) \/ 2000[\s\S]*?1 - Math\.pow\(1 - progress, 4\)/);
  assert.match(dashboardJs, /function animateOverviewHeatmap\(heatmap\)[\s\S]*?\(now - startedAt\) \/ 1800[\s\S]*?1 - Math\.pow\(1 - progress, 4\)/);
  assert.match(dashboardJs, /overviewAnimateChartsWithin\(target\)/);
  assert.match(dashboardJs, /fill\.style\.width = `\$\{Math\.max\(3, Math\.round\(count \/ maxCount \* 100\)\)\}%`/);
  assert.match(overviewCss, /backdrop-filter:blur\(16px\) saturate\(180%\)/);
  assert.match(overviewCss, /background:rgba\(17,25,40,\.65\)/);
  assert.match(overviewCss, /@media\(prefers-reduced-motion:reduce\)[\s\S]*?ov-chart-running \.ov-heat-cell \{ opacity:1; scale:1; \}/);
});

test("counter widths are reserved before animation to prevent line wrapping and card height jumps", () => {
  assert.match(dashboardJs, /function overviewReserveCounterSpace\(node, finalText\)/);
  assert.match(dashboardJs, /Math\.max\(5, Array\.from\(text\)\.length\)/);
  assert.match(dashboardJs, /overviewReserveCounterSpace\(node, finalText\);[\s\S]*?node\.dataset\.ovCounterTarget/);
  assert.match(overviewCss, /#dashboardOverviewView \.ov-pills > span \{\s*flex:0 0 auto;\s*white-space:nowrap;/);
  assert.match(overviewCss, /#dashboardOverviewView \.ov-pills b \{\s*min-width:5ch;\s*flex:0 0 5ch;/);
  assert.match(overviewCss, /grid-template-columns:105px minmax\(0,1fr\) minmax\(30px,max-content\)/);
  assert.match(overviewCss, /grid-template-columns:85px minmax\(0,1fr\) minmax\(25px,max-content\)/);
});

test("Overview scroll position is saved per tab session and restored after data layout on reload", () => {
  assert.match(dashboardJs, /const OVERVIEW_SCROLL_POSITION_KEY = "keepitDashboardOverviewScrollV1"/);
  assert.match(dashboardJs, /dashboardOverviewView\.addEventListener\("scroll"/);
  assert.match(dashboardJs, /window\.addEventListener\("pagehide", saveOverviewScrollPosition\)/);
  assert.match(dashboardJs, /sessionStorage\.setItem\(OVERVIEW_SCROLL_POSITION_KEY/);
  assert.match(dashboardJs, /load\(\)\.then\(\(\) => \{[\s\S]*?readOverviewScrollPosition\(\)[\s\S]*?dashboardOverviewView\.scrollTop = savedOverviewScrollTop[\s\S]*?overviewInitialDataReady = true/);
});
