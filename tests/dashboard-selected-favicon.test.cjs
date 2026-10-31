const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const source = read("js/dashboard/lr-practice-demo.js");
const page = read("pages/lr-practice-demo.html");

test("selected source page delegates its site icon to the shared resolver with a local fallback", () => {
  assert.match(source, /function setSelectedFavicon\(pageUrl\)/);
  assert.match(source, /host\.innerHTML=icon\('file'\)/);
  assert.match(source, /window\.LHN_SITE_ICONS\.load\(img,pageUrl,\{fallbackElement:fallback\}\)/);
  assert.match(source, /setSelectedFavicon\(selected\.url\)/);
  assert.doesNotMatch(source, /google\.com\/s2\/favicons|\$\{origin\}\/favicon\.ico/);
  assert.match(page, /<script src="\.\.\/js\/shared\/site-icons\.js"><\/script><script src="\.\.\/js\/shared\/thumbnails\.js"><\/script><script src="\.\.\/js\/dashboard\/lr-practice-demo\.js"><\/script>/);
  assert.match(page, /\.selected-favicon img\s*\{[^}]*position:\s*absolute;[^}]*inset:\s*0;[^}]*z-index:\s*1;/);
  assert.match(page, /\.selected-favicon \.lucide\[hidden\], \.selected-favicon img\[hidden\]\s*\{\s*display:\s*none;\s*\}/);
});

test("generic source badges use the same resolver without changing article thumbnails or branded badges", () => {
  assert.match(source, /function siteBadge\(page\)[\s\S]*?site-favicon/);
  assert.match(source, /function loadSiteBadgeFavicon\(host,pageUrl\)/);
  assert.match(source, /LHN_SITE_ICONS\.load\(image,pageUrl,\{fallbackElement:fallback\}\)/);
  assert.match(source, /loadSiteBadgeFavicon\(siteIcon,page\.url\)/);
  assert.match(source, /row\.querySelector\('\.source-thumb img'\)/);
  assert.doesNotMatch(source, /google\.com\/s2\/favicons|\$\{origin\}\/favicon\.ico/);
});
