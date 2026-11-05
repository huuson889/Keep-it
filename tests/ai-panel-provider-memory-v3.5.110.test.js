"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const read = relative => fs.readFileSync(path.join(root, relative), "utf8");

function makeStorage(initial = {}) {
  const data = { ...initial };
  return {
    data,
    async get(key) { return Array.isArray(key) ? Object.fromEntries(key.map(k => [k, data[k]])) : { [key]:data[key] }; },
    async set(values) { Object.assign(data, JSON.parse(JSON.stringify(values))); },
    async remove() {}
  };
}

// Background provider memory functions, extracted from background.js and run with mocked storage.
function loadBackgroundMemory(browser) {
  const source = read("js/background/background.js");
  const start = source.indexOf("const AI_PANEL_PROVIDER_BY_WINDOW_KEY");
  const end = source.indexOf("const GROK_SIGN_IN_TAB_STORAGE_PREFIX");
  const ctx = vm.createContext({ URL, String, Object, Number, Array, browser });
  vm.runInContext(read("js/shared/ai-providers.js"), ctx);
  vm.runInContext(`${source.slice(start, end)}\nglobalThis.memory = { getAIProviderForWindow, rememberAIProviderForWindow };`, ctx);
  return ctx.memory;
}

function loadPanelGetSaved(browser) {
  const ctx = vm.createContext({
    URL, URLSearchParams, String, Object, Number, Array, Map, Set, Promise, Date, Math, console,
    setTimeout, clearTimeout, browser, window:{ addEventListener() {} },
    document:{ getElementById:() => null }
  });
  vm.runInContext(read("js/shared/ai-providers.js"), ctx);
  vm.runInContext(read("js/shared/ai-panel.js"), ctx);
  return ctx.LHN_AI_PANEL.getSavedProvider;
}

test("read order: this window's choice, then the last choice, then ChatGPT", () => {
  const ctx = vm.createContext({ URL, String, Object, Number, Array });
  vm.runInContext(read("js/shared/ai-providers.js"), ctx);
  const pick = ctx.LHN_AI_PROVIDERS.pickSelectedProvider;
  assert.equal(pick({ 7:"claude" }, 7, "gemini"), "claude", "window choice wins");
  assert.equal(pick({}, 9, "gemini"), "gemini", "refresh/restart: session empty, last choice kept");
  assert.equal(pick({}, 9, ""), "chatgpt", "ChatGPT only when nothing was ever chosen");
  assert.equal(pick({ 9:"grok" }, 9, "grok"), "chatgpt", "hidden Grok is never restored");
  assert.equal(pick({ 9:"bogus" }, 9, "claude"), "claude");
});

test("choosing Gemini survives a refresh that clears storage.session (background + panel agree)", async () => {
  const session = makeStorage();
  const local = makeStorage();
  const browser = { storage:{ session, local }, windows:{ async getCurrent() { return { id:1 }; } } };
  const memory = loadBackgroundMemory(browser);
  assert.equal(await memory.rememberAIProviderForWindow(1, "gemini"), true);
  assert.equal(local.data.keepitAiPanelLastProvider, "gemini");

  // Refresh / extension reload / browser restart: session cleared and window ids change.
  delete session.data.keepitAiPanelProviderByWindow;
  assert.equal((await memory.getAIProviderForWindow(42)).id, "gemini", "background send guard uses Gemini");
  assert.equal(await loadPanelGetSaved(browser)(42), "gemini", "panel opens Gemini");
});

test("two windows keep different providers; a new window gets the last choice", async () => {
  const session = makeStorage();
  const local = makeStorage();
  const browser = { storage:{ session, local } };
  const memory = loadBackgroundMemory(browser);
  await memory.rememberAIProviderForWindow(1, "gemini");
  await memory.rememberAIProviderForWindow(2, "claude");
  assert.equal((await memory.getAIProviderForWindow(1)).id, "gemini");
  assert.equal((await memory.getAIProviderForWindow(2)).id, "claude");
  assert.equal((await memory.getAIProviderForWindow(3)).id, "claude", "last choice for a new window");
  assert.equal(await loadPanelGetSaved(browser)(1), "gemini");
});

test("hidden Grok cannot be saved as the remembered provider", async () => {
  const local = makeStorage();
  const memory = loadBackgroundMemory({ storage:{ session:makeStorage(), local } });
  assert.equal(await memory.rememberAIProviderForWindow(1, "grok"), false);
  assert.equal(local.data.keepitAiPanelLastProvider, undefined);
});
