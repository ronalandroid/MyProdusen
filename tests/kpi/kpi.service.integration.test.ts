import { describe, it, expect } from 'vitest';
import { kpiService } from '@/services/kpi/kpi.service';

/**
 * Integration tests for KpiService (a thin facade delegating to kpi-period).
 * Exercises the delegation through guard/read paths with non-existent ids.
 */
describe('KpiService facade integration (real DB, guard paths)', () => {
  const NONE = 'itest-nonexistent';

  it('getTemplates: returns an array', async () => {
    expect(Array.isArray(await kpiService.getTemplates())).toBe(true);
  });

  it('getTemplateById: throws not-found', async () => {
    await expect(kpiService.getTemplateById(NONE)).rejects.toThrow(/Template KPI tidak ditemukan/i);
  });

  it('updateTemplate: throws not-found', async () => {
    await expect(kpiService.updateTemplate(NONE, { name: 'x' })).rejects.toThrow(/Template KPI tidak ditemukan/i);
  });

  it('updateItem: throws not-found', async () => {
    await expect(kpiService.updateItem(NONE, {})).rejects.toThrow(/Item KPI tidak ditemukan/i);
  });

  it('assignKpi: throws when the employee does not exist', async () => {
    await expect(
      kpiService.assignKpi({ employeeId: NONE, templateId: NONE, period: '2099-01', assignedBy: 'itest' }),
    ).rejects.toThrow(/Karyawan tidak ditemukan/i);
  });

  it('getAssignments: returns an array', async () => {
    expect(Array.isArray(await kpiService.getAssignments())).toBe(true);
  });
});
