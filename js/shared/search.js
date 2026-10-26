// Module tìm kiếm dùng chung (script thường, không dùng export).
// Chuẩn hóa (bỏ dấu, chữ thường), tính chỉ mục một lần, debounce khi gõ.
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

  globalThis.LHN_SEARCH = Object.freeze({ normalize, createIndex, search, debounce });
})();
