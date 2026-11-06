// ONE Send/link/mapping flow for ChatGPT, Gemini and Claude panel pages, using the ChatGPT
// behavior as the standard. Provider differences come only from the LHN_AI_PROVIDERS adapter
// (selectors, ?q= support, conversation URL shape) through LHN_AI_COMPOSER.
(async () => {
  const providers = globalThis.LHN_AI_PROVIDERS;
  const composerApi = globalThis.LHN_AI_COMPOSER;
  if (!providers || !composerApi) return;
  const provider = providers.fromHost(location.hostname);
  if (!provider || !providers.isPanelProvider(provider.id) || composerApi.providerId !== provider.id) return;
  // Only ChatGPT receives the first prompt through ?q= (see providers.js queryPrompt).
  const usesQueryPrompt = provider.queryPrompt === true;

  const LINK_PENDING_KEY = "keepitAiLinkPending";
  const MARKERS = providers.PANEL_MARKERS;
  const SESSION = composerApi.SESSION_KEYS;
  const PANEL_SESSION_KEY = SESSION.panel;
  const CLEAR_COMPOSER_SESSION_KEY = SESSION.clearComposer;
  const SOURCE_URL_SESSION_KEY = SESSION.sourceUrl;
  const LINK_SESSION_KEY = SESSION.linkRequestId;
  const LINK_DIRECT_SESSION_KEY = "keepitAiDirectFollowupRequestId";
  const LINK_Q_SESSION_KEY = "keepitAiLinkQRequestId";
  const LINK_SENT_SESSION_KEY = "keepitAiLinkSentRequestId";
  const LINK_PREPARED_SESSION_KEY = "keepitAiPreparedRequestId";
  const LINK_DRAFT_MANUAL_SEND_SESSION_KEY = "keepitAiDraftManualSendRequestId";
  const LINK_MANUAL_SEND_SESSION_KEY = "keepitAiManualLinkSendRequestId";
  const LINK_PROMPT_PREFIX = "Hãy tóm tắt bài sau:";
  const MAX_WAIT_MS = 25000;
  // Same AI panel host in Chromium and Firefox: the provider page is the iframe inside the extension page.
  const isPanelRoot = window.parent === window.top && window.top !== window;
  const safeSourceUrl = providers.normalizeSourceUrl;
  let url;
  try { url = new URL(location.href); } catch { return; }
  // Ordinary provider tabs must never process extension-panel requests.
  const initialMarkers = providers.readPanelMarkers(url.href);
  const hasUrlMarker = initialMarkers.panel;
  const initialLinkRequestId = initialMarkers.linkRequestId;
  const initialFocusComposerRoute = initialMarkers.focusComposer ? providers.normalizeConversationUrl(provider.id, url.href) : "";
  let activeSourceUrl = initialMarkers.sourceUrl;
  let clearComposerOnPanelLoad = isPanelRoot && initialMarkers.clearComposer;
  let hasSessionMarker = false;
  try {
    hasSessionMarker = sessionStorage.getItem(PANEL_SESSION_KEY) === "1";
    if (isPanelRoot) {
      clearComposerOnPanelLoad = clearComposerOnPanelLoad || sessionStorage.getItem(CLEAR_COMPOSER_SESSION_KEY) === "1";
      sessionStorage.removeItem(CLEAR_COMPOSER_SESSION_KEY);
    }
    if (!activeSourceUrl) activeSourceUrl = safeSourceUrl(sessionStorage.getItem(SOURCE_URL_SESSION_KEY));
    if (hasUrlMarker) sessionStorage.setItem(PANEL_SESSION_KEY, "1");
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
  if (hasExtensionReferrer && !hasSessionMarker) { try { sessionStorage.setItem(PANEL_SESSION_KEY, "1"); hasSessionMarker = true; } catch {} }
  if ((!hasUrlMarker && !hasSessionMarker && !hasExtensionReferrer) || !isPanelRoot) return;
  const browserApi = globalThis.browser;
  if (!browserApi?.storage?.local || !globalThis.LHN_MESSAGING?.sendMessage) return;
  if (activeSourceUrl) composerApi.setSourceUrl(activeSourceUrl);

  function findComposer() {
    return composerApi.findEditor() || null;
  }

  function composerText(composer) {
    return composerApi.editorText(composer) || "";
  }

  function composerHasText(composer) {
    return /[^\s]/.test(composerText(composer));
  }

  function focusComposerAtEnd(composer) {
    try { window.focus?.(); } catch {}
    return composerApi.focusAtEnd(composer) === true;
  }

  function currentConversationUrl() {
    return providers.normalizeConversationUrl(provider.id, location.href);
  }

  function canonicalConversationUrl(value) {
    return providers.normalizeConversationUrl(provider.id, value);
  }

  function currentPanelRouteUrl() {
    return providers.panelRoute(provider.id, location.href);
  }

  async function focusComposerWhenReady({ timeoutMs = MAX_WAIT_MS, requireEmpty = false, expectedText = "", targetRoute = "" } = {}) {
    const started = Date.now();
    const expectedRoute = canonicalConversationUrl(targetRoute);
    const sentText = normalizedDraft(expectedText);
    while (Date.now() - started < timeoutMs) {
      const composer = findComposer();
      const currentRoute = expectedRoute ? canonicalConversationUrl(currentConversationUrl()) : "";
      if (composer && (!expectedRoute || currentRoute === expectedRoute)) {
        if (requireEmpty && composerHasText(composer) && (!sentText || normalizedDraft(composerText(composer)) === sentText)) {
          await new Promise(resolve => setTimeout(resolve, 120));
          continue;
        }
        if (!composer.disabled && composer.getAttribute?.("aria-disabled") !== "true") return focusComposerAtEnd(composer);
      }
      await new Promise(resolve => setTimeout(resolve, 120));
    }
    return false;
  }

  function setActiveSourceUrl(value) {
    activeSourceUrl = safeSourceUrl(value);
    composerApi.setSourceUrl(activeSourceUrl);
    try { if (activeSourceUrl) sessionStorage.setItem(SOURCE_URL_SESSION_KEY, activeSourceUrl); } catch {}
  }

  // The side-panel host updates the source context and wakes same-route follow-ups.
  window.addEventListener("message", event => {
    // Chrome may expose MessageEvent.source as null for messages sent by extension pages.
    if (window.top === window || (event.source !== window.parent && event.source !== null)) return;
    const extensionOrigin = extensionMessageOrigin();
    if (!extensionOrigin || event.origin !== extensionOrigin) return;
    if (event.data?.type === "KEEPIT_AI_PANEL_SOURCE_CONTEXT") {
      setActiveSourceUrl(event.data.sourceUrl);
      void reportPanelRouteContext(currentPanelRouteUrl());
      return;
    }
    if (event.data?.type === "KEEPIT_AI_PANEL_FOCUS_COMPOSER") {
      void focusComposerWhenReady({ targetRoute:event.data.targetRoute || "" });
      return;
    }
    if (event.data?.type === "KEEPIT_AI_PANEL_FOLLOWUP_REQUEST" && typeof event.data.requestId === "string" && event.data.requestId) {
      try {
        sessionStorage.setItem(LINK_DIRECT_SESSION_KEY, event.data.requestId);
        sessionStorage.setItem(LINK_SESSION_KEY, event.data.requestId);
      } catch {}
      void processPendingLink();
    }
  });

  const normalizedDraft = value => String(value || "").replace(/[\u200b\u2060]/g, "").replace(/\r\n?/g, "\n").replace(/\s+/g, " ").trim();

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

  // Some editors (Gemini) update their model a moment after insertion; require the exact
  // prompt to stay in the composer for several samples before the single Send click.
  async function waitForStableDraft(text, timeoutMs = 900) {
    const expected = normalizedDraft(text);
    const started = Date.now();
    let stableSamples = 0;
    while (Date.now() - started < timeoutMs) {
      const composer = findComposer();
      if (composer && normalizedDraft(composerText(composer)) === expected) {
        stableSamples++;
        if (stableSamples >= 4) return composer;
      } else stableSamples = 0;
      await new Promise(resolve => setTimeout(resolve, 35));
    }
    return null;
  }

  function insertDraft(composer, text, replaceExisting = false) {
    return composerApi.setEditorText(composer, text, replaceExisting) === true;
  }

  function clearComposerText(composer) {
    return composerApi.clearEditor(composer) === true;
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
        if (usesQueryPrompt && pendingIsCurrent && pending.mode === "auto-send-link" && currentUrl?.searchParams.get("q") === pending.prompt) {
          const queryComposer = await waitForComposerDraft(pending.prompt, 2200);
          if (queryComposer) return;
        }
        clearComposerText(findComposer() || composer);
      })().catch(error => console.warn("Keepit could not clear a stale AI composer draft", error));
    }
    await panelLoadComposerClearPromise;
  }

  let lastReportedRouteContext = "";
  let pendingRouteContextKey = "";
  function reportPanelRouteContext(routeUrl) {
    const sourceUrl = safeSourceUrl(activeSourceUrl);
    const route = String(routeUrl || "");
    if (!sourceUrl || !route) return;
    const key = `${sourceUrl}\n${route}`;
    if (key === lastReportedRouteContext || key === pendingRouteContextKey) return;
    pendingRouteContextKey = key;
    void globalThis.LHN_MESSAGING.sendMessage({ type:"AI_PANEL_ROUTE_CONTEXT", providerId:provider.id, sourceUrl, chatUrl:route })
      .then(response => { if (response?.ok && pendingRouteContextKey === key) lastReportedRouteContext = key; })
      .catch(() => {})
      .finally(() => { if (pendingRouteContextKey === key) pendingRouteContextKey = ""; });
  }

  function rememberCurrentConversation() {
    try { reportPanelRouteContext(currentPanelRouteUrl()); }
    catch (error) { console.warn("Keepit could not report the AI panel route", error); }
  }

  let linkProcessing = false;
  let linkRetryRequested = false;
  let lastLinkAttemptId = "";
  let stagedDraftLinkPending = null;
  let activePendingLinkMode = "";
  let manualSendIntercepting = false;
  let bypassManualSendIntercept = false;

  function activeLinkRequestId() {
    const fromHash = providers.readPanelMarkers(location.href).linkRequestId;
    if (fromHash) {
      try { sessionStorage.setItem(LINK_SESSION_KEY, fromHash); } catch {}
      return fromHash;
    }
    try { return sessionStorage.getItem(LINK_SESSION_KEY) || initialLinkRequestId; }
    catch { return initialLinkRequestId; }
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
    if (manualSendIntercepting || bypassManualSendIntercept) return;
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
    return composerApi.findSendButton();
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

  function isManualSendIntent(event, composer) {
    if (!composer || !composerHasText(composer)) return false;
    if (event.type === "submit") return !!composer.closest("form") && event.target?.contains?.(composer);
    if (event.type === "keydown") return event.key === "Enter" && !event.shiftKey && !event.isComposing && event.keyCode !== 229 && composer.contains?.(event.target);
    if (event.type === "click") {
      const button = event.target?.closest?.("button");
      return !!button && button === findSendButton();
    }
    return false;
  }

  function isKeepitQueryAutoSend() {
    if (!usesQueryPrompt) return false;
    const requestId = activeLinkRequestId();
    try { return !!requestId && sessionStorage.getItem(LINK_Q_SESSION_KEY) === requestId; }
    catch { return false; }
  }

  function replaySend() {
    bypassManualSendIntercept = true;
    try {
      const button = findSendButton();
      if (button && !button.disabled && button.getAttribute("aria-disabled") !== "true") {
        button.click();
        return true;
      }
      const form = findComposer()?.closest("form");
      if (typeof form?.requestSubmit === "function") {
        form.requestSubmit();
        return true;
      }
      return false;
    } catch (error) {
      console.warn("Keepit could not resume the AI send action", error);
      return false;
    } finally {
      setTimeout(() => { bypassManualSendIntercept = false; }, 0);
    }
  }

  async function prepareAndSendManualPrompt(sourceUrl, originalPrompt) {
    if (linkProcessing) {
      const started = Date.now();
      while (linkProcessing && Date.now() - started < 8000) await new Promise(resolve => setTimeout(resolve, 50));
      if (linkProcessing) return;
    }
    let preparation = null;
    try {
      preparation = await globalThis.LHN_MESSAGING.sendMessage({
        type:"AI_LINK_PREPARE",
        providerId:provider.id,
        sourceUrl,
        // The chat this Send happens in; a chat other than the mapped one takes over the source mapping.
        conversationUrl:currentConversationUrl()
      });
    } catch (error) {
      console.warn("Keepit could not prepare the source link for this AI send", error);
      replaySend();
      return;
    }
    if (!preparation?.ok) {
      if (!preparation?.stale) replaySend();
      return;
    }
    if (safeSourceUrl(activeSourceUrl) !== sourceUrl) return;
    const liveComposer = findComposer();
    if (!liveComposer || normalizedDraft(composerText(liveComposer)) !== normalizedDraft(originalPrompt)) return;
    if (preparation.mapped) {
      replaySend();
      return;
    }
    const requestId = String(preparation.requestId || "");
    const websiteLabel = String(preparation.websiteLabel || "Website");
    if (!requestId) { replaySend(); return; }

    const header = `• ${websiteLabel}: ${sourceUrl}`;
    const promptBody = String(originalPrompt || "").trim();
    const alreadyHasExactHeader = promptBody.split(/\r?\n/, 1)[0] === header;
    const fullPrompt = alreadyHasExactHeader
      ? promptBody
      : (globalThis.LHN_AI_PROMPT_FORMAT?.formatLinkPrompt(websiteLabel, sourceUrl, promptBody)
          || `${header}\n• ${promptBody}`);
    const composer = findComposer();
    if (!composer || safeSourceUrl(activeSourceUrl) !== sourceUrl
        || normalizedDraft(composerText(composer)) !== normalizedDraft(originalPrompt)) return;
    if (!insertDraft(composer, fullPrompt, true)) {
      insertDraft(composer, originalPrompt, true);
      return;
    }

    const sendButton = await waitForEnabledSendButton();
    const currentComposer = sendButton ? await waitForStableDraft(fullPrompt) || findComposer() : findComposer();
    const stillPrepared = currentComposer && normalizedDraft(composerText(currentComposer)) === normalizedDraft(fullPrompt);
    if (!sendButton || safeSourceUrl(activeSourceUrl) !== sourceUrl || !stillPrepared) {
      if (safeSourceUrl(activeSourceUrl) === sourceUrl && stillPrepared) insertDraft(currentComposer, originalPrompt, true);
      return;
    }
    try {
      if (preparation.mode === "draft-link") {
        sessionStorage.setItem(LINK_DRAFT_MANUAL_SEND_SESSION_KEY, requestId);
      } else {
        sessionStorage.setItem(LINK_MANUAL_SEND_SESSION_KEY, requestId);
      }
    } catch { /* session storage may be disabled; composer still receives the exact link */ }
    bypassManualSendIntercept = true;
    try { sendButton.click(); }
    catch (error) { console.warn("Keepit could not submit the manually prepared AI prompt", error); }
    finally { setTimeout(() => { bypassManualSendIntercept = false; }, 0); }
  }

  function interceptManualSend(event) {
    if (bypassManualSendIntercept) return;
    const composer = findComposer();
    if (!isManualSendIntent(event, composer)) return;
    if (manualSendIntercepting) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
      return;
    }
    const keepitPromptOwnsSend = linkProcessing && ["auto-send-link", "auto-send-followup", "draft-followup"].includes(activePendingLinkMode);
    if (keepitPromptOwnsSend || isKeepitQueryAutoSend()) return;
    const sourceUrl = safeSourceUrl(activeSourceUrl);
    if (!sourceUrl) return;
    const originalPrompt = composerText(composer);
    manualSendIntercepting = true;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();
    void prepareAndSendManualPrompt(sourceUrl, originalPrompt).catch(error => {
      console.warn("Keepit could not prepare the manually sent AI prompt", error);
      replaySend();
    }).finally(() => { manualSendIntercepting = false; });
  }

  document.addEventListener("click", interceptManualSend, true);
  document.addEventListener("keydown", interceptManualSend, true);
  document.addEventListener("submit", interceptManualSend, true);
  document.addEventListener("submit", markManualDraftLinkSend, true);
  document.addEventListener("click", markManualDraftLinkSend, true);
  document.addEventListener("keydown", markManualDraftLinkSend, true);

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
      for (const key of [LINK_SESSION_KEY, LINK_DIRECT_SESSION_KEY, LINK_Q_SESSION_KEY, LINK_SENT_SESSION_KEY, LINK_PREPARED_SESSION_KEY, LINK_DRAFT_MANUAL_SEND_SESSION_KEY, LINK_MANUAL_SEND_SESSION_KEY]) {
        if (sessionStorage.getItem(key) === requestId) sessionStorage.removeItem(key);
      }
    } catch {}
  }

  async function reportLinkResult(pending, ok, conversationUrl = "", reason = "") {
    let response = null;
    try {
      response = await globalThis.LHN_MESSAGING.sendMessage({
        type:"AI_LINK_RESULT",
        providerId:provider.id,
        requestId:pending?.requestId || "",
        ok:!!ok,
        conversationUrl:conversationUrl || "",
        reason
      });
    } catch (error) { console.warn("Keepit could not report the AI prompt result", error); }
    clearRequestSessionData(pending?.requestId);
    if (ok && response?.ok && ["auto-send-link", "auto-send-followup"].includes(pending?.mode)) {
      void focusComposerWhenReady({ timeoutMs:6000, requireEmpty:true, expectedText:pending.prompt || "" });
    }
  }

  async function notifyDraftReady(pending) {
    try { await globalThis.LHN_MESSAGING.sendMessage({ type:"AI_LINK_DRAFT_READY", providerId:provider.id, requestId:pending.requestId }); }
    catch (error) { console.warn("Keepit could not register the manually-sendable AI draft", error); }
  }

  async function processPendingLink() {
    if (linkProcessing) { linkRetryRequested = true; return; }
    linkProcessing = true;
    let pending = null;
    try {
      await clearStaleComposerForPanelLoad();
      const stored = await browserApi.storage.local.get(LINK_PENDING_KEY);
      pending = stored?.[LINK_PENDING_KEY];
      activePendingLinkMode = String(pending?.mode || "");
      if (!pending?.requestId || !pending.sourceUrl) {
        if (!pending && stagedDraftLinkPending) {
          stagedDraftLinkPending = null;
          try { sessionStorage.removeItem(LINK_PREPARED_SESSION_KEY); sessionStorage.removeItem(LINK_DRAFT_MANUAL_SEND_SESSION_KEY); } catch {}
        }
        return;
      }
      // A request belongs to the AI it was created for; another provider page never runs it.
      if ((pending.providerId || "chatgpt") !== provider.id) return;
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
      const isManualLink = pending.mode === "manual-link";
      const isFollowup = ["auto-send-followup", "draft-followup"].includes(pending.mode);
      const isDraftOnly = isDraftLink || pending.mode === "draft-followup";
      // Without ?q= the first auto-sent prompt is typed like a draft, then sent once (ChatGPT's guarded Send).
      const isTypedAutoLink = pending.mode === "auto-send-link" && !usesQueryPrompt;
      const expectedPrompt = typeof pending.prompt === "string" && pending.prompt
        ? pending.prompt
        : `${LINK_PROMPT_PREFIX} ${pending.sourceUrl}`;
      const expectedNormalized = normalizedDraft(expectedPrompt);
      let activeRequestId = activeLinkRequestId();
      if (isFollowup) {
        try { if (sessionStorage.getItem(LINK_DIRECT_SESSION_KEY) === pending.requestId) activeRequestId = pending.requestId; } catch {}
      }
      const currentUrl = new URL(location.href);
      const queryMatches = usesQueryPrompt && currentUrl.searchParams.get("q") === expectedPrompt;
      let qRequestId = "";
      let alreadySentRequestId = "";
      try {
        qRequestId = usesQueryPrompt ? sessionStorage.getItem(LINK_Q_SESSION_KEY) || "" : "";
        alreadySentRequestId = sessionStorage.getItem(LINK_SENT_SESSION_KEY) || "";
      } catch {}
      const qRequestMatches = usesQueryPrompt && qRequestId === pending.requestId && (queryMatches || !currentUrl.searchParams.has("q"));
      if (isDraftLink || isTypedAutoLink) {
        if (activeRequestId !== pending.requestId) return;
      } else if (isFollowup) {
        if (activeRequestId !== pending.requestId || canonicalConversationUrl(currentConversationUrl()) !== canonicalConversationUrl(pending.conversationUrl)) return;
      } else if (!isManualLink && !queryMatches && !qRequestMatches) {
        return;
      }

      let conversationUrl = currentConversationUrl();
      let composer = findComposer();
      if (isManualLink) {
        let manualRequestId = "";
        try { manualRequestId = sessionStorage.getItem(LINK_MANUAL_SEND_SESSION_KEY) || ""; } catch {}
        if (manualRequestId === pending.requestId && conversationUrl && composer && !composerHasText(composer)) {
          try { sessionStorage.setItem(LINK_SENT_SESSION_KEY, pending.requestId); } catch {}
          await reportLinkResult(pending, true, conversationUrl);
        }
        return;
      }
      if (isDraftLink) {
        let preparedRequestId = "", manualSendRequestId = "";
        try {
          preparedRequestId = sessionStorage.getItem(LINK_PREPARED_SESSION_KEY) || "";
          manualSendRequestId = sessionStorage.getItem(LINK_DRAFT_MANUAL_SEND_SESSION_KEY) || "";
        } catch {}
        if (manualSendRequestId === pending.requestId && conversationUrl && composer && !composerHasText(composer)) {
          try { sessionStorage.setItem(LINK_SENT_SESSION_KEY, pending.requestId); } catch {}
          await reportLinkResult(pending, true, conversationUrl);
          stagedDraftLinkPending = null;
          return;
        }
        if (preparedRequestId === pending.requestId) {
          stagedDraftLinkPending = pending;
          if (composer && normalizedDraft(composerText(composer)) === expectedNormalized) focusComposerAtEnd(composer);
          if (pending.draftReady !== true) await notifyDraftReady(pending);
          return;
        }
      }
      if (conversationUrl && alreadySentRequestId === pending.requestId) {
        await reportLinkResult(pending, true, conversationUrl);
        return;
      }
      // For the first request, ChatGPT may submit ?q= natively. If it has cleared the exact
      // prefill, record success rather than clicking Send a second time. Follow-ups deliberately
      // target the existing conversation route and are sent only from an empty, request-guarded composer.
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
        const newChatButton = composerApi.findNewChatButton();
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
      if (isDraftLink || isTypedAutoLink) {
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
        const createdConversation = await waitForConversationRoute(2200);
        composer = findComposer() || composer;
        if (createdConversation && !composerHasText(composer)) {
          try { sessionStorage.setItem(LINK_SENT_SESSION_KEY, pending.requestId); } catch {}
          await reportLinkResult(pending, true, createdConversation);
          return;
        }
      }

      // If ChatGPT did not complete its native ?q= send, re-render its exact prefill with
      // the shared multiline formatter before the one guarded manual Send click.
      if (usesQueryPrompt && !isFollowup && !isDraftOnly && !isDraftLink) {
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
          focusComposerAtEnd(composer);
          try { sessionStorage.setItem(LINK_PREPARED_SESSION_KEY, pending.requestId); } catch {}
          stagedDraftLinkPending = { ...pending, draftReady:true };
          await notifyDraftReady(pending);
        } else {
          await reportLinkResult(pending, true, conversationUrl || pending.conversationUrl || "");
          focusComposerAtEnd(composer);
        }
        return;
      }
      const sendButton = await waitForEnabledSendButton();
      if (!sendButton) {
        await reportLinkResult(pending, false, "", "send-button-unavailable");
        return;
      }
      composer = await waitForStableDraft(expectedPrompt) || findComposer() || composer;
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
      console.warn("Could not send the request-scoped AI prompt", error);
      if (pending) await reportLinkResult(pending, false, "", "link-autosend-failed");
    } finally {
      linkProcessing = false;
      activePendingLinkMode = "";
      if (linkRetryRequested) { linkRetryRequested = false; queueMicrotask(() => void processPendingLink()); }
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
  });
  const pollPanel = () => {
    if (document.visibilityState === "hidden") return;
    rememberCurrentConversation();
    if (!linkProcessing) void processPendingLink();
  };
  rememberCurrentConversation();
  void processPendingLink();
  if (initialFocusComposerRoute) void focusComposerWhenReady({ targetRoute:initialFocusComposerRoute });
  const panelPollTimer = setInterval(pollPanel, 1200);
  let lastObservedHref = location.href;
  const routeObserver = new MutationObserver(() => {
    const currentHref = location.href;
    if (currentHref !== lastObservedHref) { lastObservedHref = currentHref; rememberCurrentConversation(); void processPendingLink(); }
  });
  routeObserver.observe(document.documentElement, { childList:true, subtree:true });
  const rememberAfterNavigation = () => {
    lastObservedHref = location.href;
    rememberCurrentConversation();
    // A repeat Ask AI uses the same conversation route with a new request marker in the hash.
    // Re-run the pending sender on that hash/popstate event instead of waiting for a poll.
    void processPendingLink();
  };
  document.addEventListener("visibilitychange", pollPanel);
  window.addEventListener("popstate", rememberAfterNavigation);
  window.addEventListener("hashchange", rememberAfterNavigation);
  window.addEventListener("pagehide", () => {
    clearInterval(panelPollTimer);
    routeObserver.disconnect();
  }, { once:true });
})();
