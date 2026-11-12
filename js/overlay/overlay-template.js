// Overlay cũ: markup OVERLAY_HTML vẫn dựng nhưng ẩn (engine còn đọc/ghi vào đó, bỏ ở bước 5 tái cấu trúc) + 2 quy tắc CSS chung.
const OVERLAY_CSS = `
    /* Chỉ còn quy tắc chung cho shadow root. Giao diện overlay đang dùng: js/overlay/unified/unified-css.js.
       Phần tử ngoài .ov (markup cũ đang ẩn) giữ reset + phông; :host phủ toàn màn hình. */
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
          <svg width="14" height="14" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true">
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
          <button class="te-icon-btn te-touch-fav" id="te-control-fav" type="button" aria-pressed="false"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.5 5.5 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5Z"/></svg></button>
          <button class="te-icon-btn" id="te-notes-sidebar-toggle" title="Mở thanh bên ghi chú" aria-label="Mở thanh bên ghi chú"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 6h4M2 10h4M2 14h4M2 18h4"/><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9.5 8h5M9.5 12H16M9.5 16H14"/></svg></button>
        </div>

        <div class="te-ctrl-group te-control-transport-left">
          <button class="te-icon-btn" id="te-control-audio" title="Audio"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-volume-2 preview-icon" aria-hidden="true"><path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/><path d="M16 9a5 5 0 0 1 0 6"/><path d="M19.364 18.364a9 9 0 0 0 0-12.728"/></svg></button>
          <button class="te-icon-btn" id="te-control-repeat" title="Lặp lại câu"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/><path d="M11 10h1v4"/></svg></button>
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
              <div class="te-psheet-grip" aria-hidden="true"></div>
              <div class="te-psheet-head"><span class="te-psheet-title" id="te-subtitle-mode-title">Chế độ phụ đề</span><button class="te-psheet-x" type="button" data-psheet-close="sub" aria-label="Đóng"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button></div>
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
            <div class="te-psheet-scrim" data-psheet-close="sub" aria-hidden="true"></div>
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
      <div class="te-psheet-grip" aria-hidden="true"></div>
      <div class="te-speed-head te-psheet-head">
        <span class="te-speed-title te-psheet-title">Tốc độ</span>
        <span id="te-speed-value">1.00x</span>
        <button class="te-psheet-x" type="button" data-psheet-close="speed" aria-label="Đóng"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
      </div>
      <div class="te-speed-row">
        <button id="te-speed-dec" class="te-speed-step" type="button">-</button>
        <div class="te-speed-slider-wrap"><input type="range" id="te-speed-slider" min="0.5" max="3" step="0.05" value="1"></div>
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
    <div class="te-psheet-scrim" data-psheet-close="speed" aria-hidden="true"></div>

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
              <span class="te-color-pill" style="background: #ffff00;"></span>
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
