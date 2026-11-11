import { z } from 'zod';

// ─── Phone number (E.164 format) ───
export const PhoneNumberSchema = z
  .string()
  .regex(/^\+[1-9]\d{6,14}$/, 'Phone number must be in E.164 format (e.g. +250781234567)');

// ─── OTP Request ───
export const OtpRequestSchema = z.object({
  phone: PhoneNumberSchema,
});
export type OtpRequest = z.infer<typeof OtpRequestSchema>;

// ─── OTP Verify ───
export const OtpVerifySchema = z.object({
  phone: PhoneNumberSchema,
  code: z
    .string()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only digits'),
});
export type OtpVerify = z.infer<typeof OtpVerifySchema>;

// ─── Registration (after OTP) ───
export const RegisterSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters')
    .trim(),
  neighborhood: z.string().min(1, 'Please select a neighborhood').optional(),
  locale: z.enum(['en', 'rw', 'fr']).default('en'),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

