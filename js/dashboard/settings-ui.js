(() => {
  function create({ $, document, languages, t, getCurrentLanguage, onLanguageChange, escapeHtml }) {
    const languageLabel = language => `${language.flag} ${language.name} - ${language.native}`;
    function closeLanguagePicker({ restoreSelection = true } = {}) {
      const input = $("settingsLanguageSearch"), options = $("settingsLanguageOptions");
      if (!input || !options) return;
      options.classList.remove("open"); input.setAttribute("aria-expanded", "false");
      if (restoreSelection) {
        const selected = languages.LANGS.find(language => language.code === $("settingsLanguageSelect").value) || languages.LANGS[0];
        input.value = languageLabel(selected);
      }
    }
    function chooseLanguage(language) {
      const select = $("settingsLanguageSelect"), input = $("settingsLanguageSearch"); if (!select || !input) return;
      const changed = select.value !== language.code; select.value = language.code;
      closeLanguagePicker({ restoreSelection:true });
      input.blur();
      if (changed) select.dispatchEvent(new Event("change", { bubbles:true }));
    }
    function renderLanguageOptions(filter = "") {
      const select = $("settingsLanguageSelect"), options = $("settingsLanguageOptions"); if (!select || !options) return;
      options.replaceChildren();
      const filtered = LHN_INDEX_SEARCH.search(LHN_INDEX_SEARCH.createIndex(languages.LANGS, language => [language.name, language.native, language.code], language => language.code), filter);
      if (!filtered.length) { const empty = document.createElement("div"); empty.className = "language-empty settings-language-empty"; empty.textContent = t("languageSearchNoResults"); options.appendChild(empty); return; }
      filtered.forEach(language => {
        const option = document.createElement("div"); option.className = "language-option settings-language-option" + (language.code === select.value ? " selected" : "");
        option.role = "option"; option.tabIndex = 0; option.setAttribute("aria-selected", String(language.code === select.value)); option.textContent = languageLabel(language);
        option.addEventListener("click", () => chooseLanguage(language));
        option.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); chooseLanguage(language); } });
        options.appendChild(option);
      });
    }
    function openLanguagePicker() {
      const input = $("settingsLanguageSearch"), options = $("settingsLanguageOptions"); if (!input || !options || options.classList.contains("open")) return;
      input.value = ""; renderLanguageOptions(); options.classList.add("open"); input.setAttribute("aria-expanded", "true");
    }
    function syncLanguagePicker() {
      const input = $("settingsLanguageSearch"), options = $("settingsLanguageOptions"), select = $("settingsLanguageSelect"); if (!input || !options || !select) return;
      if (options.classList.contains("open")) renderLanguageOptions(input.value);
      else { const selected = languages.LANGS.find(language => language.code === select.value) || languages.LANGS[0]; input.value = languageLabel(selected); input.setAttribute("aria-expanded", "false"); }
    }
    function initLanguagePicker() {
      $("settingsLanguageSearch").addEventListener("focus", openLanguagePicker);
      $("settingsLanguageSearch").addEventListener("click", openLanguagePicker);
      $("settingsLanguageSearch").addEventListener("input", event => { const options = $("settingsLanguageOptions"); if (!options.classList.contains("open")) { options.classList.add("open"); event.target.setAttribute("aria-expanded", "true"); } renderLanguageOptions(event.target.value); });
      $("settingsLanguageSearch").addEventListener("keydown", event => { if (event.key === "Escape") { event.preventDefault(); closeLanguagePicker({ restoreSelection:true }); return; } if (event.key === "ArrowDown") { event.preventDefault(); $("settingsLanguageOptions").querySelector(".settings-language-option")?.focus(); } });
      $("settingsLanguagePicker").addEventListener("focusout", event => { if (!event.currentTarget.contains(event.relatedTarget)) closeLanguagePicker({ restoreSelection:true }); });
      document.addEventListener("pointerdown", event => { if (!event.target.closest?.("#settingsLanguagePicker")) closeLanguagePicker({ restoreSelection:true }); });
    }
    function renderWebsiteList({ host, sites, editing, actionAttribute, ariaLabel, emptyTextKey, actionKeys }) {
      if (!host) return;
      if (!sites.length) { host.innerHTML = `<p class="settings-disabled-web-empty">${escapeHtml(t(emptyTextKey))}</p>`; return; }
      host.replaceChildren(...sites.map(site => {
        const row = document.createElement("div"); row.className = "settings-disabled-web-item"; row.dataset.site = site;
        if (editing === site) {
          row.innerHTML = `<input class="settings-disabled-web-edit-input" type="text" value="${escapeHtml(site)}" aria-label="${escapeHtml(t(ariaLabel))}"><div class="settings-disabled-web-actions"><button type="button" class="settings-action-button" data-${actionAttribute}="save"${actionAttribute === "disabled-site-action" ? ' data-i18n="save"' : ""}>${escapeHtml(t("save"))}</button><button type="button" class="settings-action-button" data-${actionAttribute}="cancel"${actionAttribute === "disabled-site-action" ? ' data-i18n="cancel"' : ""}>${escapeHtml(t("cancel"))}</button></div>`;
        } else {
          const label = document.createElement("span"); label.className = "settings-disabled-web-domain"; label.textContent = site;
          const actions = document.createElement("div"); actions.className = "settings-disabled-web-actions";
          for (const [action, key] of actionKeys) { const button = document.createElement("button"); button.type = "button"; button.className = "settings-action-button"; button.setAttribute(`data-${actionAttribute}`, action); if (actionAttribute === "disabled-site-action") button.dataset.i18n = key; button.textContent = t(key); actions.appendChild(button); }
          row.append(label, actions);
        }
        return row;
      }));
    }
    function syncReaderControls() {
      const enabled = $("bilingualEnableTTS")?.checked !== false, dependent = $("bilingualReaderDependentSettings");
      if (!dependent) return;
      dependent.classList.toggle("is-disabled", !enabled); dependent.setAttribute("aria-disabled", String(!enabled));
      dependent.querySelectorAll("input,button,select,textarea").forEach(control => { control.disabled = !enabled; });
    }
    // Ô tìm Settings: lọc hàng/nhóm/tab bằng class tạm (không đổi hidden hay state), xóa ô tìm là về nguyên trạng.
    const SEARCH_ROWS = ".settings-preference-row,.settings-shortcut-row,.settings-account-row,.settings-backup-row,.settings-speech-rate-row,.settings-danger-row,.settings-speech-voice-row,.settings-language-speech-rate-row";
    function initSettingsSearch() {
      const dialog = $("dashboardSettingsDialog"), input = $("settingsSearch"), content = dialog?.querySelector(".settings-window-content"), empty = $("settingsSearchEmpty");
      if (!input || !content) return;
      const text = (root, selector) => [...root.querySelectorAll(selector)].map(node => node.textContent).join(" ");
      const groupOf = row => row.closest(".settings-subsection"), panelOf = row => row.closest(".settings-panel-page");
      // Tiêu đề h3 gần nhất phía trên hàng (một nhóm có thể chứa nhiều h3)
      const headingOf = row => { const heads = [...(groupOf(row)?.querySelectorAll("h3") || [])].filter(head => head.compareDocumentPosition(row) & Node.DOCUMENT_POSITION_FOLLOWING); return heads.length ? heads[heads.length - 1].textContent : ""; };
      // Tô sáng kết quả bằng mark.lhn-search-match (cùng kiểu Dashboard/sidebar); khớp không phân biệt hoa thường và dấu
      const fold = value => String(value).normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
      function unmark() {
        content.querySelectorAll("mark.lhn-search-match").forEach(mark => { const parent = mark.parentNode; mark.replaceWith(document.createTextNode(mark.textContent)); parent.normalize(); });
      }
      function markMatches(query) {
        const needle = LHN_INDEX_SEARCH.normalize(query); if (!needle) return;
        content.querySelectorAll(".has-search-match :is(h2, h3, .settings-panel-heading p, strong, small)").forEach(root => {
          if (root.closest(".settings-search-hidden, [hidden]:not(.settings-panel-page), button, select, template")) return;
          const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), nodes = [];
          while (walker.nextNode()) nodes.push(walker.currentNode);
          nodes.forEach(node => {
            const text = node.nodeValue, folded = [], origin = [];
            for (let i = 0; i < text.length; i++) for (const char of fold(text[i])) { folded.push(char); origin.push(i); }
            const haystack = folded.join(""), fragment = document.createDocumentFragment(); let from = 0, at, last = 0;
            while ((at = haystack.indexOf(needle, from)) !== -1) {
              const start = origin[at], end = origin[at + needle.length - 1] + 1;
              if (start > last) fragment.appendChild(document.createTextNode(text.slice(last, start)));
              const mark = document.createElement("mark"); mark.className = "lhn-search-match"; mark.textContent = text.slice(start, end); fragment.appendChild(mark);
              last = end; from = at + needle.length;
            }
            if (!last) return;
            if (last < text.length) fragment.appendChild(document.createTextNode(text.slice(last)));
            node.replaceWith(fragment);
          });
        });
      }
      function clear() {
        unmark();
        content.classList.remove("is-searching");
        content.querySelectorAll(".settings-search-hidden,.has-search-match").forEach(node => node.classList.remove("settings-search-hidden", "has-search-match"));
        if (empty) empty.hidden = true;
      }
      function apply() {
        const query = input.value;
        input.setAttribute("aria-label", t("settingsSearchPlaceholder"));
        unmark();
        if (!LHN_INDEX_SEARCH.normalize(query)) { clear(); return; }
        const rows = [...content.querySelectorAll(SEARCH_ROWS)];
        const rowIndex = LHN_INDEX_SEARCH.createIndex(rows, row => [row.querySelector("strong")?.textContent || row.textContent, text(row, "small"), headingOf(row), panelOf(row) ? text(panelOf(row), ".settings-panel-heading") : ""], row => row);
        const matchedRows = new Set(LHN_INDEX_SEARCH.search(rowIndex, query));
        rows.forEach(row => row.classList.toggle("settings-search-hidden", !matchedRows.has(row)));
        let anyPanel = false;
        content.querySelectorAll(".settings-panel-page").forEach(panel => {
          const titleMatch = LHN_INDEX_SEARCH.search(LHN_INDEX_SEARCH.createIndex([panel], node => [text(node, ".settings-panel-heading")]), query).length > 0;
          const groups = [...panel.querySelectorAll(".settings-subsection")];
          let visible = false;
          groups.forEach(group => {
            const groupRows = [...group.querySelectorAll(SEARCH_ROWS)];
            const groupTitleMatch = LHN_INDEX_SEARCH.search(LHN_INDEX_SEARCH.createIndex([group], node => [text(node, "h3"), text(panel, ".settings-panel-heading")]), query).length > 0;
            const show = groupRows.some(row => matchedRows.has(row)) || groupTitleMatch;
            group.classList.toggle("settings-search-hidden", !show);
            if (show) visible = true;
          });
          if (!visible) visible = [...panel.querySelectorAll(SEARCH_ROWS)].some(row => !groupOf(row) && matchedRows.has(row)) || (!groups.length && !panel.querySelector(SEARCH_ROWS) && titleMatch);
          panel.classList.toggle("has-search-match", visible);
          if (visible) anyPanel = true;
        });
        content.classList.add("is-searching");
        markMatches(query);
        if (empty) empty.hidden = anyPanel;
      }
      const debouncedApply = LHN_INDEX_SEARCH.debounce(apply, 200);
      const reset = () => { debouncedApply.cancel(); input.value = ""; clear(); };
      input.setAttribute("aria-label", t("settingsSearchPlaceholder"));
      input.addEventListener("input", debouncedApply);
      input.addEventListener("keydown", event => { if (event.key === "Escape" && input.value) { event.preventDefault(); event.stopPropagation(); reset(); } });
      dialog.querySelectorAll("[data-settings-tab]").forEach(button => button.addEventListener("click", reset));
      dialog.addEventListener("close", reset);
    }
    return Object.freeze({ initLanguagePicker, syncLanguagePicker, closeLanguagePicker, renderLanguageOptions, renderWebsiteList, syncReaderControls, initSettingsSearch });
  }
  globalThis.LHN_DASHBOARD_SETTINGS_UI = Object.freeze({ create });
})();
