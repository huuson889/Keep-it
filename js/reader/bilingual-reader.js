(() => {
  if (window.__lhnBilingualReaderLoaded) return;
  window.__lhnBilingualReaderLoaded = true;
  const SETTINGS_KEY = "lhnBilingualReaderSettings";
  const TARGET_LANGUAGE_KEY = "lhnStudyTranslationSettings";
  const DEMO_PROFILE_KEY = "lhnDashboardDemoProfile";
  const DISPLAY_SETTINGS_KEY = globalThis.LHN_CONFIG?.STORAGE_KEYS?.SETTINGS || "lhnSettings";
  const DEFAULTS = globalThis.LHN_DEFAULTS.reader;
  let settings = { ...DEFAULTS }, targetLanguage = "auto", displayLang = globalThis.LHN_LANGUAGES?.detectLanguage?.() || "en", lastPointer = null, lazyObserver = null, reading = false, readingPaused = false, resumeText = "", currentReadText = "", currentReadCharIndex = 0, websiteDisabled = false, queue = [], queueIndex = 0, utterance = null, selectedVoice = null, activeVoice = null, activeSpeechLang = "", systemVoices = [];
  let webFontRequestId = 0, loadedWebFontFamily = "", fontStylesheetReady = Promise.resolve(), accountProfile = null, addonThemePreference = "system", dashboardShortcuts = {};
  let speechDetectionRequest = 0;
  let voiceKbIndex = -1;
  const FLAG_REGION_KEYS = globalThis.LHN_FLAGS?.regionKeys || Object.freeze({ US: "US" });
  const flagEmojiForRegion = region => globalThis.LHN_FLAGS?.emojiForRegion?.(region) || "🇺🇸";
  const flagFontUrl = globalThis.browser?.runtime?.getURL?.("assets/fonts/TwemojiCountryFlags.woff2")
    || globalThis.chrome?.runtime?.getURL?.("assets/fonts/TwemojiCountryFlags.woff2") || "";
  const READ_LANGUAGE_CODES = ["en","vi","ko","ja","zh","es","pt","fr","de","it","ru","uk","pl","tr","ro","id","th","hi","bn","fa","tl"];
  const readLanguageRegion = code => LHN_TTS.normalizeLanguage(code).split("-")[1]?.toUpperCase() || "";
  const languageLabel = (code, locale) => { try { return new Intl.DisplayNames([locale], { type:"language" }).of(code) || code; } catch { return code; } };
  const readLanguageName = code => languageLabel(code, displayLang);
  const plainText = value => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d").toLocaleLowerCase();
  const synth = window.speechSynthesis;
  const style = document.createElement("style");
  let fontStylesheetLink = null;
  function ensureWebFontStylesheet() {
    let fonts = document.querySelector('link[data-lhn-bilingual-fonts]');
    if (fonts?.sheet) {
      fontStylesheetLink = fonts;
      fontStylesheetReady = Promise.resolve();
      return fontStylesheetReady;
    }
    if (!fonts) {
      fonts = document.createElement("link");
      fonts.rel = "stylesheet";
      fonts.href = "https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500&family=Inter:wght@300;400;500;600;700&family=Lora:ital,wght@0,400;0,600;1,400&family=Roboto+Mono:wght@400;500&display=swap";
      fonts.dataset.lhnBilingualFonts = "true";
    }
    if (fontStylesheetLink === fonts) return fontStylesheetReady;
    fontStylesheetLink = fonts;
    fontStylesheetReady = new Promise(resolve => {
      const done = () => resolve();
      fonts.addEventListener("load", done, { once:true });
      fonts.addEventListener("error", done, { once:true });
      if (!fonts.isConnected) (document.head || document.documentElement).appendChild(fonts);
      if (fonts.sheet) done();
    });
    return fontStylesheetReady;
  }
  style.textContent = `
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
    #lhn-bilingual-reading-bar .lhn-br-rbar{position:absolute;left:0;right:0;bottom:0;height:64px;display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center;padding:4px;background:rgba(255,255,255,.97);border-top:1px solid rgba(148,163,184,.35);box-shadow:0 -6px 18px rgba(15,23,42,.06);pointer-events:auto;animation:lhnBrSlide .25s ease}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-rbar{background:rgba(17,17,22,.97);border-color:rgba(148,163,184,.2);box-shadow:0 -6px 18px rgba(0,0,0,.3)}
    #lhn-bilingual-reading-bar.lhn-br-wide .lhn-br-rbar{left:50%;right:auto;bottom:6px;width:560px;margin-left:-280px;padding:4px 14px;border:1px solid rgba(148,163,184,.35);border-radius:20px;box-shadow:0 10px 30px rgba(15,23,42,.16)}
    #lhn-bilingual-reading-bar.lhn-br-wide:not(.lhn-dark) .lhn-br-rbar,#lhn-bilingual-reading-bar.lhn-br-wide:not(.lhn-dark) .lhn-br-kbd{box-shadow:0 0 2px rgba(15,23,42,.144),0 0 12px rgba(15,23,42,.192)}
    #lhn-bilingual-reading-bar.lhn-br-wide.lhn-dark .lhn-br-rbar{border-color:rgba(148,163,184,.2);box-shadow:0 10px 30px rgba(0,0,0,.4)}
    #lhn-bilingual-reading-bar .lhn-br-left,#lhn-bilingual-reading-bar .lhn-br-center,#lhn-bilingual-reading-bar .lhn-br-right{display:flex;align-items:center;gap:2px;min-width:0}
    #lhn-bilingual-reading-bar .lhn-br-right{justify-content:flex-end}
    #lhn-bilingual-reading-bar.lhn-br-wide .lhn-br-center{gap:12px}
    #lhn-bilingual-reading-bar .lhn-br-btn{position:relative;width:40px;height:44px;flex:none;padding:0;border:0;background:none;color:#334155;display:grid;place-items:center;border-radius:12px;font-size:13px;font-weight:700;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:background .12s,transform .12s}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-btn{color:#d4d4d8}
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
    #lhn-bilingual-reading-bar .lhn-br-kbd{position:absolute;left:50%;bottom:82px;transform:translateX(-50%);display:flex;align-items:center;gap:6px;max-width:calc(100% - 16px);overflow:hidden;padding:5px 6px 5px 14px;border-radius:12px;background:rgba(255,255,255,.97);border:1px solid rgba(148,163,184,.35);box-shadow:0 6px 18px rgba(15,23,42,.1);font-size:12.5px;font-weight:500;color:#475569;white-space:nowrap;transition:opacity .2s,transform .25s;pointer-events:auto}
    #lhn-bilingual-reading-bar:not(.lhn-br-wide) .lhn-br-kbd{bottom:76px}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-kbd{background:#18181b;border-color:#27272a;color:#d4d4d8}
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
    #lhn-bilingual-reading-bar .lhn-br-panel{position:absolute;left:50%;bottom:0;width:min(560px,100%);max-height:88%;display:flex;flex-direction:column;padding:8px 14px 18px;border-radius:22px 22px 0 0;background:#fff;color:#111827;box-shadow:0 -10px 30px rgba(0,0,0,.18);transform:translate(-50%,105%);transition:transform .26s cubic-bezier(.2,.8,.2,1);text-align:left}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-panel{background:#18181b;color:#f4f4f5;box-shadow:0 -10px 30px rgba(0,0,0,.4)}
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
    #lhn-bilingual-reading-bar .lhn-br-sx{width:38px;height:38px;flex:none;padding:0;border:0;border-radius:10px;background:none;color:#64748b;display:grid;place-items:center;cursor:pointer}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-sx{color:#a1a1aa}
    #lhn-bilingual-reading-bar .lhn-br-sx:active,#lhn-bilingual-reading-bar.lhn-br-desk .lhn-br-sx:hover{background:rgba(148,163,184,.18)}
    #lhn-bilingual-reading-bar .lhn-br-sx svg{width:20px;height:20px}
    #lhn-bilingual-reading-bar .lhn-br-sbody{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain}
    #lhn-bilingual-reading-bar .lhn-br-pane{display:none}
    #lhn-bilingual-reading-bar .lhn-br-pane.lhn-on{display:block}
    #lhn-bilingual-reading-bar .lhn-br-panel.lhn-br-more .lhn-br-shead{display:none}
    #lhn-bilingual-reading-bar .lhn-br-quick{display:grid;grid-template-columns:repeat(3,1fr);gap:14px 6px;padding:4px 0 6px}
    #lhn-bilingual-reading-bar .lhn-br-q{position:relative;display:flex;flex-direction:column;align-items:center;gap:7px;min-width:0;padding:4px 0;border:0;background:none;color:inherit;font-size:12.5px;font-weight:600;line-height:1.2;text-align:center;cursor:pointer;-webkit-tap-highlight-color:transparent}
    #lhn-bilingual-reading-bar .lhn-br-q .lhn-br-ic{position:relative;width:52px;height:52px;border-radius:16px;display:grid;place-items:center;background:#f1f5f9;border:1px solid #cbd5e1;color:#1f2937;box-shadow:0 1px 2px rgba(15,23,42,.06);transition:transform .15s}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-q .lhn-br-ic{background:rgba(255,255,255,.06);border-color:rgba(148,163,184,.18);color:#d4d4d8;box-shadow:none}
    #lhn-bilingual-reading-bar .lhn-br-q .lhn-br-ic svg{width:23px;height:23px}
    #lhn-bilingual-reading-bar .lhn-br-q.lhn-on .lhn-br-ic{background:#f3e8ff;border-color:var(--lhn-br-accent);color:var(--lhn-br-accent)}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-q.lhn-on .lhn-br-ic{background:rgba(139,92,246,.22);border-color:#8b5cf6;color:#c4b5fd}
    #lhn-bilingual-reading-bar .lhn-br-q:active .lhn-br-ic{transform:scale(.94)}
    #lhn-bilingual-reading-bar .lhn-br-q .lhn-br-icmoon{display:contents}
    #lhn-bilingual-reading-bar .lhn-br-q .lhn-br-icsun{display:none}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-q .lhn-br-icsun{display:contents}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-q .lhn-br-icmoon{display:none}
    #lhn-bilingual-reading-bar .lhn-br-vsearch{flex:none;display:block;width:100%;height:44px;border:1px solid #e2e8f0;border-radius:12px;padding:0 14px;font-size:15px;background:#f8fafc;color:inherit;outline:none;margin:0 0 8px;-webkit-appearance:none;appearance:none}
    #lhn-bilingual-reading-bar .lhn-br-vsearch:focus{border-color:var(--lhn-br-accent)}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-vsearch{background:#27272a;border-color:#3f3f46}
    #lhn-bilingual-reading-bar .lhn-br-voice-group{font-size:11.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#64748b;padding:12px 6px 6px}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-voice-group{color:#a1a1aa}
    #lhn-bilingual-reading-bar .lhn-br-voice{display:flex;align-items:center;gap:12px;width:100%;min-height:56px;padding:7px 8px;border:0;border-radius:12px;background:none;color:inherit;font-size:15px;text-align:left;cursor:pointer}
    #lhn-bilingual-reading-bar .lhn-br-voice:active,#lhn-bilingual-reading-bar.lhn-br-desk .lhn-br-voice:hover{background:rgba(148,163,184,.14)}
    #lhn-bilingual-reading-bar .lhn-br-voice.lhn-selected{background:#f1f3f5}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-voice.lhn-selected{background:#27272a}
    #lhn-bilingual-reading-bar .lhn-br-voice.lhn-kb-active{background:rgba(148,163,184,.18);box-shadow:inset 0 0 0 2px var(--lhn-br-accent)}
    #lhn-bilingual-reading-bar .lhn-br-vf{position:relative;flex:none;width:40px;height:40px;border-radius:50%;display:grid;place-items:center;overflow:hidden;font-size:46px;font-weight:400;line-height:1;background:#eef2f7}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-vf{background:#27272a}
    #lhn-bilingual-reading-bar .lhn-br-vf.lhn-br-globe{color:#334155;background:#e2e8f0;box-shadow:inset 0 0 0 1px rgba(148,163,184,.35)}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-vf.lhn-br-globe{color:#e4e4e7;background:#3f3f46;box-shadow:inset 0 0 0 1px rgba(161,161,170,.25)}
    #lhn-bilingual-reading-bar .lhn-br-vf.lhn-br-globe svg{width:20px;height:20px}
    #lhn-bilingual-reading-bar .lhn-br-vt{flex:1;min-width:0}
    #lhn-bilingual-reading-bar .lhn-br-vt b{display:block;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    #lhn-bilingual-reading-bar .lhn-br-vt small{display:block;font-size:12.5px;color:#64748b;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-vt small{color:#a1a1aa}
    #lhn-bilingual-reading-bar .lhn-br-ck{flex:none;color:var(--lhn-br-accent);font-weight:800}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-ck{color:#c4b5fd}
    #lhn-bilingual-reading-bar .lhn-br-pane[data-pane="speed"]{padding:8px 2px 4px}
    #lhn-bilingual-reading-bar .lhn-br-sprow{display:flex;align-items:center;gap:12px;margin-bottom:20px}
    #lhn-bilingual-reading-bar .lhn-br-spstep{width:36px;height:36px;flex:none;padding:0;border-radius:50%;border:0;background:#f3f4f6;color:#1f2937;font-weight:700;font-size:18px;cursor:pointer}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-spstep{background:#222225;color:#e5e7eb}
    #lhn-bilingual-reading-bar .lhn-br-range{-webkit-appearance:none;appearance:none;flex:1;min-width:0;background:transparent;margin:0 4px;padding:0;border:0}
    #lhn-bilingual-reading-bar .lhn-br-range::-webkit-slider-runnable-track{height:6px;border-radius:9999px;background:#e5e7eb}
    #lhn-bilingual-reading-bar .lhn-br-range::-webkit-slider-thumb{-webkit-appearance:none;width:24px;height:24px;border:0;border-radius:50%;background:#000;margin-top:-9px;box-shadow:0 4px 6px -1px rgba(0,0,0,.15)}
    #lhn-bilingual-reading-bar .lhn-br-range::-moz-range-track{height:6px;border-radius:9999px;background:#e5e7eb}
    #lhn-bilingual-reading-bar .lhn-br-range::-moz-range-thumb{width:24px;height:24px;border:0;border-radius:50%;background:#000}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-range::-webkit-slider-runnable-track{background:#374151}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-range::-webkit-slider-thumb{background:#fff}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-range::-moz-range-track{background:#374151}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-range::-moz-range-thumb{background:#fff}
    #lhn-bilingual-reading-bar .lhn-br-spgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
    #lhn-bilingual-reading-bar .lhn-br-spgrid button{height:44px;padding:0 4px;border-radius:9999px;border:0;background:#f3f4f6;color:#374151;font-size:12px;font-weight:600;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.1;text-align:center}
    #lhn-bilingual-reading-bar .lhn-br-spgrid button.lhn-br-normal{font-weight:800}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-spgrid button{background:#222225;color:#d1d5db}
    #lhn-bilingual-reading-bar .lhn-br-spgrid button.lhn-active{background:#7000ff;color:#fff}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-spgrid button.lhn-active{background:#facc15;color:#000}
    #lhn-bilingual-reading-bar .lhn-br-toast{position:absolute;left:50%;bottom:84px;width:max-content;max-width:min(330px,calc(100% - 24px));transform:translateX(-50%) translateY(10px);background:rgba(17,17,22,.94);color:#fff;font-size:13px;font-weight:600;line-height:1.35;padding:9px 14px;border-radius:12px;opacity:0;transition:opacity .2s,transform .2s;z-index:20;pointer-events:none;text-align:center}
    #lhn-bilingual-reading-bar.lhn-br-desk .lhn-br-toast{bottom:144px}
    #lhn-bilingual-reading-bar .lhn-br-toast.lhn-on{opacity:1;transform:translateX(-50%) translateY(0)}
    #lhn-br-spacer{display:block!important;width:1px!important;flex:none!important;margin:0!important;padding:0!important;border:0!important;visibility:hidden!important;pointer-events:none!important}
    @keyframes lhnBrFade{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}@keyframes lhnBrSlide{from{opacity:0}to{opacity:1}}@keyframes lhnBrButtonPress{35%{transform:scale(.84);background:rgba(148,163,184,.38)}100%{transform:scale(1)}}
    /* v3.5.159: bar, panels and banner are fixed to the viewport bottom themselves, so Chrome/Edge Android slide them with their own toolbars */
    #lhn-bilingual-reading-bar .lhn-br-rbar,#lhn-bilingual-reading-bar .lhn-br-panel,#lhn-bilingual-reading-bar .lhn-br-kbd,#lhn-bilingual-reading-bar .lhn-br-toast{position:fixed}
    #lhn-bilingual-reading-bar .lhn-br-sheet .lhn-br-scrim{top:-120px;bottom:-120px}
    /* v3.5.159: touch bar 20% taller with 20% larger icons; button widths unchanged so the row still fits a 392px phone */
    #lhn-bilingual-reading-bar:not(.lhn-br-desk) .lhn-br-rbar{height:77px}
    #lhn-bilingual-reading-bar:not(.lhn-br-desk) .lhn-br-btn{height:53px}
    #lhn-bilingual-reading-bar:not(.lhn-br-desk) .lhn-br-btn.lhn-br-play{height:52px}
    #lhn-bilingual-reading-bar.lhn-br-wide:not(.lhn-br-desk) .lhn-br-btn.lhn-br-play{height:54px}
    #lhn-bilingual-reading-bar:not(.lhn-br-desk) .lhn-br-btn svg{width:26px;height:26px}
    #lhn-bilingual-reading-bar:not(.lhn-br-desk) .lhn-br-vflag{width:34px;height:34px;font-size:41px}
    #lhn-bilingual-reading-bar:not(.lhn-br-desk):not(.lhn-br-wide) .lhn-br-kbd{bottom:89px}
    #lhn-bilingual-reading-bar.lhn-br-wide:not(.lhn-br-desk) .lhn-br-kbd{bottom:95px}
    #lhn-bilingual-reading-bar:not(.lhn-br-desk) .lhn-br-toast{bottom:97px}
    /* v3.5.160 phone / tablet portrait: the flag sits as far from the left edge as the ☰ lines from the right edge (≈15px);
       the flag button (2px) and the speed button (7px of side padding) give the room back so the time box stays where it was */
    #lhn-bilingual-reading-bar:not(.lhn-br-desk):not(.lhn-br-wide) .lhn-br-left{padding-left:9px}
    #lhn-bilingual-reading-bar:not(.lhn-br-desk):not(.lhn-br-wide) .lhn-br-btn[data-voices]{width:38px}
    #lhn-bilingual-reading-bar:not(.lhn-br-desk):not(.lhn-br-wide) .lhn-br-btn.lhn-br-spd{padding:0 1.5px}
    /* v3.5.191: same light / dark glass as the Keepit bar and ☰ sheet (touch-ui v3.5.189–190) — 78% glass + blur 24,
       clear labels / icons, translucent tiles / fields / chips instead of solid blocks. Colours only; layout unchanged. */
    #lhn-bilingual-reading-bar .lhn-br-rbar,#lhn-bilingual-reading-bar .lhn-br-panel,#lhn-bilingual-reading-bar .lhn-br-kbd{background:rgba(255,255,255,.78);-webkit-backdrop-filter:blur(24px) saturate(1.6);backdrop-filter:blur(24px) saturate(1.6)}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-rbar,#lhn-bilingual-reading-bar.lhn-dark .lhn-br-panel,#lhn-bilingual-reading-bar.lhn-dark .lhn-br-kbd{background:rgba(24,24,28,.78)}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-rbar,#lhn-bilingual-reading-bar.lhn-dark .lhn-br-kbd{border-color:rgba(255,255,255,.09)}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-btn{color:#e4e4e7}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-kbd{color:#e4e4e7}
    #lhn-bilingual-reading-bar .lhn-br-sx{color:#52525b}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-sx{color:#d4d4d8}
    #lhn-bilingual-reading-bar .lhn-br-q .lhn-br-ic{background:rgba(255,255,255,.55);border-color:rgba(15,23,42,.12);color:#1f2937;box-shadow:0 1px 2px rgba(15,23,42,.05)}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-q .lhn-br-ic{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.12);color:#f4f4f5;box-shadow:none}
    #lhn-bilingual-reading-bar .lhn-br-vsearch{background:rgba(255,255,255,.6);border-color:rgba(15,23,42,.14)}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-vsearch{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.14);color:#f4f4f5}
    #lhn-bilingual-reading-bar .lhn-br-voice-group,#lhn-bilingual-reading-bar .lhn-br-vt small{color:#52525b}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-voice-group,#lhn-bilingual-reading-bar.lhn-dark .lhn-br-vt small{color:#b4b4bc}
    #lhn-bilingual-reading-bar .lhn-br-voice.lhn-selected{background:rgba(15,23,42,.06)}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-voice.lhn-selected{background:rgba(255,255,255,.08)}
    #lhn-bilingual-reading-bar .lhn-br-vf{background:rgba(255,255,255,.6)}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-vf{background:rgba(255,255,255,.08)}
    #lhn-bilingual-reading-bar .lhn-br-vf.lhn-br-globe{background:rgba(255,255,255,.6);box-shadow:inset 0 0 0 1px rgba(15,23,42,.12)}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-vf.lhn-br-globe{background:rgba(255,255,255,.1);box-shadow:inset 0 0 0 1px rgba(255,255,255,.14)}
    #lhn-bilingual-reading-bar .lhn-br-spstep,#lhn-bilingual-reading-bar .lhn-br-spgrid button{background:rgba(15,23,42,.06)}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-spstep,#lhn-bilingual-reading-bar.lhn-dark .lhn-br-spgrid button{background:rgba(255,255,255,.08)}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-spgrid button{color:#e4e4e7}
    #lhn-bilingual-reading-bar .lhn-br-spgrid button.lhn-active{background:#7000ff;color:#fff}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-spgrid button.lhn-active{background:#facc15;color:#000}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-range::-webkit-slider-runnable-track{background:rgba(255,255,255,.18)}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-range::-moz-range-track{background:rgba(255,255,255,.18)}
    #lhn-bilingual-reading-bar .lhn-br-range::-webkit-slider-runnable-track{background:rgba(15,23,42,.12)}
    #lhn-bilingual-reading-bar .lhn-br-range::-moz-range-track{background:rgba(15,23,42,.12)}
  `;
  (document.head || document.documentElement).appendChild(style);
  const bar = document.createElement("div");
  bar.id = "lhn-bilingual-reading-bar"; bar.setAttribute("aria-live", "polite");
  bar.setAttribute("data-lhn-bilingual-ui", "true");
  const BR_ICON = {
    play:'<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>',
    pause:'<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>',
    auto:'<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2Q13 11 22 12Q13 13 12 22Q11 13 2 12Q11 11 12 2Z"/></svg>',
    close:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>'
  };
  const brTile = (key, icon, isSwitch = true) => `<button type="button" class="lhn-br-q" data-tile="${key}"${isSwitch ? ' role="switch" aria-checked="false"' : ""}><span class="lhn-br-ic">${icon}</span><span data-tile-label></span></button>`;
  const brStroke = paths => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
  bar.innerHTML = `<div class="lhn-br-rbar" data-rbar><div class="lhn-br-prog" data-prog><span class="lhn-br-fill" data-prog-fill><span class="lhn-br-knob"></span></span><span class="lhn-br-ptip" data-prog-tip></span></div>`
    + `<div class="lhn-br-left"><button type="button" class="lhn-br-btn" data-voices data-sheet="voices"><span class="lhn-br-vflag lhn-br-flagfont" data-bar-flag></span></button><button type="button" class="lhn-br-btn lhn-br-spd" data-speed data-sheet="speed"><span data-speed-label>1.00X</span></button><span class="lhn-br-btn lhn-br-mins" data-time role="note"></span></div>`
    + `<div class="lhn-br-center"><button type="button" class="lhn-br-btn" data-prev><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg></button><button type="button" class="lhn-br-btn lhn-br-play" data-play></button><button type="button" class="lhn-br-btn" data-next><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg></button></div>`
    + `<div class="lhn-br-right"><button type="button" class="lhn-br-btn lhn-br-rep" data-repeat aria-pressed="false">${brStroke('<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/><path d="M11 10h1v4"/>')}</button><button type="button" class="lhn-br-btn" data-close>${BR_ICON.close}</button><button type="button" class="lhn-br-btn" data-more data-sheet="more"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg></button></div></div>`
    + `<div class="lhn-br-kbd lhn-off" data-shortcut-banner><span data-banner-text></span><button type="button" data-hide-banner>×</button></div>`
    + `<div class="lhn-br-sheet" data-sheet-root><div class="lhn-br-scrim" data-scrim></div><div class="lhn-br-panel" data-panel role="dialog" aria-modal="true"><div class="lhn-br-grip"></div><div class="lhn-br-shead"><span class="lhn-br-stitle" data-sheet-title></span><span class="lhn-br-spval" data-speed-value hidden>1.00x</span><button type="button" class="lhn-br-sx" data-close-pop>${BR_ICON.close}</button></div><div class="lhn-br-sbody" data-sbody>`
    + `<div class="lhn-br-pane" data-pane="more"><div class="lhn-br-quick">`
    + brTile("autoscroll", brStroke('<path d="M3 2h18"/><rect width="18" height="12" x="3" y="6" rx="2"/><path d="M3 22h18"/>'))
    + brTile("parabtn", brStroke('<path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a10 10 0 0 1 0 14"/>'))
    + brTile("autolang", BR_ICON.auto)
    + brTile("readtranslation", brStroke('<path d="M2 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H2z"/><path d="M22 4h-7a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h8z"/>'))
    + brTile("theme", `<span class="lhn-br-icmoon">${brStroke('<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>')}</span><span class="lhn-br-icsun">${brStroke('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>')}</span>`, false)
    + brTile("webfont", brStroke('<path d="M12 4v16"/><path d="M4 7V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2"/><path d="M9 20h6"/>'))
    + `</div></div><div class="lhn-br-pane" data-pane="speed"><div class="lhn-br-sprow"><button type="button" class="lhn-br-spstep" data-sp="-1">-</button><input class="lhn-br-range" type="range" min="0.5" max="3" step="0.05" value="1"><button type="button" class="lhn-br-spstep" data-sp="1">+</button></div><div class="lhn-br-spgrid">`
    + [["0.5","0.5x"],["0.75","0.75x"],["0.9","0.9x"],["1.0",""],["1.1","1.1x"],["1.25","1.25x"],["1.5","1.5x"],["2.0","2.0x"]].map(([value, label]) => `<button type="button" data-preset="${value}"${label ? "" : ' class="lhn-br-normal"'}>${label}</button>`).join("")
    + `</div></div><div class="lhn-br-pane" data-pane="voices"><input class="lhn-br-vsearch" type="search"><div class="lhn-br-voice-list"></div></div></div></div></div><div class="lhn-br-toast" data-toast role="status"></div>`;
  const $br = selector => bar.querySelector(selector);
  const brRbar = $br("[data-rbar]"), brSheet = $br("[data-sheet-root]"), brPanel = $br("[data-panel]"), voiceSearch = $br(".lhn-br-vsearch");
  const brProg = $br("[data-prog]"), brProgFill = $br("[data-prog-fill]"), brProgTip = $br("[data-prog-tip]");
  const BR_WIDE_QUERY = window.matchMedia?.("(min-width: 1024px)"), BR_DESK_QUERY = window.matchMedia?.("(hover: hover) and (pointer: fine)");
  const isWideBar = () => !!BR_WIDE_QUERY?.matches, isDeskBar = () => !!BR_DESK_QUERY?.matches;
  let openSheetName = "", repeatSegment = false, shortcutBannerVisible = true, scrubbing = false, scrubFraction = 0, scrubWasPlaying = false, brToastTimer = 0, flagFontReady = false, flagFontRequested = false;
  const flagCanvasCache = new Map();
  // Focus ô tìm kiếm của Select voice trên mọi trình duyệt Chromium (Chrome, Edge, ...) và Firefox: thử lại vài lần vì có trình duyệt chưa nhận focus ngay sau khi sheet hiện
  function focusVoiceSearch() {
    const delays = [30, 100, 250, 500];
    const tryFocus = index => {
      if (openSheetName !== "voices") return;
      voiceSearch.focus({ preventScroll:true });
      if (voiceSearch.getRootNode().activeElement === voiceSearch || index >= delays.length) return;
      window.setTimeout(() => tryFocus(index + 1), delays[index]);
    };
    tryFocus(0);
  }
  // Giao diện rộng (≥1024px, gồm tablet ngang) = đảo nổi + popup trên nút; hẹp = thanh full-width + bottom sheet. Máy tính (chuột) thêm tooltip + bảng phím tắt.
  function syncBarLayout() {
    bar.classList.toggle("lhn-br-wide", isWideBar()); bar.classList.toggle("lhn-br-desk", isDeskBar());
    if (openSheetName) { brPanel.removeAttribute("style"); if (isWideBar()) anchorPanel(); }
    syncBarScale(); syncBanner(); syncSpacer();
  }
  // Màn hẹp hơn 392px (vd. 360px, 390px): thu nhỏ đều cả thanh theo đúng tỉ lệ thiết kế thay vì bớt khoảng cách, để các nút không đè lên nhau
  function syncBarScale() { const width = bar.clientWidth || innerWidth; brRbar.style.zoom = !isWideBar() && width && width < 392 ? String(Math.round(width / 392 * 1000) / 1000) : ""; }
  function anchorPanel() {
    const button = brRbar.querySelector(`[data-sheet="${openSheetName}"]`); if (!button) return;
    const rect = button.getBoundingClientRect(), barRect = brRbar.getBoundingClientRect(), top = barRect.top, W = bar.clientWidth || innerWidth, H = bar.clientHeight || innerHeight, w = brPanel.offsetWidth;
    // Giọng đọc/Tốc độ căn mép trái thanh Reader; ☰ vẫn căn giữa trên nút
    const left = openSheetName === "voices" || openSheetName === "speed" ? barRect.left : rect.left + rect.width / 2 - w / 2;
    brPanel.style.left = `${Math.max(12, Math.min(W - w - 12, left))}px`; brPanel.style.bottom = `${H - top + 14}px`;
    brPanel.style.top = "auto"; brPanel.style.right = "auto"; brPanel.style.transform = "none";
  }
  function openSheet(name) {
    openSheetName = name;
    bar.querySelectorAll("[data-pane]").forEach(pane => pane.classList.toggle("lhn-on", pane.dataset.pane === name));
    brPanel.classList.toggle("lhn-br-more", name === "more"); brPanel.classList.toggle("lhn-br-speedp", name === "speed");
    $br("[data-speed-value]").hidden = name !== "speed";
    $br("[data-sheet-title]").textContent = name === "voices" ? popupText("readerPopupSelectVoice") : name === "speed" ? popupText("readerPopupSpeed") : "";
    if (name === "voices") { voiceSearch.value = ""; renderVoiceChoices(); }
    if (name === "speed") renderSpeed(currentSegmentRate());
    brPanel.removeAttribute("style");
    brSheet.classList.add("lhn-open"); $br("[data-sbody]").scrollTop = 0;
    if (isWideBar()) anchorPanel();
    brRbar.querySelectorAll("[data-sheet]").forEach(button => button.classList.toggle("lhn-on", button.dataset.sheet === name));
    if (name === "voices" && isDeskBar()) focusVoiceSearch();
    syncBanner();
  }
  function closeSheet() {
    brSheet.classList.remove("lhn-open"); openSheetName = "";
    brRbar.querySelectorAll("[data-sheet].lhn-on").forEach(button => button.classList.remove("lhn-on"));
    syncBanner();
  }
  const closePopovers = closeSheet;
  function toggleSheet(name) { const wasOpen = openSheetName === name; closeSheet(); if (!wasOpen) openSheet(name); }
  function syncBanner() { $br("[data-shortcut-banner]").classList.toggle("lhn-off", !(isDeskBar() && shortcutBannerVisible && !openSheetName && !scrubbing)); }
  // Khoảng trống đáy cố định khi Reader mở để thanh luôn hiện mà không che chữ cuối trang
  function syncSpacer() {
    let spacer = document.getElementById("lhn-br-spacer");
    if (!bar.classList.contains("lhn-show") || !document.body) { spacer?.remove(); return; }
    if (!spacer) { spacer = document.createElement("div"); spacer.id = "lhn-br-spacer"; spacer.setAttribute("aria-hidden", "true"); spacer.setAttribute("data-lhn-bilingual-ui", "true"); }
    if (spacer.parentNode !== document.body) document.body.appendChild(spacer);
    spacer.style.setProperty("height", `${isDeskBar() && shortcutBannerVisible ? 150 : isWideBar() ? 106 : 100}px`, "important");
  }
  function showBarToast(text) {
    const toast = $br("[data-toast]"); toast.textContent = text; toast.classList.add("lhn-on");
    clearTimeout(brToastTimer); brToastTimer = setTimeout(() => toast.classList.remove("lhn-on"), 1700);
  }
  // Cờ: vẽ lên canvas, đo vùng có màu thật rồi cắt sát mép để cờ cao đúng bằng vòng tròn và căn giữa tuyệt đối. Font chưa tải được thì dùng ký tự cờ.
  function flagCanvasFor(region) {
    if (flagCanvasCache.has(region)) return flagCanvasCache.get(region);
    let result = null;
    try {
      const N = 220, source = document.createElement("canvas"); source.width = source.height = N;
      const context = source.getContext("2d", { willReadFrequently:true });
      context.font = '160px "Twemoji Country Flags"'; context.textAlign = "center"; context.textBaseline = "middle";
      context.fillText(flagEmojiForRegion(region), N / 2, N / 2);
      const data = context.getImageData(0, 0, N, N).data; let x0 = N, y0 = N, x1 = -1, y1 = -1;
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (data[(y * N + x) * 4 + 3] > 200) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      if (x1 - x0 >= 20 && y1 - y0 >= 20) {
        x0 += 1; y0 += 1; x1 -= 1; y1 -= 1;
        const bw = x1 - x0 + 1, bh = y1 - y0 + 1, H = 96, output = document.createElement("canvas");
        output.height = H; output.width = Math.round(H * bw / bh);
        const out = output.getContext("2d"); out.imageSmoothingQuality = "high"; out.drawImage(source, x0, y0, bw, bh, 0, 0, output.width, H);
        result = output;
      }
    } catch {}
    flagCanvasCache.set(region, result);
    return result;
  }
  function renderFlag(container, region) {
    const key = String(region || "").toUpperCase(), state = `${key}|${flagFontReady}`;
    if (!container || container.dataset.flagState === state) return;
    container.dataset.flagState = state;
    const source = flagFontReady ? flagCanvasFor(key) : null;
    if (source) {
      const canvas = document.createElement("canvas"); canvas.width = source.width; canvas.height = source.height; canvas.className = "lhn-br-fimg"; canvas.setAttribute("aria-hidden", "true");
      canvas.getContext("2d")?.drawImage(source, 0, 0); container.replaceChildren(canvas);
    } else { const span = document.createElement("span"); span.textContent = flagEmojiForRegion(key); container.replaceChildren(span); }
  }
  async function prepareFlagFont() {
    try { await document.fonts.load('160px "Twemoji Country Flags"', "🇺🇸"); } catch {}
    try { flagFontReady = [...document.fonts].some(face => face.family.replace(/["']/g, "") === "Twemoji Country Flags" && face.status === "loaded"); } catch { flagFontReady = false; }
    if (!flagFontReady) return;
    syncToolbar(); if (openSheetName === "voices") renderVoiceChoices();
  }
  const countWords = text => String(text || "").split(/\s+/).filter(Boolean).length;
  // Số phút/giờ theo chuẩn tiếng Anh cho mọi ngôn ngữ: dưới 60 phút "45M"; từ 60 phút là giờ thập phân tối đa 2 số lẻ "1H", "1.5H", "3.13H"
  const formatLeft = minutes => minutes < 60 ? `${minutes}M` : `${Math.round(minutes / 60 * 100) / 100}H`;
  function minutesLeftFrom(index) {
    let words = 0;
    for (let i = Math.max(0, index); i < queue.length; i++) {
      const block = queue[i]; if (!block) continue;
      words += countWords(rawText(block, true));
      if (settings.readTranslation) words += countWords(block.querySelector(":scope > .lhn-bilingual-card")?.textContent);
    }
    return words ? Math.max(1, Math.ceil(words / (220 * currentSegmentRate()))) : 0;
  }
  function updateProgress() {
    if (scrubbing) return;
    const total = queue.length, fraction = currentReadText ? Math.min(1, currentReadCharIndex / currentReadText.length) : 0;
    const value = !total ? 0 : reading ? (Math.min(queueIndex, total) + fraction) / total : queueIndex >= total ? 1 : 0;
    brProgFill.style.width = `${Math.min(100, value * 100)}%`;
  }
  function shortcutLabel(key, fallback) {
    const value = String(dashboardShortcuts[key] ?? fallback);
    return ({ Up:"↑", Down:"↓", Left:"←", Right:"→" })[value] || value;
  }
  function setTile(key, on) { const tile = $br(`[data-tile="${key}"]`); if (!tile) return; tile.classList.toggle("lhn-on", on); tile.setAttribute("aria-checked", String(on)); }
  function markReadingBlock(block) {
    document.querySelectorAll(".lhn-bilingual-reading").forEach(el => el.classList.remove("lhn-bilingual-reading"));
    document.querySelectorAll('.lhn-bilingual-speaker[data-visibility="reading"]').forEach(el => el.removeAttribute("data-reading"));
    block.classList.add("lhn-bilingual-reading"); block.querySelector(":scope > .lhn-bilingual-speaker")?.setAttribute("data-reading", "true");
    if (settings.autoScroll) block.scrollIntoView({ behavior:"smooth", block:"center" });
  }
  // Kéo thanh tiến độ: tạm dừng, xem đoạn đích, thả tay thì nhảy tới đoạn đó và đọc tiếp nếu trước đó đang đọc
  function jumpToBlock(index, resume) {
    if (!queue.length) return;
    const target = Math.max(0, Math.min(queue.length - 1, index));
    if (!reading) { startReading(queue[target]); return; }
    speechDetectionRequest++; utterance = null; resumeText = ""; readingSegment = null; lastAppliedSegmentRate = null; cancelGoogle();
    queueIndex = target;
    if (resume) { readingPaused = false; syncPauseShortcutState(); syncToolbar(); speakAfterCancel(); return; }
    currentReadText = ""; currentReadCharIndex = 0;
    markReadingBlock(queue[target]); syncToolbar();
  }
  function advanceQueue() { if (!repeatSegment) queueIndex++; speakNext(); }
  const scrubIndex = () => Math.min(queue.length - 1, Math.floor(scrubFraction * queue.length));
  function moveScrub(event) {
    const rect = brProg.getBoundingClientRect();
    scrubFraction = Math.max(0, Math.min(1, (event.clientX - rect.left) / (rect.width || 1)));
    brProgFill.style.width = `${scrubFraction * 100}%`;
    if (!queue.length) return;
    const index = scrubIndex(), small = document.createElement("small");
    small.textContent = rawText(queue[index], true).trim();
    brProgTip.replaceChildren(document.createTextNode(popupText("readerScrubTip", { i:index + 1, n:queue.length, time:formatLeft(minutesLeftFrom(index)) })), small);
    const tipWidth = brProgTip.offsetWidth, width = brProg.offsetWidth;
    brProgTip.style.left = `${Math.max(tipWidth / 2, Math.min(width - tipWidth / 2, scrubFraction * width))}px`;
  }
  brProg.addEventListener("pointerdown", event => {
    if (event.button > 0 || !queue.length) return;
    event.preventDefault(); event.stopPropagation(); brProg.setPointerCapture?.(event.pointerId);
    scrubWasPlaying = reading && !readingPaused;
    if (scrubWasPlaying) document.dispatchEvent(new CustomEvent("lhn-bilingual-reader-pause", { detail:true, cancelable:true }));
    scrubbing = true; brProg.classList.add("lhn-drag"); brRbar.classList.add("lhn-scrubbing"); moveScrub(event); syncBanner();
  });
  brProg.addEventListener("pointermove", event => { if (scrubbing) moveScrub(event); });
  const endScrub = () => { if (!scrubbing) return; scrubbing = false; brProg.classList.remove("lhn-drag"); brRbar.classList.remove("lhn-scrubbing"); syncBanner(); jumpToBlock(scrubIndex(), scrubWasPlaying); updateProgress(); };
  brProg.addEventListener("pointerup", endScrub); brProg.addEventListener("pointercancel", endScrub);
  const animatePlayButton = () => { const button = $br("[data-play]"); button.classList.remove("lhn-br-key-press"); void button.offsetWidth; button.classList.add("lhn-br-key-press"); window.setTimeout(() => button.classList.remove("lhn-br-key-press"), 190); };
  brRbar.addEventListener("click", event => {
    const button = event.target.closest("button"); if (!button || !brRbar.contains(button)) return;
    if (button.hasAttribute("data-play")) { if (!reading) { animatePlayButton(); startReading(); } else document.dispatchEvent(new CustomEvent("lhn-bilingual-reader-pause", { detail:!readingPaused, cancelable:true })); }
    else if (button.hasAttribute("data-prev")) moveReading(-1, event);
    else if (button.hasAttribute("data-next")) moveReading(1, event);
    else if (button.hasAttribute("data-close")) closeReadingBar();
    else if (button.hasAttribute("data-repeat")) { repeatSegment = !repeatSegment; syncToolbar(); showBarToast(popupText(repeatSegment ? "readerRepeatOn" : "readerRepeatOff")); }
    // v3.5.160 touch: Reader ☰ opens the Keepit main sheet (its Trình đọc row holds these tiles; theme / Font tùy chỉnh are there too)
    else if (button.dataset.sheet === "more" && globalThis.LHN_BAR_HOOKS?.openMainSheet) { closeSheet(); globalThis.LHN_BAR_HOOKS.openMainSheet(button.getBoundingClientRect()); }   // v3.5.161 every device
    else if (button.dataset.sheet) toggleSheet(button.dataset.sheet);
  });
  $br("[data-scrim]").addEventListener("click", closeSheet);
  $br("[data-close-pop]").addEventListener("click", closeSheet);
  // v3.5.161: same sheet behaviour as every Keepit sheet (js/shared/sheet-kit.js): page locked while open, drag down from
  // anywhere closes (the voice list scrolls back to its top first), wheel / scroll keys never reach the page
  globalThis.LHN_SHEET?.attach(brPanel, { isOpen:() => brSheet.classList.contains("lhn-open"), close:() => closeSheet(), watch:brSheet });
  $br(".lhn-br-quick").addEventListener("click", event => {
    const tile = event.target.closest("[data-tile]"); if (!tile) return;
    const key = tile.dataset.tile;
    if (key === "theme") { saveAddonThemePreference(bar.classList.contains("lhn-dark") ? "light" : "dark"); return; }
    setReaderTile(key, tile.getAttribute("aria-checked") !== "true");
  });
  function readerTileOn(key) {
    if (key === "autoscroll") return !!settings.autoScroll;
    if (key === "parabtn") return settings.speakerIconVisibility === "always";
    if (key === "autolang") return settings.autoDetectVoice !== false;
    if (key === "readtranslation") return !!settings.readTranslation;
    if (key === "webfont") return settings.webFontFamily === "'Inter', sans-serif";
    return false;
  }
  function setReaderTile(key, on) {
    if (key === "autoscroll") saveSpeechSetting({ autoScroll:on });
    else if (key === "parabtn") saveSpeechSetting({ speakerIconVisibility:on ? "always" : "hover" });
    else if (key === "autolang") saveSpeechSetting({ autoDetectVoice:on });
    else if (key === "readtranslation") { saveSpeechSetting({ readTranslation:on }); if (on) notifyReadTranslationOn(); else skipBilingualSegment(); }
    else if (key === "webfont") saveWebsiteFont(on);
    syncToolbar();
  }
  $br('[data-pane="speed"]').addEventListener("click", event => {
    const step = event.target.closest("[data-sp]");
    if (step) { setSpeechSpeed(Math.round((currentSegmentRate() + .05 * Number(step.dataset.sp)) / .05) * .05); return; }
    const preset = event.target.closest("[data-preset]");
    if (preset) setSpeechSpeed(Number(preset.dataset.preset));
  });
  $br(".lhn-br-range").addEventListener("input", event => setSpeechSpeed(Number(event.target.value)));
  $br("[data-hide-banner]").addEventListener("click", () => { shortcutBannerVisible = false; syncBanner(); syncSpacer(); showBarToast(popupText("readerBannerHidden")); });
  const debouncedRenderVoiceChoices = LHN_INDEX_SEARCH.debounce(() => {
    if (LHN_INDEX_SEARCH.normalize(voiceSearch.value) === lastVoiceQuery) return;
    renderVoiceChoices();
  }, 200);
  voiceSearch.addEventListener("input", debouncedRenderVoiceChoices);
  const voiceItems = () => Array.from(bar.querySelectorAll(".lhn-br-voice-list .lhn-br-voice"));
  function setVoiceKb(index) {
    const items = voiceItems(); items.forEach(item => item.classList.remove("lhn-kb-active"));
    if (!items.length) { voiceKbIndex = -1; return; }
    voiceKbIndex = Math.max(0, Math.min(items.length - 1, index));
    items[voiceKbIndex].classList.add("lhn-kb-active"); items[voiceKbIndex].scrollIntoView({ block:"nearest" });
  }
  window.addEventListener("keydown", event => {
    if (event.key === "Escape" && openSheetName && bar.classList.contains("lhn-show")) { event.preventDefault(); event.stopImmediatePropagation(); closeSheet(); return; }
    const voiceShortcut = String(dashboardShortcuts.selectVoiceShortcut ?? "Alt+L").toLowerCase();
    if (openSheetName === "voices" && event.target === voiceSearch && voiceShortcut && !event.isComposing && String(globalThis.LHN_SHORTCUTS?.fromEvent?.(event) || "").toLowerCase() === voiceShortcut) { event.preventDefault(); event.stopImmediatePropagation(); closeSheet(); return; }
    if (event.isComposing || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || openSheetName !== "voices") return;
    const editableInPath = (event.composedPath?.() || []).some(node => node?.matches?.("input,textarea,select,[contenteditable]:not([contenteditable='false'])"));
    if (!bar.contains(event.target) && (event.target?.closest?.("input,textarea,select,[contenteditable]:not([contenteditable='false'])") || editableInPath)) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault(); event.stopImmediatePropagation();
      const items = voiceItems(); if (!items.length) return;
      const from = voiceKbIndex >= 0 ? voiceKbIndex : items.findIndex(item => item.classList.contains("lhn-selected"));
      setVoiceKb(from + (event.key === "ArrowDown" ? 1 : -1));
    } else if (event.key === "Enter" && voiceKbIndex >= 0) {
      const item = voiceItems()[voiceKbIndex]; if (!item) return;
      event.preventDefault(); event.stopImmediatePropagation(); voiceKbIndex = -1; item.click();
    }
  }, true);
  BR_WIDE_QUERY?.addEventListener?.("change", syncBarLayout); BR_DESK_QUERY?.addEventListener?.("change", syncBarLayout);
  window.addEventListener("resize", () => { syncBarScale(); if (openSheetName && isWideBar()) anchorPanel(); }, { passive:true });
  (document.body || document.documentElement).appendChild(bar);
  syncBarLayout();
  function saveSpeechSetting(patch) { settings = { ...settings, ...patch }; browser.storage.local.get(SETTINGS_KEY).then(data => browser.storage.local.set({ [SETTINGS_KEY]:{ ...DEFAULTS, ...(data[SETTINGS_KEY] || {}), ...patch } })).catch(() => {}); }
  // Chọn voice: đổi cờ ngay (kể cả lúc pause), bỏ ngôn ngữ của đoạn đang đọc cũ; sau khi lưu xong cờ tự theo cài đặt mới
  function previewVoiceFlag(lang) { readingSegment = null; voiceFlagOverride = lang || ""; syncToolbar(); }
  function autoFlagLang() { return activeSpeechLang || queue[queueIndex]?.closest("[lang]")?.getAttribute("lang") || document.documentElement.lang || navigator.language || ""; }
  async function saveReaderVoiceSettings(voiceMode, browserVoiceURI = "", readLanguage = "") {
    const next = await LHN_TTS.setVoiceSettings(voiceMode, browserVoiceURI, readLanguage).catch(error => { voiceFlagOverride = ""; syncToolbar(); throw error; });
    settings = { ...settings, ...next };
    selectedVoice = systemVoices.find(voice => voice.voiceURI === settings.browserVoiceURI) || null;
    activeVoice = selectedVoice; voiceFlagOverride = "";
    syncToolbar();
  }
  function saveWebsiteFont(enabled) {
    const webFontFamily = enabled ? "'Inter', sans-serif" : "";
    settings = { ...settings, webFontFamily };
    browser.storage.local.get(SETTINGS_KEY).then(data => browser.storage.local.set({
      [SETTINGS_KEY]:{ ...DEFAULTS, ...(data[SETTINGS_KEY] || {}), webFontFamily },
      lhnCustomFontSettings:{ customFontEnabled:enabled, fontKey:enabled ? "inter" : "auto" }
    })).catch(() => {});
  }
  function saveAddonThemePreference(theme) {
    addonThemePreference = theme;
    syncToolbar();
    browser.storage.local.get(DISPLAY_SETTINGS_KEY).then(data => browser.storage.local.set({ [DISPLAY_SETTINGS_KEY]:{ ...(data[DISPLAY_SETTINGS_KEY] || {}), sidebarTheme:theme } })).catch(error => console.warn("Could not save shared theme", error));
  }
  function syncToolbar() {
    const playing = reading && !readingPaused, play = $br("[data-play]");
    if (play.dataset.state !== String(playing)) { play.dataset.state = String(playing); play.innerHTML = playing ? BR_ICON.pause : BR_ICON.play; }
    const playLabel = popupText(playing ? "readerPopupPause" : "readerPopupPlay"), pauseKey = shortcutLabel("speechPauseShortcut", "Space");
    play.setAttribute("aria-label", playLabel); play.dataset.tip = pauseKey ? `${playLabel} (${pauseKey})` : playLabel;
    const rate = currentSegmentRate();
    $br("[data-speed-label]").textContent = `${Number(rate).toFixed(2)}X`;
    if (openSheetName === "speed") renderSpeed(rate);
    const minutes = minutesLeftFrom(reading ? queueIndex : 0);
    $br("[data-time]").textContent = minutes ? formatLeft(minutes) : "—";
    const repeat = $br("[data-repeat]"); repeat.classList.toggle("lhn-on", repeatSegment); repeat.setAttribute("aria-pressed", String(repeatSegment));
    updateProgress();
    setTile("autoscroll", !!settings.autoScroll);
    setTile("parabtn", settings.speakerIconVisibility === "always");
    setTile("autolang", settings.autoDetectVoice !== false);
    setTile("readtranslation", !!settings.readTranslation);
    setTile("webfont", settings.webFontFamily === "'Inter', sans-serif");
    const lang = voiceFlagOverride || readingSegment?.lang || (settings.voiceMode !== "browser" && settings.readLanguage ? LHN_TTS.normalizeLanguage(settings.readLanguage) : "") || selectedVoice?.lang || activeVoice?.lang || activeSpeechLang || queue[queueIndex]?.closest("[lang]")?.getAttribute("lang") || document.documentElement.lang || navigator.language || "";
    const parts = lang.split(/[-_]/), base = parts[0]?.toLowerCase(), region = parts.slice(1).find(part => /^[a-z]{2}$|^\d{3}$/i.test(part))?.toUpperCase() || ({ en:"US", vi:"VN", ko:"KR", ja:"JP", zh:"CN", fr:"FR", de:"DE", es:"ES", it:"IT", pt:"BR", ru:"RU", ar:"SA", hi:"IN", th:"TH" })[base];
    renderFlag($br("[data-bar-flag]"), region);
    const isDark = addonThemePreference === "dark" || (addonThemePreference !== "light" && !!window.matchMedia?.("(prefers-color-scheme: dark)").matches);
    bar.classList.toggle("lhn-dark", isDark);
  }
  function syncPauseShortcutState() { document.dispatchEvent(new CustomEvent("lhn-bilingual-reader-pause-state", { detail:readingPaused })); }
  function popupText(key, vars = {}) { return globalThis.LHN_LANGUAGES?.t?.(key, vars, displayLang) || key; }
  function renderPopupText() {
    const tip = (selector, key, shortcut = "") => { const element = $br(selector); if (!element) return; const label = popupText(key); element.setAttribute("aria-label", label); element.dataset.tip = shortcut ? `${label} (${shortcut})` : label; };
    const up = shortcutLabel("increaseReadingSpeedShortcut", "Up"), down = shortcutLabel("decreaseReadingSpeedShortcut", "Down"), left = shortcutLabel("previousReadingShortcut", "Left"), right = shortcutLabel("nextReadingShortcut", "Right"), voiceKey = shortcutLabel("selectVoiceShortcut", "Alt+L"), pauseKey = shortcutLabel("speechPauseShortcut", "Space");
    tip("[data-voices]", "readerPopupSelectVoice", voiceKey);
    tip("[data-speed]", "readerSpeedShort", up && down ? `${up} / ${down}` : up || down);
    tip("[data-time]", "readerRemainingTime");
    tip("[data-prev]", "readerPopupPrevious", left);
    tip("[data-next]", "readerPopupNext", right);
    tip("[data-repeat]", "readerRepeatSegment");
    tip("[data-close]", "readerPopupStop", "Alt+R");
    tip("[data-more]", "readerMore");
    for (const [key, label] of [["autoscroll","readerPopupAutoScroll"],["parabtn","bilingualSpeakerIcon"],["autolang","readerTileAutoLang"],["readtranslation","readerTileReadTranslation"],["theme","readerTileTheme"],["webfont","readerTileCustomFont"]]) {
      const element = $br(`[data-tile="${key}"] [data-tile-label]`); if (element) element.textContent = popupText(label);
    }
    $br('[data-preset="1.0"]').textContent = popupText("videoNormal");
    voiceSearch.placeholder = popupText("readerPopupSearch"); voiceSearch.setAttribute("aria-label", popupText("readerPopupSearch"));
    $br(".lhn-br-range").setAttribute("aria-label", popupText("readerPopupSpeed"));
    $br("[data-close-pop]").setAttribute("aria-label", popupText("readerPopupClose"));
    const hide = $br("[data-hide-banner]"); hide.setAttribute("aria-label", popupText("readerHideBanner")); hide.title = popupText("readerHideBanner");
    const banner = $br("[data-banner-text]"); banner.replaceChildren();
    [[[pauseKey], "readerPopupPause"], [[up, down], "readerSpeedShort"], [[left, right], "readerBannerPrevNext"], [[voiceKey], "readerBannerVoice"], [["Alt+R"], "readerPopupClose"]].forEach(([keys, label], index) => {
      if (index) { const sep = document.createElement("span"); sep.className = "lhn-br-sep"; sep.textContent = "·"; banner.appendChild(sep); }
      const item = document.createElement("span");
      keys.forEach(value => { const kbd = document.createElement("kbd"); kbd.textContent = value || "Off"; item.appendChild(kbd); });
      item.appendChild(document.createTextNode(popupText(label))); banner.appendChild(item);
    });
    if (openSheetName === "voices") { $br("[data-sheet-title]").textContent = popupText("readerPopupSelectVoice"); renderVoiceChoices(); }
    if (openSheetName === "speed") $br("[data-sheet-title]").textContent = popupText("readerPopupSpeed");
  }
  renderPopupText();
  var voiceSearchCache = { signature: "", lang: "", index: null };
  var lastVoiceQuery = "";
  function getVoiceIndex() {
    const signature = systemVoices.map(v => v.voiceURI).join("|");
    if (voiceSearchCache.index && voiceSearchCache.signature === signature && voiceSearchCache.lang === displayLang) return voiceSearchCache.index;
    let regionNames = null, langNames = null, regionEn = null, langEn = null;
    try { regionNames = new Intl.DisplayNames([displayLang], { type:"region" }); langNames = new Intl.DisplayNames([displayLang], { type:"language" }); } catch {}
    try { regionEn = new Intl.DisplayNames(["en"], { type:"region" }); langEn = new Intl.DisplayNames(["en"], { type:"language" }); } catch {}
    const safeName = (dn, code) => { try { return dn && code ? (dn.of(code) || "") : ""; } catch { return ""; } };
    const index = LHN_INDEX_SEARCH.createIndex(systemVoices, (voice) => {
      const parts = (voice.lang || "").split(/[-_]/);
      const baseLang = (parts[0] || "").toLowerCase(), region = (parts[1] || "").toUpperCase();
      const shortName = (voice.name || "").replace(/^Microsoft\s+/, "").replace(/\s*Online\s*\(Natural\)/i, "").replace(/\s*\(Browser\)\s*$/i, "").split(" - ")[0].trim() || voice.name || "";
      return [voice.name, voice.lang, region, baseLang, shortName, safeName(regionNames, region), safeName(langNames, baseLang), safeName(regionEn, region), safeName(langEn, baseLang)];
    }, (voice) => voice.voiceURI);
    voiceSearchCache = { signature, lang: displayLang, index };
    return index;
  }
  function renderVoiceChoices() {
    voiceKbIndex = -1;
    lastVoiceQuery = LHN_INDEX_SEARCH.normalize(voiceSearch.value);
    systemVoices = synth?.getVoices?.() || systemVoices;
    const query = voiceSearch.value.trim().toLocaleLowerCase();
    const list = $br(".lhn-br-voice-list"); list.replaceChildren();
    const plainQuery = plainText(query);
    const escVoiceHtml = (text) => String(text).replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
    const check = selected => selected ? '<span class="lhn-br-ck">✓</span>' : "";
    const autoMatches = !query || "auto auto-detect language".includes(query) || plainText(popupText("readerVoiceAuto")).includes(plainQuery);
    if (autoMatches) {
      const autoSelected = settings.voiceMode !== "browser" && !settings.readLanguage;
      const auto = document.createElement("button"); auto.type="button"; auto.className=`lhn-br-voice${autoSelected ? " lhn-selected" : ""}`;
      auto.innerHTML=`<span class="lhn-br-vf lhn-br-globe">${BR_ICON.auto}</span><span class="lhn-br-vt"><b>${escVoiceHtml(popupText("readerVoiceAuto"))}</b><small>${escVoiceHtml(popupText("readerPopupAutoDescription"))}</small></span>${check(autoSelected)}`;
      auto.addEventListener("click", () => { selectedVoice = null; activeVoice = null; previewVoiceFlag(autoFlagLang()); void saveReaderVoiceSettings("google", ""); closePopovers(); }); list.appendChild(auto);
    }
    const groupHeading = key => { const heading = document.createElement("div"); heading.className = "lhn-br-voice-group"; heading.setAttribute("role", "presentation"); heading.textContent = popupText(key); list.appendChild(heading); };
    let languageGroupShown = false, browserGroupShown = false;
    READ_LANGUAGE_CODES.forEach(code => {
      const region = readLanguageRegion(code), tag = LHN_TTS.normalizeLanguage(code);
      const country = region ? (() => { try { return new Intl.DisplayNames([displayLang], { type:"region" }).of(region) || ""; } catch { return ""; } })() : "";
      const name = readLanguageName(code), english = languageLabel(code, "en"), native = languageLabel(code, code);
      if (plainQuery && !plainText(`${name} ${english} ${native} ${country} ${code} ${tag}`).includes(plainQuery)) return;
      if (!languageGroupShown) { languageGroupShown = true; groupHeading("readerPopupGroupLanguages"); }
      const isSelected = settings.voiceMode !== "browser" && settings.readLanguage === code;
      const button = document.createElement("button"); button.type="button"; button.className=`lhn-br-voice${isSelected ? " lhn-selected" : ""}`;
      button.innerHTML=`<span class="lhn-br-vf lhn-br-flagfont"></span><span class="lhn-br-vt"><b>${escVoiceHtml(name)}</b><small>${native !== name ? escVoiceHtml(native) + " · " : ""}${tag}</small></span>${check(isSelected)}`;
      renderFlag(button.firstElementChild, region);
      button.addEventListener("click", () => { selectedVoice = null; activeVoice = null; previewVoiceFlag(LHN_TTS.normalizeLanguage(code)); void saveReaderVoiceSettings("google", "", code); closePopovers(); }); list.appendChild(button);
    });
    const flagMissLogged = new Set(); // debug: log một lần cho mỗi vùng thiếu cờ
    let voiceRegionNames = null, voiceLangNames = null;
    try { voiceRegionNames = new Intl.DisplayNames([displayLang], { type:"region" }); voiceLangNames = new Intl.DisplayNames([displayLang], { type:"language" }); } catch {}
    LHN_INDEX_SEARCH.search(getVoiceIndex(), query).forEach(voice => {
      const region = voice.lang?.split(/[-_]/)[1]?.toUpperCase();
      if (region && !FLAG_REGION_KEYS[region] && !flagMissLogged.has(region)) { flagMissLogged.add(region); console.info('[Keepit] Giọng chưa có cờ:', region, '|', voice.name, '|', voice.lang); }
      if (!browserGroupShown) { browserGroupShown = true; groupHeading("readerPopupGroupBrowserVoices"); }
      const isSelected=settings.voiceMode === "browser" && settings.browserVoiceURI === voice.voiceURI;
      const button = document.createElement("button"); button.type="button"; button.className=`lhn-br-voice${isSelected ? " lhn-selected" : ""}`;
      const baseLang = (voice.lang || "").split(/[-_]/)[0].toLowerCase();
      let langLabel = baseLang; try { langLabel = voiceLangNames?.of(baseLang) || baseLang; } catch {}
      let countryLabel = region || langLabel; try { if (region) countryLabel = voiceRegionNames?.of(region) || region; } catch {}
      const shortVoice = (voice.name || "").replace(/^Microsoft\s+/, "").replace(/\s*Online\s*\(Natural\)/i, "").replace(/\s*\(Browser\)\s*$/i, "").split(" - ")[0].trim() || voice.name;
      button.innerHTML = `<span class="lhn-br-vf lhn-br-flagfont"></span><span class="lhn-br-vt"><b>${escVoiceHtml(countryLabel)}</b><small>${escVoiceHtml(shortVoice)} · ${escVoiceHtml(langLabel)}</small></span>${check(isSelected)}`;
      renderFlag(button.firstElementChild, region);
      button.title = `${voice.name} · ${voice.lang}`;
      button.addEventListener("click",()=>{ selectedVoice=voice; activeVoice=voice; previewVoiceFlag(voice.lang); void saveReaderVoiceSettings("browser", voice.voiceURI); closePopovers(); }); list.appendChild(button);
    });
    if (!list.childElementCount) list.textContent=popupText("readerPopupNoVoices");
  }
  function speakAfterCancel(text) {
    window.setTimeout(() => { if (reading && !readingPaused) { synth?.resume(); speakNext(text); } }, 120);
  }
  function restartCurrentSpeech() {
    if (!reading || readingPaused || !currentReadText) return;
    const remainder=currentReadText.slice(Math.max(0,Math.min(currentReadCharIndex,currentReadText.length)));
    utterance=null; cancelGoogle(); speakAfterCancel(remainder);
  }
  function normalizeSpeedStep(value) { const step = Number(value); return Number.isFinite(step) && step > 0 ? Math.max(0.01, Math.min(2.5, Math.round(step * 100) / 100)) : DEFAULTS.speechSpeedStep; }
  function clampSpeechRate(value) { const rate = Number(value); return Number.isFinite(rate) ? Math.max(.5, Math.min(3, Math.round(rate * 100) / 100)) : null; }
  // Luật tốc độ:
  // - "Custom rate for display language" bật: đoạn đọc thuộc ngôn ngữ hiển thị dùng "Your speed",
  //   đoạn thuộc ngôn ngữ khác dùng "Global speech rate".
  // - Tắt: mọi đoạn dùng "Global speech rate".
  function normalizeSpeechLang(value) { return String(value || "").trim().toLowerCase().replace(/_/g, "-").split("-")[0]; }
  function isDisplaySpeechLang(lang) { const target = normalizeSpeechLang(lang); return Boolean(target) && target === normalizeSpeechLang(displayLang); }
  function activeSegmentLang() { return (reading || readingPaused) ? (readingSegment?.lang || activeSpeechLang || "") : ""; }
  function segmentRate(lang) {
    if (dashboardShortcuts?.useLanguageSpeechRate !== true || !isDisplaySpeechLang(lang)) return baseRate();
    const custom = Number(dashboardShortcuts?.speechRateByLanguage?.[displayLang]);
    if (Number.isFinite(custom)) return clampSpeechRate(custom) ?? 1.25;
    const inherited = Number(dashboardShortcuts?.inheritedSpeechRateByLanguage?.[displayLang]);
    if (Number.isFinite(inherited)) return clampSpeechRate(inherited) ?? 1.25;
    return clampSpeechRate(Number(globalThis.LHN_CONFIG?.DEFAULT_SETTINGS?.speechRateByLanguage?.[displayLang])) ?? 1.25;
  }
  function currentSegmentRate() { return segmentRate(activeSegmentLang()); }
  function editingLanguageRate(lang = activeSegmentLang()) { return dashboardShortcuts?.useLanguageSpeechRate === true && isDisplaySpeechLang(lang); }
  function writeLanguageSpeechRate(rate) {
    const patch = {
      speechRateByLanguage:{ ...(dashboardShortcuts.speechRateByLanguage || {}), [displayLang]:rate },
      hasCustomSpeechRateByLanguage:{ ...(dashboardShortcuts.hasCustomSpeechRateByLanguage || {}), [displayLang]:true },
      inheritedSpeechRateByLanguage:{ ...(dashboardShortcuts.inheritedSpeechRateByLanguage || {}) }
    };
    delete patch.inheritedSpeechRateByLanguage[displayLang];
    dashboardShortcuts = { ...dashboardShortcuts, ...patch, inheritedSpeechRateByLanguage:patch.inheritedSpeechRateByLanguage };
    browser.storage.local.get(DISPLAY_SETTINGS_KEY).then(data => browser.storage.local.set({ [DISPLAY_SETTINGS_KEY]:{ ...(data[DISPLAY_SETTINGS_KEY] || {}), ...patch } })).catch(() => {});
  }
  function writeSharedSpeechRate(rate) {
    dashboardShortcuts = { ...dashboardShortcuts, speechRate:rate };
    browser.storage.local.get(DISPLAY_SETTINGS_KEY).then(data => browser.storage.local.set({ [DISPLAY_SETTINGS_KEY]:{ ...(data[DISPLAY_SETTINGS_KEY] || {}), speechRate:rate } })).catch(() => {});
  }
  function renderSpeed(rate) { const value = Number(rate) || 1; $br(".lhn-br-range").value = value; $br("[data-speed-value]").textContent = `${value.toFixed(2)}x`; bar.querySelectorAll("[data-preset]").forEach(button => button.classList.toggle("lhn-active", Math.abs(Number(button.dataset.preset) - value) < 0.001)); }
  function baseRate() { const shared = clampSpeechRate(dashboardShortcuts?.speechRate); return shared === null ? 1 : shared; }
  function applySharedSpeechRate() {
    const rate = currentSegmentRate();
    if (rate === lastAppliedSegmentRate) { syncToolbar(); return; }
    lastAppliedSegmentRate = rate;
    renderSpeed(rate);
    if (googleToken) { if (googleAudio) googleAudio.playbackRate = rate; } else if (reading && !readingPaused) restartCurrentSpeech();
    syncToolbar();
  }
  function setSpeechSpeed(value, lang = activeSegmentLang()) {
    const rate = clampSpeechRate(value);
    if (rate === null) return null;
    if (editingLanguageRate(lang)) writeLanguageSpeechRate(rate);
    else writeSharedSpeechRate(rate);
    lastAppliedSegmentRate = rate; renderSpeed(rate); syncToolbar();
    if (googleToken) { if (googleAudio) googleAudio.playbackRate = rate; } else if (reading&&!readingPaused) restartCurrentSpeech();
    return rate;
  }
  synth?.addEventListener?.("voiceschanged",()=>{systemVoices=synth.getVoices(); selectedVoice=systemVoices.find(voice=>voice.voiceURI===settings.browserVoiceURI)||selectedVoice; syncToolbar(); if(openSheetName === "voices") renderVoiceChoices();});
  function applySettings(next) {
    const wasReaderActive = settings.enableTTS && !isReaderDisabledOnThisWebsite();
    settings = { ...DEFAULTS, ...(next || {}) };
    settings.speechSpeedStep = normalizeSpeedStep(settings.speechSpeedStep);
    if (!["always", "hover", "reading"].includes(settings.speakerIconVisibility)) settings.speakerIconVisibility = "hover";
    settings.translationFontScale = Math.min(150, Math.max(50, Number(settings.translationFontScale) || DEFAULTS.translationFontScale));
    if (!/^#[0-9a-f]{6}$/i.test(settings.accentColor)) settings.accentColor = DEFAULTS.accentColor;
    document.documentElement.style.setProperty("--lhn-br-accent", settings.accentColor);
    const channels = settings.accentColor.match(/[0-9a-f]{2}/gi).map(value => parseInt(value, 16));
    document.documentElement.style.setProperty("--lhn-br-accent-rgb", channels.join(","));
    document.documentElement.style.setProperty("--lhn-br-font", settings.fontFamily);
    document.documentElement.style.setProperty("--lhn-br-translation-color", getTranslationColor());
    document.querySelectorAll(".lhn-bilingual-card").forEach(card => updateTranslationCardStyle(card, card.parentElement));
    applyWebFont();
    const readerActive = settings.enableTTS && !isReaderDisabledOnThisWebsite();
    if (!readerActive) { stopReading(); removeAllReaderSpeakers(); }
    else { if (!wasReaderActive) mainBlocksDirty = true; updateSpeakers(); }
  }
  function isReaderDisabledOnThisWebsite() {
    const hostname = location.hostname.toLowerCase().replace(/^www\./, "").replace(/\.$/, "");
    return (Array.isArray(settings.readerDisabledWebsites) ? settings.readerDisabledWebsites : []).some(site => {
      const domain = String(site || "").toLowerCase().replace(/^www\./, "").replace(/\.$/, "");
      return domain && (hostname === domain || hostname.endsWith(`.${domain}`));
    });
  }
  async function applyWebFont() {
    const requestId = ++webFontRequestId, family = settings.webFontFamily;
    if (!family) {
      loadedWebFontFamily = "";
      document.documentElement.style.setProperty("--lhn-br-web-font", "inherit");
      document.querySelectorAll(".lhn-bilingual-web-font").forEach(block => block.classList.remove("lhn-bilingual-web-font"));
      return;
    }
    try {
      if (family !== "system-ui, -apple-system, sans-serif") {
        await Promise.race([ensureWebFontStylesheet(), new Promise(resolve => setTimeout(resolve, 700))]);
        await Promise.race([document.fonts.load(`16px ${family}`), new Promise(resolve => setTimeout(resolve, 1200))]);
      }
    } catch {}
    if (requestId !== webFontRequestId || settings.webFontFamily !== family) return;
    loadedWebFontFamily = family;
    document.documentElement.style.setProperty("--lhn-br-web-font", family);
    if (!websiteDisabled) readerBlocks().forEach(block => block.classList.add("lhn-bilingual-web-font"));
  }
  function getTranslationColor() {
    const color = settings.translationTextColor;
    if (color === "custom" && /^#[0-9a-f]{6}$/i.test(settings.translationCustomColor)) return settings.translationCustomColor;
    if (["#9c27b0", "#007bff", "#dc3545"].includes(color)) return color;
    return "#2d3748";
  }
  function updateTranslationCardStyle(card, sourceBlock) {
    if (!card) return;
    card.style.setProperty("--translation-scale", `${settings.translationFontScale}%`);
    card.style.color = getTranslationColor();
    const selectedWeight = String(settings.translationTextWeight || "auto");
    card.style.fontWeight = /^([1-9]00)$/.test(selectedWeight)
      ? selectedWeight
      : sourceBlock ? getComputedStyle(sourceBlock).fontWeight : "400";
  }
  function isTextBlock(el) {
    const excluded = new Set(["BUTTON","SELECT","OPTION","INPUT","TEXTAREA","SCRIPT","STYLE","LABEL","SVG","NOSCRIPT"]);
    if (!el || excluded.has(el.tagName) || el.closest("[data-lhn-bilingual-ui],.lhn-bilingual-card,#lhn-bilingual-reading-bar,.lhn-bilingual-speaker,button,select,label")) return false;
    const computed = getComputedStyle(el);
    if (computed.display === "inline" || computed.display === "none" || computed.visibility === "hidden" || !el.getClientRects().length) return false;
    const hasDirectText = Array.from(el.childNodes).some(node => node.nodeType === 3 && node.textContent.trim().length >= 2);
    const semanticTextBlock = /^(P|H[1-6]|LI|BLOCKQUOTE|FIGCAPTION|PRE|TD|DD|DT)$/.test(el.tagName) || el.getAttribute("role") === "paragraph";
    const genericLeafTextBlock = /^(DIV|SECTION)$/.test(el.tagName) && !el.querySelector("p,h1,h2,h3,h4,h5,h6,li,blockquote,figcaption,pre,td,dd,dt,div,section,[role='paragraph']");
    return hasDirectText || ((semanticTextBlock || genericLeafTextBlock) && el.textContent.trim().length >= 2);
  }
  function blocks(root = document.body) { return Array.from(root?.querySelectorAll("*") || []).filter(isTextBlock); }
  function excludedPageContentSelector() {
    const base = "nav,header,footer,aside,[role='navigation'],[role='complementary'],[aria-label*='related' i],[class*='sidebar' i],[id*='sidebar' i],[class*='related' i],[id*='related' i],[class*='recommend' i],[id*='recommend' i],[class*='advert' i],[id*='advert' i],[class*='most-read' i],[id*='most-read' i],[class*='most_read' i],[id*='most_read' i],[class*='popular' i],[id*='popular' i],[class*='trending' i],[id*='trending' i],[class*='right-column' i],[id*='right-column' i],[class*='right_column' i],[id*='right_column' i],[class*='rightbar' i],[id*='rightbar' i],[class*='right_bar' i],[id*='right_bar' i],[class*='col-right' i],[id*='col-right' i],[class*='col_right' i],[id*='col_right' i],[class*='column-right' i],[id*='column-right' i],[class*='column_right' i],[id*='column_right' i],[class*='col_300' i],[id*='col_300' i],[class*='ranking' i],[id*='ranking' i]";
    const values = Array.isArray(settings.excludeSelectors) ? settings.excludeSelectors : String(settings.excludeSelectors || "").split(/\r?\n/);
    const custom = values.map(value => String(value).trim()).filter(Boolean).filter(selector => { try { document.querySelector(selector); return true; } catch { return false; } });
    return [base, ...custom].join(",");
  }
  const readerIgnoredText = "style,script,noscript,template,[hidden],[aria-hidden='true'],[inert],button,input,select,textarea,svg,iframe,.lhn-bilingual-card,.lhn-bilingual-speaker,#lhn-bilingual-reading-bar,.hover-info,.btn-get-gg-search,.ttonews-tts,.author,.article-meta,.article__meta,.post-meta,.publication-date,.publish-date,[itemprop='datePublished'],[itemprop='author'],time";
  function visibleReaderText(block) {
    const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT), pieces = [];
    while (walker.nextNode()) {
      const node = walker.currentNode, parent = node.parentElement;
      if (!parent || !node.textContent.trim() || parent.closest(readerIgnoredText)) continue;
      let visible = true, current = parent;
      while (current && current !== block.parentElement) {
        const computed = getComputedStyle(current);
        if (computed.display === "none" || computed.visibility === "hidden" || computed.visibility === "collapse" || computed.contentVisibility === "hidden" || Number(computed.opacity) === 0) { visible = false; break; }
        current = current.parentElement;
      }
      if (!visible) continue;
      const range = document.createRange(); range.selectNodeContents(node);
      if (!range.getClientRects().length) continue;
      pieces.push(node.textContent.replace(/\s+/g, " "));
    }
    return pieces.join("").replace(/\s+/g, " ").trim();
  }
  function readerRoot() {
    const excludedSelector = excludedPageContentSelector();
    const selectors = ["[itemprop='articleBody']", "article", "main", "[role='main']", ".article-body", ".article-content", ".post-content", ".entry-content", ".news-content", ".content-detail", ".detail-content"];
    const candidates = Array.from(document.querySelectorAll(selectors.join(","))).filter(el => {
      const style = getComputedStyle(el);
      return style.display !== "none" && style.visibility !== "hidden" && el.getClientRects().length > 0 && !el.closest(excludedSelector);
    });
    const contentTextLength = el => {
      const clone = el.cloneNode(true);
      clone.querySelectorAll(excludedSelector).forEach(node => node.remove());
      clone.querySelectorAll(".lhn-bilingual-card,.lhn-bilingual-speaker,#lhn-bilingual-reading-bar").forEach(node => node.remove());
      return (clone.innerText || clone.textContent || "").trim().length;
    };
    const score = el => {
      const textLength = contentTextLength(el);
      const paragraphs = el.querySelectorAll("p").length;
      const headings = el.querySelectorAll("h1,h2,h3").length;
      const media = el.querySelectorAll("img,video,audio,figure").length;
      return textLength + paragraphs * 320 + headings * 90 + media * 55 + (el.matches("article,[itemprop='articleBody']") ? 700 : 0) + (el.matches("[role='main'],main") ? 300 : 0);
    };
    const semanticShortlist = candidates.map(el => ({ el, rough:(el.innerText || "").trim().length + el.querySelectorAll("p").length * 320 + (el.matches("article,[itemprop='articleBody']") ? 700 : 0) }))
      .sort((a, b) => b.rough - a.rough).slice(0, 20);
    let best = null, bestScore = 0;
    for (const { el:candidate } of semanticShortlist) { const value = score(candidate); if (value > bestScore) { best = candidate; bestScore = value; } }
    if (best && contentTextLength(best) >= 80) return best;

    const generic = Array.from(document.body?.querySelectorAll("div,section") || []).filter(el => {
      const style = getComputedStyle(el);
      return style.display !== "none" && style.visibility !== "hidden" && el.getClientRects().length > 0 && !el.closest(excludedSelector) && !el.matches(excludedSelector);
    });
    best = null; bestScore = 0;
    const genericShortlist = generic.map(el => ({ el, rough:(el.innerText || "").trim().length + el.querySelectorAll("p").length * 420 }))
      .filter(item => item.rough >= 180).sort((a, b) => b.rough - a.rough).slice(0, 20);
    for (const { el:candidate } of genericShortlist) {
      const length = contentTextLength(candidate);
      if (length < 180) continue;
      const paragraphs = candidate.querySelectorAll("p").length;
      const headings = candidate.querySelectorAll("h1,h2,h3").length;
      const candidateScore = length + paragraphs * 420 + headings * 120;
      if (candidateScore > bestScore) { best = candidate; bestScore = candidateScore; }
    }
    return best || document.querySelector("main,[role='main'],article") || document.body;
  }
  function legacyReaderBlocks() {
    const root = readerRoot();
    const excluded = `${excludedPageContentSelector()},.author,.article-meta,.article__meta,.post-meta,.publication-date,.publish-date,[itemprop='datePublished'],[itemprop='author'],time,.btn-get-gg-search,.hover-info`;
    const result = new Set(blocks(root).filter(el => !el.closest(excluded)));
    const addArticleLead = selectors => {
      const candidates = Array.from(document.querySelectorAll(selectors));
      if (candidates.some(el => result.has(el))) return;
      for (const el of candidates) {
        if (!isTextBlock(el) || el.closest(excluded) || result.has(el)) continue;
        let commonAncestor = el.parentElement;
        while (commonAncestor && !commonAncestor.contains(root)) commonAncestor = commonAncestor.parentElement;
        if (commonAncestor && commonAncestor !== document.body && commonAncestor !== document.documentElement) result.add(el);
        if (result.has(el)) break;
      }
    };
    addArticleLead("h1[data-role='title'],h1[itemprop='headline']");
    addArticleLead("[data-role='sapo'],.sapo,[itemprop='description'],.article-summary,.post-summary");
    return Array.from(result).sort((a, b) => a === b ? 0 : a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);
  }
  // ---------- Main-content detection (Readability), shared by Alt+R and Alt+A ----------
  const MC_BLOCK_SEL = "p,h1,h2,h3,h4,h5,h6,li,blockquote,figcaption,pre,td,dd,dt";
  const MC_SKIP_TAGS = new Set(["NAV","FOOTER","ASIDE","FORM","BUTTON","SCRIPT","STYLE","NOSCRIPT","SVG","LABEL","SELECT","TEXTAREA","IFRAME"]);
  const MC_HARD_BAD_ROLES = /banner|navigation|complementary|contentinfo|search|dialog|alertdialog/;
  const MC_HARD_SKIP = "[role='dialog'],[role='alertdialog'],[aria-modal='true'],dialog,#rhs,[class*='popup' i],[id*='popup' i],[class*='modal' i],[id*='modal' i]";
  const MC_DEBUG_KEY = "lhn-bilingual-reader-debug";
  const MC_BAD_TOKENS = new Set(["date","time","byline","meta","author","share","social","comment","comments","tag","tags","breadcrumb","ad","ads","advert","banner","promo","sponsor","newsletter","subscribe","cookie","cookies","popup","modal","related","recommend","trending","widget","sidebar","toolbar","paywall","menu","nav"]);
  const MC_BAD_TEXT = ["xem thêm","đọc thêm","chia sẻ","bình luận","quảng cáo","tin liên quan","tin cùng chuyên mục","có thể bạn quan tâm","đăng ký","theo dõi chúng tôi","read more","related articles","share","advertisement","subscribe","sign up"];
  const MC_OWN = ".lhn-bilingual-card,.lhn-bilingual-speaker,#lhn-bilingual-reading-bar,[data-lhn-bilingual-ui],#lhn-panel,#lhn-sidebar,#lhn-sidebar-edit-dialog";
  const mcNorm = s => (s || "").replace(/\s+/g, " ").trim().toLowerCase();
  const mcIsOwn = n => { const el = n?.nodeType === 1 ? n : n?.parentElement; return !!el?.closest?.(MC_OWN); };
  function mcText(el) {
    const clone = el.cloneNode(true);
    clone.querySelectorAll(".lhn-bilingual-card,.lhn-bilingual-speaker").forEach(n => n.remove());
    return (clone.textContent || "").replace(/\s+/g, " ").trim();
  }
  function mcBadToken(el) {
    const cls = typeof el.className === "string" ? el.className : "";
    return `${el.id || ""} ${cls}`.toLowerCase().split(/[\s_\-]+/).some(t => MC_BAD_TOKENS.has(t));
  }
  function mcHardExclusion(el, custom) {
    for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
      if (mcIsOwn(n)) return "extension UI";
      if (MC_SKIP_TAGS.has(n.tagName)) return `inside ${n.tagName.toLowerCase()}`;
      const role = n.getAttribute("role");
      if (role && MC_HARD_BAD_ROLES.test(role)) return `inside role=${role}`;
      if (n.matches?.(MC_HARD_SKIP)) return "inside popup/dialog";
      if (custom && n.matches?.(custom)) return "custom excluded selector";
      if (["sidebar","rightbar","right-column","col-right","most-read"].some(token => `${n.id || ""} ${typeof n.className === "string" ? n.className : ""}`.toLowerCase().includes(token))) return "sidebar";
    }
    return "";
  }
  function mcDateLike(t) {
    return t.length < 60 && (/\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}/.test(t) || /\d{1,2}\s+th[aá]ng\s*\d{1,2}/i.test(t) || /\d{1,2}:\d{2}/.test(t));
  }
  function mcSkipReason(el, text, custom) {
    if (!text) return "empty text";
    const hardReason = mcHardExclusion(el, custom);
    if (hardReason) return hardReason;
    if (!el.getClientRects().length) return "not visible";
    const rect = el.getBoundingClientRect();
    if (rect.width >= (window.innerWidth || 0) * 0.92 && rect.height >= (window.innerHeight || 0) * 0.82) return "page-sized reading block";
    if (el.matches("p") && el.querySelector("em,i") && /\?\s*$/.test(text)) return "";
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    // Keep prose even when its class, links, or date-like text fooled the old filters.
    if (wordCount >= 20) return "";
    if (mcBadToken(el)) return "noise class/id token";
    if (el.querySelector("time")) return "contains time element";
    const lower = mcNorm(text);
    if (MC_BAD_TEXT.some(b => lower === b || lower.startsWith(b + " ") || lower.startsWith(b + ":"))) return "known navigation/promo text";
    if (mcDateLike(text)) return "date/time text";
    if (/^(published|updated|cập nhật|đăng lúc)\b/i.test(text)) return "publication metadata";
    {
      const linkLen = [...el.querySelectorAll("a")].reduce((sum, a) => sum + (a.textContent || "").trim().length, 0);
      if (linkLen > 0 && linkLen / text.length > 0.6) return "mostly link text";
    }
    return "";
  }
  function mcTextBlocks(root) {
    if (!root) return [];
    const result = new Set();
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (!node.textContent.trim() || mcIsOwn(node)) continue;
      const parent = node.parentElement;
      if (!parent) continue;
      let block = parent.closest(MC_BLOCK_SEL);
      if (!block || !root.contains(block)) {
        for (let current = parent; current; current = current.parentElement) {
          if (current.matches("[role='paragraph']")) { block = current; break; }
          if (current.matches("div,section") && current !== document.body && !current.querySelector(`${MC_BLOCK_SEL},div,section,article,main,[role='paragraph'],[role='main']`)) { block = current; break; }
          if (current === root) break;
        }
      }
      if (block && root.contains(block) && !mcIsOwn(block)) result.add(block);
    }
    return [...result];
  }
  function mcCustomSelector() {
    const values = Array.isArray(settings.excludeSelectors) ? settings.excludeSelectors : String(settings.excludeSelectors || "").split(/\r?\n/);
    return values.map(v => String(v).trim()).filter(Boolean).filter(sel => { try { document.querySelector(sel); return true; } catch { return false; } }).join(",");
  }
  function mcMatches(t, texts, arr) {
    if (texts.has(t)) return true;
    if (t.length < 30) return false;
    const probe = t.slice(0, 80);
    return arr.some(s => s.length >= 30 && (s.includes(probe) || t.includes(s.slice(0, 80))));
  }
  function mcFindTitle(title) {
    const t = mcNorm(title).replace(/\s*[-|–]\s*[^-|–]{0,60}$/, "");
    const heads = [...document.querySelectorAll("h1,h2")].filter(h => !mcIsOwn(h) && mcText(h).length > 3);
    for (const h of heads) { const ht = mcNorm(mcText(h)); if (ht.length >= 10 && t && (t.includes(ht) || ht.includes(t.slice(0, 40)))) return h; }
    return heads.find(h => h.tagName === "H1") || null;
  }
  function mcDetect() {
    if (typeof Readability !== "function") return null;
    let article = null;
    try {
      const doc = document.cloneNode(true);
      doc.querySelectorAll(".lhn-bilingual-card,.lhn-bilingual-speaker,#lhn-bilingual-reading-bar,[data-lhn-bilingual-ui]").forEach(n => n.remove());
      article = new Readability(doc, { charThreshold: 300 }).parse();
    } catch { article = null; }
    if (!article || !article.textContent || article.textContent.length < 300) return null;
    const frag = new DOMParser().parseFromString(article.content, "text/html");
    const texts = new Set();
    frag.body.querySelectorAll(MC_BLOCK_SEL).forEach(el => { if (!el.querySelector(MC_BLOCK_SEL)) { const t = mcNorm(el.textContent); if (t) texts.add(t); } });
    if (article.excerpt) { const ex = mcNorm(article.excerpt); if (ex) texts.add(ex); }
    return { title: article.title || "", texts, arr: [...texts] };
  }
  function mcGoogleResultsRoot() {
    if (!/(^|\.)google\./i.test(location.hostname) || !/^\/search\b/i.test(location.pathname)) return null;
    const center = document.querySelector("#center_col");
    const aiOverview = document.querySelector("[data-attrid='AIOverview'],[data-attrid*='AIOverview' i]");
    if (aiOverview && center && !center.contains(aiOverview)) {
      const combined = aiOverview.closest("#main,main,[role='main']") || document.querySelector("#main");
      if (combined && combined.getClientRects().length) return combined;
    }
    for (const selector of ["#center_col", "#main", "#rso", "main", "[role='main']"]) {
      const el = document.querySelector(selector);
      if (el && el.getClientRects().length && !mcIsOwn(el)) return el;
    }
    return null;
  }
  function mcChooseRoot(info, matched) {
    const googleRoot = mcGoogleResultsRoot();
    if (googleRoot) return googleRoot;
    if (info && matched.length) {
      for (const selector of ["[itemprop='articleBody']", "article", "main", "[role='main']", ".article-body", ".article-content", ".post-content", ".entry-content"]) {
        const ancestor = matched[0].closest(selector);
        if (ancestor && matched.every(block => ancestor.contains(block))) return ancestor;
      }
      let common = matched[0];
      while (common && common !== document.body && !matched.every(block => common.contains(block))) common = common.parentElement;
      if (common && common !== document.body) return common;
    }
    return readerRoot();
  }
  const mcDebugEnabled = () => { try { return localStorage.getItem(MC_DEBUG_KEY) === "1"; } catch { return false; } };
  function mcUpdateDebug(reports) {
    const enabled = mcDebugEnabled();
    const styleId = "lhn-bilingual-reader-debug-style";
    const existingStyle = document.getElementById(styleId);
    if (!enabled) {
      if (existingStyle) {
        existingStyle?.remove();
        document.querySelectorAll("[data-lhn-reader-debug]").forEach(el => { delete el.dataset.lhnReaderDebug; delete el.dataset.lhnReaderDebugReason; });
      }
      return;
    }
    if (!existingStyle) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = '[data-lhn-reader-debug="read"]{outline:2px solid #16a34a!important;outline-offset:2px!important}[data-lhn-reader-debug="skip"]{outline:2px solid #ef4444!important;outline-offset:2px!important}';
      (document.head || document.documentElement).appendChild(style);
    }
    const rows = reports.map(({el, text, reason}) => {
      el.dataset.lhnReaderDebug = reason ? "skip" : "read";
      if (reason) el.dataset.lhnReaderDebugReason = reason;
      return {status: reason ? "skip" : "read", reason: reason || "kept", text: text.slice(0, 120), element: el};
    });
    console.info("Bilingual Reader debug: green = read, red = skipped; set localStorage key 'lhn-bilingual-reader-debug' to '0' and reload to turn off.");
    console.table(rows);
  }
  let mainBlocksCache = [], mainBlocksAt = 0, mainBlocksDirty = true;
  function computeMainBlocks() {
    const info = mcDetect();
    const custom = mcCustomSelector();
    const matched = info ? mcTextBlocks(document.body).filter(el => {
      const raw = visibleReaderText(el), t = mcNorm(raw);
      return t && mcMatches(t, info.texts, info.arr) && !mcSkipReason(el, raw, custom);
    }) : [];
    const root = mcChooseRoot(info, matched);
    const analyzed = mcTextBlocks(root).map(el => {
      const text = visibleReaderText(el);
      return {el, text, reason:mcSkipReason(el, text, custom)};
    });
    if (mcDebugEnabled() && root !== document.body) {
      mcTextBlocks(document.body).filter(el => !root.contains(el)).forEach(el => {
        const text = visibleReaderText(el);
        analyzed.push({el, text, reason:"outside selected main-content region"});
      });
    }
    mcUpdateDebug(analyzed);
    const result = analyzed.filter(item => !item.reason).map(item => item.el);
    const title = info?.title ? mcFindTitle(info.title) : null;
    if (title && root.contains(title) && !mcIsOwn(title) && mcText(title).length > 3 && !result.includes(title)) result.push(title);
    // VnExpress keeps its visible headline and lead outside the article-body root.
    const articleLeads = document.querySelectorAll("h1.title_post,h1[data-role='title'],h1[itemprop='headline'],.lead_post_detail,[data-role='sapo'],.sapo,[itemprop='description'],.article-summary,.post-summary");
    for (const el of articleLeads) {
      if (result.includes(el) || mcIsOwn(el)) continue;
      const text = visibleReaderText(el);
      if (!text || mcSkipReason(el, text, custom)) continue;
      let ancestor = el.parentElement;
      while (ancestor && ancestor !== document.body && ancestor !== document.documentElement && !ancestor.contains(root)) ancestor = ancestor.parentElement;
      if (root.contains(el) || (ancestor && ancestor !== document.body && ancestor !== document.documentElement && ancestor.contains(root))) result.push(el);
    }
    // Readability can omit VnExpress's italic interview questions from its parsed article text.
    for (const el of document.querySelectorAll(".main_fck_detail .fck_detail p.Normal")) {
      const text = visibleReaderText(el);
      if (el.querySelector("em,i") && /\?\s*$/.test(text) && el.getClientRects().length && !mcHardExclusion(el, custom) && !result.includes(el)) result.push(el);
    }
    return result.sort((a, b) => a === b ? 0 : (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) ? -1 : 1);
  }
  // Alt+R and Alt+A both read from this list. Alt+D uses blocks() (whole page).
  function readerBlocks(force = false) {
    const fresh = Date.now() - mainBlocksAt < 1500;
    if (!force && (!mainBlocksDirty || fresh) && mainBlocksCache.length) {
      mainBlocksCache = mainBlocksCache.filter(el => el.isConnected);
      if (mainBlocksCache.length) return mainBlocksCache;
    }
    const computed = computeMainBlocks();
    mainBlocksCache = (computed && computed.length) ? computed : legacyReaderBlocks();
    mainBlocksAt = Date.now(); mainBlocksDirty = false;
    return mainBlocksCache;
  }
  function rawText(block) {
    // Một đường duy nhất cho Alt+A/lazy và Alt+D để hai phím dùng chung khóa cache Reader.
    return visibleReaderText(block);
  }
  globalThis.LHN_READER_MAIN_SOURCE = Object.freeze({
    getTextBlocks: (options = {}) => readerBlocks(Boolean(options?.forceRefresh)).map(rawText).filter(text => String(text || "").trim()),
  });
  function lastReaderCharacterRect(block) {
    const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
    let anchor = null;
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (!node.textContent.trim() || node.parentElement?.closest(readerIgnoredText)) continue;
      let visible = true;
      for (let parent = node.parentElement; parent; parent = parent.parentElement) {
        const computed = getComputedStyle(parent);
        if (computed.display === "none" || computed.visibility === "hidden" || computed.visibility === "collapse" || computed.contentVisibility === "hidden" || Number(computed.opacity) === 0) { visible = false; break; }
        if (parent === block) break;
      }
      if (!visible) continue;
      const characters = Array.from(node.textContent);
      let endOffset = node.textContent.length;
      while (characters.length && /^\s+$/u.test(characters[characters.length - 1])) endOffset -= characters.pop().length;
      if (!characters.length) continue;
      const startOffset = endOffset - characters[characters.length - 1].length;
      const range = document.createRange();
      range.setStart(node, startOffset); range.setEnd(node, endOffset);
      const rect = range.getBoundingClientRect();
      if (rect.width || rect.height) anchor = { rect, direction:getComputedStyle(node.parentElement || block).direction };
    }
    return anchor;
  }
  function positionSpeakerAfterText(block, speaker, anchor = lastReaderCharacterRect(block)) {
    if (!anchor) return;
    const textRect = anchor.rect, blockRect = block.getBoundingClientRect();
    const iconWidth = speaker.offsetWidth || 18, iconHeight = speaker.offsetHeight || 18, gap = 3;
    const rtl = anchor.direction === "rtl";
    let x = rtl ? textRect.left - iconWidth - gap : textRect.right + gap;
    const minX = blockRect.left + 1, maxX = Math.max(minX, blockRect.right - iconWidth - 1);
    x = Math.min(maxX, Math.max(minX, x));
    let y = textRect.top + (textRect.height - iconHeight) / 2;
    const minY = blockRect.top, maxY = Math.max(minY, blockRect.bottom - iconHeight);
    y = Math.min(maxY, Math.max(minY, y));
    const containingBlock = speaker.offsetParent || document.documentElement;
    const parentRect = containingBlock.getBoundingClientRect();
    const left = x - parentRect.left + containingBlock.scrollLeft - containingBlock.clientLeft;
    const top = y - parentRect.top + containingBlock.scrollTop - containingBlock.clientTop;
    speaker.style.setProperty("left", `${left}px`, "important");
    speaker.style.setProperty("top", `${top}px`, "important");
  }
  const speakerPositionObserver = typeof ResizeObserver === "function" ? new ResizeObserver(entries => {
    entries.forEach(entry => {
      const speaker = entry.target.querySelector(":scope > .lhn-bilingual-speaker");
      if (speaker) positionSpeakerAfterText(entry.target, speaker);
    });
  }) : null;
  function repositionReaderSpeakers() {
    document.querySelectorAll(".lhn-bilingual-speaker").forEach(speaker => {
      const block = speaker.parentElement;
      if (block) positionSpeakerAfterText(block, speaker);
    });
  }
  let speakerRepositionFrame = 0;
  window.addEventListener("resize", () => {
    cancelAnimationFrame(speakerRepositionFrame);
    speakerRepositionFrame = requestAnimationFrame(() => { speakerRepositionFrame = 0; repositionReaderSpeakers(); });
  }, { passive:true });
  function removeAllReaderSpeakers() {
    document.querySelectorAll(".lhn-bilingual-speaker").forEach(speaker => {
      if (speaker.parentElement) speakerPositionObserver?.unobserve(speaker.parentElement);
      speaker.remove();
    });
  }
  function updateSpeakers() {
    if (websiteDisabled || !settings.enableTTS || isReaderDisabledOnThisWebsite()) return;
    const readableBlocks = readerBlocks();
    const blockSet = new Set(readableBlocks);
    document.querySelectorAll(".lhn-bilingual-speaker").forEach(speaker => {
      if (blockSet.has(speaker.parentElement)) return;
      if (speaker.parentElement) speakerPositionObserver?.unobserve(speaker.parentElement);
      speaker.remove();
    });
    const isNestedBlock = block => { for (let parent = block.parentElement; parent; parent = parent.parentElement) if (blockSet.has(parent)) return true; return false; };
    readableBlocks.forEach((block, index) => {
      block.dataset.lhnBilingualIndex = String(index);
      // Chỉ khối trong vùng Reader mới có nút; khối điều hướng/widget của trang không bị chèn thêm.
      if (isNestedBlock(block)) {
        const nestedSpeaker = block.querySelector(":scope > .lhn-bilingual-speaker");
        if (nestedSpeaker) { speakerPositionObserver?.unobserve(block); nestedSpeaker.remove(); }
        return;
      }
      const anchor = lastReaderCharacterRect(block);
      let speaker = block.querySelector(":scope > .lhn-bilingual-speaker");
      if (!anchor) {
        if (speaker) { speakerPositionObserver?.unobserve(block); speaker.remove(); }
        return;
      }
      if (!speaker) {
        speaker = document.createElement("span"); speaker.className = "lhn-bilingual-speaker"; speaker.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a10 10 0 0 1 0 14"/></svg>';
        speaker.title = "Read this paragraph; click to start reading here"; speaker.setAttribute("role", "button"); speaker.tabIndex = 0;
        speaker.addEventListener("click", event => { event.stopPropagation(); startReading(block, true); });
        speaker.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); startReading(block, true); } });
        const card = block.querySelector(":scope > .lhn-bilingual-card"); card ? card.before(speaker) : block.appendChild(speaker);
      }
      speaker.dataset.visibility = settings.speakerIconVisibility;
      speaker.toggleAttribute("data-reading", reading && block.classList.contains("lhn-bilingual-reading"));
      positionSpeakerAfterText(block, speaker, anchor);
      speakerPositionObserver?.observe(block);
    });
  }
  // Thông báo một lần mỗi lần tải trang khi bỏ qua đoạn cùng ngôn ngữ (dùng style toast có sẵn)
  let sameLangToastShown = false;
  function notifySameLangSkipped() {
    if (sameLangToastShown) return;
    sameLangToastShown = true;
    let toast = document.getElementById("lhn-sidebar-toast");
    if (!toast) { toast = document.createElement("div"); toast.id = "lhn-sidebar-toast"; toast.setAttribute("role", "status"); document.documentElement.appendChild(toast); }
    toast.textContent = popupText("sameLangSkippedToast");
    toast.classList.add("is-visible");
    clearTimeout(toast._lhnSameLangTimer);
    toast._lhnSameLangTimer = setTimeout(() => toast.classList.remove("is-visible"), 2600);
  }

  async function translateBlock(block, readerMode = false) {
    if (websiteDisabled || !block || !document.body.contains(block) || block.dataset.lhnBrTranslating === "true") return;
    block.classList.toggle("lhn-bilingual-web-font", !!settings.webFontFamily && loadedWebFontFamily === settings.webFontFamily);
    block.dataset.lhnBrTranslating = "true";
    try {
      const text = rawText(block, readerMode); if (!text || text.length < 2) return;
      let card = block.querySelector(":scope > .lhn-bilingual-card");
      const targetLang = ["auto", "same"].includes(targetLanguage) ? displayLang : targetLanguage;
      if (card?.dataset.sourceText === text && card.dataset.targetLang === targetLang) return;
      const result = await LHN_MESSAGING.sendMessage({ type:"BILINGUAL_TRANSLATE", text, targetLang });
      let translated = result?.translated;
      if (!translated) return;
      const source = text.trim().toLocaleLowerCase(), sameDetected = result.detectedLang && result.detectedLang.toLowerCase().split("-")[0] === targetLang;
      if (settings.skipSameLang && !result.fallback && (sameDetected || translated.trim().toLocaleLowerCase() === source)) { card?.remove(); notifySameLangSkipped(); return; }
      if (!document.body.contains(block)) return;
      if (!card) { card = document.createElement("div"); card.className = "lhn-bilingual-card"; }
      card.textContent = translated; card.dataset.sourceText = text; card.dataset.targetLang = targetLang;
      updateTranslationCardStyle(card, block);
      const speaker = block.querySelector(":scope > .lhn-bilingual-speaker"); speaker ? speaker.after(card) : block.appendChild(card);
    } catch (error) { console.warn("Bilingual Reader translation failed", error); if (!navigator.onLine || /fetch|network/i.test(String(error?.message || error))) globalThis.LHN_BAR_HOOKS?.translateOffline?.(); }
    finally { delete block.dataset.lhnBrTranslating; }
  }
  function observeLazy() {
    lazyObserver?.disconnect();
    if (websiteDisabled) return;
    lazyObserver = new IntersectionObserver(entries => { if (!window.__lhnBilingualLazy) return; entries.forEach(entry => { if (entry.isIntersecting) translateBlock(entry.target, true); }); }, { rootMargin:"100px 0px", threshold:.05 });
    readerBlocks().forEach(block => lazyObserver.observe(block));
  }
  function toggleLazy() {
    if (websiteDisabled) return;
    window.__lhnBilingualLazy = !window.__lhnBilingualLazy;
    if (window.__lhnBilingualLazy) { readerBlocks(true); observeLazy(); }
    else { lazyObserver?.disconnect(); readerBlocks().forEach(block => block.querySelectorAll(":scope > .lhn-bilingual-card").forEach(card => card.remove())); }
  }
  // v3.5.163: the bar slides out (the Keepit bar slides back in at the same time) instead of vanishing
  let barHideTimer = 0;
  function closeReadingBar() {
    stopReading(); closeSheet();
    if (!bar.classList.contains("lhn-show") || bar.classList.contains("lhn-hiding")) return;
    bar.classList.add("lhn-hiding"); clearTimeout(barHideTimer);
    barHideTimer = setTimeout(() => { bar.classList.remove("lhn-show", "lhn-hiding"); syncSpacer(); }, 220);
  }
  function stopReading() {
    speechDetectionRequest++; readingSegment = null; reading = false; readingPaused = false; resumeText = ""; currentReadText = ""; currentReadCharIndex = 0; utterance = null; cancelGoogle(); syncPauseShortcutState(); document.querySelectorAll(".lhn-bilingual-reading").forEach(el => el.classList.remove("lhn-bilingual-reading")); document.querySelectorAll(".lhn-bilingual-speaker").forEach(el => el.removeAttribute("data-reading")); document.querySelectorAll(".lhn-bilingual-speaker:focus").forEach(el => el.blur()); closePopovers(); syncToolbar();
  }
  let googleAudio = null, googleToken = null, googleResumeWaiters = [];
  function cancelGoogle() {
    googleToken = null; googleResumeWaiters.splice(0).forEach(resolve => resolve());
    if (googleAudio) { googleAudio.pause(); googleAudio.removeAttribute("src"); googleAudio.load(); googleAudio = null; }
    synth?.cancel();
  }
  function resumeGoogle() {
    googleResumeWaiters.splice(0).forEach(resolve => resolve());
    synth?.resume(); googleAudio?.play().catch(() => {});
  }
  var voiceFlagOverride = ""; var readingSegment = null; var lastAppliedSegmentRate = null; // đoạn đang đọc: { translation, lang }
  async function speakGoogleNext(text, fallbackLang, requestId, voiceSettings, forcedLang = null, then = null) {
    const lang = forcedLang ? LHN_TTS.normalizeLanguage(forcedLang) : voiceSettings?.readLanguage ? LHN_TTS.normalizeLanguage(voiceSettings.readLanguage) : (settings.autoDetectVoice !== false ? await LHN_TTS.detectLanguage(text, fallbackLang) : LHN_TTS.normalizeLanguage(fallbackLang));
    if (requestId !== speechDetectionRequest || !reading) return;
    activeSpeechLang = lang;
    cancelGoogle(); // dừng đoạn đang đọc trước khi đọc đoạn mới (next/previous)
    const token = {}; googleToken = token; utterance = token;
    const base = String(lang || "en").replace(/_/g, "-").split("-")[0].toLowerCase() || "en";
    const finish = () => { if (googleToken !== token) return; googleToken = null; utterance = null; if (then) { if (!settings.readTranslation) { if (reading) advanceQueue(); return; } void speakGoogleNext(then.text, then.lang, requestId, voiceSettings, then.lang); return; } if (!forcedLang) { const pending = pendingTranslationFor(queue[queueIndex]); if (pending) { void speakGoogleNext(pending.text, pending.lang, requestId, voiceSettings, pending.lang); return; } } if (reading) advanceQueue(); };
    readingSegment = { translation: Boolean(forcedLang), lang }; lastAppliedSegmentRate = segmentRate(lang); syncToolbar();
    LHN_TTS.play({
      text, lang, googleLanguage: base, voice: `google-translate-default:${base}`, rate: () => segmentRate(lang),
      isActive: () => googleToken === token && reading,
      waitIfPaused: () => readingPaused ? new Promise(resolve => googleResumeWaiters.push(resolve)) : null,
      setCurrent: audio => { googleAudio = audio; },
      clearCurrent: () => { googleAudio = null; },
      browserVoiceURI:voiceSettings.browserVoiceURI,
      systemSpeak: (t, l, done, browserVoiceURI) => {
        if (!synth || !window.SpeechSynthesisUtterance) { done({ unsupported:true }); return; }
        const normalize = value => String(value || "").trim().replace(/_/g, "-").toLowerCase();
        const target = normalize(l), base = target.split("-")[0];
        const voices = synth.getVoices();
        const voice = voices.find(item => item.voiceURI === browserVoiceURI) || voices.find(item => normalize(item.lang) === target) || voices.find(item => normalize(item.lang).split("-")[0] === base);
        if (!voice) { done({ unsupported:true }); return; }
        const u = new SpeechSynthesisUtterance(t); u.lang = voice.lang || l; u.rate = segmentRate(l || lang); u.voice = voice;
        u.onend = done; u.onerror = done; synth.speak(u);
      },
      strictVoice: true,
      onGoogleVoiceFailed: error => { console.error("Bilingual Reader: Google voice failed, reading stopped (voice not switched)", error); stopReading(); showReaderToast(popupText("readerToastGoogleVoiceFailed")); },
      onGoogleLimitReached: () => showReaderToast(popupText("readerToastGoogleLimit")),
      onGoogleAudioSlow: () => showReaderToast(popupText("googleAudioSlowToast")),
      onBrowserVoiceUnavailable: () => { stopReading(); document.dispatchEvent(new CustomEvent("lhn-browser-voice-unavailable")); },
      onEnd: finish
    });
  }
  // Giọng trình duyệt người dùng đã chọn: khớp theo voiceURI, rồi theo tên (giọng Google trên Chrome có voiceURI = tên). Không thay bằng giọng khác.
  function findBrowserVoice(uri) {
    const key = String(uri || "").trim().toLowerCase();
    if (!key) return null;
    const list = synth?.getVoices?.() || systemVoices || [];
    return list.find(voice => voice.voiceURI === uri) || list.find(voice => String(voice.voiceURI || "").trim().toLowerCase() === key || String(voice.name || "").trim().toLowerCase() === key) || null;
  }
  // Chrome tải danh sách giọng bất đồng bộ: chờ voiceschanged tối đa timeoutMs trước khi kết luận giọng không có.
  function waitForBrowserVoice(uri, timeoutMs = 1000) {
    return new Promise(resolve => {
      const found = findBrowserVoice(uri);
      if (found || !synth) { resolve(found); return; }
      let done = false, timer = null;
      const finish = () => { if (done) return; done = true; clearTimeout(timer); synth.removeEventListener?.("voiceschanged", onChange); resolve(findBrowserVoice(uri)); };
      const onChange = () => { if (findBrowserVoice(uri)) finish(); };
      timer = setTimeout(finish, timeoutMs);
      synth.addEventListener?.("voiceschanged", onChange);
    });
  }
  async function speakNext(textOverride = null) {
    if (!reading || queueIndex >= queue.length || !queue[queueIndex]) { stopReading(); return; }
    const requestId = ++speechDetectionRequest;
    document.querySelectorAll(".lhn-bilingual-reading").forEach(el => el.classList.remove("lhn-bilingual-reading"));
    document.querySelectorAll('.lhn-bilingual-speaker[data-visibility="reading"]').forEach(el => el.removeAttribute("data-reading"));
    const block = queue[queueIndex]; block.classList.add("lhn-bilingual-reading");
    block.querySelector(":scope > .lhn-bilingual-speaker")?.setAttribute("data-reading", "true");
    if (settings.autoScroll) block.scrollIntoView({ behavior:"smooth", block:"center" });
    currentReadText = textOverride ?? readTextFor(block); currentReadCharIndex = 0;
    const translationIncluded = textOverride == null && Boolean(settings.readTranslation) && Boolean(block.querySelector(":scope > .lhn-bilingual-card")?.textContent.trim());
    const blockLang = block.closest("[lang]")?.getAttribute("lang") || document.documentElement.lang || navigator.language || "en-US";
    let voiceSettings = { voiceMode:settings.voiceMode || "google", browserVoiceURI:settings.browserVoiceURI || "" };
    try { voiceSettings = await LHN_TTS.getVoiceSettings(); } catch {}
    if (requestId !== speechDetectionRequest || !reading || queue[queueIndex] !== block) return;
    settings = { ...settings, ...voiceSettings };
    if (voiceSettings.voiceMode === "google") {
      const seg = textOverride == null ? readSegmentsFor(block) : null;
      void speakGoogleNext(seg ? seg.source : currentReadText, blockLang, requestId, voiceSettings, null, seg ? { text: seg.translated, lang: seg.lang } : null);
      return;
    }
    readingSegment = null; // giọng trình duyệt: bỏ ngôn ngữ đoạn Google cũ để cờ theo giọng đang dùng
    let explicitVoice = null;
    if (voiceSettings.browserVoiceURI) {
      explicitVoice = await waitForBrowserVoice(voiceSettings.browserVoiceURI);
      if (requestId !== speechDetectionRequest || !reading || queue[queueIndex] !== block) return;
      if (!explicitVoice) { console.error("Bilingual Reader: selected browser voice not available, reading stopped (voice not switched)", voiceSettings.browserVoiceURI); stopReading(); showReaderToast(popupText("readerToastBrowserVoiceMissing", { name:voiceSettings.browserVoiceURI })); return; }
      selectedVoice = explicitVoice;
    }
    activeSpeechLang = explicitVoice ? (explicitVoice.lang || LHN_TTS.normalizeLanguage(blockLang)) : settings.autoDetectVoice !== false ? await LHN_TTS.detectLanguage(currentReadText, blockLang) : LHN_TTS.normalizeLanguage(blockLang);
    if (requestId !== speechDetectionRequest || !reading || queue[queueIndex] !== block) return;
    systemVoices = synth?.getVoices?.() || systemVoices;
    const baseLang = activeSpeechLang.toLowerCase().split(/[-_]/)[0];
    const defaultLanguageVoice = systemVoices.find(voice => voice.default && voice.lang?.toLowerCase().split(/[-_]/)[0] === baseLang);
    const normalizeVoiceLang = voice => String(voice?.lang || "").toLowerCase().replace(/_/g,"-");
    const selectedVoiceMatches = selectedVoice && normalizeVoiceLang(selectedVoice).split("-")[0] === baseLang;
    activeVoice = explicitVoice || (selectedVoiceMatches ? selectedVoice : null) || defaultLanguageVoice || systemVoices.find(voice => normalizeVoiceLang(voice) === activeSpeechLang.toLowerCase().replace(/_/g,"-")) || systemVoices.find(voice => normalizeVoiceLang(voice).split("-")[0] === baseLang) || null;
    if (!selectedVoice && activeVoice?.lang) activeSpeechLang = activeVoice.lang;
    if (!activeVoice) { stopReading(); document.dispatchEvent(new CustomEvent("lhn-browser-voice-unavailable")); return; }
    const current = new SpeechSynthesisUtterance(currentReadText); current.rate = segmentRate(activeSpeechLang); lastAppliedSegmentRate = current.rate; current.lang = selectedVoice?.lang || activeSpeechLang; if (activeVoice) current.voice=activeVoice; utterance = current;
    current.onboundary = event => { if (utterance === current && Number.isFinite(event.charIndex)) { currentReadCharIndex = event.charIndex; updateProgress(); } };
    const finish = () => { if (utterance !== current) return; utterance = null; if (reading) { if (!translationIncluded) { const pending = pendingTranslationFor(block); if (pending) { void speakGoogleNext(pending.text, pending.lang, requestId, voiceSettings, pending.lang); return; } } advanceQueue(); } };
    current.onend = finish; current.onerror = event => { if (utterance !== current) return; console.warn("Bilingual Reader speech synthesis failed", event?.error || event); if (!["canceled", "interrupted"].includes(event?.error)) showReaderToast(popupText("readerToastBrowserVoiceFailed")); finish(); }; syncToolbar(); if (synth?.paused) synth.resume(); synth?.speak(current);
  }
  // Đọc luôn cả đoạn dịch song ngữ phía dưới (chỉ khi đoạn có bản dịch)
  // Tách đoạn gốc và đoạn dịch để đọc mỗi phần với ngôn ngữ riêng (đoạn dịch dùng ngôn ngữ đích)
  function readSegmentsFor(block) {
    if (!settings.readTranslation) return null;
    const card = block.querySelector(":scope > .lhn-bilingual-card");
    const translated = card?.textContent.trim();
    if (!translated) return null;
    return { source: rawText(block, true), translated, lang: card.dataset.targetLang || displayLang };
  }
  // Đoạn gốc vừa đọc xong: nếu tuỳ chọn được bật (kể cả vừa bật trong lúc đang đọc) và đoạn có bản dịch
  // thì đọc ngay bản dịch trước khi sang đoạn kế tiếp.
  function pendingTranslationFor(block) {
    if (!settings.readTranslation || !block) return null;
    const card = block.querySelector(":scope > .lhn-bilingual-card");
    const translated = card?.textContent.trim();
    if (!translated) return null;
    return { text:translated, lang:card.dataset.targetLang || displayLang };
  }
  // Tắt tuỳ chọn khi đang đọc bản dịch của đoạn hiện tại: cắt ngay phần bản dịch, không đọc tiếp.
  function skipBilingualSegment() {
    if (!reading || readingSegment?.translation !== true) return;
    speechDetectionRequest++;
    utterance = null;
    const wasPaused = readingPaused;
    cancelGoogle();
    resumeText = "";
    readingSegment = null; lastAppliedSegmentRate = null;
    if (!repeatSegment) queueIndex = Math.min(queue.length, queueIndex + 1);
    if (wasPaused) { syncToolbar(); return; }
    speakAfterCancel();
  }
  function readTextFor(block) {
    const source = rawText(block, true);
    const card = block.querySelector(":scope > .lhn-bilingual-card");
    const translated = settings.readTranslation && card ? card.textContent.trim() : "";
    return translated ? `${source}\n${translated}` : source;
  }
  let readerErrorToastTimer = null;
  function showReaderToast(text) {
    let toast = document.getElementById("lhn-sidebar-toast");
    if (!toast) { toast = document.createElement("div"); toast.id = "lhn-sidebar-toast"; toast.setAttribute("role", "status"); document.documentElement.appendChild(toast); }
    toast.textContent = text;
    toast.classList.add("is-visible");
    clearTimeout(readerErrorToastTimer);
    readerErrorToastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2600);
  }
  function notifyReadTranslationOn() { showBarToast(popupText("readTranslationOnToast")); }

  function startReading(fromBlock, interruptCurrent = false) {
    if (websiteDisabled) { console.warn("[Keepit Reader] Không đọc: website đang bị tắt cho trang này"); return; }
    if (isReaderDisabledOnThisWebsite()) { console.warn("[Keepit Reader] Không đọc: website nằm trong danh sách tắt Reader", location.hostname); return; }
    if (!settings.enableTTS || !synth || !window.SpeechSynthesisUtterance) { console.warn("[Keepit Reader] Không đọc: TTS bị tắt hoặc trình duyệt không hỗ trợ", { enableTTS:settings.enableTTS, synth:Boolean(synth), utterance:Boolean(window.SpeechSynthesisUtterance) }); return; }
    speechDetectionRequest++;
    let nextQueue = readerBlocks(true);
    if (fromBlock && !nextQueue.includes(fromBlock)) nextQueue = [fromBlock];
    if (!nextQueue.length) { console.warn("[Keepit Reader] Không đọc: không tìm thấy đoạn nào để đọc", { fromBlock:Boolean(fromBlock) }); return; }
    const cancelPendingSpeech = Boolean(interruptCurrent && (reading || synth?.speaking || synth?.pending || synth?.paused));
    if (interruptCurrent && reading) stopReading();
    else if (cancelPendingSpeech) { utterance = null; cancelGoogle(); }
    queue = nextQueue;
    readingPaused = false; resumeText = ""; queueIndex = fromBlock ? queue.indexOf(fromBlock) : 0;
    reading = true; readingPaused = false; syncPauseShortcutState(); shortcutBannerVisible = true; clearTimeout(barHideTimer); bar.classList.remove("lhn-hiding"); bar.classList.add("lhn-show"); syncBarLayout(); syncToolbar();
    if (!flagFontRequested) { flagFontRequested = true; void prepareFlagFont(); }
    document.dispatchEvent(new Event("lhn-bilingual-reader-started"));
    if (cancelPendingSpeech) speakAfterCancel(); else speakNext();
  }
  function moveReading(delta, event) {
    if (!reading) return;
    event.preventDefault();
    const navigationButton = $br(delta < 0 ? "[data-prev]" : "[data-next]");
    navigationButton.classList.remove("lhn-br-key-press"); void navigationButton.offsetWidth; navigationButton.classList.add("lhn-br-key-press");
    window.setTimeout(() => navigationButton.classList.remove("lhn-br-key-press"), 190);
    const nextIndex = queueIndex + delta;
    if (nextIndex < 0 || nextIndex >= queue.length || !queue[nextIndex]) return;
    speechDetectionRequest++;
    utterance = null;
    readingPaused = false; resumeText = "";
    syncPauseShortcutState(); syncToolbar();
    synth?.cancel();
    queueIndex = nextIndex;
    speakAfterCancel();
  }
  function getBlockNearPointer() {
    if (!lastPointer) return null;
    const candidates = blocks();
    let element = document.elementFromPoint(lastPointer.x, lastPointer.y);
    while (element && element !== document.body && !candidates.includes(element)) element = element.parentElement;
    if (element && element !== document.body && element !== document.documentElement) return element;
    let best = null, distance = Infinity;
    for (const block of blocks()) { const rect = block.getBoundingClientRect(); if (!rect.width && !rect.height) continue; const dx = Math.max(rect.left-lastPointer.x, 0, lastPointer.x-rect.right), dy = Math.max(rect.top-lastPointer.y, 0, lastPointer.y-rect.bottom), d = Math.hypot(dx,dy); if (d < distance) { best=block; distance=d; } }
    return best;
  }
  function toggleNearPointer() {
    const block = getBlockNearPointer(); if (!block) return;
    const card = block.querySelector(":scope > .lhn-bilingual-card"); card ? card.remove() : translateBlock(block);
  }
  function notifySpeed(rate) { if (rate !== null) showBarToast(`${popupText("readerSpeedShort")} ${Number(rate).toFixed(2)}x`); }
  document.addEventListener("mousemove", event => { lastPointer = { x:event.clientX, y:event.clientY }; }, { passive:true });
  // Bottom bar long-press Đọc menu (touch-ui.js): read / change the same speed the Reader bar uses.
  globalThis.LHN_READER_BAR = Object.freeze({
    rate:() => currentSegmentRate(),
    stepRate:delta => setSpeechSpeed(currentSegmentRate() + delta),
    autoVoice:() => settings.autoDetectVoice !== false,
    webFont:() => settings.webFontFamily === "'Inter', sans-serif",
    setWebFont:enabled => { saveWebsiteFont(!!enabled); syncToolbar(); },
    // v3.5.160: the Trình đọc row of the Keepit main sheet (touch) — same switches as the Reader's own ☰ tiles
    tileOn:key => readerTileOn(key),
    toggleTile:key => { const on = !readerTileOn(key); setReaderTile(key, on); return on; },
    // v3.5.165: the block "Dịch đoạn" would translate under a finger (touch-ui swipe-left) — same test as the Reader's own
    // blocks (isTextBlock: p/li/h*/…, leaf div/section text, any element with its own text); a point in the gap between two
    // paragraphs takes the nearer one (±8 / ±16px)
    blockAt:(x, y) => {
      for (const dy of [0, -8, 8, -16, 16]) {
        for (let el = document.elementFromPoint(x, y + dy); el && el !== document.body && el !== document.documentElement; el = el.parentElement) if (isTextBlock(el)) return el;
      }
      return null;
    }
  });
  document.addEventListener("lhn-bilingual-reader-command", event => {
    if (event.detail === "stop-reading") { closeReadingBar(); return; }
    if (event.detail === "toggle-lazy" || event.detail === "toggle-near-pointer") sameLangToastShown = false; // cho phép hiện lại toast khi bấm lại Alt+A/Alt+D
    if (event.detail === "toggle-lazy") toggleLazy();
    if (event.detail === "toggle-near-pointer") toggleNearPointer();
    if (event.detail === "toggle-reading") reading ? closeReadingBar() : startReading();
    if (event.detail === "previous-reading-block") moveReading(-1, event);
    if (event.detail === "next-reading-block") moveReading(1, event);
    if (event.detail === "increase-reading-speed") { event.preventDefault(); if (reading) notifySpeed(setSpeechSpeed(currentSegmentRate() + normalizeSpeedStep(settings.speechSpeedStep))); }
    if (event.detail === "decrease-reading-speed") { event.preventDefault(); if (reading) notifySpeed(setSpeechSpeed(currentSegmentRate() - normalizeSpeedStep(settings.speechSpeedStep))); }
    if (event.detail === "open-voice-select" && reading && bar.classList.contains("lhn-show")) { event.preventDefault(); toggleSheet("voices"); }
  });
  document.addEventListener("lhn-bilingual-reader-pause", event => {
    if (!reading) return;
    animatePlayButton();
    if (event.detail) {
      if (!readingPaused) {
        resumeText = currentReadText.slice(Math.max(0, Math.min(currentReadCharIndex, currentReadText.length)));
        readingPaused = true; utterance = null; if (googleToken) { googleAudio?.pause(); synth?.pause(); } else synth?.cancel();
      }
      syncPauseShortcutState(); syncToolbar(); event.preventDefault();
    } else if (readingPaused) {
      readingPaused = false;
      if (googleToken) { syncPauseShortcutState(); syncToolbar(); resumeGoogle(); }
      else { const remaining = resumeText; resumeText = ""; syncPauseShortcutState(); syncToolbar(); speakAfterCancel(remaining || null); }
      event.preventDefault();
    } else {
      syncPauseShortcutState(); event.preventDefault();
    }
  });
  document.addEventListener("lhn-website-disabled-change", event => {
    websiteDisabled = Boolean(event.detail);
    if (websiteDisabled) {
      lazyObserver?.disconnect(); stopReading();
      document.querySelectorAll(".lhn-bilingual-card").forEach(node => node.remove());
      removeAllReaderSpeakers();
      document.querySelectorAll(".lhn-bilingual-web-font").forEach(node => node.classList.remove("lhn-bilingual-web-font"));
    } else {
      mainBlocksDirty = true;
      applyWebFont();
      if (settings.enableTTS && !isReaderDisabledOnThisWebsite()) updateSpeakers();
      if (window.__lhnBilingualLazy) observeLazy();
    }
  });
  browser.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    if (changes[DEMO_PROFILE_KEY]) { accountProfile = changes[DEMO_PROFILE_KEY].newValue || null; syncToolbar(); }
    if (changes[SETTINGS_KEY]) { const voice = { voiceMode:settings.voiceMode, browserVoiceURI:settings.browserVoiceURI, readLanguage:settings.readLanguage }; applySettings(changes[SETTINGS_KEY].newValue); settings = { ...settings, ...voice }; selectedVoice = systemVoices.find(item => item.voiceURI === settings.browserVoiceURI) || null; syncToolbar(); }
    if (changes[TARGET_LANGUAGE_KEY]) {
      targetLanguage = changes[TARGET_LANGUAGE_KEY].newValue?.targetLanguage || "auto";
      document.querySelectorAll(".lhn-bilingual-card").forEach(card => { const block = card.parentElement; if (block) translateBlock(block, true); });
    }
    if (changes[DISPLAY_SETTINGS_KEY]) {
      const previousVoiceMode = settings.voiceMode, previousVoiceURI = settings.browserVoiceURI, previousReadLanguage = settings.readLanguage || "";
      dashboardShortcuts = changes[DISPLAY_SETTINGS_KEY].newValue || {};
      displayLang = globalThis.LHN_LANGUAGES?.languageFor?.(changes[DISPLAY_SETTINGS_KEY].newValue) || displayLang;
      applySharedSpeechRate();
      const nextVoiceMode = dashboardShortcuts.voiceMode === "browser" || (!dashboardShortcuts.voiceMode && dashboardShortcuts.speechVoice === "browser") ? "browser" : "google";
      settings = { ...settings, voiceMode:nextVoiceMode, browserVoiceURI:String(dashboardShortcuts.browserVoiceURI || ""), readLanguage:nextVoiceMode === "google" ? String(dashboardShortcuts.readLanguage || "") : "" };
      selectedVoice = systemVoices.find(voice => voice.voiceURI === settings.browserVoiceURI) || null;
      if (reading && !readingPaused && (previousVoiceMode !== settings.voiceMode || previousVoiceURI !== settings.browserVoiceURI || previousReadLanguage !== settings.readLanguage)) restartCurrentSpeech();
      addonThemePreference = ["light","dark","system"].includes(changes[DISPLAY_SETTINGS_KEY].newValue?.sidebarTheme) ? changes[DISPLAY_SETTINGS_KEY].newValue.sidebarTheme : "system";
      renderPopupText();
      syncToolbar();
      document.querySelectorAll(".lhn-bilingual-card").forEach(card => { const block = card.parentElement; if (block) translateBlock(block, true); });
    }
  });
  const readerRateSettingsReady = browser.storage.local.get([SETTINGS_KEY, DISPLAY_SETTINGS_KEY, TARGET_LANGUAGE_KEY, DEMO_PROFILE_KEY]).then(async data => {
    dashboardShortcuts = data[DISPLAY_SETTINGS_KEY] || {};
    displayLang = globalThis.LHN_LANGUAGES?.languageFor?.(data[DISPLAY_SETTINGS_KEY]) || displayLang;
    addonThemePreference = ["light","dark","system"].includes(data[DISPLAY_SETTINGS_KEY]?.sidebarTheme) ? data[DISPLAY_SETTINGS_KEY].sidebarTheme : "system";
    targetLanguage = data[TARGET_LANGUAGE_KEY]?.targetLanguage || "auto";
    accountProfile = data[DEMO_PROFILE_KEY] || null;
    let voiceSettings = { voiceMode:"google", browserVoiceURI:"" };
    try { voiceSettings = await LHN_TTS.getVoiceSettings(); } catch {}
    const savedReaderSettings = data[SETTINGS_KEY] || {};
    const savedReaderSites = Array.isArray(savedReaderSettings.readerDisabledWebsites) ? savedReaderSettings.readerDisabledWebsites : [];
    const seedReaderSites = savedReaderSettings.readerDefaultSitesSeeded !== true;
    const mergedReaderSettings = { ...DEFAULTS, ...savedReaderSettings, readerDisabledWebsites:seedReaderSites ? [...new Set([...(globalThis.LHN_CONFIG?.DEFAULT_READER_DISABLED_WEBSITES || []), ...savedReaderSites])] : savedReaderSites, readerDefaultSitesSeeded:true };
    // Tốc độ đọc chỉ có một nguồn: lhnSettings. Lần đầu chạy bản mới, nếu Dashboard còn ở mặc định
    // 1.0 mà Reader đã có speechSpeed cũ thì đưa giá trị cũ sang speechRate, rồi bỏ khóa cũ.
    const sharedSpeechRate = Number(data[DISPLAY_SETTINGS_KEY]?.speechRate);
    const legacyReaderRate = Number(savedReaderSettings.speechSpeed);
    if (savedReaderSettings.speechSpeedSynced !== true) {
      if (Number.isFinite(legacyReaderRate) && legacyReaderRate !== 1 && (!Number.isFinite(sharedSpeechRate) || sharedSpeechRate === 1)) writeSharedSpeechRate(Math.max(.5, Math.min(3, legacyReaderRate)));
      mergedReaderSettings.speechSpeedSynced = true;
    }
    if (Object.hasOwn(mergedReaderSettings, "speechSpeed")) delete mergedReaderSettings.speechSpeed;
    // Lần đầu chạy bản mặc định-bật: các bản lưu trước đã ghi cứng readTranslation:false nên phải bật lại một lần.
    const readTranslationDefaultNeedsOn = savedReaderSettings.readTranslationDefaultOn !== true;
    if (readTranslationDefaultNeedsOn) { mergedReaderSettings.readTranslation = true; mergedReaderSettings.readTranslationDefaultOn = true; }
    if (seedReaderSites || savedReaderSettings.speechSpeedSynced !== true || readTranslationDefaultNeedsOn) browser.storage.local.set({ [SETTINGS_KEY]:mergedReaderSettings }).catch(() => {});
    applySettings({ ...mergedReaderSettings, ...voiceSettings });
    renderPopupText();
    systemVoices = synth?.getVoices?.() || [];
    selectedVoice = systemVoices.find(voice => voice.voiceURI === settings.browserVoiceURI) || null;
    syncToolbar();
  }).catch(() => applySettings(DEFAULTS));
  globalThis.LHN_READER_SPEECH_RATE = Object.freeze({
    clamp: clampSpeechRate,
    getRate: async (lang) => { await readerRateSettingsReady; return segmentRate(lang); },
    setRate: async (value, lang) => { await readerRateSettingsReady; return setSpeechSpeed(value, lang); },
  });
  window.matchMedia?.("(prefers-color-scheme: dark)").addEventListener?.("change", syncToolbar);
  let pageMutationTimer = 0;
  function shouldObserveReaderMutations() {
    return !websiteDisabled && ((settings.enableTTS && !isReaderDisabledOnThisWebsite()) || Boolean(window.__lhnBilingualLazy));
  }
  const pageObserver = new MutationObserver(records => {
    if (!shouldObserveReaderMutations()) return;
    const isOwn = node => node?.nodeType === 1 && (node.matches?.(".lhn-bilingual-card,.lhn-bilingual-speaker,#lhn-bilingual-reading-bar,#lhn-br-spacer,#lhn-bilingual-reader-debug-style") || node.closest?.(".lhn-bilingual-card,.lhn-bilingual-speaker,#lhn-bilingual-reading-bar,#lhn-bilingual-reader-debug-style"));
    const hasPageChange = records.some(record => !isOwn(record.target) && [...record.addedNodes, ...record.removedNodes].some(node => !isOwn(node)));
    if (!hasPageChange) return;
    clearTimeout(pageMutationTimer);
    mainBlocksDirty = true; pageMutationTimer = setTimeout(() => {
      if (!shouldObserveReaderMutations()) return;
      readerBlocks(true);
      if (settings.enableTTS && !isReaderDisabledOnThisWebsite()) updateSpeakers();
      if (window.__lhnBilingualLazy) observeLazy();
      syncToolbar();
    }, 900);
  });
  pageObserver.observe(document.documentElement, { childList:true, subtree:true });
})();
