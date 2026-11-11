import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OffersService } from './offers.service.js';
import { OfferStatus, JobStatus, MatchStatus } from '@kiraka/contracts';

describe('OffersService (Critical Marketplace Rules)', () => {
  let service: OffersService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      job: {
        findUnique: vi.fn(),
      },
      offer: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
      },
      match: {
        findUnique: vi.fn(),
      },
      $transaction: vi.fn((callback) => callback(mockPrisma)),
      auditLog: {
        create: vi.fn().mockResolvedValue({}),
      },
    };

    service = new OffersService(mockPrisma);
  });

  it('rejects offer submission when user is the owner of the job', async () => {
    mockPrisma.job.findUnique.mockResolvedValue({
      id: 'job-1',
      customerId: 'user-same',
      status: JobStatus.OPEN,
    });

    await expect(
      service.submitOffer('user-same', {
        jobId: 'job-1',
        priceAmount: 15000,
        message: 'I want to offer on my own job',
      }),
    ).rejects.toThrowError(/cannot submit an offer on your own job request/);
  });

  it('enforces BR-01 & BR-05: prevents concurrent duplicate matches on the same job', async () => {
    const offerId = 'offer-1';
    const customerId = 'cust-123';

    mockPrisma.offer.findUnique.mockResolvedValue({
      id: offerId,
      jobId: 'job-1',
      priceAmount: 14000n,
      priceCurrency: 'RWF',
      job: {
        id: 'job-1',
        customerId,
        status: JobStatus.OPEN,
      },
      provider: {
        providerProfile: { businessName: 'Eric Carpentry' },
      },
    });

    // Simulate that another concurrent request already created an active match
    mockPrisma.match.findUnique.mockResolvedValue({
      id: 'existing-match',
      jobId: 'job-1',
      status: MatchStatus.ACTIVE,
    });

    await expect(service.acceptOffer(offerId, customerId)).rejects.toThrowError(
      /Another offer has already been accepted for this job/,
    );
  });

  it('enforces BR-04: snapshots agreed price and terms upon acceptance', async () => {
    const offerId = 'offer-1';
    const customerId = 'cust-123';

    mockPrisma.offer.findUnique.mockResolvedValue({
      id: offerId,
      jobId: 'job-1',
      providerId: 'prov-456',
      priceAmount: 15000n,
      priceCurrency: 'RWF',
      message: 'Will bring all pipe sealant and PVC tools',
      job: {
        id: 'job-1',
        customerId,
        status: JobStatus.OPEN,
      },
      provider: {
        providerProfile: { businessName: 'Patrick Plumbing', verificationLevel: 'PHONE_VERIFIED' },
      },
    });

    mockPrisma.match.findUnique.mockResolvedValue(null); // No existing match

    mockPrisma.match.create = vi.fn().mockResolvedValue({
      id: 'match-1',
      jobId: 'job-1',
      offerId,
      status: MatchStatus.ACTIVE,
      agreedPriceAmount: 15000n,
      agreedPriceCurrency: 'RWF',
      agreedTerms: 'Agreed on 2026-11-11: Will bring all pipe sealant and PVC tools',
      acceptedAt: new Date(),
      job: { customer: { customerProfile: { displayName: 'Aline' } } },
      offer: { provider: { providerProfile: { businessName: 'Patrick Plumbing' } } },
    });

    mockPrisma.offer.update = vi.fn().mockResolvedValue({});
    mockPrisma.offer.updateMany = vi.fn().mockResolvedValue({ count: 2 });
    mockPrisma.job.update = vi.fn().mockResolvedValue({});

    const match = await service.acceptOffer(offerId, customerId);

    expect(match.id).toBe('match-1');
    expect(match.status).toBe(MatchStatus.ACTIVE);
    expect(match.agreedPrice.amount).toBe(15000);
    expect(match.agreedPrice.currency).toBe('RWF');
    expect(match.agreedTerms).toContain('Will bring all pipe sealant');

    // Verified that other offers on this job were marked REJECTED
    expect(mockPrisma.offer.updateMany).toHaveBeenCalledWith({
      where: {
        jobId: 'job-1',
        id: { not: offerId },
        status: { in: [OfferStatus.SUBMITTED, OfferStatus.COUNTERED] },
      },
      data: { status: OfferStatus.REJECTED },
    });

    // Verified that Job was marked MATCHED
    expect(mockPrisma.job.update).toHaveBeenCalledWith({
      where: { id: 'job-1' },
      data: { status: JobStatus.MATCHED },
    });
  });
});
