// AI page composer (ChatGPT, Gemini, Claude; editor helpers also load on Grok).
// Owns: panel marker capture, composer/send/new-chat element access via the provider adapter,
// live route reporting to the Chromium panel host, and the Firefox in-page toolbar.
// The Send/link/mapping flow itself lives in page/send-flow.js.
(() => {
  "use strict";

  const providers = globalThis.LHN_AI_PROVIDERS;
  if (!providers) return;
  const provider = providers.fromHost(location.hostname);
  if (!provider) return;
  const isFirefox = /Firefox\//i.test(globalThis.navigator?.userAgent || "");
  const isRootFrame = isFirefox ? window.top === window : window.parent === window.top;
  if (!isRootFrame) return;

  const PANEL_SOURCE_URLS_KEY = "keepitAiPanelSourceUrlByWindow";
  const SESSION_KEYS = Object.freeze({
    panel:"keepitAiPanelMarker",
    sourceUrl:"keepitAiPanelSourceUrl",
    linkRequestId:"keepitAiLinkRequestId",
    clearComposer:"keepitAiClearComposerOnLoad"
  });

  // Capture panel/request markers before the provider application can rewrite its URL fragment.
  function captureMarkers(value = location.href) {
    const markers = providers.readPanelMarkers(value);
    if (!markers.panel && !markers.linkRequestId && !markers.sourceUrl && !markers.clearComposer) return;
    try {
      sessionStorage.setItem(SESSION_KEYS.panel, "1");
      if (markers.linkRequestId) sessionStorage.setItem(SESSION_KEYS.linkRequestId, markers.linkRequestId);
      if (markers.sourceUrl) sessionStorage.setItem(SESSION_KEYS.sourceUrl, markers.sourceUrl);
      if (markers.clearComposer) sessionStorage.setItem(SESSION_KEYS.clearComposer, "1");
    } catch { /* the send flow still reads the live URL/referrer markers */ }
  }
  captureMarkers();
  // Same-route follow-ups update only the one-shot request ID in the fragment.
  window.addEventListener("hashchange", event => captureMarkers(event.newURL || location.href), true);

  function isEnabled(element) {
    return !!element && !element.disabled && element.getAttribute?.("aria-disabled") !== "true";
  }

  function findEditor(root = document) {
    for (const selector of provider.composerSelectors) {
      try {
        const editor = root.querySelector(selector);
        if (isEnabled(editor)) return editor;
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
      if (provider.multilineComposer && text.includes("\n")) {
        try {
          if (globalThis.LHN_AI_PROMPT_FORMAT?.insertMultilineComposerText(editor, text, replaceExisting)) {
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

  function findSendButton() {
    const form = findEditor()?.closest?.("form");
    for (const { scope, selector } of provider.sendButtons) {
      const root = scope === "form" ? form : document;
      if (!root?.querySelector) continue;
      let button = null;
      try { button = root.querySelector(selector); } catch {}
      if (!button) continue;
      if (provider.sendButtonMatch === "first" || isEnabled(button)) return button;
    }
    return null;
  }

  function findNewChatButton() {
    for (const selector of provider.newChatSelectors) {
      try {
        const button = document.querySelector(selector);
        if (button) return button;
      } catch {}
    }
    return null;
  }

  const extensionRoot = globalThis.browser?.runtime?.getURL?.("") || "";
  let extensionOrigin = "";
  try {
    const root = new URL(extensionRoot);
    extensionOrigin = root.host ? `${root.protocol}//${root.host}` : "";
  } catch {}

  // The Chromium panel cannot read this cross-origin URL, so report the live route whenever the
  // provider SPA changes it.
  let lastReportedPanelRoute = null;
  function reportPanelConversation() {
    if (isFirefox || window.parent === window || !extensionOrigin || !providers.isPanelProvider(provider.id)) return;
    const routeUrl = providers.panelRoute(provider.id, location.href);
    if (routeUrl === lastReportedPanelRoute) return;
    lastReportedPanelRoute = routeUrl;
    try {
      window.parent.postMessage({
        type:"KEEPIT_AI_PANEL_CONVERSATION",
        providerId:provider.id,
        conversationUrl:providers.normalizeConversationUrl(provider.id, location.href),
        routeUrl
      }, extensionOrigin);
    } catch { /* The panel may be closing. */ }
  }
  if (!isFirefox && window.parent !== window && extensionOrigin) {
    reportPanelConversation();
    setInterval(reportPanelConversation, 700);
    window.addEventListener("popstate", reportPanelConversation);
    window.addEventListener("hashchange", reportPanelConversation);
    window.addEventListener("load", reportPanelConversation);
  }

  // Firefox shows the provider page itself in the sidebar, so the toolbar is injected here.
  let firefoxPanelActive = false;
  let toolbar = null;
  let activeSourceUrl = "";

  function setSourceUrl(value) {
    activeSourceUrl = providers.normalizeSourceUrl(value);
    toolbar?.setSourceUrl(activeSourceUrl);
    return activeSourceUrl;
  }

  async function reportProviderSelection(providerId) {
    try { await globalThis.browser?.runtime?.sendMessage?.({ type:"AI_PANEL_PROVIDER_SELECTED", providerId }); }
    catch { /* The local route still switches if the worker is waking. */ }
  }

  async function selectFirefoxProvider(providerId) {
    const next = providers.get(providerId);
    if (!next || !providers.isPanelProvider(next.id) || next.id === provider.id) return;
    await reportProviderSelection(next.id);
    let targetUrl = next.startUrl;
    if (activeSourceUrl) {
      try {
        const stored = await browser.storage.local.get(next.conversationMapKey);
        targetUrl = providers.normalizeConversationUrl(next.id, stored?.[next.conversationMapKey]?.[activeSourceUrl]) || next.startUrl;
      } catch {}
    }
    location.replace(providers.panelUrl(next.id, targetUrl, { sourceUrl:activeSourceUrl, clearComposer:true }));
  }

  async function firefoxPanelIsOpen() {
    if (!isFirefox || window.top !== window || !globalThis.browser?.runtime?.sendMessage) return false;
    try {
      const state = await browser.runtime.sendMessage({ type:"AI_PANEL_CONTEXT_READY" });
      return state?.open === true;
    } catch { return false; }
  }

  async function initializeFirefoxToolbar() {
    if (!isFirefox || window.top !== window || !providers.isPanelProvider(provider.id)) return;
    const markers = providers.readPanelMarkers(location.href);
    let hasSessionMarker = false;
    try { hasSessionMarker = sessionStorage.getItem(SESSION_KEYS.panel) === "1"; } catch {}
    const hasExtensionReferrer = !!extensionRoot && document.referrer.startsWith(extensionRoot);
    if (!markers.panel && !hasSessionMarker && !hasExtensionReferrer) return;
    if (!await firefoxPanelIsOpen()) return;
    try { sessionStorage.setItem(SESSION_KEYS.panel, "1"); } catch {}
    firefoxPanelActive = true;
    if (!document.body) await new Promise(resolve => document.addEventListener("DOMContentLoaded", resolve, { once:true }));
    let sourceUrl = markers.sourceUrl;
    if (!sourceUrl) {
      try { sourceUrl = providers.normalizeSourceUrl(sessionStorage.getItem(SESSION_KEYS.sourceUrl)); } catch {}
    }
    if (!sourceUrl) {
      try {
        const windowInfo = await browser.windows.getCurrent();
        const stored = await browser.storage.session?.get?.(PANEL_SOURCE_URLS_KEY);
        sourceUrl = providers.normalizeSourceUrl(stored?.[PANEL_SOURCE_URLS_KEY]?.[String(windowInfo?.id)]);
      } catch {}
    }
    activeSourceUrl = sourceUrl || activeSourceUrl;
    toolbar = globalThis.LHN_AI_TOOLBAR?.create({
      sourceUrl:activeSourceUrl,
      initialProvider:provider.id,
      onProviderChange:providerId => { void selectFirefoxProvider(providerId); }
    }) || null;
  }

  if (isFirefox && window.top === window) {
    void initializeFirefoxToolbar();
    window.addEventListener("pagehide", () => {
      if (firefoxPanelActive) void browser.runtime.sendMessage({ type:"AI_PANEL_MAYBE_CLOSED" }).catch(() => {});
    }, { once:true });
  }

  globalThis.LHN_AI_COMPOSER = Object.freeze({
    provider,
    providerId:provider.id,
    isFirefox,
    SESSION_KEYS,
    findEditor,
    editorText,
    focusAtEnd,
    setEditorText,
    clearEditor,
    waitForEditor,
    findSendButton,
    findNewChatButton,
    setSourceUrl,
    getSourceUrl:() => activeSourceUrl
  });
})();
