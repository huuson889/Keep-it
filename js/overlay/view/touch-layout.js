// Overlay layout for touch devices (phones, touch tablets) and narrow portrait windows.
// One layout for Video and Web, every view mode: header · card (live player thumbnail, tap to enlarge) ·
// current sentence · transcript · 6-button control bar with a "More" sheet. Desktop layout is untouched:
// everything here is keyed on `.te-touch-layout`, which is only set while TOUCH_OVERLAY_QUERY matches.
// Controls in the More sheet click the original buttons, so no feature or handler is duplicated.
const TOUCH_OVERLAY_QUERY = '(max-width: 599.98px) and (orientation: portrait), (max-width: 899.98px) and (orientation: portrait) and (pointer: coarse)';
const TOUCH_OVERLAY_COMPACT_KEY = 'lhnTouchOverlayCompact';
const TOUCH_OVERLAY_MORE = [
  '#te-control-add-vocabulary', '#te-notes-sidebar-toggle', '#te-control-audio', '#te-control-repeat',
  '#te-shadowing-mode-btn', '#te-dictation-mode-btn', '#te-control-fullscreen', '#te-settings-btn',
];
const TOUCH_OVERLAY_TEXT = {
  en: { more: 'More', close: 'Close', enlarge: 'Show video', shrink: 'Shrink video' },
  vi: { more: 'Thêm', close: 'Đóng', enlarge: 'Phóng to video', shrink: 'Thu nhỏ video' },
  ko: { more: '더보기', close: '닫기', enlarge: '영상 크게 보기', shrink: '영상 작게 보기' },
};
const TOUCH_OVERLAY_ICONS = {
  more: '<circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/>',
  close: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  enlarge: '<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>',
  shrink: '<path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7"/>',
};
let touchOverlayCompact = true;

function touchOverlayText(key) {
  const lang = state?.displayLanguage || globalThis.LHN_LANGUAGES?.detectLanguage?.() || 'en';
  return (TOUCH_OVERLAY_TEXT[lang] || TOUCH_OVERLAY_TEXT.en)[key];
}

function touchOverlayIcon(name, fill) {
  const paint = fill ? 'fill="currentColor"' : 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  return `<svg viewBox="0 0 24 24" width="20" height="20" ${paint} aria-hidden="true">${TOUCH_OVERLAY_ICONS[name]}</svg>`;
}

function touchOverlayActive() {
  return Boolean(overlayEl()?.classList.contains('te-touch-layout'));
}

function syncTouchOverlayHeader() {
  const root = overlayEl();
  const header = root?.querySelector('.te-touch-header');
  if (!header) return;
  const title = root.querySelector('.yt-dual-sidebar-header > span')?.textContent?.trim() || 'Keepit';
  header.querySelector('.te-touch-title').textContent = title.replace(/\s+-\s+/, ' · ');
  const toggle = header.querySelector('.te-touch-size');
  const label = touchOverlayText(touchOverlayCompact ? 'enlarge' : 'shrink');
  toggle.innerHTML = touchOverlayIcon(touchOverlayCompact ? 'enlarge' : 'shrink');
  toggle.title = label;
  toggle.setAttribute('aria-label', label);
  toggle.setAttribute('aria-pressed', String(!touchOverlayCompact));
  const close = header.querySelector('.te-touch-close');
  close.title = touchOverlayText('close');
  close.setAttribute('aria-label', close.title);
  const more = root.querySelector('#te-touch-more-btn');
  if (more) { more.title = touchOverlayText('more'); more.setAttribute('aria-label', more.title); }
  const source = root.querySelector('.te-touch-source');
  if (source) {
    let host = '';
    try { host = new URL(state?.sourceType === 'web' ? (state.webSourceUrl || location.href) : location.href).hostname.replace(/^(www|m)\./i, ''); } catch {}
    source.textContent = state?.sourceType === 'web' ? host.toUpperCase() : 'YouTube';
  }
}

function setTouchOverlayCompact(compact, persist = true) {
  touchOverlayCompact = Boolean(compact);
  overlayEl()?.classList.toggle('te-touch-compact', touchOverlayCompact);
  syncTouchOverlayHeader();
  if (persist) globalThis.browser?.storage?.local?.set({ [TOUCH_OVERLAY_COMPACT_KEY]: touchOverlayCompact }).catch?.(() => {});
  requestAnimationFrame(() => { if (state?.open) alignActiveTranscriptFocus('auto'); });
}

function closeTouchOverlaySheet() {
  overlayEl()?.querySelector('.te-touch-sheet')?.classList.remove('open');
}

function openTouchOverlaySheet() {
  const root = overlayEl();
  const sheet = root?.querySelector('.te-touch-sheet');
  if (!sheet) return;
  const list = sheet.querySelector('.te-touch-sheet-list');
  list.replaceChildren();
  for (const selector of TOUCH_OVERLAY_MORE) {
    const target = root.querySelector(selector);
    if (!target || target.hidden || target.disabled) continue;
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'te-touch-row';
    if (target.getAttribute('aria-pressed') === 'true' || target.classList.contains('active') || target.classList.contains('te-active')) row.classList.add('on');
    const icon = target.querySelector('svg')?.cloneNode(true);
    if (icon) { icon.setAttribute('width', '20'); icon.setAttribute('height', '20'); row.append(icon); }
    const label = document.createElement('span');
    label.textContent = target.getAttribute('aria-label') || target.title || '';
    row.append(label);
    row.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      closeTouchOverlaySheet();
      target.click();
    });
    list.append(row);
  }
  sheet.querySelector('.te-touch-sheet-title').textContent = touchOverlayText('more');
  sheet.classList.add('open');
}

function buildTouchOverlayChrome(root) {
  const logo = root.querySelector('.te-sidebar-logo')?.outerHTML || '';
  const header = document.createElement('div');
  header.className = 'te-touch-header';
  header.innerHTML = `<span class="te-touch-brand">${logo}<span class="te-touch-title">Keepit</span></span>`
    + '<button type="button" class="te-touch-hbtn te-touch-size"></button>'
    + `<button type="button" class="te-touch-hbtn te-touch-close">${touchOverlayIcon('close')}</button>`;
  root.insertBefore(header, root.querySelector('.te-left-section'));
  header.querySelector('.te-touch-size').addEventListener('click', (event) => {
    event.preventDefault();
    setTouchOverlayCompact(!touchOverlayCompact);
  });
  header.querySelector('.te-touch-close').addEventListener('click', (event) => {
    event.preventDefault();
    root.querySelector('.yt-dual-close-btn')?.click();
  });

  const info = root.querySelector('.te-reading-mini-info');
  if (info && !info.querySelector('.te-touch-source')) {
    const source = document.createElement('div');
    source.className = 'te-touch-source';
    info.prepend(source);
  }
  // Tapping the compact card (anywhere except its play button) enlarges the player.
  root.querySelector('.te-reading-mini-audio')?.addEventListener('click', (event) => {
    if (!touchOverlayActive() || !touchOverlayCompact || event.target.closest('.te-reading-mini-play')) return;
    event.preventDefault();
    setTouchOverlayCompact(false);
  });

  const bar = root.querySelector('.te-control-bar');
  if (bar && !bar.querySelector('#te-touch-more-btn')) {
    const more = document.createElement('button');
    more.type = 'button';
    more.className = 'te-icon-btn';
    more.id = 'te-touch-more-btn';
    more.innerHTML = touchOverlayIcon('more', true);
    more.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (root.querySelector('.te-touch-sheet')?.classList.contains('open')) closeTouchOverlaySheet();
      else openTouchOverlaySheet();
    });
    bar.append(more);
  }

  const sheet = document.createElement('div');
  sheet.className = 'te-touch-sheet';
  sheet.innerHTML = '<div class="te-touch-scrim"></div><div class="te-touch-panel" role="menu"><div class="te-touch-grip"></div>'
    + '<div class="te-touch-sheet-title"></div><div class="te-touch-sheet-list"></div></div>';
  sheet.querySelector('.te-touch-scrim').addEventListener('click', closeTouchOverlaySheet);
  let dragStart = null;
  const panel = sheet.querySelector('.te-touch-panel');
  panel.addEventListener('touchstart', (event) => { dragStart = event.touches[0].clientY; }, { passive: true });
  panel.addEventListener('touchmove', (event) => {
    if (dragStart === null) return;
    const dy = Math.max(0, event.touches[0].clientY - dragStart);
    panel.style.transform = dy ? `translateY(${dy}px)` : '';
  }, { passive: true });
  panel.addEventListener('touchend', (event) => {
    const dy = dragStart === null ? 0 : event.changedTouches[0].clientY - dragStart;
    dragStart = null;
    panel.style.transform = '';
    if (dy > 70) closeTouchOverlaySheet();
  });
  root.append(sheet);
}

function setupTouchOverlayLayout() {
  const root = overlayEl();
  if (!root || root.querySelector('.te-touch-header')) return;
  buildTouchOverlayChrome(root);
  const query = globalThis.matchMedia?.(TOUCH_OVERLAY_QUERY);
  const apply = () => {
    const active = Boolean(query?.matches);
    const changed = root.classList.contains('te-touch-layout') !== active;
    root.classList.toggle('te-touch-layout', active);
    root.classList.toggle('te-touch-compact', active && touchOverlayCompact);
    if (!active) closeTouchOverlaySheet();
    syncTouchOverlayHeader();
    if (changed && state?.open) requestAnimationFrame(() => { syncTheaterFrame(); alignActiveTranscriptFocus('auto'); });
  };
  query?.addEventListener?.('change', apply);
  apply();
  // Keep the header title and card source current when a new source opens (the title span is localized/updated).
  const title = root.querySelector('.yt-dual-sidebar-header > span');
  if (title && typeof MutationObserver === 'function') new MutationObserver(syncTouchOverlayHeader).observe(title, { childList: true, characterData: true, subtree: true });
  new MutationObserver(() => {
    if (!root.classList.contains('te-hidden')) syncTouchOverlayHeader();
    else closeTouchOverlaySheet();
  }).observe(root, { attributes: true, attributeFilter: ['class'] });
  Promise.resolve(globalThis.browser?.storage?.local?.get(TOUCH_OVERLAY_COMPACT_KEY)).then((stored) => {
    if (typeof stored?.[TOUCH_OVERLAY_COMPACT_KEY] === 'boolean') setTouchOverlayCompact(stored[TOUCH_OVERLAY_COMPACT_KEY], false);
  }, () => {});
}
