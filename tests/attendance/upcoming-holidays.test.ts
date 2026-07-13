import { describe, expect, it } from 'vitest';
import { selectUpcomingHolidays, isHolidayType, type CalendarDay } from '@/lib/attendance/upcoming-holidays';

const days: CalendarDay[] = [
  { id: '1', date: '2026-05-01', name: 'Hari Buruh (lewat)', type: 'HOLIDAY', isPaidHoliday: true },
  { id: '2', date: '2026-07-20', name: 'Cuti Bersama', type: 'COMPANY_HOLIDAY', isPaidHoliday: true },
  { id: '3', date: '2026-07-15', name: 'Lembur wajib', type: 'SPECIAL_WORKDAY', isPaidHoliday: false },
  { id: '4', date: '2026-08-17', name: 'Kemerdekaan', type: 'HOLIDAY', isPaidHoliday: true },
  { id: '5', date: '2026-07-14', name: 'Hari kerja biasa', type: 'WORKDAY', isPaidHoliday: false },
];

describe('selectUpcomingHolidays', () => {
  it('returns only holiday-type days on/after today, soonest first', () => {
    const result = selectUpcomingHolidays(days, '2026-07-14');
    expect(result.map((d) => d.id)).toEqual(['2', '4']);
  });

  it('excludes past holidays', () => {
    const result = selectUpcomingHolidays(days, '2026-07-14');
    expect(result.find((d) => d.id === '1')).toBeUndefined();
  });

  it('excludes WORKDAY and SPECIAL_WORKDAY', () => {
    const result = selectUpcomingHolidays(days, '2026-01-01');
    expect(result.every((d) => isHolidayType(d.type))).toBe(true);
    expect(result.find((d) => d.type === 'SPECIAL_WORKDAY')).toBeUndefined();
  });

  it('includes a holiday that falls exactly today', () => {
    const result = selectUpcomingHolidays(days, '2026-07-20');
    expect(result[0]?.id).toBe('2');
  });

  it('caps the list at the given limit', () => {
    const result = selectUpcomingHolidays(days, '2026-01-01', 1);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });
});
