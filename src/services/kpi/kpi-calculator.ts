import { db, kpiItems, kpiResults } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { calculateKpiScore, summarizeKpiResults } from '@/utils/kpi';
import { BusinessError } from '@/lib/core/business-error';

export type KpiScoringType = 'HIGHER_IS_BETTER' | 'LOWER_IS_BETTER' | 'BOOLEAN';

// calculateKpiScore lives in @/utils/kpi (single source of truth, unit-tested);
// imported above. The previous local duplicate was byte-identical and has been
// removed to eliminate score-formula drift risk.

// KPI score computation: submit/update result scoring + employee summary aggregation.
export async function submitResult(data: {
  employeeId: string;
  itemId: string;
  period: string;
  actualValue: number;
  notes?: string;
}) {
  // Get item details for scoring
  const [item] = await db
    .select()
    .from(kpiItems)
    .where(eq(kpiItems.id, data.itemId))
    .limit(1);

  if (!item) {
    throw new BusinessError('Item KPI tidak ditemukan');
  }

  // Calculate score
  const score = calculateKpiScore(
    data.actualValue,
    item.targetValue ?? 0,
    item.minValue ?? 0,
    item.maxValue ?? 100,
    item.scoringType as KpiScoringType
  );

  // Check if result already exists
  const [existing] = await db
    .select()
    .from(kpiResults)
    .where(
      and(
        eq(kpiResults.employeeId, data.employeeId),
        eq(kpiResults.itemId, data.itemId),
        eq(kpiResults.period, data.period)
      )
    )
    .limit(1);

  if (existing) {
    if (existing.isApproved) {
      throw new BusinessError('Hasil KPI sudah disetujui dan tidak dapat diubah tanpa alasan otorisasi');
    }

    // Update existing
    const [result] = await db
      .update(kpiResults)
      .set({
        actualValue: data.actualValue,
        score,
        notes: data.notes,
        updatedAt: new Date(),
      })
      .where(eq(kpiResults.id, existing.id))
      .returning();

    return result;
  }

  // Create new
  const id = uuidv4();
  const [result] = await db
    .insert(kpiResults)
    .values({
      id,
      employeeId: data.employeeId,
      itemId: data.itemId,
      period: data.period,
      actualValue: data.actualValue,
      score,
      notes: data.notes,
      isApproved: false,
    })
    .returning();

  return result;
}

export async function updateResult(id: string, data: {
  actualValue?: number;
  notes?: string;
}) {
  const [existing] = await db
    .select()
    .from(kpiResults)
    .where(eq(kpiResults.id, id))
    .limit(1);

  if (!existing) {
    throw new BusinessError('Hasil KPI tidak ditemukan');
  }

  if (existing.isApproved) {
    throw new BusinessError('Hasil KPI sudah disetujui dan tidak dapat diubah tanpa alasan otorisasi');
  }

  let score = existing.score;

  // Recalculate score if actualValue changed
  if (data.actualValue !== undefined) {
    const [item] = await db
      .select()
      .from(kpiItems)
      .where(eq(kpiItems.id, existing.itemId))
      .limit(1);

    if (item) {
      score = calculateKpiScore(
        data.actualValue,
        item.targetValue ?? 0,
        item.minValue ?? 0,
        item.maxValue ?? 100,
        item.scoringType as KpiScoringType
      );
    }
  }

  const [result] = await db
    .update(kpiResults)
    .set({
      actualValue: data.actualValue ?? existing.actualValue,
      score,
      notes: data.notes ?? existing.notes,
      updatedAt: new Date(),
    })
    .where(eq(kpiResults.id, id))
    .returning();

  return result;
}

export async function getEmployeeKpiSummary(employeeId: string, period: string) {
  // Get all results for employee in period
  const results = await db
    .select({
      result: kpiResults,
      item: kpiItems,
    })
    .from(kpiResults)
    .leftJoin(kpiItems, eq(kpiResults.itemId, kpiItems.id))
    .where(
      and(
        eq(kpiResults.employeeId, employeeId),
        eq(kpiResults.period, period)
      )
    );

  return {
    employeeId,
    period,
    ...summarizeKpiResults(results),
    items: results,
  };
}
