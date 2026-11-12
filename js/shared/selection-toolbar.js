// Floating selection toolbar shared by the page launcher (content script) and the Dashboard previews.
// One definition of actions, icons, logo and style flags; css/shared/selection-toolbar.css styles every variant.
(() => {
  "use strict";

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
  // Order: radial before bar; within each, labels before icons; always open before hover to open.
  //   radial (3 framed buttons around the logo: Highlight left, Translate below, Ask AI right):
  //     1 = labels, always open · 2 = labels, hover to open · 3 = icons, always open · 4 = icons, hover to open
  //   bar (actions in a row, logo right):
  //     5 = labels, always open · 6 = labels, hover to open · 7 = icons, always open · 8 = icons, hover to open
  const STYLES = Object.freeze({
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
   * @param {string} options.style        "1".."8"
   * @param {(key:string) => string} options.t  i18n lookup
   * @param {string} [options.logoAction] action run by the logo
   * @param {(id:string) => void} [options.onAction] called for action buttons and the logo
   * @param {boolean} [options.preview]   static, non-focusable markup for settings previews
   * @param {string} [options.idSuffix]   keeps SVG ids unique when several toolbars share a document
   */
  function build({ document:doc, style, t = key => key, logoAction, onAction = null, preview = false, idSuffix = "" }) {
    const styleId = normalizeStyle(style);
    const flags = STYLES[styleId];
    const logoActionId = normalizeLogoAction(logoAction);
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
    ACTIONS.forEach((spec, index) => {
      const label = t(spec.labelKey);
      const action = doc.createElement(tag);
      action.className = `lhn-translate-action ${spec.className}`;
      action.dataset.action = spec.id;
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
      if (index < ACTIONS.length - 1) {
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

  globalThis.LHN_SELECTION_TOOLBAR = Object.freeze({
    ACTIONS, ACTION_IDS, ICONS, STYLES, DEFAULT_STYLE, DEFAULT_LOGO_ACTION,
    normalizeStyle, normalizeLogoAction, logoSvg, build
  });
})();
