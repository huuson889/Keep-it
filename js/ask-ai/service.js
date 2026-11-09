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
  if (!Number.isInteger(windowId) || windowId < 0) windowId = aiPanelFocusedWindowId;
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
// The AI panel shows the provider page in an iframe in both Chromium (side panel) and Firefox
// (sidebar), so the same rule lets those provider pages load as sub-frames in both browsers.
function ensureAIProviderFrameRule(forceUpdate = false) {
  const dnr = globalThis.chrome?.declarativeNetRequest || globalThis.browser?.declarativeNetRequest;
  if (!dnr?.updateDynamicRules || !dnr?.getDynamicRules) return Promise.resolve(false);
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
// One link/mapping flow for every panel AI. Source→conversation mappings keep their
// per-provider keys (providers.js conversationMapKey), so no stored mapping changes name.
const AI_PANEL_STATE_KEY = "keepitAiPanelOpenWindowIds";
const AI_LINK_PENDING_KEY = "keepitAiLinkPending";
const AI_PANEL_NAVIGATION_KEY = "keepitAiPanelNavigationRequest";
const AI_PANEL_SOURCE_URLS_KEY = "keepitAiPanelSourceUrlByWindow";
const AI_PANEL_CONTEXTS_KEY = "keepitAiPanelRouteContextByWindow";
// Short-lived request keys from earlier versions (pending/navigation requests and the old
// full-page draft flow). They are only removed; nothing user-visible is lost.
const LEGACY_AI_STORAGE_KEYS = [
  "keepitChatGPTDraftPending",
  "keepitChatGPTPageDraftsBySourceUrl",
  "keepitChatGPTLastConversationUrl",
  "keepitChatGPTLinkPending",
  "keepitChatGPTPanelNavigationRequest"
];
async function cleanupAskAIStorage() {
  await clearExpiredAILinkPending();
  await browser.storage.local.remove([...LEGACY_AI_STORAGE_KEYS, AI_LINK_PENDING_KEY, AI_PANEL_NAVIGATION_KEY]);
}
const AI_PANEL_CONTEXT_DELAY_MS = 2000;
let aiPanelOpen = false;
let aiPanelFocusedWindowId = null;
const aiPanelOpenWindows = new Set();
const aiPanelSourceTabs = new Map();
const aiPanelSourceUrls = new Map();
const aiPanelRouteContexts = new Map();
const aiPanelContextTimers = new Map();
const aiPanelContextRevisions = new Map();
const aiPanelExplicitOpenWindows = new Map();
let aiPanelStateRevision = 0;
let aiPanelStateWrite = Promise.resolve();
async function restoreAIPanelState() {
  try {
    const sessionStorage = browser.storage.session;
    if (!sessionStorage?.get) return new Set();
    const stateAtStart = aiPanelStateRevision;
    const stored = await sessionStorage.get([AI_PANEL_STATE_KEY, AI_PANEL_SOURCE_URLS_KEY, AI_PANEL_CONTEXTS_KEY]);
    const ids = stored?.[AI_PANEL_STATE_KEY];
    const sourceUrls = stored?.[AI_PANEL_SOURCE_URLS_KEY];
    const routeContexts = stored?.[AI_PANEL_CONTEXTS_KEY];
    aiPanelSourceUrls.clear();
    aiPanelRouteContexts.clear();
    for (const [windowId, sourceUrl] of Object.entries(sourceUrls || {})) {
      const id = Number(windowId);
      const normalized = normalizeAISourceUrl(sourceUrl);
      if (Number.isInteger(id) && id >= 0 && normalized) aiPanelSourceUrls.set(id, normalized);
    }
    for (const [windowId, value] of Object.entries(routeContexts || {})) {
      const id = Number(windowId);
      const sourceUrl = normalizeAISourceUrl(value?.sourceUrl);
      const providerId = globalThis.LHN_AI_PROVIDERS?.get(value?.providerId || "chatgpt")?.id || "";
      const chatUrl = globalThis.LHN_AI_PROVIDERS?.panelRoute(providerId, value?.chatUrl) || "";
      if (Number.isInteger(id) && id >= 0 && sourceUrl && chatUrl) aiPanelRouteContexts.set(id, { sourceUrl, providerId, chatUrl });
    }
    let openWindows = Array.isArray(ids) ? [...new Set(ids.filter(id => Number.isInteger(id) && id >= 0))] : [];
    let live = null;
    if (browser.windows?.getAll) {
      live = new Set((await browser.windows.getAll()).map(win => win.id));
      openWindows = openWindows.filter(id => live.has(id));
    }
    if (live) {
      for (const id of [...aiPanelSourceUrls.keys()]) if (!live.has(id)) aiPanelSourceUrls.delete(id);
      for (const id of [...aiPanelRouteContexts.keys()]) if (!live.has(id)) aiPanelRouteContexts.delete(id);
    }
    if (aiPanelStateRevision === stateAtStart) {
      aiPanelOpenWindows.clear();
      for (const id of openWindows) aiPanelOpenWindows.add(id);
      aiPanelOpen = aiPanelOpenWindows.size > 0;
    } else {
      openWindows = [...aiPanelOpenWindows];
    }
    return new Set(openWindows);
  } catch (error) {
    console.warn("Could not restore AI panel toggle state", error);
    return new Set(aiPanelOpenWindows);
  }
}
let aiPanelStateRestoreSnapshot = null;
const aiPanelStateRestorePromise = restoreAIPanelState().then(openWindows => {
  aiPanelStateRestoreSnapshot = openWindows;
  return openWindows;
});
function persistAIPanelState() {
  const sessionStorage = browser.storage.session;
  if (!sessionStorage?.set) return;
  const openWindows = [...aiPanelOpenWindows];
  aiPanelStateWrite = aiPanelStateWrite
    .then(() => sessionStorage.set({
      [AI_PANEL_STATE_KEY]:openWindows,
      [AI_PANEL_SOURCE_URLS_KEY]:Object.fromEntries(aiPanelSourceUrls),
      [AI_PANEL_CONTEXTS_KEY]:Object.fromEntries(aiPanelRouteContexts)
    }))
    .catch(error => console.warn("Could not save AI panel toggle state", error));
  return aiPanelStateWrite;
}
async function rememberAIPanelSourceUrl(windowId, sourceUrl) {
  const normalized = normalizeAISourceUrl(sourceUrl);
  if (!Number.isInteger(windowId) || windowId < 0 || !normalized) return;
  await aiPanelStateRestorePromise;
  const previous = aiPanelSourceUrls.get(windowId) || "";
  aiPanelSourceUrls.set(windowId, normalized);
  const currentContext = aiPanelRouteContexts.get(windowId);
  if (!currentContext || currentContext.sourceUrl !== normalized || previous !== normalized) {
    // Do not make an unconfirmed blank route look like saved session context; reopen can fall back to the exact mapping.
    aiPanelRouteContexts.delete(windowId);
  }
  await persistAIPanelState();
}
async function rememberAIPanelRouteContext(windowId, sourceUrl, providerId, chatUrl) {
  const source = normalizeAISourceUrl(sourceUrl);
  const route = globalThis.LHN_AI_PROVIDERS?.panelRoute(providerId, chatUrl) || "";
  if (!Number.isInteger(windowId) || windowId < 0 || !source || !route) return false;
  await aiPanelStateRestorePromise;
  const currentSource = aiPanelSourceUrls.get(windowId);
  if (currentSource && currentSource !== source) return false;
  aiPanelSourceUrls.set(windowId, source);
  aiPanelRouteContexts.set(windowId, { sourceUrl:source, providerId:globalThis.LHN_AI_PROVIDERS.get(providerId).id, chatUrl:route });
  await persistAIPanelState();
  return true;
}
function cancelAIPanelContextSwitch(windowId) {
  if (!Number.isInteger(windowId) || windowId < 0) return;
  const pending = aiPanelContextTimers.get(windowId);
  if (pending?.timerId) clearTimeout(pending.timerId);
  aiPanelContextTimers.delete(windowId);
  aiPanelContextRevisions.set(windowId, (aiPanelContextRevisions.get(windowId) || 0) + 1);
}
function nextAIPanelContextRevision(windowId) {
  const revision = (aiPanelContextRevisions.get(windowId) || 0) + 1;
  aiPanelContextRevisions.set(windowId, revision);
  return revision;
}
function markAIPanelExplicitOpen(windowId) {
  if (!Number.isInteger(windowId) || windowId < 0) return;
  const existing = aiPanelExplicitOpenWindows.get(windowId);
  if (existing) clearTimeout(existing);
  const timer = setTimeout(() => aiPanelExplicitOpenWindows.delete(windowId), 10000);
  aiPanelExplicitOpenWindows.set(windowId, timer);
}
function clearAIPanelExplicitOpen(windowId) {
  const timer = aiPanelExplicitOpenWindows.get(windowId);
  if (timer) clearTimeout(timer);
  aiPanelExplicitOpenWindows.delete(windowId);
}
async function aiPanelIsActuallyOpen(windowId) {
  if (!aiPanelIsOpen(windowId)) return false;
  const sidebar = globalThis.browser?.sidebarAction;
  if (typeof sidebar?.isOpen === "function") {
    try {
      const opened = await sidebar.isOpen({ windowId });
      if (!opened) {
        await trackAIPanel(windowId, aiPanelSourceTabs.get(windowId), false);
        return false;
      }
    } catch { /* preserve tracked state when the browser cannot report sidebar state */ }
  }
  return true;
}
async function clearPendingAIPanelRequests(windowId) {
  try {
    const stored = await browser.storage.local.get([AI_PANEL_NAVIGATION_KEY, AI_LINK_PENDING_KEY]);
    const navigation = stored?.[AI_PANEL_NAVIGATION_KEY];
    const link = stored?.[AI_LINK_PENDING_KEY];
    const keys = [];
    if (navigation?.windowId === windowId) keys.push(AI_PANEL_NAVIGATION_KEY);
    if (link?.windowId === windowId) keys.push(AI_LINK_PENDING_KEY);
    if (keys.length) await browser.storage.local.remove(keys);
  } catch (error) { console.warn("Could not clear unfinished AI panel requests", error); }
}
async function clearSupersededAIPanelRequests(windowId, sourceUrl, revision) {
  try {
    const stored = await browser.storage.local.get([AI_PANEL_NAVIGATION_KEY, AI_LINK_PENDING_KEY]);
    if (aiPanelContextRevisions.get(windowId) !== revision) return;
    const navigation = stored?.[AI_PANEL_NAVIGATION_KEY];
    const link = stored?.[AI_LINK_PENDING_KEY];
    const keys = [];
    if (navigation?.windowId === windowId && navigation.sourceUrl && navigation.sourceUrl !== sourceUrl) keys.push(AI_PANEL_NAVIGATION_KEY);
    if (link?.windowId === windowId && link.sourceUrl && link.sourceUrl !== sourceUrl) keys.push(AI_LINK_PENDING_KEY);
    if (keys.length) await browser.storage.local.remove(keys);
  } catch (error) { console.warn("Could not clear superseded AI panel source requests", error); }
}
async function queueAIPanelSourceContext(tab, delayMs = AI_PANEL_CONTEXT_DELAY_MS, revision = null, deadline = null) {
  const sourceUrl = normalizeAISourceUrl(tab?.url);
  const windowId = Number.isInteger(tab?.windowId) ? tab.windowId : null;
  // A panel AI's own pages are never a source context.
  const sourceIsPanelAI = globalThis.LHN_AI_PROVIDERS?.isPanelProvider(globalThis.LHN_AI_PROVIDERS?.fromUrl(sourceUrl)?.id) === true;
  // Nor is a sign-in page (for example the tab the AI panel opened for signing in).
  const sourceIsSignIn = globalThis.LHN_AI_PROVIDERS?.isLoginUrl?.(null, sourceUrl) === true;
  if (!sourceUrl || sourceIsPanelAI || sourceIsSignIn || !Number.isInteger(windowId)) return false;
  if (!Number.isInteger(revision)) revision = nextAIPanelContextRevision(windowId);
  await aiPanelStateRestorePromise;
  if (aiPanelContextRevisions.get(windowId) !== revision) return false;
  if (!await aiPanelIsActuallyOpen(windowId)) return false;
  if (aiPanelSourceTabs.get(windowId) !== tab.id) return false;
  const currentSourceUrl = aiPanelSourceUrls.get(windowId) || "";
  const oldTimer = aiPanelContextTimers.get(windowId);
  if (oldTimer?.timerId) clearTimeout(oldTimer.timerId);
  aiPanelContextTimers.delete(windowId);
  if (currentSourceUrl === sourceUrl) return false;
  const pending = { revision, sourceUrl, tabId:tab.id, timerId:null };
  pending.timerId = setTimeout(() => {
    void (async () => {
      if (aiPanelContextRevisions.get(windowId) !== revision) return;
      if (aiPanelContextTimers.get(windowId) === pending) aiPanelContextTimers.delete(windowId);
      if (!await aiPanelIsActuallyOpen(windowId)) return;
      let activeTab = null;
      try { activeTab = (await browser.tabs.query({ active:true, windowId }))?.[0] || null; } catch {}
      if (aiPanelContextRevisions.get(windowId) !== revision || activeTab?.id !== tab.id || normalizeAISourceUrl(activeTab?.url) !== sourceUrl) return;
      if ((aiPanelSourceUrls.get(windowId) || "") === sourceUrl) return;
      try {
        await clearSupersededAIPanelRequests(windowId, sourceUrl, revision);
        if (aiPanelContextRevisions.get(windowId) !== revision) return;
        const selectedProvider = await getAIProviderForWindow(windowId);
        if (aiPanelContextRevisions.get(windowId) !== revision) return;
        const mappingKey = selectedProvider?.conversationMapKey || "";
        const stored = mappingKey ? await browser.storage.local.get(mappingKey) : {};
        if (aiPanelContextRevisions.get(windowId) !== revision) return;
        const mapped = globalThis.LHN_AI_PROVIDERS?.normalizeConversationUrl(selectedProvider?.id, stored?.[mappingKey]?.[sourceUrl]) || "";
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
        await rememberAIPanelSourceUrl(windowId, sourceUrl);
        if (aiPanelContextRevisions.get(windowId) !== revision) return;
        await browser.storage.local.set({ [AI_PANEL_NAVIGATION_KEY]:request });
        if (aiPanelContextRevisions.get(windowId) !== revision) {
          const latest = await browser.storage.local.get(AI_PANEL_NAVIGATION_KEY);
          if (latest?.[AI_PANEL_NAVIGATION_KEY]?.requestId === request.requestId) await browser.storage.local.remove(AI_PANEL_NAVIGATION_KEY);
        }
      } catch (error) { console.warn("Could not switch the AI panel to the active source page", error); }
    })();
  }, Number.isFinite(deadline) ? Math.max(0, deadline - Date.now()) : Math.max(0, Number(delayMs) || 0));
  aiPanelContextTimers.set(windowId, pending);
  return true;
}
browser.tabs.onUpdated?.addListener((tabId, changeInfo, tab) => {
  const urlChanged = typeof changeInfo?.url === "string";
  if ((!urlChanged && changeInfo?.status !== "complete") || !Number.isInteger(tab?.windowId)) return;
  if (aiPanelSourceTabs.get(tab.windowId) !== tabId) return;
  if (changeInfo?.status === "complete" && aiPanelOpenWindows.has(tab.windowId)) void setAIPanelPageScrollbar(tabId, true);
  const revision = nextAIPanelContextRevision(tab.windowId);
  const deadline = Date.now() + AI_PANEL_CONTEXT_DELAY_MS;
  const updatedTab = urlChanged ? { ...tab, url:changeInfo.url } : tab;
  void queueAIPanelSourceContext(updatedTab, AI_PANEL_CONTEXT_DELAY_MS, revision, deadline);
});
browser.tabs.onActivated?.addListener(async ({ windowId, tabId }) => {
  if (!Number.isInteger(windowId)) return;
  const deadline = Date.now() + AI_PANEL_CONTEXT_DELAY_MS;
  aiPanelFocusedWindowId = windowId;
  const wasTrackedOpen = aiPanelOpenWindows.has(windowId);
  const previousTabId = aiPanelSourceTabs.get(windowId);
  if (Number.isInteger(previousTabId) && previousTabId !== tabId) void setAIPanelPageScrollbar(previousTabId, false);
  if (wasTrackedOpen) {
    aiPanelSourceTabs.set(windowId, tabId);
    void setAIPanelPageScrollbar(tabId, true);
    const revision = nextAIPanelContextRevision(windowId);
    try { void browser.tabs.get(tabId).then(tab => queueAIPanelSourceContext(tab, AI_PANEL_CONTEXT_DELAY_MS, revision, deadline)).catch(() => {}); } catch {}
  }
  const sidebar = globalThis.browser?.sidebarAction;
  if (typeof sidebar?.isOpen === "function") {
    try {
      const opened = await sidebar.isOpen({ windowId });
      if (opened) {
        await trackAIPanel(windowId, tabId, true);
        if (!wasTrackedOpen && Number.isInteger(tabId)) {
          const revision = nextAIPanelContextRevision(windowId);
          try { void browser.tabs.get(tabId).then(tab => queueAIPanelSourceContext(tab, AI_PANEL_CONTEXT_DELAY_MS, revision, deadline)).catch(() => {}); } catch {}
        }
      } else if (aiPanelOpenWindows.has(windowId)) await trackAIPanel(windowId, tabId, false);
    } catch { /* Firefox may not report sidebar state for a closing window */ }
  }
});
browser.windows?.onFocusChanged?.addListener(windowId => { if (Number.isInteger(windowId) && windowId >= 0) aiPanelFocusedWindowId = windowId; });
browser.windows?.onRemoved?.addListener(windowId => {
  cancelAIPanelContextSwitch(windowId);
  clearAIPanelExplicitOpen(windowId);
  void clearPendingAIPanelRequests(windowId);
  aiPanelOpenWindows.delete(windowId);
  aiPanelStateRestoreSnapshot?.delete(windowId);
  aiPanelSourceTabs.delete(windowId);
  aiPanelSourceUrls.delete(windowId);
  aiPanelRouteContexts.delete(windowId);
  aiPanelOpen = aiPanelOpenWindows.size > 0;
  aiPanelStateRevision++;
  return persistAIPanelState();
});
function aiPanelWindowId(sourceTab) {
  return Number.isInteger(sourceTab?.windowId) ? sourceTab.windowId : aiPanelFocusedWindowId ?? globalThis.chrome?.windows?.WINDOW_ID_CURRENT ?? -2;
}
function aiPanelIsOpen(windowId) {
  if (Number.isInteger(windowId) && windowId >= 0) return aiPanelOpenWindows.has(windowId) || (aiPanelOpen && aiPanelFocusedWindowId === windowId);
  return aiPanelOpen || aiPanelOpenWindows.size > 0;
}
async function aiPanelShortcutLabel() {
  // Users can rebind the command in the browser; show the live shortcut (empty when unset).
  try {
    const commands = await browser.commands?.getAll?.();
    const command = commands?.find(item => item?.name === "open-chatgpt-sidepanel");
    if (command) return String(command.shortcut || "");
  } catch {}
  return "Alt+X";
}
async function setAIPanelPageScrollbar(tabId, open) {
  if (!Number.isInteger(tabId)) return;
  // Only Chromium can close/toggle its panel from a page click; Firefox requires a direct user action in the sidebar API.
  const pageToggle = typeof globalThis.chrome?.sidePanel?.open === "function";
  const shortcut = open ? await aiPanelShortcutLabel() : "";
  try { await browser.tabs.sendMessage(tabId, { type:"AI_PANEL_VISIBILITY", open:!!open, pageToggle, shortcut }); }
  catch { /* unsupported/restricted tabs have no Keepit content script */ }
}
async function closeChromiumAIPanel(windowId, chromePanel) {
  if (typeof chromePanel?.close === "function") {
    await chromePanel.close({ windowId });
    return true;
  }
  try {
    const response = await browser.runtime.sendMessage({ type:"KEEPIT_CLOSE_AI_PANEL", windowId });
    return response?.closed === true;
  } catch (error) {
    console.warn("Could not close the legacy Chromium AI side panel", error);
    return false;
  }
}
function trackAIPanel(windowId, tabId, open) {
  if (Number.isInteger(windowId) && !open) {
    cancelAIPanelContextSwitch(windowId);
    clearAIPanelExplicitOpen(windowId);
    void clearPendingAIPanelRequests(windowId);
  }
  const targetTabId = Number.isInteger(tabId) ? tabId : (Number.isInteger(windowId) ? aiPanelSourceTabs.get(windowId) : null);
  if (Number.isInteger(windowId) && windowId >= 0) {
    if (open) aiPanelOpenWindows.add(windowId); else aiPanelOpenWindows.delete(windowId);
    if (Number.isInteger(tabId)) aiPanelSourceTabs.set(windowId, tabId);
    else if (!open) aiPanelSourceTabs.delete(windowId);
  }
  aiPanelOpen = open ? true : aiPanelOpenWindows.size > 0;
  if (aiPanelStateRestoreSnapshot) {
    if (Number.isInteger(windowId) && windowId >= 0) {
      if (open) aiPanelStateRestoreSnapshot.add(windowId);
      else aiPanelStateRestoreSnapshot.delete(windowId);
    }
  }
  aiPanelStateRevision++;
  const persisted = persistAIPanelState();
  void setAIPanelPageScrollbar(targetTabId, open);
  return persisted;
}
globalThis.chrome?.sidePanel?.onOpened?.addListener(async info => {
  const windowId = info?.windowId;
  let tabId = info?.tabId ?? (Number.isInteger(windowId) ? aiPanelSourceTabs.get(windowId) : null);
  if (!Number.isInteger(tabId) && Number.isInteger(windowId)) {
    try { tabId = (await browser.tabs.query({ active:true, windowId }))?.[0]?.id; } catch {}
  }
  await trackAIPanel(windowId, tabId, true);
  if (aiPanelExplicitOpenWindows.has(windowId)) return;
  try {
    const requestState = await browser.storage.local.get([AI_PANEL_NAVIGATION_KEY, AI_LINK_PENDING_KEY]);
    const nav = requestState?.[AI_PANEL_NAVIGATION_KEY];
    const link = requestState?.[AI_LINK_PENDING_KEY];
    if ((nav?.windowId === windowId && nav.mode !== "context-switch") || link?.windowId === windowId) return;
  } catch {}
  if (Number.isInteger(tabId)) {
    const revision = nextAIPanelContextRevision(windowId);
    try { const tab = await browser.tabs.get(tabId); void queueAIPanelSourceContext(tab, 0, revision); } catch {}
  }
});
globalThis.chrome?.sidePanel?.onClosed?.addListener(async info => {
  const windowId = info?.windowId;
  const tabId = info?.tabId ?? (Number.isInteger(windowId) ? aiPanelSourceTabs.get(windowId) : null);
  await trackAIPanel(windowId, tabId, false);
});
// Browsers without a side panel / sidebar (Edge and Chrome on Android, Firefox Android): the Keepit bar's Ask AI
// opens the AI panel page as a tab next to the page (reused if already open). The page link travels in ?src= and is
// only added to the message on Send, exactly like the side panel.
const aiIsMobile = () => globalThis.navigator?.userAgentData?.mobile === true || /Android|Mobile/i.test(globalThis.navigator?.userAgent || "");
async function openAIPanelTab(sourceTab) {
  try {
    const base = browser.runtime.getURL("pages/ai-panel.html");
    const src = normalizeAISourceUrl(sourceTab?.url);
    const url = base + (src ? "?src=" + encodeURIComponent(src) : "");
    const inWindow = Number.isInteger(sourceTab?.windowId) ? { windowId:sourceTab.windowId } : { currentWindow:true };
    const existing = (await browser.tabs.query(inWindow)).find(t => String(t.url || "").startsWith(base));
    if (existing) await browser.tabs.update(existing.id, { url, active:true });
    else await browser.tabs.create({ url, active:true, ...(Number.isInteger(sourceTab?.index) ? { index:sourceTab.index + 1 } : {}), ...(Number.isInteger(sourceTab?.id) ? { openerTabId:sourceTab.id } : {}), ...(Number.isInteger(sourceTab?.windowId) ? { windowId:sourceTab.windowId } : {}) });
    return { ok:true, browser:"tab", opened:true, tab:true };
  } catch (error) {
    return { ok:false, error:"panel-tab-failed", reason:String(error?.message || error || "unknown-error") };
  }
}
async function openAIPanel({ sender, tab, toggle = true, tabFallback = false } = {}) {
  const sourceTab = tab || sender?.tab;
  const windowId = aiPanelWindowId(sourceTab);
  const chromePanel = globalThis.chrome?.sidePanel;
  if (tabFallback && typeof chromePanel?.open !== "function" && typeof globalThis.browser?.sidebarAction?.toggle !== "function") return openAIPanelTab(sourceTab);
  if (typeof chromePanel?.open === "function") {
    try {
      const alreadyOpen = aiPanelIsOpen(windowId);
      if (!toggle && alreadyOpen) {
        await trackAIPanel(windowId, sourceTab?.id, true);
        return { ok:true, browser:"chromium", opened:true, toggled:false };
      }
      const stateRevisionAtToggle = aiPanelStateRevision;
      if (toggle && alreadyOpen) {
        const closed = await closeChromiumAIPanel(windowId, chromePanel);
        if (!closed) return { ok:false, error:"panel-close-failed" };
        await trackAIPanel(windowId, sourceTab?.id, false);
        return { ok:true, browser:"chromium", opened:false, toggled:true };
      }
      // Keep open() in the original user-gesture turn. Selected-text requests are
      // open-or-keep-open; Alt+X and existing launchers retain their toggle behavior.
      const openPromise = chromePanel.open({ windowId });
      await openPromise;
      if (toggle && !alreadyOpen) {
        const restoredOpenWindows = await aiPanelStateRestorePromise;
        if (aiPanelStateRevision === stateRevisionAtToggle && restoredOpenWindows.has(windowId)) {
          const closed = await closeChromiumAIPanel(windowId, chromePanel);
          if (closed) {
            await trackAIPanel(windowId, sourceTab?.id, false);
            return { ok:true, browser:"chromium", opened:false, toggled:true };
          }
        }
      }
      await trackAIPanel(windowId, sourceTab?.id, true);
      if (Number.isInteger(sourceTab?.id)) {
        const revision = nextAIPanelContextRevision(windowId);
        void queueAIPanelSourceContext(sourceTab, 0, revision);
      }
      return { ok:true, browser:"chromium", opened:true, toggled:toggle };
    } catch (error) {
      const reason = String(error?.message || error || "unknown-error");
      console.warn("Could not open the AI panel in Chromium", reason);
      if (tabFallback && aiIsMobile()) return openAIPanelTab(sourceTab);
      return { ok:false, error:"panel-toggle-failed", reason };
    }
  }
  const firefoxSidebar = globalThis.browser?.sidebarAction;
  if (typeof firefoxSidebar?.toggle === "function") {
    try {
      const sidebarOptions = Number.isInteger(sourceTab?.windowId) ? { windowId:sourceTab.windowId } : {};
      if (!toggle && aiPanelIsOpen(windowId)) {
        await trackAIPanel(windowId, sourceTab?.id, true);
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
      await trackAIPanel(windowId, sourceTab?.id, opened);
      if (opened && Number.isInteger(sourceTab?.id)) {
        const revision = nextAIPanelContextRevision(windowId);
        void queueAIPanelSourceContext(sourceTab, 0, revision);
      }
      return { ok:true, browser:"firefox", opened, toggled:toggle };
    } catch (error) {
      const reason = String(error?.message || error || "unknown-error");
      console.warn("Could not open the AI panel in the Firefox sidebar", reason);
      if (tabFallback && aiIsMobile()) return openAIPanelTab(sourceTab);
      return { ok:false, error:"panel-toggle-failed", reason };
    }
  }
  return { ok:false, error:"side-panel-unsupported" };
}

// AI prompt flow: uses the current tab URL and, only for Ask AI, the explicit text selection; never requests page body/title.
function normalizeAISourceUrl(value) {
  return globalThis.LHN_AI_PROVIDERS?.normalizeSourceUrl(value) || "";
}
function aiConversationUrl(providerId, value) {
  return globalThis.LHN_AI_PROVIDERS?.normalizeConversationUrl(providerId, value) || "";
}
// The AI page that sent a message (content scripts run on the provider origin).
function aiSenderProvider(sender) {
  const provider = globalThis.LHN_AI_PROVIDERS?.fromUrl(sender?.url);
  return globalThis.LHN_AI_PROVIDERS?.isPanelProvider(provider?.id) ? provider : null;
}
function normalizeAIInstruction(value, fallback) {
  const normalized = String(value ?? "").replace(/\s+/g, " ").trim().slice(0, 500);
  return normalized || String(fallback || "").trim();
}
function getAIPromptLanguage(settings) {
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
async function getAIPromptSettings() {
  const stored = await browser.storage.local.get(CONFIG.STORAGE_KEYS.SETTINGS);
  const settings = stored?.[CONFIG.STORAGE_KEYS.SETTINGS] || {};
  const language = getAIPromptLanguage(settings);
  return {
    autoSend:settings.chatGPTAutoSend === true,
    language,
    websiteLabel:globalThis.LHN_CHATGPT_PROMPTS.websiteLabel(language),
    summaryPrompt:globalThis.LHN_CHATGPT_PROMPTS.resolve(language, "chatGPTSummaryPrompt", settings.chatGPTSummaryPrompt),
    askPrompt:globalThis.LHN_CHATGPT_PROMPTS.resolve(language, "chatGPTAskPrompt", settings.chatGPTAskPrompt)
  };
}
async function prepareAIManualLinkSend(message, sender) {
  const provider = aiSenderProvider(sender);
  if (!provider || (message?.providerId && message.providerId !== provider.id)) return { ok:false, error:"invalid-ai-provider" };
  const sourceUrl = normalizeAISourceUrl(message?.sourceUrl);
  if (!sourceUrl) return { ok:false, error:"source-url-unavailable" };
  const senderWindowId = Number.isInteger(sender?.tab?.windowId) ? sender.tab.windowId : null;
  const windowId = Number.isInteger(senderWindowId) ? senderWindowId : aiPanelFocusedWindowId;
  if (!Number.isInteger(windowId)) return { ok:false, error:"panel-window-unavailable" };
  await aiPanelStateRestorePromise;
  if (!await aiPanelIsActuallyOpen(windowId)) return { ok:false, error:"panel-not-open" };
  const currentSource = aiPanelSourceUrls.get(windowId) || "";
  if (currentSource && currentSource !== sourceUrl) return { ok:false, stale:true };
  if (!currentSource) await rememberAIPanelSourceUrl(windowId, sourceUrl);

  // Sending in the mapped chat adds nothing. Sending in any other chat (another conversation or a
  // new chat) adds the label + URL once, and the confirmed send then maps the source to that chat.
  const mappingData = await browser.storage.local.get(provider.conversationMapKey);
  const mappedConversation = aiConversationUrl(provider.id, mappingData?.[provider.conversationMapKey]?.[sourceUrl]);
  const sendingConversation = aiConversationUrl(provider.id, message?.conversationUrl);
  if (mappedConversation && mappedConversation === sendingConversation) {
    return { ok:true, mapped:true };
  }

  const settings = await getAIPromptSettings();
  const pendingData = await browser.storage.local.get(AI_LINK_PENDING_KEY);
  const existing = pendingData?.[AI_LINK_PENDING_KEY];
  if (existing && existing.expiresAt > Date.now() && existing.windowId === windowId && existing.sourceUrl === sourceUrl
      && (existing.providerId || "chatgpt") === provider.id && ["draft-link", "manual-link"].includes(existing.mode)) {
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
    providerId:provider.id,
    mode:"manual-link",
    expiresAt:Date.now() + 120000
  };
  await browser.storage.local.set({ [AI_LINK_PENDING_KEY]:pending });
  setTimeout(() => { void clearExpiredAILinkPending(requestId); }, 121000);
  return { ok:true, mapped:false, requestId, mode:pending.mode, websiteLabel:settings.websiteLabel };
}
function makeAIQuestionPrompt(selectedText, instruction = CONFIG.DEFAULT_SETTINGS.chatGPTAskPrompt) {
  return `"${String(selectedText || "").trim()}"\n${normalizeAIInstruction(instruction, CONFIG.DEFAULT_SETTINGS.chatGPTAskPrompt)}`;
}
async function queueAILinkPanelFlow(tab, { intent = "summary", selectedText = "", focusComposer = false } = {}) {
  const sourceUrl = normalizeAISourceUrl(tab?.url);
  if (!sourceUrl) return { ok:false, error:"source-url-unavailable" };
  const askingAboutSelection = intent === "ask-selected-text";
  const selection = String(selectedText || "").trim();
  if (askingAboutSelection && !selection) return { ok:false, error:"selected-text-unavailable" };
  const windowId = Number.isInteger(tab?.windowId) ? tab.windowId : null;
  if (Number.isInteger(windowId)) cancelAIPanelContextSwitch(windowId);
  const actionRevision = Number.isInteger(windowId) ? aiPanelContextRevisions.get(windowId) : null;
  const actionStillCurrent = async () => {
    if (!Number.isInteger(windowId)) return true;
    if (aiPanelContextRevisions.get(windowId) !== actionRevision) return false;
    return aiPanelIsActuallyOpen(windowId);
  };
  await browser.storage.local.remove([AI_LINK_PENDING_KEY, AI_PANEL_NAVIGATION_KEY]);
  if (!await actionStillCurrent()) return { ok:false, error:"panel-closed" };
  const promptSettings = await getAIPromptSettings();
  if (!await actionStillCurrent()) return { ok:false, error:"panel-closed" };
  const selectedProvider = await getAIProviderForWindow(windowId);
  const provider = globalThis.LHN_AI_PROVIDERS?.isPanelProvider(selectedProvider?.id) ? selectedProvider : globalThis.LHN_AI_PROVIDERS?.get("chatgpt");
  const mappingKey = provider?.conversationMapKey;
  const stored = mappingKey ? await browser.storage.local.get(mappingKey) : {};
  if (!await actionStillCurrent()) return { ok:false, error:"panel-closed" };
  const conversations = stored?.[mappingKey] || {};
  const savedConversation = aiConversationUrl(provider?.id, conversations[sourceUrl]);
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
    const storedRequests = await browser.storage.local.get([AI_PANEL_NAVIGATION_KEY, AI_LINK_PENDING_KEY]);
    const remove = [];
    if (storedRequests?.[AI_PANEL_NAVIGATION_KEY]?.requestId === navigationRequest.requestId) remove.push(AI_PANEL_NAVIGATION_KEY);
    if (linkRequestId && storedRequests?.[AI_LINK_PENDING_KEY]?.requestId === linkRequestId) remove.push(AI_LINK_PENDING_KEY);
    if (remove.length) await browser.storage.local.remove(remove);
  };
  let createdLinkRequestId = "";
  if (!savedConversation) {
    const linkRequestId = `link-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    createdLinkRequestId = linkRequestId;
    const promptLine = askingAboutSelection ? makeAIQuestionPrompt(selection, promptSettings.askPrompt) : promptSettings.summaryPrompt;
    const prompt = providerAutoSend
      ? globalThis.LHN_AI_PROMPT_FORMAT.formatLinkPrompt(promptSettings.websiteLabel, sourceUrl, promptLine)
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
    // ?q= only for providers that support it, and only when auto-sent; the panel adds the request markers.
    navigationRequest.targetUrl = globalThis.LHN_AI_PROVIDERS?.linkTarget(provider?.id, prompt, providerAutoSend) || provider?.startUrl || "https://chatgpt.com/";
    navigationRequest.linkRequestId = linkRequestId;
    if (!await actionStillCurrent()) return { ok:false, error:"panel-closed" };
    await browser.storage.local.set({ [AI_LINK_PENDING_KEY]:pending });
    if (!await actionStillCurrent()) { await clearActionRequests(linkRequestId); return { ok:false, error:"panel-closed" }; }
    setTimeout(() => { void clearExpiredAILinkPending(linkRequestId); }, providerAutoSend ? 121000 : 86401000);
  } else if (askingAboutSelection) {
    // Exact mapped-route Hỏi AI replaces the existing composer prompt; auto-send is optional.
    const linkRequestId = `link-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const pending = {
      requestId:linkRequestId,
      windowId:Number.isInteger(tab?.windowId) ? tab.windowId : null,
      sourceTabId:Number.isInteger(tab?.id) ? tab.id : null,
      sourceUrl,
      conversationUrl:savedConversation,
      prompt:makeAIQuestionPrompt(selection, promptSettings.askPrompt),
      providerId:provider?.id || "chatgpt",
      mode:providerAutoSend ? "auto-send-followup" : "draft-followup",
      expiresAt:Date.now() + 120000
    };
    navigationRequest.targetUrl = savedConversation;
    navigationRequest.mode = "followup";
    navigationRequest.linkRequestId = linkRequestId;
    if (!await actionStillCurrent()) return { ok:false, error:"panel-closed" };
    await browser.storage.local.set({ [AI_LINK_PENDING_KEY]:pending });
    if (!await actionStillCurrent()) { await clearActionRequests(linkRequestId); return { ok:false, error:"panel-closed" }; }
    setTimeout(() => { void clearExpiredAILinkPending(linkRequestId); }, 121000);
  } else {
    navigationRequest.targetUrl = savedConversation;
  }
  if (!await actionStillCurrent()) { await clearActionRequests(createdLinkRequestId); return { ok:false, error:"panel-closed" }; }
  await browser.storage.local.set({ [AI_PANEL_NAVIGATION_KEY]:navigationRequest });
  if (!await actionStillCurrent()) { await clearActionRequests(createdLinkRequestId); return { ok:false, error:"panel-closed" }; }
  if (Number.isInteger(tab?.windowId)) await rememberAIPanelSourceUrl(tab.windowId, sourceUrl);
  if (!await actionStillCurrent()) { await clearActionRequests(createdLinkRequestId); return { ok:false, error:"panel-closed" }; }
  const action = !savedConversation
    ? (askingAboutSelection ? "ask-selected-text-new" : "send-summary")
    : (askingAboutSelection ? "ask-selected-text-existing" : "reopen-existing");
  return { ok:true, action };
}
async function openAILinkPanel({ sender, tab, intent = "summary", selectedText = "" } = {}) {
  const sourceTab = tab || sender?.tab;
  if (intent === "ask-selected-text" && !String(selectedText || "").trim()) return { ok:false, error:"selected-text-unavailable" };
  const windowId = Number.isInteger(sourceTab?.windowId) ? sourceTab.windowId : null;
  if (Number.isInteger(windowId)) markAIPanelExplicitOpen(windowId);
  try {
    // Alt+X keeps its toggle contract. Ask AI opens or keeps the panel open so the question can be sent.
    const panel = await openAIPanel({ sender, tab:sourceTab, toggle:intent !== "ask-selected-text" });
    if (!panel?.ok || !panel.opened) return panel;
    if (Number.isInteger(windowId)) await trackAIPanel(windowId, sourceTab.id, true);
    const flow = await queueAILinkPanelFlow(sourceTab, { intent, selectedText, focusComposer:true });
    return { ...panel, ...flow };
  } finally { if (Number.isInteger(windowId)) clearAIPanelExplicitOpen(windowId); }
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
    await trackAIPanel(tab.windowId, tab.id, true);
    const flow = await queueAILinkPanelFlow(tab, { intent:"ask-selected-text", selectedText });
    await browser.tabs.sendMessage(tab.id, flow?.ok
      ? { type:"AI_LINK_PANEL_QUEUED", action:flow.action }
      : { type:"AI_LINK_PANEL_FAILED" });
  }).catch(async error => {
    console.warn("Could not open the AI panel from the selection context menu", String(error?.message || error));
    try { await browser.tabs.sendMessage(tab.id, { type:"AI_PANEL_OPEN_FAILED" }); } catch {}
  });
}
if (globalThis.browser?.contextMenus?.onClicked) {
  globalThis.browser.contextMenus.onClicked.addListener(onAskAIContextMenu);
  // Register immediately as well as on install/startup to keep one selection menu in both engines.
  void ensureAskAIContextMenu();
}

async function clearExpiredAILinkPending(expectedRequestId = "") {
  const stored = await browser.storage.local.get(AI_LINK_PENDING_KEY);
  const pending = stored?.[AI_LINK_PENDING_KEY];
  if (pending && pending.expiresAt <= Date.now() && (!expectedRequestId || pending.requestId === expectedRequestId)) {
    await browser.storage.local.remove(AI_LINK_PENDING_KEY);
    return true;
  }
  return false;
}
async function completeAILinkRequest(message, sender) {
  const stored = await browser.storage.local.get(AI_LINK_PENDING_KEY);
  const pending = stored?.[AI_LINK_PENDING_KEY];
  if (!pending || message?.requestId !== pending.requestId) return { ok:false, stale:true };
  const provider = globalThis.LHN_AI_PROVIDERS?.get(pending.providerId || "chatgpt");
  const senderProvider = aiSenderProvider(sender);
  if (!provider || (senderProvider && senderProvider.id !== provider.id)) return { ok:false, stale:true };
  const conversationUrl = message.ok === true ? aiConversationUrl(provider.id, message.conversationUrl) : "";
  if (conversationUrl) {
    const mappingData = await browser.storage.local.get(provider.conversationMapKey);
    const mappings = { ...(mappingData?.[provider.conversationMapKey] || {}) };
    delete mappings[pending.sourceUrl];
    mappings[pending.sourceUrl] = conversationUrl;
    await browser.storage.local.set({ [provider.conversationMapKey]:mappings });
  }
  await browser.storage.local.remove(AI_LINK_PENDING_KEY);
  if (Number.isInteger(pending.sourceTabId)) {
    try {
      await browser.tabs.sendMessage(pending.sourceTabId, {
        type:"AI_PANEL_RESULT",
        ok:Boolean(conversationUrl),
        reason:conversationUrl ? "" : String(message.reason || "conversation-not-created")
      });
    } catch { /* source tab may have navigated or closed */ }
  }
  return { ok:Boolean(conversationUrl), conversationUrl };
}
async function notifyAILinkDraftReady(message) {
  const stored = await browser.storage.local.get(AI_LINK_PENDING_KEY);
  const pending = stored?.[AI_LINK_PENDING_KEY];
  if (!pending || pending.requestId !== message?.requestId || pending.mode !== "draft-link") return { ok:false, stale:true };
  const updated = { ...pending, draftReady:true, expiresAt:Date.now() + 86400000 };
  await browser.storage.local.set({ [AI_LINK_PENDING_KEY]:updated });
  setTimeout(() => { void clearExpiredAILinkPending(updated.requestId); }, 86401000);
  if (Number.isInteger(updated.sourceTabId)) {
    try { await browser.tabs.sendMessage(updated.sourceTabId, { type:"AI_PANEL_RESULT", ok:true, reason:"draft-ready" }); } catch {}
  }
  return { ok:true };
}
function openAIPanelFromCommand(commandTab) {
  // The command id "open-chatgpt-sidepanel" is kept so users' custom shortcuts survive updates.
  // Open/toggle in the command gesture, then pass only the active tab URL to the new flow.
  // Use the window of the tab the browser passes with the command: after a service-worker
  // restart the remembered focused window is gone, and WINDOW_ID_CURRENT cannot close the panel.
  const windowId = Number.isInteger(commandTab?.windowId) && commandTab.windowId >= 0 ? commandTab.windowId : null;
  let togglePromise;
  try { togglePromise = openAIPanel(windowId === null ? {} : { tab:{ windowId } }); }
  catch (error) { togglePromise = Promise.reject(error); }
  const tabPromise = Number.isInteger(commandTab?.id) && windowId !== null
    ? Promise.resolve(commandTab)
    : browser.tabs.query({ active:true, currentWindow:true }).then(tabs => tabs?.[0] || null);
  Promise.allSettled([togglePromise, tabPromise]).then(async ([panelResult, tabResult]) => {
    const tab = tabResult.status === "fulfilled" ? tabResult.value : null;
    const panel = panelResult.status === "fulfilled" ? panelResult.value : null;
    if (!panel?.ok) {
      const reason = panelResult.status === "rejected" ? String(panelResult.reason?.message || panelResult.reason) : panel?.reason || panel?.error;
      console.warn("Could not toggle the AI panel from the keyboard command", reason || "unknown-error");
      if (tab?.id) try { await browser.tabs.sendMessage(tab.id, { type:"AI_PANEL_OPEN_FAILED" }); } catch {}
      return;
    }
    if (!panel.opened) {
      if (tab?.id) try { await browser.tabs.sendMessage(tab.id, { type:"AI_PANEL_TOGGLED_CLOSED" }); } catch {}
      return;
    }
    if (tab?.id) {
      await trackAIPanel(tab.windowId, tab.id, true);
      const queued = await queueAILinkPanelFlow(tab, { focusComposer:true });
      if (!queued.ok) {
        try { await browser.tabs.sendMessage(tab.id, { type:"AI_LINK_PANEL_FAILED" }); } catch {}
      } else {
        try { await browser.tabs.sendMessage(tab.id, { type:"AI_LINK_PANEL_QUEUED", action:queued.action }); } catch {}
      }
    }
  }).catch(error => console.warn("Could not finish the AI panel keyboard command", error));
}
browser.commands?.onCommand.addListener((command, tab) => {
  if (command === "open-chatgpt-sidepanel") void openAIPanelFromCommand(tab);
});

// AI runtime messages (pages, panel and content script) handled by the background router.
const ASK_AI_UNHANDLED = Symbol("ask-ai-unhandled");
const ASK_AI_MESSAGE_TYPES = new Set([
  "AI_PANEL_GROK_AUTH_FRAME_DETECTED", "AI_PANEL_PROVIDER_SELECTED", "AI_PANEL_CONTEXT_READY", "AI_PANEL_ROUTE_CONTEXT", "AI_PANEL_HOST_CLOSED", "AI_LINK_PREPARE", "AI_LINK_RESULT", "AI_LINK_DRAFT_READY", "OPEN_AI_PANEL", "TOGGLE_AI_PANEL"
]);
async function handleAskAIMessage(message, sender) {
  if (message.type === "AI_PANEL_GROK_AUTH_FRAME_DETECTED") return openGrokSignInTabFromEmbeddedAuth(message, sender);
  if (message.type === "AI_PANEL_PROVIDER_SELECTED") {
    const provider = globalThis.LHN_AI_PROVIDERS?.get(message.providerId);
    const windowId = Number.isInteger(message.windowId) ? message.windowId : (sender?.tab?.windowId ?? aiPanelFocusedWindowId);
    if (!provider || !globalThis.LHN_AI_PROVIDERS?.isPanelProvider(provider.id) || !Number.isInteger(windowId)) return { ok:false, error:"invalid-ai-provider" };
    return { ok:await rememberAIProviderForWindow(windowId, provider.id), providerId:provider.id };
  }
  // Firefox AI panel host page loaded in the sidebar (Chromium uses sidePanel.onOpened).
  if (message.type === "AI_PANEL_CONTEXT_READY" && typeof browser.sidebarAction?.isOpen === "function") {
    try {
      const windowId = Number.isInteger(message.windowId) ? message.windowId : (sender?.tab?.windowId ?? aiPanelFocusedWindowId);
      if (await browser.sidebarAction.isOpen(Number.isInteger(windowId) ? { windowId } : {})) {
        const wasOpen = aiPanelOpenWindows.has(windowId);
        const active = Number.isInteger(sender?.tab?.id) ? sender.tab
          : (await browser.tabs.query(Number.isInteger(windowId) ? { active:true, windowId } : { active:true, currentWindow:true }))?.[0];
        await trackAIPanel(windowId, active?.id, true);
        if (!wasOpen && Number.isInteger(active?.id)) {
          const revision = nextAIPanelContextRevision(windowId);
          void queueAIPanelSourceContext(active, 0, revision);
        }
        return { ok:true, open:true };
      }
    } catch {}
    return { ok:true, open:false };
  }
  if (message.type === "AI_PANEL_ROUTE_CONTEXT") {
    const windowId = Number.isInteger(message.windowId) ? message.windowId : (sender?.tab?.windowId ?? aiPanelFocusedWindowId);
    const provider = aiSenderProvider(sender);
    const sourceUrl = normalizeAISourceUrl(message.sourceUrl);
    const chatUrl = globalThis.LHN_AI_PROVIDERS?.panelRoute(provider?.id, message.chatUrl) || "";
    if (!Number.isInteger(windowId) || !provider || (message.providerId && message.providerId !== provider.id) || !sourceUrl || !chatUrl) {
      return { ok:false, error:"invalid-panel-route-context" };
    }
    const currentSource = aiPanelSourceUrls.get(windowId);
    if (currentSource && currentSource !== sourceUrl) return { ok:false, stale:true };
    return { ok:await rememberAIPanelRouteContext(windowId, sourceUrl, provider.id, chatUrl) };
  }
  if (message.type === "AI_PANEL_HOST_CLOSED") {
    const windowId = Number.isInteger(message.windowId) ? message.windowId : (sender?.tab?.windowId ?? aiPanelFocusedWindowId);
    if (Number.isInteger(windowId)) await trackAIPanel(windowId, aiPanelSourceTabs.get(windowId), false);
    return { ok:true };
  }
  if (message.type === "AI_LINK_PREPARE") return prepareAIManualLinkSend(message, sender);
  if (message.type === "AI_LINK_RESULT") return completeAILinkRequest(message, sender);
  if (message.type === "AI_LINK_DRAFT_READY") return notifyAILinkDraftReady(message);
  if (message.type === "OPEN_AI_PANEL") return openAILinkPanel({ sender, intent:message.intent, selectedText:message.selectedText });
  // Page edge button shown while the panel is open: same toggle as Alt+X, in the sender's window.
  if (message.type === "TOGGLE_AI_PANEL") return openAIPanel({ sender, toggle:true, tabFallback:message.tabFallback === true });
  return ASK_AI_UNHANDLED;
}
