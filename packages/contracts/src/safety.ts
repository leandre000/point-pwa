import { z } from 'zod';
import { ReportReason } from './enums.js';

export const ReportStatus = {
  PENDING: 'PENDING',
  INVESTIGATING: 'INVESTIGATING',
  RESOLVED: 'RESOLVED',
  DISMISSED: 'DISMISSED',
} as const;
export type ReportStatus = (typeof ReportStatus)[keyof typeof ReportStatus];

// ─── Create Report Schema ───
export const CreateReportSchema = z.object({
  targetUserId: z.string().uuid().optional(),
  targetJobId: z.string().uuid().optional(),
  reason: z.nativeEnum(ReportReason),
  details: z
    .string()
    .min(10, 'Please provide at least 10 characters explaining what happened')
    .max(2000, 'Details cannot exceed 2000 characters')
    .trim(),
});
export type CreateReportInput = z.infer<typeof CreateReportSchema>;

export const ReportResponseSchema = z.object({
  id: z.string().uuid(),
  reporterId: z.string().uuid(),
  targetUserId: z.string().uuid().nullable().optional(),
  targetJobId: z.string().uuid().nullable().optional(),
  reason: z.nativeEnum(ReportReason),
  details: z.string(),
  status: z.nativeEnum(ReportStatus),
  createdAt: z.string().datetime(),
});
export type ReportResponse = z.infer<typeof ReportResponseSchema>;

// ─── Block User Schema ───
export const BlockUserSchema = z.object({
  blockedUserId: z.string().uuid(),
  reason: z.string().max(200).optional(),
});
export type BlockUserInput = z.infer<typeof BlockUserSchema>;

// ─── Emergency Contact Information (Rwanda) ───
export interface EmergencyContact {
  label: string;
  phone: string;
  description: string;
}

export const RWANDA_EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    label: 'Rwanda National Police (General Emergency)',
    phone: '112',
    description: 'Toll-free 24/7 emergency response across Rwanda',
  },
  {
    label: 'SAMU / Emergency Medical Services',
    phone: '912',
    description: 'Medical emergencies and ambulance dispatch in Kigali',
  },
  {
    label: 'Isange One Stop Center / Gender-Based Violence',
    phone: '114',
    description: 'Free, confidential medical and psychosocial support',
  },
  {
    label: 'Traffic Police & Accidents',
    phone: '113',
    description: 'Road accidents and traffic emergency assistance',
  },
];

