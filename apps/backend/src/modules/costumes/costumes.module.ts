import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Costume } from '../../entities/costume.entity';
import { CostumeImage } from '../../entities/costume-image.entity';
import { CostumeVariant } from '../../entities/costume-variant.entity';
import { CostumesService } from './costumes.service';
import { CostumesController } from './costumes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Costume, CostumeImage, CostumeVariant])],
  controllers: [CostumesController],
  providers: [CostumesService],
  exports: [CostumesService],
})
export class CostumesModule {}

