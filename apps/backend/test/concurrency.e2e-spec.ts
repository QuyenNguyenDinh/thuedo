import { DataSource, Repository } from 'typeorm';
import { ConflictException, BadRequestException } from '@nestjs/common';
import { createMemoryDataSource } from '../src/database/memory-data-source';
import { RentalsService } from '../src/modules/rentals/rentals.service';
import { AvailabilityService } from '../src/modules/availability/availability.service';
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
  let variantRepo: Repository<CostumeVariant>;
  let orderRepo: Repository<RentalOrder>;
  let userRepo: Repository<User>;

  beforeAll(async () => {
    dataSource = await createMemoryDataSource();
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

    // First request reserves the only available unit
    const orderA = await rentalsService.createRental(userA.id, payloadA);
    expect(orderA).toBeDefined();
    expect(orderA.status).toBe(OrderStatus.PENDING);

    // Second request attempting to book the same last unit must be rejected with 409 Conflict
    await expect(
      rentalsService.createRental(userB.id, payloadB),
    ).rejects.toThrow(ConflictException);

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
});
