import { z } from 'zod';
import { DisputeReason, DisputeStatus } from './enums.js';

// ─── Report Completion Schema (Provider) ───
export const ReportCompletionSchema = z.object({
  notes: z.string().max(1000, 'Completion notes cannot exceed 1000 characters').optional(),
  photoUrl: z.string().url('Invalid photo URL').optional(),
});
export type ReportCompletionInput = z.infer<typeof ReportCompletionSchema>;

// ─── Confirm Completion Schema (Customer) ───
export const ConfirmCompletionSchema = z.object({
  feedback: z.string().max(1000).optional(),
});
export type ConfirmCompletionInput = z.infer<typeof ConfirmCompletionSchema>;

// ─── Raise Dispute Schema (Customer or Provider) ───
export const CreateDisputeSchema = z.object({
  reason: z.nativeEnum(DisputeReason),
  description: z
    .string()
    .min(10, 'Please describe the issue with at least 10 characters')
    .max(2000, 'Dispute description cannot exceed 2000 characters')
    .trim(),
  evidenceUrls: z.array(z.string().url()).max(5).optional().default([]),
});
export type CreateDisputeInput = z.infer<typeof CreateDisputeSchema>;

export const DisputeResponseSchema = z.object({
  id: z.string().uuid(),
  matchId: z.string().uuid(),
  raisedById: z.string().uuid(),
  reason: z.nativeEnum(DisputeReason),
  description: z.string(),
  status: z.nativeEnum(DisputeStatus),
  resolution: z.string().nullable().optional(),
  resolvedAt: z.string().datetime().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type DisputeResponse = z.infer<typeof DisputeResponseSchema>;

// ─── Review Schema (Mutual after confirmed completion) ───
// Non-negotiable Rule #5: Reviews ONLY after confirmed completion.
export const CreateReviewSchema = z.object({
  rating: z
    .number()
    .int()
    .min(1, 'Rating must be at least 1 star')
    .max(5, 'Rating cannot exceed 5 stars'),
  tags: z.array(z.string().max(30)).max(5).optional().default([]),
  comment: z
    .string()
    .max(500, 'Comment cannot exceed 500 characters')
    .trim()
    .optional(),
});
export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;

export const ReviewResponseSchema = z.object({
  id: z.string().uuid(),
  matchId: z.string().uuid(),
  authorId: z.string().uuid(),
  authorName: z.string(),
  targetId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  tags: z.array(z.string()),
  comment: z.string().nullable().optional(),
  createdAt: z.string().datetime(),
});
export type ReviewResponse = z.infer<typeof ReviewResponseSchema>;

