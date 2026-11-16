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

## Theme

- Một cài đặt chung `lhnSettings.sidebarTheme` (Sáng / Tối / Theo hệ thống = theo máy, không theo theme của trang web) cho mọi phần: thanh Keepit, sidebar, icon chọn chữ, popup dịch / từ điển, Loại từ, Home, Overlay, Reader, popup, Bảng quản lý. Nút đổi theme ở bất kỳ đâu ghi vào cài đặt này (v3.5.300).
- Riêng hàng công cụ của AI panel theo máy, cho khớp trang AI bên dưới (không đổi được theme trang đó).

## Cửa sổ Cài đặt (Bảng quản lý)

- Máy tính / tablet ngang: cửa sổ nổi `min(1024px, 100vw - 48px)` × `min(720px, 100dvh - 48px)`, cột trái (thẻ hồ sơ, Ngôn ngữ, 4 nhóm mục) + nội dung.
- Dọc hoặc điện thoại ngang (cao < 500px): sheet từ đáy 96dvh, bo 22px, kéo xuống để đóng. Dọc và rộng < 700px: danh sách → trang (nút ‹).
- Mỗi trang giữ vị trí cuộn riêng; nút Đặt lại ở cuối mỗi trang Tiện ích / Chung, tím khi khác mặc định; Hoàn tác 5 giây.
- Thông báo đăng nhập / đăng xuất ở phía trên; Hoàn tác ở dưới. Popup Đăng nhập: thẻ giữa (máy tính), sheet như Cài đặt (điện thoại).
- Phím tắt: cảm ứng mở tab Cử chỉ, chuột mở tab Phím tắt.
- Tiện ích: … Dịch, Từ điển (v3.5.299: từ điển đầy đủ, các mục + xem trước, bộ nhớ đệm từ điển; mờ khi Bật dịch tắt), Loại từ …


## Loại từ trên trang (v3.5.290)

- Mỗi từ tiếng Anh: gạch chân màu (2px) rồi nhãn viết tắt 12px bên dưới (N, V, Aux V, Adj…); danh từ đứng liền nhau dùng chung một gạch và một nhãn N. Giống `Keepit-demo/pos/keepit-pos-demo-v4.html`, mọi thiết bị như nhau.
- Bảng chú thích: kính mờ nhỏ góc phải trên, mỗi loại một dòng, kéo được, có ×; rê chuột / chạm dòng → khung định nghĩa bên cạnh; ☰ Chú thích hiện / ẩn; tắt tự hiện trong Cài đặt → Loại từ.
- Thẻ thông báo (hỏi tải mô hình, tiến độ, Đã tắt · Hoàn tác) nổi ở phía trên giữa màn hình, kính mờ như sheet.
- ☰ Công cụ: Loại từ, Loại từ đoạn, Chú thích ngay sau Dịch đoạn; chỉ trên web (không YouTube, không Overlay).
- Cài đặt → Loại từ: công tắc tổng, Hiện bảng chú thích, Mô hình (Tải / Xóa, thanh tiến độ), Xem trước bằng mô hình thật, Đặt lại.
