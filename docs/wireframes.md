# Tài Liệu Thiết Kế Giao Diện & Wireframes (UI/UX Wireframes Specification)
**Dự án: CosRent – Hệ Thống Cho Thuê Trang Phục & Đồ Cosplay**
*Mã tài liệu: DOC-UI-01 | Phiên bản: 1.0.0*

---

## 1. Nguyên Tắc Thiết Kế & Hệ Thống Nhận Diện (Design System)

### 1.1. Thẩm mỹ Lấy Cảm Hứng từ Booking.com
Giao diện CosRent kế thừa cấu trúc thị giác khoa học, rõ ràng và tối ưu tỷ lệ chuyển đổi của Booking.com:
- **Header Thanh Điều Hướng**: Màu xanh lam đậm chủ đạo (`#003580`), chữ trắng tương phản cao, tích hợp logo CosRent, nút đăng ký, đăng nhập và menu chuyển hướng nhanh.
- **Khối Tìm Kiếm Nổi Bật (Search Box)**: Viền và điểm nhấn màu vàng rực rỡ (`#febb02`), đặt nổi ngay dưới Hero banner trên Trang chủ và ghim gọn gàng trên trang Danh sách.
- **Khối Nhập Liệu 3 Thành Phần**:
  1. Ô tìm kiếm trang phục / nhân vật / tác phẩm.
  2. Ô chọn Ngày nhận đồ (Pickup Date).
  3. Ô chọn Ngày trả đồ (Return Date).
- **Trang Danh Sách Kết Quả**:
  - Cột bên trái: Bộ lọc đa tiêu chí (FilterSidebar) dạng Sticky gồm danh mục, khoảng giá, kích cỡ, tình trạng sẵn có.
  - Khu vực bên phải: Danh sách thẻ trang phục (Costume Cards) bố trí dạng lưới (Grid) hoặc danh sách (List), mỗi thẻ gồm ảnh sắc nét, huy hiệu kích cỡ, đơn giá thuê/ngày, tiền cọc minh bạch và nút "Xem chi tiết".
- **Tính Độc Lập Thương Hiệu**: Giữ trọn vẹn nhận diện thương hiệu CosRent (cho thuê cosplay); tuyệt đối không sao chép logo, biểu tượng bản quyền hay nội dung khách sạn của Booking.com.

### 1.2. Quy Chuẩn Địa Phương Hóa & Định Dạng
- **Ngôn ngữ**: 100% Tiếng Việt thân thiện, rõ ràng, dễ hiểu.
- **Tiền tệ**: Định dạng chuẩn Việt Nam Đồng, ví dụ: `150.000 ₫`, `1.200.000 ₫`.
- **Ngày tháng**: Hiển thị dạng `dd/MM/yyyy` (ví dụ: `29/10/2026`).

### 1.3. Ghi Chú Đối Chiếu Ảnh Mẫu Giảng Viên
> [!NOTE] Ghi chú xác thực ảnh mẫu đề bài
> Đề bài có cung cấp liên kết ảnh mẫu tại Canvas trường Phenikaa:
> `https://canvas.phenikaa-uni.edu.vn/courses/30303/files/4824009/preview`
> Do liên kết nằm trong hệ thống đóng của trường đại học, đòi hỏi tài khoản đăng nhập Canvas sinh viên nên môi trường kỹ thuật hiện tại **chưa thể truy cập trực tiếp để đối chiếu pixel-by-pixel**. Do đó, nhóm triển khai hoàn toàn trung thực ghi nhận điều này và tiến hành xây dựng giao diện bám sát 100% theo các quy chuẩn bố cục Booking.com đã được mô tả chi tiết trong đề bài.

---

## 2. Phân Tích: "Bước Nghiệp Vụ" (Business Steps) và "Lượt Tương Tác" (Interactions)

Đề bài yêu cầu: *“Thiết kế luồng đặt thuê ngắn, tối đa 4 bước nghiệp vụ chính. Phân biệt bước và lượt tương tác; đo số tương tác thực tế trong kịch bản đã định nghĩa”*.

### 2.1. Bốn Bước Nghiệp Vụ Chính (Business Steps - $\le$ 4 Bước)
1. **Bước 1: Chọn trang phục** (Khách xem danh sách hoặc tìm kiếm, click chọn trang phục ưng ý để mở chi tiết).
2. **Bước 2: Chọn kích cỡ & khoảng ngày thuê** (Khách chọn size phù hợp, chọn ngày nhận và ngày trả, hệ thống kiểm tra tồn kho tức thì).
3. **Bước 3: Xem bảng tính giá & kiểm tra điều khoản** (Khách xem số ngày thuê, tiền thuê, tiền cọc, bấm nút "Đặt thuê ngay").
4. **Bước 4: Xác nhận thông tin nhận đồ & hoàn tất đơn** (Tại màn hình Xác nhận, khách kiểm tra thông tin liên hệ, ghi chú và bấm "Xác nhận đặt đơn").

### 2.2. Đo Lường Số Lượt Tương Tác Thực Tế (Interaction Count Measurement)
Định nghĩa: Mỗi cú click chuột, gõ phím hoặc chọn lịch được tính là 1 lượt tương tác.
*Kịch bản mẫu: Khách hàng đã đăng nhập, tìm thuê bộ đồ "Raiden Shogun", size L từ ngày 10/11/2026 đến 12/11/2026 tại quầy:*

| STT | Thao Tác Của Người Dùng | Loại Tương Tác | Thuộc Bước |
| :---: | :--- | :--- | :---: |
| 1 | Nhập từ khóa "Raiden" vào ô tìm kiếm | Gõ phím | Bước 1 |
| 2 | Click nút "Tìm kiếm" | Click | Bước 1 |
| 3 | Click thẻ sản phẩm "Raiden Shogun - Genshin Impact" | Click | Bước 1 |
| 4 | Click chọn kích cỡ "Size L" | Click | Bước 2 |
| 5 | Click ô Ngày nhận và chọn ngày "10/11/2026" | Chọn lịch | Bước 2 |
| 6 | Click ô Ngày trả và chọn ngày "12/11/2026" | Chọn lịch | Bước 2 |
| 7 | Xem bảng tính tiền tự động nhảy số, click "Tiến hành đặt thuê" | Click | Bước 3 |
| 8 | Trang chuyển sang `/checkout`, nhập số điện thoại hoặc ghi chú | Gõ phím | Bước 4 |
| 9 | Click checkbox "Tôi đồng ý nhận và trả đồ trực tiếp tại cửa hàng" | Click | Bước 4 |
| 10| Click nút "Xác nhận đặt đơn" | Click | Bước 4 |

**Kết luận đo lường**: Luồng nghiệp vụ chuẩn gồm đúng **4 bước nghiệp vụ lớn**, hoàn tất chỉ qua **10 lượt tương tác người dùng** trực tiếp, không có popup quảng cáo trung gian phiền nhiễu.

---

## 3. Wireframes 12 Màn Hình Chi Tiết

### Màn hình 1: Trang Chủ (Homepage - `/`)
```
+----------------------------------------------------------------------------------------+
| [LOGO CosRent]  Trang phục  |  Hướng dẫn  |  Quy định cọc     [Đăng ký]  [Đăng nhập]   | (#003580)
+----------------------------------------------------------------------------------------+
| HERO BANNER: THUÊ TRANG PHỤC & PHỤ KIỆN COSPLAY ĐỈNG CAO TẠI HÀ NỘI                    |
| Trải nghiệm hóa thân vào nhân vật yêu thích với chi phí tiết kiệm nhất                 |
|                                                                                        |
| +--- KHỐI TÌM KIẾM BOOKING.COM STYLE (Viền vàng #febb02, Nền trắng) -----------------+ |
| | [Icon] Bạn tìm trang phục gì?   | [Icon] Ngày nhận đồ | [Icon] Ngày trả đồ | [TÌM KIẾM] |
| +------------------------------------------------------------------------------------+ |
+----------------------------------------------------------------------------------------+
| DANH MỤC NỔI BẬT                                                                       |
| [ Anime / Manga ]   [ Game Genshin / Honkai ]   [ Cổ phong / Hanfu ]   [ Siêu anh hùng ]|
+----------------------------------------------------------------------------------------+
| TRANG PHỤC MỚI VỀ & ĐƯỢC THUÊ NHIỀU NHẤT                                               |
| +-------------------+  +-------------------+  +-------------------+  +---------------+ |
| | [ Ảnh sản phẩm ]  |  | [ Ảnh sản phẩm ]  |  | [ Ảnh sản phẩm ]  |  | [ Ảnh SP ]    | |
| | Raiden Shogun     |  | Anya Forger       |  | Frieren Pháp Sư   |  | Saber Fate    | |
| | Size: S, M, L     |  | Size: M, L        |  | Size: S, M        |  | Size: M, L, XL| |
| | 200.000 ₫ / ngày  |  | 120.000 ₫ / ngày  |  | 180.000 ₫ / ngày  |  | 250.000 ₫/ngày| |
| | [Xem chi tiết ->] |  | [Xem chi tiết ->] |  | [Xem chi tiết ->] |  | [Chi tiết]   | |
| +-------------------+  +-------------------+  +-------------------+  +---------------+ |
+----------------------------------------------------------------------------------------+
| CAM KẾT DỊCH VỤ                                                                        |
| [Icon] Trang phục giặt là sạch sẽ  | [Icon] Đầy đủ phụ kiện tóc/kiếm | [Icon] Cọc minh bạch|
+----------------------------------------------------------------------------------------+
| FOOTER: CosRent © 2026 - Địa chỉ cửa hàng: 123 Đường Cosplay, Hà Nội - Hotline: 0900...|
+----------------------------------------------------------------------------------------+
```

---

### Màn hình 2: Danh Sách & Tìm Kiếm Trang Phục (Costume Catalog - `/costumes`)
```
+----------------------------------------------------------------------------------------+
| [Header CosRent]                                            [Avatar Nguyễn Văn A v]    |
+----------------------------------------------------------------------------------------+
| Thanh tìm kiếm thu gọn: [Từ khóa...] [Từ ngày: dd/mm/yyyy] [Đến ngày: dd/mm/yyyy] [Tìm]|
+----------------------------------------------------------------------------------------+
| BỘ LỌC TÌM KIẾM (Cột Trái 25%)        | KẾT QUẢ TÌM KIẾM (Cột Phải 75% - 24 trang phục)|
|                                       | Sắp xếp theo: [ Giá tăng dần v ]               |
| [Xóa bộ lọc]                          |                                                |
| DANH MỤC:                             | +--------------------------------------------+ |
| [x] Tất cả (24)                       | | [ẢNH]  Raiden Shogun - Genshin Impact       | |
| [ ] Anime / Manga (12)                | |        Gồm: Váy kimono, giáp vai, tất chân  | |
| [ ] Game Cosplay (8)                  | |        Kích cỡ sẵn có: [ S ] [ M ] [ L ]    | |
| [ ] Cổ phong / Hanfu (4)              | |        Tình trạng: Còn hàng                  | |
|                                       | |        Giá thuê: 200.000 ₫ / ngày            | |
| KÍCH CỠ:                              | |        Tiền cọc: 600.000 ₫ / bộ              | |
| [ ] S   [x] M   [ ] L   [ ] XL        | |        [ Nút: Xem chi tiết & Đặt thuê ]     | |
|                                       | +--------------------------------------------+ |
| KHOẢNG GIÁ THUÊ / NGÀY:               | +--------------------------------------------+ |
| Từ: [100.000 ₫] - Đến: [300.000 ₫]    | | [ẢNH]  Frieren - Pháp sư Tiễn Biệt           | |
| [ Áp dụng khoảng giá ]                | |        Gồm: Áo choàng, đầm, gậy phép        | |
|                                       | |        Giá thuê: 180.000 ₫ / ngày            | |
| TÌNH TRẠNG KHO:                       | |        [ Nút: Xem chi tiết & Đặt thuê ]     | |
| [x] Chỉ hiện đồ còn lịch trống        | +--------------------------------------------+ |
|                                       | Phân trang: [ < Trang trước ] [ 1 ] [ 2 ] [ > ]|
+----------------------------------------------------------------------------------------+
```

---

### Màn hình 3: Chi Tiết Trang Phục (Costume Detail - `/costumes/:id`)
```
+----------------------------------------------------------------------------------------+
| Trang chủ > Game Cosplay > Raiden Shogun                                               |
+----------------------------------------------------------------------------------------+
| CỘT TRÁI (60%): HÌNH ẢNH & CHI TIẾT   | CỘT PHẢI (40%): WIDGET KIỂM TRA LỊCH & ĐẶT THUÊ|
| +-----------------------------------+ | +--------------------------------------------+ |
| | [ ẢNH LỚN CHÍNH DIỆN ]            | | | RAIDEN SHOGUN - GENSHIN IMPACT             | |
| |                                   | | | Đơn giá: 200.000 ₫ / ngày                  | |
| |                                   | | | Tiền cọc: 600.000 ₫ / bộ (hoàn lại 100%)   | |
| +-----------------------------------+ | |--------------------------------------------| |
| [Thumb 1] [Thumb 2] [Thumb 3]         | | CHỌN KÍCH CỠ:                              | |
|                                       | | (o) Size M (Cao 1m58 - 1m65, Nặng 48-54kg) | |
| MÔ TẢ TRANG PHỤC:                     | | ( ) Size L (Cao 1m65 - 1m72, Nặng 55-62kg) | |
| - Chất liệu: Lụa gấm, họa tiết thêu   | |                                            | |
| - Trọn bộ gồm: Áo Kimono cách tân,    | | CHỌN KHOẢNG NGÀY THUÊ:                     | |
|   dây lưng Obi, giáp vai, tất đùi,    | | Ngày nhận: [ 10/11/2026 ]                  | |
|   tóc giả (wig) đã tạo kiểu sẵn.      | | Ngày trả:  [ 12/11/2026 ]                  | |
| - KHÔNG bao gồm giày geta (thuê riêng)| |                                            | |
|                                       | | [!] Tình trạng kho: CÒN HÀNG (Sẵn có: 2 bộ)| |
| CHÍNH SÁCH NHẬN & TRẢ ĐỒ:             | |--------------------------------------------| |
| - Nhận và trả trực tiếp tại quầy      | | BẢNG TÍNH TIỀN TẠM TÍNH:                   | |
| - Kiểm tra phụ kiện trước khi ký nhận | | - Số ngày thuê: 3 ngày (10/11 - 12/11)     | |
| - Hoàn 100% cọc khi trả đồ nguyên vẹn | | - Tiền thuê: 200.000 ₫ x 3 ngày = 600.000 ₫| |
|                                       | | - Tiền cọc giữ đồ: 600.000 ₫               | |
|                                       | | => TỔNG CẦN CHUẨN BỊ TẠI QUẦY: 1.200.000 ₫| |
|                                       | |                                            | |
|                                       | | [ NÚT LỚN MÀU VÀNG: TIẾN HÀNH ĐẶT THUÊ ]   | |
|                                       | +--------------------------------------------+ |
+----------------------------------------------------------------------------------------+
```

---

### Màn hình 4: Đăng Ký Tài Khoản (Register - `/register`)
```
+----------------------------------------------------------------------------------------+
|                          ĐĂNG KÝ TÀI KHOẢN COSRent                                     |
|             Tạo tài khoản để đặt giữ trang phục nhanh chóng và tiện lợi                |
|                                                                                        |
|   Họ và tên:        [ Nguyễn Văn A                                   ]                 |
|   Email:            [ nguyen@example.com                             ]                 |
|   Số điện thoại:    [ 0912345678                                     ]                 |
|   Mật khẩu:         [ ********                                       ]                 |
|   Xác nhận mật khẩu:[ ********                                       ]                 |
|                                                                                        |
|   [ ] Tôi đồng ý với Điều khoản dịch vụ và Chính sách bảo vệ dữ liệu cá nhân           |
|                                                                                        |
|   [ NÚT: ĐĂNG KÝ NGAY ]                                                                |
|                                                                                        |
|   Bạn đã có tài khoản? [ Đăng nhập tại đây ]                                           |
+----------------------------------------------------------------------------------------+
```

---

### Màn hình 5: Đăng Nhập (Login - `/login`)
```
+----------------------------------------------------------------------------------------+
|                          ĐĂNG NHẬP HỆ THỐNG COSRent                                    |
|                                                                                        |
|   [ Alert nếu sai: Email hoặc mật khẩu không chính xác ]                               |
|                                                                                        |
|   Địa chỉ Email:    [ nguyen@example.com                             ]                 |
|   Mật khẩu:         [ ********                                       ]                 |
|                                                                                        |
|   [ NÚT MÀU VÀNG: ĐĂNG NHẬP ]                                                          |
|                                                                                        |
|   Chưa có tài khoản? [ Đăng ký tài khoản mới ]                                         |
+----------------------------------------------------------------------------------------+
```

---

### Màn hình 6: Hồ Sơ Khách Hàng (User Profile - `/profile`)
```
+----------------------------------------------------------------------------------------+
| HỒ SƠ TÀI KHOẢN                                                                        |
|                                                                                        |
| Email đăng nhập:    nguyen@example.com (Không thể thay đổi)                            |
| Vai trò tài khoản:  CUSTOMER (Khách hàng)                                              |
| Ngày tham gia:      29/10/2026                                                         |
|                                                                                        |
| Họ và tên:          [ Nguyễn Văn A                                   ]                 |
| Số điện thoại:      [ 0912345678                                     ]                 |
| Địa chỉ liên hệ:    [ Số 12 Đại Cồ Việt, Hai Bà Trưng, Hà Nội       ]                 |
|                                                                                        |
| [ NÚT: CẬP NHẬT THÔNG TIN ]                                                            |
+----------------------------------------------------------------------------------------+
```

---

### Màn hình 7: Xác Nhận Đặt Thuê (Checkout - `/checkout`)
```
+----------------------------------------------------------------------------------------+
| BƯỚC 4: XÁC NHẬN ĐƠN ĐẶT THUÊ TRANG PHỤC                                               |
+----------------------------------------------------------------------------------------+
| THÔNG TIN SẢN PHẨM ĐẶT THUÊ           | THÔNG TIN NGƯỜI NHẬN & THANH TOÁN              |
| +-----------------------------------+ | +--------------------------------------------+ |
| | Trang phục: Raiden Shogun         | | | Người nhận:    [ Nguyễn Văn A            ] | |
| | Kích cỡ:    Size M                | | | Điện thoại:    [ 0912345678              ] | |
| | Số lượng:   1 bộ                  | | | Ghi chú:       [ Nhận đồ lúc 14h chiều   ] | |
| | Ngày nhận:  10/11/2026            | | |--------------------------------------------| |
| | Ngày trả:   12/11/2026            | | | TỔNG HỢP CHI PHÍ:                          | |
| | Số ngày:    3 ngày                | | | - Tiền thuê (3 ngày):       600.000 ₫      | |
| | Đơn giá:    200.000 ₫ / ngày      | | | - Tiền cọc (hoàn lại):      600.000 ₫      | |
| | Tiền cọc:   600.000 ₫             | | | => Tổng thanh toán tại quầy: 1.200.000 ₫   | |
| +-----------------------------------+ | |--------------------------------------------| |
|                                       | | [x] Tôi xác nhận sẽ đến quầy nhận đồ và trả| |
| LƯU Ý QUAN TRỌNG:                     | |     tiền mặt/chuyển khoản trực tiếp.       | |
| - Đơn thuê sẽ ở trạng thái PENDING    | |                                            | |
|   chờ cửa hàng duyệt trong 30 phút.   | | [ NÚT: XÁC NHẬN TẠO ĐƠN THUÊ ]             | |
| - Vui lòng mang CCCD khi đến nhận đồ. | +--------------------------------------------+ |
+----------------------------------------------------------------------------------------+
```

---

### Màn hình 8: Đơn Thuê Của Tôi (My Rentals - `/my-rentals`)
```
+----------------------------------------------------------------------------------------+
| LỊCH SỬ ĐƠN THUÊ CỦA TÔI                                                               |
+----------------------------------------------------------------------------------------+
| Lọc theo trạng thái: [ Tất cả v ] (Pending, Confirmed, Renting, Returned, Cancelled)   |
|                                                                                        |
| +------------------------------------------------------------------------------------+ |
| | Mã đơn: CR-20261029-8812    | Ngày tạo: 29/10/2026 14:30   | Trạng thái: [PENDING]  |
| | Thời gian thuê: 10/11/2026 -> 12/11/2026 (3 ngày)                                  |
| | Sản phẩm: 1x Raiden Shogun (Size M)                                                |
| | Tổng tiền thuê: 600.000 ₫   | Tiền cọc: 600.000 ₫                                  |
| | [ Nút: Xem chi tiết ]       | [ Nút đỏ: Hủy đơn ]                                  |
| +------------------------------------------------------------------------------------+ |
| +------------------------------------------------------------------------------------+ |
| | Mã đơn: CR-20261015-3211    | Ngày tạo: 15/10/2026 09:15   | Trạng thái: [RETURNED] |
| | Thời gian thuê: 18/10/2026 -> 19/10/2026 (2 ngày)                                  |
| | Sản phẩm: 1x Anya Forger (Size L)                                                  |
| | Đã trả cọc: 400.000 ₫       | [ Nút: Xem chi tiết ]                                |
| +------------------------------------------------------------------------------------+ |
+----------------------------------------------------------------------------------------+
```

---

### Màn hình 9: Chi Tiết Đơn Thuê (Rental Detail - `/my-rentals/:id`)
```
+----------------------------------------------------------------------------------------+
| CHI TIẾT ĐƠN THUÊ: CR-20261029-8812                     Trạng thái: [ CHỜ XÁC NHẬN ]   |
+----------------------------------------------------------------------------------------+
| TIẾN TRÌNH XỬ LÝ (Stepper):                                                            |
| (v) ĐÃ ĐẶT ĐƠN  --->  ( ) XÁC NHẬN  --->  ( ) ĐANG THUÊ  --->  ( ) ĐÃ HOÀN TẤT TRẢ ĐỒ   |
+----------------------------------------------------------------------------------------+
| THÔNG TIN ĐƠN HÀNG:                   | CHI TIẾT SẢN PHẨM & GIÁ SNAPSHOT:              |
| - Người nhận:  Nguyễn Văn A           | +--------------------------------------------+ |
| - Số ĐT:       0912345678             | | Raiden Shogun (Size M) x 1 bộ              | |
| - Ngày nhận:   10/11/2026             | | Đơn giá thuê snapshot: 200.000 ₫ / ngày    | |
| - Ngày trả:    12/11/2026             | | Tiền thuê (3 ngày):    600.000 ₫           | |
| - Ghi chú:     Nhận lúc 14h chiều     | | Tiền cọc quy định:     600.000 ₫           | |
|                                       | +--------------------------------------------+ |
| LỊCH SỬ THAY ĐỔI TRẠNG THÁI:          | TỔNG CỘNG THANH TOÁN:                          |
| 29/10 14:30 - Khách hàng tạo đơn thuê | - Tổng tiền thuê:        600.000 ₫           |
|                                       | - Tổng tiền cọc:         600.000 ₫           |
| [ NÚT: HỦY ĐƠN THUÊ (Nếu PENDING) ]   | => Cần chuẩn bị:         1.200.000 ₫         |
+----------------------------------------------------------------------------------------+
```

---

### Màn hình 10: Dashboard Quản Trị (Admin Dashboard - `/admin/dashboard`)
```
+----------------------------------------------------------------------------------------+
| [ADMIN COSRent]  Dashboard  |  Đơn thuê  |  Trang phục  |  Kho hàng     [Admin Signout]|
+----------------------------------------------------------------------------------------+
| BẢNG ĐIỀU KHIỂN HOẠT ĐỘNG CỬA HÀNG                                                     |
|                                                                                        |
| +-------------------+  +-------------------+  +-------------------+  +---------------+ |
| | DOANH THU THUÊ    |  | ĐƠN CHỜ DUYỆT     |  | ĐỒ ĐANG CHO THUÊ  |  | CẢNH BÁO      | |
| | 48.500.000 ₫      |  | 5 đơn (PENDING)   |  | 14 bộ (RENTING)   |  | 2 đơn QUÁ HẠN | |
| +-------------------+  +-------------------+  +-------------------+  +---------------+ |
|                                                                                        |
| ĐƠN THUÊ CẦN XỬ LÝ GẤP (Top 5 PENDING):                                                |
| [CR-20261029-8812]  Khách: Nguyễn Văn A (0912...)  Ngày: 10/11-12/11  [Duyệt] [Từ chối]|
| [CR-20261029-9941]  Khách: Trần Thị B   (0988...)  Ngày: 01/11-02/11  [Duyệt] [Từ chối]|
|                                                                                        |
| TOP TRANG PHỤC THUÊ NHIỀU NHẤT TRONG THÁNG:                                            |
| 1. Raiden Shogun (28 lượt)  |  2. Anya Forger (22 lượt)  |  3. Frieren (19 lượt)       |
+----------------------------------------------------------------------------------------+
```

---

### Màn hình 11: Quản Lý Trang Phục & Tồn Kho (Admin Catalog & Stock - `/admin/costumes`)
```
+----------------------------------------------------------------------------------------+
| QUẢN LÝ TRANG PHỤC & TỒN KHO BIẾN THỂ                [ + Thêm trang phục mới ]        |
+----------------------------------------------------------------------------------------+
| Tìm kiếm: [ Nhập tên trang phục... ]   Lọc theo danh mục: [ Tất cả danh mục v ]        |
|                                                                                        |
| +------------------------------------------------------------------------------------+ |
| | Tên Trang Phục       | Danh mục   | Giá thuê/ngày | Tiền cọc  | Biến thể & Kho | Thao tác|
| |----------------------|------------|---------------|-----------|----------------|--------|
| | Raiden Shogun        | Game       | 200.000 ₫     | 600.000 ₫ | S: 2/2         | [Sửa]  |
| |                      |            |               |           | M: 3/3, L: 1/1 | [Ẩn]   |
| | Frieren Pháp Sư      | Anime      | 180.000 ₫     | 500.000 ₫ | S: 2/2, M: 2/2 | [Sửa]  |
| | Anya Forger          | Anime      | 120.000 ₫     | 400.000 ₫ | M: 4/4         | [Sửa]  |
| +------------------------------------------------------------------------------------+ |
| [ Modal Quản lý Tồn kho Biến thể ]:                                                    |
| Size: [ M ]  SKU: [ CR-RAIDEN-M ]  Tổng kho: [ 3 ]  Đang sửa chữa: [ 0 ]  [Lưu kho]   |
| (Chặn lưu nếu tổng kho < số lượng đã cam kết cho đơn thuê tương lai)                   |
+----------------------------------------------------------------------------------------+
```

---

### Màn hình 12: Quản Lý & Xử Lý Đơn Thuê (Admin Rentals - `/admin/rentals`)
```
+----------------------------------------------------------------------------------------+
| QUẢN LÝ ĐƠN THUÊ TRANG PHỤC TẠI CỬA HÀNG                                               |
+----------------------------------------------------------------------------------------+
| Lọc: [Trạng thái: Tất cả v] [Từ ngày] [Đến ngày] [Tìm theo mã đơn/SĐT...]              |
|                                                                                        |
| +------------------------------------------------------------------------------------+ |
| | Mã Đơn          | Khách Hàng     | Ngày Thuê     | Tổng Tiền | Trạng Thái | Thao tác |
| |-----------------|----------------|---------------|-----------|------------|----------|
| | CR-20261029-8812| Nguyễn Văn A   | 10/11 - 12/11 | 1.200.000 | PENDING    | [Duyệt]  |
| |                 | 0912345678     |               |           |            | [Từ chối]|
| | CR-20261027-1102| Lê Văn C       | 29/10 - 31/10 | 900.000 ₫ | CONFIRMED  | [GIAO ĐỒ]|
| | CR-20261025-4421| Phạm Minh D    | 26/10 - 28/10 | 1.500.000 | RENTING    | [TRẢ ĐỒ] |
| +------------------------------------------------------------------------------------+ |
|                                                                                        |
| [ MODAL NHẬN TRẢ ĐỒ & HOÀN CỌC ]:                                                      |
| Kiểm tra đồ: [x] Trang phục nguyên vẹn   [x] Đủ phụ kiện kiếm, tóc giả                |
| Tiền cọc ban đầu: 600.000 ₫                                                            |
| Khấu trừ hư hại:  [ 0 ₫         ]                                                      |
| Số tiền cọc hoàn trả thực tế: 600.000 ₫                                                |
| Ghi chú: [ Khách trả đồ đúng hẹn, đồ sạch sẽ                                         ] |
| [ NÚT: XÁC NHẬN NHẬN TRẢ ĐỒ & HOÀN TẤT ]                                               |
+----------------------------------------------------------------------------------------+
```

