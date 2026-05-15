import { describe, expect, it } from 'vitest';
import { canIncludeOvertimeInPayroll, calculateOvertimeHourlyRate } from '@/lib/overtime/payroll-integration';

describe('overtime payroll integration', () => {
  it('includes only approved unpaid overtime in payroll', () => {
    expect(canIncludeOvertimeInPayroll({ status: 'APPROVED', isPaid: false })).toBe(true);
    expect(canIncludeOvertimeInPayroll({ status: 'PENDING', isPaid: false })).toBe(false);
    expect(canIncludeOvertimeInPayroll({ status: 'APPROVED', isPaid: true })).toBe(false);
  });

  it('uses 173-hour monthly divisor for overtime hourly rate', () => {
    expect(calculateOvertimeHourlyRate(3_460_000)).toBe(20_000);
  });
});
