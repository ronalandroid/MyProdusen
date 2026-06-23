import { describe, it, expect } from 'vitest';
import {
  calculateIntegratedKpiScore,
  calculateKpiScore,
  calculateWeightedKpiScore,
  summarizeKpiResults,
  type KpiScoringType,
} from './kpi';

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

    it('returns 0 for an unknown scoring type', () => {
      expect(calculateKpiScore(50, 100, 0, 150, 'WEIRD' as KpiScoringType)).toBe(0);
    });
  });

  describe('summarizeKpiResults', () => {
    it('returns all zeros for no results', () => {
      expect(summarizeKpiResults([])).toEqual({
        totalScore: 0,
        weightedScore: 0,
        itemCount: 0,
        approvedCount: 0,
      });
    });

    it('computes plain and weighted averages and counts approvals', () => {
      const summary = summarizeKpiResults([
        { result: { score: 80, isApproved: true }, item: { weight: 1 } },
        { result: { score: 100, isApproved: false }, item: { weight: 3 } },
      ]);
      expect(summary.totalScore).toBe(90); // (80 + 100) / 2
      expect(summary.weightedScore).toBe(95); // (80*1 + 100*3) / 4
      expect(summary.itemCount).toBe(2);
      expect(summary.approvedCount).toBe(1);
    });

    it('excludes results with a missing item from the weighted score only', () => {
      const summary = summarizeKpiResults([
        { result: { score: 50, isApproved: true }, item: null },
        { result: { score: 70, isApproved: true }, item: { weight: 2 } },
      ]);
      expect(summary.totalScore).toBe(60); // (50 + 70) / 2 — both count
      expect(summary.weightedScore).toBe(70); // only the weighted item
      expect(summary.approvedCount).toBe(2);
    });

    it('weightedScore is 0 when no result has an item', () => {
      const summary = summarizeKpiResults([
        { result: { score: 40, isApproved: false }, item: null },
      ]);
      expect(summary.totalScore).toBe(40);
      expect(summary.weightedScore).toBe(0);
      expect(summary.itemCount).toBe(1);
      expect(summary.approvedCount).toBe(0);
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

    it('returns 0 for an empty score list', () => {
      expect(calculateWeightedKpiScore([])).toBe(0);
    });
  });

  describe('calculateIntegratedKpiScore', () => {
    it('uses attendance/production/discipline weights 30/50/20', () => {
      expect(calculateIntegratedKpiScore({ attendanceScore: 80, productionScore: 100, disciplineScore: 50 })).toBe(84);
    });
  });
});
