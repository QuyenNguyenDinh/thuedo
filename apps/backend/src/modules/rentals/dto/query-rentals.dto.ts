import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsInt, Min, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus } from '../../../common/enums/order-status.enum';

export class QueryRentalsDto {
  @ApiPropertyOptional({ enum: OrderStatus })
  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Tìm kiếm theo mã đơn, họ tên hoặc SĐT khách hàng' })
  @IsString()
  @IsOptional()
  keyword?: string;
}

export class CancelRentalDto {
  @ApiPropertyOptional({ example: 'Tôi bận việc đột xuất không thể tới nhận đồ.' })
  @IsString()
  @IsOptional()
  reason?: string;
}
