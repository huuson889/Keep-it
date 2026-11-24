// OCR UI cho Tài liệu — dùng đúng các khối markup trong pages/documents.html để bố cục
// giống bản demo: gợi ý ảnh quét (thẻ vàng + bóng đèn), popup giữa, panel phải
// “Văn bản nhận dạng”, thẻ tiến độ góc phải dưới. Nhãn lấy từ languages.js.
(() => {
  'use strict';
  if (globalThis.LHN_OCR_UI) return;
  const t = (key, params) => globalThis.LHN_LANGUAGES?.t?.(key, params, document.documentElement.lang) ?? key;
  const $ = id => document.getElementById(id);
  const NO_ASK = 'keepit-ocr-noask';
  let card = null, dialogOpen = false;

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  };
  const noAsk = () => { try { return localStorage.getItem(NO_ASK) === '1'; } catch { return false; } };
  const setNoAsk = value => { try { localStorage.setItem(NO_ASK, value ? '1' : '0'); } catch { /* ignore */ } };

  /* ---------- popup giữa ---------- */
  function openDialog({ mode = 'pp', scope = 'page', modes = ['pp', 'fusor', 'tess'], onRun, onCancel } = {}) {
    const modal = $('kpOcrModal'), scrim = $('kpOcrScrim');
    if (!modal || !scrim) return null;
    dialogOpen = true;
    const info = globalThis.LHN_DOCUMENTS_OCR?.info?.();
    const scopeAll = $('kpOcrScopeAll');
    if (scopeAll) scopeAll.textContent = t('ocrScopeAll', { count: info?.pages || 1 });
    for (const input of modal.querySelectorAll('input[name="kpOcrMode"]')) {
      input.checked = input.value === mode;
      input.parentElement.hidden = !modes.includes(input.value);
    }
    for (const input of modal.querySelectorAll('input[name="kpOcrScope"]')) input.checked = input.value === scope;
    const close = () => { closeDialog(); onCancel?.(); };
    $('kpOcrCancel').onclick = close;
    $('kpOcrCancel2').onclick = close;
    scrim.onclick = close;
    $('kpOcrRun').onclick = () => {
      const pickedMode = modal.querySelector('input[name="kpOcrMode"]:checked')?.value || mode;
      const pickedScope = modal.querySelector('input[name="kpOcrScope"]:checked')?.value || scope;
      closeDialog();
      onRun?.({ mode: pickedMode, scope: pickedScope });
    };
    scrim.classList.add('show');
    modal.classList.add('show');
    $('kpOcrRun').focus?.();
    return modal;
  }
  function closeDialog() {
    dialogOpen = false;
    $('kpOcrScrim')?.classList.remove('show');
    $('kpOcrModal')?.classList.remove('show');
  }
  const dialogVisible = () => dialogOpen;

  /* ---------- thẻ tiến độ ---------- */
  function openCard({ onStop, onForce, onAgain, onRegion, onClose } = {}) {
    const root = $('kpOcrProg');
    if (!root) return null;
    card = { started: Date.now(), timer: 0, stopRequested: false, busy: true, root };
    root.classList.add('show');
    root.classList.remove('done', 'stopped', 'error');
    card.title = $('kpOcrProgTitle'); card.pageLabel = $('kpOcrProgPage');
    card.state = $('kpT'); card.clock = $('kpClock'); card.bar = $('kpBar'); card.logBox = $('kpLog');
    card.doneBox = $('kpDone'); card.sum = $('kpSum'); card.warn = $('kpWarn');
    card.actions = { stop: $('kpStop'), force: $('kpForce'), again: $('kpAgain'), region: $('kpRegion'), close: $('kpOcrProgClose') };
    card.title.textContent = t('ocrTitleRun');
    card.state.textContent = t('ocrPreparing');
    card.clock.textContent = `0.0 ${t('ocrSeconds')}`;
    card.bar.value = 0;
    card.logBox.replaceChildren();
    card.doneBox.classList.remove('show');
    card.warn.textContent = '';
    card.actions.stop.hidden = false;
    card.actions.force.hidden = true;
    card.actions.again.hidden = true;
    card.actions.region.hidden = true;
    card.actions.close.disabled = true;
    card.actions.stop.onclick = () => { if (card.stopRequested) return; card.stopRequested = true; onStop?.(); };
    card.actions.force.onclick = () => onForce?.();
    card.actions.again.onclick = () => onAgain?.();
    card.actions.region.onclick = () => onRegion?.();
    card.actions.close.onclick = () => { if (card.busy) return; onClose?.(); };
    clearInterval(card.timer);
    card.timer = setInterval(() => {
      if (!card) return;
      card.clock.textContent = `${((Date.now() - card.started) / 1000).toFixed(1)} ${t('ocrSeconds')}`;
    }, 200);
    return card;
  }
  function closeCard() {
    if (!card) return;
    clearInterval(card.timer);
    card.root?.classList.remove('show');
    card = null;
  }
  const current = () => card;
  function setPage(text) { if (card && text != null) card.pageLabel.textContent = text; }
  function setState(main) {
    if (!card || !main) return;
    card.state.textContent = main;
    log(main);
  }
  function log(line) {
    if (!card || !line) return;
    const text = String(line).trim();
    if (!text || card.logBox.firstElementChild?.textContent === text) return;
    card.logBox.prepend(el('div', null, text));
    while (card.logBox.children.length > 3) card.logBox.lastElementChild.remove();
  }
  function progress(value) { if (card) card.bar.value = Math.max(0, Math.min(1, Number(value) || 0)); }
  function finish({ kind = 'done', summary = '', warning = '' } = {}) {
    if (!card) return;
    card.busy = false;
    clearInterval(card.timer);
    card.root.classList.remove('done', 'stopped', 'error');
    card.root.classList.add(kind === 'done' ? 'done' : kind === 'error' ? 'error' : 'stopped');
    card.title.textContent = kind === 'done' ? t('ocrTitleDone') : kind === 'error' ? t('ocrTitleError') : t('ocrTitleStopped');
    card.sum.textContent = summary;
    card.warn.textContent = warning;
    card.doneBox.classList.add('show');
    card.actions.stop.hidden = true;
    card.actions.force.hidden = true;
    card.actions.again.hidden = false;
    card.actions.region.hidden = false;
    card.actions.close.disabled = false;
  }
  function busy(value) { if (card) card.busy = !!value; }

  /* ---------- panel phải “Văn bản nhận dạng” ---------- */
  function panel({ text = '', page = 0, append = false, reset = false } = {}) {
    const root = $('kpOcrPanel'), pre = $('kpOcrText'), empty = $('kpOcrEmpty');
    if (!root || !pre || !empty) return;
    if (reset) { pre.textContent = ''; pre.hidden = true; empty.hidden = false; }
    const body = append && !pre.hidden && pre.textContent ? `${pre.textContent}\n\n` : '';
    const value = String(text || '').trim();
    if (value) {
      pre.textContent = body + (page ? `— ${t('ocrPageLabel', { page })} —\n${value}` : value);
      pre.hidden = false;
      empty.hidden = true;
    } else if (!pre.textContent) {
      pre.hidden = true;
      empty.hidden = false;
    }
    root.classList.add('show');
    $('kpOcrPanelClose').onclick = () => root.classList.remove('show');
    $('kpOcrCopy').onclick = () => {
      const valueNow = pre.textContent || '';
      const done = () => toast(t('ocrCopyDone'));
      try { navigator.clipboard?.writeText(valueNow).then(done, () => toast(t('ocrCopyFail'))); }
      catch { toast(t('ocrCopyFail')); }
    };
    $('kpOcrExport').onclick = () => {
      const name = (globalThis.LHN_DOCUMENTS_OCR?.info?.()?.name || 'ocr').replace(/\.[^.]+$/, '');
      const blob = new Blob([pre.textContent || ''], { type: 'text/plain;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${name}.txt`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 4000);
    };
  }
  function panelText() { return $('kpOcrText')?.textContent || ''; }
  const closePanel = () => $('kpOcrPanel')?.classList.remove('show');

  /* ---------- gợi ý ảnh quét ---------- */
  function syncBanner({ needsOcr = false } = {}) {
    const banner = $('kpOcrBanner'), bulb = $('kpOcrBulb');
    if (!banner || !bulb) return;
    if (!needsOcr || noAsk()) {
      banner.classList.remove('show'); bulb.classList.remove('show');
      if (!needsOcr) collapseTo(null);
      return;
    }
    if (banner.dataset.collapsed === '1') { banner.classList.remove('show'); bulb.classList.add('show'); }
    else { banner.classList.add('show'); bulb.classList.remove('show'); }
    const checkbox = $('kpOcrNoAsk');
    if (checkbox) checkbox.checked = noAsk();
    $('kpOcrBannerClose').onclick = () => collapseTo('1');
    bulb.onclick = () => collapseTo(null);
    $('kpOcrBannerAct').onclick = () => { collapseTo(null); globalThis.LHN_OCR?.open?.(); };
    if (checkbox) checkbox.onchange = event => { setNoAsk(event.target.checked); syncBanner({ needsOcr: true }); };
  }
  function collapseTo(state) {
    const banner = $('kpOcrBanner'), bulb = $('kpOcrBulb');
    if (!banner || !bulb) return;
    if (state === null) { delete banner.dataset.collapsed; banner.classList.add('show'); bulb.classList.remove('show'); }
    else { banner.dataset.collapsed = state; banner.classList.remove('show'); bulb.classList.add('show'); }
  }

  function toast(text) {
    const node = $('kpToast');
    if (!node || !text) return;
    node.textContent = text;
    node.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => node.classList.remove('show'), 2600);
  }

  /* ---------- khoanh vùng trên trang ---------- */
  function selectRegion({ label } = {}) {
    return new Promise(resolve => {
      const page = document.querySelector('#pageStack > [data-page] .docsSource') || document.querySelector('#pageStack [data-page] .docsSource');
      if (!page) { resolve(null); return; }
      const layer = el('div', 'kpOcrRegion');
      const hint = el('div', 'hint', label || t('ocrRegionHint'));
      const box = el('div', 'box');
      layer.append(hint, box);
      const rect0 = page.getBoundingClientRect();
      Object.assign(layer.style, { left: `${rect0.left}px`, top: `${rect0.top}px`, width: `${rect0.width}px`, height: `${rect0.height}px` });
      document.body.append(layer);
      let start = null;
      const point = event => ({
        x: Math.min(1, Math.max(0, (event.clientX - rect0.left) / Math.max(1, rect0.width))),
        y: Math.min(1, Math.max(0, (event.clientY - rect0.top) / Math.max(1, rect0.height)))
      });
      const draw = (a, b) => {
        box.style.left = `${Math.min(a.x, b.x) * 100}%`; box.style.top = `${Math.min(a.y, b.y) * 100}%`;
        box.style.width = `${Math.abs(a.x - b.x) * 100}%`; box.style.height = `${Math.abs(a.y - b.y) * 100}%`;
      };
      const stop = value => { layer.remove(); document.removeEventListener('keydown', escape); resolve(value); };
      const escape = event => { if (event.key === 'Escape') stop(null); };
      layer.addEventListener('pointerdown', event => { start = point(event); draw(start, start); });
      layer.addEventListener('pointermove', event => { if (start) draw(start, point(event)); });
      layer.addEventListener('pointerup', event => {
        if (!start) { stop(null); return; }
        const end = point(event);
        const rect = [Math.min(start.x, end.x), Math.min(start.y, end.y), Math.max(start.x, end.x), Math.max(start.y, end.y)];
        stop(rect[2] - rect[0] > .01 && rect[3] - rect[1] > .01 ? rect : null);
      });
      document.addEventListener('keydown', escape);
    });
  }

  globalThis.LHN_OCR_UI = Object.freeze({
    openDialog, closeDialog, dialogVisible, openCard, closeCard, current, setPage, setState, log, progress,
    finish, busy, toast, selectRegion, panel, panelText, closePanel, syncBanner
  });
})();
