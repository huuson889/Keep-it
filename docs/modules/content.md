# Content — Hướng dẫn kỹ thuật

## 1. Mục đích và phạm vi

Content scripts cung cấp UI và hành vi trên website: selection, highlight, note, Reader và ChatGPT panel. `content.js` điều phối giao diện; annotation CRUD thuộc Background.

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`manifest.json`](../../manifest.json) | `content_scripts` | URL, frame, thứ tự và thời điểm nạp. |
| [`js/content/content.js`](../../js/content/content.js) | IIFE controller | Settings, selection, UI và message listeners. |
| [`js/content/chatgpt-context.js`](../../js/content/chatgpt-context.js) | `LHN_CHATGPT_CONTEXT.create` | Legacy body-text/clipboard; launcher hiện không gọi. |
| [`js/content/chatgpt-link-marker.js`](../../js/content/chatgpt-link-marker.js) | document-start `capture` | Giữ panel/request/source marker trước ChatGPT fragment rewrite. |
| [`js/content/chatgpt-autofill.js`](../../js/content/chatgpt-autofill.js) | request/route listeners | `?q=`, follow-up, mapping, route metadata và toolbar; không lưu composer draft. |
| [`js/content/sidebar.js`](../../js/content/sidebar.js) | `LHN_SIDEBAR.create` | Sidebar tabs và controls. |

## 3. Luồng chính

1. Manifest nạp factories trước controller; controller đọc settings rồi gắn selection, sidebar và UI listeners.
2. Alt+X gửi intent summary; Hỏi AI gửi đúng `range.toString()` hiện tại. Background tra exact URL mapping và cấp request ID; không truyền body/title.
3. URL chưa map: auto-send mặc định tắt ở cài đặt mới. Alt+X/Hỏi AI explicit chèn sample không có URL; prompt người dùng tự viết vẫn cần họ chủ động bấm Send. Với mọi prompt được gửi thủ công trên URL chưa map, content chặn đúng click/Enter/submit đầu tiên, thêm nhãn website đã bản địa hóa + exact URL ngay trước một lần gửi duy nhất. Nếu auto-send đã được bật rõ ràng, action Keepit explicit dùng `?q=`; không áp dụng cho prompt người dùng tự viết. Draft explicit focus composer ở cuối; sau auto-send được xác nhận thì focus composer khi sẵn sàng, giữ nguyên phần người dùng đã gõ và đặt caret ở cuối.
4. URL đã map: Alt+X chỉ mở conversation; explicit reopen focus composer khi route sẵn sàng. Hỏi AI thay prompt bằng selection hiện tại, rồi xuống dòng mới tới câu kết tùy chỉnh, không kèm URL; auto-send tắt thì để unsent và caret ở cuối, auto-send bật thì chờ gửi được xác nhận rồi focus ô chat; nếu người dùng đã bắt đầu gõ thì giữ nguyên chữ và caret cuối. Source mapping chỉ được ghi sau composer clear và route `/c/<id>` xác nhận gửi.
5. Firefox top-level sidebar xử lý navigation request và route; Chromium iframe host chuyển source context. Pending link chỉ chạy khi source URL của request khớp source đang hiển thị. Source change và panel document mới mang one-shot clear marker; content xóa composer text cũ trước request hiện hành, nhưng giữ đúng prompt `?q=` đang chạy.
6. Conversation route watcher gửi route sạch cho panel/session metadata và cập nhật toolbar nguồn. Document-start marker lưu request ID, không lưu selection/prompt vào session.

## 4. Hợp đồng và quy tắc cần giữ

- Hỏi AI là selection-only; không gọi `LHN_CHATGPT_CONTEXT`, không trích body/title và không đọc clipboard.
- Giữ prompt defaults EN/VI/KO, newline thật, auto-send default off cho cài đặt mới (giữ stored preference rõ ràng), exact source URL → conversation mapping và URL injection ở send-time chỉ cho unmapped source.
- Pending prompt/selection là dữ liệu thao tác theo request; không phải draft lưu trữ. Source khác, panel close/cancel, hoàn tất hoặc expiry phải dừng/xóa request phù hợp.
- Không lưu/restore per-source composer text; clear marker xóa composer cũ khi source đổi hoặc panel document được tạo lại. Same-source/same-route fast path giữ nguyên document đang sống. Không dùng global last-conversation URL.
- Mapped follow-up chỉ thay/gửi khi exact conversation route khớp. URL mới chỉ tạo mapping sau khi manual send hoặc explicit opt-in send đã được xác nhận; tab/source switch không tự prompt/send.
- Route metadata báo cáo về panel chỉ gồm URL nguồn và ChatGPT origin/path; query/hash/prompt/composer text bị loại khỏi route.
- Giữ `Alt+Q`/`sidebarShortcut`, right-click selection menu trên Chromium/Firefox và toolbar/provider tabs hiện có.

## 5. Kiểm tra và xác minh

- v3.5.88 Content VM: drafts focus with caret at end; mapped Ask AI replaces the previous draft and focuses at the end; mapped and new-chat auto-send focus after accepted send and composer readiness while preserving any text typed next; URL/manual-send and mapping guards remain — PASS.
- v3.5.86 Content VM: click/Enter/submit, mapped vs. unmapped, exact localized URL once, sample URL-free until send, mapping after empty composer + `/c/<id>`, and no user prompt in storage — PASS.
- Static syntax cho toàn bộ first-party JavaScript và passive clear/q-preservation checks của v3.5.85 vẫn có trong release history; browser QA Chrome/Firefox cho composer controls/linkification, native q-send, mapping, mapped follow-up, context menu và source switching chưa chạy.
- Browser QA Chrome/Firefox chưa chạy; kiểm tra thật composer controls/linkification, native `?q=` send, mapping, mapped follow-up, context menu, source switch và panel lifecycle còn outstanding.
