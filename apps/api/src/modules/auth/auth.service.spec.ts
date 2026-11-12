import { describe, it, expect, beforeEach } from 'vitest';
import { AuthService } from './auth.service.js';
import { PasswordService } from './password.service.js';
import { OtpService } from './otp.service.js';
import { EmailService } from '../email/email.service.js';
import { PrismaService } from '../../database/prisma.service.js';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService (P0-A Persistence & P0-B Admin Separation)', () => {
  let authService: AuthService;
  let passwordService: PasswordService;
  let otpService: OtpService;
  let emailService: EmailService;
  let prisma: PrismaService;

  beforeEach(async () => {
    prisma = {
      adminAccount: { upsert: () => Promise.resolve(), findUnique: () => Promise.resolve(null) },
      adminSession: { create: () => Promise.resolve(), findUnique: () => Promise.resolve(null), update: () => Promise.resolve() },
      adminHandoffCode: { create: () => Promise.resolve(), findUnique: () => Promise.resolve(null), update: () => Promise.resolve() },
      user: { deleteMany: () => Promise.resolve({ count: 0 }), findUnique: () => Promise.resolve(null) },
      userSession: { create: () => Promise.resolve(), findUnique: () => Promise.resolve(null), update: () => Promise.resolve() },
    } as any;

    passwordService = new PasswordService();
    otpService = new OtpService(prisma as any);
    emailService = {
      sendSecurityNoticeEmail: () => Promise.resolve(),
      sendWelcomeEmail: () => Promise.resolve(),
    } as any;

    authService = new AuthService(prisma, otpService, passwordService, emailService);
    await (authService as any).seedSuperAdmin();
  });

  describe('P0-B: Admin Authentication & Routing Isolation (D-024)', () => {
    it('direct admin login on ADMIN_ORIGIN succeeds with admin credentials', async () => {
      const result = await authService.loginAdmin(
        'Iamshemaleandre@gmail.com',
        'KirakaAdmin2026!',
        '127.0.0.1',
        'TestRunner',
      );

      expect(result).toBeDefined();
      expect(result.admin.email).toBe('iamshemaleandre@gmail.com');
      expect(result.admin.role).toBe('SUPER_ADMIN');
      expect(result.token).toBeDefined();
    });

    it('customer sign-in with admin credentials does NOT create customer session, returns handoff (D-024)', async () => {
      const result = await authService.login(
        {
          email: 'Iamshemaleandre@gmail.com',
          password: 'KirakaAdmin2026!',
        },
        'TestBrowser',
        '127.0.0.1',
      );

      // Must require admin handoff
      expect(result.requiresAdminHandoff).toBe(true);
      expect(result.handoffCode).toBeDefined();
      expect(result.adminOrigin).toBeDefined();
      expect(result.redirectUrl).toContain('/handoff?code=');
      // Must NOT return customer user or session token
      expect(result.user).toBeUndefined();
      expect(result.token).toBeUndefined();
    });

    it('handoff code can be exchanged exactly once (single-use 30s limit)', async () => {
      // 1. Generate handoff
      const handoff = await authService.createAdminHandoff(
        '00000000-0000-0000-0000-000000000001',
        '127.0.0.1',
        'TestBrowser',
      );

      // 2. First exchange must succeed
      const exchangeResult = await authService.exchangeAdminHandoff(
        handoff.handoffCode,
        '127.0.0.1',
        'AdminConsole',
      );
      expect(exchangeResult.admin).toBeDefined();
      expect(exchangeResult.token).toBeDefined();

      // 3. Second exchange must fail (replay defense)
      await expect(
        authService.exchangeAdminHandoff(handoff.handoffCode, '127.0.0.1', 'ReplayAttacker'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('admin session validates and enforces 2h idle timeout', async () => {
      const { token } = await authService.loginAdmin(
        'Iamshemaleandre@gmail.com',
        'KirakaAdmin2026!',
        '127.0.0.1',
        'TestRunner',
      );

      // 1. Session valid immediately
      const valid = await authService.validateAdminSession(token);
      expect(valid.admin.email).toBe('iamshemaleandre@gmail.com');

      // 2. Simulate 2 hours + 1 minute of inactivity
      valid.session.lastUsedAt = new Date(Date.now() - (2 * 60 * 60 * 1000 + 60 * 1000));

      await expect(authService.validateAdminSession(token)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('P0-A: Session Persistence & Rotating Refresh Token (D-023)', () => {
    it('refreshSession rotates refresh token and returns new session token', async () => {
      // Create user and first session
      const mockUser = {
        id: 'u-1',
        email: 'user@kigali.rw',
        status: 'ACTIVE',
        isActive: true,
        passwordHash: 'dummy',
      };
      (authService as any).inMemoryUsers.set('user@kigali.rw', mockUser);
      (authService as any).inMemoryUsers.set(mockUser.id, mockUser);

      const session = await (authService as any).createSession('u-1', 'Mobile', '127.0.0.1');
      const oldToken = session.token;
      const oldRefreshToken = session.refreshToken;

      // Refresh
      const refreshResult = await authService.refreshSession(oldRefreshToken, 'Mobile', '127.0.0.1');

      expect(refreshResult.token).toBeDefined();
      expect(refreshResult.token).not.toBe(oldToken);
      expect(refreshResult.refreshToken).toBeDefined();
      expect(refreshResult.refreshToken).not.toBe(oldRefreshToken);
    });

    it('allows 10-second grace window on rotated token for concurrent multi-tab requests', async () => {
      const mockUser2 = {
        id: 'u-2',
        email: 'user2@kigali.rw',
        status: 'ACTIVE',
        isActive: true,
        passwordHash: 'dummy',
      };
      (authService as any).inMemoryUsers.set('user2@kigali.rw', mockUser2);
      (authService as any).inMemoryUsers.set(mockUser2.id, mockUser2);

      const session = await (authService as any).createSession('u-2', 'BrowserTab1', '127.0.0.1');
      const initialRefreshToken = session.refreshToken;

      // Tab 1 rotates the refresh token
      const tab1Result = await authService.refreshSession(initialRefreshToken, 'BrowserTab1', '127.0.0.1');

      // Tab 2 arrives immediately with the now-rotated initial token within 10s grace window
      const tab2Result = await authService.refreshSession(initialRefreshToken, 'BrowserTab2', '127.0.0.1');

      // Tab 2 must succeed and receive the current refreshed token
      expect(tab2Result.token).toBe(tab1Result.token);
      expect(tab2Result.refreshToken).toBe(tab1Result.refreshToken);
    });
  });
});
