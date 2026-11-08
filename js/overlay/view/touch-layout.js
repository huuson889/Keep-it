// Overlay layout for touch devices (phones, touch tablets) and narrow portrait windows.
// One layout for Video and Web, every view mode: header · card (live player thumbnail, tap to enlarge) ·
// current sentence (♥ favourite video · Fullscreen corners) · transcript ·
// bar [CC][speed] · [prev play next] · [repeat][More]. Desktop layout is untouched:
// everything here is keyed on `.te-touch-layout` (portrait) or `.te-touch-theater` (phone landscape, touch-theater.js).
// Controls in the More sheet click the original buttons, so no feature or handler is duplicated; only ♥ is new.
const TOUCH_OVERLAY_QUERY = '(max-width: 599.98px) and (orientation: portrait), (max-width: 899.98px) and (orientation: portrait) and (pointer: coarse)';
const TOUCH_OVERLAY_COMPACT_KEY = 'lhnTouchOverlayCompact';
const TOUCH_TAP_GAP = 280;     // ms between taps that make a double tap (heart)
const TOUCH_TAP_SLOP = 60;     // px between the two taps
const TOUCH_STREAK_GAP = 650;  // ms: further taps after a heart keep adding hearts (TikTok streak)
const TOUCH_SUB_MIN_PX = 12;   // auto-fit never shrinks subtitles below this
const TOUCH_PALETTE = ['def', '#ffffff', '#ffff00', '#00ff00', '#00ffff', '#ff0000', '#ff00ff', '#8b5cf6'];
const TOUCH_OVERLAY_TEXT = {
  en: {
    more: 'More', close: 'Close', enlarge: 'Show video', shrink: 'Shrink video', study: 'Study',
    shadowing: 'Speaking practice', shadowingSub: 'Listen and repeat', dictation: 'Dictation', dictationSub: 'Listen and type',
    theme: 'Theme', subOptions: 'Subtitle options', subLanguage: 'Subtitle language', notes: 'Notes', art: 'Art mode', settings: 'Settings',
    favorite: 'Favorite', favAdded: 'Added to favorites', favRemoved: 'Removed from favorites', fullscreen: 'Fullscreen', exitFullscreen: 'Exit fullscreen',
    repeat: 'Repeat sentence', volume: 'Volume', brightness: 'Brightness', auto: 'Auto', gestureHint: 'Swipe left side: volume · right side: brightness',
    size: 'Text size', small: 'Small', medium: 'Medium', large: 'Large', mainLine: 'Primary subtitle', translationLine: 'Translated subtitle',
    tabVideo: 'Video', tabSide: 'Sidebar', advanced: 'Advanced', white: 'White', grey: 'Grey', yellow: 'Yellow', green: 'Green', cyan: 'Cyan', red: 'Red', pink: 'Pink', purple: 'Purple', defaultColor: 'Default',
    previewMain: 'Keep exploring everything', previewTranslation: 'Translation appears here',
  },
  vi: {
    more: 'Thêm', close: 'Đóng', enlarge: 'Phóng to video', shrink: 'Thu nhỏ video', study: 'Học',
    shadowing: 'Luyện nói', shadowingSub: 'Nghe và nói lại', dictation: 'Chép chính tả', dictationSub: 'Nghe và gõ lại',
    theme: 'Chủ đề', subOptions: 'Tùy chọn phụ đề', subLanguage: 'Ngôn ngữ phụ đề', notes: 'Ghi chú', art: 'Chế độ nghệ thuật', settings: 'Cài đặt',
    favorite: 'Yêu thích', favAdded: 'Đã thêm vào yêu thích', favRemoved: 'Đã bỏ yêu thích', fullscreen: 'Toàn màn hình', exitFullscreen: 'Thoát toàn màn hình',
    repeat: 'Lặp lại câu', volume: 'Âm lượng', brightness: 'Độ sáng', auto: 'Tự động', gestureHint: 'Vuốt bên trái: âm lượng · bên phải: độ sáng',
    size: 'Cỡ chữ', small: 'Nhỏ', medium: 'TB', large: 'Lớn', mainLine: 'Phụ đề chính', translationLine: 'Phụ đề dịch',
    tabVideo: 'Video', tabSide: 'Thanh bên', advanced: 'Nâng cao', white: 'Trắng', grey: 'Xám', yellow: 'Vàng', green: 'Xanh lá', cyan: 'Xanh lơ', red: 'Đỏ', pink: 'Hồng', purple: 'Tím', defaultColor: 'Mặc định',
    previewMain: 'Keep exploring everything', previewTranslation: 'Bản dịch hiển thị ở đây',
  },
  ko: {
    more: '더보기', close: '닫기', enlarge: '영상 크게 보기', shrink: '영상 작게 보기', study: '학습',
    shadowing: '말하기 연습', shadowingSub: '듣고 따라 말하기', dictation: '받아쓰기', dictationSub: '듣고 입력하기',
    theme: '테마', subOptions: '자막 옵션', subLanguage: '자막 언어', notes: '노트', art: '아트 모드', settings: '설정',
    favorite: '즐겨찾기', favAdded: '즐겨찾기에 추가됨', favRemoved: '즐겨찾기에서 제거됨', fullscreen: '전체 화면', exitFullscreen: '전체 화면 종료',
    repeat: '문장 반복', volume: '볼륨', brightness: '밝기', auto: '자동', gestureHint: '왼쪽 스와이프: 볼륨 · 오른쪽: 밝기',
    size: '글자 크기', small: '작게', medium: '보통', large: '크게', mainLine: '원문 자막', translationLine: '번역 자막',
    tabVideo: '동영상', tabSide: '사이드바', advanced: '고급', white: '흰색', grey: '회색', yellow: '노랑', green: '초록', cyan: '하늘색', red: '빨강', pink: '분홍', purple: '보라', defaultColor: '기본값',
    previewMain: 'Keep exploring everything', previewTranslation: '번역이 여기에 표시됩니다',
  },
};
const TOUCH_SWATCH_NAMES = { '#ffffff': 'white', '#ffff00': 'yellow', '#00ff00': 'green', '#00ffff': 'cyan', '#ff0000': 'red', '#ff00ff': 'pink', '#8b5cf6': 'purple' };
const TOUCH_HEART_PATH = 'M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.5 5.5 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5Z';
const TOUCH_OVERLAY_ICONS = {
  more: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  close: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  enlarge: '<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>',
  shrink: '<path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7"/>',
  heart: `<path d="${TOUCH_HEART_PATH}"/>`,
  fullscreen: '<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>',
  repeat1: '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/><path d="M11 10h1v4"/>',
  shadowing: '<path d="M12 19v3"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><rect x="9" y="2" width="6" height="13" rx="3"/>',
  dictation: '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
  subOptions: '<path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/>',
  subLanguage: '<path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/>',
  notes: '<path d="M2 6h4M2 10h4M2 14h4M2 18h4"/><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9.5 8h5M9.5 12H16M9.5 16H14"/>',
  art: '<path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/><path d="M20 2v4"/><path d="M22 4h-4"/><circle cx="4" cy="20" r="2"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
};
let touchOverlayCompact = true;
let touchFavoriteIds = new Set();
let touchSubTab = 'video';

function touchOverlayText(key) {
  const lang = state?.displayLanguage || globalThis.LHN_LANGUAGES?.detectLanguage?.() || 'en';
  return (TOUCH_OVERLAY_TEXT[lang] || TOUCH_OVERLAY_TEXT.en)[key] ?? TOUCH_OVERLAY_TEXT.en[key] ?? key;
}

function touchOverlayIcon(name, fill) {
  const paint = fill ? 'fill="currentColor"' : 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  return `<svg viewBox="0 0 24 24" width="20" height="20" ${paint} aria-hidden="true">${TOUCH_OVERLAY_ICONS[name]}</svg>`;
}

function touchOverlayActive() {
  return Boolean(overlayEl()?.classList.contains('te-touch-layout'));
}

// Any touch chrome (portrait layout or phone-landscape theater) is showing.
function touchChromeActive() {
  const root = overlayEl();
  return Boolean(root && (root.classList.contains('te-touch-layout') || root.classList.contains('te-touch-theater')) && !root.classList.contains('te-study-active'));
}

function syncTouchOverlayHeader() {
  const root = overlayEl();
  const header = root?.querySelector('.te-touch-header');
  if (!header) return;
  const title = root.querySelector('.yt-dual-sidebar-header > span')?.textContent?.trim() || 'Keepit';
  header.querySelector('.te-touch-title').textContent = title.replace(/\s+-\s+/, ' · ');
  const theaterTitle = root.querySelector('.te-tt-title');
  if (theaterTitle) theaterTitle.textContent = touchVideoTitle() || title;
  const toggle = header.querySelector('.te-touch-size');
  const label = touchOverlayText(touchOverlayCompact ? 'enlarge' : 'shrink');
  toggle.innerHTML = touchOverlayIcon(touchOverlayCompact ? 'enlarge' : 'shrink');
  toggle.title = label;
  toggle.setAttribute('aria-label', label);
  toggle.setAttribute('aria-pressed', String(!touchOverlayCompact));
  const close = header.querySelector('.te-touch-close');
  close.title = touchOverlayText('close');
  close.setAttribute('aria-label', close.title);
  const labelled = [['#te-touch-more-btn', 'more'], ['#te-touch-fs-btn', 'fullscreen'], ['.te-tt-exit', 'exitFullscreen']];
  for (const [selector, key] of labelled) {
    const button = root.querySelector(selector);
    if (button) { button.title = touchOverlayText(key); button.setAttribute('aria-label', button.title); }
  }
  syncTouchFavoriteButtons();
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
  requestAnimationFrame(() => { if (state?.open) { fitTouchSubtitle(); alignActiveTranscriptFocus('auto'); } });
}

// ---------- Favourite videos (♥): lhnFavoriteVideos, one entry per canonical YouTube video id ----------
function touchFavoriteStorageKey() {
  return globalThis.LHN_CONFIG?.STORAGE_KEYS?.FAVORITE_VIDEOS || 'lhnFavoriteVideos';
}

function touchVideoId() {
  if (state?.sourceType === 'web') return '';
  return globalThis.LHN_THUMBNAILS?.youtubeVideoId?.(location.href) || '';
}

// The video's own title (the overlay header only says "Keepit - Video").
function touchVideoTitle() {
  const clean = (value) => String(value || '').replace(/\s+/g, ' ').replace(/\s*[-|]\s*YouTube\s*$/i, '').trim();
  const heading = clean(document.querySelector('h1.ytd-watch-metadata, ytd-watch-metadata h1, .slim-video-information-title, ytm-slim-video-metadata-section-renderer h2')?.textContent);
  const title = heading || clean(document.title);
  return /^(youtube|keepit)$/i.test(title) ? '' : title;
}

function touchVideoMeta() {
  const title = touchVideoTitle();
  const channel = document.querySelector('ytd-watch-metadata ytd-channel-name a, #owner ytd-channel-name a, .slim-owner-channel-name, ytm-slim-owner-renderer .slim-owner-channel-name')?.textContent?.trim() || '';
  return { title: title.slice(0, 300), channel: channel.slice(0, 200) };
}

function syncTouchFavoriteButtons(beat = false) {
  const root = overlayEl();
  if (!root) return;
  const id = touchVideoId();
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
    touchFavoriteIds = new Set(list.map((entry) => entry?.videoId).filter(Boolean));
  } catch { touchFavoriteIds = new Set(); }
  syncTouchFavoriteButtons();
}

async function setTouchFavorite(on) {
  const id = touchVideoId();
  if (!id) return false;
  const key = touchFavoriteStorageKey();
  const stored = await globalThis.browser.storage.local.get(key);
  const list = Array.isArray(stored?.[key]) ? stored[key] : [];
  const has = list.some((entry) => entry?.videoId === id);
  if (has !== on) {
    const rest = list.filter((entry) => entry?.videoId !== id);
    const next = on ? [{ videoId: id, ...touchVideoMeta(), addedAt: Date.now() }, ...rest] : rest;
    await globalThis.browser.storage.local.set({ [key]: next });
    touchFavoriteIds = new Set(next.map((entry) => entry?.videoId).filter(Boolean));
    showViewToast(touchOverlayText(on ? 'favAdded' : 'favRemoved'));
  }
  syncTouchFavoriteButtons(on);
  return true;
}

// Beat + 2 ripples + 10 small hearts: the same click effect as the Dashboard and dictionary hearts.
function playTouchHeartBurst(button) {
  const burst = document.createElement('span');
  burst.className = 'te-touch-burst';
  burst.innerHTML = '<b></b><b></b>' + Array.from({ length: 10 }, (_, i) => {
    const angle = i / 10 * Math.PI * 2, radius = 34 + (i % 3) * 8;
    return `<i style="--x:${(Math.cos(angle) * radius).toFixed(1)}px;--y:${(Math.sin(angle) * radius).toFixed(1)}px"><svg viewBox="0 0 24 24" fill="currentColor"><path d="${TOUCH_HEART_PATH}"/></svg></i>`;
  }).join('');
  button.append(burst);
  setTimeout(() => burst.remove(), 900);
}

function onTouchFavoriteClick(event) {
  event.preventDefault();
  event.stopPropagation();
  const button = event.currentTarget;
  const adding = !button.classList.contains('on');
  if (adding) playTouchHeartBurst(button);
  setTouchFavorite(adding).catch(() => {});
  globalThis.LHN_TOUCH_THEATER?.showControls?.();
}

// ---------- TikTok-style double tap: a heart at every quick tap, favourites the video ----------
const touchTap = { lastUp: 0, x: 0, y: 0, streak: 0, timer: 0, suppressUntil: 0, heartN: 0 };

function spawnTouchTapHeart(x, y) {
  const root = overlayEl();
  if (!root) return;
  const heart = document.createElement('div');
  const id = `te-tap-heart-g${++touchTap.heartN}`;
  heart.className = 'te-tap-heart';
  heart.style.left = `${x}px`;
  heart.style.top = `${y}px`;
  heart.style.setProperty('--r', `${(Math.random() * 50 - 25).toFixed(1)}deg`);
  heart.innerHTML = `<span class="te-tap-heart-glow"></span><span class="te-tap-heart-pop"><svg viewBox="0 0 24 24"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff6b95"/><stop offset="1" stop-color="#ff2d55"/></linearGradient></defs><path fill="url(#${id})" d="${TOUCH_HEART_PATH}"/></svg></span>`;
  root.append(heart);
  setTimeout(() => heart.remove(), 1000);
}

// Called on pointerdown inside a heart zone. Returns true when this tap is a (streak) double tap.
function touchHeartOnDown(event) {
  if (!touchChromeActive() || !touchVideoId() || event.button > 0) return false;
  const now = performance.now();
  const double = now - touchTap.lastUp < TOUCH_TAP_GAP && Math.hypot(event.clientX - touchTap.x, event.clientY - touchTap.y) < TOUCH_TAP_SLOP;
  if (!double && now - touchTap.streak > TOUCH_STREAK_GAP) return false;
  clearTimeout(touchTap.timer);
  touchTap.timer = 0;
  touchTap.lastUp = 0;
  touchTap.streak = now;
  touchTap.suppressUntil = now + 500;
  spawnTouchTapHeart(event.clientX, event.clientY);
  if (!touchFavoriteIds.has(touchVideoId())) setTouchFavorite(true).catch(() => {});
  else syncTouchFavoriteButtons(true);
  return true;
}

// Remembers a short tap; `single` (optional) runs only if no second tap follows within TOUCH_TAP_GAP.
function touchTapUp(event, single) {
  touchTap.lastUp = performance.now();
  touchTap.x = event.clientX;
  touchTap.y = event.clientY;
  clearTimeout(touchTap.timer);
  touchTap.timer = single ? setTimeout(() => { touchTap.timer = 0; single(); }, TOUCH_TAP_GAP) : 0;
}

function setupTouchDoubleTap(root) {
  const zoneOf = (target) => target?.closest?.('button, a, input, select, textarea, label, .te-touch-sheet, .te-modal-backdrop') ? null
    : target?.closest?.('.te-player-frame, .te-sub-container, .yt-dual-transcript-list');
  let down = null;
  root.addEventListener('pointerdown', (event) => {
    down = null;
    if (!touchChromeActive() || root.classList.contains('te-touch-compact') && event.target.closest?.('.te-player-slot')) return;
    if (!zoneOf(event.target)) return;
    if (touchHeartOnDown(event)) return;
    down = { x: event.clientX, y: event.clientY, t: performance.now(), player: Boolean(event.target.closest('.te-player-frame')) };
  }, true);
  root.addEventListener('pointermove', (event) => {
    if (down && Math.hypot(event.clientX - down.x, event.clientY - down.y) > 10) down = null;
  }, true);
  root.addEventListener('pointercancel', () => { down = null; }, true);
  root.addEventListener('pointerup', (event) => {
    if (!down) return;
    const tap = down;
    down = null;
    if (performance.now() - tap.t > 500) return;
    // On the video a single tap plays/pauses, delayed so a second tap can turn it into a heart.
    touchTapUp(event, tap.player ? () => { togglePlay(); pulseControl('Phát/Tạm dừng'); } : null);
  }, true);
  // The player's own click handler (play/pause) is replaced by the delayed single tap above; the click of a heart tap is swallowed.
  root.addEventListener('click', (event) => {
    if (!touchChromeActive()) return;
    const zone = zoneOf(event.target);
    if (!zone) return;
    if (performance.now() < touchTap.suppressUntil || zone.classList.contains('te-player-frame')) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);
  root.addEventListener('dblclick', (event) => {
    if (touchChromeActive() && zoneOf(event.target)) { event.preventDefault(); event.stopImmediatePropagation(); }
  }, true);
}

// ---------- Subtitle auto-fit: the sentence box has a fixed height; long text shrinks instead of scrolling ----------
let touchFitRaf = 0;
function fitTouchSubtitle() {
  const root = overlayEl();
  const box = root?.querySelector('.te-sub-container');
  const content = box?.querySelector('.te-subtitle-content');
  if (!root || !content) return;
  root.style.removeProperty('--te-touch-fit');
  if (!root.classList.contains('te-touch-layout') || root.classList.contains('te-study-active') || !box.clientHeight) return;
  const style = getComputedStyle(box);
  const available = box.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
  const en = root.querySelector('#te-sub-en-text');
  const vi = root.querySelector('#te-sub-vi-text');
  // .te-subtitle-content can be `display: contents`, so measure the two lines themselves.
  const needed = () => {
    const lines = [en, vi].filter((line) => line && line.offsetHeight > 0);
    if (!lines.length) return 0;
    return lines[lines.length - 1].getBoundingClientRect().bottom - lines[0].getBoundingClientRect().top;
  };
  const baseSize = parseFloat(getComputedStyle(en).fontSize) || 18;
  const minFit = Math.min(1, TOUCH_SUB_MIN_PX / baseSize);
  let fit = 1;
  for (let i = 0; i < 5 && needed() > available + 1 && fit > minFit; i += 1) {
    fit = Math.max(minFit, fit * Math.max(0.6, available / needed()));
    root.style.setProperty('--te-touch-fit', fit.toFixed(3));
  }
}
function scheduleTouchSubtitleFit() {
  if (touchFitRaf) return;
  touchFitRaf = requestAnimationFrame(() => { touchFitRaf = 0; fitTouchSubtitle(); });
}

// ---------- More sheet: Study cards + quick tiles; every tile clicks the original control ----------
function closeTouchOverlaySheet() {
  overlayEl()?.querySelector('.te-touch-sheet')?.classList.remove('open');
}

function syncTouchSheetTiles() {
  const root = overlayEl();
  const sheet = root?.querySelector('.te-touch-sheet');
  if (!sheet) return;
  const dark = root.classList.contains('theme-dark');
  const theme = sheet.querySelector('[data-touch-act="theme"] .te-touch-ic');
  if (theme) theme.innerHTML = touchOverlayIcon(dark ? 'moon' : 'sun');
  sheet.querySelector('[data-touch-act="art"]')?.classList.toggle('on', Boolean(root.querySelector('#te-ambient-toggle')?.checked));
  for (const [key, text] of [['study', 'study'], ['shadowing', 'shadowing'], ['shadowingSub', 'shadowingSub'], ['dictation', 'dictation'], ['dictationSub', 'dictationSub'],
    ['theme', 'theme'], ['subopt', 'subOptions'], ['sublang', 'subLanguage'], ['notes', 'notes'], ['art', 'art'], ['settings', 'settings']]) {
    sheet.querySelectorAll(`[data-touch-text="${key}"]`).forEach((el) => { el.textContent = touchOverlayText(text); });
  }
}

function openTouchOverlaySheet() {
  const sheet = overlayEl()?.querySelector('.te-touch-sheet');
  if (!sheet) return;
  syncTouchSheetTiles();
  sheet.classList.add('open');
}

function runTouchSheetAction(action) {
  const root = overlayEl();
  const click = (selector) => root.querySelector(selector)?.click();
  const keepOpen = action === 'theme' || action === 'art';
  if (!keepOpen) closeTouchOverlaySheet();
  if (action === 'shadowing') click('#te-shadowing-mode-btn');
  else if (action === 'dictation') click('#te-dictation-mode-btn');
  else if (action === 'theme') click('#toggle-theme-btn');
  else if (action === 'subopt') click('#open-sub-modal');
  else if (action === 'sublang') click('#open-lang-modal');
  else if (action === 'notes') click('#te-notes-sidebar-toggle');
  else if (action === 'settings') click('#te-settings-btn');
  else if (action === 'art') {
    const toggle = root.querySelector('#te-ambient-toggle');
    if (toggle) { toggle.checked = !toggle.checked; toggle.dispatchEvent(new Event('change', { bubbles: true })); }
  }
  if (keepOpen) requestAnimationFrame(syncTouchSheetTiles);
}

function buildTouchSheet(root) {
  const sheet = document.createElement('div');
  sheet.className = 'te-touch-sheet';
  const card = (act, icon) => `<button type="button" class="te-touch-scard" data-touch-act="${act}"><span class="te-touch-ic">${touchOverlayIcon(icon)}</span>`
    + `<span><b data-touch-text="${act}"></b><small data-touch-text="${act}Sub"></small></span></button>`;
  const tile = (act, icon) => `<button type="button" class="te-touch-q" data-touch-act="${act}"><span class="te-touch-ic">${touchOverlayIcon(icon)}</span><span data-touch-text="${act}"></span></button>`;
  sheet.innerHTML = '<div class="te-touch-scrim"></div><div class="te-touch-panel" role="dialog" aria-modal="true"><div class="te-touch-grip"></div>'
    + '<div class="te-touch-sheet-title" data-touch-text="study"></div>'
    + `<div class="te-touch-study">${card('shadowing', 'shadowing')}${card('dictation', 'dictation')}</div>`
    + `<div class="te-touch-quick">${tile('theme', 'moon')}${tile('subopt', 'subOptions')}${tile('sublang', 'subLanguage')}${tile('notes', 'notes')}${tile('art', 'art')}${tile('settings', 'settings')}</div></div>`;
  sheet.querySelector('.te-touch-scrim').addEventListener('click', closeTouchOverlaySheet);
  sheet.querySelectorAll('[data-touch-act]').forEach((button) => button.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    runTouchSheetAction(button.dataset.touchAct);
  }));
  let dragStart = null;
  const panel = sheet.querySelector('.te-touch-panel');
  panel.addEventListener('touchstart', (event) => { dragStart = panel.scrollTop > 0 ? null : event.touches[0].clientY; }, { passive: true });
  panel.addEventListener('touchmove', (event) => {
    if (dragStart === null) return;
    const dy = Math.max(0, event.touches[0].clientY - dragStart);
    panel.style.setProperty('--te-touch-drag', `${dy}px`);
  }, { passive: true });
  panel.addEventListener('touchend', (event) => {
    const dy = dragStart === null ? 0 : event.changedTouches[0].clientY - dragStart;
    dragStart = null;
    panel.style.removeProperty('--te-touch-drag');
    if (dy > 70) closeTouchOverlaySheet();
  });
  root.append(sheet);
}

// ---------- Subtitle options on touch: preview, tabs (portrait), size presets, colour swatches, Advanced ----------
// The original controls stay the source of truth: swatches write through the original colour pickers,
// "Advanced" shows the original font / weight / −+ rows, Reset is the original header button.
function touchSubGroups() {
  return touchSubTab === 'side' ? ['side-en', 'side-vi'] : ['en', 'vi'];
}

function touchDefaultSwatch(group) {
  const root = overlayEl();
  if (root?.classList.contains('te-touch-theater')) return group === 'vi' ? '#ffffff' : '#ffff00';
  const dark = root?.classList.contains('theme-dark');
  const table = {
    en: dark ? '#ffff00' : '#8b5cf6', vi: dark ? '#d1d5db' : '#4b5563',
    'side-en': dark ? '#e5e7eb' : '#111827', 'side-vi': dark ? '#9ca3af' : '#4b5563',
  };
  return table[group];
}

// Light theme off the video: "White" would be unreadable on the white panel, so it becomes the default grey.
function touchSwatchHex(color, group) {
  if (color === 'def') return touchDefaultSwatch(group);
  const root = overlayEl();
  if (color === '#ffffff' && !root?.classList.contains('theme-dark') && !root?.classList.contains('te-touch-theater')) {
    return '#4b5563';
  }
  return color;
}

function setTouchSubtitleColor(group, color) {
  const ref = groupRef(group);
  if (!ref) return;
  ref.color = color === 'def' ? '' : touchSwatchHex(color, group);
  const picker = overlayEl()?.querySelector(`#te-modal-sub [data-touch-pill="${group}"] input[type="color"]`);
  if (picker) picker.value = ref.color || defaultColorFor(group);
  saveSettings();
  applySettings();
}

function setTouchSubtitlePreset(index) {
  if (touchSubTab === 'video') {
    overlayEl()?.querySelectorAll('#te-modal-sub .te-tso-size-original button')[index]?.click();
    return;
  }
  settings.side.en.pct = PRESET_VALUES[index];
  settings.side.vi.pct = Math.round(PRESET_VALUES[index] * 0.9);
  saveSettings();
  applySettings();
}

function renderTouchSubtitleOptions() {
  const root = overlayEl();
  const modal = root?.querySelector('#te-modal-sub');
  const block = modal?.querySelector('.te-tso');
  if (!block || !touchChromeActive()) return;
  const theater = root.classList.contains('te-touch-theater');
  if (theater) touchSubTab = 'video';
  modal.classList.toggle('te-tso-side', touchSubTab === 'side');
  block.querySelectorAll('[data-tso-tab]').forEach((tab) => {
    tab.classList.toggle('on', tab.dataset.tsoTab === touchSubTab);
    tab.textContent = touchOverlayText(tab.dataset.tsoTab === 'side' ? 'tabSide' : 'tabVideo');
  });
  const [mainGroup, trGroup] = touchSubGroups();
  const mainRef = groupRef(mainGroup), trRef = groupRef(trGroup);
  const preview = block.querySelector('.te-tso-preview');
  preview.classList.toggle('on-video', theater);
  const previewMain = preview.querySelector('.te-tso-pv-en'), previewTr = preview.querySelector('.te-tso-pv-vi');
  previewMain.textContent = touchOverlayText('previewMain');
  previewTr.textContent = touchOverlayText('previewTranslation');
  previewMain.style.color = mainRef.color || touchDefaultSwatch(mainGroup);
  previewTr.style.color = trRef.color || touchDefaultSwatch(trGroup);
  const scale = (ref) => (Number(ref.pct) || 100) / 100;
  previewMain.style.fontSize = `${(18 * scale(mainRef)).toFixed(1)}px`;
  previewTr.style.fontSize = `${(15 * scale(trRef)).toFixed(1)}px`;
  previewMain.style.fontWeight = settings.sub.bold ? '700' : '600';
  previewMain.style.fontFamily = previewTr.style.fontFamily = settings.sub.font ? FONT_STACKS[settings.sub.font] || '' : '';
  preview.style.background = theater ? (getComputedStyle(root).getPropertyValue('--te-theater-subtitle-background') || 'rgba(0,0,0,.4)') : '';
  block.querySelector('[data-tso-label="size"]').textContent = touchOverlayText('size');
  const presetIndex = PRESET_VALUES.indexOf(Number(mainRef.pct));
  block.querySelectorAll('[data-tso-size]').forEach((button, i) => {
    button.textContent = touchOverlayText(['small', 'medium', 'large'][i]);
    button.classList.toggle('on', i === presetIndex);
  });
  for (const [line, group] of [['main', mainGroup], ['tr', trGroup]]) {
    block.querySelector(`[data-tso-label="${line}"]`).textContent = touchOverlayText(line === 'main' ? 'mainLine' : 'translationLine');
    const row = block.querySelector(`[data-tso-swatches="${line}"]`);
    const defHex = touchDefaultSwatch(group).toLowerCase();
    const current = (groupRef(group).color || '').toLowerCase();
    const seen = new Set([defHex]);
    row.replaceChildren();
    for (const color of TOUCH_PALETTE) {
      const hex = touchSwatchHex(color, group).toLowerCase();
      if (color !== 'def' && seen.has(hex)) continue;
      seen.add(hex);
      const swatch = document.createElement('button');
      swatch.type = 'button';
      swatch.className = 'te-tso-sw' + (color === 'def' ? ' def' : '');
      swatch.style.background = hex;
      const selected = color === 'def' ? !current : current === hex;
      swatch.classList.toggle('on', selected);
      swatch.setAttribute('aria-pressed', String(selected));
      swatch.title = color === 'def' ? touchOverlayText('defaultColor') : touchOverlayText(TOUCH_SWATCH_NAMES[color] === 'white' && hex !== '#ffffff' ? 'grey' : TOUCH_SWATCH_NAMES[color]);
      swatch.setAttribute('aria-label', swatch.title);
      swatch.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        setTouchSubtitleColor(group, color);
        renderTouchSubtitleOptions();
      });
      row.append(swatch);
    }
  }
  const advanced = modal.querySelector('.te-tso-adv-toggle');
  advanced.querySelector('span').textContent = touchOverlayText('advanced');
  advanced.setAttribute('aria-expanded', String(modal.classList.contains('te-tso-adv-open')));
}

function enhanceTouchSubtitleOptions(root) {
  const modal = root.querySelector('#te-modal-sub');
  const body = modal?.querySelector('.te-modal-body');
  if (!body || body.querySelector('.te-tso')) return;
  // Tag the original sections so touch CSS can order / hide them; desktop ignores these classes.
  const children = [...body.children];
  children.find((el) => el.querySelector('select'))?.classList.add('te-tso-font');
  const groups = [...body.querySelectorAll(':scope > div > .te-btn-group')];
  groups[0]?.parentElement.classList.add('te-tso-size-original');
  groups[1]?.parentElement.classList.add('te-tso-weight');
  body.querySelector('#te-video-subtitle-settings-title')?.parentElement.classList.add('te-tso-title');
  body.querySelector('.te-setting-section-title')?.classList.add('te-tso-title');
  body.querySelectorAll(':scope > .te-card-box:not(.te-theater-subtitle-settings)').forEach((card) => card.classList.add('te-tso-video-card'));
  const pills = [...body.querySelectorAll('.te-color-pill')];
  ['en', 'vi'].forEach((group, i) => pills[i]?.setAttribute('data-touch-pill', group));
  pills.filter((pill) => pill.dataset.group).forEach((pill) => pill.setAttribute('data-touch-pill', pill.dataset.group));
  pills.forEach((pill) => pill.closest('.te-setting-item')?.classList.add('te-tso-pill-row'));

  const block = document.createElement('div');
  block.className = 'te-tso';
  block.innerHTML = '<div class="te-tso-preview"><div class="te-tso-pv-en"></div><div class="te-tso-pv-vi"></div></div>'
    + '<div class="te-tso-tabs" role="tablist"><button type="button" data-tso-tab="video"></button><button type="button" data-tso-tab="side"></button></div>'
    + '<div class="te-tso-label" data-tso-label="size"></div><div class="te-tso-sizes"><button type="button" data-tso-size="0"></button><button type="button" data-tso-size="1"></button><button type="button" data-tso-size="2"></button></div>'
    + '<div class="te-tso-label" data-tso-label="main"></div><div class="te-tso-swatches" data-tso-swatches="main"></div>'
    + '<div class="te-tso-label" data-tso-label="tr"></div><div class="te-tso-swatches" data-tso-swatches="tr"></div>';
  body.prepend(block);
  const advanced = document.createElement('button');
  advanced.type = 'button';
  advanced.className = 'te-tso-adv-toggle';
  advanced.innerHTML = `<span></span>${touchOverlayIcon('chevron')}`;
  body.querySelector('.te-tso-font')?.before(advanced);
  advanced.addEventListener('click', (event) => {
    event.preventDefault();
    modal.classList.toggle('te-tso-adv-open');
    renderTouchSubtitleOptions();
  });
  block.querySelectorAll('[data-tso-tab]').forEach((tab) => tab.addEventListener('click', (event) => {
    event.preventDefault();
    touchSubTab = tab.dataset.tsoTab;
    renderTouchSubtitleOptions();
  }));
  block.querySelectorAll('[data-tso-size]').forEach((button) => button.addEventListener('click', (event) => {
    event.preventDefault();
    setTouchSubtitlePreset(Number(button.dataset.tsoSize));
    renderTouchSubtitleOptions();
  }));
  // Re-render whenever the modal opens or the original controls change settings (Reset, −/+, font, weight, theme).
  new MutationObserver(() => { if (!modal.classList.contains('hidden')) renderTouchSubtitleOptions(); })
    .observe(modal, { attributes: true, attributeFilter: ['class'] });
  modal.addEventListener('click', () => requestAnimationFrame(renderTouchSubtitleOptions));
  modal.addEventListener('change', () => requestAnimationFrame(renderTouchSubtitleOptions));
}

// ---------- Chrome: header, card, subtitle corners, bar buttons ----------
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

  // Subtitle corners (portrait): ♥ favourite video (left) · Fullscreen → theater (right).
  const subBox = root.querySelector('.te-sub-container');
  if (subBox && !subBox.querySelector('#te-touch-fav-btn')) {
    subBox.insertAdjacentHTML('beforeend', `<button type="button" class="te-touch-cbtn te-touch-fav" id="te-touch-fav-btn" aria-pressed="false">${touchOverlayIcon('heart')}</button>`
      + `<button type="button" class="te-touch-cbtn" id="te-touch-fs-btn">${touchOverlayIcon('fullscreen')}</button>`);
    subBox.querySelector('#te-touch-fav-btn').addEventListener('click', onTouchFavoriteClick);
    subBox.querySelector('#te-touch-fs-btn').addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      globalThis.LHN_TOUCH_THEATER?.enter?.();
    });
    const content = subBox.querySelector('.te-subtitle-content');
    if (content && typeof MutationObserver === 'function') new MutationObserver(scheduleTouchSubtitleFit).observe(content, { childList: true, characterData: true, subtree: true });
    if (typeof ResizeObserver === 'function') new ResizeObserver(scheduleTouchSubtitleFit).observe(subBox);
  }

  // Bar: repeat shows lucide repeat-1 on touch; ♥ (theater only) and ☰ More are new.
  const repeat = root.querySelector('#te-control-repeat');
  if (repeat && !repeat.querySelector('.te-touch-ico')) {
    repeat.insertAdjacentHTML('beforeend', touchOverlayIcon('repeat1').replace('<svg ', '<svg class="te-touch-ico" '));
  }
  const bar = root.querySelector('.te-control-bar');
  if (bar && !bar.querySelector('#te-touch-more-btn')) {
    const fav = document.createElement('button');
    fav.type = 'button';
    fav.className = 'te-icon-btn te-touch-fav';
    fav.id = 'te-touch-bar-fav';
    fav.innerHTML = touchOverlayIcon('heart');
    fav.addEventListener('click', onTouchFavoriteClick);
    const more = document.createElement('button');
    more.type = 'button';
    more.className = 'te-icon-btn';
    more.id = 'te-touch-more-btn';
    more.innerHTML = touchOverlayIcon('more');
    more.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (root.querySelector('.te-touch-sheet')?.classList.contains('open')) closeTouchOverlaySheet();
      else openTouchOverlaySheet();
    });
    bar.append(fav, more);
  }

  buildTouchSheet(root);
  enhanceTouchSubtitleOptions(root);
  setupTouchDoubleTap(root);
}

function setupTouchOverlayLayout() {
  const root = overlayEl();
  if (!root || root.querySelector('.te-touch-header')) return;
  buildTouchOverlayChrome(root);
  const query = globalThis.matchMedia?.(TOUCH_OVERLAY_QUERY);
  const apply = () => {
    const theater = Boolean(globalThis.LHN_TOUCH_THEATER?.isActive?.());
    const active = Boolean(query?.matches) && !theater;
    const changed = root.classList.contains('te-touch-layout') !== active;
    root.classList.toggle('te-touch-layout', active);
    root.classList.toggle('te-touch-compact', active && touchOverlayCompact);
    if (!active && !theater) closeTouchOverlaySheet();
    syncTouchOverlayHeader();
    if (changed && state?.open) requestAnimationFrame(() => { syncTheaterFrame(); fitTouchSubtitle(); alignActiveTranscriptFocus('auto'); });
  };
  globalThis.LHN_TOUCH_LAYOUT_APPLY = apply;
  query?.addEventListener?.('change', apply);
  globalThis.LHN_TOUCH_THEATER?.setup?.(root);
  apply();
  // Keep the header title and card source current when a new source opens (the title span is localized/updated).
  const title = root.querySelector('.yt-dual-sidebar-header > span');
  if (title && typeof MutationObserver === 'function') new MutationObserver(syncTouchOverlayHeader).observe(title, { childList: true, characterData: true, subtree: true });
  new MutationObserver(() => {
    if (!root.classList.contains('te-hidden')) { syncTouchOverlayHeader(); syncTouchSheetTiles(); }
    else closeTouchOverlaySheet();
  }).observe(root, { attributes: true, attributeFilter: ['class'] });
  Promise.resolve(globalThis.browser?.storage?.local?.get(TOUCH_OVERLAY_COMPACT_KEY)).then((stored) => {
    if (typeof stored?.[TOUCH_OVERLAY_COMPACT_KEY] === 'boolean') setTouchOverlayCompact(stored[TOUCH_OVERLAY_COMPACT_KEY], false);
  }, () => {});
  loadTouchFavorites();
  globalThis.browser?.storage?.onChanged?.addListener?.((changes, area) => {
    if (area !== 'local' || !changes[touchFavoriteStorageKey()]) return;
    const list = Array.isArray(changes[touchFavoriteStorageKey()].newValue) ? changes[touchFavoriteStorageKey()].newValue : [];
    touchFavoriteIds = new Set(list.map((entry) => entry?.videoId).filter(Boolean));
    syncTouchFavoriteButtons();
  });
}
