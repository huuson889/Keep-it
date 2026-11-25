// ChatGPT-only: remember which Keepit request owns a ?q= prompt before ChatGPT rewrites the URL.
// Shared panel markers (panel/source/request/clear) are captured by page/composer.js for every AI.
(() => {
  const LINK_REQUEST_MARKER = "keepit-ai-link-request";
  const LINK_Q_SESSION_KEY = "keepitAiLinkQRequestId";

  function capture(value = location.href) {
    let url;
    try { url = new URL(value); } catch { return; }
    const requestId = new URLSearchParams(url.hash.replace(/^#/, "")).get(LINK_REQUEST_MARKER) || "";
    if (!requestId || !url.searchParams.has("q")) return;
    try { sessionStorage.setItem(LINK_Q_SESSION_KEY, requestId); }
    catch { /* the send flow still compares the live ?q= value */ }
  }

  capture();
  window.addEventListener("hashchange", event => capture(event.newURL || location.href), true);
})();
