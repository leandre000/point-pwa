import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { EmailTransport, SendEmailOptions, EmailSendResult } from '../email.interface.js';

@Injectable()
export class SmtpTransport implements EmailTransport {
  public readonly name = 'smtp';
  private readonly logger = new Logger(SmtpTransport.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly defaultFrom: string;

  constructor() {
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.SMTP_PORT || '465', 10);
    const secure = process.env.SMTP_SECURE === 'true' || (process.env.SMTP_SECURE !== 'false' && port === 465);
    const user = (process.env.SMTP_USER || '').trim().replace(/["']/g, '');
    const rawPass = (process.env.SMTP_PASS || '').trim().replace(/["']/g, '');
    // Google App Passwords often contain spaces when copied (e.g. 'abcd efgh ijkl mnop')
    const pass = rawPass.replace(/\s+/g, '');
    this.defaultFrom = process.env.MAIL_FROM || `KIRAKA <${user || 'support@kiraka.rw'}>`;

    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
      });
      this.logger.log(`Initialized SmtpTransport (${host}:${port}, user: ${user})`);
    } else {
      this.logger.warn('SMTP_USER or SMTP_PASS not set. SmtpTransport will operate in mock mode.');
    }
  }

  async sendMail(options: SendEmailOptions): Promise<EmailSendResult> {
    if (!this.transporter) {
      this.logger.log(`[SMTP MOCK] To: ${options.to} | Subject: ${options.subject}`);
      return {
        success: true,
        messageId: `mock-msg-${Date.now()}`,
      };
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.defaultFrom,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo || process.env.MAIL_REPLY_TO,
      });

      this.logger.log(`Email delivered to ${options.to} (MessageId: ${info.messageId})`);
      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (err: any) {
      this.logger.error(`SMTP delivery failed for ${options.to}: ${err.message}`, err.stack);
      return {
        success: false,
        error: err.message,
      };
    }
  }

  async verify(): Promise<boolean> {
    if (!this.transporter) return false;
    try {
      await this.transporter.verify();
      return true;
    } catch {
      return false;
    }
  }
}

