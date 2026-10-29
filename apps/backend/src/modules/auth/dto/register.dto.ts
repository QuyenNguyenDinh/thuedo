import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  Matches,
  IsOptional,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'khachhang@example.com', description: 'Địa chỉ email đăng ký duy nhất' })
  @IsEmail({}, { message: 'Địa chỉ email không đúng định dạng.' })
  @IsNotEmpty({ message: 'Email không được để trống.' })
  email: string;

  @ApiProperty({
    example: 'MatKhau123@',
    description: 'Mật khẩu tối thiểu 8 ký tự, có chữ hoa, chữ thường và chữ số',
  })
  @IsString()
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự.' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Mật khẩu phải chứa ít nhất một chữ hoa, một chữ thường và một chữ số.',
  })
  password: string;

  @ApiProperty({ example: 'Nguyễn Văn A', description: 'Họ và tên đầy đủ' })
  @IsString()
  @IsNotEmpty({ message: 'Họ và tên không được để trống.' })
  fullName: string;

  @ApiProperty({ example: '0912345678', description: 'Số điện thoại liên hệ' })
  @IsString()
  @Matches(/^(?:0|\+84)[35789][0-9]{8}$/, {
    message: 'Số điện thoại không đúng định dạng số di động Việt Nam.',
  })
  phone: string;

  @ApiProperty({ example: 'Số 12 Đại Cồ Việt, Hai Bà Trưng, Hà Nội', required: false })
  @IsString()
  @IsOptional()
  address?: string;
}

