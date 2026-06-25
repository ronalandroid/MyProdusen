import { describe, it, expect, afterEach } from 'vitest';
import { db, leaveBalanceLedger } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { leaveBalanceService } from '@/features/leave/leave-balance.service';

/**
 * Integration test for adjustIndividualQuota against a real DB — isolated to a
 * unique employee + far-future year, cleaned up afterwards.
 */
describe('LeaveBalanceService.adjustIndividualQuota (real DB)', () => {
  const emp = `itest-adj-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const YEAR = 9600 + Math.floor(Math.random() * 300);

  afterEach(async () => {
    await db.delete(leaveBalanceLedger).where(eq(leaveBalanceLedger.employeeId, emp));
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
