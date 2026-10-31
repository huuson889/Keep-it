const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const dashboardJs = fs.readFileSync(new URL("../js/dashboard/dashboard.js", `file://${__filename}`), "utf8");
const dashboardHtml = fs.readFileSync(new URL("../pages/dashboard.html", `file://${__filename}`), "utf8");
const overviewCss = fs.readFileSync(new URL("../css/dashboard/overview.css", `file://${__filename}`), "utf8");

test("Overview reveals individual frames in visual reading order with reference stagger timing", () => {
  assert.match(dashboardJs, /const overviewRevealScope = dashboardRevealEffects\.createScope\(\)/);
  assert.match(dashboardJs, /overviewEffectsWatch = overviewRevealScope\.observe\(\{[\s\S]*?root:dashboardScroller, targets, threshold:0\.12, rootMargin:[\s\S]*?key:"overview-panels", step:80, lead:100[\s\S]*?onTarget:overviewRevealTarget/);
  assert.match(dashboardJs, /overviewRevealScope\.schedule\(revealDelay/);
  assert.doesNotMatch(dashboardJs, /new IntersectionObserver/);
  assert.match(dashboardJs, /function restoreDashboardViewAndReveal\(view, switchCycle\)[\s\S]*?requestAnimationFrame\(\(\) => \{[\s\S]*?dashboardScrollRestoring = false;[\s\S]*?if \(view === "overview"\) resetOverviewEntranceEffects\(\);[\s\S]*?else resetDashboardPanelEntranceEffects\(view\)/);
  assert.match(dashboardJs, /return \[dashboardSharedTopbar, \.\.\.dashboardOverviewView\.querySelectorAll\([\s\S]*?"\.ov-welcome"[\s\S]*?"\.ov-quick-panel"[\s\S]*?"\.ov-stats > \.ov-stat"[\s\S]*?"\.ov-resume"[\s\S]*?"\.ov-progress"[\s\S]*?"\.ov-mode-grid > \.ov-mode"[\s\S]*?"\.ov-lower > \.ov-panel"/);
  assert.match(dashboardJs, /function overviewRevealTarget\(target, revealDelay = 100\)/);
  assert.match(dashboardJs, /target\.style\.setProperty\("--ov-reveal-delay", `\$\{revealDelay\}ms`\)/);
  assert.match(dashboardHtml, /class="ov-topbar ov-reveal"/);
  assert.match(dashboardHtml, /class="ov-welcome ov-reveal"/);
  assert.match(dashboardHtml, /class="ov-stat ov-reveal"/);
  assert.match(dashboardHtml, /class="ov-mode ov-reveal"/);
  assert.match(overviewCss, /transform:translateY\(24px\) scale\(\.98\)/);
  assert.match(overviewCss, /transition:opacity \.8s cubic-bezier\(\.16,1,\.3,1\),transform \.8s cubic-bezier\(\.16,1,\.3,1\)/);
  assert.match(overviewCss, /transition-delay:var\(--ov-reveal-delay,100ms\),var\(--ov-reveal-delay,100ms\),0ms,0ms,0ms/);
  assert.match(overviewCss, /@media\(prefers-reduced-motion:reduce\)[\s\S]*?#dashboardOverviewView \.ov-reveal\.ov-stat[\s\S]*?transition:none/);
  assert.match(overviewCss, /transform:translateY\(0\) scale\(1\)/);
  assert.match(overviewCss, /transition:all \.4s cubic-bezier\(\.16,1,\.3,1\)/);
  assert.match(overviewCss, /transform:translateY\(-4px\)/);
});

test("Dictation reveals the hero and continue card separately in visual row order", () => {
  assert.match(dashboardJs, /if \(view === "dictation"\) return \[\.\.\.dashboardDictationView\.querySelectorAll\(\[[\s\S]*?"\.dictation-hero-row > \.hero", "\.dictation-hero-row > \.continue-card", "\.search-panel", "\.library-section", "\.layout > \.aside"/);
  assert.match(dashboardHtml, /class="dictation-hero-row"><section[^>]*class="hero dashboard-reveal"/);
  assert.match(dashboardHtml, /class="continue-card dashboard-reveal"/);
  assert.doesNotMatch(dashboardHtml, /class="dictation-hero-row dashboard-reveal"/);
  assert.match(dashboardJs, /dictationSessionCardRevealScope\.observe\(\{[\s\S]*?key:"dictation-session-cards",step:80,lead:0,[\s\S]*?startAt:\(\)=>libraryPanelRevealAt\+DICTATION_SESSION_CARD_AFTER_PANEL_DELAY/);
});

test("fresh Dashboard load waits for Overview data readiness before replaying the entrance", () => {
  assert.ok((dashboardHtml.match(/class="[^"]*\bov-reveal\b/g) || []).length >= 17);
  assert.match(dashboardJs, /const reveal = node\.closest\("\.ov-reveal"\);[\s\S]*?if \(reveal\?\.classList\.contains\("ov-revealed"\)\)[\s\S]*?node\.textContent = formatter\(0\)/);
  assert.match(dashboardJs, /load\(\)\.then\(\(\) => \{\s*overviewInitialDataReady = true;[\s\S]*?const loadedView = activeDashboardView;[\s\S]*?restoreDashboardViewAndReveal\(loadedView, loadCycle\)/);
  assert.match(dashboardJs, /overviewRevealScope\.cancel\(\)/);
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

test("Each active tab keeps an independent scroll position and the last route restores after data layout", () => {
  assert.match(overviewCss, /#dashboardScroller > #dashboardOverviewView\s*\{\s*height:calc\(100vh - 98px\)!important;overflow-y:auto!important;/);
  assert.match(overviewCss, /#dashboardScroller > #dashboardDictationView\s*\{\s*height:calc\(100vh - 98px\)!important;overflow-y:auto!important;/);
  assert.match(dashboardJs, /const DASHBOARD_SCROLL_POSITIONS_KEY = "keepitDashboardScrollPositionsV2"/);
  assert.match(dashboardJs, /const DASHBOARD_LEGACY_SCROLL_POSITIONS_KEY = "keepitDashboardScrollPositionsV1"/);
  assert.match(dashboardJs, /const legacy = JSON\.parse\(sessionStorage\.getItem\(DASHBOARD_LEGACY_SCROLL_POSITIONS_KEY\)/);
  assert.match(dashboardJs, /Number\.isFinite\(dictationScroll\) && dictationScroll > 0 \? \{ dictation:dictationScroll \} : \{\}/);
  assert.match(dashboardJs, /const DASHBOARD_ACTIVE_VIEW_KEY = "keepitDashboardActiveViewV1"/);
  assert.match(dashboardJs, /const LEGACY_OVERVIEW_SCROLL_POSITION_KEY = "keepitDashboardOverviewScrollV2"/);
  assert.match(dashboardJs, /dashboardScroller\.addEventListener\("scroll"/);
  assert.match(dashboardJs, /positions\[view\] = Math\.max\(0, dashboardScrollTargetForView\(view\)\.scrollTop\)/);
  assert.match(dashboardJs, /dashboardOverviewView\.addEventListener\("scroll", scheduleDashboardScrollPositionSave/);
  assert.match(dashboardJs, /dashboardDictationView\.addEventListener\("scroll", scheduleDashboardScrollPositionSave/);
  assert.match(dashboardJs, /if \(view === "overview"\) return dashboardOverviewView/);
  assert.match(dashboardJs, /sessionStorage\.setItem\(DASHBOARD_SCROLL_POSITIONS_KEY, JSON\.stringify\(positions\)\)/);
  assert.match(dashboardJs, /sessionStorage\.setItem\(DASHBOARD_ACTIVE_VIEW_KEY, view\)/);
  assert.match(dashboardJs, /function savedDashboardView\(\)[\s\S]*?saved === "listening" \? "dictation" : saved[\s\S]*?"overview"/);
  assert.match(dashboardJs, /function restoreDashboardViewAndReveal\(view, switchCycle\)[\s\S]*?const savedScrollTop = readDashboardScrollPosition\(view\)[\s\S]*?const scrollTarget = dashboardScrollTargetForView\(view\)[\s\S]*?scrollTarget\.scrollTop = savedScrollTop[\s\S]*?requestAnimationFrame\([\s\S]*?if \(switchCycle !== dashboardViewSwitchCycle \|\| restoreCycle !== dashboardRestoreCycle\)/);
});

test("Tab re-entry commits the hidden reveal state before observing panels", () => {
  assert.match(dashboardJs, /function primeDashboardRevealTargets\(targets\)[\s\S]*?setProperty\("transition", "none", "important"\)[\s\S]*?void dashboardScroller\.offsetHeight[\s\S]*?removeProperty\("transition"\)/);
  assert.match(dashboardJs, /function resetOverviewEntranceEffects\(\)[\s\S]*?targets\.forEach\(target => target\.classList\.add\("ov-reveal"\)\);\s*primeDashboardRevealTargets\(targets\);[\s\S]*?overviewRevealScope\.observe/);
  assert.match(dashboardJs, /function resetDashboardPanelEntranceEffects\(view\)[\s\S]*?dashboardSharedTopbar\.classList\.remove\("ov-revealed"\)[\s\S]*?const targets = \[\.\.\.\[dashboardSharedTopbar\][\s\S]*?primeDashboardRevealTargets\(targets\);[\s\S]*?dashboardPanelRevealScope\.observe/);
  assert.match(dashboardJs, /target\.classList\.remove\("dashboard-revealed"\)/);
  assert.match(dashboardJs, /function setDashboardView\(view\)[\s\S]*?cancelDashboardEntranceEffects\(\)[\s\S]*?mountSharedTopbarInParent\(view\);[\s\S]*?restoreDashboardViewAndReveal\(view, switchCycle\)/);
  assert.match(dashboardJs, /function restoreDashboardViewAndReveal\(view, switchCycle\)[\s\S]*?scrollTarget\.scrollTop = savedScrollTop[\s\S]*?requestAnimationFrame\(\(\) => \{[\s\S]*?scrollTarget\.scrollTop = savedScrollTop[\s\S]*?requestAnimationFrame\(\(\) => \{[\s\S]*?resetOverviewEntranceEffects\(\)/);
});
