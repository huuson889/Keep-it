// Cầu nối OCR — QĐ-3 của docs/ocr-demo-2.9.7.26-chuc-nang.md.
// Demo 2.9.7.26 có `window.keepitHook` (10 hàm) và engine ghi trạng thái vào
// #status / #progress / #progPage. Keepit không có 2 thứ đó, nên lớp này dựng lại
// ĐÚNG hợp đồng ấy trên khung xem của Keepit. Không đổi giao diện, không đổi hành vi demo.
(() => {
  'use strict';
  if (globalThis.KEEPIT_OCR_BRIDGE) return;

  const docs = () => globalThis.LHN_DOCUMENTS_OCR;
  const engine = () => globalThis.LHN_OCR_ENGINE;
  const ocr = () => globalThis.LHN_OCR;
  const $ = id => document.getElementById(id);

  /* Bản sao `results` của demo: mỗi trang một {text, boxes, partial, truncated}. */
  const results = new Map();
  let mode = 'tess';
  let langs = 'eng+vie+kor';
  let busy = false;

  /* Kênh trạng thái của demo: engine ghi chữ vào #status, #progress, #progPage. */
  function setStatus(text) { const node = $('kpOcrStatus'); if (node) node.textContent = String(text ?? ''); }
  function setProgress(value) { const node = $('kpOcrProgress'); if (node) node.value = Math.max(0, Math.min(1, Number(value) || 0)); }
  function setPageLabel(text) { const node = $('kpOcrProgPage'); if (node) node.textContent = String(text ?? ''); }

  function publish(page, result) {
    const n = Number(page) || 1;
    const text = String(result?.text || '');
    const boxes = Array.isArray(result?.boxes) ? result.boxes : [];
    results.set(n, { text, boxes, partial: !!result?.partial, truncated: !!result?.truncated });
    return results.get(n);
  }

  function applyText(page, text) {
    const n = Number(page) || 1;
    if (!docs()?.ready?.()) return false;
    const current = results.get(n);
    const next = String(text ?? '');
    /* Giữ box đã có; chữ sửa tay thì không suy ra box mới được. */
    const merged = { text: next, boxes: current?.boxes || [], partial: current?.partial, truncated: current?.truncated };
    try { docs().apply(n, merged); } catch (error) { console.warn('[Keepit] OCR applyText:', error); return false; }
    results.set(n, merged);
    return true;
  }

  /* Hợp đồng 10 hàm của demo — giữ đúng tên và chữ ký. */
  const hook = {
    isBusy: () => busy || !!ocr()?.running,
    getCurrent: () => docs()?.info?.()?.page || 1,
    getTotal: () => docs()?.info?.()?.pages || 1,
    getResults: () => results,
    goTo: n => { try { docs()?.goTo?.(n); } catch { /* ignore */ } },
    getDoc: () => docs()?.info?.() || null,
    getMode: () => mode,
    applyText,
    forceIdle: (_gen, hard) => { try { return hard ? engine()?.release?.() : engine()?.stop?.(); } catch { return undefined; } },
    releaseEngines: () => { try { return engine()?.release?.(); } catch { return undefined; } }
  };

  /* QĐ-1: lúc chạy OCR đưa khung xem về đúng điều kiện demo (1 trang, không zoom). */
  function scanMode(on) {
    try { return docs()?.scanMode?.(on) || (() => {}); } catch { return () => {}; }
  }

  function clear() { results.clear(); }

  globalThis.keepitHook = hook;
  globalThis.KEEPIT_OCR_BRIDGE = Object.freeze({
    hook, publish, clear, applyText, scanMode,
    setStatus, setProgress, setPageLabel,
    setBusy: value => { busy = !!value; },
    setMode: value => { mode = String(value || 'tess'); },
    setLangs: value => { langs = String(value || 'eng+vie+kor'); },
    get mode() { return mode; },
    get langs() { return langs; },
    get results() { return results; }
  });
})();
