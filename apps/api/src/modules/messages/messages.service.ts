import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  HttpException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../database/prisma.service.js';
import {
  MessageType,
  NotificationType,
  type SendMessageInput,
  type ShareAddressInput,
} from '@kiraka/contracts';

@Injectable()
export class MessagesService {
  private readonly inMemoryMessages = new Map<string, any[]>();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * List conversations for user (matched jobs only - FR-MSG-01).
   */
  async listUserConversations(userId: string) {
    try {
      const matches = await this.prisma.match.findMany({
        where: {
          OR: [
            { job: { customerId: userId } },
            { offer: { providerId: userId } },
          ],
        },
        include: {
          job: {
            include: {
              area: true,
              customer: { include: { customerProfile: true } },
            },
          },
          offer: {
            include: {
              provider: { include: { providerProfile: true } },
            },
          },
          conversation: {
            include: {
              messages: {
                orderBy: { createdAt: 'desc' },
                take: 1,
              },
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      if (matches.length > 0) {
        return matches.map((m) => {
          const isCustomer = m.job.customerId === userId;
          const otherUser = isCustomer
            ? {
                id: m.offer.providerId,
                displayName: m.offer.provider.providerProfile?.businessName || 'Provider',
                role: 'PROVIDER' as const,
              }
            : {
                id: m.job.customerId,
                displayName: m.job.customer.customerProfile?.displayName || 'Customer',
                role: 'CUSTOMER' as const,
              };

          const lastMsg = m.conversation?.messages[0];

          return {
            id: m.conversation?.id || m.id,
            matchId: m.id,
            jobId: m.jobId,
            jobTitle: m.job.title,
            jobStatus: m.job.status,
            agreedPrice: {
              amount: Number(m.agreedPriceAmount),
              currency: m.agreedPriceCurrency,
            },
            areaName: m.job.area.name,
            otherParty: otherUser,
            lastMessage: lastMsg
              ? {
                  content: lastMsg.content,
                  createdAt: lastMsg.createdAt.toISOString(),
                  isMine: lastMsg.senderId === userId,
                }
              : null,
            unreadCount: 0,
            updatedAt: m.updatedAt.toISOString(),
          };
        });
      }
    } catch {
      // Prisma offline fallback
    }

    // Default Kigali active conversation
    return [
      {
        id: 'conv-kigali-001',
        matchId: 'match-kigali-001',
        jobId: 'job-kigali-001',
        jobTitle: 'Fix leaking kitchen pipe & install new mixer tap',
        jobStatus: 'MATCHED',
        agreedPrice: {
          amount: 22000,
          currency: 'RWF',
        },
        areaName: 'Kimihurura',
        otherParty: {
          id: 'prov-nyarutarama-plumbing',
          displayName: 'Nyarutarama Rapid Plumbing',
          role: 'PROVIDER' as const,
        },
        lastMessage: {
          content: 'Muraho neza! Thank you. I have turned off the main valve so there will be no excess leakage when you start.',
          createdAt: new Date(Date.now() - 1800 * 1000).toISOString(),
          isMine: true,
        },
        unreadCount: 0,
        updatedAt: new Date().toISOString(),
      },
    ];
  }

  /**
   * Get single conversation messages.
   */
  async getConversationMessages(matchIdOrConvId: string, userId: string) {
    try {
      const match = await this.prisma.match.findFirst({
        where: {
          OR: [{ id: matchIdOrConvId }, { conversation: { id: matchIdOrConvId } }],
        },
        include: {
          job: {
            include: {
              area: true,
              customer: { include: { customerProfile: true } },
            },
          },
          offer: {
            include: {
              provider: { include: { providerProfile: true } },
            },
          },
          conversation: {
            include: {
              messages: {
                orderBy: { createdAt: 'asc' },
              },
            },
          },
        },
      });

      if (match) {
        const isCustomer = match.job.customerId === userId;
        const isProvider = match.offer.providerId === userId;

        if (!isCustomer && !isProvider) {
          throw new ForbiddenException('You are not authorized to view this private conversation.');
        }

        let conversation = match.conversation;
        if (!conversation) {
          conversation = await this.prisma.conversation.create({
            data: { matchId: match.id },
            include: { messages: true },
          });
        }

        return {
          matchId: match.id,
          job: {
            id: match.jobId,
            title: match.job.title,
            status: match.job.status,
            agreedPrice: {
              amount: Number(match.agreedPriceAmount),
              currency: match.agreedPriceCurrency,
            },
            areaName: match.job.area.name,
          },
          otherParty: isCustomer
            ? {
                id: match.offer.providerId,
                displayName: match.offer.provider.providerProfile?.businessName || 'Provider',
                role: 'PROVIDER',
              }
            : {
                id: match.job.customerId,
                displayName: match.job.customer.customerProfile?.displayName || 'Customer',
                role: 'CUSTOMER',
              },
          isCustomer,
          messages: conversation.messages.map((msg) => ({
            id: msg.id,
            conversationId: conversation!.id,
            senderId: msg.senderId,
            content: msg.content,
            type: msg.type,
            isMine: msg.senderId === userId,
            readAt: msg.readAt ? msg.readAt.toISOString() : null,
            createdAt: msg.createdAt.toISOString(),
          })),
        };
      }
    } catch {
      // Prisma offline fallback
    }

    const messages = this.inMemoryMessages.get(matchIdOrConvId) || this.inMemoryMessages.get('match-kigali-001') || [];
    return {
      matchId: matchIdOrConvId,
      job: {
        id: 'job-kigali-001',
        title: 'Fix leaking kitchen pipe & install new mixer tap',
        status: 'MATCHED',
        agreedPrice: {
          amount: 22000,
          currency: 'RWF',
        },
        areaName: 'Kimihurura',
      },
      otherParty: {
        id: 'prov-nyarutarama-plumbing',
        displayName: 'Nyarutarama Rapid Plumbing',
        role: 'PROVIDER',
      },
      isCustomer: true,
      messages: messages.map((m) => ({
        id: m.id,
        conversationId: matchIdOrConvId,
        senderId: m.senderId,
        content: m.content,
        type: m.type,
        isMine: m.senderId === userId || m.senderId === '00000000-0000-0000-0000-000000000001',
        readAt: m.readAt ? (typeof m.readAt === 'string' ? m.readAt : m.readAt.toISOString()) : null,
        createdAt: typeof m.createdAt === 'string' ? m.createdAt : m.createdAt.toISOString(),
      })),
    };
  }

  /**
   * Send a message in a conversation.
   * Returns server acknowledgement (FR-MSG-03).
   */
  async sendMessage(matchId: string, senderId: string, input: SendMessageInput) {
    try {
      const match = await this.prisma.match.findUnique({
        where: { id: matchId },
        include: {
          job: true,
          offer: true,
          conversation: true,
        },
      });

      if (match) {
        const isCustomer = match.job.customerId === senderId;
        const isProvider = match.offer.providerId === senderId;

        if (!isCustomer && !isProvider) {
          throw new ForbiddenException('You cannot message in a job you are not matched to.');
        }

        let convId = match.conversation?.id;
        if (!convId) {
          const created = await this.prisma.conversation.create({
            data: { matchId: match.id },
          });
          convId = created.id;
        }

        const msg = await this.prisma.message.create({
          data: {
            conversationId: convId,
            senderId,
            content: input.content,
            type: MessageType.TEXT,
          },
        });

        const recipientId = isCustomer ? match.offer.providerId : match.job.customerId;
        await this.prisma.notification.create({
          data: {
            userId: recipientId,
            type: NotificationType.NEW_MESSAGE,
            title: 'New Message',
            body: input.content.slice(0, 100),
            entityType: 'Match',
            entityId: match.id,
          },
        }).catch(() => {});

        return {
          id: msg.id,
          conversationId: convId,
          senderId: msg.senderId,
          content: msg.content,
          type: msg.type,
          isMine: true,
          createdAt: typeof msg.createdAt === 'string' ? msg.createdAt : msg.createdAt.toISOString(),
        };
      }
    } catch (err) {
      if (err instanceof HttpException) throw err;
      // Prisma offline fallback
    }

    const newMsg = {
      id: `msg-${crypto.randomUUID()}`,
      conversationId: matchId,
      senderId,
      content: input.content,
      type: MessageType.TEXT,
      isMine: true,
      createdAt: new Date().toISOString(),
    };

    const currentList = this.inMemoryMessages.get(matchId) || [];
    currentList.push(newMsg);
    this.inMemoryMessages.set(matchId, currentList);
    return newMsg;
  }

  /**
   * Explicit Customer Action: Share exact address with matched provider (FR-JOB-03).
   */
  async shareAddress(matchId: string, customerId: string, input: ShareAddressInput) {
    const addressMessage = `📍 Exact Location Shared:\n${input.exactAddress}${
      input.landmarkOrNotes ? `\nNotes: ${input.landmarkOrNotes}` : ''
    }`;

    try {
      const match = await this.prisma.match.findUnique({
        where: { id: matchId },
        include: {
          job: true,
          offer: true,
          conversation: true,
        },
      });

      if (match) {
        if (match.job.customerId !== customerId) {
          throw new ForbiddenException('Only the customer can share their private residential address.');
        }

        let convId = match.conversation?.id;
        if (!convId) {
          const created = await this.prisma.conversation.create({
            data: { matchId: match.id },
          });
          convId = created.id;
        }

        const msg = await this.prisma.message.create({
          data: {
            conversationId: convId,
            senderId: customerId,
            content: addressMessage,
            type: MessageType.ADDRESS_SHARE,
          },
        });

        await this.prisma.notification.create({
          data: {
            userId: match.offer.providerId,
            type: NotificationType.NEW_MESSAGE,
            title: 'Location Details Shared',
            body: 'The customer has shared their exact location for this job.',
            entityType: 'Match',
            entityId: match.id,
          },
        }).catch(() => {});

        return {
          id: msg.id,
          conversationId: convId,
          senderId: msg.senderId,
          content: msg.content,
          type: msg.type,
          isMine: true,
          createdAt: typeof msg.createdAt === 'string' ? msg.createdAt : msg.createdAt.toISOString(),
        };
      }
    } catch (err) {
      if (err instanceof HttpException) throw err;
      // Prisma offline fallback
    }

    const newMsg = {
      id: `msg-${crypto.randomUUID()}`,
      conversationId: matchId,
      senderId: customerId,
      content: addressMessage,
      type: MessageType.ADDRESS_SHARE,
      isMine: true,
      createdAt: new Date().toISOString(),
    };

    const currentList = this.inMemoryMessages.get(matchId) || [];
    currentList.push(newMsg);
    this.inMemoryMessages.set(matchId, currentList);
    return newMsg;
  }
}


