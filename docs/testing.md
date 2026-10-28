# Kế Hoạch & Báo Cáo Kiểm Thử Hệ Thống (Software Testing Specification)
**Dự án: CosRent – Hệ Thống Cho Thuê Trang Phục & Đồ Cosplay**
*Mã tài liệu: DOC-TEST-01 | Phiên bản: 1.0.0*

---

## 1. Chiến Lược Kiểm Thử (Testing Strategy)

Hệ thống CosRent áp dụng chiến lược kiểm thử hình kim tự tháp (Testing Pyramid), đảm bảo chất lượng từ đơn vị mã nguồn nhỏ nhất đến toàn bộ luồng trải nghiệm người dùng thực tế:

1. **Unit Testing (Kiểm thử đơn vị - Jest & Vitest)**:
   - Backend: Kiểm thử độc lập logic nghiệp vụ các Service (Tính giá, thuật toán tồn kho, máy trạng thái đơn hàng). Mọi dependency được giả lập (Mocking) hoàn toàn.
   - Frontend: Kiểm thử các React component hiển thị trạng thái (Loading, Empty, Error, Validation).
2. **Integration / API Testing (Kiểm thử tích hợp - Supertest & TypeORM)**:
   - Kiểm thử toàn diện các luồng API: Từ tầng Controller xuyên qua Service đến Cơ sở dữ liệu thật/in-memory PostgreSQL.
   - Kiểm tra các ràng buộc: Giao dịch Transaction, cơ chế khóa hàng bi quan (Pessimistic Locking), tấn công đồng thời (Concurrency Race Condition), chặn IDOR và phân quyền RBAC.
3. **End-to-End User Flow Testing (Kiểm thử đầu-cuối - Playwright)**:
   - Tự động hóa trình duyệt mô phỏng luồng khách hàng: Tìm kiếm đồ $\rightarrow$ xem chi tiết $\rightarrow$ đặt đơn $\rightarrow$ kiểm tra đơn của tôi.
   - Mô phỏng luồng Admin: Đăng nhập $\rightarrow$ xem Dashboard $\rightarrow$ duyệt đơn $\rightarrow$ giao đồ $\rightarrow$ nhận trả đồ.

---

## 2. Hướng Dẫn Thực Thi Kiểm Thử (Execution Guide)

### 2.1. Chạy Kiểm Thử Backend
```bash
# Di chuyển vào thư mục backend
cd apps/backend

# Chạy toàn bộ Unit Tests
npm run test

# Chạy kiểm thử có đo độ bao phủ mã nguồn (Coverage)
npm run test:cov

# Chạy Kiểm thử tích hợp & API (Integration & E2E)
npm run test:e2e
```

### 2.2. Chạy Kiểm Thử Frontend
```bash
# Di chuyển vào thư mục frontend
cd apps/frontend

# Chạy kiểm thử Component với Vitest
npm run test

# Chạy kiểm thử chế độ UI trực quan
npm run test:ui
```

### 2.3. Chạy Kiểm Thử Luồng Người Dùng (Playwright E2E)
```bash
# Từ thư mục gốc dự án
npx playwright test
```

---

## 3. Danh Mục Các Ca Kiểm Thử Quan Trọng (Critical Test Cases)

| Mã Ca Test | Phân Loại | Kịch Bản & Dữ Liệu Kiểm Thử | Kết Quả Kỳ Vọng |
| :--- | :--- | :--- | :--- |
| **TC-AUTH-01** | Unit/API | Đăng ký với thông tin hợp lệ | Trả về 201 Created, mật khẩu được băm an toàn, vai trò mặc định CUSTOMER |
| **TC-AUTH-02** | Unit/API | Đăng ký với email đã tồn tại trong DB | Trả về 409 Conflict: "Email này đã được đăng ký tài khoản" |
| **TC-AUTH-03** | Unit/API | Đăng ký với mật khẩu ngắn (< 8 ký tự) | Trả về 400 Bad Request bởi ValidationPipe |
| **TC-AUTH-04** | Unit/API | Đăng nhập đúng email & mật khẩu | Trả về 200 OK, payload chứa Access Token, header có Set-Cookie HttpOnly |
| **TC-AUTH-05** | Unit/API | Đăng nhập sai mật khẩu | Trả về 401: "Email hoặc mật khẩu không chính xác" (thông điệp đồng nhất) |
| **TC-AUTH-06** | Unit/API | Gửi yêu cầu refresh với cookie hợp lệ | Trả về 200 OK, Access Token mới và Refresh Token mới (Rotation) |
| **TC-AUTH-07** | Unit/API | Đăng xuất người dùng | Trả về 200 OK, phiên trong DB bị thu hồi, Cookie Max-Age=0 |
| **TC-RBAC-01** | Security | Khách vãng lai gọi `POST /api/v1/admin/costumes` | Bị chặn 401 Unauthorized do thiếu Bearer Token |
| **TC-RBAC-02** | Security | Khách hàng (CUSTOMER) gọi API Admin | Bị chặn 403 Forbidden bởi RolesGuard |
| **TC-IDOR-01** | Security | Khách A xem đơn hàng của Khách B (`GET /api/v1/rentals/:idB`) | Bị chặn 403 Forbidden: "Bạn không có quyền truy cập đơn thuê này" |
| **TC-IDOR-02** | Security | Khách A gửi yêu cầu hủy đơn của Khách B | Bị chặn 403 Forbidden |
| **TC-DATE-01** | Business | Chọn ngày nhận đồ trong quá khứ | Trả về 400 Bad Request: "Ngày nhận đồ không được ở trong quá khứ" |
| **TC-DATE-02** | Business | Chọn ngày trả trước ngày nhận (10/11 -> 08/11) | Trả về 400 Bad Request: "Ngày trả đồ không được trước ngày nhận đồ" |
| **TC-DATE-03** | Business | Thuê cùng ngày (10/11 -> 10/11) | Số ngày thuê = 1 ngày, tính tiền chuẩn xác 1 ngày |
| **TC-PRICE-01**| Business | Tính tiền thuê: 3 ngày, giá 200.000, số lượng 2 | Tiền thuê = 200.000 * 3 * 2 = 1.200.000 VND |
| **TC-PRICE-02**| Business | Tiền cọc: cọc 500.000/bộ, số lượng 2 | Tiền cọc = 1.000.000 VND (độc lập với số ngày thuê) |
| **TC-PRICE-03**| Business | Client giả mạo tổng tiền trong body gửi lên | Backend tự tính lại từ DB, không dùng tiền của client |
| **TC-CONCUR-01**| Concurrency | 2 khách hàng đồng thời đặt bộ đồ cuối cùng | 1 yêu cầu thành công (201), 1 yêu cầu nhận 409 Conflict (Không vượt tồn kho) |
| **TC-AVAIL-01**| Business | Đơn A thuê (01-03/11), Đơn B thuê (05-07/11). Khách C tìm (01-07/11) | Tồn kho khả dụng không bị cộng dồn sai lệch giữa 2 khoảng không trùng |
| **TC-AVAIL-02**| Business | Đơn ở trạng thái CANCELLED hoặc REJECTED | Lịch giữ chỗ được giải phóng, sẵn sàng cho khách khác thuê |
| **TC-AVAIL-03**| Business | Đơn RENTING quá hạn chưa trả (endDate < hôm nay) | Vẫn tiếp tục chiếm dụng tồn kho, không cho người khác thuê cho tới khi RETURNED |
| **TC-STATE-01**| StateMachine| Chuyển trạng thái từ PENDING -> CONFIRMED | Thành công (200 OK), ghi vết vào RentalStatusHistory |
| **TC-STATE-02**| StateMachine| Chuyển trạng thái sai quy trình (CANCELLED -> CONFIRMED)| Bị chặn 400 Bad Request: "Trạng thái không hợp lệ" |
| **TC-STATE-03**| Idempotency | Gọi API trả đồ (`/return`) liên tiếp 2 lần | Lần 1 thành công; lần 2 trả về 400 Bad Request (chống hoàn cọc lặp lại) |
| **TC-STOCK-01**| Inventory | Admin giảm tồn kho thấp hơn số lượng đã cam kết | Bị chặn 400 Bad Request: "Không thể giảm tồn kho dưới mức cam kết" |

---

## 4. Ma Trận Truy Xuất Nguồn Gốc (Traceability Matrix)

| Mã US | API Endpoint | Màn Hình Liên Quan | Mã Ca Test Kiểm Thử |
| :---: | :--- | :--- | :--- |
| **US01** | `POST /api/v1/auth/register` | `/register` | `TC-AUTH-01`, `TC-AUTH-02`, `TC-AUTH-03` |
| **US02** | `POST /api/v1/auth/login` | `/login` | `TC-AUTH-04`, `TC-AUTH-05` |
| **US03** | `POST /api/v1/auth/logout` | Header Navbar | `TC-AUTH-07` |
| **US04** | `GET/PUT /api/v1/users/me` | `/profile` | `TC-USER-01`, `TC-USER-02` |
| **US05** | `GET /api/v1/costumes` | `/costumes` | `TC-CATALOG-01`, `TC-CATALOG-02` |
| **US06** | `GET /api/v1/costumes?q=...` | FilterSidebar | `TC-SEARCH-01`, `TC-SEARCH-02` |
| **US07** | `GET /api/v1/costumes/:id` | `/costumes/:id` | `TC-DETAIL-01` |
| **US08** | `GET /api/v1/costumes/:id/availability` | Widget Đặt thuê | `TC-DATE-01..03`, `TC-AVAIL-01..03` |
| **US09** | `POST /api/v1/rental-quotes` | Widget Tính giá | `TC-PRICE-01..03` |
| **US10** | `POST /api/v1/rentals` | `/checkout` | `TC-CONCUR-01`, `TC-ORDER-01` |
| **US11** | `GET /api/v1/rentals[/:id]` | `/my-rentals[/:id]` | `TC-IDOR-01`, `TC-ORDER-VIEW` |
| **US12** | `POST /api/v1/rentals/:id/cancel` | `/my-rentals/:id` | `TC-IDOR-02`, `TC-CANCEL-01` |
| **US13** | `GET/POST/PUT/DEL /api/v1/admin/categories` | `/admin/categories` | `TC-RBAC-01..02`, `TC-ADMIN-CAT` |
| **US14** | `POST/PUT/PATCH /api/v1/admin/costumes` | `/admin/costumes` | `TC-ADMIN-COSTUME-HIDE` |
| **US15** | `POST/PUT/PATCH /api/v1/admin/variants` | `/admin/inventory` | `TC-STOCK-01` |
| **US16** | `POST /api/v1/admin/rentals/:id/confirm` | `/admin/rentals` | `TC-STATE-01`, `TC-STATE-02` |
| **US17** | `POST /api/v1/admin/rentals/:id/deliver` | `/admin/rentals/:id`| `TC-DELIVER-01` |
| **US18** | `POST /api/v1/admin/rentals/:id/return` | `/admin/rentals/:id`| `TC-STATE-03`, `TC-RETURN-01` |
| **US19** | `GET /api/v1/admin/dashboard` | `/admin/dashboard` | `TC-DASHBOARD-KPI` |
| **US20** | `GET /api/v1/rentals/:id` (history) | Chi tiết đơn | `TC-AUDIT-TRAIL` |
