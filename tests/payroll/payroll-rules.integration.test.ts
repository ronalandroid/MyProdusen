import { describe, it, expect, afterEach } from 'vitest';
import { db, payrollRules } from '@/lib/db';
import { inArray } from 'drizzle-orm';
import {
  createPayrollRule,
  getPayrollRuleById,
  getPayrollRules,
  updatePayrollRule,
  deletePayrollRule,
} from '@/services/payroll/payroll-config';

/**
 * Integration tests for the payroll-rules CRUD (single table, self-cleaning).
 * Covers create, read-by-id, list + active filter, update, and the soft-delete
 * (deactivate) path.
 */
describe('payroll-config rules integration (real DB)', () => {
  const ruleIds: string[] = [];

  afterEach(async () => {
    if (ruleIds.length > 0) {
      await db.delete(payrollRules).where(inArray(payrollRules.id, ruleIds));
      ruleIds.length = 0;
    }
  });

  async function makeRule() {
    const r = await createPayrollRule('itest-actor', { periodType: 'MONTHLY', baseSalary: 5_000_000 });
    ruleIds.push(r.id);
    return r;
  }

  it('createPayrollRule + getPayrollRuleById: round-trip', async () => {
    const r = await makeRule();
    expect(Number(r.baseSalary)).toBe(5_000_000);
    const fetched = await getPayrollRuleById(r.id);
    expect(fetched.id).toBe(r.id);
  });

  it('getPayrollRules: lists rules and filters by active', async () => {
    const r = await makeRule();
    const all = await getPayrollRules();
    expect(all.some((x) => x.id === r.id)).toBe(true);
    const active = await getPayrollRules({ active: true });
    expect(active.some((x) => x.id === r.id)).toBe(true);
  });

  it('updatePayrollRule: edits the base salary', async () => {
    const r = await makeRule();
    const updated = await updatePayrollRule('itest-actor', r.id, { baseSalary: 6_000_000 });
    expect(Number(updated.baseSalary)).toBe(6_000_000);
  });

  it('deletePayrollRule: soft-deactivates the rule', async () => {
    const r = await makeRule();
    await deletePayrollRule('itest-actor', r.id);
    const active = await getPayrollRules({ active: true });
    expect(active.some((x) => x.id === r.id)).toBe(false);
  });
});
