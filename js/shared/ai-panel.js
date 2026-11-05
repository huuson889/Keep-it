(() => {
  "use strict";

  const NAVIGATION_KEY = "keepitChatGPTPanelNavigationRequest";
  const LINK_PENDING_KEY = "keepitChatGPTLinkPending";
  const PROVIDER_BY_WINDOW_KEY = "keepitAiPanelProviderByWindow";
  const CHATGPT_PANEL_MARKER = "keepit-chatgpt-panel";
  const CHATGPT_SOURCE_MARKER = "keepit-chatgpt-source-url";
  const CHATGPT_CLEAR_MARKER = "keepit-chatgpt-clear-composer";
  const AI_PANEL_MARKER = "keepit-ai-panel";
  const AI_SOURCE_MARKER = "keepit-ai-source-url";
  const frame = document.getElementById("ai-frame");
  const providers = globalThis.LHN_AI_PROVIDERS;
  const toolbar = frame && globalThis.LHN_AI_TOOLBAR?.create({
    initialProvider:"chatgpt",
    onProviderChange:providerId => { void switchProvider(providerId); },
    onOpenGrokInTab:() => openGrokInNewTab()
  });
  let currentProviderId = "chatgpt";
  let currentSourceUrl = "";
  const commandWaiters = new Map();

  function openGrokInNewTab() {
    const provider = providers?.get("grok");
    if (!frame || currentProviderId !== "grok" || !provider) return false;
    try {
      return browser.tabs.create({ url:provider.startUrl, active:true }).then(() => true).catch(error => {
        console.warn("Keepit could not open Grok in a new tab", error);
        return false;
      });
    } catch (error) {
      console.warn("Keepit could not open Grok in a new tab", error);
      return false;
    }
  }

  function safeSourceUrl(value) {
    try {
      const url = new URL(String(value || ""));
      return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch { return ""; }
  }

  function getProvider(value) {
    return providers?.get(value) || providers?.fromUrl(value) || null;
  }

  async function getCurrentWindowId() {
    try { return (await browser.windows.getCurrent())?.id; }
    catch { return null; }
  }

  // Same read order as background getAIProviderForWindow (LHN_AI_PROVIDERS.pickSelectedProvider).
  async function getSavedProvider(windowId) {
    if (!providers) return "chatgpt";
    let byWindow = {};
    let lastProviderId = "";
    try { byWindow = (await browser.storage.session?.get?.(PROVIDER_BY_WINDOW_KEY))?.[PROVIDER_BY_WINDOW_KEY] || {}; } catch {}
    try { lastProviderId = (await browser.storage.local.get(providers.LAST_SELECTED_KEY))?.[providers.LAST_SELECTED_KEY] || ""; } catch {}
    return providers.pickSelectedProvider(byWindow, windowId, lastProviderId);
  }

  async function rememberProvider(providerId) {
    const provider = providers?.get(providerId);
    if (!provider) return false;
    let windowId = null;
    try { windowId = (await browser.windows.getCurrent())?.id; } catch {}
    try {
      await browser.runtime.sendMessage({ type:"AI_PANEL_PROVIDER_SELECTED", providerId:provider.id, windowId });
      return true;
    } catch { return false; }
  }

  function setSourceUrl(value) {
    currentSourceUrl = safeSourceUrl(value);
    toolbar?.setSourceUrl(currentSourceUrl);
    const frameProvider = frame ? providers?.fromUrl(frame.src) : null;
    if (frameProvider && frameProvider.id === currentProviderId && frame?.contentWindow) {
      try {
        const targetOrigin = new URL(frame.src).origin;
        const message = frameProvider.id === "chatgpt"
          ? { type:"KEEPIT_CHATGPT_PANEL_SOURCE_CONTEXT", sourceUrl:currentSourceUrl }
          : { type:"KEEPIT_AI_PANEL_CONTEXT", providerId:frameProvider.id, sourceUrl:currentSourceUrl };
        frame.contentWindow.postMessage(message, targetOrigin);
      } catch { /* Provider iframe may be navigating. */ }
    }
    return currentSourceUrl;
  }

  function providerTargetUrl(provider, value) {
    const safe = safeProviderUrl(provider, value);
    if (!safe || provider.id === "chatgpt") return safe || provider.startUrl;
    const conversation = providers.normalizeConversationUrl(provider.id, safe);
    if (conversation) return conversation;
    try {
      const target = new URL(safe);
      const start = new URL(provider.startUrl);
      if (target.origin === start.origin && target.pathname === start.pathname) return `${start.origin}${start.pathname}`;
    } catch {}
    return provider.startUrl;
  }

  function firefoxPanelUrl(provider, sourceUrl, request = null) {
    const url = new URL(request?.targetUrl ? providerTargetUrl(provider, request.targetUrl) : provider.startUrl);
    const params = new URLSearchParams(url.hash.replace(/^#/, ""));
    if (provider.id === "chatgpt") {
      params.set(CHATGPT_PANEL_MARKER, "1");
      params.set(CHATGPT_CLEAR_MARKER, "1");
      if (sourceUrl) params.set(CHATGPT_SOURCE_MARKER, sourceUrl);
      else params.delete(CHATGPT_SOURCE_MARKER);
      if (request?.linkRequestId) params.set("keepit-chatgpt-link-request", String(request.linkRequestId));
    } else {
      params.set(AI_PANEL_MARKER, "1");
      if (sourceUrl) params.set(AI_SOURCE_MARKER, sourceUrl);
      else params.delete(AI_SOURCE_MARKER);
      if (request?.linkRequestId) params.set("keepit-ai-link-request", String(request.linkRequestId));
    }
    url.hash = params.toString();
    return url.href;
  }

  async function chatGPTUrlForSource(sourceUrl) {
    if (!sourceUrl) return providers.get("chatgpt").startUrl;
    try {
      const stored = await browser.storage.local.get("keepitChatGPTConversationBySourceUrl");
      const value = String(stored?.keepitChatGPTConversationBySourceUrl?.[sourceUrl] || "");
      const url = new URL(value);
      if (url.protocol !== "https:" || !["chatgpt.com", "chat.openai.com"].includes(url.hostname)) return providers.get("chatgpt").startUrl;
      if (!/^\/c\/[A-Za-z0-9_-]+(?:\/|$)/.test(url.pathname)) return providers.get("chatgpt").startUrl;
      url.search = "";
      url.hash = "";
      return url.href;
    } catch { return providers.get("chatgpt").startUrl; }
  }

  async function providerUrlForSource(provider, sourceUrl) {
    if (!provider || !sourceUrl) return provider?.startUrl || "";
    if (provider.id === "chatgpt") return chatGPTUrlForSource(sourceUrl);
    if (!provider.conversationMapKey) return provider.startUrl;
    try {
      const stored = await browser.storage.local.get(provider.conversationMapKey);
      return safeProviderUrl(provider, providers.normalizeConversationUrl(provider.id, stored?.[provider.conversationMapKey]?.[sourceUrl])) || provider.startUrl;
    } catch { return provider.startUrl; }
  }

  function safeProviderUrl(provider, value) {
    try {
      const url = new URL(String(value || ""));
      if (url.protocol !== "https:" || !provider.hosts.some(host => url.hostname === host || url.hostname.endsWith(`.${host}`))) return "";
      return url.href;
    } catch { return ""; }
  }

  async function chromeProviderUrl(provider, providedUrl = "") {
    if (providedUrl) return providerTargetUrl(provider, providedUrl);
    return providerTargetUrl(provider, await providerUrlForSource(provider, currentSourceUrl));
  }

  function withChatGPTPanelMarkers(value, sourceUrl) {
    const url = new URL(value || providers.get("chatgpt").startUrl);
    const params = new URLSearchParams(url.hash.replace(/^#/, ""));
    params.set(CHATGPT_PANEL_MARKER, "1");
    if (sourceUrl) params.set(CHATGPT_SOURCE_MARKER, sourceUrl);
    else params.delete(CHATGPT_SOURCE_MARKER);
    url.hash = params.toString();
    return url.href;
  }

  async function switchProvider(providerId, { url = "", sourceUrl = currentSourceUrl, notify = true } = {}) {
    const provider = providers?.get(providerId);
    if (!provider || !providers?.isPanelProvider(provider.id)) return false;
    currentSourceUrl = safeSourceUrl(sourceUrl);
    toolbar?.setSourceUrl(currentSourceUrl);
    currentProviderId = provider.id;
    toolbar?.setProvider(provider.id, { notify:false });
    if (notify) await rememberProvider(provider.id);

    if (frame) {
      const target = await chromeProviderUrl(provider, url);
      frame.dataset.keepitLoaded = "false";
      delete frame.dataset.currentConversationUrl;
      frame.src = provider.id === "chatgpt" ? withChatGPTPanelMarkers(target, currentSourceUrl) : target;
      frame.dataset.keepitProvider = provider.id;
      return true;
    }

    try {
      const target = await chromeProviderUrl(provider, url);
      location.replace(firefoxPanelUrl(provider, currentSourceUrl, { targetUrl:target }));
      return true;
    } catch { return false; }
  }

  function setSourceMessage(sourceUrl) {
    const provider = frame ? providers?.fromUrl(frame.src) : null;
    if (!frame?.contentWindow || !provider || provider.id !== currentProviderId) return;
    try {
      const targetOrigin = new URL(frame.src).origin;
      const message = provider.id === "chatgpt"
        ? { type:"KEEPIT_CHATGPT_PANEL_SOURCE_CONTEXT", sourceUrl }
        : { type:"KEEPIT_AI_PANEL_CONTEXT", providerId:provider.id, sourceUrl };
      frame.contentWindow.postMessage(message, targetOrigin);
    } catch { /* Provider iframe may be navigating. */ }
  }

  function sendCommand(provider, type, extra = {}, timeoutMs = 16000) {
    if (!frame?.contentWindow || !provider) return Promise.resolve({ ok:false, error:"panel-frame-unavailable" });
    const requestId = `ai-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return new Promise(resolve => {
      let settled = false;
      const finish = result => {
        if (settled) return;
        settled = true;
        clearInterval(retryTimer);
        clearTimeout(timeout);
        commandWaiters.delete(requestId);
        resolve(result || { ok:false, error:"no-response" });
      };
      const message = { type, requestId, providerId:provider.id, ...extra };
      let firstOrigin = provider.origins[0];
      try {
        const frameOrigin = new URL(frame.src).origin;
        if (provider.origins.includes(frameOrigin)) firstOrigin = frameOrigin;
      } catch {}
      const targetOrigins = [firstOrigin, ...provider.origins.filter(origin => origin !== firstOrigin)];
      let nextOriginIndex = 0;
      const post = () => {
        if (settled) return;
        const targetOrigin = targetOrigins[nextOriginIndex++ % targetOrigins.length];
        try { frame.contentWindow.postMessage(message, targetOrigin); } catch {}
      };
      const retryTimer = setInterval(post, 350);
      const timeout = setTimeout(() => finish({ ok:false, error:"provider-timeout" }), timeoutMs);
      commandWaiters.set(requestId, { providerId:provider.id, finish });
      post();
    });
  }

  window.addEventListener("message", event => {
    if (!frame || event.source !== frame.contentWindow || event.data?.type !== "KEEPIT_AI_RESULT") return;
    const provider = providers?.get(event.data.providerId);
    const waiter = commandWaiters.get(String(event.data.requestId || ""));
    if (!provider || !waiter || waiter.providerId !== provider.id || !provider.origins.includes(event.origin)) return;
    waiter.finish(event.data);
  });

  async function getPending(request) {
    if (!request?.linkRequestId) return null;
    try {
      const stored = await browser.storage.local.get(LINK_PENDING_KEY);
      const pending = stored?.[LINK_PENDING_KEY];
      if (pending?.requestId !== request.linkRequestId || pending.providerId !== request.providerId || typeof pending.prompt !== "string") return null;
      const expiresAt = Number(pending.expiresAt);
      if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
        await removePending(pending.requestId);
        return null;
      }
      return pending;
    } catch { return null; }
  }

  async function removePending(requestId) {
    if (!requestId) return;
    try {
      const stored = await browser.storage.local.get(LINK_PENDING_KEY);
      if (stored?.[LINK_PENDING_KEY]?.requestId === requestId) await browser.storage.local.remove(LINK_PENDING_KEY);
    } catch {}
  }

  // Shared iframe reload for every provider; also used by the ChatGPT controller.
  function reloadFrame(targetUrl, onTargetLoad) {
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

  // Live route reported by the provider page (ChatGPT, Gemini, Claude), else the last loaded src.
  function displayedRoute(providerId) {
    if (!frame) return "";
    return providers.panelRoute(providerId, frame.dataset.currentConversationUrl || "")
      || providers.panelRoute(providerId, frame.src);
  }

  function setActiveProvider(providerId) {
    const provider = providers?.get(providerId);
    if (!provider || !providers?.isPanelProvider(provider.id)) return false;
    currentProviderId = provider.id;
    toolbar?.setProvider(provider.id, { notify:false });
    return true;
  }

  async function navigateRequest(request) {
    const provider = providers?.get(request?.providerId || "chatgpt");
    if (!provider || !providers.isPanelProvider(provider.id) || provider.id === "chatgpt") return false;
    const providerId = provider.id;
    const sourceUrl = safeSourceUrl(request?.sourceUrl) || currentSourceUrl;
    const sourceChanged = !!sourceUrl && sourceUrl !== currentSourceUrl;
    const wasDifferentProvider = currentProviderId !== providerId;
    currentSourceUrl = sourceUrl;
    toolbar?.setSourceUrl(currentSourceUrl);
    toolbar?.setProvider(providerId, { notify:false });
    if (wasDifferentProvider) await rememberProvider(providerId);

    if (!frame) {
      currentProviderId = providerId;
      try { location.replace(firefoxPanelUrl(provider, sourceUrl, request)); return true; }
      catch { return false; }
    }

    const target = await chromeProviderUrl(provider, request.targetUrl);
    const targetRoute = providers.panelRoute(providerId, target);
    const plan = wasDifferentProvider || frame.dataset.keepitProvider !== providerId
      ? "load"
      : providers.planPanelNavigation({
        displayedRoute:displayedRoute(providerId),
        targetRoute,
        sourceChanged,
        loaded:frame.dataset.keepitLoaded === "true"
      });
    currentProviderId = providerId;
    frame.dataset.keepitProvider = providerId;
    const fillRequest = request.linkRequestId && ["new-link", "followup"].includes(request.mode);
    const pending = fillRequest ? await getPending({ ...request, providerId }) : null;

    const afterLoad = async () => {
      setSourceMessage(sourceUrl);
      if (sourceChanged && !fillRequest) await sendCommand(provider, "KEEPIT_AI_CLEAR");
      if (request.mode === "reopen" && request.focusComposer) await sendCommand(provider, "KEEPIT_AI_FOCUS");
      if (pending) {
        const metadata = {
          sourceUrl:pending.sourceUrl,
          linkRequestId:pending.requestId,
          linkMode:pending.mode,
          websiteLabel:pending.websiteLabel || "Website"
        };
        if (pending.mode === "draft-link" || pending.mode === "auto-send-link") await sendCommand(provider, "KEEPIT_AI_CLEAR");
        const result = await sendCommand(provider, "KEEPIT_AI_FILL", { text:pending.prompt, ...metadata });
        if (result?.ok && ["auto-send-link", "auto-send-followup"].includes(pending.mode)) {
          await sendCommand(provider, "KEEPIT_AI_SUBMIT", metadata);
        }
      }
    };

    if (plan !== "stay") {
      await new Promise(resolve => {
        const timer = setTimeout(resolve, 18000);
        const done = () => { clearTimeout(timer); resolve(); };
        // The src attribute can still equal the target after the SPA moved; force a real navigation.
        if (plan === "reload" || providers.panelRoute(providerId, frame.src) === targetRoute) {
          reloadFrame(target, done);
        } else {
          frame.dataset.keepitLoaded = "false";
          delete frame.dataset.currentConversationUrl;
          frame.addEventListener("load", done, { once:true });
          frame.src = target;
        }
      });
    }
    await afterLoad();
    return true;
  }

  window.addEventListener("message", event => {
    if (!frame || event.source !== frame.contentWindow || event.data?.type !== "KEEPIT_AI_PANEL_CONVERSATION") return;
    const provider = providers?.get(event.data.providerId);
    if (!provider || !providers.isPanelProvider(provider.id) || providers.fromUrl(frame.src)?.id !== provider.id
      || !provider.origins.includes(event.origin)) return;
    const route = providers.panelRoute(provider.id, String(event.data.routeUrl || ""));
    if (route) frame.dataset.currentConversationUrl = route;
    else delete frame.dataset.currentConversationUrl;
  });

  frame?.addEventListener("load", () => {
    const provider = providers?.fromUrl(frame.src);
    if (!provider) return;
    currentProviderId = provider.id;
    frame.dataset.keepitProvider = provider.id;
    frame.dataset.keepitLoaded = "true";
    if (providers.isPanelProvider(provider.id) && currentSourceUrl) {
      setTimeout(() => setSourceMessage(currentSourceUrl), 120);
      setTimeout(() => setSourceMessage(currentSourceUrl), 550);
    }
  });

  async function initialize() {
    if (!providers) return;
    const windowId = await getCurrentWindowId();
    const providerId = await getSavedProvider(windowId);
    if (providers.get(providerId)) {
      currentProviderId = providerId;
      toolbar?.setProvider(providerId, { notify:false });
    }
  }

  if (frame) void initialize();

  globalThis.LHN_AI_PANEL = Object.freeze({
    setSourceUrl,
    setActiveProvider,
    setProvider:(providerId, options = {}) => switchProvider(providerId, { ...options, notify:false }),
    switchProvider,
    getProvider:() => currentProviderId,
    getFrame:() => frame,
    navigateRequest,
    reloadFrame,
    displayedRoute,
    getSavedProvider,
    getCurrentWindowId
  });
})();
