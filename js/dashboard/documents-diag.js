/* v3.5.573 — BẢN CHẨN ĐOÁN (tạm thời, sẽ gỡ ở bản sau).
   Ghi lại diễn biến khi chọn chữ trong khung xem tệp để tìm đúng nguyên nhân "vùng chọn nháy" trên thiết bị cảm ứng:
   chạm/kéo, mỗi lần vùng chọn đổi (neo + đầu kia + dòng), trình duyệt sẽ trả caret gì tại điểm chạm cuối,
   thay đổi DOM bên trong lớp chữ, cuộn trang và các hộp UI của Keepit (icon/tiện ích) hiện ra.
   Ghi vào bộ nhớ (tối đa 800 mục). Bấm nút "Log" ở góc dưới trái để xem và Copy. */
(() => {
  const CAP = 800;
  const PH = 'kd';                       // tiền tố id của UI chẩn đoán
  const log = [];
  let t0 = 0, lastPt = null, lastMoveAt = 0, lastSelAt = 0, lastScrollAt = 0, mutations = [], mutFlush = 0;
  const now = () => { if (!t0) t0 = performance.now(); return Math.round((performance.now() - t0) * 10) / 10; };
  const nameOf = el => {
    if (!el) return '';
    if (el.nodeType === 3) el = el.parentElement;
    if (!el) return '';
    const cl = typeof el.className === 'string' ? el.className.split(/\s+/).filter(Boolean).slice(0, 3).join('.') : '';
    return `${el.tagName || ''}${cl ? '.' + cl : ''}${el.id ? '#' + el.id : ''}`;
  };
  const push = (kind, data) => {
    log.push(Object.assign({ t: now(), k: kind }, data));
    if (log.length > CAP) log.splice(0, log.length - CAP);
    paintBadge();
  };
  const lineTops = () => {
    const tops = [];
    for (const span of document.querySelectorAll('#pageStack .docsSource .pdfTextLayer span')) {
      if (span.classList.contains('lhnLineFiller')) continue;
      const text = span.textContent;
      if (!text || !text.trim()) continue;
      const rect = span.getBoundingClientRect();
      if (rect.width < 2 || !rect.height) continue;
      tops.push(rect.top);
    }
    tops.sort((a, b) => a - b);
    const uniq = [];
    for (const value of tops) if (!uniq.length || value - uniq[uniq.length - 1] > 6) uniq.push(value);
    return uniq;
  };
  const lineOf = (tops, y) => {
    let best = -1, gap = Infinity;
    for (let i = 0; i < tops.length; i++) { const d = Math.abs(tops[i] + 6 - y); if (d < gap) { gap = d; best = i; } }
    return gap <= 14 ? best : -1;
  };
  const snapSel = (tops) => {
    const sel = getSelection();
    if (!sel) return { sel: 'none' };
    const out = { len: sel.toString().length, ranges: sel.rangeCount, collapsed: sel.isCollapsed };
    if (sel.rangeCount) {
      const range = sel.getRangeAt(0), rects = range.getClientRects();
      out.rects = rects.length;
      if (rects.length) {
        out.firstLine = lineOf(tops, rects[0].top);
        out.lastLine = lineOf(tops, rects[rects.length - 1].top);
      }
      out.anchor = `${nameOf(sel.anchorNode)}@${sel.anchorOffset}`;
      out.focus = `${nameOf(sel.focusNode)}@${sel.focusOffset}`;
      out.focusText = sel.focusNode?.nodeType === 3 ? (sel.focusNode.nodeValue || '').slice(0, 16) : '';
    }
    if (lastPt) {
      try {
        const caret = document.caretRangeFromPoint(lastPt.x, lastPt.y);
        out.caret = caret ? `${nameOf(caret.startContainer)}@${caret.startOffset}` : 'null';
        if (caret) {
          const rect = document.createRange();
          rect.setStart(caret.startContainer, caret.startOffset);
          rect.setEnd(caret.startContainer, caret.startOffset);
          const box = rect.getBoundingClientRect();
          out.caretLine = lineOf(tops, box.top);
        }
      } catch (error) { out.caret = 'err'; }
    }
    return out;
  };
  const flushMutations = () => {
    mutFlush = 0;
    if (!mutations.length) return;
    const counts = {};
    for (const item of mutations) counts[item] = (counts[item] || 0) + 1;
    mutations = [];
    push('dom', counts);
  };
  const onMutation = list => {
    for (const record of list) {
      const target = record.target;
      if (record.type === 'attributes') mutations.push(`${nameOf(target)}.${record.attributeName}`);
      else for (const node of record.addedNodes) {
        const el = node.nodeType === 1 ? node : null;
        if (el && (el.id || '').startsWith('lhn-')) push('ui+', nameOf(el));
        else if (el && /lhnLineFiller|lhnPdfHighlight|docsReader/.test(el.className || '')) mutations.push(`+${nameOf(el)}`);
        else if (record.target.closest?.('.pdfTextLayer')) mutations.push(`+node in ${nameOf(record.target)}`);
      }
    }
    if (!mutFlush) mutFlush = setTimeout(flushMutations, 120);
  };

  const touchPoint = event => event.touches?.[0] || event.changedTouches?.[0] || null;
  const onTouch = (event, kind) => {
    const point = touchPoint(event);
    if (point) lastPt = { x: point.clientX, y: point.clientY };
    if (kind === 'touchmove') {
      const stamp = performance.now();
      if (stamp - lastMoveAt < 40) return;
      lastMoveAt = stamp;
      push('touch', { kind, x: Math.round(lastPt?.x ?? -1), y: Math.round(lastPt?.y ?? -1), n: event.touches?.length ?? 0, cancel: event.cancelable, prevented: event.defaultPrevented });
      return;
    }
    push('touch', { kind, x: Math.round(lastPt?.x ?? -1), y: Math.round(lastPt?.y ?? -1), n: event.touches?.length ?? 0, cancel: event.cancelable, prevented: event.defaultPrevented });
  };

  function install() {
    if (!document.getElementById('viewer')) return false;
    for (const kind of ['touchstart', 'touchmove', 'touchend', 'touchcancel']) {
      document.addEventListener(kind, event => onTouch(event, kind), { capture: true, passive: true });
    }
    document.addEventListener('mousedown', event => { lastPt = { x: event.clientX, y: event.clientY }; push('mouse', { kind: 'down' }); }, true);
    document.addEventListener('mouseup', event => { lastPt = { x: event.clientX, y: event.clientY }; push('mouse', { kind: 'up' }); }, true);
    document.addEventListener('mousemove', event => {
      lastPt = { x: event.clientX, y: event.clientY };
      if (event.buttons) {
        const stamp = performance.now();
        if (stamp - lastMoveAt < 60) return;
        lastMoveAt = stamp;
        push('drag', { x: Math.round(event.clientX), y: Math.round(event.clientY) });
      }
    }, true);
    document.addEventListener('selectionchange', () => {
      const stamp = performance.now();
      if (stamp - lastSelAt < 25) return;
      lastSelAt = stamp;
      push('sel', snapSel(lineTops()));
    }, true);
    document.addEventListener('scroll', event => {
      const stamp = performance.now();
      if (stamp - lastScrollAt < 120) return;
      lastScrollAt = stamp;
      const stage = document.getElementById('stage');
      if (stage && (event.target === stage || event.target === document)) push('scroll', { top: Math.round(stage.scrollTop) });
    }, true);
    new MutationObserver(onMutation).observe(document.getElementById('pageStack') || document.body, {
      childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class']
    });
    buildUi();
    return true;
  }

  let btn = null, panel = null, area = null;
  function paintBadge() { if (btn) btn.textContent = `Log ${log.length}`; }
  function buildUi() {
    if (document.getElementById(`${PH}Btn`)) return;
    btn = document.createElement('button');
    btn.id = `${PH}Btn`;
    btn.type = 'button';
    btn.textContent = 'Log 0';
    btn.style.cssText = 'position:fixed;left:10px;bottom:64px;z-index:2147483000;padding:8px 12px;border-radius:999px;border:1px solid #6d4aff66;background:#1b1030ee;color:#e9e4ff;font:600 12px/1 system-ui,sans-serif;box-shadow:0 3px 12px #0006';
    btn.addEventListener('click', openPanel);
    document.body.append(btn);
  }
  function openPanel() {
    if (panel) { panel.remove(); panel = null; return; }
    panel = document.createElement('div');
    panel.id = `${PH}Panel`;
    panel.style.cssText = 'position:fixed;inset:8px;z-index:2147483001;display:flex;flex-direction:column;gap:8px;padding:10px;border-radius:14px;background:#140b26f7;border:1px solid #6d4aff88;color:#e9e4ff;font:12px/1.45 system-ui,sans-serif';
    const bar = document.createElement('div');
    bar.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;align-items:center';
    const mk = (label, handler, primary) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      b.style.cssText = `padding:10px 16px;border-radius:10px;border:1px solid #6d4aff88;background:${primary ? '#6d4aff' : '#241640'};color:#fff;font:600 13px/1 system-ui,sans-serif`;
      b.addEventListener('click', handler);
      return b;
    };
    const info = document.createElement('span');
    info.textContent = `${log.length} mục`;
    info.style.cssText = 'opacity:.7;margin-left:auto';
    area = document.createElement('textarea');
    area.readOnly = true;
    area.spellcheck = false;
    area.style.cssText = 'flex:1;width:100%;box-sizing:border-box;padding:8px;border-radius:10px;border:1px solid #6d4aff55;background:#0d0718;color:#d9d2ff;font:11px/1.5 ui-monospace,Menlo,monospace;white-space:pre;overflow:auto';
    area.value = dumpText();
    bar.append(
      mk('Copy', async () => {
        try { await navigator.clipboard.writeText(area.value); info.textContent = 'đã copy'; }
        catch { area.focus(); area.select(); document.execCommand('copy'); info.textContent = 'đã copy (dự phòng)'; }
      }, true),
      mk('Làm mới', () => { area.value = dumpText(); info.textContent = `${log.length} mục`; }),
      mk('Xoá', () => { log.length = 0; area.value = ''; paintBadge(); info.textContent = '0 mục'; }),
      mk('Đóng', () => { panel.remove(); panel = null; }),
      info
    );
    panel.append(bar, area);
    document.body.append(panel);
  }
  const dumpText = () => log.map(entry => JSON.stringify(entry)).join('\n');

  globalThis.__klog = { dump: () => log.slice(), text: dumpText, clear: () => { log.length = 0; paintBadge(); } };
  if (!install()) document.addEventListener('DOMContentLoaded', install, { once: true });
  else push('start', { ua: navigator.userAgent.slice(0, 90) });
})();
