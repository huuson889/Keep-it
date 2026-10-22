# Codex Working Rules

## Đường dẫn
- Thư mục nguồn (Git repo, nơi sửa code): D:\Keepit\Keepit - Addon and Extension
- Thư mục zip: D:\Keepit

## Quy tắc làm việc
- Bắt đầu mỗi phiên: đọc AGENTS.md, rồi PROJECT.md (mục Trạng thái, Việc đang mở, và các mục Nhật ký mới hơn version đã biết). Không đọc lại cả dự án.
- Giữ câu trả lời ngắn gọn để tiết kiệm token.
- Chỉ đọc các file liên quan trước khi sửa.
- Thay đổi tối thiểu, có mục tiêu rõ ràng.
- Giữ nguyên tính năng, UI và hành vi hiện có. Không đổi layout, màu, font, vị trí nút, hay văn bản đang có.
- Tái sử dụng code đang chạy, không refactor không liên quan.
- Chạy kiểm tra liên quan và báo kết quả thực tế.
- Không nói "đã test" nếu chưa chạy test.
- Với tác vụ addon Firefox, dùng skill firefox-extension-maintainer khi có.
- Với mỗi yêu cầu, nếu chưa hiểu rõ thì hỏi lại trước khi sửa.

## Quy trình sau khi sửa
1. Tăng version trong manifest.json (ví dụ 3.4.504 -> 3.4.505).
2. Cập nhật PROJECT.md:
   - Thêm một mục mới vào ĐẦU phần "Nhật ký nâng cấp" (tối đa khoảng 5 dòng): đổi gì, file nào, đã test chưa (ghi rõ "đã chạy ..." hoặc "chưa chạy"), việc tiếp theo.
   - Sửa đè "Trạng thái" và "Việc đang mở" cho đúng với bản mới. Việc xong thì xóa khỏi "Việc đang mở".
   - Nhật ký chỉ giữ khoảng 10 bản gần nhất; mục cũ hơn xóa (Git đã lưu).
3. Commit trong thư mục nguồn: "v<version>: <mô tả ngắn>".
4. Đóng gói zip vào D:\Keepit với tên: Keepit - Addon and Extension-v<version>.zip
   - TÊN FILE BẮT BUỘC đúng từng ký tự: "Keepit - Addon and Extension-v<version>.zip", ví dụ "Keepit - Addon and Extension-v3.4.513.zip". Giữ dấu cách và dấu gạch ngang như trên, version viết có dấu chấm. Không đổi dấu cách thành gạch dưới, không đổi dấu chấm thành gạch dưới, không thêm hay bớt chữ.
   - manifest.json nằm ở gốc zip, không kèm thư mục .git.
   - Zip PHẢI chứa AGENTS.md và PROJECT.md bản mới nhất.
   - Không bao gồm sync-watch.ps1, sync-state.txt, sync-watch.log.
5. Báo lại: file đã đổi, lỗi đã sửa, kết quả kiểm tra thực tế.

## Không được làm
- Không sửa hoặc xóa zip đã có trong D:\Keepit. Chỉ tạo zip mới.
- Không sửa thư mục nguồn khi có zip mới đang được đồng bộ (chờ người dùng báo xong).
- Không commit file tạm, file log, hay thư mục .git vào zip.
