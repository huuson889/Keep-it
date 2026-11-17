# Ask AI — Hướng dẫn kỹ thuật

## 1. Mục đích và phạm vi

Một pipeline AI panel cho ChatGPT/Gemini/Claude, chung toolbar, routing, prompt, send/mapping và đăng nhập. Grok vẫn trong registry/auth nhưng ẩn tabs. Không đọc body/title/clipboard/credentials cho prompt, không lưu/khôi phục unsent draft. Tài liệu gọi chính controller này, không có chat UI riêng.

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`providers.js`](../../js/ask-ai/providers.js) | `LHN_AI_PROVIDERS` | Registry, URL/login/selectors, provider preference, route planning và source normalization. |
| [`service.js`](../../js/ask-ai/service.js) | `handleAskAIMessage`, `ASK_AI_MESSAGE_TYPES` | Background lifecycle, mapping, context, commands, sheet/tab/panel và DNR. |
| [`toolbar.js`](../../js/ask-ai/toolbar.js) | `LHN_AI_TOOLBAR.create` | Source link, copy, Chat mới, provider tabs, auto-send. |
| [`sheet.js`](../../js/ask-ai/sheet.js) | `LHN_AI_SHEET.create` | **Cùng** mobile AI sheet đã chuyển từ Keepit bar; markup/motion/sheet-kit không đổi. |
| [`panel/panel.js`](../../js/ask-ai/panel/panel.js), [`pages/ai-panel.html`](../../pages/ai-panel.html) | panel controller | Owned panel page, iframe provider và lớp phủ đăng nhập. |
| [`page/composer.js`](../../js/ask-ai/page/composer.js) | `LHN_AI_COMPOSER` | Editor bridge, route/login reporter, focus một lần. |
| [`page/send-flow.js`](../../js/ask-ai/page/send-flow.js), [`prompt-format.js`](../../js/ask-ai/prompt-format.js) | request/send/format | Draft, send confirmation, URL injection và mapping chung. |
| [`page/chatgpt-link-marker.js`](../../js/ask-ai/page/chatgpt-link-marker.js), [`page/grok-google-auth.js`](../../js/ask-ai/page/grok-google-auth.js) | early marker/auth | Dữ liệu riêng ChatGPT `?q=`; Grok auth giữ nguyên. |

## 3. Luồng chính

1. Background nạp providers/prompt/service trước router. Explicit OPEN/TOGGLE/context menu/Alt+X dùng window của tab nguồn; không dựa cửa sổ focus nhớ tạm.
2. Provider chọn theo window session → last local → ChatGPT; default/provider off settings được tôn trọng. Đích ưu tiên route session đúng source/AI → mapping → start.
3. Desktop dùng side panel/sidebar; mobile dùng `LHN_AI_SHEET` chứa cùng panel page, tab là fallback. Keepit bar và Documents gọi cùng component, không copy CSS/gesture. Với owned iframe file, Dashboard top-frame chuyển message cho Documents active.
4. Explicit action thay nháp bằng prompt mới, caret cuối chỉ một lần. Source chưa map: draft không URL; URL/nhãn thêm lúc Send. Prompt tự gõ không auto-send. Opt-in rõ ràng mới tự gửi, ChatGPT có thể dùng `?q=`.
5. Send chỉ khi đúng editor/prompt ổn định; confirmed result mới map. Cùng source/route thì stay/wake; đổi source thụ động debounce hai giây chỉ đổi context/xóa stale composer, không tạo prompt/send.
6. Đăng nhập do AI quyết định: click sign-in mở tab và chờ/reload; trang tự vào login chỉ hiện nút. Sai origin/frame/provider phải bỏ; không đọc banner text để đoán tài khoản.
7. Source thông thường là HTTP(S). File chỉ cho owned `pages/dashboard.html?document=<UUID>`; URL không chứa hash/nội dung file. Chỉ sender owned `pages/documents.html` được bind source ref khác tab URL. Không chấp nhận extension/file URL tùy ý hay cho web giả nguồn.

## 4. Hợp đồng và quy tắc cần giữ

- Hỏi AI master tắt không mở panel; còn ít nhất một provider; giữ registry Grok ẩn. Không global last-chat, không passive prompt hoặc user-written auto-send.
- Giữ key mapping ChatGPT/Gemini/Claude, `keepitAiPanelLastProvider`, session provider/window/source/route và request ngắn hạn. Cleanup xóa request hết hạn, không xóa conversation mapping.
- Giữ command `open-chatgpt-sidepanel`, settings/prompt keys cũ và public message names. `service.js` chỉ đọc CONFIG khi gọi; importScripts Chromium và scripts Firefox đồng bộ.
- Native source links/Notes jump/backup chỉ chuẩn hóa owned document references bằng cùng normalizer. Không dùng URL do web đưa để thay source tab.
- Sheet message chỉ mở owned panel URL trên touch; frame drag kiểm `event.source`, dùng `LHN_SHEET`, đóng/rời source nhả scroll lock và frame.
- DNR 9002 chỉ allowlisted provider subframes. Không thêm quyền, Google auth bypass hoặc bỏ CSP/XFO của trang khác.

## 5. Kiểm tra và xác minh

Syntax/manifest/refs; Chromium thật kiểm real panel-open request, native mobile sheet/toolbar, own-source URL guards và Notes deep-link. Mock chỉ kiểm request/selection, không xác nhận AI login/send thực. Giữ pending QA người dùng cho ba provider, mapping/Send/sign-in, Firefox và Android thật trong `PROJECT.md`.
