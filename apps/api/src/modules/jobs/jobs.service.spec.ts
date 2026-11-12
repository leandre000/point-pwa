import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JobsService } from './jobs.service.js';
import { JobStatus } from '@kiraka/contracts';

describe('JobsService', () => {
  let service: JobsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      job: {
        count: vi.fn().mockResolvedValue(0),
        create: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
      },
      serviceCategory: {
        findUnique: vi.fn().mockResolvedValue({ id: 'cat-1', slug: 'cleaning', isActive: true, nameEn: 'Cleaning' }),
      },
      serviceArea: {
        findUnique: vi.fn().mockResolvedValue({ id: 'area-1', name: 'Remera', city: 'Kigali', isActive: true }),
      },
      auditLog: {
        create: vi.fn().mockResolvedValue({}),
      },
    };

    service = new JobsService(mockPrisma);
  });

  it('creates an open job with 72h expiry and integer minor unit budget', async () => {
    const customerId = 'cust-123';
    mockPrisma.job.create.mockResolvedValue({
      id: 'job-1',
      customerId,
      categoryId: 'cat-1',
      areaId: 'area-1',
      title: 'Fix kitchen sink leak',
      description: 'The PVC pipe under the sink has a crack and needs replacement.',
      status: JobStatus.OPEN,
      budgetAmount: 12000n,
      budgetCurrency: 'RWF',
      budgetNegotiable: true,
      timingPreference: 'Today morning',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 72 * 3600 * 1000),
      category: { id: 'cat-1', slug: 'cleaning', nameEn: 'Cleaning' },
      area: { id: 'area-1', name: 'Remera', city: 'Kigali' },
      attachments: [],
      _count: { offers: 0 },
    });

    const result = await service.createJob(customerId, {
      categoryId: 'cat-1',
      areaId: 'area-1',
      title: 'Fix kitchen sink leak',
      description: 'The PVC pipe under the sink has a crack and needs replacement.',
      budgetAmount: 12000,
      budgetCurrency: 'RWF',
      budgetNegotiable: true,
      timingPreference: 'Today morning',
      windowType: 'asap',
      timezone: 'Africa/Kigali',
      photos: [],
    });

    expect(result.id).toBe('job-1');
    expect(result.status).toBe(JobStatus.OPEN);
    expect(result.budget?.amount).toBe(12000);
    expect(result.budget?.currency).toBe('RWF');
    expect(result.area.name).toBe('Remera');
    expect((result as any).phone).toBeUndefined(); // BR-13 privacy
  });

  it('rejects creation when user exceeds daily spam limit (5 jobs/day)', async () => {
    mockPrisma.job.count.mockResolvedValue(5);

    await expect(
      service.createJob('cust-123', {
        categoryId: 'cat-1',
        areaId: 'area-1',
        title: 'Spam request',
        description: 'Trying to flood the marketplace with requests.',
        budgetCurrency: 'RWF',
        budgetNegotiable: true,
        windowType: 'asap',
        timezone: 'Africa/Kigali',
        photos: [],
      }),
    ).rejects.toThrowError(/reached the daily limit/);
  });

  it('prevents non-owners from cancelling a job', async () => {
    mockPrisma.job.findUnique.mockResolvedValue({
      id: 'job-1',
      customerId: 'cust-owner',
      status: JobStatus.OPEN,
    });

    await expect(service.cancelJob('job-1', 'other-user')).rejects.toThrowError(
      /You can only cancel your own job requests/,
    );
  });
});

