// Nguồn phụ đề YouTube: tải, đọc CC, transcript
// Tách từ js/video/dual-subtitles.js (v3.5.26). Nội dung giữ nguyên, chỉ đổi vị trí file.

// Tải trước phụ đề khi vừa mở video (5 phút), khi mở overlay thì giữ trước 10 phút.
const PRELOAD_SECONDS = 300;
const LOOKAHEAD_SECONDS = 600;
const TRANSCRIPT_CACHE_LIMIT = 20;
const transcriptCache = new Map(); // video + ngôn ngữ -> cue[] đã làm sạch, LRU trong trang
const transcriptTrackLanguageCache = new Map();
const failedUntil = new Map(); // videoId -> thời điểm hết hạn cache lỗi
const FAILED_CACHE_MS = 10 * 60 * 1000;
let loadedUntil = 0;               // mốc thời gian đã nạp xong (giây)
let activeVideoStatusKey = '';
let activeVideoStatusVars = {};
let prefetchToken = 0;
let prefetchTimer = 0;
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
const SENTENCE_END_RE = /[.!?…]["'”’)\]]*$/;
const ABBREVIATION_RE = /\b(mr|mrs|ms|dr|vs|etc|e\.g|i\.e|st|no)\.$/i;
const MAX_SENTENCE_SEC = 12;
const MAX_SENTENCE_WORDS = 30;
const MIN_TRANSCRIPT_LINE_WORDS = 5;
const TRANSCRIPT_LABEL = /show transcript|hiển thị bản ghi|bản ghi/i;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

async function fetchText(url) {
  const res = await globalThis.LHN_MESSAGING.sendMessage({ type: 'YOUTUBE_FETCH_TEXT', url });
  if (!res?.ok) throw new Error(res?.error || 'Fetch thất bại');
  return res.text;
}

function errorText(reasons) {
  return { detail: reasons.length ? reasons.join(' | ') : 'không rõ nguyên nhân' };
}

function extractPlayerResponse(html) {
  const m = /ytInitialPlayerResponse\s*=\s*\{/.exec(html);
  if (!m) return null;

  const start = m.index + m[0].length - 1;
  let depth = 0;
  let inStr = false;
  let esc = false;

  for (let i = start; i < html.length; i++) {
    const c = html[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) {
        try { return JSON.parse(html.slice(start, i + 1)); }
        catch { return null; }
      }
    }
  }
  return null;
}

function trackLanguageCode(track) {
  return String(track?.languageCode || '').toLowerCase().split('-')[0];
}

// Auto source follows the default audio track's linked caption, not YouTube's account-locale `isDefault` flag.
function audioTrackCaptionFor(tracks, tracklist) {
  const audioTracks = Array.isArray(tracklist?.audioTracks) ? tracklist.audioTracks : [];
  const defaultIndex = Number(tracklist?.defaultAudioTrackIndex);
  const audioTrack = Number.isInteger(defaultIndex) && defaultIndex >= 0 && defaultIndex < audioTracks.length
    ? audioTracks[defaultIndex]
    : audioTracks.find((item) => item?.isDefault) || null;
  if (!audioTrack) return null;

  const trackAt = (index) => {
    const value = Number(index);
    return Number.isInteger(value) && value >= 0 && value < tracks.length ? tracks[value] : null;
  };
  const mappedTracks = Array.isArray(audioTrack.captionTrackIndices)
    ? audioTrack.captionTrackIndices.map(trackAt).filter(Boolean)
    : [];
  const audioLanguage = String(audioTrack.audioTrackId || '').split('.')[0].toLowerCase().split('-')[0];
  if (audioLanguage) {
    const matching = (mappedTracks.length ? mappedTracks : tracks)
      .filter((track) => trackLanguageCode(track) === audioLanguage)
      .sort((a, b) => Number(a.kind === 'asr') - Number(b.kind === 'asr'))[0];
    if (matching) return matching;
  }

  const defaultCaption = trackAt(audioTrack.defaultCaptionTrackIndex ?? tracklist?.defaultCaptionTrackIndex);
  if (defaultCaption && (!mappedTracks.length || mappedTracks.includes(defaultCaption))) return defaultCaption;
  return mappedTracks.find((track) => track.kind !== 'asr') || mappedTracks[0] || null;
}

function originalTrackFor(tracks, tracklist) {
  return audioTrackCaptionFor(tracks, tracklist)
    || tracks.find((track) => track.isDefault)
    || tracks.find((track) => track.kind !== 'asr')
    || tracks[0]
    || null;
}

function selectLanguageTrack(tracks, language, tracklist = null) {
  const original = originalTrackFor(tracks, tracklist);
  if (!language || language === 'auto') return { track: original, original, needsTranslation: false };
  const matching = tracks
    .filter((track) => trackLanguageCode(track) === language)
    .sort((a, b) => Number(a.kind === 'asr') - Number(b.kind === 'asr'))[0] || null;
  return { track: matching || original, original, needsTranslation: !matching && !!original };
}

function pickTrack(tracks, sourceLanguage = state.sourceLanguageSetting, tracklist = null) {
  const selected = selectLanguageTrack(tracks, sourceLanguage, tracklist);
  state.captionTrackLanguage = trackLanguageCode(selected.track);
  state.primaryNeedsTranslation = selected.needsTranslation;
  return selected.track;
}

function markSingleTrackCues(cues, language = state.captionTrackLanguage) {
  const sourceNeedsTranslation = state.sourceLanguageSetting !== 'auto' && language !== state.sourceLanguageSetting;
  const targetNeedsTranslation = language !== state.targetLanguage;
  state.primaryNeedsTranslation = sourceNeedsTranslation;
  state.secondaryNeedsTranslation = targetNeedsTranslation;
  state.mainLanguage = state.sourceLanguageSetting === 'auto' ? (language || 'en') : state.sourceLanguageSetting;
  updateSubtitleLanguageLabels();
  return cues.map((cue) => ({
    ...cue,
    mainNeedsTranslation: sourceNeedsTranslation,
    mainTranslationInput: cue.en,
    mainText: sourceNeedsTranslation ? PENDING : cue.en,
    secondaryNeedsTranslation: targetNeedsTranslation,
    secondaryTranslationInput: cue.en,
    vi: targetNeedsTranslation ? PENDING : cue.en,
  }));
}

function markWebReaderCues(cues, language = state.webDetectedLanguage || state.webLanguageHint) {
  const sourceLanguage = String(language || 'en').replace(/_/g, '-').split('-')[0].toLowerCase();
  const marked = markSingleTrackCues(cues, sourceLanguage);
  state.primaryNeedsTranslation = false;
  state.mainLanguage = sourceLanguage;
  updateSubtitleLanguageLabels();
  return marked.map((cue) => ({
    ...cue,
    mainNeedsTranslation: false,
    mainTranslationInput: cue.en,
    mainText: cue.en,
  }));
}

async function waitFor(fn, timeout) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    const v = fn();
    if (v) return v;
    await sleep(250);
  }
  return null;
}

async function tracksFromWatchPage(videoId, reasons) {
  try {
    const html = await fetchText(`https://www.youtube.com/watch?v=${videoId}`);
    const pr = extractPlayerResponse(html);
    if (!pr) reasons.push('trang watch: không tìm thấy dữ liệu player');
    const tracklist = pr?.captions?.playerCaptionsTracklistRenderer || null;
    if (!tracklist?.captionTracks?.length) reasons.push('trang watch: không có danh sách phụ đề');
    return tracklist;
  } catch (err) {
    reasons.push('trang watch: ' + err.message);
    return [];
  }
}

let lastTranscriptButton = null;
function findTranscriptButton() {
  if (lastTranscriptButton && lastTranscriptButton.isConnected) return lastTranscriptButton;
  lastTranscriptButton = findTranscriptButtonUncached();
  return lastTranscriptButton;
}
function findTranscriptButtonUncached() {
  // Ưu tiên nút trong khu vực transcript của mô tả (kể cả khi đang ẩn: click() vẫn hoạt động)
  const inSection = document.querySelector(
    'ytd-video-description-transcript-section-renderer button'
  );
  if (inSection) return inSection;

  return [...document.querySelectorAll('button, yt-button-shape button')].find((b) => {
    const label = (b.getAttribute('aria-label') || b.textContent || '').trim();
    return TRANSCRIPT_LABEL.test(label);
  }) || null;
}

function findTranscriptMenuItem() {
  return [...document.querySelectorAll('ytd-menu-service-item-renderer, tp-yt-paper-item')]
    .find((el) => TRANSCRIPT_LABEL.test(el.textContent || '')) || null;
}

const TRANSCRIPT_SEGMENT_SELECTOR = [
  'ytd-transcript-segment-renderer',
  'ytd-transcript-segment-list-renderer ytd-transcript-segment-renderer',
  'transcript-segment-view-model',
  '[class*="transcript-segment"]',
].join(',');

function transcriptSegments() {
  return [...document.querySelectorAll(TRANSCRIPT_SEGMENT_SELECTOR)].filter((el) => (el.textContent || '').trim());
}

async function openTranscriptPanel(reasons) {
  if (transcriptSegments().length) return 'ok';

  // Cách 1: nút trong mô tả (mở rộng mô tả nếu cần)
  let btn = findTranscriptButton();
  if (!btn) {
    document.querySelector(
      '#description-inline-expander #expand, ytd-text-inline-expander #expand, #expand'
    )?.click();
    await sleep(800);
    btn = findTranscriptButton();
  }
  if (btn) {
    btn.click();
  } else {
    // Cách 2: menu "..." (More actions) của video
    const moreBtn = document.querySelector(
      'ytd-menu-renderer button[aria-label], #top-level-buttons-computed button[aria-label*="action" i]'
    );
    moreBtn?.click();
    await sleep(600);
    const item = findTranscriptMenuItem();
    if (!item) {
      document.body.click(); // đóng menu nếu đang mở
      reasons.push('DOM: không tìm thấy nút/menu "Hiển thị bản ghi" (video có thể không có transcript)');
      return 'missing';
    }
    item.click();
  }

  const ok = await waitFor(() => transcriptSegments().length, 6000);
  if (!ok) reasons.push('DOM: đã bấm nút bản ghi nhưng panel không hiện các đoạn');
  return ok ? 'ok' : 'failed';
}

function parseTimestamp(text) {
  const parts = text.trim().split(':').map(Number);
  if (!parts.length || parts.some(isNaN)) return null;
  return parts.reduce((acc, v) => acc * 60 + v, 0);
}

function segmentTextAndTime(seg) {
  const timestampEl = seg.querySelector('.segment-timestamp, [class*="timestamp"]');
  let time = parseTimestamp(timestampEl?.textContent || '');
  let text = (seg.querySelector('.segment-text, [class*="segment-text"]')?.textContent || '').replace(/\s+/g, ' ').trim();
  if (time == null || !text) {
    const raw = (seg.textContent || '').replace(/\s+/g, ' ').trim();
    const m = raw.match(/(\d{1,2}:\d{2}(?::\d{2})?)/);
    if (!m) return null;
    if (time == null) time = parseTimestamp(m[1]);
    if (!text) text = `${raw.slice(0, m.index)} ${raw.slice(m.index + m[1].length)}`.replace(/\s+/g, ' ').trim();
  }
  return time == null || !text ? null : { start: time, en: text };
}

function captionsFromTranscriptPanel() {
  const items = [];
  for (const seg of transcriptSegments()) {
    const parsed = segmentTextAndTime(seg);
    if (parsed) items.push(parsed);
  }
  return items.map((it, i) => {
    const next = items[i + 1]?.start;
    const end = next != null ? Math.max(next, it.start + 0.5) : it.start + 3;
    return { id: i, start: it.start, end, en: it.en, vi: 'Đang dịch...' };
  });
}

// ---------- Nguồn dự phòng: đọc phụ đề đang hiển thị trên video ----------
// YouTube đã chặn timedtext (trả 200 nhưng rỗng) nên phải đọc caption hiển thị (CC).
const LIVE_POLL_MS = 400;
const LIVE_CUE_SECONDS = 3;
const LIVE_STABLE_TICKS = 2; // text phải ổn định ~0.8s mới chốt thành cue
let livePollTimer = null, liveLastCue = null;
let livePendingText = '', livePendingTicks = 0, livePendingStart = 0, liveCommittedText = '';

function visibleCaptionText() {
  const parts = [...document.querySelectorAll('.ytp-caption-window-container .ytp-caption-segment')]
    .map((el) => el.textContent || '');
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

let ccStartedByKeepit = false;
function ensureCaptionsOn() {
  const btn = document.querySelector('.ytp-subtitles-button');
  if (btn && btn.getAttribute('aria-pressed') === 'false') { btn.click(); ccStartedByKeepit = true; }
}

function restoreCaptionsState() {
  const btn = document.querySelector('.ytp-subtitles-button');
  if (ccStartedByKeepit && btn && btn.getAttribute('aria-pressed') === 'true') btn.click();
  ccStartedByKeepit = false;
}

function stopLiveCaptionCapture() {
  restoreCaptionsState();
  if (livePollTimer) clearInterval(livePollTimer);
  livePollTimer = null;
  liveLastCue = null;
  livePendingText = '';
  livePendingTicks = 0;
  liveCommittedText = '';
}

// YouTube hay cộng dồn chữ trong container: text mới có thể chứa cả cue trước.
// Khi đó mở rộng cue hiện tại thay vì tạo cue mới (tránh lặp 1 câu 2 lần).
function commitLiveCue(text, start, nowAt) {
  const last = liveLastCue;
  if (last && text.startsWith(last.en)) {
    if (text !== last.en) last.en = text;
    last.end = Math.max(last.end, nowAt);
  } else if (last && last.en.startsWith(text)) {
    last.end = Math.max(last.end, nowAt);
  } else {
    if (last) last.end = Math.max(last.end, start);
    liveLastCue = { start, end: start + LIVE_CUE_SECONDS, en: text, vi: PENDING };
    state.rawCues.push(liveLastCue);
  }
  buildCaptions();
  onTimeUpdate();
  translateWindow(Math.max(0, state.captions.length - 1));
}

function startLiveCaptionCapture(reasons) {
  stopLiveCaptionCapture();
  ensureCaptionsOn();
  setStatus(videoT('videoLiveCaptionStatus'), 'videoLiveCaptionStatus');
  livePollTimer = setInterval(() => {
    const video = state.videoEl || document.querySelector('video');
    if (!video) return;
    const text = visibleCaptionText();
    if (!text) { livePendingText = ''; livePendingTicks = 0; return; }
    if (text === livePendingText) livePendingTicks++;
    else { livePendingText = text; livePendingTicks = 1; livePendingStart = video.currentTime; }
    if (livePendingTicks < LIVE_STABLE_TICKS) return;
    if (text === liveCommittedText) return;
    liveCommittedText = text;
    commitLiveCue(text, livePendingStart, video.currentTime);
  }, LIVE_POLL_MS);
  reasons.push('đọc phụ đề trực tiếp từ video');
}

function splitCueText(cue, sourceText = cue.en) {
  const raw = sourceText.split(/(?<=[.!?…]["'”’)\]]*)\s+/);
  const merged = [];
  for (const piece of raw) {
    const last = merged.length - 1;
    if (last >= 0 && ABBREVIATION_RE.test(merged[last])) {
      merged[last] = merged[last] + ' ' + piece; // "Mr. Smith" không tách
    } else {
      merged.push(piece);
    }
  }

  const total = sourceText.length;
  const span = cue.end - cue.start;
  let offset = 0;
  return merged.map((text) => {
    const startOff = offset;
    offset += text.length + 1; // +1 cho khoảng trắng đã cắt
    return {
      text,
      start: cue.start + span * (startOff / total),
      end: cue.start + span * (Math.min(offset - 1, total) / total),
    };
  });
}

function cleanSentenceSegmentText(text) {
  return String(text ?? '')
    .replace(/\[[^\]]*\]/gu, ' ')
    .replace(/>>/gu, ' ')
    .replace(/\s+/gu, ' ')
    .replace(/\s+([,.;:!?…])/gu, '$1')
    .trim();
}

function transcriptLineWordCount(cue) {
  const text = String(cue?.en || '').trim();
  return text ? text.split(/\s+/u).length : 0;
}

function canMergeTranscriptLines(left, right) {
  const wordCount = transcriptLineWordCount(left) + transcriptLineWordCount(right);
  const duration = Math.max(left.end, right.end) - Math.min(left.start, right.start);
  return wordCount <= MAX_SENTENCE_WORDS && duration <= MAX_SENTENCE_SEC;
}

function mergeTranscriptLines(left, right) {
  const en = `${left.en} ${right.en}`.replace(/\s+/gu, ' ').trim();
  const mainNeedsTranslation = !!left.mainNeedsTranslation || !!right.mainNeedsTranslation;
  const secondaryNeedsTranslation = !!left.secondaryNeedsTranslation || !!right.secondaryNeedsTranslation;
  const translatedParts = [left.vi, right.vi]
    .filter((text) => text && text !== PENDING)
    .map((text) => String(text).trim())
    .filter(Boolean);
  const mainInputs = [left.mainTranslationInput, right.mainTranslationInput].filter(Boolean);
  const secondaryInputs = [left.secondaryTranslationInput, right.secondaryTranslationInput].filter(Boolean);

  return {
    ...left,
    end: Math.max(left.end, right.end),
    en,
    mainNeedsTranslation,
    secondaryNeedsTranslation,
    mainTranslationInput: mainNeedsTranslation ? en : mainInputs.join(' ') || en,
    secondaryTranslationInput: secondaryNeedsTranslation ? en : secondaryInputs.join(' ') || en,
    mainText: mainNeedsTranslation ? PENDING : en,
    vi: secondaryNeedsTranslation ? PENDING : (translatedParts.join(' ') || en),
  };
}

function mergeShortTranscriptLines(cues) {
  const merged = [];
  for (let i = 0; i < cues.length; i++) {
    let current = cues[i];
    while (transcriptLineWordCount(current) < MIN_TRANSCRIPT_LINE_WORDS && i + 1 < cues.length) {
      const next = cues[i + 1];
      if (!canMergeTranscriptLines(current, next)) break;
      current = mergeTranscriptLines(current, next);
      i++;
    }
    merged.push(current);
  }

  // If the final short line cannot merge forward, try to attach it to preceding lines.
  while (merged.length > 1 && transcriptLineWordCount(merged[merged.length - 1]) < MIN_TRANSCRIPT_LINE_WORDS) {
    const lastIndex = merged.length - 1;
    if (!canMergeTranscriptLines(merged[lastIndex - 1], merged[lastIndex])) break;
    merged[lastIndex - 1] = mergeTranscriptLines(merged[lastIndex - 1], merged[lastIndex]);
    merged.pop();
  }
  return merged.map((cue, index) => ({ ...cue, id:index }));
}

function resegmentBySentence(cues) {
  const sentences = [];
  let buf = null;

  for (const cue of cues) {
    const sourceText = cleanSentenceSegmentText(cue.en);
    if (!sourceText) continue;
    const cleanedCue = { ...cue, en:sourceText };
    const sourcePieces = splitCueText(cleanedCue, sourceText);
    const originalTranslation = String(cue.vi || '').trim();
    const translatedText = originalTranslation === PENDING
      ? PENDING
      : cleanSentenceSegmentText(originalTranslation);
    const translatedPieces = translatedText && translatedText !== PENDING
      ? splitCueText(cleanedCue, translatedText)
      : [];
    for (let pieceIndex = 0; pieceIndex < sourcePieces.length; pieceIndex++) {
      const piece = sourcePieces[pieceIndex];
      if (!buf) buf = { ...cleanedCue, vi:translatedText, start:piece.start, end:piece.end, text:'', translatedText:'', lastTranslatedPiece:'' };
      buf.text = (buf.text + ' ' + piece.text).trim();
      buf.end = piece.end;
      const translatedPiece = translatedPieces.length === sourcePieces.length
        ? translatedPieces[pieceIndex].text
        : pieceIndex === 0 ? translatedText : '';
      if (translatedPiece && translatedPiece !== buf.lastTranslatedPiece) {
        buf.translatedText = (buf.translatedText + ' ' + translatedPiece).trim();
        buf.lastTranslatedPiece = translatedPiece;
      }

      const wordCount = buf.text.split(/\s+/).length;
      const tooLong = buf.end - buf.start > MAX_SENTENCE_SEC || wordCount > MAX_SENTENCE_WORDS;
      if (SENTENCE_END_RE.test(buf.text) || tooLong) {
        sentences.push(buf);
        buf = null;
      }
    }
  }
  if (buf && buf.text) sentences.push(buf);

  const segmented = sentences.map((s, i) => ({
    ...s,
    id: i,
    start: s.start,
    end: Math.max(s.end, s.start + 0.5),
    en: s.text,
    mainTranslationInput: s.mainNeedsTranslation ? s.text : s.mainTranslationInput,
    secondaryTranslationInput: s.secondaryNeedsTranslation ? s.text : s.secondaryTranslationInput,
    mainText: s.mainNeedsTranslation ? PENDING : s.text,
    vi: s.secondaryNeedsTranslation ? PENDING : (s.translatedText || s.vi || s.text),
  }));
  return mergeShortTranscriptLines(segmented);
}

function parseCaptions(events) {
  const list = [];
  for (const ev of events || []) {
    if (!ev.segs || ev.tStartMs == null) continue;

    const text = ev.segs.map((s) => s.utf8 || '').join('').replace(/\s+/g, ' ').trim();
    if (!text) continue;

    const start = ev.tStartMs / 1000;
    const end = start + (ev.dDurationMs || 2000) / 1000;

    // Phụ đề tự động của YouTube hay lặp lại cùng câu: gộp lại
    const prev = list[list.length - 1];
    if (prev && prev.en === text) {
      prev.end = end;
      continue;
    }

    list.push({ id: list.length, start, end, en: text, vi: 'Đang dịch...' });
  }
  return list;
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
function dedupeSentences(list) {
  const out = [];
  for (const cue of list) {
    const text = String(cue.en || '').replace(/\s+/g, ' ').trim();
    if (!text) continue;
    const prev = out[out.length - 1];
    if (prev && prev.en === text && Math.abs(prev.start - cue.start) < 1.5) {
      prev.end = Math.max(prev.end, cue.end);
      continue;
    }
    out.push({ ...cue, en: text });
  }
  return out;
}

function buildCaptions() {
  const base = dedupeSentences(settings.splitSentences ? resegmentBySentence(state.rawCues) : state.rawCues);
  state.captions = base.map((c, i) => {
    const mainNeedsTranslation = c.mainNeedsTranslation ?? state.primaryNeedsTranslation;
    const secondaryNeedsTranslation = c.secondaryNeedsTranslation ?? state.secondaryNeedsTranslation;
    const mainInput = c.mainTranslationInput || c.en;
    const secondaryInput = c.secondaryTranslationInput || c.en;
    const mainCached = mainNeedsTranslation ? state.viCache.get(translationCacheKey(mainInput, state.mainLanguage)) : null;
    const secondaryCached = secondaryNeedsTranslation ? state.viCache.get(translationCacheKey(secondaryInput, state.targetLanguage)) : null;
    return {
      ...c,
      id: i,
      start: c.start,
      end: c.end,
      en: c.en,
      mainNeedsTranslation,
      secondaryNeedsTranslation,
      mainTranslationInput: mainInput,
      secondaryTranslationInput: secondaryInput,
      mainText: mainNeedsTranslation ? (mainCached || PENDING) : (c.mainText || c.en),
      vi: secondaryNeedsTranslation ? (secondaryCached || PENDING) : (c.vi || c.en),
    };
  });
  renderTranscriptList();
  announceDictationCaptionsUpdated();
}

// ---------- Làm sạch, cửa sổ hiển thị và prefetch ----------
// Chuẩn hoá cue tải về: bỏ rỗng/sai thời gian, sắp xếp, cắt chồng lấn, gộp câu trùng liền kề.
function cleanCues(list) {
  const cleaned = [];
  for (const cue of list || []) {
    const text = String(cue?.en || '').replace(/\s+/g, ' ').trim();
    const start = Number(cue?.start);
    if (!text || !Number.isFinite(start) || start < 0) continue;
    const end = Number(cue?.end);
    cleaned.push({ ...cue, start, end: Number.isFinite(end) && end > start ? end : start + 2, en: text, vi: cue.vi || PENDING });
  }
  cleaned.sort((a, b) => a.start - b.start);
  for (let i = 0; i < cleaned.length - 1; i++) {
    const next = cleaned[i + 1];
    if (next.start > cleaned[i].start && cleaned[i].end > next.start) cleaned[i].end = next.start;
  }
  return dedupeSentences(cleaned);
}

// Chỉ dựng danh sách cho phần đã nạp (cửa sổ), không render toàn bộ video dài.
function applyLoadedWindow() {
  if (state.webStudy || !state.allCues.length) return;
  const windowCues = state.allCues.filter((cue) => loadedUntil <= 0 || cue.start < loadedUntil);
  if (!windowCues.length) return;
  state.rawCues = windowCues;
  buildCaptions();
  onTimeUpdate();
  translateWindow(Math.max(0, state.activeIdx));
}

// Khi overlay mở: nới cửa sổ tới vị trí đang phát + 10 phút (chỉ nới, không thu lại).
function extendLoadedWindow() {
  if (state.webStudy || !state.allCues.length) return;
  const video = state.videoEl || document.querySelector('video');
  const current = Number(video?.currentTime) || 0;
  const duration = Number.isFinite(video?.duration) ? video.duration : Infinity;
  const target = Math.min(duration, current + LOOKAHEAD_SECONDS);
  if (target <= loadedUntil + 5) return;
  loadedUntil = Math.max(loadedUntil, target);
  applyLoadedWindow();
}

function transcriptVariantKey() {
  return `${state.sourceLanguageSetting}:${state.targetLanguage}`;
}

function transcriptMemoryKey(videoId) {
  return `${videoId}:${transcriptVariantKey()}`;
}

function promoteTranscriptVideoInMemory(videoId) {
  const prefix = `${videoId}:`;
  for (const [key, cues] of [...transcriptCache]) {
    if (!key.startsWith(prefix)) continue;
    const trackLanguage = transcriptTrackLanguageCache.get(key) || '';
    transcriptCache.delete(key);
    transcriptTrackLanguageCache.delete(key);
    transcriptCache.set(key, cues);
    transcriptTrackLanguageCache.set(key, trackLanguage);
  }
}

function trimTranscriptMemoryCache() {
  const videoIds = [];
  for (const key of transcriptCache.keys()) {
    const videoId = key.slice(0, key.indexOf(':'));
    if (videoId && !videoIds.includes(videoId)) videoIds.push(videoId);
  }
  while (videoIds.length > TRANSCRIPT_CACHE_LIMIT) {
    const expiredVideoId = videoIds.shift();
    const prefix = `${expiredVideoId}:`;
    for (const key of [...transcriptCache.keys()]) {
      if (!key.startsWith(prefix)) continue;
      transcriptCache.delete(key);
      transcriptTrackLanguageCache.delete(key);
    }
  }
}

async function storeTranscript(videoId, cues) {
  if (!videoId || !cues.length) return;
  const variantKey = transcriptVariantKey();
  const key = `${videoId}:${variantKey}`;
  transcriptCache.delete(key);
  transcriptTrackLanguageCache.delete(key);
  transcriptCache.set(key, cues);
  transcriptTrackLanguageCache.set(key, state.captionTrackLanguage);
  promoteTranscriptVideoInMemory(videoId);
  trimTranscriptMemoryCache();

  try {
    await globalThis.LHN_MESSAGING.sendMessage({
      type: 'YOUTUBE_TRANSCRIPT_CACHE_SAVE',
      videoId,
      variantKey,
      transcript: { cues, captionTrackLanguage: state.captionTrackLanguage },
    });
  } catch (error) {
    console.warn('[keepit] Could not save video transcript cache:', error);
  }
}

function takeCachedTranscript(videoId) {
  const key = transcriptMemoryKey(videoId);
  const cached = transcriptCache.get(key);
  state.captionTrackLanguage = transcriptTrackLanguageCache.get(key) || '';
  state.primaryNeedsTranslation = !!cached?.[0]?.mainNeedsTranslation;
  state.secondaryNeedsTranslation = !!cached?.[0]?.secondaryNeedsTranslation;
  state.mainLanguage = state.sourceLanguageSetting === 'auto' ? (state.captionTrackLanguage || 'en') : state.sourceLanguageSetting;
  if (!cached?.length) return null;
  promoteTranscriptVideoInMemory(videoId);
  return cached;
}

async function getCachedTranscript(videoId) {
  const variantKey = transcriptVariantKey();
  const key = `${videoId}:${variantKey}`;
  const cached = takeCachedTranscript(videoId);
  if (cached) {
    try {
      void globalThis.LHN_MESSAGING.sendMessage({ type:'YOUTUBE_TRANSCRIPT_CACHE_TOUCH', videoId, variantKey })
        .catch(error => console.warn('[keepit] Could not touch video transcript cache:', error));
    } catch (error) {
      console.warn('[keepit] Could not touch video transcript cache:', error);
    }
    return cached;
  }

  try {
    const persisted = await globalThis.LHN_MESSAGING.sendMessage({ type:'YOUTUBE_TRANSCRIPT_CACHE_GET', videoId, variantKey });
    if (!Array.isArray(persisted?.cues) || !persisted.cues.length || key !== transcriptMemoryKey(videoId)) return null;
    transcriptCache.set(key, persisted.cues);
    transcriptTrackLanguageCache.set(key, persisted.captionTrackLanguage || '');
    promoteTranscriptVideoInMemory(videoId);
    trimTranscriptMemoryCache();
    return takeCachedTranscript(videoId);
  } catch (error) {
    console.warn('[keepit] Could not read video transcript cache:', error);
    return null;
  }
}

function schedulePrefetch(videoId) {
  if (prefetchTimer) clearTimeout(prefetchTimer);
  prefetchToken++;
  prefetchTimer = window.setTimeout(() => { void prefetchTranscript(videoId); }, 1500);
}

// Ngầm tải phụ đề khi vừa mở video; người dùng không thấy thay đổi nào trên trang.
async function prefetchTranscript(videoId) {
  if (!videoId || keepitSiteDisabled) return;
  if (document.visibilityState !== 'visible') return; // (1) chỉ prefetch khi tab đang hiển thị
  if ((failedUntil.get(videoId) || 0) > Date.now()) return; // (3) đang trong thời hạn cache lỗi
  if (state.videoId !== videoId) return;
  const token = prefetchToken;
  const cached = await getCachedTranscript(videoId);
  if (token !== prefetchToken || state.videoId !== videoId) return;
  if (cached) {
    state.allCues = cached;
    loadedUntil = Math.max(loadedUntil, PRELOAD_SECONDS);
    applyLoadedWindow();
    return;
  }
  const video = document.querySelector('video');
  if (video?.duration === Infinity) return; // livestream: không có transcript
  const reasons = [];
  const cues = await transcriptFromPlayerApi(videoId, reasons);
  if (token !== prefetchToken || state.videoId !== videoId) return;
  const cleaned = cleanCues(cues);
  if (!cleaned.length) {
    failedUntil.set(videoId, Date.now() + FAILED_CACHE_MS);
    console.info('[keepit] Prefetch chưa lấy được phụ đề, sẽ thử lại khi mở panel:', reasons.join(' | ') || 'không rõ lý do');
    return;
  }
  void storeTranscript(videoId, cleaned);
  if (token !== prefetchToken || state.videoId !== videoId) return;
  state.allCues = cleaned;
  loadedUntil = Math.max(loadedUntil, PRELOAD_SECONDS);
  applyLoadedWindow();
  console.info('[keepit] Prefetch xong:', cleaned.length, 'cue (5 phút đầu sẵn sàng)');
}

function rebuildCaptions() {
  if (state.rawCues.length === 0) return;
  state.loadingFor = null;
  buildCaptions();
  onTimeUpdate();
  translateWindow(Math.max(0, state.activeIdx));
}

// ---------- Nguồn chính: port từ youtube-transcript-api (client ANDROID + timedtext XML) ----------
// Thư viện gốc kiểm tra: baseUrl có "&exp=xpe" thì cần PO token -> không tải được, phải rơi xuống nguồn khác.
const INNERTUBE_PLAYER = 'https://www.youtube.com/youtubei/v1/player';
const INNERTUBE_CLIENT = { clientName: 'ANDROID', clientVersion: '20.10.38' };

function decodeEntities(text) {
  const named = { amp: '&', apos: "'", gt: '>', lt: '<', nbsp: ' ', quot: '"' };
  let decoded = String(text || '');
  for (let pass = 0; pass < 4; pass++) {
    const next = decoded.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, code) => {
      if (code[0] !== '#') return named[code.toLowerCase()] ?? entity;
      const number = code[1].toLowerCase() === 'x'
        ? Number.parseInt(code.slice(2), 16)
        : Number.parseInt(code.slice(1), 10);
      try { return Number.isFinite(number) ? String.fromCodePoint(number) : entity; }
      catch { return entity; }
    });
    if (next === decoded) break;
    decoded = next;
  }
  return decoded;
}

function parseTimedTextXml(xml) {
  const out = [];
  const push = (startMs, durationMs, rawText) => {
    const text = decodeEntities(rawText.replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim();
    const start = startMs / 1000;
    if (!text || !Number.isFinite(start)) return;
    const duration = Number.isFinite(durationMs) && durationMs > 0 ? durationMs / 1000 : 2;
    out.push({ start, end: start + duration, en: text, vi: 'Đang dịch...' });
  };
  let match;
  const pTag = /<p\s+t="(\d+)"(?:\s+d="(\d+)")?[^>]*>([\s\S]*?)<\/p>/g;
  while ((match = pTag.exec(xml)) !== null) push(Number(match[1]), Number(match[2] || 0), match[3]);
  if (out.length) return out;
  const textTag = /<text\s+start="([\d.]+)"(?:\s+dur="([\d.]+)")?[^>]*>([\s\S]*?)<\/text>/g;
  while ((match = textTag.exec(xml)) !== null) push(Number(match[1]) * 1000, Number(match[2] || 0) * 1000, match[3]);
  return out;
}

async function fetchTextDirect(url, init = {}) {
  const response = await fetch(url, { credentials: 'include', ...init });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

function closestCue(cues, cue) {
  let best = null;
  let bestOverlap = 0;
  let bestDistance = Infinity;
  for (const candidate of cues || []) {
    const overlap = Math.max(0, Math.min(cue.end, candidate.end) - Math.max(cue.start, candidate.start));
    const distance = Math.abs(candidate.start - cue.start);
    if (overlap > bestOverlap || (overlap === bestOverlap && distance < bestDistance)) {
      best = candidate;
      bestOverlap = overlap;
      bestDistance = distance;
    }
  }
  return bestOverlap > 0 || bestDistance <= 1.5 ? best : null;
}

async function cuesForTrack(track, reasons) {
  if (!track?.baseUrl) return [];
  const baseUrl = String(track.baseUrl).replace('&fmt=srv3', '');
  if (baseUrl.includes('&exp=xpe')) {
    reasons.push('player: track cần PO token (exp=xpe)');
    return [];
  }
  try {
    const xml = await fetchTextDirect(baseUrl);
    const cues = parseTimedTextXml(xml);
    if (!cues.length) reasons.push('player: track không có dòng nào');
    return cues;
  } catch (err) {
    reasons.push('player timedtext: ' + err.message);
    return [];
  }
}

async function captionsFromTracks(tracks, reasons, tracklist = null) {
  if (!tracks.length) return [];
  const primary = selectLanguageTrack(tracks, state.sourceLanguageSetting, tracklist);
  const secondary = selectLanguageTrack(tracks, state.targetLanguage, tracklist);
  const original = primary.original;
  const needed = [...new Set([primary.track, secondary.track, (primary.needsTranslation || secondary.needsTranslation) ? original : null].filter(Boolean))];
  const fetched = await Promise.all(needed.map(async (track) => [track, await cuesForTrack(track, reasons)]));
  const byTrack = new Map(fetched);
  const mainCues = byTrack.get(primary.track) || [];
  if (!mainCues.length) return [];
  const originalCues = byTrack.get(original) || mainCues;
  const targetCues = byTrack.get(secondary.track) || [];

  state.captionTrackLanguage = trackLanguageCode(primary.track);
  state.primaryNeedsTranslation = primary.needsTranslation;
  state.secondaryNeedsTranslation = secondary.needsTranslation;
  state.mainLanguage = state.sourceLanguageSetting === 'auto'
    ? (state.captionTrackLanguage || state.mainLanguage || 'en')
    : state.sourceLanguageSetting;
  updateSubtitleLanguageLabels();

  return mainCues.map((cue) => {
    const originalCue = closestCue(originalCues, cue) || cue;
    const targetCue = primary.track === secondary.track
      ? cue
      : closestCue(targetCues, cue);
    const translateMain = primary.needsTranslation;
    const translateSecondary = secondary.needsTranslation || !targetCue;
    return {
      ...cue,
      mainNeedsTranslation: translateMain,
      mainTranslationInput: translateMain ? originalCue.en : cue.en,
      mainText: translateMain ? PENDING : cue.en,
      secondaryNeedsTranslation: translateSecondary,
      secondaryTranslationInput: translateSecondary ? originalCue.en : '',
      vi: translateSecondary ? PENDING : targetCue.en,
    };
  });
}

async function transcriptFromPlayerApi(videoId, reasons) {
  try {
    const html = await fetchTextDirect(`https://www.youtube.com/watch?v=${videoId}`);
    const key = (html.match(/"INNERTUBE_API_KEY":\s*"([a-zA-Z0-9_-]+)"/) || [])[1];
    if (!key) { reasons.push('player: thiếu INNERTUBE_API_KEY'); return []; }
    const res = await fetch(`${INNERTUBE_PLAYER}?key=${encodeURIComponent(key)}&prettyPrint=false`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context: { client: INNERTUBE_CLIENT }, videoId }),
    });
    if (!res.ok) { reasons.push(`player: HTTP ${res.status}`); return []; }
    const data = await res.json();
    const tracklist = data?.captions?.playerCaptionsTracklistRenderer || null;
    const tracks = tracklist?.captionTracks || [];
    if (!tracks.length) { reasons.push('player: video không có caption track'); return []; }
    return await captionsFromTracks(tracks, reasons, tracklist);
  } catch (err) {
    reasons.push('player: ' + err.message);
    return [];
  }
}

async function loadCaptions() {
  if (state.webStudy) return;
  const videoId = state.videoId;
  if (!videoId) return;

  const token = ++state.loadToken;
  state.loadingFor = videoId;
  // Prefetch hoặc persistent cache trong background: hiện ngay nếu đã có.
  const cached = await getCachedTranscript(videoId);
  if (token !== state.loadToken || state.videoId !== videoId) return;
  if (cached) {
    state.allCues = cached;
    loadedUntil = Math.max(loadedUntil, PRELOAD_SECONDS);
    state.loadingFor = null;
    applyLoadedWindow();
    if (state.open) applyDefaultSubtitleDisplayMode();
    return;
  }
  state.captionTrackLanguage = '';
  state.primaryNeedsTranslation = false;
  state.secondaryNeedsTranslation = false;
  setStatus(videoT('videoLoadingSubtitles'), 'videoLoadingSubtitles');

  const reasons = [];
  try {
    // 1) Player API (client ANDROID) + timedtext XML — công thức của youtube-transcript-api,
    //    chạy fetch ngay trong content script (same-origin, có cookie phiên).
    let cues = await transcriptFromPlayerApi(videoId, reasons);
    if (token !== state.loadToken) return;

    // 2) Panel "Hiển thị bản ghi" trên trang — nguồn sạch thứ hai, đúng như bản gốc dùng dự phòng.
    if (cues.length === 0) {
      const domReasons = [];
      await openTranscriptPanel(domReasons);
      if (token !== state.loadToken) return;
      cues = captionsFromTranscriptPanel();
      if (cues.length === 0) domReasons.push('DOM: không đọc được đoạn nào');
      reasons.push(...domReasons);
    }

    // 3) timedtext từ HTML trang (bản cũ) — chỉ thử khi 1 và 2 đều trượt.
    if (cues.length === 0) {
      const tracklist = await tracksFromWatchPage(videoId, reasons);
      if (token !== state.loadToken) return;
      const tracks = tracklist?.captionTracks || [];
      if (tracks.length) {
        cues = await captionsFromTracks(tracks, reasons, tracklist);
      }
    }

    if (cues.length === 0) {
      // Cùng đường: đọc phụ đề đang hiển thị (nguồn cuối, chất lượng kém hơn).
      state.primaryNeedsTranslation = false;
      state.captionTrackLanguage = '';
      console.warn('[keepit] Không lấy được phụ đề từ player/panel/timedtext:', reasons);
      state.allCues = [];
      loadedUntil = 0;
      startLiveCaptionCapture(reasons);
      return;
    }

    if (!Object.prototype.hasOwnProperty.call(cues[0] || {}, 'mainNeedsTranslation')) {
      cues = markSingleTrackCues(cues);
    }

    const cleaned = cleanCues(cues);
    if (!cleaned.length) {
      state.allCues = [];
      loadedUntil = 0;
      startLiveCaptionCapture([...reasons, 'danh sách cue rỗng sau khi làm sạch']);
      return;
    }
    void storeTranscript(videoId, cleaned);
    state.allCues = cleaned;
    loadedUntil = Math.max(loadedUntil, Math.min(PRELOAD_SECONDS, cleaned[cleaned.length - 1].end || PRELOAD_SECONDS));
    console.info('[keepit] Nguồn phụ đề đã dùng:', cleaned.length, 'cue |', reasons.length ? reasons.join(' | ') : 'player API');
    applyLoadedWindow();
    if (state.open) applyDefaultSubtitleDisplayMode();
    state.loadingFor = null;
    translateWindow(0, token);
  } catch (err) {
    console.error('[keepit] Lỗi tải phụ đề:', err);
    if (token === state.loadToken) {
      const error = errorText([...reasons, err.message]);
      setStatus(videoT('videoCaptionLoadError', error), 'videoCaptionLoadError', error);
    }
  } finally {
    if (token === state.loadToken) {
      state.loadingFor = null;
      announceDictationCaptionsUpdated();
    }
  }
}

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

