import { z } from 'zod';
import { NotificationType } from './enums.js';

export const MessageType = {
  TEXT: 'TEXT',
  ADDRESS_SHARE: 'ADDRESS_SHARE',
  SYSTEM: 'SYSTEM',
} as const;
export type MessageType = (typeof MessageType)[keyof typeof MessageType];

// ─── Send Message Schema ───
export const SendMessageSchema = z.object({
  content: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(2000, 'Message cannot exceed 2000 characters')
    .trim(),
});
export type SendMessageInput = z.infer<typeof SendMessageSchema>;

// ─── Explicit Address Share Schema ───
export const ShareAddressSchema = z.object({
  exactAddress: z
    .string()
    .min(5, 'Please provide your street or house address')
    .max(300, 'Address cannot exceed 300 characters')
    .trim(),
  landmarkOrNotes: z.string().max(300).trim().optional(),
});
export type ShareAddressInput = z.infer<typeof ShareAddressSchema>;

// ─── Message Response ───
export const MessageResponseSchema = z.object({
  id: z.string().uuid(),
  conversationId: z.string().uuid(),
  senderId: z.string().uuid(),
  content: z.string(),
  type: z.nativeEnum(MessageType),
  isMine: z.boolean(),
  readAt: z.string().datetime().nullable().optional(),
  createdAt: z.string().datetime(),
});
export type MessageResponse = z.infer<typeof MessageResponseSchema>;

// ─── Conversation Summary (Inbox) ───
export const ConversationSummarySchema = z.object({
  id: z.string().uuid(),
  matchId: z.string().uuid(),
  jobId: z.string().uuid(),
  jobTitle: z.string(),
  jobStatus: z.string(),
  agreedPrice: z.object({
    amount: z.number().int(),
    currency: z.string(),
  }),
  areaName: z.string(),
  otherParty: z.object({
    id: z.string().uuid(),
    displayName: z.string(),
    role: z.enum(['CUSTOMER', 'PROVIDER']),
  }),
  lastMessage: z
    .object({
      content: z.string(),
      createdAt: z.string().datetime(),
      isMine: z.boolean(),
    })
    .nullable()
    .optional(),
  unreadCount: z.number().int(),
  updatedAt: z.string().datetime(),
});
export type ConversationSummary = z.infer<typeof ConversationSummarySchema>;

// ─── Notification Item ───
export const NotificationItemSchema = z.object({
  id: z.string().uuid(),
  type: z.nativeEnum(NotificationType),
  title: z.string(),
  body: z.string(),
  entityType: z.string().nullable().optional(),
  entityId: z.string().nullable().optional(),
  isRead: z.boolean(),
  createdAt: z.string().datetime(),
});
export type NotificationItem = z.infer<typeof NotificationItemSchema>;

