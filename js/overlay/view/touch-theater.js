// Phone landscape theater for the touch overlay (portrait layout: touch-layout.js).
// Active while a phone is held in landscape (TOUCH_THEATER_QUERY) or after the Fullscreen corner button.
// The video fills the screen and subtitles sit over it; bar [CC][speed] · [prev play next] · [♥][repeat][More]
// auto-hides after 3 s; exit is top-right. Gestures are decided by finger movement, not by layer (they also start on
// the subtitle): vertical swipe on the left = volume, right = brightness (centre ring; the bottom of both ranges is
// "Auto" = the page's own volume / no filter); horizontal swipe = seek (target time + sentence, applied on release);
// swipe down in the middle band = exit. A still tap on the video shows/hides the bar, on the subtitle it plays/pauses;
// a long press on a word selects it (touch-layout.js). Values only live inside the overlay and are restored on exit.
// Tablets in landscape keep the desktop layout.
const TOUCH_THEATER_QUERY = '(orientation: landscape) and (max-height: 499.98px) and (pointer: coarse)';
const TOUCH_THEATER_EDGE = 24;          // px kept free at the screen edges (system gestures)
const TOUCH_THEATER_SWIPE = 10;         // px before a drag becomes a swipe
const TOUCH_THEATER_HIDE_MS = 3000;
const TOUCH_THEATER_BRI_MAX = 15;
const TOUCH_THEATER_SEEK_MAX = 120;     // s: a full-width horizontal swipe seeks at most this far
const TOUCH_THEATER_EXIT_PX = 60;       // px down in the middle band that exits
const TOUCH_THEATER_HINT_KEY = 'lhnTouchTheaterHintSeen';
const TOUCH_THEATER_RING_C = 2 * Math.PI * 36;
const TOUCH_THEATER_VOL_PATH = '<path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/>';
const TOUCH_THEATER_ICONS = {
  vol: `${TOUCH_THEATER_VOL_PATH}<path d="M16 9a5 5 0 0 1 0 6"/><path d="M19.364 18.364a9 9 0 0 0 0-12.728"/>`,
  volAuto: `${TOUCH_THEATER_VOL_PATH}<path d="M15 16.5 18 8.5l3 8M16.1 13.6h3.8" stroke-width="1.7"/>`,
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
  auto: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/><path d="M10.5 13.5 12 9.5l1.5 4M10.9 12.4h2.2" stroke-width="1.4"/>',
  exit: '<path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>',
};
const touchTheater = { root: null, query: null, forced: false, dismissed: false, active: false, hideTimer: 0, saved: null, vol: 100, bri: 0, gesture: null, hintSeen: false };

function touchTheaterSvg(name) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${TOUCH_THEATER_ICONS[name]}</svg>`;
}

function touchTheaterWanted() {
  return touchTheater.forced || Boolean(touchTheater.query?.matches && !touchTheater.dismissed);
}

function touchTheaterPopupsOpen(root = touchTheater.root) {
  return Boolean(root?.querySelector('.te-touch-sheet.open, .te-modal-backdrop:not(.hidden) .te-modal-box, #te-speed-popup:not(.hidden), .te-subtitle-mode-menu:not([hidden])'));
}

function closeTouchTheaterPopups(root = touchTheater.root) {
  let closed = false;
  const speed = root?.querySelector('#te-speed-popup');
  if (speed && !speed.classList.contains('hidden')) { speed.classList.add('hidden'); closed = true; }
  if (root?.querySelector('.te-subtitle-mode-menu:not([hidden])')) { setSubtitleModeMenuOpen(false); closed = true; }
  return closed;
}

function showTouchTheaterControls() {
  const root = touchTheater.root;
  if (!touchTheater.active || !root) return;
  root.classList.add('te-tt-ctl');
  clearTimeout(touchTheater.hideTimer);
  touchTheater.hideTimer = setTimeout(() => {
    const media = state?.activeMedia;
    if (media && !media.paused && !root.classList.contains('te-progress-dragging') && !touchTheaterPopupsOpen(root)) root.classList.remove('te-tt-ctl');
    else showTouchTheaterControls();
  }, TOUCH_THEATER_HIDE_MS);
}

function toggleTouchTheaterControls() {
  const root = touchTheater.root;
  if (root?.classList.contains('te-tt-ctl')) { root.classList.remove('te-tt-ctl'); clearTimeout(touchTheater.hideTimer); }
  else showTouchTheaterControls();
}

function applyTouchTheaterBrightness() {
  const frame = touchTheater.root?.querySelector('.te-player-frame');
  if (!frame) return;
  if (!touchTheater.active || touchTheater.bri < 1) frame.style.removeProperty('filter');
  else frame.style.setProperty('filter', `brightness(${(0.35 + touchTheater.bri * 0.07).toFixed(3)})`, 'important');
}

function applyTouchTheaterVolume() {
  const media = state?.activeMedia;
  if (!media || !touchTheater.saved) return;
  const auto = touchTheater.vol < 100 / TOUCH_THEATER_BRI_MAX;
  media.volume = auto ? touchTheater.saved.volume : Math.min(1, touchTheater.vol / 100);
}

function showTouchTheaterRing(zone) {
  const ring = touchTheater.root?.querySelector('.te-tt-ring');
  if (!ring) return;
  let fraction, label, icon;
  if (zone === 'vol') {
    const auto = touchTheater.vol < 100 / TOUCH_THEATER_BRI_MAX;
    fraction = touchTheater.vol / 100;
    label = auto ? touchOverlayText('auto') : `${Math.round(touchTheater.vol)}%`;
    icon = auto ? 'volAuto' : 'vol';
    applyTouchTheaterVolume();
  } else {
    const auto = touchTheater.bri < 1;
    fraction = touchTheater.bri / TOUCH_THEATER_BRI_MAX;
    label = auto ? touchOverlayText('auto') : `${Math.round(touchTheater.bri / TOUCH_THEATER_BRI_MAX * 100)}%`;
    icon = auto ? 'auto' : 'sun';
    applyTouchTheaterBrightness();
  }
  ring.querySelector('.te-tt-arc').style.strokeDashoffset = (TOUCH_THEATER_RING_C * (1 - fraction)).toFixed(2);
  ring.querySelector('b').textContent = label;
  ring.setAttribute('aria-label', `${touchOverlayText(zone === 'vol' ? 'volume' : 'brightness')} ${label}`);
  const iconBox = ring.querySelector('.te-tt-ring-ic');
  if (iconBox.dataset.icon !== icon) { iconBox.innerHTML = touchTheaterSvg(icon); iconBox.dataset.icon = icon; }
  clearTimeout(ring._hideTimer);
  ring.classList.add('show');
  touchTheater.root.classList.add('te-tt-ring-on');
}

function dismissTouchTheaterHint() {
  touchTheater.root?.classList.remove('te-tt-hint-on');
  if (touchTheater.hintSeen) return;
  touchTheater.hintSeen = true;
  Promise.resolve(globalThis.browser?.storage?.local?.set({ [TOUCH_THEATER_HINT_KEY]: true })).catch(() => {});
}

function touchTheaterCaptionAt(time) {
  const caps = state?.captions || [];
  let found = null;
  for (const cap of caps) { if (cap.start <= time) found = cap; else break; }
  return found;
}

function showTouchTheaterSeek(gesture) {
  const box = touchTheater.root?.querySelector('.te-tt-seek');
  if (!box) return;
  const delta = Math.round(gesture.target - gesture.from);
  box.querySelector('b').textContent = formatProgressTime(gesture.target);
  box.querySelector('i').textContent = `${delta < 0 ? '−' : '+'}${Math.abs(delta)}s`;
  const cap = touchTheaterCaptionAt(gesture.target);
  box.querySelector('small').textContent = cap ? String(cap.mainText || cap.en || '').replace(/\s+/g, ' ').trim() : '';
  box.classList.add('show');
  touchTheater.root.classList.add('te-tt-ring-on');
}

function hideTouchTheaterSeek() {
  touchTheater.root?.querySelector('.te-tt-seek')?.classList.remove('show');
  touchTheater.root?.classList.remove('te-tt-ring-on');
}

function hideTouchTheaterRing() {
  const ring = touchTheater.root?.querySelector('.te-tt-ring');
  if (!ring) return;
  clearTimeout(ring._hideTimer);
  ring._hideTimer = setTimeout(() => { ring.classList.remove('show'); touchTheater.root?.classList.remove('te-tt-ring-on'); }, 800);
}

function setTouchTheaterActive(active) {
  const root = touchTheater.root;
  if (!root || touchTheater.active === active) return;
  touchTheater.active = active;
  root.classList.toggle('te-touch-theater', active);
  closeTouchOverlaySheet();
  closeTouchTheaterPopups(root);
  if (active) {
    const media = state?.activeMedia;
    touchTheater.saved = { volume: media ? media.volume : 1 };
    touchTheater.vol = Math.round((media ? media.volume : 1) * 100);
    touchTheater.bri = 0;
    showTouchTheaterControls();
    // The gesture guide shows on the first theater entry and stays until the screen is touched.
    root.classList.toggle('te-tt-hint-on', !touchTheater.hintSeen);
  } else {
    if (state?.activeMedia && touchTheater.saved) state.activeMedia.volume = touchTheater.saved.volume;
    touchTheater.saved = null;
    clearTimeout(touchTheater.hideTimer);
    root.classList.remove('te-tt-ctl', 'te-tt-ring-on', 'te-tt-hint-on');
  }
  applyTouchTheaterBrightness();
  syncTouchOverlayHeader();
  globalThis.LHN_TOUCH_LAYOUT_APPLY?.();
  if (state?.open) requestAnimationFrame(() => { syncTheaterFrame(); alignActiveTranscriptFocus('auto'); });
}

function syncTouchTheater() {
  if (!touchTheater.query?.matches) touchTheater.dismissed = false;
  const root = touchTheater.root;
  if (root?.classList.contains('te-hidden')) touchTheater.forced = false;
  setTouchTheaterActive(Boolean(root && touchTheaterWanted()
    && !root.classList.contains('te-study-active') && !root.classList.contains('te-hidden')));
}

function enterTouchTheater() {
  touchTheater.forced = true;
  touchTheater.dismissed = false;
  syncTouchTheater();
  const host = shadow?.host;
  Promise.resolve(document.fullscreenElement ? null : host?.requestFullscreen?.())
    .then(() => globalThis.screen?.orientation?.lock?.('landscape'))
    .catch(() => {});
}

function exitTouchTheater() {
  touchTheater.forced = false;
  touchTheater.dismissed = Boolean(touchTheater.query?.matches);
  try { globalThis.screen?.orientation?.unlock?.(); } catch {}
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  syncTouchTheater();
}

function buildTouchTheaterChrome(root) {
  const surface = document.createElement('div');
  surface.className = 'te-tt-surface';
  const top = document.createElement('div');
  top.className = 'te-tt-top';
  top.innerHTML = `<span class="te-tt-title"></span><button type="button" class="te-touch-hbtn te-tt-exit">${touchTheaterSvg('exit')}</button>`;
  const ring = document.createElement('div');
  ring.className = 'te-tt-ring';
  ring.setAttribute('role', 'status');
  ring.innerHTML = '<b></b><div class="te-tt-ring-c"><svg viewBox="0 0 84 84" aria-hidden="true"><circle class="te-tt-trk" cx="42" cy="42" r="36"/>'
    + `<circle class="te-tt-arc" cx="42" cy="42" r="36" style="stroke-dasharray:${TOUCH_THEATER_RING_C.toFixed(2)}"/></svg><span class="te-tt-ring-ic"></span></div>`;
  const seek = document.createElement('div');
  seek.className = 'te-tt-seek';
  seek.setAttribute('role', 'status');
  seek.innerHTML = '<div><b></b><i></i></div><small></small>';
  const hint = document.createElement('div');
  hint.className = 'te-tt-hint';
  hint.innerHTML = '<i class="te-tt-zone left"></i><i class="te-tt-zone right"></i><span></span>';
  const slot = root.querySelector('.te-player-slot');
  slot?.after(surface);
  root.append(top, ring, seek, hint);
  top.querySelector('.te-tt-exit').addEventListener('click', (event) => { event.preventDefault(); event.stopPropagation(); exitTouchTheater(); });

  // Gestures start on the video surface or on the subtitle; buttons, bar, sheets and the top row keep their own taps.
  const kindOf = (target) => {
    if (!touchTheater.active || target?.closest?.('button, a, input, select, textarea, label, .te-touch-sheet, .te-modal-backdrop, .te-control-bar, .te-tt-top')) return null;
    if (target?.closest?.('.te-tt-surface')) return 'video';
    return target?.closest?.('.te-sub-container') ? 'sub' : null;
  };
  root.addEventListener('pointerdown', (event) => {
    if (touchTheater.active && root.classList.contains('te-tt-hint-on')) dismissTouchTheaterHint();
    touchTheater.gesture = null;
    const kind = kindOf(event.target);
    if (!kind || event.button > 0) return;
    if (closeTouchTheaterPopups(root)) return;
    if (touchHeartOnDown(event)) return;
    const rect = surface.getBoundingClientRect();
    const x = event.clientX - rect.left, y = event.clientY - rect.top;
    let zone = null;
    if (y > TOUCH_THEATER_EDGE && y < rect.height - TOUCH_THEATER_EDGE && x > TOUCH_THEATER_EDGE && x < rect.width - TOUCH_THEATER_EDGE) {
      if (kind === 'sub') zone = x < rect.width / 2 ? 'vol' : 'bri';
      else zone = x < rect.width * 0.4 ? 'vol' : x > rect.width * 0.6 ? 'bri' : 'mid';
    }
    touchTheater.gesture = { kind, x: event.clientX, y: event.clientY, y0: event.clientY, width: rect.width, height: rect.height, zone, mode: null, start: zone === 'vol' ? touchTheater.vol : touchTheater.bri, t: performance.now() };
  }, true);
  root.addEventListener('pointermove', (event) => {
    const gesture = touchTheater.gesture;
    if (!gesture) return;
    if (touchSelectOwns(event)) { gesture.mode = 'select'; return; }
    const dx = event.clientX - gesture.x, dy = gesture.y - event.clientY;
    if (!gesture.mode) {
      if (Math.hypot(dx, dy) <= TOUCH_THEATER_SWIPE) return;
      const media = state?.activeMedia;
      if (!gesture.zone) gesture.mode = 'move';
      else if (Math.abs(dx) > Math.abs(dy)) {
        const duration = media?.duration;
        if (!media || !Number.isFinite(duration) || duration <= 0) gesture.mode = 'move';
        else Object.assign(gesture, { mode: 'seek', from: media.currentTime, target: media.currentTime, x: event.clientX, span: Math.min(duration, TOUCH_THEATER_SEEK_MAX), duration });
      } else if (gesture.zone === 'mid') gesture.mode = dy < 0 ? 'exit' : 'move';
      else { gesture.mode = 'swipe'; gesture.y = event.clientY; }
      return;
    }
    if (gesture.mode === 'seek') {
      gesture.target = Math.min(gesture.duration, Math.max(0, gesture.from + (event.clientX - gesture.x) / gesture.width * gesture.span));
      showTouchTheaterSeek(gesture);
      return;
    }
    if (gesture.mode !== 'swipe') return;
    const span = gesture.height * 0.75;
    if (gesture.zone === 'vol') touchTheater.vol = Math.min(100, Math.max(0, gesture.start + dy / span * 100));
    else touchTheater.bri = Math.min(TOUCH_THEATER_BRI_MAX, Math.max(0, gesture.start + dy / span * TOUCH_THEATER_BRI_MAX));
    showTouchTheaterRing(gesture.zone);
  }, true);
  root.addEventListener('pointerup', (event) => {
    const gesture = touchTheater.gesture;
    touchTheater.gesture = null;
    if (!gesture || gesture.mode === 'select' || touchSelectOwns(event)) return;
    // The click that follows a swipe never reaches the subtitle or the video.
    if (gesture.mode) touchTap.suppressUntil = performance.now() + 400;
    if (gesture.mode === 'swipe') hideTouchTheaterRing();
    else if (gesture.mode === 'seek') {
      hideTouchTheaterSeek();
      const media = state?.activeMedia;
      if (media && Math.abs(gesture.target - gesture.from) >= 0.5) media.currentTime = gesture.target;
    } else if (gesture.mode === 'exit') {
      if (event.clientY - gesture.y0 > TOUCH_THEATER_EXIT_PX) exitTouchTheater();
    } else if (!gesture.mode && performance.now() - gesture.t < 500) {
      touchTapUp(event, gesture.kind === 'sub' ? () => { togglePlay(); pulseControl('Phát/Tạm dừng'); } : toggleTouchTheaterControls);
    }
  }, true);
  root.addEventListener('pointercancel', () => {
    if (touchTheater.gesture?.mode === 'swipe') hideTouchTheaterRing();
    if (touchTheater.gesture?.mode === 'seek') hideTouchTheaterSeek();
    touchTheater.gesture = null;
  }, true);
  // Any control keeps the bar visible for another 3 s.
  root.querySelector('.te-control-bar')?.addEventListener('click', () => { if (touchTheater.active) showTouchTheaterControls(); }, true);
}

function setupTouchTheater(root) {
  if (touchTheater.root) return;
  touchTheater.root = root;
  buildTouchTheaterChrome(root);
  touchTheater.query = globalThis.matchMedia?.(TOUCH_THEATER_QUERY) || null;
  Promise.resolve(globalThis.browser?.storage?.local?.get(TOUCH_THEATER_HINT_KEY)).then((stored) => {
    if (stored?.[TOUCH_THEATER_HINT_KEY] !== true) return;
    touchTheater.hintSeen = true;
    root.classList.remove('te-tt-hint-on');
  }, () => {});
  touchTheater.query?.addEventListener?.('change', syncTouchTheater);
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && touchTheater.forced) exitTouchTheater();
  });
  new MutationObserver(() => {
    const hint = root.querySelector('.te-tt-hint span');
    if (hint) hint.innerHTML = `${escapeHtml(touchOverlayText('gestureHint'))}<br>${escapeHtml(touchOverlayText('gestureHint2'))}<em>${escapeHtml(touchOverlayText('hintClose'))}</em>`;
    root.querySelectorAll('.te-tt-zone.left').forEach((zone) => { zone.textContent = touchOverlayText('volume'); });
    root.querySelectorAll('.te-tt-zone.right').forEach((zone) => { zone.textContent = touchOverlayText('brightness'); });
    syncTouchTheater();
  }).observe(root, { attributes: true, attributeFilter: ['class'] });
  syncTouchTheater();
}

globalThis.LHN_TOUCH_THEATER = Object.freeze({
  setup: setupTouchTheater,
  isActive: () => touchTheater.active,
  enter: enterTouchTheater,
  exit: exitTouchTheater,
  showControls: showTouchTheaterControls,
});
