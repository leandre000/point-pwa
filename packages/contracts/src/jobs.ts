import { z } from 'zod';
import { MoneySchema, PaginationParamsSchema } from './common.js';
import { JobStatus } from './enums.js';

// ─── Create Job Schema (Prompt v5 Section 5.2) ───
export const CreateJobSchema = z.object({
  categoryId: z.string().min(1, { message: 'Please select a valid service category' }),
  areaId: z.string().min(1, { message: 'Please select your Kigali neighborhood' }),
  title: z
    .string()
    .min(2, 'Please enter a task title')
    .max(120, 'Title cannot exceed 120 characters')
    .trim(),
  description: z
    .string()
    .min(2, 'Please enter task details')
    .max(2000, 'Description cannot exceed 2000 characters')
    .trim(),
  addressNotes: z.string().max(200, 'Address notes cannot exceed 200 characters').optional().nullable(),
  budgetAmount: z
    .number()
    .int('Budget must be an integer')
    .min(0, 'Budget must be positive')
    .max(50000000, 'Maximum budget is 50,000,000 RWF')
    .optional()
    .nullable(),
  budgetCurrency: z.string().length(3).default('RWF'),
  budgetNegotiable: z.boolean().default(true),
  timingPreference: z.string().max(200).optional().nullable(),
  startsAt: z.string().datetime().optional().nullable(),
  windowType: z.enum(['asap', 'morning', 'afternoon', 'evening', 'exact', 'flexible']).default('asap'),
  timezone: z.string().default('Africa/Kigali'),
  photos: z.array(z.string()).max(5, 'Maximum 5 photos per job').optional().default([]),
});
export type CreateJobInput = z.infer<typeof CreateJobSchema>;

// ─── Update Job Schema ───
export const UpdateJobSchema = CreateJobSchema.partial();
export type UpdateJobInput = z.infer<typeof UpdateJobSchema>;

// ─── Job Attachment Schema ───
export const JobAttachmentSchema = z.object({
  id: z.string(),
  url: z.string(),
  caption: z.string().nullable().optional(),
  mimeType: z.string(),
});
export type JobAttachment = z.infer<typeof JobAttachmentSchema>;

// ─── Public Job Detail / Feed Item ───
export const JobResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  status: z.nativeEnum(JobStatus),
  category: z.object({
    id: z.string(),
    slug: z.string(),
    name: z.string(),
  }),
  // Coarse location only: neighborhood name and city. Exact address is private (BR-13)
  area: z.object({
    id: z.string(),
    name: z.string(),
    city: z.string(),
  }),
  budget: z
    .object({
      amount: z.number().int(),
      currency: z.string(),
      negotiable: z.boolean(),
    })
    .nullable(),
  timingPreference: z.string().nullable().optional(),
  startsAt: z.string().nullable().optional(),
  windowType: z.string().nullable().optional(),
  photos: z.array(JobAttachmentSchema),
  offerCount: z.number().int(),
  isCustomer: z.boolean().optional(),
  createdAt: z.string().datetime(),
  expiresAt: z.string().datetime().nullable().optional(),
});
export type JobResponse = z.infer<typeof JobResponseSchema>;

// ─── Jobs Query Schema ───
export const JobFeedQuerySchema = PaginationParamsSchema.extend({
  categoryId: z.string().optional(),
  areaId: z.string().optional(),
  status: z.nativeEnum(JobStatus).optional(),
});
export type JobFeedQuery = z.infer<typeof JobFeedQuerySchema>;
