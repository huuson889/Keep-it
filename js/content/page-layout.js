(() => {
  let pageLayoutSnapshot = null;
  function getInlineStyle(el, prop) {
    return { value: el.style.getPropertyValue(prop), priority: el.style.getPropertyPriority(prop) };
  }
  function restoreInlineStyle(el, prop, saved) {
    if (!saved || !el) return;
    if (saved.value) el.style.setProperty(prop, saved.value, saved.priority);
    else el.style.removeProperty(prop);
  }
  // v3.5.205: trang trượt mượt như demo notes-sheet v2 — trượt giữa bề rộng/lề THẬT (px) của trang và chỗ chừa cho Ghi chú,
  // cùng 0,26s và cùng đường cong với Ghi chú. Đóng xong trang đã đúng y như gốc, nên trả kiểu gốc về không còn nhảy.
  let pageRestoreTimer = 0;
  const EASE = ".26s cubic-bezier(.2,.8,.2,1)";
  const PAGE_EASE = ["width", "max-width", "margin-left", "margin-right"].map(prop => `${prop} ${EASE}`).join(",");
  const ROOT_PROPS = ["width", "max-width", "box-sizing", "margin-left", "margin-right", "overflow-x"];
  const BODY_PROPS = ["width", "min-width", "max-width", "box-sizing", "margin-left", "margin-right", "overflow-x", "transition"];
  const important = (el, prop, value) => el.style.setProperty(prop, value, "important");
  function takeSnapshot(root, body) {
    const snap = { root: {}, body: {} };
    ROOT_PROPS.forEach(prop => { snap.root[prop] = getInlineStyle(root, prop); });
    if (body) BODY_PROPS.forEach(prop => { snap.body[prop] = getInlineStyle(body, prop); });
    return snap;
  }
  function restoreSnapshot(snap) {
    ROOT_PROPS.forEach(prop => restoreInlineStyle(document.documentElement, prop, snap.root[prop]));
    if (document.body) BODY_PROPS.forEach(prop => restoreInlineStyle(document.body, prop, snap.body[prop]));
  }
  // Bề rộng (khung viền) và lề thật của body khi trang ở trạng thái gốc.
  function measureNatural(body) {
    const cs = getComputedStyle(body);
    return { width: body.getBoundingClientRect().width, left: parseFloat(cs.marginLeft) || 0, right: parseFloat(cs.marginRight) || 0 };
  }
  // Kiểu cố định khi Ghi chú mở (html giữ đủ rộng để Ghi chú không bị cắt; chỉ thu hẹp body).
  function applyFrame(root, body) {
    important(root, "box-sizing", "border-box"); important(root, "width", "100%"); important(root, "max-width", "100%");
    important(root, "margin-left", "0"); important(root, "margin-right", "0"); important(root, "overflow-x", "visible");
    important(body, "box-sizing", "border-box"); important(body, "min-width", "0"); important(body, "overflow-x", "hidden");
  }
  function setBox(body, width, left, right) {
    important(body, "width", width); important(body, "max-width", width);
    important(body, "margin-left", left); important(body, "margin-right", right);
  }
  function applyPageShrink(width) {
    // Touch devices show the sidebar as a bottom sheet over the page (css/content/notes.css), so the page keeps its width.
    if (globalThis.matchMedia?.("(pointer: coarse) and (hover: none)").matches) return;
    const root = document.documentElement, body = document.body;
    clearTimeout(pageRestoreTimer); pageRestoreTimer = 0;
    const target = `calc(100vw - ${width}px * var(--keepit-uiz,1))`;   // v3.5.221: the sidebar keeps its size at any page zoom
    if (!pageLayoutSnapshot) {
      pageLayoutSnapshot = takeSnapshot(root, body);
      if (body) {
        // Bắt đầu đúng từ chỗ trang đang đứng (không nhảy khung đầu) rồi thu dần về chỗ chừa cho Ghi chú.
        const from = measureNatural(body);
        applyFrame(root, body); important(body, "transition", "none");
        setBox(body, `${from.width}px`, `${from.left}px`, `${from.right}px`);
        void body.offsetWidth;
      }
    }
    if (!body) return;
    applyFrame(root, body);
    important(body, "transition", PAGE_EASE);
    setBox(body, target, "0", "0");
  }
  // Trả trang: trượt về đúng bề rộng/lề gốc rồi mới trả kiểu gốc (lúc đó không còn gì thay đổi trên màn hình).
  function restorePageWidth() {
    if (!pageLayoutSnapshot || pageRestoreTimer) return;
    const body = document.body;
    if (!body) { restorePageNow(); return; }
    const current = body.getBoundingClientRect().width;
    restoreSnapshot(pageLayoutSnapshot);
    const to = measureNatural(body);
    const root = document.documentElement;
    applyFrame(root, body); important(body, "transition", "none");
    setBox(body, `${current}px`, "0", "0");
    void body.offsetWidth;
    important(body, "transition", PAGE_EASE);
    setBox(body, `${to.width}px`, `${to.left}px`, `${to.right}px`);
    pageRestoreTimer = setTimeout(() => { pageRestoreTimer = 0; restorePageNow(); }, 280);
  }
  function restorePageNow() {
    if (!pageLayoutSnapshot) return;
    const snap = pageLayoutSnapshot; pageLayoutSnapshot = null;
    restoreSnapshot(snap);
  }
  globalThis.LHN_PAGE_LAYOUT = Object.freeze({ applyPageShrink, restorePageWidth });
})();
