const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");

vm.runInThisContext(read("js/shared/thumbnails.js"), { filename:"thumbnails.js" });
const thumbnails = globalThis.LHN_THUMBNAILS;

class FakeImage {
  constructor() { this.attributes = new Map(); this.complete = false; this.naturalWidth = 0; this.onload = null; this.onerror = null; }
  get src() { return this.attributes.get("src") || ""; }
  set src(value) { this.attributes.set("src", String(value)); this.complete = false; }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  removeAttribute(name) { this.attributes.delete(name); }
}

test("shared thumbnail helper extracts safe YouTube IDs and uses the shared hqdefault URL", () => {
  assert.equal(thumbnails.youtubeVideoId("Abc_123-xyZ"), "Abc_123-xyZ");
  assert.equal(thumbnails.youtubeVideoId("https://www.youtube.com/watch?v=Abc_123-xyZ&t=12"), "Abc_123-xyZ");
  assert.equal(thumbnails.youtubeVideoId("https://youtu.be/Abc_123-xyZ"), "Abc_123-xyZ");
  assert.equal(thumbnails.youtubeVideoId("https://m.youtube.com/shorts/Abc_123-xyZ"), "Abc_123-xyZ");
  assert.equal(thumbnails.youtubeVideoId("https://youtube.com.evil.test/watch?v=Abc_123-xyZ"), "");
  assert.equal(thumbnails.youtubeUrl("Abc_123-xyZ"), "https://i.ytimg.com/vi/Abc_123-xyZ/hqdefault.jpg");
});

test("source helper preserves saved images, chooses YouTube images, then builds the existing SVG fallback", () => {
  assert.equal(thumbnails.sourceUrl({ thumbnailUrl:"https://images.example/saved.jpg", url:"https://youtube.com/watch?v=Abc_123-xyZ" }), "https://images.example/saved.jpg");
  assert.equal(thumbnails.sourceUrl({ url:"https://youtube.com/watch?v=Abc_123-xyZ" }), thumbnails.youtubeUrl("Abc_123-xyZ"));
  const fallback = thumbnails.sourceUrl({ url:"https://example.org/article", thumb:["#a8a8ed", "#655fa6"] });
  assert.match(fallback, /^data:image\/svg\+xml;charset=utf-8,/);
  assert.match(decodeURIComponent(fallback.split(",")[1]), /#a8a8ed/);
});

test("thumbnail helper safely resolves page metadata and rejects unsafe sources", () => {
  assert.equal(thumbnails.safeUrl("../cover.png", "https://example.org/path/page"), "https://example.org/cover.png");
  assert.equal(thumbnails.safeUrl("javascript:alert(1)"), "");
  assert.equal(thumbnails.safeUrl("data:text/html,unsafe"), "");
  assert.equal(thumbnails.fromPageMetadata({ querySelector:() => ({ content:"/og.jpg" }) }, "https://example.org/article"), "https://example.org/og.jpg");
});

test("thumbnail loader retries the generic fallback when a saved source fails", () => {
  const image = new FakeImage();
  let loaded = null, failed = 0;
  const fallback = "data:image/png;base64,AA==";
  thumbnails.load(image, { src:"https://broken.example/thumb.jpg", fallbackUrl:fallback, onLoad:(_image, state) => { loaded = state; }, onError:() => failed++ });
  assert.equal(image.src, "https://broken.example/thumb.jpg");
  image.onerror();
  assert.equal(image.src, fallback);
  image.complete = true;
  image.naturalWidth = 1;
  image.onload();
  assert.deepEqual(loaded, { fallback:true });
  assert.equal(failed, 0);
});

test("YouTube, Dashboard and Highlights & Notes consumers load the shared helper first", () => {
  const manifest = JSON.parse(read("manifest.json"));
  const content = manifest.content_scripts.find(entry => entry.js.includes("js/dictation/dictation.js")).js;
  assert.ok(content.indexOf("js/shared/thumbnails.js") < content.indexOf("js/content/content.js"));
  assert.ok(content.indexOf("js/shared/thumbnails.js") < content.indexOf("js/dictation/dictation.js"));
  const dashboard = read("pages/dashboard.html");
  assert.ok(dashboard.indexOf("../js/shared/thumbnails.js") < dashboard.indexOf("../js/dashboard/dashboard.js"));
  const highlights = read("pages/lr-practice-demo.html");
  assert.ok(highlights.indexOf("../js/shared/thumbnails.js") < highlights.indexOf("../js/dashboard/lr-practice-demo.js"));
  assert.match(read("js/dictation/dictation.js"), /thumbnails\.loadYouTube\(ui\.miniThumb/);
  assert.match(read("js/dashboard/dashboard.js"), /LHN_THUMBNAILS\?\.loadYouTube/);
  assert.match(read("js/dashboard/lr-practice-demo.js"), /LHN_THUMBNAILS\?\.loadSource/);
  assert.match(read("js/content/content.js"), /LHN_THUMBNAILS\?\.fromPageMetadata/);
  for (const file of ["js/dictation/dictation.js", "js/dashboard/dashboard.js", "js/dashboard/lr-practice-demo.js", "js/content/content.js"]) {
    assert.doesNotMatch(read(file), /i\.ytimg\.com|hqdefault\.jpg/, `${file} should delegate thumbnail URLs to the shared helper`);
  }
});
