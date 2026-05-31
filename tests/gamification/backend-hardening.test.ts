import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  DEFAULT_GAMIFICATION_SETTINGS,
  calculateRaiseProjection,
  getInitialPerformanceScore,
  validateRetroactiveScoreDate,
} from '@/lib/gamification/performance-core';

describe('gamification backend hardening', () => {
  it('creates active employee/leader baseline score 100', () => {
    expect(getInitialPerformanceScore({ isActive: true, role: 'EMPLOYEE' }).totalScore).toBe(100);
    expect(getInitialPerformanceScore({ isActive: true, role: 'LEADER' }).totalScore).toBe(100);
  });

  it('returns +10 projection and amount when 100 score maintained 365 days with salary', () => {
    const projection = calculateRaiseProjection({ averageScore: 100, maintainedDays: 365, baseSalary: 5_000_000, tiers: DEFAULT_GAMIFICATION_SETTINGS.raiseTiers });
    expect(projection.raisePercent).toBe(10);
    expect(projection.projectedAmount).toBe(500_000);
    expect(projection.message).toContain('estimasi');
  });

  it('returns missing salary message without writing final projection', () => {
    expect(calculateRaiseProjection({ averageScore: 100, maintainedDays: 365, baseSalary: null, tiers: DEFAULT_GAMIFICATION_SETTINGS.raiseTiers }).message).toBe('Data gaji belum tersedia.');
  });

  it('rejects retroactive leader score outside configured days', () => {
    const now = new Date('2026-05-31T00:00:00Z');
    expect(validateRetroactiveScoreDate('2026-05-24', 7, now)).toBe(true);
    expect(validateRetroactiveScoreDate('2026-05-23', 7, now)).toBe(false);
  });

  it('migration enforces active period and summary/snapshot uniqueness', () => {
    const migration = readFileSync(join(process.cwd(), 'drizzle/migrations/0026_gamification_constraints_settings.sql'), 'utf8');
    expect(migration).toContain('PerformancePeriod_one_active_idx');
    expect(migration).toContain('PerformanceScoreSnapshot_employee_period_month_idx');
    expect(migration).toContain('PerformanceScoreSummary_employee_period_idx');
    expect(migration).toContain('GAMIFICATION_CONFIG');
  });
});
