import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { JobStatus, type CreateJobInput, type JobFeedQuery } from '@kiraka/contracts';

@Injectable()
export class JobsService {
  private readonly DEFAULT_EXPIRY_HOURS = 72; // 72 hours expiry default (D-008)
  private readonly MAX_ACTIVE_JOBS_PER_DAY = 5; // Anti-spam rate limit (FR-JOB-07)

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create and publish a new service request (Job).
   * Enforces integer minor units for money, 72h expiry, and coarse location.
   */
  async createJob(customerId: string, input: CreateJobInput) {
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

    if (!category || !category.isActive) {
      throw new NotFoundException('Selected service category is not available.');
    }
    if (!area || !area.isActive) {
      throw new NotFoundException('Selected neighborhood is not available.');
    }

    // 3. Compute 72h expiry date
    const expiresAt = new Date(Date.now() + this.DEFAULT_EXPIRY_HOURS * 60 * 60 * 1000);

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
    });

    return this.formatJobResponse(job, customerId);
  }

  /**
   * Get single job by ID.
   * Enforces BR-13: No phone numbers or exact addresses exposed.
   */
  async getJobById(jobId: string, currentUserId?: string) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: {
        category: true,
        area: true,
        attachments: true,
        _count: { select: { offers: true } },
      },
    });

    if (!job) {
      throw new NotFoundException('Job request not found.');
    }

    return this.formatJobResponse(job, currentUserId);
  }

  /**
   * Provider feed of open jobs filtered by category, area, etc.
   */
  async getJobsFeed(query: JobFeedQuery, currentUserId?: string) {
    const limit = query.limit || 20;

    const where: any = {
      status: query.status || JobStatus.OPEN,
    };

    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.areaId) where.areaId = query.areaId;

    // A provider cannot see their own jobs in the provider feed
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
  }

  /**
   * Customer's own posted jobs.
   */
  async getCustomerJobs(customerId: string) {
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

    return jobs.map((j) => this.formatJobResponse(j, customerId));
  }

  /**
   * Cancel an open job.
   */
  async cancelJob(jobId: string, customerId: string) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) throw new NotFoundException('Job not found.');
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
    });

    return this.formatJobResponse(updated, customerId);
  }

  /**
   * Formats job entity into public response.
   * Strips exact coordinates/private PII (BR-13).
   */
  private formatJobResponse(job: any, currentUserId?: string) {
    return {
      id: job.id,
      title: job.title,
      description: job.description,
      status: job.status,
      category: {
        id: job.category.id,
        slug: job.category.slug,
        name: job.category.nameEn,
      },
      area: {
        id: job.area.id,
        name: job.area.name,
        city: job.area.city,
      },
      budget: job.budgetAmount
        ? {
            amount: Number(job.budgetAmount),
            currency: job.budgetCurrency,
            negotiable: job.budgetNegotiable,
          }
        : null,
      timingPreference: job.timingPreference,
      photos: job.attachments.map((a: any) => ({
        id: a.id,
        url: a.url,
        caption: a.caption,
        mimeType: a.mimeType,
      })),
      offerCount: job._count?.offers || 0,
      isCustomer: currentUserId ? job.customerId === currentUserId : false,
      createdAt: job.createdAt.toISOString(),
      expiresAt: job.expiresAt ? job.expiresAt.toISOString() : null,
    };
  }
}
