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
  for (const type of ["phonetic", "rule", "typo"]) assert.match(popup, new RegExp(`data-type="${type}"`));
  assert.match(popup, /Thống kê &amp; Phân loại Lỗi Chính tả/);
  assert.match(popup, /id="statsRecoveryRate"/);
  assert.match(languages, /dictationStatsTypeNamePhonetic:/);
  assert.match(languages, /dictationStatsTypeNameRule:/);
  assert.match(languages, /dictationStatsTypeNameTypo:/);
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
  assert.match(bridge, /storage\.get\(null\)/, "popup scans actual local records and does not require an index entry");
  assert.match(bridge, /dictation:session-index:v1/);
  assert.match(bridge, /stats\.version !== 3/);
  assert.match(bridge, /typeCounts/);
  assert.match(bridge, /errorContext/);
  assert.match(bridge, /KEEPIT_DICTATION_STATS_OPEN/);
  assert.match(bridge, /KEEPIT_DICTATION_STATS_UPDATE/);
  assert.match(ui, /KEEPIT_DICTATION_STATS_UPDATE/);
  assert.match(ui, /setStatsSnapshot\(event\.data\.stats\)/);
  assert.match(bridge, /stats,/);
  assert.match(ui, /function setStatsSnapshot\(snapshot\)/);
  assert.match(ui, /currentView === "critical"/);
  assert.match(ui, /safeCount\(item\.errors\) >= 3 && calculateErrorRate\(item\.errors, item\.fixes\) >= 70/);
  assert.match(ui, /statsRecoveryRate/);
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
  const record = { wrongWordStats:{ version:3, words:{
    "w:environment":{ word:"environment", errors:7, corrections:3, lastAt:123, lastResult:"wrong", typeCounts:{ phonetic:2, rule:4, typo:1 }, typeFixes:{ phonetic:1, rule:1, typo:1 }, lastErrorType:"rule", errorContext:{ before:"protect our natural ", typed:"enviroment", after:"." }, errorExamples:{ rule:{ before:"protect our natural ", typed:"enviroment", after:".", lastAt:123 } }, variants:{ "v:enviroment":{ text:"enviroment", count:7, typeCounts:{ phonetic:2, rule:4, typo:1 } } } },
    "w:cat":{ word:"cat", errors:9, corrections:0, variants:{} },
  } } };
  const legacyRecord = { wrongWordStats:{ version:2, words:{ "w:legacy":{ word:"legacy", errors:8, corrections:0, variants:{} } } } };
  const unindexedRecord = { wrongWordStats:{ version:3, words:{
    "w:occasionally":{ word:"occasionally", errors:2, corrections:0, typeCounts:{ phonetic:0, rule:0, typo:2 }, typeFixes:{}, lastErrorType:"typo", errorContext:{ before:"", typed:"occasionaly", after:"" }, errorExamples:{ typo:{ before:"", typed:"occasionaly", after:"", lastAt:12 } }, variants:{ "v:occasionaly":{ text:"occasionaly", count:2, typeCounts:{ phonetic:0, rule:0, typo:2 } } } },
  } } };
  const localData = {
    [indexKey]:{ sessions:[
      { sourceType:"youtube", sourceId:"abcdefghijk", title:"Lesson A", url:"https://youtube.test/watch" },
      { sourceType:"youtube", sourceId:"lmnopqrstuv", title:"Legacy B", url:"https://youtube.test/watch" },
    ] },
    "dictation:abcdefghijk":record,
    "dictation:lmnopqrstuv":legacyRecord,
    "dictation:zyxwvutsrqpon":unindexedRecord,
    "dictation:layout:v1":{ wrongWordStats:{ version:3, words:{ "w:shouldnotappear":{ word:"shouldnotappear", errors:99, corrections:0, variants:{} } } } },
  };
  const storage = { async get(keys) { return keys === null ? localData : {}; } };
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
  assert.equal(stats.sessions.length, 2, "valid saved records are found even when their video is missing from the session index");
  const indexedSession = stats.sessions.find(session => session.sourceId === "abcdefghijk");
  const unindexedSession = stats.sessions.find(session => session.sourceId === "zyxwvutsrqpon");
  assert.equal(indexedSession.title, "Lesson A");
  assert.equal(indexedSession.words.length, 1);
  assert.equal(indexedSession.words[0].word, "environment");
  assert.equal(indexedSession.words[0].typeCounts.rule, 4);
  assert.equal(indexedSession.words[0].typeFixes.rule, 1);
  assert.equal(indexedSession.words[0].variants[0].typeCounts.rule, 4);
  assert.deepEqual(JSON.parse(JSON.stringify(indexedSession.words[0].errorContext)), { before:"protect our natural ", typed:"enviroment", after:"." });
  assert.equal(indexedSession.words[0].errorExamples.rule.lastAt, 123);
  assert.equal(unindexedSession.title, "zyxwvutsrqpon", "without index metadata the video ID is used instead of dropping real data");
  assert.equal(unindexedSession.words[0].word, "occasionally");
  const environment = stats.globalWords.find(item => item.word === "environment");
  assert.equal(environment.errors, 7);
  assert.equal(environment.fixes, 3);
  assert.deepEqual(Array.from(environment.sources), ["Lesson A"]);
  assert.equal(environment.errorExamples.rule.source, "Lesson A");
  assert.equal(environment.errorContext.source, "Lesson A");
  assert.equal(environment.typeFixes.rule, 1);
  assert.equal(stats.globalWords.some(item => item.word === "shouldnotappear"), false, "layout and non-video keys are ignored");

  storageChanged({ settings:{ newValue:{ theme:"dark" } } }, "local");
  await new Promise(resolve => setTimeout(resolve, 80));
  assert.equal(messages.length, 1, "unrelated local storage changes do not trigger a stats refresh");
  record.wrongWordStats.words["w:environment"].errors = 8;
  record.wrongWordStats.words["w:environment"].variants["v:enviroment"].count = 8;
  storageChanged({ "dictation:abcdefghijk":{ newValue:record } }, "local");
  await new Promise(resolve => setTimeout(resolve, 80));
  assert.equal(messages.length, 2);
  assert.equal(messages[1].data.type, "KEEPIT_DICTATION_STATS_UPDATE");
  assert.equal(messages[1].data.stats.globalWords.find(item => item.word === "environment").errors, 8, "live popup snapshot reflects the updated local attempt");
});

test("category filters isolate classified wrong attempts, fixes, variants, and their example context", () => {
  const ui = read("js/dashboard/dictation-stats-popup.js");
  const helperStart = ui.indexOf("  function primaryType(item) {");
  const helperEnd = ui.indexOf("  function renderMetrics()", helperStart);
  const helpers = helperStart >= 0 && helperEnd > helperStart ? ui.slice(helperStart, helperEnd) : "";
  assert.ok(helpers, "category view helpers exist");
  const view = vm.runInNewContext(`(() => {
    const TYPES = ["phonetic", "rule", "typo"];
    const safeCount = value => { const n = Number(value); return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0; };
    ${helpers}
    return { viewForType, primaryType };
  })()`);
  const item = {
    word:"receive", errors:6, fixes:3, lastErrorType:"rule", typeCounts:{ phonetic:2, rule:3, typo:1 },
    typeFixes:{ phonetic:1, rule:2, typo:0 },
    variants:[
      { text:"recieve", count:4, typeCounts:{ phonetic:2, rule:2, typo:0 } },
      { text:"receve", count:2, typeCounts:{ phonetic:0, rule:1, typo:1 } },
    ],
    errorContext:{ before:"", typed:"receve", after:"" },
    errorExamples:{ phonetic:{ before:"You can ", typed:"recieve", after:" it." } },
  };
  const phonetic = view.viewForType(item, "phonetic");
  assert.equal(phonetic.errors, 2);
  assert.equal(phonetic.fixes, 1);
  assert.equal(phonetic.variants.length, 1);
  assert.equal(phonetic.variants[0].count, 2);
  assert.equal(view.primaryType(phonetic), "phonetic");
  assert.deepEqual(JSON.parse(JSON.stringify(phonetic.errorContext)), { before:"You can ", typed:"recieve", after:" it." });
  assert.equal(view.viewForType(item, "all").errors, 6);
});

test("Error rate follows wrong/(wrong + fixes), with exact 70% and minimum-three red-alert thresholds", () => {
  const ui = read("js/dashboard/dictation-stats-popup.js");
  const helpers = ui.match(/function calculateErrorRate\(errors, fixes\) \{[\s\S]*?\n  \}\n  function calculateRecoveryRate\(errors, fixes\) \{[\s\S]*?\n  \}\n  function isCritical\(item\) \{[\s\S]*?\n  \}\n  function displayedErrorRate\(item\) \{[\s\S]*?\n  \}/)?.[0];
  assert.ok(helpers, "pure report-rate helpers exist");
  const math = vm.runInNewContext(`(() => {
    const safeCount = value => { const n = Number(value); return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0; };
    ${helpers}
    return { calculateErrorRate, calculateRecoveryRate, isCritical };
  })()`);
  assert.equal(math.calculateErrorRate(7, 3), 70);
  assert.equal(Math.round(math.calculateRecoveryRate(18, 8)), 44, "demo recovery metric uses corrected attempts over wrong attempts");
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
    "dictation:mnopqrstuvwxy": { version:1, notes:{ c:"keep newest" }, wrongWordStats:{ version:3, words:{ "w:new":{ errors:1, typeCounts:{ rule:1 } } } } },
    "dictation:layout:v1": { version:1, wrongWordStats:{ version:1, words:{} } },
  };
  const mockBrowser = { storage:{ local:{
    async get(key) { return key === null ? structuredClone(state) : {}; },
    async set(updates) { Object.assign(state, updates); },
  } } };
  const context = { browser:mockBrowser, console };
  const migrationPromise = vm.runInNewContext(`${source}; resetLegacyDictationWrongWordStats();`, context);
  await migrationPromise;
  assert.deepEqual(JSON.parse(JSON.stringify(state["dictation:abcdefghijk"].wrongWordStats)), { version:3, words:{} });
  assert.deepEqual(state["dictation:abcdefghijk"].notes, { a:"keep" });
  assert.deepEqual(state["dictation:abcdefghijk"].solved, [1,2]);
  assert.deepEqual(state["dictation:abcdefghijk"].translations, { a:"bonjour" });
  assert.deepEqual(JSON.parse(JSON.stringify(state["dictation:lmnopqrstuv"].wrongWordStats)), { version:3, words:{} });
  assert.equal(state["dictation:lmnopqrstuv"].notes.b, "keep too");
  assert.equal(state["dictation:mnopqrstuvwxy"].wrongWordStats.words["w:new"].typeCounts.rule, 1, "already classified schema v3 is preserved");
  assert.equal(state["dictation:mnopqrstuvwxy"].notes.c, "keep newest");
  assert.equal(state["dictation:layout:v1"].wrongWordStats.version, 1);
});
