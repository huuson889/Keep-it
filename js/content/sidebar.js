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
    function highlightMatches(root, query) { if (globalThis.LHN_INDEX_SEARCH?.features?.highlight === false) return; search.highlightMatches(root, query, '.lhn-sidebar-actions, .lhn-search-match'); }
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
    function createShell({ width, pageTitle, pageUrl, websiteDisabled, version, colors, filter, searchQuery, t, config, onToggleSidebarSetting, onToggleWebsiteDisabled, onOpenDashboard, onToggleTheme, onSearch, onFilter, onStopPropagation }) {
      const top = document.createElement('div'); top.className = 'lhn-sidebar-top';
      const brand = document.createElement('div'); brand.className = 'lhn-sidebar-brand';
      const logo = document.createElement('img'); logo.src = browser.runtime.getURL('assets/icons/icon.svg'); logo.alt = '';
      const brandCopy = document.createElement('div'); brandCopy.className = 'lhn-sidebar-brandcopy';
      const brandName = document.createElement('span'); brandName.className = 'lhn-sidebar-brandname'; brandName.textContent = 'Keepit - Highlight Notes';
      const freeLabel = document.createElement('span'); freeLabel.className = 'lhn-sidebar-plan menu-item item-free'; freeLabel.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3zm0 2.18l6 2.25v4.57c0 4.54-3.2 8.91-6 10.08-2.8-1.17-6-5.54-6-10.08V6.43l6-2.25z" fill="currentColor"/></svg>';
      const freeText = document.createElement('span'); freeText.textContent = t('freePlan'); freeLabel.append(freeText); freeLabel.setAttribute('aria-label', t('freePlan'));
      brandCopy.append(brandName, freeLabel); brand.append(logo, brandCopy);
      const brandRow = document.createElement('div'); brandRow.className = 'lhn-sidebar-brandrow';
      const headerActions = document.createElement('div'); headerActions.className = 'lhn-sidebar-header-actions';
      const addHeaderIcon = (labelKey, icon, setting = '', handler = null) => {
        const button = document.createElement('button'); button.type = 'button'; button.className = 'lhn-header-icon'; button.dataset.labelKey = labelKey; button.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${icon}</svg>`;
        if (setting) { button.dataset.setting = setting; button.addEventListener('click', () => onToggleSidebarSetting(setting)); }
        else if (handler) { button.dataset.siteToggle = 'true'; button.addEventListener('click', handler); }
        else button.addEventListener('click', onOpenDashboard);
        button.dataset.tooltip = t(labelKey); button.setAttribute('aria-label', t(labelKey)); headerActions.append(button); return button;
      };
      const themeButton = document.createElement('button'); themeButton.type = 'button'; themeButton.className = 'lhn-header-icon lhn-theme-toggle'; themeButton.dataset.themeToggle = 'true'; themeButton.addEventListener('click', onToggleTheme); headerActions.append(themeButton);
      if (websiteDisabled) addHeaderIcon('enableWebsite', '<circle cx="12" cy="12" r="9"/><path d="m4.9 4.9 14.2 14.2"/>', '', onToggleWebsiteDisabled);
      else {
        addHeaderIcon('openDashboard', '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>');
        addHeaderIcon('autoPopup', '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>', 'showOnSelect');
        addHeaderIcon('autoSentenceNote', '<path d="M2 11.5V5a2 2 0 0 1 2-2h3.9c.7 0 1.3.3 1.7.9l.8 1.2c.4.6 1 .9 1.7.9H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-9.5"/><path d="M11.378 13.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"/>', 'sentenceNoteEnabled');
        addHeaderIcon('disableWebsite', '<circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/>', '', onToggleWebsiteDisabled);
      }
      brandRow.append(brand, headerActions);
      const title = document.createElement('div'); title.className = 'lhn-sidebar-title'; title.textContent = pageTitle;
      const url = document.createElement('a'); url.className = 'lhn-sidebar-url'; url.href = pageUrl; url.target = '_blank'; url.rel = 'noopener noreferrer'; url.textContent = pageUrl; url.title = pageUrl;
      const headerCard = document.createElement('div'); headerCard.className = 'lhn-sidebar-header-card'; headerCard.append(brandRow, title, url);
      const searchWrap = document.createElement('label'); searchWrap.className = 'lhn-sidebar-search-wrap';
      const searchIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); searchIcon.setAttribute('viewBox', '0 0 24 24'); searchIcon.setAttribute('aria-hidden', 'true'); searchIcon.classList.add('lhn-sidebar-search-icon');
      const searchCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); searchCircle.setAttribute('cx', '11'); searchCircle.setAttribute('cy', '11'); searchCircle.setAttribute('r', '7');
      const searchHandle = document.createElementNS('http://www.w3.org/2000/svg', 'path'); searchHandle.setAttribute('d', 'm20 20-4-4'); searchIcon.append(searchCircle, searchHandle);
      const searchInput = document.createElement('input'); searchInput.type = 'search'; searchInput.className = 'lhn-sidebar-search'; searchInput.placeholder = t('sidebarSearchPlaceholder'); searchInput.setAttribute('aria-label', t('sidebarSearchPlaceholder')); searchInput.value = searchQuery;
      searchWrap.append(searchIcon, searchInput);
      searchInput.addEventListener('input', () => onSearch(searchInput.value));
      const filters = document.createElement('div'); filters.className = 'lhn-sidebar-filters'; filters.setAttribute('aria-label', t('filterColor'));
      const filterOptions = [{ id:'all', label:t('all') }, ...colors.map(color => ({ id:color, label:t(config.colorLabelKey(color)) }))];
      filterOptions.forEach(option => {
        const button = createButton('0', 'lhn-side-filter' + (filter === option.id ? ' is-active' : ''), () => onFilter(option.id, filters));
        button.dataset.filter = option.id; button.dataset.filterLabel = option.label;
        if (option.id !== 'all') { const swatch = document.createElement('span'); swatch.className = `lhn-filter-swatch lhn-swatch-${option.id}`; button.prepend(swatch); }
        filters.appendChild(button);
      });
      headerCard.append(searchWrap, filters);
      if (websiteDisabled) { const message = document.createElement('div'); message.className = 'lhn-site-disabled-message'; message.textContent = t('websiteDisabledMessage'); headerCard.replaceChildren(brandRow, message); }
      top.append(headerCard);
      const list = document.createElement('div'); list.className = 'lhn-sidebar-list'; list.id = 'lhn-sidebar-list';
      const footer = document.createElement('div'); footer.className = 'lhn-sidebar-footer';
      const footerToggle = document.createElement('button'); footerToggle.type = 'button'; footerToggle.className = 'lhn-sidebar-footer-toggle'; footerToggle.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); onToggleWebsiteDisabled(); });
      const footerVersion = document.createElement('span'); footerVersion.className = 'lhn-sidebar-footer-version'; footerVersion.textContent = `v${version}`; footer.append(footerToggle, footerVersion);
      const sidebar = document.createElement('aside'); sidebar.id = 'lhn-sidebar'; sidebar.style.width = width + 'px'; sidebar.append(top, list, footer);
      sidebar.addEventListener('mousedown', onStopPropagation); sidebar.addEventListener('click', onStopPropagation);
      return { sidebar, headerActions };
    }
    return Object.freeze({ createButton, renderContextSentence, searchFields, highlightMatches, createHighlightCard, createShell });
  }
  globalThis.LHN_SIDEBAR = Object.freeze({ create });
})();
