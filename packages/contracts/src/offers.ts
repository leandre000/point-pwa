import { z } from 'zod';
import { OfferStatus, MatchStatus, VerificationLevel } from './enums.js';

// ─── Create Offer Schema ───
export const CreateOfferSchema = z.object({
  jobId: z.string().uuid(),
  priceAmount: z.number().int().positive({ message: 'Price must be a positive integer in minor units' }),
  priceCurrency: z.string().length(3).default('RWF'),
  message: z.string().max(1000).optional(),
  availability: z.string().max(200).optional(),
});
export type CreateOfferInput = z.infer<typeof CreateOfferSchema>;

// ─── Counter Offer Schema ───
export const CounterOfferSchema = z.object({
  priceAmount: z.number().int().positive({ message: 'Counter price must be a positive integer in minor units' }),
  priceCurrency: z.string().length(3).default('RWF'),
  message: z.string().max(1000).optional(),
});
export type CounterOfferInput = z.infer<typeof CounterOfferSchema>;

// ─── Immutable Offer Version ───
export const OfferVersionSchema = z.object({
  id: z.string().uuid(),
  authorRole: z.enum(['PROVIDER', 'CUSTOMER']),
  priceAmount: z.number().int(),
  priceCurrency: z.string().default('RWF'),
  message: z.string().nullable().optional(),
  createdAt: z.string().datetime(),
});
export type OfferVersion = z.infer<typeof OfferVersionSchema>;

// ─── Public Offer Response ───
export const OfferResponseSchema = z.object({
  id: z.string().uuid(),
  jobId: z.string().uuid(),
  providerId: z.string().uuid(),
  businessName: z.string(),
  providerRating: z.number().nullable().optional(),
  ratingCount: z.number().int(),
  completedJobs: z.number().int(),
  verificationLevel: z.nativeEnum(VerificationLevel),
  areaName: z.string(),
  distanceBand: z.string().optional(),
  price: z.object({
    amount: z.number().int(),
    currency: z.string(),
  }),
  status: z.nativeEnum(OfferStatus),
  message: z.string().nullable().optional(),
  availability: z.string().nullable().optional(),
  version: z.number().int(),
  versions: z.array(OfferVersionSchema).optional(),
  canAccept: z.boolean(),
  canCounter: z.boolean(),
  createdAt: z.string().datetime(),
});
export type OfferResponse = z.infer<typeof OfferResponseSchema>;

// ─── Match Response (Snapshotted Terms) ───
export const MatchResponseSchema = z.object({
  id: z.string().uuid(),
  jobId: z.string().uuid(),
  offerId: z.string().uuid(),
  status: z.nativeEnum(MatchStatus),
  agreedPrice: z.object({
    amount: z.number().int(),
    currency: z.string(),
  }),
  agreedTerms: z.string().nullable().optional(),
  provider: z.object({
    id: z.string().uuid(),
    businessName: z.string(),
    verificationLevel: z.nativeEnum(VerificationLevel),
  }),
  customer: z.object({
    id: z.string().uuid(),
    displayName: z.string(),
  }),
  acceptedAt: z.string().datetime(),
});
export type MatchResponse = z.infer<typeof MatchResponseSchema>;
