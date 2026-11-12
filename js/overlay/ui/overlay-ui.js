// Keepit unified overlay (docs/ui-layout.md) — the approved demo v18 UI on the real overlay engines.
// Markup + behaviour; styles are UNIFIED_OVERLAY_CSS (overlay-css.js); labels are keys ov_* in js/core/languages.js, read with T().
// overlay-controller.js mounts it inside the overlay shadow root and keeps every engine (captions, translation,
// study records, favourites, export) — this file only draws the UI and calls those engines through LHN_UNIFIED_BRIDGE.
const UNIFIED_OVERLAY_HTML = `
<div class="ov dark" id="ov" hidden data-tab="view" data-view="normal" data-cc="bi" data-input="touch">
  <svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><linearGradient id="gheart" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff6b95"/><stop offset="1" stop-color="#ff2d55"/></linearGradient></defs></svg>
  <div class="amb" id="amb" aria-hidden="true"><canvas width="32" height="18"></canvas></div>
  <header class="hd">
    <div class="brand"><span class="logo" id="logo"></span><span class="bname">Keepit</span><span class="bsrc" id="bsrc" translate="no"></span></div>
    <div class="tabs" role="tablist" id="tabs"><span class="tab-ind" id="tabInd"></span></div>
    <div class="hd-act"><button class="ib" id="btnSize"></button><button class="ib" id="btnClose"></button></div>
  </header>
  <main class="bd" id="bd">
    <div class="colrail l" id="railL"></div>
    <div class="csplit" id="csL" data-c="l"></div>
    <section class="stage" id="stage">
      <div class="player" id="player">
        <div class="vid" id="vid"></div>
        <div class="wave" id="wave"></div>
        <div class="vplay" id="vplay"></div>
        <div class="ttring" id="ttring" role="status"><b></b><div class="ttring-c"><svg viewBox="0 0 84 84" aria-hidden="true"><circle class="trk" cx="42" cy="42" r="36"/><circle class="arc" cx="42" cy="42" r="36"/></svg><span class="ttring-ic"></span></div></div>
        <div class="ttseek" id="ttseek" role="status"><div><b></b><i></i></div><small translate="no"></small></div>
        <div class="tthint" id="tthint"></div>
        <div class="vcorner" id="vcorner"><button class="vc favb" data-act="fav"></button><button class="vc" data-act="theater"></button></div>
        <div class="tsub bg-soft" id="tsub" translate="no"><div class="a" data-lhn-primary></div><div class="b" data-lhn-secondary></div></div>
        <div class="cinfo"><div class="ct"><b id="cTitle" translate="no"></b><small id="cSrc" translate="no"></small></div><div class="spec"><i></i><i></i><i></i><i></i></div><button class="cplay" id="cplay"></button></div>
      </div>
      <div class="subbox" id="subbox" translate="no">
        <div class="sub-en" data-lhn-primary></div><div class="sub-vi" data-lhn-secondary></div>
        <button class="sgrip" id="grip"></button>
      </div>
      <div class="study" id="study"></div>
    </section>
    <div class="split" id="split"></div>
    <aside class="side" id="side">
      <div class="side-hd" id="sideHd"></div>
      <div class="list" id="list"></div>
    </aside>
    <div class="csplit" id="csR" data-c="r"></div>
    <aside class="notes" id="notesCol"></aside>
    <div class="colrail r" id="railR"></div>
  </main>
  <footer class="dock" id="dock">
    <div class="prog" id="prog"><div class="tr"><div class="fl" id="pfill"></div></div><div id="pmarks"></div><div class="kn" id="pknob"></div><div class="ptip" id="ptip"></div></div>
    <div class="drow" id="drow"><div class="zl" id="zl"></div><div class="zc" id="zc"></div><div class="zr" id="zr"></div></div>
  </footer>
  <div class="layer" id="layer"></div>
  <div class="toast" id="toast"></div>
</div>
<div class="kpscrim" id="kpscrim" hidden></div><slot name="kpside"></slot>
`;

// Engines live in the other overlay scripts (classic content scripts share one global scope). Resolved on call,
// so the load order only needs this file before overlay-controller.js.
const LHN_UNIFIED_BRIDGE = Object.freeze({
  state: () => state,
  settings: () => settings,
  pending: () => PENDING,
  studyCues: () => { try { return getStudyCues(); } catch (_) { return []; } },
  play: () => { const v = state.activeMedia; if (v && v.paused) togglePlay(); },
  pause: () => { const v = state.activeMedia; if (v && !v.paused) togglePlay(); },
  setSpeed: (value) => setMediaSpeed(value),
  saveSettings: () => saveSettings(),
  setAmbientMode: (mode) => setAmbientMode(mode),
  rebuildCaptions: () => rebuildCaptions(),
  getCc: () => { const root = overlayEl(); return ['bilingual', 'primary', 'translation', 'hidden'].find((m) => root?.classList.contains(`te-subtitle-mode-${m}`)) || ''; },
  setCc: (mode) => setSubtitleDisplayModeByUser(mode),
  translate: (text) => translateOne(text),
  t: (key, vars = {}) => overlayT(key, vars),
  meta: () => { try { return touchVideoMeta(); } catch (_) { return {}; } },
  loadFavorite: async () => { await loadTouchFavorites(); const id = touchFavoriteKey(); return Boolean(id && touchFavoriteIds.has(id)); },
  setFavorite: (on) => setTouchFavorite(on).catch(() => false),
  popupOpen: () => Boolean(document.querySelector(APP_POPUP_SELECTOR)),
  setActivity: (activity) => { try { setOverlayStudyActivity(activity); } catch (_) {} },
  exportAs: (format, opts) => exportAs(format, opts),
  openNotes: () => document.dispatchEvent(new CustomEvent('lhn-toggle-notes-sidebar')), // the page notes sheet / panel (content.js), same as the Keepit bar
  setLanguage: (kind, code) => saveSubtitleLanguage(kind === 'source' ? 'sourceLanguage' : 'targetLanguage', code),
  close: () => closeOverlay(),
});

// Labels: keys ov_<name> in js/core/languages.js (en/vi/ko). Language = the overlay's display language; anything
// other than en/ko shows Vietnamese, as before. VI() = the Vietnamese text in every language: only for the few spots
// that were never translated (kept unchanged on purpose; switch VI → T to translate them).
const ovLabelLang = () => { let l = ''; try { l = LHN_UNIFIED_BRIDGE.state()?.displayLanguage || globalThis.LHN_LANGUAGES?.detectLanguage?.() || ''; } catch (_) {} return l === 'en' || l === 'ko' ? l : 'vi'; };
const ovLabel = (lang, key, args) => { const M = globalThis.LHN_LANGUAGES?.MESSAGES || {}; let s = String(M[lang]?.['ov_' + key] ?? M.vi?.['ov_' + key] ?? key); args.forEach((a, i) => { s = s.split(`{${i}}`).join(String(a)); }); return s; };
const T = (key, ...args) => ovLabel(ovLabelLang(), key, args);
const VI = (key, ...args) => ovLabel('vi', key, args);

globalThis.LHN_UNIFIED_OVERLAY = (() => {
  'use strict';
  let api = null;
  function mount(root) {
    if (api) return api;
    const R = root;
    const B = LHN_UNIFIED_BRIDGE;
    const $ = (s, r = R) => r.querySelector(s);
    const $$ = (s, r = R) => [...r.querySelectorAll(s)];
    const HEART = 'M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.5 5.5 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5Z';
    const P = {
      play: '<path d="M8 5.5v13l10.5-6.5z" fill="currentColor" stroke="none"/>',
      pause: '<rect x="6" y="5" width="4" height="14" rx="1.2" fill="currentColor" stroke="none"/><rect x="14" y="5" width="4" height="14" rx="1.2" fill="currentColor" stroke="none"/>',
      prev: '<path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" fill="currentColor" stroke="none"/>',
      next: '<path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" fill="currentColor" stroke="none"/>',
      repeat1: '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/><path d="M11 10h1v4"/>',
      heart: `<path d="${HEART}"/>`,
      notes: '<path d="M2 6h4M2 10h4M2 14h4M2 18h4"/><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9.5 8h5M9.5 12H16M9.5 16H14"/>',
      vol: '<path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/>',
      mute: '<path d="M11 5 6 9H3v6h3l5 4z"/><path d="m22 9-6 6M16 9l6 6"/>',
      speed: '<circle cx="12" cy="12" r="9.5"/><path d="M12 7v5l3.5 2"/>',
      cc: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M10 9.6a2.6 2.6 0 1 0 0 4.8M16.5 9.6a2.6 2.6 0 1 0 0 4.8"/>',
      theater: '<rect x="3" y="5" width="18" height="12" rx="1.5"/><path d="M3 20h18"/>',
      reading: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
      normal: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M14 4v16"/>',
      fs: '<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>',
      fsx: '<path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>',
      set: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
      more: '<path d="M4 6h16M4 12h16M4 18h16"/>',
      close: '<path d="M5.5 5.5l13 13M18.5 5.5l-13 13"/>',
      pin: '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
      enlarge: '<path d="M14 5h5v5M10 19H5v-5M19 5l-5.5 5.5M5 19l5.5-5.5"/>',
      shrink: '<path d="M5 14h5v5M19 10h-5V5M14 10l5-5M5 19l5-5"/>',
      chevron: '<path d="m6 9 6 6 6-6"/>',
      check: '<path d="m5 12 4.5 4.5L19 7"/>',
      back: '<path d="m15 18-6-6 6-6"/>',
      chevR: '<path d="m9 18 6-6-6-6"/>',
      mic: '<path d="M12 19v3"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><rect x="9" y="2" width="6" height="13" rx="3"/>',
      pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
      watch: '<rect x="2.5" y="5" width="19" height="14" rx="3"/><path d="m10 9 5 3-5 3z"/>',
      moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
      sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
      subOptions: '<path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/>',
      subLanguage: '<path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/>',
      art: '<path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/><path d="M20 2v4"/><path d="M22 4h-4"/><circle cx="4" cy="20" r="2"/>',
      lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
      alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4M12 17h.01"/>',
      list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
      sparkles: '<path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4z"/><path d="M19 15v4M17 17h4"/>',
      bulb: '<path d="M9 18h6M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2z"/>',
      replay: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
      ear: '<path d="M6 8.5a6 6 0 1 1 12 0c0 6-6 6-6 10a3 3 0 0 1-6 0"/><path d="M10 9a2 2 0 1 1 4 0c0 2-2 2-2 4"/>',
      export: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>',
      panel: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/>',
      panelR: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M15 3v18"/>',
      trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
      globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
      logo: '<path d="M4 20 14.5 9.5M9 4l11 11M15 3l6 6-9.5 9.5L5.5 12.5z" stroke="#fff"/>',
      arrowR: '<path d="M5 12h14M13 6l6 6-6 6"/>',
      eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    };
    const ic = (n, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${P[n]}</svg>`;
    const YT = '<svg class="yt" viewBox="0 0 28 20"><rect width="28" height="20" rx="5" fill="#ff0033"/><path d="M11 6v8l7-4z" fill="#fff"/></svg>';

    // ---------- content: real captions (Xem) and study sentences (Nói · Chép) from the overlay engines ----------
    const EMPTY = [{ en: '', vi: '', start: 0, end: 1, empty: true }];
    let CAPS = EMPTY, STUDY = [], SENT = EMPTY, DUR = 1;
    const capText = (v) => (v == null || v === B.pending() ? '…' : String(v));
    function loadCaps() {
      const list = B.state()?.captions || [];
      CAPS = list.length ? list.map((c) => { const st = +c.start || 0; return { en: capText(c.mainText ?? c.en), vi: capText(c.vi), start: st, end: +c.end > st ? +c.end : st + 2, ref: c }; }) : EMPTY;
    }
    function loadStudy() {
      const prev = STUDY;
      STUDY = B.studyCues().map((c, i) => { const st = +c.start || 0; return { en: c.en, vi: prev[i] && prev[i].en === c.en ? prev[i].vi : '', start: st, end: +c.end > st ? +c.end : st + 2 }; });
    }
    function useSent() {
      SENT = isStudy() ? (STUDY.length ? STUDY : EMPTY) : CAPS;
      const d = Number(media()?.duration);
      DUR = Number.isFinite(d) && d > 0 ? d : Math.max(1, SENT[SENT.length - 1].end);
    }
    // "Đã luyện" mark in the Xem list: a caption counts when a solved study sentence starts inside it
    function practiced(i) {
      const c = CAPS[i]; if (!c || !STUDY.length) return false;
      for (const tab of ['speak', 'write']) for (const k of Object.keys(S.res[tab])) { const s = STUDY[k]; if (s && s.start >= c.start - 0.05 && s.start < c.end) return true; }
      return false;
    }
    const stTime = (i) => (STUDY[i] || SENT[i] || EMPTY[0]).start;
    const fmt = (t) => { t = Math.max(0, Math.floor(t)); const p = (n) => String(n).padStart(2, '0'), h = Math.floor(t / 3600); return h ? `${h}:${p(Math.floor(t % 3600 / 60))}:${p(t % 60)}` : `${p(Math.floor(t / 60))}:${p(t % 60)}`; };
    const idxAt = (t) => { let lo = 0, hi = SENT.length - 1, r = 0; while (lo <= hi) { const m = (lo + hi) >> 1; if (t >= SENT[m].start - 0.12) { r = m; lo = m + 1; } else hi = m - 1; } return r; };
    const words = (s) => String(s || '').split(/\s+/).filter(Boolean);
    const norm = (w) => String(w || '').toLowerCase().replace(/[’‘`´]/g, "'").replace(/[^\p{L}\p{N}']/gu, '');
    // ---- wrong-word stats: the app's own records (learning-rules.js, stats v3) shown in the demo row shape
    const STATS = { write: { version: 3, words: {} }, speak: { version: 3, words: {} } };
    function wrongMap(mode) {
      const out = {};
      for (const [key, it] of Object.entries(STATS[mode]?.words || {})) {
        if (!it || !(it.errors > 0)) continue;
        const word = String(it.word || key.slice(2));
        const v = Object.values(it.variants || {}).filter((x) => x && x.count > 0).map((x) => { const tc = x.typeCounts || {}; const ty = ['phonetic', 'rule', 'typo'].sort((a, b) => (tc[b] || 0) - (tc[a] || 0))[0]; return { t: String(x.text || ''), n: x.count, ty }; });
        const streak = Math.max(0, ...Object.values(it.occurrences || {}).map((o) => (o && o.pending ? o.wrongStreak || 0 : 0)));
        out[word.toLowerCase()] = { word, err: it.errors, fix: it.corrections || 0, last: it.lastResult === 'wrong' ? 'wrong' : 'fixed', streak, at: it.lastAt || 0, v, lastTy: it.lastErrorType || 'rule' };
      }
      return out;
    }
    function syncWrong() { S.wrong.write = wrongMap('write'); S.wrong.speak = wrongMap('speak'); }
    function recordWrong(mode, cue, result, ref) {
      const rules = globalThis.LHN_STUDY_RULES;
      if (!rules?.recordWrongWordSubmission) return false;
      if (STATS[mode]?.version !== rules.STATS_VERSION) STATS[mode] = { version: rules.STATS_VERSION, words: {} };
      const changed = rules.recordWrongWordSubmission(STATS[mode], cue, result, ref);
      if (changed) syncWrong();
      return changed;
    }
    // ---------- state ----------
    const SUB_SZ = [0.86, 1, 1.18]; // subtitle size steps: Nhỏ · Trung bình · Lớn
    const S = {
      realFs: false,
      w: innerWidth, h: innerHeight, input: 'mouse', theme: 'dark', scale: 1,
      tab: 'view',
      view: { c: 'normal', e: 'normal', s: 'theater' }, mini: { c: true, e: false }, subHidden: { c: false, e: false, s: false }, tabLand: null, word: null,
      split: 60, colW: { l: 290, r: 300 }, bri: 0, rot: null, ttHint: false,
      t: 0, playing: false, speed: 1, vol: 100, muted: false, cc: 'bi',
      rep: { on: false, n: 3, left: 3, last: -1 }, fav: false, fs: false,
      si: { speak: 0, write: 0 }, reach: { speak: 0, write: 0 }, res: { speak: {}, write: {} },
      weak: new Set(), showTr: true, auto: true, hints: true, showVideo: false,
      wrong: { write: {}, speak: {} }, wFilter: 'all', wSearch: '', vOpen: new Set(),
      lessonNote: '',
      tnotes: [],
      colList: true, colNotes: true, ambient: true, autoHideDock: false,
      tapTranslate: true, speakOnTranslate: true, merge: true,
      sp: { phase: 'idle', heard: [], score: 0, attempt: 0 }, wr: { phase: 'idle', val: '', acc: 0, ops: null },
      kb: false, chromeOff: false, sess: Date.now(), srcLang: 'auto', dstLang: 'auto',
      subTab: 'video', subStyle: { video: { size: 1, en: 'def', vi: 'def', bold: true, font: 'def', bg: 'soft' }, side: { size: 1, en: 'def', vi: 'def', bold: false, font: 'def', bg: 'none' } },
      exp: { fmt: 'srt', bi: true, time: true },
    };
    const ov = $('#ov');
    // docs/ui-layout.md — layout = orientation only: portrait → phone UI (c), landscape → computer UI (e);
    // phone landscape (landscape and height < 500) = Theater only (s). Touch/mouse never changes the layout.
    const isLand = () => S.w >= S.h;
    const sizeKey = () => (isLand() ? (S.h < 500 ? 's' : 'e') : 'c');
    const wClass = () => (isLand() ? 'e' : 'c');
    const curView = () => (sizeKey() === 's' ? 'theater' : S.view[sizeKey()]);
    // side columns of the study layout collapse by themselves when there is no room (stage keeps ≥ 440px)
    const roomList = () => S.w >= 730;
    const listOn = () => S.colList && roomList();
    const roomNotes = () => S.w >= (listOn() ? 1030 : 740);
    const notesOn = () => S.colNotes && roomNotes();
    const isStudy = () => S.tab !== 'view';
    const sheetMode = () => wClass() === 'c';
    const vib = (p) => { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} };

    // ---------- static pieces ----------
    $('#logo').innerHTML = '<svg viewBox="0 0 32 32" aria-hidden="true"><g transform="translate(32 0) scale(-1 1)"><g transform="translate(-4.187 -2.393) scale(0.299065)"><path fill="#fff" stroke="none" d="M 35 32 C 34 32 33.5 34 33.2 37 C 31.3 51 34.3 65 42 74 C 48.5 81.5 57 84.6 67 84.5 C 77.5 84.4 84.2 80.3 89.7 73.4 C 92.5 77.3 94.3 81.5 95.4 86.8 C 95.9 89.6 97.8 90.9 99.9 90.2 C 102.1 89.5 102.9 87.5 101.8 84.7 C 98.6 75.9 93.3 69.4 85.4 65.1 C 79.7 62 72.9 61.1 66.1 59.6 C 58.9 58 53.1 54.9 51.6 49.4 C 55.3 52.8 60.2 54.8 67.5 55.8 C 78.7 57.3 87.7 58.3 94.7 65 C 97.3 54.1 92 44.5 82.5 39.9 C 75.4 36.4 68 36.8 59.7 37.6 C 48.6 38.8 41.9 38.6 36.5 32.8 C 36 32.3 35.5 32 35 32 Z"/></g></g></svg>'; // icon-v5, same mark as assets/icons/icon.svg
    $('#btnClose').innerHTML = ic('close');
    $('#vplay').innerHTML = ic('play');
    $('#wave').innerHTML = Array.from({ length: 46 }, (_, i) => `<i style="animation-delay:${(i * 37 % 100) / 100}s"></i>`).join('');
    $$('#vcorner [data-act=fav]').forEach((b) => (b.innerHTML = ic('heart'))); $('#vcorner [data-act=theater]').innerHTML = ic('fs');
    const TABS = [['view', 'watch', 'watch'], ['speak', 'speak', 'mic'], ['write', 'write', 'pen']]; // [tab, label key, icon]
    $('#tabs').insertAdjacentHTML('beforeend', TABS.map(([id, l, i]) => `<button role="tab" data-tab="${id}" aria-selected="false">${ic(i)}<span>${T(l)}</span></button>`).join(''));
    $('#railL').innerHTML = `<button class="ib" data-act="colList">${ic('panel')}</button>`;
    $('#railR').innerHTML = `<button class="ib" data-act="colNotes">${ic('panelR')}</button>`;

    // dock items: zone l/c/r, priority (lower hides first), tabs; label / tip are label keys
    const DOCK = [
      { id: 'title', z: 'l', p: 1, html: `<div class="dtitle" data-id="title">${YT}<span></span></div>` },
      { id: 'fav', z: 'l', p: 6, label: 'favorite', icon: 'heart', cls: 'favb' },
      { id: 'notes', z: 'l', p: 3.5, label: 'note', icon: 'notes' },
      { id: 'vol', z: 'c', p: 2, label: 'volume', icon: 'vol' },
      { id: 'rep', z: 'c', p: 9, label: 'repeatSentence', icon: 'repeat1', tip: 'repeatSentencePressAnd' },
      { id: 'prev', z: 'c', p: 10, label: 'previousSentence', icon: 'prev' },
      { id: 'play', z: 'c', p: 99, label: 'playPause', icon: 'play', cls: 'play', tip: 'playPauseSpace' },
      { id: 'next', z: 'c', p: 10, label: 'nextSentence', icon: 'next' },
      { id: 'speed', z: 'c', p: 8, label: 'speed', icon: 'speed', speed: true },
      { id: 'cc', z: 'r', p: 7, label: 'subtitleMode', icon: 'cc', view: true },
      { id: 'mode', z: 'r', p: 4, label: 'viewMode', icon: 'normal', view: true },
      { id: 'fs', z: 'r', p: 5, label: 'fullScreen', icon: 'fs', view: true },
      { id: 'set', z: 'r', p: 3, label: 'settings', icon: 'set' },
      { id: 'more', z: 'r', p: 100, label: 'more', icon: 'more' },
    ];
    const dockEl = {};
    function labelDockButton(d, el = dockEl[d.id]) { if (d.html || !el) return; el.title = T(d.tip || d.label); el.setAttribute('aria-label', T(d.label)); }
    DOCK.forEach((d) => {
      let el;
      if (d.html) { const t = document.createElement('div'); t.innerHTML = d.html; el = t.firstElementChild; }
      else {
        el = document.createElement('button');
        el.className = `ib ${d.cls || ''} ${d.speed ? 'spd' : ''}`;
        el.dataset.id = d.id; labelDockButton(d, el);
        el.innerHTML = d.speed ? `<span class="ico">${ic('speed')}</span><span class="sl">1.00x</span>` : ic(d.icon) + (d.id === 'rep' ? '<span class="bdg" hidden></span>' : '');
      }
      dockEl[d.id] = el;
    });
    // portrait dock: fixed left→right order; a narrow phone keeps the 7 most used, a wider portrait screen shows more
    const COMPACT_ORDER = { view: ['notes', 'vol', 'cc', 'rep', 'prev', 'play', 'next', 'speed', 'more'], study: ['notes', 'vol', 'rep', 'prev', 'play', 'next', 'speed', 'more'] };
    const compactPri = (id, study) => ({ play: 100, more: 99, prev: 90, next: 90, rep: 85, speed: 84, cc: 83, vol: study ? 83 : 40, fav: 60, fs: 55, notes: 50, set: 45, mode: 35 }[id] || 0);

    function layoutDock() {
      const c = wClass() === 'c';
      const study = isStudy();
      const th = !study && curView() === 'theater' && !c;
      const items = DOCK.filter((d) => d.id !== 'mode' && d.id !== 'set' && (th || (d.id !== 'fav' && d.id !== 'fs')) && !(d.view && study));
      DOCK.forEach((d) => { dockEl[d.id].setAttribute('data-over', ''); dockEl[d.id].style.order = ''; dockEl[d.id].style.gridColumn = ''; });
      const over = [];
      if (c) {
        const all = study ? COMPACT_ORDER.study : th ? ['fav', ...COMPACT_ORDER.view, 'fs'] : COMPACT_ORDER.view;
        const slotW = (S.input === 'touch' ? 44 : 36) + 20;
        const slots = S.w - 16 >= 7 * 46 ? Math.max(7, Math.floor((S.w - 16) / slotW)) : Math.floor((S.w - 16) / 46); // < 338px: 7 × 44px won't fit
        const keep = new Set([...all].sort((a, b) => compactPri(b, study) - compactPri(a, study)).slice(0, slots));
        let order = all.filter((id) => keep.has(id));
        // play stays dead centre: CC may swing to the shorter side; otherwise the heavier side sends its lowest item to ☰
        for (let k = 0; k < 6; k++) {
          const pi = order.indexOf('play'), L = order.slice(0, pi), Rr = order.slice(pi + 1);
          if (L.length === Rr.length) break;
          const heavy = L.length > Rr.length ? L : Rr;
          if (heavy.includes('cc') && Math.abs(L.length - Rr.length) >= 2) {
            order = order.filter((id) => id !== 'cc'); const p2 = order.indexOf('play');
            if (heavy === L) order.splice(order.indexOf('more') > p2 ? order.indexOf('more') : order.length, 0, 'cc'); else order.splice(p2 - 1 >= 0 ? p2 - 1 : 0, 0, 'cc');
            continue;
          }
          const drop = [...heavy].filter((id) => id !== 'more').sort((a, b) => compactPri(a, study) - compactPri(b, study))[0];
          order = order.filter((id) => id !== drop);
        }
        const pi = order.indexOf('play'), nl = pi, nr = order.length - pi - 1, half = Math.max(nl, nr);
        $('#drow').style.setProperty('--cols', half * 2 + 1);
        const zc = $('#zc');
        order.forEach((id, i) => { const el = dockEl[id]; zc.appendChild(el); el.removeAttribute('data-over'); el.style.order = i; el.style.gridColumn = String(i < pi ? half - nl + i + 1 : i === pi ? half + 1 : half + 1 + (i - pi)); });
        items.forEach((d) => { if (!order.includes(d.id)) over.push(d.id); });
      } else {
        const zones = { l: $('#zl'), c: $('#zc'), r: $('#zr') };
        items.forEach((d) => { zones[d.z].appendChild(dockEl[d.id]); dockEl[d.id].removeAttribute('data-over'); });
        const hit = S.input === 'touch' ? 44 : 36;
        const W = (d) => (d.id === 'title' ? 150 : d.id === 'play' ? hit + 14 : d.speed ? hit + 40 : hit) + 2;
        const hidden = new Set();
        const dockW = S.w - 16;
        for (let k = 0; k < 20; k++) {
          const sum = (z) => items.filter((d) => d.z === z && !hidden.has(d.id)).reduce((a, d) => a + W(d), 0);
          const wl = sum('l'), wc = sum('c'), wr = sum('r');
          const side = (dockW - wc - 16) / 2;
          if (wl <= side && wr <= side) break;
          const cand = items.filter((d) => !hidden.has(d.id) && d.p < 99 && (d.z === 'c' || (d.z === 'l' && wl > side) || (d.z === 'r' && wr > side)));
          if (!cand.length) break;
          cand.sort((a, b) => a.p - b.p);
          hidden.add(cand[0].id);
        }
        hidden.forEach((id) => { dockEl[id].setAttribute('data-over', ''); over.push(id); });
      }
      S.over = over;
      requestAnimationFrame(() => ov.style.setProperty('--dockH', `${$('#dock').offsetHeight}px`));
    }
    // what the More panel shows as "Trên thanh" (only things not reachable elsewhere)
    function overflowTiles() {
      const c = wClass() === 'c';
      const elsewhere = new Set(['title', 'set', 'notes']);
      if (!(curView() === 'theater' && !isStudy() && !c)) { elsewhere.add('fav'); elsewhere.add('fs'); } // ♥ ⛶ live on the video (theater: in the bar)
      return (S.over || []).filter((id) => !elsewhere.has(id));
    }

    // ---------- viewport: the overlay fills the visual viewport; layout = orientation only (docs/ui-layout.md) ----------
    let baseW = 0, baseH = 0;
    const fieldFocused = () => { const a = R.activeElement; return !!(a && ov.contains(a) && a.matches?.('textarea, input[type=search], input[type=text]') && !a.readOnly && !a.disabled); };
    function measureViewport() {
      const vv = window.visualViewport;
      const w = Math.round(document.documentElement.clientWidth || innerWidth), h = Math.round(innerHeight);
      const vh = vv && (vv.scale || 1) < 1.01 ? Math.round(vv.height) : h;
      if (!fieldFocused() || !baseH || Math.abs(w - baseW) > 40) { baseW = w; baseH = Math.max(h, vh); }
      // the on-screen keyboard: a focused field + the visible height dropped by > 150px (never changes the layout class)
      const kb = S.input === 'touch' && fieldFocused() && baseH - Math.min(h, vh) > 150;
      const H = kb ? Math.min(h, vh) : Math.min(h, vh || h);
      S.w = w; S.h = kb ? baseH : H;
      ov.style.setProperty('--ovH', `${H}px`);
      ov.style.top = kb && vv ? `${Math.max(0, Math.round(vv.offsetTop))}px` : '';
      return kb;
    }
    function fit() { S.kb = measureViewport(); }
    let lastKey = '';
    function apply() {
      fit();
      const k = sizeKey();
      if (k === 's' && isStudy()) { S.tabLand = S.tab; S.tab = 'view'; speakAbort(); B.setActivity(null); setPlaying(false); closePanel(); lastKey = ''; toast(T('phoneLandscapeIsTheater')); }
      else if (k !== 's' && S.tabLand) { S.tab = S.tabLand; S.tabLand = null; B.setActivity(S.tab === 'speak' ? 'shadowing' : 'dictation'); useSent(); S.t = SENT[S.si[S.tab]].start; seekMedia(S.t); resetStudy(); lastKey = ''; }
      useSent();
      ov.dataset.w = wClass(); ov.dataset.h = k === 's' ? 's' : 'n';
      ov.dataset.tab = S.tab; ov.dataset.view = curView(); ov.dataset.input = S.input; ov.dataset.cc = S.cc;
      ov.classList.toggle('dark', S.theme === 'dark'); ov.classList.toggle('light', S.theme !== 'dark');
      ov.classList.toggle('subhid', !!S.subHidden[k]);
      ov.classList.toggle('playing', S.playing);
      ov.classList.toggle('ambient', S.ambient); ov.classList.toggle('ahd', S.autoHideDock);
      ov.classList.toggle('col-list-off', !listOn()); ov.classList.toggle('col-notes-off', !notesOn());
      ov.classList.toggle('kb-open', S.kb);
      setSplitVar();
      const mini = S.tab === 'view' && curView() !== 'theater' && !!S.mini[k];
      ov.classList.toggle('vmini', mini);
      const card = mini || (isStudy() && !S.showVideo);
      $('#player').classList.toggle('card', card);
      // header size button
      const bs = $('#btnSize');
      if (isStudy()) { bs.innerHTML = ic(S.showVideo ? 'shrink' : 'enlarge'); bs.title = S.showVideo ? T('shrinkVideo') : T('showVideo'); }
      else if (curView() === 'theater') { bs.innerHTML = ic('shrink'); bs.title = T('exitFullscreen'); }
      else { bs.innerHTML = ic(mini ? 'enlarge' : 'shrink'); bs.title = mini ? T('expandVideo') : T('shrinkVideoToA'); }
      bs.setAttribute('aria-label', bs.title);
      // tabs
      $$('#tabs button').forEach((b, i) => { const on = b.dataset.tab === S.tab; b.setAttribute('aria-selected', on); if (on) $('#tabInd').style.transform = `translateX(${i * 100}%)`; });
      // dock state
      syncFs();
      layoutDock();
      requestAnimationFrame(() => ov.style.setProperty('--bdH', `${$('#bd').offsetHeight}px`));
      // portrait: ♥ / ⛶ on the video only when the dock itself has no room for them
      const vt = $('#vcorner [data-act=theater]');
      const vIc = isStudy() ? (S.showVideo ? 'shrink' : 'enlarge') : curView() === 'theater' ? 'fsx' : 'fs';
      vt.innerHTML = ic(vIc); vt.title = isStudy() ? (S.showVideo ? T('shrinkVideo') : T('expandVideo')) : curView() === 'theater' ? T('exitFullscreen') : T('fullScreen'); vt.setAttribute('aria-label', vt.title);
      if (k !== lastKey) { lastKey = k; renderList(); }
      syncFav(); syncRep(); syncPlay(); syncSpeed(); applySubStyle();
      renderStudy(); renderSideHd(); renderNotesCol(); renderMarks(); tick(true); requestAnimationFrame(() => { fitSub(); fitTsub(); placeAmb(); fitStudy(); });
      if (curView() !== 'theater' || S.tab !== 'view') setChrome(true);
      syncDocClass(); persistSettings();
    }

    // ---------- list (transcript & sentence list: one row style) ----------
    function rowHTML(i) {
      const s = SENT[i];
      let st = '';
      if (S.tab === 'view') {
        if (practiced(i)) st += `<span class="ok" title="${T('practiced')}">${ic('check')}</span>`;
      } else {
        const v = S.res[S.tab][i];
        if (v != null) st += `<span class="sc ${v >= 85 ? '' : v >= 65 ? 'mid' : 'low'}">${v}%</span>`;
      }
      let cls = '';
      if (isStudy()) { if (isLocked(i)) { cls = ' locked'; st = `<span class="lk" title="${T('locked')}">${ic('lock')}</span>`; } else if (!isSolved(S.tab, i)) cls = ' unsolved'; }
      const nd = S.tnotes.some((n) => n.i === i) ? `<span class="nd" title="${T('hasNotes')}"></span>` : '';
      return `<div class="row${cls}" data-i="${i}"><div class="rhd"><span class="tm">${fmt(s.start)}</span>${nd}<span class="st">${st}</span></div><div class="en" data-lhn-primary>${esc(s.en)}</div><div class="vi" data-lhn-secondary>${esc(s.vi)}</div></div>`;
    }
    const PASS = { speak: 70, write: 100 };
    const speakTier = (p) => (p >= 70 ? 'pass' : p >= 40 ? 'warn' : 'fail');
    function isSolved(tab, i) { const v = S.res[tab][i]; return v != null && v >= PASS[tab]; }
    function isLocked(i) { return i > Math.max(S.si[S.tab], S.reach[S.tab] || 0); }
    function lessonLocked() { return isStudy() && !isSolved(S.tab, S.si[S.tab]); }
    function renderList(target) {
      const el = target || $('#list');
      el.innerHTML = SENT.map((_, i) => rowHTML(i)).join('');
      markCur(true, el);
    }
    let lastCur = -1;
    function curIndex() { return isStudy() ? S.si[S.tab] : idxAt(S.t); }
    function markCur(force, el) {
      const i = curIndex();
      if (!force && i === lastCur) return;
      lastCur = i;
      $$('.row', el || R).forEach((r) => r.classList.toggle('cur', +r.dataset.i === i));
      const list = el || $('#list');
      const row = $(`.row[data-i="${i}"]`, list);
      if (row && list.clientHeight && !userScrolling) {
        const top = row.offsetTop - list.clientHeight * 0.28;
        list.scrollTo({ top, behavior: force ? 'auto' : 'smooth' });
      }
    }
    let userScrolling = false, usT = 0;
    $('#list').addEventListener('wheel', () => { userScrolling = true; clearTimeout(usT); usT = setTimeout(() => (userScrolling = false), 2500); }, { passive: true });
    $('#list').addEventListener('touchmove', () => { userScrolling = true; clearTimeout(usT); usT = setTimeout(() => (userScrolling = false), 2500); }, { passive: true });

    // ---------- playback: the real media (state.activeMedia = <video> on YouTube, the speech player on Web pages) ----------
    let timer = 0, seekHold = 0, lastVa = '';
    const applied = { speed: null, vol: null, muted: null };
    function media() { return B.state()?.activeMedia || null; }
    function seekMedia(t) { const m = media(); if (!m) return; try { m.currentTime = Math.max(0, t); } catch (_) {} seekHold = performance.now() + 300; }
    function setPlaying(on) {
      S.playing = on;
      ov.classList.toggle('playing', on);
      $('.wbox .pill.lis')?.classList.toggle('on', on);
      if (on) B.play(); else B.pause();
      syncPlay();
      if (curView() === 'theater') armChrome();
    }
    function syncPlayingFromMedia(m) {
      const on = !m.paused;
      if (on === S.playing) return;
      S.playing = on; ov.classList.toggle('playing', on); $('.wbox .pill.lis')?.classList.toggle('on', on); syncPlay();
      if (curView() === 'theater') armChrome();
    }
    // 50ms: pull time / play state / rate / volume from the media; push what the overlay changed (speed, volume) back
    function step() {
      const m = media(); if (!m || ov.hidden) return;
      if (performance.now() > seekHold) S.t = Number(m.currentTime) || 0;
      const d = Number(m.duration); DUR = Number.isFinite(d) && d > 0 ? d : Math.max(1, SENT[SENT.length - 1].end);
      syncPlayingFromMedia(m);
      const rate = Math.round((Number(m.playbackRate) || 1) * 100) / 100;
      if (applied.speed == null) { applied.speed = rate; S.speed = rate; syncSpeed(); }
      if (S.speed !== applied.speed) { applied.speed = S.speed; B.setSpeed(S.speed); }
      else if (Math.abs(rate - applied.speed) > 0.001) { applied.speed = S.speed = rate; syncSpeed(); }
      const vol = Math.round((Number(m.volume) || 0) * 100), mu = !!m.muted;
      if (applied.vol == null) { applied.vol = S.vol = vol; applied.muted = S.muted = mu; }
      if (S.vol !== applied.vol || S.muted !== applied.muted) { applied.vol = S.vol; applied.muted = S.muted; try { m.volume = Math.max(0, Math.min(1, S.vol / 100)); m.muted = S.muted; } catch (_) {} }
      else if (vol !== applied.vol || mu !== applied.muted) { applied.vol = S.vol = vol; applied.muted = S.muted = mu; }
      if (m.videoWidth && m.videoHeight) { const va = (m.videoWidth / m.videoHeight).toFixed(4); if (va !== lastVa) { lastVa = va; ov.style.setProperty('--va', va); } }
      if (S.playing) {
        if (isStudy()) { const s = SENT[S.si[S.tab]]; if (s && S.t >= s.end) setPlaying(false); }
        else if (S.rep.on) {
          const before = step.prev ?? idxAt(S.t), endOf = SENT[before]?.end;
          if (endOf != null && S.t >= endOf - 0.04 && S.t - endOf < 1) {
            if (S.rep.last !== before) { S.rep.last = before; S.rep.left = S.rep.n; }
            if (S.rep.left > 0) { if (S.rep.n !== Infinity) S.rep.left--; S.t = SENT[before].start; seekMedia(S.t); }
          }
        }
      }
      step.prev = idxAt(S.t);
      tick();
    }
    function seek(t, keep = true) { S.t = Math.max(0, Math.min(DUR, t)); S.rep.last = -1; seekMedia(S.t); tick(true); if (!keep) setPlaying(false); }
    function togglePlay() {
      if (isStudy()) { const s = SENT[S.si[S.tab]]; if (!S.playing && (S.t < s.start - 0.05 || S.t >= s.end - 0.05)) { S.t = s.start; seekMedia(s.start); } }
      else if (!S.playing && S.t >= DUR - 0.05) { S.t = 0; seekMedia(0); }
      setPlaying(!S.playing);
    }
    function go(delta) {
      if (isStudy()) { studyGo(delta); return; }
      const i = Math.max(0, Math.min(SENT.length - 1, idxAt(S.t) + delta));
      seek(SENT[i].start);
    }
    // subtitle words: escaped text, one span per word (tap = translate through the Keepit popup)
    const wordsHTML = (t) => { const s = String(t ?? ''); let out = '', last = 0; for (const m of s.matchAll(/[\p{L}\p{N}][\p{L}\p{N}’'‘`´-]*/gu)) { out += esc(s.slice(last, m.index)) + `<span class="wd">${esc(m[0])}</span>`; last = m.index + m[0].length; } return out + esc(s.slice(last)); };
    function tick(force) {
      const i = idxAt(S.t), s = SENT[i];
      const shown = isStudy() ? SENT[S.si[S.tab]] : s;
      if (force || tick.i !== i) {
        tick.i = i;
        $('.sub-en').innerHTML = wordsHTML(shown.en); $('.sub-vi').textContent = shown.vi;
        $('#tsub .a').innerHTML = wordsHTML(shown.en); $('#tsub .b').textContent = shown.vi; fitTsub();
        fitSub();
      }
      const p = S.t / DUR * 100;
      $('#pfill').style.width = `${p}%`; $('#pknob').style.left = `${p}%`;
      if (!isStudy()) markCur(force);
    }
    function placeAmb() {
      const amb = $('#amb'), v = $('#player .vid');
      if (!amb || !v) return;
      const o = ov.getBoundingClientRect(), k = S.scale || 1;
      amb.classList.toggle('full', true);
      if (true) { amb.classList.remove('gone'); Object.assign(amb.style, { left: '0px', top: '0px', width: o.width / k + 'px', height: o.height / k + 'px' }); return; }
      const r = v.getBoundingClientRect();
      const vis = r.width > 2 && r.height > 2 && getComputedStyle($('#player')).display !== 'none';
      amb.classList.toggle('gone', !vis);
      if (!vis) return;
      Object.assign(amb.style, { left: (r.left - o.left) / k + 'px', top: (r.top - o.top) / k + 'px', width: r.width / k + 'px', height: r.height / k + 'px' });
    }
    new ResizeObserver(() => placeAmb()).observe(R.getElementById('player'));
    new ResizeObserver(() => { if (!ov.classList.contains('dragging')) fitSub(); }).observe(R.getElementById('subbox'));
    // Rạp: very long lines shrink (to 60 %) so the subtitle never covers more than ~40 % of the picture
    function fitTsub() {
      const t = $('#tsub'); t.style.setProperty('--tfit', 1);
      if (!t.offsetParent) return;
      const max = $('#player').clientHeight * 0.4; let f = 1;
      while (f > 0.6 && t.offsetHeight > max) { f -= 0.05; t.style.setProperty('--tfit', f.toFixed(2)); }
    }
    let subAnim = false, subAnimT = 0;
    function fitSub() {
      const box = $('#subbox');
      if (subAnim) return; // folding / unfolding: the text keeps its size, one fit when the box has settled
      if (S.subHidden[sizeKey()]) { if (box.style.height) { box.dataset.h = box.style.height; box.style.height = ''; } return; } // folded: keep the last fit
      box.style.transition = 'none'; requestAnimationFrame(() => { box.style.transition = ''; }); // measuring never animates the box
      box.style.height = ''; ov.style.setProperty('--fit', 1);
      if (!box.offsetParent || isStudy() || curView() === 'theater') return;
      const over = () => box.scrollHeight > box.clientHeight + 1;
      const shrink = (min) => { let f = +ov.style.getPropertyValue('--fit') || 1; while (f > min && over()) { f -= 0.03; ov.style.setProperty('--fit', f.toFixed(2)); } };
      shrink(0.62);
      // portrait: a very long line may borrow height from the list (up to ~45 %) before shrinking further
      if (over() && wClass() === 'c') { const max = $('#bd').clientHeight * 0.45; box.style.height = `${Math.min(max, box.offsetHeight + (box.scrollHeight - box.clientHeight) + 2)}px`; }
      shrink(0.5);
    }
    function syncPlay() {
      dockEl.play.innerHTML = ic(S.playing ? 'pause' : 'play');
      $('#cplay').innerHTML = ic(S.playing ? 'pause' : 'play');
      $('#vplay').innerHTML = ic(S.playing ? 'pause' : 'play');
    }
    function syncSpeed() {
      const lab = $('.sl', dockEl.speed);
      lab.textContent = wClass() === 'c' ? `${+S.speed.toFixed(2)}x` : `${S.speed.toFixed(2)}x`;
    }
    function syncRep() {
      const b = dockEl.rep; b.classList.toggle('on', S.rep.on);
      const bd = $('.bdg', b); bd.hidden = !S.rep.on; bd.textContent = S.rep.n === Infinity ? '∞' : S.rep.n;
    }
    function syncFs() {
      const ex = S.rot ? true : sizeKey() === 's' ? S.realFs !== false : curView() === 'theater';
      dockEl.fs.innerHTML = ic(ex ? 'fsx' : 'fs'); dockEl.fs.title = ex ? T('exitFullscreen') : T('fullScreen'); dockEl.fs.setAttribute('aria-label', dockEl.fs.title);
    }
    function syncFav() { $$('.favb').forEach((b) => { b.classList.toggle('on', S.fav); b.setAttribute('aria-pressed', S.fav); }); }

    // ---------- favourites + TikTok hearts ----------
    function burst(btn) {
      const b = document.createElement('span'); b.className = 'burst';
      const o = ov.getBoundingClientRect(), r0 = btn.getBoundingClientRect();
      b.style.left = `${(r0.left + r0.width / 2 - o.left) / S.scale}px`; b.style.top = `${(r0.top + r0.height / 2 - o.top) / S.scale}px`;
      b.innerHTML = '<b></b><b></b>' + Array.from({ length: 10 }, (_, i) => { const a = i / 10 * Math.PI * 2, r = 34 + (i % 3) * 8; return `<i style="--x:${(Math.cos(a) * r).toFixed(1)}px;--y:${(Math.sin(a) * r).toFixed(1)}px"><svg viewBox="0 0 24 24"><path d="${HEART}"/></svg></i>`; }).join('');
      ov.appendChild(b); setTimeout(() => b.remove(), 900);
    }
    function setFav(on, src) {
      if (src && !src.classList.contains('favb')) src = src.closest('.favb') || src;
      const was = S.fav; S.fav = on; syncFav();
      if (on) $$('.favb').forEach((b) => { b.classList.remove('beat'); void b.offsetWidth; b.classList.add('beat'); if (b === src) burst(b); });
      if (was !== on) { toast(on ? T('addedToFavorites') : T('removedFromFavorites')); B.setFavorite(on); }
    }
    function heartAt(x, y) {
      const h = document.createElement('div'); h.className = 'hrt';
      h.style.left = `${x}px`; h.style.top = `${y}px`; h.style.setProperty('--r', `${(Math.random() * 50 - 25).toFixed(1)}deg`);
      h.innerHTML = `<svg viewBox="0 0 24 24"><path d="${HEART}" fill="url(#gheart)"/></svg>`;
      ov.appendChild(h); setTimeout(() => h.remove(), 1000);
      if (!S.fav) setFav(true); else { $$('.favb').forEach((b) => { b.classList.remove('beat'); void b.offsetWidth; b.classList.add('beat'); }); }
      vib(15);
    }
    const local = (e) => { const r = ov.getBoundingClientRect(); return { x: (e.clientX - r.left) / S.scale, y: (e.clientY - r.top) / S.scale }; };
    // single tap = play/pause (or show controls in theater); double tap / double click = ♥ (never removes, like TikTok)
    let tapT = 0, lastTap = 0;
    function onDoubleZone(e, single) {
      const now = performance.now();
      if (now - lastTap < 300) { clearTimeout(tapT); lastTap = now; const p = local(e); heartAt(p.x, p.y); return; }
      lastTap = now;
      clearTimeout(tapT);
      if (single) tapT = setTimeout(single, 300);
    }
    $('#player').addEventListener('click', (e) => {
      if (S.swallow) { S.swallow = false; return; }
      if (e.target.closest('.cplay,.vc')) return;
      if ($('#player').classList.contains('card')) {
        if (S.tab === 'view') { setMini(false); return; }
        if (isStudy()) { S.showVideo = true; apply(); return; }
        togglePlay(); return;
      }
      const w = S.tapTranslate && e.target.closest('.wd');
      if (w && S.input !== 'touch') { openWord(w); return; }
      onDoubleZone(e, w ? () => openWord(w) : () => {
        if (S.input === 'touch') {
          // touch = YouTube: tap shows / hides the buttons on the video; the centre button plays / pauses
          if (S.tab === 'view' && curView() === 'theater') { const on = S.chromeOff; setChrome(on); if (on) { armChrome(); showCtl(); } else hideCtl(); return; }
          if (S.playing) { if ($('#player').classList.contains('ctl-on')) hideCtl(); else showCtl(); return; }
        }
        togglePlay();
      });
    });
    // on touch the subtitle box and the list also take double taps (as today); with a mouse double-click there selects words
    ['#subbox', '#list'].forEach((sel) => $(sel).addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      const w = sel === '#subbox' && S.tapTranslate && e.target.closest('.wd');
      if (S.input !== 'touch') { if (w) openWord(w); return; }
      if (sel === '#list') { const row = e.target.closest('.row'); onDoubleZone(e, row ? () => rowClick(row) : null); return; }
      onDoubleZone(e, w ? () => openWord(w) : null);
    }));
    $('#cplay').addEventListener('click', (e) => { e.stopPropagation(); togglePlay(); });

    // ---------- view / subtitles ----------
    function setView(v) {
      const k = sizeKey();
      if (k === 's') { if (v !== 'theater') toast(T('phoneLandscapeTheaterOnly')); return; }
      S.view[k] = v; if (v !== 'theater') S.fs = false;
      if (v === 'theater') { enterTT(); enterFs(false); } else { ttReset(); exitFs(); }
      apply();
      if (v === 'theater') toast(T('theaterMode'));
    }
    function enterTT() { ttReset(); if (S.input === 'touch' && !S.ttHint) ov.classList.add('tt-hint-on'); }
    let ttReset = () => {};
    function rotateLand() { // like YouTube: ⛶ on a phone = fullscreen + landscape Rạp
      if (S.rot || wClass() !== 'c') return;
      closePanel(); S.rot = { prev: S.view.c };
      S.view.c = 'theater'; S.view.e = 'theater';
      enterTT(); enterFs(true); apply(); toast(T('landscapeTheaterTheDevice'));
    }
    function exitTheater() {
      if (S.rot) { ttReset(); ov.classList.remove('tt-hint-on'); const r = S.rot; S.rot = null; S.view.c = r.prev || 'normal'; S.view.e = 'normal'; exitFs(); closePanel(); apply(); toast(T('exitLandscapeTheater')); return; }
      setView('normal');
    }
    function setMini(on) { const k = sizeKey(); if (k === 's' || !!S.mini[k] === on) return; S.mini[k] = on; apply(); }
    function setSplit(v, snap) {
      v = Math.max(25, Math.min(80, v));
      if (snap) for (const t of [34, 60]) if (Math.abs(v - t) <= 4) v = t;
      S.split = Math.round(v); setSplitVar(); placeAmb(); requestAnimationFrame(fitSub);
    }
    function setColVars() { ov.style.setProperty('--colL', `${S.colW.l}px`); ov.style.setProperty('--colR', `${S.colW.r}px`); }
    function setSplitVar() { setColVars(); ov.style.setProperty('--split', `${S.split}%`); ov.style.setProperty('--rz', S.split <= 45 ? 1.18 : 1); }
    function setSubHidden(on) {
      const box = $('#subbox');
      if (on) { if (box.style.height) box.dataset.h = box.style.height; box.style.height = ''; }
      else if (box.dataset.h) box.style.height = box.dataset.h; // unfold straight to the last fitted height
      subAnim = true; clearTimeout(subAnimT);
      S.subHidden[sizeKey()] = on; apply();
      subAnimT = setTimeout(() => { subAnim = false; fitSub(); }, 300); // .subbox height transition = .25s
    }
    (() => { // grip: tap = fold/unfold, drag down = fold, drag up = unfold
      const g = $('#grip'); let y0 = null, moved = false;
      g.addEventListener('pointerdown', (e) => { y0 = e.clientY; moved = false; g.setPointerCapture(e.pointerId); e.stopPropagation(); });
      g.addEventListener('pointermove', (e) => { if (y0 == null) return; const dy = (e.clientY - y0) / S.scale; if (Math.abs(dy) > 18 && !moved) { moved = true; setSubHidden(dy > 0); } });
      g.addEventListener('pointerup', () => { y0 = null; });
      g.addEventListener('click', (e) => { e.stopPropagation(); if (moved) { moved = false; return; } setSubHidden(!S.subHidden[sizeKey()]); });
    })();
    $$('#vcorner [data-act]').forEach((b) => b.addEventListener('click', (e) => {
      e.stopPropagation(); showCtl();
      if (b.dataset.act === 'fav') { setFav(!S.fav, b); return; }
      if (isStudy()) { S.showVideo = !S.showVideo; apply(); return; }
      if (curView() === 'theater') { exitTheater(); return; }
      if (wClass() === 'c' && S.input === 'touch') { rotateLand(); return; } // like YouTube: ⛶ on a phone = landscape Rạp
      setView('theater');
    }));
    // touch gestures — Rạp: left = độ sáng, right = âm lượng (drag up/down), middle swipe down = thoát.
    // Xem dọc: swipe up on the video / bar = Rạp ngang, swipe down = Rạp dọc.
    (() => {
      const pl = $('#player'), ring = $('#ttring'), seekBox = $('#ttseek'), C = 2 * Math.PI * 36, BRI_MAX = 15, EDGE = 24;
      const IC = { vol: ic('vol'), volAuto: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15 16.5 18 8.5l3 8M16.1 13.6h3.8" stroke-width="1.7"/></svg>', sun: ic('sun'), auto: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/><path d="M10.5 13.5 12 9.5l1.5 4M10.9 12.4h2.2" stroke-width="1.4"/></svg>' };
      let g = null, ringT = 0;
      const swallow = () => { S.swallow = true; setTimeout(() => (S.swallow = false), 400); };
      const applyBri = () => ov.style.setProperty('--vfilter', S.bri < 1 ? 'none' : `brightness(${(0.35 + S.bri * 0.07).toFixed(3)})`);
      const showRing = (zone) => {
        let frac, label, icon;
        if (zone === 'vol') { const auto = S.vol < 100 / BRI_MAX; frac = S.vol / 100; label = auto ? T('auto') : `${Math.round(S.vol)}%`; icon = auto ? 'volAuto' : 'vol'; }
        else { const auto = S.bri < 1; frac = S.bri / BRI_MAX; label = auto ? T('auto') : `${Math.round(S.bri / BRI_MAX * 100)}%`; icon = auto ? 'auto' : 'sun'; applyBri(); }
        ring.querySelector('.arc').style.strokeDashoffset = (C * (1 - frac)).toFixed(2);
        ring.querySelector('b').textContent = label;
        ring.setAttribute('aria-label', `${VI(zone === 'vol' ? 'volume' : 'brightness')} ${label === T('auto') ? VI('auto') : label}`); // aria never translated (kept as before)
        const box = ring.querySelector('.ttring-ic'); if (box.dataset.icon !== icon) { box.innerHTML = IC[icon]; box.dataset.icon = icon; }
        clearTimeout(ringT); ring.classList.add('show'); ov.classList.add('tt-ring-on');
      };
      const hideRing = () => { clearTimeout(ringT); ringT = setTimeout(() => { ring.classList.remove('show'); ov.classList.remove('tt-ring-on'); }, 800); };
      const showSeek = () => {
        const d = Math.round(g.target - g.from), cap = SENT.filter((x) => x.start <= g.target).pop();
        seekBox.querySelector('b').textContent = fmt(g.target); seekBox.querySelector('i').textContent = `${d < 0 ? '−' : '+'}${Math.abs(d)}s`;
        seekBox.querySelector('small').textContent = cap ? cap.en : ''; seekBox.classList.add('show'); ov.classList.add('tt-ring-on');
      };
      const hideSeek = () => { seekBox.classList.remove('show'); ov.classList.remove('tt-ring-on'); };
      ttReset = () => { S.bri = 0; applyBri(); };
      // like YouTube: while the finger drags, the video follows it (grows on the way into Rạp, shrinks on the way out) and
      // the rest of the screen fades; on release it carries on into the new layout, or springs back
      const rapDoc = () => curView() === 'theater' && !S.rot && sizeKey() !== 's' && wClass() === 'c';
      const fxMove = (kind, d) => {
        if (reduceMotion()) return;
        const p = Math.min(1, Math.abs(d) / ((ov.clientHeight || 700) * 0.45));
        ov.classList.add('gdrag'); pl.style.transition = 'none';
        pl.style.transform = kind === 'enter' ? `translateY(${(d * 0.35).toFixed(1)}px) scale(${(1 + p * 0.14).toFixed(3)})` : `translateY(${(d * 0.55).toFixed(1)}px) scale(${(1 - p * 0.16).toFixed(3)})`;
        ov.style.setProperty('--gfade', (1 - p * 0.75).toFixed(3));
      };
      const fxDone = () => { pl.style.transform = ''; pl.style.opacity = ''; ov.classList.remove('gdrag'); ov.style.removeProperty('--gfade'); };
      const fxEnd = (commit, kind, d, action) => {
        if (!ov.classList.contains('gdrag') || reduceMotion()) { fxDone(); pl.style.transition = ''; if (commit) action(); return; }
        if (!commit) { pl.style.transition = 'transform .24s cubic-bezier(.3,.7,.4,1)'; fxDone(); setTimeout(() => { pl.style.transition = ''; }, 260); return; }
        const dir = d < 0 ? -1 : 1;
        pl.style.transition = 'transform .14s ease-in, opacity .14s';
        pl.style.transform = kind === 'enter' ? `translateY(${dir * 24}px) scale(1.2)` : `translateY(${dir * 90}px) scale(.8)`;
        if (kind === 'exit') pl.style.opacity = '.35';
        setTimeout(() => {
          pl.style.transition = 'none'; fxDone(); action();
          pl.style.setProperty('--gy', `${kind === 'enter' ? 0 : -dir * 40}px`); pl.style.setProperty('--gs', kind === 'enter' ? '.86' : '1.06');
          pl.classList.remove('g-in'); void pl.offsetWidth; pl.classList.add('g-in');
          setTimeout(() => { pl.classList.remove('g-in'); pl.style.transition = ''; }, 320);
        }, 140);
      };
      ov.addEventListener('pointerdown', () => { if (ov.classList.contains('tt-hint-on')) { ov.classList.remove('tt-hint-on'); S.ttHint = true; } }, true);
      pl.addEventListener('pointerdown', (e) => {
        g = null;
        if (S.input !== 'touch' || S.tab !== 'view' || !e.isPrimary || e.button > 0) return;
        if (e.target.closest('.vc,.cplay')) return;
        const r = pl.getBoundingClientRect(), k = S.scale, x = (e.clientX - r.left) / k, y = (e.clientY - r.top) / k, W = r.width / k, H = r.height / k;
        let zone = null;
        if (curView() === 'theater') { if (y > EDGE && y < H - EDGE && x > EDGE && x < W - EDGE) zone = x < W * 0.4 ? 'vol' : x > W * 0.6 ? 'bri' : 'mid'; }
        else zone = 'xem';
        g = { id: e.pointerId, x: e.clientX, y: e.clientY, y0: e.clientY, W: r.width, H: r.height, zone, mode: null, start: zone === 'vol' ? S.vol : S.bri };
        if (e.pointerType === 'mouse') e.preventDefault();
      });
      pl.addEventListener('pointermove', (e) => {
        if (!g || e.pointerId !== g.id) return; const dx = e.clientX - g.x, dy = g.y - e.clientY;
        if (!g.mode) {
          if (Math.hypot(dx, dy) <= 10) return;
          try { pl.setPointerCapture(e.pointerId); } catch (_) {}
          if (g.zone === 'xem') g.mode = 'xem';
          else if (!g.zone) g.mode = 'move';
          else if (Math.abs(dx) > Math.abs(dy)) Object.assign(g, { mode: 'seek', from: S.t, target: S.t, x: e.clientX, span: Math.min(DUR, 120) });
          else if (g.zone === 'mid') { g.both = rapDoc(); g.mode = dy < 0 || g.both ? 'exit' : 'move'; } // Rạp dọc: up or down = back
          else { g.mode = 'swipe'; g.y = e.clientY; }
          return;
        }
        if (g.mode === 'seek') { g.target = Math.min(DUR, Math.max(0, g.from + (e.clientX - g.x) / g.W * g.span)); showSeek(); return; }
        if (g.mode === 'xem') { const d = e.clientY - g.y0; if (wClass() === 'c' && Math.abs(d) > Math.abs(e.clientX - g.x)) fxMove('enter', d / S.scale); else if (ov.classList.contains('gdrag')) fxMove('enter', 0); return; }
        if (g.mode === 'exit') { const d = (e.clientY - g.y0) / S.scale; fxMove('exit', g.both ? d : Math.max(0, d)); return; }
        if (g.mode !== 'swipe') return;
        const span = g.H * 0.75;
        if (g.zone === 'vol') { S.vol = Math.min(100, Math.max(0, g.start + dy / span * 100)); S.muted = false; }
        else S.bri = Math.min(BRI_MAX, Math.max(0, g.start + dy / span * BRI_MAX));
        showRing(g.zone);
      });
      pl.addEventListener('pointercancel', () => { if (g?.mode === 'swipe') hideRing(); if (g?.mode === 'seek') hideSeek(); if (g?.mode === 'xem' || g?.mode === 'exit') fxEnd(false); g = null; });
      pl.addEventListener('pointerup', (e) => {
        if (!g || e.pointerId !== g.id) return; const was = g; g = null;
        if (was.mode) swallow();
        if (was.mode === 'swipe') { hideRing(); S.vol = Math.round(S.vol); return; }
        if (was.mode === 'seek') { hideSeek(); if (Math.abs(was.target - was.from) >= 0.5) seek(was.target); return; }
        if (was.mode === 'exit') { const d = (e.clientY - was.y0) / S.scale; fxEnd(was.both ? Math.abs(d) > 60 : d > 60, 'exit', d, exitTheater); return; }
        if (was.mode !== 'xem') return;
        const dy = e.clientY - was.y0, dx = e.clientX - was.x;
        if (Math.abs(dy) < 40 || Math.abs(dy) < Math.abs(dx) * 1.3 || wClass() !== 'c') { fxEnd(false); return; }
        fxEnd(true, 'enter', dy, () => { if (dy < 0) rotateLand(); else setView('theater'); });
      });
    })();
    let ctlT = 0;
    function showCtl(ms = 2600) { const p = $('#player'); p.classList.add('ctl-on'); clearTimeout(ctlT); ctlT = setTimeout(() => { if (S.playing) p.classList.remove('ctl-on'); }, ms); }
    function hideCtl() { clearTimeout(ctlT); $('#player').classList.remove('ctl-on'); }
    $('#player').addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') showCtl(2200); });
    $('#player').addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse' && S.playing) hideCtl(); });
    $('#vplay').addEventListener('click', (e) => { e.stopPropagation(); if (S.swallow) { S.swallow = false; return; } togglePlay(); if (S.playing) showCtl(1200); });
    function rowClick(row) {
      const i = +row.dataset.i;
      if (isStudy()) { if (isLocked(i)) { vib(15); toast(T('finishTheCurrentSentence')); return; } setStudyIndex(i); closePanel(); return; }
      seek(SENT[i].start); if (!S.playing) setPlaying(true);
    }
    $('#list').addEventListener('click', (e) => { if (S.input === 'touch') return; const row = e.target.closest('.row'); if (row) rowClick(row); });

    // ---------- progress (hover preview + note markers) ----------
    const prog = $('#prog');
    function progT(e) { const r = prog.getBoundingClientRect(); return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * DUR; }
    function showTip(e) {
      const t = progT(e), i = idxAt(t), tip = $('#ptip');
      const mk = e.target.closest?.('.mk'), tn = mk && S.tnotes.find((n) => n.i === +mk.dataset.i);
      tip.innerHTML = tn ? `<b>📍 ${fmt(stTime(tn.i))}</b>${esc(tn.text) || `<i>${T('empty')}</i>`}` : `<b>${fmt(t)}</b>${esc(SENT[i].en)}`;
      tip.style.display = 'block';
      const r = prog.getBoundingClientRect(); const x = (e.clientX - r.left) / S.scale; const w = tip.offsetWidth; const W = r.width / S.scale;
      tip.style.left = `${Math.max(w / 2 + 6, Math.min(W - w / 2 - 6, x))}px`;
    }
    let pdrag = false;
    prog.addEventListener('pointermove', (e) => { showTip(e); if (pdrag) seek(progT(e)); });
    prog.addEventListener('pointerleave', () => { if (!pdrag) $('#ptip').style.display = 'none'; });
    prog.addEventListener('pointerdown', (e) => { if (e.target.classList.contains('mk')) return; pdrag = true; prog.classList.add('drag'); prog.setPointerCapture(e.pointerId); seek(progT(e)); showTip(e); });
    prog.addEventListener('pointerup', () => { pdrag = false; prog.classList.remove('drag'); setTimeout(() => ($('#ptip').style.display = 'none'), S.input === 'touch' ? 600 : 0); });
    function renderMarks() {
      $('#pmarks').innerHTML = S.tnotes.map((n) => `<span class="mk" data-i="${n.i}" style="left:${(stTime(n.i) / DUR * 100).toFixed(3)}%" role="button" aria-label="${T('note')} · ${fmt(stTime(n.i))}"></span>`).join('');
    }
    $('#pmarks').addEventListener('click', (e) => { const m = e.target.closest('.mk'); if (m) { e.stopPropagation(); jumpToNote(+m.dataset.i); } });

    // ---------- theater auto-hide ----------
    let chromeT = 0;
    function setChrome(on) { S.chromeOff = !on; ov.classList.toggle('chrome-off', !on); }
    function armChrome() {
      clearTimeout(chromeT);
      if (S.tab !== 'view' || curView() !== 'theater') return;
      chromeT = setTimeout(() => { if (S.tab === 'view' && curView() === 'theater' && S.playing && !$('#layer').children.length && !prog.classList.contains('drag')) setChrome(false); }, 2600);
    }
    ov.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' && curView() === 'theater' && S.tab === 'view') { if (S.chromeOff) setChrome(true); armChrome(); } });

    // ---------- generic panel (popover on wide, sheet on compact) ----------
    const layer = $('#layer');
    let panelKind = '', panelAnchor = null, panelOpt = {};
    const dropSheet = () => { const o = layer.querySelector('.pnl'); if (o) globalThis.LHN_SHEET?.detach?.(o); };
    function closePanel() { dropSheet(); layer.innerHTML = ''; panelKind = ''; panelAnchor = null; $$('.wd.on').forEach((w) => w.classList.remove('on')); if (curView() === 'theater') armChrome(); }
    function openPanel(kind, anchor, opt = {}) {
      if (kind === 'summary') hideStudyToast(true);
      if (panelKind === kind && !opt.keep) { closePanel(); return; }
      const same = panelKind === kind && opt.keep, old = layer.querySelector('.pnl'), keepTop = same && old ? old.scrollTop : 0, keepTf = same && old ? old.style.transform : '';
      dropSheet(); layer.innerHTML = '';
      panelKind = kind; panelAnchor = anchor || panelAnchor; panelOpt = { ...opt, keep: false };
      const sheet = sheetMode() && !opt.center;
      const scrim = document.createElement('div'); scrim.className = 'scrim' + (sheet || opt.center ? ' dim' : '');
      scrim.addEventListener('click', closePanel);
      const p = document.createElement('div');
      p.className = `pnl ${sheet ? 'sheet' : opt.center ? 'pop center' : 'pop'} ${opt.wide ? 'wide' : ''} ${opt.cls || ''}`;
      p.setAttribute('role', 'dialog');
      const body = PANELS[kind](p);
      p.innerHTML = `<div class="grip"></div>${body}`;
      if (same) { p.classList.add('noanim'); scrim.classList.add('noanim'); }
      layer.append(scrim, p);
      bindPanel(kind, p);
      if (!sheet && !opt.center) placePop(p, panelAnchor);
      if (sheet) attachSheetDrag(p);
      if (same) { if (keepTf) p.style.transform = keepTf; p.scrollTop = keepTop; } // after placing: the max-height exists now, so the scroll position sticks
      setChrome(true);
    }
    function placePop(p, anchor) {
      const or = ov.getBoundingClientRect();
      let a = anchor && anchor.isConnected && anchor.offsetParent ? anchor : dockEl.more;
      const ar = a.getBoundingClientRect();
      const ax = (ar.left + ar.width / 2 - or.left) / S.scale, atop = (ar.top - or.top) / S.scale, abot = (ar.bottom - or.top) / S.scale;
      const W = or.width / S.scale, H = or.height / S.scale;
      const pw = p.offsetWidth;
      const left = Math.max(8, Math.min(W - pw - 8, ax - pw / 2));
      p.style.left = `${left}px`;
      const ph = p.scrollHeight;
      const room = atop > H / 2 ? atop - 18 : H - abot - 18;
      if (ph > room && room < H * 0.9) {
        // not enough room beside the anchor (e.g. phone landscape): float over it, max ~90% of the screen, scroll inside
        const h = Math.min(ph, H * 0.9);
        p.style.top = `${Math.round(Math.max(8, Math.min(H - h - 8, (atop > H / 2 ? atop - 10 - h : abot + 10))))}px`; p.style.maxHeight = `${Math.round(H * 0.9)}px`;
      } else if (atop > H / 2) { p.style.bottom = `${H - atop + 10}px`; p.style.maxHeight = `${atop - 18}px`; }
      else { p.style.top = `${abot + 10}px`; p.style.maxHeight = `${H - abot - 18}px`; }
    }
    function attachSheetDrag(p) {
      // touch: the shared Keepit sheet rule (js/shared/sheet-kit.js) — drag down from anywhere closes, a scrolled list returns to its top first,
      // the page behind never scrolls; same as the Keepit bar sheets. Mouse / pen ("Chạm" mode on a desktop) keep the pointer drag below.
      const kit = globalThis.LHN_SHEET;
      if (kit) kit.attach(p, { isOpen: () => p.isConnected && p.classList.contains('sheet'), close: () => { if (p.isConnected) closePanel(); } });
      let y0 = null, dy = 0;
      p.addEventListener('pointerdown', (e) => { if ((kit && e.pointerType === 'touch') || e.target.closest('input,textarea,select,.rng') || p.scrollTop > 0) return; y0 = e.clientY; dy = 0; });
      p.addEventListener('pointermove', (e) => { if (y0 == null) return; dy = Math.max(0, (e.clientY - y0) / S.scale); if (dy > 4) { p.style.transition = 'none'; p.style.translate = `0 ${dy}px`; } });
      const end = () => { if (y0 == null) return; y0 = null; if (dy > Math.min(110, p.offsetHeight * 0.3)) closePanel(); else { p.style.transition = 'translate .2s'; p.style.translate = '0 0'; } };
      p.addEventListener('pointerup', end); p.addEventListener('pointercancel', end);
    }
    const head = (title, val = '', back = '') => `<div class="phd">${back ? `<button class="px" data-back="${back}" aria-label="${T('back')}">${ic('back')}</button>` : ''}<span class="ptl">${title}</span>${val ? `<span class="pval">${val}</span>` : ''}<button class="px x" data-close aria-label="${T('close')}">${ic('close')}</button></div>`;
    const opt = (attr, sel, label, k = '', icon = '') => `<button class="opt ${sel ? 'sel' : ''}" ${attr}>${icon ? `<span class="oi">${ic(icon)}</span>` : `<span class="ck">${ic('check')}</span>`}<span>${label}</span>${k ? `<span class="k">(${k})</span>` : ''}${icon ? `<span class="ck" style="margin-left:${k ? '8px' : 'auto'}">${ic('check')}</span>` : ''}</button>`;
    const sw2 = (key, on) => `<label class="sw2"><input type="checkbox" data-sw="${key}" ${on ? 'checked' : ''}><span></span></label>`;
    const FLAGS = {
      auto: `<svg viewBox="0 0 22 15"><rect width="22" height="15" class="fa-bg"/><path class="fa-ic" transform="translate(2.6 -.9) scale(.7)" d="M12 2Q13 11 22 12Q13 13 12 22Q11 13 2 12Q11 11 12 2Z"/></svg>`,
      en: `<svg viewBox="0 0 22 15"><rect width="22" height="15" fill="#012169"/><path d="M0 0l22 15M22 0L0 15" stroke="#fff" stroke-width="3"/><path d="M0 0l22 15M22 0L0 15" stroke="#C8102E" stroke-width="1.2"/><path d="M11 0v15M0 7.5h22" stroke="#fff" stroke-width="4.5"/><path d="M11 0v15M0 7.5h22" stroke="#C8102E" stroke-width="2.4"/></svg>`,
      vi: `<svg viewBox="0 0 22 15"><rect width="22" height="15" fill="#DA251D"/><path d="M11 3.2l1.1 3.3h3.4l-2.8 2 1.1 3.3-2.8-2-2.8 2 1.1-3.3-2.8-2h3.4z" fill="#FF0"/></svg>`,
      ko: `<svg viewBox="0 0 22 15"><rect width="22" height="15" fill="#fff"/><path d="M8 7.5a3 3 0 0 1 6 0z" fill="#CD2E3A"/><path d="M8 7.5a3 3 0 0 0 6 0z" fill="#0047A0"/><path d="M3 3.5l2 -1.3M17 2.2l2 1.3M3 11.5l2 1.3M17 12.8l2-1.3" stroke="#000" stroke-width="1.2"/></svg>`,
      ja: `<svg viewBox="0 0 22 15"><rect width="22" height="15" fill="#fff"/><circle cx="11" cy="7.5" r="4" fill="#BC002D"/></svg>`,
      zh: `<svg viewBox="0 0 22 15"><rect width="22" height="15" fill="#DE2910"/><path d="M5 2.2l.8 2.4h2.5l-2 1.5.8 2.4-2.1-1.5-2 1.5.8-2.4-2-1.5h2.5z" fill="#FFDE00"/></svg>`,
      fr: `<svg viewBox="0 0 22 15"><rect width="7.4" height="15" fill="#002395"/><rect x="7.3" width="7.4" height="15" fill="#fff"/><rect x="14.6" width="7.4" height="15" fill="#ED2939"/></svg>`,
      es: `<svg viewBox="0 0 22 15"><rect width="22" height="15" fill="#AA151B"/><rect y="3.75" width="22" height="7.5" fill="#F1BF00"/></svg>`,
      de: `<svg viewBox="0 0 22 15"><rect width="22" height="5" fill="#000"/><rect y="5" width="22" height="5" fill="#DD0000"/><rect y="10" width="22" height="5" fill="#FFCE00"/></svg>`,
    };
    const LANGS = [['auto', 'autoDetect', 'Auto detect'], ['en', 'langEnglish', 'English'], ['vi', 'vietnamese', 'Vietnamese'], ['ko', 'langKorean', 'Korean']]; // [code, label key, English name]
    const langName = (c, viOnly = false) => { const l = LANGS.find((x) => x[0] === c); return l ? (viOnly ? VI : T)(l[1]) : c; };
    // default subtitle colours per theme (= the first swatch)
    const subDefault = (tab, grp) => ({ dark: { video: { en: '#ffff00', vi: '#ffffff' }, side: { en: '#e5e7eb', vi: '#c0c5ce' } }, light: { video: { en: '#8b5cf6', vi: '#4b5563' }, side: { en: '#111827', vi: '#4b5563' } } })[S.theme === 'dark' ? 'dark' : 'light'][tab][grp];
    const SW_COLORS = [['#ffffff', 'white'], ['#9ca3af', 'gray'], ['#ffff00', 'yellow'], ['#22c55e', 'green'], ['#22d3ee', 'cyan'], ['#ef4444', 'red'], ['#ec4899', 'pink'], ['#8b5cf6', 'purple']]; // [colour, label key]
    const SPEEDS = [0.5, 0.75, 0.9, 1, 1.1, 1.25, 1.5, 2];

    // ---------- tap-to-translate: the word is selected and the existing Keepit popup (content.js) opens on it ----------
    let wordWatch = 0;
    function openWord(el) {
      if (!S.tapTranslate || !el || !el.isConnected) return;
      $$('.wd.on').forEach((w) => w.classList.remove('on'));
      el.classList.add('on');
      setPlaying(false);
      if (!el.closest('[data-lhn-primary],[data-lhn-secondary]')) { el.setAttribute('data-lhn-primary', ''); el.dataset.lhnTmp = '1'; }
      clearInterval(wordWatch);
      setTimeout(() => {
        if (!el.isConnected) return;
        try { const sel = document.getSelection(), r = document.createRange(); r.selectNodeContents(el); sel.removeAllRanges(); sel.addRange(r); } catch (_) {}
        const b = el.getBoundingClientRect();
        el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, composed: true, cancelable: true, button: 0, clientX: b.left + b.width / 2, clientY: b.top + b.height / 2 }));
        let seen = false; const t0 = Date.now();
        wordWatch = setInterval(() => { // the word stays marked while the popup is open
          const open = B.popupOpen(); if (open) seen = true;
          if ((seen && !open) || (!seen && Date.now() - t0 > 4000) || !el.isConnected) {
            clearInterval(wordWatch); el.classList.remove('on');
            if (el.dataset.lhnTmp) { el.removeAttribute('data-lhn-primary'); delete el.dataset.lhnTmp; }
          }
        }, 250);
      }, 30);
    }
    const PANELS = {
      speed: () => `${head(T('speed'), `${S.speed.toFixed(2)}x`)}<input class="rng" type="range" min="0.5" max="3" step="0.05" value="${S.speed}" data-rng="speed" aria-label="${T('speed')}"><div style="display:flex;justify-content:space-between;color:var(--mu);font-size:12px;margin:2px 2px 6px"><span>0.5x</span><span>3x</span></div><div class="sgrid">${SPEEDS.map((v) => `<button data-speed="${v}" class="${Math.abs(v - S.speed) < 0.01 ? 'on' : ''}">${v === 1 ? `${T('speedNormalTop')}<br>${T('speedNormalBottom')}` : v + 'x'}</button>`).join('')}</div>`,
      cc: () => `${head(T('subtitleMode'))}${[['bi', T('bilingual'), '1'], ['pri', T('original'), '2'], ['tr', T('translate'), '3'], ['off', VI('ccHidden'), '4']].map(([v, l, k]) => opt(`data-cc="${v}"`, S.cc === v, l, k)).join('')}`,
      rep: () => `${head(T('repeatSentence'), S.rep.on ? (S.rep.n === Infinity ? T('continuous') : T('timesCount', S.rep.n)) : T('off'))}<div class="sgrid rgrid">${[[0, T('off')], [1, '1'], [2, '2'], [3, '3'], [5, '5'], [10, '10'], [Infinity, `∞<small>${T('continuous')}</small>`]].map(([v, l]) => `<button data-rep="${v}" class="${(v === 0 ? !S.rep.on : S.rep.on && S.rep.n === v) ? 'on' : ''}">${l}</button>`).join('')}</div><p class="help" style="text-align:left;margin:10px 4px 0">${T('howManyTimesEach')}</p>`,
      vol: () => `${head(T('volume'), S.muted ? T('muted') : `${S.vol}%`)}<div style="display:flex;align-items:center;gap:10px"><button class="ib" data-act="mute">${ic(S.muted ? 'mute' : 'vol')}</button><input class="rng" type="range" min="0" max="100" value="${S.vol}" data-rng="vol" aria-label="${T('volume')}"></div>`,
      more: () => {
        const ov2 = overflowTiles();
        const L = { fav: ['heart', T('favorite')], vol: ['vol', T('volume')], rep: ['repeat1', T('repeatSentence')], prev: ['prev', T('previousSentence')], next: ['next', T('next')], speed: ['speed', T('speed')], cc: ['cc', T('subtitleMode')], mode: [curView(), T('viewMode')], fs: ['fs', T('fullScreen')] };
        const tile = (act, icon, label) => `<button class="tile" data-tile="${act}">${ic(icon)}<span>${label}</span></button>`;
        return `${head(T('more'))}${ov2.length ? `<div class="sec">${T('onTheBar')}</div><div class="tiles">${ov2.map((id) => tile(id, L[id][0], L[id][1])).join('')}</div>` : ''}<div class="sec">${VI('quick')}</div><div class="tiles">${tile('theme', S.theme === 'dark' ? 'sun' : 'moon', S.theme === 'dark' ? T('lightTheme') : T('darkTheme'))}${tile('subopt', 'subOptions', T('subtitles'))}${tile('sublang', 'subLanguage', T('language'))}${tile('notes', 'notes', T('note'))}${tile('art', 'art', T('ambientEffect'))}${tile('set', 'set', T('settings'))}</div>`;
      },
      set: () => `${head(T('videoSettings'))}
        ${isStudy() || wClass() === 'c' ? '' : `<div class="srow" style="flex-wrap:wrap"><div class="l">${T('videoColumn')} <b data-rw>${S.split}%</b><small>${T('landscapeYouCanAlso')}</small></div><div class="seg">${[[34, VI('read')], [60, VI('watch')]] /* "Đọc 34%" is one text node: never translated (kept as before) */.map(([v, l]) => `<button data-split="${v}" class="${S.split === v ? 'on' : ''}">${l} ${v}%</button>`).join('')}</div><input class="rng" type="range" min="25" max="80" step="1" value="${S.split}" data-rng="split"></div>`}
        <div class="srow"><div class="l">${T('clickToTranslate')}</div>${sw2('tapTranslate', S.tapTranslate)}</div>
        <div class="srow"><div class="l">${T('speakTranslation')}</div>${sw2('speakOnTranslate', S.speakOnTranslate)}</div>
        <div class="srow"><div class="l">${T('combineSentences')}</div>${sw2('merge', S.merge)}</div>
        <div class="srow"><div class="l">${T('ambientEffect')}<small>${T('videoColorsSpillInto')}</small></div>${sw2('ambient', S.ambient)}</div>
        <div class="srow"><div class="l">${T('hideControls')}<small>${T('showsAgainOnHover')}</small></div>${sw2('autoHideDock', S.autoHideDock)}</div>
        <div class="srow nav" data-page="theme"><div class="l">${T('theme')}</div><span class="v">${S.theme === 'dark' ? T('themeDark') : T('themeLight')}</span>${ic('chevR')}</div>
        <div class="srow nav" data-page="subopt"><div class="l">${T('subtitles')}</div>${ic('chevR')}</div>
        <div class="srow nav" data-page="sublang"><div class="l">${T('language')}</div><span class="v">${langName(S.srcLang, true)} → ${langName(S.dstLang, true)}</span>${ic('chevR')}</div>
        <div class="srow nav" data-page="export"><div class="l">${T('includeSubtitles')}</div>${ic('chevR')}</div>`,
      theme: () => `${head(T('theme'), '', 'set')}${opt('data-theme="dark"', S.theme === 'dark', T('themeDark'), '', 'moon')}${opt('data-theme="light"', S.theme === 'light', T('themeLight'), '', 'sun')}`,
      subopt: () => {
        const st = S.subStyle[S.subTab];
        const swatch = (grp) => { const d = subDefault(S.subTab, grp), dn = T((SW_COLORS.find(([c]) => c === d) || [d, 'accentColor'])[1]);
          const list = [['def', `${dn} · ${T('defaultSuffix')}`, d], ...SW_COLORS.filter(([c]) => c !== d).map(([c, n]) => [c, T(n), c])];
          return `<div class="swatches">${list.map(([c, n, bg]) => `<button class="swc ${st[grp] === c ? 'on' : ''}" data-color="${grp}:${c}" title="${n}" aria-label="${n}" style="background:${bg}"></button>`).join('')}</div>`; };
        const en = st.en === 'def' ? subDefault(S.subTab, 'en') : st.en, vi = st.vi === 'def' ? subDefault(S.subTab, 'vi') : st.vi;
        return `${head(T('subtitles'), '', 'set')}
        <div class="seg" style="width:100%;margin-bottom:10px"><button data-subtab="video" class="${S.subTab === 'video' ? 'on' : ''}">${T('videoSubtitles')}</button><button data-subtab="side" class="${S.subTab === 'side' ? 'on' : ''}">${T('scrollingTranscript')}</button></div>
        <div class="prev ${S.subTab === 'video' ? `bg-${st.bg}` : ''}" style="font-family:${subFam(st.font) || 'inherit'}"><div class="a" style="color:${en};font-weight:${st.bold ? 800 : 500};font-size:${Math.round((S.subTab === 'video' ? 18 : 15.5) * SUB_SZ[st.size] * 10) / 10}px"><span>Keep exploring everything</span></div><div class="b" style="color:${vi};font-size:${Math.round((S.subTab === 'video' ? 14 : 13) * SUB_SZ[st.size] * 10) / 10}px"><span>${T('theTranslationAppearsHere')}</span></div></div>
        <div class="srow"><div class="l">${T('fontSize')}</div><div class="seg">${[T('small'), T('sizeMedium'), T('large')].map((l, i) => `<button data-fsz="${i}" class="${st.size === i ? 'on' : ''}">${l}</button>`).join('')}</div></div>
        <div class="sec">${T('primarySubtitleColor')}</div>${swatch('en')}
        <div class="sec">${T('translatedSubtitleColor')}</div>${swatch('vi')}
        <div class="srow" style="margin-top:8px"><div class="l">${T('weight')}</div><div class="seg"><button data-bold="0" class="${!st.bold ? 'on' : ''}">${T('weightNormal')}</button><button data-bold="1" class="${st.bold ? 'on' : ''}">${T('bold')}</button></div></div>
        <div class="srow"><div class="l">${T('font')}</div><div class="seg">${[['def', T('default')], ['serif', 'Serif'], ['mono', 'Mono']].map(([v, l]) => `<button data-font="${v}" class="${st.font === v ? 'on' : ''}">${l}</button>`).join('')}</div></div>
        <div class="srow"><div class="l">${T('background')}<small>${T('appliesInFullScreen')}</small></div><div class="seg">${[['none', T('none')], ['soft', T('bgLight')], ['solid', T('solid')]].map(([v, l]) => `<button data-bg="${v}" class="${st.bg === v ? 'on' : ''}">${l}</button>`).join('')}</div></div>
        <button class="btnw sec2" data-act="subreset">${T('reset')}</button>`;
      },
      sublang: () => `${head(T('language'), '', 'set')}<div class="sec">${T('videoLanguage')}</div>${LANGS.map(([c, n, e]) => `<button class="lrow ${S.srcLang === c ? 'sel' : ''}" data-src="${c}"><span class="fl">${FLAGS[c]}</span><span class="nn">${T(n)}</span><span class="en2">${e}</span><span class="ck">${ic('check')}</span></button>`).join('')}<div class="sec">${T('translateTo')}</div>${LANGS.filter((l) => l[0] !== 'auto').map(([c, n, e]) => `<button class="lrow ${S.dstLang === c ? 'sel' : ''}" data-dst="${c}"><span class="fl">${FLAGS[c]}</span><span class="nn">${T(n)}</span><span class="en2">${e}</span><span class="ck">${ic('check')}</span></button>`).join('')}`,
      export: () => `${head(T('includeSubtitles'), '', 'set')}<div class="srow"><div class="l">${T('format')}</div><div class="seg">${['srt', 'txt', 'csv', 'pdf'].map((f) => `<button data-fmt="${f}" class="${S.exp.fmt === f ? 'on' : ''}">.${f}</button>`).join('')}</div></div><div class="srow"><div class="l">${T('bilingual')}</div>${sw2('exp.bi', S.exp.bi)}</div><div class="srow"><div class="l">${T('showTimestamps')}</div>${sw2('exp.time', S.exp.time)}</div><button class="btnw" data-act="export">${ic('export')}${T('includeSubtitles')}</button>`,
      notes: () => `${head(T('lessonNotes'))}${lessonInner('p')}`,
      slist: () => { const d = doneCount(); return `${head(T('sentenceOf', S.si[S.tab] + 1, SENT.length), T('doneOf', d, SENT.length))}<div class="list" id="sheetList" style="max-height:none;-webkit-mask-image:none;mask-image:none;padding:0"></div><button class="btnw sec2" data-act="summary">${ic('trophy')}${T('endSession')}</button>`; },
      summary: () => {
        const r = S.res[S.tab]; const vals = Object.values(r); const avg = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
        const mins = Math.max(1, Math.round((Date.now() - S.sess) / 60000));
        return `${head(S.tab === 'speak' ? T('summarySpeaking') : T('summaryDictation'))}<div class="sumh"><div class="trophy">${ic('trophy')}</div><b>${avg >= 85 ? T('excellent') : avg >= 65 ? T('wellDone') : T('keepGoing')}</b><div class="help">${T('tenMinutesADay')}</div></div><div class="stats"><div class="stat"><b>${vals.length}/${SENT.length}</b><small>${T('sentencesDone')}</small></div><div class="stat"><b>${avg}%</b><small>${T('avgScore')}</small></div><div class="stat"><b>${mins}′</b><small>${T('time')}</small></div></div><div class="sec">${T('wordsToPractise')} <small class="help" style="font-weight:500">${VI('tapToLookUpSuffix')}</small></div><div class="chips">${[...S.weak].slice(0, 10).map((w) => `<span data-wk="${w}">${w}</span>`).join('') || `<small class="help">${T('noneGreatJob')}</small>`}</div><button class="btnw" data-act="saveweak">${ic('notes')}${T('saveWeakWordsToNotes')}</button><button class="btnw sec2" data-act="retryweak">${ic('replay')}${T('retryBelow85')}</button>`;
      },
    };
    function lessonInner(scope) {
      const mode = S.tab === 'speak' ? 'speak' : 'write', q = S.wSearch.trim().toLowerCase();
      const all = Object.values(S.wrong[mode]).sort((x, y) => (x.last === 'wrong') !== (y.last === 'wrong') ? (x.last === 'wrong' ? -1 : 1) : (x.last === 'wrong' && x.streak !== y.streak) ? y.streak - x.streak : x.err !== y.err ? y.err - x.err : x.at !== y.at ? y.at - x.at : x.word.localeCompare(y.word));
      const rows = all.filter((d) => (S.wFilter === 'all' || d.last === 'wrong') && (!q || [d.word, ...d.v.map((x) => x.t || T('missing'))].some((t) => t.toLowerCase().includes(q))));
      const needs = all.filter((d) => d.last === 'wrong').length, lock = lessonLocked();
      const row = (d) => {
        const key = mode + ':' + d.word, open = S.vOpen.has(key), vs = [...d.v].sort((x, y) => y.n - x.n || x.t.localeCompare(y.t)), shown = open ? vs : vs.slice(0, 2), extra = vs.length - 2;
        const rate = d.err + d.fix ? Math.round(d.fix / (d.err + d.fix) * 100) : 0;
        return `<div class="wst ${d.last}"><div class="wst-h"><b data-wk="${esc(d.word)}">${esc(d.word)}</b><span class="st ${d.last}" title="${d.last === 'wrong' ? T('stillWrongLastTime') : T('correctLastTime')}"><i></i>${d.last === 'wrong' ? T('needsPractice') : T('fixed')}</span></div>
          <div class="wst-m"><span>${T('mistakes')} <b>${d.err}</b> ${VI('fixedSuffix')} <b>${d.fix}</b></span><span>${T('fixRate')} <b>${rate}%</b></span></div><div class="wst-bar" role="img" aria-label="${VI('fixRateAria', rate)}"><span style="width:${rate}%"></span></div>
          <div class="wst-v">${shown.map((x) => `<span class="${x.t ? '' : 'om'}">${x.t ? esc(x.t) : T('missing')} <small>×${x.n}</small></span>`).join('<i>·</i>')}${extra > 0 ? `<button class="lnk" data-vmore="${esc(key)}">${open ? T('collapse') : `+${extra}`}</button>` : ''}</div></div>`;
      };
      return `<div class="lsn ${lock ? 'locked' : ''}" data-scope="${scope}"><div class="lsn-body">
        <section class="wcard"><div class="sec wsec"><span>${T('wrongWordStats')}</span><span class="cnt">${all.length}</span></div>
          <input class="wsearch" type="search" placeholder="${T('searchWords')}" value="${esc(S.wSearch)}" data-wsearch aria-label="${T('searchMistakes')}">
          <div class="seg wseg"><button data-wf="all" class="${S.wFilter === 'all' ? 'on' : ''}">${T('all')}</button><button data-wf="needs" class="${S.wFilter !== 'all' ? 'on' : ''}">${T('needsPractice')}${needs ? ` · ${needs}` : ''}</button></div>
          <div class="wlbox"><div class="wlist">${rows.map(row).join('') || `<p class="help wempty">${all.length ? T('noMatchingWords') : T('noSpellingMistakesYet')}</p>`}</div></div></section>
        <div class="lnote"><div class="sec wsec"><label for="lnote-${scope}">${T('note')}</label><span class="nsaved" aria-live="polite"></span><button class="tadd" data-tadd ${lock ? 'disabled' : ''} title="${S.input === 'mouse' ? T('noteAtThisSentenceMouse') : T('noteAtThisSentence')}">${ic('pin')}${T('noteAtTimeShort', fmt(SENT[S.si[S.tab]].start))}</button></div>
          ${S.tnotes.length ? `<div class="tnl">${S.tnotes.map((n) => tnRow(n, lock)).join('')}</div>` : ''}<textarea id="lnote-${scope}" data-lnote ${lock ? 'disabled' : ''} placeholder="${T('writeANoteAutosaved')}">${esc(S.lessonNote)}</textarea></div>
      </div>${lock ? `<div class="lsn-lock">${ic('lock')}<b>${T('notesAreLocked')}</b><span>${S.tab === 'speak' ? T('score70SpeakingThe') : T('typeTheCurrentSentence')}</span></div>` : ''}</div>`;
    }
    function esc(t) { return String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    function tnRow(n, lock) {
      const tm = fmt(stTime(n.i));
      return `<div class="tn ${n.i === S.si[S.tab] ? 'cur' : ''}" data-tn="${n.i}"><button class="tt" data-tjump="${n.i}" title="${T('goToSentence', n.i + 1)}">${tm}</button><textarea class="tx" data-tnote="${n.i}" rows="1" ${lock ? 'disabled' : ''} placeholder="${T('noteForSentence', n.i + 1)}" aria-label="${T('noteAtTime', tm)}">${esc(n.text)}</textarea><button class="tdel" data-tdel="${n.i}" ${lock ? 'disabled' : ''} title="${T('deleteNote')}" aria-label="${VI('deleteNoteAt', tm)}">${ic('close')}</button></div>`;
    }
    function growTn() { R.querySelectorAll('.tn .tx').forEach((t) => { if (CSS.supports?.('field-sizing', 'content')) return; t.style.height = 'auto'; t.style.height = `${t.scrollHeight}px`; }); }
    function syncNoteDots() {
      R.querySelectorAll('.row[data-i]').forEach((r) => {
        const has = S.tnotes.some((n) => n.i === +r.dataset.i), h = r.querySelector('.rhd'); let d = h && h.querySelector('.nd');
        if (has && !d && h) { d = document.createElement('span'); d.className = 'nd'; d.title = T('hasNotes'); h.querySelector('.tm').after(d); } else if (!has && d) d.remove();
      });
    }
    function syncNoteMarks() { renderMarks(); syncNoteDots(); }
    function addTimeNote(from) {
      if (!isStudy()) return;
      if (lessonLocked()) { toast(S.tab === 'speak' ? T('notesLockedScore70') : T('notesLockedTypeThis')); return; }
      const i = S.si[S.tab];
      if (!S.tnotes.some((n) => n.i === i)) { S.tnotes.push({ i, text: '' }); S.tnotes.sort((a, b) => a.i - b.i); }
      let scope = from && from.closest('.lsn') ? from.closest('.lsn').dataset.scope : null;
      if (!scope) {
        if (wClass() === 'e' && roomNotes()) { if (!S.colNotes) { S.colNotes = true; apply(); } scope = 'c'; }
        else { if (panelKind !== 'notes') openPanel('notes', null, { wide: true }); scope = 'p'; }
      }
      refreshLesson(); syncNoteMarks();
      const t = $(`.lsn[data-scope="${scope}"] [data-tnote="${i}"]`);
      if (t) {
        const box = t.closest('.tnl'), row = t.closest('.tn'); if (box) box.scrollTop = Math.max(0, row.offsetTop - box.offsetTop - 4);
        t.focus({ preventScroll: true }); t.setSelectionRange(t.value.length, t.value.length);
      }
    }
    function removeTimeNote(i, say) {
      const n = S.tnotes.find((x) => x.i === i); if (!n) return;
      S.tnotes = S.tnotes.filter((x) => x.i !== i);
      R.querySelectorAll(`.tn[data-tn="${i}"]`).forEach((r) => { const box = r.parentElement; r.remove(); if (box && !box.children.length) box.remove(); });
      syncNoteMarks();
      queueStudySave();
      if (say) toast(T('noteDeleted', fmt(stTime(i))));
    }
    function jumpToNote(i) {
      if (!isStudy()) { seek(stTime(i)); markCur(true); return; }
      const cur = S.si[S.tab]; if (i === cur) return;
      if (sheetMode() && panelKind === 'notes') closePanel();
      studyGo(i - cur);
    }
    ov.addEventListener('click', (e) => {
      const b = e.target.closest('.lsn [data-tadd],.lsn [data-tdel],.lsn [data-tjump]'); if (!b || b.disabled) return;
      e.stopPropagation();
      if (b.hasAttribute('data-tadd')) addTimeNote(b);
      else if (b.dataset.tdel) removeTimeNote(+b.dataset.tdel, true);
      else jumpToNote(+b.dataset.tjump);
    }, true);
    ov.addEventListener('focusout', (e) => {
      const t = e.target; if (!t.matches?.('.lsn [data-tnote]')) return;
      if (noteSaveT) saveNote();
      const i = +t.dataset.tnote;
      setTimeout(() => { const n = S.tnotes.find((x) => x.i === i); if (n && !n.text.trim() && !R.activeElement?.matches?.(`[data-tnote="${i}"]`)) removeTimeNote(i, false); }, 0);
    });
    function refreshLesson() {
      const keep = [...R.querySelectorAll('.lsn .wlist')].map((e) => [e.closest('.lsn').dataset.scope, e.scrollTop]);
      renderNotesCol();
      const p = $('.lsn[data-scope="p"]'); if (p) p.outerHTML = lessonInner('p');
      keep.forEach(([sc, top]) => { const l = $(`.lsn[data-scope="${sc}"] .wlist`); if (l) l.scrollTop = top; });
      growTn();
    }
    function lookupWord(w, anchor) { openWord(anchor); }
    ov.addEventListener('click', (e) => {
      const root = e.target.closest('.lsn'); const wk = e.target.closest('[data-wk]');
      if (wk) { e.stopPropagation(); lookupWord(wk.dataset.wk, wk); return; }
      if (!root) return;
      const t = e.target.closest('[data-wf],[data-vmore]'); if (!t) return;
      e.stopPropagation();
      if (t.dataset.wf) { S.wFilter = t.dataset.wf; refreshLesson(); return; }
      if (t.dataset.vmore) { const k = t.dataset.vmore; S.vOpen.has(k) ? S.vOpen.delete(k) : S.vOpen.add(k); refreshLesson(); return; }
    }, true);
    ov.addEventListener('input', (e) => {
      if (e.target.matches('.lsn [data-wsearch]')) { const sc = e.target.closest('.lsn').dataset.scope; S.wSearch = e.target.value; const pos = e.target.selectionStart; refreshLesson(); const n = $(`.lsn[data-scope="${sc}"] [data-wsearch]`); if (n) { n.focus(); n.setSelectionRange(pos, pos); } }
      else if (e.target.matches('.lsn [data-tnote]')) { const i = +e.target.dataset.tnote, n = S.tnotes.find((x) => x.i === i); if (n) n.text = e.target.value; R.querySelectorAll(`.lsn [data-tnote="${i}"]`).forEach((o) => { if (o !== e.target) o.value = e.target.value; }); growTn(); R.querySelectorAll('.lsn .nsaved').forEach((m) => m.classList.remove('on')); clearTimeout(noteSaveT); noteSaveT = setTimeout(saveNote, 1000); }
      else if (e.target.matches('.lsn [data-lnote]')) { S.lessonNote = e.target.value; R.querySelectorAll('.lsn .nsaved').forEach((m) => m.classList.remove('on')); clearTimeout(noteSaveT); noteSaveT = setTimeout(saveNote, 1000); }
    });
    let noteSaveT = 0, noteSavedT = 0;
    function saveNote() {
      clearTimeout(noteSaveT); noteSaveT = 0;
      saveStudyNow();
      R.querySelectorAll('.lsn .nsaved').forEach((m) => { m.innerHTML = `${ic('check')}${T('saved')}`; m.classList.add('ok', 'on'); });
      clearTimeout(noteSavedT); noteSavedT = setTimeout(() => R.querySelectorAll('.lsn .nsaved').forEach((m) => m.classList.remove('on')), 1800);
    }
    ov.addEventListener('focusout', (e) => { if (e.target.matches?.('.lsn [data-lnote]') && noteSaveT) saveNote(); });
    function bindPanel(kind, p) {
      p.addEventListener('click', (e) => {
        const t = e.target.closest('button,[data-page]');
        if (!t) return;
        if (t.hasAttribute('data-close')) return closePanel();
        if (t.dataset.back) return openPanel(t.dataset.back, null, { keep: true });
        if (t.dataset.page) return openPanel(t.dataset.page, null, { keep: true, wide: true });
        if (t.dataset.speed) { S.speed = +t.dataset.speed; syncSpeed(); return openPanel('speed', null, { keep: true }); }
        if (t.dataset.cc) { S.cc = t.dataset.cc; apply(); closePanel(); return; }
        if (t.dataset.view) { closePanel(); setView(t.dataset.view); return; }
        if (t.dataset.rep) { const v = +t.dataset.rep; if (v === 0) S.rep.on = false; else { S.rep.on = true; S.rep.n = v; S.rep.last = -1; } syncRep(); closePanel(); toast(v === 0 ? T('repeatOff') : v === Infinity ? T('repeatSentenceContinuously') : T('repeatEach', v)); return; }
        if (t.dataset.act === 'mute') { S.muted = !S.muted; return openPanel('vol', null, { keep: true }); }
        if (t.dataset.tile) return tileAction(t.dataset.tile);
        if (t.dataset.split) { setSplit(+t.dataset.split, true); return openPanel('set', null, { keep: true, wide: true }); }
        if (t.dataset.theme) { S.theme = t.dataset.theme; apply(); return openPanel('theme', null, { keep: true }); }
        if (t.dataset.subtab) { S.subTab = t.dataset.subtab; return openPanel('subopt', null, { keep: true, wide: true }); }
        if (t.dataset.fsz) { S.subStyle[S.subTab].size = +t.dataset.fsz; applySubStyle(); saveUi(); return openPanel('subopt', null, { keep: true, wide: true }); }
        if (t.dataset.color) { const [g, c] = t.dataset.color.split(':'); S.subStyle[S.subTab][g] = c; applySubStyle(); saveUi(); return openPanel('subopt', null, { keep: true, wide: true }); }
        if (t.dataset.bold) { S.subStyle[S.subTab].bold = t.dataset.bold === '1'; applySubStyle(); saveUi(); return openPanel('subopt', null, { keep: true, wide: true }); }
        if (t.dataset.font) { S.subStyle[S.subTab].font = t.dataset.font; applySubStyle(); saveUi(); return openPanel('subopt', null, { keep: true, wide: true }); }
        if (t.dataset.bg) { S.subStyle[S.subTab].bg = t.dataset.bg; applySubStyle(); saveUi(); return openPanel('subopt', null, { keep: true, wide: true }); }
        if (t.dataset.act === 'subreset') { S.subStyle[S.subTab] = { size: 1, en: 'def', vi: 'def', bold: S.subTab === 'video', font: 'def', bg: S.subTab === 'video' ? 'soft' : 'none' }; applySubStyle(); saveUi(); toast(T('resetDone')); return openPanel('subopt', null, { keep: true, wide: true }); }
        if (t.dataset.src) { S.srcLang = t.dataset.src; B.setLanguage('source', S.srcLang); return openPanel('sublang', null, { keep: true, wide: true }); }
        if (t.dataset.dst) { S.dstLang = t.dataset.dst; B.setLanguage('target', S.dstLang); toast(T('translateToLang', langName(S.dstLang))); return openPanel('sublang', null, { keep: true, wide: true }); }
        if (t.dataset.fmt) { S.exp.fmt = t.dataset.fmt; saveUi(); return openPanel('export', null, { keep: true, wide: true }); }
        if (t.dataset.act === 'export') { closePanel(); saveUi(); B.exportAs(S.exp.fmt.toUpperCase(), { onlySubs: false, includeVi: !!S.exp.bi, showTime: !!S.exp.time }); return; }
        if (t.dataset.act === 'summary') { openPanel('summary', null, { keep: true, center: !sheetMode() }); return; }
        if (t.dataset.act === 'saveweak') { S.lessonNote = (S.lessonNote ? S.lessonNote + '\n' : '') + `Từ cần luyện: ${[...S.weak].join(', ')}`; /* text saved into the user's note, not a label: Vietnamese as before */ renderNotesCol(); queueStudySave(); closePanel(); toast(T('addedToLessonNotes')); return; }
        if (t.dataset.act === 'retryweak') { const low = SENT.map((_, i) => i).find((i) => (S.res[S.tab][i] ?? 0) < 85); closePanel(); if (low != null) setStudyIndex(low); return; }
      });
      p.addEventListener('input', (e) => {
        const r = e.target.dataset.rng;
        if (r === 'speed') { S.speed = +e.target.value; syncSpeed(); $('.pval', p).textContent = `${S.speed.toFixed(2)}x`; $$('[data-speed]', p).forEach((b) => b.classList.toggle('on', Math.abs(+b.dataset.speed - S.speed) < 0.01)); }
        if (r === 'vol') { S.vol = +e.target.value; S.muted = S.vol === 0; $('.pval', p).textContent = `${S.vol}%`; }
        if (r === 'split') { setSplit(+e.target.value, false); $('[data-rw]', p).textContent = `${S.split}%`; }
      });
      p.addEventListener('change', (e) => {
        const k = e.target.dataset.sw; if (!k) return;
        if (k.startsWith('exp.')) S.exp[k.slice(4)] = e.target.checked; else S[k] = e.target.checked;
        apply();
      });
      if (kind === 'slist') { const l = $('#sheetList', p); renderList(l); l.addEventListener('click', (e) => { const row = e.target.closest('.row'); if (row) rowClick(row); }); }
    }
    function tileAction(id) {
      const anchor = dockEl.more;
      closePanel();
      if (id === 'theme') { S.theme = S.theme === 'dark' ? 'light' : 'dark'; apply(); return; }
      if (id === 'art') { S.ambient = !S.ambient; apply(); toast(S.ambient ? T('ambientEffectOn') : T('ambientEffectOff')); return; }
      if (id === 'set') return openPanel('set', anchor, { wide: true });
      if (id === 'subopt' || id === 'sublang') return openPanel(id, anchor, { wide: true });
      if (id === 'notes') return notesAction(anchor);
      dockAction(id, anchor);
    }
    // Xem (dọc, ngang, Rạp): Ghi chú = the Keepit notes sheet / panel of the page, the same one the Keepit bar opens.
    // In the fullscreen Rạp only the host is drawn, so the sheet is slotted into the host while it is open (and goes back after).
    let kpT = 0, kpHome = null, kpMo = null;
    function kpNotes() { closePanel(); B.openNotes(); let n = 0; clearInterval(kpT); kpT = setInterval(() => { kpSync(); if (++n > 40) clearInterval(kpT); }, 50); }
    function kpSync(leave) {
      const s = document.getElementById('lhn-sidebar'), h = hostEl(); if (!h) return;
      const fs = !leave && !ov.hidden && document.fullscreenElement === h;
      if (s && fs && s.parentNode !== h) { kpHome = s.parentNode; s.slot = 'kpside'; h.appendChild(s); }
      else if (s && !fs && s.parentNode === h) { s.removeAttribute('slot'); (kpHome?.isConnected ? kpHome : document.documentElement).appendChild(s); }
      const inHost = !!s && s.parentNode === h, on = inHost && s.classList.contains('lhn-side-visible') && !s.classList.contains('lhn-closing');
      R.getElementById('kpscrim').hidden = !(on && matchMedia('(pointer: coarse) and (hover: none)').matches); // the bar's dim is outside the fullscreen element
      if (inHost && !kpMo) { kpMo = new MutationObserver(() => kpSync()); kpMo.observe(h, { childList: true }); kpMo.observe(s, { attributes: true, attributeFilter: ['class'] }); }
      else if (!inHost && kpMo) { kpMo.disconnect(); kpMo = null; }
    }
    R.getElementById('kpscrim').addEventListener('click', () => B.openNotes());
    function notesAction(anchor) {
      if (!isStudy()) { kpNotes(); return; }
      if (wClass() === 'e' && roomNotes()) { S.colNotes = !S.colNotes; apply(); return; }
      openPanel('notes', anchor, { wide: true });
    }
    function subFam(f) { return f === 'serif' ? 'Georgia,serif' : f === 'mono' ? 'ui-monospace,Menlo,monospace' : ''; }
    function applySubStyle() {
      const v = S.subStyle.video, s = S.subStyle.side;
      const fam = subFam, sz = SUB_SZ;
      ov.style.setProperty('--fs-en', `${19 * sz[v.size]}px`); ov.style.setProperty('--fs-vi', `${15.5 * sz[v.size]}px`);
      ov.style.setProperty('--fs-sen', `${15.5 * sz[s.size]}px`); ov.style.setProperty('--fs-svi', `${13 * sz[s.size]}px`);
      const st = ov.style;
      ['en', 'vi'].forEach((g) => { if (v[g] !== 'def') st.setProperty(`--${g}`, v[g]); else st.removeProperty(`--${g}`); });
      if (s.en !== 'def') st.setProperty('--sen', s.en); else st.removeProperty('--sen');
      if (s.vi !== 'def') st.setProperty('--svi', s.vi); else st.removeProperty('--svi');
      $$('.sub-en,.tsub .a').forEach((e) => { e.style.fontFamily = fam(v.font); e.style.fontWeight = v.bold ? '' : '500'; });
      $$('.sub-vi,.tsub .b').forEach((e) => { e.style.fontFamily = fam(v.font); });
      $$('.tsub .b').forEach((e) => { e.style.color = v.vi !== 'def' ? v.vi : ''; });
      $$('.tsub .a').forEach((e) => { e.style.color = v.en !== 'def' ? v.en : ''; });
      $('#tsub').className = `tsub bg-${v.bg}`;
      $('#list').style.fontFamily = fam(s.font); $('#list').classList.toggle('sbold', !!s.bold);
    }

    // ---------- dock actions ----------
    function dockAction(id, anchor) {
      const a = anchor || dockEl[id];
      switch (id) {
        case 'play': togglePlay(); break;
        case 'prev': go(-1); break;
        case 'next': go(1); break;
        case 'speed': openPanel('speed', a); break;
        case 'cc': openPanel('cc', a); break;
        case 'vol': openPanel('vol', a); break;
        case 'set': openPanel('set', a, { wide: true }); break; // only from ☰ now
        case 'more': openPanel('more', a); break;
        case 'notes': notesAction(a); break;
        case 'fav': setFav(!S.fav, dockEl.fav); break;
        case 'fs':
          if (S.rot) { exitTheater(); break; }
          if (sizeKey() === 's') { const was = S.realFs; if (was) exitFs(); else enterFs(false); S.realFs = !was; syncFs(); toast(S.realFs ? T('fullScreen') : T('exitedFullScreenStill')); break; }
          if (curView() === 'theater') exitTheater(); else setView('theater'); break;
        case 'rep': S.rep.on = !S.rep.on; S.rep.last = -1; syncRep(); toast(S.rep.on ? (S.rep.n === Infinity ? T('repeatSentenceContinuously') : T('repeatEach', S.rep.n)) : T('repeatOff')); break;
      }
    }
    let lpT = 0, lpFired = false;
    $('#drow').addEventListener('pointerdown', (e) => {
      const b = e.target.closest('[data-id="rep"]'); if (!b) return;
      lpFired = false; clearTimeout(lpT);
      lpT = setTimeout(() => { lpFired = true; vib(10); openPanel('rep', b); }, 500);
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => $('#drow').addEventListener(ev, () => clearTimeout(lpT)));
    $('#drow').addEventListener('contextmenu', (e) => { const b = e.target.closest('[data-id="rep"]'); if (b) { e.preventDefault(); openPanel('rep', b); } });
    $('#drow').addEventListener('click', (e) => {
      const b = e.target.closest('[data-id]'); if (!b) return;
      if (b.dataset.id === 'rep' && lpFired) { lpFired = false; return; }
      dockAction(b.dataset.id, b);
    });
    $('#btnSize').addEventListener('click', () => {
      if (isStudy()) { S.showVideo = !S.showVideo; apply(); return; }
      if (curView() === 'theater') { exitTheater(); return; }
      setMini(!S.mini[sizeKey()]);
    });
    $('#btnClose').addEventListener('click', () => B.close());
    $('#tabs').addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (b) setTab(b.dataset.tab); });
    $('#bd').addEventListener('click', (e) => {
      const b = e.target.closest('[data-act="colList"],[data-act="colNotes"]'); if (!b) return;
      // no room for the column → open it as a popover instead of squeezing the card
      if (b.dataset.act === 'colList') { if (!roomList()) return openPanel('slist', b); S.colList = !S.colList; }
      else { if (!roomNotes()) return openPanel('notes', b); S.colNotes = !S.colNotes; }
      apply();
    });

    // splitter: one value 25–80 %, snaps at 34 % (đọc) and 60 % (xem); pulling it to the far left folds the video into the bar
    (() => {
      const sp = $('#split'); let x0 = 0, w0 = 0, on = false, raf = 0, want = 0;
      sp.addEventListener('pointerdown', (e) => { on = true; x0 = e.clientX; w0 = S.split; sp.setPointerCapture(e.pointerId); sp.classList.add('drag'); ov.classList.add('dragging'); e.preventDefault(); });
      sp.addEventListener('pointermove', (e) => {
        if (!on) return; want = w0 + (e.clientX - x0) / S.scale / S.w * 100;
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          if (want < 22 && !S.mini.e) setMini(true); else if (want > 27 && S.mini.e) setMini(false);
          S.split = Math.round(Math.max(25, Math.min(80, want)) * 10) / 10; ov.style.setProperty('--split', `${S.split}%`);
        });
      });
      const end = () => { if (!on) return; on = false; cancelAnimationFrame(raf); raf = 0; sp.classList.remove('drag'); ov.classList.remove('dragging'); setSplit(Math.max(25, Math.min(80, want || S.split)), true); };
      sp.addEventListener('pointerup', end); sp.addEventListener('pointercancel', end);
      sp.addEventListener('dblclick', () => setSplit(S.split === 60 ? 34 : 60, true));
    })();
    // Nói/Chép landscape: dividers beside Danh sách (left) and Ghi chú (right); the study column keeps ≥ 420px
    $$('.csplit').forEach((sp) => {
      const side = sp.dataset.c; let x0 = 0, w0 = 0, on = false, raf = 0, want = 0;
      const lim = (v) => { const other = side === 'l' ? (notesOn() ? S.colW.r : 44) : (listOn() ? S.colW.l : 44); return Math.max(220, Math.min(460, S.w - other - 420, v)); };
      sp.addEventListener('pointerdown', (e) => { on = true; x0 = e.clientX; w0 = S.colW[side]; sp.setPointerCapture(e.pointerId); sp.classList.add('drag'); ov.classList.add('dragging'); e.preventDefault(); });
      sp.addEventListener('pointermove', (e) => {
        if (!on) return; const dx = (e.clientX - x0) / S.scale; want = lim(w0 + (side === 'l' ? dx : -dx));
        if (!raf) raf = requestAnimationFrame(() => { raf = 0; S.colW[side] = Math.round(want); setColVars(); });
      });
      const end = () => { if (!on) return; on = false; sp.classList.remove('drag'); ov.classList.remove('dragging'); placeAmb(); };
      sp.addEventListener('pointerup', end); sp.addEventListener('pointercancel', end);
      sp.addEventListener('dblclick', () => { S.colW[side] = side === 'l' ? 290 : 300; setColVars(); placeAmb(); });
    });
    // portrait: the list scrolls freely; pulling on past its top turns the bar back into the video, pushing on past its end
    // folds the video into the bar (tapping the bar still brings the video back)
    (() => {
      const l = $('#list'); let last = null, ey = null, dir = 0, done = false, edgeAt = 0, acc = 0, accT = 0;
      const ok = () => S.tab === 'view' && wClass() === 'c' && curView() !== 'theater';
      const atTop = () => l.scrollTop <= 0, atEnd = () => l.scrollTop + l.clientHeight >= l.scrollHeight - 1;
      const PULL = 56;
      l.addEventListener('scroll', () => { if (atTop() || atEnd()) { if (!edgeAt) edgeAt = performance.now(); } else edgeAt = 0; }, { passive: true });
      l.addEventListener('wheel', (e) => {
        if (!ok()) return;
        const now = performance.now(); if (now - accT > 400) acc = 0; accT = now;
        const up = e.deltaY < 0, edge = up ? atTop() && S.mini.c : atEnd() && !S.mini.c;
        if (!edge || (edgeAt && now - edgeAt < 250)) { acc = 0; return; } // momentum that just reached the edge does not count
        acc += Math.abs(e.deltaY); if (acc < 80) return; acc = 0;
        setMini(!up);
      }, { passive: true });
      l.addEventListener('touchstart', (e) => { last = e.touches[0].clientY; ey = null; dir = 0; done = false; }, { passive: true });
      l.addEventListener('touchmove', (e) => {
        if (last == null || done || !ok()) return;
        const y = e.touches[0].clientY, d = y - last; last = y; if (!d) return;
        const pullDown = d > 0 && atTop() && S.mini.c, pushUp = d < 0 && atEnd() && !S.mini.c;
        if (!pullDown && !pushUp) { ey = null; dir = 0; return; }
        const nd = pullDown ? 1 : -1; if (dir !== nd) { dir = nd; ey = y; return; }
        if (Math.abs(y - ey) / S.scale >= PULL) { done = true; setMini(!pullDown); }
      }, { passive: true });
      l.addEventListener('touchend', () => { last = null; });
      l.addEventListener('touchcancel', () => { last = null; });
    })();

    // ---------- tabs / study ----------
    function setTab(t) {
      if (S.tab === t) return;
      if (sizeKey() === 's' && t !== 'view') { toast(T('rotateToPortraitTo')); return; }
      setPlaying(false); speakAbort();
      S.tab = t; closePanel();
      if (isStudy() && !STUDY.length) loadStudy();
      if (isStudy() && !STUDY.length) { const st = B.state() || {}; S.tab = 'view'; toast(B.t(st.loadingFor && st.loadingFor === st.sourceId ? 'dictationCaptionsLoading' : st.sourceType === 'web' ? 'dictationWebTextUnavailable' : 'dictationEnglishOnly')); }
      useSent();
      B.setActivity(S.tab === 'speak' ? 'shadowing' : S.tab === 'write' ? 'dictation' : null);
      if (isStudy()) { clampStudy(); S.t = SENT[S.si[S.tab]].start; seekMedia(S.t); resetStudy(); translateAround(S.si[S.tab]); }
      lastKey = ''; apply();
    }
    function doneCount() { return Object.keys(S.res[S.tab] || {}).length; }
    function ring(done, total, size = 28) {
      const r = size / 2 - 3, c = 2 * Math.PI * r, f = done / total;
      return `<svg viewBox="0 0 ${size} ${size}" style="transform:rotate(-90deg)"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="rgba(148,163,184,.3)" stroke-width="3"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--acc)" stroke-width="3" stroke-linecap="round" stroke-dasharray="${(c * f).toFixed(1)} ${c.toFixed(1)}"/></svg>`;
    }
    function resetStudy() { S.sp = { phase: 'idle', heard: [], score: 0, attempt: S.sp.attempt }; S.wr = { phase: 'idle', val: '', acc: 0, ops: null }; }
    function setStudyIndex(i) {
      i = Math.max(0, Math.min(SENT.length - 1, i));
      speakAbort(); S.si[S.tab] = i; S.reach[S.tab] = Math.max(S.reach[S.tab] || 0, i); S.t = SENT[i].start; seekMedia(S.t); setPlaying(false); resetStudy(); queueStudySave(); translateAround(i);
      renderStudy(); renderSideHd(); refreshLesson(); markCur(true); tick(true);
    }
    function studyGo(d, anim = true, swipe = false) {
      const i = (goPend ? goPend.i : S.si[S.tab]) + d; // a pending change counts as already made
      if (i < 0) return;
      if (i >= SENT.length) { openPanel('summary', null, { center: !sheetMode() }); return; }
      if (swipe) { // finger swipe keeps the original effect: the whole card follows the finger and slides away
        const card = $('#scard');
        if (goPend) { clearTimeout(goPend.t); goPend = null; }
        if (anim && card && !reduceMotion()) {
          const dir = d > 0 ? -1 : 1, w = card.offsetWidth || 360; // carries on from where the finger let go
          card.classList.remove('drag'); card.style.transition = 'transform .2s cubic-bezier(.3,.7,.4,1), opacity .2s';
          card.style.transform = `translateX(${Math.round(dir * w * 1.05)}px) rotate(${dir * 7}deg)`; card.style.opacity = '0';
          goPend = { i, t: setTimeout(() => {
            goPend = null; setStudyIndex(i);
            const nc = $('#scard'); if (!nc) return;
            nc.style.setProperty('--sx', `${-dir * 40}px`); nc.classList.add('sw-in'); nc.addEventListener('animationend', () => nc.classList.remove('sw-in'), { once: true });
          }, 190) };
        } else setStudyIndex(i);
        return;
      }
      // demo v16 · cách A: the card frame, buttons and input stay put; only the sentence content fades out (80ms)
      // and the new one fades in with an 8px slide in the travel direction (160ms). Reduced motion → instant.
      if (goPend) { clearTimeout(goPend.t); goPend = null; } // fast repeat: restart from the faded state, never stack
      const body = R.querySelector('#scard .sbody');
      const typing = R.activeElement?.id === 'wta';
      const done = () => {
        goPend = null; setStudyIndex(i);
        if (typing) { const t = $('#wta'); if (t && !t.readOnly) t.focus({ preventScroll: true }); }
        const nb = anim && !reduceMotion() ? R.querySelector('#scard .sbody') : null;
        if (nb) { nb.style.setProperty('--sx', `${d > 0 ? 8 : -8}px`); nb.classList.add('sx-in'); nb.addEventListener('animationend', () => nb.classList.remove('sx-in'), { once: true }); }
      };
      if (!anim || !body || reduceMotion()) { done(); return; }
      body.style.setProperty('--sx', `${d > 0 ? -8 : 8}px`);
      body.classList.add('sx-out');
      goPend = { i, t: setTimeout(done, 80) };
    }
    let goPend = null;
    const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
    function renderSideHd() {
      if (!isStudy()) { $('#sideHd').innerHTML = ''; return; }
      const d = doneCount();
      $('#sideHd').innerHTML = `<span class="t">${T('sentenceList')} <span style="color:var(--mu);font-weight:600;font-size:12.5px">· ${d}/${SENT.length}</span></span>${wClass() === 'e' && sizeKey() !== 's' ? `<button class="ib" data-act="colList" title="${T('hideSentenceList')}">${ic('panel')}</button>` : ''}<button class="pill" data-act="summary" style="height:34px;padding:0 11px;font-size:12.5px">${ic('trophy')}${T('finish')}</button>`;
    }
    $('#sideHd').addEventListener('click', (e) => { const b = e.target.closest('[data-act]'); if (!b) return; if (b.dataset.act === 'summary') openPanel('summary', null, { center: !sheetMode() }); });
    function renderNotesCol() {
      const el = $('#notesCol');
      if (!isStudy()) { el.innerHTML = ''; return; }
      requestAnimationFrame(growTn);
      el.innerHTML = `<div class="notes-hd"><span class="t">${T('lessonNotes')}</span><button class="ib" data-act="colNotes" title="${T('hideNotesColumn')}">${ic('panelR')}</button></div><div class="nlist">${lessonInner('c')}</div>`;
    }
    function cardHead() {
      const d = doneCount(), i = S.si[S.tab];
      const showNotesBtn = !(wClass() === 'e' && notesOn());
      const tgl = S.tab === 'speak'
        ? `<button class="tg ${S.showTr ? 'on' : ''}" data-sact="tr" title="${T('showTranslation')}">${ic('subLanguage')}<span>${T('translate')}</span></button><button class="tg ${S.auto ? 'on' : ''}" data-sact="auto" title="${T('autoAdvanceAt80')}">${ic('sparkles')}<span>${T('auto')}</span></button>`
        : `<button class="tg ${S.showTr ? 'on' : ''}" data-sact="tr" title="${T('showTranslation')}">${ic('subLanguage')}<span>${T('translate')}</span></button><button class="tg ${S.hints ? 'on' : ''}" data-sact="hints" title="${T('firstLetterHints')}">${ic('bulb')}<span>${T('hint')}</span></button>`;
      return `<div class="scard-hd"><button class="chip" data-sact="chip" title="${T('sentenceList')}">${ring(d, SENT.length)}<span class="lab">${i + 1}/${SENT.length}<small class="ctm"><i> · </i>${fmt(SENT[i].start)}</small></span></button><span class="sp"></span>${tgl}${showNotesBtn ? `<button class="tg" data-sact="notes" title="${T('note')}">${ic('notes')}</button>` : ''}</div>`;
    }
    function renderStudy() {
      { const t = $('#sptoast'); if (t && (!isStudy() || t.dataset.tab !== S.tab || +t.dataset.i !== S.si[S.tab])) hideStudyToast(true); }
      const el = $('#study');
      if (!isStudy()) { el.innerHTML = ''; return; }
      const i = S.si[S.tab], s = SENT[i];
      if (S.tab === 'speak') {
        const sp = S.sp;
        const tw = words(s.en);
        const target = tw.map((w, k) => { const st = sp.phase === 'done' ? sp.heard[k] : ''; return `<span class="w ${st || ''}">${esc(w)}</span>`; }).join(' ');
        let mid = '';
        if (sp.phase === 'idle') mid = `<p class="help tch">${T('tapTheMicTo')}</p><p class="help kbdh">${T('pressEnterOrTap')}</p>`;
        if (sp.phase === 'rec') mid = `<div class="lbars">${Array.from({ length: 9 }, (_, k) => `<i style="animation-delay:${k * 0.09}s"></i>`).join('')}</div><div class="heard" id="heard">${T('listening')}</div>`;
        if (sp.phase === 'done') mid = `<p class="help legend">${T('greenCorrectOrangeClose')}</p>`;
        el.innerHTML = `<div class="scard" id="scard">${cardHead()}<div class="sbody"><div class="target">${target}</div>${S.showTr || sp.phase === 'done' ? `<div class="trans">${esc(s.vi || '…')}</div>` : ''}${mid}<p class="help" style="font-size:11.5px;margin-top:auto">${T('aTemporaryMemoryOnly')}</p></div>
          <div class="sctl"><div class="r main"><button class="pill" data-sact="model" title="${T('listenModelKey')}">${ic('ear')}<span>${T('listen')}</span></button><button class="mic ${sp.phase === 'rec' ? 'rec' : ''}" data-sact="mic" aria-label="Micro (Enter)">${ic('mic')}</button>${sp.phase === 'done' ? `<button class="pill pri" data-sact="next">${T('next')} ${ic('arrowR')}</button>` : `<button class="pill" data-sact="next" title="${T('next')}">${T('skip')} ${ic('arrowR')}</button>`}</div>
          ${sp.phase === 'done' ? `<div class="r" style="gap:8px"><button class="pill" data-sact="playrec" style="height:34px">${ic('replay')}${T('replayYourVoice')}</button><button class="pill" data-sact="retry" style="height:34px">${ic('mic')}${T('tryAgain')}</button></div>` : ''}
          <p class="help kbdh">${T('speakKeysHint')}</p><p class="help tch">${T('swipeLeftRightOn')}</p></div></div>`;
      } else {
        const wr = S.wr;
        const hint = esc(words(s.en).map((w) => { const c = [...w]; return c[0] + c.slice(1).join('').replace(/[\p{L}\p{N}]/gu, '_'); }).join('  '));
        let res = '';
        if (wr.phase === 'done' || wr.phase === 'wrong') {
          const okAll = wr.phase === 'done';
          res = `<div class="rpanel ${okAll ? 'ok' : 'err'}"><div class="rt">${ic(okAll ? 'check' : 'alert')}<b>${okAll ? T('correctSentence') : T('errorAnalysis')}</b><span class="sp"></span><span class="acc">${wr.acc}%</span></div><div class="diff">${wr.ops.map((o) => o.t === 'ok' ? `<span class="ok">${esc(o.w)}</span>` : o.t === 'bad' ? `<span class="bad">${esc(o.w)}</span> <span class="fix">${esc(o.fix)}</span>` : o.t === 'mis' ? `<span class="mis">${esc(o.w)}</span>` : `<span class="bad">${esc(o.w)}</span> <span class="fix">${T('extra')}</span>`).join(' ')}</div></div>`;
        }
        el.innerHTML = `<div class="scard" id="scard">${cardHead()}<div class="sbody">${S.hints && wr.phase !== 'done' ? `<div class="hint">${hint}</div>` : ''}${res}${S.showTr || wr.phase !== 'idle' ? `<div class="trans">${esc(s.vi || '…')}</div>` : ''}</div>
          <div class="wbox"><textarea id="wta" placeholder="${T('typeTheSentenceYou')}" ${wr.phase === 'done' ? 'readonly' : ''}>${esc(wr.val)}</textarea><div class="r"><button class="pill lis ${S.playing ? 'on' : ''}" data-sact="model" title="${T('replayCtrl')}">${ic('vol')}${T('replay')}</button>${wr.phase === 'done' ? `<span class="help kbdh" style="text-align:left">${T('enterNextSentenceEsc')}</span><span class="sp"></span><button class="pill" data-sact="retry">${ic('replay')}${T('redo')}</button><button class="pill pri" data-sact="next">${T('next')} ${ic('arrowR')}</button>` : `<span class="help kbdh" style="text-align:left">${wr.phase === 'wrong' ? T('fixTheSentenceThen') : T('enterCheckEscAnswer')}</span><span class="sp"></span><button class="pill" data-sact="word">${ic('bulb')}${T('oneWord')}</button><button class="pill pri" data-sact="check">${ic('check')}${T('check')}</button>`}</div></div></div>`;
        const ta = $('#wta');
        const grow = () => { const card = $('#scard'); if (!card || !ta.isConnected) return; ta.style.height = 'auto'; ta.style.height = `${Math.min(ta.scrollHeight + 2, Math.max(120, card.clientHeight * 0.42))}px`; };
        ta.addEventListener('input', () => { S.wr.val = ta.value; grow(); }); requestAnimationFrame(grow);
        if (wr.phase === 'wrong' && S.wrFocus) { S.wrFocus = false; setTimeout(() => { const t = $('#wta'); if (t) { t.focus(); t.setSelectionRange(t.value.length, t.value.length); } }, 0); }
        ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (S.wr.phase === 'done') studyGo(1); else writeCheck(); } if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); if (S.wr.phase === 'done') { resetStudy(); renderStudy(); } else { S.wr.val = s.en; writeCheck(); } } });
      }
      bindSwipe($('#scard'));
      fitStudy();
    }
    function rowOver(r) {
      const cs = getComputedStyle(r), gap = parseFloat(cs.columnGap) || 0, inner = r.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const kids = [...r.children].filter((k) => k.offsetWidth && !k.classList.contains('sp')), w = (k) => Math.max(k.offsetWidth, k.scrollWidth);
      if (r.classList.contains('main') && kids.length === 3) return 2 * Math.max(w(kids[0]), w(kids[2])) + w(kids[1]) + 2 * gap - inner;
      return kids.reduce((a, k) => a + w(k), 0) + gap * Math.max(0, kids.length - 1) - inner;
    }
    function wrapPills(root) {
      root.querySelectorAll('.pill').forEach((p) => {
        p.querySelectorAll(':scope > span:not(.pl)').forEach((sp) => { if (sp.textContent.trim()) sp.classList.add('pl'); });
        [...p.childNodes].forEach((n) => { if (n.nodeType === 3 && n.textContent.trim()) { const sp = document.createElement('span'); sp.className = 'pl'; sp.textContent = n.textContent.trim(); n.replaceWith(sp); } });
        if (!p.getAttribute('aria-label') && p.textContent.trim()) p.setAttribute('aria-label', p.textContent.trim());
      });
    }
    function fadeBody() { const b = $('#scard .sbody'); if (!b) return; b.classList.toggle('ft', b.scrollTop > 2); b.classList.toggle('fb', b.scrollTop + b.clientHeight < b.scrollHeight - 2); }
    function fitStudy() {
      const pl = $('#player'); pl.classList.toggle('pc-n', pl.classList.contains('card') && pl.clientWidth < 360); // small card: tap the thumbnail to enlarge
      const card = $('#scard'); if (!card || !isStudy()) return;
      const hd = card.querySelector('.scard-hd');
      if (hd) { hd.classList.remove('f-nonotes', 'f-ico'); if (rowOver(hd) > 1) hd.classList.add('f-nonotes'); if (rowOver(hd) > 1) hd.classList.add('f-ico'); }
      card.querySelectorAll('.wbox .r, .sctl .r.main').forEach((r) => {
        wrapPills(r); r.classList.remove('f-nokbd', 'f-ico', 'f-ico2');
        const k = r.querySelector('.kbdh'), lh = k ? parseFloat(getComputedStyle(k).lineHeight) || parseFloat(getComputedStyle(k).fontSize) * 1.3 : 0;
        if (rowOver(r) > 1 || (k && k.offsetHeight > lh * 2.3)) r.classList.add('f-nokbd');
        if (rowOver(r) > 1) r.classList.add('f-ico');
        if (rowOver(r) > 1) r.classList.add('f-ico2');
      });
      const b = card.querySelector('.sbody'); if (b && !b.dataset.fd) { b.dataset.fd = '1'; b.addEventListener('scroll', fadeBody, { passive: true }); }
      fadeBody();
    }
    new ResizeObserver(() => fitStudy()).observe(R.getElementById('study'));
    $('#study').addEventListener('click', (e) => {
      const b = e.target.closest('[data-sact]'); if (!b) return;
      const a = b.dataset.sact;
      if (a === 'chip') { if (wClass() === 'c' || !roomList()) openPanel('slist', b); else { S.colList = true; apply(); markCur(true); } return; }
      if (a === 'tr') { S.showTr = !S.showTr; renderStudy(); saveUi(); return; }
      if (a === 'auto') { S.auto = !S.auto; renderStudy(); saveUi(); toast(S.auto ? T('autoAdvanceAt80') : T('autoOff')); return; }
      if (a === 'hints') { S.hints = !S.hints; renderStudy(); saveUi(); return; }
      if (a === 'notes') { notesAction(b); return; }
      if (a === 'model') { S.t = SENT[S.si[S.tab]].start; seekMedia(S.t); setPlaying(true); if (S.tab === 'write') renderStudy(); return; }
      if (a === 'mic') { speakToggle(); return; }
      if (a === 'next') { studyGo(1); return; }
      if (a === 'retry') { speakAbort(); resetStudy(); renderStudy(); return; }
      if (a === 'playrec') { if (SPK.url) { toast(T('playingYourRecording')); playRec(); } else toast(B.t('dictationSpeakRecordingUnavailable')); return; }
      if (a === 'check') { writeCheck(); return; }
      if (a === 'word') { const tw = words(SENT[S.si.write].en); const have = words(S.wr.val).length; S.wr.val = tw.slice(0, have + 1).join(' ') + ' '; renderStudy(); const ta = $('#wta'); ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); return; }
    });
    function bindSwipe(card) {
      // the whole card follows the finger (tilt) and slides away (demo v17); a swipe may start anywhere on the card on touch —
      // buttons and the answer box too (a tap stays a tap). Touch = touch events (they keep coming past the card edge and the
      // browser never cancels them); mouse / pen ("Chạm" mode) = pointer events, not from buttons / fields (clicks, selection).
      if (!card) return;
      let g = null, eatClick = 0;
      const W = () => card.offsetWidth || 360;
      const begin = (x, y, touch, tgt) => {
        g = null;
        if (tgt.closest('input[type=range],.rng')) return;
        if (!touch && tgt.closest('button,textarea,input,select,a')) return;
        if (touch && tgt.closest('textarea') === R.activeElement && tgt.selectionStart !== tgt.selectionEnd) return; // selecting text
        g = { x, y, dx: 0, mode: '', s: [{ t: performance.now(), x }] };
      };
      const move = (x, y) => {
        if (!g) return false;
        const dx = (x - g.x) / S.scale, dy = (y - g.y) / S.scale;
        g.s.push({ t: performance.now(), x }); if (g.s.length > 8) g.s.shift();
        if (!g.mode) {
          if (Math.hypot(dx, dy) < 8) return false;
          g.mode = Math.abs(dx) > Math.abs(dy) * 1.15 ? 'h' : 'v';
          if (g.mode === 'v') { g = null; return false; }
          card.classList.add('drag'); card.style.transition = 'none';
        }
        const cur = S.si[S.tab], edge = (dx > 0 && cur <= 0), fx = edge ? dx * 0.3 : dx; // nothing before the first sentence: rubber band
        g.dx = dx;
        card.style.transform = `translateX(${fx.toFixed(1)}px) rotate(${(fx / W() * 7).toFixed(2)}deg)`;
        card.style.opacity = String((1 - Math.min(0.35, Math.abs(fx) / W() * 0.45)).toFixed(3));
        return true;
      };
      const back = () => {
        card.classList.remove('drag'); card.style.transition = 'transform .24s cubic-bezier(.3,.7,.4,1), opacity .24s';
        card.style.transform = ''; card.style.opacity = '';
        setTimeout(() => { if (!card.classList.contains('drag')) card.style.transition = ''; }, 260);
      };
      const end = (cancel) => {
        const s0 = g; g = null; if (!s0 || s0.mode !== 'h') return;
        eatClick = Date.now() + 350;
        if (cancel) { back(); return; }
        const now = performance.now(), pts = s0.s.filter((p) => now - p.t < 120);
        const v = pts.length > 1 ? (pts[pts.length - 1].x - pts[0].x) / Math.max(1, pts[pts.length - 1].t - pts[0].t) / S.scale : 0;
        const d = s0.dx < 0 ? 1 : -1, target = S.si[S.tab] + d;
        const go = Math.abs(s0.dx) > Math.min(90, W() * 0.25) || (Math.abs(v) > 0.45 && Math.abs(s0.dx) > 30 && Math.sign(v) === Math.sign(s0.dx));
        if (go && target >= 0 && target < SENT.length) { vib(8); studyGo(d, true, true); return; }
        back();
        if (go && target >= SENT.length) studyGo(d); // past the last sentence: the summary, like the next button
      };
      card.addEventListener('touchstart', (e) => { if (e.touches.length !== 1) { if (g?.mode === 'h') end(true); g = null; return; } const t = e.touches[0]; begin(t.clientX, t.clientY, true, e.target); }, { passive: true });
      card.addEventListener('touchmove', (e) => { if (!g || e.touches.length !== 1) return; const t = e.touches[0]; if (move(t.clientX, t.clientY) && e.cancelable) e.preventDefault(); }, { passive: false });
      card.addEventListener('touchend', () => end(false));
      card.addEventListener('touchcancel', () => end(true));
      card.addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch' || e.button > 0) return; begin(e.clientX, e.clientY, false, e.target); if (g) g.pid = e.pointerId; });
      card.addEventListener('pointermove', (e) => { if (!g || e.pointerType === 'touch' || e.pointerId !== g.pid) return; if (move(e.clientX, e.clientY) && !g.cap) { g.cap = true; try { card.setPointerCapture(e.pointerId); } catch (_) {} } });
      card.addEventListener('pointerup', (e) => { if (e.pointerType !== 'touch') end(false); });
      card.addEventListener('pointercancel', (e) => { if (e.pointerType !== 'touch') end(true); });
      card.addEventListener('click', (e) => { if (Date.now() < eatClick) { e.stopPropagation(); e.preventDefault(); } }, true);
    }
    // ---------- Nói: microphone recording + speech recognition (rules kept from the old shadowing activity, removed in v3.5.196) ----------
    const SPK = { rec: null, recorder: null, stream: null, chunks: [], url: '', audio: null, gen: 0, finals: [], timer: 0, stopping: false, err: '', live: '' };
    const ENDPOINT_MS = 1500;
    function speechLang() {
      const st = B.state() || {};
      if (st.sourceType === 'web') { const l = st.webSourceDetectedLanguage || st.webSourceLanguageHint || navigator.language || 'en-US'; return globalThis.LHN_TTS?.normalizeLanguage?.(l) || l; }
      return /^en(?:-|$)/i.test(st.sourceLanguage || '') ? st.sourceLanguage : 'en-US';
    }
    function stopTracks() { try { SPK.stream?.getTracks().forEach((t) => t.stop()); } catch (_) {} SPK.stream = null; }
    function clearRec() { if (SPK.audio) { try { SPK.audio.pause(); } catch (_) {} SPK.audio = null; } if (SPK.url) { try { URL.revokeObjectURL(SPK.url); } catch (_) {} SPK.url = ''; } }
    function stopRecorder() {
      const r = SPK.recorder; SPK.recorder = null;
      if (!r || r.state === 'inactive') { stopTracks(); return Promise.resolve(SPK.url); }
      return new Promise((res) => {
        r.onstop = () => { try { if (SPK.chunks.length) { clearRec(); SPK.url = URL.createObjectURL(new Blob(SPK.chunks, { type: r.mimeType || SPK.chunks[0].type || 'audio/webm' })); } } catch (_) {} SPK.chunks = []; stopTracks(); res(SPK.url); };
        try { r.stop(); } catch (_) { stopTracks(); res(''); }
      });
    }
    function speakAbort() {
      SPK.gen++; clearTimeout(SPK.timer);
      const rec = SPK.rec; SPK.rec = null;
      if (rec) { rec.onresult = rec.onerror = rec.onend = null; try { rec.abort(); } catch (_) {} }
      const r = SPK.recorder; SPK.recorder = null; if (r && r.state !== 'inactive') { r.onstop = null; try { r.stop(); } catch (_) {} }
      SPK.chunks = []; stopTracks();
      if (SPK.audio) { try { SPK.audio.pause(); } catch (_) {} SPK.audio = null; }
    }
    function playRec() {
      if (!SPK.url) return Promise.resolve(false);
      setPlaying(false);
      if (SPK.audio) { try { SPK.audio.pause(); } catch (_) {} }
      return new Promise((res) => {
        try { const a = new Audio(SPK.url); SPK.audio = a; const done = (ok) => { if (SPK.audio === a) SPK.audio = null; res(ok); }; a.onended = () => done(true); a.onerror = () => done(false); a.onpause = () => { if (!a.ended) done(false); }; a.play().catch(() => done(false)); } catch (_) { res(false); }
      });
    }
    async function speakToggle() {
      if (S.sp.phase === 'rec') { // stop: the recognizer delivers its last words, then the attempt is scored
        clearTimeout(SPK.timer); SPK.stopping = true;
        if (SPK.rec) { try { SPK.rec.stop(); } catch (_) { speakEnd(); } } else speakEnd();
        return;
      }
      if (S.sp.phase === 'done') resetStudy();
      const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (typeof Rec !== 'function') { toast(B.t('dictationSpeakUnsupported')); return; }
      setPlaying(false); speakAbort(); clearRec();
      const gen = SPK.gen, i = S.si.speak;
      S.sp.phase = 'rec'; S.sp.attempt++; Object.assign(SPK, { finals: [], live: '', stopping: false, err: '' });
      renderStudy();
      try {
        const stream = await navigator.mediaDevices?.getUserMedia?.({ audio: true });
        if (stream) {
          if (gen !== SPK.gen) { stream.getTracks().forEach((t) => t.stop()); return; }
          SPK.stream = stream; const r = new MediaRecorder(stream); SPK.chunks = [];
          r.ondataavailable = (e) => { if (e.data?.size) SPK.chunks.push(e.data); }; r.start(); SPK.recorder = r;
        }
      } catch (_) { stopTracks(); }
      if (gen !== SPK.gen || S.tab !== 'speak' || S.si.speak !== i) return;
      const start = () => {
        const rec = new Rec(); SPK.rec = rec;
        rec.lang = speechLang(); rec.continuous = true; rec.interimResults = true; rec.maxAlternatives = 1;
        let fin = '', inter = '';
        rec.onresult = (e) => {
          const f = [], m = [];
          for (let k = 0; k < e.results.length; k++) { const x = String(e.results[k]?.[0]?.transcript || '').trim(); if (x) (e.results[k].isFinal ? f : m).push(x); }
          fin = f.join(' '); inter = m.join(' ');
          SPK.live = [...SPK.finals, fin, inter].filter(Boolean).join(' ');
          const h = $('#heard'); if (h) h.textContent = SPK.live || T('listening');
          clearTimeout(SPK.timer);
          if (SPK.live) SPK.timer = setTimeout(() => { if (gen === SPK.gen && SPK.rec === rec) { SPK.stopping = true; try { rec.stop(); } catch (_) { speakEnd(); } } }, ENDPOINT_MS);
        };
        rec.onerror = (e) => {
          const c = String(e?.error || '');
          SPK.err = c === 'not-allowed' || c === 'service-not-allowed' || c === 'audio-capture' ? 'dictationSpeakDenied' : c === 'network' ? 'dictationSpeakNetwork' : c === 'no-speech' ? 'dictationSpeakNoSpeech' : c === 'aborted' ? '' : 'dictationSpeakError';
          if (SPK.err && SPK.err !== 'dictationSpeakNoSpeech') SPK.stopping = true;
        };
        rec.onend = () => {
          if (SPK.rec !== rec || gen !== SPK.gen) return;
          const seg = [fin, inter].filter(Boolean).join(' ').trim(); if (seg) SPK.finals.push(seg);
          if (!SPK.stopping && S.tab === 'speak' && S.si.speak === i) { try { start(); return; } catch (_) {} } // stopped by itself on silence: keep listening
          speakEnd();
        };
        rec.start();
      };
      try { start(); } catch (_) { speakAbort(); S.sp.phase = 'idle'; renderStudy(); toast(B.t('dictationSpeakError')); }
    }
    async function speakEnd() {
      const gen = SPK.gen, i = S.si.speak; SPK.rec = null; clearTimeout(SPK.timer);
      const transcript = SPK.finals.join(' ').replace(/\s+/g, ' ').trim();
      const url = await stopRecorder();
      if (gen !== SPK.gen || S.tab !== 'speak' || S.si.speak !== i) return;
      if (!transcript) { S.sp = { ...S.sp, phase: 'idle' }; renderStudy(); toast(B.t(SPK.err || 'dictationSpeakNoSpeech')); return; }
      const score = speakFinish(transcript);
      const played = url ? await playRec() : false;
      if (S.auto && score >= 80) setTimeout(() => { if (gen === SPK.gen && S.tab === 'speak' && S.si.speak === i && S.sp.phase === 'done' && !SPK.audio) studyGo(1); }, played ? 600 : 1500);
    }
    function speakFinish(transcript) {
      const i = S.si.speak, ref = SENT[i].en, tw = words(ref);
      const result = globalThis.LHN_STUDY_SCORE.score(ref, transcript);
      // score units (regex words) → the whitespace words the card colours: ok / near (wrong) / miss
      const raw = [...ref.matchAll(/[\p{L}\p{N}’‘`´']+/gu)], offs = [];
      { let p = 0; for (const w of tw) { const s = ref.indexOf(w, p); offs.push([s, s + w.length]); p = s + w.length; } }
      const wordAt = (ri) => { const at = raw[ri]?.index ?? -1; return offs.findIndex(([a, b]) => at >= a && at < b); };
      const rank = { ok: 0, near: 1, miss: 2 }, heard = tw.map(() => 'ok');
      for (const op of result.ops) {
        const st = op.type === 'ok' ? 'ok' : op.type === 'wrong' ? 'near' : op.type === 'missing' ? 'miss' : null; if (!st) continue;
        for (const ri of op.expectedIndices || []) { const k = wordAt(ri); if (k >= 0 && rank[st] > rank[heard[k]]) heard[k] = st; }
      }
      const score = result.percent;
      heard.forEach((h, k) => { if (h !== 'ok') S.weak.add(norm(tw[k])); });
      recordWrong('speak', i, result, ref);
      S.sp = { ...S.sp, phase: 'done', heard, score, toast: true };
      const tier = speakTier(score);
      if (tier === 'pass') { playSuccessSound(); confetti(); } else playErrorSound();
      showStudyToast(speakToastHTML(score));
      S.res.speak[i] = Math.max(score, S.res.speak[i] || 0);
      vib(tier === 'pass' ? 25 : [20, 60, 20]);
      queueStudySave();
      renderStudy(); renderList(); renderSideHd(); refreshLesson();
      return score;
    }
    // ---------- result feedback (same as the app: dictation.js playSuccessSound / playErrorSound / localConfetti, shadowing toast) ----------
    let audioCtx = null, spToastT = 0;
    function actx() { try { audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)(); if (audioCtx.state === 'suspended') audioCtx.resume(); return audioCtx; } catch { return null; } }
    function playSuccessSound() {
      const ac = actx(); if (!ac) return; const now = ac.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => { const o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = f; g.gain.setValueAtTime(0.15, now + i * 0.08); g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.3); o.connect(g); g.connect(ac.destination); o.start(now + i * 0.08); o.stop(now + i * 0.08 + 0.3); });
    }
    function playErrorSound() {
      const ac = actx(); if (!ac) return; const now = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(150, now); o.frequency.linearRampToValueAtTime(100, now + 0.2);
      g.gain.setValueAtTime(0.2, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.25); o.connect(g); g.connect(ac.destination); o.start(now); o.stop(now + 0.25);
    }
    function confetti() {
      const layer = document.createElement('div'); layer.className = 'cft-layer'; layer.setAttribute('aria-hidden', 'true');
      const colors = ['#22c55e', '#ef4444', '#f59e0b'];
      for (let i = 0; i < 90; i++) {
        const bit = document.createElement('span'); bit.className = 'cft';
        const ang = (Math.random() - 0.5) * (80 * Math.PI / 180) * 2, sp = 180 + Math.random() * 260;
        bit.style.backgroundColor = colors[i % 3];
        bit.style.setProperty('--ux', `${Math.round(Math.sin(ang) * sp)}px`); bit.style.setProperty('--uy', `${Math.round(-Math.cos(ang) * sp)}px`);
        bit.style.setProperty('--dx', `${Math.round(Math.sin(ang) * sp * 1.25)}px`); bit.style.setProperty('--dy', `${Math.round(160 + Math.random() * 260)}px`);
        bit.style.setProperty('--rot', `${Math.round(Math.random() * 720 - 360)}deg`);
        layer.appendChild(bit);
      }
      ov.appendChild(layer); setTimeout(() => layer.remove(), 1500);
    }
    function speakCopy(p) {
      const s = Math.max(0, Math.min(100, Math.round(p)));
      const TIERS = [[9, T('letSWarmUp'), T('noWorriesKeepSpeaking')], [19, T('youVeStarted'), T('youVeGotThe')], [29, T('thereSASignal'), T('someWordsAreHeading')], [39, T('almostInRhythm'), T('youReCloserTo')], [49, T('pickingUp'), T('youSaidQuiteA')], [59, T('gettingIntoTheGroove'), T('youReHalfwayThere')], [64, T('greatProgress'), T('youVeGotMost')], [69, T('justOneMoreStep'), T('youReVeryClose')], [74, T('passedKeepItUp'), T('youVeReachedThe')], [79, T('prettyAccurate'), T('youReDoingGreat')], [84, T('veryGoodKeepIt'), T('yourPronunciationIsSolid')], [89, T('almostPerfect'), T('youSpokeClearlyAnd')], [94, T('excellent'), T('youReMasteringThe')], [99, T('topNotchPronunciation'), T('hardlyAnythingToFault')], [100, T('perfectOutstanding'), T('incredibleYouVeConquered')]];
      const r = TIERS.find(([m]) => s <= m); return { title: r[1], desc: r[2] };
    }
    function hideStudyToast(now) { clearTimeout(spToastT); const t = $('#sptoast'); if (!t) return; if (now) { t.remove(); return; } t.classList.add('exit'); setTimeout(() => t.remove(), 300); }
    function showStudyToast(html) {
      hideStudyToast(true);
      $('#bd').insertAdjacentHTML('beforeend', html);
      const t = $('#sptoast'); t.dataset.tab = S.tab; t.dataset.i = S.si[S.tab];
      t.addEventListener('click', () => hideStudyToast());
      spToastT = setTimeout(() => hideStudyToast(), 6000);
    }
    function writeToastHTML() {
      const C = 2 * Math.PI * 21;
      return `<div class="sptoast pass" id="sptoast" role="status"><div class="ring"><svg viewBox="0 0 50 50"><circle cx="25" cy="25" r="21" class="bg"/><circle cx="25" cy="25" r="21" class="fg" stroke-dasharray="${C.toFixed(1)} ${C.toFixed(1)}"/></svg><b>100%</b></div><div class="tx"><b>${T('n100Correct')}</b><small>${T('youTypedTheWhole')}</small></div></div>`;
    }
    function speakToastHTML(score) {
      const c = speakCopy(score), t = speakTier(score), C = 2 * Math.PI * 21;
      return `<div class="sptoast ${t}" id="sptoast" role="status"><div class="ring"><svg viewBox="0 0 50 50"><circle cx="25" cy="25" r="21" class="bg"/><circle cx="25" cy="25" r="21" class="fg" stroke-dasharray="${(C * score / 100).toFixed(1)} ${C.toFixed(1)}"/></svg><b>${score}%</b></div><div class="tx"><b>${c.title}</b><small>${c.desc}</small></div></div>`;
    }
    function writeCheck() {
      const i = S.si.write, ref = SENT[i].en;
      const result = globalThis.LHN_STUDY_SCORE.score(ref, S.wr.val);
      const ops = result.ops.map((o) => (o.type === 'ok' ? { t: 'ok', w: o.expected } : o.type === 'wrong' ? { t: 'bad', w: o.typed, fix: o.expected } : o.type === 'missing' ? { t: 'mis', w: o.expected } : { t: 'extra', w: o.typed }));
      result.ops.forEach((o) => { if (o.type === 'wrong' || o.type === 'missing') S.weak.add(norm(o.expected)); });
      const accv = result.percent;
      const okAll = !!result.perfect;
      S.wr = { phase: okAll ? 'done' : 'wrong', val: S.wr.val, acc: accv, ops };
      S.wrFocus = !okAll;
      if (okAll) { playSuccessSound(); confetti(); } else playErrorSound();
      if (okAll) setTimeout(() => showStudyToast(writeToastHTML()), 0); else hideStudyToast(true);
      recordWrong('write', i, result, ref);
      S.res.write[i] = Math.max(accv, S.res.write[i] || 0);
      vib(okAll ? 25 : [20, 60, 20]);
      queueStudySave();
      renderStudy(); renderList(); renderSideHd(); refreshLesson();
    }

    // ---------- on-screen keyboard (real): lift the focused field above it; never re-render while it opens ----------
    const kbFieldOk = (el) => el && el.isConnected && ov.contains(el) && el.matches('textarea, input[type=search], input[type=text]') && !el.disabled && !el.readOnly;
    function liftField(el) {
      // like a real browser with the keyboard up: scroll the field's own scroller so the whole field sits above the keyboard
      // nested scrollers (e.g. a note list inside the sheet): bring the field into view in each, innermost first
      for (let sc = el.parentElement; sc && sc !== ov; sc = sc.parentElement) {
        const o = getComputedStyle(sc).overflowY; if (!((o === 'auto' || o === 'scroll') && sc.scrollHeight > sc.clientHeight)) continue;
        const a = sc.getBoundingClientRect(), r = el.getBoundingClientRect(), pad = 12 * S.scale;
        if (r.bottom > a.bottom - pad) sc.scrollTop += (r.bottom - a.bottom + pad) / S.scale;
        else if (r.top < a.top + pad) sc.scrollTop -= (a.top + pad - r.top) / S.scale;
      }
    }
    function kbSync() {
      if (ov.hidden) return;
      const kb0 = S.kb, w0 = S.w, h0 = S.h;
      const kb = measureViewport();
      if (S.w !== w0 || S.h !== h0) { S.kb = kb; apply(); return; } // rotation / window resize: full layout
      if (kb === kb0) { placeAmb(); return; }
      S.kb = kb; ov.classList.toggle('kb-open', kb); // light path only: a full apply() would rebuild the focused field
      requestAnimationFrame(() => { fitSub(); fitStudy(); const a = R.activeElement; if (kb && kbFieldOk(a)) requestAnimationFrame(() => liftField(a)); });
    }
    ov.addEventListener('focusin', (e) => { if (S.input === 'touch' && kbFieldOk(e.target)) setTimeout(kbSync, 350); });
    ov.addEventListener('focusout', () => { if (S.input === 'touch') setTimeout(kbSync, 250); });

    // ---------- toast ----------
    let toastT = 0;
    function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 1600); }

    // ---------- keyboard shortcuts (window capture while the overlay is open) ----------
    const editable = (el) => !!el?.closest?.('textarea,input,select,[contenteditable]:not([contenteditable=false])');
    let ctrlAlone = false;
    const eatenUp = new Set(); // v3.5.203: keys handled on keydown — their keyup is swallowed too (YouTube toggles play on Space keyup)
    function onKey(e) {
      if (ov.hidden) return;
      const path = e.composedPath ? e.composedPath() : [], tgt = path.includes(ov) ? path[0] : null;
      const typing = editable(tgt) || (!tgt && editable(e.target));
      const stop = () => { e.preventDefault(); e.stopImmediatePropagation(); eatenUp.add(e.code); };
      ctrlAlone = e.key === 'Control' ? !e.repeat && (!typing || tgt?.id === 'wta') : false;
      if (e.key === 'Escape' && panelKind) { stop(); closePanel(); return; }
      if (isStudy() && e.code === 'KeyN' && (e.altKey || !typing) && !e.ctrlKey && !e.metaKey && !e.shiftKey) { stop(); addTimeNote(); return; } // N · Alt+N while typing
      if (typing) { if (e.key === 'Escape' && tgt && tgt.id !== 'wta') { stop(); tgt.blur(); } return; } // fields keep their own keys (Chép: Enter / Esc)
      if (e.ctrlKey || e.metaKey) return; // never take browser / page shortcuts (Ctrl+A, Ctrl+C …)
      if (e.altKey && ['1', '2', '3'].includes(e.key) && S.tab === 'view' && sizeKey() !== 's') {
        stop();
        if (e.key === '1') { if (curView() === 'theater') exitTheater(); else setView('theater'); return; }
        if (curView() === 'theater') setView('normal');
        if (wClass() === 'c') setMini(e.key === '2'); else { setMini(false); setSplit(e.key === '2' ? 34 : 60, true); }
        return;
      }
      if (e.altKey) return;
      if (S.tab === 'view' && ['1', '2', '3', '4'].includes(e.key)) { stop(); S.cc = ['bi', 'pri', 'tr', 'off'][+e.key - 1]; apply(); toast([T('bilingual'), T('original'), T('translate'), VI('ccHidden')][+e.key - 1]); return; }
      if (e.key === ' ' || e.key === '`') { stop(); togglePlay(); return; }
      if (e.key === '<' || e.key === '>') { stop(); S.speed = Math.round(Math.max(0.5, Math.min(3, S.speed + (e.key === '>' ? 0.05 : -0.05))) * 100) / 100; syncSpeed(); toast(`${S.speed.toFixed(2)}x`); return; }
      if (S.tab === 'speak' && e.key === 'Enter') { stop(); if (S.sp.phase === 'done') studyGo(1); else speakToggle(); return; }
      if (S.tab === 'write' && e.key === 'Enter') { stop(); const ta = $('#wta'); if (S.wr.phase === 'done') studyGo(1); else if (ta) ta.focus(); return; }
      if (e.key === 'Escape') {
        stop();
        if (S.tab === 'speak' && S.sp.phase !== 'idle') { speakAbort(); resetStudy(); renderStudy(); return; }
        if (S.tab === 'view' && (S.rot || (curView() === 'theater' && sizeKey() !== 's'))) { exitTheater(); return; }
        B.close();
      }
    }
    function onKeyUp(e) {
      if (eatenUp.delete(e.code)) { e.preventDefault(); e.stopImmediatePropagation(); return; }
      if (ov.hidden || e.key !== 'Control' || !ctrlAlone) return;
      ctrlAlone = false;
      if (isStudy()) { const s = SENT[S.si[S.tab]]; S.t = s.start; seekMedia(s.start); setPlaying(true); } // Ctrl alone = listen again
    }
    // keys typed into the overlay's own fields never reach the page (YouTube shortcuts)
    ['keydown', 'keyup', 'keypress'].forEach((t) => ov.addEventListener(t, (e) => { if (editable(e.composedPath()[0])) e.stopPropagation(); }));

    // ---------- fullscreen (real): ⛶ / Rạp ngang on phones = host fullscreen + landscape lock ----------
    let fsOwned = false;
    const hostEl = () => ov.getRootNode().host;
    function enterFs(lock) {
      const h = hostEl();
      const lockIt = () => { if (lock) try { screen.orientation?.lock?.('landscape')?.catch?.(() => {}); } catch (_) {} };
      if (document.fullscreenElement || !h?.requestFullscreen) { lockIt(); return; }
      h.requestFullscreen({ navigationUI: 'hide' }).then(() => { fsOwned = true; lockIt(); }).catch(() => {});
    }
    function exitFs() {
      try { screen.orientation?.unlock?.(); } catch (_) {}
      const own = fsOwned || document.fullscreenElement === hostEl(); fsOwned = false;
      if (own && document.fullscreenElement) document.exitFullscreen().catch(() => {});
    }
    function onFs() {
      const fs = !!document.fullscreenElement; S.realFs = fs; kpSync();
      if (!fs && fsOwned) { // left with the browser's own Esc / back gesture
        fsOwned = false;
        if (S.rot) { exitTheater(); return; }
        if (S.tab === 'view' && sizeKey() !== 's' && S.view[sizeKey()] === 'theater') { setView('normal'); return; }
      }
      syncFs();
    }

    // ---------- engine glue: settings, saved UI, study records, translations, ambient ----------
    const OV_UI_KEY = 'lhnOverlayUi';
    const UI_KEYS = ['view', 'mini', 'split', 'colW', 'colList', 'colNotes', 'subHidden', 'showTr', 'auto', 'hints', 'exp', 'ttHint', 'subStyle'];
    let ready = false, uiSaveT = 0, uiLast = '', lastCc = '', studyKey = '', studyLoaded = false, saveT = 0, ambT = 0, trLang = '';
    const store = () => globalThis.browser?.storage?.local;
    const uiLoaded = (async () => {
      try {
        const v = (await store()?.get(OV_UI_KEY))?.[OV_UI_KEY];
        if (v && typeof v === 'object') for (const k of UI_KEYS) { if (v[k] == null) continue; S[k] = S[k] && typeof S[k] === 'object' && !Array.isArray(S[k]) ? { ...S[k], ...v[k] } : v[k]; }
        S.exp.fmt = ['srt', 'txt', 'csv', 'pdf'].includes(S.exp.fmt) ? S.exp.fmt : 'srt';
      } catch (_) {}
    })();
    function saveUi() {
      clearTimeout(uiSaveT);
      uiSaveT = setTimeout(() => {
        const o = {}; UI_KEYS.forEach((k) => (o[k] = S[k]));
        const snap = JSON.stringify(o); if (snap === uiLast) return; uiLast = snap;
        try { store()?.set({ [OV_UI_KEY]: o })?.catch?.(() => {}); } catch (_) {}
      }, 500);
    }
    const CC_MAP = { bi: 'bilingual', pri: 'primary', tr: 'translation', off: 'hidden' };
    function pullSettings() {
      const st = B.settings() || {}, s = B.state() || {};
      S.theme = st.theme === 'light' ? 'light' : 'dark';
      S.tapTranslate = st.videoTranslationPopupEnabled !== false;
      S.speakOnTranslate = st.videoClickToSpeak !== false;
      S.merge = st.splitSentences !== false;
      S.autoHideDock = !!st.hideControls;
      S.ambient = st.ambient !== false && st.ambientStyle !== 'off';
      S.srcLang = s.sourceLanguageSetting || 'auto'; S.dstLang = s.targetLanguageSetting || 'auto';
      const cc = Object.keys(CC_MAP).find((k) => CC_MAP[k] === B.getCc()); if (cc) S.cc = cc;
      lastCc = S.cc;
    }
    // apply() → saves only what changed, through the controller's own settings
    function persistSettings() {
      if (!ready) return;
      const st = B.settings();
      if (st) {
        let dirty = false;
        const set = (k, v) => { if (st[k] !== v) { st[k] = v; dirty = true; } };
        set('theme', S.theme === 'light' ? 'light' : 'dark');
        set('videoTranslationPopupEnabled', !!S.tapTranslate);
        set('videoClickToSpeak', !!S.speakOnTranslate);
        set('hideControls', !!S.autoHideDock);
        const remerge = (st.splitSentences !== false) !== !!S.merge;
        set('splitSentences', !!S.merge);
        const ambNow = st.ambient !== false && st.ambientStyle !== 'off';
        if (dirty) B.saveSettings();
        if (ambNow !== !!S.ambient) B.setAmbientMode(S.ambient ? '3' : 'off');
        if (remerge) B.rebuildCaptions();
      }
      if (S.cc !== lastCc) { lastCc = S.cc; B.setCc(CC_MAP[S.cc]); }
      saveUi();
    }
    function setTitle() {
      const st = B.state() || {}, web = st.sourceType === 'web', meta = B.meta() || {};
      const title = String(meta.title || (web ? st.webSourceTitle : '') || document.title || 'Keepit').trim();
      let host = ''; try { host = new URL(web ? (st.webSourceUrl || location.href) : location.href).hostname.replace(/^(www|m)\./, ''); } catch (_) {}
      const d = dockEl.title; d.title = title; d.innerHTML = `${web ? ic('globe', 'class="yt gl"') : YT}<span></span>`; $('span', d).textContent = title;
      $('#bsrc').textContent = `· ${title}`; $('#cTitle').textContent = title;
      $('#cSrc').textContent = [host, web ? '' : meta.channel].filter(Boolean).join(' · ');
    }
    function syncDocClass() { document.documentElement.classList.toggle('lhn-touch-overlay', !ov.hidden && wClass() === 'c'); }
    function ambTick() {
      if (!S.ambient || ov.hidden) return;
      const cv = $('#amb canvas'), src = $('#vid > video') || $('#vid > img.te-web-page-thumbnail');
      if (!cv || !src) return;
      try { cv.getContext('2d').drawImage(src, 0, 0, cv.width, cv.height); } catch (_) {}
    }
    // study records: the app's dictation:<sourceId> record (progress, notes, wrong-word stats) + the session index
    async function loadStudyRecord() {
      const id = String(B.state()?.sourceId || ''), key = id ? `dictation:${id}` : '';
      studyKey = key; studyLoaded = false;
      S.res = { speak: {}, write: {} }; S.si = { speak: 0, write: 0 }; S.reach = { speak: 0, write: 0 }; S.tnotes = []; S.lessonNote = '';
      STATS.write = { version: 3, words: {} }; STATS.speak = { version: 3, words: {} }; syncWrong();
      if (!key) return;
      let rec = {};
      try { rec = (await store()?.get(key))?.[key] || {}; } catch (_) {}
      if (studyKey !== key) return;
      const pm = rec.progressByMode || {};
      const prog = (p) => ({ current: Number.isInteger(p?.current) ? p.current : Number.isInteger(rec.current) ? rec.current : 0, solved: (Array.isArray(p?.solved) ? p.solved : Array.isArray(rec.solved) ? rec.solved : []).map(Number).filter(Number.isInteger) });
      const fill = (tab, p, scores, pass) => {
        const r = {};
        for (const [i, v] of Object.entries(scores || {})) if (Number.isFinite(+v)) r[i] = +v;
        for (const i of p.solved) r[i] = Math.max(pass, r[i] || 0);
        S.res[tab] = r; S.si[tab] = Math.max(0, p.current); S.reach[tab] = Math.max(S.si[tab], ...p.solved);
      };
      const sc = rec.unifiedScores || {};
      fill('write', prog(pm.typing), sc.typing, PASS.write); fill('speak', prog(pm.speaking), sc.speaking, PASS.speak);
      S.tnotes = Object.entries(rec.notes || {}).map(([i, n]) => ({ i: +i, text: String(n?.note || '') })).filter((n) => Number.isInteger(n.i) && n.text.trim()).sort((a, b) => a.i - b.i);
      S.lessonNote = String(rec.lessonNote || '');
      const ok = (v) => v && v.version === 3 && v.words && typeof v.words === 'object';
      if (ok(rec.wrongWordStats)) STATS.write = rec.wrongWordStats;
      if (ok(rec.speakingWrongWordStats)) STATS.speak = rec.speakingWrongWordStats;
      syncWrong();
      studyLoaded = true;
    }
    function clampStudy() {
      const n = STUDY.length; if (!n) return;
      for (const t of ['speak', 'write']) { S.si[t] = Math.min(Math.max(0, S.si[t]), n - 1); S.reach[t] = Math.min(Math.max(S.reach[t], S.si[t]), n - 1); }
      S.tnotes = S.tnotes.filter((x) => x.i < n);
    }
    function queueStudySave() { clearTimeout(saveT); saveT = setTimeout(saveStudyNow, 400); }
    async function saveStudyNow() {
      clearTimeout(saveT); saveT = 0;
      const key = studyKey;
      if (!key || !studyLoaded || !STUDY.length) return;
      let rec = {};
      try { rec = (await store()?.get(key))?.[key] || {}; } catch (_) {}
      if (key !== studyKey) return;
      const solved = (tab) => Object.entries(S.res[tab]).filter(([, v]) => v >= PASS[tab]).map(([i]) => +i).sort((a, b) => a - b);
      const typing = { current: S.si.write, solved: solved('write') }, speaking = { current: S.si.speak, solved: solved('speak') };
      const active = S.tab === 'speak' ? speaking : typing;
      const notes = {};
      for (const [k, v] of Object.entries(rec.notes || {})) { const { note, ...rest } = v || {}; if (Object.keys(rest).length) notes[k] = rest; }
      for (const n of S.tnotes) if (n.text.trim()) notes[String(n.i)] = { ...(notes[String(n.i)] || {}), note: n.text };
      const meta = B.meta() || {}, title = String(meta.title || '').trim() || String(rec.title || '');
      const next = { ...rec, version: 1, current: active.current, solved: active.solved, progressByMode: { ...(rec.progressByMode || {}), typing, speaking }, notes, lessonNote: S.lessonNote, unifiedScores: { typing: { ...S.res.write }, speaking: { ...S.res.speak } }, wrongWordStats: STATS.write, speakingWrongWordStats: STATS.speak, title };
      if (title) next.titleUpdatedAt = Date.now();
      try { await store()?.set({ [key]: next }); } catch (_) { return; }
      const idx = globalThis.LHN_STUDY_SESSION_INDEX, st = B.state() || {};
      if (!idx) return;
      const web = st.sourceType === 'web', sid = String(st.sourceId || '');
      const total = STUDY.length, done = active.solved.length;
      const session = { version: 1, sessionId: `${web ? 'web' : 'youtube'}:${sid}`, sourceType: web ? 'web' : 'youtube', sourceId: sid, title, url: web ? String(st.webSourceUrl || location.href) : `https://www.youtube.com/watch?v=${encodeURIComponent(sid)}`, currentIndex: Math.max(0, active.current), totalCount: total, solvedCount: done, updatedAt: Date.now(), status: total > 0 && done >= total ? 'complete' : 'in_progress' };
      try {
        const stored = await store()?.get(idx.STORAGE_KEY), prev = idx.normalizeIndex(stored?.[idx.STORAGE_KEY]);
        const ps = prev.sessions.find((x) => x.sessionId === session.sessionId);
        const sessions = idx.mergeSessions(prev.sessions, { ...session, title: session.title || ps?.title || '' });
        await store()?.set({ [idx.STORAGE_KEY]: { version: idx.VERSION, updatedAt: Date.now(), legacyMigrationComplete: prev.legacyMigrationComplete, sessions } });
      } catch (_) {}
    }
    // study sentences are translated lazily around the current one (i − 1 … i + 6) and updated in place
    const trPend = new Set();
    function translateAround(i) {
      const lang = String(B.state()?.targetLanguage || '');
      if (lang !== trLang) { trLang = lang; STUDY.forEach((s) => (s.vi = '')); trPend.clear(); }
      for (let j = Math.max(0, i - 1); j <= Math.min(STUDY.length - 1, i + 6); j++) {
        const s = STUDY[j]; if (!s || s.vi || trPend.has(j)) continue;
        trPend.add(j); const en = s.en;
        Promise.resolve(B.translate(en)).then((v) => {
          trPend.delete(j);
          if (STUDY[j]?.en !== en || !v || v === B.pending() || trLang !== lang) return;
          STUDY[j].vi = String(v);
          if (!isStudy()) return;
          $$(`.row[data-i="${j}"] .vi`).forEach((e) => (e.textContent = STUDY[j].vi));
          if (S.si[S.tab] === j) { const t = $('#scard .trans'); if (t) t.textContent = STUDY[j].vi; }
        }).catch(() => trPend.delete(j));
      }
    }
    // controller hooks
    function onCaptions() {
      if (ov.hidden) return;
      loadCaps();
      const n = STUDY.length; loadStudy();
      if (STUDY.length !== n) { clampStudy(); if (isStudy()) { useSent(); renderStudy(); renderSideHd(); translateAround(S.si[S.tab]); } }
      useSent(); lastCur = -1; tick.i = -1;
      renderList(); renderMarks(); tick(true);
    }
    function onTranslated(item) {
      if (ov.hidden) return;
      const list = B.state()?.captions || [], i = list.indexOf(item);
      if (i < 0 || !CAPS[i] || CAPS[i].ref !== item) return;
      CAPS[i].en = capText(item.mainText ?? item.en); CAPS[i].vi = capText(item.vi);
      if (isStudy()) return;
      $$(`#list .row[data-i="${i}"]`).forEach((r) => { const a = $('.en', r), b = $('.vi', r); if (a) a.textContent = CAPS[i].en; if (b) b.textContent = CAPS[i].vi; });
      if (idxAt(S.t) === i) tick(true);
    }
    function onStatus(text) {
      if (ov.hidden || (B.state()?.captions || []).length) return;
      CAPS = [{ en: String(text || ''), vi: '', start: 0, end: 1, empty: true }];
      if (!isStudy()) { useSent(); renderList(); tick(true); }
    }

    // ---------- open / close (overlay-controller.js) ----------
    // ---------- labels: fixed markup texts; refreshLanguage redraws everything when the display language changes ----------
    let textLang = '';
    function refreshText() {
      textLang = ovLabelLang();
      const btnClose = $('#btnClose'); btnClose.title = T('closeEsc'); btnClose.setAttribute('aria-label', T('close'));
      $$('.csplit').forEach((el) => { el.title = T('dragToResizeDouble'); });
      $('#split').title = T('dragToResize');
      $('#tthint').innerHTML = `<i class="ttzone l">${T('volume')}</i><i class="ttzone r">${T('brightness')}</i><span>${T('swipeLeftSideVolume')}<br>${T('swipeSidewaysSeekSwipe')}<small>${T('tapToClose')}</small></span>`;
      const fav = $('#vcorner [data-act=fav]'); fav.title = T('favorite'); fav.setAttribute('aria-label', T('favorite'));
      const vt = $('#vcorner [data-act=theater]'); vt.title = T('fullScreen'); vt.setAttribute('aria-label', T('fullScreen'));
      $('#cplay').setAttribute('aria-label', T('play'));
      const grip = $('#grip'); grip.title = T('collapseSubtitles'); grip.setAttribute('aria-label', T('collapseSubtitles'));
      $('#railL [data-act=colList]').title = T('showSentenceList'); $('#railR [data-act=colNotes]').title = T('showLessonNotes');
      $$('#tabs [data-tab]').forEach((b) => { $('span', b).textContent = T(TABS.find((x) => x[0] === b.dataset.tab)[1]); });
      DOCK.forEach((d) => labelDockButton(d));
    }
    // the toast's last text is re-worded too, shown or faded (as the old text-walker did): match it against the old language's ov_* texts
    function retranslateToast(from, to) {
      const t = $('#toast'), cur = t?.textContent || '', M = globalThis.LHN_LANGUAGES?.MESSAGES || {};
      if (!cur) return;
      for (const [k, v] of Object.entries(M[from] || {})) {
        if (!k.startsWith('ov_') || typeof v !== 'string') continue;
        const re = new RegExp('^' + v.replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace(/\{\d\}/g, '(.+?)') + '$');
        const m = cur.match(re);
        if (m) { t.textContent = ovLabel(to, k.slice(3), m.slice(1)); return; }
      }
    }
    function refreshLanguage() {
      if (ovLabelLang() === textLang) return;
      const from = textLang;
      refreshText();
      retranslateToast(from, textLang);
      if (ov.hidden) return;
      lastKey = ''; apply();
      if (panelKind) openPanel(panelKind, null, { ...panelOpt, keep: true });
    }
    function open(opts = {}) {
      ov.hidden = false;
      S.input = matchMedia('(pointer: coarse)').matches ? 'touch' : 'mouse';
      S.rot = null; S.sess = Date.now(); S.tabLand = null; S.kb = false;
      closePanel(); hideCtl(); setChrome(true); hideStudyToast(true);
      Object.assign(applied, { speed: null, vol: null, muted: null }); lastVa = ''; ov.style.removeProperty('--va');
      pullSettings(); setTitle();
      loadCaps(); loadStudy();
      S.tab = opts.tab === 'speak' || opts.tab === 'write' ? opts.tab : 'view';
      resetStudy(); useSent();
      const m = media(); S.t = Number(m?.currentTime) || 0; S.playing = !!(m && !m.paused);
      ready = false; lastKey = ''; lastCur = -1; tick.i = -1;
      apply();
      ready = true;
      B.setActivity(S.tab === 'speak' ? 'shadowing' : S.tab === 'write' ? 'dictation' : null);
      clearInterval(timer); timer = setInterval(step, 50);
      clearInterval(ambT); ambT = setInterval(ambTick, 500); ambTick();
      window.addEventListener('keydown', onKey, true); window.addEventListener('keyup', onKeyUp, true);
      window.addEventListener('resize', kbSync); window.visualViewport?.addEventListener('resize', kbSync); window.visualViewport?.addEventListener('scroll', kbSync);
      document.addEventListener('fullscreenchange', onFs);
      Promise.resolve(B.loadFavorite()).then((on) => { S.fav = !!on; syncFav(); }).catch(() => {});
      const sid = B.state()?.sourceId;
      Promise.all([uiLoaded, loadStudyRecord()]).then(() => {
        if (ov.hidden || B.state()?.sourceId !== sid) return;
        clampStudy();
        if (isStudy()) { useSent(); S.t = SENT[S.si[S.tab]].start; seekMedia(S.t); translateAround(S.si[S.tab]); }
        lastKey = ''; apply();
      });
    }
    function close() {
      if (ov.hidden) return;
      speakAbort(); clearRec();
      if (saveT) saveStudyNow();
      if (noteSaveT) saveNote();
      clearInterval(timer); clearInterval(ambT); clearInterval(wordWatch); clearTimeout(chromeT); clearTimeout(ctlT);
      closePanel(); hideStudyToast(true);
      window.removeEventListener('keydown', onKey, true); window.removeEventListener('keyup', onKeyUp, true);
      window.removeEventListener('resize', kbSync); window.visualViewport?.removeEventListener('resize', kbSync); window.visualViewport?.removeEventListener('scroll', kbSync);
      document.removeEventListener('fullscreenchange', onFs); clearInterval(kpT); kpSync(true);
      if (S.rot) { S.view.c = S.rot.prev || 'normal'; S.view.e = 'normal'; S.rot = null; }
      exitFs(); ttReset(); ov.classList.remove('tt-hint-on');
      ov.hidden = true; syncDocClass();
      B.setActivity(null);
    }
    api = {
      open, close, onCaptions, onTranslated, onStatus,
      isOpen: () => !ov.hidden,
      slot: () => $('#vid'),
      setTab: (t) => { if (ov.hidden) open({ tab: t }); else setTab(t); },
      tab: () => S.tab,
      refreshTitle: () => { if (!ov.hidden) setTitle(); },
      refreshLanguage,
    };
    uiLoaded.then(() => { if (!ov.hidden) { lastKey = ''; apply(); } });
    refreshText();
    return api;
  }
  return Object.freeze({
    mount,
    isActive: () => Boolean(api),
    isOpen: () => Boolean(api?.isOpen()),
    open: (opts) => api?.open(opts),
    close: () => api?.close(),
    onCaptions: () => api?.onCaptions(),
    onTranslated: (item) => api?.onTranslated(item),
    onStatus: (text) => api?.onStatus(text),
    slot: () => api?.slot() || null,
    setTab: (tab) => api?.setTab(tab),
    tab: () => api?.tab() || '',
    refreshTitle: () => api?.refreshTitle(),
    refreshLanguage: () => api?.refreshLanguage(),
  });
})();
