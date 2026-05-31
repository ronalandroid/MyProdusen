import { describe, expect, it } from 'vitest';
import {
  calculateCultureDisciplineScore,
  calculatePerformanceScore,
  detectCultureScoreAnomaly,
  resolveGamificationWeights,
  resolveFinalCultureScore,
  validateGamificationWeights,
  GAMIFICATION_WEIGHT_INVALID,
} from '@/lib/gamification/performance-core';

describe('Culture & Discipline Score gamification model', () => {
  it('uses culture weight alias before legacy leader weight', () => {
    expect(resolveGamificationWeights({ attendance: 30, kpi: 50, culture: 20, leader: 10 })).toEqual({ attendance: 30, kpi: 50, culture: 20, leader: 20 });
    expect(resolveGamificationWeights({ attendance: 30, kpi: 50, leader: 20 })).toEqual({ attendance: 30, kpi: 50, culture: 20, leader: 20 });
  });

  it('rejects invalid culture total weight', () => {
    expect(() => validateGamificationWeights({ attendance: 30, kpi: 50, culture: 10 })).toThrow(GAMIFICATION_WEIGHT_INVALID);
  });

  it('contributes culture score as 20 percent of total score', () => {
    const result = calculatePerformanceScore({ attendanceScore: 100, kpiScore: 80, cultureScore: 50, weights: { attendance: 30, kpi: 50, culture: 20 } });
    expect(result.totalScore).toBe(80);
    expect(result.breakdown.cultureScore).toBe(50);
    expect(result.breakdown.labels.culture).toBe('Penilaian Perilaku Kerja');
  });

  it('averages advanced subcriteria when enabled', () => {
    expect(calculateCultureDisciplineScore({ subcriteriaEnabled: true, cleanlinessScore: 80, disciplineScore: 90, punctualityBehaviorScore: 70, neatnessScore: 80, sopComplianceScore: 90, teamworkScore: 70, responsibilityScore: 80 })).toBe(80);
  });

  it('superadmin score has final priority over leader recommendation by default', () => {
    expect(resolveFinalCultureScore({ leaderScore: 60, superadminScore: 95 }).finalScore).toBe(95);
    expect(resolveFinalCultureScore({ leaderScore: 60, superadminScore: undefined }).finalScore).toBe(60);
  });

  it('detects culture anomalies for low score and delta', () => {
    expect(detectCultureScoreAnomaly({ score: 35 })).toContain('LOW_SCORE');
    expect(detectCultureScoreAnomaly({ score: 80, previousScore: 45 })).toContain('SCORE_DELTA');
  });
});
