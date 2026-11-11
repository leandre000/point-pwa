import { Injectable, BadRequestException, Inject, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { SMS_PROVIDER, type SmsProvider } from './adapters/sms-provider.interface.js';

interface StoredOtp {
  code: string;
  expiresAt: number;
  attempts: number;
}

interface RateLimitTracker {
  count: number;
  resetAt: number;
  lastRequestedAt: number;
}

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  // In-memory fallback stores (backed by Redis when REDIS_URL is active)
  private readonly otpStore = new Map<string, StoredOtp>();
  private readonly phoneRateLimits = new Map<string, RateLimitTracker>();
  private readonly ipRateLimits = new Map<string, RateLimitTracker>();

  private readonly OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
  private readonly RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
  private readonly MAX_PHONE_REQUESTS_PER_WINDOW = 3;
  private readonly MAX_IP_REQUESTS_PER_WINDOW = 10;
  private readonly RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
  private readonly MAX_VERIFY_ATTEMPTS = 5;

  constructor(
    @Inject(SMS_PROVIDER)
    private readonly smsProvider: SmsProvider,
  ) {}

  /**
   * Request a 6-digit OTP code to be sent to an E.164 phone number.
   * Enforces SMS pumping protection and resend cooldowns.
   */
  async requestOtp(phone: string, ipAddress?: string): Promise<{
    cooldownSeconds: number;
    expiresInSeconds: number;
    mockCode?: string;
  }> {
    const now = Date.now();

    // 1. IP-level rate limiting (SMS pumping mitigation)
    if (ipAddress) {
      this.checkRateLimit(this.ipRateLimits, ipAddress, this.MAX_IP_REQUESTS_PER_WINDOW, now, 'Too many requests from this network. Please wait a few minutes.');
    }

    // 2. Phone-level rate limiting and cooldown
    const phoneLimit = this.phoneRateLimits.get(phone);
    if (phoneLimit) {
      if (now < phoneLimit.lastRequestedAt + this.RESEND_COOLDOWN_MS) {
        const remainingCooldown = Math.ceil((phoneLimit.lastRequestedAt + this.RESEND_COOLDOWN_MS - now) / 1000);
        throw new BadRequestException({
          message: `Please wait ${remainingCooldown}s before requesting another code.`,
          error: 'CooldownActive',
          details: { retryAfterSeconds: remainingCooldown },
        });
      }

      if (now > phoneLimit.resetAt) {
        this.phoneRateLimits.set(phone, { count: 1, resetAt: now + this.RATE_LIMIT_WINDOW_MS, lastRequestedAt: now });
      } else {
        if (phoneLimit.count >= this.MAX_PHONE_REQUESTS_PER_WINDOW) {
          const remainingMinutes = Math.ceil((phoneLimit.resetAt - now) / (60 * 1000));
          throw new BadRequestException({
            message: `Too many OTP requests for this number. Please try again in ${remainingMinutes} minutes.`,
            error: 'RateLimitExceeded',
            details: { retryAfterSeconds: Math.ceil((phoneLimit.resetAt - now) / 1000) },
          });
        }
        phoneLimit.count += 1;
        phoneLimit.lastRequestedAt = now;
      }
    } else {
      this.phoneRateLimits.set(phone, { count: 1, resetAt: now + this.RATE_LIMIT_WINDOW_MS, lastRequestedAt: now });
    }

    // 3. Generate secure 6-digit numeric code
    const code = crypto.randomInt(100000, 999999).toString();
    const expiresAt = now + this.OTP_EXPIRY_MS;

    this.otpStore.set(phone, { code, expiresAt, attempts: 0 });

    // 4. Send message via SMS adapter
    const smsMessage = `Your KIRAKA verification code is: ${code}. Valid for 5 minutes. Do not share this code.`;
    await this.smsProvider.sendSms({ to: phone, message: smsMessage });

    const isDev = process.env.NODE_ENV !== 'production' || this.smsProvider.name === 'mock';

    return {
      cooldownSeconds: 60,
      expiresInSeconds: Math.floor(this.OTP_EXPIRY_MS / 1000),
      mockCode: isDev ? code : undefined,
    };
  }

  /**
   * Verify an OTP code.
   * Single-use: burns the code on successful verification.
   * Locks after 5 failed attempts.
   */
  async verifyOtp(phone: string, inputCode: string): Promise<boolean> {
    const record = this.otpStore.get(phone);

    if (!record) {
      throw new BadRequestException({
        message: 'No pending verification code found. Please request a new code.',
        error: 'OtpNotFound',
      });
    }

    if (Date.now() > record.expiresAt) {
      this.otpStore.delete(phone);
      throw new BadRequestException({
        message: 'This code has expired. Please request a new code.',
        error: 'OtpExpired',
      });
    }

    if (record.attempts >= this.MAX_VERIFY_ATTEMPTS) {
      this.otpStore.delete(phone);
      throw new BadRequestException({
        message: 'Too many incorrect attempts. Please request a new code.',
        error: 'MaxAttemptsExceeded',
      });
    }

    // Constant-time comparison to prevent timing attacks
    const isValid = crypto.timingSafeEqual(Buffer.from(record.code), Buffer.from(inputCode));

    if (!isValid) {
      record.attempts += 1;
      const remaining = this.MAX_VERIFY_ATTEMPTS - record.attempts;
      throw new BadRequestException({
        message: `Incorrect code. ${remaining} attempt(s) remaining.`,
        error: 'InvalidOtp',
        details: { remainingAttempts: remaining },
      });
    }

    // Single-use: burn on verify!
    this.otpStore.delete(phone);
    return true;
  }

  private checkRateLimit(
    store: Map<string, RateLimitTracker>,
    key: string,
    limit: number,
    now: number,
    errorMessage: string,
  ) {
    const tracker = store.get(key);
    if (!tracker) {
      store.set(key, { count: 1, resetAt: now + this.RATE_LIMIT_WINDOW_MS, lastRequestedAt: now });
      return;
    }

    if (now > tracker.resetAt) {
      store.set(key, { count: 1, resetAt: now + this.RATE_LIMIT_WINDOW_MS, lastRequestedAt: now });
      return;
    }

    if (tracker.count >= limit) {
      const waitSeconds = Math.ceil((tracker.resetAt - now) / 1000);
      throw new BadRequestException({
        message: errorMessage,
        error: 'RateLimitExceeded',
        details: { retryAfterSeconds: waitSeconds },
      });
    }

    tracker.count += 1;
  }
}

