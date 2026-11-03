# Overlay — Hướng dẫn kỹ thuật

> Source code là nguồn sự thật; module này tổ chức giao diện chung Video/Web, Study và View, đồng thời giữ engine Dictation hiện có trong Study mà không tạo bản sao.

## 1. Mục đích và phạm vi

Overlay là lớp UI và điều phối cho YouTube cùng Web Study. Controller chọn source/activity; `source/` cung cấp dữ liệu/media, `study/` giữ Dictation engine cùng Shadowing/Speaking và Dictation/Writing entry points, còn `view/` quản lý layout/caption. Reader, TTS, translation và cache tiếp tục dùng các shared modules hiện có.

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`js/overlay/overlay-controller.js`](../../js/overlay/overlay-controller.js) | `openOverlay`, `createDictationOverlayApi`, `beginDictationMode` | Lifecycle, chọn source/activity, bootstrap cuối. |
| [`js/overlay/overlay-template.js`](../../js/overlay/overlay-template.js) | `OVERLAY_HTML`, `OVERLAY_CSS` | Shadow DOM structure, CSS và UI. |
| [`js/overlay/source/video.js`](../../js/overlay/source/video.js) | `loadCaptions`, `onTimeUpdate`, `parseCaptions` | YouTube caption, transcript cache, cue model/timing. |
| [`js/overlay/source/web.js`](../../js/overlay/source/web.js) | `prepareWebStudy`, `createWebTtsMedia` | Reader cues, language, cue cache và Web virtual media. |
| [`js/overlay/study/shadowing.js`](../../js/overlay/study/shadowing.js) | `onShadowingControlClick` | Speaking entry point và Web TTS controls. |
| [`js/overlay/study/dictation.js`](../../js/overlay/study/dictation.js) | `LHN_DICTATION.open` | Engine Typing/Speaking được chuyển vào Study. |
| [`js/overlay/study/session-index.js`](../../js/overlay/study/session-index.js) | `LHN_DICTATION_SESSION_INDEX` | Session metadata dùng cả trong Dashboard. |
| [`js/overlay/study/dictation-score.js`](../../js/overlay/study/dictation-score.js), [`js/overlay/study/dictation-learning-rules.js`](../../js/overlay/study/dictation-learning-rules.js), [`js/overlay/study/dictation-style.js`](../../js/overlay/study/dictation-style.js) | `LHN_DICTATION_SCORE`, `LHN_DICTATION_RULES`, `LHN_DICTATION_CSS` | Scoring, learning rules và styles của engine. |
| [`js/overlay/view/layout-mode.js`](../../js/overlay/view/layout-mode.js), [`js/overlay/view/cc-mode.js`](../../js/overlay/view/cc-mode.js) | `applyVideoDisplayMode`, `setSubtitleDisplayMode` | Theater/Reading/Combined, CC modes và translation queue. |

## 3. Luồng chính

1. Manifest nạp template, rồi Overlay source/study/view sau Core, Reader và content helpers.
2. Dictation scoring/rules/style/session/engine được nạp trước `overlay-controller.js`, điểm khởi chạy cuối.
3. Controller tạo launcher/overlay và chọn YouTube hoặc Web. Web gọi Reader `getTextBlocks({ forceRefresh:true })`; YouTube lấy caption từ player/transcript sources hoặc live-caption fallback.
4. Source cung cấp cue cho shared state; View quản lý layout, CC mode và dịch. Web TTS tiếp tục dùng `LHN_TTS`; controller tạo `LHN_OVERLAY_API`/`lhn-overlay-ready`, còn Shadowing adapter gắn Speaking entry vào engine.
5. Đóng overlay dọn media/listener theo source, giữ cache hiện có và duy trì mutual exclusion giữa Reader với Web Study.

## 4. Hợp đồng và quy tắc cần giữ

- Các file là classic content scripts trong cùng isolated world; tránh trùng top-level lexical names và chỉ để controller chạy bootstrap/listeners sau module definitions.
- Template chỉ sở hữu HTML/CSS. Khi tách module, không đổi UI, selectors, labels hay event contracts.
- Web cues tiếp tục qua `LHN_READER_MAIN_SOURCE`, cache cue dùng chung, `LHN_TTS` và `BILINGUAL_TRANSLATE`; không tạo engine/cache thứ hai.
- YouTube transcript cache, live-caption fallback, track language và timing vẫn riêng với Web source.
- Dictation engine có một bản duy nhất trong `study/dictation.js`; Shadowing adapter mở mode Speaking và điều khiển Web TTS. CC modes thuộc View, không thuộc Study.
- Giữ thứ tự manifest: template/modules, shared Dictation engine, rồi `overlay-controller.js`.

## 5. Kiểm tra và xác minh

- v3.5.28: `node --check` đạt cho 59 JS files; manifest paths/version/order, Dashboard script paths, relocation count và local module-doc links đạt; focused Study VM xác nhận Typing binding và Speaking open/switch/close; `git diff --check` đạt. Browser QA chưa chạy.
- Đã chạy v3.5.26: `node --check` 60 JS files; manifest paths/order và manifest-ordered VM load; 310 source blocks được giữ nguyên, chỉ chuẩn hóa trailing blank lines; template byte-for-byte; `git diff --check`.
- Có thể lặp static checks bằng Node và assertions cho manifest; VM/mock cần nạp scripts cùng một context để bắt lỗi load order/binding.
- Browser QA chưa chạy: xác nhận YouTube/Web switching, CC/layout, TTS, Dictation Typing/Speaking, Reader mutual exclusion, shortcuts và cleanup. Không suy ra browser behavior từ static/VM checks.
