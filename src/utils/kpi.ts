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
