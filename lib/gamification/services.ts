import { calculateRaiseProjection } from './performance-core';

export type BadgeCode = 'STREAK_7_DAYS' | 'STREAK_30_DAYS' | 'KPI_PERFECT_MONTH' | 'ZERO_ALPHA_QUARTER' | 'TOP_PERFORMER' | 'CONSISTENT_GOLD';

export const BADGE_RULES: Array<{ code: BadgeCode; name: string; qualifies: (metrics: BadgeMetrics) => boolean }> = [
  { code: 'STREAK_7_DAYS', name: 'Streak 7 Hari', qualifies: (metrics) => metrics.streakDays >= 7 },
  { code: 'STREAK_30_DAYS', name: 'Streak 30 Hari', qualifies: (metrics) => metrics.streakDays >= 30 },
  { code: 'KPI_PERFECT_MONTH', name: 'KPI Perfect Month', qualifies: (metrics) => metrics.kpiPerfectMonth },
  { code: 'ZERO_ALPHA_QUARTER', name: 'Zero Alpha Quarter', qualifies: (metrics) => metrics.zeroAlphaQuarter },
  { code: 'TOP_PERFORMER', name: 'Top Performer', qualifies: (metrics) => metrics.rankPercentile <= 10 },
  { code: 'CONSISTENT_GOLD', name: 'Consistent Gold', qualifies: (metrics) => metrics.goldMonths >= 6 },
];

export type BadgeMetrics = {
  streakDays: number;
  kpiPerfectMonth: boolean;
  zeroAlphaQuarter: boolean;
  rankPercentile: number;
  goldMonths: number;
};

export function buildBadgeAwards(input: { employeeId: string; existingBadgeCodes: string[]; metrics: BadgeMetrics }) {
  const existing = new Set(input.existingBadgeCodes);
  return BADGE_RULES
    .filter((rule) => !existing.has(rule.code) && rule.qualifies(input.metrics))
    .map((rule) => ({ employeeId: input.employeeId, code: rule.code, name: rule.name, notificationTitle: 'Badge performance baru' }));
}

export function transitionPerformancePeriod(currentStatus: string, nextStatus: 'ACTIVE' | 'CLOSED') {
  if (currentStatus === 'CLOSED') return { status: 'CLOSED', requiresAudit: true, correctionRequired: true };
  return { status: nextStatus, requiresAudit: true };
}

export function finalizeAnnualSummary(input: { periodStatus: string; averageScore: number; maintainedDays: number; baseSalary?: number | null }) {
  if (input.periodStatus !== 'CLOSED') throw new Error('PERIOD_NOT_CLOSED');
  const projection = calculateRaiseProjection(input);
  return {
    averageScore: input.averageScore,
    maintainedDays: input.maintainedDays,
    projectedRaisePercent: projection.raisePercent,
    projectedRaiseAmount: projection.projectedAmount,
    disclaimer: projection.disclaimer,
    finalPayrollCommitment: false,
  };
}
