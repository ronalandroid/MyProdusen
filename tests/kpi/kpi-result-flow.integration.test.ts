import { describe, it, expect, afterEach } from 'vitest';
import {
  db,
  users,
  employees,
  kpiTemplates,
  kpiItems,
  kpiAssignments,
  kpiResults,
  notifications,
} from '@/lib/db';
import { kpiService } from '@/services/kpi/kpi.service';
import { calculateKpiScore } from '@/utils/kpi';
import { eq } from 'drizzle-orm';

/**
 * Integration test for the KPI RESULT FLOW against a real DB. Targets genuine
 * scoring/aggregation business logic, not CRUD:
 *   - submitResult: computes the result score via the scoring formula and
 *     persists it; getEmployeeKpiSummary aggregates it back.
 *   - approveResult: flips isApproved true (re-read from DB to confirm).
 *   - updateResult: changing actualValue recomputes and persists a new score.
 *
 * Expected scores are derived from calculateKpiScore (@/utils/kpi), the single
 * source of truth, never hardcoded magic numbers — so the test fails if the
 * service ever diverges from the canonical formula.
 *
 * Minimal graph seeded for a result: user + employee (employee needed because
 * approveResult resolves employee.userId to dispatch a notification), one
 * kpiTemplate, one kpiItem under it, and one kpiAssignment (domain fidelity).
 *
 * Determinism under parallel execution: unique ids for every seeded row and a
 * unique `period` per test; all queries/cleanup scoped to those ids. No shared
 * state with other suites.
 */
describe('KPI result flow integration (real DB)', () => {
  const seeded = {
    ids: [] as string[],
    templates: [] as string[],
    items: [] as string[],
    results: [] as string[],
    assignments: [] as string[],
  };

  afterEach(async () => {
    // FK-safe order: results -> assignments -> items -> templates ->
    // notifications -> employee -> user.
    for (const r of seeded.results) await db.delete(kpiResults).where(eq(kpiResults.id, r));
    for (const id of seeded.ids) await db.delete(kpiResults).where(eq(kpiResults.employeeId, id));
    for (const a of seeded.assignments) await db.delete(kpiAssignments).where(eq(kpiAssignments.id, a));
    for (const i of seeded.items) await db.delete(kpiItems).where(eq(kpiItems.id, i));
    for (const t of seeded.templates) await db.delete(kpiTemplates).where(eq(kpiTemplates.id, t));
    for (const id of seeded.ids) await db.delete(notifications).where(eq(notifications.userId, id));
    for (const id of seeded.ids) await db.delete(employees).where(eq(employees.id, id));
    for (const id of seeded.ids) await db.delete(users).where(eq(users.id, id));
    seeded.ids.length = 0;
    seeded.templates.length = 0;
    seeded.items.length = 0;
    seeded.results.length = 0;
    seeded.assignments.length = 0;
  });

  // Item scoring config used across tests. actualValue sits strictly between
  // min and target so the score is a non-trivial fraction (exercises the real
  // interpolation, not a 0/100 clamp).
  const ITEM = {
    scoringType: 'HIGHER_IS_BETTER' as const,
    targetValue: 100,
    minValue: 0,
    maxValue: 200,
    weight: 2,
  };

  async function seedGraph(): Promise<{ employeeId: string; itemId: string; period: string }> {
    const id = `itest_kpi_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    seeded.ids.push(id);
    const period = `itest-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    await db.insert(users).values({ id, email: `${id}@t.local`, username: id, password: 'x', role: 'EMPLOYEE', isActive: true });
    await db.insert(employees).values({ id, nip: `NIP-${id}`, userId: id, fullName: 'IT KPI', email: `${id}@t.local`, status: 'ACTIVE', position: 'Staff' });

    const templateId = `${id}_tmpl`;
    seeded.templates.push(templateId);
    await db.insert(kpiTemplates).values({ id: templateId, name: templateId, isActive: true });

    const itemId = `${id}_item`;
    seeded.items.push(itemId);
    await db.insert(kpiItems).values({
      id: itemId,
      templateId,
      name: 'Production output',
      weight: ITEM.weight,
      scoringType: ITEM.scoringType,
      targetValue: ITEM.targetValue,
      minValue: ITEM.minValue,
      maxValue: ITEM.maxValue,
      unit: 'pcs',
    });

    const assignmentId = `${id}_asg`;
    seeded.assignments.push(assignmentId);
    await db.insert(kpiAssignments).values({ id: assignmentId, employeeId: id, templateId, period, assignedBy: id });

    return { employeeId: id, itemId, period };
  }

  it('submit computes the canonical score and the summary reflects it', async () => {
    const { employeeId, itemId, period } = await seedGraph();
    const actualValue = 60; // between min 0 and target 100

    const result = await kpiService.submitResult({ employeeId, itemId, period, actualValue });
    seeded.results.push(result.id);

    const expectedScore = calculateKpiScore(
      actualValue,
      ITEM.targetValue,
      ITEM.minValue,
      ITEM.maxValue,
      ITEM.scoringType,
    ); // 60/100 * 100 = 60
    expect(result.score).toBeCloseTo(expectedScore, 5);
    expect(result.actualValue).toBe(actualValue);
    expect(result.isApproved).toBe(false);

    const summary = await kpiService.getEmployeeKpiSummary(employeeId, period);
    expect(summary.itemCount).toBe(1);
    expect(summary.approvedCount).toBe(0);
    // Single result: plain average == the result score.
    expect(summary.totalScore).toBeCloseTo(expectedScore, 5);
    // Single weighted result: weightedScore == the result score regardless of weight.
    expect(summary.weightedScore).toBeCloseTo(expectedScore, 5);
    expect(summary.items.some((row) => row.result.id === result.id)).toBe(true);
  });

  it('approve flips status to approved (confirmed by re-reading from DB)', async () => {
    const { employeeId, itemId, period } = await seedGraph();
    const submitted = await kpiService.submitResult({ employeeId, itemId, period, actualValue: 80 });
    seeded.results.push(submitted.id);
    expect(submitted.isApproved).toBe(false);

    const approved = await kpiService.approveResult(submitted.id, employeeId);
    expect(approved.isApproved).toBe(true);
    expect(approved.approvedBy).toBe(employeeId);
    expect(approved.approvedAt).toBeTruthy();

    // Re-read from DB to confirm persistence.
    const [row] = await db.select().from(kpiResults).where(eq(kpiResults.id, submitted.id)).limit(1);
    expect(row.isApproved).toBe(true);

    // Summary now reports one approved result.
    const summary = await kpiService.getEmployeeKpiSummary(employeeId, period);
    expect(summary.approvedCount).toBe(1);
  });

  it('updateResult recomputes and persists the score when actualValue changes', async () => {
    const { employeeId, itemId, period } = await seedGraph();
    const submitted = await kpiService.submitResult({ employeeId, itemId, period, actualValue: 40 });
    seeded.results.push(submitted.id);

    const newValue = 90; // still between min and target -> new fractional score
    const updated = await kpiService.updateResult(submitted.id, { actualValue: newValue });

    const expectedScore = calculateKpiScore(
      newValue,
      ITEM.targetValue,
      ITEM.minValue,
      ITEM.maxValue,
      ITEM.scoringType,
    ); // 90
    expect(updated.actualValue).toBe(newValue);
    expect(updated.score).toBeCloseTo(expectedScore, 5);

    const [row] = await db.select().from(kpiResults).where(eq(kpiResults.id, submitted.id)).limit(1);
    expect(row.actualValue).toBe(newValue);
    expect(row.score).toBeCloseTo(expectedScore, 5);
  });
});
