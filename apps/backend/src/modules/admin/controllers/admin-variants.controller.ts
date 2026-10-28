import {
  Controller,
  Post,
  Put,
  Patch,
  Param,
  Body,
  UseGuards,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CostumeVariant } from '../../../entities/costume-variant.entity';
import { CostumeVariantDto } from '../../costumes/dto/costume.dto';
import { UpdateStockDto } from '../dto/admin-actions.dto';
import { AvailabilityService } from '../../availability/availability.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../../common/enums/role.enum';

@ApiTags('Admin Variants & Inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/variants')
export class AdminVariantsController {
  constructor(
    @InjectRepository(CostumeVariant)
    private variantRepository: Repository<CostumeVariant>,
    private availabilityService: AvailabilityService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Admin thêm biến thể kích cỡ mới cho trang phục' })
  async createVariant(@Body() dto: CostumeVariantDto & { costumeId: string }) {
    if (!dto.costumeId) {
      throw new BadRequestException('Mã trang phục (costumeId) là bắt buộc.');
    }
    const variant = this.variantRepository.create({
      costumeId: dto.costumeId,
      size: dto.size.trim().toUpperCase(),
      sku: dto.sku.trim(),
      totalQuantity: dto.totalQuantity,
      outOfServiceQuantity: dto.outOfServiceQuantity || 0,
    });
    return this.variantRepository.save(variant);
  }

  @Patch(':id/stock')
  @ApiOperation({
    summary: 'Admin cập nhật số lượng tồn kho (Có cơ chế kiểm tra an toàn cam kết đặt trước)',
  })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 400, description: 'Vi phạm số lượng cam kết đặt trước' })
  async updateStock(
    @Param('id') variantId: string,
    @Body() dto: UpdateStockDto,
  ) {
    const variant = await this.variantRepository.findOne({ where: { id: variantId } });
    if (!variant) {
      throw new NotFoundException('Không tìm thấy biến thể kích cỡ.');
    }

    const outOfService =
      dto.outOfServiceQuantity !== undefined
        ? dto.outOfServiceQuantity
        : variant.outOfServiceQuantity;

    // Safety check: ensure stock reduction does not violate active bookings!
    const safetyCheck = await this.availabilityService.canReduceStock(
      variantId,
      dto.totalQuantity,
      outOfService,
    );

    if (!safetyCheck.allowed) {
      throw new BadRequestException(safetyCheck.reason);
    }

    variant.totalQuantity = dto.totalQuantity;
    variant.outOfServiceQuantity = outOfService;

    const saved = await this.variantRepository.save(variant);
    return {
      message: 'Cập nhật số lượng tồn kho thành công.',
      variant: saved,
    };
  }
}

