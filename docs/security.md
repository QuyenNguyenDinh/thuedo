# Tài Liệu Thiết Kế An Toàn & Bảo Mật Hệ Thống (System Security Specification)
**Dự án: CosRent – Hệ Thống Cho Thuê Trang Phục & Đồ Cosplay**
*Mã tài liệu: DOC-SEC-01 | Phiên bản: 1.0.0*

---

## 1. Triết Lý & Nguyên Tắc Bảo Mật Cốt Lõi

1. **Bảo vệ tại tầng Máy chủ (Server-Side Enforcement)**:
   Mọi dữ liệu sau khi đã gửi về trình duyệt của người dùng đều có thể bị đọc, chỉnh sửa hoặc can thiệp thông qua Công cụ Lập trình viên (Developer Tools - F12) hoặc các công cụ bắt gói tin (Postman, Burp Suite). Do đó, bảo mật thực sự phải được thiết lập bằng cách **giới hạn quyền hạn và kiểm soát dữ liệu chặt chẽ tại máy chủ**, tuyệt đối không dựa vào các giải pháp hình thức như "ẩn API", "chặn click chuột phải" hay "mã hóa giả tạo ở phía frontend".

2. **Nguyên tắc Đặc quyền Tối thiểu (Principle of Least Privilege)**:
   Mỗi vai trò (`CUSTOMER`, `ADMIN`, Khách chưa đăng nhập) chỉ được cấp quyền truy cập chính xác vào các tài nguyên và hành động cần thiết để hoàn thành công việc.

3. **Phòng thủ Đa tầng (Defense in Depth)**:
   Áp dụng các lớp bảo vệ từ tầng Mạng (CORS, Rate Limiter, Helmet), tầng Điều khiển (DTO Validation, Authentication Guard, Roles Guard), tầng Nghiệp vụ (Kiểm tra quyền sở hữu IDOR, kiểm tra chuyển trạng thái State Machine) đến tầng Cơ sở Dữ liệu (Khóa hàng bi quan, Ràng buộc toàn vẹn, Parameterized Queries).

---

## 2. Ghi Chú Đặc Biệt Về Thuật Ngữ "XORs" Trong Đề Bài

> [!WARNING] Ghi chú xác minh thuật ngữ kỹ thuật
> Trong đề bài gốc của bài tập lớn có xuất hiện cụm từ **"XORs"**.
> - **Đánh dấu**: Đây là thuật ngữ chưa rõ nghĩa và không nằm trong danh mục các lỗ hổng bảo mật web tiêu chuẩn của OWASP (như XSS, CSRF, SSRF, SQLi). Có khả năng đây là lỗi chính tả (typo) khi soạn thảo đề thi (ví dụ: gõ nhầm từ XSS, CORS hoặc CSRF).
> - **Thái độ kỹ thuật nghiêm túc**: Nhóm thực hiện **đánh dấu rõ ràng mục này cần đối chiếu và xác minh lại trực tiếp với giảng viên phụ trách môn học**; tuyệt đối **không tự ý khẳng định** "XORs" là XSS hay CSRF.
> - **Biện pháp triển khai**: Nhóm vẫn chủ động nghiên cứu và triển khai đầy đủ cả 2 tiêu chuẩn phòng thủ bảo mật chuẩn mực gồm: Chống tấn công XSS (Cross-Site Scripting) và Chống tấn công CSRF (Cross-Site Request Forgery) / CORS.

---

## 3. Các Biện Pháp Bảo Mật Đã Triển Khai Chi Tiết

### 3.1. Quản lý Mật khẩu & Mã hóa Một Chiều
- Sử dụng thuật toán băm mật khẩu tiêu chuẩn công nghiệp: **bcrypt** với số vòng băm `SALT_ROUNDS = 10` (hoặc Argon2id).
- Mật khẩu gốc không bao giờ được lưu trữ hay ghi log.
- Cột `passwordHash` được cấu hình `select: false` trong Entity TypeORM để tránh việc vô tình trả về thông tin mật khẩu khi dùng `find()` hoặc `createQueryBuilder()`.

### 3.2. Chiến Lược Token & Chống Đánh Cắp Phiên Làm Việc
- **Access Token (15 phút)**:
  - Chứa thông tin tối thiểu: `{ sub: userId, email, role }`.
  - Được giữ trong bộ nhớ JavaScript phía client (`in-memory` AuthContext). Tuyệt đối **không lưu vào `localStorage`** để triệt tiêu nguy cơ bị đánh cắp qua lỗ hổng XSS.
- **Refresh Token (7 ngày) & Cơ chế Xoay vòng (Rotation)**:
  - Refresh Token được truyền tải duy nhất qua Cookie với các thuộc tính:
    `HttpOnly; Secure (trong môi trường Production); SameSite=Lax; Path=/api/v1/auth`
  - Thuộc tính `HttpOnly` ngăn chặn hoàn toàn việc mã độc JavaScript trên trình duyệt đọc được token.
  - Phía máy chủ lưu trữ chuỗi hash SHA-256 của Refresh Token trong bảng `refresh_sessions`.
  - Mỗi khi client gọi `/api/v1/auth/refresh`, máy chủ kiểm tra tính hợp lệ của token trong DB, thu hồi token cũ (`isRevoked = true`) và cấp phát một cặp token mới. Nếu phát hiện token đã bị thu hồi trước đó được gửi lên (dấu hiệu của tấn công Replay Attack), hệ thống sẽ lập tức thu hồi toàn bộ các phiên của tài khoản đó.
- **Đăng xuất an toàn**:
  - Endpoint `/api/v1/auth/logout` đánh dấu thu hồi phiên trong database và ghi đè cookie trình duyệt với `Max-Age=0`.

### 3.3. Phân Quyền & Chống Tấn Công IDOR (Insecure Direct Object References)
- **Kiểm soát vai trò (RBAC)**: Tách biệt hoàn toàn giữa `CUSTOMER` và `ADMIN` thông qua `@UseGuards(JwtAuthGuard, RolesGuard)` và decorator `@Roles(...)`. Mọi yêu cầu trái quyền bị chặn ngay tại tầng Guard với mã lỗi `403 Forbidden`.
- **Chống IDOR khi tra cứu và hủy đơn thuê**:
  - Khi khách hàng truy cập `GET /api/v1/rentals/:id` hoặc `POST /api/v1/rentals/:id/cancel`:
  - Hệ thống kiểm tra: Nếu người dùng không phải là `ADMIN` và `order.userId !== req.user.id`, yêu cầu sẽ bị từ chối ngay lập tức với lỗi `403 Forbidden: "Bạn không có quyền thao tác trên đơn hàng này"`.

### 3.4. Chống Tấn Công SQL Injection
- 100% các câu truy vấn cơ sở dữ liệu đều được thực thi thông qua TypeORM Repositories hoặc TypeORM QueryBuilder có tham số hóa (`parameterized queries`).
- Các trường lọc và sắp xếp (`sortBy`) từ phía client đều được định nghĩa chặt chẽ bằng Enum (`createdAt_desc`, `price_asc`, `price_desc`), loại bỏ mọi khả năng chèn mã SQL vào mệnh đề `ORDER BY`.

### 3.5. Chống Tấn Công XSS (Cross-Site Scripting)
- Toàn bộ nội dung mô tả trang phục và thông tin người dùng được React tự động escape HTML khi render vào DOM. Không sử dụng hàm nguy hiểm `dangerouslySetInnerHTML`.
- Sử dụng thư viện `helmet` tại file khởi chạy `main.ts` của NestJS để áp dụng các tiêu đề HTTP an toàn:
  - `Content-Security-Policy`: Giới hạn nguồn tải script, style và font.
  - `X-Content-Type-Options: nosniff`: Ngăn chặn MIME-sniffing.
  - `X-Frame-Options: SAMEORIGIN`: Ngăn chặn Clickjacking.

### 3.6. Chống Tấn Công CSRF (Cross-Site Request Forgery)
- Cookie `refreshToken` được thiết lập `SameSite=Lax`, ngăn chặn việc gửi cookie tự động trong các yêu cầu cross-origin ngầm (như thẻ `<img>` hoặc `<form action=...>`).
- Các thao tác thay đổi trạng thái (Tạo đơn, Hủy đơn, Xác nhận, Giao đồ, Trả đồ) đều được bảo vệ bởi tiêu đề `Authorization: Bearer <access_token>` mà trang web độc hại của bên thứ ba không thể tự động đính kèm.

### 3.7. Cấu Hình CORS Minh Bạch & Chặn Wildcard
- Sử dụng danh sách nguồn cho phép (Allowlist) được đọc từ biến môi trường `CORS_ORIGIN` (mặc định phát triển: `http://localhost:5173`).
- Bật cờ `credentials: true`. Tuyệt đối không bao giờ sử dụng ký tự đại diện `origin: "*"` khi `credentials: true` (vi phạm tiêu chuẩn W3C và bị trình duyệt chặn).

### 3.8. Kiểm Soát Đầu Vào & Giới Hạn Tần Suất (Validation & Rate Limiting)
- Sử dụng NestJS `ValidationPipe` toàn cục với cấu hình:
  ```typescript
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,              // Tự động loại bỏ các trường không định nghĩa trong DTO
    forbidNonWhitelisted: true,  // Báo lỗi 400 nếu phát hiện trường lạ
    transform: true,              // Tự động chuyển đổi kiểu dữ liệu (string -> number, Date,...)
  }));
  ```
- Áp dụng `@nestjs/throttler` (Rate Limiting):
  - Giới hạn chung toàn ứng dụng: Tối đa 100 requests / phút / IP.
  - Giới hạn nghiêm ngặt cho Endpoint Đăng nhập `/api/v1/auth/login`: Tối đa 5 requests / phút / IP nhằm ngăn chặn tấn công dò mật khẩu (Brute-force).

### 3.9. Xử Lý Lỗi An Toàn & Bảo Mật Nhật Ký (Logging Hygiene)
- Bộ lọc lỗi toàn cục (`GlobalHttpExceptionFilter`) chuẩn hóa thông điệp lỗi: Trong môi trường sản xuất (`NODE_ENV=production`), tuyệt đối không gửi chi tiết lỗi cơ sở dữ liệu hoặc stack trace về client.
- Lỗi đăng nhập được thông báo đồng nhất: *"Email hoặc mật khẩu không chính xác"* để không tiết lộ cho kẻ tấn công biết email đó đã đăng ký tài khoản hay chưa.
- Tuyệt đối không ghi mật khẩu gốc, access token, refresh token hay số CCCD vào file log hệ thống.

