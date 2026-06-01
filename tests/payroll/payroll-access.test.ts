import { afterEach, describe, expect, it } from 'vitest';
import { assertPayrollAccess, canAccessPayroll } from '@/lib/payroll/access';

describe('payroll access policy', () => {
  const originalModule = process.env.PAYROLL_MODULE_ENABLED;
  const originalMutation = process.env.PAYROLL_MUTATION_ENABLED;

  afterEach(() => {
    process.env.PAYROLL_MODULE_ENABLED = originalModule;
    process.env.PAYROLL_MUTATION_ENABLED = originalMutation;
  });

  it('blocks all payroll access when module flag is disabled', () => {
    process.env.PAYROLL_MODULE_ENABLED = 'false';
    process.env.PAYROLL_MUTATION_ENABLED = 'true';

    expect(canAccessPayroll('SUPERADMIN', 'read')).toBe(false);
    expect(() => assertPayrollAccess('SUPERADMIN', 'read')).toThrow('PAYROLL_FORBIDDEN');
  });

  it('allows employee own payroll only', () => {
    process.env.PAYROLL_MODULE_ENABLED = 'true';
    process.env.PAYROLL_MUTATION_ENABLED = 'true';

    expect(canAccessPayroll('EMPLOYEE', 'readOwn')).toBe(true);
    expect(canAccessPayroll('EMPLOYEE', 'read')).toBe(false);
    expect(canAccessPayroll('EMPLOYEE', 'export')).toBe(false);
  });

  it('allows leader own payroll only', () => {
    process.env.PAYROLL_MODULE_ENABLED = 'true';
    process.env.PAYROLL_MUTATION_ENABLED = 'true';

    expect(canAccessPayroll('LEADER', 'readOwn')).toBe(true);
    expect(canAccessPayroll('LEADER', 'read')).toBe(false);
    expect(canAccessPayroll('LEADER', 'export')).toBe(false);
  });

  it('allows superadmin full payroll mutations only when mutation flag is enabled', () => {
    process.env.PAYROLL_MODULE_ENABLED = 'true';
    process.env.PAYROLL_MUTATION_ENABLED = 'false';

    expect(canAccessPayroll('SUPERADMIN', 'approve')).toBe(true);
    expect(() => assertPayrollAccess('SUPERADMIN', 'approve')).toThrow('PAYROLL_MUTATION_DISABLED');

    process.env.PAYROLL_MUTATION_ENABLED = 'true';
    expect(canAccessPayroll('SUPERADMIN', 'readOwn')).toBe(true);
    expect(() => assertPayrollAccess('SUPERADMIN', 'approve')).not.toThrow();
  });

  it('blocks historical Admin HR payroll access when payroll is enabled', () => {
    process.env.PAYROLL_MODULE_ENABLED = 'true';
    process.env.PAYROLL_MUTATION_ENABLED = 'true';

    expect(canAccessPayroll('ADMIN_HR', 'read')).toBe(false);
    expect(canAccessPayroll('ADMIN_HR', 'mutate')).toBe(false);
    expect(canAccessPayroll('ADMIN_HR', 'export')).toBe(false);
    expect(canAccessPayroll('ADMIN_HR', 'approve')).toBe(false);
    expect(canAccessPayroll('ADMIN_HR', 'pay')).toBe(false);
  });
});
