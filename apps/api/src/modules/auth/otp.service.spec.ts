import { describe, it, expect, beforeEach } from 'vitest';
import { OtpService } from './otp.service.js';
import { VerificationPurpose } from '@kiraka/contracts';

describe('OtpService (Email Verification)', () => {
  let otpService: OtpService;
  let sentEmails: { email: string; code: string }[];

  beforeEach(() => {
    sentEmails = [];
    const mockEmailService = {
      sendOtpEmail: async (email: string, code: string) => {
        sentEmails.push({ email, code });
        return { success: true };
      },
    } as any;
    otpService = new OtpService(mockEmailService);
  });

  it('generates a 6-digit CSPRNG code and respects cooldown', async () => {
    const email = 'neighbor@kigali.rw';
    const result = await otpService.requestEmailCode(email, VerificationPurpose.SIGNUP_VERIFY, '127.0.0.1');

    expect(result.cooldownSeconds).toBe(60);
    expect(result.expiresInSeconds).toBe(600); // 10 minutes

    expect(sentEmails.length).toBe(1);
    expect(sentEmails[0]?.email).toBe(email);
    expect(sentEmails[0]?.code).toMatch(/^\d{6}$/);

    // Requesting immediately again triggers 60s cooldown error
    await expect(
      otpService.requestEmailCode(email, VerificationPurpose.SIGNUP_VERIFY, '127.0.0.1'),
    ).rejects.toThrowError(/Please wait \d+s before requesting another verification code/);
  });

  it('verifies valid code and burns it upon verification (single use)', async () => {
    const email = 'user2@kigali.rw';
    await otpService.requestEmailCode(email, VerificationPurpose.SIGNUP_VERIFY);
    const lastEmail = sentEmails[sentEmails.length - 1];
    const code = lastEmail ? lastEmail.code : '';

    // First verification succeeds
    const verified = await otpService.verifyCode(email, VerificationPurpose.SIGNUP_VERIFY, code);
    expect(verified).toBe(true);

    // Second verification with same code fails (burned single-use OTP)
    await expect(
      otpService.verifyCode(email, VerificationPurpose.SIGNUP_VERIFY, code),
    ).rejects.toThrowError(/No pending verification code found/);
  });

  it('locks after 5 repeated invalid attempts', async () => {
    const email = 'user3@kigali.rw';
    await otpService.requestEmailCode(email, VerificationPurpose.SIGNUP_VERIFY);

    // 4 failed attempts with remaining counts
    for (let i = 0; i < 4; i++) {
      await expect(
        otpService.verifyCode(email, VerificationPurpose.SIGNUP_VERIFY, '000000'),
      ).rejects.toThrowError(/Incorrect verification code/);
    }

    // 5th attempt locks the code immediately
    await expect(
      otpService.verifyCode(email, VerificationPurpose.SIGNUP_VERIFY, '000000'),
    ).rejects.toThrowError(/Too many incorrect attempts/);

    // 6th attempt rejects because code is locked
    await expect(
      otpService.verifyCode(email, VerificationPurpose.SIGNUP_VERIFY, '000000'),
    ).rejects.toThrowError(/exceeded the maximum attempts/);
  });
});
