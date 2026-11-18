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
    ['all', 'trashAll', ''],
    ['document', 'trashTypeDoc', 'documents'],
    ['note', 'trashTypeNote', 'notes'],
    ['dictation', 'trashTypeDictation', 'dictation'],
    ['speak', 'trashTypeSpeak', 'speak']
  ];
  const WIRED = new Set(['all', 'document']);
  let typeFilter = 'all';

  /* Never create the documents database from here: opening it with a version would make
     the library's own upgrade never run and leave it without object stores. */
  const openDb = () => new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
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
    const db = await openDb();
    if (!db.objectStoreNames.contains('meta')) { db.close(); return null; }
    return db;
  }
  const readAll = (db, store) => new Promise((resolve, reject) => {
    const request = db.transaction([store]).objectStore(store).getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
  function removeForever(id) {
    return new Promise((resolve, reject) => {
      const dbRequest = indexedDB.open(DB_NAME, DB_VERSION);
      dbRequest.onsuccess = () => {
        const db = dbRequest.result;
        if (!db.objectStoreNames.contains('meta')) { db.close(); resolve(); return; }
        const tx = db.transaction(['meta', 'files', 'translations'], 'readwrite');
        tx.objectStore('meta').delete(id);
        tx.objectStore('files').delete(id);
        const keys = tx.objectStore('translations').index('document').getAllKeys(id);
        keys.onsuccess = () => { for (const key of keys.result || []) tx.objectStore('translations').delete(key); };
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onerror = tx.onabort = () => { db.close(); reject(tx.error); };
      };
      dbRequest.onerror = () => reject(dbRequest.error);
    });
  }
  function restoreRecord(id) {
    return new Promise((resolve, reject) => {
      const dbRequest = indexedDB.open(DB_NAME, DB_VERSION);
      dbRequest.onsuccess = () => {
        const db = dbRequest.result;
        if (!db.objectStoreNames.contains('meta')) { db.close(); resolve(); return; }
        const tx = db.transaction(['meta'], 'readwrite');
        const store = tx.objectStore('meta');
        const record = store.get(id);
        record.onsuccess = () => { if (record.result) store.put({ ...record.result, deletedAt: null }); };
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onerror = tx.onabort = () => { db.close(); reject(tx.error); };
      };
      dbRequest.onerror = () => reject(dbRequest.error);
    });
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
    pdf:  { label:'PDF', color:'#e5484d', soft:'#fdecec',
      path:'<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v5h5"/><path d="M9 13h6M9 17h4"/>' },
    docx: { label:'Word', color:'#2f6fe4', soft:'#e9f0fd',
      path:'<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v5h5"/><path d="m8 12 1.6 5L12 13l2.4 4L16 12"/>' },
    pptx: { label:'PowerPoint', color:'#e2702b', soft:'#fdf0e7',
      path:'<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v5h5"/><path d="M9 17v-5h2.2a1.9 1.9 0 0 1 0 3.8H9"/>' },
    image:{ label:'', color:'#269b7b', soft:'#e9f8f1',
      path:'<rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="m4 17 4.6-4.3a2 2 0 0 1 2.7 0L16 17"/>' }
  };
  const kindOf = item => KIND[item.type] || KIND.pdf;
  function row(item) {
    const left = daysLeft(item.expires);
    const kind = kindOf(item);
    const label = kind.label || t('docs_image');
    const parts = [label];
    if (item.pages && item.type !== 'image') parts.push(`${item.pages} ${t('pagesShort')}`);
    parts.push(fmtSize(item.bytes));
    parts.push(t('trashDeletedOn', { date: fmtDate(Number(item.deletedAt)) }));
    return `<div class="trash-row" data-id="${item.id}">
      <span class="trash-ico kind-${item.type || 'pdf'}"><svg viewBox="0 0 24 24" aria-hidden="true">${kind.path}</svg></span>
      <span class="trash-main"><b>${escapeHtml(item.title || item.name || item.id)}</b>
        <span>${parts.join(' · ')}</span></span>
      <span class="trash-left">${t('trashDaysLeft', { days: left })}</span>
      <span class="trash-actions">
        <button type="button" class="trash-action primary" data-restore="${item.id}">${t('trashRestore')}</button>
        <button type="button" class="trash-action danger" data-purge="${item.id}">${t('trashPurge')}</button>
      </span>
    </div>`;
  }
  const escapeHtml = value => String(value).replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));

  async function render() {
    const list = $('trashList'), chips = $('trashChips'), summary = $('trashSummary');
    if (!list) return;
    let items = [];
    try { items = await load(); } catch { items = []; }
    const docs = items.filter(item => item.kind === 'document');
    const totalBytes = docs.reduce((sum, item) => sum + (Number(item.bytes) || 0), 0);
    if (chips) {
      chips.innerHTML = TYPES.map(([key, label, wired]) => {
        const count = key === 'all' ? items.length : key === 'document' ? docs.length : 0;
        const suffix = WIRED.has(key) ? `<i>${count}</i>` : `<i>${t('trashPending')}</i>`;
        return `<button type="button" class="trash-chip${typeFilter === key ? ' on' : ''}" data-t="${key}">${t(label)}${suffix}</button>`;
      }).join('');
    }
    if (summary) summary.textContent = `${t('trashSummary', { count: items.length, size: fmtSize(totalBytes) })} — ${t('trashRetention', { days: RETAIN_DAYS })}`;
    const visible = typeFilter === 'all' || typeFilter === 'document' ? docs : [];
    list.innerHTML = visible.length ? visible.map(row).join('') : `<div class="trash-empty">${t('trashEmpty')}</div>`;
  }

  async function mount() {
    await purgeExpired();
    await render();
  }

  document.addEventListener('click', event => {
    const chip = event.target.closest('[data-t]');
    if (chip) { typeFilter = chip.dataset.t; void render(); return; }
    const restore = event.target.closest('[data-restore]');
    if (restore) { void restoreItem(restore.dataset.restore); return; }
    const purge = event.target.closest('[data-purge]');
    if (purge) { void purgeItem(purge.dataset.purge); return; }
  });
  async function restoreItem(id) {
    try { await restoreRecord(id); refreshDocumentsFrame(); } catch { /* ignore */ }
    await render();
  }
  async function purgeItem(id) {
    if (!confirm(t('trashPurgeConfirm'))) return;
    try { await removeForever(id); refreshDocumentsFrame(); } catch { /* ignore */ }
    await render();
  }

  globalThis.KeepitTrash = { mount, refresh: render };
})();
