# Nguyên tắc giao diện — dọc/ngang, chạm/chuột

> Áp dụng cho mọi phần có giao diện: thanh Keepit, menu/sheet, popup dịch/từ điển, Overlay, Reader, Dashboard. Chỉ đọc khi sửa giao diện. Code hiện tại được đưa về nguyên tắc này dần theo từng bản; trạng thái xem `PROJECT.md` mục 2.

## 1. Chỉ có 2 giao diện, chọn theo dáng màn hình
- **Dọc** (cao > rộng) → giao diện **Điện thoại**: điện thoại dọc, tablet dọc, cửa sổ máy tính kéo hẹp thành dọc.
- **Ngang** (rộng ≥ cao) → giao diện **Máy tính**: laptop, desktop, tablet ngang.
- Không chọn theo loại máy; không thêm mốc bề rộng (breakpoint) riêng.

## 2. To/nhỏ không đổi giao diện
- Thiếu chỗ thì nút tự dồn vào ☰ Thêm theo thứ tự ưu tiên; đủ chỗ thì tự hiện lại. Nút không bao giờ đè nhau.
- Cụm nút chính (phát, trước, sau) luôn ở giữa.
- Cột phụ (danh sách, ghi chú) tự thu gọn khi thiếu chỗ.
- Giao diện Điện thoại trên màn dọc rộng: giới hạn bề ngang chữ (~680px) cho dễ đọc.

## 3. Từng phần theo dọc / ngang

| | **Dọc** (Điện thoại) | **Ngang** (Máy tính) |
|---|---|---|
| Thanh Keepit | Thanh full dưới đáy | Đảo nổi giữa đáy |
| Menu, cài đặt, ☰ | Trượt từ đáy (bottom sheet) | Menu nổi cạnh nút |
| Popup dịch và từ điển đầy đủ | Trượt từ đáy, cao vừa nội dung (tối đa ~85%), cuộn bên trong | Nổi cạnh chữ được chọn, rộng tối đa 380px, luôn trong màn hình, cuộn bên trong |
| Overlay | 1 cột; tab Xem · Nói · Chép | Nhiều cột — Xem: video \| danh sách; Học: danh sách \| thẻ \| ghi chú |
| Reader | Thanh full | Đảo nổi |
| Dashboard | Tab dưới đáy | Thanh bên |

- Popup dịch và từ điển đầy đủ dùng chung một kiểu; từ điển chỉ nhiều nội dung hơn, không có khung lớn hay full màn riêng.
- Quy tắc áp dụng trên mọi trang web, không chỉ trong Overlay/thanh Keepit.

## 4. Chạm / chuột chỉ đổi cách thao tác, không đổi giao diện

| Chạm | Chuột |
|---|---|
| Nút 44px | Nút 36px |
| Chạm thay cho rê chuột | Rê chuột hiện chú thích, xem trước |
| Nhấn giữ = chuột phải | Chuột phải |
| Vuốt: đóng sheet, đổi câu, vuốt trái dịch đoạn, chạm 2 ngón dịch trang (v3.5.184: không còn vuốt trang để lùi/tới — chỉ vuốt trên thanh) | Phím tắt |
| Thanh Keepit ẩn khi cuộn | Thanh Keepit ẩn thành vạch, rê chuột để hiện |

## 5. Ngoại lệ duy nhất: điện thoại ngang (màn ngang, cao < 500px)
- Overlay chỉ có **Rạp** (video full, phụ đề, thanh tự ẩn) và gợi ý "Xoay dọc để học".
- Thanh Keepit thu gọn.
- Popup và menu vẫn theo quy tắc ngang (nổi), cao tối đa ~90% màn, cuộn bên trong.
