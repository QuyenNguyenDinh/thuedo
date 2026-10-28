import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RentalsService } from './rentals.service';
import { CreateRentalDto } from './dto/create-rental.dto';
import { QueryRentalsDto, CancelRentalDto } from './dto/query-rentals.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Rentals (Customer)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('rentals')
export class RentalsController {
  constructor(private readonly rentalsService: RentalsService) {}

  @Post()
  @Roles(Role.CUSTOMER, Role.ADMIN)
  @ApiOperation({ summary: 'Khách hàng tạo đơn thuê trang phục (Khóa bi quan)' })
  @ApiResponse({ status: 201, description: 'Tạo đơn thành công' })
  @ApiResponse({ status: 409, description: 'Sản phẩm đã hết hàng trong khoảng ngày chọn' })
  async createRental(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateRentalDto,
  ) {
    return this.rentalsService.createRental(user.userId, dto);
  }

  @Get()
  @Roles(Role.CUSTOMER, Role.ADMIN)
  @ApiOperation({ summary: 'Lấy danh sách đơn thuê của chính khách hàng hiện tại' })
  async getMyRentals(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: QueryRentalsDto,
  ) {
    return this.rentalsService.getMyRentals(user.userId, query);
  }

  @Get(':id')
  @Roles(Role.CUSTOMER, Role.ADMIN)
  @ApiOperation({ summary: 'Xem chi tiết đơn thuê kèm snapshots và lịch sử trạng thái' })
  @ApiResponse({ status: 200, description: 'Chi tiết đơn' })
  @ApiResponse({ status: 403, description: 'Chặn IDOR nếu không phải chủ đơn' })
  async getRentalById(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.rentalsService.getRentalById(user.userId, user.role, id);
  }

  @Post(':id/cancel')
  @Roles(Role.CUSTOMER, Role.ADMIN)
  @ApiOperation({ summary: 'Khách hàng hủy đơn thuê khi còn ở trạng thái PENDING' })
  @ApiResponse({ status: 200, description: 'Hủy đơn thành công' })
  @ApiResponse({ status: 400, description: 'Không thể hủy đơn ngoài trạng thái PENDING' })
  async cancelRental(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: CancelRentalDto,
  ) {
    return this.rentalsService.cancelRental(user.userId, user.role, id, dto?.reason);
  }
}

