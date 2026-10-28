# Kịch Bản Trình Chiếu Demo Hệ Thống (Demo Script < 8 Phút)
**Dự án: CosRent – Hệ Thống Cho Thuê Trang Phục & Đồ Cosplay**
*Thời lượng tối đa: 07 phút 30 giây (Chuẩn < 8 phút theo yêu cầu đề bài)*
*Mã tài liệu: DOC-DEMO-01 | Phiên bản: 1.0.0*

---

## 1. Bảng Phân Bổ Thời Gian Demo

| Mốc Thời Gian | Phân Đoạn Trình Bày | Vai Trò Thực Hiện | Nội Dung & Tính Năng Trọng Tâm |
| :---: | :--- | :---: | :--- |
| **00:00 - 00:45** | Giới thiệu dự án & Công nghệ | Người thuyết trình | Giới thiệu CosRent, NestJS + React-Bootstrap + PostgreSQL TypeORM. |
| **00:45 - 02:30** | Khách tìm kiếm & Xem chi tiết | Khách truy cập | Tìm trang phục "Raiden Shogun", lọc theo size và giá, xem chi tiết ảnh. |
| **02:30 - 04:15** | Đặt thuê & Khóa tồn kho | Khách hàng | Chọn ngày thuê, xem bảng tính giá, tạo đơn thành công, kiểm tra đơn của tôi. |
| **04:15 - 06:15** | Quản trị viên duyệt, giao & trả đồ | Quản trị viên | Đăng nhập Admin, xem Dashboard, duyệt đơn, bàn giao tại quầy, nhận trả đồ & hoàn cọc. |
| **06:15 - 07:15** | Chứng minh tính năng nâng cao | Kỹ sư Full-stack | Chứng minh chống đặt vượt kho (Concurrency), chống IDOR, Swagger API. |
| **07:15 - 07:30** | Kết luận & Q&A | Nhóm sinh viên | Tóm tắt kết quả kiểm thử và sẵn sàng trả lời câu hỏi của Giảng viên. |

---

## 2. Kịch Bản Thao Tác Chi Tiết Từng Bước (Step-by-Step Actions)

### Phân đoạn 1: Mở đầu & Trang Chủ (00:00 - 00:45)
- **Lời thoại**: "Kính chào Thầy/Cô và các bạn, hôm nay nhóm chúng em xin demo dự án CosRent - Nền tảng cho thuê trang phục cosplay chuyên nghiệp. Ứng dụng được xây dựng theo kiến trúc phân lớp: Frontend React-Bootstrap kế thừa ngôn ngữ thị giác Booking.com, Backend NestJS kết hợp PostgreSQL và TypeORM Migration."
- **Thao tác**:
  1. Mở trình duyệt tại `http://localhost:5173`.
  2. Chỉ vào Header màu xanh đậm (`#003580`), thanh tìm kiếm nổi bật viền vàng (`#febb02`).
  3. Cuộn lướt qua Danh mục nổi bật và Thẻ sản phẩm.

### Phân đoạn 2: Tìm kiếm & Kiểm tra Tồn kho Lịch (00:45 - 02:30)
- **Lời thoại**: "Người dùng chưa đăng nhập vẫn có thể dễ dàng tìm kiếm và xem chi tiết sản phẩm. Chúng ta tìm trang phục 'Raiden Shogun' với khoảng ngày từ 10/11/2026 đến 12/11/2026."
- **Thao tác**:
  1. Gõ từ khóa `Raiden` vào thanh tìm kiếm, chọn ngày 10/11/2026 - 12/11/2026, bấm **Tìm kiếm**.
  2. Tại trang kết quả `/costumes`, dùng bộ lọc bên trái: Chọn danh mục `Game Cosplay`, khoảng giá `100.000 đ - 300.000 đ`.
  3. Click vào thẻ sản phẩm **Raiden Shogun**.
  4. Tại trang chi tiết: Lướt xem bộ ảnh carousel, chất liệu vải, phụ kiện gậy/kiếm/tóc giả.
  5. Chọn kích cỡ **Size M**: Hệ thống tự động gọi API `/availability` và thông báo *"Còn hàng (Sẵn có: 2 bộ)"*.
  6. Widget tính giá hiển thị minh bạch: 3 ngày x 200.000 đ = 600.000 đ tiền thuê, tiền cọc 600.000 đ.

### Phân đoạn 3: Đăng nhập & Tạo Đơn Thuê (02:30 - 04:15)
- **Lời thoại**: "Bây giờ khách hàng bấm Tiến hành đặt thuê. Hệ thống yêu cầu đăng nhập."
- **Thao tác**:
  1. Bấm **Đặt thuê ngay** $\rightarrow$ Hệ thống chuyển sang màn hình Đăng nhập (hoặc mở Modal).
  2. Đăng nhập tài khoản demo: `customer@cosrent.com` / `Customer123@`.
  3. Chuyển tiếp ngay tới màn hình Xác nhận đơn `/checkout`.
  4. Xác nhận thông tin người nhận: "Nguyễn Văn A - 0912345678 - Nhận đồ lúc 14h".
  5. Tích chọn cam kết nhận và trả đồ trực tiếp tại cửa hàng.
  6. Bấm **Xác nhận đặt đơn** $\rightarrow$ Nhận thông báo thành công kèm mã đơn `CR-20261029-XXXX`.
  7. Vào trang `/my-rentals`: Đơn hàng đang ở trạng thái `PENDING` (Chờ duyệt). Khách hàng có thể xem chi tiết hoặc hủy đơn nếu đổi ý.

### Phân đoạn 4: Quản Trị Viên Xử Lý Đơn Tại Cửa Hàng (04:15 - 06:15)
- **Lời thoại**: "Tại quầy cửa hàng, Quản trị viên sử dụng giao diện Admin để xử lý đơn hàng."
- **Thao tác**:
  1. Mở cửa sổ ẩn danh hoặc chuyển tab sang tài khoản Admin: `admin@cosrent.com` / `Admin123@`.
  2. Vào Dashboard `/admin/dashboard`: Chỉ ra các thẻ KPI (Doanh thu, Đơn chờ duyệt, Đồ đang thuê).
  3. Vào menu **Quản lý đơn thuê** `/admin/rentals`:
     - Thấy đơn `CR-20261029-XXXX` vừa tạo.
     - Bấm nút **Xác nhận (Confirm)** $\rightarrow$ Đơn chuyển sang `CONFIRMED`.
  4. Mô phỏng khách hàng đến nhận đồ tại quầy:
     - Admin thu tiền thuê và tiền cọc trực tiếp.
     - Bấm nút **Giao đồ (Deliver)** $\rightarrow$ Đơn chuyển sang `RENTING`.
  5. Mô phỏng khách hàng đến trả đồ:
     - Bấm nút **Nhận trả đồ (Return)**.
     - Mở Modal kiểm tra đồ: Tích chọn "Đồ nguyên vẹn, đầy đủ phụ kiện".
     - Ghi nhận hoàn trả 600.000 đ tiền cọc cho khách.
     - Bấm **Hoàn tất** $\rightarrow$ Đơn chuyển sang `RETURNED`. Lịch giữ chỗ được giải phóng ngay lập tức.

### Phân đoạn 5: Minh Chứng An Toàn & Bảo Mật Nâng Cao (06:15 - 07:15)
- **Lời thoại**: "Cuối cùng, em xin chứng minh các tính năng an toàn cốt lõi theo đúng yêu cầu đề bài."
- **Thao tác**:
  1. Mở Swagger UI tại `http://localhost:3000/api/docs`.
  2. Trình bày DTO Validation và cơ chế Bearer Token.
  3. Minh chứng chống IDOR: Thử dùng token Khách A để xem đơn Khách B $\rightarrow$ Nhận mã `403 Forbidden`.
  4. Trình chiếu kết quả test đồng thời (Concurrency Test): Hai luồng cùng đặt sản phẩm cuối cùng $\rightarrow$ Một bên nhận 201 Created, bên kia nhận 409 Conflict.

### Phân đoạn 6: Kết thúc (07:15 - 07:30)
- **Lời thoại**: "Dự án CosRent đã hoàn thành đầy đủ 20 User Stories, vượt qua toàn bộ các ca kiểm thử tự động và sẵn sàng bàn giao. Nhóm em xin chân thành cảm ơn Thầy/Cô!"

