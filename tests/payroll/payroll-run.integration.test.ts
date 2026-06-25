import { describe, it, expect } from 'vitest';
import {
  approvePayrollRun,
  markPayrollRunPaid,
  markPayrollRunUnpaid,
  getPayrollRuns,
  getPayrollSummary,
  getPayrollRunById,
  getEmployeePayrollItems,
} from '@/services/payroll/payroll-period';

/**
 * Integration tests for the payroll-run lifecycle against a real DB. Covers the
 * not-found guards (approve/pay/unpay/getById) and the list/summary read paths
 * via non-existent ids — no seeding, no writes.
 */
describe('payroll run lifecycle integration (real DB, guard paths)', () => {
  const NONE = 'itest-nonexistent-run';

  it('getPayrollRuns: returns an array', async () => {
    expect(Array.isArray(await getPayrollRuns())).toBe(true);
  });

  it('getPayrollSummary: returns a value', async () => {
    expect(await getPayrollSummary()).toBeDefined();
  });

  it('getPayrollRunById: throws not-found for a missing run', async () => {
    await expect(getPayrollRunById(NONE)).rejects.toThrow(/tidak ditemukan/i);
  });

  it('approvePayrollRun: throws not-found for a missing run', async () => {
    await expect(approvePayrollRun(NONE, 'itest-actor')).rejects.toThrow(/tidak ditemukan/i);
  });

  it('markPayrollRunPaid: throws not-found for a missing run', async () => {
    await expect(markPayrollRunPaid(NONE)).rejects.toThrow(/tidak ditemukan/i);
  });

  it('markPayrollRunUnpaid: throws not-found for a missing run', async () => {
    await expect(markPayrollRunUnpaid(NONE)).rejects.toThrow(/tidak ditemukan/i);
  });

  it('getEmployeePayrollItems: returns an array for an unknown employee', async () => {
    expect(Array.isArray(await getEmployeePayrollItems(NONE))).toBe(true);
  });
});
