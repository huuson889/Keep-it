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
  const title = menu.querySelector('.te-psheet-title');
  if (title) title.textContent = t('videoSubtitleMode');
  menu.querySelector('.te-psheet-x')?.setAttribute('aria-label', t('close'));
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

function setSubtitleModeMenuOpen(open) {
  const menu = $('te-subtitle-mode-menu');
  const trigger = $('te-subtitle-mode-trigger');
  if (!menu || !trigger) return;
  menu.hidden = !open;
  trigger.setAttribute('aria-expanded', String(open));
  if (open) placeSubtitleModeMenu();
}

// Desktop popover: shift it sideways / cap its height so it stays inside the overlay (touch layouts use the bottom sheet).
function placeSubtitleModeMenu() {
  const root = overlayEl();
  const menu = $('te-subtitle-mode-menu');
  const trigger = $('te-subtitle-mode-trigger');
  if (!root || !menu || !trigger || menu.hidden) return;
  menu.style.removeProperty('--te-sub-menu-dx');
  menu.style.removeProperty('max-height');
  if (root.classList.contains('te-touch-layout') || root.classList.contains('te-touch-theater')) return;
  const rr = root.getBoundingClientRect(), br = trigger.getBoundingClientRect();
  menu.style.maxHeight = `${Math.max(120, Math.floor(br.top - rr.top - 18))}px`;
  const mr = menu.getBoundingClientRect();
  let dx = 0;
  if (mr.right > rr.right - 8) dx = rr.right - 8 - mr.right;
  if (mr.left + dx < rr.left + 8) dx = rr.left + 8 - mr.left;
  if (dx) menu.style.setProperty('--te-sub-menu-dx', `${Math.round(dx)}px`);
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
  updateSubtitleLanguageLabels();
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

function setVietnameseHidden(v) {
  try { localStorage.setItem(VI_HIDDEN_KEY, v ? '1' : '0'); } catch {}
  applySettings();
}

function toggleVietnamese() {
  try { localStorage.setItem(VI_HIDDEN_KEY, isVietnameseHidden() ? '0' : '1'); } catch {}
  applySettings();
}

// ---------- Xuất phụ đề ----------
