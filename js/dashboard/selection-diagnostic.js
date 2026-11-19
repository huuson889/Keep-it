/* v3.5.496 — BẢNG CHẨN ĐOÁN CHỌN CHỮ (bản tạm, sẽ tắt khi có kết quả).
   Ghi lại đúng khoảnh khắc bôi đen để biết vì sao thanh Tô sáng/Dịch/AI không hiện:
   - `last.stage` từ content.js: mouseup.noTextOrEditable / disconnected / outsideContext …
   - vùng chọn ngay lúc nhả chuột, +50 ms, +250 ms
   - lớp chữ: có bao nhiêu span, bao nhiêu span CÓ KÍCH THƯỚC THẬT (span 0×0 = không chọn được)
   - thanh công cụ (#lhn-*) có trong DOM không, đang hiện hay ẩn
   - font đã nạp xong chưa, `user-select`, `data-select-locked`
   Bấm "Chép"/"Tải .txt" để lấy báo cáo. Không gửi gì ra ngoài. */
(() => {
  'use strict';
  const DIAG = true; /* bản chẩn đoán — đặt false để tắt hẳn */
  if (!DIAG) return;

  const LOG = [];
  const T0 = performance.now();
  const now = () => Math.round(performance.now() - T0);
  const clip = (v, n = 160) => { try { return String(v == null ? '' : v).slice(0, n); } catch { return ''; } };
  const json = v => { try { const s = JSON.stringify(v); if (s === undefined) return String(v); return s.length > 240 ? s.slice(0, 240) + '…' : s; } catch { return '?'; } };

  let box = null, pre = null, btnCopy = null, btnHide = null, visible = true, timer = 0;

  const log = (what, data) => { LOG.unshift({ at: now(), what, data }); if (LOG.length > 80) LOG.length = 80; paintSoon(); };
  const selLen = () => { try { const s = getSelection(); return s ? String(s).length : -1; } catch { return -1; } };

  const topOf = el => {
    if (!el || !el.tagName) return 'null';
    const cls = String(el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className || '').trim().split(/\s+/).slice(0, 2).join('.');
    const cs = getComputedStyle(el);
    return `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${cls ? '.' + cls : ''} pe=${cs.pointerEvents} z=${cs.zIndex} pos=${cs.position} op=${cs.opacity}`;
  };

  /* Lớp chữ: span 0×0 thì chuột / vùng chọn không dính vào chữ → đây là nghi phạm chính. */
  function spanStats() {
    const st = document.getElementById('stage');
    if (!st) return 'chưa có #stage';
    const layers = st.querySelectorAll('.textLayer');
    let total = 0, sized = 0;
    for (const layer of layers) for (const s of layer.querySelectorAll('span')) {
      total++;
      const r = s.getBoundingClientRect();
      if (r.width > 1 && r.height > 1) sized++;
    }
    const first = st.querySelector('.textLayer span');
    const fr = first ? first.getBoundingClientRect() : null;
    return `${layers.length} lớp, ${total} span, ${sized} span có kích thước` + (fr ? `, span đầu ${Math.round(fr.width)}×${Math.round(fr.height)}` : '');
  }

  function toolbarState() {
    const SEL = '#lhn-keepit-bar,#lhn-panel,#lhn-note-pop,#lhn-translate-icon,#lhn-direct-translation,#lhn-sidebar';
    let nodes = [];
    try { nodes = [...document.querySelectorAll(SEL)]; } catch { return '?'; }
    if (!nodes.length) return 'không có phần tử nào trong DOM';
    return nodes.map(el => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return `${el.id || el.className}(${Math.round(r.width)}×${Math.round(r.height)} op=${cs.opacity} vis=${cs.visibility} disp=${cs.display})`;
    }).join(' · ');
  }

  function probeText() {
    const st = document.getElementById('stage');
    if (!st) return 'chưa có #stage';
    let target = null;
    for (const s of st.querySelectorAll('.textLayer span')) {
      const r = s.getBoundingClientRect();
      if (r.width > 4 && r.height > 4 && r.top >= 0 && r.bottom <= innerHeight) { target = s; break; }
    }
    if (!target) return 'KHÔNG có span chữ nào có kích thước trong màn hình';
    const r = target.getBoundingClientRect();
    const hit = document.elementFromPoint(Math.round(r.left + 6), Math.round(r.top + r.height / 2));
    const ok = !!hit && (hit === target || target.contains(hit) || hit.contains(target));
    return `${ok ? 'OK' : 'BỊ CHẶN'} → ${topOf(hit)}`;
  }

  function state() {
    const v = document.getElementById('viewer'), st = document.getElementById('stage');
    const cs = st ? getComputedStyle(st) : null;
    let dbg = null;
    try { dbg = globalThis.LHN_CONTENT_TOOLS?.selectionDebug?.() || null; } catch { dbg = 'lỗi'; }
    return {
      tai: now() + 'ms',
      duongMo: location.search ? location.search.slice(0, 60) : '(không có ?document= → mở bằng tin nhắn)',
      khungNhung: (() => { try { return parent !== window; } catch { return null; } })(),
      viewerShow: v ? v.classList.contains('show') : null,
      nativeReady: v?.dataset.nativeReady ?? null,
      selectLocked: v?.dataset.selectLocked ?? null,
      userSelectStage: cs ? (cs.userSelect || cs.webkitUserSelect) : null,
      font: (() => { try { return document.fonts ? document.fonts.status : '?'; } catch { return '?'; } })(),
      lopChu: spanStats(),
      vungChonDai: selLen(),
      vungChon: clip(getSelection ? String(getSelection()) : '', 60),
      thanhCongCu: toolbarState(),
      probeText: probeText(),
      focus: document.hasFocus(),
      activeEl: document.activeElement ? (document.activeElement.id || document.activeElement.tagName) : null,
      contentDebug: dbg
    };
  }

  function report() {
    return [
      '--- Keepit 3.5.496 · chẩn đoán chọn chữ (khung tài liệu) ---',
      'lúc: ' + new Date().toISOString(),
      'khung: ' + location.pathname + location.search,
      '',
      'TRẠNG THÁI',
      (() => { try { return JSON.stringify(state(), null, 1); } catch { return '?'; } })(),
      '',
      'LẦN CHẠM CHUỘT (mới nhất trước)',
      ...LOG.map(x => `${String(x.at).padStart(6)}  ${x.what}  ${json(x.data)}`)
    ].join('\n');
  }

  function build() {
    if (box || !document.body) return;
    box = document.createElement('div');
    box.id = 'keepitSelDiag';
    box.setAttribute('style', [
      'position:fixed', 'left:12px', 'bottom:12px', 'width:min(460px,calc(100vw - 24px))', 'max-height:46vh',
      'overflow:auto', 'z-index:2147483000', 'background:#101014', 'color:#e8e8ef', 'border:1px solid #4b3a6b',
      'border-radius:12px', 'padding:10px 12px', 'font:11px/1.45 ui-monospace,Menlo,Consolas,monospace',
      'box-shadow:0 12px 32px rgba(0,0,0,.45)', 'white-space:pre-wrap', 'word-break:break-word'
    ].join(';'));
    const bar = document.createElement('div');
    bar.setAttribute('style', 'display:flex;gap:6px;align-items:center;margin-bottom:6px;font:600 11px/1 system-ui,sans-serif;color:#c9b6ff');
    const title = document.createElement('span');
    title.textContent = 'Chẩn đoán chọn chữ (3.5.496)';
    title.style.marginRight = 'auto';
    const mk = (label, fn) => {
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = label;
      b.setAttribute('style', 'font:600 11px/1 system-ui,sans-serif;padding:5px 8px;border-radius:8px;border:1px solid #6b4fa0;background:#241a3a;color:#e8e8ef;cursor:pointer');
      b.onclick = fn; return b;
    };
    btnCopy = mk('Chép', () => {
      try { navigator.clipboard.writeText(report()); } catch { const t = document.createElement('textarea'); t.value = report(); document.body.append(t); t.select(); try { document.execCommand('copy'); } catch { /* ignore */ } t.remove(); }
      btnCopy.textContent = 'Đã chép';
      setTimeout(() => { if (btnCopy) btnCopy.textContent = 'Chép'; }, 1500);
    });
    const btnDl = mk('Tải .txt', () => {
      try {
        const blob = new Blob([report()], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'keepit-khung-' + Date.now() + '.txt';
        document.body.append(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      } catch { /* ignore */ }
    });
    btnHide = mk('Ẩn', () => { visible = !visible; pre.style.display = visible ? '' : 'none'; btnHide.textContent = visible ? 'Ẩn' : 'Hiện'; });
    bar.append(title, btnCopy, btnDl, btnHide);
    pre = document.createElement('pre');
    pre.setAttribute('style', 'margin:0;font:inherit;color:inherit;white-space:pre-wrap');
    box.append(bar, pre);
    document.body.append(box);
    paint();
  }

  function paint() {
    try {
      if (!box) build();
      if (!pre) return;
      const s = state();
      pre.textContent = [
        `mở bằng: ${s.duongMo}`,
        `nativeReady=${s.nativeReady}  show=${s.viewerShow}  khoáChọn=${s.selectLocked}  font=${s.font}`,
        `lớp chữ: ${s.lopChu}`,
        `vùng chọn hiện tại: ${s.vungChonDai} ký tự`,
        `chuột chạm chữ: ${s.probeText}`,
        `thanh công cụ: ${s.thanhCongCu}`,
        `content.js: ${json(s.contentDebug)}`,
        '',
        ...LOG.slice(0, 8).map(x => `${String(x.at).padStart(6)}  ${x.what}  ${json(x.data)}`)
      ].join('\n');
    } catch { /* không được làm hỏng trình xem */ }
  }

  function paintSoon() {
    if (timer) return;
    timer = setTimeout(() => { timer = 0; paint(); }, 120);
  }

  document.addEventListener('mousedown', e => {
    if (box && box.contains(e.target)) return;
    log('mousedown', { top: topOf(e.target), sel: selLen() });
  }, true);

  document.addEventListener('mouseup', e => {
    if (box && box.contains(e.target)) return;
    log('mouseup', { sel: selLen(), khoa: document.getElementById('viewer')?.dataset.selectLocked ?? null, lopChu: spanStats() });
    setTimeout(() => log('+50ms', { sel: selLen(), thanh: toolbarState(), content: json(safeDbg()) }), 50);
    setTimeout(() => log('+250ms', { sel: selLen(), thanh: toolbarState() }), 250);
  }, true);

  function safeDbg() { try { return globalThis.LHN_CONTENT_TOOLS?.selectionDebug?.()?.last || null; } catch { return null; } }

  addEventListener('error', e => log('LỖI JS', { m: clip(e.message), src: clip(e.filename) + ':' + e.lineno }));
  addEventListener('unhandledrejection', e => log('PROMISE LỖI', { m: clip(e.reason && (e.reason.message || e.reason)) }));

  addEventListener('message', e => {
    const t = e.data && e.data.type;
    if (typeof t === 'string' && t.indexOf('KEEPIT_') === 0) log('tin nhắn vào', { t });
    if (t === 'KEEPIT_DIAG_REQUEST') {
      try { parent.postMessage({ type: 'KEEPIT_DIAG_REPORT', text: report() }, location.origin); } catch { /* ignore */ }
    }
  });

  const start = () => {
    build();
    setInterval(() => { const v = document.getElementById('viewer'); if (v && v.classList.contains('show')) paint(); }, 800);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
