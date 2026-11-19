/* v3.5.496 — BẢNG GHI ĐƯỜNG MỞ TỆP (bản tạm, sẽ tắt khi có kết quả).
   Ghi lại toàn bộ diễn biến từ lúc bấm mở tệp tới lúc khung tài liệu dựng xong:
   tin nhắn gửi/nhận giữa Dashboard và khung, thẻ "Đang mở tệp", khung đang ẩn/hiện,
   và xin luôn báo cáo bên trong khung để gộp vào 1 tệp duy nhất.
   Bấm "Tải báo cáo" → ra 1 tệp .txt gửi đi là đủ. Không gửi gì ra ngoài. */
(() => {
  'use strict';
  const DIAG = true; /* bản chẩn đoán — đặt false để tắt hẳn */
  if (!DIAG) return;

  const LOG = [];
  const T0 = performance.now();
  const now = () => Math.round(performance.now() - T0);
  const clip = (v, n = 140) => { try { return String(v == null ? '' : v).slice(0, n); } catch { return ''; } };
  const json = v => { try { const s = JSON.stringify(v); if (s === undefined) return String(v); return s.length > 220 ? s.slice(0, 220) + '…' : s; } catch { return '?'; } };

  let frameText = '(khung chưa trả lời)';
  let box = null, pre = null, btn = null, timer = 0;

  const log = (what, data) => { LOG.unshift({ at: now(), what, data }); if (LOG.length > 200) LOG.length = 200; paintSoon(); };

  /* Bắt mọi tin nhắn gửi tới khung (kể cả frame.contentWindow.postMessage). */
  try {
    const proto = window.Window && window.Window.prototype;
    const orig = proto && proto.postMessage;
    if (orig) {
      proto.postMessage = function (msg, ...rest) {
        try {
          const t = msg && msg.type;
          if (typeof t === 'string' && t.indexOf('KEEPIT_') === 0) log('gửi→khung', { t, d: t.indexOf('OPEN') >= 0 || t.indexOf('FILES') >= 0 ? clip(json(msg), 120) : undefined });
        } catch { /* ignore */ }
        return orig.apply(this, [msg, ...rest]);
      };
    }
  } catch { /* ignore */ }

  addEventListener('message', e => {
    const t = e.data && e.data.type;
    if (typeof t !== 'string' || t.indexOf('KEEPIT_') !== 0) return;
    if (t === 'KEEPIT_DIAG_REPORT') { frameText = String(e.data.text || '(rỗng)'); log('nhận←khung: BÁO CÁO', { soKyTu: frameText.length }); return; }
    log('nhận←khung', { t, d: t.indexOf('TOAST') >= 0 || t.indexOf('STEP') >= 0 ? clip(json(e.data), 120) : undefined });
  });

  const frameEl = () => document.getElementById('dashboardDocumentsFrame');

  function frameState() {
    const f = frameEl();
    if (!f) return 'không có #dashboardDocumentsFrame trong DOM';
    const cs = getComputedStyle(f);
    const r = f.getBoundingClientRect();
    return `src=${clip(f.getAttribute('src') || '(trống)', 70)} | ${Math.round(r.width)}×${Math.round(r.height)} op=${cs.opacity} pe=${cs.pointerEvents} disp=${cs.display} vis=${cs.visibility}`;
  }

  function cardState() {
    const c = document.getElementById('docLibOpenCard');
    if (!c) return 'không có thẻ mở tệp';
    const cs = getComputedStyle(c);
    const r = c.getBoundingClientRect();
    return `${Math.round(r.width)}×${Math.round(r.height)} op=${cs.opacity} disp=${cs.display} vis=${cs.visibility} | "${clip(c.textContent.replace(/\s+/g, ' '), 80)}"`;
  }

  function report() {
    return [
      '--- Keepit 3.5.496 · ghi đường mở tệp (Dashboard) ---',
      'lúc: ' + new Date().toISOString(),
      'view: ' + location.search,
      '',
      'TRẠNG THÁI DASHBOARD',
      'body.class = ' + clip(document.body.className, 200),
      'khung       = ' + frameState(),
      'thẻ mở tệp  = ' + cardState(),
      'toast       = ' + clip(document.querySelector('#dashboardToast, .dashToast, #toast')?.textContent || '(không có)', 120),
      '',
      'DIỄN BIẾN (mới nhất trước)',
      ...LOG.map(x => `${String(x.at).padStart(6)}  ${x.what}  ${x.data ? json(x.data) : ''}`),
      '',
      '================ BÁO CÁO TRONG KHUNG TÀI LIỆU ================',
      frameText
    ].join('\n');
  }

  function download() {
    const f = frameEl();
    try { f?.contentWindow?.postMessage({ type: 'KEEPIT_DIAG_REQUEST' }, location.origin); } catch { /* ignore */ }
    if (btn) btn.textContent = 'Đang lấy…';
    setTimeout(() => {
      try {
        const blob = new Blob([report()], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'keepit-bao-cao-' + Date.now() + '.txt';
        document.body.append(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      } catch { /* ignore */ }
      if (btn) btn.textContent = 'Tải báo cáo';
    }, 400);
  }

  function build() {
    if (box || !document.body) return;
    box = document.createElement('div');
    box.id = 'keepitOpenTrace';
    box.setAttribute('style', [
      'position:fixed', 'right:12px', 'bottom:12px', 'width:min(420px,calc(100vw - 24px))', 'max-height:40vh',
      'overflow:auto', 'z-index:2147483000', 'background:#101014', 'color:#e8e8ef', 'border:1px solid #4b3a6b',
      'border-radius:12px', 'padding:10px 12px', 'font:11px/1.45 ui-monospace,Menlo,Consolas,monospace',
      'box-shadow:0 12px 32px rgba(0,0,0,.45)', 'white-space:pre-wrap', 'word-break:break-word'
    ].join(';'));
    const bar = document.createElement('div');
    bar.setAttribute('style', 'display:flex;gap:6px;align-items:center;margin-bottom:6px;font:600 11px/1 system-ui,sans-serif;color:#c9b6ff');
    const title = document.createElement('span');
    title.textContent = 'Ghi đường mở tệp (3.5.496)';
    title.style.marginRight = 'auto';
    btn = document.createElement('button');
    btn.type = 'button'; btn.textContent = 'Tải báo cáo';
    btn.setAttribute('style', 'font:600 11px/1 system-ui,sans-serif;padding:6px 10px;border-radius:8px;border:1px solid #6b4fa0;background:#2c1f4a;color:#e8e8ef;cursor:pointer');
    btn.onclick = download;
    const hide = document.createElement('button');
    hide.type = 'button'; hide.textContent = 'Ẩn';
    hide.setAttribute('style', 'font:600 11px/1 system-ui,sans-serif;padding:6px 10px;border-radius:8px;border:1px solid #6b4fa0;background:#241a3a;color:#e8e8ef;cursor:pointer');
    hide.onclick = () => { const on = pre.style.display === 'none'; pre.style.display = on ? '' : 'none'; hide.textContent = on ? 'Ẩn' : 'Hiện'; };
    bar.append(title, btn, hide);
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
      pre.textContent = [
        'khung: ' + frameState(),
        'thẻ mở tệp: ' + cardState(),
        'body.class: ' + clip(document.body.className, 120),
        '',
        ...LOG.slice(0, 10).map(x => `${String(x.at).padStart(6)}  ${x.what}  ${x.data ? json(x.data) : ''}`)
      ].join('\n');
    } catch { /* ignore */ }
  }

  function paintSoon() { if (timer) return; timer = setTimeout(() => { timer = 0; paint(); }, 150); }

  /* Theo dõi khung + thân trang đổi trạng thái (ẩn/hiện, src, class). */
  const attachObserver = () => {
    const f = frameEl();
    if (f) {
      new MutationObserver(muts => {
        for (const m of muts) {
          if (m.attributeName === 'src') log('KHUNG: đổi src', { src: clip(f.getAttribute('src') || '(trống)', 70) });
          else log('KHUNG: đổi ' + m.attributeName, { cls: clip(f.className, 60) });
        }
      }).observe(f, { attributes: true, attributeFilter: ['src', 'class', 'style', 'hidden'] });
    }
    new MutationObserver(() => log('body.class', { cls: clip(document.body.className, 120) }))
      .observe(document.body, { attributes: true, attributeFilter: ['class'] });
    const card = document.getElementById('docLibOpenCard');
    if (card) new MutationObserver(() => log('THẺ MỞ TỆP đổi', { s: cardState() }))
      .observe(card, { attributes: true, attributeFilter: ['class', 'style', 'hidden'] });
  };

  const start = () => { build(); attachObserver(); setInterval(paint, 900); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
