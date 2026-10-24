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
    function createHighlightCard(item, { config, t, query, onLocate, onEdit, onDelete, onSpeak }) {
      const color = config.normalizeColor(item.color);
      const card = document.createElement('article'); card.className = 'lhn-sidebar-card';
      const quoteRow = document.createElement('div'); quoteRow.className = 'lhn-sidebar-quote-row';
      const swatch = document.createElement('span'); swatch.className = `lhn-sidebar-swatch lhn-swatch-${color}`; swatch.title = t('colorHighlight', { color:t(config.colorLabelKey(color)) }); swatch.setAttribute('aria-label', swatch.title);
      const quote = document.createElement('div'); quote.className = 'lhn-sidebar-quote'; quote.textContent = item.quote;
      quote.tabIndex = 0; quote.setAttribute('role', 'button'); quote.title = t('jumpHighlight');
      card.tabIndex = 0; card.setAttribute('role', 'button'); card.title = t('jumpHighlight');
      card.addEventListener('click', onLocate);
      card.addEventListener('keydown', event => { if ((event.key === 'Enter' || event.key === ' ') && event.target === card) { event.preventDefault(); onLocate(); } });
      quoteRow.append(swatch, quote);
      const note = document.createElement('div'); note.className = 'lhn-sidebar-note'; note.textContent = item.note || t('noNote');
      const contextNote = document.createElement('div'); contextNote.className = 'lhn-sidebar-context-note'; renderContextSentence(contextNote, item.contextNote, item.quote);
      const actions = document.createElement('div'); actions.className = 'lhn-sidebar-actions'; actions.addEventListener('click', event => event.stopPropagation());
      const editButton = createButton('', 'lhn-side-secondary', onEdit); editButton.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${config.ACTION_ICON_PATHS.edit}</svg>`; editButton.title = t('editNote'); editButton.setAttribute('aria-label', t('editNote'));
      const deleteButton = createButton('', 'lhn-side-secondary', onDelete); deleteButton.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${config.ACTION_ICON_PATHS.trash}</svg>`; deleteButton.title = t('deleteNote'); deleteButton.setAttribute('aria-label', t('deleteNote'));
      const speakButton = createButton('', 'lhn-side-secondary lhn-speak-btn', onSpeak); speakButton.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${config.ACTION_ICON_PATHS.volume}</svg>`; speakButton.title = t('speakHighlightTooltip'); speakButton.setAttribute('aria-label', speakButton.title);
      actions.append(editButton, deleteButton, speakButton);
      if (item.contextNote) card.append(quoteRow, note, contextNote, actions); else card.append(quoteRow, note, actions);
      highlightMatches(card, query);
      return card;
    }
    return Object.freeze({ createButton, renderContextSentence, searchFields, highlightMatches, createHighlightCard });
  }
  globalThis.LHN_SIDEBAR = Object.freeze({ create });
})();
