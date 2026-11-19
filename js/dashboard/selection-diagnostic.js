/* v3.5.494 — BẢNG CHẨN ĐOÁN CHỌN CHỮ (bản tạm, sẽ tắt ở bản sau).
   Mục đích: khi bôi đen không hiện thanh Tô sáng/Dịch/AI, bảng này ghi lại đúng chỗ hỏng:
   - `last.stage` từ content.js: mouseup.noTextOrEditable / mouseup.disconnected /
     mouseup.outsideContext / mouseup.websiteDisabled …
   - vùng chọn có hình thành không (đo ngay lúc mouseup, +50 ms, +250 ms)
   - trên chữ có thứ gì chặn chuột không (elementFromPoint)
   - trang đang khoá chọn chữ không (data-select-locked / user-select)
   Bật/tắt bằng cờ DIAG bên dưới. Không gửi gì ra ngoài, chỉ hiện trên màn hình. */
(() => {
  'use strict';
  const DIAG = false; /* v3.5.495: đã xác nhận lỗi chọn chữ hết (ảnh người dùng: thanh Tô sáng/Dịch/Hỏi AI hiện với 449 ký tự). Đổi thành true nếu cần chẩn đoán lại. */
  if (!DIAG) return;

  const LOG = [];
  const T0 = performance.now();
  const now = () => Math.round(performance.now() - T0);
  const clip = v => { try { return String(v == null ? '' : v).slice(0, 160); } catch { return ''; } };
  const json = v => { try { const s = JSON.stringify(v); return s === undefined ? String(v) : (s.length > 200 ? s.slice(0, 200) + '…' : s); } catch { return '?'; } };

  const log = (what, data) => {
    LOG.unshift({ at: now(), what, data });
    if (LOG.length > 60) LOG.length = 60;
    paintSoon();
  };

  const selLen = () => { try { const s = getSelection(); return s ? String(s).length : -1; } catch { return -1; } };

  const topOf = (el) => {
    if (!el) return 'null';
    const cls = String(el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className || '').trim().split(/\s+/).slice(0, 2).join('.');
    const cs = getComputedStyle(el);
    return `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${cls ? '.' + cls : ''} pe=${cs.pointerEvents} z=${cs.zIndex} pos=${cs.position} op=${cs.opacity}`;
  };

  /* Trên một đoạn chữ thật: chuột chạm tới đâu, có bị vật khác nằm trên chặn không. */
  function probeText() {
    const stage = document.getElementById('stage');
    if (!stage) return 'chưa có #stage';
    const target = stage.querySelector('.textLayer span, .docsSource .para, .para');
    if (!target) return 'chưa có lớp chữ';
    const r = target.getBoundingClientRect();
    if (!r.width || !r.height) return 'lớp chữ kích thước 0';
    const x = Math.round(r.left + Math.min(12, r.width / 2));
    const y = Math.round(r.top + r.height / 2);
    if (y < 0 || y > innerHeight) return 'lớp chữ ngoài màn hình';
    const hit = document.elementFromPoint(x, y);
    const ok = !!hit && (hit === target || target.contains(hit) || hit.contains(target));
    return `${ok ? 'OK' : 'BỊ CHẶN'} tại ${x},${y} → ${topOf(hit)}`;
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
      soSpanChu: st ? st.querySelectorAll('.textLayer span, .para').length : -1,
      vungChonDai: selLen(),
      focus: document.hasFocus(),
      activeEl: document.activeElement ? (document.activeElement.id || document.activeElement.tagName) : null,
      probeText: probeText(),
      contentDebug: dbg
    };
  }

  /* ---- bảng hiện trên màn hình ---- */
  let box, pre, btnCopy, btnDl, btnHide, visible = true, timer = 0;
  function build() {
    if (box) return;
    box = document.createElement('div');
    box.id = 'keepitSelDiag';
    box.setAttribute('style', [
      'position:fixed', 'left:12px', 'bottom:12px', 'width:min(440px,calc(100vw - 24px))', 'max-height:46vh',
      'overflow:auto', 'z-index:2147483000', 'background:#101014', 'color:#e8e8ef', 'border:1px solid #4b3a6b',
      'border-radius:12px', 'padding:10px 12px', 'font:11px/1.45 ui-monospace,Menlo,Consolas,monospace',
      'box-shadow:0 12px 32px rgba(0,0,0,.45)', 'white-space:pre-wrap', 'word-break:break-word'
    ].join(';'));
    const bar = document.createElement('div');
    bar.setAttribute('style', 'display:flex;gap:6px;align-items:center;margin-bottom:6px;font:600 11px/1 system-ui,sans-serif;color:#c9b6ff');
    const title = document.createElement('span');
    title.textContent = 'Chẩn đoán chọn chữ (3.5.494)';
    const mk = (label, fn) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = label; b.setAttribute('style', 'margin-left:auto;font:600 11px/1 system-ui,sans-serif;padding:5px 8px;border-radius:8px;border:1px solid #6b4fa0;background:#241a3a;color:#e8e8ef;cursor:pointer'); b.onclick = fn; return b; };
    btnCopy = mk('Chép', copyReport);
    btnDl = mk('Tải .txt', downloadReport);
    btnHide = mk('Ẩn', () => { visible = !visible; pre.style.display = visible ? '' : 'none'; btnHide.textContent = visible ? 'Ẩn' : 'Hiện'; });
    for (const b of [btnCopy, btnDl, btnHide]) { b.style.marginLeft = '0'; bar.append(b); }
    title.style.marginRight = 'auto';
    bar.prepend(title);
    pre = document.createElement('pre');
    pre.setAttribute('style', 'margin:0;font:inherit;color:inherit;white-space:pre-wrap');
    box.append(bar, pre);
    (document.body || document.documentElement).append(box);
    paint();
  }

  function report() {
    return [
      '--- Keepit 3.5.494 · chẩn đoán chọn chữ ---',
      'lúc: ' + new Date().toISOString(),
      'địa chỉ khung: ' + location.pathname + location.search,
      '',
      'TRẠNG THÁI',
      (() => { try { return JSON.stringify(state(), null, 1); } catch { return '?'; } })(),
      '',
      'LẦN CHẠM CHUỘT (mới nhất trước)',
      ...LOG.map(x => `${String(x.at).padStart(6)}  ${x.what}  ${json(x.data)}`)
    ].join('\n');
  }

  function paint() {
    try {
      if (!box) build();
      const s = state();
      pre.textContent = [
        `mở bằng: ${s.duongMo}`,
        `nativeReady=${s.nativeReady}  show=${s.viewerShow}  khoáChọn=${s.selectLocked}`,
        `user-select #stage = ${s.userSelectStage}`,
        `số đoạn chữ = ${s.soSpanChu}   vùng chọn hiện tại = ${s.vungChonDai} ký tự`,
        `chuột chạm chữ: ${s.probeText}`,
        `content.js: ${json(s.contentDebug)}`,
        '',
        ...LOG.slice(0, 8).map(x => `${String(x.at).padStart(6)}  ${x.what}  ${json(x.data)}`)
      ].join('\n');
    } catch { /* không được làm hỏng trình xem */ }
  }

  function paintSoon() {
    if (timer) return;
    timer = setTimeout(() => { timer = 0; paint(); box && (box.style.display = ''); }, 120);
  }

  function copyReport() {
    const text = report();
    try { navigator.clipboard.writeText(text); } catch { /* ignore */ }
    btnCopy.textContent = 'Đã chép';
    setTimeout(() => { btnCopy.textContent = 'Chép'; }, 1500);
  }

  function downloadReport() {
    try {
      const blob = new Blob([report()], { type: 'text/plain' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'keepit-chan-doan-' + Date.now() + '.txt';
      document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    } catch { /* ignore */ }
  }

  /* ---- ghi lại từng lần chạm chuột ---- */
  document.addEventListener('mousedown', e => {
    if (box && box.contains(e.target)) return;
    const el = e.target;
    log('mousedown', { top: topOf(el), sel: selLen(), hit: clip(el?.textContent) });
  }, true);

  document.addEventListener('mouseup', e => {
    if (box && box.contains(e.target)) return;
    const t0 = selLen();
    log('mouseup', { sel: t0, khoa: document.getElementById('viewer')?.dataset.selectLocked ?? null });
    setTimeout(() => log('+50ms', { sel: selLen(), content: json(safeDbg()) }), 50);
    setTimeout(() => log('+250ms', { sel: selLen() }), 250);
  }, true);

  function safeDbg() { try { return globalThis.LHN_CONTENT_TOOLS?.selectionDebug?.()?.last || null; } catch { return null; } }

  addEventListener('error', e => log('LỖI JS', { m: clip(e.message), src: clip(e.filename) + ':' + e.lineno }));
  addEventListener('unhandledrejection', e => log('PROMISE LỖI', { m: clip(e.reason && (e.reason.message || e.reason)) }));

  addEventListener('message', e => log('tin nhắn vào', { t: clip(e.data && e.data.type) }));

  const start = () => { build(); setInterval(() => { const v = document.getElementById('viewer'); if (v && v.classList.contains('show')) paint(); }, 700); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
