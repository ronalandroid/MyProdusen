/**
 * Late clock-out policy (keputusan owner #4, 2026-07-14): lupa clock-out tetap
 * boleh clock-out + selfie, tapi melewati masa tenggang wajib alasan logis dan
 * masuk antrean review Superadmin (exception LATE_CORRECTION).
 */

export const LATE_CHECKOUT_GRACE_MINUTES = 60;

export const LATE_CHECKOUT_REASON_REQUIRED =
  'Clock-out Anda melewati jam pulang lebih dari 1 jam. Tulis alasan singkat keterlambatannya — absen pulang tetap tercatat dan Superadmin akan meninjaunya.';

/** How far back an open (un-clocked-out) attendance can still be closed. */
export const OPEN_ATTENDANCE_LOOKBACK_HOURS = 48;

/**
 * Shift end as an absolute time anchored to the check-in date. An end time at
 * or before the start time means the shift crosses midnight (shift malam).
 */
export function resolveShiftEndFor(checkInTime: Date, startTime: string, endTime: string): Date {
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);

  const start = new Date(checkInTime);
  start.setHours(startHours, startMinutes, 0, 0);
  const end = new Date(checkInTime);
  end.setHours(endHours, endMinutes, 0, 0);

  if (end.getTime() <= start.getTime()) {
    end.setDate(end.getDate() + 1);
  }
  return end;
}

export function isLateCheckOut(now: Date, shiftEnd: Date): boolean {
  return now.getTime() - shiftEnd.getTime() > LATE_CHECKOUT_GRACE_MINUTES * 60_000;
}

export function lateMinutes(now: Date, shiftEnd: Date): number {
  return Math.max(0, Math.round((now.getTime() - shiftEnd.getTime()) / 60_000));
}
