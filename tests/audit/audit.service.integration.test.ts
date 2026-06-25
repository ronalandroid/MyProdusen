import { describe, it, expect } from 'vitest';
import { auditService } from '@/features/audit/audit.service';

/**
 * Integration tests for AuditService read/guard paths against a real DB.
 */
describe('AuditService integration (real DB, read/guard paths)', () => {
  it('getLogs: returns a result', async () => {
    const logs = await auditService.getLogs();
    expect(logs).toBeDefined();
  });

  it('getLogById: throws not-found for a missing log', async () => {
    await expect(auditService.getLogById('itest-nonexistent')).rejects.toThrow(/tidak ditemukan/i);
  });
});
