import { describe, expect, it } from 'vitest';
import { buildBadgeAwards, finalizeAnnualSummary, transitionPerformancePeriod } from '@/lib/gamification/services';

describe('gamification badge and period services', () => {
  it('awards badges idempotently without duplicates', () => {
    const awards = buildBadgeAwards({
      employeeId: 'emp-1',
      existingBadgeCodes: ['STREAK_7_DAYS'],
      metrics: { streakDays: 30, kpiPerfectMonth: true, zeroAlphaQuarter: true, rankPercentile: 5, goldMonths: 6 },
    });
    expect(awards.map((award) => award.code)).toEqual(['STREAK_30_DAYS', 'KPI_PERFECT_MONTH', 'ZERO_ALPHA_QUARTER', 'TOP_PERFORMER', 'CONSISTENT_GOLD']);
  });

  it('activates one period and closes/finalizes with audit intent', () => {
    expect(transitionPerformancePeriod('DRAFT', 'ACTIVE')).toEqual({ status: 'ACTIVE', requiresAudit: true });
    expect(transitionPerformancePeriod('ACTIVE', 'CLOSED')).toEqual({ status: 'CLOSED', requiresAudit: true });
    expect(transitionPerformancePeriod('CLOSED', 'ACTIVE')).toEqual({ status: 'CLOSED', requiresAudit: true, correctionRequired: true });
  });

  it('finalizes annual summary only on closed period', () => {
    expect(finalizeAnnualSummary({ periodStatus: 'CLOSED', averageScore: 100, maintainedDays: 365, baseSalary: 4_000_000 }).projectedRaisePercent).toBe(10);
    expect(() => finalizeAnnualSummary({ periodStatus: 'ACTIVE', averageScore: 100, maintainedDays: 365, baseSalary: 4_000_000 })).toThrow('PERIOD_NOT_CLOSED');
  });
});
