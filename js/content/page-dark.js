// Trang tối (v3.5.207) — chức năng "Trang tối" của Keepit for Android (app/src/main/assets/android/browser-ui.js) cho extension.
// Chỉ có tác dụng khi Chủ đề Keepit là tối. Một lớp phủ toàn màn hình đảo màu phần trang bên dưới (giữ sắc độ);
// ảnh/video được đảo lại nên giữ màu thật. Lớp phủ nằm dưới thanh Keepit, Ghi chú, popup và hộp thoại của Keepit nên
// chúng giữ màu riêng; trên trang chỉ ảnh/video có filter, nên header cố định của trang vẫn chạy đúng.
// Trang vốn đã tối thì để nguyên. Tắt khi overlay video mở (overlay có giao diện tối riêng).
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
  function pageIsLight() {
    const lum = el => { if (!el) return null; const m = getComputedStyle(el).backgroundColor.match(/[\d.]+/g); if (!m || (m.length > 3 && +m[3] === 0)) return null; return (0.299 * m[0] + 0.587 * m[1] + 0.114 * m[2]) / 255; };
    const v = lum(document.body) ?? lum(document.documentElement);
    return v === null ? true : v > 0.5;
  }
  function remove() { darkStyle?.remove(); darkVeil?.remove(); }
  function apply() {
    if (!loaded || isApk() || !/^https?:$/.test(location.protocol) || !document.body) return;
    // Đã làm tối thì giữ (lúc đó nền trang nhìn như tối); chưa thì chỉ làm tối khi trang đang sáng.
    const want = on && isDark() && (darkStyle?.isConnected || pageIsLight());
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
  new MutationObserver(apply).observe(document.documentElement, { attributes:true, attributeFilter:["class"] });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", apply, { once:true });
  addEventListener("load", apply, { once:true });
  globalThis.LHN_PAGE_DARK = Object.freeze({
    pageDark:() => on,
    togglePageDark() { on = !on; browser.storage.local.set({ [KEY]: on }).catch(() => {}); apply(); return on; }
  });
})();
