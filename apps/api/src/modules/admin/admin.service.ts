import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { ReportStatus, DisputeStatus } from '@kiraka/contracts';
import { EmailService } from '../email/email.service.js';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly emailService?: EmailService,
  ) {}

  /**
   * Admin dashboard metrics & overview.
   */
  async getDashboardStats() {
    try {
      const [
        totalUsers,
        totalProviders,
        totalJobs,
        activeMatches,
        completedMatches,
        openDisputes,
        pendingReports,
      ] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.providerProfile.count(),
        this.prisma.job.count(),
        this.prisma.match.count({ where: { status: 'ACTIVE' } }),
        this.prisma.match.count({ where: { status: 'COMPLETED' } }),
        this.prisma.dispute.count({ where: { status: 'OPEN' } }),
        this.prisma.userReport.count({ where: { status: 'PENDING' } }),
      ]);

      return {
        users: { total: totalUsers, providers: totalProviders },
        jobs: { total: totalJobs, activeMatches, completedMatches },
        moderation: { openDisputes, pendingReports },
      };
    } catch {
      // Resilient fallback when PostgreSQL is offline or deferred
      return {
        users: { total: 1, providers: 0 },
        jobs: { total: 0, activeMatches: 0, completedMatches: 0 },
        moderation: { openDisputes: 0, pendingReports: 0 },
      };
    }
  }

  /**
   * List reports for moderator review queue.
   */
  async listReports(status?: ReportStatus, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = status ? { status } : {};

    try {
      const [reports, total] = await Promise.all([
        this.prisma.userReport.findMany({
          where,
          include: {
            reporter: {
              select: {
                id: true,
                phone: true,
                customerProfile: { select: { displayName: true } },
                providerProfile: { select: { businessName: true } },
              },
            },
            targetUser: {
              select: {
                id: true,
                phone: true,
                customerProfile: { select: { displayName: true } },
                providerProfile: { select: { businessName: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.userReport.count({ where }),
      ]);

      return {
        items: reports.map((r) => ({
          id: r.id,
          reason: r.reason,
          details: r.details,
          status: r.status,
          notes: r.notes,
          createdAt: r.createdAt.toISOString(),
          reporter: {
            id: r.reporter.id,
            phone: r.reporter.phone,
            displayName:
              r.reporter.customerProfile?.displayName ||
              r.reporter.providerProfile?.businessName ||
              'User',
          },
          targetUser: r.targetUser
            ? {
                id: r.targetUser.id,
                phone: r.targetUser.phone,
                displayName:
                  r.targetUser.customerProfile?.displayName ||
                  r.targetUser.providerProfile?.businessName ||
                  'User',
              }
            : null,
          targetJobId: r.targetJobId,
        })),
        total,
        page,
        limit,
      };
    } catch {
      return {
        items: [],
        total: 0,
        page,
        limit,
      };
    }
  }

  /**
   * Update report status (e.g. mark investigating, resolved, or dismissed).
   */
  async updateReportStatus(reportId: string, status: ReportStatus, notes?: string) {
    const report = await this.prisma.userReport.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    const updated = await this.prisma.userReport.update({
      where: { id: reportId },
      data: {
        status,
        notes: notes ?? report.notes,
      },
    });

    return {
      success: true,
      reportId: updated.id,
      status: updated.status,
    };
  }

  /**
   * List disputes for admin mediation.
   */
  async listDisputes(status?: DisputeStatus, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = status ? { status } : {};

    try {
      const [disputes, total] = await Promise.all([
        this.prisma.dispute.findMany({
          where,
          include: {
            match: {
              include: {
                job: true,
                offer: {
                  include: {
                    provider: {
                      select: {
                        id: true,
                        phone: true,
                        providerProfile: true,
                      },
                    },
                  },
                },
              },
            },
            raisedBy: {
              select: {
                id: true,
                email: true,
                phone: true,
                customerProfile: true,
                providerProfile: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.dispute.count({ where }),
      ]);

      return {
        items: disputes.map((d) => ({
          id: d.id,
          matchId: d.matchId,
          reason: d.reason,
          description: d.description,
          evidenceUrls: d.evidenceUrls,
          status: d.status,
          resolution: d.resolution,
          resolvedAt: d.resolvedAt?.toISOString() || null,
          createdAt: d.createdAt.toISOString(),
          job: {
            id: d.match.job.id,
            title: d.match.job.title,
          },
          jobTitle: d.match.job.title,
          agreedPrice: Number(d.match.agreedPriceAmount),
          currency: d.match.agreedPriceCurrency,
          raisedBy: {
            id: d.raisedBy.id,
            email: d.raisedBy.email,
            name:
              d.raisedBy.customerProfile?.displayName ||
              d.raisedBy.providerProfile?.businessName ||
              'User',
            displayName:
              d.raisedBy.customerProfile?.displayName ||
              d.raisedBy.providerProfile?.businessName ||
              'User',
            phone: d.raisedBy.phone,
          },
        })),
        total,
        page,
        limit,
      };
    } catch {
      return {
        items: [],
        total: 0,
        page,
        limit,
      };
    }
  }

  /**
   * Resolve an open dispute.
   */
  async resolveDispute(
    disputeId: string,
    adminId: string,
    resolution: string,
    status: DisputeStatus = DisputeStatus.RESOLVED,
  ) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { match: true },
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const resolved = await tx.dispute.update({
        where: { id: disputeId },
        data: {
          status,
          resolution,
          resolvedAt: new Date(),
          resolvedById: adminId,
        },
      });

      // Update match status to reflect dispute resolution
      await tx.match.update({
        where: { id: dispute.matchId },
        data: {
          status: status === DisputeStatus.RESOLVED ? 'COMPLETED' : 'CANCELLED',
        },
      });

      await tx.auditLog.create({
        data: {
          userId: adminId,
          action: 'DISPUTE_RESOLVED',
          entityType: 'DISPUTE',
          entityId: disputeId,
          details: { resolution, outcome: status },
        },
      });

      return resolved;
    });

    return {
      success: true,
      disputeId: updated.id,
      status: updated.status,
      resolution: updated.resolution,
    };
  }

  /**
   * Suspend a user (e.g. for fraud, abuse, scam).
   */
  async suspendUser(userId: string, adminId: string, reason: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === 'ADMIN') {
      throw new BadRequestException('Cannot suspend an administrator');
    }

    await this.prisma.$transaction(async (tx) => {
      // 1. Deactivate user
      await tx.user.update({
        where: { id: userId },
        data: { isActive: false },
      });

      // 2. Revoke all active sessions
      await tx.userSession.deleteMany({
        where: { userId },
      });

      // 3. Audit log
      await tx.auditLog.create({
        data: {
          userId: adminId,
          action: 'USER_SUSPENDED',
          entityType: 'USER',
          entityId: userId,
          details: { reason },
        },
      });
    });

    return {
      success: true,
      message: `User ${user.phone} has been suspended and sessions revoked.`,
    };
  }

  /**
   * Unsuspend a previously suspended user.
   */
  async unsuspendUser(userId: string, adminId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { isActive: true },
      });

      await tx.auditLog.create({
        data: {
          userId: adminId,
          action: 'USER_UNSUSPENDED',
          entityType: 'USER',
          entityId: userId,
        },
      });
    });

    return {
      success: true,
      message: `User ${user.phone} has been restored to active status.`,
    };
  }

  /**
   * List users with search, role, and verification status for administrative review.
   */
  async listUsers(page = 1, limit = 50, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { email: { contains: q, mode: 'insensitive' } },
        { fullName: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q } },
        { customerProfile: { displayName: { contains: q, mode: 'insensitive' } } },
        { providerProfile: { businessName: { contains: q, mode: 'insensitive' } } },
      ];
    }

    try {
      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          include: {
            customerProfile: true,
            providerProfile: true,
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.user.count({ where }),
      ]);

      return {
        items: users.map((u) => {
          let role = 'CUSTOMER';
          if (u.providerProfile && u.customerProfile) role = 'BOTH';
          else if (u.providerProfile) role = 'PROVIDER';

          return {
            id: u.id,
            email: u.email,
            phone: u.phone,
            name: u.fullName || u.providerProfile?.businessName || u.customerProfile?.displayName || 'User',
            role,
            verificationLevel: u.providerProfile?.verificationLevel || (u.emailVerifiedAt ? 'EMAIL_VERIFIED' : 'NONE'),
            completedJobs: u.providerProfile?.completedJobs || 0,
            rating: u.providerProfile?.ratingAverage
              ? `${(u.providerProfile.ratingAverage / 100).toFixed(1)} ★ (${u.providerProfile.ratingCount})`
              : null,
            isActive: u.isActive,
            createdAt: u.createdAt.toISOString(),
          };
        }),
        total,
        page,
        limit,
      };
    } catch {
      // D-012 & D-014: Only the single seeded Super admin exists when DB is offline or empty
      return {
        items: [
          {
            id: '00000000-0000-0000-0000-000000000001',
            phone: '+250788000000',
            email: 'Iamshemaleandre@gmail.com',
            name: 'Shema Andre (Super Admin)',
            role: 'ADMIN',
            verificationLevel: 'PHONE_VERIFIED',
            completedJobs: 0,
            rating: null,
            isActive: true,
            createdAt: new Date().toISOString(),
          },
        ],
        total: 1,
        page,
        limit,
      };
    }
  }

  /**
   * Get recent outbound email logs for the Admin Console
   */
  async getEmailLogs(limit = 50) {
    if (!this.emailService) {
      return { items: [], total: 0 };
    }
    const items = this.emailService.getRecentLogs(limit);
    return { items, total: items.length };
  }

  /**
   * Check SMTP transport health and daily quota counters
   */
  async getEmailHealth() {
    if (!this.emailService) {
      return {
        transport: 'none',
        verified: false,
        dailySendsCount: 0,
        dailySendCap: 400,
        remainingSends: 400,
        totalRecentLogs: 0,
      };
    }
    return this.emailService.getHealthStatus();
  }

  /**
   * Dispatch a real test email through the active transport to verify delivery
   */
  async sendTestEmail(targetEmail: string) {
    if (!this.emailService) {
      throw new BadRequestException('Email service is not initialized');
    }
    return this.emailService.sendTestEmail(targetEmail);
  }
}

