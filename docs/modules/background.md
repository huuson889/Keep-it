# Background — Hướng dẫn kỹ thuật

## 1. Mục đích và phạm vi

Background điều phối runtime, extension storage và tác vụ dùng chung; không đọc page DOM. ChatGPT flow xử lý URL nguồn/mapping, debounce panel context và request metadata tạm cho hành động người dùng.

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`manifest.json`](../../manifest.json) | `background` | Khai báo service worker Chromium và Firefox. |
| [`js/background/background.js`](../../js/background/background.js) | `LHN_MESSAGING.onMessage`, tab/window events | Message routing, ChatGPT panel, dịch vụ runtime. |
| [`js/background/annotations.js`](../../js/background/annotations.js) | `LHN_ANNOTATIONS` | IndexedDB, migration và CRUD annotation. |
| [`js/background/usage-limits.js`](../../js/background/usage-limits.js) | `LHN_USAGE_LIMITS.create` | Usage state local cho translation/TTS. |
| [`js/core/messaging.js`](../../js/core/messaging.js) | `LHN_MESSAGING` | Runtime message API dùng chung. |

## 3. Luồng chính

1. Manifest nạp `background.js`; `importScripts` nạp polyfill và dependencies.
2. UI gửi message qua `LHN_MESSAGING`; listener định tuyến theo `message.type`.
3. `OPEN_CHATGPT_LINK_PANEL` đọc exact tab URL và intent. Alt+X giữ toggle; Hỏi AI mở/giữ panel mở. Chỉ Hỏi AI/context menu chuyển `selectionText`; không lấy body/title.
4. Mapping exact source URL → HTTPS `/c/<id>` quyết định conversation. Auto-send default off cho cài đặt mới; stored preference rõ ràng được giữ. URL chưa map: explicit Keepit sample không có URL khi auto-send off; manual send path nhận exact URL + localized website label, chỉ gửi một lần và chỉ tạo mapping sau route/send confirmation. Auto-send opt-in chỉ cho explicit Keepit actions qua `?q=`. Prompt người dùng tự viết không auto-send; background giữ metadata URL/request ID/window/expiry, không lưu body prompt. URL đã map: Alt+X chỉ reopen; Hỏi AI dùng selection hiện tại, không lặp URL.
5. Tab/source tự đổi có timer riêng mỗi window với deadline 2.000 ms tính từ event. Tab tiếp theo reset; quay lại source đang hiển thị hủy. Khi hết hạn, nạp mapping hoặc blank ChatGPT, không tạo prompt. Context mới hủy request prompt đang chờ của source khác. Alt+X/Hỏi AI/right-click đi thẳng, không debounce.
6. `storage.session` giữ window IDs, exact source URL và route ChatGPT đã sanitize cho cùng source; route bỏ query/hash. Panel close hủy timer/request. `storage.local` giữ exact mapping và request metadata tạm có hạn.

## 4. Hợp đồng và quy tắc cần giữ

- Giữ đồng bộ dependency và thứ tự nạp giữa manifest, `importScripts` và entry file; `message.type` là contract giữa context.
- ChatGPT chỉ nhận exact source URL và selection người dùng chủ động gửi. Không đọc page body/title hoặc clipboard; prompt người dùng tự viết không được persist trong request metadata.
- Composer text không được lưu/khôi phục theo source URL. Prompt/selection explicit chỉ dùng để hoàn tất action; manual-send user prompt chỉ giữ metadata source/request ID/window/expiry. Xóa khi hoàn tất, close/cancel, source supersession hoặc expiry.
- `keepitChatGPTConversationBySourceUrl` là exact source URL → validated `/c/<id>`. Không dùng global last-conversation fallback.
- Route session chỉ chứa exact source URL và HTTPS origin/path ChatGPT; không query/hash/prompt/composer text. Nếu không khớp source thì dùng exact mapping, nếu không có thì blank.
- Giữ `sidePanel.open()`/`sidebarAction.open()` trong user-gesture turn; Alt+X toggle, Ask AI open-or-keep-open. Chrome DNR chỉ áp dụng ChatGPT subframe do extension khởi tạo.
- Khi update, xóa `keepitChatGPTPageDraftsBySourceUrl` và global last-conversation key cũ.

## 5. Kiểm tra và xác minh

- v3.5.86 focused Background VM: missing preference defaults off, explicit `true` remains on, exact mapped URL returns without pending send, manual pending stores URL/request/window/expiry but no user prompt, and an existing same-source draft-link request is reused — PASS. Firefox manifest transform/version/permission checks and all-JS syntax — PASS.
- Background focused VM: deadline 2 giây tính từ event dù tab lookup trễ 300 ms; exact mapping/no `?q=`, request cũ bị source mới hủy, quay về source hiện tại hủy timer, close hủy request — PASS.
- v3.5.86 Content VM validates manual click/Enter/submit, URL-at-send exactly once, mapped URL-free send, explicit draft without URL before send, and post-send mapping confirmation — PASS. Broader background debounce/close/source-supersession VMs remain as recorded by prior release tests.
- Browser QA Chrome/Firefox chưa chạy; cần xác nhận tab switch, panel lifecycle, native `?q=`/composer behavior, mapping/reopen, context menu và scrollbars thật.
