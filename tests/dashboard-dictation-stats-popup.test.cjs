const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");

test("Detailed Dictation stats popup receives filtered local session data through the same-origin bridge", () => {
  const dashboard = read("pages/dashboard.html");
  const popup = read("pages/dictation-stats-popup.html");
  const css = read("css/dashboard/dictation-stats-popup.css");
  const frameCss = read("css/dashboard/listening-demo.css");
  const bridge = read("js/dashboard/dictation-stats-popup-bridge.js");
  const ui = read("js/dashboard/dictation-stats-popup.js");
  const languages = read("js/core/languages.js");

  assert.match(dashboard, /id="listenDetailedStatsBtn" class="all-mistakes"/);
  assert.match(dashboard, /<iframe id="dictationStatsPopupFrame" src="dictation-stats-popup\.html"[^>]*hidden/);
  assert.match(dashboard, /dictation-stats-popup-bridge\.js/);
  assert.match(frameCss, /#dictationStatsPopupFrame\[hidden\]/);
  assert.match(popup, /data-view="global"/);
  assert.match(popup, /data-view="critical"/);
  assert.match(popup, /data-view="sessions"/);
  assert.doesNotMatch(popup, /data-type="(phonetic|rule|typo)"/);
  assert.doesNotMatch(languages, /dictationStats(Filter|Type|Context|SourceLabel)/, "unsupported classifier and transcript-context labels are not shipped");
  assert.match(popup, /dictation-stats-popup\.css/);
  assert.match(popup, /dictation-stats-popup\.js/);
  assert.doesNotMatch(popup, /<script>([\s\S]*?)<\/script>/);
  assert.doesNotMatch(css, /@import\s+url\(['"]?https?:/i);
  assert.match(css, /PlusJakartaSans-latin\.woff2/);
  assert.match(css, /PlusJakartaSans-vietnamese\.woff2/);
  assert.ok(fs.existsSync(path.join(root, "assets/fonts/PlusJakartaSans-latin.woff2")));
  assert.ok(fs.existsSync(path.join(root, "assets/fonts/PlusJakartaSans-vietnamese.woff2")));
  assert.match(css, /\.modal\.is-expanded/);

  assert.match(bridge, /browser\?\.storage\?\.local/);
  assert.match(bridge, /storage\?\.onChanged/);
  assert.match(bridge, /dictation:session-index:v1/);
  assert.match(bridge, /stats\.version !== 2/);
  assert.match(bridge, /KEEPIT_DICTATION_STATS_OPEN/);
  assert.match(bridge, /KEEPIT_DICTATION_STATS_UPDATE/);
  assert.match(ui, /KEEPIT_DICTATION_STATS_UPDATE/);
  assert.match(ui, /setStatsSnapshot\(event\.data\.stats\)/);
  assert.match(bridge, /stats,/);
  assert.match(ui, /function setStatsSnapshot\(snapshot\)/);
  assert.match(ui, /currentView === "critical"/);
  assert.match(ui, /safeCount\(item\.errors\) >= 3 && calculateErrorRate\(item\.errors, item\.fixes\) >= 70/);
  assert.match(ui, /statsErrorRate/);
  assert.doesNotMatch(ui, /const errorDatabase\s*=\s*\[/, "popup uses real local stats rather than sample rows");
  assert.doesNotMatch(ui, /item\.rate >= 70/);
  assert.doesNotMatch(ui, /browser\.storage|chrome\.storage/);
  for (const key of ["dictationStatsPopupTitle", "dictationStatsViewGlobal", "dictationStatsViewCritical", "dictationStatsViewSessions", "dictationStatsEligibleOnly", "dictationStatsStatusNeedsPractice", "dictationStatsStatusCorrected", "dictationProperNounHint"]) {
    assert.ok(languages.includes(`${key}:`), `localized key ${key} exists`);
  }
});

test("popup bridge refreshes its local stats snapshot live and rejects legacy/short-word entries", async () => {
  const bridge = read("js/dashboard/dictation-stats-popup-bridge.js");
  const handlers = {};
  const messages = [];
  const trigger = { addEventListener(type, handler) { handlers[`trigger:${type}`] = handler; } };
  const frame = {
    hidden:true,
    contentDocument:{ readyState:"complete" },
    contentWindow:{ postMessage(data, origin) { messages.push({ data, origin }); } },
    setAttribute() {},
    addEventListener(type, handler) { handlers[`frame:${type}`] = handler; },
  };
  const indexKey = "dictation:session-index:v1";
  let storageChanged;
  const record = { wrongWordStats:{ version:2, words:{
    "w:environment":{ word:"environment", errors:7, corrections:3, lastAt:123, lastResult:"wrong", variants:{ "v:enviroment":{ text:"enviroment", count:7 } } },
    "w:cat":{ word:"cat", errors:9, corrections:0, variants:{} },
  } } };
  const legacyRecord = { wrongWordStats:{ version:1, words:{ "w:legacy":{ word:"legacy", errors:8, corrections:0, variants:{} } } } };
  const storage = { async get(keys) {
    if (keys === indexKey) return { [indexKey]:{ sessions:[
      { sourceType:"youtube", sourceId:"abcdefghijk", title:"Lesson A", url:"https://youtube.test/watch" },
      { sourceType:"youtube", sourceId:"lmnopqrstuv", title:"Legacy B", url:"https://youtube.test/watch" },
    ] } };
    if (Array.isArray(keys)) return Object.fromEntries(keys.map(key => [key, key.endsWith("abcdefghijk") ? record : legacyRecord]));
    return {};
  } };
  const context = {
    document:{ getElementById(id) { return id === "listenDetailedStatsBtn" ? trigger : id === "dictationStatsPopupFrame" ? frame : null; }, documentElement:{ lang:"en" }, activeElement:null },
    window:{ addEventListener() {} },
    location:{ origin:"https://keepit.test" },
    browser:{ storage:{ local:storage, onChanged:{ addListener(listener) { storageChanged = listener; } } } },
    requestAnimationFrame(callback) { callback(); },
    setTimeout,
    clearTimeout,
    console,
  };
  context.globalThis = context;
  vm.runInNewContext(bridge, context);
  handlers["trigger:click"]();
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(messages.length, 1);
  assert.equal(messages[0].origin, "https://keepit.test");
  assert.equal(messages[0].data.type, "KEEPIT_DICTATION_STATS_OPEN");
  const stats = messages[0].data.stats;
  assert.equal(stats.sessions.length, 1);
  assert.equal(stats.sessions[0].title, "Lesson A");
  assert.equal(stats.sessions[0].words.length, 1);
  assert.equal(stats.sessions[0].words[0].word, "environment");
  assert.equal(stats.globalWords[0].errors, 7);
  assert.equal(stats.globalWords[0].fixes, 3);
  assert.deepEqual(Array.from(stats.globalWords[0].sources), ["Lesson A"]);

  storageChanged({ settings:{ newValue:{ theme:"dark" } } }, "local");
  await new Promise(resolve => setTimeout(resolve, 80));
  assert.equal(messages.length, 1, "unrelated local storage changes do not trigger a stats refresh");
  record.wrongWordStats.words["w:environment"].errors = 8;
  record.wrongWordStats.words["w:environment"].variants["v:enviroment"].count = 8;
  storageChanged({ "dictation:abcdefghijk":{ newValue:record } }, "local");
  await new Promise(resolve => setTimeout(resolve, 80));
  assert.equal(messages.length, 2);
  assert.equal(messages[1].data.type, "KEEPIT_DICTATION_STATS_UPDATE");
  assert.equal(messages[1].data.stats.globalWords[0].errors, 8, "live popup snapshot reflects the updated local attempt");
});

test("Error rate follows wrong/(wrong + fixes), with exact 70% and minimum-three red-alert thresholds", () => {
  const ui = read("js/dashboard/dictation-stats-popup.js");
  const helpers = ui.match(/function calculateErrorRate\(errors, fixes\) \{[\s\S]*?\n  \}\n  function isCritical\(item\) \{[\s\S]*?\n  \}\n  function displayedErrorRate\(item\) \{[\s\S]*?\n  \}/)?.[0];
  assert.ok(helpers, "pure report-rate helpers exist");
  const math = vm.runInNewContext(`(() => {
    const safeCount = value => { const n = Number(value); return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0; };
    ${helpers}
    return { calculateErrorRate, isCritical };
  })()`);
  assert.equal(math.calculateErrorRate(7, 3), 70);
  assert.equal(math.calculateErrorRate(6, 4), 60);
  assert.equal(math.calculateErrorRate(0, 0), 0);
  assert.equal(math.isCritical({ errors:7, fixes:3 }), true);
  assert.equal(math.isCritical({ errors:6, fixes:4 }), false);
  assert.equal(math.isCritical({ errors:2, fixes:0 }), false);
  assert.equal(math.isCritical({ errors:3, fixes:0 }), true);
});

test("legacy migration clears only old wrong-word stats and preserves other session data", async () => {
  const background = read("js/background/background.js");
  const start = background.indexOf("async function resetLegacyDictationWrongWordStats() {");
  assert.ok(start >= 0);
  const end = background.indexOf("\nbrowser.runtime.onInstalled.addListener", start);
  const source = background.slice(start, end);
  const state = {
    "dictation:abcdefghijk": { version:1, solved:[1,2], notes:{ a:"keep" }, translations:{ a:"bonjour" }, wrongWordStats:{ version:1, words:{ "w:test":{ errors:2 } } } },
    "dictation:lmnopqrstuv": { version:1, notes:{ b:"keep too" }, wrongWordStats:{ version:2, words:{ "w:word":{ errors:1 } } } },
    "dictation:layout:v1": { version:1, wrongWordStats:{ version:1, words:{} } },
  };
  const mockBrowser = { storage:{ local:{
    async get(key) { return key === null ? structuredClone(state) : {}; },
    async set(updates) { Object.assign(state, updates); },
  } } };
  const context = { browser:mockBrowser, console };
  const migrationPromise = vm.runInNewContext(`${source}; resetLegacyDictationWrongWordStats();`, context);
  await migrationPromise;
  assert.deepEqual(JSON.parse(JSON.stringify(state["dictation:abcdefghijk"].wrongWordStats)), { version:2, words:{} });
  assert.deepEqual(state["dictation:abcdefghijk"].notes, { a:"keep" });
  assert.deepEqual(state["dictation:abcdefghijk"].solved, [1,2]);
  assert.deepEqual(state["dictation:abcdefghijk"].translations, { a:"bonjour" });
  assert.equal(state["dictation:lmnopqrstuv"].wrongWordStats.words["w:word"].errors, 1);
  assert.equal(state["dictation:layout:v1"].wrongWordStats.version, 1);
});
