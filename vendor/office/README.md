# Local Office renderer dependencies

`office.mjs` bundles these pinned npm packages for browser use. It contains no remote runtime imports:

- `docx-preview@0.4.1` — Apache-2.0
- `@jvmr/pptx-to-html@1.1.2` — MIT
- `jszip@3.10.1` — distributed under its MIT option
- `dompurify@3.4.18` — distributed under its Apache-2.0 option

Full upstream licences are in `../../licenses/`. Upstream legal comments are retained in the bundle. JSZip's browser distribution includes its own dependencies and notices.

To rebuild, use a temporary directory **outside** the repository, install those versions plus `esbuild@0.25.12`, copy `entry.mjs` there and run:

```sh
npx esbuild entry.mjs --bundle --platform=browser --format=esm --target=chrome130,firefox147 --minify --legal-comments=inline --outfile=office.mjs
```

One intentional hardening change is applied to JSZip's bundled `setImmediate` polyfill: its string-to-`Function` callback fallback is replaced with a `TypeError` for non-function callbacks. JSZip supplies function callbacks; opening documents does not require or enable `unsafe-eval`. Reapply this small change before replacing the packaged bundle. Normalise line endings and trailing formatting whitespace as in the checked-in assets; licence wording and runtime behaviour are unchanged.

`../../js/dashboard/documents-renderers.js` applies archive expansion limits, removes active/external elements and sanitises styles before placing Office content into a clipped original-page surface. DOCX alternative HTML chunks are disabled. The document page has its own stricter resource CSP. Fonts, advanced Office objects and animations are not guaranteed to match Microsoft Office; the UI recommends a static PDF when exact pagination is needed.
