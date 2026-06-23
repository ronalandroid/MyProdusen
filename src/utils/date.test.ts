import { describe, expect, it } from 'vitest';
import {
  calculateEarlyLeaveMinutes,
  calculateLateMinutes,
  calculateMinutesDifference,
  dateRangesOverlap,
  formatDate,
  formatDateTime,
  formatTime,
  getCurrentPeriod,
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

  it('reports non-overlapping ranges', () => {
    expect(
      dateRangesOverlap(
        new Date(2026, 0, 1),
        new Date(2026, 0, 5),
        new Date(2026, 0, 6),
        new Date(2026, 0, 7)
      )
    ).toBe(false);
  });

  it('formats a date from both Date and string input', () => {
    expect(formatDate(new Date(2026, 5, 15))).toContain('2026');
    expect(formatDate('2026-06-15')).toContain('2026');
  });

  it('formats a datetime including the year', () => {
    expect(formatDateTime(new Date(2026, 5, 15, 9, 30))).toContain('2026');
    expect(formatDateTime('2026-06-15T09:30:00')).toContain('2026');
  });

  it('formats a time as a non-empty digit string', () => {
    const t = formatTime(new Date(2026, 5, 15, 9, 30));
    expect(t).toMatch(/\d/);
    expect(formatTime('2026-06-15T09:30:00')).toMatch(/\d/);
  });

  it('returns the current period as YYYY-MM', () => {
    expect(getCurrentPeriod()).toMatch(/^\d{4}-\d{2}$/);
  });
});
