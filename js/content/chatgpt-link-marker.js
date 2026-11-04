// Capture panel/request markers before the ChatGPT application can rewrite its URL fragment.
(() => {
  const PANEL_MARKER = "keepit-chatgpt-panel";
  const LINK_REQUEST_MARKER = "keepit-chatgpt-link-request";
  const LINK_SESSION_KEY = "keepitChatGPTLinkRequestId";
  const LINK_Q_SESSION_KEY = "keepitChatGPTLinkQRequestId";
  const LINK_Q_PROMPT_SESSION_KEY = "keepitChatGPTLinkQPrompt";

  function capture(value = location.href) {
    let url;
    try { url = new URL(value); } catch { return; }
    const params = new URLSearchParams(url.hash.replace(/^#/, ""));
    const panelMarker = url.searchParams.get(PANEL_MARKER) || params.get(PANEL_MARKER);
    const requestId = params.get(LINK_REQUEST_MARKER) || "";
    const hasLinkPrompt = url.searchParams.has("q");
    if (panelMarker !== "1" && !requestId && !hasLinkPrompt) return;
    try {
      sessionStorage.setItem(PANEL_MARKER, "1");
      if (requestId) sessionStorage.setItem(LINK_SESSION_KEY, requestId);
      if (requestId && hasLinkPrompt) {
        sessionStorage.setItem(LINK_Q_SESSION_KEY, requestId);
        sessionStorage.setItem(LINK_Q_PROMPT_SESSION_KEY, url.searchParams.get("q") || "");
      }
    } catch { /* the later content script still tries the live URL/referrer markers */ }
  }

  capture();
  // Follow-up prompts keep the same /c/<id> document and only change the hash marker.
  // document_start registers before the ChatGPT app can strip that one-shot request ID.
  window.addEventListener("hashchange", event => capture(event.newURL || location.href), true);
})();
