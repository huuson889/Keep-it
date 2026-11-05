"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const read = relative => fs.readFileSync(path.join(root, relative), "utf8");

function makeBrowserStorage(initial = {}) {
  const values = { ...initial };
  return {
    values,
    api: {
      tabs: { async query() { return [{ id:9, windowId:3, url:"https://news.example/new?x=2", active:true }]; } },
      storage: { local: {
        async get(keys) {
          const list = Array.isArray(keys) ? keys : [keys];
          return Object.fromEntries(list.map(key => [key, values[key]]));
        },
        async set(object) { Object.assign(values, object); },
        async remove(keys) { for (const key of Array.isArray(keys) ? keys : [keys]) delete values[key]; }
      } }
    }
  };
}

test("same-tab URL-only and page-complete updates both queue source context", () => {
  const source = "https://news.example/new?x=2";
  let handler;
  const calls = [];
  const ctx = vm.createContext({
    Number, Date,
    CHATGPT_PAGE_CONTEXT_DELAY_MS:2000,
    chatGPTSourceTabs:new Map([[3,9]]),
    browser:{ tabs:{ onUpdated:{ addListener(callback) { handler = callback; } } } },
    nextChatGPTPageContextRevision() { return 7; },
    queueChatGPTPageContext(...args) { calls.push(args); }
  });
  const background = read("js/background/background.js");
  const start = background.indexOf("browser.tabs.onUpdated?.addListener");
  const end = background.indexOf("browser.tabs.onActivated", start);
  assert.ok(start >= 0 && end > start, "onUpdated listener exists");
  vm.runInContext(background.slice(start, end), ctx);
  assert.equal(typeof handler, "function");

  handler(9, { url:source }, { id:9, windowId:3, url:"https://news.example/old" });
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0].url, source, "changeInfo.url wins over stale tab.url");
  assert.equal(calls[0][2], 7);

  handler(9, { status:"complete" }, { id:9, windowId:3, url:source });
  assert.equal(calls.length, 2, "page-load completion continues to be handled");
});

test("passive context switch resolves the selected Gemini source mapping", async () => {
  const background = read("js/background/background.js");
  const start = background.indexOf("async function queueChatGPTPageContext(");
  const end = background.indexOf("browser.tabs.onUpdated?.addListener", start);
  assert.ok(start >= 0 && end > start, "source-context queue exists");

  const source = "https://news.example/new?x=2";
  const mapKey = "keepitGeminiConversationBySourceUrl";
  const store = makeBrowserStorage({ [mapKey]:{ [source]:"https://gemini.google.com/app/thread-88?src=old#fragment" } });
  const ctx = vm.createContext({
    URL, Date, Math, Object, Number, String, Promise, console, setTimeout, clearTimeout,
    browser:store.api,
    CHATGPT_PAGE_CONTEXT_DELAY_MS:2000,
    CHATGPT_PANEL_NAVIGATION_KEY:"keepitChatGPTPanelNavigationRequest",
    CHATGPT_LINK_PENDING_KEY:"keepitChatGPTLinkPending",
    CHATGPT_SOURCE_CONVERSATIONS_KEY:"keepitChatGPTConversationBySourceUrl",
    chatGPTPageContextRevisions:new Map([[3,5]]),
    chatGPTPageContextTimers:new Map(),
    chatGPTPanelSourceUrls:new Map([[3,"https://news.example/old"]]),
    chatGPTSourceTabs:new Map([[3,9]]),
    chatGPTPanelStateRestorePromise:Promise.resolve(),
    normalizeChatGPTSourceUrl(value) {
      try { const url = new URL(value); return ["http:","https:"].includes(url.protocol) ? url.href : ""; }
      catch { return ""; }
    },
    async chatGPTPanelIsActuallyOpen() { return true; },
    async clearSupersededChatGPTRequests() {},
    async getAIProviderForWindow() { return ctx.LHN_AI_PROVIDERS.get("gemini"); },
    async rememberChatGPTPanelSourceUrl(windowId, url) { ctx.chatGPTPanelSourceUrls.set(windowId, url); }
  });
  vm.runInContext(read("js/shared/ai-providers.js"), ctx);
  vm.runInContext(background.slice(start, end), ctx);

  assert.equal(await ctx.queueChatGPTPageContext({ id:9, windowId:3, url:source }, 0, 5, Date.now()), true);
  await new Promise(resolve => setTimeout(resolve, 60));
  const request = store.values.keepitChatGPTPanelNavigationRequest;
  assert.equal(request.providerId, "gemini");
  assert.equal(request.mode, "context-switch");
  assert.equal(request.sourceUrl, source);
  assert.equal(request.targetUrl, "https://gemini.google.com/app/thread-88");
});

test("Chromium and Firefox route mapped or new context-switch destinations", () => {
  const chromiumPanel = read("js/shared/ai-panel.js");
  const firefoxContent = read("js/content/ai-fill.js");
  for (const source of [chromiumPanel, firefoxContent]) {
    // v3.5.109: both paths use the shared ChatGPT/Gemini/Claude route rule.
    assert.match(source, /providers\.planPanelNavigation\(/);
    assert.match(source, /providers\.panelRoute\(/);
  }
});

function makeWorkflow({ mapped = false, mutateDuringSettle = false } = {}) {
  const sourceUrl = "https://example.com/article?a=1#section";
  const originalPrompt = "Summarize this page";
  const expectedText = `• Trang web: ${sourceUrl}\n• ${originalPrompt}`;
  const listeners = {};
  const reports = [];
  const intervalCallbacks = new Map();
  let nextInterval = 1;
  let clicks = 0;
  const editor = {
    text:originalPrompt,
    closest() { return { querySelector() { return null; } }; },
    contains() { return true; }
  };
  const button = {
    disabled:false,
    getAttribute() { return null; },
    click() { clicks++; }
  };
  const document = {
    addEventListener(type, callback) { listeners[type] = callback; },
    querySelector() { return button; }
  };
  const window = {};
  window.parent = window;
  window.top = window;
  const messaging = {
    async sendMessage(message) {
      if (message.type === "AI_PROVIDER_MANUAL_LINK_PREPARE") {
        return mapped
          ? { ok:true, mapped:true, websiteLabel:"Trang web" }
          : { ok:true, mapped:false, requestId:"manual-1", mode:"manual-link", websiteLabel:"Trang web" };
      }
      if (message.type === "AI_PROVIDER_LINK_RESULT") reports.push(message);
      return { ok:true };
    }
  };
  const editorApi = {
    findEditor() { return editor; },
    editorText(target) { return target?.text || ""; },
    setEditorText(target, value) {
      target.text = value;
      if (mutateDuringSettle) setTimeout(() => { target.text = "changed before send"; }, 12);
      return true;
    }
  };
  const providers = {
    fromHost(hostname) { return hostname.startsWith("gemini.") ? { id:"gemini" } : null; },
    normalizeConversationUrl() { return "https://gemini.google.com/app/thread-1"; }
  };
  const context = vm.createContext({
    URL, URLSearchParams, Date, Promise, String, Math,
    location:{ hostname:"gemini.google.com", href:"https://gemini.google.com/app/thread-1", hash:"" },
    navigator:{ userAgent:"Chrome" }, document, window,
    LHN_AI_PROVIDERS:providers,
    LHN_AI_FILL:editorApi,
    LHN_MESSAGING:messaging,
    setTimeout, clearTimeout,
    setInterval(callback) { const id = nextInterval++; intervalCallbacks.set(id, callback); return id; },
    clearInterval(id) { intervalCallbacks.delete(id); },
    console:{ warn() {} }
  });
  vm.runInContext(read("js/content/ai-provider-workflow.js"), context);
  context.LHN_AI_PROVIDER_WORKFLOW.setPanelContext({ providerId:"gemini", sourceUrl, active:true });

  const event = {
    type:"click",
    target:{ closest(selector) { return selector === "button" ? button : null; } },
    preventDefault() {}, stopPropagation() {}, stopImmediatePropagation() {}
  };
  listeners.click(event);
  return {
    sourceUrl, expectedText, editor, reports, intervalCallbacks,
    workflow:context.LHN_AI_PROVIDER_WORKFLOW,
    get clicks() { return clicks; },
    settle:() => new Promise(resolve => setTimeout(resolve, 1000))
  };
}

test("manual send on a mapped Gemini source sends the prompt without the URL (ChatGPT rule, v3.5.109)", async () => {
  const workflow = makeWorkflow({ mapped:true });
  await new Promise(resolve => setTimeout(resolve, 200));
  assert.equal(workflow.editor.text, "Summarize this page");
  assert.equal(workflow.clicks, 1);
  assert.equal(workflow.reports.length, 0, "mapped sends do not create a new source mapping");
});

test("manual send waits for stable editor text; instability sends nothing and reports failure only", async () => {
  const workflow = makeWorkflow({ mutateDuringSettle:true });
  await workflow.settle();
  assert.equal(workflow.clicks, 0, "changed prompt must not be clicked/sent");
  assert.equal(workflow.reports.length, 1);
  assert.equal(workflow.reports[0].ok, false);
  assert.equal(workflow.reports[0].conversationUrl, "");
});

test("manual send completion watcher is not reported before provider confirmation", async () => {
  const workflow = makeWorkflow();
  await new Promise(resolve => setTimeout(resolve, 200));
  assert.equal(workflow.editor.text, workflow.expectedText);
  assert.equal(workflow.clicks, 1);
  assert.equal(workflow.intervalCallbacks.size, 1, "mapping confirmation remains asynchronous");
  assert.equal(workflow.reports.length, 0, "no mapping result is reported merely for clicking Send");
});

test("hand-written text and non-opt-in modes cannot be auto-submitted", async () => {
  const workflow = makeWorkflow({ mapped:true });
  workflow.editor.text = "I typed this myself";
  workflow.workflow.setPendingLink({
    providerId:"gemini", sourceUrl:workflow.sourceUrl, linkRequestId:"keepit-1",
    linkMode:"auto-send-link", websiteLabel:"Trang web", text:"Keepit summary draft"
  });
  const result = await workflow.workflow.submitFromKeepit({
    providerId:"gemini", sourceUrl:workflow.sourceUrl, linkRequestId:"keepit-1", linkMode:"auto-send-link"
  });
  assert.equal(result.ok, false);
  assert.equal(result.error, "prompt-changed-before-auto-send");
  assert.equal(workflow.clicks, 0);

  const denied = await workflow.workflow.submitFromKeepit({
    providerId:"gemini", sourceUrl:workflow.sourceUrl, linkRequestId:"keepit-1", linkMode:"manual-link"
  });
  assert.equal(denied.ok, false);
  assert.equal(denied.error, "auto-send-not-authorized");
  assert.equal(workflow.clicks, 0);
});
