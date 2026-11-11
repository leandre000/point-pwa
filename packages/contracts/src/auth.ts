import { z } from 'zod';
import { LocaleSchema } from './common.js';
import { VerificationLevel, UserRole } from './enums.js';

// ─── Phone number (E.164 format) ───
export const PhoneNumberSchema = z
  .string()
  .regex(/^\+[1-9]\d{6,14}$/, 'Phone number must be in E.164 format (e.g. +250781234567)');

// ─── OTP Request ───
export const OtpRequestSchema = z.object({
  phone: PhoneNumberSchema,
  deviceId: z.string().min(1).optional(),
});
export type OtpRequest = z.infer<typeof OtpRequestSchema>;

export const OtpRequestResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  cooldownSeconds: z.number().int(),
  expiresInSeconds: z.number().int(),
  /** Only populated in development/test environments when SMS_PROVIDER=mock */
  mockCode: z.string().optional(),
});
export type OtpRequestResponse = z.infer<typeof OtpRequestResponseSchema>;

// ─── OTP Verify ───
export const OtpVerifySchema = z.object({
  phone: PhoneNumberSchema,
  code: z
    .string()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only digits'),
  deviceId: z.string().min(1).optional(),
});
export type OtpVerify = z.infer<typeof OtpVerifySchema>;

// ─── User Profile Models ───
export const CustomerProfileSchema = z.object({
  id: z.string().uuid(),
  displayName: z.string().min(2).max(100),
  neighborhood: z.string().max(100).nullable(),
  avatarUrl: z.string().url().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type CustomerProfile = z.infer<typeof CustomerProfileSchema>;

export const UpdateCustomerProfileSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
  neighborhood: z.string().max(100).trim().optional(),
});
export type UpdateCustomerProfileInput = z.infer<typeof UpdateCustomerProfileSchema>;

export const ProviderProfileSchema = z.object({
  id: z.string().uuid(),
  businessName: z.string().min(2).max(100),
  bio: z.string().max(1000).nullable().optional(),
  verificationLevel: z.nativeEnum(VerificationLevel),
  isVisible: z.boolean(),
  completedJobs: z.number().int(),
  ratingAverage: z.number().int().nullable().optional(),
  ratingCount: z.number().int(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type ProviderProfile = z.infer<typeof ProviderProfileSchema>;

export const UpdateProviderProfileSchema = z.object({
  businessName: z.string().min(2, 'Business or display name required').max(100).trim(),
  bio: z.string().max(1000).trim().optional(),
  isVisible: z.boolean().optional(),
});
export type UpdateProviderProfileInput = z.infer<typeof UpdateProviderProfileSchema>;

// ─── Current Authenticated User (Me) ───
export const MeResponseSchema = z.object({
  id: z.string().uuid(),
  phone: z.string(),
  phoneVerified: z.boolean(),
  role: z.nativeEnum(UserRole),
  countryCode: z.string(),
  locale: LocaleSchema,
  customerProfile: CustomerProfileSchema.nullable(),
  providerProfile: ProviderProfileSchema.nullable(),
  hasCompletedOnboarding: z.boolean(),
});
export type MeResponse = z.infer<typeof MeResponseSchema>;

// ─── Active User Session ───
export const UserSessionSchema = z.object({
  id: z.string().uuid(),
  userAgent: z.string().nullable(),
  ipAddress: z.string().nullable(),
  isCurrent: z.boolean(),
  createdAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
});
export type UserSession = z.infer<typeof UserSessionSchema>;

// ─── Initial Registration / Onboarding ───
export const OnboardingSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
  neighborhood: z.string().min(2, 'Please select your Kigali neighborhood').max(100),
  locale: LocaleSchema.default('en'),
  initialMode: z.enum(['help', 'work']).default('help'),
  providerCategory: z.string().optional(),
});
export type OnboardingInput = z.infer<typeof OnboardingSchema>;
