// Loại từ (Word class) engine: Transformers.js + ONNX Runtime (CPU WebAssembly, bundled in vendor/transformers/) running the
// part-of-speech model on this device. One engine for all tabs: on Chrome it lives in the offscreen document
// pages/word-class-engine.html (background.js creates it on demand and closes it when idle); on Firefox background.js
// imports this module into its own background page. The model (~105 MB) is downloaded from huggingface.co only after the
// user confirms, kept in the extension's Cache Storage ("transformers-cache") and used offline afterwards; page text never
// leaves the browser.
import "./core.js";
import { AutoTokenizer, AutoModelForTokenClassification, Tensor, env } from "../../vendor/transformers/transformers.min.js";

const CORE = globalThis.LHN_WORD_CLASS_CORE;
const api = globalThis.browser || globalThis.chrome;
const CACHE = "transformers-cache", IDLE_MS = 3 * 60 * 1000;
env.allowLocalModels = false;
env.useBrowserCache = true;
env.backends.onnx.wasm.wasmPaths = api.runtime.getURL("vendor/transformers/");
env.backends.onnx.wasm.numThreads = 1;
env.backends.onnx.wasm.proxy = false;

let ready = null, loading = false, error = "", files = {}, queue = Promise.resolve(), idleT = 0;
const progress = () => { const v = Object.values(files); const loaded = v.reduce((a, f) => a + f[0], 0), total = v.reduce((a, f) => a + f[1], 0); return { loaded, total }; };

async function downloaded() {
  try {
    if (!(await caches.has(CACHE))) return false;
    const cache = await caches.open(CACHE);
    for (const f of CORE.MODEL_FILES) if (!(await cache.match(CORE.MODEL_URL(f)))) return false;
    return true;
  } catch { return false; }
}
function load() {
  if (ready) return ready;
  loading = true; error = ""; files = {};
  const onProgress = p => { if (p.status === "progress" && p.total) files[p.file] = [p.loaded, p.total]; else if (p.status === "done" && files[p.file]) files[p.file][0] = files[p.file][1]; };
  ready = Promise.all([
    AutoTokenizer.from_pretrained(CORE.MODEL_ID, { progress_callback:onProgress }),
    AutoModelForTokenClassification.from_pretrained(CORE.MODEL_ID, { dtype:"q8", device:"wasm", progress_callback:onProgress })
  ]).then(([tok, model]) => { loading = false; return { tok, model }; })
    .catch(e => { loading = false; error = String(e?.message || e); ready = null; throw e; });
  return ready;
}
async function unload() {
  const r = ready; ready = null; files = {};
  if (r) { try { (await r).model.dispose?.(); } catch {} }
}
function touch() {
  clearTimeout(idleT);
  idleT = setTimeout(async () => {
    if (loading) return touch();
    await unload();
    // Chrome: ask background.js to close this offscreen document (frees the ~300 MB the model uses)
    if (location.pathname.endsWith("/word-class-engine.html")) api.runtime.sendMessage({ type:"WORD_CLASS_IDLE" }).catch?.(() => {});
  }, IDLE_MS);
}
async function status() {
  const p = progress();
  return { ok:true, downloaded:!!ready && !loading || await downloaded(), loading, loaded:p.loaded, total:p.total, error };
}

// op: status | download | tag (texts: string[] → results: [[start, end, UPOS], …][]) | remove
export async function handle(message) {
  const op = message?.op;
  if (op === "status") return status();
  if (op === "download") { touch(); load().catch(() => {}); return status(); }
  if (op === "remove") { await unload(); clearTimeout(idleT); try { await caches.delete(CACHE); } catch {} return { ok:true }; }
  if (op === "tag") {
    if (!ready && !(await downloaded())) return { ok:false, needDownload:true };
    touch();
    const texts = Array.isArray(message.texts) ? message.texts.map(t => String(t || "")).slice(0, 50) : [];
    const run = queue.then(async () => {
      const { tok, model } = await load();
      const results = [];
      for (const text of texts) results.push(text.trim() ? await CORE.analyze(text, tok, model, Tensor) : []);
      touch();
      return { ok:true, results };
    });
    queue = run.catch(() => {});
    try { return await run; } catch (e) { return { ok:false, error:String(e?.message || e) }; }
  }
  return { ok:false, error:"unknown op" };
}

// Chrome offscreen document: messages from background.js carry target "lhn-word-class-engine"
if (location.pathname.endsWith("/word-class-engine.html")) {
  api.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.target !== "lhn-word-class-engine") return;
    handle(message).then(sendResponse, e => sendResponse({ ok:false, error:String(e?.message || e) }));
    return true;
  });
}
