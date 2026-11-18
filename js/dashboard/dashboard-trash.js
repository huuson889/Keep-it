/* Trash route for the dashboard: every soft-deleted item lives here for 30 days.
   Documents come from the documents IndexedDB, notes (highlights/annotations) come from
   the background annotations store through messages; dictation and speaking still show
   the "coming soon" chip. */
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
  const WIRED = new Set(['all', 'document', 'note', 'dictation']);
  const DICTATION_KEY = 'dictation:session-index:v1';
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
  let freeBytes = null, itemsCache = [], expanded = new Set(), expandAll = false;
  const PAGE_PREFIX = 'page:';
  const pageKeyOf = item => String(item?.url || '');

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
  /* "Delete forever" is still undoable while the toast lives: the record (and the file
     blob) is read before the delete and written back if the user undoes it. */
  const readOne = (db, store, pick) => new Promise((resolve, reject) => {
    const request = pick(db.transaction([store]).objectStore(store));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  async function snapshotDocument(id) {
    const db = await openExisting();
    if (!db) return null;
    try {
      if (!db.objectStoreNames.contains('meta')) return null;
      const meta = await readOne(db, 'meta', store => store.get(id));
      if (!meta) return null;
      const file = db.objectStoreNames.contains('files') ? await readOne(db, 'files', store => store.get(id)) : null;
      const translations = db.objectStoreNames.contains('translations') ? await readOne(db, 'translations', store => store.index('document').getAll(id)) : [];
      return { meta, file, translations: translations || [] };
    } catch { return null; } finally { db.close(); }
  }
  async function restoreDocument(snapshot) {
    if (!snapshot?.meta) return;
    const db = await openExisting();
    if (!db) return;
    try {
      const names = ['meta', ...(snapshot.file ? ['files'] : []), ...(snapshot.translations.length ? ['translations'] : [])]
        .filter(name => db.objectStoreNames.contains(name));
      await new Promise((resolve, reject) => {
        const tx = db.transaction(names, 'readwrite');
        tx.objectStore('meta').put(snapshot.meta);
        if (snapshot.file) tx.objectStore('files').put(snapshot.file);
        for (const item of snapshot.translations || []) tx.objectStore('translations').put(item);
        tx.oncomplete = () => resolve();
        tx.onerror = tx.onabort = () => reject(tx.error);
      });
    } finally { db.close(); }
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

  async function loadDocuments() {
    const db = await openExisting();
    if (!db) return [];
    const metas = await readAll(db, 'meta');
    db.close();
    return metas
      .filter(meta => Number(meta.deletedAt) > 0)
      .map(meta => ({ ...meta, kind:'document' }));
  }
  /* Notes live in the background annotations store, so the dashboard reaches them through
     messages — never by opening that IndexedDB from this page (v3.5.406). */
  async function loadNotes() {
    try {
      const records = await LHN_MESSAGING.sendMessage({ type:'TRASH_NOTES_LIST' });
      return Array.isArray(records) ? records.map(record => ({ ...record, kind:'note' })) : [];
    } catch { return []; }
  }
  /* Chép chính tả: buổi học nằm trong `dictation:session-index:v1`; xoá = đặt deletedAt,
     khôi phục = bỏ deletedAt, xoá vĩnh viễn = bỏ khỏi danh sách. */
  const emptyIndex = () => ({ version:1, updatedAt:0, legacyMigrationComplete:true, sessions:[] });
  async function readDictationIndex() {
    try {
      const data = await browser.storage.local.get(DICTATION_KEY);
      const raw = data?.[DICTATION_KEY];
      return raw && Array.isArray(raw.sessions) ? { ...emptyIndex(), ...raw, sessions:raw.sessions } : emptyIndex();
    } catch { return emptyIndex(); }
  }
  async function writeDictationSessions(sessions) {
    const index = await readDictationIndex();
    await browser.storage.local.set({ [DICTATION_KEY]: { ...index, version:index.version || 1, legacyMigrationComplete:true, updatedAt:Date.now(), sessions } });
  }
  async function loadDictation() {
    const index = await readDictationIndex();
    return index.sessions.filter(session => Number(session.deletedAt) > 0).map(session => {
      const sessionId = String(session.sessionId || `${session.sourceType}:${session.sourceId}`);
      return {
        kind:'dictation', type:'dictation', id:`dictation:${sessionId}`, sessionId,
        title:String(session.title || ''), url:String(session.url || ''),
        solved:Number(session.solvedCount) || 0, total:Number(session.totalCount) || 0,
        updatedAt:Number(session.updatedAt) || 0, deletedAt:Number(session.deletedAt)
      };
    });
  }
  async function restoreDictation(ids) {
    if (!ids.length) return 0;
    const want = new Set(ids.map(id => id.slice('dictation:'.length)));
    const index = await readDictationIndex();
    let count = 0;
    const sessions = index.sessions.map(session => {
      const sessionId = String(session.sessionId || `${session.sourceType}:${session.sourceId}`);
      if (!want.has(sessionId) || !Number(session.deletedAt)) return session;
      count += 1;
      return { ...session, deletedAt:0 };
    });
    if (count) await writeDictationSessions(sessions);
    return count;
  }
  async function purgeDictation(ids) {
    if (!ids.length) return;
    const want = new Set(ids.map(id => id.slice('dictation:'.length)));
    const index = await readDictationIndex();
    const keep = index.sessions.filter(session => !want.has(String(session.sessionId || `${session.sourceType}:${session.sourceId}`)));
    if (keep.length !== index.sessions.length) await writeDictationSessions(keep);
  }
  async function sweepDictation() {
    const index = await readDictationIndex();
    const now = Date.now();
    const keep = index.sessions.filter(session => !(Number(session.deletedAt) > 0 && Number(session.deletedAt) + RETAIN_DAYS * DAY <= now));
    if (keep.length !== index.sessions.length) await writeDictationSessions(keep);
    return index.sessions.length - keep.length;
  }

  async function load() {
    const now = Date.now();
    const [documents, notes, dictation] = await Promise.all([loadDocuments(), loadNotes(), loadDictation()]);
    return [...documents, ...notes, ...dictation]
      .map(item => ({ ...item, expires: Number(item.deletedAt) + RETAIN_DAYS * DAY }))
      .filter(item => item.expires > now)
      .sort((a, b) => b.deletedAt - a.deletedAt);
  }
  const itemById = id => itemsCache.find(item => item.id === id) || null;
  async function purgeExpired() {
    const db = await openExisting();
    if (!db) {
      let notesOnly = 0;
      try { notesOnly = Number((await LHN_MESSAGING.sendMessage({ type:'TRASH_NOTES_SWEEP' }))?.purged) || 0; } catch { /* keep going */ }
      try { notesOnly += await sweepDictation(); } catch { /* keep going */ }
      return notesOnly;
    }
    const metas = await readAll(db, 'meta');
    db.close();
    const now = Date.now();
    const dead = metas.filter(meta => Number(meta.deletedAt) > 0 && Number(meta.deletedAt) + RETAIN_DAYS * DAY <= now);
    for (const meta of dead) { try { await removeForever(meta.id); } catch { /* keep going */ } }
    let notes = 0;
    try { notes = Number((await LHN_MESSAGING.sendMessage({ type:'TRASH_NOTES_SWEEP' }))?.purged) || 0; }
    catch { /* annotations store unavailable: keep the documents result */ }
    let dictation = 0;
    try { dictation = await sweepDictation(); } catch { /* keep the rest */ }
    return dead.length + notes + dictation;
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
    image:{ label:'', path:'<rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="m4 17 4.6-4.3a2 2 0 0 1 2.7 0L16 17"/>' },
    note: { label:'', path:'<path d="M4 21h16"/><path d="m9 14 1.2 4h3.6L15 14"/><path d="m11 4 5 5-6.2 6.2L5 17l1.8-4.8Z"/>' },
    dictation: { label:'', path:'<path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/>' }
  };
  const kindOf = item => KIND[item.type] || KIND.pdf;
  /* Icon "trang web" cho hàng gộp: cùng path quả địa cầu app đang dùng ở thanh Keepit. */
  const WEB_ICON_PATH = '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>';

  const trim = (value, max) => {
    const text = String(value || '').replace(/\s+/g, ' ').trim();
    return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
  };
  const hostOf = url => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; } };
  function row(item, options = {}) {
    const kind = kindOf(item);
    const parts = [];
    if (item.kind === 'note') {
      const site = hostOf(item.url);
      if (site) parts.push(site);
      if (String(item.note || '').trim()) parts.push(trim(item.note, 60));
    } else if (item.kind === 'dictation') {
      const site = hostOf(item.url);
      if (site) parts.push(site);
      if (item.total) parts.push(`${item.solved} / ${item.total} ${t('dictationSentences')}`);
      else if (item.solved) parts.push(`${item.solved} ${t('dictationSentences')}`);
    } else {
      parts.push(kind.label || t('docs_image'));
      if (item.pages && item.type !== 'image') parts.push(`${item.pages} ${t('pagesShort')}`);
      parts.push(fmtSize(item.bytes));
    }
    if (addedAt(item)) parts.push(t('trashAddedOn', { date: fmtDate(addedAt(item)) }));
    parts.push(t('trashDeletedOn', { date: fmtDate(Number(item.deletedAt)) }));
    const checked = selected.has(item.id) ? ' checked' : '';
    return `<div class="trash-row${options.sub ? ' sub' : ''}${checked ? ' is-picked' : ''}" data-id="${item.id}">
      <label class="trash-check" title="${escapeHtml(t('trashSelect'))}"><input type="checkbox" data-pick="${item.id}"${checked}><span class="trash-box"></span></label>
      <span class="trash-ico kind-${item.kind === 'note' ? 'note' : (item.type || 'pdf')}"><svg viewBox="0 0 24 24" aria-hidden="true">${kind.path}</svg></span>
      <span class="trash-main"><b>${escapeHtml(item.kind === 'note' ? (trim(item.quote, 120) || t('trashTypeNote')) : item.kind === 'dictation' ? (trim(item.title, 120) || hostOf(item.url) || t('trashTypeDictation')) : (item.title || item.name || item.id))}</b>
        <span>${parts.join(' · ')}</span></span>
      <span class="trash-left">${t('trashDaysLeft', { days: daysLeft(item.expires) })}</span>
      <span class="trash-actions">
        <button type="button" class="trash-action primary" data-restore="${item.id}">${t('trashRestore')}</button>
        <button type="button" class="trash-action danger" data-purge="${item.id}">${t('trashPurge')}</button>
      </span>
    </div>`;
  }

  /* Ghi chú của cùng một trang đứng chung một hàng: khôi phục cả trang chỉ cần 1 nút.
     Trang chỉ có 1 ghi chú vẫn là hàng riêng. */
  function pageRowOf(url, notes) {
    const created = notes.map(addedAt).filter(Boolean);
    return {
      kind: 'note-page', id: PAGE_PREFIX + url, url,
      host: hostOf(url),
      title: notes.map(note => String(note.title || '').trim()).find(Boolean) || '',
      notes: [...notes].sort((a, b) => Number(b.deletedAt) - Number(a.deletedAt)),
      count: notes.length,
      deletedAt: Math.max(...notes.map(note => Number(note.deletedAt))),
      imported: created.length ? Math.min(...created) : 0,
      expires: Math.min(...notes.map(note => Number(note.deletedAt))) + RETAIN_DAYS * DAY
    };
  }
  function buildRows(items) {
    const documents = items.filter(item => item.kind !== 'note');
    const byPage = new Map(), singles = [];
    for (const note of items.filter(item => item.kind === 'note')) {
      const url = pageKeyOf(note);
      if (!url) { singles.push(note); continue; }
      if (!byPage.has(url)) byPage.set(url, []);
      byPage.get(url).push(note);
    }
    const rows = [...documents, ...singles];
    for (const [url, notes] of byPage) rows.push(notes.length > 1 ? pageRowOf(url, notes) : notes[0]);
    return rows.sort((a, b) => Number(b.deletedAt) - Number(a.deletedAt));
  }
  const recordsOf = rowItem => rowItem.kind === 'note-page' ? rowItem.notes : [rowItem];
  const notesOfPage = url => itemsCache.filter(item => item.kind === 'note' && pageKeyOf(item) === url);
  /* Hàng trang đại diện cho nhiều bản ghi: mọi thao tác mở rộng ra danh sách ghi chú thật. */
  /* Nút trên hàng trang: trang đang chọn một phần thì chỉ áp dụng cho ghi chú đang tick. */
  const idsForRow = id => {
    if (!id.startsWith(PAGE_PREFIX)) return [id];
    const notes = notesOfPage(id.slice(PAGE_PREFIX.length));
    const picked = notes.filter(note => selected.has(note.id));
    return (picked.length && picked.length < notes.length ? picked : notes).map(note => note.id);
  };
  const expandIds = ids => ids.flatMap(idsForRow);

  function pageRow(rowItem) {
    const open = expanded.has(rowItem.id);
    const picked = rowItem.notes.filter(note => selected.has(note.id)).length;
    const checked = picked > 0 && picked === rowItem.count, partial = picked > 0 && !checked;
    const title = rowItem.title || rowItem.host || t('trashTypeNote');
    const parts = [t('trashPageNotes', { count: rowItem.count })];
    if (rowItem.host && rowItem.host !== title) parts.push(rowItem.host);
    if (rowItem.imported) parts.push(t('trashAddedOn', { date: fmtDate(rowItem.imported) }));
    parts.push(t('trashDeletedOn', { date: fmtDate(Number(rowItem.deletedAt)) }));
    return `<div class="trash-row trash-page${open ? ' is-open' : ''}${picked > 0 ? ' is-picked' : ''}" data-id="${escapeHtml(rowItem.id)}" data-page-row="1">
      <label class="trash-check" title="${escapeHtml(t('trashSelect'))}"><input type="checkbox" data-pick-page="${escapeHtml(rowItem.url)}"${checked ? ' checked' : ''} data-partial="${partial ? 1 : 0}"><span class="trash-box"></span></label>
      <span class="trash-ico kind-web"><svg viewBox="0 0 24 24" aria-hidden="true">${WEB_ICON_PATH}</svg></span>
      <span class="trash-main">
        <b class="with-caret"><span class="t">${escapeHtml(title)}</span><button type="button" class="trash-expand${open ? ' is-open' : ''}" aria-expanded="${open}" aria-label="${escapeHtml(open ? t('trashCollapseNotes') : t('trashExpandNotes'))}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg></button></b>
        <span>${escapeHtml(parts.join(' · '))}</span>
      </span>
      <span class="trash-left">${t('trashDaysLeft', { days: daysLeft(rowItem.expires) })}</span>
      <span class="trash-actions">
        <button type="button" class="trash-action primary" data-restore="${escapeHtml(rowItem.id)}">${t('trashRestore')}</button>
        <button type="button" class="trash-action danger" data-purge="${escapeHtml(rowItem.id)}">${t('trashPurge')}</button>
      </span>
    </div>
    <div class="trash-subs${open ? ' is-open' : ''}">${rowItem.notes.map(note => row(note, { sub:true })).join('')}</div>`;
  }
  function renderRow(rowItem) { return rowItem.kind === 'note-page' ? pageRow(rowItem) : row(rowItem); }

  /* Mở/thu gọn nhẹ nhàng: đổi max-height, không dựng lại danh sách. */
  const motionOff = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true;
  function setPanel(rowNode, open, animate) {
    const panel = rowNode?.nextElementSibling;
    if (!panel || !panel.classList.contains('trash-subs')) return;
    if (!animate || motionOff()) {
      panel.classList.toggle('is-open', open);
      panel.style.maxHeight = open ? 'none' : '0px';
    } else if (open) {
      panel.classList.add('is-open');
      panel.style.maxHeight = `${panel.scrollHeight}px`;
      const clearHeight = event => {
        if (event.propertyName !== 'max-height') return;
        panel.removeEventListener('transitionend', clearHeight);
        if (panel.classList.contains('is-open')) panel.style.maxHeight = 'none';
      };
      panel.addEventListener('transitionend', clearHeight);
    } else {
      if (!panel.style.maxHeight || panel.style.maxHeight === 'none') panel.style.maxHeight = `${panel.scrollHeight}px`;
      void panel.offsetHeight;
      panel.classList.remove('is-open');
      panel.style.maxHeight = '0px';
    }
    rowNode.classList.toggle('is-open', open);
    const caret = rowNode.querySelector('.trash-expand');
    if (caret) {
      caret.classList.toggle('is-open', open);
      caret.setAttribute('aria-expanded', String(open));
      caret.setAttribute('aria-label', open ? t('trashCollapseNotes') : t('trashExpandNotes'));
    }
  }
  const pageRowNodes = () => [...document.querySelectorAll('#trashList .trash-row[data-page-row]')];
  function toggleRow(rowNode) {
    const id = rowNode?.dataset.id;
    if (!id?.startsWith(PAGE_PREFIX)) return;
    const open = !expanded.has(id);
    if (open) expanded.add(id); else expanded.delete(id);
    setPanel(rowNode, open, true);
  }
  function toggleAllRows(open) {
    expandAll = open;
    for (const rowNode of pageRowNodes()) {
      if (open) expanded.add(rowNode.dataset.id); else expanded.delete(rowNode.dataset.id);
      setPanel(rowNode, open, true);
    }
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
    itemsCache = items;
    const docs = items.filter(item => item.kind === 'document');
    const notes = items.filter(item => item.kind === 'note');
    const dictations = items.filter(item => item.kind === 'dictation');
    const totalBytes = docs.reduce((sum, item) => sum + (Number(item.bytes) || 0), 0);
    const filterOn = Boolean(query.trim()) || whenActive();
    if (chips) {
      chips.innerHTML = TYPES.map(([key, label]) => {
        const count = key === 'all' ? items.length : key === 'document' ? docs.length
          : key === 'note' ? notes.length : key === 'dictation' ? dictations.length : 0;
        const suffix = WIRED.has(key) ? `<i>${count}</i>` : `<i>${t('trashPending')}</i>`;
        return `<button type="button" class="trash-chip${typeFilter === key ? ' on' : ''}" data-t="${key}">${t(label)}${suffix}</button>`;
      }).join('');
    }
    const byType = typeFilter === 'all' ? items : typeFilter === 'document' ? docs
      : typeFilter === 'note' ? notes : typeFilter === 'dictation' ? dictations : [];
    const text = query.trim().toLocaleLowerCase();
    const matches = rowItem => [rowItem.title, rowItem.name, rowItem.quote, rowItem.note, rowItem.host,
      ...(rowItem.notes || []).flatMap(note => [note.quote, note.note])]
      .some(value => String(value || '').toLocaleLowerCase().includes(text));
    const visible = buildRows(byType)
      .filter(rowItem => whenOk(rowItem))
      .filter(rowItem => !text || matches(rowItem));
    const visibleRecords = visible.reduce((sum, rowItem) => sum + recordsOf(rowItem).length, 0);
    if (summary) {
      const body = filterOn
        ? t('trashSummaryFiltered', { shown: visibleRecords, count: items.length, size: fmtSize(totalBytes) })
        : t('trashSummary', { count: items.length, size: fmtSize(totalBytes) });
      const free = freeBytes === null ? '' : ` · ${t('trashFree', { free: fmtSize(freeBytes) })}`;
      summary.textContent = `${body} — ${t('trashRetention', { days: RETAIN_DAYS })}${free}`;
    }
    const visibleIds = new Set(visible.flatMap(recordsOf).map(record => record.id));
    for (const id of [...selected]) if (!visibleIds.has(id)) selected.delete(id);

    const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
    if (page > pageCount) page = pageCount;
    if (page < 1) page = 1;
    const start = (page - 1) * PAGE_SIZE;
    const onPage = visible.slice(start, start + PAGE_SIZE);

    if (!visible.length) {
      list.innerHTML = `<div class="trash-empty">${items.length && filterOn ? t('trashNoMatch') : t('trashEmpty')}</div>`;
    } else {
      const buckets = new Map();
      for (const rowItem of onPage) {
        const key = groupOf(rowItem);
        if (!buckets.has(key)) buckets.set(key, []);
        buckets.get(key).push(rowItem);
      }
      const order = [...GROUPS.map(([key]) => key), 'older'];
      list.innerHTML = order.filter(key => buckets.has(key)).map(key => {
        const label = key === 'older' ? t('trashGroupOlder') : t(GROUPS.find(([k]) => k === key)[1]);
        const bucket = buckets.get(key);
        const count = bucket.reduce((sum, rowItem) => sum + recordsOf(rowItem).length, 0);
        return `<h3 class="trash-group">${label}<i>${count}</i></h3>${bucket.map(renderRow).join('')}`;
      }).join('');
      // giữ trạng thái mở/đóng sau mỗi lần vẽ lại (chọn, lọc, phân trang)
      for (const rowNode of pageRowNodes()) setPanel(rowNode, expanded.has(rowNode.dataset.id), false);
      for (const box of list.querySelectorAll('[data-pick-page]')) box.indeterminate = box.dataset.partial === '1';
    }
    syncBulkBar(visible, onPage);
    syncPager(visible.length, start, onPage.length);
    const expandWrap = $('trashExpandAllWrap'), expandSwitch = $('trashExpandAll');
    if (expandWrap) expandWrap.hidden = !visible.some(rowItem => rowItem.kind === 'note-page');
    if (expandSwitch) expandSwitch.checked = Boolean(expandWrap && !expandWrap.hidden && expandAll);
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
    const pageRecords = pageRows.flatMap(recordsOf).map(record => record.id);
    const pickedOnPage = pageRecords.filter(recordId => selected.has(recordId)).length;
    bar.hidden = !(visible && visible.length > 0);
    if (count) count.textContent = selected.size ? t('trashSelected', { count: selected.size }) : '';
    const clearSel = $('trashClearSel');
    if (clearSel) clearSel.hidden = selected.size === 0;
    if (all) {
      all.checked = pageRecords.length > 0 && pickedOnPage === pageRecords.length;
      all.indeterminate = pickedOnPage > 0 && pickedOnPage < pageRecords.length;
      all.disabled = pageRecords.length === 0;
    }
    for (const button of bar.querySelectorAll('[data-bulk]')) button.disabled = selected.size === 0;
    const emptyAll = $('trashEmptyAll');
    if (emptyAll) emptyAll.disabled = !$('trashList')?.querySelector('.trash-row');
  }

  /* Real free space for this origin (IndexedDB lives in it), so the number is measured
     instead of guessed from the item sizes. */
  async function readQuota() {
    try {
      const { usage = 0, quota = 0 } = await navigator.storage?.estimate?.() || {};
      freeBytes = quota ? Math.max(0, quota - usage) : null;
    } catch { freeBytes = null; }
  }

  async function mount() {
    await purgeExpired();
    await readQuota();
    selected = new Set();
    expanded = new Set();
    expandAll = false;
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
    const pageRowHit = event.target.closest('.trash-row[data-page-row]');
    if (pageRowHit && !event.target.closest('.trash-check, .trash-actions')) { toggleRow(pageRowHit); return; }
    const chip = event.target.closest('[data-t]');
    if (chip) { typeFilter = chip.dataset.t; page = 1; void render(); return; }
    const restore = event.target.closest('[data-restore]');
    if (restore) { void restoreItems([restore.dataset.restore]); return; }
    const purge = event.target.closest('[data-purge]');
    if (purge) { void purgeItems([purge.dataset.purge]); return; }
    const bulk = event.target.closest('[data-bulk]');
    if (bulk) { void (bulk.dataset.bulk === 'restore' ? restoreItems([...selected]) : purgeItems([...selected])); return; }
    if (event.target.closest('#trashClearSel')) {
      selected = new Set();
      void render();
      return;
    }
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
    const pickPage = event.target.closest('[data-pick-page]');
    if (pickPage) {
      for (const note of notesOfPage(pickPage.dataset.pickPage)) {
        if (pickPage.checked) selected.add(note.id); else selected.delete(note.id);
      }
      void render();
      return;
    }
    const pick = event.target.closest('[data-pick]');
    if (pick) {
      if (pick.checked) selected.add(pick.dataset.pick); else selected.delete(pick.dataset.pick);
      pick.closest('.trash-row')?.classList.toggle('is-picked', pick.checked);
      void render();
      return;
    }
    if (event.target.id === 'trashExpandAll') {
      toggleAllRows(event.target.checked);
      return;
    }
    if (event.target.id === 'trashSelectAll') {
      const ids = [...document.querySelectorAll('#trashList .trash-row[data-id]')]
        .flatMap(node => node.dataset.id.startsWith(PAGE_PREFIX)
          ? notesOfPage(node.dataset.id.slice(PAGE_PREFIX.length)).map(note => note.id)
          : [node.dataset.id]);
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

  const splitKinds = ids => {
    const noteIds = [], documentIds = [], dictationIds = [];
    for (const id of ids) {
      const kind = itemById(id)?.kind;
      (kind === 'note' ? noteIds : kind === 'dictation' ? dictationIds : documentIds).push(id);
    }
    return { noteIds, documentIds, dictationIds };
  };
  async function restoreNotes(noteIds) {
    if (!noteIds.length) return 0;
    try {
      const result = await LHN_MESSAGING.sendMessage({ type:'TRASH_NOTES_RESTORE', ids:noteIds });
      const restored = Array.isArray(result?.items) ? result.items : [];
      try {
        const tabs = await browser.tabs.query({});
        await Promise.all(tabs.filter(tab => tab.id != null).map(tab => browser.tabs.sendMessage(tab.id, { type:'RESTORE_HIGHLIGHTS' }).catch(() => null)));
      } catch { /* no open tab to refresh */ }
      return restored.length;
    } catch { return 0; }
  }
  async function purgeNotes(noteIds) {
    if (!noteIds.length) return;
    try { await LHN_MESSAGING.sendMessage({ type:'TRASH_NOTES_PURGE', ids:noteIds }); } catch { /* keep going */ }
  }
  async function restoreItems(rawIds) {
    const ids = expandIds(rawIds);
    const { noteIds, documentIds, dictationIds } = splitKinds(ids);
    for (const id of documentIds) { try { await restoreRecord(id); } catch { /* keep going */ } }
    await restoreNotes(noteIds);
    try { await restoreDictation(dictationIds); } catch { /* keep going */ }
    for (const id of ids) selected.delete(id);
    if (documentIds.length) refreshDocumentsFrame();
    await readQuota();
    await render();
    globalThis.toast?.(t('trashRestoreDone', { count: ids.length }));
  }
  /* Everything that is about to be deleted forever is kept in memory until the toast with
     Undo disappears, so the undo can put the very same rows (ids included) back. */
  async function purgeForever(rawIds) {
    const ids = expandIds(rawIds);
    const { noteIds, documentIds, dictationIds } = splitKinds(ids);
    const documents = [], notes = [], dictations = [];
    if (dictationIds.length) {
      const index = await readDictationIndex();
      const want = new Set(dictationIds.map(id => id.slice('dictation:'.length)));
      for (const session of index.sessions) {
        const sessionId = String(session.sessionId || `${session.sourceType}:${session.sourceId}`);
        if (want.has(sessionId)) dictations.push({ ...session });
      }
    }
    for (const id of documentIds) {
      try { const snapshot = await snapshotDocument(id); if (snapshot) documents.push(snapshot); } catch { /* keep going */ }
    }
    for (const id of noteIds) { const item = itemById(id); if (item) { const { kind, expires, ...record } = item; notes.push(record); } }
    for (const id of documentIds) { try { await removeForever(id); } catch { /* keep going */ } }
    await purgeNotes(noteIds);
    try { await purgeDictation(dictationIds); } catch { /* keep going */ }
    for (const id of ids) selected.delete(id);
    if (documentIds.length) refreshDocumentsFrame();
    await readQuota();
    await render();
    const undo = async () => {
      for (const snapshot of documents) { try { await restoreDocument(snapshot); } catch { /* keep going */ } }
      if (notes.length) {
        try { await LHN_MESSAGING.sendMessage({ type:'TRASH_NOTES_INSERT', items:notes }); } catch { /* keep going */ }
      }
      if (dictations.length) {
        try {
          const index = await readDictationIndex();
          await writeDictationSessions([...index.sessions, ...dictations]);
        } catch { /* keep going */ }
      }
      if (documentIds.length) refreshDocumentsFrame();
      await readQuota();
      await render();
      globalThis.toast?.(t('trashPurgeUndone'));
    };
    if (ids.length && globalThis.toast) globalThis.toast(t('trashPurgeDone', { count:ids.length }), { label:t('trashUndo'), run:undo });
  }
  async function purgeItems(rawIds) {
    const ids = expandIds(rawIds);
    if (!ids.length) return;
    if (!confirm(t(ids.length > 1 ? 'trashPurgeManyConfirm' : 'trashPurgeConfirm'))) return;
    await purgeForever(ids);
  }
  async function emptyAll() {
    let items = [];
    try { items = await load(); } catch { items = []; }
    if (!items.length) return;
    if (!confirm(t('trashEmptyAllConfirm', { count: items.length }))) return;
    await purgeForever(items.map(item => item.id));
    selected = new Set();
  }

  globalThis.KeepitTrash = { mount, refresh: render, sweep: purgeExpired };
})();
