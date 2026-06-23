/**
 * Pure payroll calculation formulas (Indonesian PPh 21 tax, BPJS, attendance
 * deduction). Extracted from PayrollService so the financial math is isolated
 * and exhaustively unit-testable without any database setup.
 *
 * Behaviour is identical to the previous private PayrollService methods.
 */

/** Working days assumed per month when prorating salary. */
export const WORKING_DAYS_PER_MONTH = 22;

/** Monthly PTKP (tax-free income) — Rp 54,000,000 / year. */
export const PTKP_MONTHLY = 4_500_000;

export interface BpjsSplit {
  employee: number;
  company: number;
}

export interface AttendanceData {
  workDays: number;
  absentDays: number;
  lateDays: number;
}

/** Deduct one day of salary per absent day (salary prorated over 22 work days). */
export function calculateAttendanceDeduction(
  baseSalary: number,
  attendanceData: AttendanceData,
): number {
  const dailySalary = baseSalary / WORKING_DAYS_PER_MONTH;
  return attendanceData.absentDays * dailySalary;
}

/** BPJS Kesehatan: 5% total — 1% employee, 4% company. */
export function calculateBPJSKesehatan(baseSalary: number): BpjsSplit {
  return {
    employee: baseSalary * 0.01,
    company: baseSalary * 0.04,
  };
}

/** BPJS Ketenagakerjaan: 2% employee, 3.7% company. */
export function calculateBPJSKetenagakerjaan(baseSalary: number): BpjsSplit {
  return {
    employee: baseSalary * 0.02,
    company: baseSalary * 0.037,
  };
}

/**
 * Simplified progressive PPh 21 on monthly gross income, after the monthly
 * PTKP allowance. Brackets: 5% / 15% / 25% / 30%.
 */
export function calculateTax(grossIncome: number): number {
  const taxableIncome = Math.max(0, grossIncome - PTKP_MONTHLY);

  if (taxableIncome <= 5_000_000) {
    return taxableIncome * 0.05;
  }
  if (taxableIncome <= 25_000_000) {
    return 5_000_000 * 0.05 + (taxableIncome - 5_000_000) * 0.15;
  }
  if (taxableIncome <= 50_000_000) {
    return 5_000_000 * 0.05 + 20_000_000 * 0.15 + (taxableIncome - 25_000_000) * 0.25;
  }
  return (
    5_000_000 * 0.05 +
    20_000_000 * 0.15 +
    25_000_000 * 0.25 +
    (taxableIncome - 50_000_000) * 0.3
  );
}
