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
4. Mapping exact source URL → HTTPS `/c/<id>` quyết định conversation. URL mới dùng hai bullet đã bản địa hóa; auto-send dùng `?q=`, tắt auto-send để prompt chưa gửi trong composer và mapping chỉ được lưu sau manual send. URL đã map: Alt+X chỉ reopen; Hỏi AI dùng selection hiện tại, không lặp URL.
5. Tab/source tự đổi có timer riêng mỗi window với deadline 2.000 ms tính từ event. Tab tiếp theo reset; quay lại source đang hiển thị hủy. Khi hết hạn, nạp mapping hoặc blank ChatGPT, không tạo prompt. Context mới hủy request prompt đang chờ của source khác. Alt+X/Hỏi AI/right-click đi thẳng, không debounce.
6. `storage.session` giữ window IDs, exact source URL và route ChatGPT đã sanitize cho cùng source; route bỏ query/hash. Panel close hủy timer/request. `storage.local` giữ exact mapping và request metadata tạm có hạn.

## 4. Hợp đồng và quy tắc cần giữ

- Giữ đồng bộ dependency và thứ tự nạp giữa manifest, `importScripts` và entry file; `message.type` là contract giữa context.
- ChatGPT chỉ nhận exact source URL và selection người dùng chủ động gửi. Không đọc page body/title hoặc clipboard.
- Composer text không được lưu/khôi phục theo source URL. Request prompt/selection chỉ dùng để hoàn thành explicit action; xóa khi hoàn tất, close/cancel, source khác thay thế, hoặc expiry.
- `keepitChatGPTConversationBySourceUrl` là exact source URL → validated `/c/<id>`. Không dùng global last-conversation fallback.
- Route session chỉ chứa exact source URL và HTTPS origin/path ChatGPT; không query/hash/prompt/composer text. Nếu không khớp source thì dùng exact mapping, nếu không có thì blank.
- Giữ `sidePanel.open()`/`sidebarAction.open()` trong user-gesture turn; Alt+X toggle, Ask AI open-or-keep-open. Chrome DNR chỉ áp dụng ChatGPT subframe do extension khởi tạo.
- Khi update, xóa `keepitChatGPTPageDraftsBySourceUrl` và global last-conversation key cũ.

## 5. Kiểm tra và xác minh

- Đã chạy: syntax toàn bộ first-party JS, Python source compile, parse/version/permission manifest, Firefox transform (không `sidePanel`), và `git diff --check` — PASS.
- Background focused VM: deadline 2 giây tính từ event dù tab lookup trễ 300 ms; exact mapping/no `?q=`, request cũ bị source mới hủy, quay về source hiện tại hủy timer, close hủy request — PASS.
- Link-flow VM: auto-send on giữ `?q=`, off giữ request draft/manual-send, mapped Ask AI đúng `/c/<id>`, đóng panel và close-during-settings hủy request — PASS.
- Browser QA Chrome/Firefox chưa chạy; cần xác nhận tab switch thật, panel lifecycle, q/native-send, mapping, context menu và scrollbar.
