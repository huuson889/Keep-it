const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");

test("Dashboard detailed-stats button opens the supplied UI-only popup frame", () => {
  const dashboard = read("pages/dashboard.html");
  const popup = read("pages/dictation-stats-popup.html");
  const css = read("css/dashboard/dictation-stats-popup.css");
  const frameCss = read("css/dashboard/listening-demo.css");
  const bridge = read("js/dashboard/dictation-stats-popup-bridge.js");
  const ui = read("js/dashboard/dictation-stats-popup.js");
  const languages = read("js/core/languages.js");

  assert.match(dashboard, /id="listenDetailedStatsBtn" class="all-mistakes"/);
  assert.doesNotMatch(dashboard.match(/id="listenDetailedStatsBtn"[^>]*>/)?.[0] || "", /demo-action/);
  assert.match(dashboard, /<iframe id="dictationStatsPopupFrame" src="dictation-stats-popup\.html"[^>]*hidden/);
  assert.match(dashboard, /dictation-stats-popup-bridge\.js/);
  assert.match(frameCss, /#dictationStatsPopupFrame\[hidden\]/);

  const expandIndex = popup.indexOf('id="expandPopup"');
  const closeIndex = popup.indexOf('id="closeX"');
  assert.ok(expandIndex >= 0 && closeIndex > expandIndex, "expand control appears immediately before close control");
  assert.match(popup, /data-view="global"/);
  assert.match(popup, /data-view="critical"/);
  assert.match(popup, /data-view="sessions"/);
  assert.match(popup, /data-type="phonetic"/);
  assert.match(popup, /data-type="rule"/);
  assert.match(popup, /data-type="typo"/);
  assert.match(popup, /dictation-stats-popup\.css/);
  assert.match(popup, /dictation-stats-popup\.js/);
  assert.doesNotMatch(popup, /<script>([\s\S]*?)<\/script>/);
  assert.doesNotMatch(css, /@import\s+url\(['"]?https?:/i);
  assert.match(css, /PlusJakartaSans-latin\.woff2/);
  assert.match(css, /PlusJakartaSans-vietnamese\.woff2/);
  assert.ok(fs.existsSync(path.join(root, "assets/fonts/PlusJakartaSans-latin.woff2")));
  assert.ok(fs.existsSync(path.join(root, "assets/fonts/PlusJakartaSans-vietnamese.woff2")));
  assert.match(css, /\.modal\.is-expanded/);

  assert.match(bridge, /KEEPIT_DICTATION_STATS_OPEN/);
  assert.match(bridge, /KEEPIT_DICTATION_STATS_CLOSE/);
  assert.match(ui, /currentView === "critical"/);
  assert.match(ui, /item\.rate >= 70 && item\.errors >= 3/);
  assert.match(ui, /modal\.classList\.toggle\("is-expanded"\)/);
  assert.doesNotMatch(ui, /browser\.storage|chrome\.storage/);
  for (const key of ["dictationStatsPopupTitle", "dictationStatsViewGlobal", "dictationStatsViewCritical", "dictationStatsViewSessions", "dictationStatsPopupExpand", "dictationStatsPopupRestore"]) {
    assert.ok(languages.includes(`${key}:`), `localized key ${key} exists`);
  }
});
