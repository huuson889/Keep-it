(() => {
  "use strict";

  if (window.top === window || !globalThis.browser?.runtime?.sendMessage) return;
  const providers = globalThis.LHN_AI_PROVIDERS;
  if (!providers) return;

  let extensionOrigin = "";
  try {
    const extensionUrl = new URL(browser.runtime.getURL("/"));
    if (extensionUrl.protocol !== "chrome-extension:") return;
    extensionOrigin = `${extensionUrl.protocol}//${extensionUrl.host}`;
  } catch { return; }

  const ancestorOrigins = Array.from(location.ancestorOrigins || []);
  const hasGrokAncestor = ancestorOrigins.some(origin => providers.fromUrl(origin)?.id === "grok");
  if (!ancestorOrigins.includes(extensionOrigin) || !hasGrokAncestor) return;

  const request = browser.runtime.sendMessage({
    type:"AI_PANEL_GROK_AUTH_FRAME_DETECTED",
    extensionOrigin,
    ancestorOrigins
  });
  if (request?.then) void request.then(result => {
    const quietErrors = new Set(["grok-sign-in-tab-cooldown", "panel-window-unavailable", "not-an-embedded-frame", "auth-frame-not-in-grok-panel"]);
    if (!result?.ok && !quietErrors.has(result?.error)) {
      console.warn("Keepit could not open Grok sign-in in a tab", result?.error || "unknown-error");
    }
  }).catch(() => {});

})();
