(() => {
  const PROMPT = "Hãy tóm tắt nội dung ngắn gọn";
  const MAX_PAGE_TEXT_LENGTH = 40000;
  const EXTENSION_UI_SELECTOR = [
    "#lhn-sidebar", "#lhn-sidebar-toast", "#lhn-sidebar-edge-toggle", "#lhn-panel", "#lhn-note-pop",
    "#lhn-selection-overlay", "#lhn-translate-icon", "#lhn-direct-translation", "#lhn-full-english-dictionary",
    "#keepit-host", "[data-lhn-ui]"
  ].join(",");
  const NON_CONTENT_SELECTOR = "script,style,noscript,template,svg,canvas,video,audio,iframe,form,button,input,select,textarea";

  function normalizeText(value) {
    return String(value || "")
      .replace(/\u00a0/g, " ")
      .replace(/\r\n?/g, "\n")
      .replace(/[\t ]+\n/g, "\n")
      .replace(/\n[\t ]+/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function create({ document, location, navigator = globalThis.navigator, getReadability = () => globalThis.Readability }) {
    function extractMainText() {
      const clone = document.cloneNode(true);
      if (!clone) return "";
      clone.querySelectorAll(`${EXTENSION_UI_SELECTOR},${NON_CONTENT_SELECTOR}`).forEach(node => node.remove());
      let text = "";
      const Readability = getReadability?.();
      if (typeof Readability === "function") {
        try { text = new Readability(clone).parse()?.textContent || ""; }
        catch { /* use the cleaned body as a fallback */ }
      }
      if (!text) {
        const body = clone.querySelector?.("body") || clone;
        body.querySelectorAll?.("nav,header,footer,aside,[hidden],[aria-hidden='true']").forEach(node => node.remove());
        text = body.innerText || body.textContent || "";
      }
      return normalizeText(text);
    }

    function buildPromptText() {
      const pageText = extractMainText();
      if (!pageText) throw new Error("no-page-text");
      const includedText = pageText.slice(0, MAX_PAGE_TEXT_LENGTH).replace(/[\uD800-\uDBFF]$/, "");
      const truncated = pageText.length > includedText.length;
      const title = normalizeText(document.title) || location.hostname || "";
      const url = String(location.href || "");
      const truncationNote = truncated ? "\n\n[Nội dung còn lại đã được lược bớt để giới hạn độ dài.]" : "";
      return {
        text: `${PROMPT}\n\nTiêu đề: ${title}\nURL: ${url}\n\nNội dung chính:\n${includedText}${truncationNote}`,
        truncated,
        sourceLength: pageText.length
      };
    }

    async function copyPromptToClipboard() {
      let payload;
      try { payload = buildPromptText(); }
      catch (error) { return { ok:false, error:error?.message || "no-page-text" }; }
      try {
        if (!navigator?.clipboard?.writeText) throw new Error("clipboard-api-unavailable");
        await navigator.clipboard.writeText(payload.text);
        return { ok:true, truncated:payload.truncated, length:payload.text.length };
      } catch (clipboardError) {
        try {
          const host = document.body || document.documentElement;
          if (!host || !document.execCommand) throw clipboardError;
          const textarea = document.createElement("textarea");
          textarea.value = payload.text;
          textarea.setAttribute("readonly", "");
          textarea.style.cssText = "position:fixed;left:-10000px;top:0;width:1px;height:1px;opacity:0;pointer-events:none";
          host.appendChild(textarea);
          let copied = false;
          try {
            textarea.select();
            copied = document.execCommand("copy");
          } finally {
            textarea.remove();
          }
          if (!copied) throw clipboardError;
          return { ok:true, truncated:payload.truncated, length:payload.text.length, fallback:true };
        } catch (fallbackError) {
          return { ok:false, error:fallbackError?.message || clipboardError?.message || "clipboard-write-failed" };
        }
      }
    }

    return Object.freeze({ extractMainText, buildPromptText, copyPromptToClipboard });
  }

  globalThis.LHN_CHATGPT_CONTEXT = Object.freeze({ create, PROMPT, MAX_PAGE_TEXT_LENGTH });
})();
