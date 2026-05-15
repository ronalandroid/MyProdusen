import { describe, expect, it } from 'vitest';
import { getReportPresets, resolveReportPreset } from '@/lib/reports/report-presets';

describe('report presets', () => {
  it('exposes common HRIS report presets', () => {
    expect(getReportPresets().map((preset) => preset.id)).toContain('attendance-this-month');
    expect(getReportPresets().map((preset) => preset.id)).toContain('geo-fence-exceptions');
  });

  it('resolves date range and report type for this month attendance preset', () => {
    const preset = resolveReportPreset('attendance-this-month', new Date('2026-05-15T12:00:00.000Z'));

    expect(preset).toMatchObject({
      reportType: 'attendance',
      startDate: '2026-05-01',
      endDate: '2026-05-31',
    });
  });
});
