import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import {
  OfferStatus,
  JobStatus,
  MatchStatus,
  type CreateOfferInput,
  type CounterOfferInput,
} from '@kiraka/contracts';

@Injectable()
export class OffersService {
  private readonly MAX_NEGOTIATION_ROUNDS = 5; // FR-OFR-03: Max 5 negotiation rounds

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Submit an initial priced offer for an open job.
   * Rules:
   * - Job must be in OPEN status.
   * - User cannot offer on their own job!
   * - One offer per provider per job.
   * - Creates initial immutable OfferVersion (BR-03).
   */
  async submitOffer(providerUserId: string, input: CreateOfferInput) {
    const job = await this.prisma.job.findUnique({
      where: { id: input.jobId },
      include: { customer: true },
    });

    if (!job) throw new NotFoundException('Job request not found.');
    if (job.status !== JobStatus.OPEN) {
      throw new BadRequestException('This job is no longer open for offers.');
    }

    if (job.customerId === providerUserId) {
      throw new ForbiddenException('You cannot submit an offer on your own job request.');
    }

    // Check if provider already has an offer for this job
    const existing = await this.prisma.offer.findUnique({
      where: {
        jobId_providerId: {
          jobId: input.jobId,
          providerId: providerUserId,
        },
      },
    });

    if (existing && existing.status !== OfferStatus.WITHDRAWN && existing.status !== OfferStatus.REJECTED) {
      throw new ConflictException('You have already submitted an active offer for this job.');
    }

    // Create Offer and first immutable version inside a transaction
    return this.prisma.$transaction(async (tx) => {
      const offer = await tx.offer.create({
        data: {
          jobId: input.jobId,
          providerId: providerUserId,
          priceAmount: BigInt(input.priceAmount),
          priceCurrency: input.priceCurrency || 'RWF',
          message: input.message || null,
          availability: input.availability || null,
          status: OfferStatus.SUBMITTED,
          version: 1,
          versions: {
            create: {
              authorRole: 'PROVIDER',
              priceAmount: BigInt(input.priceAmount),
              message: input.message || null,
            },
          },
        },
        include: {
          job: true,
          provider: {
            include: { providerProfile: true, customerProfile: true },
          },
          versions: true,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: providerUserId,
          action: 'OFFER_SUBMITTED',
          entityType: 'Offer',
          entityId: offer.id,
          details: { jobId: input.jobId, priceAmount: input.priceAmount },
        },
      });

      return this.formatOfferResponse(offer, providerUserId);
    });
  }

  /**
   * List offers received for a job (Customer view).
   * Sorted in a neutral, transparent order (best match / quality first, FR-OFR-04).
   */
  async getJobOffers(jobId: string, requestingUserId: string) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) throw new NotFoundException('Job not found.');
    if (job.customerId !== requestingUserId) {
      throw new ForbiddenException('Only the customer who posted the job can view all offers.');
    }

    const offers = await this.prisma.offer.findMany({
      where: {
        jobId,
        status: { in: [OfferStatus.SUBMITTED, OfferStatus.COUNTERED, OfferStatus.ACCEPTED] },
      },
      include: {
        provider: {
          include: { providerProfile: true, customerProfile: true },
        },
        versions: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: [
        { provider: { providerProfile: { ratingAverage: 'desc' } } },
        { provider: { providerProfile: { completedJobs: 'desc' } } },
        { createdAt: 'desc' },
      ],
    });

    return offers.map((o) => this.formatOfferResponse(o, requestingUserId));
  }

  /**
   * Counteroffer negotiation round.
   * Rules:
   * - Max 5 rounds (FR-OFR-03).
   * - Cannot counter your own current offer.
   * - Creates immutable OfferVersion (BR-03).
   */
  async counterOffer(offerId: string, userId: string, input: CounterOfferInput) {
    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId },
      include: {
        job: true,
        versions: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    if (!offer) throw new NotFoundException('Offer not found.');
    if (offer.status !== OfferStatus.SUBMITTED && offer.status !== OfferStatus.COUNTERED) {
      throw new BadRequestException(`Cannot counter an offer in ${offer.status} status.`);
    }

    const isCustomer = offer.job.customerId === userId;
    const isProvider = offer.providerId === userId;

    if (!isCustomer && !isProvider) {
      throw new ForbiddenException('You are not a party to this negotiation.');
    }

    const lastVersion = offer.versions[0];
    const userRole = isCustomer ? 'CUSTOMER' : 'PROVIDER';

    if (lastVersion && lastVersion.authorRole === userRole) {
      throw new BadRequestException('You cannot counter your own offer. Please wait for the other party to respond.');
    }

    if (offer.version >= this.MAX_NEGOTIATION_ROUNDS) {
      throw new BadRequestException(
        `Maximum negotiation rounds (${this.MAX_NEGOTIATION_ROUNDS}) reached. Please accept or decline the current offer.`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.offer.update({
        where: { id: offerId },
        data: {
          priceAmount: BigInt(input.priceAmount),
          priceCurrency: input.priceCurrency || 'RWF',
          message: input.message || null,
          status: OfferStatus.COUNTERED,
          version: { increment: 1 },
          versions: {
            create: {
              authorRole: userRole,
              priceAmount: BigInt(input.priceAmount),
              message: input.message || null,
            },
          },
        },
        include: {
          provider: {
            include: { providerProfile: true, customerProfile: true },
          },
          versions: true,
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'OFFER_COUNTERED',
          entityType: 'Offer',
          entityId: offerId,
          details: { priceAmount: input.priceAmount, round: updated.version },
        },
      });

      return this.formatOfferResponse(updated, userId);
    });
  }

  /**
   * Withdraw an offer before acceptance (Provider action).
   */
  async withdrawOffer(offerId: string, providerUserId: string) {
    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId },
    });

    if (!offer) throw new NotFoundException('Offer not found.');
    if (offer.providerId !== providerUserId) {
      throw new ForbiddenException('You can only withdraw your own offer.');
    }
    if (offer.status === OfferStatus.ACCEPTED) {
      throw new BadRequestException('Cannot withdraw an offer that has already been accepted.');
    }

    const updated = await this.prisma.offer.update({
      where: { id: offerId },
      data: { status: OfferStatus.WITHDRAWN },
    });

    return { success: true, status: updated.status };
  }

  /**
   * Deliberate Offer Acceptance & Match Creation.
   * 
   * NON-NEGOTIABLE CORE MARKETPLACE RULES ENFORCED HERE:
   * - Exactly ONE active Match per job (BR-01, BR-05).
   * - Atomic database transaction prevents concurrent double-matching.
   * - Snapshots agreed price and terms into Match record (BR-04).
   * - Closes all competing offers for this job with REJECTED status.
   * - Transitions Job status from OPEN to MATCHED.
   */
  async acceptOffer(offerId: string, customerUserId: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Fetch offer and job with pessimistic intent
      const offer = await tx.offer.findUnique({
        where: { id: offerId },
        include: {
          job: true,
          provider: {
            include: { providerProfile: true, customerProfile: true },
          },
        },
      });

      if (!offer) throw new NotFoundException('Offer not found.');

      // Only the customer who posted the job can accept an offer
      if (offer.job.customerId !== customerUserId) {
        throw new ForbiddenException('Only the customer who posted the job can accept an offer.');
      }

      // Check job status
      if (offer.job.status !== JobStatus.OPEN) {
        throw new ConflictException(
          `This job is no longer open for acceptance (current status: ${offer.job.status}).`,
        );
      }

      // Concurrency check: Ensure no Match already exists for this job (BR-01, BR-05)
      const existingMatch = await tx.match.findUnique({
        where: { jobId: offer.jobId },
      });

      if (existingMatch) {
        throw new ConflictException(
          'Another offer has already been accepted for this job. Exactly one match is permitted.',
        );
      }

      // 2. Create Match and snapshot agreed terms (BR-04)
      const agreedTermsSummary = `Agreed on ${new Date().toLocaleDateString()}: ${offer.message || 'Standard service terms'}`;

      const match = await tx.match.create({
        data: {
          jobId: offer.jobId,
          offerId: offer.id,
          status: MatchStatus.ACTIVE,
          agreedPriceAmount: offer.priceAmount,
          agreedPriceCurrency: offer.priceCurrency,
          agreedTerms: agreedTermsSummary,
        },
        include: {
          job: {
            include: { customer: { include: { customerProfile: true } } },
          },
          offer: {
            include: { provider: { include: { providerProfile: true } } },
          },
        },
      });

      // 3. Mark accepted offer as ACCEPTED
      await tx.offer.update({
        where: { id: offerId },
        data: { status: OfferStatus.ACCEPTED },
      });

      // 4. Mark all other competing offers on this job as REJECTED
      await tx.offer.updateMany({
        where: {
          jobId: offer.jobId,
          id: { not: offerId },
          status: { in: [OfferStatus.SUBMITTED, OfferStatus.COUNTERED] },
        },
        data: { status: OfferStatus.REJECTED },
      });

      // 5. Transition Job status to MATCHED
      await tx.job.update({
        where: { id: offer.jobId },
        data: { status: JobStatus.MATCHED },
      });

      // 6. Audit log entry
      await tx.auditLog.create({
        data: {
          userId: customerUserId,
          action: 'OFFER_ACCEPTED',
          entityType: 'Match',
          entityId: match.id,
          details: {
            jobId: offer.jobId,
            offerId: offer.id,
            agreedPrice: Number(offer.priceAmount),
          },
        },
      });

      return {
        id: match.id,
        jobId: match.jobId,
        offerId: match.offerId,
        status: match.status,
        agreedPrice: {
          amount: Number(match.agreedPriceAmount),
          currency: match.agreedPriceCurrency,
        },
        agreedTerms: match.agreedTerms,
        provider: {
          id: offer.providerId,
          businessName: offer.provider.providerProfile?.businessName || 'Provider',
          verificationLevel: offer.provider.providerProfile?.verificationLevel || 'NONE',
        },
        customer: {
          id: customerUserId,
          displayName: match.job.customer.customerProfile?.displayName || 'Customer',
        },
        acceptedAt: match.acceptedAt.toISOString(),
      };
    });
  }

  /**
   * Get single match details.
   */
  async getMatchById(matchId: string, userId: string) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        job: {
          include: { customer: { include: { customerProfile: true } } },
        },
        offer: {
          include: { provider: { include: { providerProfile: true } } },
        },
      },
    });

    if (!match) throw new NotFoundException('Match not found.');

    const isCustomer = match.job.customerId === userId;
    const isProvider = match.offer.providerId === userId;

    if (!isCustomer && !isProvider) {
      throw new ForbiddenException('You are not a participant in this match.');
    }

    return {
      id: match.id,
      jobId: match.jobId,
      offerId: match.offerId,
      status: match.status,
      agreedPrice: {
        amount: Number(match.agreedPriceAmount),
        currency: match.agreedPriceCurrency,
      },
      agreedTerms: match.agreedTerms,
      provider: {
        id: match.offer.providerId,
        businessName: match.offer.provider.providerProfile?.businessName || 'Provider',
        verificationLevel: match.offer.provider.providerProfile?.verificationLevel || 'NONE',
      },
      customer: {
        id: match.job.customerId,
        displayName: match.job.customer.customerProfile?.displayName || 'Customer',
      },
      acceptedAt: match.acceptedAt.toISOString(),
    };
  }

  private formatOfferResponse(offer: any, currentUserId?: string) {
    const isCustomer = offer.job?.customerId === currentUserId;
    const isProvider = offer.providerId === currentUserId;

    return {
      id: offer.id,
      jobId: offer.jobId,
      providerId: offer.providerId,
      businessName: offer.provider?.providerProfile?.businessName || 'Independent Provider',
      providerRating: offer.provider?.providerProfile?.ratingAverage
        ? offer.provider.providerProfile.ratingAverage / 100
        : null,
      ratingCount: offer.provider?.providerProfile?.ratingCount || 0,
      completedJobs: offer.provider?.providerProfile?.completedJobs || 0,
      verificationLevel: offer.provider?.providerProfile?.verificationLevel || 'NONE',
      areaName: offer.provider?.customerProfile?.neighborhood || 'Kigali',
      distanceBand: '~2 km',
      price: {
        amount: Number(offer.priceAmount),
        currency: offer.priceCurrency,
      },
      status: offer.status,
      message: offer.message,
      availability: offer.availability,
      version: offer.version,
      versions: offer.versions?.map((v: any) => ({
        id: v.id,
        authorRole: v.authorRole,
        priceAmount: Number(v.priceAmount),
        message: v.message,
        createdAt: v.createdAt.toISOString(),
      })),
      canAccept: isCustomer && (offer.status === OfferStatus.SUBMITTED || offer.status === OfferStatus.COUNTERED),
      canCounter: (isCustomer || isProvider) && (offer.status === OfferStatus.SUBMITTED || offer.status === OfferStatus.COUNTERED),
      createdAt: offer.createdAt.toISOString(),
    };
  }
}
