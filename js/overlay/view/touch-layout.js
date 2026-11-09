// Overlay layout for touch devices (phones, touch tablets) and narrow portrait windows.
// One layout for Video and Web, every view mode: header · card (live player thumbnail, tap to enlarge) ·
// current sentence (♥ favourite video · Fullscreen corners) · transcript ·
// bar [CC][speed] · [prev play next] · [repeat][More]. Desktop layout is untouched:
// everything here is keyed on `.te-touch-layout` (portrait) or `.te-touch-theater` (phone landscape, touch-theater.js).
// Controls in the More sheet click the original buttons, so no feature or handler is duplicated; only ♥ is new.
const TOUCH_OVERLAY_QUERY = '(max-width: 599.98px) and (orientation: portrait), (max-width: 899.98px) and (orientation: portrait) and (pointer: coarse)';
const TOUCH_OVERLAY_COMPACT_KEY = 'lhnTouchOverlayCompact';
const TOUCH_OVERLAY_SUB_HIDDEN_KEY = 'lhnTouchOverlaySubHidden';   // v3.5.168: chevron between ♥ and Fullscreen folds the subtitle box
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
let touchSubHidden = false;
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
  const subButton = root.querySelector('#te-touch-sub-btn');
  if (subButton) { subButton.title = touchOverlayText(touchSubHidden ? 'showSubs' : 'hideSubs'); subButton.setAttribute('aria-label', subButton.title); }
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

// Chevron (portrait): fold the subtitle box under the video to its button row so the transcript gets the space.
function setTouchSubHidden(hidden, persist = true) {
  touchSubHidden = Boolean(hidden);
  const root = overlayEl();
  root?.classList.toggle('te-touch-sub-hidden', touchSubHidden);
  const button = root?.querySelector('#te-touch-sub-btn');
  if (button) {
    button.title = touchOverlayText(touchSubHidden ? 'showSubs' : 'hideSubs');
    button.setAttribute('aria-label', button.title);
    button.setAttribute('aria-expanded', String(!touchSubHidden));
  }
  if (persist) globalThis.browser?.storage?.local?.set({ [TOUCH_OVERLAY_SUB_HIDDEN_KEY]: touchSubHidden }).catch?.(() => {});
  requestAnimationFrame(() => { if (state?.open) { fitTouchSubtitle(); alignActiveTranscriptFocus('auto'); } });
}

// ---------- Favourites (♥): lhnFavoriteVideos — videos by canonical YouTube id, web pages by URL (no #hash) ----------
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

// Key of the open source: the video id, or the web page URL.
function touchFavoriteKey() {
  return touchVideoId() || (state?.sourceType === 'web' ? touchFavoritePageUrl(state.webSourceUrl || location.href) : '');
}

function touchFavoriteEntryKey(entry) {
  return entry?.videoId || entry?.url || '';
}

// The video's own title (the overlay header only says "Keepit - Video").
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
  if (!touchChromeActive() || !touchFavoriteKey() || event.button > 0) return false;
  const now = performance.now();
  const double = now - touchTap.lastUp < TOUCH_TAP_GAP && Math.hypot(event.clientX - touchTap.x, event.clientY - touchTap.y) < TOUCH_TAP_SLOP;
  if (!double && now - touchTap.streak > TOUCH_STREAK_GAP) return false;
  clearTimeout(touchTap.timer);
  touchTap.timer = 0;
  touchTap.lastUp = 0;
  touchTap.streak = now;
  touchTap.suppressUntil = now + 500;
  spawnTouchTapHeart(event.clientX, event.clientY);
  if (!touchFavoriteIds.has(touchFavoriteKey())) setTouchFavorite(true).catch(() => {});
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

// ---------- Long-press word selection (Nhấn để dịch): hold ~450 ms on a word, drag to add words, lift to translate ----------
const TOUCH_SELECT_MS = 450;
const TOUCH_SELECT_ZONE = '.te-sub-en, .yt-dual-item-en';
const touchSelect = { timer: 0, pointerId: null, touch: false, fired: false, active: false, box: null, word: null, first: null, span: null, endedAt: -1e9, dispatching: false, x: 0, y: 0 };

function touchSelectWordAt(x, y) {
  const word = shadow?.elementFromPoint?.(x, y)?.closest?.('.yt-dual-word');
  return word && touchSelect.box?.contains(word) ? word : null;
}

// Offsets of the word inside its span without surrounding punctuation ("channel." → "channel").
function touchSelectWordEdges(word) {
  const node = word.firstChild;
  const text = node?.nodeType === Node.TEXT_NODE ? node.textContent : '';
  const start = text.search(/[\p{L}\p{N}]/u);
  if (start < 0) return null;
  let end = text.length;
  while (end > start && !/[\p{L}\p{N}]/u.test(text[end - 1])) end -= 1;
  return { node, start, end };
}

function touchSelectApply(last) {
  const words = [...touchSelect.box.querySelectorAll('.yt-dual-word')];
  if (!touchSelect.first?.isConnected && touchSelect.span) touchSelect.first = words[touchSelect.span[0]] || null;
  let a = words.indexOf(touchSelect.first), b = words.indexOf(last);
  if (a < 0 || b < 0) return;
  if (a > b) [a, b] = [b, a];
  touchSelect.span = [a, b];
  touchSelectRange(words, a, b);
}

// A late translation re-renders the subtitle words; the chosen span is re-selected by word index.
function touchSelectRange(words, a, b) {
  let from = null, to = null;
  for (let i = a; i <= b && !from; i += 1) from = touchSelectWordEdges(words[i]);
  for (let i = b; i >= a && !to; i -= 1) to = touchSelectWordEdges(words[i]);
  if (!from || !to) return;
  const selection = document.getSelection();
  try { selection.setBaseAndExtent(from.node, from.start, to.node, to.end); } catch {}
}

function touchSelectClear() {
  try { shadow?.getSelection?.()?.removeAllRanges?.(); } catch {}
  try { document.getSelection()?.removeAllRanges(); } catch {}
}

function touchSelectCancel() {
  clearTimeout(touchSelect.timer);
  touchSelect.timer = 0;
}

function touchSelectDown(event) {
  touchSelectCancel();
  touchSelect.fired = false;
  touchSelect.active = false;
  touchSelect.pointerId = event.pointerId;
  touchSelect.touch = event.pointerType === 'touch';
  const box = event.pointerType === 'touch' && settings?.videoTranslationPopupEnabled !== false ? event.target?.closest?.(TOUCH_SELECT_ZONE) : null;
  if (!box) return;
  touchSelect.box = box;
  touchSelect.word = event.target.closest('.yt-dual-word');
  touchSelect.x = event.clientX;
  touchSelect.y = event.clientY;
  touchSelect.timer = setTimeout(() => {
    touchSelect.timer = 0;
    const word = touchSelectWordAt(touchSelect.x, touchSelect.y) || (touchSelect.word?.isConnected ? touchSelect.word : null);
    if (!word || !touchSelectWordEdges(word)) return;
    touchSelect.fired = true;
    touchSelect.active = true;
    touchSelect.first = word;
    touchSelect.span = null;
    clearTimeout(touchTap.timer);
    touchTap.timer = 0;
    // Hold the sentence still while choosing words; the translation popup then keeps it paused (app-popup).
    pauseMediaFor('touch-select');
    touchSelectApply(word);
    try { navigator.vibrate?.(12); } catch {}
  }, TOUCH_SELECT_MS);
}

function touchSelectMove(event) {
  if (event.pointerId !== touchSelect.pointerId) return;
  if (touchSelect.active) {
    const word = touchSelectWordAt(event.clientX, event.clientY);
    if (word) touchSelectApply(word);
  } else if (touchSelect.timer && Math.hypot(event.clientX - touchSelect.x, event.clientY - touchSelect.y) > 10) touchSelectCancel();
}

function touchSelectUp(event) {
  touchSelectCancel();
  if (!touchSelect.active || event.pointerId !== touchSelect.pointerId) return;
  touchSelect.active = false;
  touchTap.suppressUntil = performance.now() + 500;
  const box = touchSelect.box;
  const words = box ? [...box.querySelectorAll('.yt-dual-word')] : [];
  if (touchSelect.span && !touchSelect.first?.isConnected && words.length > touchSelect.span[1]) touchSelectRange(words, ...touchSelect.span);
  // content.js opens the translation popup / full dictionary from a mouseup over a selected subtitle range.
  touchSelect.endedAt = performance.now();
  touchSelect.dispatching = true;
  try {
    if (box?.isConnected) box.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, composed: true, cancelable: true, button: 0, clientX: event.clientX, clientY: event.clientY }));
  } finally { touchSelect.dispatching = false; }
  setTimeout(() => resumeMediaFor('touch-select'), 700);
}

// True when this finger turned into a word selection (gesture handlers then skip their tap/swipe).
function touchSelectOwns(event) {
  return touchSelect.fired && event.pointerId === touchSelect.pointerId;
}

function setupTouchSelect(root) {
  root.addEventListener('pointerdown', (event) => { if (touchChromeActive()) touchSelectDown(event); }, true);
  root.addEventListener('pointermove', touchSelectMove, true);
  root.addEventListener('pointerup', touchSelectUp, true);
  root.addEventListener('pointercancel', touchSelectUp, true);
  // Chrome may still emit compatibility mouse events after the long press; a native mousedown would collapse the
  // selection before content.js reads it, so they are dropped (our own mouseup above passes).
  const dropCompat = (event) => {
    if (touchSelect.dispatching || !touchSelect.fired || performance.now() - touchSelect.endedAt > 800) return;
    if (!event.composedPath?.().includes(root)) return;
    event.preventDefault();
    event.stopPropagation();
  };
  // Window capture runs before content.js's document listeners (which would also close the new popup).
  ['mousedown', 'mouseup', 'click'].forEach((type) => window.addEventListener(type, dropCompat, true));
  // Once selecting, the finger extends the selection instead of scrolling the transcript.
  root.addEventListener('touchmove', (event) => { if (touchSelect.active && event.cancelable) event.preventDefault(); }, { capture: true, passive: false });
  // No native long-press selection / callout inside the subtitle zones on touch.
  const blockNative = (event) => {
    if (touchChromeActive() && touchSelect.touch && event.target?.closest?.('.te-sub-container, .yt-dual-transcript-list')) event.preventDefault();
  };
  root.addEventListener('contextmenu', blockNative, true);
  root.addEventListener('selectstart', blockNative, true);
}

function setupTouchDoubleTap(root) {
  const zoneOf = (target) => target?.closest?.('button, a, input, select, textarea, label, .te-touch-sheet, .te-modal-backdrop') ? null
    : target?.closest?.('.te-player-frame, .te-sub-container, .yt-dual-transcript-list');
  const theaterOn = () => Boolean(globalThis.LHN_TOUCH_THEATER?.isActive?.());
  let down = null, lift = null, popupCloseUntil = 0;
  // A tap while the translation sheet is open only closes it (content.js closes on mousedown).
  root.addEventListener('pointerdown', (event) => {
    if (!touchChromeActive() || typeof hasVisibleAppPopup !== 'function' || !hasVisibleAppPopup()) return;
    popupCloseUntil = performance.now() + 700;
    touchSelectClear();
    event.stopImmediatePropagation();
  }, true);
  setupTouchSelect(root);
  root.addEventListener('pointerdown', (event) => {
    down = null;
    lift = null;
    if (!touchChromeActive() || theaterOn()) return;   // the landscape theater handles its own gestures
    // Swipe up on the video / audio card (portrait) opens the fullscreen theater.
    if (event.pointerType === 'touch' && touchOverlayActive() && event.target.closest?.('.te-player-slot, .te-reading-mini-audio') && !event.target.closest('button')) {
      lift = { x: event.clientX, y: event.clientY };
    }
    if (root.classList.contains('te-touch-compact') && event.target.closest?.('.te-player-slot')) return;
    if (!zoneOf(event.target)) return;
    if (touchHeartOnDown(event)) return;
    down = {
      x: event.clientX, y: event.clientY, t: performance.now(), touch: event.pointerType === 'touch',
      player: Boolean(event.target.closest('.te-player-frame')),
      sub: Boolean(event.target.closest('.te-subtitle-content')),
      row: event.target.closest('.yt-dual-item'),
    };
  }, true);
  root.addEventListener('pointermove', (event) => {
    if (down && Math.hypot(event.clientX - down.x, event.clientY - down.y) > 10) down = null;
  }, true);
  root.addEventListener('pointercancel', () => { down = null; lift = null; }, true);
  root.addEventListener('pointerup', (event) => {
    const swipe = lift;
    lift = null;
    if (swipe && !touchSelectOwns(event)) {
      const dy = swipe.y - event.clientY;
      if (dy > 50 && dy > Math.abs(event.clientX - swipe.x) * 1.5) {
        down = null;
        touchTap.suppressUntil = performance.now() + 500;
        popupCloseUntil = performance.now() + 500;
        globalThis.LHN_TOUCH_THEATER?.enter?.();
        return;
      }
    }
    if (!down) return;
    const tap = down;
    down = null;
    if (performance.now() - tap.t > 500 || touchSelectOwns(event)) return;
    // Single taps wait TOUCH_TAP_GAP so a second tap can turn them into a heart.
    // Video: play/pause. Subtitle (touch): its pause function. Transcript row (touch): jump to that line and play.
    let single = null;
    if (tap.player || tap.sub && tap.touch) single = () => { togglePlay(); pulseControl('Phát/Tạm dừng'); };
    else if (tap.row && tap.touch) {
      const row = tap.row;
      single = () => { const stamp = row.isConnected && row.querySelector('.yt-dual-timestamp'); if (stamp) onTranscriptClick({ target: stamp }); };
    }
    touchTapUp(event, single);
  }, true);
  // The player's own click handler (play/pause) is replaced by the delayed single tap above; the click of a heart tap is swallowed.
  root.addEventListener('click', (event) => {
    if (!touchChromeActive()) return;
    if (performance.now() < popupCloseUntil) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    const zone = zoneOf(event.target);
    if (!zone) return;
    if (performance.now() < touchTap.suppressUntil || zone.classList.contains('te-player-frame')
      || event.pointerType === 'touch' && event.target.closest('.yt-dual-timestamp')) {
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
  overlayEl()?.querySelectorAll('.te-touch-sheet').forEach((sheet) => sheet.classList.remove('open'));
}

function syncTouchSheetTiles() {
  const root = overlayEl();
  const sheet = root?.querySelector('.te-touch-sheet:not(.te-touch-set)');
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
  const sheet = overlayEl()?.querySelector('.te-touch-sheet:not(.te-touch-set)');
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
  else if (action === 'subopt') setTimeout(() => openTouchSettingsSheet('sub'), 120);
  else if (action === 'sublang') setTimeout(() => openTouchSettingsSheet('lang'), 120);
  else if (action === 'notes') click('#te-notes-sidebar-toggle');
  else if (action === 'settings') setTimeout(() => openTouchSettingsSheet('main'), 120);
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
  // v3.5.161: shared sheet behaviour (js/shared/sheet-kit.js) — drag down from anywhere, list back to top first, nothing
  // behind the sheet scrolls
  const panel = sheet.querySelector('.te-touch-panel');
  globalThis.LHN_SHEET?.attach(panel, { isOpen: () => sheet.classList.contains('open'), close: closeTouchOverlaySheet, watch: sheet });
  root.append(sheet);
}

// ---------- Settings sheet on touch (demo #sset): Video settings · Subtitle options · Subtitle language ----------
// One bottom sheet with three pages. Every control writes through the original Keepit control (checkbox, size /
// weight / −+ buttons, font select, opacity slider, language option, Reset), so behaviour and storage stay identical;
// only colour swatches write settings directly (the original colour pickers have no preset palette).
function touchSubGroups() {
  return touchSubTab === 'side' ? ['side-en', 'side-vi'] : ['en', 'vi'];
}

function touchDefaultSwatch(group) {
  const root = overlayEl();
  if (root?.classList.contains('te-touch-theater')) return group === 'vi' ? '#ffffff' : '#ffff00';
  const dark = root?.classList.contains('theme-dark');
  const table = {
    en: dark ? '#ffff00' : '#8b5cf6', vi: dark ? '#ffffff' : '#4b5563', // touch dark translation line is white (template parity block)
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

function touchOriginalSub() {
  const body = overlayEl()?.querySelector('#te-modal-sub .te-modal-body');
  if (!body) return null;
  if (!body.dataset.touchTagged) {
    body.dataset.touchTagged = '1';
    const groups = [...body.querySelectorAll(':scope > div > .te-btn-group')];
    groups[0]?.parentElement.classList.add('te-tso-size-original');
    groups[1]?.parentElement.classList.add('te-tso-weight');
    body.querySelectorAll(':scope > .te-card-box:not(.te-theater-subtitle-settings)').forEach((card) => card.classList.add('te-tso-video-card'));
    const pills = [...body.querySelectorAll('.te-color-pill')];
    ['en', 'vi'].forEach((group, i) => pills[i]?.setAttribute('data-touch-pill', group));
    pills.filter((pill) => pill.dataset.group).forEach((pill) => pill.setAttribute('data-touch-pill', pill.dataset.group));
  }
  return body;
}

function touchStepButtons(group) {
  const body = touchOriginalSub();
  if (!body) return [];
  if (group === 'side-en' || group === 'side-vi') return [...body.querySelectorAll(`.te-counter-btn[data-group="${group}"]`)];
  const card = body.querySelectorAll('.te-tso-video-card')[group === 'vi' ? 1 : 0];
  return card ? [...card.querySelectorAll('.te-counter-btn')] : [];
}

function touchSettingsRows() {
  const main = overlayEl()?.querySelector('#te-modal-main');
  if (!main) return [];
  const speak = main.querySelector('#te-video-click-to-speak-enabled')?.closest('.te-menu-row');
  const combine = speak?.nextElementSibling?.matches?.('.te-menu-row') ? speak.nextElementSibling : null;
  return [main.querySelector('#te-translation-popup-enabled')?.closest('.te-menu-row'), speak, combine].filter(Boolean);
}

function closeTouchSettingsSheet() {
  overlayEl()?.querySelector('.te-touch-set')?.classList.remove('open');
}

function openTouchSettingsSheet(page) {
  const sheet = overlayEl()?.querySelector('.te-touch-set');
  if (!sheet) return;
  sheet.dataset.page = page;
  if (page === 'lang' && typeof updateSubtitleLanguageLabels === 'function') updateSubtitleLanguageLabels(); // as the original modal does on open
  renderTouchSettingsSheet();
  sheet.querySelector('.te-touch-panel').scrollTop = 0;
  requestAnimationFrame(() => sheet.classList.add('open'));
}

function renderTouchSettingsSheet() {
  const root = overlayEl();
  const sheet = root?.querySelector('.te-touch-set');
  if (!sheet || !touchChromeActive()) return;
  const page = sheet.dataset.page || 'main';
  const theater = root.classList.contains('te-touch-theater');
  if (theater) touchSubTab = 'video';
  const t = touchOverlayText;
  sheet.querySelectorAll('[data-tss-page]').forEach((node) => { node.hidden = node.dataset.tssPage !== page; });
  sheet.querySelector('.te-tss-title').textContent = t(page === 'sub' ? 'subOptions' : page === 'lang' ? 'subLanguage' : 'videoSettings');
  sheet.querySelector('.te-tss-reset').hidden = page !== 'sub';
  sheet.querySelector('.te-tss-reset span').textContent = t('reset');
  sheet.querySelectorAll('[data-tss-text]').forEach((node) => { node.textContent = t(node.dataset.tssText); });

  if (page === 'main') {
    const list = sheet.querySelector('[data-tss-page="main"]');
    const rows = touchSettingsRows();
    const exportLabel = root.querySelector('#open-export-modal span')?.textContent?.trim() || '';
    list.innerHTML = rows.map((row, i) => {
      const input = row.querySelector('input[type="checkbox"]');
      return `<button type="button" class="te-tss-tg" role="switch" data-tss-row="${i}" aria-checked="${input?.checked ? 'true' : 'false'}"><span></span><i class="te-tss-sw"></i></button>`;
    }).join('') + '<button type="button" class="te-tss-srow" data-tss-export><span></span> ›</button>';
    list.querySelectorAll('[data-tss-row]').forEach((button) => {
      button.querySelector('span').textContent = rows[Number(button.dataset.tssRow)].querySelector('.te-item-left span')?.textContent?.trim() || '';
    });
    list.querySelector('[data-tss-export] span').textContent = exportLabel;
    return;
  }

  if (page === 'lang') {
    for (const key of ['source', 'target']) {
      const holder = sheet.querySelector(`[data-tss-lang="${key}"]`);
      const options = [...root.querySelectorAll(`#te-lang-${key}-options [data-language-value]`)];
      holder.replaceChildren(...options.map((option) => {
        const raw = option.textContent.trim();
        const match = raw.match(/^(\S+)\s+(.+)$/);
        const hasFlag = match && !/[\p{L}\p{N}]/u.test(match[1]);
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'te-tss-radio' + (option.getAttribute('aria-selected') === 'true' ? ' on' : '');
        button.dataset.tssLangValue = option.dataset.languageValue;
        button.innerHTML = '<span class="te-tss-fl"></span><span></span><i class="te-tss-ck"></i>';
        button.children[0].textContent = option.dataset.languageValue === 'auto' ? '✦' : (hasFlag ? match[1] : '');
        button.children[1].textContent = hasFlag ? match[2] : raw;
        return button;
      }));
    }
    return;
  }

  // Subtitle options
  const body = touchOriginalSub();
  const [mainGroup, trGroup] = touchSubGroups();
  const mainRef = groupRef(mainGroup), trRef = groupRef(trGroup);
  const side = touchSubTab === 'side';
  const mini = (holder, items) => {
    holder.replaceChildren(...items.map(([value, label, on]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.v = value;
      button.textContent = label;
      button.classList.toggle('on', Boolean(on));
      return button;
    }));
  };
  sheet.querySelector('.te-tss-tabs').hidden = theater;
  sheet.querySelectorAll('[data-tss-tab]').forEach((tab) => tab.classList.toggle('on', tab.dataset.tssTab === touchSubTab));
  const presetIndex = PRESET_VALUES.indexOf(Number(mainRef.pct));
  mini(sheet.querySelector('[data-tss-pick="preset"]'), ['small', 'medium', 'large'].map((key, i) => [i, t(key), i === presetIndex]));
  const select = body?.querySelector('select');
  mini(sheet.querySelector('[data-tss-pick="font"]'), [...(select?.options || [])].map((o, i) => [i, o.textContent.trim(), i === select.selectedIndex]));
  const weightButtons = [...(body?.querySelectorAll('.te-tso-weight button') || [])];
  mini(sheet.querySelector('[data-tss-pick="weight"]'), weightButtons.map((b, i) => [i, b.textContent.trim(), b.classList.contains('active')]));
  const opacity = Number(root.querySelector('#te-theater-subtitle-opacity')?.value ?? 40);
  const bgSel = opacity <= 0 ? 'none' : opacity <= 60 ? 'soft' : 'solid';
  mini(sheet.querySelector('[data-tss-pick="bg"]'), ['none', 'soft', 'solid'].map((key) => [key, t('bg' + key[0].toUpperCase() + key.slice(1)), key === bgSel]));
  sheet.querySelector('.te-tss-bg').hidden = !theater;
  sheet.querySelector('[data-tss-step="main"] output').textContent = `${Number(mainRef.pct) || 100}%`;
  sheet.querySelector('[data-tss-step="tr"] output').textContent = `${Number(trRef.pct) || 100}%`;

  for (const [line, group] of [['main', mainGroup], ['tr', trGroup]]) {
    const row = sheet.querySelector(`[data-tss-color="${line}"]`);
    const defHex = touchDefaultSwatch(group).toLowerCase();
    const current = (groupRef(group).color || '').toLowerCase();
    const seen = new Set([defHex]);
    row.replaceChildren();
    for (const color of TOUCH_PALETTE) {
      const hex = touchSwatchHex(color, group).toLowerCase();
      if (color !== 'def' && seen.has(hex)) continue;
      seen.add(hex);
      const selected = color === 'def' ? (!current || current === defHex) : current === hex;
      const swatch = document.createElement('button');
      swatch.type = 'button';
      swatch.className = 'te-tss-sw2' + (selected ? ' on' : '');
      swatch.dataset.tssGroup = group;
      swatch.dataset.tssC = color;
      swatch.style.setProperty('--c', hex);
      const n = parseInt(hex.slice(1), 16);
      swatch.style.color = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255 > 0.6 ? '#111' : '#fff';
      swatch.textContent = selected ? '✓' : '';
      swatch.title = color === 'def' ? `${t('defaultColor')} (${hex})` : t(TOUCH_SWATCH_NAMES[color] === 'white' && hex !== '#ffffff' ? 'grey' : TOUCH_SWATCH_NAMES[color]);
      swatch.setAttribute('aria-label', swatch.title);
      swatch.setAttribute('aria-pressed', String(selected));
      row.append(swatch);
    }
  }

  // Preview: the current sentence, styled like the real subtitle / transcript row.
  const pv = sheet.querySelector('.te-tss-pv');
  const enNode = pv.querySelector('.te-tss-pv-en'), viNode = pv.querySelector('.te-tss-pv-vi');
  const liveEn = root.querySelector('#te-sub-en-text')?.textContent?.trim();
  const liveVi = root.querySelector('#te-sub-vi-text')?.textContent?.trim();
  pv.classList.toggle('side', side);
  pv.classList.toggle('on-video', theater);
  const live = root.querySelector('#te-sub-en-text');
  const liveStyle = live ? getComputedStyle(live) : null;
  pv.style.fontFamily = liveStyle?.fontFamily || '';
  const base = side ? [15, 13] : [17, 14];
  const scale = (ref) => (Number(ref.pct) || 100) / 100;
  const bg = theater ? (getComputedStyle(root).getPropertyValue('--te-theater-subtitle-background').trim() || '') : '';
  const fill = (node, text, size, color, weight) => {
    node.replaceChildren();
    const span = document.createElement('span');
    span.textContent = text;
    if (bg) span.style.background = bg;
    node.append(span);
    node.style.fontSize = `${(size).toFixed(1)}px`;
    node.style.color = color;
    node.style.fontWeight = weight || '';
  };
  fill(enNode, liveEn || t('previewMain'), base[0] * scale(mainRef), mainRef.color || touchDefaultSwatch(mainGroup), side ? '500' : (liveStyle?.fontWeight || '600'));
  fill(viNode, liveVi || t('previewTranslation'), base[1] * scale(trRef), trRef.color || touchDefaultSwatch(trGroup), '');
}

function runTouchSettingsAction(target) {
  const root = overlayEl();
  const sheet = root?.querySelector('.te-touch-set');
  if (!sheet) return;
  const rerender = () => requestAnimationFrame(renderTouchSettingsSheet);
  if (target.closest('[data-tss-close]')) { closeTouchSettingsSheet(); return; }
  const toggle = target.closest('[data-tss-row]');
  if (toggle) {
    touchSettingsRows()[Number(toggle.dataset.tssRow)]?.querySelector('input[type="checkbox"]')?.click();
    rerender();
    return;
  }
  if (target.closest('[data-tss-export]')) {
    closeTouchSettingsSheet();
    root.querySelector('#open-export-modal')?.click();
    return;
  }
  if (target.closest('.te-tss-reset')) {
    root.querySelector('#te-modal-sub .te-modal-header > button:last-child')?.click();
    rerender();
    return;
  }
  const tab = target.closest('[data-tss-tab]');
  if (tab) { touchSubTab = tab.dataset.tssTab; renderTouchSettingsSheet(); return; }
  const radio = target.closest('[data-tss-lang-value]');
  if (radio) {
    const key = radio.parentElement.dataset.tssLang;
    root.querySelector(`#te-lang-${key}-options [data-language-value="${radio.dataset.tssLangValue}"]`)?.click();
    rerender();
    return;
  }
  const swatch = target.closest('[data-tss-c]');
  if (swatch) { setTouchSubtitleColor(swatch.dataset.tssGroup, swatch.dataset.tssC); renderTouchSettingsSheet(); return; }
  const step = target.closest('[data-tss-step] button');
  if (step) {
    const group = touchSubGroups()[step.parentElement.dataset.tssStep === 'tr' ? 1 : 0];
    touchStepButtons(group)[Number(step.dataset.d) < 0 ? 0 : 1]?.click();
    rerender();
    return;
  }
  const pick = target.closest('[data-tss-pick] button');
  if (!pick) return;
  const key = pick.parentElement.dataset.tssPick;
  const body = touchOriginalSub();
  if (key === 'preset') setTouchSubtitlePreset(Number(pick.dataset.v));
  else if (key === 'weight') body?.querySelectorAll('.te-tso-weight button')[Number(pick.dataset.v)]?.click();
  else if (key === 'font') {
    const select = body?.querySelector('select');
    if (select) { select.selectedIndex = Number(pick.dataset.v); select.dispatchEvent(new Event('change', { bubbles: true })); }
  } else if (key === 'bg') {
    const slider = root.querySelector('#te-theater-subtitle-opacity');
    if (slider) {
      slider.value = String({ none: 0, soft: 40, solid: 80 }[pick.dataset.v]);
      slider.dispatchEvent(new Event('input', { bubbles: true }));
      slider.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }
  rerender();
}

function buildTouchSettingsSheet(root) {
  const sheet = document.createElement('div');
  sheet.className = 'te-touch-sheet te-touch-set';
  const svg = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const field = (text, pick) => `<div class="te-tss-field"><span data-tss-text="${text}"></span><div class="te-tss-mini" data-tss-pick="${pick}"></div></div>`;
  const step = (text, line) => `<div class="te-tss-field"><span data-tss-text="${text}"></span><div class="te-tss-step" data-tss-step="${line}"><button type="button" data-d="-10">−</button><output></output><button type="button" data-d="10">+</button></div></div>`;
  sheet.innerHTML = '<div class="te-touch-scrim" data-tss-close></div><div class="te-touch-panel" role="dialog" aria-modal="true"><div class="te-touch-grip"></div>'
    + `<div class="te-tss-head"><b class="te-tss-title"></b><button type="button" class="te-tss-reset">${svg('<path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>').replace('stroke-width="2.2"', 'stroke-width="2"')}<span></span></button>`
    + `<button type="button" class="te-tss-x" data-tss-close data-tss-close-label>${svg('<path d="M18 6 6 18M6 6l12 12"/>')}</button></div>`
    + '<div data-tss-page="main"></div>'
    + '<div data-tss-page="sub" hidden>'
    + '<div class="te-tss-pv"><div class="te-tss-pv-box"><div class="te-tss-pv-en"></div><div class="te-tss-pv-vi"></div></div></div>'
    + '<div class="te-tss-tabs"><button type="button" data-tss-tab="video" data-tss-text="tabVideo"></button><button type="button" data-tss-tab="side" data-tss-text="tabSide"></button></div>'
    + field('size', 'preset')
    + '<div class="te-tss-grp"><div class="te-tss-gh"><b data-tss-text="mainColor"></b></div><div class="te-tss-sws" data-tss-color="main"></div></div>'
    + '<div class="te-tss-grp"><div class="te-tss-gh"><b data-tss-text="trColor"></b></div><div class="te-tss-sws" data-tss-color="tr"></div></div>'
    + '<div class="te-tss-grp te-tss-bg"><div class="te-tss-gh"><b data-tss-text="background"></b><small data-tss-text="bgNote"></small></div><div class="te-tss-mini wide" data-tss-pick="bg"></div></div>'
    + '<details class="te-tss-adv"><summary><span data-tss-text="advanced"></span><i>▾</i></summary>'
    + field('font', 'font') + field('weight', 'weight') + step('mainLine', 'main') + step('translationLine', 'tr')
    + '</details></div>'
    + '<div data-tss-page="lang" hidden><div class="te-tss-lbl" data-tss-text="mainLine"></div><div class="te-tss-radios" data-tss-lang="source"></div>'
    + '<div class="te-tss-lbl" style="margin-top:12px" data-tss-text="translationLine"></div><div class="te-tss-radios" data-tss-lang="target"></div></div>'
    + '</div>';
  sheet.addEventListener('click', (event) => {
    if (event.target.closest('summary')) return;
    event.stopPropagation();
    runTouchSettingsAction(event.target);
  });
  sheet.querySelector('.te-tss-x').setAttribute('aria-label', touchOverlayText('close'));
  // v3.5.161: shared sheet behaviour (js/shared/sheet-kit.js), like every Keepit sheet — drag down from anywhere.
  const panel = sheet.querySelector('.te-touch-panel');
  globalThis.LHN_SHEET?.attach(panel, { isOpen: () => sheet.classList.contains('open'), close: closeTouchSettingsSheet, watch: sheet });
  root.append(sheet);
  // Back from Export returns to this sheet on touch instead of the desktop settings popup.
  root.querySelector('#back-export')?.addEventListener('click', (event) => {
    if (!touchChromeActive()) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    root.querySelector('#te-modal-export')?.classList.add('hidden');
    openTouchSettingsSheet('main');
  }, true);
  // Keep the open page current when settings change elsewhere (theme, CC mode, live sentence, storage).
  new MutationObserver(() => { if (sheet.classList.contains('open')) renderTouchSettingsSheet(); })
    .observe(root, { attributes: true, attributeFilter: ['class'] });
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
      + `<button type="button" class="te-touch-cbtn" id="te-touch-sub-btn" aria-expanded="true">${touchOverlayIcon('chevron')}</button>`
      + `<button type="button" class="te-touch-cbtn" id="te-touch-fs-btn">${touchOverlayIcon('fullscreen')}</button>`);
    subBox.querySelector('#te-touch-fav-btn').addEventListener('click', onTouchFavoriteClick);
    subBox.querySelector('#te-touch-sub-btn').addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      setTouchSubHidden(!touchSubHidden);
    });
    setTouchSubHidden(touchSubHidden, false);
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
      if (root.querySelector('.te-touch-sheet.open')) closeTouchOverlaySheet();
      else openTouchOverlaySheet();
    });
    bar.append(fav, more);
  }

  buildTouchSheet(root);
  buildTouchSettingsSheet(root);
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
  // content.js turns subtitle word translations into bottom sheets while this class is on <html>.
  const syncDocClass = () => document.documentElement.classList.toggle('lhn-touch-overlay', touchChromeActive() && !root.classList.contains('te-hidden'));
  new MutationObserver(() => {
    syncDocClass();
    if (!root.classList.contains('te-hidden')) { syncTouchOverlayHeader(); syncTouchSheetTiles(); }
    else closeTouchOverlaySheet();
  }).observe(root, { attributes: true, attributeFilter: ['class'] });
  syncDocClass();
  Promise.resolve(globalThis.browser?.storage?.local?.get(TOUCH_OVERLAY_SUB_HIDDEN_KEY)).then((stored) => {
    if (typeof stored?.[TOUCH_OVERLAY_SUB_HIDDEN_KEY] === 'boolean') setTouchSubHidden(stored[TOUCH_OVERLAY_SUB_HIDDEN_KEY], false);
  }).catch?.(() => {});
  Promise.resolve(globalThis.browser?.storage?.local?.get(TOUCH_OVERLAY_COMPACT_KEY)).then((stored) => {
    if (typeof stored?.[TOUCH_OVERLAY_COMPACT_KEY] === 'boolean') setTouchOverlayCompact(stored[TOUCH_OVERLAY_COMPACT_KEY], false);
  }, () => {});
  loadTouchFavorites();
  globalThis.browser?.storage?.onChanged?.addListener?.((changes, area) => {
    if (area !== 'local' || !changes[touchFavoriteStorageKey()]) return;
    const list = Array.isArray(changes[touchFavoriteStorageKey()].newValue) ? changes[touchFavoriteStorageKey()].newValue : [];
    touchFavoriteIds = new Set(list.map(touchFavoriteEntryKey).filter(Boolean));
    syncTouchFavoriteButtons();
  });
}
