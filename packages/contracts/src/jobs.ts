import { z } from 'zod';
import { MoneySchema, PaginationParamsSchema } from './common.js';
import { JobStatus } from './enums.js';

// ─── Create Job Schema ───
export const CreateJobSchema = z.object({
  categoryId: z.string().uuid({ message: 'Please select a valid service category' }),
  areaId: z.string().uuid({ message: 'Please select your Kigali neighborhood' }),
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title must be at most 200 characters')
    .trim(),
  description: z
    .string()
    .min(15, 'Please provide more details (at least 15 characters)')
    .max(2000, 'Description must be at most 2000 characters')
    .trim(),
  budgetAmount: z.number().int().positive().optional(),
  budgetCurrency: z.string().length(3).default('RWF'),
  budgetNegotiable: z.boolean().default(true),
  timingPreference: z.string().max(200).optional(),
  photos: z.array(z.string().url()).max(4, 'Maximum 4 photos per job').optional(),
});
export type CreateJobInput = z.infer<typeof CreateJobSchema>;

// ─── Update Job Schema ───
export const UpdateJobSchema = CreateJobSchema.partial();
export type UpdateJobInput = z.infer<typeof UpdateJobSchema>;

// ─── Job Attachment Schema ───
export const JobAttachmentSchema = z.object({
  id: z.string().uuid(),
  url: z.string().url(),
  caption: z.string().nullable().optional(),
  mimeType: z.string(),
});
export type JobAttachment = z.infer<typeof JobAttachmentSchema>;

// ─── Public Job Detail / Feed Item ───
export const JobResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  status: z.nativeEnum(JobStatus),
  category: z.object({
    id: z.string().uuid(),
    slug: z.string(),
    name: z.string(),
  }),
  // Coarse location only: neighborhood name and city. Exact address is private (BR-13)
  area: z.object({
    id: z.string().uuid(),
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
  photos: z.array(JobAttachmentSchema),
  offerCount: z.number().int(),
  isCustomer: z.boolean().optional(),
  createdAt: z.string().datetime(),
  expiresAt: z.string().datetime().nullable().optional(),
});
export type JobResponse = z.infer<typeof JobResponseSchema>;

// ─── Jobs Query Schema ───
export const JobFeedQuerySchema = PaginationParamsSchema.extend({
  categoryId: z.string().uuid().optional(),
  areaId: z.string().uuid().optional(),
  status: z.nativeEnum(JobStatus).optional(),
});
export type JobFeedQuery = z.infer<typeof JobFeedQuerySchema>;
