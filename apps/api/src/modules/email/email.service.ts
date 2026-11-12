import { Injectable, Logger, Inject } from '@nestjs/common';
import {
  EMAIL_TRANSPORT,
  type EmailTransport,
  type SendEmailOptions,
  type EmailSendResult,
} from './email.interface.js';
import {
  renderOtpEmail,
  renderWelcomeEmail,
  renderNewOfferEmail,
  renderMatchConfirmedEmail,
  renderCompletionConfirmedEmail,
  type NewOfferTemplateOptions,
  type MatchConfirmedTemplateOptions,
  type CompletionConfirmedTemplateOptions,
} from './templates/index.js';
import { PrismaService } from '../../database/prisma.service.js';

export interface EmailLogEntry {
  id: string;
  template: string;
  maskedRecipient: string;
  status: 'QUEUED' | 'SENT' | 'FAILED';
  providerMessageId?: string;
  errorSummary?: string;
  createdAt: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  // Daily send counter (Section 6.3: daily send counter with alert at 80% of cap)
  private readonly DAILY_SEND_CAP = parseInt(process.env.DAILY_EMAIL_CAP || '400', 10);
  private dailySendsCount = 0;
  private dailyCounterResetDate = new Date().toDateString();

  // In-memory fallback log store for resilience when DB is deferred
  private readonly inMemoryEmailLogs: EmailLogEntry[] = [];

  constructor(
    @Inject(EMAIL_TRANSPORT)
    private readonly transport: EmailTransport,
    private readonly prisma: PrismaService,
  ) {
    this.logger.log(`EmailService running with transport: [${transport.name}]`);
  }

  private checkAndIncrementDailyCap(): boolean {
    const today = new Date().toDateString();
    if (today !== this.dailyCounterResetDate) {
      this.dailyCounterResetDate = today;
      this.dailySendsCount = 0;
    }

    if (this.dailySendsCount >= this.DAILY_SEND_CAP) {
      this.logger.error(`Daily email sending cap (${this.DAILY_SEND_CAP}) reached! Blocking further email dispatch.`);
      return false;
    }

    this.dailySendsCount++;

    const alertThreshold = Math.floor(this.DAILY_SEND_CAP * 0.8);
    if (this.dailySendsCount === alertThreshold) {
      this.logger.warn(`Daily email usage has reached 80% (${this.dailySendsCount}/${this.DAILY_SEND_CAP})!`);
    }

    return true;
  }

  private maskEmail(email: string): string {
    const parts = email.split('@');
    if (parts.length !== 2) return '***@***';
    const name = parts[0]!;
    const domain = parts[1]!;
    const maskedName = name.length > 2 ? `${name[0]}***${name[name.length - 1]}` : `${name[0]}***`;
    return `${maskedName}@${domain}`;
  }

  private async logEmailAttempt(
    template: string,
    recipient: string,
    status: 'QUEUED' | 'SENT' | 'FAILED',
    providerMessageId?: string,
    errorSummary?: string,
    userId?: string,
  ): Promise<void> {
    const maskedRecipient = this.maskEmail(recipient);
    const entry: EmailLogEntry = {
      id: `elog-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      template,
      maskedRecipient,
      status,
      providerMessageId,
      errorSummary,
      createdAt: new Date().toISOString(),
    };

    this.inMemoryEmailLogs.unshift(entry);
    if (this.inMemoryEmailLogs.length > 500) {
      this.inMemoryEmailLogs.pop();
    }

    // Try logging to PostgreSQL if Prisma is reachable
    try {
      await (this.prisma as any).emailLog?.create({
        data: {
          userId,
          template,
          maskedRecipient,
          status,
          providerMessageId,
          errorSummary,
        },
      });
    } catch {
      // Prisma deferred or table not migrated yet; in-memory log active
    }
  }

  /**
   * Internal dispatcher that executes sending via transport
   */
  async dispatch(options: SendEmailOptions): Promise<EmailSendResult> {
    if (!this.checkAndIncrementDailyCap()) {
      await this.logEmailAttempt(
        options.templateName,
        options.to,
        'FAILED',
        undefined,
        'Daily email sending cap exceeded',
        options.userId,
      );
      return { success: false, error: 'Daily email cap exceeded' };
    }

    const result = await this.transport.sendMail(options);

    await this.logEmailAttempt(
      options.templateName,
      options.to,
      result.success ? 'SENT' : 'FAILED',
      result.messageId,
      result.error,
      options.userId,
    );

    return result;
  }

  /**
   * Section 1.4 & 1.6: Security notifications (password changed, new login, email changed)
   */
  async sendSecurityNoticeEmail(
    to: string,
    subject: string,
    message: string,
    userId?: string,
  ): Promise<EmailSendResult> {
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; color: #1E2421;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; border-radius: 10px; background: #205641; color: #fff; font-size: 20px; font-weight: bold;">K</div>
        </div>
        <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 12px;">${subject}</h2>
        <p style="font-size: 14px; line-height: 1.5; color: #404A44; margin-bottom: 24px;">${message}</p>
        <p style="font-size: 12px; color: #738077; border-top: 1px solid #E4E4DE; padding-top: 16px;">
          If you did not authorize this action, please contact KIRAKA Security immediately at support@kiraka.rw.
        </p>
      </div>
    `;

    return this.dispatch({
      to,
      subject: `KIRAKA Security: ${subject}`,
      html,
      text: `${subject}\n\n${message}\n\nIf you did not make this change, please contact support@kiraka.rw.`,
      templateName: 'SECURITY_NOTICE',
      userId,
    });
  }

  /**
   * Send a 6-digit OTP verification code by email
   */
  async sendOtpEmail(email: string, code: string): Promise<EmailSendResult> {
    const { subject, html, text } = renderOtpEmail({
      code,
      recipient: email,
      expiresInMinutes: 10,
    });

    return this.dispatch({
      to: email,
      subject,
      html,
      text,
      templateName: 'OTP_VERIFICATION',
    });
  }

  /**
   * Send welcome email after new neighbor onboarding
   */
  async sendWelcomeEmail(email: string, displayName: string, neighborhood: string): Promise<EmailSendResult> {
    const { subject, html, text } = renderWelcomeEmail({
      displayName,
      neighborhood,
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    });

    return this.dispatch({
      to: email,
      subject,
      html,
      text,
      templateName: 'WELCOME_ONBOARDING',
    });
  }

  /**
   * Send new offer alert email to job owner
   */
  async sendNewOfferEmail(email: string, options: Omit<NewOfferTemplateOptions, 'jobUrl'> & { jobId: string }): Promise<EmailSendResult> {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const jobUrl = `${appUrl}/jobs/${options.jobId}`;

    const { subject, html, text } = renderNewOfferEmail({
      ...options,
      jobUrl,
    });

    return this.dispatch({
      to: email,
      subject,
      html,
      text,
      templateName: 'NEW_OFFER',
    });
  }

  /**
   * Send match confirmation email to either customer or provider
   */
  async sendMatchConfirmedEmail(
    email: string,
    options: Omit<MatchConfirmedTemplateOptions, 'chatUrl'> & { matchId: string },
  ): Promise<EmailSendResult> {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const chatUrl = `${appUrl}/messages/${options.matchId}`;

    const { subject, html, text } = renderMatchConfirmedEmail({
      ...options,
      chatUrl,
    });

    return this.dispatch({
      to: email,
      subject,
      html,
      text,
      templateName: 'MATCH_CONFIRMED',
    });
  }

  /**
   * Send completion confirmed review prompt email
   */
  async sendCompletionConfirmedEmail(
    email: string,
    options: Omit<CompletionConfirmedTemplateOptions, 'reviewUrl'> & { matchId: string },
  ): Promise<EmailSendResult> {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const reviewUrl = `${appUrl}/messages/${options.matchId}?action=review`;

    const { subject, html, text } = renderCompletionConfirmedEmail({
      ...options,
      reviewUrl,
    });

    return this.dispatch({
      to: email,
      subject,
      html,
      text,
      templateName: 'COMPLETION_CONFIRMED',
    });
  }

  /**
   * Send a test email from the Admin Operations Console to verify SMTP transport connectivity
   */
  async sendTestEmail(to: string): Promise<EmailSendResult> {
    const timestamp = new Date().toISOString();
    return this.dispatch({
      to,
      subject: 'KIRAKA Kigali — SMTP Connectivity Test',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; color: #1c1917; max-width: 560px; margin: 0 auto; border: 1px solid #e7e5e4; border-radius: 12px; background: #fafaf9;">
          <h2 style="color: #0d9488; margin-top: 0;">KIRAKA SMTP Integration Test</h2>
          <p style="font-size: 14px; line-height: 1.5; color: #44403c;">This is an administrative test email confirming that your email transport is correctly configured and delivering outbound messages for the Kigali marketplace.</p>
          <div style="background: #ffffff; padding: 12px 16px; border-radius: 8px; border: 1px solid #e7e5e4; margin: 16px 0; font-size: 13px;">
            <p style="margin: 4px 0;"><strong>Transport:</strong> ${this.transport.name}</p>
            <p style="margin: 4px 0;"><strong>Recipient:</strong> ${this.maskEmail(to)}</p>
            <p style="margin: 4px 0;"><strong>Timestamp:</strong> ${timestamp}</p>
          </div>
          <p style="font-size: 12px; color: #78716c; margin-bottom: 0;">KIRAKA Kigali Operations Console</p>
        </div>
      `,
      text: `KIRAKA SMTP Integration Test\n\nThis is an administrative test email confirming that your email transport (${this.transport.name}) is operational.\nTimestamp: ${timestamp}`,
      templateName: 'ADMIN_TEST',
    });
  }

  /**
   * List recent email logs for Admin Console (Audit & Telemetry)
   */
  getRecentLogs(limit = 50): EmailLogEntry[] {
    return this.inMemoryEmailLogs.slice(0, limit);
  }

  /**
   * Health & diagnostics check
   */
  async getHealthStatus() {
    const isVerified = await this.transport.verify();
    return {
      transport: this.transport.name,
      verified: isVerified,
      dailySendsCount: this.dailySendsCount,
      dailySendCap: this.DAILY_SEND_CAP,
      remainingSends: Math.max(0, this.DAILY_SEND_CAP - this.dailySendsCount),
      totalRecentLogs: this.inMemoryEmailLogs.length,
    };
  }
}

