import { describe, it, expect } from 'vitest';
import {
  getExportMaxRows, startOfMonthUtc, endOfDayUtc, startOfDayUtc,
  normalizeStatus, normalizeGeoStatus, clampPageSize, clampPage,
  fetchAttendanceHistoryPage, fetchAttendanceHistoryForExport, fetchAttendanceSummary,
} from '@/lib/reports/attendance-history';

/**
 * Tests for attendance-history pure helpers (date/normalize/clamp) and the three
 * fetch functions over an empty far-future period (query paths, no seeding).
 */
describe('attendance-history helpers + fetchers', () => {
  it('pure helpers cover the date/normalize/clamp branches', () => {
    expect(getExportMaxRows()).toBeGreaterThanOrEqual(1);

    const d = new Date(Date.UTC(2099, 2, 15, 10, 30));
    expect(startOfMonthUtc(d).getUTCDate()).toBe(1);
    expect(startOfDayUtc(d).getUTCHours()).toBe(0);
    expect(endOfDayUtc(d).getUTCHours()).toBe(23);

    expect(normalizeStatus(null)).toBeUndefined();
    expect(normalizeStatus('not-a-status')).toBeUndefined();
    expect(normalizeGeoStatus(null)).toBeUndefined();
    expect(normalizeGeoStatus('not-a-geo')).toBeUndefined();

    expect(clampPage(-5)).toBeGreaterThanOrEqual(1);
    expect(clampPage(3)).toBe(3);
    expect(typeof clampPageSize(999999)).toBe('number');
    expect(typeof clampPageSize('abc')).toBe('number');
  });

  it('fetchers return shapes for an empty period', async () => {
    const filters = { from: new Date(Date.UTC(2099, 2, 1)), to: new Date(Date.UTC(2099, 2, 28)) } as never;

    const page = await fetchAttendanceHistoryPage(filters, { page: 1, pageSize: 10 });
    expect(page).toBeDefined();

    const exported = await fetchAttendanceHistoryForExport(filters, { limit: 100 });
    expect(Array.isArray(exported.rows)).toBe(true);

    const summary = await fetchAttendanceSummary(filters);
    expect(summary).toBeDefined();
  });
});
