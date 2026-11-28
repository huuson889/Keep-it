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

## 3. Quy tắc làm việc - Phải luôn tuân thủ tuyệt đối

**3.1. Cách thức làm**
- Đầu phiên: đọc `AGENTS.md` (mục 1–3) + nhật ký mới trong `PROJECT.md`; chỉ đọc phần liên quan của `README.md`, `OPT-ARENA.md`, `docs/`.
- Tuân thủ tuyệt đối yêu cầu; đọc lại mục 3 mỗi lần nhận yêu cầu; sửa đúng version được chọn.
- Người dùng đang hỏi = đang thảo luận: chỉ trả lời, không thực thi.
- Chỉ đọc/sửa/kiểm phần được yêu cầu; thay đổi tối thiểu, tái dùng code hiện có, không refactor ngoài phạm vi; giữ nguyên tính năng/UI/hành vi nếu chưa được cho phép.
- Yêu cầu chưa rõ → hỏi lại; chưa tối ưu → cảnh báo và đề xuất phương án tốt hơn.
- Chạy kiểm tra liên quan và báo đúng kết quả; không tuyên bố đã test khi chưa chạy. Dùng skill đã quy định.
- Đổi module/cấu trúc file/luồng tương tác giữa module → cập nhật mục 4 `PROJECT.md`.
- UI/label: theo thiết kế hiện có; nhãn mới ngắn gọn, phù hợp UI/UX, dịch đủ mọi ngôn ngữ app hỗ trợ.
- Quy tắc code (tìm file, cây thư mục, nhãn i18n, màu theme, không khối vá, không `legacy`, cách tách file): `docs/code-rules.md`.
- Làm sai thì quay về bản gốc trước lần sửa sai rồi sửa lại từ đó — không vá chồng lên bản sai, không chỉ xoá dòng sai.
- OCR responsive đã duyệt ở demo v14: nút OCR phải mở đồng thời cài đặt và bảng văn bản; đóng cài đặt giữ bảng. Không tự thay thế một mặt bằng mặt kia. Dùng module sheet/list chung, không tạo engine/storage/công cụ giả; bản nháp theo trang không tự ghi trước Apply. Giữ hai nút mở lại kết quả, PP/Fusor không bật. Kiểm từng đường thao tác thật, không dùng helper mở một mặt thay kiểm nút toolbar/Thêm.
- Sau tích hợp responsive, phải so hình học/material/SVG trực tiếp với demo, không chỉ test class/open/enabled: slot số không giữ wrapper .pgWrap cũ, tổng `/ N`; đúng sáu icon v14, OCR không dot riêng; sheet trang có tiêu đề/tổng thật. Theo yêu cầu mới, Nhận dạng vùng dùng neutral glass như Hủy, không fill đen/tím riêng theo placeholder; không đổi engine/Apply/disabled.
- Demo: cùng tên gốc thì tăng hậu tố version (`-demo-v14.html` → `-demo-v15.html`), không ghi đè hay tái dùng tên đã giao; chỉ giữ bản mới nhất, xoá bản trước.

**3.2. Cách thức trả lời trên khung chat**
- Các phản hồi phải ngắn gọn, đúng vấn đề, không được nói khi không làm.
- Trước khi sửa, nêu version hiện tại lên khung chat, (mục tiêu, kết quả mong đợi và cách làm) mỗi đầu mục in đậm và gạch đầu dòng ngắn gọn tương ứng.
- Trong lúc sửa, làm bước nào ghi ra màn hình bước đó.
- Sau khi sửa, Phải luôn ghi sửa từ version nào -> version nào ở cuối phản hồi; không tự đoán version.

**3.3. Cách hiểu yêu cầu của người dùng**
- Hiểu theo ngữ cảnh, không theo chữ: câu ngắn ("để như cũ", "cái kia") gắn với việc đang làm (demo/version hiện tại, lần sửa trước, vòng đã duyệt); mọi điều người dùng đã sửa, từ chối hay chốt là **quy tắc đứng**, phải đối chiếu trước khi làm.
- Đọc tín hiệu: bực = đã sai, tìm đúng gốc rồi sửa, không giải thích vòng vo; khen = giữ nguyên hướng đó; chất vấn ("sao…?", "lỗi:") = báo lỗi, tra code xác định lỗi ở demo hay app rồi sửa; câu hiểu hai cách thì chọn cách gần ngữ cảnh nhất và nói rõ đã chọn cách nào, chỉ hỏi khi đoán sai sẽ tốn nhiều công.

**3.4. Kiểm thử giao diện: bắt buộc bằng ảnh chụp trên extension thật**
- Chỉ báo đạt khi có ảnh + số đo từ chính extension đang build (unpacked, không demo/mockup); tối thiểu 1512 và 390, mỗi cỡ sáng + tối (dark bật bằng nút của app), thêm ảnh phóng 4× cho chi tiết 1–2px; `console.error`/`pageerror` phải rỗng. Chi tiết harness (Playwright/xvfb, seed IndexedDB trong route, `getComputedStyle`/`getBoundingClientRect`, nơi lưu ảnh): `/home/user/qa/README.md`.
- Báo cáo tách 2 phần: **đã xác minh bằng ảnh/số đo** và **chưa kiểm được** (profile Chrome thật, tệp PDF/Office thật, cảm giác dùng, tốc độ).

## 4. Quy trình sau khi sửa

**4.1. Version**
  - Với thay đổi phát hành của bất kỳ tác nhân nào (ví dụ Arena, Codex, Claude,...), luôn tăng version trong manifest.json. Với file được lưu trực tiếp trong repo, zip lại file đúng version đã tăng.

**4.2. Cập nhật PROJECT.md**
  - Nhật ký duy nhất là **mục 5**, mới nhất ở trên; `OPT-ARENA.md` chỉ giữ ý tưởng/thiết kế, `README.md` cho người dùng.
  - **Mục 1:** snapshot 3–5 gạch (version, trạng thái sản phẩm/kiến trúc, rủi ro, kiểm thử mới nhất); không chép lịch sử.
  - **Mục 2:** chỉ việc chưa xong, nhóm theo tính năng/ưu tiên; mỗi gạch nêu hành động + môi trường + trạng thái thực tế; tối đa **20 dòng**, ≤ **4 mục con**, mỗi mục ≤ **6 dòng**; khi rút gọn không tự bỏ hoặc đánh dấu xong việc chưa xác nhận, giữ điều kiện chấp nhận tối thiểu.
  - Việc đã xong → chuyển ngay sang mục 5, không giữ bản trùng ở mục 2; ghi chú dài/checklist QA/ý tưởng → `docs/pending-notes.md`, mục 2 để một dòng trỏ tới.
  - **Mục 5:** ghi thay đổi, file, kiểm tra thực tế theo version; giữ ~30 bản ghi mới nhất, vượt thì chuyển nguyên văn sang `docs/changelog/<nhánh version>.md`.
  - Mẫu bắt buộc: tiêu đề in đậm đứng riêng dòng `**YYYY-MM-DD | vX.Y.Z | Tên tác nhân sửa:**`, một dòng trống sau tiêu đề và giữa các bản ghi, rồi các bullet cấp cao nhất `- Tóm tắt …`, `- File: …`, `- Kiểm tra: …` (chưa chạy thì ghi rõ "Chưa chạy").
  - Ghi đúng tên tác nhân thực sự sửa (Arena, Claude, Codex, …; "Huuson" nếu người dùng sửa); nhiều tác nhân tách mục riêng; không rõ thì ghi "người sửa không xác định". Giữ nguyên bản ghi và tác giả cũ.
  - Sau mỗi thay đổi: sửa đè mục 1 và 2, gỡ việc đã xong khỏi mục 2.

**4.2.1. Tài liệu kỹ thuật nội bộ (`docs/`)**
  - Quy ước viết trang module, mẫu 5 H2, giới hạn từ và cách cập nhật mục lục: xem `docs/INDEX.md` mục «Quy ước viết trang module».

**4.3. Commit**
  - Commit trong thư mục nguồn: "v<version>: <mô tả ngắn>".

**4.4. Đóng gói ZIP**
  - Tên bắt buộc đúng từng ký tự: `Keepit - Optimize Test-v<version>.zip` — giữ dấu cách và gạch ngang, version viết có dấu chấm; đặt vào thư mục zip (`D:\Keepit\Keepit - Optimize Test`; Arena: `Workspace/<thư-mục-nguồn>-Zip` trên GitHub `main`, ví dụ `Keepit-OCR` → `Keepit-OCR-Zip`; không chỉ lưu cache).
  - Nội dung: `manifest.json` ở gốc zip, không kèm thư mục `.git`; phải có `AGENTS.md` và `PROJECT.md` bản mới nhất; không gộp `sync-watch.ps1`, `sync-state.txt`, `sync-watch.log`.

**4.5. Báo cáo**
  - Báo lại: file đã đổi, lỗi đã sửa, kết quả kiểm tra thực tế.

## 5. Không được làm
- Không commit khoá `.pem` ký CRX và không đưa khoá vào ZIP/CRX; nếu tạo CRX thì dùng `python3 scripts/build_release.py` và luôn ký bằng cùng một khoá để ID tiện ích không đổi.
- Không sửa hoặc xóa ZIP version cũ. Ngoại lệ: watcher được phép thay thế ZIP của version hiện hành sau mỗi đợt lưu trong repo để Claude nhận được nội dung mới; giữ nguyên version.
- Không sửa thư mục nguồn khi có zip mới đang được đồng bộ (chờ người dùng báo xong).
- Không commit file tạm, file log, hay thư mục .git vào zip.

## 6. Quy tắc riêng cho Arena.ai Agent làm việc workspace github
Các quy tắc dưới đây **chỉ áp dụng khi tác nhân thực hiện là Arena.ai Agent** và ưu tiên hơn quy tắc chung nếu có mâu thuẫn:
- Code Keepit app lưu ở: `Workspace/Keep-it`
- Code Keepit app thử nghiệm lưu ở: `Workspace/Keepit-Check`
- File uploads lưu ở `Workspace/Upload`
- File zip đóng gói Keepit test app lưu ở: `Workspace/Keepit-Check-Zip`
- File zip demo lưu ở: `Workspace/Keepit-Demo-Zip`

- Bản OCR riêng: nguồn `Workspace/Keepit-OCR`, ZIP `Workspace/Keepit-OCR-Zip`; mọi ZIP giao phải commit/push GitHub `main`, kiểm bản remote trước khi bỏ bản local. Quy tắc người dùng này ưu tiên hơn đường dẫn ZIP/nguồn chung ở trên.
