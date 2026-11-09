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
| [`js/overlay/view/touch-theater.js`](../../js/overlay/view/touch-theater.js) | `LHN_TOUCH_THEATER` (`setup`, `isActive`, `enter`, `exit`, `showControls`) | Rạp ngang điện thoại: video tràn màn hình, thanh tự ẩn, vuốt âm lượng/độ sáng. |
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

- Overlay cảm ứng (v3.5.151): thanh dọc `[CC][tốc độ] · [trước phát sau] · [lặp][☰]`; góc ô phụ đề ♥ (trái) và Toàn màn hình (phải, vào rạp). Sheet ☰: Luyện nói, Chép chính tả, Chủ đề (bật/tắt, sheet giữ mở), Tùy chọn phụ đề, Ngôn ngữ phụ đề, Ghi chú, Chế độ nghệ thuật, Cài đặt — đều bấm nút gốc, trừ ♥. Cài đặt, Tùy chọn phụ đề và Ngôn ngữ phụ đề trên cảm ứng (v3.5.152) là một bottom sheet riêng `.te-touch-set` (3 trang, `openTouchSettingsSheet(page)`), không mở modal gốc: Cài đặt video chỉ có Nhấn để dịch, Phát âm khi dịch, Kết hợp câu (công tắc bấm checkbox gốc) và Xuất phụ đề (mở `#te-modal-export`; nút quay lại trở về sheet); Tùy chọn phụ đề có xem trước câu hiện tại, tab Phụ đề video / Phụ đề cuộn (chỉ dọc), Cỡ chữ, swatch màu chính/dịch, Nền Không/Mờ/Đậm (chỉ ở rạp, ghi vào thanh độ trong suốt gốc 0/40/80), Nâng cao (phông, độ đậm, −/+ đều bấm điều khiển gốc), Đặt lại (nút gốc); Ngôn ngữ phụ đề là danh sách radio bấm option gốc. Desktop vẫn dùng modal gốc. Phụ đề tự co chữ trong ô cố định (`fitTouchSubtitle`, `--te-touch-fit`, tối thiểu 12px). Câu active ở transcript cảm ứng theo tỉ lệ `state.touchTranscriptFocusRatio` (mặc định 0.5, lưu khi người dùng cuộn).
- Rạp ngang (`touch-theater.js`): khi `(orientation: landscape) and (max-height: 499.98px) and (pointer: coarse)` hoặc bấm Toàn màn hình; class `te-touch-theater` (+ `te-tt-ctl` khi hiện thanh). Thanh `[CC][tốc độ] · [trước phát sau] · [♥][lặp][☰]`, tự ẩn 3s khi đang phát, nút thoát góc trên phải. Vuốt dọc mép trái = âm lượng video, mép phải = độ sáng (filter trên khung video); vòng tròn giữa, kéo xuống đáy = Tự động; khôi phục khi thoát. Áp dụng cho cả video và web source (v3.5.152); không áp dụng cho chế độ học, tablet ngang.
- Tốc độ (v3.5.157): 0.5–3x cho mọi nguồn (video, Web TTS, chế độ học), giống Reader — `SPEED_MAX = 3.0` trong `overlay-controller.js`, `#te-speed-slider max="3"`, giới hạn `playbackRate` của Web TTS trong `source/web.js`. Nút chọn sẵn giữ nguyên 0.5–2.0x như Reader; −/+ và `<`/`>` bước 0,05.
- Cử chỉ cảm ứng (v3.5.153) quyết định theo chuyển động ngón tay, không theo lớp: rạp ngang bắt sự kiện ở pha capture trên root cho `.te-tt-surface` và `.te-sub-container` (trừ nút, thanh, sheet, hàng trên). Chạm yên trên video = hiện/ẩn thanh; chạm yên trên phụ đề = phát/dừng; vuốt dọc >10px = âm lượng (trái <40%, hoặc nửa trái nếu bắt đầu trên phụ đề) / độ sáng (phải); vuốt ngang = tua (tối đa 120s cho cả bề ngang, hiện `.te-tt-seek` giờ đích + câu, áp dụng khi nhả); vuốt xuống >60px ở dải giữa 40–60% = thoát rạp. Mép 24px bỏ qua. Hướng dẫn cử chỉ chỉ hiện lần đầu vào rạp và giữ đến khi chạm màn hình (lưu `lhnTouchTheaterHintSeen` ở storage.local). Video rạp `object-fit: contain`, căn giữa (ghi đè inline left/top của trang); ▶ đúng tâm màn hình; ♥ bật màu `#f43f5e`.
- Dọc (v3.5.153): vuốt lên trên video hoặc thẻ âm thanh = vào rạp (`enterTouchTheater` khi nhả tay, cần user activation); chạm dòng transcript = tua đến dòng đó và phát; chạm phụ đề = phát/dừng. Hover-pause (`subtitle-main-hover`, `subtitle-sidebar-hover`) chỉ cho chuột: bỏ qua `pointerType === 'touch'` để không kẹt dừng. Không tô sáng khi chạm (`-webkit-tap-highlight-color: transparent`). Nghệ thuật bật: nút góc ♥/Toàn màn hình không nền/viền; ảnh web luôn nét trên cảm ứng (bỏ blur ngẫu nhiên, giữ hiệu ứng khác). Xem trước Tùy chọn phụ đề nền đặc ở cả hai tab.
- Chọn từ bằng nhấn giữ (v3.5.153, `touch-layout.js` `touchSelect*`): khi bật Nhấn để dịch, giữ ~450ms trên một từ của `.te-sub-en` / `.yt-dual-item-en` (chỉ chạm) chọn từ đó (bỏ dấu câu), kéo tiếp để chọn thêm từ; video dừng (`pauseMediaFor('touch-select')`), khi nhả phát `mouseup` tổng hợp lên dòng phụ đề để `content.js` mở từ điển đầy đủ (1 từ, bật từ điển) hoặc popup dịch, có Phát âm khi dịch. Overlay cảm ứng đặt class `lhn-touch-overlay` trên `<html>`; khi đó `content.js` (`placeTouchOverlaySheet`) đặt popup dịch / từ điển của phụ đề Keepit thành bottom sheet (`.lhn-touch-sheet`, CSS ở `content.css`). Popup giữ video dừng qua `app-popup`; chạm ra ngoài chỉ đóng sheet (chạm đó bị nuốt) và video phát lại nếu trước đó đang phát. Chặn menu/chọn chữ gốc khi nhấn giữ trong vùng phụ đề.
- Yêu thích video: ♥ và double-tap (video/phụ đề/transcript, 280ms/60px, chuỗi 650ms) ghi `lhnFavoriteVideos` [{`videoId`, title, channel, `addedAt`}] theo video ID chuẩn; với web source (v3.5.152) ghi [{`url` (http/https, bỏ #, ≤2048), title, channel = tên miền, `addedAt`}]; Dashboard lọc Yêu thích hiện cả video chưa có highlight; có trong sao lưu/khôi phục.
- Thanh tiến trình kéo được ở mọi nền tảng (`setupProgressDrag`): tooltip thời gian + câu, seek khi nhả.

- v3.5.161: popup tốc độ (`#te-speed-popup`) và menu chế độ phụ đề (`#te-subtitle-mode-menu`) giống sheet tốc độ của Reader. Máy tính: popover 340px bo 20, đầu = tiêu đề 17/700 · giá trị (tím, tối `#c4b5fd`) · ✕ 38px; giữ phím 1–4. Cảm ứng (`te-touch-layout`/`te-touch-theater`): bottom sheet `min(560px,100%)` bo 22 22 0 0, thanh kéo, trượt lên, lớp mờ `.te-psheet-scrim` (anh em ngay sau popup; desktop trong suốt nhưng vẫn bắt click). ✕/lớp mờ có `data-psheet-close="speed|sub"`; tiêu đề menu phụ đề lấy `t('videoSubtitleMode')` trong `updateSubtitleDisplayModeLabels`. Cả hai cùng sheet More/Cài đặt cảm ứng (`touch-layout.js`) gắn `LHN_SHEET` (kéo đóng, khóa cuộn). `#te-video-mode-menu` giữ nguyên.

## 5. Kiểm tra và xác minh

- v3.5.54: `node --check` JS Overlay sửa, `git diff --check` và focused checks cho popup anchor/size, Theater + Large 26/20px ở 100% và giới hạn frame 98% đạt; browser QA chưa chạy.
- v3.5.53: `node --check` các JS liên quan, `git diff --check` và focused tests cho double-click reset/30 px default đạt; Browser QA chưa chạy.
- v3.5.52: `node --check` các JS sửa, `git diff --check`, source assertions và focused VM tests cho legacy/default position, handle geometry, control visibility, clamp và restore đều đạt. Browser QA chưa chạy.
- Browser QA cần xác nhận popup Cài đặt/menu Chế độ xem canh mép phải control bar 4px, body settings tối đa 530px và menu rộng thêm 20px; Theater + Large: EN/VI 26/20px ở mức 100%, các slider khác không đổi, hộp wrap trong 98% frame; handle drag bottom↔top, double-click ở nội dung lẫn nút reset về 30 px, panel trở lại đúng vị trí sau khi control bar ẩn; thử cả vị trí tùy chỉnh cũ.
- Static checks không thay thế kiểm thử extension thật; regression QA cần xác nhận Video/Web switching, TTS, Study activities, shortcuts và cleanup.
- v3.5.167: `lockOverlayViewportScale` / `restoreOverlayViewportScale` — khi mở overlay, trang có viewport `width=device-width` được thêm `minimum-scale=1` (Chrome mobile không thu nhỏ trang có nội dung tràn ngang, overlay 100vw/100vh phủ kín), đóng trả lại meta gốc. `fitControlBar` (ResizeObserver trên `.te-control-bar`, gọi khi mở): đo nội dung nhóm trái/phải/cuối ở layout thường; nếu 4 cột đều sẽ làm nhóm cuối đè nhóm phải (hoặc nhóm trái vượt cột) thì thêm `.te-bar-tight` (cột `minmax(min-content,1fr)`, gap 4px, padding 12px, icon nguồn tối thiểu 22px); không áp cho touch layout/theater/study.
