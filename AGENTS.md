# Keepit Working Rules for All AI Agents

## 1. Giới thiệu dự án
- Keepit app — một codebase Manifest V3: extension/addon cho mọi trình duyệt nhân Chromium (Chrome, Edge, Brave, …) và nhân Firefox (Firefox, Zen, Floorp, …).
- Ngoài extension: bản **APK Android** đóng gói riêng (ZIP nguồn để ở `Keepit-Apk-Zip`), và **iOS dự kiến** trong tương lai — không cam kết mốc thời gian.
- Code dùng chung cho mọi nền tảng; phần khác biệt theo nền tảng nằm trong script/thư mục build riêng, không fork codebase.


## 2. Vai trò tài liệu & nguồn sự thật
- `AGENTS.md`: quy trình và quy tắc dành cho AI/contributor.
- `PROJECT.md`: handoff hiện tại; mục 1 là snapshot ngắn, mục 2 chỉ giữ việc đang mở, mục 4 là bản đồ kiến trúc, mục 5 là nhật ký thay đổi duy nhất.
- `README.md`: hướng dẫn/tính năng/giới hạn hướng tới người dùng; không dùng làm nơi giữ trạng thái nội bộ.
- `docs/INDEX.md` và `docs/modules/*.md`: mục lục và hướng dẫn kỹ thuật nội bộ; không phải tài liệu người dùng hay nguồn sự thật thay cho code.
- `docs/changelog/`: nhật ký cũ chuyển nguyên văn từ `PROJECT.md`; chỉ đọc khi cần tra lịch sử một version cũ.
- `docs/ui-layout.md`: nguyên tắc giao diện chung (dọc/ngang, chạm/chuột) — mọi thay đổi giao diện phải theo; chỉ đọc khi sửa giao diện.
- `OPT-ARENA.md`: nhật ký ý tưởng/thiết kế đã chốt qua thảo luận với Arena (mới nhất ở trên): quyết định, sơ đồ text, phương án đã loại và câu hỏi còn mở; không ghi trạng thái triển khai hay nhật ký thay đổi code (thuộc `PROJECT.md`).
- Dùng `manifest.json` để xác nhận version và mã nguồn để xác nhận cách triển khai; chỉ khẳng định hành vi trên trình duyệt khi có kiểm tra thực tế được ghi nhận.

## 3. Đường dẫn
- Thư mục nguồn (Git repo, nơi sửa code): D:\Keepit\Keepit - Optimize Test\Keepit - Test
- Thư mục zip: D:\Keepit\Keepit - Optimize Test

## 4. Quy tắc làm việc - Phải luôn tuân thủ tuyệt đối

**4.1. Cách thức làm**
- Đầu mỗi phiên, đọc `AGENTS.md`; ưu tiên mục 1–4 và nhật ký mới trong `PROJECT.md`. Chỉ đọc phần liên quan trong `README.md` và `OPT-ARENA.md`.
- Phải tuân thủ tuyệt đối yêu cầu, không được làm khác.
- Đọc lại các quy tắc ở mục 4 này mỗi lần nhận 1 yêu cầu.
- Phải lấy đúng version được chọn để sửa, tuyệt đối không lấy version khác.
- Hỏi lại khi yêu cầu chưa rõ yêu cầu. Nếu yêu cầu chưa tối ưu, cảnh báo và đề xuất phương án tốt hơn.
- Người dùng đang hỏi nghĩa là đang thảo luận, không được thực thi, chỉ trả lời.
- Chỉ đọc, sửa và kiểm tra phần yêu cầu. Thay đổi tối thiểu, tái sử dụng code hiện có, không refactor ngoài phạm vi.
- Giữ nguyên tính năng, UI và hành vi hiện tại. Không tự ý thay đổi UI nếu không cho phép.
- UI mới phải thống nhất với thiết kế hiện có. Label mới phải ngắn gọn, phù hợp UI/UX và được dịch sang mọi ngôn ngữ ứng dụng hỗ trợ.
- Phải sử dụng skill phù hợp đã được quy định trước.
- Chạy kiểm tra liên quan và báo đúng kết quả; tuyệt đối không tuyên bố đã test nếu chưa chạy.
- Nếu thay đổi module, cấu trúc file hay luồng tương tác các module thì phải cập nhật vào mục 4. Cấu trúc và kiến trúc dự án file project.md
- Quy tắc cấu trúc code:
  - Tìm file cần sửa ở bảng "Sửa nhanh" trong `docs/INDEX.md` trước khi tìm khắp repo.
  - Tái cấu trúc cây thư mục: trước mỗi bước, đọc lại toàn bộ bản ghi `OPT-ARENA.md` 2026-10-23 "Tái cấu trúc cây thư mục…"; không làm khác cây đích ở đó.
  - Nhãn mới: thêm vào `js/core/languages.js` (`MESSAGES` + `t()`), đủ en/vi/ko; không tạo bảng nhãn riêng trong file khác. Tiền tố khoá: thanh Keepit `bar_<tên>`, overlay `ov_<tên>` (gọi `T('<tên>')` trong `overlay-ui.js`), trang offline `off_<tên>`.
  - Màu sáng/tối của thanh Keepit, ☰, Reader, overlay: khai báo một chỗ trong `js/shared/theme-tokens.js` (biến `--kp-…`; CSS thanh ở `js/content/keepit-bar-css.js`, Reader ở `js/reader/reader-css.js`); không rải mã màu mới.
  - Không nối khối vá `/* v3.5.xxx */` vào cuối CSS; sửa thẳng quy tắc gốc, ghi phiên bản vào `PROJECT.md`.
  - Không tạo thư mục/file `legacy`; code không còn dùng thì xoá. Markup overlay cũ đã xoá (v3.5.197); `#keepit-exact-overlay` chỉ là gốc trạng thái ẩn, không thêm giao diện vào đó — giao diện overlay ở `js/overlay/ui/`.
  - Chỉ tách file khi file vừa quá lớn vừa có phần thật sự độc lập; không tạo thư mục chỉ có một file.
- Khi tạo demo cùng một tên gốc, luôn tăng hậu tố version lên số kế tiếp (ví dụ `...-demo-v14.html` → `...-demo-v15.html`); không ghi đè hoặc tái sử dụng tên version đã giao. Chỉ giữ bản demo mới nhất, xoá các bản trước.

**4.2. Cách thức trả lời trên khung chat**
- Các phản hồi phải ngắn gọn, đúng vấn đề, không được nói khi không làm.
- Trước khi sửa, nêu version hiện tại lên khung chat, (mục tiêu, kết quả mong đợi và cách làm) mỗi đầu mục in đậm và gạch đầu dòng ngắn gọn tương ứng.
- Trong lúc sửa, làm bước nào ghi ra màn hình bước đó.
- Sau khi sửa, Phải luôn ghi sửa từ version nào -> version nào ở cuối phản hồi; không tự đoán version.

**4.3. Cách hiểu yêu cầu của người dùng**
- Đọc theo ngữ cảnh, không chỉ theo chữ: câu ngắn (ví dụ "để như cũ") phải đặt vào việc đang làm — bản demo/version hiện tại, lần sửa trước, vòng nào đã được duyệt — để biết đúng "cũ", "cái kia", "như những cái khác" là gì.
- Ghi nhớ quy tắc lâu dài: mỗi lần người dùng sửa, từ chối hay chốt điều gì thì coi là quy tắc đứng; mọi yêu cầu mới phải đối chiếu với các quy tắc đó trước khi làm.
- Người dùng bực = đã làm sai hoặc lặp lại lỗi: không giải thích vòng vo, tìm đúng chỗ gây ra, sửa tận gốc và ghi lại để không tái phạm.
- Người dùng khen = giữ nguyên hướng đó; không tự đổi những gì đã được duyệt.
- Người dùng chất vấn ("sao…?", "lỗi:") = báo lỗi: tra code tìm nguyên nhân, xác định lỗi chỉ ở demo hay cả app thật, sửa rồi báo ngắn gọn.
- Câu có thể hiểu hai cách: chọn cách gần ngữ cảnh và các mẫu đã duyệt nhất, nói rõ cách đã chọn để người dùng chỉnh; chỉ hỏi trước khi đoán sai sẽ tốn nhiều công.
- Ghi lại các lần hiểu sai từ ngữ (ví dụ "bằng nhau" = chiều cao, "nghiêng" = vị trí) và không nhầm lại.
- Yêu cầu về **hình thức** mà hiểu được nhiều cách — "giống 2 nút kia" (nút có khung hay chữ?), "làm giống cái kia" (phần tử nào?), "đẹp hơn", "gọn hơn" — phải **hỏi lại một câu kèm 2–3 phương án cụ thể** rồi mới sửa. Không đoán, không thử lần lượt.
- Người dùng đã gửi ảnh chụp thì **ảnh là đặc tả**: chỉ đối chiếu với đúng những phần tử xuất hiện trong ảnh đó. Nếu ảnh không chứa phần tử mình định so sánh thì phải hỏi, không suy ra từ nơi khác.
- Thay đổi nhỏ (một nhãn, một nút, 1–2px) vẫn phải đúng ngay lần đầu như thay đổi lớn; không được coi là chi tiết nhỏ nên làm đại rồi sửa sau.
- Tự kiểm tra trước khi báo: chạy thử, chụp màn hình sáng/tối và các thiết bị; phần chưa kiểm chứng được thì nói rõ là chưa kiểm.


**4.4. Kiểm thử giao diện: bắt buộc bằng ảnh chụp trên extension thật**
- Chỉ coi là xong khi có ảnh chụp từ chính extension đang build. Không dùng HTML demo/mockup thay thế, không đoán CSS rồi báo đạt.
- Mở extension unpacked thật: Chromium + `--load-extension=<repo>`, chạy dưới `xvfb-run`, profile mới tinh mỗi lần; điều khiển bằng Playwright persistent context, lấy ID qua service worker rồi mở `chrome-extension://<id>/pages/dashboard.html`.
- Seed dữ liệu bằng IndexedDB **bên trong iframe của route tương ứng sau khi route đó đã mở**; tuyệt đối không mở DB với version từ phía test trước khi app tự tạo object store (sẽ làm hỏng `onupgradeneeded` của thư viện).
- Assert bằng số đo, không bằng cảm nhận: đọc DOM thật, `getComputedStyle`, `getBoundingClientRect()`, `scrollTop`. Ví dụ để chứng minh "chỉ danh sách cuộn": cuộn danh sách rồi kiểm header giữ nguyên `top` và `#dashboardScroller.scrollTop` = 0.
- Chụp tối thiểu 4 ảnh: desktop 1512 và mobile 390, mỗi cỡ cả light và dark; dark phải bật bằng đúng nút đổi giao diện của app, không gắn class bằng tay. Chi tiết nhỏ (dấu tick, icon, viền, khoảng cách 1–2px) phải có thêm ảnh phóng to (`deviceScaleFactor: 4` + clip quanh phần tử) và ảnh 1× để đối chiếu.
- Thu `console.error` và `pageerror` của mọi page/frame; còn lỗi thì chưa được báo đạt. Ảnh và số đo lưu ngoài repo (`/home/user/shots380`), tên `<tag>-<width>-<mô tả>.png` kèm file `.json` chứa số đo.
- Báo cáo phải tách rõ hai phần: **đã xác minh bằng ảnh/số đo** và **chưa kiểm được** (profile Chrome thật của người dùng, tệp PDF/Office thật, cảm giác dùng, tốc độ).
- Giữ nguyên harness hiện tại, không đổi sang công cụ khác khi chưa có lý do; harness và lệnh chạy ghi ở `/home/user/qa/README.md`.

## 5. Quy trình sau khi sửa

**5.1. Version**
  - Với thay đổi phát hành của bất kỳ tác nhân nào (ví dụ Arena, Codex, Claude,...), luôn tăng version trong manifest.json. Với file được lưu trực tiếp trong repo, zip lại file đúng version đã tăng.

**5.2. Cập nhật PROJECT.md**
  - Thêm mục mới vào đầu **mục nhật ký duy nhất** trong `PROJECT.md`, xếp theo thời gian mới nhất đến cũ nhất; không tạo bản sao của cùng nhật ký ở nhiều mục.
  - **Mục 1 — Trạng thái hiện tại:** viết snapshot ngắn, tối đa 3–5 gạch đầu dòng: version, trạng thái sản phẩm/kiến trúc cần biết, rủi ro quan trọng và tình trạng kiểm thử mới nhất. Không chép lịch sử thay đổi hay đặc tả dài; trỏ tới mục 4/5 khi cần.
  - **Mục 2 — Việc đang mở:** chỉ liệt kê việc chưa hoàn tất; nhóm theo tính năng/loại việc và ưu tiên. Mỗi gạch đầu dòng nêu hành động, môi trường liên quan và trạng thái thực tế (chưa chạy/đã chạy một phần/đã xác nhận). Không giữ việc đã hoàn tất hoặc chép changelog.
  - Khi rút gọn mục 1/2, **không tự bỏ hoặc đánh dấu xong việc chưa xác nhận**. Gộp các kiểm thử cùng nhóm nhưng giữ điều kiện chấp nhận tối thiểu; nếu checklist chi tiết quá dài, đặt ở tài liệu QA liên quan và dẫn link từ mục 2. `PROJECT.md` vẫn là nguồn duy nhất về trạng thái và danh sách việc đang mở.
  - **Mục 5 — Nhật ký:** lưu lịch sử thay đổi theo version. Ghi thay đổi, file và kiểm tra thực tế; không lặp lại toàn bộ chi tiết lịch sử trong mục 1/2. Việc hiện tại và bước tiếp theo có thể được nhắc ngắn ở mục 1/2 khi cần cho bàn giao.
  - Mục 5 chỉ giữ khoảng 30 bản ghi mới nhất. Khi vượt, chuyển các bản cũ nhất **nguyên văn** sang `docs/changelog/<nhánh version>.md` (mới nhất ở trên); không sửa nội dung, không đổi tác giả.
  - `OPT-ARENA.md` chỉ giữ nhật ký ý tưởng/thiết kế đã chốt với Arena; `README.md` mô tả cho người dùng.
  - **Quy tắc định dạng nhật ký (bắt buộc):**
    - Tiêu đề mỗi bản ghi phải là một dòng in đậm đứng riêng ở đầu dòng, đúng mẫu `**YYYY-MM-DD | vX.Y.Z | <Tên AI/người thực sự sửa> sửa:**`; không thêm dấu bullet, không thụt lề và không gộp tiêu đề vào nội dung của bản ghi trước.
    - Để một dòng trống sau tiêu đề; mọi thông tin chi tiết là các bullet cấp cao nhất, bắt đầu bằng `- ` ở đầu dòng (không thụt lề thêm một cấp dưới tiêu đề). Dùng các bullet riêng cho tóm tắt, `File:`, `Kiểm tra:` và `Tiếp theo:`/`Lưu ý:` nếu có.
    - Để một dòng trống giữa các bản ghi. Kết thúc bullet cuối của bản ghi trước rồi mới xuống dòng trống và viết tiêu đề tiếp theo; tuyệt đối không để tiêu đề mới nằm trên cùng dòng hoặc bị Markdown hiểu là phần tiếp nối của bullet trước.
    - **Mẫu chuẩn (không có bullet trước tiêu đề):**

      ```md
      **YYYY-MM-DD | vX.Y.Z | Tên tác nhân sửa:**

      - Tóm tắt ngắn gọn thay đổi.
      - File: danh sách file đã sửa.
      - Kiểm tra: lệnh/kết quả thực sự chạy; nếu chưa chạy, ghi rõ "Chưa chạy".
      ```
  - Ghi đúng tên bất kỳ tác nhân thực hiện từng thay đổi (ví dụ: Arena, Claude, Codex,....; "Huuson" nếu Huuson trực tiếp sửa). Không mặc định ghi Codex/Arena thay cho AI khác. Nếu nhiều tác nhân sửa, tách thành các mục riêng; lịch sử không xác định tác giả thì ghi rõ "người sửa không xác định", không tự gán.
  - Giữ nguyên các bản ghi lịch sử và tác giả đã có; không xóa hoặc gán lại nhật ký cũ trừ khi người dùng yêu cầu.
  - Sau mỗi thay đổi, sửa đè mục 1 và 2 theo các quy tắc snapshot/open-items bên trên; việc đã xác nhận hoàn tất thì gỡ khỏi mục 2. Giữ mục 5 theo thứ tự mới nhất → cũ nhất.

**5.2.1. Tài liệu kỹ thuật nội bộ (`docs/`)**
  - Phạm vi module là các thư mục first-party cấp cao nhất hiện có dưới `js/`: `ask-ai`, `background`, `content`, `core`, `dashboard`, `overlay`, `popup`, `reader`, `shared`, `translate`. Mỗi module có một trang `docs/modules/<slug>.md`; module mới phải thêm trang tương ứng và cập nhật `docs/INDEX.md`. Không tạo tài liệu riêng cho từng file mã nguồn hoặc cho `vendor/`.
  - Ngoại lệ: trang dùng chung nhiều module đặt tại `docs/<tên>.md` (hiện có `docs/ui-layout.md`), không theo mẫu 5 H2 của trang module, vẫn tối đa 700 từ và phải có trong `docs/INDEX.md`.
  - `docs/INDEX.md` là mục lục duy nhất, dùng bảng đúng 3 cột: `Tài liệu | Phạm vi | Đọc khi`; chỉ đọc trang có liên quan tới yêu cầu, không nạp toàn bộ docs mặc định. Thêm đúng một bảng "Sửa nhanh" 2 cột `Muốn sửa | Mở file`; cập nhật bảng này khi thêm, xoá, đổi tên hoặc chuyển file.
  - `docs/changelog/` (nhật ký lưu trữ) và `docs/supabase/` (hợp đồng đồng bộ cloud) không phải trang module, không theo mẫu 5 H2 và giới hạn 700 từ.
  - Mọi trang module phải có đúng một H1 theo mẫu `# <Tên module> — Hướng dẫn kỹ thuật`, tiếp theo đúng năm H2, cùng tên và thứ tự sau; không thêm H2 khác:
    - `## 1. Mục đích và phạm vi`
    - `## 2. File chính và điểm vào`
    - `## 3. Luồng chính`
    - `## 4. Hợp đồng và quy tắc cần giữ`
    - `## 5. Kiểm tra và xác minh`
  - Mỗi trang mục tiêu 300–600 từ, tối đa 700 từ. Không thêm chữ chỉ để đạt mức tối thiểu; trang ngắn hơn được chấp nhận nếu module đơn giản. Nếu vượt 700 từ, rút gọn hoặc tách tài liệu theo luồng và cập nhật mục lục.
  - Mục 1: 1–3 câu nêu trách nhiệm và ranh giới module. Mục 2: bảng 3–10 dòng, cột `File | Điểm vào/symbol | Vai trò`, chỉ liệt kê file chính. Mục 3: 3–8 bước theo thứ tự từ điểm vào đến kết quả. Mục 4: 3–10 bullet về contract, dữ liệu, invariant, fallback hoặc rủi ro thực tế. Mục 5: lệnh static/mock và các bước kiểm thử cần thiết; phân biệt rõ kiểm tra đã chạy với bước đề xuất.
  - Viết tiếng Việt; dẫn source bằng link Markdown tương đối và tên symbol trong backticks. Không dùng số dòng, không chép đoạn code dài, không lặp changelog hoặc trạng thái công việc của `PROJECT.md`. Mọi hành vi cụ thể phải được đối chiếu source; code là nguồn sự thật khi docs mâu thuẫn.
  - Trước khi sửa code, chỉ đọc trang module liên quan. Cập nhật docs cùng thay đổi nếu đổi ranh giới/trách nhiệm module, điểm vào, luồng, contract, storage/message, invariant hoặc cách kiểm tra; không cần sửa docs cho thay đổi nội bộ không tác động các điểm đó. Cập nhật mục lục khi thêm, xóa hoặc đổi tên trang.

**5.3. Commit**
  - Commit trong thư mục nguồn: "v<version>: <mô tả ngắn>".

**5.4. Đóng gói ZIP**
  - Đóng gói zip phát hành vào D:\Keepit với tên: Keepit - Optimize Test-v<version>.zip
  - TÊN FILE BẮT BUỘC đúng từng ký tự: "Keepit - Optimize Test-v<version>.zip", ví dụ "Keepit - Optimize Test-v3.4.513.zip". Giữ dấu cách và dấu gạch ngang như trên, version viết có dấu chấm. Không đổi dấu cách thành gạch dưới, không đổi dấu chấm thành gạch dưới, không thêm hay bớt chữ.
  - manifest.json nằm ở gốc zip, không kèm thư mục .git.
  - Zip PHẢI chứa AGENTS.md và PROJECT.md bản mới nhất.
  - Không bao gồm sync-watch.ps1, sync-state.txt, sync-watch.log.
  - Mỗi lần tạo ZIP thì tạo luôn CRX cùng tên ("Keepit - Optimize Test-v<version>.crx") bằng `python3 scripts/build_release.py` (đóng ZIP từ git HEAD + ký CRX3, cùng bộ file; ZIP vào thư mục `Keepit-Zip`, CRX vào `Keepit-Crx`, ZIP source APK để riêng ở `Keepit-Apk-Zip`). Khoá `.pem` ký CRX để NGOÀI repo (`--key` hoặc biến `KEEPIT_CRX_KEY`), tuyệt đối không commit, không đưa vào ZIP/CRX; luôn ký bằng cùng một khoá để ID tiện ích không đổi.

**5.5. Báo cáo**
  - Báo lại: file đã đổi, lỗi đã sửa, kết quả kiểm tra thực tế.

## 6. Không được làm
- Không sửa hoặc xóa ZIP version cũ. Ngoại lệ: watcher được phép thay thế ZIP của version hiện hành sau mỗi đợt lưu trong repo để Claude nhận được nội dung mới; giữ nguyên version.
- Không sửa thư mục nguồn khi có zip mới đang được đồng bộ (chờ người dùng báo xong).
- Không commit file tạm, file log, hay thư mục .git vào zip.

## 7. Quy tắc riêng cho Arena.ai Agent
Các quy tắc dưới đây **chỉ áp dụng khi tác nhân thực hiện là Arena.ai Agent** và ưu tiên hơn quy tắc chung nếu có mâu thuẫn:
- Sau khi dùng xong tệp đính kèm, xóa toàn bộ tệp bên trong `/home/user/uploads` (kể cả thư mục con); chỉ xóa sau khi hoàn tất mọi thao tác cần chúng.
- Trong `/home/user/Keepit-Zip`, chỉ giữ lại ZIP `Keepit - Optimize Test-v<version>.zip` có version cao nhất. Chỉ xóa các ZIP version cũ sau khi ZIP mới đã được đóng gói và xác minh thành công; nếu build mới lỗi thì giữ nguyên ZIP hiện có.
- Harness kiểm thử hiện tại: `/home/user/qa/README.md`; file mới nhất `pager411.js` (layout/phân trang/checkbox), `boxzoom.js` (phóng 4× ô chọn). Sandbox reset thì phải cài lại `npm i playwright-core@1.55.0`, `npx playwright-core install chromium`, `apt-get install -y xvfb` + các lib của Chromium, và `git config user.name "Arena.ai Agent"` / `user.email "arena-agent@local.invalid"`.
- Sandbox Arena chưa có khoá ký CRX (`/home/user/Keepit-key/*.pem` hoặc `KEEPIT_CRX_KEY`), nên chỉ đóng ZIP ở `/home/user/Keepit-Zip`; khi báo cáo phải nói rõ là không tạo CRX vì thiếu khoá, không được im lặng bỏ qua.
