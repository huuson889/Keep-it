(() => {
  "use strict";

  if (window.top === window || !globalThis.browser?.runtime?.sendMessage) return;

  let extensionOrigin = "";
  try {
    const extensionUrl = new URL(browser.runtime.getURL("/"));
    extensionOrigin = `${extensionUrl.protocol}//${extensionUrl.host}`;
  } catch { return; }

  const ancestors = Array.from(location.ancestorOrigins || []);
  if (!extensionOrigin || !ancestors.includes(extensionOrigin)) return;

  const authUrl = String(location.href || "");
  if (!/^https:\/\/accounts\.google\.com\//i.test(authUrl)) return;

  const request = browser.runtime.sendMessage({
    type:"AI_PANEL_GOOGLE_AUTH_REQUEST",
    authUrl,
    referrer:String(document.referrer || ""),
    extensionOrigin
  });
  if (request?.catch) void request.catch(() => {});
})();
