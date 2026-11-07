// Touch toolbar for phones and tablets (top frame only; shown when the device has a touch screen and no mouse).
// Desktop keyboard shortcuts have no equivalent on a touch screen, so each button sends the same key event the
// shortcut would: every check of the extension (site disabled, Reader site list, overlay gate) still applies and no
// feature logic is duplicated here. Nothing is stored or sent except the existing Dashboard / AI panel messages.
(() => {
  "use strict";
  if (window.top !== window || !document.documentElement) return;
  const TOUCH = matchMedia("(pointer: coarse) and (hover: none)");
  const WIDE = matchMedia("(min-width: 600px)");
  const DARK_SCHEME = matchMedia("(prefers-color-scheme: dark)");
  const TEXT = {
    en:{ bilingual:"Bilingual", page:"Translate page", block:"Paragraph", reader:"Read", overlay:"Overlay", dictation:"Dictation", notes:"Notes", ai:"Ask AI", more:"More", wholePage:"Whole page", pickBlock:"Choose a paragraph", pickHint:"Tap the paragraph to translate", cancel:"Cancel", dashboard:"Open Dashboard", settings:"Settings", siteOff:"Turn off Keepit on this site", hideBar:"Hide toolbar", show:"Keepit tools", offPill:"Keepit is off here", turnOn:"Turn on", close:"Close", aiFailed:"Could not open the AI panel on this browser" },
    vi:{ bilingual:"Song ngữ", page:"Dịch trang", block:"Dịch đoạn", reader:"Đọc", overlay:"Overlay", dictation:"Chính tả", notes:"Ghi chú", ai:"Hỏi AI", more:"Thêm", wholePage:"Cả trang", pickBlock:"Chọn đoạn", pickHint:"Chạm vào đoạn muốn dịch", cancel:"Huỷ", dashboard:"Mở Dashboard", settings:"Cài đặt", siteOff:"Tắt Keepit trên trang này", hideBar:"Ẩn thanh công cụ", show:"Công cụ Keepit", offPill:"Keepit đang tắt ở trang này", turnOn:"Bật lại", close:"Đóng", aiFailed:"Không mở được AI panel trên trình duyệt này" },
    ko:{ bilingual:"이중 언어", page:"페이지 번역", block:"문단 번역", reader:"읽기", overlay:"오버레이", dictation:"받아쓰기", notes:"노트", ai:"AI에게 묻기", more:"더보기", wholePage:"전체 페이지", pickBlock:"문단 선택", pickHint:"번역할 문단을 누르세요", cancel:"취소", dashboard:"대시보드 열기", settings:"설정", siteOff:"이 사이트에서 Keepit 끄기", hideBar:"도구 모음 숨기기", show:"Keepit 도구", offPill:"이 사이트에서 Keepit이 꺼져 있음", turnOn:"켜기", close:"닫기", aiFailed:"이 브라우저에서 AI 패널을 열 수 없습니다" }
  };
  const P = {
    lang:'<path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/>',
    para:'<path d="M4 6h16"/><path d="M4 10h16"/><path d="M4 14h10"/><path d="M4 18h7"/><path d="m15 15 3 6 3-6"/>',
    read:'<path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>',
    overlay:'<rect x="2" y="3" width="20" height="14" rx="2"/><path d="m10 7 5 3-5 3z"/><path d="M8 21h8"/><path d="M12 17v4"/>',
    keyboard:'<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M8 13h.01M12 13h.01M16 13h.01M7 16h10"/>',
    notes:'<path d="M2 6h4M2 10h4M2 14h4M2 18h4"/><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9.5 8h5M9.5 12H16M9.5 16H14"/>',
    ai:'<path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z"/><path d="M19 3v4M17 5h4"/>',
    more:'<circle cx="5" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="19" cy="12" r="1.3" fill="currentColor"/>',
    dash:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>',
    gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1"/>',
    power:'<path d="M12 2v10"/><path d="M18.4 6.6a9 9 0 1 1-12.8 0"/>',
    eyeoff:'<path d="m2 2 20 20"/><path d="M6.7 6.7C3.9 8.5 2 12 2 12s3.6 7 10 7c1.9 0 3.6-.6 5-1.5"/><path d="M10.6 5.1c.5-.1.9-.1 1.4-.1 6.4 0 10 7 10 7a17 17 0 0 1-2.2 3.2"/>',
    x:'<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    logo:'<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>'
  };
  const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${P[name]}</svg>`;
  // name → { combo (fixed) | setting (configurable shortcut), event fallback when the shortcut was cleared }
  const COMMANDS = {
    "bilingual-page":{ combo:"Alt+A" }, "bilingual-block":{ combo:"Alt+D" }, reader:{ combo:"Alt+R" },
    overlay:{ setting:"dualSubtitlesShortcut", fallback:"Alt+E", event:"lhn-youtube-dual-subtitles-toggle" },
    dictation:{ setting:"dictationShortcut", fallback:"Alt+F", event:"lhn-youtube-dictation-toggle" },
    notes:{ setting:"sidebarShortcut", fallback:"Alt+Q" },
    "site-toggle":{ setting:"toggleWebsiteShortcut", fallback:"Alt+Z" }
  };
  const PHONE_NAV = ["bilingual", "reader", "overlay", "notes", "more"];
  const TABLET_NAV = ["page", "block", "reader", "overlay", "dictation", "notes", "ai", "more"];
  const NAV_ICON = { bilingual:"lang", page:"lang", block:"para", reader:"read", overlay:"overlay", dictation:"keyboard", notes:"notes", ai:"ai", more:"more" };

  let settings = {}, host = null, root = null, mounted = false, dismissed = false, picking = false, lastBar = "";
  const websiteKey = () => location.hostname.toLowerCase().replace(/^www\./, "").replace(/\.$/, "");
  const siteDisabled = () => Array.isArray(settings.disabledWebsites) && settings.disabledWebsites.includes(websiteKey());
  const lang = () => { const code = globalThis.LHN_LANGUAGES?.languageFor?.(settings) || "en"; return TEXT[code] ? code : "en"; };
  const tr = key => TEXT[lang()][key] || TEXT.en[key] || key;
  const isDark = () => settings.sidebarTheme === "dark" || (settings.sidebarTheme !== "light" && DARK_SCHEME.matches);

  function keyEventFor(combo) {
    const parts = String(combo || "").split("+").map(part => part.trim()).filter(Boolean);
    if (!parts.length) return null;
    const key = parts.pop(), mods = new Set(parts.map(part => part.toLowerCase()));
    const special = { Space:[" ", "Space"], Left:["ArrowLeft", "ArrowLeft"], Right:["ArrowRight", "ArrowRight"], Up:["ArrowUp", "ArrowUp"], Down:["ArrowDown", "ArrowDown"] };
    let eventKey = key, code = key;
    if (special[key]) [eventKey, code] = special[key];
    else if (key.length === 1) { eventKey = key.toLowerCase(); code = /[a-z]/i.test(key) ? "Key" + key.toUpperCase() : /\d/.test(key) ? "Digit" + key : ""; }
    return new KeyboardEvent("keydown", { key:eventKey, code, altKey:mods.has("alt"), ctrlKey:mods.has("ctrl"), shiftKey:mods.has("shift"), metaKey:mods.has("meta"), bubbles:true, cancelable:true, composed:true });
  }
  function run(name) {
    const spec = COMMANDS[name]; if (!spec) return;
    const combo = spec.combo || (typeof settings[spec.setting] === "string" ? settings[spec.setting] : spec.fallback);
    const event = keyEventFor(combo);
    if (event) (document.body || document.documentElement).dispatchEvent(event);
    else if (spec.event) document.dispatchEvent(new CustomEvent(spec.event));
  }
  function send(type) { return globalThis.LHN_MESSAGING?.sendMessage({ type }).catch(() => null); }
  async function askAI() {
    const result = await send("TOGGLE_AI_PANEL");
    if (!result?.ok) toast(tr("aiFailed"));
  }

  const CSS = `
:host { all: initial; }
* { box-sizing: border-box; }
.wrap { --bg: rgba(255,255,255,.95); --panel: #fff; --fg: #1e293b; --muted: #64748b; --line: #e2e8f0; --press: #f1f5f9; --accent: #6d28d9; --soft: #ede9fe; font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; color: var(--fg); -webkit-text-size-adjust: 100%; }
.wrap.dark { --bg: rgba(17,24,39,.95); --panel: #111a2b; --fg: #e2e8f0; --muted: #9ca3af; --line: #263247; --press: #1e293b; --accent: #c4b5fd; --soft: rgba(124,58,237,.24); }
button { font: inherit; color: inherit; -webkit-tap-highlight-color: transparent; }
svg { width: 22px; height: 22px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; flex: none; }
.bar { position: fixed; left: 0; right: 0; bottom: 0; z-index: 3; display: flex; background: var(--bg); -webkit-backdrop-filter: blur(16px); backdrop-filter: blur(16px); border-top: 1px solid var(--line); padding: 6px 4px calc(6px + env(safe-area-inset-bottom, 0px)); transition: transform .3s cubic-bezier(.2,.8,.2,1); }
.bar.hide, .wrap.yield .bar { transform: translateY(calc(100% + 2px)); }
.btn { flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: center; gap: 3px; border: 0; background: none; color: var(--muted); font-size: 11px; font-weight: 600; line-height: 1.15; padding: 3px 1px; cursor: pointer; }
.btn .ico { width: 54px; height: 30px; border-radius: 15px; display: grid; place-items: center; transition: background-color .2s; }
.btn .lb { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.btn:active .ico { background: var(--press); }
.btn.on { color: var(--accent); }
.btn.on .ico { background: var(--soft); }
.pop { position: fixed; left: 8px; bottom: calc(76px + env(safe-area-inset-bottom, 0px)); z-index: 6; min-width: 230px; background: var(--panel); border: 1px solid var(--line); border-radius: 16px; padding: 6px; box-shadow: 0 16px 40px -12px rgba(15,23,42,.35); opacity: 0; visibility: hidden; transform: translateY(8px) scale(.98); transform-origin: bottom left; transition: opacity .18s, transform .18s, visibility .18s; }
.pop.open { opacity: 1; visibility: visible; transform: none; }
.row { width: 100%; display: flex; align-items: center; gap: 12px; border: 0; background: none; font-size: 15px; padding: 12px; border-radius: 10px; cursor: pointer; text-align: left; }
.row:active { background: var(--press); }
.row svg { color: var(--accent); width: 20px; height: 20px; }
.backdrop { position: fixed; inset: 0; z-index: 4; background: rgba(15,23,42,.35); opacity: 0; visibility: hidden; transition: opacity .2s, visibility .2s; }
.backdrop.open { opacity: 1; visibility: visible; }
.backdrop.clear { background: transparent; }
.sheet { position: fixed; left: 0; right: 0; bottom: 0; z-index: 5; max-height: 80vh; overflow-y: auto; background: var(--panel); border-radius: 22px 22px 0 0; padding: 6px 12px calc(14px + env(safe-area-inset-bottom, 0px)); box-shadow: 0 -16px 40px -12px rgba(15,23,42,.3); transform: translateY(105%); transition: transform .28s cubic-bezier(.2,.8,.2,1); }
.sheet.open { transform: none; }
.grab { width: 40px; height: 4px; border-radius: 2px; background: var(--line); margin: 4px auto 10px; }
.head { display: flex; align-items: center; gap: 10px; padding: 0 4px 6px; font-weight: 750; font-size: 16px; }
.logo { width: 28px; height: 28px; border-radius: 8px; display: grid; place-items: center; color: #fff; background: linear-gradient(135deg,#4f46e5,#8b5cf6); }
.logo svg { width: 16px; height: 16px; stroke-width: 2.2; }
.x { margin-left: auto; width: 32px; height: 32px; border: 0; border-radius: 16px; background: var(--press); display: grid; place-items: center; cursor: pointer; }
.x svg { width: 16px; height: 16px; }
.sep { height: 1px; background: var(--line); margin: 6px 8px; }
.chip { position: fixed; top: calc(12px + env(safe-area-inset-top, 0px)); left: 50%; z-index: 7; display: flex; align-items: center; gap: 8px; background: #5b21b6; color: #fff; border-radius: 20px; padding: 8px 8px 8px 14px; font-size: 13.5px; font-weight: 600; box-shadow: 0 10px 30px -8px rgba(91,33,182,.55); transform: translate(-50%, -8px); opacity: 0; visibility: hidden; transition: opacity .2s, transform .2s, visibility .2s; }
.chip.show { transform: translate(-50%, 0); opacity: 1; visibility: visible; }
.chip button { width: 26px; height: 26px; border: 0; border-radius: 13px; background: rgba(255,255,255,.2); display: grid; place-items: center; cursor: pointer; }
.chip svg { width: 14px; height: 14px; }
.fab { position: fixed; right: 12px; bottom: calc(16px + env(safe-area-inset-bottom, 0px)); z-index: 3; width: 44px; height: 44px; border: 0; border-radius: 22px; display: none; place-items: center; color: #fff; background: linear-gradient(135deg,#4f46e5,#8b5cf6); box-shadow: 0 6px 18px rgba(79,70,229,.38); cursor: pointer; }
.fab svg { width: 20px; height: 20px; stroke-width: 2.2; }
.wrap.dismissed .bar, .wrap.off .bar { display: none; }
.wrap.dismissed:not(.yield) .fab { display: grid; }
.pill { position: fixed; right: 12px; bottom: calc(16px + env(safe-area-inset-bottom, 0px)); z-index: 3; display: none; align-items: center; gap: 10px; padding: 6px 6px 6px 12px; border-radius: 22px; background: var(--panel); border: 1px solid var(--line); box-shadow: 0 8px 24px -10px rgba(15,23,42,.35); font-size: 13px; color: var(--muted); }
.pill button { border: 0; border-radius: 16px; padding: 7px 12px; background: linear-gradient(135deg,#4f46e5,#8b5cf6); color: #fff; font-weight: 700; font-size: 13px; cursor: pointer; }
.wrap.off:not(.yield) .pill { display: flex; }
.wrap.off .fab { display: none; }
.toast { position: fixed; left: 50%; bottom: calc(84px + env(safe-area-inset-bottom, 0px)); z-index: 8; max-width: calc(100% - 32px); padding: 10px 16px; border-radius: 12px; background: #1e293b; color: #fff; font-size: 13.5px; transform: translate(-50%, 10px); opacity: 0; visibility: hidden; transition: opacity .2s, transform .2s, visibility .2s; pointer-events: none; }
.toast.show { transform: translate(-50%, 0); opacity: 1; visibility: visible; }
.wrap.dismissed .toast, .wrap.off .toast, .bar.hide ~ .toast { bottom: calc(20px + env(safe-area-inset-bottom, 0px)); }
@media (min-width: 600px) {
  .bar { left: 50%; right: auto; bottom: 16px; width: min(720px, calc(100% - 32px)); transform: translateX(-50%); border: 1px solid var(--line); border-radius: 22px; padding: 6px; box-shadow: 0 16px 40px -16px rgba(15,23,42,.35); }
  .bar.hide, .wrap.yield .bar { transform: translate(-50%, calc(100% + 26px)); }
  .btn { font-size: 12px; }
  .sheet { left: auto; right: 16px; bottom: 96px; width: 380px; border-radius: 20px; border: 1px solid var(--line); opacity: 0; transform: translateY(12px); transition: transform .22s, opacity .22s, visibility .22s; visibility: hidden; }
  .sheet.open { opacity: 1; transform: none; visibility: visible; }
  .grab { display: none; }
  .head { padding-top: 8px; }
  .toast { bottom: 100px; }
}`;

  function build() {
    host = document.createElement("div");
    host.id = "lhn-touch-ui";
    host.setAttribute("style", "all:initial;position:fixed;left:0;top:0;width:0;height:0;z-index:2147483000;");
    root = host.attachShadow({ mode:"open" });
    root.innerHTML = `<style>${CSS}</style><div class="wrap">
      <div class="backdrop"></div>
      <div class="pop" role="menu"></div>
      <div class="bar" role="toolbar" aria-label="Keepit"></div>
      <div class="sheet" role="dialog" aria-modal="true"></div>
      <button class="fab" type="button">${icon("logo")}</button>
      <div class="pill"><span class="pill-t"></span><button type="button" data-cmd="site-toggle"></button></div>
      <div class="chip"><span class="chip-t"></span><button type="button" data-act="pick-cancel">${icon("x")}</button></div>
      <div class="toast" role="status"></div></div>`;
    root.addEventListener("click", onClick);
    const sheet = root.querySelector(".sheet");
    let dragY = null;
    sheet.addEventListener("touchstart", event => { dragY = sheet.scrollTop <= 0 ? event.touches[0].clientY : null; }, { passive:true });
    sheet.addEventListener("touchmove", event => { if (dragY !== null && !WIDE.matches) { const dy = event.touches[0].clientY - dragY; if (dy > 0) sheet.style.transform = `translateY(${dy}px)`; } }, { passive:true });
    sheet.addEventListener("touchend", event => { if (dragY === null) return; const dy = event.changedTouches[0].clientY - dragY; dragY = null; sheet.style.transform = ""; if (dy > 90 && !WIDE.matches) closeAll(); });
  }
  const $ = selector => root.querySelector(selector);

  function render() {
    const wrap = $(".wrap");
    wrap.classList.toggle("dark", isDark());
    wrap.classList.toggle("off", siteDisabled());
    wrap.classList.toggle("dismissed", dismissed);
    const nav = WIDE.matches ? TABLET_NAV : PHONE_NAV, key = nav.join() + lang();
    if (key !== lastBar) {
      lastBar = key;
      $(".bar").innerHTML = nav.map(id => `<button class="btn" type="button" data-nav="${id}" aria-label="${tr(id)}"><span class="ico">${icon(NAV_ICON[id])}</span><span class="lb">${tr(id)}</span></button>`).join("");
      $(".fab").setAttribute("aria-label", tr("show"));
      $(".pill-t").textContent = tr("offPill");
      $(".pill button").textContent = tr("turnOn");
      $(".chip-t").textContent = tr("pickHint");
      $(".chip button").setAttribute("aria-label", tr("cancel"));
    }
    syncState();
  }
  function syncState() {
    if (!mounted) return;
    const wrap = $(".wrap");
    const yieldNow = !!document.querySelector("#lhn-bilingual-reading-bar.lhn-show") || document.documentElement.classList.contains("lhn-video-overlay-open") || !!document.querySelector("#lhn-sidebar.lhn-side-visible");
    wrap.classList.toggle("yield", yieldNow);
    $('[data-nav="reader"]')?.classList.toggle("on", !!document.querySelector(".lhn-bilingual-reading"));
    $('[data-nav="notes"]')?.classList.toggle("on", !!document.querySelector("#lhn-sidebar.lhn-side-visible"));
    if (yieldNow) closeAll();
  }

  function openPop() {
    $(".pop").innerHTML = `<button class="row" type="button" data-cmd="bilingual-page">${icon("lang")}<span>${tr("wholePage")}</span></button><button class="row" type="button" data-act="pick">${icon("para")}<span>${tr("pickBlock")}</span></button>`;
    $(".pop").classList.add("open"); $(".backdrop").classList.add("open", "clear");
  }
  function openSheet() {
    const phone = !WIDE.matches;
    $(".sheet").innerHTML = `<div class="grab"></div><div class="head"><span class="logo">${icon("logo")}</span><span>Keepit</span><button class="x" type="button" data-act="close" aria-label="${tr("close")}">${icon("x")}</button></div>
      ${phone ? `<button class="row" type="button" data-cmd="dictation">${icon("keyboard")}<span>${tr("dictation")}</span></button><button class="row" type="button" data-act="ai">${icon("ai")}<span>${tr("ai")}</span></button><div class="sep"></div>` : ""}
      <button class="row" type="button" data-act="dashboard">${icon("dash")}<span>${tr("dashboard")}</span></button>
      <button class="row" type="button" data-act="settings">${icon("gear")}<span>${tr("settings")}</span></button>
      <div class="sep"></div>
      <button class="row" type="button" data-cmd="site-toggle">${icon("power")}<span>${tr("siteOff")}</span></button>
      <button class="row" type="button" data-act="dismiss">${icon("eyeoff")}<span>${tr("hideBar")}</span></button>`;
    $(".sheet").classList.add("open"); $(".backdrop").classList.add("open"); $(".backdrop").classList.remove("clear");
  }
  function closeAll() {
    if (!root) return;
    $(".pop").classList.remove("open"); $(".sheet").classList.remove("open"); $(".backdrop").classList.remove("open", "clear");
  }
  let toastTimer = 0;
  function toast(message) { const el = $(".toast"); el.textContent = message; el.classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), 2200); }

  function setPicking(on) {
    picking = on; $(".chip").classList.toggle("show", on);
    if (on) $(".bar").classList.add("hide");
  }
  // Paragraph pick: the next tap on the page chooses the paragraph (the tap itself is swallowed so links don't open).
  document.addEventListener("click", event => {
    if (!picking || !mounted || event.composedPath().includes(host)) return;
    event.preventDefault(); event.stopImmediatePropagation();
    setPicking(false); showBar();
    document.dispatchEvent(new MouseEvent("mousemove", { clientX:event.clientX, clientY:event.clientY, bubbles:true }));
    run("bilingual-block");
  }, true);

  function onClick(event) {
    const target = event.target.closest("button, .backdrop"); if (!target) return;
    if (target.classList.contains("backdrop")) { closeAll(); return; }
    if (target.classList.contains("fab")) { dismissed = false; render(); showBar(); return; }
    const nav = target.dataset.nav, cmd = target.dataset.cmd, act = target.dataset.act;
    if (nav) {
      if (nav === "bilingual") { $(".pop").classList.contains("open") ? closeAll() : openPop(); return; }
      if (nav === "more") { openSheet(); return; }
      closeAll();
      if (nav === "page") run("bilingual-page");
      else if (nav === "block") setPicking(true);
      else if (nav === "ai") void askAI();
      else run(nav);
      setTimeout(syncState, 350);
      return;
    }
    if (cmd) { closeAll(); run(cmd); setTimeout(syncState, 350); return; }
    if (act === "pick") { closeAll(); setPicking(true); }
    else if (act === "pick-cancel") { setPicking(false); showBar(); }
    else if (act === "close") closeAll();
    else if (act === "ai") { closeAll(); void askAI(); }
    else if (act === "dashboard") { closeAll(); void send("OPEN_DASHBOARD"); }
    else if (act === "settings") { closeAll(); void send("OPEN_DASHBOARD_SETTINGS"); }
    else if (act === "dismiss") { closeAll(); dismissed = true; render(); }
  }

  // ---------- hide while scrolling down, show when scrolling up ----------
  const lastTop = new WeakMap(); let travel = 0;
  function showBar() { if (root && !picking) $(".bar").classList.remove("hide"); travel = 0; }
  function onScroll(event) {
    if (!mounted || picking) return;
    const target = event.target === document || event.target === window ? document.scrollingElement || document.documentElement : event.target;
    if (!target || target.nodeType !== 1) return;
    const top = target.scrollTop, previous = lastTop.has(target) ? lastTop.get(target) : top;
    lastTop.set(target, top);
    const delta = top - previous;
    if (!delta) return;
    if ((delta > 0) !== (travel > 0)) travel = 0;
    travel += delta;
    const nearEnd = target.scrollHeight - target.clientHeight - top < 4;
    if (top < 8 || nearEnd) showBar();
    else if (travel > 14) { $(".bar").classList.add("hide"); closeAll(); }
    else if (travel < -14) showBar();
  }

  let ticker = 0;
  function mount() {
    if (mounted || !document.body) return;
    if (!host) build();
    document.documentElement.appendChild(host);
    mounted = true; render();
    document.addEventListener("scroll", onScroll, { capture:true, passive:true });
    ticker = setInterval(() => { if (!host.isConnected) document.documentElement.appendChild(host); syncState(); }, 700);
  }
  function unmount() {
    if (!mounted) return;
    mounted = false; clearInterval(ticker); setPicking(false); closeAll();
    document.removeEventListener("scroll", onScroll, true);
    host.remove();
  }
  function update() { if (TOUCH.matches) mount(); else unmount(); if (mounted) render(); }

  // ---------- touch selection → the mouseup the content scripts listen for ----------
  // Long-press selection (and dragging its handles) fires no mouseup, so the Keepit popup/icon would never open.
  // When the selection settles after the finger lifts, send one mouseup at the end of the selection.
  function installTouchSelectionBridge() {
    let touching = false, timer = 0, lastKey = "";
    const selectionKey = () => {
      const selection = getSelection();
      if (!selection || selection.isCollapsed || !selection.rangeCount) return "";
      const rect = selection.getRangeAt(0).getBoundingClientRect();
      return `${selection.toString()}|${Math.round(rect.left)}|${Math.round(rect.top)}|${Math.round(rect.width)}`;
    };
    function fire() {
      if (touching || !TOUCH.matches) return;
      const selection = getSelection();
      if (!selection || selection.isCollapsed || !selection.rangeCount || !selection.toString().trim()) { lastKey = ""; return; }
      const key = selectionKey();
      if (key === lastKey) return;
      lastKey = key;
      const range = selection.getRangeAt(0), rects = range.getClientRects();
      const last = rects[rects.length - 1] || range.getBoundingClientRect();
      const node = range.endContainer, target = node.nodeType === 1 ? node : node.parentElement;
      if (host && target && host.contains(target)) return;
      (target || document.body).dispatchEvent(new MouseEvent("mouseup", { bubbles:true, cancelable:true, composed:true, button:0, clientX:Math.max(0, last.right - 1), clientY:last.top + last.height / 2 }));
    }
    const schedule = () => { if (!TOUCH.matches) return; clearTimeout(timer); timer = setTimeout(fire, 450); };
    document.addEventListener("touchstart", () => { touching = true; }, { capture:true, passive:true });
    document.addEventListener("touchend", () => { touching = false; schedule(); }, { capture:true, passive:true });
    document.addEventListener("touchcancel", () => { touching = false; schedule(); }, { capture:true, passive:true });
    document.addEventListener("selectionchange", schedule);
    document.addEventListener("mouseup", event => { if (event.isTrusted) lastKey = selectionKey(); }, true);
  }

  async function init() {
    installTouchSelectionBridge();
    try { settings = await globalThis.LHN_SETTINGS.get(); } catch { settings = {}; }
    globalThis.LHN_SETTINGS?.subscribe?.(next => { settings = next || {}; if (mounted) render(); });
    TOUCH.addEventListener("change", update);
    WIDE.addEventListener("change", () => { if (mounted) { closeAll(); render(); } });
    DARK_SCHEME.addEventListener("change", () => { if (mounted) render(); });
    if (document.body) update(); else document.addEventListener("DOMContentLoaded", update, { once:true });
  }
  void init();
})();
