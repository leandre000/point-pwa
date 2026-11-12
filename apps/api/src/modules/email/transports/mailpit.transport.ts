import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { EmailTransport, SendEmailOptions, EmailSendResult } from '../email.interface.js';

@Injectable()
export class MailpitTransport implements EmailTransport {
  public readonly name = 'mailpit';
  private readonly logger = new Logger(MailpitTransport.name);
  private transporter: nodemailer.Transporter;
  private readonly defaultFrom: string;

  constructor() {
    const host = process.env.MAILPIT_HOST || 'localhost';
    const port = parseInt(process.env.MAILPIT_PORT || '1025', 10);
    this.defaultFrom = process.env.MAIL_FROM || 'KIRAKA <noreply@kiraka.rw>';

    this.transporter = nodemailer.createTransport({
      host,
      port,
      ignoreTLS: true,
    });
    this.logger.log(`Initialized MailpitTransport (${host}:${port})`);
  }

  async sendMail(options: SendEmailOptions): Promise<EmailSendResult> {
    try {
      const info = await this.transporter.sendMail({
        from: this.defaultFrom,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo,
      });

      this.logger.log(`Email captured by Mailpit for ${options.to} (Id: ${info.messageId})`);
      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (err: any) {
      this.logger.warn(`Mailpit not reachable: ${err.message}. Logging locally.`);
      return {
        success: true,
        messageId: `mailpit-fallback-${Date.now()}`,
      };
    }
  }

  async verify(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch {
      return false;
    }
  }
}

