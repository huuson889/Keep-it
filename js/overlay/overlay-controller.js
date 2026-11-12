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
// YouTube video pages: desktop (www.) and mobile web (m.); both use /watch?v= and the same caption sources.
const OVERLAY_YOUTUBE_HOST_RE = /^(?:www\.|m\.)?youtube\.com$/i;
const PENDING = 'Đang dịch...';
const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
// Nhỏ, Trung bình, Lớn
const state = {
  open: false,
  sourceId: null,
  activeMedia: null,
  mediaGeometryHandler: null,
  origParent: null,
  origNext: null,
  rawCues: [],
  allCues: [],       // toàn bộ cue đã tải + làm sạch; rawCues chỉ là cửa sổ đang hiển thị
  captions: [],
  activeIdx: -1,
  transcriptFocusRatio: 0.4,
  touchTranscriptFocusRatio: 0.5, // touch layouts: ratio of the transcript list itself (default: middle)
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
  sourceLanguage: '',
  mainLanguage: 'en',
  loadToken: 0,
  loadingFor: null,
  loop: false,
  pauseReasons: new Set(),
  managedPauseMedia: null,
  popupObserver: null,
  sourceType: 'video',
  studyActivity: null,
  webSourceLanguageHint: '',
  webSourceDetectedLanguage: '',
  webSourceCueLanguageKnown: false,
  webSourceLanguageReady: Promise.resolve(''),
  webSourceUrl: '',
  webSourceThumbnail: null,
};

let savedOverlayPageScrollStyles = null;

let shadow = null; // ShadowRoot chứa toàn bộ giao diện keepit
const $ = (id) => (shadow ? shadow.getElementById(id) : null);
const overlayEl = () => $(OVERLAY_ID);
const overlayT = (key, vars = {}) => globalThis.LHN_LANGUAGES?.t?.(key, vars, state.displayLanguage) || key;

function refreshOverlayUiLocalization() {
  globalThis.LHN_UNIFIED_TEXT?.refresh?.();
  globalThis.LHN_UNIFIED_OVERLAY?.refreshTitle?.();
  const launcher = document.getElementById(LAUNCHER_ID);
  launcher?.setAttribute('title', overlayT('videoOpenKeepit'));
  launcher?.setAttribute('aria-label', overlayT('videoOpenKeepit'));
  globalThis.LHN_STUDY?.refreshLanguage?.();
  if (!overlayEl()) return false;
  applySettings();
  if (activeStatusKey) setStatus(overlayT(activeStatusKey, activeStatusVars), activeStatusKey, activeStatusVars);
  return true;
}

function pauseMediaFor(reason) {
  state.pauseReasons.add(reason);
  const media = state.activeMedia || state.managedPauseMedia;
  if (media && !media.paused) {
    state.managedPauseMedia = media;
    media.pause();
  }
}

function resumeMediaFor(reason) {
  state.pauseReasons.delete(reason);
  if (state.pauseReasons.size) return;
  const media = state.managedPauseMedia;
  state.managedPauseMedia = null;
  if (media?.paused) media.play().catch(() => {});
}

function enforceVideoPause(video) {
  if (!state.pauseReasons.size || video.paused) return;
  state.managedPauseMedia = video;
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
  if (hasVisibleAppPopup()) pauseMediaFor('app-popup');
  else {
    resumeMediaFor('app-popup');
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
  const unified = unifiedUiAvailable();
  // Unified UI (docs/ui-layout.md). OVERLAY_HTML is only the hidden state root of the engine (v3.5.197).
  shadow.innerHTML = `<style>${OVERLAY_CSS}</style>${unified ? `<style>${UNIFIED_OVERLAY_CSS}</style>` : ''}${OVERLAY_HTML}${unified ? UNIFIED_OVERLAY_HTML : ''}`;
  overlayEl().classList.add('te-hidden');
  if (unified) globalThis.LHN_UNIFIED_OVERLAY.mount(shadow, host);
  refreshOverlayUiLocalization();
  const studyApi = createStudyOverlayApi();
  document.dispatchEvent(new CustomEvent('lhn-overlay-ready', { detail: studyApi }));
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
    btn.title = overlayT('videoOpenKeepit');
    btn.setAttribute('aria-label', overlayT('videoOpenKeepit'));
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

// Mobile Chrome zooms a device-width page out when its content is wider than the screen (tuoitre: 1210px on a
// 1024px tablet), and the 100vw/100vh overlay then covers only part of the screen. While the overlay is open the
// page's viewport meta gets minimum-scale=1 (scale clamps back to 1); closing restores the page's own meta.
let savedOverlayViewportMeta = null;
function lockOverlayViewportScale() {
  if (savedOverlayViewportMeta) return;
  const meta = document.querySelector('meta[name="viewport"]');
  const content = meta?.getAttribute('content') || '';
  if (!/width\s*=\s*device-width/i.test(content) || /minimum-scale\s*=\s*1(\.0*)?(\s*[,;]|\s*$)/i.test(content)) return;
  savedOverlayViewportMeta = { meta, content };
  meta.setAttribute('content', content.replace(/,?\s*minimum-scale\s*=\s*[^,;]*/ig, '') + ', minimum-scale=1');
}
function restoreOverlayViewportScale() {
  if (!savedOverlayViewportMeta) return;
  const { meta, content } = savedOverlayViewportMeta;
  savedOverlayViewportMeta = null;
  if (meta.isConnected) meta.setAttribute('content', content);
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
  const media = state.sourceType === 'web' ? state.activeMedia : (document.querySelector('#movie_player video.html5-main-video') || document.querySelector('video.html5-main-video') || document.querySelector('video'));
  const slot = unifiedUi() ? globalThis.LHN_UNIFIED_OVERLAY.slot() : null;
  if (!media || !slot) {
    if (state.sourceType === 'web') reportWebIssue('The shared overlay could not find its media frame.', null, { level: 'error' });
    else alert(overlayT('videoNoVideoFound'));
    return;
  }
  document.documentElement.classList.add('lhn-video-overlay-open');
  hideOverlayPageScrollbar();
  lockOverlayViewportScale();
  overlayEl().classList.toggle('te-study-entry-pending', pendingStudyShortcut);
  overlayEl().classList.remove('te-hidden');
  shadow.host.style.display = '';
  state.open = true;
  restorePreferredReadingMode();
  if (state.sourceType === 'web') attachWebMedia(media, slot);
  else attachVideo(media, slot);
  if (state.sourceType === 'web') {
    if (state.captions.length) { setStatus(''); renderTranscriptList(); }
    else setStatus('');
  }
  onTimeUpdate();
  startAppPopupObserver();
  extendLoadedWindow();
  if (state.sourceType !== 'web' && state.captions.length === 0 && state.loadingFor !== state.sourceId) loadCaptions();
  applyDefaultSubtitleDisplayMode();
  if (unifiedUi()) globalThis.LHN_UNIFIED_OVERLAY.open({ tab: 'view' });
}

function closeOverlay() {
  if (unifiedUi()) globalThis.LHN_UNIFIED_OVERLAY.close();
  pendingStudyShortcut = false;
  pendingStudyOpenImmediately = false;
  pendingStudyMode = 'typing';
  globalThis.LHN_STUDY?.close?.({ restoreView: false });
  setReadingMode(false);
  overlayEl()?.classList.remove('te-study-entry-pending');
  document.documentElement.classList.remove('lhn-video-overlay-open');
  restoreOverlayPageScrollbar();
  restoreOverlayViewportScale();
  overlayEl()?.classList.add('te-hidden');
  if (shadow) shadow.host.style.display = 'none';
  state.open = false;
  syncAppPopupPause();
  stopLiveCaptionCapture();
  detachActiveMedia();
}

async function toggleOverlayViewFromShortcut() {
  if (keepitSiteDisabled) return;
  if (!OVERLAY_YOUTUBE_HOST_RE.test(location.hostname)) await prepareWebSourceForShortcut();
  const study = globalThis.LHN_STUDY;
  if (!state.open) {
    openOverlay();
    startWebTtsInViewMode();
    return;
  }
  if (pendingStudyShortcut || study?.isOpen?.()) {
    pendingStudyShortcut = false;
    pendingStudyOpenImmediately = false;
    study?.close?.({ restoreView: false });
    pendingStudyMode = 'typing';
    applyVideoDisplayMode(preferredVideoMode());
    startWebTtsInViewMode();
    return;
  }
  closeOverlay();
}

function detachActiveMedia() {
  const v = state.activeMedia;
  if (!v) return;
  if (state.sourceType === 'web') {
    v.removeEventListener('timeupdate', onTimeUpdate);
    if (typeof v._dispose === 'function') v._dispose(); else v.pause?.();
    state.webSourceThumbnail?.removeEventListener('click', handlePlayerClick);
    globalThis.LHN_THUMBNAILS?.clear?.(state.webSourceThumbnail);
    state.webSourceThumbnail?.remove();
    state.webSourceThumbnail = null;
    state.activeMedia = null; state.sourceType = 'video'; state.studyActivity = null; state.sourceId = null; state.sourceLanguage = ''; state.webSourceLanguageHint = ''; state.webSourceDetectedLanguage = ''; state.webSourceLanguageReady = Promise.resolve(''); state.webSourceUrl = '';
    state.origParent = null; state.origNext = null;
    return;
  }
  v.removeEventListener('click', handlePlayerClick);
  v.removeEventListener('timeupdate', onTimeUpdate);
  v.removeEventListener('play', enforceVideoPause);
  if (state.origParent && v.parentElement !== state.origParent) {
    const next = state.origNext && state.origNext.parentNode === state.origParent ? state.origNext : null;
    const wasPlaying = !v.paused;
    state.origParent.insertBefore(v, next);
    if (wasPlaying) v.play().catch(() => {});
  }
  state.activeMedia = null;
  state.origParent = null;
  state.origNext = null;
}

function setAmbientMode(mode) {
  if (mode !== 'off' && mode !== '3') return;
  settings.ambientStyle = mode;
  settings.ambient = mode !== 'off';
  saveSettings(); // the unified UI draws its own ambient light
}

function togglePlay() {
  const v = state.activeMedia;
  if (!v) return;
  if (v.paused) {
    state.pauseReasons.delete('sidebar-double-click');
    if (!state.pauseReasons.size) state.managedPauseMedia = null;
    try { v.play().catch(() => {}); }
    catch {}
  } else {
    v.pause();
  }
}

function handlePlayerClick(event) {
  if (unifiedUi()) return; // the unified player handles its own taps / clicks
  event.preventDefault();
  event.stopPropagation();
  window.getSelection?.()?.removeAllRanges?.();
  shadow?.getSelection?.()?.removeAllRanges?.();
  togglePlay();
}

// ---- Popup tốc độ: nút "Tốc độ" mở popup (không chuyển tuần tự nữa) ----
const SPEED_MIN = 0.5, SPEED_MAX = 3.0; // v3.5.157: same 0.5–3x range as Reader
function isReaderSharedWebTtsRateActive() {
  return Boolean(state.sourceType === 'web' && state.studyActivity === null);
}
function webTtsSpeechLanguage() {
  return state.activeMedia?._currentLanguage || state.webSourceDetectedLanguage || state.webSourceLanguageHint || state.mainLanguage || navigator.language || 'en-US';
}
function syncWebTtsSpeedFromReader() {
  const media = state.activeMedia;
  const rateApi = globalThis.LHN_READER_SPEECH_RATE;
  if (!isReaderSharedWebTtsRateActive() || !media || typeof rateApi?.getRate !== 'function') return Promise.resolve(null);
  return Promise.resolve(rateApi.getRate(webTtsSpeechLanguage())).then((rate) => {
    if (!isReaderSharedWebTtsRateActive() || state.activeMedia !== media || !Number.isFinite(rate)) return null;
    if (Math.abs(media.playbackRate - rate) > 0.001) media.playbackRate = rate;
    return rate;
  }).catch((error) => { console.warn('[Keepit Web] Could not read the shared Reader speech rate.', error); return null; });
}
function setWebTtsSpeed(value) {
  const media = state.activeMedia;
  const rateApi = globalThis.LHN_READER_SPEECH_RATE;
  if (!media || typeof rateApi?.setRate !== 'function' || typeof rateApi?.clamp !== 'function') return;
  const rate = rateApi.clamp(value);
  if (rate === null) return;
  media.playbackRate = rate;
  Promise.resolve(rateApi.setRate(rate, webTtsSpeechLanguage())).then((savedRate) => {
    if (!isReaderSharedWebTtsRateActive() || state.activeMedia !== media || !Number.isFinite(savedRate)) return;
    if (Math.abs(media.playbackRate - savedRate) > 0.001) media.playbackRate = savedRate;
  }).catch((error) => console.warn('[Keepit Web] Could not save the shared Reader speech rate.', error));
}
function setOverlayStudyActivity(activity) {
  if (activity !== null && activity !== 'dictation' && activity !== 'shadowing') return false;
  state.studyActivity = activity;
  const media = state.activeMedia;
  if (state.sourceType === 'web' && media) {
    if (activity !== null) {
      if (!Number.isFinite(media._studyPlaybackRate)) media._studyPlaybackRate = 1;
      if (Math.abs(media.playbackRate - media._studyPlaybackRate) > 0.001) media.playbackRate = media._studyPlaybackRate;
    } else {
      void syncWebTtsSpeedFromReader();
    }
  }
  return true;
}
globalThis.LHN_OVERLAY_WEB_TTS_USES_READER_RATE = isReaderSharedWebTtsRateActive;
globalThis.LHN_OVERLAY_SET_STUDY_ACTIVITY = setOverlayStudyActivity;
globalThis.LHN_WEB_TTS_RATE_ACTIVE = isReaderSharedWebTtsRateActive; // Compatibility alias.
globalThis.LHN_WEB_TTS_DICTATION_MODE = (active) => setOverlayStudyActivity(active ? 'dictation' : null); // Compatibility alias.
function setMediaSpeed(val) {
  if (isReaderSharedWebTtsRateActive()) { setWebTtsSpeed(val); return; }
  const sp = Math.round(Math.max(SPEED_MIN, Math.min(SPEED_MAX, parseFloat(val))) * 100) / 100;
  if (state.activeMedia) {
    state.activeMedia.playbackRate = sp;
    if (state.sourceType === 'web' && state.studyActivity !== null) state.activeMedia._studyPlaybackRate = sp;
  }
}

function setActiveCaption(idx) {
  activeStatusKey = '';
  state.activeIdx = idx;
}

function setStatus(text, languageKey = '', languageVars = {}) {
  activeStatusKey = languageKey;
  activeStatusVars = languageKey ? languageVars : {};
  if (!overlayEl()) return;
  globalThis.LHN_UNIFIED_OVERLAY?.onStatus?.(text);
}

// ---------- Transcript ----------
function renderTranscriptList() {
  if (!overlayEl()) return; // a background prefetch can land before the overlay is built
  state.activeIdx = -1;
  globalThis.LHN_UNIFIED_OVERLAY?.onCaptions?.();
}

function updateVietnameseRow(item) {
  if (state.captions.indexOf(item) < 0 || !overlayEl()) return;
  globalThis.LHN_UNIFIED_OVERLAY?.onTranslated?.(item);
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
  return t || state.sourceId || 'subtitles';
}

// Dịch lười nên có thể còn cue chưa dịch: khi xuất thì để trống thay vì ghi "Đang dịch...".
const viForExport = (c) => (c.vi === PENDING ? '' : c.vi);

function printPdf(title, showTime, includeVi) {
  const w = window.open('', '_blank');
  if (!w) {
    alert(overlayT('videoPopupBlocked'));
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
    alert(overlayT('videoNoSubtitlesToExport'));
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
  if (state.sourceType === 'web') {
    if (location.href !== state.webSourceUrl) closeOverlay();
    return;
  }
  const isWatch = location.pathname === '/watch';
  const launcher = ensureLauncher();
  const launcherAttached = launcherIsInPlayerControls(launcher);
  if (launcher) launcher.style.display = isWatch && launcherAttached ? '' : 'none';

  const videoId = isWatch ? new URLSearchParams(location.search).get('v') : null;
  if (videoId === state.sourceId) return;

  if (state.open) closeOverlay();
  stopLiveCaptionCapture();
  state.sourceId = videoId;
  state.loadToken++;
  state.rawCues = [];
  state.allCues = [];
  state.captions = [];
  state.activeIdx = -1;
  state.viCache = new Map();
  state.sourceLanguage = '';
  state.primaryNeedsTranslation = false;
  state.loadingFor = null;
  loadedUntil = 0;
  if (prefetchTimer) { clearTimeout(prefetchTimer); prefetchTimer = 0; }
  prefetchToken++;
  if (videoId) schedulePrefetch(videoId);

  if (overlayEl()) {
    setStatus('');
  }
}

async function runSharedOverlayShortcut(handler, event) {
  if (!keepitSiteGateReady) await refreshKeepitGate();
  await handler(event);
}

// Subtitle source/target language (unified UI: LHN_UNIFIED_BRIDGE.setLanguage). Moved out of the legacy bindUI in v3.5.197.
let subtitleLanguageSaveQueue = Promise.resolve();
function saveSubtitleLanguage(key, value) {
  const allowed = key === 'sourceLanguage' ? ['auto', 'en', 'vi', 'ko'] : ['auto', 'en', 'vi', 'ko'];
  if (!allowed.includes(value)) return;
  // Update the active overlay immediately; persistence continues to use the
  // single Dashboard translation settings object.
  if (key === 'sourceLanguage') state.sourceLanguageSetting = value;
  else state.targetLanguageSetting = value;
  if (key === 'targetLanguage') state.targetLanguage = value === 'auto' ? state.displayLanguage : value;
  state.mainLanguage = state.sourceLanguageSetting === 'auto'
    ? (state.sourceLanguage || 'en')
    : state.sourceLanguageSetting;
  translationSettingsRevision++;
  translateQueue = [];
  if (state.sourceType === 'web') {
    if (state.rawCues.length) {
      const language = state.webSourceDetectedLanguage || state.sourceLanguage || state.webSourceLanguageHint;
      const refreshedCues = markWebReaderCues(state.rawCues, language);
      state.rawCues = refreshedCues; state.allCues = refreshedCues; state.captions = refreshedCues;
      state.activeIdx = -1;
      if (state.open) { renderTranscriptList(); onTimeUpdate(); }
    }
  } else if (state.sourceId) {
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
  }
  const save = async () => {
    try {
      const stored = await browser.storage.local.get(STUDY_TRANSLATION_SETTINGS_KEY);
      const current = stored[STUDY_TRANSLATION_SETTINGS_KEY] || {};
      await browser.storage.local.set({ [STUDY_TRANSLATION_SETTINGS_KEY]: { ...current, [key]: value } });
    } catch (error) {
      console.warn(`Could not save subtitle ${key}`, error);
      await refreshSubtitleLanguageSettings();
    }
  };
  subtitleLanguageSaveQueue = subtitleLanguageSaveQueue.then(save, save);
  return subtitleLanguageSaveQueue;
}

// Web TTS start + Reading-mode audio controls (moved from study/shadowing/shadowing.js in v3.5.196).
function startWebTtsInViewMode() {
  if (state.sourceType !== 'web' || !state.open || !state.activeMedia?.paused) return;
  try {
    const playback = state.activeMedia.play?.();
    playback?.catch?.((error) => reportWebIssue('Could not start Web TTS playback.', error, { level: 'error' }));
  } catch (error) {
    reportWebIssue('Could not start Web TTS playback.', error, { level: 'error' });
  }
}

// Unified overlay UI (js/overlay/unified). Available when its scripts loaded; active once mounted in buildOverlay.
function unifiedUiAvailable() {
  return typeof UNIFIED_OVERLAY_HTML === 'string' && typeof UNIFIED_OVERLAY_CSS === 'string' && Boolean(globalThis.LHN_UNIFIED_OVERLAY?.mount);
}
function unifiedUi() { return Boolean(globalThis.LHN_UNIFIED_OVERLAY?.isActive?.()); }

// Every Study entry (shortcuts, Dashboard intent, popup) opens the Nói / Chép tabs of the unified UI.
// The legacy Study panel (study/dictation, study/shadowing) was removed in v3.5.196.
(() => {
  const U = () => globalThis.LHN_UNIFIED_OVERLAY;
  const tabOf = (mode) => (mode === 'speaking' ? 'speak' : 'write');
  const modeOf = (tab) => (tab === 'speak' ? 'speaking' : tab === 'write' ? 'typing' : null);
  let waitingTab = '';
  const studyOpen = () => unifiedUi() && U().isOpen() && U().tab() !== 'view';
  const proxy = Object.freeze({
    toggle() {
      if (!unifiedUi()) return;
      if (studyOpen()) return proxy.close();
      return proxy.open({ waitForCaptions: true, mode: preferredLearningMode() });
    },
    open(opts = {}) {
      if (!unifiedUi()) return;
      if (!state.open) { openOverlay(); if (!state.open) return; }
      const tab = tabOf(opts.mode);
      // captions still loading: switch as soon as they arrive
      if (opts.waitForCaptions && !getStudyCues().length && state.loadingFor === state.sourceId) { waitingTab = tab; return; }
      waitingTab = '';
      U().setTab(tab);
    },
    close() {
      waitingTab = '';
      if (!unifiedUi()) return;
      if (studyOpen()) U().setTab('view'); // back to Xem (closing the overlay closes the UI first)
    },
    isOpen: () => unifiedUi() && (studyOpen() || Boolean(waitingTab)),
    getMode: () => (unifiedUi() ? (studyOpen() ? modeOf(U().tab()) : waitingTab ? modeOf(waitingTab) : null) : null),
    getActivity: () => (unifiedUi() && studyOpen() ? (U().tab() === 'speak' ? 'shadowing' : 'dictation') : null),
    refreshLanguage: () => { globalThis.LHN_UNIFIED_TEXT?.refresh?.(); },
  });
  document.addEventListener('lhn-dual-captions-updated', () => {
    if (!waitingTab || !unifiedUi() || !state.open) return;
    if (!getStudyCues().length && state.loadingFor === state.sourceId) return;
    const tab = waitingTab; waitingTab = '';
    U().setTab(tab);
  });
  globalThis.LHN_STUDY = proxy;
  globalThis.LHN_DICTATION = proxy;
})();

// Study typing/Shadowing routing and overlay API for the Study engine under js/overlay/study.
let pendingStudyShortcut = false;
let pendingStudyOpenImmediately = false;
let pendingStudyMode = 'typing';
function createStudyOverlayApi() {
  if (globalThis.LHN_OVERLAY_API) return globalThis.LHN_OVERLAY_API;
  const api = Object.freeze({
    state,
    overlayEl,
    setReadingMode,
    setLearningMode: setReadingMode, // Compatibility alias for the former Overlay API.
    syncViewSize: syncViewSizeClasses,
    restorePreferredReadingMode,
    getPreferredLearningMode: preferredLearningMode,
    revealLearningEntry() { overlayEl()?.classList.remove('te-study-entry-pending'); },
    setPreferredLearningMode(mode) {
      if (!['typing', 'speaking'].includes(mode)) return false;
      settings.preferredLearningMode = mode;
      saveSettings();
      return true;
    },
    lang: () => state.displayLanguage,
    getStudyCues: getStudyCues,
    getDictationCues: getStudyCues, // Compatibility alias for the former Overlay API.
    translateToVietnamese: (text) => translateOne(text, 'vi'),
  });
  globalThis.LHN_OVERLAY_API = api;
  return api;
}
function getStudyCues() {
  if (!state.allCues.length || (state.sourceType !== 'web' && state.sourceLanguage !== 'en')) return [];
  if (state.sourceType === 'web') return state.allCues.map((cue, index) => ({ id:index, start:cue.start, end:cue.end, en:String(cue.en || '').trim() })).filter((cue) => cue.en);
  return dedupeSentences(resegmentBySentence(state.allCues)).map((cue, index) => ({
    id: index,
    start: cue.start,
    end: cue.end,
    en: String(cue.en || '').replace(/\s+/g, ' ').trim(),
  })).filter((cue) => cue.en);
}

function announceOverlayCaptionsUpdated() {
  document.dispatchEvent(new CustomEvent('lhn-dual-captions-updated', {
    detail: { sourceId: state.sourceId, videoId: state.sourceId, language: state.sourceLanguage, count: state.allCues.length }, // videoId remains for event consumers.
  }));
}

function beginStudyMode(mode) {
  const selectedMode = mode === 'speaking' ? 'speaking' : 'typing';
  if (state.open) {
    if (!globalThis.LHN_STUDY?.open) return;
    overlayEl()?.classList.add('te-study-entry-pending');
    globalThis.LHN_STUDY.open({ waitForCaptions: true, mode: selectedMode });
    return;
  }
  pendingStudyShortcut = true;
  pendingStudyOpenImmediately = true;
  pendingStudyMode = selectedMode;
  openOverlay();
  if (!state.open) {
    pendingStudyShortcut = false;
    pendingStudyOpenImmediately = false;
    pendingStudyMode = 'typing';
    return;
  }
  openPendingStudyShortcut();
}

function toggleStudyTypingModeControl() {
  if (keepitSiteDisabled) return;
  const study = globalThis.LHN_STUDY;
  if (study?.isOpen?.()) {
    if (study.getMode?.() !== 'typing') study.open?.({ waitForCaptions: true, mode: 'typing' });
    else study.close?.();
    return;
  }
  beginStudyMode('typing');
}

async function prepareWebSourceForShortcut() {
  if (OVERLAY_YOUTUBE_HOST_RE.test(location.hostname) || state.sourceType === 'web') return;
  if (state.open) closeOverlay();
  document.dispatchEvent(new CustomEvent('lhn-bilingual-reader-command', { detail: 'stop-reading' }));
  await prepareWebSource();
}

async function toggleStudyFromShortcut(event) {
  if (keepitSiteDisabled) return;
  if (event?.detail?.source === 'typing-control') {
    toggleStudyTypingModeControl();
    return;
  }
  if (!OVERLAY_YOUTUBE_HOST_RE.test(location.hostname)) await prepareWebSourceForShortcut();
  const study = globalThis.LHN_STUDY;
  if (pendingStudyShortcut || study?.isOpen?.()) {
    closeOverlay();
    return;
  }
  beginStudyMode(preferredLearningMode());
}

function openPendingStudyShortcut() {
  if (!pendingStudyShortcut) return;
  if (!state.open) {
    pendingStudyShortcut = false;
    pendingStudyOpenImmediately = false;
    pendingStudyMode = 'typing';
    return;
  }
  const hasCues = !!globalThis.LHN_OVERLAY_API?.getStudyCues?.().length;
  if (!hasCues && state.loadingFor === state.sourceId && !pendingStudyOpenImmediately) return;
  pendingStudyShortcut = false;
  const openWhileLoading = pendingStudyOpenImmediately;
  const mode = pendingStudyMode;
  pendingStudyOpenImmediately = false;
  pendingStudyMode = 'typing';
  if (openWhileLoading) globalThis.LHN_STUDY?.open?.({ waitForCaptions: true, mode, fromEntry: true });
  else globalThis.LHN_STUDY?.open?.({ mode, fromEntry: true });
}

async function openStudyFromDashboardIntent() {
  if (!OVERLAY_YOUTUBE_HOST_RE.test(location.hostname)) return;
  let targetUrl;
  try { targetUrl = new URL(location.href); } catch { return; }
  if (targetUrl.pathname !== "/watch" || targetUrl.searchParams.get("lhn_open_dictation") !== "1") return;
  targetUrl.searchParams.delete("lhn_open_dictation");
  history.replaceState(history.state, "", `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`);
  await refreshKeepitGate();
  if (keepitSiteDisabled) return;
  pendingStudyShortcut = true;
  pendingStudyOpenImmediately = true;
  pendingStudyMode = preferredLearningMode();
  openOverlay();
  openPendingStudyShortcut();
}

// Khung video co theo đúng tỉ lệ của video (không ép 16:9); chưa có metadata thì dùng 16:9.

document.addEventListener('keydown', (event) => {
  if (!state.open || event.key !== 'Escape') return;
  event.preventDefault();
  event.stopPropagation();
  closeOverlay();
});

// Bilingual Reader and Web-study are exclusive: opening Web stops Reader;
// starting Reader closes an active Web-study overlay before its TTS begins.
document.addEventListener('lhn-bilingual-reader-started', () => {
  if (state.sourceType === 'web' && state.open) closeOverlay();
}, true);

document.addEventListener('lhn-youtube-dual-subtitles-toggle', (event) => {
  void runSharedOverlayShortcut(toggleOverlayViewFromShortcut, event);
});
document.addEventListener('lhn-youtube-dictation-toggle', (event) => {
  void runSharedOverlayShortcut(toggleStudyFromShortcut, event);
});

void refreshKeepitGate();
void Promise.all([restoreSettings(), refreshSubtitleLanguageSettings()]).then(([loaded]) => {
  settings = loaded;
  if (overlayEl()) applySettings();
  if (state.open) restorePreferredReadingMode();
  if (OVERLAY_YOUTUBE_HOST_RE.test(location.hostname)) {
    setInterval(tick, 1000);
    tick();
    void openStudyFromDashboardIntent();
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
    if (state.sourceType === 'web') void syncWebTtsSpeedFromReader();
  }
  if (changes[STUDY_TRANSLATION_SETTINGS_KEY]) void refreshSubtitleLanguageSettings();
});

// Player discovery and caption polling remain YouTube-specific.
if (OVERLAY_YOUTUBE_HOST_RE.test(location.hostname)) {
  observeLauncherChanges();
  document.addEventListener('lhn-dual-captions-updated', openPendingStudyShortcut);
  window.addEventListener('pagehide', () => {
    if (isTheaterLargeActive() && sizeForcedHide) restoreForcedHideControls();
  });
}
