// Overlay — unified UI styles (demo keepit-overlay-unified-demo-v18.html, docs/ui-layout.md).
// Injected into the overlay shadow root next to the legacy markup; every rule is scoped under .ov.
// v3.5.200: LHN_THEME.css('.ov') = biến kính --kp-* dùng chung với thanh Keepit (js/shared/theme-tokens.js).
const UNIFIED_OVERLAY_CSS = globalThis.LHN_THEME.css('.ov') + String.raw`*{box-sizing:border-box}
.ov button{font:inherit;color:inherit}
/* ======================================================================
   OVERLAY — one shell for every device: header · body · dock
   docs/ui-layout.md: data-w: c = DỌC (giao diện Điện thoại) / e = NGANG (giao diện Máy tính)
   data-h: s = điện thoại ngang (ngang, cao < 500) → chỉ Rạp · input chỉ đổi cỡ nút + cử chỉ
   data-tab: view / speak / write · data-view: normal / theater · .vmini = video thu thành thanh
   ====================================================================== */
.ov{--hit:36px;--ico:20px;position:fixed;left:0;top:0;width:100vw;height:var(--ovH,100vh);height:var(--ovH,100dvh);z-index:999998;display:flex;flex-direction:column;overflow:hidden;background:var(--bg);color:var(--tx);font:14px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased;text-align:left;letter-spacing:normal;-webkit-tap-highlight-color:transparent}
.ov[hidden]{display:none}
.ov[data-input=touch]{--hit:44px;--ico:22px}
.ov.dark{--bg:#0e0e11;--pn:#18181b;--pn2:#222227;--bd:rgba(148,163,184,.17);--tx:#f4f4f5;--mu:#bcbcc5;--hov:rgba(255,255,255,.08);--en:#ffff00;--vi:#ffffff;--sen:#e5e7eb;--svi:#c0c5ce;--acc:#8b5cf6;--acct:#c4b5fd;--sel:#26262b;--ok:#22c55e;--warn:#f59e0b;--bad:#ef4444;--shadow:0 18px 40px rgba(0,0,0,.5)}
.ov.light{--bg:#f6f7fb;--pn:#ffffff;--pn2:#eef0f4;--bd:rgba(15,23,42,.11);--tx:#111827;--mu:#475569;--hov:rgba(15,23,42,.06);--en:#8b5cf6;--vi:#4b5563;--sen:#111827;--svi:#4b5563;--acc:#8b5cf6;--acct:#7c3aed;--sel:#eef0f4;--ok:#16a34a;--warn:#d97706;--bad:#dc2626;--shadow:0 18px 40px rgba(15,23,42,.18)}
.ov svg{display:block}
.ib{width:var(--hit);height:var(--hit);border:0;background:none;color:var(--tx);border-radius:12px;display:inline-grid;place-items:center;cursor:pointer;flex:none;position:relative;padding:0;transition:background .15s,color .15s}
.ib svg{width:var(--ico);height:var(--ico)}
.ib:hover{background:var(--hov)}
.ib:focus-visible,.tabs button:focus-visible,.opt:focus-visible{outline:2px solid var(--acc);outline-offset:2px}
.ib.on{color:var(--acct)}
.ib .bdg{position:absolute;right:3px;bottom:3px;min-width:14px;height:14px;padding:0 3px;border-radius:7px;background:var(--acc);color:#fff;font-size:9.5px;font-weight:800;line-height:14px;text-align:center}
.favb.on{color:#ff2d55}
.favb.on svg{fill:currentColor}
.favb.beat{animation:hbeat .5s ease}
@keyframes hbeat{0%{transform:scale(1)}30%{transform:scale(1.22)}55%{transform:scale(.94)}100%{transform:scale(1)}}

/* header */
.hd{flex:none;display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center;gap:10px;padding:8px 10px;border-bottom:1px solid var(--bd);background:var(--bg);z-index:6;transition:opacity .3s,transform .3s}
.brand{display:flex;align-items:center;gap:8px;min-width:0}
.logo{width:28px;height:28px;border-radius:7px;background:linear-gradient(45deg,#4f46e5,#8b5cf6);display:grid;place-items:center;flex:none;color:#fff;box-shadow:0 2px 3px rgba(0,0,0,.2)}
.logo svg{width:28px;height:28px}
.bname{font-weight:700;white-space:nowrap}
.bsrc{color:var(--mu);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
.tabs{position:relative;display:inline-grid;grid-template-columns:repeat(3,1fr);background:var(--pn2);border-radius:13px;padding:3px;justify-self:center}
.tabs button{position:relative;z-index:1;border:0;background:none;color:var(--mu);font-weight:650;height:calc(var(--hit) - 6px);min-width:78px;padding:0 14px;border-radius:10px;display:flex;align-items:center;gap:7px;justify-content:center;cursor:pointer;white-space:nowrap}
.tabs button svg{width:17px;height:17px}
.tabs button[aria-selected=true]{color:var(--tx)}
.tab-ind{position:absolute;top:3px;bottom:3px;left:3px;width:calc((100% - 6px)/3);border-radius:10px;background:var(--pn);box-shadow:0 1px 4px rgba(0,0,0,.28);transition:transform .28s cubic-bezier(.3,.7,.2,1)}
.ov.light .tab-ind{box-shadow:0 1px 4px rgba(15,23,42,.16)}
.hd-act{justify-self:end;display:flex;gap:2px}
.ov[data-w=c] .hd{grid-template-columns:minmax(0,1fr) auto;grid-template-areas:"b a" "t t";row-gap:8px;padding:8px 10px 10px}
.ov[data-w=c] .brand{grid-area:b}.ov[data-w=c] .hd-act{grid-area:a}
.ov[data-w=c] .tabs{grid-area:t;display:grid;width:100%}
.ov[data-w=c] .bsrc{display:none}
.ov[data-h=s] .hd{grid-template-columns:auto minmax(0,1fr) auto;grid-template-areas:none;padding:4px 8px;row-gap:0}
.ov[data-h=s] .brand,.ov[data-h=s] .hd-act,.ov[data-h=s] .tabs{grid-area:auto}
.ov[data-h=s] .tabs{width:auto;display:inline-grid;justify-self:center}
.ov[data-h=s] .bsrc{display:none}
#btnSize{display:inline-grid}
.ov[data-h=s] #btnSize,.ov[data-w=e]:not([data-tab=view]) #btnSize{display:none}
/* phone landscape: only Theater — study tabs dimmed (tap → "Xoay dọc để học") */
.ov[data-h=s] .tabs button:not([data-tab=view]){opacity:.42}

/* body */
.bd{flex:1;min-height:0;display:flex;flex-direction:column;position:relative}
.stage{display:flex;flex-direction:column;min-height:0;min-width:0;position:relative}
.player{position:relative;background:#000;overflow:hidden;flex:none;aspect-ratio:16/9;container-type:size;cursor:pointer;user-select:none;-webkit-user-select:none;touch-action:manipulation}
.vid{filter:var(--vfilter,none);position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(100cqw,calc(100cqh * 16 / 9));aspect-ratio:16/9;overflow:hidden}
.vid svg{width:100%;height:100%}
.wave{position:absolute;left:50%;top:58%;transform:translateX(-50%);display:flex;gap:3px;align-items:flex-end;height:26px}
.wave i{width:3px;height:4px;background:#fff;border-radius:2px;opacity:.9}
.ov.playing .wave i{animation:wv 1s infinite ease-in-out}
@keyframes wv{50%{height:22px}}
.ov[data-input=touch][data-tab=view] .player{touch-action:none;-webkit-user-select:none;user-select:none}
.ttring{position:absolute;top:50%;left:50%;z-index:6;display:flex;flex-direction:column;align-items:center;gap:8px;color:#fff;opacity:0;transform:translate(-50%,-50%);transition:opacity .2s;pointer-events:none}
.ttring.show,.ttseek.show{opacity:1}
.ttring b{padding:3px 10px;border-radius:999px;background:rgba(0,0,0,.6);font-size:16px;font-weight:800;text-shadow:0 1px 4px rgba(0,0,0,.85)}
.ttring-c{display:grid;position:relative;place-items:center;width:84px;height:84px;border-radius:50%;background:rgba(0,0,0,.55)}
.ttring-c>svg{position:absolute;inset:0;width:100%;height:100%;transform:rotate(-90deg)}
.ttring .trk{fill:none;stroke:rgba(255,255,255,.22);stroke-width:5}
.ttring .arc{fill:none;stroke:#fff;stroke-width:5;stroke-linecap:round;stroke-dasharray:226.19;stroke-dashoffset:226.19}
.ttring-ic{display:grid}.ttring-ic svg{width:30px;height:30px}
.ttseek{position:absolute;top:50%;left:50%;z-index:6;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:6px;max-width:80%;padding:10px 16px;border-radius:16px;background:rgba(0,0,0,.6);color:#fff;text-align:center;opacity:0;transition:opacity .2s;pointer-events:none}
.ttseek>div{display:flex;align-items:baseline;gap:8px}.ttseek b{font-size:22px;font-weight:800}.ttseek i{font-style:normal;font-weight:700;opacity:.92}
.ttseek small{font-size:13px;opacity:.95;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.ov.tt-ring-on .tsub{opacity:.18}
.tthint{display:none;position:absolute;inset:24px 0 0 0;z-index:6;pointer-events:none}
.ov.tt-hint-on[data-tab=view][data-view=theater] .tthint{display:block}
.ttzone{position:absolute;top:0;bottom:24px;display:grid;place-items:center;border:1.5px dashed rgba(255,255,255,.45);border-radius:16px;background:rgba(0,0,0,.18);color:rgba(255,255,255,.95);font-size:13px;font-style:normal;font-weight:700}
.ttzone.l{left:24px;width:calc(40% - 24px)}.ttzone.r{right:24px;width:calc(40% - 24px)}
.tthint span{position:absolute;left:50%;top:40%;transform:translate(-50%,-50%);width:min(22%,200px);color:#fff;font-size:12px;font-weight:650;text-align:center;line-height:1.45;text-shadow:0 1px 3px rgba(0,0,0,.9)}
.tthint small{display:block;margin-top:8px;opacity:.9}
.tsub{display:none;position:absolute;left:50%;bottom:9%;transform:translateX(-50%);width:min(92%,1100px);text-align:center;pointer-events:none;z-index:2}
.tsub .a{color:#fff;font-weight:800;font-size:calc(clamp(15px,min(2.9cqw,5.4cqh),34px) * var(--tfit,1));line-height:1.18;text-shadow:0 2px 8px rgba(0,0,0,.85)}
.tsub .b{color:#ffff00;font-weight:600;font-size:calc(clamp(12px,min(2cqw,3.8cqh),23px) * var(--tfit,1));margin-top:4px;text-shadow:0 2px 6px rgba(0,0,0,.85)}
.tsub.bg-soft .a,.tsub.bg-soft .b{background:rgba(0,0,0,.45);box-decoration-break:clone;-webkit-box-decoration-break:clone;padding:0 .25em;border-radius:6px}
.tsub.bg-solid .a,.tsub.bg-solid .b{background:rgba(0,0,0,.88);box-decoration-break:clone;-webkit-box-decoration-break:clone;padding:0 .25em;border-radius:6px}
.prev.bg-soft .a span,.prev.bg-soft .b span{background:rgba(0,0,0,.45);box-decoration-break:clone;-webkit-box-decoration-break:clone;padding:0 .25em;border-radius:6px}
.prev.bg-solid .a span,.prev.bg-solid .b span{background:#000;box-decoration-break:clone;-webkit-box-decoration-break:clone;padding:0 .25em;border-radius:6px}
.prev.bg-soft,.prev.bg-solid{background:linear-gradient(135deg,#3b3f4a,#1c1f26)}
.list.sbold .row .en{font-weight:700}
.cinfo{display:none}
.vplay{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) scale(.8);width:64px;height:64px;border-radius:50%;background:rgba(0,0,0,.55);color:#fff;display:grid;place-items:center;opacity:0;transition:.2s;pointer-events:none}
.vplay svg{width:28px;height:28px}
.ov:not(.playing) .player:not(.card) .vplay{opacity:1;transform:translate(-50%,-50%) scale(1)}
/* compact card (reading / study) */
.player.card{container-type:normal;aspect-ratio:auto;height:76px;margin:10px 12px 0;border-radius:16px;background:var(--pn);border:1px solid var(--bd)}
.player.card .vid{left:8px;top:8px;transform:none;width:104px;height:58px;aspect-ratio:auto;border-radius:10px}
.player.card .wave,.player.card .tsub{display:none!important}
.player.card .cinfo{display:flex;position:absolute;inset:0;padding:0 10px 0 124px;align-items:center;gap:10px}
.cinfo .ct{flex:1;min-width:0}
.cinfo .ct b{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font-size:13.5px;line-height:1.3}
.cinfo .ct small{display:block;color:var(--mu);font-size:11.5px;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cplay{width:46px;height:46px;border-radius:50%;border:0;background:var(--acc);color:#fff;display:grid;place-items:center;cursor:pointer;flex:none}
.cplay svg{width:20px;height:20px}
.spec{display:flex;gap:2px;align-items:flex-end;height:18px}
.spec i{width:3px;height:5px;background:var(--acct);border-radius:2px}
.ov.playing .spec i{animation:wv2 .9s infinite ease-in-out}
.spec i:nth-child(2){animation-delay:.15s!important}.spec i:nth-child(3){animation-delay:.3s!important}.spec i:nth-child(4){animation-delay:.45s!important}
@keyframes wv2{50%{height:17px}}
/* subtitle box */
.subbox{position:relative;flex:none;padding:18px 18px 14px;text-align:center;display:flex;flex-direction:column;justify-content:center;gap:6px;min-height:96px;transition:height .25s}
.sub-en{color:var(--en);font-weight:700;font-size:calc(var(--fs-en,19px) * var(--fit,1));line-height:1.3}
.sub-vi{color:var(--vi);font-size:calc(var(--fs-vi,15.5px) * var(--fit,1));line-height:1.35;opacity:.93}
.ov.subhid .subbox .sub-en,.ov.subhid .subbox .sub-vi{display:none}
#ov.subhid .subbox{min-height:0;height:18px;padding:0;flex:none;overflow:hidden}
#ov.subhid .sgrip{height:18px;width:100%}
.ov[data-cc=pri] .sub-vi,.ov[data-cc=pri] .tsub .b{display:none}
.ov[data-cc=tr] .sub-en,.ov[data-cc=tr] .tsub .a{display:none}
.ov[data-cc=off] .sub-en,.ov[data-cc=off] .sub-vi,.ov[data-cc=off] .tsub{display:none!important}
/* v3.5.206: Phụ đề cuộn (tab Xem) theo cùng Chế độ phụ đề với phụ đề video. Bản dịch: câu chưa có bản dịch vẫn hiện dòng gốc. Ẩn: chỉ còn mốc thời gian. */
.ov[data-tab=view][data-cc=pri] #list .row .vi{display:none}
.ov[data-tab=view][data-cc=tr] #list .row:has(.vi:not(:empty)) .en{display:none}
.ov[data-tab=view][data-cc=tr] #list .row .vi{margin-top:0}
.ov[data-tab=view][data-cc=off] #list .row .en,.ov[data-tab=view][data-cc=off] #list .row .vi{display:none}
.ov[data-tab=view][data-cc=off] #list .row .rhd{margin-bottom:0}
/* compact subtitle box: ♥ · ⌄ · ⛶ row (approved v3.5.168) */
/* compact subtitle box: thin grip on top (tap/drag folds); ♥ ⛶ sit on the video */
.ov[data-w=c] .subbox{height:clamp(124px,calc(var(--bdH,700px) * .26 - 26px),204px);padding:18px 14px 12px;min-height:0}
.ov[data-w=c][data-tab=view] .subbox{overflow-y:auto;overscroll-behavior:contain;justify-content:safe center;scrollbar-width:none}
.ov[data-w=c] .target{font-size:23px}
/* portrait on a wide screen (tablet / narrow window): same phone layout, text width capped ~680px */
.ov[data-w=c] .subbox .sub-en,.ov[data-w=c] .subbox .sub-vi{width:100%;max-width:680px;margin:0 auto}
.ov[data-w=c] .list>.row{max-width:680px;margin-left:auto;margin-right:auto}
.ov[data-w=c] .player.card{width:calc(100% - 24px);max-width:680px;align-self:center}
.ov[data-w=c][data-tab=view] .stage{flex:none}
.ov[data-w=c][data-tab=view][data-view=normal] .player:not(.card){margin:10px 12px 0;border-radius:16px}
.ov[data-tab=view][data-view=normal] .player .vid{border-radius:16px}
.ov[data-w=c][data-tab=view][data-view=normal] .player:not(.card){max-height:calc(var(--bdH,700px) * .45)}
.ov[data-w=c] .study{align-items:center}.ov[data-w=c] .study>*{width:100%;max-width:680px}
/* tap-to-translate words */
.wd{border-radius:4px;cursor:pointer;transition:background .15s}
.wd:hover{background:rgba(139,92,246,.28)}
.wd.on{background:rgba(139,92,246,.45);color:#fff}
.tsub .a .wd{pointer-events:auto}
.pnl.pop.dictp{width:min(380px,calc(100% - 16px))}
.dw{display:flex;align-items:center;gap:10px;margin:2px 0 6px}
.dw b{font-size:22px;font-weight:800}
.dw b{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dw .ipa{color:var(--mu);font:600 13px ui-monospace,Menlo,monospace;white-space:nowrap}
.dw .ib{margin-left:auto}
.dmean{font-size:16px;font-weight:700;color:var(--acct);margin:2px 0 8px}
.dpos{display:flex;gap:8px;align-items:flex-start;margin:6px 0;font-size:14px;line-height:1.4}
.dpos>span{flex:none;font-size:11px;font-weight:800;border-radius:6px;padding:2px 6px;background:rgba(245,158,11,.15);color:var(--warn)}
.dex{border-left:3px solid var(--acc);padding:4px 10px;margin:8px 0;color:var(--mu);font-size:13.5px;font-style:italic}
.dex mark{background:none;color:var(--acct);font-weight:700}
.drel{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}.drel .k{font-size:12px;color:var(--mu);font-weight:700;width:100%}
.drel span:not(.k){border:1px solid var(--bd);border-radius:999px;padding:3px 10px;font-size:13px}
.dbrand{display:flex;align-items:center;gap:6px;color:var(--acct);font-weight:800;font-size:12px;margin-top:8px}
.dbrand svg{width:16px;height:16px}
.sgrip{display:block;position:absolute;left:50%;top:0;transform:translateX(-50%);width:104px;height:32px;border:0;background:none;padding:0;cursor:grab;touch-action:none;z-index:2}
.sgrip::before{content:"";position:absolute;left:50%;top:7px;width:36px;height:4px;margin-left:-18px;border-radius:2px;background:var(--mu);opacity:.5;transition:opacity .2s,width .2s}
.sgrip:hover::before{opacity:.9}
.ov.subhid .sgrip::before{background:var(--acct);opacity:.9}
.vcorner{display:flex;position:absolute;z-index:3;gap:8px;right:calc((100cqw - min(100cqw, 100cqh * 16 / 9)) / 2 + 10px);bottom:calc((100cqh - min(100cqw, 100cqh * 16 / 9) * 9 / 16) / 2 + 10px);transition:opacity .2s}
.vc{position:relative;width:32px;height:32px;border-radius:50%;border:0;background:rgba(0,0,0,.5);color:#fff;display:grid;place-items:center;cursor:pointer;padding:0;-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px)}
.vc::after{content:"";position:absolute;inset:-6px}
.vc svg{width:17px;height:17px}
.vc[hidden]{display:none}
.vc.favb.on{color:#ff2d55}
/* auto-hide like YouTube: visible when paused, on hover (mouse) or after a tap (touch) */
.player:not(.card) .vcorner{opacity:0;pointer-events:none}
.ov:not(.playing) .player:not(.card) .vcorner,.player.ctl-on:not(.card) .vcorner{opacity:1;pointer-events:auto}
.player.ctl-on:not(.card) .vplay{opacity:1;transform:translate(-50%,-50%) scale(1)}
.ov:not(.playing) .player:not(.card) .vplay,.player.ctl-on:not(.card) .vplay{pointer-events:auto;cursor:pointer}
.player:not(.card) .vid::after{content:"";position:absolute;inset:auto 0 0 0;height:38%;background:linear-gradient(transparent,rgba(0,0,0,.38));opacity:0;transition:opacity .2s;pointer-events:none;z-index:1}
.ov:not(.playing) .player:not(.card) .vid::after,.player.ctl-on:not(.card) .vid::after{opacity:1}
.ov[data-w=e][data-tab=view][data-view=theater] .vcorner{display:none}
.ov[data-w=c][data-tab=view][data-view=theater].chrome-off .vcorner{opacity:0;pointer-events:none}
/* on the mini card: next to the play button, always visible */
.player.card .vcorner{right:64px;top:50%;bottom:auto;transform:translateY(-50%)}
.player.card .vc{background:var(--pn2);color:var(--tx)}
.player.card .vc.favb.on{color:#ff2d55}
.player.card .ct{margin-right:80px}
.player.card .spec{display:none}
/* side list (transcript / sentence list share one row style) */
.side{display:flex;flex-direction:column;min-height:0;min-width:0;background:var(--bg);position:relative}
.side-hd{display:none;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid var(--bd);flex:none}
.side-hd .t{font-weight:700;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.list{flex:1;min-height:0;overflow:auto;padding:6px 8px 18px;scrollbar-width:none;-webkit-mask-image:linear-gradient(transparent,#000 12px,#000 calc(100% - 26px),transparent);mask-image:linear-gradient(transparent,#000 12px,#000 calc(100% - 26px),transparent)}
.list::-webkit-scrollbar{display:none}
.row{display:block;padding:8px 12px 10px 11px;border-radius:14px;cursor:pointer;border-left:3px solid transparent}
.row .rhd{display:flex;align-items:center;gap:6px;min-height:18px;margin-bottom:2px}
.row:hover{background:var(--hov)}
.row .tm{flex:1;color:var(--acct);font-size:11.5px;font-weight:700;font-variant-numeric:tabular-nums;letter-spacing:.2px}
.row .en{font-size:calc(var(--fs-sen,15.5px) * var(--rz,1));color:var(--sen);line-height:1.35}
.row .vi{color:var(--svi);font-size:calc(var(--fs-svi,13px) * var(--rz,1));margin-top:3px;line-height:1.35}
.row.cur{background:var(--sel);border-left-color:var(--acc)}
.row .st{display:flex;gap:4px;align-items:center}
.row .st:empty{display:none}
.row .ok{color:var(--ok)}.row .ok svg{width:15px;height:15px}
.row.unsolved .en,.row.unsolved .vi,.row.redo .en,.row.redo .vi,.row.locked .en{filter:blur(5px);user-select:none}
.row.locked{cursor:not-allowed;opacity:.55}.row.locked .vi{display:none}.row.locked:hover{background:none}
.row .lk{color:var(--mu)}.row .lk svg{width:14px;height:14px}
.row .sc{font-size:11px;font-weight:800;border-radius:7px;padding:1px 6px;background:rgba(34,197,94,.15);color:var(--ok)}
.row .sc.mid{background:rgba(245,158,11,.15);color:var(--warn)}.row .sc.low{background:rgba(239,68,68,.15);color:var(--bad)}
.split{display:none;flex:none;width:7px;cursor:col-resize;position:relative;background:transparent}
.split::after{content:"";position:absolute;left:3px;top:0;bottom:0;width:1px;background:var(--bd)}
.split:hover::after{background:var(--acc);width:2px;left:2px}
/* study centre */
.study{display:none;flex:1;min-height:0;flex-direction:column;padding:10px 12px 12px;gap:10px}
.notes{display:none;flex-direction:column;min-height:0;border-left:1px solid var(--bd);background:var(--bg)}
.colrail{display:none}

/* ---------- layouts ---------- */
/* VIEW · compact & medium: stacked (video / subtitles / list) */
.ov[data-tab=view] .side{flex:1}
/* VIEW · landscape: one layout — video + subtitles | list; splitter 25–80 % (snaps 34 / 60); .vmini = thanh video */
.ov[data-tab=view][data-w=e][data-view=normal] .bd{flex-direction:row;align-items:stretch}
.ov[data-tab=view][data-w=e][data-view=normal] .stage{flex:0 0 clamp(300px,var(--split,60%),80%);width:auto}
.ov[data-tab=view][data-w=e][data-view=normal] .player:not(.card){flex:none;aspect-ratio:16/9;width:min(calc(100% - 20px),calc((var(--bdH,700px) - 130px) * 16 / 9));align-self:center;margin:10px 0 0;border-radius:16px}
.ov[data-tab=view][data-w=e][data-view=normal] .subbox{flex:1;min-height:96px;justify-content:safe center;overflow:auto;scrollbar-width:none}
.ov[data-tab=view][data-w=e][data-view=normal].vmini .subbox{justify-content:flex-start;padding-top:26px}
.ov[data-tab=view][data-w=e][data-view=normal] .split{display:block}
.ov[data-tab=view][data-w=e][data-view=normal] .side{flex:1;width:auto}
.ov[data-tab=view][data-w=e][data-view=normal] .list{padding:10px 18px 24px}
.ov[data-tab=view][data-w=e][data-view=normal] .list>.row{max-width:880px;margin-left:auto;margin-right:auto}
.ov[data-tab=view][data-w=e][data-view=normal] .row{padding:10px 14px 12px 13px}
.split{width:16px;touch-action:none;margin:0 -8px;z-index:4}
.split::after{display:none}
.ov[data-tab=view][data-w=e][data-view=normal] .side{border-left:1px solid var(--bd)}
.ov.dragging,.ov.dragging *{transition:none!important;user-select:none;cursor:col-resize}
.ov.dragging .list,.ov.dragging .notes{contain:layout paint}
.split::after{left:7px}
.split:hover::after,.split.drag::after{left:7px}
.split::before{content:"";position:absolute;left:50%;top:50%;width:6px;height:40px;margin:-20px 0 0 -3px;border-radius:3px;background:var(--bd);transition:background .15s}
.split:hover::before,.split.drag::before{background:var(--acc)}
/* VIEW · theater: video fills, header + dock float and auto-hide */
.ov[data-tab=view][data-view=theater] .side,.ov[data-tab=view][data-view=theater] .subbox,.ov[data-tab=view][data-view=theater] .split{display:none}
.ov[data-tab=view][data-view=theater] .stage{flex:1}
.ov[data-tab=view][data-view=theater] .player{flex:1;aspect-ratio:auto}
.ov[data-tab=view][data-view=theater] .tsub{display:block}
.ov[data-tab=view][data-view=theater] .hd{position:absolute;left:0;right:0;top:0;border:0;background:linear-gradient(rgba(0,0,0,.72),transparent);color:#fff;--tx:#fff;--mu:#d4d4d8}
.ov[data-tab=view][data-view=theater] .dock{position:absolute;left:0;right:0;bottom:0;border:0;background:linear-gradient(transparent,rgba(0,0,0,.82));--tx:#fff;--mu:#d4d4d8;color:var(--tx)}
.ov[data-tab=view][data-view=theater] .tabs{background:rgba(255,255,255,.14)}
.ov[data-tab=view][data-view=theater] .tab-ind{background:rgba(255,255,255,.22)}
.ov.chrome-off .hd{opacity:0;transform:translateY(-10px);pointer-events:none}
.ov.chrome-off .dock{opacity:0;transform:translateY(10px);pointer-events:none}
.ov.chrome-off .tsub{bottom:4%}
.ov[data-tab=view][data-view=theater]:not(.chrome-off) .tsub{bottom:calc(var(--dockH,64px) + 8px);transition:bottom .3s}
/* SHORT landscape (phones sideways): video left + list right */
/* STUDY (Nói · Chép) */
.ov:not([data-tab=view]) .subbox,.ov:not([data-tab=view]) .split{display:none}
.ov:not([data-tab=view]) .study{display:flex}
.ov:not([data-tab=view]) .stage{flex:1}
.ov:not([data-tab=view]) .player:not(.card){margin:10px 12px 0;border-radius:16px;max-height:34%;align-self:stretch}
.ov:not([data-tab=view]) .player:not(.card) .vid{border-radius:16px}
.ov:not([data-tab=view]) .side-hd{display:flex}
.ov:not([data-tab=view])[data-w=c] .side{display:none}
.ov:not([data-tab=view])[data-w=e] .bd{flex-direction:row}
.ov:not([data-tab=view])[data-w=e] .side{order:0;width:var(--colL,290px);flex:none;border-right:1px solid var(--bd)}
.ov:not([data-tab=view])[data-w=e] .stage{order:2}
.ov:not([data-tab=view])[data-w=e] .notes{display:flex;order:4;width:var(--colR,300px);flex:none}
.csplit{display:none;flex:none;width:16px;margin:0 -8px;z-index:4;cursor:col-resize;position:relative;touch-action:none}
.csplit::before{content:"";position:absolute;left:50%;top:50%;width:6px;height:40px;margin:-20px 0 0 -3px;border-radius:3px;background:var(--bd);transition:background .15s}
.csplit:hover::before,.csplit.drag::before{background:var(--acc)}
.ov:not([data-tab=view])[data-w=e]:not(.col-list-off) #csL{display:block;order:1}
.ov:not([data-tab=view])[data-w=e]:not(.col-notes-off) #csR{display:block;order:3}
.ov.col-list-off:not([data-tab=view])[data-w=e] .side,.ov.col-notes-off:not([data-tab=view])[data-w=e] .notes{display:none}
.ov.col-list-off:not([data-tab=view])[data-w=e] .colrail.l,.ov.col-notes-off:not([data-tab=view])[data-w=e] .colrail.r{display:flex}
.colrail{flex:none;width:44px;flex-direction:column;align-items:center;padding-top:8px;gap:6px;border-right:1px solid var(--bd)}
.colrail.r{order:5;border-right:0;border-left:1px solid var(--bd)}
.colrail.l{order:0}
.amb{position:absolute;z-index:0;pointer-events:none;opacity:0;transition:opacity .6s,left .3s,top .3s,width .3s,height .3s;filter:blur(48px) saturate(2);transform:scale(1.45)}
.amb svg{width:100%;height:100%;display:block}
.ov.ambient .amb:not(.gone){opacity:.85}
.ov.ambient .player:not(.card){background:transparent}.ov.ambient.light .amb:not(.gone){opacity:.5}
.ov.ambient.playing .amb{animation:ambShift 7s ease-in-out infinite alternate}
@keyframes ambShift{0%{filter:blur(56px) saturate(1.9) hue-rotate(-12deg)}50%{filter:blur(64px) saturate(2.1) hue-rotate(10deg)}100%{filter:blur(56px) saturate(1.7) hue-rotate(24deg)}}
.ov>.bd{z-index:1}.ov>.hd{position:relative}
.ov.ambient .side,.ov.ambient .notes,.ov.ambient .dock,.ov.ambient .hd,.ov.ambient .colrail{background:transparent}
.amb.full{transform:none;filter:blur(80px) saturate(1.8)}
.ov.ambient .amb.full:not(.gone){opacity:.55}.ov.ambient.light .amb.full:not(.gone){opacity:.4}
.ov.ambient .scard,.ov.ambient .player.card{background:color-mix(in srgb,var(--pn) 42%,transparent);border-color:color-mix(in srgb,var(--tx) 9%,transparent);-webkit-backdrop-filter:blur(24px) saturate(1.35);backdrop-filter:blur(24px) saturate(1.35);box-shadow:0 10px 34px rgba(0,0,0,.18)}
.ov.ambient .wbox{background:transparent;border-color:color-mix(in srgb,var(--tx) 8%,transparent)}
.ov.ambient .tabs{background:color-mix(in srgb,var(--pn) 40%,transparent);-webkit-backdrop-filter:blur(14px) saturate(1.4);backdrop-filter:blur(14px) saturate(1.4);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--tx) 8%,transparent)}
.ov.ambient .row.cur{background:color-mix(in srgb,var(--pn) 44%,transparent);-webkit-backdrop-filter:blur(12px) saturate(1.4);backdrop-filter:blur(12px) saturate(1.4)}
.ov.ambient .sctl{border-color:color-mix(in srgb,var(--tx) 8%,transparent)}
.ov.ambient #sideHd .pill,.ov.ambient .wbox textarea,.ov.ambient .lnote textarea,.ov.ambient .tn,.ov.ambient .tadd,.ov.ambient .wsearch,.ov.ambient .wlbox,.ov.ambient .scard .chip,.ov.ambient .scard .pill:not(.pri),.ov.ambient .player.card .vc{background:color-mix(in srgb,var(--pn2) 45%,transparent);border-color:color-mix(in srgb,var(--tx) 10%,transparent)}
.ov.ambient .scard .tg:not(.on){background:transparent;border-color:color-mix(in srgb,var(--tx) 12%,transparent)}
.ov.ambient .stage>*{position:relative;z-index:1}
.ov.ambient .stage>.player{position:relative}
.ov.ambient .pnl{background:var(--kp-glass-d);-webkit-backdrop-filter:var(--kp-blur);backdrop-filter:var(--kp-blur)}
.ov.ambient.light .pnl{background:var(--kp-glass-l)}
.ov.ambient .pnl :is(.tile,.seg,.sgrid button:not(.on),.btnw.sec2,.pill:not(.pri),.chip,.tn,.tadd,.wsearch,.wlbox,.lnote textarea,.stat){background:var(--kp-tile-d)}
.ov.ambient .pnl :is(.tile,.seg){box-shadow:inset 0 0 0 1px var(--kp-line-d)}
.ov.ambient .pnl :is(.sgrid button:not(.on),.pill:not(.pri),.chip,.tn,.tadd,.wsearch,.wlbox,.lnote textarea){border-color:var(--kp-line-d)}
.ov.ambient .pnl .seg button.on{background:var(--kp-glass-d)}
.ov.ambient .pnl :is(.opt.sel,.lrow.sel){background:var(--kp-line-d)}
.ov.ambient.light .pnl :is(.tile,.seg,.sgrid button:not(.on),.btnw.sec2,.pill:not(.pri),.chip,.tn,.tadd,.wsearch,.wlbox,.lnote textarea,.stat){background:var(--kp-tile-l)}
.ov.ambient.light .pnl :is(.tile,.seg){box-shadow:inset 0 0 0 1px var(--kp-line-l),0 1px 2px rgba(15,23,42,.05)}
.ov.ambient.light .pnl :is(.sgrid button:not(.on),.pill:not(.pri),.chip,.tn,.tadd,.wsearch,.wlbox,.lnote textarea){border-color:var(--kp-line-l)}
.ov.ambient.light .pnl .seg button.on{background:var(--kp-glass-l)}
.ov.ambient.light .pnl :is(.opt.sel,.lrow.sel){background:var(--kp-line-l)}

/* ---------- study card ---------- */
.scard{position:relative;flex:1;min-height:0;display:flex;flex-direction:column;background:var(--pn);border:1px solid var(--bd);border-radius:20px;overflow:hidden;touch-action:pan-y;transition:transform .25s,opacity .25s}
.scard.drag{transition:none}
.scard.drag{user-select:none;-webkit-user-select:none}
.scard.sw-in{animation:swIn .22s cubic-bezier(.2,.8,.3,1)}
@keyframes swIn{from{opacity:0;transform:translateX(var(--sx,0))}}
.ov.gdrag .player{z-index:6;will-change:transform}
.ov.gdrag:not(.chrome-off) .hd,.ov.gdrag:not(.chrome-off) .dock,.ov.gdrag .subbox,.ov.gdrag .side,.ov.gdrag .tsub{opacity:var(--gfade,1)}
.player.g-in{animation:gIn .28s cubic-bezier(.2,.8,.3,1)}
@keyframes gIn{from{transform:translateY(var(--gy,0)) scale(var(--gs,.9));opacity:.5}}
.player.card .vid>.te-web-page-thumbnail.te-web-thumbnail-bg{filter:none!important;transform:none!important;will-change:auto!important}
.ov.ambient.dark:not([data-tab=view][data-view=theater]) .tab-ind{background:color-mix(in srgb,var(--tx) 11%,transparent);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--tx) 9%,transparent)}
.ov.ambient.light:not([data-tab=view][data-view=theater]) .tab-ind{background:color-mix(in srgb,var(--pn) 62%,transparent);box-shadow:0 1px 3px rgba(15,23,42,.1)}
.kpscrim{position:fixed;inset:0;z-index:2147483645;background:rgba(0,0,0,.45);-webkit-tap-highlight-color:transparent}
.kpscrim[hidden]{display:none}
.sbody.sx-out{opacity:0;transform:translateX(var(--sx,0px));transition:opacity 80ms ease-in,transform 80ms ease-in}
.sbody.sx-in{animation:sxin .16s cubic-bezier(.2,.8,.2,1)}
@keyframes sxin{from{opacity:0;transform:translateX(var(--sx,0px))}to{opacity:1;transform:none}}
.scard-hd{display:flex;align-items:center;gap:6px;padding:10px 10px 6px 10px;flex:none}
.scard-hd .sp{flex:1}
.ov[data-w=e] .scard-hd{padding-left:12px;padding-right:12px}
.ov[data-w=e] .sbody{padding-left:12px;padding-right:12px}
.ov[data-w=e] .sbody>:is(.target,.trans,.heard,.help,.hint,.diff,.rpanel,.res){width:100%;max-width:none}
.chip{display:inline-flex;align-items:center;gap:7px;border:1px solid var(--bd);border-radius:999px;padding:3px 11px 3px 3px;background:var(--pn2);font-weight:750;font-size:13px;cursor:pointer;height:34px}
.chip svg{width:28px;height:28px}
.chip .lab{font-variant-numeric:tabular-nums}
.tg{height:34px;border:1px solid var(--bd);border-radius:10px;background:none;color:var(--mu);display:inline-flex;align-items:center;gap:5px;padding:0 9px;font-size:12.5px;font-weight:650;cursor:pointer}
.tg svg{width:16px;height:16px}
.tg.on{color:var(--acct);border-color:color-mix(in srgb,var(--acc) 55%,transparent);background:color-mix(in srgb,var(--acc) 12%,transparent)}
.ov[data-input=touch] .tg{height:38px}
.sbody{flex:1;min-height:0;overflow:auto;padding:6px 16px 10px;display:flex;flex-direction:column;align-items:center;justify-content:safe center;gap:12px;scrollbar-width:none}
.sbody::-webkit-scrollbar{display:none}
.sbody>*{flex-shrink:0}
/* result feedback — same sounds / confetti / copy as the app, styled like the card */
.cft-layer{position:absolute;inset:0;z-index:70;overflow:hidden;pointer-events:none;contain:layout paint}
.cft{position:absolute;top:60%;left:50%;width:7px;height:11px;border-radius:2px;animation:cftFall 1300ms cubic-bezier(.2,.7,.4,1) forwards}
@keyframes cftFall{0%{transform:translate(0,0) rotate(0);opacity:1}40%{transform:translate(var(--ux),var(--uy)) rotate(calc(var(--rot) * .5));opacity:1}100%{transform:translate(var(--dx),var(--dy)) rotate(var(--rot));opacity:0}}
@media (prefers-reduced-motion:reduce){.cft{animation-duration:1ms}}
.sptoast{position:absolute;top:14px;left:50%;z-index:30;width:min(460px,calc(100% - 20px));display:flex;align-items:center;gap:14px;padding:12px 16px;border-radius:20px;transform:translateX(-50%);background:color-mix(in srgb,var(--pn) 72%,transparent);border:1px solid rgba(16,185,129,.35);-webkit-backdrop-filter:blur(28px) saturate(1.8);backdrop-filter:blur(28px) saturate(1.8);box-shadow:0 12px 32px rgba(0,0,0,.28);cursor:pointer;animation:spPop .5s cubic-bezier(.175,.885,.32,1.275) both}
.sptoast.warn{border-color:rgba(245,158,11,.4)}.sptoast.fail{border-color:rgba(239,68,68,.4)}
.sptoast.exit{animation:spOut .28s ease forwards}
@keyframes spPop{0%{opacity:0;transform:translateX(-50%) translateY(-10px) scale(.92)}100%{opacity:1;transform:translateX(-50%) scale(1)}}
@keyframes spOut{to{opacity:0;transform:translateX(-50%) translateY(-8px) scale(.96)}}
.sptoast .ring{position:relative;flex:0 0 50px;width:50px;height:50px;display:grid;place-items:center}
.sptoast .ring svg{position:absolute;inset:0;width:100%;height:100%;transform:rotate(-90deg);overflow:visible}
.sptoast .ring .bg{fill:none;stroke:color-mix(in srgb,var(--tx) 14%,transparent);stroke-width:4}
.sptoast .ring .fg{fill:none;stroke:#10b981;stroke-width:4;stroke-linecap:round;filter:drop-shadow(0 0 4px #10b981)}
.sptoast.warn .ring .fg{stroke:#f59e0b;filter:drop-shadow(0 0 4px #f59e0b)}.sptoast.fail .ring .fg{stroke:#ef4444;filter:drop-shadow(0 0 4px #ef4444)}
.sptoast .ring b{font-size:12.5px;font-weight:800}
.sptoast .tx{min-width:0}.sptoast .tx b{display:block;font-size:15px;color:#10b981}.sptoast.warn .tx b{color:#f59e0b}.sptoast.fail .tx b{color:#ef4444}
.sptoast .tx small{display:block;color:var(--mu);font-size:12px;line-height:1.4;margin-top:2px}
.rpanel{width:100%;max-width:680px;border-radius:14px;padding:10px 12px;border:1px solid rgba(239,68,68,.3);background:rgba(239,68,68,.08)}
.rpanel.ok{border-color:rgba(34,197,94,.32);background:rgba(34,197,94,.08)}
.rpanel.hnt{border-color:rgba(245,158,11,.32);background:rgba(245,158,11,.08)}.rpanel.hnt .rt{color:var(--warn)}
.rpanel .rt{display:flex;align-items:center;gap:7px;margin-bottom:6px;color:var(--bad)}.rpanel.ok .rt{color:var(--ok)}
.rpanel .rt svg{width:17px;height:17px}.rpanel .rt .sp{flex:1}.rpanel .rt .acc{font-weight:800}
.rpanel .diff{font-size:17px;text-align:left;max-width:none}.rpanel .wdiff .fix{color:var(--warn)}
.legend{font-size:12px}

.chip .ctm{font-weight:600;color:var(--mu);font-size:.92em}
.chip .ctm i{font-style:normal}
.chip .lab,.scard-hd .tg span{white-space:nowrap}
.ov[data-w=c] .chip .lab{display:flex;flex-direction:column;align-items:flex-start;line-height:1.1}
.ov[data-w=c] .chip .ctm{font-size:10.5px}
.ov[data-w=c] .chip .ctm i{display:none}
.wbox .r .pill{flex:none;white-space:nowrap}
.ov[data-w=c] .wbox .r{gap:6px}
.ov[data-w=c] .wbox .r .pill{padding:0 12px;gap:5px}
.target{font-size:clamp(19px,2.2vw + 10px,26px);font-weight:750;line-height:1.38;text-align:center;max-width:680px}
.target .w{border-radius:5px;transition:color .2s}
.target .w.ok{color:var(--ok)}.target .w.near{color:var(--warn)}.target .w.miss{color:var(--bad);text-decoration:underline wavy;text-underline-offset:4px}
.target.blur .w{filter:blur(7px);user-select:none}
.trans{color:var(--mu);text-align:center;max-width:620px;font-size:15px}
.heard{min-height:24px;color:var(--mu);text-align:center;font-style:italic;max-width:620px}
.sctl{flex:none;display:flex;flex-direction:column;align-items:center;gap:6px;padding:10px 14px 12px;border-top:1px solid var(--bd)}
.sctl .r{display:flex;align-items:center;justify-content:center;gap:18px;width:100%}
.sctl .r.main{display:grid;grid-template-columns:1fr auto 1fr;gap:16px}
.sctl .r.main>:first-child{justify-self:end}
.sctl .r.main>:last-child{justify-self:start}
.sctl .r.main{grid-template-columns:minmax(0,1fr) auto minmax(0,1fr)}
.ov[data-w=c] .sctl .r.main{gap:10px}
.ov[data-w=c] .sctl .r.main .pill{padding:0 10px;gap:4px;font-size:13px;min-width:0}
.ov[data-w=c] .sctl .r.main .pill svg{width:16px;height:16px}
.pill{height:42px;border-radius:21px;border:1px solid var(--bd);background:var(--pn2);color:var(--tx);display:inline-flex;align-items:center;gap:7px;padding:0 15px;font-weight:650;cursor:pointer;white-space:nowrap}
.pill svg{width:18px;height:18px}
.pill.pri{background:var(--acc);border-color:var(--acc);color:#fff}
.mic{width:76px;height:76px;border-radius:50%;border:0;background:var(--acc);color:#fff;display:grid;place-items:center;cursor:pointer;box-shadow:0 10px 28px rgba(139,92,246,.45);flex:none;position:relative}
.mic svg{width:32px;height:32px}
.mic.rec{background:#ef4444;box-shadow:0 0 0 0 rgba(239,68,68,.6);animation:pulse 1.3s infinite}
@keyframes pulse{70%{box-shadow:0 0 0 18px rgba(239,68,68,0)}100%{box-shadow:0 0 0 0 rgba(239,68,68,0)}}
.help{color:var(--mu);font-size:12px;font-weight:500;text-align:center;max-width:560px}
.help.kbdh{display:none}
.ov[data-input=mouse] .help.kbdh{display:block}
.ov[data-input=mouse] .help.tch{display:none}
.lbars{display:flex;gap:4px;align-items:center;height:30px}
.lbars i{width:4px;height:6px;border-radius:3px;background:var(--bad);animation:wv3 .8s infinite ease-in-out}
@keyframes wv3{50%{height:28px}}
.listen{width:40px;height:40px;flex:none;border-radius:50%;border:0;background:color-mix(in srgb,var(--acc) 16%,transparent);color:var(--acct);display:grid;place-items:center;cursor:pointer}
.ov[data-input=touch] .listen{width:44px;height:44px}
.wbox .r .pill.lis.on{border-color:var(--acc);color:var(--acct)}
/* v3.5.249: nút chính hàng Chép (Kiểm tra / Tiếp) có viền ngoài như nút "1 từ" */.wbox .r .pill.pri{border-color:var(--bd);background-clip:padding-box}.ov.ambient .wbox .r .pill.pri{border-color:color-mix(in srgb,var(--tx) 10%,transparent)}
.wbox .r .pill.lis.on svg{animation:pulse2 1.2s infinite}
.ov[data-w=c] .rpanel .diff{font-size:15px}
.listen svg{width:20px;height:20px}
.listen.on{animation:pulse2 1.2s infinite}
@keyframes pulse2{50%{transform:scale(1.06)}}
.hint{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;color:var(--mu);text-align:center;letter-spacing:.5px;font-size:15px;max-width:640px}
.diff{text-align:center;font-size:18px;line-height:1.6;max-width:680px}
.diff .msk{color:var(--warn);letter-spacing:.08em;white-space:nowrap}.diff .emp{color:var(--mu);font-style:italic;font-size:14px}
.pnh{padding:0 2px;color:var(--mu);font-size:14px;font-weight:400;line-height:1.4;text-align:left}.pnh b{color:var(--tx);font-weight:700}
.wbox{position:relative}.wmk{position:absolute;z-index:2;overflow:hidden;pointer-events:none}.wmk>div{position:absolute;left:0;top:0;right:0;box-sizing:border-box;border-style:solid;border-color:transparent;color:transparent;white-space:pre-wrap;overflow-wrap:break-word;word-break:normal;user-select:none}
.wmk .ww{text-decoration-line:underline;text-decoration-color:var(--bad);text-decoration-thickness:3px;text-underline-offset:4px;text-decoration-skip-ink:none}.wmk .wg{background-image:linear-gradient(var(--bad),var(--bad));background-repeat:no-repeat;background-position:left bottom;background-size:100% 3px}
.diff .ok{color:var(--ok)}.diff .bad{color:var(--bad);text-decoration:line-through}.diff .fix{color:var(--ok);font-weight:700}.diff .mis{color:var(--warn);border-bottom:2px dashed var(--warn)}
.wbox{flex:none;padding:10px 12px 12px;border-top:1px solid var(--bd);display:flex;flex-direction:column;gap:8px;background:var(--pn)}
.wbox textarea{width:100%;min-height:62px;max-height:none;border-radius:14px;border:1px solid var(--bd);background:var(--pn2);color:var(--tx);padding:11px 13px;font:inherit;font-size:16px;resize:none;outline:none}
.wbox textarea:focus{border-color:var(--acc)}
.wbox .r{display:flex;gap:8px;justify-content:flex-end;align-items:center}
.wbox .r .sp{flex:1}
.acc{font-weight:800;font-size:15px}
/* notes column / sheet */
.notes-hd{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid var(--bd);flex:none}
.notes-hd .t{flex:1;font-weight:700}
.nlist{flex:1;min-height:0;overflow:auto;padding:8px 10px;display:flex;flex-direction:column;gap:8px;scrollbar-width:none}
.note{border:1px solid var(--bd);border-radius:14px;padding:9px 11px;background:var(--pn)}
.note .h{display:flex;gap:6px;align-items:center;font-size:12px;color:var(--mu);margin-bottom:3px}
.note .h b{color:var(--acct);font-variant-numeric:tabular-nums}
.note .q{font-size:12.5px;color:var(--mu);font-style:italic;margin-bottom:4px}

/* ---------- dock (full width on every device) ---------- */
.dock{flex:none;position:relative;background:var(--bg);border-top:1px solid var(--bd);padding:0 8px 6px;z-index:6;transition:opacity .3s,transform .3s}
.ov.kb-open .dock{display:none}
.ov.ahd:not([data-view=theater]) .dock:not(:hover):not(:focus-within){opacity:.08}
.prog{position:relative;height:16px;margin:0 -8px;cursor:pointer;touch-action:none}
.ov[data-input=touch] .prog{height:22px}
.prog .tr{position:absolute;left:0;right:0;top:50%;height:4px;margin-top:-2px;background:rgba(148,163,184,.28);transition:height .15s,margin .15s}
.prog:hover .tr,.prog.drag .tr{height:7px;margin-top:-3.5px}
.prog .fl{position:absolute;left:0;top:0;bottom:0;background:var(--acc)}
.prog .kn{position:absolute;top:50%;width:14px;height:14px;margin:-7px 0 0 -7px;border-radius:50%;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.4);transform:scale(0);transition:transform .15s}
.prog:hover .kn,.prog.drag .kn,.ov[data-input=touch] .prog .kn{transform:scale(1)}
.prog .mk{position:absolute;top:50%;width:9px;height:9px;margin:-4.5px 0 0 -4.5px;border-radius:50%;background:#facc15;box-shadow:0 0 0 2px var(--bg);z-index:2}
.ptip{position:absolute;bottom:calc(100% + 4px);transform:translateX(-50%);background:var(--pn);color:var(--tx);border:1px solid var(--bd);border-radius:12px;padding:7px 10px;width:max-content;max-width:min(300px,80%);font-size:12.5px;box-shadow:var(--shadow);pointer-events:none;display:none;z-index:5}
.ptip b{color:var(--acct);font-variant-numeric:tabular-nums;margin-right:6px}
.drow{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center;gap:8px;min-height:calc(var(--hit) + 6px)}
.zl{display:flex;align-items:center;gap:2px;min-width:0;justify-self:stretch}
.zc{display:flex;align-items:center;gap:2px}
.zr{display:flex;align-items:center;gap:2px;justify-self:end}
.dtitle{display:flex;align-items:center;gap:8px;min-width:0;flex:0 1 auto;padding:0 8px 0 4px;max-width:260px}
.dtitle .yt{width:22px;height:16px;flex:none}
.dtitle span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:650;font-size:13px}
.play{width:calc(var(--hit) + 6px);height:calc(var(--hit) + 6px);border-radius:50%;background:var(--acc);color:#fff;margin:0 4px}
.play:hover{background:#7c3aed}
.spd{width:auto;padding:0 8px 0 6px;gap:5px;display:inline-flex;align-items:center}
.spd .sl{font-size:13px;font-weight:700;font-variant-numeric:tabular-nums}
[data-over]{display:none!important}
.ov[data-w=c] .drow{grid-template-columns:repeat(var(--cols,7),minmax(0,1fr));gap:0}
.ov[data-w=c] .zl,.ov[data-w=c] .zc,.ov[data-w=c] .zr{display:contents}
.ov[data-w=c] .drow>*>*{justify-self:center}
.ov[data-w=c] .spd .ico{display:none}
.ov[data-w=c] .play{margin:0}

/* ---------- popovers & sheets (one component) ---------- */
.layer{position:absolute;inset:0;pointer-events:none;z-index:40}
.scrim{position:absolute;inset:0;pointer-events:auto;background:rgba(0,0,0,0);transition:background .2s}
.scrim.dim{background:rgba(0,0,0,.45)}
.pnl{position:absolute;pointer-events:auto;background:var(--pn);color:var(--tx);border:1px solid var(--bd);box-shadow:var(--shadow);overflow:auto;scrollbar-width:none;overscroll-behavior:contain}
.pnl::-webkit-scrollbar{display:none}
.pnl.noanim,.scrim.noanim{animation:none!important}
.pnl.pop{width:min(340px,calc(100% - 16px));border-radius:20px;padding:12px 14px 14px;animation:pin .16s ease-out}
.pnl.pop.wide{width:min(400px,calc(100% - 16px))}
.pnl.center{left:50%;top:50%;transform:translate(-50%,-50%);animation:cin .3s cubic-bezier(.2,.8,.2,1);width:min(420px,calc(100% - 24px));max-height:calc(100% - 24px)}
.pnl.sheet{left:50%;bottom:0;width:min(560px,100%);max-height:88%;border-radius:22px 22px 0 0;padding:6px 14px 16px;border-bottom:0;animation:sup .26s cubic-bezier(.2,.8,.2,1);transform:translateX(-50%)}
@keyframes pin{from{opacity:0;transform:translateY(6px)}}
@keyframes cin{from{opacity:0;transform:translate(-50%,calc(-50% + 48px))}to{opacity:1;transform:translate(-50%,-50%)}}
@keyframes sup{from{translate:0 100%}to{translate:0 0}}
.grip{width:40px;height:4px;border-radius:2px;background:rgba(148,163,184,.55);margin:4px auto 10px}
.pnl.pop .grip{display:none}
.phd{display:flex;align-items:center;gap:6px;padding:2px 2px 8px}
.ptl{flex:1;min-width:0;font-size:17px;font-weight:750}
.pval{color:var(--acct);font-weight:800;font-size:17px;margin-right:2px}
.px{width:36px;height:36px;border-radius:10px;border:0;background:none;color:var(--mu);display:grid;place-items:center;cursor:pointer}
.px:hover{background:var(--hov)}
.pnl.sheet .px.x{display:none}
.opt{display:flex;align-items:center;gap:12px;width:100%;min-height:48px;padding:7px 10px;border:0;border-radius:12px;background:none;color:inherit;font:inherit;font-size:15px;text-align:left;cursor:pointer}
.opt:hover{background:var(--hov)}
.opt.sel{background:var(--sel);font-weight:650}
.opt .ck{width:18px;height:18px;color:var(--acct);visibility:hidden;flex:none}
.opt.sel .ck{visibility:visible}
.opt .oi{width:20px;height:20px;flex:none;color:var(--tx)}
.ov.light .opt .oi{color:var(--mu)}
.opt.sel .oi{color:var(--acct)}
.opt .k{margin-left:auto;color:var(--mu);font-size:12.5px;font-weight:500}
.ov[data-input=touch] .opt .k{display:none}
.sec{font-size:12px;font-weight:750;color:var(--mu);text-transform:uppercase;letter-spacing:.5px;margin:10px 2px 8px}
.tiles{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.tile{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;min-height:78px;padding:10px 6px;border-radius:16px;background:var(--pn2);border:0;color:inherit;font-size:12.5px;cursor:pointer;text-align:center;line-height:1.2}
.tile svg{width:22px;height:22px;color:var(--tx)}
.ov.light .tile svg{color:var(--acct)}
.tile:hover{filter:brightness(1.08)}
.srow{display:flex;align-items:center;gap:10px;min-height:48px;padding:6px 4px;border-bottom:1px solid var(--bd);cursor:default}
.srow:last-child{border-bottom:0}
.srow .l{flex:1;min-width:0}
.srow .l small{display:block;color:var(--mu);font-size:12px}
.srow .v{color:var(--mu);font-size:13px}
.srow.nav{cursor:pointer}
.srow.nav svg{width:18px;height:18px;color:var(--mu)}
.sw2{position:relative;width:44px;height:26px;flex:none}
.sw2 input{position:absolute;opacity:0;inset:0;margin:0;cursor:pointer;z-index:1}
.sw2 span{position:absolute;inset:0;border-radius:13px;background:rgba(148,163,184,.4);transition:.2s}
.sw2 span::after{content:"";position:absolute;left:3px;top:3px;width:20px;height:20px;border-radius:50%;background:#fff;transition:.2s}
.sw2 input:checked+span{background:var(--acc)}
.sw2 input:checked+span::after{transform:translateX(18px)}
.seg{display:inline-grid;grid-auto-flow:column;grid-auto-columns:1fr;background:var(--pn2);border-radius:11px;padding:3px;gap:2px}
.seg button{border:0;background:none;color:var(--mu);border-radius:8px;padding:6px 10px;font-weight:650;font-size:13px;cursor:pointer;white-space:nowrap}
.seg button.on{background:var(--pn);color:var(--tx);box-shadow:0 1px 3px rgba(0,0,0,.25)}
.rng{width:100%;accent-color:#8b5cf6}
.sgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:8px}
.sgrid button{height:46px;border-radius:12px;border:1px solid var(--bd);background:var(--pn2);color:var(--tx);font-weight:700;cursor:pointer;line-height:1.1;font-size:13.5px}
.sgrid button.on{background:var(--acc);border-color:var(--acc);color:#fff}
.swatches{display:flex;flex-wrap:wrap;gap:8px}
.swc{width:32px;height:32px;border-radius:50%;border:2px solid var(--bd);cursor:pointer;padding:0;position:relative}
.swc.on{box-shadow:0 0 0 2px var(--pn),0 0 0 4px var(--acc)}
.swc.def{background:conic-gradient(#ffff00 0 50%,#8b5cf6 0)}
.prev{border-radius:14px;background:#111;padding:14px;text-align:center;margin-bottom:6px}
.prev .a{font-weight:800;font-size:18px}.prev .b{font-size:14px;margin-top:3px}
.lrow{display:flex;align-items:center;gap:10px;width:100%;min-height:46px;padding:6px 10px;border:0;border-radius:12px;background:none;color:inherit;cursor:pointer;font:inherit;text-align:left}
.lrow:hover{background:var(--hov)}
.lrow.sel{background:var(--sel)}
.fa-bg{fill:#e2e8f0}.fa-ic{fill:#334155}.ov.dark .fa-bg{fill:#3f3f46}.ov.dark .fa-ic{fill:#e4e4e7}
.lrow .fl{width:22px;height:15px;border-radius:3px;overflow:hidden;flex:none;box-shadow:0 0 0 1px rgba(0,0,0,.15)}
.lrow .nn{flex:1;font-weight:600}
.lrow .en2{color:var(--mu);font-size:13px}
.lrow .ck{width:18px;height:18px;color:var(--acct);visibility:hidden}
.lrow.sel .ck{visibility:visible}
.btnw{width:100%;height:46px;border-radius:14px;border:0;background:var(--acc);color:#fff;font-weight:750;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;margin-top:12px}
.btnw.sec2{background:var(--pn2);color:var(--tx)}
.btnw svg{width:18px;height:18px;flex:none}
.rgrid{grid-template-columns:repeat(4,1fr)}.rgrid button small{display:block;font-size:10.5px;font-weight:600;opacity:.9;margin-top:1px}
.lsn{position:relative}.lsn.locked .lsn-body{filter:blur(5px);pointer-events:none;user-select:none}
.lsn-lock{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;text-align:center;padding:16px;color:var(--tx)}
.lsn-lock>*{position:relative}.lsn-lock::before{content:'';position:absolute;left:50%;top:50%;width:min(260px,92%);height:120px;transform:translate(-50%,-50%);border-radius:14px;background:color-mix(in srgb,var(--pn) 90%,transparent);border:1px solid var(--bd);box-shadow:0 8px 24px rgba(0,0,0,.25)}
.lsn-lock svg{width:26px;height:26px;color:var(--acct)}.lsn-lock span{color:var(--mu);font-size:12.5px;max-width:240px}
.wcard{display:flex;flex-direction:column;min-height:0}
.wsec{display:flex;align-items:center;justify-content:space-between;margin:2px 0 6px}
/* v18 · ghi chú theo thời điểm (mốc trên thanh tiến trình + chấm ở danh sách câu) */
.lnote .wsec .nsaved{margin-left:auto;margin-right:8px}
.tadd{display:inline-flex;align-items:center;gap:4px;height:26px;padding:0 9px;border-radius:13px;border:1px solid var(--bd);background:var(--pn2);color:var(--acct);font:inherit;font-size:11.5px;font-weight:700;letter-spacing:0;text-transform:none;font-variant-numeric:tabular-nums;cursor:pointer;flex:none;white-space:nowrap}
.ov[data-input=touch] .tadd{height:32px;border-radius:16px}
.tadd svg{width:13px;height:13px}.tadd:disabled{cursor:not-allowed}
.tnl{display:flex;flex-direction:column;gap:6px;margin-bottom:8px;max-height:156px;overflow-y:auto;overscroll-behavior:contain;scrollbar-width:none;flex:none}
.tnl::-webkit-scrollbar{display:none}
.tn{display:flex;align-items:flex-start;gap:4px;padding:4px 4px 4px 6px;border:1px solid var(--bd);border-radius:12px;background:var(--pn2);flex:none}
.tn.cur{border-color:color-mix(in srgb,var(--acc) 60%,transparent)}
.tn .tt{flex:none;display:inline-flex;align-items:center;gap:5px;height:26px;padding:0 4px;border:0;border-radius:8px;background:none;color:var(--acct);font:inherit;font-size:12px;font-weight:700;font-variant-numeric:tabular-nums;cursor:pointer}
.tn .tt::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--mkc)}
.tn .tx{flex:1;min-width:0;border:0;background:none;color:var(--tx);font:inherit;font-size:13px;line-height:18px;resize:none;outline:none;padding:4px 0;height:auto;min-height:26px;overflow:hidden;field-sizing:content}
.tn .tx::placeholder{color:var(--mu)}
.tn .tdel{flex:none;width:26px;height:26px;border:0;border-radius:8px;background:none;color:var(--mu);display:grid;place-items:center;cursor:pointer;padding:0}
.tn .tdel svg{width:14px;height:14px}.tn .tdel:hover,.tn .tt:hover{background:var(--hov)}
.ov[data-input=touch] .tn .tt,.ov[data-input=touch] .tn .tdel{height:32px}.ov[data-input=touch] .tn .tdel{width:32px}.ov[data-input=touch] .tn .tx{padding:7px 0;min-height:32px}
.ov{--mkc:#facc15}.ov.light{--mkc:#eab308}
.row .nd{width:7px;height:7px;border-radius:50%;background:var(--mkc);flex:none}
.prog .mk{cursor:pointer;background:var(--mkc)}.prog .mk::after{content:"";position:absolute;inset:-9px}
/* v18 · kích thước không đổi bố cục: thiếu chỗ thì Ghi chú vào ☰, rồi nút chỉ còn icon */
.scard-hd.f-nonotes [data-sact=notes]{display:none}
.scard-hd.f-ico .tg span{display:none}
.f-nokbd .kbdh{display:none!important}
.f-ico .pill:not(.pri):not(.mic) .pl{display:none}.f-ico .pill:not(.pri):not(.mic){width:42px;padding:0!important;justify-content:center;gap:0}
.f-ico2 .pill.pri .pl{display:none}.f-ico2 .pill.pri{width:48px;padding:0!important;justify-content:center;gap:0}
.player.card.pc-n .vid{width:72px;height:40px;top:17px}.player.card.pc-n .cinfo{padding-left:90px}
.player.card.pc-n .vc[data-act=theater]{display:none}.player.card.pc-n .ct{margin-right:40px}
.sbody.fb{-webkit-mask-image:linear-gradient(#000 calc(100% - 26px),transparent);mask-image:linear-gradient(#000 calc(100% - 26px),transparent)}
.sbody.ft{-webkit-mask-image:linear-gradient(transparent,#000 18px);mask-image:linear-gradient(transparent,#000 18px)}
.sbody.ft.fb{-webkit-mask-image:linear-gradient(transparent,#000 18px,#000 calc(100% - 26px),transparent);mask-image:linear-gradient(transparent,#000 18px,#000 calc(100% - 26px),transparent)}.wsec .cnt{font-weight:700;letter-spacing:0}
.wsearch{flex:none;width:100%;height:34px;border-radius:10px;border:1px solid var(--bd);background:var(--pn2);color:var(--tx);padding:0 10px;font:inherit;font-size:13px;outline:none}
.ov[data-input=touch] .wsearch{height:40px}
.wseg{display:grid;margin:6px 0;width:100%;flex:none}.wseg button{flex:1}
.wlbox{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;border:1px solid var(--bd);border-radius:12px;background:var(--pn2);overflow:hidden}
.wlist{flex:1 1 auto;min-height:0;overflow-y:auto;overscroll-behavior:contain;scrollbar-width:none;padding:2px 0 8px;-webkit-mask-image:linear-gradient(transparent,#000 8px,#000 calc(100% - 16px),transparent);mask-image:linear-gradient(transparent,#000 8px,#000 calc(100% - 16px),transparent)}
.wlist::-webkit-scrollbar{display:none}
.wempty{text-align:center;padding:14px 8px;margin:0}
.wst{padding:10px 12px}.wst+.wst{border-top:1px solid var(--bd)}
.wst-h{display:flex;align-items:center;gap:8px;min-width:0}
.wst-h b{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:14.5px;font-weight:650;cursor:pointer;text-decoration:underline dotted;text-decoration-color:var(--mu);text-underline-offset:3px}
.wst .st{flex:none;display:inline-flex;align-items:center;gap:5px;font-size:12.5px;font-weight:650;line-height:1;white-space:nowrap}.wst .st i{width:7px;height:7px;border-radius:50%;background:currentColor}
.wst .st.wrong{color:var(--bad)}.wst .st.fixed{color:var(--ok)}
.wst-m{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:5px;font-size:12.5px;color:var(--mu);white-space:nowrap}.wst-m b{color:var(--tx);font-weight:700}
.wst-bar{height:4px;margin-top:5px;border-radius:4px;background:color-mix(in srgb,var(--tx) 10%,transparent);overflow:hidden}.wst-bar span{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,var(--warn),var(--ok))}
.wst-v{display:flex;flex-wrap:wrap;align-items:baseline;gap:2px 6px;margin-top:6px;font-size:13px;color:var(--mu)}
.wst-v small{font-size:11.5px}.wst-v i{font-style:normal}.wst-v .om{font-style:italic}
.lnk{background:none;border:0;color:var(--acct);font:inherit;font-size:12.5px;font-weight:700;padding:6px 2px 0;cursor:pointer}
.wst-v .lnk{padding:0 2px;font-size:13px}
.lnote{display:flex;flex-direction:column;min-height:0}
.lnote .wsec{margin:12px 0 6px}
.nsaved{display:inline-flex;align-items:center;gap:4px;color:var(--ok);font-weight:700;letter-spacing:0;text-transform:none;font-size:11.5px;opacity:0;transition:opacity .2s}.nsaved.on{opacity:1}.nsaved svg{width:13px;height:13px}
.lnote textarea{width:100%;min-height:96px;border-radius:12px;border:1px solid var(--bd);background:var(--pn2);color:var(--tx);padding:9px 11px;font:inherit;resize:none;outline:none}
.lnote .r{display:flex;align-items:center;justify-content:space-between;margin-top:6px;flex:none}
/* desktop column: stats take their content height (≤55%, scroll inside), notes fill the rest down to the bottom */
.nlist{overflow:hidden}
.nlist>.lsn{flex:1;min-height:0;display:flex;flex-direction:column}
.nlist>.lsn>.lsn-body{flex:1;min-height:0;display:flex;flex-direction:column}
.nlist .wcard{flex:1 1 auto}
.nlist .lnote{flex:none}
.lnote textarea{height:112px;min-height:0;flex:none}
/* sheet (dọc): content height, list scrolls inside */
.lsn[data-scope=p] .wlist{max-height:330px}.lsn[data-scope=p] .lnote textarea{height:104px}
.chips span[data-wk]{cursor:pointer}
.kpn{display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center;padding:4px 4px 0}.kpn>svg{width:34px;height:34px;color:var(--acct)}

:where(.ov button,.ov .tile) svg{width:1.25em;height:1.25em;flex:none}
.sumh{text-align:center;padding:4px 0 6px}
.sumh .trophy{width:54px;height:54px;border-radius:50%;margin:0 auto 8px;background:color-mix(in srgb,#facc15 20%,transparent);color:#facc15;display:grid;place-items:center}
.sumh .trophy svg{width:28px;height:28px}
.sumh b{font-size:19px}
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:12px 0}
.stat{background:var(--pn2);border-radius:14px;padding:10px;text-align:center}
.stat b{display:block;font-size:20px}.stat small{color:var(--mu);font-size:12px}
.chips{display:flex;flex-wrap:wrap;gap:6px}
.chips span{padding:4px 10px;border-radius:999px;background:color-mix(in srgb,var(--bad) 14%,transparent);color:var(--bad);font-weight:650;font-size:13px}
/* toast · hearts */
.toast{position:absolute;left:50%;bottom:calc(var(--dockH,64px) + 14px);transform:translate(-50%,10px);background:rgba(24,24,27,.95);color:#fff;padding:9px 15px;border-radius:12px;font-size:13.5px;font-weight:600;opacity:0;pointer-events:none;transition:.22s;z-index:60;white-space:nowrap;box-shadow:0 8px 24px rgba(0,0,0,.35)}
.toast.on{opacity:1;transform:translate(-50%,0)}
.hrt{position:absolute;width:96px;height:96px;margin:-48px 0 0 -48px;pointer-events:none;z-index:30;animation:hpop 1s ease-out forwards}
.ov[data-w=c] .hrt{width:144px;height:144px;margin:-72px 0 0 -72px}
.hrt svg{width:100%;height:100%;filter:drop-shadow(0 6px 14px rgba(255,45,85,.45))}
@keyframes hpop{0%{transform:scale(.2) rotate(var(--r));opacity:0}15%{transform:scale(1.15) rotate(var(--r));opacity:1}30%{transform:scale(.95) rotate(var(--r))}70%{opacity:1}100%{transform:translateY(-110px) scale(1.25) rotate(var(--r));opacity:0}}
.burst{position:absolute;width:0;height:0;pointer-events:none;z-index:70}
.burst i{position:absolute;left:-5px;top:-5px;width:10px;height:10px;color:#f43f5e;animation:bfly .75s ease-out forwards}
.burst i svg{display:block;width:10px;height:10px;fill:currentColor}
.burst b{position:absolute;left:-24px;top:-24px;width:48px;height:48px;border:2px solid #f43f5e;border-radius:50%;animation:bring .6s ease-out forwards}
.burst b+b{animation-delay:.12s;opacity:0}
@keyframes bfly{0%{transform:translate(0,0) scale(.6);opacity:1}100%{transform:translate(var(--x),var(--y)) scale(1);opacity:0}}
@keyframes bring{0%{transform:scale(.6);opacity:.9}100%{transform:scale(1.7);opacity:0}}
@media (prefers-reduced-motion:reduce){.ov *{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}.hrt{animation:none;opacity:1}}

/* ---------- real media in the player slot (YouTube <video> or the Web page thumbnail + visualizer) ---------- */
.amb canvas{width:100%;height:100%;display:block}
.player:not(.card) .vid{width:min(100cqw,calc(100cqh * var(--va,1.7778)));aspect-ratio:var(--va,16/9)}
.vid{background:#000}
.vid>:is(video,.te-web-page-thumbnail){position:absolute!important;inset:0!important;left:0!important;top:0!important;display:block!important;visibility:visible!important;opacity:1!important;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;margin:0!important;object-fit:contain;transform:none!important;background:#000;cursor:default;user-select:none}
.player.card .vid>:is(video,.te-web-page-thumbnail){object-fit:cover}
.vid>.te-web-page-thumbnail.te-web-thumbnail-bg{object-fit:cover!important;transform:translate(var(--te-webviz-shift-x,0%),var(--te-webviz-shift-y,0%)) rotate(var(--te-webviz-angle,0rad)) scale(var(--te-webviz-scale,1.12))!important;transform-origin:50% 50%!important;will-change:transform,filter;filter:blur(var(--te-webviz-blur,8px)) brightness(.88)}
.vid>.te-web-thumbnail-visualizer{position:absolute;inset:0;z-index:2;overflow:hidden;pointer-events:none;container-type:inline-size;border-radius:inherit}
.player.card .vid>.te-web-thumbnail-visualizer{display:none}
.vid .te-web-thumbnail-shade{position:absolute;inset:0;z-index:1;background:rgba(11,15,23,var(--te-webviz-darkness,.4))}
.vid .te-web-thumbnail-shade::after{content:"";position:absolute;inset:0;background:radial-gradient(ellipse at center,transparent 20%,rgba(0,0,0,.58) 100%)}
.vid .te-web-thumbnail-canvas{position:absolute;inset:0;z-index:2;width:100%;height:100%}
.vid .te-web-thumbnail-meta{position:absolute;z-index:3;left:8%;top:28%;width:84%;display:flex;align-items:center;gap:clamp(12px,2cqw,40px);color:#fff;font-family:inherit;text-shadow:0 2px 14px rgba(0,0,0,.72)}
.vid .te-web-thumbnail-art{flex:0 0 clamp(56px,8cqw,140px);width:clamp(56px,8cqw,140px);height:clamp(56px,8cqw,140px);object-fit:cover;border-radius:clamp(7px,.7cqw,14px);box-shadow:0 10px 30px rgba(0,0,0,.45);background:#18212a}
.vid .te-web-thumbnail-details{min-width:0;flex:1;display:flex;flex-direction:column;gap:clamp(3px,.45cqw,9px)}
.vid .te-web-thumbnail-duration{color:var(--te-webviz-main,#ffcc00);font-size:clamp(9px,1.05cqw,20px);font-weight:650;letter-spacing:.12em;text-transform:uppercase;white-space:nowrap}
.vid .te-web-thumbnail-title{overflow:hidden;color:#fff;font-size:clamp(13px,2.7cqw,52px);font-weight:750;line-height:1.12;white-space:nowrap;text-overflow:ellipsis}
.vid .te-web-thumbnail-artist{overflow:hidden;color:rgba(255,255,255,.84);font-size:clamp(10px,1.35cqw,26px);font-weight:500;white-space:nowrap;text-overflow:ellipsis}
.dtitle .yt.gl{color:var(--mu)}
.scard .sempty{margin:auto;text-align:center;color:var(--mu);font-size:14px;line-height:1.5;padding:24px 12px}
/* v3.5.260: hiệu ứng nền — thanh Tất cả/Cần sửa và khung Ghi chú đang khóa trong như kính */
.ov.ambient .wseg{background:color-mix(in srgb,var(--pn2) 45%,transparent);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--tx) 10%,transparent)}
.ov.ambient.dark .wseg button.on{background:color-mix(in srgb,var(--tx) 11%,transparent);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--tx) 9%,transparent)}
.ov.ambient.light .wseg button.on{background:color-mix(in srgb,var(--pn) 62%,transparent);box-shadow:0 1px 3px rgba(15,23,42,.1)}
.ov.ambient .lsn-lock::before{background:color-mix(in srgb,var(--pn) 42%,transparent);border-color:color-mix(in srgb,var(--tx) 9%,transparent);-webkit-backdrop-filter:blur(24px) saturate(1.35);backdrop-filter:blur(24px) saturate(1.35);box-shadow:0 8px 24px rgba(0,0,0,.12)}
`;
