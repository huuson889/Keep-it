"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const read = relative => fs.readFileSync(path.join(root, relative), "utf8");
const tick = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms));

function loadProviders() {
  const ctx = vm.createContext({ URL, String, Object, Map, Array });
  vm.runInContext(read("js/shared/ai-providers.js"), ctx);
  return ctx.LHN_AI_PROVIDERS;
}

function makeEventTarget() {
  const listeners = {};
  return {
    listeners,
    addEventListener(type, callback, options) {
      (listeners[type] ||= []).push({ callback, once:!!options?.once });
    },
    removeEventListener(type, callback) {
      listeners[type] = (listeners[type] || []).filter(entry => entry.callback !== callback);
    },
    dispatch(type, event = {}) {
      for (const entry of [...(listeners[type] || [])]) {
        if (entry.once) this.removeEventListener(type, entry.callback);
        entry.callback(event);
      }
    }
  };
}

// Chromium panel page with a provider iframe whose real (cross-origin) URL differs from frame.src.
function makeChromiumPanel({ providerId = "gemini", startSrc = "https://gemini.google.com/app", origin = "https://gemini.google.com" } = {}) {
  const win = makeEventTarget();
  const frameEvents = makeEventTarget();
  const srcHistory = [];
  const commands = [];
  let src = startSrc;
  const contentWindow = {
    postMessage(message) {
      commands.push(message.type);
      setTimeout(() => win.dispatch("message", {
        source:contentWindow, origin,
        data:{ type:"KEEPIT_AI_RESULT", requestId:message.requestId, providerId:message.providerId, ok:true }
      }), 0);
    }
  };
  const frame = {
    dataset:{ keepitProvider:providerId, keepitLoaded:"true" },
    contentWindow,
    get src() { return src; },
    set src(value) { src = value; srcHistory.push(value); setTimeout(() => frameEvents.dispatch("load", {}), 1); },
    addEventListener:(...args) => frameEvents.addEventListener(...args),
    removeEventListener:(...args) => frameEvents.removeEventListener(...args)
  };
  const browser = {
    storage:{ session:{ async get() { return { keepitAiPanelProviderByWindow:{ 1:providerId } }; } },
      local:{ async get() { return {}; }, async remove() {} } },
    runtime:{ async sendMessage() { return { ok:true }; } },
    windows:{ async getCurrent() { return { id:1 }; } },
    tabs:{ create() { return Promise.resolve(); } }
  };
  const ctx = vm.createContext({
    URL, URLSearchParams, Date, Promise, String, Map, Set, Object, Array, Number, Math, console,
    setTimeout, clearTimeout, setInterval, clearInterval, browser,
    window:win,
    document:{ getElementById:id => (id === "ai-frame" ? frame : null) }
  });
  vm.runInContext(read("js/shared/ai-providers.js"), ctx);
  vm.runInContext(read("js/shared/ai-panel.js"), ctx);
  return {
    ctx, frame, srcHistory, commands, panel:ctx.LHN_AI_PANEL,
    report(routeUrl, fromOrigin = origin) {
      win.dispatch("message", { source:contentWindow, origin:fromOrigin, data:{ type:"KEEPIT_AI_PANEL_CONVERSATION", providerId, routeUrl } });
    }
  };
}

test("shared route + navigation rule is identical for ChatGPT, Gemini and Claude", () => {
  const providers = loadProviders();
  assert.equal(providers.panelRoute("chatgpt", "https://chatgpt.com/?q=x#keepit"), "https://chatgpt.com/");
  assert.equal(providers.panelRoute("chatgpt", "https://chatgpt.com/c/abc?x=1"), "https://chatgpt.com/c/abc");
  assert.equal(providers.panelRoute("gemini", "https://gemini.google.com/app?hl=vi"), "https://gemini.google.com/app");
  assert.equal(providers.panelRoute("gemini", "https://gemini.google.com/app/abc123"), "https://gemini.google.com/app/abc123");
  assert.equal(providers.panelRoute("claude", "https://claude.ai/new"), "https://claude.ai/new");
  assert.equal(providers.panelRoute("claude", "https://claude.ai/chat/xyz"), "https://claude.ai/chat/xyz");
  assert.equal(providers.panelRoute("gemini", "https://claude.ai/chat/xyz"), "", "host must match provider");
  assert.equal(providers.panelRoute("grok", "https://grok.com/"), "", "hidden Grok is excluded");

  const plan = providers.planPanelNavigation;
  assert.equal(plan({ displayedRoute:"a", targetRoute:"a", sourceChanged:false, loaded:true }), "stay");
  assert.equal(plan({ displayedRoute:"a", targetRoute:"a", sourceChanged:true, loaded:true }), "reload");
  assert.equal(plan({ displayedRoute:"a", targetRoute:"b", sourceChanged:true, loaded:true }), "load");
  assert.equal(plan({ displayedRoute:"a", targetRoute:"a", sourceChanged:false, loaded:false }), "load");
});

test("Gemini: after a send moves the SPA to /app/<id>, a new unmapped source reloads blank chat (user bug)", async () => {
  const p = makeChromiumPanel();
  await tick(5);
  p.panel.setSourceUrl("https://news.example/a");
  p.report("https://gemini.google.com/app/thread-a");   // live route reported from the iframe
  assert.equal(p.frame.dataset.currentConversationUrl, "https://gemini.google.com/app/thread-a");
  assert.equal(p.frame.src, "https://gemini.google.com/app", "frame.src still shows the stale start URL");

  const handled = await p.panel.navigateRequest({
    requestId:"ctx-1", providerId:"gemini", mode:"context-switch",
    sourceUrl:"https://news.example/b", targetUrl:"https://gemini.google.com/app", expiresAt:Date.now() + 60000
  });
  assert.equal(handled, true);
  assert.deepEqual([...p.srcHistory], ["about:blank", "https://gemini.google.com/app"], "forced real navigation to blank chat");
  assert.ok(p.commands.includes("KEEPIT_AI_CLEAR"), "stale composer is cleared for the new source");
});

test("Gemini: new source with a mapping opens that conversation; same source and route stays", async () => {
  const p = makeChromiumPanel();
  await tick(5);
  p.panel.setSourceUrl("https://news.example/a");
  p.report("https://gemini.google.com/app/thread-a");
  await p.panel.navigateRequest({
    requestId:"ctx-2", providerId:"gemini", mode:"context-switch",
    sourceUrl:"https://news.example/b", targetUrl:"https://gemini.google.com/app/thread-b", expiresAt:Date.now() + 60000
  });
  assert.equal(p.srcHistory.at(-1), "https://gemini.google.com/app/thread-b");

  p.report("https://gemini.google.com/app/thread-b");
  const before = p.srcHistory.length;
  await p.panel.navigateRequest({
    requestId:"ctx-3", providerId:"gemini", mode:"reopen",
    sourceUrl:"https://news.example/b", targetUrl:"https://gemini.google.com/app/thread-b", expiresAt:Date.now() + 60000
  });
  assert.equal(p.srcHistory.length, before, "same source + same live route does not navigate");
});

test("Claude uses the same shared mechanism", async () => {
  const p = makeChromiumPanel({ providerId:"claude", startSrc:"https://claude.ai/new", origin:"https://claude.ai" });
  await tick(5);
  p.panel.setSourceUrl("https://news.example/a");
  p.report("https://claude.ai/chat/conv-a");
  await p.panel.navigateRequest({
    requestId:"ctx-c", providerId:"claude", mode:"context-switch",
    sourceUrl:"https://news.example/b", targetUrl:"https://claude.ai/new", expiresAt:Date.now() + 60000
  });
  assert.deepEqual([...p.srcHistory], ["about:blank", "https://claude.ai/new"]);
});

test("route reports from a wrong origin or provider are ignored", async () => {
  const p = makeChromiumPanel();
  await tick(5);
  p.report("https://gemini.google.com/app/evil", "https://evil.example");
  assert.equal(p.frame.dataset.currentConversationUrl, undefined);
  p.report("https://claude.ai/chat/x");
  assert.equal(p.frame.dataset.currentConversationUrl, undefined, "route must belong to the frame provider");
});

test("provider iframe reports its live conversation route to the extension parent (shared ai-fill)", () => {
  const posts = [];
  let intervalCallback = null;
  const parent = { postMessage(message, targetOrigin) { posts.push({ message, targetOrigin }); } };
  const win = { parent, top:parent, addEventListener() {} };
  const location = { hostname:"gemini.google.com", href:"https://gemini.google.com/app", hash:"" };
  const ctx = vm.createContext({
    URL, URLSearchParams, String, Object, Map, Array, Date, Promise, console,
    setTimeout, clearTimeout,
    setInterval(callback) { intervalCallback = callback; return 1; },
    window:win, location, navigator:{ userAgent:"Chrome" },
    document:{ querySelector() { return null; }, addEventListener() {}, documentElement:{} },
    browser:{ runtime:{ getURL:() => "chrome-extension://keepit-id/" } }
  });
  vm.runInContext(read("js/shared/ai-providers.js"), ctx);
  vm.runInContext(read("js/content/ai-fill.js"), ctx);
  assert.equal(posts.length, 1);
  assert.equal(posts[0].targetOrigin, "chrome-extension://keepit-id", "posted only to the extension origin");
  assert.equal(posts[0].message.routeUrl, "https://gemini.google.com/app");

  location.href = "https://gemini.google.com/app/thread-9";   // SPA navigation after a send
  intervalCallback();
  assert.equal(posts.length, 2);
  assert.equal(posts[1].message.type, "KEEPIT_AI_PANEL_CONVERSATION");
  assert.equal(posts[1].message.conversationUrl, "https://gemini.google.com/app/thread-9");
  intervalCallback();
  assert.equal(posts.length, 2, "unchanged route is not re-posted");
});

test("ChatGPT controller and Firefox path call the shared rule and shared reload", () => {
  const chatgptPanel = read("js/shared/chatgpt-panel.js");
  assert.match(chatgptPanel, /LHN_AI_PROVIDERS\.planPanelNavigation\(/);
  assert.match(chatgptPanel, /aiPanel\?\.reloadFrame\?\.\(/);
  assert.doesNotMatch(chatgptPanel, /frame\.src = "about:blank"/, "no private ChatGPT reload copy remains");
  const aiFill = read("js/content/ai-fill.js");
  assert.match(aiFill, /providers\.planPanelNavigation\(/);
  assert.doesNotMatch(aiFill, /needsNewConversation|needsMappedRoute/);
});

function runManualSend({ mapped }) {
  const sourceUrl = "https://example.com/article?a=1";
  const listeners = {};
  let clicks = 0;
  const editor = { text:"Tóm tắt giúp tôi", closest() { return null; }, contains() { return true; } };
  const button = { disabled:false, getAttribute() { return null; }, click() { clicks++; } };
  const ctx = vm.createContext({
    URL, URLSearchParams, Date, Promise, String, Math,
    location:{ hostname:"gemini.google.com", href:"https://gemini.google.com/app/t", hash:"" },
    navigator:{ userAgent:"Chrome" },
    document:{ addEventListener(type, cb) { listeners[type] = cb; }, querySelector() { return button; } },
    window:{},
    LHN_AI_PROVIDERS:{ fromHost:() => ({ id:"gemini" }), normalizeConversationUrl:() => "https://gemini.google.com/app/t" },
    LHN_AI_FILL:{ findEditor:() => editor, editorText:target => target.text, setEditorText(target, value) { target.text = value; return true; } },
    LHN_MESSAGING:{ async sendMessage(message) {
      if (message.type === "AI_PROVIDER_MANUAL_LINK_PREPARE") {
        return mapped ? { ok:true, mapped:true, websiteLabel:"Trang web" } : { ok:true, mapped:false, requestId:"r1", websiteLabel:"Trang web" };
      }
      return { ok:true };
    } },
    setTimeout, clearTimeout, setInterval:() => 1, clearInterval() {}, console:{ warn() {} }
  });
  ctx.window.parent = ctx.window;
  vm.runInContext(read("js/content/ai-provider-workflow.js"), ctx);
  ctx.LHN_AI_PROVIDER_WORKFLOW.setPanelContext({ providerId:"gemini", sourceUrl, active:true });
  listeners.click({ type:"click", target:{ closest:() => button }, preventDefault() {}, stopPropagation() {}, stopImmediatePropagation() {} });
  return { editor, sourceUrl, get clicks() { return clicks; } };
}

test("manual send follows the ChatGPT rule: unmapped adds label + URL, mapped sends text as-is", async () => {
  const unmapped = runManualSend({ mapped:false });
  const mapped = runManualSend({ mapped:true });
  await tick(250);
  assert.equal(unmapped.editor.text, `• Trang web: ${unmapped.sourceUrl}\n• Tóm tắt giúp tôi`);
  assert.equal(unmapped.clicks, 1);
  assert.equal(mapped.editor.text, "Tóm tắt giúp tôi");
  assert.equal(mapped.clicks, 1);
});
