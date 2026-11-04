(() => {
  "use strict";

  const HOST_ID = "keepit-chatgpt-ai-toolbar-host";
  const UI_LANGUAGE_KEY = "lhnSettings";
  const SOURCE_LABELS = { en:"Source page", vi:"Trang nguồn", ko:"원본 페이지" };
  const TABS_LABELS = { en:"AI services", vi:"Các AI", ko:"AI 서비스" };
  const PANEL_LABELS = { en:"panel", vi:"khung AI", ko:"AI 패널" };
  const PROVIDERS = ["chatgpt", "gemini", "claude", "grok"];
  const PROVIDER_NAMES = { chatgpt:"ChatGPT", gemini:"Gemini", claude:"Claude", grok:"Grok" };

  function supportedLanguage(value) {
    const language = String(value || "").toLowerCase().split(/[-_]/)[0];
    return Object.hasOwn(SOURCE_LABELS, language) ? language : "en";
  }

  function create({ sourceUrl = "" } = {}) {
    let host = document.getElementById(HOST_ID);
    if (!host) {
      host = document.createElement("div");
      host.id = HOST_ID;
      host.style.cssText = "all:initial;position:fixed;inset:0 0 auto 0;z-index:2147483647;pointer-events:none;";
      const shadow = host.attachShadow({ mode:"open" });
      shadow.innerHTML = `
        <style>
          :host { all:initial; color-scheme:light dark; font:13px/1.3 system-ui,-apple-system,"Segoe UI",sans-serif; }
          .bar { pointer-events:auto; position:relative; z-index:2; height:68px; box-sizing:border-box; display:flex; flex-direction:column; justify-content:center; gap:0; padding:2px 12px; color:CanvasText; background:Canvas; border-bottom:1px solid color-mix(in srgb, CanvasText 14%, transparent); box-shadow:0 1px 4px color-mix(in srgb, CanvasText 10%, transparent); }
          .source-row { min-height:31px; display:flex; align-items:center; gap:8px; }
          .label { flex:0 0 auto; font-weight:600; opacity:.72; }
          .source-link { display:block; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:LinkText; text-decoration:none; }
          .source-link:hover { text-decoration:underline; }
          .empty-source { opacity:.5; font-style:italic; }
          .tabs { min-height:31px; display:flex; align-items:center; gap:4px; overflow-x:auto; scrollbar-width:none; }
          .tabs::-webkit-scrollbar { display:none; }
          .tab { flex:0 0 auto; border:0; border-radius:7px; padding:6px 10px; color:inherit; background:transparent; font:inherit; white-space:nowrap; cursor:pointer; }
          .tab:hover { background:color-mix(in srgb, CanvasText 8%, transparent); }
          .tab[aria-selected="true"] { background:color-mix(in srgb, LinkText 15%, Canvas); color:LinkText; font-weight:650; }
          .blank-panel { pointer-events:auto; position:fixed; z-index:1; inset:68px 0 0; display:none; background:Canvas; }
        </style>
        <div class="bar">
          <div class="source-row" role="region"><span class="label"></span><a class="source-link" target="_blank" rel="noopener noreferrer" hidden></a><span class="empty-source" hidden></span></div>
          <div class="tabs" role="tablist"><button class="tab" type="button" role="tab" data-provider="chatgpt" aria-selected="true">ChatGPT</button><button class="tab" type="button" role="tab" data-provider="gemini" aria-selected="false">Gemini</button><button class="tab" type="button" role="tab" data-provider="claude" aria-selected="false">Claude</button><button class="tab" type="button" role="tab" data-provider="grok" aria-selected="false">Grok</button></div>
        </div>
        <div class="blank-panel" role="tabpanel" aria-label="AI panel"></div>`;
      document.documentElement.append(host);
    }
    const shadow = host.shadowRoot;
    const sourceRow = shadow.querySelector(".source-row");
    const sourceLabel = shadow.querySelector(".label");
    const tabs = shadow.querySelector(".tabs");
    const sourceLink = shadow.querySelector(".source-link");
    const emptySource = shadow.querySelector(".empty-source");
    const blankPanel = shadow.querySelector(".blank-panel");
    const providerButtons = [...shadow.querySelectorAll("[data-provider]")];
    let currentSourceUrl = "";
    let selectedProvider = "chatgpt";
    let uiLanguage = supportedLanguage(globalThis.browser?.i18n?.getUILanguage?.());

    function setSourceUrl(value) {
      try {
        const parsed = new URL(String(value || ""));
        currentSourceUrl = ["http:", "https:"].includes(parsed.protocol) ? parsed.href : "";
      } catch { currentSourceUrl = ""; }
      if (currentSourceUrl) {
        const parsed = new URL(currentSourceUrl);
        sourceLink.href = currentSourceUrl;
        sourceLink.title = currentSourceUrl;
        sourceLink.textContent = `${parsed.host}${parsed.pathname}${parsed.search}${parsed.hash}`;
        sourceLink.hidden = false;
        emptySource.hidden = true;
      } else {
        sourceLink.removeAttribute("href");
        sourceLink.textContent = "";
        sourceLink.hidden = true;
        emptySource.textContent = "";
        emptySource.hidden = false;
      }
    }

    function renderProvider() {
      for (const button of providerButtons) {
        const selected = button.dataset.provider === selectedProvider;
        button.setAttribute("aria-selected", String(selected));
        button.tabIndex = selected ? 0 : -1;
      }
      blankPanel.style.display = selectedProvider === "chatgpt" ? "none" : "block";
      blankPanel.setAttribute("aria-label", `${PROVIDER_NAMES[selectedProvider]} ${PANEL_LABELS[uiLanguage]}`);
    }

    function setProvider(provider) {
      if (!PROVIDERS.includes(provider)) return;
      selectedProvider = provider;
      renderProvider();
    }

    for (const button of providerButtons) {
      button.addEventListener("click", () => setProvider(button.dataset.provider));
      button.addEventListener("keydown", event => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        const index = providerButtons.indexOf(button);
        const next = event.key === "Home" ? 0 : event.key === "End" ? providerButtons.length - 1
          : (index + (event.key === "ArrowRight" ? 1 : -1) + providerButtons.length) % providerButtons.length;
        providerButtons[next].focus();
        setProvider(providerButtons[next].dataset.provider);
      });
    }

    void (async () => {
      try {
        const stored = await globalThis.browser?.storage?.local?.get?.(UI_LANGUAGE_KEY);
        uiLanguage = supportedLanguage(stored?.[UI_LANGUAGE_KEY]?.language || uiLanguage);
      } catch {}
      sourceLabel.textContent = SOURCE_LABELS[uiLanguage];
      sourceLabel.setAttribute("aria-label", SOURCE_LABELS[uiLanguage]);
      sourceRow.setAttribute("aria-label", SOURCE_LABELS[uiLanguage]);
      tabs.setAttribute("aria-label", TABS_LABELS[uiLanguage]);
      renderProvider();
    })();
    globalThis.browser?.storage?.onChanged?.addListener?.((changes, areaName) => {
      if (areaName !== "local" || !changes?.[UI_LANGUAGE_KEY]) return;
      uiLanguage = supportedLanguage(changes[UI_LANGUAGE_KEY].newValue?.language || "en");
      sourceLabel.textContent = SOURCE_LABELS[uiLanguage];
      sourceLabel.setAttribute("aria-label", SOURCE_LABELS[uiLanguage]);
      sourceRow.setAttribute("aria-label", SOURCE_LABELS[uiLanguage]);
      tabs.setAttribute("aria-label", TABS_LABELS[uiLanguage]);
      renderProvider();
    });

    setSourceUrl(sourceUrl);
    renderProvider();
    return Object.freeze({ setSourceUrl, setProvider, getProvider:() => selectedProvider });
  }

  globalThis.LHN_CHATGPT_AI_TOOLBAR = Object.freeze({ create });
})();
