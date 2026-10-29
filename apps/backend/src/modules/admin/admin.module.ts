import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RentalOrder } from '../../entities/rental-order.entity';
import { RentalOrderItem } from '../../entities/rental-order-item.entity';
import { Costume } from '../../entities/costume.entity';
import { CostumeVariant } from '../../entities/costume-variant.entity';
import { AdminService } from './admin.service';
import { AdminCostumesController } from './controllers/admin-costumes.controller';
import { AdminVariantsController } from './controllers/admin-variants.controller';
import { AdminRentalsController } from './controllers/admin-rentals.controller';
import { AdminDashboardController } from './controllers/admin-dashboard.controller';
import { CostumesModule } from '../costumes/costumes.module';
import { RentalsModule } from '../rentals/rentals.module';
import { AvailabilityModule } from '../availability/availability.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RentalOrder,
      RentalOrderItem,
      Costume,
      CostumeVariant,
    ]),
    CostumesModule,
    RentalsModule,
    AvailabilityModule,
  ],
  controllers: [
    AdminCostumesController,
    AdminVariantsController,
    AdminRentalsController,
    AdminDashboardController,
  ],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}

