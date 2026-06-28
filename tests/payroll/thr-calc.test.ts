import { describe, it, expect } from 'vitest';
import { monthsOfService, isThrEligible, calculateThr } from '@/lib/payroll/thr';

describe('THR — monthsOfService', () => {
  it('counts completed whole months', () => {
    expect(monthsOfService(new Date('2025-01-10'), new Date('2026-04-10'))).toBe(15);
  });

  it('drops the final month when the day-of-month is not yet reached', () => {
    // joined on the 20th, holiday on the 10th -> last month not completed
    expect(monthsOfService(new Date('2026-01-20'), new Date('2026-04-10'))).toBe(2);
  });

  it('returns 0 when the holiday is on or before the join date', () => {
    expect(monthsOfService(new Date('2026-04-10'), new Date('2026-04-01'))).toBe(0);
  });
});

describe('THR — isThrEligible', () => {
  it('requires at least one completed month', () => {
    expect(isThrEligible(0)).toBe(false);
    expect(isThrEligible(1)).toBe(true);
    expect(isThrEligible(15)).toBe(true);
  });
});

describe('THR — calculateThr', () => {
  const SALARY = 5_000_000;

  it('pays a full month for >= 12 months of service', () => {
    expect(calculateThr(SALARY, 12)).toBe(5_000_000);
    expect(calculateThr(SALARY, 30)).toBe(5_000_000);
  });

  it('pro-rates 1 to <12 months as (months/12) * salary', () => {
    expect(calculateThr(SALARY, 6)).toBe(2_500_000);
    expect(calculateThr(6_000_000, 4)).toBe(2_000_000);
  });

  it('pays nothing below the 1-month eligibility floor', () => {
    expect(calculateThr(SALARY, 0)).toBe(0);
  });

  it('returns 0 for a non-positive base salary', () => {
    expect(calculateThr(0, 12)).toBe(0);
    expect(calculateThr(-1, 12)).toBe(0);
  });

  it('rounds to whole rupiah', () => {
    // 5,000,000 * 7/12 = 2,916,666.67 -> 2,916,667
    expect(calculateThr(5_000_000, 7)).toBe(2_916_667);
  });
});
