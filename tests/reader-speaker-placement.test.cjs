const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const reader = fs.readFileSync(path.join(root, "js/reader/bilingual-reader.js"), "utf8");

test("Reader speaker icons stay inside selected reading blocks and overlay the final character", () => {
  const speakerCss = reader.match(/\.lhn-bilingual-speaker\{([^}]*)\}/)?.[1] || "";
  assert.match(speakerCss, /position:absolute!important/);
  assert.match(speakerCss, /width:18px!important/);
  assert.match(speakerCss, /height:18px!important/);
  assert.match(speakerCss, /margin:0!important/);
  assert.doesNotMatch(speakerCss, /margin-left/);

  const start = reader.indexOf("  function updateSpeakers() {");
  const end = reader.indexOf("\n  // Thông báo một lần", start);
  const update = start >= 0 && end > start ? reader.slice(start, end) : "";
  assert.ok(update, "speaker update routine exists");
  assert.match(update, /const readableBlocks = readerBlocks\(\)/);
  assert.doesNotMatch(update, /const allBlocks = blocks\(\)/, "navigation and unrelated page widgets do not receive speaker controls");
  assert.match(update, /positionSpeakerAfterText\(block, speaker, anchor\)/);
  assert.match(reader, /speaker\.style\.setProperty\("left", `\$\{left\}px`, "important"\)/);
  assert.match(reader, /speaker\.style\.setProperty\("top", `\$\{top\}px`, "important"\)/);
});

test("absolute speaker placement follows the paragraph's final glyph in both text directions and clamps to the frame", () => {
  const helper = reader.match(/function positionSpeakerAfterText\(block, speaker, anchor = lastReaderCharacterRect\(block\)\) \{[\s\S]*?\n  \}/)?.[0];
  assert.ok(helper, "speaker geometry helper exists");
  const positionSpeakerAfterText = vm.runInNewContext(`(() => { ${helper}; return positionSpeakerAfterText; })()`, {
    document:{ documentElement:{} },
  });
  const block = { getBoundingClientRect:() => ({ left:100, top:200, right:600, bottom:300 }) };
  const makeSpeaker = () => {
    const values = {};
    const offsetParent = { getBoundingClientRect:() => ({ left:0, top:0 }), scrollLeft:0, scrollTop:0, clientLeft:0, clientTop:0 };
    return { values, offsetParent, offsetWidth:18, offsetHeight:18, style:{ setProperty(name, value, priority) { values[name] = { value, priority }; } } };
  };

  const ltr = makeSpeaker();
  positionSpeakerAfterText(block, ltr, { rect:{ left:200, right:250, top:240, height:18 }, direction:"ltr" });
  assert.equal(ltr.values.left.value, "253px");
  assert.equal(ltr.values.top.value, "240px");
  assert.equal(ltr.values.left.priority, "important");

  const rtl = makeSpeaker();
  positionSpeakerAfterText(block, rtl, { rect:{ left:200, right:250, top:240, height:18 }, direction:"rtl" });
  assert.equal(rtl.values.left.value, "179px");

  const clamped = makeSpeaker();
  positionSpeakerAfterText(block, clamped, { rect:{ left:580, right:599, top:240, height:18 }, direction:"ltr" });
  assert.equal(clamped.values.left.value, "581px", "the icon stays inside the paragraph frame when there is no trailing room");
});
