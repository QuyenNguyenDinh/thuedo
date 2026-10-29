import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { RentalsService } from '../../src/modules/rentals/rentals.service';
import { RentalOrder } from '../../src/entities/rental-order.entity';
import { RentalOrderItem } from '../../src/entities/rental-order-item.entity';
import { RentalStatusHistory } from '../../src/entities/rental-status-history.entity';
import { CostumeVariant } from '../../src/entities/costume-variant.entity';
import { User } from '../../src/entities/user.entity';
import { AvailabilityService } from '../../src/modules/availability/availability.service';
import { OrderStatus } from '../../src/common/enums/order-status.enum';
import { Role } from '../../src/common/enums/role.enum';

describe('Rental Order State Machine & Business Rules (Unit Test)', () => {
  let service: RentalsService;
  let mockOrderRepo: any;
  let mockHistoryRepo: any;
  let mockUserRepo: any;

  beforeEach(async () => {
    mockOrderRepo = {
      findOne: jest.fn(),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    };
    mockHistoryRepo = {
      create: jest.fn().mockImplementation((entity) => entity),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    };
    mockUserRepo = {
      findOne: jest.fn(),
    };

    const mockManager = {
      createQueryBuilder: jest.fn().mockReturnValue({
        setLock: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockImplementation(() => mockOrderRepo.findOne()),
      }),
      findOne: jest.fn().mockImplementation((entityClass, options) => {
        if (entityClass === User) return mockUserRepo.findOne(options);
        return mockOrderRepo.findOne(options);
      }),
      create: jest.fn().mockImplementation((entityClass, data) => {
        if (entityClass === RentalStatusHistory) return mockHistoryRepo.create(data);
        return data;
      }),
      save: jest.fn().mockImplementation((arg1, arg2) => {
        if (arg1 === RentalStatusHistory) {
          return mockHistoryRepo.save(arg2);
        }
        const entity = arg2 !== undefined ? arg2 : arg1;
        return mockOrderRepo.save(entity);
      }),
    };

    const mockDataSource = {
      transaction: jest.fn().mockImplementation(async (cb) => cb(mockManager)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RentalsService,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: getRepositoryToken(RentalOrder),
          useValue: mockOrderRepo,
        },
        {
          provide: getRepositoryToken(RentalOrderItem),
          useValue: {},
        },
        {
          provide: getRepositoryToken(RentalStatusHistory),
          useValue: mockHistoryRepo,
        },
        {
          provide: getRepositoryToken(CostumeVariant),
          useValue: {},
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
        {
          provide: AvailabilityService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<RentalsService>(RentalsService);
  });

  describe('Customer Cancellation (US12)', () => {
    it('should allow customer to cancel their own order when status is PENDING', async () => {
      mockOrderRepo.findOne.mockResolvedValue({
        id: 'ord-1',
        userId: 'user-cust-1',
        status: OrderStatus.PENDING,
      });
      mockUserRepo.findOne.mockResolvedValue({
        id: 'user-cust-1',
        fullName: 'Nguyễn Văn An',
      });

      const res = await service.cancelRental('user-cust-1', Role.CUSTOMER, 'ord-1', 'Không còn nhu cầu');

      expect(res.order.status).toBe(OrderStatus.CANCELLED);
      expect(mockHistoryRepo.save).toHaveBeenCalled();
    });

    it('should block customer from cancelling another customer order (IDOR)', async () => {
      mockOrderRepo.findOne.mockResolvedValue({
        id: 'ord-1',
        userId: 'user-victim',
        status: OrderStatus.PENDING,
      });

      await expect(
        service.cancelRental('user-attacker', Role.CUSTOMER, 'ord-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should block customer from cancelling order when status is CONFIRMED or RENTING', async () => {
      mockOrderRepo.findOne.mockResolvedValue({
        id: 'ord-1',
        userId: 'user-cust-1',
        status: OrderStatus.CONFIRMED,
      });

      await expect(
        service.cancelRental('user-cust-1', Role.CUSTOMER, 'ord-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Admin State Transitions (US16, US17, US18)', () => {
    it('should transition PENDING -> CONFIRMED on admin confirm', async () => {
      mockOrderRepo.findOne.mockResolvedValue({
        id: 'ord-1',
        status: OrderStatus.PENDING,
      });

      const res = await service.confirmRental('admin-1', 'Admin Quản Lý', 'ord-1');
      expect(res.order.status).toBe(OrderStatus.CONFIRMED);
    });

    it('should transition CONFIRMED -> RENTING on handover delivery', async () => {
      mockOrderRepo.findOne.mockResolvedValue({
        id: 'ord-1',
        status: OrderStatus.CONFIRMED,
      });

      const res = await service.deliverRental('admin-1', 'Admin Quản Lý', 'ord-1', 'Giao đủ phụ kiện');
      expect(res.order.status).toBe(OrderStatus.RENTING);
      expect(res.order.deliveredAt).toBeDefined();
    });

    it('should transition RENTING -> RETURNED and record deposit returned', async () => {
      mockOrderRepo.findOne.mockResolvedValue({
        id: 'ord-1',
        status: OrderStatus.RENTING,
        totalDeposit: 600000,
      });

      const res = await service.returnRental('admin-1', 'Admin Quản Lý', 'ord-1', 600000, 'Đồ tốt');
      expect(res.order.status).toBe(OrderStatus.RETURNED);
      expect(res.order.actualDepositReturned).toBe(600000);
      expect(res.order.returnedAt).toBeDefined();
    });

    it('should enforce idempotency: throw error if return is called twice on RETURNED order', async () => {
      mockOrderRepo.findOne.mockResolvedValue({
        id: 'ord-1',
        status: OrderStatus.RETURNED, // already returned!
      });

      await expect(
        service.returnRental('admin-1', 'Admin Quản Lý', 'ord-1', 600000),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject invalid transition: PENDING directly to RENTING without CONFIRMED', async () => {
      mockOrderRepo.findOne.mockResolvedValue({
        id: 'ord-1',
        status: OrderStatus.PENDING, // not confirmed yet
      });

      await expect(
        service.deliverRental('admin-1', 'Admin Quản Lý', 'ord-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});

