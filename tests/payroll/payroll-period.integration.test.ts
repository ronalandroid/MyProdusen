import { describe, it, expect, afterEach } from 'vitest';
import { db, payrollPeriods } from '@/lib/db';
import { inArray } from 'drizzle-orm';
import { payrollPeriodService } from '@/features/payroll/payroll-period.service';

/**
 * Integration tests for PayrollPeriodService against a real DB. Protects the
 * period lifecycle business rules: overlap rejection, status-transition gates,
 * and the lock/unlock guards (reason length, idempotency, closed-period rules).
 *
 * Determinism under parallel execution: every period uses a unique far-future
 * year so date-overlap checks (which scan ALL periods) never collide with other
 * suites, and cleanup is scoped to ids this suite created.
 */
describe('PayrollPeriodService integration (real DB)', () => {
  const createdIds: string[] = [];

  afterEach(async () => {
    if (createdIds.length > 0) {
      await db.delete(payrollPeriods).where(inArray(payrollPeriods.id, createdIds));
      createdIds.length = 0;
    }
  });

  /** A unique far-future month range so the global overlap check can't collide. */
  function uniqueRange(monthSpanStart = 1, monthSpanEnd = 28): { startDate: Date; endDate: Date; year: number } {
    const year = 9000 + Math.floor(Math.random() * 900);
    return { year, startDate: new Date(year, 5, monthSpanStart), endDate: new Date(year, 5, monthSpanEnd) };
  }

  async function makePeriod(name: string, range = uniqueRange()) {
    const p = await payrollPeriodService.createPeriod({
      name,
      startDate: range.startDate,
      endDate: range.endDate,
      createdBy: 'itest-payroll-user',
    });
    createdIds.push(p.id);
    return { period: p, range };
  }

  it('createPeriod: creates an OPEN period and finds it by id', async () => {
    const { period } = await makePeriod('itest open period');
    expect(period.status).toBe('OPEN');
    expect(period.name).toBe('itest open period');

    const fetched = await payrollPeriodService.getPeriodById(period.id);
    expect(fetched).not.toBeNull();
    expect(fetched!.id).toBe(period.id);
  });

  it('createPeriod: rejects start date not before end date', async () => {
    const year = 9000 + Math.floor(Math.random() * 900);
    await expect(
      payrollPeriodService.createPeriod({
        name: 'itest invalid range',
        startDate: new Date(year, 5, 20),
        endDate: new Date(year, 5, 10),
        createdBy: 'itest-payroll-user',
      }),
    ).rejects.toThrow(/before end date/i);
  });

  it('createPeriod: rejects a range overlapping an existing period', async () => {
    const { range } = await makePeriod('itest first period');
    await expect(
      payrollPeriodService.createPeriod({
        name: 'itest overlap period',
        startDate: new Date(range.year, 5, 14),
        endDate: new Date(range.year, 5, 20),
        createdBy: 'itest-payroll-user',
      }),
    ).rejects.toThrow(/overlap/i);
  });

  it('getAllPeriods: filters by status', async () => {
    const { period } = await makePeriod('itest filter period');
    const open = await payrollPeriodService.getAllPeriods({ status: 'OPEN' });
    expect(open.some((p) => p.id === period.id)).toBe(true);
    const closed = await payrollPeriodService.getAllPeriods({ status: 'CLOSED' });
    expect(closed.some((p) => p.id === period.id)).toBe(false);
  });

  it('updatePeriodStatus: allows OPEN->PREPARING but blocks closing an unlocked period', async () => {
    const { period } = await makePeriod('itest status period');
    const prep = await payrollPeriodService.updatePeriodStatus(period.id, 'PREPARING', 'itest-payroll-user');
    expect(prep.status).toBe('PREPARING');

    await expect(
      payrollPeriodService.updatePeriodStatus(period.id, 'CLOSED', 'itest-payroll-user'),
    ).rejects.toThrow(/locked before closing/i);
  });

  it('lockPeriod: requires a >=10 char reason, locks, and is not re-lockable', async () => {
    const { period } = await makePeriod('itest lock period');

    await expect(
      payrollPeriodService.lockPeriod({ periodId: period.id, lockedBy: 'itest-payroll-user', reason: 'short' }),
    ).rejects.toThrow(/at least 10 characters/i);

    const locked = await payrollPeriodService.lockPeriod({
      periodId: period.id,
      lockedBy: 'itest-payroll-user',
      reason: 'locking for month-end close',
    });
    expect(locked.status).toBe('LOCKED');

    await expect(
      payrollPeriodService.lockPeriod({ periodId: period.id, lockedBy: 'itest-payroll-user', reason: 'locking again now' }),
    ).rejects.toThrow(/already locked/i);
  });

  it('getLockedPeriodForDate: returns a locked period covering the date', async () => {
    const { period, range } = await makePeriod('itest locked-for-date period');
    await payrollPeriodService.lockPeriod({
      periodId: period.id,
      lockedBy: 'itest-payroll-user',
      reason: 'locking for coverage test',
    });

    const inside = await payrollPeriodService.getLockedPeriodForDate(new Date(range.year, 5, 14));
    expect(inside).not.toBeNull();
    expect(inside!.id).toBe(period.id);
  });

  it('unlockPeriod: reopens a locked period and rejects unlocking an open one', async () => {
    const { period } = await makePeriod('itest unlock period');
    await payrollPeriodService.lockPeriod({
      periodId: period.id,
      lockedBy: 'itest-payroll-user',
      reason: 'locking before unlock test',
    });

    const unlocked = await payrollPeriodService.unlockPeriod({
      periodId: period.id,
      unlockedBy: 'itest-payroll-user',
      reason: 'reopening for correction',
    });
    expect(unlocked.status).toBe('OPEN');

    await expect(
      payrollPeriodService.unlockPeriod({ periodId: period.id, unlockedBy: 'itest-payroll-user', reason: 'cannot unlock open' }),
    ).rejects.toThrow(/not locked/i);
  });

  it('updatePeriod: edits an OPEN period but refuses a locked one', async () => {
    const { period } = await makePeriod('itest editable period');
    const renamed = await payrollPeriodService.updatePeriod(period.id, { name: 'itest renamed period' });
    expect(renamed.name).toBe('itest renamed period');

    await payrollPeriodService.lockPeriod({
      periodId: period.id,
      lockedBy: 'itest-payroll-user',
      reason: 'locking before edit-block test',
    });
    await expect(
      payrollPeriodService.updatePeriod(period.id, { name: 'itest blocked rename' }),
    ).rejects.toThrow(/locked or closed/i);
  });

  it('deletePeriod: removes an OPEN period but refuses a locked one', async () => {
    const { period: lockedPeriod } = await makePeriod('itest delete-locked period');
    await payrollPeriodService.lockPeriod({
      periodId: lockedPeriod.id,
      lockedBy: 'itest-payroll-user',
      reason: 'locking before delete-block test',
    });
    await expect(payrollPeriodService.deletePeriod(lockedPeriod.id)).rejects.toThrow(/OPEN status/i);

    const { period: openPeriod } = await makePeriod('itest delete-open period');
    const res = await payrollPeriodService.deletePeriod(openPeriod.id, 'itest-payroll-user');
    expect(res.success).toBe(true);
    expect(await payrollPeriodService.getPeriodById(openPeriod.id)).toBeNull();
  });
});
