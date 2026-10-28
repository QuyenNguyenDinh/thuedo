# Tài Liệu Thiết Kế Kiến Trúc Hệ Thống (System Architecture Document)
**Dự án: CosRent – Hệ Thống Cho Thuê Trang Phục & Đồ Cosplay**
*Mã tài liệu: DOC-ARCH-01 | Phiên bản: 1.0.0*

---

## 1. Tổng Quan Kiến Trúc (Architecture Overview)

CosRent được thiết kế theo mô hình **Phân lớp Hướng Dịch Vụ (Layered Architecture)** kết hợp với chuẩn **RESTful API** và **Kiến trúc SPA (Single Page Application)**. Mô hình này tách biệt hoàn toàn giữa tầng giao diện hiển thị phía Client và tầng xử lý nghiệp vụ, quản lý dữ liệu phía Server.

### 1.1. Sơ đồ Tổng thể Hệ thống

```mermaid
flowchart TD
    subgraph ClientLayer ["Client Layer (Trình duyệt Người dùng)"]
        BrowserUI["React + Vite SPA (TypeScript)"]
        UIComponents["React-Bootstrap Components"]
        ClientState["AuthContext (In-Memory Access Token)"]
        BrowserUI --> UIComponents
        BrowserUI --> ClientState
    end

    subgraph APIGateway ["HTTP / Network Boundary"]
        HTTPS_Traffic["HTTPS Request (JSON Payload + Cookie)"]
        Middlewares["Helmet / CORS Allowlist / Throttler Rate Limiter"]
    end

    subgraph BackendApp ["NestJS Backend Application (apps/backend)"]
        subgraph ControllerLayer ["1. Controller Layer (HTTP Handling & DTO Validation)"]
            AuthController["AuthController"]
            CostumesController["CostumesController"]
            RentalsController["RentalsController"]
            AdminRentalsController["AdminRentalsController"]
            AdminInventoryController["AdminInventoryController"]
        end

        subgraph ServiceLayer ["2. Service Layer (Core Business Logic)"]
            AuthService["AuthService (JWT, Argon2/bcrypt)"]
            PricingService["PricingService (Calendar Days, VND Integers)"]
            AvailabilityService["AvailabilityService (Day-by-day Scan, Min Available)"]
            RentalsService["RentalsService (Pessimistic Locking, State Machine)"]
            CostumesService["CostumesService (Catalog & Soft-hide)"]
        end

        subgraph DataAccessLayer ["3. Data Access Layer (TypeORM Repositories)"]
            UserRepo["UserRepository"]
            CostumeRepo["CostumeRepository"]
            VariantRepo["CostumeVariantRepository"]
            OrderRepo["RentalOrderRepository"]
            HistoryRepo["RentalStatusHistoryRepository"]
            QueryRunner["TypeORM QueryRunner (Transactions & Locks)"]
        end
    end

    subgraph DatabaseLayer ["4. Persistence Layer (PostgreSQL 16)"]
        PostgresDB[(PostgreSQL Database)]
        Tables["users, categories, costumes, costume_variants, rental_orders, rental_order_items, rental_status_histories, refresh_sessions"]
        PostgresDB --- Tables
    end

    BrowserUI --> HTTPS_Traffic
    HTTPS_Traffic --> Middlewares
    Middlewares --> ControllerLayer

    AuthController --> AuthService
    CostumesController --> CostumesService
    RentalsController --> PricingService
    RentalsController --> AvailabilityService
    RentalsController --> RentalsService
    AdminRentalsController --> RentalsService
    AdminInventoryController --> CostumesService

    AuthService --> UserRepo
    CostumesService --> CostumeRepo
    CostumesService --> VariantRepo
    AvailabilityService --> OrderRepo
    RentalsService --> OrderRepo
    RentalsService --> VariantRepo
    RentalsService --> HistoryRepo
    RentalsService --> QueryRunner

    UserRepo --> PostgresDB
    CostumeRepo --> PostgresDB
    VariantRepo --> PostgresDB
    OrderRepo --> PostgresDB
    HistoryRepo --> PostgresDB
    QueryRunner --> PostgresDB
```

---

## 2. Nguyên Tắc Phân Lớp Backend (Separation of Concerns)

Nhằm đảm bảo tính module hóa, dễ kiểm thử (testability) và tuân thủ các nguyên lý SOLID, Backend NestJS được chia thành 4 tầng rõ rệt:

1. **Controller Layer (Tầng Điều Khiển)**:
   - Nhiệm vụ duy nhất: Tiếp nhận yêu cầu HTTP, điều hướng URL, bóc tách DTO, kích hoạt xác thực (`Guards`), thực hiện validation dữ liệu đầu vào qua `ValidationPipe` (`class-validator`), và trả về mã trạng thái HTTP chuẩn (200, 201, 400, 401, 403, 404, 409).
   - **Tuyệt đối không** chứa logic nghiệp vụ tính toán giá, kiểm tra tồn kho hay truy vấn SQL trực tiếp trong Controller.

2. **Service Layer (Tầng Nghiệp Vụ Cốt Lõi)**:
   - Chứa toàn bộ các quy tắc nghiệp vụ (Business Rules): Tính toán số ngày theo lịch Việt Nam, tính tiền thuê và tiền cọc, thuật toán quét lịch tồn kho khả dụng, kiểm tra trạng thái đơn hợp lệ, quản lý transaction và cơ chế khóa hàng.
   - Gọi đến các Repositories để đọc và ghi dữ liệu. Độc lập với giao thức truyền thông HTTP, giúp dễ dàng viết Unit Test độc lập.

3. **Repository / Data Access Layer (Tầng Truy Cập Dữ Liệu)**:
   - Đảm nhiệm việc trừu tượng hóa các câu lệnh SQL thông qua TypeORM Repository và `QueryBuilder`.
   - Thực hiện các truy vấn phức tạp: JOIN bảng, tính tổng số lượng đặt theo ngày, khóa bi quan hàng (`setLock('pessimistic_write')`), phân trang và sắp xếp an toàn.

4. **Database Layer (Tầng Cơ Sở Dữ Liệu)**:
   - Lưu trữ dữ liệu quan hệ trong PostgreSQL 16.
   - Đảm bảo toàn vẹn dữ liệu với các ràng buộc khóa ngoại (Foreign Keys), khóa chính (Primary Keys), chỉ mục tìm kiếm (B-Tree Indexes) và cờ kiểm tra (Check Constraints).

---

## 3. Sơ Đồ Lớp UML Chi Tiết (UML Class Diagram)

Sơ đồ thể hiện đầy đủ các thuộc tính, phương thức chính và quan hệ với multiplicity giữa các thực thể cốt lõi:

```mermaid
classDiagram
    direction TB

    class User {
        +UUID id
        +string email
        +string passwordHash
        +string fullName
        +string phone
        +string address
        +Role role
        +Date createdAt
        +Date updatedAt
        +validatePassword(plainPassword) boolean
    }

    class RefreshSession {
        +UUID id
        +UUID userId
        +string tokenHash
        +Date expiresAt
        +boolean isRevoked
        +string userAgent
        +string ipAddress
        +Date createdAt
        +isValid() boolean
        +revoke() void
    }

    class Category {
        +UUID id
        +string name
        +string slug
        +string description
        +int displayOrder
        +boolean isActive
        +Date createdAt
    }

    class Costume {
        +UUID id
        +UUID categoryId
        +string name
        +string slug
        +string characterName
        +string seriesName
        +string description
        +int dailyPrice
        +int depositAmount
        +boolean isActive
        +Date createdAt
        +Date updatedAt
        +deactivate() void
    }

    class CostumeImage {
        +UUID id
        +UUID costumeId
        +string imageUrl
        +string altText
        +boolean isPrimary
        +int displayOrder
    }

    class CostumeVariant {
        +UUID id
        +UUID costumeId
        +string size
        +string sku
        +int totalQuantity
        +int outOfServiceQuantity
        +Date createdAt
        +getAvailableBase() int
        +canDecreaseStock(minRequired) boolean
    }

    class RentalOrder {
        +UUID id
        +string orderCode
        +UUID userId
        +string customerName
        +string customerPhone
        +string note
        +OrderStatus status
        +Date startDate
        +Date endDate
        +int rentalDays
        +int totalRentalFee
        +int totalDeposit
        +int actualDepositReturned
        +Date deliveredAt
        +Date returnedAt
        +Date createdAt
        +Date updatedAt
        +canCancel(userId) boolean
        +canConfirm() boolean
        +canDeliver() boolean
        +canReturn() boolean
    }

    class RentalOrderItem {
        +UUID id
        +UUID rentalOrderId
        +UUID costumeVariantId
        +string costumeNameSnapshot
        +string sizeSnapshot
        +int dailyPriceSnapshot
        +int depositSnapshot
        +int quantity
        +int lineRentalFee
        +int lineDeposit
        +calculateLineTotal(days) void
    }

    class RentalStatusHistory {
        +UUID id
        +UUID rentalOrderId
        +OrderStatus fromStatus
        +OrderStatus toStatus
        +UUID changedById
        +string changedByName
        +string note
        +Date createdAt
    }

    User "1" --> "0..*" RefreshSession : owns
    User "1" --> "0..*" RentalOrder : places
    Category "1" --> "0..*" Costume : contains
    Costume "1" --> "1..*" CostumeImage : showcases
    Costume "1" --> "1..*" CostumeVariant : offers
    RentalOrder "1" --> "1..*" RentalOrderItem : consists_of
    CostumeVariant "1" --> "0..*" RentalOrderItem : referenced_by
    RentalOrder "1" --> "1..*" RentalStatusHistory : tracks_history
    User "1" --> "0..*" RentalStatusHistory : executes
```

---

## 4. Máy Trạng Thái Đơn Hàng (Rental Order State Machine)

Vòng đời của đơn thuê trang phục tuân thủ nghiêm ngặt các quy tắc chuyển đổi có điều kiện. Mọi chuyển đổi ngoài danh mục này đều bị hệ thống chặn lại với lỗi 400 Bad Request.

```mermaid
stateDiagram-v2
    [*] --> PENDING : Khách hàng tạo đơn (Hold Stock)
    
    PENDING --> CONFIRMED : Admin xác nhận đơn (Hold Stock)
    PENDING --> REJECTED : Admin từ chối đơn (Release Stock)
    PENDING --> CANCELLED : Khách hàng tự hủy đơn (Release Stock)
    
    CONFIRMED --> RENTING : Admin giao đồ tại quầy & thu tiền (Hold Stock)
    
    RENTING --> RETURNED : Admin nhận trả đồ & hoàn cọc (Release Stock)
    
    REJECTED --> [*]
    CANCELLED --> [*]
    RETURNED --> [*]

    note right of PENDING
        Lịch giữ chỗ: CÓ
        Quyền hủy: Khách hàng (Chủ đơn)
    end note

    note right of CONFIRMED
        Lịch giữ chỗ: CÓ
        Quyền hủy: Chỉ Admin can thiệp
    end note

    note right of RENTING
        Lịch giữ chỗ: CÓ
        Kể cả quá hạn (endDate < hôm nay),
        vẫn tiếp tục giữ chỗ cho tới khi RETURNED.
    end note

    note right of RETURNED
        Lịch giữ chỗ: ĐÃ GIẢI PHÓNG
        Hàng sẵn sàng cho khách khác
        bắt đầu từ ngày tiếp theo.
    end note
```

---

## 5. Thuật Toán Kiểm Tra Tồn Kho Theo Khoảng Ngày (Availability Algorithm)

Quy tắc:
1. Đơn giữ tồn kho: `PENDING`, `CONFIRMED`, `RENTING`.
2. Đơn `RENTING` quá hạn: Nếu $d > \text{endDate}$ nhưng đơn vẫn ở trạng thái `RENTING`, đồ chưa được trả về kho, do đó đơn này tiếp tục tính là chiếm dụng tồn kho tại ngày $d$.
3. Quét từng ngày $d \in [\text{startDate}, \text{endDate}]$:
   - $\text{Reserved}(d) = \sum \text{quantity}$ của các đơn chiếm dụng bao trùm ngày $d$.
   - $\text{Available}(d) = \text{totalQuantity} - \text{outOfServiceQuantity} - \text{Reserved}(d)$.
4. Lượng có thể thuê = $\min_{d \in [\text{startDate}, \text{endDate}]} \text{Available}(d)$.

```mermaid
flowchart TD
    Start(["Bắt đầu: Input (variantId, startDate, endDate)"]) --> ValidateDates{"Kiểm tra Ngày:\nstartDate >= Hôm nay (VN)\nendDate >= startDate?"}
    ValidateDates -- Không hợp lệ --> Err400["Ném lỗi 400: Ngày thuê không hợp lệ"]
    
    ValidateDates -- Hợp lệ --> FetchVariant["Truy vấn Variant:\nLấy totalQuantity & outOfServiceQuantity"]
    FetchVariant --> CheckActive{"Biến thể tồn tại\nvà Trang phục đang kích hoạt?"}
    CheckActive -- Không --> Err404["Ném lỗi 404: Không tìm thấy sản phẩm"]
    
    CheckActive -- Có --> BaseStock["Tính tồn kho cơ sở:\nBaseStock = totalQuantity - outOfServiceQuantity"]
    BaseStock --> QueryActiveBookings["Truy vấn các Đơn thuê đang hoạt động:\nstatus IN ('PENDING', 'CONFIRMED', 'RENTING')\nliên quan đến variantId"]
    
    QueryActiveBookings --> InitLoop["Khởi tạo danh sách ngày D từ startDate đến endDate\nMinAvailable = BaseStock"]
    InitLoop --> ForEachDay{"Còn ngày d trong D?"}
    
    ForEachDay -- Có --> CalcDayReserved["Với ngày d:\nReserved(d) = Tổng số lượng các đơn:\n1) (order.startDate <= d VÀ d <= order.endDate)\n2) HOẶC (order.status == 'RENTING' VÀ d >= order.startDate)"]
    CalcDayReserved --> CalcDayAvail["Available(d) = BaseStock - Reserved(d)"]
    CalcDayAvail --> UpdateMin["MinAvailable = min(MinAvailable, Available(d))"]
    UpdateMin --> ForEachDay
    
    ForEachDay -- Hết ngày --> FinalCheck{"MinAvailable > 0?"}
    FinalCheck -- Có --> RetSuccess(["Trả về: availableQuantity = MinAvailable, isAvailable = true"])
    FinalCheck -- Không --> RetZero(["Trả về: availableQuantity = 0, isAvailable = false"])
```

---

## 6. Sơ Đồ Tuần Tự Tạo Đơn An Toàn Đồng Thời (Concurrent Checkout Sequence)

Để đảm bảo không bị vượt quá số lượng tồn kho (Overselling) khi nhiều khách hàng cùng đặt hàng trong cùng một tích tắc, hệ thống áp dụng cơ chế khóa bi quan (Pessimistic Locking):

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Khách hàng (Client)
    participant RentalsCtrl as RentalsController
    participant RentalsSvc as RentalsService
    participant QueryRunner as TypeORM QueryRunner
    participant VariantRepo as CostumeVariant Repository
    participant DB as PostgreSQL Database

    Customer->>RentalsCtrl: POST /api/v1/rentals (Payload đơn hàng)
    RentalsCtrl->>RentalsCtrl: ValidationPipe (Validate DTO & Types)
    RentalsCtrl->>RentalsSvc: createRental(userId, createRentalDto)
    
    RentalsSvc->>QueryRunner: startTransaction()
    Note over RentalsSvc,DB: Bắt đầu Transaction mức độ cô lập Read Committed
    
    RentalsSvc->>RentalsSvc: Sắp xếp các variantIds tăng dần (Tránh Deadlock)
    RentalsSvc->>VariantRepo: findWithPessimisticWriteLock(sortedVariantIds, queryRunner)
    VariantRepo->>DB: SELECT * FROM costume_variants WHERE id IN (...) ORDER BY id ASC FOR UPDATE
    DB-->>RentalsSvc: Trả về các bản ghi Variant (Đã khóa ghi)

    RentalsSvc->>RentalsSvc: Tính lại giá & Kiểm tra tồn kho từng ngày trong [startDate, endDate]
    alt Không đủ tồn kho trong khoảng ngày
        RentalsSvc->>QueryRunner: rollbackTransaction()
        RentalsSvc-->>RentalsCtrl: Ném ngoại lệ ConflictException (409)
        RentalsCtrl-->>Customer: 409 Conflict: "Sản phẩm đã hết hàng trong khoảng ngày đã chọn"
    else Đủ tồn kho khả dụng
        RentalsSvc->>DB: INSERT INTO rental_orders (..., status = 'PENDING')
        RentalsSvc->>DB: INSERT INTO rental_order_items (Snapshots: tên, size, đơn giá, cọc)
        RentalsSvc->>DB: INSERT INTO rental_status_histories (from: NULL, to: 'PENDING', note: 'Tạo đơn')
        RentalsSvc->>QueryRunner: commitTransaction()
        Note over RentalsSvc,DB: Giải phóng khóa hàng và hoàn tất Transaction
        RentalsSvc-->>RentalsCtrl: Trả về thực thể RentalOrder vừa tạo
        RentalsCtrl-->>Customer: 201 Created (Kèm OrderCode & Thông tin chi tiết)
    end
```

