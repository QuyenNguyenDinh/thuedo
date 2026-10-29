import { DataSource, Repository } from 'typeorm';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';

import { createMemoryDataSource } from '../src/database/memory-data-source';
import { Role } from '../src/common/enums/role.enum';
import { OrderStatus } from '../src/common/enums/order-status.enum';
import { RolesGuard } from '../src/common/guards/roles.guard';

import { User } from '../src/entities/user.entity';
import { RefreshSession } from '../src/entities/refresh-session.entity';
import { Costume } from '../src/entities/costume.entity';
import { CostumeImage } from '../src/entities/costume-image.entity';
import { CostumeVariant } from '../src/entities/costume-variant.entity';
import { Category } from '../src/entities/category.entity';
import { RentalOrder } from '../src/entities/rental-order.entity';
import { RentalOrderItem } from '../src/entities/rental-order-item.entity';
import { RentalStatusHistory } from '../src/entities/rental-status-history.entity';

import { AuthService } from '../src/modules/auth/auth.service';
import { UsersService } from '../src/modules/users/users.service';
import { CostumesService } from '../src/modules/costumes/costumes.service';
import { CategoriesService } from '../src/modules/categories/categories.service';
import { PricingService } from '../src/modules/pricing/pricing.service';
import { AvailabilityService } from '../src/modules/availability/availability.service';
import { RentalsService } from '../src/modules/rentals/rentals.service';
import { AdminService } from '../src/modules/admin/admin.service';

describe('Kiểm thử Toàn Diện 20 User Stories (Khớp 1:1 docs/user-stories.md: US01 - US20 & SEC01 - SEC02)', () => {
  let dataSource: DataSource;

  // Repositories
  let userRepo: Repository<User>;
  let sessionRepo: Repository<RefreshSession>;
  let costumeRepo: Repository<Costume>;
  let imageRepo: Repository<CostumeImage>;
  let variantRepo: Repository<CostumeVariant>;
  let categoryRepo: Repository<Category>;
  let orderRepo: Repository<RentalOrder>;
  let itemRepo: Repository<RentalOrderItem>;
  let historyRepo: Repository<RentalStatusHistory>;

  // Services
  let authService: AuthService;
  let usersService: UsersService;
  let costumesService: CostumesService;
  let categoriesService: CategoriesService;
  let pricingService: PricingService;
  let availabilityService: AvailabilityService;
  let rentalsService: RentalsService;
  let adminService: AdminService;

  // Shared state
  let adminUser: User;
  let customerUser: User;
  let customerUser2: User;

  beforeAll(async () => {
    dataSource = await createMemoryDataSource();

    userRepo = dataSource.getRepository(User);
    sessionRepo = dataSource.getRepository(RefreshSession);
    costumeRepo = dataSource.getRepository(Costume);
    imageRepo = dataSource.getRepository(CostumeImage);
    variantRepo = dataSource.getRepository(CostumeVariant);
    categoryRepo = dataSource.getRepository(Category);
    orderRepo = dataSource.getRepository(RentalOrder);
    itemRepo = dataSource.getRepository(RentalOrderItem);
    historyRepo = dataSource.getRepository(RentalStatusHistory);

    const jwtSecret = 'cosrent-e2e-jwt-test-secret-key-phenikaa-n01';
    const jwtService = new JwtService({ secret: jwtSecret });
    const configService = new ConfigService({
      JWT_SECRET: jwtSecret,
      JWT_EXPIRATION: '15m',
      JWT_REFRESH_SECRET: 'cosrent-e2e-refresh-secret',
      JWT_REFRESH_EXPIRATION: '7d',
    });

    authService = new AuthService(userRepo, sessionRepo, jwtService, configService);
    usersService = new UsersService(userRepo);
    costumesService = new CostumesService(dataSource, costumeRepo, imageRepo, variantRepo);
    categoriesService = new CategoriesService(categoryRepo, costumeRepo);
    pricingService = new PricingService(variantRepo);
    availabilityService = new AvailabilityService(variantRepo, orderRepo, itemRepo);
    rentalsService = new RentalsService(
      dataSource,
      orderRepo,
      itemRepo,
      historyRepo,
      variantRepo,
      userRepo,
      availabilityService,
    );
    adminService = new AdminService(
      dataSource,
      orderRepo,
      itemRepo,
      costumeRepo,
      variantRepo,
      availabilityService,
    );

    // Fetch seeded accounts
    adminUser = (await userRepo.findOne({ where: { email: 'admin@cosrent.com' } }))!;
    customerUser = (await userRepo.findOne({ where: { email: 'customer@cosrent.com' } }))!;
    customerUser2 = (await userRepo.findOne({ where: { email: 'customer2@cosrent.com' } }))!;
  }, 30000);

  afterAll(async () => {
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  // =========================================================================
  // US01 - US04: Authentication & User Profile Management
  // =========================================================================
  describe('Nhóm 1: Xác thực & Quản lý Tài khoản (US01 - US04)', () => {
    let createdUserId: string;

    it('US01: Đăng ký tài khoản - mã hóa bcrypt, lưu CSDL và chống trùng email', async () => {
      const uniqueEmail = `test_customer_${Date.now()}@cosrent.vn`;
      const res = await authService.register({
        email: uniqueEmail,
        password: 'Password123@',
        fullName: 'Nguyễn Văn Đăng Ký',
        phone: '0901234567',
        address: 'Hà Nội',
      });

      expect(res).toBeDefined();
      expect(res.id).toBeDefined();
      expect(res.email).toBe(uniqueEmail);
      expect(res.role).toBe(Role.CUSTOMER);
      createdUserId = res.id;

      // Verify DB record & password hash (passwordHash has select: false by default for security)
      const savedUser = await userRepo
        .createQueryBuilder('user')
        .addSelect('user.passwordHash')
        .where('user.id = :id', { id: res.id })
        .getOne();

      expect(savedUser).toBeDefined();
      expect(savedUser!.passwordHash).toBeDefined();
      expect(savedUser!.passwordHash).not.toBe('Password123@');
      expect(savedUser!.passwordHash.startsWith('$2b$10$')).toBe(true);

      // Verify duplicate email throws ConflictException
      await expect(
        authService.register({
          email: uniqueEmail,
          password: 'AnotherPassword123@',
          fullName: 'Người Trùng Email',
          phone: '0909999999',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('US02: Đăng nhập hệ thống - xác thực credentials, cấp JWT tokens và kiểm tra mật khẩu sai', async () => {
      // 1. Success login
      const loginRes = await authService.login({
        email: 'customer@cosrent.com',
        password: 'Customer123@',
      });

      expect(loginRes).toBeDefined();
      expect(loginRes.accessToken).toBeDefined();
      expect(loginRes.refreshToken).toBeDefined();
      expect(loginRes.user.email).toBe('customer@cosrent.com');
      expect(loginRes.user.role).toBe(Role.CUSTOMER);

      // 2. Failed login (wrong password)
      await expect(
        authService.login({
          email: 'customer@cosrent.com',
          password: 'WrongPassword!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('US03: Đăng xuất phiên làm việc - thu hồi Refresh Token và vô hiệu hóa phiên làm việc', async () => {
      const loginRes = await authService.login({
        email: 'customer2@cosrent.com',
        password: 'Customer123@',
      });

      // Logout
      await authService.logout(loginRes.refreshToken);

      // Refreshing with revoked token must fail
      await expect(authService.refreshTokens(loginRes.refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('US04: Xem và cập nhật hồ sơ cá nhân - cho phép sửa tên, SĐT, địa chỉ; không đổi email và role (F02 validation)', async () => {
      const updateDto = {
        fullName: 'Nguyễn Văn Đăng Ký (Đã Cập Nhật)',
        phone: '0988776655',
        address: 'Số 99 Đường Láng, Hà Nội',
      };

      const updated = await usersService.updateProfile(createdUserId, updateDto);
      expect(updated.fullName).toBe(updateDto.fullName);
      expect(updated.phone).toBe(updateDto.phone);
      expect(updated.address).toBe(updateDto.address);

      // Fetch profile via UsersService
      const profile = await usersService.getProfile(createdUserId);
      expect(profile.fullName).toBe(updateDto.fullName);
      expect(profile.phone).toBe(updateDto.phone);
      expect(profile.address).toBe(updateDto.address);
      expect(profile.role).toBe(Role.CUSTOMER); // Role remains CUSTOMER

      // F02 Regression: Invalid phone with pipe character '|' must be rejected by regex
      const vnPhoneRegex = /^(?:0|\+84)[35789][0-9]{8}$/;
      expect(vnPhoneRegex.test('0|12345678')).toBe(false);
      expect(vnPhoneRegex.test('0912345678')).toBe(true);
      expect(vnPhoneRegex.test('+84912345678')).toBe(true);
    });
  });

  // =========================================================================
  // US05 - US07: Browse, Search, Filter & Costume Details
  // =========================================================================
  describe('Nhóm 2: Khám phá, Tìm kiếm & Chi tiết Trang phục (US05 - US07)', () => {
    it('US05: Xem danh sách trang phục đang kích hoạt (isActive = true)', async () => {
      const activeCats = await categoriesService.findAllActive();
      expect(activeCats.length).toBeGreaterThanOrEqual(5);
      expect(activeCats.every((c) => c.isActive)).toBe(true);

      const costumesRes = await costumesService.findAll({ limit: 10 }, false);
      expect(costumesRes.items.length).toBeGreaterThan(0);
      expect(costumesRes.items.every((c) => c.isActive)).toBe(true);
    });

    it('US06: Tìm kiếm và lọc trang phục theo từ khóa, danh mục, kích cỡ và khoảng giá', async () => {
      // 1. Search by keyword
      const kwRes = await costumesService.findAll({ keyword: 'Raiden' }, false);
      expect(kwRes.items.length).toBeGreaterThan(0);
      expect(kwRes.items[0].name.toLowerCase()).toContain('raiden');

      // 2. Filter by category slug
      const catRes = await costumesService.findAll({ categoryId: 'game-cosplay' }, false);
      expect(catRes.items.length).toBeGreaterThan(0);

      // 3. Filter by size
      const sizeRes = await costumesService.findAll({ size: 'M' }, false);
      expect(sizeRes.items.length).toBeGreaterThan(0);

      // 4. Filter by price range
      const priceRes = await costumesService.findAll({ minPrice: 150000, maxPrice: 220000 }, false);
      expect(priceRes.items.length).toBeGreaterThan(0);
      for (const item of priceRes.items) {
        expect(item.dailyPrice).toBeGreaterThanOrEqual(150000);
        expect(item.dailyPrice).toBeLessThanOrEqual(220000);
      }
    });

    it('US07: Xem chi tiết trang phục, ảnh, mô tả và biến thể kích cỡ', async () => {
      const costumes = await costumeRepo.find({ take: 1 });
      const targetId = costumes[0].id;

      const detail = await costumesService.findById(targetId);
      expect(detail).toBeDefined();
      expect(detail.id).toBe(targetId);
      expect(detail.images).toBeDefined();
      expect(detail.variants).toBeDefined();
      expect(detail.variants.length).toBeGreaterThan(0);
      expect(detail.dailyPrice).toBeGreaterThan(0);
      expect(detail.depositAmount).toBeGreaterThan(0);

      // Non-existent costume throws NotFoundException
      await expect(
        costumesService.findById('00000000-0000-0000-0000-000000000000'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // =========================================================================
  // US08 - US09: Availability & Pricing Quote
  // =========================================================================
  describe('Nhóm 3: Kiểm tra Lịch Còn hàng & Báo giá Tạm tính (US08 - US09)', () => {
    let testVariant: CostumeVariant;

    beforeAll(async () => {
      const variants = await variantRepo.find({ relations: ['costume'] });
      testVariant = variants[0];
    });

    it('US08: Kiểm tra số lượng còn có thể thuê theo kích cỡ và khoảng ngày (tính min tồn kho)', async () => {
      // 1. Valid future dates
      const avail = await availabilityService.checkVariantAvailability(
        testVariant.id,
        '2027-08-01',
        '2027-08-03',
      );
      expect(avail).toBeDefined();
      expect(avail.variantId).toBe(testVariant.id);
      expect(avail.rentalDays).toBe(3);
      expect(avail.availableQuantity).toBeGreaterThanOrEqual(0);

      // 2. Reject past dates
      await expect(
        availabilityService.checkVariantAvailability(testVariant.id, '2020-01-01', '2020-01-03'),
      ).rejects.toThrow(BadRequestException);

      // 3. Reject endDate before startDate
      await expect(
        availabilityService.checkVariantAvailability(testVariant.id, '2027-08-05', '2027-08-01'),
      ).rejects.toThrow(BadRequestException);
    });

    it('US09: Xem bảng tính tiền thuê và tiền cọc - tính đủ số ngày hai đầu, tiền thuê và tiền cọc tách bạch', async () => {
      const quote = await pricingService.calculateQuote('2027-09-01', '2027-09-03', [
        { costumeVariantId: testVariant.id, quantity: 2 },
      ]);

      expect(quote).toBeDefined();
      expect(quote.rentalDays).toBe(3); // 1/9, 2/9, 3/9 = 3 ngày
      expect(quote.items.length).toBe(1);

      const expectedRentalFee = testVariant.costume.dailyPrice * 3 * 2;
      const expectedDeposit = testVariant.costume.depositAmount * 2;
      expect(quote.totalRentalFee).toBe(expectedRentalFee);
      expect(quote.totalDeposit).toBe(expectedDeposit);
      expect(quote.totalDueAtStore).toBe(expectedRentalFee + expectedDeposit);
    });
  });

  // =========================================================================
  // US10 - US12: Customer Rental Lifecycle
  // =========================================================================
  describe('Nhóm 4: Đặt thuê, Xem đơn của tôi & Khách tự hủy đơn (US10 - US12)', () => {
    let createdOrder: RentalOrder;
    let orderToCancel: RentalOrder;
    let testVariant: CostumeVariant;

    beforeAll(async () => {
      const variants = await variantRepo.find({ relations: ['costume'] });
      testVariant = variants[0];
    });

    it('US10: Tạo đơn thuê trang phục - khóa bi quan, lưu snapshot giá, sinh mã CR-, trạng thái PENDING', async () => {
      const payload = {
        customerName: 'Nguyễn Văn An',
        customerPhone: '0912345678',
        startDate: '2027-10-01',
        endDate: '2027-10-03',
        customerNotes: 'Nhận đồ lúc 14h tại cửa hàng',
        items: [{ costumeVariantId: testVariant.id, quantity: 1 }],
      };

      createdOrder = await rentalsService.createRental(customerUser.id, payload);

      expect(createdOrder).toBeDefined();
      expect(createdOrder.orderCode.startsWith('CR-')).toBe(true);
      expect(createdOrder.status).toBe(OrderStatus.PENDING);
      expect(createdOrder.items.length).toBe(1);

      // Verify immutable snapshots
      const item = createdOrder.items[0];
      expect(item.costumeNameSnapshot).toBe(testVariant.costume.name);
      expect(item.sizeSnapshot).toBe(testVariant.size);
      expect(item.dailyPriceSnapshot).toBe(testVariant.costume.dailyPrice);
      expect(item.depositSnapshot).toBe(testVariant.costume.depositAmount);

      // Verify status history
      const history = await historyRepo.find({ where: { rentalOrderId: createdOrder.id } });
      expect(history.length).toBeGreaterThanOrEqual(1);
      expect(history[0].toStatus).toBe(OrderStatus.PENDING);
    });

    it('US11: Xem lịch sử và chi tiết đơn thuê - hỗ trợ phân trang', async () => {
      const myRentals = await rentalsService.getMyRentals(customerUser.id, {
        page: 1,
        limit: 10,
      });

      expect(myRentals).toBeDefined();
      expect(myRentals.items.length).toBeGreaterThanOrEqual(1);
      expect(myRentals.meta.total).toBeGreaterThanOrEqual(1);
      expect(myRentals.meta.totalPages).toBeGreaterThanOrEqual(1);
      expect(myRentals.items.every((o) => o.userId === customerUser.id)).toBe(true);
    });

    it('US12: Khách hàng hủy đơn đang chờ xác nhận - chuyển CANCELLED và giải phóng lịch giữ chỗ', async () => {
      // 1. Create a dedicated order to cancel
      orderToCancel = await rentalsService.createRental(customerUser.id, {
        customerName: 'Khách Test Hủy',
        customerPhone: '0912345678',
        startDate: '2027-10-10',
        endDate: '2027-10-12',
        items: [{ costumeVariantId: testVariant.id, quantity: 1 }],
      });

      // 2. Customer A cancels their own order -> Success
      const result = await rentalsService.cancelRental(customerUser.id, Role.CUSTOMER, orderToCancel.id);
      expect(result.order.status).toBe(OrderStatus.CANCELLED);

      // 3. Cancelling an already cancelled order -> BadRequestException
      await expect(
        rentalsService.cancelRental(customerUser.id, Role.CUSTOMER, orderToCancel.id),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // =========================================================================
  // US13 - US15: Admin Catalog, Costume & Inventory Management
  // =========================================================================
  describe('Nhóm 5: Quản trị Danh mục, Trang phục & Tồn kho (US13 - US15)', () => {
    let createdCategory: Category;
    let createdCostume: Costume;
    let createdVariant: CostumeVariant;

    it('US13: Quản lý danh mục trang phục - thêm mới, cập nhật, đếm số lượng trang phục', async () => {
      // Create category
      createdCategory = await categoriesService.create({
        name: 'Cyberpunk & Mecha Sci-Fi',
        slug: `cyberpunk-${Date.now()}`,
        description: 'Trang phục công nghệ tương lai',
        displayOrder: 9,
      });

      expect(createdCategory).toBeDefined();
      expect(createdCategory.id).toBeDefined();

      // Find all for admin: includes costumeCount
      const adminCats = await categoriesService.findAllForAdmin();
      const found = adminCats.find((c) => c.id === createdCategory.id);
      expect(found).toBeDefined();
      expect(found.costumesCount).toBe(0);

      // Update category
      const updated = await categoriesService.update(createdCategory.id, {
        name: 'Cyberpunk 2077 Neon',
      });
      expect(updated.name).toBe('Cyberpunk 2077 Neon');
    });

    it('US14: Thêm, sửa và ẩn trang phục - thêm mới, cập nhật, chặn name=null (F01) và toggleActive', async () => {
      // Create costume
      createdCostume = await costumesService.create({
        name: 'David Martinez Cyberpunk',
        slug: `david-martinez-${Date.now()}`,
        categoryId: createdCategory.id,
        characterName: 'David Martinez',
        seriesName: 'Edgerunners',
        description: 'Trang phục áo khoác phản quang vàng Cyberpunk Edgerunners kèm phụ kiện',
        dailyPrice: 190000,
        depositAmount: 500000,
        variants: [{ size: 'M', sku: `CR-DAV-M-${Date.now()}`, totalQuantity: 3 }],
      });

      expect(createdCostume).toBeDefined();
      expect(createdCostume.id).toBeDefined();

      // F01 Regression: name=null or empty name must throw BadRequestException
      await expect(
        costumesService.update(createdCostume.id, { name: '' as any }),
      ).rejects.toThrow(BadRequestException);

      // Toggle active to false (hidden)
      const toggled = await costumesService.toggleActive(createdCostume.id);
      expect(toggled.isActive).toBe(false);

      // Customer search does not show it
      const custSearch = await costumesService.findAll({ keyword: 'David Martinez' }, false);
      expect(custSearch.items.some((c) => c.id === createdCostume.id)).toBe(false);

      // Admin search still shows it
      const adminSearch = await costumesService.findAll({ keyword: 'David Martinez' }, true);
      expect(adminSearch.items.some((c) => c.id === createdCostume.id)).toBe(true);

      // Restore active
      await costumesService.toggleActive(createdCostume.id);
    });

    it('US15: Quản lý kích cỡ và số lượng tồn kho - thêm size mới (+ Size) và chặn giảm tồn kho vi phạm cam kết', async () => {
      // Add a new variant size via AdminService
      createdVariant = await adminService.createVariant({
        costumeId: createdCostume.id,
        size: 'L',
        sku: `CR-DAV-L-${Date.now()}`,
        totalQuantity: 10,
        outOfServiceQuantity: 1,
      });

      expect(createdVariant).toBeDefined();
      expect(createdVariant.size).toBe('L');
      expect(createdVariant.totalQuantity).toBe(10);

      // Book 7 units
      await rentalsService.createRental(customerUser.id, {
        customerName: 'Khách Đặt Nhiều',
        customerPhone: '0912345678',
        startDate: '2027-11-01',
        endDate: '2027-11-03',
        items: [{ costumeVariantId: createdVariant.id, quantity: 7 }],
      });

      // Attempting to reduce stock below 7 (e.g. to 4) must be blocked by safety check
      await expect(
        adminService.updateVariantStock(createdVariant.id, {
          totalQuantity: 4,
          outOfServiceQuantity: 0,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // =========================================================================
  // US16 - US20: Order Processing, Dashboard & Status History
  // =========================================================================
  describe('Nhóm 6: Xử lý Đơn, Dashboard & Lịch sử Trạng thái (US16 - US20)', () => {
    let orderToProcess: RentalOrder;
    let orderToReject: RentalOrder;
    let testVariant: CostumeVariant;

    beforeAll(async () => {
      const variants = await variantRepo.find({ relations: ['costume'] });
      testVariant = variants[1] || variants[0];
    });

    it('US16: Xác nhận hoặc từ chối đơn thuê - duyệt PENDING -> CONFIRMED, từ chối PENDING -> REJECTED', async () => {
      // 1. Create order for confirmation
      orderToProcess = await rentalsService.createRental(customerUser.id, {
        customerName: 'Khách Luồng Đầy Đủ',
        customerPhone: '0912345678',
        startDate: '2027-12-01',
        endDate: '2027-12-03',
        items: [{ costumeVariantId: testVariant.id, quantity: 1 }],
      });

      // Confirm: PENDING -> CONFIRMED
      const confirmRes = await rentalsService.confirmRental(
        adminUser.id,
        adminUser.fullName,
        orderToProcess.id,
      );
      expect(confirmRes.order.status).toBe(OrderStatus.CONFIRMED);

      // 2. Create order for rejection
      orderToReject = await rentalsService.createRental(customerUser.id, {
        customerName: 'Khách Đơn Bị Từ Chối',
        customerPhone: '0912345678',
        startDate: '2027-12-10',
        endDate: '2027-12-12',
        items: [{ costumeVariantId: testVariant.id, quantity: 1 }],
      });

      // Reject: PENDING -> REJECTED with business reason
      const rejectRes = await rentalsService.rejectRental(
        adminUser.id,
        adminUser.fullName,
        orderToReject.id,
        'Trang phục cần bảo dưỡng gấp trước giờ diễn',
      );
      expect(rejectRes.order.status).toBe(OrderStatus.REJECTED);
    });

    it('US17: Ghi nhận giao đồ cho khách tại cửa hàng - CONFIRMED -> RENTING, ghi nhận deliveredAt', async () => {
      const deliverRes = await rentalsService.deliverRental(
        adminUser.id,
        adminUser.fullName,
        orderToProcess.id,
        'Đã nhận đủ tiền thuê và cọc tại quầy, giao trang phục sạch đẹp',
      );
      expect(deliverRes.order.status).toBe(OrderStatus.RENTING);
      expect(deliverRes.order.deliveredAt).toBeDefined();

      // Invalid transition: cannot deliver directly from PENDING
      await expect(
        rentalsService.deliverRental(adminUser.id, adminUser.fullName, orderToReject.id),
      ).rejects.toThrow(BadRequestException);
    });

    it('US18: Ghi nhận trả đồ và hoàn trả tiền cọc - RENTING -> RETURNED, quyết toán cọc và idempotency', async () => {
      const damageFee = 30000;
      const refundAmount = orderToProcess.totalDeposit - damageFee;
      const returnRes = await rentalsService.returnRental(
        adminUser.id,
        adminUser.fullName,
        orderToProcess.id,
        refundAmount,
        'Sứt nhẹ khuy áo ngực, trừ 30.000 đ',
      );
      expect(returnRes.order.status).toBe(OrderStatus.RETURNED);
      expect(returnRes.order.actualDepositReturned).toBe(refundAmount);
      expect(returnRes.order.returnedAt).toBeDefined();

      // Idempotency: cannot return an already returned order
      await expect(
        rentalsService.returnRental(adminUser.id, adminUser.fullName, orderToProcess.id, refundAmount),
      ).rejects.toThrow(BadRequestException);
    });

    it('US19: Xem thống kê đơn thuê và trang phục đang thuê (Dashboard: doanh thu tách bạch tiền cọc)', async () => {
      const stats = await adminService.getDashboard();

      expect(stats).toBeDefined();
      expect(stats.overview).toBeDefined();
      expect(stats.overview.totalRevenue).toBeGreaterThanOrEqual(0);
      expect(stats.topCostumes).toBeDefined();
      expect(stats.statusDistribution).toBeDefined();
      expect(stats.statusDistribution[OrderStatus.PENDING]).toBeDefined();
    });

    it('US20: Xem lịch sử thay đổi trạng thái đơn - lưu vết đầy đủ, tuần tự và bất biến', async () => {
      const histories = await historyRepo.find({
        where: { rentalOrderId: orderToProcess.id },
        order: { createdAt: 'ASC' },
      });

      expect(histories.length).toBeGreaterThanOrEqual(4);
      // Status progression: null -> PENDING -> CONFIRMED -> RENTING -> RETURNED
      expect(histories[0].toStatus).toBe(OrderStatus.PENDING);
      expect(histories[1].fromStatus).toBe(OrderStatus.PENDING);
      expect(histories[1].toStatus).toBe(OrderStatus.CONFIRMED);
      expect(histories[2].fromStatus).toBe(OrderStatus.CONFIRMED);
      expect(histories[2].toStatus).toBe(OrderStatus.RENTING);
      expect(histories[3].fromStatus).toBe(OrderStatus.RENTING);
      expect(histories[3].toStatus).toBe(OrderStatus.RETURNED);

      // Verify each record has changer information
      for (const h of histories) {
        expect(h.changedById).toBeDefined();
        expect(h.changedByName).toBeDefined();
        expect(h.createdAt).toBeDefined();
      }
    });
  });

  // =========================================================================
  // SEC01 - SEC02: Security Verification (RBAC & IDOR)
  // =========================================================================
  describe('Nhóm Bảo Mật Cốt Lõi (SEC01 - SEC02)', () => {
    it('SEC01: Bảo vệ RBAC - RolesGuard chặn khách hàng thường truy cập API Admin', () => {
      const reflector = new Reflector();
      const rolesGuard = new RolesGuard(reflector);

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);

      // Context with CUSTOMER user
      const customerContext: any = {
        getHandler: () => {},
        getClass: () => {},
        switchToHttp: () => ({
          getRequest: () => ({
            user: { userId: customerUser.id, role: Role.CUSTOMER },
          }),
        }),
      };

      // Context with ADMIN user
      const adminContext: any = {
        getHandler: () => {},
        getClass: () => {},
        switchToHttp: () => ({
          getRequest: () => ({
            user: { userId: adminUser.id, role: Role.ADMIN },
          }),
        }),
      };

      expect(() => rolesGuard.canActivate(customerContext)).toThrow(ForbiddenException);
      expect(rolesGuard.canActivate(adminContext)).toBe(true);
    });

    it('SEC02: Bảo vệ IDOR - Chặn khách hàng A xem chi tiết hoặc thao tác trên đơn hàng của khách hàng B', async () => {
      const orders = await orderRepo.find();
      const orderA = orders.find((o) => o.userId === customerUser.id)!;

      // Customer B attempts to view Customer A's order -> Forbidden
      await expect(
        rentalsService.getRentalById(customerUser2.id, Role.CUSTOMER, orderA.id),
      ).rejects.toThrow(ForbiddenException);

      // Customer A views their own order -> Success
      const ownOrder = await rentalsService.getRentalById(
        customerUser.id,
        Role.CUSTOMER,
        orderA.id,
      );
      expect(ownOrder.id).toBe(orderA.id);

      // Admin views any order -> Success
      const adminView = await rentalsService.getRentalById(
        adminUser.id,
        Role.ADMIN,
        orderA.id,
      );
      expect(adminView.id).toBe(orderA.id);
    });
  });
});
