import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../database/prisma.service.js';
import { OtpService } from './otp.service.js';
import { PasswordService } from './password.service.js';
import { EmailService } from '../email/email.service.js';
import {
  UserStatus,
  VerificationPurpose,
  type RegisterRequest,
  type VerifySignupOtpInput,
  type CreatePasswordInput,
  type SignInRequest,
  type ForgotPasswordRequest,
  type ResetPasswordInput,
} from '@kiraka/contracts';

export interface AuthSessionResult {
  user: any;
  token: string;
  isNewUser?: boolean;
}

interface LoginAttemptTracker {
  failures: number;
  lockedUntil?: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly SESSION_DURATION_DAYS = 30;

  // In-memory fallback stores (active when DB connection is deferred or in local dev)
  private readonly inMemoryUsers = new Map<string, any>();
  private readonly inMemorySessions = new Map<string, any>();
  private readonly loginAttempts = new Map<string, LoginAttemptTracker>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly otpService: OtpService,
    private readonly passwordService: PasswordService,
    private readonly emailService: EmailService,
  ) {
    this.seedSuperAdmin();
  }

  private async seedSuperAdmin() {
    const adminEmail = (process.env.ADMIN_SEED_EMAIL || 'Iamshemaleandre@gmail.com').toLowerCase().trim();
    const seedPass = process.env.ADMIN_SEED_PASSWORD || 'KirakaAdmin2026!';
    const hash = await this.passwordService.hashPassword(seedPass);

    const superAdmin = {
      id: '00000000-0000-0000-0000-000000000001',
      email: adminEmail,
      fullName: 'Shema Andre (Super Admin)',
      emailVerifiedAt: new Date(),
      passwordHash: hash,
      role: 'ADMIN',
      status: UserStatus.ACTIVE,
      countryCode: 'RW',
      locale: 'en',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      customerProfile: {
        id: '00000000-0000-0000-0000-000000000002',
        displayName: 'Shema Andre (Super Admin)',
        neighborhood: 'Kacyiru',
        avatarUrl: null,
      },
      providerProfile: null,
    };
    this.inMemoryUsers.set(adminEmail, superAdmin);
    this.inMemoryUsers.set(superAdmin.id, superAdmin);
  }

  /**
   * Helper: verify Cloudflare Turnstile token
   */
  async verifyTurnstile(token?: string, ipAddress?: string): Promise<boolean> {
    const secretKey = process.env.TURNSTILE_SECRET_KEY;
    const isDev = process.env.NODE_ENV !== 'production';

    // In local dev without secret, allow proceed
    if (isDev && !secretKey) {
      return true;
    }

    if (!token) {
      throw new BadRequestException('Security verification (Cloudflare Turnstile) required.');
    }

    try {
      const formData = new URLSearchParams();
      formData.append('secret', secretKey || '');
      formData.append('response', token);
      if (ipAddress) formData.append('remoteip', ipAddress);

      const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        body: formData,
      });
      const data = (await res.json()) as any;
      if (!data.success) {
        throw new BadRequestException('Turnstile security verification failed. Please try again.');
      }
      return true;
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException('Security check connection error.');
    }
  }

  /**
   * Section 1.2: Sign Up (Screen 1) — Create account
   * Status = PENDING_VERIFICATION. No session issued.
   */
  async register(input: RegisterRequest, ipAddress?: string) {
    await this.verifyTurnstile(input.turnstileToken, ipAddress);

    const email = input.email.toLowerCase().trim();

    // Anti-enumeration / existing active check
    const existing = await this.findUserByEmail(email);
    if (existing && existing.status === UserStatus.ACTIVE) {
      throw new ConflictException({
        message: 'This email already has an account. Sign in instead.',
        error: 'AccountExists',
        email,
      });
    }

    let user = existing;
    if (!user) {
      user = {
        id: crypto.randomUUID(),
        email,
        fullName: input.fullName.trim(),
        emailVerifiedAt: null,
        passwordHash: null,
        role: email === (process.env.ADMIN_SEED_EMAIL || 'iamshemaleandre@gmail.com').toLowerCase() ? 'ADMIN' : 'USER',
        status: UserStatus.PENDING_VERIFICATION,
        countryCode: 'RW',
        locale: 'en',
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        customerProfile: {
          id: crypto.randomUUID(),
          displayName: input.fullName.trim(),
          neighborhood: 'Kigali',
          avatarUrl: null,
        },
        providerProfile: null,
      };

      try {
        const created = await this.prisma.user.create({
          data: {
            email,
            fullName: input.fullName.trim(),
            role: user.role as any,
            status: 'PENDING_VERIFICATION',
            isActive: false,
            customerProfile: {
              create: {
                displayName: input.fullName.trim(),
                neighborhood: 'Kigali',
              },
            },
          },
          include: { customerProfile: true, providerProfile: true },
        });
        user.id = created.id;
      } catch {
        // Fallback to in-memory store
      }

      this.inMemoryUsers.set(email, user);
      this.inMemoryUsers.set(user.id, user);
    } else {
      user.fullName = input.fullName.trim();
      if (user.customerProfile) user.customerProfile.displayName = input.fullName.trim();
    }

    // Send 6-digit verification code to email (HMAC salt, never in API response)
    const codeResult = await this.otpService.requestEmailCode(email, VerificationPurpose.SIGNUP_VERIFY, ipAddress);

    return {
      success: true,
      message: `Verification code sent to ${this.otpService.maskEmail(email)}.`,
      maskedTarget: this.otpService.maskEmail(email),
      cooldownSeconds: codeResult.cooldownSeconds,
      expiresInSeconds: codeResult.expiresInSeconds,
    };
  }

  /**
   * Section 1.2: Sign Up (Screen 2) — Verify Email OTP
   * Single-use, marks email verified, status = PENDING_PASSWORD.
   * Issues 15-minute setup token.
   */
  async verifySignupOtp(input: VerifySignupOtpInput) {
    const email = input.email.toLowerCase().trim();

    // Verify 6-digit code
    await this.otpService.verifyCode(email, VerificationPurpose.SIGNUP_VERIFY, input.code);

    const user = await this.findUserByEmail(email);
    if (!user) {
      throw new BadRequestException('Registration session expired. Please register again.');
    }

    user.emailVerifiedAt = new Date();
    user.status = UserStatus.PENDING_PASSWORD;

    try {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerifiedAt: user.emailVerifiedAt,
          status: 'PENDING_PASSWORD',
        },
      });
    } catch {}

    // Generate 15-minute one-time setup token bound to user
    const setupToken = this.generateSetupToken(user.id, email);

    return {
      success: true,
      setupToken,
      expiresInSeconds: 900, // 15 minutes
    };
  }

  /**
   * Section 1.2: Sign Up (Screen 3) — Create Password
   * Validates password strength, hashes with Argon2id, activates user, and creates first session.
   */
  async createPassword(
    input: CreatePasswordInput,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<AuthSessionResult> {
    const tokenData = this.verifySetupToken(input.setupToken);
    if (!tokenData) {
      throw new BadRequestException('Password setup session has expired or is invalid. Please start again.');
    }

    // 1. Password policy and breach validation
    const valResult = await this.passwordService.validatePassword(input.password);
    if (!valResult.valid) {
      throw new BadRequestException(valResult.error || 'Password does not meet security requirements.');
    }

    const user = await this.findUserByEmail(tokenData.email);
    if (!user) {
      throw new BadRequestException('User record not found.');
    }

    // 2. Hash password with Argon2id
    const passwordHash = await this.passwordService.hashPassword(input.password);
    user.passwordHash = passwordHash;
    user.status = UserStatus.ACTIVE;
    user.isActive = true;

    try {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          status: 'ACTIVE',
          isActive: true,
        },
      });
    } catch {}

    // 3. Start first session
    const session = await this.createSession(user.id, userAgent, ipAddress);

    return {
      user: this.formatUserDto(user),
      token: session.token,
      isNewUser: true,
    };
  }

  /**
   * Section 1.3: Sign In — Email and Password ONLY.
   * NO OTP AT LOGIN. Rate limit + Turnstile after failures + anti-enumeration timing.
   */
  async login(
    input: SignInRequest,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<AuthSessionResult> {
    const email = input.email.toLowerCase().trim();
    const trackerKey = `${email}:${ipAddress || 'unknown'}`;
    const attempt = this.loginAttempts.get(trackerKey) || { failures: 0 };

    // Check account lockout (after 10 failures)
    if (attempt.lockedUntil && Date.now() < attempt.lockedUntil) {
      const waitMin = Math.ceil((attempt.lockedUntil - Date.now()) / 60000);
      throw new ForbiddenException(
        `Account temporarily locked due to too many failed login attempts. Please reset your password or try again in ${waitMin} minutes.`,
      );
    }

    // Turnstile required after 5 failed attempts
    if (attempt.failures >= 5) {
      await this.verifyTurnstile(input.turnstileToken, ipAddress);
    }

    const user = await this.findUserByEmail(email);

    // Anti-enumeration timing defense: if user doesn't exist or is not active, verify dummy hash
    if (!user || user.status !== UserStatus.ACTIVE || !user.passwordHash) {
      await this.passwordService.dummyVerify();
      this.recordLoginFailure(trackerKey, attempt);
      throw new UnauthorizedException('Email or password is incorrect.');
    }

    // Verify password against Argon2id hash
    const isValid = await this.passwordService.verifyPassword(user.passwordHash, input.password);
    if (!isValid) {
      this.recordLoginFailure(trackerKey, attempt);
      throw new UnauthorizedException('Email or password is incorrect.');
    }

    // Check suspension
    if (!user.isActive || user.status === UserStatus.SUSPENDED) {
      throw new ForbiddenException(
        'Your account has been suspended. Please contact support@kiraka.rw for assistance.',
      );
    }

    // Reset login failures on success
    this.loginAttempts.delete(trackerKey);

    // Create session (30-day cookie)
    const session = await this.createSession(user.id, userAgent, ipAddress);

    return {
      user: this.formatUserDto(user),
      token: session.token,
      isNewUser: false,
    };
  }

  /**
   * Section 1.4: Forgot Password Request (OTP to Email)
   * Anti-enumeration: returns generic response whether email exists or not.
   */
  async forgotPassword(input: ForgotPasswordRequest, ipAddress?: string) {
    await this.verifyTurnstile(input.turnstileToken, ipAddress);
    const email = input.email.toLowerCase().trim();

    const user = await this.findUserByEmail(email);
    if (user && user.status === UserStatus.ACTIVE) {
      try {
        await this.otpService.requestEmailCode(email, VerificationPurpose.PASSWORD_RESET, ipAddress);
      } catch (err: any) {
        this.logger.warn(`Password reset code request error for ${email}: ${err.message}`);
      }
    }

    return {
      success: true,
      message: 'If an account exists with this email address, you will receive a 6-digit reset code shortly.',
      cooldownSeconds: 60,
      expiresInSeconds: 600,
    };
  }

  /**
   * Section 1.4: Reset Password (Verify OTP + Set New Password)
   * Revokes all existing sessions, issues a new session, and sends security email.
   */
  async resetPassword(
    input: ResetPasswordInput,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<AuthSessionResult> {
    const email = input.email.toLowerCase().trim();

    // 1. Verify OTP code against PASSWORD_RESET
    await this.otpService.verifyCode(email, VerificationPurpose.PASSWORD_RESET, input.code);

    // 2. Validate password strength
    const valResult = await this.passwordService.validatePassword(input.newPassword);
    if (!valResult.valid) {
      throw new BadRequestException(valResult.error || 'Password does not meet security requirements.');
    }

    const user = await this.findUserByEmail(email);
    if (!user) {
      throw new BadRequestException('User record not found.');
    }

    // 3. Hash new password with Argon2id
    const newHash = await this.passwordService.hashPassword(input.newPassword);
    user.passwordHash = newHash;

    try {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newHash },
      });
    } catch {}

    // 4. Revoke ALL other existing sessions for this user (Section 1.4)
    await this.revokeAllUserSessions(user.id);

    // 5. Send security notification email
    this.emailService.sendSecurityNoticeEmail(
      email,
      'Your KIRAKA Password Has Been Changed',
      'The password for your KIRAKA account was recently changed. If you did not make this change, please contact support immediately.',
    ).catch(() => {});

    // 6. Sign user in with fresh session
    const session = await this.createSession(user.id, userAgent, ipAddress);

    return {
      user: this.formatUserDto(user),
      token: session.token,
    };
  }

  /**
   * Session Validation (AuthGuard)
   */
  async validateSession(token: string): Promise<{ user: any; session: any }> {
    let session = this.inMemorySessions.get(token);

    if (!session) {
      try {
        const dbSession = await this.prisma.userSession.findUnique({
          where: { token },
          include: {
            user: {
              include: { customerProfile: true, providerProfile: true },
            },
          },
        });
        if (dbSession && !dbSession.revokedAt && dbSession.expiresAt > new Date()) {
          session = dbSession;
        }
      } catch {}
    }

    if (!session || session.revokedAt || new Date() > new Date(session.expiresAt)) {
      throw new UnauthorizedException('Session expired or invalidated. Please sign in again.');
    }

    const user = session.user || this.inMemoryUsers.get(session.userId);
    if (!user || user.status !== UserStatus.ACTIVE || !user.isActive) {
      throw new UnauthorizedException('User account is inactive or pending verification.');
    }

    return { user, session };
  }

  /**
   * Logout: Revoke current session
   */
  async logout(token: string): Promise<void> {
    const session = this.inMemorySessions.get(token);
    if (session) {
      session.revokedAt = new Date();
    }
    try {
      await this.prisma.userSession.update({
        where: { token },
        data: { revokedAt: new Date() },
      });
    } catch {}
  }

  /**
   * Revoke all sessions for a user
   */
  async revokeAllUserSessions(userId: string): Promise<void> {
    for (const [, s] of this.inMemorySessions.entries()) {
      if (s.userId === userId) s.revokedAt = new Date();
    }
    try {
      await this.prisma.userSession.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } catch {}
  }

  // ─── Private Helpers ───

  private async createSession(userId: string, userAgent?: string, ipAddress?: string) {
    const token = crypto.randomBytes(32).toString('hex');
    const refreshToken = crypto.randomBytes(48).toString('hex');
    const expiresAt = new Date(Date.now() + this.SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);

    const sessionRecord = {
      id: crypto.randomUUID(),
      userId,
      token,
      refreshToken,
      deviceLabel: this.parseDeviceLabel(userAgent),
      userAgent: userAgent || null,
      ipAddress: ipAddress || null,
      lastUsedAt: new Date(),
      revokedAt: null,
      expiresAt,
      createdAt: new Date(),
    };

    this.inMemorySessions.set(token, sessionRecord);

    try {
      await this.prisma.userSession.create({
        data: {
          id: sessionRecord.id,
          userId,
          token,
          refreshToken,
          deviceLabel: sessionRecord.deviceLabel,
          userAgent: sessionRecord.userAgent,
          ipAddress: sessionRecord.ipAddress,
          expiresAt,
        },
      });
    } catch {}

    return sessionRecord;
  }

  private recordLoginFailure(key: string, attempt: LoginAttemptTracker) {
    attempt.failures += 1;
    if (attempt.failures >= 10) {
      attempt.lockedUntil = Date.now() + 15 * 60 * 1000; // 15-min lock
    }
    this.loginAttempts.set(key, attempt);
  }

  private generateSetupToken(userId: string, email: string): string {
    const payload = `${userId}:${email}:${Date.now() + 15 * 60 * 1000}`;
    const secret = process.env.SESSION_SECRET || 'dev-secret-setup';
    const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    return Buffer.from(`${payload}:${sig}`).toString('base64url');
  }

  private verifySetupToken(token: string): { userId: string; email: string } | null {
    try {
      const decoded = Buffer.from(token, 'base64url').toString('utf8');
      const parts = decoded.split(':');
      if (parts.length !== 4) return null;
      const [userId, email, expStr, sig] = parts;
      const payload = `${userId}:${email}:${expStr}`;
      const secret = process.env.SESSION_SECRET || 'dev-secret-setup';
      const expectedSig = crypto.createHmac('sha256', secret).update(payload).digest('hex');

      if (!crypto.timingSafeEqual(Buffer.from(sig!), Buffer.from(expectedSig))) return null;
      if (Date.now() > parseInt(expStr!, 10)) return null;

      return { userId: userId!, email: email! };
    } catch {
      return null;
    }
  }

  private parseDeviceLabel(userAgent?: string): string {
    if (!userAgent) return 'Web Browser';
    if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
      return 'Mobile Device';
    }
    if (userAgent.includes('Macintosh')) return 'Mac Desktop';
    if (userAgent.includes('Windows')) return 'Windows PC';
    return 'Web Browser';
  }

  private async findUserByEmail(email: string) {
    const mem = this.inMemoryUsers.get(email.toLowerCase().trim());
    if (mem) return mem;

    try {
      return await this.prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
        include: { customerProfile: true, providerProfile: true },
      });
    } catch {
      return null;
    }
  }

  formatUserDto(user: any) {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName || user.customerProfile?.displayName || 'User',
      emailVerified: !!user.emailVerifiedAt,
      phone: user.phone || null,
      role: user.role,
      status: user.status,
      countryCode: user.countryCode || 'RW',
      locale: user.locale || 'en',
      customerProfile: user.customerProfile,
      providerProfile: user.providerProfile,
      hasCompletedOnboarding: !!user.customerProfile?.neighborhood,
    };
  }
}
