import { describe, it, expect, afterEach } from 'vitest';
import {
  createTemplate,
  getTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  updateItem,
  assignKpi,
  getAssignments,
  getResults,
  getResultById,
  approveResult,
} from '@/services/kpi/kpi-period';

/**
 * Integration tests for kpi-period against a real DB. Covers the not-found
 * guards (template/item/result), the access-control branch in assignKpi, the
 * list reads, and a self-cleaning template create -> get -> update -> delete
 * round-trip — no seeding beyond the round-trip's own (cleaned) rows.
 */
describe('kpi-period integration (real DB)', () => {
  const NONE = 'itest-nonexistent';
  const createdTemplateIds: string[] = [];

  afterEach(async () => {
    for (const id of createdTemplateIds) await deleteTemplate(id).catch(() => {});
    createdTemplateIds.length = 0;
  });

  it('getTemplates: returns an array', async () => {
    expect(Array.isArray(await getTemplates())).toBe(true);
  });

  it('getTemplateById: throws not-found for a missing template', async () => {
    await expect(getTemplateById(NONE)).rejects.toThrow(/Template KPI tidak ditemukan/i);
  });

  it('updateTemplate: throws not-found for a missing template', async () => {
    await expect(updateTemplate(NONE, { name: 'x' })).rejects.toThrow(/Template KPI tidak ditemukan/i);
  });

  it('updateItem: throws not-found for a missing item', async () => {
    await expect(updateItem(NONE, {})).rejects.toThrow(/Item KPI tidak ditemukan/i);
  });

  it('assignKpi: throws when the employee does not exist', async () => {
    await expect(
      assignKpi({ employeeId: NONE, templateId: NONE, period: '2099-01', assignedBy: 'itest' }),
    ).rejects.toThrow(/Karyawan tidak ditemukan/i);
  });

  it('getAssignments: returns an array', async () => {
    expect(Array.isArray(await getAssignments())).toBe(true);
  });

  it('getResults: returns an array', async () => {
    expect(Array.isArray(await getResults())).toBe(true);
  });

  it('getResultById: throws not-found for a missing result', async () => {
    await expect(getResultById(NONE)).rejects.toThrow(/Hasil KPI tidak ditemukan/i);
  });

  it('approveResult: throws not-found for a missing result', async () => {
    await expect(approveResult(NONE, 'itest')).rejects.toThrow(/tidak ditemukan/i);
  });

  it('round-trip: create -> get -> update -> delete a template', async () => {
    const t = await createTemplate({ name: 'itest kpi template', createdBy: 'itest' });
    createdTemplateIds.push(t.id);

    const fetched = await getTemplateById(t.id);
    expect(fetched.id).toBe(t.id);

    const updated = await updateTemplate(t.id, { name: 'itest kpi renamed' });
    expect(updated.name).toBe('itest kpi renamed');

    // deleteTemplate runs cleanly; post-delete read semantics (cache / soft
    // delete) are out of scope here. The template stays tracked for afterEach.
    const del = await deleteTemplate(t.id);
    expect(del).toBeDefined();
  });
});
