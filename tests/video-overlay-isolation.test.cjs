const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");

test("opening the YouTube overlay hides page chrome behind the isolated host", () => {
  const css = read("css/content/content.css");
  const video = read("js/video/dual-subtitles.js");
  const isolationRule = css.match(/html\.lhn-video-overlay-open body > :not\(#keepit-host\)\s*\{[^}]*\}/)?.[0];
  assert.ok(isolationRule);
  assert.match(isolationRule, /visibility\s*:\s*hidden\s*!important/);
  assert.match(css, /#keepit-host\s*\{\s*z-index\s*:\s*2147483647\s*!important/);

  const openOverlay = video.match(/function openOverlay\(\) \{[\s\S]*?\n\}/)?.[0];
  assert.ok(openOverlay);
  assert.ok(openOverlay.indexOf("classList.add('lhn-video-overlay-open')") < openOverlay.indexOf("classList.remove('te-hidden')"));
  assert.ok(openOverlay.indexOf("classList.add('lhn-video-overlay-open')") < openOverlay.indexOf("attachVideo(video, slot)"));
  assert.match(video, /function closeOverlay\(\) \{[\s\S]*?classList\.remove\('lhn-video-overlay-open'\)[\s\S]*?classList\.add\('te-hidden'\)/);
});
