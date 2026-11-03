// Chế độ CC: cài đặt phụ đề, bản dịch
// Tách từ js/video/dual-subtitles.js (v3.5.26). Nội dung giữ nguyên, chỉ đổi vị trí file.

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

