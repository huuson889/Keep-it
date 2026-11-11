// Keepit shared sheet behaviour (v3.5.161). Every bottom sheet / popover of the Keepit bar (☰, search, long-press menu),
// Notes on touch, the Reader, the video overlay and the touch translation / dictionary sheets behaves the same way:
//  · while any of them is open the page behind does not scroll (touch, wheel, scroll keys) — only the sheet's own lists do,
//    and they never hand the scroll over to the page (overscroll-behavior: contain);
//  · touch: drag down from anywhere on a sheet to close it; inside a list that is scrolled down the list scrolls back to its
//    top first (the decision is made once per gesture, so a first jitter in the other direction never blocks the scroll);
//  · a sheet with a taller step (the ☰ sheet) grows while pulled up and the same gesture goes on scrolling its list once it
//    reaches the top step; v3.5.175: with grow.mid a pull down from the top step returns to the middle step, further = closed;
//  · tapping outside still closes (each sheet keeps its own scrim / outside-click handler).
// Content-script world only; nothing is stored or sent.
(() => {
  "use strict";
  if (globalThis.LHN_SHEET) return;
  const entries = new Map();   // element → options
  const EDIT = "input:not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit]):not([type=range]):not([type=color]):not([type=file]),textarea,select,[contenteditable]:not([contenteditable=false])";
  const SLOP = 6, KEYS = new Set([" ", "PageUp", "PageDown", "Home", "End", "ArrowUp", "ArrowDown"]);
  let on = false, g = null, eatUntil = 0, fling = 0, poll = 0;

  const isOpen = (el, o) => { try { return el.isConnected && !!o.isOpen(); } catch { return false; } };
  const openList = () => { const a = []; entries.forEach((o, el) => { if (isOpen(el, o)) a.push([el, o]); }); return a; };
  const entryIn = (path, list) => list.find(([el]) => path.includes(el)) || null;
  // elements from the touch target up to (and including) the sheet element — crosses open shadow roots
  const chain = (path, stop) => { const a = []; for (const n of path) { if (n instanceof Element) a.push(n); if (n === stop) break; } return a; };
  const style = n => getComputedStyle(n);
  const canY = n => n.scrollHeight > n.clientHeight + 1 && /auto|scroll/.test(style(n).overflowY);
  const canX = n => n.scrollWidth > n.clientWidth + 1 && /auto|scroll/.test(style(n).overflowX);
  const roomY = (n, d) => d < 0 ? n.scrollTop + n.clientHeight < n.scrollHeight - 1 : n.scrollTop > 0;   // d = finger delta
  const roomX = (n, d) => d < 0 ? n.scrollLeft + n.clientWidth < n.scrollWidth - 1 : n.scrollLeft > 0;
  const contain = list => list.forEach(n => { if (n.style.overscrollBehavior !== "contain") n.style.overscrollBehavior = "contain"; });
  const setT = (el, y) => { if (y === null) el.style.removeProperty("translate"); else el.style.setProperty("translate", `0 ${y}px`, "important"); };
  const setTr = (el, v) => { if (v === null) el.style.removeProperty("transition"); else el.style.setProperty("transition", v, "important"); };
  const stopFling = () => { if (fling) cancelAnimationFrame(fling); fling = 0; };
  function startFling(sc, v) {   // v = content speed in px/ms (positive = scrollTop grows)
    stopFling(); let last = performance.now();
    const step = now => {
      const dt = Math.min(40, now - last); last = now;
      const before = sc.scrollTop; sc.scrollTop += v * dt; v *= Math.pow(0.95, dt / 16);
      if (Math.abs(v) < 0.02 || sc.scrollTop === before) { fling = 0; return; }
      fling = requestAnimationFrame(step);
    };
    fling = requestAnimationFrame(step);
  }
  const velocity = s => {   // finger speed px/ms over the last ~100ms (positive = down)
    const now = performance.now(), pts = s.filter(p => now - p.t < 100);
    if (pts.length < 2) return 0; const a = pts[0], b = pts[pts.length - 1];
    return b.t > a.t ? (b.y - a.y) / (b.t - a.t) : 0;
  };

  function decide(dx, dy) {
    const hit = g.entry; if (!hit) return "block";
    const [el, o] = hit, els = chain(g.path, el);
    if (Math.abs(dx) > Math.abs(dy)) {   // sideways: chips rows, sliders and caret moves keep working
      if (els.some(n => n.matches("input[type=range]") || n.matches(EDIT))) return "native";
      const sx = els.filter(n => canX(n) && roomX(n, dx)); if (sx.length) { contain(els.filter(canX)); return "native"; }
      return "block";
    }
    const scs = els.filter(canY);
    if (dy > 0) {
      if (scs.some(n => n.scrollTop > 0)) { contain(scs); return "native"; }
      return o.drag === false ? "block" : "drag";
    }
    if (o.grow && !o.grow.isFull()) { g.sc = o.scroller?.() || scs[0] || null; return "grow"; }
    if (scs.some(n => roomY(n, dy))) { contain(scs); return "native"; }
    return o.drag === false ? "block" : "drag";
  }

  function onStart(e) {
    stopFling();
    if (e.touches.length !== 1) { g = null; return; }
    const list = openList(); if (!list.length) { g = null; sync(); return; }
    const p = e.touches[0], path = e.composedPath();
    g = { entry:entryIn(path, list), path, x:p.clientX, y:p.clientY, mode:"", dy:0, s:[{ t:performance.now(), y:p.clientY }] };
  }
  function onMove(e) {
    if (e.touches.length !== 1) return;   // pinch-zoom stays free
    if (!g) { if (e.cancelable && openList().length) e.preventDefault(); return; }
    const p = e.touches[0], dx = p.clientX - g.x, dy = p.clientY - g.y;
    g.s.push({ t:performance.now(), y:p.clientY }); if (g.s.length > 12) g.s.shift();
    if (!g.mode) {
      if (Math.hypot(dx, dy) < SLOP) { if (e.cancelable && !g.entry) e.preventDefault(); return; }
      g.mode = decide(dx, dy); g.y0 = p.clientY;
    }
    if (g.mode === "native") return;
    if (!e.cancelable) {   // the browser already scrolls this gesture — give it up cleanly
      if (g.mode === "drag" || g.mode === "grow") reset(g.entry); g.mode = "native"; return;
    }
    e.preventDefault();
    if (g.mode === "block") return;
    const [el, o] = g.entry, d = p.clientY - g.y0;
    if (!g.h) { const r = el.getBoundingClientRect(); g.h = r.height; g.cap = o.grow?.cap?.() || g.h; g.st0 = g.sc?.scrollTop || 0; setTr(el, "none"); o.onDrag?.(true); }
    g.dy = d;
    if (g.mode === "grow" && d < 0) {
      setT(el, null); const want = g.h - d;
      if (want <= g.cap) { o.grow.setH(want); if (g.sc) g.sc.scrollTop = g.st0; }
      else { o.grow.setH(g.cap); if (g.sc) g.sc.scrollTop = g.st0 + (want - g.cap); }
      return;
    }
    if (g.mode === "grow") o.grow.setH(null);
    // v3.5.175: a 2-step sheet (grow.mid) pulled down from the top step first shrinks to the middle step, then slides away
    const mid = g.mode === "drag" && d > 0 && o.grow?.mid && o.grow.isFull() ? o.grow.mid() : 0;
    if (mid) { const room = Math.max(0, g.h - mid); if (d <= room) { o.grow.setH(g.h - d); setT(el, null); } else { o.grow.setH(mid); setT(el, d - room); } return; }
    setT(el, d > 0 ? d : Math.max(d, -120) * 0.12);
  }
  function reset(hit) {
    if (!hit) return; const [el, o] = hit;
    setT(el, null); setTr(el, null); o.grow?.setH?.(null); o.onDrag?.(false);
  }
  function onEnd(e) {
    const s = g; g = null; if (!s || !s.h || (s.mode !== "drag" && s.mode !== "grow")) return;
    eatUntil = Date.now() + 90;
    const [el, o] = s.entry, d = s.dy, v = velocity(s.s), done = e.type === "touchend";
    o.onDrag?.(false);
    const snap = () => { setTr(el, "translate .2s ease"); setT(el, null); setTimeout(() => setTr(el, null), 220); };
    if (s.mode === "grow" && d < 0) {
      setTr(el, null);
      o.grow.release(done && d < -40);
      if (done && s.sc && s.h - d > s.cap && v < -0.05) startFling(s.sc, -v);
      return;
    }
    // v3.5.175: 2-step sheet from its top step: below the middle step past min(110px, 30%) or flicked = closed;
    // pulled > 56px or flicked down = middle step; else back to the top step
    const mid = d > 0 && o.grow?.mid && o.grow.isFull() ? o.grow.mid() : 0;
    const ex = mid ? d - Math.max(0, s.h - mid) : d, closeAt = Math.min(110, (mid || s.h) * 0.3);
    if (mid && !(done && ex > 0 && (ex > closeAt || (v > 0.6 && ex > 24)))) {
      setTr(el, null);
      if (done && (d > 56 || v > 0.5)) { o.grow.collapse?.(); setT(el, null); } else { o.grow.setH(null); snap(); }
      return;
    }
    // v3.5.163: pulled down = closed (from the middle step): past min(110px, 30%) or a quick flick; else back
    if (done && (ex > closeAt || (v > 0.6 && ex > 24))) {
      setTr(el, "translate .18s ease-in"); setT(el, s.h + 40);
      setTimeout(() => {
        setTr(el, "none"); try { o.close(); } catch {}
        requestAnimationFrame(() => requestAnimationFrame(() => { setT(el, null); setTr(el, null); sync(); }));
      }, 180);
      return;
    }
    setTr(el, null); snap();
  }
  function onWheel(e) {
    if (e.ctrlKey) return;
    const list = openList(); if (!list.length) { sync(); return; }
    const path = e.composedPath(), hit = entryIn(path, list);
    if (hit) {
      const els = chain(path, hit[0]), vert = Math.abs(e.deltaY) >= Math.abs(e.deltaX);
      const ok = els.filter(n => vert ? canY(n) && roomY(n, -e.deltaY) : canX(n) && roomX(n, -e.deltaX));
      if (ok.length) { contain(els.filter(vert ? canY : canX)); return; }
    }
    if (e.cancelable) e.preventDefault();
  }
  function onKey(e) {
    if (!KEYS.has(e.key) || e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
    const list = openList(); if (!list.length) return;
    const path = e.composedPath(), t = path[0];
    if (t instanceof Element && t.closest(EDIT)) return;
    if (entryIn(path, list)) return;
    e.preventDefault();
  }
  const onClick = e => { if (Date.now() < eatUntil) { e.stopPropagation(); e.preventDefault(); } };

  function sync() {
    const want = openList().length > 0;
    if (want === on) return; on = want;
    const f = want ? addEventListener : removeEventListener;
    f("touchstart", onStart, { capture:true, passive:true });
    f("touchmove", onMove, { capture:true, passive:false });
    f("touchend", onEnd, { capture:true, passive:true });
    f("touchcancel", onEnd, { capture:true, passive:true });
    f("wheel", onWheel, { capture:true, passive:false });
    f("keydown", onKey, false);
    f("click", onClick, true);
    clearInterval(poll); poll = want ? setInterval(sync, 600) : 0;   // sheets removed without a class change
    if (!want) { g = null; stopFling(); }
  }
  // el = the moving sheet/popover; o = { isOpen(), close(), watch?: Element|Element[], drag?: false, scroller?(),
  //   grow?: { isFull(), cap(), setH(px|null), release(expand: pulled up > 40px), mid?() (px of the middle step: v3.5.175 2-step sheet), collapse?() (back to the middle step) }, onDrag?(on) }
  function attach(el, o) {
    if (!el || !o) return;
    const known = entries.has(el); entries.set(el, o);
    if (!known) {
      const mo = new MutationObserver(sync);
      for (const w of [].concat(o.watch || el)) if (w) mo.observe(w, { attributes:true, attributeFilter:["class", "hidden", "style", "open"] });
    }
    sync();
  }
  globalThis.LHN_SHEET = Object.freeze({ attach, sync, locked:() => on, detach:el => { entries.delete(el); sync(); } });
})();
