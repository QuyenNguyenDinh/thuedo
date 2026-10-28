import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CostumesService } from '../../costumes/costumes.service';
import { CreateCostumeDto, UpdateCostumeDto } from '../../costumes/dto/costume.dto';
import { QueryCostumesDto } from '../../costumes/dto/query-costumes.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../../common/enums/role.enum';

@ApiTags('Admin Costumes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/costumes')
export class AdminCostumesController {
  constructor(private readonly costumesService: CostumesService) {}

  @Get()
  @ApiOperation({ summary: 'Admin xem toàn bộ trang phục bao gồm cả trang phục ẩn' })
  async getCostumes(@Query() query: QueryCostumesDto) {
    return this.costumesService.findAll(query, true);
  }

  @Post()
  @ApiOperation({ summary: 'Admin thêm trang phục mới kèm ảnh và kích cỡ' })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  async createCostume(@Body() dto: CreateCostumeDto) {
    return this.costumesService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Admin cập nhật thông tin trang phục' })
  async updateCostume(@Param('id') id: string, @Body() dto: UpdateCostumeDto) {
    return this.costumesService.update(id, dto);
  }

  @Patch(':id/toggle-active')
  @ApiOperation({ summary: 'Admin ẩn/hiện trang phục (Soft-deactivate an toàn dữ liệu lịch sử)' })
  async toggleActiveCostume(@Param('id') id: string) {
    return this.costumesService.toggleActive(id);
  }
}
