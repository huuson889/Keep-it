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

  // Khóa ẩn (không hiển thị trong UI): bật/tắt làm nổi bật và điều hướng ↑/↓ trong danh sách xổ xuống
  const features = { highlight: true, arrowKeys: true };

  // ↑/↓ chọn mục trong danh sách xổ xuống có ô tìm, Enter để chọn (ô tìm phải có danh sách .language-option)
  function attachListKeyboard(input, list, choose) {
    let index = -1;
    input.addEventListener("keydown", (event) => {
      if (!features.arrowKeys || !["ArrowDown", "ArrowUp", "Enter"].includes(event.key)) return;
      const items = Array.from(list.querySelectorAll(".language-option"));
      if (!items.length) return;
      if (event.key === "Enter") {
        if (index < 0) return;
        event.preventDefault(); choose(items[index]); index = -1; return;
      }
      event.preventDefault();
      index = Math.max(0, Math.min(items.length - 1, index + (event.key === "ArrowDown" ? 1 : -1)));
      items.forEach((el, i) => el.classList.toggle("lhn-kb-active", i === index));
      items[index].scrollIntoView({ block: "nearest" });
    });
    input.addEventListener("input", () => { index = -1; });
  }

  globalThis.LHN_INDEX_SEARCH = Object.freeze({ normalize, createIndex, search, debounce, features, attachListKeyboard });
})();
