(() => {
  "use strict";

  // Provider registry + per-AI adapters. Everything that differs between ChatGPT, Gemini and
  // Claude lives here (composer/send/new-chat selectors, ?q= support, conversation URL shape);
  // the panel, page send flow and background service share one pipeline for all of them.
  const entries = [
    {
      id:"chatgpt",
      name:"ChatGPT",
      startUrl:"https://chatgpt.com/",
      conversationMapKey:"keepitChatGPTConversationBySourceUrl",
      hosts:["chatgpt.com", "chat.openai.com"],
      origins:["https://chatgpt.com", "https://chat.openai.com"],
      conversationPath:/^\/c\/[A-Za-z0-9_-]+(?:\/|$)/,
      // ChatGPT accepts the first prompt through ?q= and may submit it natively.
      queryPrompt:true,
      // ChatGPT's ProseMirror composer needs explicit line breaks for the label/URL/prompt lines.
      multilineComposer:true,
      composerSelectors:[
        "#prompt-textarea",
        '[contenteditable="true"][data-testid="prompt-textarea"]',
        '[contenteditable="true"][role="textbox"][aria-label*="ChatGPT" i]',
        '[contenteditable="true"][role="textbox"]',
        'textarea[placeholder*="Message" i]',
        'textarea[aria-label*="Message" i]'
      ],
      // First match wins (even while disabled); the send flow waits for it to become enabled.
      sendButtonMatch:"first",
      sendButtons:[
        { scope:"document", selector:'button[data-testid="send-button"]' },
        { scope:"document", selector:'button[aria-label*="Send prompt" i]' },
        { scope:"document", selector:'button[aria-label="Send" i]' },
        { scope:"form", selector:'button[aria-label*="Gửi" i], button[type="submit"]' },
        { scope:"document", selector:'button[aria-label="Gửi" i]' }
      ],
      // AI panel sign-in (URL only): pages that mean "sign in", and the stable page Keepit opens in a tab.
      loginUrl:"https://chatgpt.com/auth/login",
      loginPages:[
        { hosts:["chatgpt.com", "chat.openai.com"], path:/^\/auth\/(?:login|signup|log-in|sign-up)(?:[/?#]|$)/i },
        { hosts:["auth.openai.com", "auth0.openai.com"], path:/^\// }
      ],
      newChatSelectors:[
        'button[data-testid="create-new-chat-button"]',
        'a[data-testid="create-new-chat-button"]',
        'button[aria-label*="New chat" i]',
        'a[aria-label*="New chat" i]'
      ]
    },
    {
      id:"gemini",
      name:"Gemini",
      startUrl:"https://gemini.google.com/app",
      conversationMapKey:"keepitGeminiConversationBySourceUrl",
      hosts:["gemini.google.com"],
      origins:["https://gemini.google.com"],
      conversationPath:/^\/app\/[A-Za-z0-9_-]+(?:\/|$)/,
      queryPrompt:false,
      multilineComposer:false,
      composerSelectors:[
        'rich-textarea [contenteditable="true"]',
        'div[contenteditable="true"][aria-label*="prompt" i]',
        'div[contenteditable="true"][aria-label*="message" i]',
        'textarea[aria-label*="prompt" i]'
      ],
      // First enabled match wins.
      sendButtonMatch:"enabled",
      sendButtons:null,
      loginUrl:"https://accounts.google.com/ServiceLogin?continue=https%3A%2F%2Fgemini.google.com%2Fapp",
      loginPages:[
        { hosts:["accounts.google.com"], path:/^\/(?:ServiceLogin|signin|v3\/signin|AccountChooser|AddSession|InteractiveLogin)(?:[/?#]|$)/i }
      ],
      newChatSelectors:[
        '[data-test-id="new-chat-button"] button',
        'button[aria-label*="New chat" i]',
        'a[aria-label*="New chat" i]'
      ]
    },
    {
      id:"claude",
      name:"Claude",
      startUrl:"https://claude.ai/new",
      conversationMapKey:"keepitClaudeConversationBySourceUrl",
      hosts:["claude.ai"],
      origins:["https://claude.ai", "https://www.claude.ai"],
      conversationPath:/^\/chat\/[A-Za-z0-9_-]+(?:\/|$)/,
      queryPrompt:false,
      multilineComposer:false,
      composerSelectors:[
        'div[contenteditable="true"][data-placeholder*="Reply" i]',
        'div[contenteditable="true"][aria-label*="Write a message" i]',
        'div[contenteditable="true"][role="textbox"]',
        'textarea[placeholder*="Reply" i]'
      ],
      sendButtonMatch:"enabled",
      sendButtons:null,
      loginUrl:"https://claude.ai/login",
      loginPages:[
        { hosts:["claude.ai"], path:/^\/(?:login|signup|magic-link)(?:[/?#]|$)/i }
      ],
      newChatSelectors:[
        'a[href="/new"]',
        'button[aria-label*="New chat" i]',
        'a[aria-label*="New chat" i]'
      ]
    },
    {
      id:"grok",
      name:"Grok",
      startUrl:"https://grok.com/",
      hosts:["grok.com"],
      origins:["https://grok.com", "https://www.grok.com"],
      conversationPath:null,
      queryPrompt:false,
      multilineComposer:false,
      composerSelectors:[
        'textarea[placeholder*="Ask" i]',
        'textarea[aria-label*="Ask" i]',
        'div[contenteditable="true"][data-placeholder*="Ask" i]',
        'div[contenteditable="true"][role="textbox"]',
        'div[contenteditable="true"]',
        'textarea[aria-label]',
        'textarea'
      ],
      sendButtonMatch:"enabled",
      sendButtons:null,
      newChatSelectors:[]
    }
  ];

  // Gemini/Claude send buttons: the composer form first, then the document.
  const GENERIC_SEND_SELECTORS = [
    'button[data-testid*="send" i]',
    'button[data-test-id*="send" i]',
    'button[aria-label^="Send" i]',
    'button[title^="Send" i]',
    'button[aria-label^="Gửi" i]',
    'button[aria-label^="전송" i]',
    'button[aria-label^="보내기" i]',
    'button[aria-label="Send" i]',
    'button[type="submit"]'
  ];
  const GENERIC_SEND_BUTTONS = [
    ...GENERIC_SEND_SELECTORS.map(selector => ({ scope:"form", selector })),
    ...GENERIC_SEND_SELECTORS.map(selector => ({ scope:"document", selector }))
  ];

  const frozenEntries = entries.map(provider => Object.freeze({
    ...provider,
    hosts:Object.freeze(provider.hosts),
    origins:Object.freeze(provider.origins),
    composerSelectors:Object.freeze(provider.composerSelectors),
    sendButtons:Object.freeze((provider.sendButtons || GENERIC_SEND_BUTTONS).map(item => Object.freeze({ ...item }))),
    newChatSelectors:Object.freeze(provider.newChatSelectors),
    loginUrl:provider.loginUrl || "",
    loginPages:Object.freeze((provider.loginPages || []).map(page => Object.freeze({ hosts:Object.freeze([...page.hosts]), path:page.path })))
  }));

  const byId = new Map(frozenEntries.map(provider => [provider.id, provider]));
  const panelIds = Object.freeze(["chatgpt", "gemini", "claude"]);
  const panelEntries = Object.freeze(frozenEntries.filter(provider => panelIds.includes(provider.id)));

  function get(providerId) {
    return byId.get(String(providerId || "").toLowerCase()) || null;
  }

  function fromHost(hostname) {
    const host = String(hostname || "").toLowerCase().replace(/\.$/, "");
    return frozenEntries.find(provider => provider.hosts.some(domain => host === domain || host.endsWith(`.${domain}`))) || null;
  }

  function fromUrl(value) {
    try {
      const url = new URL(String(value || ""));
      return url.protocol === "https:" ? fromHost(url.hostname) : null;
    } catch { return null; }
  }

  function isPanelProvider(providerId) { return panelIds.includes(get(providerId)?.id || ""); }

  // AI panel sign-in, decided by URL only (never page content). AIs change their sign-in links, so
  // besides each provider's known pages, any URL that looks like sign-in counts: a known identity host,
  // a host starting with accounts./auth./login./..., or a whole path segment such as /login, /signin,
  // /auth, /oauth2, /sso. Sign-out URLs never count.
  const IDENTITY_HOSTS = Object.freeze(["accounts.google.com", "appleid.apple.com", "idmsa.apple.com", "login.microsoftonline.com", "login.live.com", "auth.openai.com", "auth0.openai.com"]);
  const IDENTITY_HOST_LABELS = new Set(["accounts", "auth", "auth0", "login", "signin", "sso", "id", "identity", "oauth"]);
  const LOGIN_PATH_SEGMENT = /(?:^|\/)(?:log-?in|sign-?in|sign-?up|auth|oauth2?|sso|authorize|accountchooser|servicelogin|interactivelogin|addsession|identifier|magic-link)(?=$|[/.])/i;
  const LOGOUT_PATH = /(?:^|\/)(?:log-?out|sign-?out|log-?off|sign-?off)(?=$|[/.])/i;
  const hostMatches = (host, domain) => host === domain || host.endsWith(`.${domain}`);

  function isLoginUrl(providerId, value) {
    try {
      const url = new URL(String(value || ""));
      if (url.protocol !== "https:" || LOGOUT_PATH.test(url.pathname)) return false;
      const host = url.hostname.toLowerCase().replace(/\.$/, "");
      const provider = providerId ? get(providerId) : null;
      if (provider?.loginPages?.some(page => page.hosts.some(domain => hostMatches(host, domain)) && page.path.test(url.pathname))) return true;
      if (IDENTITY_HOSTS.some(domain => hostMatches(host, domain))) return true;
      const labels = host.split(".");
      if (labels.length >= 3 && IDENTITY_HOST_LABELS.has(labels[0])) return true;
      return LOGIN_PATH_SEGMENT.test(url.pathname);
    } catch { return false; }
  }

  // Source pages are plain http(s) URLs; the panel never reads page body, title or clipboard.
  function normalizeSourceUrl(value) {
    try {
      const url = new URL(String(value || ""));
      return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch { return ""; }
  }

  function normalizeConversationUrl(providerId, value) {
    const provider = get(providerId);
    if (!provider?.conversationPath) return "";
    try {
      const url = new URL(String(value || ""));
      if (url.protocol !== "https:" || fromHost(url.hostname)?.id !== provider.id) return "";
      if (!provider.conversationPath.test(url.pathname)) return "";
      return `${url.origin}${url.pathname.replace(/\/+$/, "")}`;
    } catch { return ""; }
  }

  // Selected AI panel provider: per-window choice (storage.session), then the last choice
  // (storage.local, survives refresh/restart), then ChatGPT only if nothing was ever chosen.
  const SELECTED_BY_WINDOW_KEY = "keepitAiPanelProviderByWindow";
  const LAST_SELECTED_KEY = "keepitAiPanelLastProvider";
  function pickSelectedProvider(byWindow, windowId, lastProviderId) {
    const candidates = [Number.isInteger(windowId) ? byWindow?.[String(windowId)] : "", lastProviderId];
    for (const candidate of candidates) {
      if (candidate && isPanelProvider(candidate)) return get(candidate).id;
    }
    return "chatgpt";
  }

  function isStartPath(provider, url) {
    const start = new URL(provider.startUrl);
    const path = url.pathname.replace(/\/+$/, "") || "/";
    const startPath = start.pathname.replace(/\/+$/, "") || "/";
    return path === "/" || path === startPath;
  }

  // Shared panel route: a validated conversation URL, or the provider's blank-chat start route.
  function panelRoute(providerId, value) {
    const provider = get(providerId);
    if (!isPanelProvider(provider?.id)) return "";
    const conversation = normalizeConversationUrl(provider.id, value);
    if (conversation) return conversation;
    try {
      const url = new URL(String(value || ""));
      if (url.protocol !== "https:" || fromHost(url.hostname)?.id !== provider.id || !isStartPath(provider, url)) return "";
      const start = new URL(provider.startUrl);
      return `${start.origin}${start.pathname}`;
    } catch { return ""; }
  }

  // A navigation target: a conversation, or the start route (with ?q= only for providers that support it).
  function panelTarget(providerId, value) {
    const provider = get(providerId);
    const route = panelRoute(provider?.id, value);
    if (!route) return "";
    if (normalizeConversationUrl(provider.id, route)) return route;
    try {
      const url = new URL(String(value || ""));
      const target = new URL(route);
      if (provider.queryPrompt && url.searchParams.has("q")) target.searchParams.set("q", url.searchParams.get("q"));
      return target.href;
    } catch { return route; }
  }

  // First-prompt target used by the background service: ?q= only when the provider supports it
  // and the prompt is auto-sent (same as the ChatGPT flow); otherwise the start route.
  function linkTarget(providerId, prompt, includeQuery) {
    const provider = get(providerId);
    if (!provider) return "";
    const target = new URL(provider.startUrl);
    if (provider.queryPrompt && includeQuery) target.searchParams.set("q", String(prompt || ""));
    return target.href;
  }

  // One navigation rule for every panel provider:
  // same route + same source stays; same route + new source reloads; otherwise load the target.
  function planPanelNavigation({ displayedRoute = "", targetRoute = "", sourceChanged = false, loaded = false } = {}) {
    if (!targetRoute || !loaded || displayedRoute !== targetRoute) return "load";
    return sourceChanged ? "reload" : "stay";
  }

  // Panel URL fragment markers shared by the panel host and the provider page scripts.
  const PANEL_MARKERS = Object.freeze({
    panel:"keepit-ai-panel",
    linkRequest:"keepit-ai-link-request",
    sourceUrl:"keepit-ai-source-url",
    clearComposer:"keepit-ai-clear-composer",
    focusComposer:"keepit-ai-focus-composer"
  });

  function panelUrl(providerId, value, { linkRequestId = "", sourceUrl = "", clearComposer = false, focusComposer = false } = {}) {
    const provider = get(providerId) || get("chatgpt");
    const url = new URL(panelTarget(provider.id, value) || provider.startUrl);
    const params = new URLSearchParams(url.hash.replace(/^#/, ""));
    params.set(PANEL_MARKERS.panel, "1");
    if (linkRequestId) params.set(PANEL_MARKERS.linkRequest, String(linkRequestId));
    else params.delete(PANEL_MARKERS.linkRequest);
    if (sourceUrl) params.set(PANEL_MARKERS.sourceUrl, String(sourceUrl));
    else params.delete(PANEL_MARKERS.sourceUrl);
    if (clearComposer) params.set(PANEL_MARKERS.clearComposer, "1");
    else params.delete(PANEL_MARKERS.clearComposer);
    if (focusComposer) params.set(PANEL_MARKERS.focusComposer, "1");
    else params.delete(PANEL_MARKERS.focusComposer);
    url.hash = params.toString();
    return url.href;
  }

  function readPanelMarkers(value) {
    try {
      const url = new URL(String(value || ""));
      const params = new URLSearchParams(url.hash.replace(/^#/, ""));
      return {
        panel:url.searchParams.get(PANEL_MARKERS.panel) === "1" || params.get(PANEL_MARKERS.panel) === "1",
        linkRequestId:params.get(PANEL_MARKERS.linkRequest) || "",
        sourceUrl:normalizeSourceUrl(params.get(PANEL_MARKERS.sourceUrl)),
        clearComposer:params.get(PANEL_MARKERS.clearComposer) === "1",
        focusComposer:params.get(PANEL_MARKERS.focusComposer) === "1"
      };
    } catch {
      return { panel:false, linkRequestId:"", sourceUrl:"", clearComposer:false, focusComposer:false };
    }
  }

  globalThis.LHN_AI_PROVIDERS = Object.freeze({
    list:Object.freeze(frozenEntries),
    panelList:panelEntries,
    ids:Object.freeze(frozenEntries.map(provider => provider.id)),
    panelIds,
    get,
    fromHost,
    fromUrl,
    isPanelProvider,
    isLoginUrl,
    normalizeSourceUrl,
    normalizeConversationUrl,
    panelRoute,
    panelTarget,
    linkTarget,
    planPanelNavigation,
    PANEL_MARKERS,
    panelUrl,
    readPanelMarkers,
    SELECTED_BY_WINDOW_KEY,
    LAST_SELECTED_KEY,
    pickSelectedProvider
  });
})();
