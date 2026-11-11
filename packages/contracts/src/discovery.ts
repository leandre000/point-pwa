import { z } from 'zod';
import { PaginationParamsSchema } from './common.js';
import { VerificationLevel } from './enums.js';

// ─── Service Category ───
export const CategorySchema = z.object({
  id: z.string().uuid(),
  slug: z.string().min(2).max(50),
  nameEn: z.string().min(2),
  nameRw: z.string().min(2),
  nameFr: z.string().min(2),
  iconName: z.string(),
  isActive: z.boolean(),
  displayOrder: z.number().int(),
  jobCount: z.number().int().optional(),
  providerCount: z.number().int().optional(),
});
export type Category = z.infer<typeof CategorySchema>;

export const CreateCategorySchema = z.object({
  slug: z.string().min(2).max(50).toLowerCase().trim(),
  nameEn: z.string().min(2).max(100).trim(),
  nameRw: z.string().min(2).max(100).trim(),
  nameFr: z.string().min(2).max(100).trim(),
  iconName: z.string().min(2).max(50),
  displayOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});
export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;

// ─── Service Area ───
export const AreaSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(100),
  district: z.string().min(2).max(100).optional(),
  city: z.string().default('Kigali'),
  countryCode: z.string().length(2).default('RW'),
  isActive: z.boolean(),
});
export type Area = z.infer<typeof AreaSchema>;

export const CreateAreaSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  district: z.string().min(2).max(100).trim().optional(),
  city: z.string().default('Kigali'),
  countryCode: z.string().length(2).default('RW'),
  isActive: z.boolean().default(true),
});
export type CreateAreaInput = z.infer<typeof CreateAreaSchema>;

// ─── Provider Discovery & Search ───
export const ProviderSearchQuerySchema = PaginationParamsSchema.extend({
  q: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  areaId: z.string().uuid().optional(),
  minRating: z.number().min(1).max(5).optional(),
  verificationLevel: z.nativeEnum(VerificationLevel).optional(),
});
export type ProviderSearchQuery = z.infer<typeof ProviderSearchQuerySchema>;

export const ProviderListItemSchema = z.object({
  id: z.string().uuid(),
  businessName: z.string(),
  bio: z.string().nullable().optional(),
  verificationLevel: z.nativeEnum(VerificationLevel),
  completedJobs: z.number().int(),
  ratingAverage: z.number().nullable().optional(), // 1.0 - 5.0
  ratingCount: z.number().int(),
  areaName: z.string(),
  district: z.string().optional(),
  distanceBand: z.string().optional(), // e.g. "~1.5 km"
  categories: z.array(
    z.object({
      id: z.string().uuid(),
      slug: z.string(),
      name: z.string(),
    }),
  ),
  isAvailable: z.boolean(),
});
export type ProviderListItem = z.infer<typeof ProviderListItemSchema>;

