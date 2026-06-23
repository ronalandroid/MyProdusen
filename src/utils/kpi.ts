export type KpiScoringType = 'HIGHER_IS_BETTER' | 'LOWER_IS_BETTER' | 'BOOLEAN';

export function calculateKpiScore(
  actualValue: number,
  targetValue: number,
  minValue: number,
  maxValue: number,
  scoringType: KpiScoringType
): number {
  if (scoringType === 'BOOLEAN') {
    return actualValue >= targetValue ? 100 : 0;
  }

  if (scoringType === 'HIGHER_IS_BETTER') {
    if (actualValue >= targetValue) {
      return 100;
    }
    if (actualValue <= minValue) {
      return 0;
    }
    return ((actualValue - minValue) / (targetValue - minValue)) * 100;
  }

  if (scoringType === 'LOWER_IS_BETTER') {
    if (actualValue <= targetValue) {
      return 100;
    }
    if (actualValue >= maxValue) {
      return 0;
    }
    return ((maxValue - actualValue) / (maxValue - targetValue)) * 100;
  }

  return 0;
}

export function calculateWeightedKpiScore(
  scores: Array<{ score: number; weight: number }>
): number {
  const totalWeight = scores.reduce((sum, item) => sum + item.weight, 0);
  const weightedSum = scores.reduce((sum, item) => sum + item.score * item.weight, 0);
  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

export function calculateIntegratedKpiScore(input: {
  attendanceScore: number;
  productionScore: number;
  disciplineScore: number;
}): number {
  return (
    input.attendanceScore * 0.3 +
    input.productionScore * 0.5 +
    input.disciplineScore * 0.2
  );
}

export interface KpiResultRow {
  result: { score: number; isApproved: boolean };
  item: { weight: number } | null;
}

export interface KpiResultsSummary {
  totalScore: number;
  weightedScore: number;
  itemCount: number;
  approvedCount: number;
}

/**
 * Aggregate an employee's KPI result rows for a period into summary scores.
 * `totalScore` is the plain average; `weightedScore` weights each result by its
 * item weight (results whose item is missing contribute to the average but not
 * the weighted score). Pure — separated from DB access for direct testing.
 */
export function summarizeKpiResults(results: KpiResultRow[]): KpiResultsSummary {
  if (results.length === 0) {
    return { totalScore: 0, weightedScore: 0, itemCount: 0, approvedCount: 0 };
  }

  let totalWeightedScore = 0;
  let totalWeight = 0;
  let approvedCount = 0;

  for (const { result, item } of results) {
    if (item) {
      totalWeightedScore += result.score * item.weight;
      totalWeight += item.weight;
    }
    if (result.isApproved) {
      approvedCount += 1;
    }
  }

  return {
    totalScore: results.reduce((sum, r) => sum + r.result.score, 0) / results.length,
    weightedScore: totalWeight > 0 ? totalWeightedScore / totalWeight : 0,
    itemCount: results.length,
    approvedCount,
  };
}
