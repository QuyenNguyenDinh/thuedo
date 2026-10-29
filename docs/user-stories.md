# Tài liệu Đặc tả User Stories – Dự án CosRent
**Hệ thống Website Cho thuê Trang phục và Phụ kiện Cosplay**
*Môn học: Phát triển Ứng dụng Web Nâng cao*
*Mã tài liệu: DOC-US-01 | Phiên bản: 1.0.0*

---

## 1. Giới thiệu và Nguyên tắc Định dạng

Tài liệu này xác định phạm vi chức năng cốt lõi cho hệ thống CosRent thông qua 20 User Stories (US01 – US20). Mỗi User Story tuân thủ chặt chẽ định dạng chuẩn:
> **"Là [vai trò], tôi muốn [hành động / mục tiêu], để [lợi ích / giá trị mang lại]."**

Hệ thống có hai vai trò chính:
- **CUSTOMER (Khách hàng)**: Người dùng đã đăng ký tài khoản và đăng nhập.
- **ADMIN (Quản trị viên)**: Nhân sự quản lý cửa hàng, trang phục và đơn thuê.
- **Khách truy cập (Unauthenticated Guest)**: Người dùng chưa đăng nhập, được phép xem danh mục, tìm kiếm và xem chi tiết trang phục.

---

## 2. Danh sách 20 User Stories Chi tiết

### US01: Đăng ký tài khoản
- **Mô tả**: Là khách truy cập, tôi muốn đăng ký tài khoản để sử dụng dịch vụ thuê trang phục.
- **Vai trò**: Khách truy cập (Chưa đăng nhập).
- **Tiêu chí chấp nhận (Acceptance Criteria)**:
  1. Người dùng nhập đầy đủ: Họ và tên, Email hợp lệ, Số điện thoại (định dạng Việt Nam 10 chữ số), Mật khẩu (tối thiểu 8 ký tự, có chữ hoa, chữ thường và số).
  2. Hệ thống kiểm tra tính duy nhất của Email; nếu đã tồn tại thì báo lỗi thân thiện mà không để lộ thông tin nhạy cảm.
  3. Mật khẩu được mã hóa an toàn bằng Argon2id hoặc bcrypt (salt rounds >= 10) trước khi lưu trữ vào cơ sở dữ liệu.
  4. Sau khi đăng ký thành công, tài khoản mặc định có vai trò `CUSTOMER` và hệ thống trả về thông báo thành công, điều hướng tới trang đăng nhập.
- **Trường hợp thành công**: Nhập email `khachhang@example.com`, mật khẩu `MatKhau@123`, thông tin hợp lệ -> Đăng ký thành công, mã trạng thái 201 Created.
- **Trường hợp thất bại**:
  - Email đã tồn tại -> Trả về lỗi 409 Conflict: "Email này đã được đăng ký tài khoản".
  - Mật khẩu dưới 8 ký tự -> Trả về lỗi 400 Bad Request: "Mật khẩu phải có ít nhất 8 ký tự".
- **API liên quan**: `POST /api/v1/auth/register`
- **Màn hình liên quan**: Màn hình Đăng ký (`/register`).
- **Kiểm thử liên quan**: `auth.service.spec.ts` (unit), `auth.e2e-spec.ts` (integration), `RegisterPage.test.tsx` (frontend).

---

### US02: Đăng nhập hệ thống
- **Mô tả**: Là khách hàng, tôi muốn đăng nhập để truy cập tài khoản của mình.
- **Vai trò**: Khách truy cập / Khách hàng / Quản trị viên.
- **Tiêu chí chấp nhận**:
  1. Đăng nhập bằng Email và Mật khẩu.
  2. Hệ thống xác thực mật khẩu qua thuật toán băm (Argon2id/bcrypt).
  3. Khi xác thực thành công, hệ thống cấp:
     - Access Token ngắn hạn (15 phút) trả về trong payload JSON (Frontend lưu trong bộ nhớ - memory).
     - Refresh Token dài hạn (7 ngày) được mã hóa hash và lưu vào bảng `refresh_sessions` phía DB, đồng thời trả về trình duyệt qua HttpOnly Cookie (`SameSite=Lax`, `Secure` khi production, `path=/api/v1/auth`).
  4. Trả về thông tin hồ sơ cơ bản (id, fullName, email, role).
  5. Có cơ chế giới hạn tần suất đăng nhập sai (Rate Limiting - Throttler) để chống brute-force.
- **Trường hợp thành công**: Nhập đúng email và mật khẩu -> Nhận 200 OK, Access Token và Cookie `refreshToken`.
- **Trường hợp thất bại**:
  - Sai mật khẩu hoặc email không tồn tại -> Trả về 401 Unauthorized: "Email hoặc mật khẩu không chính xác" (thông điệp đồng nhất để không lộ việc email có tồn tại hay không).
  - Vượt quá 5 lần đăng nhập sai liên tiếp trong 1 phút -> Trả về 429 Too Many Requests.
- **API liên quan**: `POST /api/v1/auth/login`
- **Màn hình liên quan**: Màn hình Đăng nhập (`/login`).
- **Kiểm thử liên quan**: `auth.service.spec.ts`, `auth.e2e-spec.ts`, `LoginPage.test.tsx`.

---

### US03: Đăng xuất phiên làm việc
- **Mô tả**: Là khách hàng, tôi muốn đăng xuất để kết thúc phiên sử dụng an toàn.
- **Vai trò**: CUSTOMER, ADMIN.
- **Tiêu chí chấp nhận**:
  1. Khi người dùng bấm đăng xuất, hệ thống gửi yêu cầu lên backend.
  2. Backend thu hồi (revoke / xóa) bản ghi Refresh Token session tương ứng trong database.
  3. Xóa cookie `refreshToken` trên trình duyệt bằng cách đặt thời gian hết hạn trong quá khứ (`Max-Age=0`).
  4. Frontend xóa sạch Access Token và thông tin người dùng trong bộ nhớ client.
- **Trường hợp thành công**: Bấm đăng xuất -> Nhận 200 OK, cookie bị xóa, chuyển hướng về Trang chủ.
- **Trường hợp thất bại**: Gọi API khi token không hợp lệ -> Vẫn tiến hành xóa cookie phía client và chuyển hướng về đăng nhập an toàn.
- **API liên quan**: `POST /api/v1/auth/logout`
- **Màn hình liên quan**: Header nút "Đăng xuất" trên mọi trang.
- **Kiểm thử liên quan**: `auth.service.spec.ts`, `auth.e2e-spec.ts`, `Header.test.tsx`.

---

### US04: Xem và cập nhật hồ sơ cá nhân
- **Mô tả**: Là khách hàng, tôi muốn xem và cập nhật hồ sơ để cửa hàng có thông tin liên hệ chính xác.
- **Vai trò**: CUSTOMER, ADMIN.
- **Tiêu chí chấp nhận**:
  1. Xem thông tin cá nhân: Họ tên, Email, Số điện thoại, Địa chỉ liên hệ, Ngày tham gia.
  2. Cho phép cập nhật Họ tên, Số điện thoại, Địa chỉ.
  3. Không cho phép tự ý đổi Email (để tránh chiếm đoạt tài khoản) hoặc tự đổi vai trò `role` (chặn privilege escalation).
  4. Dữ liệu số điện thoại và họ tên được validate định dạng trước khi lưu.
- **Trường hợp thành công**: Cập nhật số điện thoại thành `0912345678` -> Nhận 200 OK với dữ liệu hồ sơ mới.
- **Trường hợp thất bại**: Gửi body chứa `role: "ADMIN"` -> Hệ thống lọc bỏ hoặc báo lỗi 400 Bad Request, vai trò vẫn là `CUSTOMER`.
- **API liên quan**: `GET /api/v1/users/me`, `PUT /api/v1/users/me`
- **Màn hình liên quan**: Màn hình Hồ sơ cá nhân (`/profile`).
- **Kiểm thử liên quan**: `users.service.spec.ts`, `users.e2e-spec.ts`, `ProfilePage.test.tsx`.

---

### US05: Xem danh sách trang phục
- **Mô tả**: Là khách truy cập, tôi muốn xem danh sách trang phục để lựa chọn sản phẩm phù hợp.
- **Vai trò**: Khách truy cập, CUSTOMER, ADMIN.
- **Tiêu chí chấp nhận**:
  1. Hiển thị danh sách các trang phục đang kích hoạt (`isActive: true`). Trang phục bị ẩn sẽ không hiển thị với khách.
  2. Mỗi sản phẩm hiển thị: Hình ảnh đại diện, Tên trang phục, Danh mục (Anime, Game, Cổ trang,...), Giá thuê/ngày (VND), Tiền cọc (VND), Các kích cỡ sẵn có (S, M, L, XL,...).
  3. Hỗ trợ phân trang rõ ràng (mặc định 12 sản phẩm/trang) và hiển thị tổng số kết quả.
  4. Xử lý trạng thái đang tải (Loading Spinner) và trạng thái danh sách rỗng (Empty State).
- **Trường hợp thành công**: Truy cập trang danh sách -> Nhận 200 OK kèm mảng sản phẩm và metadata phân trang `{ total, page, limit, totalPages }`.
- **Trường hợp thất bại**: Truy vấn trang không hợp lệ (ví dụ: `page=-1`) -> Backend tự động chuẩn hóa về `page=1`.
- **API liên quan**: `GET /api/v1/costumes`
- **Màn hình liên quan**: Màn hình Tìm kiếm / Danh sách sản phẩm (`/costumes`).
- **Kiểm thử liên quan**: `costumes.service.spec.ts`, `costumes.e2e-spec.ts`, `CostumeListPage.test.tsx`.

---

### US06: Tìm kiếm và lọc trang phục
- **Mô tả**: Là khách truy cập, tôi muốn tìm kiếm và lọc theo tên, danh mục, kích cỡ và giá để tìm trang phục nhanh hơn.
- **Vai trò**: Khách truy cập, CUSTOMER, ADMIN.
- **Tiêu chí chấp nhận**:
  1. Tìm kiếm theo từ khóa tên trang phục hoặc tên nhân vật/tác phẩm (không phân biệt chữ hoa thường).
  2. Lọc theo Danh mục (Category ID).
  3. Lọc theo Kích cỡ biến thể (S, M, L, XL, FreeSize,...).
  4. Lọc theo khoảng giá thuê mỗi ngày (`minPrice`, `maxPrice`).
  5. Sắp xếp theo: Mới nhất, Giá tăng dần, Giá giảm dần.
  6. Giữ nguyên trạng thái bộ lọc trên URL Search Params để người dùng có thể chia sẻ link hoặc tải lại trang không mất bộ lọc.
- **Trường hợp thành công**: Lọc theo category "Anime", kích cỡ "M", giá từ 100.000 đến 300.000 -> Trả về đúng danh sách thỏa mãn.
- **Trường hợp thất bại**: Nhập khoảng giá âm hoặc `minPrice > maxPrice` -> Báo lỗi 400 Bad Request: "Khoảng giá không hợp lệ".
- **API liên quan**: `GET /api/v1/costumes?keyword=...&categoryId=...&size=...&minPrice=...&maxPrice=...&sortBy=...`
- **Màn hình liên quan**: Thanh tìm kiếm (SearchBar) và Bộ lọc cạnh bên (FilterSidebar) trên `/costumes`.
- **Kiểm thử liên quan**: `costumes.service.spec.ts`, `CostumeListPage.test.tsx`.

---

### US07: Xem chi tiết trang phục
- **Mô tả**: Là khách truy cập, tôi muốn xem chi tiết trang phục để biết hình ảnh, mô tả, giá thuê và tiền cọc.
- **Vai trò**: Khách truy cập, CUSTOMER, ADMIN.
- **Tiêu chí chấp nhận**:
  1. Hiển thị bộ sưu tập ảnh (Carousel/Gallery) với ảnh sắc nét, có thuộc tính `alt` và ảnh fallback khi lỗi tải.
  2. Hiển thị đầy đủ: Tên trang phục, Nhân vật/Series, Danh mục, Mô tả chi tiết chất liệu và phụ kiện đi kèm (tóc giả, vũ khí, áo choàng,...), Quy định bảo quản và nhận trả tại cửa hàng.
  3. Bảng giá niêm yết: Giá thuê/ngày (VND) và Tiền cọc/bộ (VND).
  4. Danh sách các kích cỡ (Variant) còn hoạt động kèm số đo gợi ý (Chiều cao, Cân nặng, Vòng ngực/eo).
- **Trường hợp thành công**: Xem chi tiết trang phục ID 1 -> Nhận 200 OK với đầy đủ thông tin trang phục, danh mục, danh sách ảnh và các biến thể.
- **Trường hợp thất bại**: Truy cập ID không tồn tại hoặc trang phục đã bị ẩn -> Trả về 404 Not Found: "Không tìm thấy trang phục".
- **API liên quan**: `GET /api/v1/costumes/:id`
- **Màn hình liên quan**: Màn hình Chi tiết trang phục (`/costumes/:id`).
- **Kiểm thử liên quan**: `costumes.service.spec.ts`, `costumes.e2e-spec.ts`, `CostumeDetailPage.test.tsx`.

---

### US08: Kiểm tra số lượng còn có thể thuê theo kích cỡ và khoảng ngày
- **Mô tả**: Là khách hàng, tôi muốn kiểm tra số lượng còn có thể thuê theo kích cỡ và khoảng ngày để chọn sản phẩm phù hợp.
- **Vai trò**: Khách hàng, Khách truy cập.
- **Tiêu chí chấp nhận**:
  1. Người dùng chọn Kích cỡ biến thể, Ngày bắt đầu (nhận đồ) và Ngày kết thúc (trả đồ).
  2. Ngày nhận không được ở quá khứ (so với ngày hiện tại theo múi giờ `Asia/Ho_Chi_Minh`).
  3. Ngày trả không được trước ngày nhận.
  4. Thuật toán kiểm tra lịch: Xét từng ngày trong khoảng `[startDate, endDate]`. Với mỗi ngày $d$, tính tổng số lượng đã được giữ bởi các đơn ở trạng thái `PENDING`, `CONFIRMED`, hoặc `RENTING` (bao gồm các đơn `RENTING` quá hạn chưa trả).
  5. Số lượng khả dụng cho toàn khoảng ngày là giá trị nhỏ nhất của lượng còn lại qua tất cả các ngày trong khoảng: $\min_{d} (\text{totalQuantity} - \text{outOfService} - \text{reserved}(d))$.
  6. Hiển thị rõ: Còn hàng (kèm số lượng tối đa có thể chọn) hoặc Hết hàng trong khoảng ngày đã chọn.
- **Trường hợp thành công**: Chọn ngày 10/11 đến 12/11, biến thể size M có tổng số lượng 3, đơn cũ giữ 1 bộ -> Trả về `{ availableQuantity: 2, isAvailable: true }`.
- **Trường hợp thất bại**: Chọn ngày trả trước ngày nhận (ví dụ 10/11 đến 08/11) -> Báo lỗi 400 Bad Request: "Ngày trả đồ không được trước ngày nhận đồ".
- **API liên quan**: `GET /api/v1/costumes/:id/availability?variantId=...&startDate=...&endDate=...`
- **Màn hình liên quan**: Khối đặt thuê trên Màn hình Chi tiết trang phục (`/costumes/:id`).
- **Kiểm thử liên quan**: `availability.service.spec.ts` (unit), `availability.e2e-spec.ts` (integration).

---

### US09: Xem bảng tính tiền thuê và tiền cọc
- **Mô tả**: Là khách hàng, tôi muốn xem bảng tính tiền thuê và tiền cọc để biết số tiền cần chuẩn bị.
- **Vai trò**: Khách hàng, Khách truy cập.
- **Tiêu chí chấp nhận**:
  1. Tính đúng số ngày thuê: Theo ngày lịch tại `Asia/Ho_Chi_Minh`, cả ngày nhận và ngày trả đều tính tiền: $\text{Số ngày} = (\text{Ngày trả} - \text{Ngày nhận}) + 1$. Thuê và trả trong cùng một ngày tính 1 ngày.
  2. Tiền thuê từng sản phẩm = $\text{Đơn giá/ngày} \times \text{Số ngày thuê} \times \text{Số lượng}$.
  3. Tiền đặt cọc = $\text{Tiền cọc quy định/bộ} \times \text{Số lượng}$ (tiền cọc độc lập với số ngày thuê).
  4. Hiển thị tách biệt rõ ràng giữa Tiền thuê (doanh thu dịch vụ) và Tiền đặt cọc (hoàn lại khi trả đồ nguyên vẹn), kèm Tổng số tiền cần thanh toán/đặt cọc tại cửa hàng khi nhận đồ.
  5. Toàn bộ phép tính thực hiện bằng số nguyên VND phía backend (không dùng số thực dấu phẩy động làm lệch số tiền lẻ).
- **Trường hợp thành công**: Thuê từ 01/11 đến 03/11 (3 ngày), đơn giá 150.000 đ/ngày, tiền cọc 500.000 đ, số lượng 2 bộ -> Tiền thuê = 150.000 * 3 * 2 = 900.000 đ; Tiền cọc = 500.000 * 2 = 1.000.000 đ; Tổng thanh toán ban đầu = 1.900.000 đ.
- **Trường hợp thất bại**: Gửi số lượng <= 0 -> Báo lỗi 400: "Số lượng thuê phải lớn hơn 0".
- **API liên quan**: `POST /api/v1/rental-quotes`
- **Màn hình liên quan**: Widget Tính giá trên Chi tiết trang phục và Màn hình Xác nhận đặt thuê (`/checkout`).
- **Kiểm thử liên quan**: `pricing.service.spec.ts`, `QuoteCard.test.tsx`.

---

### US10: Tạo đơn thuê trang phục
- **Mô tả**: Là khách hàng, tôi muốn tạo đơn thuê để đặt giữ trang phục theo thời gian đã chọn.
- **Vai trò**: CUSTOMER (Đã đăng nhập).
- **Tiêu chí chấp nhận**:
  1. Khách hàng xem lại các mặt hàng, ngày thuê, số lượng và tổng tiền trước khi bấm xác nhận.
  2. Bắt buộc nhập thông tin liên hệ nhận đồ: Tên người nhận, Số điện thoại, Ghi chú nhận đồ tại cửa hàng.
  3. Backend tự động tính toán lại toàn bộ đơn giá, số ngày, tiền thuê và tiền cọc từ DB; tuyệt đối không tin giá hoặc tổng tiền do frontend gửi lên.
  4. Thực hiện trong một Database Transaction với cơ chế khóa bi quan (Pessimistic Locking `SELECT ... FOR UPDATE`) trên các biến thể được sắp xếp theo thứ tự ID ổn định (tránh deadlock).
  5. Kiểm tra lại tồn kho tức thời trong transaction: Nếu không đủ hàng thì rollback và trả về lỗi 409 Conflict.
  6. Lưu Snapshot thông tin trang phục: Tên trang phục, Tên kích cỡ, Đơn giá/ngày, Tiền cọc vào từng dòng `RentalOrderItem` để việc thay đổi giá trong tương lai không làm sai lệch lịch sử đơn cũ.
  7. Khởi tạo đơn ở trạng thái `PENDING` và ghi bản ghi đầu tiên vào `RentalStatusHistory` ("Khách hàng tạo đơn thuê").
- **Trường hợp thành công**: Đủ hàng, thông tin hợp lệ -> Tạo đơn thành công, trả về 201 Created với mã đơn `orderCode` (ví dụ: `CR-20261029-XXXX`).
- **Trường hợp thất bại**: Hai khách hàng đồng thời đặt bộ đồ cuối cùng cùng thời điểm -> Một đơn thành công, đơn còn lại nhận 409 Conflict: "Sản phẩm đã hết hàng trong khoảng ngày đã chọn".
- **API liên quan**: `POST /api/v1/rentals`
- **Màn hình liên quan**: Màn hình Xác nhận đặt thuê (`/checkout`).
- **Kiểm thử liên quan**: `rentals.service.spec.ts`, `concurrency.e2e-spec.ts`, `CheckoutPage.test.tsx`.

---

### US11: Xem lịch sử và chi tiết đơn thuê
- **Mô tả**: Là khách hàng, tôi muốn xem lịch sử và chi tiết đơn thuê để theo dõi quá trình xử lý.
- **Vai trò**: CUSTOMER.
- **Tiêu chí chấp nhận**:
  1. Khách hàng xem được danh sách tất cả các đơn thuê của chính mình, có thể lọc theo trạng thái (Tất cả, Chờ duyệt, Đã xác nhận, Đang thuê, Đã hoàn tất, Đã hủy).
  2. Xem chi tiết từng đơn: Mã đơn, Thời gian tạo, Khoảng ngày thuê, Danh sách sản phẩm kèm ảnh, kích cỡ, đơn giá snapshot, tiền thuê, tiền cọc, tổng cộng, ghi chú cửa hàng, quy định nhận trả tại cửa hàng.
  3. Hiển thị tiến trình trạng thái trực quan (Status Timeline / Stepper): PENDING -> CONFIRMED -> RENTING -> RETURNED.
  4. Bảo mật IDOR: Khách hàng chỉ xem được đơn thuộc sở hữu của mình (`userId === req.user.id`). Nếu cố tình nhập ID đơn của người khác trên URL, hệ thống trả về 403 Forbidden hoặc 404 Not Found.
- **Trường hợp thành công**: Khách A xem đơn ID 10 của khách A -> Trả về 200 OK với đầy đủ chi tiết đơn.
- **Trường hợp thất bại**: Khách A xem đơn ID 12 của khách B -> Trả về 403 Forbidden: "Bạn không có quyền truy cập đơn thuê này".
- **API liên quan**: `GET /api/v1/rentals` (danh sách của tôi), `GET /api/v1/rentals/:id` (chi tiết đơn)
- **Màn hình liên quan**: Màn hình Đơn thuê của tôi (`/my-rentals`) và Chi tiết đơn (`/my-rentals/:id`).
- **Kiểm thử liên quan**: `rentals.service.spec.ts`, `idor-security.e2e-spec.ts`, `MyRentalsPage.test.tsx`.

---

### US12: Khách hàng hủy đơn đang chờ xác nhận
- **Mô tả**: Là khách hàng, tôi muốn hủy đơn đang chờ xác nhận để kết thúc yêu cầu khi không còn nhu cầu.
- **Vai trò**: CUSTOMER (Chủ sở hữu đơn).
- **Tiêu chí chấp nhận**:
  1. Khách hàng chỉ được phép hủy đơn khi trạng thái hiện tại là `PENDING`.
  2. Nếu đơn đã chuyển sang `CONFIRMED` hoặc `RENTING`, nút "Hủy đơn" bị ẩn trên giao diện; nếu cố tình gửi request sẽ bị từ chối với lý do đơn đã được cửa hàng xác nhận/chuẩn bị.
  3. Khi hủy thành công:
     - Trạng thái đơn chuyển thành `CANCELLED`.
     - Lịch giữ chỗ của đơn được giải phóng ngay lập tức (các ngày đã chọn trở lại trạng thái khả dụng cho khách hàng khác).
     - Ghi nhận lịch sử thay đổi trạng thái vào `RentalStatusHistory` với ghi chú lý do hủy.
- **Trường hợp thành công**: Hủy đơn PENDING -> 200 OK, trạng thái chuyển `CANCELLED`, lịch giữ chỗ được giải phóng.
- **Trường hợp thất bại**:
  - Hủy đơn đang ở trạng thái `CONFIRMED` hoặc `RENTING` -> Trả về 400 Bad Request: "Không thể hủy đơn thuê đã được xác nhận hoặc đang thuê".
  - Hủy đơn của khách hàng khác -> Trả về 403 Forbidden.
- **API liên quan**: `POST /api/v1/rentals/:id/cancel`
- **Màn hình liên quan**: Chi tiết đơn thuê (`/my-rentals/:id`) có nút bấm "Hủy đơn" kèm Modal xác nhận.
- **Kiểm thử liên quan**: `rentals.service.spec.ts`, `rentals.e2e-spec.ts`.

---

### US13: Quản lý danh mục trang phục
- **Mô tả**: Là quản trị viên, tôi muốn quản lý danh mục để sắp xếp trang phục.
- **Vai trò**: ADMIN.
- **Tiêu chí chấp nhận**:
  1. Xem danh sách danh mục kèm số lượng trang phục thuộc mỗi danh mục.
  2. Tạo danh mục mới: Nhập Tên danh mục, Slug, Mô tả ngắn, Thứ tự hiển thị.
  3. Chỉnh sửa thông tin danh mục.
  4. Ẩn/Xóa danh mục: Chỉ cho phép xóa khi danh mục không chứa trang phục nào; nếu đã có trang phục thì chỉ cho phép ẩn để bảo toàn dữ liệu.
  5. Người dùng thông thường (`CUSTOMER`) hoặc khách truy cập không thể gọi các API thêm/sửa/xóa danh mục.
- **Trường hợp thành công**: Admin tạo danh mục "Vocaloid & Idol" -> Trả về 201 Created.
- **Trường hợp thất bại**: Khách hàng gọi `POST /api/v1/admin/categories` -> Bị chặn 403 Forbidden bởi RolesGuard.
- **API liên quan**: `GET /api/v1/admin/categories`, `POST /api/v1/admin/categories`, `PUT /api/v1/admin/categories/:id`, `DELETE /api/v1/admin/categories/:id`
- **Màn hình liên quan**: Màn hình Quản lý Danh mục Admin (`/admin/categories`).
- **Kiểm thử liên quan**: `categories.service.spec.ts`, `rbac.e2e-spec.ts`, `AdminCategoriesPage.test.tsx`.

---

### US14: Thêm, sửa và ẩn trang phục
- **Mô tả**: Là quản trị viên, tôi muốn thêm, sửa và ẩn trang phục để cập nhật sản phẩm cho thuê.
- **Vai trò**: ADMIN.
- **Tiêu chí chấp nhận**:
  1. Thêm trang phục mới: Tên trang phục, Danh mục, Mô tả chi tiết, Nhân vật, Giá thuê/ngày (VND), Tiền cọc (VND), Danh sách URL ảnh minh họa.
  2. Chỉnh sửa thông tin trang phục: Cập nhật mô tả, giá niêm yết, ảnh.
  3. Quy tắc toàn vẹn dữ liệu lịch sử: Khi một trang phục đã có trong các đơn thuê trong quá khứ, KHÔNG cho phép xóa cứng (Hard Delete) khỏi database. Thay vào đó, thực hiện chuyển cờ `isActive: false` (Ẩn trang phục). Trang phục bị ẩn sẽ không hiển thị cho khách thuê mới nhưng vẫn hiển thị đúng trong lịch sử đơn cũ.
  4. Validate dữ liệu đầu vào: Giá thuê >= 0, Tiền cọc >= 0, Tên không được rỗng.
- **Trường hợp thành công**: Thêm trang phục "Waku Waku Anya Forger" thành công -> Trả về 201 Created.
- **Trường hợp thất bại**: Cố tình gửi lệnh xóa trang phục đã có đơn thuê -> Hệ thống chuyển thành ẩn (`isActive: false`) hoặc báo lỗi nếu yêu cầu xóa cứng vi phạm ràng buộc khóa ngoại.
- **API liên quan**: `POST /api/v1/admin/costumes`, `PUT /api/v1/admin/costumes/:id`, `PATCH /api/v1/admin/costumes/:id/toggle-active`
- **Màn hình liên quan**: Quản lý Trang phục Admin (`/admin/costumes`, `/admin/costumes/new`, `/admin/costumes/:id/edit`).
- **Kiểm thử liên quan**: `costumes.service.spec.ts`, `admin-costumes.e2e-spec.ts`.

---

### US15: Quản lý kích cỡ và số lượng tồn kho
- **Mô tả**: Là quản trị viên, tôi muốn quản lý kích cỡ và số lượng để kiểm soát tồn kho.
- **Vai trò**: ADMIN.
- **Tiêu chí chấp nhận**:
  1. Xem danh sách các biến thể kích cỡ của từng trang phục (Size, SKU, Tổng số lượng `totalQuantity`, Số lượng hỏng/bảo trì `outOfServiceQuantity`).
  2. Thêm biến thể kích cỡ mới (S, M, L, XL, XXL, FreeSize).
  3. Cập nhật số lượng tổng hoặc số lượng ngừng phục vụ.
  4. Quy tắc an toàn tồn kho (Crucial Rule): Chặn việc giảm số lượng tồn kho (`totalQuantity - outOfServiceQuantity`) xuống thấp hơn số lượng trang phục đã được cam kết cho các đơn đặt trước đang hoạt động (`PENDING`, `CONFIRMED`, `RENTING`) trong bất kỳ ngày nào trong tương lai.
- **Trường hợp thành công**: Tăng số lượng size L từ 2 lên 5 -> Trả về 200 OK.
- **Trường hợp thất bại**: Cố tình giảm số lượng size S từ 3 xuống 1 trong khi đang có 2 đơn đã xác nhận cần giao tuần tới -> Báo lỗi 400 Bad Request: "Không thể giảm tồn kho xuống dưới số lượng đã cam kết cho các đơn đặt trước (Yêu cầu tối thiểu: 2)".
- **API liên quan**: `POST /api/v1/admin/variants`, `PUT /api/v1/admin/variants/:id`, `PATCH /api/v1/admin/variants/:id/stock`
- **Màn hình liên quan**: Quản lý Tồn kho biến thể (`/admin/inventory`).
- **Kiểm thử liên quan**: `variants.service.spec.ts`, `inventory-safety.e2e-spec.ts`.

---

### US16: Xác nhận hoặc từ chối đơn thuê
- **Mô tả**: Là quản trị viên, tôi muốn xác nhận hoặc từ chối đơn thuê để xử lý yêu cầu khách hàng.
- **Vai trò**: ADMIN.
- **Tiêu chí chấp nhận**:
  1. Xem danh sách các đơn ở trạng thái `PENDING` cần duyệt gấp.
  2. Thao tác **Xác nhận (Confirm)**: Chuyển trạng thái đơn từ `PENDING` -> `CONFIRMED`. Đơn tiếp tục giữ chỗ trong kho. Ghi lịch sử "Quản trị viên xác nhận đơn".
  3. Thao tác **Từ chối (Reject)**: Chuyển trạng thái đơn từ `PENDING` -> `REJECTED`. Bắt buộc nhập lý do từ chối (ví dụ: "Đồ đang cần bảo dưỡng đột xuất", "Không liên hệ được khách").
  4. Khi đơn bị từ chối, giải phóng lịch giữ chỗ ngay lập tức để trang phục sẵn sàng cho khách khác.
  5. Chặn chuyển trạng thái sai quy trình (ví dụ: không thể Xác nhận một đơn đã bị hủy `CANCELLED`).
- **Trường hợp thành công**: Bấm Xác nhận đơn PENDING -> 200 OK, trạng thái chuyển `CONFIRMED`.
- **Trường hợp thất bại**: Cố tình Xác nhận một đơn đã bị từ chối hoặc đã hủy -> Báo lỗi 400: "Trạng thái đơn không hợp lệ để thực hiện thao tác này".
- **API liên quan**: `POST /api/v1/admin/rentals/:id/confirm`, `POST /api/v1/admin/rentals/:id/reject`
- **Màn hình liên quan**: Màn hình Quản lý đơn thuê Admin (`/admin/rentals`).
- **Kiểm thử liên quan**: `admin-rentals.service.spec.ts`, `rental-state-machine.spec.ts`.

---

### US17: Ghi nhận giao đồ cho khách tại cửa hàng
- **Mô tả**: Là quản trị viên, tôi muốn ghi nhận giao đồ để theo dõi trang phục đang cho thuê.
- **Vai trò**: ADMIN.
- **Tiêu chí chấp nhận**:
  1. Khi khách hàng tới cửa hàng nhận đồ vào ngày hẹn, quản trị viên kiểm tra mã đơn hoặc số điện thoại.
  2. Thu tiền thuê và tiền cọc trực tiếp tại quầy theo đúng bảng kê trong đơn.
  3. Quản trị viên bấm nút "Bàn giao trang phục" -> Chuyển trạng thái từ `CONFIRMED` -> `RENTING`.
  4. Ghi nhận thời điểm giao thực tế, nhân sự thực hiện thao tác và ghi chú kiểm tra tình trạng đồ lúc giao (ví dụ: "Đầy đủ phụ kiện kiếm, tóc giả chải mượt").
  5. Ghi một bản ghi mới vào `RentalStatusHistory`.
- **Trường hợp thành công**: Bấm Giao đồ cho đơn CONFIRMED -> Nhận 200 OK, trạng thái cập nhật `RENTING`.
- **Trường hợp thất bại**: Cố tình giao đồ cho đơn đang ở trạng thái `PENDING` chưa được duyệt -> Báo lỗi 400: "Đơn thuê phải được xác nhận trước khi bàn giao trang phục".
- **API liên quan**: `POST /api/v1/admin/rentals/:id/deliver`
- **Màn hình liên quan**: Chi tiết đơn thuê Admin (`/admin/rentals/:id`).
- **Kiểm thử liên quan**: `admin-rentals.service.spec.ts`, `rental-state-machine.spec.ts`.

---

### US18: Ghi nhận trả đồ và hoàn trả tiền cọc
- **Mô tả**: Là quản trị viên, tôi muốn ghi nhận trả đồ và tiền cọc để hoàn tất đơn thuê.
- **Vai trò**: ADMIN.
- **Tiêu chí chấp nhận**:
  1. Khách hàng mang đồ đến cửa hàng hoàn trả. Quản trị viên kiểm tra tình trạng trang phục và phụ kiện.
  2. Quản trị viên nhập thông tin kiểm tra đồ, số tiền cọc hoàn trả thực tế (nếu đồ nguyên vẹn thì hoàn 100% tiền cọc; nếu hư hại/mất phụ kiện thì ghi rõ số tiền phạt trừ vào tiền cọc).
  3. Bấm "Xác nhận nhận trả đồ" -> Chuyển trạng thái từ `RENTING` -> `RETURNED`.
  4. Khi chuyển sang `RETURNED`, hàng hóa được giải phóng khỏi trạng thái đang thuê, sẵn sàng phục vụ các lượt thuê tiếp theo từ ngày kế tiếp.
  5. Chống thao tác lặp lại (Idempotency): Trả đồ lặp lại hoặc bấm 2 lần liên tiếp không làm sai lệch tồn kho hoặc ghi nhận hoàn cọc 2 lần.
  6. Ghi nhận lịch sử chi tiết vào `RentalStatusHistory`.
- **Trường hợp thành công**: Đơn đang RENTING -> Ghi nhận trả đồ thành công, trạng thái `RETURNED`, ghi nhận hoàn trả 500.000 đ tiền cọc.
- **Trường hợp thất bại**: Cố tình bấm trả đồ cho một đơn đã ở trạng thái `RETURNED` -> Báo lỗi 400: "Đơn thuê này đã được ghi nhận trả đồ trước đó".
- **API liên quan**: `POST /api/v1/admin/rentals/:id/return`
- **Màn hình liên quan**: Chi tiết đơn thuê Admin (`/admin/rentals/:id`) có Modal Trả đồ & Hoàn cọc.
- **Kiểm thử liên quan**: `admin-rentals.service.spec.ts`, `rental-state-machine.spec.ts`.

---

### US19: Xem thống kê đơn thuê và trang phục đang thuê
- **Mô tả**: Là quản trị viên, tôi muốn xem thống kê đơn thuê và trang phục đang thuê để theo dõi hoạt động cửa hàng.
- **Vai trò**: ADMIN.
- **Tiêu chí chấp nhận**:
  1. Hiển thị các chỉ số tổng quan (KPI Cards):
     - Tổng doanh thu tiền thuê tích lũy (không tính tiền cọc).
     - Tổng số đơn thuê và phân bổ theo từng trạng thái (Pending, Confirmed, Renting, Returned, Cancelled, Rejected).
     - Số lượng trang phục hiện đang ở ngoài cửa hàng (đang được khách thuê - status `RENTING`).
     - Số đơn chờ xác nhận cần xử lý ngay.
     - Cảnh báo các đơn đang thuê bị quá hạn trả đồ (`RENTING` và `endDate < hôm nay`).
  2. Bảng danh sách trang phục được thuê nhiều nhất (Top Rented Costumes).
  3. Biểu đồ / bảng doanh thu và đơn hàng theo thời gian.
- **Trường hợp thành công**: Admin truy cập Dashboard -> Nhận 200 OK kèm payload thống kê chuẩn xác được tính toán trực tiếp từ PostgreSQL.
- **Trường hợp thất bại**: Khách hàng thông thường truy cập `/api/v1/admin/dashboard` -> Bị chặn 403 Forbidden.
- **API liên quan**: `GET /api/v1/admin/dashboard`
- **Màn hình liên quan**: Dashboard Quản trị (`/admin/dashboard`).
- **Kiểm thử liên quan**: `admin-dashboard.service.spec.ts`, `AdminDashboardPage.test.tsx`.

---

### US20: Xem lịch sử thay đổi trạng thái đơn
- **Mô tả**: Là quản trị viên, tôi muốn xem lịch sử thay đổi trạng thái đơn để kiểm tra quá trình xử lý.
- **Vai trò**: ADMIN (và Khách hàng đối với đơn của chính mình).
- **Tiêu chí chấp nhận**:
  1. Mọi sự thay đổi trạng thái đơn thuê (Tạo đơn, Xác nhận, Từ chối, Hủy, Giao đồ, Trả đồ) đều được lưu vết tự động trong bảng `rental_status_histories`.
  2. Bản ghi lịch sử bao gồm:
     - Trạng thái trước (`fromStatus`) và trạng thái sau (`toStatus`).
     - Thời điểm thay đổi (`createdAt`).
     - Người thực hiện thao tác (`changedBy`: Tên và Email của Customer hoặc Admin).
     - Ghi chú nghiệp vụ (`note`: ví dụ lý do từ chối, biên bản kiểm tra đồ lúc giao/trả).
  3. Dữ liệu lịch sử là bất biến (Append-only / Immutable), không cho phép bất kỳ ai sửa hoặc xóa các dòng lịch sử này.
- **Trường hợp thành công**: Xem chi tiết đơn -> Nhận danh sách mảng `statusHistory` được sắp xếp theo trình tự thời gian tăng dần.
- **Trường hợp thất bại**: Không có quyền truy cập đơn -> Trả về 403 Forbidden.
- **API liên quan**: `GET /api/v1/rentals/:id/history` hoặc tích hợp trong payload `GET /api/v1/rentals/:id`.
- **Màn hình liên quan**: Tab "Lịch sử xử lý đơn" trên Chi tiết đơn hàng (`/admin/rentals/:id` và `/my-rentals/:id`).
- **Kiểm thử liên quan**: `rental-history.service.spec.ts`, `rentals.e2e-spec.ts`.

---

## 3. Ma trận Truy xuất Nguồn gốc (Traceability Matrix: US -> API -> Màn hình -> Test File Thực tế)

| Mã US | Tóm tắt Chức năng | Vai trò | API Endpoint Thực tế | Giao diện Màn hình | Test File Thực tế đã Passed |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **US01** | Đăng ký tài khoản (bcrypt, chống trùng) | Guest | `POST /api/v1/auth/register` | `/register` | `test/user-stories.e2e-spec.ts (US01)` |
| **US02** | Đăng nhập tài khoản (JWT, Throttler) | All | `POST /api/v1/auth/login` | `/login` | `test/user-stories.e2e-spec.ts (US02)`, `LoginPage.test.tsx` |
| **US03** | Đăng xuất an toàn (thu hồi refresh session) | Cust/Admin | `POST /api/v1/auth/logout` | Header navbar | `test/user-stories.e2e-spec.ts (US03)` |
| **US04** | Xem & sửa hồ sơ (chống leo quyền, regex SĐT) | Cust/Admin | `GET/PUT /api/v1/users/me` | `/profile` | `test/user-stories.e2e-spec.ts (US04)` |
| **US05** | Xem danh sách trang phục đang hoạt động | All | `GET /api/v1/costumes` | `/costumes` | `test/user-stories.e2e-spec.ts (US05)`, `CostumeCard.test.tsx` |
| **US06** | Tìm kiếm & lọc (keyword, category, size, price) | All | `GET /api/v1/costumes` | `/costumes` (Sidebar) | `test/user-stories.e2e-spec.ts (US06)` |
| **US07** | Xem chi tiết trang phục, ảnh, mô tả, size | All | `GET /api/v1/costumes/:id` | `/costumes/:id` | `test/user-stories.e2e-spec.ts (US07)`, `e2e/user-flow.spec.ts` |
| **US08** | Kiểm tra lịch còn hàng theo ngày (min tồn kho) | All | `GET /api/v1/costumes/:id/availability`| `/costumes/:id` | `test/unit/availability.service.spec.ts`, `test/user-stories.e2e-spec.ts (US08)` |
| **US09** | Bảng tính tiền thuê và tiền cọc tách bạch | All | `POST /api/v1/rental-quotes` | `/costumes/:id`, `/checkout` | `test/unit/pricing.service.spec.ts`, `test/user-stories.e2e-spec.ts (US09)` |
| **US10** | Tạo đơn thuê (khóa bi quan, snapshot giá) | Customer | `POST /api/v1/rentals` | `/checkout` | `test/concurrency.e2e-spec.ts`, `test/user-stories.e2e-spec.ts (US10)` |
| **US11** | Xem lịch sử đơn thuê & phân trang | Customer | `GET /api/v1/rentals/my-rentals` | `/my-rentals`, `/my-rentals/:id` | `test/user-stories.e2e-spec.ts (US11)`, `StatusBadge.test.tsx` |
| **US12** | Hủy đơn chờ xác nhận & giải phóng lịch | Customer | `POST /api/v1/rentals/:id/cancel` | `/my-rentals/:id` | `test/unit/rental-state-machine.spec.ts`, `test/user-stories.e2e-spec.ts (US12)` |
| **US13** | Quản lý danh mục (thêm, sửa, đếm trang phục) | Admin | `GET/POST/PUT/DEL /api/v1/admin/categories` | `/admin/categories` | `test/user-stories.e2e-spec.ts (US13)` |
| **US14** | Thêm, sửa, ẩn trang phục (chặn name=null) | Admin | `POST/PUT /api/v1/admin/costumes`, `PATCH .../toggle-active` | `/admin/costumes` | `test/user-stories.e2e-spec.ts (US14)` |
| **US15** | Quản lý kích cỡ (+ Size) & an toàn tồn kho | Admin | `POST /api/v1/admin/variants`, `PATCH .../stock` | `/admin/costumes` (Modal Stock) | `test/unit/availability.service.spec.ts`, `test/user-stories.e2e-spec.ts (US15)` |
| **US16** | Duyệt đơn (CONFIRMED) hoặc Từ chối (REJECTED) | Admin | `POST /api/v1/admin/rentals/:id/confirm|reject`| `/admin/rentals` | `test/unit/rental-state-machine.spec.ts`, `test/user-stories.e2e-spec.ts (US16)` |
| **US17** | Ghi nhận bàn giao đồ tại cửa hàng (RENTING) | Admin | `POST /api/v1/admin/rentals/:id/deliver`| `/admin/rentals` (Modal Giao đồ) | `test/unit/rental-state-machine.spec.ts`, `test/user-stories.e2e-spec.ts (US17)` |
| **US18** | Nhận trả đồ & quyết toán cọc/phạt (RETURNED) | Admin | `POST /api/v1/admin/rentals/:id/return` | `/admin/rentals` (Modal Trả đồ) | `test/unit/rental-state-machine.spec.ts`, `test/user-stories.e2e-spec.ts (US18)` |
| **US19** | Thống kê Dashboard (doanh thu tách bạch cọc) | Admin | `GET /api/v1/admin/dashboard` | `/admin/dashboard` | `test/user-stories.e2e-spec.ts (US19)` |
| **US20** | Xem lịch sử thay đổi trạng thái (bất biến) | Admin/Cust | Tích hợp trong `GET /api/v1/rentals/:id` | Tab "Lịch sử xử lý đơn" | `test/user-stories.e2e-spec.ts (US20)` |
| **SEC01** | Bảo vệ RBAC (RolesGuard chặn Customer) | System | Toàn bộ các route `/api/v1/admin/*` | Giao diện Admin | `test/auth-rbac.e2e-spec.ts`, `test/user-stories.e2e-spec.ts (SEC01)` |
| **SEC02** | Bảo vệ IDOR (Chặn xem/hủy đơn của người khác) | System | `GET /api/v1/rentals/:id`, `POST .../cancel` | Giao diện Đơn hàng | `test/auth-rbac.e2e-spec.ts`, `test/user-stories.e2e-spec.ts (SEC02)` |

