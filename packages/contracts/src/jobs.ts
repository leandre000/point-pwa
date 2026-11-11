import { z } from 'zod';
import { MoneySchema } from './common.js';

// ─── Create Job ───
export const CreateJobSchema = z.object({
  categoryId: z.string().uuid(),
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title must be at most 200 characters')
    .trim(),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description must be at most 2000 characters')
    .trim(),
  areaId: z.string().uuid(),
  timing: z.string().max(200).optional(),
  budget: MoneySchema.optional(),
  budgetNegotiable: z.boolean().default(true),
});
export type CreateJobInput = z.infer<typeof CreateJobSchema>;

// ─── Update Job ───
export const UpdateJobSchema = CreateJobSchema.partial();
export type UpdateJobInput = z.infer<typeof UpdateJobSchema>;
