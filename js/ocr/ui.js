// OCR UI: the run dialog, the progress card and the region selector. Labels come from
// languages.js (`ocr*` keys) so the same markup works in en/vi/ko. No engine code here.
(() => {
  'use strict';
  if (globalThis.LHN_OCR_UI) return;
  const t = (key, params) => globalThis.LHN_LANGUAGES?.t?.(key, params, document.documentElement.lang) ?? key;
  let card = null, dialog = null;

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }
  function mount(node) {
    const host = document.getElementById('viewer') || document.body;
    host.append(node);
    return node;
  }

  /* ---------- run dialog: mode + scope ---------- */
  function openDialog({ mode = 'pp', scope = 'page', modes = ['pp', 'fusor', 'tess'], onRun, onCancel } = {}) {
    closeDialog();
    dialog = el('section', 'ocrDialog');
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'false');
    const head = el('header'), title = el('b', null, t('ocrTitle'));
    const close = el('button', 'vbtn', '✕');
    close.setAttribute('aria-label', t('ocrCancel'));
    close.onclick = () => { closeDialog(); onCancel?.(); };
    head.append(title, close);

    const body = el('div', 'ocrBody');
    body.append(el('div', 'ocrLabel', t('ocrMode')));
    const modeRow = el('div', 'ocrChoices');
    let pickedMode = mode;
    const modeNames = { pp: 'ocrModePP', fusor: 'ocrModeFusor', tess: 'ocrModeTess' };
    for (const value of modes) {
      const label = el('label', 'ocrChoice');
      const input = el('input');
      input.type = 'radio'; input.name = 'ocrMode'; input.value = value;
      input.checked = value === mode;
      input.onchange = () => { pickedMode = value; };
      label.append(input, el('span', null, t(modeNames[value] || value)));
      modeRow.append(label);
    }
    body.append(modeRow, el('div', 'ocrLabel', t('ocrScope')));
    const scopeRow = el('div', 'ocrChoices');
    let pickedScope = scope;
    for (const [value, key] of [['page', 'ocrScopePage'], ['all', 'ocrScopeAll']]) {
      const label = el('label', 'ocrChoice');
      const input = el('input');
      input.type = 'radio'; input.name = 'ocrScope'; input.value = value;
      input.checked = value === scope;
      input.onchange = () => { pickedScope = value; };
      label.append(input, el('span', null, key === 'ocrScopeAll' ? t(key, { count: globalThis.LHN_DOCUMENTS_OCR?.info?.()?.pages || 1 }) : t(key)));
      scopeRow.append(label);
    }
    body.append(scopeRow);

    const foot = el('div', 'ocrFoot');
    const cancel = el('button', null, t('ocrCancel'));
    cancel.onclick = () => { closeDialog(); onCancel?.(); };
    const run = el('button', 'primary', t('ocrRun'));
    run.onclick = () => { const options = { mode: pickedMode, scope: pickedScope }; closeDialog(); onRun?.(options); };
    foot.append(cancel, run);
    dialog.append(head, body, foot);
    mount(dialog);
    run.focus?.();
    return dialog;
  }
  function closeDialog() { dialog?.remove(); dialog = null; }

  /* ---------- progress card ---------- */
  function openCard({ onStop, onForce, onAgain, onRegion, onClose } = {}) {
    closeCard();
    card = { started: Date.now(), timer: 0, stopRequested: false, closed: false };
    const root = el('section', 'ocrCard');
    root.setAttribute('aria-live', 'polite');
    const head = el('header'), dot = el('span', 'dot'), title = el('b', null, t('ocrTitleRun'));
    const page = el('span', 'pg', '');
    const close = el('button', 'vbtn', '✕');
    close.setAttribute('aria-label', t('ocrClose'));
    close.onclick = () => { if (card.busy) return; onClose?.(); };
    head.append(dot, title, page, close);

    const body = el('div', 'ocrCardBody');
    const top = el('div', 'ocrTop'), state = el('b', null, t('ocrPreparing')), clock = el('span', 'clock', '0.0');
    top.append(state, clock);
    const bar = el('progress'); bar.max = 1; bar.value = 0;
    const logBox = el('div', 'ocrLog');
    const done = el('div', 'ocrDone');
    const sum = el('div', 'ocrSum'), warn = el('div', 'ocrWarn');
    done.append(sum, warn);
    const foot = el('div', 'ocrFoot');
    const stop = el('button', 'primary', t('ocrStop'));
    const force = el('button', null, t('ocrForce'));
    const again = el('button', null, t('ocrAgain'));
    const region = el('button', null, t('ocrRegion'));
    force.hidden = true; again.hidden = true; region.hidden = true;
    stop.onclick = () => { if (card.stopRequested) return; card.stopRequested = true; onStop?.(); };
    force.onclick = () => onForce?.();
    again.onclick = () => onAgain?.();
    region.onclick = () => onRegion?.();
    foot.append(stop, force, again, region);
    body.append(top, bar, logBox, done, foot);
    root.append(head, body);
    mount(root);

    card.root = root; card.title = title; card.pageLabel = page; card.state = state; card.clock = clock;
    card.bar = bar; card.logBox = logBox; card.sum = sum; card.warn = warn; card.actions = { stop, force, again, region, close };
    card.busy = true;
    card.timer = setInterval(() => {
      if (!card) return;
      clock.textContent = ((Date.now() - card.started) / 1000).toFixed(1);
    }, 200);
    return card;
  }
  function closeCard() {
    if (!card) return;
    clearInterval(card.timer);
    card.root?.remove();
    card = null;
  }
  const current = () => card;
  function setPage(text) { if (card) card.pageLabel.textContent = text; }
  function setState(main) { if (card && main) { card.state.textContent = main; log(main); } }
  function log(line) {
    if (!card || !line) return;
    const text = String(line).trim();
    if (!text || card.logBox.firstElementChild?.textContent === text) return;
    card.logBox.prepend(el('div', null, text));
    while (card.logBox.children.length > 3) card.logBox.lastElementChild.remove();
  }
  function progress(value) { if (card) card.bar.value = Math.max(0, Math.min(1, value)); }
  function finish({ kind = 'done', summary = '', warning = '' } = {}) {
    if (!card) return;
    card.busy = false;
    clearInterval(card.timer);
    card.root.classList.remove('done', 'stopped', 'error');
    card.root.classList.add(kind === 'done' ? 'done' : kind === 'error' ? 'error' : 'stopped');
    card.title.textContent = kind === 'done' ? t('ocrTitleDone') : kind === 'error' ? t('ocrTitleError') : t('ocrTitleStopped');
    card.sum.textContent = summary;
    card.warn.textContent = warning;
    card.warn.hidden = !warning;
    card.actions.stop.hidden = true;
    card.actions.force.hidden = true;
    card.actions.again.hidden = false;
    card.actions.region.hidden = false;
  }
  function busy(value) { if (card) card.busy = value; }
  function toast(text) {
    if (!text) return;
    const host = document.getElementById('viewer') || document.body;
    const node = el('div', 'ocrToast', text);
    host.append(node);
    setTimeout(() => node.classList.add('show'), 10);
    setTimeout(() => { node.classList.remove('show'); setTimeout(() => node.remove(), 250); }, 2600);
  }

  /* ---------- region selector over the current page ---------- */
  function selectRegion({ label } = {}) {
    return new Promise(resolve => {
      const stage = document.getElementById('stage');
      const page = document.querySelector('#pageStack > [data-page] .docsSource');
      if (!stage || !page) { resolve(null); return; }
      const layer = el('div', 'ocrRegionLayer');
      const hint = el('div', 'ocrRegionHint', label || t('ocrRegionHint'));
      const box = el('div', 'ocrRegionBox');
      layer.append(hint, box);
      const rect0 = page.getBoundingClientRect();
      Object.assign(layer.style, { left: `${rect0.left}px`, top: `${rect0.top}px`, width: `${rect0.width}px`, height: `${rect0.height}px` });
      document.body.append(layer);
      let start = null;
      const point = event => ({ x: Math.min(1, Math.max(0, (event.clientX - rect0.left) / rect0.width)), y: Math.min(1, Math.max(0, (event.clientY - rect0.top) / rect0.height)) });
      const draw = (a, b) => {
        box.style.left = `${Math.min(a.x, b.x) * 100}%`; box.style.top = `${Math.min(a.y, b.y) * 100}%`;
        box.style.width = `${Math.abs(a.x - b.x) * 100}%`; box.style.height = `${Math.abs(a.y - b.y) * 100}%`;
      };
      layer.addEventListener('pointerdown', event => { start = point(event); draw(start, start); layer.setPointerCapture?.(event.pointerId); });
      layer.addEventListener('pointermove', event => { if (start) draw(start, point(event)); });
      layer.addEventListener('pointerup', event => {
        const end = point(event), rect = [Math.min(start.x, end.x), Math.min(start.y, end.y), Math.max(start.x, end.x), Math.max(start.y, end.y)];
        layer.remove();
        resolve(rect[2] - rect[0] > .01 && rect[3] - rect[1] > .01 ? rect : null);
      });
      layer.addEventListener('keydown', event => { if (event.key === 'Escape') { layer.remove(); resolve(null); } });
      document.addEventListener('keydown', function escape(event) {
        if (event.key !== 'Escape') return;
        document.removeEventListener('keydown', escape);
        layer.remove(); resolve(null);
      });
    });
  }

  globalThis.LHN_OCR_UI = Object.freeze({
    openDialog, closeDialog, openCard, closeCard, current, setPage, setState, log, progress, finish, busy, toast, selectRegion
  });
})();
