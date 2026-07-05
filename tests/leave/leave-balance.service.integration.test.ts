import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { leaveBalanceService } from '@/features/leave/leave-balance.service';
import { createTestUser, createTestEmployee, cleanupTestData } from '../helpers/test-utils';

/**
 * Integration tests for LeaveBalanceService read paths against a real DB.
 * getBalance/getBalanceHistory auto-provision an annual entitlement, so the
 * suite uses a real Employee fixture (FK-enforced ledger) in a far-future
 * year and cleans up its rows afterwards.
 */
describe('LeaveBalanceService integration (real DB, read paths)', () => {
  const YEAR = 9500 + Math.floor(Math.random() * 400);
  let userId: string;
  let emp: string;

  beforeAll(async () => {
    const user = await createTestUser('EMPLOYEE');
    userId = user.id;
    emp = await createTestEmployee(userId);
  });

  afterAll(async () => {
    await cleanupTestData({ employeeIds: [emp], userIds: [userId] });
  });

  it('getBalance: auto-provisions an entitlement and returns a zero-usage summary', async () => {
    const b = await leaveBalanceService.getBalance(emp, YEAR);
    expect(b.year).toBe(YEAR);
    expect(typeof b.available).toBe('number');
    expect(b.available).toBeGreaterThanOrEqual(0);
    expect(b.pending).toBeCloseTo(0, 5);
    expect(b.used).toBeCloseTo(0, 5);
  });

  it('getBalanceHistory: returns the ledger entries including the auto entitlement', async () => {
    const history = await leaveBalanceService.getBalanceHistory(emp, YEAR);
    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBeGreaterThanOrEqual(1);
  });

  it('getGlobalLeaveQuota: returns a non-negative number (defaults to 12)', async () => {
    const quota = await leaveBalanceService.getGlobalLeaveQuota();
    expect(typeof quota).toBe('number');
    expect(quota).toBeGreaterThanOrEqual(0);
  });
});
