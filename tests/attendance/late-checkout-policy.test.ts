import { describe, expect, it } from 'vitest';
import {
  LATE_CHECKOUT_GRACE_MINUTES,
  isLateCheckOut,
  resolveShiftEndFor,
} from '@/lib/attendance/late-checkout-policy';

describe('late-checkout policy', () => {
  it('resolves shift end on the same day for a normal day shift', () => {
    const checkIn = new Date('2026-07-14T08:05:00');
    const end = resolveShiftEndFor(checkIn, '08:00', '17:00');
    expect(end.getDate()).toBe(checkIn.getDate());
    expect(end.getHours()).toBe(17);
  });

  it('rolls shift end to the next day for an overnight shift', () => {
    const checkIn = new Date('2026-07-14T22:10:00');
    const end = resolveShiftEndFor(checkIn, '22:00', '06:00');
    expect(end.getDate()).toBe(checkIn.getDate() + 1);
    expect(end.getHours()).toBe(6);
  });

  it('is not late within the grace window, late after it', () => {
    const shiftEnd = new Date('2026-07-14T17:00:00');
    const insideGrace = new Date(shiftEnd.getTime() + (LATE_CHECKOUT_GRACE_MINUTES - 1) * 60_000);
    const pastGrace = new Date(shiftEnd.getTime() + (LATE_CHECKOUT_GRACE_MINUTES + 1) * 60_000);
    expect(isLateCheckOut(insideGrace, shiftEnd)).toBe(false);
    expect(isLateCheckOut(pastGrace, shiftEnd)).toBe(true);
  });
});
