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
} from 'class-validator';
import { Type } from 'class-transformer';

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
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  characterName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  seriesName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsInt()
  @Min(0)
  @IsOptional()
  dailyPrice?: number;

  @ApiPropertyOptional()
  @IsInt()
  @Min(0)
  @IsOptional()
  depositAmount?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
