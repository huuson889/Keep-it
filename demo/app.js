import * as ort from './vendor/ort.wasm.min.mjs';
import { PPOcr } from './ocr.js';
import { addTextLayer } from './textlayer.js';

const $ = (s) => document.querySelector(s);
const MAX_IMAGE_SIDE = 2400;

// Threads need cross-origin isolation (served by server.py); otherwise run on one thread.
const threads = self.crossOriginIsolated ? Math.min(navigator.hardwareConcurrency || 1, 8) : 1;
ort.env.wasm.numThreads = threads;

const log = (msg) => {
  const el = $('#log');
  el.textContent += `[${new Date().toLocaleTimeString('vi-VN')}] ${msg}\n`;
  el.scrollTop = el.scrollHeight;
};
const setStatus = (msg) => { $('#status').textContent = msg; };
const fmtMs = (ms) => (ms / 1000).toFixed(2) + ' s';

let ocr = null;
let pdfjs = null;
let doc = null;          // { kind: 'pdf', pdf, file } | { kind: 'image', bitmap, file }
let pages = [];          // results per page: { n, s, pdfW, pdfH, lines, timing }
let current = 0;
let busy = false;

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function setBusy(b) {
  busy = b;
  $('#file').disabled = b;
  $('#run').disabled = b || !ocr || !doc;
  $('#txt').disabled = b || !pages.length;
  $('#pdf').disabled = b || !pages.length || doc?.kind !== 'pdf';
  $('#prev').disabled = b || !doc || current <= 0;
  $('#next').disabled = b || !doc || current >= pageCount() - 1;
  $('#detLimit').disabled = b;
  $('#scale').disabled = b;
}

const pageCount = () => (doc?.kind === 'pdf' ? doc.pdf.numPages : doc ? 1 : 0);

// ---- models ---------------------------------------------------------------

async function loadModels() {
  const t0 = performance.now();
  const get = async (url) => {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`Không tải được ${url} (HTTP ${r.status})`);
    return r.arrayBuffer();
  };
  const [det, rec, dictBuf] = await Promise.all([
    get('models/det.onnx'), get('models/rec.onnx'), get('models/dict.txt'),
  ]);
  ocr = await PPOcr.create({
    ort,
    models: { det, rec, dict: new TextDecoder('utf-8').decode(dictBuf) },
    makeCanvas,
    options: { detLimit: Number($('#detLimit').value) },
  });
  $('#modelStatus').textContent =
    `Đã nạp model trong ${fmtMs(performance.now() - t0)} (${ocr.chars.length} lớp ký tự).`;
  $('#runtime').textContent =
    `ONNX Runtime Web ${ort.env.versions?.web ?? ''} · ${threads} luồng · cross-origin isolated: ${self.crossOriginIsolated}`;
  log(`Model sẵn sàng; ${threads} luồng.`);
}

// ---- rendering -------------------------------------------------------------

async function renderPage(i) {
  if (doc.kind === 'pdf') {
    const page = await doc.pdf.getPage(i + 1);
    const vp1 = page.getViewport({ scale: 1 });
    const s = Number($('#scale').value);
    const vp = page.getViewport({ scale: s });
    const canvas = makeCanvas(Math.ceil(vp.width), Math.ceil(vp.height));
    const cx = canvas.getContext('2d', { willReadFrequently: true });
    cx.fillStyle = 'white';
    cx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: cx, viewport: vp }).promise;
    page.cleanup();
    return { n: i + 1, s, pdfW: vp1.width, pdfH: vp1.height, canvas };
  }
  const bmp = doc.bitmap;
  const k = Math.min(1, MAX_IMAGE_SIDE / Math.max(bmp.width, bmp.height));
  const canvas = makeCanvas(Math.round(bmp.width * k), Math.round(bmp.height * k));
  canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return { n: 1, s: k, pdfW: null, pdfH: null, canvas };
}

// ---- file handling ---------------------------------------------------------

async function openFile(file) {
  pages = [];
  current = 0;
  $('#rows').innerHTML = '';
  $('#timing').textContent = '';
  $('#progress').value = 0;
  if (!file) { doc = null; setBusy(false); return; }
  setStatus('Đang mở tệp…');
  const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
  if (isPdf) {
    if (!pdfjs) {
      pdfjs = await import('./vendor/pdf.min.mjs');
      pdfjs.GlobalWorkerOptions.workerSrc = './vendor/pdf.worker.min.mjs';
    }
    const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer(), isEvalSupported: false }).promise;
    doc = { kind: 'pdf', pdf, file };
  } else {
    doc = { kind: 'image', bitmap: await createImageBitmap(file), file };
  }
  setStatus(`Đã mở ${pageCount()} trang.`);
  log(`Mở tệp ${file.name}: ${pageCount()} trang.`);
  await showPage(0);
  setBusy(false);
}

// ---- OCR -------------------------------------------------------------------

async function runOcr() {
  if (!doc || !ocr || busy) return;
  setBusy(true);
  ocr.opt.detLimit = Number($('#detLimit').value);
  pages = [];
  const total = pageCount();
  const t0 = performance.now();
  for (let i = 0; i < total; i++) {
    setStatus(`Trang ${i + 1}/${total}: đang render và OCR…`);
    const page = await renderPage(i);
    const res = await ocr.run(page.canvas);
    pages.push({ n: page.n, s: page.s, pdfW: page.pdfW, pdfH: page.pdfH, lines: res.lines, timing: res.timing });
    const t = res.timing;
    log(`Trang ${i + 1}: ${res.lines.length} dòng; phát hiện ${fmtMs(t.detMs)}, nhận dạng ${fmtMs(t.recMs)}, tổng ${fmtMs(t.totalMs)}.`);
    $('#progress').value = (i + 1) / total;
    if (i === current) await showPage(i);
    await new Promise((r) => setTimeout(r, 0)); // keep the UI responsive between pages
  }
  const elapsed = performance.now() - t0;
  setStatus(`Xong ${total} trang trong ${fmtMs(elapsed)} (không tính nạp model).`);
  log(`Hoàn tất ${total} trang trong ${fmtMs(elapsed)}.`);
  setBusy(false);
}

// ---- viewing ---------------------------------------------------------------

async function showPage(i) {
  current = i;
  const page = await renderPage(i);
  const view = $('#view');
  view.width = page.canvas.width;
  view.height = page.canvas.height;
  const cx = view.getContext('2d');
  cx.drawImage(page.canvas, 0, 0);

  const res = pages.find((p) => p.n === i + 1);
  if (res && $('#showBoxes').checked) {
    cx.lineWidth = Math.max(1, view.width / 900);
    cx.strokeStyle = 'rgba(220, 40, 40, 0.85)';
    for (const line of res.lines) {
      const [l, t, r, b] = line.box;
      cx.strokeRect(l, t, r - l, b - t);
    }
  }

  $('#pageInfo').textContent = `Trang ${i + 1} / ${pageCount()}`;
  $('#pageNo').textContent = `${i + 1}`;
  if (res) {
    $('#timing').textContent =
      `Phát hiện ${fmtMs(res.timing.detMs)} · nhận dạng ${fmtMs(res.timing.recMs)} · ${res.lines.length} dòng.`;
    $('#rows').innerHTML = res.lines.map((l, k) =>
      `<tr><td>${k + 1}</td><td class="conf">${l.conf.toFixed(3)}</td><td></td></tr>`).join('');
    const cells = $('#rows').querySelectorAll('td:last-child');
    res.lines.forEach((l, k) => { cells[k].textContent = l.text; });
  } else {
    $('#timing').textContent = 'Chưa OCR trang này.';
    $('#rows').innerHTML = '';
  }
  setBusy(busy);
}

// ---- export ----------------------------------------------------------------

function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

function exportTxt() {
  const text = pages.map((p) => `--- Trang ${p.n} ---\n` + p.lines.map((l) => l.text).join('\n')).join('\n\n');
  download(new Blob([text], { type: 'text/plain;charset=utf-8' }), 'ket-qua-ocr.txt');
}

// Writes each recognized line as invisible text at its box position (see textlayer.js).
// The original PDF pages are kept; only a text layer is added.
async function exportPdf() {
  if (!window.PDFLib || !window.fontkit) throw new Error('Không nạp được pdf-lib/fontkit.');
  const pdfBytes = await doc.file.arrayBuffer();
  const fontBytes = await (await fetch('vendor/font.ttf')).arrayBuffer();
  const res = await addTextLayer({ PDFLib: window.PDFLib, fontkit: window.fontkit, pdfBytes, fontBytes, pages });
  download(new Blob([res.bytes], { type: 'application/pdf' }),
    doc.file.name.replace(/\.pdf$/i, '') + '-co-lop-chu.pdf');
  setStatus(`Đã xuất PDF: ${res.written} dòng chữ ẩn; bỏ qua ${res.skipped}.`);
  log(`Xuất PDF: ${res.written} dòng, bỏ qua ${res.skipped}.`);
}

// ---- wiring ----------------------------------------------------------------

$('#file').onchange = (e) => openFile(e.target.files[0]).catch((err) => {
  setStatus('Lỗi mở tệp: ' + err.message);
  log('Lỗi mở tệp: ' + err.message);
  setBusy(false);
});
$('#run').onclick = () => runOcr().catch((err) => {
  setStatus('Lỗi OCR: ' + err.message);
  log('Lỗi OCR: ' + err.message);
  setBusy(false);
});
$('#txt').onclick = exportTxt;
$('#pdf').onclick = () => exportPdf().catch((err) => {
  setStatus('Lỗi xuất PDF: ' + err.message);
  log('Lỗi xuất PDF: ' + err.message);
});
$('#prev').onclick = () => showPage(current - 1).catch((e) => log('Lỗi: ' + e.message));
$('#next').onclick = () => showPage(current + 1).catch((e) => log('Lỗi: ' + e.message));
$('#showBoxes').onchange = () => showPage(current).catch((e) => log('Lỗi: ' + e.message));

loadModels()
  .then(() => { setBusy(false); setStatus('Chọn ảnh hoặc PDF rồi bấm Chạy OCR.'); })
  .catch((err) => {
    $('#modelStatus').textContent = 'Lỗi nạp model: ' + err.message;
    log('Lỗi nạp model: ' + err.message);
  });
