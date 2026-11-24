// Xuất PDF có lớp chữ ẩn — mục 9 của docs/ocr-demo-2.9.7.26-chuc-nang.md.
// Dùng pdf-lib + fontkit nhúng sẵn (vendor/ocr/pdf-lib), font Liberation Sans có sẵn
// trong vendor/pdfjs/standard_fonts nên không cần mạng. Chữ vẽ với opacity 0 (lớp chữ ẩn):
// bản PDF trông y như bản gốc nhưng chọn/sao chép/tìm kiếm được.
(() => {
  'use strict';
  if (globalThis.LHN_OCR_EXPORT) return;

  const docs = () => globalThis.LHN_DOCUMENTS_OCR;
  const bridge = () => globalThis.KEEPIT_OCR_BRIDGE;
  const FONT_URL = '../vendor/pdfjs/standard_fonts/LiberationSans-Regular.ttf';

  async function loadFont() {
    const response = await fetch(FONT_URL);
    if (!response.ok) throw new Error('ocrPdfFail');
    return new Uint8Array(await response.arrayBuffer());
  }

  function save(blob, name) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 5000);
  }

  /* Trả về {count, pages}: số khung chữ đã nhúng và số trang có chữ. */
  async function pdf() {
    const info = docs()?.info?.();
    if (!info) throw new Error('ocrNoDocument');
    if (info.type !== 'pdf') throw new Error('ocrPdfOnlyPdf');
    const results = bridge()?.results;
    if (!results || !results.size) throw new Error('ocrPdfNoResult');
    const bytes = await docs()?.sourceBytes?.();
    if (!bytes) throw new Error('ocrPdfNoFile');
    const PDFLib = globalThis.PDFLib, fontkit = globalThis.fontkit;
    if (!PDFLib?.PDFDocument || !fontkit) throw new Error('ocrPdfFail');

    const doc = await PDFLib.PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false });
    doc.registerFontkit(fontkit);
    const font = await doc.embedFont(await loadFont(), { subset: true });
    const pageCount = doc.getPageCount();
    let count = 0, pages = 0;

    for (const [pageNo, result] of [...results].sort((a, b) => a[0] - b[0])) {
      if (pageNo < 1 || pageNo > pageCount) continue;
      const page = doc.getPage(pageNo - 1);
      const { width, height } = page.getSize();
      let drew = 0;
      for (const box of result.boxes || []) {
        const text = String(box?.text || '').trim();
        const [x0, y0, x1, y1] = box?.rect || [];
        if (!text || !(x1 > x0) || !(y1 > y0)) continue;
        const size = Math.max(1, (y1 - y0) * height);
        try {
          page.drawText(text, {
            x: x0 * width,
            y: height - y1 * height,
            size,
            font,
            opacity: 0
          });
          count++; drew++;
        } catch { /* glyph không có trong font ⇒ bỏ đúng từ đó, không làm hỏng cả tệp */ }
      }
      if (drew) pages++;
    }
    if (!count) throw new Error('ocrPdfNoResult');

    const out = await doc.save();
    const name = String(info.name || 'keepit').replace(/\.pdf$/i, '') + '-co-lop-chu.pdf';
    save(new Blob([out], { type: 'application/pdf' }), name);
    return { count, pages };
  }

  globalThis.LHN_OCR_EXPORT = Object.freeze({ pdf });
})();
