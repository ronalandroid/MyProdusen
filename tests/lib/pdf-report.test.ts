import { describe, it, expect } from 'vitest';
import {
  assertPdfReportAccess,
  getPdfReportMaxRows,
  defaultCurrentMonthRange,
  getPdfReportMaxDateRangeMonths,
  validatePdfDateRange,
  removeSelfieFields,
  buildPdfDocument,
} from '@/lib/reports/pdf-report';

/**
 * Unit tests for the pure pdf-report helpers — access guard, config getters,
 * date-range validation branches, selfie-field stripping, and the in-memory PDF
 * builder (no DB, no filesystem).
 */
describe('pdf-report pure helpers', () => {
  it('assertPdfReportAccess: only SUPERADMIN is allowed', () => {
    expect(() => assertPdfReportAccess('SUPERADMIN')).not.toThrow();
    expect(() => assertPdfReportAccess('EMPLOYEE')).toThrow(/FORBIDDEN/);
    expect(() => assertPdfReportAccess('LEADER')).toThrow(/FORBIDDEN/);
  });

  it('config getters return sane numbers', () => {
    expect(getPdfReportMaxRows()).toBeGreaterThanOrEqual(1);
    expect(getPdfReportMaxDateRangeMonths()).toBeGreaterThanOrEqual(1);
  });

  it('defaultCurrentMonthRange: spans the given month', () => {
    const { from, to } = defaultCurrentMonthRange(new Date(2099, 5, 15));
    expect(from.getMonth()).toBe(5);
    expect(from.getDate()).toBe(1);
    expect(to >= from).toBe(true);
  });

  it('validatePdfDateRange: accepts a valid range and rejects the bad ones', () => {
    expect(validatePdfDateRange('2099-01-01', '2099-03-01')).toHaveProperty('from');
    expect(() => validatePdfDateRange('not-a-date')).toThrow(/tidak valid/i);
    expect(() => validatePdfDateRange('2099-03-01', '2099-01-01')).toThrow(/sebelum tanggal awal/i);
    expect(() => validatePdfDateRange('2099-01-01', '2101-06-01')).toThrow(/maksimal/i);
  });

  it('removeSelfieFields: strips selfie keys recursively, keeps the rest', () => {
    const cleaned = removeSelfieFields({
      name: 'Alice',
      checkInSelfieUrl: 'x',
      nested: { selfie: 'y', ok: 1 },
      list: [{ selfiePath: 'z', keep: true }],
    }) as Record<string, unknown>;
    expect(cleaned.name).toBe('Alice');
    expect(cleaned).not.toHaveProperty('checkInSelfieUrl');
    expect((cleaned.nested as Record<string, unknown>)).not.toHaveProperty('selfie');
    expect((cleaned.nested as Record<string, unknown>).ok).toBe(1);
  });

  it('buildPdfDocument: returns a non-empty %PDF byte stream', () => {
    const bytes = buildPdfDocument({
      title: 'Test Report',
      reportType: 'attendance_summary',
      generatedBy: 'itest',
      generatedAt: new Date('2099-06-15T00:00:00.000Z'),
      periodLabel: '2099-06',
      filters: 'none',
      summaryCards: [{ label: 'Total', value: '10' }, { label: 'Late', value: '2' }],
      charts: [{ title: 'Trend', labels: ['Jan', 'Feb'], values: [1, 2] }],
      tables: [{ title: 'Detail', columns: ['Date', 'Name'], rows: [['2099-06-01', 'Alice'], ['2099-06-02', 'Bob']] }],
    });
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(100);
    expect(String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3])).toBe('%PDF');
  });
});
