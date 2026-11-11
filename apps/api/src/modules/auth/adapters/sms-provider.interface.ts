export interface SendSmsOptions {
  to: string; // E.164 formatted phone number (e.g. +250781234567)
  message: string;
}

export interface SmsSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface SmsProvider {
  name: string;
  sendSms(options: SendSmsOptions): Promise<SmsSendResult>;
}

export const SMS_PROVIDER = Symbol('SMS_PROVIDER');

