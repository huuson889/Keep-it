// CSS của Reader song ngữ (thanh, bảng Giọng đọc / Tốc độ / ☰, thẻ song ngữ). Chèn bởi js/reader/bilingual-reader.js.
// Màu kính sáng/tối lấy từ js/shared/theme-tokens.js (var(--kp-…)). Sửa thẳng quy tắc gốc; không nối khối vá vào cuối.
globalThis.LHN_READER_CSS = flagFontUrl => `
    @font-face{
      font-family:"Twemoji Country Flags";
      src:url("${flagFontUrl}") format("woff2");
      font-style:normal;
      font-weight:400;
      font-display:swap;
      unicode-range:U+1F1E6-1F1FF,U+1F3F4,U+E0062-E0063,U+E0065,U+E0067,U+E006C,U+E006E,U+E0073-E0074,U+E0077,U+E007F;
    }
    .lhn-bilingual-speaker{position:absolute!important;display:inline-flex!important;align-items:center;justify-content:center;width:18px!important;height:18px!important;margin:0!important;padding:0!important;box-sizing:border-box!important;z-index:2;color:#868e96;cursor:pointer;font-size:.8em;line-height:1;user-select:none;vertical-align:middle}
    .lhn-bilingual-speaker:hover{color:var(--lhn-br-accent);transform:scale(1.2)}
    .lhn-bilingual-speaker[data-visibility="hover"],.lhn-bilingual-speaker[data-visibility="reading"]{visibility:hidden;opacity:0;pointer-events:none;transition:opacity .12s ease,visibility .12s ease}
    :hover>.lhn-bilingual-speaker[data-visibility="hover"],:hover>.lhn-bilingual-speaker[data-visibility="reading"]{visibility:visible;opacity:1;pointer-events:auto}
    .lhn-bilingual-speaker[data-visibility="reading"][data-reading="true"]{visibility:visible;opacity:1;pointer-events:auto}
    .lhn-bilingual-card{display:block;margin:8px 0;padding:10px 14px;border-left:4px solid var(--lhn-br-accent);background:rgba(var(--lhn-br-accent-rgb),.04);border-radius:0 8px 8px 0;font-family:var(--lhn-br-font);font-size:max(16px,var(--translation-scale,80%))!important;line-height:1.6;color:var(--lhn-br-translation-color,#2d3748);font-weight:var(--lhn-br-translation-weight,400);box-shadow:0 1px 3px rgba(0,0,0,.02);animation:lhnBrFade .25s ease-in-out}
    .lhn-bilingual-web-font{font-family:var(--lhn-br-web-font)!important}
    .lhn-bilingual-reading{outline:2px solid var(--lhn-br-accent)!important;outline-offset:4px;background-color:rgba(var(--lhn-br-accent-rgb),.08)!important;border-radius:6px}
    #lhn-bilingual-reading-bar,#lhn-bilingual-reading-bar *{font-family:var(--lhn-app-font-family,'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif)!important}
    #lhn-bilingual-reading-bar{position:fixed;inset:0;z-index:2147483646;display:none;pointer-events:none;color:#334155;font-size:13px;line-height:normal;text-align:left;direction:ltr;letter-spacing:normal}
    #lhn-bilingual-reading-bar.lhn-show{display:block}
    #lhn-bilingual-reading-bar.lhn-show .lhn-br-rbar{animation:lhnBrBarIn .26s cubic-bezier(.2,.8,.2,1)}
    #lhn-bilingual-reading-bar.lhn-hiding{pointer-events:none}
    #lhn-bilingual-reading-bar.lhn-hiding .lhn-br-rbar,#lhn-bilingual-reading-bar.lhn-hiding .lhn-br-kbd{animation:lhnBrBarOut .22s cubic-bezier(.4,0,1,1) forwards}
    @keyframes lhnBrBarIn{from{translate:0 calc(100% + 12px);opacity:0}to{translate:0 0;opacity:1}}
    @keyframes lhnBrBarOut{from{translate:0 0;opacity:1}to{translate:0 calc(100% + 12px);opacity:0}}
    @media (prefers-reduced-motion:reduce){#lhn-bilingual-reading-bar .lhn-br-rbar,#lhn-bilingual-reading-bar .lhn-br-kbd{animation:none!important}}
    #lhn-bilingual-reading-bar *{box-sizing:border-box}
    #lhn-bilingual-reading-bar [hidden]{display:none!important}
    #lhn-bilingual-reading-bar button,#lhn-bilingual-reading-bar input{margin:0;font-size:inherit;font-weight:inherit;line-height:normal;letter-spacing:normal;text-transform:none;text-shadow:none;text-decoration:none;min-width:0;min-height:0;max-width:none;box-shadow:none;outline-offset:2px}
    #lhn-bilingual-reading-bar svg{display:block;max-width:none}
    #lhn-bilingual-reading-bar svg[fill="none"]{fill:none}
    #lhn-bilingual-reading-bar svg[fill="currentColor"]{fill:currentColor}
    #lhn-bilingual-reading-bar svg[stroke="currentColor"]{stroke:currentColor}
    #lhn-bilingual-reading-bar svg *{fill:inherit;stroke:inherit}
    #lhn-bilingual-reading-bar .lhn-br-rbar{left:0;right:0;bottom:0;height:64px;display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center;padding:4px;border-top:1px solid rgba(148,163,184,.35);box-shadow:0 -6px 18px rgba(15,23,42,.06);pointer-events:auto;animation:lhnBrSlide .25s ease}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-rbar{box-shadow:0 -6px 18px rgba(0,0,0,.3)}
    #lhn-bilingual-reading-bar.lhn-br-wide .lhn-br-rbar{left:50%;right:auto;bottom:6px;width:560px;margin-left:-280px;padding:4px 14px;border:1px solid rgba(148,163,184,.35);border-radius:20px;box-shadow:0 10px 30px rgba(15,23,42,.16)}
    #lhn-bilingual-reading-bar.lhn-br-wide:not(.lhn-dark) .lhn-br-rbar,#lhn-bilingual-reading-bar.lhn-br-wide:not(.lhn-dark) .lhn-br-kbd{box-shadow:0 0 2px rgba(15,23,42,.144),0 0 12px rgba(15,23,42,.192)}
    #lhn-bilingual-reading-bar.lhn-br-wide.lhn-dark .lhn-br-rbar{border-color:rgba(148,163,184,.2);box-shadow:0 10px 30px rgba(0,0,0,.4)}
    #lhn-bilingual-reading-bar .lhn-br-left,#lhn-bilingual-reading-bar .lhn-br-center,#lhn-bilingual-reading-bar .lhn-br-right{display:flex;align-items:center;gap:2px;min-width:0}
    #lhn-bilingual-reading-bar .lhn-br-right{justify-content:flex-end}
    #lhn-bilingual-reading-bar.lhn-br-wide .lhn-br-center{gap:12px}
    #lhn-bilingual-reading-bar .lhn-br-btn{position:relative;width:40px;height:44px;flex:none;padding:0;border:0;background:none;color:#334155;display:grid;place-items:center;border-radius:12px;font-size:13px;font-weight:700;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:background .12s,transform .12s}
    #lhn-bilingual-reading-bar .lhn-br-btn svg{width:22px;height:22px}
    #lhn-bilingual-reading-bar.lhn-br-wide .lhn-br-btn{width:46px;height:46px}
    #lhn-bilingual-reading-bar .lhn-br-btn:active{background:rgba(148,163,184,.18);transform:scale(.94)}
    #lhn-bilingual-reading-bar.lhn-br-desk .lhn-br-btn:hover{background:rgba(148,163,184,.16)}
    #lhn-bilingual-reading-bar .lhn-br-btn.lhn-br-play{width:52px;height:52px;border-radius:50%;background:var(--lhn-br-accent);color:#fff}
    #lhn-bilingual-reading-bar.lhn-br-wide .lhn-br-btn.lhn-br-play{width:54px;height:54px}
    #lhn-bilingual-reading-bar.lhn-br-desk .lhn-br-btn.lhn-br-play:hover{background:var(--lhn-br-accent);filter:brightness(1.08)}
    #lhn-bilingual-reading-bar .lhn-br-btn.lhn-br-spd{width:auto;min-width:40px;padding:0 5px;font-size:13.5px;white-space:nowrap}
    #lhn-bilingual-reading-bar .lhn-br-btn.lhn-br-mins{width:auto;min-width:32px;padding:0 4px;font-size:13.5px;white-space:nowrap;cursor:default}
    #lhn-bilingual-reading-bar.lhn-br-wide .lhn-br-btn.lhn-br-spd{width:auto}
    #lhn-bilingual-reading-bar.lhn-br-wide .lhn-br-btn.lhn-br-mins{width:auto;min-width:40px}
    #lhn-bilingual-reading-bar .lhn-br-btn.lhn-br-mins:active,#lhn-bilingual-reading-bar.lhn-br-desk .lhn-br-btn.lhn-br-mins:hover{background:none;transform:none}
    #lhn-bilingual-reading-bar .lhn-br-btn.lhn-on{background:rgba(var(--lhn-br-accent-rgb),.12);color:var(--lhn-br-accent)}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-btn.lhn-on{background:rgba(139,92,246,.18);color:#c4b5fd}
    #lhn-bilingual-reading-bar .lhn-br-btn.lhn-br-rep.lhn-on,#lhn-bilingual-reading-bar.lhn-dark .lhn-br-btn.lhn-br-rep.lhn-on{background:none;color:var(--lhn-br-accent)}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-btn.lhn-br-rep.lhn-on{color:#a78bfa}
    #lhn-bilingual-reading-bar.lhn-br-desk .lhn-br-btn.lhn-br-rep.lhn-on:hover{background:rgba(148,163,184,.16)}
    #lhn-bilingual-reading-bar .lhn-br-btn.lhn-br-key-press{animation:lhnBrButtonPress .18s ease-out}
    #lhn-bilingual-reading-bar.lhn-br-desk .lhn-br-btn[data-tip]:hover::after{content:attr(data-tip);position:absolute;bottom:calc(100% + 12px);left:50%;transform:translateX(-50%);white-space:nowrap;background:rgba(17,17,22,.94);color:#fff;font-size:12px;font-weight:600;line-height:normal;padding:6px 9px;border-radius:8px;pointer-events:none;z-index:3}
    #lhn-bilingual-reading-bar.lhn-br-desk .lhn-br-left .lhn-br-btn[data-tip]:hover::after{left:0;transform:none}
    #lhn-bilingual-reading-bar.lhn-br-desk .lhn-br-right .lhn-br-btn[data-tip]:hover::after{left:auto;right:0;transform:none}
    #lhn-bilingual-reading-bar .lhn-br-rbar.lhn-scrubbing .lhn-br-btn::after{display:none}
    #lhn-bilingual-reading-bar .lhn-br-flagfont{font-family:"Twemoji Country Flags","Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif!important}
    #lhn-bilingual-reading-bar .lhn-br-vflag{position:relative;width:28px;height:28px;border-radius:50%;display:grid;place-items:center;overflow:hidden;font-size:34px;font-weight:400;line-height:1;box-shadow:0 0 0 1.5px rgba(148,163,184,.45)}
    #lhn-bilingual-reading-bar .lhn-br-vflag>span{display:block;transform:scale(1.25)}
    #lhn-bilingual-reading-bar .lhn-br-fimg{position:absolute;top:0;left:50%;height:100%;width:auto;max-width:none;transform:translateX(-50%);display:block;pointer-events:none}
    #lhn-bilingual-reading-bar .lhn-br-prog{position:absolute;top:-11px;left:0;right:0;height:22px;cursor:pointer;touch-action:none;z-index:2}
    #lhn-bilingual-reading-bar.lhn-br-wide .lhn-br-prog{left:18px;right:18px}
    #lhn-bilingual-reading-bar .lhn-br-prog::before{content:"";position:absolute;left:0;right:0;top:10px;height:3px;background:rgba(148,163,184,.3);border-radius:2px;transition:top .15s,height .15s}
    #lhn-bilingual-reading-bar .lhn-br-fill{position:absolute;left:0;top:10px;height:3px;width:0;background:var(--lhn-br-accent);display:block;border-radius:2px;transition:width .35s linear}
    #lhn-bilingual-reading-bar .lhn-br-prog.lhn-drag::before,#lhn-bilingual-reading-bar .lhn-br-prog.lhn-drag .lhn-br-fill{top:8.5px;height:5px}
    #lhn-bilingual-reading-bar .lhn-br-prog.lhn-drag .lhn-br-fill{transition:none}
    #lhn-bilingual-reading-bar .lhn-br-knob{position:absolute;right:-6px;top:50%;width:12px;height:12px;margin-top:-6px;border-radius:50%;background:var(--lhn-br-accent);box-shadow:0 0 0 3px rgba(var(--lhn-br-accent-rgb),.28);transition:transform .15s}
    #lhn-bilingual-reading-bar .lhn-br-prog.lhn-drag .lhn-br-knob{transform:scale(1.5)}
    #lhn-bilingual-reading-bar .lhn-br-ptip{position:absolute;bottom:26px;left:0;transform:translateX(-50%);background:rgba(24,24,27,.96);color:#fff;font-size:12.5px;font-weight:800;line-height:normal;padding:7px 10px;border-radius:10px;white-space:nowrap;opacity:0;pointer-events:none;transition:opacity .15s;box-shadow:0 6px 16px rgba(0,0,0,.35)}
    #lhn-bilingual-reading-bar .lhn-br-ptip small{display:block;max-width:230px;overflow:hidden;text-overflow:ellipsis;font-weight:500;color:#e9d5ff;font-size:11.5px;margin-top:2px}
    #lhn-bilingual-reading-bar .lhn-br-prog.lhn-drag .lhn-br-ptip{opacity:1}
    #lhn-bilingual-reading-bar .lhn-br-kbd{left:50%;bottom:82px;transform:translateX(-50%);display:flex;align-items:center;gap:6px;max-width:calc(100% - 16px);overflow:hidden;padding:5px 6px 5px 14px;border-radius:12px;border:1px solid rgba(148,163,184,.35);box-shadow:0 6px 18px rgba(15,23,42,.1);font-size:12.5px;font-weight:500;color:#475569;white-space:nowrap;transition:opacity .2s,transform .25s;pointer-events:auto}
    #lhn-bilingual-reading-bar:not(.lhn-br-wide) .lhn-br-kbd{bottom:76px}
    #lhn-bilingual-reading-bar .lhn-br-kbd [data-banner-text]{display:contents}
    #lhn-bilingual-reading-bar .lhn-br-kbd kbd{font-size:11.5px;font-weight:700;line-height:normal;padding:2px 6px;border-radius:6px;border:1px solid rgba(148,163,184,.45);border-bottom-width:2px;background:rgba(148,163,184,.1);color:var(--lhn-br-accent);margin:0 3px 0 0;box-shadow:none}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-kbd kbd{color:#c4b5fd}
    #lhn-bilingual-reading-bar .lhn-br-kbd .lhn-br-sep{opacity:.4;margin:0 2px}
    #lhn-bilingual-reading-bar .lhn-br-kbd button{width:26px;height:26px;flex:none;padding:0;border:0;border-radius:8px;background:none;color:inherit;cursor:pointer;font-size:16px;line-height:1}
    #lhn-bilingual-reading-bar .lhn-br-kbd button:hover{background:rgba(148,163,184,.18)}
    #lhn-bilingual-reading-bar.lhn-br-desk .lhn-br-rbar:hover+.lhn-br-kbd,#lhn-bilingual-reading-bar .lhn-br-kbd.lhn-off{opacity:0;pointer-events:none;transform:translateX(-50%) translateY(8px)}
    #lhn-bilingual-reading-bar .lhn-br-sheet{position:absolute;inset:0;z-index:9;pointer-events:none}
    #lhn-bilingual-reading-bar .lhn-br-scrim{position:absolute;inset:0;background:rgba(0,0,0,.45);opacity:0;transition:opacity .2s}
    #lhn-bilingual-reading-bar.lhn-br-wide .lhn-br-scrim{background:transparent}
    #lhn-bilingual-reading-bar .lhn-br-panel{left:50%;bottom:0;width:min(560px,100%);max-height:88%;display:flex;flex-direction:column;padding:8px 14px 18px;border-radius:22px 22px 0 0;color:#111827;box-shadow:0 -10px 30px rgba(0,0,0,.18);transform:translate(-50%,105%);transition:transform .26s cubic-bezier(.2,.8,.2,1);text-align:left}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-panel{color:#f4f4f5;box-shadow:0 -10px 30px rgba(0,0,0,.4)}
    #lhn-bilingual-reading-bar .lhn-br-sheet.lhn-open{pointer-events:auto}
    #lhn-bilingual-reading-bar .lhn-br-sheet.lhn-open .lhn-br-scrim{opacity:1}
    #lhn-bilingual-reading-bar .lhn-br-sheet.lhn-open .lhn-br-panel{transform:translate(-50%,0)}
    #lhn-bilingual-reading-bar .lhn-br-panel.lhn-dragging{transition:none}
    #lhn-bilingual-reading-bar .lhn-br-grip{flex:none;width:40px;height:4px;border-radius:2px;background:rgba(148,163,184,.55);margin:2px auto 12px;touch-action:none}
    #lhn-bilingual-reading-bar.lhn-br-wide .lhn-br-panel{width:380px;max-height:min(560px,78%);border-radius:20px;padding:12px 14px 14px;border:1px solid rgba(148,163,184,.28);box-shadow:0 18px 40px rgba(15,23,42,.18);transform:translateY(10px);opacity:0;transition:transform .2s,opacity .2s}
    #lhn-bilingual-reading-bar.lhn-br-wide.lhn-dark .lhn-br-panel{border-color:rgba(148,163,184,.2)}
    #lhn-bilingual-reading-bar.lhn-br-wide .lhn-br-sheet.lhn-open .lhn-br-panel{transform:none;opacity:1}
    #lhn-bilingual-reading-bar.lhn-br-wide .lhn-br-grip{display:none}
    #lhn-bilingual-reading-bar.lhn-br-wide .lhn-br-panel.lhn-br-more,#lhn-bilingual-reading-bar.lhn-br-wide .lhn-br-panel.lhn-br-speedp{width:340px}
    #lhn-bilingual-reading-bar .lhn-br-shead{flex:none;display:flex;align-items:center;gap:6px;padding:2px 2px 8px;touch-action:none}
    #lhn-bilingual-reading-bar .lhn-br-shead .lhn-br-stitle{flex:1;min-width:0;font-size:17px;font-weight:700}
    #lhn-bilingual-reading-bar .lhn-br-shead .lhn-br-spval{flex:none;font-size:17px;font-weight:800;color:var(--lhn-br-accent);margin-right:4px}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-shead .lhn-br-spval{color:#c4b5fd}
    #lhn-bilingual-reading-bar .lhn-br-sx{width:38px;height:38px;flex:none;padding:0;border:0;border-radius:10px;background:none;display:grid;place-items:center;cursor:pointer}
    #lhn-bilingual-reading-bar .lhn-br-sx:active,#lhn-bilingual-reading-bar.lhn-br-desk .lhn-br-sx:hover{background:rgba(148,163,184,.18)}
    #lhn-bilingual-reading-bar .lhn-br-sx svg{width:20px;height:20px}
    #lhn-bilingual-reading-bar .lhn-br-sbody{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain}
    #lhn-bilingual-reading-bar .lhn-br-pane{display:none}
    #lhn-bilingual-reading-bar .lhn-br-pane.lhn-on{display:block}
    #lhn-bilingual-reading-bar .lhn-br-panel.lhn-br-more .lhn-br-shead{display:none}
    #lhn-bilingual-reading-bar .lhn-br-quick{display:grid;grid-template-columns:repeat(3,1fr);gap:14px 6px;padding:4px 0 6px}
    #lhn-bilingual-reading-bar .lhn-br-q{position:relative;display:flex;flex-direction:column;align-items:center;gap:7px;min-width:0;padding:4px 0;border:0;background:none;color:inherit;font-size:12.5px;font-weight:600;line-height:1.2;text-align:center;cursor:pointer;-webkit-tap-highlight-color:transparent}
    #lhn-bilingual-reading-bar .lhn-br-q .lhn-br-ic{position:relative;width:52px;height:52px;border-radius:16px;display:grid;place-items:center;border:1px solid #cbd5e1;transition:transform .15s}
    #lhn-bilingual-reading-bar .lhn-br-q .lhn-br-ic svg{width:23px;height:23px}
    #lhn-bilingual-reading-bar .lhn-br-q.lhn-on .lhn-br-ic{background:#f3e8ff;border-color:var(--lhn-br-accent);color:var(--lhn-br-accent)}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-q.lhn-on .lhn-br-ic{background:rgba(139,92,246,.22);border-color:#8b5cf6;color:#c4b5fd}
    #lhn-bilingual-reading-bar .lhn-br-q:active .lhn-br-ic{transform:scale(.94)}
    #lhn-bilingual-reading-bar .lhn-br-q .lhn-br-icmoon{display:contents}
    #lhn-bilingual-reading-bar .lhn-br-q .lhn-br-icsun{display:none}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-q .lhn-br-icsun{display:contents}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-q .lhn-br-icmoon{display:none}
    #lhn-bilingual-reading-bar .lhn-br-vsearch{flex:none;display:block;width:100%;height:44px;border:1px solid #e2e8f0;border-radius:12px;padding:0 14px;font-size:15px;color:inherit;outline:none;margin:0 0 8px;-webkit-appearance:none;appearance:none}
    #lhn-bilingual-reading-bar .lhn-br-vsearch:focus{border-color:var(--lhn-br-accent)}
    #lhn-bilingual-reading-bar .lhn-br-voice-group{font-size:11.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:12px 6px 6px}
    #lhn-bilingual-reading-bar .lhn-br-voice{display:flex;align-items:center;gap:12px;width:100%;min-height:56px;padding:7px 8px;border:0;border-radius:12px;background:none;color:inherit;font-size:15px;text-align:left;cursor:pointer}
    #lhn-bilingual-reading-bar .lhn-br-voice:active,#lhn-bilingual-reading-bar.lhn-br-desk .lhn-br-voice:hover{background:rgba(148,163,184,.14)}
    #lhn-bilingual-reading-bar .lhn-br-voice.lhn-kb-active{background:rgba(148,163,184,.18);box-shadow:inset 0 0 0 2px var(--lhn-br-accent)}
    #lhn-bilingual-reading-bar .lhn-br-vf{position:relative;flex:none;width:40px;height:40px;border-radius:50%;display:grid;place-items:center;overflow:hidden;font-size:46px;font-weight:400;line-height:1}
    #lhn-bilingual-reading-bar .lhn-br-vf.lhn-br-globe{color:#334155}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-vf.lhn-br-globe{color:#e4e4e7}
    #lhn-bilingual-reading-bar .lhn-br-vf.lhn-br-globe svg{width:20px;height:20px}
    #lhn-bilingual-reading-bar .lhn-br-vt{flex:1;min-width:0}
    #lhn-bilingual-reading-bar .lhn-br-vt b{display:block;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    #lhn-bilingual-reading-bar .lhn-br-vt small{display:block;font-size:12.5px;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    #lhn-bilingual-reading-bar .lhn-br-ck{flex:none;color:var(--lhn-br-accent);font-weight:800}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-ck{color:#c4b5fd}
    #lhn-bilingual-reading-bar .lhn-br-pane[data-pane="speed"]{padding:8px 2px 4px}
    #lhn-bilingual-reading-bar .lhn-br-sprow{display:flex;align-items:center;gap:12px;margin-bottom:20px}
    #lhn-bilingual-reading-bar .lhn-br-spstep{width:36px;height:36px;flex:none;padding:0;border-radius:50%;border:0;color:#1f2937;font-weight:700;font-size:18px;cursor:pointer}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-spstep{color:#e5e7eb}
    #lhn-bilingual-reading-bar .lhn-br-range{-webkit-appearance:none;appearance:none;flex:1;min-width:0;background:transparent;margin:0 4px;padding:0;border:0}
    #lhn-bilingual-reading-bar .lhn-br-range::-webkit-slider-runnable-track{height:6px;border-radius:9999px}
    #lhn-bilingual-reading-bar .lhn-br-range::-webkit-slider-thumb{-webkit-appearance:none;width:24px;height:24px;border:0;border-radius:50%;background:#000;margin-top:-9px;box-shadow:0 4px 6px -1px rgba(0,0,0,.15)}
    #lhn-bilingual-reading-bar .lhn-br-range::-moz-range-track{height:6px;border-radius:9999px}
    #lhn-bilingual-reading-bar .lhn-br-range::-moz-range-thumb{width:24px;height:24px;border:0;border-radius:50%;background:#000}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-range::-webkit-slider-thumb{background:#fff}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-range::-moz-range-thumb{background:#fff}
    #lhn-bilingual-reading-bar .lhn-br-spgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
    #lhn-bilingual-reading-bar .lhn-br-spgrid button{height:44px;padding:0 4px;border-radius:9999px;border:0;color:#374151;font-size:12px;font-weight:600;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.1;text-align:center}
    #lhn-bilingual-reading-bar .lhn-br-spgrid button.lhn-br-normal{font-weight:800}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-spgrid button.lhn-active{background:#facc15;color:#000}
    #lhn-bilingual-reading-bar .lhn-br-toast{left:50%;bottom:84px;width:max-content;max-width:min(330px,calc(100% - 24px));transform:translateX(-50%) translateY(10px);background:rgba(17,17,22,.94);color:#fff;font-size:13px;font-weight:600;line-height:1.35;padding:9px 14px;border-radius:12px;opacity:0;transition:opacity .2s,transform .2s;z-index:20;pointer-events:none;text-align:center}
    #lhn-bilingual-reading-bar.lhn-br-desk .lhn-br-toast{bottom:144px}
    #lhn-bilingual-reading-bar .lhn-br-toast.lhn-on{opacity:1;transform:translateX(-50%) translateY(0)}
    #lhn-br-spacer{display:block!important;width:1px!important;flex:none!important;margin:0!important;padding:0!important;border:0!important;visibility:hidden!important;pointer-events:none!important}
    @keyframes lhnBrFade{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}@keyframes lhnBrSlide{from{opacity:0}to{opacity:1}}@keyframes lhnBrButtonPress{35%{transform:scale(.84);background:rgba(148,163,184,.38)}100%{transform:scale(1)}}
    #lhn-bilingual-reading-bar .lhn-br-rbar,#lhn-bilingual-reading-bar .lhn-br-panel,#lhn-bilingual-reading-bar .lhn-br-kbd,#lhn-bilingual-reading-bar .lhn-br-toast{position:fixed}
    #lhn-bilingual-reading-bar .lhn-br-sheet .lhn-br-scrim{top:-120px;bottom:-120px}
    #lhn-bilingual-reading-bar:not(.lhn-br-desk) .lhn-br-rbar{height:77px}
    #lhn-bilingual-reading-bar:not(.lhn-br-desk) .lhn-br-btn{height:53px}
    #lhn-bilingual-reading-bar:not(.lhn-br-desk) .lhn-br-btn.lhn-br-play{height:52px}
    #lhn-bilingual-reading-bar.lhn-br-wide:not(.lhn-br-desk) .lhn-br-btn.lhn-br-play{height:54px}
    #lhn-bilingual-reading-bar:not(.lhn-br-desk) .lhn-br-btn svg{width:26px;height:26px}
    #lhn-bilingual-reading-bar:not(.lhn-br-desk) .lhn-br-vflag{width:34px;height:34px;font-size:41px}
    #lhn-bilingual-reading-bar:not(.lhn-br-desk):not(.lhn-br-wide) .lhn-br-kbd{bottom:89px}
    #lhn-bilingual-reading-bar.lhn-br-wide:not(.lhn-br-desk) .lhn-br-kbd{bottom:95px}
    #lhn-bilingual-reading-bar:not(.lhn-br-desk) .lhn-br-toast{bottom:97px}
    #lhn-bilingual-reading-bar:not(.lhn-br-desk):not(.lhn-br-wide) .lhn-br-left{padding-left:9px}
    #lhn-bilingual-reading-bar:not(.lhn-br-desk):not(.lhn-br-wide) .lhn-br-btn[data-voices]{width:38px}
    #lhn-bilingual-reading-bar:not(.lhn-br-desk):not(.lhn-br-wide) .lhn-br-btn.lhn-br-spd{padding:0 1.5px}
    #lhn-bilingual-reading-bar .lhn-br-rbar,#lhn-bilingual-reading-bar .lhn-br-panel,#lhn-bilingual-reading-bar .lhn-br-kbd{background:var(--kp-glass-l);-webkit-backdrop-filter:var(--kp-blur);backdrop-filter:var(--kp-blur)}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-rbar,#lhn-bilingual-reading-bar.lhn-dark .lhn-br-panel,#lhn-bilingual-reading-bar.lhn-dark .lhn-br-kbd{background:var(--kp-glass-d)}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-rbar,#lhn-bilingual-reading-bar.lhn-dark .lhn-br-kbd{border-color:rgba(255,255,255,.09)}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-btn{color:var(--kp-tx-d)}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-kbd{color:var(--kp-tx-d)}
    #lhn-bilingual-reading-bar .lhn-br-sx{color:var(--kp-tx2-l)}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-sx{color:#d4d4d8}
    #lhn-bilingual-reading-bar .lhn-br-q .lhn-br-ic{background:var(--kp-tile-l);border-color:var(--kp-line-l);color:var(--kp-tx-strong-l);box-shadow:0 1px 2px rgba(15,23,42,.05)}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-q .lhn-br-ic{background:var(--kp-tile-d);border-color:var(--kp-line-d);color:var(--kp-tx-strong-d);box-shadow:none}
    #lhn-bilingual-reading-bar .lhn-br-vsearch{background:rgba(255,255,255,.6);border-color:rgba(15,23,42,.14)}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-vsearch{background:var(--kp-tile-d);border-color:rgba(255,255,255,.14);color:var(--kp-tx-strong-d)}
    #lhn-bilingual-reading-bar .lhn-br-voice-group,#lhn-bilingual-reading-bar .lhn-br-vt small{color:var(--kp-tx2-l)}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-voice-group,#lhn-bilingual-reading-bar.lhn-dark .lhn-br-vt small{color:var(--kp-tx2-d)}
    #lhn-bilingual-reading-bar .lhn-br-voice.lhn-selected{background:rgba(15,23,42,.06)}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-voice.lhn-selected{background:var(--kp-tile-d)}
    #lhn-bilingual-reading-bar .lhn-br-vf{background:rgba(255,255,255,.6)}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-vf{background:var(--kp-tile-d)}
    #lhn-bilingual-reading-bar .lhn-br-vf.lhn-br-globe{background:rgba(255,255,255,.6);box-shadow:inset 0 0 0 1px var(--kp-line-l)}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-vf.lhn-br-globe{background:rgba(255,255,255,.1);box-shadow:inset 0 0 0 1px rgba(255,255,255,.14)}
    #lhn-bilingual-reading-bar .lhn-br-spstep,#lhn-bilingual-reading-bar .lhn-br-spgrid button{background:rgba(15,23,42,.06)}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-spstep,#lhn-bilingual-reading-bar.lhn-dark .lhn-br-spgrid button{background:var(--kp-tile-d)}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-spgrid button{color:var(--kp-tx-d)}
    #lhn-bilingual-reading-bar .lhn-br-spgrid button.lhn-active{background:#7000ff;color:#fff}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-range::-webkit-slider-runnable-track{background:rgba(255,255,255,.18)}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-range::-moz-range-track{background:rgba(255,255,255,.18)}
    #lhn-bilingual-reading-bar .lhn-br-range::-webkit-slider-runnable-track{background:var(--kp-line-l)}
    #lhn-bilingual-reading-bar .lhn-br-range::-moz-range-track{background:var(--kp-line-l)}
  `;
