// Capture panel/request markers before the ChatGPT application can rewrite its URL fragment.
(() => {
  const PANEL_MARKER = "keepit-chatgpt-panel";
  const LINK_REQUEST_MARKER = "keepit-chatgpt-link-request";
  const SOURCE_URL_MARKER = "keepit-chatgpt-source-url";
  const SOURCE_URL_SESSION_KEY = "keepitChatGPTPanelSourceUrl";
  const LINK_SESSION_KEY = "keepitChatGPTLinkRequestId";
  const LINK_Q_SESSION_KEY = "keepitChatGPTLinkQRequestId";

  function capture(value = location.href) {
    let url;
    try { url = new URL(value); } catch { return; }
    const params = new URLSearchParams(url.hash.replace(/^#/, ""));
    const panelMarker = url.searchParams.get(PANEL_MARKER) || params.get(PANEL_MARKER);
    const requestId = params.get(LINK_REQUEST_MARKER) || "";
    const sourceUrl = params.get(SOURCE_URL_MARKER) || "";
    const hasLinkPrompt = url.searchParams.has("q");
    if (panelMarker !== "1" && !requestId && !hasLinkPrompt && !sourceUrl) return;
    try {
      sessionStorage.setItem(PANEL_MARKER, "1");
      if (requestId) sessionStorage.setItem(LINK_SESSION_KEY, requestId);
      if (sourceUrl) sessionStorage.setItem(SOURCE_URL_SESSION_KEY, sourceUrl);
      if (requestId && hasLinkPrompt) {
        sessionStorage.setItem(LINK_Q_SESSION_KEY, requestId);
      }
    } catch { /* the later content script still tries the live URL/referrer markers */ }
  }

  capture();
  // Same-route follow-ups update only the one-shot request ID in the fragment.
  window.addEventListener("hashchange", event => capture(event.newURL || location.href), true);
})();
