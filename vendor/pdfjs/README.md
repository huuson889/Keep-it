# PDF.js 5.6.205

Locally packaged from npm `pdfjs-dist@5.6.205`:

- `build/pdf.min.mjs` → `pdf.mjs`
- `build/pdf.worker.min.mjs` → `pdf.worker.mjs`
- `cmaps/`, `standard_fonts/`, `wasm/` copied with their upstream notices and licences.

The full main licence is `../../licenses/LICENSE-pdfjs.txt`. Font and decoder notices are retained in their respective subdirectories.

The document renderer loads only these packaged resources. It sets `isEvalSupported:false` and `enableXfa:false`, does not execute PDF actions, and creates a selectable text layer over the rendered page. Canvas allocation is bounded and far-offscreen pages release their canvases. Original bytes and reading state are held in local IndexedDB, not uploaded to a renderer server. The viewer is read-only; OCR, XFA and interactive form editing are not implemented.
