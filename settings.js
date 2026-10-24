(() => {
  const config = globalThis.LHN_CONFIG;
  const storage = globalThis.browser?.storage?.local;
  const key = config?.STORAGE_KEYS?.SETTINGS;

  function resolve(saved, overrides = {}) {
    const values = saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
    return { ...config.DEFAULT_SETTINGS, ...overrides, ...values };
  }

  async function get() {
    if (!storage || !key) return resolve();
    const data = await storage.get(key);
    return resolve(data[key]);
  }

  async function save(value) {
    if (!storage || !key) throw new Error("Extension settings storage is unavailable");
    const next = resolve(value);
    await storage.set({ [key]: next });
    return next;
  }

  function subscribe(listener) {
    if (typeof listener !== "function" || !globalThis.browser?.storage?.onChanged) return () => {};
    const handler = (changes, area) => {
      if (area !== "local" || !changes[key]) return;
      listener(resolve(changes[key].newValue), resolve(changes[key].oldValue));
    };
    browser.storage.onChanged.addListener(handler);
    return () => browser.storage.onChanged.removeListener(handler);
  }

  globalThis.LHN_SETTINGS = Object.freeze({ resolve, get, save, subscribe });
})();