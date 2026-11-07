# Keepit Privacy Policy — Draft / Chính sách quyền riêng tư Keepit — Bản nháp

> **DRAFT — NOT FOR PUBLICATION.** Updated 7 November 2026 for Keepit version 3.5.136. Fill in the bracketed fields and review before publishing or submitting to a store.
>
> **Owner / controller:** `[LEGAL NAME]`  
> **Privacy contact:** `[PRIVACY CONTACT EMAIL]`  
> **Public policy URL:** `[PUBLIC HTTPS URL]`  
> **Effective date:** `[DATE]`

---

## English

**Keepit only sends the data that is needed to outside services when you use the matching feature. Keepit does not sell users' personal data.**

### 1. Scope

This policy covers the Keepit browser extension for Chromium-based browsers and Firefox: page highlighting and notes, translation and Bilingual Reader, dictionary, read-aloud, video player and study modes (dictation, speaking practice, flashcards), the Dashboard, and the AI panel. Keepit does not run its own server, account system, cloud sync or payment service in this version; Keepit itself does not receive your data.

### 2. Data kept in your browser

Keepit stores in your browser profile: highlights, notes, the title and address of pages you annotate, flashcards and study progress, settings, caches of translations, audio and video captions (to avoid repeat requests), the link between a page address and an AI conversation (saved only after a message is sent), panel state, local usage counters, an optional demo profile, and a diagnostic log containing only error codes. A short recording made during speaking practice stays in memory for playback and is not saved or uploaded by Keepit.

### 3. Data sent to outside services

Each service below receives only what the feature needs, together with ordinary connection information (such as IP address and browser type). Each service handles data under its own terms and privacy policy.

| Feature (when it runs) | Recipient | Data sent |
| --- | --- | --- |
| Translation — when you select text, create a note with auto-translate on, or use Bilingual Reader or translated captions | Google Translate, MyMemory, Lingva (public instances run by independent operators). The same text is sent to these services at the same time and the first answer is used. | The text to translate and the target language |
| Dictionary — when you look up a word | Google Translate, MyMemory, Free Dictionary API, Datamuse | The word or its root and the language; the dictionary's example sentences for that word (to translate them) |
| Flashcard translation — when you study flashcards | Google Translate, MyMemory | The context sentence saved in your note |
| Read aloud with a Google voice — when you press read | Google | The text to read (up to 500 characters) and its language; a short sample to detect the language |
| Video captions and thumbnails — when you use the video player or study modes on YouTube | YouTube | The video's ID. The browser is allowed to attach suitable cookies; which cookies are actually sent depends on the browser and your sign-in state. YouTube uses them under its own policy. |
| AI panel / Ask AI — when you open it from a page | ChatGPT (OpenAI), Gemini (Google), Claude (Anthropic) | Your selected text is placed in the AI's message box and is sent when you press Send (or automatically, only if you turned auto-send on). When the page has no linked conversation yet, the page's address and a label are added to the message at Send. When the panel opens, the page's address is also passed to the AI page inside the browser, so the AI page can read it before you press Send. |
| Speaking practice — when you use the microphone | Your browser's speech-recognition service | Audio is processed by the browser to produce a transcript. Some browsers, such as Chrome, send the audio to a remote recognition service (per MDN); the browser's own terms apply. |
| Interface font — when Keepit's styles load on a page, and on Dashboard pages | Google Fonts | No page content. Google receives an ordinary font request (IP address, browser information, and possibly referrer information depending on the browser). Extra fonts are requested when you turn on a custom font or use Bilingual Reader. |

Pages you open yourself from Keepit (such as a Google search for a definition) and site icons loaded from the website itself are ordinary page visits, not data sent by Keepit.

### 4. How Keepit uses data

Data is used only to provide the feature you are using. Keepit does not sell data, does not use it for advertising, credit or lending decisions, and does not transfer it except to the services listed above to provide the feature.

**Chrome Web Store:** The use of information received from Keepit adheres to the [Chrome Web Store User Data Policy](https://developer.chrome.com/docs/webstore/program-policies/), including the Limited Use requirements.

**Firefox:** Keepit declares the data categories "website content" and "browsing activity" as required for its features.

### 5. Permissions

Keepit asks for access to all websites because highlighting, notes, translation, dictionary and the AI panel work on any page you choose. It uses browser storage, tab information (to know the current page), the side panel / sidebar, a context menu item for Ask AI, and network rules. To show AI websites inside the AI panel, a network rule removes those AI websites' frame-protection headers when they load inside a frame. Keepit requests no clipboard or cookie permission; the copy-link button only writes the page address when you click it.

### 6. Retention and deletion

Browser data remains until you delete it in the Dashboard, clear extension data or uninstall Keepit. Export your data first if you need it. Data already sent to an outside service is held by that service under its own policy; Keepit cannot delete it.

### 7. Children, changes and contact

**Children:** `[CONFIRM AGE POLICY BEFORE PUBLISHING]`. We will update this policy and the store disclosures before any data practice changes. Contact: `[PRIVACY CONTACT EMAIL]`.

---

## Tiếng Việt

**Keepit chỉ truyền dữ liệu cần thiết đến các dịch vụ bên ngoài khi người dùng sử dụng tính năng tương ứng. Keepit không bán dữ liệu cá nhân của người dùng.**

### 1. Phạm vi

Chính sách này áp dụng cho tiện ích Keepit trên trình duyệt nhân Chromium và Firefox: tô sáng và ghi chú, dịch và Bilingual Reader, từ điển, đọc to, trình phát video và các chế độ học (chép chính tả, luyện nói, flashcard), Dashboard và AI panel. Bản này không có máy chủ, tài khoản, đồng bộ cloud hay thanh toán của Keepit; bản thân Keepit không nhận dữ liệu của bạn.

### 2. Dữ liệu giữ trong trình duyệt

Keepit lưu trong hồ sơ trình duyệt: phần tô sáng, ghi chú, tiêu đề và địa chỉ trang bạn ghi chú, flashcard và tiến độ học, cài đặt, bộ nhớ đệm bản dịch, âm thanh và phụ đề video (để khỏi gửi lại), liên kết giữa địa chỉ trang và cuộc trò chuyện AI (chỉ lưu sau khi tin nhắn đã gửi), trạng thái panel, bộ đếm hạn mức cục bộ, hồ sơ mẫu nếu bạn tạo, và nhật ký lỗi chỉ gồm mã lỗi. Đoạn ghi âm ngắn khi luyện nói chỉ nằm trong bộ nhớ để phát lại; Keepit không lưu hay tải nó lên.

### 3. Dữ liệu gửi đến dịch vụ bên ngoài

Mỗi dịch vụ dưới đây chỉ nhận phần dữ liệu tính năng cần, kèm thông tin kết nối thông thường (như địa chỉ IP, loại trình duyệt). Mỗi dịch vụ xử lý dữ liệu theo điều khoản và chính sách quyền riêng tư của riêng họ.

| Tính năng (khi nào chạy) | Bên nhận | Dữ liệu gửi |
| --- | --- | --- |
| Dịch — khi bạn chọn văn bản, tạo ghi chú có bật tự dịch, dùng Bilingual Reader hoặc phụ đề dịch | Google Translate, MyMemory, Lingva (máy chủ công khai do bên độc lập vận hành). Cùng một đoạn văn được gửi đồng thời tới các dịch vụ này và dùng kết quả về trước. | Văn bản cần dịch và ngôn ngữ đích |
| Từ điển — khi bạn tra từ | Google Translate, MyMemory, Free Dictionary API, Datamuse | Từ hoặc gốc từ và ngôn ngữ; câu ví dụ của từ đó trong từ điển (để dịch) |
| Dịch flashcard — khi bạn học flashcard | Google Translate, MyMemory | Câu ngữ cảnh lưu trong ghi chú của bạn |
| Đọc to bằng giọng Google — khi bạn bấm đọc | Google | Văn bản cần đọc (tối đa 500 ký tự) và ngôn ngữ; một đoạn mẫu ngắn để nhận diện ngôn ngữ |
| Phụ đề và ảnh thu nhỏ video — khi bạn dùng trình phát video hoặc chế độ học trên YouTube | YouTube | Mã video. Trình duyệt được phép đính kèm cookie phù hợp; cookie nào thực sự được gửi phụ thuộc trình duyệt/trạng thái đăng nhập; YouTube dùng theo chính sách riêng. |
| AI panel / Hỏi AI — khi bạn mở từ một trang | ChatGPT (OpenAI), Gemini (Google), Claude (Anthropic) | Văn bản bạn chọn được đặt vào ô soạn tin của AI và chỉ gửi khi bạn bấm Gửi (hoặc tự gửi, chỉ khi bạn đã bật tự gửi). Nếu trang chưa có cuộc trò chuyện liên kết, địa chỉ trang và nhãn được thêm vào tin nhắn lúc Gửi. Khi panel mở, địa chỉ trang cũng được chuyển vào trang AI ngay trong trình duyệt, nên trang AI có thể đọc được trước khi bạn bấm Gửi. |
| Luyện nói — khi bạn dùng micro | Dịch vụ nhận dạng giọng nói của trình duyệt | Trình duyệt xử lý âm thanh để tạo bản chép lời. Một số trình duyệt như Chrome gửi âm thanh tới dịch vụ nhận dạng từ xa (theo MDN); áp dụng điều khoản của trình duyệt. |
| Phông chữ giao diện — khi kiểu hiển thị của Keepit được tải trên trang, và trên các trang Dashboard | Google Fonts | Không có nội dung trang. Google nhận yêu cầu tải phông thông thường (địa chỉ IP, thông tin trình duyệt, và có thể có thông tin trang giới thiệu tùy trình duyệt). Phông bổ sung được tải khi bạn bật phông tùy chỉnh hoặc dùng Bilingual Reader. |

Trang bạn tự mở từ Keepit (như tìm định nghĩa trên Google) và biểu tượng tải từ chính website đó là lượt truy cập trang thông thường, không phải dữ liệu Keepit gửi đi.

### 4. Cách Keepit dùng dữ liệu

Dữ liệu chỉ dùng để cung cấp tính năng bạn đang dùng. Keepit không bán dữ liệu, không dùng cho quảng cáo, xét tín dụng hay cho vay, và không chuyển cho ai ngoài các dịch vụ nêu trên để cung cấp tính năng.

**Chrome Web Store:** Việc sử dụng thông tin Keepit nhận được tuân thủ [Chrome Web Store User Data Policy](https://developer.chrome.com/docs/webstore/program-policies/), bao gồm các yêu cầu Limited Use.

**Firefox:** Keepit khai báo các loại dữ liệu "nội dung website" và "hoạt động duyệt web" là bắt buộc cho tính năng.

### 5. Quyền truy cập

Keepit xin quyền trên mọi website vì tô sáng, ghi chú, dịch, từ điển và AI panel hoạt động trên bất kỳ trang nào bạn chọn. Keepit dùng bộ nhớ trình duyệt, thông tin tab (để biết trang hiện tại), side panel / sidebar, một mục menu chuột phải cho Hỏi AI, và quy tắc mạng. Để hiện website AI bên trong AI panel, một quy tắc mạng gỡ các header chống nhúng khung của các website AI đó khi chúng được tải trong khung. Keepit không xin quyền clipboard hay cookie; nút sao chép liên kết chỉ ghi địa chỉ trang khi bạn bấm.

### 6. Thời hạn và xóa

Dữ liệu trong trình duyệt còn đến khi bạn xóa trong Dashboard, xóa dữ liệu tiện ích hoặc gỡ Keepit. Hãy xuất dữ liệu trước nếu cần. Dữ liệu đã gửi tới dịch vụ bên ngoài do dịch vụ đó giữ theo chính sách riêng; Keepit không xóa được.

### 7. Trẻ em, thay đổi và liên hệ

**Trẻ em:** `[XÁC NHẬN CHÍNH SÁCH ĐỘ TUỔI TRƯỚC KHI ĐĂNG]`. Chúng tôi sẽ cập nhật chính sách này và phần khai báo trên cửa hàng trước khi thay đổi cách xử lý dữ liệu. Liên hệ: `[PRIVACY CONTACT EMAIL]`.
