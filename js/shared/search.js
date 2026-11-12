// Module tìm kiếm dùng chung (script thường, không dùng export).
// Chuẩn hóa (bỏ dấu, chữ thường), tính chỉ mục một lần, debounce khi gõ (LHN_INDEX_SEARCH);
// xếp hạng trường tìm + tô chỗ khớp (LHN_SEARCH).
(() => {
  const normalize = (text) => String(text ?? "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/\s+/g, " ").trim();

  // Chỉ mục: tính chuỗi tìm kiếm một lần cho mỗi mục (getFields trả về các trường cần tìm)
  function createIndex(items, getFields, getKey = (item, i) => i) {
    return items.map((item, i) => ({
      key: getKey(item, i),
      item,
      text: normalize((getFields(item) || []).filter(Boolean).join(" ")),
    }));
  }

  // Trả về các mục khớp, giữ thứ tự gốc. Truy vấn rỗng = tất cả.
  function search(index, query) {
    const q = normalize(query);
    if (!q) return index.map((entry) => entry.item);
    return index.filter((entry) => entry.text.includes(q)).map((entry) => entry.item);
  }

  // Trì hoãn gọi fn cho tới khi không còn lần gọi mới trong ms mili-giây
  function debounce(fn, ms = 200) {
    let timer = 0;
    const wrapped = (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
    wrapped.cancel = () => clearTimeout(timer);
    return wrapped;
  }

  // Xếp hạng trường tìm và tô các chỗ khớp (gộp từ js/translate/search.js; Sidebar trang / Dashboard dùng qua LHN_SEARCH)
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

  globalThis.LHN_INDEX_SEARCH = Object.freeze({ normalize, createIndex, search, debounce });
  globalThis.LHN_SEARCH = Object.freeze({ rank, highlightMatches });
})();
