# Quy tắc code

> Rút từ `AGENTS.md` mục 3.1. Đọc mục này trước khi thêm/sửa file, nhãn, màu hoặc tách file.

- **Tìm file:** tra bảng «Sửa nhanh» trong `docs/INDEX.md` trước khi tìm khắp repo.
- **Cây thư mục:** theo bản ghi `OPT-ARENA.md` 2026-10-23 “Tái cấu trúc cây thư mục…”, đọc lại toàn bộ bản ghi trước mỗi bước.
- **Nhãn mới:** chỉ thêm trong `js/core/languages.js` (`MESSAGES` + `t()`), đủ en/vi/ko; không tạo bảng nhãn riêng ở file khác. Tiền tố khoá: thanh Keepit `bar_<tên>`, overlay `ov_<tên>`, trang offline `off_<tên>`.
- **Màu sáng/tối** của thanh Keepit, ☰, Reader, overlay: khai báo một chỗ trong `js/shared/theme-tokens.js` (biến `--kp-…`); CSS thanh ở `js/content/keepit-bar-css.js`, Reader ở `js/reader/reader-css.js`; không rải mã màu mới.
- **Không nối khối vá** `/* v3.5.xxx */` vào cuối CSS; sửa thẳng quy tắc gốc và ghi version vào `PROJECT.md`.
- **Không tạo thư mục/file `legacy`**; code không còn dùng thì xoá (markup overlay cũ đã xoá ở v3.5.197; `#keepit-exact-overlay` chỉ là gốc trạng thái ẩn, giao diện overlay ở `js/overlay/ui/`).
- **Tách file:** chỉ khi file vừa quá lớn vừa có phần thật sự độc lập; không tạo thư mục chỉ có một file.
