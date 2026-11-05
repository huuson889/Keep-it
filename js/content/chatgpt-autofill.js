(async () => {
  const PENDING_KEY = "keepitChatGPTDraftPending"; // Legacy v3.5.60 draft flow; kept but no longer invoked.
  const LINK_PENDING_KEY = "keepitChatGPTLinkPending";
  const PANEL_NAVIGATION_KEY = "keepitChatGPTPanelNavigationRequest";
  const PANEL_MARKER = "keepit-chatgpt-panel";
  const LINK_REQUEST_MARKER = "keepit-chatgpt-link-request";
  const SOURCE_URL_MARKER = "keepit-chatgpt-source-url";
  const CLEAR_COMPOSER_MARKER = "keepit-chatgpt-clear-composer";
  const CLEAR_COMPOSER_SESSION_KEY = "keepitChatGPTClearComposerOnLoad";
  const SOURCE_URL_SESSION_KEY = "keepitChatGPTPanelSourceUrl";
  const LINK_SESSION_KEY = "keepitChatGPTLinkRequestId";
  const LINK_DIRECT_SESSION_KEY = "keepitChatGPTDirectFollowupRequestId";
  const LINK_Q_SESSION_KEY = "keepitChatGPTLinkQRequestId";
  const LINK_SENT_SESSION_KEY = "keepitChatGPTLinkSentRequestId";
  const LINK_PREPARED_SESSION_KEY = "keepitChatGPTPreparedRequestId";
  const LINK_DRAFT_MANUAL_SEND_SESSION_KEY = "keepitChatGPTDraftManualSendRequestId";
  const QUERY_REQUEST_KEY = "keepit-chatgpt-query-prefill-request";
  const PROMPT_PREFIX = "Hãy tóm tắt nội dung ngắn gọn";
  const LINK_PROMPT_PREFIX = "Hãy tóm tắt bài sau:";
  const MAX_WAIT_MS = 25000;
  const isFirefox = /Firefox\//i.test(globalThis.navigator?.userAgent || "");
  const isChatGPTPanelRoot = isFirefox ? window.top === window : window.parent === window.top;
  let url;
  try { url = new URL(location.href); } catch { return; }
  // ChatGPT in an ordinary tab must never read or receive the extension's clipboard draft.
  const initialHashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
  const hasUrlMarker = url.searchParams.get(PANEL_MARKER) === "1" || initialHashParams.get(PANEL_MARKER) === "1";
  const initialLinkRequestId = initialHashParams.get(LINK_REQUEST_MARKER) || "";
  const safeSourceUrl = value => {
    try { const parsed = new URL(String(value || "")); return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : ""; }
    catch { return ""; }
  };
  let activeSourceUrl = safeSourceUrl(initialHashParams.get(SOURCE_URL_MARKER));
  let clearComposerOnPanelLoad = isChatGPTPanelRoot && initialHashParams.get(CLEAR_COMPOSER_MARKER) === "1";
  let hasSessionMarker = false;
  try {
    hasSessionMarker = sessionStorage.getItem(PANEL_MARKER) === "1";
    if (isChatGPTPanelRoot) {
      clearComposerOnPanelLoad = clearComposerOnPanelLoad || sessionStorage.getItem(CLEAR_COMPOSER_SESSION_KEY) === "1";
      sessionStorage.removeItem(CLEAR_COMPOSER_SESSION_KEY);
    }
    if (!activeSourceUrl) activeSourceUrl = safeSourceUrl(sessionStorage.getItem(SOURCE_URL_SESSION_KEY));
    if (hasUrlMarker) sessionStorage.setItem(PANEL_MARKER, "1");
    if (activeSourceUrl) sessionStorage.setItem(SOURCE_URL_SESSION_KEY, activeSourceUrl);
    if (initialLinkRequestId) sessionStorage.setItem(LINK_SESSION_KEY, initialLinkRequestId);
  } catch { /* restricted storage still allows the explicit URL marker */ }
  const extensionRoot = globalThis.browser?.runtime?.getURL?.("") || "";
  function extensionMessageOrigin() {
    try {
      const parsed = new URL(extensionRoot);
      return parsed.host ? `${parsed.protocol}//${parsed.host}` : "";
    } catch { return ""; }
  }
  const hasExtensionReferrer = !!extensionRoot && document.referrer.startsWith(extensionRoot);
  if (hasExtensionReferrer && !hasSessionMarker) { try { sessionStorage.setItem(PANEL_MARKER, "1"); hasSessionMarker = true; } catch {} }
  if ((!hasUrlMarker && !hasSessionMarker && !hasExtensionReferrer) || (!isFirefox && window.top === window)) return;
  const browserApi = globalThis.browser;
  if (!browserApi?.storage?.local || !globalThis.LHN_MESSAGING?.sendMessage) return;
  const chatGPTToolbar = globalThis.LHN_CHATGPT_AI_TOOLBAR?.create({ sourceUrl:activeSourceUrl });
  if (isFirefox) {
    globalThis.LHN_MESSAGING.sendMessage({ type:"CHATGPT_PANEL_CONTEXT_READY" }).catch(() => {});
  }

  let processing = false;
  let retryRequested = false;
  let lastRequestId = "";

  function findComposer() {
    return document.querySelector("#prompt-textarea")
      || document.querySelector('[contenteditable="true"][data-testid="prompt-textarea"]')
      || document.querySelector('[contenteditable="true"][role="textbox"][aria-label*="ChatGPT" i]')
      || document.querySelector('[contenteditable="true"][role="textbox"]')
      || document.querySelector('textarea[placeholder*="Message" i]')
      || document.querySelector('textarea[aria-label*="Message" i]');
  }

  function composerText(composer) {
    return String(composer?.isContentEditable ? composer.innerText || composer.textContent : composer?.value || "").replace(/[\u200b\u2060]/g, "");
  }

  function composerHasText(composer) {
    return /[^\s]/.test(composerText(composer));
  }

  // The side-panel host updates the source context and wakes same-route follow-ups.
  window.addEventListener("message", event => {
    // Chrome may expose MessageEvent.source as null for messages sent by extension pages.
    if (window.top === window || (event.source !== window.parent && event.source !== null)) return;
    const extensionOrigin = extensionMessageOrigin();
    if (!extensionOrigin || event.origin !== extensionOrigin) return;
    if (event.data?.type === "KEEPIT_CHATGPT_PANEL_SOURCE_CONTEXT") {
      activeSourceUrl = safeSourceUrl(event.data.sourceUrl);
      chatGPTToolbar?.setSourceUrl(activeSourceUrl);
      try { if (activeSourceUrl) sessionStorage.setItem(SOURCE_URL_SESSION_KEY, activeSourceUrl); } catch {}
      void reportPanelRouteContext(currentPanelRouteUrl());
      return;
    }
    if (event.data?.type === "KEEPIT_CHATGPT_PANEL_FOLLOWUP_REQUEST" && typeof event.data.requestId === "string" && event.data.requestId) {
      try {
        sessionStorage.setItem(LINK_DIRECT_SESSION_KEY, event.data.requestId);
        sessionStorage.setItem(LINK_SESSION_KEY, event.data.requestId);
      } catch {}
      void processPendingLink();
    }
  });

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

  function insertDraft(composer, text, replaceExisting = false) {
    composer.focus();
    if (composer.isContentEditable) {
      if (replaceExisting && !String(text).includes("\n")) {
        try {
          const selection = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents(composer);
          selection?.removeAllRanges();
          selection?.addRange(range);
        } catch { /* the textContent fallback below still replaces the draft */ }
      }
      if (String(text).includes("\n")) {
        // Drafts and the manual-send fallback use the same shared two-line formatter/rendering.
        // The new-chat ?q= path serializes the exact same formatted string.
        let inserted = false;
        try {
          inserted = globalThis.LHN_CHATGPT_PROMPT_FORMAT?.insertMultilineComposerText(composer, text, replaceExisting) === true;
        } catch { /* use the safe editor fallback below */ }
        if (!inserted) {
          composer.textContent = text;
          composer.dispatchEvent(new InputEvent("input", { bubbles:true, inputType:"insertText", data:text }));
        }
      } else {
        let inserted = false;
        try { inserted = document.execCommand("insertText", false, text); } catch { /* use the safe editor fallback */ }
        if (!inserted || composerText(composer) !== text.trim()) {
          composer.textContent = text;
          composer.dispatchEvent(new InputEvent("input", { bubbles:true, inputType:"insertText", data:text }));
        }
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

  function clearComposerText(composer) {
    if (!composer) return false;
    insertDraft(composer, "", true);
    if (composerHasText(composer)) {
      if (composer.isContentEditable) {
        composer.textContent = "";
        try { composer.dispatchEvent(new InputEvent("input", { bubbles:true, inputType:"deleteContentBackward", data:null })); }
        catch { composer.dispatchEvent(new Event("input", { bubbles:true })); }
      } else {
        const proto = Object.getPrototypeOf(composer);
        const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
        if (setter) setter.call(composer, ""); else composer.value = "";
        try { composer.dispatchEvent(new InputEvent("input", { bubbles:true, inputType:"deleteContentBackward", data:null })); }
        catch { composer.dispatchEvent(new Event("input", { bubbles:true })); }
        composer.dispatchEvent(new Event("change", { bubbles:true }));
      }
    }
    return !composerHasText(composer);
  }

  let panelLoadComposerClearPromise = null;
  async function clearStaleComposerForPanelLoad() {
    if (!clearComposerOnPanelLoad) return;
    if (!panelLoadComposerClearPromise) {
      panelLoadComposerClearPromise = (async () => {
        const stored = await browserApi.storage.local.get(LINK_PENDING_KEY);
        const pending = stored?.[LINK_PENDING_KEY];
        const composer = findComposer() || await waitForLinkComposer(6000);
        if (!composer || !composerHasText(composer)) return;
        let currentUrl = null;
        try { currentUrl = new URL(location.href); } catch {}
        const activeRequestId = activeLinkRequestId();
        const pendingIsCurrent = pending?.requestId && pending.expiresAt > Date.now()
          && safeSourceUrl(pending.sourceUrl) === activeSourceUrl
          && activeRequestId === pending.requestId;
        const expectedPrompt = normalizedDraft(pending?.prompt || "");
        if (pendingIsCurrent && expectedPrompt && normalizedDraft(composerText(composer)) === expectedPrompt) return;
        if (pendingIsCurrent && pending.mode === "auto-send-link" && currentUrl?.searchParams.get("q") === pending.prompt) {
          const queryComposer = await waitForComposerDraft(pending.prompt, 2200);
          if (queryComposer) return;
        }
        clearComposerText(findComposer() || composer);
      })().catch(error => console.warn("Keepit could not clear a stale ChatGPT composer draft", error));
    }
    await panelLoadComposerClearPromise;
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

  function notifyPanelHostConversation(conversationUrl) {
    if (window.top === window) return;
    try {
      const extensionOrigin = extensionMessageOrigin();
      if (!extensionOrigin) return;
      window.parent.postMessage({ type:"KEEPIT_CHATGPT_PANEL_CONVERSATION", conversationUrl:String(conversationUrl || ""), routeUrl:currentPanelRouteUrl() }, extensionOrigin);
    } catch {}
  }

  function currentPanelRouteUrl() {
    try {
      const current = new URL(location.href);
      if (!["chatgpt.com", "chat.openai.com"].includes(current.hostname)) return "";
      if (/^\/c\/[A-Za-z0-9_-]{8,}(?:\/|$)/i.test(current.pathname)) return `${current.origin}${current.pathname.replace(/\/$/, "")}`;
      return `${current.origin}/`;
    } catch { return ""; }
  }

  let lastConversationUrl = "";
  let lastReportedRouteContext = "";
  let pendingRouteContextKey = "";
  function reportPanelRouteContext(routeUrl) {
    const sourceUrl = safeSourceUrl(activeSourceUrl);
    const route = String(routeUrl || "");
    if (!sourceUrl || !route) return;
    const key = `${sourceUrl}\n${route}`;
    if (key === lastReportedRouteContext || key === pendingRouteContextKey) return;
    pendingRouteContextKey = key;
    void globalThis.LHN_MESSAGING.sendMessage({ type:"CHATGPT_PANEL_ROUTE_CONTEXT", sourceUrl, chatUrl:route })
      .then(response => { if (response?.ok && pendingRouteContextKey === key) lastReportedRouteContext = key; })
      .catch(() => {})
      .finally(() => { if (pendingRouteContextKey === key) pendingRouteContextKey = ""; });
  }

  async function rememberCurrentConversation() {
    try {
      const current = new URL(location.href);
      if (!["chatgpt.com", "chat.openai.com"].includes(current.hostname)) return;
      const isConversation = /^\/c\/[A-Za-z0-9_-]{8,}(?:\/|$)/i.test(current.pathname);
      const conversationUrl = isConversation ? `${current.origin}${current.pathname.replace(/\/$/, "")}` : "";
      if (conversationUrl !== lastConversationUrl) {
        lastConversationUrl = conversationUrl;
        notifyPanelHostConversation(conversationUrl);
      }
      reportPanelRouteContext(isConversation ? conversationUrl : `${current.origin}/`);
    } catch (error) { lastConversationUrl = ""; console.warn("Keepit could not report the ChatGPT panel route", error); }
  }

  // Legacy v3.5.60 clipboard/body-text autofill kept only for rollback; no current trigger calls it.
  async function processPendingDraftLegacy() {
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
      if (retryRequested) { retryRequested = false; queueMicrotask(() => void processPendingDraftLegacy()); }
    }
  }

  let linkProcessing = false;
  let linkRetryRequested = false;
  let lastLinkAttemptId = "";
  let stagedDraftLinkPending = null;

  function activeLinkRequestId() {
    const currentHash = new URLSearchParams(String(location.hash || "").replace(/^#/, ""));
    const fromHash = currentHash.get(LINK_REQUEST_MARKER) || "";
    if (fromHash) {
      try { sessionStorage.setItem(LINK_SESSION_KEY, fromHash); } catch {}
      return fromHash;
    }
    try { return sessionStorage.getItem(LINK_SESSION_KEY) || initialLinkRequestId; }
    catch { return initialLinkRequestId; }
  }

  function currentConversationUrl() {
    try {
      const current = new URL(location.href);
      if (!["chatgpt.com", "chat.openai.com"].includes(current.hostname)) return "";
      if (!/^\/c\/[A-Za-z0-9_-]+(?:\/|$)/.test(current.pathname)) return "";
      current.search = "";
      current.hash = "";
      return current.href;
    } catch { return ""; }
  }

  function canonicalConversationUrl(value) {
    try {
      const target = new URL(String(value || ""));
      if (target.protocol !== "https:" || !["chatgpt.com", "chat.openai.com"].includes(target.hostname) || !/^\/c\/[A-Za-z0-9_-]+(?:\/|$)/.test(target.pathname)) return "";
      return `${target.origin}${target.pathname.replace(/\/+$/, "")}`;
    } catch { return ""; }
  }

  function waitForConversationRoute(timeoutMs = 12000) {
    return new Promise(resolve => {
      const started = Date.now();
      const timer = setInterval(() => {
        const conversationUrl = currentConversationUrl();
        if (conversationUrl || Date.now() - started >= timeoutMs) {
          clearInterval(timer);
          resolve(conversationUrl);
        }
      }, 150);
    });
  }

  function markManualDraftLinkSend(event) {
    const pending = stagedDraftLinkPending;
    if (!pending || pending.mode !== "draft-link" || pending.expiresAt <= Date.now() || safeSourceUrl(pending.sourceUrl) !== activeSourceUrl) return;
    const composer = findComposer();
    if (!composer || !composerHasText(composer) || currentConversationUrl()) return;
    if (event.type === "submit" && !event.target?.contains?.(composer)) return;
    if (event.type === "keydown" && (event.key !== "Enter" || event.shiftKey || event.isComposing || event.keyCode === 229 || !composer.contains?.(event.target))) return;
    if (event.type === "click") {
      const button = event.target?.closest?.("button");
      if (!button || button !== findSendButton()) return;
    }
    try {
      if (sessionStorage.getItem(LINK_PREPARED_SESSION_KEY) !== pending.requestId) return;
      sessionStorage.setItem(LINK_DRAFT_MANUAL_SEND_SESSION_KEY, pending.requestId);
    } catch { return; }
  }
  document.addEventListener("submit", markManualDraftLinkSend, true);
  document.addEventListener("click", markManualDraftLinkSend, true);
  document.addEventListener("keydown", markManualDraftLinkSend, true);

  function waitForLinkComposer(timeoutMs = 16000) {
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
      observer.observe(document.documentElement, { childList:true, subtree:true, characterData:true });
      const timer = setTimeout(() => finish(null), timeoutMs);
    });
  }

  function findSendButton() {
    const composerForm = findComposer()?.closest("form");
    return document.querySelector('button[data-testid="send-button"]')
      || document.querySelector('button[aria-label*="Send prompt" i]')
      || document.querySelector('button[aria-label="Send" i]')
      || composerForm?.querySelector('button[aria-label*="Gửi" i], button[type="submit"]')
      || document.querySelector('button[aria-label="Gửi" i]');
  }

  async function waitForEnabledSendButton(timeoutMs = 9000) {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      const button = findSendButton();
      if (button && !button.disabled && button.getAttribute("aria-disabled") !== "true") return button;
      await new Promise(resolve => setTimeout(resolve, 120));
    }
    return null;
  }

  function findNewChatButton() {
    return document.querySelector('button[data-testid="create-new-chat-button"]')
      || document.querySelector('a[data-testid="create-new-chat-button"]')
      || document.querySelector('button[aria-label*="New chat" i]')
      || document.querySelector('a[aria-label*="New chat" i]');
  }

  async function waitForNewChatRoute(timeoutMs = 6000) {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      if (!currentConversationUrl()) return true;
      await new Promise(resolve => setTimeout(resolve, 150));
    }
    return !currentConversationUrl();
  }

  function clearRequestSessionData(requestId) {
    if (!requestId) return;
    try {
      for (const key of [LINK_SESSION_KEY, LINK_DIRECT_SESSION_KEY, LINK_Q_SESSION_KEY, LINK_SENT_SESSION_KEY, LINK_PREPARED_SESSION_KEY, LINK_DRAFT_MANUAL_SEND_SESSION_KEY, QUERY_REQUEST_KEY]) {
        if (sessionStorage.getItem(key) === requestId) sessionStorage.removeItem(key);
      }
    } catch {}
  }

  async function reportLinkResult(pending, ok, conversationUrl = "", reason = "") {
    try {
      await globalThis.LHN_MESSAGING.sendMessage({
        type:"CHATGPT_LINK_RESULT",
        requestId:pending?.requestId || "",
        ok:!!ok,
        conversationUrl:conversationUrl || "",
        reason
      });
    } catch (error) { console.warn("Keepit could not report the ChatGPT prompt result", error); }
    clearRequestSessionData(pending?.requestId);
  }

  async function processPendingLink() {
    if (linkProcessing) { linkRetryRequested = true; return; }
    linkProcessing = true;
    let pending = null;
    try {
      await clearStaleComposerForPanelLoad();
      const stored = await browserApi.storage.local.get(LINK_PENDING_KEY);
      pending = stored?.[LINK_PENDING_KEY];
      if (!pending?.requestId || !pending.sourceUrl) {
        if (!pending && stagedDraftLinkPending) {
          stagedDraftLinkPending = null;
          try { sessionStorage.removeItem(LINK_PREPARED_SESSION_KEY); sessionStorage.removeItem(LINK_DRAFT_MANUAL_SEND_SESSION_KEY); } catch {}
        }
        return;
      }
      // A pending explicit prompt is bound to its exact source; a background tab switch must not run it in another source context.
      if (activeSourceUrl && safeSourceUrl(pending.sourceUrl) !== activeSourceUrl) return;
      if (stagedDraftLinkPending && stagedDraftLinkPending.requestId !== pending.requestId) {
        stagedDraftLinkPending = null;
        try { sessionStorage.removeItem(LINK_PREPARED_SESSION_KEY); sessionStorage.removeItem(LINK_DRAFT_MANUAL_SEND_SESSION_KEY); } catch {}
      }
      if (!Number.isFinite(pending.expiresAt) || pending.expiresAt < Date.now()) {
        await reportLinkResult(pending, false, "", "link-request-expired");
        return;
      }

      const isDraftLink = pending.mode === "draft-link";
      const isFollowup = ["auto-send-followup", "draft-followup"].includes(pending.mode);
      const isDraftOnly = isDraftLink || pending.mode === "draft-followup";
      const expectedPrompt = typeof pending.prompt === "string" && pending.prompt
        ? pending.prompt
        : `${LINK_PROMPT_PREFIX} ${pending.sourceUrl}`;
      const expectedNormalized = normalizedDraft(expectedPrompt);
      let activeRequestId = activeLinkRequestId();
      if (isFollowup) {
        try { if (sessionStorage.getItem(LINK_DIRECT_SESSION_KEY) === pending.requestId) activeRequestId = pending.requestId; } catch {}
      }
      const currentUrl = new URL(location.href);
      const queryMatches = currentUrl.searchParams.get("q") === expectedPrompt;
      let qRequestId = "";
      let alreadySentRequestId = "";
      try {
        qRequestId = sessionStorage.getItem(LINK_Q_SESSION_KEY) || "";
        alreadySentRequestId = sessionStorage.getItem(LINK_SENT_SESSION_KEY) || "";
      } catch {}
      const qRequestMatches = qRequestId === pending.requestId && (queryMatches || !currentUrl.searchParams.has("q"));
      if (isDraftLink) {
        if (activeRequestId !== pending.requestId) return;
      } else if (isFollowup) {
        if (activeRequestId !== pending.requestId || canonicalConversationUrl(currentConversationUrl()) !== canonicalConversationUrl(pending.conversationUrl)) return;
      } else if (!queryMatches && !qRequestMatches) {
        return;
      }

      let conversationUrl = currentConversationUrl();
      let composer = findComposer();
      if (isDraftLink) {
        let preparedRequestId = "", manualSendRequestId = "";
        try {
          preparedRequestId = sessionStorage.getItem(LINK_PREPARED_SESSION_KEY) || "";
          manualSendRequestId = sessionStorage.getItem(LINK_DRAFT_MANUAL_SEND_SESSION_KEY) || "";
        } catch {}
        if (manualSendRequestId === pending.requestId && conversationUrl) {
          try { sessionStorage.setItem(LINK_SENT_SESSION_KEY, pending.requestId); } catch {}
          await reportLinkResult(pending, true, conversationUrl);
          stagedDraftLinkPending = null;
          return;
        }
        if (preparedRequestId === pending.requestId) {
          stagedDraftLinkPending = pending;
          if (pending.draftReady !== true) {
            try { await globalThis.LHN_MESSAGING.sendMessage({ type:"CHATGPT_LINK_DRAFT_READY", requestId:pending.requestId }); }
            catch (error) { console.warn("Keepit could not register the manually-sendable ChatGPT draft", error); }
          }
          return;
        }
      }
      if (conversationUrl && alreadySentRequestId === pending.requestId) {
        await reportLinkResult(pending, true, conversationUrl);
        return;
      }
      // For the first request, ChatGPT may submit ?q= natively. If it has cleared the exact
      // prefill, record success rather than clicking Send a second time. Follow-ups deliberately
      // target the existing /c/<id> route and are sent only from an empty, request-guarded composer.
      if (!isFollowup && conversationUrl && (queryMatches || qRequestMatches) && !composerHasText(composer)) {
        try { sessionStorage.setItem(LINK_SENT_SESSION_KEY, pending.requestId); } catch {}
        await reportLinkResult(pending, true, conversationUrl);
        return;
      }
      if (lastLinkAttemptId === pending.requestId) return;
      lastLinkAttemptId = pending.requestId;

      // A new URL must not reuse an unrelated existing conversation. Follow-ups are allowed
      // only on the exact mapped conversation validated above; preserve the existing draft guard.
      if (!isFollowup && conversationUrl && !queryMatches && !qRequestMatches) {
        if (composerHasText(composer)) {
          await reportLinkResult(pending, false, "", "composer-not-empty");
          return;
        }
        const newChatButton = findNewChatButton();
        if (!newChatButton) {
          await reportLinkResult(pending, false, "", "new-chat-unavailable");
          return;
        }
        newChatButton.click();
        const startedNewChat = await waitForNewChatRoute();
        if (!startedNewChat) {
          await reportLinkResult(pending, false, "", "new-chat-unavailable");
          return;
        }
      }

      const latestBeforeRead = (await browserApi.storage.local.get(LINK_PENDING_KEY))?.[LINK_PENDING_KEY];
      if (latestBeforeRead?.requestId !== pending.requestId || pending.expiresAt <= Date.now()) return;
      composer = findComposer() || await waitForLinkComposer();
      if (!composer) {
        if (!isFollowup) {
          const createdConversation = await waitForConversationRoute(3500);
          if (createdConversation && (queryMatches || qRequestMatches)) {
            try { sessionStorage.setItem(LINK_SENT_SESSION_KEY, pending.requestId); } catch {}
            await reportLinkResult(pending, true, createdConversation);
            return;
          }
        }
        await reportLinkResult(pending, false, "", "composer-unavailable");
        return;
      }

      let text = normalizedDraft(composerText(composer));
      if (isDraftLink) {
        if (text && text !== expectedNormalized) {
          await reportLinkResult(pending, false, "", "composer-not-empty");
          return;
        }
        if (!text) {
          insertDraft(composer, expectedPrompt);
          text = normalizedDraft(composerText(composer));
          if (text !== expectedNormalized) {
            await reportLinkResult(pending, false, "", "composer-insert-failed");
            return;
          }
        }
      } else if (isFollowup) {
        // An explicit Ask AI selection replaces any unsent composer draft, then sends only
        // the newly selected question. This runs only after the exact mapped route is validated.
        insertDraft(composer, expectedPrompt, true);
        text = normalizedDraft(composerText(composer));
        if (text !== expectedNormalized) {
          await reportLinkResult(pending, false, "", "composer-insert-failed");
          return;
        }
      } else {
        if (text && text !== expectedNormalized) {
          // Never replace or send an unrelated user draft, even if the ?q= URL is present.
          await reportLinkResult(pending, false, "", "composer-not-empty");
          return;
        }
        if (!text) {
          // The query parameter is the primary prompt transport. Do not manually type into an
          // empty composer: wait briefly for ChatGPT to handle q=, otherwise fail safely.
          const createdConversation = await waitForConversationRoute(3500);
          if (createdConversation && (queryMatches || qRequestMatches)) {
            try { sessionStorage.setItem(LINK_SENT_SESSION_KEY, pending.requestId); } catch {}
            await reportLinkResult(pending, true, createdConversation);
          } else {
            await reportLinkResult(pending, false, "", "q-prefill-empty");
          }
          return;
        }

        // The exact request prompt is present from ChatGPT's q= prefill. First allow native
        // auto-submit to finish; if it did, do not submit a duplicate.
        let createdConversation = await waitForConversationRoute(2200);
        composer = findComposer() || composer;
        if (createdConversation && !composerHasText(composer)) {
          try { sessionStorage.setItem(LINK_SENT_SESSION_KEY, pending.requestId); } catch {}
          await reportLinkResult(pending, true, createdConversation);
          return;
        }
      }

      // If ChatGPT did not complete its native ?q= send, re-render its exact prefill with
      // the shared multiline formatter before the one guarded manual Send click.
      if (!isFollowup && !isDraftOnly && !isDraftLink) {
        composer = findComposer() || composer;
        if (normalizedDraft(composerText(composer)) !== expectedNormalized) {
          await reportLinkResult(pending, false, "", "composer-not-empty");
          return;
        }
        insertDraft(composer, expectedPrompt, true);
        if (normalizedDraft(composerText(composer)) !== expectedNormalized) {
          await reportLinkResult(pending, false, "", "composer-insert-failed");
          return;
        }
      }

      const latest = (await browserApi.storage.local.get(LINK_PENDING_KEY))?.[LINK_PENDING_KEY];
      if (latest?.requestId !== pending.requestId || pending.expiresAt <= Date.now()) return;
      if (activeSourceUrl && safeSourceUrl(pending.sourceUrl) !== activeSourceUrl) return;
      composer = findComposer() || composer;
      if (normalizedDraft(composerText(composer)) !== expectedNormalized) {
        await reportLinkResult(pending, false, "", "composer-not-empty");
        return;
      }
      if (isDraftOnly) {
        if (isDraftLink) {
          try { sessionStorage.setItem(LINK_PREPARED_SESSION_KEY, pending.requestId); } catch {}
          stagedDraftLinkPending = { ...pending, draftReady:true };
          try { await globalThis.LHN_MESSAGING.sendMessage({ type:"CHATGPT_LINK_DRAFT_READY", requestId:pending.requestId }); }
          catch (error) { console.warn("Keepit could not register the manually-sendable ChatGPT draft", error); }
        } else {
          await reportLinkResult(pending, true, conversationUrl || pending.conversationUrl || "");
        }
        return;
      }
      const sendButton = await waitForEnabledSendButton();
      if (!sendButton) {
        await reportLinkResult(pending, false, "", "send-button-unavailable");
        return;
      }
      // Final route/source, draft, and request checks immediately before the single send.
      if (activeSourceUrl && safeSourceUrl(pending.sourceUrl) !== activeSourceUrl) return;
      if (isFollowup && canonicalConversationUrl(currentConversationUrl()) !== canonicalConversationUrl(pending.conversationUrl)) return;
      if (normalizedDraft(composerText(composer)) !== expectedNormalized) {
        await reportLinkResult(pending, false, "", "composer-not-empty");
        return;
      }
      try { sessionStorage.setItem(LINK_SENT_SESSION_KEY, pending.requestId); } catch {}
      sendButton.click();
      if (isFollowup) {
        conversationUrl = currentConversationUrl();
        if (conversationUrl) await reportLinkResult(pending, true, conversationUrl);
        else await reportLinkResult(pending, false, "", "conversation-route-missing");
      } else {
        const createdConversation = await waitForConversationRoute(18000);
        if (createdConversation) await reportLinkResult(pending, true, createdConversation);
        else await reportLinkResult(pending, false, "", "conversation-not-created");
      }
    } catch (error) {
      console.warn("Could not send the request-scoped ChatGPT prompt", error);
      if (pending) await reportLinkResult(pending, false, "", "link-autosend-failed");
    } finally {
      linkProcessing = false;
      if (linkRetryRequested) { linkRetryRequested = false; queueMicrotask(() => void processPendingLink()); }
    }
  }

  async function processPanelNavigationRequest(request) {
    if (!isFirefox || window.top !== window || !request || request.expiresAt <= Date.now()) return false;
    try {
      const latestAtStart = await browserApi.storage.local.get(PANEL_NAVIGATION_KEY);
      if (latestAtStart?.[PANEL_NAVIGATION_KEY]?.requestId !== request.requestId) return true;
      const target = new URL(String(request.targetUrl || ""));
      if (target.protocol !== "https:" || !["chatgpt.com", "chat.openai.com"].includes(target.hostname)) return false;
      if (target.pathname !== "/" && !/^\/c\/[A-Za-z0-9_-]+(?:\/|$)/.test(target.pathname)) return false;
      const routeKey = value => {
        try {
          const parsed = new URL(String(value || ""));
          if (parsed.protocol !== "https:" || !["chatgpt.com", "chat.openai.com"].includes(parsed.hostname)) return "";
          if (parsed.pathname !== "/" && !/^\/c\/[A-Za-z0-9_-]+(?:\/|$)/.test(parsed.pathname)) return "";
          return `${parsed.origin}${parsed.pathname === "/" ? "/" : parsed.pathname.replace(/\/$/, "")}`;
        } catch { return ""; }
      };
      const sourceContextChanged = !!request.sourceUrl && safeSourceUrl(request.sourceUrl) !== activeSourceUrl;
      const targetRoute = routeKey(target.href);
      const displayedRoute = routeKey(currentPanelRouteUrl());
      const sameSourceAndRoute = !sourceContextChanged && !!targetRoute && targetRoute === displayedRoute;
      if (sameSourceAndRoute && ["reopen", "context-switch"].includes(request.mode)) {
        if (latestAtStart?.[PANEL_NAVIGATION_KEY]?.requestId === request.requestId) await browserApi.storage.local.remove(PANEL_NAVIGATION_KEY);
        return true;
      }
      if (sameSourceAndRoute && request.mode === "followup") {
        activeSourceUrl = safeSourceUrl(request.sourceUrl) || activeSourceUrl;
        chatGPTToolbar?.setSourceUrl(activeSourceUrl);
        try {
          sessionStorage.setItem(SOURCE_URL_SESSION_KEY, activeSourceUrl);
          sessionStorage.setItem(LINK_DIRECT_SESSION_KEY, request.linkRequestId);
          sessionStorage.setItem(LINK_SESSION_KEY, request.linkRequestId);
        } catch {}
        reportPanelRouteContext(currentPanelRouteUrl());
        await browserApi.storage.local.remove(PANEL_NAVIGATION_KEY);
        void processPendingLink();
        return true;
      }

      const latestBeforeNavigation = await browserApi.storage.local.get(PANEL_NAVIGATION_KEY);
      if (latestBeforeNavigation?.[PANEL_NAVIGATION_KEY]?.requestId !== request.requestId) return true;
      const params = new URLSearchParams(target.hash.replace(/^#/, ""));
      params.set(PANEL_MARKER, "1");
      if (request.sourceUrl) params.set(SOURCE_URL_MARKER, request.sourceUrl);
      else params.delete(SOURCE_URL_MARKER);
      if (sourceContextChanged) params.set(CLEAR_COMPOSER_MARKER, "1");
      else params.delete(CLEAR_COMPOSER_MARKER);
      if (["new-link", "followup"].includes(request.mode) && request.linkRequestId) params.set(LINK_REQUEST_MARKER, request.linkRequestId);
      else params.delete(LINK_REQUEST_MARKER);
      target.hash = params.toString();
      const forceSameRouteContextReload = sourceContextChanged && !!targetRoute && targetRoute === displayedRoute;
      if (forceSameRouteContextReload) {
        try {
          history.replaceState(history.state, "", target.href);
          location.reload();
        } catch (error) {
          console.warn("Keepit could not reload Firefox ChatGPT for a new source page", error);
          location.replace(target.href);
        }
      } else location.replace(target.href);
      await browserApi.storage.local.remove(PANEL_NAVIGATION_KEY);
      return true;
    } catch (error) {
      console.warn("Keepit could not navigate the Firefox ChatGPT panel", error);
      return false;
    }
  }

  browserApi.storage.onChanged?.addListener((changes, areaName) => {
    if (areaName !== "local") return;
    const linkChange = changes?.[LINK_PENDING_KEY];
    if (linkChange?.newValue || linkChange?.oldValue) {
      if (!linkChange.newValue && linkChange.oldValue?.requestId) {
        clearRequestSessionData(linkChange.oldValue.requestId);
        if (stagedDraftLinkPending?.requestId === linkChange.oldValue.requestId) stagedDraftLinkPending = null;
      }
      void processPendingLink();
    }
    const navRequest = changes?.[PANEL_NAVIGATION_KEY]?.newValue;
    if (navRequest) void processPanelNavigationRequest(navRequest);
  });
  if (isFirefox && window.top === window) {
    browserApi.storage.local.get(PANEL_NAVIGATION_KEY).then(stored => {
      if (stored?.[PANEL_NAVIGATION_KEY]) void processPanelNavigationRequest(stored[PANEL_NAVIGATION_KEY]);
    }).catch(() => {});
  }
  const pollPanel = () => {
    if (document.visibilityState === "hidden") return;
    void rememberCurrentConversation();
    if (!linkProcessing) void processPendingLink();
  };
  void rememberCurrentConversation();
  void processPendingLink();
  const panelPollTimer = setInterval(pollPanel, 1200);
  let lastObservedHref = location.href;
  const routeObserver = new MutationObserver(() => {
    const currentHref = location.href;
    if (currentHref !== lastObservedHref) { lastObservedHref = currentHref; void rememberCurrentConversation(); void processPendingLink(); }
  });
  routeObserver.observe(document.documentElement, { childList:true, subtree:true });
  const rememberAfterNavigation = () => {
    lastObservedHref = location.href;
    void rememberCurrentConversation();
    // A repeat Ask AI uses the same /c/<id> route with a new request marker in the hash.
    // Re-run the pending sender on that hash/popstate event instead of waiting for a poll.
    void processPendingLink();
  };
  document.addEventListener("visibilitychange", pollPanel);
  window.addEventListener("popstate", rememberAfterNavigation);
  window.addEventListener("hashchange", rememberAfterNavigation);
  window.addEventListener("pagehide", () => {
    clearInterval(panelPollTimer);
    routeObserver.disconnect();
    if (isFirefox && window.top === window) void globalThis.LHN_MESSAGING.sendMessage({ type:"CHATGPT_PANEL_MAYBE_CLOSED" }).catch(() => {});
  }, { once:true });
})();
