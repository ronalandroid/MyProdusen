import { describe, expect, it } from 'vitest';
import {
  DEFAULT_GAMIFICATION_SETTINGS,
  GAMIFICATION_WEIGHT_INVALID,
  calculateAttendanceScore,
  calculateKpiScore,
  calculateLeaderScore,
  calculatePerformanceScore,
  detectLeaderScoreAnomaly,
  mapRaiseTier,
  sanitizeThemeInput,
  validateGamificationWeights,
} from '@/lib/gamification/performance-core';

describe('gamification performance core', () => {
  it('starts new active employees and leaders at score 100', () => {
    const score = calculatePerformanceScore({ attendanceScore: 100, kpiScore: 100, leaderScore: 100 });
    expect(score.totalScore).toBe(100);
    expect(score.breakdown.initialScore).toBe(100);
  });

  it('projects +10% raise when score 100 is maintained for 365 days', () => {
    const tier = mapRaiseTier(100, 365, DEFAULT_GAMIFICATION_SETTINGS.raiseTiers);
    expect(tier?.name).toBe('Platinum');
    expect(tier?.raisePercent).toBe(10);
    expect(tier?.disclaimer).toBe('Proyeksi ini bersifat estimasi dan dapat berubah sesuai kebijakan perusahaan.');
  });

  it('calculates attendance score from present and late days', () => {
    expect(calculateAttendanceScore({ workDays: 20, presentDays: 18, lateDays: 2, absentDays: 0 })).toBe(88);
  });

  it('calculates KPI score as capped weighted average', () => {
    expect(calculateKpiScore([{ actual: 120, target: 100, weight: 2 }, { actual: 40, target: 50, weight: 1 }])).toBe(93);
  });

  it('calculates leader score as average 0-100', () => {
    expect(calculateLeaderScore([80, 100, 90])).toBe(90);
  });

  it('requires total score weights to equal 100', () => {
    expect(() => validateGamificationWeights({ attendance: 30, kpi: 40, leader: 20 })).toThrow(GAMIFICATION_WEIGHT_INVALID);
  });

  it('creates anomaly for leader score below 40', () => {
    expect(detectLeaderScoreAnomaly({ score: 39, previousScore: 80 })).toContain('LOW_SCORE');
  });

  it('creates anomaly for leader score delta above 30', () => {
    expect(detectLeaderScoreAnomaly({ score: 95, previousScore: 60 })).toContain('SCORE_DELTA');
  });

  it('maps raise tiers', () => {
    expect(mapRaiseTier(86, 365, DEFAULT_GAMIFICATION_SETTINGS.raiseTiers)?.name).toBe('Gold');
  });

  it('accepts valid theme color and rejects unsafe contrast', () => {
    expect(sanitizeThemeInput({ primaryColor: '#f6c343', secondaryColor: '#111827', accentColor: '#dc2626' }).primaryColor).toBe('#f6c343');
    expect(() => sanitizeThemeInput({ primaryColor: '#ffffff', secondaryColor: '#fffffe', accentColor: '#fff' })).toThrow('THEME_CONTRAST_INVALID');
  });
});
