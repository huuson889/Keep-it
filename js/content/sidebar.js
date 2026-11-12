// Ghi chú (Notes) — giao diện làm lại từ đầu (v3.5.204, theo demo notes-sheet v10).
// Chỉ dựng DOM; logic (lưu trữ, cài đặt, bật/tắt website, đọc, sửa, xoá) vẫn ở js/content/content.js.
// Giao diện: css/content/notes.css — 1 bộ màu duy nhất cho mọi nút/ô/thẻ, không còn CSS cũ chồng lên.
// Điện thoại: sheet chuẩn qua LHN_SHEET (js/content/keepit-bar.js → watchSidebar).
(() => {
  const ART = {
  pen:`<svg viewBox="0 0 140 110" aria-hidden="true">
    <path d="M22 92c22-8 52-8 96-2" stroke="#fde047" stroke-width="12" stroke-linecap="round" fill="none" opacity=".75"/>
    <g class="kp-bob"><g transform="rotate(28 70 50)">
      <rect x="52" y="14" width="36" height="62" rx="12" fill="#8b5cf6"/>
      <rect x="52" y="14" width="36" height="16" rx="8" fill="#a78bfa"/>
      <path d="M56 76h28l-6 14H62z" fill="#e9d5ff"/><path d="M63 90h14l-3 7h-8z" fill="#fde047"/>
      <circle cx="63" cy="48" r="3.4" fill="#1e1b4b"/><circle cx="77" cy="48" r="3.4" fill="#1e1b4b"/>
      <circle cx="64.2" cy="46.8" r="1.1" fill="#fff"/><circle cx="78.2" cy="46.8" r="1.1" fill="#fff"/>
      <path d="M64 56q6 5 12 0" stroke="#1e1b4b" stroke-width="2.4" stroke-linecap="round" fill="none"/>
      <ellipse cx="58" cy="55" rx="3.6" ry="2.2" fill="#f9a8d4" opacity=".8"/><ellipse cx="82" cy="55" rx="3.6" ry="2.2" fill="#f9a8d4" opacity=".8"/>
    </g></g>
    <path class="kp-twk" d="M114 22l2.5 6 6 2.5-6 2.5-2.5 6-2.5-6-6-2.5 6-2.5z" fill="#fbbf24"/>
    <path class="kp-twk kp-twk2" d="M26 34l1.8 4.2 4.2 1.8-4.2 1.8-1.8 4.2-1.8-4.2-4.2-1.8 4.2-1.8z" fill="#a78bfa"/>
  </svg>`,
  sleep:`<svg viewBox="0 0 140 110" aria-hidden="true">
    <ellipse cx="66" cy="96" rx="40" ry="6" fill="#000" opacity=".12"/>
    <g class="kp-bob">
      <path d="M30 60a36 36 0 0 0 72 0c0-6-2-10-6-10H36c-4 0-6 4-6 10z" fill="#8b5cf6"/>
      <path d="M30 60c0-20 16-36 36-36s36 16 36 36" fill="#a78bfa"/>
      <path d="M34 46c-4-14 4-26 18-30" stroke="#c4b5fd" stroke-width="5" stroke-linecap="round" fill="none"/>
      <path d="M50 62q6 5 12 0M70 62q6 5 12 0" stroke="#1e1b4b" stroke-width="2.6" stroke-linecap="round" fill="none"/>
      <ellipse cx="48" cy="72" rx="4.5" ry="2.6" fill="#f9a8d4" opacity=".85"/><ellipse cx="84" cy="72" rx="4.5" ry="2.6" fill="#f9a8d4" opacity=".85"/>
      <path d="M62 76q4 3 8 0" stroke="#1e1b4b" stroke-width="2.2" stroke-linecap="round" fill="none"/>
    </g>
    <text class="kp-z" x="100" y="40" font-family="system-ui,sans-serif" font-weight="700" font-size="16" fill="#a78bfa">z</text>
    <text class="kp-z kp-z2" x="108" y="30" font-family="system-ui,sans-serif" font-weight="700" font-size="13" fill="#c4b5fd">z</text>
    <text class="kp-z kp-z3" x="114" y="22" font-family="system-ui,sans-serif" font-weight="700" font-size="11" fill="#ddd6fe">z</text>
  </svg>`,
  search:`<svg viewBox="0 0 140 110" aria-hidden="true">
    <g class="kp-bob">
      <circle cx="62" cy="50" r="28" fill="#ede9fe" stroke="#8b5cf6" stroke-width="7"/>
      <path d="M82 70l20 20" stroke="#8b5cf6" stroke-width="11" stroke-linecap="round"/>
      <circle cx="53" cy="48" r="3.2" fill="#1e1b4b"/><circle cx="71" cy="48" r="3.2" fill="#1e1b4b"/>
      <path d="M55 61q7-4 14 0" stroke="#1e1b4b" stroke-width="2.4" stroke-linecap="round" fill="none"/>
    </g>
    <text class="kp-twk" x="102" y="34" font-family="system-ui,sans-serif" font-weight="800" font-size="20" fill="#fbbf24">?</text>
  </svg>`
  };
  const ICON = {
    shield:'<path d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6z"/>',
    search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    dashboard:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    autoPopup:'<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    sentence:'<path d="M2 11.5V5a2 2 0 0 1 2-2h3.9c.7 0 1.3.3 1.7.9l.8 1.2c.4.6 1 .9 1.7.9H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-9.5"/><path d="M11.378 13.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"/>',
    siteOn:'<circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/>',
    siteOff:'<circle cx="12" cy="12" r="9"/><path d="m4.9 4.9 14.2 14.2"/>'
  };
  const svg = path => `<svg viewBox="0 0 24 24" aria-hidden="true">${path}</svg>`;
  function create({ document, search }) {
    const metadataCache = new WeakMap();
    const el = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text != null) node.textContent = text; return node; };
    function createButton(label, className, handler) {
      const button = el('button', 'lhn-side-btn' + (className ? ' ' + className : ''), label); button.type = 'button'; button.addEventListener('click', handler); return button;
    }
    function renderContextSentence(host, sentence, quote) {
      host.replaceChildren(); if (!sentence) return;
      const text = String(sentence), selected = String(quote || ''); let match = null;
      if (selected) { const pattern = selected.trim().split(/\s+/).map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s+'); try { match = new RegExp(pattern).exec(text); } catch { /* render as plain text */ } }
      const at = match?.index ?? -1, length = match?.[0].length ?? 0;
      if (at < 0) { host.textContent = text; return; }
      host.append(document.createTextNode(text.slice(0, at)), el('strong', '', match[0]), document.createTextNode(text.slice(at + length)));
    }
    function searchFields(item) {
      let fields = metadataCache.get(item); if (fields) return fields;
      const tags = Array.isArray(item.tags) ? item.tags.join(' ') : String(item.tags || '');
      fields = { quote:String(item.quote || '').toLocaleLowerCase(), note:String(item.note || '').toLocaleLowerCase(), contextNote:String(item.contextNote || '').toLocaleLowerCase(), tags:tags.toLocaleLowerCase() };
      metadataCache.set(item, fields); return fields;
    }
    function highlightMatches(root, query) { search.highlightMatches(root, query, '.lhn-sidebar-actions, .lhn-search-match'); }
    // Trống / không tìm thấy / trang đã tắt: hình minh hoạ dễ thương. Câu đầu (đến ". ") là tiêu đề, phần còn lại là dòng phụ.
    function createEmptyState(kind, message, cta) {
      const box = el('div', 'lhn-sidebar-empty'); box.innerHTML = ART[kind] || ART.search;
      const text = String(message || ''), cut = text.indexOf('. ');
      box.append(el('b', '', cut < 0 ? text : text.slice(0, cut + 1)));
      if (cut >= 0) box.append(el('span', '', text.slice(cut + 2)));
      if (cta) { const button = el('button', 'lhn-sidebar-cta', cta.label); button.type = 'button'; button.addEventListener('click', event => { event.stopPropagation(); cta.onClick(); }); box.append(button); }
      return box;
    }
    function createHighlightCard(item, { config, t, query, onLocate, onEdit, onDelete, onSpeak }) {
      const color = config.normalizeColor(item.color);
      const card = el('article', 'lhn-sidebar-card');
      card.tabIndex = 0; card.setAttribute('role', 'button'); card.title = t('jumpHighlight');
      card.addEventListener('click', onLocate);
      card.addEventListener('keydown', event => { if ((event.key === 'Enter' || event.key === ' ') && event.target === card) { event.preventDefault(); onLocate(); } });
      const quoteRow = el('div', 'lhn-sidebar-quote-row');
      const swatch = el('span', `lhn-sidebar-swatch lhn-swatch-${color}`); swatch.title = t('colorHighlight', { color:t(config.colorLabelKey(color)) }); swatch.setAttribute('aria-label', swatch.title);
      quoteRow.append(swatch, el('div', 'lhn-sidebar-quote', item.quote));
      const note = el('div', 'lhn-sidebar-note' + (item.note ? '' : ' is-empty'), item.note || t('noNote'));
      card.append(quoteRow, note);
      if (item.contextNote) { const context = el('div', 'lhn-sidebar-context-note'); renderContextSentence(context, item.contextNote, item.quote); card.append(context); }
      const actions = el('div', 'lhn-sidebar-actions'); actions.addEventListener('click', event => event.stopPropagation());
      const action = (key, labelKey, handler, extra = '') => { const button = createButton('', 'lhn-side-secondary' + extra, handler); button.innerHTML = svg(config.ACTION_ICON_PATHS[key]); button.title = t(labelKey); button.setAttribute('aria-label', button.title); button.dataset.action = key; return button; };
      actions.append(action('volume', 'speakHighlightTooltip', onSpeak, ' lhn-speak-btn'), action('edit', 'editNote', onEdit), action('trash', 'deleteNote', onDelete, ' lhn-delete-btn'));
      card.append(actions);
      highlightMatches(card, query);
      return card;
    }
    function createShell({ width, pageTitle, pageUrl, websiteDisabled, version, colors, filter, searchQuery, t, config, onToggleSidebarSetting, onToggleWebsiteDisabled, onOpenDashboard, onOpenChatGPT, onToggleTheme, onSearch, onFilter, onStopPropagation }) {
      const sidebar = el('aside'); sidebar.id = 'lhn-sidebar'; sidebar.style.width = width + 'px'; sidebar.setAttribute('aria-label', 'Keepit');
      const top = el('div', 'lhn-sidebar-top'), head = el('div', 'lhn-sidebar-head');
      const brandRow = el('div', 'lhn-sidebar-brandrow'), brand = el('div', 'lhn-sidebar-brand');
      const logo = el('img'); logo.src = browser.runtime.getURL('assets/icons/icon.svg'); logo.alt = ''; logo.draggable = false;
      const brandCopy = el('div', 'lhn-sidebar-brandcopy');
      const plan = el('span', 'lhn-sidebar-plan'); plan.innerHTML = svg(ICON.shield); plan.append(el('span', '', t('freePlan')));
      brandCopy.append(el('b', 'lhn-sidebar-brandname', 'Keepit - Keep Exploring'), plan); brand.append(logo, brandCopy);
      const headerActions = el('div', 'lhn-sidebar-header-actions');
      const addHeaderIcon = (labelKey, icon, handler, data = {}) => {
        const button = el('button', 'lhn-header-icon'); button.type = 'button'; button.innerHTML = svg(icon); button.dataset.labelKey = labelKey;
        Object.assign(button.dataset, data); button.dataset.tooltip = t(labelKey); button.setAttribute('aria-label', t(labelKey));
        button.addEventListener('click', handler); headerActions.append(button); return button;
      };
      const themeButton = el('button', 'lhn-header-icon lhn-theme-toggle'); themeButton.type = 'button'; themeButton.dataset.themeToggle = 'true'; themeButton.addEventListener('click', onToggleTheme); headerActions.append(themeButton);
      if (websiteDisabled) addHeaderIcon('enableWebsite', ICON.siteOff, onToggleWebsiteDisabled, { siteToggle:'true' });
      else {
        addHeaderIcon('openDashboard', ICON.dashboard, onOpenDashboard);
        addHeaderIcon('autoPopup', ICON.autoPopup, () => onToggleSidebarSetting('showOnSelect'), { setting:'showOnSelect' });
        addHeaderIcon('autoSentenceNote', ICON.sentence, () => onToggleSidebarSetting('sentenceNoteEnabled'), { setting:'sentenceNoteEnabled' });
        addHeaderIcon('disableWebsite', ICON.siteOn, onToggleWebsiteDisabled, { siteToggle:'true' });
      }
      brandRow.append(brand, headerActions);
      const title = el('div', 'lhn-sidebar-title', pageTitle);
      const url = el('a', 'lhn-sidebar-url', pageUrl); url.href = pageUrl; url.target = '_blank'; url.rel = 'noopener noreferrer'; url.title = pageUrl;
      head.append(brandRow, title, url);
      if (!websiteDisabled) {
        const searchWrap = el('label', 'lhn-sidebar-search-wrap'); searchWrap.innerHTML = svg(ICON.search);
        const searchInput = el('input', 'lhn-sidebar-search'); searchInput.type = 'search'; searchInput.placeholder = t('sidebarSearchPlaceholder'); searchInput.setAttribute('aria-label', t('sidebarSearchPlaceholder')); searchInput.value = searchQuery;
        searchInput.addEventListener('input', () => onSearch(searchInput.value)); searchWrap.append(searchInput);
        const filters = el('div', 'lhn-sidebar-filters'); filters.setAttribute('role', 'toolbar'); filters.setAttribute('aria-label', t('filterColor'));
        [{ id:'all', label:t('all') }, ...colors.map(color => ({ id:color, label:t(config.colorLabelKey(color)) }))].forEach(option => {
          const button = createButton('0', 'lhn-side-filter' + (filter === option.id ? ' is-active' : ''), () => onFilter(option.id, filters));
          button.dataset.filter = option.id; button.dataset.filterLabel = option.label;
          if (option.id !== 'all') button.prepend(el('span', `lhn-filter-swatch lhn-swatch-${option.id}`));
          filters.append(button);
        });
        head.append(searchWrap, filters);
      }
      top.append(head);
      const list = el('div', 'lhn-sidebar-list'); list.id = 'lhn-sidebar-list';
      if (websiteDisabled) list.append(createEmptyState('sleep', t('websiteDisabledMessage'), { label:t('enableWebsite'), onClick:onToggleWebsiteDisabled }));
      const footer = el('div', 'lhn-sidebar-footer');
      const footerToggle = el('button', 'lhn-sidebar-footer-toggle'); footerToggle.type = 'button';
      footerToggle.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); onToggleWebsiteDisabled(); });
      footer.append(footerToggle, el('span', 'lhn-sidebar-footer-version', `v${version}`));
      sidebar.append(top, list, footer);
      sidebar.addEventListener('mousedown', onStopPropagation); sidebar.addEventListener('click', onStopPropagation);
      // Hàng tab "Tô sáng / AI panel" đã bỏ: yêu cầu mở tab AI panel thì mở thẳng AI panel.
      const setActiveTab = tab => { if (tab === 'chatgpt') onOpenChatGPT?.(); };
      return { sidebar, headerActions, setActiveTab };
    }
    return Object.freeze({ createButton, renderContextSentence, searchFields, highlightMatches, createEmptyState, createHighlightCard, createShell });
  }
  globalThis.LHN_SIDEBAR = Object.freeze({ create });
})();
