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
    #keepit-exact-overlay.theme-light .te-sub-en { color: #8b5cf6; }
    #keepit-exact-overlay.theme-light .te-sub-vi { color: #4b5563; }
    #keepit-exact-overlay.theme-light .te-control-bar { background-color: #ffffff; }
    #keepit-exact-overlay.theme-light .te-right-sidebar { background-color: #ffffff; border-left: 1px solid #e5e7eb; }
    #keepit-exact-overlay.theme-light .te-sidebar-top { border-bottom: 1px solid #e5e7eb; color: #111827; }
    #keepit-exact-overlay.theme-light .te-ts-row:hover { background-color: #f3f4f6; }
    #keepit-exact-overlay.theme-light .te-ts-row.active { background-color: #f3e8ff; box-shadow: inset 4px 0 0 #8b5cf6; }
    #keepit-exact-overlay.theme-light .te-ts-row.active .te-ts-en,
    #keepit-exact-overlay.theme-light .te-ts-row.active .te-ts-time { color: #6d28d9; font-weight: 600; }
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

    .te-player-slot {
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

    .te-site-icon-box {
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

    .te-site-icon-box .te-site-favicon,
    .te-site-icon-box .te-site-icon-fallback {
      width: 22px;
      height: 22px;
      flex: 0 0 22px;
    }

    .te-site-icon-box .te-site-favicon { object-fit: contain; border-radius: 3px; }
    .te-site-icon-box .te-site-icon-fallback { color: #71717a; }
    .te-site-icon-box.te-site-icon-loaded .te-site-icon-fallback { display: none !important; }
    .te-site-icon-box .te-site-favicon[hidden],
    .te-site-icon-box .te-site-icon-fallback[hidden] { display: none !important; }

    /* Tiêu đề dài bị cắt thì chạy vòng tròn nối đuôi khi hover (JS nhân đôi chữ, đặt --te-title-shift/--te-title-dur và class te-title-run) */
    .te-source-title-label { flex: 1 1 auto; min-width: 0; overflow: hidden; }
    .te-source-title-text { display: inline-block; white-space: nowrap; }
    .te-source-title-text .te-title-dup { margin-left: 32px; }
    .te-site-icon-box:hover .te-source-title-text.te-title-run {
      animation: teTitleRun var(--te-title-dur, 6s) linear infinite;
    }
    @keyframes teTitleRun {
      from { transform: translateX(0); }
      to { transform: translateX(calc(-1 * var(--te-title-shift, 0px))); }
    }
    @media (prefers-reduced-motion: reduce) {
      .te-site-icon-box:hover .te-source-title-text.te-title-run { animation: none; }
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

    #keepit-exact-overlay .te-view-toast {
      position: fixed; top: 48px; left: 50%; z-index: 40; transform: translateX(-50%) translateY(-8px);
      box-sizing: border-box; max-width: min(520px, calc(100% - 24px)); padding: 10px 20px;
      border: 1px solid rgba(255,255,255,.14); border-radius: 999px; background: rgba(18,18,18,.72);
      color: #fff; font-size: 13px; font-weight: 600; line-height: 1.4; text-align: center;
      backdrop-filter: blur(40px) saturate(200%); -webkit-backdrop-filter: blur(40px) saturate(200%);
      opacity: 0; pointer-events: none; transition: opacity .22s ease, transform .22s ease;
    }
    #keepit-exact-overlay .te-view-toast.is-visible { opacity: 1; transform: translateX(-50%) translateY(0); }
    #keepit-exact-overlay.theme-light .te-view-toast { border-color: rgba(17,24,39,.12); background: rgba(255,255,255,.92); color: #111827; }
    @media (prefers-reduced-motion: reduce) { #keepit-exact-overlay .te-view-toast { transition: none; } }

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
    #keepit-exact-overlay.te-study-entry-pending { visibility: hidden !important; }
    #keepit-exact-overlay.te-controls-hidden .te-control-bar { opacity: 0; transition: opacity 0.2s; }
    #keepit-exact-overlay.te-controls-hidden .te-control-bar:hover,
    #keepit-exact-overlay.te-controls-hidden .te-control-bar:focus-within { opacity: 1; }
    #keepit-exact-overlay.te-subs-hidden .te-sub-container { display: none; }
    #keepit-exact-overlay.te-sidebar-hidden .yt-dual-right-sidebar { display: none; }
    #keepit-exact-overlay .te-icon-btn.te-active { color: #8b5cf6; }
    #keepit-exact-overlay .te-player-slot :is(video, .te-web-page-thumbnail) {
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
    #keepit-exact-overlay .te-player-slot .te-web-page-thumbnail { cursor: default; user-select: none; }
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
#keepit-exact-overlay.theme-light .yt-dual-item.active { background-color: #f3e8ff; box-shadow: inset 4px 0 0 #8b5cf6; }
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
    #keepit-exact-overlay.te-reading-mode .te-player-slot {
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
    /* One shared Keepit brand node: visible over the video in Reading and expanded Study modes. */
    /* Brand dimensions scale with the rendered video-slot width; at 400px the current sizing is preserved. */
    #keepit-exact-overlay .te-study-brand {
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
    #keepit-exact-overlay.te-reading-mode:not(.te-reading-audio-compact) .te-study-brand,
    #keepit-exact-overlay.te-study-active:not(.te-study-media-compact) .te-study-brand { display: flex; }
    #keepit-exact-overlay .te-study-brand img { display: block; flex: 0 0 5cqw; width: 5cqw; height: 5cqw; border-radius: 1.25cqw; object-fit: cover; }
    #keepit-exact-overlay .te-study-brand-separator { opacity: .78; font-weight: 500; }

    /* Reading-mode video ↔ mini-audio control (separate from Study's existing control). */
    #keepit-exact-overlay .yt-dual-sidebar-header .te-study-media-toggle {
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
    #keepit-exact-overlay.te-reading-mode .yt-dual-sidebar-header .te-study-media-toggle { display: inline-flex; }
    #keepit-exact-overlay .yt-dual-sidebar-header .te-study-media-toggle:hover { border-color: #8b5cf6; background: rgba(139, 92, 246, .1); color: #c4b5fd; }
    #keepit-exact-overlay .yt-dual-sidebar-header .te-study-media-toggle:active { transform: scale(.94); }
    #keepit-exact-overlay .yt-dual-sidebar-header .te-study-media-toggle svg { width: 18px; height: 18px; }
    #keepit-exact-overlay.theme-light .yt-dual-sidebar-header .te-study-media-toggle { color: #6b7280; }
    #keepit-exact-overlay.theme-light .yt-dual-sidebar-header .te-study-media-toggle:hover { color: #7c3aed; }
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
    #keepit-exact-overlay.te-reading-mode.te-reading-audio-compact .te-player-slot {
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
    #keepit-exact-overlay.te-reading-mode.te-reading-audio-compact .te-player-slot video {
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
      #keepit-exact-overlay .yt-dual-sidebar-header .te-study-media-toggle { transition-duration: .01ms; }
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
    #keepit-exact-overlay .te-player-slot {
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
    #keepit-exact-overlay.te-sidebar-hidden .te-player-slot { background-color: #11111100; border-radius: 12px; overflow: hidden; }
    #keepit-exact-overlay.te-sidebar-hidden .te-player-slot :is(video, .te-web-page-thumbnail) { border-radius: 12px; }
    /* Chế độ rạp: khung bọc đúng kích thước video, bo 4 góc. Ngoài chế độ rạp khung không tạo ô layout (display: contents) */
    #keepit-exact-overlay .te-player-frame { display: contents; }
    #keepit-exact-overlay.te-sidebar-hidden .te-player-frame { display: block; position: relative; border-radius: 12px; overflow: hidden; clip-path: inset(0 round 12px); }
    #keepit-exact-overlay.te-sidebar-hidden .te-player-frame :is(video, .te-web-page-thumbnail) { width: 100%; height: 100%; object-fit: contain; border-radius: 0; }
    /* Web thumbnails fill the existing video frame; all visualizer layers stay clipped inside it. */
    #keepit-exact-overlay .te-player-slot .te-web-page-thumbnail.te-web-thumbnail-bg,
    #keepit-exact-overlay.te-sidebar-hidden .te-player-slot .te-web-page-thumbnail.te-web-thumbnail-bg {
      object-fit: cover !important;
      transform: translate(var(--te-webviz-shift-x, 0%), var(--te-webviz-shift-y, 0%)) rotate(var(--te-webviz-angle, 0rad)) scale(var(--te-webviz-scale, 1.12)) !important;
      transform-origin: 50% 50% !important;
      will-change: transform, filter;
      filter: blur(var(--te-webviz-blur, 8px)) brightness(.88);
      background: #111;
    }
    #keepit-exact-overlay .te-player-slot .te-web-thumbnail-visualizer {
      position: absolute; inset: 0; z-index: 2; overflow: hidden; pointer-events: none;
      container-type: inline-size; border-radius: inherit;
    }
    #keepit-exact-overlay .te-web-thumbnail-shade {
      position: absolute; inset: 0; z-index: 1;
      background: rgba(11, 15, 23, var(--te-webviz-darkness, .4));
    }
    #keepit-exact-overlay .te-web-thumbnail-shade::after {
      content: ""; position: absolute; inset: 0;
      background: radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,.58) 100%);
    }
    #keepit-exact-overlay .te-web-thumbnail-canvas { position: absolute; inset: 0; z-index: 2; width: 100%; height: 100%; }
    #keepit-exact-overlay .te-web-thumbnail-meta {
      position: absolute; z-index: 3; left: 8%; top: 28%; width: 84%;
      display: flex; align-items: center; gap: clamp(12px, 2cqw, 40px);
      color: #fff; font-family: inherit; text-shadow: 0 2px 14px rgba(0,0,0,.72);
    }
    #keepit-exact-overlay .te-web-thumbnail-art {
      flex: 0 0 clamp(56px, 8cqw, 140px); width: clamp(56px, 8cqw, 140px);
      height: clamp(56px, 8cqw, 140px); object-fit: cover; border-radius: clamp(7px, .7cqw, 14px);
      box-shadow: 0 10px 30px rgba(0,0,0,.45); background: #18212a;
    }
    #keepit-exact-overlay .te-web-thumbnail-details { min-width: 0; flex: 1; display: flex; flex-direction: column; gap: clamp(3px, .45cqw, 9px); }
    #keepit-exact-overlay .te-web-thumbnail-duration {
      color: var(--te-webviz-main, #ffcc00); font-size: clamp(9px, 1.05cqw, 20px);
      font-weight: 650; letter-spacing: .12em; text-transform: uppercase; white-space: nowrap;
    }
    #keepit-exact-overlay .te-web-thumbnail-title {
      overflow: hidden; color: #fff; font-size: clamp(13px, 2.7cqw, 52px);
      font-weight: 750; line-height: 1.12; white-space: nowrap; text-overflow: ellipsis;
    }
    #keepit-exact-overlay .te-web-thumbnail-artist {
      overflow: hidden; color: rgba(255,255,255,.84); font-size: clamp(10px, 1.35cqw, 26px);
      font-weight: 500; white-space: nowrap; text-overflow: ellipsis;
    }
    /* Chỉ Rạp + Lớn: video, subtitle và control bar dùng ba lớp độc lập theo viewport/frame thật. */
    #keepit-exact-overlay.te-sidebar-hidden.size-l:not(.te-reading-mode):not(.te-study-active) .te-player-slot { overflow: visible; container-type: normal; }
    #keepit-exact-overlay.te-sidebar-hidden.size-l:not(.te-reading-mode):not(.te-study-active) .te-player-frame { position: fixed; inset: 0; margin: auto; z-index: 1; }
    #keepit-exact-overlay.te-sidebar-hidden.size-l:not(.te-reading-mode):not(.te-study-active) .te-control-bar {
      position: fixed; left: 0; right: 0; bottom: 0; width: 100vw; z-index: 4;
    }
    /* Chia sẻ style nền mờ (nền/blur/viền/bóng) của Rạp + Lớn với Reading khi Ambient bật; không đổi geometry Reading. */
    #keepit-exact-overlay.te-sidebar-hidden.size-l:not(.te-reading-mode):not(.te-study-active) .te-control-bar,
    #keepit-exact-overlay.te-reading-mode.te-ambient-on:not(.te-study-active) .te-control-bar {
      background-color: rgba(15, 15, 18, .58); backdrop-filter: blur(14px) saturate(140%);
      -webkit-backdrop-filter: blur(14px) saturate(140%);
      border-top: 1px solid rgba(255,255,255,.15); box-shadow: 0 -8px 24px rgba(0,0,0,.18);
    }
    #keepit-exact-overlay.theme-light.te-sidebar-hidden.size-l:not(.te-reading-mode):not(.te-study-active) .te-control-bar,
    #keepit-exact-overlay.theme-light.te-reading-mode.te-ambient-on:not(.te-study-active) .te-control-bar {
      background-color: rgba(248, 249, 250, .78); border-top-color: rgba(31,41,55,.12);
      box-shadow: 0 -8px 24px rgba(31,41,55,.1);
    }
    #keepit-exact-overlay .te-theater-subtitle-settings { display: none; }
    #keepit-exact-overlay.te-sidebar-hidden.size-l:not(.te-reading-mode):not(.te-study-active) .te-theater-subtitle-settings {
      display: block; margin-top: 10px;
    }
    #keepit-exact-overlay .te-subtitle-content { display: contents; }
    #keepit-exact-overlay.te-sidebar-hidden.size-l:not(.te-reading-mode):not(.te-study-active) .te-sub-container {
      position: fixed; left: 50%; top: var(--te-theater-subtitle-top, 82vh); z-index: 3;
      display: flex; flex: none; width: fit-content;
      max-width: var(--te-theater-subtitle-max-width, 90vw); min-width: 0; min-height: 0;
      height: auto; padding: 12px 18px; gap: 2px; overflow: visible;
      transform: translate(-50%, -50%);
      border-radius: 16px; background-color: var(--te-theater-subtitle-background, rgba(0,0,0,.4));
    }
    #keepit-exact-overlay.te-sidebar-hidden.size-l:not(.te-reading-mode):not(.te-study-active) .te-subtitle-content {
      display: flex; flex: 0 1 auto; flex-direction: column; align-items: center; justify-content: center;
      min-width: 0; min-height: 0; width: fit-content; max-width: 100%;
      max-height: max(0px, calc(var(--te-theater-subtitle-max-height, calc(100vh - 100px)) - 24px));
      overflow: auto; overscroll-behavior: contain;
    }
    #keepit-exact-overlay.te-sidebar-hidden.size-l:not(.te-reading-mode):not(.te-study-active) .te-sub-en,
    #keepit-exact-overlay.te-sidebar-hidden.size-l:not(.te-reading-mode):not(.te-study-active) .te-sub-vi {
      width: max-content; max-width: 100%; overflow-wrap: anywhere;
    }
    #keepit-exact-overlay.te-sidebar-hidden.size-l:not(.te-reading-mode):not(.te-study-active) .te-sub-en { margin-bottom: 0; }
    #keepit-exact-overlay.te-sidebar-hidden.size-l:not(.te-reading-mode):not(.te-study-active) .te-subtitle-drag-handle {
      position: absolute; top: -24px; left: 50%; z-index: 1; display: inline-flex;
      width: 44px; height: 26px; align-items: center; justify-content: center;
      padding: 0; border: 1px solid rgba(255,255,255,.12); border-radius: 999px;
      background: rgba(0,0,0,.82); color: #d1d5db; cursor: grab;
      opacity: 0; pointer-events: none; transform: translateX(-50%);
      transition: opacity .15s ease;
      touch-action: none;
    }
    #keepit-exact-overlay.te-sidebar-hidden.size-l:not(.te-reading-mode):not(.te-study-active) .te-sub-container:hover .te-subtitle-drag-handle,
    #keepit-exact-overlay.te-sidebar-hidden.size-l:not(.te-reading-mode):not(.te-study-active) .te-sub-container:focus-within .te-subtitle-drag-handle,
    #keepit-exact-overlay.te-sidebar-hidden.size-l:not(.te-reading-mode):not(.te-study-active).te-theater-subtitle-dragging .te-subtitle-drag-handle {
      opacity: 1; pointer-events: auto;
    }
    #keepit-exact-overlay.te-sidebar-hidden.size-l:not(.te-reading-mode):not(.te-study-active) .te-subtitle-drag-handle:hover { background: rgba(0,0,0,.96); }
    #keepit-exact-overlay.te-sidebar-hidden.size-l:not(.te-reading-mode):not(.te-study-active) .te-subtitle-drag-handle:focus-visible { outline: 2px solid #a78bfa; outline-offset: 2px; }
    #keepit-exact-overlay.te-sidebar-hidden.size-l:not(.te-reading-mode):not(.te-study-active).te-theater-subtitle-dragging .te-subtitle-drag-handle { cursor: grabbing; }
    #keepit-exact-overlay.te-sidebar-hidden.te-ambient-on .te-ambient { -webkit-mask-image: none; mask-image: none; }
    #keepit-exact-overlay.te-ambient-on .te-left-section,
    #keepit-exact-overlay.te-ambient-on .te-control-bar,
    #keepit-exact-overlay.te-ambient-on .yt-dual-right-sidebar { background-color: transparent; }

    /* Subtitle display selector and four-mode menu. */
    .te-subtitle-mode-selector { position: relative; display: flex; align-items: center; }
    #keepit-exact-overlay.te-study-active .te-subtitle-mode-selector,
    #keepit-exact-overlay.te-study-active #open-sub-modal,
    #keepit-exact-overlay.te-study-active #te-modal-sub { display: none !important; }
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

    /* Study (Dictation / Shadowing) */
#keepit-exact-overlay.te-study-active {
  display: grid !important;
  grid-template-columns: var(--te-study-left-track, 25fr) var(--te-study-left-splitter, 8px) minmax(var(--te-study-center-min, 35%), 50fr) var(--te-study-right-splitter, 8px) var(--te-study-right-track, 25fr);
  grid-template-rows: minmax(0, 1fr) 70px;
  overflow: hidden;
}
#keepit-exact-overlay.te-study-active > .te-ambient-layer {
  grid-area: 1 / 1 / 3 / 6;
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}
#keepit-exact-overlay.te-study-active > .te-study-player-mask {
  display: none;
  grid-area: 1 / 3 / 2 / 4;
  position: relative;
  z-index: 2;
  background: #fff;
  pointer-events: none;
}
#keepit-exact-overlay.theme-dark.te-study-active > .te-study-player-mask { background: #121212; }
#keepit-exact-overlay.te-study-active > .te-study-column-splitter {
  position: relative;
  z-index: 8;
  display: flex;
  grid-row: 1;
  align-items: stretch;
  justify-content: center;
  min-width: 0;
  cursor: col-resize;
  touch-action: none;
  user-select: none;
  outline: none;
}
#keepit-exact-overlay.te-study-active > .te-study-column-splitter::before {
  content: "";
  align-self: center;
  width: 2px;
  height: 34px;
  border-radius: 2px;
  background: rgba(107, 114, 128, .48);
  transition: background-color .12s ease, width .12s ease, height .12s ease;
}
#keepit-exact-overlay.te-study-active > .te-study-column-splitter:hover::before,
#keepit-exact-overlay.te-study-active > .te-study-column-splitter:focus-visible::before,
#keepit-exact-overlay.te-study-active > .te-study-column-splitter.is-dragging::before {
  width: 4px;
  height: 48px;
  background: #f59e0b;
}
#keepit-exact-overlay.te-study-active > .te-study-column-splitter.te-study-splitter-left { grid-column: 2; }
#keepit-exact-overlay.te-study-active > .te-study-column-splitter.te-study-splitter-right { grid-column: 4; }
#keepit-exact-overlay.te-study-active.te-study-column-left-hidden > .te-study-splitter-left,
#keepit-exact-overlay.te-study-active.te-study-column-right-hidden > .te-study-splitter-right { display: none; }
#keepit-exact-overlay.te-study-active > .te-study-column-restore {
  position: relative;
  z-index: 9;
  display: none;
  grid-row: 1;
  min-width: 0;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  background: #f3f4f6;
  color: #6b7280;
  cursor: pointer;
}
#keepit-exact-overlay.te-study-active > .te-study-column-restore:hover,
#keepit-exact-overlay.te-study-active > .te-study-column-restore:focus-visible { background: rgba(245, 158, 11, .14); color: #b45309; }
#keepit-exact-overlay.te-study-active > .te-study-column-restore svg { width: 15px; height: 15px; }
#keepit-exact-overlay.te-study-active > .te-study-column-restore.te-study-restore-left { grid-column: 1; border-right: 1px solid #e5e7eb; }
#keepit-exact-overlay.te-study-active > .te-study-column-restore.te-study-restore-right { grid-column: 5; border-left: 1px solid #e5e7eb; }
#keepit-exact-overlay.te-study-active.te-study-column-left-hidden > .te-study-restore-left,
#keepit-exact-overlay.te-study-active.te-study-column-right-hidden > .te-study-restore-right { display: flex; }
#keepit-exact-overlay.theme-dark.te-study-active > .te-study-column-restore { background: #171717; color: #a1a1aa; }
#keepit-exact-overlay.theme-dark.te-study-active > .te-study-column-restore.te-study-restore-left { border-color: #27272a; }
#keepit-exact-overlay.theme-dark.te-study-active > .te-study-column-restore.te-study-restore-right { border-color: #27272a; }
#keepit-exact-overlay.te-study-active.te-study-column-right-hidden > #te-study-notes { display: none !important; }
#keepit-exact-overlay.te-study-active .te-study-column-toggle {
  display: inline-flex;
  flex: 0 0 26px;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 0;
  border: 1px solid currentColor;
  border-radius: 6px;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
}
#keepit-exact-overlay.te-study-active .te-study-column-toggle:hover,
#keepit-exact-overlay.te-study-active .te-study-column-toggle:focus-visible { border-color: rgba(245, 158, 11, .35); background: rgba(245, 158, 11, .1); color: #b45309; }
#keepit-exact-overlay.te-study-active .te-study-column-toggle svg { width: 14px; height: 14px; }
#keepit-exact-overlay.te-study-active > .te-left-section {
  grid-area: 1 / 1 / 2 / 2;
  display: flex;
  flex-direction: column;
  flex: none;
  width: auto;
  height: auto;
  min-width: 0;
  min-height: 0;
  padding: 0;
  overflow: hidden;
  position: relative;
  z-index: 1;
}
#keepit-exact-overlay.te-study-active > .te-left-section { width: auto !important; }
#keepit-exact-overlay.te-study-active .te-player-slot {
  flex: 0 0 auto;
  width: 100%;
  margin-inline: 0;
  height: auto;
  max-height: 42%;
  aspect-ratio: var(--te-video-aspect, 16 / 9);
  background: #000;
}
#keepit-exact-overlay.te-study-active .te-player-slot {
  transition: height .6s cubic-bezier(.16, 1, .3, 1), border-radius .5s ease, box-shadow .5s ease;
}
#keepit-exact-overlay.te-study-active .te-player-slot video {
  display: block;
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  transition: opacity .4s cubic-bezier(.16, 1, .3, 1);
}
#keepit-exact-overlay.te-study-active.te-study-media-compact .te-player-slot {
  aspect-ratio: auto !important;
  max-height: none !important;
  overflow: visible;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}
#keepit-exact-overlay.te-study-active.te-study-media-compact .te-player-slot video {
  opacity: 0 !important;
  pointer-events: none !important;
}
#keepit-exact-overlay .te-study-mini-audio {
  position: absolute;
  inset: 0 4px;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 14px;
  width: auto;
  height: 100%;
  padding: 0 20px;
  overflow: hidden;
  border: 1px solid rgba(168, 85, 247, .35);
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(21, 28, 44, .97), rgba(15, 23, 42, .99));
  color: #f8fafc;
  box-shadow: 0 16px 36px rgba(124, 58, 237, .25);
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transform: scale(.98);
  transition: opacity .4s ease, transform .6s cubic-bezier(.16, 1, .3, 1), visibility 0s linear .4s;
}
#keepit-exact-overlay.te-study-active.te-study-media-compact .te-study-mini-audio {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transform: scale(1);
  transition: opacity .4s ease, transform .6s cubic-bezier(.16, 1, .3, 1), visibility 0s;
}
#keepit-exact-overlay .te-study-mini-art {
  flex: 0 0 52px;
  width: 52px;
  height: 52px;
  overflow: hidden;
  border-radius: 14px;
  background: linear-gradient(135deg, #7c3aed, #312e81);
  box-shadow: 0 8px 16px rgba(0, 0, 0, .4);
}
#keepit-exact-overlay .te-study-mini-thumb { display: block; width: 100%; height: 100%; object-fit: cover; }
#keepit-exact-overlay .te-study-mini-info { display: flex; flex: 1 1 auto; min-width: 0; flex-direction: column; gap: 3px; }
#keepit-exact-overlay .te-study-mini-title { overflow: hidden; color: #f8fafc; font-size: 14px; font-weight: 650; text-overflow: ellipsis; white-space: nowrap; }
#keepit-exact-overlay .te-study-mini-source { color: #c4b5fd; font-size: 12px; font-weight: 500; }
#keepit-exact-overlay .te-study-spectrum { display: flex; flex: 0 0 auto; align-items: center; gap: 3px; height: 28px; padding: 0 6px; }
#keepit-exact-overlay .te-study-spectrum span { width: 3px; height: 6px; border-radius: 99px; background: linear-gradient(135deg, #a855f7, #6366f1); box-shadow: 0 0 10px rgba(168, 85, 247, .5); }
#keepit-exact-overlay .te-study-mini-audio.playing .te-study-spectrum span { animation: teDictSpectrumWave 1.1s cubic-bezier(.45, .05, .55, .95) infinite alternate; }
#keepit-exact-overlay .te-study-mini-audio.playing .te-study-spectrum span:nth-child(1) { animation-delay: .1s; animation-duration: .9s; }
#keepit-exact-overlay .te-study-mini-audio.playing .te-study-spectrum span:nth-child(2) { animation-delay: .3s; animation-duration: 1.2s; }
#keepit-exact-overlay .te-study-mini-audio.playing .te-study-spectrum span:nth-child(3) { animation-delay: .5s; animation-duration: .8s; }
#keepit-exact-overlay .te-study-mini-audio.playing .te-study-spectrum span:nth-child(4) { animation-delay: .2s; animation-duration: 1.1s; }
#keepit-exact-overlay .te-study-mini-audio.playing .te-study-spectrum span:nth-child(5) { animation-delay: .4s; animation-duration: 1s; }
@keyframes teDictSpectrumWave { from { height: 6px; } to { height: 26px; } }
#keepit-exact-overlay .te-study-mini-play {
  display: inline-flex;
  flex: 0 0 44px;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: 0;
  border-radius: 50%;
  background: linear-gradient(135deg, #a855f7, #6366f1);
  color: #fff;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(124, 58, 237, .5);
  transition: transform .3s cubic-bezier(.16, 1, .3, 1), box-shadow .3s ease;
}
#keepit-exact-overlay .te-study-mini-play:hover { transform: scale(1.08); box-shadow: 0 8px 24px rgba(168, 85, 247, .7); }
#keepit-exact-overlay .te-study-mini-play svg { width: 20px; height: 20px; fill: currentColor; stroke: none; }
@media (prefers-reduced-motion: reduce) {
  #keepit-exact-overlay.te-study-active .te-player-slot,
  #keepit-exact-overlay .te-study-mini-audio,
  #keepit-exact-overlay .te-study-mini-play { transition-duration: .01ms; }
  #keepit-exact-overlay .te-study-mini-audio.playing .te-study-spectrum span { animation: none; }
}
#keepit-exact-overlay.te-study-active .te-sub-container,
#keepit-exact-overlay.te-study-active .yt-dual-right-sidebar { display: none !important; }
#keepit-exact-overlay #te-study-sentence-area { display: none; }
#keepit-exact-overlay.te-study-active #te-study-sentence-area {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  padding: 10px;
  padding-right: 4px;
}
#keepit-exact-overlay.te-study-active .te-study-sentence-footer {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin: 0 -12px -10px;
  padding: 8px 12px;
  border-top: 1px solid #e5e7eb;
}
#keepit-exact-overlay.theme-dark .te-study-sentence-footer { border-color: #27272a; }
#keepit-exact-overlay #te-study-sentence-head,
#keepit-exact-overlay .te-study-panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 38px;
  padding: 8px 12px;
  border-bottom: 1px solid #e5e7eb;
}
#keepit-exact-overlay #te-study-sentence-head { padding: 0 0 8px; border: 0; }
#keepit-exact-overlay .te-study-loading { flex: none; margin: 10px 0; padding: 11px 13px; border: 1px solid rgba(245,158,11,.28); border-radius: 12px; color: #92400e; background: rgba(245,158,11,.08); font-size: 13px; font-weight: 650; text-align: center; }
#keepit-exact-overlay.theme-dark .te-study-loading { color: #fbbf24; background: rgba(245,158,11,.09); }
#keepit-exact-overlay .te-study-heading {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font: inherit;
  font-size: 12px;
  font-weight: 650;
  letter-spacing: .06em;
  text-transform: uppercase;
}
#keepit-exact-overlay .te-study-heading svg { flex: none; color: #f59e0b; }
#keepit-exact-overlay .te-study-counter,
#keepit-exact-overlay .te-dict-score {
  flex: 0 0 auto;
  padding: 3px 8px;
  border: 1px solid rgba(245, 158, 11, .38);
  border-radius: 999px;
  color: #d97706;
  background: rgba(245, 158, 11, .08);
  font-size: 12px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
#keepit-exact-overlay.theme-dark #te-study-sentence-head,
#keepit-exact-overlay.theme-dark .te-study-panel-head { border-color: #27272a; }
#keepit-exact-overlay.theme-dark .te-study-counter,
#keepit-exact-overlay.theme-dark .te-dict-score { color: #fbbf24; }
#keepit-exact-overlay.theme-light .te-study-counter,
#keepit-exact-overlay.theme-light .te-dict-score { color: #b45309; }
#keepit-exact-overlay #te-study-sentences {
  flex: 1;
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
  padding: 2px 3px 4px 0;
}
#keepit-exact-overlay #te-study-sentences,
#keepit-exact-overlay .te-study-center-body,
#keepit-exact-overlay .te-dict-input,
#keepit-exact-overlay .te-study-note-body,
#keepit-exact-overlay .te-study-note-input {
  scrollbar-width: auto;
  scrollbar-color: auto;
}
#keepit-exact-overlay #te-study-sentences::-webkit-scrollbar,
#keepit-exact-overlay .te-study-center-body::-webkit-scrollbar,
#keepit-exact-overlay .te-dict-input::-webkit-scrollbar,
#keepit-exact-overlay .te-study-note-body::-webkit-scrollbar,
#keepit-exact-overlay .te-study-note-input::-webkit-scrollbar {
  width: var(--lhn-scrollbar-width);
  height: var(--lhn-scrollbar-width);
}
#keepit-exact-overlay #te-study-sentences::-webkit-scrollbar:vertical,
#keepit-exact-overlay .te-study-center-body::-webkit-scrollbar:vertical,
#keepit-exact-overlay .te-dict-input::-webkit-scrollbar:vertical,
#keepit-exact-overlay .te-study-note-body::-webkit-scrollbar:vertical,
#keepit-exact-overlay .te-study-note-input::-webkit-scrollbar:vertical { width: var(--lhn-scrollbar-width); }
#keepit-exact-overlay #te-study-sentences::-webkit-scrollbar:horizontal,
#keepit-exact-overlay .te-study-center-body::-webkit-scrollbar:horizontal,
#keepit-exact-overlay .te-dict-input::-webkit-scrollbar:horizontal,
#keepit-exact-overlay .te-study-note-body::-webkit-scrollbar:horizontal,
#keepit-exact-overlay .te-study-note-input::-webkit-scrollbar:horizontal { height: var(--lhn-scrollbar-width); }
#keepit-exact-overlay #te-study-sentences::-webkit-scrollbar-track,
#keepit-exact-overlay .te-study-center-body::-webkit-scrollbar-track,
#keepit-exact-overlay .te-dict-input::-webkit-scrollbar-track,
#keepit-exact-overlay .te-study-note-body::-webkit-scrollbar-track,
#keepit-exact-overlay .te-study-note-input::-webkit-scrollbar-track { background: transparent; }
#keepit-exact-overlay #te-study-sentences::-webkit-scrollbar-thumb,
#keepit-exact-overlay .te-study-center-body::-webkit-scrollbar-thumb,
#keepit-exact-overlay .te-dict-input::-webkit-scrollbar-thumb,
#keepit-exact-overlay .te-study-note-body::-webkit-scrollbar-thumb,
#keepit-exact-overlay .te-study-note-input::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: #cbd5e1;
}
#keepit-exact-overlay.theme-dark #te-study-sentences::-webkit-scrollbar-thumb,
#keepit-exact-overlay.theme-dark .te-study-center-body::-webkit-scrollbar-thumb,
#keepit-exact-overlay.theme-dark .te-dict-input::-webkit-scrollbar-thumb,
#keepit-exact-overlay.theme-dark .te-study-note-body::-webkit-scrollbar-thumb,
#keepit-exact-overlay.theme-dark .te-study-note-input::-webkit-scrollbar-thumb { background: #a1a1aa; }
@supports (-moz-appearance: none) {
  #keepit-exact-overlay #te-study-sentences,
  #keepit-exact-overlay .te-study-center-body,
  #keepit-exact-overlay .te-dict-input,
  #keepit-exact-overlay .te-study-note-body,
  #keepit-exact-overlay .te-study-note-input { scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent; }
  #keepit-exact-overlay.theme-dark #te-study-sentences,
  #keepit-exact-overlay.theme-dark .te-study-center-body,
  #keepit-exact-overlay.theme-dark .te-dict-input,
  #keepit-exact-overlay.theme-dark .te-study-note-body,
  #keepit-exact-overlay.theme-dark .te-study-note-input { scrollbar-color: #a1a1aa transparent; }
}
#keepit-exact-overlay .te-study-row {
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr) 14px;
  align-items: start;
  column-gap: 8px;
  width: 100%;
  margin: 0 0 6px;
  padding: 8px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: transparent;
  color: #4b5563;
  font: inherit;
  text-align: left;
  cursor: default;
}
#keepit-exact-overlay .te-study-row:not(:disabled) { cursor: pointer; }
#keepit-exact-overlay .te-study-row:disabled { opacity: 1; }
#keepit-exact-overlay .te-study-row:not(:disabled):hover { background: rgba(148, 163, 184, .12); }
#keepit-exact-overlay .te-study-row.solved { background: rgba(148, 163, 184, .10); }
#keepit-exact-overlay .te-study-row.current,
#keepit-exact-overlay .te-study-row.current.solved { border-color: rgba(245, 158, 11, .6); background: rgba(245, 158, 11, .08); color: #b45309; }
#keepit-exact-overlay .te-study-num { display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; border-radius: 5px; background: #e5e7eb; color: #4b5563; font-size: 10px; font-weight: 700; font-variant-numeric: tabular-nums; }
#keepit-exact-overlay .te-study-row.current .te-study-num { background: #f59e0b; color: #000; }
#keepit-exact-overlay .te-study-text { color: inherit; font-size: 15px;font-weight: 500; line-height: 1.5; overflow-wrap: anywhere; }
#keepit-exact-overlay .te-study-row.current .te-study-text { font-weight: 700; }
#keepit-exact-overlay .te-study-row:not(.solved) .te-study-text { filter: blur(5px); user-select: none; }
#keepit-exact-overlay .te-study-row.solved .te-study-text { filter: none; user-select: text; }
#keepit-exact-overlay .te-study-icon { display: inline-flex; margin-top: 4px; color: #9ca3af; }
#keepit-exact-overlay .te-study-icon svg { width: 12px; height: 12px; }
#keepit-exact-overlay .te-study-icon .vol { display: none; }
#keepit-exact-overlay .te-study-row.current .te-study-icon { color: #f59e0b; }
#keepit-exact-overlay .te-study-row.current .te-study-icon .play { display: none; }
#keepit-exact-overlay .te-study-row.current .te-study-icon .vol { display: inline; }
#keepit-exact-overlay .te-study-vi { grid-column: 2 / 4; margin-top: 4px; color: #6b7280; font-size: 13px; line-height: 1.45; }
#keepit-exact-overlay .te-study-row.locked .te-study-vi { display: none !important; }
#keepit-exact-overlay.theme-dark .te-study-row { border-color: #27272a; color: #a1a1aa; }
#keepit-exact-overlay.theme-dark .te-study-row.solved { background: rgba(255, 255, 255, .055); }
#keepit-exact-overlay.theme-dark .te-study-row:not(:disabled):hover { background: rgba(255, 255, 255, .08); }
#keepit-exact-overlay.theme-dark .te-study-row.current,
#keepit-exact-overlay.theme-dark .te-study-row.current.solved { background: rgba(245, 158, 11, .1); color: #fcd34d; }
#keepit-exact-overlay.theme-dark .te-study-num { background: #262626; color: #a1a1aa; }
#keepit-exact-overlay.theme-dark .te-study-row.current .te-study-num { background: #f59e0b; color: #000; }
#keepit-exact-overlay.theme-dark .te-study-vi { color: #a1a1aa; }

#keepit-exact-overlay #te-study-center,
#keepit-exact-overlay #te-study-notes {
  position: relative;
  z-index: 1;
  display: none;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
  background: #fff;
  color: #111827;
}
#keepit-exact-overlay.te-study-active #te-study-center,
#keepit-exact-overlay.te-study-active #te-study-notes { display: flex; }
#keepit-exact-overlay #te-study-center { position: relative; grid-area: 1 / 3 / 2 / 4; border-right: 1px solid #e5e7eb; }
#keepit-exact-overlay #te-study-notes { grid-area: 1 / 5 / 2 / 6; }
#keepit-exact-overlay.theme-dark #te-study-center,
#keepit-exact-overlay.theme-dark #te-study-notes { background: #121212; color: #f3f4f6; }
#keepit-exact-overlay.te-study-active.te-ambient-on #te-study-center,
#keepit-exact-overlay.te-study-active.te-ambient-on #te-study-notes { background-color: transparent; }
#keepit-exact-overlay.te-study-active.te-study-column-left-hidden > .te-left-section {
  grid-area: 1 / 1 / 2 / 4;
  display: flex !important;
  z-index: 1;
  pointer-events: none;
}
#keepit-exact-overlay.te-study-active.te-study-column-left-hidden > .te-ambient-layer { z-index: 3; }
#keepit-exact-overlay.te-study-active.te-study-column-left-hidden > .te-study-player-mask { display: block; }
#keepit-exact-overlay.te-study-active.te-study-column-left-hidden #te-study-center,
#keepit-exact-overlay.te-study-active.te-study-column-left-hidden #te-study-notes { z-index: 4; }
#keepit-exact-overlay.theme-dark #te-study-center { border-color: #27272a; }
#keepit-exact-overlay.theme-light .te-study-panel-head { background: #f9fafb; }
#keepit-exact-overlay.theme-dark .te-study-panel-head { background: #16161c; }
#keepit-exact-overlay .te-study-panel-head { flex: 0 0 auto; }
#keepit-exact-overlay .te-study-close {
  width: 30px;
  height: 30px;
  margin: 0;
  border-radius: 6px;
  color: #6b7280;
  font: inherit;
  font-size: 22px;
  line-height: 1;
}
#keepit-exact-overlay .te-study-close:hover { color: #111827; background: rgba(148, 163, 184, .14); }
#keepit-exact-overlay.theme-dark .te-study-close { color: #a1a1aa; }
#keepit-exact-overlay.theme-dark .te-study-close:hover { color: #fff; background: rgba(255,255,255,.08); }
#keepit-exact-overlay .te-study-center-body {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
  gap: 12px;
  overflow: auto;
  padding: 6px clamp(12px, 2vw, 14px);
}
#keepit-exact-overlay .te-dict-acc { display: inline-flex; align-items: center; gap: 6px; color: #6b7280; font-size: 12px; }
#keepit-exact-overlay .te-dict-acc-label::after { content: ":"; }
#keepit-exact-overlay.theme-dark .te-dict-acc { color: #a1a1aa; }
#keepit-exact-overlay .te-study-audio-card { display: flex; flex: none; align-items: center; justify-content: space-between; gap: 12px; padding: 12px; border: 1px solid #e5e7eb; border-radius: 12px; background: #f9fafb; }
#keepit-exact-overlay.theme-dark .te-study-audio-card { border-color: #27272a; background: rgba(255, 255, 255, .03); }
#keepit-exact-overlay .te-study-audio-btn { display: inline-flex; flex: none; align-items: center; justify-content: center; width: 42px; height: 42px; border: 0; border-radius: 10px; background: #f59e0b; color: #000; cursor: pointer; box-shadow: 0 4px 12px rgba(245, 158, 11, .3); }
#keepit-exact-overlay .te-study-audio-btn:hover { background: #fbbf24; }
#keepit-exact-overlay .te-study-audio-btn svg { width: 20px; height: 20px; }
#keepit-exact-overlay .te-study-audio-text { display: flex; flex: 1; min-width: 0; flex-direction: column; gap: 2px; }
#keepit-exact-overlay .te-study-audio-title { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 650; }
#keepit-exact-overlay .te-study-chip { padding: 1px 6px; border-radius: 4px; background: #e5e7eb; color: #4b5563; font-size: 10px; font-weight: 600; }
#keepit-exact-overlay.theme-dark .te-study-chip { background: #262626; color: #d4d4d8; }
#keepit-exact-overlay .te-study-audio-text p { margin: 0; color: #6b7280; font-size: 11px; }
#keepit-exact-overlay.theme-dark .te-study-audio-text p { color: #a1a1aa; }
#keepit-exact-overlay .te-study-media-toggle {
  display: inline-flex;
  flex: 0 0 36px;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid #d1d5db;
  border-radius: 9px;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  transition: background .2s ease, color .2s ease, border-color .2s ease, transform .2s ease;
}
#keepit-exact-overlay .te-study-media-toggle:hover { border-color: #8b5cf6; background: rgba(139, 92, 246, .1); color: #7c3aed; }
#keepit-exact-overlay .te-study-media-toggle:active { transform: scale(.94); }
#keepit-exact-overlay .te-study-media-toggle svg { width: 18px; height: 18px; }
#keepit-exact-overlay.theme-dark .te-study-media-toggle { border-color: #3f3f46; color: #d4d4d8; }
#keepit-exact-overlay.theme-dark .te-study-media-toggle:hover { border-color: #a78bfa; color: #c4b5fd; }
#keepit-exact-overlay .te-dict-hints-toggle {
  display: inline-flex;
  flex: 0 0 36px;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid #d1d5db;
  border-radius: 9px;
  background: transparent;
  color: #9ca3af;
  cursor: pointer;
  transition: background .2s ease, color .2s ease, border-color .2s ease, transform .2s ease;
}
#keepit-exact-overlay .te-dict-hints-toggle svg { width: 18px; height: 18px; }
#keepit-exact-overlay .te-dict-hints-toggle.active { background: transparent; color: #6b7280; }
#keepit-exact-overlay .te-dict-hints-toggle:hover { border-color: #8b5cf6; background: rgba(139, 92, 246, .1); }
#keepit-exact-overlay .te-dict-hints-toggle:active { transform: scale(.94); }
#keepit-exact-overlay.theme-dark .te-dict-hints-toggle { border-color: #3f3f46; color: #71717a; }
#keepit-exact-overlay.theme-dark .te-dict-hints-toggle.active { background: transparent; color: #fff; }
#keepit-exact-overlay.theme-dark .te-dict-hints-toggle:hover { border-color: #a78bfa; }
#keepit-exact-overlay.te-study-active .te-study-audio-card { padding-block: 9.6px; }
#keepit-exact-overlay.te-study-active .te-study-audio-btn { width: 33.6px; height: 33.6px; border-radius: 8px; }
#keepit-exact-overlay.te-study-active .te-study-audio-btn svg { width: 16px; height: 16px; }
#keepit-exact-overlay.te-study-active .te-study-media-toggle,
#keepit-exact-overlay.te-study-active .te-dict-hints-toggle {
  flex-basis: 28.8px; width: 28.8px; height: 28.8px; border-radius: 7.2px;
}
#keepit-exact-overlay.te-study-active .te-study-media-toggle svg,
#keepit-exact-overlay.te-study-active .te-dict-hints-toggle svg { width: 14.4px; height: 14.4px; }
#keepit-exact-overlay.te-study-active .te-study-audio-text { gap: 1.6px; }
#keepit-exact-overlay.te-study-active .te-study-chip { padding-block: .8px; }
#keepit-exact-overlay .te-dict-work { display: flex; flex: 1; min-height: 0; flex-direction: column; justify-content: center; gap: 12px; }
#keepit-exact-overlay .te-dict-answer-stack { position: relative; display: flex; flex-direction: column; gap: 12px; }
#keepit-exact-overlay.te-study-active:not(.te-shadowing-active).te-dict-answer-stack-pending .te-dict-answer-stack { top: -50px; }
#keepit-exact-overlay .te-dict-work.te-dict-has-error .te-dict-answer-stack > .te-dict-error { position: absolute; top: calc(100% + 12px); left: 0; right: 0; z-index: 1; }
#keepit-exact-overlay .te-dict-proper-noun-hint { display: flex; flex-wrap: wrap; align-items: baseline; gap: 5px; padding: 8px 12px; border: 1px solid rgba(245, 158, 11, .22); border-radius: 9px; background: rgba(245, 158, 11, .08); color: #92400e; font-size: 15px; line-height: 1.45; }
#keepit-exact-overlay .te-dict-proper-noun-hint[hidden] { display: none !important; }
#keepit-exact-overlay .te-dict-proper-noun-hint strong { font-weight: 750; }
#keepit-exact-overlay .te-dict-proper-noun-hint > span { font-weight: 700; }
#keepit-exact-overlay.theme-dark .te-dict-proper-noun-hint { border-color: rgba(251, 191, 36, .24); background: rgba(245, 158, 11, .12); color: #fcd34d; }
#keepit-exact-overlay .te-dict-input-wrap { position: relative; width: 100%; min-height: 110px; }
#keepit-exact-overlay .te-dict-input { position: relative; z-index: 1;
  display: block;
  width: 100%;
  min-height: 110px;
  resize: none;
  overflow-y: auto;
  padding: 16px;
  border: 1.5px solid rgba(245, 158, 11, .4);
  border-radius: 12px;
  outline: none;
  background: #fff;
  color: #111827;
  caret-color: #f59e0b;
  font: inherit;
  font-size: clamp(18px, 1.6vw, 24px);
  font-weight: 700;
  letter-spacing: .01em;
  line-height: 1.6;
  transition: border-color .2s ease, box-shadow .2s ease, background-color .2s ease;
}
#keepit-exact-overlay .te-dict-input:focus { border-color: #f59e0b; box-shadow: 0 0 18px rgba(245, 158, 11, .3); }
#keepit-exact-overlay .te-dict-input.correct { border-color: #10b981; background: rgba(16, 185, 129, .12); color: #10b981; box-shadow: 0 0 18px rgba(16, 185, 129, .25); }
#keepit-exact-overlay .te-dict-input-markup { position: absolute; z-index: 2; inset: 0; overflow: hidden; border-radius: 12px; pointer-events: none; }
#keepit-exact-overlay .te-dict-input-markup[hidden] { display: none !important; }
#keepit-exact-overlay .te-dict-input-markup-content { position: absolute; inset: 0; box-sizing: border-box; padding: 16px; border: 1.5px solid transparent; border-radius: 12px; color: transparent; font: inherit; font-size: clamp(18px, 1.6vw, 24px); font-weight: 700; letter-spacing: .01em; line-height: 1.6; white-space: pre-wrap; overflow-wrap: break-word; word-break: normal; user-select: none; }
#keepit-exact-overlay .te-dict-input-wrong-word { text-decoration-line: underline; text-decoration-color: #dc2626; text-decoration-thickness: 3px; text-underline-offset: 4px; text-decoration-skip-ink: none; }
#keepit-exact-overlay .te-dict-input-missing-gap { background-image: linear-gradient(#dc2626, #dc2626); background-repeat: no-repeat; background-position: left bottom; background-size: 100% 3px; }
#keepit-exact-overlay .te-dict-input-missing-gap-leading { display: inline-block; position: relative; width: 0; height: 1em; vertical-align: baseline; }
#keepit-exact-overlay .te-dict-input-missing-gap-leading::after { content: ""; position: absolute; left: -1em; bottom: -.2em; width: .9em; border-bottom: 3px solid #dc2626; }
#keepit-exact-overlay.theme-dark .te-dict-input-wrong-word { text-decoration-color: #f87171; }
#keepit-exact-overlay.theme-dark .te-dict-input-missing-gap { background-image: linear-gradient(#f87171, #f87171); }
#keepit-exact-overlay.theme-dark .te-dict-input-missing-gap-leading::after { border-bottom-color: #f87171; }
#keepit-exact-overlay .te-study-note-input:focus { border-color: #f59e0b; box-shadow: 0 0 0 2px rgba(245, 158, 11, .16); }
#keepit-exact-overlay.theme-dark .te-dict-input { background: #18181b; color: #f3f4f6; }
#keepit-exact-overlay.theme-dark .te-dict-input.correct { background: rgba(16, 185, 129, .12); color: #10b981; }
#keepit-exact-overlay .te-dict-hint,
#keepit-exact-overlay .te-shadowing-shortcuts { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); align-items: center; gap: 2px; padding: 0; color: #6b7280; font-size: 12px; line-height: 1.5; }
#keepit-exact-overlay .te-dict-hint > span,
#keepit-exact-overlay .te-shadowing-shortcuts > span { min-width: 0; text-align: center; white-space: nowrap; }
#keepit-exact-overlay .te-dict-hint > span:first-child,
#keepit-exact-overlay .te-shadowing-shortcuts > span:first-child { text-align: left; }
#keepit-exact-overlay .te-dict-hint > span:last-child,
#keepit-exact-overlay .te-shadowing-shortcuts > span:last-child { text-align: right; }
#keepit-exact-overlay.theme-dark .te-dict-hint,
#keepit-exact-overlay.theme-dark .te-shadowing-shortcuts { color: #a1a1aa; }
#keepit-exact-overlay .te-dict-error { display: flex; flex-direction: column; gap: 8px; padding: 12px; border: 1px solid rgba(239, 68, 68, .3); border-radius: 12px; background: rgba(239, 68, 68, .08); }
#keepit-exact-overlay .te-dict-error[hidden], #keepit-exact-overlay .te-study-success[hidden] { display: none !important; }
#keepit-exact-overlay .te-dict-error-title { display: flex; align-items: center; gap: 8px; color: #dc2626; font-size: 12px; font-weight: 700; }
#keepit-exact-overlay.theme-dark .te-dict-error-title { color: #f87171; }
#keepit-exact-overlay .te-dict-error.te-dict-error-success { border-color: rgba(16, 185, 129, .3); background: rgba(16, 185, 129, .1); }
#keepit-exact-overlay .te-dict-error.te-dict-error-success .te-dict-error-title { color: #059669; }
#keepit-exact-overlay.theme-dark .te-dict-error.te-dict-error-success .te-dict-error-title { color: #34d399; }
#keepit-exact-overlay .te-dict-error-words { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; font-size: 14px; font-weight: 700; }
#keepit-exact-overlay .te-dict-error-words,
#keepit-exact-overlay .te-dict-error-words *,
#keepit-exact-overlay .te-shadowing-result .te-shadowing-word { font-size: 14px !important; }
#keepit-exact-overlay .te-dict-wg { display: inline-flex; flex: 0 0 auto; align-items: center; gap: 4px; border: 1px solid #059669; border-radius: 6px; background: #f3f4f6; }
#keepit-exact-overlay.theme-dark .te-dict-wg { background: #18181b; }
#keepit-exact-overlay .te-dict-w,
#keepit-exact-overlay .te-shadowing-word { padding: 2px 6px; border-radius: 4px; font-size: 12px; font-weight: 700; }
#keepit-exact-overlay .te-dict-w.ok,
#keepit-exact-overlay .te-shadowing-word.ok { background: rgba(16, 185, 129, .2); color: #059669; }
#keepit-exact-overlay .te-dict-w.bad,
#keepit-exact-overlay .te-shadowing-word.wrong,
#keepit-exact-overlay .te-shadowing-word.extra { background: rgba(239, 68, 68, .2); color: #dc2626; text-decoration: line-through; }
#keepit-exact-overlay .te-dict-w.fix,
#keepit-exact-overlay .te-shadowing-word.fix,
#keepit-exact-overlay .te-shadowing-word.missing { background: rgba(245, 158, 11, .2); color: #b45309; font-size: 11px; }
#keepit-exact-overlay .te-dict-missing-hints { flex: 0 0 auto; color: #b45309; white-space: nowrap; letter-spacing: .08em; }
#keepit-exact-overlay.theme-dark .te-dict-missing-hints { color: #fcd34d; }
#keepit-exact-overlay.theme-dark .te-dict-w.ok,
#keepit-exact-overlay.theme-dark .te-shadowing-word.ok { color: #34d399; }
#keepit-exact-overlay.theme-dark .te-dict-w.bad,
#keepit-exact-overlay.theme-dark .te-shadowing-word.wrong,
#keepit-exact-overlay.theme-dark .te-shadowing-word.extra { color: #f87171; }
#keepit-exact-overlay.theme-dark .te-dict-w.fix,
#keepit-exact-overlay.theme-dark .te-shadowing-word.fix,
#keepit-exact-overlay.theme-dark .te-shadowing-word.missing { color: #fcd34d; }
#keepit-exact-overlay .te-dict-empty { color: #6b7280; font-size: 12px; font-style: italic; font-weight: 400; }
#keepit-exact-overlay .te-study-success { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px; border: 1px solid rgba(16, 185, 129, .3); border-radius: 12px; background: rgba(16, 185, 129, .1); color: #059669; font-size: 12px; font-weight: 800; }
#keepit-exact-overlay.theme-dark .te-study-success { color: #34d399; }
#keepit-exact-overlay .te-study-success.te-shadowing-feedback { justify-content: flex-start; text-align: left; }
#keepit-exact-overlay .te-study-success.te-shadowing-feedback .te-study-success-copy { display: flex; flex: 1 1 auto; min-width: 0; flex-direction: column; gap: 4px; }
#keepit-exact-overlay .te-shadowing-feedback-sentence { display: block; overflow-wrap: anywhere; font-size: 12px; font-weight: 600; line-height: 1.45; }
#keepit-exact-overlay .te-shadowing-feedback-accuracy { display: inline-flex; flex: 0 0 auto; align-items: center; gap: 4px; white-space: nowrap; font-size: 12px; }
#keepit-exact-overlay .te-shadowing-feedback-sentence[hidden],
#keepit-exact-overlay .te-shadowing-feedback-accuracy[hidden] { display: none !important; }
#keepit-exact-overlay .te-study-success.te-shadowing-feedback.state-warn { border-color: rgba(245,158,11,.38); background: rgba(245,158,11,.1); color: #b45309; }
#keepit-exact-overlay .te-study-success.te-shadowing-feedback.state-fail { border-color: rgba(239,68,68,.34); background: rgba(239,68,68,.08); color: #dc2626; }
#keepit-exact-overlay.te-shadowing-active #te-dict-check { display: none !important; }
#keepit-exact-overlay.theme-dark .te-study-success.te-shadowing-feedback.state-warn { color: #fbbf24; }
#keepit-exact-overlay.theme-dark .te-study-success.te-shadowing-feedback.state-fail { color: #f87171; }
#keepit-exact-overlay .te-study-success.te-shadowing-toast { position: absolute; top: 48px; left: 50%; z-index: 30; box-sizing: border-box; width: min(480px, calc(100% - 24px)); min-height: 78px; padding: 14px 20px; justify-content: flex-start; gap: 16px; transform: translateX(-50%); border-radius: 22px; backdrop-filter: blur(40px) saturate(200%); -webkit-backdrop-filter: blur(40px) saturate(200%); transition: transform .25s cubic-bezier(.175,.885,.32,1.2); pointer-events: none; }
#keepit-exact-overlay .te-study-success.te-shadowing-toast:hover { transform: translateX(-50%) scale(1.02); }
#keepit-exact-overlay .te-study-success.te-shadowing-toast.te-shadowing-toast-spring { animation: teDictSpeechToastSpringPop .5s cubic-bezier(.175,.885,.32,1.275) both; }
@keyframes teDictSpeechToastSpringPop {
  0% { opacity: 0; transform: translate(-50%, 24px) scale(.9); }
  70% { transform: translate(-50%, -4px) scale(1.02); }
  100% { opacity: 1; transform: translate(-50%, 0) scale(1); }
}
#keepit-exact-overlay .te-study-success.te-shadowing-toast > svg { display: none; }
#keepit-exact-overlay .te-study-success.te-shadowing-toast #te-study-success-message { font-size: 15px; letter-spacing: -.01em; }
#keepit-exact-overlay .te-shadowing-toast-desc { display: block; color: rgba(255,255,255,.7); font-size: 12px; font-weight: 400; line-height: 1.4; }
#keepit-exact-overlay .te-shadowing-toast-desc[hidden] { display: none !important; }
#keepit-exact-overlay .te-shadowing-toast-ring { position: relative; display: grid; flex: 0 0 50px; width: 50px; height: 50px; place-items: center; }
#keepit-exact-overlay .te-shadowing-toast-ring[hidden] { display: none !important; }
#keepit-exact-overlay .te-shadowing-toast-ring svg { width: 100%; height: 100%; overflow: visible; transform: rotate(-90deg); }
#keepit-exact-overlay .te-shadowing-toast-ring-bg { fill: none; stroke: rgba(255,255,255,.12); stroke-width: 4; }
#keepit-exact-overlay .te-shadowing-toast-ring-fill { fill: none; stroke: #10b981; stroke-width: 4; stroke-linecap: round; filter: drop-shadow(0 0 4px #10b981); transition: stroke-dashoffset .35s ease, stroke .2s ease; }
#keepit-exact-overlay .te-shadowing-toast-ring > span { position: absolute; color: #fff; font-size: 12px; font-weight: 800; font-variant-numeric: tabular-nums; }
#keepit-exact-overlay .te-study-success.te-shadowing-toast.state-pass { border-color: rgba(16,185,129,.35); background: rgba(16,185,129,.18); box-shadow: 0 12px 32px rgba(16,185,129,.15), inset 0 1px 1px rgba(255,255,255,.2); color: #6ee7b7; }
#keepit-exact-overlay .te-study-success.te-shadowing-toast.state-pass .te-shadowing-toast-ring-fill { stroke: #10b981; filter: drop-shadow(0 0 4px #10b981); }
#keepit-exact-overlay .te-study-success.te-shadowing-toast.state-warn { border-color: rgba(245,158,11,.35); background: rgba(245,158,11,.18); box-shadow: 0 12px 32px rgba(245,158,11,.15), inset 0 1px 1px rgba(255,255,255,.2); color: #fde047; }
#keepit-exact-overlay .te-study-success.te-shadowing-toast.state-warn .te-shadowing-toast-ring-fill { stroke: #f59e0b; filter: drop-shadow(0 0 4px #f59e0b); }
#keepit-exact-overlay .te-study-success.te-shadowing-toast.state-fail { border-color: rgba(239,68,68,.35); background: rgba(239,68,68,.18); box-shadow: 0 12px 32px rgba(239,68,68,.15), inset 0 1px 1px rgba(255,255,255,.2); color: #fca5a5; }
#keepit-exact-overlay .te-study-success.te-shadowing-toast.state-fail .te-shadowing-toast-ring-fill { stroke: #ef4444; filter: drop-shadow(0 0 4px #ef4444); }
#keepit-exact-overlay.theme-light .te-study-success.te-shadowing-toast.state-pass { background: rgba(236,253,245,.96); color: #047857; }
#keepit-exact-overlay.theme-light .te-study-success.te-shadowing-toast.state-warn { background: rgba(255,251,235,.96); color: #b45309; }
#keepit-exact-overlay.theme-light .te-study-success.te-shadowing-toast.state-fail { background: rgba(254,242,242,.96); color: #b91c1c; }
#keepit-exact-overlay.theme-light .te-shadowing-toast-desc { color: rgba(17,24,39,.72); }
#keepit-exact-overlay.theme-light .te-shadowing-toast-ring-bg { stroke: rgba(17,24,39,.12); }
#keepit-exact-overlay.theme-light .te-shadowing-toast-ring > span { color: #111827; }
@media (prefers-reduced-motion: reduce) { #keepit-exact-overlay .te-study-success.te-shadowing-toast, #keepit-exact-overlay .te-study-success.te-shadowing-toast.te-shadowing-toast-spring { transition: none; animation: none !important; } #keepit-exact-overlay .te-shadowing-toast-ring-fill { transition: none; } }
#keepit-exact-overlay .te-study-translation { padding: 12px; border: 1px solid rgba(245, 158, 11, .3); border-radius: 12px; background: rgba(245, 158, 11, .06); color: #92400e; font-size: clamp(14px, 1.1vw, 16px); font-weight: 700; line-height: 1.55; text-align: center; }
#keepit-exact-overlay.theme-dark .te-study-translation { color: #fcd34d; }
#keepit-exact-overlay .te-study-translation[hidden] { display: none !important; }
#keepit-exact-overlay .te-study-footer { display: flex; flex: none; flex-direction: column; gap: 10px; padding: 10px clamp(12px, 2vw, 28px) 14px; border-top: 1px solid #e5e7eb; }
#keepit-exact-overlay.theme-dark .te-study-footer { border-color: #27272a; }
#keepit-exact-overlay .te-study-repeat { display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 12px; margin-bottom: 2px;}
#keepit-exact-overlay .te-study-repeat-label { color: #6b7280; font-weight: 700; }
#keepit-exact-overlay .te-study-repeat-btn { padding: 2px 8px; border: 1px solid transparent; border-radius: 4px; background: transparent; color: #6b7280; font: inherit; font-size: 12px; cursor: pointer; }
#keepit-exact-overlay .te-study-repeat-btn:hover { color: #f59e0b; }
#keepit-exact-overlay .te-study-repeat-btn.active { border-color: rgba(245, 158, 11, .4); background: rgba(245, 158, 11, .2); color: #d97706; font-weight: 700; }
#keepit-exact-overlay .te-study-actions { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 8px; }
#keepit-exact-overlay.te-shadowing-active .te-study-actions { grid-template-columns: repeat(4, minmax(0, 1fr)); width: 100%; }
#keepit-exact-overlay .te-study-act { display: inline-flex; align-items: center; justify-content: center; gap: 5px; min-width: 0; padding: 10px 6px; border: 1px solid #d1d5db; border-radius: 8px; background: #f3f4f6; color: #1f2937; font: inherit; font-size: 12px; font-weight: 500; white-space: nowrap; cursor: pointer; transition: background-color .15s ease, opacity .15s ease; }
#keepit-exact-overlay .te-study-act:hover:not(:disabled) { background: #e5e7eb; }
#keepit-exact-overlay .te-study-act svg { flex: none; width: 14px; height: 14px; }
#keepit-exact-overlay .te-study-act:disabled { opacity: .42; cursor: not-allowed; }
#keepit-exact-overlay.theme-dark .te-study-act { border-color: #404040; background: #262626; color: #e2e8f0; }
#keepit-exact-overlay.theme-dark .te-study-act:hover:not(:disabled) { background: #333; }
#keepit-exact-overlay .te-dict-act-primary,
#keepit-exact-overlay.theme-dark .te-dict-act-primary { border-color: #f59e0b; background: #f59e0b; color: #000; font-weight: 700; box-shadow: 0 4px 10px rgba(245, 158, 11, .2); }
#keepit-exact-overlay .te-dict-act-primary:hover:not(:disabled),
#keepit-exact-overlay.theme-dark .te-dict-act-primary:hover:not(:disabled) { background: #fbbf24; }
#keepit-exact-overlay .te-study-note-body { position: relative; display: flex; flex: 1; min-height: 0; flex-direction: column; gap: 12px; overflow: auto; padding: 14px; }
#keepit-exact-overlay .te-study-stats-host { display: flex; flex: 0 0 50vh; min-height: 220px; height: 50vh; overflow: hidden; }
#keepit-exact-overlay .te-study-stats-card { display: flex; flex: 1 1 auto; min-width: 0; min-height: 0; flex-direction: column; overflow: hidden; border: 0; border-radius: 12px; background: #fff; color: #111827; box-shadow: 0 1px 3px rgba(0,0,0,.08); }
#keepit-exact-overlay .te-study-stats-head { display: flex; flex: none; align-items: center; justify-content: space-between; gap: 8px; padding: 9px 0; border-bottom: 1px solid #e5e7eb; background: #f9fafb; }
#keepit-exact-overlay .te-study-stats-title-group { display: flex; min-width: 0; align-items: center; gap: 8px; }
#keepit-exact-overlay .te-study-stats-icon { display: grid; width: 26px; height: 26px; flex: none; place-items: center; border: 1px solid rgba(245,158,11,.35); border-radius: 7px; background: rgba(245,158,11,.12); color: #d97706; }
#keepit-exact-overlay .te-study-stats-icon svg { width: 14px; height: 14px; }
#keepit-exact-overlay .te-study-stats-title-copy { min-width: 0; }
#keepit-exact-overlay .te-study-stats-title-copy h3 { margin: 0; font-size: 13px; font-weight: 750; line-height: 1.3; }
#keepit-exact-overlay .te-study-stats-title-copy p { margin: 2px 0 0; color: #6b7280; font-size: 11px; line-height: 1.3; }
#keepit-exact-overlay .te-study-stats-count { flex: none; padding: 3px 9px; border: 1px solid rgba(245,158,11,.35); border-radius: 20px; background: rgba(245,158,11,.1); color: #b45309; font-size: 12px; font-weight: 700; font-variant-numeric: tabular-nums; white-space: nowrap; }
#keepit-exact-overlay .te-study-stats-filter-bar { display: flex; flex: none; align-items: center; gap: 5px; padding: 7px 0; border-bottom: 1px solid #e5e7eb; }
#keepit-exact-overlay .te-study-stats-search { position: relative; display: flex; flex: 1 1 auto; min-width: 0; align-items: center; }
#keepit-exact-overlay .te-study-stats-search > svg { position: absolute; left: 7px; width: 13px; height: 13px; color: #6b7280; }
#keepit-exact-overlay .te-study-stats-search input { width: 100%; min-width: 0; padding: 5px 7px 5px 25px; border: 1px solid #d1d5db; border-radius: 6px; outline: 0; background: #fff; color: #374151; font: inherit; font-size: 12px; }
#keepit-exact-overlay .te-study-stats-search input::placeholder { color: #9ca3af; }
#keepit-exact-overlay .te-study-stats-filter { flex: none; padding: 4px 7px; border: 1px solid #d1d5db; border-radius: 6px; background: #f3f4f6; color: #6b7280; font: inherit; font-size: 12px; font-weight: 600; white-space: nowrap; cursor: pointer; }
#keepit-exact-overlay .te-study-stats-filter.active { border-color: rgba(245,158,11,.45); background: rgba(245,158,11,.14); color: #b45309; }
#keepit-exact-overlay .te-study-stats-scroll { display: flex; flex: 1 1 auto; min-height: 0; flex-direction: column; gap: 7px; overflow-y: auto; overscroll-behavior: contain; padding: 8px 0; scrollbar-width: auto; scrollbar-color: auto; }
#keepit-exact-overlay .te-study-stats-empty { margin: auto; padding: 18px 8px; color: #6b7280; font-size: 12px; line-height: 1.5; text-align: center; }
#keepit-exact-overlay .te-study-stats-scroll::-webkit-scrollbar { width: var(--lhn-scrollbar-width); }
#keepit-exact-overlay .te-study-stats-scroll::-webkit-scrollbar-track { background: transparent; }
#keepit-exact-overlay .te-study-stats-scroll::-webkit-scrollbar-thumb { border-radius: 999px; background: #cbd5e1; }
@supports (-moz-appearance: none) {
  #keepit-exact-overlay .te-study-stats-scroll { scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent; }
  #keepit-exact-overlay.theme-dark .te-study-stats-scroll { scrollbar-color: #a1a1aa transparent; }
}
#keepit-exact-overlay .te-study-stats-word { display: flex; flex: none; flex-direction: column; gap: 7px; padding: 8px 9px; border: 1px solid #e5e7eb; border-radius: 9px; background: #fff; transition: border-color .15s ease, background-color .15s ease; }
#keepit-exact-overlay .te-study-stats-word:hover { border-color: rgba(245,158,11,.45); background: #fffdf7; }
#keepit-exact-overlay .te-study-stats-word-head { display: flex; align-items: center; justify-content: space-between; gap: 7px; }
#keepit-exact-overlay .te-study-stats-word-title { display: flex; min-width: 0; align-items: center; gap: 7px; }
#keepit-exact-overlay .te-study-stats-rank { flex: none; width: 20px; color: #6b7280; font-size: 12px; font-weight: 800; text-align: center; }
#keepit-exact-overlay .te-study-stats-rank.top3 { padding: 2px 3px; border-radius: 4px; background: rgba(245,158,11,.14); color: #b45309; }
#keepit-exact-overlay .te-study-stats-word-title strong { overflow: hidden; font-size: 13px; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
#keepit-exact-overlay .te-study-stats-status { display: inline-flex; flex: none; align-items: center; gap: 4px; padding: 2px 6px; border: 1px solid transparent; border-radius: 12px; font-size: 11px; font-weight: 700; white-space: nowrap; }
#keepit-exact-overlay .te-study-stats-status i { width: 5px; height: 5px; border-radius: 50%; background: currentColor; }
#keepit-exact-overlay .te-study-stats-status.wrong { border-color: rgba(239,68,68,.28); background: rgba(239,68,68,.1); color: #dc2626; }
#keepit-exact-overlay .te-study-stats-status.correct { border-color: rgba(16,185,129,.28); background: rgba(16,185,129,.1); color: #059669; }
#keepit-exact-overlay .te-study-stats-metrics { display: flex; align-items: center; justify-content: space-between; gap: 4px; color: #6b7280; font-size: 11px; }
#keepit-exact-overlay .te-study-stats-metrics > span { display: inline-flex; align-items: center; gap: 3px; white-space: nowrap; }
#keepit-exact-overlay .te-study-stats-metrics strong { color: #111827; font-weight: 700; }
#keepit-exact-overlay .te-study-stats-metrics .wrong strong { color: #dc2626; }
#keepit-exact-overlay .te-study-stats-metrics .correct strong { color: #059669; }
#keepit-exact-overlay .te-study-stats-accuracy { width: 100%; height: 4px; overflow: hidden; border-radius: 4px; background: #e5e7eb; }
#keepit-exact-overlay .te-study-stats-accuracy span { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg,#f59e0b,#10b981); box-shadow: 0 0 7px rgba(245,158,11,.25); }
#keepit-exact-overlay .te-study-stats-variants { display: grid; grid-template-columns: max-content minmax(0, 1fr) max-content; align-items: start; gap: 5px; padding-top: 5px; border-top: 1px solid #e5e7eb; font-size: 11px; }
#keepit-exact-overlay .te-study-stats-variants-label { grid-column: 1; margin-top: 3px; color: #6b7280; font-weight: 600; white-space: nowrap; }
#keepit-exact-overlay .te-study-stats-variant-list { display: flex; grid-column: 2; min-width: 0; flex-wrap: wrap; align-items: center; gap: 4px; }
#keepit-exact-overlay .te-study-stats-variant { display: inline-flex; align-items: center; gap: 3px; padding: 2px 5px; border: 1px solid rgba(239,68,68,.25); border-radius: 5px; background: rgba(239,68,68,.08); color: #dc2626; font: 12px var(--lhn-app-font-family, 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif); white-space: nowrap; }
#keepit-exact-overlay .te-study-stats-variant b { font-family: inherit; font-size: 11px; }
#keepit-exact-overlay .te-study-stats-more { grid-column: 3; justify-self: end; align-self: start; }
#keepit-exact-overlay .te-study-stats-more > summary { display: inline-flex; min-width: 22px; height: 22px; align-items: center; justify-content: center; gap: 3px; padding: 0 6px; border: 1px solid #d1d5db; border-radius: 6px; background: #f3f4f6; color: #b45309; font-size: 12px; font-weight: 700; line-height: 1; cursor: pointer; list-style: none; user-select: none; }
#keepit-exact-overlay .te-study-stats-more > summary::-webkit-details-marker { display: none; }
#keepit-exact-overlay .te-study-stats-more > summary::marker { content: ""; }
#keepit-exact-overlay .te-study-stats-more > summary svg { display: block; flex: none; }
#keepit-exact-overlay .te-study-stats-more[open] > summary { width: 22px; padding: 0; }
#keepit-exact-overlay .te-study-stats-more > summary:hover { border-color: rgba(245,158,11,.45); background: rgba(245,158,11,.12); }
#keepit-exact-overlay .te-study-stats-more .more-label { display: inline-flex; align-items: center; gap: 3px; font-size: 11px; }
#keepit-exact-overlay .te-study-stats-more .less-label { display: none; align-items: center; }
#keepit-exact-overlay .te-study-stats-more[open] .more-label { display: none; }
#keepit-exact-overlay .te-study-stats-more[open] .less-label { display: inline-flex; }
#keepit-exact-overlay .te-study-stats-variant.extra { display: none; }
#keepit-exact-overlay .te-study-stats-variants.expanded .te-study-stats-variant.extra { display: inline-flex; }
#keepit-exact-overlay.theme-dark .te-study-stats-card { background: #121212; color: #f1f5f9; box-shadow: 0 1px 3px rgba(0,0,0,.3); }
#keepit-exact-overlay.theme-dark .te-study-stats-head { border-color: rgba(255,255,255,.08); background: #121212; }
#keepit-exact-overlay.theme-dark .te-study-stats-title-copy p { color: #94a3b8; }
#keepit-exact-overlay.theme-dark .te-study-stats-count { border-color: rgba(245,158,11,.35); background: rgba(245,158,11,.15); color: #fbbf24; }
#keepit-exact-overlay.theme-dark .te-study-stats-filter-bar { border-color: rgba(255,255,255,.08); }
#keepit-exact-overlay.theme-dark .te-study-stats-search input { border-color: rgba(255,255,255,.08); background: #121212; color: #f1f5f9; }
#keepit-exact-overlay.theme-dark .te-study-stats-filter { border-color: rgba(255,255,255,.08); background: #1a1a1a; color: #94a3b8; }
#keepit-exact-overlay.theme-dark .te-study-stats-filter.active { border-color: rgba(245,158,11,.35); background: rgba(245,158,11,.15); color: #fbbf24; }
#keepit-exact-overlay.theme-dark .te-study-stats-empty { color: #94a3b8; }
#keepit-exact-overlay.theme-dark .te-study-stats-scroll::-webkit-scrollbar-thumb { background: #a1a1aa; }
#keepit-exact-overlay.theme-dark .te-study-stats-word { border-color: rgba(255,255,255,.06); background: #121212; box-shadow: 0 1px 3px rgba(0,0,0,.3); }
#keepit-exact-overlay.theme-dark .te-study-stats-word:hover { border-color: rgba(245,158,11,.35); background: #18181b; }
#keepit-exact-overlay.theme-dark .te-study-stats-word-title strong { color: #f1f5f9; }
#keepit-exact-overlay.theme-dark .te-study-stats-rank { color: #64748b; }
#keepit-exact-overlay.theme-dark .te-study-stats-rank.top3 { background: rgba(245,158,11,.15); color: #fbbf24; }
#keepit-exact-overlay.theme-dark .te-study-stats-status.wrong { border-color: rgba(239,68,68,.3); background: rgba(239,68,68,.15); color: #f87171; }
#keepit-exact-overlay.theme-dark .te-study-stats-status.correct { border-color: rgba(16,185,129,.3); background: rgba(16,185,129,.15); color: #10b981; }
#keepit-exact-overlay.theme-dark .te-study-stats-metrics { color: #94a3b8; }
#keepit-exact-overlay.theme-dark .te-study-stats-metrics strong { color: #f1f5f9; }
#keepit-exact-overlay.theme-dark .te-study-stats-metrics .wrong strong { color: #f87171; }
#keepit-exact-overlay.theme-dark .te-study-stats-metrics .correct strong { color: #10b981; }
#keepit-exact-overlay.theme-dark .te-study-stats-accuracy { background: rgba(255,255,255,.08); }
#keepit-exact-overlay.theme-dark .te-study-stats-variants { border-color: rgba(255,255,255,.06); }
#keepit-exact-overlay.theme-dark .te-study-stats-variants-label { color: #64748b; }
#keepit-exact-overlay.theme-dark .te-study-stats-variant { border-color: rgba(239,68,68,.3); background: rgba(239,68,68,.15); color: #f87171; }
#keepit-exact-overlay.theme-dark .te-study-stats-more > summary { border-color: rgba(255,255,255,.08); background: rgba(255,255,255,.05); color: #fbbf24; }
#keepit-exact-overlay.theme-dark .te-study-stats-more > summary:hover { border-color: rgba(245,158,11,.35); background: rgba(245,158,11,.15); }
#keepit-exact-overlay .te-study-note-label { display: block; margin-bottom: 5px; color: #6b7280; font-size: 11px; font-weight: 700; }
#keepit-exact-overlay .te-study-note-text-wrap { display: flex; flex: 1; min-height: 0; flex-direction: column; }
#keepit-exact-overlay.theme-dark .te-study-note-label { color: #a1a1aa; }
#keepit-exact-overlay .te-study-note-input {
  width: 100%;
  min-height: 34px;
  padding: 8px 9px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  outline: none;
  background: #fff;
  color: #111827;
  font: inherit;
  font-size: 12px;
}
#keepit-exact-overlay textarea.te-study-note-input { flex: 1; min-height: 90px; resize: none; line-height: 1.5; }
#keepit-exact-overlay.theme-dark .te-study-note-input { background: #121212; border-color: #3f3f46; color: #f3f4f6; }
#keepit-exact-overlay .te-study-lock {
  position: absolute;
  z-index: 2;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 9px;
  padding: 20px;
  background: rgba(255,255,255,.32);
  color: #374151;
  text-align: center;
  backdrop-filter: blur(4px);
}
#keepit-exact-overlay.theme-dark .te-study-lock { background: rgb(18 18 18 / 32%); color: #e5e7eb; }
#keepit-exact-overlay .te-study-lock[hidden] { display: none !important; }
#keepit-exact-overlay .te-study-save { border: 0; background: transparent; color: #b45309; font: inherit; font-size: 11px; font-weight: 700; cursor: pointer; }
#keepit-exact-overlay.theme-dark .te-study-save { color: #fbbf24; }
#keepit-exact-overlay .te-study-saved { flex: none; min-height: 16px; color: #15803d; font-size: 11px; }
#keepit-exact-overlay.theme-dark .te-study-saved { color: #4ade80; }
#keepit-exact-overlay .te-study-head-actions { display: flex; align-items: center; gap: 6px; }
#keepit-exact-overlay .te-study-save { padding: 4px 10px; border: 1px solid #d1d5db; border-radius: 6px; background: #f3f4f6; }
#keepit-exact-overlay.theme-dark .te-study-save { border-color: #404040; background: #262626; }
#keepit-exact-overlay .te-study-note-footer { display: flex; flex: none; align-items: center; justify-content: space-between; gap: 8px; padding: 8px 12px; border-top: 1px solid #e5e7eb; }
#keepit-exact-overlay.theme-dark .te-study-note-footer { border-color: #27272a; }

#keepit-exact-overlay.te-study-active .te-control-bar {
  grid-area: 2 / 1 / 3 / 6;
  position: relative !important;
  left: auto !important;
  bottom: auto !important;
  width: 100% !important;
  height: 70px !important;
  grid-template-columns: repeat(2, minmax(0, 1fr)) 34px repeat(2, minmax(0, 1fr));
  min-width: 0;
  z-index: 5;
}
#keepit-exact-overlay.te-study-active .te-study-primary-group .te-site-icon-box,
#keepit-exact-overlay.te-study-active .te-study-primary-group #te-control-add-vocabulary,
#keepit-exact-overlay.te-study-active .te-study-primary-group #te-notes-sidebar-toggle { display: none !important; }
#keepit-exact-overlay .te-study-toolbar-tools { display: none; align-items: center; gap: 8px; }
#keepit-exact-overlay.te-study-active .te-study-toolbar-tools { display: flex; }
#keepit-exact-overlay .te-study-mode-switch { display: inline-flex; align-items: center; gap: 8px; }
#keepit-exact-overlay .te-study-sync-control {
  display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px;
  padding: 6px; border: 1px solid transparent; border-radius: 7px; background: transparent;
  color: #fff; cursor: pointer; transition: color .15s ease, background-color .15s ease;
}
#keepit-exact-overlay .te-study-sync-control svg { display: block; width: 18px; height: 18px; }
#keepit-exact-overlay .te-study-sync-control.te-active { color: #8b5cf6; }
#keepit-exact-overlay .te-study-sync-control:hover { background: rgba(139,92,246,.1); }
#keepit-exact-overlay .te-study-sync-control:focus-visible { outline: 2px solid #8b5cf6; outline-offset: 2px; }
#keepit-exact-overlay .te-study-sync-control:disabled { opacity: .45; cursor: not-allowed; }
#keepit-exact-overlay .te-study-mode-control {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border: 1px solid #d1d5db;
  border-radius: 7px;
  background: #fff;
  color: #374151;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
}
#keepit-exact-overlay .te-study-mode-control svg { width: 16px; height: 16px; }
#keepit-exact-overlay .te-study-mode-control:hover { border-color: #f59e0b; }
#keepit-exact-overlay .te-study-mode-control.active {
  border-color: #f59e0b;
  background: #f59e0b;
  color: #111827;
}
#keepit-exact-overlay.theme-dark .te-study-mode-control:not(.active) {
  border-color: #3f3f46;
  background: #18181b;
  color: #a1a1aa;
}
#keepit-exact-overlay.theme-dark .te-study-mode-control.active {
  border-color: #f59e0b;
  background: #f59e0b;
  color: #111827;
}
#keepit-exact-overlay .te-study-mode-control:hover { border-color: #f59e0b; }
#keepit-exact-overlay.te-shadowing-active .te-dict-answer-stack { display: none !important; }
#keepit-exact-overlay .te-shadowing-practice { position: relative; display: flex; flex: 1; min-height: 0; flex-direction: column; align-items: center; justify-content: center; gap: 12px; width: 100%; }
#keepit-exact-overlay .te-shadowing-practice[hidden],
#keepit-exact-overlay .te-shadowing-result-wrap[hidden] { display: none !important; }
#keepit-exact-overlay .te-shadowing-controls-spacer { flex: 0 0 100px; width: 100%; height: 146px; }
#keepit-exact-overlay .te-shadowing-controls { position: absolute; right: 0; bottom: -4px; left: 0; display: flex; flex-direction: column; align-items: center; gap: 8px; width: 100%; height: 100px; }
#keepit-exact-overlay .te-shadowing-target {
  display: flex; width: 100%; min-height: 72px; align-items: center; justify-content: center;
  padding: 14px 18px; border: 1px solid rgba(245,158,11,.48); border-radius: 14px;
  background: rgba(245,158,11,.08); color: #b45309; font-size: clamp(18px,1.55vw,24px);
  font-weight: 800; line-height: 1.4; text-align: center;
  transition: border-color .18s ease, background-color .18s ease, color .18s ease;
}
#keepit-exact-overlay.theme-dark .te-shadowing-target { background: rgba(245,158,11,.1); color: #fbbf24; }
#keepit-exact-overlay .te-shadowing-target.state-wrong { border-color: rgba(239,68,68,.55); background: rgba(239,68,68,.09); color: #dc2626; }
#keepit-exact-overlay.theme-dark .te-shadowing-target.state-wrong { background: rgba(239,68,68,.12); color: #f87171; }
#keepit-exact-overlay .te-shadowing-target.state-correct { border-color: rgba(16,185,129,.48); background: rgba(16,185,129,.08); color: #059669; }
#keepit-exact-overlay.theme-dark .te-shadowing-target.state-correct { background: rgba(16,185,129,.09); color: #34d399; }
#keepit-exact-overlay .te-shadowing-shortcuts { width: 100%; }
#keepit-exact-overlay .te-shadowing-practice > .te-study-translation { width: 100%; box-sizing: border-box; }
#keepit-exact-overlay .te-shadowing-result-wrap { width: 100%; padding: 10px 12px; border: 1px solid rgba(16,185,129,.28); border-radius: 12px; background: rgba(16,185,129,.07); }
#keepit-exact-overlay .te-shadowing-result-title { margin-bottom: 8px; color: #059669; font-size: 12px; font-weight: 800; }
#keepit-exact-overlay.theme-dark .te-shadowing-result-title { color: #34d399; }
#keepit-exact-overlay .te-shadowing-result { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 7px; }
#keepit-exact-overlay .te-shadowing-result,
#keepit-exact-overlay .te-shadowing-result *,
#keepit-exact-overlay .te-dict-error-words,
#keepit-exact-overlay .te-dict-error-words *,
#keepit-exact-overlay .te-shadowing-target,
#keepit-exact-overlay #te-study-notes .te-study-stats-word-title strong { -webkit-user-select: text; user-select: text; }
#keepit-exact-overlay .te-shadowing-result .te-shadowing-word,
#keepit-exact-overlay .te-dict-error-words .te-dict-w { cursor: pointer; }
#keepit-exact-overlay .te-shadowing-mic {
  display: inline-flex; flex: none; width: 66px; height: 66px; align-items: center; justify-content: center;
  padding: 0; border: 0; border-radius: 50%; background: #f59e0b; color: #111827; cursor: pointer;
  box-shadow: 0 8px 22px rgba(245,158,11,.22); transition: background .16s ease, transform .16s ease, box-shadow .16s ease;
}
#keepit-exact-overlay .te-shadowing-mic.auto-record-enabled:not(.listening):not(.playing-recording):not(:disabled) {
  position: relative; outline: 1px solid rgba(139,92,246,.82); outline-offset: 4px;
}
#keepit-exact-overlay .te-shadowing-mic:hover { background: #fbbf24; transform: translateY(-1px); }
#keepit-exact-overlay .te-shadowing-mic svg { width: 24px; height: 24px; }
#keepit-exact-overlay .te-shadowing-mic.listening { background: #ef4444; color: #fff; box-shadow: 0 0 0 8px rgba(239,68,68,.14); animation: te-shadowing-mic-pulse 1.25s ease-in-out infinite; }
#keepit-exact-overlay .te-shadowing-mic.playing-recording,
#keepit-exact-overlay .te-shadowing-mic.playing-recording:hover { background: linear-gradient(135deg, #a855f7, #6366f1); color: #fff; box-shadow: 0 0 0 0 rgba(168,85,247,.4), 0 6px 20px rgba(124,58,237,.5); animation: te-shadowing-mic-playback-pulse .9s ease-out infinite; }
#keepit-exact-overlay .te-shadowing-mic:disabled { opacity: .5; cursor: not-allowed; }
#keepit-exact-overlay .te-shadowing-help { display:none; height: 14px; margin: 0; color: #6b7280; font-size: 12px; font-weight: 700; line-height: 14px; text-align: center; }
#keepit-exact-overlay .te-shadowing-privacy { display: none !important; }
#keepit-exact-overlay .te-shadowing-status { flex: 0 0 16px; height: 16px; min-height: 16px; overflow: hidden; color: #6b7280; font-size: 11px; line-height: 16px; text-align: center; }
#keepit-exact-overlay.theme-dark .te-shadowing-status { color: #a1a1aa; }
@keyframes te-shadowing-mic-pulse { 50% { box-shadow: 0 0 0 12px rgba(239,68,68,0); } }
@keyframes te-shadowing-mic-playback-pulse { 70% { box-shadow: 0 0 0 12px rgba(168,85,247,0), 0 6px 20px rgba(124,58,237,.5); } }
@media (prefers-reduced-motion: reduce) { #keepit-exact-overlay .te-shadowing-mic.listening, #keepit-exact-overlay .te-shadowing-mic.playing-recording { animation: none; } }
#keepit-exact-overlay .te-dict-toolbar-accuracy { display: inline-flex; align-items: center; gap: 8px; color: #6b7280; font-size: 11px; white-space: nowrap; }
#keepit-exact-overlay .te-dict-acc-col { display: flex; flex-direction: column; line-height: 1.2; }
#keepit-exact-overlay .te-dict-acc-col strong { color: #b45309; font-size: 13px; font-variant-numeric: tabular-nums; }
#keepit-exact-overlay .te-dict-ring { flex: none; }
#keepit-exact-overlay .te-dict-ring-bg { fill: none; stroke: #e5e7eb; stroke-width: 3; }
#keepit-exact-overlay .te-dict-ring-fg { fill: none; stroke: #f59e0b; stroke-width: 3; stroke-linecap: round; stroke-dasharray: 56.55; stroke-dashoffset: 56.55; transition: stroke-dashoffset .4s ease; }
#keepit-exact-overlay.theme-dark .te-dict-toolbar-accuracy { color: #a1a1aa; }
#keepit-exact-overlay.theme-dark .te-dict-acc-col strong { color: #fbbf24; }
#keepit-exact-overlay.theme-dark .te-dict-ring-bg { stroke: #3f3f46; }
#keepit-exact-overlay .te-shadowing-target.state-warn { border-color: rgba(245,158,11,.58); background: rgba(245,158,11,.1); color: #b45309; }
#keepit-exact-overlay.theme-dark .te-shadowing-target.state-warn { background: rgba(245,158,11,.14); color: #fbbf24; }
#keepit-exact-overlay .te-shadowing-result-wrap.state-warn { border-color: rgba(245,158,11,.42); background: rgba(245,158,11,.08); }
#keepit-exact-overlay .te-shadowing-result-wrap.state-warn .te-shadowing-result-title { color: #b45309; }
#keepit-exact-overlay.theme-dark .te-shadowing-result-wrap.state-warn .te-shadowing-result-title { color: #fbbf24; }
#keepit-exact-overlay .te-shadowing-result-wrap.state-fail { border-color: rgba(239,68,68,.42); background: rgba(239,68,68,.07); }
#keepit-exact-overlay .te-shadowing-result-wrap.state-fail .te-shadowing-result-title { color: #dc2626; }
#keepit-exact-overlay.theme-dark .te-shadowing-result-wrap.state-fail .te-shadowing-result-title { color: #f87171; }
#keepit-exact-overlay.te-study-active.te-dict-score-green .te-dict-score { border-color: rgba(16,185,129,.48); background: rgba(16,185,129,.08); color: #059669; }
#keepit-exact-overlay.te-study-active.te-dict-score-green .te-dict-acc-col strong { color: #059669; }
#keepit-exact-overlay.te-study-active.te-dict-score-green .te-dict-ring-fg { stroke: #10b981; }
#keepit-exact-overlay.theme-dark.te-study-active.te-dict-score-green .te-dict-score,
#keepit-exact-overlay.theme-dark.te-study-active.te-dict-score-green .te-dict-acc-col strong { color: #34d399; }
#keepit-exact-overlay.te-study-active.te-dict-score-yellow .te-dict-score { border-color: rgba(245,158,11,.58); background: rgba(245,158,11,.12); color: #b45309; }
#keepit-exact-overlay.te-study-active.te-dict-score-yellow .te-dict-acc-col strong { color: #b45309; }
#keepit-exact-overlay.te-study-active.te-dict-score-yellow .te-dict-ring-fg { stroke: #f59e0b; }
#keepit-exact-overlay.theme-dark.te-study-active.te-dict-score-yellow .te-dict-score,
#keepit-exact-overlay.theme-dark.te-study-active.te-dict-score-yellow .te-dict-acc-col strong { color: #fbbf24; }
#keepit-exact-overlay.te-study-active.te-dict-score-red .te-dict-score { border-color: rgba(239,68,68,.5); background: rgba(239,68,68,.08); color: #dc2626; }
#keepit-exact-overlay.te-study-active.te-dict-score-red .te-dict-acc-col strong { color: #dc2626; }
#keepit-exact-overlay.te-study-active.te-dict-score-red .te-dict-ring-fg { stroke: #ef4444; }
#keepit-exact-overlay.theme-dark.te-study-active.te-dict-score-red .te-dict-score,
#keepit-exact-overlay.theme-dark.te-study-active.te-dict-score-red .te-dict-acc-col strong { color: #f87171; }
#keepit-exact-overlay.te-study-active .te-control-bar .te-study-primary-group { justify-content: flex-start; }
#keepit-exact-overlay.te-study-active .te-control-bar button:disabled { opacity: .42; cursor: not-allowed; }
#keepit-exact-overlay .te-study-toast {
  position: absolute;
  z-index: 60;
  top: 18px;
  left: 50%;
  max-width: min(90vw, 520px);
  padding: 10px 14px;
  transform: translate(-50%, -8px);
  border: 1px solid rgba(245,158,11,.55);
  border-radius: 8px;
  background: #18181b;
  color: #f4f4f5;
  box-shadow: 0 8px 24px rgba(0,0,0,.24);
  opacity: 0;
  pointer-events: none;
  font: inherit;
  font-size: 13px;
  text-align: center;
  transition: opacity .16s ease, transform .16s ease;
}
#keepit-exact-overlay .te-study-toast.visible { opacity: 1; transform: translate(-50%, 0); }
#keepit-exact-overlay.theme-light .te-study-toast { background: #fff; color: #111827; }
#keepit-exact-overlay .te-dict-confetti-layer { position: absolute; inset: 0; z-index: 70; overflow: hidden; pointer-events: none; contain: layout paint; }
#keepit-exact-overlay .te-dict-confetti { position: absolute; z-index: 70; top: 60%; left: 50%; width: 7px; height: 11px; border-radius: 2px; pointer-events: none; animation: te-dict-confetti-fall 1300ms cubic-bezier(.2, .7, .4, 1) forwards; }
@keyframes te-dict-confetti-fall { 0% { transform: translate(0, 0) rotate(0); opacity: 1; } 40% { transform: translate(var(--ux), var(--uy)) rotate(calc(var(--rot) * .5)); opacity: 1; } 100% { transform: translate(var(--dx), var(--dy)) rotate(var(--rot)); opacity: 0; } }
@media (prefers-reduced-motion: reduce) {
  #keepit-exact-overlay .te-study-toast { transition: none; }
  #keepit-exact-overlay .te-dict-confetti { animation-duration: 1ms; }
}
#keepit-exact-overlay .te-study-row.locked .te-study-text { filter: blur(5px); user-select: none; }
#keepit-exact-overlay .te-study-row.locked { pointer-events: none; }
#keepit-exact-overlay .te-study-row.past .te-study-text { filter: none !important; user-select: text; }
#keepit-exact-overlay .te-study-act.te-dict-ready { background: #f59e0b !important; border-color: #f59e0b !important; color: #000 !important; font-weight: 700; }
#keepit-exact-overlay .te-dict-act-primary.te-dict-done { background: #6b7280 !important; border-color: #6b7280 !important; color: #fff !important; box-shadow: none !important; }
#keepit-exact-overlay #te-study-notes.te-study-notes-locked .te-study-note-body > div:not(.te-study-lock) { filter: blur(5px); user-select: none; pointer-events: none; }
`;
const OVERLAY_HTML = `<div id="keepit-exact-overlay" class="theme-light">
    <!-- Ambient mode: lớp phát sáng nằm dưới mọi thành phần -->
    <div class="te-ambient-layer"><canvas class="te-ambient" width="152" height="48" aria-hidden="true"></canvas><canvas class="te-ambient-edge" width="160" height="90" aria-hidden="true"></canvas></div>
    <!-- Toast thông báo nhanh -->
    <div class="te-view-toast" id="te-view-toast" role="status" aria-live="polite"></div>
    <!-- Left Section -->
    <div class="te-left-section">
      <div class="te-player-slot">
        <div class="te-player-frame"></div>
        <div class="te-reading-mini-audio" role="group" aria-label="Video audio" aria-hidden="true">
          <div class="te-reading-mini-art"><img class="te-reading-mini-thumb" alt="" hidden></div>
          <div class="te-reading-mini-info"><div class="te-reading-mini-title"></div><div class="te-reading-mini-source">Audio</div></div>
          <div class="te-reading-mini-spectrum" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>
          <button class="te-reading-mini-play" id="te-reading-mini-play" type="button" title="Play video audio" aria-label="Play video audio">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
          </button>
        </div>
        <div class="te-study-brand" role="img" aria-label="Keepit">
          <img alt="" aria-hidden="true">
          <span class="te-study-brand-separator">-</span>
          <span class="te-study-brand-name">Keepit</span>
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
          <div class="te-site-icon-box">
            <img class="te-site-favicon" alt="" aria-hidden="true" hidden />
            <svg class="te-site-icon-fallback" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
            </svg>
            <span class="te-source-title-label"><span class="te-source-title-text">The Power Of Practice | You Become What You Practice |...</span></span>
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
          <button class="te-icon-btn" id="te-shadowing-mode-btn" title="Luyện nói" aria-label="Luyện nói" aria-pressed="false"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-mic preview-icon" aria-hidden="true"><path d="M12 19v3"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><rect x="9" y="2" width="6" height="13" rx="3"/></svg></button>
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
          <button class="te-study-media-toggle" id="te-reading-media-toggle" type="button" title="Thu nhỏ video" aria-label="Thu nhỏ video" aria-pressed="false">
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

// Study's static DOM structure is kept with the Overlay template; activity modules bind behavior.
function createStudyUi({ root, tr, makeSvg, repeatCount }) {
    const left = root?.querySelector(".te-left-section");
    const bar = root?.querySelector(".te-control-bar");
    const groups = bar?.querySelectorAll(".te-ctrl-group");
    const primaryGroup = groups?.[0];
    const playerSlot = left?.querySelector(".te-player-slot");
    const brand = playerSlot?.querySelector(".te-study-brand");
    if (!root || !left || !bar || !primaryGroup || !playerSlot || !brand) return;

    const compactAudio = document.createElement("div");
    compactAudio.className = "te-study-mini-audio";
    compactAudio.setAttribute("role", "group");
    compactAudio.setAttribute("aria-label", tr("dictationAudioTitle"));
    compactAudio.innerHTML = `
      <div class="te-study-mini-art"><img class="te-study-mini-thumb" alt=""></div>
      <div class="te-study-mini-info"><div class="te-study-mini-title"></div><div class="te-study-mini-source"></div></div>
      <div class="te-study-spectrum" aria-hidden="true">${Array.from({ length: 5 }, () => '<span></span>').join("")}</div>
      <button class="te-study-mini-play" type="button"><span class="te-study-mini-play-icon">${makeSvg('<path d="M8 5v14l11-7z"/>')}</span></button>`;
    playerSlot.appendChild(compactAudio);

    const sentenceArea = document.createElement("section");
    sentenceArea.id = "te-study-sentence-area";
    sentenceArea.setAttribute("aria-label", tr("dictationSentences"));
    sentenceArea.innerHTML = `
      <div id="te-study-sentence-head">
        <h2 class="te-study-heading" data-study-label="dictationSentences"></h2>
        <span class="te-study-counter" id="te-study-counter" aria-live="polite">0/0</span>
      </div>
      <div class="te-study-loading" id="te-study-loading" role="status" hidden></div>
      <div id="te-study-sentences" role="list"></div>
      <div class="te-study-sentence-footer">
        <button class="te-study-column-toggle" id="te-study-hide-sentences" type="button">${makeSvg('<path d="m14 7-5 5 5 5"/>')}</button>
      </div>`;
    const subtitleBox = left.querySelector(".te-sub-container");
    left.insertBefore(sentenceArea, subtitleBox || null);

    const center = document.createElement("section");
    center.id = "te-study-center";
    center.innerHTML = `
      <div class="te-study-panel-head">
        <h2 class="te-study-heading">${makeSvg('<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h.01M11 10h.01M15 10h.01M8 14h8"/>')}<span data-study-label="dictationTitle"></span></h2>
        <span class="te-dict-acc"><span class="te-dict-acc-label" data-study-label="dictationAccuracy"></span><span class="te-dict-score" id="te-dict-score">---</span></span>
      </div>
      <div class="te-study-center-body">
        <div class="te-study-audio-card">
          <button class="te-study-audio-btn" id="te-study-audio-btn" type="button">${makeSvg('<path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>')}</button>
          <div class="te-study-audio-text">
            <div class="te-study-audio-title"><span data-study-label="dictationAudioTitle"></span><span class="te-study-chip" data-study-label="dictationAudioSource"></span></div>
            <p data-study-label="dictationAudioHelp"></p>
          </div>
          <button class="te-study-media-toggle" id="te-study-media-toggle" type="button" aria-pressed="false"></button>
          <button class="te-dict-hints-toggle te-shadowing-auto-toggle active" id="te-shadowing-auto-toggle" type="button" aria-pressed="true" aria-label="" title="">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sparkles preview-icon" aria-hidden="true"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063L2 12l6.5-2.063A2 2 0 0 0 9.937 8.5L12 2l2.063 6.5A2 2 0 0 0 15.5 9.937L22 12l-6.5 2.063A2 2 0 0 0 14.063 15.5L12 22z"/><path d="M19 22v-4"/><path d="M21 20h-4"/></svg>
          </button>
          <button class="te-dict-hints-toggle te-study-translation-toggle" id="te-study-translation-toggle" type="button" aria-pressed="true" aria-label="" title="">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-languages preview-icon" aria-hidden="true"><path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/></svg>
          </button>
          <button class="te-dict-hints-toggle active" id="te-dict-show-hints" type="button" aria-pressed="true" aria-label="" title="">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-lightbulb preview-icon" aria-hidden="true"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
          </button>
        </div>
        <div class="te-dict-work">
          <div class="te-study-success" id="te-study-success" role="status" hidden><div class="te-shadowing-toast-ring" id="te-shadowing-toast-ring" hidden><svg viewBox="0 0 50 50" aria-hidden="true"><circle class="te-shadowing-toast-ring-bg" cx="25" cy="25" r="21"/><circle class="te-shadowing-toast-ring-fill" id="te-shadowing-toast-ring-fill" cx="25" cy="25" r="21" stroke-dasharray="132" stroke-dashoffset="132"/></svg><span id="te-shadowing-toast-score">0%</span></div>${makeSvg('<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>')}<div class="te-study-success-copy"><span id="te-study-success-message" data-study-label="dictationSuccess"></span><span class="te-shadowing-toast-desc" id="te-shadowing-toast-desc" hidden></span><span class="te-shadowing-feedback-sentence" id="te-shadowing-feedback-sentence" hidden><span data-study-label="dictationCorrectSentence"></span> <strong id="te-shadowing-feedback-sentence-text"></strong></span></div><span class="te-shadowing-feedback-accuracy" id="te-shadowing-feedback-accuracy" hidden><span data-study-label="dictationAccuracy"></span> <strong id="te-shadowing-feedback-accuracy-value"></strong></span></div>
          <div class="te-shadowing-practice" id="te-shadowing-practice" hidden>
            <div class="te-shadowing-target" id="te-shadowing-target"></div>
            <div class="te-study-translation" id="te-study-translation" hidden></div>
            <div class="te-shadowing-shortcuts" id="te-shadowing-shortcuts" data-study-label="dictationSpeechShortcutHint"></div>
            <div class="te-shadowing-result-wrap" id="te-shadowing-result-wrap" hidden>
              <div class="te-shadowing-result-title" data-study-label="dictationSpeakResult"></div>
              <div class="te-shadowing-result" id="te-shadowing-result" role="status" aria-live="polite"></div>
            </div>
            <div class="te-shadowing-controls-spacer" aria-hidden="true"></div>
            <div class="te-shadowing-controls">
              <button class="te-shadowing-mic" id="te-shadowing-mic" type="button" aria-pressed="false">
                ${makeSvg('<path d="M12 19v3"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><rect x="9" y="2" width="6" height="13" rx="3"/>')}
              </button>
              <p class="te-shadowing-help" id="te-shadowing-help" data-study-label="dictationSpeakHelp"></p>
              <p class="te-shadowing-privacy" data-study-label="dictationSpeakPrivacy"></p>
              <div class="te-shadowing-status" id="te-shadowing-status" role="status" aria-live="polite"></div>
            </div>
          </div>
          <div class="te-dict-answer-stack">
            <div class="te-dict-proper-noun-hint" id="te-dict-proper-noun-hint" role="note" aria-live="polite" hidden></div>
            <div class="te-dict-input-wrap">
              <textarea class="te-dict-input" id="te-dict-input" rows="3" autocomplete="off" autocapitalize="off" spellcheck="false"></textarea>
              <div class="te-dict-input-markup" id="te-dict-input-markup" aria-hidden="true" hidden><div class="te-dict-input-markup-content" id="te-dict-input-markup-content"></div></div>
            </div>
            <div class="te-dict-hint" id="te-dict-hint"></div>
            <div class="te-study-translation-slot" id="te-study-translation-slot"></div>
            <div class="te-dict-error" id="te-dict-error" hidden>
              <div class="te-dict-error-title">${makeSvg('<circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/>')}<span data-study-label="dictationErrorTitle"></span></div>
              <div class="te-dict-error-words" id="te-dict-error-words"></div>
            </div>
          </div>
        </div>
      </div>
      <div class="te-study-footer">
        <div class="te-study-repeat">
          <span class="te-study-repeat-label" data-study-label="dictationRepeat"></span>
          ${[0, 1, 2, 3].map((n) => `<button type="button" class="te-study-repeat-btn${n === repeatCount ? " active" : ""}" data-count="${n}">${n}x</button>`).join("")}
        </div>
        <div class="te-study-actions">
          <button type="button" class="te-study-act" id="te-study-btn-prev">${makeSvg('<path d="m15 6-6 6 6 6"/>')}<span data-study-label="dictationPrev"></span></button>
          <button type="button" class="te-study-act" id="te-study-btn-replay">${makeSvg('<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/>')}<span data-study-label="dictationReplay"></span></button>
          <button type="button" class="te-study-act te-dict-act-primary" id="te-dict-check">${makeSvg('<path d="m5 12 5 5 9-10"/>')}<span data-study-label="dictationCheck"></span></button>
          <button type="button" class="te-study-act" id="te-study-btn-slow">${makeSvg('<path d="M12 14l4-4"/><path d="M3.3 16a9 9 0 1 1 17.4 0"/>')}<span data-study-label="dictationSlow"></span></button>
          <button type="button" class="te-study-act" id="te-study-btn-next"><span data-study-label="dictationNext"></span>${makeSvg('<path d="m9 6 6 6-6 6"/>')}</button>
        </div>
      </div>`;

    const notesPanel = document.createElement("section");
    notesPanel.id = "te-study-notes";
    notesPanel.innerHTML = `
      <div class="te-study-panel-head">
        <h2 class="te-study-heading">${makeSvg('<path d="M5 4h14v11l-5 5H5z"/><path d="M14 20v-5h5"/>')}<span data-study-label="dictationLessonNotes"></span></h2>
        <div class="te-study-head-actions">
          <button class="te-study-save" id="te-study-save" type="button"></button>
          <button class="yt-dual-close-btn te-study-close" id="te-study-close" type="button"><span aria-hidden="true">×</span></button>
        </div>
      </div>
      <div class="te-study-note-body">
        <div class="te-study-stats-host">
          <section class="te-study-stats-card" aria-label="${tr("dictationWrongStatsTitle")}">
            <header class="te-study-stats-head">
              <div class="te-study-stats-title-group">
                <span class="te-study-stats-icon" aria-hidden="true">${makeSvg('<path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>')}</span>
                <div class="te-study-stats-title-copy">
                  <h3 data-study-label="dictationWrongStatsTitle"></h3>
                  <p data-study-label="dictationWrongStatsSummary"></p>
                </div>
              </div>
              <span class="te-study-stats-count" id="te-study-stats-count" aria-live="polite"></span>
            </header>
            <div class="te-study-stats-filter-bar" aria-label="${tr("dictationWrongStatsTitle")}">
              <label class="te-study-stats-search">
                ${makeSvg('<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>')}
                <input id="te-study-stats-search" type="search" autocomplete="off">
              </label>
              <button class="te-study-stats-filter active" type="button" data-stats-filter="all" aria-pressed="true"><span data-study-label="dictationWrongStatsAll"></span></button>
              <button class="te-study-stats-filter" type="button" data-stats-filter="needs-fix" aria-pressed="false"><span data-study-label="dictationWrongStatsNeedsFix"></span></button>
            </div>
            <div class="te-study-stats-scroll" tabindex="0" aria-label="${tr("dictationWrongStatsTitle")}">
            </div>
          </section>
        </div>
        <div class="te-study-note-text-wrap">
          <label class="te-study-note-label" for="te-study-note" data-study-label="dictationGrammarNotes"></label>
          <textarea class="te-study-note-input" id="te-study-note"></textarea>
        </div>
        <div class="te-study-lock" id="te-study-lock" role="status">
          <span class="te-study-lock-icon" aria-hidden="true">${makeSvg('<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><path d="M12 14v3"/>')}</span>
          <strong data-study-label="dictationNotesLocked"></strong>
          <span data-study-label="dictationNotesLockHelp"></span>
        </div>
      </div>
      <div class="te-study-note-footer">
        <button class="te-study-column-toggle" id="te-study-hide-notes" type="button">${makeSvg('<path d="m10 7 5 5-5 5"/>')}</button>
        <span class="te-study-saved" id="te-study-saved" aria-live="polite"></span>
      </div>`;

    const leftColumnSplitter = document.createElement("div");
    leftColumnSplitter.className = "te-study-column-splitter te-study-splitter-left";
    leftColumnSplitter.setAttribute("role", "separator");
    leftColumnSplitter.setAttribute("aria-orientation", "vertical");
    leftColumnSplitter.setAttribute("aria-label", tr("dictationResizeSentencesColumn"));
    leftColumnSplitter.title = tr("dictationResizeColumnHelp");
    leftColumnSplitter.setAttribute("aria-description", tr("dictationResizeColumnHelp"));
    leftColumnSplitter.setAttribute("aria-controls", "te-study-sentence-area");
    leftColumnSplitter.tabIndex = 0;
    const rightColumnSplitter = document.createElement("div");
    rightColumnSplitter.className = "te-study-column-splitter te-study-splitter-right";
    rightColumnSplitter.setAttribute("role", "separator");
    rightColumnSplitter.setAttribute("aria-orientation", "vertical");
    rightColumnSplitter.setAttribute("aria-label", tr("dictationResizeNotesColumn"));
    rightColumnSplitter.title = tr("dictationResizeColumnHelp");
    rightColumnSplitter.setAttribute("aria-description", tr("dictationResizeColumnHelp"));
    rightColumnSplitter.setAttribute("aria-controls", "te-study-notes");
    rightColumnSplitter.tabIndex = 0;

    const showLeftColumn = document.createElement("button");
    showLeftColumn.className = "te-study-column-restore te-study-restore-left";
    showLeftColumn.type = "button";
    showLeftColumn.innerHTML = makeSvg('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 4v16m5-11 3 3-3 3"/>');
    const showRightColumn = document.createElement("button");
    showRightColumn.className = "te-study-column-restore te-study-restore-right";
    showRightColumn.type = "button";
    showRightColumn.innerHTML = makeSvg('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M16 4v16m-5-11-3 3 3 3"/>');
    const playerMask = document.createElement("div");
    playerMask.className = "te-study-player-mask";
    playerMask.setAttribute("aria-hidden", "true");

    root.append(center, notesPanel, leftColumnSplitter, rightColumnSplitter, showLeftColumn, showRightColumn, playerMask);

    const tools = document.createElement("div");
    tools.className = "te-study-toolbar-tools";
    tools.innerHTML = `
      <div class="te-study-mode-switch" role="group" aria-label="${tr("dictationModeGroup")}">
        <button class="te-study-mode-control" id="te-study-speak-control" type="button" aria-pressed="false">
          ${makeSvg('<path d="M12 19v3"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><rect x="9" y="2" width="6" height="13" rx="3"/>')}
          <span data-study-label="dictationSpeak"></span>
        </button>
        <button class="te-study-mode-control active" id="te-study-type-control" type="button" aria-pressed="true">
          ${makeSvg('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h10M7 12h10M7 16h6"/>')}
          <span data-study-label="dictationType"></span>
        </button>
        <button class="te-study-sync-control te-active" id="te-study-sync-progress" type="button" aria-pressed="true" aria-label="${tr("dictationProgressSyncOn")}" title="${tr("dictationProgressSyncOn")}">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-refresh-cw" aria-hidden="true"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
        </button>
      </div>
      <span class="te-dict-toolbar-accuracy">
        <svg class="te-dict-ring" viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><circle class="te-dict-ring-bg" cx="12" cy="12" r="9"/><circle class="te-dict-ring-fg" id="te-dict-ring-fg" cx="12" cy="12" r="9" transform="rotate(-90 12 12)"/></svg>
        <span class="te-dict-acc-col"><span data-study-label="dictationAccuracy"></span><strong id="te-dict-toolbar-score">0%</strong></span>
      </span>`;
    primaryGroup.prepend(tools);
    primaryGroup.classList.add("te-study-primary-group");

    return {
      root, left, playerSlot, compactAudio, brand, bar, barParent: bar.parentNode, barNextSibling: bar.nextSibling,
      mediaCompactToggle: center.querySelector("#te-study-media-toggle"),
      translationToggle: center.querySelector("#te-study-translation-toggle"),
      miniThumb: compactAudio.querySelector(".te-study-mini-thumb"),
      miniTitle: compactAudio.querySelector(".te-study-mini-title"),
      miniSource: compactAudio.querySelector(".te-study-mini-source"),
      miniPlay: compactAudio.querySelector(".te-study-mini-play"),
      miniPlayIcon: compactAudio.querySelector(".te-study-mini-play-icon"),
      playerExpandedHeight: 0, playerExpandedHeightSaved: false, playerTransitionToken: 0, playerResizeObserver: null,
      columnLayoutResizeObserver: null,
      originalLeftAriaHidden: left.getAttribute("aria-hidden"),
      originalPlayerSlotHeight: { value: playerSlot.style.getPropertyValue("height"), priority: playerSlot.style.getPropertyPriority("height") },
      primaryGroup, tools, sentenceArea, center, notesPanel,
      leftColumnSplitter, rightColumnSplitter, showLeftColumn, showRightColumn, playerMask,
      hideLeftColumn: sentenceArea.querySelector("#te-study-hide-sentences"),
      hideRightColumn: notesPanel.querySelector("#te-study-hide-notes"),
      sentences: sentenceArea.querySelector("#te-study-sentences"),
      loadingStatus: sentenceArea.querySelector("#te-study-loading"),
      counter: sentenceArea.querySelector("#te-study-counter"),
      input: center.querySelector("#te-dict-input"),
      properNounHint: center.querySelector("#te-dict-proper-noun-hint"),
      inputMarkup: center.querySelector("#te-dict-input-markup"),
      inputMarkupContent: center.querySelector("#te-dict-input-markup-content"),
      work: center.querySelector(".te-dict-work"),
      score: center.querySelector("#te-dict-score"),
      hint: center.querySelector("#te-dict-hint"),
      error: center.querySelector("#te-dict-error"),
      errorTitleText: center.querySelector(".te-dict-error-title span"),
      errorTitleIcon: center.querySelector(".te-dict-error-title svg"),
      errorWords: center.querySelector("#te-dict-error-words"),
      success: center.querySelector("#te-study-success"),
      successIcon: center.querySelector("#te-study-success > svg"),
      speechToastRing: center.querySelector("#te-shadowing-toast-ring"),
      speechToastRingFill: center.querySelector("#te-shadowing-toast-ring-fill"),
      speechToastScore: center.querySelector("#te-shadowing-toast-score"),
      speechToastDescription: center.querySelector("#te-shadowing-toast-desc"),
      successMessage: center.querySelector("#te-study-success-message"),
      speechFeedbackSentence: center.querySelector("#te-shadowing-feedback-sentence"),
      speechFeedbackSentenceText: center.querySelector("#te-shadowing-feedback-sentence-text"),
      speechFeedbackAccuracy: center.querySelector("#te-shadowing-feedback-accuracy"),
      speechFeedbackAccuracyValue: center.querySelector("#te-shadowing-feedback-accuracy-value"),
      translation: center.querySelector("#te-study-translation"),
      translationSlot: center.querySelector("#te-study-translation-slot"),
      check: center.querySelector("#te-dict-check"),
      audioBtn: center.querySelector("#te-study-audio-btn"),
      showHints: center.querySelector("#te-dict-show-hints"),
      repeatBtns: [...center.querySelectorAll(".te-study-repeat-btn")],
      btnPrev: center.querySelector("#te-study-btn-prev"),
      btnReplay: center.querySelector("#te-study-btn-replay"),
      btnSlow: center.querySelector("#te-study-btn-slow"),
      btnNext: center.querySelector("#te-study-btn-next"),
      modeSwitch: tools.querySelector(".te-study-mode-switch"),
      speakControl: tools.querySelector("#te-study-speak-control"),
      typeControl: tools.querySelector("#te-study-type-control"),
      syncProgressControl: tools.querySelector("#te-study-sync-progress"),
      speechPractice: center.querySelector("#te-shadowing-practice"),
      speechTarget: center.querySelector("#te-shadowing-target"),
      speechResultWrap: center.querySelector("#te-shadowing-result-wrap"),
      speechResult: center.querySelector("#te-shadowing-result"),
      speechAutoToggle: center.querySelector("#te-shadowing-auto-toggle"),
      speechMic: center.querySelector("#te-shadowing-mic"),
      speechHelp: center.querySelector("#te-shadowing-help"),
      speechShortcuts: center.querySelector("#te-shadowing-shortcuts"),
      speechStatus: center.querySelector("#te-shadowing-status"),
      heading: center.querySelector(".te-study-panel-head .te-study-heading span"),
      toolbarScore: tools.querySelector("#te-dict-toolbar-score"),
      ring: tools.querySelector("#te-dict-ring-fg"),
      close: notesPanel.querySelector("#te-study-close"),
      statsSearch: notesPanel.querySelector("#te-study-stats-search"),
      statsSummary: notesPanel.querySelector(".te-study-stats-title-copy > p"),
      statsCount: notesPanel.querySelector("#te-study-stats-count"),
      statsScroll: notesPanel.querySelector(".te-study-stats-scroll"),
      statsFilters: [...notesPanel.querySelectorAll(".te-study-stats-filter")],
      note: notesPanel.querySelector("#te-study-note"),
      lock: notesPanel.querySelector("#te-study-lock"),
      save: notesPanel.querySelector("#te-study-save"),
      saved: notesPanel.querySelector("#te-study-saved"),
      previous: bar.querySelector("#te-control-previous"),
      next: bar.querySelector("#te-control-next"),
      replay: bar.querySelector("#te-control-repeat"),
      playPause: bar.querySelector("#te-control-play"),
      originalButtonState: new Map(),
    };
  }

globalThis.LHN_OVERLAY_TEMPLATE = Object.freeze({ createStudyUi });
