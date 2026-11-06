// AI panel host: pages/ai-panel.html is the same page in the Chromium side panel and the Firefox
// sidebar (Keepit toolbar above, provider page in an iframe below). One entry and one navigation
// path for ChatGPT, Gemini and Claude (ChatGPT behavior as standard).
(() => {
  "use strict";

  const providers = globalThis.LHN_AI_PROVIDERS;
  if (!providers) return;
  const NAVIGATION_KEY = "keepitAiPanelNavigationRequest";
  const PANEL_CONTEXTS_KEY = "keepitAiPanelRouteContextByWindow";
  const frame = document.getElementById("ai-frame");
  if (!frame) return;
  const isChromiumPanel = !!globalThis.chrome?.sidePanel;
  const handledNavigationIds = new Set();
  let currentProviderId = "chatgpt";
  let currentSourceUrl = "";
  let panelWindowId;
  // AI panel sign-in overlay state (see "AI panel sign-in" below).
  let loginState = null; // { mode:"required"|"waiting", providerId, reason, tabId }
  let frameCheckToken = 0;
  let frameAnswered = true;
  let frameLeftTimer = 0;
  let uiLanguage = "en";
  const loginOverlay = document.getElementById("keepit-ai-login");
  const toolbar = globalThis.LHN_AI_TOOLBAR?.create({
    initialProvider:"chatgpt",
    onProviderChange:providerId => { void switchProvider(providerId); },
    onNewChat:() => openNewChat(),
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
    if (currentProviderId !== "grok" || !provider) return false;
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
    return providers.fromUrl(frame.src);
  }

  function postToFrame(message) {
    const provider = frameProvider();
    if (!frame.isConnected || !frame.contentWindow || !providers.isPanelProvider(provider?.id)) return;
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
    hideLoginOverlay("required");
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
    const previousSourceUrl = String(frame.dataset.keepitSourceUrl || "");
    const sourceContextChanged = !!request.sourceUrl && request.sourceUrl !== previousSourceUrl;
    if (request.sourceUrl) setSourceUrl(request.sourceUrl);
    const plan = providers.planPanelNavigation({
      displayedRoute:currentRoute,
      targetRoute,
      sourceChanged:sourceContextChanged,
      loaded:frame.dataset.keepitLoaded === "true"
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
    if (request.sourceUrl) frame.dataset.keepitSourceUrl = request.sourceUrl;
    frame.dataset.keepitProvider = provider.id;
    if (request.mode === "followup" && linkRequestId) {
      delete frame.dataset.currentConversationUrl;
      if (forceSameRouteContextReload) {
        reloadFrame(url, () => wakeFollowupSoon(linkRequestId));
      } else {
        frame.addEventListener("load", () => wakeFollowup(linkRequestId), { once:true });
        setFrameSrc(url);
        // Query/hash-only changes may not produce a load event in every embedded browser.
        wakeFollowupSoon(linkRequestId);
      }
    } else if (forceSameRouteContextReload) {
      reloadFrame(url);
    } else {
      setFrameSrc(url);
    }
    await clearNavigationRequest(request.requestId);
    return true;
  }

  // A same-AI change may only touch the URL hash (no new document, so no new sign-in report): keep
  // the "sign in" overlay; a new AI document clears or re-shows it through its own reports.
  function setFrameSrc(url) {
    if (loginState?.mode === "required" && providers.fromUrl(url)?.id !== loginState.providerId) hideLoginOverlay("required");
    frame.src = url;
  }

  // Toolbar choice: open the selected AI on this source's mapped conversation, else its start page.
  async function switchProvider(providerId) {
    const provider = providers.get(providerId);
    if (!provider || !providers.isPanelProvider(provider.id)) return false;
    hideLoginOverlay();
    setActiveProvider(provider.id);
    await rememberProvider(provider.id);
    const target = await mappedConversation(provider, currentSourceUrl) || provider.startUrl;
    frame.dataset.keepitLoaded = "false";
    delete frame.dataset.currentConversationUrl;
    frame.dataset.keepitProvider = provider.id;
    if (currentSourceUrl) frame.dataset.keepitSourceUrl = currentSourceUrl;
    setFrameSrc(providers.panelUrl(provider.id, target, { sourceUrl:currentSourceUrl }));
    return true;
  }

  // Toolbar "New chat": the current AI's own new-chat page. The source mapping is unchanged until
  // the user actually sends there (the send flow then adds the label + URL once and remaps).
  function openNewChat() {
    const provider = providers.get(currentProviderId);
    if (!provider || !providers.isPanelProvider(provider.id)) return false;
    hideLoginOverlay();
    frame.dataset.keepitProvider = provider.id;
    if (currentSourceUrl) frame.dataset.keepitSourceUrl = currentSourceUrl;
    return reloadFrame(providers.panelUrl(provider.id, provider.startUrl, { sourceUrl:currentSourceUrl }));
  }

  // Reload the current AI where it was (its conversation, else this source's mapping, else start page).
  async function reloadCurrentProvider() {
    const provider = providers.get(currentProviderId);
    if (!provider || !providers.isPanelProvider(provider.id)) return false;
    const target = displayedRoute(provider.id) || await mappedConversation(provider, currentSourceUrl) || provider.startUrl;
    frame.dataset.keepitProvider = provider.id;
    if (currentSourceUrl) frame.dataset.keepitSourceUrl = currentSourceUrl;
    return reloadFrame(providers.panelUrl(provider.id, target, { sourceUrl:currentSourceUrl }));
  }

  // ---- AI panel sign-in --------------------------------------------------------------------
  // Each AI decides whether sign-in is needed. Keepit reacts only to URLs reported by the provider
  // page (page/composer.js): a sign-in click opens the sign-in page in a new tab and pauses the
  // panel; a sign-in page shown by the AI itself gets a button (Keepit never opens a tab by itself).
  // When that tab returns to the AI after sign-in (or is closed), the panel reloads the AI.
  const LOGIN_TEXT = {
    en:{ waiting:"Waiting for you to sign in to {ai} in the new tab…", required:"{ai} needs you to sign in. Sign in in a new tab, then come back here.", left:"{ai} moved to a page that can't open in the panel (usually a sign-in page). Sign in in a new tab, then come back here.", noComposer:"{ai} shows no chat box in the panel (usually because you are not signed in). Sign in in a new tab, then come back here.", open:"Open sign-in tab", reload:"Reload now", reloadShort:"Reload", cancel:"Cancel", failed:"Could not open a new tab." },
    vi:{ waiting:"Đang chờ bạn đăng nhập {ai} ở tab mới…", required:"{ai} yêu cầu đăng nhập. Hãy đăng nhập ở tab mới rồi quay lại đây.", left:"{ai} đã chuyển sang trang không mở được trong panel (thường là trang đăng nhập). Hãy đăng nhập ở tab mới rồi quay lại đây.", noComposer:"{ai} chưa hiện ô chat trong panel (thường do chưa đăng nhập). Hãy đăng nhập ở tab mới rồi quay lại đây.", open:"Mở tab đăng nhập", reload:"Tải lại ngay", reloadShort:"Tải lại", cancel:"Huỷ", failed:"Không mở được tab mới." },
    ko:{ waiting:"새 탭에서 {ai}에 로그인하기를 기다리는 중…", required:"{ai}에 로그인해야 합니다. 새 탭에서 로그인한 뒤 여기로 돌아오세요.", left:"{ai}이(가) 패널에서 열 수 없는 페이지(보통 로그인 페이지)로 이동했습니다. 새 탭에서 로그인한 뒤 여기로 돌아오세요.", noComposer:"{ai}의 채팅 입력창이 패널에 표시되지 않습니다(보통 로그인하지 않은 경우). 새 탭에서 로그인한 뒤 여기로 돌아오세요.", open:"로그인 탭 열기", reload:"지금 새로고침", reloadShort:"새로고침", cancel:"취소", failed:"새 탭을 열 수 없습니다." }
  };

  function pickLanguage(value) {
    const language = String(value || "").toLowerCase().split(/[-_]/)[0];
    return Object.hasOwn(LOGIN_TEXT, language) ? language : "en";
  }
  async function loadUiLanguage() {
    let language = "";
    try { language = (await browser.storage.local.get("lhnSettings"))?.lhnSettings?.language || ""; } catch {}
    uiLanguage = pickLanguage(language || browser.i18n?.getUILanguage?.());
    if (loginState) renderLoginOverlay();
  }

  function renderLoginOverlay() {
    if (!loginOverlay) return;
    if (!loginState) {
      loginOverlay.hidden = true;
      loginOverlay.replaceChildren();
      return;
    }
    const text = LOGIN_TEXT[uiLanguage];
    const name = providers.get(loginState.providerId)?.name || "AI";
    const box = document.createElement("div");
    box.className = "login-box";
    box.setAttribute("role", "status");
    const message = document.createElement("p");
    message.textContent = (loginState.mode === "waiting" ? text.waiting : loginState.reason === "left-site" ? text.left : loginState.reason === "no-composer" ? text.noComposer : text.required).replace("{ai}", name);
    const actions = document.createElement("div");
    actions.className = "login-actions";
    const button = (label, primary, onClick) => {
      const element = document.createElement("button");
      element.type = "button";
      element.textContent = label;
      if (primary) element.className = "primary";
      element.addEventListener("click", onClick);
      actions.append(element);
      return element;
    };
    if (loginState.mode === "waiting") {
      button(text.reload, true, () => { hideLoginOverlay(); void reloadCurrentProvider(); });
      button(text.cancel, false, () => hideLoginOverlay());
    } else {
      button(text.open, true, () => { void openLoginTab(loginState?.providerId); });
      button(text.reloadShort, false, () => { hideLoginOverlay(); void reloadCurrentProvider(); });
    }
    box.append(message, actions);
    if (loginState.error) {
      const error = document.createElement("p");
      error.className = "login-error";
      error.textContent = text.failed;
      box.append(error);
    }
    loginOverlay.replaceChildren(box);
    loginOverlay.hidden = false;
  }

  // Hide the overlay (only a given mode when one is passed); a hidden waiting overlay stops watching its tab.
  function hideLoginOverlay(mode = "") {
    if (!loginState || (mode && loginState.mode !== mode)) return;
    loginState = null;
    renderLoginOverlay();
  }

  function showLoginRequired(providerId, reason = "login-page") {
    if (loginState?.mode === "waiting") return;
    loginState = { mode:"required", providerId, reason };
    renderLoginOverlay();
  }

  async function openLoginTab(providerId) {
    const provider = providers.get(providerId);
    if (!provider?.loginUrl) return false;
    try {
      const tab = await browser.tabs.create(Number.isInteger(panelWindowId)
        ? { url:provider.loginUrl, active:true, windowId:panelWindowId }
        : { url:provider.loginUrl, active:true });
      loginState = { mode:"waiting", providerId:provider.id, tabId:Number.isInteger(tab?.id) ? tab.id : null };
    } catch (error) {
      console.warn("Keepit could not open the AI sign-in tab", error);
      loginState = { mode:"required", providerId:provider.id, error:true };
    }
    renderLoginOverlay();
    return loginState.mode === "waiting";
  }

  function finishLoginWait() {
    if (loginState?.mode !== "waiting") return;
    hideLoginOverlay();
    void reloadCurrentProvider();
  }

  browser.tabs.onUpdated?.addListener((tabId, changeInfo, tab) => {
    if (loginState?.mode !== "waiting" || tabId !== loginState.tabId || changeInfo?.status !== "complete") return;
    const url = String(tab?.url || "");
    // Signed in: the tab is back on this AI's own pages and no longer on a sign-in page.
    if (providers.fromUrl(url)?.id === loginState.providerId && !providers.isLoginUrl(loginState.providerId, url)) finishLoginWait();
  });
  browser.tabs.onRemoved?.addListener(tabId => {
    if (loginState?.mode === "waiting" && tabId === loginState.tabId) finishLoginWait();
  });
  browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes.lhnSettings) void loadUiLanguage();
  });

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
      if (sourceUrl) frame.dataset.keepitSourceUrl = sourceUrl;
      frame.dataset.keepitProvider = provider.id;
      setFrameSrc(targetUrl);
    } catch (error) {
      console.warn("Keepit could not initialize the AI panel", error);
      setFrameSrc(providers.panelUrl(currentProviderId, providers.get(currentProviderId)?.startUrl, { clearComposer:true }));
    }
  }

  frame.addEventListener("load", () => {
    const provider = frameProvider();
    if (!providers.isPanelProvider(provider?.id)) return;
    frame.dataset.keepitProvider = provider.id;
    frame.dataset.keepitLoaded = "true";
    setActiveProvider(provider.id);
  });

  // The provider page (page/composer.js) reports its live route and sign-in pages; the page itself
  // reports route context to the background, so the route only feeds the panel's navigation plan.
  window.addEventListener("message", event => {
    if (event.source !== frame.contentWindow || !["KEEPIT_AI_PANEL_CONVERSATION", "KEEPIT_AI_PANEL_LOGIN", "KEEPIT_AI_PANEL_HELLO"].includes(event.data?.type)) return;
    const provider = providers.get(event.data.providerId);
    if (!providers.isPanelProvider(provider?.id) || frameProvider()?.id !== provider.id || !provider.origins.includes(event.origin)) return;
    if (event.data.type === "KEEPIT_AI_PANEL_HELLO") {
      // The frame is on the AI: clear only the "left the AI" overlay. Sign-in pages and pages
      // without a chat box report their own state when they load.
      frameAnswered = true;
      if (loginState?.mode === "required" && loginState.reason === "left-site") hideLoginOverlay("required");
      return;
    }
    if (event.data.type === "KEEPIT_AI_PANEL_LOGIN") {
      if (provider.id !== currentProviderId) return;
      if (event.data.reason === "login-click") void openLoginTab(provider.id);
      else if (event.data.reason === "login-page") showLoginRequired(provider.id);
      else if (event.data.reason === "no-composer") showLoginRequired(provider.id, "no-composer");
      else if (event.data.reason === "left-login-page") hideLoginOverlay("required");
      return;
    }
    const route = providers.panelRoute(provider.id, String(event.data.routeUrl || ""));
    if (route) frame.dataset.currentConversationUrl = route;
    else delete frame.dataset.currentConversationUrl;
  });

  // URL-independent fallback: after each frame load (a load can also be only a hash change, with
  // no new document), ask the page whether Keepit's AI page script is there. No answer means the
  // frame left the AI (sign-in page, error page): offer the sign-in tab. Any page can receive the
  // ping (it carries nothing); only the AI's own origin can answer.
  frame.addEventListener("load", () => {
    clearTimeout(frameLeftTimer);
    try { if (frame.contentWindow?.location?.href === "about:blank") return; } catch { /* cross-origin: a real page */ }
    if (frame.getAttribute("src") === "about:blank") return;
    const provider = frameProvider();
    if (!providers.isPanelProvider(provider?.id) || provider.id !== currentProviderId) return;
    const token = ++frameCheckToken;
    frameLeftTimer = setTimeout(() => {
      if (token !== frameCheckToken) return;
      frameAnswered = false;
      try { frame.contentWindow?.postMessage({ type:"KEEPIT_AI_PANEL_PING" }, "*"); } catch { /* frame gone */ }
      frameLeftTimer = setTimeout(() => {
        if (token !== frameCheckToken || frameAnswered || frameProvider()?.id !== provider.id || provider.id !== currentProviderId) return;
        showLoginRequired(provider.id, "left-site");
      }, 1500);
    }, 800);
  });

  browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local" || !changes[NAVIGATION_KEY]?.newValue) return;
    void navigate(changes[NAVIGATION_KEY].newValue);
  });

  // Panel open/closed state: Chromium reports it through sidePanel.onOpened/onClosed; the Firefox
  // sidebar page reports that it opened. Both report when the panel page goes away.
  window.addEventListener("pagehide", () => {
    try { void browser.runtime.sendMessage({ type:"AI_PANEL_HOST_CLOSED", windowId:panelWindowId }).catch(() => {}); } catch {}
  }, { once:true });

  void (async () => {
    panelWindowId = await getCurrentWindowId();
    void loadUiLanguage();
    if (!isChromiumPanel) {
      try { await browser.runtime.sendMessage({ type:"AI_PANEL_CONTEXT_READY", windowId:panelWindowId }); } catch {}
    }
    await openPanelPage();
  })();
})();
