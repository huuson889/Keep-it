/* Trash route for the dashboard: every soft-deleted item lives here for 30 days.
   Today only documents are wired; notes, dictation and speaking have chips ready for
   the same data shape (deletedAt on the record). */
(() => {
  'use strict';
  const DB_NAME = 'keepit-documents', DB_VERSION = 1;
  const RETAIN_DAYS = 30, DAY = 86400000;
  const $ = id => document.getElementById(id);
  const t = (key, vars) => globalThis.LHN_LANGUAGES?.t?.(key, vars) ?? key;
  const TYPES = [
    ['all', 'trashAll'],
    ['document', 'trashTypeDoc'],
    ['note', 'trashTypeNote'],
    ['dictation', 'trashTypeDictation'],
    ['speak', 'trashTypeSpeak']
  ];
  const WIRED = new Set(['all', 'document']);
  const GROUPS = [
    ['today', 'trashGroupToday', 0],
    ['yesterday', 'trashGroupYesterday', 1],
    ['week', 'trashGroupWeek', 7]
  ];
  /* Time filter follows Gmail: it compares the age of the item itself (when the file was
     added to Keepit), not when it was deleted — the deleted date only spans the 30-day
     retention, so it cannot carry month/year steps. */
  const WHEN = [
    ['any', 'trashWhenAnyTime', 0],
    ['1w', 'trashWhenWeek', 7],
    ['1m', 'trashWhenMonth', 30],
    ['6m', 'trashWhen6Months', 182],
    ['1y', 'trashWhenYear', 365]
  ];
  const addedAt = item => Number(item.imported || item.createdAt || item.opened || 0);
  const PAGE_SIZE = 20;
  let typeFilter = 'all', when = 'any', customFrom = '', customTo = '';
  let query = '', selected = new Set(), page = 1;

  /* Never create the documents database from here: opening it with a version would make
     the library's own upgrade never run and leave it without object stores. */
  const openDb = version => new Promise((resolve, reject) => {
    const request = version ? indexedDB.open(DB_NAME, version) : indexedDB.open(DB_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('documentsDatabaseBlocked'));
  });
  async function openExisting() {
    try {
      if (typeof indexedDB.databases === 'function') {
        const list = await indexedDB.databases();
        if (!list.some(entry => entry.name === DB_NAME)) return null;
      }
    } catch { /* fall through to the version check */ }
    const db = await openDb(DB_VERSION);
    if (!db.objectStoreNames.contains('meta')) { db.close(); return null; }
    return db;
  }
  const readAll = (db, store) => new Promise((resolve, reject) => {
    const request = db.transaction([store]).objectStore(store).getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
  function removeForever(id) {
    return openDb(DB_VERSION).then(db => new Promise((resolve, reject) => {
      if (!db.objectStoreNames.contains('meta')) { db.close(); resolve(); return; }
      const tx = db.transaction(['meta', 'files', 'translations'], 'readwrite');
      tx.objectStore('meta').delete(id);
      tx.objectStore('files').delete(id);
      const keys = tx.objectStore('translations').index('document').getAllKeys(id);
      keys.onsuccess = () => { for (const key of keys.result || []) tx.objectStore('translations').delete(key); };
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = tx.onabort = () => { db.close(); reject(tx.error); };
    }));
  }
  function restoreRecord(id) {
    return openDb(DB_VERSION).then(db => new Promise((resolve, reject) => {
      if (!db.objectStoreNames.contains('meta')) { db.close(); resolve(); return; }
      const tx = db.transaction(['meta'], 'readwrite');
      const store = tx.objectStore('meta');
      const record = store.get(id);
      record.onsuccess = () => { if (record.result) store.put({ ...record.result, deletedAt: null }); };
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = tx.onabort = () => { db.close(); reject(tx.error); };
    }));
  }

  const fmtSize = bytes => {
    const value = Number(bytes) || 0;
    if (!value) return '0 KB';
    if (value >= 1073741824) return `${(value / 1073741824).toFixed(1)} GB`;
    if (value >= 1048576) return `${(value / 1048576).toFixed(1)} MB`;
    return `${Math.max(1, Math.round(value / 1024))} KB`;
  };
  const fmtDate = stamp => new Date(stamp).toLocaleDateString(undefined, { day:'2-digit', month:'2-digit', year:'numeric' });
  const daysLeft = expires => Math.max(0, Math.ceil((expires - Date.now()) / DAY));
  const daysSince = stamp => Math.floor((Date.now() - stamp) / DAY);
  const dayStart = value => {
    const [y, m, d] = String(value).split('-').map(Number);
    return new Date(y, m - 1, d, 0, 0, 0, 0).getTime();
  };
  const dayEnd = value => {
    const [y, m, d] = String(value).split('-').map(Number);
    return new Date(y, m - 1, d, 23, 59, 59, 999).getTime();
  };
  const escapeHtml = value => String(value).replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));

  async function load() {
    const db = await openExisting();
    if (!db) return [];
    const metas = await readAll(db, 'meta');
    db.close();
    const now = Date.now();
    return metas
      .filter(meta => Number(meta.deletedAt) > 0)
      .map(meta => ({ ...meta, kind:'document', expires: Number(meta.deletedAt) + RETAIN_DAYS * DAY }))
      .filter(item => item.expires > now)
      .sort((a, b) => b.deletedAt - a.deletedAt);
  }
  async function purgeExpired() {
    const db = await openExisting();
    if (!db) return 0;
    const metas = await readAll(db, 'meta');
    db.close();
    const now = Date.now();
    const dead = metas.filter(meta => Number(meta.deletedAt) > 0 && Number(meta.deletedAt) + RETAIN_DAYS * DAY <= now);
    for (const meta of dead) { try { await removeForever(meta.id); } catch { /* keep going */ } }
    return dead.length;
  }
  function refreshDocumentsFrame() {
    const frame = $('dashboardDocumentsFrame');
    try { frame?.contentWindow?.postMessage({ type:'KEEPIT_DOCUMENTS_REFRESH' }, location.origin); } catch { /* frame not ready */ }
  }

  /* Same colour language as the library cards, so a deleted PDF still reads as a PDF. */
  const KIND = {
    pdf:  { label:'PDF', path:'<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v5h5"/><path d="M9 13h6M9 17h4"/>' },
    docx: { label:'Word', path:'<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v5h5"/><path d="m8 12 1.6 5L12 13l2.4 4L16 12"/>' },
    pptx: { label:'PowerPoint', path:'<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v5h5"/><path d="M9 17v-5h2.2a1.9 1.9 0 0 1 0 3.8H9"/>' },
    image:{ label:'', path:'<rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="m4 17 4.6-4.3a2 2 0 0 1 2.7 0L16 17"/>' }
  };
  const kindOf = item => KIND[item.type] || KIND.pdf;

  function row(item) {
    const kind = kindOf(item);
    const label = kind.label || t('docs_image');
    const parts = [label];
    if (item.pages && item.type !== 'image') parts.push(`${item.pages} ${t('pagesShort')}`);
    parts.push(fmtSize(item.bytes));
    if (addedAt(item)) parts.push(t('trashAddedOn', { date: fmtDate(addedAt(item)) }));
    parts.push(t('trashDeletedOn', { date: fmtDate(Number(item.deletedAt)) }));
    const checked = selected.has(item.id) ? ' checked' : '';
    return `<div class="trash-row${checked ? ' is-picked' : ''}" data-id="${item.id}">
      <label class="trash-check" title="${escapeHtml(t('trashSelect'))}"><input type="checkbox" data-pick="${item.id}"${checked}><span></span></label>
      <span class="trash-ico kind-${item.type || 'pdf'}"><svg viewBox="0 0 24 24" aria-hidden="true">${kind.path}</svg></span>
      <span class="trash-main"><b>${escapeHtml(item.title || item.name || item.id)}</b>
        <span>${parts.join(' · ')}</span></span>
      <span class="trash-left">${t('trashDaysLeft', { days: daysLeft(item.expires) })}</span>
      <span class="trash-actions">
        <button type="button" class="trash-action primary" data-restore="${item.id}">${t('trashRestore')}</button>
        <button type="button" class="trash-action danger" data-purge="${item.id}">${t('trashPurge')}</button>
      </span>
    </div>`;
  }

  function groupOf(item) {
    const age = daysSince(Number(item.deletedAt));
    for (const [key, , limit] of GROUPS) if (age <= limit) return key;
    return 'older';
  }

  const whenActive = () => when !== 'any' && (when !== 'custom' || Boolean(customFrom || customTo));
  function whenOk(item) {
    const stamp = addedAt(item);
    if (when === 'custom') {
      if (!customFrom && !customTo) return true;
      if (!stamp) return false;
      if (customFrom && stamp < dayStart(customFrom)) return false;
      if (customTo && stamp > dayEnd(customTo)) return false;
      return true;
    }
    if (when === 'any') return true;
    if (!stamp) return false;
    const preset = WHEN.find(([key]) => key === when);
    const minDays = preset ? preset[2] : 0;
    return minDays === 0 || Date.now() - stamp >= minDays * DAY;
  }
  function whenText() {
    if (when === 'custom') {
      const from = customFrom ? fmtDate(dayStart(customFrom)) : '';
      const to = customTo ? fmtDate(dayEnd(customTo)) : '';
      if (from && to) return `${from} – ${to}`;
      if (from) return `${from} –`;
      if (to) return `– ${to}`;
      return t('trashWhenCustom');
    }
    const preset = WHEN.find(([key]) => key === when);
    return t(preset ? preset[1] : 'trashWhenAnyTime');
  }
  function renderWhen() {
    const opts = $('trashWhenOpts'), label = $('trashWhenLabel'), button = $('trashWhen');
    if (opts) opts.innerHTML = WHEN.map(([key, name]) => `<button type="button" class="trash-when-item${when === key ? ' on' : ''}" role="menuitemradio" aria-checked="${when === key}" data-when-item="${key}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 5 5L20 6"/></svg><span>${t(name)}</span></button>`).join('');
    if (label) label.textContent = whenText();
    if (button) button.classList.toggle('is-filtered', whenActive());
    const customItem = document.querySelector('#trashWhenMenu [data-when-item="custom"]');
    if (customItem) {
      customItem.classList.toggle('on', when === 'custom');
      customItem.setAttribute('aria-checked', String(when === 'custom'));
    }
    const panel = $('trashWhenCustom');
    if (panel) panel.hidden = when !== 'custom';
    const fromInput = $('trashWhenFrom'), toInput = $('trashWhenTo');
    if (fromInput && document.activeElement !== fromInput) fromInput.value = customFrom;
    if (toInput && document.activeElement !== toInput) toInput.value = customTo;
  }
  function setMenu(open) {
    const menu = $('trashWhenMenu'), button = $('trashWhen');
    if (!menu || !button) return;
    menu.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
    if (open) renderWhen();
  }

  async function render() {
    const list = $('trashList'), chips = $('trashChips'), summary = $('trashSummary');
    if (!list) return;
    let items = [];
    try { items = await load(); } catch { items = []; }
    const docs = items.filter(item => item.kind === 'document');
    const totalBytes = docs.reduce((sum, item) => sum + (Number(item.bytes) || 0), 0);
    const filterOn = Boolean(query.trim()) || whenActive();
    if (chips) {
      chips.innerHTML = TYPES.map(([key, label]) => {
        const count = key === 'all' ? items.length : key === 'document' ? docs.length : 0;
        const suffix = WIRED.has(key) ? `<i>${count}</i>` : `<i>${t('trashPending')}</i>`;
        return `<button type="button" class="trash-chip${typeFilter === key ? ' on' : ''}" data-t="${key}">${t(label)}${suffix}</button>`;
      }).join('');
    }
    const byType = typeFilter === 'all' || typeFilter === 'document' ? docs : [];
    const text = query.trim().toLocaleLowerCase();
    const visible = byType
      .filter(item => whenOk(item))
      .filter(item => !text || String(item.title || item.name || '').toLocaleLowerCase().includes(text));
    if (summary) {
      const body = filterOn
        ? t('trashSummaryFiltered', { shown: visible.length, count: items.length, size: fmtSize(totalBytes) })
        : t('trashSummary', { count: items.length, size: fmtSize(totalBytes) });
      summary.textContent = `${body} — ${t('trashRetention', { days: RETAIN_DAYS })}`;
    }
    for (const id of [...selected]) if (!visible.some(item => item.id === id)) selected.delete(id);

    const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
    if (page > pageCount) page = pageCount;
    if (page < 1) page = 1;
    const start = (page - 1) * PAGE_SIZE;
    const onPage = visible.slice(start, start + PAGE_SIZE);

    if (!visible.length) {
      list.innerHTML = `<div class="trash-empty">${items.length && filterOn ? t('trashNoMatch') : t('trashEmpty')}</div>`;
    } else {
      const buckets = new Map();
      for (const item of onPage) {
        const key = groupOf(item);
        if (!buckets.has(key)) buckets.set(key, []);
        buckets.get(key).push(item);
      }
      const order = [...GROUPS.map(([key]) => key), 'older'];
      list.innerHTML = order.filter(key => buckets.has(key)).map(key => {
        const label = key === 'older' ? t('trashGroupOlder') : t(GROUPS.find(([k]) => k === key)[1]);
        return `<h3 class="trash-group">${label}<i>${buckets.get(key).length}</i></h3>${buckets.get(key).map(row).join('')}`;
      }).join('');
    }
    syncBulkBar(visible, onPage);
    syncPager(visible.length, start, onPage.length);
  }

  /* Gmail-style paging: only one page of rows is built, so a big trash never renders
     thousands of DOM nodes at once. */
  function syncPager(total, start, shown) {
    const bar = $('trashPager');
    if (!bar) return;
    bar.hidden = total === 0;
    const info = $('trashPageInfo');
    if (info) info.textContent = t('trashPageInfo', { from: total ? start + 1 : 0, to: start + shown, count: total });
    const prev = $('trashPrev'), next = $('trashNext');
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    if (prev) prev.disabled = page <= 1;
    if (next) next.disabled = page >= pages;
  }
  function goPage(delta) {
    const next = page + delta;
    if (next < 1) return;
    page = next;
    void render().then(() => { const list = $('trashList'); if (list) list.scrollTop = 0; });
  }

  function syncBulkBar(visible, onPage) {
    const bar = $('trashBulk'), count = $('trashBulkCount'), all = $('trashSelectAll');
    if (!bar) return;
    // "Select all" covers the rows of the current page, like Gmail's page checkbox.
    const pageRows = onPage || visible || [];
    const pickedOnPage = pageRows.filter(item => selected.has(item.id)).length;
    bar.hidden = !(visible && visible.length > 0);
    if (count) count.textContent = selected.size ? t('trashSelected', { count: selected.size }) : '';
    if (all) {
      all.checked = pageRows.length > 0 && pickedOnPage === pageRows.length;
      all.indeterminate = pickedOnPage > 0 && pickedOnPage < pageRows.length;
      all.disabled = pageRows.length === 0;
    }
    for (const button of bar.querySelectorAll('[data-bulk]')) button.disabled = selected.size === 0;
    const emptyAll = $('trashEmptyAll');
    if (emptyAll) emptyAll.disabled = !$('trashList')?.querySelector('.trash-row');
  }

  async function mount() {
    await purgeExpired();
    selected = new Set();
    when = 'any'; customFrom = ''; customTo = ''; page = 1;
    setMenu(false);
    renderWhen();
    await render();
  }

  document.addEventListener('click', event => {
    const menu = $('trashWhenMenu');
    if (menu && !menu.hidden && !event.target.closest('.trash-when')) setMenu(false);
    if (event.target.closest('#trashWhen')) { setMenu(menu ? menu.hidden : false); return; }
    const whenItem = event.target.closest('[data-when-item]');
    if (whenItem) {
      when = whenItem.dataset.whenItem;
      page = 1;
      if (when !== 'custom') { customFrom = ''; customTo = ''; setMenu(false); }
      renderWhen();
      void render();
      return;
    }
    if (event.target.closest('#trashWhenApply')) {
      customFrom = $('trashWhenFrom')?.value || '';
      customTo = $('trashWhenTo')?.value || '';
      if (!customFrom && !customTo) when = 'any';
      page = 1;
      renderWhen();
      setMenu(false);
      void render();
      return;
    }
    if (event.target.closest('#trashWhenClear')) {
      when = 'any'; customFrom = ''; customTo = '';
      page = 1;
      renderWhen();
      setMenu(false);
      void render();
      return;
    }
    const chip = event.target.closest('[data-t]');
    if (chip) { typeFilter = chip.dataset.t; page = 1; void render(); return; }
    const restore = event.target.closest('[data-restore]');
    if (restore) { void restoreItems([restore.dataset.restore]); return; }
    const purge = event.target.closest('[data-purge]');
    if (purge) { void purgeItems([purge.dataset.purge]); return; }
    const bulk = event.target.closest('[data-bulk]');
    if (bulk) { void (bulk.dataset.bulk === 'restore' ? restoreItems([...selected]) : purgeItems([...selected])); return; }
    if (event.target.closest('#trashEmptyAll')) { void emptyAll(); return; }
    const pg = event.target.closest('[data-pg]');
    if (pg) { goPage(pg.dataset.pg === 'next' ? 1 : -1); }
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const menu = $('trashWhenMenu');
    if (menu && !menu.hidden) { setMenu(false); $('trashWhen')?.focus(); }
  });
  document.addEventListener('change', event => {
    const pick = event.target.closest('[data-pick]');
    if (pick) {
      if (pick.checked) selected.add(pick.dataset.pick); else selected.delete(pick.dataset.pick);
      pick.closest('.trash-row')?.classList.toggle('is-picked', pick.checked);
      void render();
      return;
    }
    if (event.target.id === 'trashSelectAll') {
      const ids = [...document.querySelectorAll('#trashList .trash-row')].map(node => node.dataset.id);
      selected = event.target.checked ? new Set(ids) : new Set();
      void render();
    }
  });
  document.addEventListener('input', event => {
    if (event.target.id !== 'trashSearch') return;
    query = event.target.value;
    page = 1;
    void render();
  });

  async function restoreItems(ids) {
    for (const id of ids) { try { await restoreRecord(id); } catch { /* keep going */ } }
    for (const id of ids) selected.delete(id);
    refreshDocumentsFrame();
    await render();
  }
  async function purgeItems(ids) {
    if (!ids.length) return;
    if (!confirm(t(ids.length > 1 ? 'trashPurgeManyConfirm' : 'trashPurgeConfirm'))) return;
    for (const id of ids) { try { await removeForever(id); } catch { /* keep going */ } }
    for (const id of ids) selected.delete(id);
    refreshDocumentsFrame();
    await render();
  }
  async function emptyAll() {
    let items = [];
    try { items = await load(); } catch { items = []; }
    if (!items.length) return;
    if (!confirm(t('trashEmptyAllConfirm', { count: items.length }))) return;
    for (const item of items) { try { await removeForever(item.id); } catch { /* keep going */ } }
    selected = new Set();
    refreshDocumentsFrame();
    await render();
  }

  globalThis.KeepitTrash = { mount, refresh: render };
})();
