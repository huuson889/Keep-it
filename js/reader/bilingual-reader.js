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
  let favoriteVoices = []; // lhnSettings.favoriteVoices (voiceURI, mới nhất trước)
  const favFlash = { key:"", at:0 }, favBeat = { key:"", at:0 }, favUnbeat = { key:"", at:0 }; const favGhosts = new Set(); let favOrder = null; // nhóm Yêu thích giữ nguyên thứ tự khi sheet đang mở; bỏ ♡ thì hàng ở lại (mờ) tới khi đóng sheet / đổi tìm kiếm → bấm lại để hoàn tác đúng chỗ
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
  style.textContent = globalThis.LHN_THEME.css("#lhn-bilingual-reading-bar") + globalThis.LHN_READER_CSS(flagFontUrl);  // js/shared/theme-tokens.js + js/reader/reader-css.js
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
  const brStroke = paths => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
  bar.innerHTML = `<div class="lhn-br-rbar" data-rbar><div class="lhn-br-prog" data-prog><span class="lhn-br-fill" data-prog-fill><span class="lhn-br-knob"></span></span><span class="lhn-br-ptip" data-prog-tip></span></div>`
    + `<div class="lhn-br-left"><button type="button" class="lhn-br-btn" data-voices data-sheet="voices"><span class="lhn-br-vflag lhn-br-flagfont" data-bar-flag></span></button><button type="button" class="lhn-br-btn lhn-br-spd" data-speed data-sheet="speed"><span data-speed-label>1.00X</span></button><span class="lhn-br-btn lhn-br-mins" data-time role="note"></span></div>`
    + `<div class="lhn-br-center"><button type="button" class="lhn-br-btn" data-prev><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg></button><button type="button" class="lhn-br-btn lhn-br-play" data-play></button><button type="button" class="lhn-br-btn" data-next><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg></button></div>`
    + `<div class="lhn-br-right"><button type="button" class="lhn-br-btn lhn-br-rep" data-repeat aria-pressed="false">${brStroke('<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/><path d="M11 10h1v4"/>')}</button><button type="button" class="lhn-br-btn" data-close>${BR_ICON.close}</button><button type="button" class="lhn-br-btn" data-more data-sheet="more"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg></button></div></div>`
    + `<div class="lhn-br-kbd lhn-off" data-shortcut-banner><span data-banner-text></span><button type="button" data-hide-banner>×</button></div>`
    + `<div class="lhn-br-sheet" data-sheet-root><div class="lhn-br-scrim" data-scrim></div><div class="lhn-br-panel" data-panel role="dialog" aria-modal="true"><div class="lhn-br-grip"></div><div class="lhn-br-shead"><span class="lhn-br-stitle" data-sheet-title></span><span class="lhn-br-spval" data-speed-value hidden>1.00x</span><button type="button" class="lhn-br-sx" data-close-pop>${BR_ICON.close}</button></div><div class="lhn-br-sbody" data-sbody>`
    + `<div class="lhn-br-pane" data-pane="speed"><div class="lhn-br-sprow"><button type="button" class="lhn-br-spstep" data-sp="-1">-</button><input class="lhn-br-range" type="range" min="0.5" max="3" step="0.05" value="1"><button type="button" class="lhn-br-spstep" data-sp="1">+</button></div><div class="lhn-br-spgrid">`
    + [["0.5","0.5x"],["0.75","0.75x"],["0.9","0.9x"],["1.0",""],["1.1","1.1x"],["1.25","1.25x"],["1.5","1.5x"],["2.0","2.0x"]].map(([value, label]) => `<button type="button" data-preset="${value}"${label ? "" : ' class="lhn-br-normal"'}>${label}</button>`).join("")
    + `</div></div><div class="lhn-br-pane" data-pane="voices"><input class="lhn-br-vsearch" type="search"><div class="lhn-br-voice-list"></div></div></div></div></div><div class="lhn-br-toast" data-toast role="status"></div>`;
  const $br = selector => bar.querySelector(selector);
  const brRbar = $br("[data-rbar]"), brSheet = $br("[data-sheet-root]"), brPanel = $br("[data-panel]"), voiceSearch = $br(".lhn-br-vsearch");
  const brProg = $br("[data-prog]"), brProgFill = $br("[data-prog-fill]"), brProgTip = $br("[data-prog-tip]");
  const BR_DESK_QUERY = window.matchMedia?.("(hover: hover) and (pointer: fine)");
  // v3.5.221: the Reader bar and its sheets keep their size at any page zoom (reader-css: zoom:var(--keepit-uiz)) → "wide" is
  // measured in the bar's own px (page px × zoom); rects (page px) × uiK() = the bar's px. The translation cards follow the page.
  const uiK = () => globalThis.LHN_UI_ZOOM?.get?.() || 1;
  const isWideBar = () => innerWidth * uiK() >= 1024, isDeskBar = () => !!BR_DESK_QUERY?.matches;
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
    const k = uiK(), rect = button.getBoundingClientRect(), barRect = brRbar.getBoundingClientRect(), top = barRect.top * k, W = bar.clientWidth || innerWidth * k, H = bar.clientHeight || innerHeight * k, w = brPanel.offsetWidth;
    // Giọng đọc/Tốc độ căn mép trái thanh Reader; ☰ vẫn căn giữa trên nút
    const left = openSheetName === "voices" || openSheetName === "speed" ? barRect.left * k : (rect.left + rect.width / 2) * k - w / 2;
    brPanel.style.left = `${Math.max(12, Math.min(W - w - 12, left))}px`; brPanel.style.bottom = `${H - top + 14}px`;
    brPanel.style.top = "auto"; brPanel.style.right = "auto"; brPanel.style.transform = "none";
  }
  function openSheet(name) {
    openSheetName = name;
    bar.querySelectorAll("[data-pane]").forEach(pane => pane.classList.toggle("lhn-on", pane.dataset.pane === name));
    brPanel.classList.toggle("lhn-br-speedp", name === "speed");
    $br("[data-speed-value]").hidden = name !== "speed";
    $br("[data-sheet-title]").textContent = name === "voices" ? popupText("readerPopupSelectVoice") : name === "speed" ? popupText("readerPopupSpeed") : "";
    if (name === "voices") { voiceSearch.value = ""; favGhosts.clear(); favOrder = null; renderVoiceChoices(); }
    if (name === "speed") renderSpeed(currentSegmentRate());
    brPanel.removeAttribute("style");
    brSheet.classList.add("lhn-open"); $br("[data-sbody]").scrollTop = 0;
    if (isWideBar()) anchorPanel();
    brRbar.querySelectorAll("[data-sheet]").forEach(button => button.classList.toggle("lhn-on", button.dataset.sheet === name));
    if (name === "voices" && isDeskBar()) focusVoiceSearch();
    syncBanner();
  }
  function closeSheet() {
    brSheet.classList.remove("lhn-open"); openSheetName = ""; favGhosts.clear(); favOrder = null;
    brRbar.querySelectorAll("[data-sheet].lhn-on").forEach(button => button.classList.remove("lhn-on"));
    syncBanner();
  }
  const closePopovers = closeSheet;
  function toggleSheet(name) { const wasOpen = openSheetName === name; closeSheet(); if (!wasOpen) openSheet(name); }
  // v3.5.217: sheet ☰ chính của Keepit (mở từ nút ☰ của Reader) đang mở → tạm ẩn thanh phím tắt như khi rê vào thanh Reader.
  let mainSheetOpen = false;
  document.addEventListener("lhn-main-sheet", event => { mainSheetOpen = event.detail?.open === true; syncBanner(); });
  function syncBanner() { $br("[data-shortcut-banner]")?.classList.toggle("lhn-off", !(isDeskBar() && shortcutBannerVisible && !openSheetName && !scrubbing && !mainSheetOpen)); }
  // Khoảng trống đáy cố định khi Reader mở để thanh luôn hiện mà không che chữ cuối trang
  function syncSpacer() {
    let spacer = document.getElementById("lhn-br-spacer");
    if (!bar.classList.contains("lhn-show") || !document.body) { spacer?.remove(); return; }
    if (!spacer) { spacer = document.createElement("div"); spacer.id = "lhn-br-spacer"; spacer.setAttribute("aria-hidden", "true"); spacer.setAttribute("data-lhn-bilingual-ui", "true"); }
    if (spacer.parentNode !== document.body) document.body.appendChild(spacer);
    spacer.style.setProperty("height", `${Math.round((isDeskBar() && shortcutBannerVisible ? 150 : isWideBar() ? 106 : 100) / uiK())}px`, "important");
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
    // v3.5.218: sheet ☰ riêng của Reader đã xoá — ☰ chỉ mở sheet chính của Keepit (thanh Keepit luôn có khi Reader mở được)
    else if (button.dataset.sheet === "more") { closeSheet(); globalThis.LHN_BAR_HOOKS?.openMainSheet?.(button.getBoundingClientRect()); }
    else if (button.dataset.sheet) toggleSheet(button.dataset.sheet);
  });
  $br("[data-scrim]").addEventListener("click", closeSheet);
  $br("[data-close-pop]").addEventListener("click", closeSheet);
  // v3.5.161: same sheet behaviour as every Keepit sheet (js/shared/sheet-kit.js): page locked while open, drag down from
  // anywhere closes (the voice list scrolls back to its top first), wheel / scroll keys never reach the page
  globalThis.LHN_SHEET?.attach(brPanel, { isOpen:() => brSheet.classList.contains("lhn-open"), close:() => closeSheet(), watch:brSheet });
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
    favGhosts.clear(); favOrder = null; renderVoiceChoices();
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
  BR_DESK_QUERY?.addEventListener?.("change", syncBarLayout);
  window.addEventListener("resize", () => { if (bar.classList.contains("lhn-br-wide") !== isWideBar()) syncBarLayout(); syncBarScale(); if (openSheetName && isWideBar()) anchorPanel(); }, { passive:true });
  window.addEventListener("keepit-ui-zoom", () => { if (bar.isConnected) syncBarLayout(); });
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
    const lang = voiceFlagOverride || readingSegment?.lang || (settings.voiceMode !== "browser" && settings.readLanguage ? LHN_TTS.normalizeLanguage(settings.readLanguage) : "") || selectedVoice?.lang || activeVoice?.lang || activeSpeechLang || queue[queueIndex]?.closest("[lang]")?.getAttribute("lang") || document.documentElement.lang || navigator.language || "";
    const favVoice = settings.voiceMode !== "browser" && !(voiceFlagOverride && selectedVoice) ? favoriteVoiceForReader(lang) : null;   // v3.5.234: Tự động / ngôn ngữ Google mà có giọng Ưu tiên → cờ theo giọng đó (vd. en-GB → 🇬🇧)
    const parts = String(favVoice?.lang || lang).split(/[-_]/), base = parts[0]?.toLowerCase(), region = parts.slice(1).find(part => /^[a-z]{2}$|^\d{3}$/i.test(part))?.toUpperCase() || ({ en:"US", vi:"VN", ko:"KR", ja:"JP", zh:"CN", fr:"FR", de:"DE", es:"ES", it:"IT", pt:"BR", ru:"RU", ar:"SA", hi:"IN", th:"TH" })[base];
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
    const groupHeading = key => { const heading = document.createElement("div"); heading.className = "lhn-br-voice-group"; heading.dataset.group = key; heading.setAttribute("role", "presentation"); heading.textContent = popupText(key); list.appendChild(heading); };
    let languageGroupShown = false, browserGroupShown = false;
    const flagMissLogged = new Set(); // debug: log một lần cho mỗi vùng thiếu cờ
    let voiceRegionNames = null, voiceLangNames = null;
    try { voiceRegionNames = new Intl.DisplayNames([displayLang], { type:"region" }); voiceLangNames = new Intl.DisplayNames([displayLang], { type:"language" }); } catch {}
    const HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.5 5.5 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5Z"/></svg>';
    const favBase = voice => (voice?.lang || "").split(/[-_]/)[0].toLowerCase();
    // Mục yêu thích: voiceURI (giọng trình duyệt) hoặc "google:<mã>" (giọng Google của ngôn ngữ đó)
    const favEntry = key => key.startsWith("google:") ? (READ_LANGUAGE_CODES.includes(key.slice(7)) ? { key, code:key.slice(7), base:key.slice(7) } : null) : (() => { const voice = systemVoices.find(item => item.voiceURI === key); return voice ? { key, voice, base:favBase(voice) } : null; })();
    const favEntries = favoriteVoices.map(favEntry).filter(Boolean);
    const priorityURIs = new Set(); { const seen = new Set(); favEntries.forEach(entry => { if (entry.base && !seen.has(entry.base)) { seen.add(entry.base); priorityURIs.add(entry.key); } }); }
    const prioTag = langName => `<span class="lhn-br-prio" title="${escVoiceHtml(popupText("readerVoiceFavPriorityTip", { lang:langName }))}">${escVoiceHtml(popupText("readerVoiceFavPriority"))}</span>`;
    const favButton = (key, isFav) => { const tip = popupText(isFav ? "readerVoiceFavRemove" : "readerVoiceFavAdd"); return `<span class="lhn-br-fav${isFav ? " lhn-on" : ""}" role="button" aria-pressed="${isFav}" aria-label="${escVoiceHtml(tip)}" title="${escVoiceHtml(tip)}">${HEART}</span>`; };
    const wireFav = (button, key) => { const unAge = key === favUnbeat.key ? performance.now() - favUnbeat.at : 1e9; if (unAge < 260) { button.querySelector(".lhn-br-fav").classList.add("lhn-unbeat"); button.style.setProperty("--lhn-un-delay", `-${Math.round(unAge)}ms`); if (button.classList.contains("lhn-br-ghost") || button.dataset.sec === "fav") button.classList.add("lhn-br-ghostin"); } const beatAge = key === favBeat.key ? performance.now() - favBeat.at : 1e9; if (beatAge < 500) { const heart = button.querySelector(".lhn-br-fav"); heart.classList.add("lhn-beat"); heart.firstElementChild.style.animationDelay = `-${Math.round(beatAge)}ms`; } button.querySelector(".lhn-br-fav").addEventListener("click", event => { event.preventDefault(); event.stopPropagation(); void toggleFavoriteVoice(key, button); }); };
    const langMatches = code => {
      if (!plainQuery) return true;
      const region = readLanguageRegion(code), tag = LHN_TTS.normalizeLanguage(code);
      const country = region ? (() => { try { return new Intl.DisplayNames([displayLang], { type:"region" }).of(region) || ""; } catch { return ""; } })() : "";
      return plainText(`${readLanguageName(code)} ${languageLabel(code, "en")} ${languageLabel(code, code)} ${country} ${code} ${tag} google`).includes(plainQuery);
    };
    const langRow = (code, inFavorites) => {
      const region = readLanguageRegion(code), tag = LHN_TTS.normalizeLanguage(code), key = `google:${code}`;
      const name = readLanguageName(code), native = languageLabel(code, code);
      const isSelected = settings.voiceMode !== "browser" && settings.readLanguage === code, isFav = favoriteVoices.includes(key);
      const button = document.createElement("button"); button.type="button"; button.className=`lhn-br-voice${isSelected ? " lhn-selected" : ""}`; button.dataset.favKey = key; button.dataset.sec = inFavorites ? "fav" : "all";
      button.innerHTML=`<span class="lhn-br-vf lhn-br-flagfont"></span><span class="lhn-br-vt"><b>${escVoiceHtml(name)}${inFavorites && priorityURIs.has(key) ? prioTag(name) : ""}</b><small>${inFavorites ? "Google · " : ""}${native !== name ? escVoiceHtml(native) + " · " : ""}${tag}</small></span>${check(isSelected)}${favButton(key, isFav)}`;
      renderFlag(button.firstElementChild, region); wireFav(button, key);
      button.addEventListener("click", () => { selectedVoice = null; activeVoice = null; previewVoiceFlag(LHN_TTS.normalizeLanguage(code)); void saveReaderVoiceSettings("google", "", code); closePopovers(); });
      return button;
    };
    const voiceRow = (voice, inFavorites) => {
      const region = voice.lang?.split(/[-_]/)[1]?.toUpperCase();
      if (region && !FLAG_REGION_KEYS[region] && !flagMissLogged.has(region)) { flagMissLogged.add(region); console.info('[Keepit] Giọng chưa có cờ:', region, '|', voice.name, '|', voice.lang); }
      const isSelected=settings.voiceMode === "browser" && settings.browserVoiceURI === voice.voiceURI;
      const isFav = favoriteVoices.includes(voice.voiceURI), key = voice.voiceURI;
      const button = document.createElement("button"); button.type="button"; button.className=`lhn-br-voice${isSelected ? " lhn-selected" : ""}`; button.dataset.favKey = key; button.dataset.sec = inFavorites ? "fav" : "all";
      const baseLang = favBase(voice);
      let langLabel = baseLang; try { langLabel = voiceLangNames?.of(baseLang) || baseLang; } catch {}
      let countryLabel = region || langLabel; try { if (region) countryLabel = voiceRegionNames?.of(region) || region; } catch {}
      const shortVoice = (voice.name || "").replace(/^Microsoft\s+/, "").replace(/\s*Online\s*\(Natural\)/i, "").replace(/\s*\(Browser\)\s*$/i, "").split(" - ")[0].trim() || voice.name;
      const prio = inFavorites && priorityURIs.has(voice.voiceURI) ? prioTag(langLabel) : "";
      button.innerHTML = `<span class="lhn-br-vf lhn-br-flagfont"></span><span class="lhn-br-vt"><b>${escVoiceHtml(countryLabel)}${prio}</b><small>${escVoiceHtml(shortVoice)} · ${escVoiceHtml(langLabel)}</small></span>${check(isSelected)}${favButton(voice.voiceURI, isFav)}`;
      renderFlag(button.firstElementChild, region);
      button.title = `${voice.name} · ${voice.lang}`;
      wireFav(button, voice.voiceURI);
      button.addEventListener("click",()=>{ selectedVoice=voice; activeVoice=voice; previewVoiceFlag(voice.lang); void saveReaderVoiceSettings("browser", voice.voiceURI); closePopovers(); });
      return button;
    };
    const matchedVoices = LHN_INDEX_SEARCH.search(getVoiceIndex(), query), matchedURIs = new Set(matchedVoices.map(voice => voice.voiceURI));
    // thứ tự hiển thị = favOrder (chụp lúc mở sheet); giọng mới thích từ danh sách dưới thì thêm lên đầu
    favOrder = favOrder ? [...favoriteVoices.filter(key => !favOrder.includes(key)), ...favOrder.filter(key => favoriteVoices.includes(key) || favGhosts.has(key))] : [...favoriteVoices];
    const favDisplay = favOrder.map(key => { const entry = favEntry(key); return entry && (favGhosts.has(key) && !favoriteVoices.includes(key) ? { ...entry, ghost:true } : entry); }).filter(Boolean);
    const favShown = favDisplay.filter(entry => entry.code ? langMatches(entry.code) : matchedURIs.has(entry.key));
    if (favShown.length) { groupHeading("readerPopupGroupFavorites"); favShown.forEach(entry => { const row = entry.code ? langRow(entry.code, true) : voiceRow(entry.voice, true); if (entry.ghost) row.classList.add("lhn-br-ghost"); else row.classList.remove("lhn-br-ghostin"); const flashAge = entry.key === favFlash.key ? performance.now() - favFlash.at : 1e9; if (flashAge < 1200) { row.classList.add("lhn-br-flash"); row.style.animationDelay = `-${Math.round(flashAge)}ms`; } list.appendChild(row); }); }
    READ_LANGUAGE_CODES.forEach(code => {
      if (!langMatches(code)) return;
      if (!languageGroupShown) { languageGroupShown = true; groupHeading("readerPopupGroupLanguages"); }
      list.appendChild(langRow(code, false));
    });
    matchedVoices.forEach(voice => {
      if (!browserGroupShown) { browserGroupShown = true; groupHeading("readerPopupGroupBrowserVoices"); }
      list.appendChild(voiceRow(voice, false));
    });
    if (!list.childElementCount) list.textContent=popupText("readerPopupNoVoices");
    // tiêu đề nhóm: icon nhỏ + số mục (nhẹ: chỉ là chữ/SVG, không nền, không dính)
    const GROUP_ICON = {
      readerPopupGroupFavorites:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.5 5.5 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5Z"/></svg>',
      readerPopupGroupLanguages:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.2 9.6A7.6 7.6 0 1 0 19.6 12H12"/></svg>',
      readerPopupGroupBrowserVoices:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4.5" width="18" height="15" rx="2.5"/><path d="M3 9h18"/><path d="M6.2 6.8h.01M8.8 6.8h.01"/></svg>'
    };
    list.querySelectorAll(".lhn-br-voice-group").forEach(heading => {
      let count = 0; for (let node = heading.nextElementSibling; node && !node.classList.contains("lhn-br-voice-group"); node = node.nextElementSibling) if (node.classList.contains("lhn-br-voice") && !node.classList.contains("lhn-br-ghost")) count++;
      heading.innerHTML = `${GROUP_ICON[heading.dataset.group] || ""}<span>${escVoiceHtml(popupText(heading.dataset.group))}</span><span class="lhn-br-gcount">· ${count}</span>`;
    });
  }
  // ♡: thêm/bỏ giọng yêu thích; giọng mới thích lên đầu nhóm (thành giọng ưu tiên của ngôn ngữ đó). Giữ nguyên vị trí cuộn.
  // ♡ không làm nhảy dòng: hàng vừa bấm đứng yên dưới ngón tay/chuột (cuộn bù phần nhóm Yêu thích dài/ngắn đi).
  //   Thích ở danh sách dưới → bản sao lên Yêu thích (đầu nhóm = Ưu tiên) và sáng nhẹ một lần.
  //   Bỏ thích trong nhóm Yêu thích → hàng ở lại mờ (bấm lại ♡ là hoàn tác về đúng chỗ cũ).
  async function toggleFavoriteVoice(uri, row) {
    const list = $br(".lhn-br-voice-list"), sec = row?.dataset.sec || "all", anchorTop = row?.isConnected ? row.getBoundingClientRect().top : null;
    let current = favoriteVoices; try { current = await LHN_TTS.getFavoriteVoices(); } catch {}
    const adding = !current.includes(uri);
    let next;
    const before = favPriorityFor(uri, current);
    if (adding && favGhosts.has(uri) && favOrder) { favGhosts.delete(uri); next = favOrder.filter(key => key === uri || current.includes(key)); next.push(...current.filter(key => !next.includes(key))); }   // hoàn tác: về đúng chỗ cũ
    else if (adding) { favGhosts.delete(uri); next = [uri, ...current]; if (favOrder) favOrder = [uri, ...favOrder.filter(key => key !== uri)]; }
    else { next = current.filter(item => item !== uri); if (sec === "fav") favGhosts.add(uri); else { favGhosts.delete(uri); if (favOrder) favOrder = favOrder.filter(key => key !== uri); } }
    try { favoriteVoices = await LHN_TTS.setFavoriteVoices(next); } catch { return; }
    let scroller = list; while (scroller && scroller !== bar && !(scroller.scrollHeight > scroller.clientHeight && /auto|scroll/.test(getComputedStyle(scroller).overflowY))) scroller = scroller.parentElement;
    if (!scroller || scroller === bar) scroller = list.parentElement;
    if (adding && sec === "all") { favFlash.key = uri; favFlash.at = performance.now(); }   // bản sao mới sáng nhẹ (giữ cả khi danh sách vẽ lại)
    if (adding) { favBeat.key = uri; favBeat.at = performance.now(); }   // ♥ đập (giữ cả khi danh sách vẽ lại)
    else { favUnbeat.key = uri; favUnbeat.at = performance.now(); }   // bỏ ♥: tim co nhẹ, đỏ rút về viền xám; hàng mờ dần
    const kb = voiceKbIndex; renderVoiceChoices();
    const find = section => list.querySelector(`.lhn-br-voice[data-sec="${section}"][data-fav-key="${CSS.escape(uri)}"]`);
    const same = find(sec);
    if (same && anchorTop != null && scroller) scroller.scrollTop += (same.getBoundingClientRect().top - anchorTop) / (scroller.currentCSSZoom || 1);

    if (kb >= 0) { voiceKbIndex = kb; voiceItems()[kb]?.classList.add("lhn-kb-active"); }
    const tapped = same?.querySelector(".lhn-br-fav");
    if (adding && tapped) favBurst(tapped);
    if (adding) navigator.vibrate?.(15);
    const after = favPriorityFor(uri, favoriteVoices);
    if (after.label && after.key !== before.key) showBarToast(popupText("readerVoiceFavNowReads", { lang:after.label, voice:after.voice }));   // chỉ báo khi giọng đọc của ngôn ngữ đó đổi
    applyFavoriteVoiceChange();
  }
  // Giọng sẽ đọc ngôn ngữ của mục `uri` theo danh sách yêu thích (mục đầu tiên còn trên máy; không có thì Google)
  function favPriorityFor(uri, favorites) {
    const voices = synth?.getVoices?.() || systemVoices, baseOf = key => key.startsWith("google:") ? key.slice(7) : String(voices.find(v => v.voiceURI === key)?.lang || "").split(/[-_]/)[0].toLowerCase();
    const base = baseOf(uri); if (!base) return {};
    const top = favorites.find(key => baseOf(key) === base && (key.startsWith("google:") ? READ_LANGUAGE_CODES.includes(base) : voices.some(v => v.voiceURI === key))) || "";
    let label = base; try { label = READ_LANGUAGE_CODES.includes(base) ? readLanguageName(base) : (new Intl.DisplayNames([displayLang], { type:"language" }).of(base) || base); } catch {}
    const voice = !top || top.startsWith("google:") ? "Google" : String(voices.find(v => v.voiceURI === top)?.name || "").replace(/^Microsoft\s+/, "").replace(/\s*Online\s*\(Natural\)/i, "").split(" - ")[0].trim();
    return { key:top || `google:${base}`, label, voice };
  }
  // Hiệu ứng ♥ giống nút ♥ của overlay: 2 vòng tròn lan ra + 10 tim nhỏ bay tỏa (gắn vào bảng chọn để không bị cắt ở mép danh sách)
  function favBurst(heart) {
    const panel = brPanel, pr = panel.getBoundingClientRect(), hr = heart.getBoundingClientRect(), k = pr.width / (panel.offsetWidth || pr.width || 1) || 1;
    const b = document.createElement("span"); b.className = "lhn-br-burst";
    b.style.left = `${(hr.left + hr.width / 2 - pr.left) / k}px`; b.style.top = `${(hr.top + hr.height / 2 - pr.top) / k}px`;
    const path = heart.querySelector("path")?.getAttribute("d") || "";
    b.innerHTML = "<b></b><b></b>" + Array.from({ length:10 }, (_, i) => { const a = i / 10 * Math.PI * 2, r = 34 + (i % 3) * 8; return `<i style="--x:${(Math.cos(a) * r).toFixed(1)}px;--y:${(Math.sin(a) * r).toFixed(1)}px"><svg viewBox="0 0 24 24"><path d="${path}"/></svg></i>`; }).join("");
    panel.appendChild(b); setTimeout(() => b.remove(), 900);
  }
  // v3.5.234: giọng sẽ đọc `lang` theo danh sách yêu thích (cùng luật LHN_TTS); key "google" = đọc Google
  function favoriteVoiceForReader(lang) { return lang ? LHN_TTS.favoriteVoiceFor(lang, favoriteVoices, synth?.getVoices?.() || systemVoices) : null; }
  function favVoiceKeyFor(lang) { return favoriteVoiceForReader(lang)?.voiceURI || "google"; }
  // Đổi giọng Ưu tiên của ngôn ngữ đang đọc → đọc lại ngay đoạn hiện tại bằng giọng mới (đang đọc phần dịch thì chỉ đọc lại phần dịch)
  function applyFavoriteVoiceChange() {
    syncToolbar();
    const seg = readingSegment;
    if (!reading || readingPaused || !seg || settings.voiceMode === "browser" || !googleToken) return;
    const nextKey = favVoiceKeyFor(seg.lang);
    if (nextKey === seg.voiceKey) return;
    seg.voiceKey = nextKey; utterance = null; cancelGoogle();
    const pending = seg.translation ? pendingTranslationFor(queue[queueIndex]) : null;
    if (pending) { const voiceSettings = { voiceMode:settings.voiceMode, browserVoiceURI:settings.browserVoiceURI || "", readLanguage:settings.readLanguage || "" }; void speakGoogleNext(pending.text, pending.lang, ++speechDetectionRequest, voiceSettings, pending.lang); return; }
    speakAfterCancel(null);
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
  // v3.5.217: chưa lưu lựa chọn → theo mặc định (bật), giống Dashboard; trước coi như tắt → giọng ngôn ngữ hiển thị đọc tốc độ chung.
  const useLangRate = () => (dashboardShortcuts?.useLanguageSpeechRate ?? globalThis.LHN_CONFIG?.DEFAULT_SETTINGS?.useLanguageSpeechRate) === true;
  function segmentRate(lang) {
    if (!useLangRate() || !isDisplaySpeechLang(lang)) return baseRate();
    // v3.5.217: chỉ dùng tốc độ đã lưu khi người dùng tự chỉnh (giống Dashboard / content.js); chưa chỉnh → mặc định 1.5.
    const custom = dashboardShortcuts?.hasCustomSpeechRateByLanguage?.[displayLang] === true ? Number(dashboardShortcuts?.speechRateByLanguage?.[displayLang]) : NaN;
    if (Number.isFinite(custom)) return clampSpeechRate(custom) ?? 1.5;
    const inherited = Number(dashboardShortcuts?.inheritedSpeechRateByLanguage?.[displayLang]);
    if (Number.isFinite(inherited)) return clampSpeechRate(inherited) ?? 1.5;
    return clampSpeechRate(Number(globalThis.LHN_CONFIG?.DEFAULT_SETTINGS?.speechRateByLanguage?.[displayLang])) ?? 1.5;
  }
  function currentSegmentRate() { return segmentRate(activeSegmentLang()); }
  function editingLanguageRate(lang = activeSegmentLang()) { return useLangRate() && isDisplaySpeechLang(lang); }
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
    readingSegment = { translation: Boolean(forcedLang), lang, voiceKey: favVoiceKeyFor(lang) }; lastAppliedSegmentRate = segmentRate(lang); syncToolbar();
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
  // Bottom bar long-press Đọc menu (keepit-bar.js): read / change the same speed the Reader bar uses.
  globalThis.LHN_READER_BAR = Object.freeze({
    rate:() => currentSegmentRate(),
    stepRate:delta => setSpeechSpeed(currentSegmentRate() + delta),
    autoVoice:() => settings.autoDetectVoice !== false,
    webFont:() => settings.webFontFamily === "'Inter', sans-serif",
    setWebFont:enabled => { saveWebsiteFont(!!enabled); syncToolbar(); },
    // v3.5.160: the Trình đọc row of the Keepit main sheet (touch) — same switches as the Reader's own ☰ tiles
    tileOn:key => readerTileOn(key),
    toggleTile:key => { const on = !readerTileOn(key); setReaderTile(key, on); return on; },
    // v3.5.165: the block "Dịch đoạn" would translate under a finger (keepit-bar swipe-left) — same test as the Reader's own
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
      if (googleToken && readingSegment && settings.voiceMode !== "browser" && favVoiceKeyFor(readingSegment.lang) !== readingSegment.voiceKey) { syncPauseShortcutState(); applyFavoriteVoiceChange(); }   // v3.5.234: đổi giọng Ưu tiên lúc tạm dừng → tiếp tục bằng giọng mới
      else if (googleToken) { syncPauseShortcutState(); syncToolbar(); resumeGoogle(); }
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
      if (Array.isArray(changes[DISPLAY_SETTINGS_KEY].newValue?.favoriteVoices)) favoriteVoices = changes[DISPLAY_SETTINGS_KEY].newValue.favoriteVoices.filter(uri => typeof uri === "string");
      applySharedSpeechRate();
      const nextVoiceMode = dashboardShortcuts.voiceMode === "browser" || (!dashboardShortcuts.voiceMode && dashboardShortcuts.speechVoice === "browser") ? "browser" : "google";
      settings = { ...settings, voiceMode:nextVoiceMode, browserVoiceURI:String(dashboardShortcuts.browserVoiceURI || ""), readLanguage:nextVoiceMode === "google" ? String(dashboardShortcuts.readLanguage || "") : "" };
      selectedVoice = systemVoices.find(voice => voice.voiceURI === settings.browserVoiceURI) || null;
      if (reading && !readingPaused && (previousVoiceMode !== settings.voiceMode || previousVoiceURI !== settings.browserVoiceURI || previousReadLanguage !== settings.readLanguage)) restartCurrentSpeech();
      else applyFavoriteVoiceChange();   // v3.5.234: danh sách yêu thích đổi (tab này hoặc tab khác)
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
    try { favoriteVoices = await LHN_TTS.getFavoriteVoices(); } catch {}
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
