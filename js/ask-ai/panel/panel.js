// AI panel host (pages/ai-panel-chromium.html with the provider iframe, and
// pages/ai-panel-firefox.html which forwards the sidebar to the provider page).
// One entry and one navigation path for ChatGPT, Gemini and Claude (ChatGPT behavior as standard).
(() => {
  "use strict";

  const providers = globalThis.LHN_AI_PROVIDERS;
  if (!providers) return;
  const NAVIGATION_KEY = "keepitAiPanelNavigationRequest";
  const PANEL_CONTEXTS_KEY = "keepitAiPanelRouteContextByWindow";
  const frame = document.getElementById("ai-frame");
  const handledNavigationIds = new Set();
  let currentProviderId = "chatgpt";
  let currentSourceUrl = "";
  const toolbar = frame && globalThis.LHN_AI_TOOLBAR?.create({
    initialProvider:"chatgpt",
    onProviderChange:providerId => { void switchProvider(providerId); },
    onOpenGrokInTab:() => openGrokInNewTab()
  });

  // Chromium versions without sidePanel.close() close the extension page itself as a fallback.
  browser.runtime.onMessage.addListener(message => {
    if (message?.type !== "KEEPIT_CLOSE_AI_PANEL" || !globalThis.chrome?.sidePanel) return;
    return (async () => {
      try {
        const currentWindow = await browser.windows.getCurrent();
        if (!Number.isInteger(message.windowId) || currentWindow?.id !== message.windowId) return { closed:false };
        window.close();
        return { closed:true };
      } catch (error) {
        console.warn("Keepit could not close this AI panel window", error);
        return { closed:false };
      }
    })();
  });

  function openGrokInNewTab() {
    const provider = providers.get("grok");
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

  async function getCurrentWindowId() {
    try { return (await browser.windows.getCurrent())?.id; }
    catch { return undefined; }
  }

  // Same read order as the background getAIProviderForWindow (LHN_AI_PROVIDERS.pickSelectedProvider).
  async function getSavedProvider(windowId) {
    let byWindow = {};
    let lastProviderId = "";
    try { byWindow = (await browser.storage.session?.get?.(providers.SELECTED_BY_WINDOW_KEY))?.[providers.SELECTED_BY_WINDOW_KEY] || {}; } catch {}
    try { lastProviderId = (await browser.storage.local.get(providers.LAST_SELECTED_KEY))?.[providers.LAST_SELECTED_KEY] || ""; } catch {}
    return providers.pickSelectedProvider(byWindow, windowId, lastProviderId);
  }

  async function rememberProvider(providerId) {
    const provider = providers.get(providerId);
    if (!provider) return false;
    const windowId = await getCurrentWindowId();
    try {
      await browser.runtime.sendMessage({ type:"AI_PANEL_PROVIDER_SELECTED", providerId:provider.id, windowId });
      return true;
    } catch { return false; }
  }

  function setActiveProvider(providerId) {
    const provider = providers.get(providerId);
    if (!provider || !providers.isPanelProvider(provider.id)) return false;
    currentProviderId = provider.id;
    toolbar?.setProvider(provider.id, { notify:false });
    return true;
  }

  function frameProvider() {
    return frame ? providers.fromUrl(frame.src) : null;
  }

  function postToFrame(message) {
    const provider = frameProvider();
    if (!frame?.isConnected || !frame.contentWindow || !providers.isPanelProvider(provider?.id)) return;
    try { frame.contentWindow.postMessage(message, new URL(frame.src).origin); }
    catch { /* the provider page may be navigating */ }
  }

  function setSourceUrl(value) {
    currentSourceUrl = providers.normalizeSourceUrl(value);
    toolbar?.setSourceUrl(currentSourceUrl);
    if (frameProvider()?.id === currentProviderId) postToFrame({ type:"KEEPIT_AI_PANEL_SOURCE_CONTEXT", sourceUrl:currentSourceUrl });
    return currentSourceUrl;
  }

  async function mappedConversation(provider, sourceUrl) {
    if (!provider?.conversationMapKey || !sourceUrl) return "";
    try {
      const stored = await browser.storage.local.get(provider.conversationMapKey);
      return providers.normalizeConversationUrl(provider.id, stored?.[provider.conversationMapKey]?.[sourceUrl]);
    } catch { return ""; }
  }

  async function clearNavigationRequest(requestId) {
    try {
      const stored = await browser.storage.local.get(NAVIGATION_KEY);
      if (stored?.[NAVIGATION_KEY]?.requestId === requestId) await browser.storage.local.remove(NAVIGATION_KEY);
    } catch (error) { console.warn("Keepit could not clear the AI panel navigation request", error); }
  }

  function wakeFollowup(requestId) {
    if (requestId) postToFrame({ type:"KEEPIT_AI_PANEL_FOLLOWUP_REQUEST", requestId:String(requestId) });
  }

  function wakeFollowupSoon(requestId) {
    wakeFollowup(requestId);
    setTimeout(() => wakeFollowup(requestId), 350);
    setTimeout(() => wakeFollowup(requestId), 1100);
  }

  function wakeComposerFocus(targetRoute) {
    postToFrame({ type:"KEEPIT_AI_PANEL_FOCUS_COMPOSER", targetRoute:String(targetRoute || "") });
  }

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

  // Live route reported by the provider page, else the last loaded src.
  function displayedRoute(providerId) {
    if (!frame) return "";
    return providers.panelRoute(providerId, frame.dataset.currentConversationUrl || "")
      || providers.panelRoute(providerId, frame.src);
  }

  async function navigate(request) {
    if (!request || typeof request.requestId !== "string" || handledNavigationIds.has(request.requestId)) return false;
    if (!Number.isFinite(request.expiresAt) || request.expiresAt <= Date.now()) {
      await clearNavigationRequest(request.requestId);
      return false;
    }
    const provider = providers.get(request.providerId || "chatgpt");
    const target = providers.isPanelProvider(provider?.id) ? providers.panelTarget(provider.id, request.targetUrl) : "";
    if (!target) {
      await clearNavigationRequest(request.requestId);
      return false;
    }
    setActiveProvider(provider.id);
    const targetRoute = providers.panelRoute(provider.id, target);
    const currentRoute = displayedRoute(provider.id);
    const previousSourceUrl = String(frame?.dataset?.keepitSourceUrl || "");
    const sourceContextChanged = !!request.sourceUrl && request.sourceUrl !== previousSourceUrl;
    if (request.sourceUrl) setSourceUrl(request.sourceUrl);
    const plan = providers.planPanelNavigation({
      displayedRoute:currentRoute,
      targetRoute,
      sourceChanged:sourceContextChanged,
      loaded:frame?.dataset?.keepitLoaded === "true"
    });
    const sameSourceAndRoute = plan === "stay";
    const requestScopedFlow = request.mode === "new-link" || request.mode === "followup";
    const linkRequestId = requestScopedFlow ? String(request.linkRequestId || "") : "";
    const focusComposer = request.mode === "reopen" && request.focusComposer === true;

    // A same-source/same-route request does not navigate, but explicit Ask AI still replaces/sends its prompt.
    if (sameSourceAndRoute && ["reopen", "context-switch"].includes(request.mode)) {
      handledNavigationIds.add(request.requestId);
      if (focusComposer) wakeComposerFocus(targetRoute);
      await clearNavigationRequest(request.requestId);
      return true;
    }
    if (sameSourceAndRoute && request.mode === "followup") {
      if (request.sourceUrl) {
        frame.dataset.keepitSourceUrl = request.sourceUrl;
        setSourceUrl(request.sourceUrl);
      }
      handledNavigationIds.add(request.requestId);
      await clearNavigationRequest(request.requestId);
      wakeFollowupSoon(linkRequestId);
      return true;
    }

    handledNavigationIds.add(request.requestId);
    const url = providers.panelUrl(provider.id, target, {
      linkRequestId,
      sourceUrl:request.sourceUrl || "",
      clearComposer:sourceContextChanged,
      focusComposer
    });
    const forceSameRouteContextReload = plan === "reload";
    if (frame) {
      if (request.sourceUrl) frame.dataset.keepitSourceUrl = request.sourceUrl;
      frame.dataset.keepitProvider = provider.id;
      if (request.mode === "followup" && linkRequestId) {
        delete frame.dataset.currentConversationUrl;
        if (forceSameRouteContextReload) {
          reloadFrame(url, () => wakeFollowupSoon(linkRequestId));
        } else {
          frame.addEventListener("load", () => wakeFollowup(linkRequestId), { once:true });
          frame.src = url;
          // Query/hash-only changes may not produce a load event in every embedded browser.
          wakeFollowupSoon(linkRequestId);
        }
      } else if (forceSameRouteContextReload) {
        reloadFrame(url);
      } else {
        frame.src = url;
      }
    } else {
      if (forceSameRouteContextReload) {
        try {
          history.replaceState(history.state, "", url);
          location.reload();
        } catch (error) {
          console.warn("Could not reload the Firefox AI panel for a new source page", error);
          location.replace(url);
        }
      } else location.replace(url);
      await clearNavigationRequest(request.requestId);
      return true;
    }
    await clearNavigationRequest(request.requestId);
    return true;
  }

  // Toolbar choice: open the selected AI on this source's mapped conversation, else its start page.
  async function switchProvider(providerId) {
    const provider = providers.get(providerId);
    if (!frame || !provider || !providers.isPanelProvider(provider.id)) return false;
    setActiveProvider(provider.id);
    await rememberProvider(provider.id);
    const target = await mappedConversation(provider, currentSourceUrl) || provider.startUrl;
    frame.dataset.keepitLoaded = "false";
    delete frame.dataset.currentConversationUrl;
    frame.dataset.keepitProvider = provider.id;
    if (currentSourceUrl) frame.dataset.keepitSourceUrl = currentSourceUrl;
    frame.src = providers.panelUrl(provider.id, target, { sourceUrl:currentSourceUrl });
    return true;
  }

  async function openPanelPage() {
    try {
      const [stored, activeTabs, windowId] = await Promise.all([
        browser.storage.local.get(NAVIGATION_KEY),
        browser.tabs.query({ active:true, currentWindow:true }).catch(() => []),
        getCurrentWindowId()
      ]);
      const request = stored?.[NAVIGATION_KEY];
      if (request && await navigate(request)) return;
      const sourceUrl = providers.normalizeSourceUrl(activeTabs?.[0]?.url);
      const provider = providers.get(await getSavedProvider(windowId)) || providers.get("chatgpt");
      setActiveProvider(provider.id);
      setSourceUrl(sourceUrl);
      let session = {};
      try {
        if (browser.storage.session?.get) session = await browser.storage.session.get(PANEL_CONTEXTS_KEY);
      } catch { /* session-only route metadata is best-effort */ }
      const context = Number.isInteger(windowId) ? session?.[PANEL_CONTEXTS_KEY]?.[String(windowId)] : null;
      const sessionRoute = context?.sourceUrl === sourceUrl && (context?.providerId || "chatgpt") === provider.id
        ? providers.panelRoute(provider.id, context?.chatUrl) : "";
      // Reopen only this source's route metadata; never restore a global last-chat URL or composer text.
      const target = sessionRoute || await mappedConversation(provider, sourceUrl) || provider.startUrl;
      const targetUrl = providers.panelUrl(provider.id, target, { sourceUrl, clearComposer:true });
      if (frame) {
        if (sourceUrl) frame.dataset.keepitSourceUrl = sourceUrl;
        frame.dataset.keepitProvider = provider.id;
        frame.src = targetUrl;
      } else location.replace(targetUrl);
    } catch (error) {
      console.warn("Keepit could not initialize the AI panel", error);
      const target = providers.panelUrl(currentProviderId, providers.get(currentProviderId)?.startUrl, { clearComposer:true });
      if (frame) frame.src = target;
      else location.replace(target);
    }
  }

  frame?.addEventListener("load", () => {
    const provider = frameProvider();
    if (!providers.isPanelProvider(provider?.id)) return;
    frame.dataset.keepitProvider = provider.id;
    frame.dataset.keepitLoaded = "true";
    setActiveProvider(provider.id);
  });

  // The provider page (page/composer.js) reports its live route; the page itself reports
  // route context to the background, so this only feeds the panel's navigation plan.
  window.addEventListener("message", event => {
    if (!frame || event.source !== frame.contentWindow || event.data?.type !== "KEEPIT_AI_PANEL_CONVERSATION") return;
    const provider = providers.get(event.data.providerId);
    if (!providers.isPanelProvider(provider?.id) || frameProvider()?.id !== provider.id || !provider.origins.includes(event.origin)) return;
    const route = providers.panelRoute(provider.id, String(event.data.routeUrl || ""));
    if (route) frame.dataset.currentConversationUrl = route;
    else delete frame.dataset.currentConversationUrl;
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
          await browser.runtime.sendMessage({ type:"AI_PANEL_HOST_CLOSED", windowId });
        } catch {}
      })();
    }, { once:true });
  }

  void openPanelPage();
})();
