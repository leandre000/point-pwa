import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import type {
  OnboardingInput,
  UpdateCustomerProfileInput,
  UpdateProviderProfileInput,
} from '@kiraka/contracts';

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get authenticated user's complete profile context.
   */
  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        customerProfile: true,
        providerProfile: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const hasCompletedOnboarding =
      !!user.customerProfile &&
      user.customerProfile.displayName !== 'New Neighbor' &&
      !!user.customerProfile.neighborhood;

    return {
      id: user.id,
      phone: user.phone,
      phoneVerified: !!user.phoneVerifiedAt,
      role: user.role,
      countryCode: user.countryCode,
      locale: user.locale,
      customerProfile: user.customerProfile,
      providerProfile: user.providerProfile,
      hasCompletedOnboarding,
    };
  }

  /**
   * Complete rapid onboarding flow (under 60s).
   */
  async completeOnboarding(userId: string, input: OnboardingInput) {
    // 1. Update customer profile
    await this.prisma.customerProfile.upsert({
      where: { userId },
      update: {
        displayName: input.displayName,
        neighborhood: input.neighborhood,
      },
      create: {
        userId,
        displayName: input.displayName,
        neighborhood: input.neighborhood,
      },
    });

    // 2. If provider mode chosen, initialize or update provider profile
    if (input.initialMode === 'work') {
      await this.prisma.providerProfile.upsert({
        where: { userId },
        update: {
          businessName: input.displayName,
          isVisible: true,
        },
        create: {
          userId,
          businessName: input.displayName,
          isVisible: true,
        },
      });
    }

    // 3. Update locale if passed
    if (input.locale) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { locale: input.locale },
      });
    }

    return this.getMe(userId);
  }

  /**
   * Update Customer Profile.
   */
  async updateCustomerProfile(userId: string, input: UpdateCustomerProfileInput) {
    const profile = await this.prisma.customerProfile.upsert({
      where: { userId },
      update: {
        displayName: input.displayName,
        neighborhood: input.neighborhood ?? null,
      },
      create: {
        userId,
        displayName: input.displayName,
        neighborhood: input.neighborhood ?? null,
      },
    });

    return profile;
  }

  /**
   * Update or create Provider Profile.
   */
  async updateProviderProfile(userId: string, input: UpdateProviderProfileInput) {
    const profile = await this.prisma.providerProfile.upsert({
      where: { userId },
      update: {
        businessName: input.businessName,
        bio: input.bio ?? null,
        isVisible: input.isVisible ?? true,
      },
      create: {
        userId,
        businessName: input.businessName,
        bio: input.bio ?? null,
        isVisible: input.isVisible ?? true,
      },
    });

    return profile;
  }

  /**
   * Public provider profile view.
   * Enforces BR-13: NO phone numbers or exact addresses exposed publicly!
   */
  async getPublicProvider(providerId: string) {
    const provider = await this.prisma.providerProfile.findUnique({
      where: { id: providerId },
      include: {
        user: {
          select: {
            id: true,
            customerProfile: {
              select: {
                neighborhood: true,
              },
            },
          },
        },
      },
    });

    if (!provider || !provider.isVisible) {
      throw new NotFoundException('Provider not found or currently unavailable');
    }

    return {
      id: provider.id,
      businessName: provider.businessName,
      bio: provider.bio,
      verificationLevel: provider.verificationLevel,
      completedJobs: provider.completedJobs,
      ratingAverage: provider.ratingAverage ? provider.ratingAverage / 100 : null,
      ratingCount: provider.ratingCount,
      // Coarse location only:
      area: provider.user.customerProfile?.neighborhood || 'Kigali',
    };
  }
}
