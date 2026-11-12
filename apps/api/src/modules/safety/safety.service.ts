import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import {
  CreateReportInput,
  BlockUserInput,
  ReportStatus,
  RWANDA_EMERGENCY_CONTACTS,
} from '@kiraka/contracts';

@Injectable()
export class SafetyService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Submit a user or job report (FR-REP-01).
   */
  async createReport(reporterId: string, input: CreateReportInput) {
    if (!input.targetUserId && !input.targetJobId) {
      throw new BadRequestException('Report must target either a user or a job');
    }

    if (input.targetUserId && input.targetUserId === reporterId) {
      throw new BadRequestException('You cannot report yourself');
    }

    const report = await this.prisma.userReport.create({
      data: {
        reporterId,
        targetUserId: input.targetUserId,
        targetJobId: input.targetJobId,
        reason: input.reason,
        details: input.details,
        status: ReportStatus.PENDING,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: reporterId,
        action: 'REPORT_SUBMITTED',
        entityType: 'USER_REPORT',
        entityId: report.id,
        details: {
          reason: input.reason,
          targetUserId: input.targetUserId,
          targetJobId: input.targetJobId,
        },
      },
    });

    return {
      success: true,
      message: 'Report received. Our trust and safety team will review it.',
      reportId: report.id,
    };
  }

  /**
   * Block a user (FR-REP-03).
   * Blocked users cannot message, view offers, or interact with each other.
   */
  async blockUser(blockerId: string, input: BlockUserInput) {
    if (blockerId === input.blockedUserId) {
      throw new BadRequestException('You cannot block yourself');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: input.blockedUserId },
    });

    if (!targetUser) {
      throw new NotFoundException('User to block not found');
    }

    const existing = await this.prisma.userBlock.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId: input.blockedUserId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('User is already blocked');
    }

    const block = await this.prisma.userBlock.create({
      data: {
        blockerId,
        blockedId: input.blockedUserId,
        reason: input.reason,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: blockerId,
        action: 'USER_BLOCKED',
        entityType: 'USER_BLOCK',
        entityId: block.id,
        details: {
          blockedUserId: input.blockedUserId,
        },
      },
    });

    return {
      success: true,
      message: 'User has been blocked. They will not be able to interact with you.',
      blockId: block.id,
    };
  }

  /**
   * Unblock a previously blocked user.
   */
  async unblockUser(blockerId: string, blockedUserId: string) {
    const existing = await this.prisma.userBlock.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId: blockedUserId,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Block record not found');
    }

    await this.prisma.userBlock.delete({
      where: { id: existing.id },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: blockerId,
        action: 'USER_UNBLOCKED',
        entityType: 'USER_BLOCK',
        entityId: existing.id,
        details: { blockedUserId },
      },
    });

    return {
      success: true,
      message: 'User unblocked successfully.',
    };
  }

  /**
   * Check if a block exists between two users in either direction.
   */
  async isBlocked(userAId: string, userBId: string): Promise<boolean> {
    const block = await this.prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerId: userAId, blockedId: userBId },
          { blockerId: userBId, blockedId: userAId },
        ],
      },
    });
    return !!block;
  }

  /**
   * Get list of blocked user IDs for a given user.
   */
  async getBlockedUserIds(userId: string): Promise<string[]> {
    const blocks = await this.prisma.userBlock.findMany({
      where: {
        OR: [{ blockerId: userId }, { blockedId: userId }],
      },
      select: {
        blockerId: true,
        blockedId: true,
      },
    });

    const set = new Set<string>();
    for (const b of blocks) {
      if (b.blockerId !== userId) set.add(b.blockerId);
      if (b.blockedId !== userId) set.add(b.blockedId);
    }
    return Array.from(set);
  }

  /**
   * Get Rwandan emergency and support contacts.
   */
  getEmergencyContacts() {
    return RWANDA_EMERGENCY_CONTACTS;
  }
}

