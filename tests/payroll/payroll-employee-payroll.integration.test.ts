import { describe, it, expect } from 'vitest';
import { getEmployeePayroll, assertNoFinalPayrollForEmployee } from '@/services/payroll/payroll-config';

/**
 * Integration tests for the employee-payroll read/guard paths against a real DB.
 */
describe('payroll-config employee payroll (real DB, read/guard)', () => {
  const NONE = 'itest-nonexistent';

  it('getEmployeePayroll: returns nothing for an employee with no active assignment', async () => {
    const r = await getEmployeePayroll(NONE);
    expect(r ?? null).toBeNull();
  });

  it('assertNoFinalPayrollForEmployee: resolves when there is no approved/paid payroll', async () => {
    await assertNoFinalPayrollForEmployee(NONE);
    expect(true).toBe(true);
  });
});
