// Loại từ (Word class) on web pages — ☰ Loại từ (Alt+G: English paragraphs on screen, more as you scroll) and
// ☰ Loại từ đoạn (tap a paragraph / Alt+J: the paragraph near the pointer). Each word gets a coloured underline and its
// abbreviation (N, V, Adj…) underneath, as in Keepit-demo/pos v4; nouns written next to each other share one underline.
// The page's text is only wrapped, never changed: the labels live in closed shadow roots, so they are not page text (not
// read by the Reader, not translated, not in selections / notes / copy). Turning it off unwraps every word and joins the
// split text nodes back into the page's own nodes. Tags come from the on-device model (background.js → engine.js).
(() => {
  if (globalThis.LHN_WORD_CLASS || window.top !== window) return;
  const CORE = globalThis.LHN_WORD_CLASS_CORE; if (!CORE) return;
  const api = globalThis.browser || globalThis.chrome;
  const isYouTube = () => /(^|\.)youtube\.com$/.test(location.hostname);
  const websiteKey = () => location.hostname.toLowerCase().replace(/^www\./, "").replace(/\.$/, "");
  let settings = {}, websiteDisabled = false, pageMode = false, lastPointer = null, skippedNotice = false;
  const lang = () => globalThis.LHN_LANGUAGES?.languageFor?.(settings) || "en";
  const t = (key, vars) => globalThis.LHN_LANGUAGES?.t?.("wc_" + key, vars, lang()) ?? key;
  const enabled = () => settings.wordClassEnabled !== false && !websiteDisabled && !isYouTube() && /^https?:$/.test(location.protocol);
  const send = (type, extra) => globalThis.LHN_MESSAGING?.sendMessage({ type, ...(extra || {}) }).catch(() => null) ?? Promise.resolve(null);
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

  // ---------- status card at the top (confirm download, progress, notices + Undo) ----------
  let cardHost = null, card = null, cardT = 0;
  const keepitDark = () => { const th = String(settings.sidebarTheme || ""); return th === "dark" || (th !== "light" && matchMedia("(prefers-color-scheme: dark)").matches); };
  const CARD_CSS = `:host{all:initial}
.c{position:fixed;left:50%;top:14px;transform:translate(-50%,-8px);opacity:0;pointer-events:none;transition:opacity .2s,transform .26s cubic-bezier(.2,.8,.2,1);
  box-sizing:border-box;width:max-content;max-width:min(420px,calc(100vw - 24px));padding:12px 14px;border-radius:16px;font:14px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;
  color:#0f172a;background:rgba(255,255,255,.86);-webkit-backdrop-filter:blur(24px) saturate(1.6);backdrop-filter:blur(24px) saturate(1.6);border:1px solid rgba(15,23,42,.08);box-shadow:0 10px 30px rgba(15,23,42,.16)}
.c.on{opacity:1;transform:translate(-50%,0);pointer-events:auto}
.c.dark{color:#e2e8f0;background:rgba(30,30,36,.82);border-color:rgba(255,255,255,.1);box-shadow:0 10px 30px rgba(0,0,0,.45)}
.row{display:flex;align-items:center;gap:12px}.row .tx{flex:1;min-width:0}
b{display:block;font-weight:650;margin-bottom:2px}p{margin:0;color:#475569;font-size:13px}.dark p{color:#94a3b8}
.acts{display:flex;justify-content:flex-end;gap:8px;margin-top:10px}
button{appearance:none;border:0;border-radius:10px;font:600 13px/1 inherit;font-family:inherit;padding:9px 14px;cursor:pointer;color:#334155;background:rgba(15,23,42,.06)}
.dark button{color:#e2e8f0;background:rgba(255,255,255,.1)}
button.pri{color:#fff;background:#4f46e5}button.link{background:none;color:#4f46e5;padding:6px 4px}.dark button.link{color:#a5a9ff}
.bar{height:4px;border-radius:4px;background:rgba(15,23,42,.1);overflow:hidden;margin-top:8px}.dark .bar{background:rgba(255,255,255,.14)}
.bar i{display:block;height:100%;width:0;background:#4f46e5;border-radius:4px;transition:width .25s}`;
  function cardEl() {
    if (card?.isConnected) return card;
    cardHost = document.createElement("div"); cardHost.id = "lhn-word-class-ui"; cardHost.setAttribute("data-lhn-bilingual-ui", "true");
    cardHost.setAttribute("style", "all:initial;position:fixed;left:0;top:0;width:0;height:0;z-index:2147483001;");
    const root = cardHost.attachShadow({ mode:"closed" });
    root.innerHTML = `<style>${CARD_CSS}</style><div class="c" role="status" aria-live="polite"></div>`;
    card = root.querySelector(".c"); (document.body || document.documentElement).append(cardHost);
    return card;
  }
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" }[c]));
  function showCard(html, ms) {
    const c = cardEl(); clearTimeout(cardT);
    c.classList.toggle("dark", keepitDark()); c.innerHTML = html; c.offsetWidth; c.classList.add("on");
    if (ms) cardT = setTimeout(hideCard, ms);
    return c;
  }
  function hideCard() { clearTimeout(cardT); card?.classList.remove("on"); }

  // ---------- v3.5.291 legend: small frosted panel, top right, while words are labelled ----------
  // Shows the abbreviations used on the page ("N · Noun: Danh từ / Danh từ riêng"). Each time Word class is turned on it
  // shows again (× hides it until then); Settings → Word class → "Show the legend" off = never. Drag the header to move it; the place
  // is kept in storage (lhnWordClassLegend {x, y}: share of the free space, so it stays on screen when the window changes size).
  const LEGEND_KEY = "lhnWordClassLegend";
  // v3.5.293: wider (one line per label in vi), each row explains its word class on hover (tap on touch) in a frosted tip,
  // and ☰ Chú thích shows / hides it by hand (legManual: shown even with "Show the legend" off or nothing labelled yet → all labels).
  let legHost = null, leg = null, legTip = null, legClosed = false, legManual = false, legPos = null;
  const LEG_CSS = `:host{all:initial}
.l{position:fixed;top:14px;right:14px;box-sizing:border-box;width:max-content;max-width:min(440px,calc(100vw - 24px));max-height:min(60vh,420px);display:flex;flex-direction:column;
  border-radius:14px;font:12.5px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;color:#475569;background:rgba(255,255,255,.78);
  -webkit-backdrop-filter:blur(24px) saturate(1.6);backdrop-filter:blur(24px) saturate(1.6);border:1px solid rgba(15,23,42,.08);box-shadow:0 8px 26px rgba(15,23,42,.14);
  opacity:0;transform:translateY(-6px);pointer-events:none;transition:opacity .2s,transform .26s cubic-bezier(.2,.8,.2,1)}
.l.on{opacity:1;transform:none;pointer-events:auto}
.l.dark{color:#94a3b8;background:rgba(30,30,36,.76);border-color:rgba(255,255,255,.1);box-shadow:0 8px 26px rgba(0,0,0,.4)}
.h{display:flex;align-items:center;gap:8px;padding:7px 6px 3px 12px;cursor:grab;touch-action:none;user-select:none;-webkit-user-select:none}
.l.drag .h{cursor:grabbing}
.h b{flex:1;font-size:12px;font-weight:650;color:#0f172a}.dark .h b{color:#e2e8f0}
.x{appearance:none;border:0;background:none;width:24px;height:24px;border-radius:7px;display:grid;place-items:center;cursor:pointer;color:inherit;padding:0}
.x:hover{background:rgba(15,23,42,.07)}.dark .x:hover{background:rgba(255,255,255,.1)}
.x svg{width:14px;height:14px}
.b{display:flex;flex-direction:column;gap:3px;padding:2px 12px 10px;overflow:auto;scrollbar-width:thin}
.b::-webkit-scrollbar{width:3px}.b::-webkit-scrollbar-thumb{background:rgba(100,116,139,.45);border-radius:3px}
.b span{display:block;white-space:normal;margin:0 -6px;padding:1px 6px 1px 16px;text-indent:-10px;border-radius:7px;cursor:default;transition:background .15s}.b b{font-weight:700;white-space:nowrap}
.b span:hover,.b span.tp-on{background:rgba(15,23,42,.06)}.dark .b span:hover,.dark .b span.tp-on{background:rgba(255,255,255,.08)}
.tp{position:fixed;box-sizing:border-box;width:max-content;max-width:min(280px,calc(100vw - 24px));padding:9px 12px;border-radius:12px;font:12.5px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;
  color:#334155;background:rgba(255,255,255,.86);-webkit-backdrop-filter:blur(24px) saturate(1.6);backdrop-filter:blur(24px) saturate(1.6);border:1px solid rgba(15,23,42,.08);box-shadow:0 8px 26px rgba(15,23,42,.16);
  opacity:0;transform:translateY(2px);pointer-events:none;transition:opacity .15s,transform .2s cubic-bezier(.2,.8,.2,1)}
.tp.on{opacity:1;transform:none}.tp.dark{color:#cbd5e1;background:rgba(30,30,36,.86);border-color:rgba(255,255,255,.1);box-shadow:0 8px 26px rgba(0,0,0,.45)}
.tp b{display:block;margin-bottom:2px;font-weight:700}`;
  function legendEl() {
    if (leg?.isConnected) return leg;
    legHost = document.createElement("div"); legHost.id = "lhn-word-class-legend"; legHost.setAttribute("data-lhn-bilingual-ui", "true");
    legHost.setAttribute("style", "all:initial;position:fixed;left:0;top:0;width:0;height:0;z-index:2147483000;");
    const root = legHost.attachShadow({ mode:"closed" });
    root.innerHTML = `<style>${LEG_CSS}</style><div class="l" role="note"><div class="h"><b></b><button class="x" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div><div class="b"></div></div><div class="tp" role="tooltip"></div>`;
    leg = root.querySelector(".l"); legTip = root.querySelector(".tp"); (document.body || document.documentElement).append(legHost);
    leg.querySelector(".x").addEventListener("click", () => { legClosed = true; legManual = false; legendSync(); legendChanged(); });
    // row → definition (outside .l: its backdrop-filter would make it the tip's containing block)
    const body = leg.querySelector(".b");
    body.addEventListener("pointerover", e => { if (e.pointerType !== "touch") showTip(e.target.closest?.("span[data-a]")); });
    body.addEventListener("pointerleave", e => { if (e.pointerType !== "touch") hideTip(); });
    body.addEventListener("click", e => { const row = e.target.closest?.("span[data-a]"); if (row && row.classList.contains("tp-on")) hideTip(); else showTip(row); });
    body.addEventListener("scroll", hideTip, { passive:true });
    // drag by the header (mouse / touch / pen)
    const head = leg.querySelector(".h");
    head.addEventListener("pointerdown", e => {
      if (e.button || e.target.closest(".x")) return;
      hideTip();
      const r = leg.getBoundingClientRect(), dx = e.clientX - r.left, dy = e.clientY - r.top;
      head.setPointerCapture(e.pointerId); leg.classList.add("drag"); e.preventDefault();
      const move = ev => placeLegend({ left:ev.clientX - dx, top:ev.clientY - dy });
      const up = () => { head.removeEventListener("pointermove", move); leg.classList.remove("drag"); savePos(); };
      head.addEventListener("pointermove", move); head.addEventListener("pointerup", up, { once:true }); head.addEventListener("pointercancel", up, { once:true });
    });
    return leg;
  }
  function placeLegend(at) {
    if (!leg) return;
    const w = leg.offsetWidth, h = leg.offsetHeight, fw = Math.max(0, innerWidth - w - 8), fh = Math.max(0, innerHeight - h - 8);
    let left, top;
    if (at) { left = at.left; top = at.top; } else if (legPos) { left = legPos.x * fw; top = legPos.y * fh; } else { leg.style.left = ""; leg.style.top = ""; leg.style.right = ""; return; }
    left = Math.min(Math.max(8, left), Math.max(8, fw)); top = Math.min(Math.max(8, top), Math.max(8, fh));
    leg.style.right = "auto"; leg.style.left = left + "px"; leg.style.top = top + "px";
    if (at) legPos = { x:fw ? left / fw : 0, y:fh ? top / fh : 0 };
  }
  function showTip(row) {
    if (!row || !legTip) { hideTip(); return; }
    if (row.classList.contains("tp-on") && legTip.classList.contains("on")) return;
    leg.querySelectorAll(".b span.tp-on").forEach(s => s.classList.remove("tp-on")); row.classList.add("tp-on");
    const a = row.dataset.a, b = row.querySelector("b");
    legTip.classList.toggle("dark", keepitDark());
    legTip.innerHTML = `<b style="color:${b?.style.color || "inherit"}">${esc(b?.textContent.replace(/:\s*$/, "") || a)}</b>${esc(t("def_" + a.replace(/\s+/g, "")))}`;
    const L = leg.getBoundingClientRect(), r = row.getBoundingClientRect(), w = legTip.offsetWidth, h = legTip.offsetHeight;
    const left = L.left - w - 8 >= 8 ? L.left - w - 8 : Math.min(L.right + 8, innerWidth - w - 8);   // beside the panel, the side with room
    const top = Math.min(Math.max(8, r.top - 6), innerHeight - h - 8);
    legTip.style.left = Math.max(8, left) + "px"; legTip.style.top = top + "px"; legTip.classList.add("on");
  }
  function hideTip() { legTip?.classList.remove("on"); leg?.querySelectorAll(".b span.tp-on").forEach(s => s.classList.remove("tp-on")); }
  const legendChanged = () => document.dispatchEvent(new CustomEvent("lhn-word-class-change", { detail:{ page:pageMode, legend:legendShown() } }));
  const legendShown = () => !!leg?.classList.contains("on");
  function toggleLegend() {   // ☰ Chú thích
    if (!enabled()) return false;
    if (legendShown()) { legClosed = true; legManual = false; } else { legClosed = false; legManual = true; }
    legendSync(); legendChanged(); return legendShown();
  }
  const savePos = () => { if (legPos) api.storage?.local?.set({ [LEGEND_KEY]:legPos })?.catch?.(() => {}); };
  addEventListener("resize", () => { if (leg?.classList.contains("on")) placeLegend(); }, { passive:true });
  function legendSync() {
    const used = new Set(); tagged.forEach(rec => (rec.upos || []).forEach(u => used.add(u)));
    const show = enabled() && !legClosed && (legManual || (settings.wordClassLegend !== false && used.size > 0));
    if (!show) { if (legendShown()) { leg.classList.remove("on"); hideTip(); queueMicrotask(legendChanged); } return; }
    const el = legendEl(), dark = keepitDark();
    el.classList.toggle("dark", dark);
    el.querySelector(".h b").textContent = t("legend"); el.querySelector(".x").setAttribute("aria-label", t("close")); el.querySelector(".x").title = t("close");
    const html = CORE.legend(used.size ? [...used].map(upos => ({ upos, pos:CORE.POS[upos] })).filter(x => x.pos) : null, meaning, dark);
    const body = el.querySelector(".b"); if (body.innerHTML !== html) { hideTip(); body.innerHTML = html; }
    const was = legendShown(); el.classList.add("on"); placeLegend(); if (!was) queueMicrotask(legendChanged);
  }
  api.storage?.local?.get(LEGEND_KEY).then(d => { const p = d?.[LEGEND_KEY]; if (p && typeof p.x === "number" && typeof p.y === "number") { legPos = { x:Math.min(1, Math.max(0, p.x)), y:Math.min(1, Math.max(0, p.y)) }; placeLegend(); } }).catch(() => {});
  function notice(text, undo) {
    const c = showCard(`<div class="row"><span class="tx">${esc(text)}</span>${undo ? `<button class="link" type="button">${esc(t("undo"))}</button>` : ""}</div>`, undo ? 5000 : 2400);
    if (undo) c.querySelector("button").addEventListener("click", () => { hideCard(); undo(); }, { once:true });
  }
  function askDownload() {
    return new Promise(resolve => {
      const c = showCard(`<b>${esc(t("askTitle"))}</b><p>${esc(t("askText"))}</p><div class="acts"><button type="button" data-a="no">${esc(t("cancel"))}</button><button class="pri" type="button" data-a="yes">${esc(t("download"))}</button></div>`);
      c.querySelector('[data-a="yes"]').focus({ preventScroll:true });
      c.addEventListener("click", function on(e) { const b = e.target.closest("[data-a]"); if (!b) return; c.removeEventListener("click", on); hideCard(); resolve(b.dataset.a === "yes"); });
    });
  }

  // ---------- model: confirm once, download with progress, then offline ----------
  let modelWait = null;
  function ensureModel() {
    return modelWait ||= (async () => {
      let st = await send("WORD_CLASS_STATUS");
      if (!st?.ok) { notice(t("error")); return false; }
      if (st.downloaded && !st.loading) return true;
      if (!st.loading) { if (!(await askDownload())) return false; st = await send("WORD_CLASS_DOWNLOAD"); if (!st?.ok) { notice(t("failed")); return false; } }
      const pct = s => s?.total ? Math.min(100, Math.round(100 * s.loaded / s.total)) : 0;
      const draw = s => showCard(`<b>${esc(t("downloading", { p:pct(s) }))}</b><div class="bar"><i style="width:${pct(s)}%"></i></div>`);
      draw(st);
      for (;;) {
        await delay(400); st = await send("WORD_CLASS_STATUS");
        if (!st?.ok || st.error) { notice(t("failed")); return false; }
        if (st.downloaded && !st.loading) { hideCard(); return true; }
        const bar = card?.querySelector(".bar i"), head = card?.querySelector("b");
        if (bar && head) { bar.style.width = pct(st) + "%"; head.textContent = t("downloading", { p:pct(st) }); } else draw(st);
      }
    })().finally(() => { modelWait = null; });
  }

  // ---------- which text: blocks, their text nodes, English only ----------
  const SKIP = "script,style,noscript,template,textarea,input,select,option,button,svg,math,iframe,object,video,audio,canvas,code,pre,kbd,samp,var,[contenteditable]:not([contenteditable=false]),.lhn-bilingual-card,.lhn-bilingual-speaker,[data-lhn-bilingual-ui],[id^='lhn-'],lhn-wc";
  const BLOCK = /^(P|DIV|LI|UL|OL|DL|DT|DD|H[1-6]|BLOCKQUOTE|TABLE|TBODY|THEAD|TR|TD|TH|SECTION|ARTICLE|HEADER|FOOTER|MAIN|ASIDE|NAV|FIGURE|FIGCAPTION|FORM|FIELDSET|DETAILS|SUMMARY|HR|BR|ADDRESS)$/;
  const own = el => !!el?.closest?.("[data-lhn-bilingual-ui],.lhn-bilingual-card,#lhn-bilingual-reading-bar");
  // text of a block: its text nodes in order; a nested block / <br> = new line, skipped inline content (code, buttons) = a space
  function collect(block) {
    const parts = []; let text = "";
    const walk = el => {
      for (const n of el.childNodes) {
        if (n.nodeType === 3) { if (n.data) { parts.push([n, text.length]); text += n.data; } continue; }
        if (n.nodeType !== 1) continue;
        if (n.matches(SKIP)) { text += BLOCK.test(n.tagName) ? "\n" : " "; continue; }
        if (!n.getClientRects().length && getComputedStyle(n).display !== "contents") { text += " "; continue; }   // hidden
        const blk = BLOCK.test(n.tagName); if (blk) text += "\n";
        walk(n); if (blk) text += "\n";
      }
    };
    walk(block);
    return { parts, text };
  }
  let pageEn = null;
  function pageEnglish() {
    if (pageEn !== null) return pageEn;
    const l = (document.documentElement.lang || "").toLowerCase();
    return pageEn = l ? l.startsWith("en") : null;
  }
  async function english(text) {
    const letters = (text.match(/\p{L}/gu) || []).length, latin = (text.match(/[A-Za-z]/g) || []).length;
    if (latin < 2 || latin / letters < 0.9) return false;                       // other scripts, or many accented letters (Vietnamese…)
    if (text.trim().length >= 40) {
      try { const r = await api.i18n.detectLanguage(text.slice(0, 1000)); const top = r?.languages?.[0]; if (top && (r.isReliable || top.percentage >= 60)) return top.language === "en"; } catch {}
    }
    const p = pageEnglish(); if (p !== null) return p;
    try { const r = await api.i18n.detectLanguage((document.body?.innerText || "").slice(0, 2000)); pageEn = r?.languages?.[0]?.language === "en"; } catch { pageEn = true; }
    return pageEn;
  }
  const paragraphBlocks = () => {
    let list = []; try { list = globalThis.LHN_READER_BAR?.mainBlocks?.() || []; } catch {}
    if (!list.length) list = [...document.querySelectorAll("p,li,h1,h2,h3,h4,h5,h6,blockquote,dd,dt,figcaption,td")];
    const kept = [];
    for (const b of list) if (b.isConnected && !own(b) && !kept.some(k => k.contains(b))) kept.push(b);
    return kept;
  };

  // ---------- wrap / unwrap ----------
  const tagged = new Map();   // block → { nodes:[{ node, created:Set }], hosts:[] }
  const HOST_STYLE = "display:inline-flex!important;flex-direction:column!important;align-items:center!important;vertical-align:baseline!important;margin:0!important;padding:0!important;border:0!important;float:none!important;position:static!important;text-indent:0!important;background:none!important";
  // Underline and label are placed from the baseline (not the font's content box), so the gaps stay the same in every font
  // and size: underline 2px just below the descenders, label 5px under it. .t ends at the baseline where text-box-trim exists.
  const SHADOW_CSS = `.t{display:block;white-space:nowrap;line-height:1.2;padding-bottom:calc(.1em + 9px)}
@supports (text-box-trim:trim-end){.t{text-box-trim:trim-end;text-box-edge:text alphabetic;padding-bottom:calc(.22em + 9px)}}
.a{display:block;min-height:15px;font:600 12px/15px system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;letter-spacing:.01em;white-space:nowrap;text-align:center;text-indent:0;text-transform:none;font-style:normal;text-decoration:none;-webkit-user-select:none;user-select:none}
.s{margin:0 3px;font-weight:400}`;
  const lum = c => { const m = String(c).match(/[\d.]+/g); return m && m.length >= 3 ? (0.299 * m[0] + 0.587 * m[1] + 0.114 * m[2]) / 255 : 0; };
  const meaning = upos => globalThis.LHN_LANGUAGES?.t?.("wc_" + upos, {}, lang()) || upos;
  const meaningEn = upos => globalThis.LHN_LANGUAGES?.t?.("wc_" + upos, {}, "en") || upos;
  function host(abbrs, tip, dark) {
    const h = document.createElement("lhn-wc"); h.className = "lhn-wc"; h.setAttribute("style", HOST_STYLE); if (tip) h.title = tip;
    const root = h.attachShadow({ mode:"closed" });
    root.innerHTML = `<style>${SHADOW_CSS}</style><span class="t"><slot></slot></span><span class="a" aria-hidden="true">${abbrs.map(a => `<span style="color:${CORE.color(a, dark)}">${esc(a)}</span>`).join(`<span class="s" style="color:${CORE.MUTED[dark ? 1 : 0]}">·</span>`)}</span>`;
    return h;
  }
  function underline(node, abbr, dark) {
    const u = document.createElement("lhn-wcu"); u.className = "lhn-wcu";
    u.setAttribute("style", `display:inline!important;text-decoration:underline 2px solid ${CORE.color(abbr, dark)}!important;text-decoration-skip-ink:none!important;text-underline-position:auto!important;text-underline-offset:calc(.22em + 2px)!important;border:0!important;padding:0!important;margin:0!important;background:none!important`);
    node.parentNode.insertBefore(u, node); u.appendChild(node); return u;
  }
  // units in one text node: [{ s, e, abbrs, segs:[[a, b, abbr]], tip }] (offsets inside the node)
  function wrapNode(rec, units, dark, hosts) {
    const node = rec.node;
    for (const u of units.slice().sort((a, b) => b.s - a.s)) {
      if (u.e < node.data.length) rec.created.add(node.splitText(u.e));
      let mid = node; if (u.s > 0) { mid = node.splitText(u.s); rec.created.add(mid); }
      const h = host(u.abbrs, u.tip, dark); mid.parentNode.insertBefore(h, mid); h.appendChild(mid); hosts.push(h);
      for (const [a, b, abbr] of u.segs.slice().sort((x, y) => y[0] - x[0])) {
        if (b < mid.data.length) rec.created.add(mid.splitText(b));
        let seg = mid; if (a > 0) { seg = mid.splitText(a); rec.created.add(seg); }
        underline(seg, abbr, dark);
      }
    }
  }
  function apply(block, collected, tags) {
    const { parts, text } = collected;
    const tokens = CORE.label(text, tags), starts = parts.map(p => p[1]);
    const nodeAt = pos => { let lo = 0, hi = parts.length - 1, f = -1; while (lo <= hi) { const m = (lo + hi) >> 1; if (starts[m] <= pos) { f = m; lo = m + 1; } else hi = m - 1; } return f; };
    const within = (s, e) => { const i = nodeAt(s); return i >= 0 && e <= starts[i] + parts[i][0].data.length ? i : -1; };
    const dark = lum(getComputedStyle(block).color) > 0.6, byNode = new Map();
    const tipOf = ts => CORE.tip(ts, meaning, meaningEn);
    const add = (ts, merged) => {
      const lab = ts.filter(x => x.pos); if (!lab.length) return;
      const s = ts[0].start, e = ts[ts.length - 1].end, i = within(s, e);
      if (i < 0) {   // crosses an element (a link, bold…): split the merged nouns into words / the group into tokens
        if (merged) { const one = g => add(g, g.length > 1 && g.length < ts.length && g[0].pos?.abbr === "N" && g.slice(1).every(x => x.upos === "PART" || !x.pos)); let g = []; ts.forEach((x, k) => { if (k && x.start !== ts[k - 1].end) { one(g); g = []; } g.push(x); }); one(g); }
        else if (ts.length > 1) ts.forEach(x => add([x], false));
        return;
      }
      const base = starts[i], nu = merged ? CORE.nounUnit(ts) : null;   // nouns: one N underline; a glued particle (City’s) keeps its own: "N · Part"
      const segs = nu ? [[0, ts[nu.nounEnd].end - s, "N"], ...nu.parts.map(x => [x.start - s, x.end - s, x.pos.abbr])] : lab.map(x => [x.start - s, x.end - s, x.pos.abbr]);
      if (!byNode.has(i)) byNode.set(i, []);
      byNode.get(i).push({ s:s - base, e:e - base, abbrs:nu ? nu.abbrs : lab.map(x => x.pos.abbr), segs, tip:tipOf(ts) });
    };
    CORE.units(text, tokens).forEach(u => add(u.tokens, u.merged));
    const rec = { nodes:[], hosts:[] };
    for (const [i, units] of byNode) { const r = { node:parts[i][0], created:new Set() }; wrapNode(r, units, dark, rec.hosts); rec.nodes.push(r); }
    rec.upos = [...new Set(tokens.filter(x => x.pos).map(x => x.upos))];
    if (rec.hosts.length) { tagged.set(block, rec); legendSync(); }
    return rec.hosts.length > 0;
  }
  const unwrap = el => { if (el.parentNode) el.replaceWith(...el.childNodes); };
  function untag(block) {
    const rec = tagged.get(block); if (!rec) return; tagged.delete(block); queueMicrotask(legendSync);
    rec.hosts.forEach(h => { h.querySelectorAll("lhn-wcu").forEach(unwrap); unwrap(h); });
    block.querySelectorAll?.("lhn-wcu, lhn-wc").forEach(unwrap);   // copies made by other scripts (e.g. a highlight wrapping a word)
    for (const { node, created } of rec.nodes) {
      if (!node.isConnected) continue;
      for (let n = node.nextSibling; n && n.nodeType === 3 && created.has(n); n = node.nextSibling) { node.appendData(n.data); n.remove(); }
    }
  }
  function clearAll() { [...tagged.keys()].forEach(untag); }
  const taggedNear = block => [...tagged.keys()].find(b => b === block || b.contains(block) || block.contains(b));

  // ---------- tag a block (queue: one block at a time, in the order they were asked for) ----------
  let queue = Promise.resolve(), workT = 0;
  function tagBlock(block, { quiet } = {}) {
    const job = queue.then(async () => {
      if (!block.isConnected || taggedNear(block) || !enabled()) return "skip";
      const collected = collect(block);
      if (!/[A-Za-z]{2}/.test(collected.text)) return "empty";
      if (!(await english(collected.text))) return "lang";
      clearTimeout(workT); workT = setTimeout(() => { if (!card?.classList.contains("on")) showCard(`<div class="row"><span class="tx">${esc(t("working"))}</span></div>`); }, 700);
      const r = await send("WORD_CLASS_TAG", { texts:[collected.text] });
      clearTimeout(workT); if (card?.textContent === t("working")) hideCard();
      if (r?.needDownload) return "model";
      if (!r?.ok || !Array.isArray(r.results?.[0])) { if (!quiet) notice(t("error")); return "error"; }
      if (!enabled() || taggedNear(block) || collect(block).text !== collected.text) return "skip";   // page changed meanwhile
      return apply(block, collected, r.results[0]) ? "ok" : "empty";
    });
    queue = job.catch(() => {});
    return job;
  }

  // ---------- page mode: paragraphs on screen, then the ones scrolled into view ----------
  let io = null, watched = new WeakSet(), scanT = 0;
  function onScreen(entries) {
    entries.forEach(e => { if (!e.isIntersecting || !pageMode) return; io.unobserve(e.target);
      tagBlock(e.target, { quiet:true }).then(r => { if (r === "lang" && !skippedNotice && pageMode) { skippedNotice = true; notice(t("skipped")); } }); });
  }
  function scan() { if (!pageMode || !io) return; paragraphBlocks().forEach(b => { if (!watched.has(b)) { watched.add(b); io.observe(b); } }); }
  const scanSoon = () => { if (!pageMode) return; clearTimeout(scanT); scanT = setTimeout(scan, 600); };
  addEventListener("scroll", scanSoon, { passive:true });
  async function setPage(on, { silent } = {}) {
    if (on === pageMode) return;
    if (on) {
      if (!enabled() || !(await ensureModel())) return;
      pageMode = true; skippedNotice = false; watched = new WeakSet(); legClosed = false;
      io = new IntersectionObserver(onScreen, { rootMargin:"200px 0px" }); scan();
      if (!silent) notice(t("on"));
    } else {
      pageMode = false; io?.disconnect(); io = null; legManual = false; clearAll();
      if (!silent) notice(t("off"), () => setPage(true, { silent:true }));
    }
    document.dispatchEvent(new CustomEvent("lhn-word-class-change", { detail:{ page:pageMode } }));
  }

  // ---------- one paragraph (☰ Loại từ đoạn / Alt+J) ----------
  async function toggleAt(x, y) {
    if (!enabled()) return;
    const block = globalThis.LHN_READER_BAR?.blockAt?.(x, y) || document.elementFromPoint(x, y)?.closest?.("p,li,h1,h2,h3,h4,h5,h6,blockquote,dd,dt,figcaption,td");
    if (!block || own(block)) return;
    const done = taggedNear(block);
    if (done) { untag(done); notice(t("paraOff"), () => { if (done.isConnected) tagBlock(done); }); return; }
    if (!(await ensureModel())) return;
    if (!tagged.size) legClosed = false;   // Word class turned on again (nothing labelled yet): the legend shows again
    const r = await tagBlock(block);
    if (r === "lang") notice(t("notEnglish")); else if (r === "empty") notice(t("none"));
  }

  // ---------- wiring ----------
  document.addEventListener("mousemove", e => { lastPointer = { x:e.clientX, y:e.clientY }; }, { passive:true, capture:true });
  document.addEventListener("lhn-word-class-command", e => {
    if (!enabled()) return;
    if (e.detail === "page") void setPage(!pageMode);
    else if (e.detail === "block" && lastPointer) void toggleAt(lastPointer.x, lastPointer.y);
  });
  document.addEventListener("lhn-website-disabled-change", e => { websiteDisabled = !!e.detail; if (websiteDisabled) { void setPage(false, { silent:true }); clearAll(); } });
  const sync = next => {
    settings = next || {}; websiteDisabled = Array.isArray(settings.disabledWebsites) && settings.disabledWebsites.includes(websiteKey());
    legendSync();
    if (!enabled()) { if (pageMode) void setPage(false, { silent:true }); clearAll(); }
  };
  globalThis.LHN_SETTINGS?.get?.().then(sync).catch(() => {});
  globalThis.LHN_SETTINGS?.subscribe?.(sync);

  globalThis.LHN_WORD_CLASS = Object.freeze({
    enabled, pageOn:() => pageMode,
    togglePage:() => setPage(!pageMode),
    toggleAt:(x, y) => toggleAt(x, y),
    legendShown:() => legendShown(), toggleLegend:() => toggleLegend()
  });
})();
