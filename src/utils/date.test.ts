import { describe, expect, it } from 'vitest';
import {
  calculateEarlyLeaveMinutes,
  calculateLateMinutes,
  calculateMinutesDifference,
  dateRangesOverlap,
  getPeriodDateRange,
} from './date';

describe('date utilities', () => {
  it('calculates minute difference', () => {
    const start = new Date(2026, 0, 1, 8, 0);
    const end = new Date(2026, 0, 1, 9, 30);

    expect(calculateMinutesDifference(start, end)).toBe(90);
  });

  it('calculates late minutes against shift start', () => {
    expect(calculateLateMinutes(new Date(2026, 0, 1, 8, 15), '08:00')).toBe(15);
    expect(calculateLateMinutes(new Date(2026, 0, 1, 7, 55), '08:00')).toBe(0);
  });

  it('calculates early leave minutes against shift end', () => {
    expect(calculateEarlyLeaveMinutes(new Date(2026, 0, 1, 16, 45), '17:00')).toBe(15);
    expect(calculateEarlyLeaveMinutes(new Date(2026, 0, 1, 17, 5), '17:00')).toBe(0);
  });

  it('returns monthly period range', () => {
    const { start, end } = getPeriodDateRange('2026-02');

    expect(start.getFullYear()).toBe(2026);
    expect(start.getMonth()).toBe(1);
    expect(start.getDate()).toBe(1);
    expect(end.getDate()).toBe(28);
  });

  it('treats touching ranges as overlap', () => {
    expect(
      dateRangesOverlap(
        new Date(2026, 0, 1),
        new Date(2026, 0, 5),
        new Date(2026, 0, 5),
        new Date(2026, 0, 7)
      )
    ).toBe(true);
  });
});
