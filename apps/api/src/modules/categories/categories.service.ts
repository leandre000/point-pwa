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
    try {
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
    } catch {
      // Fallback reference categories (D-014: zero fake job counts)
      const fallbackList = [
        {
          id: 'cat-cleaning-01',
          slug: 'cleaning',
          nameEn: 'Cleaning',
          nameRw: 'Isuku',
          nameFr: 'Nettoyage',
          iconName: 'cleaning',
          displayOrder: 1,
          jobCount: 0,
        },
        {
          id: 'cat-plumbing-02',
          slug: 'plumbing',
          nameEn: 'Plumbing',
          nameRw: 'Amatiyo',
          nameFr: 'Plomberie',
          iconName: 'plumbing',
          displayOrder: 2,
          jobCount: 0,
        },
        {
          id: 'cat-electrical-03',
          slug: 'electrical',
          nameEn: 'Electrical',
          nameRw: 'Amashanyarazi',
          nameFr: 'Électricité',
          iconName: 'electrical',
          displayOrder: 3,
          jobCount: 0,
        },
        {
          id: 'cat-carpentry-04',
          slug: 'carpentry',
          nameEn: 'Carpentry',
          nameRw: 'Ububaji',
          nameFr: 'Menuiserie',
          iconName: 'carpentry',
          displayOrder: 4,
          jobCount: 0,
        },
        {
          id: 'cat-maintenance-05',
          slug: 'maintenance',
          nameEn: 'General Maintenance',
          nameRw: 'Gusana',
          nameFr: 'Maintenance Générale',
          iconName: 'maintenance',
          displayOrder: 5,
          jobCount: 0,
        },
      ];

      return fallbackList.map((cat) => ({
        id: cat.id,
        slug: cat.slug,
        name: locale === 'rw' ? cat.nameRw : locale === 'fr' ? cat.nameFr : cat.nameEn,
        nameEn: cat.nameEn,
        nameRw: cat.nameRw,
        nameFr: cat.nameFr,
        iconName: cat.iconName,
        displayOrder: cat.displayOrder,
        isActive: true,
        jobCount: cat.jobCount,
      }));
    }
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

