import { describe, it, expect, afterEach } from 'vitest';
import {
  db,
  cashAdvances,
  payrollItems,
  payrollRuns,
  employees,
  employeePayrolls,
  payrollStructures,
  users,
} from '@/lib/db';
import { and, eq, inArray } from 'drizzle-orm';
import { payrollService } from '@/services/payroll/payroll.service';
import { requestAdvance, approveAdvance } from '@/src/services/payroll/cash-advance.service';

/**
 * Kasbon (cash advance) repayment integrates into payroll as a POST-TAX net
 * deduction: tax/BPJS stay computed on gross (unchanged), the active monthly
 * installment only reduces take-home. The outstanding balance settles when the
 * run is APPROVED (one-time CALCULATED->APPROVED transition), not at calc time.
 *
 * Parallel-safety note: calculatePayroll scans EVERY active assigned employee,
 * and approvePayrollRun settles every kasbon installment in the run. Under
 * vitest's parallel workers against the shared DB, another payroll test's
 * approve could otherwise settle this test's advance. So the settlement case
 * uses a borrower with no payroll assignment (invisible to the global scan),
 * and the deduction case uses a large-balance advance whose per-month
 * installment stays stable even if the suite settles a few months against it.
 */
describe('Kasbon -> payroll auto-deduction', () => {
  const ids = {
    structure: `cad_str_${Date.now()}`,
  };
  const userIds: string[] = [];
  const employeeIds: string[] = [];
  const runIds: string[] = [];

  async function seedEmployeeWithPayroll(suffix: string, baseSalary: number) {
    const id = `cad_emp_${suffix}_${Date.now()}`;
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
      fullName: 'Kasbon Test Employee',
      email: `${id}@myprodusen.local`,
      status: 'ACTIVE',
      position: 'Staff',
    });
    await db.insert(employeePayrolls).values({
      id: `cad_pay_${id}`,
      employeeId: id,
      structureId: ids.structure,
      baseSalary,
      effectiveDate: new Date('2026-05-01'),
    });
    userIds.push(id);
    employeeIds.push(id);
    return id;
  }

  // No employeePayroll/structure => excluded from calculatePayroll's active
  // assigned-employee join, so no other concurrent run can settle its advance.
  async function seedBareEmployee(suffix: string) {
    const id = `cad_emp_${suffix}_${Date.now()}`;
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
      fullName: 'Kasbon Settle Employee',
      email: `${id}@myprodusen.local`,
      status: 'ACTIVE',
      position: 'Staff',
    });
    userIds.push(id);
    employeeIds.push(id);
    return id;
  }

  afterEach(async () => {
    for (const runId of runIds) {
      await db.delete(payrollItems).where(eq(payrollItems.runId, runId));
      await db.delete(payrollRuns).where(eq(payrollRuns.id, runId));
    }
    if (employeeIds.length) {
      await db.delete(cashAdvances).where(inArray(cashAdvances.employeeId, employeeIds));
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

  it('deducts the active installment from net pay (post-tax) at calculation time', async () => {
    await db.insert(payrollStructures).values({
      id: ids.structure,
      name: `Structure ${ids.structure}`,
      baseSalary: 3_000_000,
      isActive: true,
    });
    const empId = await seedEmployeeWithPayroll('borrower', 3_000_000);

    // 60,000,000 over 60 installments => monthlyDeduction 1,000,000. The large
    // balance keeps the per-month installment stable even if the parallel suite
    // settles a few months against this employee mid-run.
    const req = await requestAdvance({
      employeeId: empId,
      amount: 60_000_000,
      reason: 'Renovasi rumah',
      installments: 60,
      requestedBy: empId,
    });
    await approveAdvance(req.id, 'itest-admin');

    const runId = `cad_run_${Date.now()}`;
    runIds.push(runId);
    // Synthetic far-future period avoids the unique-period clash with real dev data.
    await db.insert(payrollRuns).values({
      id: runId,
      period: '3026-07',
      periodStart: new Date('3026-07-01'),
      periodEnd: new Date('3026-07-31'),
      status: 'DRAFT',
      calculatedBy: 'itest-admin',
    });

    await payrollService.calculatePayroll(runId);

    const [item] = await db
      .select()
      .from(payrollItems)
      .where(and(eq(payrollItems.runId, runId), eq(payrollItems.employeeId, empId)))
      .limit(1);

    expect(item).toBeDefined();
    // The installment is recorded against the right advance...
    expect(item.cashAdvanceDeduction).toBe(1_000_000);
    expect(item.cashAdvanceId).toBe(req.id);
    // ...folded into total deductions (no other deduction components seeded)...
    expect(item.totalDeductions).toBe(
      item.taxAmount +
        item.bpjsKesehatanEmployee +
        item.bpjsKetenagakerjaanEmployee +
        item.attendanceDeduction +
        item.cashAdvanceDeduction
    );
    // ...and net = gross - total deductions still holds (post-tax reduction).
    expect(item.netPay).toBe(item.grossPay - item.totalDeductions);
  });

  it('leaves pay unchanged for an employee with no active advance', async () => {
    await db.insert(payrollStructures).values({
      id: ids.structure,
      name: `Structure ${ids.structure}`,
      baseSalary: 3_000_000,
      isActive: true,
    });
    const empId = await seedEmployeeWithPayroll('noadvance', 3_000_000);

    const runId = `cad_run_${Date.now()}`;
    runIds.push(runId);
    await db.insert(payrollRuns).values({
      id: runId,
      period: '3026-08',
      periodStart: new Date('3026-08-01'),
      periodEnd: new Date('3026-08-31'),
      status: 'DRAFT',
      calculatedBy: 'itest-admin',
    });

    await payrollService.calculatePayroll(runId);

    const [item] = await db
      .select()
      .from(payrollItems)
      .where(and(eq(payrollItems.runId, runId), eq(payrollItems.employeeId, empId)))
      .limit(1);

    expect(item).toBeDefined();
    expect(item.cashAdvanceDeduction).toBe(0);
    expect(item.cashAdvanceId).toBeNull();
    expect(item.netPay).toBe(item.grossPay - item.totalDeductions);
  });

  it('settles the outstanding balance once when the run is approved', async () => {
    // Isolated borrower: no payroll assignment, so no concurrent run's scan can
    // include it -> its advance is only ever settled by this test's approve.
    const empId = await seedBareEmployee('settle');

    const req = await requestAdvance({
      employeeId: empId,
      amount: 3_000_000,
      reason: 'Biaya sekolah anak',
      installments: 3,
      requestedBy: empId,
    });
    await approveAdvance(req.id, 'itest-admin');

    const runId = `cad_run_${Date.now()}`;
    runIds.push(runId);
    await db.insert(payrollRuns).values({
      id: runId,
      period: '3026-09',
      periodStart: new Date('3026-09-01'),
      periodEnd: new Date('3026-09-30'),
      status: 'CALCULATED',
      calculatedBy: 'itest-admin',
    });
    // Hand-build the single line item the way calculatePayroll would, so the
    // settlement path runs deterministically without the global employee scan.
    await db.insert(payrollItems).values({
      id: `cad_item_${Date.now()}`,
      runId,
      employeeId: empId,
      baseSalary: 3_000_000,
      grossPay: 3_000_000,
      netPay: 2_000_000,
      cashAdvanceDeduction: 1_000_000,
      cashAdvanceId: req.id,
    });

    const [before] = await db.select().from(cashAdvances).where(eq(cashAdvances.id, req.id)).limit(1);
    expect(before.remainingBalance).toBe(3_000_000);

    await payrollService.approvePayrollRun(runId, 'itest-admin');

    const [after] = await db.select().from(cashAdvances).where(eq(cashAdvances.id, req.id)).limit(1);
    expect(after.remainingBalance).toBe(2_000_000);
    expect(after.status).toBe('APPROVED');
  });
});
