export type AttendanceDayStatus = 'PRESENT' | 'HOLIDAY' | 'LEAVE' | 'ABSENT' | 'LATE' | 'HALF_DAY';
export type AttendanceCalendarDay = { date: string; status: AttendanceDayStatus };

export function mapDayStatus(input: { present?: boolean; isHoliday?: boolean; approvedLeave?: boolean; absent?: boolean; late?: boolean; halfDay?: boolean }): AttendanceDayStatus {
  if (input.isHoliday) return 'HOLIDAY';
  if (input.approvedLeave) return 'LEAVE';
  if (input.halfDay) return 'HALF_DAY';
  if (input.late) return 'LATE';
  if (input.present) return 'PRESENT';
  return 'ABSENT';
}

function keepsStreak(status: AttendanceDayStatus) {
  return status === 'PRESENT' || status === 'HOLIDAY' || status === 'LEAVE' || status === 'LATE' || status === 'HALF_DAY';
}

function countsAsAttendance(status: AttendanceDayStatus) {
  return status === 'PRESENT' || status === 'LATE' || status === 'HALF_DAY';
}

export function calculateBestStreak(days: AttendanceCalendarDay[]) {
  let current = 0;
  let best = 0;
  for (const day of days) {
    if (!keepsStreak(day.status)) {
      current = 0;
      continue;
    }
    current += 1;
    best = Math.max(best, current);
  }
  return best;
}

export function calculateCurrentStreak(days: AttendanceCalendarDay[]) {
  let current = 0;
  for (const day of [...days].reverse()) {
    if (!keepsStreak(day.status)) break;
    if (countsAsAttendance(day.status)) current += 1;
  }
  return current;
}

async function getMonthlyAttendanceCalendar(employeeId: string, month: string) {
  void employeeId;
  void month;
  return [] as AttendanceCalendarDay[];
}
