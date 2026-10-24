# Third-Party Notices

Keepit includes or adapts the components below. Each component remains subject to its own license; the Keepit proprietary notice does not replace or restrict those licenses. The complete license texts are included under [`licenses/`](licenses/).

| Component | Version / source | Use in Keepit | License | Full text |
| --- | --- | --- | --- | --- |
| `flag-icons` | [github.com/lipis/flag-icons](https://github.com/lipis/flag-icons) — source version to verify before release | Country-flag SVGs adapted/minified in `bilingual-flags.js` | MIT | [`licenses/LICENSE-MIT-flag-icons.txt`](licenses/LICENSE-MIT-flag-icons.txt) |
| Twemoji Country Flags font | `country-flag-emoji-polyfill` v0.1.0; [TalkJS repository](https://github.com/talkjs/country-flag-emoji-polyfill) | Bundled WOFF2 flag subset for native language/speech selects; detection code adapted in `flags.js` | MIT (adapted detection code) and CC BY 4.0 (Twemoji artwork) | [`licenses/LICENSE-TWEMOJI-COUNTRY-FLAGS.md`](licenses/LICENSE-TWEMOJI-COUNTRY-FLAGS.md) |
| `webextension-polyfill` | v0.12.0; [Mozilla GitHub repository](https://github.com/mozilla/webextension-polyfill) | `browser-polyfill.js` | MPL-2.0 | [`licenses/LICENSE-MPL-2.0-webextension-polyfill.txt`](licenses/LICENSE-MPL-2.0-webextension-polyfill.txt) |
| Lucide icons | Source/version to verify against the bundled icon paths; [lucide.dev](https://lucide.dev/) | Inline Lucide-derived SVG icon paths | ISC | [`licenses/LICENSE-ISC-lucide.txt`](licenses/LICENSE-ISC-lucide.txt) |
| Mozilla Readability | Version/source revision to verify before release; [github.com/mozilla/readability](https://github.com/mozilla/readability) | `lib/Readability.js`, `lib/Readability-readerable.js` | Apache-2.0 | [`licenses/LICENSE-Apache-2.0-Mozilla-Readability.txt`](licenses/LICENSE-Apache-2.0-Mozilla-Readability.txt); original notices remain in both source files |

The versions for components whose source revision is not recorded in this repository must be verified and filled in before a public release. Preserve any upstream `NOTICE` file or additional attribution that applies to the exact version distributed.

The Twemoji Country Flags font is bundled locally at `fonts/TwemojiCountryFlags.woff2` and is loaded only on the Dashboard when color emoji are supported but country-flag glyphs are not. The font subset covers flag codepoints only; no flag assets are fetched from a CDN.
