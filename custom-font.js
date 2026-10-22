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
  let lastDarkReaderTheme = "default";
  let darkLayerObserver = null, darkLayerFrame = 0;
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
  function applyDarkReader(value) {
    const options = typeof value === "object" && value ? value : { enabled:value };
    lastDarkReaderEnabled = options.enabled === true;
    lastDarkReaderTheme = options.theme === "dracula" ? "dracula" : "default";
    if (websiteDisabled || !lastDarkReaderEnabled) {
      darkStyle.textContent = "";
      document.documentElement?.removeAttribute("data-lhn-dark-reader");
      document.documentElement?.removeAttribute("data-lhn-dark-reader-theme");
      clearDarkReaderLayers();
      return;
    }
    document.documentElement?.setAttribute("data-lhn-dark-reader", "true");
    document.documentElement?.setAttribute("data-lhn-dark-reader-theme", lastDarkReaderTheme);
    const pageElement = `:not([id^="lhn-"]):not([id^="lhn-"] *):not(.lhn-bilingual-card):not(.lhn-bilingual-card *):not(.lhn-bilingual-speaker):not(.lhn-bilingual-speaker *)`;
    const page = `body,body ${pageElement}`;
    const floatingLayers = `body ${pageElement}[data-lhn-dark-reader-layer]`;
    const googleSearchFix = /(^|\.)google\./i.test(location.hostname)
      ? `html[data-lhn-dark-reader="true"] body ${pageElement}{background-image:none!important}`
      : "";
    darkStyle.textContent = `
      html[data-lhn-dark-reader="true"]{--lhn-dr-bg:#181a1b;--lhn-dr-surface:#202124;--lhn-dr-text:#e8e6e3;--lhn-dr-border:#45494c;--lhn-dr-link:#9ecbff;--lhn-dr-control:#282b2e;color-scheme:dark!important}
      html[data-lhn-dark-reader-theme="dracula"]{--lhn-dr-bg:#282a36;--lhn-dr-surface:#44475a;--lhn-dr-text:#f8f8f2;--lhn-dr-border:#6272a4;--lhn-dr-link:#8be9fd;--lhn-dr-control:#44475a}
      html[data-lhn-dark-reader="true"],html[data-lhn-dark-reader="true"] body{background:var(--lhn-dr-bg)!important;background-image:none!important;color:var(--lhn-dr-text)!important}
      html[data-lhn-dark-reader="true"] ${page}{background-color:transparent!important;color:var(--lhn-dr-text)!important;border-color:var(--lhn-dr-border)!important}
      html[data-lhn-dark-reader="true"] body a${pageElement}{color:var(--lhn-dr-link)!important}
      html[data-lhn-dark-reader="true"] body button${pageElement},html[data-lhn-dark-reader="true"] body input${pageElement},html[data-lhn-dark-reader="true"] body select${pageElement},html[data-lhn-dark-reader="true"] body textarea${pageElement}{background:var(--lhn-dr-control)!important;color:var(--lhn-dr-text)!important}
      html[data-lhn-dark-reader="true"] ${floatingLayers}{background-color:var(--lhn-dr-surface)!important;background-image:none!important;box-shadow:none!important}
      html[data-lhn-dark-reader="true"] ${page}::before,html[data-lhn-dark-reader="true"] ${page}::after{background-image:none!important;background-color:transparent!important;box-shadow:none!important}
      ${googleSearchFix}
    `;
    watchDarkReaderLayers();
  }
  function isAddonElement(element) { return Boolean(element.closest?.('[id^="lhn-"],.lhn-bilingual-card,.lhn-bilingual-speaker')); }
  function inspectDarkReaderLayer(element) {
    if (!(element instanceof Element) || isAddonElement(element)) return;
    const position = getComputedStyle(element).position;
    if (position === "fixed" || position === "sticky") element.setAttribute("data-lhn-dark-reader-layer", "true");
    else element.removeAttribute("data-lhn-dark-reader-layer");
  }
  function scanDarkReaderLayers(root) {
    if (!(root instanceof Element) || isAddonElement(root)) return;
    inspectDarkReaderLayer(root);
    root.querySelectorAll("*").forEach(inspectDarkReaderLayer);
  }
  function clearDarkReaderLayers() {
    darkLayerObserver?.disconnect(); darkLayerObserver = null;
    document.querySelectorAll("[data-lhn-dark-reader-layer]").forEach(element => element.removeAttribute("data-lhn-dark-reader-layer"));
  }
  function watchDarkReaderLayers() {
    if (websiteDisabled || !lastDarkReaderEnabled || darkLayerObserver) return;
    const scanPage = () => { if (document.body) scanDarkReaderLayers(document.body); };
    if (document.body) scanPage(); else document.addEventListener("DOMContentLoaded", scanPage, { once:true });
    darkLayerObserver = new MutationObserver(records => {
      cancelAnimationFrame(darkLayerFrame);
      darkLayerFrame = requestAnimationFrame(() => records.forEach(record => {
        if (record.type === "attributes") inspectDarkReaderLayer(record.target);
        else record.addedNodes.forEach(node => { if (node instanceof Element) scanDarkReaderLayers(node); });
      }));
    });
    darkLayerObserver.observe(document.documentElement, { subtree:true, childList:true, attributes:true, attributeFilter:["class","style"] });
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
      applyDarkReader(data[LOCAL_DARK_READER_KEY] || { enabled:data[BILINGUAL_SETTINGS_KEY]?.darkReader, theme:data[BILINGUAL_SETTINGS_KEY]?.darkReaderTheme });
    }).catch(() => { applyFont({ customFontEnabled:false, fontKey:"auto" }); applyDarkReader(false); });
  }
  loadLocalSettings();
  browser.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    if (changes[WEBSITE_SETTINGS_KEY]) {
      websiteDisabled = Array.isArray(changes[WEBSITE_SETTINGS_KEY].newValue?.disabledWebsites) && changes[WEBSITE_SETTINGS_KEY].newValue.disabledWebsites.includes(hostKey);
      applyFont(lastFontSettings);
      applyDarkReader({ enabled:lastDarkReaderEnabled, theme:lastDarkReaderTheme });
    }
    if (changes[LOCAL_FONT_KEY]) applyFont(changes[LOCAL_FONT_KEY].newValue);
    else if (changes[BILINGUAL_SETTINGS_KEY]) applyFont(fromBilingualSettings(changes[BILINGUAL_SETTINGS_KEY].newValue));
    if (changes[LOCAL_DARK_READER_KEY]) applyDarkReader(changes[LOCAL_DARK_READER_KEY].newValue);
    else if (changes[BILINGUAL_SETTINGS_KEY]) applyDarkReader({ enabled:changes[BILINGUAL_SETTINGS_KEY].newValue?.darkReader, theme:changes[BILINGUAL_SETTINGS_KEY].newValue?.darkReaderTheme });
  });
  document.addEventListener("lhn-website-disabled-change", event => {
    websiteDisabled = Boolean(event.detail);
    applyFont(lastFontSettings);
    applyDarkReader({ enabled:lastDarkReaderEnabled, theme:lastDarkReaderTheme });
  });
  // Shadow DOM content is not handled by this page-level font rule.
})();
