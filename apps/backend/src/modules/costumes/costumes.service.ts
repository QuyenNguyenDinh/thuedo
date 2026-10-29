import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Costume } from '../../entities/costume.entity';
import { CostumeImage } from '../../entities/costume-image.entity';
import { CostumeVariant } from '../../entities/costume-variant.entity';
import { QueryCostumesDto, CostumeSortBy } from './dto/query-costumes.dto';
import { CreateCostumeDto, UpdateCostumeDto } from './dto/costume.dto';

@Injectable()
export class CostumesService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(Costume)
    private costumeRepository: Repository<Costume>,
    @InjectRepository(CostumeImage)
    private imageRepository: Repository<CostumeImage>,
    @InjectRepository(CostumeVariant)
    private variantRepository: Repository<CostumeVariant>,
  ) { }

  async findAll(query: QueryCostumesDto, isAdmin = false) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(50, query.limit || 12));
    const skip = (page - 1) * limit;

    const qb = this.costumeRepository
      .createQueryBuilder('costume')
      .leftJoinAndSelect('costume.category', 'category')
      .leftJoinAndSelect('costume.images', 'image')
      .leftJoinAndSelect('costume.variants', 'variant');

    if (!isAdmin) {
      qb.andWhere('costume.isActive = :isActive', { isActive: true });
    }

    if (query.keyword && query.keyword.trim().length > 0) {
      const kw = `%${query.keyword.trim().toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(costume.name) LIKE :kw OR LOWER(costume.characterName) LIKE :kw OR LOWER(costume.seriesName) LIKE :kw)',
        { kw },
      );
    }

    if (query.categoryId) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        query.categoryId.trim(),
      );
      if (isUuid) {
        qb.andWhere('costume.categoryId = :catId', { catId: query.categoryId.trim() });
      } else {
        qb.andWhere('category.slug = :catSlug', { catSlug: query.categoryId.trim().toLowerCase() });
      }
    }

    if (query.size) {
      qb.andWhere('UPPER(variant.size) = :size', { size: query.size.trim().toUpperCase() });
    }

    if (query.minPrice !== undefined) {
      qb.andWhere('costume.dailyPrice >= :minPrice', { minPrice: query.minPrice });
    }

    if (query.maxPrice !== undefined) {
      qb.andWhere('costume.dailyPrice <= :maxPrice', { maxPrice: query.maxPrice });
    }

    // Sort strictly controlled
    if (query.sortBy === CostumeSortBy.PRICE_ASC) {
      qb.orderBy('costume.dailyPrice', 'ASC');
    } else if (query.sortBy === CostumeSortBy.PRICE_DESC) {
      qb.orderBy('costume.dailyPrice', 'DESC');
    } else {
      qb.orderBy('costume.createdAt', 'DESC');
    }

    qb.skip(skip).take(limit);

    const [items, total] = await qb.getManyAndCount();

    // Map helper fields
    const formatted = items.map((costume) => {
      const primaryImage =
        costume.images?.find((img) => img.isPrimary)?.imageUrl ||
        costume.images?.[0]?.imageUrl ||
        null;
      const availableSizes = Array.from(
        new Set(
          costume.variants
            ?.filter((v) => v.totalQuantity > v.outOfServiceQuantity)
            .map((v) => v.size) || [],
        ),
      );

      return {
        ...costume,
        primaryImage,
        availableSizes,
      };
    });

    return {
      items: formatted,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findById(id: string, isAdmin = false) {
    const qb = this.costumeRepository
      .createQueryBuilder('costume')
      .leftJoinAndSelect('costume.category', 'category')
      .leftJoinAndSelect('costume.images', 'image')
      .leftJoinAndSelect('costume.variants', 'variant')
      .where('costume.id = :id', { id });

    if (!isAdmin) {
      qb.andWhere('costume.isActive = :isActive', { isActive: true });
    }

    qb.orderBy('image.displayOrder', 'ASC').addOrderBy('variant.size', 'ASC');

    const costume = await qb.getOne();

    if (!costume) {
      throw new NotFoundException('Không tìm thấy trang phục.');
    }

    const primaryImage =
      costume.images?.find((img) => img.isPrimary)?.imageUrl ||
      costume.images?.[0]?.imageUrl ||
      null;

    return {
      ...costume,
      primaryImage,
    };
  }

  async create(dto: CreateCostumeDto) {
    const existing = await this.costumeRepository.findOne({
      where: { slug: dto.slug.trim().toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('Slug trang phục này đã tồn tại.');
    }

    const savedCostumeId = await this.dataSource.transaction(async (manager) => {
      const costume = manager.create(Costume, {
        categoryId: dto.categoryId,
        name: dto.name.trim(),
        slug: dto.slug.trim().toLowerCase(),
        characterName: dto.characterName?.trim() || null,
        seriesName: dto.seriesName?.trim() || null,
        description: dto.description.trim(),
        dailyPrice: dto.dailyPrice,
        depositAmount: dto.depositAmount,
        isActive: true,
      });

      const savedCostume = await manager.save(Costume, costume);

      // Save images atomically
      if (dto.images && dto.images.length > 0) {
        const images = dto.images.map((img, idx) =>
          manager.create(CostumeImage, {
            costumeId: savedCostume.id,
            imageUrl: img.imageUrl,
            altText: img.altText || savedCostume.name,
            isPrimary: img.isPrimary !== undefined ? img.isPrimary : idx === 0,
            displayOrder: img.displayOrder !== undefined ? img.displayOrder : idx,
          }),
        );
        await manager.save(CostumeImage, images);
      }

      // Save variants atomically
      if (dto.variants && dto.variants.length > 0) {
        const variants = dto.variants.map((v) =>
          manager.create(CostumeVariant, {
            costumeId: savedCostume.id,
            size: v.size.trim().toUpperCase(),
            sku: v.sku.trim(),
            totalQuantity: v.totalQuantity,
            outOfServiceQuantity: v.outOfServiceQuantity || 0,
          }),
        );
        await manager.save(CostumeVariant, variants);
      }

      return savedCostume.id;
    });

    return this.findById(savedCostumeId, true);
  }

  async update(id: string, dto: UpdateCostumeDto) {
    const costume = await this.costumeRepository.findOne({ where: { id } });
    if (!costume) {
      throw new NotFoundException('Không tìm thấy trang phục.');
    }

    await this.dataSource.transaction(async (manager) => {
      if (dto.categoryId !== undefined) costume.categoryId = dto.categoryId;
      if (dto.name !== undefined) {
        if (!dto.name || typeof dto.name !== 'string' || !dto.name.trim()) {
          throw new BadRequestException('Tên trang phục không được để trống.');
        }
        costume.name = dto.name.trim();
      }
      if (dto.characterName !== undefined) costume.characterName = dto.characterName ? String(dto.characterName).trim() : null;
      if (dto.seriesName !== undefined) costume.seriesName = dto.seriesName ? String(dto.seriesName).trim() : null;
      if (dto.description !== undefined) costume.description = dto.description ? String(dto.description).trim() : '';
      if (dto.dailyPrice !== undefined) costume.dailyPrice = dto.dailyPrice;
      if (dto.depositAmount !== undefined) costume.depositAmount = dto.depositAmount;
      if (dto.isActive !== undefined) costume.isActive = dto.isActive;

      await manager.save(Costume, costume);

      // Update images if provided
      if (dto.images && dto.images.length > 0) {
        await manager.delete(CostumeImage, { costumeId: id });
        const images = dto.images.map((img, idx) =>
          manager.create(CostumeImage, {
            costumeId: id,
            imageUrl: img.imageUrl,
            altText: img.altText || costume.name,
            isPrimary: img.isPrimary !== undefined ? img.isPrimary : idx === 0,
            displayOrder: img.displayOrder !== undefined ? img.displayOrder : idx,
          }),
        );
        await manager.save(CostumeImage, images);
      }
    });

    return this.findById(id, true);
  }

  async toggleActive(id: string) {
    const costume = await this.costumeRepository.findOne({ where: { id } });
    if (!costume) {
      throw new NotFoundException('Không tìm thấy trang phục.');
    }
    costume.isActive = !costume.isActive;
    await this.costumeRepository.save(costume);
    return {
      message: `Đã ${costume.isActive ? 'hiện' : 'ẩn'} trang phục thành công.`,
      isActive: costume.isActive,
    };
  }
}

