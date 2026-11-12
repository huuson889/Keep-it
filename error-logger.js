(function initLhnErrorLogger() {
  if (globalThis.LHN_ERROR_LOGGER) return;

  const STORAGE_KEY = "lhnDiagnosticErrorLogV1";
  const MAX_ENTRIES = 200;
  let writeQueue = Promise.resolve();

  function componentName() {
    if (typeof document === "undefined") return "background";
    try {
      const path = new URL(location.href).pathname;
      if (path.endsWith("/dashboard.html")) return "dashboard";
      if (path.endsWith("/popup.html")) return "popup";
    } catch {}
    return "content";
  }

  function errorCode(values, severity) {
    const hint = values.map(value => {
      if (typeof value === "string") return value;
      if (value && typeof value === "object") return `${value.name || ""} ${value.message || ""}`;
      return "";
    }).join(" ").toLowerCase();
    if (/mymemory/.test(hint)) return "translation.mymemory";
    if (/google.?translate|translate\.googleapis/.test(hint)) return "translation.google";
    if (/translate|translation|dictionary/.test(hint)) return "translation";
    if (/tts|speech|speak|voice/.test(hint)) return "speech";
    if (/storage|cache|persist|save|read|write/.test(hint)) return "storage";
    if (/highlight|annotation|note/.test(hint)) return "notes";
    return severity === "error" ? "app.error" : "app.warning";
  }

  function safeEntry(entry) {
    const allowedComponents = new Set(["background", "content", "dashboard", "popup"]);
    const allowedSeverities = new Set(["error", "warning"]);
    const allowedCodes = new Set(["translation.mymemory", "translation.google", "translation", "speech", "storage", "notes", "app.error", "app.warning"]);
    if (!entry || !allowedComponents.has(entry.component) || !allowedSeverities.has(entry.severity) || !allowedCodes.has(entry.code)) return null;
    const timestamp = typeof entry.timestamp === "string" && Number.isFinite(Date.parse(entry.timestamp)) ? new Date(entry.timestamp).toISOString() : new Date().toISOString();
    return { timestamp, component: entry.component, severity: entry.severity, code: entry.code };
  }

  function append(entry) {
    const clean = safeEntry(entry);
    if (!clean || !globalThis.browser?.storage?.local) return Promise.resolve();
    writeQueue = writeQueue.then(async () => {
      try {
        const stored = await browser.storage.local.get(STORAGE_KEY);
        const entries = Array.isArray(stored[STORAGE_KEY]) ? stored[STORAGE_KEY].filter(item => safeEntry(item)) : [];
        entries.push(clean);
        await browser.storage.local.set({ [STORAGE_KEY]: entries.slice(-MAX_ENTRIES) });
      } catch {}
    }).catch(() => {});
    return writeQueue;
  }

  function record(values, severity) {
    const entry = { component: componentName(), severity, code: errorCode(values, severity) };
    if (entry.component === "background") {
      void append(entry);
      return;
    }
    try { void browser.runtime.sendMessage({ type: "LHN_ERROR_LOG", entry }).catch(() => {}); } catch {}
  }

  globalThis.LHN_ERROR_LOGGER = { append };

  for (const severity of ["error", "warning"]) {
    const method = severity === "error" ? "error" : "warn";
    const original = console[method].bind(console);
    console[method] = (...values) => {
      try { record(values, severity); } catch {}
      return original(...values);
    };
  }

  if (componentName() !== "content") {
    globalThis.addEventListener?.("error", event => { if (event?.error || event?.message) record([event.error || event.message], "error"); });
    globalThis.addEventListener?.("unhandledrejection", event => { if (event?.reason) record([event.reason], "error"); });
  }
})();
