// Adds an invisible, searchable text layer to a PDF from OCR line boxes.
// `PDFLib` and `fontkit` are the globals (or imported namespaces) of pdf-lib and fontkit.
// pages: [{ n, s, pdfH, lines: [{ text, box: [l, t, r, b] }] }]
//   n: 1-based page number, s: canvas pixels per PDF point, pdfH: page height in points.
export async function addTextLayer({ PDFLib: P, fontkit, pdfBytes, fontBytes, pages }) {
  const out = await P.PDFDocument.load(pdfBytes);
  out.registerFontkit(fontkit);
  const font = await out.embedFont(fontBytes, { subset: true });

  let written = 0, skipped = 0;
  for (const p of pages) {
    const page = out.getPage(p.n - 1);
    const key = page.node.newFontDictionary('OCR', font.ref);
    for (const line of p.lines) {
      const [l, t, r, b] = line.box;
      const x = l / p.s;
      const y = p.pdfH - b / p.s;          // PDF origin is bottom-left
      const width = (r - l) / p.s;
      const height = (b - t) / p.s;
      try {
        const size = height / font.heightAtSize(1);
        const text = line.text + ' ';
        const raw = font.widthOfTextAtSize(text, size);
        if (!raw || width <= 0) { skipped++; continue; }
        const sx = width / raw;            // stretch glyphs to the detected width
        page.pushOperators(
          P.pushGraphicsState(),
          P.beginText(),
          P.setTextRenderingMode(P.TextRenderingMode.Invisible),
          P.setFontAndSize(key, size),
          P.setTextMatrix(sx, 0, 0, 1, x, y),
          P.showText(font.encodeText(text)),
          P.endText(),
          P.popGraphicsState(),
        );
        written++;
      } catch (e) {
        skipped++;                          // e.g. a character the embedded font cannot encode
      }
    }
  }
  return { bytes: await out.save(), written, skipped };
}
