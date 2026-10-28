import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RentalOrder } from '../../entities/rental-order.entity';
import { RentalOrderItem } from '../../entities/rental-order-item.entity';
import { RentalStatusHistory } from '../../entities/rental-status-history.entity';
import { CostumeVariant } from '../../entities/costume-variant.entity';
import { User } from '../../entities/user.entity';
import { RentalsService } from './rentals.service';
import { RentalsController } from './rentals.controller';
import { AvailabilityModule } from '../availability/availability.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RentalOrder,
      RentalOrderItem,
      RentalStatusHistory,
      CostumeVariant,
      User,
    ]),
    AvailabilityModule,
  ],
  controllers: [RentalsController],
  providers: [RentalsService],
  exports: [RentalsService],
})
export class RentalsModule {}

