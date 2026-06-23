import { describe, it, expect } from 'vitest';
import {
  calculateAttendanceDeduction,
  calculateBPJSKesehatan,
  calculateBPJSKetenagakerjaan,
  calculateTax,
  WORKING_DAYS_PER_MONTH,
  PTKP_MONTHLY,
} from './calculations';

const att = (absentDays: number) => ({ workDays: 22 - absentDays, absentDays, lateDays: 0 });

describe('calculateAttendanceDeduction', () => {
  it('deducts nothing when there are no absences', () => {
    expect(calculateAttendanceDeduction(4_400_000, att(0))).toBe(0);
  });

  it('deducts one prorated day per absent day', () => {
    // 4,400,000 / 22 = 200,000 per day
    expect(calculateAttendanceDeduction(4_400_000, att(1))).toBeCloseTo(200_000, 2);
    expect(calculateAttendanceDeduction(4_400_000, att(3))).toBeCloseTo(600_000, 2);
  });

  it('prorates over the configured working-days constant', () => {
    const base = 6_600_000;
    expect(calculateAttendanceDeduction(base, att(2))).toBeCloseTo((base / WORKING_DAYS_PER_MONTH) * 2, 2);
  });
});

describe('calculateBPJSKesehatan', () => {
  it('splits 1% employee / 4% company', () => {
    const r = calculateBPJSKesehatan(5_000_000);
    expect(r.employee).toBeCloseTo(50_000, 2);
    expect(r.company).toBeCloseTo(200_000, 2);
  });
});

describe('calculateBPJSKetenagakerjaan', () => {
  it('splits 2% employee / 3.7% company', () => {
    const r = calculateBPJSKetenagakerjaan(5_000_000);
    expect(r.employee).toBeCloseTo(100_000, 2);
    expect(r.company).toBeCloseTo(185_000, 2);
  });
});

describe('calculateTax (progressive PPh 21)', () => {
  it('is zero when gross income is at or below the monthly PTKP', () => {
    expect(calculateTax(PTKP_MONTHLY)).toBe(0);
    expect(calculateTax(4_000_000)).toBe(0);
    expect(calculateTax(0)).toBe(0);
  });

  it('bracket 1 (5%): taxable up to 5,000,000', () => {
    // gross 9,500,000 → taxable 5,000,000 → 5% = 250,000
    expect(calculateTax(9_500_000)).toBeCloseTo(250_000, 2);
  });

  it('bracket 2 (15%): taxable 5,000,001–25,000,000', () => {
    // gross 14,500,000 → taxable 10,000,000 → 250,000 + 5,000,000*0.15
    expect(calculateTax(14_500_000)).toBeCloseTo(1_000_000, 2);
  });

  it('bracket 3 (25%): taxable 25,000,001–50,000,000', () => {
    // gross 34,500,000 → taxable 30,000,000 → 250,000 + 3,000,000 + 5,000,000*0.25
    expect(calculateTax(34_500_000)).toBeCloseTo(4_500_000, 2);
  });

  it('bracket 4 (30%): taxable above 50,000,000', () => {
    // gross 64,500,000 → taxable 60,000,000 → 250,000 + 3,000,000 + 6,250,000 + 10,000,000*0.30
    expect(calculateTax(64_500_000)).toBeCloseTo(12_500_000, 2);
  });

  it('is continuous across bracket boundaries', () => {
    // taxable exactly 25,000,000 → 250,000 + 20,000,000*0.15 = 3,250,000
    expect(calculateTax(PTKP_MONTHLY + 25_000_000)).toBeCloseTo(3_250_000, 2);
    // taxable exactly 50,000,000 → 250,000 + 3,000,000 + 25,000,000*0.25 = 9,500,000
    expect(calculateTax(PTKP_MONTHLY + 50_000_000)).toBeCloseTo(9_500_000, 2);
  });
});
