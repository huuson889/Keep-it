(() => {
  function create({ document, search }) {
    const metadataCache = new WeakMap();
    function createButton(label, className, handler) {
      const button = document.createElement('button'); button.className = 'lhn-side-btn' + (className ? ' ' + className : ''); button.textContent = label; button.type = 'button'; button.addEventListener('click', handler); return button;
    }
    function renderContextSentence(host, sentence, quote) {
      host.replaceChildren(); if (!sentence) return;
      const text = String(sentence), selected = String(quote || ''); let match = null;
      if (selected) { const pattern = selected.trim().split(/\s+/).map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s+'); try { match = new RegExp(pattern).exec(text); } catch { /* render as plain text */ } }
      const at = match?.index ?? -1, length = match?.[0].length ?? 0;
      if (at < 0) { host.textContent = text; return; }
      host.append(document.createTextNode(text.slice(0, at)));
      const strong = document.createElement('strong'); strong.textContent = match[0]; host.append(strong);
      host.append(document.createTextNode(text.slice(at + length)));
    }
    function searchFields(item) {
      let fields = metadataCache.get(item); if (fields) return fields;
      const tags = Array.isArray(item.tags) ? item.tags.join(' ') : String(item.tags || '');
      fields = { quote:String(item.quote || '').toLocaleLowerCase(), note:String(item.note || '').toLocaleLowerCase(), contextNote:String(item.contextNote || '').toLocaleLowerCase(), tags:tags.toLocaleLowerCase() };
      metadataCache.set(item, fields); return fields;
    }
    function highlightMatches(root, query) { search.highlightMatches(root, query, '.lhn-sidebar-actions, .lhn-search-match'); }
    return Object.freeze({ createButton, renderContextSentence, searchFields, highlightMatches });
  }
  globalThis.LHN_SIDEBAR = Object.freeze({ create });
})();