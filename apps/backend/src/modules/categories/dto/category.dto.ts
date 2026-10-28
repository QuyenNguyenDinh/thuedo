import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsInt, Min } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Anime & Manga', description: 'Tên danh mục' })
  @IsString()
  @IsNotEmpty({ message: 'Tên danh mục không được để trống.' })
  name: string;

  @ApiProperty({ example: 'anime-manga', description: 'Slug duy nhất' })
  @IsString()
  @IsNotEmpty({ message: 'Slug không được để trống.' })
  slug: string;

  @ApiProperty({ example: 'Trang phục từ các bộ anime/manga đình đám', required: false })
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
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'Mô tả cập nhật', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 2, required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  displayOrder?: number;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  isActive?: boolean;
}
