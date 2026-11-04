(() => {
  const CONVERSATION_KEY = "keepitChatGPTLastConversationUrl";
  const NAVIGATION_KEY = "keepitChatGPTPanelNavigationRequest";
  const PANEL_MARKER = "keepit-chatgpt-panel";
  const LINK_REQUEST_MARKER = "keepit-chatgpt-link-request";
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

  function panelUrl(value, linkRequestId = "") {
    const url = new URL(safePanelTarget(value) || safeConversationUrl(value) || DEFAULT_CHATGPT_URL);
    const params = new URLSearchParams(url.hash.replace(/^#/, ""));
    params.set(PANEL_MARKER, "1");
    if (linkRequestId) params.set(LINK_REQUEST_MARKER, linkRequestId);
    else params.delete(LINK_REQUEST_MARKER);
    url.hash = params.toString();
    return url.href;
  }

  async function clearNavigationRequest(requestId) {
    try {
      const stored = await browser.storage.local.get(NAVIGATION_KEY);
      if (stored?.[NAVIGATION_KEY]?.requestId === requestId) await browser.storage.local.remove(NAVIGATION_KEY);
    } catch (error) { console.warn("Keepit could not clear the ChatGPT navigation request", error); }
  }

  function currentComposerHasDraft(request) {
    if (!frame || frame.dataset.keepitLoaded !== "true" || !frame.contentWindow) return Promise.resolve(false);
    return new Promise(resolve => {
      let settled = false;
      const timeout = setTimeout(() => finish(true), 1800); // fail closed if a live panel cannot confirm its draft state
      const allowedChatGPTOrigins = new Set(["https://chatgpt.com", "https://chat.openai.com"]);
      const finish = hasDraft => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        window.removeEventListener("message", onMessage);
        resolve(hasDraft);
      };
      const onMessage = event => {
        if (event.source !== frame.contentWindow || !allowedChatGPTOrigins.has(event.origin)) return;
        if (event.data?.type !== "KEEPIT_CHATGPT_PANEL_NAV_GUARD_RESULT" || event.data?.requestId !== request.requestId) return;
        finish(event.data.hasDraft !== false);
      };
      window.addEventListener("message", onMessage);
      frame.contentWindow.postMessage({ type:"KEEPIT_CHATGPT_PANEL_NAV_GUARD", requestId:request.requestId }, "*");
    });
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
    if (await currentComposerHasDraft(request)) {
      await clearNavigationRequest(request.requestId);
      await reportBlockedNavigation(request);
      return true;
    }
    handledNavigationIds.add(request.requestId);
    const requestScopedFlow = request.mode === "new-link" || request.mode === "followup";
    const url = panelUrl(target, requestScopedFlow ? String(request.linkRequestId || "") : "");
    if (frame) frame.src = url;
    else {
      await clearNavigationRequest(request.requestId);
      location.replace(url);
      return true;
    }
    await clearNavigationRequest(request.requestId);
    return true;
  }

  async function openPanelPage() {
    try {
      const stored = await browser.storage.local.get([NAVIGATION_KEY, CONVERSATION_KEY]);
      const request = stored?.[NAVIGATION_KEY];
      if (request && await navigate(request)) return;
      const saved = safeConversationUrl(stored?.[CONVERSATION_KEY]);
      const target = panelUrl(saved || DEFAULT_CHATGPT_URL);
      if (frame) frame.src = target;
      else location.replace(target);
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

  browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local" || !changes[NAVIGATION_KEY]?.newValue) return;
    void navigate(changes[NAVIGATION_KEY].newValue);
  });

  void openPanelPage();
})();
