import { z } from 'zod';
import { LocaleSchema } from './common.js';
import { VerificationLevel, UserRole } from './enums.js';

// ─── User Status Enum (D-015, D-017) ───
export enum UserStatus {
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  PENDING_PASSWORD = 'PENDING_PASSWORD',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  DEACTIVATED = 'DEACTIVATED',
}

// ─── Verification Purpose (D-017) ───
export enum VerificationPurpose {
  SIGNUP_VERIFY = 'SIGNUP_VERIFY',
  PASSWORD_RESET = 'PASSWORD_RESET',
}

// ─── Optional Rwanda Phone Helper (Profile / Personal details only, D-018) ───
export function normalizeRwandaPhone(raw: string): { valid: boolean; normalized: string; error?: string | undefined } {
  const cleaned = raw.replace(/[\s\-\(\)]/g, '');
  if (/^07[2389]\d{7}$/.test(cleaned)) {
    return { valid: true, normalized: `+250${cleaned.slice(1)}` };
  }
  if (/^7[2389]\d{7}$/.test(cleaned)) {
    return { valid: true, normalized: `+250${cleaned}` };
  }
  if (/^\+2507[2389]\d{7}$/.test(cleaned)) {
    return { valid: true, normalized: cleaned };
  }
  if (/^2507[2389]\d{7}$/.test(cleaned)) {
    return { valid: true, normalized: `+${cleaned}` };
  }
  return {
    valid: false,
    normalized: cleaned,
    error: 'Please enter a valid Rwandan mobile number (MTN 078/079 or Airtel 072/073).',
  };
}

// ─── 1.2 Sign Up (Email) — Screen 1: Create Account ───
export const RegisterRequestSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .max(255)
    .transform((val) => val.toLowerCase().trim()),
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be at most 100 characters')
    .trim(),
  consent: z.literal(true, {
    errorMap: () => ({ message: 'You must consent to the Terms of Service and Privacy Policy' }),
  }),
  turnstileToken: z.string().optional(),
});
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

// ─── 1.2 Sign Up — Screen 2: Verify Email OTP ───
export const VerifySignupOtpSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .transform((val) => val.toLowerCase().trim()),
  code: z
    .string()
    .length(6, 'Verification code must be exactly 6 digits')
    .regex(/^\d{6}$/, 'Code must contain only digits'),
});
export type VerifySignupOtpInput = z.infer<typeof VerifySignupOtpSchema>;

// ─── 1.2 Sign Up — Screen 3: Create Password ───
export const CreatePasswordSchema = z.object({
  setupToken: z.string().min(1, 'Setup token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password cannot exceed 128 characters'),
});
export type CreatePasswordInput = z.infer<typeof CreatePasswordSchema>;

// ─── 1.3 Sign In — Email & Password Only (NO OTP AT LOGIN) ───
export const SignInRequestSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .transform((val) => val.toLowerCase().trim()),
  password: z.string().min(1, 'Password is required'),
  turnstileToken: z.string().optional(),
});
export type SignInRequest = z.infer<typeof SignInRequestSchema>;

// ─── 1.4 Forgot Password Request (OTP to Email) ───
export const ForgotPasswordRequestSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .transform((val) => val.toLowerCase().trim()),
  turnstileToken: z.string().optional(),
});
export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordRequestSchema>;

// ─── 1.4 Reset Password (Verify OTP + Set New Password) ───
export const ResetPasswordSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .transform((val) => val.toLowerCase().trim()),
  code: z
    .string()
    .length(6, 'Verification code must be exactly 6 digits')
    .regex(/^\d{6}$/, 'Code must contain only digits'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password cannot exceed 128 characters'),
});
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

// ─── Generic OTP Response (Anti-Enumeration Safe) ───
export const OtpRequestResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  cooldownSeconds: z.number().int(),
  expiresInSeconds: z.number().int(),
  maskedTarget: z.string().optional(),
});
export type OtpRequestResponse = z.infer<typeof OtpRequestResponseSchema>;

// ─── Onboarding Input (Post-Registration Profile Setup) ───
export const OnboardingSchema = z.object({
  displayName: z.string().min(2).max(100).optional(),
  neighborhood: z.string().min(1, 'Please select your launch neighborhood').max(100),
  intent: z.enum(['help', 'work']).optional().default('help'),
  initialMode: z.enum(['help', 'work']).optional().default('help'),
  avatarUrl: z.string().url().optional(),
  locale: LocaleSchema.optional(),
});
export type OnboardingInput = z.infer<typeof OnboardingSchema>;

// ─── User Profile Models ───
export const CustomerProfileSchema = z.object({
  id: z.string(),
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
  phone: z.string().optional().nullable(),
  bio: z.string().max(200).optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
});
export type UpdateCustomerProfileInput = z.infer<typeof UpdateCustomerProfileSchema>;

export const ProviderProfileSchema = z.object({
  id: z.string(),
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
  skills: z.array(z.string().min(2).max(30)).max(10).optional(),
  areaIds: z.array(z.string()).optional(),
  categoryIds: z.array(z.string()).optional(),
});
export type UpdateProviderProfileInput = z.infer<typeof UpdateProviderProfileSchema>;

// ─── Current Authenticated User (Me) ───
export const MeResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
  emailVerified: z.boolean(),
  fullName: z.string(),
  phone: z.string().nullable().optional(),
  role: z.nativeEnum(UserRole),
  status: z.nativeEnum(UserStatus).optional(),
  countryCode: z.string(),
  locale: LocaleSchema,
  hasGoogleLinked: z.boolean().optional(),
  customerProfile: CustomerProfileSchema.nullable(),
  providerProfile: ProviderProfileSchema.nullable(),
  hasCompletedOnboarding: z.boolean(),
});
export type MeResponse = z.infer<typeof MeResponseSchema>;

// ─── Active User Session ───
export const UserSessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  deviceLabel: z.string().nullable().optional(),
  userAgent: z.string().nullable().optional(),
  ipAddress: z.string().nullable().optional(),
  lastUsedAt: z.string().datetime(),
  isCurrent: z.boolean().optional(),
  expiresAt: z.string().datetime(),
  createdAt: z.string().datetime(),
});
export type UserSession = z.infer<typeof UserSessionSchema>;
