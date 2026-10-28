import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { RentalOrder } from './rental-order.entity';
import { User } from './user.entity';
import { OrderStatus } from '../common/enums/order-status.enum';

@Entity('rental_status_histories')
export class RentalStatusHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index('idx_status_histories_order_id')
  rentalOrderId: string;

  @ManyToOne(() => RentalOrder, (order) => order.statusHistories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rentalOrderId' })
  rentalOrder: RentalOrder;

  @Column({ type: 'varchar', length: 20, nullable: true })
  fromStatus: OrderStatus | null;

  @Column({ type: 'varchar', length: 20 })
  toStatus: OrderStatus;

  @Column({ type: 'uuid' })
  changedById: string;

  @ManyToOne(() => User, (user) => user.statusHistories, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'changedById' })
  changedBy: User;

  @Column({ type: 'varchar', length: 255 })
  changedByName: string;

  @Column({ type: 'text', nullable: true })
  note: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}

