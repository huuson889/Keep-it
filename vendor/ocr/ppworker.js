/* Worker cho cách nhận dạng "Nhanh" (PP-OCR).
   Toàn bộ nạp model + suy luận chạy ở đây để main thread rảnh:
   giao diện vẫn bấm được và nút Dừng ăn ngay (terminate worker). */
import * as ort from './ppocr/vendor/ort.wasm.min.mjs';
import {PPOcr} from './ppocr/ocr.js';

ort.env.wasm.wasmPaths = new URL('./ppocr/vendor/', import.meta.url).href;
ort.env.wasm.numThreads = 1;

const makeCanvas = (w, h) => new OffscreenCanvas(w, h);
const post = m => self.postMessage(m);

let pp = null;

async function boot() {
  if (pp) return pp;
  post({type: 'stage', text: 'Nhanh (PP-OCR): đang nạp model ~32 MB (lần đầu 10–30 giây)…'});
  const get = async p => {
    const r = await fetch(p);
    if (!r.ok) throw Error('Không đọc được ' + p);
    return r.arrayBuffer();
  };
  const [det, rec, dict] = await Promise.all([
    get('./ppocr/models/det.onnx'),
    get('./ppocr/models/rec.onnx'),
    get('./ppocr/models/dict.txt')
  ]);
  pp = await PPOcr.create({
    ort,
    models: {det, rec, dict: new TextDecoder().decode(dict)},
    makeCanvas
  });
  return pp;
}

self.onmessage = async e => {
  const d = e.data || {};
  if (d.type !== 'run') return;
  const bmp = d.bitmap;
  try {
    const engine = await boot();
    engine.opt.detLimit = d.detLimit;
    const cv = makeCanvas(bmp.width, bmp.height);
    cv.getContext('2d', {willReadFrequently: true}).drawImage(bmp, 0, 0);
    try { bmp.close(); } catch {}
    post({type: 'stage', text: 'Nhanh (PP-OCR) đang nhận dạng…'});
    const res = await engine.run(cv);
    self.postMessage({
      type: 'done',
      width: cv.width,
      height: cv.height,
      lines: res.lines.map(l => ({text: l.text, box: Array.from(l.box)}))
    });
  } catch (err) {
    self.postMessage({type: 'error', message: String((err && err.message) || err)});
  }
};
