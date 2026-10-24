(() => {
  const PERSISTED_FIELDS = Object.freeze(['quote', 'note', 'contextNote', 'url', 'title', 'hostname', 'thumbnailUrl', 'prefix', 'suffix', 'createdAt', 'color', 'tags']);
  function buildRecord(fields) {
    return {
      quote:fields.quote, note:fields.note, contextNote:fields.contextNote, tags:fields.tags, color:fields.color,
      url:fields.url, title:fields.title, hostname:fields.hostname, thumbnailUrl:fields.thumbnailUrl,
      prefix:fields.prefix, suffix:fields.suffix, createdAt:fields.createdAt
    };
  }
  function isUnchanged(existing, next) {
    if (!existing || !next) return false;
    return PERSISTED_FIELDS.every(key => JSON.stringify(existing[key]) === JSON.stringify(next[key]));
  }
  globalThis.LHN_NOTE_COMPOSER = Object.freeze({ buildRecord, isUnchanged });
})();