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
import { Category } from './category.entity';
import { CostumeImage } from './costume-image.entity';
import { CostumeVariant } from './costume-variant.entity';

@Entity('costumes')
export class Costume {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index('idx_costumes_category_id')
  categoryId: string;

  @ManyToOne(() => Category, (category) => category.costumes, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  slug: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  characterName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  seriesName: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'int' })
  @Index('idx_costumes_daily_price')
  dailyPrice: number;

  @Column({ type: 'int' })
  depositAmount: number;

  @Column({ type: 'boolean', default: true })
  @Index('idx_costumes_is_active')
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => CostumeImage, (image) => image.costume, { cascade: true })
  images: CostumeImage[];

  @OneToMany(() => CostumeVariant, (variant) => variant.costume, { cascade: true })
  variants: CostumeVariant[];
}

