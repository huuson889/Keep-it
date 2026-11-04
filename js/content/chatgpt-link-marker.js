// Capture panel/request markers before the ChatGPT application can rewrite its URL fragment.
(() => {
  let url;
  try { url = new URL(location.href); } catch { return; }
  const params = new URLSearchParams(url.hash.replace(/^#/, ""));
  const panelMarker = url.searchParams.get("keepit-chatgpt-panel") || params.get("keepit-chatgpt-panel");
  const requestId = params.get("keepit-chatgpt-link-request") || "";
  const hasLinkPrompt = url.searchParams.has("q");
  if (panelMarker !== "1" && !requestId && !hasLinkPrompt) return;
  try {
    sessionStorage.setItem("keepit-chatgpt-panel", "1");
    if (requestId) sessionStorage.setItem("keepitChatGPTLinkRequestId", requestId);
    if (requestId && hasLinkPrompt) {
      sessionStorage.setItem("keepitChatGPTLinkQRequestId", requestId);
      sessionStorage.setItem("keepitChatGPTLinkQPrompt", url.searchParams.get("q") || "");
    }
  } catch { /* the later content script still tries the live URL/referrer markers */ }
})();
