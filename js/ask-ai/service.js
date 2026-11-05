// Ask AI background service: AI panel state, provider selection, ChatGPT/Gemini/Claude
// routing and link workflow. Loaded before js/background/background.js (shared global scope);
// CONFIG is only read at call time.
const AI_PROVIDER_FRAME_RULE_ID = 9002;
const AI_PANEL_PROVIDER_BY_WINDOW_KEY = "keepitAiPanelProviderByWindow";
// Same read order as the panel's getSavedProvider (LHN_AI_PROVIDERS.pickSelectedProvider).
async function getAIProviderForWindow(windowId) {
  const providers = globalThis.LHN_AI_PROVIDERS;
  if (!providers) return undefined;
  let providersByWindow = {};
  let lastProviderId = "";
  try { providersByWindow = (await browser.storage.session?.get?.(AI_PANEL_PROVIDER_BY_WINDOW_KEY))?.[AI_PANEL_PROVIDER_BY_WINDOW_KEY] || {}; } catch {}
  try { lastProviderId = (await browser.storage.local.get(providers.LAST_SELECTED_KEY))?.[providers.LAST_SELECTED_KEY] || ""; } catch {}
  return providers.get(providers.pickSelectedProvider(providersByWindow, windowId, lastProviderId));
}
async function rememberAIProviderForWindow(windowId, providerId) {
  const providers = globalThis.LHN_AI_PROVIDERS;
  const provider = providers?.get(providerId);
  if (!provider || !providers.isPanelProvider(provider.id) || !Number.isInteger(windowId)) return false;
  // The last choice persists across refresh, extension reload and browser restart.
  let rememberedLast = false;
  try {
    await browser.storage.local.set({ [providers.LAST_SELECTED_KEY]:provider.id });
    rememberedLast = true;
  } catch {}
  if (!browser.storage.session?.get || !browser.storage.session?.set) return rememberedLast;
  try {
    const stored = await browser.storage.session.get(AI_PANEL_PROVIDER_BY_WINDOW_KEY);
    const providersByWindow = { ...(stored?.[AI_PANEL_PROVIDER_BY_WINDOW_KEY] || {}) };
    providersByWindow[String(windowId)] = provider.id;
    await browser.storage.session.set({ [AI_PANEL_PROVIDER_BY_WINDOW_KEY]:providersByWindow });
    return true;
  } catch { return rememberedLast; }
}
const GROK_SIGN_IN_TAB_STORAGE_PREFIX = "keepitGrokSignInTab:";
const GROK_SIGN_IN_TAB_OPENING = new Set();
const GROK_SIGN_IN_TAB_MEMORY = new Map();
function grokSignInTabStorageKey(windowId) { return `${GROK_SIGN_IN_TAB_STORAGE_PREFIX}${windowId}`; }
async function openGrokSignInTabFromEmbeddedAuth(message, sender) {
  if (!Number.isInteger(sender?.frameId) || sender.frameId <= 0) return { ok:false, error:"not-an-embedded-frame" };
  let senderUrl;
  let extensionOrigin;
  try {
    senderUrl = new URL(String(sender.url || ""));
    const extensionUrl = new URL(browser.runtime.getURL("/"));
    extensionOrigin = `${extensionUrl.protocol}//${extensionUrl.host}`;
  } catch { return { ok:false, error:"invalid-auth-frame" }; }
  const ancestors = Array.isArray(message?.ancestorOrigins) ? message.ancestorOrigins.map(String) : [];
  const hasGrokAncestor = ancestors.some(origin => globalThis.LHN_AI_PROVIDERS?.fromUrl(origin)?.id === "grok");
  if (senderUrl.origin !== "https://accounts.google.com" || message.extensionOrigin !== extensionOrigin
    || !ancestors.includes(extensionOrigin) || !hasGrokAncestor) return { ok:false, error:"auth-frame-not-in-grok-panel" };

  let windowId = sender?.tab?.windowId;
  if (!Number.isInteger(windowId) || windowId < 0) {
    try { windowId = (await browser.windows.getLastFocused({ windowTypes:["normal"] }))?.id; } catch {}
  }
  if (!Number.isInteger(windowId) || windowId < 0) windowId = chatGPTFocusedWindowId;
  if (!Number.isInteger(windowId) || windowId < 0) return { ok:false, error:"panel-window-unavailable" };
  if (GROK_SIGN_IN_TAB_OPENING.has(windowId)) return { ok:true, alreadyOpening:true };

  GROK_SIGN_IN_TAB_OPENING.add(windowId);
  try {
    const key = grokSignInTabStorageKey(windowId);
    let previous = GROK_SIGN_IN_TAB_MEMORY.get(windowId) || null;
    try { previous = (await browser.storage.session.get(key))?.[key] || previous; } catch {}
    if (Number.isInteger(previous?.tabId)) {
      try {
        const existingTab = await browser.tabs.get(previous.tabId);
        if (existingTab && (globalThis.LHN_AI_PROVIDERS?.fromUrl(existingTab.url)?.id === "grok"
          || ["accounts.google.com", "consent.google.com"].includes(new URL(existingTab.url || "").hostname))) {
          const existingWindowId = Number.isInteger(existingTab.windowId) ? existingTab.windowId : windowId;
          try { await browser.windows.update(existingWindowId, { focused:true }); } catch {}
          await browser.tabs.update(existingTab.id, { active:true });
          return { ok:true, alreadyOpen:true };
        }
      } catch {}
    }
    if (Number(previous?.cooldownUntil) > Date.now()) return { ok:false, error:"grok-sign-in-tab-cooldown" };

    const provider = globalThis.LHN_AI_PROVIDERS?.get("grok");
    if (!provider) return { ok:false, error:"grok-provider-unavailable" };
    let tab;
    try { tab = await browser.tabs.create({ url:provider.startUrl, active:true, windowId }); }
    catch { return { ok:false, error:"grok-sign-in-tab-create-failed" }; }
    if (!Number.isInteger(tab?.id)) return { ok:false, error:"grok-sign-in-tab-create-failed" };
    const state = { windowId, tabId:tab.id, cooldownUntil:Date.now() + 60000 };
    GROK_SIGN_IN_TAB_MEMORY.set(windowId, state);
    try { await browser.storage.session.set({ [key]:state }); } catch {}
    try { await browser.windows.update(windowId, { focused:true }); } catch {}
    return { ok:true, opened:true, tabId:tab.id };
  } finally { GROK_SIGN_IN_TAB_OPENING.delete(windowId); }
}
function ensureAIProviderFrameRule(forceUpdate = false) {
  const dnr = globalThis.chrome?.declarativeNetRequest;
  if (!globalThis.chrome?.sidePanel || !dnr?.updateDynamicRules || !dnr?.getDynamicRules) return Promise.resolve(false);
  return dnr.getDynamicRules().then(rules => {
    const domains = ["chatgpt.com", "chat.openai.com", "gemini.google.com", "claude.ai", "grok.com"];
    const existing = rules.find(rule => rule.id === AI_PROVIDER_FRAME_RULE_ID);
    const existingDomains = Array.isArray(existing?.condition?.requestDomains) ? [...existing.condition.requestDomains].sort() : [];
    if (!forceUpdate && existing && JSON.stringify(existingDomains) === JSON.stringify([...domains].sort())
      && !Array.isArray(existing.condition?.initiatorDomains)
      && existing.condition?.resourceTypes?.includes("sub_frame")) return true;
    return dnr.updateDynamicRules({
      removeRuleIds: [AI_PROVIDER_FRAME_RULE_ID],
      addRules: [{
        id: AI_PROVIDER_FRAME_RULE_ID,
        priority: 1,
        action: { type: "modifyHeaders", responseHeaders: [
          { header: "x-frame-options", operation: "remove" },
          { header: "content-security-policy", operation: "remove" }
        ] },
        condition: {
          requestDomains: domains,
          resourceTypes: ["sub_frame"]
        }
      }]
    }).then(() => true);
  });
}
const CHATGPT_DRAFT_PENDING_KEY = "keepitChatGPTDraftPending";
const CHATGPT_PANEL_STATE_KEY = "keepitChatGPTPanelOpenWindowIds";
// URL/selected-text ChatGPT flow; legacy full-page draft keys/handlers remain for rollback.
const CHATGPT_LINK_PENDING_KEY = "keepitChatGPTLinkPending";
const CHATGPT_SOURCE_CONVERSATIONS_KEY = "keepitChatGPTConversationBySourceUrl";
const CHATGPT_PANEL_NAVIGATION_KEY = "keepitChatGPTPanelNavigationRequest";
const CHATGPT_PANEL_SOURCE_URLS_KEY = "keepitChatGPTPanelSourceUrlByWindow";
const CHATGPT_PANEL_CONTEXTS_KEY = "keepitChatGPTPanelRouteContextByWindow";
const LEGACY_CHATGPT_PAGE_DRAFTS_KEY = "keepitChatGPTPageDraftsBySourceUrl";
const LEGACY_CHATGPT_LAST_CONVERSATION_KEY = "keepitChatGPTLastConversationUrl";
const CHATGPT_PAGE_CONTEXT_DELAY_MS = 2000;
let chatGPTPanelOpen = false;
let chatGPTFocusedWindowId = null;
const chatGPTOpenWindows = new Set();
const chatGPTSourceTabs = new Map();
const chatGPTPanelSourceUrls = new Map();
const chatGPTPanelRouteContexts = new Map();
const chatGPTPageContextTimers = new Map();
const chatGPTPageContextRevisions = new Map();
const chatGPTExplicitOpenWindows = new Map();
let chatGPTPanelStateRevision = 0;
let chatGPTPanelStateWrite = Promise.resolve();
async function restoreChatGPTPanelState() {
  try {
    const sessionStorage = browser.storage.session;
    if (!sessionStorage?.get) return new Set();
    const stateAtStart = chatGPTPanelStateRevision;
    const stored = await sessionStorage.get([CHATGPT_PANEL_STATE_KEY, CHATGPT_PANEL_SOURCE_URLS_KEY, CHATGPT_PANEL_CONTEXTS_KEY]);
    const ids = stored?.[CHATGPT_PANEL_STATE_KEY];
    const sourceUrls = stored?.[CHATGPT_PANEL_SOURCE_URLS_KEY];
    const routeContexts = stored?.[CHATGPT_PANEL_CONTEXTS_KEY];
    chatGPTPanelSourceUrls.clear();
    chatGPTPanelRouteContexts.clear();
    for (const [windowId, sourceUrl] of Object.entries(sourceUrls || {})) {
      const id = Number(windowId);
      const normalized = normalizeChatGPTSourceUrl(sourceUrl);
      if (Number.isInteger(id) && id >= 0 && normalized) chatGPTPanelSourceUrls.set(id, normalized);
    }
    for (const [windowId, value] of Object.entries(routeContexts || {})) {
      const id = Number(windowId);
      const sourceUrl = normalizeChatGPTSourceUrl(value?.sourceUrl);
      const chatUrl = normalizeChatGPTPanelRoute(value?.chatUrl);
      if (Number.isInteger(id) && id >= 0 && sourceUrl && chatUrl) chatGPTPanelRouteContexts.set(id, { sourceUrl, chatUrl });
    }
    let openWindows = Array.isArray(ids) ? [...new Set(ids.filter(id => Number.isInteger(id) && id >= 0))] : [];
    let live = null;
    if (browser.windows?.getAll) {
      live = new Set((await browser.windows.getAll()).map(win => win.id));
      openWindows = openWindows.filter(id => live.has(id));
    }
    if (live) {
      for (const id of [...chatGPTPanelSourceUrls.keys()]) if (!live.has(id)) chatGPTPanelSourceUrls.delete(id);
      for (const id of [...chatGPTPanelRouteContexts.keys()]) if (!live.has(id)) chatGPTPanelRouteContexts.delete(id);
    }
    if (chatGPTPanelStateRevision === stateAtStart) {
      chatGPTOpenWindows.clear();
      for (const id of openWindows) chatGPTOpenWindows.add(id);
      chatGPTPanelOpen = chatGPTOpenWindows.size > 0;
    } else {
      openWindows = [...chatGPTOpenWindows];
    }
    return new Set(openWindows);
  } catch (error) {
    console.warn("Could not restore ChatGPT panel toggle state", error);
    return new Set(chatGPTOpenWindows);
  }
}
let chatGPTPanelStateRestoreSnapshot = null;
const chatGPTPanelStateRestorePromise = restoreChatGPTPanelState().then(openWindows => {
  chatGPTPanelStateRestoreSnapshot = openWindows;
  return openWindows;
});
function persistChatGPTPanelState() {
  const sessionStorage = browser.storage.session;
  if (!sessionStorage?.set) return;
  const openWindows = [...chatGPTOpenWindows];
  chatGPTPanelStateWrite = chatGPTPanelStateWrite
    .then(() => sessionStorage.set({
      [CHATGPT_PANEL_STATE_KEY]:openWindows,
      [CHATGPT_PANEL_SOURCE_URLS_KEY]:Object.fromEntries(chatGPTPanelSourceUrls),
      [CHATGPT_PANEL_CONTEXTS_KEY]:Object.fromEntries(chatGPTPanelRouteContexts)
    }))
    .catch(error => console.warn("Could not save ChatGPT panel toggle state", error));
  return chatGPTPanelStateWrite;
}
async function rememberChatGPTPanelSourceUrl(windowId, sourceUrl) {
  const normalized = normalizeChatGPTSourceUrl(sourceUrl);
  if (!Number.isInteger(windowId) || windowId < 0 || !normalized) return;
  await chatGPTPanelStateRestorePromise;
  const previous = chatGPTPanelSourceUrls.get(windowId) || "";
  chatGPTPanelSourceUrls.set(windowId, normalized);
  const currentContext = chatGPTPanelRouteContexts.get(windowId);
  if (!currentContext || currentContext.sourceUrl !== normalized || previous !== normalized) {
    // Do not make an unconfirmed blank route look like saved session context; reopen can fall back to the exact mapping.
    chatGPTPanelRouteContexts.delete(windowId);
  }
  await persistChatGPTPanelState();
}
async function rememberChatGPTPanelRouteContext(windowId, sourceUrl, chatUrl) {
  const source = normalizeChatGPTSourceUrl(sourceUrl);
  const route = normalizeChatGPTPanelRoute(chatUrl);
  if (!Number.isInteger(windowId) || windowId < 0 || !source || !route) return false;
  await chatGPTPanelStateRestorePromise;
  const currentSource = chatGPTPanelSourceUrls.get(windowId);
  if (currentSource && currentSource !== source) return false;
  chatGPTPanelSourceUrls.set(windowId, source);
  chatGPTPanelRouteContexts.set(windowId, { sourceUrl:source, chatUrl:route });
  await persistChatGPTPanelState();
  return true;
}
function cancelChatGPTPageContextSwitch(windowId) {
  if (!Number.isInteger(windowId) || windowId < 0) return;
  const pending = chatGPTPageContextTimers.get(windowId);
  if (pending?.timerId) clearTimeout(pending.timerId);
  chatGPTPageContextTimers.delete(windowId);
  chatGPTPageContextRevisions.set(windowId, (chatGPTPageContextRevisions.get(windowId) || 0) + 1);
}
function nextChatGPTPageContextRevision(windowId) {
  const revision = (chatGPTPageContextRevisions.get(windowId) || 0) + 1;
  chatGPTPageContextRevisions.set(windowId, revision);
  return revision;
}
function markChatGPTExplicitPanelOpen(windowId) {
  if (!Number.isInteger(windowId) || windowId < 0) return;
  const existing = chatGPTExplicitOpenWindows.get(windowId);
  if (existing) clearTimeout(existing);
  const timer = setTimeout(() => chatGPTExplicitOpenWindows.delete(windowId), 10000);
  chatGPTExplicitOpenWindows.set(windowId, timer);
}
function clearChatGPTExplicitPanelOpen(windowId) {
  const timer = chatGPTExplicitOpenWindows.get(windowId);
  if (timer) clearTimeout(timer);
  chatGPTExplicitOpenWindows.delete(windowId);
}
async function chatGPTPanelIsActuallyOpen(windowId) {
  if (!chatGPTPanelIsOpen(windowId)) return false;
  const sidebar = globalThis.browser?.sidebarAction;
  if (typeof sidebar?.isOpen === "function") {
    try {
      const opened = await sidebar.isOpen({ windowId });
      if (!opened) {
        await trackChatGPTPanel(windowId, chatGPTSourceTabs.get(windowId), false);
        return false;
      }
    } catch { /* preserve tracked state when the browser cannot report sidebar state */ }
  }
  return true;
}
async function clearPendingChatGPTPanelRequests(windowId) {
  try {
    const stored = await browser.storage.local.get([CHATGPT_PANEL_NAVIGATION_KEY, CHATGPT_LINK_PENDING_KEY]);
    const navigation = stored?.[CHATGPT_PANEL_NAVIGATION_KEY];
    const link = stored?.[CHATGPT_LINK_PENDING_KEY];
    const keys = [];
    if (navigation?.windowId === windowId) keys.push(CHATGPT_PANEL_NAVIGATION_KEY);
    if (link?.windowId === windowId) keys.push(CHATGPT_LINK_PENDING_KEY);
    if (keys.length) await browser.storage.local.remove(keys);
  } catch (error) { console.warn("Could not clear unfinished ChatGPT panel requests", error); }
}
async function clearSupersededChatGPTRequests(windowId, sourceUrl, revision) {
  try {
    const stored = await browser.storage.local.get([CHATGPT_PANEL_NAVIGATION_KEY, CHATGPT_LINK_PENDING_KEY]);
    if (chatGPTPageContextRevisions.get(windowId) !== revision) return;
    const navigation = stored?.[CHATGPT_PANEL_NAVIGATION_KEY];
    const link = stored?.[CHATGPT_LINK_PENDING_KEY];
    const keys = [];
    if (navigation?.windowId === windowId && navigation.sourceUrl && navigation.sourceUrl !== sourceUrl) keys.push(CHATGPT_PANEL_NAVIGATION_KEY);
    if (link?.windowId === windowId && link.sourceUrl && link.sourceUrl !== sourceUrl) keys.push(CHATGPT_LINK_PENDING_KEY);
    if (keys.length) await browser.storage.local.remove(keys);
  } catch (error) { console.warn("Could not clear superseded ChatGPT source requests", error); }
}
async function queueChatGPTPageContext(tab, delayMs = CHATGPT_PAGE_CONTEXT_DELAY_MS, revision = null, deadline = null) {
  const sourceUrl = normalizeChatGPTSourceUrl(tab?.url);
  const windowId = Number.isInteger(tab?.windowId) ? tab.windowId : null;
  let sourceHost = "";
  try { sourceHost = new URL(sourceUrl).hostname; } catch {}
  if (!sourceUrl || ["chatgpt.com", "chat.openai.com"].includes(sourceHost) || !Number.isInteger(windowId)) return false;
  if (!Number.isInteger(revision)) revision = nextChatGPTPageContextRevision(windowId);
  await chatGPTPanelStateRestorePromise;
  if (chatGPTPageContextRevisions.get(windowId) !== revision) return false;
  if (!await chatGPTPanelIsActuallyOpen(windowId)) return false;
  if (chatGPTSourceTabs.get(windowId) !== tab.id) return false;
  const currentSourceUrl = chatGPTPanelSourceUrls.get(windowId) || "";
  const oldTimer = chatGPTPageContextTimers.get(windowId);
  if (oldTimer?.timerId) clearTimeout(oldTimer.timerId);
  chatGPTPageContextTimers.delete(windowId);
  if (currentSourceUrl === sourceUrl) return false;
  const pending = { revision, sourceUrl, tabId:tab.id, timerId:null };
  pending.timerId = setTimeout(() => {
    void (async () => {
      if (chatGPTPageContextRevisions.get(windowId) !== revision) return;
      if (chatGPTPageContextTimers.get(windowId) === pending) chatGPTPageContextTimers.delete(windowId);
      if (!await chatGPTPanelIsActuallyOpen(windowId)) return;
      let activeTab = null;
      try { activeTab = (await browser.tabs.query({ active:true, windowId }))?.[0] || null; } catch {}
      if (chatGPTPageContextRevisions.get(windowId) !== revision || activeTab?.id !== tab.id || normalizeChatGPTSourceUrl(activeTab?.url) !== sourceUrl) return;
      if ((chatGPTPanelSourceUrls.get(windowId) || "") === sourceUrl) return;
      try {
        await clearSupersededChatGPTRequests(windowId, sourceUrl, revision);
        if (chatGPTPageContextRevisions.get(windowId) !== revision) return;
        const selectedProvider = await getAIProviderForWindow(windowId);
        if (chatGPTPageContextRevisions.get(windowId) !== revision) return;
        const mappingKey = selectedProvider?.conversationMapKey || "";
        const stored = mappingKey ? await browser.storage.local.get(mappingKey) : {};
        if (chatGPTPageContextRevisions.get(windowId) !== revision) return;
        const mapped = selectedProvider?.id === "chatgpt"
          ? safeChatGPTConversationUrl(stored?.[mappingKey]?.[sourceUrl])
          : globalThis.LHN_AI_PROVIDERS?.normalizeConversationUrl(selectedProvider?.id, stored?.[mappingKey]?.[sourceUrl]) || "";
        const request = {
          requestId:`context-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          windowId,
          sourceTabId:Number.isInteger(tab?.id) ? tab.id : null,
          sourceUrl,
          providerId:selectedProvider?.id || "chatgpt",
          mode:"context-switch",
          targetUrl:mapped || selectedProvider?.startUrl || "https://chatgpt.com/",
          expiresAt:Date.now() + 60000
        };
        await rememberChatGPTPanelSourceUrl(windowId, sourceUrl);
        if (chatGPTPageContextRevisions.get(windowId) !== revision) return;
        await browser.storage.local.set({ [CHATGPT_PANEL_NAVIGATION_KEY]:request });
        if (chatGPTPageContextRevisions.get(windowId) !== revision) {
          const latest = await browser.storage.local.get(CHATGPT_PANEL_NAVIGATION_KEY);
          if (latest?.[CHATGPT_PANEL_NAVIGATION_KEY]?.requestId === request.requestId) await browser.storage.local.remove(CHATGPT_PANEL_NAVIGATION_KEY);
        }
      } catch (error) { console.warn("Could not switch ChatGPT to the active source page", error); }
    })();
  }, Number.isFinite(deadline) ? Math.max(0, deadline - Date.now()) : Math.max(0, Number(delayMs) || 0));
  chatGPTPageContextTimers.set(windowId, pending);
  return true;
}
browser.tabs.onUpdated?.addListener((tabId, changeInfo, tab) => {
  const urlChanged = typeof changeInfo?.url === "string";
  if ((!urlChanged && changeInfo?.status !== "complete") || !Number.isInteger(tab?.windowId)) return;
  if (chatGPTSourceTabs.get(tab.windowId) !== tabId) return;
  const revision = nextChatGPTPageContextRevision(tab.windowId);
  const deadline = Date.now() + CHATGPT_PAGE_CONTEXT_DELAY_MS;
  const updatedTab = urlChanged ? { ...tab, url:changeInfo.url } : tab;
  void queueChatGPTPageContext(updatedTab, CHATGPT_PAGE_CONTEXT_DELAY_MS, revision, deadline);
});
browser.tabs.onActivated?.addListener(async ({ windowId, tabId }) => {
  if (!Number.isInteger(windowId)) return;
  const deadline = Date.now() + CHATGPT_PAGE_CONTEXT_DELAY_MS;
  chatGPTFocusedWindowId = windowId;
  const wasTrackedOpen = chatGPTOpenWindows.has(windowId);
  const previousTabId = chatGPTSourceTabs.get(windowId);
  if (Number.isInteger(previousTabId) && previousTabId !== tabId) void setChatGPTPageScrollbar(previousTabId, false);
  if (wasTrackedOpen) {
    chatGPTSourceTabs.set(windowId, tabId);
    void setChatGPTPageScrollbar(tabId, true);
    const revision = nextChatGPTPageContextRevision(windowId);
    try { void browser.tabs.get(tabId).then(tab => queueChatGPTPageContext(tab, CHATGPT_PAGE_CONTEXT_DELAY_MS, revision, deadline)).catch(() => {}); } catch {}
  }
  const sidebar = globalThis.browser?.sidebarAction;
  if (typeof sidebar?.isOpen === "function") {
    try {
      const opened = await sidebar.isOpen({ windowId });
      if (opened) {
        await trackChatGPTPanel(windowId, tabId, true);
        if (!wasTrackedOpen && Number.isInteger(tabId)) {
          const revision = nextChatGPTPageContextRevision(windowId);
          try { void browser.tabs.get(tabId).then(tab => queueChatGPTPageContext(tab, CHATGPT_PAGE_CONTEXT_DELAY_MS, revision, deadline)).catch(() => {}); } catch {}
        }
      } else if (chatGPTOpenWindows.has(windowId)) await trackChatGPTPanel(windowId, tabId, false);
    } catch { /* Firefox may not report sidebar state for a closing window */ }
  }
});
browser.windows?.onFocusChanged?.addListener(windowId => { if (Number.isInteger(windowId) && windowId >= 0) chatGPTFocusedWindowId = windowId; });
browser.windows?.onRemoved?.addListener(windowId => {
  cancelChatGPTPageContextSwitch(windowId);
  clearChatGPTExplicitPanelOpen(windowId);
  void clearPendingChatGPTPanelRequests(windowId);
  chatGPTOpenWindows.delete(windowId);
  chatGPTPanelStateRestoreSnapshot?.delete(windowId);
  chatGPTSourceTabs.delete(windowId);
  chatGPTPanelSourceUrls.delete(windowId);
  chatGPTPanelRouteContexts.delete(windowId);
  chatGPTPanelOpen = chatGPTOpenWindows.size > 0;
  chatGPTPanelStateRevision++;
  return persistChatGPTPanelState();
});
function chatGPTWindowId(sourceTab) {
  return Number.isInteger(sourceTab?.windowId) ? sourceTab.windowId : chatGPTFocusedWindowId ?? globalThis.chrome?.windows?.WINDOW_ID_CURRENT ?? -2;
}
function chatGPTPanelIsOpen(windowId) {
  if (Number.isInteger(windowId) && windowId >= 0) return chatGPTOpenWindows.has(windowId) || (chatGPTPanelOpen && chatGPTFocusedWindowId === windowId);
  return chatGPTPanelOpen || chatGPTOpenWindows.size > 0;
}
async function setChatGPTPageScrollbar(tabId, open) {
  if (!Number.isInteger(tabId)) return;
  try { await browser.tabs.sendMessage(tabId, { type:"CHATGPT_PANEL_VISIBILITY", open:!!open }); }
  catch { /* unsupported/restricted tabs have no Keepit content script */ }
}
async function closeChromeChatGPTPanel(windowId, chromePanel) {
  if (typeof chromePanel?.close === "function") {
    await chromePanel.close({ windowId });
    return true;
  }
  try {
    const response = await browser.runtime.sendMessage({ type:"KEEPIT_CLOSE_CHATGPT_PANEL", windowId });
    return response?.closed === true;
  } catch (error) {
    console.warn("Could not close the legacy Chromium ChatGPT side panel", error);
    return false;
  }
}
function trackChatGPTPanel(windowId, tabId, open) {
  if (Number.isInteger(windowId) && !open) {
    cancelChatGPTPageContextSwitch(windowId);
    clearChatGPTExplicitPanelOpen(windowId);
    void clearPendingChatGPTPanelRequests(windowId);
  }
  const targetTabId = Number.isInteger(tabId) ? tabId : (Number.isInteger(windowId) ? chatGPTSourceTabs.get(windowId) : null);
  if (Number.isInteger(windowId) && windowId >= 0) {
    if (open) chatGPTOpenWindows.add(windowId); else chatGPTOpenWindows.delete(windowId);
    if (Number.isInteger(tabId)) chatGPTSourceTabs.set(windowId, tabId);
    else if (!open) chatGPTSourceTabs.delete(windowId);
  }
  chatGPTPanelOpen = open ? true : chatGPTOpenWindows.size > 0;
  if (chatGPTPanelStateRestoreSnapshot) {
    if (Number.isInteger(windowId) && windowId >= 0) {
      if (open) chatGPTPanelStateRestoreSnapshot.add(windowId);
      else chatGPTPanelStateRestoreSnapshot.delete(windowId);
    }
  }
  chatGPTPanelStateRevision++;
  const persisted = persistChatGPTPanelState();
  void setChatGPTPageScrollbar(targetTabId, open);
  return persisted;
}
globalThis.chrome?.sidePanel?.onOpened?.addListener(async info => {
  const windowId = info?.windowId;
  let tabId = info?.tabId ?? (Number.isInteger(windowId) ? chatGPTSourceTabs.get(windowId) : null);
  if (!Number.isInteger(tabId) && Number.isInteger(windowId)) {
    try { tabId = (await browser.tabs.query({ active:true, windowId }))?.[0]?.id; } catch {}
  }
  await trackChatGPTPanel(windowId, tabId, true);
  if (chatGPTExplicitOpenWindows.has(windowId)) return;
  try {
    const requestState = await browser.storage.local.get([CHATGPT_PANEL_NAVIGATION_KEY, CHATGPT_LINK_PENDING_KEY]);
    const nav = requestState?.[CHATGPT_PANEL_NAVIGATION_KEY];
    const link = requestState?.[CHATGPT_LINK_PENDING_KEY];
    if ((nav?.windowId === windowId && nav.mode !== "context-switch") || link?.windowId === windowId) return;
  } catch {}
  if (Number.isInteger(tabId)) {
    const revision = nextChatGPTPageContextRevision(windowId);
    try { const tab = await browser.tabs.get(tabId); void queueChatGPTPageContext(tab, 0, revision); } catch {}
  }
});
globalThis.chrome?.sidePanel?.onClosed?.addListener(async info => {
  const windowId = info?.windowId;
  const tabId = info?.tabId ?? (Number.isInteger(windowId) ? chatGPTSourceTabs.get(windowId) : null);
  await trackChatGPTPanel(windowId, tabId, false);
});
async function openChatGPTSidePanel({ sender, tab, toggle = true } = {}) {
  const sourceTab = tab || sender?.tab;
  const windowId = chatGPTWindowId(sourceTab);
  const chromePanel = globalThis.chrome?.sidePanel;
  if (typeof chromePanel?.open === "function") {
    try {
      const alreadyOpen = chatGPTPanelIsOpen(windowId);
      if (!toggle && alreadyOpen) {
        await trackChatGPTPanel(windowId, sourceTab?.id, true);
        return { ok:true, browser:"chromium", opened:true, toggled:false };
      }
      const stateRevisionAtToggle = chatGPTPanelStateRevision;
      if (toggle && alreadyOpen) {
        const closed = await closeChromeChatGPTPanel(windowId, chromePanel);
        if (!closed) return { ok:false, error:"panel-close-failed" };
        await trackChatGPTPanel(windowId, sourceTab?.id, false);
        return { ok:true, browser:"chromium", opened:false, toggled:true };
      }
      // Keep open() in the original user-gesture turn. Selected-text requests are
      // open-or-keep-open; Alt+X and existing launchers retain their toggle behavior.
      const openPromise = chromePanel.open({ windowId });
      await openPromise;
      if (toggle && !alreadyOpen) {
        const restoredOpenWindows = await chatGPTPanelStateRestorePromise;
        if (chatGPTPanelStateRevision === stateRevisionAtToggle && restoredOpenWindows.has(windowId)) {
          const closed = await closeChromeChatGPTPanel(windowId, chromePanel);
          if (closed) {
            await trackChatGPTPanel(windowId, sourceTab?.id, false);
            return { ok:true, browser:"chromium", opened:false, toggled:true };
          }
        }
      }
      await trackChatGPTPanel(windowId, sourceTab?.id, true);
      if (Number.isInteger(sourceTab?.id)) {
        const revision = nextChatGPTPageContextRevision(windowId);
        void queueChatGPTPageContext(sourceTab, 0, revision);
      }
      return { ok:true, browser:"chromium", opened:true, toggled:toggle };
    } catch (error) {
      const reason = String(error?.message || error || "unknown-error");
      console.warn("Could not open the ChatGPT Chrome side panel", reason);
      return { ok:false, error:"panel-toggle-failed", reason };
    }
  }
  const firefoxSidebar = globalThis.browser?.sidebarAction;
  if (typeof firefoxSidebar?.toggle === "function") {
    try {
      const sidebarOptions = Number.isInteger(sourceTab?.windowId) ? { windowId:sourceTab.windowId } : {};
      if (!toggle && chatGPTPanelIsOpen(windowId)) {
        await trackChatGPTPanel(windowId, sourceTab?.id, true);
        return { ok:true, browser:"firefox", opened:true, toggled:false };
      }
      // Call open/toggle before awaiting anything so Firefox keeps the user-gesture context.
      const sidebarPromise = toggle
        ? firefoxSidebar.toggle()
        : (typeof firefoxSidebar.open === "function" ? firefoxSidebar.open(sidebarOptions) : firefoxSidebar.toggle());
      await sidebarPromise;
      let opened = true;
      if (typeof firefoxSidebar.isOpen === "function") {
        try { opened = await firefoxSidebar.isOpen(sidebarOptions); }
        catch (error) { console.warn("Could not read Firefox sidebar state after opening", error); }
      }
      await trackChatGPTPanel(windowId, sourceTab?.id, opened);
      if (opened && Number.isInteger(sourceTab?.id)) {
        const revision = nextChatGPTPageContextRevision(windowId);
        void queueChatGPTPageContext(sourceTab, 0, revision);
      }
      return { ok:true, browser:"firefox", opened, toggled:toggle };
    } catch (error) {
      const reason = String(error?.message || error || "unknown-error");
      console.warn("Could not open the ChatGPT Firefox sidebar", reason);
      return { ok:false, error:"panel-toggle-failed", reason };
    }
  }
  return { ok:false, error:"side-panel-unsupported" };
}

// ChatGPT prompt flow: uses the current tab URL and, only for Ask AI, the explicit text selection; never requests page body/title.
function normalizeChatGPTSourceUrl(value) {
  try {
    const url = new URL(String(value || ""));
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch { return ""; }
}
function safeChatGPTConversationUrl(value) {
  try {
    const url = new URL(String(value || ""));
    if (url.protocol !== "https:" || !["chatgpt.com", "chat.openai.com"].includes(url.hostname)) return "";
    if (!/^\/c\/[A-Za-z0-9_-]+(?:\/|$)/.test(url.pathname)) return "";
    url.search = "";
    url.hash = "";
    return url.href;
  } catch { return ""; }
}
function normalizeChatGPTPanelRoute(value) {
  try {
    const url = new URL(String(value || ""));
    if (url.protocol !== "https:" || !["chatgpt.com", "chat.openai.com"].includes(url.hostname)) return "";
    if (url.pathname !== "/" && !/^\/c\/[A-Za-z0-9_-]+(?:\/|$)/.test(url.pathname)) return "";
    url.search = "";
    url.hash = "";
    return `${url.origin}${url.pathname === "/" ? "/" : url.pathname.replace(/\/$/, "")}`;
  } catch { return ""; }
}
function normalizeChatGPTInstruction(value, fallback) {
  const normalized = String(value ?? "").replace(/\s+/g, " ").trim().slice(0, 500);
  return normalized || String(fallback || "").trim();
}
function getChatGPTPromptLanguage(settings) {
  const supported = ["en", "vi", "ko"];
  if (supported.includes(settings?.language)) return settings.language;
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    if (zone === "Asia/Ho_Chi_Minh") return "vi";
    if (zone === "Asia/Seoul") return "ko";
  } catch {}
  try {
    const locale = String(browser.i18n?.getUILanguage?.() || "en").toLowerCase();
    if (locale.startsWith("vi")) return "vi";
    if (locale.startsWith("ko")) return "ko";
  } catch {}
  return "en";
}
async function getChatGPTPromptSettings() {
  const stored = await browser.storage.local.get(CONFIG.STORAGE_KEYS.SETTINGS);
  const settings = stored?.[CONFIG.STORAGE_KEYS.SETTINGS] || {};
  const language = getChatGPTPromptLanguage(settings);
  return {
    autoSend:settings.chatGPTAutoSend === true,
    language,
    websiteLabel:globalThis.LHN_CHATGPT_PROMPTS.websiteLabel(language),
    summaryPrompt:globalThis.LHN_CHATGPT_PROMPTS.resolve(language, "chatGPTSummaryPrompt", settings.chatGPTSummaryPrompt),
    askPrompt:globalThis.LHN_CHATGPT_PROMPTS.resolve(language, "chatGPTAskPrompt", settings.chatGPTAskPrompt)
  };
}
async function prepareChatGPTManualLinkSend(message, sender) {
  const sourceUrl = normalizeChatGPTSourceUrl(message?.sourceUrl);
  if (!sourceUrl) return { ok:false, error:"source-url-unavailable" };
  const senderWindowId = Number.isInteger(sender?.tab?.windowId) ? sender.tab.windowId : null;
  const windowId = Number.isInteger(senderWindowId) ? senderWindowId : chatGPTFocusedWindowId;
  if (!Number.isInteger(windowId)) return { ok:false, error:"panel-window-unavailable" };
  await chatGPTPanelStateRestorePromise;
  if (!await chatGPTPanelIsActuallyOpen(windowId)) return { ok:false, error:"panel-not-open" };
  const currentSource = chatGPTPanelSourceUrls.get(windowId) || "";
  if (currentSource && currentSource !== sourceUrl) return { ok:false, stale:true };
  if (!currentSource) await rememberChatGPTPanelSourceUrl(windowId, sourceUrl);

  const mappingData = await browser.storage.local.get(CHATGPT_SOURCE_CONVERSATIONS_KEY);
  if (safeChatGPTConversationUrl(mappingData?.[CHATGPT_SOURCE_CONVERSATIONS_KEY]?.[sourceUrl])) {
    return { ok:true, mapped:true };
  }

  const settings = await getChatGPTPromptSettings();
  const pendingData = await browser.storage.local.get(CHATGPT_LINK_PENDING_KEY);
  const existing = pendingData?.[CHATGPT_LINK_PENDING_KEY];
  if (existing && existing.expiresAt > Date.now() && existing.windowId === windowId && existing.sourceUrl === sourceUrl
      && ["draft-link", "manual-link"].includes(existing.mode)) {
    return { ok:true, mapped:false, requestId:existing.requestId, mode:existing.mode, websiteLabel:settings.websiteLabel };
  }
  if (existing && existing.expiresAt > Date.now() && Number.isInteger(existing.windowId) && existing.windowId !== windowId) {
    return { ok:false, error:"another-panel-request-active" };
  }

  const requestId = `link-manual-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const pending = {
    requestId,
    windowId,
    sourceTabId:null,
    sourceUrl,
    mode:"manual-link",
    expiresAt:Date.now() + 120000
  };
  await browser.storage.local.set({ [CHATGPT_LINK_PENDING_KEY]:pending });
  setTimeout(() => { void clearExpiredChatGPTLinkPending(requestId); }, 121000);
  return { ok:true, mapped:false, requestId, mode:pending.mode, websiteLabel:settings.websiteLabel };
}
async function prepareAIProviderManualLinkSend(message, sender) {
  const providers = globalThis.LHN_AI_PROVIDERS;
  const provider = providers?.get(message?.providerId);
  const senderProvider = providers?.fromUrl(sender?.url);
  if (!provider || !["gemini", "claude"].includes(provider.id) || senderProvider?.id !== provider.id) {
    return { ok:false, error:"invalid-ai-provider" };
  }
  const sourceUrl = normalizeChatGPTSourceUrl(message?.sourceUrl);
  if (!sourceUrl) return { ok:false, error:"source-url-unavailable" };
  const senderWindowId = Number.isInteger(sender?.tab?.windowId) ? sender.tab.windowId : null;
  const windowId = Number.isInteger(senderWindowId) ? senderWindowId : chatGPTFocusedWindowId;
  if (!Number.isInteger(windowId)) return { ok:false, error:"panel-window-unavailable" };
  await chatGPTPanelStateRestorePromise;
  if (!await chatGPTPanelIsActuallyOpen(windowId)) return { ok:false, error:"panel-not-open" };
  if ((await getAIProviderForWindow(windowId))?.id !== provider.id) return { ok:false, error:"provider-not-selected" };
  const sourceTabId = chatGPTSourceTabs.get(windowId);
  if (Number.isInteger(sourceTabId)) {
    try {
      const sourceTab = await browser.tabs.get(sourceTabId);
      const liveSourceUrl = normalizeChatGPTSourceUrl(sourceTab?.url);
      if (liveSourceUrl && liveSourceUrl !== sourceUrl) return { ok:false, stale:true };
    } catch { /* Keep the panel's validated source when the browser hides the tab URL. */ }
  }
  const currentSource = chatGPTPanelSourceUrls.get(windowId) || "";
  if (currentSource && currentSource !== sourceUrl) return { ok:false, stale:true };
  if (!currentSource) await rememberChatGPTPanelSourceUrl(windowId, sourceUrl);

  const mappingKey = provider.conversationMapKey;
  const [mappingData, pendingData, settings] = await Promise.all([
    browser.storage.local.get(mappingKey), browser.storage.local.get(CHATGPT_LINK_PENDING_KEY), getChatGPTPromptSettings()
  ]);
  const mappedConversation = providers.normalizeConversationUrl(provider.id, mappingData?.[mappingKey]?.[sourceUrl]);
  const existing = pendingData?.[CHATGPT_LINK_PENDING_KEY];
  if (existing && existing.expiresAt > Date.now() && existing.windowId === windowId
      && existing.sourceUrl === sourceUrl && existing.providerId === provider.id
      && ["draft-link", "manual-link", "draft-followup", "auto-send-link", "auto-send-followup"].includes(existing.mode)) {
    return { ok:true, mapped:!!mappedConversation, requestId:existing.requestId, mode:existing.mode, websiteLabel:settings.websiteLabel };
  }
  if (existing && existing.expiresAt > Date.now() && Number.isInteger(existing.windowId) && existing.windowId !== windowId) {
    return { ok:false, error:"another-panel-request-active" };
  }
  if (mappedConversation) return { ok:true, mapped:true, conversationUrl:mappedConversation, websiteLabel:settings.websiteLabel };

  const requestId = `ai-link-manual-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const pending = { requestId, windowId, sourceTabId:null, sourceUrl, providerId:provider.id, mode:"manual-link", expiresAt:Date.now() + 120000 };
  await browser.storage.local.set({ [CHATGPT_LINK_PENDING_KEY]:pending });
  setTimeout(() => { void clearExpiredChatGPTLinkPending(requestId); }, 121000);
  return { ok:true, mapped:false, requestId, mode:pending.mode, websiteLabel:settings.websiteLabel };
}
async function completeAIProviderLinkRequest(message, sender) {
  const providers = globalThis.LHN_AI_PROVIDERS;
  const stored = await browser.storage.local.get(CHATGPT_LINK_PENDING_KEY);
  const pending = stored?.[CHATGPT_LINK_PENDING_KEY];
  const provider = providers?.get(pending?.providerId);
  const senderProvider = providers?.fromUrl(sender?.url);
  const senderWindowId = Number.isInteger(sender?.tab?.windowId) ? sender.tab.windowId : null;
  if (!pending || pending.requestId !== message?.requestId || !["gemini", "claude"].includes(provider?.id)
      || senderProvider?.id !== provider.id || normalizeChatGPTSourceUrl(message?.sourceUrl) !== pending.sourceUrl
      || (Number.isInteger(senderWindowId) && senderWindowId !== pending.windowId)) return { ok:false, stale:true };
  if (Number(pending.expiresAt) <= Date.now()) {
    await browser.storage.local.remove(CHATGPT_LINK_PENDING_KEY);
    return { ok:false, stale:true };
  }
  const conversationUrl = message?.ok === true ? providers.normalizeConversationUrl(provider.id, message.conversationUrl) : "";
  if (conversationUrl) {
    const mappingData = await browser.storage.local.get(provider.conversationMapKey);
    const mappings = { ...(mappingData?.[provider.conversationMapKey] || {}) };
    mappings[pending.sourceUrl] = conversationUrl;
    await browser.storage.local.set({ [provider.conversationMapKey]:mappings });
  }
  await browser.storage.local.remove(CHATGPT_LINK_PENDING_KEY);
  return { ok:!!conversationUrl, conversationUrl };
}
function makeChatGPTLinkTarget(prompt, requestId, includeQuery = true) {
  const target = new URL("https://chatgpt.com/");
  if (includeQuery) target.searchParams.set("q", prompt);
  const hash = new URLSearchParams();
  hash.set("keepit-chatgpt-panel", "1");
  hash.set("keepit-chatgpt-link-request", requestId);
  target.hash = hash.toString();
  return target.href;
}
function makeChatGPTQuestionPrompt(selectedText, instruction = CONFIG.DEFAULT_SETTINGS.chatGPTAskPrompt) {
  return `"${String(selectedText || "").trim()}"\n${normalizeChatGPTInstruction(instruction, CONFIG.DEFAULT_SETTINGS.chatGPTAskPrompt)}`;
}
async function queueChatGPTLinkPanelFlow(tab, { intent = "summary", selectedText = "", focusComposer = false } = {}) {
  const sourceUrl = normalizeChatGPTSourceUrl(tab?.url);
  if (!sourceUrl) return { ok:false, error:"source-url-unavailable" };
  const askingAboutSelection = intent === "ask-selected-text";
  const selection = String(selectedText || "").trim();
  if (askingAboutSelection && !selection) return { ok:false, error:"selected-text-unavailable" };
  const windowId = Number.isInteger(tab?.windowId) ? tab.windowId : null;
  if (Number.isInteger(windowId)) cancelChatGPTPageContextSwitch(windowId);
  const actionRevision = Number.isInteger(windowId) ? chatGPTPageContextRevisions.get(windowId) : null;
  const actionStillCurrent = async () => {
    if (!Number.isInteger(windowId)) return true;
    if (chatGPTPageContextRevisions.get(windowId) !== actionRevision) return false;
    return chatGPTPanelIsActuallyOpen(windowId);
  };
  await browser.storage.local.remove([CHATGPT_LINK_PENDING_KEY, CHATGPT_PANEL_NAVIGATION_KEY]);
  if (!await actionStillCurrent()) return { ok:false, error:"panel-closed" };
  const promptSettings = await getChatGPTPromptSettings();
  if (!await actionStillCurrent()) return { ok:false, error:"panel-closed" };
  const selectedProvider = await getAIProviderForWindow(windowId);
  const provider = globalThis.LHN_AI_PROVIDERS?.isPanelProvider(selectedProvider?.id) ? selectedProvider : globalThis.LHN_AI_PROVIDERS?.get("chatgpt");
  const mappingKey = provider?.conversationMapKey || CHATGPT_SOURCE_CONVERSATIONS_KEY;
  const stored = provider ? await browser.storage.local.get(mappingKey) : {};
  if (!await actionStillCurrent()) return { ok:false, error:"panel-closed" };
  const conversations = stored?.[mappingKey] || {};
  const savedConversation = provider?.id === "chatgpt"
    ? safeChatGPTConversationUrl(conversations[sourceUrl])
    : globalThis.LHN_AI_PROVIDERS?.normalizeConversationUrl(provider?.id, conversations[sourceUrl]) || "";
  const providerAutoSend = globalThis.LHN_AI_PROVIDERS?.isPanelProvider(provider?.id) === true && promptSettings.autoSend;
  const navigationRequest = {
    requestId:`nav-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    windowId:Number.isInteger(tab?.windowId) ? tab.windowId : null,
    sourceTabId:Number.isInteger(tab?.id) ? tab.id : null,
    sourceUrl,
    providerId:provider?.id || "chatgpt",
    intent:askingAboutSelection ? "ask-selected-text" : "summary",
    targetUrl:savedConversation || provider?.startUrl || "https://chatgpt.com/",
    mode:savedConversation ? "reopen" : "new-link",
    focusComposer:focusComposer === true && !!savedConversation && !askingAboutSelection,
    expiresAt:Date.now() + 60000
  };
  const clearActionRequests = async linkRequestId => {
    const storedRequests = await browser.storage.local.get([CHATGPT_PANEL_NAVIGATION_KEY, CHATGPT_LINK_PENDING_KEY]);
    const remove = [];
    if (storedRequests?.[CHATGPT_PANEL_NAVIGATION_KEY]?.requestId === navigationRequest.requestId) remove.push(CHATGPT_PANEL_NAVIGATION_KEY);
    if (linkRequestId && storedRequests?.[CHATGPT_LINK_PENDING_KEY]?.requestId === linkRequestId) remove.push(CHATGPT_LINK_PENDING_KEY);
    if (remove.length) await browser.storage.local.remove(remove);
  };
  let createdLinkRequestId = "";
  if (!savedConversation) {
    const linkRequestId = `link-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    createdLinkRequestId = linkRequestId;
    const promptLine = provider?.id === "chatgpt"
      ? (askingAboutSelection ? makeChatGPTQuestionPrompt(selection, promptSettings.askPrompt) : promptSettings.summaryPrompt)
      : (globalThis.LHN_AI_PROVIDERS?.makePrompt(provider?.id, {
        intent:askingAboutSelection ? "ask-selected-text" : "summary",
        selectedText:selection,
        language:promptSettings.language,
        summaryPrompt:promptSettings.summaryPrompt,
        askPrompt:promptSettings.askPrompt,
        includeSource:false
      }) || "");
    const prompt = providerAutoSend
      ? globalThis.LHN_CHATGPT_PROMPT_FORMAT.formatLinkPrompt(promptSettings.websiteLabel, sourceUrl, promptLine)
      : promptLine;
    const pending = {
      requestId:linkRequestId,
      windowId:Number.isInteger(tab?.windowId) ? tab.windowId : null,
      sourceTabId:Number.isInteger(tab?.id) ? tab.id : null,
      sourceUrl,
      providerId:provider?.id || "chatgpt",
      prompt,
      mode:providerAutoSend ? "auto-send-link" : "draft-link",
      draftReady:false,
      expiresAt:Date.now() + (providerAutoSend ? 120000 : 86400000)
    };
    navigationRequest.targetUrl = provider?.id === "chatgpt"
      ? makeChatGPTLinkTarget(prompt, linkRequestId, providerAutoSend)
      : (provider?.startUrl || "https://chatgpt.com/");
    navigationRequest.linkRequestId = linkRequestId;
    if (!await actionStillCurrent()) return { ok:false, error:"panel-closed" };
    await browser.storage.local.set({ [CHATGPT_LINK_PENDING_KEY]:pending });
    if (!await actionStillCurrent()) { await clearActionRequests(linkRequestId); return { ok:false, error:"panel-closed" }; }
    setTimeout(() => { void clearExpiredChatGPTLinkPending(linkRequestId); }, providerAutoSend ? 121000 : 86401000);
  } else if (askingAboutSelection) {
    // Exact mapped-route Hỏi AI replaces the existing composer prompt; auto-send is optional.
    const linkRequestId = `link-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const pending = {
      requestId:linkRequestId,
      windowId:Number.isInteger(tab?.windowId) ? tab.windowId : null,
      sourceTabId:Number.isInteger(tab?.id) ? tab.id : null,
      sourceUrl,
      conversationUrl:savedConversation,
      prompt:provider?.id === "chatgpt"
        ? makeChatGPTQuestionPrompt(selection, promptSettings.askPrompt)
        : (globalThis.LHN_AI_PROVIDERS?.makePrompt(provider?.id, {
          intent:"ask-selected-text", selectedText:selection, language:promptSettings.language,
          askPrompt:promptSettings.askPrompt, includeSource:false
        }) || ""),
      providerId:provider?.id || "chatgpt",
      mode:providerAutoSend ? "auto-send-followup" : "draft-followup",
      expiresAt:Date.now() + 120000
    };
    navigationRequest.targetUrl = savedConversation;
    navigationRequest.mode = "followup";
    navigationRequest.linkRequestId = linkRequestId;
    if (!await actionStillCurrent()) return { ok:false, error:"panel-closed" };
    await browser.storage.local.set({ [CHATGPT_LINK_PENDING_KEY]:pending });
    if (!await actionStillCurrent()) { await clearActionRequests(linkRequestId); return { ok:false, error:"panel-closed" }; }
    setTimeout(() => { void clearExpiredChatGPTLinkPending(linkRequestId); }, 121000);
  } else {
    navigationRequest.targetUrl = savedConversation;
  }
  if (!await actionStillCurrent()) { await clearActionRequests(createdLinkRequestId); return { ok:false, error:"panel-closed" }; }
  await browser.storage.local.set({ [CHATGPT_PANEL_NAVIGATION_KEY]:navigationRequest });
  if (!await actionStillCurrent()) { await clearActionRequests(createdLinkRequestId); return { ok:false, error:"panel-closed" }; }
  if (Number.isInteger(tab?.windowId)) await rememberChatGPTPanelSourceUrl(tab.windowId, sourceUrl);
  if (!await actionStillCurrent()) { await clearActionRequests(createdLinkRequestId); return { ok:false, error:"panel-closed" }; }
  const action = !savedConversation
    ? (askingAboutSelection ? "ask-selected-text-new" : "send-summary")
    : (askingAboutSelection ? "ask-selected-text-existing" : "reopen-existing");
  return { ok:true, action };
}
async function openChatGPTLinkPanel({ sender, tab, intent = "summary", selectedText = "" } = {}) {
  const sourceTab = tab || sender?.tab;
  if (intent === "ask-selected-text" && !String(selectedText || "").trim()) return { ok:false, error:"selected-text-unavailable" };
  const windowId = Number.isInteger(sourceTab?.windowId) ? sourceTab.windowId : null;
  if (Number.isInteger(windowId)) markChatGPTExplicitPanelOpen(windowId);
  try {
    // Alt+X keeps its toggle contract. Ask AI opens or keeps the panel open so the question can be sent.
    const panel = await openChatGPTSidePanel({ sender, tab:sourceTab, toggle:intent !== "ask-selected-text" });
    if (!panel?.ok || !panel.opened) return panel;
    if (Number.isInteger(windowId)) await trackChatGPTPanel(windowId, sourceTab.id, true);
    const flow = await queueChatGPTLinkPanelFlow(sourceTab, { intent, selectedText, focusComposer:true });
    return { ...panel, ...flow };
  } finally { if (Number.isInteger(windowId)) clearChatGPTExplicitPanelOpen(windowId); }
}

const ASK_AI_CONTEXT_MENU_ID = "keepit-ask-ai-selection";
let askAIContextMenuRegistration = null;
function ensureAskAIContextMenu() {
  const menus = globalThis.browser?.contextMenus;
  if (!menus?.create || !menus?.onClicked) return Promise.resolve();
  if (askAIContextMenuRegistration) return askAIContextMenuRegistration;
  askAIContextMenuRegistration = (async () => {
    try { await menus.remove(ASK_AI_CONTEXT_MENU_ID); } catch {}
    try {
      await menus.create({
        id:ASK_AI_CONTEXT_MENU_ID,
        title:"Keepit: Hỏi AI / Ask AI",
        contexts:["selection"]
      });
    } catch (error) { console.warn("Could not register the Keepit Ask AI selection menu", error); }
  })().finally(() => { askAIContextMenuRegistration = null; });
  return askAIContextMenuRegistration;
}
function onAskAIContextMenu(info, tab) {
  if (info?.menuItemId !== ASK_AI_CONTEXT_MENU_ID || !Number.isInteger(tab?.id)) return;
  const selectedText = String(info.selectionText || "").trim();
  if (!selectedText) return;
  // Invoke the browser-specific panel open synchronously in the native menu gesture.
  let openPromise;
  try {
    if (typeof globalThis.chrome?.sidePanel?.open === "function") {
      openPromise = globalThis.chrome.sidePanel.open({ windowId:tab.windowId });
    } else if (typeof globalThis.browser?.sidebarAction?.open === "function") {
      openPromise = globalThis.browser.sidebarAction.open();
    } else {
      openPromise = Promise.reject(new Error("side-panel-unsupported"));
    }
  } catch (error) { openPromise = Promise.reject(error); }
  void Promise.resolve(openPromise).then(async () => {
    await trackChatGPTPanel(tab.windowId, tab.id, true);
    const flow = await queueChatGPTLinkPanelFlow(tab, { intent:"ask-selected-text", selectedText });
    await browser.tabs.sendMessage(tab.id, flow?.ok
      ? { type:"CHATGPT_LINK_PANEL_QUEUED", action:flow.action }
      : { type:"CHATGPT_LINK_PANEL_FAILED" });
  }).catch(async error => {
    console.warn("Could not open the ChatGPT panel from the selection context menu", String(error?.message || error));
    try { await browser.tabs.sendMessage(tab.id, { type:"CHATGPT_PANEL_OPEN_FAILED" }); } catch {}
  });
}
if (globalThis.browser?.contextMenus?.onClicked) {
  globalThis.browser.contextMenus.onClicked.addListener(onAskAIContextMenu);
  // Register immediately as well as on install/startup to keep one selection menu in both engines.
  void ensureAskAIContextMenu();
}

async function clearExpiredChatGPTLinkPending(expectedRequestId = "") {
  const stored = await browser.storage.local.get(CHATGPT_LINK_PENDING_KEY);
  const pending = stored?.[CHATGPT_LINK_PENDING_KEY];
  if (pending && pending.expiresAt <= Date.now() && (!expectedRequestId || pending.requestId === expectedRequestId)) {
    await browser.storage.local.remove(CHATGPT_LINK_PENDING_KEY);
    return true;
  }
  return false;
}
async function completeChatGPTLinkRequest(message) {
  const stored = await browser.storage.local.get(CHATGPT_LINK_PENDING_KEY);
  const pending = stored?.[CHATGPT_LINK_PENDING_KEY];
  if (!pending || message?.requestId !== pending.requestId) return { ok:false, stale:true };
  const conversationUrl = message.ok === true ? safeChatGPTConversationUrl(message.conversationUrl) : "";
  if (conversationUrl) {
    const mappingData = await browser.storage.local.get(CHATGPT_SOURCE_CONVERSATIONS_KEY);
    const mappings = { ...(mappingData?.[CHATGPT_SOURCE_CONVERSATIONS_KEY] || {}) };
    delete mappings[pending.sourceUrl];
    mappings[pending.sourceUrl] = conversationUrl;
    await browser.storage.local.set({ [CHATGPT_SOURCE_CONVERSATIONS_KEY]:mappings });
  }
  await browser.storage.local.remove(CHATGPT_LINK_PENDING_KEY);
  if (Number.isInteger(pending.sourceTabId)) {
    try {
      await browser.tabs.sendMessage(pending.sourceTabId, {
        type:"CHATGPT_AUTOFILL_RESULT",
        ok:Boolean(conversationUrl),
        reason:conversationUrl ? "" : String(message.reason || "conversation-not-created")
      });
    } catch { /* source tab may have navigated or closed */ }
  }
  return { ok:Boolean(conversationUrl), conversationUrl };
}
async function notifyChatGPTLinkDraftReady(message) {
  const stored = await browser.storage.local.get(CHATGPT_LINK_PENDING_KEY);
  const pending = stored?.[CHATGPT_LINK_PENDING_KEY];
  if (!pending || pending.requestId !== message?.requestId || pending.mode !== "draft-link") return { ok:false, stale:true };
  const updated = { ...pending, draftReady:true, expiresAt:Date.now() + 86400000 };
  await browser.storage.local.set({ [CHATGPT_LINK_PENDING_KEY]:updated });
  setTimeout(() => { void clearExpiredChatGPTLinkPending(updated.requestId); }, 86401000);
  if (Number.isInteger(updated.sourceTabId)) {
    try { await browser.tabs.sendMessage(updated.sourceTabId, { type:"CHATGPT_AUTOFILL_RESULT", ok:true, reason:"draft-ready" }); } catch {}
  }
  return { ok:true };
}
async function reportChatGPTNavigationBlocked(message) {
  if (typeof message?.linkRequestId === "string" && message.linkRequestId) {
    return completeChatGPTLinkRequest({ requestId:message.linkRequestId, ok:false, reason:message.reason || "composer-not-empty" });
  }
  if (Number.isInteger(message?.sourceTabId)) {
    try {
      await browser.tabs.sendMessage(message.sourceTabId, {
        type:"CHATGPT_AUTOFILL_RESULT",
        ok:false,
        reason:String(message.reason || "composer-not-empty")
      });
      return { ok:true };
    } catch { return { ok:false, error:"source-tab-unavailable" }; }
  }
  return { ok:false, error:"source-tab-unavailable" };
}
function openChatGPTFromCommand() {
  // Open/toggle in the command gesture, then pass only the active tab URL to the new flow.
  let togglePromise;
  try { togglePromise = openChatGPTSidePanel(); }
  catch (error) { togglePromise = Promise.reject(error); }
  const tabPromise = browser.tabs.query({ active:true, currentWindow:true }).then(tabs => tabs?.[0] || null);
  Promise.allSettled([togglePromise, tabPromise]).then(async ([panelResult, tabResult]) => {
    const tab = tabResult.status === "fulfilled" ? tabResult.value : null;
    const panel = panelResult.status === "fulfilled" ? panelResult.value : null;
    if (!panel?.ok) {
      const reason = panelResult.status === "rejected" ? String(panelResult.reason?.message || panelResult.reason) : panel?.reason || panel?.error;
      console.warn("Could not toggle the ChatGPT panel from the keyboard command", reason || "unknown-error");
      if (tab?.id) try { await browser.tabs.sendMessage(tab.id, { type:"CHATGPT_PANEL_OPEN_FAILED" }); } catch {}
      return;
    }
    if (!panel.opened) {
      if (tab?.id) try { await browser.tabs.sendMessage(tab.id, { type:"CHATGPT_PANEL_TOGGLED_CLOSED" }); } catch {}
      return;
    }
    if (tab?.id) {
      await trackChatGPTPanel(tab.windowId, tab.id, true);
      const queued = await queueChatGPTLinkPanelFlow(tab, { focusComposer:true });
      if (!queued.ok) {
        try { await browser.tabs.sendMessage(tab.id, { type:"CHATGPT_LINK_PANEL_FAILED" }); } catch {}
      } else {
        try { await browser.tabs.sendMessage(tab.id, { type:"CHATGPT_LINK_PANEL_QUEUED", action:queued.action }); } catch {}
      }
    }
  }).catch(error => console.warn("Could not finish the ChatGPT keyboard command", error));
}
browser.commands?.onCommand.addListener(command => {
  if (command === "open-chatgpt-sidepanel") void openChatGPTFromCommand();
});

// AI runtime messages, in the same order the background router used to check them.
const ASK_AI_UNHANDLED = Symbol("ask-ai-unhandled");
const ASK_AI_MESSAGE_TYPES = new Set([
  "AI_PANEL_GROK_AUTH_FRAME_DETECTED", "AI_PANEL_PROVIDER_SELECTED", "AI_PANEL_CONTEXT_READY", "CHATGPT_PANEL_ROUTE_CONTEXT", "AI_PANEL_MAYBE_CLOSED", "AI_PANEL_HOST_CLOSED", "AI_PROVIDER_MANUAL_LINK_PREPARE", "AI_PROVIDER_LINK_RESULT", "CHATGPT_MANUAL_LINK_PREPARE", "CHATGPT_LINK_RESULT", "CHATGPT_LINK_DRAFT_READY", "CHATGPT_PANEL_NAVIGATION_BLOCKED", "OPEN_CHATGPT_LINK_PANEL", "OPEN_CHATGPT_SIDEPANEL"
]);
async function handleAskAIMessage(message, sender) {
  if (message.type === "AI_PANEL_GROK_AUTH_FRAME_DETECTED") return openGrokSignInTabFromEmbeddedAuth(message, sender);
  if (message.type === "AI_PANEL_PROVIDER_SELECTED") {
    const provider = globalThis.LHN_AI_PROVIDERS?.get(message.providerId);
    const windowId = Number.isInteger(message.windowId) ? message.windowId : (sender?.tab?.windowId ?? chatGPTFocusedWindowId);
    if (!provider || !globalThis.LHN_AI_PROVIDERS?.isPanelProvider(provider.id) || !Number.isInteger(windowId)) return { ok:false, error:"invalid-ai-provider" };
    return { ok:await rememberAIProviderForWindow(windowId, provider.id), providerId:provider.id };
  }
  if (message.type === "AI_PANEL_CONTEXT_READY" && typeof browser.sidebarAction?.isOpen === "function") {
    try {
      const windowId = sender?.tab?.windowId ?? chatGPTFocusedWindowId;
      if (await browser.sidebarAction.isOpen(Number.isInteger(windowId) ? { windowId } : {})) {
        const wasOpen = chatGPTOpenWindows.has(windowId);
        const active = Number.isInteger(sender?.tab?.id) ? sender.tab : (await browser.tabs.query({ active:true, currentWindow:true }))?.[0];
        await trackChatGPTPanel(windowId, active?.id, true);
        if (!wasOpen && Number.isInteger(active?.id)) {
          const revision = nextChatGPTPageContextRevision(windowId);
          void queueChatGPTPageContext(active, 0, revision);
        }
        return { ok:true, open:true };
      }
    } catch {}
    return { ok:true, open:false };
  }
  if (message.type === "CHATGPT_PANEL_ROUTE_CONTEXT") {
    const windowId = Number.isInteger(message.windowId) ? message.windowId : (sender?.tab?.windowId ?? chatGPTFocusedWindowId);
    const sourceUrl = normalizeChatGPTSourceUrl(message.sourceUrl);
    const chatUrl = normalizeChatGPTPanelRoute(message.chatUrl);
    if (!Number.isInteger(windowId) || !sourceUrl || !chatUrl) return { ok:false, error:"invalid-panel-route-context" };
    const currentSource = chatGPTPanelSourceUrls.get(windowId);
    if (currentSource && currentSource !== sourceUrl) return { ok:false, stale:true };
    return { ok:await rememberChatGPTPanelRouteContext(windowId, sourceUrl, chatUrl) };
  }
  if (message.type === "AI_PANEL_MAYBE_CLOSED") {
    const windowId = Number.isInteger(message.windowId) ? message.windowId : (sender?.tab?.windowId ?? chatGPTFocusedWindowId);
    if (Number.isInteger(windowId) && typeof browser.sidebarAction?.isOpen === "function") {
      try {
        if (!await browser.sidebarAction.isOpen({ windowId })) await trackChatGPTPanel(windowId, chatGPTSourceTabs.get(windowId), false);
      } catch {}
    }
    return { ok:true };
  }
  if (message.type === "AI_PANEL_HOST_CLOSED") {
    const windowId = Number.isInteger(message.windowId) ? message.windowId : (sender?.tab?.windowId ?? chatGPTFocusedWindowId);
    if (Number.isInteger(windowId)) await trackChatGPTPanel(windowId, chatGPTSourceTabs.get(windowId), false);
    return { ok:true };
  }
  if (message.type === "AI_PROVIDER_MANUAL_LINK_PREPARE") return prepareAIProviderManualLinkSend(message, sender);
  if (message.type === "AI_PROVIDER_LINK_RESULT") return completeAIProviderLinkRequest(message, sender);
  if (message.type === "CHATGPT_MANUAL_LINK_PREPARE") return prepareChatGPTManualLinkSend(message, sender);
  if (message.type === "CHATGPT_LINK_RESULT") return completeChatGPTLinkRequest(message);
  if (message.type === "CHATGPT_LINK_DRAFT_READY") return notifyChatGPTLinkDraftReady(message);
  if (message.type === "CHATGPT_PANEL_NAVIGATION_BLOCKED") return reportChatGPTNavigationBlocked(message);
  if (message.type === "OPEN_CHATGPT_LINK_PANEL") return openChatGPTLinkPanel({ sender, intent:message.intent, selectedText:message.selectedText });
  if (message.type === "OPEN_CHATGPT_SIDEPANEL") return openChatGPTSidePanel({ sender });
  return ASK_AI_UNHANDLED;
}
