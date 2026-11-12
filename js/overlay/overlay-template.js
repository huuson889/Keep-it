// Khung shadow root của overlay: 2 quy tắc CSS chung + gốc trạng thái ẩn. Giao diện: js/overlay/unified/.
const OVERLAY_CSS = `
    /* Chỉ còn quy tắc chung cho shadow root. Giao diện overlay đang dùng: js/overlay/unified/unified-css.js.
       Phần tử ngoài .ov giữ reset + phông; :host phủ toàn màn hình. */
    *:not(:is(.ov, .ov *)) {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: var(--lhn-app-font-family, 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
    }
    :host {
      position: fixed;
      top: 0;
      left: 0;
      background-color: #000;
      color: #1f2937;
      height: 100vh;
      width: 100vw;
      overflow: hidden;
      z-index: 999998;
    }
`;
// v3.5.197: the legacy overlay markup is gone. This empty, hidden root only carries the engine's state classes
// (te-subtitle-mode-*, te-reading-mode, te-sidebar-hidden, size-*, theme-*), read by overlay-engine.js and LHN_UNIFIED_BRIDGE.getCc.
const OVERLAY_HTML = `<div id="keepit-exact-overlay" class="theme-light" hidden></div>`;
