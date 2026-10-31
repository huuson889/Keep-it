const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");

test("YouTube stays hidden while the top-level video host is open, including page/body mutations", () => {
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

  const enforceIsolation = video.match(/function enforceOverlayBodyIsolation\([^)]*\) \{[\s\S]*?\n\}/)?.[0];
  assert.ok(enforceIsolation);
  assert.match(enforceIsolation, /body\.style\.setProperty\(property, value, 'important'\)/);
  assert.match(enforceIsolation, /new MutationObserver/);
  assert.match(enforceIsolation, /attributeFilter:\['style'\]/);
  const beginIsolation = video.match(/function beginOverlayIsolation\(\) \{[\s\S]*?\n\}/)?.[0];
  assert.ok(beginIsolation);
  assert.match(beginIsolation, /root\.classList\.add\('lhn-video-overlay-open'\)/);
  assert.match(beginIsolation, /childList:true/);
  assert.match(beginIsolation, /enforceOverlayBodyIsolation\(\)/);
  const endIsolation = video.match(/function endOverlayIsolation\(\) \{[\s\S]*?\n\}/)?.[0];
  assert.ok(endIsolation);
  assert.match(endIsolation, /overlayBodyIsolationSnapshots\.clear\(\)/);

  const openOverlay = video.match(/function openOverlay\(\) \{[\s\S]*?\n\}/)?.[0];
  assert.ok(openOverlay);
  assert.ok(openOverlay.indexOf("beginOverlayIsolation()") < openOverlay.indexOf("classList.remove('te-hidden')"));
  assert.ok(openOverlay.indexOf("classList.remove('te-hidden')") < openOverlay.indexOf("attachVideo(video, slot)"));
  const closeOverlay = video.match(/function closeOverlay\(\) \{[\s\S]*?\n\}/)?.[0];
  assert.ok(closeOverlay);
  assert.ok(closeOverlay.indexOf("shadow.host.style.display = 'none'") < closeOverlay.indexOf("detachVideo()"));
  assert.ok(closeOverlay.indexOf("detachVideo()") < closeOverlay.indexOf("endOverlayIsolation()"));
});
