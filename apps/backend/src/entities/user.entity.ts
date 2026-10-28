import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Role } from '../common/enums/role.enum';
import { RefreshSession } from './refresh-session.entity';
import { RentalOrder } from './rental-order.entity';
import { RentalStatusHistory } from './rental-status-history.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, select: false })
  passwordHash: string;

  @Column({ type: 'varchar', length: 255 })
  fullName: string;

  @Column({ type: 'varchar', length: 20 })
  phone: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: Role.CUSTOMER,
  })
  role: Role;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => RefreshSession, (session) => session.user)
  refreshSessions: RefreshSession[];

  @OneToMany(() => RentalOrder, (order) => order.user)
  rentalOrders: RentalOrder[];

  @OneToMany(() => RentalStatusHistory, (history) => history.changedBy)
  statusHistories: RentalStatusHistory[];
}

