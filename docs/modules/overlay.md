# Overlay — Hướng dẫn kỹ thuật

> Source code là nguồn sự thật; module tổ chức Overlay Video/Web, Study activities và View settings.

## 1. Mục đích và phạm vi

Overlay cung cấp UI cho Video (YouTube) và Web. `overlay-controller.js` điều phối source/activity; runtime state dùng `sourceType` (`video`/`web`), `sourceId`, `activeMedia`, `sourceLanguage` và `studyActivity` (`null`/`dictation`/`shadowing`). `source/` xử lý cues/media, `study/` xử lý activities/helpers, `view/` quản lý layout/caption. Reader, TTS, translation và cache vẫn thuộc module tương ứng.

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`js/overlay/overlay-controller.js`](../../js/overlay/overlay-controller.js) | `openOverlay`, `createStudyOverlayApi`, `LHN_OVERLAY_SET_STUDY_ACTIVITY` | Lifecycle, routing và Reader rate bridge. |
| [`js/overlay/overlay-template.js`](../../js/overlay/overlay-template.js) | `OVERLAY_HTML`, `OVERLAY_CSS`, `LHN_OVERLAY_TEMPLATE.createStudyUi` | Shadow DOM markup/CSS và Study UI. |
| [`js/overlay/source/video.js`](../../js/overlay/source/video.js) | `loadCaptions`, `onTimeUpdate`, `parseCaptions` | YouTube captions, cache và cue timing. |
| [`js/overlay/source/web.js`](../../js/overlay/source/web.js) | `prepareWebSource`, `createWebTtsMedia`, `attachWebMedia` | Reader cues, Web media và thumbnail visualizer. |
| [`js/overlay/study/dictation/dictation.js`](../../js/overlay/study/dictation/dictation.js) | `LHN_STUDY.open` | Shared Study shell và Dictation/Typing. `LHN_DICTATION` là alias cũ. |
| [`js/overlay/study/shadowing/shadowing-activity.js`](../../js/overlay/study/shadowing/shadowing-activity.js), [`js/overlay/study/shadowing/shadowing.js`](../../js/overlay/study/shadowing/shadowing.js) | `LHN_SHADOWING_ACTIVITY_FACTORY`, `onShadowingControlClick` | Shadowing recognition, recording, feedback và Web TTS controls. |
| [`js/overlay/study/shared/study-score.js`](../../js/overlay/study/shared/study-score.js), [`js/overlay/study/shared/learning-rules.js`](../../js/overlay/study/shared/learning-rules.js) | `LHN_STUDY_SCORE`, `LHN_STUDY_RULES` | Logic dùng chung; globals Dictation cũ là aliases. |
| [`js/overlay/study/shared/session-index.js`](../../js/overlay/study/shared/session-index.js) | `LHN_STUDY_SESSION_INDEX` | Session metadata; legacy global và storage key được giữ. |
| [`js/overlay/view/layout-mode.js`](../../js/overlay/view/layout-mode.js), [`js/overlay/view/cc-mode.js`](../../js/overlay/view/cc-mode.js) | `applyVideoDisplayMode`, `setSubtitleDisplayMode` | Theater/Reading/Combined, CC modes và translation queue. |
| [`js/shared/site-icons.js`](../../js/shared/site-icons.js) | `LHN_SITE_ICONS.load` | Favicon theo origin cho title bar. |

## 3. Luồng chính

1. Manifest nạp template, source/view và Study modules; controller bootstrap cuối. Site icons cung cấp favicon theo origin.
2. Controller chọn Video hoặc Web. Video lấy captions từ player/transcript hoặc live-caption fallback; Web lấy Reader text và dựng cues/media ảo, dùng thumbnail hoặc Lo-fi Room fallback trong frame.
3. `LHN_OVERLAY_API` cung cấp cues; `LHN_STUDY` mở shared shell cho Dictation/Typing hoặc Shadowing. Recognition, recording, replay và feedback thuộc Shadowing activity.
4. Web TTS dùng `LHN_TTS`/Reader rate; translation dùng `BILINGUAL_TRANSLATE` và cache hiện có. View quản lý layout/CC, không tạo engine hay cue cache song song.
5. Khi đóng, Overlay dọn media/listeners theo source và giữ mutual exclusion với Reader.

## 4. Hợp đồng và quy tắc cần giữ

- Các file là classic content scripts trong cùng isolated world; giữ controller bootstrap sau module definitions.
- Selector chung dùng `te-study-*`; Typing/Dictation riêng dùng `te-dict-*`; Shadowing riêng dùng `te-shadowing-*`. Giữ giao diện/hành vi khi đổi định danh.
- API mới là `LHN_STUDY`, `LHN_STUDY_SCORE`, `LHN_STUDY_RULES`, `LHN_STUDY_SESSION_INDEX`; các global/method Dictation cũ và Web-TTS bridge cũ vẫn được alias. Session/storage keys, `captionTrackLanguage` trong transcript cache và event contract không đổi.
- Web TTS dùng Reader rate đã lưu (global/per-language, 0.5×–3×); Video/YouTube giữ 0.5×–2×, Dictation replay giữ slow replay 0.6×. Shared TTS engine không đổi.
- Web Overlay progress fill nội suy trong cue theo tốc độ phát hiện tại và dừng khi TTS tạm dừng; Video dùng updater riêng nên không bị ảnh hưởng.
- Theater + Large: khung phụ đề giới hạn theo 80% chiều rộng `.te-player-frame`; main subtitle giữ chiều rộng tự nhiên và chỉ wrap khi vượt giới hạn đó. Dòng dịch vẫn được wrap theo chiều rộng còn lại.
- `study/shared/` chỉ chứa logic dùng chung. Lifecycle/result branches còn trong Dictation shell và cần tách tiếp mà không đổi UX. Dashboard có Dictation sessions/statistics, chưa có Shadowing practice route.
- Giữ các ràng buộc visualizer: Breathing/Pan/Tilt 0.2×–3.0×, không Static/Pulse, biên độ giảm 50%; bốn waveform; bảy hiệu ứng đổi độc lập 30–180 giây; blur 0–10 px; bokeh giữ glow alpha/radius 2× và fade mật độ. Favicon 22×22 px, globe fallback.

## 5. Kiểm tra và xác minh

- v3.5.49: `node --check` `js/overlay/overlay-template.js` và `js/overlay/view/layout-mode.js`, `git diff --check` đạt cho 90%-frame subtitle width/wrapping; Browser QA chưa chạy.
- v3.5.48: `node --check` `js/overlay/overlay-template.js` và `git diff --check` đạt cho Theater + Large subtitle width/wrapping; Browser QA chưa chạy.
- v3.5.47: `node --check` các file JS sửa đạt cho toast "đang ở chế độ xem này" khi bấm shortcut Alt+1–3 đúng mode; Browser QA chưa chạy.
- v3.5.44: `node --check` JS Overlay, `git diff --check` và focused VM smoke test cho Web progress (tiến trong cue, phản ánh playback rate, pause giữ nguyên, resume tiếp tục) đạt. Browser QA chưa chạy.
- v3.5.43: `node --check` toàn bộ JS `js/overlay/`, `git diff --check`, 45 manifest JS paths và VM smoke tests cho Study/legacy aliases, scoring, storage key đều đạt. Browser QA chưa chạy; speed contract được kiểm tra tĩnh.
- v3.5.42: Reader/Web/Overlay VM checks đạt cho Reader shared rate (global/per-language, 0.5×–3×) và speed path YouTube/Dictation riêng. Browser QA chưa chạy.
- Static checks có thể lặp bằng Node: parse manifest, xác nhận script paths/order và nạp Study scripts trong VM. Browser QA cần xác nhận Video/Web switching, Typing/Shadowing, TTS, shortcuts, cleanup và layout; static checks không thay thế kiểm thử extension thật.
