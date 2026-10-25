// ===== YouTube song ngữ – content script (chuyển từ extension tham chiếu v1.12) =====
// Nạp trước: overlay-template.js (OVERLAY_CSS/OVERLAY_HTML). Giao diện giữ nguyên 100%.
// Các "đường nối" đã đổi sang module Keepit: LHN_MESSAGING (fetch bridge), browser.storage (cài đặt),
// LHN_DEFAULTS.youtube (giá trị mặc định).

const LAUNCHER_ID = 'yt-trancy-launcher';
const HOST_ID = 'trancy-host';
const OVERLAY_ID = 'trancy-exact-overlay';
const SETTINGS_KEY = 'lhnYouTubeSettings';
const BATCH_SIZE = 15;
const PENDING = 'Đang dịch...';
const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const PRESET_VALUES = [80, 100, 130]; // Nhỏ, Trung bình, Lớn
const FONT_STACKS = {
  Inter: 'Inter, sans-serif',
  Roboto: 'Roboto, "Segoe UI", Arial, sans-serif',
  Arial: 'Arial, Helvetica, sans-serif',
  Verdana: 'Verdana, Geneva, sans-serif',
  Tahoma: 'Tahoma, sans-serif',
  'Trebuchet MS': '"Trebuchet MS", sans-serif',
  Georgia: 'Georgia, serif',
  'Times New Roman': '"Times New Roman", Times, serif',
  'Courier New': '"Courier New", Courier, monospace',
};
const PLAY_PATH = '<path d="M8 5v14l11-7z"/>';
const PAUSE_PATH = '<path d="M6 5h4v14H6zM14 5h4v14h-4z"/>';
const DEFAULT_HEX = { en: '#ccff00', vi: '#ffffff', 'side-en': '#e5e7eb', 'side-vi': '#9ca3af' };

const state = {
  open: false,
  videoId: null,
  videoEl: null,
  origParent: null,
  origNext: null,
  rawCues: [],
  captions: [],
  activeIdx: -1,
  viCache: new Map(),
  loadToken: 0,
  loadingFor: null,
  loop: false,
};

let shadow = null; // ShadowRoot chứa toàn bộ giao diện Trancy
const $ = (id) => (shadow ? shadow.getElementById(id) : null);
const overlayEl = () => $(OVERLAY_ID);
const ui = (sel) => overlayEl()?.querySelector(sel) || null;
const uiAll = (sel) => (overlayEl() ? [...overlayEl().querySelectorAll(sel)] : []);
const ctrl = (title) => ui(`button[title="${title}"]`);

// ---------- Lấy phụ đề (đã kiểm chứng ở v1.4) ----------
const SENTENCE_END_RE = /[.!?…]["'”’)\]]*$/;
const ABBREVIATION_RE = /\b(mr|mrs|ms|dr|vs|etc|e\.g|i\.e|st|no)\.$/i;
const MAX_SENTENCE_SEC = 12;
const MAX_SENTENCE_WORDS = 30;
const TRANSCRIPT_LABEL = /show transcript|hiển thị bản ghi|bản ghi/i;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

async function fetchText(url) {
  const res = await globalThis.LHN_MESSAGING.sendMessage({ type: 'YOUTUBE_FETCH_TEXT', url });
  if (!res?.ok) throw new Error(res?.error || 'Fetch thất bại');
  return res.text;
}

function errorText(reasons) {
  const detail = reasons.length ? reasons.join(' | ') : 'không rõ nguyên nhân';
  return 'Không thể tải phụ đề cho video này. Lỗi: ' + detail;
}

function extractPlayerResponse(html) {
  const m = /ytInitialPlayerResponse\s*=\s*\{/.exec(html);
  if (!m) return null;

  const start = m.index + m[0].length - 1;
  let depth = 0;
  let inStr = false;
  let esc = false;

  for (let i = start; i < html.length; i++) {
    const c = html[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) {
        try { return JSON.parse(html.slice(start, i + 1)); }
        catch { return null; }
      }
    }
  }
  return null;
}

function pickTrack(tracks) {
  return tracks.find((t) => t.languageCode === 'en' && t.kind !== 'asr')
      || tracks.find((t) => t.languageCode === 'en')
      || tracks[0];
}

async function waitFor(fn, timeout) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    const v = fn();
    if (v) return v;
    await sleep(250);
  }
  return null;
}

async function tracksFromWatchPage(videoId, reasons) {
  try {
    const html = await fetchText(`https://www.youtube.com/watch?v=${videoId}`);
    const pr = extractPlayerResponse(html);
    if (!pr) reasons.push('trang watch: không tìm thấy dữ liệu player');
    const tracks = pr?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
    if (!tracks.length) reasons.push('trang watch: không có danh sách phụ đề');
    return tracks;
  } catch (err) {
    reasons.push('trang watch: ' + err.message);
    return [];
  }
}

function findTranscriptButton() {
  // Ưu tiên nút trong khu vực transcript của mô tả (kể cả khi đang ẩn: click() vẫn hoạt động)
  const inSection = document.querySelector(
    'ytd-video-description-transcript-section-renderer button'
  );
  if (inSection) return inSection;

  return [...document.querySelectorAll('button, yt-button-shape button')].find((b) => {
    const label = (b.getAttribute('aria-label') || b.textContent || '').trim();
    return TRANSCRIPT_LABEL.test(label);
  }) || null;
}

function findTranscriptMenuItem() {
  return [...document.querySelectorAll('ytd-menu-service-item-renderer, tp-yt-paper-item')]
    .find((el) => TRANSCRIPT_LABEL.test(el.textContent || '')) || null;
}

const TRANSCRIPT_SEGMENT_SELECTOR = [
  'ytd-transcript-segment-renderer',
  'ytd-transcript-segment-list-renderer ytd-transcript-segment-renderer',
  'transcript-segment-view-model',
  '[class*="transcript-segment"]',
].join(',');

function transcriptSegments() {
  return [...document.querySelectorAll(TRANSCRIPT_SEGMENT_SELECTOR)].filter((el) => (el.textContent || '').trim());
}

async function openTranscriptPanel(reasons) {
  if (transcriptSegments().length) return 'ok';

  // Cách 1: nút trong mô tả (mở rộng mô tả nếu cần)
  let btn = findTranscriptButton();
  if (!btn) {
    document.querySelector(
      '#description-inline-expander #expand, ytd-text-inline-expander #expand, #expand'
    )?.click();
    await sleep(800);
    btn = findTranscriptButton();
  }
  if (btn) {
    btn.click();
  } else {
    // Cách 2: menu "..." (More actions) của video
    const moreBtn = document.querySelector(
      'ytd-menu-renderer button[aria-label], #top-level-buttons-computed button[aria-label*="action" i]'
    );
    moreBtn?.click();
    await sleep(600);
    const item = findTranscriptMenuItem();
    if (!item) {
      document.body.click(); // đóng menu nếu đang mở
      reasons.push('DOM: không tìm thấy nút/menu "Hiển thị bản ghi" (video có thể không có transcript)');
      return 'missing';
    }
    item.click();
  }

  const ok = await waitFor(() => transcriptSegments().length, 6000);
  if (!ok) reasons.push('DOM: đã bấm nút bản ghi nhưng panel không hiện các đoạn');
  return ok ? 'ok' : 'failed';
}

function parseTimestamp(text) {
  const parts = text.trim().split(':').map(Number);
  if (!parts.length || parts.some(isNaN)) return null;
  return parts.reduce((acc, v) => acc * 60 + v, 0);
}

function segmentTextAndTime(seg) {
  const timestampEl = seg.querySelector('.segment-timestamp, [class*="timestamp"]');
  let time = parseTimestamp(timestampEl?.textContent || '');
  let text = (seg.querySelector('.segment-text, [class*="segment-text"]')?.textContent || '').replace(/\s+/g, ' ').trim();
  if (time == null || !text) {
    const raw = (seg.textContent || '').replace(/\s+/g, ' ').trim();
    const m = raw.match(/(\d{1,2}:\d{2}(?::\d{2})?)/);
    if (!m) return null;
    if (time == null) time = parseTimestamp(m[1]);
    if (!text) text = `${raw.slice(0, m.index)} ${raw.slice(m.index + m[1].length)}`.replace(/\s+/g, ' ').trim();
  }
  return time == null || !text ? null : { start: time, en: text };
}

function captionsFromTranscriptPanel() {
  const items = [];
  for (const seg of transcriptSegments()) {
    const parsed = segmentTextAndTime(seg);
    if (parsed) items.push(parsed);
  }
  return items.map((it, i) => {
    const next = items[i + 1]?.start;
    const end = next != null ? Math.max(next, it.start + 0.5) : it.start + 3;
    return { id: i, start: it.start, end, en: it.en, vi: 'Đang dịch...' };
  });
}

// ---------- Nguồn dự phòng: đọc phụ đề đang hiển thị trên video ----------
// YouTube đã chặn timedtext (trả 200 nhưng rỗng) nên phải đọc caption hiển thị (CC).
const LIVE_POLL_MS = 400;
const LIVE_CUE_SECONDS = 3;
let livePollTimer = null, liveLastText = '', liveLastCue = null, liveTranslating = false;

function visibleCaptionText() {
  const parts = [...document.querySelectorAll('.ytp-caption-window-container .ytp-caption-segment')]
    .map((el) => el.textContent || '');
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

function ensureCaptionsOn() {
  const btn = document.querySelector('.ytp-subtitles-button');
  if (btn && btn.getAttribute('aria-pressed') === 'false') btn.click();
}

function stopLiveCaptionCapture() {
  if (livePollTimer) clearInterval(livePollTimer);
  livePollTimer = null;
  liveLastText = '';
  liveLastCue = null;
}

function translateQueuedCues() {
  if (liveTranslating) return;
  liveTranslating = true;
  Promise.resolve(translateAll(state.loadToken)).finally(() => { liveTranslating = false; });
}

function appendLiveCue(text, at) {
  if (liveLastCue) liveLastCue.end = Math.max(liveLastCue.end, at);
  const cue = { start: at, end: at + LIVE_CUE_SECONDS, en: text, vi: PENDING };
  state.rawCues.push(cue);
  liveLastCue = cue;
  state.captions = state.rawCues.map((c, i) => ({
    id: i,
    start: c.start,
    end: c.end,
    en: c.en,
    vi: state.viCache.get(c.en) || c.vi || PENDING,
  }));
  renderTranscriptList();
  onTimeUpdate();
  translateQueuedCues();
}

function startLiveCaptionCapture(reasons) {
  stopLiveCaptionCapture();
  ensureCaptionsOn();
  setStatus('Đang đọc phụ đề trực tiếp từ video. Hãy bật phụ đề (CC) nếu chưa thấy chữ.');
  livePollTimer = setInterval(() => {
    const video = state.videoEl || document.querySelector('video');
    if (!video) return;
    const text = visibleCaptionText();
    if (!text || text === liveLastText) return;
    liveLastText = text;
    appendLiveCue(text, video.currentTime);
  }, LIVE_POLL_MS);
  reasons.push('đọc phụ đề trực tiếp từ video');
}

function splitCueText(cue) {
  const raw = cue.en.split(/(?<=[.!?…]["'”’)\]]*)\s+/);
  const merged = [];
  for (const piece of raw) {
    const last = merged.length - 1;
    if (last >= 0 && ABBREVIATION_RE.test(merged[last])) {
      merged[last] = merged[last] + ' ' + piece; // "Mr. Smith" không tách
    } else {
      merged.push(piece);
    }
  }

  const total = cue.en.length;
  const span = cue.end - cue.start;
  let offset = 0;
  return merged.map((text) => {
    const startOff = offset;
    offset += text.length + 1; // +1 cho khoảng trắng đã cắt
    return {
      text,
      start: cue.start + span * (startOff / total),
      end: cue.start + span * (Math.min(offset - 1, total) / total),
    };
  });
}

function resegmentBySentence(cues) {
  const sentences = [];
  let buf = null;

  for (const cue of cues) {
    for (const piece of splitCueText(cue)) {
      if (!buf) buf = { start: piece.start, end: piece.end, text: '' };
      buf.text = (buf.text + ' ' + piece.text).trim();
      buf.end = piece.end;

      const wordCount = buf.text.split(/\s+/).length;
      const tooLong = buf.end - buf.start > MAX_SENTENCE_SEC || wordCount > MAX_SENTENCE_WORDS;
      if (SENTENCE_END_RE.test(buf.text) || tooLong) {
        sentences.push(buf);
        buf = null;
      }
    }
  }
  if (buf && buf.text) sentences.push(buf);

  return sentences.map((s, i) => ({
    id: i,
    start: s.start,
    end: Math.max(s.end, s.start + 0.5),
    en: s.text,
    vi: 'Đang dịch...',
  }));
}

function parseCaptions(events) {
  const list = [];
  for (const ev of events || []) {
    if (!ev.segs || ev.tStartMs == null) continue;

    const text = ev.segs.map((s) => s.utf8 || '').join('').replace(/\s+/g, ' ').trim();
    if (!text) continue;

    const start = ev.tStartMs / 1000;
    const end = start + (ev.dDurationMs || 2000) / 1000;

    // Phụ đề tự động của YouTube hay lặp lại cùng câu: gộp lại
    const prev = list[list.length - 1];
    if (prev && prev.en === text) {
      prev.end = end;
      continue;
    }

    list.push({ id: list.length, start, end, en: text, vi: 'Đang dịch...' });
  }
  return list;
}

async function translateRaw(text) {
  const url = 'https://translate.googleapis.com/translate_a/single'
    + `?client=gtx&sl=auto&tl=vi&dt=t&q=${encodeURIComponent(text)}`;
  const data = JSON.parse(await fetchText(url));
  return data[0].map((seg) => seg[0] || '').join('');
}

async function translateBatch(texts) {
  const joined = await translateRaw(texts.join(' ||| '));
  const parts = joined.split(/\s*\|\s*\|\s*\|\s*/).map((s) => s.trim());
  if (parts.length === texts.length) return parts;

  const out = [];
  for (const t of texts) out.push((await translateRaw(t)).trim());
  return out;
}


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
  };
}

async function restoreSettings() {
  const d = defaultSettings();
  try {
    const stored = (await browser.storage.local.get(SETTINGS_KEY))[SETTINGS_KEY];
    if (!stored) return d;
    return mergeSettings(d, stored);
  } catch {
    return d;
  }
}

let settings = defaultSettings();

// Trả về nhóm màu/cỡ chữ: 'en'|'vi' (phụ đề chính) hoặc 'side-en'|'side-vi' (phụ đề thanh bên)
function groupRef(g) {
  return g.startsWith('side-') ? settings.side[g.slice(5)] : settings.sub[g];
}

function setOrRemove(el, prop, val) {
  if (val) el.style.setProperty(prop, val);
  else el.style.removeProperty(prop);
}

function saveSettings() {
  try { browser.storage.local.set({ [SETTINGS_KEY]: settings }); } catch {}
}

function applySettings() {
  const root = overlayEl();
  if (!root) return;

  root.classList.toggle('theme-dark', settings.theme === 'dark');
  root.classList.toggle('theme-light', settings.theme !== 'dark');
  root.classList.toggle('te-controls-hidden', !!settings.hideControls);
  root.classList.toggle('hide-vi', isVietnameseHidden());
  root.classList.toggle('size-s', settings.size === 'S');
  root.classList.toggle('size-m', settings.size === 'M');
  root.classList.toggle('size-l', settings.size !== 'S' && settings.size !== 'M');
  root.style.setProperty('--te-side-en', (16 * settings.side.en.pct / 100) + 'px');
  root.style.setProperty('--te-side-vi', (16 * settings.side.vi.pct / 100) + 'px');
  setOrRemove(root, '--te-side-en-color', settings.side.en.color);
  setOrRemove(root, '--te-side-vi-color', settings.side.vi.color);

  const enEl = $('te-sub-en-text');
  const viEl = $('te-sub-vi-text');
  const fam = settings.sub.font ? FONT_STACKS[settings.sub.font] : '';
  enEl.style.fontSize = settings.sub.en.pct === 100 ? '' : `calc(24px * ${settings.sub.en.pct / 100})`;
  viEl.style.fontSize = settings.sub.vi.pct === 100 ? '' : `calc(24px * ${settings.sub.vi.pct / 100})`;
  enEl.style.fontWeight = settings.sub.bold ? '700' : '';
  viEl.style.fontWeight = settings.sub.bold ? '600' : '';
  enEl.style.fontFamily = fam;
  viEl.style.fontFamily = fam;
  enEl.style.color = settings.sub.en.color || '';
  viEl.style.color = settings.sub.vi.color || '';

  $('te-theme-label').textContent = settings.theme === 'dark' ? 'Dark' : 'Light';

  // Đồng bộ công tắc trong menu cài đặt chính
  const mainSw = $('te-modal-main').querySelectorAll('input[type=checkbox]');
  if (mainSw[2]) mainSw[2].checked = settings.splitSentences;
  if (mainSw[3]) mainSw[3].checked = isVietnameseHidden();
  if (mainSw[4]) mainSw[4].checked = settings.hideControls;

  // Đồng bộ menu "Tùy chọn phụ đề"
  const sub = $('te-modal-sub');
  const groups = sub.querySelectorAll('.te-btn-group');
  const presetIdx = PRESET_VALUES.indexOf(settings.sub.en.pct);
  groups[0].querySelectorAll('button').forEach((b, i) => b.classList.toggle('active', i === presetIdx));
  groups[1].querySelectorAll('button').forEach((b, i) => b.classList.toggle('active', i === (settings.sub.bold ? 1 : 0)));
  const sizeIdx = { S: 0, M: 1, L: 2 }[settings.size] ?? 2;
  groups[2].querySelectorAll('button').forEach((b, i) => b.classList.toggle('active', i === sizeIdx));
  sub.querySelector('select').value = settings.sub.font || 'Inter';

  const counters = sub.querySelectorAll('.te-counter-btn');
  counters[0].nextElementSibling.textContent = settings.sub.en.pct + '%';
  counters[2].nextElementSibling.textContent = settings.sub.vi.pct + '%';
  ['en', 'vi'].forEach((k) => {
    const minus = sub.querySelector(`.te-counter-btn[data-group="side-${k}"][data-delta="-10"]`);
    if (minus) minus.nextElementSibling.textContent = settings.side[k].pct + '%';
  });

  sub.querySelectorAll('.te-color-pill').forEach((pill, i) => {
    const g = pill.dataset.group || ['en', 'vi', 'en', 'vi'][i];
    const color = groupRef(g).color;
    pill.style.background = color || pill.dataset.defaultBg;
    const picker = pill.querySelector('input');
    if (picker) picker.value = color || DEFAULT_HEX[g];
  });
}

// ---------- Overlay: tạo, mở, đóng ----------
function buildOverlay() {
  const host = document.createElement('div');
  host.id = HOST_ID;
  host.style.display = 'none';
  document.body.appendChild(host);
  shadow = host.attachShadow({ mode: 'open' });
  shadow.innerHTML = `<style>${OVERLAY_CSS}</style>${OVERLAY_HTML}`;
  overlayEl().classList.add('te-hidden');
  bindUI();
  applySettings();
  $('te-modal-main').classList.add('hidden');

  // Thêm các font như v1.4 (giữ nguyên các font có sẵn)
  const subSel = $('te-modal-sub').querySelector('select');
  Object.keys(FONT_STACKS).forEach((name) => {
    if (![...subSel.options].some((o) => o.value === name)) subSel.add(new Option(name, name));
  });

  // Nhóm "Chế độ đọc" -> Nhỏ / Vừa / Lớn (kích thước video)
  const sizeBtns = $('te-modal-sub').querySelectorAll('.te-btn-group')[2].querySelectorAll('button');
  ['Nhỏ', 'Vừa', 'Lớn'].forEach((t, i) => {
    sizeBtns[i].textContent = t;
    sizeBtns[i].dataset.size = ['S', 'M', 'L'][i];
  });
}

function ensureLauncher() {
  if (document.getElementById(LAUNCHER_ID)) return;
  const btn = document.createElement('button');
  btn.id = LAUNCHER_ID;
  btn.title = 'Mở Trancy';
  btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zM6 10h2v2H6zm0 4h8v2H6zm10 0h2v2h-2zm-6-4h8v2h-8z"/></svg>';
  btn.addEventListener('click', openOverlay);
  document.body.appendChild(btn);
}

function openOverlay() {
  if (!overlayEl()) buildOverlay();
  const video = document.querySelector('video');
  const slot = ui('.te-video-slot');
  if (!video || !slot) {
    alert('Không tìm thấy video trên trang.');
    return;
  }
  overlayEl().classList.remove('te-hidden');
  shadow.host.style.display = '';
  state.open = true;
  attachVideo(video, slot);
  setVideoTitle();
  if (state.captions.length === 0 && state.loadingFor !== state.videoId) loadCaptions();
}

function closeOverlay() {
  overlayEl()?.classList.add('te-hidden');
  if (shadow) shadow.host.style.display = 'none';
  uiAll('.te-modal-backdrop').forEach((m) => m.classList.add('hidden'));
  state.open = false;
  stopLiveCaptionCapture();
  detachVideo();
}

function attachVideo(video, slot) {
  if (state.videoEl && state.videoEl !== video) detachVideo();
  if (video.parentElement !== slot) {
    state.origParent = video.parentElement;
    state.origNext = video.nextSibling;
    const wasPlaying = !video.paused;
    slot.insertBefore(video, slot.firstChild);
    if (wasPlaying) video.play().catch(() => {});
  }
  state.videoEl = video;
  video.controls = false;
  video.addEventListener('timeupdate', onTimeUpdate);
  video.addEventListener('play', syncPlayButton);
  video.addEventListener('pause', syncPlayButton);
  video.addEventListener('ratechange', syncSpeedButton);
  video.addEventListener('volumechange', syncMuteButton);
  syncPlayButton();
  syncSpeedButton();
  syncMuteButton();
  onTimeUpdate();
}

function detachVideo() {
  const v = state.videoEl;
  if (!v) return;
  v.removeEventListener('timeupdate', onTimeUpdate);
  v.removeEventListener('play', syncPlayButton);
  v.removeEventListener('pause', syncPlayButton);
  v.removeEventListener('ratechange', syncSpeedButton);
  v.removeEventListener('volumechange', syncMuteButton);
  if (state.origParent && v.parentElement !== state.origParent) {
    const next = state.origNext && state.origNext.parentNode === state.origParent ? state.origNext : null;
    const wasPlaying = !v.paused;
    state.origParent.insertBefore(v, next);
    if (wasPlaying) v.play().catch(() => {});
  }
  state.videoEl = null;
  state.origParent = null;
  state.origNext = null;
}

function setVideoTitle() {
  const t = (document.title || '').replace(/\s*-\s*YouTube$/, '').trim();
  const el = ui('.te-video-title-label');
  if (el) el.textContent = t || 'YouTube video';
}

// ---------- Điều khiển phát ----------
function togglePlay() {
  const v = state.videoEl;
  if (!v) return;
  if (v.paused) v.play().catch(() => {});
  else v.pause();
}

function syncPlayButton() {
  const v = state.videoEl;
  const btn = ctrl('Phát/Tạm dừng');
  if (!v || !btn) return;
  btn.querySelector('svg').innerHTML = v.paused ? PLAY_PATH : PAUSE_PATH;
}

function cycleSpeed() {
  const v = state.videoEl;
  if (!v) return;
  const i = SPEEDS.indexOf(v.playbackRate);
  v.playbackRate = SPEEDS[i < 0 ? 2 : (i + 1) % SPEEDS.length];
  syncSpeedButton();
}

function syncSpeedButton() {
  const v = state.videoEl;
  const btn = ctrl('Tốc độ');
  if (v && btn) btn.setAttribute('aria-label', `Tốc độ ${v.playbackRate}x`);
}

function toggleMute() {
  const v = state.videoEl;
  if (v) v.muted = !v.muted;
}

function syncMuteButton() {
  const v = state.videoEl;
  const btn = ctrl('Audio');
  if (v && btn) btn.style.opacity = v.muted ? '0.4' : '';
}

function toggleFullscreen() {
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
  } else {
    shadow?.host.requestFullscreen?.().catch(() => {});
  }
}

function seekPrevCaption() {
  const v = state.videoEl;
  if (!v || state.captions.length === 0) return;
  const idx = findCaptionIndex(v.currentTime);
  if (idx < 0) {
    v.currentTime = state.captions[0].start;
    return;
  }
  const cur = state.captions[idx];
  // Đang giữa câu (quá 1.5 giây) thì về đầu câu, giống nút "trước" của trình phát
  const target = (v.currentTime - cur.start > 1.5 || idx === 0) ? cur : state.captions[idx - 1];
  v.currentTime = target.start;
}

function seekNextCaption() {
  const v = state.videoEl;
  if (!v || state.captions.length === 0) return;
  const next = state.captions[findCaptionIndex(v.currentTime) + 1];
  if (next) v.currentTime = next.start;
}

function seekByTrack(e) {
  const v = state.videoEl;
  if (!v || !v.duration) return;
  const r = e.currentTarget.getBoundingClientRect();
  const ratio = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
  v.currentTime = ratio * v.duration;
}

// ---------- Đồng bộ phụ đề với video ----------
function findCaptionIndex(t) {
  let lo = 0;
  let hi = state.captions.length - 1;
  let ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (state.captions[mid].start <= t) {
      ans = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return ans;
}

function onTimeUpdate() {
  const v = state.videoEl;
  if (!v) return;

  const dur = v.duration || 0;
  const fill = ui('.te-progress-fill');
  if (fill) fill.style.width = dur ? `${(v.currentTime / dur) * 100}%` : '0%';

  if (state.captions.length === 0) return;

  if (state.loop && state.activeIdx >= 0) {
    const cur = state.captions[state.activeIdx];
    if (v.currentTime >= cur.end) {
      v.currentTime = cur.start;
      return;
    }
  }

  const idx = findCaptionIndex(v.currentTime);
  if (idx >= 0 && idx !== state.activeIdx) setActiveCaption(idx);
}

function setActiveCaption(idx) {
  state.activeIdx = idx;
  const cap = state.captions[idx];
  $('te-sub-en-text').textContent = cap.en;
  $('te-sub-vi-text').textContent = cap.vi;

  const list = $('te-transcript-list');
  list.querySelectorAll('.yt-dual-item.active').forEach((r) => r.classList.remove('active'));
  const row = list.querySelector(`.yt-dual-item[data-idx="${idx}"]`);
  if (row) {
    row.classList.add('active');
    list.scrollTop = row.offsetTop - list.clientHeight / 2 + row.offsetHeight / 2;
  }
}

function setStatus(text) {
  if (!overlayEl()) return;
  $('te-sub-en-text').textContent = text;
  $('te-sub-vi-text').textContent = '';
  const list = $('te-transcript-list');
  list.innerHTML = text ? `<div class="yt-dual-empty">${escapeHtml(text)}</div>` : '';
}

// ---------- Transcript ----------
function renderTranscriptList() {
  const list = $('te-transcript-list');
  list.innerHTML = state.captions.map((c, i) => `
    <div class="yt-dual-item" data-idx="${i}">
      <div class="yt-dual-timestamp">${formatTime(c.start)}</div>
      <div class="yt-dual-content">
        <div class="yt-dual-item-en">${escapeHtml(c.en)}</div>
        <div class="yt-dual-item-vi">${escapeHtml(c.vi)}</div>
      </div>
    </div>`).join('');
  state.activeIdx = -1;
}

function updateVietnameseRow(item) {
  const idx = state.captions.indexOf(item);
  if (idx < 0) return;
  const row = $('te-transcript-list').querySelector(`.yt-dual-item[data-idx="${idx}"]`);
  if (row) row.querySelector('.yt-dual-item-vi').textContent = item.vi;
  if (idx === state.activeIdx) $('te-sub-vi-text').textContent = item.vi;
}

function buildCaptions() {
  const base = settings.splitSentences ? resegmentBySentence(state.rawCues) : state.rawCues;
  state.captions = base.map((c, i) => ({
    id: i,
    start: c.start,
    end: c.end,
    en: c.en,
    vi: state.viCache.get(c.en) || PENDING,
  }));
  renderTranscriptList();
}

function rebuildCaptions() {
  if (state.rawCues.length === 0) return;
  state.loadingFor = null;
  buildCaptions();
  onTimeUpdate();
  translateAll(++state.loadToken);
}

async function translateAll(token) {
  const pending = state.captions.filter((c) => c.vi === PENDING);
  for (let i = 0; i < pending.length; i += BATCH_SIZE) {
    const chunk = pending.slice(i, i + BATCH_SIZE);
    let parts;
    try {
      parts = await translateBatch(chunk.map((c) => c.en));
    } catch (err) {
      console.error('[Trancy] Lỗi dịch:', err);
      parts = [];
    }
    if (token !== state.loadToken) return;
    chunk.forEach((item, idx) => {
      item.vi = parts[idx] || '(không dịch được)';
      state.viCache.set(item.en, item.vi);
      updateVietnameseRow(item);
    });
  }
}

async function loadCaptions() {
  const videoId = state.videoId;
  if (!videoId) return;

  const token = ++state.loadToken;
  state.loadingFor = videoId;
  setStatus('Đang tải phụ đề...');

  const reasons = [];
  try {
    const tracks = await tracksFromWatchPage(videoId, reasons);
    if (token !== state.loadToken) return;

    let cues = [];
    if (tracks.length) {
      const preferred = pickTrack(tracks);
      const ordered = [preferred, ...tracks.filter((t) => t !== preferred)];
      for (const track of ordered.slice(0, 3)) {
        try {
          const raw = await fetchText(track.baseUrl + '&fmt=json3');
          if (token !== state.loadToken) return;
          if (!raw) { reasons.push('timedtext rỗng'); continue; }
          cues = parseCaptions(JSON.parse(raw).events);
          if (cues.length) break;
          reasons.push('timedtext không có dòng nào');
        } catch (err) {
          reasons.push('timedtext: ' + err.message);
        }
      }
    }

    let domResult = null;
    if (cues.length === 0) {
      const domReasons = [];
      domResult = await openTranscriptPanel(domReasons);
      if (token !== state.loadToken) return;
      if (domResult === 'ok') {
        cues = captionsFromTranscriptPanel();
        if (cues.length === 0) domReasons.push('DOM: không đọc được đoạn nào');
      }
      reasons.push(...domReasons);
    }

    if (cues.length === 0) {
      // timedtext đã bị YouTube chặn và panel bản ghi không đọc được → đọc phụ đề đang hiển thị.
      console.warn('[Trancy] Không lấy được phụ đề từ timedtext/transcript:', reasons);
      startLiveCaptionCapture(reasons);
      return;
    }

    state.rawCues = cues;
    buildCaptions();
    state.loadingFor = null;
    translateAll(token);
  } catch (err) {
    console.error('[Trancy] Lỗi tải phụ đề:', err);
    if (token === state.loadToken) setStatus(errorText([...reasons, err.message]));
  } finally {
    if (token === state.loadToken) state.loadingFor = null;
  }
}

function onTranscriptClick(e) {
  const row = e.target.closest('.yt-dual-item');
  const v = state.videoEl;
  if (!row || !v) return;
  const cap = state.captions[Number(row.dataset.idx)];
  if (!cap) return;
  v.currentTime = cap.start;
  v.play().catch(() => {});
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

// ---------- Xuất phụ đề ----------
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
  return t || state.videoId || 'subtitles';
}

function printPdf(title, showTime, includeVi) {
  const w = window.open('', '_blank');
  if (!w) {
    alert('Trình duyệt đang chặn cửa sổ mới. Hãy cho phép bật lên cho YouTube rồi thử lại.');
    return;
  }
  const rows = state.captions.map((c) =>
    `<tr>${showTime ? `<td class="t">${formatTime(c.start)}</td>` : ''}` +
    `<td>${escapeHtml(c.en)}</td>${includeVi ? `<td>${escapeHtml(c.vi)}</td>` : ''}</tr>`
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
    alert('Chưa có phụ đề để xuất.');
    return;
  }
  const { onlySubs, includeVi, showTime } = opts;
  const base = exportBaseName();
  const caps = state.captions;

  if (format === 'SRT') {
    const body = caps.map((c, i) =>
      `${i + 1}\n${srtTime(c.start)} --> ${srtTime(c.end)}\n${c.en}${includeVi ? '\n' + c.vi : ''}\n`
    ).join('\n');
    downloadText(`${base}.srt`, body, 'text/plain;charset=utf-8');
  } else if (format === 'TXT') {
    const body = caps.map((c) =>
      (showTime ? `[${formatTime(c.start)}] ` : '') + c.en + (includeVi ? '\n' + c.vi : '')
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
      if (includeVi) cols.push(c.vi);
      lines.push(cols.map(q).join(','));
    }
    downloadText(`${base}.csv`, '\uFEFF' + lines.join('\n'), 'text/csv;charset=utf-8');
  } else {
    printPdf(base, showTime, includeVi);
  }
}

function runExport() {
  const modal = $('te-modal-export');
  const format = modal.querySelector('.te-export-tab.active')?.textContent.trim() || 'SRT';
  const cbs = modal.querySelectorAll('input[type=checkbox]');
  const onlySubs = !!cbs[2]?.checked;
  exportAs(format, {
    onlySubs,
    includeVi: !!cbs[3]?.checked,
    showTime: !!cbs[4]?.checked && !onlySubs,
  });
}

// ---------- Gắn sự kiện cho giao diện ----------
function bindUI() {
  const root = overlayEl();
  const modalMain = $('te-modal-main');
  const modalSub = $('te-modal-sub');
  const modalMark = $('te-modal-mark');
  const modalLang = $('te-modal-lang');
  const modalExport = $('te-modal-export');
  const settingsBtn = $('te-settings-btn');
  const floatingBtn = $('te-floating-btn');

  // Định vị menu bên trái nút cài đặt (giống bản UI gốc)
  const positionModal = (modalEl) => {
    const box = modalEl.querySelector('.te-modal-box');
    if (!box) return;
    const btnRect = settingsBtn.getBoundingClientRect();
    const modalWidth = 360;
    box.style.left = Math.max(10, btnRect.left - modalWidth - 12 + 38) + 'px';
    box.style.bottom = (window.innerHeight - btnRect.top + 12) + 'px';
    box.style.right = 'auto';
  };

  const hideAll = () => uiAll('.te-modal-backdrop').forEach((m) => m.classList.add('hidden'));

  const toggleMain = (e) => {
    e.stopPropagation();
    const wasHidden = modalMain.classList.contains('hidden');
    hideAll();
    if (wasHidden) {
      modalMain.classList.remove('hidden');
      positionModal(modalMain);
    }
  };
  settingsBtn.addEventListener('click', toggleMain);
  floatingBtn.addEventListener('click', toggleMain);
  $('te-close-modal').addEventListener('click', () => modalMain.classList.add('hidden'));

  uiAll('.te-modal-backdrop').forEach((bd) => {
    bd.addEventListener('click', (e) => {
      if (e.target === bd) bd.classList.add('hidden');
    });
  });

  // Chủ đề sáng / tối
  $('toggle-theme-btn').addEventListener('click', () => {
    settings.theme = settings.theme === 'dark' ? 'light' : 'dark';
    saveSettings();
    applySettings();
  });

  // Điều hướng sang menu con và quay lại
  const nav = (openId, target, backId) => {
    $(openId).addEventListener('click', () => {
      modalMain.classList.add('hidden');
      target.classList.remove('hidden');
      positionModal(target);
    });
    $(backId).addEventListener('click', () => {
      target.classList.add('hidden');
      modalMain.classList.remove('hidden');
      positionModal(modalMain);
    });
  };
  nav('open-sub-modal', modalSub, 'back-sub');
  nav('open-mark-modal', modalMark, 'back-mark');
  nav('open-lang-modal', modalLang, 'back-lang');
  nav('open-export-modal', modalExport, 'back-export');

  // Nút chọn trong nhóm: chỉ đổi trạng thái active (giữ như UI gốc)
  uiAll('.te-btn-group, .te-export-tab-group').forEach((group) => {
    const buttons = group.querySelectorAll('.te-btn-subopt, .te-export-tab');
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        buttons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  });

  // Công tắc trong menu chính: [0] di chuột để dịch, [1] nhấp để phát âm,
  // [2] kết hợp câu, [3] ẩn thanh điều khiển
  const mainSw = modalMain.querySelectorAll('input[type=checkbox]');
  mainSw[2].addEventListener('change', (e) => {
    settings.splitSentences = e.target.checked;
    saveSettings();
    rebuildCaptions();
  });
  mainSw[3].addEventListener('change', (e) => setVietnameseHidden(e.target.checked));
  mainSw[4].addEventListener('change', (e) => {
    settings.hideControls = e.target.checked;
    saveSettings();
    applySettings();
  });

  // Thanh điều khiển trên video
  ctrl('Lặp lại câu').addEventListener('click', (e) => {
    state.loop = !state.loop;
    e.currentTarget.classList.toggle('te-active', state.loop);
  });
  ctrl('Câu trước').addEventListener('click', seekPrevCaption);
  ctrl('Câu tiếp theo').addEventListener('click', seekNextCaption);
  ctrl('Phát/Tạm dừng').addEventListener('click', togglePlay);
  ctrl('Tốc độ').addEventListener('click', cycleSpeed);
  ctrl('Audio').addEventListener('click', toggleMute);
  ctrl('Chế độ phụ đề').addEventListener('click', (e) => {
    root.classList.toggle('te-subs-hidden');
    e.currentTarget.classList.toggle('te-active', root.classList.contains('te-subs-hidden'));
  });
  ctrl('Bố cục').addEventListener('click', (e) => {
    root.classList.toggle('te-sidebar-hidden');
    e.currentTarget.classList.toggle('te-active', root.classList.contains('te-sidebar-hidden'));
  });
  ctrl('Toàn màn hình').addEventListener('click', toggleFullscreen);
  ui('.te-progress-track').addEventListener('click', seekByTrack);
  ui('.yt-dual-close-btn').addEventListener('click', closeOverlay);

  $('te-transcript-list').addEventListener('click', onTranscriptClick);

  // Tùy chọn phụ đề
  const subGroups = modalSub.querySelectorAll('.te-btn-group');
  subGroups[0].querySelectorAll('button').forEach((b, i) => {
    b.addEventListener('click', () => {
      settings.sub.en.pct = PRESET_VALUES[i];
      settings.sub.vi.pct = Math.round(PRESET_VALUES[i] * 0.9);
      saveSettings();
      applySettings();
    });
  });
  subGroups[1].querySelectorAll('button').forEach((b, i) => {
    b.addEventListener('click', () => {
      settings.sub.bold = i === 1;
      saveSettings();
      applySettings();
    });
  });
  modalSub.querySelector('select').addEventListener('change', (e) => {
    settings.sub.font = e.target.value;
    saveSettings();
    applySettings();
  });

  modalSub.querySelectorAll('.te-btn-group')[2].querySelectorAll('button').forEach((b) => {
    b.addEventListener('click', () => {
      settings.size = b.dataset.size;
      saveSettings();
      applySettings();
    });
  });

  const counters = modalSub.querySelectorAll('.te-counter-btn'); // [EN -, EN +, VI -, VI +]
  const bindCounter = (btn, g, delta) => btn.addEventListener('click', () => {
    settings.sub[g].pct = Math.min(200, Math.max(50, settings.sub[g].pct + delta));
    saveSettings();
    applySettings();
  });
  bindCounter(counters[0], 'en', -10);
  bindCounter(counters[1], 'en', 10);
  bindCounter(counters[2], 'vi', -10);
  bindCounter(counters[3], 'vi', 10);

  // Cỡ chữ phụ đề thanh bên (px)
  modalSub.querySelectorAll('.te-counter-btn[data-group]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const k = btn.dataset.group.slice(5);
      settings.side[k].pct = Math.min(200, Math.max(50, settings.side[k].pct + Number(btn.dataset.delta)));
      saveSettings();
      applySettings();
    });
  });

  // Ô màu: input màu trong suốt phủ lên từng ô, bấm là mở bảng chọn màu của trình duyệt
  const pills = modalSub.querySelectorAll('.te-color-pill');
  const pillGroup = ['en', 'vi', 'en', 'vi'];
  pills.forEach((pill, i) => {
    const g = pill.dataset.group || pillGroup[i];
    pill.dataset.defaultBg = pill.style.background;
    pill.style.position = 'relative';
    const picker = document.createElement('input');
    picker.type = 'color';
    picker.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer;border:0;padding:0;';
    picker.value = groupRef(g).color || DEFAULT_HEX[g];
    picker.addEventListener('input', () => {
      groupRef(g).color = picker.value;
      saveSettings();
      applySettings();
    });
    pill.appendChild(picker);
  });

  // Đặt lại (nút ở góc phải tiêu đề menu phụ đề)
  modalSub.querySelector('.te-modal-header button:last-child').addEventListener('click', () => {
    settings.sub = defaultSettings().sub;
    settings.side = defaultSettings().side;
    saveSettings();
    applySettings();
  });

  // Xuất phụ đề
  modalExport.querySelector('.te-export-submit-btn').addEventListener('click', runExport);
}

// ---------- Theo dõi điều hướng của YouTube ----------
// Keepit có thể bị tắt trên riêng website này (Alt+Z) — khi đó ẩn nút mở và đóng overlay.
let keepitSiteDisabled = false;
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
  if (keepitSiteDisabled) {
    const launcher = document.getElementById(LAUNCHER_ID);
    if (launcher) launcher.style.display = 'none';
    if (state.open) closeOverlay();
  }
}

function tick() {
  if (keepitSiteDisabled) return;
  const isWatch = location.pathname === '/watch';
  ensureLauncher();
  const launcher = document.getElementById(LAUNCHER_ID);
  if (launcher) launcher.style.display = isWatch ? '' : 'none';

  const videoId = isWatch ? new URLSearchParams(location.search).get('v') : null;
  if (videoId === state.videoId) return;

  if (state.open) closeOverlay();
  stopLiveCaptionCapture();
  state.videoId = videoId;
  state.loadToken++;
  state.rawCues = [];
  state.captions = [];
  state.activeIdx = -1;
  state.viCache = new Map();
  state.loadingFor = null;

  if (overlayEl()) {
    setStatus('');
    setVideoTitle();
  }
}

// Chỉ chạy trên YouTube: Keepit nạp content script cho mọi website nên phải tự giới hạn ở đây.
if (/^(www\.)?youtube\.com$/i.test(location.hostname)) {
  setInterval(tick, 1000);
  tick();
  void restoreSettings().then(loaded => { settings = loaded; if (overlayEl()) applySettings(); });
  void refreshKeepitGate();
  browser.storage.onChanged.addListener((changes, area) => { if (area === 'local' && changes.lhnSettings) void refreshKeepitGate(); });
}
