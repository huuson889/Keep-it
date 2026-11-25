/* Nối phần OCR (sinh từ demo) vào khung đọc của Keepit.
   File này KHÔNG chứa mã OCR: chỉ chèn markup demo đã đổi tên vào trang, đưa bitmap trang
   của Keepit cho engine, và báo số trang/trạng thái qua window.keepitHook. */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  let mounted = false;
  let loader = null;

  const st = () => globalThis.KeepitViewerState?.() || null;
  const stage = () => document.getElementById('stage');

  /* trang đang xem của Keepit: canvas nguồn + số trang */
  function currentSurface() {
    return document.querySelector('#pageStack .pageFrame[data-page]:not([hidden]) .docSurface')
        || document.querySelector('#pageStack .pageFrame .docSurface')
        || document.querySelector('.docSurface');
  }

  function canvasFor(pageNo) {
    const want = Number(pageNo) || 1;
    const frames = [...document.querySelectorAll('#pageStack .pageFrame, .pageFrame')];
    const frame = frames.find((f) => Number(f.dataset.page) === want) || frames[0] || null;
    const cand = frame?.querySelector('.docsSource canvas') || frame?.querySelector('canvas')
      || document.querySelector('#stage .docsSource canvas') || document.querySelector('#stage canvas');
    if (!cand || !cand.width || !cand.height) return null;
    return cand;
  }

  /* chèn markup OCR (đã đổi tên) một lần */
  async function mount() {
    if (mounted) return;
    mounted = true;
    const host = document.createElement('div');
    host.id = 'kpOcrHost';
    host.className = 'kpOcrScope';
    const html = await (loader ||= fetch(chrome.runtime.getURL('js/ocr/ui.html.part')).then((r) => r.text()));
    host.innerHTML = html;
    document.body.appendChild(host);
    await import(chrome.runtime.getURL('js/ocr/engine.js')).catch((e) => console.warn('[ocr-host] engine:', e?.message));
    await import(chrome.runtime.getURL('js/ocr/glue.js')).catch((e) => console.warn('[ocr-host] glue:', e?.message));
    syncPaper();
  }

  /* đưa lớp đè trang (scanFx/layer/hl/regionSurface) vào .docSurface của trang đang đọc */
  let syncing = false;
  function syncPaper() {
    if (syncing) return;
    syncing = true;
    try { mountPaperNow(); } finally { syncing = false; }
  }
  function mountPaperNow() {
    const surface = currentSurface();
    const paper = $('kpOcrPage');
    if (!surface || !paper) return;
    if (paper.parentElement !== surface) surface.appendChild(paper);
    const r = surface.getBoundingClientRect();
    paper.style.setProperty('--kpW', Math.round(r.width) + 'px');
    paper.style.setProperty('--kpH', Math.round(r.height) + 'px');
    paper.dataset.ready = '1';
  }

  function syncEngine() {
    const s = st();
    const n = canvasCount();
    if (n) window.LHN_OCR_ENGINE?.setDocument(n, s?.page || 1);
  }

  const canvasCount = () => document.querySelectorAll('#pageStack .pageFrame .docsSource canvas').length
    || Number(st()?.pages) || 0;

  /* hợp đồng cho glue.js (UI) — giữ đúng tên demo gọi */
  function results() {
    const map = window.LHN_OCR_ENGINE?.results;
    if (!map) return null;
    const out = new Map();
    for (const [k, v] of map) out.set(k, v);
    return out;
  }

  window.LHN_OCR_HOST = { canvasFor, syncPaper };

  window.keepitHook = {
    goTo: (n) => { document.querySelector(`#pageStack .pageFrame[data-page="${n}"]`)?.scrollIntoView({ block: 'start' }); setTimeout(syncPaper, 60); },
    getDoc: () => st()?.name || null,
    getImage: () => false,
    getTotal: () => canvasCount(),
    getCurrent: () => st()?.page || 1,
    getResults: results,
    isBusy: () => false,
    getMode: () => 'tess',
    applyText: () => {},
    forceIdle: () => {},
    releaseEngines: () => {},
    canvasFor,
    syncPaper,
  };
  window.onKeepitState = () => syncPaper();

  /* mở OCR: nút của chính demo (đã đổi tên). Không gọi lại .click() để tránh đệ quy. */
  let opening = false;
  document.addEventListener('click', async (e) => {
    if (!e.target.closest?.('#kpVOcr') || opening) return;
    opening = true;
    e.preventDefault(); e.stopPropagation();
    try {
      await mount();
      syncPaper();
      const btn = $('kpVOcr');
      const own = btn && btn.onclick;          /* openOcr của glue.js, gắn lúc nạp */
      if (typeof own === 'function') {
        try { own.call(btn, { type: 'click', target: btn }); }
        catch (err) { console.warn('[ocr-host] openOcr lỗi:', err?.message); }
      }
      if (!$('kpOcrModal')?.classList.contains('show')) {
        $('kpOcrModal')?.classList.add('show');
        $('kpOcrScrim')?.classList.add('show');
      }
      $('kpTrPanel')?.classList.add('open');
    } finally { opening = false; }
  }, true);

  setInterval(() => { if (mounted) { syncPaper(); syncEngine(); } }, 1200);
  globalThis.KeepitOcrHost = { mount, syncPaper, canvasFor };
})();
