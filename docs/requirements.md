# Phân Tích Yêu Cầu Hệ Thống (Software Requirements Specification - SRS)
**Dự án: CosRent – Hệ Thống Website Cho Thuê Trang Phục & Đồ Cosplay**
*Mã tài liệu: DOC-REQ-01 | Phiên bản: 1.0.0*

---

## 1. Mục Tiêu và Bối Cảnh Dự Án

CosRent là nền tảng thương mại dịch vụ trực tuyến phục vụ một cửa hàng cho thuê trang phục cosplay, anime, manga, game và cổ trang cao cấp. Hệ thống giúp số hóa toàn bộ quy trình: từ việc tìm kiếm, kiểm tra lịch tồn kho khả dụng theo thời gian thực, lập báo giá thuê và tiền cọc minh bạch, đặt giữ chỗ trước, đến việc quản lý giao nhận và hoàn tất đơn tại quầy.

### 1.1. Phạm vi nghiệp vụ áp dụng
- **Phương thức giao nhận**: Nhận trang phục và trả trang phục trực tiếp tại quầy cửa hàng (In-store pickup & return). Hệ thống **không** triển khai giao hàng tận nhà (shipping) nhằm đảm bảo khách hàng kiểm tra trực tiếp tình trạng trang phục, thử kích cỡ và ký biên bản bàn giao.
- **Phương thức thanh toán**: Thanh toán tiền thuê và đặt cọc tiền mặt hoặc chuyển khoản trực tiếp tại quầy khi nhận đồ. Quản trị viên ghi nhận thủ công số tiền đã thu và số tiền cọc đã hoàn trả vào hệ thống.
- **Đơn cửa hàng**: Mô hình phục vụ một cửa hàng trung tâm, không chia nhiều chi nhánh phức tạp (Single-store model).
- **Kênh tương tác**: Cung cấp thông tin hướng dẫn, số điện thoại hotline và địa chỉ cửa hàng rõ ràng; không tích hợp module chat trực tuyến để tập trung tối đa vào độ ổn định nghiệp vụ kho vận và bảo mật giao dịch.

---

## 2. Các Vai Trò Người Dùng (User Roles & Personas)

1. **Khách truy cập (Unauthenticated Visitor / Guest)**:
   - Được xem trang chủ, danh mục sản phẩm, bộ sưu tập trang phục.
   - Tìm kiếm, lọc theo giá, danh mục, kích cỡ.
   - Xem chi tiết trang phục, ảnh chất lượng cao, mô tả phụ kiện, chính sách cọc.
   - Thử nghiệm chức năng kiểm tra lịch còn hàng và xem bảng tính giá tạm tính.
   - Đăng ký tài khoản mới hoặc đăng nhập.

2. **Khách hàng (Registered Customer - Role: CUSTOMER)**:
   - Toàn quyền của Khách truy cập.
   - Quản lý thông tin hồ sơ cá nhân (Họ tên, số điện thoại, địa chỉ nhận hóa đơn/liên hệ).
   - Chọn kích cỡ, số lượng, khoảng ngày thuê để tạo đơn đặt thuê trang phục (`RentalOrder`).
   - Xem danh sách và chi tiết lịch sử các đơn thuê của chính mình.
   - Hủy đơn thuê đang ở trạng thái Chờ xác nhận (`PENDING`) khi không còn nhu cầu.
   - Xem lịch sử tiến trình xử lý đơn hàng theo thời gian thực.

3. **Quản trị viên (Store Administrator - Role: ADMIN)**:
   - Toàn quyền quản trị hệ thống.
   - Quản lý danh mục trang phục (Thêm, sửa, ẩn danh mục).
   - Quản lý thông tin trang phục, thư viện hình ảnh minh họa (Thêm, sửa, ẩn/ngừng kinh doanh).
   - Quản lý biến thể kích cỡ (Size, SKU) và kiểm soát tồn kho (`totalQuantity`, `outOfServiceQuantity`).
   - Tiếp nhận, xem xét và Xác nhận (`CONFIRMED`) hoặc Từ chối (`REJECTED`) đơn thuê mới.
   - Thực hiện thao tác Giao đồ tại quầy -> chuyển trạng thái sang Đang thuê (`RENTING`).
   - Thực hiện thao tác Nhận trả đồ & ghi nhận hoàn trả cọc -> chuyển sang Đã hoàn tất (`RETURNED`).
   - Theo dõi bảng điều khiển số liệu (Dashboard) tổng hợp doanh thu, lượng hàng đang ở ngoài cửa hàng, cảnh báo quá hạn.
   - Tra cứu lịch sử thay đổi trạng thái và dấu vết thao tác của mọi đơn hàng (`RentalStatusHistory`).

---

## 3. Yêu Cầu Chức Năng Cốt Lõi (Functional Requirements - FR)

### FR1: Quản lý Định danh & Phiên làm việc (Authentication & Session)
- **FR1.1**: Đăng ký tài khoản với email duy nhất, họ tên, số điện thoại Việt Nam và mật khẩu bảo mật (tối thiểu 8 ký tự, có chữ hoa, thường và số).
- **FR1.2**: Đăng nhập trả về Access Token JWT ngắn hạn (15 phút) trong payload và Refresh Token dài hạn (7 ngày) trong HttpOnly Secure Cookie.
- **FR1.3**: Cơ chế Refresh Token Rotation: Mỗi lần cấp mới Access Token, Refresh Token cũ bị thu hồi và cấp một cặp token mới.
- **FR1.4**: Đăng xuất an toàn: Thu hồi phiên tại máy chủ và xóa sạch cookie client.

### FR2: Quản lý Danh mục & Trang phục Cosplay (Catalog & Inventory)
- **FR2.1**: Phân loại trang phục theo danh mục (Anime/Manga, Game Genshin/Honkai, Cổ phong/Hanfu, Siêu anh hùng, Khác).
- **FR2.2**: Mỗi trang phục có nhiều hình ảnh minh họa, giá thuê/ngày cố định, mức tiền cọc quy định/bộ.
- **FR2.3**: Quản lý đa kích cỡ (S, M, L, XL, XXL, FreeSize), mỗi kích cỡ quản lý số lượng tổng và số lượng bảo trì.
- **FR2.4**: Cơ chế ẩn sản phẩm (Soft-deactivate): Không bao giờ xóa cứng trang phục đã phát sinh đơn thuê trong quá khứ nhằm bảo vệ tính toàn vẹn dữ liệu kế toán và lịch sử người dùng.

### FR3: Tính Giá và Lập Báo Giá Thuê (Pricing Engine)
- **FR3.1**: Quy chuẩn ngày lịch: Sử dụng múi giờ Việt Nam (`Asia/Ho_Chi_Minh`), không bị sai lệch bởi chuyển đổi múi giờ UTC.
- **FR3.2**: Công thức tính số ngày thuê:
  $$\text{Số ngày thuê} = (\text{Ngày trả} - \text{Ngày nhận}) + 1$$
  Cả ngày nhận và ngày trả đều được tính tiền; thuê cùng ngày tính tròn 1 ngày.
- **FR3.3**: Công thức tính tiền thuê dòng sản phẩm:
  $$\text{Tiền thuê} = \text{Đơn giá thuê/ngày} \times \text{Số ngày thuê} \times \text{Số lượng}$$
- **FR3.4**: Công thức tính tiền đặt cọc:
  $$\text{Tiền cọc} = \text{Tiền cọc quy định/bộ} \times \text{Số lượng}$$
- **FR3.5**: Nguyên tắc độc lập tài chính: Tiền cọc là khoản bảo đảm tạm thời, hoàn lại khi khách trả đồ nguyên vẹn; tuyệt đối không cộng gộp tiền cọc vào doanh thu tiền thuê.
- **FR3.6**: Toàn bộ giá trị tiền tệ được tính toán và lưu trữ dạng số nguyên VND (Integer), cấm dùng số thực dấu phẩy động (`float`/`double`) gây sai số làm tròn.

### FR4: Thuật toán Kiểm tra Tồn kho & Đặt giữ chỗ (Availability & Booking Algorithm)
- **FR4.1**: Các trạng thái giữ chỗ trong lịch: `PENDING`, `CONFIRMED`, `RENTING`.
- **FR4.2**: Các trạng thái không giữ chỗ tương lai: `CANCELLED`, `REJECTED`, `RETURNED`.
- **FR4.3**: Xử lý đồ quá hạn: Nếu một đơn ở trạng thái `RENTING` nhưng ngày hiện tại đã vượt quá `endDate` (quá hạn chưa trả), đơn này tiếp tục được xem là chiếm dụng tồn kho và không cho phép khách hàng mới thuê cho đến khi quản trị viên xác nhận đã nhận trả đồ (`RETURNED`).
- **FR4.4**: Thuật toán quét từng ngày: Với mỗi ngày $d \in [\text{startDate}, \text{endDate}]$, tính tổng số lượng đang bị chiếm chỗ $R(d)$ từ các đơn đang hoạt động. Lượng tồn khả dụng tại ngày $d$ là:
  $$A(d) = \text{totalQuantity} - \text{outOfServiceQuantity} - R(d)$$
  Số lượng có thể thuê cho cả khoảng thời gian là:
  $$\text{MaxRentable} = \min_{d \in [\text{startDate}, \text{endDate}]} A(d)$$
- **FR4.5**: Chống cộng dồn sai lệch (Non-overlapping intervals): Hai đơn thuê không trùng ngày nhau trong cùng một khoảng quét của khách thứ ba sẽ không bị cộng dồn làm sai lệch số lượng khả dụng.

### FR5: Tạo Đơn & Chống Đua Đặt Hàng Đồng Thời (Concurrency & Safe Checkout)
- **FR5.1**: Backend tự tính toán lại toàn bộ đơn giá, số ngày và tiền cọc từ DB; bỏ qua bất kỳ giá trị tiền tệ nào do frontend gửi lên.
- **FR5.2**: Thực hiện việc tạo đơn trong một Database Transaction mức độ cô lập cao.
- **FR5.3**: Sử dụng khóa hàng bi quan (Pessimistic Locking `SELECT ... FOR UPDATE`) trên bảng biến thể `CostumeVariant`.
- **FR5.4**: Sắp xếp các biến thể theo ID tăng dần trước khi khóa (`ORDER BY id ASC`) để loại trừ triệt để nguy cơ Deadlock khi nhiều khách hàng cùng đặt các đơn có nhiều mặt hàng chéo nhau.
- **FR5.5**: Lưu Snapshot dữ liệu: Tên trang phục, tên kích cỡ, đơn giá thuê/ngày, tiền cọc quy định tại thời điểm đặt đơn vào bảng `rental_order_items`. Khi quản trị viên sửa giá trang phục sau này, đơn hàng cũ vẫn giữ nguyên giá trị ban đầu.
- **FR5.6**: Chặn giảm tồn kho vi phạm cam kết: Không cho phép Admin giảm `totalQuantity` của biến thể xuống dưới số lượng tối đa đã cam kết cho các đơn đặt trước còn hiệu lực.

### FR6: Vòng đời Đơn hàng & Lịch sử Chuyển trạng thái (Order Lifecycle & Audit Trail)
- **FR6.1**: Máy trạng thái nghiêm ngặt (Finite State Machine):
  - Khởi tạo: `PENDING`
  - `PENDING` $\rightarrow$ `CONFIRMED` (Admin xác nhận) hoặc `REJECTED` (Admin từ chối)
  - `PENDING` $\rightarrow$ `CANCELLED` (Khách hàng tự hủy đơn của chính mình)
  - `CONFIRMED` $\rightarrow$ `RENTING` (Admin giao trang phục tại quầy)
  - `RENTING` $\rightarrow$ `RETURNED` (Admin nhận trả trang phục và hoàn cọc)
- **FR6.2**: Cấm mọi chuyển đổi trạng thái ngoài luồng định sẵn (ví dụ: cấm `CANCELLED` $\rightarrow$ `CONFIRMED`, cấm `RETURNED` $\rightarrow$ `RENTING`).
- **FR6.3**: Bảng vết kiểm toán (`rental_status_histories`): Mọi thay đổi trạng thái đều ghi lại: trạng thái trước, trạng thái sau, thời điểm, người thực hiện (ID, Tên, Vai trò) và ghi chú nghiệp vụ.

---

## 4. Yêu Cầu Phi Chức Năng (Non-Functional Requirements - NFR)

### NFR1: Hiệu năng & Khả năng đáp ứng (Performance)
- Thời gian phản hồi API tìm kiếm và kiểm tra tồn kho dưới 300ms trong điều kiện bình thường.
- Đánh chỉ mục (Indexes) hợp lý trên các trường thường xuyên lọc và tìm kiếm: `categoryId`, `isActive`, `slug`, `startDate`, `endDate`, `status`, `userId`.
- Tải trang frontend dưới 1.5 giây; sử dụng bundle tách lẻ (code splitting) từ Vite.

### NFR2: Bảo mật & An toàn thông tin (Security)
- Tuân thủ hướng dẫn OWASP Top 10.
- Mã hóa mật khẩu một chiều sử dụng thuật toán băm tiêu chuẩn công nghiệp (Argon2id hoặc bcrypt salt rounds >= 10).
- Cookie bảo mật cho Refresh Token (`HttpOnly`, `SameSite=Lax`, `Secure` khi bật HTTPS, giới hạn `Path`).
- Access Token giữ trong bộ nhớ JavaScript (`in-memory`), không lưu trong `localStorage` để triệt tiêu nguy cơ bị đánh cắp qua tấn công XSS.
- Chống tấn công CSRF thông qua cơ chế SameSite Cookie kết hợp kiểm tra Custom Header trên các yêu cầu nhạy cảm.
- Kiểm soát phân quyền dựa trên vai trò (Role-Based Access Control - RBAC) chặt chẽ trên toàn bộ các Endpoint Quản trị.
- Chống tấn công tham chiếu trực tiếp đối tượng không an toàn (IDOR): Khách hàng chỉ truy xuất và thao tác được trên các đơn hàng có `userId` khớp với `req.user.id`.
- Chống SQL Injection bằng cách sử dụng 100% Parameterized Queries qua TypeORM Repository/QueryBuilder; kiểm soát chặt chẽ các trường cho phép sắp xếp (`sortBy`).
- Chống tràn dữ liệu và tấn công DoS bằng NestJS ValidationPipe (`whitelist: true`, `forbidNonWhitelisted: true`) và giới hạn tần suất gửi yêu cầu (`@nestjs/throttler`).
- Header bảo mật HTTP với `helmet` (chặn clickjacking, MIME-sniffing, XSS filtering).
- Thông báo lỗi chung, không để lộ cấu trúc bảng, stack trace lỗi cơ sở dữ liệu hay tiết lộ sự tồn tại của tài khoản khi đăng nhập sai.

### NFR3: Trải nghiệm & Tiếp cận Người dùng (Usability & Accessibility)
- Giao diện thân thiện, kế thừa ngôn ngữ thị giác quen thuộc của Booking.com (Tone màu chủ đạo: Xanh đậm `#003580` kết hợp điểm nhấn Vàng kim `#febb02`).
- 100% Tiếng Việt, định dạng tiền tệ Việt Nam Đồng (`₫`), ngày tháng hiển thị theo định dạng quen thuộc `dd/MM/yyyy`.
- Thiết kế đáp ứng đa màn hình (Responsive Design): Hiển thị mượt mà trên cả điện thoại di động (Mobile), máy tính bảng (Tablet) và máy tính để bàn (Desktop).
- Khả năng tiếp cận (Accessibility - a11y): Thẻ form có nhãn `label` rõ ràng, trạng thái focus bàn phím trực quan, hình ảnh luôn có thuộc tính `alt` mô tả, hỗ trợ người khiếm thị đọc màn hình.
- Phản hồi giao diện đầy đủ: Trạng thái đang tải (Loading Skeleton/Spinner), trạng thái rỗng khi không có kết quả (Empty States), thông báo lỗi và hộp thoại xác nhận trước các hành động nhạy cảm (Hủy đơn, Xóa sản phẩm).
- Thiết kế luồng đặt thuê tinh gọn, tối đa 4 bước nghiệp vụ chính:
  1. Chọn trang phục & xem chi tiết
  2. Chọn kích cỡ & khoảng ngày thuê
  3. Xem bảng tính giá & kiểm tra điều khoản
  4. Xác nhận đặt đơn & nhận mã theo dõi tại quầy.

### NFR4: Tính Tin cậy & Khả năng Duy trì (Reliability & Maintainability)
- Kiến trúc phân lớp rõ ràng (Layered Architecture): Controller $\rightarrow$ Service $\rightarrow$ Repository $\rightarrow$ Database.
- Quản lý cấu trúc cơ sở dữ liệu hoàn toàn bằng Migration TypeORM; cấm bật cờ `synchronize: true` trong môi trường triển khai thực tế.
- Khả năng kiểm thử tự động cao: Phủ kín Unit Test nghiệp vụ cốt lõi, Integration Test cơ sở dữ liệu và End-to-End Test luồng người dùng.
- Cấu hình môi trường minh bạch thông qua `.env.example`, tài liệu hóa API đầy đủ bằng Swagger/OpenAPI.

