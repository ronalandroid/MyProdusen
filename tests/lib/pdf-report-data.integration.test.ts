import { describe, it, expect } from 'vitest';
import { buildPdfReportData } from '@/lib/reports/pdf-report';

/**
 * Integration tests for buildPdfReportData against a real DB. Uses an empty
 * far-future period so the data-query functions (attendance/kpi/payroll) run and
 * return nothing, exercising every report-type assembly branch without seeding.
 */
describe('buildPdfReportData (real DB, empty period)', () => {
  const from = '2099-03-01';
  const to = '2099-03-28';
  const reportTypes = ['attendance_summary', 'kpi_performance', 'payroll_summary', 'executive_hr'] as const;

  for (const reportType of reportTypes) {
    it(`assembles a ${reportType} report for an empty period`, async () => {
      const doc = await buildPdfReportData({ reportType, from, to }, 'itest');
      expect(doc).toBeDefined();
      expect(doc.reportType).toBe(reportType);
      expect(Array.isArray(doc.tables)).toBe(true);
    });
  }
});
