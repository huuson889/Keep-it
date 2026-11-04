(async () => {
  const PENDING_KEY = "keepitChatGPTDraftPending"; // Legacy v3.5.60 draft flow; kept but no longer invoked.
  const LINK_PENDING_KEY = "keepitChatGPTLinkPending";
  const PANEL_NAVIGATION_KEY = "keepitChatGPTPanelNavigationRequest";
  const CONVERSATION_KEY = "keepitChatGPTLastConversationUrl";
  const PANEL_MARKER = "keepit-chatgpt-panel";
  const LINK_REQUEST_MARKER = "keepit-chatgpt-link-request";
  const LINK_SESSION_KEY = "keepitChatGPTLinkRequestId";
  const LINK_DIRECT_SESSION_KEY = "keepitChatGPTDirectFollowupRequestId";
  const LINK_Q_SESSION_KEY = "keepitChatGPTLinkQRequestId";
  const LINK_Q_PROMPT_SESSION_KEY = "keepitChatGPTLinkQPrompt";
  const LINK_SENT_SESSION_KEY = "keepitChatGPTLinkSentRequestId";
  const LINK_PREPARED_SESSION_KEY = "keepitChatGPTPreparedRequestId";
  const QUERY_REQUEST_KEY = "keepit-chatgpt-query-prefill-request";
  const PROMPT_PREFIX = "Hãy tóm tắt nội dung ngắn gọn";
  const LINK_PROMPT_PREFIX = "Hãy tóm tắt bài sau:";
  const MAX_WAIT_MS = 25000;
  const isFirefox = /Firefox\//i.test(globalThis.navigator?.userAgent || "");
  let url;
  try { url = new URL(location.href); } catch { return; }
  // ChatGPT in an ordinary tab must never read or receive the extension's clipboard draft.
  const initialHashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
  const hasUrlMarker = url.searchParams.get(PANEL_MARKER) === "1" || initialHashParams.get(PANEL_MARKER) === "1";
  const initialLinkRequestId = initialHashParams.get(LINK_REQUEST_MARKER) || "";
  let hasSessionMarker = false;
  try {
    hasSessionMarker = sessionStorage.getItem(PANEL_MARKER) === "1";
    if (hasUrlMarker) sessionStorage.setItem(PANEL_MARKER, "1");
    if (initialLinkRequestId) sessionStorage.setItem(LINK_SESSION_KEY, initialLinkRequestId);
  } catch { /* restricted storage still allows the explicit URL marker */ }
  const extensionRoot = globalThis.browser?.runtime?.getURL?.("") || "";
  function extensionMessageOrigin() {
    try {
      const parsed = new URL(extensionRoot);
      return parsed.host ? `${parsed.protocol}//${parsed.host}` : "";
    } catch { return ""; }
  }
  const hasExtensionReferrer = !!extensionRoot && document.referrer.startsWith(extensionRoot);
  if (hasExtensionReferrer && !hasSessionMarker) { try { sessionStorage.setItem(PANEL_MARKER, "1"); hasSessionMarker = true; } catch {} }
  if ((!hasUrlMarker && !hasSessionMarker && !hasExtensionReferrer) || (!isFirefox && window.top === window)) return;
  const browserApi = globalThis.browser;
  if (!browserApi?.storage?.local || !globalThis.LHN_MESSAGING?.sendMessage) return;
  if (isFirefox) {
    globalThis.LHN_MESSAGING.sendMessage({ type:"CHATGPT_PANEL_CONTEXT_READY" }).catch(() => {});
  }

  let processing = false;
  let retryRequested = false;
  let lastRequestId = "";

  function findComposer() {
    return document.querySelector("#prompt-textarea")
      || document.querySelector('[contenteditable="true"][data-testid="prompt-textarea"]')
      || document.querySelector('textarea[placeholder*="Message" i]')
      || document.querySelector('textarea[aria-label*="Message" i]');
  }

  function composerText(composer) {
    return String(composer?.isContentEditable ? composer.innerText || composer.textContent : composer?.value || "").replace(/[\u200b\u2060]/g, "");
  }

  function composerHasText(composer) {
    return /[^\s]/.test(composerText(composer));
  }

  // The side-panel host asks before changing conversations and directly wakes a same-route follow-up.
  window.addEventListener("message", event => {
    if (window.top === window || event.source !== window.parent) return;
    const extensionOrigin = extensionMessageOrigin();
    if (!extensionOrigin || event.origin !== extensionOrigin) return;
    if (event.data?.type === "KEEPIT_CHATGPT_PANEL_NAV_GUARD") {
      void (async () => {
        const composer = findComposer() || await waitForLinkComposer(1300);
        const hasDraft = composerHasText(composer);
        try { event.source.postMessage({ type:"KEEPIT_CHATGPT_PANEL_NAV_GUARD_RESULT", requestId:event.data.requestId, hasDraft }, event.origin); } catch {}
      })();
      return;
    }
    if (event.data?.type === "KEEPIT_CHATGPT_PANEL_FOLLOWUP_REQUEST" && typeof event.data.requestId === "string" && event.data.requestId) {
      try {
        sessionStorage.setItem(LINK_DIRECT_SESSION_KEY, event.data.requestId);
        sessionStorage.setItem(LINK_SESSION_KEY, event.data.requestId);
      } catch {}
      void processPendingLink();
    }
  });

  const normalizedDraft = value => String(value || "").replace(/[\u200b\u2060]/g, "").replace(/\r\n?/g, "\n").replace(/\s+/g, " ").trim();
  const isPreparedDraft = value => typeof value === "string" && value.startsWith(PROMPT_PREFIX) && value.includes("Nội dung chính:");

  function waitForComposerDraft(text, timeoutMs = 1800) {
    return new Promise(resolve => {
      let settled = false;
      let timer;
      const finish = composer => {
        if (settled) return;
        settled = true;
        observer.disconnect();
        clearTimeout(timer);
        resolve(composer);
      };
      const check = () => {
        const composer = findComposer();
        if (composer && normalizedDraft(composerText(composer)) === normalizedDraft(text)) finish(composer);
      };
      const observer = new MutationObserver(check);
      observer.observe(document.documentElement, { childList:true, subtree:true, characterData:true, attributes:true });
      timer = setTimeout(() => finish(null), timeoutMs);
      check();
    });
  }

  function waitForComposer() {
    const initial = findComposer();
    if (initial) return Promise.resolve(initial);
    return new Promise(resolve => {
      let settled = false;
      const finish = value => {
        if (settled) return;
        settled = true;
        observer.disconnect();
        clearTimeout(timer);
        resolve(value);
      };
      const observer = new MutationObserver(() => {
        const composer = findComposer();
        if (composer) finish(composer);
      });
      observer.observe(document.documentElement, { childList:true, subtree:true });
      const timer = setTimeout(() => finish(null), MAX_WAIT_MS);
    });
  }

  function insertDraft(composer, text) {
    composer.focus();
    if (composer.isContentEditable) {
      let inserted = false;
      try { inserted = document.execCommand("insertText", false, text); } catch { /* use the safe empty-editor fallback */ }
      if (!inserted || composerText(composer) !== text.trim()) {
        composer.textContent = text;
        composer.dispatchEvent(new InputEvent("input", { bubbles:true, inputType:"insertText", data:text }));
      }
    } else {
      const proto = Object.getPrototypeOf(composer);
      const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
      if (setter) setter.call(composer, text); else composer.value = text;
      composer.dispatchEvent(new InputEvent("input", { bubbles:true, inputType:"insertText", data:text }));
      composer.dispatchEvent(new Event("change", { bubbles:true }));
    }
    return composerText(composer) === text.trim();
  }

  async function report(pending, ok, reason = "") {
    try {
      await globalThis.LHN_MESSAGING.sendMessage({
        type:"CHATGPT_AUTOFILL_RESULT",
        requestId:pending?.requestId || "",
        ok:!!ok,
        reason
      });
    } catch (error) { console.warn("Keepit could not report the ChatGPT draft result", error); }
  }

  function notifyPanelHostConversation(conversationUrl) {
    if (window.top === window) return;
    try {
      const extensionOrigin = extensionMessageOrigin();
      if (!extensionOrigin) return;
      window.parent.postMessage({ type:"KEEPIT_CHATGPT_PANEL_CONVERSATION", conversationUrl:String(conversationUrl || "") }, extensionOrigin);
    } catch {}
  }

  let lastConversationUrl = "";
  async function rememberCurrentConversation() {
    try {
      const current = new URL(location.href);
      if (!["chatgpt.com", "chat.openai.com"].includes(current.hostname)) return;
      if (!/\/c\/[A-Za-z0-9_-]{8,}(?:\/|$)/i.test(current.pathname)) {
        if (lastConversationUrl) {
          lastConversationUrl = "";
          notifyPanelHostConversation("");
        }
        return;
      }
      const conversationUrl = `${current.origin}${current.pathname}`;
      if (conversationUrl === lastConversationUrl) return;
      lastConversationUrl = conversationUrl;
      notifyPanelHostConversation(conversationUrl);
      await browserApi.storage.local.set({ [CONVERSATION_KEY]:conversationUrl });
    } catch (error) { lastConversationUrl = ""; console.warn("Keepit could not remember the ChatGPT conversation route", error); }
  }

  // Legacy v3.5.60 clipboard/body-text autofill kept only for rollback; no current trigger calls it.
  async function processPendingDraftLegacy() {
    if (processing) { retryRequested = true; return; }
    processing = true;
    let pending = null;
    try {
      const stored = await browserApi.storage.local.get(PENDING_KEY);
      pending = stored?.[PENDING_KEY];
      if (!pending || !pending.requestId || pending.requestId === lastRequestId) return;
      lastRequestId = pending.requestId;
      if (!Number.isFinite(pending.expiresAt) || pending.expiresAt < Date.now()) {
        await report(pending, false, "draft-expired");
        return;
      }
      let composer = await waitForComposer();
      if (!composer) {
        await report(pending, false, "composer-unavailable");
        return;
      }
      let queryDraft = "";
      try { queryDraft = new URL(location.href).searchParams.get("q") || ""; } catch {}
      let queryRequestId = "";
      try { queryRequestId = sessionStorage.getItem(QUERY_REQUEST_KEY) || ""; } catch {}
      if (!queryRequestId) queryRequestId = initialHashParams.get("keepit-chatgpt-prefill") || "";
      let clipboardText = "";
      try { clipboardText = await navigator.clipboard.readText(); }
      catch (error) {
        console.warn("Keepit could not read the prepared ChatGPT draft from the clipboard", error);
        if (!(queryRequestId === pending.requestId && isPreparedDraft(queryDraft))) {
          await report(pending, false, "clipboard-read-failed");
          return;
        }
      }
      if (!isPreparedDraft(clipboardText) && queryRequestId === pending.requestId && isPreparedDraft(queryDraft)) clipboardText = queryDraft;
      if (!isPreparedDraft(clipboardText)) {
        await report(pending, false, "prepared-draft-not-found");
        return;
      }
      const queryMatchesDraft = isPreparedDraft(queryDraft) && queryDraft === clipboardText;
      if (queryMatchesDraft) { try { sessionStorage.setItem(QUERY_REQUEST_KEY, pending.requestId); } catch {} }

      // ChatGPT's q= URL path prefills the composer in Chrome and Firefox. It does not click Send.
      // Remember the request in sessionStorage so a site redirect that strips q= cannot loop.
      if (!queryMatchesDraft && queryRequestId !== pending.requestId) {
        const latestBeforeNavigation = (await browserApi.storage.local.get(PENDING_KEY))?.[PENDING_KEY];
        if (latestBeforeNavigation?.requestId !== pending.requestId) { retryRequested = true; return; }
        if (composerHasText(composer)) {
          await report(pending, false, "composer-not-empty");
          return;
        }
        const nextUrl = new URL(location.href);
        nextUrl.searchParams.set("q", clipboardText);
        const nextHashParams = new URLSearchParams(nextUrl.hash.replace(/^#/, ""));
        nextHashParams.set(PANEL_MARKER, "1");
        nextHashParams.set("keepit-chatgpt-prefill", pending.requestId);
        nextUrl.hash = nextHashParams.toString();
        try { sessionStorage.setItem(QUERY_REQUEST_KEY, pending.requestId); } catch {}
        location.replace(nextUrl.href);
        return;
      }

      if (composerHasText(composer)) {
        if (normalizedDraft(composerText(composer)) === normalizedDraft(clipboardText)) await report(pending, true);
        else await report(pending, false, "composer-not-empty");
        return;
      }
      if (queryMatchesDraft) {
        const queryPrefilledComposer = await waitForComposerDraft(clipboardText);
        if (queryPrefilledComposer) {
          await report(pending, true);
          return;
        }
        composer = findComposer() || composer;
        if (composerHasText(composer)) {
          await report(pending, false, "composer-not-empty");
          return;
        }
      }
      const latest = (await browserApi.storage.local.get(PENDING_KEY))?.[PENDING_KEY];
      if (latest?.requestId !== pending.requestId) { retryRequested = true; return; }
      // Recheck immediately before filling, so an existing user draft is never replaced.
      if (composerHasText(composer)) {
        await report(pending, false, "composer-not-empty");
        return;
      }
      const inserted = insertDraft(composer, clipboardText);
      await report(pending, inserted, inserted ? "" : "composer-insert-failed");
    } catch (error) {
      console.warn("Keepit could not fill the ChatGPT draft", error);
      if (pending) await report(pending, false, "autofill-failed");
    } finally {
      processing = false;
      if (retryRequested) { retryRequested = false; queueMicrotask(() => void processPendingDraftLegacy()); }
    }
  }

  let linkProcessing = false;
  let linkRetryRequested = false;
  let lastLinkAttemptId = "";

  function activeLinkRequestId() {
    const currentHash = new URLSearchParams(String(location.hash || "").replace(/^#/, ""));
    const fromHash = currentHash.get(LINK_REQUEST_MARKER) || "";
    if (fromHash) {
      try { sessionStorage.setItem(LINK_SESSION_KEY, fromHash); } catch {}
      return fromHash;
    }
    try { return sessionStorage.getItem(LINK_SESSION_KEY) || initialLinkRequestId; }
    catch { return initialLinkRequestId; }
  }

  function currentConversationUrl() {
    try {
      const current = new URL(location.href);
      if (!["chatgpt.com", "chat.openai.com"].includes(current.hostname)) return "";
      if (!/^\/c\/[A-Za-z0-9_-]+(?:\/|$)/.test(current.pathname)) return "";
      current.search = "";
      current.hash = "";
      return current.href;
    } catch { return ""; }
  }

  function waitForConversationRoute(timeoutMs = 12000) {
    return new Promise(resolve => {
      const started = Date.now();
      const timer = setInterval(() => {
        const conversationUrl = currentConversationUrl();
        if (conversationUrl || Date.now() - started >= timeoutMs) {
          clearInterval(timer);
          resolve(conversationUrl);
        }
      }, 150);
    });
  }

  function waitForLinkComposer(timeoutMs = 16000) {
    const initial = findComposer();
    if (initial) return Promise.resolve(initial);
    return new Promise(resolve => {
      let settled = false;
      const finish = value => {
        if (settled) return;
        settled = true;
        observer.disconnect();
        clearTimeout(timer);
        resolve(value);
      };
      const observer = new MutationObserver(() => {
        const composer = findComposer();
        if (composer) finish(composer);
      });
      observer.observe(document.documentElement, { childList:true, subtree:true, characterData:true });
      const timer = setTimeout(() => finish(null), timeoutMs);
    });
  }

  function findSendButton() {
    return document.querySelector('button[data-testid="send-button"]')
      || document.querySelector('button[aria-label*="Send prompt" i]')
      || document.querySelector('button[aria-label="Send" i]');
  }

  async function waitForEnabledSendButton(timeoutMs = 9000) {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      const button = findSendButton();
      if (button && !button.disabled && button.getAttribute("aria-disabled") !== "true") return button;
      await new Promise(resolve => setTimeout(resolve, 120));
    }
    return null;
  }

  function findNewChatButton() {
    return document.querySelector('button[data-testid="create-new-chat-button"]')
      || document.querySelector('a[data-testid="create-new-chat-button"]')
      || document.querySelector('button[aria-label*="New chat" i]')
      || document.querySelector('a[aria-label*="New chat" i]');
  }

  async function waitForNewChatRoute(timeoutMs = 6000) {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      if (!currentConversationUrl()) return true;
      await new Promise(resolve => setTimeout(resolve, 150));
    }
    return !currentConversationUrl();
  }

  async function reportLinkResult(pending, ok, conversationUrl = "", reason = "") {
    try {
      await globalThis.LHN_MESSAGING.sendMessage({
        type:"CHATGPT_LINK_RESULT",
        requestId:pending?.requestId || "",
        ok:!!ok,
        conversationUrl:conversationUrl || "",
        reason
      });
    } catch (error) { console.warn("Keepit could not report the ChatGPT prompt result", error); }
  }

  async function processPendingLink() {
    if (linkProcessing) { linkRetryRequested = true; return; }
    linkProcessing = true;
    let pending = null;
    try {
      const stored = await browserApi.storage.local.get(LINK_PENDING_KEY);
      pending = stored?.[LINK_PENDING_KEY];
      if (!pending?.requestId || !pending.sourceUrl) return;
      if (!Number.isFinite(pending.expiresAt) || pending.expiresAt < Date.now()) {
        await reportLinkResult(pending, false, "", "link-request-expired");
        return;
      }

      const isFollowup = pending.mode === "auto-send-followup";
      const expectedPrompt = typeof pending.prompt === "string" && pending.prompt
        ? pending.prompt
        : `${LINK_PROMPT_PREFIX} ${pending.sourceUrl}`;
      const expectedNormalized = normalizedDraft(expectedPrompt);
      let activeRequestId = activeLinkRequestId();
      if (isFollowup) {
        try { if (sessionStorage.getItem(LINK_DIRECT_SESSION_KEY) === pending.requestId) activeRequestId = pending.requestId; } catch {}
      }
      const currentUrl = new URL(location.href);
      const queryMatches = currentUrl.searchParams.get("q") === expectedPrompt;
      let qRequestId = "";
      let qPrompt = "";
      let alreadySentRequestId = "";
      try {
        qRequestId = sessionStorage.getItem(LINK_Q_SESSION_KEY) || "";
        qPrompt = sessionStorage.getItem(LINK_Q_PROMPT_SESSION_KEY) || "";
        alreadySentRequestId = sessionStorage.getItem(LINK_SENT_SESSION_KEY) || "";
      } catch {}
      const qPromptMatches = queryMatches || qPrompt === expectedPrompt;
      const qRequestMatches = qRequestId === pending.requestId && qPromptMatches;
      if (isFollowup) {
        const canonicalConversation = value => {
          try {
            const target = new URL(String(value || ""));
            if (target.protocol !== "https:" || !["chatgpt.com", "chat.openai.com"].includes(target.hostname) || !/^\/c\/[A-Za-z0-9_-]+(?:\/|$)/.test(target.pathname)) return "";
            return `${target.origin}${target.pathname.replace(/\/+$/, "")}`;
          } catch { return ""; }
        };
        if (activeRequestId !== pending.requestId || canonicalConversation(currentConversationUrl()) !== canonicalConversation(pending.conversationUrl)) return;
      } else if (!qPromptMatches || (activeRequestId !== pending.requestId && !qRequestMatches)) {
        return;
      }

      let conversationUrl = currentConversationUrl();
      let composer = findComposer();
      if (conversationUrl && alreadySentRequestId === pending.requestId) {
        await reportLinkResult(pending, true, conversationUrl);
        return;
      }
      // For the first request, ChatGPT may submit ?q= natively. If it has cleared the exact
      // prefill, record success rather than clicking Send a second time. Follow-ups deliberately
      // target the existing /c/<id> route and are sent only from an empty, request-guarded composer.
      if (!isFollowup && conversationUrl && (queryMatches || qRequestMatches) && !composerHasText(composer)) {
        try { sessionStorage.setItem(LINK_SENT_SESSION_KEY, pending.requestId); } catch {}
        await reportLinkResult(pending, true, conversationUrl);
        return;
      }
      if (lastLinkAttemptId === pending.requestId) return;
      lastLinkAttemptId = pending.requestId;

      // A new URL must not reuse an unrelated existing conversation. Follow-ups are allowed
      // only on the exact mapped conversation validated above; preserve the existing draft guard.
      if (!isFollowup && conversationUrl && !queryMatches && !qRequestMatches) {
        if (composerHasText(composer)) {
          await reportLinkResult(pending, false, "", "composer-not-empty");
          return;
        }
        const newChatButton = findNewChatButton();
        if (!newChatButton) {
          await reportLinkResult(pending, false, "", "new-chat-unavailable");
          return;
        }
        newChatButton.click();
        const startedNewChat = await waitForNewChatRoute();
        if (!startedNewChat) {
          await reportLinkResult(pending, false, "", "new-chat-unavailable");
          return;
        }
      }

      const latestBeforeRead = (await browserApi.storage.local.get(LINK_PENDING_KEY))?.[LINK_PENDING_KEY];
      if (latestBeforeRead?.requestId !== pending.requestId || pending.expiresAt <= Date.now()) return;
      composer = findComposer() || await waitForLinkComposer();
      if (!composer) {
        if (!isFollowup) {
          const createdConversation = await waitForConversationRoute(3500);
          if (createdConversation && (queryMatches || qRequestMatches)) {
            try { sessionStorage.setItem(LINK_SENT_SESSION_KEY, pending.requestId); } catch {}
            await reportLinkResult(pending, true, createdConversation);
            return;
          }
        }
        await reportLinkResult(pending, false, "", "composer-unavailable");
        return;
      }

      let text = normalizedDraft(composerText(composer));
      if (isFollowup) {
        if (composerHasText(composer)) {
          await reportLinkResult(pending, false, "", "composer-not-empty");
          return;
        }
        // The follow-up prompt is sourced only from the user's explicit text selection; never
        // replace any existing composer content. This path is used because q= starts new chats.
        insertDraft(composer, expectedPrompt);
        text = normalizedDraft(composerText(composer));
        if (text !== expectedNormalized) {
          await reportLinkResult(pending, false, "", "composer-insert-failed");
          return;
        }
      } else {
        if (text && text !== expectedNormalized) {
          // Never replace or send an unrelated user draft, even if the ?q= URL is present.
          await reportLinkResult(pending, false, "", "composer-not-empty");
          return;
        }
        if (!text) {
          // The query parameter is the primary prompt transport. Do not manually type into an
          // empty composer: wait briefly for ChatGPT to handle q=, otherwise fail safely.
          const createdConversation = await waitForConversationRoute(3500);
          if (createdConversation && (queryMatches || qRequestMatches)) {
            try { sessionStorage.setItem(LINK_SENT_SESSION_KEY, pending.requestId); } catch {}
            await reportLinkResult(pending, true, createdConversation);
          } else {
            await reportLinkResult(pending, false, "", "q-prefill-empty");
          }
          return;
        }

        // The exact request prompt is present from ChatGPT's q= prefill. First allow native
        // auto-submit to finish; if it did, do not submit a duplicate.
        let createdConversation = await waitForConversationRoute(2200);
        composer = findComposer() || composer;
        if (createdConversation && !composerHasText(composer)) {
          try { sessionStorage.setItem(LINK_SENT_SESSION_KEY, pending.requestId); } catch {}
          await reportLinkResult(pending, true, createdConversation);
          return;
        }
      }

      const latest = (await browserApi.storage.local.get(LINK_PENDING_KEY))?.[LINK_PENDING_KEY];
      if (latest?.requestId !== pending.requestId || pending.expiresAt <= Date.now()) return;
      composer = findComposer() || composer;
      if (normalizedDraft(composerText(composer)) !== expectedNormalized) {
        await reportLinkResult(pending, false, "", "composer-not-empty");
        return;
      }
      const sendButton = await waitForEnabledSendButton();
      if (!sendButton) {
        await reportLinkResult(pending, false, "", "send-button-unavailable");
        return;
      }
      // Final draft and request checks immediately before the single send.
      if (normalizedDraft(composerText(composer)) !== expectedNormalized) {
        await reportLinkResult(pending, false, "", "composer-not-empty");
        return;
      }
      try { sessionStorage.setItem(LINK_SENT_SESSION_KEY, pending.requestId); } catch {}
      sendButton.click();
      if (isFollowup) {
        conversationUrl = currentConversationUrl();
        if (conversationUrl) await reportLinkResult(pending, true, conversationUrl);
        else await reportLinkResult(pending, false, "", "conversation-route-missing");
      } else {
        const createdConversation = await waitForConversationRoute(18000);
        if (createdConversation) await reportLinkResult(pending, true, createdConversation);
        else await reportLinkResult(pending, false, "", "conversation-not-created");
      }
    } catch (error) {
      console.warn("Could not send the request-scoped ChatGPT prompt", error);
      if (pending) await reportLinkResult(pending, false, "", "link-autosend-failed");
    } finally {
      linkProcessing = false;
      if (linkRetryRequested) { linkRetryRequested = false; queueMicrotask(() => void processPendingLink()); }
    }
  }

  async function processPanelNavigationRequest(request) {
    if (!isFirefox || window.top !== window || !request || request.expiresAt <= Date.now()) return false;
    const currentComposer = findComposer() || await waitForLinkComposer(1300);
    if (composerHasText(currentComposer)) {
      try {
        await globalThis.LHN_MESSAGING.sendMessage({
          type:"CHATGPT_PANEL_NAVIGATION_BLOCKED",
          sourceTabId:request.sourceTabId,
          linkRequestId:request.linkRequestId || "",
          reason:"composer-not-empty"
        });
        const current = await browserApi.storage.local.get(PANEL_NAVIGATION_KEY);
        if (current?.[PANEL_NAVIGATION_KEY]?.requestId === request.requestId) await browserApi.storage.local.remove(PANEL_NAVIGATION_KEY);
      } catch (error) { console.warn("Keepit could not protect the Firefox ChatGPT composer draft", error); }
      return true;
    }
    try {
      const target = new URL(String(request.targetUrl || ""));
      if (target.protocol !== "https:" || !["chatgpt.com", "chat.openai.com"].includes(target.hostname)) return false;
      if (target.pathname !== "/" && !/^\/c\/[A-Za-z0-9_-]+(?:\/|$)/.test(target.pathname)) return false;
      const conversationKey = value => {
        try {
          const parsed = new URL(String(value || ""));
          if (parsed.protocol !== "https:" || !["chatgpt.com", "chat.openai.com"].includes(parsed.hostname) || !/^\/c\/[A-Za-z0-9_-]+(?:\/|$)/.test(parsed.pathname)) return "";
          return `${parsed.origin}${parsed.pathname.replace(/\/+$/, "")}`;
        } catch { return ""; }
      };
      if (request.mode === "followup" && request.linkRequestId && conversationKey(currentConversationUrl()) === conversationKey(target.href)) {
        try {
          sessionStorage.setItem(LINK_DIRECT_SESSION_KEY, request.linkRequestId);
          sessionStorage.setItem(LINK_SESSION_KEY, request.linkRequestId);
        } catch {}
        const current = await browserApi.storage.local.get(PANEL_NAVIGATION_KEY);
        if (current?.[PANEL_NAVIGATION_KEY]?.requestId === request.requestId) await browserApi.storage.local.remove(PANEL_NAVIGATION_KEY);
        void processPendingLink();
        return true;
      }
      const params = new URLSearchParams(target.hash.replace(/^#/, ""));
      params.set(PANEL_MARKER, "1");
      if (["new-link", "followup"].includes(request.mode) && request.linkRequestId) params.set(LINK_REQUEST_MARKER, request.linkRequestId);
      else params.delete(LINK_REQUEST_MARKER);
      target.hash = params.toString();
      const current = await browserApi.storage.local.get(PANEL_NAVIGATION_KEY);
      if (current?.[PANEL_NAVIGATION_KEY]?.requestId === request.requestId) await browserApi.storage.local.remove(PANEL_NAVIGATION_KEY);
      location.replace(target.href);
      return true;
    } catch (error) {
      console.warn("Keepit could not navigate the Firefox ChatGPT panel", error);
      return false;
    }
  }

  browserApi.storage.onChanged?.addListener((changes, areaName) => {
    if (areaName !== "local") return;
    if (changes?.[LINK_PENDING_KEY]?.newValue) void processPendingLink();
    const navRequest = changes?.[PANEL_NAVIGATION_KEY]?.newValue;
    if (navRequest) void processPanelNavigationRequest(navRequest);
  });
  if (isFirefox && window.top === window) {
    browserApi.storage.local.get(PANEL_NAVIGATION_KEY).then(stored => {
      if (stored?.[PANEL_NAVIGATION_KEY]) void processPanelNavigationRequest(stored[PANEL_NAVIGATION_KEY]);
    }).catch(() => {});
  }
  const pollPanel = () => {
    if (document.visibilityState === "hidden") return;
    void rememberCurrentConversation();
    if (!linkProcessing) void processPendingLink();
  };
  void rememberCurrentConversation();
  void processPendingLink();
  const panelPollTimer = setInterval(pollPanel, 1200);
  let lastObservedHref = location.href;
  const routeObserver = new MutationObserver(() => {
    const currentHref = location.href;
    if (currentHref !== lastObservedHref) { lastObservedHref = currentHref; void rememberCurrentConversation(); void processPendingLink(); }
  });
  routeObserver.observe(document.documentElement, { childList:true, subtree:true });
  const rememberAfterNavigation = () => {
    lastObservedHref = location.href;
    void rememberCurrentConversation();
    // A repeat Ask AI uses the same /c/<id> route with a new request marker in the hash.
    // Re-run the pending sender on that hash/popstate event instead of waiting for a poll.
    void processPendingLink();
  };
  document.addEventListener("visibilitychange", pollPanel);
  window.addEventListener("popstate", rememberAfterNavigation);
  window.addEventListener("hashchange", rememberAfterNavigation);
  window.addEventListener("pagehide", () => { clearInterval(panelPollTimer); routeObserver.disconnect(); }, { once:true });
})();
