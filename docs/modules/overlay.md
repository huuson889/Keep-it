# Overlay — Hướng dẫn kỹ thuật

> Source code là nguồn sự thật; module tổ chức Overlay Video/Web, Study activities và View settings.

## 1. Mục đích và phạm vi

Overlay hiển thị Video (YouTube) và Web. `overlay-controller.js` điều phối source/activity; `source/`, `study/` và `view/` lần lượt xử lý cues/media, hoạt động học và layout/caption. Reader, TTS, translation và cache vẫn thuộc module riêng.

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`js/overlay/overlay-controller.js`](../../js/overlay/overlay-controller.js) | `openOverlay`, `LHN_OVERLAY_SET_STUDY_ACTIVITY` | Lifecycle, routing và bootstrap cuối. |
| [`js/overlay/overlay-template.js`](../../js/overlay/overlay-template.js) | `OVERLAY_HTML`, `OVERLAY_CSS` | Shadow DOM markup/CSS. |
| [`js/overlay/source/video.js`](../../js/overlay/source/video.js) | `loadCaptions`, `onTimeUpdate` | YouTube captions, cache và cue timing. |
| [`js/overlay/source/web.js`](../../js/overlay/source/web.js) | `prepareWebSource`, `createWebTtsMedia` | Reader cues, Web media và thumbnail visualizer. |
| [`js/overlay/study/dictation/dictation.js`](../../js/overlay/study/dictation/dictation.js) | `LHN_STUDY.open` | Shared Study shell và Dictation/Typing. |
| [`js/overlay/study/shadowing/shadowing-activity.js`](../../js/overlay/study/shadowing/shadowing-activity.js), [`shadowing.js`](../../js/overlay/study/shadowing/shadowing.js) | `LHN_SHADOWING_ACTIVITY_FACTORY` | Shadowing recognition, recording, feedback và controls. |
| [`js/overlay/study/shared/study-score.js`](../../js/overlay/study/shared/study-score.js), [`learning-rules.js`](../../js/overlay/study/shared/learning-rules.js) | `LHN_STUDY_SCORE`, `LHN_STUDY_RULES` | Logic học dùng chung. |
| [`js/overlay/view/layout-mode.js`](../../js/overlay/view/layout-mode.js), [`cc-mode.js`](../../js/overlay/view/cc-mode.js) | `applyVideoDisplayMode`, `setSubtitleDisplayMode` | Theater/Reading/Combined, sizing và CC modes. |
| [`js/overlay/view/touch-layout.js`](../../js/overlay/view/touch-layout.js) | `setupTouchOverlayLayout`, `touchOverlayActive` | Bố cục cảm ứng: header, thẻ gọn/mở rộng, nút ⋯ và sheet Thêm. |
| [`js/shared/site-icons.js`](../../js/shared/site-icons.js) | `LHN_SITE_ICONS.load` | Favicon theo origin. |

## 3. Luồng chính

1. Manifest nạp template, source/view và Study modules; controller bootstrap sau cùng.
2. Controller chọn Video hoặc Web. Video lấy captions; Web dựng cues/media từ Reader text.
3. `LHN_OVERLAY_API` cung cấp cues; `LHN_STUDY` mở Dictation/Typing hoặc Shadowing.
4. Web TTS dùng Reader rate; translation dùng `BILINGUAL_TRANSLATE` và cache hiện có.
5. View quản lý layout/CC. Khi đóng, Overlay dọn media/listeners và giữ mutual exclusion với Reader.

## 4. Hợp đồng và quy tắc cần giữ

- Đây là classic content scripts trong cùng isolated world; giữ controller bootstrap cuối. API chính là `LHN_STUDY`; globals/method Dictation cũ, storage keys, transcript-cache schema và event contracts vẫn tương thích.
- Selector chung dùng `te-study-*`; Dictation riêng dùng `te-dict-*`; Shadowing riêng dùng `te-shadowing-*`.
- Web TTS dùng Reader rate đã lưu (global/per-language, 0.5×–3×); Video/YouTube giữ 0.5×–2× và Dictation replay 0.6×. Không đổi shared TTS engine.
- Web progress nội suy trong cue và dừng khi TTS pause; Video giữ updater riêng.
- Theater + Large: subtitle box tối đa 98% `.te-player-frame`; main/dịch giữ chiều rộng tự nhiên và wrap khi nội dung vượt giới hạn. Ở slider 100%, EN/VI là 26/20 px; các mức khác giữ cách tính hiện tại. Handle 54×20 px, icon 14×14, nhô 10 px; vùng hover thêm 4× chiều rộng nút mỗi bên. Kéo theo chiều dọc; double-click bất kỳ đâu trong box, kể cả nút, reset về cách đáy frame 30 px. Control bar đang hiện chỉ clamp vị trí render; tọa độ đã lưu trở lại khi bar ẩn.
- Light mode main subtitle dùng app purple, ngoại trừ Theater + Large dùng `#ffff00` như dark mode. Transcript focus dùng nền lavender/accent tím ở light; các màu dark không đổi.
- Popup Cài đặt video tăng max-height body từ 520px lên 530px và canh mép phải cách control bar 4px; menu Chế độ xem trên control bar rộng thêm 20px và cũng canh mép phải 4px. Các submenu Cài đặt khác giữ anchor hiện hành.
- Giữ visualizer: Breathing/Pan/Tilt 0.2×–3.0×, không Static/Pulse, giảm biên độ 50%; bốn waveform; bảy hiệu ứng đổi độc lập 30–180 giây; blur 0–10 px; bokeh giữ glow alpha/radius 2× và fade mật độ.
- `study/shared/` chỉ chứa logic dùng chung; lifecycle/result branches còn trong Dictation shell cần tách mà không đổi UX. Dashboard chưa có Shadowing practice route.
- Bố cục cảm ứng (v3.5.150): `touch-layout.js` gắn `te-touch-layout` khi `(max-width: 599.98px) and (orientation: portrait), (max-width: 899.98px) and (orientation: portrait) and (pointer: coarse)`; Video và Web dùng chung một giao diện ở cả Kết hợp/Đọc/Rạp: header 52px, thẻ gọn 78px (`te-touch-compact`, lưu `lhnTouchOverlayCompact`, mặc định gọn; chạm thẻ để mở rộng), câu hiện tại, transcript, thanh dưới 6 nút (trước/phát/sau/CC/tốc độ/⋯). Sheet "Thêm" bấm lại nút gốc (từ vựng, ghi chú, âm thanh, lặp, luyện nói, chính tả, toàn màn hình, cài đặt), nút gốc ẩn/disabled thì bỏ qua. Popup tốc độ/CC và mọi `.te-modal-box` thành bottom sheet. Câu active canh đầu danh sách (`alignActiveTranscriptFocus`, cách 8px). Chế độ học (`te-study-active`) giữ khối một cột riêng. Desktop không có class này.

## 5. Kiểm tra và xác minh

- v3.5.54: `node --check` JS Overlay sửa, `git diff --check` và focused checks cho popup anchor/size, Theater + Large 26/20px ở 100% và giới hạn frame 98% đạt; browser QA chưa chạy.
- v3.5.53: `node --check` các JS liên quan, `git diff --check` và focused tests cho double-click reset/30 px default đạt; Browser QA chưa chạy.
- v3.5.52: `node --check` các JS sửa, `git diff --check`, source assertions và focused VM tests cho legacy/default position, handle geometry, control visibility, clamp và restore đều đạt. Browser QA chưa chạy.
- Browser QA cần xác nhận popup Cài đặt/menu Chế độ xem canh mép phải control bar 4px, body settings tối đa 530px và menu rộng thêm 20px; Theater + Large: EN/VI 26/20px ở mức 100%, các slider khác không đổi, hộp wrap trong 98% frame; handle drag bottom↔top, double-click ở nội dung lẫn nút reset về 30 px, panel trở lại đúng vị trí sau khi control bar ẩn; thử cả vị trí tùy chỉnh cũ.
- Static checks không thay thế kiểm thử extension thật; regression QA cần xác nhận Video/Web switching, TTS, Study activities, shortcuts và cleanup.
