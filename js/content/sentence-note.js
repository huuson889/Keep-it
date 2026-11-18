(() => {  function getContext(range, cleanText) {

    if (!range) return "";
    const node = range.startContainer.nodeType === Node.ELEMENT_NODE ? range.startContainer : range.startContainer.parentElement;
    const block = node?.closest("p,li,blockquote,figcaption,dd,dt,h1,h2,h3,h4,h5,h6,article,section,div") || node;
    if (!block) return "";
    const isTranslationElement = element => element?.nodeType === Node.ELEMENT_NODE &&
      (Array.from(element.classList || []).some(className => className.startsWith("immersive-translate-target-translation-")) ||
        element.classList.contains("lhn-bilingual-card") || element.classList.contains("lhn-bilingual-speaker"));
    let text = block.textContent || "", start, end;
    if (isTranslationElement(block) || block.querySelector?.('[class*="immersive-translate-target-translation-"], .lhn-bilingual-card, .lhn-bilingual-speaker')) {
      let filteredText = "";
      const offsets = [[range.startContainer, "start", range.startOffset], [range.endContainer, "end", range.endOffset]];
      const marks = new Set();
      const visit = current => {
        if (isTranslationElement(current)) return;
        if (current.nodeType === Node.TEXT_NODE) {
          for (const [container, key, offset] of offsets) if (container === current && !marks.has(key)) {
            if (key === "start") start = filteredText.length + Math.min(offset, current.textContent.length);
            else end = filteredText.length + Math.min(offset, current.textContent.length);
            marks.add(key);
          }
          filteredText += current.textContent || "";
          return;
        }
        const children = current.childNodes || [];
        for (let index = 0; index <= children.length; index++) {
          for (const [container, key, offset] of offsets) if (container === current && offset === index && !marks.has(key)) {
            if (key === "start") start = filteredText.length;
            else end = filteredText.length;
            marks.add(key);
          }
          if (index < children.length) visit(children[index]);
        }
      };
      visit(block);
      if (!marks.has("start") || !marks.has("end")) return "";
      text = filteredText;
    } else {
      const before = document.createRange(), after = document.createRange();
      try {
        before.selectNodeContents(block); before.setEnd(range.startContainer, range.startOffset); start = before.toString().length;
        after.selectNodeContents(block); after.setStart(range.endContainer, range.endOffset); end = text.length - after.toString().length;
      } catch { return ""; }
    }
    const isTerminal = index => {
      if (!".!?。？！؟".includes(text[index])) return false;
      let next = index + 1;
      while (next < text.length && /[\"'”’»）)\]}]/.test(text[next])) next++;
      if (text[next] === "\\") next++;
      return next === text.length || /\s/.test(text[next]) || "([{（「『".includes(text[next] || " ");
    };
    let sentenceStart = 0;
    for (let i = 0; i < start; i++) if (isTerminal(i)) sentenceStart = i + 1;
    let sentenceEnd = text.length;
    for (let i = Math.max(start, end - 1); i < text.length; i++) if (isTerminal(i)) { sentenceEnd = i + 1; break; }
    return cleanText(text.slice(sentenceStart, sentenceEnd));
  }
  globalThis.LHN_SENTENCE_NOTE = Object.freeze({ getContext });
})();
