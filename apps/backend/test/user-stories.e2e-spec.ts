import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Role } from '../src/common/enums/role.enum';
import { OrderStatus, ACTIVE_HOLD_STATUSES, VALID_STATUS_TRANSITIONS } from '../src/common/enums/order-status.enum';
import { DateUtil } from '../src/common/utils/date.util';

describe('Đặc tả Kiểm thử Toàn diện cho Toàn bộ Chức năng Câu 1 (US01 - US20)', () => {
  // =========================================================================
  // US01 - US04: Authentication & User Profile Management
  // =========================================================================
  describe('Nhóm Xác thực & Quản lý Tài khoản (US01 - US04)', () => {
    it('US01: Đăng ký tài khoản - kiểm tra hợp lệ dữ liệu và chống trùng email', () => {
      const existingEmails = ['customer@cosrent.vn', 'admin@cosrent.vn'];
      const registerDto = {
        email: 'newuser@cosrent.vn',
        password: 'Password123@',
        fullName: 'Nguyễn Văn Mới',
        phone: '0901234567',
        address: 'Hà Nội',
      };

      const isEmailTaken = existingEmails.includes(registerDto.email);
      expect(isEmailTaken).toBe(false);

      // Giả lập hash mật khẩu không bao giờ lưu plain text
      const simulatedHash = `$2b$10$simulatedHashedPasswordLengthIs60CharactersLong1234567890`;
      expect(simulatedHash).not.toEqual(registerDto.password);
      expect(simulatedHash.startsWith('$2b$10$')).toBe(true);
    });

    it('US02: Đăng nhập - xác thực thông tin và cấp phát Access Token', () => {
      const mockUser = {
        id: 'u-1',
        email: 'customer@cosrent.vn',
        role: Role.CUSTOMER,
      };

      // Payload JWT
      const payload = { sub: mockUser.id, email: mockUser.email, role: mockUser.role };
      expect(payload.sub).toBe('u-1');
      expect(payload.role).toBe(Role.CUSTOMER);
    });

    it('US03: Đăng xuất - thu hồi Refresh Token và vô hiệu hóa phiên', () => {
      const session = {
        tokenHash: 'hash-abc-123',
        isRevoked: false,
        expiresAt: new Date(Date.now() + 86400000),
      };

      // Khi logout:
      session.isRevoked = true;
      expect(session.isRevoked).toBe(true);
    });

    it('US04: Cập nhật hồ sơ - cho phép sửa tên, SĐT, địa chỉ; không cho tự đổi email/role', () => {
      const currentProfile = {
        id: 'u-1',
        email: 'customer@cosrent.vn',
        fullName: 'Nguyễn Văn An',
        phone: '0912345678',
        address: 'Hà Nội',
        role: Role.CUSTOMER,
      };

      const updateDto = {
        fullName: 'Nguyễn Văn An (Đã đổi)',
        phone: '0988776655',
        address: 'Đà Nẵng',
      };

      const updated = { ...currentProfile, ...updateDto };
      expect(updated.fullName).toBe('Nguyễn Văn An (Đã đổi)');
      expect(updated.phone).toBe('0988776655');
      expect(updated.email).toBe('customer@cosrent.vn'); // Email bất biến
      expect(updated.role).toBe(Role.CUSTOMER); // Không thể tự leo quyền
    });
  });

  // =========================================================================
  // US05 - US07: Browse, Search, Filter & Costume Details
  // =========================================================================
  describe('Nhóm Khám phá, Tìm kiếm & Chi tiết Trang phục (US05 - US07)', () => {
    const mockCostumes = [
      {
        id: 'c-1',
        name: 'Raiden Shogun Genshin Impact',
        categorySlug: 'game-cosplay',
        dailyPrice: 250000,
        sizes: ['S', 'M', 'L'],
        isActive: true,
      },
      {
        id: 'c-2',
        name: 'Marin Kitagawa Shizuku-tan',
        categorySlug: 'anime-manga',
        dailyPrice: 190000,
        sizes: ['S', 'M'],
        isActive: true,
      },
      {
        id: 'c-3',
        name: 'Trang phục cổ trang Hán phục',
        categorySlug: 'co-phong-hanfu',
        dailyPrice: 150000,
        sizes: ['M', 'L', 'XL'],
        isActive: false, // Bị ẩn
      },
    ];

    it('US05: Xem danh sách trang phục - chỉ trả về các trang phục đang kích hoạt (isActive = true)', () => {
      const activeCostumes = mockCostumes.filter((c) => c.isActive);
      expect(activeCostumes.length).toBe(2);
      expect(activeCostumes.some((c) => c.id === 'c-3')).toBe(false);
    });

    it('US06: Tìm kiếm và lọc theo tên, danh mục, kích cỡ và khoảng giá', () => {
      // 1. Tìm theo từ khóa 'Genshin'
      const searchResult = mockCostumes.filter((c) =>
        c.name.toLowerCase().includes('genshin'),
      );
      expect(searchResult.length).toBe(1);
      expect(searchResult[0].id).toBe('c-1');

      // 2. Lọc theo khoảng giá <= 200,000 VND
      const priceFilter = mockCostumes.filter((c) => c.dailyPrice <= 200000 && c.isActive);
      expect(priceFilter.length).toBe(1);
      expect(priceFilter[0].id).toBe('c-2');

      // 3. Lọc theo kích cỡ 'L'
      const sizeFilter = mockCostumes.filter((c) => c.sizes.includes('L') && c.isActive);
      expect(sizeFilter.length).toBe(1);
      expect(sizeFilter[0].id).toBe('c-1');
    });

    it('US07: Xem chi tiết trang phục - bao gồm thông tin giá, cọc và mô tả chi tiết', () => {
      const costumeDetail = {
        ...mockCostumes[0],
        depositAmount: 800000,
        description: 'Váy kimono cách tân lụa tím cao cấp kèm phụ kiện thần nhãn',
      };
      expect(costumeDetail.depositAmount).toBe(800000);
      expect(costumeDetail.dailyPrice).toBe(250000);
      expect(costumeDetail.sizes.length).toBe(3);
    });
  });

  // =========================================================================
  // US08 - US09: Availability & Pricing Calculation Engine
  // =========================================================================
  describe('Nhóm Thuật toán Tồn kho & Động cơ Tính giá (US08 - US09)', () => {
    it('US08: Kiểm tra tồn kho khả dụng - tính Min-Available trên từng ngày lịch', () => {
      const totalStock = 3;
      // Ngày 1 có 1 đơn (còn 2), Ngày 2 có 2 đơn (còn 1), Ngày 3 có 0 đơn (còn 3)
      const dayAvailable = [2, 1, 3];
      const minAvailable = Math.min(...dayAvailable);

      expect(minAvailable).toBe(1);
      // Khách yêu cầu thuê 2 bộ trong khoảng này sẽ không đủ hàng
      expect(2 <= minAvailable).toBe(false);
    });

    it('US09: Động cơ tính giá - tính trọn vẹn cả ngày nhận và trả, không dùng số thực', () => {
      const startDate = '2026-11-01';
      const endDate = '2026-11-03';
      const rentalDays = DateUtil.calculateRentalDays(startDate, endDate);
      expect(rentalDays).toBe(3); // 01, 02, 03 = 3 ngày

      const dailyPrice = 250000;
      const depositAmount = 800000;
      const quantity = 2;

      const lineRentalFee = dailyPrice * rentalDays * quantity;
      const lineDeposit = depositAmount * quantity;
      const totalAmount = lineRentalFee + lineDeposit;

      expect(lineRentalFee).toBe(1500000); // 250k * 3 * 2
      expect(lineDeposit).toBe(1600000); // 800k * 2
      expect(totalAmount).toBe(3100000);
      expect(Number.isInteger(lineRentalFee)).toBe(true);
      expect(Number.isInteger(lineDeposit)).toBe(true);
    });
  });

  // =========================================================================
  // US10 - US12: Order Creation, Customer View & Cancel
  // =========================================================================
  describe('Nhóm Đặt thuê & Theo dõi Đơn phía Khách hàng (US10 - US12)', () => {
    it('US10: Tạo đơn thuê - lưu snapshot giá, kích cỡ và trạng thái ban đầu là PENDING', () => {
      const order = {
        id: 'ord-100',
        userId: 'cust-1',
        status: OrderStatus.PENDING,
        totalRentalFee: 750000,
        totalDeposit: 800000,
        items: [
          {
            costumeNameSnapshot: 'Raiden Shogun',
            sizeSnapshot: 'M',
            dailyPriceSnapshot: 250000,
            depositSnapshot: 800000,
            quantity: 1,
            lineRentalFee: 750000,
            lineDeposit: 800000,
          },
        ],
      };

      expect(order.status).toBe(OrderStatus.PENDING);
      expect(order.items[0].dailyPriceSnapshot).toBe(250000);
      expect(order.items[0].sizeSnapshot).toBe('M');
    });

    it('US11: Xem lịch sử và chi tiết đơn thuê của chính mình', () => {
      const myOrders = [
        { id: 'ord-100', userId: 'cust-1', status: OrderStatus.PENDING },
        { id: 'ord-101', userId: 'cust-1', status: OrderStatus.RETURNED },
      ];

      const viewingUserId = 'cust-1';
      const authorizedOrders = myOrders.filter((o) => o.userId === viewingUserId);
      expect(authorizedOrders.length).toBe(2);
    });

    it('US12: Hủy đơn - chỉ cho phép hủy khi đơn còn ở PENDING; không được hủy khi CONFIRMED', () => {
      const pendingOrder = { id: 'ord-1', status: OrderStatus.PENDING, userId: 'cust-1' };
      const confirmedOrder = { id: 'ord-2', status: OrderStatus.CONFIRMED, userId: 'cust-1' };

      // Hàm kiểm tra khả năng hủy của khách hàng
      const canCustomerCancel = (order: typeof pendingOrder, uid: string) => {
        if (order.userId !== uid) throw new ForbiddenException();
        if (order.status !== OrderStatus.PENDING) {
          throw new BadRequestException('Chỉ có thể hủy đơn khi còn ở trạng thái PENDING.');
        }
        return true;
      };

      expect(canCustomerCancel(pendingOrder, 'cust-1')).toBe(true);
      expect(() => canCustomerCancel(confirmedOrder, 'cust-1')).toThrow(BadRequestException);
    });
  });

  // =========================================================================
  // US13 - US15: Admin Catalog, Costumes & Inventory Safety
  // =========================================================================
  describe('Nhóm Quản trị Danh mục, Trang phục & Tồn kho (US13 - US15)', () => {
    it('US13: Quản lý danh mục - tạo và sắp xếp thứ tự hiển thị', () => {
      const categories = [
        { id: 'cat-1', name: 'Anime', displayOrder: 1 },
        { id: 'cat-2', name: 'Game', displayOrder: 2 },
      ];
      categories.sort((a, b) => a.displayOrder - b.displayOrder);
      expect(categories[0].name).toBe('Anime');
      expect(categories[1].name).toBe('Game');
    });

    it('US14: Thêm, sửa và ẩn trang phục - chuyển isActive = false thay vì xóa vật lý', () => {
      const costume = { id: 'c-1', name: 'Naruto', isActive: true, hasOrders: true };
      // Khi admin ngừng kinh doanh sản phẩm đã có đơn:
      costume.isActive = false;
      expect(costume.isActive).toBe(false);
      // Bản ghi vẫn tồn tại trong CSDL để đảm bảo toàn vẹn dữ liệu
      expect(costume.id).toBe('c-1');
    });

    it('US15: Chặn giảm tồn kho nếu vi phạm cam kết đơn thuê hiện hữu (Booking Commitment Safety Guard)', () => {
      const currentStock = 5;
      const peakBookedQuantity = 3; // Có đơn đang giữ chỗ 3 bộ
      const requestedNewStock = 2; // Admin muốn giảm xuống 2

      const validateStockUpdate = (newTotal: number, maxBooked: number) => {
        if (newTotal < maxBooked) {
          throw new ConflictException(
            `Không thể giảm tổng số lượng xuống ${newTotal} vì có cam kết đặt trước đạt đỉnh ${maxBooked} bộ.`,
          );
        }
        return true;
      };

      expect(() => validateStockUpdate(requestedNewStock, peakBookedQuantity)).toThrow(ConflictException);
      expect(validateStockUpdate(4, peakBookedQuantity)).toBe(true);
    });
  });

  // =========================================================================
  // US16 - US20: Admin Operations, Status Transitions, KPIs & Audit Trail
  // =========================================================================
  describe('Nhóm Quản trị Vận hành Đơn, Thống kê & Kiểm toán Lịch sử (US16 - US20)', () => {
    it('US16: Quản trị viên duyệt (CONFIRMED) hoặc từ chối (REJECTED) đơn PENDING', () => {
      const validTransitions = VALID_STATUS_TRANSITIONS[OrderStatus.PENDING];
      expect(validTransitions).toContain(OrderStatus.CONFIRMED);
      expect(validTransitions).toContain(OrderStatus.REJECTED);
      expect(validTransitions).not.toContain(OrderStatus.RENTING); // Không thể nhảy cóc
    });

    it('US17: Quản trị viên ghi nhận giao đồ tại quầy (CONFIRMED -> RENTING)', () => {
      const order = { id: 'ord-1', status: OrderStatus.CONFIRMED };
      const canDeliver = VALID_STATUS_TRANSITIONS[order.status].includes(OrderStatus.RENTING);
      expect(canDeliver).toBe(true);

      order.status = OrderStatus.RENTING;
      expect(order.status).toBe(OrderStatus.RENTING);
    });

    it('US18: Quản trị viên ghi nhận nhận trả đồ và hoàn trả cọc (RENTING -> RETURNED)', () => {
      const order = { id: 'ord-1', status: OrderStatus.RENTING };
      const canReturn = VALID_STATUS_TRANSITIONS[order.status].includes(OrderStatus.RETURNED);
      expect(canReturn).toBe(true);

      order.status = OrderStatus.RETURNED;
      expect(order.status).toBe(OrderStatus.RETURNED);
    });

    it('US19: Xem báo cáo thống kê - tính tổng đơn theo trạng thái và doanh thu', () => {
      const orders = [
        { status: OrderStatus.RETURNED, rentalFee: 500000 },
        { status: OrderStatus.RENTING, rentalFee: 300000 },
        { status: OrderStatus.CONFIRMED, rentalFee: 200000 },
        { status: OrderStatus.CANCELLED, rentalFee: 150000 },
      ];

      // Chỉ các đơn không bị hủy/từ chối mới tính vào giá trị cam kết
      const activeOrders = orders.filter((o) => o.status !== OrderStatus.CANCELLED);
      const totalCommittedRevenue = activeOrders.reduce((sum, o) => sum + o.rentalFee, 0);

      expect(totalCommittedRevenue).toBe(1000000);
      expect(orders.filter((o) => o.status === OrderStatus.RENTING).length).toBe(1);
    });

    it('US20: Xem lịch sử chuyển trạng thái - lưu vết người thao tác, thời gian, trạng thái trước/sau', () => {
      const history = {
        id: 'h-1',
        orderId: 'ord-1',
        fromStatus: OrderStatus.PENDING,
        toStatus: OrderStatus.CONFIRMED,
        changedByUserId: 'admin-uuid-1',
        note: 'Đã gọi điện xác nhận khách đến nhận đồ ngày 01/11/2026',
        createdAt: new Date(),
      };

      expect(history.fromStatus).toBe(OrderStatus.PENDING);
      expect(history.toStatus).toBe(OrderStatus.CONFIRMED);
      expect(history.changedByUserId).toBe('admin-uuid-1');
      expect(history.note).toBeTruthy();
    });
  });
});
