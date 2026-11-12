// Overlay engine (tái cấu trúc bước 4, v3.5.195): ghép NGUYÊN VĂN từ js/overlay/view/ cũ, theo đúng thứ tự nạp cũ.
//   1. layout-mode.js — cài đặt (mặc định/gộp/khôi phục/lưu), chế độ xem, kích thước, rạp.
//   2. cc-mode.js     — chế độ phụ đề, ngôn ngữ phụ đề, hàng đợi dịch (translateOne, queueCue, translateWindow…).
//   3. touch-layout.js (chỉ phần yêu thích) — touchVideoMeta, loadTouchFavorites, setTouchFavorite… (lhnFavoriteVideos).
// Các hàm còn ghi vào markup cũ đang ẩn sẽ được gỡ ở bước 5. Giao diện đang dùng: js/overlay/unified/.

// ===== 1. layout-mode =====
// Overlay layout modes, display sizing, and theater presentation.
const DEFAULT_HEX = { en: '#ffff00', vi: '#ffffff', 'side-en': '#e5e7eb', 'side-vi': '#9ca3af' };
const THEATER_SUBTITLE_POSITION_SPACE = 'frame-v1';
const THEATER_SUBTITLE_BOTTOM_INSET = 30;
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
  if (open) {
    const selector = trigger.parentElement;
    const controlBar = overlayEl()?.querySelector('.te-control-bar');
    if (selector && controlBar) {
      const barRect = controlBar.getBoundingClientRect();
      const selectorRect = selector.getBoundingClientRect();
      const menuWidth = menu.getBoundingClientRect().width;
      menu.style.left = `${barRect.right - selectorRect.left - menuWidth - 4}px`;
      menu.style.right = 'auto';
      menu.style.transform = 'none';
    }
  } else {
    menu.style.removeProperty('left');
    menu.style.removeProperty('right');
    menu.style.removeProperty('transform');
  }
  trigger.setAttribute('aria-expanded', String(open));
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
  if (root.classList.contains('te-ambient-on')) placeAmbient();
  syncTheaterFrame();
  if (!root.classList.contains('te-reading-mode')) {
    setVideoDisplayModeSelection(sidebarHidden ? 'theater' : 'combined');
  }
  if (!sidebarHidden && !root.classList.contains('te-study-active')) alignActiveTranscriptFocus('auto');
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
  setVideoDisplayModeSelection(mode);
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

function clampTheaterSubtitlePercent(value) {
  const number = Number(value);
  return Math.min(96, Math.max(4, Number.isFinite(number) ? number : 82));
}

function theaterSubtitleControlsVisible(root, controls) {
  if (!controls) return false;
  const style = window.getComputedStyle(controls);
  if (style.display === 'none' || style.visibility === 'hidden') return false;
  if (!root.classList.contains('te-controls-hidden') || controls.matches(':hover, :focus-within')) return true;
  return Number.parseFloat(style.opacity) > 0.01;
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
  const frame = ui('.te-player-frame');
  const panel = ui('.te-sub-container');
  const controls = ui('.te-control-bar');
  const handle = ui('#te-theater-subtitle-drag-handle');
  if (!frame || !panel) return null;
  const frameRect = frame.getBoundingClientRect();
  if (!(frameRect.width > 0 && frameRect.height > 0)) return null;
  root.style.setProperty('--te-theater-frame-width', `${frameRect.width}px`);
  root.style.setProperty('--te-theater-subtitle-max-width', `${Math.round(frameRect.width * 0.98)}px`);

  const controlsRect = theaterSubtitleControlsVisible(root, controls) ? controls.getBoundingClientRect() : null;
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
    : settings.theaterSubtitle.useDefaultPosition !== false
      ? frameRect.bottom - THEATER_SUBTITLE_BOTTOM_INSET - panelRect.height / 2
      : frameRect.top + frameRect.height * clampTheaterSubtitlePercent(settings.theaterSubtitle.y) / 100;
  const centerY = clampTheaterSubtitleCenter(desiredCenter, bounds);
  root.style.setProperty('--te-theater-subtitle-top', `${centerY}px`);
  if (Number.isFinite(requestedCenterY)) {
    settings.theaterSubtitle.useDefaultPosition = false;
    const storedBounds = theaterSubtitleBounds(frameRect, panelRect, null, handleRect);
    const storedCenterY = clampTheaterSubtitleCenter(requestedCenterY, storedBounds);
    settings.theaterSubtitle.y = clampTheaterSubtitlePercent(theaterSubtitlePercent(storedCenterY, frameRect));
    settings.theaterSubtitle.positionSpace = THEATER_SUBTITLE_POSITION_SPACE;
  }
  return { frameRect, panelRect, bounds, centerY };
}

function resetTheaterSubtitlePosition(root = overlayEl()) {
  if (!isTheaterLargeActive(root)) return false;
  settings.theaterSubtitle.y = defaultSettings().theaterSubtitle.y;
  settings.theaterSubtitle.useDefaultPosition = true;
  settings.theaterSubtitle.positionSpace = THEATER_SUBTITLE_POSITION_SPACE;
  updateTheaterSubtitleLayout(null, root);
  saveSettings();
  return true;
}

let theaterSubtitleLayoutRaf = 0;
let theaterSubtitleResizeObserver = null;
let theaterSubtitleControlsClassObserver = null;
let theaterSubtitleControlsEventTarget = null;
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
  const root = overlayEl();
  const controls = ui('.te-control-bar');
  if (root && typeof MutationObserver === 'function' && !theaterSubtitleControlsClassObserver) {
    theaterSubtitleControlsClassObserver = new MutationObserver(() => scheduleTheaterSubtitleLayout(root));
    theaterSubtitleControlsClassObserver.observe(root, { attributes: true, attributeFilter: ['class'] });
  }
  if (controls && theaterSubtitleControlsEventTarget !== controls) {
    theaterSubtitleControlsEventTarget = controls;
    const reschedule = () => scheduleTheaterSubtitleLayout(root);
    controls.addEventListener('pointerenter', reschedule);
    controls.addEventListener('pointerleave', reschedule);
    controls.addEventListener('focusin', reschedule);
    controls.addEventListener('focusout', reschedule);
    controls.addEventListener('transitionend', (event) => {
      if (event.target === controls && event.propertyName === 'opacity') reschedule();
    });
  }
  if (typeof ResizeObserver !== 'function' || theaterSubtitleResizeObserver) return;
  theaterSubtitleResizeObserver = new ResizeObserver(() => scheduleTheaterSubtitleLayout(root));
  for (const selector of ['.te-player-frame', '.te-sub-container', '.te-subtitle-content', '#te-theater-subtitle-drag-handle', '.te-control-bar']) {
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
  // Touch layout: transcript = 15px/13px × the user's own percentage (demo v10), without the desktop size factor.
  const touchSide = root.classList.contains('te-reading-mode') ? settings.readingSubtitle : settings.side;
  root.style.setProperty('--te-side-en-scale', String(touchSide.en.pct / 100));
  root.style.setProperty('--te-side-vi-scale', String(touchSide.vi.pct / 100));
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
  // Base sizes are 24px; the touch layouts set smaller bases (and an auto-fit factor) through these variables.
  enEl.style.fontSize = settings.sub.en.pct === 100 ? '' : `calc(var(--te-sub-en-base, 24px) * ${settings.sub.en.pct / 100})`;
  viEl.style.fontSize = settings.sub.vi.pct === 100 ? '' : `calc(var(--te-sub-vi-base, 24px) * ${settings.sub.vi.pct / 100})`;
  enEl.style.fontWeight = settings.sub.bold ? '700' : '';
  viEl.style.fontWeight = settings.sub.bold ? '600' : '';
  enEl.style.fontFamily = fam;
  viEl.style.fontFamily = fam;
  enEl.style.color = settings.sub.en.color || '';
  viEl.style.color = settings.sub.vi.color || '';

  $('te-theme-label').textContent = overlayT(settings.theme === 'dark' ? 'darkMode' : 'lightMode');

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
    : overlayEl()?.classList.contains('te-study-active') ? (settings.learningViewSize || 'S')
    : overlayEl()?.classList.contains('te-sidebar-hidden') ? (settings.theaterSize || 'M') : settings.size;
  const sizeIdx = { S: 0, M: 1, L: 2 }[modalViewSize] ?? 1;
  $('te-view-mode-options').querySelectorAll('button').forEach((b, i) => b.classList.toggle('active', i === sizeIdx));
  const readingWidthHint = $('te-reading-width-hint');
  if (readingWidthHint) {
    const width = { S: 35, M: 45, L: 52 }[modalViewSize] ?? 45;
    readingWidthHint.style.display = isReadingModeActive() ? '' : 'none';
    readingWidthHint.textContent = overlayT('videoReadingWidthHint', { width });
  }
  sub.querySelector('select').value = settings.sub.font || 'Inter';
  const videoSubSettings = activeVideoSubtitleSettings();
  const videoSubtitleTitle = $('te-video-subtitle-settings-title');
  if (videoSubtitleTitle) videoSubtitleTitle.textContent = isReadingModeActive()
    ? `${overlayT('videoVideoSubtitles')} · ${overlayT('videoModeReading')}`
    : overlayT('videoVideoSubtitles');

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
    for (const selector of ['#te-shadowing-mode-btn', '#te-dictation-mode-btn']) {
      const button = root.querySelector(selector);
      button?.classList.remove('te-active');
      button?.setAttribute('aria-pressed', 'false');
    }
  }
  const wasReading = root.classList.contains('te-reading-mode');
  const modeChanged = wasReading !== active;
  if (modeChanged) root.classList.remove('te-reading-audio-compact');
  root.classList.toggle('te-reading-mode', active);
  applySettings();
  setVideoDisplayModeSelection(active ? 'reading' : root.classList.contains('te-sidebar-hidden') ? 'theater' : 'combined');
  syncReadingAudioControls();
  if (modeChanged && !root.classList.contains('te-study-active')) alignActiveTranscriptFocus('auto');
  return active;
}

function restorePreferredReadingMode() {
  if (!state.open || pendingStudyShortcut || pendingStudyOpenImmediately
    || globalThis.LHN_STUDY?.isOpen?.()) return false;
  return applyVideoDisplayMode(preferredVideoMode());
}

function syncMediaAspect(media) {
  const root = overlayEl();
  if (!root) return;
  const w = Number(media?.videoWidth) || 0;
  const h = Number(media?.videoHeight) || 0;
  if (w > 0 && h > 0) root.style.setProperty('--te-video-aspect', `${w} / ${h}`);
  else root.style.removeProperty('--te-video-aspect');
}

// Chế độ rạp: khung bọc có kích thước pixel đúng bằng video đang hiển thị (không dùng %)
function syncTheaterFrame() {
  const root = overlayEl(), slot = ui('.te-player-slot');
  const frame = slot?.querySelector(':scope > .te-player-frame');
  if (!root || !slot || !frame) return;
  const media = state.activeMedia;
  const theaterActive = root.classList.contains('te-sidebar-hidden')
    && !root.classList.contains('te-reading-mode') && !root.classList.contains('te-study-active');
  if (!theaterActive || !media) {
    frame.style.width = '';
    frame.style.height = '';
    scheduleTheaterSubtitleLayout(root);
    return;
  }
  // Lớn: khung tính theo toàn màn hình (khung cố định), các kích thước khác theo ô video.
  const r = root.classList.contains('size-l') ? { width: innerWidth, height: innerHeight } : slot.getBoundingClientRect();
  const a = (media.videoWidth && media.videoHeight) ? media.videoWidth / media.videoHeight : 16 / 9;
  const sizeFactor = root.classList.contains('size-s') ? 2 / 3 : 1;
  const w = Math.min(r.width, r.height * a) * sizeFactor, h = w / a;
  frame.style.width = `${Math.round(w)}px`;
  frame.style.height = `${Math.round(h)}px`;
  scheduleTheaterSubtitleLayout(root);
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

// ===== 3. yêu thích (từ touch-layout) =====
const TOUCH_OVERLAY_TEXT = {
  en: {
    more: 'More', close: 'Close', enlarge: 'Show video', shrink: 'Shrink video', study: 'Study',
    shadowing: 'Speaking practice', shadowingSub: 'Listen and repeat', dictation: 'Dictation', dictationSub: 'Listen and type',
    theme: 'Theme', subOptions: 'Subtitle options', subLanguage: 'Subtitle language', notes: 'Notes', art: 'Art mode', settings: 'Settings',
    hideSubs: 'Hide subtitles', showSubs: 'Show subtitles',
    favorite: 'Favorite', favAdded: 'Added to favorites', favRemoved: 'Removed from favorites', fullscreen: 'Fullscreen', exitFullscreen: 'Exit fullscreen',
    repeat: 'Repeat sentence', volume: 'Volume', brightness: 'Brightness', auto: 'Auto', gestureHint: 'Swipe left side: volume · right side: brightness', gestureHint2: 'Swipe sideways: seek · swipe down in the middle: exit', hintClose: 'Tap to close',
    size: 'Text size', small: 'Small', medium: 'Medium', large: 'Large', mainLine: 'Primary subtitle', translationLine: 'Translated subtitle',
    tabVideo: 'Video subtitles', tabSide: 'Scrolling subtitles', advanced: 'Advanced', white: 'White', grey: 'Grey', yellow: 'Yellow', green: 'Green', cyan: 'Cyan', red: 'Red', pink: 'Pink', purple: 'Purple', defaultColor: 'Default',
    previewMain: 'Keep exploring everything', previewTranslation: 'Translation appears here',
    videoSettings: 'Video settings', reset: 'Reset', mainColor: 'Primary subtitle color', trColor: 'Translated subtitle color',
    background: 'Background', bgNote: 'Applies in fullscreen', bgNone: 'None', bgSoft: 'Soft', bgSolid: 'Solid', font: 'Font', weight: 'Weight',
  },
  vi: {
    more: 'Thêm', close: 'Đóng', enlarge: 'Phóng to video', shrink: 'Thu nhỏ video', study: 'Học',
    shadowing: 'Luyện nói', shadowingSub: 'Nghe và nói lại', dictation: 'Chép chính tả', dictationSub: 'Nghe và gõ lại',
    theme: 'Chủ đề', subOptions: 'Tùy chọn phụ đề', subLanguage: 'Ngôn ngữ phụ đề', notes: 'Ghi chú', art: 'Chế độ nghệ thuật', settings: 'Cài đặt',
    hideSubs: 'Ẩn phụ đề', showSubs: 'Hiện phụ đề',
    favorite: 'Yêu thích', favAdded: 'Đã thêm vào yêu thích', favRemoved: 'Đã bỏ yêu thích', fullscreen: 'Toàn màn hình', exitFullscreen: 'Thoát toàn màn hình',
    repeat: 'Lặp lại câu', volume: 'Âm lượng', brightness: 'Độ sáng', auto: 'Tự động', gestureHint: 'Vuốt bên trái: âm lượng · bên phải: độ sáng', gestureHint2: 'Vuốt ngang: tua · vuốt xuống ở giữa: thoát', hintClose: 'Chạm để đóng',
    size: 'Cỡ chữ', small: 'Nhỏ', medium: 'Trung bình', large: 'Lớn', mainLine: 'Phụ đề chính', translationLine: 'Phụ đề dịch',
    tabVideo: 'Phụ đề video', tabSide: 'Phụ đề cuộn', advanced: 'Nâng cao', white: 'Trắng', grey: 'Xám', yellow: 'Vàng', green: 'Xanh lá', cyan: 'Xanh lơ', red: 'Đỏ', pink: 'Hồng', purple: 'Tím', defaultColor: 'Mặc định',
    previewMain: 'Keep exploring everything', previewTranslation: 'Bản dịch hiển thị ở đây',
    videoSettings: 'Cài đặt video', reset: 'Đặt lại', mainColor: 'Màu phụ đề chính', trColor: 'Màu phụ đề dịch',
    background: 'Nền', bgNote: 'Áp dụng khi xem toàn màn hình', bgNone: 'Không', bgSoft: 'Mờ', bgSolid: 'Đậm', font: 'Phông chữ', weight: 'Độ đậm',
  },
  ko: {
    more: '더보기', close: '닫기', enlarge: '영상 크게 보기', shrink: '영상 작게 보기', study: '학습',
    shadowing: '말하기 연습', shadowingSub: '듣고 따라 말하기', dictation: '받아쓰기', dictationSub: '듣고 입력하기',
    theme: '테마', subOptions: '자막 옵션', subLanguage: '자막 언어', notes: '노트', art: '아트 모드', settings: '설정',
    hideSubs: '자막 숨기기', showSubs: '자막 표시',
    favorite: '즐겨찾기', favAdded: '즐겨찾기에 추가됨', favRemoved: '즐겨찾기에서 제거됨', fullscreen: '전체 화면', exitFullscreen: '전체 화면 종료',
    repeat: '문장 반복', volume: '볼륨', brightness: '밝기', auto: '자동', gestureHint: '왼쪽 스와이프: 볼륨 · 오른쪽: 밝기', gestureHint2: '가로 스와이프: 탐색 · 가운데에서 아래로: 나가기', hintClose: '탭하여 닫기',
    size: '글자 크기', small: '작게', medium: '보통', large: '크게', mainLine: '원문 자막', translationLine: '번역 자막',
    tabVideo: '동영상 자막', tabSide: '스크롤 자막', advanced: '고급', white: '흰색', grey: '회색', yellow: '노랑', green: '초록', cyan: '하늘색', red: '빨강', pink: '분홍', purple: '보라', defaultColor: '기본값',
    previewMain: 'Keep exploring everything', previewTranslation: '번역이 여기에 표시됩니다',
    videoSettings: '동영상 설정', reset: '초기화', mainColor: '원문 자막 색상', trColor: '번역 자막 색상',
    background: '배경', bgNote: '전체 화면에서 적용', bgNone: '없음', bgSoft: '연하게', bgSolid: '진하게', font: '글꼴', weight: '굵기',
  },
};

let touchFavoriteIds = new Set();

function touchOverlayText(key) {
  const lang = state?.displayLanguage || globalThis.LHN_LANGUAGES?.detectLanguage?.() || 'en';
  return (TOUCH_OVERLAY_TEXT[lang] || TOUCH_OVERLAY_TEXT.en)[key] ?? TOUCH_OVERLAY_TEXT.en[key] ?? key;
}

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

function syncTouchFavoriteButtons(beat = false) {
  const root = overlayEl();
  if (!root) return;
  const id = touchFavoriteKey();
  const on = Boolean(id && touchFavoriteIds.has(id));
  root.classList.toggle('te-touch-no-fav', !id);
  root.querySelectorAll('.te-touch-fav').forEach((button) => {
    button.classList.toggle('on', on);
    button.setAttribute('aria-pressed', String(on));
    button.title = touchOverlayText('favorite');
    button.setAttribute('aria-label', button.title);
    if (beat) { button.classList.remove('te-touch-beat'); void button.offsetWidth; button.classList.add('te-touch-beat'); }
  });
}

async function loadTouchFavorites() {
  const key = touchFavoriteStorageKey();
  try {
    const stored = await globalThis.browser?.storage?.local?.get(key);
    const list = Array.isArray(stored?.[key]) ? stored[key] : [];
    touchFavoriteIds = new Set(list.map(touchFavoriteEntryKey).filter(Boolean));
  } catch { touchFavoriteIds = new Set(); }
  syncTouchFavoriteButtons();
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
    showViewToast(touchOverlayText(on ? 'favAdded' : 'favRemoved'));
  }
  syncTouchFavoriteButtons(on);
  return true;
}
