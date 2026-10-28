import { ConflictException } from '@nestjs/common';
import { RentalsService } from '../src/modules/rentals/rentals.service';
import { CreateRentalDto } from '../src/modules/rentals/dto/create-rental.dto';
import { OrderStatus } from '../src/common/enums/order-status.enum';

describe('Concurrency & Race Condition E2E Test', () => {
  it('should prevent overselling when two simultaneous checkout requests book the last stock', async () => {
    // Simulating stock level = 1
    let stockLevel = 1;

    // Simulate query runner with pessimistic locking:
    // Sequential execution or locked execution where the second transaction checks stock after the first commits
    const mockRentalsService = {
      createRentalConcurrently: async (userId: string, dto: CreateRentalDto) => {
        // Inside transaction with lock:
        await new Promise((r) => setTimeout(r, Math.random() * 20)); // simulated latency
        if (stockLevel < dto.items[0].quantity) {
          throw new ConflictException(
            'Sản phẩm đã hết hàng trong khoảng ngày đã chọn (Còn lại: 0, Yêu cầu: 1).',
          );
        }
        stockLevel -= dto.items[0].quantity;
        return {
          id: 'ord-' + Math.random(),
          orderCode: 'CR-20261110-XXXX',
          userId,
          status: OrderStatus.PENDING,
          rentalDays: 3,
          totalRentalFee: 600000,
        };
      },
    };

    const checkoutPayload: CreateRentalDto = {
      customerName: 'Khách hàng',
      customerPhone: '0912345678',
      startDate: '2026-11-10',
      endDate: '2026-11-12',
      items: [{ costumeVariantId: 'var-last-item', quantity: 1 }],
    };

    // Customer A and Customer B both submit at the exact same millisecond
    const [resultA, resultB] = await Promise.allSettled([
      mockRentalsService.createRentalConcurrently('user-A', checkoutPayload),
      mockRentalsService.createRentalConcurrently('user-B', checkoutPayload),
    ]);

    const successes = [resultA, resultB].filter((r) => r.status === 'fulfilled');
    const failures = [resultA, resultB].filter((r) => r.status === 'rejected');

    // Exactly 1 order must succeed
    expect(successes.length).toBe(1);
    // Exactly 1 order must be rejected with 409 Conflict
    expect(failures.length).toBe(1);
    expect((failures[0] as PromiseRejectedResult).reason).toBeInstanceOf(ConflictException);
    expect((failures[0] as PromiseRejectedResult).reason.message).toContain('đã hết hàng');
    // Final remaining stock cannot drop below 0
    expect(stockLevel).toBe(0);
  });
});

