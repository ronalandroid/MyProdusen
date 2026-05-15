import { describe, expect, it } from 'vitest';
import { isDateInsidePayrollPeriod, isPayrollStatusLocked } from '@/lib/payroll/period-lock';

describe('payroll period lock policy', () => {
  it('locks records when payroll status is approved or paid', () => {
    expect(isPayrollStatusLocked('APPROVED')).toBe(true);
    expect(isPayrollStatusLocked('PAID')).toBe(true);
    expect(isPayrollStatusLocked('DRAFT')).toBe(false);
  });

  it('matches dates inside inclusive payroll period', () => {
    expect(isDateInsidePayrollPeriod(new Date('2026-05-15'), new Date('2026-05-01'), new Date('2026-05-31'))).toBe(true);
    expect(isDateInsidePayrollPeriod(new Date('2026-06-01'), new Date('2026-05-01'), new Date('2026-05-31'))).toBe(false);
  });
});
