# Tài liệu kỹ thuật nội bộ

> Các trang này giúp định hướng khi đọc source; code là nguồn sự thật. Chỉ mở trang liên quan tới yêu cầu.

| Tài liệu | Phạm vi | Đọc khi |
|---|---|---|
| [Background](modules/background.md) | Service worker, runtime messages, AI panel provider state, IndexedDB, usage, TTS | Sửa routing/provider selection, message, annotation storage hoặc provider proxy. |
| [Content](modules/content.md) | Tương tác trang, AI editor bridge, highlight, note, Sidebar, selection | Sửa selector/fill provider, luồng website, DOM observer, shortcut hoặc annotation UI. |
| [Core](modules/core.md) | Defaults, config, settings, messaging, languages, cache | Sửa nền tảng dùng chung hoặc thứ tự nạp. |
| [Dashboard](modules/dashboard.md) | Overview, Listening, Highlights & Notes (LR), flashcards/settings | Sửa `pages/dashboard.html`, LR bridge hoặc chức năng Dashboard. |
| [Overlay](modules/overlay.md) | Shared Video/Web overlay, Study engine/activities và View modes | Sửa overlay, nguồn Video/Web, Shadowing/Dictation integration hoặc chế độ hiển thị. |
| [Study](modules/dictation.md) | Dictation/Writing, Shadowing/Speaking, scoring và session persistence | Sửa Study activities, cue sync, chấm điểm hoặc tiến độ. |
| [Popup](modules/popup.md) | Popup settings và website controls | Sửa popup, shortcut/settings controls hoặc mở Dashboard. |
| [Reader](modules/reader.md) | Bilingual Reader và TTS | Sửa dịch trên trang, đọc liên tục, voice hoặc audio fallback. |
| [Shared](modules/shared.md) | AI provider registry/panel/toolbar, ChatGPT route/prompt helpers, icons và search | Sửa provider state, panel bridge, prompt/route helper, cache favicon hoặc search API. |
| [Translate](modules/translate.md) | Translation, dictionary, study translation, search | Sửa provider, cache, từ điển hoặc ranking/highlight. |
| [Video](modules/video.md) | YouTube caption source, transcript, cache và timing | Sửa track selection, caption parsing, transcript cache hoặc cue/playback sync. |
