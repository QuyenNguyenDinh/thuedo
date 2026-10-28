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
import { Costume } from './costume.entity';
import { RentalOrderItem } from './rental-order-item.entity';

@Entity('costume_variants')
export class CostumeVariant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index('idx_costume_variants_costume_id')
  costumeId: string;

  @ManyToOne(() => Costume, (costume) => costume.variants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'costumeId' })
  costume: Costume;

  @Column({ type: 'varchar', length: 50 })
  size: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  sku: string;

  @Column({ type: 'int', default: 1 })
  totalQuantity: number;

  @Column({ type: 'int', default: 0 })
  outOfServiceQuantity: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => RentalOrderItem, (item) => item.costumeVariant)
  orderItems: RentalOrderItem[];
}

