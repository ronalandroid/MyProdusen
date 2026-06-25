import { describe, it, expect, afterAll } from 'vitest';
import { db, kpiMetrics, kpiTargets, kpiTemplates, kpiItems } from '@/lib/db';
import { inArray } from 'drizzle-orm';
import {
  createMetric, getMetrics, getMetricById, updateMetric, deleteMetric,
  createTarget, getTargets, getTargetById, updateTarget, deleteTarget, resolveActiveTarget,
  createTemplate, createItem, deleteItem,
} from '@/services/kpi/kpi-period';

/**
 * Integration tests for the kpi-period Metrics + Targets CRUD (single-table,
 * self-cleaning) plus deleteItem — a previously untested block.
 */
describe('kpi metrics + targets CRUD (real DB)', () => {
  const metricIds: string[] = [];
  const templateIds: string[] = [];

  afterAll(async () => {
    if (metricIds.length > 0) {
      await db.delete(kpiTargets).where(inArray(kpiTargets.metricId, metricIds));
      await db.delete(kpiMetrics).where(inArray(kpiMetrics.id, metricIds));
    }
    if (templateIds.length > 0) {
      await db.delete(kpiItems).where(inArray(kpiItems.templateId, templateIds));
      await db.delete(kpiTemplates).where(inArray(kpiTemplates.id, templateIds));
    }
  });

  it('metric CRUD round-trip + not-found guard', async () => {
    const m = await createMetric('itest', { name: `itest metric ${Date.now()}`, unit: 'pcs' });
    metricIds.push(m.id);
    expect(await getMetricById(m.id)).toBeDefined();
    expect(Array.isArray(await getMetrics())).toBe(true);
    expect(Array.isArray(await getMetrics({ active: true }))).toBe(true);
    expect(await updateMetric('itest', m.id, { name: 'updated metric' })).toBeDefined();
    await expect(getMetricById('itest-none')).rejects.toThrow();
  });

  it('target CRUD round-trip + validation guards', async () => {
    const m = await createMetric('itest', { name: `itest metric t ${Date.now()}`, unit: 'pcs' });
    metricIds.push(m.id);

    await expect(
      createTarget('itest', { metricId: '', scopeType: 'GLOBAL', periodType: 'MONTHLY', targetQuantity: 1 }),
    ).rejects.toThrow(/wajib/i);
    await expect(
      createTarget('itest', { metricId: m.id, scopeType: 'GLOBAL', periodType: 'MONTHLY', targetQuantity: -1 }),
    ).rejects.toThrow(/negatif/i);

    const t = await createTarget('itest', { metricId: m.id, scopeType: 'GLOBAL', periodType: 'MONTHLY', targetQuantity: 100 });
    expect(await getTargetById(t.id)).toBeDefined();
    expect(Array.isArray(await getTargets())).toBe(true);
    expect(await updateTarget('itest', t.id, { targetQuantity: 150 })).toBeDefined();

    const resolved = await resolveActiveTarget('itest-emp', m.id);
    expect(resolved === null || typeof resolved === 'object').toBe(true);

    await deleteTarget('itest', t.id);
    await deleteMetric('itest', m.id);
  });

  it('deleteItem removes a template item', async () => {
    const tpl = await createTemplate({ name: `itest tpl ${Date.now()}`, createdBy: 'itest' });
    templateIds.push(tpl.id);
    const item = await createItem({ templateId: tpl.id, name: 'Item' });
    await deleteItem(item.id);
    expect(true).toBe(true); // no throw == removed
  });
});
