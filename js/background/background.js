if (typeof importScripts === "function") {
  importScripts("/js/core/browser-polyfill.js", "/js/core/messaging.js", "/js/core/error-logger.js", "/js/core/defaults.js", "/js/core/config.js", "/js/core/settings.js", "/js/core/cache.js", "/js/translate/translate.js", "/js/background/usage-limits.js", "/js/background/annotations.js");
}
const CONFIG = globalThis.LHN_CONFIG;
const USAGE_LIMITS = globalThis.LHN_USAGE_LIMITS.create({ browser });
async function resetLegacyDictationWrongWordStats() {
  const storage = browser?.storage?.local;
  if (!storage) return;
  try {
    // One-time upgrade migration: clear only the old error aggregates, preserving each session's notes/progress.
    const allData = await storage.get(null);
    const updates = {};
    for (const [key, record] of Object.entries(allData || {})) {
      if (!/^dictation:[A-Za-z0-9_-]{6,}$/.test(key)) continue;
      const stats = record?.wrongWordStats;
      if (!record || !stats || Number(stats.version) >= 3) continue;
      updates[key] = { ...record, wrongWordStats: { version: 3, words: {} } };
    }
    if (Object.keys(updates).length) await storage.set(updates);
  } catch (error) {
    console.warn("Could not reset legacy Dictation error statistics", error);
  }
}
const CHATGPT_FRAME_RULE_ID = 9002;
function ensureChatGPTFrameRule(forceUpdate = false) {
  const dnr = globalThis.chrome?.declarativeNetRequest;
  const extensionId = globalThis.chrome?.runtime?.id;
  if (!globalThis.chrome?.sidePanel || !dnr?.updateDynamicRules || !dnr?.getDynamicRules || !extensionId) return Promise.resolve(false);
  return dnr.getDynamicRules().then(rules => {
    if (!forceUpdate && rules.some(rule => rule.id === CHATGPT_FRAME_RULE_ID)) return true;
    return dnr.updateDynamicRules({
      removeRuleIds: [CHATGPT_FRAME_RULE_ID],
      addRules: [{
        id: CHATGPT_FRAME_RULE_ID,
        priority: 1,
        action: { type: "modifyHeaders", responseHeaders: [
          { header: "x-frame-options", operation: "remove" },
          { header: "content-security-policy", operation: "remove" }
        ] },
        condition: {
          requestDomains: ["chatgpt.com", "chat.openai.com"],
          initiatorDomains: [extensionId],
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
let chatGPTPanelOpen = false;
let chatGPTFocusedWindowId = null;
const chatGPTOpenWindows = new Set();
const chatGPTSourceTabs = new Map();
let chatGPTPanelStateRevision = 0;
let chatGPTPanelStateWrite = Promise.resolve();
async function restoreChatGPTPanelState() {
  try {
    const sessionStorage = browser.storage.session;
    if (!sessionStorage?.get) return new Set();
    const stateAtStart = chatGPTPanelStateRevision;
    const stored = await sessionStorage.get(CHATGPT_PANEL_STATE_KEY);
    const ids = stored?.[CHATGPT_PANEL_STATE_KEY];
    let openWindows = Array.isArray(ids) ? [...new Set(ids.filter(id => Number.isInteger(id) && id >= 0))] : [];
    if (browser.windows?.getAll) {
      const live = new Set((await browser.windows.getAll()).map(win => win.id));
      openWindows = openWindows.filter(id => live.has(id));
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
    .then(() => sessionStorage.set({ [CHATGPT_PANEL_STATE_KEY]:openWindows }))
    .catch(error => console.warn("Could not save ChatGPT panel toggle state", error));
  return chatGPTPanelStateWrite;
}
browser.tabs.onActivated?.addListener(async ({ windowId, tabId }) => {
  if (!Number.isInteger(windowId)) return;
  chatGPTFocusedWindowId = windowId;
  const previousTabId = chatGPTSourceTabs.get(windowId);
  if (Number.isInteger(previousTabId) && previousTabId !== tabId) void setChatGPTPageScrollbar(previousTabId, false);
  if (chatGPTOpenWindows.has(windowId)) {
    chatGPTSourceTabs.set(windowId, tabId);
    void setChatGPTPageScrollbar(tabId, true);
  }
  const sidebar = globalThis.browser?.sidebarAction;
  if (typeof sidebar?.isOpen === "function") {
    try {
      const opened = await sidebar.isOpen({ windowId });
      if (opened) await trackChatGPTPanel(windowId, tabId, true);
      else if (chatGPTOpenWindows.has(windowId)) await trackChatGPTPanel(windowId, tabId, false);
    } catch { /* Firefox may not report sidebar state for a closing window */ }
  }
});
browser.windows?.onFocusChanged?.addListener(windowId => { if (Number.isInteger(windowId) && windowId >= 0) chatGPTFocusedWindowId = windowId; });
browser.windows?.onRemoved?.addListener(windowId => {
  chatGPTOpenWindows.delete(windowId);
  chatGPTPanelStateRestoreSnapshot?.delete(windowId);
  chatGPTSourceTabs.delete(windowId);
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
});
globalThis.chrome?.sidePanel?.onClosed?.addListener(async info => {
  const windowId = info?.windowId;
  const tabId = info?.tabId ?? (Number.isInteger(windowId) ? chatGPTSourceTabs.get(windowId) : null);
  await trackChatGPTPanel(windowId, tabId, false);
});
async function clearExpiredChatGPTDraft(expectedRequestId = "") {
  const stored = await browser.storage.local.get(CHATGPT_DRAFT_PENDING_KEY);
  const pending = stored?.[CHATGPT_DRAFT_PENDING_KEY];
  if (pending && pending.expiresAt <= Date.now() && (!expectedRequestId || pending.requestId === expectedRequestId)) {
    await browser.storage.local.remove(CHATGPT_DRAFT_PENDING_KEY);
    return true;
  }
  return false;
}
async function registerChatGPTDraft(tabId, truncated = false) {
  await clearExpiredChatGPTDraft();
  const pending = {
    requestId:`${Date.now()}-${Math.random().toString(36).slice(2)}`,
    sourceTabId:Number.isInteger(tabId) ? tabId : null,
    truncated:truncated === true,
    expiresAt:Date.now() + 90000
  };
  await browser.storage.local.set({ [CHATGPT_DRAFT_PENDING_KEY]:pending });
  setTimeout(() => { void clearExpiredChatGPTDraft(pending.requestId); }, 91000);
  return { ok:true, requestId:pending.requestId };
}
async function notifyChatGPTDraftResult(message) {
  const stored = await browser.storage.local.get(CHATGPT_DRAFT_PENDING_KEY);
  const pending = stored?.[CHATGPT_DRAFT_PENDING_KEY];
  if (!pending || typeof message.requestId !== "string" || message.requestId !== pending.requestId) return { ok:false, stale:true };
  await browser.storage.local.remove(CHATGPT_DRAFT_PENDING_KEY);
  if (Number.isInteger(pending.sourceTabId)) {
    try { await browser.tabs.sendMessage(pending.sourceTabId, { type:"CHATGPT_AUTOFILL_RESULT", ok:message.ok === true, reason:message.reason || "", truncated:pending.truncated === true }); }
    catch { /* the source tab may have navigated or closed */ }
  }
  return { ok:true };
}
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
function makeChatGPTLinkTarget(prompt, requestId) {
  const target = new URL("https://chatgpt.com/");
  target.searchParams.set("q", prompt);
  const hash = new URLSearchParams();
  hash.set("keepit-chatgpt-panel", "1");
  hash.set("keepit-chatgpt-link-request", requestId);
  target.hash = hash.toString();
  return target.href;
}
function makeChatGPTQuestionPrompt(selectedText) {
  return `"${String(selectedText || "").trim()}" có nghĩa là gì?`;
}
async function queueChatGPTLinkPanelFlow(tab, { intent = "summary", selectedText = "" } = {}) {
  const sourceUrl = normalizeChatGPTSourceUrl(tab?.url);
  if (!sourceUrl) return { ok:false, error:"source-url-unavailable" };
  const askingAboutSelection = intent === "ask-selected-text";
  const selection = String(selectedText || "").trim();
  if (askingAboutSelection && !selection) return { ok:false, error:"selected-text-unavailable" };
  const stored = await browser.storage.local.get(CHATGPT_SOURCE_CONVERSATIONS_KEY);
  const conversations = stored?.[CHATGPT_SOURCE_CONVERSATIONS_KEY];
  const savedConversation = safeChatGPTConversationUrl(conversations?.[sourceUrl]);
  const navigationRequest = {
    requestId:`nav-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    sourceTabId:Number.isInteger(tab?.id) ? tab.id : null,
    targetUrl:savedConversation || "",
    mode:savedConversation ? "reopen" : "new-link",
    expiresAt:Date.now() + 60000
  };
  if (!savedConversation) {
    const linkRequestId = `link-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const promptLine = askingAboutSelection ? makeChatGPTQuestionPrompt(selection) : "Hãy tóm tắt bài viết này";
    const prompt = `- Website: ${sourceUrl}\n- ${promptLine}`;
    const pending = {
      requestId:linkRequestId,
      sourceTabId:Number.isInteger(tab?.id) ? tab.id : null,
      sourceUrl,
      prompt,
      mode:"auto-send-link",
      expiresAt:Date.now() + 120000
    };
    navigationRequest.targetUrl = makeChatGPTLinkTarget(prompt, linkRequestId);
    navigationRequest.linkRequestId = linkRequestId;
    await browser.storage.local.set({ [CHATGPT_LINK_PENDING_KEY]:pending });
    setTimeout(() => { void clearExpiredChatGPTLinkPending(linkRequestId); }, 121000);
  } else if (askingAboutSelection) {
    // ChatGPT's q= URL only starts a fresh conversation. Use a request-scoped, guarded
    // composer send to append this question to the mapped conversation without its URL.
    const linkRequestId = `link-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const pending = {
      requestId:linkRequestId,
      sourceTabId:Number.isInteger(tab?.id) ? tab.id : null,
      sourceUrl,
      conversationUrl:savedConversation,
      prompt:makeChatGPTQuestionPrompt(selection),
      mode:"auto-send-followup",
      expiresAt:Date.now() + 120000
    };
    navigationRequest.targetUrl = savedConversation;
    navigationRequest.mode = "followup";
    navigationRequest.linkRequestId = linkRequestId;
    await browser.storage.local.set({ [CHATGPT_LINK_PENDING_KEY]:pending });
    setTimeout(() => { void clearExpiredChatGPTLinkPending(linkRequestId); }, 121000);
  } else {
    navigationRequest.targetUrl = savedConversation;
  }
  await browser.storage.local.set({ [CHATGPT_PANEL_NAVIGATION_KEY]:navigationRequest });
  const action = !savedConversation
    ? (askingAboutSelection ? "ask-selected-text-new" : "send-summary")
    : (askingAboutSelection ? "ask-selected-text-existing" : "reopen-existing");
  return { ok:true, action };
}
async function openChatGPTLinkPanel({ sender, tab, intent = "summary", selectedText = "" } = {}) {
  const sourceTab = tab || sender?.tab;
  if (intent === "ask-selected-text" && !String(selectedText || "").trim()) return { ok:false, error:"selected-text-unavailable" };
  // Alt+X keeps its toggle contract. Ask AI opens or keeps the panel open so the question can be sent.
  const panel = await openChatGPTSidePanel({ sender, tab:sourceTab, toggle:intent !== "ask-selected-text" });
  if (!panel?.ok || !panel.opened) return panel;
  if (Number.isInteger(sourceTab?.windowId)) await trackChatGPTPanel(sourceTab.windowId, sourceTab.id, true);
  const flow = await queueChatGPTLinkPanelFlow(sourceTab, { intent, selectedText });
  return { ...panel, ...flow };
}

const FIREFOX_ASK_AI_CONTEXT_MENU_ID = "keepit-ask-ai-selection";
let firefoxAskAIContextMenuRegistration = null;
function ensureFirefoxAskAIContextMenu() {
  const menus = globalThis.browser?.contextMenus;
  if (!globalThis.browser?.sidebarAction || !menus?.create) return Promise.resolve();
  if (firefoxAskAIContextMenuRegistration) return firefoxAskAIContextMenuRegistration;
  firefoxAskAIContextMenuRegistration = (async () => {
    try { await menus.remove(FIREFOX_ASK_AI_CONTEXT_MENU_ID); } catch {}
    try {
      await menus.create({
        id:FIREFOX_ASK_AI_CONTEXT_MENU_ID,
        title:"Keepit: Hỏi AI / Ask AI",
        contexts:["selection"]
      });
    } catch (error) { console.warn("Could not register the Firefox Ask AI selection menu", error); }
  })().finally(() => { firefoxAskAIContextMenuRegistration = null; });
  return firefoxAskAIContextMenuRegistration;
}
function onFirefoxAskAIContextMenu(info, tab) {
  if (info?.menuItemId !== FIREFOX_ASK_AI_CONTEXT_MENU_ID || !Number.isInteger(tab?.id)) return;
  const selectedText = String(info.selectionText || "").trim();
  if (!selectedText) return;
  // Firefox only allows opening its sidebar inside a browser/extension user-action handler.
  // Invoke open() synchronously from the native context-menu click, before any await/message.
  let sidebarPromise;
  try { sidebarPromise = globalThis.browser.sidebarAction.open(); }
  catch (error) { sidebarPromise = Promise.reject(error); }
  void Promise.resolve(sidebarPromise).then(async () => {
    await trackChatGPTPanel(tab.windowId, tab.id, true);
    const flow = await queueChatGPTLinkPanelFlow(tab, { intent:"ask-selected-text", selectedText });
    await browser.tabs.sendMessage(tab.id, flow?.ok
      ? { type:"CHATGPT_LINK_PANEL_QUEUED", action:flow.action }
      : { type:"CHATGPT_LINK_PANEL_FAILED" });
  }).catch(async error => {
    console.warn("Could not open the Firefox ChatGPT sidebar from its selection menu", String(error?.message || error));
    try { await browser.tabs.sendMessage(tab.id, { type:"CHATGPT_PANEL_OPEN_FAILED" }); } catch {}
  });
}
if (globalThis.browser?.sidebarAction && globalThis.browser?.contextMenus?.onClicked) {
  globalThis.browser.contextMenus.onClicked.addListener(onFirefoxAskAIContextMenu);
  // Register immediately as well as on install/startup so the item is present even
  // when Firefox reloads the background context without delivering those lifecycle events.
  void ensureFirefoxAskAIContextMenu();
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
browser.runtime.onInstalled.addListener(async () => {
  try { await clearExpiredChatGPTDraft(); await clearExpiredChatGPTLinkPending(); } catch (error) { console.warn("Could not clean an expired ChatGPT request", error); }
  try { await USAGE_LIMITS.initialize(); }
  catch (error) { console.warn("Could not initialize local usage trial", error); }
  try { await ensureChatGPTFrameRule(true); }
  catch (error) { console.warn("Could not configure the ChatGPT iframe header rule", error); }
  await ensureFirefoxAskAIContextMenu();
  await resetLegacyDictationWrongWordStats();
});
browser.runtime.onStartup?.addListener(() => {
  Promise.all([clearExpiredChatGPTDraft(), clearExpiredChatGPTLinkPending(), ensureFirefoxAskAIContextMenu()]).catch(error => console.warn("Could not clean expired ChatGPT requests or register Firefox selection menu", error));
  ensureChatGPTFrameRule().catch(error => console.warn("Could not configure the ChatGPT iframe header rule", error));
});
async function copyChatGPTContextFromTab(tab) {
  if (!Number.isInteger(tab?.id)) return { ok:false, error:"active-tab-unavailable" };
  try { return await browser.tabs.sendMessage(tab.id, { type:"COPY_CHATGPT_CONTEXT" }); }
  catch (error) {
    console.warn("Could not copy page text for ChatGPT", error);
    return { ok:false, error:"page-content-unavailable" };
  }
}
// Legacy v3.5.60 command flow retained but no longer called: it copied page/main text.
function openChatGPTFromCommandLegacy() {
  let togglePromise;
  try { togglePromise = openChatGPTSidePanel(); }
  catch (error) { togglePromise = Promise.reject(error); }
  const tabPromise = browser.tabs.query({ active:true, currentWindow:true }).then(tabs => tabs?.[0] || null);
  Promise.allSettled([togglePromise, tabPromise]).then(async ([panelResult, tabResult]) => {
    const tab = tabResult.status === "fulfilled" ? tabResult.value : null;
    const panel = panelResult.status === "fulfilled" ? panelResult.value : null;
    if (!panel?.ok || !panel.opened || !tab?.id) return;
    trackChatGPTPanel(tab.windowId, tab.id, true);
    const copied = await copyChatGPTContextFromTab(tab);
    if (copied?.ok) {
      try { await browser.tabs.sendMessage(tab.id, { type:"CHATGPT_AUTOFILL_PENDING" }); } catch {}
      await registerChatGPTDraft(tab.id, copied.truncated === true);
    }
  }).catch(error => console.warn("Could not finish the legacy ChatGPT command", error));
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
      const queued = await queueChatGPTLinkPanelFlow(tab);
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
const ANNOTATIONS = globalThis.LHN_ANNOTATIONS;
const ttsAudioRequests = new Map();
async function fetchTtsAudio(message) {
  const text = typeof message.text === "string" ? message.text.trim() : "";
  const language = typeof message.language === "string" ? message.language.trim().toLowerCase() : "";
  const voice = typeof message.voice === "string" ? message.voice.trim() : "";
  if (!text || !language || !voice || text.length > 500) throw new Error("Invalid or unsupported TTS request");
  const key = `${language}\n${voice}\n${text}`;
  const pending = ttsAudioRequests.get(key);
  if (pending) return pending;
  const request = (async () => {
    try { await LHN_CACHE.ensureTtsAudioCacheBudget(); }
    catch (error) { console.warn("TTS audio cache budget check failed", error); }
    try {
      const cached = await LHN_CACHE.getCachedTtsAudio(key);
      if (cached?.size) return { audioBase64: arrayBufferToBase64(await cached.arrayBuffer()), cached: true };
    } catch (error) { console.warn("TTS cache read failed; requesting fresh audio", error); }

    const usage = await USAGE_LIMITS.consume("googleTts");
    if (!usage.allowed) throw new Error("Google TTS daily usage limit reached");

    const params = new URLSearchParams({ ie: "UTF-8", q: text, tl: language, client: "tw-ob" });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    let blob;
    try {
      const response = await fetch(`https://translate.google.com/translate_tts?${params}`, { signal: controller.signal, credentials: "omit" });
      if (!response.ok) throw new Error(`Google TTS returned HTTP ${response.status}`);
      blob = await response.blob();
      if (!blob.size || (blob.type && !/^audio\//i.test(blob.type))) throw new Error("Google TTS returned no playable audio");
    } finally { clearTimeout(timeout); }
    try { await LHN_CACHE.cacheTtsAudio(key, blob); } catch (error) { console.warn("TTS audio cache write failed", error); }
    return { audioBase64: arrayBufferToBase64(await blob.arrayBuffer()), cached: false };
  })();
  ttsAudioRequests.set(key, request);
  try { return await request; }
  finally { if (ttsAudioRequests.get(key) === request) ttsAudioRequests.delete(key); }
}
async function openDashboard(openSettings = false, openAccount = false, settingsTab = "account") {
  const dashboardUrl = browser.runtime.getURL("pages/dashboard.html");
  const settingsUrl = `${dashboardUrl}?openSettings=1${openAccount ? "&openAccount=1" : ""}${settingsTab !== "account" ? `&openSettingsTab=${encodeURIComponent(settingsTab)}` : ""}`;
  const [tabs, activeTabs] = await Promise.all([
    browser.tabs.query({}),
    browser.tabs.query({ active: true, currentWindow: true })
  ]);
  const existing = tabs.find(tab => tab.url?.split(/[?#]/, 1)[0] === dashboardUrl);
  if (!existing) return browser.tabs.create({ url: openSettings ? settingsUrl : dashboardUrl });
  const activeTab = activeTabs[0];
  if (activeTab?.id !== existing.id) {
    await browser.tabs.update(existing.id, { active: true });
  }
  if (activeTab?.windowId !== existing.windowId) {
    await browser.windows.update(existing.windowId, { focused: true });
  }
  if (openSettings) {
    try { await browser.tabs.sendMessage(existing.id, { type: settingsTab === "bilingualReader" ? "OPEN_DASHBOARD_BILINGUAL_SETTINGS" : openAccount ? "OPEN_DASHBOARD_ACCOUNT" : "OPEN_DASHBOARD_SETTINGS" }); }
    catch { return browser.tabs.update(existing.id, { url: settingsUrl, active: true }); }
  }
  return existing;
}
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function openHighlight(url, id) {
  if (typeof url !== "string" || !/^https?:\/\//i.test(url) || typeof id !== "string" || !id) return { found: false };
  const tabs = await browser.tabs.query({});
  let tab = tabs.find(candidate => candidate.url === url);
  if (tab) {
    await browser.windows.update(tab.windowId, { focused: true });
    tab = await browser.tabs.update(tab.id, { active: true });
  } else tab = await browser.tabs.create({ url, active: true });
  if (!tab?.id) return { found: false };
  for (let attempt = 0; attempt < 48; attempt++) {
    try {
      const result = await browser.tabs.sendMessage(tab.id, { type: "JUMP_TO_HIGHLIGHT", id });
      if (result?.found) return result;
    } catch { /* wait until the tab's content script is ready */ }
    await delay(250);
  }
  return { found: false };
}
LHN_MESSAGING.onMessage.addListener(async (message, sender) => {
  if (!message || !message.type) return;
  if (message.type === "LHN_ERROR_LOG") return globalThis.LHN_ERROR_LOGGER?.append(message.entry);
  if (message.type === "DETECT_READ_LANGUAGE") return LHN_TRANSLATE.detectReadLanguageRemote(message.text);
  if (message.type === "BILINGUAL_TRANSLATE") { const targetLang = String(message.targetLang || "").trim(); return LHN_TRANSLATE.translateBilingual(String(message.text || ""), /^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i.test(targetLang) ? targetLang : "en"); }
  if (message.type === "BILINGUAL_CLEAR_CACHE") return LHN_CACHE.clearBilingualTranslationCache();
  if (message.type === "YOUTUBE_TRANSCRIPT_CACHE_GET") return LHN_CACHE.getVideoTranscript(String(message.videoId || ""), String(message.variantKey || ""));
  if (message.type === "YOUTUBE_TRANSCRIPT_CACHE_SAVE") return LHN_CACHE.saveVideoTranscript(String(message.videoId || ""), String(message.variantKey || ""), message.transcript);
  if (message.type === "YOUTUBE_TRANSCRIPT_CACHE_TOUCH") return LHN_CACHE.touchVideoTranscript(String(message.videoId || ""), String(message.variantKey || ""));
  if (message.type === "WEB_STUDY_CUE_CACHE_GET") return LHN_CACHE.getWebStudyCues(String(message.cacheKey || ""));
  if (message.type === "WEB_STUDY_CUE_CACHE_SAVE") return LHN_CACHE.saveWebStudyCues(String(message.cacheKey || ""), message.sentences);
  if (message.type === "WEB_STUDY_CUE_CACHE_TOUCH") return LHN_CACHE.touchWebStudyCues(String(message.cacheKey || ""));
  if (message.type === "YOUTUBE_FETCH_TEXT") {
    const url = String(message.url || "");
    const allowed = /^https:\/\/(?:www\.)?youtube\.com\//.test(url) || /^https:\/\/translate\.googleapis\.com\//.test(url);
    if (!allowed) return { ok:false, error:"URL không được phép" };
    try {
      const response = await fetch(url, { credentials:url.includes("youtube.com") ? "include" : "omit" });
      if (!response.ok) return { ok:false, error:`HTTP ${response.status}` };
      return { ok:true, text:await response.text() };
    } catch (error) { return { ok:false, error:String(error?.message || error) }; }
  }
  // POST JSON tới API nội bộ của YouTube (get_transcript) — chỉ cho phép youtube.com.
  if (message.type === "YOUTUBE_API") {
    const url = String(message.url || "");
    if (!/^https:\/\/(?:www\.)?youtube\.com\//.test(url)) return { ok:false, error:"URL không được phép" };
    try {
      const response = await fetch(url, { method:"POST", credentials:"include", headers:{ "Content-Type":"application/json" }, body:JSON.stringify(message.body || {}) });
      if (!response.ok) return { ok:false, error:`HTTP ${response.status}` };
      return { ok:true, json:await response.json() };
    } catch (error) { return { ok:false, error:String(error?.message || error) }; }
  }
  if (message.type === "USAGE_STATUS") return USAGE_LIMITS.status();
  if (message.type === "USAGE_ACTIVATE_KEY") return USAGE_LIMITS.activate(message.key);
  if (message.type === "USAGE_CONSUME") return USAGE_LIMITS.consume(message.service);
  if (message.type === "FETCH_TTS_AUDIO") return fetchTtsAudio(message);
  if (message.type === "CHATGPT_PANEL_CONTEXT_READY" && typeof browser.sidebarAction?.isOpen === "function") {
    try {
      const windowId = sender?.tab?.windowId ?? chatGPTFocusedWindowId;
      if (await browser.sidebarAction.isOpen(Number.isInteger(windowId) ? { windowId } : {})) {
        const active = Number.isInteger(sender?.tab?.id) ? sender.tab : (await browser.tabs.query({ active:true, currentWindow:true }))?.[0];
        await trackChatGPTPanel(windowId, active?.id, true);
        return { ok:true, open:true };
      }
    } catch {}
    return { ok:true, open:false };
  }
  if (message.type === "CHATGPT_DRAFT_READY") return registerChatGPTDraft(sender?.tab?.id, message.truncated === true);
  if (message.type === "CHATGPT_AUTOFILL_RESULT") return notifyChatGPTDraftResult(message);
  if (message.type === "CHATGPT_LINK_RESULT") return completeChatGPTLinkRequest(message);
  if (message.type === "CHATGPT_PANEL_NAVIGATION_BLOCKED") return reportChatGPTNavigationBlocked(message);
  if (message.type === "OPEN_CHATGPT_LINK_PANEL") return openChatGPTLinkPanel({ sender, intent:message.intent, selectedText:message.selectedText });
  if (message.type === "OPEN_CHATGPT_SIDEPANEL") return openChatGPTSidePanel({ sender });
  if (message.type === "OPEN_DASHBOARD") return openDashboard();
  if (message.type === "OPEN_DASHBOARD_SETTINGS") return openDashboard(true);
  if (message.type === "OPEN_DASHBOARD_ACCOUNT") return openDashboard(true, true);
 if (message.type === "OPEN_DASHBOARD_BILINGUAL_SETTINGS") return openDashboard(true, false, "bilingualReader");
  if (message.type === "OPEN_HIGHLIGHT") return openHighlight(message.url, message.id);
  if (message.type === "GET_ALL") return ANNOTATIONS.getAll();
  if (message.type === "GET_BATCH") return ANNOTATIONS.getBatch(message);
  if (message.type === "GET_PAGE") return ANNOTATIONS.getPage(message.url);
  if (message.type === "GET_ONE") return ANNOTATIONS.getOne(message.id);
  if (message.type === "ADD") { const saved = await ANNOTATIONS.addOne(message.item || {}); ANNOTATIONS.notifyAnnotationsChanged({ type: "upsert", item: saved }, message.origin); return saved; }
  if (message.type === "UPDATE") { const saved = await ANNOTATIONS.updateOne(message.item); ANNOTATIONS.notifyAnnotationsChanged({ type: "upsert", item: saved }, message.origin); return saved; }
  if (message.type === "REVIEW_ANNOTATION") {
    if (typeof message.id !== "string" || !message.review || typeof message.review !== "object") return { updated: false };
    const item = await ANNOTATIONS.updateReview(message.id, message.review);
    if (item) ANNOTATIONS.notifyAnnotationsChanged({ type:"upsert", item }, message.origin);
    return { updated: Boolean(item), item };
  }
  if (message.type === "RESET_STUDY_PROGRESS") {
    const ids = new Set(Array.isArray(message.ids) ? message.ids.filter(id => typeof id === "string") : []);
    if (!ids.size) return { updated: true, resetCount: 0 };
    const resetCount = await ANNOTATIONS.resetReviews(ids);
    if (resetCount) ANNOTATIONS.notifyAnnotationsChanged({ type:"refresh" }, message.origin);
    return { updated: true, resetCount };
  }
  if (message.type === "DELETE") { const result = await ANNOTATIONS.deleteOne(message.id); ANNOTATIONS.notifyAnnotationsChanged({ type: "delete", id: message.id }, message.origin); return result; }
  if (message.type === "DELETE_PAGE") { const result = await ANNOTATIONS.deletePage(message.url); if (result.deletedCount) ANNOTATIONS.notifyAnnotationsChanged({ type: "deletePage", url: message.url }, message.origin); return result; }
  if (message.type === "IMPORT") return ANNOTATIONS.importItems(message.items, message.origin);
  if (message.type === "SYNC_PAGE_ORDER") return ANNOTATIONS.syncPageOrder(message.url, message.ids);
  if (message.type === "EXPORT") return ANNOTATIONS.getAll();
});

// Chrome only: request Google TTS từ extension bị 404 nếu thiếu Referer.
// Thêm Referer giống trang Google, chỉ áp dụng cho translate_tts. Firefox không dùng rule này.
(() => {
  const isChrome = typeof chrome !== "undefined" && chrome.declarativeNetRequest && !/Firefox\//.test(navigator.userAgent);
  if (!isChrome) return;
  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [9001],
    addRules: [{
      id: 9001,
      priority: 1,
      action: { type: "modifyHeaders", requestHeaders: [{ header: "Referer", operation: "set", value: "https://translate.google.com/" }] },
      condition: { urlFilter: "||translate.google.com/translate_tts", resourceTypes: ["xmlhttprequest", "media", "other"] }
    }]
  }).catch(err => console.warn("TTS referer rule failed", err));
})();

// Chrome gửi message qua JSON nên ArrayBuffer bị mất; trả audio dạng base64 để dùng được trên cả hai trình duyệt.
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}