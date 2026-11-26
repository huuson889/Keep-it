// Local document bytes and state. Separate stores keep progress writes from overwriting notes or files.
(() => {
  'use strict';
  const NAME = 'keepit-documents', VERSION = 3, CHANNEL = 'keepit-documents-updated';
  let opening;
  const changes = typeof BroadcastChannel === 'function' ? new BroadcastChannel(CHANNEL) : null;
  function open() {
    if (!opening) opening = new Promise((resolve, reject) => {
      const request = indexedDB.open(NAME, VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        /* v3.5.480: bản cũ có thể đã tạo kho rỗng (không store nào) → luôn tạo phần còn thiếu.
           Nâng lên 2 để kho rỗng v1 tự chữa lành lần mở kế tiếp. */
        for (const name of ['meta', 'files', 'notes', 'translations', 'ocr']) {
          if (db.objectStoreNames.contains(name)) continue;
          const store = db.createObjectStore(name, { keyPath:'id' });
          if (name === 'notes' || name === 'translations' || name === 'ocr') store.createIndex('document', 'documentId');
        }
      };
      request.onsuccess = () => { const db = request.result; db.onversionchange = () => { db.close(); opening = null; }; resolve(db); };
      request.onerror = () => { opening = null; reject(request.error); };
      request.onblocked = () => { opening = null; reject(new Error('documentsDatabaseBlocked')); };
    });
    return opening;
  }
  async function run(names, mode, action) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(names, mode); let value;
      tx.oncomplete = () => resolve(value);
      tx.onerror = tx.onabort = () => reject(tx.error || new Error('documentsStorageFailed'));
      try { action(tx, result => { value = result; }); } catch (error) { tx.abort(); reject(error); }
    });
  }
  function get(store, id) { return run([store], 'readonly', (tx, done) => { const r = tx.objectStore(store).get(id); r.onsuccess = () => done(r.result || null); }); }
  function all(store, documentId) { return run([store], 'readonly', (tx, done) => { const s = tx.objectStore(store); const r = documentId ? s.index('document').getAll(documentId) : s.getAll(); r.onsuccess = () => done(r.result); }); }
  async function put(store, value) { await run([store], 'readwrite', tx => tx.objectStore(store).put(value)); if (store !== 'translations') changes?.postMessage({ documentId:value.documentId || value.id }); return value; }
  async function patch(id, patch) {
    await run(['meta'], 'readwrite', tx => {
      const s = tx.objectStore('meta'), r = s.get(id);
      r.onsuccess = () => { if (r.result) s.put({ ...r.result, ...patch, id }); };
    });
    changes?.postMessage({ documentId:id });
  }
  async function importFile(meta, blob) {
    // Commit only after parsing succeeded: a corrupt/cancelled import never creates a library record.
    await run(['meta', 'files'], 'readwrite', tx => { tx.objectStore('meta').put(meta); tx.objectStore('files').put({ id:meta.id, blob }); });
    changes?.postMessage({ documentId:meta.id });
  }
  async function fingerprint(blob) { return [...new Uint8Array(await crypto.subtle.digest('SHA-256', await blob.arrayBuffer()))].map(x => x.toString(16).padStart(2, '0')).join(''); }
  // v314 compatibility data is never a second Notes source after a confirmed common-store migration.
  const forgetMigratedNote = id => run(['notes'], 'readwrite', tx => tx.objectStore('notes').delete(id));
  const clearObsoleteTranslationCache = () => run(['translations'], 'readwrite', tx => tx.objectStore('translations').clear());
  // Soft delete only stamps deletedAt: the bytes stay until the trash purges the record.
  const softDelete = id => patch(id, { deletedAt: Date.now() });
  const restore = id => patch(id, { deletedAt: null });
  function purge(id) {
    return run(['meta', 'files', 'translations', 'ocr'], 'readwrite', tx => {
      tx.objectStore('meta').delete(id);
      tx.objectStore('files').delete(id);
      const ocrKeys = tx.objectStore('ocr').index('document').getAllKeys(id);
      ocrKeys.onsuccess = () => { for (const key of ocrKeys.result || []) tx.objectStore('ocr').delete(key); };
      const keys = tx.objectStore('translations').index('document').getAllKeys(id);
      keys.onsuccess = () => { for (const key of keys.result || []) tx.objectStore('translations').delete(key); };
    }).then(() => { changes?.postMessage({ documentId:id }); return true; });
  }
  globalThis.KeepitDocumentsStore = Object.freeze({ open, get, all, put, patch, importFile, fingerprint, changes, softDelete, restore, purge, forgetMigratedNote, clearObsoleteTranslationCache });
})();
