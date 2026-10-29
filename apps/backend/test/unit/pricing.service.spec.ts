import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PricingService } from '../../src/modules/pricing/pricing.service';
import { CostumeVariant } from '../../src/entities/costume-variant.entity';
import { DateUtil } from '../../src/common/utils/date.util';

describe('PricingService (Unit Test)', () => {
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
      mockVariantRepo.findOne.mockResolvedValue({
        id: 'var-1',
        size: 'L',
        costumeId: 'cos-1',
        costume: {
          id: 'cos-1',
          name: 'Raiden Shogun Kimono',
          dailyPrice: 200000,
          depositAmount: 600000,
          isActive: true,
        },
      });

      const quote = await service.calculateQuote('2026-11-10', '2026-11-12', [
        { costumeVariantId: 'var-1', quantity: 2 },
      ]);

      expect(quote.rentalDays).toBe(3);
      expect(quote.totalRentalFee).toBe(1200000); // 200,000 * 3 days * 2
      expect(quote.totalDeposit).toBe(1200000); // 600,000 * 2
      expect(quote.totalDueAtStore).toBe(2400000);
      expect(quote.items).toHaveLength(1);
      expect(quote.items[0].lineRentalFee).toBe(1200000);
      expect(quote.items[0].lineDeposit).toBe(1200000);
    });

    it('should throw NotFoundException if variant does not exist', async () => {
      mockVariantRepo.findOne.mockResolvedValue(null);

      await expect(
        service.calculateQuote('2026-11-10', '2026-11-12', [
          { costumeVariantId: 'invalid-id', quantity: 1 },
        ]),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if costume is not active', async () => {
      mockVariantRepo.findOne.mockResolvedValue({
        id: 'var-inactive',
        size: 'M',
        costumeId: 'cos-inactive',
        costume: {
          id: 'cos-inactive',
          name: 'Inactive Costume',
          dailyPrice: 150000,
          depositAmount: 500000,
          isActive: false,
        },
      });

      await expect(
        service.calculateQuote('2026-11-10', '2026-11-12', [
          { costumeVariantId: 'var-inactive', quantity: 1 },
        ]),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when items array is empty', async () => {
      await expect(
        service.calculateQuote('2026-11-10', '2026-11-12', []),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when quantity is less than or equal to 0', async () => {
      await expect(
        service.calculateQuote('2026-11-10', '2026-11-12', [
          { costumeVariantId: 'var-1', quantity: 0 },
        ]),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
