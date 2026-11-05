(() => {
  "use strict";

  function formatLinkPrompt(websiteLabel, sourceUrl, instruction) {
    const lines = [
      `• ${String(websiteLabel || "Website")}: ${String(sourceUrl || "")}`,
      `• ${String(instruction || "")}`
    ];
    return lines.join("\n");
  }

  function insertMultilineComposerText(composer, text, replaceExisting = false) {
    if (!composer?.isContentEditable || !String(text).includes("\n")) return false;
    const doc = composer.ownerDocument || document;
    if (replaceExisting) {
      try {
        const selection = doc.defaultView?.getSelection?.();
        const range = doc.createRange();
        range.selectNodeContents(composer);
        selection?.removeAllRanges();
        selection?.addRange(range);
      } catch { /* replaceChildren below still replaces the complete prompt */ }
    }
    const fragment = doc.createDocumentFragment();
    String(text).split(/\r?\n/).forEach((line, index) => {
      if (index) fragment.append(doc.createElement("br"));
      fragment.append(doc.createTextNode(line));
    });
    composer.replaceChildren(fragment);
    const InputEventCtor = doc.defaultView?.InputEvent || globalThis.InputEvent;
    if (InputEventCtor) {
      composer.dispatchEvent(new InputEventCtor("input", { bubbles:true, inputType:"insertText", data:String(text) }));
    } else {
      composer.dispatchEvent(new Event("input", { bubbles:true }));
    }
    return true;
  }

  globalThis.LHN_AI_PROMPT_FORMAT = Object.freeze({
    formatLinkPrompt,
    insertMultilineComposerText
  });
})();
