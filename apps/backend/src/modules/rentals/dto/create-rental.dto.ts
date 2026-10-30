import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { QuoteItemDto } from '../../pricing/dto/quote-request.dto';

export class CreateRentalDto {
  @ApiProperty({ example: 'Nguyễn Văn A', description: 'Tên người nhận đồ tại quầy' })
  @IsString()
  @IsNotEmpty({ message: 'Tên người nhận không được để trống.' })
  @MaxLength(255, { message: 'Tên người nhận tối đa 255 ký tự.' })
  customerName: string;

  @ApiProperty({ example: '0912345678', description: 'Số điện thoại liên hệ nhận đồ' })
  @IsString()
  @Matches(/^(?:0|\+84)[35789][0-9]{8}$/, {
    message: 'Số điện thoại không đúng định dạng số di động Việt Nam.',
  })
  customerPhone: string;

  @ApiPropertyOptional({ example: 'Nhận đồ lúc 14h chiều' })
  @IsString()
  @IsOptional()
  @MaxLength(1000, { message: 'Ghi chú tối đa 1000 ký tự.' })
  note?: string;

  @ApiProperty({ example: '2026-11-10', description: 'Ngày nhận trang phục (YYYY-MM-DD)' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Ngày nhận phải theo định dạng YYYY-MM-DD.' })
  startDate: string;

  @ApiProperty({ example: '2026-11-12', description: 'Ngày trả trang phục (YYYY-MM-DD)' })
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
