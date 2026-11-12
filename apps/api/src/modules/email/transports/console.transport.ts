import { Injectable, Logger } from '@nestjs/common';
import type { EmailTransport, SendEmailOptions, EmailSendResult } from '../email.interface.js';

@Injectable()
export class ConsoleTransport implements EmailTransport {
  public readonly name = 'console';
  private readonly logger = new Logger(ConsoleTransport.name);

  async sendMail(options: SendEmailOptions): Promise<EmailSendResult> {
    const masked = options.to.replace(/^(.)(.*)(@.*)$/, (_, a, b, c) => `${a}***${c}`);
    this.logger.log(`[CONSOLE EMAIL] To: ${masked} | Subject: "${options.subject}" | Template: ${options.templateName}`);
    return {
      success: true,
      messageId: `console-${Date.now()}`,
    };
  }

  async verify(): Promise<boolean> {
    return true;
  }
}

