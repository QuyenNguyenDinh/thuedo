import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RentalOrder } from '../../../entities/rental-order.entity';
import { RentalOrderItem } from '../../../entities/rental-order-item.entity';
import { Costume } from '../../../entities/costume.entity';
import { OrderStatus } from '../../../common/enums/order-status.enum';
import { DateUtil } from '../../../common/utils/date.util';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../../common/enums/role.enum';

@ApiTags('Admin Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/dashboard')
export class AdminDashboardController {
  constructor(
    @InjectRepository(RentalOrder)
    private orderRepository: Repository<RentalOrder>,
    @InjectRepository(RentalOrderItem)
    private itemRepository: Repository<RentalOrderItem>,
    @InjectRepository(Costume)
    private costumeRepository: Repository<Costume>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Admin lấy thống kê tổng quan doanh thu, đơn hàng và kho vận' })
  @ApiResponse({ status: 200, description: 'Lấy dữ liệu thống kê thành công' })
  async getDashboard() {
    const today = DateUtil.getTodayInVietnam();

    // 1. Total revenue (CONFIRMED, RENTING, RETURNED) - exclude deposit!
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
      .orderBy('SUM(item.quantity)', 'DESC')
      .limit(5)
      .getRawMany();

    const topCostumes = topCostumesRaw.map((row) => ({
      name: row.name,
      rentedCount: parseInt(row.rentedCount, 10),
    }));

    return {
      totalRevenue,
      statusCounts,
      activeRentingItems,
      pendingCount: statusCounts[OrderStatus.PENDING] || 0,
      overdueCount: overdueOrders.length,
      overdueOrders,
      recentPendingOrders,
      topCostumes,
    };
  }
}
