import { describe, it, expect } from 'vitest';
import { HealthController } from './health.controller.js';

describe('HealthController', () => {
  it('should return health check payload with status ok', () => {
    const controller = new HealthController();
    const result = controller.check();
    expect(result.status).toBe('ok');
    expect(result.service).toBe('kiraka-api');
    expect(result.city).toBe('Kigali');
    expect(result.country).toBe('RW');
    expect(result.timestamp).toBeDefined();
  });
});
