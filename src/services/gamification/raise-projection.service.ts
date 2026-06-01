export type RaiseProjectionFormula = 'LINEAR_SCORE_DIV_10';

export function calculateProjectedRaisePercent(annualScore: number, options: { formula?: RaiseProjectionFormula } = {}) {
  const score = Math.min(100, Math.max(0, annualScore || 0));
  return Math.round((score / 10) * 100) / 100;
}

export function buildRaiseProjectionCopy(projectedRaisePercent: number) {
  return `Estimasi kenaikan: ${projectedRaisePercent}%. Proyeksi kenaikan ini bersifat estimasi dan tetap membutuhkan persetujuan perusahaan.`;
}
