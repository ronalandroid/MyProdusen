import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db, users, employees, kpiTemplates, kpiItems, kpiAssignments, kpiResults } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { createTemplate, createItem, getResults, getResultById, approveResult } from '@/services/kpi/kpi-period';
import { submitResult } from '@/services/kpi/kpi-calculator';

/**
 * Happy-path integration tests for KPI results against a real DB. Seeds an
 * employee + template + item (with a target), submits a result (score computed),
 * then reads and approves it — covering submitResult, getResults, getResultById,
 * and approveResult (incl. the already-approved guard). Cleaned up afterwards.
 */
describe('kpi results happy paths (real DB, seeded)', () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const empId = `itest-kpires-${suffix}`;
  const PERIOD = '2099-02';
  let templateId: string;
  let itemId: string;
  let resultId: string;

  beforeAll(async () => {
    await db.insert(users).values({
      id: empId, email: `${empId}@t.local`, username: empId, password: 'x', role: 'EMPLOYEE', isActive: true,
    });
    await db.insert(employees).values({
      id: empId, nip: `NIP-${empId}`, userId: empId, fullName: 'IT KPI Res', email: `${empId}@t.local`,
      status: 'ACTIVE', position: 'Staff',
    });
    const t = await createTemplate({ name: `itest kpi tpl ${suffix}`, createdBy: 'itest' });
    templateId = t.id;
    const item = await createItem({ templateId, name: 'Produksi', targetValue: 100 });
    itemId = item.id;
  });

  afterAll(async () => {
    await db.delete(kpiResults).where(eq(kpiResults.employeeId, empId));
    await db.delete(kpiAssignments).where(eq(kpiAssignments.employeeId, empId));
    if (templateId) {
      await db.delete(kpiItems).where(eq(kpiItems.templateId, templateId));
      await db.delete(kpiTemplates).where(eq(kpiTemplates.id, templateId));
    }
    await db.delete(employees).where(eq(employees.id, empId));
    await db.delete(users).where(eq(users.id, empId));
  });

  it('submitResult: records a scored result for the item/period', async () => {
    const result = await submitResult({ employeeId: empId, itemId, period: PERIOD, actualValue: 80 });
    expect(result).toBeDefined();
    resultId = result.id;
    expect(resultId).toBeTruthy();
  });

  it('getResultById + getResults: the submitted result is retrievable', async () => {
    const byId = await getResultById(resultId); // throws if missing, so resolving == found
    expect(byId).toBeDefined();
    const list = await getResults({ employeeId: empId });
    expect(list.length).toBeGreaterThanOrEqual(1);
  });

  it('approveResult: approves once and rejects a second approval', async () => {
    const approved = await approveResult(resultId, 'itest-approver');
    expect(approved).toBeDefined();
    await expect(approveResult(resultId, 'itest-approver')).rejects.toThrow(/sudah disetujui/i);
  });
});
