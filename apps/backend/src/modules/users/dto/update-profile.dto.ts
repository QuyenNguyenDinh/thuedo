import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, IsNotEmpty, ValidateIf } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateProfileDto {
  @ApiProperty({ example: 'Nguyễn Văn A', description: 'Họ và tên mới' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'Họ và tên phải là chuỗi.' })
  @IsNotEmpty({ message: 'Họ và tên không được để trống.' })
  fullName: string;

  @ApiProperty({ example: '0912345678', description: 'Số điện thoại liên hệ' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Matches(/^(?:0|\+84)[35789][0-9]{8}$/, {
    message: 'Số điện thoại không đúng định dạng số di động Việt Nam.',
  })
  phone: string;

  @ApiProperty({ example: 'Số 12 Đại Cồ Việt, Hai Bà Trưng, Hà Nội', required: false })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @ValidateIf((_object, value) => value !== undefined)
  @IsString({ message: 'Địa chỉ phải là chuỗi.' })
  address?: string;
}

