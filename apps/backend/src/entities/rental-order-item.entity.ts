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
import { CostumeVariant } from './costume-variant.entity';

@Entity('rental_order_items')
export class RentalOrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index('idx_order_items_rental_order_id')
  rentalOrderId: string;

  @ManyToOne(() => RentalOrder, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rentalOrderId' })
  rentalOrder: RentalOrder;

  @Column({ type: 'uuid' })
  @Index('idx_order_items_variant_id')
  costumeVariantId: string;

  @ManyToOne(() => CostumeVariant, (variant) => variant.orderItems, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'costumeVariantId' })
  costumeVariant: CostumeVariant;

  @Column({ type: 'varchar', length: 255 })
  costumeNameSnapshot: string;

  @Column({ type: 'varchar', length: 50 })
  sizeSnapshot: string;

  @Column({ type: 'int' })
  dailyPriceSnapshot: number; // VND integer

  @Column({ type: 'int' })
  depositSnapshot: number; // VND integer

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ type: 'int' })
  lineRentalFee: number; // VND integer = dailyPriceSnapshot * days * quantity

  @Column({ type: 'int' })
  lineDeposit: number; // VND integer = depositSnapshot * quantity

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}

