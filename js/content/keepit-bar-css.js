// CSS của thanh Keepit + menu ☰ (shadow root của js/content/keepit-bar.js). Màu kính sáng/tối lấy từ
// js/shared/theme-tokens.js (var(--kp-…)). Sửa thẳng quy tắc gốc; không nối khối vá theo phiên bản vào cuối.
globalThis.LHN_BAR_CSS = `:host{all:initial}
*{box-sizing:border-box;margin:0}
button,input{font-family:inherit}
[hidden]{display:none!important}
.screen{position:fixed;inset:0;pointer-events:none;font-family:-apple-system,"Segoe UI",Roboto,sans-serif;color:#111827;line-height:normal;text-align:left;-webkit-text-size-adjust:100%;--ts:1;--sab:0px;--yb:0px}
.bbar{--accent:#9c27b0;--accent-rgb:156,39,176;left:0;right:0;bottom:0;z-index:6;padding:6px 6px;border-top:1px solid rgba(148,163,184,.35);box-shadow:0 -6px 18px rgba(15,23,42,.06);transition:transform .3s cubic-bezier(.2,.8,.2,1),opacity .2s;touch-action:pan-y;user-select:none;-webkit-user-select:none;--accent:#7c3aed;--accent-rgb:124,58,237}
.dark .bbar{box-shadow:0 -6px 18px rgba(0,0,0,.3)}
.bin{display:flex;align-items:center;max-width:560px;margin:0 auto;padding:0 4px;transition:transform .2s}
.bbar.swiping .bin{transition:none}
.nb{position:relative;flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;gap:3px;border:0;background:none;font-weight:600;line-height:1.15;padding:3px 1px;cursor:pointer;-webkit-tap-highlight-color:transparent}
.nb .ico{height:30px;display:grid;place-items:center;transition:background-color .15s,transform .12s}
.nb svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-linecap:round;stroke-linejoin:round}
.bbar.tight .nb{letter-spacing:-.2px}
.nb .lb{max-width:calc(100% + 14px);margin:0 -7px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.nb:active .ico{background:rgba(148,163,184,.2);transform:scale(.94)}
.desk .nb:hover .ico{background:rgba(148,163,184,.16)}
.sbtn{position:relative;flex:none;width:52px;height:52px;margin:0 4px;border:0;color:#fff;display:grid;place-items:center;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:transform .12s,filter .12s}
.sbtn svg{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round}
.sbtn:active{transform:scale(.93)}
.desk .sbtn:hover{filter:brightness(1.08)}
.wide .bbar{left:50%;right:auto;transform:translateX(-50%);padding:6px 10px;border:1px solid rgba(148,163,184,.35);border-radius:20px}
.wide:not(.dark) .bbar{box-shadow:0 0 2px rgba(15,23,42,.144),0 0 12px rgba(15,23,42,.192)}
.wide.dark .bbar{border-color:rgba(148,163,184,.2);box-shadow:0 10px 30px rgba(0,0,0,.4)}
.wide .bin{max-width:none;gap:3px;padding:0}
.wide .nb{flex:none;width:66px}
.wide .sbtn{width:54px;height:54px;margin:0 8px}
.bbar.hide{transform:translateY(calc(100% + 2px))}
.bbar.peek{transform:none!important}
.wide .bbar.peek{transform:translateX(-50%)!important}
.desk .nb[data-tip]:hover::after,.desk .sbtn[data-tip]:hover::after{content:attr(data-tip);position:absolute;bottom:calc(100% + 12px);left:50%;transform:translateX(-50%);white-space:nowrap;background:rgba(17,17,22,.94);color:#fff;font-size:12px;font-weight:600;padding:6px 9px;border-radius:8px;pointer-events:none;z-index:3}
.bbar.swiping .nb::after,.bbar.swiping .sbtn::after{display:none}
.swi{position:absolute;top:50%;width:40px;height:40px;margin-top:-20px;border-radius:50%;background:rgba(148,163,184,.25);color:#334155;display:grid;place-items:center;opacity:0;transform:scale(.5);pointer-events:none;transition:background .15s,color .15s}
.dark .swi{color:#e4e4e7}
.swi svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round}
.swi.l{left:6px}
.swi.r{right:6px}
.swi.go{background:var(--accent);color:#fff}
.swi.no{background:rgba(148,163,184,.25)}
.hzone{left:50%;width:var(--lw,273px);height:32px;transform:translateX(-50%);z-index:5;display:none;cursor:pointer}
.hzone i{position:absolute;left:0;right:0;bottom:9px;height:6px;border-radius:3px;background:rgba(0,0,0,.78);transition:opacity .2s}
.pageDark .hzone i{background:rgba(255,255,255,.82)}
.hidden .hzone{display:block}
.hidden.peeking .hzone i{opacity:0}
.offdot{left:0;top:calc(50% - 22px);z-index:6;display:none;place-items:center;box-sizing:border-box;width:35px;height:44px;margin:0;padding:0 1px 0 0;border:1px solid rgba(255,255,255,.55);border-radius:0 12px 12px 0;background:linear-gradient(145deg,rgba(100,116,139,.78),rgba(71,85,105,.78));color:#fff;box-shadow:0 3px 10px rgba(71,85,105,.22);opacity:.85;cursor:pointer;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;transition:left .22s,top .22s,border-radius .22s,opacity .15s,transform .12s}
.offdot.r{padding:0 0 0 1px;border-radius:12px 0 0 12px}
.offdot svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linejoin:round;pointer-events:none}
.offdot.drag{transition:none;border-radius:12px;opacity:1;transform:scale(1.06)}
.desk .offdot:hover{opacity:1;filter:brightness(1.06);box-shadow:0 4px 13px rgba(71,85,105,.3)}
.offdot:focus-visible{outline:3px solid rgba(156,39,176,.45);outline-offset:2px}
.siteoff .offdot{display:grid}
.siteoff .bbar,.siteoff .hzone{display:none}
.pop{z-index:8;min-width:200px;padding:6px;border-radius:16px;background:#fff;border:1px solid rgba(148,163,184,.3);box-shadow:0 16px 40px -12px rgba(15,23,42,.35);opacity:0;visibility:hidden;transform:translateY(8px) scale(.98);transform-origin:bottom left;transition:opacity .18s,transform .18s,visibility .18s;color:#1e293b}
.dark .pop{background:#18181b;border-color:#27272a;color:#f4f4f5}
.pop.open{opacity:1;visibility:visible;transform:none}
.row{display:flex;align-items:center;gap:12px;width:100%;border:0;background:none;color:inherit;font-size:14.5px;font-weight:500;padding:11px 12px;border-radius:10px;cursor:pointer;text-align:left}
.row svg{width:20px;height:20px;flex:none;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;color:#64748b}
.row:active,.desk .row:hover{background:rgba(148,163,184,.15)}
.clear{position:absolute;inset:0;z-index:7;display:none}
.clear.on{display:block}
.toast{left:50%;transform:translate(-50%,8px);z-index:20;max-width:calc(100% - 32px);padding:9px 14px;border-radius:12px;background:rgba(24,24,27,.94);color:#fff;font-size:13px;font-weight:600;opacity:0;pointer-events:none;transition:opacity .2s,transform .2s}
.toast.on{opacity:1;transform:translate(-50%,0)}
.sheet{position:absolute;inset:0;z-index:9;pointer-events:none}
.scrim{position:absolute;inset:0;background:rgba(0,0,0,.45);opacity:0;transition:opacity .2s}
.wide .sheet .scrim{background:transparent}
.panel{left:50%;bottom:0;width:min(560px,100%);max-height:75%;display:flex;flex-direction:column;padding:8px 14px 16px;border-radius:22px 22px 0 0;color:#111827;box-shadow:0 -10px 30px rgba(0,0,0,.18);transform:translate(-50%,105%);transition:transform .26s cubic-bezier(.2,.8,.2,1)}
.dark .panel{box-shadow:0 -10px 30px rgba(0,0,0,.4)}
.sheet.open{pointer-events:auto}
.sheet.open .scrim{opacity:1}
.sheet.open .panel{transform:translate(-50%,0)}
.grip{flex:none;position:relative;width:40px;height:4px;border-radius:2px;background:rgba(148,163,184,.55);margin:2px auto 10px;touch-action:none;cursor:grab}
.grip::before{content:"";position:absolute;left:-80px;right:-80px;top:-10px;bottom:-10px}
.screen:not(.desk) .shead,.screen:not(.desk) .dh{touch-action:none}
.dragging{transition:none!important}
.panel.full{max-height:96%}
.screen.apk:not(.wide) .panel{max-height:58%}
.screen.apk:not(.wide) .panel.full{max-height:96%}
.pop .grip{margin:2px auto 6px}
.sbox .grip{margin:8px auto 0}
.langrow{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:0 2px 12px}
.langrow label{font-size:13px;font-weight:600}
.lwrap{position:relative;width:62%}
.lwrap input{width:100%;height:38px;padding:0 31px 0 11px;border:1px solid #d1d9e3;border-radius:10px;outline:none;color:inherit;font-size:13px}
.lwrap input:focus{border-color:#9c27b0;box-shadow:0 0 0 3px rgba(156,39,176,.12)}
.lwrap .caret{position:absolute;right:10px;top:11px;width:16px;height:16px;fill:none;stroke-width:2;stroke-linecap:round;pointer-events:none;stroke:var(--kp-tx2-l)}
.lopts{position:absolute;z-index:5;top:calc(100% + 4px);left:0;right:0;max-height:190px;overflow:auto;padding:4px;border:1px solid #d1d9e3;border-radius:9px;background:#fff;box-shadow:0 8px 24px rgba(26,43,69,.13);display:none}
.lopts.open{display:block}
.lopt{padding:9px 8px;border-radius:6px;font-size:13px;color:#3d4a60;cursor:pointer;outline:0}
.screen:not(.desk) .lopt{padding:12px 10px}
.lopt:hover,.lopt:focus,.lopt.on{background:#f6ecfa;color:#9c27b0}
.lempty{padding:9px;color:#758198;font-size:12px}
.dark .lopts{box-shadow:0 8px 24px rgba(0,0,0,.4)}
.dark .lopt{color:#d4d4d8}
.dark .lopt:hover,.dark .lopt:focus,.dark .lopt.on{background:rgba(156,39,176,.25);color:#f0abfc}
.ksub{font-size:12.5px;color:#64748b;margin:0 2px 10px}
.kgrp{margin-bottom:10px}
.krow{display:flex;align-items:center;gap:10px;padding:8px 2px;border-bottom:1px solid rgba(148,163,184,.3);font-size:13.5px}
.krow:last-child{border-bottom:0}
.krow>span{flex:1;min-width:0}
.krow kbd{flex:none;max-width:56%;text-align:right;font-family:inherit;font-size:12px;font-weight:600;line-height:1.35;background:rgba(148,163,184,.16);border-radius:6px;padding:4px 7px;color:#7c3aed;white-space:normal}
.dark .krow kbd{color:#c4b5fd}
.zprev{display:flex;align-items:center;min-height:96px;margin:2px 0 14px;padding:14px 16px;border-radius:16px;border:1px solid var(--kp-line-l);background:var(--kp-tile-l);color:var(--kp-tx-strong-l);line-height:1.45}
.dark .zprev{border-color:var(--kp-line-d);background:var(--kp-tile-d);color:var(--kp-tx-strong-d)}
.zrow{display:flex;align-items:center;gap:12px;margin-bottom:14px}
.zrow{gap:8px}
.zpm{flex:none;display:grid;place-items:center;width:44px;height:44px;padding:0;border-radius:50%;border:1px solid rgba(148,163,184,.4);background:none;color:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}
.dark .zpm{border-color:rgba(255,255,255,.18)}
.zpm svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round}
.desk .zpm:not(:disabled):hover{background:rgba(124,58,237,.1)}
.zpm:not(:disabled):active{transform:scale(.94)}
.zpm:disabled{opacity:.35;cursor:default}
.zrow input{flex:1;min-width:0;height:28px;margin:0 4px;accent-color:#7c3aed}
.zrow output{flex:none;width:48px;text-align:right;font-weight:700;font-variant-numeric:tabular-nums}
.zact{display:flex;align-items:center;gap:10px;padding-bottom:4px}
.zact .sp{flex:1}
.zbtn{height:38px;padding:0 18px;border-radius:12px;border:1px solid rgba(148,163,184,.4);background:none;color:inherit;font:inherit;font-size:13.5px;font-weight:600;cursor:pointer}
.dark .zbtn{border-color:rgba(255,255,255,.18)}
.zbtn.pri{border-color:#7c3aed;background:#7c3aed;color:#fff}
.knew{font-style:normal;font-size:10.5px;font-weight:700;color:#fff;background:#9c27b0;border-radius:5px;padding:1px 5px;margin-left:4px;vertical-align:1px}
.wide .panel{left:auto;width:400px;max-height:min(640px,84%);border-radius:20px;padding:12px 14px 14px;border:1px solid rgba(148,163,184,.28);box-shadow:0 18px 40px rgba(15,23,42,.18);transform:translateY(10px);opacity:0;transition:transform .2s,opacity .2s}
.wide.dark .panel{border-color:rgba(148,163,184,.2)}
.wide .sheet.open .panel{transform:none;opacity:1}
.desk .grip{display:none}
.shead{flex:none;display:flex;align-items:center;gap:8px;padding:2px 2px 10px}
.shead .logo{width:28px;height:28px;border-radius:8px;display:grid;place-items:center;flex:none}
.shead .logo svg{width:28px;height:28px;display:block}
.shead b{font-size:17px;font-weight:800}
.shead .sp{flex:1}
.lchip{display:flex;align-items:center;gap:6px;height:32px;padding:0 10px 0 9px;border-radius:16px;border:1px solid rgba(148,163,184,.4);background:none;color:inherit;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap}
.lchip svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.lchip:active,.desk .lchip:hover{background:rgba(148,163,184,.15)}
.lchip .av{width:22px;height:22px;border-radius:50%;background:#e2e8f0;color:#475569;display:grid;place-items:center;margin-left:-5px}
.dark .lchip .av{background:#3f3f46;color:#e4e4e7}
.lchip .av svg{width:15px;height:15px;color:inherit}
.q small{display:block;font-size:11px;font-weight:500;margin-top:-3px}
.sx{width:38px;height:38px;flex:none;border:0;border-radius:10px;background:none;display:grid;place-items:center;cursor:pointer}
.sx:active,.desk .sx:hover{background:rgba(148,163,184,.18)}
.sx svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.sbody{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain}
.sec{font-size:12px;font-weight:700;letter-spacing:.02em;margin:6px 2px 8px}
.quick{display:grid;grid-template-columns:repeat(auto-fill,minmax(82px,1fr));gap:12px 4px;padding:2px 0 10px}
.q{position:relative;display:flex;flex-direction:column;align-items:center;gap:6px;min-width:0;padding:2px 0;border:0;background:none;color:inherit;font-size:12px;font-weight:600;line-height:1.2;text-align:center;cursor:pointer;-webkit-tap-highlight-color:transparent}
.q .ic{width:50px;height:50px;border-radius:16px;display:grid;place-items:center;border:1px solid #cbd5e1;transition:transform .15s}
.dark .q .ic{box-shadow:none}
.q .ic svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.q.on .ic{background:#f3e8ff;border-color:#9c27b0;color:#9c27b0}
.dark .q.on .ic{background:rgba(139,92,246,.22);border-color:#8b5cf6;color:#c4b5fd}
.q:active .ic{transform:scale(.94)}
.desk .q:hover .ic{filter:brightness(.97)}
.q span{display:block;max-width:100%}
.q .qbadge{position:absolute;top:-5px;left:calc(50% + 12px);padding:0 5px;border-radius:7px;background:linear-gradient(90deg,#4f46e5,#8b5cf6);color:#fff;font-size:9px;font-weight:700;line-height:14px;letter-spacing:.2px;pointer-events:none}
.colors{display:flex;align-items:center;justify-content:space-between;padding:11px 14px;margin:0 0 14px;border-radius:16px;background:#f1f5f9;border:1px solid #cbd5e1}
.dark .colors{background:rgba(255,255,255,.06);border-color:rgba(148,163,184,.18)}
.panel .sbody{scrollbar-width:none}
.panel .sbody::-webkit-scrollbar{display:none}
.panel .sbody.fb{-webkit-mask-image:linear-gradient(to bottom,#000 calc(100% - 48px),transparent);mask-image:linear-gradient(to bottom,#000 calc(100% - 48px),transparent)}
.panel .sbody.ft{-webkit-mask-image:linear-gradient(to bottom,transparent,#000 20px);mask-image:linear-gradient(to bottom,transparent,#000 20px)}
.panel .sbody.ft.fb{-webkit-mask-image:linear-gradient(to bottom,transparent,#000 20px,#000 calc(100% - 48px),transparent);mask-image:linear-gradient(to bottom,transparent,#000 20px,#000 calc(100% - 48px),transparent)}
.smore{position:absolute;left:50%;bottom:6px;width:44px;height:26px;margin-left:-22px;border:0;border-radius:13px;background:none;color:#9c27b0;display:grid;place-items:center;opacity:0;pointer-events:none;transition:opacity .2s;cursor:pointer;padding:0}
.smore svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}
.panel.more-below .smore{opacity:1;pointer-events:auto;animation:nudge 1.4s ease-in-out 3}
.dark .smore{color:#c4b5fd}
@keyframes nudge{0%,100%{transform:none}50%{transform:translateY(4px)}}
.lflag{position:absolute;left:11px;top:12px;width:20px;height:14px;pointer-events:none;z-index:1}
.flag{display:block;width:20px;height:14px;border-radius:2px;box-shadow:0 0 0 1px rgba(15,23,42,.12);flex:none}
.lwrap .lflag+input{padding-left:39px}
.lwrap.open .lflag{display:none}
.lwrap.open .lflag+input{padding-left:11px}
.lopt{display:flex;align-items:center;gap:9px}
.colors span{flex:1;min-width:0;font-size:12.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cdot{flex:none;width:26px;height:26px;border-radius:50%;border:2px solid transparent;box-shadow:inset 0 0 0 1px rgba(15,23,42,.12);cursor:pointer;display:grid;place-items:center;padding:0}
.cdot svg{width:14px;height:14px;fill:none;stroke:#1f2937;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;opacity:0}
.cdot.on{border-color:#9c27b0}
.cdot.on svg{opacity:1}
.dark .cdot.on{border-color:#c4b5fd}
.lname{position:absolute;right:31px;top:0;line-height:38px;font-size:12.5px;pointer-events:none;white-space:nowrap}
.lwrap.open .lname{display:none}
.lopt .le{margin-left:auto;padding-left:10px;font-size:12.5px;color:#94a3b8;white-space:nowrap}
.sec.ksec{display:flex;align-items:center;justify-content:space-between;gap:10px}
.sw{flex:none;position:relative;width:38px;height:22px;border:0;border-radius:11px;background:#cbd5e1;cursor:pointer;padding:0;transition:background .15s}
.sw::after{content:"";position:absolute;left:3px;top:3px;width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.25);transition:transform .15s}
.sw.on{background:#9c27b0}
.sw.on::after{transform:translateX(16px)}
.dark .sw{background:#3f3f46}
.dark .sw.on{background:#8b5cf6}
.kgrp.off{opacity:.45}
.coach{left:12px;right:12px;z-index:7;max-width:400px;margin:0 auto;padding:12px 14px 12px;border-radius:16px;background:#fff;color:#1e293b;border:1px solid rgba(148,163,184,.3);box-shadow:0 12px 32px rgba(15,23,42,.22);font-family:-apple-system,"Segoe UI",Roboto,sans-serif;opacity:0;transform:translateY(8px);pointer-events:none;transition:opacity .2s,transform .2s}
.coach.on{opacity:1;transform:none;pointer-events:auto}
.coach .ch1{display:flex;align-items:center;gap:8px;font-size:14px;margin-bottom:8px}
.coach .ch1 svg{width:20px;height:20px;fill:none;stroke:#9c27b0;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.coach ul{list-style:none;margin:0 0 10px;padding:0}
.coach li{display:flex;justify-content:space-between;gap:10px;padding:6px 0;border-bottom:1px solid rgba(148,163,184,.3);font-size:13px}
.coach li:last-child{border-bottom:0}
.coach li em{font-style:normal;font-weight:600;color:#7c3aed;text-align:right}
.coach .cb{display:flex;justify-content:flex-end;gap:8px}
.coach .cb button{height:34px;padding:0 14px;border-radius:17px;border:1px solid rgba(148,163,184,.45);background:none;color:inherit;font-size:13px;font-weight:600;cursor:pointer}
.coach .cb button.pri{border-color:#9c27b0;background:#9c27b0;color:#fff}
.dark .coach{background:#18181b;color:#f4f4f5;border-color:#27272a}
.dark .coach li em{color:#c4b5fd}
.divider{height:1px;background:rgba(148,163,184,.3);margin:2px 0 10px}
.mfoot{flex:none;position:relative;display:grid;align-items:center;margin:6px -14px calc(-16px - var(--sab));padding:6px 4px calc(6px + var(--sab));border-top:1px solid rgba(148,163,184,.3);border-radius:0;grid-template-columns:repeat(3,minmax(0,1fr))}
.wide .mfoot{margin:6px -14px -14px;padding:4px;border-radius:0 0 20px 20px}
.fq{display:inline-flex;align-items:center;min-width:0;max-width:100%;border:0;border-radius:12px;background:none;font-family:inherit;font-weight:600;line-height:1.2;white-space:nowrap;cursor:pointer;-webkit-tap-highlight-color:transparent}
.fq:nth-child(1){justify-self:start}.fq:nth-child(2){justify-self:center}.fq:nth-child(3){justify-self:end}
.fq span{overflow:hidden;text-overflow:ellipsis;max-width:100%}
.fq svg{width:22px;height:22px;flex:none;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.fq.on svg{color:#9c27b0}.dark .fq.on svg{color:#c4b5fd}
.fq:hover{background:rgba(148,163,184,.14)}.fq:active{background:rgba(148,163,184,.22)}
.fq:focus-visible{outline:2px solid #9c27b0;outline-offset:-2px}
.panel .smore{bottom:calc(66px + var(--sab))}
.wide .panel .smore{bottom:62px}

.lsearch{width:100%;height:40px;border-radius:12px;border:1px solid rgba(148,163,184,.45);background:none;color:inherit;font-size:14px;padding:0 12px;margin-bottom:8px;outline:none}
.lsearch:focus{border-color:#9c27b0}
.lrow{display:flex;align-items:center;width:100%;gap:10px;border:0;background:none;color:inherit;padding:11px 10px;border-radius:10px;font-size:14.5px;cursor:pointer;text-align:left}
.lrow small{color:#64748b;font-size:12.5px}
.lrow em{flex:1}
.lrow.on{background:rgba(156,39,176,.1);color:#9c27b0;font-weight:700}
.dark .lrow.on{background:rgba(139,92,246,.2);color:#c4b5fd}
.lrow:active,.desk .lrow:hover{background:rgba(148,163,184,.14)}
.srch{position:absolute;inset:0;z-index:12;pointer-events:none}
.srch .scrim2{position:absolute;inset:0;background:rgba(15,23,42,.25);opacity:0;transition:opacity .2s}
.srch.open{pointer-events:auto}
.srch.open .scrim2{opacity:1}
.sbox{position:absolute;left:50%;width:min(720px,calc(100% - 20px));display:flex;flex-direction:column;border-radius:22px;background:#fff;color:#111827;box-shadow:inset 0 1px 0 rgba(255,255,255,.85),0 24px 60px rgba(15,23,42,.35);transform:translate(-50%,-8px) scale(.98);opacity:0;transition:transform .2s,opacity .2s;overflow:hidden}
.dark .sbox{background:#18181b;color:#f4f4f5;box-shadow:inset 0 1px 0 rgba(255,255,255,.14),0 24px 60px rgba(0,0,0,.55)}
.srch.open .sbox{transform:translate(-50%,0);opacity:1}
.sbox.morph{transition:none}
.srch.closing{pointer-events:none}
.srch.closing .scrim2{transition:none}
.cur{flex:none;display:flex;align-items:center;gap:8px;padding:10px 14px 0;font-size:12.5px;color:#64748b}
.dark .cur{color:#a1a1aa}
.cur svg{width:13px;height:13px;flex:none;fill:none;stroke:#16a34a;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}
.cur span{flex:1;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.cur button{border:0;background:none;color:inherit;font-size:12.5px;font-weight:600;cursor:pointer;padding:2px 4px;border-radius:6px;display:flex;align-items:center;gap:4px}
.cur button svg{stroke:currentColor}
.sin{flex:none;display:flex;align-items:center;gap:10px;margin:10px 12px 8px;height:50px;padding:0 6px 0 14px;border-radius:16px;background:#f1f5f9;border:2px solid transparent}
.dark .sin{background:#27272a}
.sin:focus-within{border-color:#9c27b0;background:none}
.dark .sin:focus-within{border-color:#8b5cf6}
.sin>svg{width:20px;height:20px;flex:none;fill:none;stroke:#64748b;stroke-width:2.2;stroke-linecap:round}
.sin input{flex:1;min-width:0;height:100%;border:0;background:none;color:inherit;font-size:16px;outline:none}
.sin input::placeholder{color:#94a3b8}
.sin .sx{width:34px;height:34px}
.chips{flex:none;display:flex;gap:6px;padding:0 12px 8px;overflow-x:auto;scrollbar-width:none}
.chips::-webkit-scrollbar{display:none}
.chip{flex:none;height:30px;padding:0 12px;border-radius:15px;border:1px solid rgba(148,163,184,.45);background:none;color:inherit;font-size:12.5px;font-weight:600;cursor:pointer;white-space:nowrap}
.chip.on{background:#9c27b0;border-color:#9c27b0;color:#fff}
.dark .chip.on{background:#8b5cf6;border-color:#8b5cf6}
.res{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:0 8px 8px;scrollbar-width:none}
.res::-webkit-scrollbar{display:none}
.rsec{display:flex;align-items:center;font-size:11.5px;font-weight:700;letter-spacing:.03em;padding:10px 8px 4px;text-transform:uppercase}
.rsec span{flex:1}
.rsec button{border:0;background:none;color:#9c27b0;font-size:12px;font-weight:600;cursor:pointer;text-transform:none;letter-spacing:0}
.dark .rsec button{color:#c4b5fd}
.ri{display:flex;align-items:center;gap:12px;width:100%;min-height:52px;padding:7px 8px;border:0;border-radius:12px;background:none;color:inherit;text-align:left;cursor:pointer}
.ri.act{background:rgba(156,39,176,.08)}
.dark .ri.act{background:rgba(139,92,246,.16)}
.desk .ri:hover{background:rgba(148,163,184,.12)}
.ri .rk{flex:none;width:36px;height:36px;border-radius:10px;display:grid;place-items:center;background:#f1f5f9;color:#475569}
.dark .ri .rk{background:#27272a;color:#d4d4d8}
.ri .rk svg{width:19px;height:19px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.ri .rk.kp{background:#f3e8ff;color:#9c27b0}
.dark .ri .rk.kp{background:rgba(139,92,246,.2);color:#c4b5fd}
.ri .rk.g{background:#fff;border:1px solid #e5e7eb;font:800 17px Arial,sans-serif;color:#4285f4}
.dark .ri .rk.g{background:#fff}
.ri .rk.yt{background:#fee2e2}
.ri .rk.yt i{width:20px;height:14px;border-radius:4px;background:#f00;display:grid;place-items:center}
.ri .rk.yt i::after{content:"";border-left:6px solid #fff;border-top:4px solid transparent;border-bottom:4px solid transparent;margin-left:1px}
.ri .rk.sg{background:none;color:#94a3b8}
.ri .rt{flex:1;min-width:0}
.ri .rt b{display:block;font-size:14.5px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ri .rt b strong{font-weight:800}
.ri .rt small{display:block;font-size:12.5px;color:#64748b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px}
.dark .ri .rt small{color:#a1a1aa}
.ri .rt small i{font-style:normal;color:#9c27b0;font-weight:600}
.dark .ri .rt small i{color:#c4b5fd}
.ri .ra{flex:none;width:32px;height:32px;border-radius:8px;display:grid;place-items:center;color:#94a3b8}
.ri .ra svg{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.ri .ra:active,.desk .ri .ra:hover{background:rgba(148,163,184,.2);color:#475569}
.empty{padding:18px 12px 22px;text-align:center;font-size:13px;color:#64748b;line-height:1.5}
.sfoot{flex:none;display:flex;flex-wrap:wrap;gap:4px 14px;justify-content:center;padding:8px 12px 10px;border-top:1px solid rgba(148,163,184,.3);font-size:11.5px;white-space:nowrap;color:#64748b}
.sfoot kbd{font:700 11px -apple-system,sans-serif;padding:1px 5px;border-radius:5px;border:1px solid rgba(148,163,184,.45);border-bottom-width:2px;color:#9c27b0}
.dark .sfoot kbd{color:#c4b5fd}
.srch:not(.deskmode) .sfoot{display:none}
.screen.apk:not(.desk){--sab:20px}
.bbar{padding-bottom:calc(6px + var(--sab));-webkit-touch-callout:none}
.wide .bbar{bottom:calc(6px + var(--sab));padding-bottom:6px}
.wide .bbar.hide{transform:translate(-50%,calc(100% + 14px + var(--sab)))}
.hzone{bottom:calc(var(--yb) + var(--sab))}
.toast{bottom:calc(86px + var(--sab));text-align:center;width:max-content}
.hidden .toast,.siteoff .toast{bottom:calc(52px + var(--yb) + var(--sab))}
.coach{bottom:calc(84px + var(--sab))}
.wide .coach{bottom:calc(92px + var(--sab))}
.panel{padding-bottom:calc(16px + var(--sab))}
.wide .panel{padding-bottom:14px}
.nb{font-size:calc(11px * var(--ts,1))}
.bbar.tight .nb{font-size:calc(10px * var(--ts,1))}
.wide .nb{font-size:calc(12px * var(--ts,1))}
.pland .bbar{padding-top:3px;padding-bottom:calc(3px + var(--sab))}
.pland .bin{max-width:760px}
.pland .nb{flex-direction:row;justify-content:center;gap:2px;padding:1px 2px;font-size:calc(12px * var(--ts,1))}
.pland .nb .ico{width:34px;height:30px}
.pland .nb .lb{margin:0;max-width:100%}
.pland .sbtn{width:42px;height:42px}
.pland .sbtn svg{width:21px;height:21px}
.pland .toast{bottom:calc(62px + var(--sab))}
.pland .coach{bottom:calc(58px + var(--sab));max-width:460px}
.btop{right:16px;bottom:calc(110px + var(--sab));z-index:5;padding:0;border-radius:50%;display:grid;place-items:center;cursor:pointer;opacity:0;transform:translateY(10px) scale(.92);pointer-events:none;transition:opacity .2s,transform .2s,bottom .25s;-webkit-tap-highlight-color:transparent;height:46px}
.btop svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
.btop.on{opacity:1;transform:none;pointer-events:auto}
.btop:active{transform:scale(.93)}
.wide .btop{right:24px}
.dark .btop{box-shadow:0 14px 36px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.06)}
.toast.act{display:flex;align-items:center;text-align:left}
.toast.act.on{pointer-events:auto}
.toast .tu{margin-left:14px;padding:4px 2px;border:0;background:none;color:#d8b4fe;font-size:13px;font-weight:800;font-family:inherit;cursor:pointer;flex:none;white-space:nowrap}
.pop .qh{padding:2px 12px 4px;font-size:12px;font-weight:700;color:#64748b}
.pop .row small{margin-left:auto;padding-left:12px;color:#64748b;font-size:12.5px;font-weight:600}
.pop .qspd{cursor:default}
.pop .qspd:active{background:none}
.pop .qspd button{flex:none;width:34px;height:34px;padding:0;border-radius:50%;border:1px solid rgba(148,163,184,.45);background:none;color:inherit;font-size:18px;line-height:1;cursor:pointer;font-family:inherit}
.pop .qspd button:first-of-type{margin-left:auto}
.pop .qrate{min-width:50px;text-align:center;font-variant-numeric:tabular-nums}
.dark .pop .qh,.dark .pop .row small{color:#a1a1aa}
.krev{display:flex;align-items:center;gap:10px;width:100%;margin:2px 0 12px;padding:11px 12px;border:1px solid rgba(148,163,184,.3);border-radius:12px;background:rgba(156,39,176,.06);color:inherit;font:inherit;font-size:14px;font-weight:600;cursor:pointer;text-align:left}
.krev svg{flex:none;width:20px;height:20px;fill:none;stroke:#9c27b0;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.krev span{flex:1}
.krev svg:last-child{width:16px;height:16px;stroke:#94a3b8}
.dark .krev{background:rgba(196,181,253,.08)}
.dark .krev svg:first-child{stroke:#c4b5fd}
@media (prefers-reduced-motion: reduce){
  .screen *,.screen *::before,.screen *::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important;scroll-behavior:auto!important}
}
.bbar.swiping{overflow:hidden}
/* v3.5.220: nút về đầu trang luôn cách đáy ≥ 60px */
.toast .ti{display:inline-flex;margin-right:8px;vertical-align:-4px}
.toast .ti svg{width:18px;height:18px;fill:none;stroke:#fca5a5;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.iscrim{position:absolute;left:0;right:0;z-index:5;background:rgba(15,23,42,.38);opacity:0;pointer-events:none;transition:opacity .25s}
.introon .iscrim{opacity:1;pointer-events:auto}
.introon .bbar{box-shadow:0 0 0 3px rgba(156,39,176,.55),0 -6px 18px rgba(15,23,42,.12)!important}
.intro .ch1 svg{width:22px;height:22px}
.intro .ch1 small{display:block;font-size:12px;font-weight:500;color:#64748b;margin-top:1px}
.intro li{justify-content:flex-start;align-items:center;gap:10px}
.intro li svg{flex:none;width:18px;height:18px;fill:none;stroke:#9c27b0;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.intro li span{flex:1}
.dark .intro .ch1 small{color:#a1a1aa}
.dark .intro li svg{stroke:#c4b5fd}
.screen,.screen.apk:not(.desk){--sab:env(safe-area-inset-bottom,0px)}
.bbar,.hzone,.offdot,.pop.open,.clear.on{pointer-events:auto}
.bbar.hide{pointer-events:none}
.bbar.peek{pointer-events:auto}
.nscrim{position:fixed;inset:0;z-index:8;background:rgba(0,0,0,.4);opacity:0;visibility:hidden;transition:opacity .25s,visibility .25s}
.screen.notesopen .nscrim{opacity:1;visibility:visible;pointer-events:auto}
.screen.extyield .bbar{opacity:0;visibility:hidden;transition:transform .26s cubic-bezier(.2,.8,.2,1),opacity .22s,visibility 0s .26s}
.screen.extyield:not(.readeron) .btop{display:none}
.screen.extyield .hzone,.screen.extyield .offdot,.screen.extyield .coach,.screen.extyield .iscrim{display:none}
.bbar,.hzone,.offdot,.toast,.coach,.btop,.pop,.panel{position:fixed}
.sheet .scrim,.srch .scrim2,.iscrim,.nscrim{top:-120px;bottom:-120px}
.sheet:not(.open) .panel{visibility:hidden;transition:transform .26s cubic-bezier(.2,.8,.2,1),visibility 0s .26s}
.wide .sheet:not(.open) .panel{transition:transform .2s,opacity .2s,visibility 0s .2s}
.panel.growing{transition:none}
.screen:not(.desk) .bbar{padding-top:7.5px;padding-bottom:calc(7.5px + var(--sab))}
.screen.wide:not(.desk) .bbar{padding-top:8.8px;padding-bottom:8.8px}
.screen:not(.desk) .nb .ico{height:36px;border-radius:18px}
.screen:not(.desk) .toast{bottom:calc(99px + var(--sab))}
.screen:not(.desk) .coach{bottom:calc(97px + var(--sab))}
.screen.wide:not(.desk) .coach{bottom:calc(106px + var(--sab))}
.screen.pland .bbar{padding-top:4px;padding-bottom:calc(4px + var(--sab))}
.screen.pland .nb .ico{height:36px}
.screen.pland .toast{bottom:calc(72px + var(--sab))}
.screen.pland .coach{bottom:calc(68px + var(--sab))}
.screen.hidden .toast,.screen.siteoff .toast{bottom:calc(52px + var(--yb) + var(--sab))}
.screen:not(.desk) .sbtn{width:50px;height:50px}
.screen:not(.desk) .bin{min-height:62px}
.screen.pland .sbtn{width:40px;height:40px}
.screen.pland .bin{min-height:46px}
.screen.wide:not(.desk) .sbtn{margin:0 14px}
.screen:not(.desk) .nb svg{width:28.6px;height:28.6px}
.screen:not(.desk) .sbtn svg{width:32px;height:32px}
.screen.pland .sbtn svg{width:27.5px;height:27.5px}
.mfoot{gap:0}
.fq,.fq:nth-child(n){justify-self:stretch;flex-direction:column;justify-content:center;gap:3px;min-height:54px;padding:4px 2px;font-size:12px}
.bbar{border-color:rgba(15,23,42,.08)}
.dark .bbar{border-color:rgba(255,255,255,.09)}
.nb.on{color:#6d28d9}
.dark .nb.on{color:#c4b5fd}
.nb svg{stroke-width:1.8}
.nb .ico{width:46px;border-radius:12px}
.nb.on .ico{background:rgba(124,58,237,.12)}
.dark .nb.on .ico{background:rgba(139,92,246,.22)}
.sbtn{background:linear-gradient(135deg,#4f46e5,#8b5cf6);border-radius:50%;box-shadow:0 4px 14px rgba(99,70,229,.42)}
.btop{width:46px;border:1px solid rgba(15,23,42,.08);box-shadow:0 10px 30px rgba(15,23,42,.16)}
.dark .btop{border-color:rgba(255,255,255,.09);color:#f4f4f5}.desk.dark .btop:hover{background:rgba(40,40,46,.92)}
.dark .panel{color:var(--kp-tx-strong-d)}
.mfoot{border-top-color:rgba(15,23,42,.1)}
.screen .bbar{left:10px;right:10px;bottom:calc(4px + var(--sab));padding:6px 4px!important;border-radius:26px;border:1px solid rgba(15,23,42,.08);box-shadow:0 10px 30px rgba(15,23,42,.16)}
.screen.dark .bbar{border-color:rgba(255,255,255,.09);box-shadow:0 14px 36px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.06)}
.screen .bbar.hide{transform:translateY(calc(100% + 64px + var(--sab)));box-shadow:none}
.screen .bin{min-height:58px}
.screen .nb .ico{height:30px}
.screen.wide .bbar{left:50%;right:auto;bottom:calc(4px + var(--sab));border-radius:26px;padding:6px 10px!important}
.screen.wide .bbar.hide{transform:translate(-50%,calc(100% + 64px + var(--sab)))}
.screen.pland .bbar{left:10px;right:10px;bottom:calc(4px + var(--sab));padding:3px 4px!important;border-radius:22px}
.screen .bbar.peek{box-shadow:0 10px 30px rgba(15,23,42,.16)}
.screen.dark .bbar.peek{box-shadow:0 14px 36px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.06)}
.screen.hidden .hzone i{background:rgba(139,92,246,.85)}
.screen .hzone i{bottom:4px}
.screen .bbar.shid{box-shadow:none;pointer-events:none}
.bbar.snap{transition:transform .3s cubic-bezier(.2,.8,.2,1),opacity .2s,translate .24s cubic-bezier(.2,.8,.2,1)}
.btop.snap{transition:opacity .2s,transform .2s,bottom .25s,translate .24s cubic-bezier(.2,.8,.2,1)}
.dark .sin,.dark .ri .rk{background:var(--kp-tile-d)}
.dark .bbar,.dark .panel,.dark .btop,.dark .sbox{background:var(--kp-glass-d);-webkit-backdrop-filter:var(--kp-blur);backdrop-filter:var(--kp-blur)}
.dark .nb{color:var(--kp-tx-d)}
.dark .sec,.dark .rsec{color:var(--kp-tx2-d)}
.dark .q .ic{background:var(--kp-tile-d);border-color:var(--kp-line-d);color:var(--kp-tx-strong-d)}
.dark .q small{color:var(--kp-tx2-d)}
.dark .mfoot{background:rgba(255,255,255,.04);border-top-color:rgba(255,255,255,.1)}
.dark .fq{color:var(--kp-tx-d)}
.dark .fq svg{color:var(--kp-tx-d)}
.dark .lwrap input{background:var(--kp-tile-d);border-color:rgba(255,255,255,.14);color:var(--kp-tx-strong-d)}
.dark .lwrap .caret{stroke:var(--kp-tx2-d)}
.dark .lname,.dark .lopt .le{color:#a1a1aa}
.dark .lopts{background:#26262b;border-color:var(--kp-line-d)}
.dark .lchip{border-color:rgba(255,255,255,.18)}
.dark .lchip svg{color:var(--kp-tx2-d)}
.dark .sx{color:#d4d4d8}
.sin,.ri .rk{background:var(--kp-tile-l)}
.sin:focus-within{background:var(--kp-tile-l)}
.dark .sin:focus-within{background:var(--kp-tile-d)}
.bbar,.panel,.btop,.sbox{background:var(--kp-glass-l);-webkit-backdrop-filter:var(--kp-blur);backdrop-filter:var(--kp-blur)}
.desk .btop:hover{background:rgba(255,255,255,.9)}
.nb{color:var(--kp-tx-l)}
.btop{color:var(--kp-tx-strong-l)}
.sec,.rsec{color:var(--kp-tx2-l)}
.q .ic{background:var(--kp-tile-l);border-color:var(--kp-line-l);color:var(--kp-tx-strong-l);box-shadow:0 1px 2px rgba(15,23,42,.05)}
.q small{color:var(--kp-tx2-l)}
.mfoot{background:rgba(255,255,255,.35)}
.fq{color:var(--kp-tx-strong-l)}
.fq svg{color:var(--kp-tx-l)}
.lwrap input{background:rgba(255,255,255,.6);border-color:rgba(15,23,42,.14)}
.lname{color:#71717a}
.lchip{border-color:rgba(15,23,42,.16)}
.lchip svg{color:var(--kp-tx2-l)}
.sx{color:var(--kp-tx2-l)}
`;
