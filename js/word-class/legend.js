// Shared Word class legend: the web panel's actual CSS, tooltip and drag behaviour.
// Both owners supply tokens/translations and retain their own model/toggle lifecycle.
(() => {
 'use strict';
 function create(options={}) {
  const api=globalThis.browser||globalThis.chrome, CORE=globalThis.LHN_WORD_CLASS_CORE, LEGEND_KEY='lhnWordClassLegend';
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  let legHost=null,leg=null,legTip=null,legPos=null,view={};
  const bounds=()=>options.bounds?.()||{left:0,top:0,width:innerWidth,height:innerHeight};
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
    leg.querySelector(".x").addEventListener("click", () => { hide(); options.onClose?.(); });
    // row → definition (outside .l: its backdrop-filter would make it the tip's containing block)
    const body = leg.querySelector(".b");
    body.addEventListener("pointerover", e => { if (e.pointerType !== "touch") showTip(e.target.closest?.("span[data-a]")); });
    body.addEventListener("pointerleave", e => { if (e.pointerType !== "touch") hideTip(); });
    body.addEventListener("click", e => { const row = e.target.closest?.("span[data-a]"); if (row && row.classList.contains("tp-on")) hideTip(); else showTip(row); });
    body.addEventListener("scroll", hideTip, { passive:true });
    // drag by the header (mouse / touch / pen)
    const head = leg.querySelector(".h");
    let endDrag=()=>{};
    head.addEventListener("pointerdown", e => {
      if (e.button || e.target.closest(".x")) return;endDrag();
      hideTip();
      const r = leg.getBoundingClientRect(), dx = e.clientX - r.left, dy = e.clientY - r.top;
      head.setPointerCapture(e.pointerId); leg.classList.add("drag"); e.preventDefault();
      const move = ev => placeLegend({ left:ev.clientX - dx, top:ev.clientY - dy });
      const up = () => { head.removeEventListener("pointermove", move); head.removeEventListener("pointerup",up); head.removeEventListener("pointercancel",up); head.removeEventListener("lostpointercapture",up); window.removeEventListener("blur",up); leg.classList.remove("drag"); savePos();endDrag=()=>{}; };endDrag=up;
      head.addEventListener("pointermove", move); head.addEventListener("lostpointercapture",up,{once:true});window.addEventListener("blur",up,{once:true});head.addEventListener("pointerup", up, { once:true }); head.addEventListener("pointercancel", up, { once:true });
    });
    return leg;
  }
  function placeLegend(at) {
    if (!leg) return;
    const area = bounds(), w = leg.offsetWidth, h = leg.offsetHeight, fw = Math.max(0, area.width - w - 8), fh = Math.max(0, area.height - h - 8);
    let left, top;
    if (at) { left = at.left; top = at.top; } else if (legPos) { left = area.left + legPos.x * fw; top = area.top + legPos.y * fh; } else { if(!options.bounds){leg.style.left = ""; leg.style.top = ""; leg.style.right = ""; return;}left=area.left+area.width-w-14;top=area.top+14; }
    left = Math.min(Math.max(area.left+8, left), area.left+Math.max(8, fw)); top = Math.min(Math.max(area.top+8, top), area.top+Math.max(8, fh));
    leg.style.right = "auto"; leg.style.left = left + "px"; leg.style.top = top + "px";
    if (at) legPos = { x:fw ? (left-area.left) / fw : 0, y:fh ? (top-area.top) / fh : 0 };
  }
  function showTip(row) {
    if (!row || !legTip) { hideTip(); return; }
    if (row.classList.contains("tp-on") && legTip.classList.contains("on")) return;
    leg.querySelectorAll(".b span.tp-on").forEach(s => s.classList.remove("tp-on")); row.classList.add("tp-on");
    const a = row.dataset.a, b = row.querySelector("b");
    legTip.classList.toggle("dark", !!view.dark);
    legTip.innerHTML = `<b style="color:${b?.style.color || "inherit"}">${esc(b?.textContent.replace(/:\s*$/, "") || a)}</b>${esc(view.definition(a.replace(/\s+/g, "")))}`;
    const area=bounds(), L = leg.getBoundingClientRect(), r = row.getBoundingClientRect(), w = legTip.offsetWidth, h = legTip.offsetHeight;
    const left = L.left - w - 8 >= area.left+8 ? L.left - w - 8 : Math.min(L.right + 8, area.left+area.width - w - 8);   // beside the panel, the side with room
    const top = Math.min(Math.max(area.top+8, r.top - 6), area.top+area.height - h - 8);
    legTip.style.left = Math.max(area.left+8, left) + "px"; legTip.style.top = top + "px"; legTip.classList.add("on");
  }
  function hideTip() { legTip?.classList.remove("on"); leg?.querySelectorAll(".b span.tp-on").forEach(s => s.classList.remove("tp-on")); }

  function hide(){leg?.classList.remove('on');hideTip();}
  const shown=()=>!!leg?.classList.contains('on');
  function show(value){view=value;const el=legendEl();el.classList.toggle('dark',!!view.dark);el.querySelector('.h b').textContent=view.title;el.querySelector('.x').setAttribute('aria-label',view.closeText);el.querySelector('.x').title=view.closeText;const html=CORE.legend(view.tokens,view.meaning,!!view.dark),body=el.querySelector('.b');if(body.innerHTML!==html){hideTip();body.innerHTML=html;}el.classList.add('on');placeLegend();}
  const savePos=()=>{if(legPos)api?.storage?.local?.set({[LEGEND_KEY]:legPos})?.catch?.(()=>{});};
  const reposition=()=>{if(shown()){hideTip();placeLegend();}};
  addEventListener('resize',reposition,{passive:true});
  api?.storage?.local?.get(LEGEND_KEY).then(d=>{const p=d?.[LEGEND_KEY];if(p&&Number.isFinite(p.x)&&Number.isFinite(p.y)){legPos={x:Math.min(1,Math.max(0,p.x)),y:Math.min(1,Math.max(0,p.y))};placeLegend();}}).catch(()=>{});
  return Object.freeze({show,hide,shown,reposition});
 }
 globalThis.LHN_WORD_CLASS_LEGEND=Object.freeze({create});
})();
