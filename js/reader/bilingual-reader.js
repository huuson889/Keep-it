(() => {
  if (window.__lhnBilingualReaderLoaded) return;
  window.__lhnBilingualReaderLoaded = true;
  const SETTINGS_KEY = "lhnBilingualReaderSettings";
  const TARGET_LANGUAGE_KEY = "lhnStudyTranslationSettings";
  const DEMO_PROFILE_KEY = "lhnDashboardDemoProfile";
  const DISPLAY_SETTINGS_KEY = globalThis.LHN_CONFIG?.STORAGE_KEYS?.SETTINGS || "lhnSettings";
  const DEFAULTS = { accentColor:"#9c27b0", fontFamily:"'Inter', sans-serif", webFontFamily:"", translationTextColor:"default", translationCustomColor:"#2d3748", translationTextWeight:"auto", translationFontScale:80, skipSameLang:true, autoScroll:true, enableTTS:true, speakerIconVisibility:"hover", readTranslation:false, speechSpeedStep:0.25, voiceMode:"google", browserVoiceURI:"", readerShortcutsEnabled:true, autoDetectVoice:true, widgetDarkMode:null, excludeSelectors:[], readerDisabledWebsites:globalThis.LHN_CONFIG?.DEFAULT_READER_DISABLED_WEBSITES || [], readerDefaultSitesSeeded:true };
  let settings = { ...DEFAULTS }, targetLanguage = "auto", displayLang = globalThis.LHN_LANGUAGES?.detectLanguage?.() || "en", lastPointer = null, lazyObserver = null, reading = false, readingPaused = false, resumeText = "", currentReadText = "", currentReadCharIndex = 0, websiteDisabled = false, queue = [], queueIndex = 0, utterance = null, selectedVoice = null, activeVoice = null, activeSpeechLang = "", systemVoices = [];
  let webFontRequestId = 0, loadedWebFontFamily = "", fontStylesheetReady = Promise.resolve(), accountProfile = null, addonThemePreference = "system", dashboardShortcuts = {};
  let speechDetectionRequest = 0;
  let voiceKbIndex = -1;
const FLAG_SVGS = {
      ...(globalThis.LHN_FLAGS?.svgs || {}),
      us: `<svg class="w-full h-full object-cover" viewBox="0 0 512 512"><g fill-rule="evenodd"><path fill="#bd3d44" d="M0 0h512v512H0z"/><path fill="#fff" d="M0 39.3h512v39.4H0zm0 78.7h512v39.4H0zm0 78.8h512v39.4H0zm0 78.8h512v39.3H0zm0 78.7h512v39.4H0zm0 78.8h512v39.4H0z"/><path fill="#192f5d" d="M0 0h240v275.6H0z"/><g fill="#fff"><path d="M22.5 13.5l2.4 7.3h7.7l-6.2 4.5 2.4 7.3-6.3-4.5-6.2 4.5 2.3-7.3-6.2-4.5h7.6zm52.5 0l2.4 7.3h7.7l-6.2 4.5 2.3 7.3-6.2-4.5-6.2 4.5 2.3-7.3-6.2-4.5h7.6zm52.5 0l2.4 7.3h7.7l-6.2 4.5 2.3 7.3-6.2-4.5-6.2 4.5 2.3-7.3-6.2-4.5h7.6zm52.5 0l2.4 7.3h7.7l-6.2 4.5 2.3 7.3-6.2-4.5-6.2 4.5 2.3-7.3-6.2-4.5h7.6z"/></g></g></svg>`,
      uk: `<svg class="w-full h-full object-cover" viewBox="0 0 512 512"><path fill="#00247d" d="M0 0h512v512H0z"/><path fill="#fff" d="M0 0l512 512M512 0L0 512" stroke="#fff" stroke-width="60"/><path fill="#c8102e" d="M0 0l512 512M512 0L0 512" stroke="#c8102e" stroke-width="30"/><path fill="#fff" d="M256 0v512M0 256h512" stroke="#fff" stroke-width="100"/><path fill="#c8102e" d="M256 0v512M0 256h512" stroke="#c8102e" stroke-width="60"/></svg>`,
      vn: `<svg class="w-full h-full object-cover" viewBox="0 0 512 512"><rect width="512" height="512" fill="#da251d"/><polygon points="256,110 297,237 431,237 323,316 364,443 256,364 148,443 189,316 81,237 215,237" fill="#ffff00"/></svg>`,
      fr: `<svg class="w-full h-full object-cover" viewBox="0 0 512 512"><rect width="170.7" height="512" fill="#002395"/><rect x="170.7" width="170.7" height="512" fill="#fff"/><rect x="341.4" width="170.7" height="512" fill="#ed2939"/></svg>`,
      de: `<svg class="w-full h-full object-cover" viewBox="0 0 512 512"><rect width="512" height="170.7" fill="#000"/><rect y="170.7" width="512" height="170.7" fill="#dd0000"/><rect y="341.4" width="512" height="170.7" fill="#ffce00"/></svg>`,
      jp: `<svg class="w-full h-full object-cover" viewBox="0 0 512 512"><rect width="512" height="512" fill="#fff"/><circle cx="256" cy="256" r="150" fill="#bc002d"/></svg>`,
      es: `<svg class="w-full h-full object-cover" viewBox="0 0 512 512"><rect width="512" height="128" fill="#c60b1e"/><rect y="128" width="512" height="256" fill="#ffc400"/><rect y="384" width="512" height="128" fill="#c60b1e"/></svg>`
    };
  const FLAG_REGION_KEYS = { ...(globalThis.LHN_FLAGS?.regionKeys || {}), US:'us', GB:'uk', VN:'vn', FR:'fr', DE:'de', JP:'jp', ES:'es' };
  const flagSvgForRegion = region => FLAG_SVGS[FLAG_REGION_KEYS[region] || 'us'];
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
    .lhn-bilingual-speaker{display:inline-flex;align-items:center;justify-content:center;margin-left:8px;color:#868e96;cursor:pointer;font-size:.8em;vertical-align:middle;user-select:none}
    .lhn-bilingual-speaker[data-reader-scope="false"]{display:none!important}
    .lhn-bilingual-speaker[data-reader-scope="false"][data-visibility="always"]{display:inline-flex!important;visibility:hidden;opacity:0;pointer-events:none;transition:opacity .12s ease,visibility .12s ease}
    :hover>.lhn-bilingual-speaker[data-reader-scope="false"][data-visibility="always"]{visibility:visible;opacity:1;pointer-events:auto}
    .lhn-bilingual-speaker:hover{color:var(--lhn-br-accent);transform:scale(1.2)}
    .lhn-bilingual-speaker[data-visibility="hover"]{visibility:hidden;opacity:0;pointer-events:none;transition:opacity .12s ease,visibility .12s ease}
    :hover>.lhn-bilingual-speaker[data-visibility="hover"]{visibility:visible;opacity:1;pointer-events:auto}
    .lhn-bilingual-speaker[data-visibility="reading"]{display:none}
    .lhn-bilingual-speaker[data-visibility="reading"][data-reading="true"]{display:inline-flex}
    :hover>.lhn-bilingual-speaker[data-visibility="reading"]{display:inline-flex;visibility:visible;opacity:1;pointer-events:auto}
    :hover>.lhn-bilingual-speaker[data-reader-scope="false"]{display:inline-flex!important;visibility:visible;opacity:1;pointer-events:auto}
    .lhn-bilingual-card{display:block;margin:8px 0;padding:10px 14px;border-left:4px solid var(--lhn-br-accent);background:rgba(var(--lhn-br-accent-rgb),.04);border-radius:0 8px 8px 0;font-family:var(--lhn-br-font);font-size:max(16px,var(--translation-scale,80%))!important;line-height:1.6;color:var(--lhn-br-translation-color,#2d3748);font-weight:var(--lhn-br-translation-weight,400);box-shadow:0 1px 3px rgba(0,0,0,.02);animation:lhnBrFade .25s ease-in-out}
    .lhn-bilingual-web-font{font-family:var(--lhn-br-web-font)!important}
    .lhn-bilingual-reading{outline:2px solid var(--lhn-br-accent)!important;outline-offset:4px;background-color:rgba(var(--lhn-br-accent-rgb),.08)!important;border-radius:6px}
    #lhn-bilingual-reading-bar,#lhn-bilingual-reading-bar *{font-family:var(--lhn-app-font-family,'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif)!important}
    #lhn-bilingual-reading-bar{position:fixed;left:50%;bottom:12px;transform:translateX(-50%);z-index:2147483646;display:none;align-items:center;gap:6px;padding:7px 10px;border:1px solid rgba(148,163,184,.35);border-radius:999px;background:#fff;color:#334155;font:500 13px/1.2 var(--lhn-app-font-family,'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif);box-shadow:0 0 10px rgba(15, 23, 42, 0.33);user-select:none}
    #lhn-bilingual-reading-bar.lhn-show{display:flex;animation:lhnBrSlide .25s ease}
    #lhn-bilingual-reading-bar button{position:relative;border:0;border-radius:999px;padding:7px;background:transparent;color:inherit;font:inherit;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;min-width:32px;height:32px}
    #lhn-bilingual-reading-bar button:hover{background:rgba(148,163,184,.18)}
    #lhn-bilingual-reading-bar button.lhn-br-key-press{animation:lhnBrButtonPress .18s ease-out}
    #lhn-bilingual-reading-bar [data-drag]{cursor:grab;touch-action:none}
    #lhn-bilingual-reading-bar [data-drag]:active{cursor:grabbing}
    #lhn-bilingual-reading-bar button:disabled{opacity:.35;cursor:default}
    #lhn-bilingual-reading-bar .lhn-br-play{width:40px;height:40px;background:var(--lhn-br-accent);color:white;box-shadow:0 3px 9px rgba(var(--lhn-br-accent-rgb),.3);transition:filter .15s ease,box-shadow .15s ease,transform .15s ease}
    #lhn-bilingual-reading-bar button.lhn-br-play:hover{background:var(--lhn-br-accent);filter:brightness(1.04);box-shadow:0 4px 11px rgba(var(--lhn-br-accent-rgb),.36);transform:translateY(-1px)}
    #lhn-bilingual-reading-bar .lhn-br-speed{font-weight:700;min-width:48px}
    #lhn-bilingual-reading-bar .lhn-br-time{color:#64748b;min-width:24px;text-align:center}
    #lhn-bilingual-reading-bar [data-lhn-br-popover]{position:absolute;bottom:calc(100% + 12px);left:50%;transform:translateX(-50%);display:none;width:390px;padding:0;border:1px solid #f1f5f9;border-radius:16px;background:#fff!important;color:#1e293b;box-shadow:0 18px 42px rgba(15,23,42,.22);user-select:text;overflow:hidden;opacity:1!important;backdrop-filter:none!important;z-index:3}
    #lhn-bilingual-reading-bar [data-lhn-br-popover].lhn-open{display:block;overflow-x:hidden}
    #lhn-bilingual-reading-bar [data-lhn-br-popover="settings"]{left:auto;right:0;transform:none}
    #lhn-bilingual-reading-bar .lhn-br-pop-head{display:flex;align-items:center;justify-content:space-between;padding:15px 18px;border-bottom:1px solid #f1f5f9}
    #lhn-bilingual-reading-bar .lhn-br-pop-title{font-size:18px;font-weight:700;margin:0}
    #lhn-bilingual-reading-bar .lhn-br-pop-body{padding:12px 16px;max-height:360px;overflow-y:auto;overflow-x:hidden;box-sizing:border-box}
    #lhn-bilingual-reading-bar input[type=search]{box-sizing:border-box;width:100%;padding:10px 12px;border:1px solid transparent;border-radius:11px;background:#f1f5f9;font:inherit;margin-bottom:8px}
    #lhn-bilingual-reading-bar .lhn-br-pop-body[data-voice-pop-body]{max-height:none;overflow:hidden}
    #lhn-bilingual-reading-bar .lhn-br-voice-list{max-height:min(300px,calc(100vh - 220px));overflow-y:auto;overflow-x:hidden;direction:ltr;scrollbar-width:thin;scrollbar-color:#cbd5e1 #f1f1f1}
    #lhn-bilingual-reading-bar .lhn-br-voice-list::-webkit-scrollbar{width:6px}
    #lhn-bilingual-reading-bar .lhn-br-voice-list::-webkit-scrollbar-track{background:#f1f1f1;border-radius:4px}
    #lhn-bilingual-reading-bar .lhn-br-voice-list::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:4px}
    #lhn-bilingual-reading-bar .lhn-br-voice{width:100%;height:auto;min-height:58px;justify-content:flex-start;gap:14px;border-radius:16px;text-align:left;padding:9px 12px;font-size:14px;font-weight:700}
    #lhn-bilingual-reading-bar .lhn-br-voice.lhn-selected{background:#f1f3f5;box-shadow:0 2px 5px rgba(15,23,42,.06)}
    #lhn-bilingual-reading-bar .lhn-br-voice-group{padding:10px 12px 4px;font-size:12px;font-weight:700;color:#64748b}
    #lhn-bilingual-reading-bar .lhn-br-voice.lhn-kb-active{background:rgba(148,163,184,.18);box-shadow:inset 0 0 0 2px var(--lhn-br-accent)}
    #lhn-bilingual-reading-bar .lhn-br-voice>span:first-child{font-size:30px;line-height:1}
    #lhn-bilingual-reading-bar .lhn-br-voice{direction:ltr}
    #lhn-bilingual-reading-bar .lhn-br-flag{display:inline-flex;flex:none;width:30px;height:30px;overflow:hidden;border:1px solid #e2e8f0;border-radius:50%;box-shadow:0 1px 2px #0002;align-items:center;justify-content:center}
    #lhn-bilingual-reading-bar .lhn-br-flag svg{display:block;width:100%;height:100%;object-fit:cover}
    #lhn-bilingual-reading-bar [data-voices] .lhn-br-flag{width:26px;height:26px}
    #lhn-bilingual-reading-bar .lhn-br-voice>span:nth-child(2){flex:1}
    #lhn-bilingual-reading-bar .lhn-br-voice small{display:block;color:#64748b}
    #lhn-bilingual-reading-bar .lhn-br-account{width:100%;height:auto;justify-content:space-between;border-radius:8px;padding:10px 4px;text-align:left;white-space:normal}
    #lhn-bilingual-reading-bar [data-shortcut-banner]{position:absolute;bottom:calc(100% + 4px);left:50%;transform:translateX(-50%);width:max-content;max-width:calc(100vw - 16px);box-sizing:border-box;padding:0px 12px;border-radius:14px;background:#fff;color:#64748b;font-size:14px;border: 1px solid rgba(124, 124, 124, 0.35);box-shadow:0 0 10px rgba(15, 23, 42, 0.33);display:flex;align-items:center;justify-content:space-between;gap:12px;white-space:nowrap}
    #lhn-bilingual-reading-bar [data-shortcut-banner] b{color:var(--lhn-br-accent)}
    #lhn-bilingual-reading-bar [data-hide-banner]{margin:0 -14px}
    #lhn-bilingual-reading-bar [data-shortcut-banner][hidden]{display:none}
    #lhn-bilingual-reading-bar.lhn-dark [data-shortcut-banner]{background:#1e293b;color:#cbd5e1}
    #lhn-bilingual-reading-bar .lhn-br-range{width:100%;accent-color:var(--lhn-br-accent)}
    #lhn-bilingual-reading-bar .lhn-br-presets{display:flex;gap:4px;justify-content:space-between;margin-top:8px}
    #lhn-bilingual-reading-bar .lhn-br-presets button{min-width:0;height:auto;padding:6px;font-size:11px}
    #lhn-bilingual-reading-bar .lhn-br-setting{display:flex;align-items:center;justify-content:space-between;padding:7px 0}
    #lhn-bilingual-reading-bar [data-lhn-br-popover="settings"] .lhn-br-pop-head{padding-bottom:8px}
    #lhn-bilingual-reading-bar [data-lhn-br-popover="settings"] .lhn-br-pop-body{max-height:min(480px,calc(100vh - 112px));padding:5px 16px;font-size:13px}
    #lhn-bilingual-reading-bar [data-lhn-br-popover="settings"] .lhn-br-setting{padding:3px 0;text-align:left}
    #lhn-bilingual-reading-bar [data-lhn-br-popover="settings"] .lhn-br-setting>span:first-child{flex:1;text-align:left}
    #lhn-bilingual-reading-bar [data-lhn-br-popover="settings"] .lhn-br-setting .lhn-br-toggle{flex:none}
    #lhn-bilingual-reading-bar [data-lhn-br-popover="settings"] .lhn-br-account{padding:4px 0}
    #lhn-bilingual-reading-bar [data-lhn-br-popover="settings"] .lhn-br-pop-foot{padding-top:4px}
    #lhn-bilingual-reading-bar .lhn-br-settings-divider{border:0;border-top:1px solid #cbd1d8;}
    #lhn-bilingual-reading-bar .lhn-br-setting input[type=number]{box-sizing:border-box;width:76px;padding:5px 7px;border:1px solid #cbd5e1;border-radius:7px;background:#fff;color:#1e293b;font:inherit}
    #lhn-bilingual-reading-bar .lhn-br-toggle{appearance:none;width:42px;height:23px;border-radius:20px;background:#e2e8f0;position:relative;cursor:pointer;transition:background .15s}
    #lhn-bilingual-reading-bar .lhn-br-toggle:checked{background:var(--lhn-br-accent)}
    #lhn-bilingual-reading-bar .lhn-br-toggle:after{content:"";position:absolute;width:19px;height:19px;left:2px;top:2px;border-radius:50%;background:#fff;box-shadow:0 1px 3px #0002;transition:transform .15s}
    #lhn-bilingual-reading-bar .lhn-br-toggle:checked:after{transform:translateX(19px)}
    #lhn-bilingual-reading-bar .lhn-br-pop-foot{padding:10px 16px;background:#f8fafc;border-top:1px solid #f1f5f9;color:#64748b;font-size:11px}
    #lhn-bilingual-reading-bar.lhn-dark{background:rgba(30,41,59,.97);color:#e2e8f0;border-color:#475569}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-time{color:#94a3b8}
    #lhn-bilingual-reading-bar.lhn-dark [data-lhn-br-popover]{background:#1e293b!important;color:#e2e8f0;border-color:#475569}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-pop-head,#lhn-bilingual-reading-bar.lhn-dark .lhn-br-pop-foot{border-color:#334155}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-pop-foot{background:#0f172a;color:#94a3b8}
    #lhn-bilingual-reading-bar.lhn-dark input[type=search]{background:#0f172a;color:#e2e8f0;border-color:#475569}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-setting input[type=number]{background:#0f172a;color:#e2e8f0;border-color:#475569}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-voice small{color:#94a3b8}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-voice.lhn-selected{background:#334155}
    #lhn-bilingual-reading-bar.lhn-dark .lhn-br-voice-group{color:#94a3b8}
    @keyframes lhnBrFade{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}@keyframes lhnBrSlide{from{opacity:0}to{opacity:1}}@keyframes lhnBrButtonPress{35%{transform:scale(.84);background:rgba(148,163,184,.38)}100%{transform:scale(1)}}
  `;
  (document.head || document.documentElement).appendChild(style);
  const bar = document.createElement("div");
  bar.id = "lhn-bilingual-reading-bar"; bar.setAttribute("aria-live", "polite");
  bar.setAttribute("data-lhn-bilingual-ui", "true");
  bar.innerHTML = `<div data-shortcut-banner><span><b>Space</b> pause · <b>↑/↓</b> speed ±0.15x · <b>←/→</b> previous/next · <b>Alt+R</b> close</span><button type="button" data-hide-banner aria-label="Hide shortcut hint">×</button></div><button type="button" data-drag title="Drag controls" aria-label="Drag controls"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/></svg></button><button class="lhn-br-play" type="button" data-play title="Play/Pause"><span data-play-icon>▶</span></button><button type="button" data-prev title="Previous paragraph" aria-label="Previous paragraph"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m11 19-7-7 7-7"/><path d="m20 19-7-7 7-7"/></svg></button><button type="button" data-next title="Next paragraph" aria-label="Next paragraph"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m4 5 7 7-7 7"/><path d="m13 5 7 7-7 7"/></svg></button><span style="height:22px;border-left:1px solid #cbd5e1;margin:0 2px"></span><button type="button" data-voices title="Select voice" aria-label="Select voice">🌐</button><button class="lhn-br-speed" type="button" data-speed title="Playback speed">1.0x</button><span class="lhn-br-time" data-time title="Estimated remaining time">—</span><span style="height:22px;border-left:1px solid #cbd5e1;margin:0 2px"></span><button type="button" data-pdf title="PDF Document View" aria-label="PDF Document View"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h8"/></svg></button><button type="button" data-dashboard title="Account / Dashboard" aria-label="Account / Dashboard"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M5 21a7 7 0 0 1 14 0"/></svg></button><button type="button" data-settings title="Settings" aria-label="Settings"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"/><circle cx="12" cy="12" r="3"/></svg></button><button type="button" data-close title="Stop reading" aria-label="Stop reading">×</button><section data-lhn-br-popover="voices"><header class="lhn-br-pop-head"><h4 class="lhn-br-pop-title">Select Voice</h4><button type="button" data-close-pop aria-label="Close">×</button></header><div class="lhn-br-pop-body" data-voice-pop-body><input type="search" placeholder="Search country / voice" aria-label="Search country / voice"><div class="lhn-br-voice-list"></div></div></section><section data-lhn-br-popover="speed"><header class="lhn-br-pop-head"><h4 class="lhn-br-pop-title">Reading Speed <span data-speed-value>1.0x</span></h4><button type="button" data-close-pop aria-label="Close">×</button></header><div class="lhn-br-pop-body"><input class="lhn-br-range" type="range" min="0.5" max="3" step="any" value="1" aria-label="Reading speed"><div class="lhn-br-presets">${[0.75,1,1.25,1.5,2].map(value=>`<button type="button" data-preset="${value}">${formatSpeed(value)}</button>`).join("")}</div></div></section><section data-lhn-br-popover="settings"><header class="lhn-br-pop-head"><h4 class="lhn-br-pop-title">Settings</h4><button type="button" data-close-pop aria-label="Close">×</button></header><div class="lhn-br-pop-body"><label class="lhn-br-setting">Auto scroll<input class="lhn-br-toggle" type="checkbox" data-autoscroll></label><label class="lhn-br-setting">Paragraph play buttons<input class="lhn-br-toggle" type="checkbox" data-parabtn></label><label class="lhn-br-setting">Keyboard shortcuts<input class="lhn-br-toggle" type="checkbox" data-shortcuts></label><label class="lhn-br-setting">Auto-detect language<input class="lhn-br-toggle" type="checkbox" data-autolang></label><label class="lhn-br-setting">Speed step<input type="number" min="0.01" max="2.5" step="0.01" value="0.25" data-speed-step></label><label class="lhn-br-setting">Match theme to background<input class="lhn-br-toggle" type="checkbox" data-theme></label><button type="button" data-br-settings class="lhn-br-account"><span data-br-settings-label>Bilingual Reader settings</span><span>↗</span></button><label class="lhn-br-setting"><span data-webfont-label>Custom website font</span><input class="lhn-br-toggle" type="checkbox" data-webfont></label><hr class="lhn-br-settings-divider"><button type="button" data-account class="lhn-br-account"><span data-account-label>Account / Open Dashboard</span><span>↗</span></button><hr class="lhn-br-settings-divider"></div><footer class="lhn-br-pop-foot"><b>Space</b> pause · <b>← / →</b> previous/next · <b>Alt+R</b> close</footer></section>`;
  bar.querySelector('[data-lhn-br-popover="voices"]').id = "voice-popup";
  const popover = name => bar.querySelector(`[data-lhn-br-popover="${name}"]`);
  // Focus ô tìm kiếm của Select voice trên mọi trình duyệt Chromium (Chrome, Edge, ...) và Firefox: thử lại vài lần vì có trình duyệt chưa nhận focus ngay sau khi popover hiện
  function focusVoiceSearch() {
    const input = bar.querySelector('input[type="search"]'); if (!input) return;
    const delays = [30, 100, 250, 500];
    const tryFocus = index => {
      if (!popover("voices").classList.contains("lhn-open")) return;
      input.focus({ preventScroll:true });
      if (input.getRootNode().activeElement === input || index >= delays.length) return;
      window.setTimeout(() => tryFocus(index + 1), delays[index]);
    };
    tryFocus(0);
  }
  const closePopovers = () => bar.querySelectorAll("[data-lhn-br-popover]").forEach(panel => panel.classList.remove("lhn-open"));
  const animatePlayButton = () => { const button = bar.querySelector("[data-play]"); button.classList.remove("lhn-br-key-press"); void button.offsetWidth; button.classList.add("lhn-br-key-press"); window.setTimeout(() => button.classList.remove("lhn-br-key-press"), 190); };
  bar.querySelector("[data-play]").addEventListener("click", () => { if (!reading) { animatePlayButton(); startReading(); } else document.dispatchEvent(new CustomEvent("lhn-bilingual-reader-pause", { detail:!readingPaused, cancelable:true })); });
  bar.querySelector("[data-prev]").addEventListener("click", event => moveReading(-1, event));
  bar.querySelector("[data-next]").addEventListener("click", event => moveReading(1, event));
  bar.querySelector("[data-close]").addEventListener("click", stopReading);
  bar.querySelectorAll("[data-voices],[data-speed],[data-settings]").forEach(button => button.addEventListener("click", () => { const name = button.hasAttribute("data-voices") ? "voices" : button.hasAttribute("data-speed") ? "speed" : "settings"; const panel = popover(name), wasOpen = panel.classList.contains("lhn-open"); closePopovers(); panel.classList.toggle("lhn-open", !wasOpen); if (name === "voices" && !wasOpen) { renderVoiceChoices(); focusVoiceSearch(); } }));
  bar.querySelector("[data-autoscroll]").addEventListener("change", event => saveSpeechSetting({ autoScroll:event.target.checked }));
  bar.querySelector("[data-webfont]").addEventListener("change", event => saveWebsiteFont(event.target.checked));
  bar.querySelector("[data-parabtn]").addEventListener("change", event => saveSpeechSetting({ speakerIconVisibility:event.target.checked ? "always" : "hover" }));
  
  bar.querySelector("[data-autolang]").addEventListener("change", event => saveSpeechSetting({ autoDetectVoice:event.target.checked }));
  bar.querySelector("[data-speed-step]").addEventListener("change", event => { const value = normalizeSpeedStep(event.target.value); event.target.value = value; saveSpeechSetting({ speechSpeedStep:value }); renderPopupText(); });
  bar.querySelector("[data-theme]").addEventListener("change", event => saveAddonThemePreference(event.target.checked ? "dark" : "light"));
  bar.querySelectorAll("[data-close-pop]").forEach(button => button.addEventListener("click", closePopovers));
  bar.querySelector("[data-dashboard]").addEventListener("click", () => LHN_MESSAGING.sendMessage({ type:"OPEN_DASHBOARD" }).catch(() => browser.runtime.openOptionsPage?.()));
  bar.querySelector("[data-br-settings]").addEventListener("click", () => LHN_MESSAGING.sendMessage({ type:"OPEN_DASHBOARD_BILINGUAL_SETTINGS" }).catch(() => browser.runtime.openOptionsPage?.()));
  bar.querySelector("[data-account]").addEventListener("click", () => LHN_MESSAGING.sendMessage({ type:"OPEN_DASHBOARD_ACCOUNT" }).catch(() => browser.runtime.openOptionsPage?.()));
  bar.querySelector("[data-hide-banner]").addEventListener("click", () => { const toggle = bar.querySelector("[data-shortcuts]"); toggle.checked = false; bar.querySelector("[data-shortcut-banner]").hidden = true; saveSpeechSetting({ readerShortcutsEnabled:false }); syncToolbar(); });
  bar.querySelector("[data-shortcuts]").addEventListener("change", event => { saveSpeechSetting({ readerShortcutsEnabled:event.target.checked }); bar.querySelector("[data-shortcut-banner]").hidden = !event.target.checked; syncToolbar(); });
  bar.querySelector("[data-speed]").addEventListener("click", () => { const rate = segmentRate(Boolean(readingSegment?.translation)); bar.querySelector("[data-speed-value]").textContent = formatSpeed(rate); bar.querySelector(".lhn-br-range").value = rate; });
  bar.querySelector(".lhn-br-range").addEventListener("input", event => setSpeechSpeed(Number(event.target.value)));
  bar.querySelectorAll("[data-preset]").forEach(button => button.addEventListener("click", () => setSpeechSpeed(Number(button.dataset.preset))));
  bar.querySelector("input[type=search]").addEventListener("input", renderVoiceChoices);
  bar.addEventListener("click", event => { if (!event.target.closest("[data-lhn-br-popover]") && !event.target.closest("[data-voices],[data-speed],[data-settings]")) closePopovers(); });
  document.addEventListener("pointerdown", event => { if (!bar.contains(event.target)) closePopovers(); }, true);
  const voiceItems = () => Array.from(bar.querySelectorAll(".lhn-br-voice-list .lhn-br-voice"));
  function setVoiceKb(index) {
    const items = voiceItems(); items.forEach(item => item.classList.remove("lhn-kb-active"));
    if (!items.length) { voiceKbIndex = -1; return; }
    voiceKbIndex = Math.max(0, Math.min(items.length - 1, index));
    items[voiceKbIndex].classList.add("lhn-kb-active"); items[voiceKbIndex].scrollIntoView({ block:"nearest" });
  }
  window.addEventListener("keydown", event => {
    if (event.isComposing || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || !popover("voices").classList.contains("lhn-open")) return;
    if (!bar.contains(event.target) && event.target?.closest?.("input,textarea,select,[contenteditable]:not([contenteditable='false'])")) return;
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
  const dragHandle = bar.querySelector("[data-drag]");
  let lastDragPointerDown = 0;
  dragHandle.addEventListener("pointerdown", event => { if (event.button !== 0) return; event.preventDefault(); const now = performance.now(); if (event.detail >= 2 || now - lastDragPointerDown < 350) { lastDragPointerDown = 0; bar.style.removeProperty("left"); bar.style.removeProperty("top"); bar.style.removeProperty("bottom"); bar.style.removeProperty("transform"); return; } lastDragPointerDown = now; const rect = bar.getBoundingClientRect(), pointerOffsetX = event.clientX - rect.left, pointerOffsetY = event.clientY - rect.top; bar.style.left = `${rect.left}px`; bar.style.top = `${rect.top}px`; bar.style.bottom = "auto"; bar.style.transform = "none"; dragHandle.setPointerCapture(event.pointerId); const move = e => { bar.style.left = `${Math.max(8,Math.min(innerWidth-rect.width-8,e.clientX-pointerOffsetX))}px`; bar.style.top = `${Math.max(8,Math.min(innerHeight-rect.height-8,e.clientY-pointerOffsetY))}px`; }; const end = () => { dragHandle.removeEventListener("pointermove",move); dragHandle.removeEventListener("pointerup",end); dragHandle.removeEventListener("pointercancel",end); }; dragHandle.addEventListener("pointermove",move); dragHandle.addEventListener("pointerup",end); dragHandle.addEventListener("pointercancel",end); });
  (document.body || document.documentElement).appendChild(bar);
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
    bar.querySelector("[data-play-icon]").textContent = reading && !readingPaused ? "Ⅱ" : "▶";
    bar.querySelector("[data-play]").title = popupText(reading && !readingPaused ? "readerPopupPause" : "readerPopupPlay");
    bar.querySelector("[data-speed]").textContent = formatSpeed(segmentRate(Boolean(readingSegment?.translation)));
    bar.querySelector("[data-webfont]").checked = settings.webFontFamily === "'Inter', sans-serif";
    bar.querySelector("[data-autoscroll]").checked = !!settings.autoScroll;
    bar.querySelector("[data-parabtn]").checked = settings.speakerIconVisibility === "always";
    bar.querySelector("[data-shortcuts]").checked = settings.readerShortcutsEnabled !== false;
    const accountLabel = bar.querySelector("[data-account-label]");
    if (accountProfile) { const name = accountProfile.displayName || accountProfile.username || "Account"; const email = accountProfile.email || ""; accountLabel.textContent = email ? `${name} · ${email}` : name; bar.querySelector("[data-account]").title = email ? `${name} (${email})` : name; } else { accountLabel.textContent = popupText("readerPopupSignIn"); bar.querySelector("[data-account]").title = popupText("readerPopupSignIn"); }
    bar.querySelector("[data-autolang]").checked = settings.autoDetectVoice !== false;
    bar.querySelector("[data-speed-step]").value = settings.speechSpeedStep;
    const totalWords = queue.map(block => rawText(block,true)).join(" ").split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1,Math.ceil(totalWords / (220 * baseRate())));
    bar.querySelector("[data-time]").textContent = totalWords ? `${minutes}${popupText("readerPopupMinute")}` : "—";
    const lang = voiceFlagOverride || readingSegment?.lang || (settings.voiceMode !== "browser" && settings.readLanguage ? LHN_TTS.normalizeLanguage(settings.readLanguage) : "") || selectedVoice?.lang || activeVoice?.lang || activeSpeechLang || queue[queueIndex]?.closest("[lang]")?.getAttribute("lang") || document.documentElement.lang || navigator.language || "";
    const parts = lang.split(/[-_]/), base = parts[0]?.toLowerCase(), region = parts.slice(1).find(part => /^[a-z]{2}$|^\d{3}$/i.test(part))?.toUpperCase() || ({ en:"US", vi:"VN", ko:"KR", ja:"JP", zh:"CN", fr:"FR", de:"DE", es:"ES", it:"IT", pt:"BR", ru:"RU", ar:"SA", hi:"IN", th:"TH" })[base];
    bar.querySelector("[data-voices]").innerHTML = `<span class="lhn-br-flag">${flagSvgForRegion(region)}</span>`;
    bar.querySelector("[data-voices]").title = (activeVoice || selectedVoice) ? `${(activeVoice || selectedVoice).name} (${(activeVoice || selectedVoice).lang})` : (settings.voiceMode !== "browser" && settings.readLanguage ? `${readLanguageName(settings.readLanguage)} (${LHN_TTS.normalizeLanguage(settings.readLanguage)})` : popupText("readerPopupSelectVoice"));
    const isDark = addonThemePreference === "dark" || (addonThemePreference !== "light" && !!window.matchMedia?.("(prefers-color-scheme: dark)").matches);
    bar.classList.toggle("lhn-dark", isDark);
    bar.querySelector("[data-theme]").checked = isDark;
  }
  function syncPauseShortcutState() { document.dispatchEvent(new CustomEvent("lhn-bilingual-reader-pause-state", { detail:readingPaused })); }
  function popupText(key, vars = {}) { return globalThis.LHN_LANGUAGES?.t?.(key, vars, displayLang) || key; }
  function renderPopupText() {
    const setAttr = (selector, attr, key) => { const element = bar.querySelector(selector); if (element) element.setAttribute(attr, popupText(key)); };
    const setText = (selector, key) => { const element = bar.querySelector(selector); if (element) element.textContent = popupText(key); };
    setAttr("[data-drag]", "title", "readerPopupDrag"); setAttr("[data-drag]", "aria-label", "readerPopupDrag");
    setAttr("[data-play]", "title", reading && !readingPaused ? "readerPopupPause" : "readerPopupPlay");
    setAttr("[data-prev]", "title", "readerPopupPrevious"); setAttr("[data-prev]", "aria-label", "readerPopupPrevious");
    setAttr("[data-next]", "title", "readerPopupNext"); setAttr("[data-next]", "aria-label", "readerPopupNext");
    setAttr("[data-voices]", "aria-label", "readerPopupSelectVoice"); setAttr("[data-speed]", "title", "readerPopupSpeed"); setAttr("[data-time]", "title", "readerPopupTime");
    setAttr("[data-pdf]", "title", "readerPopupPdf"); setAttr("[data-pdf]", "aria-label", "readerPopupPdf");
    setAttr("[data-dashboard]", "title", "readerPopupDashboard"); setAttr("[data-dashboard]", "aria-label", "readerPopupDashboard");
    setAttr("[data-settings]", "title", "readerPopupSettings"); setAttr("[data-settings]", "aria-label", "readerPopupSettings");
    setAttr("[data-close]", "title", "readerPopupStop"); setAttr("[data-close]", "aria-label", "readerPopupStop");
    setAttr("[data-hide-banner]", "aria-label", "readerPopupHideHint");
    setText('[data-lhn-br-popover="voices"] .lhn-br-pop-title', "readerPopupSelectVoice");
    setText('[data-lhn-br-popover="settings"] .lhn-br-pop-title', "readerPopupSettings");
    setText("[data-br-settings-label]", "readerPopupBilingualSettings");
    setText("[data-webfont-label]", "readerPopupCustomWebsiteFont");
    setAttr("[data-br-settings]", "aria-label", "readerPopupBilingualSettings");
    bar.querySelector("[data-webfont]").checked = settings.webFontFamily === "'Inter', sans-serif";
    const speedTitle = popover("speed").querySelector(".lhn-br-pop-title"); if (speedTitle?.firstChild) speedTitle.firstChild.textContent = `${popupText("readerPopupSpeed") } `;
    setAttr('input[type="search"]', "placeholder", "readerPopupSearch"); setAttr('input[type="search"]', "aria-label", "readerPopupSearch");
    setAttr(".lhn-br-range", "aria-label", "readerPopupSpeed");
    for (const [selector, key] of [["[data-autoscroll]","readerPopupAutoScroll"],["[data-parabtn]","bilingualSpeakerIcon"],["[data-shortcuts]","readerPopupShortcuts"],["[data-autolang]","readerPopupAutoDetect"],["[data-speed-step]","readerPopupSpeedStep"],["[data-theme]","readerPopupDarkMode"]]) {
      const label = bar.querySelector(selector)?.closest("label"); if (label?.firstChild) label.firstChild.textContent = `${popupText(key)} `;
    }
    const shortcutLabel = (key, fallback) => {
      const value = String(dashboardShortcuts[key] ?? fallback);
      if (!value) return "Off";
      if (value === "Up") return "↑"; if (value === "Down") return "↓"; if (value === "Left") return "←"; if (value === "Right") return "→";
      return value.replace(/[&<>"']/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[char]));
    };
    const renderShortcutHint = key => popupText(key).replace(/\{step\}/g, formatSpeed(settings.speechSpeedStep))
      .replace(/<b>Space<\/b>/g, `<b>${shortcutLabel("speechPauseShortcut", "Space")}</b>`)
      .replace(/<b>↑\s*\/\s*↓<\/b>/g, `<b>${shortcutLabel("increaseReadingSpeedShortcut", "Up")}</b>/<b>${shortcutLabel("decreaseReadingSpeedShortcut", "Down")}</b>`)
      .replace(/<b>←\s*\/\s*→<\/b>/g, `<b>${shortcutLabel("previousReadingShortcut", "Left")}</b>/<b>${shortcutLabel("nextReadingShortcut", "Right")}</b>`);
    const banner = bar.querySelector("[data-shortcut-banner] span"); if (banner) banner.innerHTML = renderShortcutHint("readerPopupShortcutBanner");
    const footer = popover("settings").querySelector(".lhn-br-pop-foot"); if (footer) footer.innerHTML = renderShortcutHint("readerPopupShortcutFooter");
    const accountLabel = bar.querySelector("[data-account-label]");
    if (!accountProfile && accountLabel) { accountLabel.textContent = popupText("readerPopupSignIn"); setAttr("[data-account]", "title", "readerPopupSignIn"); }
    bar.querySelectorAll("[data-close-pop]").forEach(button => button.setAttribute("aria-label", popupText("readerPopupClose")));
    const voiceHeadingClose = popover("voices").querySelector("[data-close-pop]"); if (voiceHeadingClose) voiceHeadingClose.setAttribute("aria-label", popupText("readerPopupClose"));
    if (popover("voices").classList.contains("lhn-open")) renderVoiceChoices();
  }
  renderPopupText();
  function renderVoiceChoices() {
    voiceKbIndex = -1;
    systemVoices = synth?.getVoices?.() || systemVoices;
    const query = bar.querySelector("input[type=search]").value.trim().toLocaleLowerCase();
    const list = bar.querySelector(".lhn-br-voice-list"); list.replaceChildren();
    const autoMatches = !query || "auto auto-detect language".includes(query);
    if (autoMatches) {
      const autoSelected = settings.voiceMode !== "browser" && !settings.readLanguage;
      const auto = document.createElement("button"); auto.type="button"; auto.className=`lhn-br-voice${autoSelected ? " lhn-selected" : ""}`; auto.innerHTML=`<span>🌐</span><span>${popupText("readerPopupAutoDetect")}<small>${popupText("readerPopupAutoDescription")}</small></span>${autoSelected ? "✓" : ""}`;
      auto.addEventListener("click", () => { selectedVoice = null; activeVoice = null; previewVoiceFlag(autoFlagLang()); void saveReaderVoiceSettings("google", ""); closePopovers(); }); list.appendChild(auto);
    }
    const plainQuery = plainText(query);
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
      button.innerHTML=`<span class="lhn-br-flag">${flagSvgForRegion(region)}</span><span>${name.replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]))}<small>${native !== name ? native.replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char])) + " · " : ""}${tag}</small></span>${isSelected?"✓":""}`;
      button.addEventListener("click", () => { selectedVoice = null; activeVoice = null; previewVoiceFlag(LHN_TTS.normalizeLanguage(code)); void saveReaderVoiceSettings("google", "", code); closePopovers(); }); list.appendChild(button);
    });
    systemVoices.filter(voice => `${voice.name} ${voice.lang}`.toLocaleLowerCase().includes(query)).forEach(voice => {
      const region = voice.lang?.split(/[-_]/)[1]?.toUpperCase();
      const country = region ? new Intl.DisplayNames([displayLang], { type:"region" }).of(region) : "";
      if (!browserGroupShown) { browserGroupShown = true; groupHeading("readerPopupGroupBrowserVoices"); }
      const isSelected=settings.voiceMode === "browser" && settings.browserVoiceURI === voice.voiceURI;
      const button = document.createElement("button"); button.type="button"; button.className=`lhn-br-voice${isSelected ? " lhn-selected" : ""}`; button.innerHTML=`<span class="lhn-br-flag">${flagSvgForRegion(region)}</span><span>${`${voice.name} (${popupText("readerPopupBrowserTag")})`.replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]))}<small>${country}${country && voice.lang ? " · " : ""}${voice.lang || ""}</small></span>${isSelected?"✓":""}`;
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
  // Khi "Custom rate for display language" bật và đang đọc bản dịch của ngôn ngữ hiển thị,
  // tốc độ sửa trên thanh đọc chỉ thuộc ngôn ngữ đó (Your speed), không đụng Global speech rate.
  function editingLanguageRate() { return dashboardShortcuts?.useLanguageSpeechRate === true && readingSegment?.translation === true; }
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
  function renderSpeed(rate) { bar.querySelector(".lhn-br-range").value = rate; bar.querySelector("[data-speed-value]").textContent = formatSpeed(rate); }
  function baseRate() { const shared = clampSpeechRate(dashboardShortcuts?.speechRate); return shared === null ? 1 : shared; }
  function applySharedSpeechRate() {
    const rate = segmentRate(Boolean(readingSegment?.translation));
    if (rate === lastAppliedSegmentRate) { syncToolbar(); return; }
    lastAppliedSegmentRate = rate;
    renderSpeed(rate);
    if (googleToken) { if (googleAudio) googleAudio.playbackRate = rate; } else if (reading && !readingPaused) restartCurrentSpeech();
    syncToolbar();
  }
  function setSpeechSpeed(value) {
    const rate = clampSpeechRate(value);
    if (rate === null) return;
    if (editingLanguageRate()) writeLanguageSpeechRate(rate);
    else writeSharedSpeechRate(rate);
    lastAppliedSegmentRate = rate; renderSpeed(rate); syncToolbar();
    if (googleToken) { if (googleAudio) googleAudio.playbackRate = rate; } else if (reading&&!readingPaused) restartCurrentSpeech();
  }
  function formatSpeed(value) { return `${Number(value || 1).toFixed(2).replace(/\.?0+$/,"")}x`; }
  synth?.addEventListener?.("voiceschanged",()=>{systemVoices=synth.getVoices(); selectedVoice=systemVoices.find(voice=>voice.voiceURI===settings.browserVoiceURI)||selectedVoice; syncToolbar(); if(popover("voices").classList.contains("lhn-open")) renderVoiceChoices();});
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
    if (!readerActive) { stopReading(); document.querySelectorAll(".lhn-bilingual-speaker").forEach(el => el.remove()); bar.classList.remove("lhn-show"); }
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
  function updateSpeakers() {
    if (websiteDisabled || !settings.enableTTS || isReaderDisabledOnThisWebsite()) return;
    const readableBlocks = new Set(readerBlocks());
    blocks().forEach((block, index) => {
      block.dataset.lhnBilingualIndex = String(index);
      let speaker = block.querySelector(":scope > .lhn-bilingual-speaker");
      if (!speaker) {
        speaker = document.createElement("span"); speaker.className = "lhn-bilingual-speaker"; speaker.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a10 10 0 0 1 0 14"/></svg>';
        speaker.title = "Read this paragraph; click to start reading here"; speaker.setAttribute("role", "button"); speaker.tabIndex = 0;
        speaker.addEventListener("click", event => { event.stopPropagation(); startReading(block, true); });
        speaker.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); startReading(block, true); } });
        const card = block.querySelector(":scope > .lhn-bilingual-card"); card ? card.before(speaker) : block.appendChild(speaker);
      }
      speaker.dataset.readerScope = String(readableBlocks.has(block));
      speaker.dataset.visibility = readableBlocks.has(block) ? settings.speakerIconVisibility : "always";
      speaker.toggleAttribute("data-reading", reading && block.classList.contains("lhn-bilingual-reading"));
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
    } catch (error) { console.warn("Bilingual Reader translation failed", error); }
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
  function stopReading() {
    speechDetectionRequest++; readingSegment = null; reading = false; readingPaused = false; resumeText = ""; currentReadText = ""; currentReadCharIndex = 0; utterance = null; cancelGoogle(); syncPauseShortcutState(); document.querySelectorAll(".lhn-bilingual-reading").forEach(el => el.classList.remove("lhn-bilingual-reading")); document.querySelectorAll(".lhn-bilingual-speaker").forEach(el => el.removeAttribute("data-reading")); document.querySelectorAll(".lhn-bilingual-speaker:focus").forEach(el => el.blur()); bar.classList.remove("lhn-show"); closePopovers(); syncToolbar();
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
  // Tốc độ: đoạn gốc dùng Global speech rate. Đoạn dịch dùng tốc độ riêng của ngôn ngữ hiển thị
  // (Your speed) khi "Custom rate for display language" bật; không cộng dồn chênh lệch với Global.
  function segmentRate(isTranslation) {
    const globalRate = baseRate();
    if (!isTranslation || dashboardShortcuts?.useLanguageSpeechRate !== true) return globalRate;
    const custom = Number(dashboardShortcuts?.speechRateByLanguage?.[displayLang]);
    if (Number.isFinite(custom)) return clampSpeechRate(custom);
    const inherited = Number(dashboardShortcuts?.inheritedSpeechRateByLanguage?.[displayLang]);
    if (Number.isFinite(inherited)) return clampSpeechRate(inherited);
    return clampSpeechRate(Number(globalThis.LHN_CONFIG?.DEFAULT_SETTINGS?.speechRateByLanguage?.[displayLang]) || 1.25);
  }
  async function speakGoogleNext(text, fallbackLang, requestId, voiceSettings, forcedLang = null, then = null) {
    const lang = forcedLang ? LHN_TTS.normalizeLanguage(forcedLang) : voiceSettings?.readLanguage ? LHN_TTS.normalizeLanguage(voiceSettings.readLanguage) : (settings.autoDetectVoice !== false ? await LHN_TTS.detectLanguage(text, fallbackLang) : LHN_TTS.normalizeLanguage(fallbackLang));
    if (requestId !== speechDetectionRequest || !reading) return;
    activeSpeechLang = lang;
    cancelGoogle(); // dừng đoạn đang đọc trước khi đọc đoạn mới (next/previous)
    const token = {}; googleToken = token; utterance = token;
    const base = String(lang || "en").replace(/_/g, "-").split("-")[0].toLowerCase() || "en";
    const finish = () => { if (googleToken !== token) return; googleToken = null; utterance = null; if (then) { void speakGoogleNext(then.text, then.lang, requestId, voiceSettings, then.lang); return; } if (reading) { queueIndex++; speakNext(); } };
    readingSegment = { translation: Boolean(forcedLang), lang }; lastAppliedSegmentRate = segmentRate(Boolean(forcedLang)); syncToolbar();
    LHN_TTS.play({
      text, lang, googleLanguage: base, voice: `google-translate-default:${base}`, rate: () => segmentRate(Boolean(forcedLang)),
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
        const u = new SpeechSynthesisUtterance(t); u.lang = voice.lang || l; u.rate = segmentRate(Boolean(forcedLang)); u.voice = voice;
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
    readingSegment = null; lastAppliedSegmentRate = segmentRate(false); // giọng trình duyệt: bỏ ngôn ngữ đoạn Google cũ để cờ theo giọng đang dùng
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
    const current = new SpeechSynthesisUtterance(currentReadText); current.rate = segmentRate(false); current.lang = selectedVoice?.lang || activeSpeechLang; if (activeVoice) current.voice=activeVoice; utterance = current;
    current.onboundary = event => { if (utterance === current && Number.isFinite(event.charIndex)) currentReadCharIndex = event.charIndex; };
    const finish = () => { if (utterance !== current) return; utterance = null; if (reading) { queueIndex++; speakNext(); } };
    current.onend = finish; current.onerror = event => { if (utterance !== current) return; console.warn("Bilingual Reader speech synthesis failed", event?.error || event); if (!["canceled", "interrupted"].includes(event?.error)) showReaderToast(popupText("readerToastBrowserVoiceFailed")); finish(); }; syncToolbar(); if (synth?.paused) synth.resume(); synth?.speak(current);
  }
  // Đọc luôn cả đoạn dịch song ngữ phía dưới (chỉ khi đoạn có bản dịch)
  // Tách đoạn gốc và đoạn dịch để đọc mỗi phần với ngôn ngữ riêng (đoạn dịch dùng ngôn ngữ đích)
  function readSegmentsFor(block) {
    if (!settings.readTranslation) return null;
    const card = block.querySelector(":scope > .lhn-bilingual-card");
    const translated = card?.textContent.trim();
    if (!translated) return null;
    return { source: rawText(block, true), translated, lang: card.dataset.targetLang || "" };
  }
  function readTextFor(block) {
    const source = rawText(block, true);
    const card = block.querySelector(":scope > .lhn-bilingual-card");
    const translated = settings.readTranslation && card ? card.textContent.trim() : "";
    return translated ? `${source}\n${translated}` : source;
  }
  let readTranslationToastTimer = null;
  let readerErrorToastTimer = null;
  function showReaderToast(text) {
    let toast = document.getElementById("lhn-sidebar-toast");
    if (!toast) { toast = document.createElement("div"); toast.id = "lhn-sidebar-toast"; toast.setAttribute("role", "status"); document.documentElement.appendChild(toast); }
    toast.textContent = text;
    toast.classList.add("is-visible");
    clearTimeout(readerErrorToastTimer);
    readerErrorToastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2600);
  }
  function notifyReadTranslationOn() {
    let toast = document.getElementById("lhn-sidebar-toast");
    if (!toast) { toast = document.createElement("div"); toast.id = "lhn-sidebar-toast"; toast.setAttribute("role", "status"); document.documentElement.appendChild(toast); }
    toast.textContent = popupText("readTranslationOnToast");
    toast.classList.add("is-visible");
    clearTimeout(readTranslationToastTimer);
    readTranslationToastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2600);
  }
  function startReading(fromBlock, interruptCurrent = false) {
    if (settings.readTranslation) notifyReadTranslationOn();
    if (websiteDisabled || isReaderDisabledOnThisWebsite()) return;
    if (!settings.enableTTS || !synth || !window.SpeechSynthesisUtterance) return;
    speechDetectionRequest++;
    let nextQueue = readerBlocks(true);
    if (fromBlock && !nextQueue.includes(fromBlock)) nextQueue = [fromBlock];
    if (!nextQueue.length) return;
    const cancelPendingSpeech = Boolean(interruptCurrent && (reading || synth?.speaking || synth?.pending || synth?.paused));
    if (interruptCurrent && reading) stopReading();
    else if (cancelPendingSpeech) { utterance = null; cancelGoogle(); }
    queue = nextQueue;
    readingPaused = false; resumeText = ""; queueIndex = fromBlock ? queue.indexOf(fromBlock) : 0;
    reading = true; readingPaused = false; syncPauseShortcutState(); bar.querySelector("[data-shortcut-banner]").hidden = false; bar.classList.add("lhn-show"); syncToolbar();
    if (interruptCurrent) document.dispatchEvent(new Event("lhn-bilingual-reader-started"));
    if (cancelPendingSpeech) speakAfterCancel(); else speakNext();
  }
  function moveReading(delta, event) {
    if (!reading) return;
    event.preventDefault();
    const navigationButton = bar.querySelector(delta < 0 ? "[data-prev]" : "[data-next]");
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
  document.addEventListener("mousemove", event => { lastPointer = { x:event.clientX, y:event.clientY }; }, { passive:true });
  document.addEventListener("lhn-bilingual-reader-command", event => {
    if (event.detail === "toggle-lazy" || event.detail === "toggle-near-pointer") sameLangToastShown = false; // cho phép hiện lại toast khi bấm lại Alt+A/Alt+D
    if (event.detail === "toggle-lazy") toggleLazy();
    if (event.detail === "toggle-near-pointer") toggleNearPointer();
    if (event.detail === "toggle-reading") reading ? stopReading() : startReading();
    if (event.detail === "previous-reading-block") moveReading(-1, event);
    if (event.detail === "next-reading-block") moveReading(1, event);
    if (settings.readerShortcutsEnabled !== false && event.detail === "increase-reading-speed") { event.preventDefault(); if (reading) setSpeechSpeed(segmentRate(Boolean(readingSegment?.translation)) + normalizeSpeedStep(settings.speechSpeedStep)); }
    if (settings.readerShortcutsEnabled !== false && event.detail === "decrease-reading-speed") { event.preventDefault(); if (reading) setSpeechSpeed(segmentRate(Boolean(readingSegment?.translation)) - normalizeSpeedStep(settings.speechSpeedStep)); }
    if (settings.readerShortcutsEnabled !== false && event.detail === "open-voice-select" && reading && bar.classList.contains("lhn-show")) { event.preventDefault(); bar.querySelector("[data-voices]").click(); }
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
      else { const remaining = resumeText; resumeText = ""; syncPauseShortcutState(); syncToolbar(); speakAfterCancel(remaining); }
      event.preventDefault();
    } else {
      syncPauseShortcutState(); event.preventDefault();
    }
  });
  document.addEventListener("lhn-website-disabled-change", event => {
    websiteDisabled = Boolean(event.detail);
    if (websiteDisabled) {
      lazyObserver?.disconnect(); stopReading();
      document.querySelectorAll(".lhn-bilingual-card,.lhn-bilingual-speaker").forEach(node => node.remove());
      document.querySelectorAll(".lhn-bilingual-web-font").forEach(node => node.classList.remove("lhn-bilingual-web-font"));
      bar.classList.remove("lhn-show");
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
      applySharedSpeechRate();
      const nextVoiceMode = dashboardShortcuts.voiceMode === "browser" || (!dashboardShortcuts.voiceMode && dashboardShortcuts.speechVoice === "browser") ? "browser" : "google";
      settings = { ...settings, voiceMode:nextVoiceMode, browserVoiceURI:String(dashboardShortcuts.browserVoiceURI || ""), readLanguage:nextVoiceMode === "google" ? String(dashboardShortcuts.readLanguage || "") : "" };
      selectedVoice = systemVoices.find(voice => voice.voiceURI === settings.browserVoiceURI) || null;
      if (reading && !readingPaused && (previousVoiceMode !== settings.voiceMode || previousVoiceURI !== settings.browserVoiceURI || previousReadLanguage !== settings.readLanguage)) restartCurrentSpeech();
      displayLang = globalThis.LHN_LANGUAGES?.languageFor?.(changes[DISPLAY_SETTINGS_KEY].newValue) || displayLang;
      addonThemePreference = ["light","dark","system"].includes(changes[DISPLAY_SETTINGS_KEY].newValue?.sidebarTheme) ? changes[DISPLAY_SETTINGS_KEY].newValue.sidebarTheme : "system";
      renderPopupText();
      syncToolbar();
      document.querySelectorAll(".lhn-bilingual-card").forEach(card => { const block = card.parentElement; if (block) translateBlock(block, true); });
    }
  });
  browser.storage.local.get([SETTINGS_KEY, DISPLAY_SETTINGS_KEY, TARGET_LANGUAGE_KEY, DEMO_PROFILE_KEY]).then(async data => {
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
    if (seedReaderSites || savedReaderSettings.speechSpeedSynced !== true) browser.storage.local.set({ [SETTINGS_KEY]:mergedReaderSettings }).catch(() => {});
    applySettings({ ...mergedReaderSettings, ...voiceSettings });
    renderPopupText();
    systemVoices = synth?.getVoices?.() || [];
    selectedVoice = systemVoices.find(voice => voice.voiceURI === settings.browserVoiceURI) || null;
    syncToolbar();
  }).catch(() => applySettings(DEFAULTS));
  window.matchMedia?.("(prefers-color-scheme: dark)").addEventListener?.("change", syncToolbar);
  let pageMutationTimer = 0;
  function shouldObserveReaderMutations() {
    return !websiteDisabled && ((settings.enableTTS && !isReaderDisabledOnThisWebsite()) || Boolean(window.__lhnBilingualLazy));
  }
  const pageObserver = new MutationObserver(records => {
    if (!shouldObserveReaderMutations()) return;
    const isOwn = node => node?.nodeType === 1 && (node.matches?.(".lhn-bilingual-card,.lhn-bilingual-speaker,#lhn-bilingual-reading-bar,#lhn-bilingual-reader-debug-style") || node.closest?.(".lhn-bilingual-card,.lhn-bilingual-speaker,#lhn-bilingual-reading-bar,#lhn-bilingual-reader-debug-style"));
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
