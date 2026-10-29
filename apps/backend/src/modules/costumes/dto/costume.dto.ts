import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsInt,
  Min,
  IsArray,
  ValidateNested,
  IsOptional,
  IsBoolean,
  ValidateIf,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CostumeImageDto {
  @ApiProperty({ example: 'https://images.unsplash.com/photo-1578632767115-351597cf2477' })
  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @ApiPropertyOptional({ example: 'Ảnh chính diện Raiden Shogun' })
  @IsString()
  @IsOptional()
  altText?: string;

  @ApiPropertyOptional({ example: true, default: false })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsInt()
  @IsOptional()
  displayOrder?: number;
}

export class CostumeVariantDto {
  @ApiProperty({ example: 'M' })
  @IsString()
  @IsNotEmpty()
  size: string;

  @ApiProperty({ example: 'CR-RAIDEN-M' })
  @IsString()
  @IsNotEmpty()
  sku: string;

  @ApiProperty({ example: 3, default: 1 })
  @IsInt()
  @Min(0)
  totalQuantity: number;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  outOfServiceQuantity?: number;
}

export class CreateCostumeDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({ example: 'Raiden Shogun - Genshin Impact' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'raiden-shogun-genshin-impact' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiPropertyOptional({ example: 'Raiden Shogun' })
  @IsString()
  @IsOptional()
  characterName?: string;

  @ApiPropertyOptional({ example: 'Genshin Impact' })
  @IsString()
  @IsOptional()
  seriesName?: string;

  @ApiProperty({ example: 'Trọn bộ trang phục kimono cách tân lụa gấm, bao gồm tóc giả và giáp vai...' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 200000, description: 'Giá thuê mỗi ngày (VND)' })
  @IsInt()
  @Min(0)
  dailyPrice: number;

  @ApiProperty({ example: 600000, description: 'Tiền cọc mỗi bộ (VND)' })
  @IsInt()
  @Min(0)
  depositAmount: number;

  @ApiPropertyOptional({ type: [CostumeImageDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CostumeImageDto)
  @IsOptional()
  images?: CostumeImageDto[];

  @ApiPropertyOptional({ type: [CostumeVariantDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CostumeVariantDto)
  @IsOptional()
  variants?: CostumeVariantDto[];
}

export class UpdateCostumeDto {
  @ApiPropertyOptional()
  @ValidateIf((_object, value) => value !== undefined)
  @IsUUID('4', { message: 'Mã danh mục phải là UUID hợp lệ.' })
  categoryId?: string;

  @ApiPropertyOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @ValidateIf((_object, value) => value !== undefined)
  @IsString({ message: 'Tên trang phục phải là chuỗi.' })
  @IsNotEmpty({ message: 'Tên trang phục không được để trống.' })
  name?: string;

  @ApiPropertyOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @ValidateIf((_object, value) => value !== undefined)
  @IsString({ message: 'Tên nhân vật phải là chuỗi.' })
  characterName?: string;

  @ApiPropertyOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @ValidateIf((_object, value) => value !== undefined)
  @IsString({ message: 'Tên series phải là chuỗi.' })
  seriesName?: string;

  @ApiPropertyOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @ValidateIf((_object, value) => value !== undefined)
  @IsString({ message: 'Mô tả phải là chuỗi.' })
  description?: string;

  @ApiPropertyOptional()
  @ValidateIf((_object, value) => value !== undefined)
  @IsInt({ message: 'Giá thuê theo ngày phải là số nguyên.' })
  @Min(0, { message: 'Giá thuê theo ngày không được âm.' })
  dailyPrice?: number;

  @ApiPropertyOptional()
  @ValidateIf((_object, value) => value !== undefined)
  @IsInt({ message: 'Tiền đặt cọc phải là số nguyên.' })
  @Min(0, { message: 'Tiền đặt cọc không được âm.' })
  depositAmount?: number;

  @ApiPropertyOptional()
  @ValidateIf((_object, value) => value !== undefined)
  @IsBoolean({ message: 'Trạng thái hoạt động phải là boolean.' })
  isActive?: boolean;

  @ApiPropertyOptional({ type: [CostumeImageDto] })
  @ValidateIf((_object, value) => value !== undefined)
  @IsArray({ message: 'Danh sách hình ảnh phải là mảng.' })
  @ValidateNested({ each: true })
  @Type(() => CostumeImageDto)
  images?: CostumeImageDto[];
}

