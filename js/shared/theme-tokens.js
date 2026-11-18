// Keepit — màu kính sáng/tối DÙNG CHUNG cho thanh Keepit, menu ☰ (js/content/keepit-bar-css.js), Reader
// (js/reader/reader-css.js) và sheet/panel overlay khi bật Hiệu ứng nền (js/overlay/ui/overlay-css.js). Đổi màu ở đây là tất cả đổi theo; CSS chỉ dùng var(--kp-…), không viết lại mã màu.
// -l = chủ đề sáng, -d = chủ đề tối. css(selector) trả về khối biến để chèn trước CSS của từng giao diện.
(() => {
  const TOKENS = Object.freeze({
    "glass-l":"rgba(255,255,255,.78)",   // nền kính sáng (thanh, ☰, nút lên đầu trang, thanh/bảng Reader)
    "glass-d":"rgba(24,24,28,.78)",      // nền kính tối
    "blur":"blur(24px) saturate(1.6)",   // độ mờ kính (backdrop-filter)
    "tx-l":"#334155",                    // chữ/icon chính — sáng
    "tx-strong-l":"#1f2937",             // chữ đậm — sáng
    "tx2-l":"#52525b",                   // chữ phụ, tiêu đề nhóm — sáng
    "tx-d":"#e4e4e7",                    // chữ/icon chính — tối
    "tx-strong-d":"#f4f4f5",             // chữ đậm — tối
    "tx2-d":"#b4b4bc",                   // chữ phụ, tiêu đề nhóm — tối
    "tile-l":"rgba(255,255,255,.55)",    // ô tính năng — sáng
    "line-l":"rgba(15,23,42,.12)",       // viền ô — sáng
    "tile-d":"rgba(255,255,255,.08)",    // ô tính năng, ô nhập — tối
    "line-d":"rgba(255,255,255,.12)"     // viền ô — tối
  });
  const css = selector => `${selector}{${Object.entries(TOKENS).map(([k, v]) => `--kp-${k}:${v}`).join(";")}}`;
  // v3.5.271: thanh cuộn 3px — QUY TẮC CHUNG CẢ APP. Mọi shadow root chèn chuỗi này (trang thường dùng css/content/content.css,
  // trang extension dùng CSS riêng cùng chuẩn). Chrome/Edge: đúng 3px; Firefox chỉ có auto/thin → thin. Không đặt scrollbar-width cho
  // Chromium (Chrome 121+ thấy scrollbar-width là bỏ qua ::-webkit-scrollbar). Chỗ đã ẩn thanh cuộn (display:none / none) vẫn ẩn.
  const scrollbar = "*::-webkit-scrollbar{width:3px;height:3px}*::-webkit-scrollbar-thumb{border-radius:999px;background:rgba(148,163,184,.55)}*::-webkit-scrollbar-track,*::-webkit-scrollbar-corner{background:transparent}@supports not selector(::-webkit-scrollbar){*{scrollbar-width:thin;scrollbar-color:rgba(148,163,184,.55) transparent}}";
  globalThis.LHN_THEME = Object.freeze({ TOKENS, css, scrollbar });
})();
