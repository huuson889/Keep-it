(() => {
  function rank(searchFields, query) {
    const normalizedQuery = String(query || "").toLocaleLowerCase();
    if (!normalizedQuery) return 0;
    const fields = Array.isArray(searchFields) ? searchFields : [];
    const index = fields.findIndex(value => String(value || "").includes(normalizedQuery));
    return index < 0 ? Number.MAX_SAFE_INTEGER : index;
  }

  function highlightMatches(root, query, excludedSelector = ".lhn-search-match") {
    const needle = String(query || "").trim();
    if (!root || !needle) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), nodes = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (excludedSelector && node.parentElement?.closest(excludedSelector)) continue;
      if (node.nodeValue.toLocaleLowerCase().includes(needle.toLocaleLowerCase())) nodes.push(node);
    }
    for (const node of nodes) {
      const text = node.nodeValue, lower = text.toLocaleLowerCase(), search = needle.toLocaleLowerCase();
      const fragment = document.createDocumentFragment(); let from = 0, at;
      while ((at = lower.indexOf(search, from)) !== -1) {
        if (at > from) fragment.appendChild(document.createTextNode(text.slice(from, at)));
        const mark = document.createElement("mark"); mark.className = "lhn-search-match"; mark.textContent = text.slice(at, at + needle.length); fragment.appendChild(mark);
        from = at + needle.length;
      }
      if (from === 0) continue;
      if (from < text.length) fragment.appendChild(document.createTextNode(text.slice(from)));
      node.replaceWith(fragment);
    }
  }

  globalThis.LHN_SEARCH = Object.freeze({ rank, highlightMatches });
})();