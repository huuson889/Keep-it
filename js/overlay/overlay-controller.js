// Controller overlay video (điều phối)
// Tách từ js/video/dual-subtitles.js (v3.5.26). Nội dung giữ nguyên, chỉ đổi vị trí file.

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
let webStudyCueSessionCache = null;
let webStudyPreparationPromise = null;
let subtitleModeManuallySelectedFor = null;

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
  let media;
  const normalizedOffset = (value, length) => Math.max(0, Math.min(length, Number.isFinite(Number(value)) ? Math.floor(Number(value)) : 0));
  const resumeAt = run => {
    if (!run) return null;
    const offset = normalizedOffset(run.position, run.sourceText.length);
    return { index:run.index, text:run.sourceText.slice(offset), offset };
  };
  const chunkStartAt = (run, chunk) => {
    const value = String(chunk || '');
    let offset = run.requestText.indexOf(value, run.requestCursor);
    if (offset < 0) offset = run.requestCursor;
    run.requestCursor = offset + value.length;
    run.chunkStart = offset;
    return offset;
  };
  const wakeResumeWaiters = () => media._resumeWaiters.splice(0).forEach(resolve => { try { resolve(); } catch {} });

  media = {
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
      if (!changed) return;
      const shouldResume = !paused;
      generation++;
      media._resumeState = null;
      media._activeRun = null;
      media._cancelCurrent();
      if (next >= cues.length) {
        if (shouldResume) { paused = true; media.dispatchEvent(new Event('pause')); }
        return;
      }
      if (shouldResume) media._startCue(Math.floor(next));
    },
    get duration() { return cues.length; },
    get paused() { return paused; },
    get playbackRate() { return playbackRate; },
    set playbackRate(value) {
      const next = Math.max(0.5, Math.min(2, Number(value) || 1));
      const changed = Math.abs(next - playbackRate) > 0.0001;
      playbackRate = next;
      if (media._currentAudio) {
        try { media._currentAudio.playbackRate = playbackRate; } catch {}
      } else if (changed && media._currentUtterance && media._activeRun) {
        const run = media._activeRun;
        const resume = resumeAt(run);
        const shouldResume = !paused;
        generation++;
        media._activeRun = null;
        media._cancelCurrent();
        if (shouldResume) media._startCue(resume.index, resume.text, resume.offset);
        else media._resumeState = resume;
      }
      media.dispatchEvent(new Event('ratechange'));
    },
    get muted() { return muted; },
    set muted(value) {
      muted = Boolean(value);
      if (media._currentAudio) media._currentAudio.muted = muted;
      media.dispatchEvent(new Event('volumechange'));
    },
    _currentAudio: null,
    _currentUtterance: null,
    _activeRun: null,
    _resumeState: null,
    _resumeWaiters: [],
    _cancelCurrent() {
      const audio = media._currentAudio;
      media._currentAudio = null;
      media._currentUtterance = null;
      try { audio?.pause?.(); } catch {}
      try { globalThis.speechSynthesis?.cancel?.(); } catch {}
      wakeResumeWaiters();
    },
    _dispose() {
      paused = true;
      generation++;
      media._resumeState = null;
      media._activeRun = null;
      media._cancelCurrent();
    },
    _startCue(index, textOverride = null, sourceOffset = 0) {
      if (paused || index < 0 || index >= cues.length) return;
      const cue = cues[index];
      const sourceText = String(cue?.en || '').trim();
      const text = textOverride === null ? sourceText : String(textOverride || '');
      const baseOffset = normalizedOffset(sourceOffset, sourceText.length);
      const token = ++generation;
      const run = {
        token, index, cue, sourceText, requestText:text, baseOffset,
        requestCursor:0, chunkStart:0, position:baseOffset,
      };
      media._activeRun = run;
      const isCurrentRun = () => state.webStudy && state.videoEl === media && token === generation && media._activeRun === run;
      const active = () => isCurrentRun() && !paused;
      const finish = () => {
        if (!active()) return;
        if (run.failed) {
          media._activeRun = null;
          media._currentAudio = null;
          media._currentUtterance = null;
          paused = true;
          media.dispatchEvent(new Event('pause'));
          return;
        }
        currentTime = state.loop ? cue.start : cue.end;
        media.dispatchEvent(new Event('timeupdate'));
        // A Web consumer (for example Dictation's repeat counter) may seek or
        // pause synchronously from timeupdate. Do not advance this stale cue.
        if (!active()) return;
        media._activeRun = null;
        media._currentAudio = null;
        media._currentUtterance = null;
        media._resumeState = null;
        const next = state.loop ? index : index + 1;
        if (next < cues.length) media._startCue(next);
        else { paused = true; media.dispatchEvent(new Event('pause')); media.dispatchEvent(new Event('ended')); }
      };
      if (!text) { finish(); return; }
      const tts = globalThis.LHN_TTS;
      if (!tts?.play || !tts?.detectLanguage) {
        reportWebIssue('The shared TTS engine is unavailable.', null, { level: 'error' });
        run.failed = true; finish(); return;
      }
      const fallbackLanguage = String(state.webLanguageHint || navigator.language || 'en-US');
      Promise.resolve(detectWebTtsLanguage(text, fallbackLanguage)).then((lang) => {
        if (!active()) return;
        const normalized = tts.normalizeLanguage?.(lang || fallbackLanguage) || lang || fallbackLanguage;
        const base = String(normalized).replace(/_/g, '-').split('-')[0].toLowerCase() || 'en';
        return tts.play({
          text, lang: normalized, googleLanguage: base, voice: `google-translate-default:${base}`,
          rate: () => playbackRate, isActive: active,
          waitIfPaused: () => paused ? new Promise(resolve => media._resumeWaiters.push(resolve)) : null,
          onChunkStart(chunk) {
            if (isCurrentRun()) chunkStartAt(run, chunk);
          },
          onChunkEnd(chunk) {
            if (!isCurrentRun()) return;
            const offset = run.chunkStart;
            run.position = Math.max(run.position, Math.min(sourceText.length, baseOffset + offset + String(chunk || '').length));
          },
          setCurrent(audio) {
            if (!isCurrentRun()) { try { audio?.pause?.(); } catch {} return; }
            media._currentAudio = audio;
            if (audio) { audio.playbackRate = playbackRate; audio.muted = muted; }
          },
          clearCurrent() {
            if (media._activeRun === run) media._currentAudio = null;
          },
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
            const chunkOffset = run.chunkStart;
            let settled = false;
            const settle = (status, completed = false) => {
              if (settled) return;
              settled = true;
              if (isCurrentRun()) {
                if (completed) run.position = Math.max(run.position, Math.min(sourceText.length, baseOffset + chunkOffset + speechText.length));
                if (media._currentUtterance === utterance) media._currentUtterance = null;
              }
              done(status);
            };
            utterance.lang = voice.lang || speechLanguage;
            utterance.rate = playbackRate;
            utterance.voice = voice;
            utterance.onboundary = (event) => {
              if (!isCurrentRun() || !Number.isFinite(event.charIndex)) return;
              run.position = Math.max(run.position, Math.min(sourceText.length, baseOffset + chunkOffset + event.charIndex));
            };
            utterance.onend = () => settle(undefined, true);
            utterance.onerror = () => settle(undefined, true);
            media._currentUtterance = utterance;
            synth.speak(utterance);
          },
          onGoogleVoiceFailed(error) { run.failed = true; reportWebIssue('Google TTS failed for a web sentence.', error, { level: 'error' }); },
          onGoogleLimitReached() { reportWebIssue('Google TTS usage limit reached; trying the configured browser voice.'); },
          onGoogleAudioSlow(error) { reportWebIssue('Google TTS audio could not be loaded.', error); },
          onBrowserVoiceUnavailable(language) { run.failed = true; reportWebIssue(`No browser voice is available for ${language || normalized}.`, null, { level: 'error' }); },
          strictVoice: true,
          onEnd: finish,
        });
      }).catch((error) => {
        if (!active()) return;
        run.failed = true; reportWebIssue('Could not detect the web sentence language for TTS.', error, { level: 'error' }); finish();
      });
    },
    play() {
      if (!cues.length) { reportWebIssue('Reader has no main-text sentences to read.', null, { level: 'warn' }); return Promise.resolve(); }
      if (!paused) return Promise.resolve();
      if (currentTime >= cues.length && !media._resumeState) currentTime = 0;
      paused = false;
      media.dispatchEvent(new Event('play'));
      if (media._currentAudio) {
        const audio = media._currentAudio;
        try {
          const playing = audio.play?.();
          playing?.catch?.((error) => { if (media._currentAudio === audio) { try { audio.onerror?.(error); } catch {} } });
        } catch (error) { try { audio.onerror?.(error); } catch {} }
        wakeResumeWaiters();
        return Promise.resolve();
      }
      if (media._currentUtterance) {
        try { globalThis.speechSynthesis?.resume?.(); } catch {}
        wakeResumeWaiters();
        return Promise.resolve();
      }
      if (media._resumeState) {
        const resume = media._resumeState;
        media._resumeState = null;
        media._startCue(resume.index, resume.text, resume.offset);
      } else {
        media._startCue(Math.min(cues.length - 1, Math.floor(currentTime)));
      }
      wakeResumeWaiters();
      return Promise.resolve();
    },
    pause() {
      if (paused) return;
      paused = true;
      if (media._currentAudio) {
        try { media._currentAudio.pause?.(); } catch {}
      } else if (media._currentUtterance) {
        try { globalThis.speechSynthesis?.pause?.(); } catch {}
      } else {
        const run = media._activeRun;
        media._resumeState = resumeAt(run);
        generation++;
        media._activeRun = null;
        media._cancelCurrent();
      }
      media.dispatchEvent(new Event('pause'));
    },
  };
  return media;
}
function webStudyPageCacheUrl() {
  try {
    const url = new URL(location.href);
    url.hash = '';
    return url.href;
  } catch { return String(location.href || ''); }
}

function webStudyTextFingerprint(text) {
  let hash = 14695981039346656037n;
  const value = String(text || '');
  for (let index = 0; index < value.length; index++) {
    hash ^= BigInt(value.charCodeAt(index));
    hash = BigInt.asUintN(64, hash * 1099511628211n);
  }
  return `${value.length}-${hash.toString(16).padStart(16, '0')}`;
}

async function prepareWebStudy() {
  if (state.webStudy) return state.captions.length;
  if (webStudyPreparationPromise) return webStudyPreparationPromise;
  const task = prepareWebStudyFromPage();
  webStudyPreparationPromise = task;
  try { return await task; }
  finally { if (webStudyPreparationPromise === task) webStudyPreparationPromise = null; }
}

async function prepareWebStudyFromPage() {
  const pageUrl = location.href;
  const pageCacheUrl = webStudyPageCacheUrl();
  const languageHint = String(document.documentElement.lang || document.querySelector('html[lang]')?.lang || navigator.language || 'en-US');
  let sentences = null;
  let cueCacheKey = '';

  if (webStudyCueSessionCache?.document === document && webStudyCueSessionCache.pageUrl === pageCacheUrl) {
    sentences = webStudyCueSessionCache.sentences.slice();
    cueCacheKey = webStudyCueSessionCache.cacheKey;
    if (cueCacheKey && globalThis.LHN_MESSAGING?.sendMessage) {
      const sendMessage = globalThis.LHN_MESSAGING.sendMessage.bind(globalThis.LHN_MESSAGING);
      try {
        void Promise.resolve(sendMessage({ type:'WEB_STUDY_CUE_CACHE_TOUCH', cacheKey:cueCacheKey }))
          .then((touched) => touched ? true : sendMessage({
            type:'WEB_STUDY_CUE_CACHE_SAVE', cacheKey:cueCacheKey, sentences,
          }))
          .catch(error => console.warn('[Keepit Web] Cue cache touch failed.', error));
      } catch (error) { console.warn('[Keepit Web] Cue cache touch failed.', error); }
    }
  } else {
    let blocks = [];
    try { blocks = globalThis.LHN_READER_MAIN_SOURCE?.getTextBlocks?.({ forceRefresh:true }) || []; }
    catch (error) { reportWebIssue('Could not read the Reader main-text blocks.', error, { level: 'error' }); }
    const normalizedBlocks = (Array.isArray(blocks) ? blocks : [])
      .map((block) => String(block || '').replace(/\s+/gu, ' ').trim()).filter(Boolean);
    const sourceText = normalizedBlocks.join('\n');
    const sourceLanguage = String(document.documentElement.lang || languageHint || 'en-US').replace(/_/g, '-').toLowerCase();
    if (sourceText) {
      const sourceFingerprint = webStudyTextFingerprint(sourceText);
      const pageFingerprint = webStudyTextFingerprint(`${pageCacheUrl}\n${sourceLanguage}`);
      cueCacheKey = `web-study-cues:v1:${pageFingerprint}:${sourceFingerprint}`;
      try {
        const cachedSentences = await globalThis.LHN_MESSAGING?.sendMessage?.({ type:'WEB_STUDY_CUE_CACHE_GET', cacheKey:cueCacheKey });
        if (Array.isArray(cachedSentences)) {
          const cleanCached = cachedSentences.map(text => String(text || '').replace(/\s+/gu, ' ').trim()).filter(Boolean);
          if (cleanCached.length) sentences = cleanCached;
        }
      } catch (error) { console.warn('[Keepit Web] Cue cache read failed; using fresh Reader text.', error); }
    }

    if (!sentences) {
      sentences = splitReaderSentences(normalizedBlocks);
      if (cueCacheKey && sentences.length) {
        try {
          await globalThis.LHN_MESSAGING?.sendMessage?.({
            type:'WEB_STUDY_CUE_CACHE_SAVE', cacheKey:cueCacheKey, sentences,
          });
        } catch (error) { console.warn('[Keepit Web] Cue cache write failed; using in-page cue snapshot.', error); }
      }
    }

    webStudyCueSessionCache = sentences.length
      ? { document, pageUrl:pageCacheUrl, cacheKey:cueCacheKey, sentences:sentences.slice() }
      : null;
  }

  state.webStudy = true;
  state.webPageUrl = pageUrl;
  state.webLanguageHint = languageHint;
  let hash = 2166136261;
  for (const char of pageUrl) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  state.videoId = `web-${(hash >>> 0).toString(16)}`;
  state.activeIdx = -1; state.viCache = new Map(); state.captionTrackLanguage = languageHint;
  state.mainLanguage = languageHint; state.webDetectedLanguage = ''; state.webCueLanguageKnown = false; state.loadingFor = null;
  const cues = sentences.map((text, index) => ({ id:index, start:index, end:index + 1, en:text, vi:'', mainText:text }));
  const readerCues = markWebReaderCues(cues, languageHint);
  state.videoEl = createWebTtsMedia(readerCues);
  state.rawCues = readerCues; state.allCues = readerCues; state.captions = readerCues;
  const activePageUrl = state.webPageUrl;
  state.webLanguageReady = sentences.length
    ? Promise.resolve(detectWebTtsLanguage(sentences[0], languageHint)).then((language) => {
        const directLanguage = globalThis.LHN_TTS?.detectReadLanguage?.(sentences[0]);
        const detected = globalThis.LHN_TTS?.normalizeLanguage?.(language || languageHint) || language || languageHint;
        if (state.webStudy && state.webPageUrl === activePageUrl) {
          const previousLanguage = String(state.captionTrackLanguage || state.webLanguageHint).replace(/_/g, '-').split('-')[0].toLowerCase();
          const detectedBase = String(detected).replace(/_/g, '-').split('-')[0].toLowerCase();
          state.webDetectedLanguage = detected; state.captionTrackLanguage = detected;
          state.webCueLanguageKnown = Boolean(directLanguage) || baseLanguageCode(detected) !== baseLanguageCode(languageHint);
          if (state.open) applyDefaultSubtitleDisplayMode();
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
    : Promise.resolve(languageHint);
  state.loadToken++; loadedUntil = 0;
  if (!sentences.length) reportWebIssue('Reader did not provide any main-text sentences for this page.', null, { level: 'warn' });
  return cues.length;
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

function subtitleModeContextKey() {
  return String(state.webStudy ? webStudyPageCacheUrl() : state.videoId || location.href || '');
}

function baseLanguageCode(language) {
  return String(language || '').trim().replace(/_/g, '-').toLowerCase().split('-')[0];
}

function defaultSubtitleDisplayMode() {
  const detectedCueLanguage = state.webStudy
    ? (state.webCueLanguageKnown ? state.webDetectedLanguage : '')
    : state.captionTrackLanguage;
  const cueLanguage = baseLanguageCode(detectedCueLanguage);
  const displayLanguage = baseLanguageCode(state.displayLanguage);
  return cueLanguage && displayLanguage && cueLanguage === displayLanguage ? 'primary' : 'bilingual';
}

function applyDefaultSubtitleDisplayMode() {
  const contextKey = subtitleModeContextKey();
  if (contextKey && subtitleModeManuallySelectedFor === contextKey) return false;
  return setSubtitleDisplayMode(defaultSubtitleDisplayMode());
}

function setSubtitleDisplayModeByUser(mode) {
  if (!setSubtitleDisplayMode(mode)) return false;
  subtitleModeManuallySelectedFor = subtitleModeContextKey() || null;
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
  if (!sidebarHidden && !root.classList.contains('te-dictation-active')) alignActiveTranscriptFocus('auto');
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
  const displayChanged = displayLanguage !== state.displayLanguage;
  state.displayLanguage = displayLanguage;
  if (!sourceChanged && !targetSettingChanged && !targetChanged) {
    updateSubtitleLanguageLabels();
    refreshVideoUiLocalization();
    if (displayChanged && state.open) applyDefaultSubtitleDisplayMode();
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
    if (state.open) applyDefaultSubtitleDisplayMode();
    return;
  }
  if (displayChanged && !sourceChanged && state.open) applyDefaultSubtitleDisplayMode();

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
  if (modeChanged && !root.classList.contains('te-dictation-active')) alignActiveTranscriptFocus('auto');
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

function startWebTtsInViewMode() {
  if (!state.webStudy || !state.open || !state.videoEl?.paused) return;
  try {
    const playback = state.videoEl.play?.();
    playback?.catch?.((error) => reportWebIssue('Could not start Web TTS playback.', error, { level: 'error' }));
  } catch (error) {
    reportWebIssue('Could not start Web TTS playback.', error, { level: 'error' });
  }
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
