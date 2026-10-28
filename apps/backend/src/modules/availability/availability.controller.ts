import { Controller, Get, Param, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AvailabilityService } from './availability.service';

@ApiTags('Availability')
@Controller('costumes')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get(':id/availability')
  @ApiOperation({ summary: 'Kiểm tra số lượng còn có thể thuê theo kích cỡ và khoảng ngày' })
  @ApiQuery({ name: 'variantId', required: true, description: 'Mã biến thể kích cỡ' })
  @ApiQuery({ name: 'startDate', required: true, example: '2026-11-10', description: 'Ngày nhận (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: true, example: '2026-11-12', description: 'Ngày trả (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Kiểm tra thành công' })
  @ApiResponse({ status: 400, description: 'Ngày hoặc tham số không hợp lệ' })
  async checkAvailability(
    @Param('id') costumeId: string,
    @Query('variantId') variantId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    if (!variantId) {
      throw new BadRequestException('Vui lòng chọn kích cỡ biến thể (variantId).');
    }
    if (!startDate || !endDate) {
      throw new BadRequestException('Vui lòng chọn ngày nhận đồ và ngày trả đồ.');
    }
    return this.availabilityService.checkVariantAvailability(variantId, startDate, endDate);
  }
}

