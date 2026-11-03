// Chế độ bố cục overlay: ambient, khung video
// Tách từ js/video/dual-subtitles.js (v3.5.26). Nội dung giữ nguyên, chỉ đổi vị trí file.

// ---------- Ambient mode (ánh sáng mờ theo màu video, giống YouTube) ----------
let ambientTimer = 0, ambientLastTime = -1, ambientObserver = null;
// Đặt tâm vòng sáng ở giữa khung video (overlay cố định tại 0,0 nên dùng thẳng toạ độ viewport).
// Ambient UI chỉ bật/tắt (Ambient 3); giữ renderer viền 1/2 trong mã để có thể bật lại sau.
function isEdgeAmbient() { const m = ambientMode(); return m === '1' || m === '2'; }
function ambientMode() {
  return settings.ambient === false || settings.ambientStyle === 'off' ? 'off' : '3';
}
function syncAmbientUi() {
  const toggle = $('te-ambient-toggle');
  if (!toggle) return;
  toggle.checked = ambientMode() !== 'off';
  toggle.setAttribute('aria-label', videoT('videoAmbientMode'));
}
function setAmbientMode(mode) {
  if (mode !== 'off' && mode !== '3') return;
  settings.ambientStyle = mode;
  settings.ambient = mode !== 'off';
  saveSettings();
  syncAmbientUi();
  stopAmbient();
  if (state.videoEl && mode !== 'off') startAmbient();
}
function placeAmbientEdge() {
  const root = overlayEl(), slot = ui('.te-video-slot'), edge = ui('.te-ambient-edge');
  if (!root || !slot || !edge) return;
  const r = slot.getBoundingClientRect(), rr = root.getBoundingClientRect();
  if (!r.width || !r.height) return;
  const vw = document.documentElement.clientWidth, vh = document.documentElement.clientHeight;
  // Khoảng trống còn lại theo từng hướng; ánh sáng lan tối đa 50% (Ambient 1) hoặc 100% (Ambient 2) khoảng đó
  const reach = ambientMode() === '2' ? 1.0 : 0.5;
  if (rr && root.classList.contains('te-sidebar-hidden')) {
    // Chế độ rạp: phủ kín toàn màn hình
    const ew = Math.max(vw, vh * 16 / 9) * 1.05, eh = ew * 9 / 16;
    edge.style.setProperty('--te-edge-l', `${Math.round((vw - ew) / 2 - rr.left)}px`);
    edge.style.setProperty('--te-edge-t', `${Math.round((vh - eh) / 2 - rr.top)}px`);
    edge.style.setProperty('--te-edge-w', `${Math.round(ew)}px`);
    edge.style.setProperty('--te-edge-h', `${Math.round(eh)}px`);
    return;
  }
  const spL = Math.max(0, r.left), spR = Math.max(0, vw - r.right), spT = Math.max(0, r.top), spB = Math.max(0, vh - r.bottom);
  const boxW = r.width + reach * spL + reach * spR, boxH = r.height + reach * spT + reach * spB;
  // Ảnh giữ tỉ lệ 16:9, lớn nhất có thể trong hộp, đặt giữa video
  const w = Math.min(boxW, boxH * 16 / 9), h = w * 9 / 16;
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  edge.style.setProperty('--te-edge-l', `${Math.round(cx - w / 2 - rr.left)}px`);
  edge.style.setProperty('--te-edge-t', `${Math.round(cy - h / 2 - rr.top)}px`);
  edge.style.setProperty('--te-edge-w', `${Math.round(w)}px`);
  edge.style.setProperty('--te-edge-h', `${Math.round(h)}px`);
}
function drawAmbientEdge() {
  const canvas = ui('.te-ambient-edge'), v = state.videoEl;
  if (!canvas || !v || v.currentTime === ambientLastTime) return;
  try {
    const ctx = canvas.getContext('2d');
    ctx.globalAlpha = Math.abs(v.currentTime - ambientLastTime) > 1.5 ? 1 : 0.35;
    ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
    // Chỉ giữ viền khung hình: phần giữa bị video che nên xóa đi
    ctx.clearRect(canvas.width * 0.15, canvas.height * 0.15, canvas.width * 0.7, canvas.height * 0.7);
    ambientLastTime = v.currentTime;
  } catch { stopAmbient(); }
}
function placeAmbient() {
  if (isEdgeAmbient()) return placeAmbientEdge();
  const root = overlayEl(), slot = ui('.te-video-slot');
  if (!root || !slot) return;
  if (root.classList.contains('te-sidebar-hidden')) {
    // Chế độ rạp: phủ kín toàn màn hình (cả 2 khung đen hai bên)
    const vw = innerWidth, vh = innerHeight;
    root.style.setProperty('--te-amb-x', `${Math.round(vw / 2)}px`);
    root.style.setProperty('--te-amb-y', `${Math.round(vh / 2)}px`);
    root.style.setProperty('--te-amb-size', `${Math.round(Math.max(vh, vw * 9 / 16) * 1.05)}px`);
    return;
  }
  const r = slot.getBoundingClientRect();
  if (!r.width || !r.height) return;
  root.style.setProperty('--te-amb-x', `${Math.round(r.left + r.width / 2)}px`);
  root.style.setProperty('--te-amb-y', `${Math.round(r.top + r.height / 2)}px`);
  root.style.setProperty('--te-amb-size', `${Math.round(Math.max(r.width, r.height) * 2.1)}px`);
}
function drawAmbient() {
  if (isEdgeAmbient()) return drawAmbientEdge();
  const canvas = ui('.te-ambient'), v = state.videoEl;
  const isWebThumbnail = state.webStudy;
  const source = isWebThumbnail ? state.webThumbnail : v;
  if (!canvas || !source || document.hidden) return;
  if (isWebThumbnail) {
    if (ambientLastTime >= 0 || !source.complete || !source.naturalWidth) return;
  } else {
    if (v.readyState < 2 || v.currentTime === ambientLastTime) return; // tạm dừng/không đổi khung thì không vẽ lại
  }
  try {
    const ctx = canvas.getContext('2d');
    // Web dùng thumbnail tĩnh; YouTube pha khung hình mới để màu chuyển mượt.
    ctx.globalAlpha = isWebThumbnail || Math.abs(v.currentTime - ambientLastTime) > 1.5 ? 1 : 0.35;
    if (isWebThumbnail) ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    ambientLastTime = isWebThumbnail ? 0 : v.currentTime;
  } catch { stopAmbient(); } // video không cho đọc hình (DRM/cross-origin): tắt hiệu ứng
}
function startAmbient() {
  stopAmbient();
  overlayEl()?.classList.toggle('te-ambient-mode-2', isEdgeAmbient());
  const root = overlayEl(), canvas = ui('.te-ambient'), slot = ui('.te-video-slot');
  if (!root || !canvas || !slot || settings.ambient === false || globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  placeAmbient();
  if (typeof ResizeObserver === 'function') { ambientObserver = new ResizeObserver(placeAmbient); ambientObserver.observe(slot); ambientObserver.observe(document.documentElement); }
  root.classList.add('te-ambient-on');
  drawAmbient();
  ambientTimer = setInterval(drawAmbient, 125);
}
function stopAmbient() {
  clearInterval(ambientTimer);
  ambientTimer = 0;
  ambientLastTime = -1;
  ambientObserver?.disconnect();
  ambientObserver = null;
  overlayEl()?.classList.remove('te-ambient-on');
  const canvas = ui('.te-ambient');
  canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
}

function setVideoTitle() {
  const t = (document.title || '').replace(/\s*-\s*YouTube$/, '').trim() || (state.webStudy ? location.hostname : 'YouTube video');
  const el = ui('.te-video-title-text');
  if (el) el.textContent = t;
  const miniTitle = ui('.te-reading-mini-title');
  if (miniTitle) miniTitle.textContent = `Keepit - ${t}`;
  const miniSource = ui('.te-reading-mini-source');
  if (miniSource) miniSource.textContent = videoT('dictationAudioSource');
  const miniThumb = ui('.te-reading-mini-thumb');
  const thumbnails = globalThis.LHN_THUMBNAILS;
  if (state.webStudy && miniThumb && thumbnails?.loadSource) {
    miniThumb.hidden = false;
    const thumbnailUrl = thumbnails.fromPageMetadata?.(document, location.href) || '';
    thumbnails.loadSource(miniThumb, { url: location.href, thumbnailUrl, onError:() => { miniThumb.hidden = true; reportWebIssue('The mini-player thumbnail could not be loaded.', null, { level: 'error' }); } });
  } else if (miniThumb && thumbnails?.youtubeVideoId(state.videoId || '')) {
    miniThumb.hidden = false;
    thumbnails.loadYouTube(miniThumb, state.videoId, { onError:() => { miniThumb.hidden = true; } });
  } else {
    if (miniThumb) miniThumb.hidden = true;
    thumbnails?.clear(miniThumb);
  }
  syncReadingAudioControls();
}

function syncReadingAudioControls() {
  const root = overlayEl();
  const toggle = ui('#te-reading-video-toggle');
  const bar = ui('.te-reading-mini-audio');
  const play = ui('#te-reading-mini-play');
  if (!root || !toggle || !bar || !play) return;
  const reading = isReadingModeActive();
  const compact = reading && root.classList.contains('te-reading-audio-compact');
  toggle.disabled = !reading;
  toggle.setAttribute('aria-pressed', String(compact));
  const toggleLabel = videoT(compact ? 'dictationExpandVideo' : 'dictationCompactVideo');
  toggle.title = toggleLabel;
  toggle.setAttribute('aria-label', toggleLabel);
  const videoIcon = '<path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/>';
  const audioIcon = '<path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/>';
  toggle.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${compact ? audioIcon : videoIcon}</svg>`;
  bar.setAttribute('aria-hidden', String(!compact));
  bar.setAttribute('aria-label', videoT('dictationAudioTitle'));
  const playing = Boolean(state.videoEl && !state.videoEl.paused);
  bar.classList.toggle('playing', playing);
  const playLabel = videoT(playing ? 'dictationMiniPause' : 'dictationMiniPlay');
  play.title = playLabel;
  play.setAttribute('aria-label', playLabel);
  play.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${playing ? PAUSE_PATH : PLAY_PATH}</svg>`;
}

function setReadingAudioCompact(compact) {
  const root = overlayEl();
  if (!root || !isReadingModeActive()) return false;
  const nextCompact = Boolean(compact);
  const modeChanged = root.classList.contains('te-reading-audio-compact') !== nextCompact;
  if (modeChanged) suppressHoverPauseForModeChange();
  root.classList.toggle('te-reading-audio-compact', nextCompact);
  syncReadingAudioControls();
  scheduleHoverPauseSync({ modeChange: modeChanged });
  return nextCompact;
}

function toggleReadingAudioCompact() {
  if (!isReadingModeActive()) return false;
  return setReadingAudioCompact(!overlayEl().classList.contains('te-reading-audio-compact'));
}

