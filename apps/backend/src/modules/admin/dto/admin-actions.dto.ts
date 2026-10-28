import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, Min, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateStockDto {
  @ApiProperty({ example: 5, description: 'Tổng số lượng trang phục sở hữu' })
  @IsInt()
  @Min(0, { message: 'Tổng số lượng không được âm.' })
  totalQuantity: number;

  @ApiPropertyOptional({ example: 0, description: 'Số lượng đang bảo trì / hỏng' })
  @IsInt()
  @Min(0, { message: 'Số lượng bảo dưỡng không được âm.' })
  @IsOptional()
  outOfServiceQuantity?: number;
}

export class RejectRentalDto {
  @ApiPropertyOptional({ example: 'Sản phẩm đang cần giặt sấy đột xuất.' })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class DeliverRentalDto {
  @ApiPropertyOptional({ example: 'Đầy đủ phụ kiện kiếm, tóc giả.' })
  @IsString()
  @IsOptional()
  note?: string;
}

export class ReturnRentalDto {
  @ApiPropertyOptional({ example: 600000, description: 'Số tiền cọc hoàn trả thực tế sau khi kiểm đồ' })
  @IsInt()
  @Min(0)
  @IsOptional()
  actualDepositReturned?: number;

  @ApiPropertyOptional({ example: 'Đồ trả đúng hạn, nguyên vẹn.' })
  @IsString()
  @IsOptional()
  note?: string;
}
