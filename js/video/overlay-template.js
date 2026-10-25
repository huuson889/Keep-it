// Giao diện Trancy: CSS và markup lấy từ file UI gốc (chỉ thêm phần bổ sung chức năng và sidebar v1.4)
const OVERLAY_CSS = `
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
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

    /* Main Container */
    #trancy-exact-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      display: flex;
      z-index: 999998;
      transition: background-color 0.2s, color 0.2s;
    }

    /* --- LIGHT THEME (DEFAULT) --- */
    #trancy-exact-overlay.theme-light {
      background-color: #f8f9fa;
      color: #1f2937;
    }
    #trancy-exact-overlay.theme-light .te-left-section { background-color: #f1f3f5; }
    #trancy-exact-overlay.theme-light .te-sub-container { background-color: #ffffff; border-top: 1px solid #e5e7eb; }
    #trancy-exact-overlay.theme-light .te-sub-en { color: #111827; }
    #trancy-exact-overlay.theme-light .te-sub-vi { color: #4b5563; }
    #trancy-exact-overlay.theme-light .te-control-bar { background-color: #ffffff; border-top: 1px solid #e5e7eb; }
    #trancy-exact-overlay.theme-light .te-right-sidebar { background-color: #ffffff; border-left: 1px solid #e5e7eb; }
    #trancy-exact-overlay.theme-light .te-sidebar-top { border-bottom: 1px solid #e5e7eb; color: #111827; }
    #trancy-exact-overlay.theme-light .te-ts-row:hover { background-color: #f3f4f6; }
    #trancy-exact-overlay.theme-light .te-ts-row.active { background-color: #fef3c7; }
    #trancy-exact-overlay.theme-light .te-ts-row.active .te-ts-en,
    #trancy-exact-overlay.theme-light .te-ts-row.active .te-ts-time { color: #d97706; font-weight: 600; }
    #trancy-exact-overlay.theme-light .te-ts-en { color: #111827; }
    #trancy-exact-overlay.theme-light .te-ts-vi { color: #4b5563; }
    #trancy-exact-overlay.theme-light .te-modal-box { background-color: #ffffff; border: 1px solid #e5e7eb; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15); color: #1f2937; }
    #trancy-exact-overlay.theme-light .te-modal-header { border-bottom: 1px solid #f3f4f6; color: #111827; }
    #trancy-exact-overlay.theme-light .te-menu-row { color: #374151; border-bottom: 1px solid #f9fafb; }
    #trancy-exact-overlay.theme-light .te-menu-row:hover { background-color: #f9fafb; }
    #trancy-exact-overlay.theme-light .te-menu-right { color: #9ca3af; }
    #trancy-exact-overlay.theme-light .te-slider { background-color: #d1d5db; }
    #trancy-exact-overlay.theme-light input:checked + .te-slider { background-color: #8b5cf6; }
    #trancy-exact-overlay.theme-light .te-divider { background-color: #f3f4f6; }
    #trancy-exact-overlay.theme-light .te-setting-item { color: #1f2937; }
    #trancy-exact-overlay.theme-light .te-btn-group { background: #f3f4f6; }
    #trancy-exact-overlay.theme-light .te-btn-subopt { color: #4b5563; }
    #trancy-exact-overlay.theme-light .te-btn-subopt.active { background: #ffffff; color: #111827; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    #trancy-exact-overlay.theme-light .te-card-box { background: #ffffff; border: 1px solid #e5e7eb; }
    #trancy-exact-overlay.theme-light .te-input-select { background: #ffffff; border: 1px solid #e5e7eb; color: #1f2937; }
    #te-modal-lang .te-modal-box, #te-modal-lang .te-modal-body, #te-modal-lang .te-card-box { overflow: visible; }
    #trancy-exact-overlay.theme-light .te-language-picker-button { background: #fff; border: 1px solid #e5e7eb; color: #374151; }
    #trancy-exact-overlay.theme-light .te-language-picker-menu { background: #fff; border: 1px solid #e5e7eb; box-shadow: 0 8px 20px rgba(0,0,0,.15); }
    #trancy-exact-overlay.theme-light .te-language-picker-option { color: #374151; }
    #trancy-exact-overlay.theme-light .te-language-picker-option:hover,
    #trancy-exact-overlay.theme-light .te-language-picker-option[aria-selected="true"] { background: #f3f4f6; }

    /* --- DARK THEME --- */
    #trancy-exact-overlay.theme-dark {
      background-color: #0b0b0b;
      color: #f3f4f6;
    }
    #trancy-exact-overlay.theme-dark .te-left-section { background-color: #000000; }
    #trancy-exact-overlay.theme-dark .te-sub-container { background-color: #121212; border-top: 1px solid #222; }
    #trancy-exact-overlay.theme-dark .te-sub-en { color: #ffffff; }
    #trancy-exact-overlay.theme-dark .te-sub-vi { color: #d1d5db; }
    #trancy-exact-overlay.theme-dark .te-control-bar { background-color: #0f0f0f; border-top: 1px solid #222; }
    #trancy-exact-overlay.theme-dark .te-right-sidebar { background-color: #121212; border-left: 1px solid #222; }
    #trancy-exact-overlay.theme-dark .te-sidebar-top { border-bottom: 1px solid #222; color: #ffffff; }
    #trancy-exact-overlay.theme-dark .te-ts-row:hover { background-color: #1f1f23; }
    #trancy-exact-overlay.theme-dark .te-ts-row.active { background-color: #231f16; }
    #trancy-exact-overlay.theme-dark .te-ts-row.active .te-ts-en,
    #trancy-exact-overlay.theme-dark .te-ts-row.active .te-ts-time { color: #f59e0b; font-weight: 600; }
    #trancy-exact-overlay.theme-dark .te-ts-en { color: #f4f4f5; }
    #trancy-exact-overlay.theme-dark .te-ts-vi { color: #9ca3af; }
    #trancy-exact-overlay.theme-dark .te-modal-box { background-color: #18181b; border: 1px solid #27272a; box-shadow: 0 20px 35px rgba(0,0,0,0.7); color: #f3f4f6; }
    #trancy-exact-overlay.theme-dark .te-modal-header { border-bottom: 1px solid #27272a; color: #f3f4f6; }
    #trancy-exact-overlay.theme-dark .te-menu-row { color: #e4e4e7; border-bottom: 1px solid #222225; }
    #trancy-exact-overlay.theme-dark .te-menu-row:hover { background-color: #222226; }
    #trancy-exact-overlay.theme-dark .te-menu-right { color: #71717a; }
    #trancy-exact-overlay.theme-dark .te-slider { background-color: #3f3f46; }
    #trancy-exact-overlay.theme-dark input:checked + .te-slider { background-color: #8b5cf6; }
    #trancy-exact-overlay.theme-dark .te-divider { background-color: #27272a; }
    #trancy-exact-overlay.theme-dark .te-setting-item { color: #f3f4f6; }
    #trancy-exact-overlay.theme-dark .te-btn-group { background: #27272a; }
    #trancy-exact-overlay.theme-dark .te-btn-subopt { color: #a1a1aa; }
    #trancy-exact-overlay.theme-dark .te-btn-subopt.active { background: #3f3f46; color: #fff; }
    #trancy-exact-overlay.theme-dark .te-card-box { background: #27272a; border: 1px solid #3f3f46; }
    #trancy-exact-overlay.theme-dark .te-input-select { background: #27272a; border: 1px solid #3f3f46; color: #f3f4f6; }
    #trancy-exact-overlay.theme-dark .te-language-picker-button { background: #27272a; border: 1px solid #3f3f46; color: #f3f4f6; }
    #trancy-exact-overlay.theme-dark .te-language-picker-menu { background: #27272a; border: 1px solid #3f3f46; box-shadow: 0 8px 20px rgba(0,0,0,.55); }
    #trancy-exact-overlay.theme-dark .te-language-picker-option { color: #f3f4f6; }
    #trancy-exact-overlay.theme-dark .te-language-picker-option:hover,
    #trancy-exact-overlay.theme-dark .te-language-picker-option[aria-selected="true"] { background: #3f3f46; }

    /* Left Section Layout */
    .te-left-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      height: 100%;
      position: relative;
      padding-bottom: 60px;
    }

    .te-video-slot {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #111;
      position: relative;
      overflow: hidden;
      background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><rect width="100%" height="100%" fill="%23d6c7b2"/><text x="50%" y="40%" font-size="28" font-weight="bold" fill="%23111" text-anchor="middle">They want a better future, but they do not</text><text x="50%" y="50%" font-size="28" font-weight="bold" fill="%23111" text-anchor="middle">practice better habits today.</text><text x="50%" y="68%" font-size="30" font-weight="bold" fill="%23111" text-anchor="middle">The truth is simple: Your future is</text><text x="50%" y="78%" font-size="30" font-weight="bold" fill="%23111" text-anchor="middle">shaped by what you practice every day.</text></svg>');
      background-size: cover;
      background-position: center;
    }

    .te-sub-container {
      min-height: 140px;
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      padding: 16px 40px;
      text-align: center;
    }

    .te-sub-en {
      font-size: 24px;
      font-weight: 500;
      margin-bottom: 6px;
      line-height: 1.35;
    }

    .te-sub-en .yt-dual-word:hover,
    .yt-dual-item-en .yt-dual-word:hover { background: rgba(147, 197, 253, 0.45); border-radius: 2px; }

    .te-sub-vi {
      font-size: 18px;
      font-weight: 400;
      line-height: 1.35;
    }

    /* Control Bar */
    .te-control-bar {
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      position: absolute;
      left: 0;
      bottom: 0;
      width: 100%;
      z-index: 2;
      flex-shrink: 0;
    }

    .te-progress-track {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 3px;
      background: rgba(139, 92, 246, 0.2);
    }

    .te-progress-fill {
      width: 35%;
      height: 100%;
      background: #8b5cf6;
    }

    .te-ctrl-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .te-yt-logo-box {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13.5px;
      font-weight: 500;
      max-width: 300px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .te-yt-logo-box svg {
      width: 22px;
      height: 22px;
      color: #ff0000;
      flex-shrink: 0;
    }

    .te-icon-btn, .te-play-btn {
      background: transparent;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: inherit;
      padding: 6px;
      border-radius: 6px;
      transition: background 0.2s;
    }

    .te-icon-btn:hover { background: rgba(128, 128, 128, 0.15); }

    .te-icon-btn.lhn-br-key-press,
    .te-play-btn.lhn-br-key-press { animation: lhnBrButtonPress .18s ease-out; }
    @keyframes lhnBrButtonPress {
      35% { transform: scale(.84); background: rgba(148, 163, 184, .38); }
      100% { transform: scale(1); }
    }

    .te-play-btn {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: #8b5cf6;
      color: #fff;
    }
    .te-play-btn:hover { background: #7c3aed !important; }

    /* Right Sidebar */
    .te-right-sidebar {
      width: 380px;
      height: 100%;
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
    }

    .te-sidebar-top {
      padding: 14px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 15px;
      font-weight: 500;
    }

    .te-close-sidebar {
      background: none;
      border: none;
      color: #9ca3af;
      font-size: 18px;
      cursor: pointer;
    }

    .te-transcript-scroll {
      flex: 1;
      overflow-y: auto;
      padding: 8px 0;
    }

    .te-ts-row {
      display: flex;
      gap: 12px;
      padding: 12px 16px;
      cursor: pointer;
      transition: background 0.15s;
    }

    .te-ts-time {
      font-size: 12px;
      font-weight: 500;
      color: #9ca3af;
      min-width: 40px;
      padding-top: 2px;
    }

    .te-ts-content { flex: 1; }
    .te-ts-en { font-size: 13.5px; margin-bottom: 3px; line-height: 1.35; }
    .te-ts-vi { font-size: 12.5px; line-height: 1.35; }

    /* Modal Backdrop & Position */
    .te-modal-backdrop {
      position: fixed;
      top: 0; left: 0; width: 100vw; height: 100vh;
      background: transparent;
      z-index: 999999;
    }

    .te-modal-backdrop.hidden { display: none !important; }

    /* Modal Box - Dynamically positioned to the LEFT of te-settings-btn */
    .te-modal-box {
      position: fixed;
      bottom: 70px;
      width: 360px;
      border-radius: 16px;
      overflow: hidden;
      transition: opacity 0.15s ease, transform 0.15s ease;
      z-index: 1000000;
    }

    .te-modal-header {
      padding: 16px 20px;
      font-size: 16px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .te-modal-body {
      padding: 6px 0;
      max-height: 520px;
      overflow-y: auto;
    }
    .te-modal-body::-webkit-scrollbar { width: 2px; }
    .te-modal-body::-webkit-scrollbar-track { background: transparent; }
    .te-modal-body::-webkit-scrollbar-thumb { background: #8b70e8a8; border-radius: 999px; }
    .te-modal-body:hover::-webkit-scrollbar { width: 4px; }
    .te-modal-body:hover::-webkit-scrollbar-thumb { background: #8b70e8; }

    .te-menu-row {
      padding: 11px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 14px;
      cursor: pointer;
    }

    .te-item-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .te-item-left svg {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
      color: #6b7280;
    }

    .te-menu-right {
      font-size: 13.5px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    /* Switches */
    .te-switch {
      position: relative;
      display: inline-block;
      width: 44px;
      height: 24px;
    }

    .te-switch input { opacity: 0; width: 0; height: 0; }

    .te-slider {
      position: absolute;
      cursor: pointer;
      top: 0; left: 0; right: 0; bottom: 0;
      transition: .2s;
      border-radius: 24px;
    }

    .te-slider:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: .2s;
      border-radius: 50%;
    }

    input:checked + .te-slider:before { transform: translateX(20px); }

    .te-divider {
      height: 1px;
      margin: 4px 0;
    }

    /* Sub-menu styles */
    .te-modal-back {
      background: none; border: none; cursor: pointer; font-size: 15px; font-weight: 500; display: flex; align-items: center; gap: 8px; color: inherit;
    }
    .te-modal-back-icon {
      display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 8px; border: 1px solid #e5e7eb; background: #fff; color: #6b7280;
    }
    #trancy-exact-overlay.theme-dark .te-modal-back-icon {
      border-color: #3f3f46; background: #27272a; color: #a1a1aa;
    }

    .te-setting-section-title { padding: 12px 20px 6px 20px; font-size: 13px; font-weight: 500; color: #6b7280; }
    .te-setting-item { padding: 8px 20px; display: flex; align-items: center; justify-content: space-between; font-size: 14px; }
    
    .te-btn-group { display: flex; border-radius: 10px; padding: 3px; gap: 2px; width: 100%; background: #f3f4f6; }
    #trancy-exact-overlay.theme-dark .te-btn-group { background: #27272a; }

    .te-btn-subopt { padding: 8px 12px; font-size: 13.5px; border: none; background: transparent; cursor: pointer; border-radius: 8px; flex: 1; text-align: center; color: #6b7280; font-weight: 500; }
    .te-btn-subopt.active { background: #ffffff; color: #111827; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    #trancy-exact-overlay.theme-dark .te-btn-subopt.active { background: #3f3f46; color: #ffffff; }

    .te-card-box {
      margin: 0 20px;
      border-radius: 12px;
      overflow: hidden;
    }

    .te-language-picker { position: relative; z-index: 3; }
    .te-language-picker-button { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-width: 132px; max-width: 170px; padding: 7px 10px; border-radius: 8px; font-size: 13.5px; cursor: pointer; }
    .te-language-picker-menu { position: absolute; top: calc(100% + 4px); right: 0; min-width: 170px; padding: 4px; border-radius: 8px; z-index: 1000002; }
    .te-language-picker-menu[hidden] { display: none !important; }
    .te-language-picker-option { display: block; width: 100%; padding: 8px 10px; border: 0; border-radius: 5px; background: transparent; text-align: left; font-size: 13px; cursor: pointer; }

    .te-color-pill {
      width: 32px;
      height: 18px;
      border-radius: 6px;
      display: inline-block;
      cursor: pointer;
    }

    .te-counter-btn {
      width: 26px;
      height: 26px;
      border-radius: 6px;
      border: none;
      background: #e5e7eb;
      color: #374151;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    #trancy-exact-overlay.theme-dark .te-counter-btn { background: #3f3f46; color: #f3f4f6; }

    /* Export Modal Specific Styles */
    .te-export-tab-group {
      display: flex;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      overflow: hidden;
      margin: 12px 20px 16px 20px;
    }
    #trancy-exact-overlay.theme-dark .te-export-tab-group {
      border-color: #3f3f46;
    }
    .te-export-tab {
      flex: 1;
      padding: 10px 0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      font-size: 13.5px;
      font-weight: 500;
      border: none;
      background: transparent;
      cursor: pointer;
      color: #6b7280;
      border-right: 1px solid #e5e7eb;
    }
    #trancy-exact-overlay.theme-dark .te-export-tab {
      border-right-color: #3f3f46;
      color: #a1a1aa;
    }
    .te-export-tab:last-child {
      border-right: none;
    }
    .te-export-tab.active {
      background: #f3f4f6;
      color: #111827;
    }
    #trancy-exact-overlay.theme-dark .te-export-tab.active {
      background: #27272a;
      color: #ffffff;
    }

    .te-export-submit-btn {
      width: calc(100% - 40px);
      margin: 16px 20px 12px 20px;
      padding: 12px 0;
      border-radius: 12px;
      background: #7c3aed;
      color: #ffffff;
      border: none;
      font-size: 14.5px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
      transition: background 0.2s;
    }
    .te-export-submit-btn:hover {
      background: #6d28d9;
    }

    /* Floating Purple Button */
    .te-floating-btn {
      position: absolute;
      bottom: 16px;
      right: 16px;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #8b5cf6, #7c3aed);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
      cursor: pointer;
      border: none;
    }
    .te-floating-btn svg { width: 20px; height: 20px; fill: currentColor; }
  
    /* ===== Bổ sung tối thiểu cho chức năng (không đổi bố cục mặc định) ===== */
    #trancy-exact-overlay.te-hidden { display: none !important; }
    #trancy-exact-overlay.te-controls-hidden .te-control-bar { display: none; }
    #trancy-exact-overlay.te-subs-hidden .te-sub-container { display: none; }
    #trancy-exact-overlay.te-sidebar-hidden .yt-dual-right-sidebar { display: none; }
    #trancy-exact-overlay .te-icon-btn.te-active { color: #8b5cf6; }
    #trancy-exact-overlay .te-video-slot video {
      position: absolute !important;
      top: 0; left: 0;
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
      width: 100% !important;
      height: 100% !important;
      object-fit: contain;
      transform: none !important;
    }
    #trancy-exact-overlay.hide-vi .te-sub-vi,
    #trancy-exact-overlay.hide-vi .yt-dual-item-vi { display: none; }
    .yt-dual-empty { padding: 16px; font-size: 13px; color: #9ca3af; }

    /* ===== Sidebar theo v1.4 ===== */
/* Right Sidebar (Full Transcript) */
.yt-dual-right-sidebar {
  width: 400px;
  height: 100%;
  background-color: #121212;
  border-left: 1px solid #282828;
  display: flex;
  flex-direction: column;
}

.yt-dual-sidebar-header {
  padding: 16px;
  border-bottom: 1px solid #282828;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  font-size: 16px;
}

.yt-dual-close-btn {
  background: none;
  border: none;
  color: #aaa;
  font-size: 22px;
  cursor: pointer;
}

.yt-dual-close-btn:hover {
  color: #fff;
}

.yt-dual-transcript-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

/* Transcript Item */
.yt-dual-item {
  padding: 10px 12px;
  margin-bottom: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
  display: flex;
  gap: 12px;
}

.yt-dual-item:hover {
  background-color: #272727;
}

.yt-dual-item.active {
  background-color: #2e2640;
  border-left: 4px solid #8b5cf6;
}

.yt-dual-timestamp {
  font-size: 12px;
  color: #8b5cf6;
  font-weight: bold;
  min-width: 45px;
  padding-top: 2px;
}

.yt-dual-content {
  flex: 1;
}

.yt-dual-item-en {
  font-size: 14px;
  color: #e5e7eb;
  margin-bottom: 4px;
  line-height: 1.3;
}

.yt-dual-item-vi {
  font-size: 13px;
  color: #9ca3af;
  line-height: 1.3;
}

/* Light mode cho sidebar bản ghi: các class yt-dual-* đang hardcode màu tối nên phải override.
   Màu chữ dùng biến --te-side-*-color để màu người dùng tự chọn (inline trên root) vẫn thắng. */
#trancy-exact-overlay.theme-light { --te-side-en-color: #111827; --te-side-vi-color: #4b5563; }
#trancy-exact-overlay.theme-light .yt-dual-right-sidebar { background-color: #ffffff; border-left: 1px solid #e5e7eb; }
#trancy-exact-overlay.theme-light .yt-dual-sidebar-header { border-bottom: 1px solid #e5e7eb; color: #111827; }
#trancy-exact-overlay.theme-light .yt-dual-close-btn { color: #6b7280; }
#trancy-exact-overlay.theme-light .yt-dual-close-btn:hover { color: #111827; }
#trancy-exact-overlay.theme-light .yt-dual-item:hover { background-color: #f3f4f6; }
#trancy-exact-overlay.theme-light .yt-dual-item.active { background-color: #fef3c7; border-left-color: #d97706; }
#trancy-exact-overlay.theme-light .yt-dual-timestamp { color: #7c3aed; }
#trancy-exact-overlay.theme-light .yt-dual-empty { color: #6b7280; }

/* ---- v1.2: thanh công cụ, ẩn bản dịch ---- */
.yt-dual-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.yt-dual-action-btn {
  background: #272727;
  color: #ffffff;
  border: 1px solid #3a3a3a;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
}

.yt-dual-action-btn:hover {
  border-color: #8b5cf6;
}


    /* ===== Kích thước video: Nhỏ / Vừa / Lớn ===== */
    /* Tỉ lệ chiều rộng: Nhỏ video 60% / sidebar 40%, Vừa 65% / 35%, Lớn 70% / 30% (sidebar tối thiểu 400px) */
    #trancy-exact-overlay .yt-dual-right-sidebar { width: max(400px, 30vw); flex-shrink: 0; }
    #trancy-exact-overlay .te-left-section { flex: none; width: calc(100vw - max(400px, 30vw)); }
    #trancy-exact-overlay.size-s .yt-dual-right-sidebar { width: max(400px, 40vw); }
    #trancy-exact-overlay.size-s .te-left-section { width: calc(100vw - max(400px, 40vw)); }
    #trancy-exact-overlay.size-m .yt-dual-right-sidebar { width: max(400px, 35vw); }
    #trancy-exact-overlay.size-m .te-left-section { width: calc(100vw - max(400px, 35vw)); }
    #trancy-exact-overlay.te-sidebar-hidden .te-left-section { width: 100vw; }
    /* Video: rộng theo cột trái, cao theo đúng tỉ lệ thật của video (--te-video-aspect do JS set),
       chặn trên để vùng phụ đề luôn còn tối thiểu 140px + 60px control bar. */
    #trancy-exact-overlay .te-video-slot {
      flex: none;
      width: 100%;
      height: auto;
      aspect-ratio: var(--te-video-aspect, 16 / 9);
      max-height: calc(100vh - 200px);
    }

    /* ===== Tùy chọn phụ đề: không scroll, phụ đề thanh bên ===== */
    #trancy-exact-overlay .yt-dual-item-en { font-size: var(--te-side-en, 16px); color: var(--te-side-en-color, #e5e7eb); }
    #trancy-exact-overlay .yt-dual-item-vi { font-size: var(--te-side-vi, 14px); color: var(--te-side-vi-color, #9ca3af); }
`;
const OVERLAY_HTML = `<div id="trancy-exact-overlay" class="theme-light">
    <!-- Left Section -->
    <div class="te-left-section">
      <div class="te-video-slot"></div>
      
      <!-- Subtitle box below video -->
      <div class="te-sub-container">
        <div class="te-sub-en" id="te-sub-en-text"></div>
        <div class="te-sub-vi" id="te-sub-vi-text"></div>
      </div>

      <!-- Control Bar -->
      <div class="te-control-bar">
        <div class="te-progress-track"><div class="te-progress-fill"></div></div>
        
        <div class="te-ctrl-group">
          <div class="te-yt-logo-box">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            <span class="te-video-title-label">The Power Of Practice | You Become What You Practice |...</span>
          </div>
          <button class="te-icon-btn" title="Thêm vào từ vựng"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg></button>
          <button class="te-icon-btn" title="Mở bộ sưu tập"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg></button>
        </div>

        <div class="te-ctrl-group">
          <button class="te-icon-btn" title="Lặp lại câu"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg></button>
          <button class="te-icon-btn" title="Câu trước"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg></button>
          <button class="te-play-btn" title="Phát/Tạm dừng"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></button>
          <button class="te-icon-btn" title="Câu tiếp theo"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg></button>
          <button class="te-icon-btn" title="Tốc độ"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></button>
        </div>

        <div class="te-ctrl-group">
          <button class="te-icon-btn" title="Audio"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg></button>
          <button class="te-icon-btn" title="AI Trancy"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></button>
          <button class="te-icon-btn" title="Chế độ phụ đề"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h4M6 12h12M6 16h8"/></svg></button>
          <button class="te-icon-btn" title="Bố cục"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="15" y1="3" x2="15" y2="21"/></svg></button>
          <button class="te-icon-btn" title="Toàn màn hình"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg></button>
          <button class="te-icon-btn" id="te-settings-btn" title="Cài đặt video"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></button>
        </div>
      </div>
    </div>

    <!-- Right Sidebar (giao diện v1.4) -->
    <div class="yt-dual-right-sidebar">
      <div class="yt-dual-sidebar-header">
        <span>Transcript Song Ngữ</span>
        <div class="yt-dual-actions">
          <button class="yt-dual-close-btn" title="Đóng">&times;</button>
        </div>
      </div>
      <div class="yt-dual-transcript-list" id="te-transcript-list"></div>

      <!-- Floating button inside transcript bottom right -->
      <div style="position: relative; height: 0;">
        <button class="te-floating-btn" id="te-floating-btn" title="Mở cài đặt">
          <svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zM6 10h2v2H6zm0 4h8v2H6zm10 0h2v2h-2zm-6-4h8v2h-8z"/></svg>
        </button>
      </div>
    </div>

    <!-- Modal 1: Cài đặt video Main Menu -->
    <div class="te-modal-backdrop" id="te-modal-main">
      <div class="te-modal-box">
        <div class="te-modal-header">
          <span>Cài đặt video</span>
          <button class="te-close-sidebar" id="te-close-modal">&times;</button>
        </div>
        <div class="te-modal-body">

          <!-- Chế độ xem -->
          <div class="te-setting-section-title">Chế độ xem</div>
          <div id="te-view-mode-options" style="padding: 0 20px 14px 20px;">
            <div class="te-btn-group">
              <button class="te-btn-subopt" style="padding: 10px 0;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="vertical-align: middle;"><rect x="3" y="5" width="18" height="14" rx="2"/><line x1="9" y1="5" x2="9" y2="19"/><line x1="15" y1="5" x2="15" y2="19"/></svg>
              </button>
              <button class="te-btn-subopt active" style="padding: 10px 0;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle;"><rect x="3" y="5" width="18" height="14" rx="2"/><line x1="8" y1="5" x2="8" y2="19"/><line x1="16" y1="5" x2="16" y2="19"/></svg>
              </button>
              <button class="te-btn-subopt" style="padding: 10px 0;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="vertical-align: middle;"><rect x="3" y="5" width="18" height="14" rx="2"/><line x1="12" y1="5" x2="12" y2="19"/></svg>
              </button>
            </div>
          </div>
          
          <!-- Hiện popup dịch trực tiếp -->
          <div class="te-menu-row">
            <div class="te-item-left">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 12a9 9 0 1 1-9-9c2.5 0 4.8 1 6.5 2.6L21 8"/><path d="M21 3v5h-5"/><circle cx="10" cy="13" r="3"/><path d="m12 15 2 2"/></svg>
              <span>Hiện popup dịch trực tiếp</span>
            </div>
            <label class="te-switch"><input type="checkbox" id="te-translation-popup-enabled"><span class="te-slider"></span></label>
          </div>

          <!-- Nhấp để phát âm -->
          <div class="te-menu-row">
            <div class="te-item-left">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 12a9 9 0 1 1-9-9c2.5 0 4.8 1 6.5 2.6L21 8"/><path d="M21 3v5h-5"/><path d="M10 9v6l4-3z"/></svg>
              <span>Nhấp để phát âm</span>
            </div>
            <label class="te-switch"><input type="checkbox" checked><span class="te-slider"></span></label>
          </div>

          <!-- Kết hợp câu -->
          <div class="te-menu-row">
            <div class="te-item-left">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8 7h8a2 2 0 0 1 2 2v2M8 17h8a2 2 0 0 0 2-2v-2"/><path d="m11 4-3 3 3 3M11 14l-3 3 3 3"/></svg>
              <span>Kết hợp câu</span>
            </div>
            <label class="te-switch"><input type="checkbox"><span class="te-slider"></span></label>
          </div>

          <!-- Ẩn bản dịch -->
          <div class="te-menu-row">
            <div class="te-item-left">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h12M10 7v11M14 12h6M17 12v6"/></svg>
              <span>Ẩn bản dịch</span>
            </div>
            <label class="te-switch"><input type="checkbox"><span class="te-slider"></span></label>
          </div>

          <!-- Ẩn thanh điều khiển -->
          <div class="te-menu-row">
            <div class="te-item-left">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 15h18"/></svg>
              <span>Ẩn thanh điều khiển</span>
            </div>
            <label class="te-switch"><input type="checkbox"><span class="te-slider"></span></label>
          </div>
          
          <div class="te-divider"></div>
          
          <!-- Đánh dấu từ -->
          <div class="te-menu-row" id="open-mark-modal">
            <div class="te-item-left">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 18h12M12 4L7 14h10z"/></svg>
              <span>Đánh dấu từ</span>
            </div>
            <div class="te-menu-right"><span>đánh dấu</span> <span>›</span></div>
          </div>

          <!-- Chủ đề -->
          <div class="te-menu-row" id="toggle-theme-btn">
            <div class="te-item-left">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2a10 10 0 1 0 10 10c0-2.5-2-4.5-4.5-4.5H15a2 2 0 0 1-2-2V4.5C13 3.1 12.6 2 12 2z"/><circle cx="7.5" cy="11.5" r="1.5"/><circle cx="12" cy="7.5" r="1.5"/><circle cx="16.5" cy="11.5" r="1.5"/></svg>
              <span>Chủ đề</span>
            </div>
            <div class="te-menu-right"><span id="te-theme-label">Light</span> <span>›</span></div>
          </div>

          <!-- Tùy chọn phụ đề -->
          <div class="te-menu-row" id="open-sub-modal">
            <div class="te-item-left">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h12M10 7v11M14 12h6M17 12v6"/></svg>
              <span>Tùy chọn phụ đề</span>
            </div>
            <div class="te-menu-right"><span>›</span></div>
          </div>
          
          <div class="te-divider"></div>
          
          <!-- Bộ sưu tập -->
          <div class="te-menu-row">
            <div class="te-item-left">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 3v18M17 3v18M3 9h18M3 15h18"/></svg>
              <span>Bộ sưu tập</span>
            </div>
            <div class="te-menu-right"><span>›</span></div>
          </div>

          <!-- Bộ dịch -->
          <div class="te-menu-row">
            <div class="te-item-left">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2l2.4 5.6L20 10l-5.6 2.4L12 18l-2.4-5.6L4 10l5.6-2.4z"/><rect x="15" y="15" width="6" height="6" rx="1"/></svg>
              <span>Bộ dịch</span>
            </div>
            <div class="te-menu-right">
              <span style="background:#eef2ff; color:#6366f1; border:1px solid #c7d2fe; font-size:10px; padding:1px 6px; border-radius:4px; font-weight:600;">New</span>
              <span>›</span>
            </div>
          </div>

          <!-- Ngôn ngữ phụ đề -->
          <div class="te-menu-row" id="open-lang-modal">
            <div class="te-item-left">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              <span>Ngôn ngữ phụ đề</span>
            </div>
            <div class="te-menu-right"><span>›</span></div>
          </div>

          <!-- Xuất phụ đề -->
          <div class="te-menu-row" id="open-export-modal">
            <div class="te-item-left">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M11 15h6M14 12l3 3-3 3"/></svg>
              <span>Xuất phụ đề</span>
            </div>
            <div class="te-menu-right"><span>›</span></div>
          </div>

        </div>
      </div>
    </div>

    <!-- Modal 2: Tùy chọn phụ đề -->
    <div class="te-modal-backdrop hidden" id="te-modal-sub">
      <div class="te-modal-box">
        <div class="te-modal-header" style="border-bottom: none; padding-bottom: 4px;">
          <button class="te-modal-back" id="back-sub">
            <span class="te-modal-back-icon">‹</span>
            <span>Tùy chọn phụ đề</span>
          </button>
          <button style="font-size: 13px; color: #6b7280; display: flex; align-items: center; gap: 4px; font-weight: normal; background:none; border:none; cursor:pointer;" title="Đặt lại">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg> Đặt lại
          </button>
        </div>
        <div class="te-modal-body" style="padding-top: 0;">
          <div class="te-setting-section-title">Cài đặt chung</div>
          
          <div style="padding: 0 20px 10px 20px;">
            <select class="te-input-select" style="width: 100%; padding: 10px 14px; border-radius: 12px; font-size: 14px; outline: none; cursor: pointer; appearance: none; -webkit-appearance: none; background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="%236b7280" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>'); background-repeat: no-repeat; background-position: right 14px center;">
              <option>Inter</option>
              <option>Roboto</option>
              <option>Arial</option>
            </select>
          </div>

          <div style="padding: 0 20px 10px 20px;">
            <div class="te-btn-group">
              <button class="te-btn-subopt">Nhỏ</button>
              <button class="te-btn-subopt active">Trung bình</button>
              <button class="te-btn-subopt">Lớn</button>
            </div>
          </div>

          <div style="padding: 0 20px 14px 20px;">
            <div class="te-btn-group">
              <button class="te-btn-subopt active">Bình thường</button>
              <button class="te-btn-subopt">Đậm</button>
            </div>
          </div>

          <div class="te-setting-section-title">Chế độ rạp</div>
          <div class="te-card-box">
            <div class="te-setting-item" style="border-bottom: 1px solid rgba(0,0,0,0.06);">
              <span style="font-size: 13.5px; color: #374151;">Màu phụ đề chính</span>
              <span class="te-color-pill" style="background: #ccff00;"></span>
            </div>
            <div class="te-setting-item">
              <span style="font-size: 13.5px; color: #374151;">Màu phụ đề dịch</span>
              <span class="te-color-pill" style="background: #ffffff; border: 1px solid #d1d5db;"></span>
            </div>
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between; padding: 14px 20px 6px 20px;">
            <span style="font-size: 13px; font-weight: 500; color: #6b7280;">Chế độ Rạp chiếu phim</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>

          <div class="te-card-box" style="margin-bottom: 10px;">
            <div class="te-setting-item" style="border-bottom: 1px solid rgba(0,0,0,0.06);">
              <span style="font-size: 13.5px;">Kích thước phụ đề chính</span>
              <div style="display: flex; align-items: center; gap: 8px;">
                <button class="te-counter-btn">-</button>
                <span style="font-size: 13px; font-weight: 500; min-width: 42px; text-anchor: middle; text-align: center;">100%</span>
                <button class="te-counter-btn">+</button>
              </div>
            </div>
            <div class="te-setting-item">
              <span style="font-size: 13.5px;">Màu phụ đề chính</span>
              <span class="te-color-pill" style="background: #ccff00;"></span>
            </div>
          </div>

          <div class="te-card-box">
            <div class="te-setting-item" style="border-bottom: 1px solid rgba(0,0,0,0.06);">
              <span style="font-size: 13.5px;">Kích thước phụ đề dịch</span>
              <div style="display: flex; align-items: center; gap: 8px;">
                <button class="te-counter-btn">-</button>
                <span style="font-size: 13px; font-weight: 500; min-width: 42px; text-anchor: middle; text-align: center;">100%</span>
                <button class="te-counter-btn">+</button>
              </div>
            </div>
            <div class="te-setting-item">
              <span style="font-size: 13.5px;">Màu phụ đề dịch</span>
              <span class="te-color-pill" style="background: #ffffff; border: 1px solid #d1d5db;"></span>
            </div>
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between; padding: 14px 20px 6px 20px;">
            <span style="font-size: 13px; font-weight: 500; color: #6b7280;">Phụ đề thanh bên</span>
          </div>

          <div class="te-card-box" style="margin-bottom: 10px;">
            <div class="te-setting-item" style="border-bottom: 1px solid rgba(0,0,0,0.06);">
              <span style="font-size: 13.5px;">Kích thước chính</span>
              <div style="display: flex; align-items: center; gap: 8px;">
                <button class="te-counter-btn" data-group="side-en" data-delta="-10">-</button>
                <span style="font-size: 13px; font-weight: 500; min-width: 42px; text-align: center;">100%</span>
                <button class="te-counter-btn" data-group="side-en" data-delta="10">+</button>
              </div>
            </div>
            <div class="te-setting-item">
              <span style="font-size: 13.5px;">Màu phụ đề chính</span>
              <span class="te-color-pill" data-group="side-en" style="background: #e5e7eb;"></span>
            </div>
          </div>

          <div class="te-card-box">
            <div class="te-setting-item" style="border-bottom: 1px solid rgba(0,0,0,0.06);">
              <span style="font-size: 13.5px;">Kích thước dịch</span>
              <div style="display: flex; align-items: center; gap: 8px;">
                <button class="te-counter-btn" data-group="side-vi" data-delta="-10">-</button>
                <span style="font-size: 13px; font-weight: 500; min-width: 42px; text-align: center;">90%</span>
                <button class="te-counter-btn" data-group="side-vi" data-delta="10">+</button>
              </div>
            </div>
            <div class="te-setting-item">
              <span style="font-size: 13.5px;">Màu phụ đề dịch</span>
              <span class="te-color-pill" data-group="side-vi" style="background: #9ca3af;"></span>
            </div>
          </div>

        </div>
      </div>
    </div>

    <!-- Modal 3: Đánh dấu từ -->
    <div class="te-modal-backdrop hidden" id="te-modal-mark">
      <div class="te-modal-box">
        <div class="te-modal-header">
          <button class="te-modal-back" id="back-mark">
            <span class="te-modal-back-icon">‹</span>
            <span>Đánh dấu từ</span>
          </button>
        </div>
        <div class="te-modal-body" style="padding: 12px 20px;">
          <div style="font-size: 13px; color: #6b7280; margin-bottom: 16px;">Các từ đã lưu sẽ được đánh dấu trong phụ đề.</div>
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(0,0,0,0.06);">
            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="color: #10b981; font-weight: bold;">✓</span>
              <div style="border: 1px solid #d1d5db; padding: 6px 14px; border-radius: 6px; font-weight: 600; color: #f97316;">Hello</div>
            </div>
            <span style="font-size: 13.5px;">đánh dấu</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal 4: Ngôn ngữ phụ đề -->
    <div class="te-modal-backdrop hidden" id="te-modal-lang">
      <div class="te-modal-box">
        <div class="te-modal-header" style="border-bottom: none;">
          <button class="te-modal-back" id="back-lang">
            <span class="te-modal-back-icon">‹</span>
            <span>Ngôn ngữ phụ đề</span>
          </button>
        </div>
        <div class="te-modal-body" style="padding: 12px 20px 20px 20px;">
          <div class="te-card-box" style="margin: 0;">
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid rgba(0,0,0,0.06); cursor: pointer;">
              <div style="display: flex; align-items: center; gap: 12px; font-size: 14px;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="1.8"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h4M6 12h12M6 16h8"/></svg>
                <span>Phụ đề chính</span>
              </div>
              <div class="te-language-picker">
                <button type="button" class="te-language-picker-button" id="te-lang-source-picker" aria-haspopup="listbox" aria-expanded="false"><span id="te-lang-source-value"></span><span aria-hidden="true">⌄</span></button>
                <div class="te-language-picker-menu" id="te-lang-source-options" role="listbox" hidden></div>
              </div>
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; cursor: pointer;">
              <div style="display: flex; align-items: center; gap: 12px; font-size: 14px;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                <span>Phụ đề dịch</span>
              </div>
              <div class="te-language-picker">
                <button type="button" class="te-language-picker-button" id="te-lang-target-picker" aria-haspopup="listbox" aria-expanded="false"><span id="te-lang-target-value"></span><span aria-hidden="true">⌄</span></button>
                <div class="te-language-picker-menu" id="te-lang-target-options" role="listbox" hidden></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal 5: Xuất phụ đề (MỚI BỔ SUNG CHÍNH XÁC 100% THEO HÌNH MỚI) -->
    <div class="te-modal-backdrop hidden" id="te-modal-export">
      <div class="te-modal-box">
        <div class="te-modal-header" style="border-bottom: none;">
          <button class="te-modal-back" id="back-export">
            <span class="te-modal-back-icon">‹</span>
            <span>Xuất phụ đề</span>
          </button>
        </div>
        <div class="te-modal-body" style="padding-top: 0;">
          
          <!-- Tab Chọn Định Dạng: PDF, CSV, SRT -->
          <div class="te-export-tab-group">
            <button class="te-export-tab active">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M10 12h2a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-2v-3z"/></svg>
              <span>PDF</span>
            </button>
            <button class="te-export-tab">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="12" y2="17"/><line x1="12" y1="13" x2="8" y2="17"/></svg>
              <span>CSV</span>
            </button>
            <button class="te-export-tab">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><polygon points="10 12 14 14.5 10 17 10 12"/></svg>
              <span>SRT</span>
            </button>
          </div>

          <!-- Các công tắc tùy chọn xuất phụ đề -->
          <div class="te-card-box">
            <!-- 1. Xuất từ đã lưu -->
            <div class="te-setting-item" style="border-bottom: 1px solid rgba(0,0,0,0.06); padding: 12px 16px;">
              <span style="font-size: 13.5px;">Xuất từ đã lưu</span>
              <label class="te-switch"><input type="checkbox"><span class="te-slider"></span></label>
            </div>

            <!-- 2. Hiển thị từ đánh dấu -->
            <div class="te-setting-item" style="border-bottom: 1px solid rgba(0,0,0,0.06); padding: 12px 16px;">
              <span style="font-size: 13.5px;">Hiển thị từ đánh dấu</span>
              <label class="te-switch"><input type="checkbox" checked><span class="te-slider"></span></label>
            </div>

            <!-- 3. Chỉ xuất phụ đề -->
            <div class="te-setting-item" style="border-bottom: 1px solid rgba(0,0,0,0.06); padding: 12px 16px;">
              <span style="font-size: 13.5px;">Chỉ xuất phụ đề</span>
              <label class="te-switch"><input type="checkbox"><span class="te-slider"></span></label>
            </div>

            <!-- 4. Xuất phụ đề -->
            <div class="te-setting-item" style="border-bottom: 1px solid rgba(0,0,0,0.06); padding: 12px 16px;">
              <span style="font-size: 13.5px;">Xuất phụ đề</span>
              <label class="te-switch"><input type="checkbox" checked><span class="te-slider"></span></label>
            </div>

            <!-- 5. Hiển thị thời gian -->
            <div class="te-setting-item" style="padding: 12px 16px;">
              <span style="font-size: 13.5px;">Hiển thị thời gian</span>
              <label class="te-switch"><input type="checkbox" checked><span class="te-slider"></span></label>
            </div>
          </div>

          <!-- Nút bấm Xuất Phụ Đề Tím -->
          <button class="te-export-submit-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><polyline points="12 12 12 16 12 12"/><path d="M12 12l-3 3M12 12l3 3"/></svg>
            <span>Xuất phụ đề</span>
          </button>

        </div>
      </div>
    </div>
  </div>
`;
