import { describe, it, expect, afterEach } from 'vitest';
import {
  db,
  users,
  employees,
  payrollStructures,
  employeePayrolls,
  payrollRuns,
  payrollItems,
  overtimeRequests,
} from '@/lib/db';
import { payrollService } from '@/services/payroll/payroll.service';
import { eq, inArray } from 'drizzle-orm';

/**
 * Approving a payroll run must only mark overtime PAID for employees who were
 * actually part of that run (i.e. have a payroll item in it). It must NOT flip
 * the overtime of employees excluded from the run — e.g. inactive staff, or
 * staff left out of a correction/supplemental run for the same period — to
 * paid, because that run never computed or disbursed their overtime.
 *
 * Parallel-safe: unique far-future period window + isolated employees, so no
 * concurrent test's approve (which filters overtime by date range) can touch
 * these records.
 */
describe('approvePayrollRun overtime settlement is scoped to the run', () => {
  const ids = { structure: `ots_str_${Date.now()}` };
  const userIds: string[] = [];
  const employeeIds: string[] = [];
  const runIds: string[] = [];

  const PERIOD = '3061-04';
  const PERIOD_START = new Date('3061-04-01');
  const PERIOD_END = new Date('3061-04-30');
  const OT_DATE = new Date('3061-04-10');

  async function seedEmployee(suffix: string, status: 'ACTIVE' | 'INACTIVE', assign: boolean) {
    const id = `ots_emp_${suffix}_${Date.now()}`;
    await db.insert(users).values({
      id,
      email: `${id}@myprodusen.local`,
      username: id,
      password: 'password',
      role: 'EMPLOYEE',
      isActive: true,
    });
    await db.insert(employees).values({
      id,
      nip: `MPD-${id}`,
      userId: id,
      fullName: 'Overtime Scope Employee',
      email: `${id}@myprodusen.local`,
      status,
      position: 'Staff',
    });
    if (assign) {
      await db.insert(employeePayrolls).values({
        id: `ots_pay_${id}`,
        employeeId: id,
        structureId: ids.structure,
        baseSalary: 3_000_000,
        effectiveDate: new Date('2026-01-01'),
      });
    }
    userIds.push(id);
    employeeIds.push(id);
    return id;
  }

  async function seedOvertime(empId: string) {
    await db.insert(overtimeRequests).values({
      id: `${empId}_ot`,
      employeeId: empId,
      overtimeDate: OT_DATE,
      startTime: '17:00',
      endTime: '21:00',
      durationHours: 4,
      rateId: 'itest-rate',
      reason: 'itest overtime scope',
      status: 'APPROVED',
      calculatedPay: 200_000,
      isPaid: false,
    });
  }

  afterEach(async () => {
    for (const runId of runIds) {
      await db.delete(payrollItems).where(eq(payrollItems.runId, runId));
      await db.delete(payrollRuns).where(eq(payrollRuns.id, runId));
    }
    if (employeeIds.length) {
      await db.delete(overtimeRequests).where(inArray(overtimeRequests.employeeId, employeeIds));
      // Leaked items (test failed before its run cleanup) would block the
      // employee delete under the core FKs (migration 0042).
      await db.delete(payrollItems).where(inArray(payrollItems.employeeId, employeeIds));
      await db.delete(employeePayrolls).where(inArray(employeePayrolls.employeeId, employeeIds));
      await db.delete(employees).where(inArray(employees.id, employeeIds));
      await db.delete(users).where(inArray(users.id, employeeIds));
    }
    await db.delete(payrollStructures).where(eq(payrollStructures.id, ids.structure));
    runIds.length = 0;
    userIds.length = 0;
    employeeIds.length = 0;
  });

  it('marks in-run overtime paid but leaves an excluded employee untouched', async () => {
    await db.insert(payrollStructures).values({
      id: ids.structure,
      name: `Structure ${ids.structure}`,
      baseSalary: 3_000_000,
      isActive: true,
    });

    // inRun: active + assigned -> calculatePayroll includes them.
    const inRun = await seedEmployee('inrun', 'ACTIVE', true);
    // excluded: inactive -> calculatePayroll skips them, so they get no item.
    const excluded = await seedEmployee('excluded', 'INACTIVE', false);
    await seedOvertime(inRun);
    await seedOvertime(excluded);

    const runId = `ots_run_${Date.now()}`;
    runIds.push(runId);
    const run = await payrollService.createPayrollRun({
      period: PERIOD,
      periodStart: PERIOD_START,
      periodEnd: PERIOD_END,
      calculatedBy: 'itest-admin',
    });
    runIds[runIds.length - 1] = run.id;

    await payrollService.calculatePayroll(run.id);
    // Sanity: only the in-run employee got an item.
    const items = await db.select().from(payrollItems).where(eq(payrollItems.runId, run.id));
    expect(items.find((i) => i.employeeId === inRun)).toBeTruthy();
    expect(items.find((i) => i.employeeId === excluded)).toBeFalsy();

    await payrollService.approvePayrollRun(run.id, 'itest-admin');

    const [inRunOt] = await db.select().from(overtimeRequests).where(eq(overtimeRequests.id, `${inRun}_ot`)).limit(1);
    const [excludedOt] = await db.select().from(overtimeRequests).where(eq(overtimeRequests.id, `${excluded}_ot`)).limit(1);

    // In-run employee: overtime settled by this run (unchanged behavior).
    expect(inRunOt.isPaid).toBe(true);
    expect(inRunOt.paidInPayrollRunId).toBe(run.id);

    // Excluded employee: untouched — this run never paid them.
    expect(excludedOt.isPaid).toBe(false);
    expect(excludedOt.paidInPayrollRunId).toBeNull();
  });
});
