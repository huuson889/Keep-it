# Keepit Working Rules for All AI Agents

## 1. Giới thiệu dự án
- Keepit app: extension/addon cho mọi trình duyệt nhân Chromium (Chrome, Edge, Brave, …) / nhân Firefox (Firefox, Zen, Floorp,..) (một codebase, Manifest V3).


## 2. Vai trò tài liệu & nguồn sự thật
- `AGENTS.md`: quy trình và quy tắc dành cho AI/contributor.
- `PROJECT.md`: handoff hiện tại, việc đang mở, ràng buộc, bản đồ file và nhật ký tóm tắt duy nhất.
- `README.md`: hướng dẫn/tính năng/giới hạn hướng tới người dùng; không dùng làm nơi giữ trạng thái nội bộ.
- `OPT-ARENA.md`: thiết kế đã chốt, sơ đồ text, mục tiêu/phạm vi và quy trình tối ưu; không ghi trạng thái từng bước hoặc nhật ký hoàn thành.
- Dùng `manifest.json` để xác nhận version và mã nguồn để xác nhận cách triển khai; chỉ khẳng định hành vi trên trình duyệt khi có kiểm tra thực tế được ghi nhận.

## 3. Đường dẫn
- Thư mục nguồn (Git repo, nơi sửa code): D:\Keepit\Keepit - Addon and Extension
- Thư mục zip: D:\Keepit

## 4. Quy tắc làm việc
- Bắt đầu mỗi phiên: đọc AGENTS.md; trong PROJECT.md ưu tiên các mục 1–4 và các mục nhật ký mới hơn version/commit đã biết; không đọc lại toàn bộ lịch sử nếu không cần. Đọc README.md chỉ ở phần liên quan đến yêu cầu người dùng; Khi công việc liên quan đến OPT-ARENA.md, đọc các mục liên quan trước khi sửa; chỉ đọc toàn bộ khi cần đối chiếu tính nhất quán, không bắt buộc đọc lại toàn file trước từng bước.
- Giữ câu trả lời ngắn gọn để tiết kiệm token.
- Chỉ đọc các file liên quan trước khi sửa.
- Thay đổi tối thiểu, có mục tiêu rõ ràng.
- Giữ nguyên tính năng, UI và hành vi hiện có. Không đổi layout, màu, font, vị trí nút, hay văn bản đang có.
- Claude tuyệt đối không được sửa UI, trừ khi được chỉ định
- Khi thêm UI mới, phải giống giao diện tổng thể của app từ trước (cùng component, class, màu, font, khoảng cách với UI đang có), không thêm lung tung.
- Khi thêm label (nhãn mục) mới, nếu không khai báo rõ, phải đặt tên label phù hợp ngắn gọn chuẩn UI/UX app hiện đại, các label phải được dịch cho mọi quốc gia tương ứng.
- Tái sử dụng code đang chạy, không refactor không liên quan.
- Chạy kiểm tra liên quan và báo kết quả thực tế.
- Không nói "đã test" nếu chưa chạy test.
- Dùng skill Codex rule khi có.
- Với mỗi yêu cầu, nếu chưa hiểu rõ thì hỏi lại trước khi sửa.

## 5. Quy trình sau khi sửa

**5.1. Version**
  - Với thay đổi phát hành của bất kỳ tác nhân nào (ví dụ Arena, Codex, Claude,...), tăng version trong manifest.json. Với file được lưu trực tiếp trong repo, sync-watch.ps1 tự commit và cập nhật lại ZIP của đúng version hiện tại, không tăng version.

**5.2. Cập nhật PROJECT.md**
  - Thêm mục mới vào đầu **mục nhật ký duy nhất** trong `PROJECT.md`, xếp theo thời gian mới nhất đến cũ nhất; không tạo bản sao của cùng nhật ký ở nhiều mục.
  - Giữ mục 1 của `PROJECT.md` là snapshot ngắn; `PROJECT.md` là nguồn duy nhất cho trạng thái, việc đang mở, ràng buộc, bản đồ file, nhật ký và tóm tắt kiểm thử. `OPT-ARENA.md` chỉ giữ thiết kế, sơ đồ, mục tiêu/phạm vi và quy trình; `README.md` mô tả cho người dùng.
  - Mỗi mục nhật ký phải theo cùng mẫu, với tiêu đề in đậm và các thông tin bên dưới thành bullet:
    - **YYYY-MM-DD | vX.Y.Z | <Tên AI/người thực sự sửa> sửa:**
    - Tóm tắt ngắn gọn thay đổi.
    - File: danh sách file đã sửa.
    - Kiểm tra: lệnh/kết quả đã thực sự chạy; nếu chưa chạy, ghi rõ "Chưa chạy". Không tuyên bố kiểm thử chưa thực hiện.
    - Có thể thêm "Tiếp theo" hoặc "Lưu ý" khi cần.
  - Ghi đúng tên bất kỳ tác nhân thực hiện từng thay đổi (ví dụ: Arena, Claude, Codex,....; "Huuson" nếu Huuson trực tiếp sửa). Không mặc định ghi Codex/Arena thay cho AI khác. Nếu nhiều tác nhân sửa, tách thành các mục riêng; lịch sử không xác định tác giả thì ghi rõ "người sửa không xác định", không tự gán.
  - Giữ nguyên các bản ghi lịch sử và tác giả đã có; không xóa hoặc gán lại nhật ký cũ trừ khi người dùng yêu cầu.
  - Sửa đè "Trạng thái" và "Việc đang mở" cho đúng với bản mới. Việc xong thì xóa khỏi "Việc đang mở".

**5.3. Commit**
  - Commit trong thư mục nguồn: "v<version>: <mô tả ngắn>".

**5.4. Đóng gói ZIP**
  - Đóng gói zip phát hành vào D:\Keepit với tên: Keepit - Addon and Extension-v<version>.zip
  - TÊN FILE BẮT BUỘC đúng từng ký tự: "Keepit - Addon and Extension-v<version>.zip", ví dụ "Keepit - Addon and Extension-v3.4.513.zip". Giữ dấu cách và dấu gạch ngang như trên, version viết có dấu chấm. Không đổi dấu cách thành gạch dưới, không đổi dấu chấm thành gạch dưới, không thêm hay bớt chữ.
  - manifest.json nằm ở gốc zip, không kèm thư mục .git.
  - Zip PHẢI chứa AGENTS.md và PROJECT.md bản mới nhất.
  - Không bao gồm sync-watch.ps1, sync-state.txt, sync-watch.log.

**5.5. Báo cáo**
  - Báo lại: file đã đổi, lỗi đã sửa, kết quả kiểm tra thực tế.

## 6. Không được làm
- Không sửa hoặc xóa ZIP version cũ. Ngoại lệ: watcher được phép thay thế ZIP của version hiện hành sau mỗi đợt lưu trong repo để Claude nhận được nội dung mới; giữ nguyên version.
- Không sửa thư mục nguồn khi có zip mới đang được đồng bộ (chờ người dùng báo xong).
- Không commit file tạm, file log, hay thư mục .git vào zip.
