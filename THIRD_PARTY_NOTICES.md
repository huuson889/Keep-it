# Third-Party Notices

Keepit includes or adapts the components below. Each component remains subject to its own license; the Keepit proprietary notice does not replace or restrict those licenses. The complete license texts are included under [`licenses/`](licenses/).

| Component | Version / source | Use in Keepit | License | Full text |
| --- | --- | --- | --- | --- |
| Twemoji Country Flags font | `country-flag-emoji-polyfill` v0.1.0; [TalkJS repository](https://github.com/talkjs/country-flag-emoji-polyfill) | Bundled WOFF2 flag subset for Dashboard language/speech selects and Bilingual Reader voice flags; Dashboard detection code in `js/dashboard/flags.js` | MIT (adapted detection code) and CC BY 4.0 (Twemoji artwork) | [`licenses/LICENSE-TWEMOJI-COUNTRY-FLAGS.md`](licenses/LICENSE-TWEMOJI-COUNTRY-FLAGS.md) |
| `webextension-polyfill` | v0.12.0; [Mozilla GitHub repository](https://github.com/mozilla/webextension-polyfill) | `js/core/browser-polyfill.js` | MPL-2.0 | [`licenses/LICENSE-MPL-2.0-webextension-polyfill.txt`](licenses/LICENSE-MPL-2.0-webextension-polyfill.txt) |
| Lucide icons | Source/version to verify against the bundled icon paths; [lucide.dev](https://lucide.dev/) | Inline Lucide-derived SVG icon paths | ISC | [`licenses/LICENSE-ISC-lucide.txt`](licenses/LICENSE-ISC-lucide.txt) |
| Mozilla Readability | Version/source revision to verify before release; [github.com/mozilla/readability](https://github.com/mozilla/readability) | `vendor/readability/Readability.js`, `vendor/readability/Readability-readerable.js` | Apache-2.0 | [`licenses/LICENSE-Apache-2.0-Mozilla-Readability.txt`](licenses/LICENSE-Apache-2.0-Mozilla-Readability.txt); original notices remain in both source files |
| Transformers.js | `@huggingface/transformers` v3.8.1; [github.com/huggingface/transformers.js](https://github.com/huggingface/transformers.js) | `vendor/transformers/transformers.min.js` (bundled subset: tokenizer, token-classification model, Tensor) for Word class | Apache-2.0 | [`licenses/LICENSE-Apache-2.0-transformers.js.txt`](licenses/LICENSE-Apache-2.0-transformers.js.txt) |
| `@huggingface/jinja` | v0.5.13 (dependency of Transformers.js, inside the same bundle) | `vendor/transformers/transformers.min.js` | MIT | [`licenses/LICENSE-MIT-huggingface-jinja.txt`](licenses/LICENSE-MIT-huggingface-jinja.txt) |
| ONNX Runtime Web | `onnxruntime-web` v1.22.0-dev.20250409-89f8206ba4 (+ `onnxruntime-common` v1.21.0); [github.com/microsoft/onnxruntime](https://github.com/microsoft/onnxruntime) | `vendor/transformers/transformers.min.js`, `vendor/transformers/ort-wasm-simd-threaded.mjs`, `vendor/transformers/ort-wasm-simd-threaded.wasm` | MIT; the WebAssembly build contains third-party components listed in ONNX Runtime's notices | [`licenses/LICENSE-MIT-onnxruntime-web.txt`](licenses/LICENSE-MIT-onnxruntime-web.txt), [`licenses/NOTICE-onnxruntime-third-party.txt`](licenses/NOTICE-onnxruntime-third-party.txt) |
| Web thumbnail photo (lofi) | Unsplash photo `photo-1518709268805-4e9042af9f23`; source: [images.unsplash.com](https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1600&auto=format&fit=crop); photographer not recorded | `assets/images/web-thumbnail-lofi.webp` (converted to WebP, 1600×2421); default artwork for the web-page source card | [Unsplash License](https://unsplash.com/license) | [unsplash.com/license](https://unsplash.com/license) |

| PDF.js | `pdfjs-dist` 5.6.205; [mozilla/pdf.js](https://github.com/mozilla/pdf.js) | Local PDF renderer, worker, CMaps, standard fonts and image decoders in `vendor/pdfjs/` | Apache-2.0; font/decoder subcomponent licences retained | [`licenses/LICENSE-pdfjs.txt`](licenses/LICENSE-pdfjs.txt); additional notices in `vendor/pdfjs/cmaps`, `standard_fonts`, `wasm` |
| docx-preview | 0.4.1; [VolodymyrBaydalka/docxjs](https://github.com/VolodymyrBaydalka/docxjs) | Read-only local DOCX layout in `vendor/office/office.mjs` | Apache-2.0 | [`licenses/LICENSE-docx-preview.txt`](licenses/LICENSE-docx-preview.txt) |
| pptx-to-html | `@jvmr/pptx-to-html` 1.1.2; [javier-mora/pptx-to-html](https://github.com/javier-mora/pptx-to-html) | Retained in the Office bundle; the PPTX rendering path uses first-party OOXML/SVG code from 3.5.630 | MIT | [`licenses/LICENSE-pptx-to-html.txt`](licenses/LICENSE-pptx-to-html.txt) |
| Pangolin Regular | Google Fonts Pangolin project; full TTF packaged locally | `assets/fonts/Pangolin-Regular.ttf`, scoped KeepitPangolin face for direct PPTX text; does not decode compressed Office font embeddings | SIL Open Font License 1.1 | [`licenses/LICENSE-pangolin.txt`](licenses/LICENSE-pangolin.txt) |
| JSZip | 3.10.1; [Stuk/jszip](https://github.com/Stuk/jszip) | Local OOXML ZIP reading in the Office bundle | MIT option | [`licenses/LICENSE-jszip.txt`](licenses/LICENSE-jszip.txt) |
| DOMPurify | 3.4.18; [cure53/DOMPurify](https://github.com/cure53/DOMPurify) | Sanitises rendered Office markup before attachment | Apache-2.0 option | [`licenses/LICENSE-dompurify.txt`](licenses/LICENSE-dompurify.txt) |

The Office bundle keeps upstream legal comments. Its setImmediate polyfill rejects string callbacks rather than compiling them with Function; no unsafe-eval permission is used. Pinned rebuild information is in `vendor/office/README.md`. PDF resources and Office code are packaged locally, not loaded from a CDN.

The versions for components whose source revision is not recorded in this repository must be verified and filled in before a public release. Preserve any upstream `NOTICE` file or additional attribution that applies to the exact version distributed.

The Twemoji Country Flags font is bundled locally at `assets/fonts/TwemojiCountryFlags.woff2`. The Dashboard loads it as a fallback when country-flag glyphs are missing; the Bilingual Reader loads it for its 54px voice-flag glyphs. The font subset covers flag codepoints only; no flag assets are fetched from a CDN.

The web thumbnail photo is bundled locally at `assets/images/web-thumbnail-lofi.webp`; Keepit does not request it from Unsplash at runtime. The photographer's name was not recorded when the photo was first added; attribution is not required by the Unsplash License but will be added if the original photo page is identified.

The Word class model (`jdp8/bert-english-uncased-finetuned-pos`, ONNX export of `vblagoje/bert-english-uncased-finetuned-pos`, file `onnx/model_quantized.onnx`) is not bundled: Keepit downloads it from huggingface.co only after the user agrees, and keeps it in the browser's cache. Neither model card declares a license; check the model's terms before a public release.

## OCR integration from approved demo 2.9.7.33

| Component | Source / verification | Use | License |
| --- | --- | --- | --- |
| Tesseract.js, Tesseract core | Approved demo `tess-v9/`; exact package versions not independently verified | Packaged worker and SIMD/non-SIMD LSTM WASM wrappers | Apache-2.0; `licenses/ocr-demo/LICENSE-tesseract.txt`, `LICENSE-core.txt` |
| Tesseract language data | Approved demo `tess-v9-data/`, eng/vie/kor | Offline recognition; no model CDN | Apache-2.0; `licenses/ocr-demo/LICENSE-tessdata.txt` |
| pdf-lib | 1.17.1, bundle byte-compared to npm package | Searchable PDF export | MIT; `licenses/ocr-demo/LICENSE-pdf-lib.txt` |
| @pdf-lib/fontkit | 1.1.1, bundle byte-compared to npm package | Font subsetting for PDF export | MIT; `licenses/ocr-demo/LICENSE-fontkit.txt` (from npm package, https://github.com/Hopding/fontkit) |
| Noto Sans KR Thin | Font metadata: 2.004-H2; approved demo `fusor/vendor/font.ttf` | Unicode PDF text | SIL OFL-1.1; `licenses/ocr-demo/LICENSE-NotoSansKR.txt` |

OCR markup, scoped style declarations, hover/region helpers and image preprocessing are derived directly from the approved OCR demo, not rejected Keepit test builds. PP-OCR/Fusor runtimes/models are not bundled by this integration.

Integration UI correction (3.5.615): scan and rectangle layers are rendered in display pixels independently of native document scale; selectable text remains in the app layer. No third-party runtime/model changes.

Continuous OCR navigation correction (3.5.616) uses the browser’s native smooth scrolling; no additional runtime, animation library, model or third-party dependency is bundled.

OCR sidebar width and progress-popup layering adjustment (3.5.617) changes first-party UI CSS only; no third-party dependency, runtime, model or license changes.

Right-edge alignment of OCR progress and region-editing popups (3.5.618) changes first-party CSS only; no third-party runtime, model or license changes.

Responsive OCR integration (3.5.619) changes first-party presentation, controls, localized labels and draft lifecycle only. No third-party runtime, model, asset or license has changed.

Presentation corrections (3.5.620) use the already approved OCR SVG geometry and first-party shared controls/materials. No third-party runtime, model or license changes.

Pager field correction (3.5.621) changes first-party CSS only; no third-party runtime, asset, model or license changes.

Tools-sheet OCR entry and shared toolbar glyphs (3.5.622) reuse existing first-party UI and existing glyph geometry; no new third-party dependency, model, runtime or license.

Filled file-kind labels (3.5.623) use the approved first-party demo v5 SVGs; no third-party dependency, asset, model, runtime or license changes.

File-label placement correction (3.5.624) reuses the same approved glyphs; no third-party asset, dependency, model, runtime or license changes.

Native-selection correction (3.5.625) changes first-party OCR overlay hit-testing only; no dependency, runtime, model, asset or license changes.

Document hint placement (3.5.626) reuses the first-party shared suggestion popup/bulb; no dependency, model, runtime, asset or license changes.

Office suggestion action correction (3.5.627) reuses existing first-party controls and localized strings; no third-party changes.

Higher-resolution document previews (3.5.628) reuse the existing local PDF/Office/image renderers; no added libraries, models, assets, network services or license changes.

PDF selection-anchor correction (3.5.629) uses first-party DOM Range geometry and the existing shared toolbar; no dependency, model, asset or license changes.

Direct Office reading (3.5.630) adds a first-party OOXML/SVG renderer and the Pangolin font above. It reuses the existing JSZip/docx-preview/DOMPurify bundle; no server-side Office converter or runtime network dependency is added.
