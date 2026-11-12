import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminService } from './admin.service.js';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DisputeStatus, ReportStatus, UserRole } from '@kiraka/contracts';

describe('AdminService (M7: Admin Console & Operations)', () => {
  let service: AdminService;
  let mockPrisma: any;

  const mockAdminId = '99999999-9999-9999-9999-999999999999';
  const mockUserId = '11111111-1111-1111-1111-111111111111';
  const mockDisputeId = '22222222-2222-2222-2222-222222222222';
  const mockReportId = '33333333-3333-3333-3333-333333333333';

  beforeEach(() => {
    mockPrisma = {
      user: {
        count: vi.fn().mockResolvedValue(120),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      providerProfile: {
        count: vi.fn().mockResolvedValue(45),
      },
      job: {
        count: vi.fn().mockResolvedValue(80),
      },
      match: {
        count: vi.fn().mockResolvedValue(25),
        update: vi.fn(),
      },
      dispute: {
        count: vi.fn().mockResolvedValue(2),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      userReport: {
        count: vi.fn().mockResolvedValue(3),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      userSession: {
        deleteMany: vi.fn(),
      },
      auditLog: {
        create: vi.fn(),
      },
      $transaction: vi.fn((callback) => callback(mockPrisma)),
    };

    service = new AdminService(mockPrisma);
  });

  describe('FR-ADM-01: Admin Dashboard Stats', () => {
    it('should aggregate marketplace metrics accurately', async () => {
      const stats = await service.getDashboardStats();
      expect(stats.users.total).toBe(120);
      expect(stats.users.providers).toBe(45);
      expect(stats.jobs.total).toBe(80);
      expect(stats.moderation.openDisputes).toBe(2);
      expect(stats.moderation.pendingReports).toBe(3);
    });
  });

  describe('FR-ADM-02: Moderation & Reports Queue', () => {
    it('should list reports with reporter and target details', async () => {
      mockPrisma.userReport.findMany.mockResolvedValue([
        {
          id: mockReportId,
          reason: 'SPAM',
          details: 'Sending spam in chat',
          status: 'PENDING',
          notes: null,
          createdAt: new Date(),
          reporter: { id: 'rep-1', phone: '+250788111222', customerProfile: { displayName: 'John' }, providerProfile: null },
          targetUser: { id: 'tgt-1', phone: '+250788333444', customerProfile: null, providerProfile: { businessName: 'PlumbCo' } },
          targetJobId: null,
        },
      ]);
      mockPrisma.userReport.count.mockResolvedValue(1);

      const result = await service.listReports();
      expect(result.items.length).toBe(1);
      expect(result.items[0]?.reporter.displayName).toBe('John');
      expect(result.items[0]?.targetUser?.displayName).toBe('PlumbCo');
    });

    it('should update report status with moderator notes', async () => {
      mockPrisma.userReport.findUnique.mockResolvedValue({ id: mockReportId, notes: null });
      mockPrisma.userReport.update.mockResolvedValue({
        id: mockReportId,
        status: ReportStatus.RESOLVED,
      });

      const result = await service.updateReportStatus(mockReportId, ReportStatus.RESOLVED, 'User cautioned');
      expect(result.success).toBe(true);
      expect(mockPrisma.userReport.update).toHaveBeenCalledWith({
        where: { id: mockReportId },
        data: {
          status: ReportStatus.RESOLVED,
          notes: 'User cautioned',
        },
      });
    });
  });

  describe('FR-ADM-03: Dispute Mediation', () => {
    it('should resolve dispute and update match status', async () => {
      mockPrisma.dispute.findUnique.mockResolvedValue({
        id: mockDisputeId,
        matchId: 'match-1',
      });
      mockPrisma.dispute.update.mockResolvedValue({
        id: mockDisputeId,
        status: DisputeStatus.RESOLVED,
        resolution: 'Refund agreed upon by both parties',
      });

      const result = await service.resolveDispute(
        mockDisputeId,
        mockAdminId,
        'Refund agreed upon by both parties',
      );

      expect(result.success).toBe(true);
      expect(mockPrisma.match.update).toHaveBeenCalledWith({
        where: { id: 'match-1' },
        data: { status: 'COMPLETED' },
      });
      expect(mockPrisma.auditLog.create).toHaveBeenCalled();
    });
  });

  describe('FR-ADM-04: User Suspension & Deactivation', () => {
    it('should deactivate user, revoke all sessions, and log audit trail', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: mockUserId,
        phone: '+250788999888',
        role: UserRole.USER,
        isActive: true,
      });

      const result = await service.suspendUser(mockUserId, mockAdminId, 'Repeated scamming');

      expect(result.success).toBe(true);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: { isActive: false },
      });
      expect(mockPrisma.userSession.deleteMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
      });
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: mockAdminId,
            action: 'USER_SUSPENDED',
          }),
        }),
      );
    });

    it('should forbid suspending another administrator', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: mockUserId,
        phone: '+250788000000',
        role: UserRole.ADMIN,
      });

      await expect(
        service.suspendUser(mockUserId, mockAdminId, 'Attempted admin ban'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});

