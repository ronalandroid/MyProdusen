import { describe, it, expect } from 'vitest';
import { leaveService } from '@/services/leave/leave.service';

/**
 * Integration tests for LeaveService.getLeaveRequests filter branches against a
 * real DB — the supervisor-scoped path (empty team) and the status + date-range
 * (uncached) path. No seeding.
 */
describe('LeaveService.getLeaveRequests filters (real DB)', () => {
  it('supervisorId filter with no team returns an empty array', async () => {
    const result = await leaveService.getLeaveRequests({ supervisorId: 'itest-nonexistent-sup' });
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  it('status + date-range filters return an array (uncached path)', async () => {
    const result = await leaveService.getLeaveRequests({
      status: 'PENDING',
      startDate: new Date(2099, 0, 1),
      endDate: new Date(2099, 11, 31),
    });
    expect(Array.isArray(result)).toBe(true);
  });
});
