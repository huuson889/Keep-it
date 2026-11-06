// AI page composer (ChatGPT, Gemini, Claude; editor helpers also load on Grok).
// Owns: panel marker capture, composer/send/new-chat element access via the provider adapter,
// live route and sign-in page reporting to the AI panel host (same iframe host in Chromium and Firefox).
// The Send/link/mapping flow itself lives in page/send-flow.js.
(() => {
  "use strict";

  const providers = globalThis.LHN_AI_PROVIDERS;
  if (!providers) return;
  const provider = providers.fromHost(location.hostname);
  if (!provider) return;
  // The provider page itself: a normal tab, or the iframe directly inside the AI panel host.
  if (window.parent !== window.top) return;

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

  // The AI panel host (Chromium side panel and Firefox sidebar) cannot read this cross-origin URL,
  // so report the live route whenever the provider SPA changes it.
  const inPanelFrame = window.parent !== window && !!extensionOrigin;
  function isKeepitPanelFrame() {
    if (!inPanelFrame) return false;
    try { if (sessionStorage.getItem(SESSION_KEYS.panel) === "1") return true; } catch {}
    try { if (location.ancestorOrigins?.[0] === extensionOrigin) return true; } catch {}
    return !!extensionRoot && document.referrer.startsWith(extensionRoot);
  }

  function postToPanel(message) {
    try { window.parent.postMessage(message, extensionOrigin); }
    catch { /* The panel may be closing. */ }
  }

  let lastReportedPanelRoute = null;
  function reportPanelConversation() {
    if (!inPanelFrame || !providers.isPanelProvider(provider.id)) return;
    const routeUrl = providers.panelRoute(provider.id, location.href);
    if (routeUrl === lastReportedPanelRoute) return;
    lastReportedPanelRoute = routeUrl;
    postToPanel({
      type:"KEEPIT_AI_PANEL_CONVERSATION",
      providerId:provider.id,
      conversationUrl:providers.normalizeConversationUrl(provider.id, location.href),
      routeUrl
    });
  }

  // AI panel sign-in. Each AI decides whether sign-in is needed; Keepit only reacts by URL:
  // - the user clicks a sign-in link/button here: cancel the in-frame navigation (sign-in pages
  //   refuse embedding) and let the panel open the sign-in page in a new tab;
  // - the AI itself shows its sign-in page here: tell the panel, which offers a button (never opens a tab by itself).
  // - a page that has fully loaded but shows no chat box (and, off chat pages, no New chat button)
  //   for a while: the AI shows its own notice instead (Claude signed out in an embedded view).
  const NO_COMPOSER_MS = 5000; // the AI app is there (New chat button) but its chat box is slow
  const NO_APP_MS = 1200; // neither chat box nor New chat button: the AI's own notice page
  let lastSignInState = null; // each new AI document reports its first state, clearing an old overlay
  let composerCheckRoute = "";
  let composerMissingSince = 0;
  let composerCheckTimer = 0;

  function isChatRoute(url) {
    try {
      const start = new URL(provider.startUrl);
      const trim = path => path.replace(/\/+$/, "") || "/";
      return trim(url.pathname) === trim(start.pathname) || !!provider.conversationPath?.test(url.pathname);
    } catch { return false; }
  }

  // Only element presence/size is checked (a hidden chat box does not count), never the page text.
  function isShown(element) {
    try { return typeof element.getClientRects !== "function" || element.getClientRects().length > 0; }
    catch { return true; }
  }

  function hasShownEditor() {
    for (const selector of provider.composerSelectors) {
      try {
        for (const editor of document.querySelectorAll(selector)) if (isEnabled(editor) && isShown(editor)) return true;
      } catch { /* A provider may change its editor markup between releases. */ }
    }
    return false;
  }

  // The AI app itself: a chat page, or any page with the AI's own New chat button (settings,
  // projects). A page with neither and no chat box is the AI's own notice (Claude signed out in an
  // embedded view), whatever its URL.
  // The AI's own notice banner on a page without its chat box or app (Claude signed out).
  function hasNoticeBanner() {
    for (const selector of provider.noticeSelectors || []) {
      try {
        const banner = document.querySelector(selector);
        if (banner && isShown(banner)) return true;
      } catch {}
    }
    return false;
  }

  // Wait (ms) before reporting, or 0 when the page shows the AI's chat box / app.
  function composerMissingWait(url) {
    if (hasShownEditor()) return 0;
    const appShown = !!findNewChatButton();
    if (!appShown) return NO_APP_MS;
    return isChatRoute(url) ? NO_COMPOSER_MS : 0;
  }

  function composerMissingLongEnough(url) {
    const route = url.origin + url.pathname;
    if (route !== composerCheckRoute) { composerCheckRoute = route; composerMissingSince = 0; }
    if (!hasShownEditor() && !findNewChatButton() && hasNoticeBanner()) return true;
    const wait = document.readyState === "complete" ? composerMissingWait(url) : 0;
    if (!wait) { composerMissingSince = 0; return false; }
    if (!composerMissingSince) composerMissingSince = Date.now();
    const left = wait - (Date.now() - composerMissingSince);
    if (left <= 0) return true;
    // Check again right when the wait ends instead of at the next poll.
    clearTimeout(composerCheckTimer);
    composerCheckTimer = setTimeout(reportLoginPage, left + 20);
    return false;
  }

  function reportLoginPage() {
    if (!providers.isPanelProvider(provider.id) || !inPanelFrame) return;
    let state = "ok";
    try {
      const url = new URL(location.href);
      if (providers.isLoginUrl(provider.id, url.href)) state = "login-page";
      else if (composerMissingLongEnough(url)) state = "no-composer";
    } catch { /* Keep "ok". */ }
    if (state === lastSignInState) return;
    lastSignInState = state;
    postToPanel({ type:"KEEPIT_AI_PANEL_LOGIN", providerId:provider.id, reason:state === "ok" ? "left-login-page" : state });
  }

  function watchLoginNavigation() {
    const navigation = window.navigation;
    if (!providers.isPanelProvider(provider.id) || typeof navigation?.addEventListener !== "function") return;
    navigation.addEventListener("navigate", event => {
      try {
        if (!event.cancelable || event.hashChange || event.downloadRequest) return;
        if (!providers.isLoginUrl(provider.id, String(event.destination?.url || ""))) return;
        // Only a navigation the user just started; an automatic redirect is left to the AI.
        if (event.userInitiated !== true && navigator.userActivation?.isActive !== true) return;
        if (!isKeepitPanelFrame()) return;
        event.preventDefault();
        postToPanel({ type:"KEEPIT_AI_PANEL_LOGIN", providerId:provider.id, reason:"login-click" });
      } catch { /* Leave the navigation to the browser. */ }
    });
  }

  if (inPanelFrame) {
    // Every AI document in the panel says hello; a frame load without it means the frame left the AI
    // (for example to a sign-in page that refuses embedding), and the panel offers a sign-in tab.
    if (providers.isPanelProvider(provider.id)) {
      postToPanel({ type:"KEEPIT_AI_PANEL_HELLO", providerId:provider.id });
      // The panel asks again after each frame load (a load may be only a hash change).
      window.addEventListener("message", event => {
        if (event.source !== window.parent || event.origin !== extensionOrigin || event.data?.type !== "KEEPIT_AI_PANEL_PING") return;
        postToPanel({ type:"KEEPIT_AI_PANEL_HELLO", providerId:provider.id });
      });
    }
    watchLoginNavigation();
    const pollPanelFrame = () => { reportPanelConversation(); reportLoginPage(); };
    pollPanelFrame();
    setInterval(pollPanelFrame, 700);
    // Faster sign-in checks while the page is starting (element lookups only).
    const fastPoll = setInterval(reportLoginPage, 150);
    setTimeout(() => clearInterval(fastPoll), 4000);
    window.addEventListener("popstate", pollPanelFrame);
    window.addEventListener("hashchange", pollPanelFrame);
    window.addEventListener("load", pollPanelFrame);
  }

  // The source URL shown by the panel; the send flow reads it for the label + URL at Send.
  let activeSourceUrl = "";
  function setSourceUrl(value) {
    activeSourceUrl = providers.normalizeSourceUrl(value);
    return activeSourceUrl;
  }

  globalThis.LHN_AI_COMPOSER = Object.freeze({
    provider,
    providerId:provider.id,
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
