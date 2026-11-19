/* Trang pháp lý: sáng/tối theo ĐÚNG cài đặt của app (settings.sidebarTheme),
   "system" thì theo cài đặt hệ điều hành — giống dashboard.
   Đổi giao diện ở app trong lúc tab này đang mở thì trang đổi theo luôn. */
(() => {
  const DARK_QUERY = globalThis.matchMedia?.("(prefers-color-scheme: dark)");
  let theme = "system";

  function apply() {
    const dark = theme === "dark" || (theme !== "light" && !!DARK_QUERY?.matches);
    const root = document.documentElement;
    root.dataset.theme = dark ? "dark" : "light";
    root.style.colorScheme = dark ? "dark" : "light";
  }

  const normalise = value => (["light", "dark", "system"].includes(value) ? value : "system");

  apply();                                   // vẽ ngay theo hệ điều hành, không chờ storage

  (async () => {
    try {
      const settings = await globalThis.LHN_SETTINGS?.get?.();
      if (settings) theme = normalise(settings.sidebarTheme);
    } catch { /* storage không có → giữ "system" */ }
    apply();
  })();

  try {
    globalThis.LHN_SETTINGS?.subscribe?.(next => { theme = normalise(next?.sidebarTheme); apply(); });
  } catch { /* không đăng ký được thì thôi */ }

  DARK_QUERY?.addEventListener?.("change", () => { if (theme === "system") apply(); });
})();
