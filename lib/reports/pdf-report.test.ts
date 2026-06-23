import { describe, it, expect, afterEach, vi } from 'vitest';
import {
  assertPdfReportAccess,
  getPdfReportMaxRows,
  getPdfReportMaxDateRangeMonths,
  defaultCurrentMonthRange,
  validatePdfDateRange,
  removeSelfieFields,
  buildPdfDocument,
} from './pdf-report';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('assertPdfReportAccess', () => {
  it('allows SUPERADMIN', () => {
    expect(() => assertPdfReportAccess('SUPERADMIN')).not.toThrow();
  });
  it('blocks every other role', () => {
    expect(() => assertPdfReportAccess('LEADER' as never)).toThrow('PDF_REPORT_FORBIDDEN');
    expect(() => assertPdfReportAccess('EMPLOYEE' as never)).toThrow('PDF_REPORT_FORBIDDEN');
  });
});

describe('getPdfReportMaxRows', () => {
  it('defaults to 1000 when unset or invalid', () => {
    vi.stubEnv('PDF_REPORT_MAX_ROWS', '');
    expect(getPdfReportMaxRows()).toBe(1000);
    vi.stubEnv('PDF_REPORT_MAX_ROWS', 'abc');
    expect(getPdfReportMaxRows()).toBe(1000);
  });
  it('honours a valid value and clamps to 5000', () => {
    vi.stubEnv('PDF_REPORT_MAX_ROWS', '2000');
    expect(getPdfReportMaxRows()).toBe(2000);
    vi.stubEnv('PDF_REPORT_MAX_ROWS', '99999');
    expect(getPdfReportMaxRows()).toBe(5000);
  });
});

describe('getPdfReportMaxDateRangeMonths', () => {
  it('defaults to 12 and clamps to 24', () => {
    vi.stubEnv('PDF_REPORT_MAX_DATE_RANGE_MONTHS', 'x');
    expect(getPdfReportMaxDateRangeMonths()).toBe(12);
    vi.stubEnv('PDF_REPORT_MAX_DATE_RANGE_MONTHS', '24');
    expect(getPdfReportMaxDateRangeMonths()).toBe(24);
    vi.stubEnv('PDF_REPORT_MAX_DATE_RANGE_MONTHS', '100');
    expect(getPdfReportMaxDateRangeMonths()).toBe(24);
  });
});

describe('defaultCurrentMonthRange', () => {
  it('returns the first and last day of the given month', () => {
    const { from, to } = defaultCurrentMonthRange(new Date(2025, 5, 15));
    expect(from.getMonth()).toBe(5);
    expect(from.getDate()).toBe(1);
    expect(to.getMonth()).toBe(5);
    expect(to.getDate()).toBe(30);
  });
});

describe('validatePdfDateRange', () => {
  it('accepts a valid range', () => {
    const { from, to } = validatePdfDateRange('2025-01-01', '2025-03-31');
    expect(from.getTime()).toBeLessThan(to.getTime());
  });
  it('falls back to the current month when no inputs given', () => {
    expect(() => validatePdfDateRange()).not.toThrow();
  });
  it('rejects an invalid date string', () => {
    expect(() => validatePdfDateRange('notadate', '2025-01-01')).toThrow('tidak valid');
  });
  it('rejects an end date before the start date', () => {
    expect(() => validatePdfDateRange('2025-03-01', '2025-01-01')).toThrow('sebelum');
  });
  it('rejects a range longer than the configured maximum', () => {
    vi.stubEnv('PDF_REPORT_MAX_DATE_RANGE_MONTHS', '12');
    expect(() => validatePdfDateRange('2025-01-01', '2026-06-01')).toThrow('maksimal');
  });
});

describe('removeSelfieFields', () => {
  it('recursively strips any key matching /selfie/i and preserves the rest', () => {
    const input = {
      name: 'Budi',
      selfieUrl: 'secret.jpg',
      nested: { selfiePath: 'x', ok: 1 },
      list: [{ selfie: 'z', keep: 2 }],
      when: new Date('2025-01-01T00:00:00.000Z'),
    };
    const out = removeSelfieFields(input);
    expect(out).not.toHaveProperty('selfieUrl');
    expect(out.nested).not.toHaveProperty('selfiePath');
    expect(out.nested.ok).toBe(1);
    expect(out.list[0]).not.toHaveProperty('selfie');
    expect(out.list[0].keep).toBe(2);
    expect(out.when).toBeInstanceOf(Date);
    expect(out.name).toBe('Budi');
  });
  it('returns primitives and null unchanged', () => {
    expect(removeSelfieFields(42)).toBe(42);
    expect(removeSelfieFields('x')).toBe('x');
    expect(removeSelfieFields(null)).toBeNull();
  });
});

describe('buildPdfDocument', () => {
  it('produces a non-empty PDF byte stream', () => {
    const bytes = buildPdfDocument({
      title: 'Test Report',
      reportType: 'attendance_summary',
      generatedBy: 'superadmin',
      generatedAt: new Date('2025-06-15T00:00:00.000Z'),
      periodLabel: 'Juni 2025',
      filters: 'All divisions',
      summaryCards: [{ label: 'Total', value: '10' }],
      charts: [{ title: 'Daily', labels: ['A', 'B'], values: [1, 2] }],
      tables: [{ title: 'Rows', columns: ['Name', 'Score'], rows: [['Budi', '90']] }],
    });
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(0);
  });
});
