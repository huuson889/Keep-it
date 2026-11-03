// Web source: Reader cues, language detection, page cache, and virtual media.
let webStudyCueSessionCache = null;
let webStudyPreparationPromise = null;
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
      stopWebThumbnailVisualizer();
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

// Tải trước phụ đề khi vừa mở video (5 phút), khi mở overlay thì giữ trước 10 phút.
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

const WEB_THUMBNAIL_LOFI_URL = 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1600&auto=format&fit=crop';
const WEB_THUMBNAIL_THEMES = [
  { id:'gold', main:'#fffbe8', secondary:'#fbbf24', glow:'rgba(251, 191, 36, 0.45)' },
  { id:'cyan', main:'#e0f2fe', secondary:'#38bdf8', glow:'rgba(56, 189, 248, 0.45)' },
  { id:'lavender', main:'#f3e8ff', secondary:'#c084fc', glow:'rgba(192, 132, 252, 0.45)' },
  { id:'white', main:'#ffffff', secondary:'#94a3b8', glow:'rgba(255, 255, 255, 0.4)' },
  { id:'rose', main:'#ffe4e6', secondary:'#fb7185', glow:'rgba(251, 113, 133, 0.45)' },
];
// Reference motion modes; Subtle Pulse is intentionally excluded.
const WEB_THUMBNAIL_MOTION_MODES = ['breathing', 'pan', 'tilt', 'static'];
const WEB_THUMBNAIL_RANDOM_EFFECTS = ['motionMode', 'motionSpeed', 'blur', 'darkness', 'particleCount', 'waveStyle', 'theme'];
const WEB_THUMBNAIL_EFFECT_MIN_DELAY_MS = 30_000;
const WEB_THUMBNAIL_EFFECT_MAX_DELAY_MS = 180_000;
const WEB_THUMBNAIL_EFFECT_TRANSITION_MS = 2_400;
// Serialize starts so independently randomized effects never transition simultaneously.
const WEB_THUMBNAIL_EFFECT_GAP_MS = WEB_THUMBNAIL_EFFECT_TRANSITION_MS + 350;
let activeWebThumbnailVisualizer = null;

function webThumbnailNow() {
  return globalThis.performance?.now?.() ?? Date.now();
}

function webThumbnailRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function webThumbnailClamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function webThumbnailEase(progress) {
  const p = webThumbnailClamp(progress, 0, 1);
  return p * p * (3 - 2 * p);
}

function webThumbnailTransitionProgress(transition, now) {
  if (!transition || transition.duration <= 0) return 1;
  return webThumbnailClamp((now - transition.startedAt) / transition.duration, 0, 1);
}

function webThumbnailScalarValue(transition, now) {
  if (!transition || transition.duration <= 0) return transition?.to || 0;
  const raw = webThumbnailTransitionProgress(transition, now);
  const progress = webThumbnailEase(raw);
  const value = transition.from + (transition.to - transition.from) * progress;
  if (raw >= 1) {
    transition.from = transition.to;
    transition.duration = 0;
    return transition.to;
  }
  return value;
}

function webThumbnailStartScalarTransition(visualizer, key, target, now) {
  const previous = visualizer.values[key];
  const from = webThumbnailScalarValue(previous, now);
  visualizer.values[key] = { from, to:target, startedAt:now, duration:WEB_THUMBNAIL_EFFECT_TRANSITION_MS };
}

function webThumbnailPickDifferent(values, current) {
  const options = values.filter(value => value !== current);
  return options[webThumbnailRandomInt(0, options.length - 1)] ?? current;
}

function webThumbnailRandomIntDifferent(min, max, current, minimumDifference = 1) {
  const options = [];
  for (let value = min; value <= max; value++) {
    if (Math.abs(value - current) >= minimumDifference) options.push(value);
  }
  return options[webThumbnailRandomInt(0, options.length - 1)] ?? webThumbnailRandomInt(min, max);
}

function webThumbnailColorChannels(value) {
  const color = String(value || '').trim();
  const hex = color.match(/^#([\da-f]{6})$/i);
  if (hex) return [parseInt(hex[1].slice(0, 2), 16), parseInt(hex[1].slice(2, 4), 16), parseInt(hex[1].slice(4, 6), 16), 1];
  const rgba = color.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i);
  return rgba ? [Number(rgba[1]), Number(rgba[2]), Number(rgba[3]), rgba[4] === undefined ? 1 : Number(rgba[4])] : [255, 255, 255, 1];
}

function webThumbnailBlendColor(from, to, progress) {
  const a = webThumbnailColorChannels(from), b = webThumbnailColorChannels(to);
  const channels = a.map((value, index) => value + (b[index] - value) * progress);
  return `rgba(${Math.round(channels[0])}, ${Math.round(channels[1])}, ${Math.round(channels[2])}, ${channels[3].toFixed(3)})`;
}

function webThumbnailCurrentTheme(visualizer, now) {
  const transition = visualizer.themeTransition;
  if (!transition) return visualizer.theme;
  const raw = webThumbnailTransitionProgress(transition, now);
  const progress = webThumbnailEase(raw);
  if (raw >= 1) {
    visualizer.theme = transition.to;
    visualizer.themeTransition = null;
    return visualizer.theme;
  }
  return {
    id:progress < 0.5 ? transition.from.id : transition.to.id,
    main:webThumbnailBlendColor(transition.from.main, transition.to.main, progress),
    secondary:webThumbnailBlendColor(transition.from.secondary, transition.to.secondary, progress),
    glow:webThumbnailBlendColor(transition.from.glow, transition.to.glow, progress),
  };
}

function webThumbnailEvaluateMotion(mode, motionTime) {
  const baseSafetyScale = 1.12;
  let dynamicScale = 1;
  let shiftX = 0;
  let shiftY = 0;
  let rotateAngle = 0;
  if (mode === 'breathing') {
    dynamicScale = 1 + Math.sin(motionTime * 0.4) * 0.05;
  } else if (mode === 'pan') {
    shiftX = Math.sin(motionTime * 0.3) * 0.03;
    shiftY = Math.cos(motionTime * 0.2) * 0.03;
  } else if (mode === 'tilt') {
    rotateAngle = Math.sin(motionTime * 0.25) * 0.02;
    dynamicScale = 1.03;
  }
  return { scale:baseSafetyScale * dynamicScale, shiftX, shiftY, rotateAngle };
}

function webThumbnailCurrentMotion(visualizer, now) {
  const motionTime = visualizer.time * webThumbnailScalarValue(visualizer.values.motionSpeed, now);
  const transition = visualizer.motionTransition;
  if (!transition) return webThumbnailEvaluateMotion(visualizer.motionMode, motionTime);
  const raw = webThumbnailTransitionProgress(transition, now);
  const progress = webThumbnailEase(raw);
  const from = webThumbnailEvaluateMotion(transition.from, motionTime);
  const to = webThumbnailEvaluateMotion(transition.to, motionTime);
  const motion = {
    scale:from.scale + (to.scale - from.scale) * progress,
    shiftX:from.shiftX + (to.shiftX - from.shiftX) * progress,
    shiftY:from.shiftY + (to.shiftY - from.shiftY) * progress,
    rotateAngle:from.rotateAngle + (to.rotateAngle - from.rotateAngle) * progress,
  };
  if (raw >= 1) {
    visualizer.motionMode = transition.to;
    visualizer.motionTransition = null;
    return to;
  }
  return motion;
}

function webThumbnailCurrentWaveTransition(visualizer, now) {
  const transition = visualizer.waveTransition;
  if (!transition) return null;
  const raw = webThumbnailTransitionProgress(transition, now);
  const progress = webThumbnailEase(raw);
  if (raw >= 1) {
    visualizer.waveStyle = transition.to;
    visualizer.waveTransition = null;
    return null;
  }
  return { from:transition.from, to:transition.to, progress };
}

function webThumbnailFinalizeCompletedTransitions(visualizer, now) {
  for (const transition of Object.values(visualizer.values)) webThumbnailScalarValue(transition, now);
  webThumbnailCurrentMotion(visualizer, now);
  webThumbnailCurrentWaveTransition(visualizer, now);
  webThumbnailCurrentTheme(visualizer, now);
}

function webThumbnailApplyRandomEffect(visualizer, key, now) {
  webThumbnailFinalizeCompletedTransitions(visualizer, now);
  if (key === 'motionMode') {
    const to = webThumbnailPickDifferent(WEB_THUMBNAIL_MOTION_MODES, visualizer.motionMode);
    visualizer.motionTransition = { from:visualizer.motionMode, to, startedAt:now, duration:WEB_THUMBNAIL_EFFECT_TRANSITION_MS };
  } else if (key === 'motionSpeed') {
    const current = webThumbnailScalarValue(visualizer.values.motionSpeed, now);
    const to = webThumbnailRandomIntDifferent(2, 30, Math.round(current * 10), 2) / 10;
    webThumbnailStartScalarTransition(visualizer, 'motionSpeed', to, now);
  } else if (key === 'blur') {
    const current = webThumbnailScalarValue(visualizer.values.blur, now);
    webThumbnailStartScalarTransition(visualizer, 'blur', webThumbnailRandomIntDifferent(0, 10, Math.round(current), 3), now);
  } else if (key === 'darkness') {
    const current = webThumbnailScalarValue(visualizer.values.darkness, now) * 100;
    webThumbnailStartScalarTransition(visualizer, 'darkness', webThumbnailRandomIntDifferent(0, 80, Math.round(current), 8) / 100, now);
  } else if (key === 'particleCount') {
    const current = webThumbnailScalarValue(visualizer.values.particleCount, now);
    webThumbnailStartScalarTransition(visualizer, 'particleCount', webThumbnailRandomIntDifferent(11, 100, Math.round(current), 8), now);
  } else if (key === 'waveStyle') {
    const to = webThumbnailRandomIntDifferent(1, 4, visualizer.waveStyle);
    visualizer.waveTransition = { from:visualizer.waveStyle, to, startedAt:now, duration:WEB_THUMBNAIL_EFFECT_TRANSITION_MS };
  } else if (key === 'theme') {
    const from = webThumbnailCurrentTheme(visualizer, now);
    const options = WEB_THUMBNAIL_THEMES.filter(theme => theme.id !== from.id);
    const to = options[webThumbnailRandomInt(0, options.length - 1)];
    visualizer.themeTransition = { from, to, startedAt:now, duration:WEB_THUMBNAIL_EFFECT_TRANSITION_MS };
  }
}

function webThumbnailNextEffectTime(visualizer, key, now) {
  const safe = candidate => [...visualizer.nextEffectTimes.entries()]
    .every(([otherKey, time]) => otherKey === key || Math.abs(candidate - time) >= WEB_THUMBNAIL_EFFECT_GAP_MS);
  for (let attempt = 0; attempt < 80; attempt++) {
    const candidate = now + webThumbnailRandomInt(WEB_THUMBNAIL_EFFECT_MIN_DELAY_MS, WEB_THUMBNAIL_EFFECT_MAX_DELAY_MS);
    if (safe(candidate)) return candidate;
  }
  const candidates = [];
  for (let delay = WEB_THUMBNAIL_EFFECT_MIN_DELAY_MS; delay <= WEB_THUMBNAIL_EFFECT_MAX_DELAY_MS; delay += 250) {
    const candidate = now + delay;
    if (safe(candidate)) candidates.push(candidate);
  }
  return candidates.length
    ? candidates[webThumbnailRandomInt(0, candidates.length - 1)]
    : now + WEB_THUMBNAIL_EFFECT_MAX_DELAY_MS;
}

function scheduleWebThumbnailEffect(visualizer, key, now = webThumbnailNow()) {
  if (!visualizer.active || activeWebThumbnailVisualizer !== visualizer) return;
  const nextAt = webThumbnailNextEffectTime(visualizer, key, now);
  visualizer.nextEffectTimes.set(key, nextAt);
  const timer = setTimeout(() => runWebThumbnailEffect(visualizer, key), Math.max(0, nextAt - webThumbnailNow()));
  visualizer.effectTimers.set(key, timer);
}

function runWebThumbnailEffect(visualizer, key) {
  if (!visualizer.active || activeWebThumbnailVisualizer !== visualizer) return;
  visualizer.effectTimers.delete(key);
  visualizer.nextEffectTimes.delete(key);
  const now = webThumbnailNow();
  const wait = Math.max(0, visualizer.nextEffectAllowedAt - now);
  if (wait > 0) {
    const nextAt = now + wait;
    visualizer.nextEffectTimes.set(key, nextAt);
    visualizer.effectTimers.set(key, setTimeout(() => runWebThumbnailEffect(visualizer, key), wait));
    return;
  }
  webThumbnailApplyRandomEffect(visualizer, key, now);
  visualizer.nextEffectAllowedAt = now + WEB_THUMBNAIL_EFFECT_GAP_MS;
  scheduleWebThumbnailEffect(visualizer, key, now);
}

function stopWebThumbnailVisualizer() {
  const visualizer = activeWebThumbnailVisualizer;
  if (!visualizer) return;
  visualizer.active = false;
  if (visualizer.frameId) cancelAnimationFrame(visualizer.frameId);
  for (const timer of visualizer.effectTimers?.values?.() || []) clearTimeout(timer);
  visualizer.effectTimers?.clear?.();
  visualizer.titleObserver?.disconnect();
  visualizer.stage.remove();
  activeWebThumbnailVisualizer = null;
}

function webThumbnailEstimatedDuration() {
  const cues = Array.isArray(state.allCues) ? state.allCues : (Array.isArray(state.captions) ? state.captions : []);
  const wordCount = cues.reduce((total, cue) => {
    const text = String(cue?.en || cue?.mainText || cue?.text || '');
    return total + (text.match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu) || []).length;
  }, 0);
  const seconds = Math.max(30, Math.round((wordCount || 150) / 165 * 60));
  const minutes = Math.floor(seconds / 60);
  const remainder = String(seconds % 60).padStart(2, '0');
  return `≈ ${String(minutes).padStart(2, '0')}:${remainder}`;
}

function getWebThumbnailWaveHeight(xIndex, time, freqShift = 1) {
  return (
    Math.sin(xIndex * 0.008 + time * 2 * freqShift) * 45 +
    Math.cos(xIndex * 0.004 - time * 1.5) * 30 +
    Math.sin(xIndex * 0.015 + time * 3) * 15
  );
}

function drawWebThumbnailWaveform(visualizer, currentWaveStyle = visualizer.waveStyle, alpha = 1) {
  const ctx = visualizer.context;
  const w = visualizer.width;
  const h = visualizer.height;
  const centerY = h * 0.78;
  const activeColorTheme = visualizer.theme;
  const globalTime = visualizer.time;

  ctx.save();
  ctx.shadowColor = activeColorTheme.glow;
  ctx.shadowBlur = 20;
  if (alpha !== 1) ctx.globalAlpha = alpha;

  if (currentWaveStyle === 1) {
    const layers = [
      { opacity: 0.2, speed: 0.8, offset: 0, heightScale: 0.6 },
      { opacity: 0.4, speed: 1.2, offset: 50, heightScale: 0.8 },
      { opacity: 0.95, speed: 1.0, offset: 0, heightScale: 1.0 },
    ];

    layers.forEach((layer) => {
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 10) {
        const waveY = centerY + getWebThumbnailWaveHeight(x, globalTime * layer.speed + layer.offset) * layer.heightScale;
        if (x === 0) ctx.lineTo(x, waveY);
        else ctx.lineTo(x, waveY);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, centerY - 80, 0, h);
      grad.addColorStop(0, activeColorTheme.main);
      grad.addColorStop(0.5, activeColorTheme.secondary);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = layer.opacity * alpha;
      ctx.fillStyle = grad;
      ctx.fill();
    });
  } else if (currentWaveStyle === 2) {
    const bars = 90;
    const barWidth = 6;
    const gap = (w - (bars * barWidth)) / (bars + 1);
    ctx.fillStyle = activeColorTheme.main;
    for (let i = 0; i < bars; i++) {
      const x = gap + i * (barWidth + gap);
      const waveVal = Math.abs(getWebThumbnailWaveHeight(i * 12, globalTime * 1.5)) + 12;
      const barHeight = waveVal * 1.8;
      const y = centerY - barHeight / 2;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, 4);
      ctx.fill();
    }
  } else if (currentWaveStyle === 3) {
    const dots = 75;
    const step = w / dots;
    for (let i = 0; i < dots; i++) {
      const x = i * step + step / 2;
      const waveVal = getWebThumbnailWaveHeight(i * 10, globalTime * 1.4);
      const y = centerY + waveVal;
      const radius = Math.max(2, (Math.abs(waveVal) / 60) * 6 + 2.5);
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = activeColorTheme.main;
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x, y + 10);
      ctx.lineTo(x, y + 35);
      ctx.strokeStyle = activeColorTheme.glow;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  } else if (currentWaveStyle === 4) {
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = activeColorTheme.main;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 8) {
      const waveY = centerY - Math.abs(getWebThumbnailWaveHeight(x, globalTime * 1.3)) * 1.2 - 5;
      if (x === 0) ctx.moveTo(x, waveY);
      else ctx.lineTo(x, waveY);
    }
    ctx.stroke();
    ctx.beginPath();
    for (let x = 0; x <= w; x += 8) {
      const waveY = centerY + Math.abs(getWebThumbnailWaveHeight(x, globalTime * 1.3)) * 1.2 + 5;
      if (x === 0) ctx.moveTo(x, waveY);
      else ctx.lineTo(x, waveY);
    }
    ctx.strokeStyle = activeColorTheme.secondary;
    ctx.stroke();
  }

  ctx.restore();
}

function drawWebThumbnailVisualizer(visualizer, timestamp) {
  if (!visualizer?.active || activeWebThumbnailVisualizer !== visualizer) return;
  const { context:ctx, width, height, stage, image } = visualizer;
  const now = Number.isFinite(timestamp) ? timestamp : webThumbnailNow();
  const elapsed = Math.min(50, Math.max(0, now - (visualizer.lastTimestamp || now)));
  visualizer.lastTimestamp = now;
  visualizer.time += 0.012;
  ctx.clearRect(0, 0, width, height);
  const motionStep = document.hidden ? 0 : elapsed / 16.67;
  const theme = webThumbnailCurrentTheme(visualizer, now);
  visualizer.theme = theme;
  stage.style.setProperty('--te-webviz-main', theme.main);
  stage.style.setProperty('--te-webviz-secondary', theme.secondary);
  stage.style.setProperty('--te-webviz-glow', theme.glow);
  stage.style.setProperty('--te-webviz-darkness', webThumbnailScalarValue(visualizer.values.darkness, now).toFixed(4));
  image.style.setProperty('--te-webviz-blur', `${webThumbnailScalarValue(visualizer.values.blur, now).toFixed(2)}px`);

  const motionState = webThumbnailCurrentMotion(visualizer, now);
  image.style.setProperty('--te-webviz-shift-x', `${(motionState.shiftX * 100).toFixed(4)}%`);
  image.style.setProperty('--te-webviz-shift-y', `${(motionState.shiftY * 100).toFixed(4)}%`);
  image.style.setProperty('--te-webviz-angle', `${motionState.rotateAngle.toFixed(6)}rad`);
  image.style.setProperty('--te-webviz-scale', motionState.scale.toFixed(5));

  const particleCount = webThumbnailScalarValue(visualizer.values.particleCount, now);
  for (let i = 0; i < visualizer.particles.length; i++) {
    const particle = visualizer.particles[i];
    particle.y -= particle.speed * motionStep;
    particle.x += Math.sin(visualizer.time + particle.phase) * 0.24 * motionStep;
    if (particle.y < -12) { particle.y = height + 12; particle.x = Math.random() * width; }
    if (particle.x < -12) particle.x = width + 12;
    if (particle.x > width + 12) particle.x = -12;
    const visibility = webThumbnailClamp(particleCount - i, 0, 1);
    if (visibility <= 0) continue;
    ctx.globalAlpha = visibility;
    ctx.fillStyle = theme.glow;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.radius * 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  const waveTransition = webThumbnailCurrentWaveTransition(visualizer, now);
  if (waveTransition) {
    if (waveTransition.progress < 1) drawWebThumbnailWaveform(visualizer, waveTransition.from, 1 - waveTransition.progress);
    if (waveTransition.progress > 0) drawWebThumbnailWaveform(visualizer, waveTransition.to, waveTransition.progress);
  } else drawWebThumbnailWaveform(visualizer);

  visualizer.frameId = requestAnimationFrame((nextTimestamp) => drawWebThumbnailVisualizer(visualizer, nextTimestamp));
}

function createWebThumbnailVisualizer(image) {
  stopWebThumbnailVisualizer();
  const stage = document.createElement('div');
  stage.className = 'te-web-thumbnail-visualizer';
  const theme = WEB_THUMBNAIL_THEMES[webThumbnailRandomInt(0, WEB_THUMBNAIL_THEMES.length - 1)];
  const blur = webThumbnailRandomInt(0, 10);
  const darkness = webThumbnailRandomInt(0, 80) / 100;
  const particleCount = webThumbnailRandomInt(11, 100);
  const waveStyle = webThumbnailRandomInt(1, 4);
  const motionMode = WEB_THUMBNAIL_MOTION_MODES[webThumbnailRandomInt(0, WEB_THUMBNAIL_MOTION_MODES.length - 1)];
  const motionSpeed = webThumbnailRandomInt(2, 30) / 10;
  const now = webThumbnailNow();
  stage.style.setProperty('--te-webviz-darkness', String(darkness));
  stage.style.setProperty('--te-webviz-main', theme.main);
  stage.style.setProperty('--te-webviz-secondary', theme.secondary);
  stage.style.setProperty('--te-webviz-glow', theme.glow);
  image.classList.add('te-web-thumbnail-bg');
  image.style.setProperty('--te-webviz-blur', `${blur}px`);
  image.style.setProperty('--te-webviz-scale', '1.12');
  image.style.setProperty('--te-webviz-shift-x', '0%');
  image.style.setProperty('--te-webviz-shift-y', '0%');
  image.style.setProperty('--te-webviz-angle', '0rad');

  const shade = document.createElement('div');
  shade.className = 'te-web-thumbnail-shade';
  shade.setAttribute('aria-hidden', 'true');
  const canvas = document.createElement('canvas');
  canvas.className = 'te-web-thumbnail-canvas';
  canvas.width = 1920;
  canvas.height = 1080;
  canvas.setAttribute('aria-hidden', 'true');
  const metadata = document.createElement('div');
  metadata.className = 'te-web-thumbnail-meta';
  const artwork = document.createElement('img');
  artwork.className = 'te-web-thumbnail-art';
  artwork.alt = '';
  artwork.setAttribute('aria-hidden', 'true');
  artwork.decoding = 'async';
  const details = document.createElement('div');
  details.className = 'te-web-thumbnail-details';
  const duration = document.createElement('div');
  duration.className = 'te-web-thumbnail-duration';
  duration.textContent = `${webThumbnailEstimatedDuration()} • ${(() => {
    try { return new URL(state.webPageUrl || location.href).hostname.replace(/^www\./i, '') || 'website'; }
    catch { return 'website'; }
  })()}`;
  const title = document.createElement('div');
  title.className = 'te-web-thumbnail-title';
  const artist = document.createElement('div');
  artist.className = 'te-web-thumbnail-artist';
  artist.textContent = 'Keepit - Keep Everything For You';
  details.append(duration, title, artist);
  metadata.append(artwork, details);
  stage.append(shade, canvas, metadata);

  const updateTitle = () => {
    title.textContent = String(document.title || '').trim() || 'Web page';
    stage.setAttribute('aria-label', `${title.textContent}. Keepit - Keep Everything For You. ${duration.textContent}`);
  };
  updateTitle();
  const titleNode = document.querySelector('title') || document.head;
  const titleObserver = typeof MutationObserver === 'function' && titleNode
    ? new MutationObserver(updateTitle) : null;
  titleObserver?.observe(titleNode, { childList:true, subtree:true, characterData:true });

  const syncArtwork = () => {
    const src = image.currentSrc || image.src;
    if (src && artwork.src !== src) artwork.src = src;
  };
  image.addEventListener('load', syncArtwork);
  const context = canvas.getContext('2d', { alpha:true });
  const scalar = (value) => ({ from:value, to:value, startedAt:now, duration:0 });
  const visualizer = {
    stage, image, context, width:canvas.width, height:canvas.height, theme, themeTransition:null,
    waveStyle, waveTransition:null, motionMode, motionTransition:null, time:0,
    values:{ blur:scalar(blur), darkness:scalar(darkness), particleCount:scalar(particleCount), motionSpeed:scalar(motionSpeed) },
    lastTimestamp:0, frameId:0, active:true, titleObserver,
    effectTimers:new Map(), nextEffectTimes:new Map(), nextEffectAllowedAt:now,
    particles:Array.from({ length:100 }, () => ({
      x:Math.random() * canvas.width,
      y:Math.random() * canvas.height,
      radius:Math.random() * 4 + 1,
      speed:Math.random() * 0.8 + 0.2,
      alpha:Math.random() * 0.4 + 0.15,
      phase:Math.random() * Math.PI * 2,
    })),
  };
  activeWebThumbnailVisualizer = visualizer;
  if (context) {
    for (const effect of WEB_THUMBNAIL_RANDOM_EFFECTS) scheduleWebThumbnailEffect(visualizer, effect, now);
    visualizer.frameId = requestAnimationFrame((timestamp) => drawWebThumbnailVisualizer(visualizer, timestamp));
  }
  return { stage, visualizer, syncArtwork };
}

function attachWebMedia(media, slot) {
  if (state.videoEl && state.videoEl !== media) detachVideo();
  state.videoEl = media;
  const frame = slot.querySelector(':scope > .te-video-frame') || slot;
  const image = document.createElement('img');
  image.className = 'te-web-page-thumbnail';
  image.alt = ''; image.setAttribute('aria-hidden', 'true'); image.decoding = 'async';
  const pageUrl = state.webPageUrl || location.href;
  const thumbnails = globalThis.LHN_THUMBNAILS;
  const thumbnailUrl = thumbnails?.fromPageMetadata?.(document, pageUrl) || '';
  const { stage, syncArtwork } = createWebThumbnailVisualizer(image);
  image.addEventListener('click', handleOverlayVideoClick);
  frame.replaceChildren(image, stage);
  state.webThumbnail = image;
  if (thumbnails?.load) {
    const fallbackSvg = thumbnails.fallbackSvgUrl?.() || '';
    const onError = () => {
      const message = () => reportWebIssue('The page thumbnail and fallback image could not be loaded.', null, { level:'error' });
      if (thumbnailUrl && fallbackSvg) thumbnails.load(image, { src:fallbackSvg, onLoad:syncArtwork, onError:message });
      else message();
    };
    thumbnails.load(image, {
      src:thumbnailUrl || WEB_THUMBNAIL_LOFI_URL,
      fallbackUrl:thumbnailUrl ? WEB_THUMBNAIL_LOFI_URL : fallbackSvg,
      onLoad:syncArtwork,
      onError,
    });
  } else if (thumbnails?.fallbackSvgUrl) {
    image.src = thumbnails.fallbackSvgUrl();
  } else reportWebIssue('The shared page-thumbnail helper is unavailable.', null, { level:'error' });

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
