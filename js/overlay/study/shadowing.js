// Shadowing playback integration; the shared TTS engine remains in Reader.
function startWebTtsInViewMode() {
  if (!state.webStudy || !state.open || !state.videoEl?.paused) return;
  try {
    const playback = state.videoEl.play?.();
    playback?.catch?.((error) => reportWebIssue('Could not start Web TTS playback.', error, { level: 'error' }));
  } catch (error) {
    reportWebIssue('Could not start Web TTS playback.', error, { level: 'error' });
  }
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

// ---------- Điều khiển phát ----------

// Speaking entry belongs to the Shadowing study adapter; the existing shared Dictation engine performs the work.
let shadowingControl = null;
function onShadowingControlClick(event) {
  event.preventDefault();
  event.stopPropagation();
  const dictation = globalThis.LHN_DICTATION;
  if (!dictation?.open) return;
  if (dictation.isOpen?.()) {
    if (dictation.getMode?.() === 'speaking') dictation.close?.();
    else dictation.open({ waitForCaptions: true, mode: 'speaking' });
    return;
  }
  dictation.open({ waitForCaptions: true, mode: 'speaking' });
}

function attachShadowingControl(api) {
  const button = api?.overlayEl?.()?.querySelector?.('#te-speaking-mode-btn') || null;
  if (button === shadowingControl) return;
  if (shadowingControl) shadowingControl.removeEventListener('click', onShadowingControlClick);
  shadowingControl = button;
  if (shadowingControl) shadowingControl.addEventListener('click', onShadowingControlClick);
}

document.addEventListener('lhn-overlay-ready', (event) => {
  attachShadowingControl(event.detail || globalThis.LHN_OVERLAY_API);
});
