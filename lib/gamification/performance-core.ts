export const GAMIFICATION_WEIGHT_INVALID = 'GAMIFICATION_WEIGHT_INVALID';
export const RAISE_PROJECTION_DISCLAIMER = 'Proyeksi ini bersifat estimasi dan dapat berubah sesuai kebijakan perusahaan.';
export const CULTURE_SCORE_LABEL = 'Culture & Discipline Score';
export const CULTURE_SCORE_LABEL_ID = 'Penilaian Perilaku Kerja';

export type GamificationWeights = { attendance: number; kpi: number; culture?: number; leader?: number };
export type ResolvedGamificationWeights = { attendance: number; kpi: number; culture: number; leader: number };
export type RaiseTier = { name: 'Platinum' | 'Gold' | 'Silver' | 'Bronze' | 'Standard'; minScore: number; requiredDays: number; raisePercent: number };
export type CultureSubcriteria = {
  cleanlinessScore?: number;
  disciplineScore?: number;
  punctualityBehaviorScore?: number;
  neatnessScore?: number;
  sopComplianceScore?: number;
  teamworkScore?: number;
  responsibilityScore?: number;
  attitudeScore?: number;
};

export const DEFAULT_GAMIFICATION_SETTINGS = {
  weights: { attendance: 30, kpi: 50, culture: 20, leader: 20 } satisfies ResolvedGamificationWeights,
  retroactiveLeaderScoreDays: 7,
  leaderScorePeriodType: 'MONTHLY',
  cultureScoreSuperadminPriority: true,
  cultureSubcriteriaEnabled: false,
  raiseTiers: [
    { name: 'Platinum', minScore: 100, requiredDays: 365, raisePercent: 10 },
    { name: 'Gold', minScore: 85, requiredDays: 365, raisePercent: 7 },
    { name: 'Silver', minScore: 75, requiredDays: 365, raisePercent: 5 },
    { name: 'Bronze', minScore: 65, requiredDays: 365, raisePercent: 3 },
    { name: 'Standard', minScore: 0, requiredDays: 0, raisePercent: 0 },
  ] satisfies RaiseTier[],
};

function clampScore(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function resolveGamificationWeights(weights: GamificationWeights): ResolvedGamificationWeights {
  const culture = weights.culture ?? weights.leader ?? 0;
  return { attendance: weights.attendance, kpi: weights.kpi, culture, leader: culture };
}

export function validateGamificationWeights(weights: GamificationWeights) {
  const resolved = resolveGamificationWeights(weights);
  const total = resolved.attendance + resolved.kpi + resolved.culture;
  if (total !== 100) throw new Error(GAMIFICATION_WEIGHT_INVALID);
  return resolved;
}

export function calculateCultureDisciplineScore(input: ({ score?: number; subcriteriaEnabled?: false } & CultureSubcriteria) | ({ subcriteriaEnabled: true } & CultureSubcriteria)) {
  if (!input.subcriteriaEnabled) return clampScore(input.score ?? 100);
  const values = [
    input.cleanlinessScore,
    input.disciplineScore,
    input.punctualityBehaviorScore,
    input.neatnessScore,
    input.sopComplianceScore,
    input.teamworkScore,
    input.responsibilityScore,
    input.attitudeScore,
  ].filter((value): value is number => typeof value === 'number');
  if (values.length === 0) return 100;
  return clampScore(values.reduce((sum, value) => sum + clampScore(value), 0) / values.length);
}

export function calculatePerformanceScore(input: {
  attendanceScore: number;
  kpiScore: number;
  leaderScore?: number;
  cultureScore?: number;
  weights?: GamificationWeights;
}) {
  const weights = validateGamificationWeights(input.weights ?? DEFAULT_GAMIFICATION_SETTINGS.weights);
  const attendance = clampScore(input.attendanceScore);
  const kpi = clampScore(input.kpiScore);
  const culture = clampScore(input.cultureScore ?? input.leaderScore ?? 100);
  const totalScore = clampScore((attendance * weights.attendance + kpi * weights.kpi + culture * weights.culture) / 100);
  return {
    totalScore,
    breakdown: {
      initialScore: 100,
      attendanceScore: attendance,
      kpiScore: kpi,
      cultureScore: culture,
      leaderScore: culture,
      weights,
      labels: {
        attendance: 'Attendance Score',
        kpi: 'KPI Produksi',
        culture: CULTURE_SCORE_LABEL_ID,
        legacyLeader: 'Leader Score (legacy alias)',
      },
    },
  };
}

export function calculateAttendanceScore(input: { workDays: number; presentDays: number; lateDays: number; absentDays: number }) {
  if (input.workDays <= 0) return 100;
  const presentRate = (input.presentDays / input.workDays) * 100;
  const latePenalty = input.lateDays * 1;
  const absentPenalty = input.absentDays * 5;
  return clampScore(presentRate - latePenalty - absentPenalty);
}

export function calculateKpiScore(items: Array<{ actual: number; target: number; weight: number }>) {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight <= 0) return 100;
  const weighted = items.reduce((sum, item) => {
    const ratio = item.target <= 0 ? 1 : item.actual / item.target;
    return sum + Math.min(100, ratio * 100) * item.weight;
  }, 0);
  return clampScore(weighted / totalWeight);
}

export function calculateLeaderScore(scores: number[]) {
  if (scores.length === 0) return 100;
  return clampScore(scores.reduce((sum, score) => sum + clampScore(score), 0) / scores.length);
}

export function detectCultureScoreAnomaly(input: { score: number; previousScore?: number | null }) {
  const anomalies: Array<'LOW_SCORE' | 'SCORE_DELTA'> = [];
  if (input.score < 40) anomalies.push('LOW_SCORE');
  if (typeof input.previousScore === 'number' && Math.abs(input.score - input.previousScore) > 30) anomalies.push('SCORE_DELTA');
  return anomalies;
}

export const detectLeaderScoreAnomaly = detectCultureScoreAnomaly;

export function resolveFinalCultureScore(input: { leaderScore?: number; superadminScore?: number; superadminPriority?: boolean }) {
  const superadminPriority = input.superadminPriority ?? true;
  if (superadminPriority && typeof input.superadminScore === 'number') return { finalScore: clampScore(input.superadminScore), source: 'SUPERADMIN' as const };
  if (typeof input.leaderScore === 'number') return { finalScore: clampScore(input.leaderScore), source: 'LEADER' as const };
  if (typeof input.superadminScore === 'number') return { finalScore: clampScore(input.superadminScore), source: 'SUPERADMIN' as const };
  return { finalScore: 100, source: 'BASELINE' as const };
}

export function mapRaiseTier(score: number, maintainedDays: number, tiers = DEFAULT_GAMIFICATION_SETTINGS.raiseTiers) {
  const tier = tiers
    .toSorted((a, b) => b.minScore - a.minScore)
    .find((candidate) => score >= candidate.minScore && maintainedDays >= candidate.requiredDays);
  return tier ? { ...tier, disclaimer: RAISE_PROJECTION_DISCLAIMER } : undefined;
}

export function getInitialPerformanceScore(input: { isActive: boolean; role: string }) {
  const eligible = input.isActive && ['EMPLOYEE', 'LEADER'].includes(input.role);
  const baseline = eligible ? 100 : 0;
  return calculatePerformanceScore({ attendanceScore: baseline, kpiScore: baseline, cultureScore: baseline });
}

export function calculateRaiseProjection(input: {
  averageScore: number;
  maintainedDays: number;
  baseSalary?: number | null;
  tiers?: RaiseTier[];
}) {
  const tier = mapRaiseTier(input.averageScore, input.maintainedDays, input.tiers ?? DEFAULT_GAMIFICATION_SETTINGS.raiseTiers);
  const raisePercent = tier?.raisePercent ?? 0;
  if (!input.baseSalary || input.baseSalary <= 0) {
    return {
      tier: tier?.name ?? 'Standard',
      raisePercent,
      projectedAmount: null,
      projectedSalary: null,
      message: 'Data gaji belum tersedia.',
      disclaimer: RAISE_PROJECTION_DISCLAIMER,
      finalPayrollCommitment: false,
    };
  }
  const projectedAmount = Math.round(input.baseSalary * (raisePercent / 100));
  return {
    tier: tier?.name ?? 'Standard',
    raisePercent,
    projectedAmount,
    projectedSalary: input.baseSalary + projectedAmount,
    message: `${raisePercent}% estimasi kenaikan berdasarkan performa.`,
    disclaimer: RAISE_PROJECTION_DISCLAIMER,
    finalPayrollCommitment: false,
  };
}

export function validateRetroactiveScoreDate(scoreDate: string, allowedDays: number, now = new Date()) {
  const parsed = new Date(`${scoreDate}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return false;
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const diffDays = Math.floor((today.getTime() - parsed.getTime()) / 86_400_000);
  return diffDays >= 0 && diffDays <= allowedDays;
}

const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const DEFAULT_THEME = { primaryColor: '#f6c343', secondaryColor: '#111827', accentColor: '#dc2626' };

function normalizeHex(value: string | undefined, fallback: string) {
  if (!value) return fallback;
  const full = value.length === 4 ? `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}` : value;
  if (!HEX_COLOR.test(full)) throw new Error('THEME_COLOR_INVALID');
  return full.toLowerCase();
}

function luminance(hex: string) {
  const rgb = [1, 3, 5].map((idx) => parseInt(hex.slice(idx, idx + 2), 16) / 255).map((channel) => (
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  ));
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

function contrast(a: string, b: string) {
  const light = Math.max(luminance(a), luminance(b));
  const dark = Math.min(luminance(a), luminance(b));
  return (light + 0.05) / (dark + 0.05);
}

export function sanitizeThemeInput(input: { primaryColor?: string; secondaryColor?: string; accentColor?: string }) {
  const theme = {
    primaryColor: normalizeHex(input.primaryColor, DEFAULT_THEME.primaryColor),
    secondaryColor: normalizeHex(input.secondaryColor, DEFAULT_THEME.secondaryColor),
    accentColor: normalizeHex(input.accentColor, DEFAULT_THEME.accentColor),
  };
  if (contrast(theme.primaryColor, theme.secondaryColor) < 4.5) throw new Error('THEME_CONTRAST_INVALID');
  return {
    ...theme,
    tokens: {
      '--color-primary': theme.primaryColor,
      '--color-secondary': theme.secondaryColor,
      '--color-accent': theme.accentColor,
    },
  };
}
