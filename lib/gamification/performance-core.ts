export const GAMIFICATION_WEIGHT_INVALID = 'GAMIFICATION_WEIGHT_INVALID';
export const RAISE_PROJECTION_DISCLAIMER = 'Proyeksi ini bersifat estimasi dan dapat berubah sesuai kebijakan perusahaan.';

export type GamificationWeights = { attendance: number; kpi: number; leader: number };
export type RaiseTier = { name: 'Platinum' | 'Gold' | 'Silver' | 'Bronze' | 'Standard'; minScore: number; requiredDays: number; raisePercent: number };

export const DEFAULT_GAMIFICATION_SETTINGS = {
  weights: { attendance: 30, kpi: 50, leader: 20 } satisfies GamificationWeights,
  retroactiveLeaderScoreDays: 7,
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

export function validateGamificationWeights(weights: GamificationWeights) {
  const total = weights.attendance + weights.kpi + weights.leader;
  if (total !== 100) throw new Error(GAMIFICATION_WEIGHT_INVALID);
  return weights;
}

export function calculatePerformanceScore(input: {
  attendanceScore: number;
  kpiScore: number;
  leaderScore: number;
  weights?: GamificationWeights;
}) {
  const weights = validateGamificationWeights(input.weights ?? DEFAULT_GAMIFICATION_SETTINGS.weights);
  const attendance = clampScore(input.attendanceScore);
  const kpi = clampScore(input.kpiScore);
  const leader = clampScore(input.leaderScore);
  const totalScore = clampScore((attendance * weights.attendance + kpi * weights.kpi + leader * weights.leader) / 100);
  return {
    totalScore,
    breakdown: {
      initialScore: 100,
      attendanceScore: attendance,
      kpiScore: kpi,
      leaderScore: leader,
      weights,
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

export function detectLeaderScoreAnomaly(input: { score: number; previousScore?: number | null }) {
  const anomalies: Array<'LOW_SCORE' | 'SCORE_DELTA'> = [];
  if (input.score < 40) anomalies.push('LOW_SCORE');
  if (typeof input.previousScore === 'number' && Math.abs(input.score - input.previousScore) > 30) anomalies.push('SCORE_DELTA');
  return anomalies;
}

export function mapRaiseTier(score: number, maintainedDays: number, tiers = DEFAULT_GAMIFICATION_SETTINGS.raiseTiers) {
  const tier = [...tiers]
    .sort((a, b) => b.minScore - a.minScore)
    .find((candidate) => score >= candidate.minScore && maintainedDays >= candidate.requiredDays);
  return tier ? { ...tier, disclaimer: RAISE_PROJECTION_DISCLAIMER } : undefined;
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
