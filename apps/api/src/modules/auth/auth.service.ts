import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../database/prisma.service.js';
import { OtpService } from './otp.service.js';
import type { User, CustomerProfile, ProviderProfile } from '@prisma/client';

export interface AuthSessionResult {
  user: User & { customerProfile: CustomerProfile | null; providerProfile: ProviderProfile | null };
  token: string;
  isNewUser: boolean;
}

@Injectable()
export class AuthService {
  private readonly SESSION_DURATION_DAYS = 30;

  constructor(
    private readonly prisma: PrismaService,
    private readonly otpService: OtpService,
  ) {}

  /**
   * Verify an OTP and create/retrieve user and session.
   */
  async verifyAndAuthenticate(
    phone: string,
    code: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<AuthSessionResult> {
    // 1. Verify OTP (throws if invalid/expired)
    await this.otpService.verifyOtp(phone, code);

    // 2. Lookup or create user
    let user = await this.prisma.user.findUnique({
      where: { phone },
      include: { customerProfile: true, providerProfile: true },
    });

    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      user = await this.prisma.user.create({
        data: {
          phone,
          phoneVerifiedAt: new Date(),
          customerProfile: {
            create: {
              displayName: 'New Neighbor',
            },
          },
        },
        include: { customerProfile: true, providerProfile: true },
      });
    } else if (!user.phoneVerifiedAt) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { phoneVerifiedAt: new Date() },
      });
    }

    // 3. Generate secure session token (32 bytes = 256 bits of entropy)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.SESSION_DURATION_DAYS);

    await this.prisma.userSession.create({
      data: {
        userId: user.id,
        token,
        userAgent: userAgent || null,
        ipAddress: ipAddress || null,
        expiresAt,
      },
    });

    return { user, token, isNewUser };
  }

  /**
   * Validate a session token from cookie or Authorization header.
   */
  async validateSession(token: string) {
    if (!token) throw new UnauthorizedException('Authentication required');

    const session = await this.prisma.userSession.findUnique({
      where: { token },
      include: {
        user: {
          include: { customerProfile: true, providerProfile: true },
        },
      },
    });

    if (!session || session.expiresAt < new Date()) {
      if (session) {
        await this.prisma.userSession.delete({ where: { id: session.id } }).catch(() => {});
      }
      throw new UnauthorizedException('Session expired or invalid');
    }

    if (!session.user.isActive) {
      throw new UnauthorizedException('This account has been deactivated or restricted.');
    }

    return { user: session.user, session };
  }

  /**
   * Revoke a single session (sign out).
   */
  async revokeSession(token: string): Promise<void> {
    await this.prisma.userSession.deleteMany({ where: { token } }).catch(() => {});
  }

  /**
   * List active sessions for the user.
   */
  async listUserSessions(userId: string, currentToken: string) {
    const sessions = await this.prisma.userSession.findMany({
      where: { userId, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    return sessions.map((s) => ({
      id: s.id,
      userAgent: s.userAgent,
      ipAddress: s.ipAddress,
      isCurrent: s.token === currentToken,
      createdAt: s.createdAt.toISOString(),
      expiresAt: s.expiresAt.toISOString(),
    }));
  }

  /**
   * Revoke all other sessions (sign out other devices).
   */
  async revokeOtherSessions(userId: string, currentToken: string): Promise<{ revokedCount: number }> {
    const result = await this.prisma.userSession.deleteMany({
      where: {
        userId,
        token: { not: currentToken },
      },
    });

    return { revokedCount: result.count };
  }
}
