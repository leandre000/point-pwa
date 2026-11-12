import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MessagesService } from './messages.service.js';
import { MessageType } from '@kiraka/contracts';

describe('MessagesService (Matched Communication & Privacy)', () => {
  let service: MessagesService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      match: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
      },
      conversation: {
        create: vi.fn(),
      },
      message: {
        create: vi.fn(),
      },
      notification: {
        create: vi.fn().mockResolvedValue({}),
      },
    };

    service = new MessagesService(mockPrisma);
  });

  it('enforces FR-MSG-01: blocks non-participants from sending messages', async () => {
    mockPrisma.match.findUnique.mockResolvedValue({
      id: 'match-1',
      job: { customerId: 'cust-1' },
      offer: { providerId: 'prov-1' },
    });

    await expect(
      service.sendMessage('match-1', 'intruder-user', {
        content: 'Hello there',
      }),
    ).rejects.toThrowError(/You cannot message in a job you are not matched to/);
  });

  it('delivers server acknowledgement upon message creation (FR-MSG-03)', async () => {
    mockPrisma.match.findUnique.mockResolvedValue({
      id: 'match-1',
      job: { customerId: 'cust-1' },
      offer: { providerId: 'prov-1' },
      conversation: { id: 'conv-1' },
    });

    mockPrisma.message.create.mockResolvedValue({
      id: 'msg-1',
      conversationId: 'conv-1',
      senderId: 'cust-1',
      content: 'Can you arrive at 2 PM?',
      type: MessageType.TEXT,
      createdAt: new Date(),
    });

    const result = await service.sendMessage('match-1', 'cust-1', {
      content: 'Can you arrive at 2 PM?',
    });

    expect(result.id).toBe('msg-1');
    expect(result.content).toBe('Can you arrive at 2 PM?');
    expect(result.isMine).toBe(true);
    expect(mockPrisma.notification.create).toHaveBeenCalled();
  });

  it('enforces explicit address sharing: only customer can share residential address', async () => {
    mockPrisma.match.findUnique.mockResolvedValue({
      id: 'match-1',
      job: { customerId: 'cust-1' },
      offer: { providerId: 'prov-1' },
      conversation: { id: 'conv-1' },
    });

    // Provider tries to share customer's address (rejected)
    await expect(
      service.shareAddress('match-1', 'prov-1', {
        exactAddress: 'KG 125 St, House 14',
      }),
    ).rejects.toThrowError(/Only the customer can share their private residential address/);
  });
});

