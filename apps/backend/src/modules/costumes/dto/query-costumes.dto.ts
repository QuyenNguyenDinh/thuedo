import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  IsInt,
  Min,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum CostumeSortBy {
  CREATED_AT_DESC = 'createdAt_desc',
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
}

export class QueryCostumesDto {
  @ApiPropertyOptional({ description: 'Từ khóa tìm kiếm theo tên hoặc nhân vật' })
  @IsString()
  @IsOptional()
  keyword?: string;

  @ApiPropertyOptional({ description: 'Mã UUID danh mục hoặc slug (VD: anime-manga)' })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Kích cỡ (S, M, L, XL,...)' })
  @IsString()
  @IsOptional()
  size?: string;

  @ApiPropertyOptional({ description: 'Giá thuê tối thiểu/ngày (VND)' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Giá thuê tối đa/ngày (VND)' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  maxPrice?: number;

  @ApiPropertyOptional({ description: 'Số trang', default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Số bản ghi mỗi trang', default: 12 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 12;

  @ApiPropertyOptional({
    enum: CostumeSortBy,
    default: CostumeSortBy.CREATED_AT_DESC,
    description: 'Sắp xếp kết quả',
  })
  @IsIn([
    CostumeSortBy.CREATED_AT_DESC,
    CostumeSortBy.PRICE_ASC,
    CostumeSortBy.PRICE_DESC,
  ])
  @IsOptional()
  sortBy?: CostumeSortBy = CostumeSortBy.CREATED_AT_DESC;
}

