import { describe, it, expect, afterEach } from 'vitest';
import { db, leaveBalanceLedger } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { leaveBalanceService } from '@/features/leave/leave-balance.service';

/**
 * Integration tests for LeaveBalanceService read paths against a real DB.
 * getBalance/getBalanceHistory auto-provision an annual entitlement, so each
 * test cleans up the ledger rows it creates for its unique employee id.
 */
describe('LeaveBalanceService integration (real DB, read paths)', () => {
  const emp = `itest-lbal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const YEAR = 9500 + Math.floor(Math.random() * 400);

  afterEach(async () => {
    await db.delete(leaveBalanceLedger).where(eq(leaveBalanceLedger.employeeId, emp));
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
