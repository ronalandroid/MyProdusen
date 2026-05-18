import { describe, expect, it } from 'vitest';
import {
  getPdfReportMaxRows,
  validatePdfDateRange,
  removeSelfieFields,
  assertPdfReportAccess,
  buildPdfDocument,
} from '@/lib/reports/pdf-report';

describe('PDF report policy', () => {
  it('allows only Superadmin to generate PDF reports', () => {
    expect(() => assertPdfReportAccess('SUPERADMIN')).not.toThrow();
    expect(() => assertPdfReportAccess('ADMIN_HR')).toThrow('PDF_REPORT_FORBIDDEN');
    expect(() => assertPdfReportAccess('SUPERVISOR')).toThrow('PDF_REPORT_FORBIDDEN');
    expect(() => assertPdfReportAccess('EMPLOYEE')).toThrow('PDF_REPORT_FORBIDDEN');
  });

  it('validates date range and caps max rows from environment', () => {
    process.env.PDF_REPORT_MAX_ROWS = '25';
    const range = validatePdfDateRange('2026-05-01', '2026-05-31');

    expect(range.from.toISOString().startsWith('2026-05-01')).toBe(true);
    expect(range.to.toISOString().startsWith('2026-05-31')).toBe(true);
    expect(getPdfReportMaxRows()).toBe(25);
    process.env.PDF_REPORT_MAX_DATE_RANGE_MONTHS = '1';
    expect(() => validatePdfDateRange('2026-05-01', '2026-07-01')).toThrow('Rentang PDF maksimal 1 bulan');
    delete process.env.PDF_REPORT_MAX_DATE_RANGE_MONTHS;
    expect(() => validatePdfDateRange('2026-06-01', '2026-05-01')).toThrow('Tanggal akhir tidak boleh sebelum tanggal awal');
  });

  it('removes selfie fields from exported data recursively', () => {
    const scrubbed = removeSelfieFields({
      employee: 'A',
      checkInSelfiePath: '/secret.jpg',
      nested: { checkOutSelfieUrl: 'https://secret', keep: true },
      rows: [{ selfieImage: 'base64', status: 'PRESENT' }],
    });

    expect(JSON.stringify(scrubbed).toLowerCase()).not.toContain('selfie');
    expect(scrubbed).toMatchObject({ employee: 'A', nested: { keep: true }, rows: [{ status: 'PRESENT' }] });
  });

  it('builds a real PDF with brand header, footer, chart labels, and confidentiality note', () => {
    const pdf = buildPdfDocument({
      title: 'Attendance Summary PDF',
      reportType: 'attendance_summary',
      generatedBy: 'superadmin@myprodusen.test',
      generatedAt: new Date('2026-05-18T10:00:00Z'),
      periodLabel: '2026-05-01 sampai 2026-05-31',
      filters: 'Divisi: Semua',
      summaryCards: [{ label: 'Total Hadir', value: '25' }],
      charts: [{ title: 'attendance status chart', labels: ['PRESENT', 'LATE'], values: [20, 5] }],
      tables: [{ title: 'Attendance', columns: ['Status', 'Total'], rows: [['PRESENT', '20'], ['LATE', '5']] }],
    });

    const pdfText = Buffer.from(pdf).toString('latin1');
    expect(pdfText.startsWith('%PDF-')).toBe(true);
    expect(pdfText).toContain('MyProdusen');
    expect(pdfText).toContain('TBM Group');
    expect(pdfText).toContain('CONFIDENTIAL');
    expect(pdfText).toContain('attendance status chart');
  });
});
