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
const DEFAULT_HEX = { en: '#ccff00', vi: '#ffffff', 'side-en': '#e5e7eb', 'side-vi': '#9ca3af' };
const THEATER_SUBTITLE_POSITION_SPACE = 'frame-v1';
const THEME_DEFAULT_HEX = {
  light: { en: '#ff0000', vi: '#4b5563', 'side-en': '#111827', 'side-vi': '#4b5563' },
  dark: { en: '#ffff00', vi: '#d1d5db', 'side-en': '#e5e7eb', 'side-vi': '#9ca3af' },
};
function isReadingModeActive() {
  return Boolean(overlayEl()?.classList.contains('te-reading-mode'));
}
function activeVideoSubtitleSettings() {
  return isReadingModeActive() ? settings.readingSubtitle : settings.sub;
}
function preferredVideoMode() {
  return ['theater', 'reading', 'combined'].includes(settings?.preferredVideoMode)
    ? settings.preferredVideoMode
    : settings?.readingMode === true ? 'reading' : 'combined';
}
function preferredLearningMode() {
  return settings?.preferredLearningMode === 'speaking' ? 'speaking' : 'typing';
}
function defaultColorFor(group) {
  const theme = settings?.theme === 'dark' ? 'dark' : 'light';
  const defaultGroup = !group.startsWith('side-') && isReadingModeActive() ? `side-${group}` : group;
  return THEME_DEFAULT_HEX[theme][defaultGroup] || DEFAULT_HEX[defaultGroup] || DEFAULT_HEX[group];
}

let pendingDictationShortcut = false;
let pendingDictationOpenImmediately = false;
let pendingDictationMode = 'typing';

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
  webLanguageReady: Promise.resolve(''),
  webPageUrl: '',
  webThumbnail: null,
};

function showWebToast(message) {
  let toast = document.getElementById('lhn-sidebar-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'lhn-sidebar-toast';
    toast.setAttribute('role', 'status');
    document.documentElement.appendChild(toast);
  }
  toast.textContent = String(message || 'Keepit web mode is unavailable.');
  toast.classList.add('is-visible');
  clearTimeout(toast._lhnWebToastTimer);
  toast._lhnWebToastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2600);
}

function reportWebIssue(message, error = null, { level = 'warn', toast = true } = {}) {
  const log = level === 'error' ? console.error : console.warn;
  log.call(console, '[Keepit Web]', message, error || '');
  if (toast) {
    const locale = String(state.displayLanguage || 'en').toLowerCase().split('-')[0];
    const isUnconfigured = /not configured/i.test(String(message || ''));
    const localized = {
      en: isUnconfigured ? 'This feature is not configured for web mode.' : 'Web mode encountered an error. Check the console for details.',
      vi: isUnconfigured ? 'Chức năng này chưa được cấu hình cho chế độ web.' : 'Chế độ web gặp lỗi. Xem console để biết chi tiết.',
      ko: isUnconfigured ? '이 기능은 웹 모드에서 아직 설정되지 않았습니다.' : '웹 모드에서 오류가 발생했습니다. 자세한 내용은 콘솔을 확인하세요.',
    };
    showWebToast(localized[locale] || localized.en);
  }
}

let lastWebTranslationIssueAt = 0;
function reportWebTranslationIssue(error) {
  if (!state.webStudy) return;
  const now = Date.now();
  const toast = now - lastWebTranslationIssueAt > 5000;
  lastWebTranslationIssueAt = now;
  reportWebIssue('The shared translation service failed for Reader text.', error, { level: 'error', toast });
}

function splitReaderSentences(blocks) {
  const output = [];
  const hint = String(document.documentElement.lang || document.querySelector('html[lang]')?.lang || '');
  let segmenter = null;
  try { segmenter = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter(hint || undefined, { granularity: 'sentence' }) : null; } catch {}
  for (const block of Array.isArray(blocks) ? blocks : []) {
    const text = String(block || '').replace(/\s+/gu, ' ').trim();
    if (!text) continue;
    const parts = segmenter
      ? [...segmenter.segment(text)].map((part) => part.segment.trim())
      : text.split(/(?<=[.!?。！？])\s+/u).map((part) => part.trim());
    output.push(...parts.filter(Boolean));
  }
  return output;
}

async function detectWebTtsLanguage(text, fallbackLanguage) {
  const tts = globalThis.LHN_TTS;
  const declared = String(fallbackLanguage || '').replace(/_/g, '-');
  const declaredBase = declared.split('-')[0].toLowerCase();
  if (/[\p{Script=Arabic}]/u.test(text) && ['ar', 'fa', 'ur', 'ps', 'sd'].includes(declaredBase)) return tts?.normalizeLanguage?.(declared) || declared;
  if (/[\p{Script=Cyrillic}]/u.test(text) && ['ru', 'uk', 'be', 'bg', 'sr', 'mk'].includes(declaredBase)) return tts?.normalizeLanguage?.(declared) || declared;
  if (/[\p{Script=Han}]/u.test(text) && ['ja', 'zh'].includes(declaredBase)) return tts?.normalizeLanguage?.(declared) || declared;
  const direct = tts?.detectReadLanguage?.(text);
  if (direct) return direct;
  const scriptHints = [
    [/\p{Script=Arabic}/u, 'ar-SA'], [/\p{Script=Hebrew}/u, 'he-IL'], [/\p{Script=Greek}/u, 'el-GR'],
    [/\p{Script=Armenian}/u, 'hy-AM'], [/\p{Script=Georgian}/u, 'ka-GE'], [/\p{Script=Khmer}/u, 'km-KH'],
    [/\p{Script=Lao}/u, 'lo-LA'], [/\p{Script=Myanmar}/u, 'my-MM'], [/\p{Script=Ethiopic}/u, 'am-ET'],
    [/\p{Script=Sinhala}/u, 'si-LK'], [/\p{Script=Tamil}/u, 'ta-IN'], [/\p{Script=Telugu}/u, 'te-IN'],
    [/\p{Script=Kannada}/u, 'kn-IN'], [/\p{Script=Malayalam}/u, 'ml-IN'], [/\p{Script=Gurmukhi}/u, 'pa-IN'],
  ];
  for (const [pattern, language] of scriptHints) if (pattern.test(text)) return language;
  return await tts?.detectLanguage?.(text, fallbackLanguage) || tts?.normalizeLanguage?.(fallbackLanguage) || fallbackLanguage;
}

function createWebTtsMedia(cues) {
  const listeners = new Map();
  let currentTime = 0, paused = true, playbackRate = 1, muted = false, generation = 0;
  const media = {
    videoWidth: 16, videoHeight: 9, volume: 1, controls: false,
    addEventListener(type, listener) {
      if (!listener) return;
      const set = listeners.get(type) || new Set(); set.add(listener); listeners.set(type, set);
    },
    removeEventListener(type, listener) { listeners.get(type)?.delete(listener); },
    dispatchEvent(event) {
      for (const listener of [...(listeners.get(event.type) || [])]) {
        try { typeof listener === 'function' ? listener.call(media, event) : listener.handleEvent?.(event); }
        catch (error) { reportWebIssue('The web overlay media event failed.', error, { level: 'error' }); }
      }
      return true;
    },
    get currentTime() { return currentTime; },
    set currentTime(value) {
      const next = Math.max(0, Math.min(cues.length, Number(value) || 0));
      const changed = Math.abs(next - currentTime) > 0.0001;
      currentTime = next;
      media.dispatchEvent(new Event('timeupdate'));
      if (changed && !paused) {
        generation++;
        media._cancelCurrent();
        if (next >= cues.length) { paused = true; media.dispatchEvent(new Event('pause')); return; }
        media._startCue(Math.floor(next));
      }
    },
    get duration() { return cues.length; },
    get paused() { return paused; },
    get playbackRate() { return playbackRate; },
    set playbackRate(value) {
      playbackRate = Math.max(0.5, Math.min(2, Number(value) || 1));
      media.dispatchEvent(new Event('ratechange'));
    },
    get muted() { return muted; },
    set muted(value) {
      muted = Boolean(value);
      if (media._currentAudio) media._currentAudio.muted = muted;
      media.dispatchEvent(new Event('volumechange'));
    },
    _currentAudio: null,
    _cancelCurrent() {
      try { media._currentAudio?.pause?.(); } catch {}
      media._currentAudio = null;
      try { globalThis.speechSynthesis?.cancel?.(); } catch {}
    },
    _startCue(index) {
      if (paused || index < 0 || index >= cues.length) return;
      const cue = cues[index];
      const text = String(cue?.en || '').trim();
      const token = ++generation;
      let failed = false;
      const active = () => state.webStudy && state.videoEl === media && !paused && token === generation;
      const finish = () => {
        if (!active()) return;
        if (failed) { paused = true; media.dispatchEvent(new Event('pause')); return; }
        currentTime = state.loop ? cue.start : cue.end;
        media.dispatchEvent(new Event('timeupdate'));
        const next = state.loop ? index : index + 1;
        if (next < cues.length) media._startCue(next);
        else { paused = true; media.dispatchEvent(new Event('pause')); media.dispatchEvent(new Event('ended')); }
      };
      if (!text) { finish(); return; }
      const tts = globalThis.LHN_TTS;
      if (!tts?.play || !tts?.detectLanguage) {
        reportWebIssue('The shared TTS engine is unavailable.', null, { level: 'error' });
        failed = true; finish(); return;
      }
      const fallbackLanguage = String(state.webLanguageHint || navigator.language || 'en-US');
      Promise.resolve(detectWebTtsLanguage(text, fallbackLanguage)).then((lang) => {
        if (!active()) return;
        const normalized = tts.normalizeLanguage?.(lang || fallbackLanguage) || lang || fallbackLanguage;
        const base = String(normalized).replace(/_/g, '-').split('-')[0].toLowerCase() || 'en';
        return tts.play({
          text, lang: normalized, googleLanguage: base, voice: `google-translate-default:${base}`,
          rate: () => playbackRate, isActive: active,
          setCurrent(audio) { media._currentAudio = audio; if (audio) audio.muted = muted; },
          clearCurrent() { media._currentAudio = null; },
          systemSpeak(speechText, speechLanguage, done, browserVoiceURI) {
            const synth = globalThis.speechSynthesis;
            const Utterance = globalThis.SpeechSynthesisUtterance;
            if (!synth || !Utterance) { done({ unsupported: true }); return; }
            if (muted) { done(); return; }
            const normalizeTag = (value) => String(value || '').trim().replace(/_/g, '-').toLowerCase();
            const target = normalizeTag(speechLanguage), languageBase = target.split('-')[0];
            const voices = synth.getVoices();
            const voice = voices.find((item) => item.voiceURI === browserVoiceURI)
              || voices.find((item) => normalizeTag(item.lang) === target)
              || voices.find((item) => normalizeTag(item.lang).split('-')[0] === languageBase);
            if (!voice) { done({ unsupported: true }); return; }
            const utterance = new Utterance(speechText);
            utterance.lang = voice.lang || speechLanguage;
            utterance.rate = playbackRate;
            utterance.voice = voice;
            utterance.onend = done; utterance.onerror = done;
            synth.speak(utterance);
          },
          onGoogleVoiceFailed(error) { failed = true; reportWebIssue('Google TTS failed for a web sentence.', error, { level: 'error' }); },
          onGoogleLimitReached() { reportWebIssue('Google TTS usage limit reached; trying the configured browser voice.'); },
          onGoogleAudioSlow(error) { reportWebIssue('Google TTS audio could not be loaded.', error); },
          onBrowserVoiceUnavailable(language) { failed = true; reportWebIssue(`No browser voice is available for ${language || normalized}.`, null, { level: 'error' }); },
          strictVoice: true,
          onEnd: finish,
        });
      }).catch((error) => {
        if (!active()) return;
        failed = true; reportWebIssue('Could not detect the web sentence language for TTS.', error, { level: 'error' }); finish();
      });
    },
    play() {
      if (!cues.length) { reportWebIssue('Reader has no main-text sentences to read.', null, { level: 'warn' }); return Promise.resolve(); }
      if (!paused) return Promise.resolve();
      if (currentTime >= cues.length) currentTime = 0;
      paused = false;
      media.dispatchEvent(new Event('play'));
      media._startCue(Math.min(cues.length - 1, Math.floor(currentTime)));
      return Promise.resolve();
    },
    pause() {
      if (paused) return;
      paused = true; generation++; media._cancelCurrent();
      media.dispatchEvent(new Event('pause'));
    },
  };
  return media;
}

function prepareWebStudy() {
  state.webStudy = true;
  state.webPageUrl = location.href;
  state.webLanguageHint = String(document.documentElement.lang || document.querySelector('html[lang]')?.lang || navigator.language || 'en-US');
  let blocks = [];
  try { blocks = globalThis.LHN_READER_MAIN_SOURCE?.getTextBlocks?.() || []; }
  catch (error) { reportWebIssue('Could not read the Reader main-text blocks.', error, { level: 'error' }); }
  const sentences = splitReaderSentences(blocks);
  const cues = sentences.map((text, index) => ({ id: index, start: index, end: index + 1, en: text, vi: '', mainText: text }));
  let hash = 2166136261;
  for (const char of location.href) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  state.videoId = `web-${(hash >>> 0).toString(16)}`;
  state.activeIdx = -1; state.viCache = new Map(); state.captionTrackLanguage = state.webLanguageHint;
  state.mainLanguage = state.webLanguageHint; state.webDetectedLanguage = ''; state.loadingFor = null;
  const readerCues = markWebReaderCues(cues, state.webLanguageHint);
  state.videoEl = createWebTtsMedia(readerCues);
  state.rawCues = readerCues; state.allCues = readerCues; state.captions = readerCues;
  const pageUrl = state.webPageUrl;
  state.webLanguageReady = sentences.length
    ? Promise.resolve(detectWebTtsLanguage(sentences[0], state.webLanguageHint)).then((language) => {
        const detected = globalThis.LHN_TTS?.normalizeLanguage?.(language || state.webLanguageHint) || language || state.webLanguageHint;
        if (state.webStudy && state.webPageUrl === pageUrl) {
          const previousLanguage = String(state.captionTrackLanguage || state.webLanguageHint).replace(/_/g, '-').split('-')[0].toLowerCase();
          const detectedBase = String(detected).replace(/_/g, '-').split('-')[0].toLowerCase();
          state.webDetectedLanguage = detected; state.captionTrackLanguage = detected;
          if (previousLanguage !== detectedBase) {
            translationSettingsRevision++;
            translateQueue = [];
            const refreshedCues = markWebReaderCues(state.rawCues, detectedBase);
            state.rawCues = refreshedCues; state.allCues = refreshedCues; state.captions = refreshedCues;
            state.activeIdx = -1;
            if (state.open) { renderTranscriptList(); onTimeUpdate(); }
          } else {
            state.mainLanguage = detectedBase;
            updateSubtitleLanguageLabels();
          }
        }
        return detected;
      }).catch((error) => {
        reportWebIssue('Could not detect the Reader text language for Dictation.', error, { level: 'error' });
        return state.webLanguageHint;
      })
    : Promise.resolve(state.webLanguageHint);
  state.loadToken++; loadedUntil = 0;
  if (!sentences.length) reportWebIssue('Reader did not provide any main-text sentences for this page.', null, { level: 'warn' });
  return cues.length;
}

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
  'Chế độ xem': 'videoModeSelector', 'Chế độ rạp': 'videoModeTheater', 'Chế độ đọc': 'videoModeReading', 'Chế độ kết hợp': 'videoModeCombined',
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

// ---------- Dịch lười qua module translate của Keepit ----------
// Dùng message BILINGUAL_TRANSLATE (background: LHN_TRANSLATE + LHN_CACHE) và chỉ dịch
// những cue quanh vị trí đang phát / đang xem, thay vì dịch toàn bộ danh sách ngay.
const TRANSLATE_WINDOW_AHEAD = 8;
const TRANSLATE_WINDOW_BEHIND = 2;
const TRANSLATE_CONCURRENCY = 2;
const translateInflight = new Map();
let translateQueue = [];
let translateActive = 0;
let translationSettingsRevision = 0;

function translationCacheKey(text, targetLanguage = state.targetLanguage) {
  return `${targetLanguage}:${text}`;
}

async function translateOne(text, targetLanguage = state.targetLanguage) {
  const cacheKey = translationCacheKey(text, targetLanguage);
  if (state.viCache.has(cacheKey)) return state.viCache.get(cacheKey);
  if (translateInflight.has(cacheKey)) return translateInflight.get(cacheKey);
  const job = (async () => {
    try {
      const res = await globalThis.LHN_MESSAGING.sendMessage({ type: 'BILINGUAL_TRANSLATE', text, targetLang: targetLanguage });
      const out = res?.translated || '(không dịch được)';
      if (!res?.translated) reportWebTranslationIssue(new Error('The translation response did not contain translated text.'));
      state.viCache.set(cacheKey, out);
      return out;
    } catch (error) {
      reportWebTranslationIssue(error);
      return '(không dịch được)';
    } finally {
      translateInflight.delete(cacheKey);
    }
  })();
  translateInflight.set(cacheKey, job);
  return job;
}

function pumpTranslateQueue() {
  while (translateActive < TRANSLATE_CONCURRENCY && translateQueue.length) {
    const item = translateQueue.shift();
    if (!item || item.cue[item.field] !== PENDING) continue;
    translateActive++;
    translateOne(item.text, item.targetLanguage)
      .then((translated) => {
        if (item.revision !== translationSettingsRevision || item.token !== state.loadToken) return;
        item.cue[item.field] = translated;
        if (item.token === state.loadToken) updateVietnameseRow(item.cue);
      })
      .finally(() => { translateActive--; pumpTranslateQueue(); });
  }
}

function queueCueTranslation(cue, token, field, text, targetLanguage) {
  if (!cue || cue[field] !== PENDING || !text || !targetLanguage) return;
  if (translateQueue.some((q) => q.cue === cue && q.field === field && q.targetLanguage === targetLanguage)) return;
  translateQueue.push({ cue, token, field, text, targetLanguage, revision:translationSettingsRevision });
}

function queueCue(cue, token) {
  if (!cue) return;
  if (cue.mainNeedsTranslation) queueCueTranslation(cue, token, 'mainText', cue.mainTranslationInput || cue.en, state.mainLanguage);
  if (cue.secondaryNeedsTranslation) queueCueTranslation(cue, token, 'vi', cue.secondaryTranslationInput || cue.en, state.targetLanguage);
}

function translateWindow(centerIdx, token = state.loadToken) {
  if (!state.captions.length) return;
  const index = Number.isFinite(centerIdx) ? centerIdx : 0;
  const from = Math.max(0, index - TRANSLATE_WINDOW_BEHIND);
  const to = Math.min(state.captions.length, index + TRANSLATE_WINDOW_AHEAD);
  for (let i = from; i < to; i++) queueCue(state.captions[i], token);
  pumpTranslateQueue();
}

function translateVisibleRows() {
  const list = $('te-transcript-list');
  if (!list || !state.captions.length) return;
  const top = list.scrollTop;
  const bottom = top + list.clientHeight;
  state.captions.forEach((cue, i) => {
    const row = list.querySelector(`.yt-dual-item[data-idx="${i}"]`);
    if (!row) return;
    if (row.offsetTop + row.offsetHeight >= top && row.offsetTop <= bottom) queueCue(cue, state.loadToken);
  });
  pumpTranslateQueue();
}

function updateSubtitleLanguageLabels() {
  const languages = globalThis.LHN_LANGUAGES;
  const t = (key) => languages?.t?.(key, {}, state.displayLanguage) || key;
  const fill = (picker, valueNode, menu, value, labelKey) => {
    if (!picker || !valueNode || !menu) return;
    const options = [['auto', t('autoLanguage')]];
    for (const language of languages?.LANGS || []) {
      const labelKey = { en: 'languageEnglish', vi: 'languageVietnamese', ko: 'languageKorean' }[language.code];
      options.push([language.code, `${language.flag} ${t(labelKey || language.code)}`]);
    }
    const selected = value === 'same' ? 'auto' : value;
    const selectedLabel = options.find(([code]) => code === selected)?.[1] || options[0][1];
    picker.setAttribute('aria-label', t(labelKey));
    picker.dataset.value = selected;
    valueNode.textContent = selectedLabel;
    menu.replaceChildren(...options.map(([code, label]) => {
      const option = document.createElement('button');
      option.type = 'button';
      option.className = 'te-language-picker-option';
      option.dataset.languageValue = code;
      option.setAttribute('role', 'option');
      option.setAttribute('aria-selected', String(code === selected));
      option.textContent = label;
      return option;
    }));
  };
  fill($('te-lang-source-picker'), $('te-lang-source-value'), $('te-lang-source-options'), state.sourceLanguageSetting, 'sourceLanguage');
  fill($('te-lang-target-picker'), $('te-lang-target-value'), $('te-lang-target-options'), state.targetLanguageSetting, 'targetLanguage');
  updateVideoDisplayModeLabels();
  updateSubtitleDisplayModeLabels();
}

function updateVideoDisplayModeLabels() {
  const menu = $('te-video-mode-menu');
  const trigger = $('te-video-mode-trigger');
  if (!menu || !trigger) return;
  const languages = globalThis.LHN_LANGUAGES;
  const t = (key) => languages?.t?.(key, {}, state.displayLanguage) || key;
  const keys = { theater: 'videoModeTheater', reading: 'videoModeReading', combined: 'videoModeCombined' };
  menu.querySelectorAll('[data-video-mode]').forEach((option) => {
    const label = option.querySelector('.te-video-mode-label');
    if (label) label.textContent = t(keys[option.dataset.videoMode] || 'videoModeTheater');
  });
  setVideoDisplayModeSelection(trigger.dataset.videoMode || 'theater');
}

function setVideoDisplayModeSelection(mode) {
  const trigger = $('te-video-mode-trigger');
  const menu = $('te-video-mode-menu');
  if (!trigger || !menu) return;
  const option = menu.querySelector(`[data-video-mode="${mode}"]`);
  if (!option) return;
  menu.querySelectorAll('[data-video-mode]').forEach((item) => {
    const selected = item === option;
    item.classList.toggle('is-selected', selected);
    item.setAttribute('aria-checked', String(selected));
  });
  const icon = option.querySelector('svg');
  if (icon) trigger.replaceChildren(icon.cloneNode(true));
  const label = option.querySelector('.te-video-mode-label')?.textContent || '';
  const selectorLabel = globalThis.LHN_LANGUAGES?.t?.('videoModeSelector', {}, state.displayLanguage) || 'View mode';
  trigger.dataset.videoMode = mode;
  trigger.title = `${selectorLabel}: ${label}`;
  trigger.setAttribute('aria-label', `${selectorLabel}: ${label}`);
}

function setVideoDisplayModeMenuOpen(open) {
  const menu = $('te-video-mode-menu');
  const trigger = $('te-video-mode-trigger');
  if (!menu || !trigger) return;
  menu.hidden = !open;
  trigger.setAttribute('aria-expanded', String(open));
}

function updateSubtitleDisplayModeLabels() {
  const menu = $('te-subtitle-mode-menu');
  const trigger = $('te-subtitle-mode-trigger');
  if (!menu || !trigger) return;
  const languages = globalThis.LHN_LANGUAGES;
  const t = (key) => languages?.t?.(key, {}, state.displayLanguage) || key;
  const keys = {
    bilingual: 'videoSubtitleBilingual',
    primary: 'videoSubtitlePrimary',
    translation: 'videoSubtitleTranslation',
    hidden: 'videoSubtitleHidden',
  };
  menu.querySelectorAll('[data-subtitle-mode]').forEach((option) => {
    const label = option.querySelector('.te-subtitle-mode-label');
    if (label) label.textContent = t(keys[option.dataset.subtitleMode] || 'videoSubtitleBilingual');
  });
  setSubtitleDisplayMode(trigger.dataset.subtitleMode || 'bilingual');
}

function setSubtitleDisplayMode(mode) {
  const root = overlayEl();
  const menu = $('te-subtitle-mode-menu');
  const trigger = $('te-subtitle-mode-trigger');
  const modes = ['bilingual', 'primary', 'translation', 'hidden'];
  if (!root || !menu || !trigger || !modes.includes(mode)) return false;
  modes.forEach((name) => root.classList.remove(`te-subtitle-mode-${name}`));
  root.classList.add(`te-subtitle-mode-${mode}`);
  root.classList.toggle('te-subs-hidden', mode === 'hidden');
  const option = menu.querySelector(`[data-subtitle-mode="${mode}"]`);
  menu.querySelectorAll('[data-subtitle-mode]').forEach((item) => {
    const selected = item === option;
    item.classList.toggle('is-selected', selected);
    item.setAttribute('aria-checked', String(selected));
  });
  const keys = {
    bilingual: 'videoSubtitleBilingual',
    primary: 'videoSubtitlePrimary',
    translation: 'videoSubtitleTranslation',
    hidden: 'videoSubtitleHidden',
  };
  const languages = globalThis.LHN_LANGUAGES;
  const t = (key) => languages?.t?.(key, {}, state.displayLanguage) || key;
  const label = t(keys[mode]);
  const selectorLabel = t('videoSubtitleMode');
  trigger.dataset.subtitleMode = mode;
  trigger.title = `${selectorLabel}: ${label}`;
  trigger.setAttribute('aria-label', `${selectorLabel}: ${label}`);
  return true;
}

function setSubtitleModeMenuOpen(open) {
  const menu = $('te-subtitle-mode-menu');
  const trigger = $('te-subtitle-mode-trigger');
  if (!menu || !trigger) return;
  menu.hidden = !open;
  trigger.setAttribute('aria-expanded', String(open));
}

function setVideoSidebarHidden(hidden) {
  const root = overlayEl();
  if (!root) return false;
  const wasTheaterLarge = isTheaterLargeActive(root);
  const sidebarHidden = Boolean(hidden);
  const modeChanged = root.classList.contains('te-sidebar-hidden') !== sidebarHidden;
  if (modeChanged) suppressHoverPauseForModeChange();
  root.classList.toggle('te-sidebar-hidden', sidebarHidden);
  const isTheaterLarge = isTheaterLargeActive(root);
  if (!wasTheaterLarge && isTheaterLarge && !settings.hideControls) {
    settings.hideControls = true;
    sizeForcedHide = true;
    saveSettings();
  } else if (wasTheaterLarge && !isTheaterLarge && sizeForcedHide) {
    restoreForcedHideControls(root);
  }
  root.classList.toggle('te-controls-hidden', Boolean(settings.hideControls || sizeForcedHide));
  if (root.classList.contains('te-ambient-on')) placeAmbient();
  syncTheaterFrame();
  if (!root.classList.contains('te-reading-mode')) {
    setVideoDisplayModeSelection(sidebarHidden ? 'theater' : 'combined');
  }
  scheduleHoverPauseSync({ modeChange: modeChanged });
  return sidebarHidden;
}

function applyVideoDisplayMode(mode) {
  if (!['theater', 'reading', 'combined'].includes(mode) || !overlayEl()) return false;
  overlayEl().classList.remove('te-learning-entry-pending');
  settings.preferredVideoMode = mode;
  settings.readingMode = mode === 'reading';
  saveSettings();
  if (globalThis.LHN_DICTATION?.isOpen?.()) globalThis.LHN_DICTATION.close?.({ restoreView: false });
  if (mode === 'reading') {
    setVideoSidebarHidden(false);
    setVideoLearningMode(true);
  } else {
    setVideoLearningMode(false);
    setVideoSidebarHidden(mode === 'theater');
  }
  setVideoDisplayModeSelection(mode);
  return true;
}

async function refreshSubtitleLanguageSettings() {
  let sourceLanguageSetting = state.sourceLanguageSetting;
  let targetLanguageSetting = state.targetLanguageSetting;
  let displayLanguage = state.displayLanguage || globalThis.LHN_LANGUAGES?.detectLanguage?.() || 'en';
  try {
    const settingsKey = globalThis.LHN_CONFIG?.STORAGE_KEYS?.SETTINGS || 'lhnSettings';
    const keys = [STUDY_TRANSLATION_SETTINGS_KEY, settingsKey];
    const stored = await browser.storage.local.get(keys);
    const translation = stored[STUDY_TRANSLATION_SETTINGS_KEY] || {};
    sourceLanguageSetting = ['auto', 'en', 'vi', 'ko'].includes(translation.sourceLanguage) ? translation.sourceLanguage : 'auto';
    targetLanguageSetting = ['auto', 'same', 'en', 'vi', 'ko'].includes(translation.targetLanguage) ? translation.targetLanguage : 'auto';
    const displaySettings = stored[settingsKey] || {};
    const declaredDisplayLanguage = String(displaySettings.language || '').trim().toLowerCase().replace('_', '-').split('-')[0];
    displayLanguage = globalThis.LHN_LANGUAGES?.LANGS?.some((item) => item.code === declaredDisplayLanguage)
      ? declaredDisplayLanguage
      : globalThis.LHN_LANGUAGES?.detectLanguage?.() || displayLanguage;
  } catch (error) {
    console.warn('Could not read shared subtitle language settings', error);
  }
  const targetLanguage = ['auto', 'same'].includes(targetLanguageSetting) ? displayLanguage : targetLanguageSetting;

  const sourceChanged = sourceLanguageSetting !== state.sourceLanguageSetting;
  const targetSettingChanged = targetLanguageSetting !== state.targetLanguageSetting;
  const targetChanged = targetLanguage !== state.targetLanguage;
  state.displayLanguage = displayLanguage;
  if (!sourceChanged && !targetSettingChanged && !targetChanged) {
    updateSubtitleLanguageLabels();
    refreshVideoUiLocalization();
    return;
  }
  state.sourceLanguageSetting = sourceLanguageSetting;
  state.targetLanguageSetting = targetLanguageSetting;
  state.targetLanguage = targetLanguage;
  state.mainLanguage = sourceLanguageSetting === 'auto' ? (state.captionTrackLanguage || 'en') : sourceLanguageSetting;
  translationSettingsRevision++;
  translateQueue = [];
  updateSubtitleLanguageLabels();
  refreshVideoUiLocalization();
  if (state.webStudy) {
    if (state.rawCues.length) {
      const language = state.webDetectedLanguage || state.captionTrackLanguage || state.webLanguageHint;
      const refreshedCues = markWebReaderCues(state.rawCues, language);
      state.rawCues = refreshedCues; state.allCues = refreshedCues; state.captions = refreshedCues;
      state.activeIdx = -1;
      if (state.open) { renderTranscriptList(); onTimeUpdate(); }
    }
    return;
  }

  if ((sourceChanged || targetSettingChanged || targetChanged) && state.videoId) {
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
    return;
  }

  if ((targetChanged || sourceChanged || targetSettingChanged) && state.rawCues.length) {
    const activeIndex = state.activeIdx;
    state.captions = [];
    buildCaptions();
    translateWindow(Math.max(0, activeIndex));
  }
}


// ---------- Cài đặt (mặc định ở js/core/defaults.js, lưu bằng browser.storage như các module khác) ----------
function defaultSettings() {
  return JSON.parse(JSON.stringify(globalThis.LHN_DEFAULTS.youtube));
}

function mergeSettings(d, s) {
  return {
    ...d,
    ...s,
    sub: {
      ...d.sub,
      ...(s.sub || {}),
      en: { ...d.sub.en, ...(s.sub?.en || {}) },
      vi: { ...d.sub.vi, ...(s.sub?.vi || {}) },
    },
    side: {
      en: { ...d.side.en, ...(s.side?.en || {}) },
      vi: { ...d.side.vi, ...(s.side?.vi || {}) },
    },
    readingSubtitle: {
      ...d.readingSubtitle,
      ...(s.readingSubtitle || {}),
      en: { ...d.readingSubtitle.en, ...(s.readingSubtitle?.en || {}) },
      vi: { ...d.readingSubtitle.vi, ...(s.readingSubtitle?.vi || {}) },
    },
    theaterSubtitle: (() => {
      const saved = s.theaterSubtitle || {};
      const theaterSubtitle = { ...d.theaterSubtitle, ...saved };
      if (saved.positionSpace !== THEATER_SUBTITLE_POSITION_SPACE) theaterSubtitle.positionSpace = 'viewport-v0';
      return theaterSubtitle;
    })(),
  };
}

async function restoreSettings() {
  const d = defaultSettings();
  try {
    const stored = (await browser.storage.local.get(SETTINGS_KEY))[SETTINGS_KEY];
    if (!stored) return d;
    const restored = mergeSettings(d, stored);
    const wasAutoHidden = stored.sizeForcedHide === true;
    delete restored.sizeForcedHide;
    if (wasAutoHidden) {
      restored.hideControls = false;
      try { await browser.storage.local.set({ [SETTINGS_KEY]: restored }); } catch {}
    }
    return restored;
  } catch {
    return d;
  }
}

let settings = defaultSettings();
let sizeForcedHide = false;
// Trả về nhóm màu/cỡ chữ: 'en'|'vi' (phụ đề chính) hoặc 'side-en'|'side-vi' (phụ đề thanh bên)
function groupRef(g) {
  return g.startsWith('side-') ? settings.side[g.slice(5)] : activeVideoSubtitleSettings()[g];
}

function setOrRemove(el, prop, val) {
  if (val) el.style.setProperty(prop, val);
  else el.style.removeProperty(prop);
}

function theaterSubtitleBackgroundRgba() {
  const storedHex = String(settings.theaterSubtitle?.backgroundColor || '#000000');
  const hex = /^#[0-9a-f]{6}$/i.test(storedHex) ? storedHex.slice(1) : '000000';
  const [r, g, b] = hex.match(/.{2}/g).map((channel) => parseInt(channel, 16));
  const opacity = Math.min(100, Math.max(0, Number(settings.theaterSubtitle?.opacity) || 0)) / 100;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function isTheaterLargeActive(root = overlayEl()) {
  return Boolean(root && !root.classList.contains('te-reading-mode')
    && !root.classList.contains('te-dictation-active')
    && root.classList.contains('te-sidebar-hidden') && root.classList.contains('size-l'));
}

function restoreForcedHideControls(root = overlayEl()) {
  if (!sizeForcedHide) return false;
  sizeForcedHide = false;
  settings.hideControls = false;
  saveSettings();
  root?.classList.toggle('te-controls-hidden', Boolean(settings.hideControls));
  return true;
}

function clampTheaterSubtitlePercent(value) {
  const number = Number(value);
  return Math.min(96, Math.max(4, Number.isFinite(number) ? number : 82));
}

function theaterSubtitleBounds(frameRect, panelRect, controlsRect, handleRect) {
  const safeInset = 8;
  const controlsGap = 10;
  const handleAbovePanel = handleRect ? Math.max(0, panelRect.top - handleRect.top) : 0;
  const topEdge = frameRect.top + safeInset + handleAbovePanel;
  let bottomEdge = frameRect.bottom - safeInset;
  const controlsOverlap = controlsRect && controlsRect.width > 0 && controlsRect.height > 0
    && controlsRect.left < frameRect.right && controlsRect.right > frameRect.left
    && controlsRect.top < frameRect.bottom && controlsRect.bottom > frameRect.top;
  if (controlsOverlap) bottomEdge = Math.min(bottomEdge, controlsRect.top - controlsGap);
  const maxHeight = Math.max(0, bottomEdge - topEdge);
  const panelHeight = Math.min(Math.max(0, panelRect.height), maxHeight);
  return {
    maxHeight,
    minCenter: topEdge + panelHeight / 2,
    maxCenter: bottomEdge - panelHeight / 2,
  };
}

function clampTheaterSubtitleCenter(centerY, bounds) {
  if (bounds.maxCenter < bounds.minCenter) return (bounds.minCenter + bounds.maxCenter) / 2;
  return Math.min(bounds.maxCenter, Math.max(bounds.minCenter, centerY));
}

function theaterSubtitlePercent(centerY, frameRect) {
  if (!frameRect?.height) return 82;
  return Math.round(((centerY - frameRect.top) / frameRect.height) * 1000) / 10;
}

function updateTheaterSubtitleLayout(requestedCenterY = null, root = overlayEl()) {
  if (!root) return null;
  if (!isTheaterLargeActive(root)) {
    root.style.removeProperty('--te-theater-frame-width');
    root.style.removeProperty('--te-theater-subtitle-max-width');
    root.style.removeProperty('--te-theater-subtitle-max-height');
    root.style.removeProperty('--te-theater-subtitle-top');
    return null;
  }
  const frame = ui('.te-video-frame');
  const panel = ui('.te-sub-container');
  const controls = ui('.te-control-bar');
  const handle = ui('#te-theater-subtitle-drag-handle');
  if (!frame || !panel) return null;
  const frameRect = frame.getBoundingClientRect();
  if (!(frameRect.width > 0 && frameRect.height > 0)) return null;
  root.style.setProperty('--te-theater-frame-width', `${frameRect.width}px`);
  root.style.setProperty('--te-theater-subtitle-max-width', `${Math.round(frameRect.width * 0.8)}px`);

  const controlsRect = controls?.getBoundingClientRect() || null;
  let panelRect = panel.getBoundingClientRect();
  let handleRect = handle?.getBoundingClientRect() || null;
  let bounds = theaterSubtitleBounds(frameRect, panelRect, controlsRect, handleRect);
  root.style.setProperty('--te-theater-subtitle-max-height', `${Math.floor(bounds.maxHeight)}px`);
  // Re-read after applying width/height caps so drag and automatic layout use the rendered box.
  panelRect = panel.getBoundingClientRect();
  handleRect = handle?.getBoundingClientRect() || null;
  bounds = theaterSubtitleBounds(frameRect, panelRect, controlsRect, handleRect);

  if (settings.theaterSubtitle.positionSpace !== THEATER_SUBTITLE_POSITION_SPACE) {
    const legacyCenter = clampTheaterSubtitlePercent(settings.theaterSubtitle.y) / 100 * window.innerHeight;
    settings.theaterSubtitle.y = clampTheaterSubtitlePercent(theaterSubtitlePercent(legacyCenter, frameRect));
    settings.theaterSubtitle.positionSpace = THEATER_SUBTITLE_POSITION_SPACE;
    saveSettings();
  }
  const desiredCenter = Number.isFinite(requestedCenterY)
    ? requestedCenterY
    : frameRect.top + frameRect.height * clampTheaterSubtitlePercent(settings.theaterSubtitle.y) / 100;
  const centerY = clampTheaterSubtitleCenter(desiredCenter, bounds);
  root.style.setProperty('--te-theater-subtitle-top', `${centerY}px`);
  if (Number.isFinite(requestedCenterY)) {
    settings.theaterSubtitle.y = clampTheaterSubtitlePercent(theaterSubtitlePercent(centerY, frameRect));
    settings.theaterSubtitle.positionSpace = THEATER_SUBTITLE_POSITION_SPACE;
  }
  return { frameRect, panelRect, bounds, centerY };
}

function resetTheaterSubtitlePosition(root = overlayEl()) {
  if (!isTheaterLargeActive(root)) return false;
  settings.theaterSubtitle.y = defaultSettings().theaterSubtitle.y;
  settings.theaterSubtitle.positionSpace = THEATER_SUBTITLE_POSITION_SPACE;
  updateTheaterSubtitleLayout(null, root);
  saveSettings();
  return true;
}

let theaterSubtitleLayoutRaf = 0;
let theaterSubtitleResizeObserver = null;
function scheduleTheaterSubtitleLayout(root = overlayEl()) {
  if (!root) return;
  if (!isTheaterLargeActive(root)) {
    root.style.removeProperty('--te-theater-frame-width');
    root.style.removeProperty('--te-theater-subtitle-max-width');
    root.style.removeProperty('--te-theater-subtitle-max-height');
    root.style.removeProperty('--te-theater-subtitle-top');
    return;
  }
  if (theaterSubtitleLayoutRaf) return;
  theaterSubtitleLayoutRaf = requestAnimationFrame(() => {
    theaterSubtitleLayoutRaf = 0;
    updateTheaterSubtitleLayout(null, root);
  });
}

function observeTheaterSubtitleLayout() {
  if (typeof ResizeObserver !== 'function' || theaterSubtitleResizeObserver) return;
  theaterSubtitleResizeObserver = new ResizeObserver(() => scheduleTheaterSubtitleLayout());
  for (const selector of ['.te-video-frame', '.te-sub-container', '.te-subtitle-content', '#te-theater-subtitle-drag-handle', '.te-control-bar']) {
    const element = ui(selector);
    if (element) theaterSubtitleResizeObserver.observe(element);
  }
}

function applyTheaterSubtitlePresentation(root = overlayEl()) {
  if (!root) return;
  root.style.setProperty('--te-theater-subtitle-background', theaterSubtitleBackgroundRgba());
  const colorPill = $('te-theater-subtitle-color');
  const colorPicker = colorPill?.querySelector('input[type="color"]');
  if (colorPill) colorPill.style.backgroundColor = settings.theaterSubtitle.backgroundColor || '#000000';
  if (colorPicker) colorPicker.value = settings.theaterSubtitle.backgroundColor || '#000000';
  const opacitySlider = $('te-theater-subtitle-opacity');
  const opacityValue = $('te-theater-subtitle-opacity-value');
  if (opacitySlider) opacitySlider.value = String(settings.theaterSubtitle.opacity);
  if (opacityValue) opacityValue.textContent = `${settings.theaterSubtitle.opacity}%`;
  scheduleTheaterSubtitleLayout(root);
}

function saveSettings() {
  const persisted = { ...settings };
  delete persisted.sizeForcedHide;
  if (sizeForcedHide && settings.hideControls) persisted.hideControls = false;
  try { browser.storage.local.set({ [SETTINGS_KEY]: persisted }); } catch {}
}

function updateSidebarTranscriptFontSize(root) {
  if (!root) return;
  if (root.classList.contains('te-reading-mode')) {
    // Preserve the v3.4.904 Reading defaults (18px / 16.2px), with shared scale and Reading-only controls.
    const sharedScale = settings.sub.en.pct / 100;
    root.style.setProperty('--te-side-en', (18 * sharedScale * settings.readingSubtitle.en.pct / 100) + 'px');
    root.style.setProperty('--te-side-vi', (18 * sharedScale * settings.readingSubtitle.vi.pct / 100) + 'px');
    return;
  }
  const sideFontBase = settings.size === 'S' ? 20 : settings.size === 'M' ? 18 : 16;
  const sharedScale = settings.sub.en.pct / 100;
  root.style.setProperty('--te-side-en', (sideFontBase * sharedScale * settings.side.en.pct / 100) + 'px');
  root.style.setProperty('--te-side-vi', (sideFontBase * sharedScale * settings.side.vi.pct / 100) + 'px');
}

function syncViewSizeClasses(root = overlayEl()) {
  if (!root) return null;
  const viewSize = root.classList.contains('te-reading-mode') ? (settings.readingViewSize || 'M')
    : root.classList.contains('te-dictation-active') ? (settings.learningViewSize || 'S') : settings.size;
  root.classList.toggle('size-s', viewSize === 'S');
  root.classList.toggle('size-m', viewSize === 'M');
  root.classList.toggle('size-l', viewSize !== 'S' && viewSize !== 'M');
  return viewSize;
}

function applySettings() {
  const root = overlayEl();
  if (!root) return;

  root.classList.toggle('theme-dark', settings.theme === 'dark');
  root.classList.toggle('theme-light', settings.theme !== 'dark');
  root.classList.toggle('hide-vi', isVietnameseHidden());
  syncViewSizeClasses(root);
  root.classList.toggle('te-controls-hidden', Boolean(settings.hideControls || sizeForcedHide));
  applyTheaterSubtitlePresentation(root);
  updateSidebarTranscriptFontSize(root);
  setOrRemove(root, '--te-side-en-color', settings.side.en.color);
  setOrRemove(root, '--te-side-vi-color', settings.side.vi.color);

  const enEl = $('te-sub-en-text');
  const viEl = $('te-sub-vi-text');
  const fam = settings.sub.font ? FONT_STACKS[settings.sub.font] : '';
  setOrRemove(root, '--te-subtitle-font-family', fam);
  setOrRemove(root, '--te-subtitle-en-weight', settings.sub.bold ? '700' : '');
  setOrRemove(root, '--te-subtitle-vi-weight', settings.sub.bold ? '600' : '');
  setOrRemove(root, '--te-reading-en-color', settings.readingSubtitle.en.color || defaultColorFor('side-en'));
  setOrRemove(root, '--te-reading-vi-color', settings.readingSubtitle.vi.color || defaultColorFor('side-vi'));
  enEl.style.fontSize = settings.sub.en.pct === 100 ? '' : `calc(24px * ${settings.sub.en.pct / 100})`;
  viEl.style.fontSize = settings.sub.vi.pct === 100 ? '' : `calc(24px * ${settings.sub.vi.pct / 100})`;
  enEl.style.fontWeight = settings.sub.bold ? '700' : '';
  viEl.style.fontWeight = settings.sub.bold ? '600' : '';
  enEl.style.fontFamily = fam;
  viEl.style.fontFamily = fam;
  enEl.style.color = settings.sub.en.color || '';
  viEl.style.color = settings.sub.vi.color || '';

  $('te-theme-label').textContent = videoT(settings.theme === 'dark' ? 'darkMode' : 'lightMode');

  // Đồng bộ công tắc trong menu cài đặt chính
  const mainSw = $('te-modal-main').querySelectorAll('input[type=checkbox]');
  if (mainSw[0]) mainSw[0].checked = settings.videoTranslationPopupEnabled !== false;
  if (mainSw[1]) mainSw[1].checked = settings.videoClickToSpeak !== false;
  if (mainSw[2]) mainSw[2].checked = settings.splitSentences;
  if (mainSw[4]) mainSw[4].checked = settings.hideControls;
  syncAmbientUi();

  // Đồng bộ menu "Tùy chọn phụ đề"
  const sub = $('te-modal-sub');
  const groups = sub.querySelectorAll('.te-btn-group');
  const presetIdx = PRESET_VALUES.indexOf(settings.sub.en.pct);
  groups[0].querySelectorAll('button').forEach((b, i) => b.classList.toggle('active', i === presetIdx));
  groups[1].querySelectorAll('button').forEach((b, i) => b.classList.toggle('active', i === (settings.sub.bold ? 1 : 0)));
  const modalViewSize = isReadingModeActive()
    ? (settings.readingViewSize || 'M')
    : overlayEl()?.classList.contains('te-dictation-active') ? (settings.learningViewSize || 'S') : settings.size;
  const sizeIdx = { S: 0, M: 1, L: 2 }[modalViewSize] ?? 1;
  $('te-view-mode-options').querySelectorAll('button').forEach((b, i) => b.classList.toggle('active', i === sizeIdx));
  const readingWidthHint = $('te-reading-width-hint');
  if (readingWidthHint) {
    const width = { S: 35, M: 45, L: 52 }[modalViewSize] ?? 45;
    readingWidthHint.style.display = isReadingModeActive() ? '' : 'none';
    readingWidthHint.textContent = videoT('videoReadingWidthHint', { width });
  }
  sub.querySelector('select').value = settings.sub.font || 'Inter';
  const videoSubSettings = activeVideoSubtitleSettings();
  const videoSubtitleTitle = $('te-video-subtitle-settings-title');
  if (videoSubtitleTitle) videoSubtitleTitle.textContent = isReadingModeActive()
    ? `${videoT('videoVideoSubtitles')} · ${videoT('videoModeReading')}`
    : videoT('videoVideoSubtitles');

  const counters = sub.querySelectorAll('.te-counter-btn');
  counters[0].nextElementSibling.textContent = videoSubSettings.en.pct + '%';
  counters[2].nextElementSibling.textContent = videoSubSettings.vi.pct + '%';
  ['en', 'vi'].forEach((k) => {
    const minus = sub.querySelector(`.te-counter-btn[data-group="side-${k}"][data-delta="-10"]`);
    if (minus) minus.nextElementSibling.textContent = settings.side[k].pct + '%';
  });

  sub.querySelectorAll('.te-color-pill').forEach((pill, i) => {
    const g = pill.dataset.group || ['en', 'vi', 'en', 'vi'][i];
    const color = groupRef(g).color;
    const defaultColor = defaultColorFor(g);
    pill.style.background = color || defaultColor;
    const picker = pill.querySelector('input');
    if (picker) picker.value = color || defaultColor;
  });
}

// ---------- Overlay: tạo, mở, đóng ----------
function setVideoLearningMode(enabled, { persist = false } = {}) {
  const root = overlayEl();
  if (!root) return false;
  const active = Boolean(enabled);
  if (persist) {
    settings.readingMode = active;
    saveSettings();
  }
  pendingDictationShortcut = false;
  pendingDictationOpenImmediately = false;
  const enteringDictation = !active && globalThis.LHN_DICTATION?.isOpen?.();
  const leavingTheaterLarge = root.classList.contains('te-sidebar-hidden') && root.classList.contains('size-l');
  if (enteringDictation && leavingTheaterLarge && sizeForcedHide) {
    restoreForcedHideControls(root);
  }
  if (active || root.classList.contains('te-sidebar-hidden')) {
    // Learning/Dictation uses its own grid; remove temporary Theater geometry without changing the saved preference.
    setVideoSidebarHidden(false);
  }
  if (active) {
    if (globalThis.LHN_DICTATION?.isOpen?.()) globalThis.LHN_DICTATION.close?.({ restoreView: false });
    for (const selector of ['#te-speaking-mode-btn', '#te-dictation-mode-btn']) {
      const button = root.querySelector(selector);
      button?.classList.remove('te-active');
      button?.setAttribute('aria-pressed', 'false');
    }
  }
  const wasReading = root.classList.contains('te-reading-mode');
  const modeChanged = wasReading !== active;
  if (modeChanged) suppressHoverPauseForModeChange();
  if (modeChanged) root.classList.remove('te-reading-audio-compact');
  root.classList.toggle('te-reading-mode', active);
  applySettings();
  setVideoDisplayModeSelection(active ? 'reading' : root.classList.contains('te-sidebar-hidden') ? 'theater' : 'combined');
  syncReadingAudioControls();
  scheduleHoverPauseSync({ modeChange: modeChanged });
  return active;
}

function restorePreferredReadingMode() {
  if (!state.open || pendingDictationShortcut || pendingDictationOpenImmediately
    || globalThis.LHN_DICTATION?.isOpen?.()) return false;
  return applyVideoDisplayMode(preferredVideoMode());
}

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
  window.addEventListener('resize', () => syncTheaterFrame());
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
  overlayEl()?.classList.toggle('te-web-study', state.webStudy);
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
  startAppPopupObserver();
  setVideoTitle();
  extendLoadedWindow();
  if (!state.webStudy && state.captions.length === 0 && state.loadingFor !== state.videoId) loadCaptions();
  if (state.webStudy) setSubtitleDisplayMode('primary');
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
  overlayEl()?.classList.remove('te-web-study');
  if (shadow) shadow.host.style.display = 'none';
  uiAll('.te-modal-backdrop').forEach((m) => m.classList.add('hidden'));
  state.open = false;
  syncAppPopupPause();
  stopLiveCaptionCapture();
  detachVideo();
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

function prepareWebStudyForShortcut() {
  if (/^(www\.)?youtube\.com$/i.test(location.hostname) || state.webStudy) return;
  if (state.open) closeOverlay();
  document.dispatchEvent(new CustomEvent('lhn-bilingual-reader-command', { detail: 'stop-reading' }));
  prepareWebStudy();
}

function toggleDictationFromShortcut(event) {
  if (keepitSiteDisabled) return;
  if (event?.detail?.source === 'typing-control') {
    toggleDictationTypingControl();
    return;
  }
  prepareWebStudyForShortcut();
  const dictation = globalThis.LHN_DICTATION;
  if (pendingDictationShortcut || dictation?.isOpen?.()) {
    closeOverlay();
    return;
  }
  beginDictationMode(preferredLearningMode());
}

function startWebTtsInViewMode() {
  if (!state.webStudy || !state.open || !state.videoEl?.paused) return;
  try {
    const playback = state.videoEl.play?.();
    playback?.catch?.((error) => reportWebIssue('Could not start Web TTS playback.', error, { level: 'error' }));
  } catch (error) {
    reportWebIssue('Could not start Web TTS playback.', error, { level: 'error' });
  }
}

function toggleVideoViewFromShortcut() {
  if (keepitSiteDisabled) return;
  prepareWebStudyForShortcut();
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
function syncVideoAspect(video) {
  const root = overlayEl();
  if (!root) return;
  const w = Number(video?.videoWidth) || 0;
  const h = Number(video?.videoHeight) || 0;
  if (w > 0 && h > 0) root.style.setProperty('--te-video-aspect', `${w} / ${h}`);
  else root.style.removeProperty('--te-video-aspect');
}

// Chế độ rạp: khung bọc có kích thước pixel đúng bằng video đang hiển thị (không dùng %)
function syncTheaterFrame() {
  const root = overlayEl(), slot = ui('.te-video-slot');
  const frame = slot?.querySelector(':scope > .te-video-frame');
  if (!root || !slot || !frame) return;
  const v = state.videoEl;
  const theaterActive = root.classList.contains('te-sidebar-hidden')
    && !root.classList.contains('te-reading-mode') && !root.classList.contains('te-dictation-active');
  if (!theaterActive || !v) {
    frame.style.width = '';
    frame.style.height = '';
    scheduleTheaterSubtitleLayout(root);
    return;
  }
  // Lớn: khung tính theo toàn màn hình (khung cố định), các kích thước khác theo ô video.
  const r = root.classList.contains('size-l') ? { width: innerWidth, height: innerHeight } : slot.getBoundingClientRect();
  const a = (v.videoWidth && v.videoHeight) ? v.videoWidth / v.videoHeight : 16 / 9;
  const sizeFactor = root.classList.contains('size-s') ? 2 / 3 : 1;
  const w = Math.min(r.width, r.height * a) * sizeFactor, h = w / a;
  frame.style.width = `${Math.round(w)}px`;
  frame.style.height = `${Math.round(h)}px`;
  scheduleTheaterSubtitleLayout(root);
}
function attachWebMedia(media, slot) {
  if (state.videoEl && state.videoEl !== media) detachVideo();
  state.videoEl = media;
  const frame = slot.querySelector(':scope > .te-video-frame') || slot;
  const image = document.createElement('img');
  image.className = 'te-web-page-thumbnail';
  image.alt = ''; image.setAttribute('aria-hidden', 'true'); image.decoding = 'async';
  image.style.cssText = 'position:absolute;inset:0;display:block;width:100%;height:100%;object-fit:contain;background:#111;cursor:pointer;user-select:none;';
  slot.classList.add('te-web-study-frame');
  image.addEventListener('click', handleOverlayVideoClick);
  frame.replaceChildren(image);
  state.webThumbnail = image;
  const thumbnails = globalThis.LHN_THUMBNAILS;
  const thumbnailUrl = thumbnails?.fromPageMetadata?.(document, location.href) || '';
  if (thumbnails?.loadSource) thumbnails.loadSource(image, { url: location.href, thumbnailUrl, onError:() => reportWebIssue('The page thumbnail and fallback image could not be loaded.', null, { level: 'error' }) });
  else if (thumbnails?.fallbackSvgUrl) image.src = thumbnails.fallbackSvgUrl();
  else reportWebIssue('The shared page-thumbnail helper is unavailable.', null, { level: 'error' });

  media.addEventListener('timeupdate', onTimeUpdate);
  media.addEventListener('play', handleVideoPlay);
  media.addEventListener('pause', handleVideoPause);
  media.addEventListener('ratechange', handleVideoRateChange);
  media.addEventListener('volumechange', handleVideoVolumeChange);
  state.videoGeometryHandler = () => {
    if (state.videoEl !== media) return;
    syncVideoAspect(media); syncTheaterFrame();
  };
  media.addEventListener('loadedmetadata', state.videoGeometryHandler);
  syncVideoAspect(media); syncTheaterFrame();
  syncPlayButton(); syncSpeedButton(); syncMuteButton();
  onTimeUpdate(); syncReadingAudioControls(); startAmbient();
}

function attachVideo(video, slot) {
  if (state.videoEl && state.videoEl !== video) detachVideo();
  const frame = slot.querySelector(':scope > .te-video-frame') || slot;
  if (video.parentElement !== frame) {
    state.origParent = video.parentElement;
    state.origNext = video.nextSibling;
    const wasPlaying = !video.paused;
    frame.insertBefore(video, frame.firstChild);
    if (wasPlaying) video.play().catch(() => {});
  }
  state.videoEl = video;
  video.controls = false;
  video.addEventListener('click', handleOverlayVideoClick);
  video.addEventListener('timeupdate', onTimeUpdate);
  video.addEventListener('play', handleVideoPlay);
  video.addEventListener('play', enforceVideoPause);
  video.addEventListener('pause', handleVideoPause);
  video.addEventListener('ratechange', handleVideoRateChange);
  video.addEventListener('volumechange', handleVideoVolumeChange);
  if (state.videoGeometryHandler) {
    video.removeEventListener('loadedmetadata', state.videoGeometryHandler);
    video.removeEventListener('resize', state.videoGeometryHandler);
  }
  state.videoGeometryHandler = () => {
    if (state.videoEl !== video) return;
    syncVideoAspect(video);
    syncTheaterFrame();
  };
  video.addEventListener('loadedmetadata', state.videoGeometryHandler);
  video.addEventListener('resize', state.videoGeometryHandler);
  syncVideoAspect(video);
  syncTheaterFrame();
  syncPlayButton();
  syncSpeedButton();
  syncMuteButton();
  enforceVideoPause(video);
  onTimeUpdate();
  syncReadingAudioControls();
  startAmbient();
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
    v.pause?.();
    state.webThumbnail?.removeEventListener('click', handleOverlayVideoClick);
    state.webThumbnail?.closest('.te-video-slot')?.classList.remove('te-web-study-frame');
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

function syncReadingAudioControls() {
  const root = overlayEl();
  const toggle = ui('#te-reading-video-toggle');
  const bar = ui('.te-reading-mini-audio');
  const play = ui('#te-reading-mini-play');
  if (!root || !toggle || !bar || !play) return;
  const reading = isReadingModeActive();
  const compact = reading && root.classList.contains('te-reading-audio-compact');
  toggle.disabled = !reading;
  toggle.setAttribute('aria-pressed', String(compact));
  const toggleLabel = videoT(compact ? 'dictationExpandVideo' : 'dictationCompactVideo');
  toggle.title = toggleLabel;
  toggle.setAttribute('aria-label', toggleLabel);
  const videoIcon = '<path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/>';
  const audioIcon = '<path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/>';
  toggle.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${compact ? audioIcon : videoIcon}</svg>`;
  bar.setAttribute('aria-hidden', String(!compact));
  bar.setAttribute('aria-label', videoT('dictationAudioTitle'));
  const playing = Boolean(state.videoEl && !state.videoEl.paused);
  bar.classList.toggle('playing', playing);
  const playLabel = videoT(playing ? 'dictationMiniPause' : 'dictationMiniPlay');
  play.title = playLabel;
  play.setAttribute('aria-label', playLabel);
  play.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${playing ? PAUSE_PATH : PLAY_PATH}</svg>`;
}

function setReadingAudioCompact(compact) {
  const root = overlayEl();
  if (!root || !isReadingModeActive()) return false;
  const nextCompact = Boolean(compact);
  const modeChanged = root.classList.contains('te-reading-audio-compact') !== nextCompact;
  if (modeChanged) suppressHoverPauseForModeChange();
  root.classList.toggle('te-reading-audio-compact', nextCompact);
  syncReadingAudioControls();
  scheduleHoverPauseSync({ modeChange: modeChanged });
  return nextCompact;
}

function toggleReadingAudioCompact() {
  if (!isReadingModeActive()) return false;
  return setReadingAudioCompact(!overlayEl().classList.contains('te-reading-audio-compact'));
}

// ---------- Điều khiển phát ----------
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
function findCaptionIndex(t) {
  let lo = 0;
  let hi = state.captions.length - 1;
  let ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (state.captions[mid].start <= t) {
      ans = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return ans;
}

function onTimeUpdate() {
  const v = state.videoEl;
  if (!v) return;

  const dur = v.duration || 0;
  const fill = ui('.te-progress-fill');
  if (fill) fill.style.width = dur ? `${(v.currentTime / dur) * 100}%` : '0%';

  if (state.captions.length === 0) return;

  if (!state.webStudy && state.loop && state.activeIdx >= 0) {
    const cur = state.captions[state.activeIdx];
    if (v.currentTime >= cur.end) {
      v.currentTime = cur.start;
      return;
    }
  }

  const idx = findCaptionIndex(v.currentTime);
  if (idx >= 0 && idx !== state.activeIdx) {
    setActiveCaption(idx);
    translateWindow(idx);
  }
  // Overlay đang mở: giữ cửa sổ phụ đề trước vị trí phát 10 phút.
  if (state.open && !state.webStudy) extendLoadedWindow();
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
    const target = row.offsetTop - list.clientHeight / 2 + row.offsetHeight / 2;
    // Gần thì cuộn mượt; nhảy xa (seek/mở overlay) thì đặt thẳng để không cuộn dài.
    list.scrollTo({ top: target, behavior: Math.abs(target - list.scrollTop) > list.clientHeight * 1.5 ? 'auto' : 'smooth' });
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

// ---------- Ẩn/hiện bản dịch tiếng Việt (v1.4) ----------
const VI_HIDDEN_KEY = 'yt-dual-hide-vi';

function isVietnameseHidden() {
  try { return localStorage.getItem(VI_HIDDEN_KEY) === '1'; } catch { return false; }
}

function setVietnameseHidden(v) {
  try { localStorage.setItem(VI_HIDDEN_KEY, v ? '1' : '0'); } catch {}
  applySettings();
}

function toggleVietnamese() {
  try { localStorage.setItem(VI_HIDDEN_KEY, isVietnameseHidden() ? '0' : '1'); } catch {}
  applySettings();
}

// ---------- Xuất phụ đề ----------
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
      setSubtitleDisplayMode(option.dataset.subtitleMode);
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
  // Dịch lười: khi người dùng cuộn danh sách thì dịch các dòng đang nhìn thấy.
  let scrollRaf = 0;
  $('te-transcript-list').addEventListener('scroll', () => {
    if (scrollRaf) return;
    scrollRaf = requestAnimationFrame(() => { scrollRaf = 0; translateVisibleRows(); });
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
        if (settings.size === 'L') {
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
  handler(event);
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
      setSubtitleDisplayMode(mode);
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
