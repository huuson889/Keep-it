# Video (YouTube Dual Subtitles) — Hướng dẫn kỹ thuật

> Source code là nguồn sự thật; trang này mô tả luồng YouTube và Web Study dùng chung overlay.

## 1. Mục đích và phạm vi

Điều phối overlay video, YouTube subtitles, Web Study và Dictation. Web lấy bài qua Reader; overlay/virtual-media adapter dùng chung nhưng transcript cache YouTube tách biệt.

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`manifest.json`](../../manifest.json) | `content_scripts` | Thứ tự nạp module. |
| [`js/video/overlay-template.js`](../../js/video/overlay-template.js) | `OVERLAY_HTML`, `OVERLAY_CSS` | Shadow DOM và giao diện. |
| [`js/video/dual-subtitles.js`](../../js/video/dual-subtitles.js) | `runSharedVideoShortcut`, `prepareWebStudy`, `openOverlay` | Shortcut, YouTube và Web adapter. |
| [`js/reader/bilingual-reader.js`](../../js/reader/bilingual-reader.js) | `LHN_READER_MAIN_SOURCE.getTextBlocks` | Chọn và trích main text. |
| [`js/core/cache.js`](../../js/core/cache.js) | `getWebStudyCues`, `saveWebStudyCues`, `touchWebStudyCues` | Persistent cache cue Web. |
| [`js/background/background.js`](../../js/background/background.js) | `WEB_STUDY_CUE_CACHE_GET/SAVE/TOUCH` | Cầu message tới cache. |
| [`js/reader/tts-engine.js`](../../js/reader/tts-engine.js) | `LHN_TTS.play` | Phát audio/browser speech. |
| [`js/dictation/dictation.js`](../../js/dictation/dictation.js) | `LHN_DICTATION` | Dictation UI/engine dùng chung. |

## 3. Luồng chính

1. Manifest nạp Reader trước video controller; shortcut Alt+E/F đi qua dispatcher chung cho Web và YouTube.
2. Lần đầu mở Web Study gọi Reader `forceRefresh`, chuẩn hóa main text và băm URL/ngôn ngữ/nội dung/schema.
3. Cache hit theo fingerprint dùng câu lưu; miss thì tách/lưu. Snapshot RAM giữ cue khi đóng/mở cùng document. Reload/URL mới đọc Reader lại để phát hiện nội dung đổi.
4. Cue hiện trong transcript. TTS và dịch chỉ được gọi khi cần, qua module/cache mặc định; Web adapter không tạo cache riêng.
5. Web gửi `stop-reading`; Reader start đóng Web overlay. Đóng overlay hủy media nhưng giữ snapshot cue của document. YouTube tiếp tục dùng player/caption loader và transcript cache riêng.

## 4. Hợp đồng và quy tắc cần giữ

- Web chỉ lấy main text qua Reader; không đổi thuật toán chọn block và không dùng YouTube caption loader.
- Cache Web lưu câu nguồn đã chuẩn hóa, không lưu HTML. Khóa được băm từ URL bỏ fragment, fingerprint text, ngôn ngữ và schema `v1`; URL thô không nằm trong khóa lưu. Thay cách tách câu phải đổi schema.
- Cache cue có TTL trượt 7 ngày; lần mở lại cùng document chạm cache để gia hạn, cleanup xóa mục không được dùng lại trong thời hạn. Không chia quota/entry với transcript YouTube.
- Snapshot bộ nhớ gắn với document và URL, chỉ tồn tại qua đóng/mở overlay. Reload tạo content script mới và buộc trích Reader lại; persistent cache chỉ được dùng khi fingerprint còn trùng.
- TTS và translation giữ cache/policy của module hiện có. Giữ marking, queue, target-language updates và lỗi dịch/toast.
- Giữ `LHN_OVERLAY_API`, phím native YouTube, shared shortcuts và mutual exclusion Reader/Web. Web virtual media phải kiểm tra generation để seek/pause không bị cue cũ ghi đè.
- CC mặc định so mã ngôn ngữ cơ sở của cue thực tế (YouTube track/Web detection) với giao diện: trùng → `primary`, khác/chưa rõ → `bilingual`. Web chỉ fallback sang page/browser hint thì tính là chưa rõ. Cập nhật khi cue được xác định, trừ khi người dùng đã chọn chế độ cho video/trang đó.
- Tốc độ Web TTS cập nhật audio hiện hành; Pause/Play giữ vị trí. Không thay UI, video modes, thumbnail/Ambient hoặc Dictation.

## 5. Kiểm tra và xác minh

- v3.5.24 VM xác nhận fresh Reader read/save đầu tiên, snapshot/touch khi đóng/mở lại, persistent-cache hit sau reload, refresh khi URL đổi, TTL 7 ngày và dọn mục không được dùng lại.
- Static/source checks: `node --check` 54 JS files, manifest JSON/version, Reader/Web/Background message-contract assertions và `git diff --check`.
- v3.5.25 VM xác nhận cùng mã cơ sở → `primary`, khác/không rõ → `bilingual`, Web dùng ngôn ngữ cue được dò và lựa chọn thủ công không bị ghi đè.
- Browser QA chưa chạy: thử nhiều lần đóng/mở và reload trên Tuổi Trẻ/VnExpress; kiểm tra số cue, TTS/dịch lazy, URL đổi, Alt+E/F, Reader exclusivity, YouTube không đổi và cleanup.
