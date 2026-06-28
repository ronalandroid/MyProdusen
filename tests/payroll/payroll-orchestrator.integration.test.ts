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
import { eq } from 'drizzle-orm';

/**
 * Integration test for the payroll ORCHESTRATOR (calculatePayroll), against a
 * real DB — the protective net for the planned payroll.service split.
 *
 * Exercises the real API: createPayrollRun -> calculatePayroll(runId) persists
 * a PayrollItem per active assigned employee. Asserts gross/net/BPJS/PPh21 and
 * idempotency-by-rejection (re-calc of a non-DRAFT run throws).
 *
 * NOTE (feature gaps, intentionally not tested because the code does not
 * implement them): resign mid-period proration; a separate "late penalty"
 * field (lateness is reflected via ABSENT-day attendance deduction); a
 * per-employee calculatePayroll(employeeId, period) entry point. Building those
 * is a payroll-owner spec decision, not a refactor.
 */
describe('Payroll orchestrator integration (real DB)', () => {
  const seeded = { ids: [] as string[], structures: [] as string[], runs: [] as string[] };

  afterEach(async () => {
    for (const r of seeded.runs) await db.delete(payrollItems).where(eq(payrollItems.runId, r));
    for (const r of seeded.runs) await db.delete(payrollRuns).where(eq(payrollRuns.id, r));
    for (const id of seeded.ids) await db.delete(overtimeRequests).where(eq(overtimeRequests.employeeId, id));
    for (const id of seeded.ids) await db.delete(employeePayrolls).where(eq(employeePayrolls.employeeId, id));
    for (const s of seeded.structures) await db.delete(payrollStructures).where(eq(payrollStructures.id, s));
    for (const id of seeded.ids) await db.delete(employees).where(eq(employees.id, id));
    for (const id of seeded.ids) await db.delete(users).where(eq(users.id, id));
    seeded.ids.length = 0; seeded.structures.length = 0; seeded.runs.length = 0;
  });

  async function seedEmployee(baseSalary: number): Promise<string> {
    const id = `itest_pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    seeded.ids.push(id);
    await db.insert(users).values({ id, email: `${id}@t.local`, username: id, password: 'x', role: 'EMPLOYEE', isActive: true });
    await db.insert(employees).values({ id, nip: `NIP-${id}`, userId: id, fullName: 'IT Payroll', email: `${id}@t.local`, status: 'ACTIVE', position: 'Staff' });
    const structureId = `${id}_str`; seeded.structures.push(structureId);
    await db.insert(payrollStructures).values({ id: structureId, name: structureId, baseSalary, isActive: true });
    await db.insert(employeePayrolls).values({ id: `${id}_ep`, employeeId: id, structureId, baseSalary, effectiveDate: new Date('2026-01-01') });
    return id;
  }

  async function calcRunFor(empIds: string[], range?: { start: Date; end: Date }) {
    const period = `itest_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const run = await payrollService.createPayrollRun({
      period,
      periodStart: range?.start ?? new Date('2026-05-01'),
      periodEnd: range?.end ?? new Date('2026-05-31'),
      calculatedBy: empIds[0],
    });
    seeded.runs.push(run.id);
    await payrollService.calculatePayroll(run.id);
    // Scope to THIS run: calculatePayroll processes every active assigned employee,
    // so a parallel suite's run may also produce an item for the same employee.
    // Filtering by runId keeps the assertion deterministic under parallel execution.
    const items = await db.select().from(payrollItems).where(eq(payrollItems.runId, run.id));
    return { run, items };
  }

  it('computes gross/net with BPJS shares and zero tax below PTKP', async () => {
    const emp = await seedEmployee(3_000_000);
    const { items } = await calcRunFor([emp]);
    const item = items.find((i) => i.employeeId === emp);
    expect(item, 'employee must get a payroll item').toBeTruthy();
    expect(item!.grossPay).toBeCloseTo(3_000_000, 0);
    expect(item!.bpjsKesehatanEmployee).toBeCloseTo(30_000, 0); // 1%
    expect(item!.bpjsKetenagakerjaanEmployee).toBeCloseTo(60_000, 0); // 2%
    expect(item!.taxAmount).toBeCloseTo(0, 0); // 3,000,000 < PTKP 4,500,000
    expect(item!.attendanceDeduction).toBeCloseTo(0, 0); // no ABSENT records
    expect(item!.netPay).toBeCloseTo(3_000_000 - 30_000 - 60_000, 0);
    expect(item!.netPay).toBeGreaterThan(0);
  });

  it('applies the PPh21 bracket correctly above PTKP', async () => {
    const emp = await seedEmployee(10_000_000);
    const { items } = await calcRunFor([emp]);
    const item = items.find((i) => i.employeeId === emp)!;
    // taxable 5,500,000 -> 5,000,000*5% + 500,000*15% = 325,000
    expect(item.taxAmount).toBeCloseTo(325_000, 0);
    expect(item.netPay).toBeCloseTo(10_000_000 - 325_000 - 100_000 - 200_000, 0);
  });

  it('processes every active assigned employee in the run (none missed)', async () => {
    const a = await seedEmployee(3_000_000);
    const b = await seedEmployee(4_000_000);
    const { items } = await calcRunFor([a, b]);
    expect(items.find((i) => i.employeeId === a)).toBeTruthy();
    expect(items.find((i) => i.employeeId === b)).toBeTruthy();
  });

  it('is idempotent by rejecting re-calculation of an already-calculated run', async () => {
    const emp = await seedEmployee(3_000_000);
    const period = `itest_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const run = await payrollService.createPayrollRun({
      period, periodStart: new Date('2026-05-01'), periodEnd: new Date('2026-05-31'), calculatedBy: emp,
    });
    seeded.runs.push(run.id);
    await payrollService.calculatePayroll(run.id);
    await expect(payrollService.calculatePayroll(run.id)).rejects.toThrow(/sudah dikalkulasi/i);
  });

  it('adds approved unpaid overtime to gross pay', async () => {
    const emp = await seedEmployee(3_000_000);
    // Unique far-future window: approvePayrollRun marks every approved-unpaid
    // overtime in its run's DATE RANGE as paid (no employee filter), so a
    // parallel test approving an overlapping 2026-05 run would otherwise flip
    // this record to paid before this run's calc reads it.
    await db.insert(overtimeRequests).values({
      id: `${emp}_ot`,
      employeeId: emp,
      overtimeDate: new Date('3055-03-10'),
      startTime: '17:00',
      endTime: '21:00',
      durationHours: 8,
      rateId: 'itest-rate',
      reason: 'itest overtime',
      status: 'APPROVED',
      calculatedPay: 400_000,
      isPaid: false,
    });
    const { items } = await calcRunFor([emp], { start: new Date('3055-03-01'), end: new Date('3055-03-31') });
    const item = items.find((i) => i.employeeId === emp)!;
    expect(item.overtimePay).toBeCloseTo(400_000, 0);
    expect(item.overtimeHours).toBeCloseTo(8, 0);
    // gross = base + overtime (no allowances/bonus seeded)
    expect(item.grossPay).toBeCloseTo(3_400_000, 0);
    expect(item.netPay).toBeGreaterThan(3_000_000);
  });
});
