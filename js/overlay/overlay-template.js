// Giao diện keepit: CSS và markup lấy từ file UI gốc (chỉ thêm phần bổ sung chức năng và sidebar v1.4)
const OVERLAY_CSS = `
    * {
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

    /* Main Container */
    #keepit-exact-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      display: flex;
      z-index: 999998;
      scrollbar-width: auto;
      scrollbar-color: auto;
      background-color: #0b0b0b;
      transition: none;
    }

    /* --- LIGHT THEME (DEFAULT) --- */
    #keepit-exact-overlay.theme-light {
      background-color: #f8f9fa;
      color: #1f2937;
    }
    #keepit-exact-overlay.theme-light .te-left-section { background-color: #ffffff; }
    #keepit-exact-overlay.theme-light .te-sub-container { background-color: transparent;}
    #keepit-exact-overlay.theme-light .te-sub-en { color: #ff0000; }
    #keepit-exact-overlay.theme-light .te-sub-vi { color: #4b5563; }
    #keepit-exact-overlay.theme-light .te-control-bar { background-color: #ffffff; }
    #keepit-exact-overlay.theme-light .te-right-sidebar { background-color: #ffffff; border-left: 1px solid #e5e7eb; }
    #keepit-exact-overlay.theme-light .te-sidebar-top { border-bottom: 1px solid #e5e7eb; color: #111827; }
    #keepit-exact-overlay.theme-light .te-ts-row:hover { background-color: #f3f4f6; }
    #keepit-exact-overlay.theme-light .te-ts-row.active { background-color: #fef3c7; }
    #keepit-exact-overlay.theme-light .te-ts-row.active .te-ts-en,
    #keepit-exact-overlay.theme-light .te-ts-row.active .te-ts-time { color: #d97706; font-weight: 600; }
    #keepit-exact-overlay.theme-light .te-ts-en { color: #111827; }
    #keepit-exact-overlay.theme-light .te-ts-vi { color: #4b5563; }
    #keepit-exact-overlay.theme-light .te-modal-box { background-color: #ffffff; border: 1px solid #e5e7eb; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15); color: #1f2937; }
    #keepit-exact-overlay.theme-light .te-modal-header { border-bottom: 1px solid #e1e1e1; color: #111827; }
    #keepit-exact-overlay.theme-light .te-menu-row { color: #374151; border-bottom: 1px solid #f9fafb; }
    #keepit-exact-overlay.theme-light .te-menu-row:hover { background-color: #f9fafb; }
    #keepit-exact-overlay.theme-light .te-menu-right { color: #9ca3af; }
    #keepit-exact-overlay.theme-light .te-slider { background-color: #d1d5db; }
    #keepit-exact-overlay.theme-light input:checked + .te-slider { background-color: #8b5cf6; }
    #keepit-exact-overlay.theme-light .te-divider { background-color: #f3f4f6; }
    #keepit-exact-overlay.theme-light .te-setting-item { color: #1f2937; }
    #keepit-exact-overlay.theme-light .te-btn-group { background: #f3f4f6; }
    #keepit-exact-overlay.theme-light .te-btn-subopt { color: #4b5563; }
    #keepit-exact-overlay.theme-light .te-btn-subopt.active { background: #ffffff; color: #111827; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    #keepit-exact-overlay.theme-light .te-card-box { background: #ffffff; border: 1px solid #e5e7eb; }
    #keepit-exact-overlay.theme-light .te-input-select { background: #ffffff; border: 1px solid #e5e7eb; color: #1f2937; }
    #te-modal-lang .te-modal-box, #te-modal-lang .te-modal-body, #te-modal-lang .te-card-box { overflow: visible; }
    #keepit-exact-overlay.theme-light .te-language-picker-button { background: #fff; border: 1px solid #e5e7eb; color: #374151; }
    #keepit-exact-overlay.theme-light .te-language-picker-menu { background: #fff; border: 1px solid #e5e7eb; box-shadow: 0 8px 20px rgba(0,0,0,.15); }
    #keepit-exact-overlay.theme-light .te-language-picker-option { color: #374151; }
    #keepit-exact-overlay.theme-light .te-language-picker-option:hover,
    #keepit-exact-overlay.theme-light .te-language-picker-option[aria-selected="true"] { background: #f3f4f6; }

    /* --- DARK THEME --- */
    #keepit-exact-overlay.theme-dark {
      background-color: #0b0b0b;
      color: #f3f4f6;
    }
    #keepit-exact-overlay.theme-dark .te-left-section { background-color: #121212; }
    #keepit-exact-overlay.theme-dark .te-sub-container { background-color: transparent; }
    #keepit-exact-overlay.theme-dark .te-sub-en { color: #ffff00; }
    #keepit-exact-overlay.theme-dark .te-sub-vi { color: #d1d5db; }
    #keepit-exact-overlay.theme-dark .te-control-bar { background-color: #0f0f0f;}
    #keepit-exact-overlay.theme-dark .te-right-sidebar { background-color: #121212; border-left: 1px solid #222; }
    #keepit-exact-overlay.theme-dark .te-sidebar-top { border-bottom: 1px solid #222; color: #ffffff; }
    #keepit-exact-overlay.theme-dark .te-ts-row:hover { background-color: #1f1f23; }
    #keepit-exact-overlay.theme-dark .te-ts-row.active { background-color: #231f16; }
    #keepit-exact-overlay.theme-dark .te-ts-row.active .te-ts-en,
    #keepit-exact-overlay.theme-dark .te-ts-row.active .te-ts-time { color: #f59e0b; font-weight: 600; }
    #keepit-exact-overlay.theme-dark .te-ts-en { color: #f4f4f5; }
    #keepit-exact-overlay.theme-dark .te-ts-vi { color: #9ca3af; }
    #keepit-exact-overlay.theme-dark .te-modal-box { background-color: #18181b; border: 1px solid #27272a; box-shadow: 0 20px 35px rgba(0,0,0,0.7); color: #f3f4f6; }
    #keepit-exact-overlay.theme-dark .te-modal-header { border-bottom: 1px solid #27272a; color: #f3f4f6; }
    #keepit-exact-overlay.theme-dark .te-menu-row { color: #e4e4e7; border-bottom: 1px solid #222225; }
    #keepit-exact-overlay.theme-dark .te-menu-row:hover { background-color: #222226; }
    #keepit-exact-overlay.theme-dark .te-menu-right { color: #71717a; }
    #keepit-exact-overlay.theme-dark .te-slider { background-color: #3f3f46; }
    #keepit-exact-overlay.theme-dark input:checked + .te-slider { background-color: #8b5cf6; }
    #keepit-exact-overlay.theme-dark .te-divider { background-color: #27272a; }
    #keepit-exact-overlay.theme-dark .te-setting-item { color: #f3f4f6; }
    #keepit-exact-overlay.theme-dark .te-btn-group { background: #27272a; }
    #keepit-exact-overlay.theme-dark .te-btn-subopt { color: #a1a1aa; }
    #keepit-exact-overlay.theme-dark .te-btn-subopt.active { background: #3f3f46; color: #fff; }
    #keepit-exact-overlay.theme-dark .te-card-box { background: #27272a; border: 1px solid #3f3f46; }
    #keepit-exact-overlay.theme-dark .te-input-select { background: #27272a; border: 1px solid #3f3f46; color: #f3f4f6; }
    #keepit-exact-overlay.theme-dark .te-language-picker-button { background: #27272a; border: 1px solid #3f3f46; color: #f3f4f6; }
    #keepit-exact-overlay.theme-dark .te-language-picker-menu { background: #27272a; border: 1px solid #3f3f46; box-shadow: 0 8px 20px rgba(0,0,0,.55); }
    #keepit-exact-overlay.theme-dark .te-language-picker-option { color: #f3f4f6; }
    #keepit-exact-overlay.theme-dark .te-language-picker-option:hover,
    #keepit-exact-overlay.theme-dark .te-language-picker-option[aria-selected="true"] { background: #3f3f46; }

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
    }

    .te-subtitle-drag-handle { display: none; }

    .te-sub-container {
      min-height: 140px;
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
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

    /* Symmetric tracks and centered alignment keep play at the bar's geometric midpoint. */
    .te-control-bar {
      height: 70px;
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr)) 34px repeat(2, minmax(0, 1fr));
      column-gap: 8px;
      align-items: center;
      padding: 0 16px;
      position: absolute;
      left: 0;
      bottom: 0;
      width: 100%;
      box-sizing: border-box;
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

    .te-control-leading-group { grid-column: 1; min-width: 0; }
    .te-control-transport-left { grid-column: 2; justify-content: flex-end; min-width: 0; }
    #te-control-play { grid-column: 3; justify-self: center; }
    .te-control-transport-right { grid-column: 4; justify-content: flex-start; min-width: 0; }
    .te-control-trailing-group { grid-column: 5; justify-content: flex-end; min-width: 0; }
    .te-control-leading-group > .te-icon-btn { flex: 0 0 auto; }

    .te-yt-logo-box {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1 1 170px;
      width: auto;
      font-size: 13.5px;
      font-weight: 500;
      max-width: 170px;
      min-width: 0;
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

    /* Tiêu đề dài bị cắt thì chạy vòng tròn nối đuôi khi hover (JS nhân đôi chữ, đặt --te-title-shift/--te-title-dur và class te-title-run) */
    .te-video-title-label { flex: 1 1 auto; min-width: 0; overflow: hidden; }
    .te-video-title-text { display: inline-block; white-space: nowrap; }
    .te-video-title-text .te-title-dup { margin-left: 32px; }
    .te-yt-logo-box:hover .te-video-title-text.te-title-run {
      animation: teTitleRun var(--te-title-dur, 6s) linear infinite;
    }
    @keyframes teTitleRun {
      from { transform: translateX(0); }
      to { transform: translateX(calc(-1 * var(--te-title-shift, 0px))); }
    }
    @media (prefers-reduced-motion: reduce) {
      .te-yt-logo-box:hover .te-video-title-text.te-title-run { animation: none; }
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

    .te-video-mode-selector { position: relative; display: flex; align-items: center; }
    .te-video-mode-menu {
      position: absolute; left: 50%; right: auto; bottom: calc(100% + 10px); z-index: 1000003;
      transform: translateX(-50%);
      display: grid; gap: 0; width: min(214px, calc(100vw - 24px)); padding: 6px;
      border: 1px solid #27272a; border-radius: 12px; background: #18181b;
      color: #f3f4f6; box-shadow: 0 20px 35px rgba(0,0,0,.7);
    }
    .te-video-mode-menu[hidden] { display: none !important; }
    #keepit-exact-overlay.theme-light .te-video-mode-menu {
      border-color: #e5e7eb; background: #fff; color: #1f2937; box-shadow: 0 10px 30px rgba(0,0,0,.15);
    }
    .te-video-mode-option {
      display: flex; width: 100%; min-height: 46px; align-items: center; gap: 12px;
      padding: 8px 12px; border: 0; border-radius: 8px; background: transparent;
      color: inherit; font: inherit; font-size: 14px; text-align: left; cursor: pointer;
    }
    .te-video-mode-option svg { flex: none; width: 18px; height: 18px; color: #a3a3a3; }
    #keepit-exact-overlay.theme-light .te-video-mode-option svg { color: #6b7280; }
    .te-video-mode-option:hover { background: rgba(128,128,128,.16); }
    .te-video-mode-option.is-selected { background: rgba(128,128,128,.12); }
    .te-video-mode-option.is-selected svg { color: #fbbf24; }
    #keepit-exact-overlay.theme-light .te-video-mode-option.is-selected svg { color: #b45309; }
    .te-video-mode-option .te-video-mode-label { flex: 1; }
    .te-video-mode-option kbd {
      min-width: 20px; padding: 2px 5px; border: 1px solid #525252; border-radius: 5px;
      background: rgba(255,255,255,.06); color: #d4d4d4; font: inherit; font-size: 11px; line-height: 1.3; text-align: center;
    }
    #keepit-exact-overlay.theme-light .te-video-mode-option kbd {
      border-color: #d1d5db; background: #f9fafb; color: #6b7280;
    }
    .te-video-mode-trigger svg { display: block; width: 18px; height: 18px; }

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
      padding: 4px 0;
      max-height: 520px;
      overflow-y: auto;
      scrollbar-width: auto;
      scrollbar-color: auto;
    }
    #keepit-exact-overlay #te-modal-main #te-reading-width-hint { display: none !important; }
    #keepit-exact-overlay::-webkit-scrollbar,
    #keepit-exact-overlay *::-webkit-scrollbar { width: var(--lhn-scrollbar-width); height: var(--lhn-scrollbar-width); }
    .te-modal-body::-webkit-scrollbar-track { background: transparent; }
    .te-modal-body::-webkit-scrollbar-thumb { background: #8b70e8a8; border-radius: 999px; }

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
    #keepit-exact-overlay.theme-dark .te-modal-back-icon {
      border-color: #3f3f46; background: #27272a; color: #a1a1aa;
    }

    .te-setting-section-title { padding: 12px 20px 10px 20px; font-size: 14px; font-weight: 500; color: #6b7280; }
    .te-setting-item { padding: 8px 20px; display: flex; align-items: center; justify-content: space-between; font-size: 14px; }
    
    .te-btn-group { display: flex; border-radius: 10px; padding: 3px; gap: 2px; width: 100%; background: #f3f4f6; }
    #keepit-exact-overlay.theme-dark .te-btn-group { background: #27272a; }

    .te-btn-subopt { padding: 8px 12px; font-size: 13.5px; border: none; background: transparent; cursor: pointer; border-radius: 8px; flex: 1; text-align: center; color: #6b7280; font-weight: 500; }
    .te-btn-subopt.active { background: #ffffff; color: #111827; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    #keepit-exact-overlay.theme-dark .te-btn-subopt.active { background: #3f3f46; color: #ffffff; }

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
    .te-theater-subtitle-color-pill {
      position: relative; display: inline-flex; align-items: center; justify-content: center;
      width: 32px; height: 18px; border: 1px solid rgba(128,128,128,.35);
      border-radius: 6px; cursor: pointer;
    }
    .te-theater-subtitle-opacity-control { display: flex; align-items: center; gap: 8px; min-width: 150px; }
    .te-theater-subtitle-opacity-control input { width: 108px; accent-color: #8b5cf6; cursor: pointer; }
    .te-theater-subtitle-opacity-control output { min-width: 34px; color: #6b7280; font-size: 12px; text-align: right; }
    #keepit-exact-overlay.theme-dark .te-theater-subtitle-opacity-control output { color: #a1a1aa; }

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
    #keepit-exact-overlay.theme-dark .te-counter-btn { background: #3f3f46; color: #f3f4f6; }

    /* Export Modal Specific Styles */
    .te-export-tab-group {
      display: flex;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      overflow: hidden;
      margin: 12px 20px 16px 20px;
    }
    #keepit-exact-overlay.theme-dark .te-export-tab-group {
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
    #keepit-exact-overlay.theme-dark .te-export-tab {
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
    #keepit-exact-overlay.theme-dark .te-export-tab.active {
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
    #keepit-exact-overlay.te-hidden { display: none !important; }
    #keepit-exact-overlay.te-learning-entry-pending { visibility: hidden !important; }
    #keepit-exact-overlay.te-controls-hidden .te-control-bar { opacity: 0; transition: opacity 0.2s; }
    #keepit-exact-overlay.te-controls-hidden .te-control-bar:hover,
    #keepit-exact-overlay.te-controls-hidden .te-control-bar:focus-within { opacity: 1; }
    #keepit-exact-overlay.te-subs-hidden .te-sub-container { display: none; }
    #keepit-exact-overlay.te-sidebar-hidden .yt-dual-right-sidebar { display: none; }
    #keepit-exact-overlay .te-icon-btn.te-active { color: #8b5cf6; }
    #keepit-exact-overlay .te-video-slot :is(video, .te-web-page-thumbnail) {
      cursor: default;
      position: absolute !important;
      inset: 0;
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
      width: 100% !important;
      height: 100% !important;
      object-fit: contain;
      transform: none !important;
      background: #111;
    }
    #keepit-exact-overlay .te-video-slot .te-web-page-thumbnail { cursor: default; user-select: none; }
    #keepit-exact-overlay.hide-vi .te-sub-vi,
    #keepit-exact-overlay.hide-vi .yt-dual-item-vi { display: none; }
    .yt-dual-empty { padding: 16px; font-size: 13px; color: #9ca3af; }

    /* ===== Sidebar theo v1.4 ===== */
/* Right Sidebar (Full Transcript) */
.yt-dual-right-sidebar {
  width: 400px;
  height: 100%;
  background-color: #121212;
  display: flex;
  flex-direction: column;
}

.yt-dual-sidebar-header {
  padding: 10px 16px;
  border-bottom: 1px solid #282828;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  font-size: 16px;
}

.yt-dual-sidebar-header > span {
  display: flex;
  align-items: center;
  gap: 8px;
}

.te-sidebar-logo { flex-shrink: 0; display: block; }

/* Chữ canh theo chiều cao chữ hoa nên không bị thấp do metrics font; trình duyệt chưa hỗ trợ thì nhích lên nhẹ */
.te-sidebar-title { display: block; line-height: 1.2; }
@supports (text-box: trim-both cap alphabetic) {
  .te-sidebar-title { text-box: trim-both cap alphabetic; }
}
@supports not (text-box: trim-both cap alphabetic) {
  .te-sidebar-title { transform: translateY(-1.5px); }
}

.yt-dual-close-btn {
  background: none;
  border: none;
  color: #aaa;
  font-size: 22px;
  cursor: pointer;
  margin-right: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.yt-dual-close-btn svg { display: block; width: 22px; height: 22px; }

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
  box-shadow: inset 4px 0 0 rgba(139, 92, 246, 0);
  transition: background-color 0.3s ease, box-shadow 0.3s ease;
  display: flex;
  gap: 12px;
}

.yt-dual-item:hover {
  background-color: #272727;
}

.yt-dual-item.active {
  background-color: #2e2640;
  box-shadow: inset 4px 0 0 #8b5cf6;
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
#keepit-exact-overlay.theme-light { --te-side-en-color: #111827; --te-side-vi-color: #4b5563; }
#keepit-exact-overlay.theme-light .yt-dual-right-sidebar { background-color: #ffffff; border-left: 1px solid #e5e7eb; }
#keepit-exact-overlay.theme-light .yt-dual-sidebar-header { border-bottom: 1px solid #e5e7eb; color: #111827; }
#keepit-exact-overlay.theme-light .yt-dual-close-btn { color: #6b7280; }
#keepit-exact-overlay.theme-light .yt-dual-close-btn:hover { color: #111827; }
#keepit-exact-overlay.theme-light .yt-dual-item:hover { background-color: #f3f4f6; }
#keepit-exact-overlay.theme-light .yt-dual-item { box-shadow: inset 4px 0 0 rgba(217, 119, 6, 0); }
#keepit-exact-overlay.theme-light .yt-dual-item.active { background-color: #fef3c7; box-shadow: inset 4px 0 0 #d97706; }
#keepit-exact-overlay.theme-light .yt-dual-timestamp { color: #7c3aed; }
#keepit-exact-overlay.theme-light .yt-dual-empty { color: #6b7280; }

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
    /* Sidebar transcript: Lớn 30%, Vừa 40%, Nhỏ 50% chiều rộng overlay. */
    #keepit-exact-overlay .yt-dual-right-sidebar { width: 30vw; flex-shrink: 0; }
    #keepit-exact-overlay .te-left-section { flex: none; width: 70vw; }
    #keepit-exact-overlay.size-s .yt-dual-right-sidebar { width: 50vw; }
    #keepit-exact-overlay.size-s .te-left-section { width: 50vw; }
    #keepit-exact-overlay.size-m .yt-dual-right-sidebar { width: 40vw; }
    #keepit-exact-overlay.size-m .te-left-section { width: 60vw; }
    #keepit-exact-overlay.te-sidebar-hidden .te-left-section { width: 100vw; }

    /* Reading mode: compact video at left, full transcript in the center, controls across the bottom. */
    #keepit-exact-overlay.te-reading-mode .te-left-section {
      flex: 0 0 26vw;
      width: 26vw !important;
      min-width: 0;
      box-sizing: border-box;
      position: static;
      padding: 14px 28px 78px 16px;
    }
    #keepit-exact-overlay.te-reading-mode .te-video-slot {
      width: 100%;
      max-height: calc(100vh - 220px);
      border-radius: 10px;
    }
    #keepit-exact-overlay.te-reading-mode .te-sub-container { display: none !important; }
    #keepit-exact-overlay.te-reading-mode .yt-dual-right-sidebar {
      position: absolute;
      top: 0;
      left: 27.5vw;
      z-index: 2;
      display: flex !important;
      flex: 0 0 45vw;
      width: 45vw !important;
      height: 100%;
      min-width: 0;
      box-sizing: border-box;
      border-left: 0;
      background: transparent;
    }
    #keepit-exact-overlay.te-reading-mode .yt-dual-sidebar-header {
      position: fixed;
      z-index: 20;
      top: 8px;
      right: 12px;
      width: 40px;
      height: 40px;
      box-sizing: border-box;
      padding: 0;
      justify-content: center;
      border: 0;
      background: transparent;
    }
    #keepit-exact-overlay.te-reading-mode .yt-dual-sidebar-header > span { display: none; }
    #keepit-exact-overlay.te-reading-mode .yt-dual-actions { justify-content: center; }
    #keepit-exact-overlay.te-reading-mode .yt-dual-transcript-list {
      min-height: 0;
      padding: 34px 20px 82px;
      scrollbar-gutter: stable;
    }
    #keepit-exact-overlay.te-reading-mode .te-control-bar {
      position: absolute;
      z-index: 15;
      left: 0;
      bottom: 0;
      width: 100%;
      box-sizing: border-box;
    }
    #keepit-exact-overlay .te-floating-btn { display: none !important; }
    @media (max-width: 900px) {
      #keepit-exact-overlay.te-reading-mode .te-left-section {
        padding-right: 14px;
        padding-left: 12px;
      }
      #keepit-exact-overlay.te-reading-mode .yt-dual-transcript-list { padding-right: 12px; padding-left: 12px; }
    }
    /* One shared Keepit brand node: visible over the video in Reading and expanded Dictation modes. */
    /* Brand dimensions scale with the rendered video-slot width; at 400px the current sizing is preserved. */
    #keepit-exact-overlay .te-dict-brand {
      position: absolute;
      top: 3cqw;
      left: 3cqw;
      z-index: 3;
      display: none;
      align-items: center;
      gap: 1.25cqw;
      max-width: calc(100% - 6cqw);
      padding: 1.25cqw 2.25cqw 1.25cqw 1.5cqw;
      border: .25cqw solid rgba(255, 255, 255, .18);
      border-radius: 2.25cqw;
      background: rgba(10, 13, 23, .72);
      color: #fff;
      box-shadow: 0 .5cqw 2cqw rgba(0, 0, 0, .24);
      backdrop-filter: blur(2cqw);
      font-size: 3.25cqw;
      font-weight: 650;
      line-height: 1;
      pointer-events: none;
      user-select: none;
    }
    #keepit-exact-overlay.te-reading-mode:not(.te-reading-audio-compact) .te-dict-brand,
    #keepit-exact-overlay.te-dictation-active:not(.te-dict-video-compact) .te-dict-brand { display: flex; }
    #keepit-exact-overlay .te-dict-brand img { display: block; flex: 0 0 5cqw; width: 5cqw; height: 5cqw; border-radius: 1.25cqw; object-fit: cover; }
    #keepit-exact-overlay .te-dict-brand-separator { opacity: .78; font-weight: 500; }

    /* Reading-mode video ↔ mini-audio control (separate from Dictation's existing control). */
    #keepit-exact-overlay .yt-dual-sidebar-header .te-dict-video-toggle {
      display: none;
      flex: 0 0 34px;
      align-items: center;
      justify-content: center;
      width: 34px;
      height: 34px;
      padding: 0;
      border: 1px solid rgba(148, 163, 184, .35);
      border-radius: 9px;
      background: transparent;
      color: #a1a1aa;
      cursor: pointer;
      transition: background .2s ease, color .2s ease, border-color .2s ease, transform .2s ease;
    }
    #keepit-exact-overlay.te-reading-mode .yt-dual-sidebar-header .te-dict-video-toggle { display: inline-flex; }
    #keepit-exact-overlay .yt-dual-sidebar-header .te-dict-video-toggle:hover { border-color: #8b5cf6; background: rgba(139, 92, 246, .1); color: #c4b5fd; }
    #keepit-exact-overlay .yt-dual-sidebar-header .te-dict-video-toggle:active { transform: scale(.94); }
    #keepit-exact-overlay .yt-dual-sidebar-header .te-dict-video-toggle svg { width: 18px; height: 18px; }
    #keepit-exact-overlay.theme-light .yt-dual-sidebar-header .te-dict-video-toggle { color: #6b7280; }
    #keepit-exact-overlay.theme-light .yt-dual-sidebar-header .te-dict-video-toggle:hover { color: #7c3aed; }
    #keepit-exact-overlay.te-reading-mode .yt-dual-sidebar-header { width: 80px; }
    #keepit-exact-overlay.te-reading-mode .yt-dual-actions { gap: 6px; justify-content: flex-end; }
    #keepit-exact-overlay.te-reading-mode .yt-dual-close-btn { width: 34px; height: 34px; margin-right: 0; border-radius: 9px; }

    #keepit-exact-overlay .te-reading-mini-audio {
      position: absolute;
      inset: 0 4px;
      z-index: 2;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 0 16px;
      overflow: hidden;
      border: 1px solid rgba(168, 85, 247, .35);
      border-radius: 16px;
      background: linear-gradient(135deg, rgba(21, 28, 44, .97), rgba(15, 23, 42, .99));
      color: #f8fafc;
      box-shadow: 0 12px 28px rgba(124, 58, 237, .22);
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
      transform: scale(.98);
      transition: opacity .3s ease, transform .4s cubic-bezier(.16, 1, .3, 1), visibility 0s linear .3s;
    }
    #keepit-exact-overlay.te-reading-mode.te-reading-audio-compact .te-video-slot {
      flex: 0 0 84px;
      height: 84px;
      min-height: 84px;
      max-height: none;
      aspect-ratio: auto;
      overflow: hidden;
      border: 0;
      border-radius: 0;
      background: transparent;
      box-shadow: none;
    }
    #keepit-exact-overlay.te-reading-mode.te-reading-audio-compact .te-video-slot video {
      opacity: 0 !important;
      pointer-events: none !important;
    }
    #keepit-exact-overlay.te-reading-mode.te-reading-audio-compact .te-reading-mini-audio {
      opacity: 1;
      visibility: visible;
      pointer-events: auto;
      transform: scale(1);
      transition: opacity .3s ease, transform .4s cubic-bezier(.16, 1, .3, 1), visibility 0s;
    }
    #keepit-exact-overlay .te-reading-mini-art {
      display: flex;
      flex: 0 0 48px;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      overflow: hidden;
      border-radius: 12px;
      background: linear-gradient(135deg, #7c3aed, #312e81);
      box-shadow: 0 6px 14px rgba(0, 0, 0, .35);
    }
    #keepit-exact-overlay .te-reading-mini-thumb { display: block; width: 100%; height: 100%; object-fit: cover; }
    #keepit-exact-overlay .te-reading-mini-thumb[hidden] { display: none !important; }
    #keepit-exact-overlay .te-reading-mini-info { display: flex; flex: 1 1 auto; min-width: 0; flex-direction: column; gap: 3px; }
    #keepit-exact-overlay .te-reading-mini-title { overflow: hidden; color: #f8fafc; font-size: 13px; font-weight: 650; text-overflow: ellipsis; white-space: nowrap; }
    #keepit-exact-overlay .te-reading-mini-source { color: #c4b5fd; font-size: 11px; font-weight: 500; }
    #keepit-exact-overlay .te-reading-mini-spectrum { display: flex; flex: 0 0 auto; align-items: center; gap: 3px; height: 26px; padding: 0 4px; }
    #keepit-exact-overlay .te-reading-mini-spectrum span { width: 3px; height: 6px; border-radius: 99px; background: linear-gradient(135deg, #a855f7, #6366f1); box-shadow: 0 0 8px rgba(168, 85, 247, .5); }
    #keepit-exact-overlay .te-reading-mini-audio.playing .te-reading-mini-spectrum span { animation: teReadingSpectrumWave 1s ease-in-out infinite alternate; }
    #keepit-exact-overlay .te-reading-mini-audio.playing .te-reading-mini-spectrum span:nth-child(2) { animation-delay: .18s; }
    #keepit-exact-overlay .te-reading-mini-audio.playing .te-reading-mini-spectrum span:nth-child(3) { animation-delay: .36s; }
    #keepit-exact-overlay .te-reading-mini-audio.playing .te-reading-mini-spectrum span:nth-child(4) { animation-delay: .12s; }
    #keepit-exact-overlay .te-reading-mini-audio.playing .te-reading-mini-spectrum span:nth-child(5) { animation-delay: .28s; }
    @keyframes teReadingSpectrumWave { from { height: 6px; } to { height: 23px; } }
    #keepit-exact-overlay .te-reading-mini-play {
      display: inline-flex;
      flex: 0 0 40px;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border: 0;
      border-radius: 50%;
      background: linear-gradient(135deg, #a855f7, #6366f1);
      color: #fff;
      cursor: pointer;
      box-shadow: 0 6px 18px rgba(124, 58, 237, .42);
    }
    #keepit-exact-overlay .te-reading-mini-play svg { width: 19px; height: 19px; }
    @media (prefers-reduced-motion: reduce) {
      #keepit-exact-overlay .te-reading-mini-audio,
      #keepit-exact-overlay .yt-dual-sidebar-header .te-dict-video-toggle { transition-duration: .01ms; }
      #keepit-exact-overlay .te-reading-mini-audio.playing .te-reading-mini-spectrum span { animation: none; }
    }
    @media (max-width: 520px) {
      #keepit-exact-overlay .te-reading-mini-audio { gap: 8px; padding: 0 10px; }
      #keepit-exact-overlay .te-reading-mini-art { flex-basis: 42px; width: 42px; height: 42px; }
      #keepit-exact-overlay .te-reading-mini-spectrum { display: none; }
    }

    /* Reading view: fixed viewport widths and independent centering for the transcript frame. */
    #keepit-exact-overlay.te-reading-mode.size-s .te-left-section { flex-basis: 32vw; width: 32vw !important; }
    #keepit-exact-overlay.te-reading-mode.size-m .te-left-section { flex-basis: 26vw; width: 26vw !important; }
    #keepit-exact-overlay.te-reading-mode.size-l .te-left-section { flex-basis: 20vw; width: 20vw !important; }
    #keepit-exact-overlay.te-reading-mode.size-s .yt-dual-right-sidebar { left: 32.5vw; flex: 0 0 35vw; width: 35vw !important; }
    #keepit-exact-overlay.te-reading-mode.size-m .yt-dual-right-sidebar { left: 27.5vw; flex: 0 0 45vw; width: 45vw !important; }
    #keepit-exact-overlay.te-reading-mode.size-l .yt-dual-right-sidebar { left: 20vw; flex: 0 0 60vw; width: 60vw !important; }

    /* Video: rộng theo cột trái, cao theo đúng tỉ lệ thật của video (--te-video-aspect do JS set),
       chặn trên để vùng phụ đề luôn còn tối thiểu 140px + 60px control bar. */
    #keepit-exact-overlay .te-video-slot {
      container-type: inline-size;
      flex: none;
      width: 100%;
      height: auto;
      aspect-ratio: var(--te-video-aspect, 16 / 9);
      max-height: calc(100vh - 200px);
      border-radius: 12px;
    }
    /* ===== Popup tốc độ (từ speed_control_component): hai mode sáng/tối ===== */
    #te-speed-popup { position: absolute; left: 0; top: 0; z-index: 60; width: 340px; padding: 20px; border-radius: 24px; border: 1px solid #f3f4f6; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); background: #ffffff; user-select: none; font-family: var(--lhn-app-font-family, 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif); }
    #te-speed-popup.hidden { display: none !important; }
    #te-speed-popup .te-speed-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    #te-speed-popup .te-speed-title { font-size: 16px; font-weight: 600; color: #1f2937; }
    #te-speed-popup #te-speed-value { font-size: 18px; font-weight: 700; letter-spacing: -0.02em; color: #111827; }
    #te-speed-popup .te-speed-row { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
    #te-speed-popup .te-speed-step { width: 36px; height: 36px; border-radius: 9999px; border: none; background: #f3f4f6; color: #1f2937; font-weight: 700; font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background-color .2s, transform .1s; }
    #te-speed-popup .te-speed-step:hover { background: #e5e7eb; }
    #te-speed-popup .te-speed-step:active { transform: scale(0.95); }
    #te-speed-popup .te-speed-slider-wrap { flex: 1; padding: 0 4px; display: flex; align-items: center; }
    #te-speed-popup #te-speed-slider { -webkit-appearance: none; appearance: none; width: 100%; background: transparent; margin: 0; }
    #te-speed-popup #te-speed-slider:focus { outline: none; }
    #te-speed-popup #te-speed-slider::-webkit-slider-runnable-track { width: 100%; height: 6px; border-radius: 9999px; background: #E5E7EB; cursor: pointer; }
    #te-speed-popup #te-speed-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 24px; height: 24px; border-radius: 50%; background: #000000; margin-top: -9px; cursor: pointer; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.15), 0 2px 4px -1px rgba(0,0,0,0.1); }
    #te-speed-popup #te-speed-slider::-moz-range-track { width: 100%; height: 6px; border-radius: 9999px; background: #E5E7EB; cursor: pointer; }
    #te-speed-popup #te-speed-slider::-moz-range-thumb { width: 24px; height: 24px; border-radius: 50%; border: none; background: #000000; cursor: pointer; }
    #te-speed-popup .te-speed-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
    #te-speed-popup .te-speed-btn { height: 44px; border-radius: 9999px; border: none; background: #f3f4f6; color: #374151; font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background-color .2s; }
    #te-speed-popup .te-speed-btn:hover { background: #e5e7eb; }
    #te-speed-popup .te-speed-btn.te-speed-normal { flex-direction: column; line-height: 1.1; font-weight: 800; text-align: center; padding: 0 4px; }
    #te-speed-popup .te-speed-btn.active { background: #7000FF; color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    #keepit-exact-overlay.theme-dark #te-speed-popup { background: #151517; border-color: rgba(31,41,55,0.8); }
    #keepit-exact-overlay.theme-dark #te-speed-popup .te-speed-title { color: #e5e7eb; }
    #keepit-exact-overlay.theme-dark #te-speed-popup #te-speed-value { color: #ffffff; }
    #keepit-exact-overlay.theme-dark #te-speed-popup .te-speed-step { background: #222225; color: #e5e7eb; }
    #keepit-exact-overlay.theme-dark #te-speed-popup .te-speed-step:hover { background: #374151; }
    #keepit-exact-overlay.theme-dark #te-speed-popup #te-speed-slider::-webkit-slider-runnable-track { background: #374151; }
    #keepit-exact-overlay.theme-dark #te-speed-popup #te-speed-slider::-webkit-slider-thumb { background: #ffffff; }
    #keepit-exact-overlay.theme-dark #te-speed-popup #te-speed-slider::-moz-range-track { background: #374151; }
    #keepit-exact-overlay.theme-dark #te-speed-popup #te-speed-slider::-moz-range-thumb { background: #ffffff; }
    #keepit-exact-overlay.theme-dark #te-speed-popup .te-speed-btn { background: #222225; color: #d1d5db; }
    #keepit-exact-overlay.theme-dark #te-speed-popup .te-speed-btn:hover { background: #374151; }
    #keepit-exact-overlay.theme-dark #te-speed-popup .te-speed-btn.active { background: #FACC15; color: #000000; }
    /* Nhãn tốc độ hiện tại bên phải nút Tốc độ (cùng cỡ chữ với giá trị trong popup) */
    .te-speed-label { font-family: var(--lhn-app-font-family, 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif); font-size: 14px; font-weight: 200; letter-spacing: -0.02em; margin-left: 4px; min-width: 52px; text-align: left; color: inherit; white-space: nowrap; }
    /* ===== Tùy chọn phụ đề: không scroll, phụ đề thanh bên ===== */
    #keepit-exact-overlay .yt-dual-item-en {
      font-size: var(--te-side-en, 18px); color: var(--te-side-en-color, #e5e7eb);
      font-family: var(--te-subtitle-font-family, inherit); font-weight: var(--te-subtitle-en-weight, inherit);
    }
    #keepit-exact-overlay .yt-dual-item-vi {
      font-size: var(--te-side-vi, 16.2px); color: var(--te-side-vi-color, #9ca3af);
      font-family: var(--te-subtitle-font-family, inherit); font-weight: var(--te-subtitle-vi-weight, inherit);
    }
    #keepit-exact-overlay.te-reading-mode .yt-dual-item-en { color: var(--te-reading-en-color, inherit); }
    #keepit-exact-overlay.te-reading-mode .yt-dual-item-vi { color: var(--te-reading-vi-color, inherit); }

    /* ===== Ambient mode: màu video lan tròn từ tâm video, mờ dần ra thanh điều khiển và thanh bên ===== */
    .te-ambient-layer { position: absolute; inset: 0; overflow: hidden; z-index: -1; pointer-events: none; }
    .te-ambient {
      position: absolute;
      left: var(--te-amb-x, 35%);
      top: var(--te-amb-y, 30%);
      width: calc(var(--te-amb-size, 100vw)*16/9);
      height: var(--te-amb-size, 100vw);
      transform: translate(-50%, -50%);
      filter: blur(40px) saturate(1.8);
      -webkit-mask-image: radial-gradient(ellipse closest-side, #000 20%, rgba(0, 0, 0, 0.55) 55%, transparent 100%);
      mask-image: radial-gradient(ellipse closest-side, #000 20%, rgba(0, 0, 0, 0.55) 55%, transparent 100%);
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.6s ease, visibility 0s linear 0.6s;
    }
    #keepit-exact-overlay.te-ambient-on .te-ambient { opacity: 0.5; visibility: visible; transition: opacity 0.6s ease; }
    .te-ambient-edge { position: absolute; left: var(--te-edge-l, 0px); top: var(--te-edge-t, 0px); width: var(--te-edge-w, 0px); height: var(--te-edge-h, 0px); filter: blur(40px) saturate(1.8); visibility: hidden; pointer-events: none; }
    #keepit-exact-overlay.te-ambient-on.te-ambient-mode-2 .te-ambient-edge { visibility: visible; opacity: 0.6; transition: opacity 0.6s ease; }
    #keepit-exact-overlay.te-ambient-mode-2 .te-ambient { visibility: hidden; }
    #keepit-exact-overlay .te-btn-subopt:disabled { opacity: 0.4; cursor: not-allowed; }
    /* Bật ambient: nền gốc đặt ở root (giữ đúng màu sáng/tối cũ) để các vùng trong suốt lộ ánh sáng */
    #keepit-exact-overlay.te-ambient-on.theme-light { background-color: #ffffff; }
    #keepit-exact-overlay.te-ambient-on.theme-dark { background-color: #121212; }
    /* Chế độ rạp: video bo góc như chế độ kết hợp; ambient phủ kín toàn màn hình (cả 2 khung đen hai bên) */
    #keepit-exact-overlay.te-sidebar-hidden .te-video-slot { background-color: #11111100; border-radius: 12px; overflow: hidden; }
    #keepit-exact-overlay.te-sidebar-hidden .te-video-slot :is(video, .te-web-page-thumbnail) { border-radius: 12px; }
    /* Chế độ rạp: khung bọc đúng kích thước video, bo 4 góc. Ngoài chế độ rạp khung không tạo ô layout (display: contents) */
    #keepit-exact-overlay .te-video-frame { display: contents; }
    #keepit-exact-overlay.te-sidebar-hidden .te-video-frame { display: block; position: relative; border-radius: 12px; overflow: hidden; clip-path: inset(0 round 12px); }
    #keepit-exact-overlay.te-sidebar-hidden .te-video-frame :is(video, .te-web-page-thumbnail) { width: 100%; height: 100%; object-fit: contain; border-radius: 0; }
    /* Chỉ Rạp + Lớn: video, subtitle và control bar dùng ba lớp độc lập theo viewport/frame thật. */
    #keepit-exact-overlay.te-sidebar-hidden.size-l:not(.te-reading-mode):not(.te-dictation-active) .te-video-slot { overflow: visible; container-type: normal; }
    #keepit-exact-overlay.te-sidebar-hidden.size-l:not(.te-reading-mode):not(.te-dictation-active) .te-video-frame { position: fixed; inset: 0; margin: auto; z-index: 1; }
    #keepit-exact-overlay.te-sidebar-hidden.size-l:not(.te-reading-mode):not(.te-dictation-active) .te-control-bar {
      position: fixed; left: 0; right: 0; bottom: 0; width: 100vw; z-index: 4;
    }
    /* Chia sẻ style nền mờ (nền/blur/viền/bóng) của Rạp + Lớn với Reading khi Ambient bật; không đổi geometry Reading. */
    #keepit-exact-overlay.te-sidebar-hidden.size-l:not(.te-reading-mode):not(.te-dictation-active) .te-control-bar,
    #keepit-exact-overlay.te-reading-mode.te-ambient-on:not(.te-dictation-active) .te-control-bar {
      background-color: rgba(15, 15, 18, .58); backdrop-filter: blur(14px) saturate(140%);
      -webkit-backdrop-filter: blur(14px) saturate(140%);
      border-top: 1px solid rgba(255,255,255,.15); box-shadow: 0 -8px 24px rgba(0,0,0,.18);
    }
    #keepit-exact-overlay.theme-light.te-sidebar-hidden.size-l:not(.te-reading-mode):not(.te-dictation-active) .te-control-bar,
    #keepit-exact-overlay.theme-light.te-reading-mode.te-ambient-on:not(.te-dictation-active) .te-control-bar {
      background-color: rgba(248, 249, 250, .78); border-top-color: rgba(31,41,55,.12);
      box-shadow: 0 -8px 24px rgba(31,41,55,.1);
    }
    #keepit-exact-overlay .te-theater-subtitle-settings { display: none; }
    #keepit-exact-overlay.te-sidebar-hidden.size-l:not(.te-reading-mode):not(.te-dictation-active) .te-theater-subtitle-settings {
      display: block; margin-top: 10px;
    }
    #keepit-exact-overlay .te-subtitle-content { display: contents; }
    #keepit-exact-overlay.te-sidebar-hidden.size-l:not(.te-reading-mode):not(.te-dictation-active) .te-sub-container {
      position: fixed; left: 50%; top: var(--te-theater-subtitle-top, 82vh); z-index: 3;
      display: flex; flex: none; width: fit-content;
      max-width: min(80vw, var(--te-theater-subtitle-max-width, 80vw)); min-width: 0; min-height: 0;
      height: auto; padding: 12px 18px; gap: 2px; overflow: visible;
      transform: translate(-50%, -50%);
      border-radius: 16px; background-color: var(--te-theater-subtitle-background, rgba(0,0,0,.4));
    }
    #keepit-exact-overlay.te-sidebar-hidden.size-l:not(.te-reading-mode):not(.te-dictation-active) .te-subtitle-content {
      display: flex; flex: 0 1 auto; flex-direction: column; align-items: center; justify-content: center;
      min-width: 0; min-height: 0; width: fit-content; max-width: 100%;
      max-height: max(0px, calc(var(--te-theater-subtitle-max-height, calc(100vh - 100px)) - 24px));
      overflow: auto; overscroll-behavior: contain;
    }
    #keepit-exact-overlay.te-sidebar-hidden.size-l:not(.te-reading-mode):not(.te-dictation-active) .te-sub-en,
    #keepit-exact-overlay.te-sidebar-hidden.size-l:not(.te-reading-mode):not(.te-dictation-active) .te-sub-vi {
      max-width: 100%; overflow-wrap: anywhere;
    }
    #keepit-exact-overlay.te-sidebar-hidden.size-l:not(.te-reading-mode):not(.te-dictation-active) .te-sub-en { margin-bottom: 0; }
    #keepit-exact-overlay.te-sidebar-hidden.size-l:not(.te-reading-mode):not(.te-dictation-active) .te-subtitle-drag-handle {
      position: absolute; top: -24px; left: 50%; z-index: 1; display: inline-flex;
      width: 44px; height: 26px; align-items: center; justify-content: center;
      padding: 0; border: 1px solid rgba(255,255,255,.12); border-radius: 999px;
      background: rgba(0,0,0,.82); color: #d1d5db; cursor: grab;
      opacity: 0; pointer-events: none; transform: translateX(-50%);
      transition: opacity .15s ease;
      touch-action: none;
    }
    #keepit-exact-overlay.te-sidebar-hidden.size-l:not(.te-reading-mode):not(.te-dictation-active) .te-sub-container:hover .te-subtitle-drag-handle,
    #keepit-exact-overlay.te-sidebar-hidden.size-l:not(.te-reading-mode):not(.te-dictation-active) .te-sub-container:focus-within .te-subtitle-drag-handle,
    #keepit-exact-overlay.te-sidebar-hidden.size-l:not(.te-reading-mode):not(.te-dictation-active).te-theater-subtitle-dragging .te-subtitle-drag-handle {
      opacity: 1; pointer-events: auto;
    }
    #keepit-exact-overlay.te-sidebar-hidden.size-l:not(.te-reading-mode):not(.te-dictation-active) .te-subtitle-drag-handle:hover { background: rgba(0,0,0,.96); }
    #keepit-exact-overlay.te-sidebar-hidden.size-l:not(.te-reading-mode):not(.te-dictation-active) .te-subtitle-drag-handle:focus-visible { outline: 2px solid #a78bfa; outline-offset: 2px; }
    #keepit-exact-overlay.te-sidebar-hidden.size-l:not(.te-reading-mode):not(.te-dictation-active).te-theater-subtitle-dragging .te-subtitle-drag-handle { cursor: grabbing; }
    #keepit-exact-overlay.te-sidebar-hidden.te-ambient-on .te-ambient { -webkit-mask-image: none; mask-image: none; }
    #keepit-exact-overlay.te-ambient-on .te-left-section,
    #keepit-exact-overlay.te-ambient-on .te-control-bar,
    #keepit-exact-overlay.te-ambient-on .yt-dual-right-sidebar { background-color: transparent; }

    /* Subtitle display selector and four-mode menu. */
    .te-subtitle-mode-selector { position: relative; display: flex; align-items: center; }
    #keepit-exact-overlay.te-dictation-active .te-subtitle-mode-selector,
    #keepit-exact-overlay.te-dictation-active #open-sub-modal,
    #keepit-exact-overlay.te-dictation-active #te-modal-sub { display: none !important; }
    .te-subtitle-mode-menu {
      position: absolute; left: 50%; right: auto; bottom: calc(100% + 10px); z-index: 1000004;
      transform: translateX(-50%);
      display: grid; gap: 2px; width: min(170px, calc(100vw - 24px)); padding: 6px;
      border: 1px solid #27272a; border-radius: 12px; background: #18181b;
      color: #f3f4f6; box-shadow: 0 20px 35px rgba(0,0,0,.7);
    }
    .te-subtitle-mode-menu[hidden] { display: none !important; }
    #keepit-exact-overlay.theme-light .te-subtitle-mode-menu {
      border-color: #e5e7eb; background: #fff; color: #1f2937; box-shadow: 0 10px 30px rgba(0,0,0,.15);
    }
    .te-subtitle-mode-option {
      display: flex; width: 100%; min-height: 40px; align-items: center; gap: 10px;
      padding: 7px 9px; border: 0; border-radius: 8px; background: transparent;
      color: inherit; font: inherit; font-size: 14px; text-align: left; cursor: pointer;
    }
    .te-subtitle-mode-option:hover { background: rgba(128,128,128,.16); }
    .te-subtitle-mode-option.is-selected { background: rgba(128,128,128,.12); }
    .te-subtitle-mode-option .te-subtitle-mode-check { flex: none; width: 16px; height: 16px; visibility: hidden; }
    .te-subtitle-mode-option.is-selected .te-subtitle-mode-check { visibility: visible; color: #fbbf24; }
    #keepit-exact-overlay.theme-light .te-subtitle-mode-option.is-selected .te-subtitle-mode-check { color: #b45309; }
    .te-subtitle-mode-option .te-subtitle-mode-label { flex: 1; }
    .te-subtitle-mode-option kbd {
      min-width: 20px; padding: 2px 5px; border: 1px solid #525252; border-radius: 5px;
      background: rgba(255,255,255,.06); color: #d4d4d4; font: inherit; font-size: 11px; line-height: 1.3; text-align: center;
    }
    #keepit-exact-overlay.theme-light .te-subtitle-mode-option kbd {
      border-color: #d1d5db; background: #f9fafb; color: #6b7280;
    }

    /* Each selection applies to both the player subtitles and sidebar transcript. */
    #keepit-exact-overlay.te-subtitle-mode-bilingual .te-sub-en,
    #keepit-exact-overlay.te-subtitle-mode-bilingual .te-sub-vi,
    #keepit-exact-overlay.te-subtitle-mode-bilingual .yt-dual-item-en,
    #keepit-exact-overlay.te-subtitle-mode-bilingual .yt-dual-item-vi { display: block !important; }
    #keepit-exact-overlay.te-subtitle-mode-primary .te-sub-vi,
    #keepit-exact-overlay.te-subtitle-mode-primary .yt-dual-item-vi,
    #keepit-exact-overlay.te-subtitle-mode-translation .te-sub-en,
    #keepit-exact-overlay.te-subtitle-mode-translation .yt-dual-item-en,
    #keepit-exact-overlay.te-subtitle-mode-hidden .te-sub-en,
    #keepit-exact-overlay.te-subtitle-mode-hidden .te-sub-vi,
    #keepit-exact-overlay.te-subtitle-mode-hidden .yt-dual-item-en,
    #keepit-exact-overlay.te-subtitle-mode-hidden .yt-dual-item-vi,
    #keepit-exact-overlay.te-subtitle-mode-hidden .yt-dual-timestamp,
    #keepit-exact-overlay.te-subtitle-mode-hidden .yt-dual-item { display: none !important; }
    #keepit-exact-overlay.te-subtitle-mode-primary .te-sub-en,
    #keepit-exact-overlay.te-subtitle-mode-primary .yt-dual-item-en,
    #keepit-exact-overlay.te-subtitle-mode-translation .te-sub-vi,
    #keepit-exact-overlay.te-subtitle-mode-translation .yt-dual-item-vi { display: block !important; }
    #keepit-exact-overlay.te-subtitle-mode-hidden .te-sub-container { display: none !important; }
    #keepit-exact-overlay.te-reading-mode .te-sidebar-subtitle-settings,
    #keepit-exact-overlay.te-sidebar-hidden .te-sidebar-subtitle-settings { display: none !important; }
`;
const OVERLAY_HTML = `<div id="keepit-exact-overlay" class="theme-light">
    <!-- Ambient mode: lớp phát sáng nằm dưới mọi thành phần -->
    <div class="te-ambient-layer"><canvas class="te-ambient" width="152" height="48" aria-hidden="true"></canvas><canvas class="te-ambient-edge" width="160" height="90" aria-hidden="true"></canvas></div>
    <!-- Left Section -->
    <div class="te-left-section">
      <div class="te-video-slot">
        <div class="te-video-frame"></div>
        <div class="te-reading-mini-audio" role="group" aria-label="Video audio" aria-hidden="true">
          <div class="te-reading-mini-art"><img class="te-reading-mini-thumb" alt="" hidden></div>
          <div class="te-reading-mini-info"><div class="te-reading-mini-title"></div><div class="te-reading-mini-source">Audio</div></div>
          <div class="te-reading-mini-spectrum" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>
          <button class="te-reading-mini-play" id="te-reading-mini-play" type="button" title="Play video audio" aria-label="Play video audio">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
          </button>
        </div>
        <div class="te-dict-brand" role="img" aria-label="Keepit">
          <img alt="" aria-hidden="true">
          <span class="te-dict-brand-separator">-</span>
          <span class="te-dict-brand-name">Keepit</span>
        </div>
      </div>
      
      <!-- Subtitle box below video / theater-large overlay -->
      <div class="te-sub-container">
        <button class="te-subtitle-drag-handle" id="te-theater-subtitle-drag-handle" type="button" title="Move subtitle" aria-label="Move subtitle" aria-keyshortcuts="ArrowUp ArrowDown">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true">
            <circle cx="5" cy="4" r="1.15"/><circle cx="9" cy="4" r="1.15"/><circle cx="13" cy="4" r="1.15"/>
            <circle cx="5" cy="9" r="1.15"/><circle cx="9" cy="9" r="1.15"/><circle cx="13" cy="9" r="1.15"/>
            <circle cx="5" cy="14" r="1.15"/><circle cx="9" cy="14" r="1.15"/><circle cx="13" cy="14" r="1.15"/>
          </svg>
        </button>
        <div class="te-subtitle-content">
          <div class="te-sub-en" id="te-sub-en-text"></div>
          <div class="te-sub-vi" id="te-sub-vi-text"></div>
        </div>
      </div>

      <!-- Control Bar -->
      <div class="te-control-bar">
        <div class="te-progress-track"><div class="te-progress-fill"></div></div>
        
        <div class="te-ctrl-group te-control-leading-group">
          <div class="te-yt-logo-box">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            <span class="te-video-title-label"><span class="te-video-title-text">The Power Of Practice | You Become What You Practice |...</span></span>
          </div>
          <button class="te-icon-btn" id="te-control-add-vocabulary" title="Thêm vào từ vựng"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg></button>
          <button class="te-icon-btn" id="te-notes-sidebar-toggle" title="Mở thanh bên ghi chú" aria-label="Mở thanh bên ghi chú"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg></button>
        </div>

        <div class="te-ctrl-group te-control-transport-left">
          <button class="te-icon-btn" id="te-control-audio" title="Audio"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-volume-2 preview-icon" aria-hidden="true"><path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/><path d="M16 9a5 5 0 0 1 0 6"/><path d="M19.364 18.364a9 9 0 0 0 0-12.728"/></svg></button>
          <button class="te-icon-btn" id="te-control-repeat" title="Lặp lại câu"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg></button>
          <button class="te-icon-btn" id="te-control-previous" title="Câu trước"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg></button>
        </div>

        <button class="te-play-btn" id="te-control-play" title="Phát/Tạm dừng"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></button>

        <div class="te-ctrl-group te-control-transport-right">
          <button class="te-icon-btn" id="te-control-next" title="Câu tiếp theo"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg></button>
          <button class="te-icon-btn" id="te-control-speed" title="Tốc độ"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></button><span id="te-speed-label" class="te-speed-label">1.00x</span>
        </div>

        <div class="te-ctrl-group te-control-trailing-group">
          <button class="te-icon-btn" id="te-speaking-mode-btn" title="Luyện nói" aria-label="Luyện nói" aria-pressed="false"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-mic preview-icon" aria-hidden="true"><path d="M12 19v3"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><rect x="9" y="2" width="6" height="13" rx="3"/></svg></button>
          <button class="te-icon-btn" id="te-dictation-mode-btn" title="Chép chính tả" aria-label="Chép chính tả" aria-pressed="false"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-graduation-cap preview-icon" aria-hidden="true"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/></svg></button>
          <div class="te-subtitle-mode-selector">
            <button class="te-icon-btn" id="te-subtitle-mode-trigger" type="button" title="Chế độ phụ đề" aria-label="Chế độ phụ đề: Song ngữ" aria-haspopup="menu" aria-expanded="false">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-closed-caption preview-icon" aria-hidden="true"><path d="M10 9.17a3 3 0 1 0 0 5.66"/><path d="M17 9.17a3 3 0 1 0 0 5.66"/><rect x="2" y="5" width="20" height="14" rx="2"/></svg>
            </button>
            <div class="te-subtitle-mode-menu" id="te-subtitle-mode-menu" role="menu" hidden>
              <button class="te-subtitle-mode-option is-selected" type="button" role="menuitemradio" aria-checked="true" data-subtitle-mode="bilingual">
                <svg class="te-subtitle-mode-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>
                <span class="te-subtitle-mode-label">Song ngữ</span><kbd>1</kbd>
              </button>
              <button class="te-subtitle-mode-option" type="button" role="menuitemradio" aria-checked="false" data-subtitle-mode="primary">
                <svg class="te-subtitle-mode-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>
                <span class="te-subtitle-mode-label">Chính</span><kbd>2</kbd>
              </button>
              <button class="te-subtitle-mode-option" type="button" role="menuitemradio" aria-checked="false" data-subtitle-mode="translation">
                <svg class="te-subtitle-mode-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>
                <span class="te-subtitle-mode-label">Dịch</span><kbd>3</kbd>
              </button>
              <button class="te-subtitle-mode-option" type="button" role="menuitemradio" aria-checked="false" data-subtitle-mode="hidden">
                <svg class="te-subtitle-mode-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>
                <span class="te-subtitle-mode-label">Ẩn</span><kbd>4</kbd>
              </button>
            </div>
          </div>
          <div class="te-video-mode-selector">
            <button class="te-icon-btn" id="te-video-mode-trigger" type="button" data-video-mode="combined" title="Chế độ xem" aria-label="Chế độ xem" aria-haspopup="menu" aria-expanded="false">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="12" rx="1.5"/><path d="M3 20h18"/></svg>
            </button>
            <div class="te-video-mode-menu" id="te-video-mode-menu" role="menu" hidden>
              <button class="te-video-mode-option" type="button" role="menuitemradio" aria-checked="false" data-video-mode="theater">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="12" rx="1.5"/><path d="M3 20h18"/></svg>
                <span class="te-video-mode-label">Chế độ rạp</span><kbd>Alt+1</kbd>
              </button>
              <button class="te-video-mode-option" type="button" role="menuitemradio" aria-checked="false" data-video-mode="reading">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M8 7h8M8 11h8M8 15h5"/></svg>
                <span class="te-video-mode-label">Chế độ đọc</span><kbd>Alt+2</kbd>
              </button>
              <button class="te-video-mode-option is-selected" type="button" role="menuitemradio" aria-checked="true" data-video-mode="combined">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="1.5"/><path d="M12 4v16M12 9h9"/></svg>
                <span class="te-video-mode-label">Chế độ thường</span><kbd>Alt+3</kbd>
              </button>
            </div>
          </div>
          <button class="te-icon-btn" id="te-control-fullscreen" title="Toàn màn hình"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg></button>
          <button class="te-icon-btn" id="te-settings-btn" title="Cài đặt video"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></button>
        </div>
      </div>
    </div>

    <!-- Right Sidebar (giao diện v1.4) -->
    <div class="yt-dual-right-sidebar">
      <div class="yt-dual-sidebar-header">
        <span><svg class="te-sidebar-logo" viewBox="0 0 32 32" width="26" height="26" aria-hidden="true"><defs><linearGradient id="te-keepit-mark" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#4f46e5"/><stop offset="1" stop-color="#8b5cf6"/></linearGradient></defs><rect width="32" height="32" rx="8" fill="url(#te-keepit-mark)"/><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="4" height="20" width="20" x="6" y="6"><path d="m9 11-6 6v3h9l3-3"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/></svg></svg><span class="te-sidebar-title">Keepit - Video</span></span>
        <div class="yt-dual-actions">
          <button class="te-dict-video-toggle" id="te-reading-video-toggle" type="button" title="Thu nhỏ video" aria-label="Thu nhỏ video" aria-pressed="false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/></svg>
          </button>
          <button class="yt-dual-close-btn" title="Đóng"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg></button>
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
          <div class="te-setting-section-title">Kích thước xem</div>
          <div id="te-reading-width-hint" style="display: none; padding: 0 20px 8px; color: #6b7280; font-size: 12px; text-align: center;">Độ rộng khung phụ đề giữa: 40% màn hình</div>
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
          
          <!-- Nhấn để dịch -->
          <div class="te-menu-row">
            <div class="te-item-left">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 12a9 9 0 1 1-9-9c2.5 0 4.8 1 6.5 2.6L21 8"/><path d="M21 3v5h-5"/><circle cx="10" cy="13" r="3"/><path d="m12 15 2 2"/></svg>
              <span>Nhấn để dịch</span>
            </div>
            <label class="te-switch"><input type="checkbox" id="te-translation-popup-enabled" checked><span class="te-slider"></span></label>
          </div>

          <!-- Phát âm khi dịch -->
          <div class="te-menu-row">
            <div class="te-item-left">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 12a9 9 0 1 1-9-9c2.5 0 4.8 1 6.5 2.6L21 8"/><path d="M21 3v5h-5"/><path d="M10 9v6l4-3z"/></svg>
              <span>Phát âm khi dịch</span>
            </div>
            <label class="te-switch"><input type="checkbox" id="te-video-click-to-speak-enabled" checked><span class="te-slider"></span></label>
          </div>

          <!-- Kết hợp câu -->
          <div class="te-menu-row">
            <div class="te-item-left">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8 7h8a2 2 0 0 1 2 2v2M8 17h8a2 2 0 0 0 2-2v-2"/><path d="m11 4-3 3 3 3M11 14l-3 3 3 3"/></svg>
              <span>Kết hợp câu</span>
            </div>
            <label class="te-switch"><input type="checkbox"><span class="te-slider"></span></label>
          </div>

          <!-- Ambient art mode: direct on/off switch, like the control-bar visibility switch. -->
          <div class="te-menu-row">
            <div class="te-item-left">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
              <span>Ambient mode</span>
            </div>
            <label class="te-switch"><input id="te-ambient-toggle" type="checkbox" role="switch" aria-label="Ambient mode"><span class="te-slider"></span></label>
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

    <!-- Popup tốc độ (từ speed_control_component) -->
    <div id="te-speed-popup" class="te-speed-popup hidden">
      <div class="te-speed-head">
        <span class="te-speed-title">Tốc độ</span>
        <span id="te-speed-value">1.00x</span>
      </div>
      <div class="te-speed-row">
        <button id="te-speed-dec" class="te-speed-step" type="button">-</button>
        <div class="te-speed-slider-wrap"><input type="range" id="te-speed-slider" min="0.5" max="2" step="0.05" value="1"></div>
        <button id="te-speed-inc" class="te-speed-step" type="button">+</button>
      </div>
      <div class="te-speed-grid">
        <button class="te-speed-btn" type="button" data-speed="0.5">0.5x</button>
        <button class="te-speed-btn" type="button" data-speed="0.75">0.75x</button>
        <button class="te-speed-btn" type="button" data-speed="0.9">0.9x</button>
        <button class="te-speed-btn te-speed-normal" type="button" data-speed="1.0"><span>Bình</span><span>thường</span></button>
        <button class="te-speed-btn" type="button" data-speed="1.1">1.1x</button>
        <button class="te-speed-btn" type="button" data-speed="1.25">1.25x</button>
        <button class="te-speed-btn" type="button" data-speed="1.5">1.5x</button>
        <button class="te-speed-btn" type="button" data-speed="2.0">2.0x</button>
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

          <div style="display: flex; align-items: center; justify-content: space-between; padding: 14px 20px 6px 20px;">
            <span id="te-video-subtitle-settings-title" style="font-size: 13px; font-weight: 500; color: #6b7280;">Phụ đề video</span>
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

          <div class="te-sidebar-subtitle-settings">
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

          <div class="te-card-box te-theater-subtitle-settings" style="margin-bottom: 10px;">
            <div class="te-setting-item" style="border-bottom: 1px solid rgba(0,0,0,0.06);">
              <label for="te-theater-subtitle-color-picker" style="font-size: 13.5px;">Màu nền phụ đề</label>
              <span class="te-theater-subtitle-color-pill" id="te-theater-subtitle-color" aria-label="Màu nền phụ đề"></span>
            </div>
            <div class="te-setting-item">
              <label for="te-theater-subtitle-opacity" style="font-size: 13.5px;">Độ trong suốt</label>
              <div class="te-theater-subtitle-opacity-control">
                <input id="te-theater-subtitle-opacity" type="range" min="0" max="100" step="1" value="40" aria-label="Độ trong suốt">
                <output id="te-theater-subtitle-opacity-value" for="te-theater-subtitle-opacity">40%</output>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>

    <!-- Modal 3: Ngôn ngữ phụ đề -->
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

    <!-- Modal 4: Xuất phụ đề (MỚI BỔ SUNG CHÍNH XÁC 100% THEO HÌNH MỚI) -->
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
