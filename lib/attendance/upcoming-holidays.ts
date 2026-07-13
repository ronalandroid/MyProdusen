/**
 * Employee-facing holiday selection (kebijakan owner #4: kalender libur
 * "sync ke semua akun"). Superadmin sudah bisa input + payroll sudah
 * menghormatinya; ini bagian agar karyawan bisa MELIHAT libur mendatang.
 */

export type CalendarDayType = 'WORKDAY' | 'HOLIDAY' | 'COMPANY_HOLIDAY' | 'SPECIAL_WORKDAY';

export interface CalendarDay {
  id: string;
  date: string; // YYYY-MM-DD
  name: string;
  type: CalendarDayType;
  isPaidHoliday: boolean;
}

export const DEFAULT_UPCOMING_LIMIT = 8;

/** Only actual days off — plain WORKDAY / SPECIAL_WORKDAY are not "libur". */
export function isHolidayType(type: CalendarDayType): boolean {
  return type === 'HOLIDAY' || type === 'COMPANY_HOLIDAY';
}

/**
 * Upcoming holidays on/after `todayIso` (YYYY-MM-DD), soonest first, capped.
 * Dates are compared as strings — safe because ISO date strings sort
 * chronologically and avoids timezone drift from Date parsing.
 */
export function selectUpcomingHolidays(
  days: CalendarDay[],
  todayIso: string,
  limit: number = DEFAULT_UPCOMING_LIMIT,
): CalendarDay[] {
  return days
    .filter((day) => isHolidayType(day.type) && day.date >= todayIso)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, Math.max(0, limit));
}
