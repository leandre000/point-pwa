import { describe, it, expect, beforeEach } from 'vitest';
import { OtpService } from './otp.service.js';
import { MockSmsProvider } from './adapters/mock-sms.provider.js';

describe('OtpService', () => {
  let otpService: OtpService;
  let mockSms: MockSmsProvider;

  beforeEach(() => {
    mockSms = new MockSmsProvider();
    otpService = new OtpService(mockSms);
  });

  it('generates a 6-digit OTP code and respects cooldown', async () => {
    const phone = '+250788123456';
    const result = await otpService.requestOtp(phone, '127.0.0.1');

    expect(result.cooldownSeconds).toBe(60);
    expect(result.expiresInSeconds).toBe(300);
    expect(result.mockCode).toMatch(/^\d{6}$/);

    // Requesting immediately again should trigger 60s cooldown error
    await expect(otpService.requestOtp(phone, '127.0.0.1')).rejects.toThrowError(
      /Please wait \d+s before requesting another code/,
    );
  });

  it('verifies valid code and burns it upon verification (single use)', async () => {
    const phone = '+250788654321';
    const { mockCode } = await otpService.requestOtp(phone);
    expect(mockCode).toBeDefined();

    // First verification succeeds
    const verified = await otpService.verifyOtp(phone, mockCode!);
    expect(verified).toBe(true);

    // Second verification with same code fails (burned single-use OTP)
    await expect(otpService.verifyOtp(phone, mockCode!)).rejects.toThrowError(
      /No pending verification code found/,
    );
  });

  it('locks after repeated invalid attempts', async () => {
    const phone = '+250788999888';
    await otpService.requestOtp(phone);

    // 4 failed attempts
    for (let i = 0; i < 4; i++) {
      await expect(otpService.verifyOtp(phone, '000000')).rejects.toThrowError(/Incorrect code/);
    }

    // 5th failed attempt locks the OTP
    await expect(otpService.verifyOtp(phone, '000000')).rejects.toThrowError(
      /Too many incorrect attempts/,
    );
  });
});
