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
  border-right: 1px solid #e5e7eb;
}
#keepit-exact-overlay.te-dictation-active .te-video-slot {
  flex: 0 0 auto;
  width: 100%;
  height: auto;
  max-height: 42%;
  aspect-ratio: var(--te-video-aspect, 16 / 9);
  background: #000;
}
#keepit-exact-overlay.te-dictation-active .te-video-slot video {
  display: block;
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
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
  margin: 0;
  font: inherit;
  font-size: 13px;
  font-weight: 650;
  letter-spacing: .02em;
}
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
  scrollbar-width: thin;
}
#keepit-exact-overlay .te-dict-row {
  display: block;
  width: 100%;
  margin: 0 0 6px;
  padding: 9px 10px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: default;
}
#keepit-exact-overlay .te-dict-row:not(:disabled) { cursor: pointer; }
#keepit-exact-overlay .te-dict-row:disabled { opacity: 1; }
#keepit-exact-overlay .te-dict-row:not(:disabled):hover { background: rgba(148, 163, 184, .12); }
#keepit-exact-overlay .te-dict-row.current { border-color: rgba(245, 158, 11, .72); background: rgba(245, 158, 11, .08); }
#keepit-exact-overlay .te-dict-row.solved { background: rgba(148, 163, 184, .10); }
#keepit-exact-overlay .te-dict-num { display: inline-block; min-width: 24px; color: #9ca3af; font-size: 11px; font-variant-numeric: tabular-nums; }
#keepit-exact-overlay .te-dict-text { color: #374151; font-size: 13px; line-height: 1.5; }
#keepit-exact-overlay .te-dict-row:not(.solved) .te-dict-text { filter: blur(5px); user-select: none; }
#keepit-exact-overlay .te-dict-row.solved .te-dict-text { filter: none; user-select: text; }
#keepit-exact-overlay .te-dict-vi { display: block; margin: 4px 0 0 24px; color: #6b7280; font-size: 12px; line-height: 1.45; }
#keepit-exact-overlay.theme-dark .te-dict-text { color: #e5e7eb; }
#keepit-exact-overlay.theme-dark .te-dict-vi { color: #a1a1aa; }
#keepit-exact-overlay.theme-dark .te-dict-row.solved { background: rgba(255, 255, 255, .055); }
#keepit-exact-overlay.theme-dark .te-dict-row:not(:disabled):hover { background: rgba(255, 255, 255, .08); }

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
  justify-content: center;
  gap: 12px;
  overflow: auto;
  padding: clamp(12px, 2vw, 28px);
}
#keepit-exact-overlay .te-dict-input {
  display: block;
  width: 100%;
  min-height: 96px;
  resize: vertical;
  padding: 14px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  outline: none;
  background: #fff;
  color: #111827;
  caret-color: #f59e0b;
  font: inherit;
  font-size: clamp(16px, 1.45vw, 21px);
  font-weight: 650;
  line-height: 1.55;
}
#keepit-exact-overlay .te-dict-input:focus,
#keepit-exact-overlay .te-dict-note-input:focus { border-color: #f59e0b; box-shadow: 0 0 0 2px rgba(245, 158, 11, .16); }
#keepit-exact-overlay.theme-dark .te-dict-input { background: #18181b; border-color: #3f3f46; color: #f3f4f6; }
#keepit-exact-overlay .te-dict-hint { color: #6b7280; font-size: 11px; line-height: 1.5; }
#keepit-exact-overlay.theme-dark .te-dict-hint { color: #a1a1aa; }
#keepit-exact-overlay .te-dict-feedback { min-height: 22px; color: #6b7280; font-size: 13px; font-weight: 600; }
#keepit-exact-overlay .te-dict-feedback.good { color: #15803d; }
#keepit-exact-overlay .te-dict-feedback.bad { color: #dc2626; }
#keepit-exact-overlay.theme-dark .te-dict-feedback.good { color: #4ade80; }
#keepit-exact-overlay.theme-dark .te-dict-feedback.bad { color: #f87171; }
#keepit-exact-overlay .te-dict-word-feedback { display: flex; flex-wrap: wrap; gap: 5px; }
#keepit-exact-overlay .te-dict-word { padding: 3px 6px; border-radius: 5px; background: rgba(239,68,68,.12); color: #dc2626; font-size: 12px; }
#keepit-exact-overlay .te-dict-word.correct { background: rgba(34,197,94,.12); color: #15803d; }
#keepit-exact-overlay.theme-dark .te-dict-word { color: #f87171; }
#keepit-exact-overlay.theme-dark .te-dict-word.correct { color: #4ade80; }
#keepit-exact-overlay .te-dict-check {
  align-self: flex-start;
  min-height: 36px;
  padding: 8px 14px;
  border: 1px solid #d97706;
  border-radius: 7px;
  background: #f59e0b;
  color: #111827;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}
#keepit-exact-overlay .te-dict-check:hover { background: #fbbf24; }
#keepit-exact-overlay .te-dict-translation { padding: 12px; border: 1px solid rgba(245,158,11,.42); border-radius: 9px; background: rgba(245,158,11,.08); color: #92400e; font-size: 14px; line-height: 1.55; }
#keepit-exact-overlay.theme-dark .te-dict-translation { color: #fcd34d; }
#keepit-exact-overlay .te-dict-translation[hidden] { display: none !important; }
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
#keepit-exact-overlay.theme-dark .te-dict-note-input { background: #0a0a0c; border-color: #3f3f46; color: #f3f4f6; }
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
  background: rgba(255,255,255,.94);
  color: #374151;
  text-align: center;
  backdrop-filter: blur(4px);
}
#keepit-exact-overlay.theme-dark .te-dict-lock { background: rgba(10,10,12,.95); color: #e5e7eb; }
#keepit-exact-overlay .te-dict-lock[hidden] { display: none !important; }
#keepit-exact-overlay .te-dict-save { border: 0; background: transparent; color: #b45309; font: inherit; font-size: 11px; font-weight: 700; cursor: pointer; }
#keepit-exact-overlay.theme-dark .te-dict-save { color: #fbbf24; }
#keepit-exact-overlay .te-dict-saved { min-height: 16px; color: #15803d; font-size: 11px; }
#keepit-exact-overlay.theme-dark .te-dict-saved { color: #4ade80; }

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
#keepit-exact-overlay .te-dict-toolbar-accuracy { color: #6b7280; font-size: 11px; white-space: nowrap; }
#keepit-exact-overlay .te-dict-toolbar-accuracy strong { margin-left: 3px; color: #b45309; font-size: 13px; font-variant-numeric: tabular-nums; }
#keepit-exact-overlay.theme-dark .te-dict-toolbar-accuracy { color: #a1a1aa; }
#keepit-exact-overlay.theme-dark .te-dict-toolbar-accuracy strong { color: #fbbf24; }
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
#keepit-exact-overlay .te-dict-confetti { position: absolute; z-index: 4; top: 34%; left: 50%; width: 7px; height: 11px; border-radius: 2px; pointer-events: none; animation: te-dict-confetti-fall 850ms ease-out forwards; }
@keyframes te-dict-confetti-fall { to { transform: translate(var(--dx), var(--dy)) rotate(var(--rot)); opacity: 0; } }
@media (prefers-reduced-motion: reduce) {
  #keepit-exact-overlay .te-dict-toast { transition: none; }
  #keepit-exact-overlay .te-dict-confetti { animation-duration: 1ms; }
}
`;
