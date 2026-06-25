import { describe, it, expect, afterEach } from 'vitest';
import {
  db,
  users,
  employees,
  leaveRequests,
  leaveBalanceLedger,
  notifications,
} from '@/lib/db';
import { leaveService } from '@/services/leave/leave.service';
import { leaveBalanceService } from '@/features/leave/leave-balance.service';
import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';

/**
 * Integration test for the leave ORCHESTRATOR (leaveService), against a real DB.
 * This protects genuine business logic — leave-balance correctness — not CRUD
 * wrappers:
 *   - createLeaveRequest: overlap detection, balance-sufficiency check, atomic
 *     create + balance hold.
 *   - approveLeaveRequest: atomic status APPROVED + balance deduction.
 *   - rejectLeaveRequest: atomic status REJECTED + held balance release.
 *
 * Seeding strategy for balance/quota: we insert an ENTITLEMENT ledger row
 * directly with a controlled `amount` (the quota) for our seeded employee in a
 * unique far-future balance year. ensureAnnualEntitlement() finds that row and
 * does NOT add a duplicate, so the available balance is exactly what we seed —
 * deterministic, and independent of the global companySettings quota.
 *
 * Determinism under parallel execution: every seeded row is keyed by unique ids
 * (employee, user) and a unique balance year, and every query/cleanup is scoped
 * to those ids. Other suites cannot collide with this one's rows.
 */
describe('Leave orchestrator integration (real DB)', () => {
  const seeded = { ids: [] as string[] };

  afterEach(async () => {
    // FK-safe order: ledger/holds + requests + notifications first, then the
    // employee, then the user. (No DB-level FKs are declared, but we keep the
    // logical dependency order regardless.)
    for (const id of seeded.ids) {
      await db.delete(leaveBalanceLedger).where(eq(leaveBalanceLedger.employeeId, id));
      await db.delete(leaveRequests).where(eq(leaveRequests.employeeId, id));
      await db.delete(notifications).where(eq(notifications.userId, id));
      await db.delete(employees).where(eq(employees.id, id));
      await db.delete(users).where(eq(users.id, id));
    }
    seeded.ids.length = 0;
  });

  /**
   * Seeds a user + employee and an ENTITLEMENT ledger row of `quota` days for
   * `year`. Returns { id, year } where id is both the userId and employeeId.
   */
  async function seedEmployeeWithQuota(quota: number): Promise<{ id: string; year: number }> {
    const id = `itest_leave_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    seeded.ids.push(id);
    // Unique far-future year per seed so concurrent suites never share a balance window.
    const year = 9000 + Math.floor(Math.random() * 900);

    await db.insert(users).values({
      id,
      email: `${id}@t.local`,
      username: id,
      password: 'x',
      role: 'EMPLOYEE',
      isActive: true,
    });
    await db.insert(employees).values({
      id,
      nip: `NIP-${id}`,
      userId: id,
      fullName: 'IT Leave',
      email: `${id}@t.local`,
      status: 'ACTIVE',
      position: 'Staff',
    });
    await db.insert(leaveBalanceLedger).values({
      id: uuidv4(),
      employeeId: id,
      transactionType: 'ENTITLEMENT',
      amount: quota,
      balanceYear: year,
      reason: `itest entitlement ${year}`,
    });

    return { id, year };
  }

  /** A LEAVE-type request whose dates fall inside the seeded balance `year`. */
  function leaveDates(year: number, startDay: number, endDay: number): { startDate: Date; endDate: Date } {
    // Mid-March in the target year — far from year boundaries so getFullYear()
    // is unambiguous regardless of timezone.
    return {
      startDate: new Date(year, 2, startDay),
      endDate: new Date(year, 2, endDay),
    };
  }

  it('happy path: creates a PENDING request and reserves a balance hold', async () => {
    const { id, year } = await seedEmployeeWithQuota(12);
    const { startDate, endDate } = leaveDates(year, 10, 12); // 3 days

    const created = await leaveService.createLeaveRequest({
      employeeId: id,
      type: 'LEAVE',
      startDate,
      endDate,
      reason: 'itest happy path',
    });

    expect(created.status).toBe('PENDING');
    expect(created.employeeId).toBe(id);

    // A REQUEST_HOLD ledger row for this employee must exist with -3 days.
    const holds = await db
      .select()
      .from(leaveBalanceLedger)
      .where(eq(leaveBalanceLedger.leaveRequestId, created.id));
    const hold = holds.find((h) => h.transactionType === 'REQUEST_HOLD');
    expect(hold, 'a REQUEST_HOLD ledger row must be created').toBeTruthy();
    expect(hold!.amount).toBeCloseTo(-3, 5);

    // available = entitlement 12 - hold 3 = 9
    const balance = await leaveBalanceService.getBalance(id, year);
    expect(balance.available).toBeCloseTo(9, 5);
    expect(balance.pending).toBeCloseTo(3, 5);
  });

  it('overlap rejection: a second request overlapping an active one is rejected', async () => {
    const { id, year } = await seedEmployeeWithQuota(12);
    const first = leaveDates(year, 10, 12);
    await leaveService.createLeaveRequest({
      employeeId: id,
      type: 'LEAVE',
      startDate: first.startDate,
      endDate: first.endDate,
      reason: 'itest first',
    });

    const overlapping = leaveDates(year, 11, 13); // overlaps day 11-12
    await expect(
      leaveService.createLeaveRequest({
        employeeId: id,
        type: 'LEAVE',
        startDate: overlapping.startDate,
        endDate: overlapping.endDate,
        reason: 'itest overlap',
      }),
    ).rejects.toThrow(/overlap/i);

    // Only the first request should exist.
    const requests = await db
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.employeeId, id));
    expect(requests).toHaveLength(1);
  });

  it('insufficient balance: requesting more days than available is rejected', async () => {
    const { id, year } = await seedEmployeeWithQuota(2); // only 2 days available
    const { startDate, endDate } = leaveDates(year, 10, 14); // 5 days requested

    await expect(
      leaveService.createLeaveRequest({
        employeeId: id,
        type: 'LEAVE',
        startDate,
        endDate,
        reason: 'itest insufficient',
      }),
    ).rejects.toThrow(/Saldo cuti tidak cukup|tidak cukup/i);

    // No request and no hold should have been written (atomic guard before insert).
    const requests = await db
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.employeeId, id));
    expect(requests).toHaveLength(0);
    const holds = await db
      .select()
      .from(leaveBalanceLedger)
      .where(eq(leaveBalanceLedger.employeeId, id));
    expect(holds.some((h) => h.transactionType === 'REQUEST_HOLD')).toBe(false);
  });

  it('approve -> deduct: status becomes APPROVED and the balance reflects the deduction', async () => {
    const { id, year } = await seedEmployeeWithQuota(12);
    const { startDate, endDate } = leaveDates(year, 10, 12); // 3 days
    const created = await leaveService.createLeaveRequest({
      employeeId: id,
      type: 'LEAVE',
      startDate,
      endDate,
      reason: 'itest approve',
    });

    const updated = await leaveService.approveLeaveRequest(created.id, id);
    expect(updated.status).toBe('APPROVED');
    expect(updated.approvedBy).toBe(id);

    // Persisted status check.
    const [row] = await db
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.id, created.id))
      .limit(1);
    expect(row.status).toBe('APPROVED');

    // After approval: entitlement 12, used 3, available 9 (deduction reflected).
    const balance = await leaveBalanceService.getBalance(id, year);
    expect(balance.available).toBeCloseTo(9, 5);
    expect(balance.used).toBeCloseTo(3, 5);
    expect(balance.pending).toBeCloseTo(0, 5);
  });

  it('reject -> release: status becomes REJECTED and the held balance is released back', async () => {
    const { id, year } = await seedEmployeeWithQuota(12);
    const { startDate, endDate } = leaveDates(year, 10, 12); // 3 days
    const created = await leaveService.createLeaveRequest({
      employeeId: id,
      type: 'LEAVE',
      startDate,
      endDate,
      reason: 'itest reject',
    });

    // Sanity: hold is active before rejection.
    const before = await leaveBalanceService.getBalance(id, year);
    expect(before.available).toBeCloseTo(9, 5);

    const updated = await leaveService.rejectLeaveRequest(created.id, id, 'itest rejection reason');
    expect(updated.status).toBe('REJECTED');
    expect(updated.rejectedBy).toBe(id);
    expect(updated.rejectionReason).toBe('itest rejection reason');

    // Persisted status check.
    const [row] = await db
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.id, created.id))
      .limit(1);
    expect(row.status).toBe('REJECTED');

    // Hold released: balance back to full entitlement, nothing pending or used.
    const after = await leaveBalanceService.getBalance(id, year);
    expect(after.available).toBeCloseTo(12, 5);
    expect(after.pending).toBeCloseTo(0, 5);
    expect(after.used).toBeCloseTo(0, 5);
  });
});
