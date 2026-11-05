(() => {
  const NAVIGATION_KEY = "keepitChatGPTPanelNavigationRequest";
  const PANEL_CONTEXTS_KEY = "keepitChatGPTPanelRouteContextByWindow";
  const PANEL_MARKER = "keepit-chatgpt-panel";
  const LINK_REQUEST_MARKER = "keepit-chatgpt-link-request";
  const SOURCE_URL_MARKER = "keepit-chatgpt-source-url";
  const CLEAR_COMPOSER_MARKER = "keepit-chatgpt-clear-composer";
  const SOURCE_CONVERSATIONS_KEY = "keepitChatGPTConversationBySourceUrl";
  const DEFAULT_CHATGPT_URL = "https://chatgpt.com/";
  const frame = document.getElementById("chatgpt-frame");
  const handledNavigationIds = new Set();

  // Chromium versions without sidePanel.close() close the extension page itself as a fallback.
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
      return `${url.origin}${url.pathname.replace(/\/$/, "")}`;
    } catch { return ""; }
  }

  function safePanelRoute(value) {
    if (typeof value !== "string") return "";
    try {
      const url = new URL(value);
      if (url.protocol !== "https:" || !["chatgpt.com", "chat.openai.com"].includes(url.hostname)) return "";
      if (url.pathname !== "/" && !/^\/c\/[A-Za-z0-9_-]+(?:\/|$)/.test(url.pathname)) return "";
      return `${url.origin}${url.pathname === "/" ? "/" : url.pathname.replace(/\/$/, "")}`;
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

  function panelUrl(value, linkRequestId = "", sourceUrl = "", clearComposer = false) {
    const url = new URL(safePanelTarget(value) || safeConversationUrl(value) || DEFAULT_CHATGPT_URL);
    const params = new URLSearchParams(url.hash.replace(/^#/, ""));
    params.set(PANEL_MARKER, "1");
    if (linkRequestId) params.set(LINK_REQUEST_MARKER, linkRequestId);
    else params.delete(LINK_REQUEST_MARKER);
    if (sourceUrl) params.set(SOURCE_URL_MARKER, sourceUrl);
    else params.delete(SOURCE_URL_MARKER);
    if (clearComposer) params.set(CLEAR_COMPOSER_MARKER, "1");
    else params.delete(CLEAR_COMPOSER_MARKER);
    url.hash = params.toString();
    return url.href;
  }

  async function clearNavigationRequest(requestId) {
    try {
      const stored = await browser.storage.local.get(NAVIGATION_KEY);
      if (stored?.[NAVIGATION_KEY]?.requestId === requestId) await browser.storage.local.remove(NAVIGATION_KEY);
    } catch (error) { console.warn("Keepit could not clear the ChatGPT navigation request", error); }
  }

  function sendSourceContext(sourceUrl) {
    if (!frame?.contentWindow || !sourceUrl) return;
    try { frame.contentWindow.postMessage({ type:"KEEPIT_CHATGPT_PANEL_SOURCE_CONTEXT", sourceUrl:String(sourceUrl) }, "*"); }
    catch { /* ChatGPT may be navigating */ }
  }

  function wakeFollowup(requestId) {
    if (!frame?.isConnected || !frame.contentWindow || !requestId) return;
    try { frame.contentWindow.postMessage({ type:"KEEPIT_CHATGPT_PANEL_FOLLOWUP_REQUEST", requestId:String(requestId) }, "*"); }
    catch { /* ChatGPT may be navigating */ }
  }

  function wakeFollowupSoon(requestId) {
    wakeFollowup(requestId);
    setTimeout(() => wakeFollowup(requestId), 350);
    setTimeout(() => wakeFollowup(requestId), 1100);
  }

  function reloadPanelFrame(targetUrl, onTargetLoad) {
    if (!frame) return false;
    frame.dataset.keepitLoaded = "false";
    delete frame.dataset.currentConversationUrl;
    const loadTargetAfterBlank = () => {
      frame.removeEventListener("load", loadTargetAfterBlank);
      if (onTargetLoad) frame.addEventListener("load", onTargetLoad, { once:true });
      frame.src = targetUrl;
    };
    frame.addEventListener("load", loadTargetAfterBlank, { once:true });
    frame.src = "about:blank";
    return true;
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
    const targetRoute = safePanelRoute(target);
    const displayedRoute = safePanelRoute(frame?.dataset?.currentConversationUrl || frame?.src || "");
    const previousSourceUrl = String(frame?.dataset?.keepitSourceUrl || "");
    const sourceContextChanged = !!request.sourceUrl && request.sourceUrl !== previousSourceUrl;
    const sameSourceAndRoute = !sourceContextChanged && !!targetRoute && displayedRoute === targetRoute && frame?.dataset.keepitLoaded === "true";
    const requestScopedFlow = request.mode === "new-link" || request.mode === "followup";
    const linkRequestId = requestScopedFlow ? String(request.linkRequestId || "") : "";

    // A same-source/same-route request does not navigate, but explicit Ask AI still replaces/sends its prompt.
    if (sameSourceAndRoute && ["reopen", "context-switch"].includes(request.mode)) {
      handledNavigationIds.add(request.requestId);
      await clearNavigationRequest(request.requestId);
      return true;
    }
    if (sameSourceAndRoute && request.mode === "followup") {
      if (request.sourceUrl) {
        frame.dataset.keepitSourceUrl = request.sourceUrl;
        sendSourceContext(request.sourceUrl);
      }
      handledNavigationIds.add(request.requestId);
      await clearNavigationRequest(request.requestId);
      wakeFollowupSoon(linkRequestId);
      return true;
    }

    handledNavigationIds.add(request.requestId);
    const url = panelUrl(target, linkRequestId, request.sourceUrl || "", sourceContextChanged);
    const forceSameRouteContextReload = sourceContextChanged && !!targetRoute && displayedRoute === targetRoute && frame?.dataset?.keepitLoaded === "true";
    if (frame) {
      if (request.sourceUrl) frame.dataset.keepitSourceUrl = request.sourceUrl;
      if (request.mode === "followup" && linkRequestId) {
        delete frame.dataset.currentConversationUrl;
        if (forceSameRouteContextReload) {
          reloadPanelFrame(url, () => wakeFollowupSoon(linkRequestId));
        } else {
          frame.addEventListener("load", () => wakeFollowup(linkRequestId), { once:true });
          frame.src = url;
          // Query/hash-only changes may not produce a load event in every embedded browser.
          wakeFollowupSoon(linkRequestId);
        }
      } else if (forceSameRouteContextReload) {
        reloadPanelFrame(url);
      } else {
        frame.src = url;
      }
    } else {
      if (forceSameRouteContextReload) {
        try {
          history.replaceState(history.state, "", url);
          location.reload();
        } catch (error) {
          console.warn("Could not reload the Firefox ChatGPT panel for a new source page", error);
          location.replace(url);
        }
      } else location.replace(url);
      await clearNavigationRequest(request.requestId);
      return true;
    }
    await clearNavigationRequest(request.requestId);
    return true;
  }

  async function getCurrentWindowId() {
    try { return (await browser.windows.getCurrent())?.id; }
    catch { return undefined; }
  }

  async function openPanelPage() {
    try {
      const [stored, activeTabs, windowId] = await Promise.all([
        browser.storage.local.get([NAVIGATION_KEY, SOURCE_CONVERSATIONS_KEY]),
        browser.tabs.query({ active:true, currentWindow:true }).catch(() => []),
        getCurrentWindowId()
      ]);
      const request = stored?.[NAVIGATION_KEY];
      if (request && await navigate(request)) return;
      let sourceUrl = "";
      try {
        const candidate = new URL(String(activeTabs?.[0]?.url || ""));
        if (["http:", "https:"].includes(candidate.protocol)) sourceUrl = candidate.href;
      } catch {}
      let session = {};
      try {
        if (browser.storage.session?.get) session = await browser.storage.session.get(PANEL_CONTEXTS_KEY);
      } catch { /* session-only route metadata is best-effort */ }
      const context = Number.isInteger(windowId) ? session?.[PANEL_CONTEXTS_KEY]?.[String(windowId)] : null;
      const sessionRoute = context?.sourceUrl === sourceUrl ? safePanelRoute(context?.chatUrl) : "";
      const mapped = safeConversationUrl(stored?.[SOURCE_CONVERSATIONS_KEY]?.[sourceUrl]);
      // Reopen only this source's route metadata; never restore a global last-chat URL or composer text.
      const target = sessionRoute || mapped || DEFAULT_CHATGPT_URL;
      const targetUrl = panelUrl(target, "", sourceUrl, true);
      if (frame) {
        if (sourceUrl) frame.dataset.keepitSourceUrl = sourceUrl;
        frame.src = targetUrl;
      } else location.replace(targetUrl);
    } catch (error) {
      console.warn("Keepit could not initialize the ChatGPT panel", error);
      const target = panelUrl(DEFAULT_CHATGPT_URL, "", "", true);
      if (frame) frame.src = target;
      else location.replace(target);
    }
  }

  async function reportPanelRoute(routeValue) {
    const sourceUrl = String(frame?.dataset?.keepitSourceUrl || "");
    const chatUrl = safePanelRoute(routeValue);
    if (!sourceUrl || !chatUrl) return;
    try {
      const windowId = await getCurrentWindowId();
      await browser.runtime.sendMessage({ type:"CHATGPT_PANEL_ROUTE_CONTEXT", sourceUrl, chatUrl, windowId });
    } catch { /* session metadata is best-effort; the exact source mapping remains available */ }
  }

  frame?.addEventListener("load", () => {
    if (safePanelTarget(frame.src)) frame.dataset.keepitLoaded = "true";
    const route = safePanelRoute(frame.src);
    if (route) void reportPanelRoute(route);
  });

  window.addEventListener("message", event => {
    if (!frame || event.source !== frame.contentWindow || !["https://chatgpt.com", "https://chat.openai.com"].includes(event.origin)) return;
    if (event.data?.type !== "KEEPIT_CHATGPT_PANEL_CONVERSATION") return;
    const conversationUrl = safeConversationUrl(String(event.data.conversationUrl || ""));
    if (conversationUrl) frame.dataset.currentConversationUrl = conversationUrl;
    else delete frame.dataset.currentConversationUrl;
    void reportPanelRoute(event.data.routeUrl || conversationUrl || frame.src || DEFAULT_CHATGPT_URL);
  });

  browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local" || !changes[NAVIGATION_KEY]?.newValue) return;
    void navigate(changes[NAVIGATION_KEY].newValue);
  });

  if (globalThis.chrome?.sidePanel) {
    window.addEventListener("pagehide", () => {
      void (async () => {
        try {
          const windowId = await getCurrentWindowId();
          await browser.runtime.sendMessage({ type:"CHATGPT_PANEL_HOST_CLOSED", windowId });
        } catch {}
      })();
    }, { once:true });
  }

  void openPanelPage();
})();
