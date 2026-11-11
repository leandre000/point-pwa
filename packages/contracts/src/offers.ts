import { z } from 'zod';
import { MoneySchema } from './common.js';

// ─── Create Offer ───
export const CreateOfferSchema = z.object({
  jobId: z.string().uuid(),
  price: MoneySchema,
  message: z.string().max(1000).optional(),
  availability: z.string().max(200).optional(),
});
export type CreateOfferInput = z.infer<typeof CreateOfferSchema>;

// ─── Counter Offer ───
export const CounterOfferSchema = z.object({
  price: MoneySchema,
  message: z.string().max(1000).optional(),
});
export type CounterOfferInput = z.infer<typeof CounterOfferSchema>;

