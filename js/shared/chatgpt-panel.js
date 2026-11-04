(() => {
  const CONVERSATION_KEY = "keepitChatGPTLastConversationUrl";
  const NAVIGATION_KEY = "keepitChatGPTPanelNavigationRequest";
  const PANEL_MARKER = "keepit-chatgpt-panel";
  const LINK_REQUEST_MARKER = "keepit-chatgpt-link-request";
  const SOURCE_URL_MARKER = "keepit-chatgpt-source-url";
  const RESTORE_DRAFT_MARKER = "keepit-chatgpt-restore-draft";
  const PAGE_DRAFTS_KEY = "keepitChatGPTPageDraftsBySourceUrl";
  const SOURCE_CONVERSATIONS_KEY = "keepitChatGPTConversationBySourceUrl";
  const DEFAULT_CHATGPT_URL = "https://chatgpt.com/";
  const frame = document.getElementById("chatgpt-frame");
  const handledNavigationIds = new Set();

  // Chrome versions without sidePanel.close() close the extension page itself as a fallback.
  browser.runtime.onMessage.addListener(message => {
    if (message?.type !== "KEEPIT_CLOSE_CHATGPT_PANEL" || !globalThis.chrome?.sidePanel) return;
    return (async () => {
      try {
        const currentWindow = await browser.windows.getCurrent();
        if (!Number.isInteger(message.windowId) || currentWindow?.id !== message.windowId) return { closed:false };
        window.close();
        return { closed:true };
      } catch (error) {
        console.warn("Keepit could not close this ChatGPT panel window", error);
        return { closed:false };
      }
    })();
  });

  function safeConversationUrl(value) {
    if (typeof value !== "string") return "";
    try {
      const url = new URL(value);
      if (url.protocol !== "https:" || !["chatgpt.com", "chat.openai.com"].includes(url.hostname)) return "";
      if (!/^\/c\/[A-Za-z0-9_-]+(?:\/|$)/.test(url.pathname)) return "";
      url.search = "";
      url.hash = "";
      return url.href;
    } catch { return ""; }
  }

  function safePanelTarget(value) {
    if (typeof value !== "string") return "";
    try {
      const url = new URL(value);
      if (url.protocol !== "https:" || !["chatgpt.com", "chat.openai.com"].includes(url.hostname)) return "";
      if (url.pathname !== "/" && !/^\/c\/[A-Za-z0-9_-]+(?:\/|$)/.test(url.pathname)) return "";
      if (url.pathname !== "/") url.search = "";
      return url.href;
    } catch { return ""; }
  }

  function panelUrl(value, linkRequestId = "", sourceUrl = "", restoreDraft = false) {
    const url = new URL(safePanelTarget(value) || safeConversationUrl(value) || DEFAULT_CHATGPT_URL);
    const params = new URLSearchParams(url.hash.replace(/^#/, ""));
    params.set(PANEL_MARKER, "1");
    if (linkRequestId) params.set(LINK_REQUEST_MARKER, linkRequestId);
    else params.delete(LINK_REQUEST_MARKER);
    if (sourceUrl) params.set(SOURCE_URL_MARKER, sourceUrl);
    else params.delete(SOURCE_URL_MARKER);
    if (restoreDraft) params.set(RESTORE_DRAFT_MARKER, "1");
    else params.delete(RESTORE_DRAFT_MARKER);
    url.hash = params.toString();
    return url.href;
  }

  async function clearNavigationRequest(requestId) {
    try {
      const stored = await browser.storage.local.get(NAVIGATION_KEY);
      if (stored?.[NAVIGATION_KEY]?.requestId === requestId) await browser.storage.local.remove(NAVIGATION_KEY);
    } catch (error) { console.warn("Keepit could not clear the ChatGPT navigation request", error); }
  }

  function currentComposerDraft(request) {
    if (!frame || frame.dataset.keepitLoaded !== "true" || !frame.contentWindow) return Promise.resolve({ known:false, hasDraft:false, draftText:"" });
    return new Promise(resolve => {
      let settled = false;
      const timeout = setTimeout(() => finish({ known:false, hasDraft:true, draftText:"" }), 1800);
      const allowedChatGPTOrigins = new Set(["https://chatgpt.com", "https://chat.openai.com"]);
      const finish = result => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        window.removeEventListener("message", onMessage);
        resolve(result);
      };
      const onMessage = event => {
        if (event.source !== frame.contentWindow || !allowedChatGPTOrigins.has(event.origin)) return;
        if (event.data?.type !== "KEEPIT_CHATGPT_PANEL_NAV_GUARD_RESULT" || event.data?.requestId !== request.requestId) return;
        finish({ known:true, hasDraft:event.data.hasDraft === true, draftText:String(event.data.draftText || "") });
      };
      window.addEventListener("message", onMessage);
      frame.contentWindow.postMessage({ type:"KEEPIT_CHATGPT_PANEL_NAV_GUARD", requestId:request.requestId }, "*");
    });
  }

  async function saveSourceDraft(sourceUrl, draftText, conversationUrl) {
    if (!sourceUrl || !String(draftText || "").trim()) return;
    try {
      const stored = await browser.storage.local.get(PAGE_DRAFTS_KEY);
      const drafts = { ...(stored?.[PAGE_DRAFTS_KEY] || {}) };
      drafts[sourceUrl] = { text:String(draftText), conversationUrl:safeConversationUrl(conversationUrl), savedAt:Date.now() };
      await browser.storage.local.set({ [PAGE_DRAFTS_KEY]:drafts });
    } catch (error) { console.warn("Could not save the ChatGPT draft for its source page", error); }
  }

  async function reportBlockedNavigation(request) {
    try {
      await browser.runtime.sendMessage({
        type:"CHATGPT_PANEL_NAVIGATION_BLOCKED",
        sourceTabId:request.sourceTabId,
        linkRequestId:request.linkRequestId || "",
        reason:"composer-not-empty"
      });
    } catch (error) { console.warn("Keepit could not report a protected ChatGPT draft", error); }
  }

  async function navigate(request) {
    if (!request || typeof request.requestId !== "string" || handledNavigationIds.has(request.requestId)) return false;
    if (!Number.isFinite(request.expiresAt) || request.expiresAt <= Date.now()) {
      await clearNavigationRequest(request.requestId);
      return false;
    }
    const target = safePanelTarget(request.targetUrl);
    if (!target) {
      await clearNavigationRequest(request.requestId);
      return false;
    }
    const targetConversation = safeConversationUrl(target);
    const displayedConversation = safeConversationUrl(frame?.dataset?.currentConversationUrl || frame?.src || "");
    if (request.mode === "followup" && frame?.dataset.keepitLoaded === "true" && targetConversation && displayedConversation === targetConversation) {
      const composerState = await currentComposerDraft(request);
      const previousSourceUrl = String(frame.dataset.keepitSourceUrl || "");
      if ((!composerState.known && frame.dataset.keepitLoaded === "true") || (composerState.hasDraft && !previousSourceUrl)) {
        await clearNavigationRequest(request.requestId);
        await reportBlockedNavigation(request);
        return true;
      }
      if (composerState.hasDraft && composerState.draftText.trim()) {
        await saveSourceDraft(previousSourceUrl, composerState.draftText, displayedConversation);
      }
      const latestNavigation = await browser.storage.local.get(NAVIGATION_KEY);
      if (latestNavigation?.[NAVIGATION_KEY]?.requestId !== request.requestId) return true;
      if (request.sourceUrl) {
        frame.dataset.keepitSourceUrl = String(request.sourceUrl);
        try {
          frame.contentWindow.postMessage({ type:"KEEPIT_CHATGPT_PANEL_SOURCE_CONTEXT", sourceUrl:String(request.sourceUrl), restoreDraft:request.sourceUrl !== previousSourceUrl }, "*");
        } catch {}
      }
      handledNavigationIds.add(request.requestId);
      await clearNavigationRequest(request.requestId);
      const wakeFollowup = () => {
        if (!frame.isConnected || !frame.contentWindow) return;
        try { frame.contentWindow.postMessage({ type:"KEEPIT_CHATGPT_PANEL_FOLLOWUP_REQUEST", requestId:String(request.linkRequestId || "") }, "*"); } catch {}
      };
      wakeFollowup();
      setTimeout(wakeFollowup, 350);
      setTimeout(wakeFollowup, 1100);
      return true;
    }
    if (["reopen", "context-switch"].includes(request.mode) && frame?.dataset.keepitLoaded === "true" && targetConversation && displayedConversation === targetConversation) {
      const composerState = await currentComposerDraft(request);
      const previousSourceUrl = String(frame.dataset.keepitSourceUrl || "");
      if ((!composerState.known && frame.dataset.keepitLoaded === "true") || (composerState.hasDraft && !previousSourceUrl)) {
        await clearNavigationRequest(request.requestId);
        await reportBlockedNavigation(request);
        return true;
      }
      const latestNavigation = await browser.storage.local.get(NAVIGATION_KEY);
      if (latestNavigation?.[NAVIGATION_KEY]?.requestId !== request.requestId) return true;
      if (composerState.hasDraft && composerState.draftText.trim() && previousSourceUrl) {
        await saveSourceDraft(previousSourceUrl, composerState.draftText, displayedConversation);
      }
      frame.dataset.keepitSourceUrl = String(request.sourceUrl || previousSourceUrl);
      handledNavigationIds.add(request.requestId);
      await clearNavigationRequest(request.requestId);
      try {
        frame.contentWindow.postMessage({
          type:"KEEPIT_CHATGPT_PANEL_SOURCE_CONTEXT",
          sourceUrl:String(request.sourceUrl || ""),
          restoreDraft:request.mode === "context-switch" || (!!request.sourceUrl && request.sourceUrl !== previousSourceUrl)
        }, "*");
      } catch {}
      return true;
    }
    const composerState = await currentComposerDraft(request);
    const previousSourceUrl = String(frame?.dataset?.keepitSourceUrl || "");
    if (!composerState.known && frame?.dataset?.keepitLoaded === "true") {
      await clearNavigationRequest(request.requestId);
      await reportBlockedNavigation(request);
      return true;
    }
    const latestNavigation = await browser.storage.local.get(NAVIGATION_KEY);
    if (latestNavigation?.[NAVIGATION_KEY]?.requestId !== request.requestId) return true;
    if (composerState.hasDraft) {
      if (!previousSourceUrl || !composerState.draftText.trim()) {
        await clearNavigationRequest(request.requestId);
        await reportBlockedNavigation(request);
        return true;
      }
      await saveSourceDraft(previousSourceUrl, composerState.draftText, frame?.dataset?.currentConversationUrl || "");
    }
    handledNavigationIds.add(request.requestId);
    const requestScopedFlow = request.mode === "new-link" || request.mode === "followup";
    const url = panelUrl(target, requestScopedFlow ? String(request.linkRequestId || "") : "", request.sourceUrl || "", request.mode === "context-switch");
    if (frame) {
      if (request.sourceUrl) frame.dataset.keepitSourceUrl = String(request.sourceUrl);
      if (request.mode === "followup" && request.linkRequestId) {
        delete frame.dataset.currentConversationUrl;
        const wakeFollowup = () => {
          if (!frame.isConnected || !frame.contentWindow) return;
          try { frame.contentWindow.postMessage({ type:"KEEPIT_CHATGPT_PANEL_FOLLOWUP_REQUEST", requestId:String(request.linkRequestId) }, "*"); } catch {}
        };
        frame.addEventListener("load", wakeFollowup, { once:true });
        frame.src = url;
        // Hash-only updates may not fire iframe load; also wake the current same-route document.
        wakeFollowup();
        setTimeout(wakeFollowup, 350);
        setTimeout(wakeFollowup, 1100);
      } else {
        frame.src = url;
      }
    } else {
      await clearNavigationRequest(request.requestId);
      location.replace(url);
      return true;
    }
    await clearNavigationRequest(request.requestId);
    return true;
  }

  async function openPanelPage() {
    try {
      const [stored, activeTabs] = await Promise.all([
        browser.storage.local.get([NAVIGATION_KEY, CONVERSATION_KEY, SOURCE_CONVERSATIONS_KEY, PAGE_DRAFTS_KEY]),
        browser.tabs.query({ active:true, currentWindow:true }).catch(() => [])
      ]);
      const request = stored?.[NAVIGATION_KEY];
      if (request && await navigate(request)) return;
      let sourceUrl = "";
      try {
        const candidate = new URL(String(activeTabs?.[0]?.url || ""));
        if (["http:", "https:"].includes(candidate.protocol)) sourceUrl = candidate.href;
      } catch {}
      const mapped = safeConversationUrl(stored?.[SOURCE_CONVERSATIONS_KEY]?.[sourceUrl]);
      const pageDraft = stored?.[PAGE_DRAFTS_KEY]?.[sourceUrl];
      const draftConversation = safeConversationUrl(pageDraft?.conversationUrl);
      const saved = safeConversationUrl(stored?.[CONVERSATION_KEY]);
      const target = mapped || draftConversation || saved || DEFAULT_CHATGPT_URL;
      const targetUrl = panelUrl(target, "", sourceUrl, !!pageDraft?.text);
      if (frame) {
        if (sourceUrl) frame.dataset.keepitSourceUrl = sourceUrl;
        frame.src = targetUrl;
      } else location.replace(targetUrl);
    } catch (error) {
      console.warn("Keepit could not restore the ChatGPT panel", error);
      const target = panelUrl(DEFAULT_CHATGPT_URL);
      if (frame) frame.src = target;
      else location.replace(target);
    }
  }

  frame?.addEventListener("load", () => {
    if (safePanelTarget(frame.src)) frame.dataset.keepitLoaded = "true";
  });

  window.addEventListener("message", event => {
    if (!frame || event.source !== frame.contentWindow || !["https://chatgpt.com", "https://chat.openai.com"].includes(event.origin)) return;
    if (event.data?.type !== "KEEPIT_CHATGPT_PANEL_CONVERSATION") return;
    const conversationUrl = safeConversationUrl(String(event.data.conversationUrl || ""));
    if (conversationUrl) frame.dataset.currentConversationUrl = conversationUrl;
    else delete frame.dataset.currentConversationUrl;
  });

  browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local" || !changes[NAVIGATION_KEY]?.newValue) return;
    void navigate(changes[NAVIGATION_KEY].newValue);
  });

  void openPanelPage();
})();
