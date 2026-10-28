import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, IsNotEmpty } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({ example: 'Nguyễn Văn A', description: 'Họ và tên mới' })
  @IsString()
  @IsNotEmpty({ message: 'Họ và tên không được để trống.' })
  fullName: string;

  @ApiProperty({ example: '0912345678', description: 'Số điện thoại liên hệ' })
  @IsString()
  @Matches(/^(0|\+84)[3|5|7|8|9][0-9]{8}$/, {
    message: 'Số điện thoại không đúng định dạng số di động Việt Nam.',
  })
  phone: string;

  @ApiProperty({ example: 'Số 12 Đại Cồ Việt, Hai Bà Trưng, Hà Nội', required: false })
  @IsString()
  @IsOptional()
  address?: string;
}

