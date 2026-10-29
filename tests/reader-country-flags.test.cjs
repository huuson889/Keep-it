const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const flagHelperSource = fs.readFileSync(path.join(root, 'js/reader/bilingual-flags.js'), 'utf8');
const readerSource = fs.readFileSync(path.join(root, 'js/reader/bilingual-reader.js'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));

function loadFlagHelper() {
  const sandbox = { globalThis: null };
  sandbox.globalThis = sandbox;
  vm.runInNewContext(flagHelperSource, sandbox, { filename: 'bilingual-flags.js' });
  return sandbox.LHN_FLAGS;
}

function flagFor(code) {
  return Array.from(code, character => String.fromCodePoint(0x1f1e6 + character.charCodeAt(0) - 65)).join('');
}

test('Reader country flag helper maps supported regions and aliases to Unicode flags', () => {
  const flags = loadFlagHelper();
  assert.ok(Object.keys(flags.regionKeys).length >= 80);
  for (const [region, countryCode] of Object.entries(flags.regionKeys)) {
    assert.equal(flags.emojiForRegion(region), flagFor(countryCode), region);
  }
  assert.equal(flags.emojiForRegion('CANS'), flagFor('CA'));
  assert.equal(flags.emojiForRegion('uk'), flagFor('GB'));
  assert.equal(flags.emojiForRegion('unknown-region'), flagFor('US'));
  assert.doesNotMatch(flagHelperSource, /<svg|FLAG_SVGS|flag-icons/i);
});

test('Reader uses the bundled Twemoji font at 54px and declares it web-accessible', () => {
  const resources = manifest.web_accessible_resources.flatMap(entry => entry.resources);
  assert.ok(resources.includes('assets/fonts/TwemojiCountryFlags.woff2'));
  assert.ok(fs.statSync(path.join(root, 'assets/fonts/TwemojiCountryFlags.woff2')).size > 0);
  assert.match(readerSource, /getURL\?\.\("assets\/fonts\/TwemojiCountryFlags\.woff2"\)/);
  assert.match(readerSource, /@font-face\s*\{[^}]*Twemoji Country Flags[^}]*url\("\$\{flagFontUrl\}"\)/s);
  assert.match(readerSource, /\.lhn-br-flag\{[^}]*font-size:54px!important/s);
  assert.match(readerSource, /flagEmojiForRegion\(/);
  assert.doesNotMatch(readerSource, /FLAG_SVGS|flagSvgForRegion|<svg[^>]*(?:flag|🇺🇸|🇻🇳)/i);
});
