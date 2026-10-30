import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class QuoteItemDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  @IsUUID()
  @IsNotEmpty()
  costumeVariantId: string;

  @ApiProperty({ example: 1, default: 1 })
  @IsInt()
  @Min(1, { message: 'Số lượng phải lớn hơn hoặc bằng 1.' })
  @Max(20, { message: 'Số lượng mỗi kích cỡ tối đa là 20 bộ.' })
  quantity: number;
}

export class RentalQuoteRequestDto {
  @ApiProperty({ example: '2026-11-10', description: 'Ngày nhận đồ (YYYY-MM-DD)' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Ngày nhận phải theo định dạng YYYY-MM-DD.' })
  startDate: string;

  @ApiProperty({ example: '2026-11-12', description: 'Ngày trả đồ (YYYY-MM-DD)' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Ngày trả phải theo định dạng YYYY-MM-DD.' })
  endDate: string;

  @ApiProperty({ type: [QuoteItemDto] })
  @IsArray()
  @ArrayMaxSize(20, { message: 'Mỗi đơn tối đa 20 mặt hàng.' })
  @ValidateNested({ each: true })
  @Type(() => QuoteItemDto)
  items: QuoteItemDto[];
}

