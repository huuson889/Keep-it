(() => {
  "use strict";

  const entries = [
    {
      id:"chatgpt",
      name:"ChatGPT",
      startUrl:"https://chatgpt.com/",
      conversationMapKey:"keepitChatGPTConversationBySourceUrl",
      hosts:["chatgpt.com", "chat.openai.com"],
      origins:["https://chatgpt.com", "https://chat.openai.com"]
    },
    {
      id:"gemini",
      name:"Gemini",
      startUrl:"https://gemini.google.com/app",
      conversationMapKey:"keepitGeminiConversationBySourceUrl",
      hosts:["gemini.google.com"],
      origins:["https://gemini.google.com"]
    },
    {
      id:"claude",
      name:"Claude",
      startUrl:"https://claude.ai/new",
      conversationMapKey:"keepitClaudeConversationBySourceUrl",
      hosts:["claude.ai"],
      origins:["https://claude.ai", "https://www.claude.ai"]
    },
    {
      id:"grok",
      name:"Grok",
      startUrl:"https://grok.com/",
      hosts:["grok.com"],
      origins:["https://grok.com", "https://www.grok.com"]
    }
  ].map(provider => Object.freeze({
    ...provider,
    hosts:Object.freeze(provider.hosts),
    origins:Object.freeze(provider.origins)
  }));

  const byId = new Map(entries.map(provider => [provider.id, provider]));
  const panelIds = Object.freeze(["chatgpt", "gemini", "claude"]);
  const panelEntries = Object.freeze(entries.filter(provider => panelIds.includes(provider.id)));

  function get(providerId) {
    return byId.get(String(providerId || "").toLowerCase()) || null;
  }

  function fromHost(hostname) {
    const host = String(hostname || "").toLowerCase().replace(/\.$/, "");
    return entries.find(provider => provider.hosts.some(domain => host === domain || host.endsWith(`.${domain}`))) || null;
  }

  function fromUrl(value) {
    try {
      const url = new URL(String(value || ""));
      return url.protocol === "https:" ? fromHost(url.hostname) : null;
    } catch { return null; }
  }

  function isPanelProvider(providerId) { return panelIds.includes(get(providerId)?.id || ""); }

  function normalizeConversationUrl(providerId, value) {
    const provider = get(providerId);
    if (!provider || provider.id === "grok") return "";
    try {
      const url = new URL(String(value || ""));
      if (url.protocol !== "https:" || fromHost(url.hostname)?.id !== provider.id) return "";
      const validPath = provider.id === "chatgpt"
        ? /^\/c\/[A-Za-z0-9_-]+(?:\/|$)/.test(url.pathname)
        : provider.id === "gemini"
          ? /^\/app\/[A-Za-z0-9_-]+(?:\/|$)/.test(url.pathname)
          : /^\/chat\/[A-Za-z0-9_-]+(?:\/|$)/.test(url.pathname);
      if (!validPath) return "";
      url.search = "";
      url.hash = "";
      return `${url.origin}${url.pathname.replace(/\/+$/, "")}`;
    } catch { return ""; }
  }

  function makePrompt(providerId, {
    intent = "summary", sourceUrl = "", selectedText = "", language = "en",
    summaryPrompt = "", askPrompt = "", includeSource = true
  } = {}) {
    if (!get(providerId) || providerId === "chatgpt") return "";
    const locale = ["en", "vi", "ko"].includes(language) ? language : "en";
    const strings = {
      en:{ summary:"Summarize this web page.", ask:"What does this selected text mean in context?", source:"Source" },
      vi:{ summary:"Hãy tóm tắt trang web sau.", ask:"Đoạn văn bản được chọn này có nghĩa là gì trong ngữ cảnh?", source:"Nguồn" },
      ko:{ summary:"다음 웹페이지를 요약해 주세요.", ask:"선택한 텍스트는 이 웹페이지의 맥락에서 무엇을 의미하나요?", source:"출처" }
    }[locale];
    const source = String(sourceUrl || "").trim();
    const selection = String(selectedText || "").trim();
    const isAsk = intent === "ask-selected-text";
    const instruction = String(isAsk ? askPrompt : summaryPrompt).trim() || (isAsk ? strings.ask : strings.summary);
    const lines = isAsk && selection ? [`"${selection}"`, instruction] : [instruction];
    if (includeSource && source) lines.push("", `${strings.source}: ${source}`);
    return lines.join("\n");
  }

  globalThis.LHN_AI_PROVIDERS = Object.freeze({
    list:Object.freeze(entries),
    panelList:panelEntries,
    ids:Object.freeze(entries.map(provider => provider.id)),
    panelIds,
    get,
    fromHost,
    fromUrl,
    isPanelProvider,
    normalizeConversationUrl,
    makePrompt
  });
})();
