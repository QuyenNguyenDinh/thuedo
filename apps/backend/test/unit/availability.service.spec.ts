import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AvailabilityService } from '../../src/modules/availability/availability.service';
import { CostumeVariant } from '../../src/entities/costume-variant.entity';
import { RentalOrder } from '../../src/entities/rental-order.entity';
import { RentalOrderItem } from '../../src/entities/rental-order-item.entity';
import { OrderStatus } from '../../src/common/enums/order-status.enum';

describe('AvailabilityService (Unit Test)', () => {
  let service: AvailabilityService;
  let mockVariantRepo: any;
  let mockOrderRepo: any;
  let mockOrderItemRepo: any;

  beforeEach(async () => {
    mockVariantRepo = {
      findOne: jest.fn(),
    };
    mockOrderRepo = {
      find: jest.fn(),
    };
    mockOrderItemRepo = {
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvailabilityService,
        {
          provide: getRepositoryToken(CostumeVariant),
          useValue: mockVariantRepo,
        },
        {
          provide: getRepositoryToken(RentalOrder),
          useValue: mockOrderRepo,
        },
        {
          provide: getRepositoryToken(RentalOrderItem),
          useValue: mockOrderItemRepo,
        },
      ],
    }).compile();

    service = module.get<AvailabilityService>(AvailabilityService);
  });

  describe('checkVariantAvailability', () => {
    it('should compute minimum available stock across all days in range', async () => {
      mockVariantRepo.findOne.mockResolvedValue({
        id: 'var-1',
        totalQuantity: 3,
        outOfServiceQuantity: 0,
        costume: { id: 'cos-1', name: 'Raiden Shogun', isActive: true },
      });

      // Two overlapping orders on 2026-11-11:
      // Order 1: 10/11 -> 11/11, qty = 1
      // Order 2: 11/11 -> 12/11, qty = 1
      const mockItems = [
        {
          quantity: 1,
          rentalOrder: {
            id: 'ord-1',
            status: OrderStatus.CONFIRMED,
            startDate: '2026-11-10',
            endDate: '2026-11-11',
          },
        },
        {
          quantity: 1,
          rentalOrder: {
            id: 'ord-2',
            status: OrderStatus.PENDING,
            startDate: '2026-11-11',
            endDate: '2026-11-12',
          },
        },
      ];

      const qbMock = {
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockItems),
      };
      mockOrderItemRepo.createQueryBuilder.mockReturnValue(qbMock);

      const result = await service.checkVariantAvailability('var-1', '2026-11-10', '2026-11-12');

      // Day 10: 3 - 1 = 2
      // Day 11: 3 - 2 = 1
      // Day 12: 3 - 1 = 2
      // Min available = 1
      expect(result.availableQuantity).toBe(1);
      expect(result.isAvailable).toBe(true);
    });

    it('should NOT falsely accumulate non-overlapping orders in a long range query', async () => {
      mockVariantRepo.findOne.mockResolvedValue({
        id: 'var-1',
        totalQuantity: 2,
        outOfServiceQuantity: 0,
        costume: { id: 'cos-1', name: 'Anya', isActive: true },
      });

      // Order A: 01/11 -> 02/11 (qty 2)
      // Order B: 05/11 -> 06/11 (qty 2)
      // They do NOT overlap on 03/11 or 04/11.
      const mockItems = [
        {
          quantity: 2,
          rentalOrder: {
            id: 'ord-a',
            status: OrderStatus.CONFIRMED,
            startDate: '2026-11-01',
            endDate: '2026-11-02',
          },
        },
        {
          quantity: 2,
          rentalOrder: {
            id: 'ord-b',
            status: OrderStatus.CONFIRMED,
            startDate: '2026-11-05',
            endDate: '2026-11-06',
          },
        },
      ];

      const qbMock = {
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockItems),
      };
      mockOrderItemRepo.createQueryBuilder.mockReturnValue(qbMock);

      // Query range: 2026-11-03 to 2026-11-04 (neither order overlaps!)
      const result = await service.checkVariantAvailability('var-1', '2026-11-03', '2026-11-04');

      expect(result.availableQuantity).toBe(2);
      expect(result.isAvailable).toBe(true);
    });

    it('should continue holding stock for overdue RENTING orders', async () => {
      mockVariantRepo.findOne.mockResolvedValue({
        id: 'var-1',
        totalQuantity: 1,
        outOfServiceQuantity: 0,
        costume: { id: 'cos-1', name: 'Furina', isActive: true },
      });

      // An overdue order in RENTING status:
      // startDate: 2026-10-20, endDate: 2026-10-22, status: RENTING (still not returned!)
      const mockItems = [
        {
          quantity: 1,
          rentalOrder: {
            id: 'ord-overdue',
            status: OrderStatus.RENTING,
            startDate: '2026-10-20',
            endDate: '2026-10-22',
          },
        },
      ];

      const qbMock = {
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockItems),
      };
      mockOrderItemRepo.createQueryBuilder.mockReturnValue(qbMock);

      // Customer tries to rent for 2026-11-10 to 2026-11-12
      const result = await service.checkVariantAvailability('var-1', '2026-11-10', '2026-11-12');

      // The overdue RENTING order is treated as not ready, occupying the 1 unit!
      expect(result.availableQuantity).toBe(0);
      expect(result.isAvailable).toBe(false);
    });
  });

  describe('canReduceStock', () => {
    it('should block reduction when new stock < max committed bookings', async () => {
      const mockItems = [
        {
          quantity: 3,
          rentalOrder: {
            id: 'ord-1',
            status: OrderStatus.CONFIRMED,
            startDate: '2026-11-10',
            endDate: '2026-11-15',
          },
        },
      ];

      const qbMock = {
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockItems),
      };
      mockOrderItemRepo.createQueryBuilder.mockReturnValue(qbMock);

      // Attempt to reduce totalQuantity to 2 (while 3 are committed!)
      const check = await service.canReduceStock('var-1', 2, 0);

      expect(check.allowed).toBe(false);
      expect(check.maxCommitted).toBe(3);
      expect(check.reason).toContain('Không thể giảm tồn kho');
    });

    it('should allow reduction when new stock >= max committed bookings', async () => {
      const mockItems = [
        {
          quantity: 2,
          rentalOrder: {
            id: 'ord-1',
            status: OrderStatus.CONFIRMED,
            startDate: '2026-11-10',
            endDate: '2026-11-12',
          },
        },
      ];

      const qbMock = {
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockItems),
      };
      mockOrderItemRepo.createQueryBuilder.mockReturnValue(qbMock);

      // Reducing from 5 to 3 (committed is 2)
      const check = await service.canReduceStock('var-1', 3, 0);

      expect(check.allowed).toBe(true);
      expect(check.maxCommitted).toBe(2);
    });
  });
});

