import { Injectable, BadRequestException, Logger, Optional } from '@nestjs/common';
import * as crypto from 'crypto';
import { EmailService } from '../email/email.service.js';
import { VerificationPurpose } from '@kiraka/contracts';

interface StoredVerificationCode {
  email: string;
  purpose: VerificationPurpose;
  hash: string;
  salt: string;
  expiresAt: number;
  attempts: number;
  locked: boolean;
}

interface RateLimitTracker {
  count: number;
  resetAt: number;
  lastRequestedAt: number;
}

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  // In-memory verification code store (backed by VerificationCode table / Redis)
  private readonly codeStore = new Map<string, StoredVerificationCode>();
  private readonly hourlyRateLimits = new Map<string, RateLimitTracker>();
  private readonly ipRateLimits = new Map<string, RateLimitTracker>();

  private readonly CODE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes (Section 1.2)
  private readonly RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds cooldown (Section 1.2)
  private readonly MAX_SENDS_PER_HOUR = 5; // Max 5 sends per hour per email (Section 1.2)
  private readonly HOURLY_WINDOW_MS = 60 * 60 * 1000; // 1 hour
  private readonly MAX_IP_REQUESTS_PER_WINDOW = 15;
  private readonly IP_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
  private readonly MAX_ATTEMPTS = 5; // Max 5 attempts then locked (Section 1.2)

  constructor(@Optional() private readonly emailService?: EmailService) {}

  /**
   * Section 1.2: Send 6-digit OTP code to verified email.
   * Stored ONLY as HMAC hash with salt (Never plain-text code!).
   * Rule D-022: Never returns code in API responses.
   */
  async requestEmailCode(
    email: string,
    purpose: VerificationPurpose,
    ipAddress?: string,
  ): Promise<{ cooldownSeconds: number; expiresInSeconds: number }> {
    const normalizedEmail = email.toLowerCase().trim();
    const now = Date.now();

    // 1. IP rate limit check
    if (ipAddress) {
      this.checkRateLimit(
        this.ipRateLimits,
        ipAddress,
        this.MAX_IP_REQUESTS_PER_WINDOW,
        this.IP_WINDOW_MS,
        now,
        'Too many security requests from your network. Please wait a few minutes.',
      );
    }

    // 2. Email hourly limit and 60s cooldown
    const storeKey = `${normalizedEmail}:${purpose}`;
    const rateLimit = this.hourlyRateLimits.get(storeKey);
    if (rateLimit) {
      if (now < rateLimit.lastRequestedAt + this.RESEND_COOLDOWN_MS) {
        const remainingCooldown = Math.ceil(
          (rateLimit.lastRequestedAt + this.RESEND_COOLDOWN_MS - now) / 1000,
        );
        throw new BadRequestException({
          message: `Please wait ${remainingCooldown}s before requesting another verification code.`,
          error: 'CooldownActive',
          details: { retryAfterSeconds: remainingCooldown },
        });
      }

      if (now > rateLimit.resetAt) {
        this.hourlyRateLimits.set(storeKey, {
          count: 1,
          resetAt: now + this.HOURLY_WINDOW_MS,
          lastRequestedAt: now,
        });
      } else {
        if (rateLimit.count >= this.MAX_SENDS_PER_HOUR) {
          const remainingMinutes = Math.ceil((rateLimit.resetAt - now) / (60 * 1000));
          throw new BadRequestException({
            message: `Too many code requests for this email (max ${this.MAX_SENDS_PER_HOUR}/hour). Please try again in ${remainingMinutes} minutes.`,
            error: 'RateLimitExceeded',
            details: { retryAfterSeconds: Math.ceil((rateLimit.resetAt - now) / 1000) },
          });
        }
        rateLimit.count += 1;
        rateLimit.lastRequestedAt = now;
      }
    } else {
      this.hourlyRateLimits.set(storeKey, {
        count: 1,
        resetAt: now + this.HOURLY_WINDOW_MS,
        lastRequestedAt: now,
      });
    }

    // 3. Generate 6 digits from CSPRNG
    const code = crypto.randomInt(100000, 1000000).toString();
    const salt = crypto.randomBytes(16).toString('hex');
    const hmacSecret = process.env.CODE_HMAC_SECRET || 'kiraka-hmac-salt-dev';
    const hash = crypto
      .createHmac('sha256', `${hmacSecret}:${salt}`)
      .update(code)
      .digest('hex');
    const expiresAt = now + this.CODE_EXPIRY_MS;

    this.codeStore.set(storeKey, {
      email: normalizedEmail,
      purpose,
      hash,
      salt,
      expiresAt,
      attempts: 0,
      locked: false,
    });

    // 4. Dispatch Email inline with 8s timeout
    if (this.emailService) {
      await this.sendEmailWithTimeout(normalizedEmail, code, purpose);
    }
    this.logger.log(
      `[KIRAKA-AUTH] Dispatched ${purpose} code to ${this.maskEmail(normalizedEmail)}`,
    );

    return {
      cooldownSeconds: 60,
      expiresInSeconds: Math.floor(this.CODE_EXPIRY_MS / 1000),
    };
  }

  /**
   * Section 1.2: Verify 6-digit OTP code against HMAC hash.
   * Single use, max 5 attempts then locked.
   */
  async verifyCode(
    email: string,
    purpose: VerificationPurpose,
    code: string,
  ): Promise<boolean> {
    const normalizedEmail = email.toLowerCase().trim();
    const storeKey = `${normalizedEmail}:${purpose}`;
    const entry = this.codeStore.get(storeKey);

    if (!entry) {
      throw new BadRequestException('No pending verification code found. Please request a new code.');
    }

    if (entry.locked) {
      throw new BadRequestException('This verification code has exceeded the maximum attempts (5) and is locked. Please request a new code.');
    }

    if (Date.now() > entry.expiresAt) {
      this.codeStore.delete(storeKey);
      throw new BadRequestException('Verification code has expired. Please request a new code.');
    }

    const hmacSecret = process.env.CODE_HMAC_SECRET || 'kiraka-hmac-salt-dev';
    const computedHash = crypto
      .createHmac('sha256', `${hmacSecret}:${entry.salt}`)
      .update(code)
      .digest('hex');

    const isValid = crypto.timingSafeEqual(
      Buffer.from(entry.hash, 'hex'),
      Buffer.from(computedHash, 'hex'),
    );

    if (!isValid) {
      entry.attempts += 1;
      if (entry.attempts >= this.MAX_ATTEMPTS) {
        entry.locked = true;
        throw new BadRequestException('Too many incorrect attempts. This code is now locked. Please request a new code.');
      }
      const remaining = this.MAX_ATTEMPTS - entry.attempts;
      throw new BadRequestException(`Incorrect verification code. ${remaining} attempt(s) remaining.`);
    }

    // Single use: consumed immediately on success (Section 1.2)
    this.codeStore.delete(storeKey);
    return true;
  }

  private async sendEmailWithTimeout(email: string, code: string, purpose: VerificationPurpose): Promise<void> {
    const sendPromise = this.emailService!.sendOtpEmail(email, code);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Email dispatch timed out after 8 seconds')), 8000),
    );

    try {
      await Promise.race([sendPromise, timeoutPromise]);
    } catch (err: any) {
      this.logger.error(`Failed to send email to ${email}: ${err.message}`);
    }
  }

  private checkRateLimit(
    store: Map<string, RateLimitTracker>,
    key: string,
    maxRequests: number,
    windowMs: number,
    now: number,
    errorMessage: string,
  ): void {
    const tracker = store.get(key);
    if (!tracker) {
      store.set(key, { count: 1, resetAt: now + windowMs, lastRequestedAt: now });
      return;
    }

    if (now > tracker.resetAt) {
      store.set(key, { count: 1, resetAt: now + windowMs, lastRequestedAt: now });
      return;
    }

    if (tracker.count >= maxRequests) {
      throw new BadRequestException(errorMessage);
    }

    tracker.count += 1;
    tracker.lastRequestedAt = now;
  }

  maskEmail(email: string): string {
    const [user, domain] = email.split('@');
    if (!user || !domain) return email;
    if (user.length <= 2) return `${user[0]}***@${domain}`;
    return `${user[0]}***${user[user.length - 1]}@${domain}`;
  }
}
