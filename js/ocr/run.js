// OCR run controller: one page or the whole document, three engines, Dừng keeps the fusor model
// in RAM (only ✕ releases it), one retry per page, and the result goes into the page's own text
// layer so translate/read-aloud/notes keep working on it.
(() => {
  'use strict';
  if (globalThis.LHN_OCR) return;
  const ui = () => globalThis.LHN_OCR_UI, engine = () => globalThis.LHN_OCR_ENGINE, docs = () => globalThis.LHN_DOCUMENTS_OCR;
  const t = (key, params) => globalThis.LHN_LANGUAGES?.t?.(key, params, document.documentElement.lang) ?? key;
  const known = /^ocr[A-Z]/;
  const say = (key, params) => { const text = t(key, params); return known.test(key) ? text : key; };
  const errorText = error => {
    const message = String(error?.message || error || '').trim();
    return message && known.test(message) ? t(message) : message || t('ocrEngineFailed');
  };

  let running = false, stopRequested = false, options = { mode: 'pp', scope: 'page' }, started = 0;

  const seconds = () => ((Date.now() - started) / 1000).toFixed(1);

  function open(optionsOverride) {
    if (!docs()?.ready?.()) { ui()?.toast(t('ocrNoDocument')); return; }
    options = { ...options, ...optionsOverride };
    ui()?.openDialog({
      mode: options.mode, scope: options.scope, modes: engine()?.modes || ['pp', 'fusor', 'tess'],
      onRun: picked => { options = picked; void start(); }
    });
  }

  function openCard() {
    const card = ui().openCard({
      onStop: () => { stopRequested = true; engine()?.stop?.(); ui().finish({ kind: 'stopped', summary: t('ocrSumStopped', { count: donePages(), pages: totalPages() }), warning: t('ocrWarnStopped') }); },
      onForce: () => { stopRequested = true; engine()?.stop?.(); ui().finish({ kind: 'stopped', summary: t('ocrSumStopped', { count: donePages(), pages: totalPages() }), warning: t('ocrWarnForced') }); },
      onAgain: () => { ui().closeCard(); void start(); },
      onRegion: () => { void runRegion(); },
      onClose: () => { ui().closeCard(); try { Promise.resolve(engine()?.release?.()).catch(() => {}); } catch { /* ignore */ } ui().toast(t('ocrReleased')); }
    });
    return card;
  }

  const totalPages = () => options.scope === 'all' ? (docs()?.info?.()?.pages || 1) : 1;
  let applied = 0;
  const donePages = () => applied;

  function pageList() {
    const info = docs().info();
    return options.scope === 'all' ? Array.from({ length: Math.max(1, info.pages) }, (_, index) => index + 1) : [info.page];
  }

  async function start() {
    if (running) return;
    const info = docs()?.info?.();
    if (!info) { ui()?.toast(t('ocrNoDocument')); return; }
    running = true; stopRequested = false; applied = 0; started = Date.now();
    const card = openCard();
    card.actions.close.disabled = true;
    const pages = pageList(), failures = [];
    ui().setPage(pages.length > 1 ? t('ocrPageOf', { page: pages[0], total: pages.length }) : t('ocrPageOf', { page: pages[0], total: info.pages }));
    ui().setState(t('ocrPreparing'));
    try {
      for (const [index, page] of pages.entries()) {
        if (stopRequested) break;
        ui().setPage(t('ocrPageOf', { page, total: pages.length > 1 ? pages.length : info.pages }));
        ui().progress(index / pages.length);
        const canvas = await docs().raster(page);
        if (!canvas) { failures.push({ page, error: t('ocrNoRaster') }); continue; }
        let result = null, error = null;
        try { result = await recognize(canvas, page); }
        catch (caught) { error = caught; }
        /* một trang lỗi không giết cả lượt: dựng lại engine rồi thử đúng trang đó một lần */
        if (error && !stopRequested) {
          try { await engine()?.release?.(); result = await recognize(canvas, page); error = null; }
          catch (caught) { error = caught; }
        }
        if (stopRequested) { canvas.width = canvas.height = 1; break; }
        if (error) { failures.push({ page, error: errorText(error) }); ui().log(t('ocrPageFailed', { page, reason: errorText(error) })); continue; }
        docs().apply(page, result);
        applied++;
        ui().log(t('ocrPageDone', { page }));
        ui().progress((index + 1) / pages.length);
        canvas.width = canvas.height = 1;
      }
      ui().progress(1);
      if (stopRequested) {
        ui().finish({ kind: 'stopped', summary: t('ocrSumStopped', { count: applied, pages: pages.length }), warning: t('ocrWarnStopped') });
      } else if (failures.length) {
        ui().finish({ kind: 'error', summary: t('ocrSumError', { count: applied, pages: pages.length, failed: failures.length }), warning: t('ocrWarnError', { reason: failures[0].error }) });
      } else {
        ui().finish({ kind: 'done', summary: t('ocrSumDone', { count: applied, pages: pages.length, seconds: seconds() }) });
      }
    } catch (error) {
      ui().finish({ kind: 'error', summary: t('ocrSumError', { count: applied, pages: pages.length, failed: pages.length - applied }), warning: errorText(error) });
    } finally {
      running = false;
      const current = ui().current();
      if (current) current.actions.close.disabled = false;
      docs()?.refresh?.();
    }
  }

  async function recognize(canvas, page) {
    const result = await engine().runCanvas(options.mode, canvas, {
      label: t('ocrPageLabel', { page }),
      seconds: 0,
      forImage: !!docs()?.info?.()?.image,
      onProgress: event => {
        if (event?.stage === 'recognize' && typeof event.progress === 'number') ui().setState(t('ocrWorking', { percent: Math.round(event.progress * 100) }));
        else if (event?.stage === 'variant') ui().setState(t('ocrVariant', { index: event.index, count: event.count }));
        else if (event?.stage === 'align') ui().setState(t('ocrAligning'));
        else if (event?.stage === 'load') ui().setState(event.total ? t('ocrLoadingModel', { done: Math.round((event.done || 0) / 1e6), total: Math.round(event.total / 1e6) }) : t('ocrLoading'));
        else if (event?.stage === 'download') ui().setState(t('ocrDownloading', { part: event.part, parts: event.parts, done: (event.written / 1e6).toFixed(1), total: (event.bytes / 1e6).toFixed(1) }));
        else if (event?.stage === 'confirm') ui().setState(t('ocrConfirmModel', { size: (event.bytes / 1e6).toFixed(1) }));
        else if (event?.stage === 'text') ui().setState(t('ocrStreaming', { tokens: event.tokens }));
      }
    });
    if (stopRequested) throw new Error('ocrStopped');
    return result;
  }

  /* Khoanh vùng trên trang đang xem: chỉ nhận dạng phần đã chọn rồi ghép vào lớp chữ. */
  async function runRegion() {
    const info = docs()?.info?.();
    if (!info) return;
    const rect = await ui().selectRegion({ label: t('ocrRegionHint') });
    if (!rect) return;
    const canvas = await docs().raster(info.page);
    if (!canvas) return;
    const left = Math.floor(rect[0] * canvas.width), top = Math.floor(rect[1] * canvas.height);
    const width = Math.max(1, Math.ceil(rect[2] * canvas.width) - left), height = Math.max(1, Math.ceil(rect[3] * canvas.height) - top);
    const crop = document.createElement('canvas');
    crop.width = width; crop.height = height;
    crop.getContext('2d').drawImage(canvas, left, top, width, height, 0, 0, width, height);
    canvas.width = canvas.height = 1;
    ui().busy(true);
    ui().setState(t('ocrWorking', { percent: 0 }));
    try {
      const result = await engine().runCanvas(options.mode === 'fusor' ? 'fusor' : options.mode, crop, { label: t('ocrRegionLabel'), seconds: 60 });
      const boxes = (result.boxes || []).map(box => ({
        text: box.text,
        rect: [rect[0] + box.rect[0] * (rect[2] - rect[0]), rect[1] + box.rect[1] * (rect[3] - rect[1]), rect[0] + box.rect[2] * (rect[2] - rect[0]), rect[1] + box.rect[3] * (rect[3] - rect[1])]
      }));
      docs().apply(info.page, { text: result.text, boxes });
      ui().finish({ kind: 'done', summary: t('ocrSumDone', { count: 1, pages: 1, seconds: seconds() }) });
      docs()?.refresh?.();
    } catch (error) {
      ui().finish({ kind: 'error', summary: t('ocrSumRegionError'), warning: errorText(error) });
    } finally { crop.width = crop.height = 1; ui().busy(false); }
  }

  globalThis.LHN_OCR = Object.freeze({ open, start: () => { void start(); }, runRegion: () => { void runRegion(); }, release: () => engine()?.release?.(), get running() { return running; } });
})();
