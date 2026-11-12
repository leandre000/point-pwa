import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { hash, verify } from '@node-rs/argon2';

const TOP_COMMON_PASSWORDS = new Set([
  '12345678',
  '123456789',
  'password',
  'password123',
  'qwerty123',
  'welcome1',
  'admin123',
  'kiraka2026',
  'kigalirwanda',
  'rwanda2026',
  'iloveyou',
  'secret123',
  'passphrase',
  'changeme',
]);

@Injectable()
export class PasswordService {
  private readonly logger = new Logger(PasswordService.name);

  /**
   * Section 1.1: Argon2id password hashing
   */
  async hashPassword(password: string): Promise<string> {
    return hash(password, {
      algorithm: 2, // Argon2id (Algorithm.Argon2id)
      memoryCost: 19456, // 19 MiB
      timeCost: 2,
      parallelism: 1,
    });
  }

  /**
   * Section 1.3: Verify password against Argon2id hash
   */
  async verifyPassword(passwordHash: string, plain: string): Promise<boolean> {
    try {
      return await verify(passwordHash, plain);
    } catch {
      return false;
    }
  }

  /**
   * Section 1.2: Check password policy, length (8-128), and breached password check (HIBP k-anonymity)
   */
  async validatePassword(password: string): Promise<{ valid: boolean; error?: string }> {
    if (!password || password.length < 8) {
      return { valid: false, error: 'Password must be at least 8 characters long.' };
    }

    if (password.length > 128) {
      return { valid: false, error: 'Password cannot exceed 128 characters.' };
    }

    const lower = password.toLowerCase().trim();
    if (TOP_COMMON_PASSWORDS.has(lower)) {
      return {
        valid: false,
        error: 'This password is too common and easily guessed. Please choose a stronger password.',
      };
    }

    // Have I Been Pwned Range API with k-anonymity (SHA-1 prefix of 5 chars)
    try {
      const isBreached = await this.checkHaveIBeenPwned(password);
      if (isBreached) {
        return {
          valid: false,
          error: 'This password has appeared in known data breaches. For your safety, please choose a different password.',
        };
      }
    } catch {
      // Do not block registration if external HIBP check is unreachable
    }

    return { valid: true };
  }

  /**
   * k-Anonymity HIBP check: sends ONLY first 5 chars of SHA-1 hash
   */
  private async checkHaveIBeenPwned(password: string): Promise<boolean> {
    const sha1 = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
    const prefix = sha1.substring(0, 5);
    const suffix = sha1.substring(5);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000); // 2 second timeout

    try {
      const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
        signal: controller.signal,
        headers: { 'User-Agent': 'KIRAKA-PWA-BreachCheck' },
      });

      if (!res.ok) return false;

      const body = await res.text();
      const lines = body.split('\n');
      for (const line of lines) {
        const [hashSuffix, countStr] = line.trim().split(':');
        if (hashSuffix === suffix) {
          const count = parseInt(countStr || '0', 10);
          return count > 0;
        }
      }
      return false;
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Timing-attack mitigation: dummy hash verification for non-existent users
   */
  async dummyVerify(): Promise<void> {
    // Argon2id hash of a dummy string to equalize response time
    const dummyHash = '$argon2id$v=19$m=19456,t=2,p=1$ZHVtbXlzYWx0MTIzNDU$4+5yE3Tq1Q8i0W+Jb3KxFA';
    try {
      await verify(dummyHash, 'invalid-password-timing-defense');
    } catch {}
  }
}
