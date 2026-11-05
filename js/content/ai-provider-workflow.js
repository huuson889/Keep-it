(() => {
  "use strict";

  const providers = globalThis.LHN_AI_PROVIDERS;
  const editorApi = globalThis.LHN_AI_FILL;
  const provider = providers?.fromHost(location.hostname);
  if (!provider || !["gemini", "claude"].includes(provider.id) || !editorApi) return;

  const isFirefox = /Firefox\//i.test(globalThis.navigator?.userAgent || "");
  const safeSourceUrl = value => {
    try {
      const url = new URL(String(value || ""));
      return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch { return ""; }
  };
  const normalizedText = value => String(value || "").replace(/[\u200b\u2060]/g, "").replace(/\r\n?/g, "\n").replace(/\s+/g, " ").trim();
  let panelActive = false;
  let activeSourceUrl = "";
  let pendingLink = null;
  let pendingCompletion = null;
  let manualSendIntercepting = false;
  let bypassManualSendIntercept = false;
  let completionTimer = null;

  function setPanelContext({ providerId = "", sourceUrl = "", active = true } = {}) {
    if (providerId && providerId !== provider.id) return false;
    const nextSource = safeSourceUrl(sourceUrl);
    if (activeSourceUrl && activeSourceUrl !== nextSource) {
      pendingLink = null;
      pendingCompletion = null;
      if (completionTimer) clearInterval(completionTimer);
      completionTimer = null;
    }
    activeSourceUrl = nextSource;
    panelActive = active === true;
    return true;
  }

  function setPendingLink(message = {}) {
    if (message.providerId !== provider.id) return false;
    const sourceUrl = safeSourceUrl(message.sourceUrl);
    const requestId = String(message.linkRequestId || "");
    if (!sourceUrl || !requestId) return false;
    pendingLink = {
      providerId:provider.id,
      requestId,
      sourceUrl,
      mode:String(message.linkMode || "draft-link"),
      websiteLabel:String(message.websiteLabel || "Website"),
      expectedPrompt:String(message.text || "")
    };
    return true;
  }

  function currentConversationUrl() {
    return providers.normalizeConversationUrl(provider.id, location.href);
  }

  function editorText() { return editorApi.editorText(editorApi.findEditor()); }

  async function waitForEditorText(expectedText, timeoutMs = 900) {
    const started = Date.now();
    let stableSamples = 0;
    while (Date.now() - started < timeoutMs) {
      const editor = editorApi.findEditor();
      if (editor && editorApi.editorText(editor) === expectedText) {
        stableSamples++;
        if (stableSamples >= 4) return editor;
      } else stableSamples = 0;
      await new Promise(resolve => setTimeout(resolve, 35));
    }
    return null;
  }

  function findSendButton() {
    const editor = editorApi.findEditor();
    const form = editor?.closest?.("form");
    const selectors = [
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
    for (const root of [form, document]) {
      if (!root?.querySelector) continue;
      for (const selector of selectors) {
        const button = root.querySelector(selector);
        if (button && !button.disabled && button.getAttribute("aria-disabled") !== "true") return button;
      }
    }
    return null;
  }

  function isSendIntent(event, editor) {
    if (!editor || !/\S/.test(editorApi.editorText(editor))) return false;
    if (event.type === "submit") return !!editor.closest?.("form") && event.target?.contains?.(editor);
    if (event.type === "keydown") {
      return event.key === "Enter" && !event.shiftKey && !event.isComposing && event.keyCode !== 229 && editor.contains?.(event.target);
    }
    if (event.type === "click") return !!event.target?.closest?.("button") && event.target.closest("button") === findSendButton();
    return false;
  }

  function linkPrompt(websiteLabel, sourceUrl, prompt) {
    const label = String(websiteLabel || "Website");
    const header = `• ${label}: ${sourceUrl}`;
    const body = String(prompt || "").trim();
    if (body.split(/\r?\n/, 1)[0] === header) return body;
    return `• ${label}: ${sourceUrl}\n• ${body}`;
  }

  async function reportCompletion(completion, ok, conversationUrl = "", reason = "") {
    if (!completion?.requestId) return;
    try {
      await globalThis.LHN_MESSAGING.sendMessage({
        type:"AI_PROVIDER_LINK_RESULT",
        providerId:provider.id,
        requestId:completion.requestId,
        sourceUrl:completion.sourceUrl,
        ok:!!ok,
        conversationUrl,
        reason
      });
    } catch (error) { console.warn("Keepit could not save the provider conversation mapping", error); }
  }

  async function rejectUnconfirmedManualSend(requestId, sourceUrl, reason) {
    if (!requestId) return;
    if (pendingLink?.requestId === requestId) pendingLink = null;
    await reportCompletion({ requestId, sourceUrl }, false, "", reason || "manual-send-not-confirmed");
  }

  function watchForSuccessfulSend(completion) {
    if (completionTimer) clearInterval(completionTimer);
    pendingCompletion = { ...completion, startedAt:Date.now() };
    completionTimer = setInterval(() => {
      const current = pendingCompletion;
      if (!current) { clearInterval(completionTimer); completionTimer = null; return; }
      if (activeSourceUrl !== current.sourceUrl) {
        pendingCompletion = null;
        clearInterval(completionTimer);
        completionTimer = null;
        return;
      }
      const conversationUrl = currentConversationUrl();
      const editor = editorApi.findEditor();
      if (Date.now() - current.startedAt >= 450 && conversationUrl && editor && !/\S/.test(editorApi.editorText(editor))) {
        pendingCompletion = null;
        if (pendingLink?.requestId === current.requestId) pendingLink = null;
        clearInterval(completionTimer);
        completionTimer = null;
        void reportCompletion(current, true, conversationUrl);
        return;
      }
      if (Date.now() - current.startedAt >= 30000) {
        pendingCompletion = null;
        if (pendingLink?.requestId === current.requestId) pendingLink = null;
        clearInterval(completionTimer);
        completionTimer = null;
        void reportCompletion(current, false, "", "conversation-send-not-confirmed");
      }
    }, 250);
  }

  async function clickSend(completion) {
    const started = Date.now();
    let button = findSendButton();
    while ((!button || button.disabled || button.getAttribute("aria-disabled") === "true") && Date.now() - started < 9000) {
      await new Promise(resolve => setTimeout(resolve, 120));
      button = findSendButton();
    }
    if (!button || activeSourceUrl !== completion.sourceUrl) return { ok:false, error:"send-button-unavailable" };
    if (editorText() !== completion.sentText) return { ok:false, error:"prompt-changed-before-send" };
    if (completion.requestId) watchForSuccessfulSend(completion);
    bypassManualSendIntercept = true;
    try { button.click(); }
    catch (error) {
      if (completionTimer) clearInterval(completionTimer);
      completionTimer = null;
      pendingCompletion = null;
      return { ok:false, error:String(error?.message || error) };
    } finally { setTimeout(() => { bypassManualSendIntercept = false; }, 0); }
    return { ok:true, requestId:completion.requestId, providerId:provider.id };
  }

  async function submitFromKeepit(message = {}) {
    if (message.providerId !== provider.id || !panelActive || !activeSourceUrl) return { ok:false, error:"provider-panel-context-unavailable" };
    const linkRequestId = String(message.linkRequestId || "");
    const sourceUrl = safeSourceUrl(message.sourceUrl);
    if (!linkRequestId || sourceUrl !== activeSourceUrl) return { ok:false, error:"stale-provider-link-request" };
    const mode = String(message.linkMode || "");
    if (!["auto-send-link", "auto-send-followup"].includes(mode)) return { ok:false, error:"auto-send-not-authorized" };
    const expected = pendingLink?.requestId === linkRequestId && pendingLink.sourceUrl === sourceUrl ? pendingLink.expectedPrompt : "";
    const current = editorText();
    if (!expected || current !== expected) return { ok:false, error:"prompt-changed-before-auto-send" };
    return clickSend({ requestId:linkRequestId, sourceUrl, mode, sentText:current });
  }

  async function prepareAndSendManualPrompt(sourceUrl, originalPrompt) {
    let preparation;
    try {
      preparation = await globalThis.LHN_MESSAGING.sendMessage({
        type:"AI_PROVIDER_MANUAL_LINK_PREPARE",
        providerId:provider.id,
        sourceUrl
      });
    } catch (error) {
      console.warn("Keepit could not prepare the source URL for this send", error);
      return;
    }
    const requestId = String(preparation?.requestId || "");
    if (!preparation?.ok) {
      await rejectUnconfirmedManualSend(requestId, sourceUrl, preparation?.error || "manual-send-not-prepared");
      return;
    }
    if (!findSendButton()) {
      await rejectUnconfirmedManualSend(requestId, sourceUrl, "send-button-unavailable");
      return;
    }
    const editor = editorApi.findEditor();
    if (activeSourceUrl !== sourceUrl || !editor || editorApi.editorText(editor) !== originalPrompt) {
      await rejectUnconfirmedManualSend(requestId, sourceUrl, "prompt-changed-before-link");
      return;
    }
    if (!preparation.mapped && !requestId) return;
    const sentText = linkPrompt(preparation.websiteLabel || pendingLink?.websiteLabel || "Website", sourceUrl, originalPrompt);
    if (sentText !== originalPrompt && !editorApi.setEditorText(editor, sentText, true)) {
      await rejectUnconfirmedManualSend(requestId, sourceUrl, "source-link-editor-update-failed");
      return;
    }
    const stableEditor = await waitForEditorText(sentText);
    if (!stableEditor || activeSourceUrl !== sourceUrl) {
      await rejectUnconfirmedManualSend(requestId, sourceUrl, "source-link-editor-not-stable");
      return;
    }
    if (requestId) pendingLink = { providerId:provider.id, requestId, sourceUrl, mode:preparation.mode || pendingLink?.mode || "manual-link" };
    const result = await clickSend({ requestId, sourceUrl, mode:preparation.mode || "manual-link", sentText });
    if (!result?.ok) await rejectUnconfirmedManualSend(requestId, sourceUrl, result?.error || "manual-send-not-confirmed");
  }

  function interceptManualSend(event) {
    if (!panelActive || !activeSourceUrl || bypassManualSendIntercept) return;
    const editor = editorApi.findEditor();
    if (!isSendIntent(event, editor)) return;
    if (pendingCompletion && pendingLink?.requestId === pendingCompletion.requestId) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
      return;
    }
    if (manualSendIntercepting) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
      return;
    }
    const sourceUrl = safeSourceUrl(activeSourceUrl);
    const originalPrompt = editorApi.editorText(editor);
    if (!sourceUrl || !originalPrompt.trim()) return;
    manualSendIntercepting = true;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();
    void prepareAndSendManualPrompt(sourceUrl, originalPrompt)
      .catch(error => { console.warn("Keepit could not prepare this provider prompt", error); })
      .finally(() => { manualSendIntercepting = false; });
  }

  document.addEventListener("click", interceptManualSend, true);
  document.addEventListener("keydown", interceptManualSend, true);
  document.addEventListener("submit", interceptManualSend, true);

  const initialHash = new URLSearchParams(String(location.hash || "").replace(/^#/, ""));
  const initialSource = safeSourceUrl(initialHash.get("keepit-ai-source-url"));
  if (isFirefox && initialHash.get("keepit-ai-panel") === "1" && initialSource) {
    setPanelContext({ providerId:provider.id, sourceUrl:initialSource, active:false });
  }
  if (!isFirefox && window.parent !== window && window.parent === window.top) {
    try {
      const root = new URL(globalThis.browser.runtime.getURL("/"));
      const extensionOrigin = `${root.protocol}//${root.host}`;
      if (Array.from(location.ancestorOrigins || []).includes(extensionOrigin)) panelActive = true;
    } catch {}
  }

  globalThis.LHN_AI_PROVIDER_WORKFLOW = Object.freeze({
    providerId:provider.id,
    setPanelContext,
    setPendingLink,
    submitFromKeepit,
    currentConversationUrl,
    linkPrompt
  });
})();
