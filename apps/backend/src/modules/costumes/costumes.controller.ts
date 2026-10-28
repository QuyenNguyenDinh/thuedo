import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CostumesService } from './costumes.service';
import { QueryCostumesDto } from './dto/query-costumes.dto';

@ApiTags('Costumes')
@Controller('costumes')
export class CostumesController {
  constructor(private readonly costumesService: CostumesService) {}

  @Get()
  @ApiOperation({ summary: 'Tìm kiếm, lọc và phân trang danh sách trang phục' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công' })
  async getCostumes(@Query() query: QueryCostumesDto) {
    return this.costumesService.findAll(query, false);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết trang phục, hình ảnh và biến thể kích cỡ' })
  @ApiResponse({ status: 200, description: 'Lấy chi tiết thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy trang phục' })
  async getCostumeById(@Param('id') id: string) {
    return this.costumesService.findById(id, false);
  }
}

