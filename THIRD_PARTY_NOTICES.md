# Third-Party Notices

Keepit includes or adapts the components below. Each component remains subject to its own license; the Keepit proprietary notice does not replace or restrict those licenses. The complete license texts are included under [`licenses/`](licenses/).

| Component | Version / source | Use in Keepit | License | Full text |
| --- | --- | --- | --- | --- |
| `flag-icons` | [github.com/lipis/flag-icons](https://github.com/lipis/flag-icons) — source version to verify before release | Country-flag SVGs adapted/minified in `bilingual-flags.js` | MIT | [`licenses/LICENSE-MIT-flag-icons.txt`](licenses/LICENSE-MIT-flag-icons.txt) |
| `webextension-polyfill` | v0.12.0; [Mozilla GitHub repository](https://github.com/mozilla/webextension-polyfill) | `browser-polyfill.js` | MPL-2.0 | [`licenses/LICENSE-MPL-2.0-webextension-polyfill.txt`](licenses/LICENSE-MPL-2.0-webextension-polyfill.txt) |
| Lucide icons | Source/version to verify against the bundled icon paths; [lucide.dev](https://lucide.dev/) | Inline Lucide-derived SVG icon paths | ISC | [`licenses/LICENSE-ISC-lucide.txt`](licenses/LICENSE-ISC-lucide.txt) |
| Mozilla Readability | Version/source revision to verify before release; [github.com/mozilla/readability](https://github.com/mozilla/readability) | `lib/Readability.js`, `lib/Readability-readerable.js` | Apache-2.0 | [`licenses/LICENSE-Apache-2.0-Mozilla-Readability.txt`](licenses/LICENSE-Apache-2.0-Mozilla-Readability.txt); original notices remain in both source files |

The versions for components whose source revision is not recorded in this repository must be verified and filled in before a public release. Preserve any upstream `NOTICE` file or additional attribution that applies to the exact version distributed.

The Twemoji Country Flags font used in the offline select demo is not currently bundled in the Keepit extension. If it is added later, its font/artwork attribution and license must be added here and to the distribution package before release.
