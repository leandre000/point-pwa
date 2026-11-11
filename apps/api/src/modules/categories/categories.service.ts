import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import type { CreateCategoryInput } from '@kiraka/contracts';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * List all active categories sorted by display order.
   */
  async getActiveCategories(locale = 'en') {
    const categories = await this.prisma.serviceCategory.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
      include: {
        _count: {
          select: { jobs: true },
        },
      },
    });

    return categories.map((cat) => ({
      id: cat.id,
      slug: cat.slug,
      name:
        locale === 'rw'
          ? cat.nameRw
          : locale === 'fr'
            ? cat.nameFr
            : cat.nameEn,
      nameEn: cat.nameEn,
      nameRw: cat.nameRw,
      nameFr: cat.nameFr,
      iconName: cat.iconName,
      displayOrder: cat.displayOrder,
      isActive: cat.isActive,
      jobCount: cat._count.jobs,
    }));
  }

  async getCategoryBySlug(slug: string) {
    const cat = await this.prisma.serviceCategory.findUnique({
      where: { slug },
    });
    if (!cat) throw new NotFoundException(`Category ${slug} not found`);
    return cat;
  }

  async createCategory(input: CreateCategoryInput) {
    return this.prisma.serviceCategory.create({
      data: input,
    });
  }
}
