// Keepit offline page (v3.5.175, demo apk-home v12): a cute "no connection" page, style A (sleeping cloud) or B (plugs)
// picked at random once per page, both with a flip card that reviews the user's own saved words while waiting.
// Extension: shown over the page when a Keepit action needs the network (translate) and the device is offline; back online
// = "Connected!" then the waiting action runs. Keepit for Android: also the page shown when a web page fails to load.
// Reads saved words only while it is open (GET_ALL, local IndexedDB); sends nothing anywhere.
(() => {
  "use strict";
  if (globalThis.LHN_OFFLINE) return;
  // Shown only when the user has no saved words yet
  const STARTER = [
    { w:"curious", p:"/ˈkjʊəriəs/", m:["eager to know or learn", "tò mò, ham hiểu biết", "호기심이 많은"] },
    { w:"patient", p:"/ˈpeɪʃənt/", m:["able to wait calmly", "kiên nhẫn", "참을성 있는"] },
    { w:"resume", p:"/rɪˈzjuːm/", m:["to begin again after a pause", "tiếp tục lại", "다시 시작하다"] }
  ];
  const P = {
    wifioff:'<path d="M12 20h.01"/><path d="M8.5 16.43a5 5 0 0 1 7 0"/><path d="M5 12.86a10 10 0 0 1 5.17-2.69"/><path d="M19 12.86a10 10 0 0 0-2-1.41"/><path d="M2 8.82a15 15 0 0 1 4.18-2.65"/><path d="M22 8.82a15 15 0 0 0-11.29-3.76"/><path d="m2 2 20 20"/>',
    check:'<path d="m5 12 4 4L19 6"/>'
  };
  const UI = k => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${P[k] || ""}</svg>`;
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
  const CLOUD = `<svg class="cld" viewBox="0 0 200 140" aria-hidden="true"><defs><linearGradient id="ofcg" x1="30" y1="16" x2="170" y2="118" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#faf5ff"/><stop offset="1" stop-color="#c4b5fd"/></linearGradient></defs>
  <ellipse class="shd2" cx="100" cy="132" rx="54" ry="6"/>
  <g class="fl"><g fill="url(#ofcg)"><circle cx="66" cy="78" r="32"/><circle cx="104" cy="58" r="42"/><circle cx="142" cy="80" r="28"/><rect x="38" y="70" width="132" height="42" rx="21"/></g>
    <ellipse cx="82" cy="40" rx="13" ry="6.5" fill="#fff" opacity=".7" transform="rotate(-24 82 40)"/>
    <g class="sleep" fill="none" stroke="#4c1d95" stroke-width="3.4" stroke-linecap="round"><path d="M79 83q7 6 14 0"/><path d="M113 83q7 6 14 0"/><path d="M99 97q4 3 8 0"/></g>
    <g class="wake" fill="#4c1d95"><circle cx="86" cy="82" r="5"/><circle cx="120" cy="82" r="5"/><circle cx="88" cy="80" r="1.6" fill="#fff"/><circle cx="122" cy="80" r="1.6" fill="#fff"/><path d="M95 93q8 10 16 0z"/></g>
    <ellipse cx="72" cy="95" rx="7.5" ry="4.5" fill="#f9a8d4" opacity=".9"/><ellipse cx="134" cy="95" rx="7.5" ry="4.5" fill="#f9a8d4" opacity=".9"/></g></svg>`;
  const PLUGS = `<svg class="plg" viewBox="0 0 280 124" aria-hidden="true"><defs><linearGradient id="ofpg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8b5cf6"/><stop offset="1" stop-color="#6366f1"/></linearGradient></defs>
  <path class="heart" d="M150 30c-5-6-15-3-15 5 0 6 8 11 15 17 7-6 15-11 15-17 0-8-10-11-15-5z"/>
  <g class="pl"><path class="cab" d="M-12 84C18 84 30 66 60 66"/><rect class="prong" x="112" y="52" width="24" height="8" rx="4"/><rect class="prong" x="112" y="72" width="24" height="8" rx="4"/>
    <rect x="56" y="40" width="60" height="52" rx="17" fill="url(#ofpg)"/><ellipse cx="70" cy="49" rx="7" ry="3.5" fill="#fff" opacity=".35"/>
    <g class="sad"><circle cx="76" cy="62" r="4.2" fill="#fff"/><circle cx="96" cy="62" r="4.2" fill="#fff"/><path d="M80 78q6-5 12 0" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/><path d="M108 47q3 5 0 7q-3-2 0-7z" fill="#bae6fd"/></g>
    <g class="happy" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"><path d="M71 63q5-6 10 0"/><path d="M91 63q5-6 10 0"/><path d="M80 74q6 7 12 0"/></g>
    <ellipse cx="68" cy="74" rx="5" ry="3" fill="#f9a8d4" opacity=".8"/><ellipse cx="104" cy="74" rx="5" ry="3" fill="#f9a8d4" opacity=".8"/></g>
  <g class="spk"><path d="M148 52v-8"/><path d="M141 58l-6-5"/><path d="M155 58l6-5"/><path d="M141 74l-6 5"/><path d="M155 74l6 5"/></g>
  <g class="pr"><path class="cab" d="M222 64C252 64 262 84 294 84"/><rect class="sock" x="160" y="33" width="64" height="64" rx="19"/>
    <rect class="slot" x="166" y="52" width="13" height="8" rx="3"/><rect class="slot" x="166" y="72" width="13" height="8" rx="3"/>
    <g class="sad"><circle class="f2" cx="194" cy="59" r="4.2"/><circle class="f2" cx="212" cy="59" r="4.2"/><path class="f2s" d="M197 76q6-5 12 0"/></g>
    <g class="happy"><path class="f2s" d="M189 60q5-6 10 0"/><path class="f2s" d="M207 60q5-6 10 0"/><path class="f2s" d="M197 72q6 7 12 0"/></g>
    <ellipse cx="190" cy="70" rx="5" ry="3" fill="#f9a8d4" opacity=".8"/><ellipse cx="216" cy="70" rx="5" ry="3" fill="#f9a8d4" opacity=".8"/></g></svg>`;
  const CSS = `:host{all:initial}
${globalThis.LHN_THEME?.scrollbar || ""}
.of-root{position:fixed;inset:0;overflow-y:auto;overscroll-behavior:contain;background:var(--bg);color:var(--tx);font:15px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,"Noto Sans",sans-serif;-webkit-font-smoothing:antialiased;opacity:0;transition:opacity .2s;--bh:84px}
.of-root.on{opacity:1}
.of-root{--bg:#f6f7fb;--pn:#ffffff;--pn2:#eef0f4;--bd:rgba(15,23,42,.10);--tx:#111827;--mu:#52607a;--acc:#8b5cf6;--acct:#6d28d9;--tint:rgba(139,92,246,.11);--sh:0 10px 30px rgba(15,23,42,.12)}
.of-root.dark{--bg:#0e0e11;--pn:#18181b;--pn2:#232328;--bd:rgba(148,163,184,.17);--tx:#f4f4f5;--mu:#b4b4be;--acc:#8b5cf6;--acct:#c4b5fd;--tint:rgba(139,92,246,.16);--sh:0 10px 30px rgba(0,0,0,.45)}
*{box-sizing:border-box}
svg{display:block}
.dbtn{height:42px;padding:0 18px;border-radius:21px;border:0;background:transparent;color:var(--acct);font:inherit;font-weight:700;font-size:14.5px;cursor:pointer}
.dbtn.pri{background:linear-gradient(135deg,#4f46e5,#8b5cf6);color:#fff;box-shadow:0 4px 14px rgba(99,70,229,.35)}
.dbtn:active{transform:scale(.96)}
.osnack{position:fixed;left:50%;bottom:calc(var(--bh) + 14px);transform:translate(-50%,12px);opacity:0;transition:opacity .2s,transform .2s;padding:9px 16px;border-radius:999px;background:#18181b;color:#fff;font-size:13.5px;font-weight:600;pointer-events:none;white-space:nowrap}
.osnack.dark{background:#f4f4f5;color:#18181b}
.osnack.on{opacity:1;transform:translate(-50%,0)}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
.err{min-height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:30px 28px calc(var(--bh,80px) + 30px);box-sizing:border-box}
.err .eic{width:88px;height:88px;border-radius:28px;display:grid;place-items:center;background:var(--tint);color:var(--acct);margin-bottom:18px}
.err .eic svg{width:42px;height:42px}
.err h2{margin:0 0 6px;font-size:20px;letter-spacing:-.01em}
.err p{margin:0;color:var(--mu);font-size:14px;line-height:1.5;max-width:320px}
.err code{font-size:12px;color:var(--mu);opacity:.85;margin:8px 0 20px;font-family:ui-monospace,monospace}
.err .eb{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}
.err .dbtn{border:1px solid var(--bd)}
.err .dbtn.pri{border:0}
.err.shake .eic{animation:shk .42s}
@keyframes shk{20%,60%{transform:translateX(-7px)}40%,80%{transform:translateX(7px)}}
/* ===== v11: trang mất mạng — A Mây ngủ · B Phích cắm ===== */
.err.of{justify-content:center;padding-top:36px}
.err.of h2{margin:16px 0 6px;font-size:21px;font-weight:800}
.ourl{display:inline-flex;align-items:center;gap:6px;max-width:100%;margin:12px 0 18px;padding:6px 12px;border-radius:999px;background:var(--pn2);color:var(--mu);font-size:12px;font-family:ui-monospace,monospace;box-sizing:border-box}
.ourl svg{width:14px;height:14px;flex:none}
.ourl span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ofoot{margin-top:16px}
.olnk{border:0;background:none;color:var(--acct);font:inherit;font-size:13px;font-weight:700;cursor:pointer;padding:4px 2px}
/* A */
.oart{position:relative;width:200px;height:140px;flex:none}
.cld{display:block;width:200px;height:140px;overflow:visible;filter:drop-shadow(0 10px 22px rgba(139,92,246,.28))}
.ofa .fl{animation:ofFl 3.2s ease-in-out infinite}
@keyframes ofFl{50%{transform:translateY(-7px)}}
.ofa .shd2{fill:rgba(76,29,149,.16);transform-origin:100px 132px;animation:ofSh 3.2s ease-in-out infinite}
@keyframes ofSh{50%{transform:scaleX(.8);opacity:.55}}
.dark .ofa .shd2{fill:rgba(0,0,0,.5)}
.ofa .wake{opacity:0;transition:opacity .2s}.ofa .sleep{transition:opacity .2s}
.ofa.ok .wake{opacity:1}.ofa.ok .sleep,.ofa.ok .zz{opacity:0}
.ofa.ok .fl{animation:ofHop .6s cubic-bezier(.3,1.6,.5,1)}
@keyframes ofHop{40%{transform:translateY(-16px)}}
.zz{position:absolute;right:20px;top:-6px;width:44px;height:54px;pointer-events:none;transition:opacity .2s}
.zz i{position:absolute;left:0;bottom:0;font-style:normal;font-weight:800;color:var(--acct);opacity:0;animation:ofZ 3s ease-in infinite}
.zz i:nth-child(1){font-size:13px}.zz i:nth-child(2){font-size:16px;animation-delay:1s}.zz i:nth-child(3){font-size:20px;animation-delay:2s}
@keyframes ofZ{0%{opacity:0;transform:none}20%{opacity:1}100%{opacity:0;transform:translate(22px,-44px) rotate(14deg)}}
.obadge{position:absolute;right:28px;bottom:8px;width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:var(--pn);color:#f43f5e;box-shadow:0 4px 12px rgba(15,23,42,.2);border:2px solid var(--bg);box-sizing:border-box}
.obadge svg{width:17px;height:17px}
.ofa.ok .obadge{background:#22c55e;color:#fff;animation:ofPop .45s}
.ofa.shake .oart{animation:ofWob .55s}
@keyframes ofWob{20%{transform:rotate(-7deg)}40%{transform:rotate(6deg)}60%{transform:rotate(-3deg)}80%{transform:rotate(2deg)}}
@keyframes ofPop{0%{transform:scale(.4)}70%{transform:scale(1.18)}100%{transform:none}}
#ofw{width:min(300px,100%)}
.ocard{display:block;width:100%;height:118px;margin:22px 0 0;padding:0;border:0;background:none;perspective:900px;cursor:pointer;font:inherit;color:inherit;-webkit-tap-highlight-color:transparent}
.ocard .in{position:relative;display:block;width:100%;height:100%;transition:transform .55s cubic-bezier(.3,1.3,.5,1);transform-style:preserve-3d}
.ocard.flip .in{transform:rotateY(180deg)}
.ocard .f,.ocard .bk{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;border-radius:22px;backface-visibility:hidden;-webkit-backface-visibility:hidden;border:1px solid var(--bd);background:var(--pn);box-shadow:var(--sh)}
.ocard .bk{transform:rotateY(180deg);background:linear-gradient(135deg,#4f46e5,#8b5cf6);color:#fff;border:0}
.ocard small{font-size:10.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--acct)}
.ocard .bk small{color:rgba(255,255,255,.82);text-transform:none;letter-spacing:0;font-size:13px}
.ocard b{font-size:25px;font-weight:800;letter-spacing:-.01em}
.ocard .bk b{font-size:19px;padding:0 16px;line-height:1.3}
.ocard em{font-style:normal;font-size:13px;color:var(--mu)}
.ocard i{font-style:normal;font-size:11.5px;color:var(--mu);margin-top:5px;opacity:.85}
.ocn{display:flex;align-items:center;justify-content:space-between;margin-top:8px}
.odots{display:flex;gap:5px}.odots i{width:6px;height:6px;border-radius:3px;background:var(--bd);transition:width .2s}.odots i.on{width:16px;background:var(--acc)}
/* B */
.ofb{--sock:#ede9fe;--sockb:#c4b5fd;--face2:#4c1d95;--prong:#cbd5e1;--cab:#c4b5fd}
.dark .ofb{--sock:#2a2540;--sockb:#6d5bd0;--face2:#e9d5ff;--prong:#a1a1aa;--cab:#4c3d86}
.plg{display:block;width:280px;height:124px;max-width:100%;overflow:visible}
.plg .cab{fill:none;stroke:var(--cab);stroke-width:7;stroke-linecap:round}
.plg .prong{fill:var(--prong)}
.plg .sock{fill:var(--sock);stroke:var(--sockb);stroke-width:2.5}
.plg .slot{fill:var(--face2);opacity:.7}
.plg .f2{fill:var(--face2)}.plg .f2s{fill:none;stroke:var(--face2);stroke-width:3;stroke-linecap:round}
.plg .pl,.plg .pr{transform-box:fill-box;transform-origin:center;transition:transform .4s cubic-bezier(.3,1.5,.5,1)}
.ofb .pl{animation:plA 2.6s ease-in-out infinite}.ofb .pr{animation:prA 2.6s ease-in-out infinite}
@keyframes plA{50%{transform:translateX(7px)}}@keyframes prA{50%{transform:translateX(-7px)}}
.ofb.shake .pl{animation:plT .8s ease-in-out}.ofb.shake .pr{animation:prT .8s ease-in-out}
@keyframes plT{35%{transform:translateX(15px)}55%{transform:translateX(15px) rotate(-5deg)}80%{transform:translateX(-4px)}}
@keyframes prT{35%{transform:translateX(-13px)}55%{transform:translateX(-13px) rotate(5deg)}80%{transform:translateX(4px)}}
.ofb.ok .pl{animation:none;transform:translateX(22px)}.ofb.ok .pr{animation:none;transform:translateX(-14px)}
.plg .spk{stroke:#facc15;stroke-width:3;stroke-linecap:round;fill:none;animation:spk 1.2s steps(2) infinite}
@keyframes spk{50%{opacity:.15}}
.ofb.ok .spk{display:none}
.plg .happy{opacity:0}.ofb.ok .happy{opacity:1}.ofb.ok .sad{opacity:0}
.plg .heart{fill:#f43f5e;opacity:0;transform-box:fill-box;transform-origin:center;transform:scale(.3)}
.ofb.ok .heart{animation:ofHeart .7s .3s forwards}
@keyframes ofHeart{0%{opacity:0;transform:scale(.3)}60%{opacity:1;transform:translateY(-6px) scale(1.25)}100%{opacity:1;transform:translateY(-8px) scale(1)}}
.oauto{display:inline-flex;align-items:center;gap:8px;margin:2px 0 16px;padding:6px 13px 6px 8px;border-radius:999px;background:var(--tint);color:var(--acct);font-size:12.5px;font-weight:700}
.oauto svg{width:18px;height:18px;transform:rotate(-90deg);flex:none}
.oauto .t{fill:none;stroke:currentColor;opacity:.22;stroke-width:3}
.oauto .a{fill:none;stroke:currentColor;stroke-width:3;stroke-linecap:round;stroke-dasharray:100;stroke-dashoffset:0}
.ofb.ok .oauto{background:rgba(34,197,94,.16);color:#16a34a}`;

  let host = null, root = null, st = null, ringT = 0, snackT = 0;
  const variants = new Map();                 // page key → "a" | "b" (random once per page)
  const li = () => { const l = String(st?.lang || globalThis.LHN_UI_LANG || navigator.language || "en").toLowerCase(); return l.startsWith("vi") ? 1 : l.startsWith("ko") ? 2 : 0; };
  // Labels: keys off_<name> in js/core/languages.js (en/vi/ko).
  const t = (k, n) => { const M = globalThis.LHN_LANGUAGES?.MESSAGES || {}, key = "off_" + k; return String(M[["en", "vi", "ko"][li()]]?.[key] ?? M.en?.[key] ?? k).replace("{0}", n); };
  const $ = id => root?.getElementById(id);
  const ofv = () => { const k = st.key; if (!variants.has(k)) variants.set(k, Math.random() < .5 ? "a" : "b"); return variants.get(k); };
  const isWord = s => /^[a-z][a-z'’-]*$/i.test(String(s || "").trim());

  async function loadWords() {
    try {
      const send = globalThis.LHN_MESSAGING?.sendMessage || (m => (globalThis.browser || globalThis.chrome).runtime.sendMessage(m));
      const all = await send({ type:"GET_ALL" });
      const list = (Array.isArray(all) ? all : Array.isArray(all?.items) ? all.items : []).filter(n => n && (n.dictionaryOnly || isWord(n.quote)) && String(n.note || "").trim());
      const seen = new Set(), words = [];
      for (const n of list.sort(() => Math.random() - .5)) {
        const w = String(n.quote).trim(), k = w.toLowerCase(); if (seen.has(k)) continue; seen.add(k);
        words.push({ w, p:String(n.phonetic || n.ipa || ""), m:[String(n.note).trim()] });
        if (words.length >= 5) break;
      }
      return words;
    } catch { return []; }
  }
  const cardHTML = () => {
    const w = st.words[st.i], mean = w.m[li()] || w.m[0];
    return `<button class="ocard" type="button" data-act="flip"><span class="in"><span class="f"><small>${esc(t("ofaCard"))}</small><b>${esc(w.w)}</b>${w.p ? `<em>${esc(w.p)}</em>` : ""}<i>${esc(t("flipHint"))}</i></span><span class="bk"><small>${esc(w.w)}</small><b>${esc(mean)}</b></span></span></button>
    <div class="ocn"><span class="odots">${st.words.map((_, i) => `<i class="${i === st.i ? "on" : ""}"></i>`).join("")}</span>${st.words.length > 1 ? `<button type="button" class="olnk" data-act="next">${esc(t("nextW"))} ›</button>` : ""}</div>`;
  };
  function pageHTML() {
    const url = st.url ? `<div class="ourl">${UI("wifioff")}<span>${esc(st.url.replace(/^https?:\/\//i, ""))}</span></div>` : "";
    const btns = `<div class="eb"><button class="dbtn pri" type="button" data-act="retry">${esc(t("retry"))}</button><button class="dbtn" type="button" data-act="${st.onHome ? "home" : "close"}">${esc(t(st.onHome ? "goHome" : "close"))}</button></div>`;
    const foot = st.onNotes ? `<div class="ofoot"><button type="button" class="olnk" data-act="notes">${esc(t("offNotes"))} ›</button></div>` : "";
    if (ofv() === "b") return `<div class="err of ofb" id="err">${PLUGS}<h2>${esc(t("ofbT"))}</h2><p>${esc(t("ofbP"))}</p>${url}
      <div class="oauto"><svg viewBox="0 0 24 24"><circle class="t" cx="12" cy="12" r="9"/><circle class="a" id="ofring" cx="12" cy="12" r="9" pathLength="100"/></svg><span id="ofn">${esc(t("autoIn", 8))}</span></div>${btns}<div id="ofw">${cardHTML()}</div>${foot}</div>`;
    return `<div class="err of ofa" id="err"><div class="oart">${CLOUD}<span class="zz"><i>z</i><i>z</i><i>Z</i></span><span class="obadge">${UI("wifioff")}</span></div>
      <h2>${esc(t("ofaT"))}</h2><p>${esc(t(st.url ? "ofaP" : "ofaPx"))}</p>${url}${btns}<div id="ofw">${cardHTML()}</div>${foot}</div>`;
  }
  function shake() { const e = $("err"); if (!e) return; e.classList.remove("shake"); void e.offsetWidth; e.classList.add("shake"); }
  function snack(text) {
    const s = $("osnack"); if (!s) return; s.textContent = text; s.classList.add("on");
    clearTimeout(snackT); snackT = setTimeout(() => s.classList.remove("on"), 1800);
  }
  const online = () => navigator.onLine !== false;
  function auto(n0 = 8) {
    clearInterval(ringT); if (!st || ofv() !== "b") return; let n = n0;
    const lab = () => $("ofn");
    const restart = () => { const r = $("ofring"); if (!r) return; r.style.animation = "none"; void r.getBoundingClientRect(); r.style.animation = `ofRing ${n0}s linear forwards`; };
    const show = () => { const l = lab(); if (l) l.textContent = t("autoIn", n); };
    restart(); show();
    ringT = setInterval(() => {
      if (!lab() || !st || st.ok) { clearInterval(ringT); return; }
      if (--n > 0) return show();
      lab().textContent = t("trying"); shake(); n = n0 + 1;
      setTimeout(() => { if (!st || st.ok || !lab()) return; if (online()) return reconnect(); n = n0; restart(); show(); }, 900);
    }, 1000);
  }
  function reconnect() {
    if (!st || st.ok) return; st.ok = true; clearInterval(ringT);
    const e = $("err"); if (!e) return finish();
    e.classList.remove("shake"); e.classList.add("ok");
    e.querySelector("h2").textContent = t(ofv() === "b" ? "plugged" : "awakeA");
    const l = $("ofn"); if (l) l.textContent = t("plugged");
    const r = $("ofring"); if (r) { r.style.animation = "none"; r.style.strokeDashoffset = "0"; }
    const b = e.querySelector(".obadge"); if (b) b.innerHTML = UI("check");
    setTimeout(finish, 1300);
  }
  function finish() { const s = st; hide(); try { s?.onBack?.(); } catch (error) { console.warn("Keepit offline", error); } }
  function onClick(e) {
    const a = e.target.closest?.("[data-act]"); if (!a || !st) return;
    const act = a.dataset.act;
    if (act === "flip") a.classList.toggle("flip");
    else if (act === "next") { st.i = (st.i + 1) % st.words.length; const w = $("ofw"); if (w) w.innerHTML = cardHTML(); }
    else if (act === "retry") { if (online()) reconnect(); else { shake(); snack(t("stillOff")); auto(); } }
    else if (act === "home") { const f = st.onHome; hide(); f?.(); }
    else if (act === "close") { const f = st.onClose; hide(); f?.(); }
    else if (act === "notes") st.onNotes?.();
  }
  const onOnline = () => { if (st && !st.ok) reconnect(); };

  // opts: { key?, url?, lang?, dark?, onBack (back online / Retry), onHome?, onClose?, onNotes? }
  async function show(opts = {}) {
    const fresh = !st;
    st = { key:String(opts.key || location.href), url:String(opts.url || ""), lang:opts.lang, onBack:opts.onBack, onHome:opts.onHome, onClose:opts.onClose, onNotes:opts.onNotes, words:STARTER.map(w => ({ ...w })), i:0, ok:false };
    if (!host) {
      host = document.createElement("div");
      host.setAttribute("style", "all:initial;position:fixed;inset:0;z-index:2147482999;");
      root = host.attachShadow({ mode:"closed" });
      root.innerHTML = `<style>${CSS}</style><div class="of-root" id="ofroot"></div><div class="osnack" id="osnack"></div>`;
      root.addEventListener("click", onClick);
      addEventListener("online", onOnline);
    }
    if (!host.isConnected) (document.documentElement || document.body).appendChild(host);
    $("ofroot").classList.toggle("dark", !!opts.dark);
    $("osnack").classList.toggle("dark", !!opts.dark);
    $("ofroot").innerHTML = pageHTML(); $("ofroot").scrollTop = 0;
    if (fresh) requestAnimationFrame(() => $("ofroot")?.classList.add("on")); else $("ofroot").classList.add("on");
    auto();
    const words = await loadWords();
    if (st && words.length) { st.words = words; st.i = 0; const w = $("ofw"); if (w) w.innerHTML = cardHTML(); }
  }
  function hide() {
    clearInterval(ringT); st = null;
    if (host) { host.remove(); const r = $("ofroot"); if (r) { r.classList.remove("on"); r.innerHTML = ""; } }
  }
  const setDark = on => { $("ofroot")?.classList.toggle("dark", !!on); };
  globalThis.LHN_OFFLINE = Object.freeze({ show, hide, setDark, isOpen:() => !!st });
})();
