import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { leaveBalanceService } from '@/features/leave/leave-balance.service';
import { createTestUser, createTestEmployee, cleanupTestData } from '../helpers/test-utils';

/**
 * Integration test for adjustIndividualQuota against a real DB — uses a real
 * Employee fixture (FK-enforced ledger) in a far-future year, cleaned up after.
 */
describe('LeaveBalanceService.adjustIndividualQuota (real DB)', () => {
  const YEAR = 9600 + Math.floor(Math.random() * 300);
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

  it('provisions an individual quota then adjusts it to a new value', async () => {
    const first = await leaveBalanceService.adjustIndividualQuota('itest-actor', emp, 20, YEAR);
    expect(first).toBeDefined();
    const afterFirst = await leaveBalanceService.getBalance(emp, YEAR);
    expect(afterFirst.available).toBeCloseTo(20, 5);

    await leaveBalanceService.adjustIndividualQuota('itest-actor', emp, 25, YEAR);
    const afterSecond = await leaveBalanceService.getBalance(emp, YEAR);
    expect(afterSecond.available).toBeCloseTo(25, 5);
  });
});
