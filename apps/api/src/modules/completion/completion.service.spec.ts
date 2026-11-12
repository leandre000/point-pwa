import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CompletionService } from './completion.service.js';
import {
  BadRequestException,
  ForbiddenException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JobStatus, MatchStatus, DisputeReason } from '@kiraka/contracts';

describe('CompletionService (M6: Completion, Disputes & Reviews)', () => {
  let service: CompletionService;
  let mockPrisma: any;

  const mockProviderId = '11111111-1111-1111-1111-111111111111';
  const mockCustomerId = '22222222-2222-2222-2222-222222222222';
  const mockThirdPartyId = '33333333-3333-3333-3333-333333333333';
  const mockMatchId = '44444444-4444-4444-4444-444444444444';
  const mockJobId = '55555555-5555-5555-5555-555555555555';

  beforeEach(() => {
    mockPrisma = {
      match: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      job: {
        update: vi.fn(),
      },
      notification: {
        create: vi.fn(),
      },
      auditLog: {
        create: vi.fn(),
      },
      providerProfile: {
        updateMany: vi.fn(),
      },
      dispute: {
        create: vi.fn(),
      },
      review: {
        create: vi.fn(),
        findMany: vi.fn(),
      },
      $transaction: vi.fn((callback) => callback(mockPrisma)),
    };

    service = new CompletionService(mockPrisma);
  });

  describe('FR-COMP-01: Provider reports completion', () => {
    it('should transition job to COMPLETION_REPORTED and notify customer', async () => {
      mockPrisma.match.findUnique.mockResolvedValue({
        id: mockMatchId,
        jobId: mockJobId,
        status: MatchStatus.ACTIVE,
        job: { customerId: mockCustomerId, status: JobStatus.MATCHED },
        offer: { providerId: mockProviderId },
      });

      mockPrisma.match.update.mockResolvedValue({
        id: mockMatchId,
        completionNotes: 'Replaced valve and tested pressure',
      });

      const result = await service.reportCompletion(mockMatchId, mockProviderId, {
        notes: 'Replaced valve and tested pressure',
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe(JobStatus.COMPLETION_REPORTED);
      expect(mockPrisma.job.update).toHaveBeenCalledWith({
        where: { id: mockJobId },
        data: { status: JobStatus.COMPLETION_REPORTED },
      });
      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: mockCustomerId,
          type: 'COMPLETION_REPORTED',
        }),
      });
    });

    it('should reject reporting completion if caller is not the matched provider', async () => {
      mockPrisma.match.findUnique.mockResolvedValue({
        id: mockMatchId,
        jobId: mockJobId,
        status: MatchStatus.ACTIVE,
        job: { customerId: mockCustomerId },
        offer: { providerId: mockProviderId },
      });

      await expect(
        service.reportCompletion(mockMatchId, mockThirdPartyId, { notes: 'Done' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('FR-COMP-02 / BR-06: Customer confirms completion', () => {
    it('should mark match & job COMPLETED and increment provider completedJobs', async () => {
      mockPrisma.match.findUnique.mockResolvedValue({
        id: mockMatchId,
        jobId: mockJobId,
        status: MatchStatus.ACTIVE,
        job: { customerId: mockCustomerId, status: JobStatus.COMPLETION_REPORTED },
        offer: { providerId: mockProviderId },
      });

      mockPrisma.match.update.mockResolvedValue({
        id: mockMatchId,
        status: MatchStatus.COMPLETED,
      });

      const result = await service.confirmCompletion(mockMatchId, mockCustomerId, {
        feedback: 'Excellent work!',
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe(MatchStatus.COMPLETED);
      expect(mockPrisma.job.update).toHaveBeenCalledWith({
        where: { id: mockJobId },
        data: { status: JobStatus.COMPLETED },
      });
      expect(mockPrisma.providerProfile.updateMany).toHaveBeenCalledWith({
        where: { userId: mockProviderId },
        data: { completedJobs: { increment: 1 } },
      });
      expect(mockPrisma.notification.create).toHaveBeenCalledTimes(2); // Provider & Customer notified
    });

    it('should reject customer confirmation if caller is not the job customer', async () => {
      mockPrisma.match.findUnique.mockResolvedValue({
        id: mockMatchId,
        jobId: mockJobId,
        status: MatchStatus.ACTIVE,
        job: { customerId: mockCustomerId },
        offer: { providerId: mockProviderId },
      });

      await expect(
        service.confirmCompletion(mockMatchId, mockThirdPartyId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('FR-REV-01 / BR-09: Reviews strictly require confirmed completion', () => {
    it('should strictly reject reviews if match is not yet COMPLETED', async () => {
      mockPrisma.match.findUnique.mockResolvedValue({
        id: mockMatchId,
        jobId: mockJobId,
        status: MatchStatus.ACTIVE, // NOT COMPLETED
        job: { customerId: mockCustomerId, status: JobStatus.COMPLETION_REPORTED },
        offer: { providerId: mockProviderId },
        reviews: [],
      });

      await expect(
        service.leaveReview(mockMatchId, mockCustomerId, {
          rating: 5,
          tags: ['Punctual'],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow review after completion and update provider rating average', async () => {
      mockPrisma.match.findUnique.mockResolvedValue({
        id: mockMatchId,
        jobId: mockJobId,
        status: MatchStatus.COMPLETED,
        job: { customerId: mockCustomerId, status: JobStatus.COMPLETED, title: 'Fix sink' },
        offer: { providerId: mockProviderId },
        reviews: [],
      });

      mockPrisma.review.create.mockResolvedValue({
        id: 'rev-1',
        matchId: mockMatchId,
        authorId: mockCustomerId,
        targetId: mockProviderId,
        rating: 5,
        tags: ['Punctual', 'Clean work'],
        comment: 'Great job!',
        createdAt: new Date(),
      });

      mockPrisma.review.findMany.mockResolvedValue([
        { rating: 5 },
        { rating: 5 },
      ]);

      const review = await service.leaveReview(mockMatchId, mockCustomerId, {
        rating: 5,
        tags: ['Punctual', 'Clean work'],
        comment: 'Great job!',
      });

      expect(review.rating).toBe(5);
      expect(mockPrisma.providerProfile.updateMany).toHaveBeenCalledWith({
        where: { userId: mockProviderId },
        data: {
          ratingAverage: 500, // 5.0 * 100
          ratingCount: 2,
        },
      });
    });

    it('should reject double reviews from the same author', async () => {
      mockPrisma.match.findUnique.mockResolvedValue({
        id: mockMatchId,
        jobId: mockJobId,
        status: MatchStatus.COMPLETED,
        job: { customerId: mockCustomerId, status: JobStatus.COMPLETED },
        offer: { providerId: mockProviderId },
        reviews: [{ authorId: mockCustomerId }], // Already reviewed
      });

      await expect(
        service.leaveReview(mockMatchId, mockCustomerId, { rating: 5, tags: [] }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('FR-DSP-01: Dispute handling', () => {
    it('should freeze match and job into DISPUTED status when issue raised', async () => {
      mockPrisma.match.findUnique.mockResolvedValue({
        id: mockMatchId,
        jobId: mockJobId,
        status: MatchStatus.ACTIVE,
        job: { customerId: mockCustomerId },
        offer: { providerId: mockProviderId },
        dispute: null,
      });

      mockPrisma.dispute.create.mockResolvedValue({
        id: 'disp-1',
        matchId: mockMatchId,
        status: 'OPEN',
      });

      const result = await service.raiseDispute(mockMatchId, mockCustomerId, {
        reason: DisputeReason.POOR_QUALITY,
        description: 'The pipe is still leaking after provider left.',
        evidenceUrls: [],
      });

      expect(result.success).toBe(true);
      expect(mockPrisma.match.update).toHaveBeenCalledWith({
        where: { id: mockMatchId },
        data: { status: MatchStatus.DISPUTED },
      });
      expect(mockPrisma.job.update).toHaveBeenCalledWith({
        where: { id: mockJobId },
        data: { status: JobStatus.DISPUTED },
      });
    });
  });
});
