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
