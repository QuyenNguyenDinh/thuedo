import { DataSource, Repository } from 'typeorm';
import { ConflictException, BadRequestException } from '@nestjs/common';
import { createMemoryDataSource } from '../src/database/memory-data-source';
import { RentalsService } from '../src/modules/rentals/rentals.service';
import { AvailabilityService } from '../src/modules/availability/availability.service';
import { AdminService } from '../src/modules/admin/admin.service';
import { Costume } from '../src/entities/costume.entity';
import { CostumeVariant } from '../src/entities/costume-variant.entity';
import { RentalOrder } from '../src/entities/rental-order.entity';
import { RentalOrderItem } from '../src/entities/rental-order-item.entity';
import { RentalStatusHistory } from '../src/entities/rental-status-history.entity';
import { User } from '../src/entities/user.entity';
import { OrderStatus } from '../src/common/enums/order-status.enum';
import { DateUtil } from '../src/common/utils/date.util';

describe('Real Database Concurrency & Race Condition Integration Test', () => {
  let dataSource: DataSource;
  let rentalsService: RentalsService;
  let availabilityService: AvailabilityService;
  let adminService: AdminService;
  let variantRepo: Repository<CostumeVariant>;
  let orderRepo: Repository<RentalOrder>;
  let userRepo: Repository<User>;

  beforeAll(async () => {
    dataSource = await createMemoryDataSource();
    const costumeRepo = dataSource.getRepository(Costume);
    variantRepo = dataSource.getRepository(CostumeVariant);
    orderRepo = dataSource.getRepository(RentalOrder);
    const itemRepo = dataSource.getRepository(RentalOrderItem);
    const historyRepo = dataSource.getRepository(RentalStatusHistory);
    userRepo = dataSource.getRepository(User);

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
  }, 30000);

  afterAll(async () => {
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  it('1. should prevent race condition & overselling when two checkout requests book the last stock unit', async () => {
    // Pick an existing variant from seed data
    const variants = await variantRepo.find({ relations: ['costume'] });
    expect(variants.length).toBeGreaterThan(0);
    const targetVariant = variants[0];

    // Set stock to exactly 1
    targetVariant.totalQuantity = 1;
    targetVariant.outOfServiceQuantity = 0;
    await variantRepo.save(targetVariant);

    const customers = await userRepo.find({ where: { role: 'CUSTOMER' as any } });
    const userA = customers[0];
    const userB = customers.length > 1 ? customers[1] : customers[0];

    // Dates for rental
    const startDate = '2027-01-10';
    const endDate = '2027-01-12';

    const payloadA = {
      customerName: 'Khách hàng A',
      customerPhone: '0901111111',
      startDate,
      endDate,
      items: [{ costumeVariantId: targetVariant.id, quantity: 1 }],
    };

    const payloadB = {
      customerName: 'Khách hàng B',
      customerPhone: '0902222222',
      startDate,
      endDate,
      items: [{ costumeVariantId: targetVariant.id, quantity: 1 }],
    };

    // Fire both requests concurrently using Promise.allSettled
    const results = await Promise.allSettled([
      rentalsService.createRental(userA.id, payloadA),
      rentalsService.createRental(userB.id, payloadB),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled') as PromiseFulfilledResult<RentalOrder>[];
    const rejected = results.filter((r) => r.status === 'rejected') as PromiseRejectedResult[];

    // Exactly 1 checkout succeeds, and exactly 1 fails due to stock depletion
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(fulfilled[0].value.status).toBe(OrderStatus.PENDING);
    expect(rejected[0].reason).toBeInstanceOf(ConflictException);

    // Verify stock availability afterwards is 0
    const availAfter = await availabilityService.checkVariantAvailability(
      targetVariant.id,
      startDate,
      endDate,
    );
    expect(availAfter.availableQuantity).toBe(0);
    expect(availAfter.isAvailable).toBe(false);
  });

  it('2. should reject duplicate variant IDs in the same order (E02)', async () => {
    const variants = await variantRepo.find();
    const targetVariant = variants[0];
    const customers = await userRepo.find({ where: { role: 'CUSTOMER' as any } });

    const duplicatePayload = {
      customerName: 'Trùng lặp variant',
      customerPhone: '0903333333',
      startDate: '2027-03-01',
      endDate: '2027-03-03',
      items: [
        { costumeVariantId: targetVariant.id, quantity: 1 },
        { costumeVariantId: targetVariant.id, quantity: 1 },
      ],
    };

    await expect(
      rentalsService.createRental(customers[0].id, duplicatePayload),
    ).rejects.toThrow(BadRequestException);
  });

  it('3. should reject non-existent calendar dates like 2027-02-30 (E08)', () => {
    expect(() => {
      DateUtil.calculateRentalDays('2027-02-30', '2027-02-30');
    }).toThrow('không tồn tại trên lịch thực tế');
  });

  it('4. should reject refunding more than total deposit (E08)', async () => {
    const admins = await userRepo.find({ where: { role: 'ADMIN' as any } });
    const admin = admins[0];

    // Find or create an order in RENTING status
    const variants = await variantRepo.find({ relations: ['costume'] });
    const customers = await userRepo.find({ where: { role: 'CUSTOMER' as any } });

    const order = await rentalsService.createRental(customers[0].id, {
      customerName: 'Khách test hoàn cọc',
      customerPhone: '0904444444',
      startDate: '2027-04-10',
      endDate: '2027-04-12',
      items: [{ costumeVariantId: variants[0].id, quantity: 1 }],
    });

    // Advance to CONFIRMED then RENTING
    await rentalsService.confirmRental(admin.id, admin.fullName, order.id);
    await rentalsService.deliverRental(admin.id, admin.fullName, order.id);

    // Attempt to refund more than totalDeposit
    const invalidRefund = order.totalDeposit + 500000;
    await expect(
      rentalsService.returnRental(admin.id, admin.fullName, order.id, invalidRefund),
    ).rejects.toThrow(BadRequestException);

    // Valid refund within bounds should succeed
    const validReturn = await rentalsService.returnRental(
      admin.id,
      admin.fullName,
      order.id,
      order.totalDeposit,
    );
    expect(validReturn.order.status).toBe(OrderStatus.RETURNED);
    expect(validReturn.order.actualDepositReturned).toBe(order.totalDeposit);
  });

  it('5. should handle concurrent rental checkout and admin stock reduction safely without overselling', async () => {
    const variants = await variantRepo.find({ relations: ['costume'] });
    const targetVariant = variants[1] || variants[0];

    // Set stock to 2
    targetVariant.totalQuantity = 2;
    targetVariant.outOfServiceQuantity = 0;
    await variantRepo.save(targetVariant);

    const customers = await userRepo.find({ where: { role: 'CUSTOMER' as any } });
    const customer = customers[0];

    const rentalPayload = {
      customerName: 'Khách Đặt Cạnh Tranh',
      customerPhone: '0905555555',
      startDate: '2027-05-10',
      endDate: '2027-05-12',
      items: [{ costumeVariantId: targetVariant.id, quantity: 2 }],
    };

    // Concurrently: customer tries to book 2 units, and admin tries to reduce stock to 0
    const [rentalResult, adminResult] = await Promise.allSettled([
      rentalsService.createRental(customer.id, rentalPayload),
      adminService.updateVariantStock(targetVariant.id, { totalQuantity: 0, outOfServiceQuantity: 0 }),
    ]);

    // Either rental succeeded first (blocking admin from reducing to 0)
    // OR admin reduced to 0 first (blocking rental due to 0 available stock)
    // Under no circumstances can both succeed with overselling!
    const bothSucceeded = rentalResult.status === 'fulfilled' && adminResult.status === 'fulfilled';
    expect(bothSucceeded).toBe(false);

    // Verify database state is consistent
    const activeOrders = await orderRepo
      .createQueryBuilder('order')
      .innerJoin('order.items', 'item')
      .where('item.costumeVariantId = :variantId', { variantId: targetVariant.id })
      .andWhere('order.startDate = :startDate', { startDate: '2027-05-10' })
      .getMany();

    const freshVariant = await variantRepo.findOne({ where: { id: targetVariant.id } });
    expect(activeOrders.length * 2).toBeLessThanOrEqual(freshVariant!.totalQuantity);
  });
});
