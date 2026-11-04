(async () => {
  const PENDING_KEY = "keepitChatGPTDraftPending";
  const CONVERSATION_KEY = "keepitChatGPTLastConversationUrl";
  const PANEL_MARKER = "keepit-chatgpt-panel";
  const PROMPT_PREFIX = "Hãy tóm tắt nội dung ngắn gọn";
  const MAX_WAIT_MS = 25000;
  const isFirefox = /Firefox\//i.test(globalThis.navigator?.userAgent || "");
  let url;
  try { url = new URL(location.href); } catch { return; }
  // ChatGPT in an ordinary tab must never read or receive the extension's clipboard draft.
  const hasUrlMarker = url.searchParams.get(PANEL_MARKER) === "1" || url.hash === `#${PANEL_MARKER}=1`;
  let hasSessionMarker = false;
  try {
    hasSessionMarker = sessionStorage.getItem(PANEL_MARKER) === "1";
    if (hasUrlMarker) sessionStorage.setItem(PANEL_MARKER, "1");
  } catch { /* restricted storage still allows the explicit URL marker */ }
  const extensionRoot = globalThis.browser?.runtime?.getURL?.("") || "";
  const hasExtensionReferrer = !!extensionRoot && document.referrer.startsWith(extensionRoot);
  if (hasExtensionReferrer && !hasSessionMarker) { try { sessionStorage.setItem(PANEL_MARKER, "1"); hasSessionMarker = true; } catch {} }
  if ((!hasUrlMarker && !hasSessionMarker && !hasExtensionReferrer) || (!isFirefox && window.top === window)) return;
  const browserApi = globalThis.browser;
  if (!browserApi?.storage?.local || !globalThis.LHN_MESSAGING?.sendMessage) return;
  if (isFirefox) {
    globalThis.LHN_MESSAGING.sendMessage({ type:"CHATGPT_PANEL_CONTEXT_READY" }).catch(() => {});
  }

  let processing = false;
  let retryRequested = false;
  let lastRequestId = "";

  function findComposer() {
    return document.querySelector("#prompt-textarea")
      || document.querySelector('[contenteditable="true"][data-testid="prompt-textarea"]')
      || document.querySelector('textarea[placeholder*="Message" i]')
      || document.querySelector('textarea[aria-label*="Message" i]');
  }

  function composerText(composer) {
    return String(composer?.isContentEditable ? composer.innerText || composer.textContent : composer?.value || "").replace(/[\u200b\u2060]/g, "");
  }

  function composerHasText(composer) {
    return /[^\s]/.test(composerText(composer));
  }

  function waitForComposer() {
    const initial = findComposer();
    if (initial) return Promise.resolve(initial);
    return new Promise(resolve => {
      let settled = false;
      const finish = value => {
        if (settled) return;
        settled = true;
        observer.disconnect();
        clearTimeout(timer);
        resolve(value);
      };
      const observer = new MutationObserver(() => {
        const composer = findComposer();
        if (composer) finish(composer);
      });
      observer.observe(document.documentElement, { childList:true, subtree:true });
      const timer = setTimeout(() => finish(null), MAX_WAIT_MS);
    });
  }

  function insertDraft(composer, text) {
    composer.focus();
    if (composer.isContentEditable) {
      let inserted = false;
      try { inserted = document.execCommand("insertText", false, text); } catch { /* use the safe empty-editor fallback */ }
      if (!inserted || composerText(composer) !== text.trim()) {
        composer.textContent = text;
        composer.dispatchEvent(new InputEvent("input", { bubbles:true, inputType:"insertText", data:text }));
      }
    } else {
      const proto = Object.getPrototypeOf(composer);
      const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
      if (setter) setter.call(composer, text); else composer.value = text;
      composer.dispatchEvent(new InputEvent("input", { bubbles:true, inputType:"insertText", data:text }));
      composer.dispatchEvent(new Event("change", { bubbles:true }));
    }
    return composerText(composer) === text.trim();
  }

  async function report(pending, ok, reason = "") {
    try {
      await globalThis.LHN_MESSAGING.sendMessage({
        type:"CHATGPT_AUTOFILL_RESULT",
        requestId:pending?.requestId || "",
        ok:!!ok,
        reason
      });
    } catch (error) { console.warn("Keepit could not report the ChatGPT draft result", error); }
  }

  let lastConversationUrl = "";
  async function rememberCurrentConversation() {
    try {
      const current = new URL(location.href);
      if (!['chatgpt.com', 'chat.openai.com'].includes(current.hostname) || !/\/c\/[A-Za-z0-9_-]{8,}(?:\/|$)/i.test(current.pathname)) return;
      const conversationUrl = `${current.origin}${current.pathname}`;
      if (conversationUrl === lastConversationUrl) return;
      lastConversationUrl = conversationUrl;
      await browserApi.storage.local.set({ [CONVERSATION_KEY]:conversationUrl });
    } catch (error) { lastConversationUrl = ""; console.warn("Keepit could not remember the ChatGPT conversation route", error); }
  }

  async function processPendingDraft() {
    if (processing) { retryRequested = true; return; }
    processing = true;
    let pending = null;
    try {
      const stored = await browserApi.storage.local.get(PENDING_KEY);
      pending = stored?.[PENDING_KEY];
      if (!pending || !pending.requestId || pending.requestId === lastRequestId) return;
      lastRequestId = pending.requestId;
      if (!Number.isFinite(pending.expiresAt) || pending.expiresAt < Date.now()) {
        await report(pending, false, "draft-expired");
        return;
      }
      const composer = await waitForComposer();
      if (!composer) {
        await report(pending, false, "composer-unavailable");
        return;
      }
      // Never replace text that the user has already typed in ChatGPT.
      if (composerHasText(composer)) {
        await report(pending, false, "composer-not-empty");
        return;
      }
      let clipboardText = "";
      try { clipboardText = await navigator.clipboard.readText(); }
      catch (error) {
        console.warn("Keepit could not read the prepared ChatGPT draft from the clipboard", error);
        await report(pending, false, "clipboard-read-failed");
        return;
      }
      if (!clipboardText.startsWith(PROMPT_PREFIX) || !clipboardText.includes("Nội dung chính:")) {
        await report(pending, false, "prepared-draft-not-found");
        return;
      }
      const latest = (await browserApi.storage.local.get(PENDING_KEY))?.[PENDING_KEY];
      if (latest?.requestId !== pending.requestId) { retryRequested = true; return; }
      // Recheck after clipboard access in case the user started typing meanwhile.
      if (composerHasText(composer)) {
        await report(pending, false, "composer-not-empty");
        return;
      }
      const inserted = insertDraft(composer, clipboardText);
      await report(pending, inserted, inserted ? "" : "composer-insert-failed");
    } catch (error) {
      console.warn("Keepit could not fill the ChatGPT draft", error);
      if (pending) await report(pending, false, "autofill-failed");
    } finally {
      processing = false;
      if (retryRequested) { retryRequested = false; queueMicrotask(() => void processPendingDraft()); }
    }
  }

  browserApi.storage.onChanged?.addListener((changes, areaName) => {
    if (areaName === "local" && changes?.[PENDING_KEY]?.newValue) void processPendingDraft();
  });
  const pollPanel = () => {
    if (document.visibilityState === "hidden") return;
    void rememberCurrentConversation();
    if (!processing) void processPendingDraft();
  };
  void rememberCurrentConversation();
  void processPendingDraft();
  const panelPollTimer = setInterval(pollPanel, 1200);
  let lastObservedHref = location.href;
  const routeObserver = new MutationObserver(() => {
    const currentHref = location.href;
    if (currentHref !== lastObservedHref) { lastObservedHref = currentHref; void rememberCurrentConversation(); }
  });
  routeObserver.observe(document.documentElement, { childList:true, subtree:true });
  const rememberAfterNavigation = () => { lastObservedHref = location.href; void rememberCurrentConversation(); };
  document.addEventListener("visibilitychange", pollPanel);
  window.addEventListener("popstate", rememberAfterNavigation);
  window.addEventListener("hashchange", rememberAfterNavigation);
  window.addEventListener("pagehide", () => { clearInterval(panelPollTimer); routeObserver.disconnect(); }, { once:true });
})();
