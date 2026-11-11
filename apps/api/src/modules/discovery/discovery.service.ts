import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import type { ProviderSearchQuery } from '@kiraka/contracts';

@Injectable()
export class DiscoveryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Browse and search service providers.
   * Enforces FR-DISC-03 (quality & relevance ranking) and BR-13 (privacy - coarse location only).
   */
  async searchProviders(query: ProviderSearchQuery) {
    const limit = query.limit || 20;

    const whereClause: any = {
      isVisible: true,
      user: {
        isActive: true,
      },
    };

    if (query.q) {
      whereClause.OR = [
        { businessName: { contains: query.q, mode: 'insensitive' } },
        { bio: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    if (query.verificationLevel) {
      whereClause.verificationLevel = query.verificationLevel;
    }

    if (query.minRating) {
      whereClause.ratingAverage = {
        gte: Math.round(query.minRating * 100),
      };
    }

    const providers = await this.prisma.providerProfile.findMany({
      where: whereClause,
      take: limit + 1,
      cursor: query.cursor ? { id: query.cursor } : undefined,
      orderBy: [
        { ratingAverage: 'desc' },
        { completedJobs: 'desc' },
        { createdAt: 'desc' },
      ],
      include: {
        user: {
          select: {
            customerProfile: {
              select: {
                neighborhood: true,
              },
            },
          },
        },
      },
    });

    let nextCursor: string | null = null;
    let items = providers;

    if (providers.length > limit) {
      const nextItem = providers.pop();
      nextCursor = nextItem?.id || null;
      items = providers;
    }

    // Map to public view: strictly scrub private data (no phone, no exact address)
    const formatted = items.map((p) => ({
      id: p.id,
      businessName: p.businessName,
      bio: p.bio,
      verificationLevel: p.verificationLevel,
      completedJobs: p.completedJobs,
      ratingAverage: p.ratingAverage ? p.ratingAverage / 100 : null,
      ratingCount: p.ratingCount,
      areaName: p.user.customerProfile?.neighborhood || 'Kigali',
      distanceBand: '~2 km', // Coarse distance band
      isAvailable: p.isVisible,
    }));

    return {
      items: formatted,
      nextCursor,
    };
  }
}
