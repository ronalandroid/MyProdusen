import { KpiScoringType } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { calculateKpiScore, calculateWeightedKpiScore, getKpiCategory } from './kpi';

describe('kpi utilities', () => {
  it('scores higher-is-better KPI', () => {
    expect(calculateKpiScore(100, 80, 0, 100, KpiScoringType.HIGHER_IS_BETTER)).toBe(100);
    expect(calculateKpiScore(0, 80, 0, 100, KpiScoringType.HIGHER_IS_BETTER)).toBe(0);
  });

  it('scores lower-is-better KPI', () => {
    expect(calculateKpiScore(0, 20, 0, 100, KpiScoringType.LOWER_IS_BETTER)).toBe(100);
    expect(calculateKpiScore(100, 20, 0, 100, KpiScoringType.LOWER_IS_BETTER)).toBe(0);
  });

  it('scores boolean KPI', () => {
    expect(calculateKpiScore(1, 1, 0, 1, KpiScoringType.BOOLEAN)).toBe(100);
    expect(calculateKpiScore(0, 1, 0, 1, KpiScoringType.BOOLEAN)).toBe(0);
  });

  it('calculates weighted score and handles zero weight', () => {
    expect(calculateWeightedKpiScore([{ score: 80, weight: 2 }, { score: 100, weight: 1 }])).toBeCloseTo(86.67, 1);
    expect(calculateWeightedKpiScore([{ score: 80, weight: 0 }])).toBe(0);
  });

  it('returns category thresholds', () => {
    expect(getKpiCategory(90).label).toBe('Excellent');
    expect(getKpiCategory(75).label).toBe('Good');
    expect(getKpiCategory(60).label).toBe('Average');
    expect(getKpiCategory(40).label).toBe('Below Average');
    expect(getKpiCategory(39).label).toBe('Poor');
  });
});
