import { describe, it, expect, afterEach } from 'vitest';
import { db, payrollStructures, payrollComponents } from '@/lib/db';
import { inArray, eq } from 'drizzle-orm';
import {
  createStructure,
  getStructures,
  getStructureById,
  updateStructure,
  deleteStructure,
  addComponent,
  updateComponent,
  deleteComponent,
  getPayrollRuleById,
  resolveActivePayrollRule,
} from '@/services/payroll/payroll-config';

/**
 * Integration tests for payroll-config (structure + component CRUD) against a
 * real DB. Protects the salary-structure management rules: creation defaults,
 * not-found errors, component attach/detach, and editability gating on a clean
 * DB (no approved/paid run -> assertStructureEditable passes).
 */
describe('payroll-config integration (real DB)', () => {
  const structureIds: string[] = [];

  afterEach(async () => {
    if (structureIds.length > 0) {
      await db.delete(payrollComponents).where(inArray(payrollComponents.structureId, structureIds));
      await db.delete(payrollStructures).where(inArray(payrollStructures.id, structureIds));
      structureIds.length = 0;
    }
  });

  async function makeStructure(name = 'itest structure') {
    const s = await createStructure({ name, baseSalary: 5_000_000, description: 'itest' });
    structureIds.push(s.id);
    return s;
  }

  it('createStructure: creates an active structure with the given base salary', async () => {
    const s = await makeStructure('itest create structure');
    expect(s.isActive).toBe(true);
    expect(s.name).toBe('itest create structure');
    expect(Number(s.baseSalary)).toBe(5_000_000);
  });

  it('getStructures: lists active structures and can filter by isActive', async () => {
    const s = await makeStructure('itest list structure');
    const active = await getStructures(true);
    expect(active.some((x) => x.id === s.id)).toBe(true);

    await updateStructure(s.id, { isActive: false });
    const stillActive = await getStructures(true);
    expect(stillActive.some((x) => x.id === s.id)).toBe(false);
  });

  it('getStructureById: returns the structure with components, or throws when missing', async () => {
    const s = await makeStructure('itest detail structure');
    const detail = await getStructureById(s.id);
    expect(detail.id).toBe(s.id);
    expect(Array.isArray(detail.components)).toBe(true);

    await expect(getStructureById('does-not-exist')).rejects.toThrow(/tidak ditemukan/i);
  });

  it('updateStructure: edits an editable structure', async () => {
    const s = await makeStructure('itest update structure');
    const updated = await updateStructure(s.id, { name: 'itest updated', baseSalary: 6_000_000 });
    expect(updated.name).toBe('itest updated');
    expect(Number(updated.baseSalary)).toBe(6_000_000);
  });

  it('components: add, update, list, and delete a component on a structure', async () => {
    const s = await makeStructure('itest component structure');

    const comp = await addComponent({
      structureId: s.id,
      name: 'Tunjangan Transport',
      type: 'ALLOWANCE',
      amount: 500_000,
      isPercentage: false,
      isTaxable: true,
    });
    expect(comp.structureId).toBe(s.id);

    const withComp = await getStructureById(s.id);
    expect(withComp.components.some((c) => c.id === comp.id)).toBe(true);

    const updated = await updateComponent(comp.id, { amount: 750_000 });
    expect(Number(updated.amount)).toBe(750_000);

    await expect(updateComponent('no-such-component', { amount: 1 })).rejects.toThrow(/tidak ditemukan/i);

    const del = await deleteComponent(comp.id);
    expect(del.success).toBe(true);
    const remaining = await db.select().from(payrollComponents).where(eq(payrollComponents.id, comp.id));
    expect(remaining).toHaveLength(0);
  });

  it('deleteStructure: removes an unused structure', async () => {
    const s = await makeStructure('itest delete structure');
    const res = await deleteStructure(s.id);
    expect(res.success).toBe(true);
    // already removed — drop from cleanup tracking
    structureIds.splice(structureIds.indexOf(s.id), 1);
    await expect(getStructureById(s.id)).rejects.toThrow(/tidak ditemukan/i);
  });

  it('payroll rules: getPayrollRuleById throws for a missing rule', async () => {
    await expect(getPayrollRuleById('no-such-rule')).rejects.toThrow(/tidak ditemukan/i);
  });

  it('resolveActivePayrollRule: returns null for a non-existent employee', async () => {
    const rule = await resolveActivePayrollRule('no-such-employee');
    expect(rule).toBeNull();
  });
});
