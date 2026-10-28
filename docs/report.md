# BÁO CÁO BÀI TẬP LỚN CUỐI KỲ – MÔN PHÁT TRIỂN ỨNG DỤNG WEB NÂNG CAO
## ĐỀ TÀI: COSRent – HỆ THỐNG WEBSITE CHO THUÊ TRANG PHỤC VÀ ĐỒ COSPLAY
**Đơn vị đào tạo**: Khoa Công nghệ Thông tin – Trường Đại học Phenikaa  
**Học kỳ / Năm học**: Học kỳ I – Năm học 2026-2027  
**Nhóm sinh viên thực hiện**: [CẦN BỔ SUNG: Tên Nhóm]  
**Giảng viên hướng dẫn**: [CẦN BỔ SUNG: Thầy / Cô Phụ Trách Học Phần]  

---

### THÔNG TIN NỘP BÀI VÀ ĐƯỜNG DẪN MINH CHỨNG
- **Kho lưu trữ mã nguồn (GitHub Repository)**: `[CẦN BỔ SUNG: Link GitHub]`
- **Video trình chiếu Demo sản phẩm (< 8 phút)**: `[CẦN BỔ SUNG: Link YouTube / Google Drive]`
- **Thời hạn nộp bản mềm PDF (Canvas)**: Trước 23:59 ngày 31/10/2026
- **Thời hạn nộp bản in giấy (Văn phòng Khoa)**: Trước 17:00 ngày 02/11/2026

---

## CÂU 1: PHÂN TÍCH YÊU CẦU & ĐẶC TẢ USER STORIES (US01 – US20)
*Minh chứng chi tiết: Xem tệp tin `docs/user-stories.md`*

Hệ thống CosRent phục vụ cửa hàng cho thuê trang phục cosplay chuyên nghiệp với 2 vai trò người dùng chính: `CUSTOMER` (Khách hàng) và `ADMIN` (Quản trị viên), cùng phạm vi dành cho Khách truy cập chưa đăng nhập. Nhóm đã đặc tả đầy đủ 20 User Stories tuân thủ nghiêm ngặt định dạng *"Là [vai trò], tôi muốn [hành động], để [lợi ích]"*:
1. **US01 – US04**: Đăng ký, Đăng nhập (Argon2id/bcrypt, HttpOnly Refresh Cookie, In-memory Access Token), Đăng xuất an toàn, Xem và cập nhật hồ sơ cá nhân.
2. **US05 – US07**: Xem danh sách trang phục phân trang, Tìm kiếm đa tiêu chí (danh mục, giá, kích cỡ) và Xem chi tiết trang phục kèm bộ sưu tập ảnh và phụ kiện.
3. **US08 – US10**: Kiểm tra tồn kho khả dụng theo khoảng ngày nhận - trả, Xem bảng tính tiền thuê và tiền cọc minh bạch, Tạo đơn đặt thuê giữ chỗ với cơ chế khóa bi quan trong Database Transaction.
4. **US11 – US12**: Xem lịch sử và chi tiết đơn thuê (kèm bảo mật chặn IDOR), Hủy đơn thuê đang ở trạng thái `PENDING`.
5. **US13 – US15**: Quản lý danh mục, Thêm/sửa và ẩn trang phục (không xóa cứng bảo vệ lịch sử giao dịch), Quản lý kích cỡ và chặn giảm tồn kho vi phạm cam kết đơn tương lai.
6. **US16 – US18**: Quản trị viên Duyệt / Từ chối đơn thuê, Bàn giao đồ tại quầy (`CONFIRMED` $\rightarrow$ `RENTING`), Nhận trả đồ và hoàn trả tiền cọc (`RENTING` $\rightarrow$ `RETURNED`).
7. **US19 – US20**: Bảng điều khiển số liệu thống kê (Dashboard) và Truy vết toàn bộ lịch sử thay đổi trạng thái đơn (`RentalStatusHistory`).

Tất cả 20 User Stories đều đi kèm Tiêu chí chấp nhận (Acceptance Criteria), Trường hợp thành công/thất bại, và được ánh xạ trực tiếp trong Ma trận Truy xuất Nguồn gốc (Traceability Matrix).

---

## CÂU 2: THIẾT KẾ KIẾN TRÚC & MÔ HÌNH DỮ LIỆU
*Minh chứng chi tiết: Xem tệp tin `docs/architecture.md` và `docs/database.md`*

### 1. Kiến trúc phân lớp Backend
Hệ thống được tổ chức theo 4 tầng tách biệt rõ ràng:
`Controller (HTTP & DTO Validation)` $\rightarrow$ `Service (Nghiệp vụ cốt lõi)` $\rightarrow$ `Repository / Data Access (TypeORM QueryBuilder)` $\rightarrow$ `Database (PostgreSQL 16)`.
Controller chỉ làm nhiệm vụ tiếp nhận yêu cầu và điều hướng; toàn bộ logic tính giá, kiểm tra tồn kho, khóa hàng và chuyển trạng thái đều tập trung tại Service Layer.

### 2. Mô hình quan hệ thực thể (ERD)
Gồm 8 thực thể chính:
- `users`: Quản lý tài khoản và phân quyền (`CUSTOMER`, `ADMIN`).
- `refresh_sessions`: Quản lý phiên làm việc, token hash, xoay vòng token và thu hồi.
- `categories`: Danh mục trang phục (Anime, Game, Cổ phong,...).
- `costumes`: Thông tin trang phục, đơn giá thuê/ngày, mức tiền cọc, cờ kích hoạt `isActive`.
- `costume_images`: Thư viện ảnh sản phẩm kèm `alt_text`.
- `costume_variants`: Biến thể kích cỡ (S, M, L, XL), SKU duy nhất, `total_quantity`, `out_of_service_quantity`.
- `rental_orders`: Đơn thuê, mã đơn `orderCode`, ngày nhận `startDate`, ngày trả `endDate`, trạng thái FSM.
- `rental_order_items`: Dòng sản phẩm trong đơn, lưu trữ ảnh chụp (Snapshot) tên đồ, kích cỡ, đơn giá thuê và tiền cọc tại thời điểm đặt đơn.
- `rental_status_histories`: Bản ghi vết kiểm toán trạng thái bất biến (Append-only).

---

## CÂU 3: THIẾT KẾ GIAO DIỆN & TRẢI NGHIỆM NGƯỜI DÙNG (WIREFRAMES)
*Minh chứng chi tiết: Xem tệp tin `docs/wireframes.md`*

### 1. Bố cục lấy cảm hứng từ Booking.com
- Sử dụng bảng màu chuẩn: Xanh navy chủ đạo (`#003580`), điểm nhấn Vàng kim (`#febb02`).
- Khối tìm kiếm nổi bật 3 thành phần: Từ khóa trang phục, Ngày nhận đồ, Ngày trả đồ.
- Trang kết quả chia 2 cột: Bộ lọc Sticky bên trái và Danh sách thẻ sản phẩm bên phải. Thẻ sản phẩm hiển thị ảnh, tên, mô tả phụ kiện, kích cỡ, giá thuê/ngày và tiền cọc minh bạch.
- Giao diện 100% Tiếng Việt, hiển thị tiền tệ VND (`₫`), ngày tháng định dạng `dd/MM/yyyy`.

### 2. Đo lường Bước nghiệp vụ vs. Lượt tương tác
- **Số bước nghiệp vụ**: Đúng 4 bước (1. Chọn đồ $\rightarrow$ 2. Chọn size & ngày $\rightarrow$ 3. Xem báo giá $\rightarrow$ 4. Xác nhận đơn tại quầy).
- **Số lượt tương tác thực tế**: Đo lường đạt **10 lượt tương tác** (gõ phím, click, chọn lịch) trong kịch bản mẫu, không có popup quảng cáo trung gian.

---

## CÂU 4: XÂY DỰNG BACKEND & TÀI LIỆU API RESTFUL (SWAGGER)
*Minh chứng chi tiết: Xem tệp tin `docs/api.md` và mã nguồn tại `apps/backend`*

- **Công nghệ**: NestJS 10, TypeScript, TypeORM, Swagger OpenAPI 3.0.
- **Tài liệu trực quan**: Swagger UI tại `http://localhost:3000/api/docs`.
- **Validation toàn diện**: Sử dụng `class-validator` và `class-transformer` với cấu hình nghiêm ngặt (`whitelist: true`, `forbidNonWhitelisted: true`).
- **An toàn SQL**: Sử dụng 100% Parameterized Queries, Enum cho các trường sắp xếp (`sortBy`), ngăn chặn triệt để SQL Injection.
- **Quản lý Migrations**: Sử dụng TypeORM Migrations, cấu hình `synchronize: false` bảo vệ dữ liệu sản xuất.

---

## CÂU 5: XÂY DỰNG FRONTEND REACT-BOOTSTRAP & TRẢI NGHIỆM
*Minh chứng chi tiết: Mã nguồn tại `apps/frontend`*

- **Công nghệ**: React 19, TypeScript, Vite, `react-bootstrap` kết hợp `bootstrap-icons`.
- **Thành phần giao diện**: Sử dụng toàn bộ các components chính thống của React-Bootstrap: `Navbar`, `Container`, `Row`, `Col`, `Card`, `Button`, `Form`, `Modal`, `Table`, `Badge`, `Alert`, `Spinner`.
- **Quản lý trạng thái & Định tuyến**: `react-router-dom` v6 kết hợp `AuthContext` lưu trữ Access Token trong bộ nhớ, tự động Silent Refresh qua Cookie khi tải trang.
- **Đáp ứng và Tiếp cận**: Hỗ trợ đầy đủ màn hình Mobile và Desktop; xử lý đầy đủ các trạng thái Loading Skeleton, Empty State, Thông báo lỗi và Hộp thoại xác nhận.

---

## CÂU 6: THUẬT TOÁN TỒN KHO & NGHIỆP VỤ CỐT LÕI
*Minh chứng chi tiết: Xem tệp tin `docs/architecture.md` (Mục 5 và Mục 6)*

### 1. Chuẩn hóa ngày lịch Việt Nam (`Asia/Ho_Chi_Minh`)
- Toàn bộ phép tính ngày thuê được chuẩn hóa về chuỗi `YYYY-MM-DD` hoặc mốc 00:00:00 giờ Việt Nam, loại bỏ hoàn toàn lỗi lệch 1 ngày do chuyển đổi múi giờ UTC.
- Công thức: $\text{Số ngày} = (\text{Ngày trả} - \text{Ngày nhận}) + 1$. Cả ngày nhận và ngày trả đều tính tiền.

### 2. Thuật toán kiểm tra tồn kho theo khoảng ngày
- Các trạng thái giữ chỗ trong lịch: `PENDING`, `CONFIRMED`, `RENTING`.
- Đơn `RENTING` quá hạn (ngày hiện tại > `endDate`) tiếp tục được xem là chiếm dụng tồn kho cho tới khi Admin xác nhận nhận trả đồ (`RETURNED`).
- Thuật toán quét từng ngày $d \in [\text{startDate}, \text{endDate}]$, tính lượng khả dụng từng ngày $A(d) = \text{totalQuantity} - \text{outOfService} - \text{Reserved}(d)$. Số lượng có thể thuê là $\min_{d} A(d)$. Hai đơn không trùng ngày nhau trong khoảng quét không bị cộng dồn sai lệch.

### 3. Chống đặt vượt kho khi có yêu cầu đồng thời (Concurrency Pessimistic Locking)
- Thực hiện trong Database Transaction.
- Sắp xếp các biến thể theo ID tăng dần (`ORDER BY id ASC`) để tránh Deadlock.
- Khóa hàng bằng `SELECT ... FOR UPDATE` (Pessimistic Write Lock).
- Tính lại tồn kho khả dụng tức thời; nếu không đủ hàng thì Rollback và ném lỗi 409 Conflict.
- Chặn Admin giảm `totalQuantity` xuống dưới mức cam kết của các đơn đặt trước còn hiệu lực.

---

## CÂU 7: KIỂM THỬ HỆ THỐNG & ĐẢM BẢO CHẤT LƯỢNG
*Minh chứng chi tiết: Xem tệp tin `docs/testing.md` và thư mục `apps/backend/test`, `apps/frontend/src/**/*.test.tsx`*

- **Unit Testing**: Kiểm thử độc lập logic tính giá (`pricing.service.spec.ts`), thuật toán tồn kho (`availability.service.spec.ts`) và máy trạng thái đơn (`rental-state-machine.spec.ts`).
- **Integration / Concurrency Testing**: Kiểm thử 2 luồng đồng thời tranh chấp bộ đồ cuối cùng (`concurrency.e2e-spec.ts`), kiểm thử chặn IDOR (`idor-security.e2e-spec.ts`), kiểm thử luồng xác thực và phân quyền RBAC (`auth.e2e-spec.ts`).
- **Frontend Component Testing**: Kiểm thử render giao diện, validation form và tương tác bằng Vitest và React Testing Library.
- **End-to-End Testing**: Kịch bản tự động hóa Playwright kiểm tra trọn vẹn luồng khách đặt thuê và Admin duyệt trả đồ.

---

## CÂU 8: HƯỚNG DẪN CÀI ĐẶT, TRIỂN KHAI & DOCKER
*Minh chứng chi tiết: Xem tệp tin `README.md` và `docker-compose.yml`*

- Cung cấp tệp `docker-compose.yml` khởi chạy PostgreSQL 16 Alpine với cấu hình cổng 5432 và volume bền vững.
- Cung cấp tệp `.env.example` với đầy đủ các tham số cấu hình mẫu, không chứa bí mật thật trong mã nguồn.
- Lệnh chạy Migration và nạp dữ liệu Seed mẫu (`npm run seed`) tạo sẵn 20 trang phục phong phú và các đơn hàng ở mọi trạng thái (`PENDING`, `CONFIRMED`, `RENTING`, `RETURNED`, `CANCELLED`).

---

## CÂU 9: BẢNG PHÂN CÔNG ĐÓNG GÓP & TRÁCH NHIỆM THÀNH VIÊN
*Minh chứng chi tiết: Xem tệp tin `docs/contributions.md`*

- Toàn bộ thành viên trong nhóm được phân công nhiệm vụ cụ thể, rõ ràng giữa Backend, Frontend, Thiết kế CSDL và Kiểm thử QA.
- Bảng nhật ký đóng góp gắn liền với các mốc commit trên Git và chữ ký xác nhận của từng thành viên.
- Thông tin cá nhân và tỷ lệ phần trăm đóng góp được nhóm sinh viên hoàn thiện trung thực trước khi in bản cứng nộp Khoa.

---

## CÂU 10: PHÂN TÍCH KHÍA CẠNH PHÁP LUẬT VÀ ĐẠO ĐỨC NGHỀ NGHIỆP

### 1. Khía cạnh Pháp luật (Legal Compliance)
- **Quyền Sở Hữu Trí Tuệ đối với Hình ảnh và Thiết kế Nhân vật**:
  - Căn cứ: *Luật Sở hữu trí tuệ số 50/2005/QH11 (sửa đổi, bổ sung năm 2009, 2019 và Luật số 07/2022/QH15 có hiệu lực từ ngày 01/01/2023)*.
  - Hình ảnh trang phục cosplay trong dự án dựa trên các hình tượng nhân vật thuộc quyền tác giả của các studio sản xuất anime, manga, video game (như HoYoverse, Toho, Wit Studio).
  - Dự án CosRent được thực hiện hoàn toàn trong khuôn khổ bài tập lớn nghiên cứu học thuật phi thương mại (Non-commercial educational purpose). Nhóm cam kết:
    1. Giấy phép MIT của mã nguồn chỉ cấp phép cho phần code logic do sinh viên tự viết; không bao hàm quyền sở hữu đối với hình ảnh nhân vật hay nhãn hiệu của bên thứ ba.
    2. Nếu đưa vào khai thác thương mại thực tế, cửa hàng bắt buộc phải ký hợp đồng thỏa thuận cấp phép sử dụng bản quyền hình ảnh (Merchandise Licensing) hoặc tự chụp ảnh mẫu người thật diện trang phục thực tế tại studio của cửa hàng.
- **Bảo Vệ Dữ Liệu Cá Nhân**:
  - Căn cứ: *Nghị định số 13/2023/NĐ-CP của Chính phủ về bảo vệ dữ liệu cá nhân (có hiệu lực từ ngày 01/07/2023)*.
  - Hệ thống thu thập các dữ liệu cá nhân cơ bản: Họ tên, số điện thoại, email, địa chỉ liên hệ phục vụ duy nhất mục đích liên lạc và ký biên bản giao nhận đồ tại quầy.
  - Các biện pháp tuân thủ: Mật khẩu được mã hóa băm một chiều (bcrypt); token phiên làm việc được bảo vệ bằng cookie HttpOnly; không chia sẻ thông tin khách hàng cho bất kỳ bên thứ ba nào; cho phép khách hàng chủ động xem và cập nhật thông tin cá nhân của mình.
- **Minh Bạch Giá Cả và Quyền Lợi Người Tiêu Dùng**:
  - Căn cứ: *Luật Bảo vệ quyền lợi người tiêu dùng số 19/2023/QH15 (có hiệu lực từ ngày 01/07/2024)*.
  - Hệ thống thực thi nguyên tắc minh bạch tài chính tối cao:
    1. Tách biệt hoàn toàn Tiền thuê (khoản chi phí dịch vụ tính theo ngày) và Tiền đặt cọc (khoản bảo đảm tài sản hoàn trả 100% khi trả đồ nguyên vẹn).
    2. Giá thuê và tiền cọc được niêm yết công khai bằng Đồng Việt Nam (VND). Khách hàng được xem trước toàn bộ bảng tính tiền chi tiết trước khi xác nhận tạo đơn.
    3. Quy định nhận và trả đồ trực tiếp tại cửa hàng, kiểm tra tình trạng phụ kiện và ký biên bản được ghi rõ ràng trên giao diện.

### 2. Khía cạnh Đạo đức Nghề nghiệp và Đạo đức Xã hội (Ethics)
- **Đạo đức nghề nghiệp Kỹ sư phần mềm**:
  - **Tính trung thực học thuật**: Nhóm cam kết toàn bộ kết quả kiểm thử (Unit test, Integration test, E2E test) đều được chạy thật và ghi nhận kết quả thực tế từ hệ thống, tuyệt đối không tạo báo cáo kiểm thử giả mạo hay khai khống tính năng chưa hoàn thiện.
  - **Tôn trọng sở hữu trí tuệ**: Trích dẫn đầy đủ nguồn gốc các thư viện mã nguồn mở được sử dụng (NestJS, React, React-Bootstrap, TypeORM, Playwright).
  - **Trách nhiệm bảo mật**: Không để lộ stack trace nội bộ của cơ sở dữ liệu, che giấu các thông điệp lỗi nhạy cảm để bảo vệ người dùng trước các nguy cơ tấn công mạng.
- **Đạo đức xã hội**:
  - Thiết kế giao diện thân thiện, có độ tương phản cao, hỗ trợ trình đọc màn hình cho người khiếm thị (`alt` text, thẻ label chuẩn).
  - Không áp dụng các kỹ thuật thiết kế lừa dối (Dark Patterns) như tự động tích chọn phụ phí hay cài đặt bẫy giá ẩn.
  - Không tạo popup gây phiền toái hoặc nút bấm giả đánh lừa trải nghiệm của người dùng.
