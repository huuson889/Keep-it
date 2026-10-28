// Dictation styles are injected into the existing YouTube overlay's shadow tree.
globalThis.LHN_DICTATION_CSS = `
#keepit-exact-overlay.te-dictation-active {
  display: grid !important;
  grid-template-columns: minmax(0, 32fr) minmax(0, 45fr) minmax(0, 23fr);
  grid-template-rows: minmax(0, 1fr) 70px;
  overflow: hidden;
}
#keepit-exact-overlay.te-dictation-active > .te-ambient-layer {
  grid-area: 1 / 1 / 3 / 4;
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}
#keepit-exact-overlay.te-dictation-active > .te-left-section {
  grid-area: 1 / 1 / 2 / 2;
  display: flex;
  flex-direction: column;
  flex: none;
  width: auto;
  height: auto;
  min-width: 0;
  min-height: 0;
  padding: 0;
  overflow: hidden;
  position: relative;
  z-index: 1;
}
#keepit-exact-overlay.te-dictation-active .te-video-slot {
  flex: 0 0 auto;
  width: 100%;
  margin-inline: 0;
  height: auto;
  max-height: 42%;
  aspect-ratio: var(--te-video-aspect, 16 / 9);
  background: #000;
}
#keepit-exact-overlay.te-dictation-active .te-video-slot {
  transition: height .6s cubic-bezier(.16, 1, .3, 1), border-radius .5s ease, box-shadow .5s ease;
}
#keepit-exact-overlay.te-dictation-active .te-video-slot video {
  display: block;
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  transition: opacity .4s cubic-bezier(.16, 1, .3, 1);
}
#keepit-exact-overlay.te-dictation-active.te-dict-video-compact .te-video-slot {
  aspect-ratio: auto !important;
  max-height: none !important;
  overflow: visible;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}
#keepit-exact-overlay.te-dictation-active.te-dict-video-compact .te-video-slot video {
  opacity: 0 !important;
  pointer-events: none !important;
}
#keepit-exact-overlay .te-dict-mini-audio {
  position: absolute;
  inset: 0 12px;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 14px;
  width: auto;
  height: 100%;
  padding: 0 20px;
  overflow: hidden;
  border: 1px solid rgba(168, 85, 247, .35);
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(21, 28, 44, .97), rgba(15, 23, 42, .99));
  color: #f8fafc;
  box-shadow: 0 16px 36px rgba(124, 58, 237, .25);
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transform: scale(.98);
  transition: opacity .4s ease, transform .6s cubic-bezier(.16, 1, .3, 1), visibility 0s linear .4s;
}
#keepit-exact-overlay.te-dictation-active.te-dict-video-compact .te-dict-mini-audio {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transform: scale(1);
  transition: opacity .4s ease, transform .6s cubic-bezier(.16, 1, .3, 1), visibility 0s;
}
#keepit-exact-overlay .te-dict-mini-art {
  flex: 0 0 52px;
  width: 52px;
  height: 52px;
  overflow: hidden;
  border-radius: 14px;
  background: linear-gradient(135deg, #7c3aed, #312e81);
  box-shadow: 0 8px 16px rgba(0, 0, 0, .4);
}
#keepit-exact-overlay .te-dict-mini-thumb { display: block; width: 100%; height: 100%; object-fit: cover; }
#keepit-exact-overlay .te-dict-mini-info { display: flex; flex: 1 1 auto; min-width: 0; flex-direction: column; gap: 3px; }
#keepit-exact-overlay .te-dict-mini-title { overflow: hidden; color: #f8fafc; font-size: 14px; font-weight: 650; text-overflow: ellipsis; white-space: nowrap; }
#keepit-exact-overlay .te-dict-mini-source { color: #c4b5fd; font-size: 12px; font-weight: 500; }
#keepit-exact-overlay .te-dict-spectrum { display: flex; flex: 0 0 auto; align-items: center; gap: 3px; height: 28px; padding: 0 6px; }
#keepit-exact-overlay .te-dict-spectrum span { width: 3px; height: 6px; border-radius: 99px; background: linear-gradient(135deg, #a855f7, #6366f1); box-shadow: 0 0 10px rgba(168, 85, 247, .5); }
#keepit-exact-overlay .te-dict-mini-audio.playing .te-dict-spectrum span { animation: teDictSpectrumWave 1.1s cubic-bezier(.45, .05, .55, .95) infinite alternate; }
#keepit-exact-overlay .te-dict-mini-audio.playing .te-dict-spectrum span:nth-child(1) { animation-delay: .1s; animation-duration: .9s; }
#keepit-exact-overlay .te-dict-mini-audio.playing .te-dict-spectrum span:nth-child(2) { animation-delay: .3s; animation-duration: 1.2s; }
#keepit-exact-overlay .te-dict-mini-audio.playing .te-dict-spectrum span:nth-child(3) { animation-delay: .5s; animation-duration: .8s; }
#keepit-exact-overlay .te-dict-mini-audio.playing .te-dict-spectrum span:nth-child(4) { animation-delay: .2s; animation-duration: 1.1s; }
#keepit-exact-overlay .te-dict-mini-audio.playing .te-dict-spectrum span:nth-child(5) { animation-delay: .4s; animation-duration: 1s; }
@keyframes teDictSpectrumWave { from { height: 6px; } to { height: 26px; } }
#keepit-exact-overlay .te-dict-mini-play {
  display: inline-flex;
  flex: 0 0 44px;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: 0;
  border-radius: 50%;
  background: linear-gradient(135deg, #a855f7, #6366f1);
  color: #fff;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(124, 58, 237, .5);
  transition: transform .3s cubic-bezier(.16, 1, .3, 1), box-shadow .3s ease;
}
#keepit-exact-overlay .te-dict-mini-play:hover { transform: scale(1.08); box-shadow: 0 8px 24px rgba(168, 85, 247, .7); }
#keepit-exact-overlay .te-dict-mini-play svg { width: 20px; height: 20px; fill: currentColor; stroke: none; }
@media (prefers-reduced-motion: reduce) {
  #keepit-exact-overlay.te-dictation-active .te-video-slot,
  #keepit-exact-overlay .te-dict-mini-audio,
  #keepit-exact-overlay .te-dict-mini-play { transition-duration: .01ms; }
  #keepit-exact-overlay .te-dict-mini-audio.playing .te-dict-spectrum span { animation: none; }
}
#keepit-exact-overlay.te-dictation-active .te-sub-container,
#keepit-exact-overlay.te-dictation-active .yt-dual-right-sidebar { display: none !important; }
#keepit-exact-overlay #te-dict-sentence-area { display: none; }
#keepit-exact-overlay.te-dictation-active #te-dict-sentence-area {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  padding: 10px 12px;
}
#keepit-exact-overlay #te-dict-sentence-head,
#keepit-exact-overlay .te-dict-panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 38px;
  padding: 8px 12px;
  border-bottom: 1px solid #e5e7eb;
}
#keepit-exact-overlay #te-dict-sentence-head { padding: 0 0 8px; border: 0; }
#keepit-exact-overlay .te-dict-heading {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font: inherit;
  font-size: 12px;
  font-weight: 650;
  letter-spacing: .06em;
  text-transform: uppercase;
}
#keepit-exact-overlay .te-dict-heading svg { flex: none; color: #f59e0b; }
#keepit-exact-overlay .te-dict-counter,
#keepit-exact-overlay .te-dict-score {
  flex: 0 0 auto;
  padding: 3px 8px;
  border: 1px solid rgba(245, 158, 11, .38);
  border-radius: 999px;
  color: #d97706;
  background: rgba(245, 158, 11, .08);
  font-size: 12px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
#keepit-exact-overlay.theme-dark #te-dict-sentence-head,
#keepit-exact-overlay.theme-dark .te-dict-panel-head { border-color: #27272a; }
#keepit-exact-overlay.theme-dark .te-dict-counter,
#keepit-exact-overlay.theme-dark .te-dict-score { color: #fbbf24; }
#keepit-exact-overlay.theme-light .te-dict-counter,
#keepit-exact-overlay.theme-light .te-dict-score { color: #b45309; }
#keepit-exact-overlay #te-dict-sentences {
  flex: 1;
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
  padding: 2px 3px 4px 0;
}
#keepit-exact-overlay #te-dict-sentences,
#keepit-exact-overlay .te-dict-center-body,
#keepit-exact-overlay .te-dict-input,
#keepit-exact-overlay .te-dict-note-body,
#keepit-exact-overlay .te-dict-note-input {
  scrollbar-width: auto;
  scrollbar-color: auto;
}
#keepit-exact-overlay #te-dict-sentences::-webkit-scrollbar,
#keepit-exact-overlay .te-dict-center-body::-webkit-scrollbar,
#keepit-exact-overlay .te-dict-input::-webkit-scrollbar,
#keepit-exact-overlay .te-dict-note-body::-webkit-scrollbar,
#keepit-exact-overlay .te-dict-note-input::-webkit-scrollbar {
  width: var(--lhn-scrollbar-width);
  height: var(--lhn-scrollbar-width);
}
#keepit-exact-overlay #te-dict-sentences::-webkit-scrollbar:vertical,
#keepit-exact-overlay .te-dict-center-body::-webkit-scrollbar:vertical,
#keepit-exact-overlay .te-dict-input::-webkit-scrollbar:vertical,
#keepit-exact-overlay .te-dict-note-body::-webkit-scrollbar:vertical,
#keepit-exact-overlay .te-dict-note-input::-webkit-scrollbar:vertical { width: var(--lhn-scrollbar-width); }
#keepit-exact-overlay #te-dict-sentences::-webkit-scrollbar:horizontal,
#keepit-exact-overlay .te-dict-center-body::-webkit-scrollbar:horizontal,
#keepit-exact-overlay .te-dict-input::-webkit-scrollbar:horizontal,
#keepit-exact-overlay .te-dict-note-body::-webkit-scrollbar:horizontal,
#keepit-exact-overlay .te-dict-note-input::-webkit-scrollbar:horizontal { height: var(--lhn-scrollbar-width); }
#keepit-exact-overlay #te-dict-sentences::-webkit-scrollbar-track,
#keepit-exact-overlay .te-dict-center-body::-webkit-scrollbar-track,
#keepit-exact-overlay .te-dict-input::-webkit-scrollbar-track,
#keepit-exact-overlay .te-dict-note-body::-webkit-scrollbar-track,
#keepit-exact-overlay .te-dict-note-input::-webkit-scrollbar-track { background: transparent; }
#keepit-exact-overlay #te-dict-sentences::-webkit-scrollbar-thumb,
#keepit-exact-overlay .te-dict-center-body::-webkit-scrollbar-thumb,
#keepit-exact-overlay .te-dict-input::-webkit-scrollbar-thumb,
#keepit-exact-overlay .te-dict-note-body::-webkit-scrollbar-thumb,
#keepit-exact-overlay .te-dict-note-input::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: #cbd5e1;
}
#keepit-exact-overlay.theme-dark #te-dict-sentences::-webkit-scrollbar-thumb,
#keepit-exact-overlay.theme-dark .te-dict-center-body::-webkit-scrollbar-thumb,
#keepit-exact-overlay.theme-dark .te-dict-input::-webkit-scrollbar-thumb,
#keepit-exact-overlay.theme-dark .te-dict-note-body::-webkit-scrollbar-thumb,
#keepit-exact-overlay.theme-dark .te-dict-note-input::-webkit-scrollbar-thumb { background: #a1a1aa; }
@supports (-moz-appearance: none) {
  #keepit-exact-overlay #te-dict-sentences,
  #keepit-exact-overlay .te-dict-center-body,
  #keepit-exact-overlay .te-dict-input,
  #keepit-exact-overlay .te-dict-note-body,
  #keepit-exact-overlay .te-dict-note-input { scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent; }
  #keepit-exact-overlay.theme-dark #te-dict-sentences,
  #keepit-exact-overlay.theme-dark .te-dict-center-body,
  #keepit-exact-overlay.theme-dark .te-dict-input,
  #keepit-exact-overlay.theme-dark .te-dict-note-body,
  #keepit-exact-overlay.theme-dark .te-dict-note-input { scrollbar-color: #a1a1aa transparent; }
}
#keepit-exact-overlay .te-dict-row {
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr) 14px;
  align-items: start;
  column-gap: 8px;
  width: 100%;
  margin: 0 0 6px;
  padding: 8px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: transparent;
  color: #4b5563;
  font: inherit;
  text-align: left;
  cursor: default;
}
#keepit-exact-overlay .te-dict-row:not(:disabled) { cursor: pointer; }
#keepit-exact-overlay .te-dict-row:disabled { opacity: 1; }
#keepit-exact-overlay .te-dict-row:not(:disabled):hover { background: rgba(148, 163, 184, .12); }
#keepit-exact-overlay .te-dict-row.solved { background: rgba(148, 163, 184, .10); }
#keepit-exact-overlay .te-dict-row.current,
#keepit-exact-overlay .te-dict-row.current.solved { border-color: rgba(245, 158, 11, .6); background: rgba(245, 158, 11, .08); color: #b45309; }
#keepit-exact-overlay .te-dict-num { display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; border-radius: 5px; background: #e5e7eb; color: #4b5563; font-size: 10px; font-weight: 700; font-variant-numeric: tabular-nums; }
#keepit-exact-overlay .te-dict-row.current .te-dict-num { background: #f59e0b; color: #000; }
#keepit-exact-overlay .te-dict-text { color: inherit; font-size: 15px;font-weight: 500; line-height: 1.5; overflow-wrap: anywhere; }
#keepit-exact-overlay .te-dict-row.current .te-dict-text { font-weight: 700; }
#keepit-exact-overlay .te-dict-row:not(.solved) .te-dict-text { filter: blur(5px); user-select: none; }
#keepit-exact-overlay .te-dict-row.solved .te-dict-text { filter: none; user-select: text; }
#keepit-exact-overlay .te-dict-icon { display: inline-flex; margin-top: 4px; color: #9ca3af; }
#keepit-exact-overlay .te-dict-icon svg { width: 12px; height: 12px; }
#keepit-exact-overlay .te-dict-icon .vol { display: none; }
#keepit-exact-overlay .te-dict-row.current .te-dict-icon { color: #f59e0b; }
#keepit-exact-overlay .te-dict-row.current .te-dict-icon .play { display: none; }
#keepit-exact-overlay .te-dict-row.current .te-dict-icon .vol { display: inline; }
#keepit-exact-overlay .te-dict-vi { grid-column: 2 / 4; margin-top: 4px; color: #6b7280; font-size: 13px; line-height: 1.45; }
#keepit-exact-overlay .te-dict-row.locked .te-dict-vi { display: none !important; }
#keepit-exact-overlay.theme-dark .te-dict-row { border-color: #27272a; color: #a1a1aa; }
#keepit-exact-overlay.theme-dark .te-dict-row.solved { background: rgba(255, 255, 255, .055); }
#keepit-exact-overlay.theme-dark .te-dict-row:not(:disabled):hover { background: rgba(255, 255, 255, .08); }
#keepit-exact-overlay.theme-dark .te-dict-row.current,
#keepit-exact-overlay.theme-dark .te-dict-row.current.solved { background: rgba(245, 158, 11, .1); color: #fcd34d; }
#keepit-exact-overlay.theme-dark .te-dict-num { background: #262626; color: #a1a1aa; }
#keepit-exact-overlay.theme-dark .te-dict-row.current .te-dict-num { background: #f59e0b; color: #000; }
#keepit-exact-overlay.theme-dark .te-dict-vi { color: #a1a1aa; }

#keepit-exact-overlay #te-dictation-center,
#keepit-exact-overlay #te-dictation-notes {
  position: relative;
  z-index: 1;
  display: none;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
  background: #fff;
  color: #111827;
}
#keepit-exact-overlay.te-dictation-active #te-dictation-center,
#keepit-exact-overlay.te-dictation-active #te-dictation-notes { display: flex; }
#keepit-exact-overlay #te-dictation-center { grid-area: 1 / 2 / 2 / 3; border-right: 1px solid #e5e7eb; }
#keepit-exact-overlay #te-dictation-notes { grid-area: 1 / 3 / 2 / 4; }
#keepit-exact-overlay.theme-dark #te-dictation-center,
#keepit-exact-overlay.theme-dark #te-dictation-notes { background: #121212; color: #f3f4f6; }
#keepit-exact-overlay.te-dictation-active.te-ambient-on #te-dictation-center,
#keepit-exact-overlay.te-dictation-active.te-ambient-on #te-dictation-notes { background-color: transparent; }
#keepit-exact-overlay.theme-dark #te-dictation-center { border-color: #27272a; }
#keepit-exact-overlay.theme-light .te-dict-panel-head { background: #f9fafb; }
#keepit-exact-overlay.theme-dark .te-dict-panel-head { background: #16161c; }
#keepit-exact-overlay .te-dict-panel-head { flex: 0 0 auto; }
#keepit-exact-overlay .te-dict-close {
  width: 30px;
  height: 30px;
  margin: 0;
  border-radius: 6px;
  color: #6b7280;
  font: inherit;
  font-size: 22px;
  line-height: 1;
}
#keepit-exact-overlay .te-dict-close:hover { color: #111827; background: rgba(148, 163, 184, .14); }
#keepit-exact-overlay.theme-dark .te-dict-close { color: #a1a1aa; }
#keepit-exact-overlay.theme-dark .te-dict-close:hover { color: #fff; background: rgba(255,255,255,.08); }
#keepit-exact-overlay .te-dict-center-body {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
  gap: 12px;
  overflow: auto;
  padding: 14px clamp(12px, 2vw, 28px);
}
#keepit-exact-overlay .te-dict-acc { display: inline-flex; align-items: center; gap: 6px; color: #6b7280; font-size: 12px; }
#keepit-exact-overlay .te-dict-acc-label::after { content: ":"; }
#keepit-exact-overlay.theme-dark .te-dict-acc { color: #a1a1aa; }
#keepit-exact-overlay .te-dict-audio-card { display: flex; flex: none; align-items: center; justify-content: space-between; gap: 12px; padding: 12px; border: 1px solid #e5e7eb; border-radius: 12px; background: #f9fafb; }
#keepit-exact-overlay.theme-dark .te-dict-audio-card { border-color: #27272a; background: rgba(255, 255, 255, .03); }
#keepit-exact-overlay .te-dict-audio-btn { display: inline-flex; flex: none; align-items: center; justify-content: center; width: 42px; height: 42px; border: 0; border-radius: 10px; background: #f59e0b; color: #000; cursor: pointer; box-shadow: 0 4px 12px rgba(245, 158, 11, .3); }
#keepit-exact-overlay .te-dict-audio-btn:hover { background: #fbbf24; }
#keepit-exact-overlay .te-dict-audio-btn svg { width: 20px; height: 20px; }
#keepit-exact-overlay .te-dict-audio-text { display: flex; flex: 1; min-width: 0; flex-direction: column; gap: 2px; }
#keepit-exact-overlay .te-dict-audio-title { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 650; }
#keepit-exact-overlay .te-dict-chip { padding: 1px 6px; border-radius: 4px; background: #e5e7eb; color: #4b5563; font-size: 10px; font-weight: 600; }
#keepit-exact-overlay.theme-dark .te-dict-chip { background: #262626; color: #d4d4d8; }
#keepit-exact-overlay .te-dict-audio-text p { margin: 0; color: #6b7280; font-size: 11px; }
#keepit-exact-overlay.theme-dark .te-dict-audio-text p { color: #a1a1aa; }
#keepit-exact-overlay .te-dict-video-toggle {
  display: inline-flex;
  flex: 0 0 36px;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid #d1d5db;
  border-radius: 9px;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  transition: background .2s ease, color .2s ease, border-color .2s ease, transform .2s ease;
}
#keepit-exact-overlay .te-dict-video-toggle:hover { border-color: #8b5cf6; background: rgba(139, 92, 246, .1); color: #7c3aed; }
#keepit-exact-overlay .te-dict-video-toggle:active { transform: scale(.94); }
#keepit-exact-overlay .te-dict-video-toggle svg { width: 18px; height: 18px; }
#keepit-exact-overlay.theme-dark .te-dict-video-toggle { border-color: #3f3f46; color: #d4d4d8; }
#keepit-exact-overlay.theme-dark .te-dict-video-toggle:hover { border-color: #a78bfa; color: #c4b5fd; }
#keepit-exact-overlay .te-dict-auto { display: inline-flex; flex: none; align-items: center; gap: 6px; color: #6b7280; font-size: 12px; cursor: pointer; }
#keepit-exact-overlay .te-dict-auto input { accent-color: #f59e0b; }
#keepit-exact-overlay.theme-dark .te-dict-auto { color: #a1a1aa; }
#keepit-exact-overlay .te-dict-work { display: flex; flex: 1; min-height: 0; flex-direction: column; justify-content: center; gap: 12px; }
#keepit-exact-overlay .te-dict-answer-stack { position: relative; display: flex; flex-direction: column; gap: 12px; }
#keepit-exact-overlay .te-dict-work.te-dict-has-error .te-dict-answer-stack > .te-dict-error { position: absolute; top: calc(100% + 12px); left: 0; right: 0; z-index: 1; }
#keepit-exact-overlay .te-dict-input-wrap { position: relative; width: 100%; min-height: 110px; }
#keepit-exact-overlay .te-dict-input { position: relative; z-index: 1;
  display: block;
  width: 100%;
  min-height: 110px;
  resize: none;
  overflow-y: auto;
  padding: 16px;
  border: 1.5px solid rgba(245, 158, 11, .4);
  border-radius: 12px;
  outline: none;
  background: #fff;
  color: #111827;
  caret-color: #f59e0b;
  font: inherit;
  font-size: clamp(18px, 1.6vw, 24px);
  font-weight: 700;
  letter-spacing: .01em;
  line-height: 1.6;
  transition: border-color .2s ease, box-shadow .2s ease, background-color .2s ease;
}
#keepit-exact-overlay .te-dict-input:focus { border-color: #f59e0b; box-shadow: 0 0 18px rgba(245, 158, 11, .3); }
#keepit-exact-overlay .te-dict-input.correct { border-color: #10b981; background: rgba(16, 185, 129, .12); color: #10b981; box-shadow: 0 0 18px rgba(16, 185, 129, .25); }
#keepit-exact-overlay .te-dict-input-markup { position: absolute; z-index: 2; inset: 0; overflow: hidden; border-radius: 12px; pointer-events: none; }
#keepit-exact-overlay .te-dict-input-markup[hidden] { display: none !important; }
#keepit-exact-overlay .te-dict-input-markup-content { position: absolute; inset: 0; box-sizing: border-box; padding: 16px; border: 1.5px solid transparent; border-radius: 12px; color: transparent; font: inherit; font-size: clamp(18px, 1.6vw, 24px); font-weight: 700; letter-spacing: .01em; line-height: 1.6; white-space: pre-wrap; overflow-wrap: break-word; word-break: normal; user-select: none; }
#keepit-exact-overlay .te-dict-input-wrong-word { text-decoration-line: underline; text-decoration-color: #dc2626; text-decoration-thickness: 3px; text-underline-offset: 4px; text-decoration-skip-ink: none; }
#keepit-exact-overlay.theme-dark .te-dict-input-wrong-word { text-decoration-color: #f87171; }
#keepit-exact-overlay .te-dict-note-input:focus { border-color: #f59e0b; box-shadow: 0 0 0 2px rgba(245, 158, 11, .16); }
#keepit-exact-overlay.theme-dark .te-dict-input { background: #18181b; color: #f3f4f6; }
#keepit-exact-overlay.theme-dark .te-dict-input.correct { background: rgba(16, 185, 129, .12); color: #10b981; }
#keepit-exact-overlay .te-dict-hint { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); align-items: center; gap: 2px; padding: 0; color: #6b7280; font-size: 12px; line-height: 1.5; }
#keepit-exact-overlay .te-dict-hint > span { min-width: 0; text-align: center; white-space: nowrap; }
#keepit-exact-overlay .te-dict-hint > span:first-child { text-align: left; }
#keepit-exact-overlay .te-dict-hint > span:last-child { text-align: right; }
#keepit-exact-overlay.theme-dark .te-dict-hint { color: #a1a1aa; }
#keepit-exact-overlay .te-dict-error { display: flex; flex-direction: column; gap: 8px; padding: 12px; border: 1px solid rgba(239, 68, 68, .3); border-radius: 12px; background: rgba(239, 68, 68, .08); }
#keepit-exact-overlay .te-dict-error[hidden], #keepit-exact-overlay .te-dict-success[hidden] { display: none !important; }
#keepit-exact-overlay .te-dict-error-title { display: flex; align-items: center; gap: 8px; color: #dc2626; font-size: 12px; font-weight: 700; }
#keepit-exact-overlay.theme-dark .te-dict-error-title { color: #f87171; }
#keepit-exact-overlay .te-dict-error.te-dict-error-success { border-color: rgba(16, 185, 129, .3); background: rgba(16, 185, 129, .1); }
#keepit-exact-overlay .te-dict-error.te-dict-error-success .te-dict-error-title { color: #059669; }
#keepit-exact-overlay.theme-dark .te-dict-error.te-dict-error-success .te-dict-error-title { color: #34d399; }
#keepit-exact-overlay .te-dict-error-words { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; font-size: 14px; font-weight: 700; }
#keepit-exact-overlay .te-dict-error-words,
#keepit-exact-overlay .te-dict-error-words * { font-size: 14px !important; }
#keepit-exact-overlay .te-dict-wg { display: inline-flex; flex: 0 0 auto; align-items: center; gap: 4px; padding: 4px; border: 1px solid #d1d5db; border-radius: 6px; background: #f3f4f6; }
#keepit-exact-overlay.theme-dark .te-dict-wg { border-color: #27272a; background: #18181b; }
#keepit-exact-overlay .te-dict-w { padding: 2px 6px; border-radius: 4px; font-size: 12px; font-weight: 700; }
#keepit-exact-overlay .te-dict-w.ok { background: rgba(16, 185, 129, .2); color: #059669; }
#keepit-exact-overlay .te-dict-w.bad { background: rgba(239, 68, 68, .2); color: #dc2626; text-decoration: line-through; }
#keepit-exact-overlay .te-dict-w.fix { background: rgba(245, 158, 11, .2); color: #b45309; font-size: 11px; }
#keepit-exact-overlay .te-dict-missing-hints { flex: 0 0 auto; color: #b45309; white-space: nowrap; letter-spacing: .08em; }
#keepit-exact-overlay.theme-dark .te-dict-missing-hints { color: #fcd34d; }
#keepit-exact-overlay.theme-dark .te-dict-w.ok { color: #34d399; }
#keepit-exact-overlay.theme-dark .te-dict-w.bad { color: #f87171; }
#keepit-exact-overlay.theme-dark .te-dict-w.fix { color: #fcd34d; }
#keepit-exact-overlay .te-dict-empty { color: #6b7280; font-size: 12px; font-style: italic; font-weight: 400; }
#keepit-exact-overlay .te-dict-success { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px; border: 1px solid rgba(16, 185, 129, .3); border-radius: 12px; background: rgba(16, 185, 129, .1); color: #059669; font-size: 12px; font-weight: 800; }
#keepit-exact-overlay.theme-dark .te-dict-success { color: #34d399; }
#keepit-exact-overlay .te-dict-translation { padding: 12px; border: 1px solid rgba(245, 158, 11, .3); border-radius: 12px; background: rgba(245, 158, 11, .06); color: #92400e; font-size: clamp(14px, 1.1vw, 16px); font-weight: 700; line-height: 1.55; text-align: center; }
#keepit-exact-overlay.theme-dark .te-dict-translation { color: #fcd34d; }
#keepit-exact-overlay .te-dict-translation[hidden] { display: none !important; }
#keepit-exact-overlay .te-dict-footer { display: flex; flex: none; flex-direction: column; gap: 10px; padding: 10px clamp(12px, 2vw, 28px) 14px; border-top: 1px solid #e5e7eb; }
#keepit-exact-overlay.theme-dark .te-dict-footer { border-color: #27272a; }
#keepit-exact-overlay .te-dict-repeat { display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 12px; margin-bottom: 20px;}
#keepit-exact-overlay .te-dict-repeat-label { color: #6b7280; font-weight: 700; }
#keepit-exact-overlay .te-dict-repeat-btn { padding: 2px 8px; border: 1px solid transparent; border-radius: 4px; background: transparent; color: #6b7280; font: inherit; font-size: 12px; cursor: pointer; }
#keepit-exact-overlay .te-dict-repeat-btn:hover { color: #f59e0b; }
#keepit-exact-overlay .te-dict-repeat-btn.active { border-color: rgba(245, 158, 11, .4); background: rgba(245, 158, 11, .2); color: #d97706; font-weight: 700; }
#keepit-exact-overlay .te-dict-actions { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 8px; }
#keepit-exact-overlay .te-dict-act { display: inline-flex; align-items: center; justify-content: center; gap: 5px; min-width: 0; padding: 10px 6px; border: 1px solid #d1d5db; border-radius: 8px; background: #f3f4f6; color: #1f2937; font: inherit; font-size: 12px; font-weight: 500; white-space: nowrap; cursor: pointer; transition: background-color .15s ease, opacity .15s ease; }
#keepit-exact-overlay .te-dict-act:hover:not(:disabled) { background: #e5e7eb; }
#keepit-exact-overlay .te-dict-act svg { flex: none; width: 14px; height: 14px; }
#keepit-exact-overlay .te-dict-act:disabled { opacity: .42; cursor: not-allowed; }
#keepit-exact-overlay.theme-dark .te-dict-act { border-color: #404040; background: #262626; color: #e2e8f0; }
#keepit-exact-overlay.theme-dark .te-dict-act:hover:not(:disabled) { background: #333; }
#keepit-exact-overlay .te-dict-act-primary,
#keepit-exact-overlay.theme-dark .te-dict-act-primary { border-color: #f59e0b; background: #f59e0b; color: #000; font-weight: 700; box-shadow: 0 4px 10px rgba(245, 158, 11, .2); }
#keepit-exact-overlay .te-dict-act-primary:hover:not(:disabled),
#keepit-exact-overlay.theme-dark .te-dict-act-primary:hover:not(:disabled) { background: #fbbf24; }
#keepit-exact-overlay .te-dict-note-body { position: relative; display: flex; flex: 1; min-height: 0; flex-direction: column; gap: 12px; overflow: auto; padding: 14px; }
#keepit-exact-overlay .te-dict-note-label { display: block; margin-bottom: 5px; color: #6b7280; font-size: 11px; font-weight: 700; }
#keepit-exact-overlay .te-dict-note-text-wrap { display: flex; flex: 1; min-height: 0; flex-direction: column; }
#keepit-exact-overlay.theme-dark .te-dict-note-label { color: #a1a1aa; }
#keepit-exact-overlay .te-dict-note-input {
  width: 100%;
  min-height: 34px;
  padding: 8px 9px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  outline: none;
  background: #fff;
  color: #111827;
  font: inherit;
  font-size: 12px;
}
#keepit-exact-overlay textarea.te-dict-note-input { flex: 1; min-height: 90px; resize: none; line-height: 1.5; }
#keepit-exact-overlay.theme-dark .te-dict-note-input { background: #121212; border-color: #3f3f46; color: #f3f4f6; }
#keepit-exact-overlay .te-dict-lock {
  position: absolute;
  z-index: 2;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 9px;
  padding: 20px;
  background: rgba(255,255,255,.32);
  color: #374151;
  text-align: center;
  backdrop-filter: blur(4px);
}
#keepit-exact-overlay.theme-dark .te-dict-lock { background: rgb(18 18 18 / 32%); color: #e5e7eb; }
#keepit-exact-overlay .te-dict-lock[hidden] { display: none !important; }
#keepit-exact-overlay .te-dict-save { border: 0; background: transparent; color: #b45309; font: inherit; font-size: 11px; font-weight: 700; cursor: pointer; }
#keepit-exact-overlay.theme-dark .te-dict-save { color: #fbbf24; }
#keepit-exact-overlay .te-dict-saved { flex: none; min-height: 16px; color: #15803d; font-size: 11px; }
#keepit-exact-overlay.theme-dark .te-dict-saved { color: #4ade80; }
#keepit-exact-overlay .te-dict-head-actions { display: flex; align-items: center; gap: 6px; }
#keepit-exact-overlay .te-dict-save { padding: 4px 10px; border: 1px solid #d1d5db; border-radius: 6px; background: #f3f4f6; }
#keepit-exact-overlay.theme-dark .te-dict-save { border-color: #404040; background: #262626; }
#keepit-exact-overlay .te-dict-note-footer { display: flex; flex: none; align-items: center; justify-content: space-between; gap: 8px; padding: 8px 12px; border-top: 1px solid #e5e7eb; }
#keepit-exact-overlay.theme-dark .te-dict-note-footer { border-color: #27272a; }
#keepit-exact-overlay .te-dict-autosave { color: #6b7280; font-size: 10px; text-align: right; }
#keepit-exact-overlay.theme-dark .te-dict-autosave { color: #a1a1aa; }

#keepit-exact-overlay.te-dictation-active .te-control-bar {
  grid-area: 2 / 1 / 3 / 4;
  position: relative !important;
  left: auto !important;
  bottom: auto !important;
  width: 100% !important;
  height: 70px !important;
  min-width: 0;
  z-index: 5;
}
#keepit-exact-overlay.te-dictation-active .te-dict-primary-group .te-yt-logo-box,
#keepit-exact-overlay.te-dictation-active .te-dict-primary-group button[title="Thêm vào từ vựng"],
#keepit-exact-overlay.te-dictation-active .te-dict-primary-group button[title="Mở bộ sưu tập"] { display: none !important; }
#keepit-exact-overlay .te-dict-toolbar-tools { display: none; align-items: center; gap: 8px; }
#keepit-exact-overlay.te-dictation-active .te-dict-toolbar-tools { display: flex; }
#keepit-exact-overlay .te-dict-type-control {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border: 1px solid rgba(245,158,11,.45);
  border-radius: 7px;
  background: rgba(245,158,11,.1);
  color: #b45309;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}
#keepit-exact-overlay.theme-dark .te-dict-type-control { color: #fbbf24; }
#keepit-exact-overlay .te-dict-toolbar-accuracy { display: inline-flex; align-items: center; gap: 8px; color: #6b7280; font-size: 11px; white-space: nowrap; }
#keepit-exact-overlay .te-dict-acc-col { display: flex; flex-direction: column; line-height: 1.2; }
#keepit-exact-overlay .te-dict-acc-col strong { color: #b45309; font-size: 13px; font-variant-numeric: tabular-nums; }
#keepit-exact-overlay .te-dict-ring { flex: none; }
#keepit-exact-overlay .te-dict-ring-bg { fill: none; stroke: #e5e7eb; stroke-width: 3; }
#keepit-exact-overlay .te-dict-ring-fg { fill: none; stroke: #f59e0b; stroke-width: 3; stroke-linecap: round; stroke-dasharray: 56.55; stroke-dashoffset: 56.55; transition: stroke-dashoffset .4s ease; }
#keepit-exact-overlay.theme-dark .te-dict-toolbar-accuracy { color: #a1a1aa; }
#keepit-exact-overlay.theme-dark .te-dict-acc-col strong { color: #fbbf24; }
#keepit-exact-overlay.theme-dark .te-dict-ring-bg { stroke: #3f3f46; }
#keepit-exact-overlay.te-dictation-active .te-control-bar .te-dict-primary-group { justify-content: flex-start; }
#keepit-exact-overlay.te-dictation-active .te-control-bar button:disabled { opacity: .42; cursor: not-allowed; }
#keepit-exact-overlay .te-dict-toast {
  position: absolute;
  z-index: 60;
  top: 18px;
  left: 50%;
  max-width: min(90vw, 520px);
  padding: 10px 14px;
  transform: translate(-50%, -8px);
  border: 1px solid rgba(245,158,11,.55);
  border-radius: 8px;
  background: #18181b;
  color: #f4f4f5;
  box-shadow: 0 8px 24px rgba(0,0,0,.24);
  opacity: 0;
  pointer-events: none;
  font: inherit;
  font-size: 13px;
  text-align: center;
  transition: opacity .16s ease, transform .16s ease;
}
#keepit-exact-overlay .te-dict-toast.visible { opacity: 1; transform: translate(-50%, 0); }
#keepit-exact-overlay.theme-light .te-dict-toast { background: #fff; color: #111827; }
#keepit-exact-overlay .te-dict-confetti-layer { position: absolute; inset: 0; z-index: 70; overflow: hidden; pointer-events: none; contain: layout paint; }
#keepit-exact-overlay .te-dict-confetti { position: absolute; z-index: 70; top: 60%; left: 50%; width: 7px; height: 11px; border-radius: 2px; pointer-events: none; animation: te-dict-confetti-fall 1300ms cubic-bezier(.2, .7, .4, 1) forwards; }
@keyframes te-dict-confetti-fall { 0% { transform: translate(0, 0) rotate(0); opacity: 1; } 40% { transform: translate(var(--ux), var(--uy)) rotate(calc(var(--rot) * .5)); opacity: 1; } 100% { transform: translate(var(--dx), var(--dy)) rotate(var(--rot)); opacity: 0; } }
@media (prefers-reduced-motion: reduce) {
  #keepit-exact-overlay .te-dict-toast { transition: none; }
  #keepit-exact-overlay .te-dict-confetti { animation-duration: 1ms; }
}
#keepit-exact-overlay .te-dict-row.locked .te-dict-text { filter: blur(5px); user-select: none; }
#keepit-exact-overlay .te-dict-row.locked { pointer-events: none; }
#keepit-exact-overlay .te-dict-row.past .te-dict-text { filter: none !important; user-select: text; }
#keepit-exact-overlay .te-dict-act.te-dict-ready { background: #f59e0b !important; border-color: #f59e0b !important; color: #000 !important; font-weight: 700; }
#keepit-exact-overlay .te-dict-act-primary.te-dict-done { background: #6b7280 !important; border-color: #6b7280 !important; color: #fff !important; box-shadow: none !important; }
#keepit-exact-overlay #te-dictation-notes.te-dict-notes-locked .te-dict-note-body > div:not(.te-dict-lock) { filter: blur(5px); user-select: none; pointer-events: none; }
`;
