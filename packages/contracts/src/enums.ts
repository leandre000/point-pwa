// ─── Job Status (SRS §6.1) ───
export const JobStatus = {
  DRAFT: 'DRAFT',
  OPEN: 'OPEN',
  MATCHED: 'MATCHED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETION_REPORTED: 'COMPLETION_REPORTED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
  CLOSED: 'CLOSED',
  DISPUTED: 'DISPUTED',
} as const;
export type JobStatus = (typeof JobStatus)[keyof typeof JobStatus];

// ─── Offer Status (SRS §6.2) ───
export const OfferStatus = {
  SUBMITTED: 'SUBMITTED',
  COUNTERED: 'COUNTERED',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  WITHDRAWN: 'WITHDRAWN',
  EXPIRED: 'EXPIRED',
} as const;
export type OfferStatus = (typeof OfferStatus)[keyof typeof OfferStatus];

// ─── Match Status (SRS §6.3) ───
export const MatchStatus = {
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  DISPUTED: 'DISPUTED',
} as const;
export type MatchStatus = (typeof MatchStatus)[keyof typeof MatchStatus];

// ─── User Role ───
export const UserRole = {
  USER: 'USER',
  ADMIN: 'ADMIN',
  MODERATOR: 'MODERATOR',
  SUPPORT: 'SUPPORT',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

// ─── Verification Level (SRS §12) ───
export const VerificationLevel = {
  NONE: 'NONE',
  PHONE_VERIFIED: 'PHONE_VERIFIED',
  IDENTITY_CHECKED: 'IDENTITY_CHECKED',
  BUSINESS_CHECKED: 'BUSINESS_CHECKED',
  QUALIFICATION_VERIFIED: 'QUALIFICATION_VERIFIED',
} as const;
export type VerificationLevel = (typeof VerificationLevel)[keyof typeof VerificationLevel];

// ─── Notification Type ───
export const NotificationType = {
  NEW_OFFER: 'NEW_OFFER',
  COUNTER_OFFER: 'COUNTER_OFFER',
  OFFER_ACCEPTED: 'OFFER_ACCEPTED',
  OFFER_REJECTED: 'OFFER_REJECTED',
  OFFER_WITHDRAWN: 'OFFER_WITHDRAWN',
  OFFER_EXPIRED: 'OFFER_EXPIRED',
  MATCH_CREATED: 'MATCH_CREATED',
  MATCH_CANCELLED: 'MATCH_CANCELLED',
  NEW_MESSAGE: 'NEW_MESSAGE',
  COMPLETION_REPORTED: 'COMPLETION_REPORTED',
  COMPLETION_CONFIRMED: 'COMPLETION_CONFIRMED',
  DISPUTE_OPENED: 'DISPUTE_OPENED',
  DISPUTE_RESOLVED: 'DISPUTE_RESOLVED',
  NEW_REVIEW: 'NEW_REVIEW',
  REPORT_RECEIVED: 'REPORT_RECEIVED',
  JOB_EXPIRED: 'JOB_EXPIRED',
  REMINDER: 'REMINDER',
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

// ─── Report Reason ───
export const ReportReason = {
  SPAM: 'SPAM',
  INAPPROPRIATE_CONTENT: 'INAPPROPRIATE_CONTENT',
  HARASSMENT: 'HARASSMENT',
  FRAUD: 'FRAUD',
  SAFETY_CONCERN: 'SAFETY_CONCERN',
  FAKE_PROFILE: 'FAKE_PROFILE',
  OTHER: 'OTHER',
} as const;
export type ReportReason = (typeof ReportReason)[keyof typeof ReportReason];
