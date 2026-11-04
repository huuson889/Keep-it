(async () => {
  const PENDING_KEY = "keepitChatGPTDraftPending";
  const CONVERSATION_KEY = "keepitChatGPTLastConversationUrl";
  const PANEL_MARKER = "keepit-chatgpt-panel";
  const QUERY_REQUEST_KEY = "keepit-chatgpt-query-prefill-request";
  const PROMPT_PREFIX = "Hãy tóm tắt nội dung ngắn gọn";
  const MAX_WAIT_MS = 25000;
  const isFirefox = /Firefox\//i.test(globalThis.navigator?.userAgent || "");
  let url;
  try { url = new URL(location.href); } catch { return; }
  // ChatGPT in an ordinary tab must never read or receive the extension's clipboard draft.
  const initialHashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
  const hasUrlMarker = url.searchParams.get(PANEL_MARKER) === "1" || initialHashParams.get(PANEL_MARKER) === "1";
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

  const normalizedDraft = value => String(value || "").replace(/[\u200b\u2060]/g, "").replace(/\r\n?/g, "\n").replace(/\s+/g, " ").trim();
  const isPreparedDraft = value => typeof value === "string" && value.startsWith(PROMPT_PREFIX) && value.includes("Nội dung chính:");

  function waitForComposerDraft(text, timeoutMs = 1800) {
    return new Promise(resolve => {
      let settled = false;
      let timer;
      const finish = composer => {
        if (settled) return;
        settled = true;
        observer.disconnect();
        clearTimeout(timer);
        resolve(composer);
      };
      const check = () => {
        const composer = findComposer();
        if (composer && normalizedDraft(composerText(composer)) === normalizedDraft(text)) finish(composer);
      };
      const observer = new MutationObserver(check);
      observer.observe(document.documentElement, { childList:true, subtree:true, characterData:true, attributes:true });
      timer = setTimeout(() => finish(null), timeoutMs);
      check();
    });
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
      let composer = await waitForComposer();
      if (!composer) {
        await report(pending, false, "composer-unavailable");
        return;
      }
      let queryDraft = "";
      try { queryDraft = new URL(location.href).searchParams.get("q") || ""; } catch {}
      let queryRequestId = "";
      try { queryRequestId = sessionStorage.getItem(QUERY_REQUEST_KEY) || ""; } catch {}
      if (!queryRequestId) queryRequestId = initialHashParams.get("keepit-chatgpt-prefill") || "";
      let clipboardText = "";
      try { clipboardText = await navigator.clipboard.readText(); }
      catch (error) {
        console.warn("Keepit could not read the prepared ChatGPT draft from the clipboard", error);
        if (!(queryRequestId === pending.requestId && isPreparedDraft(queryDraft))) {
          await report(pending, false, "clipboard-read-failed");
          return;
        }
      }
      if (!isPreparedDraft(clipboardText) && queryRequestId === pending.requestId && isPreparedDraft(queryDraft)) clipboardText = queryDraft;
      if (!isPreparedDraft(clipboardText)) {
        await report(pending, false, "prepared-draft-not-found");
        return;
      }
      const queryMatchesDraft = isPreparedDraft(queryDraft) && queryDraft === clipboardText;
      if (queryMatchesDraft) { try { sessionStorage.setItem(QUERY_REQUEST_KEY, pending.requestId); } catch {} }

      // ChatGPT's q= URL path prefills the composer in Chrome and Firefox. It does not click Send.
      // Remember the request in sessionStorage so a site redirect that strips q= cannot loop.
      if (!queryMatchesDraft && queryRequestId !== pending.requestId) {
        const latestBeforeNavigation = (await browserApi.storage.local.get(PENDING_KEY))?.[PENDING_KEY];
        if (latestBeforeNavigation?.requestId !== pending.requestId) { retryRequested = true; return; }
        if (composerHasText(composer)) {
          await report(pending, false, "composer-not-empty");
          return;
        }
        const nextUrl = new URL(location.href);
        nextUrl.searchParams.set("q", clipboardText);
        const nextHashParams = new URLSearchParams(nextUrl.hash.replace(/^#/, ""));
        nextHashParams.set(PANEL_MARKER, "1");
        nextHashParams.set("keepit-chatgpt-prefill", pending.requestId);
        nextUrl.hash = nextHashParams.toString();
        try { sessionStorage.setItem(QUERY_REQUEST_KEY, pending.requestId); } catch {}
        location.replace(nextUrl.href);
        return;
      }

      if (composerHasText(composer)) {
        if (normalizedDraft(composerText(composer)) === normalizedDraft(clipboardText)) await report(pending, true);
        else await report(pending, false, "composer-not-empty");
        return;
      }
      if (queryMatchesDraft) {
        const queryPrefilledComposer = await waitForComposerDraft(clipboardText);
        if (queryPrefilledComposer) {
          await report(pending, true);
          return;
        }
        composer = findComposer() || composer;
        if (composerHasText(composer)) {
          await report(pending, false, "composer-not-empty");
          return;
        }
      }
      const latest = (await browserApi.storage.local.get(PENDING_KEY))?.[PENDING_KEY];
      if (latest?.requestId !== pending.requestId) { retryRequested = true; return; }
      // Recheck immediately before filling, so an existing user draft is never replaced.
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
