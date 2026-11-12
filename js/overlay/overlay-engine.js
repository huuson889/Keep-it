// Overlay engine (tái cấu trúc bước 4, v3.5.195): ghép NGUYÊN VĂN từ js/overlay/view/ cũ, theo đúng thứ tự nạp cũ.
//   1. layout-mode.js — cài đặt (mặc định/gộp/khôi phục/lưu), chế độ xem, kích thước, rạp.
//   2. cc-mode.js     — chế độ phụ đề, ngôn ngữ phụ đề, hàng đợi dịch (translateOne, queueCue, translateWindow…).
//   3. touch-layout.js (chỉ phần yêu thích) — touchVideoMeta, loadTouchFavorites, setTouchFavorite… (lhnFavoriteVideos).
// Các hàm còn ghi vào markup cũ đang ẩn sẽ được gỡ ở bước 5. Giao diện đang dùng: js/overlay/ui/.

const THEATER_SUBTITLE_POSITION_SPACE = 'frame-v1';
function preferredVideoMode() {
  return ['theater', 'reading', 'combined'].includes(settings?.preferredVideoMode)
    ? settings.preferredVideoMode
    : settings?.readingMode === true ? 'reading' : 'combined';
}
function preferredLearningMode() {
  return settings?.preferredLearningMode === 'speaking' ? 'speaking' : 'typing';
}

function setVideoSidebarHidden(hidden) {
  const root = overlayEl();
  if (!root) return false;
  const wasTheaterLarge = isTheaterLargeActive(root);
  const sidebarHidden = Boolean(hidden);
  const modeChanged = root.classList.contains('te-sidebar-hidden') !== sidebarHidden;
  root.classList.toggle('te-sidebar-hidden', sidebarHidden);
  syncViewSizeClasses(root);
  const isTheaterLarge = isTheaterLargeActive(root);
  if (!wasTheaterLarge && isTheaterLarge && !settings.hideControls) {
    settings.hideControls = true;
    sizeForcedHide = true;
    saveSettings();
  } else if (wasTheaterLarge && !isTheaterLarge && sizeForcedHide) {
    restoreForcedHideControls(root);
  }
  root.classList.toggle('te-controls-hidden', Boolean(settings.hideControls || sizeForcedHide));
  if (!root.classList.contains('te-reading-mode')) {
  }
  return sidebarHidden;
}

function applyVideoDisplayMode(mode) {
  if (!['theater', 'reading', 'combined'].includes(mode) || !overlayEl()) return false;
  overlayEl().classList.remove('te-study-entry-pending');
  settings.preferredVideoMode = mode;
  settings.readingMode = mode === 'reading';
  saveSettings();
  if (globalThis.LHN_STUDY?.isOpen?.()) globalThis.LHN_STUDY.close?.({ restoreView: false });
  if (mode === 'reading') {
    setVideoSidebarHidden(false);
    setReadingMode(true);
  } else {
    setReadingMode(false);
    setVideoSidebarHidden(mode === 'theater');
  }
  return true;
}

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
      if (typeof saved.useDefaultPosition !== 'boolean') {
        const savedY = Number(saved.y);
        theaterSubtitle.useDefaultPosition = saved.y === null || saved.y === undefined || !Number.isFinite(savedY) || savedY === 82;
      }
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

function isTheaterLargeActive(root = overlayEl()) {
  return Boolean(root && !root.classList.contains('te-reading-mode')
    && !root.classList.contains('te-study-active')
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

function saveSettings() {
  const persisted = { ...settings };
  delete persisted.sizeForcedHide;
  if (sizeForcedHide && settings.hideControls) persisted.hideControls = false;
  try { browser.storage.local.set({ [SETTINGS_KEY]: persisted }); } catch {}
}

function syncViewSizeClasses(root = overlayEl()) {
  if (!root) return null;
  const viewSize = root.classList.contains('te-reading-mode') ? (settings.readingViewSize || 'M')
    : root.classList.contains('te-study-active') ? (settings.learningViewSize || 'S')
    : root.classList.contains('te-sidebar-hidden') ? (settings.theaterSize || 'M') : settings.size;
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
}

// ---------- Overlay: tạo, mở, đóng ----------
function setReadingMode(enabled, { persist = false } = {}) {
  const root = overlayEl();
  if (!root) return false;
  const active = Boolean(enabled);
  if (persist) {
    settings.readingMode = active;
    saveSettings();
  }
  pendingStudyShortcut = false;
  pendingStudyOpenImmediately = false;
  const enteringStudy = !active && globalThis.LHN_STUDY?.isOpen?.();
  const leavingTheaterLarge = root.classList.contains('te-sidebar-hidden') && root.classList.contains('size-l');
  if (enteringStudy && leavingTheaterLarge && sizeForcedHide) {
    restoreForcedHideControls(root);
  }
  if (active || root.classList.contains('te-sidebar-hidden')) {
    // Study uses its own grid; remove temporary Theater geometry without changing the saved preference.
    setVideoSidebarHidden(false);
  }
  if (active) {
    if (globalThis.LHN_STUDY?.isOpen?.()) globalThis.LHN_STUDY.close?.({ restoreView: false });
  }
  const wasReading = root.classList.contains('te-reading-mode');
  const modeChanged = wasReading !== active;
  if (modeChanged) root.classList.remove('te-reading-audio-compact');
  root.classList.toggle('te-reading-mode', active);
  applySettings();
  return active;
}

function restorePreferredReadingMode() {
  if (!state.open || pendingStudyShortcut || pendingStudyOpenImmediately
    || globalThis.LHN_STUDY?.isOpen?.()) return false;
  return applyVideoDisplayMode(preferredVideoMode());
}

// ===== 2. cc-mode =====
// Caption display modes, language policy, and shared translation queue.
let subtitleModeManuallySelectedFor = null;

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

function setSubtitleDisplayMode(mode) {
  const root = overlayEl();
  const modes = ['bilingual', 'primary', 'translation', 'hidden'];
  if (!root || !modes.includes(mode)) return false;
  modes.forEach((name) => root.classList.remove(`te-subtitle-mode-${name}`));
  root.classList.add(`te-subtitle-mode-${mode}`);
  root.classList.toggle('te-subs-hidden', mode === 'hidden');
  return true;
}

function subtitleModeContextKey() {
  return String(state.sourceType === 'web' ? webSourcePageCacheUrl() : state.sourceId || location.href || '');
}

function baseLanguageCode(language) {
  return String(language || '').trim().replace(/_/g, '-').toLowerCase().split('-')[0];
}

function defaultSubtitleDisplayMode() {
  const detectedCueLanguage = state.sourceType === 'web'
    ? (state.webSourceCueLanguageKnown ? state.webSourceDetectedLanguage : '')
    : state.sourceLanguage;
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
    refreshOverlayUiLocalization();
    if (displayChanged && state.open) applyDefaultSubtitleDisplayMode();
    return;
  }
  state.sourceLanguageSetting = sourceLanguageSetting;
  state.targetLanguageSetting = targetLanguageSetting;
  state.targetLanguage = targetLanguage;
  state.mainLanguage = sourceLanguageSetting === 'auto' ? (state.sourceLanguage || 'en') : sourceLanguageSetting;
  translationSettingsRevision++;
  translateQueue = [];
  refreshOverlayUiLocalization();
  if (state.sourceType === 'web') {
    if (state.rawCues.length) {
      const language = state.webSourceDetectedLanguage || state.sourceLanguage || state.webSourceLanguageHint;
      const refreshedCues = markWebReaderCues(state.rawCues, language);
      state.rawCues = refreshedCues; state.allCues = refreshedCues; state.captions = refreshedCues;
      state.activeIdx = -1;
      if (state.open) { renderTranscriptList(); onTimeUpdate(); }
    }
    if (state.open) applyDefaultSubtitleDisplayMode();
    return;
  }
  if (displayChanged && !sourceChanged && state.open) applyDefaultSubtitleDisplayMode();

  if ((sourceChanged || targetSettingChanged || targetChanged) && state.sourceId) {
    state.loadToken++;
    prefetchToken++;
    state.loadingFor = null;
    state.rawCues = [];
    state.allCues = [];
    state.captions = [];
    state.activeIdx = -1;
    loadedUntil = 0;
    if (state.open) loadCaptions();
    else schedulePrefetch(state.sourceId);
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
const VI_HIDDEN_KEY = 'yt-dual-hide-vi';

function isVietnameseHidden() {
  try { return localStorage.getItem(VI_HIDDEN_KEY) === '1'; } catch { return false; }
}

// ---------- Xuất phụ đề ----------

let touchFavoriteIds = new Set();

function touchFavoriteStorageKey() {
  return globalThis.LHN_CONFIG?.STORAGE_KEYS?.FAVORITE_VIDEOS || 'lhnFavoriteVideos';
}

function touchVideoId() {
  if (state?.sourceType === 'web') return '';
  return globalThis.LHN_THUMBNAILS?.youtubeVideoId?.(location.href) || '';
}

function touchFavoritePageUrl(value) {
  try {
    const url = new URL(String(value || ''));
    if (!/^https?:$/.test(url.protocol)) return '';
    url.hash = '';
    return url.href.slice(0, 2048);
  } catch { return ''; }
}

function touchFavoriteKey() {
  return touchVideoId() || (state?.sourceType === 'web' ? touchFavoritePageUrl(state.webSourceUrl || location.href) : '');
}

function touchFavoriteEntryKey(entry) {
  return entry?.videoId || entry?.url || '';
}

function touchVideoTitle() {
  const clean = (value) => String(value || '').replace(/\s+/g, ' ').replace(/\s*[-|]\s*YouTube\s*$/i, '').trim();
  const heading = clean(document.querySelector('h1.ytd-watch-metadata, ytd-watch-metadata h1, .slim-video-information-title, ytm-slim-video-metadata-section-renderer h2')?.textContent);
  const title = heading || clean(document.title);
  return /^(youtube|keepit)$/i.test(title) ? '' : title;
}

function touchVideoMeta() {
  if (!touchVideoId()) {
    const url = touchFavoritePageUrl(state?.webSourceUrl || location.href);
    let site = '';
    try { site = new URL(url).hostname; } catch {}
    const title = String(state?.webSourceTitle || document.title || '').replace(/^\s*Keepit\s*-\s*/i, '').replace(/\s+/g, ' ').trim();
    return { url, title: title.slice(0, 300), channel: site.slice(0, 200) };
  }
  const title = touchVideoTitle();
  const channel = document.querySelector('ytd-watch-metadata ytd-channel-name a, #owner ytd-channel-name a, .slim-owner-channel-name, ytm-slim-owner-renderer .slim-owner-channel-name')?.textContent?.trim() || '';
  return { title: title.slice(0, 300), channel: channel.slice(0, 200) };
}

async function loadTouchFavorites() {
  const key = touchFavoriteStorageKey();
  try {
    const stored = await globalThis.browser?.storage?.local?.get(key);
    const list = Array.isArray(stored?.[key]) ? stored[key] : [];
    touchFavoriteIds = new Set(list.map(touchFavoriteEntryKey).filter(Boolean));
  } catch { touchFavoriteIds = new Set(); }
}

async function setTouchFavorite(on) {
  const id = touchFavoriteKey();
  if (!id) return false;
  const key = touchFavoriteStorageKey();
  const stored = await globalThis.browser.storage.local.get(key);
  const list = Array.isArray(stored?.[key]) ? stored[key] : [];
  const has = list.some((entry) => touchFavoriteEntryKey(entry) === id);
  if (has !== on) {
    const rest = list.filter((entry) => touchFavoriteEntryKey(entry) !== id);
    const entry = touchVideoId() ? { videoId: id, ...touchVideoMeta(), addedAt: Date.now() } : { ...touchVideoMeta(), addedAt: Date.now() };
    const next = on ? [entry, ...rest] : rest;
    await globalThis.browser.storage.local.set({ [key]: next });
    touchFavoriteIds = new Set(next.map(touchFavoriteEntryKey).filter(Boolean));
  }
  return true;
}
