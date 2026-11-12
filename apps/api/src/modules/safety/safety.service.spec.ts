import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SafetyService } from './safety.service.js';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { ReportReason } from '@kiraka/contracts';

describe('SafetyService (M7: Safety, Reports & Blocks)', () => {
  let service: SafetyService;
  let mockPrisma: any;

  const mockReporterId = '11111111-1111-1111-1111-111111111111';
  const mockTargetUserId = '22222222-2222-2222-2222-222222222222';
  const mockJobId = '33333333-3333-3333-3333-333333333333';

  beforeEach(() => {
    mockPrisma = {
      userReport: {
        create: vi.fn(),
      },
      userBlock: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
      },
      user: {
        findUnique: vi.fn(),
      },
      auditLog: {
        create: vi.fn(),
      },
    };

    service = new SafetyService(mockPrisma);
  });

  describe('FR-REP-01: Create Report', () => {
    it('should successfully file a user report', async () => {
      mockPrisma.userReport.create.mockResolvedValue({
        id: 'rep-1',
        reporterId: mockReporterId,
        targetUserId: mockTargetUserId,
        reason: ReportReason.FRAUD,
        details: 'Asked for advance payment off-platform',
        status: 'PENDING',
      });

      const result = await service.createReport(mockReporterId, {
        targetUserId: mockTargetUserId,
        reason: ReportReason.FRAUD,
        details: 'Asked for advance payment off-platform',
      });

      expect(result.success).toBe(true);
      expect(result.reportId).toBe('rep-1');
      expect(mockPrisma.userReport.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          reporterId: mockReporterId,
          targetUserId: mockTargetUserId,
          reason: ReportReason.FRAUD,
          status: 'PENDING',
        }),
      });
      expect(mockPrisma.auditLog.create).toHaveBeenCalled();
    });

    it('should reject reporting oneself', async () => {
      await expect(
        service.createReport(mockReporterId, {
          targetUserId: mockReporterId, // Self
          reason: ReportReason.SPAM,
          details: 'Self reporting test',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject reports with neither targetUserId nor targetJobId', async () => {
      await expect(
        service.createReport(mockReporterId, {
          reason: ReportReason.SPAM,
          details: 'Empty target test',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('FR-REP-03: Block User', () => {
    it('should successfully block an abusive user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: mockTargetUserId });
      mockPrisma.userBlock.findUnique.mockResolvedValue(null);
      mockPrisma.userBlock.create.mockResolvedValue({
        id: 'blk-1',
        blockerId: mockReporterId,
        blockedId: mockTargetUserId,
      });

      const result = await service.blockUser(mockReporterId, {
        blockedUserId: mockTargetUserId,
        reason: 'Harassing messages',
      });

      expect(result.success).toBe(true);
      expect(result.blockId).toBe('blk-1');
      expect(mockPrisma.userBlock.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          blockerId: mockReporterId,
          blockedId: mockTargetUserId,
        }),
      });
    });

    it('should reject self-blocking', async () => {
      await expect(
        service.blockUser(mockReporterId, {
          blockedUserId: mockReporterId,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject duplicate blocks', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: mockTargetUserId });
      mockPrisma.userBlock.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        service.blockUser(mockReporterId, {
          blockedUserId: mockTargetUserId,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('Emergency Guidance', () => {
    it('should return valid Rwanda national emergency contacts', () => {
      const contacts = service.getEmergencyContacts();
      expect(contacts.length).toBeGreaterThanOrEqual(4);
      expect(contacts.some((c) => c.phone === '112')).toBe(true); // National Police
      expect(contacts.some((c) => c.phone === '912')).toBe(true); // Ambulance
      expect(contacts.some((c) => c.phone === '114')).toBe(true); // Isange One Stop
    });
  });
});

