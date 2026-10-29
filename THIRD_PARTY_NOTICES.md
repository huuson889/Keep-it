# Third-Party Notices

Keepit includes or adapts the components below. Each component remains subject to its own license; the Keepit proprietary notice does not replace or restrict those licenses. The complete license texts are included under [`licenses/`](licenses/).

| Component | Version / source | Use in Keepit | License | Full text |
| --- | --- | --- | --- | --- |
| Twemoji Country Flags font | `country-flag-emoji-polyfill` v0.1.0; [TalkJS repository](https://github.com/talkjs/country-flag-emoji-polyfill) | Bundled WOFF2 flag subset for Dashboard language/speech selects and Bilingual Reader voice flags; Dashboard detection code in `js/dashboard/flags.js` | MIT (adapted detection code) and CC BY 4.0 (Twemoji artwork) | [`licenses/LICENSE-TWEMOJI-COUNTRY-FLAGS.md`](licenses/LICENSE-TWEMOJI-COUNTRY-FLAGS.md) |
| `webextension-polyfill` | v0.12.0; [Mozilla GitHub repository](https://github.com/mozilla/webextension-polyfill) | `js/core/browser-polyfill.js` | MPL-2.0 | [`licenses/LICENSE-MPL-2.0-webextension-polyfill.txt`](licenses/LICENSE-MPL-2.0-webextension-polyfill.txt) |
| Lucide icons | Source/version to verify against the bundled icon paths; [lucide.dev](https://lucide.dev/) | Inline Lucide-derived SVG icon paths | ISC | [`licenses/LICENSE-ISC-lucide.txt`](licenses/LICENSE-ISC-lucide.txt) |
| Mozilla Readability | Version/source revision to verify before release; [github.com/mozilla/readability](https://github.com/mozilla/readability) | `vendor/readability/Readability.js`, `vendor/readability/Readability-readerable.js` | Apache-2.0 | [`licenses/LICENSE-Apache-2.0-Mozilla-Readability.txt`](licenses/LICENSE-Apache-2.0-Mozilla-Readability.txt); original notices remain in both source files |

The versions for components whose source revision is not recorded in this repository must be verified and filled in before a public release. Preserve any upstream `NOTICE` file or additional attribution that applies to the exact version distributed.

The Twemoji Country Flags font is bundled locally at `assets/fonts/TwemojiCountryFlags.woff2`. The Dashboard loads it as a fallback when country-flag glyphs are missing; the Bilingual Reader loads it for its 54px voice-flag glyphs. The font subset covers flag codepoints only; no flag assets are fetched from a CDN.
