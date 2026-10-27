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
      LHN_INDEX_SEARCH.attachListKeyboard($("settingsLanguageSearch"), $("settingsLanguageOptions"), (el) => el.click());
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
    return Object.freeze({ initLanguagePicker, syncLanguagePicker, closeLanguagePicker, renderLanguageOptions, renderWebsiteList, syncReaderControls });
  }
  globalThis.LHN_DASHBOARD_SETTINGS_UI = Object.freeze({ create });
})();
