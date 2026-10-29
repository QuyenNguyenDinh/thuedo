import {
  Controller,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminService } from '../admin.service';
import { CreateVariantDto, UpdateStockDto } from '../dto/admin-actions.dto';
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
  constructor(private readonly adminService: AdminService) {}

  @Post()
  @ApiOperation({ summary: 'Admin thêm biến thể kích cỡ mới cho trang phục' })
  @ApiResponse({ status: 201, description: 'Tạo biến thể thành công' })
  async createVariant(@Body() dto: CreateVariantDto) {
    return this.adminService.createVariant(dto);
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
    return this.adminService.updateVariantStock(variantId, dto);
  }
}
