import { KpiScoringType } from '@prisma/client';

/**
 * Calculate KPI score based on scoring type
 */
export function calculateKpiScore(
  actualValue: number,
  targetValue: number,
  minValue: number,
  maxValue: number,
  scoringType: KpiScoringType
): number {
  switch (scoringType) {
    case KpiScoringType.HIGHER_IS_BETTER:
      return calculateHigherIsBetter(actualValue, targetValue, minValue, maxValue);
    
    case KpiScoringType.LOWER_IS_BETTER:
      return calculateLowerIsBetter(actualValue, targetValue, minValue, maxValue);
    
    case KpiScoringType.BOOLEAN:
      return actualValue >= targetValue ? 100 : 0;
    
    default:
      return 0;
  }
}

function calculateHigherIsBetter(
  actual: number,
  target: number,
  min: number,
  max: number
): number {
  if (actual >= max) return 100;
  if (actual <= min) return 0;
  
  // Linear interpolation between min and target
  if (actual < target) {
    return ((actual - min) / (target - min)) * 100;
  }
  
  // Already at or above target
  return 100;
}

function calculateLowerIsBetter(
  actual: number,
  target: number,
  min: number,
  max: number
): number {
  if (actual <= min) return 100;
  if (actual >= max) return 0;
  
  // Linear interpolation between target and max
  if (actual > target) {
    return ((max - actual) / (max - target)) * 100;
  }
  
  // Already at or below target
  return 100;
}

/**
 * Calculate weighted average KPI score
 */
export function calculateWeightedKpiScore(
  scores: Array<{ score: number; weight: number }>
): number {
  if (scores.length === 0) return 0;
  
  const totalWeight = scores.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight === 0) return 0;
  
  const weightedSum = scores.reduce((sum, item) => sum + item.score * item.weight, 0);
  return weightedSum / totalWeight;
}

/**
 * Get KPI performance category
 */
export function getKpiCategory(score: number): {
  label: string;
  color: string;
} {
  if (score >= 90) return { label: 'Excellent', color: 'green' };
  if (score >= 75) return { label: 'Good', color: 'blue' };
  if (score >= 60) return { label: 'Average', color: 'yellow' };
  if (score >= 40) return { label: 'Below Average', color: 'orange' };
  return { label: 'Poor', color: 'red' };
}
