import { Module, Global } from '@nestjs/common';
import { EmailService } from './email.service.js';
import { EMAIL_TRANSPORT } from './email.interface.js';
import { SmtpTransport } from './transports/smtp.transport.js';
import { MailpitTransport } from './transports/mailpit.transport.js';
import { ConsoleTransport } from './transports/console.transport.js';

@Global()
@Module({
  providers: [
    SmtpTransport,
    MailpitTransport,
    ConsoleTransport,
    {
      provide: EMAIL_TRANSPORT,
      useFactory: (
        smtp: SmtpTransport,
        mailpit: MailpitTransport,
        consoleTransport: ConsoleTransport,
      ) => {
        const transportType = (process.env.MAIL_TRANSPORT || '').toLowerCase();
        if (transportType === 'mailpit') {
          return mailpit;
        }
        if (transportType === 'console' || process.env.NODE_ENV === 'test') {
          return consoleTransport;
        }
        return smtp;
      },
      inject: [SmtpTransport, MailpitTransport, ConsoleTransport],
    },
    EmailService,
  ],
  exports: [EmailService, EMAIL_TRANSPORT],
})
export class EmailModule {}

