import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db, users, employees, kpiTemplates, kpiItems, kpiAssignments, kpiResults } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { createTemplate, createItem, assignKpi, getAssignments } from '@/services/kpi/kpi-period';

/**
 * Happy-path integration tests for kpi-period against a real DB. Seeds an
 * employee + template + item, then assigns the template and asserts the assign
 * success and duplicate-rejection branches. All seeded rows are cleaned up.
 */
describe('kpi-period happy paths (real DB, seeded)', () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const empId = `itest-kpiemp-${suffix}`;
  const PERIOD = '2099-01';
  let templateId: string;
  let itemId: string;

  beforeAll(async () => {
    await db.insert(users).values({
      id: empId, email: `${empId}@t.local`, username: empId, password: 'x', role: 'EMPLOYEE', isActive: true,
    });
    await db.insert(employees).values({
      id: empId, nip: `NIP-${empId}`, userId: empId, fullName: 'IT KPI', email: `${empId}@t.local`,
      status: 'ACTIVE', position: 'Staff',
    });
    const t = await createTemplate({ name: `itest kpi tpl ${suffix}`, createdBy: 'itest' });
    templateId = t.id;
    const item = await createItem({ templateId, name: 'Produksi' });
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

  it('createItem: attaches an item to the template', () => {
    expect(itemId).toBeTruthy();
  });

  it('assignKpi: assigns a template to an employee and the assignment is listable', async () => {
    const assignment = await assignKpi({ employeeId: empId, templateId, period: PERIOD, assignedBy: 'itest' });
    expect(assignment).toBeDefined();

    const list = await getAssignments({ employeeId: empId });
    expect(list.length).toBeGreaterThanOrEqual(1);
  });

  it('assignKpi: rejects a duplicate assignment for the same period', async () => {
    await expect(
      assignKpi({ employeeId: empId, templateId, period: PERIOD, assignedBy: 'itest' }),
    ).rejects.toThrow(/sudah di-assign/i);
  });
});
