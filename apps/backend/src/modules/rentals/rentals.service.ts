import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { RentalOrder } from '../../entities/rental-order.entity';
import { RentalOrderItem } from '../../entities/rental-order-item.entity';
import { RentalStatusHistory } from '../../entities/rental-status-history.entity';
import { CostumeVariant } from '../../entities/costume-variant.entity';
import { User } from '../../entities/user.entity';
import { CreateRentalDto } from './dto/create-rental.dto';
import { QueryRentalsDto } from './dto/query-rentals.dto';
import { OrderStatus, VALID_STATUS_TRANSITIONS } from '../../common/enums/order-status.enum';
import { Role } from '../../common/enums/role.enum';
import { DateUtil } from '../../common/utils/date.util';
import { AvailabilityService } from '../availability/availability.service';

@Injectable()
export class RentalsService {
  private readonly logger = new Logger(RentalsService.name);

  constructor(
    private dataSource: DataSource,
    @InjectRepository(RentalOrder)
    private orderRepository: Repository<RentalOrder>,
    @InjectRepository(RentalOrderItem)
    private orderItemRepository: Repository<RentalOrderItem>,
    @InjectRepository(RentalStatusHistory)
    private historyRepository: Repository<RentalStatusHistory>,
    @InjectRepository(CostumeVariant)
    private variantRepository: Repository<CostumeVariant>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private availabilityService: AvailabilityService,
  ) {}

  private generateOrderCode(): string {
    const today = DateUtil.getTodayInVietnam().replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `CR-${today}-${rand}`;
  }

  /**
   * Create Rental Order with Pessimistic Locking to prevent race conditions.
   */
  async createRental(userId: string, dto: CreateRentalDto): Promise<RentalOrder> {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Đơn thuê phải có ít nhất một trang phục.');
    }

    if (DateUtil.isDateInPast(dto.startDate)) {
      throw new BadRequestException('Ngày nhận đồ không được ở trong quá khứ.');
    }

    let rentalDays: number;
    try {
      rentalDays = DateUtil.calculateRentalDays(dto.startDate, dto.endDate);
    } catch (err: any) {
      throw new BadRequestException(err.message || 'Khoảng ngày thuê không hợp lệ.');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản khách hàng.');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Sort variant IDs ascending to prevent deadlock across concurrent checkout
      const variantIds = Array.from(new Set(dto.items.map((i) => i.costumeVariantId))).sort();

      // 2. Lock variants with pessimistic write lock
      const lockedVariants = await queryRunner.manager
        .createQueryBuilder(CostumeVariant, 'variant')
        .setLock('pessimistic_write')
        .leftJoinAndSelect('variant.costume', 'costume')
        .whereInIds(variantIds)
        .orderBy('variant.id', 'ASC')
        .getMany();

      if (lockedVariants.length !== variantIds.length) {
        throw new NotFoundException('Một hoặc nhiều biến thể sản phẩm không tồn tại.');
      }

      const variantMap = new Map<string, CostumeVariant>();
      for (const v of lockedVariants) {
        if (!v.costume || !v.costume.isActive) {
          throw new BadRequestException(`Trang phục "${v.costume?.name || ''}" hiện đang ngừng cho thuê.`);
        }
        variantMap.set(v.id, v);
      }

      // 3. Check stock availability for each item in range inside the transaction
      for (const item of dto.items) {
        const avail = await this.availabilityService.checkVariantAvailability(
          item.costumeVariantId,
          dto.startDate,
          dto.endDate,
          queryRunner,
        );

        if (avail.availableQuantity < item.quantity) {
          const v = variantMap.get(item.costumeVariantId);
          throw new ConflictException(
            `Trang phục "${v?.costume?.name || ''}" (Size ${v?.size || ''}) đã hết hàng trong khoảng ngày đã chọn (Còn lại: ${avail.availableQuantity}, Yêu cầu: ${item.quantity}).`,
          );
        }
      }

      // 4. Calculate total amounts from server DB snapshots (ignore any client prices)
      let totalRentalFee = 0;
      let totalDeposit = 0;
      const orderItemsToSave: RentalOrderItem[] = [];

      for (const item of dto.items) {
        const v = variantMap.get(item.costumeVariantId)!;
        const lineRental = v.costume.dailyPrice * rentalDays * item.quantity;
        const lineDeposit = v.costume.depositAmount * item.quantity;

        totalRentalFee += lineRental;
        totalDeposit += lineDeposit;

        const orderItem = queryRunner.manager.create(RentalOrderItem, {
          costumeVariantId: v.id,
          costumeNameSnapshot: v.costume.name,
          sizeSnapshot: v.size,
          dailyPriceSnapshot: v.costume.dailyPrice,
          depositSnapshot: v.costume.depositAmount,
          quantity: item.quantity,
          lineRentalFee: lineRental,
          lineDeposit: lineDeposit,
        });

        orderItemsToSave.push(orderItem);
      }

      // 5. Create RentalOrder entity
      let orderCode = this.generateOrderCode();
      // Ensure unique code
      let existsCode = await queryRunner.manager.findOne(RentalOrder, { where: { orderCode } });
      while (existsCode) {
        orderCode = this.generateOrderCode();
        existsCode = await queryRunner.manager.findOne(RentalOrder, { where: { orderCode } });
      }

      const rentalOrder = queryRunner.manager.create(RentalOrder, {
        orderCode,
        userId: user.id,
        customerName: dto.customerName.trim(),
        customerPhone: dto.customerPhone.trim(),
        note: dto.note?.trim() || null,
        status: OrderStatus.PENDING,
        startDate: dto.startDate,
        endDate: dto.endDate,
        rentalDays,
        totalRentalFee,
        totalDeposit,
        actualDepositReturned: 0,
      });

      const savedOrder = await queryRunner.manager.save(RentalOrder, rentalOrder);

      // Save items
      for (const item of orderItemsToSave) {
        item.rentalOrderId = savedOrder.id;
      }
      await queryRunner.manager.save(RentalOrderItem, orderItemsToSave);

      // Save history record
      const history = queryRunner.manager.create(RentalStatusHistory, {
        rentalOrderId: savedOrder.id,
        fromStatus: null,
        toStatus: OrderStatus.PENDING,
        changedById: user.id,
        changedByName: user.fullName,
        note: 'Khách hàng tạo đơn thuê trang phục tại quầy',
      });
      await queryRunner.manager.save(RentalStatusHistory, history);

      await queryRunner.commitTransaction();

      return this.getRentalById(user.id, user.role, savedOrder.id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async getMyRentals(userId: string, query: QueryRentalsDto) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(50, query.limit || 10));
    const skip = (page - 1) * limit;

    const qb = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'item')
      .where('order.userId = :userId', { userId });

    if (query.status) {
      qb.andWhere('order.status = :status', { status: query.status });
    }

    qb.orderBy('order.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getAllRentalsForAdmin(query: QueryRentalsDto & { keyword?: string }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(50, query.limit || 10));
    const skip = (page - 1) * limit;

    const qb = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'item')
      .leftJoinAndSelect('order.user', 'user');

    if (query.status) {
      qb.andWhere('order.status = :status', { status: query.status });
    }

    if (query.keyword && query.keyword.trim().length > 0) {
      const kw = `%${query.keyword.trim().toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(order.orderCode) LIKE :kw OR LOWER(order.customerName) LIKE :kw OR order.customerPhone LIKE :kw)',
        { kw },
      );
    }

    qb.orderBy('order.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getRentalById(userId: string, role: string, id: string): Promise<RentalOrder> {
    const order = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'item')
      .leftJoinAndSelect('item.costumeVariant', 'variant')
      .leftJoinAndSelect('variant.costume', 'costume')
      .leftJoinAndSelect('costume.images', 'image')
      .leftJoinAndSelect('order.statusHistories', 'history')
      .leftJoinAndSelect('order.user', 'user')
      .where('order.id = :id', { id })
      .orderBy('history.createdAt', 'ASC')
      .getOne();

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn thuê.');
    }

    // IDOR Protection: Customers can ONLY see their own orders!
    if (role !== Role.ADMIN && order.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền truy cập đơn thuê này.');
    }

    return order;
  }

  async cancelRental(userId: string, role: string, id: string, reason?: string) {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn thuê.');
    }

    // IDOR check: Only owner or admin can cancel
    if (role !== Role.ADMIN && order.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền hủy đơn thuê này.');
    }

    // State machine check: Customer can ONLY cancel if status === PENDING
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(
        'Chỉ có thể hủy đơn thuê khi đang ở trạng thái Chờ xác nhận (PENDING).',
      );
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    const fromStatus = order.status;
    order.status = OrderStatus.CANCELLED;
    const saved = await this.orderRepository.save(order);

    // Save history
    const history = this.historyRepository.create({
      rentalOrderId: saved.id,
      fromStatus,
      toStatus: OrderStatus.CANCELLED,
      changedById: userId,
      changedByName: user?.fullName || 'Khách hàng',
      note: reason?.trim() || 'Khách hàng tự hủy đơn thuê',
    });
    await this.historyRepository.save(history);

    return {
      message: 'Hủy đơn thuê thành công.',
      order: saved,
    };
  }

  // --- ADMIN TRANSITIONS ---

  async confirmRental(adminId: string, adminName: string, id: string) {
    const order = await this.orderRepository.findOne({ where: { id } });
    if (!order) throw new NotFoundException('Không tìm thấy đơn thuê.');

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Chỉ có thể xác nhận đơn thuê đang ở trạng thái PENDING.');
    }

    const fromStatus = order.status;
    order.status = OrderStatus.CONFIRMED;
    const saved = await this.orderRepository.save(order);

    const history = this.historyRepository.create({
      rentalOrderId: saved.id,
      fromStatus,
      toStatus: OrderStatus.CONFIRMED,
      changedById: adminId,
      changedByName: adminName,
      note: 'Quản trị viên đã duyệt và xác nhận đơn thuê',
    });
    await this.historyRepository.save(history);

    return { message: 'Đã xác nhận đơn thuê thành công.', order: saved };
  }

  async rejectRental(adminId: string, adminName: string, id: string, reason?: string) {
    const order = await this.orderRepository.findOne({ where: { id } });
    if (!order) throw new NotFoundException('Không tìm thấy đơn thuê.');

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Chỉ có thể từ chối đơn thuê đang ở trạng thái PENDING.');
    }

    const fromStatus = order.status;
    order.status = OrderStatus.REJECTED;
    const saved = await this.orderRepository.save(order);

    const history = this.historyRepository.create({
      rentalOrderId: saved.id,
      fromStatus,
      toStatus: OrderStatus.REJECTED,
      changedById: adminId,
      changedByName: adminName,
      note: reason?.trim() || 'Quản trị viên từ chối đơn thuê',
    });
    await this.historyRepository.save(history);

    return { message: 'Đã từ chối đơn thuê thành công.', order: saved };
  }

  async deliverRental(adminId: string, adminName: string, id: string, note?: string) {
    const order = await this.orderRepository.findOne({ where: { id } });
    if (!order) throw new NotFoundException('Không tìm thấy đơn thuê.');

    if (order.status !== OrderStatus.CONFIRMED) {
      throw new BadRequestException('Đơn thuê phải được xác nhận trước khi bàn giao trang phục.');
    }

    const fromStatus = order.status;
    order.status = OrderStatus.RENTING;
    order.deliveredAt = new Date();
    const saved = await this.orderRepository.save(order);

    const history = this.historyRepository.create({
      rentalOrderId: saved.id,
      fromStatus,
      toStatus: OrderStatus.RENTING,
      changedById: adminId,
      changedByName: adminName,
      note: note?.trim() || 'Quản trị viên bàn giao trang phục tại quầy và thu tiền',
    });
    await this.historyRepository.save(history);

    return { message: 'Ghi nhận bàn giao trang phục thành công.', order: saved };
  }

  async returnRental(
    adminId: string,
    adminName: string,
    id: string,
    actualDepositReturned?: number,
    note?: string,
  ) {
    const order = await this.orderRepository.findOne({ where: { id } });
    if (!order) throw new NotFoundException('Không tìm thấy đơn thuê.');

    // Idempotency check: Cannot return twice!
    if (order.status === OrderStatus.RETURNED) {
      throw new BadRequestException('Đơn thuê này đã được ghi nhận trả đồ và hoàn tất trước đó.');
    }

    if (order.status !== OrderStatus.RENTING) {
      throw new BadRequestException('Chỉ có thể ghi nhận trả đồ cho đơn đang ở trạng thái RENTING.');
    }

    const fromStatus = order.status;
    order.status = OrderStatus.RETURNED;
    order.returnedAt = new Date();
    order.actualDepositReturned =
      actualDepositReturned !== undefined ? actualDepositReturned : order.totalDeposit;

    const saved = await this.orderRepository.save(order);

    const history = this.historyRepository.create({
      rentalOrderId: saved.id,
      fromStatus,
      toStatus: OrderStatus.RETURNED,
      changedById: adminId,
      changedByName: adminName,
      note:
        note?.trim() ||
        `Quản trị viên nhận trả trang phục và hoàn trả ${order.actualDepositReturned.toLocaleString('vi-VN')} đ tiền cọc`,
    });
    await this.historyRepository.save(history);

    return { message: 'Ghi nhận trả đồ và hoàn cọc thành công.', order: saved };
  }
}

