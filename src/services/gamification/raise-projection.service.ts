export type RaiseProjectionFormula = 'LINEAR_SCORE_DIV_10' | 'TIERED';

export function calculateProjectedRaisePercent(annualScore: number, options: { maxRaisePercent?: number; formula?: RaiseProjectionFormula } = {}) {
  const maxRaisePercent = options.maxRaisePercent ?? 10;
  const score = Math.min(100, Math.max(0, annualScore || 0));
  if (options.formula === 'TIERED') {
    if (score >= 90) return maxRaisePercent;
    if (score >= 80) return Math.round(maxRaisePercent * 0.8 * 100) / 100;
    if (score >= 60) return Math.round(maxRaisePercent * 0.6 * 100) / 100;
    return 0;
  }
  return Math.round((score / 100) * maxRaisePercent * 100) / 100;
}

export function buildRaiseProjectionCopy(projectedRaisePercent: number) {
  return `Estimasi kenaikan: ${projectedRaisePercent}%. Proyeksi kenaikan ini bersifat estimasi dan tetap membutuhkan persetujuan perusahaan.`;
}
