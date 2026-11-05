# Background — Hướng dẫn kỹ thuật

## 1. Mục đích và phạm vi

Background điều phối runtime, storage, panel lifecycle và request. Nó không đọc AI page, composer draft, page body/title, clipboard hay credentials. ChatGPT giữ mapping/route/auto-send; provider khác chỉ nhận prompt draft. Chromium chuyển Google sign-in trong Grok iframe sang popup.

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
5. Tab/source context switch giữ debounce per-window; khi hết hạn, request điều hướng provider hiện chọn. Panel close, source supersession và expiry dọn pending request.
6. Chromium DNR rule 9002 chỉ áp response headers cho subframe trên allowlist host provider; Firefox sidebar điều hướng top-level nên không cần rule này.
7. `AI_PANEL_GOOGLE_AUTH_REQUEST` chỉ nhận từ embedded Google frame khi window chọn Grok. Background mở URL Google trong popup; callback về host Grok sẽ đóng popup, focus panel và gửi reload. `storage.session` chỉ giữ window/tab IDs và cooldown để qua worker restart.

## 4. Hợp đồng và quy tắc cần giữ

- `message.type`/payload là contract xuyên context. Provider chỉ nhận từ `LHN_AI_PROVIDERS`; window ID phải là integer hợp lệ trước khi lưu session state.
- ChatGPT map key là exact source URL, value là HTTPS `/c/<id>` đã kiểm tra. Không dùng global last-chat fallback; session route gắn với source, không chứa query/hash/prompt/composer text.
- Auto-send chỉ áp dụng luồng ChatGPT đã opt-in. Gemini, Claude, Grok chỉ nhận fill/clear/focus; không click Send, Enter hay kích hoạt submit.
- Request-scoped prompt/selection không phải composer draft. Không persist, khôi phục, đọc hoặc gửi nội dung người dùng tự gõ trong composer.
- Giữ `sidePanel.open()`/`sidebarAction.open()` trong user-gesture turn; giữ Alt+X toggle và Hỏi AI open-or-keep-open. Firefox sidebar provider state phải gắn đúng window.
- DNR giữ `requestDomains` đúng allowlist provider và `resourceTypes` là `sub_frame`; không dùng rule toàn URL hoặc thêm Google auth.
- Popup chỉ nhận sender/auth URL từ `accounts.google.com`, extension ancestor và window chọn Grok; callback phải thuộc Grok registry. Không persist OAuth URL, token hay credentials.

## 5. Kiểm tra và xác minh

- Đã chạy provider registry/prompt VM với localized generic prompt, selected text và exact source URL — PASS. All-JS `node --check`, manifest parse và `git diff --check` — PASS.
- DNR VM: migrate rule cũ, allowlist host + `sub_frame` — PASS. Grok Google-auth VM — PASS: chỉ embedded Google frame và đúng Grok window mở popup; Google page chưa đóng popup; callback Grok đóng/focus/reload, worker restart giữ flow, cooldown chặn vòng lặp; OAuth URL không persist.
- Browser QA chưa chạy: kiểm tra popup/Google callback và khả năng iframe dùng lại session trên Chromium, Chrome provider iframe/DNR, Firefox sidebar, hai window đồng thời, source change, ChatGPT mapping/auto-send và no-submit trên provider khác.
