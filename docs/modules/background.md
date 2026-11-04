# Background — Hướng dẫn kỹ thuật

> Tài liệu định hướng; source code được dẫn là nguồn sự thật.

## 1. Mục đích và phạm vi

Background là trung gian cho runtime API, storage và dịch vụ dùng chung giữa các context. UI thuộc Content, Popup, Dashboard, Reader và Overlay; Background không xử lý page DOM.

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`manifest.json`](../../manifest.json) | `background` | Khai báo service worker Chromium và script Firefox. |
| [`js/background/background.js`](../../js/background/background.js) | `LHN_MESSAGING.onMessage`, `browser.commands.onCommand` | Message routing, ChatGPT panel và dịch vụ runtime. |
| [`js/background/annotations.js`](../../js/background/annotations.js) | `LHN_ANNOTATIONS` | IndexedDB, migration và CRUD annotation. |
| [`js/background/usage-limits.js`](../../js/background/usage-limits.js) | `LHN_USAGE_LIMITS.create` | Usage state local cho translation/TTS. |
| [`js/core/messaging.js`](../../js/core/messaging.js) | `LHN_MESSAGING` | Runtime message API dùng chung. |
| [`js/translate/translate.js`](../../js/translate/translate.js), [`js/core/cache.js`](../../js/core/cache.js) | `LHN_TRANSLATE`, `LHN_CACHE` | Translation, language detection và cache. |

## 3. Luồng chính

1. Manifest nạp `background.js`; `importScripts` nạp polyfill và dependency trước khi dùng global API.
2. UI gửi message qua `LHN_MESSAGING`; listener phân nhánh theo `message.type`.
3. Annotation đi qua `LHN_ANNOTATIONS`/IndexedDB; thay đổi được phát lại để đồng bộ context.
4. Translation, TTS và Web Study cache chuyển tới `LHN_TRANSLATE`, `LHN_CACHE` hoặc usage service; Background trả kết quả cho requester.
5. `OPEN_CHATGPT_LINK_PANEL` toggle panel rồi lấy URL tab nguồn. Chrome giữ window IDs đang mở trong `storage.session` để khôi phục sau service-worker restart; đóng bằng `sidePanel.close()` hoặc yêu cầu chính trang panel `window.close()` trên Chromium cũ. Firefox dùng `sidebarAction.toggle()`. Khi panel mở, lần đầu gửi q URL-only và lưu mapping exact source URL → conversation; URL đã map chỉ mở lại route. `Alt+X` khởi chạy cùng flow, không đọc body/clipboard.
6. Các message khác mở Dashboard/highlight hoặc proxy YouTube request theo allowlist.

## 4. Hợp đồng và quy tắc cần giữ

- Giữ đồng bộ dependency và thứ tự nạp giữa manifest, `importScripts` và entry file.
- `message.type` là contract giữa context; tìm mọi sender/receiver trước khi đổi payload hoặc kiểu kết quả.
- Annotation do Background/IndexedDB sở hữu; không tạo nguồn lưu annotation thứ hai trong UI.
- Giữ allowlist host của `YOUTUBE_FETCH_TEXT`/`YOUTUBE_API`; không biến proxy thành fetch tùy ý.
- Cache và usage state ở local; giữ validation, dedupe và error paths của TTS/translation.
- Luồng link-only chỉ chuyển/lưu URL nguồn và metadata request, không đọc/chuyển/lưu page body, title hay prompt draft. Mapping `keepitChatGPTConversationBySourceUrl` là exact source URL → validated HTTPS `/c/<id>`; pending expires, và mapping không được dùng để gửi prompt lại.
- Chrome toggle state key `keepitChatGPTPanelOpenWindowIds` chỉ chứa window IDs trong `storage.session`; `onOpened`/`onClosed` cập nhật state sau worker restart. Giữ `sidePanel.open()` trong user-gesture turn; dùng `sidePanel.close()` khi có, nếu không thì chỉ panel thuộc window đích tự `window.close()`. Firefox dùng native `sidebarAction.toggle()`.
- Chrome DNR rule 9002 chỉ áp dụng cho ChatGPT subframe do extension khởi tạo, dù gỡ cả CSP của frame. Firefox build bỏ `sidePanel`/`side_panel` và giữ `sidebar_action.open_at_install=false`.

## 5. Kiểm tra và xác minh

- Static: `for f in js/background/*.js; do node --check "$f" || exit; done`; parse manifest và chạy `git diff --check`.
- Message changes: kiểm tra sender, receiver, payload và metadata; xác nhận chỉ URL nguồn/route được lưu, không có page body/title.
- Focused VM PASS: Chromium toggle open/close, session restore after worker restart, immediate open gesture, legacy close fallback/window isolation, Firefox native toggle.
- Static PASS: first-party JS syntax, Python compile, manifest/version/references/permissions, docs structure/length và `git diff --check`. Chrome/Firefox ZIPs PASS (122 files each; Firefox manifest transforms verified).
- Browser QA Chrome/Firefox chưa chạy để xác nhận panel thật, toggle sau worker restart, q/mapping, draft guard, scrollbar và Firefox install không tự mở.
