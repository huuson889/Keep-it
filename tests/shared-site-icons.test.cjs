const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const helper = read("js/shared/site-icons.js");

function createStorage() {
  const values = {};
  const listeners = new Set();
  let reads = 0;
  const local = {
    async get(key) { reads++; return { [key]:values[key] }; },
    async set(updates) {
      const changes = {};
      for (const [key, value] of Object.entries(updates)) {
        changes[key] = { oldValue:values[key], newValue:value };
        values[key] = value;
      }
      for (const listener of listeners) listener(changes, "local");
    },
  };
  return {
    values,
    get reads() { return reads; },
    browser:{ storage:{ local, onChanged:{ addListener(listener) { listeners.add(listener); } } } },
  };
}
function createImageClass(allowedUrls, requests) {
  return class MockImage {
    constructor() { this.listeners = new Map(); this.complete = false; this.naturalWidth = 0; this.hidden = false; }
    addEventListener(type, listener) {
      if (!this.listeners.has(type)) this.listeners.set(type, new Set());
      this.listeners.get(type).add(listener);
    }
    removeEventListener(type, listener) { this.listeners.get(type)?.delete(listener); }
    set src(value) {
      this._src = String(value);
      requests.push(this._src);
      this.complete = false;
      this.naturalWidth = 0;
      queueMicrotask(() => {
        const loaded = allowedUrls.has(this._src);
        this.complete = true;
        this.naturalWidth = loaded ? 128 : 0;
        const type = loaded ? "load" : "error";
        for (const listener of [...(this.listeners.get(type) || [])]) listener();
        this[`on${type}`]?.();
      });
    }
    get src() { return this._src || ""; }
  };
}
function createContext(storage, allowedUrls, requests) {
  const window = { parent:{ browser:storage.browser } };
  const context = {
    window,
    Image:createImageClass(allowedUrls, requests),
    URL,
    setTimeout,
    clearTimeout,
    queueMicrotask,
    console,
  };
  context.globalThis = context;
  vm.runInNewContext(helper, context);
  return window.LHN_SITE_ICONS;
}

test("one shared site-icon resolver is used by popup and Highlights & Notes surfaces", () => {
  const popup = read("pages/dictation-stats-popup.html");
  const lr = read("pages/highlights-notes.html");
  const popupUi = read("js/dashboard/dictation-stats-popup.js");
  const lrUi = read("js/dashboard/highlights-notes.js");
  assert.match(popup, /<script src="\.\.\/js\/shared\/site-icons\.js"><\/script>\s*<script src="\.\.\/js\/dashboard\/dictation-stats-popup\.js"><\/script>/);
  assert.match(lr, /<script src="\.\.\/js\/shared\/site-icons\.js"><\/script><script src="\.\.\/js\/shared\/thumbnails\.js"><\/script><script src="\.\.\/js\/dashboard\/highlights-notes\.js"><\/script>/);
  assert.match(popupUi, /LHN_SITE_ICONS\.load\(image, session\.url, \{ fallbackElement:fallbackIcon \}\)/);
  assert.match(lrUi, /LHN_SITE_ICONS\.load\(img,pageUrl,\{fallbackElement:fallback\}\)/);
  assert.match(lrUi, /LHN_SITE_ICONS\.load\(image,pageUrl,\{fallbackElement:fallback\}\)/);
  assert.doesNotMatch(popupUi, /google\.com\/s2\/favicons|\/favicon\.ico/);
  assert.doesNotMatch(lrUi, /google\.com\/s2\/favicons|\/favicon\.ico/);
});

test("resolver prioritizes browser/vector/large icons, requests a high-resolution site-only fallback, and rejects unsafe URLs", () => {
  assert.match(helper, /const CACHE_KEY = "keepit:site-icon-cache:v1"/);
  assert.match(helper, /const CACHE_TTL = 30 \* 24 \* 60 \* 60 \* 1000/);
  assert.match(helper, /const NEGATIVE_CACHE_TTL = 6 \* 60 \* 60 \* 1000/);
  assert.match(helper, /const MAX_CACHE_ENTRIES = 256/);
  assert.match(helper, /\/favicon\.svg/);
  assert.match(helper, /apple-touch-icon\.png/);
  assert.match(helper, /domain_url=\$\{encodeURIComponent\(safeOrigin\)\}&sz=128/);
  assert.match(helper, /\["http:", "https:"\]\.includes\(url\.protocol\)/);
  assert.match(helper, /api\.storage\.local\.get/);
  assert.match(helper, /area\.set\.bind\(area\)/);
  assert.match(helper, /api\?\.storage\?\.onChanged\?\.addListener/);
  assert.match(helper, /current\.api\.tabs\.query/);
  assert.match(helper, /image\.referrerPolicy = "no-referrer"/);
});

test("site icon choice is persisted and reused by another Keepit context", async () => {
  const storage = createStorage();
  const origin = "https://example.test";
  const s2Url = `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(origin)}&sz=128`;
  const allowed = new Set([s2Url]);
  const firstRequests = [];
  const firstResolver = createContext(storage, allowed, firstRequests);
  const firstImage = new (createImageClass(allowed, firstRequests))();
  const firstFallback = { hidden:false };
  const chosen = await firstResolver.load(firstImage, `${origin}/article?private=not-cached`, { fallbackElement:firstFallback });
  assert.equal(chosen, s2Url);
  assert.equal(firstImage.hidden, false);
  assert.equal(firstFallback.hidden, true);
  await new Promise(resolve => setTimeout(resolve, 130));
  assert.equal(storage.values[firstResolver.cacheKey][origin].url, s2Url);
  assert.doesNotMatch(JSON.stringify(storage.values[firstResolver.cacheKey]), /private=not-cached|another-page|\/article\?/);

  const secondRequests = [];
  const secondResolver = createContext(storage, allowed, secondRequests);
  const secondImage = new (createImageClass(allowed, secondRequests))();
  const secondFallback = { hidden:false };
  const reused = await secondResolver.load(secondImage, `${origin}/another-page`, { fallbackElement:secondFallback });
  assert.equal(reused, s2Url);
  assert.equal(secondRequests.length, 1, "the second context starts directly with the shared cached icon URL");
  assert.equal(secondRequests[0], s2Url);
  assert.equal(secondImage.hidden, false);
  assert.equal(secondFallback.hidden, true);
  assert.equal(storage.reads, 3, "each extension context reads the shared persistent cache once; persisting a new result reads once to merge concurrent entries");
});

test("a failed favicon lookup leaves the caller’s default icon visible", async () => {
  const storage = createStorage();
  const requests = [];
  const resolver = createContext(storage, new Set(), requests);
  const image = new (createImageClass(new Set(), requests))();
  const fallback = { hidden:false };
  assert.equal(await resolver.load(image, "https://missing-icon.test/article", { fallbackElement:fallback }), "");
  assert.equal(image.hidden, true);
  assert.equal(fallback.hidden, false);
  assert.ok(requests.length > 0);
});

test("an open matching site tab contributes its browser-selected favicon before network fallbacks", async () => {
  const storage = createStorage();
  const origin = "https://open-site.test";
  const tabIcon = `${origin}/assets/site-icon-192.png`;
  const queries = [];
  storage.browser.tabs = { async query(query) {
    queries.push(query);
    return [{ url:`${origin}/article`, favIconUrl:tabIcon }];
  } };
  const requests = [];
  const resolver = createContext(storage, new Set([tabIcon]), requests);
  const image = new (createImageClass(new Set([tabIcon]), requests))();
  assert.equal(await resolver.load(image, `${origin}/article?private=not-cached`), tabIcon);
  assert.equal(requests[0], tabIcon, "the browser-selected high-resolution icon is tried first");
  assert.deepEqual(JSON.parse(JSON.stringify(queries)), [{ url:`${origin}/*` }]);
});
