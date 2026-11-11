import { z } from 'zod';

// ─── Money ───
// Money is always stored as integer minor units with a currency code.
// For RWF the minor unit equals the whole franc (no subunits).
export const MoneySchema = z.object({
  /** Integer amount in minor units */
  amount: z.number().int({ message: 'Money must be an integer (minor units)' }),
  /** ISO 4217 currency code */
  currency: z.string().length(3),
});
export type Money = z.infer<typeof MoneySchema>;

// ─── Pagination ───
export const PaginationParamsSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
});
export type PaginationParams = z.infer<typeof PaginationParamsSchema>;

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    nextCursor: z.string().nullable(),
    total: z.number().int().optional(),
  });

// ─── API Error ───
export const ApiErrorSchema = z.object({
  statusCode: z.number().int(),
  error: z.string(),
  message: z.string(),
  details: z.record(z.unknown()).optional(),
  requestId: z.string().optional(),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;

// ─── Country and Locale ───
export const CountryCodeSchema = z.string().length(2); // ISO 3166-1 alpha-2
export const LocaleSchema = z.enum(['en', 'rw', 'fr']);
export type Locale = z.infer<typeof LocaleSchema>;
