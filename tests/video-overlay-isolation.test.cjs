const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");

test("the YouTube overlay stays above the page and prevents a visible body frame", () => {
  const css = read("css/content/content.css");
  const template = read("js/video/overlay-template.js");
  const video = read("js/video/dual-subtitles.js");
  const isolationRule = css.match(/html\.lhn-video-overlay-open body\s*\{[^}]*\}/)?.[0];
  assert.ok(isolationRule);
  assert.match(isolationRule, /visibility\s*:\s*hidden\s*!important/);
  assert.match(isolationRule, /opacity\s*:\s*0\s*!important/);
  assert.match(isolationRule, /transition\s*:\s*none\s*!important/);
  assert.match(css, /#keepit-host\s*\{\s*z-index\s*:\s*2147483647\s*!important/);
  assert.match(template, /:host\s*\{[^}]*z-index:\s*2147483647;[^}]*isolation:\s*isolate/s);
  assert.match(video, /document\.documentElement\.appendChild\(host\)/);

  const beginIsolation = video.match(/function beginOverlayIsolation\(\) \{[\s\S]*?\n\}/)?.[0];
  assert.ok(beginIsolation);
  assert.match(beginIsolation, /new MutationObserver/);
  assert.match(beginIsolation, /root\.classList\.add\('lhn-video-overlay-open'\)/);
  const openOverlay = video.match(/function openOverlay\(\) \{[\s\S]*?\n\}/)?.[0];
  assert.ok(openOverlay);
  assert.ok(openOverlay.indexOf("beginOverlayIsolation()") < openOverlay.indexOf("classList.remove('te-hidden')"));
  assert.ok(openOverlay.indexOf("classList.remove('te-hidden')") < openOverlay.indexOf("attachVideo(video, slot)"));
  assert.match(video, /function closeOverlay\(\) \{[\s\S]*?endOverlayIsolation\(\)[\s\S]*?classList\.add\('te-hidden'\)/);
});
