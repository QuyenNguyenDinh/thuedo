import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PricingService } from './pricing.service';
import { RentalQuoteRequestDto } from './dto/quote-request.dto';

@ApiTags('Rental Quotes')
@Controller('rental-quotes')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Post()
  @ApiOperation({ summary: 'Tính bảng kê tiền thuê và tiền cọc theo số ngày và số lượng' })
  @ApiResponse({ status: 200, description: 'Tính toán thành công' })
  @ApiResponse({ status: 400, description: 'Ngày hoặc số lượng không hợp lệ' })
  async getQuote(@Body() dto: RentalQuoteRequestDto) {
    return this.pricingService.calculateQuote(dto.startDate, dto.endDate, dto.items);
  }
}

