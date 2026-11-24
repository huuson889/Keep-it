// OCR engine for Keepit: three local engines behind one call. No UI, no labels.
//   tess  · Tesseract (bundled) — fastest to start, word boxes only
//   pp    · PP-OCR in a worker (det + rec) — line boxes, UI stays responsive
//   fusor · fusor-ai runtime — same model as the demo; the model folder is chosen once by the
//           user (File System Access) and never leaves the device
// Dừng must keep the fusor model in RAM: stop() only cuts the current job, release() frees it.
import { ComputePool, SPAWN_COMPUTE } from '../../vendor/ocr/fusor/host/compute.js';
import { matchText } from '../../vendor/ocr/fusor/match.mjs';
import { imageVariant, preprocessV6, mergeImage } from '../../vendor/ocr/tess-v9.js';
import '../../vendor/ocr/tess-v9/tesseract.min.js';   // UMD → globalThis.Tesseract

const MODEL_FOLDER = 'PaddleOCR-Fusor-Model-v1';
const MODEL_BASE = 'https://huggingface.co/spaces/fusorlabs/paddle-ocr-wasm/resolve/14d636984403d9e57b6d1847f9786ba39a6c97e9/model/';
const DB_NAME = 'keepit-ocr', DB_STORE = 'handles';
const THREADS = () => globalThis.crossOriginIsolated ? Math.min(globalThis.navigator?.hardwareConcurrency || 1, 8) : 1;
const url = path => new URL(`../../vendor/ocr/${path}`, import.meta.url).href;
const boxRect = (b, width, height) => [Math.max(0, b.x0 / width), Math.max(0, b.y0 / height), Math.min(1, b.x1 / width), Math.min(1, b.y1 / height)];

let stopped = false, tess = null, tessTerm = null, ppWorker = null, ppAbort = null, ppOff = false;
let worker = null, pool = null, fusorReady = false, loading = null, pending = null, jobId = 0;
let handle = null;

/* ---------- fusor model folder ---------- */
function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains(DB_STORE)) request.result.createObjectStore(DB_STORE); };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function readHandle() {
  try {
    const db = await openDb();
    const value = await new Promise((resolve, reject) => {
      const request = db.transaction(DB_STORE, 'readonly').objectStore(DB_STORE).get('model');
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return value || null;
  } catch { return null; }
}
async function writeHandle(value) {
  try {
    const db = await openDb();
    await new Promise((resolve, reject) => {
      const request = db.transaction(DB_STORE, 'readwrite').objectStore(DB_STORE).put(value, 'model');
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    db.close();
  } catch { /* private mode: keep the handle in memory only */ }
}
async function granted(value) {
  try { return !!value?.queryPermission && (await value.queryPermission({ mode: 'readwrite' })) === 'granted'; } catch { return false; }
}
const partHandle = async (dir, part, create = false) => part.file.startsWith('parts/')
  ? (await dir.getDirectoryHandle('parts', { create })).getFileHandle(part.file.slice(6), { create })
  : dir.getFileHandle(part.file, { create });

export async function chooseModel({ onProgress } = {}) {
  if (typeof globalThis.showDirectoryPicker !== 'function') throw new Error('ocrNoFolderPicker');
  const parent = await globalThis.showDirectoryPicker({ id: 'keepit-ocr-model', mode: 'readwrite' });
  const dir = parent.name === MODEL_FOLDER ? parent : await parent.getDirectoryHandle(MODEL_FOLDER, { create: true });
  const response = await fetch(url('fusor/manifest-model.json'));
  if (!response.ok) throw new Error('ocrModelManifest');
  const list = await response.json(), missing = [];
  for (const part of list.parts) {
    try { const file = await (await partHandle(dir, part)).getFile(); if (file.size !== part.bytes) missing.push(part); }
    catch { missing.push(part); }
  }
  onProgress?.({ stage: 'confirm', bytes: missing.reduce((sum, part) => sum + part.bytes, 0) });
  for (const [index, part] of missing.entries()) {
    if (stopped) throw new Error('ocrStopped');
    const writer = await (await partHandle(dir, part, true)).createWritable();
    try {
      const download = await fetch(MODEL_BASE + part.file, { cache: 'no-store' });
      if (!download.ok || !download.body) throw new Error(`HTTP ${download.status}`);
      const reader = download.body.getReader();
      let written = 0;
      for (;;) {
        if (stopped) { await reader.cancel(); throw new Error('ocrStopped'); }
        const { value, done } = await reader.read();
        if (done) break;
        written += value.length;
        await writer.write(value);
        onProgress?.({ stage: 'download', part: index + 1, parts: missing.length, written, bytes: part.bytes });
      }
      if (written !== part.bytes) throw new Error('ocrModelSize');
      await writer.close();
    } catch (error) { await writer.abort().catch(() => {}); throw error; }
  }
  handle = dir;
  await writeHandle(dir);
  return dir;
}

export async function ensureModel({ onProgress } = {}) {
  if (handle && await granted(handle)) return handle;
  const saved = handle || await readHandle();
  if (saved && await granted(saved)) { handle = saved; return handle; }
  if (saved?.requestPermission) {
    try { if ((await saved.requestPermission({ mode: 'readwrite' })) === 'granted') { handle = saved; await writeHandle(saved); return handle; } } catch { /* fall through */ }
  }
  if (!saved) return chooseModel({ onProgress });
  throw new Error('ocrModelPermission');
}

export async function loadModel({ onProgress } = {}) {
  if (fusorReady && worker) return true;
  if (loading) return loading;
  loading = (async () => {
    const dir = await ensureModel({ onProgress });
    const next = new Worker(url('fusor/engine/engine.js'), { type: 'module' });
    const nextPool = new ComputePool(message => fail(message?.message || 'ocrEngineFailed'));
    worker = next; pool = nextPool; stopped = false;
    next.onerror = event => fail(event?.message || 'ocrEngineFailed');
    await new Promise((resolve, reject) => {
      pending = { resolve, reject };
      next.onmessage = ({ data: message }) => {
        if (message.type === SPAWN_COMPUTE) { nextPool.spawn(message); return; }
        if (message.type === 'progress') { onProgress?.({ stage: 'load', done: message.done, total: message.total }); return; }
        if (message.type === 'runtime') { onProgress?.({ stage: 'runtime', build: message.build, threads: message.threads }); return; }
        if (message.type === 'warning') { onProgress?.({ stage: 'warning', message: message.message }); return; }
        if (message.type === 'ready') { fusorReady = true; const current = pending; pending = null; current?.resolve(message); return; }
        if (message.type === 'error') { fail(message.message || 'ocrEngineFailed'); return; }
        if (message.type === 'text') { onProgress?.({ stage: 'text', tokens: message.tokens }); return; }
        if (message.type === 'done' && pending) { const current = pending; pending = null; current.resolve(message); }
      };
      try { next.postMessage({ type: 'load', dir, threads: THREADS() }); } catch (error) { pending = null; reject(error); }
    });
    return true;
  })().finally(() => { loading = null; });
  return loading;
}

function fail(message) {
  const error = new Error(message), current = pending;
  pending = null; fusorReady = false;
  try { worker?.terminate(); } catch { /* ignore */ }
  worker = null;
  try { pool?.terminate?.(); } catch { /* ignore */ }
  pool = null;
  current?.reject?.(error);
}

/* ---------- tess ---------- */
function tessWorkerPath() { return url('tess-v9/worker.min.js'); }
async function newTess(langs) {
  if (tessTerm) { try { await tessTerm; } catch { /* ignore */ } tessTerm = null; }
  if (tess) return tess;
  const api = globalThis.Tesseract;
  if (!api) throw new Error('ocrEngineFailed');
  tess = await api.createWorker(langs, 1, {
    workerPath: tessWorkerPath(), corePath: url('tess-v9/core/'), langPath: url('tess-v9-data/'),
    workerBlobURL: false, cacheMethod: 'none', gzip: false,
    logger: message => { if (message.status === 'recognizing text' && !stopped) globalThis.__keepitOcrTessProgress?.(message.progress || 0); }
  });
  return tess;
}

async function tessRun(canvas, { langs = 'eng+vie+kor', forImage = false, onProgress } = {}) {
  const workerTess = await newTess(langs);
  const previous = globalThis.__keepitOcrTessProgress;
  globalThis.__keepitOcrTessProgress = progress => onProgress?.({ stage: 'recognize', progress });
  try {
    await workerTess.setParameters({ tessedit_pageseg_mode: '3' });
    if (!forImage) {
      const { data } = await workerTess.recognize(canvas, {}, { text: true, blocks: true });
      const wordsTree = words(data);
      return {
        text: (data.text || '').trim(),
        boxes: wordsTree.filter(word => word.text && word.bbox).map(word => ({ text: word.text, rect: boxRect(word.bbox, canvas.width, canvas.height) }))
      };
    }
    /* Ảnh chụp/scan: thử vài cách tiền xử lý rồi ghép, y như bản demo. */
    const attempts = [['raw', '3'], ['gray', '11'], ['mixed', '3'], ['v6', '3']], outputs = [];
    for (const [index, [kind, psm]] of attempts.entries()) {
      if (stopped) break;
      onProgress?.({ stage: 'variant', index: index + 1, count: attempts.length });
      const variant = kind === 'v6' ? await preprocessV6(canvas) : imageVariant(canvas, kind);
      try {
        await workerTess.setParameters({ tessedit_pageseg_mode: psm, preserve_interword_spaces: '1', user_defined_dpi: '300' });
        const { data } = await workerTess.recognize(variant, {}, { text: true, blocks: true });
        const sx = canvas.width / variant.width, sy = canvas.height / variant.height;
        data.words = words(data).map(word => ({ ...word, bbox: { x0: word.bbox.x0 * sx, y0: word.bbox.y0 * sy, x1: word.bbox.x1 * sx, y1: word.bbox.y1 * sy } }));
        outputs.push(data);
      } finally { variant.width = variant.height = 0; }
    }
    if (stopped) throw new Error('ocrStopped');
    const merged = mergeImage(outputs);
    return {
      text: merged.text,
      boxes: words(merged).filter(word => word.text && word.bbox).map(word => ({ text: word.text, rect: boxRect(word.bbox, canvas.width, canvas.height) }))
    };
  } finally { globalThis.__keepitOcrTessProgress = previous; }
}
const words = data => {
  if (data.words) return data.words;
  const list = [];
  for (const block of data.blocks || []) for (const paragraph of block.paragraphs || []) for (const line of paragraph.lines || []) for (const word of line.words || []) list.push(word);
  return list;
};

/* ---------- PP-OCR in a worker ---------- */
function ppKill() {
  if (ppAbort) { const abort = ppAbort; ppAbort = null; try { abort(); } catch { /* ignore */ } }
  if (ppWorker) { try { ppWorker.terminate(); } catch { /* ignore */ } ppWorker = null; }
}
function ppStart() {
  if (ppWorker || ppOff) return ppWorker;
  try { ppWorker = new Worker(url('ppworker.js'), { type: 'module' }); }
  catch { ppOff = true; return null; }
  return ppWorker;
}
async function ppRun(canvas, { onProgress, detLimit = 960 } = {}) {
  const workerPP = ppStart();
  if (!workerPP) throw new Error('ocrEngineFailed');
  const bitmap = await createImageBitmap(canvas);
  return new Promise((resolve, reject) => {
    let done = false;
    const finish = (ok, value) => {
      if (done) return;
      done = true; ppAbort = null;
      workerPP.removeEventListener('message', onMessage);
      workerPP.removeEventListener('error', onError);
      ok ? resolve(value) : reject(value);
    };
    const onMessage = event => {
      const data = event.data || {};
      if (data.type === 'stage') { onProgress?.({ stage: 'recognize', text: data.text }); return; }
      if (data.type === 'error') { finish(false, new Error(data.message || 'ocrEngineFailed')); return; }
      if (data.type === 'done') finish(true, { lines: data.lines || [], width: data.width || canvas.width, height: data.height || canvas.height });
    };
    const onError = event => { ppOff = true; ppKill(); finish(false, event?.error || new Error('ocrEngineFailed')); };
    ppAbort = () => finish(false, new Error('ocrStopped'));
    workerPP.addEventListener('message', onMessage);
    workerPP.addEventListener('error', onError);
    try { workerPP.postMessage({ type: 'run', bitmap, detLimit }, [bitmap]); } catch (error) { finish(false, error); }
  }).then(({ lines, width, height }) => ({
    text: lines.map(line => line.text).join('\n').trim(),
    boxes: lines.filter(line => line.text && Array.isArray(line.box) && line.box.length >= 4 && line.box[2] > line.box[0])
      .map(line => ({ text: line.text, rect: [line.box[0] / width, line.box[1] / height, line.box[2] / width, line.box[3] / height] }))
  }));
}

/* ---------- fusor ---------- */
function fusorRead(canvas, label, seconds, onProgress) {
  if (!worker || !fusorReady) return Promise.reject(new Error('ocrEngineNotReady'));
  const pixels = canvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, canvas.width, canvas.height).data;
  const id = ++jobId;
  let timeout = null, force = null, late = false;
  return new Promise((resolve, reject) => {
    pending = { resolve: message => resolve(late ? { ...message, timedOut: true } : message), reject };
    if (seconds > 0) timeout = setTimeout(() => {
      if (!pending || jobId !== id) return;
      late = true;
      onProgress?.({ stage: 'timeout', label, seconds });
      try { worker?.postMessage({ type: 'stop' }); } catch { /* ignore */ }
      force = setTimeout(() => { if (pending && jobId === id) fail('ocrRegionTimeout'); }, 5000);
    }, seconds * 1000);
    try { worker.postMessage({ type: 'read', job: id, width: canvas.width, height: canvas.height, rgba: pixels, throttle: true, loopGuard: true }, [pixels.buffer]); }
    catch (error) { pending = null; reject(error); }
  }).finally(() => { clearTimeout(timeout); clearTimeout(force); });
}

async function fusorRun(canvas, { label = 'page', seconds = 0, onProgress } = {}) {
  await loadModel({ onProgress });
  const answer = await fusorRead(canvas, label, seconds, onProgress);
  if (answer?.timedOut) throw new Error('ocrRegionTimeout');
  if (answer?.stopped || stopped) throw new Error('ocrStopped');
  const text = String(answer?.text || '').trim();
  if (!text) return { text: '', boxes: [] };
  onProgress?.({ stage: 'align' });
  const matchWorker = await newTess('eng+vie+kor');
  await matchWorker.setParameters({ tessedit_pageseg_mode: '11' });
  const { data } = await matchWorker.recognize(canvas, {}, { blocks: true, text: true });
  if (stopped) throw new Error('ocrStopped');
  const matched = matchText(text, data);
  return {
    text,
    boxes: matched.matches.filter(match => match?.bbox).map(match => ({ text: match.text, rect: boxRect(match.bbox, canvas.width, canvas.height) })),
    truncated: !!answer?.truncated,
    matched: matched.matches.length, source: matched.sourceCount
  };
}

/* ---------- one call for the three engines ---------- */
export async function runCanvas(mode, canvas, options = {}) {
  stopped = false;
  if (mode === 'pp') return ppRun(canvas, options);
  if (mode === 'fusor') return fusorRun(canvas, options);
  return tessRun(canvas, options);
}

/* Dừng mềm: cắt việc đang chạy, GIỮ model Fusor trong RAM để chạy lại ngay. */
export function stop() {
  stopped = true;
  pending?.reject?.(new Error('ocrStopped'));
  pending = null;
  try { worker?.postMessage({ type: 'stop' }); } catch { /* ignore */ }
  ppKill();
  if (tess) { const dying = tess; tess = null; try { tessTerm = Promise.resolve(dying.terminate()).catch(() => {}); } catch { tessTerm = null; } }
}

/* Giải phóng hẳn (nút ✕): model, worker, compute pool, tesseract. */
export async function release() {
  stop();
  fusorReady = false;
  try { worker?.terminate(); } catch { /* ignore */ }
  worker = null;
  try { pool?.terminate?.(); } catch { /* ignore */ }
  pool = null;
  if (tessTerm) { try { await tessTerm; } catch { /* ignore */ } tessTerm = null; }
}

export const status = () => ({
  loaded: !!(fusorReady && worker), mode: 'local', threads: THREADS(), isolated: !!globalThis.crossOriginIsolated,
  fusorModel: MODEL_FOLDER, pp: !ppOff
});

globalThis.LHN_OCR_ENGINE = Object.freeze({
  modes: ['pp', 'fusor', 'tess'], status, chooseModel, ensureModel, loadModel,
  runCanvas, stop, release, modelFolder: MODEL_FOLDER
});
