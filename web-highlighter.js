/* Isolated DOM highlighter used by the page content controller. */
globalThis.LHNWebHighlighter = (() => {
  function create({ config, attachMarkEvents, restoreExcludedSelector }) {
    let previewSegments = null;
    const translationMutationShields = new WeakMap();
    const withTranslationMutationShield = (target, mutate) => {
      if (!target || target.nodeType !== Node.ELEMENT_NODE) { mutate(); return; }
      let shield = translationMutationShields.get(target);
      if (!shield) {
        shield = {
          hadNotranslate: target.classList.contains("notranslate"),
          translate: target.getAttribute("translate"),
          timer: 0
        };
        translationMutationShields.set(target, shield);
      } else if (shield.timer) clearTimeout(shield.timer);
      // Immersive Translate filters the mutation target (the text's parent), not the
      // inserted <mark>. Shield that exact target while its child list is changing.
      target.classList.add("notranslate");
      target.setAttribute("translate", "no");
      try { mutate(); }
      finally {
        shield.timer = setTimeout(() => {
          if (!shield.hadNotranslate) target.classList.remove("notranslate");
          if (shield.translate === null) target.removeAttribute("translate");
          else target.setAttribute("translate", shield.translate);
          translationMutationShields.delete(target);
        }, 500);
      }
    };
    const isWhiteTextColor = color => {
      const body = String(color).match(/rgba?\(([^)]+)\)/i)?.[1];
      if (!body) return false;
      const values = body.trim().split(/[,/\s]+/).filter(Boolean).map(Number);
      return values.length >= 3 && values[0] >= 230 && values[1] >= 230 && values[2] >= 230 && (values.length < 4 || values[3] >= 0.7);
    };
    const isWhiteTextElement = element => {
      const style = getComputedStyle(element || document.documentElement);
      return isWhiteTextColor(style.color) || isWhiteTextColor(style.webkitTextFillColor);
    };
    const collectSegments = range => {
      const segments = [];
      const root = range.commonAncestorContainer.nodeType === Node.TEXT_NODE ? range.commonAncestorContainer.parentNode : range.commonAncestorContainer;
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode: node => node.parentElement?.closest(restoreExcludedSelector) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
      });
      if (range.startContainer.nodeType === Node.TEXT_NODE && range.startContainer === range.endContainer) {
        segments.push({ node: range.startContainer, start: range.startOffset, end: range.endOffset });
      } else {
        let node;
        while ((node = walker.nextNode())) {
          try { if (!range.intersectsNode(node)) continue; } catch { continue; }
          const start = node === range.startContainer ? range.startOffset : 0;
          const end = node === range.endContainer ? range.endOffset : node.nodeValue.length;
          if (end > start) segments.push({ node, start, end });
        }
      }
      return segments;
    };
    function clearPreview() {
      for (const preview of previewSegments || []) if (preview.element.isConnected) {
        withTranslationMutationShield(preview.element.parentElement, () => preview.element.replaceWith(...preview.element.childNodes));
      }
      previewSegments = null;
      window.getSelection()?.removeAllRanges();
    }
    function drawPreview(range, color) {
      if (previewSegments?.some(preview => preview.element.isConnected)) return;
      clearPreview();
      if (!range) return;
      const segments = collectSegments(range);
      previewSegments = [];
      for (let i = segments.length - 1; i >= 0; i--) {
        const { node, start, end } = segments[i];
        if (!node.isConnected || end <= start || end > node.nodeValue.length) continue;
        try {
          const textStyle = getComputedStyle(node.parentElement || document.documentElement);
          const whiteText = isWhiteTextColor(textStyle.color) || isWhiteTextColor(textStyle.webkitTextFillColor);
          const part = document.createRange(); part.setStart(node, start); part.setEnd(node, end);
          const preview = document.createElement("mark"); preview.className = "lhn-selection-preview-mark notranslate"; preview.setAttribute("translate", "no");
          preview.style.setProperty("background-color", config.HIGHLIGHT_COLORS[config.normalizeColor(color)], "important");
          preview.style.setProperty("color", whiteText ? "#000" : textStyle.color, "important");
          preview.style.setProperty("border-radius", segments.length > 1 ? "0" : "2px");
          preview.style.setProperty("box-decoration-break", "clone");
          if (whiteText) preview.style.setProperty("-webkit-text-fill-color", "#000", "important");
          else if (textStyle.webkitTextFillColor && textStyle.webkitTextFillColor !== "currentcolor") preview.style.setProperty("-webkit-text-fill-color", textStyle.webkitTextFillColor, "important");
          withTranslationMutationShield(node.parentElement, () => {
            preview.appendChild(part.extractContents()); part.insertNode(preview);
          });
          previewSegments.push({ element: preview, whiteText });
        } catch (error) { console.warn("Highlight Notes: could not preview selected text", error); }
      }
      window.getSelection()?.removeAllRanges();
    }
    function updatePreviewColor(color) {
      for (const preview of previewSegments || []) preview.element.style.setProperty("background-color", config.HIGHLIGHT_COLORS[config.normalizeColor(color)], "important");
    }
    function commitPreview(item) {
      const previews = previewSegments || [];
      previewSegments = null;
      const color = config.normalizeColor(item.color);
      const fragmented = previews.length > 1;
      previews.forEach((preview, index) => {
        const source = preview.element;
        if (!source.isConnected) return;
        const mark = document.createElement("mark");
        withTranslationMutationShield(source.parentElement, () => {
          mark.append(...source.childNodes);
          source.replaceWith(mark);
        });
        mark.className = `lhn-mark lhn-${color} notranslate${preview.whiteText ? " lhn-black-text" : ""}${fragmented ? " lhn-fragmented" : ""}`; mark.setAttribute("translate", "no");
        mark.dataset.lhnId = item.id;
        mark.dataset.lhnParts = String(previews.length);
        mark.dataset.lhnPart = String(index);
        mark.setAttribute("data-lhn-note", item.note || "");
        if (preview.whiteText) {
          mark.style.setProperty("color", "#000", "important");
          mark.style.setProperty("-webkit-text-fill-color", "#000", "important");
        }
        attachMarkEvents(mark, item.id);
      });
    }
    function setMarkColor(id, color) {
      if (!id) return;
      const normalized = config.normalizeColor(color);
      document.querySelectorAll(`[data-lhn-id="${CSS.escape(id)}"]`).forEach(mark => {
        config.COLORS.forEach(existingColor => mark.classList.remove(`lhn-${existingColor}`));
        mark.classList.add(`lhn-${normalized}`);
      });
    }
    function ensureTextReadable(mark) {
      if (!mark || !isWhiteTextElement(mark)) return;
      mark.classList.add("lhn-black-text");
      mark.style.setProperty("color", "#000", "important");
      mark.style.setProperty("-webkit-text-fill-color", "#000", "important");
    }
    function wrapRange(range, item) {
      try {
        if (!range || range.collapsed || !range.startContainer.isConnected || range.commonAncestorContainer.ownerDocument !== document) return false;
        const segments = collectSegments(range);
        if (!segments.length) return false;
        let wrappedCount = 0;
        const expectedParts = segments.length;
        for (let i = segments.length - 1; i >= 0; i--) {
          const { node, start, end } = segments[i];
          if (!node.isConnected || end <= start || end > node.nodeValue.length) continue;
          try {
            const whiteText = isWhiteTextElement(node.parentElement || document.documentElement);
            const part = document.createRange(); part.setStart(node, start); part.setEnd(node, end);
            const mark = document.createElement("mark"); mark.className = `lhn-mark lhn-${config.normalizeColor(item.color)} notranslate${expectedParts > 1 ? " lhn-fragmented" : ""}`; mark.setAttribute("translate", "no"); mark.dataset.lhnId = item.id; mark.dataset.lhnParts = String(expectedParts); mark.dataset.lhnPart = String(i); mark.setAttribute("data-lhn-note", item.note || "");
            if (whiteText) { mark.classList.add("lhn-black-text"); mark.style.setProperty("color", "#000", "important"); mark.style.setProperty("-webkit-text-fill-color", "#000", "important"); }
            withTranslationMutationShield(node.parentElement, () => {
              mark.appendChild(part.extractContents()); part.insertNode(mark);
            });
            attachMarkEvents(mark, item.id); wrappedCount++;
          } catch (error) { console.warn("Highlight Notes: could not wrap one text fragment", error); }
        }
        return wrappedCount === expectedParts;
      } catch (error) { console.warn("Highlight Notes: could not wrap selected text", error); return false; }
    }
    return Object.freeze({ clearPreview, drawPreview, updatePreviewColor, hasPreview: () => !!previewSegments?.length, commitPreview, setMarkColor, ensureTextReadable, wrapRange });
  }
  return Object.freeze({ create });
})();
