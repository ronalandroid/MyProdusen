import { describe, it, expect, afterAll } from 'vitest';
import { db, users, employees, employeePayrolls, payrollRuns, payrollItems, payrollStructures } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { createStructure, assignPayrollToEmployee } from '@/services/payroll/payroll-config';
import { createPayrollRun, getEmployeePayrollItems } from '@/services/payroll/payroll-period';
import { calculatePayroll } from '@/services/payroll/payroll-calculator';

/**
 * Deep-seed integration test for calculatePayroll against a real DB. Seeds an
 * active employee, a salary structure, a payroll assignment, and a DRAFT run for
 * a unique far-future period, then runs the calculator and asserts an item was
 * produced. All seeded rows are cleaned up.
 */
describe('calculatePayroll (real DB, deep seed)', () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const empId = `itest-pc-${suffix}`;
  const year = 9100 + Math.floor(Math.random() * 800);
  let structureId: string | undefined;
  let runId: string | undefined;

  afterAll(async () => {
    await db.delete(payrollItems).where(eq(payrollItems.employeeId, empId));
    if (runId) await db.delete(payrollRuns).where(eq(payrollRuns.id, runId));
    await db.delete(employeePayrolls).where(eq(employeePayrolls.employeeId, empId));
    if (structureId) await db.delete(payrollStructures).where(eq(payrollStructures.id, structureId));
    await db.delete(employees).where(eq(employees.id, empId));
    await db.delete(users).where(eq(users.id, empId));
  });

  it('computes a payroll item for an active assigned employee (base salary)', async () => {
    await db.insert(users).values({
      id: empId, email: `${empId}@t.local`, username: empId, password: 'x', role: 'EMPLOYEE', isActive: true,
    });
    await db.insert(employees).values({
      id: empId, nip: `NIP-${empId}`, userId: empId, fullName: 'IT PC', email: `${empId}@t.local`,
      status: 'ACTIVE', position: 'Staff',
    });

    const structure = await createStructure({ name: `itest struct ${suffix}`, baseSalary: 5_000_000 });
    structureId = structure.id;
    await assignPayrollToEmployee({
      employeeId: empId, structureId, baseSalary: 5_000_000, effectiveDate: new Date(year, 0, 1),
    });

    const run = await createPayrollRun({
      period: `${year}-03`,
      periodStart: new Date(year, 2, 1),
      periodEnd: new Date(year, 2, 31),
      calculatedBy: 'itest',
    });
    runId = run.id;

    await calculatePayroll(runId);

    const items = await getEmployeePayrollItems(empId);
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThanOrEqual(1);
  });
});
