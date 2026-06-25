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
 * Integration test for the payroll RUN LIFECYCLE methods in
 * src/services/payroll/payroll-period.ts, against a real DB. These cover genuine
 * business logic — the status state machine and its side-effects — not CRUD:
 *   - approvePayrollRun: CALCULATED -> APPROVED, AND the key side-effect of
 *     marking every APPROVED+unpaid overtime request in the run period as paid
 *     (isPaid=true, paidInPayrollRunId=runId).
 *   - markPayrollRunPaid:   APPROVED -> PAID (sets paidAt).
 *   - markPayrollRunUnpaid: PAID -> APPROVED (clears paidAt).
 *   - guard: approving a run that is not CALCULATED (DRAFT, or already APPROVED)
 *     is rejected — the service enforces `status === 'CALCULATED'`.
 *
 * Status strings asserted here are read from the schema enum
 * (`payrollRunStatusEnum = ['DRAFT','CALCULATED','APPROVED','PAID']`), not guessed.
 *
 * Determinism under parallel execution: every seeded row is keyed by a unique
 * id and every run uses a unique `period`; all queries/cleanup are scoped to
 * those seeded ids. Other suites cannot collide with this one's rows.
 */
describe('Payroll lifecycle integration (real DB)', () => {
  const seeded = { ids: [] as string[], structures: [] as string[], runs: [] as string[] };

  afterEach(async () => {
    // FK-safe order: items -> runs -> overtime/payroll-assignment -> structures -> employee -> user.
    for (const r of seeded.runs) await db.delete(payrollItems).where(eq(payrollItems.runId, r));
    for (const r of seeded.runs) await db.delete(payrollRuns).where(eq(payrollRuns.id, r));
    for (const id of seeded.ids) await db.delete(overtimeRequests).where(eq(overtimeRequests.employeeId, id));
    for (const id of seeded.ids) await db.delete(employeePayrolls).where(eq(employeePayrolls.employeeId, id));
    for (const s of seeded.structures) await db.delete(payrollStructures).where(eq(payrollStructures.id, s));
    for (const id of seeded.ids) await db.delete(employees).where(eq(employees.id, id));
    for (const id of seeded.ids) await db.delete(users).where(eq(users.id, id));
    seeded.ids.length = 0;
    seeded.structures.length = 0;
    seeded.runs.length = 0;
  });

  async function seedEmployee(baseSalary: number): Promise<string> {
    const id = `itest_paylc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    seeded.ids.push(id);
    await db.insert(users).values({ id, email: `${id}@t.local`, username: id, password: 'x', role: 'EMPLOYEE', isActive: true });
    await db.insert(employees).values({ id, nip: `NIP-${id}`, userId: id, fullName: 'IT Payroll LC', email: `${id}@t.local`, status: 'ACTIVE', position: 'Staff' });
    const structureId = `${id}_str`;
    seeded.structures.push(structureId);
    await db.insert(payrollStructures).values({ id: structureId, name: structureId, baseSalary, isActive: true });
    await db.insert(employeePayrolls).values({ id: `${id}_ep`, employeeId: id, structureId, baseSalary, effectiveDate: new Date('2026-01-01') });
    return id;
  }

  /** Creates a DRAFT run for a unique period and calculates it (-> CALCULATED). */
  async function createCalculatedRun(empId: string) {
    const period = `itest-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const run = await payrollService.createPayrollRun({
      period,
      periodStart: new Date('2026-05-01'),
      periodEnd: new Date('2026-05-31'),
      calculatedBy: empId,
    });
    seeded.runs.push(run.id);
    await payrollService.calculatePayroll(run.id);
    return run;
  }

  it('approve transitions CALCULATED -> APPROVED and marks in-period overtime paid', async () => {
    const emp = await seedEmployee(3_000_000);

    // Seed an APPROVED, unpaid overtime request that falls inside the run period.
    // Same shape as the orchestrator test's overtime seeding.
    const otId = `${emp}_ot`;
    await db.insert(overtimeRequests).values({
      id: otId,
      employeeId: emp,
      overtimeDate: new Date('2026-05-10'),
      startTime: '17:00',
      endTime: '21:00',
      durationHours: 8,
      rateId: 'itest-rate',
      reason: 'itest lifecycle overtime',
      status: 'APPROVED',
      calculatedPay: 400_000,
      isPaid: false,
    });

    const run = await createCalculatedRun(emp);

    // Pre-condition: overtime is still unpaid before approval.
    const [otBefore] = await db.select().from(overtimeRequests).where(eq(overtimeRequests.id, otId)).limit(1);
    expect(otBefore.isPaid).toBe(false);

    const updated = await payrollService.approvePayrollRun(run.id, emp);
    expect(updated.status).toBe('APPROVED');
    expect(updated.approvedBy).toBe(emp);
    expect(updated.approvedAt).toBeTruthy();

    // Persisted run status.
    const persisted = await payrollService.getPayrollRunById(run.id);
    expect(persisted.status).toBe('APPROVED');

    // KEY SIDE-EFFECT: the in-period approved overtime is now marked paid and
    // stamped with this run id.
    const [otAfter] = await db.select().from(overtimeRequests).where(eq(overtimeRequests.id, otId)).limit(1);
    expect(otAfter.isPaid).toBe(true);
    expect(otAfter.paidInPayrollRunId).toBe(run.id);
  });

  it('markPayrollRunPaid sets PAID, then markPayrollRunUnpaid reverts to APPROVED', async () => {
    const emp = await seedEmployee(3_000_000);
    const run = await createCalculatedRun(emp);
    await payrollService.approvePayrollRun(run.id, emp);

    const paid = await payrollService.markPayrollRunPaid(run.id);
    expect(paid.status).toBe('PAID');
    expect(paid.paidAt).toBeTruthy();

    const [paidRow] = await db.select().from(payrollRuns).where(eq(payrollRuns.id, run.id)).limit(1);
    expect(paidRow.status).toBe('PAID');

    const reverted = await payrollService.markPayrollRunUnpaid(run.id);
    expect(reverted.status).toBe('APPROVED');
    expect(reverted.paidAt).toBeNull();

    const [revertedRow] = await db.select().from(payrollRuns).where(eq(payrollRuns.id, run.id)).limit(1);
    expect(revertedRow.status).toBe('APPROVED');
    expect(revertedRow.paidAt).toBeNull();
  });

  it('rejects approving a run that is not CALCULATED (DRAFT and already-APPROVED)', async () => {
    const emp = await seedEmployee(3_000_000);

    // DRAFT run (created but not calculated) cannot be approved.
    const period = `itest-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const draft = await payrollService.createPayrollRun({
      period,
      periodStart: new Date('2026-05-01'),
      periodEnd: new Date('2026-05-31'),
      calculatedBy: emp,
    });
    seeded.runs.push(draft.id);
    await expect(payrollService.approvePayrollRun(draft.id, emp)).rejects.toThrow(/belum dikalkulasi/i);

    // An already-APPROVED run cannot be approved again (status no longer CALCULATED).
    const run = await createCalculatedRun(emp);
    await payrollService.approvePayrollRun(run.id, emp);
    await expect(payrollService.approvePayrollRun(run.id, emp)).rejects.toThrow(/belum dikalkulasi/i);
  });
});
