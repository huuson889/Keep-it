// Keepit home page for the extension (v3.5.180) — the same start page as Keepit for Android (approved demo
// keepit-apk-home-demo-v12.html, Kiểu B): greeting, search box (opens the Keepit bar's search), Continue learning (last
// unfinished Study session), Learn with Keepit, More sites (editable shortcuts), Keepit tips. Phone, tablet and desktop
// layouts follow the demo (portrait / landscape). Opened from ☰ › Home (pages/home.html).
// Stored locally only (browser.storage.local "lhnHomeBookmarks" = the More sites list); nothing is sent anywhere and
// no page or history is read.
(() => {
  "use strict";
  const API = globalThis.browser;
  if (!API?.storage?.local || !document.getElementById("keepit-home")) return;
  const HOME = true;
  const K = { bm:"lhnHomeBookmarks" };
  const DICT_KEY = "dictation:session-index:v1", SETTINGS_KEY = "lhnSettings";
  const P = {"lang":"<path d=\"m5 8 6 6\"/><path d=\"m4 14 6-6 2-3\"/><path d=\"M2 5h12\"/><path d=\"M7 2h1\"/><path d=\"m22 22-5-10-5 10\"/><path d=\"M14 18h6\"/>","menu":"<path d=\"M4 6h16M4 12h16M4 18h16\"/>","search":"<circle cx=\"11\" cy=\"11\" r=\"7.5\"/><path d=\"m21 21-4.3-4.3\"/>","sel":"<path d=\"M4 7V5a1 1 0 0 1 1-1h2M17 4h2a1 1 0 0 1 1 1v2M20 17v2a1 1 0 0 1-1 1h-2M7 20H5a1 1 0 0 1-1-1v-2\"/><path d=\"M8 12h8\"/>","play":"<path d=\"M8 5v14l11-7z\" fill=\"currentColor\"/>","arrowUR":"<path d=\"M7 17 17 7M8 7h9v9\"/>","x":"<path d=\"M18 6 6 18M6 6l12 12\"/>","plus":"<path d=\"M12 5v14M5 12h14\"/>","pen":"<path d=\"M12 20h9\"/><path d=\"M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z\"/>","trash":"<path d=\"M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6\"/>","grid":"<path d=\"M5 9h14M5 15h14\"/>","openR":"<path d=\"M7 17 17 7M8 7h9v9\"/>","chevR":"<path d=\"m9 6 6 6-6 6\"/>","addhome":"<rect x=\"6\" y=\"2\" width=\"12\" height=\"20\" rx=\"2.5\"/><path d=\"M12 8.5v6M9 11.5h6M11 18.5h2\"/>","hist":"<path d=\"M3 12a9 9 0 1 0 3-6.7L3 8\"/><path d=\"M3 3v5h5M12 7v5l3 2\"/>"};
  const H = {"vi":{"greet":["Chào buổi sáng","Chào buổi chiều","Chào buổi tối"],"ask":"Hôm nay bạn muốn khám phá gì?","learn":"Học cùng Keepit","more":"Trang web khác","tips":"Mẹo dùng Keepit","yt":"Xem video với phụ đề song ngữ, luyện Nói và Chép","tt":"Đọc báo tiếng Anh, dịch song ngữ từng đoạn","ytC":["Phụ đề","Nói","Chép"],"ttC":["Song ngữ","Đọc trang"],"tipT":["Chọn chữ","Dịch · Lưu · Hỏi AI","Nút tìm tím","☰ Keepit"],"tipL":["Mở trang bất kỳ, nhấn giữ một từ hoặc bôi đen đoạn chữ: icon Keepit hiện dưới vùng chọn.","Bấm Dịch để xem nghĩa (1 từ tiếng Anh mở từ điển đầy đủ), Tô sáng để lưu, Hỏi AI để hỏi về đoạn đó.","Tìm từ điển, ghi chú, Google, YouTube — hoặc nhập địa chỉ trang web.","Dashboard, cài đặt nhanh, màu tô sáng và các lệnh trình duyệt."],"results":"Kết quả tìm kiếm","vne":"Tin Việt Nam bằng tiếng Anh, tra từ ngay trên trang","vneC":["Song ngữ","Từ điển"]},"en":{"greet":["Good morning","Good afternoon","Good evening"],"ask":"What do you want to explore today?","learn":"Learn with Keepit","more":"More sites","tips":"Keepit tips","yt":"Watch with bilingual subtitles, practise Speaking and Dictation","tt":"Read English news, translated paragraph by paragraph","ytC":["Subtitles","Speak","Write"],"ttC":["Bilingual","Read aloud"],"tipT":["Select text","Translate · Save · Ask AI","Purple search button","Keepit ☰"],"tipL":["Open any page, long-press a word or select text: the Keepit icon appears below the selection.","Tap Translate for the meaning (one English word opens the full dictionary), Highlight to keep it, Ask AI to ask about it.","Search the dictionary, notes, Google, YouTube — or type a web address.","Dashboard, quick settings, highlight colours and browser commands."],"results":"Search results","vne":"Vietnam news in English, look up words right on the page","vneC":["Bilingual","Dictionary"]},"ko":{"greet":["좋은 아침이에요","좋은 오후예요","좋은 저녁이에요"],"ask":"오늘은 무엇을 탐색할까요?","learn":"Keepit으로 배우기","more":"다른 사이트","tips":"Keepit 팁","yt":"이중 언어 자막으로 보고 말하기·받아쓰기 연습","tt":"영어 뉴스를 문단별 이중 언어로 읽기","ytC":["자막","말하기","받아쓰기"],"ttC":["이중 언어","읽기"],"tipT":["텍스트 선택","번역 · 저장 · AI에게 묻기","보라색 검색 버튼","Keepit ☰"],"tipL":["페이지를 열고 단어를 길게 누르거나 텍스트를 선택하면 선택 영역 아래에 Keepit 아이콘이 나타납니다.","번역을 누르면 뜻(영어 단어 하나는 전체 사전), 하이라이트로 저장, AI에게 묻기로 질문할 수 있습니다.","사전, 노트, Google, YouTube에서 검색하거나 웹 주소를 입력하세요.","대시보드, 빠른 설정, 하이라이트 색상과 브라우저 명령."],"results":"검색 결과","vne":"영어로 읽는 베트남 뉴스, 페이지에서 바로 단어 찾기","vneC":["이중 언어","사전"]}};
  const D = {"vi":{"edit":"Sửa","done":"Xong","add":"Thêm trang","editT":"Sửa trang","addT":"Thêm trang","name":"Tên","url":"Địa chỉ","del":"Xoá","cancel":"Huỷ","save":"Lưu","open":"Mở","reorder":"Sắp xếp lại","removed":"Đã xoá “{0}”","undo":"Hoàn tác","marked":"Đã đánh dấu · thêm vào Trang chủ","saved":"Đã lưu","ahT":"Thêm vào màn hình chính","ahNote":"Lối tắt trên màn hình chính sẽ mở trang này bằng Keepit.","ahAdd":"Thêm","ahDone":"Đã thêm “{0}” vào màn hình chính","badUrl":"Địa chỉ chưa đúng, ví dụ: vnexpress.net","badName":"Nhập tên","hint":"Kéo để sắp xếp · chạm để sửa · × để xoá","exists":"Trang này đã có trong Trang chủ","cont":"Tiếp tục học","vidK":"Video · Chép chính tả","readK":"Bài báo · Đọc song ngữ","sent":"{0}/{1} câu","readP":"Đã đọc {0}%","resume":"Mở lại phiên Chép · câu {0}/{1}","hist":"Lịch sử","histQ":"Tìm trong lịch sử","clearAll":"Xoá tất cả","today":"Hôm nay","yday":"Hôm qua","histEmpty":"Chưa có lịch sử","histNone":"Không tìm thấy","histCleared":"Đã xoá lịch sử","histDel":"Đã xoá khỏi lịch sử","zoom":"Cỡ chữ","zoomT":"Cỡ chữ trang","zoomTip":"Phóng to / thu nhỏ chữ trên trang web","reset":"Đặt lại","pdark":"Trang tối","pdarkTip":"Làm tối trang web khi app ở Chủ đề tối","pdarkLight":"Trang tối có tác dụng khi Chủ đề tối","offT":"Không có kết nối mạng","offP":"Kiểm tra Wi-Fi hoặc dữ liệu di động rồi thử lại.","retry":"Thử lại","goHome":"Về Trang chủ","stillOff":"Vẫn chưa có mạng","offTip":"Trong lúc chờ, vẫn mở được","offNotes":"Ghi chú đã lưu","shareT":"Chia sẻ","copy":"Sao chép","fromShare":"Đã mở link từ YouTube bằng Keepit","openWith":"Mở bằng","once":"Chỉ một lần","always":"Luôn chọn","linkIn":"Link trong Zalo: ","fromLink":"Đã mở link từ Zalo","alwaysDone":"Lần sau link sẽ mở thẳng bằng Keepit","ofaT":"Ối, rớt mạng rồi!","ofaP":"Mây Keepit ngủ một chút trong lúc chờ Wi-Fi. Có mạng lại, trang sẽ tự mở.","ofaCard":"Ôn từ trong lúc chờ","flipHint":"Chạm để lật","nextW":"Từ khác","awakeA":"Có mạng rồi!","ofbT":"Ơ, tuột dây mạng rồi!","ofbP":"Kiểm tra Wi-Fi hoặc dữ liệu di động nhé. Có mạng lại là Keepit tự nối.","autoIn":"Tự thử lại sau {0}s","trying":"Đang thử…","plugged":"Nối lại rồi!"},"en":{"edit":"Edit","done":"Done","add":"Add site","editT":"Edit site","addT":"Add site","name":"Name","url":"Address","del":"Delete","cancel":"Cancel","save":"Save","open":"Open","reorder":"Rearrange","removed":"Removed “{0}”","undo":"Undo","marked":"Bookmarked · added to Home","saved":"Saved","ahT":"Add to Home screen","ahNote":"The Home screen shortcut opens this page in Keepit.","ahAdd":"Add","ahDone":"Added “{0}” to Home screen","badUrl":"Enter a valid address, e.g. vnexpress.net","badName":"Enter a name","hint":"Drag to rearrange · tap to edit · × to remove","exists":"This page is already on Home","cont":"Continue learning","vidK":"Video · Dictation","readK":"Article · Bilingual reading","sent":"{0}/{1} sentences","readP":"{0}% read","resume":"Resuming dictation · sentence {0}/{1}","hist":"History","histQ":"Search history","clearAll":"Clear all","today":"Today","yday":"Yesterday","histEmpty":"No history yet","histNone":"No matches","histCleared":"History cleared","histDel":"Removed from history","zoom":"Text size","zoomT":"Page text size","zoomTip":"Make text on web pages bigger or smaller","reset":"Reset","pdark":"Dark pages","pdarkTip":"Darken web pages when the app theme is dark","pdarkLight":"Dark pages work with the dark theme","offT":"You're offline","offP":"Check Wi-Fi or mobile data, then try again.","retry":"Try again","goHome":"Go Home","stillOff":"Still offline","offTip":"While you wait, you can still open","offNotes":"Saved notes","shareT":"Share","copy":"Copy","fromShare":"Opened the YouTube link in Keepit","openWith":"Open with","once":"Just once","always":"Always","linkIn":"Link in Zalo: ","fromLink":"Opened link from Zalo","alwaysDone":"Links will open in Keepit from now on","ofaT":"Oops, no internet!","ofaP":"The Keepit cloud is napping until Wi-Fi is back. The page opens by itself when you're online.","ofaCard":"Review while you wait","flipHint":"Tap to flip","nextW":"Next word","awakeA":"You're back online!","ofbT":"Uh-oh, we got unplugged!","ofbP":"Check Wi-Fi or mobile data. Keepit reconnects by itself when you are back online.","autoIn":"Retrying in {0}s","trying":"Trying…","plugged":"Connected!"},"ko":{"edit":"편집","done":"완료","add":"사이트 추가","editT":"사이트 편집","addT":"사이트 추가","name":"이름","url":"주소","del":"삭제","cancel":"취소","save":"저장","open":"열기","reorder":"순서 변경","removed":"“{0}” 삭제됨","undo":"실행취소","marked":"북마크됨 · 홈에 추가","saved":"저장됨","ahT":"홈 화면에 추가","ahNote":"홈 화면 바로가기는 이 페이지를 Keepit에서 엽니다.","ahAdd":"추가","ahDone":"“{0}”을(를) 홈 화면에 추가함","badUrl":"올바른 주소를 입력하세요 (예: vnexpress.net)","badName":"이름을 입력하세요","hint":"끌어서 순서 변경 · 탭하여 편집 · ×로 삭제","exists":"이미 홈에 있는 페이지입니다","cont":"이어서 학습","vidK":"비디오 · 받아쓰기","readK":"기사 · 이중 언어 읽기","sent":"{0}/{1}문장","readP":"{0}% 읽음","resume":"받아쓰기 이어서 · {0}/{1}문장","hist":"방문 기록","histQ":"기록 검색","clearAll":"모두 삭제","today":"오늘","yday":"어제","histEmpty":"기록이 없습니다","histNone":"결과 없음","histCleared":"기록을 삭제함","histDel":"기록에서 삭제함","zoom":"글자 크기","zoomT":"페이지 글자 크기","zoomTip":"웹 페이지 글자를 크게 / 작게","reset":"초기화","pdark":"어두운 페이지","pdarkTip":"앱 테마가 어두우면 웹 페이지도 어둡게","pdarkLight":"어두운 페이지는 어두운 테마에서 작동합니다","offT":"인터넷 연결 없음","offP":"Wi-Fi 또는 모바일 데이터를 확인한 후 다시 시도하세요.","retry":"다시 시도","goHome":"홈으로","stillOff":"아직 오프라인입니다","offTip":"기다리는 동안 열 수 있어요","offNotes":"저장한 노트","shareT":"공유","copy":"복사","fromShare":"YouTube 링크를 Keepit에서 열었어요","openWith":"다음으로 열기","once":"한 번만","always":"항상","linkIn":"Zalo의 링크: ","fromLink":"Zalo 링크를 열었어요","alwaysDone":"이제 링크가 Keepit에서 바로 열려요","ofaT":"앗, 인터넷이 끊겼어요!","ofaP":"Wi-Fi가 돌아올 때까지 Keepit 구름이 잠깐 자고 있어요. 연결되면 페이지가 저절로 열려요.","ofaCard":"기다리는 동안 복습","flipHint":"눌러서 뒤집기","nextW":"다음 단어","awakeA":"다시 연결됐어요!","ofbT":"어라, 연결이 빠졌어요!","ofbP":"Wi-Fi나 모바일 데이터를 확인해 주세요. 연결되면 Keepit이 자동으로 다시 연결해요.","autoIn":"{0}초 후 다시 시도","trying":"시도 중…","plugged":"연결됐어요!"}};
  const SB = globalThis.LHN_SITE_BRANDS, SITES = SB.SITES; // js/shared/site-brands.js (dùng chung với Dashboard)
  const LOGO = "<img src=\"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0ibWFyayIgeDE9IjAiIHkxPSIxIiB4Mj0iMSIgeTI9IjAiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAiIHN0b3AtY29sb3I9IiM0ZjQ2ZTUiLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjOGI1Y2Y2Ii8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogICAgPGZpbHRlciBpZD0ic2hhZG93IiB4PSItMjUlIiB5PSItMTUlIiB3aWR0aD0iMTUwJSIgaGVpZ2h0PSIxNTUlIiBjb2xvci1pbnRlcnBvbGF0aW9uLWZpbHRlcnM9InNSR0IiPgogICAgICA8ZmVHYXVzc2lhbkJsdXIgaW49IlNvdXJjZUFscGhhIiBzdGREZXZpYXRpb249IjEuNSIvPgogICAgICA8ZmVPZmZzZXQgZHk9IjIiLz4KICAgICAgPGZlQ29tcG9uZW50VHJhbnNmZXI+PGZlRnVuY0EgdHlwZT0ibGluZWFyIiBzbG9wZT0iMC4yIi8+PC9mZUNvbXBvbmVudFRyYW5zZmVyPgogICAgICA8ZmVNZXJnZT48ZmVNZXJnZU5vZGUvPjxmZU1lcmdlTm9kZSBpbj0iU291cmNlR3JhcGhpYyIvPjwvZmVNZXJnZT4KICAgIDwvZmlsdGVyPgogIDwvZGVmcz4KICA8cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIGZpbGw9InVybCgjbWFyaykiIGZpbHRlcj0idXJsKCNzaGFkb3cpIiByeD0iOCIvPgogIDxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDMyIDApIHNjYWxlKC0xIDEpIj4KICA8ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtNC4xODcgLTIuMzkzKSBzY2FsZSgwLjI5OTA2NSkiPgogICAgPHBhdGggZmlsbD0iI2ZmZiIgZD0iTSAzNSAzMiBDIDM0IDMyIDMzLjUgMzQgMzMuMiAzNyBDIDMxLjMgNTEgMzQuMyA2NSA0MiA3NCBDIDQ4LjUgODEuNSA1NyA4NC42IDY3IDg0LjUgQyA3Ny41IDg0LjQgODQuMiA4MC4zIDg5LjcgNzMuNCBDIDkyLjUgNzcuMyA5NC4zIDgxLjUgOTUuNCA4Ni44IEMgOTUuOSA4OS42IDk3LjggOTAuOSA5OS45IDkwLjIgQyAxMDIuMSA4OS41IDEwMi45IDg3LjUgMTAxLjggODQuNyBDIDk4LjYgNzUuOSA5My4zIDY5LjQgODUuNCA2NS4xIEMgNzkuNyA2MiA3Mi45IDYxLjEgNjYuMSA1OS42IEMgNTguOSA1OCA1My4xIDU0LjkgNTEuNiA0OS40IEMgNTUuMyA1Mi44IDYwLjIgNTQuOCA2Ny41IDU1LjggQyA3OC43IDU3LjMgODcuNyA1OC4zIDk0LjcgNjUgQyA5Ny4zIDU0LjEgOTIgNDQuNSA4Mi41IDM5LjkgQyA3NS40IDM2LjQgNjggMzYuOCA1OS43IDM3LjYgQyA0OC42IDM4LjggNDEuOSAzOC42IDM2LjUgMzIuOCBDIDM2IDMyLjMgMzUuNSAzMiAzNSAzMiBaIi8+CiAgPC9nPgogIDwvZz4KPC9zdmc+Cg==\" alt=\"\" style=\"width:100%;height:100%;display:block\">";
  const V12CSS = ".dev.dark{--bg:#0e0e11;--pn:#18181b;--pn2:#232328;--bd:rgba(148,163,184,.17);--tx:#f4f4f5;--mu:#b4b4be;--acc:#8b5cf6;--acct:#c4b5fd;--tint:rgba(139,92,246,.16);--sh:0 10px 30px rgba(0,0,0,.45);--skel:rgba(255,255,255,.08)}\n.dev.light{--bg:#f6f7fb;--pn:#ffffff;--pn2:#eef0f4;--bd:rgba(15,23,42,.10);--tx:#111827;--mu:#52607a;--acc:#8b5cf6;--acct:#6d28d9;--tint:rgba(139,92,246,.11);--sh:0 10px 30px rgba(15,23,42,.12);--skel:rgba(15,23,42,.08)}\n.ic{flex:none;display:grid;place-items:center;overflow:hidden;box-shadow:inset 0 0 0 1px rgba(127,127,127,.18)}\n.ic svg{width:100%;height:100%}\n.secT{display:flex;align-items:center;justify-content:space-between;margin:22px 4px 10px;font-size:13px;font-weight:700;letter-spacing:.01em;color:var(--mu)}\n.press{transition:transform .14s ease,background .14s}\n.press:active{transform:scale(.95)}\nbutton{-webkit-tap-highlight-color:transparent}\n:focus-visible{outline:2px solid var(--acc);outline-offset:2px}\n\n/* ô tìm kiếm trên trang chủ = nút mở popup tìm kiếm Keepit */\n.srch{display:flex;align-items:center;gap:10px;width:100%;height:52px;padding:0 8px 0 16px;border-radius:26px;background:var(--pn);border:1px solid var(--bd);box-shadow:0 12px 30px rgba(30,20,80,.25);cursor:text;text-align:left;color:var(--mu);font-size:15.5px}\n.srch svg{width:20px;height:20px;flex:none}\n.srch span{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n.srch i{flex:none;width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:#9c27b0;color:#fff;font-style:normal}\n.dev.dark .srch i{background:#8b5cf6}\n.srch i svg{width:19px;height:19px}\n/* ---------------- Trang chủ (kiểu B) ---------------- */\n.hb{min-height:100%;padding-bottom:calc(var(--bh,80px) + 24px)}\n.hbh{position:relative;padding:14px 18px 24px;border-radius:0 0 30px 30px;overflow:hidden;\n  background:radial-gradient(120% 90% at 0% 0%,rgba(99,102,241,.55),transparent 60%),radial-gradient(90% 80% at 100% 10%,rgba(168,85,247,.45),transparent 60%),var(--pn2)}\n.dev.light .hbh{background:radial-gradient(120% 90% at 0% 0%,rgba(99,102,241,.28),transparent 60%),radial-gradient(90% 80% at 100% 10%,rgba(168,85,247,.24),transparent 60%),#eceaff}\n.hbh .in{max-width:720px;margin:0 auto}\n.hbh .top{display:flex;align-items:center;gap:9px;font-weight:800;font-size:17px;letter-spacing:-.01em}\n.hbh h1{margin:22px 0 2px;font-size:27px;line-height:1.15;letter-spacing:-.025em}\n.hbh .ask{margin:0 0 16px;color:var(--mu);font-size:14.5px}\n.bb{max-width:720px;margin:0 auto;padding:0 16px}\n.feat{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}\n.dev[data-o=p][data-d=phone] .feat{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}\n.dev[data-o=p][data-d=phone] .fc.yt{grid-column:1/-1;min-height:150px}\n.fc{position:relative;display:flex;flex-direction:column;align-items:flex-start;text-align:left;border:0;border-radius:24px;padding:14px;min-height:178px;color:#fff;cursor:pointer;overflow:hidden;box-shadow:var(--sh)}\n.fc::after{content:\"\";position:absolute;right:-30px;bottom:-40px;width:130px;height:130px;border-radius:50%;background:rgba(255,255,255,.1)}\n.fc.yt{background:linear-gradient(150deg,#ff3b5c 0%,#c4002f 55%,#62001a 100%)}\n.fc.tt{background:linear-gradient(150deg,#2b8ae0 0%,#0b5aa8 55%,#062c55 100%)}\n.fc.vne{background:linear-gradient(150deg,#c8407a 0%,#9f234f 55%,#4f0f27 100%)}\n.dev .fc{color:#fff}\n.fc .ic{width:42px;height:42px;border-radius:13px}\n.fc .ar{position:absolute;right:12px;top:12px;width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,.18);display:grid;place-items:center}\n.fc .ar svg{width:17px;height:17px}\n.fc b{margin-top:12px;font-size:17px;letter-spacing:-.01em}\n.fc p{margin:3px 0 12px;font-size:12.5px;line-height:1.4;opacity:.92}\n.fc .chips{margin-top:auto;display:flex;flex-wrap:wrap;gap:5px;position:relative;z-index:1}\n.fc .chips span{font-size:11px;font-weight:650;padding:3px 8px;border-radius:999px;background:rgba(255,255,255,.2)}\n.slist{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px}\n.si{display:flex;align-items:center;gap:11px;border:1px solid var(--bd);background:var(--pn);border-radius:18px;padding:10px;cursor:pointer;text-align:left;min-height:60px}\n.si:hover{border-color:rgba(139,92,246,.5)}\n.si .ic{width:40px;height:40px;border-radius:12px}\n.si div{min-width:0}\n.si b{display:block;font-size:14px;font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n.si small{display:block;font-size:11.5px;color:var(--mu);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n.tips{display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x mandatory;margin:0 -16px;padding:0 16px 4px;scrollbar-width:none}\n.tp{flex:0 0 min(78%,320px);scroll-snap-align:start;scroll-margin-left:16px;border-radius:20px;padding:14px;background:var(--pn);border:1px solid var(--bd)}\n.tp .n{width:30px;height:30px;border-radius:10px;background:var(--tint);color:var(--acct);display:grid;place-items:center}\n.tp .n svg{width:17px;height:17px}\n.tp b{display:block;margin:10px 0 4px;font-size:14.5px}\n.tp p{margin:0;font-size:13px;color:var(--mu);line-height:1.5}\n.dots{display:flex;justify-content:center;gap:6px;margin-top:10px}\n.dots i{width:6px;height:6px;border-radius:3px;background:var(--bd);transition:width .2s,background .2s}\n.dots i.on{width:18px;background:var(--acc)}\n.dev[data-o=l] .hbh{padding:12px 24px 18px}\n.dev[data-o=l] .hbh .in,.dev[data-o=l] .bb{max-width:1040px}\n.dev[data-o=l] .hbh .row{display:flex;flex-direction:column;align-items:center;text-align:center}\n.dev[data-o=l] .hbh .row .srch{width:min(720px,100%)}\n.dev[data-o=l] .hbh h1{margin-top:4px;font-size:24px}\n.dev[data-o=l] .hbh .ask{margin:0 0 12px}\n.dev[data-o=l] .bb{padding:0 24px}\n.dev[data-o=l] .fc{min-height:132px}\n.dev[data-o=l] .slist{grid-template-columns:repeat(4,minmax(0,1fr))}\n.dev[data-o=l] .tips{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));margin:0;padding:0;overflow:visible}\n.dev[data-o=l] .dots{display:none}\n.dev[data-o=l][data-d=tablet] .hbh{padding:22px 32px 34px}\n.dev[data-o=l][data-d=tablet] .hbh h1{margin-top:18px;font-size:30px}\n.dev[data-o=l][data-d=tablet] .hbh .ask{margin-bottom:18px;font-size:15px}\n.dev[data-o=l][data-d=tablet] .fc{min-height:168px}\n\n/* v5: kéo từ trên cùng để tải lại (như Chrome / Edge / Safari) */\n.ptr{position:absolute;left:50%;top:0;z-index:60;width:40px;height:40px;margin-left:-20px;border-radius:50%;display:grid;place-items:center;background:var(--pn);border:1px solid var(--bd);box-shadow:0 6px 18px rgba(0,0,0,.28);transform:translateY(-52px);opacity:0;pointer-events:none}\n.ptr.anim{transition:transform .22s cubic-bezier(.2,.8,.2,1),opacity .22s}\n.ptr svg{width:24px;height:24px;fill:none;stroke-linecap:round}\n.ptr .trk{stroke:rgba(139,92,246,.18);stroke-width:2.6}\n.ptr .arc{stroke:url(#kpg);stroke-width:2.6;stroke-dasharray:0 100;transition:stroke-dasharray .08s}\n.ptr .arw{stroke:#8b5cf6;stroke-width:2.4;stroke-linejoin:round;opacity:.35}\n.ptr.ready .arw{opacity:1}\n.ptr.spin svg{animation:ptrspin .8s linear infinite}\n.ptr.spin .arw{opacity:0}\n.ptr.spin .arc{stroke-dasharray:22 100}\n@keyframes ptrspin{to{transform:rotate(360deg)}}\n/* ---------------- v6: Trang web khác sửa được · Đánh dấu · Thêm màn hình ---------------- */\n.secA{border:0;background:none;color:var(--mu);font:inherit;font-weight:700;font-size:13px;padding:4px 10px;margin:-4px -6px -4px 0;border-radius:10px;cursor:pointer}\n.secA:active{background:var(--pn2)}\n.edh{font-size:12px;color:var(--mu);margin:-4px 4px 10px}\n.slist .si{position:relative;-webkit-user-select:none;user-select:none}\n.si.add{border-style:dashed;color:var(--mu)}\n.si.add .ic{background:var(--tint);color:var(--acct);box-shadow:none}\n.si.add .ic svg{width:20px;height:20px}\n.si.add b{color:var(--mu)}\n.ic.lt{color:#fff;font-weight:800;font-size:18px;font-family:system-ui,sans-serif}\n.si .x{position:absolute;top:-7px;right:-7px;width:24px;height:24px;border-radius:50%;background:#71717a;color:#fff;border:2px solid var(--bg);display:none;place-items:center;padding:0;cursor:pointer}\n.si .x svg{width:11px;height:11px;stroke-width:3.2}\n.slist.ed .si[data-bm]{touch-action:none;cursor:grab;border-color:rgba(139,92,246,.45);animation:wob .32s ease-in-out infinite alternate}\n.slist.ed .si[data-bm]:nth-child(2n){animation-delay:-.16s}\n.slist.ed .si .x{display:grid}\n@keyframes wob{from{rotate:-.6deg}to{rotate:.6deg}}\n.si.drag{z-index:5;box-shadow:0 16px 34px rgba(0,0,0,.38);cursor:grabbing;transition:none!important;animation:none!important;pointer-events:none}\n.si.settle{transition:transform .18s cubic-bezier(.2,.8,.2,1)!important}\n.snk{position:absolute;left:50%;bottom:calc(var(--bh,80px) + 26px);z-index:59;display:flex;align-items:center;gap:6px;width:max-content;max-width:calc(100% - 28px);padding:6px 6px 6px 16px;border-radius:14px;background:rgba(24,24,27,.96);color:#fafafa;font-size:13.5px;font-weight:600;box-shadow:0 10px 28px rgba(0,0,0,.35);transform:translate(-50%,10px);opacity:0;pointer-events:none;transition:opacity .2s,transform .2s}\n.snk.on{opacity:1;transform:translate(-50%,0);pointer-events:auto}\n.snk span{min-width:0;padding:6px 0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.snk button{flex:none;border:0;background:none;color:#c4b5fd;font:inherit;font-weight:750;padding:7px 10px;border-radius:9px;cursor:pointer}\n.snk button:active{background:rgba(196,181,253,.15)}\n.snk:not(.act){padding-right:16px}\n.dlgw{position:absolute;inset:0;z-index:82;display:flex;align-items:flex-end;justify-content:center}\n.dlgs{position:absolute;inset:0;background:rgba(0,0,0,.48);opacity:0;transition:opacity .22s}\n.dlg{position:relative;width:100%;box-sizing:border-box;background:var(--pn);color:var(--tx);border-radius:26px 26px 0 0;padding:10px 18px calc(16px + var(--gi));box-shadow:0 -10px 40px rgba(0,0,0,.35);transform:translateY(100%);transition:transform .28s cubic-bezier(.2,.8,.2,1)}\n.dlgw.on .dlgs{opacity:1}\n.dlgw.on .dlg{transform:none}\n.dlg .grip{width:38px;height:4px;border-radius:2px;background:var(--mu);opacity:.35;margin:0 auto 14px}\n.dev[data-o=l] .dlgw{align-items:center}\n.dev[data-o=l] .dlg{width:min(400px,calc(100% - 40px));border-radius:24px;padding:18px 18px 14px;transform:scale(.96);opacity:0;transition:transform .2s,opacity .2s}\n.dev[data-o=l] .dlgw.on .dlg{transform:none;opacity:1}\n.dev[data-o=l] .dlg .grip{display:none}\n.dev[data-o=l][data-d=phone] .dlg{max-height:calc(100% - 24px);overflow:auto;padding:14px 18px 10px}\n.dh{display:flex;align-items:center;gap:12px;margin-bottom:14px;min-width:0}\n.dh b{font-size:17px;letter-spacing:-.01em;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.dh small{display:block;font-size:12px;color:var(--mu);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.dh>div{min-width:0}\n.dh .ic{width:42px;height:42px;border-radius:13px}\n.fl{display:block;margin-bottom:12px}\n.fl>span{display:block;font-size:12px;font-weight:650;color:var(--mu);margin:0 0 6px 2px}\n.fl input{width:100%;box-sizing:border-box;height:46px;border-radius:14px;border:1.5px solid var(--bd);background:var(--pn2);color:var(--tx);padding:0 14px;font:inherit;font-size:15px;outline:none}\n.fl input:focus{border-color:#8b5cf6;box-shadow:0 0 0 3px rgba(139,92,246,.2)}\n.fl .em{display:none;color:#ef4444;font-size:12px;margin:5px 2px 0}\n.fl.err input{border-color:#ef4444}\n.fl.err .em{display:block}\n.dact{display:flex;align-items:center;gap:6px;margin-top:4px}\n.dact .sp{flex:1}\n.dbtn{height:42px;padding:0 18px;border-radius:21px;border:0;background:transparent;color:var(--acct);font:inherit;font-weight:700;font-size:14.5px;cursor:pointer}\n.dbtn.pri{background:linear-gradient(135deg,#4f46e5,#8b5cf6);color:#fff;box-shadow:0 4px 14px rgba(99,70,229,.35)}\n.dbtn.del{color:#ef4444;padding:0 12px}\n.dbtn:active{transform:scale(.96)}\n.mi{display:flex;align-items:center;gap:14px;width:100%;height:50px;border:0;background:none;color:var(--tx);font:inherit;font-size:15px;font-weight:550;padding:0 8px;border-radius:12px;cursor:pointer;text-align:left}\n.mi svg{width:21px;height:21px;color:var(--mu)}\n.mi.red,.mi.red svg{color:#ef4444}\n.mi:active{background:var(--pn2)}\n.ahp{display:flex;align-items:center;gap:14px;padding:14px;border-radius:18px;background:var(--pn2);margin-bottom:10px}\n.ahi{position:relative;width:56px;height:56px;flex:none}\n.ahi .ic{width:56px;height:56px;border-radius:16px;font-size:24px}\n.ahi .bd{position:absolute;right:-6px;bottom:-6px;width:24px;height:24px;border-radius:7px;box-shadow:0 0 0 2.5px var(--pn2);overflow:hidden}\n.ahp .fl{flex:1;min-width:0;margin:0}\n.ahp .fl input{background:var(--pn)}\n.ahp small{display:block;margin:6px 2px 0;font-size:11.5px;color:var(--mu);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.dnote{display:flex;align-items:center;gap:8px;margin:0 2px 8px;font-size:12.5px;color:var(--mu);line-height:1.4}\n.dnote svg{width:16px;height:16px;flex:none;color:var(--acct)}\n/* ---------------- v10: Tiếp tục học · Lịch sử · Cỡ chữ · Trang tối · Mất mạng · mở link từ app khác ---------------- */\n.conts{display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x mandatory;margin:0 -16px;padding:2px 16px 4px;scrollbar-width:none}\n.conts::-webkit-scrollbar{display:none}\n.cc{flex:0 0 min(86%,360px);scroll-snap-align:start;scroll-margin-left:16px;display:flex;gap:12px;align-items:center;padding:12px;border-radius:20px;background:var(--pn);border:1px solid var(--bd);text-align:left;color:inherit;cursor:pointer;font:inherit}\n.dev[data-o=l] .conts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));margin:0;padding:0;overflow:visible}\n.cc .th{position:relative;flex:none;width:62px;height:62px;border-radius:16px;display:grid;place-items:center;color:#fff;overflow:hidden}\n.cc .th.v{background:linear-gradient(150deg,#ff3b5c,#9b0026)}\n.cc .th.a{background:linear-gradient(150deg,#2b8ae0,#084a8c)}\n.cc .th svg{width:26px;height:26px}\n.cc .th .ic{width:38px;height:38px;border-radius:11px;box-shadow:none}\n.cc .bd{flex:1;min-width:0}\n.cc small{display:block;font-size:11.5px;font-weight:650;color:var(--acct);margin-bottom:3px}\n.cc b{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font-size:14px;line-height:1.3;font-weight:650}\n.cc .pb{display:flex;align-items:center;gap:8px;margin-top:8px;font-size:11.5px;color:var(--mu);white-space:nowrap}\n.cc .pb i{flex:1;height:5px;border-radius:3px;background:var(--pn2);overflow:hidden}\n.cc .pb i::after{content:\"\";display:block;height:100%;width:var(--p);border-radius:3px;background:linear-gradient(90deg,#4f46e5,#8b5cf6)}\n.cc .go{flex:none;width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,#4f46e5,#8b5cf6);color:#fff;box-shadow:0 4px 12px rgba(99,70,229,.35)}\n.cc .go svg{width:15px;height:15px}\n.zprev{padding:14px 16px;border-radius:16px;background:var(--pn2);margin-bottom:14px;line-height:1.45;min-height:96px;display:flex;align-items:center}\n.zrow{display:flex;align-items:center;gap:12px;margin-bottom:6px}\n.zrow span{flex:none;font-weight:700;color:var(--mu)}\n.zrow input{flex:1;accent-color:#7c3aed;height:28px}\n.zrow output{flex:none;width:48px;text-align:right;font-weight:700;font-variant-numeric:tabular-nums}\n/* Lịch sử */\n.dlg.big{height:min(85%,680px);display:flex;flex-direction:column}\n.dev[data-o=l] .dlg.big{height:min(calc(100% - 24px),560px);width:min(440px,calc(100% - 40px))}\n.dh .sp{flex:1}\n.hsrch{display:flex;align-items:center;gap:10px;height:44px;padding:0 14px;border-radius:14px;background:var(--pn2);border:1.5px solid transparent;margin-bottom:8px;color:var(--mu)}\n.hsrch:focus-within{border-color:#8b5cf6}\n.hsrch svg{width:18px;height:18px;flex:none}\n.hsrch input{flex:1;min-width:0;border:0;background:none;outline:none;color:var(--tx);font:inherit;font-size:15px}\n.hl{flex:1;min-height:0;overflow-y:auto;margin:0 -6px;padding:0 6px;scrollbar-width:none}\n.hg{font-size:12px;font-weight:700;color:var(--mu);margin:12px 4px 6px}\n.hi{display:flex;align-items:center;gap:12px;padding:8px 6px;border-radius:14px;cursor:pointer}\n.hi:active{background:var(--pn2)}\n.hi .ic{width:36px;height:36px;border-radius:11px;font-size:15px}\n.hi>div{flex:1;min-width:0}\n.hi b{display:block;font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n.hi small{display:block;font-size:11.5px;color:var(--mu);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n.hx{flex:none;width:32px;height:32px;border:0;border-radius:50%;background:none;color:var(--mu);display:grid;place-items:center;cursor:pointer}\n.hx:active{background:var(--pn2)}\n.hx svg{width:15px;height:15px}\n.hemp{padding:40px 0;text-align:center;color:var(--mu);font-size:14px}";
  // app-only labels added in v3.5.175 (en / vi / ko)
  Object.assign(D.vi, { ahNo:"Màn hình chính của máy chưa hỗ trợ lối tắt", noSite:"Chưa có trang nào", sPh:"Tìm hoặc nhập địa chỉ web", zPrev:"Keepit giúp bạn hiểu, học và nhớ những gì bạn đọc." });
  Object.assign(D.en, { ahNo:"Your Home screen app does not support shortcuts", noSite:"No sites yet", sPh:"Search or type a web address", zPrev:"Keepit helps you understand, learn from and remember what you read." });
  Object.assign(D.ko, { ahNo:"홈 화면 앱이 바로가기를 지원하지 않습니다", noSite:"아직 사이트가 없습니다", sPh:"검색하거나 웹 주소 입력", zPrev:"Keepit은 읽은 내용을 이해하고 배우고 기억하도록 도와줍니다." });

  let settings = {}, bms = [], hist = [], cont = {}, sessions = [], pageDarkOn = true, zoomNow = 100, loaded = false;
  const DARK_Q = matchMedia("(prefers-color-scheme: dark)");
  const lang = () => { const c = globalThis.LHN_LANGUAGES?.languageFor?.(settings) || "en"; return ["vi", "en", "ko"].includes(c) ? c : "en"; };
  const isDark = () => settings.sidebarTheme === "dark" || (settings.sidebarTheme !== "light" && DARK_Q.matches);
  const d = (k, ...a) => { let x = (D[lang()] || D.en)[k] ?? D.en[k] ?? k; a.forEach((v, i) => { x = String(x).split(`{${i}}`).join(v); }); return x; };
  const h = () => H[lang()] || H.en;
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
  const UI = k => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${P[k] || ""}</svg>`;
  const hostOf = u => String(u).replace(/^https?:\/\//i, "").split(/[/?#]/)[0].toLowerCase();
  const bare = u => String(u || "").replace(/^https?:\/\//i, "").replace(/#.*$/, "").replace(/\/+$/, "");
  const full = u => /^https?:\/\//i.test(u) ? u : "https://" + u;
  const siteByHost = SB.byHost;
  const icon = s => `<span class="ic" style="background:${s.bg}">${s.svg}</span>`;
  const letterOf = b => SB.letter(b.name, b.url);
  const colourOf = b => SB.colour(b.url);
  function bmIcon(b) {
    const sx = siteByHost(hostOf(b.url)); if (sx) return icon(sx);
    return `<span class="ic lt" style="background:${colourOf(b)}">${esc(letterOf(b))}</span>`;
  }
  const save = (key, value) => API.storage.local.set({ [key]:value }).catch(() => {});
  const DEFAULT_BMS = () => SITES.filter(x => !["yt", "tt", "vne"].includes(x.id)).map((x, i) => ({ id:"b" + i, name:x.name, url:x.host }));
  const newId = () => "b" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const curUrl = () => bare(location.href);
  const markOf = () => bms.find(b => bare(b.url) === curUrl());
  // ------------------------------------------------------------------ dialogs + snackbar (own shadow root)
  const DLG_CSS = `:host{all:initial}
.dev{position:fixed;inset:0;pointer-events:none;color:var(--tx);font:15px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,"Noto Sans",sans-serif;-webkit-font-smoothing:antialiased;--gi:env(safe-area-inset-bottom,0px);--bh:92px}
.dev *{box-sizing:border-box}.dev svg{display:block}
.dlgw,.snk.on{pointer-events:auto}
.dev[data-o=l]{--bh:80px}
${V12CSS}${globalThis.LHN_THEME?.scrollbar || ""}`;
  let dlgHost = null, dlgRoot = null;
  function dlgDev() {
    if (!dlgHost) {
      dlgHost = document.createElement("div");
      dlgHost.setAttribute("style", "all:initial;position:fixed;inset:0;z-index:2147483600;pointer-events:none;");
      dlgRoot = dlgHost.attachShadow({ mode:"closed" });
      dlgRoot.innerHTML = `<style>${DLG_CSS}</style><div class="dev"></div>`;
    }
    if (!dlgHost.isConnected) document.documentElement.appendChild(dlgHost);
    const dev = dlgRoot.querySelector(".dev");
    dev.className = "dev " + (isDark() ? "dark" : "light"); dev.dataset.o = innerWidth > innerHeight ? "l" : "p";
    dev.dataset.d = Math.min(innerWidth, innerHeight) >= 600 ? "tablet" : "phone";
    return dev;
  }
  let snkT = 0;
  function snack(text, act, fn) {
    const dev = dlgDev(); let el = dev.querySelector(".snk");
    if (!el) { el = document.createElement("div"); el.className = "snk"; dev.appendChild(el); }
    el.innerHTML = `<span>${esc(text)}</span>${act ? `<button type="button">${esc(act)}</button>` : ""}`; el.classList.toggle("act", !!act);
    if (act) el.querySelector("button").onclick = ev => { ev.stopPropagation(); el.classList.remove("on"); fn(); };
    requestAnimationFrame(() => el.classList.add("on")); clearTimeout(snkT); snkT = setTimeout(() => el.classList.remove("on"), act ? 4000 : 2200);
  }
  let dlgOpen = null;
  function dlg(html, onAct, cls = "") {
    closeDlg(true); const dev = dlgDev(); dev.querySelector(".snk")?.classList.remove("on");
    const w = document.createElement("div"); w.className = "dlgw";
    w.innerHTML = `<div class="dlgs"></div><div class="dlg ${cls}" role="dialog" aria-modal="true"><div class="grip"></div>${html}</div>`;
    dev.appendChild(w); dlgOpen = w; requestAnimationFrame(() => w.classList.add("on"));
    w.addEventListener("click", ev => { ev.stopPropagation(); if (ev.target.classList.contains("dlgs")) return closeDlg(); const b = ev.target.closest("[data-d]"); if (b) onAct(b.dataset.d, w); });
    w.addEventListener("keydown", ev => { if (ev.key === "Enter" && ev.target.tagName === "INPUT") { ev.preventDefault(); onAct("save", w); } });
    // drag the grip / header down = close (like the Keepit sheets)
    const panel = w.querySelector(".dlg"); let y0 = null, dy = 0;
    panel.addEventListener("touchstart", e => { if (e.touches.length !== 1 || e.target.closest("input,.hl,button")) return; y0 = e.touches[0].clientY; dy = 0; panel.style.transition = "none"; }, { passive:true });
    panel.addEventListener("touchmove", e => { if (y0 === null) return; dy = Math.max(0, e.touches[0].clientY - y0); panel.style.transform = dy ? `translateY(${dy}px)` : ""; if (dy && e.cancelable) e.preventDefault(); }, { passive:false });
    const end = () => { if (y0 === null) return; y0 = null; panel.style.transition = ""; panel.style.transform = ""; if (dy > Math.min(110, panel.offsetHeight * .3)) closeDlg(); };
    panel.addEventListener("touchend", end); panel.addEventListener("touchcancel", end);
    return w;
  }
  function closeDlg(now) {
    const w = dlgOpen; if (!w) return false; dlgOpen = null;
    if (now) { w.remove(); return true; }
    w.classList.remove("on"); setTimeout(() => w.remove(), 260); return true;
  }
  addEventListener("keydown", e => { if (e.key === "Escape" && dlgOpen) closeDlg(); }, true);

  // ------------------------------------------------------------------ bookmarks (☰ Đánh dấu + Trang web khác)
  function parseAddr(v) {
    let u = bare(String(v || "").trim());
    const hst = hostOf(u);
    if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(hst)) return null;
    return hst + u.slice(hst.length);
  }
  const saveBms = () => save(K.bm, bms);
  function editDlg(b, isNew) {
    const w = dlg(`<div class="dh"><span id="dic">${bmIcon(b)}</span><div><b>${esc(d(isNew && !b.url ? "addT" : "editT"))}</b></div></div>
    <label class="fl" id="fn"><span>${esc(d("name"))}</span><input id="dn" autocomplete="off" value="${esc(b.name)}"><div class="em">${esc(d("badName"))}</div></label>
    <label class="fl" id="fu"><span>${esc(d("url"))}</span><input id="du" inputmode="url" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="vnexpress.net" value="${esc(b.url)}"><div class="em">${esc(d("badUrl"))}</div></label>
    <div class="dact">${isNew ? "" : `<button class="dbtn del" type="button" data-d="del">${esc(d("del"))}</button>`}<span class="sp"></span><button class="dbtn" type="button" data-d="cancel">${esc(d("cancel"))}</button><button class="dbtn pri" type="button" data-d="save">${esc(d("save"))}</button></div>`,
    (a, w) => {
      if (a === "cancel") return closeDlg();
      if (a === "del") { closeDlg(); return removeBm(b.id); }
      const n = w.querySelector("#dn").value.trim(), p = parseAddr(w.querySelector("#du").value);
      w.querySelector("#fn").classList.toggle("err", !n); w.querySelector("#fu").classList.toggle("err", !p);
      if (!n || !p) return;
      if (isNew && bms.some(x => bare(x.url) === p)) { closeDlg(); return snack(d("exists")); }
      Object.assign(b, { name:n, url:p });
      if (isNew) bms.push(b);
      saveBms(); closeDlg(); refreshMore(); snack(d("saved"));
    });
    const upd = () => { const p = parseAddr(w.querySelector("#du").value); w.querySelector("#dic").innerHTML = bmIcon({ name:w.querySelector("#dn").value, url:p || w.querySelector("#du").value || "?" }); };
    w.querySelector("#du").addEventListener("input", () => { w.querySelector("#fu").classList.remove("err"); upd(); });
    w.querySelector("#dn").addEventListener("input", () => { w.querySelector("#fn").classList.remove("err"); upd(); });
    setTimeout(() => (isNew && !b.url ? w.querySelector("#du") : null)?.focus({ preventScroll:true }), 300);
  }
  function menuDlg(b) {
    dlg(`<div class="dh">${bmIcon(b)}<div><b>${esc(b.name)}</b><small>${esc(b.url)}</small></div></div>
    <button class="mi" type="button" data-d="open">${UI("openR")}${esc(d("open"))}</button>
    <button class="mi" type="button" data-d="edit">${UI("pen")}${esc(d("editT"))}</button>
    <button class="mi" type="button" data-d="sort">${UI("grid")}${esc(d("reorder"))}</button>
    <button class="mi red" type="button" data-d="del">${UI("trash")}${esc(d("del"))}</button>`,
    a => { closeDlg(true);
      if (a === "open") openBm(b); else if (a === "edit") editDlg(b); else if (a === "sort") setEdit(true); else if (a === "del") removeBm(b.id); });
  }
  function removeBm(id) {
    const i = bms.findIndex(x => x.id === id); if (i < 0) return; const [b] = bms.splice(i, 1);
    saveBms(); refreshMore(); globalThis.LHN_BAR_HOOKS?.refresh?.();
    snack(d("removed", b.name), d("undo"), () => { bms.splice(Math.min(i, bms.length), 0, b); saveBms(); refreshMore(); });
  }
  function openBm(b) { edit = false; location.href = full(b.url); }
  // ------------------------------------------------------------------ start page (Kiểu B)
  let homeRoot = null, edit = false;
  const HOME_CSS = `:host{all:initial;display:block}
.dev{position:relative;min-height:100vh;background:var(--bg);color:var(--tx);font:15px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,"Noto Sans",sans-serif;-webkit-font-smoothing:antialiased;--bh:92px;--gi:0px}
.dev *{box-sizing:border-box}.dev svg{display:block}.dev button{font:inherit;color:inherit}
.dev[data-o=l]{--bh:80px}
.hbh{padding-top:calc(14px + env(safe-area-inset-top,0px))}
.semp{grid-column:1/-1;padding:14px;text-align:center;color:var(--mu);font-size:13px;border:1px dashed var(--bd);border-radius:18px}
${V12CSS}${globalThis.LHN_THEME?.scrollbar || ""}`;
  const searchPill = () => { const ph = d("sPh"); return `<button class="srch" data-act="search" aria-label="${esc(ph)}">${UI("search")}<span>${esc(ph)}</span><i>${UI("search")}</i></button>`; };
  function bmTiles() {
    return (bms.length || edit ? "" : `<div class="semp">${esc(d("noSite"))}</div>`) +
      bms.map(b => `<div class="si press" role="button" tabindex="0" data-bm="${esc(b.id)}">${bmIcon(b)}<div><b>${esc(b.name)}</b><small>${esc(hostOf(b.url))}</small></div><button class="x" type="button" data-x="${esc(b.id)}" aria-label="${esc(d("del"))}">${UI("x")}</button></div>`).join("") +
      (edit ? `<button class="si add press" type="button" data-act="bmAdd"><span class="ic">${UI("plus")}</span><div><b>${esc(d("add"))}</b></div></button>` : "");
  }
  const homeMore = () => `<div class="secT"><span>${esc(h().more)}</span><button class="secA" type="button" data-act="bmEdit">${esc(d(edit ? "done" : "edit"))}</button></div>
      ${edit ? `<div class="edh">${esc(d("hint"))}</div>` : ""}<div class="slist${edit ? " ed" : ""}" id="slist">${bmTiles()}</div>`;
  function refreshMore() { const w = homeRoot?.getElementById("more"); if (w) { w.innerHTML = homeMore(); wireTiles(); } }
  function setEdit(on) { edit = on; refreshMore(); }
  function lastSession() {
    return sessions.filter(s => s && s.url && s.status !== "complete" && s.totalCount > 0).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))[0] || null;
  }
  function contCards() {
    const v = lastSession(), r = cont.read && cont.read.pct < 98 ? cont.read : null;
    if (!v && !r) return "";
    const vp = v ? Math.round(v.solvedCount / v.totalCount * 100) : 0, rs = r ? siteByHost(r.host) : null;
    return `<div class="secT"><span>${esc(d("cont"))}</span></div><div class="conts">
    ${v ? `<button class="cc press" type="button" data-act="contV"><span class="th v">${UI("play")}</span><span class="bd"><small>${esc(d("vidK"))}</small><b>${esc(v.title || bare(v.url))}</b><span class="pb"><i style="--p:${vp}%"></i>${esc(d("sent", v.solvedCount, v.totalCount))}</span></span><span class="go">${UI("chevR")}</span></button>` : ""}
    ${r ? `<button class="cc press" type="button" data-act="contR"><span class="th a">${rs ? icon(rs) : bmIcon({ name:r.title, url:r.host })}</span><span class="bd"><small>${esc(d("readK"))}</small><b>${esc(r.title)}</b><span class="pb"><i style="--p:${r.pct}%"></i>${esc(d("readP", r.pct))}</span></span><span class="go">${UI("chevR")}</span></button>` : ""}
  </div>`;
  }
  function homeHTML() {
    const L = h(), hr = new Date().getHours(), g = L.greet[hr < 12 ? 0 : hr < 18 ? 1 : 2], yt = SITES.find(s => s.id === "yt"), tt = SITES.find(s => s.id === "tt"), vne = SITES.find(s => s.id === "vne");
    const tipIco = ["sel", "lang", "search", "menu"];
    return `<div class="hb">
    <div class="hbh"><div class="in">
      <div class="top"><span style="width:30px;height:30px;display:block">${LOGO}</span>Keepit</div>
      <div class="row"><div><h1>${esc(g)}</h1><p class="ask">${esc(L.ask)}</p></div>${searchPill()}</div>
    </div></div>
    <div class="bb">
      <div id="cont">${contCards()}</div>
      <div class="secT"><span>${esc(L.learn)}</span></div>
      <div class="feat">
        <button class="fc yt press" data-open="https://www.youtube.com/">${icon(yt)}<span class="ar">${UI("arrowUR")}</span><b>YouTube</b><p>${esc(L.yt)}</p><span class="chips">${L.ytC.map(c => `<span>${esc(c)}</span>`).join("")}</span></button>
        <button class="fc tt press" data-open="https://news.tuoitre.vn/">${icon(tt)}<span class="ar">${UI("arrowUR")}</span><b>Tuổi Trẻ News</b><p>${esc(L.tt)}</p><span class="chips">${L.ttC.map(c => `<span>${esc(c)}</span>`).join("")}</span></button>
        <button class="fc vne press" data-open="https://e.vnexpress.net/">${icon(vne)}<span class="ar">${UI("arrowUR")}</span><b>VnExpress International</b><p>${esc(L.vne)}</p><span class="chips">${L.vneC.map(c => `<span>${esc(c)}</span>`).join("")}</span></button>
      </div>
      <div id="more">${homeMore()}</div>
      <div class="secT"><span>${esc(L.tips)}</span></div>
      <div class="tips" id="tips">${L.tipL.map((x, i) => `<div class="tp"><span class="n">${UI(tipIco[i])}</span><b>${esc(L.tipT[i])}</b><p>${esc(x)}</p></div>`).join("")}</div>
      <div class="dots" id="dots">${L.tipL.map((_, i) => `<i class="${i ? "" : "on"}"></i>`).join("")}</div>
    </div></div>`;
  }
  function homeDev() {
    const dev = homeRoot.querySelector(".dev");
    dev.className = "dev " + (isDark() ? "dark" : "light"); dev.dataset.o = innerWidth > innerHeight ? "l" : "p";
    dev.dataset.d = Math.min(innerWidth, innerHeight) >= 600 ? "tablet" : "phone";
    document.documentElement.style.background = getComputedStyle(dev).getPropertyValue("--bg") || "";
    return dev;
  }
  function renderHome() {
    if (!homeRoot) return;
    const dev = homeDev(); dev.innerHTML = homeHTML(); document.title = "Keepit";
    wireTiles();
    const tips = homeRoot.getElementById("tips"), dots = homeRoot.getElementById("dots");
    tips?.addEventListener("scroll", () => { const w = tips.firstElementChild?.offsetWidth || 1, i = Math.round(tips.scrollLeft / (w + 10)); [...dots.children].forEach((x, k) => x.classList.toggle("on", k === i)); }, { passive:true });
  }
  function onHomeClick(e) {
    const a = e.target.closest("[data-act],[data-open],[data-bm],[data-x]"); if (!a) return;
    if (a.dataset.x) { e.stopPropagation(); return removeBm(a.dataset.x); }
    if (a.dataset.open) { edit = false; location.href = a.dataset.open; return; }
    if (a.dataset.bm) { const b = bms.find(x => x.id === a.dataset.bm); if (!b) return; if (edit) return editDlg(b); return openBm(b); }
    const act = a.dataset.act;
    if (act === "search") globalThis.LHN_BAR_HOOKS?.nav?.("search");
    else if (act === "bmEdit") setEdit(!edit);
    else if (act === "bmAdd") editDlg({ id:newId(), name:"", url:"" }, true);
    else if (act === "contV") { const v = lastSession(); if (v) location.href = v.url; }
    else if (act === "contR") { const r = cont.read; if (!r) return; cont = { ...cont, resume:{ url:r.url, pct:r.pct } }; API.storage.local.set({ [K.cont]:cont }).finally(() => { location.href = r.url; }); }
  }
  let bmEatUntil = 0;
  function wireTiles() {
    const g = homeRoot?.getElementById("slist"); if (!g) return;
    let pt = null;
    g.addEventListener("contextmenu", ev => { const el = ev.target.closest(".si[data-bm]"); if (!el) return; ev.preventDefault(); if (pt) { clearTimeout(pt.t); pt = null; } if (!edit && !dlgOpen) menuDlg(bms.find(x => x.id === el.dataset.bm)); });
    g.addEventListener("pointerdown", ev => {
      const el = ev.target.closest(".si[data-bm]"); if (!el || ev.target.closest(".x") || ev.button > 0) return;
      pt = { el, id:ev.pointerId, x:ev.clientX, y:ev.clientY, drag:false, t:0 };
      if (!edit) pt.t = setTimeout(() => { if (pt && !pt.moved && !dlgOpen) { pt.long = true; navigator.vibrate?.(12); menuDlg(bms.find(x => x.id === el.dataset.bm)); } }, 480);
    });
    g.addEventListener("pointermove", ev => {
      if (!pt || ev.pointerId !== pt.id) return;
      const dx = ev.clientX - pt.x, dy = ev.clientY - pt.y;
      if (!pt.moved && Math.hypot(dx, dy) > 8) { pt.moved = true; clearTimeout(pt.t); }
      if (!edit || !pt.moved) return;
      const el = pt.el;
      if (!pt.drag) { pt.drag = true; g.setPointerCapture?.(ev.pointerId); el.classList.add("drag"); const r = el.getBoundingClientRect(); pt.gx = pt.x - r.left; pt.gy = pt.y - r.top; }
      const gr = g.getBoundingClientRect(), px = ev.clientX - gr.left, py = ev.clientY - gr.top;
      const hit = homeRoot.elementFromPoint(ev.clientX, ev.clientY)?.closest?.(".si[data-bm]");
      if (hit && hit !== el && hit.parentElement === g) { const kids = [...g.children]; g.insertBefore(el, kids.indexOf(el) < kids.indexOf(hit) ? hit.nextSibling : hit); }
      el.style.transform = `translate(${px - pt.gx - el.offsetLeft}px,${py - pt.gy - el.offsetTop}px) scale(1.04)`;
    });
    const up = ev => {
      if (!pt || ev.pointerId !== pt.id) return; clearTimeout(pt.t);
      const el = pt.el;
      if (pt.drag) {
        el.classList.remove("drag"); el.classList.add("settle"); el.style.transform = "";
        setTimeout(() => el.classList.remove("settle"), 200);
        const order = [...g.querySelectorAll(".si[data-bm]")].map(x => x.dataset.bm); bms.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id)); saveBms();
      }
      if (pt.drag || pt.long) bmEatUntil = performance.now() + 350;
      pt = null;
    };
    g.addEventListener("pointerup", up); g.addEventListener("pointercancel", up);
    // edit mode: the page must not scroll while a tile is dragged
    g.addEventListener("touchmove", ev => { if (pt?.drag && ev.cancelable) ev.preventDefault(); }, { passive:false });
  }
  // v3.5.226: the Keepit bar's search sheet grows out of this search box (js/content/keepit-bar.js homePill)
  globalThis.LHN_HOME = Object.freeze({ searchBox:() => homeRoot?.querySelector('.srch[data-act="search"]') || null });
  function mountHome() {
    const box = document.getElementById("keepit-home"); if (!box || homeRoot) return;
    homeRoot = box.attachShadow({ mode:"closed" });
    box.dataset.ready = "1";
    homeRoot.innerHTML = `<style>${HOME_CSS}</style><div class="dev"></div>`;
    homeRoot.addEventListener("click", e => { if (performance.now() < bmEatUntil) { bmEatUntil = 0; e.stopPropagation(); e.preventDefault(); return; } onHomeClick(e); }, true);
    renderHome();
    addEventListener("resize", () => homeRoot && homeDev());
    addEventListener("pageshow", e => { if (e.persisted) void load().then(renderHome); });
  }

  // ------------------------------------------------------------------ data
  async function load() {
    const got = await API.storage.local.get([K.bm, DICT_KEY, SETTINGS_KEY]).catch(() => ({}));
    settings = (await globalThis.LHN_SETTINGS?.get?.().catch(() => null)) || got[SETTINGS_KEY] || {};
    bms = Array.isArray(got[K.bm]) ? got[K.bm] : DEFAULT_BMS();
    sessions = Array.isArray(got[DICT_KEY]?.sessions) ? got[DICT_KEY].sessions : [];
    loaded = true;
  }
  API.storage.onChanged.addListener((ch, area) => {
    if (area !== "local") return;
    if (ch[K.bm]) { bms = Array.isArray(ch[K.bm].newValue) ? ch[K.bm].newValue : []; if (!dlgOpen) refreshMore(); }
    if (ch[SETTINGS_KEY]) { settings = globalThis.LHN_SETTINGS?.resolve?.(ch[SETTINGS_KEY].newValue) || ch[SETTINGS_KEY].newValue || {}; renderHome(); }
    if (ch[DICT_KEY]) { sessions = Array.isArray(ch[DICT_KEY].newValue?.sessions) ? ch[DICT_KEY].newValue.sessions : []; const c = homeRoot?.getElementById("cont"); if (c) c.innerHTML = contCards(); }
  });
  DARK_Q.addEventListener?.("change", () => renderHome());
  const whenBody = fn => { if (document.body) fn(); else document.addEventListener("DOMContentLoaded", fn, { once:true }); };
  void load().then(() => whenBody(mountHome));
})();
