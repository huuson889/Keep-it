// Keepit bottom bar (approved demo: keepit-bottom-bar-demo-v8.html) — every device, top frame only.
// Narrow (phone, tablet portrait): full-width bar · wide (tablet landscape, desktop): floating island.
// Buttons reuse the real features: the shortcut each button stands for is replayed as the same key event (so every
// check of the extension — site disabled, Reader site list, overlay gate — still applies), Dashboard / AI panel use the
// existing messages, and the quick settings write the same settings the toolbar popup writes.
// Stored locally only (browser.storage.local): bar preferences + recent searches ("lhnBottomBar") and the
// first-run flag ("touchBarIntroSeen"). Nothing new is sent anywhere; search results open as normal page navigations.
(() => {
  "use strict";
  // v3.5.180: also on the Keepit home page (pages/home.html, js/home/home-ui.js), where page commands wait for a web page
  const HOMEPAGE = /^(chrome|moz)-extension:$/.test(location.protocol) && /\/pages\/home\.html$/.test(location.pathname);
  if (window.top !== window || !document.documentElement || (!HOMEPAGE && !/^https?:$/.test(location.protocol))) return;
  // v3.5.221: Keepit's own bars, sheets and panels keep their size at every page zoom (Cỡ chữ trang, Ctrl +/-), like the
  // browser's own toolbar: <html> gets --keepit-uiz = 1 / zoom and the bar host, the Reader bar/sheets and the notes sidebar use
  // CSS zoom:var(--keepit-uiz). Inside them lengths are "UI px" = page px × zoom (innerWidth, clientX, getBoundingClientRect
  // stay page px) → VW()/VH()/Z() below. Zoom = tabs.getZoom (PAGE_ZOOM_GET); a devicePixelRatio change (zoom applied) is
  // answered in the same frame from the last known ratio, then confirmed by the background.
  const UIZ = globalThis.LHN_UI_ZOOM = (() => {
    let z = 1, base = 0, mq = null;
    function set(v) {
      v = Math.round(Math.min(5, Math.max(0.25, Number(v) || 1)) * 1000) / 1000; base = devicePixelRatio / v;
      const st = document.documentElement.style;
      if (v === z && (v === 1 || st.getPropertyValue("--keepit-uiz"))) return;
      z = v; if (v === 1) st.removeProperty("--keepit-uiz"); else st.setProperty("--keepit-uiz", String(Math.round(1e4 / v) / 1e4));
      dispatchEvent(new CustomEvent("keepit-ui-zoom", { detail:{ zoom:v } }));
    }
    const query = async () => { const r = await globalThis.LHN_MESSAGING?.sendMessage({ type:"PAGE_ZOOM_GET" }).catch(() => null); if (r?.ok && r.value) set(r.value / 100); };
    function watch() { mq?.removeEventListener?.("change", onDpr); mq = matchMedia(`(resolution: ${devicePixelRatio}dppx)`); mq.addEventListener?.("change", onDpr); }
    function onDpr() { if (base) set(Math.round(devicePixelRatio / base * 100) / 100); watch(); void query(); }
    // the resize of a zoom change comes before the media-query event: catch up first (registered before every other
    // resize listener), else the bar would measure the new innerWidth with the old zoom (and close an open sheet)
    function sync() { if (base && Math.abs(devicePixelRatio / base - z) > 0.004) onDpr(); }
    watch(); void query(); addEventListener("resize", sync);
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") void query(); });
    return { get:() => (sync(), z), set };
  })();
  const Z = () => UIZ.get(), VW = () => innerWidth * Z(), VH = () => innerHeight * Z();
  const TOUCH = matchMedia("(pointer: coarse) and (hover: none)");
  const DARK_SCHEME = matchMedia("(prefers-color-scheme: dark)");
  const REDUCED = matchMedia("(prefers-reduced-motion: reduce)");
  const STORE_KEY = "lhnBottomBar", INTRO_KEY = "touchBarIntroSeen", DICTATION_KEY = "dictation:session-index:v1";

  // ---------- text (en / vi / ko) ----------
  // Nhãn en/vi/ko của thanh: js/core/languages.js, khoá `bar_<tên>` (MESSAGES.en/vi/ko).


  // ---------- icons / flags / domains (same as the demo) ----------
  const P = {
  lang:'<path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/>',
  para:'<path d="M4 6h16"/><path d="M4 10h16"/><path d="M4 14h10"/><path d="M4 18h7"/><path d="m15 15 3 6 3-6"/>',
  read:'<path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>',
  overlay:'<rect x="2" y="3" width="20" height="14" rx="2"/><path d="m10 7 5 3-5 3z"/><path d="M8 21h8"/><path d="M12 17v4"/>',
  keyboard:'<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M8 13h.01M12 13h.01M16 13h.01M7 16h10"/>',
  notes:'<path d="M2 6h4M2 10h4M2 14h4M2 18h4"/><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9.5 8h5M9.5 12H16M9.5 16H14"/>',
  ai:'<path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z"/><path d="M19 3v4M17 5h4"/>',
  menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
  captions:'<rect width="18" height="14" x="3" y="5" rx="2"/><path d="M7 15h4M15 15h2M7 11h2M13 11h4"/>',
  cap:'<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
  sparkles:'<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4M22 5h-4M4 17v2M5 18H3"/>',
  dashboard:'<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>',
  settings:'<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  user:'<circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3"/><path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"/>',
  type:'<path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/>',
  tquote:'<path d="M17 6H3M21 12H8M21 18H8M3 12v6"/>',
  tsearch:'<path d="M21 6H3M10 12H3M10 18H3"/><circle cx="17" cy="15" r="3"/><path d="m21 19-1.9-1.9"/>',
  sticky:'<path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z"/><path d="M15 3v4a2 2 0 0 0 2 2h4"/>',
  msgtext:'<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M13 8H7M17 12H7"/>',
  npen:'<path d="M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4"/><path d="M2 6h4M2 10h4M2 14h4M2 18h4"/><path d="M21.378 5.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"/>',
  rotate:'<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="m9 15 3-6 3 6M10 13h4"/>',
  card:'<rect width="20" height="14" x="2" y="5" rx="2"/><path d="M2 10h20"/>',
  search:'<circle cx="11" cy="11" r="7.5"/><path d="m21 21-4.3-4.3"/>',
  dash:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>',
  gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1"/>',
  power:'<path d="M12 2v10"/><path d="M18.4 6.6a9 9 0 1 1-12.8 0"/>',
  hand:'<path d="M22 14a8 8 0 0 1-8 8"/><path d="M18 11v-1a2 2 0 0 0-2-2a2 2 0 0 0-2 2"/><path d="M14 10V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v1"/><path d="M10 9.5V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v10"/><path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>',
  minimize:'<path d="M4 14h6v6"/><path d="M20 10h-6V4"/><path d="m14 10 7-7"/><path d="m3 21 7-7"/>',
  eye:'<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeoff:'<path d="m2 2 20 20"/><path d="M6.7 6.7C3.9 8.5 2 12 2 12s3.6 7 10 7c1.9 0 3.6-.6 5-1.5"/><path d="M10.6 5.1c.5-.1.9-.1 1.4-.1 6.4 0 10 7 10 7a17 17 0 0 1-2.2 3.2"/>',
  pin:'<path d="M12 17v5"/><path d="M9 10.8V4h6v6.8l3 3.2v2H6v-2z"/>',
  x:'<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  home:'<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  restore:'<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
  moon:'<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
  popup:'<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 9h8M8 13h5"/>',
  cursor:'<path d="M9 9l5 12 1.8-5.2L21 14z"/><path d="M7.2 2.2 8 5.1"/><path d="m5.1 8-2.9-.8"/><path d="M14 4.1 12 6"/><path d="m6 12-1.9 2"/>',
  zap:'<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>',
  selicon:'<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>', // ô "Icon Keepit" trong ☰: icon nét như trước v3.5.204 (logo màu giữ cho đầu ☰ / chấm nổi)
  hl:'<path d="m9 11-6 6v3h9l3-3"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/>',
  snote:'<path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8z"/><path d="M15 3v5h6"/><path d="M7 13h6M7 17h9"/>',
  suggest:'<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/><path d="M11 8v6M8 11h6"/>',
  globe:'<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  book:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
  rdscroll:'<path d="M3 2h18"/><rect width="18" height="12" x="3" y="6" rx="2"/><path d="M3 22h18"/>',
  rdauto:'<path d="M12 2Q13 11 22 12Q13 13 12 22Q11 13 2 12Q11 11 12 2Z"/>',
  rdbook:'<path d="M2 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H2z"/><path d="M22 4h-7a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h8z"/>',
  list:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  fill:'<path d="M7 17V7h10"/><path d="M17 17 7 7"/>',
  down:'<path d="m6 9 6 6 6-6"/>', left:'<path d="m15 18-6-6 6-6"/>', right:'<path d="m9 18 6-6-6-6"/>',
  lock:'<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  reload:'<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
  up:'<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>', bulb:'<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>', max:'<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>', min:'<path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/>', lr:'<path d="m8 7-5 5 5 5"/><path d="m16 7 5 5-5 5"/><path d="M3 12h18"/>', gauge:'<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>', voice:'<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v3"/>',
  wifioff:'<path d="M12 20h.01"/><path d="M8.5 16.43a5 5 0 0 1 7 0"/><path d="M5 12.86a10 10 0 0 1 5.17-2.69"/><path d="M19 12.86a10 10 0 0 0-2-1.41"/><path d="M2 8.82a15 15 0 0 1 4.18-2.65"/><path d="M22 8.82a15 15 0 0 0-11.29-3.76"/><path d="m2 2 20 20"/>',
  totop:'<path d="m6 15 6-6 6 6"/>', barhide:'<rect x="3" y="5" width="18" height="7" rx="3.5"/><path d="m8 16 4 4 4-4"/>', barshow:'<rect x="3" y="13" width="18" height="7" rx="3.5"/><path d="m8 8 4-4 4 4"/>',
  hist:'<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>', tsize:'<path d="M4 18 8.5 6h1L14 18M5.6 14h6.8"/><path d="M15.5 18l3-8h1l3 8M16.5 15.5h5"/>',
  pdark:'<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M14.5 15.5A3.5 3.5 0 0 1 10 11a3.5 3.5 0 1 0 4.5 4.5z"/>',
  addhome:'<rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M12 8.5v6M9 11.5h6M11 18.5h2"/>', share:'<path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"/><path d="m16 6-4-4-4 4M12 2v13"/>',
  starOn:'<path d="M12 2 15 9l7 .6-5.3 4.7L18.2 22 12 18.3 5.8 22l1.5-7.7L2 9.6 9 9z" fill="currentColor"/>',
  check:'<path d="m5 12 4 4L19 6"/>', star:'<path d="M12 2 15 9l7 .6-5.3 4.7L18.2 22 12 18.3 5.8 22l1.5-7.7L2 9.6 9 9z"/>'
};
  const LOGO = '<svg viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="kpLogoBar" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#4f46e5"/><stop offset="1" stop-color="#8b5cf6"/></linearGradient></defs><rect width="32" height="32" rx="8" fill="url(#kpLogoBar)" stroke="none"/><g transform="translate(32 0) scale(-1 1)"><g transform="translate(-4.187 -2.393) scale(0.299065)"><path fill="#fff" stroke="none" d="M 35 32 C 34 32 33.5 34 33.2 37 C 31.3 51 34.3 65 42 74 C 48.5 81.5 57 84.6 67 84.5 C 77.5 84.4 84.2 80.3 89.7 73.4 C 92.5 77.3 94.3 81.5 95.4 86.8 C 95.9 89.6 97.8 90.9 99.9 90.2 C 102.1 89.5 102.9 87.5 101.8 84.7 C 98.6 75.9 93.3 69.4 85.4 65.1 C 79.7 62 72.9 61.1 66.1 59.6 C 58.9 58 53.1 54.9 51.6 49.4 C 55.3 52.8 60.2 54.8 67.5 55.8 C 78.7 57.3 87.7 58.3 94.7 65 C 97.3 54.1 92 44.5 82.5 39.9 C 75.4 36.4 68 36.8 59.7 37.6 C 48.6 38.8 41.9 38.6 36.5 32.8 C 36 32.3 35.5 32 35 32 Z"/></g></g></svg>'; // icon-v5 (assets/icons/icon.svg)
  const LEAF = '<svg viewBox="0 0 32 32" aria-hidden="true"><g transform="translate(32 0) scale(-1 1)"><g transform="translate(-4.187 -2.393) scale(0.299065)"><path fill="#fff" stroke="none" d="M 35 32 C 34 32 33.5 34 33.2 37 C 31.3 51 34.3 65 42 74 C 48.5 81.5 57 84.6 67 84.5 C 77.5 84.4 84.2 80.3 89.7 73.4 C 92.5 77.3 94.3 81.5 95.4 86.8 C 95.9 89.6 97.8 90.9 99.9 90.2 C 102.1 89.5 102.9 87.5 101.8 84.7 C 98.6 75.9 93.3 69.4 85.4 65.1 C 79.7 62 72.9 61.1 66.1 59.6 C 58.9 58 53.1 54.9 51.6 49.4 C 55.3 52.8 60.2 54.8 67.5 55.8 C 78.7 57.3 87.7 58.3 94.7 65 C 97.3 54.1 92 44.5 82.5 39.9 C 75.4 36.4 68 36.8 59.7 37.6 C 48.6 38.8 41.9 38.6 36.5 32.8 C 36 32.3 35.5 32 35 32 Z"/></g></g></svg>';
  const ic = n => n === "logo" ? LOGO : n === "leaf" ? LEAF : `<svg viewBox="0 0 24 24" aria-hidden="true">${P[n] || ""}</svg>`;
  const FLAG = {
  en:'<svg class="flag" viewBox="0 0 30 20" preserveAspectRatio="none"><rect width="30" height="20" fill="#fff"/><g fill="#b22234">' + [0, 2, 4, 6, 8, 10, 12].map(i => `<rect y="${(i * 20 / 13).toFixed(2)}" width="30" height="1.54"/>`).join("") + '</g><rect width="12" height="10.77" fill="#3c3b6e"/><g fill="#fff">' + [[2, 2], [5, 2], [8, 2], [3.5, 4.5], [6.5, 4.5], [9.5, 4.5], [2, 7], [5, 7], [8, 7], [3.5, 9], [6.5, 9]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".6"/>`).join("") + '</g></svg>',
  vi:'<svg class="flag" viewBox="0 0 30 20" preserveAspectRatio="none"><rect width="30" height="20" fill="#da251d"/><path fill="#ff0" d="M15 4.4L16.26 8.27H20.33L17.04 10.66L18.29 14.53L15 12.14L11.71 14.53L12.96 10.66L9.67 8.27H13.74Z"/></svg>',
  ko:'<svg class="flag" viewBox="0 0 30 20" preserveAspectRatio="none"><rect width="30" height="20" fill="#fff"/><g transform="rotate(33.69 15 10)"><circle cx="15" cy="10" r="5" fill="#0047a0"/><path fill="#cd2e3a" d="M10 10A5 5 0 0 1 20 10A2.5 2.5 0 0 1 15 10A2.5 2.5 0 0 0 10 10Z"/></g><g fill="#000">' + [[6.2, 4.6, -56.3], [23.8, 15.4, -56.3], [23.8, 4.6, 56.3], [6.2, 15.4, 56.3]].map(([x, y, a]) => `<g transform="translate(${x} ${y}) rotate(${a})"><rect x="-2.2" y="-1.9" width="4.4" height=".8"/><rect x="-2.2" y="-.4" width="4.4" height=".8"/><rect x="-2.2" y="1.1" width="4.4" height=".8"/></g>`).join("") + '</g></svg>'
};
  const DOMAINS = ["youtube.com", "google.com", "wikipedia.org", "vi.wikipedia.org", "facebook.com", "bbc.com", "bbc.co.uk", "cnn.com", "github.com", "gmail.com", "vnexpress.net", "tuoitre.vn", "thanhnien.vn", "reddit.com", "medium.com", "nytimes.com", "theguardian.com", "translate.google.com", "chatgpt.com", "khanacademy.org", "coursera.org", "ted.com", "netflix.com", "instagram.com", "x.com", "tiktok.com", "zalo.me", "shopee.vn", "tiki.vn", "linkedin.com", "stackoverflow.com", "duolingo.com", "nationalgeographic.com", "cambridge.org", "dictionary.cambridge.org", "oxfordlearnersdictionaries.com"];
  const DEMO_COLORS = { yellow:"#fff3a6", green:"#c2f0bd", purple:"#d5cbff", red:"#ffc7c7", blue:"#c3e4ff", orange:"#ffd0a3" };

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" }[c]));
  const norm = s => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "d").toLowerCase().trim();

  let settings = {}, host = null, root = null, mounted = false, picking = false;
  const S = {
    hidden:false, peek:false, scrollHide:false, sOff:0, five:false, autoFive:false, btop:true, gest:{ translate:true, nav:true }, navOff:{},
    coachSeen:false, coachRe:false, introSeen:true, introOn:false, recent:[], scope:"all", active:0, sheetPane:"main",
    kbd:false, vfs:false, yieldBar:false, yieldH:0, yieldToast:false, offline:navigator.onLine === false, pendingTr:null, extYield:false, notesOn:false, offPos:null
  };
  const websiteKey = () => location.hostname.toLowerCase().replace(/^www\./, "").replace(/\.$/, "");
  const siteDisabled = () => Array.isArray(settings.disabledWebsites) && settings.disabledWebsites.includes(websiteKey());
  const langCode = () => { const code = globalThis.LHN_LANGUAGES?.languageFor?.(settings) || "en"; return ["en","vi","ko"].includes(code) ? code : "en"; };
  const t = (key, ...args) => { const M = globalThis.LHN_LANGUAGES?.MESSAGES || {}, k = "bar_" + key; let s = M[langCode()]?.[k] || M.en?.[k] || key; args.forEach((a, i) => { s = s.split(`{${i}}`).join(a); }); return s; };
  const LANGS = () => (globalThis.LHN_LANGUAGES?.LANGS || [{ code:"en", name:"English", native:"English" }, { code:"vi", name:"Vietnamese", native:"Tiếng Việt" }, { code:"ko", name:"Korean", native:"한국어" }]);
  const isDark = () => settings.sidebarTheme === "dark" || (settings.sidebarTheme !== "light" && DARK_SCHEME.matches);
  const isTouch = () => TOUCH.matches;
  const isDesk = () => !TOUCH.matches;
  const isApk = () => globalThis.LHN_PLATFORM === "android";
  // v3.5.179: the Keepit for Android browser adds its own tiles/dialogs (History, Bookmark, Add to Home screen, Text size,
  // Dark pages) through LHN_ANDROID_UI (APK asset android/browser-ui.js); on the APK start/offline page, page commands wait
  const AUI = () => isApk() ? globalThis.LHN_ANDROID_UI || null : null;
  const PD = () => isApk() ? null : globalThis.LHN_PAGE_DARK || null; // Trang tối của extension (js/content/page-dark.js)
  const onHome = () => HOMEPAGE || !!AUI()?.onHome?.();
  const isWide = () => isDesk() ? VW() >= 760 : VW() >= 900 && VH() >= 600;
  const isPland = () => isTouch() && !isWide() && VW() > VH() && VH() < 500;
  const isSmall = () => !isWide() && VW() < 600;
  const isFive = () => !isWide() && (S.five || S.autoFive);
  const smooth = () => REDUCED.matches ? "auto" : "smooth";
  const hostName = () => websiteKey();
  const IS_MAC = /mac/i.test(navigator.userAgentData?.platform || navigator.platform || ""), SEARCH_KEY = IS_MAC ? "Alt+Space" : "Ctrl+Space";
  const pageMobile = () => /width\s*=\s*device-width/i.test(document.querySelector('meta[name="viewport"]')?.content || "");
  const isVideoPage = () => /(^|\.)youtube\.com$/.test(location.hostname) && location.pathname === "/watch";
  const pageTranslated = () => !!window.__lhnBilingualLazy;
  const $ = id => root?.getElementById(id);
  const $$ = (sel, r = root) => r ? [...r.querySelectorAll(sel)] : [];
  const shortcut = (key, fallback) => typeof settings[key] === "string" && settings[key] ? settings[key] : fallback;
  const readerKey = (key, fallback) => { const v = shortcut(key, fallback); return { Left:"←", Right:"→", Up:"↑", Down:"↓" }[v] || v; };

  // ---------- real commands ----------
  const COMMANDS = {
    "bilingual-page":{ combo:"Alt+A" }, "bilingual-block":{ combo:"Alt+D" }, reader:{ combo:"Alt+R" },
    overlay:{ setting:"dualSubtitlesShortcut", fallback:"Alt+E", event:"lhn-youtube-dual-subtitles-toggle" },
    dictation:{ setting:"dictationShortcut", fallback:"Alt+F", event:"lhn-youtube-dictation-toggle" },
    notes:{ setting:"sidebarShortcut", fallback:"Alt+Q" },
    "site-toggle":{ setting:"toggleWebsiteShortcut", fallback:"Alt+Z" }
  };
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
  function send(type, extra) { return globalThis.LHN_MESSAGING?.sendMessage({ type, ...(extra || {}) }).catch(() => null); }
  async function askAI() { const result = await send("TOGGLE_AI_PANEL"); if (!result?.ok) toast(t("aiFailed")); }
  async function saveSettings(patch) {
    settings = { ...settings, ...patch };
    try { await globalThis.LHN_SETTINGS?.save(settings); } catch (error) { console.warn("Keepit bar: could not save settings", error); }
  }
  let storeTimer = 0;
  function persist() {
    clearTimeout(storeTimer);
    storeTimer = setTimeout(() => {
      browser.storage.local.set({ [STORE_KEY]:{ hidden:S.hidden, five:S.five, btop:S.btop, gest:S.gest, navOff:S.navOff, coachSeen:S.coachSeen, recent:S.recent, offPos:S.offPos } }).catch(() => {});
    }, 120);
  }
  function haptic() { if (isApk()) navigator.vibrate?.(12); }

  // ---------- CSS: the demo's bar CSS + the few rules the real page needs ----------
  const CSS = globalThis.LHN_THEME.css(":host") + globalThis.LHN_THEME.scrollbar + globalThis.LHN_BAR_CSS;  // js/shared/theme-tokens.js + js/content/keepit-bar-css.js

  function build() {
    host = document.createElement("div");
    host.id = "lhn-touch-ui";
    host.setAttribute("style", "all:initial;position:fixed;left:0;top:0;width:0;height:0;z-index:2147483000;zoom:var(--keepit-uiz,1);");
    host.setAttribute("data-lhn-bilingual-ui", "true");
    root = host.attachShadow({ mode:"open" });
    root.innerHTML = `<style>${CSS}</style><div class="screen" id="screen">
  <div class="nscrim" id="nscrim"></div>
  <div class="clear" id="clear"></div>
  <div class="pop" id="pop"></div>
  <div class="coach" id="coach" role="dialog"></div>
  <div class="bbar" id="bar" role="toolbar" aria-label="Keepit"><div class="swi l" id="swl">${ic("left")}</div><div class="swi r" id="swr">${ic("right")}</div><div class="bin" id="bin"></div></div>
  <div class="hzone" id="hzone"><i></i></div>
  <button class="btop" id="btop" type="button">${ic("totop")}</button>
  <div class="iscrim" id="iscrim"></div>
  <div class="coach intro" id="intro" role="dialog"></div>
  <button class="offdot" id="offdot" type="button">${ic("leaf")}</button>
  <div class="toast" id="toast" role="status"></div>
  <div class="sheet" id="sheet"><div class="scrim" id="scrim"></div><div class="panel" id="panel"></div></div>
  <div class="srch" id="srch"><div class="scrim2" id="scrim2"></div><div class="sbox" id="sbox">
    <div class="grip" id="sgrip"></div>
    <div class="cur" id="scur" hidden></div>
    <div class="sin">${ic("search")}<input id="sq" type="text" autocomplete="off" spellcheck="false"><button class="sx" type="button" id="sqx" hidden>${ic("x")}</button></div>
    <div class="chips" id="chips"></div>
    <div class="res" id="res"></div>
    <div class="sfoot" id="sfoot"></div>
  </div></div>
</div>`;
    wire();
  }

  // ---------- bar ----------
  const LABEL = { home:"home", page:"page", block:"block", reader:"reader", overlay:"overlay", dictation:"dictation", notes:"notes", ai:"ai", more:"more" };
  const ICON = { home:"home", page:"lang", block:"para", reader:"read", overlay:"overlay", dictation:"cap", notes:"npen", ai:"sparkles", more:"menu" };
  const SHORT = { page:"sPage", overlay:"sOverlay", dictation:"sDictation" };
  const tipFor = id => ({
    home:t("homeTip"), page:`${t("page")} (Alt+A)`, block:`${t("block")} (Alt+D)`, reader:`${t("reader")} (Alt+R)`,
    overlay:`${t("overlay")} (${shortcut("dualSubtitlesShortcut", "Alt+E")})`, dictation:`${t("dictation")} (${shortcut("dictationShortcut", "Alt+F")})`,
    notes:`${t("notes")} (${shortcut("sidebarShortcut", "Alt+Q")})`, ai:`${t("ai")} (Alt+X)`, more:t("more"), search:`${t("search")} (${SEARCH_KEY})`
  }[id]);
  const barPrio = () => isVideoPage() ? ["overlay", "dictation", "page"] : ["page", "reader", "overlay"];
  const spareTool = () => isVideoPage() ? "reader" : "dictation";
  function navLayout() {
    const Pr = barPrio();
    // v3.5.222: Trang chủ = always the first button of the bar (was: ☰ footer); v3.5.223: same number of buttons as before —
    // the last tool of the left group moves to ☰ (wide: Dịch đoạn · phone: barPrio[2] · compact: barPrio[1]), see hiddenTools()
    return isWide() ? (isVideoPage() ? [["home", "overlay", "dictation", "page"], ["reader", "notes", "ai", "more"]] : [["home", "page", "reader", "overlay"], ["dictation", "notes", "ai", "more"]])
      : isFive() ? [["home", Pr[0]], ["notes", "more"]] : [["home", Pr[0], Pr[1]], ["notes", "ai", "more"]];
  }
  function renderBar() {
    if (!root) return;
    const screen = $("screen");
    screen.classList.toggle("wide", isWide()); screen.classList.toggle("desk", isDesk()); screen.classList.toggle("pland", isPland());
    screen.classList.toggle("apk", isApk()); screen.classList.toggle("dark", isDark());
    const [L, R] = navLayout(), sheetOpen = $("sheet").classList.contains("open");
    const b = id => `<button class="nb${(id === "home" && onHome()) || (id === "notes" && S.notesOn) || (id === "page" && pageTranslated()) || (id === "more" && sheetOpen) ? " on" : ""}" type="button" data-nav="${id}" aria-label="${esc(t(LABEL[id]))}"${isDesk() ? ` data-tip="${esc(tipFor(id))}"` : ""}><span class="ico">${ic(ICON[id])}</span><span class="lb">${esc((isSmall() && SHORT[id]) ? t(SHORT[id]) : t(LABEL[id]))}</span></button>`;
    $("bin").innerHTML = L.map(b).join("") + `<button class="sbtn" type="button" data-nav="search" aria-label="${esc(t("search"))}"${isDesk() ? ` data-tip="${esc(tipFor("search"))}"` : ""}>${ic("search")}</button>` + R.map(b).join("");
    $("hzone").title = t("showBar"); $("btop").setAttribute("aria-label", t("toTop")); $("btop").title = t("toTop");
    $("offdot").setAttribute("aria-label", t("offDot")); $("offdot").title = t("offDot");
    $("intro").setAttribute("aria-label", t("introAria")); $("coach").setAttribute("aria-label", t("coachTitle"));
    syncBarVis(); fitLabels();
  }
  // v6: long labels on a narrow screen — if two labels are < 4px apart or cut with "…", shrink to 10px; still tight → 5 buttons (v7)
  function fitLabels() {
    const bar = $("bar"), bin = $("bin");
    bar.classList.remove("tight"); if (isWide()) return;
    if (!bar.offsetWidth) { requestAnimationFrame(() => { if (mounted && $("bar").offsetWidth) fitLabels(); }); return; }   // not laid out yet: measure on the next frame
    const bad = () => { const nbs = [...bin.children]; return nbs.some((b, i) => { const l = b.querySelector(".lb"); if (!l) return false; if (l.scrollWidth > l.clientWidth + 0.5) return true; const n = nbs[i + 1]?.querySelector(".lb"); return n && n.getBoundingClientRect().left - l.getBoundingClientRect().right < 4; }); };
    if (!bad()) return; bar.classList.add("tight");
    if (bad() && !isFive()) { S.autoFive = true; renderBar(); }
  }
  function syncBarVis() {
    if (!root) return;
    const bar = $("bar"), screen = $("screen");
    const off = S.kbd || S.vfs, barless = S.hidden || S.yieldBar;
    bar.classList.toggle("hide", off || barless || S.extYield);
    bar.classList.toggle("peek", barless && S.peek && !off);
    screen.classList.toggle("hidden", barless && !off); screen.classList.toggle("peeking", S.peek);
    screen.classList.toggle("siteoff", S.siteOff);
    screen.classList.toggle("extyield", S.extYield); screen.classList.toggle("readeron", S.readerOn);
    screen.classList.toggle("notesopen", S.notesOn && isTouch()); syncScrollLock();
    screen.classList.toggle("picking", picking);
    screen.style.setProperty("--yb", "0px");   // v3.5.161: folded = the one line at the bottom edge (never lifted above a page bar)
    screen.style.setProperty("--lw", Math.round(bar.offsetWidth * 0.6) + "px");
    screen.style.setProperty("--bh", bar.offsetHeight + "px");
    updBtop(); applyOff(false);
  }
  // v3.5.186: scrolling moves the bar by the same distance (was: all-or-nothing after 6px). S.sOff = px pushed down,
  // 0 … offMax() (bar height + its 4px gap + safe area + 2); full = hidden (S.scrollHide). The back-to-top button follows
  // down to its old "bar hidden" spot. Peek (hidden mode) shows the bar whole.
  let snapT = 0;
  const offMax = () => { const bar = $("bar"); return bar ? bar.offsetHeight + (parseFloat(getComputedStyle(bar).bottom) || 0) + 2 : 80; };
  function applyOff(anim) {
    const bar = $("bar"), b = $("btop"); if (!bar) return;
    const max = offMax(); S.sOff = clamp(S.sOff, 0, max);
    const o = S.peek ? 0 : S.sOff;
    S.scrollHide = o >= max;
    if (anim) { bar.classList.add("snap"); b?.classList.add("snap"); clearTimeout(snapT); snapT = setTimeout(() => { bar.classList.remove("snap"); b?.classList.remove("snap"); }, 280); }
    bar.style.translate = o ? `0 ${o}px` : ""; bar.classList.toggle("shid", S.scrollHide);
    if (b) b.style.translate = "";   // v3.5.240: nút về đầu trang luôn cách đáy 110px, không trượt theo thanh
  }
  // v8: back-to-top — shows after scrolling past one screen (also while scrolling down; flat when the bar is hidden)
  let scroller = null;
  const scrollTopOf = el => !el || el === document.scrollingElement || el === document.documentElement || el === document.body ? (document.scrollingElement?.scrollTop || scrollY) : el.scrollTop;
  const clientHOf = el => !el || el === document.scrollingElement || el === document.documentElement || el === document.body ? innerHeight : el.clientHeight;
  function updBtop() {
    const b = $("btop"); if (!b) return;
    // v3.5.237: Reader open → back-to-top stays (video overlay still hides it). v3.5.240: always 110px from the bottom (CSS)
    b.classList.toggle("on", S.btop && !onHome() && scrollTopOf(scroller) > Math.min(200, clientHOf(scroller) * 0.25) && !S.kbd && !S.vfs && !S.siteOff && (!S.extYield || S.readerOn));
    b.classList.toggle("low", (S.hidden || S.yieldBar) && !S.peek);
  }
  // v7: the page's own fixed bottom bar (cookie, cart, chat…) — Keepit yields: folds to its line (v3.5.161: at the bottom edge)
  let ovRaf = 0;
  const isOwnUi = el => el === host || !!el.closest?.('#lhn-touch-ui,[data-lhn-bilingual-ui],[id^="lhn-"],#keepit-host,[class*="lhn-"]');
  function checkOverlap() {
    if (!mounted) return;
    let h = 0;
    if (!S.siteOff && !S.extYield) {
      const H = innerHeight, W = innerWidth, seen = new Set();
      for (const x of [W * 0.12, W * 0.5, W * 0.88]) {
        for (const el of document.elementsFromPoint(x, H - 3).slice(0, 4)) {
          if (isOwnUi(el) || el === document.documentElement || el === document.body) continue;
          for (let n = el, depth = 0; n && n !== document.body && n !== document.documentElement && depth < 14; n = n.parentElement, depth++) {
            if (seen.has(n)) break; seen.add(n);
            const cs = getComputedStyle(n);
            if (cs.position !== "fixed" && cs.position !== "sticky") continue;
            if (cs.visibility === "hidden" || Number(cs.opacity) === 0) break;
            const r = n.getBoundingClientRect();
            if (r.height && r.bottom >= H - 2 && r.top < H - 2 && r.height < H * 0.4 && r.width >= W * 0.5) h = Math.max(h, H - r.top);
            break;
          }
        }
      }
    }
    const on = h > 0, was = S.yieldBar; S.yieldBar = on; S.yieldH = Math.round(h);
    if (on && !was) { S.peek = false; if (!S.yieldToast) { S.yieldToast = true; toast(t(isDesk() ? "yieldDesk" : "yieldTouch")); } }
    if (on || was) syncBarVis();
  }
  const anyOpen = () => $("sheet").classList.contains("open") || $("srch").classList.contains("open") || $("pop").classList.contains("open");
  // scroll by dy at y: follow it 1:1; near the top always whole; stops half-way → after the finger is up and scrolling
  // stopped (160ms) it glides on in the direction of the last scroll (v3.5.187; was: to the nearer end)
  let settleT = 0, touching = false, lastDir = 0;
  function scrollOff(dy, y) {
    const top = y <= (isPland() ? 16 : 40), was = S.sOff; lastDir = dy > 0 ? 1 : -1;
    if (top) S.sOff = 0;
    else if (dy > 0 && (anyOpen() || Date.now() < showHold)) return;
    else S.sOff = clamp(S.sOff + dy * Z(), 0, offMax());
    if (S.sOff !== was) applyOff(top && was > 0);
    clearTimeout(settleT); settleT = setTimeout(settleOff, 160);
  }
  function settleOff() {
    if (touching) { settleT = setTimeout(settleOff, 160); return; }
    const max = offMax(); if (S.sOff <= 0 || S.sOff >= max) return;
    S.sOff = lastDir > 0 ? max : 0; applyOff(true);
  }
  // v3.5.185: overlay / Reader closed, or ☰ hide → show: the bar is back even if scrolling had hidden it before; the page's own
  // scroll restore right after (overlay close) must not hide it again → 800ms hold
  let showHold = 0;
  function barBack() { showHold = Date.now() + 800; S.scrollHide = false; S.sOff = 0; }
  function setPeek(on) { S.peek = on; syncBarVis(); }
  function setHidden(on) { if (!on) barBack(); S.hidden = on; S.peek = false; persist(); syncBarVis(); toast(on ? t(isDesk() ? "hiddenDesk" : "hiddenTouch") : t("shown")); }
  let toastT = 0;
  function toast(text, undo) {
    const el = $("toast"); if (!el) return;
    el.textContent = text; if (undo?.icon) el.insertAdjacentHTML("afterbegin", `<span class="ti">${ic(undo.icon)}</span>`); el.classList.toggle("act", !!undo?.fn);
    if (undo?.fn) { const b = document.createElement("button"); b.type = "button"; b.className = "tu"; b.textContent = undo.label || t("undo"); b.addEventListener("click", () => { clearTimeout(toastT); el.classList.remove("on", "act"); undo.fn(); }); el.append(b); }
    el.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove("on", "act"), undo?.fn ? 4000 : 1900);
  }

  // v8: offline → say so, don't switch translation on; Retry / back online → Translate now (untranslating still works offline)
  // v3.5.179 Keepit for Android only (demo v12): the offline page (js/content/offline-page.js, style A/B at random per page,
  // review card) replaces the toast; back online it says so and the waiting action runs; Close = keep reading
  function offlinePage(retry) {
    const O = globalThis.LHN_OFFLINE; if (!O || !isApk()) return false;
    S.pendingTr = retry; haptic();
    O.show({ key:location.href, lang:langCode(), dark:isDark(), onBack:() => { S.pendingTr = null; retry(); },
      onNotes:() => { O.hide(); doNav("notes"); } });
    return true;
  }
  function offlineBlock(retry) {
    if (!S.offline) return false;
    if (offlinePage(retry)) return true;
    S.pendingTr = retry; haptic();
    toast(t("offline"), { icon:"wifioff", label:t("retry"), fn:() => { if (S.offline) offlineBlock(retry); else { S.pendingTr = null; retry(); } } });
    return true;
  }
  function syncTr() { root?.querySelector('[data-nav="page"]')?.classList.toggle("on", pageTranslated()); }
  function togglePage() {
    const was = pageTranslated();
    if (!was && offlineBlock(() => togglePage())) return;
    run("bilingual-page");
    setTimeout(() => {
      const now = pageTranslated(); syncTr();
      if (!was && now) toast(t("trPageOn"));
      else if (was && !now) toast(t("trPageOff"), { fn:() => { if (!pageTranslated()) { run("bilingual-page"); syncTr(); if (pageTranslated()) toast(t("trPageAgain")); } } });
    }, 0);
  }
  function setPicking(on) { picking = on; syncBarVis(); }
  function doNav(id, b) {
    if (id === "search") return openSearch();
    if (id === "more") return $("sheet").classList.contains("open") ? closeSheet() : openSheet();
    closePop();
    if (id === "home") { closeSheet(); send("OPEN_HOME").then(r => { if (!r?.ok) toast(t("homeFailed")); }); return; }
    if (onHome() && id !== "notes" && id !== "ai") return toast(t("brNeed"));
    if (id === "page") return togglePage();
    if (id === "block") { if (offlineBlock(() => doNav("block"))) return; setPicking(true); toast(t("pickHint")); return; }
    if (id === "reader") { run("reader"); setTimeout(() => { if (document.querySelector("#lhn-bilingual-reading-bar.lhn-show")) toast(t("readerStart")); syncState(); }, 300); return; }
    if (id === "ai") { void askAI(); return; }
    run(id); setTimeout(syncState, 350);
  }
  // Paragraph pick: the next tap/click on the page chooses the paragraph (the tap itself is swallowed so links don't open).
  document.addEventListener("click", event => {
    if (!picking || !mounted || event.composedPath().includes(host)) return;
    event.preventDefault(); event.stopImmediatePropagation();
    setPicking(false);
    document.dispatchEvent(new MouseEvent("mousemove", { clientX:event.clientX, clientY:event.clientY, bubbles:true }));
    run("bilingual-block");
  }, true);
  addEventListener("keydown", event => { if (picking && event.key === "Escape") setPicking(false); }, true);

  // ---------- popups (quick options) ----------
  function openPop(btn, noOn, html) {
    introDone(); closeSheet(); hideCoach(); $("toast").classList.remove("on", "act");
    const pop = $("pop");
    pop.innerHTML = '<div class="grip"></div>' + html;
    const r = btn.getBoundingClientRect();
    pop.style.left = clamp(r.left * Z(), 8, VW() - pop.offsetWidth - 8) + "px";
    // v3.5.159: measured from the bar's top edge (+6px = the demo's bar padding), so the taller touch bar keeps the demo's gap
    const bar = $("bar"), top = bar.contains(btn) ? bar.getBoundingClientRect().top + 6 : r.top;
    pop.style.bottom = (innerHeight - top) * Z() + 8 + "px";
    pop.classList.add("open"); $("clear").classList.add("on"); if (!noOn) btn.classList.add("on");
  }
  function closePop() { $("pop")?.classList.remove("open"); $("clear")?.classList.remove("on"); }
  const readerRate = () => { const r = Number(globalThis.LHN_READER_BAR?.rate?.()); return Number.isFinite(r) && r > 0 ? r : 1; };
  // v7: long-press 0.45 s on Translate / Read (touch) = quick options
  function openQuick(nb) {
    const cur = LANGS().find(l => l.code === langCode()) || LANGS()[0];
    const html = nb.dataset.nav === "page"
      ? `<div class="qh">${esc(t("page"))}</div><button class="row" type="button" data-p="tr-page">${ic("lang")}<span>${esc(t(pageTranslated() ? "qUntrPage" : "qTrPage"))}</span></button><button class="row" type="button" data-p="pick">${ic("para")}<span>${esc(t("qPick"))}</span></button><button class="row" type="button" data-p="tr-lang">${ic("globe")}<span>${esc(t("qTo"))}</span><small>${esc(cur.native)}</small></button>`
      : `<div class="qh">${esc(t("reader"))}</div><button class="row" type="button" data-p="rd-start">${ic("read")}<span>${esc(t("qStart"))}</span></button><div class="row qspd">${ic("gauge")}<span>${esc(t("qSpeed"))}</span><button type="button" data-p="rd-dn" aria-label="${esc(t("slower"))}">−</button><b class="qrate">${readerRate().toFixed(2)}x</b><button type="button" data-p="rd-up" aria-label="${esc(t("faster"))}">+</button></div><button class="row" type="button" data-p="rd-voice">${ic("voice")}<span>${esc(t("qVoice"))}</span><small>${esc(t(globalThis.LHN_READER_BAR?.autoVoice?.() === false ? "custom" : "auto"))}</small></button>`;
    openPop(nb, true, html);
  }
  function onPopClick(e) {
    const r = e.target.closest("[data-p]"); if (!r) return; const p = r.dataset.p;
    if (p === "rd-dn" || p === "rd-up") {
      const next = globalThis.LHN_READER_BAR?.stepRate?.(p === "rd-up" ? 0.05 : -0.05);
      $("pop").querySelector(".qrate").textContent = (Number.isFinite(Number(next)) && next !== null ? Number(next) : readerRate()).toFixed(2) + "x"; return;
    }
    closePop();
    if (p === "tr-page") return togglePage();
    if (p === "tr-lang") return openSheet();
    if (p === "rd-start") return doNav("reader");
    if (p === "rd-voice") return toast(t(globalThis.LHN_READER_BAR?.autoVoice?.() === false ? "voiceSet" : "voiceAuto"));
    if (p === "pick") { if (offlineBlock(() => { setPicking(true); toast(t("pickHint")); })) return; setPicking(true); toast(t("pickHint")); }
  }

  // ---------- bar swipe: right = previous page, left = next page (touch) · long-press quick options ----------
  // v3.5.160: past the first / last page of this tab's history, a back / forward swipe moves to the previous / next tab
  // of the window (background.js TAB_NEIGHBORS / SWITCH_TAB: tab order only, nothing stored or sent out). APK = one view.
  const tabNb = { prev:false, next:false };
  function refreshTabs() { if (isApk() || !isTouch()) return; send("TAB_NEIGHBORS").then(r => { if (r && typeof r === "object") { tabNb.prev = !!r.prev; tabNb.next = !!r.next; } }); }
  const histCan = back => { const nav = window.navigation; if (back) return nav?.canGoBack ?? history.length > 1; return nav?.canGoForward ?? true; };
  // v3.5.182: navigation.canGoBack / canGoForward only know pages of the same site, so a previous / next page of another
  // site (or the Keepit home page) counted as "no history" and the swipe jumped to a tab. Rule now (browser only):
  // back / forward always tries this tab's history first; the browser starting to leave the page (beforeunload /
  // pagehide) or a same-page step (popstate / currententrychange) = it moved; nothing within 450 ms = no more history
  // → back = previous tab (left), forward = next tab (right). Every page of the tab counts, the Keepit home page too
  // (v3.5.183: the v3.5.182 "pass through the home page" step is gone).
  const canGo = back => histCan(back) || (!isApk() && (history.length > 1 || tabNb[back ? "prev" : "next"]));
  let goBusy = 0;
  function go(back) {
    if (isApk()) { if (!histCan(back)) return false; if (back) history.back(); else history.forward(); return true; }
    if (Date.now() < goBusy) return true;
    goBusy = Date.now() + 700;
    let moved = false;
    const mark = () => { moved = true; }, evs = ["beforeunload", "pagehide", "popstate"], nav = window.navigation;
    evs.forEach(n => addEventListener(n, mark, { once:true })); nav?.addEventListener?.("currententrychange", mark, { once:true });
    try { if (back) history.back(); else history.forward(); } catch {}
    setTimeout(() => {
      evs.forEach(n => removeEventListener(n, mark)); nav?.removeEventListener?.("currententrychange", mark);
      if (moved) return;
      goBusy = 0;
      if (tabNb[back ? "prev" : "next"]) void send("SWITCH_TAB", { dir:back ? -1 : 1 });
      else toast(noGoText(back));
    }, 450);
    return true;
  }
  const noGoText = back => t(isApk() ? (back ? "noBack" : "noFwd") : (back ? "noBackTab" : "noFwdTab"));
  let sw = null, lpT = 0, lpEat = 0, swallowClick = false;
  function wireBar() {
    const bar = $("bar"), bin = $("bin");
    bin.addEventListener("click", e => {
      introDone();
      if (swallowClick) { swallowClick = false; return; }
      const b = e.target.closest("[data-nav]"); if (!b) return;
      doNav(b.dataset.nav, b);
    });
    bar.addEventListener("pointerdown", e => {
      if (isDesk() || e.button > 0) return; sw = { x:e.clientX, y:e.clientY, id:e.pointerId, on:false, dx:0 }; refreshTabs();
      const nb = e.target.closest('[data-nav="page"],[data-nav="reader"]'); clearTimeout(lpT); lpT = 0;
      if (nb) lpT = setTimeout(() => { lpT = 0; sw = null; lpEat = Date.now() + 10000; openQuick(nb); haptic(); }, 450);
    });
    bar.addEventListener("contextmenu", e => { if (isTouch()) e.preventDefault(); });
    bar.addEventListener("pointermove", e => {
      if (!sw || e.pointerId !== sw.id) return;
      const dx = (e.clientX - sw.x) * Z(), dy = (e.clientY - sw.y) * Z();
      if (lpT && Math.hypot(dx, dy) > 8) { clearTimeout(lpT); lpT = 0; }
      if (!sw.on) { if (Math.abs(dx) < 10 || Math.abs(dx) < Math.abs(dy)) return; sw.on = true; bar.classList.add("swiping"); try { bar.setPointerCapture(e.pointerId); } catch {} }
      sw.dx = dx; const W = bar.offsetWidth, need = W * 0.3, p = clamp(Math.abs(dx) / need, 0, 1), back = dx > 0, can = canGo(back);
      bin.style.transform = `translateX(${clamp(dx, -need, need) * (can ? 0.35 : 0.15)}px)`;
      const el = back ? $("swl") : $("swr"), other = back ? $("swr") : $("swl");
      other.style.opacity = 0; el.style.opacity = p; el.style.transform = `scale(${0.5 + 0.5 * p})`;
      el.classList.toggle("go", p >= 1 && can); el.classList.toggle("no", !can);
    });
    const endSwipe = e => {
      if (lpT) { clearTimeout(lpT); lpT = 0; }
      if (!sw && lpEat) lpEat = Date.now() + 400;
      if (!sw || e.pointerId !== sw.id) return;
      const s = sw; sw = null;
      if (!s.on) return;
      swallowClick = true; setTimeout(() => { swallowClick = false; }, 60);
      bar.classList.remove("swiping"); bin.style.transform = "";
      $$(".swi").forEach(x => { x.style.opacity = 0; x.style.transform = "scale(.5)"; x.classList.remove("go", "no"); });
      if (Math.abs(s.dx) >= bar.offsetWidth * 0.3 && e.type === "pointerup") { const back = s.dx > 0; if (go(back)) haptic(); else toast(noGoText(back)); }
    };
    bar.addEventListener("pointerup", endSwipe); bar.addEventListener("pointercancel", endSwipe);
    // release after a long-press: swallow exactly one click (it can land on the button or on the overlay that just opened)
    $("screen").addEventListener("click", e => { if (lpEat && Date.now() < lpEat) { lpEat = 0; e.stopPropagation(); e.preventDefault(); } }, true);
    // hidden bar: desktop hover the line 0.3 s → show, leave 0.6 s → hide · touch tap the line
    let peekT = 0;
    wireBar.peekLater = () => { clearTimeout(peekT); peekT = setTimeout(() => { if (!anyOpen() && !bar.matches(":hover")) setPeek(false); }, 600); };
    $("hzone").addEventListener("mouseenter", () => { if (!isDesk() || !(S.hidden || S.yieldBar)) return; clearTimeout(peekT); peekT = setTimeout(() => setPeek(true), 300); });
    $("hzone").addEventListener("mouseleave", () => { if (!isDesk()) return; clearTimeout(peekT); if (S.peek) wireBar.peekLater(); });
    $("hzone").addEventListener("click", () => { if ((S.hidden || S.yieldBar) && isTouch()) setPeek(true); });
    bar.addEventListener("mouseenter", () => { if (isDesk() && S.peek) clearTimeout(peekT); });
    bar.addEventListener("mouseleave", () => { if (isDesk() && S.peek) wireBar.peekLater(); });
    wireOffDot();
    $("btop").addEventListener("click", () => {
      const el = scroller && scroller !== document.body && scroller !== document.documentElement && scroller !== document.scrollingElement && scroller.isConnected ? scroller : null;
      (el || window).scrollTo({ top:0, behavior:smooth() }); haptic();
    });
  }

  // ---------- ☰ sheet ----------
  const TOG = [["icon", "selicon", "tIcon", "tIconTip"], ["showOnSelect", "sticky", "tShow", "tShowTip"], ["autoHighlight", "hl", "tHl", "tHlTip"], ["autoTranslate", "msgtext", "tTr", "tTrTip"], ["sentenceNote", "tquote", "tSent", "tSentTip"], ["autoSpeak", "read", "tSpeak", "tSpeakTip"], ["quickPopup", "lang", "tPopup", "tPopupTip"], ["fullDict", "book", "tDict", "tDictTip"]];
  const togValue = k => ({ icon:settings.translateIconEnabled === true, showOnSelect:settings.showOnSelect === true, autoHighlight:settings.autoHighlight === true, autoTranslate:settings.autoTranslate !== false, sentenceNote:settings.sentenceNoteEnabled !== false, autoSpeak:settings.autoSpeakSelectedText !== false, quickPopup:settings.translationPopupEnabled === true, fullDict:settings.showFullEnglishDictionary !== false }[k]);
  // same rules as the toolbar popup (popup.js): Keepit icon / note popup / direct translation popup are mutually exclusive
  function togPatch(k, on) {
    if (k === "icon") return on ? { translateIconEnabled:true, showOnSelect:false, translationPopupEnabled:false } : { translateIconEnabled:false };
    if (k === "showOnSelect") return on ? { showOnSelect:true, translateIconEnabled:false, translationPopupEnabled:false } : { showOnSelect:false };
    if (k === "quickPopup") return on ? { translationPopupEnabled:true, showOnSelect:false, translateIconEnabled:false } : { translationPopupEnabled:false };
    if (k === "autoHighlight") return { autoHighlight:on };
    if (k === "autoTranslate") return { autoTranslate:on };
    if (k === "sentenceNote") return { sentenceNoteEnabled:on };
    if (k === "autoSpeak") return { autoSpeakSelectedText:on, autoSpeakOnTranslate:on };
    if (k === "fullDict") return { showFullEnglishDictionary:on };
    return {};
  }
  const COLORS = ["yellow", "green", "purple", "red", "blue", "orange"];
  const colorHex = k => globalThis.LHN_CONFIG?.HIGHLIGHT_COLORS?.[k] || DEMO_COLORS[k];
  const curColor = () => globalThis.LHN_CONFIG?.normalizeColor?.(settings.defaultHighlightColor) || settings.defaultHighlightColor || "yellow";
  const KEYS = () => ({ overlay:shortcut("dualSubtitlesShortcut", "Alt+E"), ai:"Alt+X", dictation:shortcut("dictationShortcut", "Alt+F"), reader:"Alt+R", site:shortcut("toggleWebsiteShortcut", "Alt+Z") });
  const NAVTILE = { overlay:["overlay", "overlay"], ai:["sparkles", "ai"], dictation:["cap", "dictation"], reader:["read", "reader"], page:["lang", "page"], block:["para", "block"] };
  const tile = (act, icon, label, on, tip, val, badge) => { const k = KEYS()[act], ttl = k ? `${tip || label} (${k})` : tip; return `<button class="q${on ? " on" : ""}" type="button" data-q="${act}"${ttl ? ` title="${esc(ttl)}"` : ""}><span class="ic">${ic(icon)}</span>${badge ? `<b class="qbadge">${esc(badge)}</b>` : ""}<span>${esc(label)}${val ? `<small>${esc(val)}</small>` : ""}</span></button>`; };
  const navTile = id => tile(id, NAVTILE[id][0], t(NAVTILE[id][1]));
  // ☰ Công cụ: every tool that is not on the bar right now (v3.5.223)
  const hiddenTools = () => { const on = new Set(navLayout().flat()); return [...new Set([...barPrio(), "ai", "block", spareTool()])].filter(id => !on.has(id)).map(navTile).join(""); };
  // v3.5.163: ☰ footer (fixed, never scrolls) — Cài đặt · Bật trang · Ẩn/Hiện thanh, icon + label like the tiles
  const foot = (act, icon, label, on, tip) => { const k = KEYS()[act], ttl = k ? `${tip || label} (${k})` : tip; return `<button class="fq${on ? " on" : ""}" type="button" data-q="${act}"${ttl ? ` title="${esc(ttl)}"` : ""}${on !== undefined ? ` aria-pressed="${!!on}"` : ""}>${ic(icon)}<span>${esc(label)}</span></button>`; };
  let fontOn = false;
  // v7: tapping inside ☰ never jumps to the top — keep the scroll position when the same pane is redrawn
  // v3.5.208: Cỡ chữ (extension) = Cỡ chữ trang của APK: 50–200 %, bước 10, có xem trước và Đặt lại.
  // Extension không có textZoom của WebView nên dùng mức thu phóng của trình duyệt cho tab này (background PAGE_ZOOM_*).
  let extZoom = 100, zoomT = 0;
  async function readZoom() { const r = await send("PAGE_ZOOM_GET"); if (r?.ok) UIZ.set(r.value / 100); if (r?.ok && r.value !== extZoom) { extZoom = r.value; if ($("sheet")?.classList.contains("open")) renderSheet(); } }
  function setZoom(v) {
    extZoom = Math.min(200, Math.max(50, Math.round(v / 10) * 10)); clearTimeout(zoomT);
    zoomT = setTimeout(async () => { const r = await send("PAGE_ZOOM_SET", { value:extZoom }); if (!r?.ok) toast(t("zoomFail")); else UIZ.set(r.value / 100); }, 60);
  }
  function zoomPaneSync() {
    const panel = $("panel"), r = panel.querySelector("#zr"); if (!r) return;
    r.value = extZoom; panel.querySelector("#zo").textContent = extZoom + "%"; panel.querySelector("#zp").style.fontSize = (15 * extZoom / 100) + "px";
    panel.querySelector('[data-q="zminus"]').disabled = extZoom <= 50; panel.querySelector('[data-q="zplus"]').disabled = extZoom >= 200;
  }
  function zoomHTML() {
    return `<div class="zprev" id="zp">${esc(t("zoomPrev"))}</div>
    <div class="zrow"><button class="zpm" type="button" data-q="zminus" title="${esc(t("zoomOut"))}" aria-label="${esc(t("zoomOut"))}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h12"/></svg></button><input id="zr" type="range" min="50" max="200" step="10" value="${extZoom}" aria-label="${esc(t("zoomT"))}"><button class="zpm" type="button" data-q="zplus" title="${esc(t("zoomIn"))}" aria-label="${esc(t("zoomIn"))}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h12M12 6v12"/></svg></button><output id="zo">${extZoom}%</output></div>
    <div class="zact"><button class="zbtn" type="button" data-q="zreset">${esc(t("zoomReset"))}</button><span class="sp"></span><button class="zbtn pri" type="button" data-q="back">${esc(t("zoomDone"))}</button></div>`;
  }
  let sheetPaneDrawn = "";
  function renderSheet() {
    const panel = $("panel"), same = sheetPaneDrawn === S.sheetPane && $("sheet").classList.contains("open"), top = same ? panel.querySelector(".sbody")?.scrollTop || 0 : 0;
    sheetPaneDrawn = S.sheetPane; renderSheet0();
    const b = panel.querySelector(".sbody"); if (b && top) { b.scrollTop = top; updFade(); }
  }
  function renderSheet0() {
    const panel = $("panel"), narrow = !isWide(), cur = LANGS().find(l => l.code === langCode()) || LANGS()[0];
    if (S.sheetPane === "keys") {
      panel.innerHTML = `<div class="grip"></div><div class="shead"><button class="sx" type="button" data-q="back" aria-label="${esc(t("back"))}">${ic("left")}</button><b>${esc(t(isDesk() ? "keys" : "gestures"))}</b><span class="sp"></span></div><div class="sbody">${keysHTML()}</div><button class="smore" type="button" aria-label="${esc(t("moreBelow"))}">${ic("down")}</button>`;
      requestAnimationFrame(updFade); return;
    }
    if (S.sheetPane === "zoom") {
      panel.innerHTML = `<div class="grip"></div><div class="shead"><button class="sx" type="button" data-q="back" aria-label="${esc(t("back"))}">${ic("left")}</button><b>${esc(t("zoomT"))}</b><span class="sp"></span></div><div class="sbody">${zoomHTML()}</div>`;
      panel.querySelector("#zr").addEventListener("input", ev => { setZoom(+ev.target.value); zoomPaneSync(); });
      zoomPaneSync(); return;
    }
    const compactTip = S.autoFive ? t("compactAuto") : t("compactTip", t(NAVTILE[barPrio()[1]][1]));
    // v3.5.179: Keepit for Android (LHN_ANDROID_UI) = the demo v12 ☰ (Công cụ · Trang này · Khi chọn chữ · Màu · Trình đọc ·
    // Giao diện + browser tiles); the browser keeps the v3.5.174 ☰
    const A = AUI(), home = onHome(), marked = !home && !!A?.isMarked?.(), zoom = Number(A?.zoomValue?.()) || 100;
    panel.innerHTML = A ? `<div class="grip"></div><div class="shead"><span class="logo">${ic("logo")}</span><b>Keepit</b><span class="sp"></span><button class="lchip" type="button" data-q="account"><span class="av">${ic("user")}</span>${esc(t("login"))}</button></div>
  <div class="sbody">
    <div class="langrow"><label for="lsearch">${esc(t("language"))}</label><div class="lwrap"><span class="lflag">${FLAG[cur.code] || ""}</span><input id="lsearch" role="combobox" aria-expanded="false" aria-controls="lopts" autocomplete="off" placeholder="${esc(t("langSearch"))}" value="${esc(cur.native)}"><svg class="caret" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg><span class="lname">${esc(cur.name)}</span><div class="lopts" id="lopts" role="listbox"></div></div></div>
    <div class="divider"></div>
    <div class="sec">${esc(t("tools"))}</div><div class="quick">${tile("dashboard", "dashboard", t("dashboard"))}${tile("hist", "hist", t("hist"))}${hiddenTools()}${isDesk() ? tile("keys", "keyboard", t("keys"), false, t("keysTip")) : tile("keys", "hand", t("gestures"), false, t("gesturesTip"))}</div>
    <div class="divider"></div>
    <div class="sec">${esc(t("pageSec"))}</div><div class="quick">${tile("reload", "reload", t("reload"))}${tile("share", "share", t("brShare"))}${tile("mark", marked ? "starOn" : "star", t("brMark"), marked) + tile("addhome", "addhome", t("brHome"))}${tile("restore", "rotate", t("restore"), false, t("restoreTip"))}</div>
    <div class="divider"></div>
    <div class="sec">${esc(t("onSelect"))}</div><div class="quick">${TOG.map(([k, i, l, full]) => tile("t:" + k, i, t(l), togValue(k), t(full))).join("")}</div>
    <div class="divider"></div>
    <div class="sec">${esc(t("colors"))}</div><div class="colors">${COLORS.map(k => `<button class="cdot${curColor() === k ? " on" : ""}" type="button" data-color="${k}" title="${esc(t(k))}" aria-label="${esc(t(k))}" style="background:${colorHex(k)}">${ic("check")}</button>`).join("")}</div>
    ${readerRowHTML()}
    <div class="divider"></div>
    <div class="sec">${esc(t("lookSec"))}</div><div class="quick">${tile("theme", isDark() ? "moon" : "sun", t("theme"), isDark())}${tile("pdark", "pdark", t("pdark"), !!A.pageDark?.() && isDark(), t("pdarkBetaTip"), "", t("beta")) + tile("zoom", "tsize", zoom === 100 ? t("zoom") : `${t("zoom")} ${zoom}%`, zoom !== 100, t("zoomTip"))}${tile("font", "type", t("font"), fontOn)}${narrow ? tile("compact", "minimize", t("compact"), isFive(), compactTip) : ""}${tile("btop", "totop", t("btopTile"), S.btop, t("btopTip"))}${tile("t:suggest", "tsearch", t("suggest"), false, t("suggestTip"))}</div>
  </div><button class="smore" type="button" aria-label="${esc(t("moreBelow"))}">${ic("down")}</button>
  <div class="mfoot">${foot("settings", "settings", t("settings"))}${foot("site", "power", t("siteTile"), false, t("siteTip"))}${S.hidden ? foot("show", "barshow", t("show")) : foot("hide", "barhide", t("hide"))}</div>` : `<div class="grip"></div><div class="shead"><span class="logo">${ic("logo")}</span><b>Keepit</b><span class="sp"></span><button class="lchip" type="button" data-q="account"><span class="av">${ic("user")}</span>${esc(t("login"))}</button></div>
  <div class="sbody">
    <div class="langrow"><label for="lsearch">${esc(t("language"))}</label><div class="lwrap"><span class="lflag">${FLAG[cur.code] || ""}</span><input id="lsearch" role="combobox" aria-expanded="false" aria-controls="lopts" autocomplete="off" placeholder="${esc(t("langSearch"))}" value="${esc(cur.native)}"><svg class="caret" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg><span class="lname">${esc(cur.name)}</span><div class="lopts" id="lopts" role="listbox"></div></div></div>
    <div class="divider"></div>
    <div class="sec">${esc(t("tools"))}</div><div class="quick">${tile("dashboard", "dashboard", t("dashboard"))}${hiddenTools()}${tile("restore", "rotate", t("restore"), false, t("restoreTip"))}${isDesk() ? tile("keys", "keyboard", t("keys"), false, t("keysTip")) : tile("keys", "hand", t("gestures"), false, t("gesturesTip"))}${narrow ? tile("compact", "minimize", t("compact"), isFive(), compactTip) : ""}</div>
    <div class="divider"></div>
    <div class="sec">${esc(t("onSelect"))}</div><div class="quick">${TOG.map(([k, i, l, full]) => tile("t:" + k, i, t(l), togValue(k), t(full))).join("")}</div>
    ${readerRowHTML()}
    <div class="divider"></div>
    <div class="sec">${esc(t("colors"))}</div><div class="colors">${COLORS.map(k => `<button class="cdot${curColor() === k ? " on" : ""}" type="button" data-color="${k}" title="${esc(t(k))}" aria-label="${esc(t(k))}" style="background:${colorHex(k)}">${ic("check")}</button>`).join("")}</div>
    <div class="divider"></div>
    <div class="sec">${esc(t("lookSite"))}</div><div class="quick">${tile("theme", isDark() ? "moon" : "sun", t("theme"), isDark())}${tile("pdark", "pdark", t("pdark"), !!PD()?.pageDark?.() && isDark(), t("pdarkBetaTip"), "", t("beta"))}${tile("zoom", "tsize", extZoom === 100 ? t("zoom") : `${t("zoom")} ${extZoom}%`, extZoom !== 100, t("zoomTip"))}${tile("font", "type", t("font"), fontOn)}${isApk() ? tile("t:suggest", "tsearch", t("suggest"), false, t("suggestTip")) : ""}${tile("btop", "totop", t("btopTile"), S.btop, t("btopTip"))}</div>
  </div><button class="smore" type="button" aria-label="${esc(t("moreBelow"))}">${ic("down")}</button>
  <div class="mfoot">${foot("settings", "settings", t("settings"))}${foot("site", "power", t("siteTile"), false, t("siteTip"))}${S.hidden ? foot("show", "barshow", t("show")) : foot("hide", "barhide", t("hide"))}</div>`;
    wireLang(); alignColors(); requestAnimationFrame(updFade);
  }
  // Trình đọc row (v3.5.160; every device since v3.5.161) = the Reader's own ☰ switches (LHN_READER_BAR.tileOn / toggleTile)
  const RDT = [["autoscroll", "rdscroll", "rdAutoscroll"], ["parabtn", "read", "rdIcon"], ["autolang", "rdauto", "rdLang"], ["readtranslation", "rdbook", "rdBi"]];
  function readerRowHTML() {
    const rb = globalThis.LHN_READER_BAR; if (!rb?.tileOn) return "";
    return `<div class="divider"></div><div class="sec" data-sec="rd">${esc(t("rdSec"))}</div><div class="quick">${RDT.map(([k, i, l]) => tile("rd:" + k, i, t(l), rb.tileOn(k))).join("")}</div>`;
  }
  // v5: the highlight-color frame lines up with the first/last tile of the grid above
  function alignColors() {
    const panel = $("panel"), c = panel.querySelector(".colors"), q = c?.previousElementSibling?.previousElementSibling?.previousElementSibling; if (!c || !q?.classList.contains("quick")) return;
    const ics = [...q.querySelectorAll(".q .ic")]; if (!ics.length) return;
    const top = ics[0].offsetTop, row = ics.filter(i => Math.abs(i.offsetTop - top) < 2);
    const qr = q.getBoundingClientRect(), l = row[0].getBoundingClientRect().left, r = Math.max(...row.map(i => i.getBoundingClientRect().right));
    c.style.marginLeft = (l - qr.left) + "px"; c.style.marginRight = (qr.right - r) + "px";
  }
  function updFade() {
    const panel = $("panel"), b = panel?.querySelector(".sbody"); if (!b) return;
    const below = b.scrollTop + b.clientHeight < b.scrollHeight - 4, above = b.scrollTop > 4;
    b.classList.toggle("fb", below); b.classList.toggle("ft", above); panel.classList.toggle("more-below", below);
  }
  function wireLang() {
    const inp = root.getElementById("lsearch"), box = root.getElementById("lopts"); if (!inp) return;
    const cur = () => LANGS().find(l => l.code === langCode()) || LANGS()[0];
    const draw = (q = "") => { const n = norm(q), f = LANGS().filter(l => !n || norm(`${l.name} ${l.native} ${l.code}`).includes(n)); box.innerHTML = f.length ? f.map(l => `<div class="lopt${l.code === langCode() ? " on" : ""}" role="option" tabindex="0" aria-selected="${l.code === langCode()}" data-lang="${l.code}">${FLAG[l.code] || ""}<span class="ln">${esc(l.native)}</span><span class="le">${esc(l.name)}</span></div>`).join("") : `<div class="lempty">${esc(t("langNone"))}</div>`; };
    const wrap = inp.parentElement, lname = wrap.querySelector(".lname"), pad = () => { inp.style.paddingRight = wrap.classList.contains("open") ? "" : lname.offsetWidth + 38 + "px"; }, shut = () => { wrap.classList.remove("open"); setTimeout(pad); box.classList.remove("open"); inp.setAttribute("aria-expanded", "false"); inp.value = cur().native; };
    pad(); inp.addEventListener("focus", () => { inp.value = ""; draw(); wrap.classList.add("open"); pad(); box.classList.add("open"); inp.setAttribute("aria-expanded", "true"); });
    inp.addEventListener("input", () => { draw(inp.value); wrap.classList.add("open"); box.classList.add("open"); });
    inp.addEventListener("keydown", e => { e.stopPropagation(); if (e.key === "Escape") { shut(); inp.blur(); } if (e.key === "ArrowDown") { e.preventDefault(); box.querySelector(".lopt")?.focus(); } });
    box.addEventListener("keydown", e => { e.stopPropagation(); const o = e.target.closest(".lopt"); if (o && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); o.click(); } if (e.key === "Escape") shut(); });
    inp.addEventListener("blur", () => setTimeout(() => { if (!box.contains(root.activeElement)) shut(); }, 150));
  }
  // Gestures (touch) / Shortcuts (desktop) for the current page — README Keyboard shortcuts, overlay-controller.js, dictation.js
  function keysHTML() {
    const video = isVideoPage(), art = !video && hasArticle(), G = [];
    if (isDesk()) {
      G.push([t("gGeneral"), [[t("kSite"), shortcut("toggleWebsiteShortcut", "Alt+Z")], [t("kAi"), "Alt+X"], [t("kNotes"), shortcut("sidebarShortcut", "Alt+Q")]]]);
      G.push([t("onSelect"), [[t("kNotePopup"), shortcut("shortcut", "Alt+S")], [t("kTranslateSel"), shortcut("translateSelectedShortcut", "Alt+W")]]]);
      if (!video) G.push([t("gTrRead"), [[t("kLazy"), "Alt+A"], [t("kNear"), "Alt+D"], [t("kRead"), "Alt+R"]]], [t("gReading"), [[t("kPause"), readerKey("speechPauseShortcut", "Space")], [t("kPrevNext"), `${readerKey("previousReadingShortcut", "Left")} / ${readerKey("nextReadingShortcut", "Right")}`], [t("kSpeed"), `${readerKey("increaseReadingSpeedShortcut", "Up")} / ${readerKey("decreaseReadingSpeedShortcut", "Down")}`], [t("kVoice"), shortcut("selectVoiceShortcut", "Alt+L")]]]);
      if (video) G.push([t("gVideo"), [[t("overlay"), shortcut("dualSubtitlesShortcut", "Alt+E")], [t("dictation"), shortcut("dictationShortcut", "Alt+F")], [t("kPlay"), "Space / K"], [t("kPrevS"), "← / J"], [t("kNextS"), "→ / L"], [t("kRate"), "< / >"]]], [t("dictation"), [[t("kPlay"), "`"], [t("kReplay"), "Ctrl"]]]);
      G.push([t("gBar"), [[t("kPickRes"), "↑ / ↓"], [t("kOpenRes"), "Enter"], [t("kClose"), "Esc"]]]);
    } else {
      if (art) G.push([t("gTranslate"), [[t("kPara"), t("vSwipeLeftPara"), 1], [t("kAll"), pageMobile() ? t("vTriple") : t("vNoPc"), 1]], "translate"]);
      G.push([t("onSelect"), [[t("kSelIcon"), t("vLongPress")]]]);
      if (video) G.push([t("gVideoPort"), [[t("kTheater"), t("vSwipeUpVideo")], [t("kPlayStop"), t("vTapSub")], [t("kSeekS"), t("vTapLine")], [t("kLookUp"), t("vLongSub")], [t("kFav"), t("vDouble")]]], [t("gTheater"), [[t("kControls"), t("vTapVideo")], [t("kVolume"), t("vLeftV")], [t("kBright"), t("vRightV")], [t("kSeek"), t("vSwipeH")], [t("kExitTheater"), t("vSwipeDownMid")]]]);
      G.push([t("gBar"), [[t(isApk() ? "kPrevNextPage" : "kPrevNextPageTab"), t("vSwipeBar")], [t("kQuick"), t("vHoldTr"), 1], [t("kHideShow"), t("vScroll")], [t("kShowHidden"), t("vTapLine2")]]]);
      G.push([t("gPopups"), [[t("kExpand"), t("vDragUp")], [t("kShrink"), t("vDragDown")], [t("kCloseP"), t("vTapOut")]]]);
    }
    return (isDesk() ? "" : `<button class="krev" type="button" data-q="coach">${ic("bulb")}<span>${esc(t("coachRev"))}</span>${ic("right")}</button>`) + `<div class="ksub">${esc(t("onPage") + (document.title || hostName()))}</div>` + G.map(([g, rows, sw], gi) => `${gi ? '<div class="divider"></div>' : ""}${sw ? `<div class="sec ksec"><span>${esc(g)}</span><button class="sw${S.gest[sw] ? " on" : ""}" type="button" role="switch" aria-checked="${S.gest[sw]}" aria-label="${esc(t("enableG") + g)}" data-q="g:${sw}"></button></div>` : `<div class="sec">${esc(g)}</div>`}<div class="kgrp${sw && !S.gest[sw] ? " off" : ""}">${rows.map(([a, key, nw]) => `<div class="krow"><span>${esc(a)}${nw ? `<i class="knew">${esc(t("newTag"))}</i>` : ""}</span><kbd>${esc(key)}</kbd></div>`).join("")}</div>`).join("");
  }
  function anchorPanel() {
    const panel = $("panel");
    if (!isWide()) { panel.style.left = ""; panel.style.bottom = ""; return; }
    const k = Z(); // rects = page px, panel = UI px
    if (S.sheetFrom) { const r = S.sheetFrom, w = panel.offsetWidth; panel.style.left = clamp((r.left + r.width / 2) * k - w / 2, 12, VW() - w - 12) + "px"; panel.style.bottom = (innerHeight - r.top) * k + 14 + "px"; return; }
    const btn = $("bin").querySelector('[data-nav="more"]'), br = $("bar").getBoundingClientRect(); if (!btn) return;
    const r = btn.getBoundingClientRect(), w = panel.offsetWidth, W = VW(), cx = (r.left + r.width / 2) * k;
    panel.style.left = clamp(cx - w / 2, 12, W - w - 12) + "px";
    panel.style.bottom = (innerHeight - br.top) * k + 10 + "px";
  }
  function openSheet() {
    introDone(); closePop(); hideCoach(); S.sheetPane = "main"; const panel = $("panel");
    panel.classList.remove("full"); panel.style.maxHeight = ""; fontOn = globalThis.LHN_READER_BAR?.webFont?.() ?? fontOn; renderSheet(); setTimeout(updFade, 320);
    $("sheet").classList.add("open"); $("bin").querySelector('[data-nav="more"]')?.classList.add("on"); anchorPanel();
    document.dispatchEvent(new CustomEvent("lhn-main-sheet", { detail:{ open:true } })); // v3.5.217: Reader ẩn thanh phím tắt
    if (!AUI()) void readZoom();
  }
  function closeSheet() {
    if (!$("sheet")?.classList.contains("open")) return;
    $("sheet").classList.remove("open"); $("bin").querySelector('[data-nav="more"]')?.classList.remove("on");
    document.dispatchEvent(new CustomEvent("lhn-main-sheet", { detail:{ open:false } }));
    if (S.sheetFrom) { S.sheetFrom = null; setTimeout(() => { if (!$("sheet").classList.contains("open")) host.style.zIndex = "2147483000"; }, 300); }
    if (S.peek && isDesk()) wireBar.peekLater?.();
  }
  async function toggleFont() {
    const next = !fontOn; fontOn = next;
    if (globalThis.LHN_READER_BAR?.setWebFont) globalThis.LHN_READER_BAR.setWebFont(next);
    else {
      const data = await browser.storage.local.get("lhnBilingualReaderSettings").catch(() => ({}));
      await browser.storage.local.set({ lhnBilingualReaderSettings:{ ...(globalThis.LHN_DEFAULTS?.reader || {}), ...(data.lhnBilingualReaderSettings || {}), webFontFamily:next ? "'Inter', sans-serif" : "" }, lhnCustomFontSettings:{ customFontEnabled:next, fontKey:next ? "inter" : "auto" } }).catch(() => {});
    }
    renderSheet(); toast(t(next ? "fontOn" : "fontOff"));
  }
  async function onPanelClick(e) {
    if (isApk() && e.target.closest?.(".grip") && !isWide()) {   // v3.5.179 APK: tap the grip = switch between the 2 steps
      const panel = $("panel"), on = !panel.classList.contains("full");
      panel.style.transition = "max-height .22s ease"; panel.classList.toggle("full", on); panel.style.maxHeight = "";
      setTimeout(() => { panel.style.transition = ""; updFade(); }, 240); return;
    }
    const panel = $("panel");
    if (e.target.closest(".smore")) { const b = panel.querySelector(".sbody"); b.scrollBy({ top:b.clientHeight * 0.7, behavior:smooth() }); return; }
    const c = e.target.closest("[data-color]");
    if (c) { await saveSettings({ defaultHighlightColor:c.dataset.color }); renderSheet(); toast(t("colorSet") + c.title); return; }
    const l = e.target.closest("[data-lang]");
    if (l) { await saveSettings({ language:l.dataset.lang }); renderBar(); $("bin").querySelector('[data-nav="more"]')?.classList.add("on"); renderSheet(); anchorPanel(); toast(t("langSet") + l.querySelector(".ln").textContent); return; }
    const b = e.target.closest("[data-q]"); if (!b) return;
    const a = b.dataset.q, home0 = onHome();
    if (a === "keys" || a === "back") { S.sheetPane = a === "keys" ? "keys" : "main"; renderSheet(); anchorPanel(); return; }
    if (a === "zoom" && !AUI()) { S.sheetPane = "zoom"; renderSheet(); anchorPanel(); void readZoom(); return; }
    if (a === "zreset") { setZoom(100); zoomPaneSync(); return; }
    if (a === "zminus" || a === "zplus") { setZoom(extZoom + (a === "zplus" ? 10 : -10)); zoomPaneSync(); return; }
    if (a === "compact") { if (S.autoFive) { toast(t("compactAutoToast")); return; } S.five = !S.five; persist(); renderBar(); $("bin").querySelector('[data-nav="more"]')?.classList.add("on"); renderSheet(); anchorPanel(); toast(t(S.five ? "five" : "seven")); return; }
    if (a.startsWith("g:")) { const k = a.slice(2), st = panel.querySelector(".sbody").scrollTop; S.gest[k] = !S.gest[k]; persist(); renderSheet(); panel.querySelector(".sbody").scrollTop = st; toast(t(S.gest[k] ? "on" : "off") + t(k === "nav" ? "navG" : "trG")); return; }
    if (a.startsWith("rd:")) { const on = globalThis.LHN_READER_BAR?.toggleTile?.(a.slice(3)); renderSheet(); toast(t(on ? "on" : "off") + b.textContent.trim()); return; }
    if (a.startsWith("t:")) { const k = a.slice(2); if (k === "suggest") return; const on = !togValue(k); await saveSettings(togPatch(k, on)); renderSheet(); toast(t(on ? "on" : "off") + b.textContent.trim()); return; }
    if (a === "theme") { await saveSettings({ sidebarTheme:isDark() ? "light" : "dark" }); renderBar(); $("bin").querySelector('[data-nav="more"]')?.classList.add("on"); renderSheet(); return; }
    if (a === "font") { await toggleFont(); return; }
    if (a === "btop") { S.btop = !S.btop; persist(); renderSheet(); updBtop(); toast(t(S.btop ? "btopOn" : "btopOff")); return; }
    if (home0 && ["reload", "share", "mark", "addhome", "site", "restore"].includes(a)) { closeSheet(); toast(t("brNeed")); return; }
    if (a === "pdark") { const on = !!(AUI() || PD())?.togglePageDark?.(); renderSheet(); if (!isDark()) toast(t("pdarkLight")); else toast(t(on ? "on" : "off") + t("pdark")); return; }
    if (a === "coach") { closeSheet(); S.coachSeen = false; S.coachRe = true; setTimeout(showCoach, 300); return; }
    if (a === "account") { closeSheet(); void send("OPEN_DASHBOARD_ACCOUNT"); return; }
    if (NAVTILE[a]) { closeSheet(); doNav(a); return; }
    if (a === "site") { closeSheet(); if (siteDisabled()) return; run("site-toggle"); setTimeout(syncState, 250); return; }   // content.js shows the one on/off toast
    if (a === "home") { closeSheet(); send("OPEN_HOME").then(r => { if (!r?.ok) toast(t("homeFailed")); }); return; }
    if (a === "hide") { closeSheet(); setHidden(true); return; }
    if (a === "show") { closeSheet(); setHidden(false); return; }
    closeSheet();
    if (a === "dashboard") void send("OPEN_DASHBOARD");
    else if (a === "settings") void send("OPEN_DASHBOARD_SETTINGS");
    else if (a === "restore") { if (globalThis.LHN_BAR_ACTIONS?.restoreHighlights?.()) toast(t("restored")); }
    // v3.5.179 Keepit for Android ☰ tiles (LHN_ANDROID_UI)
    else if (a === "reload") location.reload();
    else if (a === "share") AUI()?.share?.();
    else if (a === "hist") AUI()?.history?.();
    else if (a === "mark") AUI()?.bookmark?.();
    else if (a === "addhome") AUI()?.addHome?.();
    else if (a === "zoom") AUI()?.zoom?.();
  }

  // ---------- page gestures (touch): swipe left on a paragraph = translate / untranslate it · 2-finger tap = whole page
  // v3.5.184: no back / forward swipe on the page any more (back / forward = swipe on the bar, Android Back, the browser);
  // a right swipe on the page does nothing (free for selecting text); 3-finger tap → 2-finger tap. Ignored: 24px edges (Android Back),
  // video/canvas/iframe/inputs/sliders, elements that declare their own touch-action (carousels), horizontal scrollers,
  // an active text selection, a long-press before moving, pinch-zoomed pages, and gestures the page already handled.
  const EDGE = 24, PARA_SEL = "p,li,blockquote,dd,dt,figcaption,h1,h2,h3,h4,h5,h6", ART_SEL = PARA_SEL + ",article,main", INTERACTIVE = "a,button,input,textarea,select,label,summary,video,canvas,iframe,[contenteditable],[role=button],[role=link],[role=slider],[role=tab]";
  const hasArticle = () => [...document.querySelectorAll("p")].slice(0, 40).some(p => (p.textContent || "").trim().length > 60);
  // v3.5.165: a paragraph = what the Reader's "Dịch đoạn" translates there (also leaf <div> text, gaps between paragraphs);
  // was: only p/li/h*/… under the finger, so other text blocks and the gaps fell through to the page swipe (arrow)
  const paraOf = (t0, x, y) => {
    let p = t0.closest?.(PARA_SEL);
    if (!p && x !== undefined) { const b = globalThis.LHN_READER_BAR?.blockAt?.(x, y); if (b && !b.closest(INTERACTIVE) && b !== document.body) p = b; }
    return p && !isOwnUi(p) && (p.textContent || "").trim().length >= 2 && !p.closest("nav,header,footer,[role=navigation],[role=menu]") ? p : null;
  };
  const hasCard = p => !!p && (p.matches(".lhn-bilingual-card") || !!p.querySelector(":scope > .lhn-bilingual-card") || !!p.closest(".lhn-bilingual-card"));
  function translateAt(x, y) {
    document.dispatchEvent(new MouseEvent("mousemove", { clientX:x, clientY:y, bubbles:true }));
    run("bilingual-block");
  }
  function togglePara(p, x, y) {
    const translated = hasCard(p) || !!p.querySelector?.(".lhn-bilingual-card");
    if (!translated && offlineBlock(() => togglePara(p, x, y))) return;
    // v3.5.164: the paragraph is still shifted by the swipe — aim inside its current box (was: the start point, often past
    // its right edge after a natural right-to-left swipe, so the Reader picked the next paragraph instead)
    const r0 = p.getBoundingClientRect();
    translateAt(clamp(x, r0.left + 4, r0.right - 4), clamp(y, Math.max(r0.top + 2, 0), Math.min(r0.bottom - 2, innerHeight - 1)));
    if (translated) toast(t("paraOff"), { fn:() => { if (!p.isConnected) return; const r = p.getBoundingClientRect(); translateAt(clamp(x, r.left + 2, r.right - 2), clamp(r.top + 4, 0, innerHeight - 1)); toast(t("paraAgain")); } });
    else toast(t("paraOn"));
  }
  let pg = null, tri = null, t1 = 0;
  const paraFx = { el:null, prev:null };
  function setParaFx(p, dx, go) {
    if (paraFx.el !== p) { clearParaFx(); paraFx.el = p; paraFx.prev = { translate:p.style.translate, background:p.style.backgroundColor, radius:p.style.borderRadius, transition:p.style.transition }; }
    p.style.transition = "none"; p.style.translate = `${Math.max(dx, -90) * 0.6}px 0`; p.style.borderRadius = "8px"; p.style.backgroundColor = go ? "rgba(156,39,176,.14)" : "rgba(156,39,176,.06)";
  }
  function clearParaFx() {
    const p = paraFx.el, v = paraFx.prev; paraFx.el = null; if (!p || !v) return;
    p.style.transition = "translate .2s, background-color .2s"; p.style.translate = v.translate; p.style.backgroundColor = v.background; p.style.borderRadius = v.radius;
    setTimeout(() => { p.style.transition = v.transition; }, 220);
  }
  function gestureAllowed() { return mounted && isTouch() && !S.siteOff && !S.extYield && !S.kbd && !S.vfs && !(visualViewport && visualViewport.scale > 1.05); }
  function onPageTouchStart(e) {
    touching = true;
    if (e.composedPath().includes(host)) return;
    if (S.peek) setPeek(false);
    // v3.5.184: two fingers tapping together (landing ≤ 300ms apart, not moving) = translate / untranslate the whole page;
    // moving them = the browser's pinch zoom as usual (was v3.5.164: three fingers, clashed with phones' 3-finger screenshot)
    if (e.touches.length === 1) { tri = null; t1 = Date.now(); }
    else if (e.touches.length === 2 && !tri && Date.now() - t1 < 300 && gestureAllowed() && S.gest.translate && pageMobile() && !isOwnUi(e.target)) tri = { t:Date.now(), pts:new Map([...e.touches].map(o => [o.identifier, [o.clientX, o.clientY]])), moved:false };
    else tri = null;
    if (!gestureAllowed() || e.touches.length !== 1) { pg = null; return; }
    const p0 = e.touches[0], target = e.target instanceof Element ? e.target : e.target?.parentElement; if (!target) { pg = null; return; }
    const para = S.gest.translate ? paraOf(target, p0.clientX, p0.clientY) : null;
    if (!para) { pg = null; return; }
    pg = { x:p0.clientX, y:p0.clientY, t:Date.now(), p:para, target, mode:null, dx:0, dead:false,
      edge:p0.clientX < EDGE || p0.clientX > innerWidth - EDGE || !getSelection().isCollapsed };
  }
  function onPageTouchMove(e) {
    if (tri && [...e.touches].some(o => { const q = tri.pts.get(o.identifier); return q && Math.hypot(o.clientX - q[0], o.clientY - q[1]) > 16; })) tri.moved = true;
    if (!pg || pg.edge || pg.dead || e.touches.length !== 1) return;
    const p0 = e.touches[0], dx = p0.clientX - pg.x, dy = p0.clientY - pg.y;
    if (e.defaultPrevented && !pg.mode) { pg.dead = true; return; }
    if (!pg.mode) {
      if (Math.abs(dx) < 10 || Math.abs(dx) < Math.abs(dy) * 1.5) { if (Math.abs(dy) > 10) pg.dead = true; return; }
      if (Date.now() - pg.t > 500) { pg.dead = true; return; }
      if (dx < 0 && pg.p) pg.mode = "para";
      else { pg.dead = true; return; }
      getSelection().removeAllRanges();
    }
    pg.dx = Math.min(0, dx); setParaFx(pg.p, pg.dx, pg.dx <= -60);
  }
  function onPageTouchEnd(e) {
    if (!e.touches?.length) touching = false;
    // two-finger tap ends when both fingers are up (or the touches are cancelled before moving); within 500ms
    if (tri && (e.touches.length === 0 || e.type === "touchcancel")) { const g = tri; tri = null; if (!g.moved && Date.now() - g.t < 500) { getSelection().removeAllRanges(); togglePage(); haptic(); coachDone(); } }
    const s = pg; pg = null; if (!s) return;
    const up = e.type === "touchend", end = e.changedTouches?.[0];
    if (s.mode === "para") { clearParaFx(); if (s.dx <= -60 && up) { togglePara(s.p, s.x, s.y); haptic(); coachDone(); } return; }
  }

  // ---------- v6: gesture tips once on touch (after the v8 intro) ----------
  let coachT = 0;
  const coachItems = () => { const art = !isVideoPage() && hasArticle(), it = []; if (art && S.gest.translate) { it.push([t("cSwipePara"), t("kPara")]); if (pageMobile()) it.push([t("vTriple"), t("kAll")]); } if ($("bin").querySelector('[data-nav="page"],[data-nav="reader"]')) it.push([t("cHold"), t("kQuick")]); return it; };
  function showCoach() {
    const it = coachItems(); if (!it.length || !isTouch() || S.kbd || S.vfs || S.siteOff || S.extYield) return;
    $("coach").innerHTML = `<div class="ch1">${ic("hand")}<b>${esc(t(S.coachRe ? "coachTitle" : "coachNew"))}</b></div><ul>${it.map(([g, r]) => `<li><span>${esc(g)}</span><em>${esc(r)}</em></li>`).join("")}</ul><div class="cb"><button type="button" data-c="all">${esc(t("seeAll"))}</button><button type="button" class="pri" data-c="ok">${esc(t("gotIt"))}</button></div>`;
    $("coach").classList.add("on");
  }
  function hideCoach() { clearTimeout(coachT); $("coach")?.classList.remove("on"); }
  function coachDone() { if (!S.coachSeen) { S.coachSeen = true; persist(); } hideCoach(); }
  function scheduleCoach() { hideCoach(); if (isTouch() && !S.coachSeen && S.introSeen && !S.introOn) coachT = setTimeout(() => { if (!anyOpen()) showCoach(); }, 700); }

  // ---------- v8: first-run intro (flag touchBarIntroSeen in storage.local) ----------
  function introHTML() {
    const rows = [["lang", t("i1")], ["search", t("i2")], ["menu", t("i3")]];
    if (isDesk()) rows.push(["keyboard", t("i4d")], ["eyeoff", t("i5d")]);
    else rows.push(["lr", t("i4t")], ["eyeoff", t("i5t")]);
    return `<div class="ch1">${ic("logo")}<b>${esc(t("introTitle"))}<small>${esc(t("introSub"))}</small></b></div><ul>${rows.map(([i, s]) => `<li>${ic(i)}<span>${esc(s)}</span></li>`).join("")}</ul><div class="cb"><button type="button" class="pri" data-i="ok">${esc(t("gotIt"))}</button></div>`;
  }
  function showIntro() {
    if (S.introSeen || S.siteOff || S.extYield || S.kbd || S.vfs || anyOpen()) return;
    hideCoach(); S.introOn = true; S.scrollHide = false; S.sOff = 0; S.peek = S.hidden ? true : S.peek; syncBarVis();
    $("intro").innerHTML = introHTML(); $("intro").classList.add("on"); $("screen").classList.add("introon");
  }
  function introDone() {
    if (!S.introOn) return; S.introOn = false; S.introSeen = true;
    browser.storage.local.set({ [INTRO_KEY]:true }).catch(() => {});
    $("intro").classList.remove("on"); $("screen").classList.remove("introon");
    if (S.hidden && S.peek) setPeek(false);
    scheduleCoach();
  }

  // ---------- search popup ----------
  const SCOPES = () => [["all", t("scAll")], ["dict", t("scDict")], ["notes", t("scNotes")], ["lists", t("scLists")], ["web", "Google"], ["yt", "YouTube"]];
  const looksUrl = q => /^(https?:\/\/)?[\w-]+(\.[\w-]+)+(:\d+)?(\/\S*)?$/i.test(q) && !/\s/.test(q);
  function hiFrag(text, q) { const s = String(text), i = norm(s).indexOf(norm(q)); if (!q || i < 0) return esc(s); return esc(s.slice(0, i)) + "<strong>" + esc(s.slice(i, i + q.length)) + "</strong>" + esc(s.slice(i + q.length)); }
  let ROWS = [], DATA = { notes:[], sessions:[] };
  const hostOf = url => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; } };
  async function loadSearchData() {
    try {
      const [all, store] = await Promise.all([send("GET_ALL"), browser.storage.local.get(DICTATION_KEY)]);
      DATA = { notes:Array.isArray(all) ? all : [], sessions:Array.isArray(store?.[DICTATION_KEY]?.sessions) ? store[DICTATION_KEY].sessions : [] };
    } catch { DATA = { notes:[], sessions:[] }; }
    if ($("srch")?.classList.contains("open")) renderResults();
  }
  const isWord = s => /^[a-z][a-z'’-]*$/i.test(String(s || "").trim());
  function buildRows(q) {
    const rows = [], nq = norm(q), sc = S.scope, has = s => norm(s).includes(nq);
    if (!q) {
      if (sc === "all" && S.recent.length) { rows.push({ sec:t("recentSec"), clear:true }); S.recent.forEach((r, i) => rows.push({ icon:"clock", title:esc(r.q), sub:{ search:t("rSearch"), url:t("rUrl"), dict:"Keepit Dictionary", yt:"YouTube" }[r.k] || "", act:() => runRecent(r), rm:i })); }
      return rows;
    }
    const word = isWord(q);
    if (sc === "all") {
      const opens = []; if (looksUrl(q)) opens.push(q.replace(/^https?:\/\//, ""));
      if (!/\s|\./.test(q) && nq.length >= 2) DOMAINS.filter(d => d.startsWith(nq) || d.replace(/^\w+\./, "").startsWith(nq)).slice(0, 2).forEach(d => { if (!opens.includes(d)) opens.push(d); });
      if (opens.length) { rows.push({ sec:t("addrSec") }); opens.forEach(u => rows.push({ icon:"globe", title:hiFrag(u, q), sub:t(isApk() ? "openPage" : "openNewTab"), act:() => { addRecent("url", u); openUrl(/^https?:\/\//i.test(q) && u === q.replace(/^https?:\/\//, "") ? q : "https://" + u); } })); }
    }
    const kp = [];
    if ((sc === "all" || sc === "dict") && word) kp.push({ icon:"book", kpc:true, title:esc(t("lookup", q.trim())), sub:"Keepit Dictionary", act:() => { addRecent("dict", q.trim()); openDict(q.trim()); } });
    const vocab = DATA.notes.filter(n => n && (n.dictionaryOnly || isWord(n.quote)));
    if (sc === "all" || sc === "lists") {
      const seen = new Set();
      vocab.filter(n => has(n.quote || "") && norm(n.quote) !== nq).forEach(n => { const w = String(n.quote).trim(); if (seen.has(norm(w)) || seen.size >= 2) return; seen.add(norm(w)); kp.push({ icon:"star", kpc:true, title:hiFrag(w, q), sub:t("savedWord"), act:() => openDict(w) }); });
    }
    if (sc === "all" || sc === "notes") {
      const max = sc === "notes" ? 6 : 2, items = DATA.notes.filter(n => n && !vocab.includes(n));
      items.filter(n => String(n.note || "").trim() && has(`${n.quote || ""} ${n.note || ""} ${n.title || ""}`)).slice(0, max).forEach(n => kp.push({ icon:"notes", kpc:true, title:hiFrag(String(n.note || n.quote).slice(0, 160), q), sub:t("noteSub", n.hostname || hostOf(n.url)), act:() => openRecord(n, "openingNote") }));
      items.filter(n => !String(n.note || "").trim() && has(n.quote || "")).slice(0, sc === "notes" ? 6 : 1).forEach(n => kp.push({ icon:"hl", kpc:true, title:hiFrag(String(n.quote).slice(0, 160), q), sub:t("hlSub", n.hostname || hostOf(n.url)), act:() => openRecord(n, "openingHl") }));
    }
    if (sc === "all" || sc === "lists") DATA.sessions.filter(d => d && d.url && has(d.title || "")).slice(0, 2).forEach(d => kp.push({ icon:"keyboard", kpc:true, title:hiFrag(d.title, q), sub:t("dictSub", t("sentences", d.solvedCount || 0, d.totalCount || 0) + (d.status === "complete" ? t("done") : "")), act:() => { addRecent("search", d.title); openUrl(d.url); toast(t("openingDict")); } }));
    if (kp.length) { rows.push({ sec:"Keepit" }); rows.push(...kp.slice(0, sc === "all" ? 6 : 12)); }
    else if (sc !== "all" && sc !== "web" && sc !== "yt") rows.push({ empty:esc(t("notFound", q, SCOPES().find(s => s[0] === sc)[1])) });
    if (sc === "all" || sc === "web" || sc === "yt") {
      rows.push({ sec:"Web" });
      if (sc !== "yt") rows.push({ g:true, title:`<strong>${esc(q)}</strong>`, sub:t("onGoogle"), act:() => { addRecent("search", q); openUrl("https://www.google.com/search?q=" + encodeURIComponent(q)); } });
      if (sc !== "web") rows.push({ yt:true, title:`<strong>${esc(q)}</strong>`, sub:t("onYt"), act:() => { addRecent("yt", q); openUrl("https://www.youtube.com/results?search_query=" + encodeURIComponent(q)); } });
    }
    return rows;
  }
  function addRecent(k, q) { S.recent = [{ k, q }, ...S.recent.filter(r => r.q !== q)].slice(0, 6); persist(); }
  function runRecent(r) { if (r.k === "dict") openDict(r.q); else if (r.k === "url") openUrl(/^https?:\/\//i.test(r.q) ? r.q : "https://" + r.q); else if (r.k === "yt") openUrl("https://www.youtube.com/results?search_query=" + encodeURIComponent(r.q)); else openUrl("https://www.google.com/search?q=" + encodeURIComponent(r.q)); }
  // Extension: new tab · APK: one main view (go forward in history)
  function openUrl(url) {
    if (isApk()) { location.href = url; return; }
    window.open(url, "_blank", "noopener"); toast(t("openedTab"));
  }
  // same page → open the Notes panel and jump to it (demo); another page → open that page at the note (OPEN_HIGHLIGHT)
  const samePage = url => { try { const a = new URL(url), b = new URL(location.href); return a.origin === b.origin && a.pathname === b.pathname && a.search === b.search; } catch { return false; } };
  function openRecord(n, msg) {
    if (n.dictionaryOnly || !/^https?:\/\//i.test(n.url || "") || !n.id) { if (isWord(n.quote)) openDict(String(n.quote).trim()); return; }
    if (samePage(n.url)) { if (!document.querySelector("#lhn-sidebar.lhn-side-visible:not(.lhn-closing)")) run("notes"); toast(t(msg === "openingNote" ? "noteInPanel" : "hlInPanel")); }
    else toast(t(msg));
    void send("OPEN_HIGHLIGHT", { url:n.url, id:String(n.id) });
  }
  function openDict(w) { closeSearch(); globalThis.LHN_BAR_ACTIONS?.openDictionary?.(w); }
  function renderResults() {
    const sq = $("sq"), res = $("res"), q = sq.value.trim();
    $("sqx").hidden = !q;
    ROWS = buildRows(q);
    const acts = ROWS.filter(r => r.act); S.active = clamp(S.active, 0, Math.max(0, acts.length - 1));
    let n = 0;
    res.innerHTML = ROWS.map(r => {
      if (r.sec) return `<div class="rsec"><span>${esc(r.sec)}</span>${r.clear ? `<button type="button" data-clear>${esc(t("clearAll"))}</button>` : ""}</div>`;
      if (r.empty) return `<div class="empty">${r.empty}</div>`;
      const i = n++, rk = r.g ? `<span class="rk g">G</span>` : r.yt ? `<span class="rk yt"><i></i></span>` : `<span class="rk${r.kpc ? " kp" : ""}">${ic(r.icon)}</span>`;
      const tail = r.rm !== undefined ? `<span class="ra" data-rm="${r.rm}" title="${esc(t("remove"))}">${ic("x")}</span>` : "";
      return `<button class="ri${i === S.active ? " act" : ""}" type="button" data-i="${i}">${rk}<span class="rt"><b>${r.title}</b>${r.sub ? `<small>${esc(r.sub)}</small>` : ""}</span>${tail}</button>`;
    }).join("") || `<div class="empty">${esc(S.scope === "all" ? t("emptyAll") : t("emptyScope", SCOPES().find(s => s[0] === S.scope)[1]))}</div>`;
  }
  function renderChips() { $("chips").innerHTML = SCOPES().map(([k, l]) => `<button class="chip${S.scope === k ? " on" : ""}" type="button" data-scope="${k}">${esc(l)}</button>`).join(""); }
  function layoutSearch() {
    const vv = window.visualViewport, H = (vv ? vv.height : innerHeight) * Z(), top = (vv ? vv.offsetTop : 0) * Z();
    const t0 = Math.round(VH() * 0.12);   // v3.5.228: phone and tablet open it at the same place as the computer
    const sbox = $("sbox"); sbox.style.top = (top + t0) + "px"; sbox.style.maxHeight = Math.max(160, H - t0 - 10) + "px";
  }
  function renderCur() {
    const cur = $("scur");
    cur.innerHTML = isApk() ? `${ic("lock")}<span>${esc(location.hostname + location.pathname)}</span><button type="button" data-reload>${ic("reload")}${esc(t("reload"))}</button>` : "";
    cur.hidden = !isApk() || onHome();   // v3.5.179: no address row on the APK start / offline page
  }
  // v3.5.226: on the Keepit home page the page's search box turns into the search sheet (container transform) and back
  const homePill = () => { if (!onHome()) return null; const el = globalThis.LHN_HOME?.searchBox?.(); const r = el?.getBoundingClientRect(); return r && r.width && r.bottom > 0 && r.top < innerHeight ? el : null; };
  const reduceMotion = () => !!globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  let morphPill = null, morphAnim = null;
  function morphFrames(pill) {   // UI px. The box starts as the pill plus the sheet padding (clipped to the pill) and grows to its rest size.
    const k = Z(), p = pill.getBoundingClientRect(), b = $("sbox").getBoundingClientRect(), s = $("sbox").querySelector(".sin").getBoundingClientRect();
    const pw = p.width * k, ph = p.height * k, sl = Math.max(0, (s.left - b.left) * k), st = Math.max(0, (s.top - b.top) * k + (s.height * k - ph) / 2);
    const w0 = pw + 2 * sl, h0 = ph + 2 * st;
    const dx = (p.left + p.width / 2 - b.left - b.width / 2) * k, dy = (p.top - b.top) * k - st;
    return [{ width:w0 + "px", height:h0 + "px", transform:`translate(-50%,0) translate(${dx}px,${dy}px)`, clipPath:`inset(${st}px ${sl}px ${st}px ${sl}px round ${ph / 2}px)` },
      { width:b.width * k + "px", height:b.height * k + "px", transform:"translate(-50%,0)", clipPath:`inset(0px 0px 0px 0px round 22px)` }];
  }
  const sheetRest = () => [...$("sbox").children].filter(c => !c.classList.contains("sin"));
  function stopMorph() { morphAnim = null; $("srch").getAnimations?.({ subtree:true }).forEach(a => a.cancel()); $("srch").classList.remove("closing"); $("sbox").classList.remove("morph"); if (morphPill) { morphPill.style.visibility = ""; morphPill = null; } }
  function openSearch() {
    stopMorph(); introDone(); closePop(); closeSheet(); hideCoach(); S.scope = "all"; S.active = 0; const sq = $("sq"); sq.value = ""; sq.placeholder = t("sPlaceholder");
    $("sqx").setAttribute("aria-label", t("clear"));
    $("sfoot").innerHTML = `<span><kbd>${esc(SEARCH_KEY)}</kbd> ${esc(t("fToggle"))}</span><span><kbd>↑</kbd> <kbd>↓</kbd> ${esc(t("fSelect"))}</span><span><kbd>Enter</kbd> ${esc(t("fOpen"))}</span><span><kbd>Esc</kbd> ${esc(t("fClose"))}</span>`;
    renderCur(); renderChips(); renderResults(); void loadSearchData();
    const pill = !reduceMotion() && homePill(), box = $("sbox");
    if (pill) box.classList.add("morph");
    $("srch").classList.add("open"); $("srch").classList.toggle("deskmode", isDesk());
    layoutSearch();
    if (pill) {
      morphPill = pill; pill.style.visibility = "hidden";
      morphAnim = box.animate(morphFrames(pill), { duration:300, easing:"cubic-bezier(.2,.8,.2,1)" });
      morphAnim.onfinish = () => { morphAnim = null; box.classList.remove("morph"); };
      sheetRest().forEach(c => c.animate([{ opacity:0 }, { opacity:1 }], { duration:200, delay:110, easing:"ease-out", fill:"backwards" }));
    } else requestAnimationFrame(layoutSearch);
    setTimeout(() => sq.focus({ preventScroll:true }), 30);
  }
  function closeSearch() {
    const srch = $("srch"); if (!srch?.classList.contains("open") || srch.classList.contains("closing")) return;
    $("sq").blur();
    const pill = morphPill && !reduceMotion() && homePill() === morphPill ? morphPill : null, box = $("sbox");
    if (pill) {
      morphAnim?.cancel(); box.classList.add("morph"); srch.classList.add("closing");
      morphAnim = box.animate(morphFrames(pill).reverse(), { duration:240, easing:"cubic-bezier(.4,0,.2,1)", fill:"forwards" });
      sheetRest().forEach(c => c.animate([{ opacity:1 }, { opacity:0 }], { duration:120, easing:"ease-in", fill:"forwards" }));
      $("scrim2").animate([{ opacity:1 }, { opacity:0 }], { duration:240, fill:"forwards" });
      // v3.5.228: drop .open while .closing/.morph still switch the CSS transitions off and the animations hold everything
      // at its end state, so nothing comes back for a frame (the old flash), then hand over to the plain closed styles
      morphAnim.onfinish = () => { srch.classList.remove("open"); void getComputedStyle(box).opacity; void getComputedStyle($("scrim2")).opacity; stopMorph(); };
    } else { stopMorph(); srch.classList.remove("open"); }
    if (S.peek && isDesk()) wireBar.peekLater?.();
  }
  function runActive() { const r = ROWS.filter(x => x.act)[S.active]; if (!r) return; closeSearch(); r.act(); }
  function wireSearch() {
    const sq = $("sq"), res = $("res");
    $("scrim2").addEventListener("click", closeSearch);
    sq.addEventListener("input", () => { S.active = 0; renderResults(); });
    sq.addEventListener("keydown", e => {
      e.stopPropagation();
      const n = ROWS.filter(x => x.act).length;
      if (e.key === "ArrowDown") { e.preventDefault(); S.active = (S.active + 1) % Math.max(1, n); renderResults(); res.querySelector(".ri.act")?.scrollIntoView({ block:"nearest" }); }
      else if (e.key === "ArrowUp") { e.preventDefault(); S.active = (S.active - 1 + n) % Math.max(1, n); renderResults(); res.querySelector(".ri.act")?.scrollIntoView({ block:"nearest" }); }
      else if (e.key === "Enter") { e.preventDefault(); runActive(); }
      else if (e.key === "Escape") { e.preventDefault(); closeSearch(); }
    });
    ["keyup", "keypress"].forEach(type => sq.addEventListener(type, e => e.stopPropagation()));
    $("sqx").addEventListener("click", () => { sq.value = ""; S.active = 0; renderResults(); sq.focus(); });
    $("chips").addEventListener("click", e => { const c = e.target.closest("[data-scope]"); if (!c) return; S.scope = c.dataset.scope; S.active = 0; renderChips(); renderResults(); sq.focus(); });
    $("scur").addEventListener("click", e => { if (e.target.closest("[data-reload]")) { closeSearch(); location.reload(); } });
    res.addEventListener("click", e => {
      if (e.target.closest("[data-clear]")) { S.recent = []; persist(); renderResults(); sq.focus(); return; }
      const rm = e.target.closest("[data-rm]"); if (rm) { S.recent.splice(+rm.dataset.rm, 1); persist(); renderResults(); sq.focus(); return; }
      const r = e.target.closest(".ri"); if (!r) return; S.active = +r.dataset.i; runActive();
    });
    res.addEventListener("mousemove", e => { const r = e.target.closest(".ri"); if (r && isDesk() && +r.dataset.i !== S.active) { S.active = +r.dataset.i; $$(".ri", res).forEach(x => x.classList.toggle("act", x === r)); } });
    window.visualViewport?.addEventListener("resize", () => { if ($("srch").classList.contains("open")) layoutSearch(); });
  }

  function wire() {
    wireBar(); wireSearch();
    $("clear").addEventListener("click", closePop);
    $("nscrim").addEventListener("click", () => run("notes"));   // touch: dim the page behind the Notes bottom sheet, tap to close
    $("pop").addEventListener("click", onPopClick);
    $("scrim").addEventListener("click", closeSheet);
    $("panel").addEventListener("scroll", updFade, true);
    $("panel").addEventListener("click", e => { void onPanelClick(e); });
    attachSheets();
    $("coach").addEventListener("click", e => { const b = e.target.closest("[data-c]"); if (!b) return; coachDone(); if (b.dataset.c === "all") { openSheet(); S.sheetPane = "keys"; renderSheet(); anchorPanel(); } });
    $("intro").addEventListener("click", e => { if (e.target.closest("[data-i]")) introDone(); });
    $("iscrim").addEventListener("click", introDone);
    // keys typed into Keepit's own inputs (search, language) must not reach the page's shortcut handlers
    root.addEventListener("keydown", e => { if (e.target.closest?.("input")) e.stopPropagation(); });
  }
  // v3.5.165: bar search shortcut on desktop (capture: also from inside the search box; not while typing in the page).
  // macOS: Alt(Option)+Space. Windows / Linux: Windows hands Alt+Space to the window's system menu (GNOME / KDE take it too)
  // before any page or extension sees it, so Ctrl+Space is the working key there; Alt+Space still works wherever it gets through.
  addEventListener("keydown", e => {
    if (!mounted || !isDesk() || e.code !== "Space" || e.metaKey || e.shiftKey || S.siteOff || e.repeat) return;
    if (!((e.altKey && !e.ctrlKey) || (!IS_MAC && e.ctrlKey && !e.altKey))) return;
    const tg = e.composedPath()[0], own = tg instanceof Node && tg.getRootNode() === root;
    if (!own && tg instanceof Element && (tg.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(tg.tagName))) return;
    e.preventDefault(); e.stopPropagation();
    if ($("srch").classList.contains("open")) closeSearch(); else openSearch();
  }, true);
  addEventListener("keydown", e => {
    if (!mounted || e.key !== "Escape") return;
    if ($("srch").classList.contains("open")) closeSearch();
    else if ($("sheet").classList.contains("open")) closeSheet();
    else if ($("pop").classList.contains("open")) closePop();
    else if (S.introOn) introDone();
  });

  // ---------- page state: Reader / overlay take the bar's place; site off → logo on a side edge ----------
  const readerShown = () => !!document.querySelector("#lhn-bilingual-reading-bar.lhn-show:not(.lhn-hiding)");
  // v3.5.163: the bar reacts the same frame the Reader / overlay opens or closes (was: up to 700ms later via the ticker)
  let readerWatch = null, htmlWatch = null, overlayWas = null;
  function watchExt() {
    const rb = document.getElementById("lhn-bilingual-reading-bar");
    if (rb && rb !== readerWatch?.target) {
      readerWatch?.observer.disconnect();
      const observer = new MutationObserver(syncState); observer.observe(rb, { attributes:true, attributeFilter:["class"] });
      readerWatch = { target:rb, observer };
    }
    if (!htmlWatch) {
      htmlWatch = new MutationObserver(() => { const on = document.documentElement.classList.contains("lhn-video-overlay-open"); if (on !== overlayWas) { overlayWas = on; syncState(); } });
      htmlWatch.observe(document.documentElement, { attributes:true, attributeFilter:["class"] });
    }
  }
  // v3.5.164: site-off logo — sits on the left edge (vertical centre) until moved; drag anywhere, it snaps to the nearer side
  // edge and keeps that place (lhnBottomBar.offPos = { side:"l"|"r", y:0..1 of the free height }); tap / Enter = turn Keepit back on
  function placeOffDot() {
    const d = root && $("offdot"); if (!d || d.classList.contains("drag")) return;
    const pos = S.offPos || { side:"l", y:0.5 }, H = d.offsetHeight || 44, W = d.offsetWidth || 35;
    d.classList.toggle("r", pos.side === "r");
    d.style.left = (pos.side === "r" ? VW() - W : 0) + "px";
    d.style.top = Math.round(8 + pos.y * Math.max(0, VH() - H - 16)) + "px";
  }
  function wireOffDot() {
    const d = $("offdot"); let g = null, eatClick = false;
    const turnOn = () => { if (!siteDisabled()) return; run("site-toggle"); setTimeout(syncState, 250); };
    d.addEventListener("pointerdown", e => {
      if (e.button !== 0) return;
      const r = d.getBoundingClientRect(); g = { id:e.pointerId, x:e.clientX, y:e.clientY, ox:e.clientX - r.left, oy:e.clientY - r.top, moved:false };
      try { d.setPointerCapture(e.pointerId); } catch {}
    });
    d.addEventListener("pointermove", e => {
      if (!g || e.pointerId !== g.id) return;
      if (!g.moved && Math.hypot(e.clientX - g.x, e.clientY - g.y) < 6) return;
      g.moved = true; d.classList.add("drag");
      d.style.left = clamp((e.clientX - g.ox) * Z(), 0, VW() - d.offsetWidth) + "px";
      d.style.top = clamp((e.clientY - g.oy) * Z(), 8, VH() - d.offsetHeight - 8) + "px";
    });
    const end = e => {
      if (!g || e.pointerId !== g.id) return;
      const was = g; g = null;
      if (!was.moved) return;
      eatClick = true; setTimeout(() => { eatClick = false; }, 350);
      const r = d.getBoundingClientRect(), k = Z();
      S.offPos = { side:r.left + r.width / 2 > innerWidth / 2 ? "r" : "l", y:clamp((r.top * k - 8) / Math.max(1, VH() - r.height * k - 16), 0, 1) };
      d.classList.remove("drag"); placeOffDot(); persist();
    };
    d.addEventListener("pointerup", end); d.addEventListener("pointercancel", end);
    d.addEventListener("click", e => { e.stopPropagation(); if (eatClick) { eatClick = false; return; } turnOn(); });
    addEventListener("resize", placeOffDot, { passive:true });
    placeOffDot();
  }
  function syncState() {
    if (!mounted) return;
    const notesVisible = !!document.querySelector("#lhn-sidebar.lhn-side-visible:not(.lhn-closing)");
    // v3.5.163: Notes no longer folds the bar — it stays under the dim like with ☰, so closing Notes never flashes it back in
    const ext = readerShown() || document.documentElement.classList.contains("lhn-video-overlay-open");
    const off = siteDisabled(), changed = ext !== S.extYield || off !== S.siteOff || notesVisible !== S.notesOn || (ext && readerShown()) !== S.readerOn;
    if (notesVisible && !S.notesOn && isTouch()) { closePop(); closeSheet(); closeSearch(); hideCoach(); }   // Notes sheet opening: nothing else stays open
    if (S.extYield && !ext) barBack();
    S.extYield = ext; S.siteOff = off; S.notesOn = notesVisible; S.readerOn = ext && readerShown();
    if (ext) { closePop(); if (!S.sheetFrom) closeSheet(); closeSearch(); hideCoach(); if (S.introOn) introDone(); }
    if (S.sheetFrom && !readerShown()) closeSheet(); // Reader closed under its ☰ sheet
    if (changed) { root.querySelector('[data-nav="notes"]')?.classList.toggle("on", notesVisible); syncBarVis(); }
    syncTr();
    const pageDark = pageIsDark(); $("screen").classList.toggle("pageDark", pageDark);
  }
  function pageIsDark() {
    for (const el of [document.body, document.documentElement]) {
      const m = el && getComputedStyle(el).backgroundColor.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/);
      if (!m || (m[4] !== undefined && Number(m[4]) === 0)) continue;
      return (0.299 * m[1] + 0.587 * m[2] + 0.114 * m[3]) < 110;
    }
    return false;
  }
  // scroll: the bar hides going down, shows going up — every device since v3.5.181 (was touch only) · back-to-top tracks the scroller · page bottom bars → yield
  const lastTop = new WeakMap();
  function onScroll(event) {
    if (!mounted) return;
    const target = event.target === document ? document.scrollingElement : event.target;
    if (!(target instanceof Element) || isOwnUi(target)) return;
    const main = target === document.scrollingElement || target === document.documentElement || target === document.body || target.clientHeight >= innerHeight * 0.5;
    if (!main) return;
    scroller = target;
    const y = scrollTopOf(target), dy = y - (lastTop.get(target) ?? y);
    if (dy && !onHome()) scrollOff(dy, y);
    lastTop.set(target, y);
    updBtop();
    if (!ovRaf) ovRaf = requestAnimationFrame(() => { ovRaf = 0; checkOverlap(); });
  }
  // keyboard open (focus in a page text field on touch / visual viewport shrinks) or full-screen video → hide bar, line, top button
  const editable = el => el?.closest?.("input:not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit]):not([type=range]):not([type=color]):not([type=file]),textarea,select,[contenteditable]:not([contenteditable=false])");
  function onFocusIn(e) { if (!isTouch() || e.composedPath().includes(host) || !editable(e.target)) return; S.kbd = true; hideCoach(); syncBarVis(); }
  function onFocusOut(e) { if (!S.kbd || e.composedPath().includes(host)) return; setTimeout(() => { if (!editable(document.activeElement)) { S.kbd = false; syncBarVis(); } }, 0); }
  function onFullscreen() { S.vfs = !!(document.fullscreenElement || document.webkitFullscreenElement); if (S.vfs) { introDone(); hideCoach(); closePop(); } syncBarVis(); }
  function onNetwork() {
    const was = S.offline; S.offline = navigator.onLine === false;
    if (was && !S.offline && S.pendingTr && mounted && !globalThis.LHN_OFFLINE?.isOpen()) toast(t("online"), { label:t("translateNow"), fn:() => { const f = S.pendingTr; S.pendingTr = null; f?.(); } });
  }
  let offlineToastAt = 0;
  globalThis.LHN_BAR_HOOKS = Object.freeze({
    // v3.5.179 (Keepit for Android browser-ui.js): start-page search box / offline "Saved notes" use the bar's own actions;
    // pull-to-refresh waits while a Keepit sheet, search or the keyboard is open; ☰ redraws when bookmarks change
    nav(id) { if (mounted && ["search", "notes", "more"].includes(id)) doNav(id); },
    busy() { return !mounted || anyOpen() || S.kbd || S.vfs || S.extYield || picking; },
    refresh() { if (mounted && $("sheet").classList.contains("open")) renderSheet(); },
    toast(text) { if (mounted) toast(String(text || "")); },
    // the Reader's ☰ opens this main sheet above the Reader bar (v3.5.160 touch; v3.5.161 every device) with its
    // Trình đọc row in the vertical middle of the sheet
    openMainSheet(fromRect) {
      if (!mounted) return;
      S.sheetFrom = fromRect ? { left:fromRect.left, top:fromRect.top, width:fromRect.width } : { left:innerWidth - 40, top:innerHeight - 70, width:40 };
      host.style.zIndex = "2147483647"; openSheet();
      const b = $("panel").querySelector(".sbody"), sec = $("panel").querySelector('[data-sec="rd"]');
      if (b && sec) {
        const center = () => { const br = b.getBoundingClientRect(), top = sec.getBoundingClientRect().top, bottom = (sec.nextElementSibling || sec).getBoundingClientRect().bottom; b.scrollTop += ((top + bottom) / 2 - (br.top + br.height / 2)) * Z(); updFade(); };
        center(); requestAnimationFrame(center);
      }
    },
    translateOffline() {
      if (!mounted || Date.now() - offlineToastAt < 4000) return; offlineToastAt = Date.now();
      const retry = () => { if (pageTranslated()) { run("bilingual-page"); run("bilingual-page"); } };
      if (navigator.onLine === false && offlinePage(retry)) return;
      S.pendingTr = retry; toast(t("offline"), { icon:"wifioff", label:t("retry"), fn:() => { if (navigator.onLine === false) return toast(t("offline"), { icon:"wifioff" }); S.pendingTr = null; retry(); } });
    }
  });

  // ---------- v3.5.161: every sheet behaves the same (js/shared/sheet-kit.js LHN_SHEET) — page locked while one is open
  // (touch, wheel, scroll keys), drag down from anywhere closes, a scrolled list scrolls back first, the ☰ sheet grows while
  // pulled up and keeps scrolling in the same gesture; Notes (touch bottom sheet) is attached in watchSidebar.
  const SK = () => globalThis.LHN_SHEET;
  function syncScrollLock() { SK()?.sync(); }
  function attachSheets() {
    const panel = $("panel");
    const capH = () => isWide() ? VH() - (parseFloat(panel.style.bottom) || 0) - 12 : VH() * 0.96;
    const expand = () => { setTimeout(updFade, 320); panel.classList.add("full"); if (isWide()) panel.style.maxHeight = capH() + "px"; };
    SK()?.attach(panel, { isOpen:() => $("sheet").classList.contains("open"), close:() => closeSheet(), watch:$("sheet"), scroller:() => panel.querySelector(".sbody"),
      grow:{ isFull:() => panel.classList.contains("full"), cap:capH,
        setH:px => { if (px === null) { panel.classList.remove("growing"); panel.style.maxHeight = panel.classList.contains("full") && isWide() ? capH() + "px" : ""; } else { panel.classList.add("growing"); panel.style.maxHeight = px + "px"; } },
        // v3.5.179 Keepit for Android ☰ 2 steps on phones (demo v12): middle step (58%), pulled up = full, pulled down = middle, further = closed
        mid:() => isWide() || !isApk() ? 0 : Math.round(VH() * 0.58),
        collapse:() => { panel.style.transition = "max-height .22s ease"; panel.classList.remove("full", "growing"); panel.style.maxHeight = ""; setTimeout(() => { panel.style.transition = ""; updFade(); }, 240); },
        release:grow => { const keep = panel.scrollHeight; panel.classList.remove("growing"); panel.style.transition = "max-height .2s ease"; panel.style.maxHeight = ""; if (grow) expand(); setTimeout(() => { panel.style.transition = ""; updFade(); }, 220); return keep; } } });
    SK()?.attach($("pop"), { isOpen:() => $("pop").classList.contains("open"), close:() => closePop(), watch:$("pop") });
    // search: its taller step = keyboard down (more results); pulled down from there = keyboard back; further = closed
    const sq = $("sq");
    SK()?.attach($("sbox"), { isOpen:() => $("srch").classList.contains("open"), close:() => closeSearch(), watch:$("srch"), scroller:() => $("res"),
      grow:{ isFull:() => !isTouch() || root.activeElement !== sq, cap:() => $("sbox").getBoundingClientRect().height * Z(), setH:() => {},
        release:grow => { if (grow) { sq.blur(); layoutSearch(); } } } });
  }

  let sidebarWatch = null;
  function watchSidebar() {
    const side = document.getElementById("lhn-sidebar");
    if (!side || side === sidebarWatch?.target) return;
    sidebarWatch?.observer.disconnect();
    const observer = new MutationObserver(syncState);
    observer.observe(side, { attributes:true, attributeFilter:["class"] });
    sidebarWatch = { target:side, observer };
    // v3.5.204: Ghi chú là sheet chuẩn như ☰ — kéo lên = cao hết (96%), kéo xuống = về bậc giữa, kéo tiếp = đóng; danh sách cuộn trước khi kéo.
    const snap = () => { side.classList.add("lhn-sheet-snap"); setTimeout(() => side.classList.remove("lhn-sheet-snap"), 260); };
    SK()?.attach(side, { isOpen:() => isTouch() && side.classList.contains("lhn-side-visible") && !side.classList.contains("lhn-closing"), close:() => run("notes"), watch:side,
      scroller:() => side.querySelector("#lhn-sidebar-list"),
      grow:{ isFull:() => side.classList.contains("lhn-sheet-full"), cap:() => VH() * 0.96, mid:() => Math.round(Math.min(VH() * 0.74, 720)),
        setH:px => { if (px === null) { side.classList.remove("lhn-sheet-growing"); side.style.removeProperty("height"); } else { side.classList.add("lhn-sheet-growing"); side.style.setProperty("height", px + "px", "important"); } },
        collapse:() => { snap(); side.classList.remove("lhn-sheet-full", "lhn-sheet-growing"); side.style.removeProperty("height"); },
        release:grow => { snap(); side.classList.remove("lhn-sheet-growing"); side.style.removeProperty("height"); if (grow) side.classList.add("lhn-sheet-full"); } } });
  }

  let ticker = 0, bodyWatch = null, lastLayout = "";
  const layoutKey = () => [isTouch(), isWide(), isPland(), isSmall(), isVideoPage(), langCode(), isDark()].join("|");
  function relayout(force) {
    if (!mounted) return;
    const key = layoutKey(); if (!force && key === lastLayout) { syncBarVis(); return; }
    if (key.split("|").slice(0, 4).join() !== lastLayout.split("|").slice(0, 4).join()) { S.autoFive = false; closePop(); closeSheet(); closeSearch(); S.peek = false; }
    lastLayout = key; renderBar();
    if ($("sheet").classList.contains("open")) { renderSheet(); anchorPanel(); }
  }
  function mount() {
    if (mounted || !document.body) return;
    if (!host) build();
    document.documentElement.appendChild(host);
    mounted = true; lastLayout = ""; relayout(true); syncState();
    const passive = { capture:true, passive:true };
    document.addEventListener("scroll", onScroll, passive);
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") refreshTabs(); });
    refreshTabs();
    window.addEventListener("touchstart", onPageTouchStart, { passive:true });
    window.addEventListener("touchmove", onPageTouchMove, { passive:true });
    window.addEventListener("touchend", onPageTouchEnd, { passive:true });
    window.addEventListener("touchcancel", onPageTouchEnd, { passive:true });
    document.addEventListener("focusin", onFocusIn, true);
    document.addEventListener("focusout", onFocusOut, true);
    document.addEventListener("fullscreenchange", onFullscreen); document.addEventListener("webkitfullscreenchange", onFullscreen);
    bodyWatch = new MutationObserver(watchSidebar); bodyWatch.observe(document.documentElement, { childList:true }); watchSidebar();
    watchExt();
    ticker = setInterval(() => { if (!host.isConnected) document.documentElement.appendChild(host); watchSidebar(); watchExt(); syncState(); checkOverlap(); }, 700);
    requestAnimationFrame(checkOverlap);
    // mounted before the page's styles/content finished loading: re-read page colours, video layout and page bars then
    const settle = () => { if (!mounted) return; syncState(); relayout(false); checkOverlap(); };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", settle, { once:true });
    if (document.readyState !== "complete") addEventListener("load", settle, { once:true });
    if (!S.introSeen) setTimeout(showIntro, 500); else scheduleCoach();
  }
  async function init() {
    installTouchSelectionBridge();
    // v3.5.161: both reads at once (document_start: the bar should be ready by the page's first frame)
    const [loaded, stored] = await Promise.all([globalThis.LHN_SETTINGS.get().catch(() => ({})), browser.storage.local.get([STORE_KEY, INTRO_KEY]).catch(() => null)]);
    settings = loaded || {};
    try {
      const data = stored || {}, b = data[STORE_KEY] || {};
      S.hidden = b.hidden === true; S.five = b.five === true; S.btop = b.btop !== false; S.coachSeen = b.coachSeen === true; S.offPos = b.offPos && typeof b.offPos.y === "number" ? { side:b.offPos.side === "r" ? "r" : "l", y:clamp(b.offPos.y, 0, 1) } : null; placeOffDot();
      S.gest = { translate:b.gest?.translate !== false, nav:b.gest?.nav !== false };
      S.navOff = b.navOff && typeof b.navOff === "object" ? { ...b.navOff } : {};
      S.recent = Array.isArray(b.recent) ? b.recent.filter(r => r && typeof r.q === "string").slice(0, 6) : [];
      S.introSeen = data[INTRO_KEY] === true;
    } catch {}
    globalThis.LHN_SETTINGS?.subscribe?.(next => { settings = next || {}; if (!mounted) return; syncState(); relayout(true); });
    browser.storage.onChanged?.addListener((changes, area) => {
      if (area !== "local" || !mounted) return;
      if (changes[INTRO_KEY]?.newValue === true && S.introOn) introDone();
      if (changes[INTRO_KEY]?.newValue === true) S.introSeen = true;
    });
    TOUCH.addEventListener("change", () => relayout(true));
    DARK_SCHEME.addEventListener("change", () => relayout(true));
    addEventListener("keepit-ui-zoom", () => { relayout(false); if ($("sheet")?.classList.contains("open")) anchorPanel(); if ($("srch")?.classList.contains("open")) layoutSearch(); placeOffDot(); });
    addEventListener("resize", () => { relayout(false); if ($("sheet")?.classList.contains("open")) anchorPanel(); if ($("srch")?.classList.contains("open")) layoutSearch(); if (mounted) checkOverlap(); });
    addEventListener("online", onNetwork); addEventListener("offline", onNetwork);
    addEventListener("popstate", () => relayout(false)); setInterval(() => { if (mounted && layoutKey() !== lastLayout) relayout(false); }, 1000);
    document.fonts?.ready?.then(() => { if (mounted) fitLabels(); });
    // v3.5.161: loaded at document_start → draw the bar as soon as <body> exists, so it is in the new page's first frame
    // (Chromium keeps the previous page on screen until then, so the bar does not blink or reload between pages)
    if (document.body) mount();
    else {
      const early = new MutationObserver(() => { if (document.body) { early.disconnect(); mount(); } });
      early.observe(document.documentElement, { childList:true });
      document.addEventListener("DOMContentLoaded", () => { early.disconnect(); mount(); }, { once:true });
    }
  }

  // ---------- touch selection → the mouseup the content scripts listen for ----------
  // Long-press selection (and dragging its handles) fires no mouseup, so the Keepit popup/icon would never open.
  // When the selection settles after the finger lifts, send one mouseup at the end of the selection.
  // v3.5.159: dragging Android's selection handles sends selectionchange but no touch events, so a short pause mid-drag used to
  // open the popup again and again. Android Chrome fires contextmenu when a drag-selection is finished (finger lifted) → open
  // right then; otherwise wait until the selection has been still for SETTLE ms (single word long-pressed, other browsers).
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
    const SETTLE = 900;
    const schedule = () => { if (!TOUCH.matches) return; clearTimeout(timer); timer = setTimeout(fire, SETTLE); };
    // contextmenu while the finger is still down = the long press that starts a selection (more may follow) → keep waiting
    document.addEventListener("contextmenu", () => { if (!TOUCH.matches || touching) return; clearTimeout(timer); timer = setTimeout(fire, 60); }, true);
    document.addEventListener("touchstart", () => { touching = true; }, { capture:true, passive:true });
    document.addEventListener("touchend", () => { touching = false; schedule(); }, { capture:true, passive:true });
    document.addEventListener("touchcancel", () => { touching = false; schedule(); }, { capture:true, passive:true });
    document.addEventListener("selectionchange", schedule);
    document.addEventListener("mouseup", event => { if (event.isTrusted) lastKey = selectionKey(); }, true);
  }

  void init();
})();
