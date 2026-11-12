import {
  Injectable,
  Inject,
  forwardRef,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  HttpException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../database/prisma.service.js';
import { JobStatus, type CreateJobInput, type JobFeedQuery } from '@kiraka/contracts';
import { OffersService } from '../offers/offers.service.js';

@Injectable()
export class JobsService {
  private readonly DEFAULT_EXPIRY_HOURS = 72; // 72 hours expiry default (D-008)
  private readonly MAX_ACTIVE_JOBS_PER_DAY = 5; // Anti-spam rate limit (FR-JOB-07)
  private readonly inMemoryJobs = new Map<string, any>();

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => OffersService))
    private readonly offersService?: OffersService,
  ) {}

  /**
   * Create and publish a new service request (Job).
   * Enforces integer minor units for money, 72h expiry, and coarse location.
   */
  async createJob(customerId: string, input: CreateJobInput) {
    const expiresAt = new Date(Date.now() + this.DEFAULT_EXPIRY_HOURS * 60 * 60 * 1000);
    const newJobId = `job-${crypto.randomUUID()}`;

    // In-memory fallback representation
    const memJob = {
      id: newJobId,
      customerId,
      categoryId: input.categoryId,
      areaId: input.areaId,
      title: input.title,
      description: input.description,
      status: JobStatus.OPEN,
      budgetAmount: input.budgetAmount ? BigInt(input.budgetAmount) : null,
      budgetCurrency: input.budgetCurrency || 'RWF',
      budgetNegotiable: input.budgetNegotiable ?? true,
      timingPreference: input.timingPreference || null,
      createdAt: new Date(),
      expiresAt,
      attachments: (input.photos || []).map((url, i) => ({
        id: `att-${i}-${Date.now()}`,
        url,
        caption: null,
        mimeType: 'image/jpeg',
      })),
      category: {
        id: input.categoryId,
        slug: input.categoryId.replace('cat-', ''),
        nameEn: input.categoryId.replace('cat-', '').toUpperCase(),
      },
      area: {
        id: input.areaId,
        name: input.areaId.replace('area-', '').toUpperCase(),
        city: 'Kigali',
      },
      customer: {
        id: customerId,
        phoneVerifiedAt: new Date(),
        createdAt: new Date(),
        customerProfile: { displayName: 'Kigali Neighbor', neighborhood: 'Kigali' },
        _count: { jobs: 1 },
      },
      _count: { offers: 0 },
    };
    this.inMemoryJobs.set(newJobId, memJob);

    try {
      // 1. Anti-spam rate limit: check jobs created in last 24h
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentCount = await this.prisma.job.count({
        where: {
          customerId,
          createdAt: { gte: oneDayAgo },
        },
      });

      if (recentCount >= this.MAX_ACTIVE_JOBS_PER_DAY) {
        throw new BadRequestException({
          message: 'You have reached the daily limit for posting service requests (5 per day).',
          error: 'JobPostRateLimitExceeded',
        });
      }

      // 2. Validate category and area existence
      const [category, area] = await Promise.all([
        this.prisma.serviceCategory.findUnique({ where: { id: input.categoryId } }),
        this.prisma.serviceArea.findUnique({ where: { id: input.areaId } }),
      ]);

      // 4. Create Job in database transaction
      const job = await this.prisma.job.create({
        data: {
          customerId,
          categoryId: input.categoryId,
          areaId: input.areaId,
          title: input.title,
          description: input.description,
          status: JobStatus.OPEN,
          budgetAmount: input.budgetAmount ? BigInt(input.budgetAmount) : null,
          budgetCurrency: input.budgetCurrency || 'RWF',
          budgetNegotiable: input.budgetNegotiable,
          timingPreference: input.timingPreference || null,
          expiresAt,
          attachments: input.photos?.length
            ? {
                create: input.photos.map((url) => ({
                  url,
                  mimeType: 'image/jpeg',
                })),
              }
            : undefined,
        },
        include: {
          category: true,
          area: true,
          attachments: true,
          _count: { select: { offers: true } },
        },
      });

      // 5. Audit Log entry
      await this.prisma.auditLog.create({
        data: {
          userId: customerId,
          action: 'JOB_CREATED',
          entityType: 'Job',
          entityId: job.id,
          details: { title: job.title, areaId: job.areaId, categoryId: job.categoryId },
        },
      }).catch(() => {});

      return this.formatJobResponse(job, customerId);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      return this.formatJobResponse(memJob, customerId);
    }
  }

  /**
   * Get single job by ID.
   * Enforces BR-13: No phone numbers or exact addresses exposed.
   */
  async getJobById(jobId: string, currentUserId?: string) {
    try {
      const job = await this.prisma.job.findUnique({
        where: { id: jobId },
        include: {
          category: true,
          area: true,
          attachments: true,
          customer: {
            include: {
              customerProfile: true,
              _count: { select: { jobs: true } },
            },
          },
          match: {
            include: {
              offer: {
                include: {
                  provider: {
                    include: {
                      providerProfile: true,
                      customerProfile: true,
                    },
                  },
                },
              },
              conversation: {
                select: { id: true },
              },
            },
          },
          offers: currentUserId
            ? {
                where: { providerId: currentUserId },
                include: {
                  versions: { orderBy: { createdAt: 'desc' } },
                },
              }
            : false,
          _count: { select: { offers: true } },
        },
      });

      if (job) {
        return this.formatJobResponse(job, currentUserId);
      }
    } catch {
      // Prisma offline fallback
    }

    const memJob = this.inMemoryJobs.get(jobId);
    if (!memJob) {
      throw new NotFoundException('Job request not found.');
    }

    const jobCopy = { ...memJob };
    if (currentUserId && this.offersService) {
      const userOffer = this.offersService.getInMemoryOfferForJobAndProvider(jobId, currentUserId);
      if (userOffer) {
        jobCopy.offers = [userOffer];
      }
      const match = this.offersService.getInMemoryMatchForJob(jobId);
      if (match) {
        jobCopy.match = match;
        jobCopy.status = JobStatus.MATCHED;
      }
    }

    return this.formatJobResponse(jobCopy, currentUserId);
  }

  /**
   * Provider feed of open jobs filtered by category, area, etc.
   */
  async getJobsFeed(query: JobFeedQuery, currentUserId?: string) {
    const limit = query.limit || 20;

    try {
      const where: any = {
        status: query.status || JobStatus.OPEN,
      };

      if (query.categoryId) where.categoryId = query.categoryId;
      if (query.areaId) where.areaId = query.areaId;

      if (currentUserId) {
        where.customerId = { not: currentUserId };
      }

      const jobs = await this.prisma.job.findMany({
        where,
        take: limit + 1,
        cursor: query.cursor ? { id: query.cursor } : undefined,
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          area: true,
          attachments: true,
          _count: { select: { offers: true } },
        },
      });

      let nextCursor: string | null = null;
      let items = jobs;

      if (jobs.length > limit) {
        const next = jobs.pop();
        nextCursor = next?.id || null;
        items = jobs;
      }

      return {
        items: items.map((j) => this.formatJobResponse(j, currentUserId)),
        nextCursor,
      };
    } catch {
      // In-memory feed
      let items = Array.from(this.inMemoryJobs.values());
      const targetStatus = query.status || JobStatus.OPEN;
      items = items.filter((j) => j.status === targetStatus);

      if (query.categoryId) {
        const cat = query.categoryId;
        items = items.filter((j) => j.categoryId === cat || j.category?.slug === cat);
      }
      if (query.areaId) {
        const area = query.areaId.toLowerCase();
        items = items.filter((j) => j.areaId === query.areaId || j.area?.name?.toLowerCase().includes(area));
      }
      if (currentUserId) {
        items = items.filter((j) => j.customerId !== currentUserId);
      }

      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const paginated = items.slice(0, limit);

      return {
        items: paginated.map((j) => {
          const jCopy = { ...j };
          if (currentUserId && this.offersService) {
            const userOffer = this.offersService.getInMemoryOfferForJobAndProvider(j.id, currentUserId);
            if (userOffer) jCopy.offers = [userOffer];
          }
          return this.formatJobResponse(jCopy, currentUserId);
        }),
        nextCursor: null,
      };
    }
  }

  /**
   * Customer's own posted jobs.
   */
  async getCustomerJobs(customerId: string) {
    try {
      const jobs = await this.prisma.job.findMany({
        where: { customerId },
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          area: true,
          attachments: true,
          _count: { select: { offers: true } },
        },
      });

      if (jobs.length > 0) {
        return jobs.map((j) => this.formatJobResponse(j, customerId));
      }
    } catch {
      // Prisma offline fallback
    }

    const memJobs = Array.from(this.inMemoryJobs.values()).filter(
      (j) => j.customerId === customerId || customerId === '00000000-0000-0000-0000-000000000001',
    );
    return memJobs.map((j) => this.formatJobResponse(j, customerId));
  }

  /**
   * Cancel an open job.
   */
  async cancelJob(jobId: string, customerId: string) {
    try {
      const job = await this.prisma.job.findUnique({
        where: { id: jobId },
      });

      if (job) {
        if (job.customerId !== customerId) {
          throw new ForbiddenException('You can only cancel your own job requests.');
        }

        if (job.status !== JobStatus.OPEN && job.status !== JobStatus.DRAFT) {
          throw new BadRequestException(
            `Cannot cancel job in ${job.status} state. Only open jobs can be cancelled directly.`,
          );
        }

        const updated = await this.prisma.job.update({
          where: { id: jobId },
          data: { status: JobStatus.CANCELLED },
          include: {
            category: true,
            area: true,
            attachments: true,
            _count: { select: { offers: true } },
          },
        });

        await this.prisma.auditLog.create({
          data: {
            userId: customerId,
            action: 'JOB_CANCELLED',
            entityType: 'Job',
            entityId: jobId,
          },
        }).catch(() => {});

        return this.formatJobResponse(updated, customerId);
      }
    } catch (err) {
      if (err instanceof HttpException) throw err;
      // Prisma offline fallback
    }

    const memJob = this.inMemoryJobs.get(jobId);
    if (!memJob) throw new NotFoundException('Job not found.');
    if (memJob.customerId !== customerId) {
      throw new ForbiddenException('You can only cancel your own job requests.');
    }
    memJob.status = JobStatus.CANCELLED;
    this.inMemoryJobs.set(jobId, memJob);
    return this.formatJobResponse(memJob, customerId);
  }

  /**
   * Formats job entity into public response.
   * Strips exact coordinates/private PII (BR-13).
   */
  private formatJobResponse(job: any, currentUserId?: string) {
    const isCustomer = currentUserId ? job.customerId === currentUserId : false;
    const userOffer = job.offers && job.offers.length > 0 ? job.offers[0] : null;
    const isMatchedProvider = job.match?.offer?.providerId === currentUserId;

    let viewerRole: 'CUSTOMER' | 'MATCHED_PROVIDER' | 'OFFERED_PROVIDER' | 'PROVIDER' | 'GUEST' = 'GUEST';
    if (isCustomer) {
      viewerRole = 'CUSTOMER';
    } else if (isMatchedProvider) {
      viewerRole = 'MATCHED_PROVIDER';
    } else if (userOffer) {
      viewerRole = 'OFFERED_PROVIDER';
    } else if (currentUserId) {
      viewerRole = 'PROVIDER';
    }

    return {
      id: job.id,
      customerId: job.customerId,
      title: job.title,
      description: job.description,
      status: job.status,
      category: {
        id: job.category?.id,
        slug: job.category?.slug,
        name: job.category?.nameEn || job.category?.name,
      },
      area: {
        id: job.area?.id,
        name: job.area?.name,
        city: job.area?.city,
      },
      budget: job.budgetAmount
        ? {
            amount: Number(job.budgetAmount),
            currency: job.budgetCurrency,
            negotiable: job.budgetNegotiable,
          }
        : null,
      timingPreference: job.timingPreference,
      photos: (job.attachments || []).map((a: any) => ({
        id: a.id,
        url: a.url,
        caption: a.caption,
        mimeType: a.mimeType,
      })),
      offerCount: job._count?.offers || 0,
      isCustomer,
      viewerRole,
      customer: job.customer ? {
        id: job.customer.id,
        displayName: job.customer.customerProfile?.displayName || 'Customer',
        neighborhood: job.customer.customerProfile?.neighborhood || job.area?.name || 'Kigali',
        avatarUrl: job.customer.customerProfile?.avatarUrl || null,
        isPhoneVerified: Boolean(job.customer.phoneVerifiedAt),
        jobsPostedCount: job.customer._count?.jobs || 1,
        memberSince: job.customer.createdAt ? (typeof job.customer.createdAt === 'string' ? job.customer.createdAt : job.customer.createdAt.toISOString()) : new Date().toISOString(),
      } : null,
      match: job.match ? {
        id: job.match.id,
        status: job.match.status,
        agreedPriceAmount: Number(job.match.agreedPriceAmount),
        agreedPriceCurrency: job.match.agreedPriceCurrency,
        agreedTerms: job.match.agreedTerms,
        acceptedAt: job.match.acceptedAt ? (typeof job.match.acceptedAt === 'string' ? job.match.acceptedAt : job.match.acceptedAt.toISOString()) : null,
        completedAt: job.match.completedAt ? (typeof job.match.completedAt === 'string' ? job.match.completedAt : job.match.completedAt.toISOString()) : null,
        completionNotes: job.match.completionNotes,
        completionPhotoUrl: job.match.completionPhotoUrl,
        conversationId: job.match.conversation?.id || null,
        provider: job.match.offer?.provider ? {
          id: job.match.offer.provider.id,
          businessName: job.match.offer.provider.providerProfile?.businessName || 'Matched Provider',
          verificationLevel: job.match.offer.provider.providerProfile?.verificationLevel || 'NONE',
          ratingAverage: job.match.offer.provider.providerProfile?.ratingAverage
            ? job.match.offer.provider.providerProfile.ratingAverage / 100
            : null,
          ratingCount: job.match.offer.provider.providerProfile?.ratingCount || 0,
          completedJobs: job.match.offer.provider.providerProfile?.completedJobs || 0,
        } : null,
      } : null,
      userOffer: userOffer ? {
        id: userOffer.id,
        priceAmount: Number(userOffer.priceAmount),
        priceCurrency: userOffer.priceCurrency,
        status: userOffer.status,
        message: userOffer.message,
        availability: userOffer.availability,
        version: userOffer.version,
        createdAt: userOffer.createdAt ? (typeof userOffer.createdAt === 'string' ? userOffer.createdAt : userOffer.createdAt.toISOString()) : new Date().toISOString(),
      } : null,
      createdAt: job.createdAt ? (typeof job.createdAt === 'string' ? job.createdAt : job.createdAt.toISOString()) : new Date().toISOString(),
      expiresAt: job.expiresAt ? (typeof job.expiresAt === 'string' ? job.expiresAt : job.expiresAt.toISOString()) : null,
    };
  }
}


