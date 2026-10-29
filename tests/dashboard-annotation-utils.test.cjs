const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "../js/dashboard/annotation-utils.js"), "utf8");
const context = { URL };
vm.runInNewContext(source, context);
const utils = context.LHN_ANNOTATION_UTILS.create({ unknownSite:() => "Unknown website" });

test("annotation metadata derives a readable site and normalizes duplicate tags", () => {
  const item = { url:"https://www.bbc.co.uk/learning/", tags:[" news ", "News", "English"] };
  assert.equal(utils.siteOf(item), "Www.bbc.co.uk");
  assert.deepEqual(Array.from(utils.tagsOf(item)), ["news", "English"]);
});

test("annotation metadata supports legacy tag strings and unknown sites", () => {
  assert.deepEqual(Array.from(utils.tagsOf({ tags:" alpha, beta,ALPHA " })), ["alpha", "beta"]);
  assert.equal(utils.siteOf({}), "Unknown website");
});

test("page keys are available on dashboard instances and preserve all fallbacks", () => {
  for (const api of [utils, context.LHN_ANNOTATION_UTILS]) {
    assert.equal(api.pageKey({ url:"https://example.com/a" }), "https://example.com/a");
    assert.equal(api.pageKey({ hostname:"example.org" }), "example.org");
    assert.equal(api.pageKey({ title:"A saved page" }), "A saved page");
    assert.equal(api.pageKey({}), "unknown");
  }
});
