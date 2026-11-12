// YouTube source: caption discovery, transcript cache, cue model, and video timing.
const PRELOAD_SECONDS = 300;
const LOOKAHEAD_SECONDS = 600;
const TRANSCRIPT_CACHE_LIMIT = 20;
const transcriptCache = new Map(); // video + ngôn ngữ -> cue[] đã làm sạch, LRU trong trang
const transcriptTrackLanguageCache = new Map();
const failedUntil = new Map(); // videoId -> thời điểm hết hạn cache lỗi
const FAILED_CACHE_MS = 10 * 60 * 1000;
let loadedUntil = 0;               // mốc thời gian đã nạp xong (giây)
let activeStatusKey = '';
let activeStatusVars = {};
let prefetchToken = 0;
let prefetchTimer = 0;
const SENTENCE_END_RE = /[.!?…]["'”’)\]]*$/;
const ABBREVIATION_RE = /\b(mr|mrs|ms|dr|vs|etc|e\.g|i\.e|st|no)\.$/i;
const MAX_SENTENCE_SEC = 12;
const MAX_SENTENCE_WORDS = 30;
const MIN_TRANSCRIPT_LINE_WORDS = 5;
const TRANSCRIPT_LABEL = /show transcript|hiển thị bản ghi|bản ghi/i;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchText(url) {
  const res = await globalThis.LHN_MESSAGING.sendMessage({ type: 'YOUTUBE_FETCH_TEXT', url });
  if (!res?.ok) throw new Error(res?.error || 'Fetch thất bại');
  return res.text;
}

function errorText(reasons) {
  return { detail: reasons.length ? reasons.join(' | ') : 'không rõ nguyên nhân' };
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

function trackLanguageCode(track) {
  return String(track?.languageCode || '').toLowerCase().split('-')[0];
}

// Auto source follows the default audio track's linked caption, not YouTube's account-locale `isDefault` flag.
function audioTrackCaptionFor(tracks, tracklist) {
  const audioTracks = Array.isArray(tracklist?.audioTracks) ? tracklist.audioTracks : [];
  const defaultIndex = Number(tracklist?.defaultAudioTrackIndex);
  const audioTrack = Number.isInteger(defaultIndex) && defaultIndex >= 0 && defaultIndex < audioTracks.length
    ? audioTracks[defaultIndex]
    : audioTracks.find((item) => item?.isDefault) || null;
  if (!audioTrack) return null;

  const trackAt = (index) => {
    const value = Number(index);
    return Number.isInteger(value) && value >= 0 && value < tracks.length ? tracks[value] : null;
  };
  const mappedTracks = Array.isArray(audioTrack.captionTrackIndices)
    ? audioTrack.captionTrackIndices.map(trackAt).filter(Boolean)
    : [];
  const audioLanguage = String(audioTrack.audioTrackId || '').split('.')[0].toLowerCase().split('-')[0];
  if (audioLanguage) {
    const matching = (mappedTracks.length ? mappedTracks : tracks)
      .filter((track) => trackLanguageCode(track) === audioLanguage)
      .sort((a, b) => Number(a.kind === 'asr') - Number(b.kind === 'asr'))[0];
    if (matching) return matching;
  }

  const defaultCaption = trackAt(audioTrack.defaultCaptionTrackIndex ?? tracklist?.defaultCaptionTrackIndex);
  if (defaultCaption && (!mappedTracks.length || mappedTracks.includes(defaultCaption))) return defaultCaption;
  return mappedTracks.find((track) => track.kind !== 'asr') || mappedTracks[0] || null;
}

function originalTrackFor(tracks, tracklist) {
  return audioTrackCaptionFor(tracks, tracklist)
    || tracks.find((track) => track.isDefault)
    || tracks.find((track) => track.kind !== 'asr')
    || tracks[0]
    || null;
}

function selectLanguageTrack(tracks, language, tracklist = null) {
  const original = originalTrackFor(tracks, tracklist);
  if (!language || language === 'auto') return { track: original, original, needsTranslation: false };
  const matching = tracks
    .filter((track) => trackLanguageCode(track) === language)
    .sort((a, b) => Number(a.kind === 'asr') - Number(b.kind === 'asr'))[0] || null;
  return { track: matching || original, original, needsTranslation: !matching && !!original };
}

function markSingleTrackCues(cues, language = state.sourceLanguage) {
  const sourceNeedsTranslation = state.sourceLanguageSetting !== 'auto' && language !== state.sourceLanguageSetting;
  const targetNeedsTranslation = language !== state.targetLanguage;
  state.primaryNeedsTranslation = sourceNeedsTranslation;
  state.secondaryNeedsTranslation = targetNeedsTranslation;
  state.mainLanguage = state.sourceLanguageSetting === 'auto' ? (language || 'en') : state.sourceLanguageSetting;
  return cues.map((cue) => ({
    ...cue,
    mainNeedsTranslation: sourceNeedsTranslation,
    mainTranslationInput: cue.en,
    mainText: sourceNeedsTranslation ? PENDING : cue.en,
    secondaryNeedsTranslation: targetNeedsTranslation,
    secondaryTranslationInput: cue.en,
    vi: targetNeedsTranslation ? PENDING : cue.en,
  }));
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
    const tracklist = pr?.captions?.playerCaptionsTracklistRenderer || null;
    if (!tracklist?.captionTracks?.length) reasons.push('trang watch: không có danh sách phụ đề');
    return tracklist;
  } catch (err) {
    reasons.push('trang watch: ' + err.message);
    return [];
  }
}

let lastTranscriptButton = null;
function findTranscriptButton() {
  if (lastTranscriptButton && lastTranscriptButton.isConnected) return lastTranscriptButton;
  lastTranscriptButton = findTranscriptButtonUncached();
  return lastTranscriptButton;
}
function findTranscriptButtonUncached() {
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
const LIVE_STABLE_TICKS = 2; // text phải ổn định ~0.8s mới chốt thành cue
let livePollTimer = null, liveLastCue = null;
let livePendingText = '', livePendingTicks = 0, livePendingStart = 0, liveCommittedText = '';

function visibleCaptionText() {
  const parts = [...document.querySelectorAll('.ytp-caption-window-container .ytp-caption-segment')]
    .map((el) => el.textContent || '');
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

let ccStartedByKeepit = false;
function ensureCaptionsOn() {
  const btn = document.querySelector('.ytp-subtitles-button');
  if (btn && btn.getAttribute('aria-pressed') === 'false') { btn.click(); ccStartedByKeepit = true; }
}

function restoreCaptionsState() {
  const btn = document.querySelector('.ytp-subtitles-button');
  if (ccStartedByKeepit && btn && btn.getAttribute('aria-pressed') === 'true') btn.click();
  ccStartedByKeepit = false;
}

function stopLiveCaptionCapture() {
  restoreCaptionsState();
  if (livePollTimer) clearInterval(livePollTimer);
  livePollTimer = null;
  liveLastCue = null;
  livePendingText = '';
  livePendingTicks = 0;
  liveCommittedText = '';
}

// YouTube hay cộng dồn chữ trong container: text mới có thể chứa cả cue trước.
// Khi đó mở rộng cue hiện tại thay vì tạo cue mới (tránh lặp 1 câu 2 lần).
function commitLiveCue(text, start, nowAt) {
  const last = liveLastCue;
  if (last && text.startsWith(last.en)) {
    if (text !== last.en) last.en = text;
    last.end = Math.max(last.end, nowAt);
  } else if (last && last.en.startsWith(text)) {
    last.end = Math.max(last.end, nowAt);
  } else {
    if (last) last.end = Math.max(last.end, start);
    liveLastCue = { start, end: start + LIVE_CUE_SECONDS, en: text, vi: PENDING };
    state.rawCues.push(liveLastCue);
  }
  buildCaptions();
  onTimeUpdate();
  translateWindow(Math.max(0, state.captions.length - 1));
}

function startLiveCaptionCapture(reasons) {
  stopLiveCaptionCapture();
  ensureCaptionsOn();
  setStatus(overlayT('videoLiveCaptionStatus'), 'videoLiveCaptionStatus');
  livePollTimer = setInterval(() => {
    const video = state.activeMedia || document.querySelector('video');
    if (!video) return;
    const text = visibleCaptionText();
    if (!text) { livePendingText = ''; livePendingTicks = 0; return; }
    if (text === livePendingText) livePendingTicks++;
    else { livePendingText = text; livePendingTicks = 1; livePendingStart = video.currentTime; }
    if (livePendingTicks < LIVE_STABLE_TICKS) return;
    if (text === liveCommittedText) return;
    liveCommittedText = text;
    commitLiveCue(text, livePendingStart, video.currentTime);
  }, LIVE_POLL_MS);
  reasons.push('đọc phụ đề trực tiếp từ video');
}

function splitCueText(cue, sourceText = cue.en) {
  const raw = sourceText.split(/(?<=[.!?…]["'”’)\]]*)\s+/);
  const merged = [];
  for (const piece of raw) {
    const last = merged.length - 1;
    if (last >= 0 && ABBREVIATION_RE.test(merged[last])) {
      merged[last] = merged[last] + ' ' + piece; // "Mr. Smith" không tách
    } else {
      merged.push(piece);
    }
  }

  const total = sourceText.length;
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

function cleanSentenceSegmentText(text) {
  return String(text ?? '')
    .replace(/\[[^\]]*\]/gu, ' ')
    .replace(/>>/gu, ' ')
    .replace(/\s+/gu, ' ')
    .replace(/\s+([,.;:!?…])/gu, '$1')
    .trim();
}

function transcriptLineWordCount(cue) {
  const text = String(cue?.en || '').trim();
  return text ? text.split(/\s+/u).length : 0;
}

function canMergeTranscriptLines(left, right) {
  const wordCount = transcriptLineWordCount(left) + transcriptLineWordCount(right);
  const duration = Math.max(left.end, right.end) - Math.min(left.start, right.start);
  return wordCount <= MAX_SENTENCE_WORDS && duration <= MAX_SENTENCE_SEC;
}

function mergeTranscriptLines(left, right) {
  const en = `${left.en} ${right.en}`.replace(/\s+/gu, ' ').trim();
  const mainNeedsTranslation = !!left.mainNeedsTranslation || !!right.mainNeedsTranslation;
  const secondaryNeedsTranslation = !!left.secondaryNeedsTranslation || !!right.secondaryNeedsTranslation;
  const translatedParts = [left.vi, right.vi]
    .filter((text) => text && text !== PENDING)
    .map((text) => String(text).trim())
    .filter(Boolean);
  const mainInputs = [left.mainTranslationInput, right.mainTranslationInput].filter(Boolean);
  const secondaryInputs = [left.secondaryTranslationInput, right.secondaryTranslationInput].filter(Boolean);

  return {
    ...left,
    end: Math.max(left.end, right.end),
    en,
    mainNeedsTranslation,
    secondaryNeedsTranslation,
    mainTranslationInput: mainNeedsTranslation ? en : mainInputs.join(' ') || en,
    secondaryTranslationInput: secondaryNeedsTranslation ? en : secondaryInputs.join(' ') || en,
    mainText: mainNeedsTranslation ? PENDING : en,
    vi: secondaryNeedsTranslation ? PENDING : (translatedParts.join(' ') || en),
  };
}

function mergeShortTranscriptLines(cues) {
  const merged = [];
  for (let i = 0; i < cues.length; i++) {
    let current = cues[i];
    while (transcriptLineWordCount(current) < MIN_TRANSCRIPT_LINE_WORDS && i + 1 < cues.length) {
      const next = cues[i + 1];
      if (!canMergeTranscriptLines(current, next)) break;
      current = mergeTranscriptLines(current, next);
      i++;
    }
    merged.push(current);
  }

  // If the final short line cannot merge forward, try to attach it to preceding lines.
  while (merged.length > 1 && transcriptLineWordCount(merged[merged.length - 1]) < MIN_TRANSCRIPT_LINE_WORDS) {
    const lastIndex = merged.length - 1;
    if (!canMergeTranscriptLines(merged[lastIndex - 1], merged[lastIndex])) break;
    merged[lastIndex - 1] = mergeTranscriptLines(merged[lastIndex - 1], merged[lastIndex]);
    merged.pop();
  }
  return merged.map((cue, index) => ({ ...cue, id:index }));
}

function resegmentBySentence(cues) {
  const sentences = [];
  let buf = null;

  for (const cue of cues) {
    const sourceText = cleanSentenceSegmentText(cue.en);
    if (!sourceText) continue;
    const cleanedCue = { ...cue, en:sourceText };
    const sourcePieces = splitCueText(cleanedCue, sourceText);
    const originalTranslation = String(cue.vi || '').trim();
    const translatedText = originalTranslation === PENDING
      ? PENDING
      : cleanSentenceSegmentText(originalTranslation);
    const translatedPieces = translatedText && translatedText !== PENDING
      ? splitCueText(cleanedCue, translatedText)
      : [];
    for (let pieceIndex = 0; pieceIndex < sourcePieces.length; pieceIndex++) {
      const piece = sourcePieces[pieceIndex];
      if (!buf) buf = { ...cleanedCue, vi:translatedText, start:piece.start, end:piece.end, text:'', translatedText:'', lastTranslatedPiece:'' };
      buf.text = (buf.text + ' ' + piece.text).trim();
      buf.end = piece.end;
      const translatedPiece = translatedPieces.length === sourcePieces.length
        ? translatedPieces[pieceIndex].text
        : pieceIndex === 0 ? translatedText : '';
      if (translatedPiece && translatedPiece !== buf.lastTranslatedPiece) {
        buf.translatedText = (buf.translatedText + ' ' + translatedPiece).trim();
        buf.lastTranslatedPiece = translatedPiece;
      }

      const wordCount = buf.text.split(/\s+/).length;
      const tooLong = buf.end - buf.start > MAX_SENTENCE_SEC || wordCount > MAX_SENTENCE_WORDS;
      if (SENTENCE_END_RE.test(buf.text) || tooLong) {
        sentences.push(buf);
        buf = null;
      }
    }
  }
  if (buf && buf.text) sentences.push(buf);

  const segmented = sentences.map((s, i) => ({
    ...s,
    id: i,
    start: s.start,
    end: Math.max(s.end, s.start + 0.5),
    en: s.text,
    mainTranslationInput: s.mainNeedsTranslation ? s.text : s.mainTranslationInput,
    secondaryTranslationInput: s.secondaryNeedsTranslation ? s.text : s.secondaryTranslationInput,
    mainText: s.mainNeedsTranslation ? PENDING : s.text,
    vi: s.secondaryNeedsTranslation ? PENDING : (s.translatedText || s.vi || s.text),
  }));
  return mergeShortTranscriptLines(segmented);
}

// ---------- Dịch lười qua module translate của Keepit ----------
// Dùng message BILINGUAL_TRANSLATE (background: LHN_TRANSLATE + LHN_CACHE) và chỉ dịch
// những cue quanh vị trí đang phát / đang xem, thay vì dịch toàn bộ danh sách ngay.
function attachVideo(video, slot) {
  if (state.activeMedia && state.activeMedia !== video) detachActiveMedia();
  const frame = slot.querySelector(':scope > .te-player-frame') || slot;
  if (video.parentElement !== frame) {
    state.origParent = video.parentElement;
    state.origNext = video.nextSibling;
    const wasPlaying = !video.paused;
    frame.insertBefore(video, frame.firstChild);
    if (wasPlaying) video.play().catch(() => {});
  }
  state.activeMedia = video;
  video.controls = false;
  video.addEventListener('click', handlePlayerClick);
  video.addEventListener('timeupdate', onTimeUpdate);
  video.addEventListener('play', enforceVideoPause);
  enforceVideoPause(video);
  onTimeUpdate();
}

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
  const v = state.activeMedia;
  if (!v) return;

  const dur = v.duration || 0;

  if (state.captions.length === 0) return;

  if (state.sourceType !== 'web' && state.loop && state.activeIdx >= 0) {
    const cur = state.captions[state.activeIdx];
    if (v.currentTime >= cur.end) {
      v.currentTime = cur.start;
      return;
    }
  }

  const idx = findCaptionIndex(v.currentTime);
  if (idx >= 0 && idx !== state.activeIdx) {
    setActiveCaption(idx);
    translateWindow(idx);
  }
  // Overlay đang mở: giữ cửa sổ phụ đề trước vị trí phát 10 phút.
  if (state.open && state.sourceType !== 'web') extendLoadedWindow();
}

function dedupeSentences(list) {
  const out = [];
  for (const cue of list) {
    const text = String(cue.en || '').replace(/\s+/g, ' ').trim();
    if (!text) continue;
    const prev = out[out.length - 1];
    if (prev && prev.en === text && Math.abs(prev.start - cue.start) < 1.5) {
      prev.end = Math.max(prev.end, cue.end);
      continue;
    }
    out.push({ ...cue, en: text });
  }
  return out;
}

function buildCaptions() {
  const base = dedupeSentences(settings.splitSentences ? resegmentBySentence(state.rawCues) : state.rawCues);
  state.captions = base.map((c, i) => {
    const mainNeedsTranslation = c.mainNeedsTranslation ?? state.primaryNeedsTranslation;
    const secondaryNeedsTranslation = c.secondaryNeedsTranslation ?? state.secondaryNeedsTranslation;
    const mainInput = c.mainTranslationInput || c.en;
    const secondaryInput = c.secondaryTranslationInput || c.en;
    const mainCached = mainNeedsTranslation ? state.viCache.get(translationCacheKey(mainInput, state.mainLanguage)) : null;
    const secondaryCached = secondaryNeedsTranslation ? state.viCache.get(translationCacheKey(secondaryInput, state.targetLanguage)) : null;
    return {
      ...c,
      id: i,
      start: c.start,
      end: c.end,
      en: c.en,
      mainNeedsTranslation,
      secondaryNeedsTranslation,
      mainTranslationInput: mainInput,
      secondaryTranslationInput: secondaryInput,
      mainText: mainNeedsTranslation ? (mainCached || PENDING) : (c.mainText || c.en),
      vi: secondaryNeedsTranslation ? (secondaryCached || PENDING) : (c.vi || c.en),
    };
  });
  renderTranscriptList();
  announceOverlayCaptionsUpdated();
}

// ---------- Làm sạch, cửa sổ hiển thị và prefetch ----------
// Chuẩn hoá cue tải về: bỏ rỗng/sai thời gian, sắp xếp, cắt chồng lấn, gộp câu trùng liền kề.
function cleanCues(list) {
  const cleaned = [];
  for (const cue of list || []) {
    const text = String(cue?.en || '').replace(/\s+/g, ' ').trim();
    const start = Number(cue?.start);
    if (!text || !Number.isFinite(start) || start < 0) continue;
    const end = Number(cue?.end);
    cleaned.push({ ...cue, start, end: Number.isFinite(end) && end > start ? end : start + 2, en: text, vi: cue.vi || PENDING });
  }
  cleaned.sort((a, b) => a.start - b.start);
  for (let i = 0; i < cleaned.length - 1; i++) {
    const next = cleaned[i + 1];
    if (next.start > cleaned[i].start && cleaned[i].end > next.start) cleaned[i].end = next.start;
  }
  return dedupeSentences(cleaned);
}

// Chỉ dựng danh sách cho phần đã nạp (cửa sổ), không render toàn bộ video dài.
function applyLoadedWindow() {
  if (state.sourceType === 'web' || !state.allCues.length) return;
  const windowCues = state.allCues.filter((cue) => loadedUntil <= 0 || cue.start < loadedUntil);
  if (!windowCues.length) return;
  state.rawCues = windowCues;
  buildCaptions();
  onTimeUpdate();
  translateWindow(Math.max(0, state.activeIdx));
}

// Khi overlay mở: nới cửa sổ tới vị trí đang phát + 10 phút (chỉ nới, không thu lại).
function extendLoadedWindow() {
  if (state.sourceType === 'web' || !state.allCues.length) return;
  const video = state.activeMedia || document.querySelector('video');
  const current = Number(video?.currentTime) || 0;
  const duration = Number.isFinite(video?.duration) ? video.duration : Infinity;
  const target = Math.min(duration, current + LOOKAHEAD_SECONDS);
  if (target <= loadedUntil + 5) return;
  loadedUntil = Math.max(loadedUntil, target);
  applyLoadedWindow();
}

function transcriptVariantKey() {
  return `${state.sourceLanguageSetting}:${state.targetLanguage}`;
}

function transcriptMemoryKey(videoId) {
  return `${videoId}:${transcriptVariantKey()}`;
}

function promoteTranscriptVideoInMemory(videoId) {
  const prefix = `${videoId}:`;
  for (const [key, cues] of [...transcriptCache]) {
    if (!key.startsWith(prefix)) continue;
    const trackLanguage = transcriptTrackLanguageCache.get(key) || '';
    transcriptCache.delete(key);
    transcriptTrackLanguageCache.delete(key);
    transcriptCache.set(key, cues);
    transcriptTrackLanguageCache.set(key, trackLanguage);
  }
}

function trimTranscriptMemoryCache() {
  const videoIds = [];
  for (const key of transcriptCache.keys()) {
    const videoId = key.slice(0, key.indexOf(':'));
    if (videoId && !videoIds.includes(videoId)) videoIds.push(videoId);
  }
  while (videoIds.length > TRANSCRIPT_CACHE_LIMIT) {
    const expiredVideoId = videoIds.shift();
    const prefix = `${expiredVideoId}:`;
    for (const key of [...transcriptCache.keys()]) {
      if (!key.startsWith(prefix)) continue;
      transcriptCache.delete(key);
      transcriptTrackLanguageCache.delete(key);
    }
  }
}

async function storeTranscript(videoId, cues) {
  if (!videoId || !cues.length) return;
  const variantKey = transcriptVariantKey();
  const key = `${videoId}:${variantKey}`;
  transcriptCache.delete(key);
  transcriptTrackLanguageCache.delete(key);
  transcriptCache.set(key, cues);
  transcriptTrackLanguageCache.set(key, state.sourceLanguage);
  promoteTranscriptVideoInMemory(videoId);
  trimTranscriptMemoryCache();

  try {
    await globalThis.LHN_MESSAGING.sendMessage({
      type: 'YOUTUBE_TRANSCRIPT_CACHE_SAVE',
      videoId,
      variantKey,
      transcript: { cues, captionTrackLanguage: state.sourceLanguage },
    });
  } catch (error) {
    console.warn('[keepit] Could not save video transcript cache:', error);
  }
}

function takeCachedTranscript(videoId) {
  const key = transcriptMemoryKey(videoId);
  const cached = transcriptCache.get(key);
  state.sourceLanguage = transcriptTrackLanguageCache.get(key) || '';
  state.primaryNeedsTranslation = !!cached?.[0]?.mainNeedsTranslation;
  state.secondaryNeedsTranslation = !!cached?.[0]?.secondaryNeedsTranslation;
  state.mainLanguage = state.sourceLanguageSetting === 'auto' ? (state.sourceLanguage || 'en') : state.sourceLanguageSetting;
  if (!cached?.length) return null;
  promoteTranscriptVideoInMemory(videoId);
  return cached;
}

async function getCachedTranscript(videoId) {
  const variantKey = transcriptVariantKey();
  const key = `${videoId}:${variantKey}`;
  const cached = takeCachedTranscript(videoId);
  if (cached) {
    try {
      void globalThis.LHN_MESSAGING.sendMessage({ type:'YOUTUBE_TRANSCRIPT_CACHE_TOUCH', videoId, variantKey })
        .catch(error => console.warn('[keepit] Could not touch video transcript cache:', error));
    } catch (error) {
      console.warn('[keepit] Could not touch video transcript cache:', error);
    }
    return cached;
  }

  try {
    const persisted = await globalThis.LHN_MESSAGING.sendMessage({ type:'YOUTUBE_TRANSCRIPT_CACHE_GET', videoId, variantKey });
    if (!Array.isArray(persisted?.cues) || !persisted.cues.length || key !== transcriptMemoryKey(videoId)) return null;
    transcriptCache.set(key, persisted.cues);
    transcriptTrackLanguageCache.set(key, persisted.captionTrackLanguage || '');
    promoteTranscriptVideoInMemory(videoId);
    trimTranscriptMemoryCache();
    return takeCachedTranscript(videoId);
  } catch (error) {
    console.warn('[keepit] Could not read video transcript cache:', error);
    return null;
  }
}

function schedulePrefetch(videoId) {
  if (prefetchTimer) clearTimeout(prefetchTimer);
  prefetchToken++;
  prefetchTimer = window.setTimeout(() => { void prefetchTranscript(videoId); }, 1500);
}

// Ngầm tải phụ đề khi vừa mở video; người dùng không thấy thay đổi nào trên trang.
async function prefetchTranscript(videoId) {
  if (!videoId || keepitSiteDisabled) return;
  if (document.visibilityState !== 'visible') return; // (1) chỉ prefetch khi tab đang hiển thị
  if ((failedUntil.get(videoId) || 0) > Date.now()) return; // (3) đang trong thời hạn cache lỗi
  if (state.sourceId !== videoId) return;
  const token = prefetchToken;
  const cached = await getCachedTranscript(videoId);
  if (token !== prefetchToken || state.sourceId !== videoId) return;
  if (cached) {
    state.allCues = cached;
    loadedUntil = Math.max(loadedUntil, PRELOAD_SECONDS);
    applyLoadedWindow();
    return;
  }
  const video = document.querySelector('video');
  if (video?.duration === Infinity) return; // livestream: không có transcript
  const reasons = [];
  const cues = await transcriptFromPlayerApi(videoId, reasons);
  if (token !== prefetchToken || state.sourceId !== videoId) return;
  const cleaned = cleanCues(cues);
  if (!cleaned.length) {
    failedUntil.set(videoId, Date.now() + FAILED_CACHE_MS);
    console.info('[keepit] Prefetch chưa lấy được phụ đề, sẽ thử lại khi mở panel:', reasons.join(' | ') || 'không rõ lý do');
    return;
  }
  void storeTranscript(videoId, cleaned);
  if (token !== prefetchToken || state.sourceId !== videoId) return;
  state.allCues = cleaned;
  loadedUntil = Math.max(loadedUntil, PRELOAD_SECONDS);
  applyLoadedWindow();
  console.info('[keepit] Prefetch xong:', cleaned.length, 'cue (5 phút đầu sẵn sàng)');
}

function rebuildCaptions() {
  if (state.rawCues.length === 0) return;
  state.loadingFor = null;
  buildCaptions();
  onTimeUpdate();
  translateWindow(Math.max(0, state.activeIdx));
}

// ---------- Nguồn chính: port từ youtube-transcript-api (client ANDROID + timedtext XML) ----------
// Thư viện gốc kiểm tra: baseUrl có "&exp=xpe" thì cần PO token -> không tải được, phải rơi xuống nguồn khác.
const INNERTUBE_PLAYER = 'https://www.youtube.com/youtubei/v1/player';
const INNERTUBE_CLIENT = { clientName: 'ANDROID', clientVersion: '20.10.38' };

function decodeEntities(text) {
  const named = { amp: '&', apos: "'", gt: '>', lt: '<', nbsp: ' ', quot: '"' };
  let decoded = String(text || '');
  for (let pass = 0; pass < 4; pass++) {
    const next = decoded.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, code) => {
      if (code[0] !== '#') return named[code.toLowerCase()] ?? entity;
      const number = code[1].toLowerCase() === 'x'
        ? Number.parseInt(code.slice(2), 16)
        : Number.parseInt(code.slice(1), 10);
      try { return Number.isFinite(number) ? String.fromCodePoint(number) : entity; }
      catch { return entity; }
    });
    if (next === decoded) break;
    decoded = next;
  }
  return decoded;
}

function parseTimedTextXml(xml) {
  const out = [];
  const push = (startMs, durationMs, rawText) => {
    const text = decodeEntities(rawText.replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim();
    const start = startMs / 1000;
    if (!text || !Number.isFinite(start)) return;
    const duration = Number.isFinite(durationMs) && durationMs > 0 ? durationMs / 1000 : 2;
    out.push({ start, end: start + duration, en: text, vi: 'Đang dịch...' });
  };
  let match;
  const pTag = /<p\s+t="(\d+)"(?:\s+d="(\d+)")?[^>]*>([\s\S]*?)<\/p>/g;
  while ((match = pTag.exec(xml)) !== null) push(Number(match[1]), Number(match[2] || 0), match[3]);
  if (out.length) return out;
  const textTag = /<text\s+start="([\d.]+)"(?:\s+dur="([\d.]+)")?[^>]*>([\s\S]*?)<\/text>/g;
  while ((match = textTag.exec(xml)) !== null) push(Number(match[1]) * 1000, Number(match[2] || 0) * 1000, match[3]);
  return out;
}

// On m.youtube.com a direct request to www.youtube.com is cross-origin and the browser blocks it
// ("Failed to fetch"); the same paths are served by m.youtube.com, so stay on the page's own origin.
function sameOriginYouTubeUrl(url) {
  return /^m\.youtube\.com$/i.test(location.hostname) ? String(url).replace(/^https:\/\/www\.youtube\.com\//i, `${location.origin}/`) : url;
}

async function fetchTextDirect(url, init = {}) {
  const response = await fetch(sameOriginYouTubeUrl(url), { credentials: 'include', ...init });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

function closestCue(cues, cue) {
  let best = null;
  let bestOverlap = 0;
  let bestDistance = Infinity;
  for (const candidate of cues || []) {
    const overlap = Math.max(0, Math.min(cue.end, candidate.end) - Math.max(cue.start, candidate.start));
    const distance = Math.abs(candidate.start - cue.start);
    if (overlap > bestOverlap || (overlap === bestOverlap && distance < bestDistance)) {
      best = candidate;
      bestOverlap = overlap;
      bestDistance = distance;
    }
  }
  return bestOverlap > 0 || bestDistance <= 1.5 ? best : null;
}

async function cuesForTrack(track, reasons) {
  if (!track?.baseUrl) return [];
  const baseUrl = String(track.baseUrl).replace('&fmt=srv3', '');
  if (baseUrl.includes('&exp=xpe')) {
    reasons.push('player: track cần PO token (exp=xpe)');
    return [];
  }
  try {
    const xml = await fetchTextDirect(baseUrl);
    const cues = parseTimedTextXml(xml);
    if (!cues.length) reasons.push('player: track không có dòng nào');
    return cues;
  } catch (err) {
    reasons.push('player timedtext: ' + err.message);
    return [];
  }
}

async function captionsFromTracks(tracks, reasons, tracklist = null) {
  if (!tracks.length) return [];
  const primary = selectLanguageTrack(tracks, state.sourceLanguageSetting, tracklist);
  const secondary = selectLanguageTrack(tracks, state.targetLanguage, tracklist);
  const original = primary.original;
  const needed = [...new Set([primary.track, secondary.track, (primary.needsTranslation || secondary.needsTranslation) ? original : null].filter(Boolean))];
  const fetched = await Promise.all(needed.map(async (track) => [track, await cuesForTrack(track, reasons)]));
  const byTrack = new Map(fetched);
  const mainCues = byTrack.get(primary.track) || [];
  if (!mainCues.length) return [];
  const originalCues = byTrack.get(original) || mainCues;
  const targetCues = byTrack.get(secondary.track) || [];

  state.sourceLanguage = trackLanguageCode(primary.track);
  state.primaryNeedsTranslation = primary.needsTranslation;
  state.secondaryNeedsTranslation = secondary.needsTranslation;
  state.mainLanguage = state.sourceLanguageSetting === 'auto'
    ? (state.sourceLanguage || state.mainLanguage || 'en')
    : state.sourceLanguageSetting;

  return mainCues.map((cue) => {
    const originalCue = closestCue(originalCues, cue) || cue;
    const targetCue = primary.track === secondary.track
      ? cue
      : closestCue(targetCues, cue);
    const translateMain = primary.needsTranslation;
    const translateSecondary = secondary.needsTranslation || !targetCue;
    return {
      ...cue,
      mainNeedsTranslation: translateMain,
      mainTranslationInput: translateMain ? originalCue.en : cue.en,
      mainText: translateMain ? PENDING : cue.en,
      secondaryNeedsTranslation: translateSecondary,
      secondaryTranslationInput: translateSecondary ? originalCue.en : '',
      vi: translateSecondary ? PENDING : targetCue.en,
    };
  });
}

async function transcriptFromPlayerApi(videoId, reasons) {
  try {
    const html = await fetchTextDirect(`https://www.youtube.com/watch?v=${videoId}`);
    const key = (html.match(/"INNERTUBE_API_KEY":\s*"([a-zA-Z0-9_-]+)"/) || [])[1];
    if (!key) { reasons.push('player: thiếu INNERTUBE_API_KEY'); return []; }
    const res = await fetch(`${sameOriginYouTubeUrl(INNERTUBE_PLAYER)}?key=${encodeURIComponent(key)}&prettyPrint=false`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context: { client: INNERTUBE_CLIENT }, videoId }),
    });
    if (!res.ok) { reasons.push(`player: HTTP ${res.status}`); return []; }
    const data = await res.json();
    const tracklist = data?.captions?.playerCaptionsTracklistRenderer || null;
    const tracks = tracklist?.captionTracks || [];
    if (!tracks.length) { reasons.push('player: video không có caption track'); return []; }
    return await captionsFromTracks(tracks, reasons, tracklist);
  } catch (err) {
    reasons.push('player: ' + err.message);
    return [];
  }
}

async function loadCaptions() {
  if (state.sourceType === 'web') return;
  const videoId = state.sourceId;
  if (!videoId) return;

  const token = ++state.loadToken;
  state.loadingFor = videoId;
  // Prefetch hoặc persistent cache trong background: hiện ngay nếu đã có.
  const cached = await getCachedTranscript(videoId);
  if (token !== state.loadToken || state.sourceId !== videoId) return;
  if (cached) {
    state.allCues = cached;
    loadedUntil = Math.max(loadedUntil, PRELOAD_SECONDS);
    state.loadingFor = null;
    applyLoadedWindow();
    if (state.open) applyDefaultSubtitleDisplayMode();
    return;
  }
  state.sourceLanguage = '';
  state.primaryNeedsTranslation = false;
  state.secondaryNeedsTranslation = false;
  setStatus(overlayT('videoLoadingSubtitles'), 'videoLoadingSubtitles');

  const reasons = [];
  try {
    // 1) Player API (client ANDROID) + timedtext XML — công thức của youtube-transcript-api,
    //    chạy fetch ngay trong content script (same-origin, có cookie phiên).
    let cues = await transcriptFromPlayerApi(videoId, reasons);
    if (token !== state.loadToken) return;

    // 2) Panel "Hiển thị bản ghi" trên trang — nguồn sạch thứ hai, đúng như bản gốc dùng dự phòng.
    if (cues.length === 0) {
      const domReasons = [];
      await openTranscriptPanel(domReasons);
      if (token !== state.loadToken) return;
      cues = captionsFromTranscriptPanel();
      if (cues.length === 0) domReasons.push('DOM: không đọc được đoạn nào');
      reasons.push(...domReasons);
    }

    // 3) timedtext từ HTML trang (bản cũ) — chỉ thử khi 1 và 2 đều trượt.
    if (cues.length === 0) {
      const tracklist = await tracksFromWatchPage(videoId, reasons);
      if (token !== state.loadToken) return;
      const tracks = tracklist?.captionTracks || [];
      if (tracks.length) {
        cues = await captionsFromTracks(tracks, reasons, tracklist);
      }
    }

    if (cues.length === 0) {
      // Cùng đường: đọc phụ đề đang hiển thị (nguồn cuối, chất lượng kém hơn).
      state.primaryNeedsTranslation = false;
      state.sourceLanguage = '';
      console.warn('[keepit] Không lấy được phụ đề từ player/panel/timedtext:', reasons);
      state.allCues = [];
      loadedUntil = 0;
      startLiveCaptionCapture(reasons);
      return;
    }

    if (!Object.prototype.hasOwnProperty.call(cues[0] || {}, 'mainNeedsTranslation')) {
      cues = markSingleTrackCues(cues);
    }

    const cleaned = cleanCues(cues);
    if (!cleaned.length) {
      state.allCues = [];
      loadedUntil = 0;
      startLiveCaptionCapture([...reasons, 'danh sách cue rỗng sau khi làm sạch']);
      return;
    }
    void storeTranscript(videoId, cleaned);
    state.allCues = cleaned;
    loadedUntil = Math.max(loadedUntil, Math.min(PRELOAD_SECONDS, cleaned[cleaned.length - 1].end || PRELOAD_SECONDS));
    console.info('[keepit] Nguồn phụ đề đã dùng:', cleaned.length, 'cue |', reasons.length ? reasons.join(' | ') : 'player API');
    applyLoadedWindow();
    if (state.open) applyDefaultSubtitleDisplayMode();
    state.loadingFor = null;
    translateWindow(0, token);
  } catch (err) {
    console.error('[keepit] Lỗi tải phụ đề:', err);
    if (token === state.loadToken) {
      const error = errorText([...reasons, err.message]);
      setStatus(overlayT('videoCaptionLoadError', error), 'videoCaptionLoadError', error);
    }
  } finally {
    if (token === state.loadToken) {
      state.loadingFor = null;
      announceOverlayCaptionsUpdated();
    }
  }
}
