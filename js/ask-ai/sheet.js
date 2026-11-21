// The existing app AI sheet, shared by the Keepit web bar and the owned Documents host.
// This component is moved from keepit-bar.js; its markup, motion and sheet-kit interaction stay unchanged.
(() => {
  'use strict';
  if(globalThis.LHN_AI_SHEET)return;
  function create({isTouch=()=>matchMedia('(pointer:coarse)').matches,isDark=()=>document.documentElement.classList.contains('dark'),t=key=>key,send=type=>LHN_MESSAGING.sendMessage({type}),SK=()=>globalThis.LHN_SHEET,VH=()=>innerHeight,Z=()=>globalThis.LHN_UI_ZOOM?.get?.()||1,canOpen=()=>true,runtime=globalThis.browser.runtime}={}){
    const CSS = `
.sheet{ --nt-g:rgba(246,246,248,.74); --nt-sheen:rgba(255,255,255,.55); --nt-hi:rgba(255,255,255,.85); --nt-edge:rgba(0,0,0,.12); --nt-tx2:#64748b;
  zoom:var(--keepit-uiz,1); position:fixed; top:auto; left:0; right:0; bottom:0; display:flex; flex-direction:column; box-sizing:border-box; margin:0;
  height:min(calc(74vh / var(--keepit-uiz,1)),720px); max-height:calc(96vh / var(--keepit-uiz,1)); padding:22px 0 0; overflow:hidden; pointer-events:auto;
  height:min(calc(74dvh / var(--keepit-uiz,1)),720px); max-height:calc(96dvh / var(--keepit-uiz,1)); overflow:clip;
  background:linear-gradient(180deg,var(--nt-sheen) 0,rgba(255,255,255,0) 34%),var(--nt-g); -webkit-backdrop-filter:blur(30px) saturate(1.8); backdrop-filter:blur(30px) saturate(1.8);
  border:0; border-top:1px solid var(--nt-edge); border-radius:22px 22px 0 0; box-shadow:inset 0 1px 0 var(--nt-hi),0 -10px 30px rgba(0,0,0,.25);
  transform:translateY(105%); transition:transform .26s cubic-bezier(.2,.8,.2,1),translate .2s ease; -webkit-user-select:none; user-select:none; color-scheme:light; }
.sheet.lhn-theme-dark{ --nt-g:rgba(36,36,42,.76); --nt-sheen:rgba(255,255,255,.06); --nt-hi:rgba(255,255,255,.1); --nt-edge:rgba(0,0,0,.55); --nt-tx2:#a1a1aa;
  box-shadow:inset 0 1px 0 var(--nt-hi),0 -10px 30px rgba(0,0,0,.45); color-scheme:dark; }
 .sheet{background:linear-gradient(to bottom,#fff 0 12px,transparent 42px),linear-gradient(180deg,var(--nt-sheen) 0,transparent 34%),var(--nt-g)}
.sheet.lhn-theme-dark{background:linear-gradient(to bottom,#18181c 0 12px,transparent 42px),linear-gradient(180deg,var(--nt-sheen) 0,transparent 34%),var(--nt-g)}
.sheet.lhn-side-visible{ transform:none; }
.sheet.lhn-sheet-full{ height:calc(96vh / var(--keepit-uiz,1)); height:calc(96dvh / var(--keepit-uiz,1)); }
.sheet.lhn-sheet-growing{ transition:none; }
.sheet.lhn-sheet-snap{ transition:height .22s ease,transform .26s cubic-bezier(.2,.8,.2,1),translate .2s ease; }
.sheet::before{ content:""; position:absolute; top:8px; left:50%; width:38px; height:5px; margin-left:-19px; border-radius:3px; background:var(--nt-tx2); opacity:.45; }
.sheet iframe{ display:block; flex:1 1 auto; width:100%; min-height:0; margin:0; padding:0; border:0; background:transparent; }
.scrim{ position:fixed; inset:-120px 0; background:rgba(0,0,0,.4); opacity:0; visibility:hidden; transition:opacity .25s,visibility .25s; }
.scrim.on{ opacity:1; visibility:visible; pointer-events:auto; }`;
    let host = null, side = null, scrim = null, frame = null, src = "", dropTimer = 0;
    const isOpen = () => !!side?.classList.contains("lhn-side-visible");
    const snap = () => { side.classList.add("lhn-sheet-snap"); setTimeout(() => side.classList.remove("lhn-sheet-snap"), 260); };
    function build() {
      host = document.createElement("keepit-ai-sheet");
      host.style.cssText = "all:initial;position:fixed;inset:0;z-index:2147483646;display:block;pointer-events:none";
      const sr = host.attachShadow({ mode:"open" });
      sr.innerHTML = `<style>${CSS}</style><div class="scrim"></div><div class="sheet" role="dialog"></div>`;
      scrim = sr.querySelector(".scrim"); side = sr.querySelector(".sheet");
      scrim.addEventListener("click", () => close(true));
      SK()?.attach(side, { isOpen:() => isOpen(), close:() => close(true), watch:side,
        grow:{ isFull:() => side.classList.contains("lhn-sheet-full"), cap:() => VH() * 0.96, mid:() => Math.round(Math.min(VH() * 0.74, 720)),
          setH:px => { if (px === null) { side.classList.remove("lhn-sheet-growing"); side.style.removeProperty("height"); } else { side.classList.add("lhn-sheet-growing"); side.style.setProperty("height", px + "px", "important"); } },
          collapse:() => { snap(); side.classList.remove("lhn-sheet-full", "lhn-sheet-growing"); side.style.removeProperty("height"); },
          release:grow => { snap(); side.classList.remove("lhn-sheet-growing"); side.style.removeProperty("height"); if (grow) side.classList.add("lhn-sheet-full"); } } });
      globalThis.visualViewport?.addEventListener("resize", fitKeyboard);
      globalThis.visualViewport?.addEventListener("scroll", fitKeyboard);
      addEventListener("pagehide", () => close(true));
    }
    // bàn phím mở (chạm ô chat của AI): sheet cao hết và nằm ngay trên bàn phím; bàn phím đóng: về như cũ
    let kbOn = false;
    function fitKeyboard() {
      const vv = globalThis.visualViewport; if (!vv || !side) return;
      const kb = isOpen() ? Math.max(0, innerHeight - vv.height - vv.offsetTop) : 0;
      if (kb > 80) {
        if (!kbOn) { kbOn = true; snap(); side.classList.add("lhn-sheet-full"); }
        side.style.setProperty("bottom", kb * Z() + "px", "important");
        side.style.setProperty("max-height", vv.height * Z() * 0.96 + "px", "important");
      } else if (kbOn) { kbOn = false; side.style.removeProperty("bottom"); side.style.removeProperty("max-height"); }
    }
    // v3.5.285: swipes inside the AI frame (toolbar, sign-in box, the AI's chat at its top) come as KEEPIT_AI_SHEET_DRAG
    // (finger screen y) and are fed to sheet-kit as touches on the sheet — same drag as the handle and as Ghi chú.
    let fwd = null;
    function feed(type, y) {
      try {
        const pt = y === null ? null : new Touch({ identifier:9, target:side, clientX:fwd.x, clientY:y, screenX:fwd.x, screenY:y, pageX:fwd.x, pageY:y + scrollY });
        side.dispatchEvent(new TouchEvent(type, { bubbles:true, cancelable:true, composed:true, touches:pt ? [pt] : [], targetTouches:pt ? [pt] : [], changedTouches:pt ? [pt] : [] }));
      } catch {}
    }
    addEventListener("message", event => {
      const d = event.data;
      if (!frame || event.source !== frame.contentWindow || d?.type !== "KEEPIT_AI_SHEET_DRAG") return;
      if (d.phase === "start") {
        if (!isOpen() || !Number.isFinite(d.y)) return;
        const r = side.getBoundingClientRect();
        fwd = { x:r.left + r.width / 2, y0:r.top + 11, s0:d.y, last:r.top + 11 };
        feed("touchstart", fwd.y0);
      } else if (!fwd) return;
      else if (d.phase === "move" && Number.isFinite(d.y)) { fwd.last = fwd.y0 + (d.y - fwd.s0); feed("touchmove", fwd.last); }
      else if (d.phase === "end" || d.phase === "cancel") { const f = fwd; feed(d.phase === "end" ? "touchend" : "touchcancel", null); if (f === fwd) fwd = null; }
    });
    // no pull-to-refresh / page bounce while the sheet is open (swipes inside the AI frame never reach sheet-kit)
    let ptr = null;
    function lockPull(on) {
      const els = [document.documentElement, document.body].filter(Boolean);
      if (on && !ptr) { ptr = els.map(el => [el, el.style.getPropertyValue("overscroll-behavior-y"), el.style.getPropertyPriority("overscroll-behavior-y")]); els.forEach(el => el.style.setProperty("overscroll-behavior-y", "none", "important")); }
      else if (!on && ptr) { ptr.forEach(([el, v, pr]) => { if (v) el.style.setProperty("overscroll-behavior-y", v, pr); else el.style.removeProperty("overscroll-behavior-y"); }); ptr = null; }
    }
    function open(url) {
      if (!host) build();
      if (!host.isConnected) document.documentElement.appendChild(host);
      clearTimeout(dropTimer);
      side.setAttribute("aria-label", t("ai"));
      side.classList.toggle("lhn-theme-dark", isDark());
      if (!frame || url !== src) {
        frame?.remove(); src = url;
        frame = document.createElement("iframe"); frame.title = "AI panel"; frame.allow = "clipboard-write"; frame.src = url;
        side.appendChild(frame);
      }
      side.classList.remove("lhn-sheet-full"); side.style.removeProperty("height");
      void side.offsetHeight;   // mới gắn vào trang: trượt lên từ dưới
      side.classList.add("lhn-side-visible"); scrim.classList.add("on"); lockPull(true);
    }
    // đóng = gỡ khung AI sau hiệu ứng (lần mở sau tải lại đúng cuộc chat của trang này); report = báo background
    function close(report) {
      if (!isOpen()) return;
      side.classList.remove("lhn-side-visible"); scrim.classList.remove("on"); lockPull(false); fwd = null;
      if (kbOn) { kbOn = false; side.style.removeProperty("bottom"); side.style.removeProperty("max-height"); }
      dropTimer = setTimeout(() => { if (!isOpen()) { frame?.remove(); frame = null; src = ""; } }, 300);
      if (report) void send("AI_SHEET_CLOSED");
    }

    let bound=false;
    function handleMessage(message){if(message?.type!=="KEEPIT_AI_SHEET")return;if(message.close){close(false);return Promise.resolve({ok:true,opened:false});}const url=String(message.url||"");if(!isTouch()||!canOpen()||!url.startsWith(runtime.getURL("pages/ai-panel.html")))return Promise.resolve({ok:false});if(message.toggle&&isOpen()){close(false);return Promise.resolve({ok:true,opened:false});}open(url);return Promise.resolve({ok:true,opened:true});}
    function bindMessages(){if(bound)return;bound=true;runtime.onMessage.addListener(handleMessage);}
    return Object.freeze({open,close,isOpen,bindMessages,handleMessage});
  }
  globalThis.LHN_AI_SHEET=Object.freeze({create});
})();
