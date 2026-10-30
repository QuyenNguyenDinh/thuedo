import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryRunner, EntityManager } from 'typeorm';
import { CostumeVariant } from '../../entities/costume-variant.entity';
import { RentalOrder } from '../../entities/rental-order.entity';
import { RentalOrderItem } from '../../entities/rental-order-item.entity';
import { OrderStatus, ACTIVE_HOLD_STATUSES } from '../../common/enums/order-status.enum';
import { DateUtil } from '../../common/utils/date.util';

export interface VariantAvailabilityResult {
  variantId: string;
  startDate: string;
  endDate: string;
  rentalDays: number;
  totalQuantity: number;
  outOfServiceQuantity: number;
  baseStock: number;
  availableQuantity: number;
  isAvailable: boolean;
}

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(CostumeVariant)
    private variantRepository: Repository<CostumeVariant>,
    @InjectRepository(RentalOrder)
    private orderRepository: Repository<RentalOrder>,
    @InjectRepository(RentalOrderItem)
    private orderItemRepository: Repository<RentalOrderItem>,
  ) {}

  /**
   * Calculate available quantity for a variant across [startDate, endDate].
   * Algorithm:
   * 1. Determine base usable stock = totalQuantity - outOfServiceQuantity
   * 2. Find all active bookings (PENDING, CONFIRMED, RENTING) referencing this variant.
   * 3. For each date d in [startDate, endDate]:
   *    - Check which bookings occupy day d:
   *      a) Normal active booking: order.startDate <= d AND d <= order.endDate
   *      b) Overdue RENTING booking: order.status === 'RENTING' AND d >= order.startDate
   *    - Sum occupied quantity on day d = sum(item.quantity)
   *    - Available(d) = baseUsableStock - occupied(d)
   * 4. Return min(Available(d)) for all d in [startDate, endDate].
   */
  async checkVariantAvailability(
    variantId: string,
    startDate: string,
    endDate: string,
    queryRunner?: QueryRunner,
  ): Promise<VariantAvailabilityResult> {
    let rentalDays: number;
    try {
      DateUtil.parseDateString(startDate);
      DateUtil.parseDateString(endDate);
      if (DateUtil.isDateInPast(startDate)) {
        throw new BadRequestException('Ngày nhận đồ không được ở trong quá khứ.');
      }
      rentalDays = DateUtil.calculateRentalDays(startDate, endDate);
      if (rentalDays > DateUtil.MAX_RENTAL_DAYS) {
        throw new BadRequestException(
          `Thời gian thuê tối đa là ${DateUtil.MAX_RENTAL_DAYS} ngày cho mỗi đơn.`,
        );
      }
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException(err.message || 'Khoảng ngày thuê không hợp lệ.');
    }

    const variantRepo = queryRunner
      ? queryRunner.manager.getRepository(CostumeVariant)
      : this.variantRepository;

    const variant = await variantRepo.findOne({
      where: { id: variantId },
      relations: ['costume'],
    });

    if (!variant) {
      throw new NotFoundException('Không tìm thấy biến thể kích cỡ.');
    }

    const baseStock = Math.max(0, variant.totalQuantity - variant.outOfServiceQuantity);
    const dates = DateUtil.getDatesInRange(startDate, endDate);

    // Fetch active bookings that could overlap
    const orderItemRepo = queryRunner
      ? queryRunner.manager.getRepository(RentalOrderItem)
      : this.orderItemRepository;

    const activeItems = await orderItemRepo
      .createQueryBuilder('item')
      .innerJoinAndSelect('item.rentalOrder', 'order')
      .where('item.costumeVariantId = :variantId', { variantId })
      .andWhere('order.status IN (:...statuses)', { statuses: ACTIVE_HOLD_STATUSES })
      .getMany();

    const today = DateUtil.getTodayInVietnam();
    let minAvailable = baseStock;

    for (const d of dates) {
      let reservedOnDay = 0;

      for (const item of activeItems) {
        const order = item.rentalOrder;
        // Normal active booking covering day d:
        const isStandardOverlap = order.startDate <= d && d <= order.endDate;

        // Overdue RENTING order: only if status is RENTING AND overdue (endDate < today),
        // it occupies stock past scheduled endDate until returned.
        const isOverdueRenting =
          order.status === OrderStatus.RENTING && order.endDate < today && d >= order.startDate;

        if (isStandardOverlap || isOverdueRenting) {
          reservedOnDay += item.quantity;
        }
      }

      const availableOnDay = Math.max(0, baseStock - reservedOnDay);
      if (availableOnDay < minAvailable) {
        minAvailable = availableOnDay;
      }
    }

    return {
      variantId,
      startDate,
      endDate,
      rentalDays,
      totalQuantity: variant.totalQuantity,
      outOfServiceQuantity: variant.outOfServiceQuantity,
      baseStock,
      availableQuantity: minAvailable,
      isAvailable: minAvailable > 0,
    };
  }

  /**
   * Safety check before Admin decreases stock:
   * Ensures new base stock >= maximum reserved on any future date by existing bookings.
   */
  async canReduceStock(
    variantId: string,
    newTotalQuantity: number,
    newOutOfServiceQuantity: number,
    queryRunnerOrManager?: QueryRunner | EntityManager,
  ): Promise<{ allowed: boolean; maxCommitted: number; reason?: string }> {
    const newBase = newTotalQuantity - newOutOfServiceQuantity;
    if (newBase < 0) {
      return {
        allowed: false,
        maxCommitted: 0,
        reason: 'Tổng số lượng không được nhỏ hơn số lượng ngừng phục vụ.',
      };
    }

    // Find all future active bookings for this variant using transactional manager if provided
    const itemRepo = queryRunnerOrManager
      ? 'manager' in queryRunnerOrManager
        ? (queryRunnerOrManager as QueryRunner).manager.getRepository(RentalOrderItem)
        : (queryRunnerOrManager as EntityManager).getRepository(RentalOrderItem)
      : this.orderItemRepository;

    const activeItems = await itemRepo
      .createQueryBuilder('item')
      .innerJoinAndSelect('item.rentalOrder', 'order')
      .where('item.costumeVariantId = :variantId', { variantId })
      .andWhere('order.status IN (:...statuses)', { statuses: ACTIVE_HOLD_STATUSES })
      .getMany();

    if (activeItems.length === 0) {
      return { allowed: true, maxCommitted: 0 };
    }

    // Determine max day reservation across all future dates
    const today = DateUtil.getTodayInVietnam();
    // Gather all distinct days from future bookings
    const relevantDates = new Set<string>();
    relevantDates.add(today);

    for (const item of activeItems) {
      const order = item.rentalOrder;
      const start = order.startDate < today ? today : order.startDate;
      const end = order.endDate < today ? today : order.endDate;
      const range = DateUtil.getDatesInRange(start, end);
      for (const d of range) {
        relevantDates.add(d);
      }
    }

    let maxReserved = 0;
    for (const d of relevantDates) {
      let dayReserved = 0;
      for (const item of activeItems) {
        const order = item.rentalOrder;
        const isStandardOverlap = order.startDate <= d && d <= order.endDate;
        const isOverdueRenting =
          order.status === OrderStatus.RENTING && order.endDate < today && d >= order.startDate;

        if (isStandardOverlap || isOverdueRenting) {
          dayReserved += item.quantity;
        }
      }
      if (dayReserved > maxReserved) {
        maxReserved = dayReserved;
      }
    }

    if (newBase < maxReserved) {
      return {
        allowed: false,
        maxCommitted: maxReserved,
        reason: `Không thể giảm tồn kho xuống dưới số lượng đã cam kết cho các đơn đặt trước (Yêu cầu tối thiểu: ${maxReserved} bộ khả dụng).`,
      };
    }

    return { allowed: true, maxCommitted: maxReserved };
  }
}

