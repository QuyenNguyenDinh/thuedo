import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Costume } from './costume.entity';

@Entity('costume_images')
export class CostumeImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  costumeId: string;

  @ManyToOne(() => Costume, (costume) => costume.images, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'costumeId' })
  costume: Costume;

  @Column({ type: 'varchar', length: 500 })
  imageUrl: string;

  @Column({ type: 'varchar', length: 255, default: 'Hình ảnh trang phục' })
  altText: string;

  @Column({ type: 'boolean', default: false })
  isPrimary: boolean;

  @Column({ type: 'int', default: 0 })
  displayOrder: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}

