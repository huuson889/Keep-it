// Trang tối (v3.5.207) — chức năng "Trang tối" của Keepit for Android (app/src/main/assets/android/browser-ui.js) cho extension.
// Chỉ có tác dụng khi Chủ đề Keepit là tối. Một lớp phủ toàn màn hình đảo màu phần trang bên dưới (giữ sắc độ);
// ảnh/video được đảo lại nên giữ màu thật. Lớp phủ nằm dưới thanh Keepit, Ghi chú, popup và hộp thoại của Keepit nên
// chúng giữ màu riêng; trên trang chỉ ảnh/video có filter, nên header cố định của trang vẫn chạy đúng.
// Trang đang tự hiện giao diện tối thì để nguyên (v3.5.209: lấy mẫu nền thật trên màn hình, theo dõi khi trang tự đổi). Tắt khi overlay video mở.
// Bật/tắt: ☰ → Giao diện → Trang tối (js/content/keepit-bar.js). Lưu: storage.local `lhnPageDark` (mặc định tắt).
// Trong APK (LHN_PLATFORM = "android") app tự làm việc này, file này không làm gì.
(() => {
  if (window.top !== window || globalThis.LHN_PAGE_DARK) return;
  const KEY = "lhnPageDark", SETTINGS_KEY = "lhnSettings";
  const DARK_Q = matchMedia("(prefers-color-scheme: dark)");
  const DARK_CSS = `img,video,picture,canvas,iframe,embed,object,svg image,[style*="background-image"]{filter:invert(1) hue-rotate(180deg)!important}`;
  let on = false, theme = "", darkStyle = null, darkVeil = null, loaded = false;
  // Chủ đề Keepit đọc giống thanh Keepit (settings đã qua LHN_SETTINGS.resolve).
  const themeOf = raw => String((globalThis.LHN_SETTINGS?.resolve?.(raw) || raw || {}).sidebarTheme || "");
  const isApk = () => globalThis.LHN_PLATFORM === "android";
  const isDark = () => theme === "dark" || (theme !== "light" && DARK_Q.matches);
  const overlayOpen = () => document.documentElement.classList.contains("lhn-video-overlay-open");
  // v3.5.209: trang đang tự hiện giao diện tối thì bỏ qua. Không chỉ xem nền body/html (nhiều trang tối để body trong suốt
  // và tô nền ở khung bên trong) mà lấy mẫu nền THẬT ở 9 điểm trên màn hình, đi ngược lên cha tới nền đặc đầu tiên.
  // Đọc từ CSS (getComputedStyle) nên lớp phủ của Keepit không làm sai kết quả.
  const lumOf = color => { const m = String(color).match(/[\d.]+/g); if (!m || m.length < 3 || (m.length > 3 && +m[3] < 0.5)) return null; return (0.299 * m[0] + 0.587 * m[1] + 0.114 * m[2]) / 255; };
  const KEEPIT = '[id^="lhn-"],[id^="keepit-"],[id^="yt-keepit"],[class^="lhn-"]';
  function canvasLum() {
    // Không phần tử nào có nền: màu nền mặc định của trình duyệt — tối nếu trang khai báo chỉ dùng giao diện tối.
    const cs = String(getComputedStyle(document.documentElement).colorScheme || "");
    return /\bdark\b/.test(cs) && !/\blight\b/.test(cs) ? 0.1 : 1;
  }
  function bgLumAt(el) {
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) { const v = lumOf(getComputedStyle(n).backgroundColor); if (v !== null) return v; }
    // html không có nền thì nền body phủ cả màn hình (kể cả phần dưới body ngắn).
    return (document.body && lumOf(getComputedStyle(document.body).backgroundColor)) ?? canvasLum();
  }
  function pageIsDark() {
    const vals = [];
    for (const fy of [0.2, 0.45, 0.7]) for (const fx of [0.2, 0.5, 0.8]) {
      const el = document.elementsFromPoint(innerWidth * fx, innerHeight * fy).find(e => !e.closest(KEEPIT));
      if (el) vals.push(bgLumAt(el));
    }
    if (!vals.length) { const b = lumOf(getComputedStyle(document.body).backgroundColor) ?? lumOf(getComputedStyle(document.documentElement).backgroundColor); vals.push(b ?? canvasLum()); }
    vals.sort((a, b) => a - b);
    return vals[Math.floor(vals.length / 2)] < 0.45; // trung vị: đa số màn hình là nền tối
  }
  function remove() { darkStyle?.remove(); darkVeil?.remove(); }
  function apply() {
    if (!loaded || isApk() || !/^https?:$/.test(location.protocol) || !document.body) return;
    const want = on && isDark() && !pageIsDark();
    if (want && !darkStyle?.isConnected) {
      darkStyle = document.createElement("style"); darkStyle.id = "keepit-page-dark"; darkStyle.textContent = DARK_CSS; (document.head || document.documentElement).appendChild(darkStyle);
      darkVeil = document.createElement("div"); darkVeil.id = "keepit-page-dark-veil";
      darkVeil.setAttribute("style", "all:initial;position:fixed;inset:0;z-index:2147482000;pointer-events:none;-webkit-backdrop-filter:invert(1) hue-rotate(180deg);backdrop-filter:invert(1) hue-rotate(180deg);");
      document.documentElement.appendChild(darkVeil);
    } else if (!want && darkStyle?.isConnected) remove();
    else if (want && darkVeil && !darkVeil.isConnected) document.documentElement.appendChild(darkVeil);
    // Overlay video phủ kín trang và có giao diện tối riêng: tạm ẩn lớp phủ khi overlay mở.
    if (darkVeil) darkVeil.style.setProperty("display", overlayOpen() ? "none" : "block");
  }
  browser.storage.local.get([KEY, SETTINGS_KEY]).then(got => {
    on = got[KEY] === true; theme = themeOf(got[SETTINGS_KEY]); loaded = true; apply();
  }).catch(() => {});
  browser.storage.onChanged.addListener((ch, area) => {
    if (area !== "local") return;
    if (ch[KEY]) on = ch[KEY].newValue === true;
    if (ch[SETTINGS_KEY]) theme = themeOf(ch[SETTINGS_KEY].newValue);
    if (ch[KEY] || ch[SETTINGS_KEY]) apply();
  });
  DARK_Q.addEventListener?.("change", apply);
  // Trang tự đổi sáng/tối (class, data-theme, style, color-scheme) hoặc dựng xong muộn: kiểm tra lại (gộp trong 150ms).
  let recheckT = 0;
  const recheck = () => { clearTimeout(recheckT); recheckT = setTimeout(apply, 150); };
  const THEME_ATTRS = ["class", "style", "data-theme", "data-color-mode", "data-bs-theme", "data-mode", "dark", "theme"];
  const watchBody = () => { if (document.body) new MutationObserver(recheck).observe(document.body, { attributes:true, attributeFilter:THEME_ATTRS }); };
  new MutationObserver(recheck).observe(document.documentElement, { attributes:true, attributeFilter:THEME_ATTRS });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => { watchBody(); apply(); }, { once:true }); else watchBody();
  addEventListener("load", () => { apply(); setTimeout(apply, 1000); setTimeout(apply, 3000); }, { once:true });
  globalThis.LHN_PAGE_DARK = Object.freeze({
    pageDark:() => on,
    togglePageDark() { on = !on; browser.storage.local.set({ [KEY]: on }).catch(() => {}); apply(); return on; }
  });
})();
