/* Finds saved annotation text in a page that may have changed since it was saved. */
globalThis.LHN_ANNOTATION_RESTORE = (() => {
  function create({ document, excludedSelector }) {
    function isRestorableTextNode(node) {
      return !!node?.nodeValue && !!node.nodeValue.trim() && !node.parentElement?.closest(excludedSelector);
    }
    function normalizeWithMap(value) {
      const source = String(value || "");
      let text = "";
      const startMap = [], endMap = [];
      let i = 0;
      while (i < source.length) {
        if (/\s/.test(source[i])) {
          const runStart = i;
          while (i < source.length && /\s/.test(source[i])) i++;
          if (text.length && i < source.length) { text += " "; startMap.push(runStart); endMap.push(i); }
          continue;
        }
        text += source[i]; startMap.push(i); endMap.push(i + 1); i++;
      }
      return { text, startMap, endMap };
    }
    function findQuoteRange(item) {
      if (!document.body || !item?.quote) return null;
      const quote = normalizeWithMap(item.quote).text;
      if (!quote) return null;
      const prefix = normalizeWithMap(item.prefix || "").text, suffix = normalizeWithMap(item.suffix || "").text;
      let best = null, bestScore = -1;
      function scanRun(raw, nodes) {
        if (!raw || !nodes.length) return;
        const normalized = normalizeWithMap(raw);
        let from = 0, idx;
        while ((idx = normalized.text.indexOf(quote, from)) !== -1) {
          const before = normalized.text.slice(Math.max(0, idx - prefix.length), idx), after = normalized.text.slice(idx + quote.length, idx + quote.length + suffix.length);
          let score = 0;
          if (prefix && before.endsWith(prefix)) score += 2;
          if (suffix && after.startsWith(suffix)) score += 2;
          const rawStart = normalized.startMap[idx], rawEnd = normalized.endMap[idx + quote.length - 1];
          const first = nodes.find(node => rawStart >= node.start && rawStart < node.end), last = nodes.find(node => rawEnd > node.start && rawEnd <= node.end);
          if (first && last) {
            const range = document.createRange();
            range.setStart(first.node, rawStart - first.start); range.setEnd(last.node, rawEnd - last.start);
            if (score > bestScore) { best = range; bestScore = score; }
          }
          from = idx + 1;
        }
      }
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode:node => isRestorableTextNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT });
      let node;
      while ((node = walker.nextNode())) {
        if (!normalizeWithMap(node.nodeValue).text.includes(quote)) continue;
        scanRun(node.nodeValue, [{ node, start:0, end:node.nodeValue.length }]);
      }
      const blockSelector = "p,li,dd,dt,blockquote,figcaption,h1,h2,h3,h4,h5,h6,td,th,article,section,div";
      const blockTags = new Set(["P","LI","DD","DT","BLOCKQUOTE","FIGCAPTION","H1","H2","H3","H4","H5","H6","TD","TH","ARTICLE","SECTION","DIV"]);
      for (const block of document.body.querySelectorAll(blockSelector)) {
        if (block.closest(excludedSelector) || block.querySelector(blockSelector)) continue;
        let runNodes = [], raw = "";
        const runs = [];
        const flush = () => { if (raw && runNodes.length) runs.push({ raw, nodes:runNodes }); runNodes = []; raw = ""; };
        const walkInline = current => {
          if (current.nodeType === Node.TEXT_NODE) {
            if (!current.nodeValue || current.parentElement?.closest(excludedSelector)) { flush(); return; }
            const value = current.nodeValue; runNodes.push({ node:current, start:raw.length, end:raw.length + value.length }); raw += value; return;
          }
          if (current.nodeType !== Node.ELEMENT_NODE && current.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return;
          if (current.nodeType === Node.ELEMENT_NODE && current.matches(excludedSelector)) { flush(); return; }
          const nestedBlock = current !== block && current.nodeType === Node.ELEMENT_NODE && blockTags.has(current.tagName);
          if (nestedBlock) flush();
          for (const child of current.childNodes) walkInline(child);
          if (nestedBlock) flush();
        };
        walkInline(block); flush();
        for (const run of runs) if (normalizeWithMap(run.raw).text.includes(quote)) scanRun(run.raw, run.nodes);
      }
      {
        const nodes = []; let raw = "", previousBlock = null;
        const blockSelectorForStream = "p,li,dd,dt,blockquote,figcaption,h1,h2,h3,h4,h5,h6,td,th,article,section,div,pre";
        const streamWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode:current => current.parentElement?.closest(excludedSelector) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
        let current;
        while ((current = streamWalker.nextNode())) {
          if (!current.nodeValue) continue;
          const block = current.parentElement?.closest(blockSelectorForStream) || document.body;
          if (previousBlock && block !== previousBlock && raw && !/\s$/.test(raw)) raw += "\n";
          const start = raw.length; raw += current.nodeValue; nodes.push({ node:current, start, end:raw.length }); previousBlock = block;
        }
        if (normalizeWithMap(raw).text.includes(quote)) scanRun(raw, nodes);
      }
      {
        const nodes = []; let raw = "";
        const streamWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode:current => current.parentElement?.closest(excludedSelector) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
        let current;
        while ((current = streamWalker.nextNode())) {
          if (!current.nodeValue) continue;
          const start = raw.length; raw += current.nodeValue; nodes.push({ node:current, start, end:raw.length });
        }
        if (normalizeWithMap(raw).text.includes(quote)) scanRun(raw, nodes);
      }
      return best;
    }
    return Object.freeze({ isRestorableTextNode, findQuoteRange });
  }
  return Object.freeze({ create });
})();
