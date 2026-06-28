/**
 * THR (Tunjangan Hari Raya) calculation — Indonesia's mandatory religious-holiday
 * allowance, per Permenaker No. 6/2016.
 *
 * Rules:
 *  - Continuous service >= 12 months  -> 1x monthly salary.
 *  - Service of 1 to <12 months       -> pro-rata: (months / 12) * monthly salary.
 *  - Service < 1 month                -> not eligible (0).
 *
 * Pure functions only — no DB, no side effects — so the legal math is trivially
 * testable and reused by the THR service.
 */

export const THR_MIN_ELIGIBLE_MONTHS = 1;
export const THR_FULL_MONTHS = 12;

/**
 * Completed whole months of continuous service between joinDate and the holiday.
 * A partial final month does not count (Permenaker counts completed months).
 */
export function monthsOfService(joinDate: Date, holidayDate: Date): number {
  if (holidayDate.getTime() <= joinDate.getTime()) return 0;

  let months =
    (holidayDate.getFullYear() - joinDate.getFullYear()) * 12 +
    (holidayDate.getMonth() - joinDate.getMonth());

  // Drop the final month if the day-of-month hasn't been reached yet.
  if (holidayDate.getDate() < joinDate.getDate()) {
    months -= 1;
  }

  return Math.max(0, months);
}

/** Whether an employee qualifies for THR at all (>= 1 completed month). */
export function isThrEligible(monthsServed: number): boolean {
  return monthsServed >= THR_MIN_ELIGIBLE_MONTHS;
}

/**
 * THR amount in whole rupiah. Returns 0 when not eligible. Caps the pro-rata
 * factor at 1 (>= 12 months = a full month's salary).
 */
export function calculateThr(baseSalary: number, monthsServed: number): number {
  if (!isThrEligible(monthsServed) || baseSalary <= 0) return 0;
  const factor = Math.min(monthsServed, THR_FULL_MONTHS) / THR_FULL_MONTHS;
  return Math.round(baseSalary * factor);
}
