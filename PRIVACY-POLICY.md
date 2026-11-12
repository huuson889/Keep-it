# Keepit Privacy Policy — Draft / Chính sách quyền riêng tư Keepit — Bản nháp

> **DRAFT — NOT FOR PUBLICATION.** Prepared 24 October 2026 for Keepit extension version 3.4.553. Complete every bracketed field, verify the live data flows and obtain appropriate legal review before publishing or submitting to a browser store.
>
> **Controller / owner:** `[LEGAL NAME OF THE PERSON OR ENTITY RESPONSIBLE FOR KEEPIT]`  
> **Privacy contact:** `[PRIVACY CONTACT EMAIL]`  
> **Public policy URL:** `[PUBLIC HTTPS URL]`  
> **Effective date:** `[DATE THIS POLICY IS ADOPTED]`

This document covers the current extension and describes planned account/cloud features in a separately labelled section. Planned features are **not active** in the current version. This draft is not legal advice and does not replace store-specific disclosures, consent flows, or a review of the laws applicable to the operator and users.

---

## English

### 1. Scope and current service status

This policy applies to the Keepit browser extension/add-on for Chromium-based browsers and Firefox-based browsers, including its Dashboard, page features, translation, dictionary, text-to-speech, Bilingual Reader, flashcards, and diagnostics.

In version 3.4.553, Keepit does not operate an account server, cloud-sync service, remote Keepit database, or real payment service. The Dashboard's account and billing screens are local prototypes. Notes and settings are stored in the browser profile. The future cloud section below is a description of a plan, not a statement that Keepit currently collects or stores data in the cloud.

### 2. Information handled by the current extension

**Information stored in the browser profile.** Keepit stores information needed for the features you use, such as highlights, note text, quoted/context text, page title and URL associated with an annotation, colors, tags, favorites, flashcard/study data, extension settings, and local feature/cache/usage state. If you create or edit the Dashboard's demo profile, its display name, username, email address, and avatar image data (if supplied) are also stored locally; this is not a real online account. Annotation data is stored in extension IndexedDB; settings and other local state use the browser's extension storage. Keepit does not currently send this local library, demo profile, or settings to a Keepit-operated server.

**Page content.** The extension's content scripts run on supported web pages to provide highlighting, notes, translation, dictionary, and Reader features. Page text is processed in the browser to provide those features. Keepit does not currently upload whole browsing sessions to a Keepit server. When you invoke a feature that needs an outside service, the relevant word, selected text, or Reader passage may be sent to that service as described below.

**Local usage prototype.** Current usage-limit and billing logic is a local prototype. Its counters and prototype state are stored in the browser profile; the current build does not send those counters to a Keepit billing server and does not process real payments.

**Diagnostic error log.** Keepit stores up to 200 classified technical entries in browser extension storage. Each entry contains a timestamp, component, severity, and category code. It does not store the original console message, stack trace, page URL, page contents, selected text, or account details. The log is not automatically uploaded to Keepit. A JSON file is created only when you explicitly choose **Export log** in Dashboard > Settings > About and is then handled by your browser as a download.

### 3. Information sent to outside services

Keepit uses outside services to provide features. The service receives the information needed for the request and may also receive ordinary connection/request information such as an IP address, browser/device information, and request metadata. The provider's own terms and privacy policy govern its handling after it receives a request; Keepit does not control the provider's retention or infrastructure. We will add verified links to each provider's current privacy information before publication.

| Feature or request | Recipient(s) in the current build | Information sent / reason |
| --- | --- | --- |
| Translation, including Bilingual Reader and flashcard translation | Google translation endpoints (`translate.googleapis.com`, `clients5.google.com`); MyMemory (`api.mymemory.translated.net`); the configured Lingva instances (`lingva.ml`, `lingva.thedaviddelta.com`) | The text or passage being translated and the relevant language parameters, to return a translation. Reader passages may be sent when you start or use translation features. The service selected by the feature/fallback may vary. |
| Dictionary, IPA, synonyms, antonyms, word forms, and collocations | `api.dictionaryapi.dev`; `api.datamuse.com`; Google translation endpoint for a fallback IPA lookup; MyMemory where translation is requested | The word/root or lookup query and language information needed to return the requested definition or related-word data. |
| Google text-to-speech | `translate.google.com/translate_tts` | The text to be spoken and its language, so Google can return audio. If you choose a browser/system voice, Keepit does not use this Google TTS request path; the browser or operating system may process speech according to its own settings and privacy terms. |
| Custom web fonts | Google Fonts (`fonts.googleapis.com` and `fonts.gstatic.com`) | The font stylesheet/assets, requested when you enable and select a custom web font. When custom fonts are off or the website is disabled in Keepit, the stylesheet is not attached. Google may receive normal network/request information and browser-provided referrer information. |
| Dashboard favicon fallback | Google S2 Favicon (`www.google.com/s2/favicons`) | If the page's direct `/favicon.ico` request fails, the Dashboard requests a fallback icon and includes the page URL in the `domain_url` query parameter. |
| Definition search opened by the user | Google Search (`www.google.com/search`) | The word/query is included in the search URL when you choose the definition-search feature. |

Keepit uses these requests to provide the requested extension features. Keepit does not use the text sent for these features for advertising or sell it to data brokers. This statement does not control how a third-party provider handles a request under its own terms.

### 4. Storage, retention, export, and deletion

Local extension data remains in the browser profile until it is deleted through the extension/browser controls or removed by the browser. You can export supported library data from the Dashboard and delete annotations/pages using the available Dashboard controls. Export important data before uninstalling or clearing browser extension data; exact removal behavior depends on the browser.

The local diagnostic log is capped at 200 entries; when new entries exceed that limit, older entries are dropped. It is not currently automatically uploaded, and the current UI provides export but not a dedicated clear-log button. Temporary translation/dictionary caches are stored locally to avoid repeat requests and are managed by the extension's cache behavior.

Keepit cannot delete information retained by an outside provider after you have sent a request to that provider. To exercise controls over provider-held data, contact that provider under its own privacy process.

### 5. Permissions and access

The extension requests browser permissions for storage, larger local storage, active-tab/tab functions, and a network-request rule used for Google TTS. Content scripts are configured to run on supported websites because highlighting, notes, translation, and Reader features need access to page content. Host access also supports the named translation, dictionary, font, and favicon services. These permissions do not mean that Keepit sends every page to a Keepit server; the transmissions described above occur to provide specific extension features. The policy and any in-product disclosures must remain consistent with the actual manifest and behavior.

### 6. Security and international processing

Current user-created content and settings are stored in the browser profile; Keepit does not currently maintain a cloud copy. Keepit does not add its own encryption layer to browser-profile storage. Protect your device and browser profile, and use the browser's security controls. Requests to the listed HTTPS services are handled by those providers, which may process them in countries other than yours under their own terms.

### 7. Planned account and cloud features — NOT ACTIVE

The following describes a product plan only. None of these cloud/account operations is active in version 3.4.553. Before enabling them, Keepit will update this policy, confirm the service providers and data locations, explain the data in the product, and implement the required controls and consent.

If launched, account/cloud services are expected to process account/identity details, user-created annotations and settings selected for sync, flashcard/Dictation progress, sync status, and plan/usage entitlements. A server-side service provider has not yet been finalized. The current plan is for a 7-day Ultra trial with sync, followed by Free with no new sync and any existing cloud data in read-only/export mode; plan quotas and payment providers remain undecided. The product plan also calls for advance notices 30 and 7 days before cloud data is progressively removed after 12 months without meaningful activity, with an opportunity to export. These are planned rules, not current data practices, and may change before launch.

### 8. Children, contact, and policy changes

**Children:** `[CONFIRM THE INTENDED AGE RANGE AND ANY CHILD-SPECIFIC RULES BEFORE PUBLICATION; DO NOT PUBLISH THIS PLACEHOLDER.]`

For privacy questions or requests, contact `[PRIVACY CONTACT EMAIL]` and identify the information or request involved. Do not send passwords, payment-card details, or unnecessary sensitive information by email.

We will update this policy when the extension's data practices change. Material changes must also be reflected in relevant store disclosures and, where required, in-product notice/consent before the new practice begins. The published version should show its effective date and a change history.

### 9. Store-disclosure checklist (publisher use)

Before publication, complete the controller/contact/date/URL fields; verify every network endpoint and provider; link each provider's current privacy information; decide the children's-privacy statement and the language version(s); and ensure the Chrome Web Store privacy fields, any required prominent in-product disclosure/consent, and Firefox's manifest data-collection declaration match actual behavior. This checklist is not a substitute for those disclosures.

---

## Tiếng Việt

### 1. Phạm vi và trạng thái hiện tại

Chính sách này áp dụng cho tiện ích Keepit trên các trình duyệt nhân Chromium và Firefox, gồm Dashboard, tính năng trên trang, dịch, từ điển, chuyển văn bản thành giọng nói, Bilingual Reader, flashcard và nhật ký chẩn đoán.

Trong phiên bản 3.4.553, Keepit chưa vận hành máy chủ tài khoản, dịch vụ đồng bộ cloud, cơ sở dữ liệu Keepit từ xa hoặc thanh toán thật. Các màn hình tài khoản và thanh toán trong Dashboard chỉ là bản mẫu local. Ghi chú và cài đặt được lưu trong hồ sơ trình duyệt. Phần cloud bên dưới chỉ mô tả kế hoạch, không có nghĩa Keepit đang thu thập/lưu dữ liệu cloud.

### 2. Thông tin được xử lý trong bản hiện tại

**Thông tin lưu trong hồ sơ trình duyệt.** Keepit lưu dữ liệu cần cho tính năng bạn sử dụng, ví dụ phần tô sáng, nội dung ghi chú, câu trích/ngữ cảnh, tiêu đề và URL trang gắn với ghi chú, màu, tag, mục yêu thích, dữ liệu flashcard/ôn tập, cài đặt extension và trạng thái cache/sử dụng local. Nếu bạn tạo hoặc sửa hồ sơ demo trong Dashboard, tên hiển thị, username, email và dữ liệu ảnh đại diện (nếu có) cũng được lưu local; đây không phải tài khoản trực tuyến thật. Dữ liệu annotation lưu trong IndexedDB của extension; cài đặt và trạng thái local khác dùng bộ nhớ extension của trình duyệt. Hiện Keepit không gửi thư viện local, hồ sơ demo hoặc cài đặt đến máy chủ do Keepit vận hành.

**Nội dung trang.** Content script chạy trên website được hỗ trợ để cung cấp tô sáng, ghi chú, dịch, từ điển và Reader. Nội dung trang được xử lý trong trình duyệt để cung cấp các tính năng đó. Hiện Keepit không tải toàn bộ lịch sử duyệt web lên máy chủ Keepit. Khi bạn dùng tính năng cần dịch vụ bên ngoài, từ/câu/đoạn liên quan có thể được gửi đến dịch vụ đó như mô tả bên dưới.

**Bản mẫu hạn mức local.** Logic hạn mức và billing hiện tại là bản mẫu chạy local. Bộ đếm và trạng thái mẫu được lưu trong hồ sơ trình duyệt; bản hiện tại không gửi số liệu này đến máy chủ billing của Keepit và không xử lý thanh toán thật.

**Nhật ký lỗi local.** Keepit lưu tối đa 200 mục kỹ thuật đã phân loại trong bộ nhớ extension. Mỗi mục chỉ có thời điểm, thành phần, mức độ và mã loại lỗi. Log không lưu nguyên văn thông báo console, stack trace, URL trang, nội dung trang, text đã chọn hoặc thông tin tài khoản. Log không tự động được tải lên Keepit. Chỉ tạo file JSON khi bạn chủ động bấm **Export log** trong Dashboard > Settings > About; trình duyệt sẽ xử lý file đó như một lượt tải xuống.

### 3. Thông tin gửi đến dịch vụ bên ngoài

Keepit dùng dịch vụ bên ngoài để cung cấp tính năng. Dịch vụ nhận thông tin cần cho request và có thể nhận thông tin kết nối/request thông thường như địa chỉ IP, thông tin trình duyệt/thiết bị và metadata request. Sau khi nhận request, nhà cung cấp xử lý theo điều khoản và chính sách riêng của họ; Keepit không kiểm soát thời hạn lưu hay hạ tầng của họ. Trước khi công bố, cần bổ sung liên kết đã xác minh đến thông tin quyền riêng tư hiện hành của từng nhà cung cấp.

| Tính năng/request | Bên nhận trong bản hiện tại | Thông tin gửi / mục đích |
| --- | --- | --- |
| Dịch, gồm Bilingual Reader và dịch flashcard | Google (`translate.googleapis.com`, `clients5.google.com`); MyMemory (`api.mymemory.translated.net`); các máy chủ Lingva đang cấu hình (`lingva.ml`, `lingva.thedaviddelta.com`) | Văn bản/đoạn cần dịch và tham số ngôn ngữ để trả kết quả. Đoạn Reader có thể được gửi khi bạn bắt đầu hoặc dùng tính năng dịch. Nhà cung cấp cụ thể có thể thay đổi theo tính năng/fallback. |
| Từ điển, IPA, từ đồng nghĩa/trái nghĩa, dạng từ và collocation | `api.dictionaryapi.dev`; `api.datamuse.com`; Google làm nguồn IPA dự phòng; MyMemory khi có yêu cầu dịch | Từ, gốc từ hoặc truy vấn cùng thông tin ngôn ngữ cần thiết để trả dữ liệu tra cứu. |
| Google text-to-speech | `translate.google.com/translate_tts` | Văn bản cần đọc và ngôn ngữ để Google tạo audio. Nếu chọn giọng trình duyệt/hệ thống, Keepit không dùng đường request Google TTS này; trình duyệt/hệ điều hành có thể xử lý theo cài đặt và chính sách riêng của họ. |
| Font web tùy chỉnh | Google Fonts (`fonts.googleapis.com`, `fonts.gstatic.com`) | Stylesheet/font chỉ được yêu cầu khi bạn bật và chọn custom web font. Khi custom font tắt hoặc website bị tắt trong Keepit, stylesheet không được gắn vào trang. Google có thể nhận thông tin mạng/request thông thường và thông tin referrer do trình duyệt gửi. |
| Fallback favicon trong Dashboard | Google S2 Favicon (`www.google.com/s2/favicons`) | Nếu request trực tiếp tới `/favicon.ico` của trang lỗi, Dashboard gọi Google để lấy icon dự phòng và gửi URL trang trong tham số `domain_url`. |
| Tra cứu định nghĩa do người dùng mở | Google Search (`www.google.com/search`) | Từ/truy vấn được đưa vào URL tìm kiếm khi bạn chọn tính năng tra cứu định nghĩa. |

Keepit dùng các request này để cung cấp tính năng tương ứng. Keepit không dùng văn bản gửi qua các tính năng này cho quảng cáo và không bán dữ liệu cho data broker. Cam kết này không kiểm soát cách nhà cung cấp bên thứ ba xử lý request theo điều khoản riêng của họ.

### 4. Lưu trữ, thời hạn, export và xóa

Dữ liệu extension local tiếp tục nằm trong hồ sơ trình duyệt cho đến khi bạn xóa bằng tính năng của extension/trình duyệt hoặc dữ liệu bị trình duyệt xóa. Bạn có thể export dữ liệu thư viện được hỗ trợ từ Dashboard và xóa annotation/trang bằng các điều khiển hiện có. Hãy export dữ liệu quan trọng trước khi gỡ extension hoặc xóa dữ liệu extension trong trình duyệt; cách xóa chính xác phụ thuộc trình duyệt.

Nhật ký lỗi local giới hạn ở 200 mục; khi vượt giới hạn, mục cũ bị loại bỏ. Hiện log không tự động được upload; giao diện có chức năng export nhưng chưa có nút xóa log riêng. Cache dịch/từ điển tạm thời được lưu local để giảm request lặp và được quản lý theo cơ chế cache của extension.

Keepit không thể xóa dữ liệu mà nhà cung cấp bên ngoài đã lưu sau khi nhận request. Muốn thực hiện quyền kiểm soát dữ liệu do nhà cung cấp giữ, bạn cần liên hệ với nhà cung cấp đó theo quy trình riêng của họ.

### 5. Quyền và truy cập

Extension yêu cầu quyền trình duyệt cho bộ nhớ, dung lượng local mở rộng, tab đang hoạt động/các thao tác tab và quy tắc request dùng cho Google TTS. Content script được cấu hình chạy trên website được hỗ trợ vì các tính năng tô sáng, ghi chú, dịch và Reader cần truy cập nội dung trang. Quyền host cũng phục vụ các dịch vụ dịch, từ điển, font và favicon nêu trên. Các quyền này không có nghĩa Keepit gửi mọi trang đến máy chủ Keepit; việc truyền dữ liệu bên ngoài xảy ra để cung cấp các tính năng cụ thể đã mô tả. Chính sách và mọi thông báo trong ứng dụng phải khớp với manifest và hành vi thật.

### 6. Bảo mật và xử lý quốc tế

Nội dung người dùng và cài đặt hiện lưu trong hồ sơ trình duyệt; Keepit chưa giữ bản sao cloud. Keepit không tự thêm lớp mã hóa riêng cho dữ liệu trong bộ nhớ hồ sơ trình duyệt. Hãy bảo vệ thiết bị và hồ sơ trình duyệt bằng các cơ chế bảo mật của trình duyệt. Request đến dịch vụ HTTPS bên ngoài được xử lý bởi nhà cung cấp đó và có thể được xử lý tại quốc gia khác theo điều khoản của họ.

### 7. Tài khoản và cloud dự kiến — CHƯA HOẠT ĐỘNG

Phần này chỉ mô tả kế hoạch sản phẩm. Các hoạt động tài khoản/cloud dưới đây **chưa hoạt động trong phiên bản 3.4.553**. Trước khi bật, Keepit sẽ cập nhật chính sách, xác nhận nhà cung cấp/vị trí dữ liệu, giải thích dữ liệu ngay trong sản phẩm và triển khai các kiểm soát/đồng ý cần thiết.

Nếu ra mắt, tài khoản/cloud dự kiến xử lý thông tin tài khoản/định danh, annotation và cài đặt người dùng chọn đồng bộ, tiến độ flashcard/Dictation, trạng thái sync và quyền lợi/hạn mức gói. Nhà cung cấp server chưa được chọn cuối cùng. Kế hoạch hiện tại là dùng thử Ultra 7 ngày có sync; sau đó Free không tạo sync mới và dữ liệu cloud đã có chuyển sang chỉ đọc/xuất. Hạn mức gói và nhà cung cấp thanh toán còn chưa chốt. Kế hoạch cũng dự kiến gửi nhắc trước 30 và 7 ngày khi dữ liệu cloud dần bị xóa sau 12 tháng không có hoạt động có ý nghĩa, đồng thời cho phép export. Đây là quy tắc dự kiến, không phải thực hành xử lý dữ liệu hiện tại, và có thể thay đổi trước khi ra mắt.

### 8. Trẻ em, liên hệ và thay đổi chính sách

**Trẻ em:** `[XÁC NHẬN ĐỘ TUỔI MỤC TIÊU VÀ QUY ĐỊNH RIÊNG TRƯỚC KHI CÔNG BỐ; KHÔNG ĐỂ NGUYÊN PLACEHOLDER NÀY.]`

Nếu có câu hỏi hoặc yêu cầu về quyền riêng tư, liên hệ `[EMAIL LIÊN HỆ QUYỀN RIÊNG TƯ]` và mô tả dữ liệu/yêu cầu cần xử lý. Không gửi mật khẩu, thông tin thẻ thanh toán hoặc dữ liệu nhạy cảm không cần thiết qua email.

Keepit sẽ cập nhật chính sách khi thực hành dữ liệu thay đổi. Thay đổi quan trọng cũng phải được cập nhật trong thông tin trên store và, khi cần, có thông báo/đồng ý trong sản phẩm trước khi thực hành mới bắt đầu. Bản công bố cần ghi ngày hiệu lực và lịch sử thay đổi.

### 9. Checklist cho nhà phát hành trước khi công bố

Điền chủ thể/email/ngày/URL; xác minh mọi endpoint và nhà cung cấp; thêm link chính sách quyền riêng tư hiện hành của từng bên; chốt tuyên bố về trẻ em và ngôn ngữ policy; bảo đảm trường Privacy trên Chrome Web Store, thông báo/đồng ý nổi bật trong sản phẩm khi được yêu cầu, và khai báo data collection trong manifest Firefox khớp hành vi thật. Checklist này không thay thế các thông báo đó.
