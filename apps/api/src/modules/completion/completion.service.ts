import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import {
  ReportCompletionInput,
  ConfirmCompletionInput,
  CreateDisputeInput,
  CreateReviewInput,
  JobStatus,
  MatchStatus,
  NotificationType,
  DisputeStatus,
} from '@kiraka/contracts';

@Injectable()
export class CompletionService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Provider reports completion (FR-COMP-01).
   * Non-negotiable Rule #4 / BR-06: Completion reported is NOT completion confirmed!
   * Transitions job status to COMPLETION_REPORTED, awaiting customer confirmation.
   */
  async reportCompletion(matchId: string, providerId: string, input: ReportCompletionInput) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        job: true,
        offer: true,
      },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    if (match.offer.providerId !== providerId) {
      throw new ForbiddenException('Only the matched service provider can report completion');
    }

    if (match.status !== 'ACTIVE') {
      throw new BadRequestException(`Cannot report completion on match with status ${match.status}`);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      // 1. Update Match with notes & optional photo
      const updatedMatch = await tx.match.update({
        where: { id: matchId },
        data: {
          completionNotes: input.notes,
          completionPhotoUrl: input.photoUrl,
        },
      });

      // 2. Transition Job to COMPLETION_REPORTED
      await tx.job.update({
        where: { id: match.jobId },
        data: {
          status: JobStatus.COMPLETION_REPORTED,
        },
      });

      // 3. Notify customer: Action required within 72 hours
      await tx.notification.create({
        data: {
          userId: match.job.customerId,
          type: NotificationType.COMPLETION_REPORTED,
          title: 'Job completion reported',
          body: 'The provider has marked the job as finished. Please inspect the work and confirm completion, or raise an issue within 72 hours.',
          entityType: 'MATCH',
          entityId: matchId,
        },
      });

      // 4. Audit log
      await tx.auditLog.create({
        data: {
          userId: providerId,
          action: 'COMPLETION_REPORTED',
          entityType: 'MATCH',
          entityId: matchId,
          details: {
            notes: input.notes,
            photoUrl: input.photoUrl,
          },
        },
      });

      return updatedMatch;
    });

    return {
      success: true,
      message: 'Completion reported successfully. Awaiting customer confirmation.',
      matchId: updated.id,
      status: JobStatus.COMPLETION_REPORTED,
    };
  }

  /**
   * Customer confirms completion (FR-COMP-02).
   * Non-negotiable Rule #4 / BR-06: Customer confirmation completes the job.
   * Increments provider's completedJobs counter.
   */
  async confirmCompletion(matchId: string, customerId: string, input?: ConfirmCompletionInput) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        job: true,
        offer: true,
      },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    if (match.job.customerId !== customerId) {
      throw new ForbiddenException('Only the job customer can confirm completion (BR-06)');
    }

    if (match.status === 'COMPLETED') {
      throw new BadRequestException('This job is already marked as completed');
    }

    if (match.status !== 'ACTIVE') {
      throw new BadRequestException(`Cannot confirm completion on match with status ${match.status}`);
    }

    const now = new Date();

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Mark Match as COMPLETED
      const updatedMatch = await tx.match.update({
        where: { id: matchId },
        data: {
          status: MatchStatus.COMPLETED,
          completedAt: now,
        },
      });

      // 2. Mark Job as COMPLETED
      await tx.job.update({
        where: { id: match.jobId },
        data: {
          status: JobStatus.COMPLETED,
        },
      });

      // 3. Increment completedJobs for provider profile
      await tx.providerProfile.updateMany({
        where: { userId: match.offer.providerId },
        data: {
          completedJobs: {
            increment: 1,
          },
        },
      });

      // 4. Send notification to provider
      await tx.notification.create({
        data: {
          userId: match.offer.providerId,
          type: NotificationType.COMPLETION_CONFIRMED,
          title: 'Job completion confirmed!',
          body: 'The customer confirmed completion. Both of you can now leave a mutual review.',
          entityType: 'MATCH',
          entityId: matchId,
        },
      });

      // 5. Send notification to customer prompting review
      await tx.notification.create({
        data: {
          userId: customerId,
          type: NotificationType.COMPLETION_CONFIRMED,
          title: 'Job completed!',
          body: 'Thank you for confirming completion. Please take a moment to rate and review your provider.',
          entityType: 'MATCH',
          entityId: matchId,
        },
      });

      // 6. Audit log
      await tx.auditLog.create({
        data: {
          userId: customerId,
          action: 'COMPLETION_CONFIRMED',
          entityType: 'MATCH',
          entityId: matchId,
          details: {
            feedback: input?.feedback,
          },
        },
      });

      return updatedMatch;
    });

    return {
      success: true,
      message: 'Job completion confirmed. You may now leave a review.',
      matchId: result.id,
      status: MatchStatus.COMPLETED,
    };
  }

  /**
   * Raise a dispute on a match (FR-DSP-01).
   * Either party can raise a dispute if terms are violated, work is substandard, or no-show occurs.
   */
  async raiseDispute(matchId: string, userId: string, input: CreateDisputeInput) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        job: true,
        offer: true,
        dispute: true,
      },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    const isCustomer = match.job.customerId === userId;
    const isProvider = match.offer.providerId === userId;

    if (!isCustomer && !isProvider) {
      throw new ForbiddenException('Only participants in this match can open a dispute');
    }

    if (match.dispute) {
      throw new ConflictException('A dispute is already open for this match');
    }

    if (match.status === 'CANCELLED') {
      throw new BadRequestException('Cannot dispute a cancelled match');
    }

    const otherPartyId = isCustomer ? match.offer.providerId : match.job.customerId;

    const dispute = await this.prisma.$transaction(async (tx) => {
      // 1. Create Dispute record
      const newDispute = await tx.dispute.create({
        data: {
          matchId,
          raisedById: userId,
          reason: input.reason,
          description: input.description,
          evidenceUrls: input.evidenceUrls || [],
          status: DisputeStatus.OPEN,
        },
      });

      // 2. Set Match status to DISPUTED
      await tx.match.update({
        where: { id: matchId },
        data: { status: MatchStatus.DISPUTED },
      });

      // 3. Set Job status to DISPUTED
      await tx.job.update({
        where: { id: match.jobId },
        data: { status: JobStatus.DISPUTED },
      });

      // 4. Notify counterparty
      await tx.notification.create({
        data: {
          userId: otherPartyId,
          type: NotificationType.DISPUTE_OPENED,
          title: 'Issue raised on job',
          body: `A dispute has been opened: "${input.reason.replace(/_/g, ' ')}". Support and moderation have been alerted.`,
          entityType: 'DISPUTE',
          entityId: newDispute.id,
        },
      });

      // 5. Audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'DISPUTE_OPENED',
          entityType: 'DISPUTE',
          entityId: newDispute.id,
          details: {
            matchId,
            reason: input.reason,
          },
        },
      });

      return newDispute;
    });

    return {
      success: true,
      message: 'Dispute opened. KIRAKA support has been notified.',
      disputeId: dispute.id,
      status: dispute.status,
    };
  }

  /**
   * Leave a review (FR-REV-01).
   * Non-negotiable Rule #5 / BR-09: Reviews ONLY after a confirmed completion!
   * Exactly one review per party per Match.
   */
  async leaveReview(matchId: string, authorId: string, input: CreateReviewInput) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        job: true,
        offer: true,
        reviews: true,
      },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    // Rule #5 / BR-09: Strictly blocked unless Match status is COMPLETED
    if (match.status !== 'COMPLETED' || match.job.status !== 'COMPLETED') {
      throw new BadRequestException('Reviews are strictly allowed only after confirmed completion (BR-09)');
    }

    const isCustomer = match.job.customerId === authorId;
    const isProvider = match.offer.providerId === authorId;

    if (!isCustomer && !isProvider) {
      throw new ForbiddenException('Only participants in this job can leave a review');
    }

    const targetId = isCustomer ? match.offer.providerId : match.job.customerId;

    // Check if author already reviewed this match
    const existing = match.reviews.find((r) => r.authorId === authorId);
    if (existing) {
      throw new ConflictException('You have already submitted a review for this job');
    }

    const review = await this.prisma.$transaction(async (tx) => {
      // 1. Create Review
      const createdReview = await tx.review.create({
        data: {
          matchId,
          authorId,
          targetId,
          rating: input.rating,
          tags: input.tags || [],
          comment: input.comment,
        },
      });

      // 2. If target is a provider, recalculate and update their average rating
      const isTargetProvider = isCustomer; // Target is provider if reviewer is customer
      if (isTargetProvider) {
        const providerReviews = await tx.review.findMany({
          where: { targetId },
          select: { rating: true },
        });

        const totalRating = providerReviews.reduce((sum, r) => sum + r.rating, 0);
        const count = providerReviews.length;
        // Rating stored as integer scaled 100-500 (e.g. 4.8 = 480)
        const ratingAverage = Math.round((totalRating / count) * 100);

        await tx.providerProfile.updateMany({
          where: { userId: targetId },
          data: {
            ratingAverage,
            ratingCount: count,
          },
        });
      }

      // 3. Notify the reviewed party
      await tx.notification.create({
        data: {
          userId: targetId,
          type: NotificationType.NEW_REVIEW,
          title: 'You received a new review!',
          body: `You received a ${input.rating}-star review for "${match.job.title}".`,
          entityType: 'MATCH',
          entityId: matchId,
        },
      });

      // 4. Audit log
      await tx.auditLog.create({
        data: {
          userId: authorId,
          action: 'REVIEW_SUBMITTED',
          entityType: 'REVIEW',
          entityId: createdReview.id,
          details: {
            rating: input.rating,
            tags: input.tags,
          },
        },
      });

      return createdReview;
    });

    return {
      id: review.id,
      matchId: review.matchId,
      authorId: review.authorId,
      targetId: review.targetId,
      rating: review.rating,
      tags: review.tags,
      comment: review.comment,
      createdAt: review.createdAt.toISOString(),
    };
  }

  /**
   * Get match details with completion, dispute, and review info.
   */
  async getMatchDetails(matchId: string, userId: string) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        job: {
          include: {
            category: true,
            area: true,
            customer: {
              include: { customerProfile: true },
            },
          },
        },
        offer: {
          include: {
            provider: {
              include: { providerProfile: true },
            },
          },
        },
        dispute: true,
        reviews: {
          include: {
            author: {
              include: { customerProfile: true, providerProfile: true },
            },
          },
        },
      },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    const isCustomer = match.job.customerId === userId;
    const isProvider = match.offer.providerId === userId;

    if (!isCustomer && !isProvider) {
      throw new ForbiddenException('Access denied to this match details');
    }

    return {
      id: match.id,
      status: match.status,
      agreedPrice: {
        amount: Number(match.agreedPriceAmount),
        currency: match.agreedPriceCurrency,
      },
      agreedTerms: match.agreedTerms,
      acceptedAt: match.acceptedAt.toISOString(),
      completedAt: match.completedAt?.toISOString() || null,
      completionNotes: match.completionNotes,
      completionPhotoUrl: match.completionPhotoUrl,
      job: {
        id: match.job.id,
        title: match.job.title,
        description: match.job.description,
        status: match.job.status,
        category: match.job.category.nameEn,
        area: match.job.area.name,
      },
      customer: {
        id: match.job.customerId,
        displayName: match.job.customer.customerProfile?.displayName || 'Customer',
      },
      provider: {
        id: match.offer.providerId,
        displayName: match.offer.provider.providerProfile?.businessName || 'Provider',
        ratingAverage: match.offer.provider.providerProfile?.ratingAverage
          ? (match.offer.provider.providerProfile.ratingAverage / 100).toFixed(1)
          : null,
      },
      dispute: match.dispute
        ? {
            id: match.dispute.id,
            reason: match.dispute.reason,
            description: match.dispute.description,
            status: match.dispute.status,
            createdAt: match.dispute.createdAt.toISOString(),
          }
        : null,
      reviews: match.reviews.map((r) => ({
        id: r.id,
        authorId: r.authorId,
        authorName:
          r.author.customerProfile?.displayName ||
          r.author.providerProfile?.businessName ||
          'User',
        rating: r.rating,
        tags: r.tags,
        comment: r.comment,
        isMine: r.authorId === userId,
        createdAt: r.createdAt.toISOString(),
      })),
      canReportCompletion: isProvider && match.status === 'ACTIVE' && match.job.status !== 'COMPLETION_REPORTED',
      canConfirmCompletion: isCustomer && match.status === 'ACTIVE',
      canDispute: (isCustomer || isProvider) && match.status !== 'CANCELLED' && !match.dispute,
      canReview:
        match.status === 'COMPLETED' &&
        !match.reviews.some((r) => r.authorId === userId),
    };
  }
}
