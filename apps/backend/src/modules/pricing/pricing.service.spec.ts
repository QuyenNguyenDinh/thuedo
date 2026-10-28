import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { CostumeVariant } from '../../entities/costume-variant.entity';
import { DateUtil } from '../../common/utils/date.util';

describe('PricingService', () => {
  let service: PricingService;
  let mockVariantRepo: any;

  beforeEach(async () => {
    mockVariantRepo = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PricingService,
        {
          provide: getRepositoryToken(CostumeVariant),
          useValue: mockVariantRepo,
        },
      ],
    }).compile();

    service = module.get<PricingService>(PricingService);
  });

  describe('Calendar Date & Inclusive Days Calculation', () => {
    it('should calculate same day rental as exactly 1 day', () => {
      const days = DateUtil.calculateRentalDays('2026-11-10', '2026-11-10');
      expect(days).toBe(1);
    });

    it('should calculate 3 days for 2026-11-10 to 2026-11-12 inclusive', () => {
      const days = DateUtil.calculateRentalDays('2026-11-10', '2026-11-12');
      expect(days).toBe(3);
    });

    it('should throw error when end date is before start date', () => {
      expect(() => {
        DateUtil.calculateRentalDays('2026-11-12', '2026-11-10');
      }).toThrow('Ngày trả không được trước ngày nhận.');
    });
  });

  describe('calculateQuote', () => {
    it('should correctly calculate total rental fee and deposit for multiple days and quantity', async () => {
      // Mock variant with dailyPrice 200,000 VND and deposit 600,000 VND
      mockVariantRepo.findOne.mockResolvedValue({
        id: 'var-1',
        size: 'M',
        costume: {
          id: 'cos-1',
          name: 'Raiden Shogun',
          dailyPrice: 200000,
          depositAmount: 600000,
          isActive: true,
        },
      });

      // 3 days: 2026-11-10 to 2026-11-12, quantity: 2
      const quote = await service.calculateQuote('2026-11-10', '2026-11-12', [
        { costumeVariantId: 'var-1', quantity: 2 },
      ]);

      expect(quote.rentalDays).toBe(3);
      // Line rental: 200,000 * 3 * 2 = 1,200,000 VND
      expect(quote.totalRentalFee).toBe(1200000);
      // Line deposit: 600,000 * 2 = 1,200,000 VND
      expect(quote.totalDeposit).toBe(1200000);
      // Total due at store: 1,200,000 + 1,200,000 = 2,400,000 VND
      expect(quote.totalDueAtStore).toBe(2400000);
    });

    it('should throw BadRequestException if product is inactive/hidden', async () => {
      mockVariantRepo.findOne.mockResolvedValue({
        id: 'var-1',
        costume: {
          id: 'cos-1',
          name: 'Hidden Costume',
          dailyPrice: 100000,
          depositAmount: 300000,
          isActive: false, // inactive
        },
      });

      await expect(
        service.calculateQuote('2026-11-10', '2026-11-12', [
          { costumeVariantId: 'var-1', quantity: 1 },
        ]),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if variant does not exist', async () => {
      mockVariantRepo.findOne.mockResolvedValue(null);

      await expect(
        service.calculateQuote('2026-11-10', '2026-11-12', [
          { costumeVariantId: 'non-existent', quantity: 1 },
        ]),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
