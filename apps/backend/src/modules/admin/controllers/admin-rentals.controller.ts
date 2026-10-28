import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RentalsService } from '../../rentals/rentals.service';
import { QueryRentalsDto } from '../../rentals/dto/query-rentals.dto';
import {
  RejectRentalDto,
  DeliverRentalDto,
  ReturnRentalDto,
} from '../dto/admin-actions.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../../common/enums/role.enum';
import { CurrentUser, CurrentUserPayload } from '../../../common/decorators/current-user.decorator';

@ApiTags('Admin Rentals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/rentals')
export class AdminRentalsController {
  constructor(private readonly rentalsService: RentalsService) {}

  @Get()
  @ApiOperation({ summary: 'Admin lọc và phân trang toàn bộ đơn thuê tại cửa hàng' })
  async getRentals(
    @Query() query: QueryRentalsDto,
    @Query('keyword') keyword?: string,
  ) {
    return this.rentalsService.getAllRentalsForAdmin({ ...query, keyword });
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: 'Admin xác nhận đơn thuê (PENDING -> CONFIRMED)' })
  @ApiResponse({ status: 200, description: 'Xác nhận thành công' })
  async confirmRental(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.rentalsService.confirmRental(user.userId, user.fullName || 'Admin', id);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Admin từ chối đơn thuê (PENDING -> REJECTED)' })
  @ApiResponse({ status: 200, description: 'Từ chối thành công, giải phóng lịch giữ chỗ' })
  async rejectRental(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: RejectRentalDto,
  ) {
    return this.rentalsService.rejectRental(
      user.userId,
      user.fullName || 'Admin',
      id,
      dto?.reason,
    );
  }

  @Post(':id/deliver')
  @ApiOperation({ summary: 'Admin ghi nhận giao đồ tại quầy (CONFIRMED -> RENTING)' })
  @ApiResponse({ status: 200, description: 'Bàn giao thành công' })
  async deliverRental(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: DeliverRentalDto,
  ) {
    return this.rentalsService.deliverRental(
      user.userId,
      user.fullName || 'Admin',
      id,
      dto?.note,
    );
  }

  @Post(':id/return')
  @ApiOperation({ summary: 'Admin ghi nhận nhận trả đồ & hoàn cọc (RENTING -> RETURNED)' })
  @ApiResponse({ status: 200, description: 'Nhận trả đồ thành công, giải phóng lịch' })
  @ApiResponse({ status: 400, description: 'Đơn đã hoàn tất hoặc trạng thái không hợp lệ' })
  async returnRental(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: ReturnRentalDto,
  ) {
    return this.rentalsService.returnRental(
      user.userId,
      user.fullName || 'Admin',
      id,
      dto?.actualDepositReturned,
      dto?.note,
    );
  }
}

