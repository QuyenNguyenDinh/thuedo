import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, Min, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateVariantDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6', description: 'Mã UUID trang phục' })
  @IsUUID('all', { message: 'costumeId phải là chuỗi định dạng UUID hợp lệ.' })
  @IsNotEmpty({ message: 'costumeId không được để trống.' })
  costumeId: string;

  @ApiProperty({ example: 'XL', description: 'Kích cỡ (S, M, L, XL, FreeSize)' })
  @IsString()
  @IsNotEmpty({ message: 'Kích cỡ không được để trống.' })
  size: string;

  @ApiProperty({ example: 'CR-RAIDEN-XL', description: 'Mã SKU quản lý kho' })
  @IsString()
  @IsNotEmpty({ message: 'Mã SKU không được để trống.' })
  sku: string;

  @ApiProperty({ example: 2, default: 1, description: 'Tổng số lượng trong kho' })
  @IsInt()
  @Min(0, { message: 'Tổng số lượng không được nhỏ hơn 0.' })
  totalQuantity: number;

  @ApiPropertyOptional({ example: 0, default: 0, description: 'Số lượng đang bảo trì' })
  @IsInt()
  @Min(0, { message: 'Số lượng hỏng/bảo trì không được nhỏ hơn 0.' })
  @IsOptional()
  outOfServiceQuantity?: number;
}

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

