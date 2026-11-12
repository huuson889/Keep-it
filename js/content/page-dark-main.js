// Trang tối (v3.5.215) — chạy trong chính trang (world MAIN) trước script của trang. Chỉ được background đăng ký khi
// Trang tối bật và Chủ đề Keepit = Tối (js/background/background.js, syncPageDarkScripts).
// Báo cho JS của trang "máy đang ở chế độ tối": matchMedia("(prefers-color-scheme: dark)") → đúng, "light" → sai, để trang
// có dark mode theo máy tự bật dark mode của chính nó. Phần CSS (@media prefers-color-scheme) do js/content/page-dark.js làm.
(() => {
  try {
    const real = window.matchMedia;
    if (typeof real !== "function" || real.__keepitDark) return;
    const swap = q => String(q).replace(/\(\s*prefers-color-scheme\s*:\s*dark\s*\)/gi, "(min-width: 0px)").replace(/\(\s*prefers-color-scheme\s*:\s*light\s*\)/gi, "(max-width: 0px)");
    const fake = function matchMedia(q) { return real.call(this, swap(q)); };
    Object.defineProperty(fake, "__keepitDark", { value:true });
    window.matchMedia = fake;
  } catch {}
})();
