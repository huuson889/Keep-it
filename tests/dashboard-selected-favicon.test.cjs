const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(path.join(__dirname, "../js/dashboard/lr-practice-demo.js"), "utf8");

test("selected source page loads its site favicon with the existing fallback chain", () => {
  assert.match(source, /function setSelectedFavicon\(pageUrl\)/);
  assert.match(source, /new URL\(pageUrl\)\.origin/);
  assert.match(source, /\$\{origin\}\/favicon\.ico/);
  assert.match(source, /https:\/\/www\.google\.com\/s2\/favicons\?domain_url=/);
  assert.match(source, /img\.dataset\.fallbackUsed/);
  assert.match(source, /setSelectedFavicon\(selected\.url\)/);
});
