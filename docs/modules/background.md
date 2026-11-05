# Background — Hướng dẫn kỹ thuật

## 1. Mục đích và phạm vi

Background điều phối runtime, storage, panel lifecycle và request. Nó không đọc AI page, composer draft, page body/title, clipboard hay credentials. ChatGPT giữ mapping/route/auto-send; provider khác chỉ nhận prompt draft. Với Google sign-in nhúng bên trong Grok trong Chromium AI panel, background xác thực frame/ancestor origins rồi tự mở `grok.com` top-level; chỉ giữ tab/window IDs và cooldown chống trùng trong `storage.session`. Không chuyển OAuth URL hay credentials, không đóng tab mới; toolbar button vẫn là fallback.

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`manifest.json`](../../manifest.json) | `background` | Khai báo worker/page và thứ tự nạp registry provider. |
| [`js/background/background.js`](../../js/background/background.js) | `LHN_MESSAGING.onMessage`, tab/window events | Message routing, provider state, ChatGPT request queue và DNR rule. |
| [`js/shared/ai-providers.js`](../../js/shared/ai-providers.js) | `LHN_AI_PROVIDERS` | Allowlist provider/host/origin dùng bởi background và UI. |
| [`js/background/annotations.js`](../../js/background/annotations.js) | `LHN_ANNOTATIONS` | IndexedDB, migration và CRUD annotation. |
| [`js/background/usage-limits.js`](../../js/background/usage-limits.js) | `LHN_USAGE_LIMITS.create` | Usage state local cho translation/TTS. |
| [`js/core/messaging.js`](../../js/core/messaging.js) | `LHN_MESSAGING` | Runtime message API dùng chung. |

## 3. Luồng chính

1. Manifest và `importScripts` nạp `ai-providers.js` trước background entry; cùng allowlist được dùng để kiểm tra provider ID.
2. `AI_PANEL_PROVIDER_SELECTED` xác thực ID rồi lưu theo window trong `storage.session`. Khi panel context đổi, background đọc provider hiện hành và đính `providerId` vào navigation request.
3. `OPEN_CHATGPT_LINK_PANEL` tiếp tục xử lý URL nguồn, selection tường minh, prompt settings và ChatGPT source mapping. Nếu provider là ChatGPT, route, `?q=` và opt-in auto-send vẫn theo luồng cũ.
4. Với Gemini/Claude/Grok, background không tra hay tạo ChatGPT mapping và không auto-send. Nó tạo prompt localized từ instruction, exact source URL và (chỉ với Ask AI) selection hiện tại, rồi cấp request ID/provider ID cùng prompt draft ngắn hạn; panel/content side điền prompt vào editor. Draft text người dùng đã nhập trực tiếp vào composer không đi qua Background.
5. Khi nhận `AI_PANEL_GROK_AUTH_FRAME_DETECTED`, background xác thực sender là embedded `accounts.google.com` frame và origin chain có cả Grok lẫn extension panel, sau đó mở/focus `grok.com` top-level. Tab ID/window ID và cooldown 60 giây trong `storage.session` deduplicate; không lấy Google sign-in URL hay credentials.
6. Tab/source context switch giữ debounce per-window; khi hết hạn, request điều hướng provider hiện chọn. Panel close, source supersession và expiry dọn pending request.
7. Chromium DNR rule 9002 chỉ áp response headers cho subframe trên allowlist host provider; Firefox sidebar điều hướng top-level nên không cần rule này.

## 4. Hợp đồng và quy tắc cần giữ

- `message.type`/payload là contract xuyên context. Provider chỉ nhận từ `LHN_AI_PROVIDERS`; window ID phải là integer hợp lệ trước khi lưu session state.
- ChatGPT map key là exact source URL, value là HTTPS `/c/<id>` đã kiểm tra. Không dùng global last-chat fallback; session route gắn với source, không chứa query/hash/prompt/composer text.
- Auto-send chỉ áp dụng luồng ChatGPT đã opt-in. Gemini, Claude, Grok chỉ nhận fill/clear/focus; không click Send, Enter hay kích hoạt submit.
- Request-scoped prompt/selection không phải composer draft. Không persist, khôi phục, đọc hoặc gửi nội dung người dùng tự gõ trong composer.
- Giữ `sidePanel.open()`/`sidebarAction.open()` trong user-gesture turn; giữ Alt+X toggle và Hỏi AI open-or-keep-open. Firefox sidebar provider state phải gắn đúng window.
- DNR giữ `requestDomains` đúng allowlist provider và `resourceTypes` là `sub_frame`; không dùng rule toàn URL hoặc thêm Google auth.

## 5. Kiểm tra và xác minh

- Đã chạy provider registry/prompt VM với localized generic prompt, selected text và exact source URL — PASS. All-JS `node --check`, manifest parse và `git diff --check` — PASS.
- Grok auth VM: frame/sender/origin validation, top-level `grok.com`, duplicate-tab focus, 60-second cooldown, worker restart and concurrent detection — PASS.
- DNR allowlist/resource-type assertions, all-JS `node --check`, manifest/permission assertions, Firefox transform and `git diff --check` — PASS.
- Browser QA pending: real Chromium auth-frame ancestry/sign-in behavior and Firefox no-op; also provider iframe/DNR, Firefox sidebar, multiple windows, source change, ChatGPT mapping/auto-send and no-submit on other providers.
