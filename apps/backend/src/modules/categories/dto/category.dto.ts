import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsInt, Min, ValidateIf, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Anime & Manga', description: 'Tên danh mục' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'Tên danh mục phải là chuỗi.' })
  @IsNotEmpty({ message: 'Tên danh mục không được để trống.' })
  name: string;

  @ApiProperty({ example: 'anime-manga', description: 'Slug duy nhất' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsString({ message: 'Slug phải là chuỗi.' })
  @IsNotEmpty({ message: 'Slug không được để trống.' })
  slug: string;

  @ApiProperty({ example: 'Trang phục từ các bộ anime/manga đình đám', required: false })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 1, default: 0, required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  displayOrder?: number;
}

export class UpdateCategoryDto {
  @ApiProperty({ example: 'Anime & Manga Cập Nhật', required: false })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @ValidateIf((_object, value) => value !== undefined)
  @IsString({ message: 'Tên danh mục phải là chuỗi.' })
  @IsNotEmpty({ message: 'Tên danh mục không được để trống.' })
  name?: string;

  @ApiProperty({ example: 'Mô tả cập nhật', required: false })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @ValidateIf((_object, value) => value !== undefined)
  @IsString({ message: 'Mô tả phải là chuỗi.' })
  description?: string;

  @ApiProperty({ example: 2, required: false })
  @ValidateIf((_object, value) => value !== undefined)
  @IsInt({ message: 'Thứ tự hiển thị phải là số nguyên.' })
  @Min(0)
  displayOrder?: number;

  @ApiProperty({ example: true, required: false })
  @ValidateIf((_object, value) => value !== undefined)
  @IsBoolean({ message: 'Trạng thái hoạt động phải là boolean.' })
  isActive?: boolean;
}

