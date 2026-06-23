import { AppError } from '@/lib/core/app-error';

/** Generate a prefixed, time-ordered, collision-resistant id for new rows. */
export function id(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Current date as an ISO `YYYY-MM-DD` string (UTC). */
export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Guard: reject anything that is not a real `YYYY-MM-DD` calendar date. */
export function assertIsoDate(value: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(new Date(`${value}T00:00:00Z`).getTime())) {
    throw new AppError('KPI_DATE_INVALID', 'Tanggal KPI tidak valid', 422);
  }
}
