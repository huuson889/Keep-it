// Trang tối (v3.5.207) — chức năng "Trang tối" của Keepit for Android (app/src/main/assets/android/browser-ui.js) cho extension.
// Chỉ có tác dụng khi Chủ đề Keepit là tối. Một lớp phủ toàn màn hình đảo màu phần trang bên dưới (giữ sắc độ);
// ảnh/video được đảo lại nên giữ màu thật. Lớp phủ nằm dưới thanh Keepit, Ghi chú, popup và hộp thoại của Keepit nên
// chúng giữ màu riêng; trên trang chỉ ảnh/video có filter, nên header cố định của trang vẫn chạy đúng.
// Trang đang tự hiện giao diện tối thì để nguyên (v3.5.213: theo nền gốc, giữ quyết định; khối vốn tối giữ màu gốc). Tắt khi overlay video mở.
// v3.5.215: không nháy trắng (lớp tối nạp sẵn css/content/page-dark-early*.css, đăng ký ở background) và trang có dark mode
// theo máy thì bật dark mode của trang (đổi @media prefers-color-scheme ở đây + js/content/page-dark-main.js cho matchMedia).
// Bật/tắt: ☰ → Giao diện → Trang tối (js/content/keepit-bar.js). Lưu: storage.local `lhnPageDark` (mặc định tắt).
// Trong APK (LHN_PLATFORM = "android") app tự làm việc này, file này không làm gì.
(() => {
  if (window.top !== window || globalThis.LHN_PAGE_DARK) return;
  const KEY = "lhnPageDark", SETTINGS_KEY = "lhnSettings";
  const DARK_Q = matchMedia("(prefers-color-scheme: dark)");
  // Ảnh/video được đảo lại 1 lần để giữ màu thật. v3.5.211: chỉ khối có ảnh nền thật (`url(`), không bắt mọi style có chữ
  // "background-image" (CNN: cả khu lớn có `background-image:none` → cả khu sáng lại); khung ảnh lồng trong khung ảnh
  // (ảnh trong khối ảnh nền) không đảo thêm, nếu không ảnh thành âm bản.
  // v3.5.212: KHÔNG đặt filter lên <picture> — filter biến nó thành khung chứa của <img position:absolute> bên trong; CNN
  // dùng <picture> cao 0px nên ảnh co mất, chỉ còn ô tối. Ảnh của <picture> luôn là <img> nên đảo <img> là đủ.
  const MEDIA = 'img,video,canvas,iframe,embed,object,svg image,[style*="url("]';
  // v3.5.213: khối lớn vốn tối trên trang sáng (CNN: dải đen, chân trang) cũng đảo lại → giữ màu gốc (`data-keepit-pd`).
  const KEEP = "[data-keepit-pd]";
  // v3.5.216: khối màu rực (header đỏ tuoitre.vn) — lớp phủ khoét lỗ, khối và mọi thứ bên trong giữ nguyên (không filter).
  const VIVID = "[data-keepit-pdv]";
  // v3.5.214: Highlight của Keepit trên trang cũng đảo lại → hiện đúng như trên web nền đen (màu tô gốc + chữ đen,
  // giống cơ chế `lhn-black-text` của web-highlighter.js), không bị lớp phủ đổi thành màu tô sậm.
  // Thẻ dịch + loa của Reader cũng vậy: giữ đúng màu nhấn tím của Keepit (lớp phủ đổi tím → hồng). Chữ dịch màu mặc định
  // (#2d3748, cho nền sáng) đổi sang chữ sáng như trên nền đen; màu chữ người dùng tự chọn giữ nguyên.
  const MARKS = ".lhn-mark,.lhn-selection-preview-mark,.lhn-bilingual-card,.lhn-bilingual-speaker";
  const ALL = MEDIA + "," + KEEP + "," + MARKS;
  // v3.5.214: giao diện Keepit (Ghi chú, Reader, popup, thanh…) nằm TRÊN lớp phủ và có giao diện tối riêng → không đụng
  // tới ảnh/khung bên trong, nếu không logo / favicon / ảnh thu nhỏ của Ghi chú bị đảo (double).
  const UI = '[id^="lhn-"],[id^="keepit-"],[id^="yt-keepit"],[data-lhn-bilingual-ui]';
  // v3.5.216: :where trong :not để quy tắc "lồng nhau → không đảo" thắng (trước đó :is(UI) làm quy tắc đầu nặng hơn → ảnh
  // trong khối vốn tối bị đảo thêm, logo trắng thành đen).
  const DARK_CSS = `:is(${ALL}):not(:where(${UI})):not(:where(${UI}) *){filter:invert(1) hue-rotate(180deg)!important}:is(${ALL}) :is(${ALL}),${VIVID},${VIVID} *{filter:none!important}.lhn-bilingual-card[style*="rgb(45, 55, 72)"]{color:#cbd5e1!important}`;
  let on = false, theme = "", darkStyle = null, darkVeil = null, loaded = false;
  // Chủ đề Keepit đọc giống thanh Keepit (settings đã qua LHN_SETTINGS.resolve).
  const themeOf = raw => String((globalThis.LHN_SETTINGS?.resolve?.(raw) || raw || {}).sidebarTheme || "");
  const isApk = () => globalThis.LHN_PLATFORM === "android";
  const isDark = () => theme === "dark" || (theme !== "light" && DARK_Q.matches);
  const overlayOpen = () => document.documentElement.classList.contains("lhn-video-overlay-open");
  // v3.5.209: trang đang tự hiện giao diện tối thì bỏ qua. Không chỉ xem nền body/html (nhiều trang tối để body trong suốt
  // và tô nền ở khung bên trong) mà lấy mẫu nền THẬT ở 9 điểm trên màn hình, đi ngược lên cha tới nền đặc đầu tiên.
  // Đọc từ CSS (getComputedStyle) nên lớp phủ của Keepit không làm sai kết quả.
  const lumOf = color => { const m = String(color).match(/[\d.]+/g); if (!m || m.length < 3 || (m.length > 3 && +m[3] < 0.5)) return null; return (0.299 * m[0] + 0.587 * m[1] + 0.114 * m[2]) / 255; };
  const KEEPIT = '[id^="lhn-"],[id^="keepit-"],[id^="yt-keepit"],[class^="lhn-"]';
  function canvasLum() {
    // Không phần tử nào có nền: màu nền mặc định của trình duyệt — tối nếu trang khai báo chỉ dùng giao diện tối.
    const cs = String(getComputedStyle(document.documentElement).colorScheme || "");
    return /\bdark\b/.test(cs) && !/\blight\b/.test(cs) ? 0.1 : 1;
  }
  function bgLumAt(el) {
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) { const v = lumOf(getComputedStyle(n).backgroundColor); if (v !== null) return v; }
    // html không có nền thì nền body phủ cả màn hình (kể cả phần dưới body ngắn).
    return (document.body && lumOf(getComputedStyle(document.body).backgroundColor)) ?? canvasLum();
  }
  // v3.5.213: quyết định theo nền gốc (html, không có thì body) và GIỮ quyết định; trước đây đo lại theo phần đang hiện
  // nên cuộn tới dải đen (CNN) là Trang tối tự tắt. Nền gốc trong suốt → lấy mẫu màn hình như v3.5.209.
  let decided = null, decidedSig = "";
  const rootSig = () => { const h = document.documentElement, b = document.body, ch = getComputedStyle(h); return [ch.backgroundColor, b && getComputedStyle(b).backgroundColor, ch.colorScheme, ...["data-theme", "data-color-mode", "data-bs-theme", "data-mode", "dark", "theme"].map(a => h.getAttribute(a))].join("|"); };
  function decideDark() {
    const sig = rootSig();
    if (decided !== null && sig === decidedSig) return decided;
    const first = decided === null;
    const rootL = lumOf(getComputedStyle(document.documentElement).backgroundColor) ?? lumOf(getComputedStyle(document.body).backgroundColor);
    if (rootL === null) decided = pageIsDark(0.5);
    else if (rootL < 0.45) decided = true;
    else decided = first && scrollY < innerHeight ? pageIsDark(8 / 9) : false; // nền gốc sáng: chỉ coi là tối nếu gần kín màn hình tối lúc mở
    decidedSig = sig; return decided;
  }
  function pageIsDark(share) {
    const vals = [];
    for (const fy of [0.2, 0.45, 0.7]) for (const fx of [0.2, 0.5, 0.8]) {
      const el = document.elementsFromPoint(innerWidth * fx, innerHeight * fy).find(e => !e.closest(KEEPIT));
      if (el) vals.push(bgLumAt(el));
    }
    if (!vals.length) { const b = lumOf(getComputedStyle(document.body).backgroundColor) ?? lumOf(getComputedStyle(document.documentElement).backgroundColor); vals.push(b ?? canvasLum()); }
    return vals.filter(v => v < 0.45).length >= vals.length * share; // share 0.5 = đa số màn hình là nền tối
  }
  // Đánh dấu khối lớn vốn tối (rộng ≥ 40% màn hình, cao ≥ 40px, nền đặc độ sáng < 0.3) — không lồng nhau. Gộp ≥ 800ms.
  // v3.5.216: khối màu đậm, rực (header đỏ chữ trắng của tuoitre.vn) cũng giữ màu gốc — chữ trắng trên nền đó vốn dễ đọc
  // trên trang tối; đảo thì thành hồng nhạt chữ đen. Rực = độ đậm màu (max − min) ≥ 0.45 và độ sáng < 0.6;
  // nền nhạt (hồng phấn, vàng kem) và màu quá sáng (vàng tươi) vẫn đảo như cũ.
  const vivid = (color, l) => { if (l >= 0.6) return false; const m = String(color).match(/[\d.]+/g).slice(0, 3).map(Number); return (Math.max(...m) - Math.min(...m)) / 255 >= 0.45; };
  // Nền gradient (header tuoitre.vn: background-color trong suốt + linear-gradient đỏ): mọi điểm màu phải tối hoặc rực;
  // gradient có ảnh (url) thì bỏ qua.
  const keepBg = cs => {
    let cols = [cs.backgroundColor];
    if (lumOf(cols[0]) === null) { const gi = cs.backgroundImage; if (!/gradient/.test(gi) || /url\(/.test(gi)) return false; cols = gi.match(/rgba?\([^)]*\)/g) || []; }
    let kind = cols.length ? "d" : "";
    for (const c of cols) { const l = lumOf(c); if (l === null) return ""; if (l >= 0.3) { if (!vivid(c, l)) return ""; kind = "v"; } }
    return kind; // "d" = vốn tối (đảo lại như cũ), "v" = màu rực (khoét lỗ lớp phủ), "" = để lớp phủ làm tối
  };
  // Màu rực không giữ được bằng cách đảo hai lần (bộ lọc invert + hue-rotate cắt mất phần màu ngoài gam → đỏ tươi thành
  // đỏ xỉn), nên lớp phủ được khoét lỗ đúng chỗ các khối này (clip-path evenodd, cập nhật khi cuộn / đổi cỡ) và khối hiện
  // nguyên màu gốc, kể cả ảnh / logo bên trong.
  let holeRaf = 0;
  function cutHoles() {
    holeRaf = 0; if (!darkVeil) return;
    const W = innerWidth, H = innerHeight; let d = "";
    document.querySelectorAll(VIVID).forEach(el => {
      const r = el.getBoundingClientRect(); if (r.bottom <= 0 || r.top >= H || r.width < 1 || r.height < 1) return;
      const l = Math.max(0, r.left), t = Math.max(0, r.top), rt = Math.min(W, r.right), b = Math.min(H, r.bottom);
      d += `M${l} ${t}H${rt}V${b}H${l}Z`;
    });
    darkVeil.style.setProperty("clip-path", d ? `path(evenodd, "M0 0H${W}V${H}H0Z${d}")` : "none");
  }
  const holesSoon = () => { if (!holeRaf && darkVeil?.isConnected) holeRaf = requestAnimationFrame(cutHoles); };
  addEventListener("scroll", holesSoon, { passive:true, capture:true });
  addEventListener("resize", holesSoon, { passive:true });
  let scanT = 0, scanAt = 0;
  function markDarkBlocks() {
    scanAt = Date.now(); const minW = innerWidth * 0.4, found = [];
    for (const el of document.body.querySelectorAll("*")) {
      if (el.closest(KEEPIT)) continue;
      const r = el.getBoundingClientRect(); if (r.width < minW || r.height < 40) continue;
      const kind = keepBg(getComputedStyle(el)); if (!kind) continue;
      // Khối màu rực trong popup đang ẩn (opacity 0 / visibility hidden — tuoitre.vn .titlepopup) không được khoét lỗ.
      if (kind === "v" && el.checkVisibility?.({ opacityProperty:true, visibilityProperty:true }) === false) continue;
      if (found.some(f => f.contains(el))) continue;
      found.push(el); el.__keepitPd = kind;
    }
    document.querySelectorAll(KEEP + "," + VIVID).forEach(el => { if (!found.includes(el)) { el.removeAttribute("data-keepit-pd"); el.removeAttribute("data-keepit-pdv"); } });
    found.forEach(el => { const v = el.__keepitPd === "v"; el.toggleAttribute("data-keepit-pd", !v); el.toggleAttribute("data-keepit-pdv", v); });
    cutHoles();
  }
  const scanSoon = () => { if (!darkStyle?.isConnected) return; clearTimeout(scanT); scanT = setTimeout(markDarkBlocks, Math.max(250, 800 - (Date.now() - scanAt))); };
  addEventListener("scroll", scanSoon, { passive:true });
  function remove() { darkStyle?.remove(); darkVeil?.remove(); document.querySelectorAll(KEEP + "," + VIVID).forEach(el => { el.removeAttribute("data-keepit-pd"); el.removeAttribute("data-keepit-pdv"); }); }
  // ---- v3.5.215: trang có dark mode theo máy → bật dark mode của chính trang thay vì lớp tối Keepit ----
  // Chỉ khi Chủ đề Keepit = Tối mà máy đang sáng (máy tối thì trang đã tự tối). Các quy tắc CSS
  // @media (prefers-color-scheme: dark|light) đọc được (cùng nguồn / CORS) và thuộc tính media của <link>/<style>/<source>
  // được đổi để coi như máy đang tối; js/content/page-dark-main.js làm việc tương tự cho matchMedia trong JS của trang.
  // Sau khi trang nạp xong mà nền gốc vẫn sáng (dark mode dở / chỉ đổi vài chi tiết) → hoàn tác, dùng lớp tối như cũ.
  const emu = { rules:[], attrs:[], failed:false, done:new WeakSet() };
  const PCS = /prefers-color-scheme/i;
  const swapMQ = q => String(q).replace(/\(\s*prefers-color-scheme\s*:\s*dark\s*\)/gi, "(min-width: 0px)").replace(/\(\s*prefers-color-scheme\s*:\s*light\s*\)/gi, "(max-width: 0px)");
  const emuWanted = () => loaded && on && theme === "dark" && !DARK_Q.matches && !emu.failed && !isApk() && /^https?:$/.test(location.protocol);
  function emuWalk(list) {
    for (const r of list) {
      if (typeof CSSMediaRule !== "undefined" && r instanceof CSSMediaRule && !emu.done.has(r) && PCS.test(r.media.mediaText)) {
        const t = r.media.mediaText, nt = swapMQ(t);
        if (nt !== t) { try { r.media.mediaText = nt; emu.rules.push([r, t]); } catch {} }
        emu.done.add(r);
      }
      let inner = null; try { inner = r.cssRules; } catch {}
      if (inner?.length) emuWalk(inner);
    }
  }
  function emuScan(force) {
    if (!emuWanted()) return;
    // Trang đổi class liên tục (CNN) → apply chạy dày; chỉ duyệt lại khi có stylesheet mới hoặc sau 2s.
    const n = document.styleSheets.length; if (!force && n === emu.lastN && Date.now() - emu.lastAt < 2000) return;
    emu.lastN = n; emu.lastAt = Date.now();
    for (const sh of document.styleSheets) { let rules = null; try { rules = sh.cssRules; } catch { continue; } if (rules) emuWalk(rules); }
    document.querySelectorAll("link[media],style[media],source[media]").forEach(el => {
      const t = el.getAttribute("media"); if (!PCS.test(t)) return;
      emu.attrs.push([el, t]); el.setAttribute("media", swapMQ(t));
    });
  }
  function emuRevert() {
    emu.rules.forEach(([r, t]) => { try { r.media.mediaText = t; } catch {} });
    emu.attrs.forEach(([el, t]) => el.setAttribute("media", t));
    emu.rules = []; emu.attrs = []; emu.done = new WeakSet();
  }
  // Stylesheet mới nạp xong → đổi ngay (trước khi trang kịp vẽ màu sáng).
  document.addEventListener("load", e => { if (emuWanted() && /^(LINK|STYLE)$/.test(e.target?.tagName || "")) { emuScan(true); } }, true);
  let earlySeen = false, reported = false;
  const earlyOn = () => getComputedStyle(document.documentElement).getPropertyValue("--keepit-pd-early").trim() === "1";
  function apply() {
    if (!loaded || isApk() || !/^https?:$/.test(location.protocol) || !document.body) return;
    if (emuWanted()) emuScan(); else if (emu.rules.length || emu.attrs.length) emuRevert();
    const want = on && isDark() && !decideDark();
    if (want && !darkStyle?.isConnected) {
      darkStyle = document.createElement("style"); darkStyle.id = "keepit-page-dark"; darkStyle.textContent = DARK_CSS; (document.head || document.documentElement).appendChild(darkStyle);
      darkVeil = document.createElement("div"); darkVeil.id = "keepit-page-dark-veil";
      darkVeil.setAttribute("style", "all:initial;position:fixed;inset:0;z-index:2147482000;pointer-events:none;-webkit-backdrop-filter:invert(1) hue-rotate(180deg);backdrop-filter:invert(1) hue-rotate(180deg);");
      document.documentElement.appendChild(darkVeil);
    } else if (!want && darkStyle?.isConnected) remove();
    else if (want && darkVeil && !darkVeil.isConnected) document.documentElement.appendChild(darkVeil);
    // Overlay video phủ kín trang và có giao diện tối riêng: tạm ẩn lớp phủ khi overlay mở.
    if (darkVeil) darkVeil.style.setProperty("display", overlayOpen() ? "none" : "block");
    if (want) scanSoon();
    // Lớp tối nạp sẵn (css/content/page-dark-early*.css) đã làm xong việc → tắt nó; từ đây chỉ dùng quyết định ở trên.
    if (!document.documentElement.hasAttribute("data-keepit-pd-off")) { earlySeen = earlyOn(); document.documentElement.setAttribute("data-keepit-pd-off", ""); }
  }
  // Sau khi trang nạp xong: dark mode của trang chỉ đổi được một phần → hoàn tác; rồi báo background trang này vốn tối
  // (lần sau không nạp sẵn lớp tối) hoặc không còn tối (lần sau nạp sẵn lại). Chỉ báo khi khác với lần nạp này.
  function settle() {
    if (!loaded || !on || !isDark() || !document.body) return;
    emuScan(true);
    if ((emu.rules.length || emu.attrs.length) && !decideDark()) { emuRevert(); emu.failed = true; decided = null; apply(); }
    const dark = decideDark();
    // earlySeen = lần này có lớp nạp sẵn. Có mà trang vốn tối → thêm vào danh sách; không có mà trang sáng → bỏ ra.
    // Trang tối nhờ đổi @media ở đây thì không thêm: giữ lớp nạp sẵn để lần sau vẫn tối ngay từ đầu.
    if (reported || dark !== earlySeen || (dark && (emu.rules.length || emu.attrs.length))) return;
    reported = true;
    browser.runtime.sendMessage({ type:"PAGE_DARK_NATIVE", dark }).catch(() => {});
  }
  browser.storage.local.get([KEY, SETTINGS_KEY]).then(got => {
    on = got[KEY] === true; theme = themeOf(got[SETTINGS_KEY]); loaded = true; apply();
  }).catch(() => {});
  browser.storage.onChanged.addListener((ch, area) => {
    if (area !== "local") return;
    if (ch[KEY]) on = ch[KEY].newValue === true;
    if (ch[SETTINGS_KEY]) theme = themeOf(ch[SETTINGS_KEY].newValue);
    if (ch[KEY] || ch[SETTINGS_KEY]) { emu.failed = false; decided = null; apply(); }
  });
  DARK_Q.addEventListener?.("change", apply);
  // Trang tự đổi sáng/tối (class, data-theme, style, color-scheme) hoặc dựng xong muộn: kiểm tra lại (gộp trong 150ms).
  let recheckT = 0;
  const recheck = () => { clearTimeout(recheckT); recheckT = setTimeout(apply, 150); };
  const THEME_ATTRS = ["class", "style", "data-theme", "data-color-mode", "data-bs-theme", "data-mode", "dark", "theme"];
  const watchBody = () => { if (document.body) new MutationObserver(recheck).observe(document.body, { attributes:true, attributeFilter:THEME_ATTRS }); };
  new MutationObserver(recheck).observe(document.documentElement, { attributes:true, attributeFilter:THEME_ATTRS });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => { watchBody(); apply(); }, { once:true }); else watchBody();
  addEventListener("load", () => { apply(); setTimeout(() => { apply(); settle(); }, 600); setTimeout(apply, 1500); setTimeout(apply, 3000); }, { once:true });
  globalThis.LHN_PAGE_DARK = Object.freeze({
    pageDark:() => on,
    togglePageDark() { on = !on; browser.storage.local.set({ [KEY]: on }).catch(() => {}); emu.failed = false; decided = null; apply(); return on; }
  });
})();
