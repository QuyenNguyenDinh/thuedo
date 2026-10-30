import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { RentalOrder } from '../../entities/rental-order.entity';
import { RentalOrderItem } from '../../entities/rental-order-item.entity';
import { Costume } from '../../entities/costume.entity';
import { CostumeVariant } from '../../entities/costume-variant.entity';
import { OrderStatus } from '../../common/enums/order-status.enum';
import { DateUtil } from '../../common/utils/date.util';
import { AvailabilityService } from '../availability/availability.service';
import { CreateVariantDto, UpdateStockDto } from './dto/admin-actions.dto';

@Injectable()
export class AdminService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(RentalOrder)
    private orderRepository: Repository<RentalOrder>,
    @InjectRepository(RentalOrderItem)
    private itemRepository: Repository<RentalOrderItem>,
    @InjectRepository(Costume)
    private costumeRepository: Repository<Costume>,
    @InjectRepository(CostumeVariant)
    private variantRepository: Repository<CostumeVariant>,
    private availabilityService: AvailabilityService,
  ) {}

  /**
   * Get Admin Overview Metrics & Analytics.
   */
  async getDashboard() {
    const today = DateUtil.getTodayInVietnam();

    // 1. Total revenue (CONFIRMED, RENTING, RETURNED) - excluding deposit!
    const revenueResult = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.totalRentalFee)', 'total')
      .where('order.status IN (:...statuses)', {
        statuses: [OrderStatus.CONFIRMED, OrderStatus.RENTING, OrderStatus.RETURNED],
      })
      .getRawOne();

    const totalRevenue = parseInt(revenueResult?.total || '0', 10);

    // 2. Count by status
    const statusCountsRaw = await this.orderRepository
      .createQueryBuilder('order')
      .select('order.status', 'status')
      .addSelect('COUNT(order.id)', 'count')
      .groupBy('order.status')
      .getRawMany();

    const statusCounts: Record<string, number> = {
      [OrderStatus.PENDING]: 0,
      [OrderStatus.CONFIRMED]: 0,
      [OrderStatus.RENTING]: 0,
      [OrderStatus.RETURNED]: 0,
      [OrderStatus.CANCELLED]: 0,
      [OrderStatus.REJECTED]: 0,
    };
    for (const row of statusCountsRaw) {
      statusCounts[row.status] = parseInt(row.count, 10);
    }

    // 3. Items currently outside (RENTING)
    const rentingItemsResult = await this.itemRepository
      .createQueryBuilder('item')
      .innerJoin('item.rentalOrder', 'order')
      .select('SUM(item.quantity)', 'total')
      .where('order.status = :status', { status: OrderStatus.RENTING })
      .getRawOne();

    const activeRentingItems = parseInt(rentingItemsResult?.total || '0', 10);

    // 4. Overdue RENTING orders (endDate < today and status === RENTING)
    const overdueOrders = await this.orderRepository
      .createQueryBuilder('order')
      .where('order.status = :status', { status: OrderStatus.RENTING })
      .andWhere('order.endDate < :today', { today })
      .getMany();

    // 5. Recent pending orders needing attention
    const recentPendingOrders = await this.orderRepository.find({
      where: { status: OrderStatus.PENDING },
      relations: ['items'],
      order: { createdAt: 'ASC' },
      take: 5,
    });

    // 6. Top costumes rented
    const topCostumesRaw = await this.itemRepository
      .createQueryBuilder('item')
      .innerJoin('item.rentalOrder', 'order')
      .select('item.costumeNameSnapshot', 'name')
      .addSelect('SUM(item.quantity)', 'rentedCount')
      .where('order.status IN (:...statuses)', {
        statuses: [OrderStatus.CONFIRMED, OrderStatus.RENTING, OrderStatus.RETURNED],
      })
      .groupBy('item.costumeNameSnapshot')
      .orderBy('"rentedCount"', 'DESC')
      .limit(5)
      .getRawMany();

    return {
      totalRevenue,
      activeRentingItems,
      pendingCount: statusCounts[OrderStatus.PENDING],
      overdueCount: overdueOrders.length,
      statusCounts,
      overview: {
        totalRevenue,
        activeRentingItems,
        pendingOrdersCount: statusCounts[OrderStatus.PENDING],
        overdueOrdersCount: overdueOrders.length,
      },
      statusDistribution: statusCounts,
      overdueOrders,
      recentPendingOrders,
      topCostumes: topCostumesRaw.map((r) => ({
        name: r.name,
        rentedCount: parseInt(r.rentedCount, 10),
      })),
    };
  }

  /**
   * Create new size variant for costume.
   */
  async createVariant(dto: CreateVariantDto) {
    const costume = await this.costumeRepository.findOne({ where: { id: dto.costumeId } });
    if (!costume) {
      throw new NotFoundException('Không tìm thấy trang phục tương ứng.');
    }

    const variant = this.variantRepository.create({
      costumeId: dto.costumeId,
      size: dto.size.trim().toUpperCase(),
      sku: dto.sku.trim(),
      totalQuantity: dto.totalQuantity,
      outOfServiceQuantity: dto.outOfServiceQuantity || 0,
    });

    return this.variantRepository.save(variant);
  }

  /**
   * Update stock with safety pre-flight check.
   */
  async updateVariantStock(variantId: string, dto: UpdateStockDto) {
    return this.dataSource.transaction(async (manager) => {
      const variant = await manager
        .createQueryBuilder(CostumeVariant, 'variant')
        .setLock('pessimistic_write')
        .where('variant.id = :id', { id: variantId })
        .getOne();

      if (!variant) {
        throw new NotFoundException('Không tìm thấy biến thể kích cỡ.');
      }

      const outOfService =
        dto.outOfServiceQuantity !== undefined
          ? dto.outOfServiceQuantity
          : variant.outOfServiceQuantity;

      // Safety check: ensure stock reduction does not violate active bookings inside transaction!
      const safetyCheck = await this.availabilityService.canReduceStock(
        variantId,
        dto.totalQuantity,
        outOfService,
        manager,
      );

      if (!safetyCheck.allowed) {
        throw new BadRequestException(safetyCheck.reason);
      }

      variant.totalQuantity = dto.totalQuantity;
      variant.outOfServiceQuantity = outOfService;

      const saved = await manager.save(CostumeVariant, variant);
      return {
        message: 'Cập nhật số lượng tồn kho thành công.',
        variant: saved,
      };
    });
  }
}

