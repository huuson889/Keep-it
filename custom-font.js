(() => {
  if (!/^https?:$/.test(location.protocol)) return;
  const FONT_OPTIONS = {
    auto: "",
    inter: "'Inter', sans-serif",
    lora: "'Lora', Georgia, serif",
    "roboto-mono": "'Roboto Mono', monospace",
    fredoka: "'Fredoka', sans-serif",
    system: "system-ui, -apple-system, sans-serif"
  };
  const FONT_KEYS_BY_STACK = Object.fromEntries(Object.entries(FONT_OPTIONS).map(([key, stack]) => [stack, key]));
  const LOCAL_FONT_KEY = "lhnCustomFontSettings";
  const LOCAL_DARK_READER_KEY = "lhnDarkReaderSettings";
  const BILINGUAL_SETTINGS_KEY = "lhnBilingualReaderSettings";
  const WEBSITE_SETTINGS_KEY = "lhnSettings";
  const hostKey = location.hostname.toLowerCase().replace(/^www\./, "").replace(/\.$/, "");
  const style = document.createElement("style");
  style.id = "custom-font-style";
  const darkStyle = document.createElement("style");
  darkStyle.id = "lhn-dark-reader-style";
  let lastFontSettings = { customFontEnabled:false, fontKey:"auto" };
  let lastDarkReaderEnabled = false;
  let websiteDisabled = false;
  const fontStylesheet = document.querySelector('link[data-lhn-bilingual-fonts]') || document.createElement("link");
  function attachFontStylesheet() {
    if (fontStylesheet.isConnected) return;
    fontStylesheet.rel = "stylesheet";
    fontStylesheet.href = "https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500&family=Inter:wght@300;400;500;600;700&family=Lora:ital,wght@0,400;0,600;1,400&family=Roboto+Mono:wght@400;500&display=block";
    fontStylesheet.dataset.lhnBilingualFonts = "true";
    (document.head || document.documentElement)?.appendChild(fontStylesheet);
  }
  const attachStyle = () => {
    if (style.isConnected) return;
    (document.documentElement || document.head)?.appendChild(style);
    (document.documentElement || document.head)?.appendChild(darkStyle);
    attachFontStylesheet();
    applyFont(lastFontSettings);
  };
  if (document.documentElement) attachStyle();
  else new MutationObserver((_, observer) => { if (document.documentElement) { attachStyle(); observer.disconnect(); } }).observe(document, { childList:true, subtree:true });

  function normalizedSettings(value = {}) {
    const key = FONT_OPTIONS[value.fontKey] !== undefined ? value.fontKey : "auto";
    return { customFontEnabled:value.customFontEnabled === true && key !== "auto", fontKey:key };
  }
  function applyFont(value) {
    const { customFontEnabled, fontKey } = normalizedSettings(value);
    lastFontSettings = { customFontEnabled, fontKey };
    if (websiteDisabled || !customFontEnabled || fontKey === "auto") {
      style.textContent = "";
      document.documentElement?.removeAttribute("data-lhn-custom-font");
      return;
    }
    const family = FONT_OPTIONS[fontKey];
    document.documentElement?.setAttribute("data-lhn-custom-font", fontKey);
    const pageText = `body, body :not(#lhn-panel):not(#lhn-panel *):not(#lhn-note-pop):not(#lhn-note-pop *):not(#lhn-sidebar):not(#lhn-sidebar *):not(#lhn-direct-translation):not(#lhn-direct-translation *):not(#lhn-full-english-dictionary):not(#lhn-full-english-dictionary *):not(#lhn-translate-icon):not(#lhn-highlight-actions):not(#lhn-bilingual-reading-bar):not(.lhn-bilingual-card):not(.lhn-bilingual-card *):not(.lhn-bilingual-speaker):not(.lhn-bilingual-speaker *)`;
    style.textContent = `html[data-lhn-custom-font="${fontKey}"] ${pageText}{font-family:${family}!important}`;
  }
  function applyDarkReader(enabled) {
    lastDarkReaderEnabled = enabled === true;
    if (websiteDisabled || !lastDarkReaderEnabled) {
      darkStyle.textContent = "";
      document.documentElement?.removeAttribute("data-lhn-dark-reader");
      return;
    }
    document.documentElement?.setAttribute("data-lhn-dark-reader", "true");
    const page = `body,body :not([id^="lhn-"]):not([id^="lhn-"] *):not(.lhn-bilingual-card):not(.lhn-bilingual-card *):not(.lhn-bilingual-speaker):not(.lhn-bilingual-speaker *)`;
    const pageElement = `:not([id^="lhn-"]):not([id^="lhn-"] *)`;
    const googleSearchFix = /(^|\.)google\./i.test(location.hostname)
      ? `html[data-lhn-dark-reader="true"] body ${pageElement}{background-image:none!important}`
      : "";
    darkStyle.textContent = `
      html[data-lhn-dark-reader="true"],html[data-lhn-dark-reader="true"] body{background:#181a1b!important;background-image:none!important;color:#e8e6e3!important;color-scheme:dark!important}
      html[data-lhn-dark-reader="true"] ${page}{background-color:transparent!important;color:#e8e6e3!important;border-color:#45494c!important}
      html[data-lhn-dark-reader="true"] body a${pageElement}{color:#9ecbff!important}
      html[data-lhn-dark-reader="true"] body button${pageElement},html[data-lhn-dark-reader="true"] body input${pageElement},html[data-lhn-dark-reader="true"] body select${pageElement},html[data-lhn-dark-reader="true"] body textarea${pageElement}{background:#282b2e!important;color:#e8e6e3!important}
      html[data-lhn-dark-reader="true"] ${page}::before,html[data-lhn-dark-reader="true"] ${page}::after{background-image:none!important;background-color:transparent!important;box-shadow:none!important}
      ${googleSearchFix}
    `;
  }
  function fromBilingualSettings(settings = {}) {
    const key = FONT_KEYS_BY_STACK[settings.webFontFamily || ""] || "auto";
    return { customFontEnabled:key !== "auto", fontKey:key };
  }
  function loadLocalSettings() {
    browser.storage.local.get([LOCAL_FONT_KEY, LOCAL_DARK_READER_KEY, BILINGUAL_SETTINGS_KEY, WEBSITE_SETTINGS_KEY]).then(data => {
      websiteDisabled = Array.isArray(data[WEBSITE_SETTINGS_KEY]?.disabledWebsites) && data[WEBSITE_SETTINGS_KEY].disabledWebsites.includes(hostKey);
      const localCopy = data[LOCAL_FONT_KEY] || fromBilingualSettings(data[BILINGUAL_SETTINGS_KEY]);
      applyFont(localCopy);
      applyDarkReader(data[LOCAL_DARK_READER_KEY]?.enabled ?? data[BILINGUAL_SETTINGS_KEY]?.darkReader);
    }).catch(() => { applyFont({ customFontEnabled:false, fontKey:"auto" }); applyDarkReader(false); });
  }
  loadLocalSettings();
  browser.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    if (changes[WEBSITE_SETTINGS_KEY]) {
      websiteDisabled = Array.isArray(changes[WEBSITE_SETTINGS_KEY].newValue?.disabledWebsites) && changes[WEBSITE_SETTINGS_KEY].newValue.disabledWebsites.includes(hostKey);
      applyFont(lastFontSettings);
      applyDarkReader(lastDarkReaderEnabled);
    }
    if (changes[LOCAL_FONT_KEY]) applyFont(changes[LOCAL_FONT_KEY].newValue);
    else if (changes[BILINGUAL_SETTINGS_KEY]) applyFont(fromBilingualSettings(changes[BILINGUAL_SETTINGS_KEY].newValue));
    if (changes[LOCAL_DARK_READER_KEY]) applyDarkReader(changes[LOCAL_DARK_READER_KEY].newValue?.enabled);
    else if (changes[BILINGUAL_SETTINGS_KEY]) applyDarkReader(changes[BILINGUAL_SETTINGS_KEY].newValue?.darkReader);
  });
  document.addEventListener("lhn-website-disabled-change", event => {
    websiteDisabled = Boolean(event.detail);
    applyFont(lastFontSettings);
    applyDarkReader(lastDarkReaderEnabled);
  });
  // Shadow DOM content is not handled by this page-level font rule.
})();
