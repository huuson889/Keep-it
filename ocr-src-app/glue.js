/* Keepit · lớp giao diện nối với engine thật (app.js).
   Không sửa engine: chỉ đọc trạng thái qua window.keepitHook + window.onKeepitState. */
import * as pdfjs from './fusor/pdf.min.mjs';
pdfjs.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('fusor/pdf.worker.min.mjs');

/* ===== BIẾN THỂ "GIỐNG APP": chạy bằng khung của Keepit =====
   4 id nối sang phần tử thật của khung đọc; 20 id khung demo bị tắt (không phần tử giả):
   tính năng nào cần chúng thì tự bỏ qua. Bản này là nguồn để sinh mã cho app,
   nên demo và app chạy cùng một logic. */
/* viết dạng ghép chuỗi để bộ sinh id (kp…) không đổi tên các id thật của Keepit */
const KP_ALIAS = { prev:'p'+'Prev', next:'p'+'Next', pageLabel:'p'+'Num', ofTotal:'p'+'Total',
  /* sau khi bộ sinh đổi tên, các id này thành kp… — vẫn phải trỏ về id thật của Keepit */
  'kpPPrev':'p'+'Prev', 'kpPNext':'p'+'Next', 'kpPNum':'p'+'Num', 'kpPTotal':'p'+'Total' };
const KP_OFF_KEYS = (['bannerAct','bannerClose','bannerNoAsk','vBulb','selectRegion','fileType',
  'filename','folder','version','empty','emptyOpen','moreBoxes','moreOcr','moreOcrHint','moreOpen',
  'moreResults','applyRegion','autoHint','loopGuard','ocrRegion','ocrScopePick','regionEditor','savePdf']);
const KP_OFF = { has: (id) => KP_OFF_KEYS.some(k => String(id).toLowerCase().endsWith(k.toLowerCase())) };
const kpRaw$ = (id) => document.getElementById(id);
const kpFake = (id) => { const d = document.createElement('div'); d.id = id; d.hidden = true; return d; };
const $ = (id) => KP_OFF.has(id) ? kpFake(id) : (kpRaw$(KP_ALIAS[id] || id) || kpFake(id));
const hook = () => window.keepitHook;
const VER = 'v' + chrome.runtime.getManifest().version;

/* ---------- tiện ích ---------- */
let toastT = 0;
function toast(msg){
  const t = $('toast'); if (!t) return;
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2800);
}
const waitFor = (fn, ms = 20000, step = 120) => new Promise(res => {
  const t0 = Date.now();
  const tick = () => {
    let v = false; try { v = fn(); } catch { v = false; }
    if (v) return res(true);
    if (Date.now() - t0 > ms) return res(false);
    setTimeout(tick, step);
  };
  tick();
});

/* ---------- sáng/tối ---------- */
try { if (localStorage.getItem('keepit-theme') === 'dark') document.documentElement.classList.add('dark'); } catch {}
$('vTheme').onclick = () => {
  const dark = document.documentElement.classList.toggle('dark');
  try { localStorage.setItem('keepit-theme', dark ? 'dark' : 'light'); } catch {}
};
$('version').textContent = VER;
$('ocrVer').textContent = VER;

/* ---------- mở tệp ---------- */
const pick = () => { if (!hook()?.isBusy()) $('file').click(); };
$('moreOpen').onclick = () => { closeMore(); pick(); };
$('emptyOpen').onclick = pick;
$('vBack').onclick = () => toast('Bản này mở tệp bằng “Mở tệp” — chưa nối thư viện');

const stage = $('stage');
['dragenter','dragover'].forEach(ev => stage.addEventListener(ev, e => {
  e.preventDefault(); stage.classList.add('dragover');
}));
['dragleave','drop'].forEach(ev => stage.addEventListener(ev, e => {
  e.preventDefault();
  if (ev === 'dragleave' && e.relatedTarget && stage.contains(e.relatedTarget)) return;
  stage.classList.remove('dragover');
}));
stage.addEventListener('drop', e => {
  const f = e.dataTransfer?.files?.[0]; if (!f) return;
  const dt = new DataTransfer(); dt.items.add(f);
  $('file').files = dt.files;
  $('file').dispatchEvent(new Event('change'));
});

/* ---------- dải trang (ảnh thu nhỏ thật) ---------- */
function markRail(cur){
  cur = cur || hook()?.getCurrent() || 1;
  [...$('rail').children].forEach(b => b.classList.toggle('on', Number(b.dataset.n) === cur));
}
async function buildRail(){
  const rail = $('rail'); rail.replaceChildren();
  const h = hook(); if (!h || !h.getTotal()) return;
  const total = h.getTotal(), doc = h.getDoc(), img = h.getImage();
  $('ofTotal').textContent = total;
  for (let n = 1; n <= total; n++){
    const b = document.createElement('button');
    b.dataset.n = n;
    const box = document.createElement('span'); box.className = 'mini-pg';
    const small = document.createElement('small'); small.textContent = n;
    b.append(box, small);
    b.onclick = () => hook()?.goTo(n);
    rail.append(b);
    try {
      let c = null;
      if (doc && doc === hook()?.getDoc()){
        const page = await doc.getPage(n);
        const v0 = page.getViewport({ scale: 1 });
        const v = page.getViewport({ scale: Math.min(220 / Math.max(v0.width, v0.height), 1) });
        c = document.createElement('canvas');
        c.width = Math.max(1, Math.ceil(v.width)); c.height = Math.max(1, Math.ceil(v.height));
        const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
        await page.render({ canvasContext: x, viewport: v }).promise; page.cleanup();
      } else if (img){
        const k = Math.min(220 / Math.max(img.width, img.height), 1);
        c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(img.width * k)); c.height = Math.max(1, Math.round(img.height * k));
        const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
        x.drawImage(img, 0, 0, c.width, c.height);
      }
      if (c){
        if (doc && doc !== hook()?.getDoc()) return;
        box.replaceChildren(c);
      } else box.textContent = 'SCAN';
    } catch { box.textContent = '—'; }
  }
  markRail();
}

/* ---------- trang có lớp chữ gốc? ---------- */
const textCache = new Map();
async function pageHasText(n){
  if (textCache.has(n)) return textCache.get(n);
  const doc = hook()?.getDoc();
  if (!doc) return false;
  try {
    const page = await doc.getPage(n);
    const tc = await page.getTextContent();
    const has = tc.items.some(i => typeof i.str === 'string' && i.str.trim().length > 0);
    textCache.set(n, has);
    return has;
  } catch { return false; }
}

$('file').addEventListener('change', async () => {
  const f = $('file').files?.[0]; if (!f) return;
  setNoticeFileKey(f);
  $('rail').replaceChildren();
  textCache.clear();
  runSeen = false; expectRun = false;
  $('ocrProg').classList.remove('show');
  $('paper').classList.remove('scanning');
  $('trPanel').classList.remove('open');
  $('fileType').textContent = (/pdf$/i.test(f.name) || f.type === 'application/pdf') ? 'PDF' : 'ẢNH';
  const ok = await waitFor(() => hook() && hook().getTotal() > 0, 40000);
  if (!ok) return toast('Không mở được tệp này');
  $('from').value = 1; $('to').value = hook().getTotal();
  await buildRail();
  await refreshPageHint();
  toast(`Đã mở ${hook().getTotal()} trang · bấm OCR để nhận dạng chữ`);
});

/* ---------- Thông báo "chưa có lớp chữ": thu gọn thành nút đèn như Foxit ---------- */
const NOTICE_KEY = 'keepit.ocrNoticeOff:';     // mỗi tệp một khoá riêng
let noticeFileKey = '', noticeCollapsed = false, noticeForcedOpen = false, noticeWasExpanded = false;

function noAskKey(){ return NOTICE_KEY + (noticeFileKey || 'unknown'); }
function noAskOn(){ try { return localStorage.getItem(noAskKey()) === '1'; } catch { return false; } }
/* hai bảng màu: mỗi lần popup hiện thì chọn ngẫu nhiên một trong hai */
function pickNoticeTheme(){
  const t = Math.random() < 0.5 ? 'amber' : 'violet';
  for (const el of [$('vBanner'), $('vBulb')]) if (el) el.dataset.nt = t;
}
const NOTICE_AUTO_HIDE = 10000;   // tự thu thành nút đèn sau 10s không tương tác
const NOTICE_NARROW = 640;        // vùng xem hẹp hơn mức này thì không bung popup
let noticeTimer = null, noticeNeeds = null;

function noticeNarrow(){ const st = $('stage'); return !!st && st.clientWidth > 0 && st.clientWidth < NOTICE_NARROW; }
function scheduleNoticeHide(){
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => {
    if ($('vBanner')?.classList.contains('show')){ noticeCollapsed = true; refreshNotice(noticeNeeds); }
  }, NOTICE_AUTO_HIDE);
}
function refreshNotice(needsOcr){
  const banner = $('vBanner'), bulb = $('vBulb');
  if (!banner || !bulb) return;
  if (needsOcr !== undefined) noticeNeeds = !!needsOcr;
  const needs = !!noticeNeeds;
  /* đang nhận dạng / đã có lớp chữ / vùng xem hẹp / đã tự thu → không bung popup */
  const expanded = needs && !noticeCollapsed && (noticeForcedOpen || !noAskOn()) && !noticeNarrow();
  if (expanded && !noticeWasExpanded) pickNoticeTheme();   // mỗi lần hiện là một trong 2 màu
  noticeWasExpanded = expanded;
  banner.classList.toggle('show', expanded);
  if (expanded) scheduleNoticeHide(); else clearTimeout(noticeTimer);
  bulb.hidden = !(needs && !expanded);   // còn việc phải làm nhưng đang thu gọn / không tự hiện
  if ($('bannerNoAsk')) $('bannerNoAsk').checked = noAskOn();
}
/* rê chuột vào popup thì hoãn tự thu; ra khỏi thì đếm lại */
function holdNotice(hold){
  if (hold) clearTimeout(noticeTimer);
  else if ($('vBanner')?.classList.contains('show')) scheduleNoticeHide();
}
function collapseNotice(){
  noticeCollapsed = true; noticeForcedOpen = false;
  refreshNotice(true);
}
/* bấm nút đèn: LUÔN mở popup, kể cả tệp này đã tick “Không hiện lại” */
function expandNotice(){
  noticeForcedOpen = true; noticeCollapsed = false;
  refreshNotice(true);
}
function setNoAsk(on){
  try { on ? localStorage.setItem(noAskKey(), '1') : localStorage.removeItem(noAskKey()); } catch {}
  noticeForcedOpen = false;
  if (on) noticeCollapsed = true;
  refreshNotice(true);
}
/* mở tệp khác: trạng thái thông báo tính lại theo tệp đó */
function setNoticeFileKey(f){
  noticeFileKey = f ? `${f.name}|${f.size}` : '';
  noticeCollapsed = false; noticeForcedOpen = false; noticeWasExpanded = false;
}

/* ---------- gợi ý theo trang ---------- */
async function refreshPageHint(){
  const h = hook(); if (!h || !h.getTotal()) return;
  const n = h.getCurrent(), total = h.getTotal();
  const has = await pageHasText(n);
  $('ocrSub').textContent = `Trang ${n} · ${has ? 'đã có lớp chữ gốc' : 'chưa có lớp chữ'}`;
  $('scopePage').textContent = `trang ${n}`;
  $('scopeAll').textContent = `${total} trang`;
  $('ofTotal').textContent = total;
  $('moreOcrHint').textContent = `trang ${n}`;
  refreshNotice(!has);
  const dot = $('vOcrDot');
  dot.style.background = has ? 'var(--green)' : 'var(--red)';
  $('pNum').value = n;
  $('moreOcrHint').textContent = has ? 'đã có lớp chữ' : `trang ${n}`;
}

/* ---------- trạng thái từ engine ---------- */
let wasBusy = false, runSeen = false, expectRun = false;
let stopSeq = 0;    // tăng mỗi lượt chạy mới (lớp UI); chặn mọi “buộc dừng” của lượt cũ
let stopHold = 0;   // trong khoảng này UI giữ "Đã dừng" (engine nhả muộn cũng không bật lại)
let stopRequested = false;  // người dùng bấm Dừng trong lượt này → lượt kết thúc KHÔNG được báo “xong”
function startRunUi(){
  runSeen = true;
  stopSeq++;                 // lượt mới
  stopHold = 0;              // bỏ cờ giữ “Đã dừng” của lượt trước
  stopRequested = false;
  const prog = $('ocrProg');
  prog.classList.add('show'); prog.classList.remove('done','stopped','error');
  $('progTitle').textContent = 'Đang nhận dạng chữ';
  $('pTitle').textContent = 'Đang chuẩn bị…';
  $('pClock').textContent = '0.0 giây';
  $('pLog').replaceChildren();
  $('pDone').classList.remove('show');
  $('pSum').textContent = '';              // không để dòng “Hoàn tất …” của lượt trước nằm lại
  $('pWarn').style.display = 'none';
  $('stop').hidden = false;
  $('pAgain').hidden = true;
  $('pRegion').hidden = true;
  $('pForce').hidden = true;
  /* KHÔNG bật hiệu ứng quét ở đây: còn hộp thoại xác nhận “Nhận dạng lại…” thì chưa quét.
     Hiệu ứng chỉ bật khi engine thật sự chạy (onKeepitState có busy=true). */
  lastMain = ''; lastSig = ''; followLast = 0;
}

/* dòng nhật ký trong thẻ (giữ 3 dòng, mới nhất lên trên) như v3.5 */
const LOG_SKIP = /^Tesseract đang nhận dạng: \d+%$/;
let lastMain = '';
function logLine(t){
  t = (t || '').trim();
  if (!t || LOG_SKIP.test(t)) return;
  const box = $('pLog');
  if (box.firstElementChild && box.firstElementChild.textContent === t) return;
  const d = document.createElement('div'); d.textContent = t;
  box.prepend(d);
  while (box.children.length > 3) box.lastElementChild.remove();
}

/* #status của engine dạng "… · 7.4 giây": tách thành dòng trạng thái + đồng hồ */
function splitStatus(){
  const raw = ($('status')?.textContent || '').trim();
  const m = raw.match(/(?:^|\s·\s)([\d.]+)\s*giây\b/);
  if (!m) return { main: raw, clock: '' };
  const clock = `${m[1]} giây`;
  let main = (raw.slice(0, m.index) + ' ' + raw.slice(m.index + m[0].length)).trim();
  main = main.replace(/\s*·\s*$/, '').replace(/^[·\s]+/, '')
             .replace(/\s+([.,;])/g, '$1').replace(/\s{2,}/g, ' ').trim();
  return { main, clock };
}
function syncCard(){
  const { main, clock } = splitStatus();
  if (main && main !== lastMain){ lastMain = main; logLine(main); }
  if (main) $('pTitle').textContent = main;
  if (clock) $('pClock').textContent = clock;
  followRunPage(main);
}

/* Trang đang được nhận dạng thì khung xem nhảy tới trang đó (thấy hiệu ứng quét ngay) */
let followLast = 0;
function followRunPage(main){
  if (!hook()?.isBusy()) return;
  const m = (main || $('pTitle').textContent || '').match(/Trang\s+(\d+)\s*\//);
  if (!m) return;
  const n = Number(m[1]);
  if (!n || n === followLast) return;
  followLast = n;
  if (n !== hook().getCurrent()) hook().goTo(n, true);
  markRail(n);
}
const progEl = $('progress');
new MutationObserver(() => { if (!progEl.hidden && expectRun) startRunUi(); })
  .observe(progEl, { attributes: true, attributeFilter: ['hidden'] });

/* Bọc lại handler của engine để biết chắc lượt chạy này do người dùng bấm */
const engineRun = $('run').onclick;
$('run').onclick = ev => {
  /* kiểm tra như v3.5: thiếu ngôn ngữ thì báo, không đóng hộp thoại */
  if (currentMode() === 'tess' && !document.querySelector('.lang:checked'))
    return toast('Chọn ít nhất một ngôn ngữ');
  if (!total()) return toast('Mở tệp trước đã');

  expectRun = true;
  $('trPanel').classList.add('open');   // hiện thanh văn bản nhận dạng ngay khi bắt đầu
  $('ocrBody').scrollTop = 0;
  $('progress').value = 0;

  /* nhảy ngay tới trang đầu tiên sẽ nhận dạng (engine xử lý từ trang này) */
  const sc = $('scope').value;
  const firstTarget = sc === 'current' ? (hook()?.getCurrent?.() || 1)
    : sc === 'range' ? Math.max(1, Number($('from').value) || 1) : 1;
  followLast = firstTarget;

  /* (1) đóng hộp thoại + HIỆN THẺ TIẾN ĐỘ ngay trong nhịp bấm */
  closeOcr(true);
  startRunUi();
  $('progPage').textContent = `Trang ${hook()?.getCurrent?.() || 1}/${total()}`;
  $('progClose').disabled = true;
  /* (2) TẮT POPUP CHỌN VÙNG ngay trong nhịp bấm */
  killRegionNow();

  /* (3) nhường 1 khung hình cho thẻ vẽ xong rồi mới nhảy trang + chạy engine */
  const bootT0 = Date.now();
  const boot = () => {
  /* Vừa bấm Dừng: engine còn nhả lượt cũ vài chục ms. Gọi engine lúc nó còn busy thì app bỏ qua
     lệnh chạy (nút Run đang disable) → đợi rảnh rồi chạy, tối đa 2 giây. */
  if (hook()?.isBusy()){
    if (Date.now() - bootT0 < 2000){ setTimeout(boot, 40); return; }
    toast('Engine chưa nhả lượt trước — thử lại sau 1 giây'); return;
  }
  if (firstTarget !== hook()?.getCurrent()) hook()?.goTo?.(firstTarget, true);
  markRail(firstTarget);

  if (engineRun) engineRun(ev);

  /* engine không chạy (vd. trang đã có lớp chữ) → trả hộp thoại lại như v3.5 */
  if (!hook()?.isBusy()){
    runSeen = false; expectRun = false;
    $('ocrProg').classList.remove('show');
    $('paper').classList.remove('scanning');
    $('progClose').disabled = false;
    $('pAgain').hidden = false;
    $('ocrModal').classList.add('show'); $('ocrScrim').classList.add('show');
    snapshotOcr();                      // mở lại hộp thoại thì lấy mốc mới cho ✕/Hủy
  }
  };   // hết boot()

  /* chờ trình duyệt vẽ xong thẻ tiến độ rồi mới nhảy trang + chạy engine */
  if (window.requestAnimationFrame) requestAnimationFrame(() => setTimeout(boot, 0));
  else setTimeout(boot, 0);
};
const engineRegionRun = $('ocrRegion').onclick;
let regionRun = false;   // đang/đã chạy nhận dạng vùng → không hiện thẻ “Đã nhận dạng xong”
$('ocrRegion').onclick = ev => { expectRun = true; regionRun = true; if (engineRegionRun) engineRegionRun(ev); };

let statePage = 0;
window.onKeepitState = st => {
  /* vừa bấm Dừng: giữ nguyên UI "Đã dừng", không để state nhả muộn bật lại thẻ đang chạy */
  if (stopHold && Date.now() < stopHold){
    wasBusy = false;
    $('paper').classList.remove('scanning');
    const pg = $('ocrProg');
    pg.classList.add('show'); pg.classList.remove('done'); pg.classList.add('stopped');
    $('progTitle').textContent = 'Đã dừng nhận dạng';
    $('progPage').textContent = st.has ? `Trang ${st.current}/${st.total}` : 'Trang —/—';
    markRail(st.current);
    return;
  }
  const done = wasBusy && !st.busy;
  wasBusy = !!st.busy;
  if (!st.busy){ $('paper').classList.remove('scanning'); if (!runSeen) expectRun = false; }

  if (st.current !== statePage){ statePage = st.current; clearHoverHighlight(); resetTextApply(); }
  markRail(st.current);
  if (st.busy && expectRun && !runSeen) startRunUi();
  /* Engine đang chạy mà thẻ còn tiêu đề “Đã nhận dạng xong / Đã dừng” của lượt trước
     → đưa thẻ về trạng thái đang chạy (tránh tiêu đề xanh mà dòng dưới vẫn “đang nhận dạng…”). */
  if (st.busy && !stopRequested){
    const pg0 = $('ocrProg');
    if (pg0.classList.contains('done') || pg0.classList.contains('stopped') || pg0.classList.contains('error')) startRunUi();
  }
  if (st.busy) $('paper').classList.add('scanning');   // quét thật sự bắt đầu
  if (st.busy) syncCard();
  if (st.busy && runSeen) $('ocrProg').classList.add('show');
  $('progPage').textContent = st.has ? `Trang ${st.current}/${st.total}` : 'Trang —/—';
  if (st.has) { $('pNum').max = st.total; $('ofTotal').textContent = st.total; }

  if (done && runSeen){
    runSeen = false; expectRun = false; followLast = 0; resetTextApply();
    /* nhận dạng vùng: chỉ cập nhật bảng Bổ sung vùng, KHÔNG bật thẻ “Đã nhận dạng xong” */
    if (regionRun){
      regionRun = false;
      $('ocrProg').classList.remove('show');
      $('ocrProg').classList.remove('done', 'stopped');
      $('progClose').disabled = false;
      $('stop').hidden = true;
      $('paper').classList.remove('scanning');
      syncCard();
      return;
    }
    $('progClose').disabled = false;
    const r = hook()?.getResults?.().get?.(st.current);
    /* có dòng “Không hoàn tất: …” (hoặc Lỗi) trong trạng thái/nhật ký → lượt này KHÔNG thành công */
    const errText = (($('status')?.textContent || '') + ' ' + ($('pTitle')?.textContent || '')).trim();
    const hadError = /Không hoàn tất|Lỗi/i.test(errText);
    /* đã bấm Dừng (hoặc trạng thái engine ghi “Đã dừng”) ⇒ lượt này là DỪNG, không phải xong */
    const stoppedByUser = stopRequested || /Đã dừng|Đã buộc dừng/.test(errText);
    stopRequested = false;
    const ok = !!r && !hadError && !stoppedByUser;
    syncCard();
    const prog = $('ocrProg');
    prog.classList.toggle('done', ok);
    prog.classList.toggle('error', !ok && hadError);
    prog.classList.toggle('stopped', !ok && !hadError);
    $('progTitle').textContent = ok ? 'Đã nhận dạng xong'
      : hadError ? 'Nhận dạng chưa hoàn tất' : 'Đã dừng nhận dạng';
    $('stop').hidden = true;
    $('pAgain').hidden = false;
    $('pRegion').hidden = false;
    $('pForce').hidden = true;

    const { clock } = splitStatus();
    const sc = $('scope').value;
    const nTotal = hook()?.getTotal?.() || 1;
    const targets = sc === 'current' ? 1 : sc === 'range'
      ? Math.max(1, (Number($('to').value) || nTotal) - (Number($('from').value) || 1) + 1)
      : nTotal;
    const doneN = ok ? targets : Math.min(targets, hook()?.getResults?.().size || 0);
    const sumWord = ok ? 'Hoàn tất' : (hadError ? 'Chưa hoàn tất' : 'Đã dừng');
    $('pSum').innerHTML = `${sumWord} <b>${ok ? targets : doneN}/${targets} trang</b>${clock ? ` · ${clock}` : ''}`;
    if (ok){ $('pWarn').style.display = 'none'; }
    else {
      $('pWarn').style.display = '';
      $('pWarn').textContent = hadError
        ? 'Lượt này dừng vì lỗi — kết quả có thể thiếu. Xem chi tiết ở nhật ký bên dưới, rồi bấm “Nhận dạng lại”.'
        : 'Kết quả có thể thiếu vì đã dừng giữa lượt. Các trang chưa chạy vẫn ở trạng thái ảnh quét.';
    }
    $('pDone').classList.add('show');
    if (r){ $('trPanel').classList.add('open'); }
    const st2 = ($('status')?.textContent || '').trim();
    const isErr = /không|lỗi|không mở|không nhận|không xuất/i.test(st2) && !r;
    toast(r ? 'Xong · kéo chuột trên trang để chọn chữ'
            : isErr ? st2.slice(0, 140) : 'Đã dừng nhận dạng');
  }
  const rng = $('scope').value === 'range';
  $('from').disabled = $('to').disabled = !rng || !!st.busy;
  $('btnFrom').disabled = $('btnTo').disabled = !rng || !!st.busy;
  $('wrapFrom').classList.toggle('disabled', !rng || !!st.busy);
  $('wrapTo').classList.toggle('disabled', !rng || !!st.busy);
};

/* ---------- hộp thoại OCR ---------- */
const modal = $('ocrModal'), scrim = $('ocrScrim');
function currentMode(){ return $('ocrModes').querySelector('input:checked')?.value || 'tess'; }
function syncModeRadios(){
  const m = currentMode();
  [...$('ocrModes').children].forEach(l => l.classList.toggle('on', !!l.querySelector('input')?.checked));
  $('methodHint').textContent = m === 'pp'
    ? 'Nhanh: PP-OCR đọc cả trang một lượt, chạy trong worker nền nên giao diện vẫn bấm được và Dừng ăn ngay. Lần đầu phải nạp model ~32 MB (10–30 giây); thiếu nhiều dấu tiếng Việt.'
    : m === 'fusor'
      ? 'Viết tay: dùng Fusor — phải bấm “Chọn thư mục model” (~831 MB) xong mới bấm được Nhận dạng chữ; chạy chậm hơn hẳn.'
      : 'Chữ in: đọc thẳng cả trang một lượt, nhanh nhất với tài liệu in rõ.';
  [...$('ocrModal').querySelectorAll('[data-for]')].forEach(el => {
    el.classList.toggle('off', el.dataset.for !== m);
  });
}

/* Mỗi lần mở hộp thoại đều trả về đúng trạng thái như lần đầu */
function resetDialog(){
  closePageMenus();
  $('ocrBody').scrollTop = 0;
  $('ocrProg').classList.remove('show');     // thẻ tiến độ không đè lên hộp thoại
  renderLangs($('langSearch').value);
  $('langBox').scrollTop = 0;
  const picked = LANGS.filter(x => x.on).map(x => x.n);
  $('langSummary').textContent = picked.length ? picked.join(' + ') : 'chưa chọn';
  syncScopeRadios();
  syncModeRadios();
  $('ofTotal').textContent = total();
  $('from').max = $('to').max = total();
  clampPages(true);
  $('run').disabled = !hook()?.getTotal() || !!hook()?.isBusy();
}

function openOcr(){
  collapseNotice();   // bấm OCR là thu gợi ý thành bóng đèn
  if (!hook()?.getTotal()) return toast('Mở tệp trước đã');
  if (hook().isBusy() && !stalled) return toast('Đang nhận dạng, đợi lượt này xong');
  $('trPanel').classList.add('open');   // mở sidebar văn bản nhận dạng bên phải
  syncLayerBoxes();
  resetDialog(); refreshPageHint();
  snapshotOcr();                        // mốc để Hủy/✕ quay về
  modal.classList.add('show'); scrim.classList.add('show');
}
/* Ảnh chụp trạng thái hộp thoại lúc mở — Hủy/✕ phải trả lại ĐÚNG như lúc mở */
let ocrSnap = null;
function snapshotOcr(){
  const fields = {};
  $('ocrModal').querySelectorAll('input,select,textarea').forEach(el => {
    if (el.type === 'radio'){ if (el.checked) fields['r:' + el.name] = el.value; return; }
    if (!el.id) return;
    fields[el.id] = el.type === 'checkbox' ? el.checked : el.value;
  });
  ocrSnap = { fields, langs: LANGS.map(l => l.on), search: $('langSearch').value };
}
function restoreOcr(){
  if (!ocrSnap) return;
  const { fields, langs, search } = ocrSnap; ocrSnap = null;
  LANGS.forEach((l, i) => { l.on = !!langs[i]; });
  $('langSearch').value = search || '';
  Object.keys(fields).forEach(k => {
    if (k.startsWith('r:')){
      const name = k.slice(2);
      const r = $('ocrModal').querySelector(`input[name="${name}"][value="${fields[k]}"]`);
      if (r) r.checked = true;
      return;
    }
    const el = $(k); if (!el) return;
    if (el.type === 'checkbox') el.checked = !!fields[k]; else el.value = fields[k];
  });
  renderLangs($('langSearch').value);
  syncScopeRadios(); syncModeRadios();
  $('ofTotal').textContent = total();
  $('from').max = $('to').max = total();
  clampPages(true);
  $('scope').dispatchEvent(new Event('change'));      // app.js ẩn/hiện hàng khoảng trang
  $('optBoxes').dispatchEvent(new Event('change'));   // vẽ lại lớp khung theo lựa chọn cũ
  $('ocrModes').querySelector('input:checked')?.dispatchEvent(new Event('change', { bubbles: true }));
  const picked = LANGS.filter(x => x.on).map(x => x.n);
  $('langSummary').textContent = picked.length ? picked.join(' + ') : 'chưa chọn';
  if (typeof refreshPageHint === 'function') refreshPageHint();
  syncLayerBoxes();
  $('run').disabled = !hook()?.getTotal() || !!hook()?.isBusy();
}
/* Tắt chế độ chọn vùng NGAY LẬP TỨC: ẩn hộp + lớp chọn + khung đỏ trong cùng một nhịp,
   phần dọn sâu của app.js (xoá chữ, vẽ lại lớp khung) chạy ở nhịp sau để không chặn vẽ thẻ tiến độ */
function killRegionNow(){
  if ($('regionEditor').hidden && $('regionSurface').hidden) return false;
  progWasShown = false;
  $('regionEditor').hidden = true;
  $('regionSurface').hidden = true;
  $('cancelRegion').hidden = true;
  $('selectRegion').hidden = false;
  $('regionRect').style.display = 'none';
  setTimeout(() => { try { $('cancelRegion').click(); } catch {} }, 0);
  return true;
}

function closeOcr(commit){
  if (commit) ocrSnap = null; else restoreOcr();   // không bấm Nhận dạng chữ thì bỏ mọi thay đổi
  modal.classList.remove('show'); scrim.classList.remove('show'); closePageMenus();
}
$('vOcr').onclick = openOcr;
$('moreOcr').onclick = () => { closeMore(); openOcr(); };
$('pAgain').onclick = openOcr;
let regionBoxPrev = null;
function forceRegionBoxes(on){
  if (on){
    if (regionBoxPrev === null) regionBoxPrev = $('optBoxes').checked;
    if (!$('optBoxes').checked){ $('optBoxes').checked = true; $('optBoxes').dispatchEvent(new Event('change')); }
  } else if (regionBoxPrev !== null){
    const back = regionBoxPrev; regionBoxPrev = null;
    if ($('optBoxes').checked !== back){ $('optBoxes').checked = back; $('optBoxes').dispatchEvent(new Event('change')); }
  }
}
let progWasShown = false;   // popup tiến độ có đang hiện trước khi mở Bổ sung vùng không
function syncRegionButtons(){
  const hasText = !!String($('regionText')?.value || '').trim();
  /* kiểu nút chính do CSS (:has + :placeholder-shown) quyết định theo đúng nội dung ô;
     ở đây chỉ chặn bấm khi ô trống */
  if ($('applyRegion')) $('applyRegion').disabled = !hasText;
  $('ocrRegion')?.classList.remove('primary');   // không dùng class nữa, tránh lệch trạng thái
}
function startRegionMode(){
  collapseNotice();   // bấm Chọn vùng là thu gợi ý thành bóng đèn
  progWasShown = $('ocrProg')?.classList.contains('show') || false;
  $('ocrProg').classList.remove('show');
  $('trPanel').classList.add('open');    // giữ thanh văn bản nhận dạng để xem chữ đã có
  if (!(hook()?.getTotal?.() > 0)) { toast('Mở tệp trước khi sửa vùng'); return; }
  if (hook()?.isBusy?.()) { toast('Đang nhận dạng — đợi xong rồi sửa vùng'); return; }
  forceRegionBoxes(true);   // hiện hết khung đã nhận dạng để biết chọn chỗ nào
  $('selectRegion').click();
  $('regionSurface').hidden = false;        // chắc chắn vào chế độ chọn vùng
  $('regionEditor').hidden = false;         // hiện bảng ngay để còn Hủy chọn / Đóng
  $('cancelRegion').hidden = false;
  $('selectRegion').hidden = true;
  toast('Kéo trên trang để chọn vùng — chọn được nhiều vùng liền nhau');
}
$('pRegion').onclick = startRegionMode;
/* gõ chữ trong ô → đổi nút chính ngay */
window.__keepitSyncRegion = syncRegionButtons;
$('regionText').addEventListener('input', syncRegionButtons);
$('regionText').addEventListener('change', syncRegionButtons);
/* đóng bảng Bổ sung vùng → nếu trước đó có popup tiến độ thì hiện lại */
new MutationObserver(() => {
  if ($('regionEditor').hidden){
    syncRegionButtons();
    if (progWasShown){ progWasShown = false; $('ocrProg')?.classList.add('show'); }
  } else syncRegionButtons();
}).observe($('regionEditor'), { attributes: true, attributeFilter: ['hidden'] });
syncRegionButtons();
$('trRegion').onclick = startRegionMode;
/* ra khỏi chế độ sửa vùng (Đóng / Hủy chọn / Áp dụng / Esc) thì trả lại trạng thái ô khung vùng */
document.addEventListener('click', e => {
  if (e.target?.closest?.('#cancelRegion,#applyRegion')) forceRegionBoxes(false);
});
$('ocrClose').onclick = () => closeOcr();
$('ocrCancel').onclick = () => closeOcr();
/* bấm ra ngoài = đóng và GIỮ thay đổi (đúng như 2.9.7.4); chỉ ✕ và Hủy mới bỏ thay đổi */
scrim.onclick = () => closeOcr(true);

/* phạm vi trang */
function syncScopeRadios(){
  const v = $('scope').value;
  [...$('ocrScopePick').querySelectorAll('input[name="scopePick"]')].forEach(r => {
    r.checked = r.value === v;
    r.closest('label').classList.toggle('on', r.checked);
  });
  const busy = !!hook()?.isBusy();
  [ $('from'), $('to') ].forEach(inp => inp.disabled = (v !== 'range') || busy);
  [ $('btnFrom'), $('btnTo') ].forEach(b => b.disabled = (v !== 'range') || busy);
  $('wrapFrom').classList.toggle('disabled', (v !== 'range') || busy);
  $('wrapTo').classList.toggle('disabled', (v !== 'range') || busy);
}
$('ocrScopePick').addEventListener('change', e => {
  const r = e.target.closest('input[name="scopePick"]'); if (!r) return;
  $('scope').value = r.value;
  $('scope').dispatchEvent(new Event('change'));   // app.js lo ẩn/hiện #rangeBox
  syncScopeRadios();
});

/* danh sách trang trong ô ▾ */
const total = () => hook()?.getTotal() || 1;
function closePageMenus(){
  ['menuFrom','menuTo'].forEach(id => { $(id).style.display = 'none'; $(id).replaceChildren(); });
}
function openPageMenu(which){
  const from = which === 'from';
  const input = from ? $('from') : $('to');
  const menu = from ? $('menuFrom') : $('menuTo');
  closePageMenus();
  const n = total();
  for (let i = 1; i <= n; i++){
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = i;
    if (i === Number(input.value)) b.classList.add('on');
    b.onclick = ev => {
      ev.stopPropagation();
      input.value = i;
      clampPages(from);
      closePageMenus();
    };
    menu.append(b);
  }
  menu.style.display = 'flex';
}
function clampPages(fromChanged){
  const n = total();
  let a = Number($('from').value) || 1, b = Number($('to').value) || 1;
  a = Math.min(Math.max(1, a), n); b = Math.min(Math.max(1, b), n);
  if (fromChanged && a > b) b = a;
  if (!fromChanged && b < a) a = b;
  $('from').value = a; $('to').value = b;
}
$('btnFrom').onclick = e => { e.stopPropagation(); openPageMenu('from'); };
$('btnTo').onclick = e => { e.stopPropagation(); openPageMenu('to'); };
/* Cho phép xoá trống rồi gõ số mới: chỉ chuẩn hoá khi ô có số; bỏ trống thì khôi phục khi rời ô */
[['from', true], ['to', false]].forEach(([id, from]) => {
  const el = $(id);
  el.addEventListener('input', () => { if (!String(el.value).trim()) return; clampPages(from); });
  el.addEventListener('blur', () => {
    const n = total() || 1;
    if (!String(el.value).trim() || !Number.isFinite(Number(el.value))) el.value = from ? 1 : n;
    clampPages(from);
  });
  el.addEventListener('keydown', e => { if (e.key === 'Enter'){ el.blur(); } });
});
$('wrapFrom').addEventListener('pointerdown', e => {
  if (e.target.closest('.pgBtn') || e.target.tagName === 'INPUT') return;
  if ($('btnFrom').disabled) return;
  const r = $('ocrScopePick').querySelector('input[name="scopePick"][value="range"]');
  r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true }));
  $('from').focus();
});
$('wrapTo').addEventListener('pointerdown', e => {
  if (e.target.closest('.pgBtn') || e.target.tagName === 'INPUT') return;
  if ($('btnTo').disabled) return;
  const r = $('ocrScopePick').querySelector('input[name="scopePick"][value="range"]');
  r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true }));
  $('to').focus();
});
$('ocrModal').addEventListener('pointerdown', e => { if (!e.target.closest('.pgWrap')) closePageMenus(); });
$('from').addEventListener('keydown', closePageMenus);
$('to').addEventListener('keydown', closePageMenus);

/* ngôn ngữ: máy có 3 gói Tesseract */
const LANGS = [
  { c: 'eng', n: 'Anh', native: 'English', on: true },
  { c: 'vie', n: 'Việt', native: 'Tiếng Việt', on: true },
  { c: 'kor', n: 'Hàn', native: '한국어', on: false }
];
function renderLangs(filter = ''){
  const box = $('langBox'); box.replaceChildren();
  const q = filter.trim().toLowerCase();
  LANGS.filter(l => !q || l.n.toLowerCase().includes(q) || l.native.toLowerCase().includes(q) || l.c.includes(q))
    .forEach(l => {
      const lab = document.createElement('label');
      lab.className = 'kpick' + (l.on ? ' on' : '');
      lab.innerHTML = `<input type="checkbox" class="lang" value="${l.c}"${l.on ? ' checked' : ''}><span>${l.n}<small>${l.native}</small></span>`;
      lab.querySelector('input').addEventListener('change', ev => {
        l.on = ev.target.checked;
        lab.classList.toggle('on', l.on);
        const picked = LANGS.filter(x => x.on).map(x => x.n);
        $('langSummary').textContent = picked.length ? picked.join(' + ') : 'chưa chọn';
      });
      box.append(lab);
    });
  if (!box.children.length){ const p = document.createElement('div'); p.className = 'kpick'; p.textContent = 'Không có ngôn ngữ này'; box.append(p); }
}
$('langSearch').addEventListener('input', e => renderLangs(e.target.value));
$('langSearch').addEventListener('focus', () => $('langSearch').select());
renderLangs();

/* ---------- Trỏ vào dòng chữ ở bảng kết quả → tô sáng khối tương ứng trên trang ---------- */
const normText = t => (t || '').replace(/\s+/g, ' ').trim().toLowerCase();

/* Dòng logic thứ n của văn bản ↔ danh sách khung chữ của trang */
function boxesForLine(text, boxes, lineIdx, ratio){
  const lines = String(text || '').split('\n');
  if (lineIdx < 0 || lineIdx >= lines.length || !boxes?.length) return [];
  const target = normText(lines[lineIdx]);
  if (!target) return [];
  const direct = boxes.filter(b => normText(b.text) === target);
  if (direct.length) return direct;
  const part = boxes.filter(b => normText(b.text).includes(target));
  if (part.length) return part;
  /* không khớp chữ: lấy mọi khung nằm cùng băng ngang với con trỏ (giống Paddle tô cả dòng) */
  if (typeof ratio === 'number'){
    const band = boxes.filter(b => {
      const r = b.rect || [];
      const cy = (r[1] + r[3]) / 2;
      return Math.abs(cy - ratio) <= 0.045;
    });
    if (band.length) return band;
    const nearest = boxes.reduce((best, b) => {
      const r = b.rect || [];
      return Math.abs((r[1] + r[3]) / 2 - ratio) < Math.abs((best.rect[1] + best.rect[3]) / 2 - ratio) ? b : best;
    }, boxes[0]);
    return [nearest];
  }
  /* ghép dồn: cộng dồn độ dài chữ của từng khung để biết dòng rơi vào khung nào */
  let head = 0;
  for (let i = 0; i < lineIdx; i++) head += String(lines[i] || '').length + 1;
  const mid = head + Math.floor(target.length / 2);
  let acc = 0;
  for (const b of boxes){
    const len = String(b.text || '').length;
    if (mid >= acc && mid < acc + len + 1) return [b];
    acc += len + 1;
  }
  const k = Math.min(boxes.length - 1, Math.round((lineIdx / Math.max(1, lines.length - 1)) * (boxes.length - 1)));
  return [boxes[k]];
}

function lineTopOf(ta, lineIdx){
  const mirror = mirrorOf(ta);
  const cs = getComputedStyle(ta);
  mirror.style.width = Math.max(20, ta.clientWidth) + 'px';
  const parts = (ta.value || '').split('\n');
  mirror.textContent = parts.slice(0, lineIdx).join('\n') + (lineIdx > 0 ? '\n' : '');
  const padTop = parseFloat(cs.paddingTop) || 0, padB = parseFloat(cs.paddingBottom) || 0;
  const lh = parseFloat(cs.lineHeight) || (parseFloat(cs.fontSize) || 13) * 1.5;
  return { top: Math.max(0, mirror.scrollHeight - padTop - padB), lh, padTop, padB, cs };
}
function contentHeight(ta){
  const mirror = mirrorOf(ta);
  const cs = getComputedStyle(ta);
  mirror.style.width = Math.max(20, ta.clientWidth) + 'px';
  mirror.textContent = ta.value || '';
  const padTop = parseFloat(cs.paddingTop) || 0, padB = parseFloat(cs.paddingBottom) || 0;
  return Math.max(1, mirror.scrollHeight - padTop - padB);
}
/* Chọn khung theo ĐỘ CAO con trỏ — luôn bám con trỏ, không phụ thuộc việc khớp chữ */
function boxesAtRatio(boxes, ratio, half){
  if (!boxes?.length) return [];
  const band = boxes.filter(b => {
    const r = b.rect || [];
    if (!(r.length === 4)) return false;
    const cy = (r[1] + r[3]) / 2;
    return Math.abs(cy - ratio) <= half;
  });
  if (band.length) return band;
  return [boxes.reduce((best, b) => {
    const r = b.rect || [], br = best.rect || [];
    return Math.abs((r[1] + r[3]) / 2 - ratio) < Math.abs((br[1] + br[3]) / 2 - ratio) ? b : best;
  }, boxes[0])];
}
/* Gom các khung chữ thành TỪNG DÒNG trên trang.
   Bỏ khung "dị thường" (cao gấp >3.5 lần trung vị) — Tesseract đôi khi trả khung phủ cả tranh,
   nếu giữ lại thì tô sáng sẽ phủ cả khoanh tranh thay vì đúng dòng chữ. */
function medianOf(arr){
  if (!arr.length) return 0;
  const a = arr.slice().sort((p, q) => p - q);
  return a[Math.floor(a.length / 2)];
}
function clustersOf(boxes){
  const raw = [];
  (boxes || []).forEach((b, i) => {
    const r = b?.rect || [];
    if (r.length !== 4) return;
    const h = r[3] - r[1];
    if (!(h > 0) || r[2] <= r[0]) return;
    raw.push({ i, x0: r[0], y0: r[1], x1: r[2], y1: r[3], h, cy: (r[1] + r[3]) / 2 });
  });
  const limit = medianOf(raw.map(o => o.h)) * 3.5;   // khung quá cao so với mặt bằng → loại
  const items = raw.filter(o => o.h <= Math.max(limit, 0.001));
  items.sort((p, q) => p.cy - q.cy);
  const out = [];
  for (const it of items){
    let target = null;
    for (let k = out.length - 1; k >= 0 && k >= out.length - 3; k--){   // chỉ so với 3 cụm cuối
      const g = out[k];
      const ov = Math.min(it.y1, g.y1) - Math.max(it.y0, g.y0);
      if (ov >= Math.min(it.h, g.y1 - g.y0) * 0.5){ target = g; break; }
    }
    if (target){
      target.items.push(it.i);
      target.y0 = Math.min(target.y0, it.y0); target.y1 = Math.max(target.y1, it.y1);
      target.x0 = Math.min(target.x0, it.x0); target.x1 = Math.max(target.x1, it.x1);
      target.cy = (target.y0 + target.y1) / 2;
    } else {
      out.push({ items: [it.i], x0: it.x0, y0: it.y0, x1: it.x1, y1: it.y1, cy: it.cy });
    }
  }
  return out;
}
/* Dòng thứ L trong bảng ↔ cụm khung trên trang (khớp theo số dòng, số chữ, rồi tỉ lệ) */
function clusterForLine(lines, clusters, lineIdx, ratio){
  if (!clusters?.length) return null;
  if (lineIdx < 0 || lineIdx >= lines.length) lineIdx = Math.max(0, Math.min(lines.length - 1, lineIdx));
  /* a) một khung/dòng (PP-OCR, Fusor, Tesseract 1 dòng) → đúng chỉ số */
  if (clusters.length === lines.length) return clusters[lineIdx];
  /* b) khớp theo số chữ tích luỹ (Tesseract trả về từ) */
  const wc = lines.map(l => { const t = String(l).trim(); return t ? t.split(/\s+/).length : 0; });
  const totalW = wc.reduce((a, b) => a + b, 0), totalC = clusters.reduce((a, c) => a + c.items.length, 0);
  if (totalW && Math.abs(totalW - totalC) <= Math.max(2, totalC * 0.15)){
    let target = 0;
    for (let k = 0; k <= lineIdx; k++) target += wc[k];
    let acc = 0;
    for (const c of clusters){ acc += c.items.length; if (target <= acc) return c; }
    return clusters[clusters.length - 1];
  }
  /* c) không khớp được chữ → gần nhất theo tỉ lệ dọc */
  let best = clusters[0], bd = 9;
  for (const c of clusters){ const d = Math.abs(c.cy - ratio); if (d < bd){ bd = d; best = c; } }
  return best;
}
function boxesOfCluster(cluster, boxes){ return cluster ? cluster.items.map(i => boxes[i]).filter(Boolean) : []; }

/* Khung chữ thứ i trên trang ↔ dòng chữ trong bảng */
function lineForBox(text, boxes, i){
  const lines = String(text || '').split('\n');
  const target = normText(boxes?.[i]?.text);
  if (target){
    for (let li = 0; li < lines.length; li++) if (normText(lines[li]) === target) return li;
  }
  let acc = 0;
  for (let k = 0; k < i; k++) acc += String(boxes[k]?.text || '').length + 1;
  const src = String(text || '');
  let li = 0;
  for (let c = 0; c < Math.min(acc, src.length); c++) if (src[c] === '\n') li++;
  return li;
}
function clearHoverHighlight(){
  const hl = $('hl'); if (hl) hl.replaceChildren();
  const line = $('trHover'); if (line) line.hidden = true;
}
function paintLineHover(ta, lineIdx){
  const box = $('trHover');
  if (!box || lineIdx < 0 || !ta.value){ if (box) box.hidden = true; return; }
  const { top: lineTop, lh, padTop } = lineTopOf(ta, lineIdx);
  const rect = ta.getBoundingClientRect();
  const host = ta.parentElement.getBoundingClientRect();
  Object.assign(box.style, {
    left: (rect.left - host.left + 4) + 'px',
    width: (rect.width - 8) + 'px',
    top: (rect.top - host.top + padTop - ta.scrollTop + lineTop) + 'px',
    height: lh + 'px'
  });
  box.hidden = false;
}
/* Sidebar văn bản nhận dạng: chỉ khi mở mới có khung xanh + tô sáng */
function trOpen(){ return !!$('trPanel')?.classList.contains('open'); }
function syncLayerBoxes(){
  const layer = $('layer'); if (!layer) return;
  layer.classList.toggle('boxes', trOpen() && !!$('showBoxes')?.checked);
  if (!trOpen()) clearHoverHighlight();
}
function paintHoverHighlight(list){
  const hl = $('hl'); if (!hl) return;
  hl.replaceChildren();
  /* mỗi khung chữ một khung tím ĐÚNG BẰNG khung xanh — không gộp thành khung bao */
  const seen = new Set();
  for (const box of (list || [])){
    const r = box?.rect || [];
    if (r.length !== 4 || !(r[2] > r[0] && r[3] > r[1])) continue;
    const key = r.join(',');
    if (seen.has(key)) continue;
    seen.add(key);
    /* chốt an toàn: khung phủ nửa trang hoặc >35% diện tích là khung rác → không vẽ */
    if ((r[3] - r[1]) > 0.5 || (r[2] - r[0]) * (r[3] - r[1]) > 0.35) continue;
    const [x0, y0, x1, y1] = r;
    const el = document.createElement('div');
    el.className = 'hlBox';
    Object.assign(el.style, { left: x0 * 100 + '%', top: y0 * 100 + '%', width: (x1 - x0) * 100 + '%', height: (y1 - y0) * 100 + '%' });
    hl.append(el);
  }
}

/* textarea không cho biết dòng đang trỏ → đo bằng bản sao ẩn để quy đổi toạ độ → vị trí ký tự */
let hoverMirror = null;
function mirrorOf(ta){
  if (hoverMirror && hoverMirror.parentNode) return hoverMirror;
  const cs = getComputedStyle(ta);
  const div = document.createElement('div');
  for (const p of ['fontFamily','fontSize','fontWeight','lineHeight','letterSpacing','paddingTop','paddingRight','paddingBottom','paddingLeft','borderTopWidth','borderRightWidth','borderBottomWidth','borderLeftWidth','boxSizing','textIndent'])
    div.style[p] = cs[p];
  Object.assign(div.style, { position: 'absolute', left: '-9999px', top: '0', visibility: 'hidden', whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' });
  $('trPanel').append(div);
  hoverMirror = div;
  return div;
}
function charAtOffsetY(ta, y){
  const text = ta.value || '';
  if (!text) return -1;
  const mirror = mirrorOf(ta);
  mirror.style.width = Math.max(20, ta.clientWidth) + 'px';
  const cs = getComputedStyle(ta);
  const padTop = parseFloat(cs.paddingTop) || 0, padB = parseFloat(cs.paddingBottom) || 0;
  let lo = 0, hi = text.length;
  while (lo < hi){
    const mid = Math.ceil((lo + hi) / 2);
    mirror.textContent = text.slice(0, mid);
    if (Math.max(0, mirror.scrollHeight - padTop - padB) <= y) lo = mid; else hi = mid - 1;
  }
  return lo;
}
function lineAtOffset(text, off){
  if (off < 0) return -1;
  return (text.slice(0, off).match(/\n/g) || []).length;
}

const resultText = $('text');
resultText.addEventListener('mousemove', e => {
  const live = hook()?.getResults?.()?.get?.(hook()?.getCurrent?.());
  if (!trOpen() || !live?.boxes?.length || hook()?.isBusy?.()) return clearHoverHighlight();
  const ta = resultText;
  const rect = ta.getBoundingClientRect();
  const cs = getComputedStyle(ta);
  const padTop = parseFloat(cs.paddingTop) || 0;
  const y = Math.max(0, e.clientY - rect.top - padTop) + ta.scrollTop;
  /* con trỏ ở khoảng trắng DƯỚI dòng cuối (hoặc bảng rỗng) → không tô sáng gì trên trang */
  if (!ta.value || y > contentHeight(ta)) return clearHoverHighlight();
  const off = charAtOffsetY(ta, y);
  const lineIdx = Math.max(0, lineAtOffset(ta.value, off));
  const { top: lineTop, lh } = lineTopOf(ta, lineIdx);
  const contentH = contentHeight(ta);
  const ratio = Math.min(1, Math.max(0, (lineTop + lh / 2) / contentH));
  const lines = String(ta.value || '').split('\n');
  /* 1) khớp chữ trước (chính xác nhất, không lan sang cột khác) */
  let picked = boxesForLine(ta.value, live.boxes, lineIdx, null);
  /* 2) không khớp chữ → dòng trên trang theo cụm */
  if (!picked.length) picked = boxesOfCluster(clusterForLine(lines, clustersOf(live.boxes), lineIdx, ratio), live.boxes);
  /* 3) vẫn không có → băng ngang theo tỉ lệ */
  if (!picked.length){
    const half = Math.min(0.12, Math.max(0.012, (lh / 2) / contentH + 0.01));
    picked = boxesAtRatio(live.boxes, ratio, half);
  }
  paintHoverHighlight(picked);
  if (picked.length) paintLineHover(ta, lineIdx); else $('trHover').hidden = true;
});
resultText.addEventListener('mouseleave', clearHoverHighlight);

/* Trỏ khung chữ trên trang → sáng đúng dòng trong bảng và cuộn tới dòng đó */
$('layer').addEventListener('mouseover', e => {
  const span = e.target?.closest?.('span[data-i]');
  const live = hook()?.getResults?.()?.get?.(hook()?.getCurrent?.());
  if (!trOpen() || !live?.boxes?.length) return clearHoverHighlight();
  /* con trỏ đã ra khỏi khung chữ (nằm trên nền trang) → tắt ngay, không giữ khung cũ */
  if (!span) return clearHoverHighlight();
  const idx = Number(span.dataset.i);
  if (!Number.isFinite(idx)) return;
  const li = lineForBox($('text').value, live.boxes, idx);
  const ta = $('text');
  const { top: lineTop, lh } = lineTopOf(ta, li);
  if (lineTop < ta.scrollTop || lineTop + lh > ta.scrollTop + ta.clientHeight)
    ta.scrollTop = Math.max(0, lineTop - Math.round(ta.clientHeight / 2));
  paintLineHover(ta, li);
  /* tô ĐÚNG khung đang trỏ (bằng đúng khung xanh), không tô cả cụm */
  paintHoverHighlight([live.boxes[idx]]);
});
$('layer').addEventListener('mouseleave', clearHoverHighlight);
$('layer').addEventListener('mouseout', e => {
  const to = e.relatedTarget;
  if (!to || !to.closest?.('span[data-i]')) clearHoverHighlight();
});
$('paper').addEventListener('mouseleave', clearHoverHighlight);
window.__keepitHover = { clustersOf, clusterForLine, boxesOfCluster };
window.__keepitLineForBox = lineForBox;
resultText.addEventListener('scroll', clearHoverHighlight);
$('stage')?.addEventListener('scroll', clearHoverHighlight, {passive:true});
window.__keepitLineMap = boxesForLine;

/* ---------- Sửa chữ trong bảng rồi Áp dụng ---------- */
$('text').addEventListener('input', () => { $('textApply').disabled = false; });
$('textApply').onclick = () => {
  if (hook()?.isBusy?.()) return toast('Đang nhận dạng — đợi xong rồi lưu');
  const n = hook()?.getCurrent?.();
  const ok = hook()?.applyText?.(n, $('text').value);
  if (!ok) return toast('Trang này chưa có kết quả để sửa');
  $('textApply').disabled = true;
  toast(`Đã lưu chữ đã sửa cho trang ${n}`);
};
function resetTextApply(){ $('textApply').disabled = true; }

/* ---------- Kết quả trên tệp: điều khiển hiển thị ↔ điều khiển engine ---------- */
function syncFileOpts(){
  const res = $('ocrRes').value;
  for (const id of ['detLimit','regionLimit']){
    const sel = $(id);
    if (sel && [...sel.options].some(o => o.value === res)) sel.value = res;
  }
  $('regionPolicy').value = $('optTiny').checked ? 'main' : 'all';
  $('loopGuard').checked = $('optLoop').checked;
  $('regionTimeout').value = $('optTime').checked ? '90' : '0';
}
['ocrRes','optTiny','optLoop','optTime'].forEach(id => $(id).addEventListener('change', syncFileOpts));
$('showBoxes').checked = $('optBoxes').checked;   // khung vùng hiện ngay từ đầu
$('optBoxes').addEventListener('change', () => {
  $('showBoxes').checked = $('optBoxes').checked;
  $('showBoxes').dispatchEvent(new Event('change'));   // app.js vẽ lại lớp khung ngay
});
syncFileOpts();

/* cách đọc */
$('ocrModes').addEventListener('change', () => {
  syncModeRadios();
  if (currentMode() === 'fusor' && $('run').disabled)
    toast('Fusor cần chọn thư mục model (~831 MB) trước khi chạy');
});

/* bấm Nhận dạng: engine chạy, đóng hộp thoại, mở thẻ tiến độ */
$('run').addEventListener('click', () => {
  setTimeout(() => {
    if (hook()?.isBusy()){ closeOcr(); $('ocrProg').classList.add('show'); }
  }, 350);
});

/* ---------- menu Thêm ---------- */
function closeMore(){ $('vMorePanel').classList.remove('show'); $('moreScrim').classList.remove('show'); }
$('vMore').onclick = () => { $('vMorePanel').classList.add('show'); $('moreScrim').classList.add('show'); };
$('pageMenu').onclick = () => { $('vMorePanel').classList.add('show'); $('moreScrim').classList.add('show'); };
$('moreClose').onclick = closeMore;
$('moreScrim').onclick = closeMore;
$('moreResults').onclick = () => { closeMore(); $('trPanel').classList.toggle('open'); };
$('moreBoxes').onclick = () => {
  const cb = $('showBoxes'); cb.checked = !cb.checked;
  cb.dispatchEvent(new Event('change'));
  toast(cb.checked ? 'Hiện khung chữ' : 'Ẩn khung chữ');
  closeMore();
};
$('moreMode').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  [...$('moreMode').children].forEach(x => x.classList.toggle('on', x === b));
  toast('Chế độ xem: ' + b.textContent + ' (bản này chỉ có lớp chữ)');
});
['vFlow','moreFlow'].forEach(id => $(id).addEventListener('change', e => {
  toast('Cách xem: ' + e.target.options[e.target.selectedIndex].text + ' — chưa nối ở bản này');
}));

/* ---------- thu phóng / pager ---------- */
function setZoom(z){
  z = Math.min(2, Math.max(0.4, Number(z) || 0.86));
  $('paper').style.setProperty('--z', z);
  $('vZoom').value = [...$('vZoom').options].some(o => Number(o.value) === z) ? String(z) : $('vZoom').value;
  $('moreZoom').value = [...$('moreZoom').options].some(o => Number(o.value) === z) ? String(z) : $('moreZoom').value;
}
$('vZoom').addEventListener('change', e => setZoom(e.target.value));
$('moreZoom').addEventListener('change', e => { setZoom(e.target.value); closeMore(); });
$('zIn').onclick = () => setZoom((parseFloat($('paper').style.getPropertyValue('--z')) || 0.86) + 0.14);
$('zOut').onclick = () => setZoom((parseFloat($('paper').style.getPropertyValue('--z')) || 0.86) - 0.14);
$('pNum').addEventListener('change', e => {
  const n = Math.min(Math.max(1, Number(e.target.value) || 1), total());
  e.target.value = n; hook()?.goTo(n);
});
$('pageFullscreen').onclick = () => {
  if (document.fullscreenElement) document.exitFullscreen?.(); else document.documentElement.requestFullscreen?.();
};
$('vRailToggle').onclick = () => { const r = $('rail'); r.hidden = !r.hidden; };
/* đóng bảng = bỏ mọi sửa chưa Áp dụng */
function closeTrPanel(){
  const r = hook()?.getResults?.()?.get?.(hook()?.getCurrent?.());
  const ta = $('text');
  if (ta && r && ta.value !== r.text){ ta.value = r.text; resetTextApply(); }
  $('trPanel').classList.remove('open', 'resizing');
  $('trResize').classList.remove('drag');
}
$('trClose').onclick = closeTrPanel;

/* hộp nổi phải: đáy 20px, thẻ tiến độ hiện thì hộp "Bổ sung vùng" xếp lên trên */
(function layoutSidePanels(){
  const prog = $('ocrProg'), ed = $('regionEditor');
  if (!prog || !ed) return;
  const place = () => {
    const on = prog.classList.contains('show');
    if (on) killRegionNow();            // thẻ tiến độ hiện → tắt chọn vùng ngay
    /* đáy hộp nổi = đường ngang dưới của sidebar phải (đo thật, không đoán) */
    const panel = $('trPanel');
    const bottomGap = panel ? Math.max(0, Math.round(window.innerHeight - panel.getBoundingClientRect().bottom)) : 0;
    document.body.style.setProperty('--sideBottom', bottomGap + 'px');
  };
  place();
  new MutationObserver(place).observe(prog, { attributes: true, attributeFilter: ['class', 'style'] });
  if (window.ResizeObserver) new ResizeObserver(place).observe(prog);
  window.addEventListener('resize', place);
})();

/* kéo mép trái để đổi độ rộng (nhớ theo máy) */
const TR_W_KEY = 'keepit.trWidth';
function trClampWidth(w){
  const max = Math.min(760, Math.max(320, window.innerWidth * 0.7));
  return Math.round(Math.max(280, Math.min(w, max)));
}
(function initTrResize(){
  const panel = $('trPanel'), grip = $('trResize');
  if (!panel || !grip) return;
  try {
    const saved = Number(localStorage.getItem(TR_W_KEY));
    if (saved >= 280) panel.style.setProperty('--trW', trClampWidth(saved) + 'px');
  } catch {}
  let dragging = false, startX = 0, startW = 0;
  grip.addEventListener('pointerdown', e => {
    dragging = true; startX = e.clientX; startW = panel.getBoundingClientRect().width;
    panel.classList.add('resizing'); grip.classList.add('drag');
    try { grip.setPointerCapture(e.pointerId); } catch {}
    e.preventDefault();
  });
  grip.addEventListener('pointermove', e => {
    if (!dragging) return;
    panel.style.setProperty('--trW', trClampWidth(startW + (startX - e.clientX)) + 'px');
  });
  const stop = () => {
    if (!dragging) return;
    dragging = false; panel.classList.remove('resizing'); grip.classList.remove('drag');
    try { localStorage.setItem(TR_W_KEY, String(trClampWidth(panel.getBoundingClientRect().width))); } catch {}
  };
  grip.addEventListener('pointerup', stop);
  grip.addEventListener('pointercancel', stop);
  window.addEventListener('resize', () => {
    const cur = panel.style.getPropertyValue('--trW');
    if (cur) panel.style.setProperty('--trW', trClampWidth(parseFloat(cur)) + 'px');
  });
})();
/* mở/đóng sidebar → bật/tắt khung xanh + tô sáng ngay */
new MutationObserver(syncLayerBoxes).observe($('trPanel'), { attributes: true, attributeFilter: ['class'] });
$('showBoxes').addEventListener('change', syncLayerBoxes);
$('bannerAct').onclick = () => { collapseNotice(); openOcr(); };   // thu gợi ý thành bóng đèn
$('bannerClose').onclick = () => collapseNotice();          // thu gọn thành nút đèn
$('vBulb').onclick = () => expandNotice();                  // bấm đèn → bung lại thông báo
['mouseenter','focusin'].forEach(ev => $('vBanner').addEventListener(ev, () => holdNotice(true)));
['mouseleave','focusout'].forEach(ev => $('vBanner').addEventListener(ev, () => holdNotice(false)));
/* đang chạy nhận dạng (thẻ tiến độ mở) → thu gợi ý để không tranh chỗ */
if ($('ocrProg')) new MutationObserver(() => {
  if ($('ocrProg').classList.contains('show') && $('vBanner')?.classList.contains('show')){
    noticeCollapsed = true; refreshNotice(noticeNeeds);
  }
}).observe($('ocrProg'), { attributes: true, attributeFilter: ['class'] });
/* vùng xem hẹp (panel phải mở rộng) → thu ngay, không đè lên nội dung */
try { new ResizeObserver(() => refreshNotice(noticeNeeds)).observe($('stage')); } catch {}
$('bannerNoAsk').addEventListener('change', e => setNoAsk(e.target.checked));
window.__keepitNotice = { refreshNotice, collapseNotice, expandNotice, setNoAsk, setNoticeFileKey, noAskKey };

/* thanh công cụ chưa nối */
$('vTools').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  toast('Bản này mới nối OCR + lớp chữ; “' + b.textContent.trim() + '” chưa nối');
});
$('vMode').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  [...$('vMode').children].forEach(x => x.classList.toggle('on', x === b));
  toast(b.dataset.m === 'read' ? 'Chế độ Đọc cần lớp chữ của app — chưa nối' : 'Chế độ Gốc');
});

/* ---------- canh gác: engine không phản hồi thì cho thoát ---------- */
let lastSig = '', lastBeat = Date.now(), stalled = false;
const stallMs = () => Number(window.__keepitStallMs) || 45000;
setInterval(() => {
  if (hook()?.isBusy() && !(stopHold && Date.now() < stopHold)) syncCard();
  const sig = `${$('status')?.textContent || ''}|${$('progress')?.value || 0}|${$('progPage')?.textContent || ''}`;
  if (sig !== lastSig){ lastSig = sig; lastBeat = Date.now(); if (stalled){ stalled = false; $('pForce').hidden = true; } }
  const busy = !!hook()?.isBusy();
  if (busy && !stalled && Date.now() - lastBeat > stallMs()){
    stalled = true;
    $('pForce').hidden = false;
    $('progClose').disabled = false;
    toast('Engine không phản hồi — bấm “Buộc dừng” để thoát');
  }
  if (!busy && stalled){ stalled = false; $('pForce').hidden = true; }
}, 900);

function markStopped(warn){
  runSeen = false; expectRun = false; stoppedFlag = false;
  lastBeat = Date.now();
  followLast = 0;
  $('paper').classList.remove('scanning');
  const prog = $('ocrProg');
  prog.classList.add('show'); prog.classList.remove('done','error'); prog.classList.add('stopped');
  $('progTitle').textContent = 'Đã dừng nhận dạng';
  $('pTitle').textContent = 'Đã dừng';
  $('stop').hidden = true;
  $('pDone').classList.add('show');
  $('pWarn').style.display = '';
  $('pWarn').textContent = warn;
  const kept = hook()?.getResults?.().size || 0;
  $('pSum').innerHTML = `Đã dừng <b>${kept} trang đã xử lý được</b>`;
  $('progClose').disabled = false;
  $('pAgain').hidden = false;
  $('pRegion').hidden = false;
  $('pForce').hidden = true;
}

$('pForce').onclick = async () => {
  try { await hook()?.forceIdle?.(undefined, true); } catch {}   // buộc dừng = cắt cứng (giải phóng engine)
  markStopped('Đã buộc dừng vì engine không phản hồi. Kết quả có thể thiếu; có thể chạy lại.');
  toast('Đã buộc dừng engine — có thể chạy lại');
};

/* Dừng: phản hồi ngay, engine không nhả trong 2,5 giây thì buộc dừng */
let stoppedFlag = false;
const engineStop = $('stop').onclick;
$('stop').onclick = ev => {
  if (engineStop) engineStop(ev);            // 1) bảo engine dừng (cancelled + terminate worker)
  stoppedFlag = true;
  stopRequested = true;                      // lượt này kết thúc là DỪNG (giữ kết quả), không phải “xong”
  stopHold = Date.now() + 4000;              // 2) UI "Đã dừng" hiện NGAY, giữ 4 giây
  markStopped('Đã dừng. Kết quả có thể thiếu vì dừng giữa lượt; các trang chưa chạy vẫn ở trạng thái ảnh quét.');
  toast('Đã dừng');
  /* 3) Engine đã tự dừng THẬT ngay: handler gốc ở trên đặt cancelled=true và terminate worker.
     KHÔNG gọi forceIdle() ở đây. forceIdle() terminate worker hiện tại; nếu người dùng bấm
     Nhận dạng lại ngay sau đó thì worker của LƯỢT MỚI bị giết giữa lúc recognize → lỗi
     “Cannot read properties of null (reading 'postMessage')” và “Không hoàn tất: undefined”.
     Lưới an toàn duy nhất: sau 1,5 giây, nếu engine VẪN busy (treo thật) và KHÔNG có lượt mới
     thì mới buộc dừng đúng một lần. */
  const mySeq = stopSeq;
  setTimeout(() => {
    if (stopSeq !== mySeq) return;              // đã có lượt mới → không đụng engine
    /* Chế độ Fusor: forceIdle() sẽ GIẢI PHÓNG model khỏi RAM (fusor=null, fusorReady=false)
       → lượt sau không chạy được nữa. Với Fusor chỉ dùng nút “Buộc dừng” khi thật sự treo. */
    if (hook()?.getMode?.() === 'fusor') return;
    if (!hook()?.isBusy()) return;              // engine đã nhả bình thường
    try { Promise.resolve(hook()?.forceIdle?.()).catch(() => {}); } catch {}
  }, 1500);
};

/* thẻ tiến độ */
$('progClose').onclick = () => {
  if (hook()?.isBusy()) return;
  $('ocrProg').classList.remove('show', 'done', 'stopped', 'error');
  $('progClose').disabled = false;
  /* ✕ = giải phóng engine/model khỏi RAM; lần chạy sau app tự nạp lại. */
  try { Promise.resolve(hook()?.releaseEngines?.()).catch(() => {}); } catch {}
  toast('Đã đóng thẻ và giải phóng engine khỏi RAM');
};

/* ---------- phím tắt ---------- */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape'){
    if ($('menuFrom').style.display === 'flex' || $('menuTo').style.display === 'flex') return closePageMenus();
    if (!$('regionEditor').hidden) return $('cancelRegion').click();
    if (modal.classList.contains('show')) return closeOcr();
    if ($('vMorePanel').classList.contains('show')) return closeMore();
    if ($('trPanel').classList.contains('open')) return closeTrPanel();
    if ($('ocrProg').classList.contains('show') && !hook()?.isBusy()) return $('ocrProg').classList.remove('show');
    return;
  }
  if (e.target.matches?.('input,textarea,select')) return;
  if (e.key === 'ArrowLeft') $('prev').click();
  if (e.key === 'ArrowRight') $('next').click();
});

/* ---------- khởi động ---------- */
window.onKeepitState({ busy: false, current: 1, total: 0, has: false });
$('ocrProg').classList.remove('show');
