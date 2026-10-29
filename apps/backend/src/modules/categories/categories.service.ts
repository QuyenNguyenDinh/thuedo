import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../../entities/category.entity';
import { Costume } from '../../entities/costume.entity';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(Costume)
    private costumeRepository: Repository<Costume>,
  ) {}

  async findAllActive(): Promise<Category[]> {
    return this.categoryRepository.find({
      where: { isActive: true },
      order: { displayOrder: 'ASC', name: 'ASC' },
    });
  }

  async findAllForAdmin(): Promise<any[]> {
    const categories = await this.categoryRepository.find({
      order: { displayOrder: 'ASC', createdAt: 'DESC' },
    });

    const results = [];
    for (const cat of categories) {
      const costumeCount = await this.costumeRepository.count({
        where: { categoryId: cat.id },
      });
      results.push({
        ...cat,
        costumeCount,
        costumesCount: costumeCount,
      });
    }
    return results;
  }

  async findById(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException('Không tìm thấy danh mục.');
    }
    return category;
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    const existing = await this.categoryRepository.findOne({
      where: { slug: dto.slug.trim().toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('Slug danh mục này đã tồn tại.');
    }

    const category = this.categoryRepository.create({
      name: dto.name.trim(),
      slug: dto.slug.trim().toLowerCase(),
      description: dto.description?.trim() || null,
      displayOrder: dto.displayOrder || 0,
      isActive: true,
    });

    return this.categoryRepository.save(category);
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findById(id);

    if (dto.name !== undefined) {
      if (!dto.name || typeof dto.name !== 'string' || !dto.name.trim()) {
        throw new BadRequestException('Tên danh mục không được để trống.');
      }
      category.name = dto.name.trim();
    }
    if (dto.description !== undefined) {
      category.description = dto.description ? String(dto.description).trim() : '';
    }
    if (dto.displayOrder !== undefined) category.displayOrder = dto.displayOrder;
    if (dto.isActive !== undefined) category.isActive = dto.isActive;

    return this.categoryRepository.save(category);
  }

  async delete(id: string): Promise<{ message: string }> {
    const category = await this.findById(id);

    const count = await this.costumeRepository.count({
      where: { categoryId: id },
    });

    if (count > 0) {
      // Soft-hide instead of breaking foreign keys
      category.isActive = false;
      await this.categoryRepository.save(category);
      return {
        message: 'Danh mục đã có sản phẩm nên đã được chuyển sang trạng thái Ẩn để bảo toàn dữ liệu.',
      };
    }

    await this.categoryRepository.remove(category);
    return { message: 'Đã xóa danh mục thành công.' };
  }
}

