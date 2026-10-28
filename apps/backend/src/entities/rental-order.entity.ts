import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { OrderStatus } from '../common/enums/order-status.enum';
import { RentalOrderItem } from './rental-order-item.entity';
import { RentalStatusHistory } from './rental-status-history.entity';

@Entity('rental_orders')
export class RentalOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  @Index('idx_rental_orders_order_code')
  orderCode: string;

  @Column({ type: 'uuid' })
  @Index('idx_rental_orders_user_id')
  userId: string;

  @ManyToOne(() => User, (user) => user.rentalOrders, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'varchar', length: 255 })
  customerName: string;

  @Column({ type: 'varchar', length: 20 })
  customerPhone: string;

  @Column({ type: 'text', nullable: true })
  note: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: OrderStatus.PENDING,
  })
  @Index('idx_rental_orders_status')
  status: OrderStatus;

  @Column({ type: 'date' })
  startDate: string; // YYYY-MM-DD

  @Column({ type: 'date' })
  endDate: string; // YYYY-MM-DD

  @Column({ type: 'int' })
  rentalDays: number;

  @Column({ type: 'int' })
  totalRentalFee: number; // VND integer

  @Column({ type: 'int' })
  totalDeposit: number; // VND integer

  @Column({ type: 'int', default: 0 })
  actualDepositReturned: number; // VND integer

  @Column({ type: 'timestamptz', nullable: true })
  deliveredAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  returnedAt: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => RentalOrderItem, (item) => item.rentalOrder, { cascade: true })
  items: RentalOrderItem[];

  @OneToMany(() => RentalStatusHistory, (history) => history.rentalOrder, { cascade: true })
  statusHistories: RentalStatusHistory[];
}

