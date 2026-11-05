(() => {
  "use strict";

  const providers = globalThis.LHN_AI_PROVIDERS;
  if (!providers) return;

  const NAVIGATION_KEY = "keepitChatGPTPanelNavigationRequest";
  const LINK_PENDING_KEY = "keepitChatGPTLinkPending";
  const PROVIDER_BY_WINDOW_KEY = "keepitAiPanelProviderByWindow";
  const AI_PANEL_MARKER = "keepit-ai-panel";
  const AI_SOURCE_MARKER = "keepit-ai-source-url";
  const AI_SOURCE_SESSION_KEY = "keepitAiPanelSourceUrl";
  const CHATGPT_PANEL_MARKER = "keepit-chatgpt-panel";
  const CHATGPT_SOURCE_MARKER = "keepit-chatgpt-source-url";
  const CHATGPT_CLEAR_MARKER = "keepit-chatgpt-clear-composer";
  const CHATGPT_LINK_MARKER = "keepit-chatgpt-link-request";
  const HOST_SELECTORS = Object.freeze({
    chatgpt:[
      "#prompt-textarea",
      '[contenteditable="true"][data-testid="prompt-textarea"]',
      '[contenteditable="true"][role="textbox"][aria-label*="ChatGPT" i]',
      '[contenteditable="true"][role="textbox"]',
      'textarea[placeholder*="Message" i]',
      'textarea[aria-label*="Message" i]'
    ],
    gemini:[
      'rich-textarea [contenteditable="true"]',
      'div[contenteditable="true"][aria-label*="prompt" i]',
      'div[contenteditable="true"][aria-label*="message" i]',
      'textarea[aria-label*="prompt" i]'
    ],
    claude:[
      'div[contenteditable="true"][data-placeholder*="Reply" i]',
      'div[contenteditable="true"][aria-label*="Write a message" i]',
      'div[contenteditable="true"][role="textbox"]',
      'textarea[placeholder*="Reply" i]'
    ],
    grok:[
      'textarea[placeholder*="Ask" i]',
      'textarea[aria-label*="Ask" i]',
      'div[contenteditable="true"][data-placeholder*="Ask" i]',
      'div[contenteditable="true"][role="textbox"]'
    ]
  });

  const currentProvider = providers.fromHost(location.hostname);
  if (!currentProvider) return;
  const isFirefox = /Firefox\//i.test(globalThis.navigator?.userAgent || "");
  const isRootFrame = isFirefox ? window.top === window : window.parent === window.top;
  if (!isRootFrame) return;
  if (isFirefox) {
    try {
      const initialHash = new URLSearchParams(location.hash.replace(/^#/, ""));
      if (initialHash.get(AI_PANEL_MARKER) === "1" || initialHash.get(CHATGPT_PANEL_MARKER) === "1") {
        sessionStorage.setItem(AI_PANEL_MARKER, "1");
        const source = initialHash.get(AI_SOURCE_MARKER) || initialHash.get(CHATGPT_SOURCE_MARKER) || "";
        if (source) sessionStorage.setItem(AI_SOURCE_SESSION_KEY, source);
      }
    } catch { /* Firefox may restrict sessionStorage in private browsing. */ }
  }

  const safeSourceUrl = value => {
    try {
      const url = new URL(String(value || ""));
      return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch { return ""; }
  };

  function findEditor(root = document) {
    for (const selector of HOST_SELECTORS[currentProvider.id] || []) {
      try {
        const editor = root.querySelector(selector);
        if (editor && !editor.disabled && editor.getAttribute?.("aria-disabled") !== "true") return editor;
      } catch { /* A provider may change its editor markup between releases. */ }
    }
    return null;
  }

  function editorText(editor) {
    return String(editor?.isContentEditable ? editor.innerText ?? editor.textContent : editor?.value ?? "")
      .replace(/[\u200b\u2060]/g, "");
  }

  function focusAtEnd(editor) {
    if (!editor) return false;
    try { editor.focus({ preventScroll:true }); }
    catch { try { editor.focus(); } catch { return false; } }
    try {
      if (typeof editor.setSelectionRange === "function") {
        const end = String(editor.value || "").length;
        editor.setSelectionRange(end, end);
      } else if (editor.isContentEditable) {
        const range = document.createRange();
        range.selectNodeContents(editor);
        range.collapse(false);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
      return true;
    } catch { return false; }
  }

  function setEditorText(editor, value, replaceExisting = true) {
    if (!editor) return false;
    const text = String(value ?? "");
    try { editor.focus({ preventScroll:true }); } catch { try { editor.focus(); } catch {} }
    if (editor.isContentEditable) {
      if (replaceExisting) {
        try {
          const range = document.createRange();
          range.selectNodeContents(editor);
          const selection = window.getSelection();
          selection?.removeAllRanges();
          selection?.addRange(range);
        } catch { /* native text insertion may still use the existing caret */ }
      }
      if (currentProvider.id === "chatgpt" && text.includes("\n")) {
        try {
          if (globalThis.LHN_CHATGPT_PROMPT_FORMAT?.insertMultilineComposerText(editor, text, replaceExisting)) {
            return editorText(editor) === text.trim();
          }
        } catch { /* use shared editor fallback below */ }
      }
      let inserted = false;
      if (typeof document.execCommand === "function") {
        try { inserted = document.execCommand("insertText", false, text); } catch {}
      }
      if (!inserted || editorText(editor) !== text.trim()) editor.textContent = text;
      try { editor.dispatchEvent(new InputEvent("input", { bubbles:true, inputType:text ? "insertText" : "deleteContentBackward", data:text || null })); }
      catch { editor.dispatchEvent(new Event("input", { bubbles:true })); }
    } else {
      const prototype = Object.getPrototypeOf(editor);
      const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
      if (setter) setter.call(editor, text); else editor.value = text;
      try { editor.dispatchEvent(new InputEvent("input", { bubbles:true, inputType:"insertText", data:text })); }
      catch { editor.dispatchEvent(new Event("input", { bubbles:true })); }
      editor.dispatchEvent(new Event("change", { bubbles:true }));
    }
    focusAtEnd(editor);
    return editorText(editor) === text.trim();
  }

  function clearEditor(editor) {
    return setEditorText(editor, "", true) && !/\S/.test(editorText(editor));
  }

  function waitForEditor(timeoutMs = 15000) {
    const initial = findEditor();
    if (initial) return Promise.resolve(initial);
    return new Promise(resolve => {
      let settled = false;
      const finish = editor => {
        if (settled) return;
        settled = true;
        observer.disconnect();
        clearTimeout(timer);
        resolve(editor);
      };
      const observer = new MutationObserver(() => {
        const editor = findEditor();
        if (editor) finish(editor);
      });
      observer.observe(document.documentElement, { childList:true, subtree:true });
      const timer = setTimeout(() => finish(null), timeoutMs);
    });
  }

  async function fill(text, { requestId = "", focus = true } = {}) {
    const editor = findEditor() || await waitForEditor();
    const ok = !!editor && setEditorText(editor, text, true);
    if (ok && focus) focusAtEnd(editor);
    return { ok, requestId:String(requestId || ""), providerId:currentProvider.id };
  }

  const api = Object.freeze({
    providerId:currentProvider.id,
    findEditor,
    editorText,
    focusAtEnd,
    setEditorText,
    clearEditor,
    waitForEditor,
    fill,
    setSourceUrl:value => {
      activeSourceUrl = safeSourceUrl(value);
      toolbar?.setSourceUrl(activeSourceUrl);
      return activeSourceUrl;
    }
  });
  globalThis.LHN_AI_FILL = api;

  const extensionRoot = globalThis.browser?.runtime?.getURL?.("") || "";
  let extensionOrigin = "";
  try {
    const root = new URL(extensionRoot);
    extensionOrigin = `${root.protocol}//${root.host}`;
  } catch {}

  // The Chrome/Chromium extension page owns the toolbar and sends narrowly scoped editor commands.
  window.addEventListener("message", event => {
    if (isFirefox || window.parent === window || event.source !== window.parent || !extensionOrigin || event.origin !== extensionOrigin) return;
    const message = event.data;
    if (!message || !["KEEPIT_AI_FILL", "KEEPIT_AI_CLEAR", "KEEPIT_AI_FOCUS"].includes(message.type)) return;
    if (message.providerId !== currentProvider.id) return;
    void (async () => {
      let result;
      if (message.type === "KEEPIT_AI_FILL") result = await fill(String(message.text ?? ""), { requestId:message.requestId, focus:true });
      else {
        const editor = findEditor() || await waitForEditor();
        const ok = message.type === "KEEPIT_AI_CLEAR" ? clearEditor(editor) : focusAtEnd(editor);
        result = { ok:!!ok, requestId:String(message.requestId || ""), providerId:currentProvider.id };
      }
      try { event.source.postMessage({ type:"KEEPIT_AI_RESULT", ...result }, extensionOrigin); } catch {}
    })();
  });

  let firefoxPanelActive = false;
  let toolbar = null;
  let activeSourceUrl = "";
  let lastNavigationRequestId = "";

  function readPanelMarkers() {
    try {
      const hash = new URLSearchParams(location.hash.replace(/^#/, ""));
      return {
        marked:hash.get(AI_PANEL_MARKER) === "1" || hash.get(CHATGPT_PANEL_MARKER) === "1",
        sourceUrl:safeSourceUrl(hash.get(AI_SOURCE_MARKER) || hash.get(CHATGPT_SOURCE_MARKER))
      };
    } catch { return { marked:false, sourceUrl:"" }; }
  }

  function panelUrl(provider, sourceUrl, request = null) {
    const url = new URL(provider.startUrl);
    const params = new URLSearchParams(url.hash.replace(/^#/, ""));
    if (provider.id === "chatgpt") {
      params.set(CHATGPT_PANEL_MARKER, "1");
      params.set(CHATGPT_CLEAR_MARKER, "1");
      if (sourceUrl) params.set(CHATGPT_SOURCE_MARKER, sourceUrl);
      else params.delete(CHATGPT_SOURCE_MARKER);
      if (request?.linkRequestId) params.set(CHATGPT_LINK_MARKER, String(request.linkRequestId));
    } else {
      params.set(AI_PANEL_MARKER, "1");
      if (sourceUrl) params.set(AI_SOURCE_MARKER, sourceUrl);
      else params.delete(AI_SOURCE_MARKER);
      if (request?.linkRequestId) params.set("keepit-ai-link-request", String(request.linkRequestId));
    }
    url.hash = params.toString();
    return url.href;
  }

  async function reportProviderSelection(providerId) {
    try { await globalThis.browser?.runtime?.sendMessage?.({ type:"AI_PANEL_PROVIDER_SELECTED", providerId }); }
    catch { /* The local route still switches if the worker is waking. */ }
  }

  async function selectFirefoxProvider(providerId) {
    const provider = providers.get(providerId);
    if (!provider || provider.id === currentProvider.id) return;
    await reportProviderSelection(provider.id);
    const target = panelUrl(provider, activeSourceUrl);
    location.replace(target);
  }

  async function firefoxPanelIsOpen() {
    if (!isFirefox || window.top !== window || !globalThis.browser?.runtime?.sendMessage) return false;
    try {
      const state = await browser.runtime.sendMessage({ type:"AI_PANEL_CONTEXT_READY" });
      return state?.open === true;
    } catch { return false; }
  }

  async function removePendingIfSame(requestId) {
    if (!requestId) return;
    try {
      const latest = await browser.storage.local.get(LINK_PENDING_KEY);
      if (latest?.[LINK_PENDING_KEY]?.requestId === requestId) await browser.storage.local.remove(LINK_PENDING_KEY);
    } catch {}
  }

  async function processFirefoxNavigation(request) {
    if (!isFirefox || !firefoxPanelActive || !request) return false;
    const requestExpiresAt = Number(request.expiresAt);
    if (!Number.isFinite(requestExpiresAt) || requestExpiresAt <= Date.now()) {
      try {
        const latest = await browser.storage.local.get(NAVIGATION_KEY);
        if (latest?.[NAVIGATION_KEY]?.requestId === request.requestId) await browser.storage.local.remove(NAVIGATION_KEY);
      } catch {}
      await removePendingIfSame(String(request.linkRequestId || ""));
      return false;
    }
    if (request.requestId === lastNavigationRequestId) return false;
    const provider = providers.get(request.providerId || "chatgpt");
    if (!provider || provider.id === "chatgpt") return false;
    const latest = await browser.storage.local.get(NAVIGATION_KEY);
    if (latest?.[NAVIGATION_KEY]?.requestId !== request.requestId) return true;
    lastNavigationRequestId = request.requestId;
    const sourceUrl = safeSourceUrl(request.sourceUrl) || activeSourceUrl;
    toolbar?.setSourceUrl(sourceUrl);
    activeSourceUrl = sourceUrl;
    if (provider.id !== currentProvider.id) {
      await reportProviderSelection(provider.id);
      location.replace(panelUrl(provider, sourceUrl, request));
      return true;
    }
    const pendingId = String(request.linkRequestId || "");
    if (pendingId && ["new-link", "followup"].includes(request.mode)) {
      const stored = await browser.storage.local.get(LINK_PENDING_KEY);
      const pending = stored?.[LINK_PENDING_KEY];
      const pendingExpiresAt = Number(pending?.expiresAt);
      if (pending?.requestId === pendingId && pending.providerId === provider.id && typeof pending.prompt === "string"
        && Number.isFinite(pendingExpiresAt) && pendingExpiresAt > Date.now()) {
        const result = await fill(pending.prompt, { requestId:pendingId, focus:true });
        if (result.ok) await removePendingIfSame(pendingId);
        else {
          lastNavigationRequestId = "";
          setTimeout(() => { void processFirefoxNavigation(request); }, 1800);
          return true;
        }
      } else if (pending?.requestId === pendingId) {
        await removePendingIfSame(pendingId);
      }
    } else if (request.mode === "context-switch" && sourceUrl) {
      const editor = findEditor() || await waitForEditor(5000);
      if (editor) clearEditor(editor);
    }
    try {
      const current = await browser.storage.local.get(NAVIGATION_KEY);
      if (current?.[NAVIGATION_KEY]?.requestId === request.requestId) await browser.storage.local.remove(NAVIGATION_KEY);
    } catch {}
    return true;
  }

  async function initializeFirefoxToolbar() {
    if (!isFirefox || window.top !== window) return;
    const markers = readPanelMarkers();
    let hasSessionMarker = false;
    try { hasSessionMarker = sessionStorage.getItem(AI_PANEL_MARKER) === "1" || sessionStorage.getItem(CHATGPT_PANEL_MARKER) === "1"; } catch {}
    const hasExtensionReferrer = !!extensionRoot && document.referrer.startsWith(extensionRoot);
    if (!markers.marked && !hasSessionMarker && !hasExtensionReferrer) return;
    const panelOpen = await firefoxPanelIsOpen();
    if (!panelOpen) return;
    try { sessionStorage.setItem(AI_PANEL_MARKER, "1"); } catch {}
    firefoxPanelActive = true;
    if (!document.body) await new Promise(resolve => document.addEventListener("DOMContentLoaded", resolve, { once:true }));
    activeSourceUrl = markers.sourceUrl;
    if (!activeSourceUrl) {
      try { activeSourceUrl = safeSourceUrl(sessionStorage.getItem(AI_SOURCE_SESSION_KEY)); } catch {}
    }
    if (!activeSourceUrl) {
      try {
        const windowInfo = await browser.windows.getCurrent();
        const stored = await browser.storage.session?.get?.(["keepitChatGPTPanelSourceUrlByWindow", PROVIDER_BY_WINDOW_KEY]);
        const windowId = windowInfo?.id;
        const sourceByWindow = stored?.keepitChatGPTPanelSourceUrlByWindow || {};
        activeSourceUrl = safeSourceUrl(sourceByWindow[String(windowId)]);
        if (!activeSourceUrl) activeSourceUrl = "";
      } catch {}
    }
    toolbar = globalThis.LHN_AI_TOOLBAR?.create({
      sourceUrl:activeSourceUrl,
      initialProvider:currentProvider.id,
      onProviderChange:providerId => { void selectFirefoxProvider(providerId); }
    }) || null;
    try {
      const stored = await browser.storage.local.get(NAVIGATION_KEY);
      if (stored?.[NAVIGATION_KEY]) await processFirefoxNavigation(stored[NAVIGATION_KEY]);
    } catch {}
  }

  if (isFirefox && window.top === window) {
    void initializeFirefoxToolbar();
    browser.storage?.onChanged?.addListener?.((changes, areaName) => {
      if (areaName !== "local" || !changes?.[NAVIGATION_KEY]?.newValue) return;
      void processFirefoxNavigation(changes[NAVIGATION_KEY].newValue);
    });
    window.addEventListener("pagehide", () => {
      if (firefoxPanelActive) void browser.runtime.sendMessage({ type:"AI_PANEL_MAYBE_CLOSED" }).catch(() => {});
    }, { once:true });
  }
})();
