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
  if (modeChanged) suppressHoverPauseForModeChange();
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
  scheduleHoverPauseSync({ modeChange: modeChanged });
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
  if (modeChanged) suppressHoverPauseForModeChange();
  if (modeChanged) root.classList.remove('te-reading-audio-compact');
  root.classList.toggle('te-reading-mode', active);
  applySettings();
  setVideoDisplayModeSelection(active ? 'reading' : root.classList.contains('te-sidebar-hidden') ? 'theater' : 'combined');
  syncReadingAudioControls();
  if (modeChanged && !root.classList.contains('te-study-active')) alignActiveTranscriptFocus('auto');
  scheduleHoverPauseSync({ modeChange: modeChanged });
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
