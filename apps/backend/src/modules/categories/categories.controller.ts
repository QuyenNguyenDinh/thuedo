import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách các danh mục đang kích hoạt cho khách hàng' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công' })
  async getCategories() {
    return this.categoriesService.findAllActive();
  }
}

