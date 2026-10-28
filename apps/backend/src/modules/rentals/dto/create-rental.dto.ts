import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { QuoteItemDto } from '../../pricing/dto/quote-request.dto';

export class CreateRentalDto {
  @ApiProperty({ example: 'Nguyễn Văn A', description: 'Tên người nhận đồ tại quầy' })
  @IsString()
  @IsNotEmpty({ message: 'Tên người nhận không được để trống.' })
  customerName: string;

  @ApiProperty({ example: '0912345678', description: 'Số điện thoại liên hệ nhận đồ' })
  @IsString()
  @Matches(/^(0|\+84)[3|5|7|8|9][0-9]{8}$/, {
    message: 'Số điện thoại không đúng định dạng số di động Việt Nam.',
  })
  customerPhone: string;

  @ApiPropertyOptional({ example: 'Nhận đồ lúc 14h chiều' })
  @IsString()
  @IsOptional()
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
  @ValidateNested({ each: true })
  @Type(() => QuoteItemDto)
  items: QuoteItemDto[];
}
