// Shared overlay controller and content-script entry. Load after the Overlay modules.
// ===== Video song ngữ và Web-study – content script (chuyển từ extension tham chiếu v1.12) =====
// Nạp trước: overlay-template.js (OVERLAY_CSS/OVERLAY_HTML). Giao diện giữ nguyên 100%.
// Các "đường nối" đã đổi sang module Keepit: LHN_MESSAGING (fetch bridge), browser.storage (cài đặt),
// LHN_DEFAULTS.youtube (giá trị mặc định).

const LAUNCHER_ID = 'yt-keepit-launcher';
const HOST_ID = 'keepit-host';
const OVERLAY_ID = 'keepit-exact-overlay';
const SETTINGS_KEY = 'lhnYouTubeSettings';
const STUDY_TRANSLATION_SETTINGS_KEY = 'lhnStudyTranslationSettings';
const BATCH_SIZE = 15;
const PENDING = 'Đang dịch...';
const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const PRESET_VALUES = [80, 100, 130]; // Nhỏ, Trung bình, Lớn
const FONT_STACKS = {
  Inter: 'Inter, sans-serif',
  Roboto: 'Roboto, "Segoe UI", Arial, sans-serif',
  Arial: 'Arial, Helvetica, sans-serif',
  Verdana: 'Verdana, Geneva, sans-serif',
  Tahoma: 'Tahoma, sans-serif',
  'Trebuchet MS': '"Trebuchet MS", sans-serif',
  Georgia: 'Georgia, serif',
  'Times New Roman': '"Times New Roman", Times, serif',
  'Courier New': '"Courier New", Courier, monospace',
};
const PLAY_PATH = '<path d="M8 5v14l11-7z"/>';
const PAUSE_PATH = '<path d="M6 5h4v14H6zM14 5h4v14h-4z"/>';
const state = {
  open: false,
  videoId: null,
  videoEl: null,
  videoGeometryHandler: null,
  origParent: null,
  origNext: null,
  rawCues: [],
  allCues: [],       // toàn bộ cue đã tải + làm sạch; rawCues chỉ là cửa sổ đang hiển thị
  captions: [],
  activeIdx: -1,
  transcriptFocusRatio: 0.4,
  transcriptManualScrollUntil: 0,
  transcriptManualScrollAt: 0,
  transcriptProgrammaticScrollAt: 0,
  transcriptPointerScrolling: false,
  viCache: new Map(),
  sourceLanguageSetting: 'auto',
  targetLanguageSetting: 'auto',
  targetLanguage: globalThis.LHN_LANGUAGES?.detectLanguage?.() || 'en',
  displayLanguage: globalThis.LHN_LANGUAGES?.detectLanguage?.() || 'en',
  primaryNeedsTranslation: false,
  secondaryNeedsTranslation: false,
  captionTrackLanguage: '',
  mainLanguage: 'en',
  loadToken: 0,
  loadingFor: null,
  loop: false,
  pauseReasons: new Set(),
  hoverPauseReasons: new Set(),
  hoverPauseSuppressionActive: false,
  hoverPauseSuppressionRevision: null,
  hoverPointer: null,
  hoverPointerRevision: 0,
  hoverPauseModeChangeRevision: null,
  hoverPauseSyncFrame: null,
  managedPauseVideo: null,
  popupObserver: null,
  webStudy: false,
  webLanguageHint: '',
  webDetectedLanguage: '',
  webCueLanguageKnown: false,
  webLanguageReady: Promise.resolve(''),
  webPageUrl: '',
  webThumbnail: null,
};

let savedOverlayPageScrollStyles = null;

let shadow = null; // ShadowRoot chứa toàn bộ giao diện keepit
const $ = (id) => (shadow ? shadow.getElementById(id) : null);
const overlayEl = () => $(OVERLAY_ID);
const uiCache = new Map();
const ui = (sel) => {
  const cached = uiCache.get(sel);
  if (cached && cached.isConnected) return cached;
  const el = overlayEl()?.querySelector(sel) || null;
  if (el) uiCache.set(sel, el); else uiCache.delete(sel);
  return el;
};
const uiAll = (sel) => (overlayEl() ? [...overlayEl().querySelectorAll(sel)] : []);
const VIDEO_UI_TEXT_KEYS = Object.freeze({
  'Thêm vào từ vựng': 'videoAddVocabulary', 'Mở thanh bên ghi chú': 'videoOpenNotesSidebar',
  'Audio': 'videoAudio', 'Lặp lại câu': 'videoRepeatSentence', 'Câu trước': 'videoPreviousSentence',
  'Phát/Tạm dừng': 'videoPlayPause', 'Câu tiếp theo': 'videoNextSentence', 'Tốc độ': 'videoSpeed',
  'Luyện nói': 'videoPracticeSpeaking', 'Chép chính tả': 'videoDictation', 'Chế độ phụ đề': 'videoSubtitleMode',
  'Song ngữ': 'videoSubtitleBilingual', 'Chính': 'videoSubtitlePrimary', 'Dịch': 'videoSubtitleTranslation', 'Ẩn': 'videoSubtitleHidden',
  'Chế độ xem': 'videoModeSelector', 'Chế độ rạp': 'videoModeTheater', 'Chế độ đọc': 'videoModeReading', 'Chế độ thường': 'videoModeCombined',
  'Toàn màn hình': 'videoFullscreen', 'Cài đặt video': 'videoSettings', 'Đóng': 'close', 'Mở cài đặt': 'videoOpenSettings',
  'Kích thước xem': 'videoViewSize', 'Kích cỡ xem': 'videoViewSize', 'Nhấn để dịch': 'videoTranslationPopup', 'Phát âm khi dịch': 'videoClickToSpeak',
  'Kết hợp câu': 'videoCombineSentences', 'Ẩn thanh điều khiển': 'videoHideControls', 'Ambient mode': 'videoAmbientMode',
  'Ambient 1': 'videoAmbient1', 'Ambient 2': 'videoAmbient2', 'Ambient 3': 'videoAmbient3', 'Tắt': 'videoAmbientOff',
  'Chủ đề': 'videoTheme', 'Light': 'lightMode', 'Dark': 'darkMode', 'Tùy chọn phụ đề': 'videoSubtitleOptions',
  'Ngôn ngữ phụ đề': 'videoSubtitleLanguage', 'Xuất phụ đề': 'videoExportSubtitles', 'Đặt lại': 'videoReset', 'Cài đặt chung': 'videoGeneralSettings',
  'Nhỏ': 'videoSmall', 'Vừa': 'videoMedium', 'Trung bình': 'videoMedium', 'Lớn': 'videoLarge', 'Đậm': 'videoBold', 'Phụ đề video': 'videoVideoSubtitles',
  'Kích thước phụ đề chính': 'videoPrimarySubtitleSize', 'Màu phụ đề chính': 'videoPrimarySubtitleColor',
  'Kích thước phụ đề dịch': 'videoTranslatedSubtitleSize', 'Màu phụ đề dịch': 'videoTranslatedSubtitleColor',
  'Chế độ rạp · Lớn': 'videoTheaterLargeSubtitle', 'Màu nền phụ đề': 'videoSubtitleBackgroundColor',
  'Độ trong suốt': 'videoSubtitleBackgroundOpacity', 'Move subtitle': 'videoMoveSubtitle',
  'Phụ đề thanh bên': 'videoSidebarSubtitles', 'Kích thước chính': 'videoPrimarySize', 'Kích thước dịch': 'videoTranslatedSize',
  'Phụ đề chính': 'videoMainSubtitle', 'Phụ đề dịch': 'videoTranslationSubtitle', 'Xuất từ đã lưu': 'videoExportSavedWords',
  'Hiển thị từ đánh dấu': 'videoShowHighlightedWords', 'Chỉ xuất phụ đề': 'videoExportSubtitlesOnly', 'Hiển thị thời gian': 'videoIncludeTimestamps',
});
const VIDEO_UI_CONTROL_IDS = Object.freeze({
  Audio: 'te-control-audio', 'Lặp lại câu': 'te-control-repeat', 'Câu trước': 'te-control-previous',
  'Phát/Tạm dừng': 'te-control-play', 'Câu tiếp theo': 'te-control-next', 'Tốc độ': 'te-control-speed',
  'Luyện nói': 'te-speaking-mode-btn', 'Chép chính tả': 'te-dictation-mode-btn', 'Toàn màn hình': 'te-control-fullscreen',
});
const localizedVideoText = new WeakMap();
const localizedVideoAttributes = new WeakMap();
const videoT = (key, vars = {}) => globalThis.LHN_LANGUAGES?.t?.(key, vars, state.displayLanguage) || key;
const ctrl = (title) => {
  const id = VIDEO_UI_CONTROL_IDS[title];
  return id ? ui(`#${id}`) : null;
};

function refreshVideoUiLocalization() {
  const launcher = document.getElementById(LAUNCHER_ID);
  launcher?.setAttribute('title', videoT('videoOpenKeepit'));
  launcher?.setAttribute('aria-label', videoT('videoOpenKeepit'));
  globalThis.LHN_DICTATION?.refreshLanguage?.();
  const root = overlayEl();
  if (!root) return false;
  const subtitleDragHandle = ui('#te-theater-subtitle-drag-handle');
  if (subtitleDragHandle) {
    subtitleDragHandle.title = videoT('videoMoveSubtitle');
    subtitleDragHandle.setAttribute('aria-label', videoT('videoMoveSubtitle'));
  }
  const excludedUiContent = '.te-video-title-text, .te-sub-container, #te-transcript-list, #te-dictation-center, #te-dictation-notes, #te-dict-sentence-area, .te-dict-toolbar-tools';
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (node.parentElement?.closest(excludedUiContent)) continue;
    const source = localizedVideoText.has(node) ? localizedVideoText.get(node) : node.nodeValue;
    const key = VIDEO_UI_TEXT_KEYS[source.trim()];
    if (!key) continue;
    if (!localizedVideoText.has(node)) localizedVideoText.set(node, source);
    const leading = source.match(/^\s*/)?.[0] || '';
    const trailing = source.match(/\s*$/)?.[0] || '';
    node.nodeValue = `${leading}${videoT(key)}${trailing}`;
  }
  for (const element of root.querySelectorAll('[title], [aria-label]')) {
    if (element.closest(excludedUiContent)) continue;
    let saved = localizedVideoAttributes.get(element);
    if (!saved) { saved = new Map(); localizedVideoAttributes.set(element, saved); }
    for (const name of ['title', 'aria-label']) {
      if (!element.hasAttribute(name)) continue;
      const source = saved.has(name) ? saved.get(name) : element.getAttribute(name);
      const key = VIDEO_UI_TEXT_KEYS[source];
      if (!key) continue;
      if (!saved.has(name)) saved.set(name, source);
      element.setAttribute(name, videoT(key));
    }
  }
  applySettings();
  updateSubtitleDisplayModeLabels();
  setVideoDisplayModeSelection($('te-video-mode-trigger')?.dataset.videoMode || 'combined');
  syncReadingAudioControls();
  const sizeKeys = ['videoSmall', 'videoMedium', 'videoLarge'];
  uiAll('#te-view-mode-options button').forEach((button, index) => {
    button.textContent = videoT(sizeKeys[index] || 'videoMedium');
    button.dataset.size = ['S', 'M', 'L'][index] || 'M';
  });
  const exportRows = uiAll('#te-modal-export .te-card-box .te-setting-item');
  if (exportRows[3]?.firstElementChild) exportRows[3].firstElementChild.textContent = videoT('videoIncludeSubtitles');
  const speedNormal = ui('.te-speed-normal');
  if (speedNormal) speedNormal.textContent = videoT('videoNormal');
  if (activeVideoStatusKey) setStatus(videoT(activeVideoStatusKey, activeVideoStatusVars), activeVideoStatusKey, activeVideoStatusVars);
  return true;
}

function pauseVideoFor(reason) {
  state.pauseReasons.add(reason);
  const video = state.videoEl || state.managedPauseVideo;
  if (video && !video.paused) {
    state.managedPauseVideo = video;
    video.pause();
  }
}

function resumeVideoFor(reason) {
  state.pauseReasons.delete(reason);
  if (state.pauseReasons.size) return;
  const video = state.managedPauseVideo;
  state.managedPauseVideo = null;
  if (video?.paused) video.play().catch(() => {});
}

const HOVER_PAUSE_ZONES = [
  { reason: 'subtitle-main-hover', selector: '.te-sub-en' },
  { reason: 'subtitle-sidebar-hover', selector: '.yt-dual-item' },
];

function activateHoverPause(reason) {
  if (state.hoverPauseSuppressionActive || state.hoverPauseReasons.has(reason)) return;
  if (state.hoverPauseModeChangeRevision === state.hoverPointerRevision) {
    beginHoverPauseSuppression();
    return;
  }
  state.hoverPauseReasons.add(reason);
  pauseVideoFor(reason);
}

function beginHoverPauseSuppression({ requirePauseZone = false } = {}) {
  if (requirePauseZone && !getHoverPauseReasonsAtPointer().size) return false;
  state.hoverPauseSuppressionActive = true;
  state.hoverPauseSuppressionRevision = state.hoverPointerRevision;
  for (const reason of [...state.hoverPauseReasons]) releaseHoverPause(reason);
  return true;
}

function releaseHoverPause(reason) {
  if (!state.hoverPauseReasons.delete(reason)) return;
  resumeVideoFor(reason);
}

function rememberHoverPointer(event) {
  if (!Number.isFinite(event?.clientX) || !Number.isFinite(event?.clientY)) return false;
  const moved = !state.hoverPointer
    || state.hoverPointer.x !== event.clientX
    || state.hoverPointer.y !== event.clientY;
  state.hoverPointer = { x: event.clientX, y: event.clientY };
  if (moved) {
    state.hoverPointerRevision += 1;
    state.hoverPauseModeChangeRevision = false;
    syncHoverPauseAtPointer();
  }
  return moved;
}

function getHoverPauseReasonsAtPointer() {
  const pointer = state.hoverPointer;
  if (!state.open || !pointer || typeof shadow?.elementFromPoint !== 'function') return new Set();
  const target = shadow.elementFromPoint(pointer.x, pointer.y);
  if (!target || typeof target.closest !== 'function') return new Set();
  return new Set(HOVER_PAUSE_ZONES
    .filter(({ selector }) => target.closest(selector))
    .map(({ reason }) => reason));
}

function syncHoverPauseAtPointer(suppressCurrent = false) {
  const nextReasons = getHoverPauseReasonsAtPointer();
  if (suppressCurrent) {
    if (state.hoverPauseSuppressionActive || state.hoverPauseReasons.size || nextReasons.size) {
      beginHoverPauseSuppression();
    }
    return;
  }

  if (state.hoverPauseSuppressionActive) {
    if (state.hoverPointerRevision !== state.hoverPauseSuppressionRevision) {
      if (nextReasons.size) state.hoverPauseSuppressionRevision = state.hoverPointerRevision;
      else {
        state.hoverPauseSuppressionActive = false;
        state.hoverPauseSuppressionRevision = null;
      }
    }
    if (state.hoverPauseSuppressionActive) {
      for (const reason of [...state.hoverPauseReasons]) releaseHoverPause(reason);
      return;
    }
  }

  // Activate the next zone first so crossing between pause zones never resumes the video briefly.
  for (const reason of nextReasons) activateHoverPause(reason);
  for (const reason of [...state.hoverPauseReasons]) {
    if (!nextReasons.has(reason)) releaseHoverPause(reason);
  }
}

function suppressHoverPauseForModeChange() {
  state.hoverPauseModeChangeRevision = state.hoverPointerRevision;
  const isOverPauseZone = state.hoverPauseSuppressionActive
    || state.hoverPauseReasons.size > 0
    || getHoverPauseReasonsAtPointer().size > 0;
  if (isOverPauseZone) beginHoverPauseSuppression();
}

function scheduleHoverPauseSync({ modeChange = false } = {}) {
  if (!state.open) return;
  if (modeChange) state.hoverPauseModeChangeRevision = state.hoverPointerRevision;
  if (state.hoverPauseSyncFrame !== null) return;
  state.hoverPauseSyncFrame = requestAnimationFrame(() => {
    state.hoverPauseSyncFrame = null;
    const suppressCurrent = typeof state.hoverPauseModeChangeRevision === 'number'
      && state.hoverPauseModeChangeRevision === state.hoverPointerRevision;
    state.hoverPauseModeChangeRevision = null;
    syncHoverPauseAtPointer(suppressCurrent);
  });
}

function clearHoverPauseState() {
  if (state.hoverPauseSyncFrame !== null) {
    cancelAnimationFrame(state.hoverPauseSyncFrame);
    state.hoverPauseSyncFrame = null;
  }
  state.hoverPointer = null;
  state.hoverPointerRevision = 0;
  state.hoverPauseModeChangeRevision = null;
  state.hoverPauseSuppressionActive = false;
  state.hoverPauseSuppressionRevision = null;
  for (const { reason } of HOVER_PAUSE_ZONES) {
    state.hoverPauseReasons.delete(reason);
    resumeVideoFor(reason);
  }
}

function enforceVideoPause(video) {
  if (!state.pauseReasons.size || video.paused) return;
  state.managedPauseVideo = video;
  video.pause();
}

const APP_POPUP_SELECTOR = '#lhn-full-english-dictionary, #lhn-direct-translation, #lhn-panel, #lhn-note-pop';

function hasVisibleAppPopup() {
  return [...document.querySelectorAll(APP_POPUP_SELECTOR)].some((popup) => {
    const style = getComputedStyle(popup);
    return style.display !== 'none' && style.visibility !== 'hidden' && popup.getBoundingClientRect().width > 0;
  });
}

function syncAppPopupPause() {
  if (hasVisibleAppPopup()) pauseVideoFor('app-popup');
  else {
    resumeVideoFor('app-popup');
    if (!state.open && state.popupObserver) {
      state.popupObserver.disconnect();
      state.popupObserver = null;
    }
  }
}

function startAppPopupObserver() {
  if (!state.popupObserver) {
    const isPopupNode = (node) => node?.nodeType === Node.ELEMENT_NODE &&
      (node.matches(APP_POPUP_SELECTOR) || node.querySelector(APP_POPUP_SELECTOR));
    state.popupObserver = new MutationObserver((records) => {
      const relevant = records.some((record) => record.type === 'attributes'
        ? record.target.matches?.(APP_POPUP_SELECTOR)
        : [...record.addedNodes, ...record.removedNodes].some(isPopupNode));
      if (relevant) syncAppPopupPause();
    });
    state.popupObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style'],
    });
  }
  syncAppPopupPause();
}

function renderHoverWords(text) {
  return String(text ?? '').split(/(\s+)/u).map((part) => /^\s+$/u.test(part)
    ? part
    : `<span class="yt-dual-word">${escapeHtml(part)}</span>`).join('');
}

// ---------- Lấy phụ đề (đã kiểm chứng ở v1.4) ----------
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function buildOverlay() {
  const host = document.createElement('div');
  host.id = HOST_ID;
  host.style.display = 'none';
  const sharedScrollbarWidth = getComputedStyle(document.documentElement).getPropertyValue('--lhn-scrollbar-width').trim() || '3px';
  host.style.setProperty('--lhn-scrollbar-width', sharedScrollbarWidth);
  document.body.appendChild(host);
  shadow = host.attachShadow({ mode: 'open' });
  shadow.innerHTML = `<style>${OVERLAY_CSS}</style>${OVERLAY_HTML}`;
  const brandIcon = ui('.te-dict-brand img');
  const runtime = globalThis.browser || globalThis.chrome;
  if (brandIcon && runtime?.runtime?.getURL) brandIcon.src = runtime.runtime.getURL('assets/icons/icon.svg');
  overlayEl().classList.add('te-hidden');
  window.addEventListener('resize', () => {
    syncTheaterFrame();
    if (state.open) alignActiveTranscriptFocus('auto');
  });
  bindUI();
  observeTheaterSubtitleLayout();
  refreshVideoUiLocalization();
  $('te-modal-main').classList.add('hidden');

  // Thêm các font như v1.4 (giữ nguyên các font có sẵn)
  const subSel = $('te-modal-sub').querySelector('select');
  Object.keys(FONT_STACKS).forEach((name) => {
    if (![...subSel.options].some((o) => o.value === name)) subSel.add(new Option(name, name));
  });

  // Nhóm "Chế độ xem" -> kích thước video; nhãn theo ngôn ngữ giao diện hiện tại.
  const sizeBtns = $('te-view-mode-options').querySelectorAll('button');
  ['videoSmall', 'videoMedium', 'videoLarge'].forEach((key, i) => {
    sizeBtns[i].textContent = videoT(key);
    sizeBtns[i].dataset.size = ['S', 'M', 'L'][i];
  });

  const dictationApi = createDictationOverlayApi();
  document.dispatchEvent(new CustomEvent('lhn-overlay-ready', { detail: dictationApi }));
}

let launcherMutationObserver = null;
let launcherRefreshQueued = false;

function ensureLauncher() {
  let btn = document.getElementById(LAUNCHER_ID);
  if (!btn) {
    btn = document.createElement('button');
    btn.id = LAUNCHER_ID;
    btn.type = 'button';
    btn.className = 'ytp-button lhn-player-launcher';
    btn.title = videoT('videoOpenKeepit');
    btn.setAttribute('aria-label', videoT('videoOpenKeepit'));
    btn.style.display = 'none';
    btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="lhn-launcher-mark" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#4f46e5"/><stop offset="1" stop-color="#8b5cf6"/></linearGradient><filter id="lhn-launcher-shadow" x="-25%" y="-15%" width="150%" height="155%" color-interpolation-filters="sRGB"><feGaussianBlur in="SourceAlpha" stdDeviation="1.5"/><feOffset dy="2"/><feComponentTransfer><feFuncA type="linear" slope="0.2"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><rect x="0" y="0" width="32" height="32" fill="url(#lhn-launcher-mark)" filter="url(#lhn-launcher-shadow)" rx="8"/><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="4" height="20" width="20" x="5" y="5"><path d="m9 11-6 6v3h9l3-3"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/></svg></svg>';
    btn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      openOverlay();
    });
  }

  const player = document.querySelector('#movie_player');
  const controls = player?.querySelector('.ytp-right-controls, #ytp-right-controls');
  if (controls) {
    const fullscreen = controls.querySelector('.ytp-fullscreen-button, #ytp-fullscreen-button');
    if (fullscreen && fullscreen.nextElementSibling !== btn) fullscreen.insertAdjacentElement('afterend', btn);
    else if (!controls.contains(btn)) controls.appendChild(btn);
  } else if (btn.parentElement !== document.body) {
    // Wait outside the player until YouTube has built its native control group.
    document.body.appendChild(btn);
  }
  return btn;
}

function launcherIsInPlayerControls(btn) {
  const controls = document.querySelector('#movie_player .ytp-right-controls, #movie_player #ytp-right-controls');
  return Boolean(controls && btn && controls.contains(btn));
}

function scheduleLauncherRefresh() {
  if (launcherRefreshQueued) return;
  launcherRefreshQueued = true;
  requestAnimationFrame(() => {
    launcherRefreshQueued = false;
    const launcher = ensureLauncher();
    const attachedToControls = launcherIsInPlayerControls(launcher);
    const shouldShow = !keepitSiteDisabled && location.pathname === '/watch' && attachedToControls;
    if (launcher) launcher.style.display = shouldShow ? '' : 'none';
  });
}

function observeLauncherChanges() {
  if (launcherMutationObserver || !document.body) return;
  const isInsidePlayer = (node) => node?.nodeType === Node.ELEMENT_NODE
    && (node.id === 'movie_player' || Boolean(node.closest?.('#movie_player')));
  const containsPlayer = (node) => node?.nodeType === Node.ELEMENT_NODE
    && (node.id === 'movie_player' || Boolean(node.querySelector?.('#movie_player')));
  launcherMutationObserver = new MutationObserver((records) => {
    const relevant = records.some((record) => isInsidePlayer(record.target)
      || [...record.addedNodes, ...record.removedNodes].some(containsPlayer));
    if (relevant) scheduleLauncherRefresh();
  });
  launcherMutationObserver.observe(document.body, { childList: true, subtree: true });
  window.addEventListener('resize', scheduleLauncherRefresh, { passive: true });
  document.addEventListener('fullscreenchange', scheduleLauncherRefresh);
}

function hideOverlayPageScrollbar() {
  if (savedOverlayPageScrollStyles) return;
  const html = document.documentElement;
  const body = document.body;
  const snapshot = (element) => element ? {
    value: element.style.getPropertyValue('overflow-y'),
    priority: element.style.getPropertyPriority('overflow-y'),
  } : null;
  savedOverlayPageScrollStyles = { html, body, htmlStyle: snapshot(html), bodyStyle: snapshot(body) };
  html?.style.setProperty('overflow-y', 'hidden', 'important');
  body?.style.setProperty('overflow-y', 'hidden', 'important');
}

function restoreOverlayPageScrollbar() {
  if (!savedOverlayPageScrollStyles) return;
  const restore = (element, style) => {
    if (!element || !style) return;
    if (style.value) element.style.setProperty('overflow-y', style.value, style.priority);
    else element.style.removeProperty('overflow-y');
  };
  restore(savedOverlayPageScrollStyles.html, savedOverlayPageScrollStyles.htmlStyle);
  restore(savedOverlayPageScrollStyles.body, savedOverlayPageScrollStyles.bodyStyle);
  savedOverlayPageScrollStyles = null;
}

function openOverlay() {
  if (!overlayEl()) buildOverlay();
  const video = state.webStudy ? state.videoEl : (document.querySelector('#movie_player video.html5-main-video') || document.querySelector('video.html5-main-video') || document.querySelector('video'));
  const slot = ui('.te-video-slot');
  if (!video || !slot) {
    if (state.webStudy) reportWebIssue('The shared study overlay could not find its video frame.', null, { level: 'error' });
    else alert(videoT('videoNoVideoFound'));
    return;
  }
  document.documentElement.classList.add('lhn-video-overlay-open');
  hideOverlayPageScrollbar();
  overlayEl().classList.toggle('te-learning-entry-pending', pendingDictationShortcut);
  overlayEl().classList.remove('te-hidden');
  shadow.host.style.display = '';
  state.open = true;
  restorePreferredReadingMode();
  if (state.webStudy) attachWebMedia(video, slot);
  else attachVideo(video, slot);
  if (state.webStudy) {
    if (state.captions.length) { setStatus(''); renderTranscriptList(); }
    else setStatus('');
  }
  onTimeUpdate();
  alignActiveTranscriptFocus('auto');
  startAppPopupObserver();
  setVideoTitle();
  extendLoadedWindow();
  if (!state.webStudy && state.captions.length === 0 && state.loadingFor !== state.videoId) loadCaptions();
  applyDefaultSubtitleDisplayMode();
}

function closeOverlay() {
  pendingDictationShortcut = false;
  pendingDictationOpenImmediately = false;
  pendingDictationMode = 'typing';
  setVideoDisplayModeMenuOpen(false);
  setSubtitleModeMenuOpen(false);
  globalThis.LHN_DICTATION?.close?.({ restoreView: false });
  setVideoLearningMode(false);
  overlayEl()?.classList.remove('te-learning-entry-pending');
  document.documentElement.classList.remove('lhn-video-overlay-open');
  restoreOverlayPageScrollbar();
  clearHoverPauseState();
  overlayEl()?.classList.add('te-hidden');
  if (shadow) shadow.host.style.display = 'none';
  uiAll('.te-modal-backdrop').forEach((m) => m.classList.add('hidden'));
  state.open = false;
  syncAppPopupPause();
  stopLiveCaptionCapture();
  detachVideo();
}

async function toggleVideoViewFromShortcut() {
  if (keepitSiteDisabled) return;
  if (!/^(www\.)?youtube\.com$/i.test(location.hostname)) await prepareWebStudyForShortcut();
  const dictation = globalThis.LHN_DICTATION;
  if (!state.open) {
    openOverlay();
    startWebTtsInViewMode();
    return;
  }
  if (pendingDictationShortcut || dictation?.isOpen?.()) {
    pendingDictationShortcut = false;
    pendingDictationOpenImmediately = false;
    dictation?.close?.({ restoreView: false });
    pendingDictationMode = 'typing';
    applyVideoDisplayMode(preferredVideoMode());
    startWebTtsInViewMode();
    return;
  }
  closeOverlay();
}

function detachVideo() {
  const v = state.videoEl;
  if (!v) return;
  stopAmbient();
  if (state.webStudy) {
    v.removeEventListener('timeupdate', onTimeUpdate);
    v.removeEventListener('play', handleVideoPlay);
    v.removeEventListener('pause', handleVideoPause);
    v.removeEventListener('ratechange', handleVideoRateChange);
    v.removeEventListener('volumechange', handleVideoVolumeChange);
    if (state.videoGeometryHandler) { v.removeEventListener('loadedmetadata', state.videoGeometryHandler); state.videoGeometryHandler = null; }
    if (typeof v._dispose === 'function') v._dispose(); else v.pause?.();
    state.webThumbnail?.removeEventListener('click', handleOverlayVideoClick);
    globalThis.LHN_THUMBNAILS?.clear?.(state.webThumbnail);
    state.webThumbnail?.remove();
    state.webThumbnail = null;
    state.videoEl = null; state.webStudy = false; state.webLanguageHint = ''; state.webDetectedLanguage = ''; state.webLanguageReady = Promise.resolve(''); state.webPageUrl = '';
    state.origParent = null; state.origNext = null;
    return;
  }
  v.removeEventListener('click', handleOverlayVideoClick);
  v.removeEventListener('timeupdate', onTimeUpdate);
  v.removeEventListener('play', handleVideoPlay);
  v.removeEventListener('play', enforceVideoPause);
  v.removeEventListener('pause', handleVideoPause);
  v.removeEventListener('ratechange', handleVideoRateChange);
  v.removeEventListener('volumechange', handleVideoVolumeChange);
  if (state.videoGeometryHandler) {
    v.removeEventListener('loadedmetadata', state.videoGeometryHandler);
    v.removeEventListener('resize', state.videoGeometryHandler);
    state.videoGeometryHandler = null;
  }
  if (state.origParent && v.parentElement !== state.origParent) {
    const next = state.origNext && state.origNext.parentNode === state.origParent ? state.origNext : null;
    const wasPlaying = !v.paused;
    state.origParent.insertBefore(v, next);
    if (wasPlaying) v.play().catch(() => {});
  }
  state.videoEl = null;
  state.origParent = null;
  state.origNext = null;
}

// ---------- Ambient mode (ánh sáng mờ theo màu video, giống YouTube) ----------
let ambientTimer = 0, ambientLastTime = -1, ambientObserver = null;
// Đặt tâm vòng sáng ở giữa khung video (overlay cố định tại 0,0 nên dùng thẳng toạ độ viewport).
// Ambient UI chỉ bật/tắt (Ambient 3); giữ renderer viền 1/2 trong mã để có thể bật lại sau.
function isEdgeAmbient() { const m = ambientMode(); return m === '1' || m === '2'; }
function ambientMode() {
  return settings.ambient === false || settings.ambientStyle === 'off' ? 'off' : '3';
}
function syncAmbientUi() {
  const toggle = $('te-ambient-toggle');
  if (!toggle) return;
  toggle.checked = ambientMode() !== 'off';
  toggle.setAttribute('aria-label', videoT('videoAmbientMode'));
}
function setAmbientMode(mode) {
  if (mode !== 'off' && mode !== '3') return;
  settings.ambientStyle = mode;
  settings.ambient = mode !== 'off';
  saveSettings();
  syncAmbientUi();
  stopAmbient();
  if (state.videoEl && mode !== 'off') startAmbient();
}
function placeAmbientEdge() {
  const root = overlayEl(), slot = ui('.te-video-slot'), edge = ui('.te-ambient-edge');
  if (!root || !slot || !edge) return;
  const r = slot.getBoundingClientRect(), rr = root.getBoundingClientRect();
  if (!r.width || !r.height) return;
  const vw = document.documentElement.clientWidth, vh = document.documentElement.clientHeight;
  // Khoảng trống còn lại theo từng hướng; ánh sáng lan tối đa 50% (Ambient 1) hoặc 100% (Ambient 2) khoảng đó
  const reach = ambientMode() === '2' ? 1.0 : 0.5;
  if (rr && root.classList.contains('te-sidebar-hidden')) {
    // Chế độ rạp: phủ kín toàn màn hình
    const ew = Math.max(vw, vh * 16 / 9) * 1.05, eh = ew * 9 / 16;
    edge.style.setProperty('--te-edge-l', `${Math.round((vw - ew) / 2 - rr.left)}px`);
    edge.style.setProperty('--te-edge-t', `${Math.round((vh - eh) / 2 - rr.top)}px`);
    edge.style.setProperty('--te-edge-w', `${Math.round(ew)}px`);
    edge.style.setProperty('--te-edge-h', `${Math.round(eh)}px`);
    return;
  }
  const spL = Math.max(0, r.left), spR = Math.max(0, vw - r.right), spT = Math.max(0, r.top), spB = Math.max(0, vh - r.bottom);
  const boxW = r.width + reach * spL + reach * spR, boxH = r.height + reach * spT + reach * spB;
  // Ảnh giữ tỉ lệ 16:9, lớn nhất có thể trong hộp, đặt giữa video
  const w = Math.min(boxW, boxH * 16 / 9), h = w * 9 / 16;
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  edge.style.setProperty('--te-edge-l', `${Math.round(cx - w / 2 - rr.left)}px`);
  edge.style.setProperty('--te-edge-t', `${Math.round(cy - h / 2 - rr.top)}px`);
  edge.style.setProperty('--te-edge-w', `${Math.round(w)}px`);
  edge.style.setProperty('--te-edge-h', `${Math.round(h)}px`);
}
function drawAmbientEdge() {
  const canvas = ui('.te-ambient-edge'), v = state.videoEl;
  if (!canvas || !v || v.currentTime === ambientLastTime) return;
  try {
    const ctx = canvas.getContext('2d');
    ctx.globalAlpha = Math.abs(v.currentTime - ambientLastTime) > 1.5 ? 1 : 0.35;
    ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
    // Chỉ giữ viền khung hình: phần giữa bị video che nên xóa đi
    ctx.clearRect(canvas.width * 0.15, canvas.height * 0.15, canvas.width * 0.7, canvas.height * 0.7);
    ambientLastTime = v.currentTime;
  } catch { stopAmbient(); }
}
function placeAmbient() {
  if (isEdgeAmbient()) return placeAmbientEdge();
  const root = overlayEl(), slot = ui('.te-video-slot');
  if (!root || !slot) return;
  if (root.classList.contains('te-sidebar-hidden')) {
    // Chế độ rạp: phủ kín toàn màn hình (cả 2 khung đen hai bên)
    const vw = innerWidth, vh = innerHeight;
    root.style.setProperty('--te-amb-x', `${Math.round(vw / 2)}px`);
    root.style.setProperty('--te-amb-y', `${Math.round(vh / 2)}px`);
    root.style.setProperty('--te-amb-size', `${Math.round(Math.max(vh, vw * 9 / 16) * 1.05)}px`);
    return;
  }
  const r = slot.getBoundingClientRect();
  if (!r.width || !r.height) return;
  root.style.setProperty('--te-amb-x', `${Math.round(r.left + r.width / 2)}px`);
  root.style.setProperty('--te-amb-y', `${Math.round(r.top + r.height / 2)}px`);
  root.style.setProperty('--te-amb-size', `${Math.round(Math.max(r.width, r.height) * 2.1)}px`);
}
function drawAmbient() {
  if (isEdgeAmbient()) return drawAmbientEdge();
  const canvas = ui('.te-ambient'), v = state.videoEl;
  const isWebThumbnail = state.webStudy;
  const source = isWebThumbnail ? state.webThumbnail : v;
  if (!canvas || !source || document.hidden) return;
  if (isWebThumbnail) {
    if (ambientLastTime >= 0 || !source.complete || !source.naturalWidth) return;
  } else {
    if (v.readyState < 2 || v.currentTime === ambientLastTime) return; // tạm dừng/không đổi khung thì không vẽ lại
  }
  try {
    const ctx = canvas.getContext('2d');
    // Web dùng thumbnail tĩnh; YouTube pha khung hình mới để màu chuyển mượt.
    ctx.globalAlpha = isWebThumbnail || Math.abs(v.currentTime - ambientLastTime) > 1.5 ? 1 : 0.35;
    if (isWebThumbnail) ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    ambientLastTime = isWebThumbnail ? 0 : v.currentTime;
  } catch { stopAmbient(); } // video không cho đọc hình (DRM/cross-origin): tắt hiệu ứng
}
function startAmbient() {
  stopAmbient();
  overlayEl()?.classList.toggle('te-ambient-mode-2', isEdgeAmbient());
  const root = overlayEl(), canvas = ui('.te-ambient'), slot = ui('.te-video-slot');
  if (!root || !canvas || !slot || settings.ambient === false || globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  placeAmbient();
  if (typeof ResizeObserver === 'function') { ambientObserver = new ResizeObserver(placeAmbient); ambientObserver.observe(slot); ambientObserver.observe(document.documentElement); }
  root.classList.add('te-ambient-on');
  drawAmbient();
  ambientTimer = setInterval(drawAmbient, 125);
}
function stopAmbient() {
  clearInterval(ambientTimer);
  ambientTimer = 0;
  ambientLastTime = -1;
  ambientObserver?.disconnect();
  ambientObserver = null;
  overlayEl()?.classList.remove('te-ambient-on');
  const canvas = ui('.te-ambient');
  canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
}

function setVideoTitle() {
  const t = (document.title || '').replace(/\s*-\s*YouTube$/, '').trim() || (state.webStudy ? location.hostname : 'YouTube video');
  const el = ui('.te-video-title-text');
  if (el) el.textContent = t;
  const miniTitle = ui('.te-reading-mini-title');
  if (miniTitle) miniTitle.textContent = `Keepit - ${t}`;
  const miniSource = ui('.te-reading-mini-source');
  if (miniSource) miniSource.textContent = videoT('dictationAudioSource');
  const miniThumb = ui('.te-reading-mini-thumb');
  const thumbnails = globalThis.LHN_THUMBNAILS;
  if (state.webStudy && miniThumb && thumbnails?.loadSource) {
    miniThumb.hidden = false;
    const thumbnailUrl = thumbnails.fromPageMetadata?.(document, location.href) || '';
    thumbnails.loadSource(miniThumb, { url: location.href, thumbnailUrl, onError:() => { miniThumb.hidden = true; reportWebIssue('The mini-player thumbnail could not be loaded.', null, { level: 'error' }); } });
  } else if (miniThumb && thumbnails?.youtubeVideoId(state.videoId || '')) {
    miniThumb.hidden = false;
    thumbnails.loadYouTube(miniThumb, state.videoId, { onError:() => { miniThumb.hidden = true; } });
  } else {
    if (miniThumb) miniThumb.hidden = true;
    thumbnails?.clear(miniThumb);
  }
  syncReadingAudioControls();
}

function togglePlay() {
  const v = state.videoEl;
  if (!v) return;
  if (v.paused) {
    state.pauseReasons.delete('sidebar-double-click');
    if (!state.pauseReasons.size) state.managedPauseVideo = null;
    syncPlayButton(false);
    try { v.play().catch(() => syncPlayButton()); }
    catch { syncPlayButton(); }
  } else {
    v.pause();
    syncPlayButton(true);
  }
}

function pulseControlButton(button) {
  if (!button) return;
  button.classList.remove('lhn-br-key-press');
  void button.offsetWidth;
  button.classList.add('lhn-br-key-press');
  clearTimeout(button._lhnPressTimer);
  button._lhnPressTimer = setTimeout(() => button.classList.remove('lhn-br-key-press'), 190);
}

function pulseControl(title) {
  pulseControlButton(ctrl(title));
}

function handleOverlayVideoClick(event) {
  event.preventDefault();
  event.stopPropagation();
  togglePlay();
  pulseControl('Phát/Tạm dừng');
}

function handleVideoPlay() {
  syncPlayButton();
  syncReadingAudioControls();
}

function handleVideoPause() {
  syncPlayButton();
  syncReadingAudioControls();
}

function handleVideoRateChange() {
  syncSpeedButton();
  pulseControl('Tốc độ');
}

function handleVideoVolumeChange() {
  syncMuteButton();
  pulseControl('Audio');
}

function syncPlayButton(paused = null) {
  const v = state.videoEl;
  const btn = ctrl('Phát/Tạm dừng');
  const icon = btn?.querySelector('svg');
  if (!v || !icon) return;
  icon.innerHTML = (paused ?? v.paused) ? PLAY_PATH : PAUSE_PATH;
}

// ---- Popup tốc độ: nút "Tốc độ" mở popup (không chuyển tuần tự nữa) ----
const SPEED_MIN = 0.5, SPEED_MAX = 2.0;
function setVideoSpeed(val) {
  const sp = Math.round(Math.max(SPEED_MIN, Math.min(SPEED_MAX, parseFloat(val))) * 100) / 100;
  if (state.videoEl) state.videoEl.playbackRate = sp;
  syncSpeedPopup();
  syncSpeedButton();
}
function syncSpeedLabel() {
  const label = $('te-speed-label');
  if (label) label.textContent = `${(state.videoEl?.playbackRate ?? 1).toFixed(2)}x`;
}
function syncSpeedPopup() {
  const sp = state.videoEl?.playbackRate ?? 1;
  const val = $('te-speed-value');
  if (val) val.textContent = `${sp.toFixed(2)}x`;
  const sl = $('te-speed-slider');
  if (sl) sl.value = sp;
  uiAll('#te-speed-popup .te-speed-btn').forEach((btn) => btn.classList.toggle('active', Math.abs(parseFloat(btn.dataset.speed) - sp) < 0.02));
}
// Đặt popup căn giữa phía trên nút "Tốc độ" (trong hệ tọa độ của overlay), kéo vào trong nếu sát mép
function positionSpeedPopup(p) {
  const root = overlayEl(), btn = ctrl('Tốc độ');
  if (!root || !btn) return;
  const rr = root.getBoundingClientRect(), br = btn.getBoundingClientRect();
  const pw = p.offsetWidth || 340, ph = p.offsetHeight || 0;
  const centerX = br.left + br.width / 2 - rr.left;
  const left = Math.max(8, Math.min(centerX - pw / 2, rr.width - pw - 8));
  const top = Math.max(8, br.top - rr.top - ph - 12);
  p.style.left = `${Math.round(left)}px`;
  p.style.top = `${Math.round(top)}px`;
}
function toggleSpeedPopup() {
  const p = ui('#te-speed-popup');
  if (!p) return;
  if (p.classList.contains('hidden')) {
    p.classList.remove('hidden');   // hiện trước để đo được kích thước, rồi đặt vị trí
    positionSpeedPopup(p);
  } else {
    p.classList.add('hidden');
  }
  syncSpeedPopup();
}
function cycleSpeed() {
  const v = state.videoEl;
  if (!v) return;
  const i = SPEEDS.indexOf(v.playbackRate);
  v.playbackRate = SPEEDS[i < 0 ? 2 : (i + 1) % SPEEDS.length];
  syncSpeedButton();
}

function syncSpeedButton() {
  const v = state.videoEl;
  const btn = ctrl('Tốc độ');
  if (v && btn) btn.setAttribute('aria-label', `${videoT('videoSpeed')} ${v.playbackRate}x`);
  syncSpeedLabel();
}

function toggleMute() {
  const v = state.videoEl;
  if (v) v.muted = !v.muted;
}

function syncMuteButton() {
  const v = state.videoEl;
  const btn = ctrl('Audio');
  if (v && btn) btn.style.opacity = v.muted ? '0.4' : '';
}

function toggleFullscreen() {
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
  } else {
    shadow?.host.requestFullscreen?.().catch(() => {});
  }
}

function seekPrevCaption() {
  const v = state.videoEl;
  if (!v || state.captions.length === 0) return;
  let idx = findCaptionIndex(v.currentTime);
  if (idx < 0 && state.open && state.captions.length) idx = 0;
  if (idx < 0) {
    v.currentTime = state.captions[0].start;
    return;
  }
  const cur = state.captions[idx];
  // Đang giữa câu (quá 1.5 giây) thì về đầu câu, giống nút "trước" của trình phát
  const target = (v.currentTime - cur.start > 1.5 || idx === 0) ? cur : state.captions[idx - 1];
  v.currentTime = target.start;
}

function seekNextCaption() {
  const v = state.videoEl;
  if (!v || state.captions.length === 0) return;
  const next = state.captions[findCaptionIndex(v.currentTime) + 1];
  if (next) v.currentTime = next.start;
}

function seekByTrack(e) {
  const v = state.videoEl;
  if (!v || !v.duration) return;
  const r = e.currentTarget.getBoundingClientRect();
  const ratio = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
  v.currentTime = ratio * v.duration;
}

// ---------- Đồng bộ phụ đề với video ----------
function usesViewportTranscriptFocus() {
  const root = overlayEl();
  return Boolean(root && !root.classList.contains('te-sidebar-hidden') && !root.classList.contains('te-dictation-active'));
}

function transcriptViewportHeight() {
  return Math.max(1, window.innerHeight || document.documentElement.clientHeight || overlayEl()?.clientHeight || 1);
}

function currentTranscriptFocusRatio() {
  const ratio = Number(state.transcriptFocusRatio);
  return Number.isFinite(ratio) ? Math.max(0.03, Math.min(0.97, ratio)) : 0.5;
}

function calculateTranscriptFocusScrollDelta(rowRect, viewportHeight, ratio) {
  return rowRect.top + rowRect.height / 2 - viewportHeight * ratio;
}

function alignActiveTranscriptFocus(behavior = 'smooth') {
  if (!state.open || !usesViewportTranscriptFocus()) return false;
  const list = $('te-transcript-list');
  const row = list?.querySelector('.yt-dual-item.active');
  if (!list || !row) return false;

  const viewportHeight = transcriptViewportHeight();
  const rowRect = row.getBoundingClientRect();
  const margin = Math.min(0.45, Math.max(12, rowRect.height / 2) / viewportHeight);
  const ratio = Math.max(margin, Math.min(1 - margin, currentTranscriptFocusRatio()));
  state.transcriptFocusRatio = ratio;
  const delta = calculateTranscriptFocusScrollDelta(row.getBoundingClientRect(), viewportHeight, ratio);
  const maxScroll = Math.max(0, list.scrollHeight - list.clientHeight);
  const targetScrollTop = Math.max(0, Math.min(maxScroll, list.scrollTop + delta));
  const distance = Math.abs(targetScrollTop - list.scrollTop);
  if (distance < 0.5) return true;
  const scrollBehavior = behavior === 'auto' || Math.abs(delta) > list.clientHeight * 1.5 ? 'auto' : 'smooth';
  state.transcriptProgrammaticScrollAt = globalThis.performance?.now?.() ?? Date.now();
  list.scrollTo({ top: targetScrollTop, behavior: scrollBehavior });
  return true;
}

function captureTranscriptFocusPosition(list = $('te-transcript-list')) {
  const row = list?.querySelector('.yt-dual-item.active');
  if (!list || !row) return false;
  const viewportHeight = transcriptViewportHeight();
  const rect = row.getBoundingClientRect();
  const margin = Math.min(0.45, Math.max(12, rect.height / 2) / viewportHeight);
  state.transcriptFocusRatio = Math.max(margin, Math.min(1 - margin, (rect.top + rect.height / 2) / viewportHeight));
  return true;
}

function markTranscriptManualScroll() {
  const now = globalThis.performance?.now?.() ?? Date.now();
  state.transcriptManualScrollAt = now;
  state.transcriptManualScrollUntil = now + 900;
}

function setActiveCaption(idx) {
  const hadStatus = Boolean(activeVideoStatusKey);
  activeVideoStatusKey = '';
  const prevIdx = state.activeIdx;
  state.activeIdx = idx;
  const cap = state.captions[idx];
  const enEl = $('te-sub-en-text'), viEl = $('te-sub-vi-text');
  if (!hadStatus && prevIdx === idx && enEl?.dataset.idx === String(idx) && viEl?.dataset.idx === String(idx)) return;
  enEl.innerHTML = renderHoverWords(cap.mainText);
  viEl.innerHTML = renderHoverWords(cap.vi);
  enEl.dataset.idx = viEl.dataset.idx = String(idx);
  scheduleTheaterSubtitleLayout();

  const list = $('te-transcript-list');
  list.querySelectorAll('.yt-dual-item.active').forEach((r) => r.classList.remove('active'));
  const row = list.querySelector(`.yt-dual-item[data-idx="${idx}"]`);
  if (row) {
    row.classList.add('active');
    if (state.open && usesViewportTranscriptFocus()) alignActiveTranscriptFocus();
    else {
      const target = row.offsetTop - list.clientHeight / 2 + row.offsetHeight / 2;
      list.scrollTo({ top: target, behavior: Math.abs(target - list.scrollTop) > list.clientHeight * 1.5 ? 'auto' : 'smooth' });
    }
  }
}

function setStatus(text, languageKey = '', languageVars = {}) {
  activeVideoStatusKey = languageKey;
  activeVideoStatusVars = languageKey ? languageVars : {};
  if (!overlayEl()) return;
  $('te-sub-en-text').textContent = text;
  $('te-sub-vi-text').textContent = '';
  const list = $('te-transcript-list');
  list.innerHTML = text ? `<div class="yt-dual-empty">${escapeHtml(text)}</div>` : '';
}

// ---------- Transcript ----------
function renderTranscriptList() {
  const list = $('te-transcript-list');
  list.innerHTML = state.captions.map((c, i) => `
    <div class="yt-dual-item" data-idx="${i}">
      <div class="yt-dual-timestamp">${formatTime(c.start)}</div>
      <div class="yt-dual-content">
        <div class="yt-dual-item-en">${renderHoverWords(c.mainText)}</div>
        <div class="yt-dual-item-vi">${renderHoverWords(c.vi)}</div>
      </div>
    </div>`).join('');
  state.activeIdx = -1;
}

function updateVietnameseRow(item) {
  const idx = state.captions.indexOf(item);
  if (idx < 0) return;
  const row = $('te-transcript-list').querySelector(`.yt-dual-item[data-idx="${idx}"]`);
  if (row) {
    row.querySelector('.yt-dual-item-en').innerHTML = renderHoverWords(item.mainText);
    row.querySelector('.yt-dual-item-vi').innerHTML = renderHoverWords(item.vi);
  }
  if (idx === state.activeIdx) $('te-sub-en-text').innerHTML = renderHoverWords(item.mainText);
  if (idx === state.activeIdx) $('te-sub-vi-text').innerHTML = renderHoverWords(item.vi);
  if (idx === state.activeIdx) scheduleTheaterSubtitleLayout();
}

// Bỏ cue rỗng và gộp các cue trùng khít nội dung liền kề (cùng câu lặp lại, cùng timestamp).
function onTranscriptClick(e) {
  const timestamp = e.target.closest('.yt-dual-timestamp');
  const row = timestamp?.closest('.yt-dual-item');
  const v = state.videoEl;
  if (!row || !v) return;
  const index = Number(row.dataset.idx);
  const cap = state.captions[index];
  if (!cap) return;
  beginHoverPauseSuppression({ requirePauseZone: true });
  translateWindow(index);
  v.currentTime = cap.start;
  v.play().catch(() => {});
}

// ---------- Ẩn/hiện bản dịch tiếng Việt (v1.4) ----------
function srtTime(sec) {
  const ms = Math.round(sec * 1000);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const p = (n, len = 2) => String(n).padStart(len, '0');
  return `${p(h)}:${p(m)}:${p(s)},${p(ms % 1000, 3)}`;
}

function downloadText(name, content, mime) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportBaseName() {
  const t = (document.title || '').replace(/\s*-\s*YouTube$/, '').replace(/[\\/:*?"<>|]+/g, '').trim();
  return t || state.videoId || 'subtitles';
}

// Dịch lười nên có thể còn cue chưa dịch: khi xuất thì để trống thay vì ghi "Đang dịch...".
const viForExport = (c) => (c.vi === PENDING ? '' : c.vi);

function printPdf(title, showTime, includeVi) {
  const w = window.open('', '_blank');
  if (!w) {
    alert(videoT('videoPopupBlocked'));
    return;
  }
  const rows = state.captions.map((c) =>
    `<tr>${showTime ? `<td class="t">${formatTime(c.start)}</td>` : ''}` +
    `<td>${escapeHtml(c.en)}</td>${includeVi ? `<td>${escapeHtml(viForExport(c))}</td>` : ''}</tr>`
  ).join('');
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>` +
    '<style>body{font-family:Arial,sans-serif;font-size:13px;margin:24px}h2{font-size:16px}' +
    'table{border-collapse:collapse;width:100%}td{border-bottom:1px solid #ddd;padding:6px;vertical-align:top}' +
    'td.t{white-space:nowrap;color:#666;width:70px}</style></head><body>' +
    `<h2>${escapeHtml(title)}</h2><table>${rows}</table></body></html>`);
  w.document.close();
  w.focus();
  w.print();
}

function exportAs(format, opts) {
  if (state.captions.length === 0) {
    alert(videoT('videoNoSubtitlesToExport'));
    return;
  }
  const { onlySubs, includeVi, showTime } = opts;
  const base = exportBaseName();
  const caps = state.captions;

  if (format === 'SRT') {
    const body = caps.map((c, i) =>
      `${i + 1}\n${srtTime(c.start)} --> ${srtTime(c.end)}\n${c.en}${includeVi ? '\n' + viForExport(c) : ''}\n`
    ).join('\n');
    downloadText(`${base}.srt`, body, 'text/plain;charset=utf-8');
  } else if (format === 'TXT') {
    const body = caps.map((c) =>
      (showTime ? `[${formatTime(c.start)}] ` : '') + c.en + (includeVi ? '\n' + viForExport(c) : '')
    ).join('\n\n');
    downloadText(`${base}.txt`, body, 'text/plain;charset=utf-8');
  } else if (format === 'CSV') {
    const q = (x) => `"${String(x).replace(/"/g, '""')}"`;
    const lines = [];
    const header = [];
    if (showTime) header.push('Thời gian');
    header.push('English');
    if (includeVi) header.push('Tiếng Việt');
    lines.push(header.map(q).join(','));
    for (const c of caps) {
      const cols = [];
      if (showTime) cols.push(formatTime(c.start));
      cols.push(c.en);
      if (includeVi) cols.push(viForExport(c));
      lines.push(cols.map(q).join(','));
    }
    downloadText(`${base}.csv`, '\uFEFF' + lines.join('\n'), 'text/csv;charset=utf-8');
  } else {
    printPdf(base, showTime, includeVi);
  }
}

function runExport() {
  const modal = $('te-modal-export');
  const format = modal.querySelector('.te-export-tab.active')?.textContent.trim() || 'SRT';
  const cbs = modal.querySelectorAll('input[type=checkbox]');
  const onlySubs = !!cbs[2]?.checked;
  exportAs(format, {
    onlySubs,
    includeVi: !!cbs[3]?.checked,
    showTime: !!cbs[4]?.checked && !onlySubs,
  });
}

// ---------- Gắn sự kiện cho giao diện ----------
function bindUI() {
  const root = overlayEl();
  const modalMain = $('te-modal-main');
  const modalSub = $('te-modal-sub');
  const modalLang = $('te-modal-lang');
  const modalExport = $('te-modal-export');
  const settingsBtn = $('te-settings-btn');
  const floatingBtn = $('te-floating-btn');
  root?.addEventListener('pointermove', rememberHoverPointer, true);

  const theaterSubtitleHandle = ui('#te-theater-subtitle-drag-handle');
  const theaterSubtitlePanel = ui('.te-sub-container');
  if (root && theaterSubtitleHandle && theaterSubtitlePanel) {
    let dragSession = null;
    const setSubtitleCenterY = (requestedY) => updateTheaterSubtitleLayout(requestedY, root);
    theaterSubtitlePanel.addEventListener('dblclick', (event) => {
      if (theaterSubtitleHandle.contains(event.target)) return;
      if (resetTheaterSubtitlePosition(root)) event.preventDefault();
    });
    const finishDrag = (event) => {
      if (!dragSession || event.pointerId !== dragSession.pointerId) return;
      dragSession = null;
      root.classList.remove('te-theater-subtitle-dragging');
      if (theaterSubtitleHandle.hasPointerCapture?.(event.pointerId)) {
        theaterSubtitleHandle.releasePointerCapture(event.pointerId);
      }
      saveSettings();
    };
    theaterSubtitleHandle.addEventListener('pointerdown', (event) => {
      if (event.button !== 0 || !isTheaterLargeActive(root)) return;
      event.preventDefault();
      const rect = theaterSubtitlePanel.getBoundingClientRect();
      dragSession = { pointerId: event.pointerId, startY: event.clientY, centerY: rect.top + rect.height / 2 };
      root.classList.add('te-theater-subtitle-dragging');
      theaterSubtitleHandle.setPointerCapture?.(event.pointerId);
    });
    theaterSubtitleHandle.addEventListener('pointermove', (event) => {
      if (!dragSession || event.pointerId !== dragSession.pointerId) return;
      event.preventDefault();
      setSubtitleCenterY(dragSession.centerY + event.clientY - dragSession.startY);
    });
    theaterSubtitleHandle.addEventListener('pointerup', finishDrag);
    theaterSubtitleHandle.addEventListener('pointercancel', finishDrag);
    theaterSubtitleHandle.addEventListener('lostpointercapture', finishDrag);
    theaterSubtitleHandle.addEventListener('keydown', (event) => {
      if (!isTheaterLargeActive(root) || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')) return;
      event.preventDefault();
      const rect = theaterSubtitlePanel.getBoundingClientRect();
      setSubtitleCenterY(rect.top + rect.height / 2 + (event.key === 'ArrowUp' ? -1 : 1) * (event.shiftKey ? 40 : 12));
      saveSettings();
    });
  }

  const mainSubtitleText = ui('.te-sub-en');
  mainSubtitleText.addEventListener('pointerover', (event) => {
    rememberHoverPointer(event);
    if (!mainSubtitleText.contains(event.relatedTarget)) activateHoverPause('subtitle-main-hover');
  });
  mainSubtitleText.addEventListener('pointerout', (event) => {
    rememberHoverPointer(event);
    if (!mainSubtitleText.contains(event.relatedTarget)) scheduleHoverPauseSync();
  });

  // Định vị menu bên trái nút cài đặt (giống bản UI gốc)
  const positionModal = (modalEl) => {
    const box = modalEl.querySelector('.te-modal-box');
    if (!box) return;
    const btnRect = settingsBtn.getBoundingClientRect();
    const modalWidth = 360;
    box.style.left = Math.max(10, btnRect.left - modalWidth - 12 + 38) + 'px';
    box.style.bottom = (window.innerHeight - btnRect.top + 12) + 'px';
    box.style.right = 'auto';
  };

  const hideAll = () => uiAll('.te-modal-backdrop').forEach((m) => m.classList.add('hidden'));

  const toggleMain = (e) => {
    e.stopPropagation();
    const wasHidden = modalMain.classList.contains('hidden');
    hideAll();
    if (wasHidden) {
      modalMain.classList.remove('hidden');
      positionModal(modalMain);
    }
  };
  settingsBtn.addEventListener('click', toggleMain);
  $('te-notes-sidebar-toggle').addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    document.getElementById('lhn-sidebar-edge-toggle')?.click();
  });
  floatingBtn.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    const sidebarToggle = document.getElementById('lhn-sidebar-edge-toggle');
    if (sidebarToggle && !sidebarToggle.classList.contains('is-open')) sidebarToggle.click();
  });
  $('te-close-modal').addEventListener('click', () => modalMain.classList.add('hidden'));

  uiAll('.te-modal-backdrop').forEach((bd) => {
    bd.addEventListener('click', (e) => {
      if (e.target === bd) bd.classList.add('hidden');
    });
  });

  // Chủ đề sáng / tối
  $('toggle-theme-btn').addEventListener('click', () => {
    settings.theme = settings.theme === 'dark' ? 'light' : 'dark';
    saveSettings();
    applySettings();
  });

  // Điều hướng sang menu con và quay lại
  const nav = (openId, target, backId) => {
    $(openId).addEventListener('click', () => {
      modalMain.classList.add('hidden');
      target.classList.remove('hidden');
      positionModal(target);
      if (target === modalLang) updateSubtitleLanguageLabels();
    });
    $(backId).addEventListener('click', () => {
      target.classList.add('hidden');
      modalMain.classList.remove('hidden');
      positionModal(modalMain);
    });
  };
  nav('open-sub-modal', modalSub, 'back-sub');
  $('te-ambient-toggle')?.addEventListener('change', (event) => setAmbientMode(event.currentTarget.checked ? '3' : 'off'));
  nav('open-lang-modal', modalLang, 'back-lang');
  nav('open-export-modal', modalExport, 'back-export');

  let subtitleLanguageSaveQueue = Promise.resolve();
  const languagePickers = [
    { button: $('te-lang-source-picker'), menu: $('te-lang-source-options'), key: 'sourceLanguage' },
    { button: $('te-lang-target-picker'), menu: $('te-lang-target-options'), key: 'targetLanguage' },
  ];
  const closeLanguagePickers = () => languagePickers.forEach(({ button, menu }) => {
    menu.hidden = true;
    button.setAttribute('aria-expanded', 'false');
  });
  languagePickers.forEach(({ button, menu, key }) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const shouldOpen = menu.hidden;
      closeLanguagePickers();
      menu.hidden = !shouldOpen;
      button.setAttribute('aria-expanded', String(shouldOpen));
    });
    menu.addEventListener('click', (event) => {
      const option = event.target.closest('[data-language-value]');
      if (!option) return;
      event.stopPropagation();
      const value = option.dataset.languageValue;
      closeLanguagePickers();
      saveSubtitleLanguage(key, value, button);
    });
  });
  modalLang.addEventListener('click', (event) => {
    if (!event.target.closest('.te-language-picker')) closeLanguagePickers();
  });
  const saveSubtitleLanguage = (key, value, button) => {
    const allowed = key === 'sourceLanguage' ? ['auto', 'en', 'vi', 'ko'] : ['auto', 'en', 'vi', 'ko'];
    if (!allowed.includes(value)) return;
    // Update the active overlay immediately; persistence continues to use the
    // single Dashboard translation settings object.
    if (key === 'sourceLanguage') state.sourceLanguageSetting = value;
    else state.targetLanguageSetting = value;
    if (key === 'targetLanguage') state.targetLanguage = value === 'auto' ? state.displayLanguage : value;
    state.mainLanguage = state.sourceLanguageSetting === 'auto'
      ? (state.captionTrackLanguage || 'en')
      : state.sourceLanguageSetting;
    translationSettingsRevision++;
    translateQueue = [];
    updateSubtitleLanguageLabels();
    if (state.webStudy) {
      if (state.rawCues.length) {
        const language = state.webDetectedLanguage || state.captionTrackLanguage || state.webLanguageHint;
        const refreshedCues = markWebReaderCues(state.rawCues, language);
        state.rawCues = refreshedCues; state.allCues = refreshedCues; state.captions = refreshedCues;
        state.activeIdx = -1;
        if (state.open) { renderTranscriptList(); onTimeUpdate(); }
      }
    } else if (state.videoId) {
      state.loadToken++;
      prefetchToken++;
      state.loadingFor = null;
      state.rawCues = [];
      state.allCues = [];
      state.captions = [];
      state.activeIdx = -1;
      loadedUntil = 0;
      if (state.open) loadCaptions();
      else schedulePrefetch(state.videoId);
    }
    const save = async () => {
      try {
        const stored = await browser.storage.local.get(STUDY_TRANSLATION_SETTINGS_KEY);
        const current = stored[STUDY_TRANSLATION_SETTINGS_KEY] || {};
        await browser.storage.local.set({ [STUDY_TRANSLATION_SETTINGS_KEY]: { ...current, [key]: value } });
      } catch (error) {
        console.warn(`Could not save subtitle ${key}`, error);
        await refreshSubtitleLanguageSettings();
        updateSubtitleLanguageLabels();
      }
    };
    subtitleLanguageSaveQueue = subtitleLanguageSaveQueue.then(save, save);
    return subtitleLanguageSaveQueue;
  };

  // Nút chọn trong nhóm: chỉ đổi trạng thái active (giữ như UI gốc)
  uiAll('.te-btn-group, .te-export-tab-group').forEach((group) => {
    const buttons = group.querySelectorAll('.te-btn-subopt, .te-export-tab');
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        buttons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  });

  // Công tắc trong menu chính: [0] popup dịch video, [1] đọc khi mở popup,
  // [2] kết hợp câu, [3] ẩn thanh điều khiển.
  const mainSw = modalMain.querySelectorAll('input[type=checkbox]');
  mainSw[0].addEventListener('change', (event) => {
    settings.videoTranslationPopupEnabled = event.target.checked;
    saveSettings();
  });
  mainSw[1].addEventListener('change', (event) => {
    settings.videoClickToSpeak = event.target.checked;
    saveSettings();
  });
  mainSw[2].addEventListener('change', (e) => {
    settings.splitSentences = e.target.checked;
    saveSettings();
    rebuildCaptions();
  });
  mainSw[4].addEventListener('change', (e) => {
    settings.hideControls = e.target.checked;
    sizeForcedHide = false;
    saveSettings();
    applySettings();
  });

  // Tiêu đề video: hover thì chạy qua lại nếu bị cắt
  const titleBox = ui('.te-yt-logo-box'), titleWin = ui('.te-video-title-label'), titleEl = ui('.te-video-title-text');
  if (titleBox && titleWin && titleEl) {
    const stopTitleRun = () => { titleEl.classList.remove('te-title-run'); titleEl.querySelector('.te-title-dup')?.remove(); };
    titleBox.addEventListener('mouseenter', () => {
      stopTitleRun();
      if (titleEl.offsetWidth - titleWin.clientWidth <= 1) return;
      // Nhân đôi chữ (cách 32px, khớp CSS .te-title-dup) rồi chạy đúng một vòng: đuôi nối vào đầu.
      const loop = titleEl.offsetWidth + 32;
      const dup = document.createElement('span');
      dup.className = 'te-title-dup';
      dup.setAttribute('aria-hidden', 'true');
      dup.textContent = titleEl.textContent;
      titleEl.appendChild(dup);
      titleEl.style.setProperty('--te-title-shift', `${loop}px`);
      titleEl.style.setProperty('--te-title-dur', `${Math.max(4, loop / 40).toFixed(1)}s`);
      titleEl.classList.add('te-title-run');
    });
    titleBox.addEventListener('mouseleave', stopTitleRun);
  }

  // Thanh điều khiển trên video
  ui('.te-control-bar').addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (button) pulseControlButton(button);
  });
  ctrl('Lặp lại câu').addEventListener('click', (e) => {
    state.loop = !state.loop;
    e.currentTarget.classList.toggle('te-active', state.loop);
  });
  ctrl('Câu trước').addEventListener('click', seekPrevCaption);
  ctrl('Câu tiếp theo').addEventListener('click', seekNextCaption);
  ctrl('Phát/Tạm dừng').addEventListener('click', togglePlay);
  ctrl('Tốc độ').addEventListener('click', (e) => { e.stopPropagation(); toggleSpeedPopup(); });
  $('te-speed-slider').addEventListener('input', (e) => setVideoSpeed(e.target.value));
  $('te-speed-dec').addEventListener('click', () => setVideoSpeed((state.videoEl?.playbackRate ?? 1) - 0.05));
  $('te-speed-inc').addEventListener('click', () => setVideoSpeed((state.videoEl?.playbackRate ?? 1) + 0.05));
  uiAll('#te-speed-popup .te-speed-btn').forEach((btn) => btn.addEventListener('click', () => setVideoSpeed(btn.dataset.speed)));
  overlayEl().addEventListener('click', (e) => {
    if (e.target.closest('#te-speed-popup') || ctrl('Tốc độ')?.contains(e.target)) return;
    ui('#te-speed-popup')?.classList.add('hidden');
  });
  ctrl('Audio').addEventListener('click', toggleMute);
  const videoModeSelector = $('te-video-mode-trigger')?.parentElement;
  const videoModeTrigger = $('te-video-mode-trigger');
  const videoModeMenu = $('te-video-mode-menu');
  const subtitleModeSelector = $('te-subtitle-mode-trigger')?.parentElement;
  const subtitleModeTrigger = $('te-subtitle-mode-trigger');
  const subtitleModeMenu = $('te-subtitle-mode-menu');
  updateVideoDisplayModeLabels();
  updateSubtitleDisplayModeLabels();
  videoModeTrigger?.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    setSubtitleModeMenuOpen(false);
    setVideoDisplayModeMenuOpen(videoModeMenu.hidden);
  });
  videoModeMenu?.querySelectorAll('[data-video-mode]').forEach((option) => {
    option.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      applyVideoDisplayMode(option.dataset.videoMode);
      setVideoDisplayModeMenuOpen(false);
      videoModeTrigger?.focus();
    });
  });
  videoModeSelector?.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !videoModeMenu || videoModeMenu.hidden) return;
    event.preventDefault();
    event.stopPropagation();
    setVideoDisplayModeMenuOpen(false);
    videoModeTrigger?.focus();
  });
  subtitleModeTrigger?.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    setVideoDisplayModeMenuOpen(false);
    setSubtitleModeMenuOpen(subtitleModeMenu.hidden);
  });
  subtitleModeMenu?.querySelectorAll('[data-subtitle-mode]').forEach((option) => {
    option.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      setSubtitleDisplayModeByUser(option.dataset.subtitleMode);
      setSubtitleModeMenuOpen(false);
      subtitleModeTrigger?.focus();
    });
  });
  subtitleModeSelector?.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !subtitleModeMenu || subtitleModeMenu.hidden) return;
    event.preventDefault();
    event.stopPropagation();
    setSubtitleModeMenuOpen(false);
    subtitleModeTrigger?.focus();
  });
  overlayEl().addEventListener('click', (event) => {
    if (!event.target.closest('.te-video-mode-selector')) setVideoDisplayModeMenuOpen(false);
    if (!event.target.closest('.te-subtitle-mode-selector')) setSubtitleModeMenuOpen(false);
  }, true);
  ctrl('Toàn màn hình').addEventListener('click', toggleFullscreen);
  ui('.te-progress-track').addEventListener('click', seekByTrack);
  ui('#te-reading-video-toggle').addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    toggleReadingAudioCompact();
  });
  ui('#te-reading-mini-play').addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    togglePlay();
  });
  ui('.yt-dual-close-btn').addEventListener('click', closeOverlay);

  const transcriptList = $('te-transcript-list');
  let transcriptClickTimer = 0;
  transcriptList.addEventListener('click', (e) => {
    if (e.detail > 1) return;
    const timestamp = e.target.closest('.yt-dual-timestamp');
    if (!timestamp) return;
    const selectedText = shadow?.getSelection?.()?.toString() || getSelection()?.toString();
    if (selectedText?.trim()) return;
    clearTimeout(transcriptClickTimer);
    transcriptClickTimer = setTimeout(() => onTranscriptClick({ target: timestamp }), 260);
  });
  transcriptList.addEventListener('pointerover', (e) => {
    rememberHoverPointer(e);
    const item = e.target.closest('.yt-dual-item');
    const previousItem = e.relatedTarget instanceof Element ? e.relatedTarget.closest('.yt-dual-item') : null;
    if (item && !previousItem) activateHoverPause('subtitle-sidebar-hover');
  });
  transcriptList.addEventListener('pointerout', (e) => {
    rememberHoverPointer(e);
    const item = e.target.closest('.yt-dual-item');
    const nextItem = e.relatedTarget instanceof Element ? e.relatedTarget.closest('.yt-dual-item') : null;
    if (item && !nextItem) scheduleHoverPauseSync();
  });
  // Dịch lười và ghi nhận vị trí focus mới khi người dùng tự cuộn transcript.
  let scrollRaf = 0;
  const markManualTranscriptScroll = () => markTranscriptManualScroll();
  transcriptList.addEventListener('wheel', markManualTranscriptScroll, { passive: true });
  transcriptList.addEventListener('touchmove', markManualTranscriptScroll, { passive: true });
  transcriptList.addEventListener('keydown', (event) => {
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) markManualTranscriptScroll();
  });
  transcriptList.addEventListener('pointerdown', (event) => {
    const rect = transcriptList.getBoundingClientRect();
    if (event.clientX >= rect.right - Math.max(18, transcriptList.offsetWidth - transcriptList.clientWidth)) {
      state.transcriptPointerScrolling = true;
      markManualTranscriptScroll();
    }
  }, true);
  transcriptList.addEventListener('pointermove', (event) => {
    if (state.transcriptPointerScrolling && event.buttons) markManualTranscriptScroll();
  }, { passive: true });
  window.addEventListener('pointerup', () => { state.transcriptPointerScrolling = false; }, { passive: true });
  transcriptList.addEventListener('scroll', () => {
    if (scrollRaf) return;
    scrollRaf = requestAnimationFrame(() => {
      scrollRaf = 0;
      const now = globalThis.performance?.now?.() ?? Date.now();
      const manualScrollIsCurrent = state.transcriptManualScrollAt > state.transcriptProgrammaticScrollAt
        && now <= state.transcriptManualScrollUntil;
      if (state.open && usesViewportTranscriptFocus() && manualScrollIsCurrent) captureTranscriptFocusPosition(transcriptList);
      translateVisibleRows();
    });
  }, { passive: true });

  // Tùy chọn phụ đề
  const subGroups = modalSub.querySelectorAll('.te-btn-group');
  subGroups[0].querySelectorAll('button').forEach((b, i) => {
    b.addEventListener('click', () => {
      settings.sub.en.pct = PRESET_VALUES[i];
      settings.sub.vi.pct = Math.round(PRESET_VALUES[i] * 0.9);
      saveSettings();
      applySettings();
    });
  });
  subGroups[1].querySelectorAll('button').forEach((b, i) => {
    b.addEventListener('click', () => {
      settings.sub.bold = i === 1;
      saveSettings();
      applySettings();
    });
  });
  modalSub.querySelector('select').addEventListener('change', (e) => {
    settings.sub.font = e.target.value;
    saveSettings();
    applySettings();
  });

  $('te-view-mode-options').querySelectorAll('button').forEach((b) => {
    b.addEventListener('click', () => {
      const dictationLearningActive = overlayEl()?.classList.contains('te-dictation-active');
      if (isReadingModeActive()) settings.readingViewSize = b.dataset.size;
      else if (dictationLearningActive) settings.learningViewSize = b.dataset.size;
      else settings.size = b.dataset.size;
      if (!isReadingModeActive() && !dictationLearningActive) {
        const theaterLargeSelection = settings.size === 'L'
          && overlayEl()?.classList.contains('te-sidebar-hidden');
        if (theaterLargeSelection) {
          if (!settings.hideControls) { settings.hideControls = true; sizeForcedHide = true; }
        } else if (sizeForcedHide) {
          restoreForcedHideControls();
        }
      }
      saveSettings();
      applySettings();
      globalThis.LHN_DICTATION?.syncVideoViewSizeColumns?.();
      syncTheaterFrame();
      if (overlayEl()?.classList.contains('te-ambient-on')) placeAmbient();
    });
  });

  const counters = modalSub.querySelectorAll('.te-counter-btn'); // [EN -, EN +, VI -, VI +]
  const bindCounter = (btn, g, delta) => btn.addEventListener('click', () => {
    const videoSubSettings = activeVideoSubtitleSettings();
    videoSubSettings[g].pct = Math.min(200, Math.max(50, videoSubSettings[g].pct + delta));
    saveSettings();
    applySettings();
  });
  bindCounter(counters[0], 'en', -10);
  bindCounter(counters[1], 'en', 10);
  bindCounter(counters[2], 'vi', -10);
  bindCounter(counters[3], 'vi', 10);

  // Cỡ chữ phụ đề thanh bên (px)
  modalSub.querySelectorAll('.te-counter-btn[data-group]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const k = btn.dataset.group.slice(5);
      settings.side[k].pct = Math.min(200, Math.max(50, settings.side[k].pct + Number(btn.dataset.delta)));
      saveSettings();
      applySettings();
    });
  });

  // Ô màu: input màu trong suốt phủ lên từng ô, bấm là mở bảng chọn màu của trình duyệt
  const pills = modalSub.querySelectorAll('.te-color-pill');
  const pillGroup = ['en', 'vi', 'en', 'vi'];
  pills.forEach((pill, i) => {
    const g = pill.dataset.group || pillGroup[i];
    pill.style.position = 'relative';
    const picker = document.createElement('input');
    picker.type = 'color';
    picker.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer;border:0;padding:0;';
    picker.value = groupRef(g).color || defaultColorFor(g);
    picker.addEventListener('input', () => {
      groupRef(g).color = picker.value;
      saveSettings();
      applySettings();
    });
    pill.appendChild(picker);
  });

  const theaterSubtitleColorPill = $('te-theater-subtitle-color');
  if (theaterSubtitleColorPill) {
    theaterSubtitleColorPill.style.position = 'relative';
    const picker = document.createElement('input');
    picker.id = 'te-theater-subtitle-color-picker';
    picker.type = 'color';
    picker.setAttribute('aria-label', videoT('videoSubtitleBackgroundColor'));
    picker.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer;border:0;padding:0;';
    picker.value = settings.theaterSubtitle.backgroundColor || '#000000';
    picker.addEventListener('input', () => {
      settings.theaterSubtitle.backgroundColor = picker.value;
      saveSettings();
      applyTheaterSubtitlePresentation();
    });
    theaterSubtitleColorPill.appendChild(picker);
  }
  $('te-theater-subtitle-opacity').addEventListener('input', (event) => {
    settings.theaterSubtitle.opacity = Math.min(100, Math.max(0, Number(event.target.value) || 0));
    applyTheaterSubtitlePresentation();
  });
  $('te-theater-subtitle-opacity').addEventListener('change', saveSettings);

  // Đặt lại (nút ở góc phải tiêu đề menu phụ đề)
  modalSub.querySelector('.te-modal-header button:last-child').addEventListener('click', () => {
    const defaults = defaultSettings();
    settings.sub = defaults.sub;
    settings.side = defaults.side;
    settings.readingSubtitle = defaults.readingSubtitle;
    settings.theaterSubtitle = defaults.theaterSubtitle;
    saveSettings();
    applySettings();
  });

  // Xuất phụ đề
  modalExport.querySelector('.te-export-submit-btn').addEventListener('click', runExport);
}

// ---------- Theo dõi điều hướng của YouTube ----------
// Keepit có thể bị tắt trên riêng website này (Alt+Z) — khi đó ẩn nút mở và đóng overlay.
let keepitSiteDisabled = false;
let keepitSiteGateReady = false;
async function refreshKeepitGate() {
  try {
    const stored = await browser.storage.local.get('lhnSettings');
    const list = Array.isArray(stored?.lhnSettings?.disabledWebsites) ? stored.lhnSettings.disabledWebsites : [];
    const host = location.hostname.toLowerCase().replace(/^www\./, '');
    keepitSiteDisabled = list.some(site => {
      const domain = String(site || '').toLowerCase().replace(/^www\./, '');
      return domain && (host === domain || host.endsWith(`.${domain}`));
    });
  } catch { keepitSiteDisabled = false; }
  keepitSiteGateReady = true;
  if (keepitSiteDisabled) {
    const launcher = document.getElementById(LAUNCHER_ID);
    if (launcher) launcher.style.display = 'none';
    if (state.open) closeOverlay();
  }
}

function tick() {
  if (keepitSiteDisabled) return;
  if (state.webStudy) {
    if (location.href !== state.webPageUrl) closeOverlay();
    return;
  }
  const isWatch = location.pathname === '/watch';
  const launcher = ensureLauncher();
  const launcherAttached = launcherIsInPlayerControls(launcher);
  if (launcher) launcher.style.display = isWatch && launcherAttached ? '' : 'none';

  const videoId = isWatch ? new URLSearchParams(location.search).get('v') : null;
  if (videoId === state.videoId) return;

  if (state.open) closeOverlay();
  stopLiveCaptionCapture();
  state.videoId = videoId;
  state.loadToken++;
  state.rawCues = [];
  state.allCues = [];
  state.captions = [];
  state.activeIdx = -1;
  state.viCache = new Map();
  state.captionTrackLanguage = '';
  state.primaryNeedsTranslation = false;
  state.loadingFor = null;
  loadedUntil = 0;
  if (prefetchTimer) { clearTimeout(prefetchTimer); prefetchTimer = 0; }
  prefetchToken++;
  if (videoId) schedulePrefetch(videoId);

  if (overlayEl()) {
    setStatus('');
    setVideoTitle();
  }
}

async function runSharedVideoShortcut(handler, event) {
  if (!keepitSiteGateReady) await refreshKeepitGate();
  await handler(event);
}

function isEditableVideoShortcutTarget(event) {
  const target = event.composedPath?.()[0] || event.target;
  return Boolean(target?.closest?.('input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"]') || target?.isContentEditable);
}

function handleVideoOverlayShortcut(event) {
  if (!state.open || event.isComposing) return;
  const editable = isEditableVideoShortcutTarget(event);

  // Shared Alt+1–3 view modes.
  if (!editable && event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
    const modes = { '1': 'theater', '2': 'reading', '3': 'combined' };
    const mode = modes[event.key];
    if (mode) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const menuWasOpen = $('te-video-mode-menu')?.hidden === false;
      applyVideoDisplayMode(mode);
      setVideoDisplayModeMenuOpen(false);
      if (menuWasOpen) $('te-video-mode-trigger')?.focus();
      return;
    }
  }

  // Shared 1–4 subtitle modes.
  if (!editable && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
    const modes = { '1': 'bilingual', '2': 'primary', '3': 'translation', '4': 'hidden' };
    const mode = modes[event.key];
    if (mode) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const menuWasOpen = $('te-subtitle-mode-menu')?.hidden === false;
      setSubtitleDisplayModeByUser(mode);
      setSubtitleModeMenuOpen(false);
      if (menuWasOpen) $('te-subtitle-mode-trigger')?.focus();
      return;
    }
  }

  // Shared speed shortcut; Shift is required to type >/< on common layouts.
  if (!editable && (event.key === '>' || event.key === '<') && !event.altKey && !event.ctrlKey && !event.metaKey) {
    event.preventDefault();
    event.stopImmediatePropagation();
    setVideoSpeed((state.videoEl?.playbackRate ?? 1) + (event.key === '>' ? 0.05 : -0.05));
    return;
  }

  // Keep native YouTube playback/seek keys untouched; the shared dispatcher
  // routes the same keys to overlay controls for Web's virtual media element.
  if (editable || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  const actions = {
    ' ': ['Phát/Tạm dừng', togglePlay],
    k: ['Phát/Tạm dừng', togglePlay],
    ArrowLeft: ['Câu trước', seekPrevCaption],
    j: ['Câu trước', seekPrevCaption],
    ArrowRight: ['Câu tiếp theo', seekNextCaption],
    l: ['Câu tiếp theo', seekNextCaption],
  };
  const action = actions[event.key];
  if (!action) return;
  if (!state.webStudy) {
    pulseControl(action[0]);
    return;
  }
  if (globalThis.LHN_DICTATION?.isOpen?.() || document.querySelector('.lhn-bilingual-reading')) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  action[1]();
  pulseControl(action[0]);
}

// Dictation/Speaking routing and overlay API for the Study engine under js/overlay/study.
let pendingDictationShortcut = false;
let pendingDictationOpenImmediately = false;
let pendingDictationMode = 'typing';
function createDictationOverlayApi() {
  if (globalThis.LHN_OVERLAY_API) return globalThis.LHN_OVERLAY_API;
  const api = Object.freeze({
    state,
    overlayEl,
    ctrl,
    setLearningMode: setVideoLearningMode,
    syncViewSize: syncViewSizeClasses,
    restorePreferredReadingMode,
    getPreferredLearningMode: preferredLearningMode,
    revealLearningEntry() { overlayEl()?.classList.remove('te-learning-entry-pending'); },
    setPreferredLearningMode(mode) {
      if (!['typing', 'speaking'].includes(mode)) return false;
      settings.preferredLearningMode = mode;
      saveSettings();
      return true;
    },
    lang: () => state.displayLanguage,
    getDictationCues: () => {
      if (!state.allCues.length || (!state.webStudy && state.captionTrackLanguage !== 'en')) return [];
      if (state.webStudy) return state.allCues.map((cue, index) => ({ id:index, start:cue.start, end:cue.end, en:String(cue.en || '').trim() })).filter((cue) => cue.en);
      return dedupeSentences(resegmentBySentence(state.allCues)).map((cue, index) => ({
        id: index,
        start: cue.start,
        end: cue.end,
        en: String(cue.en || '').replace(/\s+/g, ' ').trim(),
      })).filter((cue) => cue.en);
    },
    translateToVietnamese: (text) => translateOne(text, 'vi'),
  });
  globalThis.LHN_OVERLAY_API = api;
  return api;
}

function announceDictationCaptionsUpdated() {
  document.dispatchEvent(new CustomEvent('lhn-dual-captions-updated', {
    detail: { videoId: state.videoId, language: state.captionTrackLanguage, count: state.allCues.length },
  }));
}

function beginDictationMode(mode) {
  const selectedMode = mode === 'speaking' ? 'speaking' : 'typing';
  if (state.open) {
    if (!globalThis.LHN_DICTATION?.open) return;
    overlayEl()?.classList.add('te-learning-entry-pending');
    globalThis.LHN_DICTATION.open({ waitForCaptions: true, mode: selectedMode });
    return;
  }
  pendingDictationShortcut = true;
  pendingDictationOpenImmediately = true;
  pendingDictationMode = selectedMode;
  openOverlay();
  if (!state.open) {
    pendingDictationShortcut = false;
    pendingDictationOpenImmediately = false;
    pendingDictationMode = 'typing';
    return;
  }
  openPendingDictationShortcut();
}

function toggleDictationTypingControl() {
  if (keepitSiteDisabled) return;
  const dictation = globalThis.LHN_DICTATION;
  if (dictation?.isOpen?.()) {
    if (dictation.getMode?.() !== 'typing') dictation.open?.({ waitForCaptions: true, mode: 'typing' });
    else dictation.close?.();
    return;
  }
  beginDictationMode('typing');
}

async function prepareWebStudyForShortcut() {
  if (/^(www\.)?youtube\.com$/i.test(location.hostname) || state.webStudy) return;
  if (state.open) closeOverlay();
  document.dispatchEvent(new CustomEvent('lhn-bilingual-reader-command', { detail: 'stop-reading' }));
  await prepareWebStudy();
}

async function toggleDictationFromShortcut(event) {
  if (keepitSiteDisabled) return;
  if (event?.detail?.source === 'typing-control') {
    toggleDictationTypingControl();
    return;
  }
  if (!/^(www\.)?youtube\.com$/i.test(location.hostname)) await prepareWebStudyForShortcut();
  const dictation = globalThis.LHN_DICTATION;
  if (pendingDictationShortcut || dictation?.isOpen?.()) {
    closeOverlay();
    return;
  }
  beginDictationMode(preferredLearningMode());
}

function openPendingDictationShortcut() {
  if (!pendingDictationShortcut) return;
  if (!state.open) {
    pendingDictationShortcut = false;
    pendingDictationOpenImmediately = false;
    pendingDictationMode = 'typing';
    return;
  }
  const hasCues = !!globalThis.LHN_OVERLAY_API?.getDictationCues?.().length;
  if (!hasCues && state.loadingFor === state.videoId && !pendingDictationOpenImmediately) return;
  pendingDictationShortcut = false;
  const openWhileLoading = pendingDictationOpenImmediately;
  const mode = pendingDictationMode;
  pendingDictationOpenImmediately = false;
  pendingDictationMode = 'typing';
  if (openWhileLoading) globalThis.LHN_DICTATION?.open?.({ waitForCaptions: true, mode, fromEntry: true });
  else globalThis.LHN_DICTATION?.open?.({ mode, fromEntry: true });
}

async function openDictationFromDashboardIntent() {
  if (!/^(www\.)?youtube\.com$/i.test(location.hostname)) return;
  let targetUrl;
  try { targetUrl = new URL(location.href); } catch { return; }
  if (targetUrl.pathname !== "/watch" || targetUrl.searchParams.get("lhn_open_dictation") !== "1") return;
  targetUrl.searchParams.delete("lhn_open_dictation");
  history.replaceState(history.state, "", `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`);
  await refreshKeepitGate();
  if (keepitSiteDisabled) return;
  pendingDictationShortcut = true;
  pendingDictationOpenImmediately = true;
  pendingDictationMode = preferredLearningMode();
  openOverlay();
  openPendingDictationShortcut();
}

// Khung video co theo đúng tỉ lệ của video (không ép 16:9); chưa có metadata thì dùng 16:9.

window.addEventListener('keydown', handleVideoOverlayShortcut, true);
document.addEventListener('keydown', (event) => {
  if (!state.open || event.key !== 'Escape') return;
  event.preventDefault();
  event.stopPropagation();
  closeOverlay();
});

// Bilingual Reader and Web-study are exclusive: opening Web stops Reader;
// starting Reader closes an active Web-study overlay before its TTS begins.
document.addEventListener('lhn-bilingual-reader-started', () => {
  if (state.webStudy && state.open) closeOverlay();
}, true);

document.addEventListener('lhn-youtube-dual-subtitles-toggle', (event) => {
  void runSharedVideoShortcut(toggleVideoViewFromShortcut, event);
});
document.addEventListener('lhn-youtube-dictation-toggle', (event) => {
  void runSharedVideoShortcut(toggleDictationFromShortcut, event);
});

void refreshKeepitGate();
void Promise.all([restoreSettings(), refreshSubtitleLanguageSettings()]).then(([loaded]) => {
  settings = loaded;
  if (overlayEl()) applySettings();
  if (state.open) restorePreferredReadingMode();
  if (/^(www\.)?youtube\.com$/i.test(location.hostname)) {
    setInterval(tick, 1000);
    tick();
    void openDictationFromDashboardIntent();
  }
});
browser.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  if (changes[SETTINGS_KEY]) {
    const wasRuntimeForced = sizeForcedHide && settings.hideControls;
    settings = mergeSettings(defaultSettings(), changes[SETTINGS_KEY].newValue || {});
    delete settings.sizeForcedHide;
    if (wasRuntimeForced && settings.hideControls === false) settings.hideControls = true;
    if (overlayEl()) applySettings();
  }
  const sharedSettingsKey = globalThis.LHN_CONFIG?.STORAGE_KEYS?.SETTINGS || 'lhnSettings';
  if (changes[sharedSettingsKey]) {
    void refreshKeepitGate();
    void refreshSubtitleLanguageSettings();
  }
  if (changes[STUDY_TRANSLATION_SETTINGS_KEY]) void refreshSubtitleLanguageSettings();
});
window.addEventListener('resize', () => { if (state.videoEl) syncVideoAspect(state.videoEl); });

// Player discovery and caption polling remain YouTube-specific.
if (/^(www\.)?youtube\.com$/i.test(location.hostname)) {
  observeLauncherChanges();
  document.addEventListener('lhn-dual-captions-updated', openPendingDictationShortcut);
  window.addEventListener('pagehide', () => {
    if (isTheaterLargeActive() && sizeForcedHide) restoreForcedHideControls();
  });
}
