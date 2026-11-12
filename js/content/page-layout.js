(() => {
  let pageLayoutSnapshot = null;
  function getInlineStyle(el, prop) {
    return { value: el.style.getPropertyValue(prop), priority: el.style.getPropertyPriority(prop) };
  }
  function restoreInlineStyle(el, prop, saved) {
    if (!saved || !el) return;
    if (saved.value) el.style.setProperty(prop, saved.value, saved.priority);
    else el.style.removeProperty(prop);
  }
  function applyPageShrink(width) {
    const root = document.documentElement, body = document.body;
    if (!pageLayoutSnapshot) pageLayoutSnapshot = {
      rootWidth: getInlineStyle(root, "width"), rootMaxWidth: getInlineStyle(root, "max-width"), rootBoxSizing: getInlineStyle(root, "box-sizing"),
      rootMarginLeft: getInlineStyle(root, "margin-left"), rootMarginRight: getInlineStyle(root, "margin-right"), rootOverflowX: getInlineStyle(root, "overflow-x"),
      bodyWidth: body ? getInlineStyle(body, "width") : null, bodyMinWidth: body ? getInlineStyle(body, "min-width") : null,
      bodyMarginLeft: body ? getInlineStyle(body, "margin-left") : null, bodyMaxWidth: body ? getInlineStyle(body, "max-width") : null, bodyMarginRight: body ? getInlineStyle(body, "margin-right") : null,
      bodyOverflowX: body ? getInlineStyle(body, "overflow-x") : null
    };
    // Reduce the actual layout viewport, rather than merely adding a margin.
    // This leaves a dedicated strip for the fixed sidebar and prevents it from
    // covering the page's main content on responsive layouts.
    root.style.setProperty("box-sizing", "border-box", "important");
    // Keep the root viewport full-size so the fixed sidebar itself is never
    // clipped. Narrow the body (the page layout container) instead.
    root.style.setProperty("width", "100%", "important");
    root.style.setProperty("max-width", "100%", "important");
    root.style.setProperty("margin-left", "0", "important");
    root.style.setProperty("margin-right", "0", "important");
    root.style.setProperty("overflow-x", "visible", "important");
    if (body) {
      body.style.setProperty("box-sizing", "border-box", "important");
      body.style.setProperty("width", `calc(100vw - ${width}px)`, "important");
      body.style.setProperty("min-width", "0", "important");
      body.style.setProperty("margin-left", "0", "important");
      body.style.setProperty("margin-right", "0", "important");
      body.style.setProperty("max-width", `calc(100vw - ${width}px)`, "important");
      body.style.setProperty("overflow-x", "hidden", "important");
    }
  }
  function restorePageWidth() {
    if (!pageLayoutSnapshot) return;
    const snap = pageLayoutSnapshot; pageLayoutSnapshot = null;
    restoreInlineStyle(document.documentElement, "width", snap.rootWidth);
    restoreInlineStyle(document.documentElement, "max-width", snap.rootMaxWidth);
    restoreInlineStyle(document.documentElement, "box-sizing", snap.rootBoxSizing);
    restoreInlineStyle(document.documentElement, "margin-left", snap.rootMarginLeft);
    restoreInlineStyle(document.documentElement, "margin-right", snap.rootMarginRight);
    restoreInlineStyle(document.documentElement, "overflow-x", snap.rootOverflowX);
    if (document.body) {
      restoreInlineStyle(document.body, "width", snap.bodyWidth);
      restoreInlineStyle(document.body, "min-width", snap.bodyMinWidth);
      restoreInlineStyle(document.body, "margin-left", snap.bodyMarginLeft);
      restoreInlineStyle(document.body, "max-width", snap.bodyMaxWidth);
      restoreInlineStyle(document.body, "margin-right", snap.bodyMarginRight);
      restoreInlineStyle(document.body, "overflow-x", snap.bodyOverflowX);
    }
  }
  globalThis.LHN_PAGE_LAYOUT = Object.freeze({ applyPageShrink, restorePageWidth });
})();
