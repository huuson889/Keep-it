// Floating selection toolbar shared by the page launcher (content script) and the Dashboard previews.
// One definition of actions, icons, logo and style flags; css/shared/selection-toolbar.css styles every variant.
(() => {
  "use strict";
  if(globalThis.LHN_SELECTION_TOOLBAR)return;

  const ICONS = Object.freeze({
    highlight:'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eraser"><path d="M21 21H8a2 2 0 0 1-1.42-.587l-3.994-3.999a2 2 0 0 1 0-2.828l10-10a2 2 0 0 1 2.829 0l5.999 6a2 2 0 0 1 0 2.828L12.834 21"/><path d="m5.082 11.09 8.828 8.828"/></svg>',
    translate:'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-languages"><path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/></svg>',
    ai:'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sparkles"><path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/><path d="M20 2v4"/><path d="M22 4h-4"/><circle cx="4" cy="20" r="2"/></svg>'
  });

  // Order = toolbar order. labelKey resolves through the caller's i18n function.
  const ACTIONS = Object.freeze([
    Object.freeze({ id:"highlight", className:"lhn-action-highlight", labelKey:"toolbarHighlight", svg:ICONS.highlight }),
    Object.freeze({ id:"translate", className:"lhn-action-translate", labelKey:"toolbarTranslate", svg:ICONS.translate }),
    Object.freeze({ id:"ai", className:"lhn-action-ai", labelKey:"toolbarAskAI", svg:ICONS.ai })
  ]);
  const ACTION_IDS = ACTIONS.map(action => action.id);

  // Every style is a combination of three flags; CSS reads the flags, never the style number.
  // 0 = logo only (Settings "Style 1"). Order: radial before bar; within each, labels before icons; always open before hover to open.
  //   radial (3 framed buttons around the logo: Highlight left, Translate below, Ask AI right):
  //     1 = labels, always open · 2 = labels, hover to open · 3 = icons, always open · 4 = icons, hover to open
  //   bar (actions in a row, logo right):
  //     5 = labels, always open · 6 = labels, hover to open · 7 = icons, always open · 8 = icons, hover to open
  const STYLES = Object.freeze({
    0:Object.freeze({ layout:"icon", labels:false, collapsible:false }),   // logo only: the logo runs its default action, no buttons
    1:Object.freeze({ layout:"radial", labels:true, collapsible:false }),
    2:Object.freeze({ layout:"radial", labels:true, collapsible:true }),
    3:Object.freeze({ layout:"radial", labels:false, collapsible:false }),
    4:Object.freeze({ layout:"radial", labels:false, collapsible:true }),
    5:Object.freeze({ layout:"bar", labels:true, collapsible:false }),
    6:Object.freeze({ layout:"bar", labels:true, collapsible:true }),
    7:Object.freeze({ layout:"bar", labels:false, collapsible:false }),
    8:Object.freeze({ layout:"bar", labels:false, collapsible:true })
  });
  const DEFAULT_STYLE = "1";
  const DEFAULT_LOGO_ACTION = "highlight";

  function normalizeStyle(value) {
    const style = String(value ?? "");
    return Object.hasOwn(STYLES, style) ? style : DEFAULT_STYLE;
  }
  function normalizeLogoAction(value) {
    return ACTION_IDS.includes(value) ? value : DEFAULT_LOGO_ACTION;
  }

  function logoSvg(idSuffix = "") {
    const mark = `lhnSelectionToolbarMark${idSuffix}`;
    const shadow = `lhnSelectionToolbarShadow${idSuffix}`;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 32 32"><defs><linearGradient id="${mark}" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#4f46e5"/><stop offset="1" stop-color="#8b5cf6"/></linearGradient><filter id="${shadow}" x="-25%" y="-15%" width="150%" height="155%" color-interpolation-filters="sRGB"><feGaussianBlur in="SourceAlpha" stdDeviation="1.5"/><feOffset dy="2"/><feComponentTransfer><feFuncA type="linear" slope="0.2"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><rect x="0" y="0" width="32" height="32" fill="url(#${mark})" filter="url(#${shadow})" rx="8"/><g transform="translate(32 0) scale(-1 1)"><g transform="translate(-4.187 -2.393) scale(0.299065)"><path fill="#fff" stroke="none" d="M 35 32 C 34 32 33.5 34 33.2 37 C 31.3 51 34.3 65 42 74 C 48.5 81.5 57 84.6 67 84.5 C 77.5 84.4 84.2 80.3 89.7 73.4 C 92.5 77.3 94.3 81.5 95.4 86.8 C 95.9 89.6 97.8 90.9 99.9 90.2 C 102.1 89.5 102.9 87.5 101.8 84.7 C 98.6 75.9 93.3 69.4 85.4 65.1 C 79.7 62 72.9 61.1 66.1 59.6 C 58.9 58 53.1 54.9 51.6 49.4 C 55.3 52.8 60.2 54.8 67.5 55.8 C 78.7 57.3 87.7 58.3 94.7 65 C 97.3 54.1 92 44.5 82.5 39.9 C 75.4 36.4 68 36.8 59.7 37.6 C 48.6 38.8 41.9 38.6 36.5 32.8 C 36 32.3 35.5 32 35 32 Z"/></g></g></svg>`; // icon-v5 (assets/icons/icon.svg)
  }

  function escapeText(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[char]);
  }

  /**
   * Builds the toolbar shell (actions + logo).
   * @param {object} options
   * @param {Document} options.document
   * @param {string} options.style        "0".."8"
   * @param {(key:string) => string} options.t  i18n lookup
   * @param {string} [options.logoAction] action run by the logo
   * @param {(id:string) => void} [options.onAction] called for action buttons and the logo
   * @param {boolean} [options.preview]   static, non-focusable markup for settings previews
   * @param {string} [options.idSuffix]   keeps SVG ids unique when several toolbars share a document
   * @param {string[]} [options.actions]  tools that are on (Settings → Notes / Translate / Ask AI); the others are left out
   */
  function build({ document:doc, style, t = key => key, logoAction, onAction = null, preview = false, idSuffix = "", actions:enabled = ACTION_IDS }) {
    const styleId = normalizeStyle(style);
    const flags = STYLES[styleId];
    const shown = ACTIONS.filter(action => enabled.includes(action.id));
    const slots = { 3:["left", "bottom", "right"], 2:["left", "right"], 1:["bottom"] }[shown.length] || [];
    // the logo runs the chosen tool; if that tool is off it runs the first tool that is on
    const logoActionId = shown.some(action => action.id === normalizeLogoAction(logoAction)) ? normalizeLogoAction(logoAction) : (shown[0]?.id || normalizeLogoAction(logoAction));
    const tag = preview ? "span" : "button";
    const shell = doc.createElement(preview ? "span" : "div");
    shell.className = "lhn-translate-shell";
    shell.dataset.style = styleId;
    shell.dataset.layout = flags.layout;
    shell.dataset.labels = String(flags.labels);
    shell.dataset.collapsible = String(flags.collapsible);

    const actions = doc.createElement(preview ? "span" : "div");
    actions.className = "lhn-translate-actions";
    if (!preview) actions.setAttribute("role", "group");
    shown.forEach((spec, index) => {
      const label = t(spec.labelKey);
      const action = doc.createElement(tag);
      action.className = `lhn-translate-action ${spec.className}`;
      action.dataset.action = spec.id;
      action.dataset.kpSlot = slots[index];
      if (preview) action.setAttribute("aria-hidden", "true");
      else {
        action.type = "button";
        action.setAttribute("aria-label", label);
        if (!flags.labels) action.title = label;
        action.addEventListener("mousedown", event => { event.preventDefault(); event.stopPropagation(); });
        action.addEventListener("click", event => { event.preventDefault(); event.stopPropagation(); onAction?.(spec.id); });
      }
      action.innerHTML = `${spec.svg}<span class="lhn-translate-label">${escapeText(label)}</span>`;
      actions.appendChild(action);
      if (index < shown.length - 1) {
        const separator = doc.createElement("span");
        separator.className = "lhn-translate-separator";
        separator.setAttribute("aria-hidden", "true");
        actions.appendChild(separator);
      }
    });

    const logo = doc.createElement(tag);
    logo.className = "lhn-translate-logo";
    logo.dataset.action = logoActionId;
    const logoLabel = t(ACTIONS.find(action => action.id === logoActionId).labelKey);
    if (preview) logo.setAttribute("aria-hidden", "true");
    else {
      logo.type = "button";
      logo.setAttribute("aria-label", logoLabel);
      logo.title = logoLabel;
      logo.addEventListener("mousedown", event => { event.preventDefault(); event.stopPropagation(); });
      logo.addEventListener("click", event => { event.preventDefault(); event.stopPropagation(); onAction?.(logoActionId); });
    }
    logo.innerHTML = logoSvg(idSuffix);

    shell.append(actions, logo);
    return shell;
  }

  const touchBridges=new WeakMap();
  function installTouchSelectionBridge({ document:doc=globalThis.document, touchQuery=matchMedia("(pointer:coarse)"), isOwnTarget=()=>false }={}) {
    if(touchBridges.has(doc))return touchBridges.get(doc);
    const document=doc,TOUCH=touchQuery;
    let touching = false, timer = 0, lastKey = "", fallbackTimer = 0, fallbackKey = "";
    // Temporary opt-in diagnostics: metadata only, never selected text or page URLs.
    const logKey = `kpTouchDiag_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    let logging = false, logTimer = 0, events = [], writeChain = Promise.resolve();
    function writeLog() {
      clearTimeout(logTimer); logTimer = 0;
      const snapshot = { version:browser.runtime.getManifest().version, events:events.slice(-200) };
      writeChain = writeChain.then(() => browser.storage.local.set({ [logKey]:snapshot })).catch(() => {});
    }
    function log(stage, extra = {}) {
      if (!logging) return;
      const sel = getSelection();
      events.push({ time:Date.now(), stage, length:sel?.toString().length || 0, ranges:sel?.rangeCount || 0, collapsed:sel?.isCollapsed ?? true, touching, coarse:TOUCH.matches, ...extra });
      if (events.length > 200) events.shift();
      if (!logTimer) logTimer = setTimeout(writeLog, 200);
    }
    globalThis.LHN_TOUCH_DIAG = log;
    browser.storage.local.get("kpTouchDiagEnabled").then(value => { logging = !!value.kpTouchDiagEnabled; if (logging) log("bridge.ready"); }).catch(() => {});
    browser.storage.onChanged.addListener((changes, area) => {
      if (area !== "local" || !changes.kpTouchDiagEnabled) return;
      if (changes.kpTouchDiagEnabled.newValue) { events = []; logging = true; log("bridge.enabled"); }
      else { if (logging) { log("bridge.disabled"); writeLog(); } logging = false; }
    });
    document.addEventListener("selectionchange", () => log("selectionchange"), true);
    document.addEventListener("mouseup", e => log("mouseup", { trusted:e.isTrusted, button:e.button }), true);
    const selectionKey = () => {
      const selection = getSelection();
      if (!selection || selection.isCollapsed || !selection.rangeCount) return "";
      const rect = selection.getRangeAt(0).getBoundingClientRect();
      return `${selection.toString()}|${Math.round(rect.left)}|${Math.round(rect.top)}|${Math.round(rect.width)}`;
    };
    function fire() {
      log("bridge.fire");
      if (touching || !TOUCH.matches) return;
      const selection = getSelection();
      if (!selection || selection.isCollapsed || !selection.rangeCount || !selection.toString().trim()) { lastKey = ""; return; }
      const key = selectionKey();
      if (key === lastKey) { log("bridge.duplicate"); return; }
      lastKey = key;
      const range = selection.getRangeAt(0), rects = range.getClientRects();
      const last = rects[rects.length - 1] || range.getBoundingClientRect();
      const node = range.endContainer, target = node.nodeType === 1 ? node : node.parentElement;
      if (target && isOwnTarget(target)) { log("bridge.ownTarget"); return; }
      log("bridge.dispatchMouseup");
      (target || document.body).dispatchEvent(new MouseEvent("mouseup", { bubbles:true, cancelable:true, composed:true, button:0, clientX:Math.max(0, last.right - 1), clientY:last.top + last.height / 2 }));
    }
    // The OS can cancel the touch as it takes over native selection. For a single word only,
    // offer the old 900 ms fallback; this is a compromise, not proof that the finger lifted.
    const cancelFallback = () => { clearTimeout(fallbackTimer); fallbackTimer = 0; fallbackKey = ""; };
    const schedule = () => {};
    document.addEventListener("selectionchange", () => {
      if (fallbackTimer && selectionKey() !== fallbackKey) { cancelFallback(); log("bridge.fallbackCancelled"); }
    });
    document.addEventListener("contextmenu", () => { log("contextmenu"); if (!TOUCH.matches || touching) return; cancelFallback(); clearTimeout(timer); timer = setTimeout(fire, 60); }, true);
    document.addEventListener("touchstart", () => { touching = true; log("touchstart"); cancelFallback(); clearTimeout(timer); }, { capture:true, passive:true });
    document.addEventListener("touchend", () => { touching = false; log("touchend"); cancelFallback(); clearTimeout(timer); timer = setTimeout(fire, 80); }, { capture:true, passive:true });
    document.addEventListener("touchcancel", () => {
      touching = false; log("touchcancel"); clearTimeout(timer); cancelFallback();
      const selection = getSelection(), text = selection?.toString().trim() || "";
      if (!TOUCH.matches || !text || /\s/u.test(text) || selection.isCollapsed || !selection.rangeCount) return;
      fallbackKey = selectionKey();
      if (!fallbackKey) return;
      log("bridge.fallbackScheduled");
      fallbackTimer = setTimeout(() => {
        const unchanged = fallbackKey && fallbackKey === selectionKey();
        cancelFallback();
        if (unchanged) { log("bridge.fallbackFire"); fire(); }
      }, 900);
    }, { capture:true, passive:true });
    document.addEventListener("mouseup", event => { if (event.isTrusted) lastKey = selectionKey(); }, true);
    const bridge=Object.freeze({ schedule });touchBridges.set(doc,bridge);return bridge;
  }

  globalThis.LHN_SELECTION_TOOLBAR = Object.freeze({
    ACTIONS, ACTION_IDS, ICONS, STYLES, DEFAULT_STYLE, DEFAULT_LOGO_ACTION,
    normalizeStyle, normalizeLogoAction, logoSvg, build, installTouchSelectionBridge
  });
})();
