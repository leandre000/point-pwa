import { Injectable, Logger } from '@nestjs/common';
import type { SmsProvider, SendSmsOptions, SmsSendResult } from './sms-provider.interface.js';

/**
 * Mock SMS Provider for local development, CI, and test environments.
 * Logs the OTP code prominently so developers can immediately sign in.
 */
@Injectable()
export class MockSmsProvider implements SmsProvider {
  readonly name = 'mock';
  private readonly logger = new Logger(MockSmsProvider.name);

  async sendSms({ to, message }: SendSmsOptions): Promise<SmsSendResult> {
    this.logger.log(`\n========================================\n[SMS MOCK] To: ${to}\nMessage: ${message}\n========================================\n`);
    return {
      success: true,
      messageId: `mock-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    };
  }
}
