
/* v3.5.615: markup port nguyên văn demo (tiếng Việt) — đổi nhãn sang ngôn ngữ đang dùng */
const DEMO_TEXT = [
  ["Chữ in: đọc thẳng cả trang một lượt, nhanh nhất với tài liệu in rõ.", 'ocrHintTess'],
  ["Printed text: reads the whole page in one pass, fastest for clean print.", 'ocrHintTess'],
  ["인쇄체: 페이지 전체를 한 번에 읽어 깨끗한 인쇄물에 가장 빠릅니다.", 'ocrHintTess'],
  ["Nhận dạng chữ", 'ocrUiRunBtn'],
  ["Trang này là ảnh quét nên chưa có lớp chữ — Dịch, Đọc to và Ghi chú chưa dùng được. Chạy nhận dạng để chọn, sao chép và tìm kiếm được chữ.", 'ocrUiBanner'],
  ["Không hiện lại", 'ocrUiNoAsk'],
  ["Nhận dạng chữ (OCR)", 'ocrUiTitle'],
  ["Chưa mở tệp", 'ocrUiNoFile'],
  ["Phạm vi trang", 'ocrUiScope'],
  ["Trang đang xem", 'ocrUiScopeCurrent'],
  ["Tất cả các trang", 'ocrUiScopeAll'],
  ["Từ trang", 'ocrUiFromPage'],
  ["đến", 'ocrUiToPage'],
  ["trong", 'ocrUiOfA'],
  ["trang", 'ocrUiOfB'],
  ["Ngôn ngữ tài liệu", 'ocrUiLangGroup'],
  ["Đang chọn", 'ocrUiLangPick'],
  ["Cách nhận dạng", 'ocrUiMode'],
  ["Chữ in", 'ocrUiPrinted'],
  ["Nhanh", 'ocrUiFast'],
  ["Viết tay", 'ocrUiHand'],
  ["Kết quả trên tệp", 'ocrUiResult'],
  ["Kiểu đầu ra", 'ocrUiOutput'],
  ["Ảnh gốc + lớp chữ ẩn", 'ocrUiOutputText'],
  ["Độ phân giải dò", 'ocrUiRes'],
  ["1280 px · chính xác", 'ocrUiRes1280'],
  ["960 px", 'ocrUiRes960'],
  ["640 px · nhanh", 'ocrUiRes640'],
  ["Bỏ vùng chữ rất nhỏ khi chữ trên trang chênh lệch rõ", 'ocrUiTiny'],
  ["Dừng khi cùng một dòng lặp 12 lần", 'ocrUiLoop'],
  ["Giới hạn 90 giây mỗi vùng", 'ocrUiTime'],
  ["Hiện khung vùng đã nhận dạng trên trang", 'ocrUiBoxes'],
  ["Tuỳ chọn engine", 'ocrUiEngine'],
  ["Độ phân giải PDF", 'ocrUiDpi'],
  ["Số luồng", 'ocrUiThreads'],
  ["{n} luồng", 'ocrUiThreadN'],
  ["Model Fusor", 'ocrUiModel'],
  ["Chọn thư mục model", 'ocrUiChooseFolder'],
  ["Chưa chọn thư mục model.", 'ocrUiModelMissing'],
  ["Phương pháp", 'ocrUiMethod'],
  ["Tự động · chọn theo từng ảnh", 'ocrUiMethodAuto'],
  ["Từng vùng chữ", 'ocrUiMethodRegion'],
  ["Toàn trang", 'ocrUiMethodPage'],
  ["Tự động dò vùng trước: ít vùng → đọc cả trang; nhiều vùng cỡ chữ chênh lệch → bỏ vùng rất nhỏ; nhiều vùng đều cỡ → đọc mọi vùng.", 'ocrUiAutoHint'],
  ["960 · nhanh", 'ocrUiDet960Fast'],
  ["1600 · chữ nhỏ", 'ocrUiDet1600Small'],
  ["Ưu tiên chữ chính", 'ocrUiPriority'],
  ["Mọi vùng phát hiện", 'ocrUiAllRegions'],
  ["60 giây", 'ocrUiSec60'],
  ["90 giây", 'ocrUiSec90'],
  ["180 giây", 'ocrUiSec180'],
  ["Không giới hạn", 'ocrUiUnlimited'],
  ["Trang hiện tại", 'ocrUiScopeCurrentOpt'],
  ["Khoảng trang", 'ocrUiScopeRangeOpt'],
  ["Chạy trên máy · tệp không rời máy", 'ocrUiFoot'],
  ["Hủy", 'ocrUiCancel'],
  ["Đang nhận dạng chữ", 'ocrUiRunning'],
  ["Đang chuẩn bị…", 'ocrUiPreparing'],
  ["Dừng", 'ocrUiStopBtn'],
  ["Buộc dừng", 'ocrUiForce'],
  ["Nhận dạng lại", 'ocrUiAgain'],
  ["Chọn vùng", 'ocrUiPickRegion'],
  ["Bổ sung vùng", 'ocrUiAddRegion'],
  ["Chọn một hoặc nhiều vùng", 'ocrUiPickMany'],
  ["Chữ trong vùng đã chọn · mỗi dòng một hàng", 'ocrUiRegionBoxText'],
  ["Nhận dạng vùng", 'ocrUiRunRegion'],
  ["Áp dụng", 'ocrUiApply'],
  ["Văn bản nhận dạng", 'ocrUiPanelTitle'],
  ["Thu gọn thông báo", 'ocrUiCollapse'],
  ["Thu gọn", 'ocrUiCollapseShort'],
  ["Thông báo nhận dạng chữ", 'ocrUiToastLabel'],
  ["Trang này chưa có lớp chữ — bấm để xem", 'ocrUiBadgeNoText'],
  ["Đóng", 'ocrUiClose'],
  ["Chọn trang bắt đầu", 'ocrUiPickStart'],
  ["Đến trang", 'ocrUiToPageLabel'],
  ["Chọn trang kết thúc", 'ocrUiPickEnd'],
  ["Tìm ngôn ngữ… (Anh, Việt, Hàn)", 'ocrUiSearchLang'],
  ["Bấm “Nhận dạng vùng” hoặc nhập tay chữ cho vùng này…", 'ocrUiRegionPlaceholder'],
  ["Kéo để đổi độ rộng", 'ocrUiDragResize'],
  ["Đổi độ rộng bảng", 'ocrUiResizeTitle'],
  ["Sao chép văn bản", 'ocrUiCopy'],
  ["Tải tệp TXT", 'ocrUiSaveTxt'],
  ["Tải PDF có lớp chữ", 'ocrUiSavePdf'],
  ["Chọn vùng để bổ sung chữ", 'ocrUiRegionBadge'],
  ["Áp dụng phần chữ đã sửa", 'ocrUiApplyEdit'],
  ["Đóng bảng văn bản", 'ocrUiClosePanel'],
  ["Đóng (không lưu thay đổi)", 'ocrUiCloseNoSave'],
  ["Văn bản nhận dạng của trang sẽ hiện ở đây. Sửa trực tiếp được.", 'ocrUiPanelEmpty'],
  ["Recognise text", 'ocrUiRunBtn'],
  ["텍스트 인식", 'ocrUiRunBtn'],
  ["This page is a scan with no text layer — Translate, Read aloud and Notes are not usable yet. Run recognition to select, copy and search the text.", 'ocrUiBanner'],
  ["이 페이지는 스캔 이미지라 텍스트 레이어가 없습니다 — 번역, 소리 내어 읽기, 메모를 아직 쓸 수 없습니다. 인식을 실행하면 텍스트를 선택·복사·검색할 수 있습니다.", 'ocrUiBanner'],
  ["Don't show again", 'ocrUiNoAsk'],
  ["다시 표시 안 함", 'ocrUiNoAsk'],
  ["Recognise text (OCR)", 'ocrUiTitle'],
  ["텍스트 인식 (OCR)", 'ocrUiTitle'],
  ["No file open", 'ocrUiNoFile'],
  ["열린 파일 없음", 'ocrUiNoFile'],
  ["Page range", 'ocrUiScope'],
  ["페이지 범위", 'ocrUiScope'],
  ["Current page", 'ocrUiScopeCurrent'],
  ["현재 페이지", 'ocrUiScopeCurrent'],
  ["All pages", 'ocrUiScopeAll'],
  ["모든 페이지", 'ocrUiScopeAll'],
  ["From page", 'ocrUiFromPage'],
  ["시작 페이지", 'ocrUiFromPage'],
  ["to", 'ocrUiToPage'],
  ["끝", 'ocrUiToPage'],
  ["of", 'ocrUiOfA'],
  ["중", 'ocrUiOfA'],
  ["pages", 'ocrUiOfB'],
  ["페이지", 'ocrUiOfB'],
  ["Document languages", 'ocrUiLangGroup'],
  ["문서 언어", 'ocrUiLangGroup'],
  ["Selected", 'ocrUiLangPick'],
  ["선택됨", 'ocrUiLangPick'],
  ["Recognition method", 'ocrUiMode'],
  ["인식 방법", 'ocrUiMode'],
  ["Printed", 'ocrUiPrinted'],
  ["인쇄체", 'ocrUiPrinted'],
  ["Fast", 'ocrUiFast'],
  ["빠름", 'ocrUiFast'],
  ["Handwriting", 'ocrUiHand'],
  ["필기체", 'ocrUiHand'],
  ["Result on the file", 'ocrUiResult'],
  ["파일 결과", 'ocrUiResult'],
  ["Output type", 'ocrUiOutput'],
  ["출력 형식", 'ocrUiOutput'],
  ["Original image + hidden text layer", 'ocrUiOutputText'],
  ["원본 이미지 + 숨은 텍스트 레이어", 'ocrUiOutputText'],
  ["Scan resolution", 'ocrUiRes'],
  ["스캔 해상도", 'ocrUiRes'],
  ["1280 px · accurate", 'ocrUiRes1280'],
  ["1280 px · 정확", 'ocrUiRes1280'],
  ["640 px · fast", 'ocrUiRes640'],
  ["640 px · 빠름", 'ocrUiRes640'],
  ["Drop very small text boxes when type sizes differ clearly", 'ocrUiTiny'],
  ["글자 크기 차이가 뚜렷하면 아주 작은 영역은 버림", 'ocrUiTiny'],
  ["Stop when a line repeats 12 times", 'ocrUiLoop'],
  ["같은 줄이 12번 반복되면 중지", 'ocrUiLoop'],
  ["Limit 90 seconds per region", 'ocrUiTime'],
  ["영역당 90초 제한", 'ocrUiTime'],
  ["Show recognised boxes on the page", 'ocrUiBoxes'],
  ["인식된 영역 상자를 페이지에 표시", 'ocrUiBoxes'],
  ["Engine options", 'ocrUiEngine'],
  ["엔진 옵션", 'ocrUiEngine'],
  ["PDF resolution", 'ocrUiDpi'],
  ["PDF 해상도", 'ocrUiDpi'],
  ["Threads", 'ocrUiThreads'],
  ["스레드 수", 'ocrUiThreads'],
  ["{n} threads", 'ocrUiThreadN'],
  ["{n} 스레드", 'ocrUiThreadN'],
  ["Fusor model", 'ocrUiModel'],
  ["Fusor 모델", 'ocrUiModel'],
  ["Choose model folder", 'ocrUiChooseFolder'],
  ["모델 폴더 선택", 'ocrUiChooseFolder'],
  ["No model folder chosen yet.", 'ocrUiModelMissing'],
  ["모델 폴더를 아직 선택하지 않았습니다.", 'ocrUiModelMissing'],
  ["Method", 'ocrUiMethod'],
  ["방식", 'ocrUiMethod'],
  ["Auto · per image", 'ocrUiMethodAuto'],
  ["자동 · 이미지별 선택", 'ocrUiMethodAuto'],
  ["Text regions", 'ocrUiMethodRegion'],
  ["텍스트 영역별", 'ocrUiMethodRegion'],
  ["Whole page", 'ocrUiMethodPage'],
  ["전체 페이지", 'ocrUiMethodPage'],
  ["Auto: detect regions first — few regions → read the whole page; many regions with mixed sizes → drop the smallest; many same-size regions → read every region.", 'ocrUiAutoHint'],
  ["자동: 먼저 영역을 감지합니다 — 영역이 적으면 전체 페이지를 읽고, 크기가 다른 영역이 많으면 아주 작은 영역을 버리며, 같은 크기 영역이 많으면 모든 영역을 읽습니다.", 'ocrUiAutoHint'],
  ["960 · fast", 'ocrUiDet960Fast'],
  ["960 · 빠름", 'ocrUiDet960Fast'],
  ["1600 · small text", 'ocrUiDet1600Small'],
  ["1600 · 작은 글자", 'ocrUiDet1600Small'],
  ["Prefer main text", 'ocrUiPriority'],
  ["본문 우선", 'ocrUiPriority'],
  ["All detected regions", 'ocrUiAllRegions'],
  ["감지된 모든 영역", 'ocrUiAllRegions'],
  ["60 seconds", 'ocrUiSec60'],
  ["60초", 'ocrUiSec60'],
  ["90 seconds", 'ocrUiSec90'],
  ["90초", 'ocrUiSec90'],
  ["180 seconds", 'ocrUiSec180'],
  ["180초", 'ocrUiSec180'],
  ["No limit", 'ocrUiUnlimited'],
  ["제한 없음", 'ocrUiUnlimited'],
  ["Runs on your device · the file never leaves it", 'ocrUiFoot'],
  ["기기에서 실행 · 파일은 밖으로 나가지 않습니다", 'ocrUiFoot'],
  ["Cancel", 'ocrUiCancel'],
  ["취소", 'ocrUiCancel'],
  ["Recognising text", 'ocrUiRunning'],
  ["텍스트 인식 중", 'ocrUiRunning'],
  ["Preparing…", 'ocrUiPreparing'],
  ["준비 중…", 'ocrUiPreparing'],
  ["Stop", 'ocrUiStopBtn'],
  ["중지", 'ocrUiStopBtn'],
  ["Force stop", 'ocrUiForce'],
  ["강제 중지", 'ocrUiForce'],
  ["Recognise again", 'ocrUiAgain'],
  ["다시 인식", 'ocrUiAgain'],
  ["Select region", 'ocrUiPickRegion'],
  ["영역 선택", 'ocrUiPickRegion'],
  ["Add region", 'ocrUiAddRegion'],
  ["영역 추가", 'ocrUiAddRegion'],
  ["Select one or more regions", 'ocrUiPickMany'],
  ["영역을 하나 이상 선택", 'ocrUiPickMany'],
  ["Text in the selected region · one line per row", 'ocrUiRegionBoxText'],
  ["선택한 영역의 텍스트 · 한 줄에 한 행", 'ocrUiRegionBoxText'],
  ["Recognise region", 'ocrUiRunRegion'],
  ["영역 인식", 'ocrUiRunRegion'],
  ["Apply", 'ocrUiApply'],
  ["적용", 'ocrUiApply'],
  ["Recognised text", 'ocrUiPanelTitle'],
  ["인식된 텍스트", 'ocrUiPanelTitle'],
  ["Collapse message", 'ocrUiCollapse'],
  ["알림 접기", 'ocrUiCollapse'],
  ["Collapse", 'ocrUiCollapseShort'],
  ["접기", 'ocrUiCollapseShort'],
  ["Recognition notice", 'ocrUiToastLabel'],
  ["인식 알림", 'ocrUiToastLabel'],
  ["This page has no text layer — click to view", 'ocrUiBadgeNoText'],
  ["이 페이지에는 텍스트 레이어가 없습니다 — 클릭하여 보기", 'ocrUiBadgeNoText'],
  ["Close", 'ocrUiClose'],
  ["닫기", 'ocrUiClose'],
  ["Choose start page", 'ocrUiPickStart'],
  ["시작 페이지 선택", 'ocrUiPickStart'],
  ["To page", 'ocrUiToPageLabel'],
  ["끝 페이지", 'ocrUiToPageLabel'],
  ["Choose end page", 'ocrUiPickEnd'],
  ["끝 페이지 선택", 'ocrUiPickEnd'],
  ["Search languages… (English, Vietnamese, Korean)", 'ocrUiSearchLang'],
  ["언어 검색… (영어, 베트남어, 한국어)", 'ocrUiSearchLang'],
  ["Press “Recognise region” or type the text for this region…", 'ocrUiRegionPlaceholder'],
  ["“영역 인식”을 누르거나 이 영역의 텍스트를 직접 입력하세요…", 'ocrUiRegionPlaceholder'],
  ["Drag to resize", 'ocrUiDragResize'],
  ["끌어서 너비 조정", 'ocrUiDragResize'],
  ["Resize panel", 'ocrUiResizeTitle'],
  ["패널 너비 조정", 'ocrUiResizeTitle'],
  ["Copy text", 'ocrUiCopy'],
  ["텍스트 복사", 'ocrUiCopy'],
  ["Download TXT", 'ocrUiSaveTxt'],
  ["TXT 다운로드", 'ocrUiSaveTxt'],
  ["Download PDF with text layer", 'ocrUiSavePdf'],
  ["텍스트 레이어 PDF 다운로드", 'ocrUiSavePdf'],
  ["Pick a region to add text", 'ocrUiRegionBadge'],
  ["텍스트를 추가할 영역 선택", 'ocrUiRegionBadge'],
  ["Apply edited text", 'ocrUiApplyEdit'],
  ["수정한 텍스트 적용", 'ocrUiApplyEdit'],
  ["Close text panel", 'ocrUiClosePanel'],
  ["텍스트 패널 닫기", 'ocrUiClosePanel'],
  ["Close (discard changes)", 'ocrUiCloseNoSave'],
  ["닫기 (변경 사항 버림)", 'ocrUiCloseNoSave'],
  ["Recognised text for the page shows here. You can edit it directly.", 'ocrUiPanelEmpty'],
  ["페이지의 인식된 텍스트가 여기에 표시되며 직접 수정할 수 있습니다.", 'ocrUiPanelEmpty'],
  ["Đã chọn thư mục model", 'ocrModelReady'],
  ["Nhanh: PP-OCR đọc cả trang một lượt, chạy trong worker nền nên giao diện vẫn bấm được và Dừng ăn ngay. Lần đầu phải nạp model ~32 MB (10–30 giây); thiếu nhiều dấu tiếng Việt.", 'ocrHintPP'],
  ["Viết tay: dùng Fusor — phải bấm “Chọn thư mục model” (~831 MB) xong mới bấm được Nhận dạng chữ; chạy chậm hơn hẳn.", 'ocrHintFusor'],

];
const DEMO_MAP = new Map(DEMO_TEXT);
const LANG_KEY = { eng: 'ocrLangEng', vie: 'ocrLangVie', kor: 'ocrLangKor' };
function localize() {
  const doc = document;
  const tr = (key, vars) => globalThis.LHN_LANGUAGES?.t?.(key, vars || {}, doc.documentElement.lang) ?? key;
  for (const host of doc.querySelectorAll('.kpOcrUi')) {
    const walker = doc.createTreeWalker(host, 4 /* SHOW_TEXT */);
    let node;
    while ((node = walker.nextNode())) {
      const raw = node.nodeValue;
      const value = raw.trim();
      if (!value) continue;
      const thread = /^(\d+) luồng$/.exec(value);
      const key = DEMO_MAP.get(value) || (thread ? 'ocrUiThreadN' : null);
      if (!key) continue;
      const lead = raw.match(/^\s*/)[0];
      const trail = raw.match(/\s*$/)[0];
      node.nodeValue = lead + (thread ? tr(key).replace('{n}', thread[1]) : tr(key)) + trail;
    }
    const box = doc.getElementById('kpOcrLangBox');
    if (box && box.children.length) {
      for (const input of box.querySelectorAll('input')) {
        const span = input.parentElement.querySelector('span');
        if (!span) continue;
        const small = span.querySelector('small');
        if (small && span.firstChild) span.firstChild.nodeValue = tr(LANG_KEY[input.value]);
        else span.textContent = tr(LANG_KEY[input.value]);
      }
    }
    for (const el of host.querySelectorAll('[placeholder],[title],[aria-label]')) {
      for (const attr of ['placeholder', 'title', 'aria-label']) {
        const value = el.getAttribute(attr);
        if (!value) continue;
        const key = DEMO_MAP.get(value.trim());
        if (key) el.setAttribute(attr, tr(key));
      }
    }
  }
  const sub = doc.getElementById('kpOcrOcrSub');
  if (sub) {
    try {
      const info = globalThis.LHN_DOCUMENTS_OCR?.info?.();
      sub.textContent = info
        ? tr('ocrSubLine', { page: info.page || 1, state: tr(info.hasText ? 'ocrSubHasLayer' : 'ocrSubNoLayer') })
        : tr('ocrNoDocument');
    } catch { /* hộp thông tin lỗi không được làm hỏng popup */ }
  }
  const hint = doc.getElementById('kpOcrMethodHint');
  if (hint) {
    const picked = doc.querySelector('#kpOcrOcrModes input:checked')?.value || 'tess';
    hint.textContent = tr({ tess: 'ocrHintTess', pp: 'ocrHintPP', fusor: 'ocrHintFusor' }[picked] || 'ocrHintTess');
  }
  const lbox = doc.getElementById('kpOcrLangBox');
  const lsum = doc.getElementById('kpOcrLangSummary');
  if (lbox && lsum) {
    const names = [...lbox.querySelectorAll('input:checked')].map(input => tr(LANG_KEY[input.value]));
    lsum.textContent = names.length ? names.join(' + ') : tr('ocrUiLangNone');
  }
}

// OCR UI cho Tài liệu — bám đúng markup port từ bản demo (pages/documents.html):
// thẻ gợi ý ảnh quét + bóng đèn, popup giữa, panel phải “Văn bản nhận dạng”, thẻ tiến độ.
// Nhãn tĩnh nằm trong markup như demo; chuỗi do JS sinh đi qua languages.js (`ocr*`).
(() => {
  'use strict';
  if (globalThis.LHN_OCR_UI) return;
  const t = (key, params) => globalThis.LHN_LANGUAGES?.t?.(key, params, document.documentElement.lang) ?? key;
  const $ = id => document.getElementById(id);
  const NO_ASK = 'keepit.ocrNoticeOff:';   // đúng khoá của demo (mỗi tệp một khoá)
  const LANG_KEYS = LANG_KEY;
  const LANG_NAMES = new Proxy(LANG_KEYS, { get: (_, key) => t(LANG_KEYS[key]) });
  let card = null, dialogOpen = false;

  /* Thông báo “chưa có lớp chữ”: thu gọn thành bóng đèn — hành vi y như demo 2.9.7.26 */
  const NOTICE_AUTO_HIDE = 10000;   // tự thu thành bóng đèn sau 10 giây không tương tác
  const NOTICE_NARROW = 640;        // vùng xem hẹp hơn mức này thì không bung thẻ
  let noticeFileKey = '', noticeCollapsed = false, noticeForcedOpen = false, noticeWasExpanded = false;
  let noticeTimer = null, noticeNeeds = null;
  const noAskKey = () => NO_ASK + (noticeFileKey || 'unknown');
  const noAsk = () => { try { return localStorage.getItem(noAskKey()) === '1'; } catch { return false; } };
  const setNoAsk = value => {
    try { value ? localStorage.setItem(noAskKey(), '1') : localStorage.removeItem(noAskKey()); } catch { /* ignore */ }
    noticeForcedOpen = false;
    if (value) noticeCollapsed = true;
    refreshNotice(true);
  };
  function pickNoticeTheme() {
    const theme = Math.random() < 0.5 ? 'amber' : 'violet';
    for (const el of [$('kpOcrVBanner'), $('kpOcrVBulb')]) if (el) el.dataset.nt = theme;
  }
  function noticeNarrow() {
    const stage = $('stage');
    return !!stage && stage.clientWidth > 0 && stage.clientWidth < NOTICE_NARROW;
  }
  function scheduleNoticeHide() {
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => {
      if ($('kpOcrVBanner')?.classList.contains('show')) { noticeCollapsed = true; refreshNotice(noticeNeeds); }
    }, NOTICE_AUTO_HIDE);
  }
  function collapseNotice() { noticeCollapsed = true; noticeForcedOpen = false; refreshNotice(true); }
  function expandNotice() { noticeForcedOpen = true; noticeCollapsed = false; refreshNotice(true); }
  function refreshNotice(needsOcr) {
    const banner = $('kpOcrVBanner'), bulb = $('kpOcrVBulb');
    if (!banner || !bulb) return;
    if (needsOcr !== undefined) noticeNeeds = !!needsOcr;
    const needs = !!noticeNeeds;
    const expanded = needs && !noticeCollapsed && (noticeForcedOpen || !noAsk()) && !noticeNarrow();
    if (expanded && !noticeWasExpanded) pickNoticeTheme();
    noticeWasExpanded = expanded;
    banner.classList.toggle('show', expanded);
    if (expanded) scheduleNoticeHide(); else clearTimeout(noticeTimer);
    bulb.hidden = !(needs && !expanded);
    const checkbox = $('kpOcrBannerNoAsk');
    if (checkbox) checkbox.checked = noAsk();
  }
  const markRadios = container => {
    if (!container) return;
    for (const label of container.querySelectorAll('label')) label.classList.toggle('kpOn', !!label.querySelector('input:checked'));
  };
  const toast = text => {
    const node = $('kpOcrToast');
    if (!node || !text) return;
    node.textContent = text;
    node.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => node.classList.remove('show'), 2600);
  };

  /* vị trí đáy: 2 hộp nổi cách đường kẻ ngang đáy khung đọc 8px (CSS dùng --sideBottom) */
  function placeBottom() {
    const stage = document.getElementById('stage');
    const bottom = stage ? Math.max(0, Math.round(window.innerHeight - stage.getBoundingClientRect().bottom)) : 0;
    document.documentElement.style.setProperty('--sideBottom', `${bottom}px`);
    const bar = document.getElementById('vBar');
    const top = bar && typeof bar.getBoundingClientRect === 'function' ? Math.max(0, Math.round(bar.getBoundingClientRect().bottom)) : 0;
    document.documentElement.style.setProperty('--ocrTop', `${top}px`);
  }
  window.addEventListener('resize', placeBottom);
  /* kéo để đổi độ rộng bảng văn bản (demo có #trResize) */
  function bindPanelResize() {
    const handle = $('kpOcrTrResize'), root = $('kpOcrTrPanel');
    if (!handle || !root || handle.dataset.bound) return;
    handle.dataset.bound = '1';
    let startX = 0, startW = 0, dragging = false;
    handle.addEventListener('pointerdown', event => {
      dragging = true; startX = event.clientX; startW = root.getBoundingClientRect().width || 360;
      try { handle.setPointerCapture?.(event.pointerId); } catch { /* ignore */ }
      event.preventDefault();
    });
    handle.addEventListener('pointermove', event => {
      if (!dragging) return;
      const next = Math.min(Math.max(startW + (startX - event.clientX), 260), Math.min(720, window.innerWidth - 120));
      root.style.setProperty('--trW', `${Math.round(next)}px`);
    });
    const stopDrag = event => { dragging = false; try { handle.releasePointerCapture?.(event.pointerId); } catch { /* ignore */ } };
    handle.addEventListener('pointerup', stopDrag);
    handle.addEventListener('pointercancel', stopDrag);
  }

  /* ---------- chọn ngôn ngữ trong popup (dựng một lần) ---------- */
  const LANG_META = [
    { c: 'eng', key: 'ocrLangEng', native: 'English' },
    { c: 'vie', key: 'ocrLangVie', native: 'Tiếng Việt' },
    { c: 'kor', key: 'ocrLangKor', native: '한국어' }
  ];
  const langOn = { eng: true, vie: true, kor: false };
  function langName(lang) {
    try { return String(t(lang.key) || lang.native || lang.c); } catch { return lang.native || lang.c; }
  }
  function renderLangs(filter = '') {
    const box = $('kpOcrLangBox');
    if (!box) return;
    try {
      const needle = String(filter || '').trim().toLowerCase();
      box.replaceChildren();
      for (const lang of LANG_META) {
        const name = langName(lang);
        const hit = !needle || name.toLowerCase().includes(needle) || String(lang.native).toLowerCase().includes(needle) || lang.c.includes(needle);
        if (!hit) continue;
        const label = document.createElement('label');
        label.className = `kpKpick${langOn[lang.c] ? ' kpOn' : ''}`;
        const input = document.createElement('input');
        input.type = 'checkbox'; input.className = 'kpLang'; input.value = lang.c; input.checked = !!langOn[lang.c];
        input.onchange = () => {
          langOn[lang.c] = input.checked;
          label.classList.toggle('kpOn', input.checked);
          updateLangSummary();
        };
        const span = document.createElement('span');
        span.textContent = name;
        const small = document.createElement('small');
        small.textContent = lang.native;
        span.append(small);
        label.append(input, span);
        box.append(label);
      }
      if (!box.children.length) {
        const empty = document.createElement('div');
        empty.className = 'kpKpick';
        empty.textContent = t('ocrUiNoLangMatch');
        box.append(empty);
      }
    } catch (error) {
      /* không bao giờ để hộp ngôn ngữ trống: dựng dự phòng bằng dữ liệu tĩnh */
      console.warn('[Keepit] OCR languages', error);
      box.replaceChildren();
      for (const lang of LANG_META) {
        const label = document.createElement('label');
        label.className = `kpKpick${langOn[lang.c] ? ' kpOn' : ''}`;
        const input = document.createElement('input');
        input.type = 'checkbox'; input.className = 'kpLang'; input.value = lang.c; input.checked = !!langOn[lang.c];
        input.onchange = () => { langOn[lang.c] = input.checked; label.classList.toggle('kpOn', input.checked); updateLangSummary(); };
        const span = document.createElement('span');
        span.textContent = lang.native;
        label.append(input, span);
        box.append(label);
      }
    }
    updateLangSummary();
  }
  function buildLangs(selected = null) {
    if (Array.isArray(selected) && selected.length) {
      for (const key of Object.keys(langOn)) langOn[key] = selected.includes(key);
    }
    renderLangs($('kpOcrLangSearch')?.value || '');
    return selectedLangs();
  }
  function selectedLangs() {
    const values = Object.keys(langOn).filter(key => langOn[key]);
    return values.length ? values : ['eng'];
  }
  function updateLangSummary() {
    const summary = $('kpOcrLangSummary');
    if (!summary) return;
    try {
      const picked = LANG_META.filter(lang => langOn[lang.c]).map(lang => langName(lang));
      summary.textContent = picked.length ? picked.join(' + ') : t('ocrUiLangNone');
    } catch { summary.textContent = LANG_META.filter(lang => langOn[lang.c]).map(lang => lang.native).join(' + '); }
  }

  /* ---------- hộp sửa chữ của vùng (demo: #regionEditor) ---------- */
  function closeRegionEditor() {
    const root = $('kpOcrRegionEditor');
    if (root) root.classList.remove('show');
  }
  function openRegionEditor({ text = '', label = '' } = {}) {
    localize();
    const root = $('kpOcrRegionEditor'), area = $('kpOcrRegionText');
    if (!root || !area) return;
    area.value = text;
    const head = $('kpOcrRegionEditor')?.querySelector('.kpReHead');
    if (head && label) head.textContent = label;
    if ($('kpOcrApplyRegion')) $('kpOcrApplyRegion').disabled = !String(text).trim();
    root.classList.add('show');
  }

  /* ---------- popup giữa ---------- */
  function openDialog({
    mode = 'pp', scope = 'current', onRun, onCancel } = {}) {
    const modal = $('kpOcrOcrModal'), scrim = $('kpOcrOcrScrim');
    if (!modal || !scrim) return null;
    dialogOpen = true;
    /* từng bước cấu hình chạy riêng: một bước lỗi KHÔNG kéo theo các bước khác (nhất là danh sách ngôn ngữ) */
    const problems = [];
    const step = (name, run) => { try { return run(); } catch (error) { problems.push(`${name}: ${error?.message || error}`); console.warn(`[Keepit] OCR ${name}`, error); } };
    const reportProblems = () => {
      const body = $('kpOcrOcrBody');
      if (!body) return;
      body.querySelector('.kpOcrErr')?.remove();
      if (!problems.length) return;
      const box = document.createElement('p');
      box.className = 'kpOcrErr';
      box.textContent = `Lỗi cấu hình: ${problems.slice(0, 3).join(' · ')}`;
      body.append(box);
    };
    /* hiện popup NGAY — mọi phần còn lại chạy trong try/catch để một lỗi nhỏ không làm mất popup */
    try {
      scrim.classList.add('show');
      modal.classList.add('show');
      modal.setAttribute('aria-hidden', 'false');
    } catch (error) { console.warn('[Keepit] OCR dialog', error); }
    step('localize', () => localize());
    step('languages', () => buildLangs());
    step('panel', () => { $('kpOcrTrPanel')?.classList.add('kpOpen'); syncLayerBoxes(); });
    try {
    step('notice', () => collapseNotice());
    const info = globalThis.LHN_DOCUMENTS_OCR?.info?.();
    const page = info?.page || 1, pages = info?.pages || 1;
    if ($('kpOcrOcrBody')) $('kpOcrOcrBody').scrollTop = 0;
    if ($('kpOcrOcrSub')) {
      $('kpOcrOcrSub').textContent = info
        ? t('ocrSubLine', { page, state: t(info.hasText ? 'ocrSubHasLayer' : 'ocrSubNoLayer') })
        : t('ocrNoDocument');
    }
    if ($('kpOcrScopePage')) $('kpOcrScopePage').textContent = t('ocrPageLabel', { page });
    if ($('kpOcrScopeAll')) $('kpOcrScopeAll').textContent = t('ocrUiPagesCount', { n: pages });
    if ($('kpOcrOfTotal')) $('kpOcrOfTotal').textContent = String(pages);
    if ($('kpOcrFrom')) { $('kpOcrFrom').max = String(pages); if (!$('kpOcrFrom').value) $('kpOcrFrom').value = '1'; }
    if ($('kpOcrTo')) { $('kpOcrTo').max = String(pages); $('kpOcrTo').value = String(pages); }
    for (const input of modal.querySelectorAll('input[name="scopePick"]')) input.checked = input.value === scope;
    for (const input of modal.querySelectorAll('input[name="mode"]')) input.checked = input.value === mode;
    markRadios($('kpOcrOcrScopePick'));
    markRadios($('kpOcrOcrModes'));
    if ($('kpOcrRun')) $('kpOcrRun').disabled = !info;
    /* phạm vi khoảng trang: bật ô nhập + menu chọn trang như demo */
    const scopeSync = () => {
      const picked = modal.querySelector('input[name="scopePick"]:checked')?.value || 'current';
      for (const id of ['kpOcrFrom', 'kpOcrTo', 'kpOcrBtnFrom', 'kpOcrBtnTo']) { const el = $(id); if (el) el.disabled = picked !== 'range'; }
      const box = $('kpOcrRangeBox'); if (box) box.hidden = false;
    };
    const fillMenu = (menu, input) => {
      if (!menu) return;
      const current = Number(input?.value) || 1;
      menu.replaceChildren();
      for (let n = 1; n <= pages; n += 1) {
        const item = document.createElement('button');
        item.type = 'button'; item.textContent = String(n);
        item.className = n === current ? 'kpOn' : '';
        item.onclick = () => { if (input) input.value = String(n); menu.classList.remove('open'); };
        menu.append(item);
      }
    };
    const bindMenu = (btnId, menuId, inputId) => {
      const btn = $(btnId), menu = $(menuId), input = $(inputId);
      if (!btn || !menu) return;
      btn.disabled = input ? input.disabled : btn.disabled;
      btn.onclick = () => {
        if (btn.disabled) return;
        fillMenu(menu, input);
        menu.classList.toggle('open');
      };
    };
    bindMenu('kpOcrBtnFrom', 'kpOcrMenuFrom', 'kpOcrFrom');
    bindMenu('kpOcrBtnTo', 'kpOcrMenuTo', 'kpOcrTo');
    scopeSync();
    modal.addEventListener('change', event => {
      if (event.target?.name === 'scopePick') scopeSync();
      if (event.target?.name === 'mode') syncMode();
    });
    /* hộp ngôn ngữ: ô tìm lọc danh sách */
    if ($('kpOcrLangSearch')) $('kpOcrLangSearch').oninput = event => renderLangs(event.target.value);
    if ($('kpOcrLangSearch')) $('kpOcrLangSearch').onfocus = event => event.target.select();
    /* mỗi cách nhận dạng hiện đúng nhóm tuỳ chọn của nó */
    const syncMode = () => {
      const picked = modal.querySelector('input[name="mode"]:checked')?.value || mode;
      for (const el of modal.querySelectorAll('[data-for]')) el.classList.toggle('kpOff', el.dataset.for !== picked);
      if ($('kpOcrMethodHint')) {
        const key = { tess: 'ocrHintTess', pp: 'ocrHintPP', fusor: 'ocrHintFusor' }[picked] || 'ocrHintTess';
        $('kpOcrMethodHint').textContent = t(key);
      }
    };
    step('method', () => syncMode());
    for (const input of modal.querySelectorAll('input[name="scopePick"]')) {
      input.onchange = () => { markRadios($('kpOcrOcrScopePick')); scopeSync(); };
    }
    for (const input of modal.querySelectorAll('input[name="mode"]')) {
      input.onchange = () => { markRadios($('kpOcrOcrModes')); syncMode(); };
    }
    /* “Hiện khung vùng đã nhận dạng” (ô trong popup + ô ẩn như demo) */
    for (const id of ['kpOcrOptBoxes', 'kpOcrShowBoxes']) {
      const input = $(id);
      if (input) input.onchange = () => setBoxesVisible(!!input.checked);
    }
    /* khoanh vùng: 2 nút Hủy / Áp dụng phải chạy */
    if ($('kpOcrCancelRegion')) $('kpOcrCancelRegion').onclick = () => { closeRegionEditor(); };
    if ($('kpOcrApplyRegion')) $('kpOcrApplyRegion').onclick = () => {
      const text = $('kpOcrRegionText')?.value?.trim();
      const info2 = globalThis.LHN_DOCUMENTS_OCR?.info?.();
      if (!text || !info2) { closeRegionEditor(); return; }
      try { globalThis.LHN_DOCUMENTS_OCR.apply(info2.page, { text, boxes: [] }); globalThis.LHN_DOCUMENTS_OCR.refresh?.(); toast(t('ocrRegionApplied')); }
      catch { toast(t('ocrRegionError')); }
      closeRegionEditor();
    };
    if ($('kpOcrOcrRegion')) $('kpOcrOcrRegion').onclick = () => { closeRegionEditor(); globalThis.LHN_OCR?.runRegion?.(); };
    if ($('kpOcrModelStatus')) $('kpOcrModelStatus').textContent = globalThis.LHN_OCR_ENGINE?.status?.().loaded ? t('ocrModelReady') : t('ocrModelMissing');
    if ($('kpOcrFolder')) $('kpOcrFolder').onclick = async () => {
      const status = $('kpOcrModelStatus');
      try {
        await globalThis.LHN_OCR_ENGINE?.chooseModel?.({ onProgress: event => { if (status && event?.bytes) status.textContent = t('ocrConfirmModel', { size: (event.bytes / 1e6).toFixed(1) }); } });
        if (status) status.textContent = t('ocrModelReady');
      } catch (error) { toast(error?.message === 'ocrStopped' ? t('ocrStopped') : t('ocrModelPermission')); }
    };
    const close = () => { closeDialog(); onCancel?.(); };
    if ($('kpOcrOcrClose')) $('kpOcrOcrClose').onclick = close;
    if ($('kpOcrOcrCancel')) $('kpOcrOcrCancel').onclick = close;
    scrim.onclick = close;
    modal.onclick = event => { const label = event.target.closest('label'); if (label) setTimeout(() => { markRadios($('kpOcrOcrScopePick')); markRadios($('kpOcrOcrModes')); }, 0); };
    if ($('kpOcrMethodHint')) {
      const hint = { tess: 'ocrHintTess', pp: 'ocrHintPP', fusor: 'ocrHintFusor' };
      const update = () => { $('kpOcrMethodHint').textContent = t(hint[modal.querySelector('input[name="mode"]:checked')?.value || 'pp']); };
      modal.addEventListener('change', update);
      update();
    }
    if ($('kpOcrRun')) $('kpOcrRun').onclick = () => {
      const picked = modal.querySelector('input[name="scopePick"]:checked')?.value || 'current';
      const pickedMode = modal.querySelector('input[name="mode"]:checked')?.value || mode;
      const options = {
        mode: pickedMode,
        scope: picked === 'current' ? 'page' : picked,
        from: Number($('kpOcrFrom')?.value) || page,
        to: Number($('kpOcrTo')?.value) || pages,
        langs: selectedLangs().join('+'),
        longSide: Number($('kpOcrOcrRes')?.value) || 1280
      };
      closeDialog();
      onRun?.(options);
    };
    } catch (error) {
      console.warn('[Keepit] OCR dialog setup', error);
      problems.push(`setup: ${error?.message || error}`);
    }
    try { reportProblems(); } catch { /* ignore */ }
    return modal;
  }
  function closeDialog() {
    dialogOpen = false;
    $('kpOcrOcrScrim')?.classList.remove('show');
    $('kpOcrOcrModal')?.classList.remove('show');
  }
  const dialogVisible = () => dialogOpen;

  /* ---------- thẻ tiến độ ---------- */
  function openCard({
    onStop, onForce, onAgain, onRegion, onClose } = {}) {
    localize();
    const root = $('kpOcrOcrProg');
    if (!root) return null;
    card = { started: Date.now(), timer: 0, stopRequested: false, busy: true, root };
    placeBottom();
    root.classList.add('show');
    root.classList.remove('done', 'stopped', 'error');
    card.title = $('kpOcrProgTitle'); card.pageLabel = $('kpOcrProgPage');
    card.state = $('kpOcrPTitle'); card.clock = $('kpOcrPClock'); card.bar = $('kpOcrProgress');
    card.logBox = $('kpOcrPLog'); card.doneBox = $('kpOcrPDone'); card.sum = $('kpOcrPSum'); card.warn = $('kpOcrPWarn');
    card.actions = { stop: $('kpOcrStop'), force: $('kpOcrPForce'), again: $('kpOcrPAgain'), region: $('kpOcrPRegion'), close: $('kpOcrProgClose') };
    card.title.textContent = t('ocrTitleRun');
    card.state.textContent = t('ocrPreparing');
    card.clock.textContent = `0.0 ${t('ocrSeconds')}`;
    card.bar.value = 0;
    card.logBox.replaceChildren();
    card.doneBox.style.display = 'none';
    card.warn.textContent = '';
    card.actions.stop.hidden = false; card.actions.stop.disabled = false;
    card.actions.force.hidden = true;
    card.actions.again.hidden = true;
    card.actions.region.hidden = true;
    card.actions.close.disabled = true;
    card.actions.stop.onclick = () => { if (card.stopRequested) return; card.stopRequested = true; onStop?.(); };
    card.actions.force.onclick = () => onForce?.();
    card.actions.again.onclick = () => onAgain?.();
    card.actions.region.onclick = () => onRegion?.();
    card.actions.close.onclick = () => { if (card.busy) return; onClose?.(); };
    clearInterval(card.timer);
    card.timer = setInterval(() => {
      if (!card) return;
      card.clock.textContent = `${((Date.now() - card.started) / 1000).toFixed(1)} ${t('ocrSeconds')}`;
    }, 200);
    return card;
  }
  function closeCard() {
    if (!card) return;
    clearInterval(card.timer);
    card.root?.classList.remove('show');
    card = null;
  }
  const current = () => card;
  /* QĐ-3: mọi trạng thái đều ghi thêm vào kênh demo (#kpOcrProgPage/#kpOcrStatus/#kpOcrProgress). */
  const bridge = () => globalThis.KEEPIT_OCR_BRIDGE;
  function setPage(text) {
    if (card && text != null) card.pageLabel.textContent = text;
    try { bridge()?.setPageLabel?.(text); } catch { /* ignore */ }
  }
  const LOG_SKIP = /đang nhận dạng[^\n]*\d+%|recognis\w*[^\n]*\d+%|인식[^\n]*\d+%/i;
  function setState(main) {
    if (!card || !main) return;
    card.state.textContent = main;
    const status = $('kpOcrStatus'); if (status) status.textContent = main;
    try { bridge()?.setStatus?.(main); } catch { /* ignore */ }
    /* dòng “đang nhận dạng: N%” chỉ giữ 1 dòng, cập nhật tại chỗ — không đẻ 3 dòng như trước */
    const top = card.logBox.firstElementChild;
    if (LOG_SKIP.test(main) && top && LOG_SKIP.test(top.textContent)) { top.textContent = String(main).trim(); return; }
    log(main);
  }
  function log(line) {
    if (!card || !line) return;
    const text = String(line).trim();
    if (!text || card.logBox.firstElementChild?.textContent === text) return;
    const node = document.createElement('div');
    node.textContent = text;
    card.logBox.prepend(node);
    while (card.logBox.children.length > 3) card.logBox.lastElementChild.remove();
  }
  function progress(value) {
    if (card) card.bar.value = Math.max(0, Math.min(1, Number(value) || 0));
    try { bridge()?.setProgress?.(value); } catch { /* ignore */ }
  }
  function finish({ kind = 'done', summary = '', warning = '' } = {}) {
    if (!card) return;
    card.busy = false;
    clearInterval(card.timer);
    card.root.classList.remove('done', 'stopped', 'error');
    card.root.classList.add(kind === 'done' ? 'done' : kind === 'error' ? 'error' : 'stopped');
    card.title.textContent = kind === 'done' ? t('ocrTitleDone') : kind === 'error' ? t('ocrTitleError') : t('ocrTitleStopped');
    if (summary) card.state.textContent = summary;
    card.sum.textContent = '';
    card.warn.textContent = warning;
    card.doneBox.style.display = '';
    card.actions.stop.hidden = true;
    card.actions.force.hidden = true;
    card.actions.again.hidden = false;
    card.actions.region.hidden = false;
    card.actions.close.disabled = false;
  }
  function busy(value) {
    if (card) card.busy = !!value;
    try { bridge()?.setBusy?.(!!value); } catch { /* ignore */ }
  }

  /* ---------- panel phải “Văn bản nhận dạng” ---------- */
  function panel({
    text = '', page = 0, append = false, reset = false } = {}) {
    localize();
    bindTextHover();
    const root = $('kpOcrTrPanel'), area = $('kpOcrText');
    if (!root || !area) return;
    bindPanelResize();
    if (reset) area.value = '';
    const value = String(text || '').trim();
    if (value) area.value = (append && area.value ? `${area.value}\n\n` : '') + (page ? `— ${t('ocrPageLabel', { page })} —\n${value}` : value);
    if (area.value.trim()) {
      root.classList.add('kpOpen');
      syncLayerBoxes();
      for (const id of ['kpOcrCopy', 'kpOcrSave', 'kpOcrSavePdf', 'kpOcrTextApply']) { const button = $(id); if (button) button.disabled = false; }
    }
    $('kpOcrCopy') && ($('kpOcrCopy').onclick = () => {
      try { navigator.clipboard?.writeText(area.value).then(() => toast(t('ocrCopyDone')), () => toast(t('ocrCopyFail'))); }
      catch { toast(t('ocrCopyFail')); }
    });
    $('kpOcrSave') && ($('kpOcrSave').onclick = () => {
      const name = (globalThis.LHN_DOCUMENTS_OCR?.info?.()?.name || 'ocr').replace(/\.[^.]+$/, '');
      const blob = new Blob([area.value], { type: 'text/plain;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${name}.txt`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 4000);
    });
    const close = $('kpOcrTrClose');
    if (close) close.onclick = () => { root.classList.remove('kpOpen'); syncLayerBoxes(); };
    const addRegion = $('kpOcrTrRegion');
    if (addRegion) addRegion.onclick = () => openRegionEditor({ label: t('ocrUiRegionBadge') });
    const applyText = $('kpOcrTextApply');
    if (applyText) applyText.onclick = () => {
      const info = globalThis.LHN_DOCUMENTS_OCR?.info?.();
      const value = area.value.trim();
      if (!info || !value) { toast(t('ocrNoDocument')); return; }
      try {
        globalThis.LHN_DOCUMENTS_OCR.apply(info.page, { text: value, boxes: [] });
        globalThis.LHN_DOCUMENTS_OCR.refresh?.();
        toast(t('ocrTextApplied'));
      } catch { toast(t('ocrTextApplyFail')); }
    };
    const savePdf = $('kpOcrSavePdf');
    if (savePdf) savePdf.onclick = async () => {
      if (savePdf.disabled) return;
      try {
        const exporter = globalThis.LHN_OCR_EXPORT;
        if (!exporter?.pdf) throw new Error('ocrPdfFail');
        const done = await exporter.pdf();
        toast(t('ocrPdfDone', { count: done.count, pages: done.pages }));
      } catch (error) {
        const key = String(error?.message || '');
        toast(/^ocr[A-Z]/.test(key) ? t(key) : t('ocrPdfFail'));
      }
    };
  }
  const panelText = () => $('kpOcrText')?.value || '';
  const closePanel = () => { $('kpOcrTrPanel')?.classList.remove('kpOpen'); syncLayerBoxes(); };

  /* ---------- thẻ gợi ý ảnh quét + bóng đèn ---------- */
  function setNoticeFileKey(key) {
    if (key === noticeFileKey) return;
    noticeFileKey = key || '';
    noticeCollapsed = false; noticeForcedOpen = false; noticeWasExpanded = false;
  }
  function syncBanner({ needsOcr = false, fileKey = '' } = {}) {
    localize();
    const banner = $('kpOcrVBanner'), bulb = $('kpOcrVBulb');
    if (!banner || !bulb) return;
    setNoticeFileKey(fileKey);
    const checkbox = $('kpOcrBannerNoAsk');
    if (checkbox) checkbox.onchange = event => setNoAsk(event.target.checked);
    const close = $('kpOcrBannerClose');
    if (close) close.onclick = () => collapseNotice();
    if ($('kpOcrBannerAct')) $('kpOcrBannerAct').onclick = () => { collapseNotice(); globalThis.LHN_OCR?.open?.(); };
    bulb.onclick = () => expandNotice();   // bóng đèn LUÔN mở lại thẻ, kể cả tệp đã tick “Không hiện lại”
    banner.onmouseenter = () => clearTimeout(noticeTimer);
    banner.onmouseleave = () => { if (banner.classList.contains('show')) scheduleNoticeHide(); };
    refreshNotice(needsOcr);
  }
  /* ---------- khoanh vùng ---------- */
  function pageBox() {
    const page = globalThis.LHN_DOCUMENTS_OCR?.pageElement?.()
      || document.querySelector('#pageStack > [data-page] .docsSource')
      || document.querySelector('#pageStack [data-page] .docsSource');
    return page || null;
  }
  /* lớp chọn vùng + khung đã nhận dạng nằm trong chính trang, đúng demo (#regionSurface) */
  function regionSurface(page) {
    let host = page.querySelector(':scope > .kpRegionSurface');
    if (!host) {
      host = document.createElement('div');
      host.className = 'kpRegionSurface';
      host.hidden = true;
      host.innerHTML = '<div class="kpRegionMarks"></div><div class="kpRegionRect"></div>';
      page.append(host);
    }
    return host;
  }
  function selectRegion({ label } = {}) {
    return new Promise(resolve => {
      placeBottom();
      const page = pageBox();
      if (!page) { resolve(null); return; }
      const host = regionSurface(page);
      const marks = host.querySelector('.kpRegionMarks');
      const box = host.querySelector('.kpRegionRect');
      const hint = document.createElement('div');
      hint.className = 'kpRegionHintBar';
      hint.textContent = label || t('ocrRegionHint');
      host.hidden = false;
      host.append(hint);
      const rect0 = page.getBoundingClientRect();
      let start = null;
      const point = event => ({
        x: Math.min(1, Math.max(0, (event.clientX - rect0.left) / Math.max(1, rect0.width))),
        y: Math.min(1, Math.max(0, (event.clientY - rect0.top) / Math.max(1, rect0.height)))
      });
      const draw = (a, b) => {
        box.classList.add('on');
        box.style.left = `${Math.min(a.x, b.x) * 100}%`; box.style.top = `${Math.min(a.y, b.y) * 100}%`;
        box.style.width = `${Math.abs(a.x - b.x) * 100}%`; box.style.height = `${Math.abs(a.y - b.y) * 100}%`;
      };
      const stop = value => {
        host.hidden = true; box.classList.remove('on'); hint.remove();
        document.removeEventListener('keydown', escape);
        host.removeEventListener('pointerdown', down);
        host.removeEventListener('pointermove', move);
        host.removeEventListener('pointerup', up);
        if (value && marks) {
          const mark = document.createElement('div');
          mark.className = 'kpRegionMark';
          Object.assign(mark.style, { left: `${value[0] * 100}%`, top: `${value[1] * 100}%`, width: `${(value[2] - value[0]) * 100}%`, height: `${(value[3] - value[1]) * 100}%` });
          marks.append(mark);
        }
        resolve(value);
      };
      const escape = event => { if (event.key === 'Escape') stop(null); };
      const down = event => { event.preventDefault(); start = point(event); draw(start, start); };
      const move = event => { if (start) draw(start, point(event)); };
      const up = event => {
        if (!start) return;
        const end = point(event);
        const rect = [Math.min(start.x, end.x), Math.min(start.y, end.y), Math.max(start.x, end.x), Math.max(start.y, end.y)];
        start = null;
        stop(rect[2] - rect[0] > .01 && rect[3] - rect[1] > .01 ? rect : null);
      };
      host.addEventListener('pointerdown', down);
      host.addEventListener('pointermove', move);
      host.addEventListener('pointerup', up);
      document.addEventListener('keydown', escape);
    });
  }
  /* “Hiện khung vùng đã nhận dạng trên trang” — đúng demo: span từng từ, viền xanh,
     chỉ hiện khi sidebar văn bản đang mở và ô “Hiện khung” đang bật. */
  let lastBoxes = [];
  const normText = value => String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();
  function boxesLayer() {
    const host = pageBox();
    if (!host) return null;
    let layer = host.querySelector(':scope > .kpBoxLayer');
    if (!layer) {
      layer = document.createElement('div');
      layer.className = 'kpBoxLayer';
      layer.innerHTML = '<div class="kpHoverLayer"></div>';
      host.append(layer);
    }
    return layer;
  }
  function drawBoxes(boxes = []) {
    lastBoxes = Array.isArray(boxes) ? boxes : [];
    const layer = boxesLayer();
    if (!layer) return;
    for (const node of [...layer.querySelectorAll('.kpOcrBox')]) node.remove();
    const boxHost = layer;
    for (const box of lastBoxes) {
      const rect = box?.rect;
      if (!Array.isArray(rect) || rect.length !== 4) continue;
      if (!String(box.text || '').trim() || rect[2] <= rect[0] || rect[3] <= rect[1]) continue;
      const span = document.createElement('span');
      span.className = 'kpOcrBox';
      span.textContent = `${box.text} `;
      Object.assign(span.style, {
        left: `${rect[0] * 100}%`, top: `${rect[1] * 100}%`,
        width: `${(rect[2] - rect[0]) * 100}%`, height: `${(rect[3] - rect[1]) * 100}%`
      });
      boxHost.append(span);
    }
    syncLayerBoxes();
    paintHover([]);
  }
  function setPanelPushed(open) {
    /* chỉ đánh dấu để CSS nép 2 hộp nổi; KHÔNG phát resize toàn cục:
       documents.js sẽ dựng lại #pageStack và huỷ trang đang raster ⇒ OCR kẹt ở “Đang chuẩn bị…” */
    document.documentElement.classList.toggle('kpOcrPanelOpen', !!open);
  }
  function syncLayerBoxes() {
    setPanelPushed(!!$('kpOcrTrPanel')?.classList.contains('kpOpen'));
    const layer = boxesLayer();
    if (!layer) return;
    const open = !!$('kpOcrTrPanel')?.classList.contains('kpOpen');
    const show = !!($('kpOcrOptBoxes')?.checked ?? true);
    layer.classList.toggle('kpBoxes', open && show);
    if (!open) paintHover([]);
  }
  function setBoxesVisible(visible) {
    for (const id of ['kpOcrOptBoxes', 'kpOcrShowBoxes']) { const input = $(id); if (input) input.checked = !!visible; }
    syncLayerBoxes();
  }
  /* Trỏ vào một dòng trong bảng ⇒ tô đúng khung chữ đó trên trang (demo: #hl + #trHover) */
  function paintHover(list) {
    const hover = pageBox()?.querySelector(':scope > .kpBoxLayer > .kpHoverLayer');
    if (hover) {
      hover.replaceChildren();
      for (const box of list || []) {
        const rect = box?.rect;
        if (!Array.isArray(rect) || rect.length !== 4) continue;
        const node = document.createElement('div');
        node.className = 'kpHoverBox';
        Object.assign(node.style, {
          left: `${rect[0] * 100}%`, top: `${rect[1] * 100}%`,
          width: `${(rect[2] - rect[0]) * 100}%`, height: `${(rect[3] - rect[1]) * 100}%`
        });
        hover.append(node);
      }
    }
    if (!list || !list.length) { const bar = $('kpOcrTrHover'); if (bar) bar.hidden = true; }
  }
  function clusterForLine(target) {
    const words = target.split(' ').filter(Boolean);
    if (!words.length) return [];
    const picked = [];
    let acc = '';
    for (const box of lastBoxes) {
      const word = normText(box?.text);
      if (!word) continue;
      acc = acc ? `${acc} ${word}` : word;
      picked.push(box);
      if (acc === target) return picked;
      if (!target.startsWith(acc)) { acc = ''; picked.length = 0; }
      if (acc.length > target.length + 60) { acc = ''; picked.length = 0; }
    }
    return [];
  }
  function boxesForLine(lineIdx) {
    const area = $('kpOcrText');
    const lines = String(area?.value || '').split('\n');
    const target = normText(lines[lineIdx]);
    if (!target) return [];
    const exact = lastBoxes.filter(box => normText(box?.text) === target);
    if (exact.length) return exact;
    const cluster = clusterForLine(target);
    if (cluster.length) return cluster;
    /* không khớp chữ ⇒ băng ngang theo tỉ lệ dòng, như demo */
    const ratio = lines.length > 1 ? lineIdx / (lines.length - 1) : 0;
    return lastBoxes.filter(box => {
      const rect = box?.rect; if (!Array.isArray(rect) || rect.length !== 4) return false;
      const mid = (rect[1] + rect[3]) / 2;
      return Math.abs(mid - ratio) < 0.03;
    });
  }
  function lineIndexAt(area, clientY) {
    const style = getComputedStyle(area);
    const lineHeight = parseFloat(style.lineHeight) || (parseFloat(style.fontSize) || 13) * 1.5;
    const padTop = parseFloat(style.paddingTop) || 0;
    const offset = clientY - area.getBoundingClientRect().top + area.scrollTop - padTop;
    return Math.max(0, Math.floor(offset / lineHeight));
  }
  function paintLineBar(lineIdx) {
    const area = $('kpOcrText'), bar = $('kpOcrTrHover');
    if (!area || !bar || lineIdx < 0) return;
    const style = getComputedStyle(area);
    const lineHeight = parseFloat(style.lineHeight) || (parseFloat(style.fontSize) || 13) * 1.5;
    const padTop = parseFloat(style.paddingTop) || 0;
    const padLeft = parseFloat(style.paddingLeft) || 0;
    const borderTop = parseFloat(style.borderTopWidth) || 0;
    const borderLeft = parseFloat(style.borderLeftWidth) || 0;
    /* v3.5.628: dải tô phải phủ hết bề ngang dòng đang trỏ (trước đây thiếu left/width nên chỉ còn 1 vạch dọc).
       Toạ độ lấy theo khung chứa (giống glue.js của demo: #trHover nằm đè lên textarea). */
    const rect = area.getBoundingClientRect();
    const host = area.parentElement ? area.parentElement.getBoundingClientRect() : { left: 0, top: 0 };
    const padRight = parseFloat(style.paddingRight) || 0;
    bar.style.left = `${rect.left - host.left + borderLeft + padLeft - 4}px`;
    bar.style.width = `${Math.max(0, rect.width - borderLeft * 2 - padLeft - padRight + 8)}px`;
    bar.style.top = `${rect.top - host.top + borderTop + padTop + lineIdx * lineHeight - area.scrollTop}px`;
    bar.style.height = `${lineHeight}px`;
    bar.hidden = false;
  }
  function bindTextHover() {
    const area = $('kpOcrText');
    if (!area || area.dataset.kpHover === '1') return;
    area.dataset.kpHover = '1';
    area.addEventListener('mousemove', event => {
      if (!$('kpOcrTrPanel')?.classList.contains('kpOpen') || !lastBoxes.length) return;
      const lineIdx = lineIndexAt(area, event.clientY);
      const picked = boxesForLine(lineIdx);
      paintHover(picked);
      if (picked.length) paintLineBar(lineIdx);
    });
    area.addEventListener('mouseleave', () => paintHover([]));
    area.addEventListener('scroll', () => { const bar = $('kpOcrTrHover'); if (bar) bar.hidden = true; });
  }
  /* dựng sẵn danh sách ngôn ngữ: dù openDialog có lỗi thì hộp chọn vẫn có đủ 3 dòng */
  const primeLangs = () => { try { renderLangs(''); } catch (error) { console.warn('[Keepit] OCR prime languages', error); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', primeLangs, { once: true });
  else setTimeout(primeLangs, 0);
  globalThis.LHN_OCR_UI = Object.freeze({
    openDialog, closeDialog, dialogVisible, openCard, closeCard, current, setPage, setState, log, progress,
    finish, busy, toast, selectRegion, panel, panelText, closePanel, syncBanner, selectedLangs,
    openRegionEditor, closeRegionEditor, drawBoxes, setBoxesVisible, syncLayerBoxes
  });
})();

