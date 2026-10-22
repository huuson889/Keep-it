# Codex Working Rules

## Đường dẫn
- Thư mục nguồn (Git repo, nơi sửa code): D:\Keepit\Keepit - Addon and Extension
- Thư mục zip: D:\Keepit

## Quy tắc làm việc
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
2. Commit trong thư mục nguồn: "v<version>: <mô tả ngắn>".
3. Đóng gói zip vào D:\Keepit với tên: Keepit - Addon and Extension-v<version>.zip
   - manifest.json nằm ở gốc zip, không kèm thư mục .git.
   - Không bao gồm sync-watch.ps1, sync-state.txt, sync-watch.log.
4. Báo lại: file đã đổi, lỗi đã sửa, kết quả kiểm tra thực tế.

## Không được làm
- Không sửa hoặc xóa zip đã có trong D:\Keepit. Chỉ tạo zip mới.
- Không sửa thư mục nguồn khi có zip mới đang được đồng bộ (chờ người dùng báo xong).
- Không commit file tạm, file log, hay thư mục .git vào zip.