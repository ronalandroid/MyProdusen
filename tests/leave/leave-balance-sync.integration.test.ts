import { describe, it, expect, afterEach } from 'vitest';
import { db, users, employees, leaveBalanceLedger } from '@/lib/db';
import { and, eq } from 'drizzle-orm';
import { leaveBalanceService } from '@/features/leave/leave-balance.service';

/**
 * Protects the syncGlobalQuota refactor (M4: batched read + atomic insert).
 * Uses a unique far-future year so the cleanup can safely wipe every ledger row
 * for that year (syncGlobalQuota provisions all active employees).
 */
describe('LeaveBalanceService.syncGlobalQuota (real DB)', () => {
  const YEAR = 9700 + Math.floor(Math.random() * 200);
  const empId = `itest-sync-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  afterEach(async () => {
    await db.delete(leaveBalanceLedger).where(eq(leaveBalanceLedger.balanceYear, YEAR));
    await db.delete(employees).where(eq(employees.id, empId));
    await db.delete(users).where(eq(users.id, empId));
  });

  it('provisions an annual ENTITLEMENT for an active employee', async () => {
    await db.insert(users).values({
      id: empId, email: `${empId}@t.local`, username: empId, password: 'x', role: 'EMPLOYEE', isActive: true,
    });
    await db.insert(employees).values({
      id: empId, nip: `NIP-${empId}`, userId: empId, fullName: 'IT Sync', email: `${empId}@t.local`,
      status: 'ACTIVE', position: 'Staff',
    });

    const quota = await leaveBalanceService.getGlobalLeaveQuota();
    await leaveBalanceService.syncGlobalQuota('itest-actor', YEAR);

    const rows = await db
      .select()
      .from(leaveBalanceLedger)
      .where(and(eq(leaveBalanceLedger.employeeId, empId), eq(leaveBalanceLedger.balanceYear, YEAR)));
    const entitlement = rows.find((r) => r.transactionType === 'ENTITLEMENT');
    expect(entitlement, 'syncGlobalQuota should create an ENTITLEMENT row').toBeTruthy();
    expect(Number(entitlement!.amount)).toBeCloseTo(quota, 5);
  });
});
