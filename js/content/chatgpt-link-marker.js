// Capture panel/request markers before the ChatGPT application can rewrite its URL fragment.
(() => {
  const PANEL_MARKER = "keepit-chatgpt-panel";
  const LINK_REQUEST_MARKER = "keepit-chatgpt-link-request";
  const SOURCE_URL_MARKER = "keepit-chatgpt-source-url";
  const SOURCE_URL_SESSION_KEY = "keepitChatGPTPanelSourceUrl";
  const RESTORE_DRAFT_MARKER = "keepit-chatgpt-restore-draft";
  const RESTORE_DRAFT_SESSION_KEY = "keepitChatGPTRestoreSourceDraft";
  const LINK_SESSION_KEY = "keepitChatGPTLinkRequestId";
  const LINK_Q_SESSION_KEY = "keepitChatGPTLinkQRequestId";
  const LINK_Q_PROMPT_SESSION_KEY = "keepitChatGPTLinkQPrompt";

  function capture(value = location.href) {
    let url;
    try { url = new URL(value); } catch { return; }
    const params = new URLSearchParams(url.hash.replace(/^#/, ""));
    const panelMarker = url.searchParams.get(PANEL_MARKER) || params.get(PANEL_MARKER);
    const requestId = params.get(LINK_REQUEST_MARKER) || "";
    const sourceUrl = params.get(SOURCE_URL_MARKER) || "";
    const restoreDraft = params.get(RESTORE_DRAFT_MARKER) === "1";
    const hasLinkPrompt = url.searchParams.has("q");
    if (panelMarker !== "1" && !requestId && !hasLinkPrompt && !sourceUrl && !restoreDraft) return;
    try {
      sessionStorage.setItem(PANEL_MARKER, "1");
      if (requestId) sessionStorage.setItem(LINK_SESSION_KEY, requestId);
      if (sourceUrl) sessionStorage.setItem(SOURCE_URL_SESSION_KEY, sourceUrl);
      if (restoreDraft) sessionStorage.setItem(RESTORE_DRAFT_SESSION_KEY, "1");
      else if (sourceUrl) sessionStorage.removeItem(RESTORE_DRAFT_SESSION_KEY);
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
