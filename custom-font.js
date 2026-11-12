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
  const BILINGUAL_SETTINGS_KEY = "lhnBilingualReaderSettings";
  const WEBSITE_SETTINGS_KEY = "lhnSettings";
  const hostKey = location.hostname.toLowerCase().replace(/^www\./, "").replace(/\.$/, "");
  const style = document.createElement("style");
  style.id = "custom-font-style";
  let lastFontSettings = { customFontEnabled:false, fontKey:"auto" };
  let websiteDisabled = false;
  const fontStylesheet = document.querySelector('link[data-lhn-bilingual-fonts]') || document.createElement("link");
  function attachFontStylesheet() {
    if (document.querySelector('link[data-lhn-bilingual-fonts]')?.isConnected || fontStylesheet.isConnected) return;
    fontStylesheet.rel = "stylesheet";
    fontStylesheet.href = "https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500&family=Inter:wght@300;400;500;600;700&family=Lora:ital,wght@0,400;0,600;1,400&family=Roboto+Mono:wght@400;500&display=block";
    fontStylesheet.dataset.lhnBilingualFonts = "true";
    (document.head || document.documentElement)?.appendChild(fontStylesheet);
  }
  const attachStyle = () => {
    if (style.isConnected) return;
    (document.documentElement || document.head)?.appendChild(style);
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
      document.querySelectorAll('link[data-lhn-bilingual-fonts]').forEach(link => link.remove());
      if (fontStylesheet.isConnected) fontStylesheet.remove();
      return;
    }
    const family = FONT_OPTIONS[fontKey];
    attachFontStylesheet();
    document.documentElement?.setAttribute("data-lhn-custom-font", fontKey);
    const pageText = `body, body :not(#lhn-panel):not(#lhn-panel *):not(#lhn-note-pop):not(#lhn-note-pop *):not(#lhn-sidebar):not(#lhn-sidebar *):not(#lhn-direct-translation):not(#lhn-direct-translation *):not(#lhn-full-english-dictionary):not(#lhn-full-english-dictionary *):not(#lhn-translate-icon):not(#lhn-highlight-actions):not(#lhn-bilingual-reading-bar):not(.lhn-bilingual-card):not(.lhn-bilingual-card *):not(.lhn-bilingual-speaker):not(.lhn-bilingual-speaker *)`;
    style.textContent = `html[data-lhn-custom-font="${fontKey}"] ${pageText}{font-family:${family}!important}`;
  }
  function fromBilingualSettings(settings = {}) {
    const key = FONT_KEYS_BY_STACK[settings.webFontFamily || ""] || "auto";
    return { customFontEnabled:key !== "auto", fontKey:key };
  }
  function loadLocalSettings() {
    browser.storage.local.get([LOCAL_FONT_KEY, BILINGUAL_SETTINGS_KEY, WEBSITE_SETTINGS_KEY]).then(data => {
      websiteDisabled = Array.isArray(data[WEBSITE_SETTINGS_KEY]?.disabledWebsites) && data[WEBSITE_SETTINGS_KEY].disabledWebsites.includes(hostKey);
      const localCopy = data[LOCAL_FONT_KEY] || fromBilingualSettings(data[BILINGUAL_SETTINGS_KEY]);
      applyFont(localCopy);
    }).catch(() => { applyFont({ customFontEnabled:false, fontKey:"auto" }); });
  }
  loadLocalSettings();
  browser.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    if (changes[WEBSITE_SETTINGS_KEY]) {
      websiteDisabled = Array.isArray(changes[WEBSITE_SETTINGS_KEY].newValue?.disabledWebsites) && changes[WEBSITE_SETTINGS_KEY].newValue.disabledWebsites.includes(hostKey);
      applyFont(lastFontSettings);
    }
    if (changes[LOCAL_FONT_KEY]) applyFont(changes[LOCAL_FONT_KEY].newValue);
    else if (changes[BILINGUAL_SETTINGS_KEY]) applyFont(fromBilingualSettings(changes[BILINGUAL_SETTINGS_KEY].newValue));
  });
  document.addEventListener("lhn-website-disabled-change", event => {
    websiteDisabled = Boolean(event.detail);
    applyFont(lastFontSettings);
  });
  // Shadow DOM content is not handled by this page-level font rule.
})();
