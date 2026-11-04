(() => {
  const CONVERSATION_KEY = "keepitChatGPTLastConversationUrl";
  const PANEL_MARKER = "keepit-chatgpt-panel";
  const DEFAULT_CHATGPT_URL = "https://chatgpt.com/";
  const frame = document.getElementById("chatgpt-frame");

  function safeConversationUrl(value) {
    if (typeof value !== "string") return "";
    try {
      const url = new URL(value);
      if (url.protocol !== "https:" || !["chatgpt.com", "chat.openai.com"].includes(url.hostname)) return "";
      if (!/\/c\/[A-Za-z0-9_-]{8,}(?:\/|$)/i.test(url.pathname)) return "";
      return `${url.origin}${url.pathname}`;
    } catch { return ""; }
  }

  function panelUrl(conversationUrl) {
    const url = new URL(safeConversationUrl(conversationUrl) || DEFAULT_CHATGPT_URL);
    // A fragment marker survives server redirects without being sent in the HTTP request.
    url.hash = `${PANEL_MARKER}=1`;
    return url.href;
  }

  async function openPanelPage() {
    let saved = "";
    try {
      const stored = await browser.storage.local.get(CONVERSATION_KEY);
      saved = safeConversationUrl(stored?.[CONVERSATION_KEY]);
    } catch (error) { console.warn("Keepit could not restore the last ChatGPT conversation", error); }
    const target = panelUrl(saved);
    if (frame) frame.src = target;
    else location.replace(target);
  }

  void openPanelPage();
})();
