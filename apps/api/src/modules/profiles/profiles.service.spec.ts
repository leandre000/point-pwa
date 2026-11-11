import { describe, it, expect, vi } from 'vitest';
import { ProfilesService } from './profiles.service.js';

describe('ProfilesService (Trust & Privacy Rules)', () => {
  it('enforces BR-13: public provider view leaks no phone number or exact address', async () => {
    const mockPrisma = {
      providerProfile: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'prov-123',
          businessName: 'Eric Carpentry',
          bio: 'Skilled woodworker in Kigali',
          verificationLevel: 'PHONE_VERIFIED',
          isVisible: true,
          completedJobs: 12,
          ratingAverage: 480,
          ratingCount: 10,
          user: {
            id: 'user-123',
            customerProfile: {
              neighborhood: 'Remera, Gasabo',
            },
          },
        }),
      },
    };

    const service = new ProfilesService(mockPrisma as any);
    const publicProfile = await service.getPublicProvider('prov-123');

    // Verification of privacy contract
    expect(publicProfile).toBeDefined();
    expect(publicProfile.businessName).toBe('Eric Carpentry');
    expect(publicProfile.area).toBe('Remera, Gasabo');
    expect(publicProfile.ratingAverage).toBe(4.8);
    // Explicitly verify NO phone or raw address properties exist
    expect((publicProfile as any).phone).toBeUndefined();
    expect((publicProfile as any).address).toBeUndefined();
    expect((publicProfile as any).userId).toBeUndefined();
  });
});

