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
5. `OPEN_CHATGPT_LINK_PANEL` nhận intent summary hoặc selected-text và đọc ba setting `chatGPTAutoSend`, `chatGPTSummaryPrompt`, `chatGPTAskPrompt`. Alt+X giữ toggle; Hỏi AI mở/giữ panel mở. Khi bật auto-send, URL mới dùng bullet-formatted URL + câu cuối qua `?q=`; khi tắt, mở composer với bản nháp (không `?q=`) và chỉ tạo mapping sau khi người dùng gửi. URL đã map: Alt+X chỉ reopen; Hỏi AI dùng selection hiện tại và câu cuối tùy chỉnh trong đúng conversation, URL không lặp; khi auto-send tắt, giữ câu hỏi làm bản nháp.
6. Các message khác mở Dashboard/highlight hoặc proxy YouTube request theo allowlist.

## 4. Hợp đồng và quy tắc cần giữ

- Giữ đồng bộ dependency và thứ tự nạp giữa manifest, `importScripts` và entry file.
- `message.type` là contract giữa context; tìm mọi sender/receiver trước khi đổi payload hoặc kiểu kết quả.
- Annotation do Background/IndexedDB sở hữu; không tạo nguồn lưu annotation thứ hai trong UI.
- Giữ allowlist host của `YOUTUBE_FETCH_TEXT`/`YOUTUBE_API`; không biến proxy thành fetch tùy ý.
- Cache và usage state ở local; giữ validation, dedupe và error paths của TTS/translation.
- Luồng ChatGPT không trích xuất/gửi page body hoặc title, không dùng clipboard. Alt+X chỉ gửi câu lệnh tóm tắt + exact URL ở URL mới; Hỏi AI chỉ lấy selected text hiện tại. Auto-send mặc định bật; nếu tắt, URL mới dùng bản nháp không q-prefill và mapping chỉ hoàn tất sau manual send; follow-up mapped dùng draft thay vì Send. Settings/prompt nằm trong extension storage local. Pending metadata có hạn và có thể giữ prompt/selected snippet; navigation ngoài exact mapped follow-up vẫn bảo vệ composer draft.
- Mapping `keepitChatGPTConversationBySourceUrl` là exact source URL → validated HTTPS `/c/<id>`; Alt+X mapping không tự gửi prompt lại. Follow-up Hỏi AI chỉ được thay/gửi khi route khớp mapping; auto-send tắt thì phải giữ prompt mới làm draft.
- Chrome state key `keepitChatGPTPanelOpenWindowIds` chỉ chứa window IDs trong `storage.session`; `onOpened`/`onClosed` cập nhật state sau worker restart. Giữ `sidePanel.open()` trong user-gesture turn; Alt+X vẫn toggle/close, Ask AI gọi open-or-keep-open. Firefox dùng `sidebarAction.toggle()` cho Alt+X và `sidebarAction.open()` cho Ask AI (toggle fallback nếu open API không có).
- Chrome DNR rule 9002 chỉ áp dụng cho ChatGPT subframe do extension khởi tạo, dù gỡ cả CSP của frame. Firefox build bỏ `sidePanel`/`side_panel` và giữ `sidebar_action.open_at_install=false`.

## 5. Kiểm tra và xác minh

- Static: `for f in js/background/*.js; do node --check "$f" || exit; done`; parse manifest và chạy `git diff --check`.
- Message changes: kiểm tra sender, receiver, payload và metadata; chỉ selected-text action được chuyển prompt từ selection rõ ràng; không lấy page body/title. Pending request có expiry; auto-send dùng hạn ngắn, còn draft-link không gửi có thể giữ tối đa 24 giờ để chờ manual send.
- Focused VM PASS: first-use q prompts for summary/selected text, URL mapping, same-URL Alt+X reopen without prompt, selected-text follow-up only in mapped conversation, empty-composer guard, exact-once send, wrong-route rejection, native-q duplicate guard, Chrome/Firefox Ask AI open-or-keep-open, Alt+X toggle.
- v3.5.78 focused VM PASS: configurable sentence/defaults and exact URL/newline; auto-send on creates matching `?q=`, off omits `q=` and uses `draft-link`; mapped Hỏi AI uses selection-only URL-free prompt and `draft-followup`; draft-ready message validates request/mode, persists readiness, and notifies source tab.
- Static/build PASS: first-party JS syntax, manifest v3.5.68/no-debugger, `git diff --check`; Chrome/Firefox ZIPs 122 files each, prompt/action smoke PASS, Firefox Chrome-only manifest keys removed.
- Browser QA Chrome/Firefox chưa chạy để xác nhận panel thật, follow-up gửi vào cùng chat, toggle sau worker restart, q/mapping, draft guard, scrollbar và Firefox install không tự mở.
