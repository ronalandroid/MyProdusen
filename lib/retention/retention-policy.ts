/**
 * Data-retention policy (kebijakan owner #30): foto selfie absensi disimpan
 * maksimal 6 bulan lalu dihapus (data biometrik-ish, privasi + hemat storage
 * VPS tunggal); log audit disimpan 1 tahun. Kehadiran & data lain TETAP —
 * hanya file selfie yang dipurge dan baris log lama yang dihapus.
 */

export const SELFIE_RETENTION_MONTHS = 6;
export const AUDIT_LOG_RETENTION_MONTHS = 12;

/** Marker written into the NOT-NULL selfie column once its file is purged. */
export const RETENTION_PURGED_MARKER = '__retention_purged__';

/** Safety cap so a single sweep can never hammer the single-VPS disk/DB. */
export const DEFAULT_SWEEP_BATCH = 500;
export const MAX_SWEEP_BATCH = 5000;

export interface RetentionCutoffs {
  selfieCutoff: Date;
  auditCutoff: Date;
}

function subMonths(date: Date, months: number): Date {
  const out = new Date(date);
  out.setMonth(out.getMonth() - months);
  return out;
}

export function retentionCutoffs(now: Date = new Date()): RetentionCutoffs {
  return {
    selfieCutoff: subMonths(now, SELFIE_RETENTION_MONTHS),
    auditCutoff: subMonths(now, AUDIT_LOG_RETENTION_MONTHS),
  };
}

export function clampBatch(requested?: number): number {
  if (!Number.isFinite(requested as number)) return DEFAULT_SWEEP_BATCH;
  return Math.min(Math.max(Math.floor(requested as number), 1), MAX_SWEEP_BATCH);
}
