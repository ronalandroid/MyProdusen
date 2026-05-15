import { describe, it, expect } from 'vitest';
import { calculateKpiScore, calculateWeightedKpiScore } from './kpi';

describe('KPI Utilities', () => {
  describe('calculateKpiScore', () => {
    it('should calculate HIGHER_IS_BETTER score correctly', () => {
      expect(calculateKpiScore(100, 100, 50, 150, 'HIGHER_IS_BETTER')).toBe(100);
      expect(calculateKpiScore(75, 100, 50, 150, 'HIGHER_IS_BETTER')).toBe(50);
      expect(calculateKpiScore(50, 100, 50, 150, 'HIGHER_IS_BETTER')).toBe(0);
      expect(calculateKpiScore(125, 100, 50, 150, 'HIGHER_IS_BETTER')).toBe(100);
    });

    it('should calculate LOWER_IS_BETTER score correctly', () => {
      expect(calculateKpiScore(0, 0, 0, 60, 'LOWER_IS_BETTER')).toBe(100);
      expect(calculateKpiScore(30, 0, 0, 60, 'LOWER_IS_BETTER')).toBe(50);
      expect(calculateKpiScore(60, 0, 0, 60, 'LOWER_IS_BETTER')).toBe(0);
    });

    it('should calculate BOOLEAN score correctly', () => {
      expect(calculateKpiScore(1, 1, 0, 1, 'BOOLEAN')).toBe(100);
      expect(calculateKpiScore(0, 1, 0, 1, 'BOOLEAN')).toBe(0);
    });
  });

  describe('calculateWeightedKpiScore', () => {
    it('should calculate weighted average correctly', () => {
      const scores = [
        { score: 100, weight: 0.4 },
        { score: 80, weight: 0.3 },
        { score: 90, weight: 0.3 },
      ];
      expect(calculateWeightedKpiScore(scores)).toBe(91);
    });
  });
});
