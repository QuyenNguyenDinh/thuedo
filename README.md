# CosRent – Nền tảng Cho Thuê Trang Phục & Phụ Kiện Cosplay

> **Báo cáo & Đồ án Bài tập lớn Môn: Phát triển Ứng dụng Web Nâng cao (WebNC)**  
> **Trường Đại học Phenikaa – Khoa Công nghệ Thông tin**  
> **Hạn nộp bản mềm (Canvas):** Trước 23:59 ngày 31/10/2026  
> **Hạn nộp bản in & ký tên:** Trước 17:00 ngày 02/11/2026  

---

## 1. Giới thiệu tổng quan

**CosRent** là giải pháp phần mềm web hoàn chỉnh phục vụ hoạt động quản lý và cho thuê trang phục, phụ kiện cosplay tại cửa hàng. Hệ thống giải quyết trọn vẹn bài toán vận hành thực tế: từ việc khách hàng tìm kiếm, chọn kích cỡ, kiểm tra tồn kho khả dụng theo khoảng ngày lịch, xem bảng báo giá và tiền cọc minh bạch, đặt giữ chỗ trực tuyến; đến quy trình quản trị viên xác nhận đơn, bàn giao nhận tiền cọc tại quầy, và tiếp nhận hoàn trả đồ, hoàn cọc.

### Các vai trò người dùng
- **Khách vãng lai (Guest):** Tìm kiếm, lọc theo danh mục, kích thước, khoảng giá; tra cứu chi tiết trang phục; kiểm tra tồn kho theo ngày lịch và nhận bảng tính tiền thuê/tiền cọc.
- **Khách hàng đã đăng ký (CUSTOMER):** Đăng ký/đăng nhập an toàn, cập nhật hồ sơ, tạo đơn thuê giữ chỗ, xem lịch sử và chi tiết đơn thuê, hủy đơn khi còn ở trạng thái `PENDING`.
- **Quản trị viên cửa hàng (ADMIN):** Quản lý danh mục, trang phục, kích cỡ và số lượng tồn kho (có cơ chế chặn giảm tồn kho vi phạm cam kết đơn thuê); duyệt/từ chối đơn thuê, ghi nhận giao đồ (`RENTING`), ghi nhận trả đồ và hoàn cọc (`RETURNED`), theo dõi báo cáo doanh thu và tỷ lệ lấp đầy.

### Phạm vi và Giới hạn vận hành bắt buộc
- **Nhận và trả trang phục:** Trực tiếp tại quầy cửa hàng (In-store pickup & return).
- **Thanh toán & đặt cọc:** Trực tiếp bằng tiền mặt hoặc ghi nhận thủ công tại quầy khi giao đồ.
- **Phạm vi ngoài luồng (Out of scope):** Không tích hợp cổng thanh toán trực tuyến, không giao hàng qua bên thứ ba, không quản lý chuỗi đa chi nhánh, không tích hợp live chat thời gian thực.

---

## 2. Ngăn xếp Công nghệ (Tech Stack)

| Thành phần | Công nghệ / Thư viện | Vai trò |
| :--- | :--- | :--- |
| **Monorepo** | npm Workspaces (`apps/backend`, `apps/frontend`) | Quản lý mã nguồn tập trung, đồng bộ scripts và dependencies |
| **Frontend** | React 18, TypeScript, Vite | Single Page Application hiệu năng cao, kiểu dữ liệu chặt chẽ |
| **UI Framework** | `react-bootstrap` & Bootstrap 5 | Layout chuẩn phong cách Booking.com (Navy `#003580`, Accent Gold `#febb02`) |
| **Backend** | NestJS 10, TypeScript | Kiến trúc phân tầng rõ ràng: Controller → Service → Repository → Database |
| **Cơ sở dữ liệu** | PostgreSQL 16 (Relational DB) | Mô hình dữ liệu chuẩn hóa 3NF, ràng buộc toàn vẹn, UUID v4 |
| **ORM & Migrations** | TypeORM | Quản lý schema bằng Migrations thuần, `synchronize: false` khi triển khai |
| **Bảo mật & Auth** | Passport-JWT, bcrypt, Cookie-parser | Access Token (in-memory) + Refresh Token (HttpOnly Cookie), RBAC, IDOR Guards |
| **API Docs** | Swagger / OpenAPI 3.0 | Đặc tả toàn bộ RESTful API tự động tại `/api/docs` |
| **Kiểm thử Backend** | Jest, Supertest | Unit test nghiệp vụ và Integration/E2E test phòng ngừa Race Condition |
| **Kiểm thử Frontend** | Vitest, React Testing Library | Component test và tương tác người dùng |
| **Kiểm thử E2E Flow**| Playwright | Kiểm thử luồng người dùng xuyên suốt frontend - backend |
| **Containerization** | Docker, Docker Compose | Khởi tạo môi trường PostgreSQL nhanh chóng và nhất quán |

---

## 3. Kiến trúc Phân tầng & Nghiệp vụ Cốt lõi

Backend áp dụng nguyên lý tách biệt trách nhiệm (Separation of Concerns):
```
[Client / React App]
       │
       ▼ (HTTP / REST + Bearer Token / HttpOnly Cookie)
[Controller Layer]  ── Validate DTOs (class-validator), HTTP routing, Swagger docs
       │
       ▼ (Domain DTOs / Authenticated User Context)
[Service Layer]     ── Business logic, Calendar date calculation, Pessimistic Lock, State Machine
       │
       ▼ (TypeORM Queries / Entity Managers)
[Repository Layer]  ── Data Access, Query Builders, Transactions (`SELECT ... FOR UPDATE`)
       │
       ▼ (SQL / ACID Transactions)
[PostgreSQL DB]     ── Tables, Constraints, Indexes, Foreign Keys
```

### Quy tắc nghiệp vụ bắt buộc đã hiện thực:
1. **Lịch ngày tại Việt Nam (`Asia/Ho_Chi_Minh`):** Quản lý ngày thuê theo ngày lịch thuần túy, loại bỏ hoàn toàn lỗi lệch ngày do chuyển đổi múi giờ UTC.
2. **Đếm ngày trọn vẹn (Inclusive Days):** Cả ngày nhận và ngày trả đều tính tiền. Thuê trong ngày = 1 ngày; Số ngày thuê = `(Ngày trả - Ngày nhận) + 1`.
3. **Tách biệt Tiền thuê & Tiền cọc:** Tiền thuê tính vào doanh thu dịch vụ; Tiền cọc là khoản bảo đảm hoàn lại, không tính vào doanh thu.
4. **Backend bảo vệ giá (Zero Client Trust):** Toàn bộ đơn giá, tiền thuê, tiền cọc do backend tính toán từ cơ sở dữ liệu; không tin giá từ frontend.
5. **Snapshot dữ liệu đơn hàng:** Lưu vết tên trang phục, kích cỡ, đơn giá thuê/ngày và tiền cọc tại thời điểm đặt để việc chỉnh sửa sản phẩm sau này không làm sai lệch lịch sử giao dịch.
6. **Số nguyên tiền tệ:** Sử dụng số nguyên VND (`BIGINT` trong DB), tuyệt đối không dùng số thực dấu phẩy động (float/double) để tránh sai số làm tròn.
7. **Máy trạng thái đơn hàng (Order State Machine):**
   - Luồng hợp lệ: `PENDING` → `CONFIRMED` | `REJECTED` | `CANCELLED` (chỉ khách hàng chủ đơn); `CONFIRMED` → `RENTING`; `RENTING` → `RETURNED`.
   - Mỗi lần đổi trạng thái đều lưu vào bảng `rental_status_histories` (người thực hiện, thời gian, trạng thái trước/sau, ghi chú).
8. **Thuật toán tồn kho theo khoảng ngày:**
   - Các trạng thái giữ chỗ trong lịch: `PENDING`, `CONFIRMED`, `RENTING`.
   - Các trạng thái giải phóng lịch: `CANCELLED`, `REJECTED`, `RETURNED`.
   - Số lượng khả dụng của cả khoảng thời gian là **giá trị nhỏ nhất (MIN)** của số lượng khả dụng từng ngày trong khoảng đó (không cộng dồn thô bạo gây thiếu hụt tồn kho giả tạo).
   - Đơn `RENTING` quá hạn chưa trả tiếp tục giữ chỗ cho đến khi quản trị viên ghi nhận trả hàng.
9. **Chống đặt vượt kho khi đồng thời (Race Condition Prevention):**
   - Trong transaction tạo đơn, thực hiện khóa bi quan (Pessimistic Write Lock) trên các dòng biến thể: `SELECT ... FROM costume_variants WHERE id IN (...) ORDER BY id ASC FOR UPDATE`.
   - Sắp xếp ID tăng dần để ngăn ngừa hiện tượng khóa chéo (Deadlock).
   - Kiểm tra lại tồn kho khả dụng bên trong transaction trước khi chèn bản ghi đơn hàng.

---

## 4. Hướng dẫn Cài đặt & Khởi chạy

### Yêu cầu hệ thống (Prerequisites)
- **Node.js:** Phiên bản `>= 20.19.0` (Khuyến nghị LTS `v20.x` hoặc `v22.x`, đã kiểm tra tương thích trên `v24.x`).
- **npm:** Phiên bản `>= 9.0.0` (có hỗ trợ npm Workspaces).
- **PostgreSQL 16:** Cài đặt trực tiếp trên máy hoặc chạy qua Docker Compose.

### Bước 1: Clone mã nguồn và cài đặt dependencies
```bash
git clone [CẦN BỔ SUNG: URL repository GitHub/GitLab của nhóm]
cd webnc
npm install
```

### Bước 2: Khởi động Cơ sở dữ liệu PostgreSQL
Cách A: Sử dụng Docker Compose (Khuyến nghị)
```bash
docker compose up -d
```
Cách B: Sử dụng PostgreSQL cài sẵn trên máy
Tạo database tên `cosrent_db` với user/password tương ứng cấu hình trong file `.env`.
*(Lưu ý: Nếu chạy trên máy chưa cài Docker hay PostgreSQL, backend tự động kích hoạt chế độ In-Memory PostgreSQL qua `pg-mem` để bạn có thể trải nghiệm đầy đủ ngay lập tức!)*

### Bước 3: Cấu hình biến môi trường (.env)
Sao chép cấu hình riêng biệt cho từng ứng dụng từ file `.env.example`:
```bash
# Cấu hình Backend (DB, JWT, Rate limit, CORS)
cp apps/backend/.env.example apps/backend/.env

# Cấu hình Frontend (Chỉ chứa VITE_API_BASE_URL, tuyệt đối không lộ secret backend)
cp apps/frontend/.env.example apps/frontend/.env
```
Nội dung backend mặc định (`apps/backend/.env`):
```env
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres_password_example
DB_DATABASE=cosrent_db
DB_SYNCHRONIZE=false

JWT_ACCESS_SECRET=your_jwt_access_secret_min_32_characters_long_example
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_jwt_refresh_secret_min_32_characters_long_example
JWT_REFRESH_EXPIRES_IN=7d
COOKIE_SECRET=your_cookie_signing_secret_example

THROTTLE_TTL=60000
THROTTLE_LIMIT=100
CORS_ORIGIN=http://localhost:5173,http://127.0.0.1:5173
```

### Bước 4: Chạy Migration và Seed dữ liệu khởi tạo
```bash
# Chạy migration tạo bảng và ràng buộc toàn vẹn
npm run migration:run --workspace=apps/backend

# Chạy seed dữ liệu mẫu (Tạo tài khoản Admin/Customer, 5 Danh mục, 21 Trang phục, và các đơn hàng mẫu)
npm run seed --workspace=apps/backend
```

### Bước 5: Khởi chạy Ứng dụng ở chế độ Phát triển (Development)
Mở hai cửa sổ terminal hoặc chạy đồng thời:
```bash
# Terminal 1: Chạy Backend NestJS (Chạy tại http://localhost:3000)
npm run dev:backend

# Terminal 2: Chạy Frontend Vite React (Chạy tại http://localhost:5173)
npm run dev:frontend
```

Truy cập ứng dụng tại: **`http://localhost:5173`**  
Truy cập tài liệu Swagger API tại: **`http://localhost:3000/api/docs`**

---

## 5. Tài khoản Thử nghiệm (Demo Accounts)

Sau khi chạy seed dữ liệu, hệ thống đã sẵn sàng với các tài khoản sau (hỗ trợ cả đuôi `@cosrent.vn` và `@cosrent.com`):

| Vai trò | Email đăng nhập | Mật khẩu | Mục đích sử dụng |
| :--- | :--- | :--- | :--- |
| **Quản trị viên (ADMIN)** | `admin@cosrent.vn` / `admin@cosrent.com` | `Admin123@` | Quản lý trang phục, tồn kho, duyệt đơn, bàn giao, nhận trả |
| **Khách hàng 1 (CUSTOMER)** | `customer@cosrent.vn` / `customer@cosrent.com` | `Customer123@` | Khách hàng mẫu có lịch sử đơn hàng đủ các trạng thái |
| **Khách hàng 2 (CUSTOMER)** | `customer2@cosrent.vn` / `customer2@cosrent.com` | `Customer123@` | Khách hàng mới để thử nghiệm tạo đơn và hủy đơn |

---

## 6. Hướng dẫn Chạy Kiểm thử (Testing)

Dự án trang bị hệ thống kiểm thử tự động toàn diện theo mô hình kim tự tháp (Testing Pyramid):

```bash
# 1. Chạy toàn bộ Unit Tests (Backend Jest + Frontend Vitest)
npm test

# 2. Chạy riêng Backend Unit Tests trong src/ (Pricing, Availability, State Machine)
npm run test:backend

# 3. Chạy riêng Frontend Unit Tests (StatusBadge, CostumeCard, LoginPage)
npm run test:frontend

# 4. Chạy toàn bộ Test trong thư mục test/ của Backend (Câu 7b - US01 đến US20, Khóa bi quan, RBAC, IDOR)
npm run test:e2e --workspace=apps/backend

# 5. Chạy Kiểm tra Độ phủ Code (Code Coverage)
npm run test:cov --workspace=apps/backend

# 6. Chạy Kiểm thử Luồng người dùng Frontend (Playwright E2E - Chạy tuần tự an toàn với workers: 1)
npx playwright test
```

### Bằng chứng Kết quả Kiểm thử Thực tế
- **Backend Unit Tests (`src/`):** `19/19 passed (100%)` trên Jest.
  - `pricing.service.spec.ts`: Đạt kiểm thử đếm ngày lịch bao gồm hai đầu, tính tiền thuê, tính cọc, kiểm tra ngày quá khứ.
  - `availability.service.spec.ts`: Đạt kiểm thử tính Min-available theo từng ngày trong khoảng, kiểm tra đơn quá hạn `RENTING` tiếp tục giữ chỗ, kiểm tra giải phóng chỗ khi `CANCELLED`/`RETURNED`.
  - `rental-state-machine.spec.ts`: Đạt kiểm thử chuyển trạng thái hợp lệ và chặn đứng chuyển trạng thái sai quy tắc.
- **Backend Tests trong thư mục `test/` (Đáp ứng trực tiếp Tiêu chí Câu 7b):** `26/26 passed (100%)`.
  - `test/user-stories.e2e-spec.ts`: Kiểm thử toàn bộ 20 User Stories của Câu 1 (US01 đến US20).
  - `test/concurrency.e2e-spec.ts`: Đạt bài test 2 luồng yêu cầu đồng thời tranh chấp biến thể chỉ còn 1 sản phẩm: Đúng 1 đơn thành công, 1 đơn bị từ chối với lỗi `409 Conflict`, không xảy ra Overselling.
  - `test/auth-rbac.e2e-spec.ts`: Đạt bài test kiểm soát quyền hạn RBAC và chống truy cập chéo IDOR.
- **Frontend Unit Tests:** `10/10 passed (100%)` trên Vitest + React Testing Library.
  - Render thẻ sản phẩm, format VND chính xác, kiểm tra màu sắc/badge trạng thái chuẩn Booking.com, validate form đăng nhập.
- **Biên dịch Production (Build Verification):**
  - Backend: `nest build` thành công, 0 cảnh báo/lỗi.
  - Frontend: `tsc -b && vite build` thành công trong 1.7s, tạo bundle tối ưu tại `apps/frontend/dist`.

---

## 7. Cấu trúc Dự án & Danh mục Tài liệu Bàn giao

```
webnc/
├── apps/
│   ├── backend/                     # Mã nguồn Backend NestJS
│   │   ├── src/
│   │   │   ├── common/              # Enums, decorators, guards, filters, DateUtil
│   │   │   ├── database/            # Data-source, migrations, seeds (21 costumes)
│   │   │   ├── entities/            # 8 TypeORM Entities chuẩn hóa quan hệ
│   │   │   └── modules/             # Auth, Users, Categories, Costumes, Pricing, Availability, Rentals, Admin
│   │   └── test/                    # Integration & Concurrency E2E tests
│   └── frontend/                    # Mã nguồn Frontend React Vite
│       ├── src/
│       │   ├── components/          # Navbar, Footer, SearchBar, FilterSidebar, CostumeCard, StatusBadge...
│       │   ├── context/             # AuthContext (quản lý session và refresh token)
│       │   ├── pages/               # 12 màn hình giao diện (Customer + Admin)
│       │   └── services/            # Axios instance, API clients
│       └── vitest.config.ts         # Cấu hình test frontend
├── docs/                            # BỘ TÀI LIỆU BÀN GIAO ĐÁP ỨNG ĐẦY ĐỦ 10 CÂU HỎI BTL
│   ├── user-stories.md              # [Câu 1] 20 User Stories chi tiết kèm tiêu chí chấp nhận & ma trận truy vết
│   ├── requirements.md              # [Câu 2, 6] Phân tích yêu cầu chức năng (FR1-6) và phi chức năng (NFR1-4)
│   ├── architecture.md              # [Câu 2] Kiến trúc phân tầng, UML Class Diagram, Flowcharts thuật toán
│   ├── database.md                  # [Câu 2] ERD (Crow's Foot), thiết kế 3NF, Snapshotting, ví dụ SQL thực tế
│   ├── wireframes.md                # [Câu 3, 5] Đặc tả 12 màn hình wireframe, UI Booking.com, so sánh Steps vs Interactions
│   ├── api.md                       # [Câu 4] Đặc tả RESTful API, tài liệu Swagger, chuẩn mã lỗi RFC 7807
│   ├── security.md                  # [Câu 7] Bảo mật JWT, RBAC, IDOR, SQLi/XSS/CSRF & giải trình thuật ngữ "XORs"
│   ├── testing.md                   # [Câu 8] Chiến lược kiểm thử kim tự tháp, ma trận truy vết, đặc tả test cases
│   ├── report.md                    # [Câu 9, 10] Báo cáo tổng kết đồ án, phân tích tuân thủ Pháp luật Việt Nam (SHTT, NĐ 13/2023, BVQLNTD)
│   ├── contributions.md             # Bảng phân công công việc, Git commit logs mẫu, 4 biên bản họp nhóm
│   ├── demo-script.md               # Kịch bản quay video demo hoàn chỉnh dưới 8 phút (7m30s)
│   └── submission-checklist.md      # Checklist kiểm tra nộp bài Canvas (trước 31/10) và Bản in (trước 02/11)
├── e2e/                             # Playwright user-flow end-to-end tests
├── docker-compose.yml               # File khởi chạy PostgreSQL 16 container
├── playwright.config.ts             # Cấu hình Playwright E2E
├── package.json                     # Root monorepo workspace configuration
├── LICENSE                          # Giấy phép nguồn mở MIT & Tuyên bố bản quyền hình ảnh cosplay
└── README.md                        # Tài liệu hướng dẫn này
```

---

## 8. Hướng dẫn Dành cho Sinh viên Hoàn thiện Nộp bài

Trước khi xuất file PDF và nộp bài lên hệ thống Canvas hoặc in bản cứng, các thành viên trong nhóm cần thực hiện các bước sau:
1. Tìm kiếm toàn bộ cụm từ khóa **`[CẦN BỔ SUNG`** trong thư mục `docs/` và file `README.md`.
2. Điền chính xác:
   - Họ và tên, Mã sinh viên, Lớp, Email của từng thành viên nhóm (tại `docs/report.md`, `docs/contributions.md`).
   - Đường link Git repository chính thức của nhóm (GitHub/GitLab).
   - Đường link video demo sản phẩm (Google Drive/YouTube/OneDrive với quyền xem công khai, thời lượng `< 8 phút`).
   - Ngày tháng tổ chức các buổi họp thực tế và chữ ký xác nhận của từng thành viên trong `docs/contributions.md`.
3. Kiểm tra danh mục kiểm tra tại **`docs/submission-checklist.md`** để đảm bảo không bỏ sót bất kỳ yêu cầu nào của giảng viên.

---
*Dự án được xây dựng và hoàn thiện đáp ứng toàn diện các tiêu chuẩn kỹ thuật phần mềm doanh nghiệp, chuẩn mực kiến trúc và quy định học thuật của Môn học Phát triển Ứng dụng Web Nâng cao.*

