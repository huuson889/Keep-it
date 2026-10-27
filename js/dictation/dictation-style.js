// CSS của dictation, nhúng vào shadow root của overlay (theme tối mặc định, theme sáng qua #keepit-exact-overlay.theme-light)
globalThis.LHN_DICTATION_CSS = `
#te-dictation { position: absolute; left: 0; right: 0; top: 0; bottom: 84px; display: flex; flex-direction: column; background: transparent; color: #e5e7eb; font-family: inherit; z-index: 40; pointer-events: auto; }
#te-dictation.hidden { display: none !important; }
#te-dictation.in-sidebar { position: absolute; top: 56px; left: 0; right: 0; bottom: 0; z-index: 30; background: #0b0b0b; padding: 0; }
#te-dictation.in-sidebar .te-dict-stage { display: none; }
#te-dictation.in-sidebar .te-dict-body { padding: 8px 12px 0; gap: 0; }
#te-dictation.in-sidebar .te-dict-side { border: 0; background: transparent; }
#te-dictation.in-sidebar .te-dict-top { padding: 0 0 6px; }
#te-dictation .te-dict-foot { padding: 8px 12px 12px; }
#keepit-exact-overlay.theme-light #te-dictation.in-sidebar { background: #ffffff; }
#keepit-exact-overlay .te-right-sidebar { position: relative; }
#te-dictation .te-dict-top { display: flex; justify-content: flex-end; align-items: center; gap: 12px; padding: 12px 16px 0; }
#te-dictation .te-dict-counter { font-size: 13px; font-weight: 600; color: #9ca3af; font-variant-numeric: tabular-nums; }
#te-dictation .te-dict-close { background: transparent; border: 0; color: #9ca3af; font-size: 18px; cursor: pointer; line-height: 1; }
#te-dictation .te-dict-body { display: flex; flex: 1; min-height: 0; gap: 16px; padding: 12px 16px; }
#te-dictation .te-dict-stage { flex: 1.1; min-width: 0; }
#te-dictation .te-dict-side { flex: 1; min-width: 0; display: flex; flex-direction: column; background: #121212; border: 1px solid #222; border-radius: 12px; }
#te-dictation .te-dict-list { flex: 1; overflow-y: auto; padding: 8px; }
#te-dictation .te-dict-row { padding: 10px 12px; border-radius: 8px; margin-bottom: 6px; cursor: default; }
#te-dictation .te-dict-row.solved { cursor: pointer; background: #1b1b1b; }
#te-dictation .te-dict-row.current { outline: 1px solid #f59e0b; }
#te-dictation .te-dict-text { font-size: 15px; line-height: 1.5; color: #e5e7eb; filter: blur(6px); user-select: none; }
#te-dictation .te-dict-row.solved .te-dict-text { filter: none; user-select: text; }
#te-dictation .te-dict-vi { font-size: 13px; color: #9ca3af; margin-top: 4px; }
#te-dictation .te-dict-num { font-size: 11px; color: #6b7280; margin-right: 8px; font-variant-numeric: tabular-nums; }
#te-dictation .te-dict-input { width: 100%; padding: 12px 14px; border-radius: 10px; border: 1px solid #333; background: #18181b; color: #f3f4f6; font-size: 15px; outline: none; font-family: inherit; }
#te-dictation .te-dict-input:focus { border-color: #f59e0b; }
#te-dictation .te-dict-feedback { font-size: 13px; min-height: 18px; margin-top: 8px; color: #9ca3af; }
#te-dictation .te-dict-feedback.good { color: #22c55e; }
#te-dictation .te-dict-feedback.bad { color: #ef4444; }
#te-dictation .te-dict-ring { width: 56px; height: 56px; }
#te-dictation .te-dict-ring text { font-size: 12px; fill: #e5e7eb; text-anchor: middle; dominant-baseline: middle; }
#keepit-exact-overlay.theme-light #te-dictation { color: #111827; }
#keepit-exact-overlay.theme-light #te-dictation .te-dict-close,
#keepit-exact-overlay.theme-light #te-dictation .te-dict-counter { color: #6b7280; }
#keepit-exact-overlay.theme-light #te-dictation .te-dict-side { background: #ffffff; border-color: #e5e7eb; }
#keepit-exact-overlay.theme-light #te-dictation .te-dict-row.solved { background: #f3f4f6; }
#keepit-exact-overlay.theme-light #te-dictation .te-dict-text { color: #111827; }
#keepit-exact-overlay.theme-light #te-dictation .te-dict-input { background: #ffffff; border-color: #d1d5db; color: #111827; }
#keepit-exact-overlay.theme-light #te-dictation .te-dict-ring text { fill: #111827; }
`;
