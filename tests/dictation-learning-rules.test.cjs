const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "..");

function loadRules() {
  const context = { console };
  context.globalThis = context;
  vm.runInNewContext(fs.readFileSync(path.join(root, "js/dictation/dictation-score.js"), "utf8"), context);
  vm.runInNewContext(fs.readFileSync(path.join(root, "js/dictation/dictation-learning-rules.js"), "utf8"), context);
  return { score: context.LHN_DICTATION_SCORE, rules: context.LHN_DICTATION_RULES };
}

test("Dictation scoring accepts standard apostrophe contractions and keeps other checks intact", () => {
  const { score } = loadRules();
  assert.equal(score.score("I am ready.", "I'm ready.").perfect, true);
  assert.equal(score.score("I'm ready.", "I am ready.").perfect, true);
  assert.equal(score.score("He has been here.", "He's been here.").perfect, true);
  assert.equal(score.score("do not stop", "don't stop").perfect, true);
  assert.equal(score.score("We are here!", "we’re here").perfect, true);
  assert.equal(score.score("Can you help?", "can you help").perfect, true, "case and punctuation remain ignored");
  assert.equal(score.score("I am ready", "I'm harpy").perfect, false, "unrelated spelling errors still fail");
  assert.equal(score.score("I am happy", "Im happy").perfect, false, "an expansion is not accepted as a contraction without an apostrophe");
  assert.equal(score.score("going to", "gonna").perfect, false, "slang is not accepted as a standard contraction");
  assert.equal(score.score("want to", "wanna").perfect, false, "non-apostrophe abbreviations are not accepted");
  assert.equal(score.isCorrectIncompletePrefix("I'm ready now", "I am"), true);
});

test("proper-noun hint is placed above the answer field and uses the shared detector", () => {
  const dictation = fs.readFileSync(path.join(root, "js/dictation/dictation.js"), "utf8");
  const css = fs.readFileSync(path.join(root, "js/dictation/dictation-style.js"), "utf8");
  const languages = fs.readFileSync(path.join(root, "js/core/languages.js"), "utf8");
  const hintIndex = dictation.indexOf('id="te-dict-proper-noun-hint"');
  const inputIndex = dictation.indexOf('id="te-dict-input"');
  assert.ok(hintIndex >= 0 && hintIndex < inputIndex, "proper-noun hint sits immediately above the answer textarea");
  assert.match(dictation, /LHN_DICTATION_RULES\.getProperNounHints\(sentence\)/);
  assert.match(css, /\.te-dict-proper-noun-hint\[hidden\]/);
  assert.match(languages, /dictationProperNounHint: "Hint"/);
  assert.match(languages, /dictationProperNounHint: "Gợi ý"/);
  assert.match(languages, /dictationProperNounHint: "힌트"/);
});

test("proper-noun detector supplies unique names in transcript order", () => {
  const { rules } = loadRules();
  assert.deepEqual(Array.from(rules.getProperNounHints("Jake visited Maya in July. Jake waved.")), ["Jake", "Maya", "July"]);
  assert.deepEqual(Array.from(rules.getProperNounHints("Jake met JAKE.")), ["Jake"], "case variants are deduplicated while preserving the first transcript case");
  assert.deepEqual(Array.from(rules.getProperNounHints("The dog ran fast.")), []);
  assert.deepEqual(Array.from(rules.getProperNounHints("I met John Smith in New York.")), ["John", "Smith", "New", "York"]);
});

test("only eligible wrong words enter local stats; missing, short words, proper nouns, and punctuation do not", () => {
  const { score, rules } = loadRules();
  const stats = { version: rules.STATS_VERSION, words: {} };
  const record = (reference, answer, cue = 0, at = 100) => rules.recordWrongWordSubmission(stats, cue, score.score(reference, answer), reference, at);

  assert.equal(record("environment", ""), false, "missing is not logged");
  assert.equal(record("cat", "cap"), false, "three-letter target is excluded");
  assert.equal(record("Jake arrived.", "Jakes arrived."), false, "proper-noun mismatch is excluded");
  assert.equal(record("environment,", "environment"), false, "punctuation is ignored");
  assert.deepEqual(Object.keys(stats.words), []);

  assert.equal(record("word", "ward", 1, 200), true, "four-letter target is eligible");
  assert.equal(stats.words["w:word"].errors, 1);
  assert.equal(stats.words["w:word"].variants["v:ward"].count, 1);
  assert.equal(record("word", "word", 1, 300), true, "a correction of an eligible tracked word is logged");
  assert.equal(stats.words["w:word"].corrections, 1);
  assert.equal(stats.words["w:word"].lastResult, "correct");
});

test("new stats schema starts clean and does not accept the legacy schema", () => {
  const { rules } = loadRules();
  assert.equal(rules.STATS_VERSION, 2);
  const legacy = { version: 1, words: { "w:environment": { errors: 3 } } };
  assert.notEqual(legacy.version, rules.STATS_VERSION);
});
