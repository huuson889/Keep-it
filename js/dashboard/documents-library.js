/* v3.5.431 — Thư viện Tài liệu vẽ trong Dashboard (Bản 1: xem, mở, xoá, nhập tệp).
   Đọc thẳng kho keepit-documents như tab Thùng rác đang làm, nên không cần khung để vẽ danh sách.
   Mở tệp: gửi KEEPIT_DOCUMENTS_OPEN cho khung (khung chỉ còn việc xem tệp).
   Nhập tệp: chọn/kéo thả ở đây, chuyển File cho khung xử lý (kiểm dung lượng, chống trùng, tách trang)
   — Bản 2 sẽ chuyển hẳn phần nhập sang Dashboard kèm thanh tiến trình. */
(() => {
  'use strict';
  const ROOT_ID = 'dashboardDocumentsView';
  const MB = 1048576, FRAME_ID = 'dashboardDocumentsFrame';
  const t = (key, vars) => globalThis.LHN_LANGUAGES?.t?.('docs_' + key, vars) ?? key;
  const lang = () => document.documentElement.lang || 'en';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const SVG = {
    page: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v5h5M8 13h8M8 17h6"/>',
    arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
    play: '<path d="m7 4 13 8-13 8Z"/>',
    trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="m19 6-1 14H6L5 6"/><path d="M10 11v5M14 11v5"/>',
    spark: '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
    book: '<path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>'
  };
  const ic = key => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${SVG[key] || SVG.page}</svg>`;
  const TYPE = { pdf: { label: 'PDF', color: 'var(--pdf)' }, docx: { label: 'Word', color: 'var(--docx)' }, pptx: { label: 'PowerPoint', color: 'var(--pptx)' }, image: { get label() { return t('image'); }, color: 'var(--green)' } };
  const unit = d => t(d.image ? 'image' : d.type === 'pptx' ? 'slides' : 'pages');
  const fmtSize = n => n >= MB ? (n / MB).toLocaleString(lang(), { maximumFractionDigits: 1 }) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB';
  const date = n => n ? new Date(n).toLocaleDateString(lang()) : '';

  let docs = [], filter = 'all', q = '', sort = 'recent', mounted = false, root = null, el = {};
  let dbPromise = null, pendingImport = 0;

  function openDb() {
    if (!dbPromise) dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open('keepit-documents', 1);
      request.onupgradeneeded = () => { /* Dashboard không tạo store: kho do trang Tài liệu khởi tạo */ };
      request.onsuccess = () => { const db = request.result; db.onversionchange = () => { db.close(); dbPromise = null; }; resolve(db); };
      request.onerror = () => { dbPromise = null; reject(request.error); };
      request.onblocked = () => { dbPromise = null; reject(new Error('documentsDatabaseBlocked')); };
    });
    return dbPromise;
  }
  async function withStore(name, mode, action) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      let tx;
      try { tx = db.transaction([name], mode); } catch (error) { reject(error); return; }
      const store = tx.objectStore(name);
      let value;
      tx.oncomplete = () => resolve(value);
      tx.onerror = tx.onabort = () => reject(tx.error || new Error('documentsStorageFailed'));
      try { action(store, result => { value = result; }); } catch (error) { try { tx.abort(); } catch { /* ignore */ } reject(error); }
    });
  }
  const allMeta = () => withStore('meta', 'readonly', (store, done) => { const r = store.getAll(); r.onsuccess = () => done(r.result || []); });
  function patchMeta(id, patch) {
    return withStore('meta', 'readwrite', (store, done) => {
      const get = store.get(id);
      get.onsuccess = () => { const record = get.result; if (!record) return done(null); const next = { ...record, ...patch }; store.put(next); done(next); };
    });
  }

  /* ---------- vẽ ---------- */
  function ensureShell() {
    root = document.getElementById(ROOT_ID);
    if (!root) return false;
    let lib = root.querySelector('.dlib');
    if (lib) { el = mapEls(lib); return true; }
    lib = document.createElement('div');
    lib.className = 'dlib';
    lib.innerHTML = `
      <section class="row">
        <div class="hero">
          <div style="position:relative;z-index:1">
            <div class="eyebrow">${ic('spark')}<span>${esc(t('library'))}</span></div>
            <h1>${esc(t('hero'))}</h1>
            <p>${esc(t('heroSub'))}</p>
            <div class="chips">
              <span class="chip">${esc(t('formats'))}</span>
              <span class="chip">${esc(t('rememberFlow'))}</span>
              <span class="chip">${ic('book')}<span>${esc(t('local'))}</span></span>
            </div>
          </div>
          <div class="heroIcon"><span>${ic('page')}</span></div>
        </div>
        <div class="continue" id="docLibContinue"></div>
      </section>
      <section class="panel drop">
        <label class="dz" id="docLibDz">
          <span class="dzIcon">${ic('upload')}</span>
          <span><b>${esc(t('drop'))}</b><small>${esc(t('formats'))}</small></span>
          <span class="types"><span class="pill">PDF</span><span class="pill">DOCX</span><span class="pill">PPTX</span><span class="pill">${esc(t('images'))}</span></span>
          <input accept=".pdf,.docx,.pptx,.jpg,.jpeg,.png,.webp" hidden type="file" multiple id="docLibFile">
        </label>
        <div class="dzNote">${ic('shield')}<span>${esc(t('privacy'))}</span></div>
      </section>
      <section class="lib">
        <div>
          <div class="libHead"><div><h3>${esc(t('library'))}</h3><p>${esc(t('librarySub'))}</p></div><span class="count" id="docLibCount"></span></div>
          <div class="tools">
            <div class="seg" id="docLibFilters"></div>
            <label class="search">${ic('search')}<input type="search" id="docLibQ" placeholder="${esc(t('search'))}" aria-label="${esc(t('search'))}"></label>
            <select class="sort" id="docLibSort" aria-label="${esc(t('sortName'))}"></select>
          </div>
          <div class="grid" id="docLibGrid"></div>
        </div>
        <div class="aside">
          <div class="panel"><h5>${esc(t('stats'))}</h5><div class="sub">${esc(t('statsSub'))}</div><div class="mini" id="docLibStats"></div></div>
          <div class="panel"><h5>${esc(t('helpTitle'))}</h5><p class="sub" style="margin-bottom:0">${esc(t('helpText'))}</p></div>
        </div>
      </section>`;
    root.insertBefore(lib, root.querySelector('#' + FRAME_ID));
    el = mapEls(lib);
    wire(lib);
    return true;
  }
  function mapEls(lib) {
    return {
      lib, continue: lib.querySelector('#docLibContinue'), dz: lib.querySelector('#docLibDz'), file: lib.querySelector('#docLibFile'),
      filters: lib.querySelector('#docLibFilters'), q: lib.querySelector('#docLibQ'), sort: lib.querySelector('#docLibSort'),
      grid: lib.querySelector('#docLibGrid'), count: lib.querySelector('#docLibCount'), stats: lib.querySelector('#docLibStats')
    };
  }

  function renderContinue() {
    const current = [...docs].filter(d => !d.image && !d.scan && d.at < d.pages).sort((a, b) => b.opened - a.opened)[0];
    el.continue.innerHTML = current
      ? `<div class="cBody"><div class="cEyebrow">${ic('play')}${esc(t('continue'))}</div><h2>${esc(current.title)}</h2><div class="desc">${esc(t('atPage', { page: current.at, total: current.pages }))}</div><div class="pills"><span class="pill">${esc(TYPE[current.type].label)}</span><span class="pill">${esc(t('notesCount', { count: current.notes || 0 }))}</span></div><button class="btnP" type="button" data-open="${esc(current.id)}">${ic('play')}${esc(t('continue'))}</button> <button class="btnL" type="button" data-open="${esc(current.id)}" data-mode="read">${esc(t('readMode'))}</button></div><div class="cThumb">${thumb(current)}</div>`
      : `<div class="cBody"><div class="cEyebrow">${esc(t('library'))}</div><h2>${esc(t('noContinue'))}</h2><div class="desc">${esc(t('noContinueSub'))}</div><button class="btnP" type="button" data-choose>${esc(t('choose'))}</button></div>`;
  }
  function thumb(d) {
    return d.thumbnail ? `<img src="${esc(d.thumbnail)}" alt="" loading="lazy">` : `<span class="fileFallback">${esc(TYPE[d.type].label)}</span>`;
  }
  function renderFilters() {
    el.filters.innerHTML = [['all', t('all')], ['pdf', 'PDF'], ['docx', 'Word'], ['pptx', 'PowerPoint'], ['image', t('images')]]
      .map(([key, label]) => `<button type="button" data-f="${key}" class="${filter === key ? 'on' : ''}">${esc(label)}<i>${key === 'all' ? docs.length : docs.filter(d => d.type === key).length}</i></button>`).join('');
  }
  function renderSort() {
    el.sort.innerHTML = [['recent', t('recent')], ['name', t('sortName')], ['progress', t('progress')]]
      .map(([value, label]) => `<option value="${value}"${sort === value ? ' selected' : ''}>${esc(label)}</option>`).join('');
  }
  function renderGrid() {
    const query = q.toLocaleLowerCase();
    let list = docs.filter(d => (filter === 'all' || d.type === filter) && String(d.name || '').toLocaleLowerCase().includes(query));
    list.sort(sort === 'name' ? (a, b) => String(a.name || '').localeCompare(String(b.name || ''))
      : sort === 'progress' ? (a, b) => b.at / Math.max(1, b.pages) - a.at / Math.max(1, a.pages)
      : (a, b) => b.opened - a.opened);
    el.grid.innerHTML = list.length ? list.map(d => `<article class="card" data-open="${esc(d.id)}" tabindex="0" role="button" aria-label="${esc(t('open') + ' ' + d.name)}">
      <div class="thumb ${esc(d.type)}"><span class="type"><i style="background:${TYPE[d.type].color}"></i>${esc(TYPE[d.type].label)}</span><div class="pg">${thumb(d)}</div></div>
      <div class="cardBody"><h4>${esc(d.title)}</h4>
        <div class="meta">${ic('page')}${d.image ? `${esc(d.format)} · ${d.width} × ${d.height} px` : `${d.pages} ${esc(unit(d))}`} · ${esc(fmtSize(d.bytes))}</div>
        ${d.image || d.scan ? `<div class="imageMeta">${esc(t(d.image ? 'originalImage' : 'noText'))}</div>`
          : `<div class="prog"><div class="lbl"><span>${esc(t('progress'))}</span><strong>${d.at} / ${d.pages}</strong></div><div class="track"><div class="fill" style="width:${Math.round(d.at / Math.max(1, d.pages) * 100)}%"></div></div></div>`}
        <div class="foot"><span class="stats">${esc(date(d.opened))} · ${esc(t('notesCount', { count: d.notes || 0 }))}</span>
          <button class="cardDel" type="button" data-del="${esc(d.id)}" title="${esc(t('trashMove'))}" aria-label="${esc(t('trashMove'))}">${ic('trash')}</button>
          <button class="go" type="button" data-open="${esc(d.id)}">${esc(t(d.at > 1 ? 'resume' : 'open'))} ${ic('arrow')}</button>
        </div></div></article>`).join('') : `<div class="empty">${esc(t(docs.length ? 'noMatch' : 'empty'))}</div>`;
  }
  function renderStats() {
    el.count.textContent = t('filesCount', { count: docs.length });
    const stats = [['title', docs.length], ['readPages', docs.reduce((n, d) => n + (d.image || d.scan ? 0 : d.at), 0)],
      ['highlights', docs.reduce((n, d) => n + (d.hl || 0), 0)], ['notes', docs.reduce((n, d) => n + (d.notes || 0), 0)]];
    el.stats.innerHTML = stats.map(([key, n]) => `<div><small>${esc(t(key))}</small><b>${n}</b></div>`).join('');
  }
  function render() {
    if (!root || !el.grid) return;
    renderContinue(); renderFilters(); renderSort(); renderGrid(); renderStats();
  }

  /* ---------- hành động ---------- */
  function frame() { return document.getElementById(FRAME_ID); }
  function postToFrame(message) {
    const f = frame();
    if (!f) return false;
    try {
      if (!f.getAttribute('src')) { window.setDashboardView?.('documents'); }
      f.contentWindow?.postMessage(message, location.origin);
      return true;
    } catch { return false; }
  }
  let pendingOpen = null;
  function openDoc(id, mode) {
    if (!id) return;
    pendingOpen = { type: 'KEEPIT_DOCUMENTS_OPEN', id, mode: mode || 'orig' };
    flushOpen();
  }
  function flushOpen() {
    const f = frame();
    if (!pendingOpen || !f) return;
    if (f.getAttribute('src') && f.contentDocument?.readyState !== 'complete') return; // đợi load
    const message = pendingOpen; pendingOpen = null;
    try { f.contentWindow?.postMessage(message, location.origin); } catch { /* frame not ready */ }
  }
  async function copyTrash(id, doc) {
    const now = Date.now();
    try {
      await patchMeta(id, { deletedAt: now });
      const message = `${t('trashMoved')}`;
      globalThis.toast?.(message, { label: t('trashUndo'), run: async () => {
        try { await patchMeta(id, { deletedAt: 0 }); globalThis.toast?.(t('trashRestored')); }
        catch { globalThis.toast?.(t('storageFailed')); }
        await refresh();
        window.KeepitTrash?.refresh?.();
      } });
      await refresh();
      window.KeepitTrash?.refresh?.();
    } catch { globalThis.toast?.(t('storageFailed')); }
    void doc;
  }
  async function importFiles(fileList) {
    const files = [...(fileList || [])].filter(Boolean);
    if (!files.length) return;
    pendingImport += files.length;
    globalThis.toast?.(t('opening'));
    const f = frame();
    if (!f) return;
    const send = () => { try { f.contentWindow?.postMessage({ type: 'KEEPIT_DOCUMENTS_IMPORT_FILES', files }, location.origin); } catch { /* frame gone */ } };
    if (f.getAttribute('src') && f.contentDocument?.readyState === 'complete') send();
    else { f.addEventListener('load', send, { once: true }); window.setDashboardView?.('documents'); }
  }

  function wire(lib) {
    lib.addEventListener('click', event => {
      const choose = event.target.closest('[data-choose]');
      if (choose) { event.preventDefault(); el.file?.click(); return; }
      const del = event.target.closest('[data-del]');
      if (del) { event.preventDefault(); event.stopPropagation(); void copyTrash(del.dataset.del); return; }
      const open = event.target.closest('[data-open]');
      if (open) { event.preventDefault(); openDoc(open.dataset.open, open.dataset.mode); return; }
      const chip = event.target.closest('[data-f]');
      if (chip) { filter = chip.dataset.f; render(); }
    });
    lib.addEventListener('keydown', event => {
      if (['Enter', ' '].includes(event.key) && event.target.matches('.card')) { event.preventDefault(); openDoc(event.target.dataset.open); }
    });
    lib.addEventListener('input', event => {
      if (event.target === el.q) { q = event.target.value; render(); }
    });
    lib.addEventListener('change', event => {
      if (event.target === el.sort) { sort = event.target.value; render(); return; }
      if (event.target === el.file) { void importFiles(event.target.files); event.target.value = ''; }
    });
    el.dz?.addEventListener('dragover', event => { event.preventDefault(); el.dz.classList.add('over'); });
    el.dz?.addEventListener('dragleave', () => el.dz.classList.remove('over'));
    el.dz?.addEventListener('drop', event => {
      event.preventDefault(); el.dz.classList.remove('over');
      void importFiles(event.dataTransfer?.files);
    });
  }

  async function refresh() {
    try { docs = (await allMeta()).filter(d => !d.deletedAt).sort((a, b) => (b.opened || 0) - (a.opened || 0)); }
    catch { docs = []; }
    render();
  }
  async function mount() {
    if (!ensureShell()) return;
    mounted = true;
    render();
    await refresh();
  }

  frame()?.addEventListener('load', flushOpen);
  addEventListener('message', event => {
    if (event.origin !== location.origin || event.source !== frame()?.contentWindow) return;
    const data = event.data || {};
    if (data.type === 'KEEPIT_DOCUMENTS_LIBRARY_CHANGED') void refresh();
    if (data.type === 'KEEPIT_DOCUMENTS_IMPORTED') {
      pendingImport = 0;
      void refresh();
      // v3.5.478: "0 tài liệu" không còn là câu duy nhất — nói rõ vì sao không thêm được.
      const count = Number(data.count) || 0, skipped = Number(data.skipped) || 0, reason = String(data.error || '');
      const KNOWN = { unsupported:'unsupported', fileLimit:'fileLimit', documentsBusy:'documentsBusy', documentsBadFile:'badFile', storageFailed:'storageFailed', documentsDatabaseBlocked:'dbBlocked' };
      if (reason) globalThis.toast?.(t(KNOWN[reason] || 'importFailed'));
      else if (count) globalThis.toast?.(t('filesCount', { count }));
      else if (skipped) globalThis.toast?.(t('importDuplicate'));
      else globalThis.toast?.(t('importFailed'));
    }
  });
  if (globalThis.browser?.storage?.onChanged) {
    globalThis.browser.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes.lhnSettings && mounted) void mount();
    });
  }

  globalThis.KeepitDocumentsLibrary = { mount, refresh, open: openDoc };
})();
