export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
  templateName: string;
  userId?: string;
  replyTo?: string;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailTransport {
  readonly name: string;
  sendMail(options: SendEmailOptions): Promise<EmailSendResult>;
  verify(): Promise<boolean>;
}

export const EMAIL_TRANSPORT = 'EMAIL_TRANSPORT';

