# Tài Liệu Quy Ước & Đặc Tả RESTful API (API Specification)
**Dự án: CosRent – Hệ Thống Cho Thuê Trang Phục & Đồ Cosplay**
*Mã tài liệu: DOC-API-01 | Phiên bản: 1.0.0*

---

## 1. Nguyên Tắc Thiết Kế API & Quy Ước Chung (REST Conventions)

Tất cả các API trong hệ thống CosRent đều tuân thủ các chuẩn mực kiến trúc RESTful hiện đại:
- **Tiền tố đường dẫn**: `/api/v1/...`
- **Định dạng dữ liệu**: `application/json` (UTF-8).
- **Quy tắc đặt tên tài nguyên**: Danh từ số nhiều ở dạng kebab-case (ví dụ: `/rental-quotes`, `/costume-variants`).
- **Mã phản hồi HTTP tiêu chuẩn**:
  - `200 OK`: Truy vấn hoặc xử lý thành công.
  - `201 Created`: Tạo mới tài nguyên thành công (Đăng ký, Đặt đơn, Thêm trang phục).
  - `400 Bad Request`: Dữ liệu đầu vào sai định dạng hoặc vi phạm quy tắc nghiệp vụ (ví dụ: ngày trả trước ngày nhận).
  - `401 Unauthorized`: Chưa đăng nhập, token không hợp lệ hoặc đã hết hạn.
  - `403 Forbidden`: Người dùng không đủ quyền hạn (Khách cố gọi API Admin) hoặc vi phạm kiểm tra sở hữu tài nguyên (IDOR).
  - `404 Not Found`: Không tìm thấy tài nguyên tương ứng với ID cung cấp.
  - `409 Conflict`: Xảy ra xung đột tài nguyên (Email đã tồn tại, sản phẩm hết hàng trong khoảng ngày đã chọn do khách khác vừa đặt).
  - `429 Too Many Requests`: Vượt quá giới hạn tần suất yêu cầu (Rate Limiter).
  - `500 Internal Server Error`: Lỗi máy chủ không mong muốn (che giấu stack trace trong môi trường triển khai).

### Ghi Chú Đối Chiếu Hướng Dẫn Giảng Viên
> [!IMPORTANT] Đối chiếu quy chuẩn trên lớp
> Do giảng viên chưa cung cấp tài liệu mẫu tiêu chuẩn cụ thể cho lớp ("hướng dẫn trên lớp"), nhóm đã xây dựng API theo chuẩn mực công nghiệp của NestJS OpenAPI / Swagger. Các mục sau đây khuyến nghị sinh viên đối chiếu thêm với thầy/cô trước buổi chấm:
> 1. Định dạng phong cách trả về lỗi (`{ statusCode, message, error, timestamp, path }`).
> 2. Vị trí đặt tiền tố phiên bản API (`/api/v1` so với `/api`).

---

## 2. Cơ Chế Xác Thực & Phân Quyền (Authentication & Authorization)

Hệ thống kết hợp cơ chế xác thực kép an toàn:
1. **Access Token (Ngắn hạn - 15 phút)**: Chuỗi JSON Web Token (JWT) được trả về trong payload sau khi đăng nhập thành công. Client gửi token này trong tiêu đề HTTP:
   `Authorization: Bearer <access_token>`
2. **Refresh Token (Dài hạn - 7 ngày)**: Được lưu trong cookie an toàn `refreshToken` với các cờ:
   `HttpOnly; Secure (khi production); SameSite=Lax; Path=/api/v1/auth`
3. **Phân quyền dựa trên vai trò (RBAC)**:
   - `@Roles('CUSTOMER')`: Cho phép khách hàng đã đăng nhập.
   - `@Roles('ADMIN')`: Chỉ cho phép quản trị viên.

---

## 3. Danh Mục Các Endpoint Cốt Lõi

### 3.1. Nhóm Xác Thực & Tài Khoản (Authentication & Profile)

#### `POST /api/v1/auth/register`
- **Mục đích**: Đăng ký tài khoản khách hàng mới.
- **Quyền truy cập**: Public (Không cần đăng nhập).
- **Body**:
  ```json
  {
    "email": "khachhang@example.com",
    "password": "Password123@",
    "fullName": "Nguyễn Văn A",
    "phone": "0912345678",
    "address": "Số 12 Đại Cồ Việt, Hà Nội"
  }
  ```
- **Phản hồi 201 Created**:
  ```json
  {
    "statusCode": 201,
    "message": "Đăng ký tài khoản thành công",
    "data": {
      "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "email": "khachhang@example.com",
      "fullName": "Nguyễn Văn A",
      "role": "CUSTOMER"
    }
  }
  ```

#### `POST /api/v1/auth/login`
- **Mục đích**: Đăng nhập lấy Access Token và Cookie Refresh Token.
- **Quyền truy cập**: Public (Áp dụng Rate Limiting 10 req/phút).
- **Body**:
  ```json
  {
    "email": "khachhang@example.com",
    "password": "Password123@"
  }
  ```
- **Phản hồi 200 OK**:
  ```json
  {
    "statusCode": 200,
    "message": "Đăng nhập thành công",
    "data": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
        "email": "khachhang@example.com",
        "fullName": "Nguyễn Văn A",
        "role": "CUSTOMER"
      }
    }
  }
  ```
  *Kèm Set-Cookie*: `refreshToken=...; HttpOnly; SameSite=Lax; Path=/api/v1/auth`

#### `POST /api/v1/auth/refresh`
- **Mục đích**: Xoay vòng Refresh Token và cấp Access Token mới.
- **Quyền truy cập**: Dựa vào cookie `refreshToken`.
- **Phản hồi 200 OK**: Trả về `accessToken` mới và cấp cookie `refreshToken` mới (Token Rotation).

#### `POST /api/v1/auth/logout`
- **Mục đích**: Đăng xuất, hủy phiên trong database và xóa cookie.
- **Quyền truy cập**: Public / Authenticated.
- **Phản hồi 200 OK**: Thu hồi phiên, xóa cookie.

#### `GET /api/v1/users/me`
- **Mục đích**: Lấy thông tin hồ sơ của người dùng hiện tại.
- **Quyền truy cập**: Yêu cầu Bearer Token (`CUSTOMER` hoặc `ADMIN`).

#### `PUT /api/v1/users/me`
- **Mục đích**: Cập nhật thông tin hồ sơ (Họ tên, SĐT, Địa chỉ).

---

### 3.2. Nhóm Trang Phục & Tồn Kho (Catalog & Availability)

#### `GET /api/v1/categories`
- **Mục đích**: Lấy danh sách danh mục đang kích hoạt cho khách hàng.
- **Quyền truy cập**: Public.

#### `GET /api/v1/costumes`
- **Mục đích**: Tìm kiếm, lọc và phân trang danh sách trang phục.
- **Quyền truy cập**: Public.
- **Query Params**:
  - `keyword` (string, optional): Từ khóa tìm kiếm theo tên hoặc nhân vật.
  - `categoryId` (UUID, optional): Lọc theo danh mục.
  - `size` (string, optional): Lọc theo kích cỡ (S, M, L, XL,...).
  - `minPrice`, `maxPrice` (int, optional): Khoảng giá thuê mỗi ngày.
  - `page` (int, default: 1): Số trang.
  - `limit` (int, default: 12): Số lượng bản ghi mỗi trang.
  - `sortBy` (enum: `createdAt_desc`, `price_asc`, `price_desc`).
- **Phản hồi 200 OK**:
  ```json
  {
    "statusCode": 200,
    "data": {
      "items": [
        {
          "id": "...",
          "name": "Raiden Shogun - Genshin Impact",
          "slug": "raiden-shogun-genshin-impact",
          "characterName": "Raiden Shogun",
          "dailyPrice": 200000,
          "depositAmount": 600000,
          "category": { "name": "Game Cosplay" },
          "primaryImage": "https://...",
          "availableSizes": ["S", "M", "L"]
        }
      ],
      "meta": {
        "total": 24,
        "page": 1,
        "limit": 12,
        "totalPages": 2
      }
    }
  }
  ```

#### `GET /api/v1/costumes/:id`
- **Mục đích**: Xem chi tiết trang phục, mô tả, thư viện ảnh và danh sách các biến thể kích cỡ.
- **Quyền truy cập**: Public.

#### `GET /api/v1/costumes/:id/availability`
- **Mục đích**: Kiểm tra số lượng còn có thể thuê của một biến thể trong khoảng ngày nhận - trả.
- **Quyền truy cập**: Public.
- **Query Params**:
  - `variantId` (UUID, required): Mã biến thể kích cỡ cần kiểm tra.
  - `startDate` (string YYYY-MM-DD, required): Ngày nhận đồ.
  - `endDate` (string YYYY-MM-DD, required): Ngày trả đồ.
- **Phản hồi 200 OK**:
  ```json
  {
    "statusCode": 200,
    "data": {
      "variantId": "...",
      "startDate": "2026-11-10",
      "endDate": "2026-11-12",
      "rentalDays": 3,
      "baseStock": 3,
      "availableQuantity": 2,
      "isAvailable": true
    }
  }
  ```

---

### 3.3. Nhóm Báo Giá & Đơn Thuê Khách Hàng (Quotes & Customer Rentals)

#### `POST /api/v1/rental-quotes`
- **Mục đích**: Tính toán bảng kê chi phí thuê và tiền cọc dựa trên danh sách món hàng và ngày thuê.
- **Quyền truy cập**: Public / Authenticated.
- **Body**:
  ```json
  {
    "startDate": "2026-11-10",
    "endDate": "2026-11-12",
    "items": [
      {
        "costumeVariantId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "quantity": 1
      }
    ]
  }
  ```
- **Phản hồi 200 OK**:
  ```json
  {
    "statusCode": 200,
    "data": {
      "startDate": "2026-11-10",
      "endDate": "2026-11-12",
      "rentalDays": 3,
      "items": [
        {
          "costumeVariantId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "costumeName": "Raiden Shogun - Genshin Impact",
          "size": "M",
          "dailyPrice": 200000,
          "depositAmount": 600000,
          "quantity": 1,
          "lineRentalFee": 600000,
          "lineDeposit": 600000
        }
      ],
      "totalRentalFee": 600000,
      "totalDeposit": 600000,
      "totalDueAtStore": 1200000
    }
  }
  ```

#### `POST /api/v1/rentals`
- **Mục đích**: Tạo đơn đặt giữ trang phục (Thực hiện khóa bi quan và kiểm tra tồn kho trong transaction).
- **Quyền truy cập**: CUSTOMER (Bắt buộc đăng nhập).
- **Body**:
  ```json
  {
    "customerName": "Nguyễn Văn A",
    "customerPhone": "0912345678",
    "note": "Nhận đồ lúc 14h chiều",
    "startDate": "2026-11-10",
    "endDate": "2026-11-12",
    "items": [
      {
        "costumeVariantId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "quantity": 1
      }
    ]
  }
  ```
- **Phản hồi 201 Created**:
  ```json
  {
    "statusCode": 201,
    "message": "Tạo đơn đặt thuê thành công",
    "data": {
      "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "orderCode": "CR-20261029-8812",
      "status": "PENDING",
      "startDate": "2026-11-10",
      "endDate": "2026-11-12",
      "rentalDays": 3,
      "totalRentalFee": 600000,
      "totalDeposit": 600000,
      "createdAt": "2026-10-29T07:30:00.000Z"
    }
  }
  ```

#### `GET /api/v1/rentals`
- **Mục đích**: Lấy danh sách lịch sử đơn thuê của chính khách hàng đăng nhập.
- **Quyền truy cập**: CUSTOMER.

#### `GET /api/v1/rentals/:id`
- **Mục đích**: Xem chi tiết đơn thuê, bao gồm danh sách mặt hàng snapshot và lịch sử trạng thái.
- **Quyền truy cập**: CUSTOMER (Chỉ xem đơn của mình - Chặn IDOR) hoặc ADMIN.

#### `POST /api/v1/rentals/:id/cancel`
- **Mục đích**: Khách hàng hủy đơn khi đơn còn ở trạng thái `PENDING`.
- **Quyền truy cập**: CUSTOMER (Chính chủ đơn).

---

### 3.4. Nhóm Quản Trị Hệ Thống (Admin Endpoints)

- `GET /api/v1/admin/dashboard`: Thống kê tổng hợp doanh thu, lượng hàng đang thuê, đơn chờ duyệt, cảnh báo quá hạn.
- `GET/POST/PUT/DELETE /api/v1/admin/categories`: Quản lý danh mục trang phục.
- `POST/PUT /api/v1/admin/costumes`: Thêm mới, chỉnh sửa thông tin trang phục.
- `PATCH /api/v1/admin/costumes/:id/toggle-active`: Ẩn/Hiện trang phục (Soft-deactivate).
- `POST/PUT /api/v1/admin/variants`: Thêm/sửa biến thể kích cỡ.
- `PATCH /api/v1/admin/variants/:id/stock`: Cập nhật số lượng tồn kho (Có kiểm tra an toàn cam kết đặt trước).
- `GET /api/v1/admin/rentals`: Lọc và phân trang toàn bộ đơn thuê tại cửa hàng.
- `POST /api/v1/admin/rentals/:id/confirm`: Xác nhận đơn PENDING $\rightarrow$ CONFIRMED.
- `POST /api/v1/admin/rentals/:id/reject`: Từ chối đơn PENDING $\rightarrow$ REJECTED (kèm lý do).
- `POST /api/v1/admin/rentals/:id/deliver`: Giao đồ tại quầy CONFIRMED $\rightarrow$ RENTING.
- `POST /api/v1/admin/rentals/:id/return`: Nhận trả đồ & hoàn cọc RENTING $\rightarrow$ RETURNED.

