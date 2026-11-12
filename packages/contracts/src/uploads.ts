import { z } from 'zod';

export enum UploadPurpose {
  AVATAR = 'avatar',
  JOB_PHOTO = 'job_photo',
  PORTFOLIO = 'portfolio',
  SUPPORT_ATTACHMENT = 'support_attachment',
}

export enum UploadStatus {
  PENDING = 'PENDING',
  READY = 'READY',
  REJECTED = 'REJECTED',
  DELETED = 'DELETED',
}

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
] as const;

export const PresignUploadSchema = z.object({
  purpose: z.nativeEnum(UploadPurpose),
  contentType: z.enum(ALLOWED_IMAGE_TYPES, {
    errorMap: () => ({ message: 'Only JPEG, PNG, WebP, and AVIF images are accepted.' }),
  }),
  sizeBytes: z
    .number()
    .int()
    .min(1, 'File cannot be empty')
    .max(10 * 1024 * 1024, 'File size exceeds maximum 10MB limit'),
  fileName: z.string().optional(),
});
export type PresignUploadInput = z.infer<typeof PresignUploadSchema>;

export const PresignUploadResponseSchema = z.object({
  id: z.string(),
  uploadUrl: z.string(),
  key: z.string(),
  contentType: z.string(),
  expiresInSeconds: z.number().int(),
});
export type PresignUploadResponse = z.infer<typeof PresignUploadResponseSchema>;

export const CompleteUploadSchema = z.object({
  uploadId: z.string().min(1),
});
export type CompleteUploadInput = z.infer<typeof CompleteUploadSchema>;

export const UploadItemSchema = z.object({
  id: z.string(),
  url: z.string(),
  purpose: z.nativeEnum(UploadPurpose),
  status: z.nativeEnum(UploadStatus),
  sizeBytes: z.number().int(),
  contentType: z.string(),
  createdAt: z.string().datetime(),
});
export type UploadItem = z.infer<typeof UploadItemSchema>;

