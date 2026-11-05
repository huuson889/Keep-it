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
    onProviderChange:providerId => { void switchProvider(providerId); }
  });
  let currentProviderId = "chatgpt";
  let currentSourceUrl = "";
  const commandWaiters = new Map();

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

  async function getSavedProvider(windowId) {
    try {
      const stored = await browser.storage.session?.get?.(PROVIDER_BY_WINDOW_KEY);
      const providerId = stored?.[PROVIDER_BY_WINDOW_KEY]?.[String(windowId)] || "chatgpt";
      return providers?.get(providerId)?.id || "chatgpt";
    } catch { return "chatgpt"; }
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
    if (currentProviderId === "chatgpt" && frameProvider?.id === "chatgpt" && frame?.contentWindow && currentSourceUrl) {
      try {
        const targetOrigin = new URL(frame.src).origin;
        frame.contentWindow.postMessage({ type:"KEEPIT_CHATGPT_PANEL_SOURCE_CONTEXT", sourceUrl:currentSourceUrl }, targetOrigin);
      } catch { /* ChatGPT may be navigating. */ }
    }
    return currentSourceUrl;
  }

  function firefoxPanelUrl(provider, sourceUrl, request = null) {
    const url = new URL(provider.startUrl);
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

  function safeProviderUrl(provider, value) {
    try {
      const url = new URL(String(value || ""));
      if (url.protocol !== "https:" || !provider.hosts.some(host => url.hostname === host || url.hostname.endsWith(`.${host}`))) return "";
      return url.href;
    } catch { return ""; }
  }

  async function chromeProviderUrl(provider, providedUrl = "") {
    if (providedUrl) return safeProviderUrl(provider, providedUrl) || provider.startUrl;
    if (provider.id === "chatgpt") return safeProviderUrl(provider, await chatGPTUrlForSource(currentSourceUrl)) || provider.startUrl;
    return provider.startUrl;
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
    if (!provider) return false;
    currentSourceUrl = safeSourceUrl(sourceUrl);
    toolbar?.setSourceUrl(currentSourceUrl);
    currentProviderId = provider.id;
    toolbar?.setProvider(provider.id, { notify:false });
    if (notify) await rememberProvider(provider.id);

    if (frame) {
      const target = await chromeProviderUrl(provider, url);
      frame.src = provider.id === "chatgpt" ? withChatGPTPanelMarkers(target, currentSourceUrl) : target;
      frame.dataset.keepitProvider = provider.id;
      return true;
    }

    try { location.replace(firefoxPanelUrl(provider, currentSourceUrl)); return true; }
    catch { return false; }
  }

  function setSourceMessage(sourceUrl) {
    if (!frame?.contentWindow || currentProviderId !== "chatgpt" || providers?.fromUrl(frame.src)?.id !== "chatgpt") return;
    try {
      const targetOrigin = new URL(frame.src).origin;
      frame.contentWindow.postMessage({ type:"KEEPIT_CHATGPT_PANEL_SOURCE_CONTEXT", sourceUrl }, targetOrigin);
    } catch { /* ChatGPT may be navigating. */ }
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

  function setActiveProvider(providerId) {
    const provider = providers?.get(providerId);
    if (!provider) return false;
    currentProviderId = provider.id;
    toolbar?.setProvider(provider.id, { notify:false });
    return true;
  }

  async function navigateRequest(request) {
    const providerId = providers?.get(request?.providerId)?.id || "chatgpt";
    if (providerId === "chatgpt") return false;
    const provider = providers.get(providerId);
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

    const shouldLoad = wasDifferentProvider || !frame.dataset.keepitProvider;
    currentProviderId = providerId;
    frame.dataset.keepitProvider = providerId;
    const fillRequest = request.linkRequestId && ["new-link", "followup"].includes(request.mode);
    let pending = null;
    if (fillRequest) pending = await getPending({ ...request, providerId });

    const afterLoad = async () => {
      if (sourceChanged && !fillRequest) await sendCommand(provider, "KEEPIT_AI_CLEAR");
      if (pending) {
        const result = await sendCommand(provider, "KEEPIT_AI_FILL", { text:pending.prompt });
        if (result?.ok) await removePending(pending.requestId);
      }
    };

    if (shouldLoad) {
      const target = await chromeProviderUrl(provider, request.targetUrl);
      await new Promise(resolve => {
        const timer = setTimeout(resolve, 18000);
        frame.addEventListener("load", () => { clearTimeout(timer); resolve(); }, { once:true });
        frame.src = target;
      });
      await afterLoad();
    } else {
      setSourceMessage(sourceUrl);
      await afterLoad();
    }
    return true;
  }

  frame?.addEventListener("load", () => {
    const provider = providers?.fromUrl(frame.src);
    if (!provider) return;
    currentProviderId = provider.id;
    frame.dataset.keepitProvider = provider.id;
    if (provider.id === "chatgpt" && currentSourceUrl) {
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
    getSavedProvider,
    getCurrentWindowId
  });
})();
